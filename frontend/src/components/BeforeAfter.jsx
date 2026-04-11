import { useState } from 'react'

const card = {
  background: '#FFFFFF',
  borderRadius: '8px',
  border: '1px solid #E1E3E5',
  padding: '20px',
}

const ORIGINAL_FIELDS = [
  { label: 'Return Policy', value: 'null — NOT SPECIFIED' },
  { label: 'Shipping', value: 'null — NOT SPECIFIED' },
  { label: 'Reviews', value: '6 reviews' },
  { label: 'Rating', value: '2.8 / 5' },
  { label: 'Description', value: 'Vague promotional text' },
  { label: 'Ingredients', value: 'null — NOT SPECIFIED' },
]

const IMPROVED_FIELDS = [
  { label: 'Return Policy', value: 'Free 30-day returns' },
  { label: 'Shipping', value: 'Free delivery, 3–5 days' },
  { label: 'Reviews', value: '187 reviews' },
  { label: 'Rating', value: '4.6 / 5' },
  { label: 'Description', value: 'Detailed 4-sentence description' },
  { label: 'Ingredients', value: 'Full ingredient list' },
]

function Skeleton() {
  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      {[0, 1].map(col => (
        <div key={col} style={{ flex: 1, ...card, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ height: '16px', width: '40%', background: '#E1E3E5', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: '12px', width: '80%', background: '#E1E3E5', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: '12px', width: '60%', background: '#E1E3E5', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: '12px', width: '90%', background: '#E1E3E5', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: '12px', width: '70%', background: '#E1E3E5', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
      ))}
    </div>
  )
}

function DataField({ label, value, variant }) {
  const color = variant === 'bad' ? '#D72C0D' : '#008060'
  const bg    = variant === 'bad' ? '#FFF4F4' : '#F2FFF8'
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderBottom: '1px solid #F1F2F4',
      gap: '12px',
    }}>
      <span style={{ fontSize: '12px', color: '#6D7175', fontWeight: 500, minWidth: '100px' }}>{label}</span>
      <span style={{
        fontSize: '12px',
        color,
        background: bg,
        borderRadius: '4px',
        padding: '2px 8px',
        fontWeight: 500,
        textAlign: 'right',
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

  const runAnalysis = () => {
    setLoading(true)
    setResult(null)
    setError(null)

    fetch('/api/rerun', { method: 'POST' })
      .then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.error || `HTTP ${r.status}`) })
        return r.json()
      })
      .then(data => { setResult(data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }

  const improved = result?.verdict === 'IMPROVEMENT_CONFIRMED'

  return (
    <div style={{ maxWidth: '960px' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#202223', marginBottom: '4px' }}>
          Before & After Analysis
        </h1>
        <p style={{ fontSize: '14px', color: '#8C9196' }}>
          See how fixing product data improves AI recommendation visibility
        </p>
      </div>

      {/* ── Product spotlight ── */}
      <div style={{ ...card, marginBottom: '24px' }}>
        {/* Warning banner */}
        <div style={{
          background: '#FFF5EA',
          border: '1px solid #FFC453',
          borderRadius: '6px',
          padding: '10px 14px',
          marginBottom: '16px',
          fontSize: '13px',
          color: '#B98900',
          fontWeight: 500,
        }}>
          💡 Demo Product: This product was fixed to show improvement
        </div>

        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '11px', color: '#8C9196', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
            Focus Product
          </p>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#202223', marginBottom: '2px' }}>
            PowerZone Protein Bar – Strawberry Blast
          </h2>
          <p style={{ fontSize: '13px', color: '#6D7175' }}>
            ID: p7 · Original price ₹329 → Improved ₹449 · Query: "best protein bar under ₹500 with free returns"
          </p>
        </div>

        <button
          onClick={runAnalysis}
          disabled={loading}
          style={{
            background: loading ? '#C9CDD2' : '#008060',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 20px',
            fontWeight: 500,
            fontSize: '14px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {loading ? 'Running Analysis… (~30s)' : 'Run Analysis'}
        </button>

        {error && (
          <p style={{ marginTop: '12px', fontSize: '13px', color: '#D72C0D' }}>⚠ {error}</p>
        )}
      </div>

      {loading && <Skeleton />}

      {result && !loading && (
        <>
          {/* ── Before / After cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* BEFORE */}
            <div style={{ ...card }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontWeight: 600, fontSize: '14px', color: '#202223' }}>BEFORE</h3>
                <span style={{ background: '#F1F2F4', color: '#6D7175', borderRadius: '4px', padding: '2px 8px', fontSize: '12px' }}>
                  Original data
                </span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px',
                padding: '8px 12px', background: '#FFF4F4', borderRadius: '6px',
              }}>
                <span style={{ fontSize: '16px' }}>❌</span>
                <span style={{ fontWeight: 600, color: '#D72C0D', fontSize: '14px' }}>REJECTED</span>
              </div>
              <p style={{ fontSize: '11px', color: '#8C9196', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Reason rejected:
              </p>
              <p style={{ fontSize: '13px', color: '#202223', lineHeight: 1.5, marginBottom: '16px' }}>
                {result.before?.reason}
              </p>
              <p style={{ fontSize: '11px', color: '#8C9196', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Data quality:
              </p>
              {ORIGINAL_FIELDS.map(f => <DataField key={f.label} {...f} variant="bad" />)}
            </div>

            {/* AFTER */}
            <div style={{ ...card }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontWeight: 600, fontSize: '14px', color: '#202223' }}>AFTER</h3>
                <span style={{ background: '#F2FFF8', color: '#008060', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', border: '1px solid #C9E8D1' }}>
                  Improved data
                </span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px',
                padding: '8px 12px',
                background: result.after?.status === 'selected' ? '#F2FFF8' : '#FFF4F4',
                borderRadius: '6px',
              }}>
                <span style={{ fontSize: '16px' }}>{result.after?.status === 'selected' ? '✅' : '❌'}</span>
                <span style={{
                  fontWeight: 600,
                  color: result.after?.status === 'selected' ? '#008060' : '#D72C0D',
                  fontSize: '14px'
                }}>
                  {result.after?.status === 'selected' ? 'SELECTED' : 'STILL REJECTED'}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#8C9196', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                {result.after?.status === 'selected' ? 'Reason chosen:' : 'Reason rejected:'}
              </p>
              <p style={{ fontSize: '13px', color: '#202223', lineHeight: 1.5, marginBottom: '16px' }}>
                {result.after?.reason}
              </p>
              <p style={{ fontSize: '11px', color: '#8C9196', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Data quality:
              </p>
              {IMPROVED_FIELDS.map(f => <DataField key={f.label} {...f} variant="good" />)}
            </div>
          </div>

          {/* ── Delta section ── */}
          <div style={{ ...card, marginBottom: '16px' }}>
            <h3 style={{ fontWeight: 600, fontSize: '16px', color: '#202223', marginBottom: '14px' }}>
              What Changed
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {result.delta?.map((row, i) => (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 24px 1fr',
                  alignItems: 'start',
                  gap: '10px',
                  padding: '10px 0',
                  borderBottom: i < result.delta.length - 1 ? '1px solid #F1F2F4' : 'none',
                }}>
                  <span style={{ fontWeight: 600, fontSize: '12px', color: '#202223', textTransform: 'capitalize' }}>
                    {row.field.replace(/_/g, ' ')}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: '#D72C0D',
                    textDecoration: 'line-through',
                    background: '#FFF4F4',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    lineHeight: 1.4,
                  }}>
                    {row.before}
                  </span>
                  <span style={{ fontSize: '16px', textAlign: 'center', color: '#6D7175' }}>→</span>
                  <span style={{
                    fontSize: '12px',
                    color: '#008060',
                    background: '#F2FFF8',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    lineHeight: 1.4,
                  }}>
                    {row.after}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Verdict banner ── */}
          <div style={{
            background: improved ? '#F2FFF8' : '#FFF5EA',
            border: `1px solid ${improved ? '#008060' : '#FFC453'}`,
            borderRadius: '8px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span style={{ fontSize: '20px' }}>{improved ? '✅' : '⚠️'}</span>
            <div>
              <p style={{ fontWeight: 600, fontSize: '14px', color: improved ? '#008060' : '#B98900' }}>
                {improved
                  ? 'Data quality improvement confirmed — this product moved from REJECTED to SELECTED'
                  : 'Product is still rejected. Review the reasoning above to identify remaining gaps.'
                }
              </p>
              {improved && (
                <p style={{ fontSize: '13px', color: '#6D7175', marginTop: '2px' }}>
                  This proves that data quality directly impacts AI recommendation visibility.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
