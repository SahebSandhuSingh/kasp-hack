import { useState, useEffect } from 'react'
import Shell from './components/Shell.jsx'
import ConnectStore from './components/ConnectStore.jsx'
import Dashboard from './components/Dashboard.jsx'
import ProductTable from './components/ProductTable.jsx'
import BeforeAfter from './components/BeforeAfter.jsx'
import Simulate from './components/Simulate.jsx'
import AIPerception from './components/AIPerception.jsx'
import ActionPlan from './components/ActionPlan.jsx'

export default function App() {
  const [view, setView] = useState('dashboard')
  const [storeData, setStoreData] = useState(null) // null = not connected
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [products, setProducts] = useState([])
  const [checkingSession, setCheckingSession] = useState(true)
  const [sessionMessage, setSessionMessage] = useState(null)

  useEffect(() => {
    fetch('/api/auth/session', { credentials: 'include' })
      .then(r => r.ok ? r.json() : { connected: false })
      .then(data => {
        if (data.connected) {
          setStoreData({
            domain: data.shop.domain,
            name: data.shop.name,
            planName: data.shop.plan_name,
            connectedAt: data.shop.connected_at,
            scopeStatus: data.scope_status,
            hasWriteAccess: data.has_write_access,
          })
        }
      })
      .catch(() => setStoreData(null))
      .finally(() => setCheckingSession(false))
  }, [])

  const handleSessionExpired = () => {
    setStoreData(null)
    setSelectedProduct(null)
    setProducts([])
    setSessionMessage('Your session expired. Please reconnect your store.')
    setView('dashboard')
  }

  useEffect(() => {
    if (!storeData) return
    fetch('/api/audit', { credentials: 'include' })
      .then(r => {
        if (r.status === 401) {
          handleSessionExpired()
          return { products: [] }
        }
        return r.ok ? r.json() : { products: [] }
      })
      .then(data => setProducts(data.products || []))
      .catch(() => setProducts([]))
  }, [storeData])

  // Allow child components to refresh product list after mutations
  useEffect(() => {
    window.__refreshProducts = (newProducts) => setProducts(newProducts)
    return () => { delete window.__refreshProducts }
  }, [])

  // Called when ConnectStore succeeds
  const handleConnected = (data) => {
    setStoreData(data)
    setSessionMessage(null)
    setView('dashboard')
  }

  // Called when scope warning is dismissed in read-only mode
  const handleContinueReadOnly = () => {
    setView('dashboard')
  }

  // Called when user clicks "Disconnect store"
  const handleDisconnect = async () => {
    await fetch('/api/auth/disconnect', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => null)
    setStoreData(null)
    setSelectedProduct(null)
    setProducts([])
    setView('dashboard')
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-shopify-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.png" alt="AI Rep Optimizer Logo" className="w-10 h-10 rounded-lg shadow-card object-cover" />
          <svg className="animate-spin w-7 h-7 text-shopify-green" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <p className="text-sm font-semibold text-shopify-text">AI Rep Optimizer</p>
        </div>
      </div>
    )
  }

  // If no store connected, show the onboarding screen (no Shell)
  if (!storeData) {
    return <ConnectStore onConnected={handleConnected} message={sessionMessage} />
  }

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard setView={setView} setSelectedProduct={setSelectedProduct} storeData={storeData} />
      case 'products':
        return <ProductTable setView={setView} setSelectedProduct={setSelectedProduct} products={products} />
      case 'perception':
        return <AIPerception storeData={storeData} products={products} setView={setView} />
      case 'beforeafter':
        return <BeforeAfter selectedProduct={selectedProduct} storeData={storeData} setView={setView} products={products} />
      case 'actionplan':
        return <ActionPlan storeData={storeData} products={products} setView={setView} setSelectedProduct={setSelectedProduct} />
      case 'simulate':
        return <Simulate products={products} />
      default:
        return <Dashboard setView={setView} setSelectedProduct={setSelectedProduct} />
    }
  }

  return (
    <Shell view={view} setView={setView} storeData={storeData} onDisconnect={handleDisconnect}>
      {renderView()}
    </Shell>
  )
}
