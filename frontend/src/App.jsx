import { useState } from 'react'
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

  // Called when ConnectStore succeeds
  const handleConnected = (data) => {
    setStoreData(data)
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
        return <Dashboard setView={setView} setSelectedProduct={setSelectedProduct} />
      case 'products':
        return <ProductTable setView={setView} setSelectedProduct={setSelectedProduct} />
      case 'beforeafter':
        return <BeforeAfter selectedProduct={selectedProduct} />
      case 'simulate':
        return <Simulate />
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
