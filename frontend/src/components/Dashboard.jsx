import { useState, useEffect } from 'react'

const card = {
  background: '#FFFFFF',
  borderRadius: '8px',
  border: '1px solid #E1E3E5',
  padding: '20px',
}

function getPriorityBadge(priority) {
  if (!priority) return null
  if (priority.includes('CRITICAL'))       return { bg: '#FFF4F4', color: '#D72C0D' }
  if (priority.includes('NEEDS WORK'))     return { bg: '#FFF5EA', color: '#B98900' }
  if (priority.includes('MINOR FIXES'))   return { bg: '#F2FFF8', color: '#008060' }
  if (priority.includes('PERFORMING'))    return { bg: '#F2FFF8', color: '#008060' }
  return { bg: '#F1F2F4', color: '#6D7175' }
}

function InclusionBar({ rate }) {
  const color = rate < 20 ? '#D72C0D' : rate < 60 ? '#FFC453' : '#008060'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
      <div style={{
        flex: 1,
        height: '8px',
        background: '#E1E3E5',
        borderRadius: '4px',
        overflow: 'hidden',
        minWidth: '80px',
      }}>
        <div style={{
          width: `${Math.max(rate, 2)}%`,
          height: '100%',
          background: color,
          borderRadius: '4px',
          transition: 'width 0.6s ease',
        }} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: 600, color, minWidth: '38px' }}>
        {rate}%
      </span>
    </div>
  )
}

function Skeleton() {
  const block = (w, h = 16) => (
    <div style={{
      width: w,
      height: h,
      background: '#E1E3E5',
      borderRadius: '4px',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ ...card, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {block('60%', 16)}
          {block('40%', 12)}
          {block('80%', 8)}
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAudit = () => {
    setLoading(true)
    setError(null)
    fetch('/api/audit')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`)
        return r.json()
      })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }

  useEffect(() => { fetchAudit() }, [])

  if (error) return (
    <div style={{ ...card, color: '#D72C0D' }}>
      <strong>Error loading audit report.</strong><br />
      <span style={{ fontSize: '12px', color: '#6D7175' }}>{error}</span><br />
      <span style={{ fontSize: '12px', color: '#6D7175' }}>Make sure you've run <code>node audit.js</code> to generate audit_report.json.</span>
    </div>
  )

  const products = data?.products || []
  const avgRate = products.length
    ? (products.reduce((s, p) => s + p.inclusion_rate, 0) / products.length).toFixed(1)
    : 0
  const wellCount = products.filter(p => p.inclusion_rate > 85).length
  const fixCount  = products.filter(p => p.inclusion_rate < 60).length
  const topPerformers = products.filter(p => p.inclusion_rate > 85)

  return (
    <div style={{ maxWidth: '960px' }}>
      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#202223', marginBottom: '4px' }}>
            Store AI Audit Report
          </h1>
          <p style={{ fontSize: '14px', color: '#8C9196' }}>
            See how AI shopping agents perceive your store
          </p>
        </div>
        <button onClick={fetchAudit} style={{
          background: '#008060',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '6px',
          padding: '8px 16px',
          fontWeight: 500,
          fontSize: '14px',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          Re-run Audit
        </button>
      </div>

      {loading ? <Skeleton /> : (
        <>
          {/* ── Stat cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Avg Inclusion Rate', value: `${avgRate}%`, sub: 'across 7 queries', valueColor: '#202223' },
              { label: 'Products Audited', value: products.length, sub: 'in your store', valueColor: '#202223' },
              { label: 'Performing Well', value: wellCount, sub: 'no action needed', valueColor: '#008060' },
              { label: 'Need Fixes', value: fixCount, sub: 'action required', valueColor: '#D72C0D' },
            ].map(stat => (
              <div key={stat.label} style={card}>
                <p style={{ fontSize: '12px', color: '#6D7175', marginBottom: '8px', fontWeight: 500 }}>{stat.label}</p>
                <p style={{ fontSize: '28px', fontWeight: 600, color: stat.valueColor, lineHeight: 1, marginBottom: '4px' }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: '12px', color: '#8C9196' }}>{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Priority Action Plan ── */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '12px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#202223' }}>Priority Action Plan</h2>
              <p style={{ fontSize: '13px', color: '#8C9196', marginTop: '2px' }}>
                Ranked by AI visibility score — fix these first
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {products.map((product, i) => {
                const badge = getPriorityBadge(product.fix_priority)
                const priorityLabel = product.fix_priority.replace(/^[^\s]+\s/, '')
                return (
                  <div key={product.id} style={{
                    ...card,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '14px 20px',
                  }}>
                    {/* Rank */}
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#8C9196', minWidth: '24px' }}>
                      #{i + 1}
                    </span>

                    {/* Name + price */}
                    <div style={{ minWidth: '200px', maxWidth: '220px' }}>
                      <p style={{ fontWeight: 600, fontSize: '13px', color: '#202223', marginBottom: '2px', lineHeight: 1.3 }}>
                        {product.name}
                      </p>
                      <p style={{ fontSize: '12px', color: '#6D7175' }}>₹{product.price}</p>
                    </div>

                    {/* Progress bar */}
                    <div style={{ flex: 1 }}>
                      <InclusionBar rate={product.inclusion_rate} />
                    </div>

                    {/* Priority badge */}
                    <span style={{
                      background: badge?.bg,
                      color: badge?.color,
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '12px',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      minWidth: '110px',
                      textAlign: 'center',
                    }}>
                      {priorityLabel}
                    </span>

                    {/* Issue pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '220px' }}>
                      {product.issues && product.issues.length > 0
                        ? product.issues.map(issue => (
                          <span key={issue} style={{
                            background: '#F1F2F4',
                            color: '#6D7175',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '11px',
                          }}>
                            {issue.replace(/_/g, ' ')}
                          </span>
                        ))
                        : <span style={{ fontSize: '12px', color: '#8C9196' }}>—</span>
                      }
                    </div>

                    {/* View details button */}
                    <button style={{
                      background: '#FFFFFF',
                      border: '1px solid #C9CDD2',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      color: '#202223',
                      fontFamily: 'inherit',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}>
                      View Details
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Top Performers ── */}
          <div style={{
            background: '#F2FFF8',
            border: '1px solid #C9E8D1',
            borderRadius: '8px',
            padding: '20px',
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#202223', marginBottom: '12px' }}>
              ✅ Top Performers
            </h2>
            {topPerformers.length === 0
              ? <p style={{ color: '#6D7175', fontSize: '14px' }}>No products above 85% inclusion rate.</p>
              : topPerformers.map(p => (
                <div key={p.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid #C9E8D1',
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#202223' }}>{p.name}</span>
                  <span style={{
                    background: '#F2FFF8',
                    color: '#008060',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: '1px solid #C9E8D1',
                  }}>
                    {p.inclusion_rate}% inclusion rate
                  </span>
                </div>
              ))
            }
          </div>
        </>
      )}
    </div>
  )
}
