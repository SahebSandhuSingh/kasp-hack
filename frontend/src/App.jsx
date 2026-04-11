import { useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import Simulate from './components/Simulate'
import BeforeAfter from './components/BeforeAfter'

export default function App() {
  const [activeView, setActiveView] = useState('dashboard')

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':  return <Dashboard />
      case 'simulate':   return <Simulate />
      case 'beforeafter': return <BeforeAfter />
      default:           return <Dashboard />
    }
  }

  return (
    <Layout activeView={activeView} setActiveView={setActiveView}>
      {renderView()}
    </Layout>
  )
}
