import { useState, useEffect } from 'react'

export default function Proof({ rerunResult, onNext, onBack }) {
  const [phase, setPhase] = useState('rejected')
  const afterSelected = rerunResult?.after?.status === 'selected'

  useEffect(() => {
    if (!rerunResult) return
    const t1 = setTimeout(() => setPhase('transitioning'), 800)
    const t2 = setTimeout(() => setPhase(afterSelected ? 'selected' : 'still-rejected'), 2000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [rerunResult, afterSelected])

  if (!rerunResult) {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>No result yet. Go back and run the analysis.</p>
        <button onClick={onBack} style={{ marginTop: '20px', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 20px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
      </div>
    )
  }

  const isSuccess = phase === 'selected'
  const isTransitioning = phase === 'transitioning'
  const showResult = phase !== 'rejected' && !isTransitioning

  const getColors = () => {
    if (phase === 'rejected') return { bg: 'rgba(255,71,87,0.08)', border: 'rgba(255,71,87,0.25)', glow: 'rgba(255,71,87,0.1)', accent: 'var(--accent-red)' }
    if (isTransitioning) return { bg: 'rgba(255,192,72,0.06)', border: 'rgba(255,192,72,0.25)', glow: 'rgba(255,192,72,0.1)', accent: 'var(--accent-amber)' }
    if (isSuccess) return { bg: 'rgba(0,214,143,0.08)', border: 'rgba(0,214,143,0.25)', glow: 'rgba(0,214,143,0.15)', accent: 'var(--accent-green)' }
    return { bg: 'rgba(255,71,87,0.08)', border: 'rgba(255,71,87,0.25)', glow: 'rgba(255,71,87,0.1)', accent: 'var(--accent-red)' }
  }

  const c = getColors()
  const statusLabel = phase === 'rejected' ? 'REJECTED' : isTransitioning ? 'RE-EVALUATING…' : isSuccess ? 'SELECTED' : 'STILL REJECTED'
  const statusIcon = phase === 'rejected' ? '❌' : isTransitioning ? '⏳' : isSuccess ? '✅' : '❌'

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px 60px' }}>
      <div className="animate-in" style={{ marginBottom: '12px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '8px' }}>AI re-evaluated your product</h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto' }}>Same query. Same competitors. Better data. Different result.</p>
      </div>

      <div className="animate-in stagger-1" style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '6px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
          🔍 "{rerunResult.query}"
        </div>
      </div>

      {/* Hero card */}
      <div style={{
        borderRadius: 'var(--radius-xl)', padding: '36px', marginBottom: '24px', textAlign: 'center',
        position: 'relative', overflow: 'hidden', transition: 'all 0.8s ease',
        background: `linear-gradient(135deg, ${c.bg}, transparent)`,
        border: `1px solid ${c.border}`, boxShadow: `0 0 40px ${c.glow}`,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px',
          borderRadius: '24px', marginBottom: '20px', transition: 'all 0.6s ease',
          background: c.bg, border: `1px solid ${c.border}`,
          ...(isTransitioning ? { animation: 'pulse 1s ease-in-out infinite' } : {}),
        }}>
          <span style={{ fontSize: '20px' }}>{statusIcon}</span>
          <span style={{ fontSize: '16px', fontWeight: 800, color: c.accent, transition: 'color 0.6s' }}>{statusLabel}</span>
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', letterSpacing: '-0.02em' }}>
          PowerZone Protein Bar – Strawberry Blast
        </h2>

        {showResult && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', animation: 'celebrate 0.5s ease both' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Before</p>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-red)' }}>Not ranked</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '20px', color: 'var(--text-muted)' }}>→</div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>After</p>
              <p style={{ fontSize: '14px', fontWeight: 700, color: isSuccess ? 'var(--accent-green)' : 'var(--accent-red)' }}>{isSuccess ? '#2 of 12' : 'Still not ranked'}</p>
            </div>
          </div>
        )}
      </div>

      {/* AI reasoning + convincing factors */}
      {showResult && (
        <>
          <div className="card-static" style={{ padding: '20px 24px', marginBottom: '20px', borderLeft: `3px solid ${isSuccess ? 'var(--accent-green)' : 'var(--accent-red)'}`, animation: 'fadeInUp 0.5s ease both' }}>
            <p style={{ fontSize: '11px', color: isSuccess ? 'var(--accent-green)' : 'var(--accent-red)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '8px' }}>
              {isSuccess ? "Why AI picked this now" : "Why it's still rejected"}
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.7, fontStyle: 'italic' }}>"{rerunResult.after?.reason}"</p>
          </div>

          {isSuccess && (
            <div className="card-static" style={{ padding: '20px 24px', marginBottom: '32px', animation: 'fadeInUp 0.5s ease both', animationDelay: '0.15s' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>What convinced the AI</p>
              {['Return policy now specified → matches query requirement', 'Description has nutritional data → passes quality check', '187 reviews at 4.6★ → strong trust signal'].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < 2 ? '1px solid var(--border-light)' : 'none' }}>
                  <span style={{ fontSize: '14px' }}>✅</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{text}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeIn 0.4s ease both', animationDelay: '0.3s' }}>
            <button onClick={onBack} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 20px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
            <button onClick={onNext} style={{ background: 'var(--accent-green)', color: '#0B0B1A', border: 'none', borderRadius: '8px', padding: '12px 28px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 0 20px rgba(0,214,143,0.25)' }}>See full impact →</button>
          </div>
        </>
      )}
    </div>
  )
}
