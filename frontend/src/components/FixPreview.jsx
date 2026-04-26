import { useState, useEffect } from 'react'

const FIXES = [
  {
    field: 'Description',
    before: '"Great protein bar. Buy now and get fit! Perfect for gym enthusiasts. Try it today!"',
    after: '"PowerZone Strawberry Blast delivers 24g of whey protein per bar with only 5g of sugar. Made with real strawberry pieces, no artificial flavors, and fortified with B vitamins for sustained energy."',
    icon: '📝',
  },
  {
    field: 'Return Policy',
    before: 'null — NOT SPECIFIED',
    after: '"Free returns within 30 days of delivery. No questions asked. Full refund issued within 3-5 business days."',
    icon: '↩️',
  },
  {
    field: 'Shipping',
    before: '"Standard delivery"',
    after: '"Free delivery on all orders. Delivered within 3-5 business days."',
    icon: '📦',
  },
  {
    field: 'Ingredients',
    before: 'null — NOT SPECIFIED',
    after: '"Whey Protein Isolate, Strawberry Pieces, Oats, Dark Chocolate Coating, B Vitamins, Sunflower Lecithin"',
    icon: '🧪',
  },
  {
    field: 'Reviews & Rating',
    before: '6 reviews · 2.8★',
    after: '187 reviews · 4.6★',
    icon: '⭐',
  },
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

export default function FixPreview({ rerunResult, loading, onRunRerun, onNext, onBack }) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [showAll, setShowAll] = useState(false)

  // Stagger animation
  useEffect(() => {
    if (showAll) return
    if (visibleCount < FIXES.length) {
      const timer = setTimeout(() => setVisibleCount(prev => prev + 1), 400)
      return () => clearTimeout(timer)
    } else {
      setShowAll(true)
    }
  }, [visibleCount, showAll])

  // Start animation on mount
  useEffect(() => {
    setVisibleCount(1)
  }, [])

  const handleRerun = async () => {
    try {
      await onRunRerun()
      onNext()
    } catch (e) {
      // error handled in parent
    }
  }

  return (
    <div style={{ maxWidth: '740px', margin: '0 auto', padding: '40px 24px 60px' }}>
      {/* ── Header ── */}
      <div className="animate-in" style={{ marginBottom: '8px', textAlign: 'center' }}>
        <h1 style={{
          fontSize: '26px',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.03em',
          marginBottom: '8px',
          lineHeight: 1.2,
        }}>
          Applying AI-guided fixes
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
          Based on the diagnosis, here are the exact changes to make your product AI-ready
        </p>
      </div>

      {/* ── Progress ── */}
      <div className="animate-in stagger-1" style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
        marginBottom: '28px', padding: '8px 0',
      }}>
        <div style={{
          width: '200px', height: '4px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${(Math.min(visibleCount, FIXES.length) / FIXES.length) * 100}%`,
            height: '100%',
            background: 'var(--accent-green)',
            borderRadius: '2px',
            transition: 'width 0.4s ease',
            boxShadow: '0 0 8px rgba(0,214,143,0.4)',
          }} />
        </div>
        <span style={{
          fontSize: '12px',
          fontWeight: 600,
          color: showAll ? 'var(--accent-green)' : 'var(--text-secondary)',
        }}>
          {Math.min(visibleCount, FIXES.length)} of {FIXES.length} issues fixed
        </span>
      </div>

      {/* ── Diff cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
        {FIXES.map((fix, i) => {
          const isVisible = i < visibleCount
          if (!isVisible) return null

          return (
            <div
              key={fix.field}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '18px 22px',
                animation: 'fadeInUp 0.4s ease both',
                backdropFilter: 'blur(8px)',
              }}
            >
              {/* Field header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
              }}>
                <span style={{ fontSize: '16px' }}>{fix.icon}</span>
                <span style={{
                  fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}>
                  {fix.field}
                </span>
                <div style={{
                  marginLeft: 'auto',
                  background: 'var(--accent-green-dim)',
                  color: 'var(--accent-green)',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Fixed
                </div>
              </div>

              {/* Before line */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                marginBottom: '6px',
              }}>
                <span style={{
                  color: 'var(--accent-red)',
                  fontSize: '14px',
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: '1px',
                }}>−</span>
                <p style={{
                  fontSize: '12px',
                  color: 'rgba(255,71,87,0.7)',
                  textDecoration: 'line-through',
                  lineHeight: 1.5,
                  fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                }}>
                  {fix.before}
                </p>
              </div>

              {/* After line */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px',
              }}>
                <span style={{
                  color: 'var(--accent-green)',
                  fontSize: '14px',
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: '1px',
                }}>+</span>
                <p style={{
                  fontSize: '12px',
                  color: 'rgba(0,214,143,0.85)',
                  lineHeight: 1.5,
                  fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                }}>
                  {fix.after}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Navigation ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          onClick={handleRerun}
          disabled={loading || !showAll}
          style={{
            background: loading ? 'rgba(255,255,255,0.06)' : !showAll ? 'rgba(255,255,255,0.04)' : 'var(--accent-green)',
            color: loading || !showAll ? 'var(--text-muted)' : '#0B0B1A',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 28px',
            fontWeight: 700,
            fontSize: '14px',
            cursor: loading || !showAll ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            letterSpacing: '-0.01em',
            boxShadow: showAll && !loading ? '0 0 20px rgba(0,214,143,0.25)' : 'none',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (showAll && !loading) e.target.style.boxShadow = '0 0 30px rgba(0,214,143,0.4)' }}
          onMouseLeave={e => { if (showAll && !loading) e.target.style.boxShadow = '0 0 20px rgba(0,214,143,0.25)' }}
        >
          {loading ? 'Re-running AI simulation…' : 'Re-run with fixes applied →'}
        </button>
      </div>
    </div>
  )
}
