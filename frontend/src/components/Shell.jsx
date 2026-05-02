import { useState, useRef, useEffect } from 'react'

// Clean inline SVG icons
const icons = {
  overview: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="6" height="6" rx="1.5"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5"/>
    </svg>
  ),
  products: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 4h12M2 8h12M2 12h12"/>
    </svg>
  ),
  optimize: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v12M5 5l3-3 3 3M4 10h8"/>
    </svg>
  ),
  simulate: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7" cy="7" r="4.5"/>
      <path d="M10.5 10.5L14 14"/>
    </svg>
  ),
  analytics: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14H2V2"/>
      <path d="M2 10l4-4 3 3 5-5"/>
    </svg>
  ),
  chevronDown: (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4.5L6 7.5L9 4.5"/>
    </svg>
  ),
  logout: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M11 11l3-3-3-3M6 8h8"/>
    </svg>
  ),
}

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Overview',  icon: icons.overview },
  { id: 'products',    label: 'Products',  icon: icons.products },
  { id: 'beforeafter', label: 'Optimize',  icon: icons.optimize },
  { id: 'simulate',    label: 'Simulate',  icon: icons.simulate },
]

export default function Shell({ view, setView, storeData, onDisconnect, children }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
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
  const scopeStatus = storeData?.scopeStatus || {}

  return (
    <div className="min-h-screen bg-shopify-bg font-sans">

      {/* Top nav bar */}
      <header className="bg-white shadow-nav sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="AI Rep Optimizer Logo" className="w-7 h-7 rounded-md object-cover" />
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
                {item.icon}
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
              <span className={`text-shopify-secondary transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>
                {icons.chevronDown}
              </span>
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-card shadow-card border border-shopify-border overflow-hidden z-40 fade-up">
                <div className="px-4 py-3 border-b border-shopify-border">
                  <p className="text-xs font-semibold text-shopify-text truncate">{storeName}</p>
                  <p className="text-xs text-shopify-secondary mt-0.5">Connected · {storeData?.planName || 'Shopify'}</p>
                </div>
                <div className="px-4 py-3 border-b border-shopify-border space-y-2">
                  <p className="text-xs text-shopify-secondary">⚡ write_products: {scopeStatus.has_write_products ? '✓ Active' : '✗ Missing'}</p>
                  <p className="text-xs text-shopify-secondary">📦 read_products: {scopeStatus.has_read_products ? '✓ Active' : '✗ Missing'}</p>
                  <p className="text-xs text-shopify-secondary">📊 read_orders: {scopeStatus.has_read_orders ? '✓ Active' : '✗ Missing'}</p>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false)
                    setConfirmOpen(true)
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-shopify-critical hover:bg-shopify-critical-light transition-colors flex items-center gap-2"
                >
                  {icons.logout}
                  Disconnect store
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmOpen(false)}>
          <div className="bg-white rounded-card shadow-card w-full max-w-sm mx-4 fade-up" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-shopify-border">
              <h2 className="text-base font-semibold text-shopify-text">Disconnect {storeName}?</h2>
              <p className="text-sm text-shopify-secondary mt-1">Your optimization history will be preserved.</p>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-3">
              <button onClick={() => setConfirmOpen(false)} className="text-sm font-medium text-shopify-secondary border border-shopify-border rounded-btn px-4 py-2 hover:bg-shopify-bg transition-colors">
                Cancel
              </button>
              <button onClick={() => { setConfirmOpen(false); onDisconnect() }} className="bg-shopify-critical hover:opacity-90 text-white text-sm font-medium px-4 py-2 rounded-btn transition-colors">
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
