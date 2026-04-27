import { useState, useCallback } from 'react'

const KEYWORDS = ['return policy', 'shipping', 'reviews', 'description', 'ingredients', 'delivery', 'vague']

function highlightKeywords(text) {
  if (!text) return null
  const parts = []
  let remaining = text
  let key = 0
  while (remaining.length > 0) {
    let earliest = null
    for (const kw of KEYWORDS) {
      const idx = remaining.toLowerCase().indexOf(kw)
      if (idx !== -1 && (earliest === null || idx < earliest.idx)) {
        earliest = { idx, kw }
      }
    }
    if (!earliest) {
      parts.push(<span key={key++}>{remaining}</span>)
      break
    }
    const { idx, kw } = earliest
    if (idx > 0) parts.push(<span key={key++}>{remaining.slice(0, idx)}</span>)
    parts.push(
      <mark key={key++} style={{
        background: 'var(--red-light)',
        color: 'var(--red)',
        borderRadius: '2px',
        padding: '0 3px',
        fontStyle: 'normal',
      }}>
        {remaining.slice(idx, idx + kw.length)}
      </mark>
    )
    remaining = remaining.slice(idx + kw.length)
  }
  return parts
}

function SkeletonResults() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginTop: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="skeleton" style={{ height: '14px', width: '60%' }} />
        {[1, 2].map(i => (
          <div key={i} className="card-padded" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="skeleton" style={{ height: '14px', width: '80%' }} />
            <div className="skeleton" style={{ height: '11px', width: '50%' }} />
            <div className="skeleton" style={{ height: '12px', width: '100%' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="skeleton" style={{ height: '14px', width: '60%' }} />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card-padded" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="skeleton" style={{ height: '14px', width: '80%' }} />
            <div className="skeleton" style={{ height: '11px', width: '50%' }} />
            <div className="skeleton" style={{ height: '12px', width: '100%' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

const SUGGESTED = [
  'High protein with reviews',
  'Vegan bar with ingredients',
  'Fast shipping under ₹400',
]

export default function Simulate({ storeData }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [lastQuery, setLastQuery] = useState(null)

  const handleRun = useCallback(async (q) => {
    const queryToRun = (q || query).trim()
    if (!queryToRun) return
    setLoading(true)
    setError(null)
    setResult(null)
    setLastQuery(queryToRun)

    try {
      // Use live-simulate if connected to a store, otherwise fall back to mock
      let res, data
      if (storeData?.domain && storeData?.accessToken) {
        res = await fetch('/api/live-simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: storeData.domain, accessToken: storeData.accessToken, query: queryToRun }),
        })
        data = await res.json()
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
        setResult(data.result)
      } else {
        res = await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: queryToRun }),
        })
        data = await res.json()
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
        setResult(data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [query, storeData])

  const handleSuggestion = (s) => {
    setQuery(s)
    handleRun(s)
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Simulate AI Query</h1>
        <p className="page-subtitle">
          Test how an AI agent evaluates{' '}
          {storeData?.domain ? `${storeData.domain}` : 'the mock store'} for any buyer search
        </p>
      </div>

      {/* Mode badge */}
      <div style={{ marginBottom: '16px' }}>
        {storeData?.domain ? (
          <span className="badge-success">● Live: {storeData.domain}</span>
        ) : (
          <span className="badge-neutral">● Demo mode — using mock store data</span>
        )}
      </div>

      {/* Query card */}
      <div className="card-padded" style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Enter a buyer query
        </label>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
          <input
            className="input-field"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. best protein bar with free returns"
            onKeyDown={e => e.key === 'Enter' && handleRun()}
          />
          <button
            className="btn-primary"
            onClick={() => handleRun()}
            disabled={loading || !query.trim()}
            style={{ flexShrink: 0 }}
          >
            {loading ? (
              <span style={{
                width: '14px', height: '14px',
                border: '2px solid rgba(255,255,255,0.4)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
                display: 'inline-block',
              }} />
            ) : 'Run'}
          </button>
        </div>

        {/* Suggested queries */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Try:</span>
          {SUGGESTED.map(s => (
            <button
              key={s}
              onClick={() => handleSuggestion(s)}
              disabled={loading}
              style={{
                background: 'white',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontFamily: 'DM Sans, sans-serif',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--green)'
                e.currentTarget.style.color = 'var(--green)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && <SkeletonResults />}

      {/* Error */}
      {error && !loading && (
        <div style={{
          background: 'var(--red-light)', border: '1px solid var(--red-border)',
          borderRadius: 'var(--radius-md)', padding: '14px 18px',
          color: 'var(--red)', fontSize: '13px',
        }}>
          <strong>Error: </strong>{error}
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div style={{ animation: 'fadeInUp 0.3s ease both' }}>
          <div style={{
            marginBottom: '14px',
            padding: '10px 14px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            fontFamily: 'DM Mono, monospace',
          }}>
            Query: "{lastQuery}"
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>

            {/* Selected */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--green)' }}>
                  ✓ Recommended
                </span>
                <span className="badge-success">{result.selected?.length || 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(result.selected || []).map((p, i) => (
                  <div key={p.id || i} className="card" style={{
                    padding: '16px',
                    borderLeft: '3px solid var(--green)',
                    animation: `fadeInUp 0.3s ease both`,
                    animationDelay: `${i * 0.06}s`,
                  }}>
                    <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>
                      {p.name}
                    </p>
                    <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                      Reason selected
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {p.reason_chosen}
                    </p>
                  </div>
                ))}
                {(!result.selected || result.selected.length === 0) && (
                  <div className="card-padded" style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
                    No products selected
                  </div>
                )}
              </div>
            </div>

            {/* Rejected */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--red)' }}>
                  ✗ Not Recommended
                </span>
                <span className="badge-critical">{result.rejected?.length || 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(result.rejected || []).map((p, i) => (
                  <div key={p.id || i} className="card" style={{
                    padding: '16px',
                    borderLeft: '3px solid var(--red)',
                    animation: `fadeInUp 0.3s ease both`,
                    animationDelay: `${i * 0.04}s`,
                  }}>
                    <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>
                      {p.name}
                    </p>
                    <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                      Reason skipped
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {highlightKeywords(p.reason_rejected)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
