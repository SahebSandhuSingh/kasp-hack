import { useState, useRef, useEffect } from 'react'

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Overview',  icon: '◎' },
  { id: 'products',    label: 'Products',  icon: '☰' },
  { id: 'beforeafter', label: 'Optimize',  icon: '⚡' },
  { id: 'simulate',    label: 'Simulate',  icon: '🔍' },
]

export default function Shell({ view, setView, storeData, onDisconnect, children }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const storeName = storeData?.domain || 'Not connected'

  return (
    <div className="min-h-screen bg-shopify-bg font-sans">

      {/* Top nav bar */}
      <header className="bg-white shadow-nav sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-shopify-green flex items-center justify-center">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <span className="font-semibold text-shopify-text text-sm tracking-tight">
              AI Rep Optimizer
            </span>
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-sm font-medium transition-all
                  ${view === item.id
                    ? 'bg-shopify-green-light text-shopify-green'
                    : 'text-shopify-secondary hover:bg-shopify-bg hover:text-shopify-text'
                  }
                `}
              >
                <span className="text-xs">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          {/* Store pill with dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 bg-shopify-bg border border-shopify-border rounded-full px-3 py-1 hover:border-shopify-green/40 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-shopify-green animate-pulse" />
              <span className="text-xs text-shopify-secondary font-medium max-w-[180px] truncate">
                {storeName}
              </span>
              <span className={`text-[10px] text-shopify-secondary transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-card shadow-card border border-shopify-border overflow-hidden z-40 fade-up">
                <div className="px-4 py-3 border-b border-shopify-border">
                  <p className="text-xs font-semibold text-shopify-text truncate">{storeName}</p>
                  {storeData?.productCount != null && (
                    <p className="text-xs text-shopify-secondary mt-0.5">
                      {storeData.productCount} products synced
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false)
                    onDisconnect()
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-shopify-critical hover:bg-shopify-critical-light transition-colors flex items-center gap-2"
                >
                  <span className="text-xs">⏻</span>
                  Disconnect store
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
