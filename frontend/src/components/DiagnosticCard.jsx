const DIMENSION_MAP = {
  missing_return_policy: {
    label: 'Return Policy',
    icon: '↩️',
    failDetail: 'Not specified — query explicitly asks for returns',
  },
  weak_social_proof: {
    label: 'Trust Signals',
    icon: '⭐',
    failDetail: 'Too few reviews and low rating — below trust threshold',
  },
  weak_description: {
    label: 'Description Quality',
    icon: '📝',
    failDetail: 'Promotional text with no nutritional or factual data',
  },
  missing_ingredients: {
    label: 'Ingredient Transparency',
    icon: '🧪',
    failDetail: 'Not specified — customers and AI need clear ingredient data',
  },
  missing_shipping_info: {
    label: 'Shipping Clarity',
    icon: '📦',
    failDetail: 'Vague "Standard delivery" — no cost or timeline provided',
  },
  price_issue: {
    label: 'Pricing',
    icon: '💰',
    failDetail: 'Price concerns flagged by AI relative to query budget',
  },
}

const ALL_DIMENSIONS = [
  'missing_return_policy',
  'weak_social_proof',
  'weak_description',
  'missing_ingredients',
  'missing_shipping_info',
]

export default function DiagnosticCard({ focusProduct, auditProduct, simulationResult, onNext, onBack }) {
  const issues = auditProduct?.issues || []
  const rejectionReasons = auditProduct?.all_rejection_reasons || []
  const productName = focusProduct?.name || auditProduct?.name || 'Unknown Product'

  // Get the best rejection quote
  const bestQuote = rejectionReasons.length > 0
    ? rejectionReasons.reduce((a, b) => a.length > b.length ? a : b)
    : focusProduct?.reason_rejected || 'No rejection reason available.'

  const passCount = ALL_DIMENSIONS.filter(d => !issues.includes(d)).length
  const failCount = ALL_DIMENSIONS.filter(d => issues.includes(d)).length

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px 60px' }}>
      {/* ── Header ── */}
      <div className="animate-in" style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{
          fontSize: '26px',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.03em',
          marginBottom: '8px',
          lineHeight: 1.2,
        }}>
          Why AI skipped {productName.split('–')[0].trim()}
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
          AI agents evaluate products on {ALL_DIMENSIONS.length} trust dimensions. Here's where yours failed.
        </p>
      </div>

      {/* ── Score summary ── */}
      <div className="animate-in stagger-1" style={{
        display: 'flex', gap: '12px', marginBottom: '24px',
      }}>
        <div style={{
          flex: 1,
          background: 'var(--accent-red-dim)',
          border: '1px solid rgba(255,71,87,0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-red)', lineHeight: 1 }}>{failCount}</p>
          <p style={{ fontSize: '12px', color: 'var(--accent-red)', fontWeight: 600, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Failed</p>
        </div>
        <div style={{
          flex: 1,
          background: 'var(--accent-green-dim)',
          border: '1px solid rgba(0,214,143,0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-green)', lineHeight: 1 }}>{passCount}</p>
          <p style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: 600, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Passed</p>
        </div>
      </div>

      {/* ── Dimension scorecard ── */}
      <div className="card-static animate-in stagger-2" style={{ padding: '4px 0', marginBottom: '24px' }}>
        {ALL_DIMENSIONS.map((dimKey, i) => {
          const dim = DIMENSION_MAP[dimKey]
          const isFail = issues.includes(dimKey)
          return (
            <div
              key={dimKey}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '16px 24px',
                borderBottom: i < ALL_DIMENSIONS.length - 1 ? '1px solid var(--border-light)' : 'none',
                animation: `fadeInUp 0.4s ease both`,
                animationDelay: `${0.15 + i * 0.08}s`,
                transition: 'background 0.15s',
              }}
            >
              {/* Icon */}
              <span style={{ fontSize: '18px', flexShrink: 0, width: '28px', textAlign: 'center' }}>
                {dim.icon}
              </span>

              {/* Label + detail */}
              <div style={{ flex: 1 }}>
                <p style={{
                  fontSize: '14px', fontWeight: 600,
                  color: 'var(--text-primary)', marginBottom: '2px',
                }}>
                  {dim.label}
                </p>
                <p style={{
                  fontSize: '12px',
                  color: isFail ? 'rgba(255,71,87,0.7)' : 'rgba(0,214,143,0.7)',
                  lineHeight: 1.4,
                }}>
                  {isFail ? dim.failDetail : 'Meets AI evaluation threshold'}
                </p>
              </div>

              {/* Status badge */}
              <div style={{
                background: isFail ? 'var(--accent-red-dim)' : 'var(--accent-green-dim)',
                color: isFail ? 'var(--accent-red)' : 'var(--accent-green)',
                borderRadius: '6px',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                flexShrink: 0,
                border: `1px solid ${isFail ? 'rgba(255,71,87,0.2)' : 'rgba(0,214,143,0.2)'}`,
              }}>
                {isFail ? 'FAIL' : 'PASS'}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── AI Quote ── */}
      <div className="animate-in stagger-3" style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid var(--accent-amber)',
        borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
        padding: '18px 22px',
        marginBottom: '32px',
      }}>
        <p style={{
          fontSize: '13px',
          color: 'var(--text-primary)',
          lineHeight: 1.7,
          fontStyle: 'italic',
          marginBottom: '8px',
        }}>
          "{bestQuote}"
        </p>
        <p style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontWeight: 600,
        }}>
          — AI Shopping Agent (Llama 3.3 70B)
        </p>
      </div>

      {/* ── Navigation ── */}
      <div className="animate-in stagger-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 20px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
          onMouseLeave={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          style={{
            background: 'var(--accent-green)',
            color: '#0B0B1A',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 28px',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            letterSpacing: '-0.01em',
            boxShadow: '0 0 20px rgba(0,214,143,0.25)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.target.style.boxShadow = '0 0 30px rgba(0,214,143,0.4)'}
          onMouseLeave={e => e.target.style.boxShadow = '0 0 20px rgba(0,214,143,0.25)'}
        >
          Fix this product →
        </button>
      </div>
    </div>
  )
}
