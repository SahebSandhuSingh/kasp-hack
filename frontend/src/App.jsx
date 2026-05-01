import { useState, useEffect } from 'react'
import Shell from './components/Shell.jsx'
import ConnectStore from './components/ConnectStore.jsx'
import Dashboard from './components/Dashboard.jsx'
import ProductTable from './components/ProductTable.jsx'
import BeforeAfter from './components/BeforeAfter.jsx'
import Simulate from './components/Simulate.jsx'
import Analytics from './components/Analytics.jsx'

export default function App() {
  const [view, setView] = useState('dashboard')
  const [storeData, setStoreData] = useState(null) // null = not connected
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetch('/api/audit')
      .then(r => r.ok ? r.json() : { products: [] })
      .then(data => setProducts(data.products || []))
      .catch(() => setProducts([]))
  }, [storeData])

  // Called when ConnectStore succeeds
  const handleConnected = (data) => {
    setStoreData(data)
    setView('dashboard')
  }

  // Called when scope warning is dismissed in read-only mode
  const handleContinueReadOnly = () => {
    setView('dashboard')
  }

  // Called when user clicks "Disconnect store"
  const handleDisconnect = () => {
    setStoreData(null)
    setSelectedProduct(null)
    setView('dashboard')
  }

  // If no store connected, show the onboarding screen (no Shell)
  if (!storeData) {
    return <ConnectStore onConnected={handleConnected} />
  }

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard setView={setView} setSelectedProduct={setSelectedProduct} storeData={storeData} />
      case 'products':
        return <ProductTable setView={setView} setSelectedProduct={setSelectedProduct} products={products} />
      case 'beforeafter':
        return <BeforeAfter selectedProduct={selectedProduct} storeData={storeData} setView={setView} products={products} />
      case 'simulate':
        return <Simulate products={products} />
      case 'analytics':
        return <Analytics storeData={storeData} setView={setView} />
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
