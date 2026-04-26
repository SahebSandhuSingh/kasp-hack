import { useState } from 'react'

const SUGGESTED_QUERIES = [
  'best protein bar under ₹500 with free returns',
  'high protein snack with good reviews',
  'vegan protein bar with clear ingredients',
]

function SkeletonPulse({ width, height = 14 }) {
  return (
    <div style={{
      width, height,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: '6px',
    }} />
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s ease' }}>
      <div className="card-static" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SkeletonPulse width="50%" height={20} />
        <SkeletonPulse width="85%" />
        <SkeletonPulse width="70%" />
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <div className="card-static" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <SkeletonPulse width="40%" height={12} />
          <SkeletonPulse width="70%" />
        </div>
        <div className="card-static" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <SkeletonPulse width="40%" height={12} />
          <SkeletonPulse width="70%" />
        </div>
      </div>
    </div>
  )
}

export default function TheProblem({ defaultQuery, simulationResult, loading, error, focusProductId, onRunSimulation, onNext }) {
  const [query, setQuery] = useState(defaultQuery)

  const handleRun = () => {
    if (!query.trim()) return
    onRunSimulation(query.trim())
  }

  const focusRejected = simulationResult?.rejected?.find(p => p.id === focusProductId)
  const selected = simulationResult?.selected || []
  const otherRejected = (simulationResult?.rejected || []).filter(p => p.id !== focusProductId)

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '40px 24px 60px' }}>
      {/* ── Page header ── */}
      <div className="animate-in" style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.03em',
          marginBottom: '8px',
          lineHeight: 1.2,
        }}>
          Your product is invisible to AI shoppers
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
          A customer just searched — here's what AI recommended instead of your product
        </p>
      </div>

      {/* ── Query input ── */}
      <div className="card-static animate-in stagger-1" style={{ marginBottom: '28px', padding: '20px 24px' }}>
        <label style={{
          display: 'block', fontWeight: 600, fontSize: '12px',
          color: 'var(--text-secondary)', marginBottom: '10px',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          What would a customer search for?
        </label>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleRun() }}
            placeholder="e.g. best protein bar under ₹500 with free returns"
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '11px 14px',
              fontSize: '14px',
              fontFamily: 'inherit',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'var(--accent-green)'
              e.target.style.boxShadow = '0 0 0 3px rgba(0,214,143,0.1)'
            }}
            onBlur={e => {
              e.target.style.borderColor = 'rgba(255,255,255,0.08)'
              e.target.style.boxShadow = 'none'
            }}
          />
          <button
            onClick={handleRun}
            disabled={loading || !query.trim()}
            style={{
              background: loading || !query.trim() ? 'rgba(255,255,255,0.06)' : 'var(--accent-green)',
              color: loading || !query.trim() ? 'var(--text-muted)' : '#0B0B1A',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '11px 20px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}
          >
            {loading ? 'Asking AI…' : 'Ask the AI'}
          </button>
        </div>

        {/* Suggested queries */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '2px' }}>Try:</span>
          {SUGGESTED_QUERIES.map(q => (
            <button
              key={q}
              onClick={() => setQuery(q)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '3px 10px',
                fontSize: '11px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.target.style.background = 'rgba(255,255,255,0.08)'
                e.target.style.borderColor = 'rgba(255,255,255,0.15)'
              }}
              onMouseLeave={e => {
                e.target.style.background = 'rgba(255,255,255,0.04)'
                e.target.style.borderColor = 'rgba(255,255,255,0.08)'
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          background: 'var(--accent-red-dim)',
          border: '1px solid rgba(255,71,87,0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          marginBottom: '20px',
          fontSize: '13px',
          color: 'var(--accent-red)',
        }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && <LoadingSkeleton />}

      {/* ── Results ── */}
      {simulationResult && !loading && (
        <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
          {/* Query context */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '20px', padding: '10px 16px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)',
          }}>
            <span style={{ fontSize: '14px' }}>🔍</span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              AI evaluated {(selected.length + (simulationResult?.rejected?.length || 0))} products for:
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              "{simulationResult.query}"
            </span>
          </div>

          {/* ── HERO: Your rejected product ── */}
          {focusRejected && (
            <div
              className="animate-in stagger-1"
              style={{
                background: 'linear-gradient(135deg, rgba(255,71,87,0.08), rgba(255,71,87,0.03))',
                border: '1px solid rgba(255,71,87,0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                marginBottom: '20px',
                animation: 'fadeInUp 0.5s ease both, pulseGlow 3s ease-in-out infinite',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Glow decoration */}
              <div style={{
                position: 'absolute', top: '-40px', right: '-40px',
                width: '120px', height: '120px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,71,87,0.12), transparent 70%)',
                pointerEvents: 'none',
              }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                <div style={{
                  background: 'var(--accent-red)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#fff',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  flexShrink: 0,
                  boxShadow: '0 0 12px rgba(255,71,87,0.3)',
                }}>
                  ✕ Skipped by AI
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                }}>
                  YOUR PRODUCT
                </div>
              </div>

              <h2 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '12px',
                letterSpacing: '-0.02em',
              }}>
                {focusRejected.name}
              </h2>

              <div style={{
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px 18px',
                borderLeft: '3px solid var(--accent-red)',
              }}>
                <p style={{
                  fontSize: '11px', color: 'var(--accent-red)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  fontWeight: 600, marginBottom: '6px',
                }}>
                  Why AI rejected this
                </p>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                }}>
                  "{focusRejected.reason_rejected}"
                </p>
              </div>
            </div>
          )}

          {/* ── AI's picks ── */}
          <div className="animate-in stagger-2" style={{ marginBottom: '16px' }}>
            <p style={{
              fontSize: '12px', fontWeight: 600, color: 'var(--accent-green)',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px',
            }}>
              ✓ AI chose these instead ({selected.length})
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {selected.map(p => (
                <div key={p.id} style={{
                  flex: 1,
                  background: 'rgba(0,214,143,0.04)',
                  border: '1px solid rgba(0,214,143,0.15)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                }}>
                  <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    {p.name}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {p.reason_chosen}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Other rejected (collapsed) ── */}
          {otherRejected.length > 0 && (
            <CollapsibleOthers products={otherRejected} />
          )}

          {/* ── CTA ── */}
          <div className="animate-in stagger-4" style={{ marginTop: '28px', textAlign: 'center' }}>
            <button
              onClick={onNext}
              style={{
                background: 'var(--accent-green)',
                color: '#0B0B1A',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '13px 32px',
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
              See why AI skipped your product →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CollapsibleOthers({ products }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="animate-in stagger-3">
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 16px',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          fontFamily: 'inherit',
          color: 'var(--text-secondary)',
          fontSize: '12px',
          fontWeight: 500,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
      >
        <span>+ {products.length} other products also skipped</span>
        <span style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▾</span>
      </button>

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', animation: 'fadeIn 0.2s ease' }}>
          {products.map(p => (
            <div key={p.id} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '12px',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', minWidth: '140px' }}>
                {p.name}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, textAlign: 'right' }}>
                {p.reason_rejected}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
