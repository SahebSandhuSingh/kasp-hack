const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" />
        <rect x="11" y="1" width="6" height="6" rx="1.5" fill="currentColor" />
        <rect x="1" y="11" width="6" height="6" rx="1.5" fill="currentColor" />
        <rect x="11" y="11" width="6" height="6" rx="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'simulate',
    label: 'Simulate Query',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'beforeafter',
    label: 'Before & After',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M5 9H1M17 9h-4M9 1v4M9 13v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
]

export default function Layout({ activeView, setActiveView, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* ── Top Nav ── */}
      <header style={{
        height: '56px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E1E3E5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Logo + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="#008060" />
            <path d="M8 20L14 8L20 20" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10.5 16h7" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <span style={{ fontWeight: 600, fontSize: '16px', color: '#202223', letterSpacing: '-0.01em' }}>
            AI Rep Optimizer
          </span>
        </div>

        {/* Right badge */}
        <span style={{
          background: '#F1F2F4',
          color: '#6D7175',
          fontSize: '12px',
          fontWeight: 500,
          padding: '4px 10px',
          borderRadius: '20px',
          border: '1px solid #E1E3E5',
        }}>
          Merchant Preview
        </span>
      </header>

      {/* ── Body (sidebar + main) ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <nav style={{
          width: '240px',
          background: '#F1F2F4',
          borderRight: '1px solid #E1E3E5',
          padding: '16px 0',
          flexShrink: 0,
          overflowY: 'auto',
        }}>
          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#8C9196',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0 16px 8px',
          }}>
            Navigation
          </p>
          {NAV_ITEMS.map(item => {
            const isActive = activeView === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 16px',
                  background: isActive ? '#FFFFFF' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? '3px solid #008060' : '3px solid transparent',
                  color: isActive ? '#202223' : '#6D7175',
                  fontWeight: isActive ? 500 : 400,
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s, color 0.15s',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Main content */}
        <main style={{
          flex: 1,
          background: '#F1F2F4',
          padding: '24px',
          overflowY: 'auto',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
