// ── Inline SVG icons ──
function IconOverview() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

function IconSimulate() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function IconCompare() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path d="M5 2v12M11 2v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M2 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 11l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconConnect() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path d="M6 4H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 4h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Overview',       Icon: IconOverview },
  { id: 'simulate',    label: 'Simulate Query',  Icon: IconSimulate },
  { id: 'beforeafter', label: 'Before & After',  Icon: IconCompare },
  { id: 'connect',     label: 'Connect Store',   Icon: IconConnect },
]

export default function Shell({ view, setView, storeData, children }) {
  const domain = storeData?.domain || null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* ── Top Navbar ── */}
      <header style={{
        height: '56px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Left: logo + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            background: 'var(--green)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: '14px',
            fontFamily: 'DM Sans, sans-serif',
            flexShrink: 0,
          }}>A</div>
          <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            AI Rep Optimizer
          </span>
        </div>

        {/* Right: connection status badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 500,
          background: domain ? 'var(--green-light)' : 'var(--bg-surface-2)',
          color: domain ? 'var(--green)' : 'var(--text-muted)',
          border: `1px solid ${domain ? 'var(--green-border)' : 'var(--border)'}`,
          fontFamily: 'DM Mono, monospace',
        }}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: domain ? 'var(--green)' : 'var(--text-muted)',
            flexShrink: 0,
          }} />
          {domain ? `Connected: ${domain}` : 'Demo Mode'}
        </div>
      </header>

      {/* ── Body: sidebar + main ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <nav style={{
          width: '220px',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          padding: '12px 0',
          flexShrink: 0,
          overflowY: 'auto',
        }}>
          <div style={{ padding: '4px 8px 8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '0 8px' }}>
              Navigation
            </span>
          </div>
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const isActive = view === id
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: 'calc(100% - 16px)',
                  margin: '1px 8px',
                  padding: '9px 12px',
                  background: isActive ? 'var(--green-light)' : 'transparent',
                  color: isActive ? 'var(--green)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '14px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'background 0.1s, color 0.1s',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-surface-2)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }
                }}
              >
                <Icon />
                {label}
              </button>
            )
          })}

          {/* Sidebar divider + info */}
          <div style={{ margin: '12px 8px 0', padding: '12px', background: 'var(--bg-page)', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              {domain ? 'Live Store' : 'Mock Data'}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {domain
                ? `Analyzing ${storeData?.productCount || '?'} products from ${domain}`
                : 'Connect your store to audit live products'}
            </p>
          </div>
        </nav>

        {/* ── Main content ── */}
        <main style={{
          flex: 1,
          background: 'var(--bg-page)',
          overflowY: 'auto',
          padding: '28px 32px',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
