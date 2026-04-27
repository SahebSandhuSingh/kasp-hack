import { useState, useEffect, useCallback } from 'react'

function getRateColor(rate) {
  if (rate < 20) return 'var(--red)'
  if (rate < 60) return 'var(--amber)'
  return 'var(--green)'
}

function getRateBarColor(rate) {
  if (rate < 20) return 'var(--red)'
  if (rate < 60) return 'var(--amber)'
  return 'var(--green)'
}

function PriorityBadge({ priority }) {
  if (!priority) return null
  if (priority.includes('CRITICAL')) return <span className="badge-critical">Critical</span>
  if (priority.includes('NEEDS WORK')) return <span className="badge-warning">Needs Work</span>
  if (priority.includes('MINOR')) return <span className="badge-neutral">Minor Fixes</span>
  return <span className="badge-success">Good</span>
}

function InclusionBar({ rate, animate }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (animate) {
      const t = setTimeout(() => setWidth(rate), 100)
      return () => clearTimeout(t)
    } else {
      setWidth(rate)
    }
  }, [rate, animate])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '140px', height: '6px',
        background: 'var(--border)',
        borderRadius: '3px',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{
          width: `${Math.max(width, 1)}%`,
          height: '100%',
          background: getRateBarColor(rate),
          borderRadius: '3px',
          transition: 'width 0.6s ease',
        }} />
      </div>
      <span style={{
        fontFamily: 'DM Mono, monospace',
        fontSize: '13px',
        fontWeight: 500,
        color: getRateColor(rate),
        minWidth: '36px',
      }}>
        {rate}%
      </span>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card-padded" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div className="skeleton" style={{ width: '60%', height: '16px' }} />
      <div className="skeleton" style={{ width: '40%', height: '12px' }} />
      <div className="skeleton" style={{ width: '80%', height: '8px' }} />
    </div>
  )
}

export default function Dashboard({ auditData, storeData, setAuditData, storeCredentials }) {
  const [animate, setAnimate] = useState(false)
  const [rerunLoading, setRerunLoading] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 100)
    return () => clearTimeout(t)
  }, [auditData])

  const handleRerun = useCallback(async () => {
    if (!storeCredentials?.domain || !storeCredentials?.accessToken) return
    setRerunLoading(true)
    try {
      const res = await fetch('/api/live-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: storeCredentials.domain, accessToken: storeCredentials.accessToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setAuditData(data.audit)
    } catch (err) {
      console.error('Re-run failed:', err.message)
    } finally {
      setRerunLoading(false)
    }
  }, [storeCredentials, setAuditData])

  if (!auditData) {
    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <div style={{ marginBottom: '24px' }}>
          <div className="skeleton" style={{ width: '200px', height: '22px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '280px', height: '14px' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  const products = auditData.products || []
  const queryCount = auditData.query_bank?.length || 7
  const avg = products.length
    ? (products.reduce((s, p) => s + p.inclusion_rate, 0) / products.length).toFixed(1)
    : 0
  const aiReady = products.filter(p => p.inclusion_rate > 85).length
  const needsFixes = products.filter(p => p.inclusion_rate < 60).length
  const topPerformers = products.filter(p => p.inclusion_rate > 85)

  const isLive = !!storeData?.domain
  const storeName = isLive ? storeData.domain : 'Demo Store — Mock Data'

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Store AI Audit Report</h1>
          <p className="page-subtitle" style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>
            {storeName}
          </p>
        </div>
        {isLive && (
          <button
            className="btn-secondary"
            style={{ fontSize: '13px', padding: '7px 14px' }}
            onClick={handleRerun}
            disabled={rerunLoading}
          >
            {rerunLoading ? (
              <>
                <span style={{
                  width: '12px', height: '12px',
                  border: '2px solid var(--border)',
                  borderTopColor: 'var(--text-secondary)',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Running…
              </>
            ) : '↻ Re-run Audit'}
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {[
          {
            label: 'Avg AI Inclusion Rate',
            value: `${avg}%`,
            color: getRateColor(parseFloat(avg)),
            sub: `across ${queryCount} buyer queries`,
          },
          {
            label: 'Products Audited',
            value: products.length,
            color: 'var(--text-primary)',
            sub: 'in your catalog',
          },
          {
            label: 'Performing Well',
            value: aiReady,
            color: 'var(--green)',
            sub: '>85% inclusion rate',
          },
          {
            label: 'Need Attention',
            value: needsFixes,
            color: 'var(--red)',
            sub: '<60% inclusion rate',
          },
        ].map(stat => (
          <div key={stat.label} className="card-padded">
            <p className="section-title" style={{ marginBottom: '8px' }}>{stat.label}</p>
            <p style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '32px',
              fontWeight: 700,
              color: stat.color,
              lineHeight: 1,
              marginBottom: '6px',
            }}>
              {stat.value}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Priority action plan */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ marginBottom: '14px' }}>
          <p className="section-title" style={{ marginBottom: '2px' }}>Priority Action Plan</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Ranked by AI visibility score — fix these first
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Column header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 180px 120px 1fr 90px',
            gap: '12px',
            padding: '8px 16px',
            alignItems: 'center',
          }}>
            {['#', 'Product', 'AI Visibility', 'Priority', 'Issues', ''].map((h, i) => (
              <span key={i} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {h}
              </span>
            ))}
          </div>

          {products.map((product, i) => {
            const issues = product.issues || []
            return (
              <div
                key={product.id}
                className="card"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr 180px 120px 1fr 90px',
                  gap: '12px',
                  padding: '14px 16px',
                  alignItems: 'center',
                  background: i % 2 === 1 ? 'var(--bg-page)' : 'var(--bg-surface)',
                  animation: `fadeInUp 0.3s ease both`,
                  animationDelay: `${i * 0.04}s`,
                }}
              >
                {/* Rank */}
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px', color: 'var(--text-muted)' }}>
                  #{i + 1}
                </span>

                {/* Product info */}
                <div>
                  <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                    {product.name}
                  </p>
                  <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                    ₹{product.price}
                  </p>
                </div>

                {/* Inclusion bar */}
                <InclusionBar rate={product.inclusion_rate} animate={animate} />

                {/* Priority badge */}
                <div><PriorityBadge priority={product.fix_priority} /></div>

                {/* Issues */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {issues.slice(0, 3).map(issue => (
                    <span key={issue} style={{
                      background: 'var(--bg-surface-2)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      padding: '2px 7px',
                      fontSize: '11px',
                      fontFamily: 'DM Mono, monospace',
                    }}>
                      {issue.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {issues.length === 0 && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                  )}
                </div>

                {/* Details button — placeholder for future deep-dive */}
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    fontFamily: 'DM Mono, monospace',
                    fontWeight: 500,
                  }}>
                    {product.selected_count}/{product.selected_count + product.rejected_count}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top performers */}
      {topPerformers.length > 0 && (
        <div className="card-padded" style={{ borderLeft: '3px solid var(--green)', borderRadius: '0 var(--radius-md) var(--radius-md) 0', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Performing Well</p>
            <span className="badge-success">✓ {topPerformers.length} products</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topPerformers.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, flex: 1, color: 'var(--text-primary)' }}>{p.name}</span>
                <InclusionBar rate={p.inclusion_rate} animate={animate} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Query bank used */}
      {auditData.query_bank && (
        <div className="card-padded" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
          <p className="section-title">Queries Used in This Audit</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {auditData.query_bank.map((q, i) => (
              <span key={i} style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                fontFamily: 'DM Mono, monospace',
              }}>
                {q}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
