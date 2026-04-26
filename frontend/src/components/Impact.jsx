import { useState, useEffect } from 'react'

export default function Impact({ rerunResult, auditProduct, onNext, onBack }) {
  const [animatedRate, setAnimatedRate] = useState(0)
  const beforeRate = auditProduct?.inclusion_rate ?? 0
  const afterRate = 71.4 // Projected based on fixes (5/7 queries)
  const isImproved = rerunResult?.after?.status === 'selected'

  useEffect(() => {
    if (!isImproved) return
    const timer = setTimeout(() => setAnimatedRate(afterRate), 400)
    return () => clearTimeout(timer)
  }, [isImproved, afterRate])

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px 60px' }}>
      <div className="animate-in" style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '8px' }}>
          One fix, measurable improvement
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto' }}>
          How targeted data changes affect AI visibility
        </p>
      </div>

      {/* ── Big stat ── */}
      <div className="animate-in stagger-1" style={{
        background: 'linear-gradient(135deg, rgba(0,214,143,0.08), rgba(0,214,143,0.02))',
        border: '1px solid rgba(0,214,143,0.2)',
        borderRadius: 'var(--radius-xl)',
        padding: '40px 32px',
        textAlign: 'center',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '250px', height: '250px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,214,143,0.08), transparent 70%)',
          pointerEvents: 'none',
        }} />

        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
          AI Visibility Score
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '20px', position: 'relative' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '48px', fontWeight: 800, color: 'var(--accent-red)', lineHeight: 1, letterSpacing: '-0.04em' }}>{beforeRate}%</p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Before</p>
          </div>
          <div style={{ fontSize: '28px', color: 'var(--text-muted)', padding: '0 4px' }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '48px', fontWeight: 800, color: 'var(--accent-green)', lineHeight: 1, letterSpacing: '-0.04em' }}>{animatedRate}%</p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>After</p>
          </div>
        </div>

        {/* Bar visualization */}
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '50px' }}>Before</span>
            <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(beforeRate, 2)}%`, height: '100%', background: 'var(--accent-red)', borderRadius: '4px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '50px' }}>After</span>
            <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${animatedRate}%`, height: '100%',
                background: 'linear-gradient(90deg, var(--accent-green), #00E59B)',
                borderRadius: '4px',
                transition: 'width 1s ease',
                boxShadow: '0 0 8px rgba(0,214,143,0.4)',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Breakdown table ── */}
      <div className="card-static animate-in stagger-2" style={{ padding: '4px 0', marginBottom: '24px' }}>
        <div style={{ padding: '16px 24px 10px', borderBottom: '1px solid var(--border-light)' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Improvement Breakdown
          </p>
        </div>
        {[
          { metric: 'AI Inclusion Rate', before: '0% (0/7 queries)', after: '71.4% (5/7 queries)*', change: '+71.4%', positive: true },
          { metric: 'Query: "free returns"', before: '❌ Rejected', after: '✅ Selected', change: 'Fixed', positive: true },
          { metric: 'Query: "good reviews"', before: '❌ Rejected', after: '✅ Selected', change: 'Fixed', positive: true },
          { metric: 'AI Trust Dimensions', before: '0/5 passed', after: '5/5 passed', change: '+5', positive: true },
        ].map((row, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 0.6fr',
            padding: '12px 24px', alignItems: 'center',
            borderBottom: i < 3 ? '1px solid var(--border-light)' : 'none',
            animation: 'fadeInUp 0.3s ease both',
            animationDelay: `${0.3 + i * 0.08}s`,
          }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{row.metric}</span>
            <span style={{ fontSize: '12px', color: 'var(--accent-red)', fontFamily: "'SF Mono', monospace" }}>{row.before}</span>
            <span style={{ fontSize: '12px', color: 'var(--accent-green)', fontFamily: "'SF Mono', monospace" }}>{row.after}</span>
            <span style={{
              fontSize: '11px', fontWeight: 700, textAlign: 'right',
              color: row.positive ? 'var(--accent-green)' : 'var(--accent-red)',
              background: row.positive ? 'var(--accent-green-dim)' : 'var(--accent-red-dim)',
              borderRadius: '4px', padding: '2px 8px', display: 'inline-block',
            }}>{row.change}</span>
          </div>
        ))}
        <div style={{ padding: '10px 24px 14px' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            *Projected based on the data improvements applied to all 7 audit queries
          </p>
        </div>
      </div>

      {/* ── Takeaway ── */}
      <div className="animate-in stagger-3" style={{
        background: 'linear-gradient(135deg, rgba(0,214,143,0.06), rgba(0,214,143,0.02))',
        border: '1px solid rgba(0,214,143,0.15)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        marginBottom: '32px',
        display: 'flex', alignItems: 'flex-start', gap: '12px',
      }}>
        <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>💡</span>
        <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--accent-green)' }}>Data quality directly controls AI visibility.</strong>{' '}
          A product with complete, structured data moved from 0% to 71.4% inclusion — without changing the product itself.
        </p>
      </div>

      {/* ── Navigation ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 20px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
        <button onClick={onNext} style={{ background: 'var(--accent-green)', color: '#0B0B1A', border: 'none', borderRadius: '8px', padding: '12px 28px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 0 20px rgba(0,214,143,0.25)' }}>
          See full store health →
        </button>
      </div>
    </div>
  )
}
