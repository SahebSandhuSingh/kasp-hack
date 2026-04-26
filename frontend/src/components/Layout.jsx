const STEPS = [
  { id: 1, label: 'The Problem', short: 'Problem' },
  { id: 2, label: 'AI X-Ray', short: 'X-Ray' },
  { id: 3, label: 'The Fix', short: 'Fix' },
  { id: 4, label: 'Proof', short: 'Proof' },
  { id: 5, label: 'Impact', short: 'Impact' },
  { id: 6, label: 'Store Health', short: 'Health' },
]

function StepIndicator({ currentStep, onStepClick, maxReached }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0',
      padding: '0 4px',
    }}>
      {STEPS.map((step, i) => {
        const isActive = currentStep === step.id
        const isCompleted = step.id < currentStep
        const isReachable = step.id <= maxReached
        const isLast = i === STEPS.length - 1

        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
            {/* Step dot + label */}
            <button
              onClick={() => isReachable && onStepClick(step.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                cursor: isReachable ? 'pointer' : 'default',
                padding: '6px 8px',
                borderRadius: '8px',
                transition: 'background 0.2s',
                opacity: isReachable ? 1 : 0.35,
              }}
              onMouseEnter={e => { if (isReachable) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            >
              {/* Dot */}
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                flexShrink: 0,
                transition: 'all 0.3s',
                ...(isActive ? {
                  background: 'var(--accent-green)',
                  color: '#0B0B1A',
                  boxShadow: '0 0 12px rgba(0,214,143,0.4)',
                } : isCompleted ? {
                  background: 'rgba(0,214,143,0.2)',
                  color: 'var(--accent-green)',
                  border: '1.5px solid var(--accent-green)',
                } : {
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--text-muted)',
                  border: '1.5px solid rgba(255,255,255,0.1)',
                }),
              }}>
                {isCompleted ? '✓' : step.id}
              </div>
              {/* Label */}
              <span style={{
                fontSize: '12px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--text-primary)' : isCompleted ? 'var(--accent-green)' : 'var(--text-muted)',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em',
                transition: 'color 0.2s',
              }}>
                {step.short}
              </span>
            </button>

            {/* Connector line */}
            {!isLast && (
              <div style={{
                width: '24px',
                height: '1.5px',
                background: isCompleted
                  ? 'var(--accent-green)'
                  : 'rgba(255,255,255,0.08)',
                transition: 'background 0.3s',
                flexShrink: 0,
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Layout({ currentStep, onStepClick, maxReached, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* ── Top Nav ── */}
      <header style={{
        height: '60px',
        background: 'rgba(11,11,26,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Logo + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--accent-green), #00B377)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(0,214,143,0.25)',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 12L8 4L12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5.5 9.5h5" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{
            fontWeight: 700,
            fontSize: '15px',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}>
            AI Shelf Visibility
          </span>
        </div>

        {/* Step indicator */}
        <StepIndicator
          currentStep={currentStep}
          onStepClick={onStepClick}
          maxReached={maxReached}
        />

        {/* Right badge */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          color: 'var(--text-secondary)',
          fontSize: '11px',
          fontWeight: 600,
          padding: '5px 12px',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}>
          Live Demo
        </div>
      </header>

      {/* ── Main content ── */}
      <main style={{
        flex: 1,
        background: 'var(--bg-deep)',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        {children}
      </main>
    </div>
  )
}
