import { useState } from 'react'

const BEFORE_DATA = [
  { field: 'description', label: 'Description', before: '"Great protein bar. Buy now!"', after: '"24g whey protein, 5g sugar, real strawberry pieces, B vitamins for sustained energy."' },
  { field: 'return_policy', label: 'Return Policy', before: 'null — not specified', after: '"Free returns within 30 days. Full refund in 3–5 days."' },
  { field: 'shipping', label: 'Shipping', before: '"Standard delivery"', after: '"Free delivery on all orders, 3–5 business days."' },
  { field: 'ingredients', label: 'Ingredients', before: 'null — not specified', after: '"Whey Protein Isolate, Strawberry Pieces, Oats, Dark Chocolate, B Vitamins"' },
  { field: 'rating', label: 'Rating', before: '2.8★', after: '4.6★' },
  { field: 'reviews', label: 'Reviews', before: '6 reviews', after: '187 reviews' },
]

function DataRow({ label, value, isGood }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '9px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', flexShrink: 0, paddingTop: '1px' }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'DM Mono, monospace',
        fontSize: '12px',
        color: isGood ? 'var(--green)' : 'var(--red)',
        textAlign: 'right',
        lineHeight: 1.4,
      }}>
        {value}
      </span>
    </div>
  )
}

export default function BeforeAfter() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleRun = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/rerun', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isSuccess = result?.verdict === 'IMPROVEMENT CONFIRMED'

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Before & After Analysis</h1>
        <p className="page-subtitle">
          See how improving product data changes AI recommendation outcomes
        </p>
      </div>

      {/* Focus product banner */}
      <div style={{
        background: 'var(--amber-light)',
        border: '1px solid var(--amber-border)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '16px',
      }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
            Demo Product
          </p>
          <p style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '6px' }}>
            PowerZone Protein Bar – Strawberry Blast
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
            ID: p7 · Original ₹329 → Improved ₹449 · Query: best protein bar under ₹500 with free returns
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={handleRun}
          disabled={loading}
          style={{ flexShrink: 0 }}
        >
          {loading ? (
            <>
              <span style={{
                width: '14px', height: '14px',
                border: '2px solid rgba(255,255,255,0.4)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
                flexShrink: 0,
              }} />
              Analyzing…
            </>
          ) : 'Run Analysis'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'var(--red-light)', border: '1px solid var(--red-border)',
          borderRadius: 'var(--radius-md)', padding: '14px 18px',
          color: 'var(--red)', fontSize: '13px', marginBottom: '20px',
        }}>
          <strong>Error: </strong>{error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          {[0, 1].map(i => (
            <div key={i} className="card-padded" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="skeleton" style={{ height: '14px', width: '30%' }} />
              <div className="skeleton" style={{ height: '48px' }} />
              <div className="skeleton" style={{ height: '12px', width: '80%' }} />
              <div className="skeleton" style={{ height: '12px', width: '60%' }} />
              <div className="skeleton" style={{ height: '12px', width: '70%' }} />
              <div className="skeleton" style={{ height: '12px', width: '50%' }} />
            </div>
          ))}
        </div>
      )}

      {/* Results: Before / After columns */}
      {result && !loading && (
        <div style={{ animation: 'fadeInUp 0.35s ease both' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>

            {/* BEFORE card */}
            <div className="card-padded">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  BEFORE
                </span>
                <span className="badge-neutral">Original data</span>
              </div>

              {/* Status block */}
              <div style={{
                background: 'var(--red-light)',
                border: '1px solid var(--red-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px 16px',
                marginBottom: '16px',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--red)', marginBottom: '8px' }}>
                  ✗ REJECTED
                </p>
                <p style={{ fontSize: '11px', color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '6px' }}>
                  Reason rejected:
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                  "{result.before?.reason}"
                </p>
              </div>

              {/* Data quality */}
              <p className="section-title">Data Quality</p>
              <DataRow label="Description" value='"Great protein bar. Buy now!"' isGood={false} />
              <DataRow label="Return Policy" value="null — not specified" isGood={false} />
              <DataRow label="Shipping" value='"Standard delivery"' isGood={false} />
              <DataRow label="Ingredients" value="null — not specified" isGood={false} />
              <DataRow label="Rating" value="2.8★" isGood={false} />
              <DataRow label="Reviews" value="6 reviews" isGood={false} />
            </div>

            {/* AFTER card */}
            <div className="card-padded">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  AFTER
                </span>
                <span className="badge-success">Improved data</span>
              </div>

              {/* Status block */}
              <div style={{
                background: isSuccess ? 'var(--green-light)' : 'var(--red-light)',
                border: `1px solid ${isSuccess ? 'var(--green-border)' : 'var(--red-border)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '14px 16px',
                marginBottom: '16px',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '18px', fontWeight: 600, color: isSuccess ? 'var(--green)' : 'var(--red)', marginBottom: '8px' }}>
                  {isSuccess ? '✓ SELECTED' : '✗ STILL REJECTED'}
                </p>
                <p style={{ fontSize: '11px', color: isSuccess ? 'var(--green)' : 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '6px' }}>
                  {isSuccess ? 'Reason chosen:' : 'Reason rejected:'}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                  "{result.after?.reason}"
                </p>
              </div>

              {/* Data quality */}
              <p className="section-title">Data Quality</p>
              <DataRow label="Description" value='"24g whey, 5g sugar, real strawberry, B vitamins…"' isGood />
              <DataRow label="Return Policy" value='"Free returns within 30 days"' isGood />
              <DataRow label="Shipping" value='"Free delivery on all orders"' isGood />
              <DataRow label="Ingredients" value='"Whey Isolate, Strawberry, Oats, Dark Choc…"' isGood />
              <DataRow label="Rating" value="4.6★" isGood />
              <DataRow label="Reviews" value="187 reviews" isGood />
            </div>
          </div>

          {/* What Changed table */}
          <div className="card-padded" style={{ marginBottom: '16px' }}>
            <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '16px', color: 'var(--text-primary)' }}>
              What Changed
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Before</th>
                    <th style={{ width: '24px' }}></th>
                    <th>After</th>
                  </tr>
                </thead>
                <tbody>
                  {BEFORE_DATA.map(row => (
                    <tr key={row.field}>
                      <td style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {row.field}
                      </td>
                      <td style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: 'var(--red)', textDecoration: 'line-through', maxWidth: '200px' }}>
                        {row.before}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>→</td>
                      <td style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: 'var(--green)', fontWeight: 500, maxWidth: '220px' }}>
                        {row.after}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delta table from API (if available) */}
          {result.delta && result.delta.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                API-returned changes:
              </p>
            </div>
          )}

          {/* Verdict banner */}
          <div style={{
            background: isSuccess ? 'var(--green-light)' : 'var(--amber-light)',
            border: `1px solid ${isSuccess ? 'var(--green-border)' : 'var(--amber-border)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}>
            <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>
              {isSuccess ? '✓' : '⚠'}
            </span>
            <p style={{
              fontSize: '14px',
              fontWeight: 500,
              color: isSuccess ? 'var(--green)' : 'var(--amber)',
              lineHeight: 1.5,
            }}>
              {isSuccess
                ? 'Improvement confirmed — fixing data quality moved this product from REJECTED to SELECTED across the same query and competitor set.'
                : 'Partially improved — the product\'s ranking improved but further data fixes are needed. Review the rejection reason above for the next step.'}
            </p>
          </div>
        </div>
      )}

      {/* Instructional state when no result yet */}
      {!result && !loading && !error && (
        <div className="card-padded" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</p>
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Run the analysis to see the comparison
          </p>
          <p style={{ fontSize: '13px' }}>
            Calls the AI agent twice — once with the original data, once with improved data — and shows you the difference in outcome.
          </p>
        </div>
      )}
    </div>
  )
}
