import { useState } from 'react'

const card = {
  background: '#FFFFFF',
  borderRadius: '8px',
  border: '1px solid #E1E3E5',
  padding: '20px',
}

const DIAGNOSTIC_KEYWORDS = [
  'return policy', 'shipping', 'reviews', 'description', 'ingredients',
  'vague', 'promotional', 'delivery', 'trust', 'rating',
]

function highlightReason(text) {
  if (!text) return text
  const parts = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    let matchIndex = -1
    let matchWord = ''

    for (const kw of DIAGNOSTIC_KEYWORDS) {
      const idx = remaining.toLowerCase().indexOf(kw)
      if (idx !== -1 && (matchIndex === -1 || idx < matchIndex)) {
        matchIndex = idx
        matchWord = kw
      }
    }

    if (matchIndex === -1) {
      parts.push(<span key={key++}>{remaining}</span>)
      break
    }

    if (matchIndex > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, matchIndex)}</span>)
    }

    parts.push(
      <span key={key++} style={{
        background: '#FFF4F4',
        color: '#D72C0D',
        borderRadius: '3px',
        padding: '0 3px',
        fontWeight: 500,
      }}>
        {remaining.slice(matchIndex, matchIndex + matchWord.length)}
      </span>
    )

    remaining = remaining.slice(matchIndex + matchWord.length)
  }

  return parts
}

function Skeleton() {
  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      {[0, 1].map(col => (
        <div key={col} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ ...card, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ height: '14px', width: '60%', background: '#E1E3E5', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: '12px', width: '90%', background: '#E1E3E5', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: '12px', width: '80%', background: '#E1E3E5', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

const SUGGESTED_QUERIES = [
  'High protein with reviews',
  'Vegan bar with ingredients',
  'Fast shipping under ₹400',
]

export default function Simulate() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const runSimulation = () => {
    if (!query.trim()) return
    setLoading(true)
    setResult(null)
    setError(null)

    fetch('/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.trim() }),
    })
      .then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.error || `HTTP ${r.status}`) })
        return r.json()
      })
      .then(data => { setResult(data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') runSimulation()
  }

  return (
    <div style={{ maxWidth: '960px' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#202223', marginBottom: '4px' }}>
          Simulate AI Query
        </h1>
        <p style={{ fontSize: '14px', color: '#8C9196' }}>
          See which products an AI agent would recommend for any search
        </p>
      </div>

      {/* ── Query input card ── */}
      <div style={{ ...card, marginBottom: '24px' }}>
        <label style={{ display: 'block', fontWeight: 500, fontSize: '14px', color: '#202223', marginBottom: '8px' }}>
          Enter a buyer query
        </label>

        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. best protein bar under ₹500 with free returns"
          style={{
            width: '100%',
            border: '1px solid #C9CDD2',
            borderRadius: '6px',
            padding: '10px 12px',
            fontSize: '14px',
            fontFamily: 'inherit',
            color: '#202223',
            outline: 'none',
            marginBottom: '12px',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => {
            e.target.style.borderColor = '#008060'
            e.target.style.boxShadow = '0 0 0 3px rgba(0,128,96,0.1)'
          }}
          onBlur={e => {
            e.target.style.borderColor = '#C9CDD2'
            e.target.style.boxShadow = 'none'
          }}
        />

        {/* Suggested query chips */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#6D7175', alignSelf: 'center' }}>Try:</span>
          {SUGGESTED_QUERIES.map(q => (
            <button
              key={q}
              onClick={() => setQuery(q)}
              style={{
                background: '#FFFFFF',
                border: '1px solid #C9CDD2',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                cursor: 'pointer',
                color: '#202223',
                fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.target.style.background = '#F1F2F4'}
              onMouseLeave={e => e.target.style.background = '#FFFFFF'}
            >
              {q}
            </button>
          ))}
        </div>

        <button
          onClick={runSimulation}
          disabled={loading || !query.trim()}
          style={{
            width: '100%',
            background: loading || !query.trim() ? '#C9CDD2' : '#008060',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 16px',
            fontWeight: 500,
            fontSize: '14px',
            cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}
        >
          {loading ? 'Running Simulation…' : 'Run Simulation'}
        </button>

        {error && (
          <p style={{ marginTop: '12px', fontSize: '13px', color: '#D72C0D' }}>
            ⚠ {error}
          </p>
        )}
      </div>

      {/* ── Results ── */}
      {loading && <Skeleton />}

      {result && !loading && (
        <div>
          <p style={{ fontSize: '12px', color: '#8C9196', marginBottom: '12px' }}>
            Results for: <em>"{result.query}"</em>
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Selected */}
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#008060', marginBottom: '10px' }}>
                ✅ Recommended ({result.selected?.length || 0})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {result.selected?.map(p => (
                  <div key={p.id} style={{
                    ...card,
                    borderLeft: '3px solid #008060',
                    padding: '14px 16px',
                  }}>
                    <p style={{ fontWeight: 600, fontSize: '13px', color: '#202223', marginBottom: '6px' }}>
                      {p.name}
                    </p>
                    <p style={{ fontSize: '11px', color: '#8C9196', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Reason chosen:
                    </p>
                    <p style={{ fontSize: '13px', color: '#202223', lineHeight: 1.5 }}>
                      {p.reason_chosen}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Rejected */}
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#D72C0D', marginBottom: '10px' }}>
                ❌ Not Recommended ({result.rejected?.length || 0})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {result.rejected?.map(p => (
                  <div key={p.id} style={{
                    ...card,
                    borderLeft: '3px solid #D72C0D',
                    padding: '14px 16px',
                  }}>
                    <p style={{ fontWeight: 600, fontSize: '13px', color: '#202223', marginBottom: '6px' }}>
                      {p.name}
                    </p>
                    <p style={{ fontSize: '11px', color: '#8C9196', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Reason skipped:
                    </p>
                    <p style={{ fontSize: '13px', color: '#202223', lineHeight: 1.5 }}>
                      {highlightReason(p.reason_rejected)}
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
