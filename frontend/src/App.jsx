import { useState, useEffect } from 'react'
import Shell from './components/Shell.jsx'
import ConnectStore from './components/ConnectStore.jsx'
import Dashboard from './components/Dashboard.jsx'
import Simulate from './components/Simulate.jsx'
import BeforeAfter from './components/BeforeAfter.jsx'

export default function App() {
  const [view, setView] = useState('dashboard')
  const [storeData, setStoreData] = useState(null)   // { domain, accessToken, productCount }
  const [auditData, setAuditData] = useState(null)   // full audit result object

  // Load mock audit data on mount so dashboard works immediately
  useEffect(() => {
    fetch('/api/audit')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(d => setAuditData(d))
      .catch(err => console.error('Failed to load mock audit:', err.message))
  }, [])

  const renderView = () => {
    switch (view) {
      case 'connect':
        return (
          <ConnectStore
            storeData={storeData}
            setStoreData={setStoreData}
            setAuditData={setAuditData}
            setView={setView}
          />
        )
      case 'dashboard':
        return (
          <Dashboard
            auditData={auditData}
            storeData={storeData}
            setAuditData={setAuditData}
            storeCredentials={storeData}
          />
        )
      case 'simulate':
        return (
          <Simulate storeData={storeData} />
        )
      case 'beforeafter':
        return (
          <BeforeAfter />
        )
      default:
        return null
    }
  }

  return (
    <Shell view={view} setView={setView} storeData={storeData}>
      {renderView()}
    </Shell>
  )
}
