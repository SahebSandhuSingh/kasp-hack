import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Shell from './components/Shell.jsx'
import ConnectStore from './components/ConnectStore.jsx'
import Dashboard from './components/Dashboard.jsx'
import ProductTable from './components/ProductTable.jsx'
import BeforeAfter from './components/BeforeAfter.jsx'
import Simulate from './components/Simulate.jsx'
import ActionPlan from './components/ActionPlan.jsx'
import LandingPage from './components/LandingPage.jsx'

function AppLoadingScreen() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F8F9FA',
      gap: '16px'
    }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid #E5E7EB',
        borderTop: '3px solid #008060',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <span style={{ color: '#4B5563', fontSize: 14 }}>
        Loading Visibly...
      </span>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  const [connected, setConnected] = useState(null)
  const [storeData, setStoreData] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [products, setProducts] = useState([])
  const [sessionMessage, setSessionMessage] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/auth/session', { credentials: 'include' })
      .then(r => r.ok ? r.json() : { connected: false })
      .then(data => {
        setConnected(data.connected)
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
      .catch(() => setConnected(false))
  }, [])

  const handleSessionExpired = () => {
    setStoreData(null)
    setSelectedProduct(null)
    setProducts([])
    setSessionMessage('Your session expired. Please reconnect your store.')
    setConnected(false)
    navigate('/connect')
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

  const handleConnected = (data) => {
    setStoreData(data)
    setSessionMessage(null)
    setConnected(true)
    navigate('/app/overview')
  }

  const handleDisconnect = async () => {
    await fetch('/api/auth/disconnect', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => null)
    setStoreData(null)
    setSelectedProduct(null)
    setProducts([])
    setConnected(false)
    navigate('/connect')
  }

  if (connected === null) return <AppLoadingScreen />;

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/connect"
        element={
          connected
            ? <Navigate to="/app/overview" replace />
            : <ConnectStore onConnected={handleConnected} message={sessionMessage} />
        }
      />
      <Route
        path="/app/*"
        element={
          connected
            ? (
              <Shell storeData={storeData} onDisconnect={handleDisconnect}>
                <Routes>
                  <Route index element={<Navigate to="overview" replace />} />
                  <Route path="overview" element={<Dashboard storeData={storeData} setSelectedProduct={setSelectedProduct} />} />
                  <Route path="products" element={<ProductTable products={products} setSelectedProduct={setSelectedProduct} />} />
                  <Route path="optimize" element={<BeforeAfter products={products} selectedProduct={selectedProduct} storeData={storeData} />} />
                  <Route path="simulate" element={<Simulate products={products} />} />
                  <Route path="analytics" element={<ActionPlan products={products} storeData={storeData} setSelectedProduct={setSelectedProduct} />} />
                  <Route path="*" element={<Navigate to="overview" replace />} />
                </Routes>
              </Shell>
            )
            : <Navigate to="/connect" replace />
        }
      />
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
