import { useState, useEffect } from 'react'

function getPriorityStyle(priority) {
  if (!priority) return { bg: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)' }
  if (priority.includes('CRITICAL')) return { bg: 'var(--accent-red-dim)', color: 'var(--accent-red)' }
  if (priority.includes('NEEDS WORK')) return { bg: 'var(--accent-amber-dim)', color: 'var(--accent-amber)' }
  if (priority.includes('MINOR')) return { bg: 'var(--accent-green-dim)', color: 'var(--accent-green)' }
  if (priority.includes('PERFORMING')) return { bg: 'var(--accent-green-dim)', color: 'var(--accent-green)' }
  return { bg: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)' }
}

function InclusionBar({ rate }) {
  const color = rate < 20 ? 'var(--accent-red)' : rate < 60 ? 'var(--accent-amber)' : 'var(--accent-green)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px', overflow: 'hidden', minWidth: '60px' }}>
        <div style={{ width: `${Math.max(rate, 2)}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 700, color, minWidth: '36px', textAlign: 'right' }}>{rate}%</span>
    </div>
  )
}

function SkeletonPulse({ width, height = 14 }) {
  return (
    <div style={{
      width, height,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '6px',
    }} />
  )
}

export default function StoreHealth({ data, loading, onBack }) {
  const products = data?.products || []
  const avgRate = products.length
    ? (products.reduce((s, p) => s + p.inclusion_rate, 0) / products.length).toFixed(1)
    : 0
  const aiReady = products.filter(p => p.inclusion_rate > 85).length
  const invisible = products.filter(p => p.inclusion_rate < 60).length

  if (loading) {
    return (
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card-static" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <SkeletonPulse width="60%" height={16} />
              <SkeletonPulse width="40%" height={12} />
              <SkeletonPulse width="80%" height={8} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px 60px' }}>
      {/* ── Header ── */}
      <div className="animate-in" style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '6px' }}>
          Your store's AI readiness
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Across {data?.query_bank?.length || 7} real shopping queries, here's how AI agents see your catalog
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="animate-in stagger-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '28px' }}>
        {[
          { label: 'AI Visibility Score', value: `${avgRate}%`, sub: `across ${data?.query_bank?.length || 7} queries`, color: 'var(--text-primary)' },
          { label: 'Products Scanned', value: products.length, sub: 'in your catalog', color: 'var(--text-primary)' },
          { label: 'AI-Ready', value: aiReady, sub: 'no action needed', color: 'var(--accent-green)' },
          { label: 'Invisible to AI', value: invisible, sub: 'action required', color: 'var(--accent-red)' },
        ].map(stat => (
          <div key={stat.label} className="card-static" style={{ padding: '18px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
            <p style={{ fontSize: '28px', fontWeight: 800, color: stat.color, lineHeight: 1, marginBottom: '4px', letterSpacing: '-0.03em' }}>{stat.value}</p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Priority list ── */}
      <div className="animate-in stagger-2" style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Fix these first</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Ranked by AI visibility — worst first</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {products.map((product, i) => {
            const style = getPriorityStyle(product.fix_priority)
            const priorityLabel = product.fix_priority.replace(/^[^\s]+\s/, '')
            const primaryIssue = product.issues?.[0]?.replace(/_/g, ' ') || '—'
            const isCritical = product.fix_priority?.includes('CRITICAL')

            return (
              <div
                key={product.id}
                style={{
                  background: i === 0 && isCritical ? 'linear-gradient(135deg, rgba(255,71,87,0.06), rgba(255,71,87,0.02))' : 'var(--bg-card)',
                  border: `1px solid ${i === 0 && isCritical ? 'rgba(255,71,87,0.2)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: i === 0 && isCritical ? '16px 18px' : '12px 18px',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  animation: 'fadeInUp 0.3s ease both',
                  animationDelay: `${0.2 + i * 0.05}s`,
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', minWidth: '22px' }}>#{i + 1}</span>
                <div style={{ minWidth: '160px', maxWidth: '190px' }}>
                  <p style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)', marginBottom: '2px', lineHeight: 1.3 }}>{product.name}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>₹{product.price}</p>
                </div>
                <div style={{ flex: 1 }}><InclusionBar rate={product.inclusion_rate} /></div>
                <span style={{
                  background: style.bg, color: style.color, borderRadius: '4px',
                  padding: '3px 10px', fontSize: '10px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                  whiteSpace: 'nowrap', minWidth: '90px', textAlign: 'center',
                }}>{priorityLabel}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '120px', maxWidth: '140px' }}>{primaryIssue}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Back ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button onClick={onBack} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 20px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
      </div>
    </div>
  )
}
