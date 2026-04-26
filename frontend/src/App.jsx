import { useState, useEffect, useCallback } from 'react'
import Layout from './components/Layout'
import MerchantDashboard from './components/MerchantDashboard'
import DiagnosticCard from './components/DiagnosticCard'
import FixPreview from './components/FixPreview'
import Proof from './components/Proof'
import Impact from './components/Impact'
import StoreHealth from './components/StoreHealth'

const FOCUS_PRODUCT_ID = 'p7'
const DEFAULT_QUERY = 'best protein bar under ₹500 with free returns'

export default function App() {
  const [currentStep, setCurrentStep] = useState(1)
  const [maxReached, setMaxReached] = useState(1)
  const [selectedProductId, setSelectedProductId] = useState(FOCUS_PRODUCT_ID)

  // Shared state across screens
  const [simulationResult, setSimulationResult] = useState(null)
  const [rerunResult, setRerunResult] = useState(null)
  const [auditData, setAuditData] = useState(null)

  const [loadingSimulate, setLoadingSimulate] = useState(false)
  const [loadingRerun, setLoadingRerun] = useState(false)
  const [loadingAudit, setLoadingAudit] = useState(true)
  const [error, setError] = useState(null)

  // Fetch audit data on mount
  useEffect(() => {
    fetch('/api/audit')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(d => { setAuditData(d); setLoadingAudit(false) })
      .catch(e => { setError(e.message); setLoadingAudit(false) })
  }, [])

  const goToStep = useCallback((step) => {
    setCurrentStep(step)
    setMaxReached(prev => Math.max(prev, step))
  }, [])

  const runSimulation = useCallback(async (query) => {
    setLoadingSimulate(true)
    setError(null)
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setSimulationResult(data)
      setLoadingSimulate(false)
      return data
    } catch (e) {
      setError(e.message)
      setLoadingSimulate(false)
      throw e
    }
  }, [])

  const runRerun = useCallback(async () => {
    setLoadingRerun(true)
    setError(null)
    try {
      const res = await fetch('/api/rerun', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setRerunResult(data)
      setLoadingRerun(false)
      return data
    } catch (e) {
      setError(e.message)
      setLoadingRerun(false)
      throw e
    }
  }, [])

  // Find the focus product in various data sources
  const focusProductFromSim = simulationResult?.rejected?.find(p => p.id === selectedProductId)
    || simulationResult?.selected?.find(p => p.id === selectedProductId)

  const focusProductFromAudit = auditData?.products?.find(p => p.id === selectedProductId)

  const renderScreen = () => {
    switch (currentStep) {
      case 1:
        return (
          <MerchantDashboard
            auditData={auditData}
            loading={loadingAudit}
            onFixProduct={(id) => {
              setSelectedProductId(id)
              goToStep(2)
            }}
          />
        )
      case 2:
        return (
          <DiagnosticCard
            focusProduct={focusProductFromSim}
            auditProduct={focusProductFromAudit}
            simulationResult={simulationResult}
            onNext={() => goToStep(3)}
            onBack={() => goToStep(1)}
          />
        )
      case 3:
        return (
          <FixPreview
            rerunResult={rerunResult}
            loading={loadingRerun}
            onRunRerun={runRerun}
            onNext={() => goToStep(4)}
            onBack={() => goToStep(2)}
          />
        )
      case 4:
        return (
          <Proof
            rerunResult={rerunResult}
            onNext={() => goToStep(5)}
            onBack={() => goToStep(3)}
          />
        )
      case 5:
        return (
          <Impact
            rerunResult={rerunResult}
            auditProduct={focusProductFromAudit}
            onNext={() => goToStep(6)}
            onBack={() => goToStep(4)}
          />
        )
      case 6:
        return (
          <StoreHealth
            data={auditData}
            loading={loadingAudit}
            onBack={() => goToStep(5)}
          />
        )
      default:
        return null
    }
  }

  return (
    <Layout
      currentStep={currentStep}
      onStepClick={(step) => { if (step <= maxReached) setCurrentStep(step) }}
      maxReached={maxReached}
    >
      {renderScreen()}
    </Layout>
  )
}
