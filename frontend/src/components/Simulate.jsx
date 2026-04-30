import { useState } from 'react'
import { PRODUCTS, SIMULATE_QUERIES } from '../mockData'

// Deterministic scoring — assigns match score based on product data quality
function scoreProductForQuery(product, query) {
  const q = query.toLowerCase()
  let score = 0
  const reasons = []
  const weaknesses = []

  // Description quality
  const wordCount = (product.description || '').split(/\s+/).filter(Boolean).length
  if (wordCount >= 30) { score += 25; reasons.push('Detailed description') }
  else if (wordCount >= 10) { score += 10; reasons.push('Brief description') }
  else { weaknesses.push('Missing or vague description') }

  // Return policy
  if (product.returnPolicy) { score += 20; reasons.push('Clear return policy') }
  else if (q.includes('return')) { weaknesses.push('No return policy — query specifically asks for this') }
  else { weaknesses.push('No return policy') }

  // Shipping
  if (product.shipping) { score += 15; reasons.push('Shipping info available') }
  else if (q.includes('shipping') || q.includes('delivery')) { weaknesses.push('No shipping info — query asks for this') }
  else { weaknesses.push('No shipping info') }

  // Tags
  if (product.tags && product.tags.length >= 3) { score += 15; reasons.push('Rich product tags') }
  else { weaknesses.push('Few or no tags') }

  // Query keyword match
  const descLower = (product.description || '').toLowerCase()
  const nameLower = (product.name || '').toLowerCase()
  const combined = descLower + ' ' + nameLower + ' ' + (product.tags || []).join(' ').toLowerCase()
  const queryWords = q.split(/\s+/).filter(w => w.length > 3)
  const matched = queryWords.filter(w => combined.includes(w))
  if (matched.length > 0) {
    score += Math.min(25, matched.length * 8)
    reasons.push(`Matches ${matched.length} query keyword${matched.length !== 1 ? 's' : ''}`)
  } else {
    weaknesses.push('No keyword match with query')
  }

  return { score: Math.min(100, score), reasons, weaknesses }
}

function MatchScoreBar({ score }) {
  const color = score >= 70 ? '#008060' : score >= 40 ? '#FFC453' : '#D72C0D'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-shopify-border rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-xs font-bold w-7 text-right" style={{ color }}>{score}</span>
    </div>
  )
}

export default function Simulate() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const runSimulation = async (q) => {
    const testQuery = q || query
    if (!testQuery.trim()) return
    setLoading(true)
    setResults(null)

    // Simulate API delay
    await new Promise(r => setTimeout(r, 900))

    const scored = PRODUCTS.map(p => ({
      ...p,
      ...scoreProductForQuery(p, testQuery),
    })).sort((a, b) => b.score - a.score)

    setResults({ query: testQuery, products: scored })
    setLoading(false)
  }

  const handleQuickQuery = (q) => {
    setQuery(q)
    runSimulation(q)
  }

  const selected = results?.products.slice(0, 2) || []
  const rejected = results?.products.slice(2) || []

  return (
    <div className="space-y-5 max-w-3xl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-shopify-text">Simulate AI Query</h1>
        <p className="text-sm text-shopify-secondary mt-0.5">
          See which products your store surfaces when a customer searches using AI
        </p>
      </div>

      {/* Input card */}
      <div className="bg-white rounded-card shadow-card p-5 space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runSimulation()}
            placeholder='e.g. "best snowboard with free returns under ₹1000"'
            className="flex-1 px-4 py-2.5 text-sm border border-shopify-border rounded-btn focus:outline-none focus:ring-1 focus:ring-shopify-green focus:border-shopify-green"
          />
          <button
            onClick={() => runSimulation()}
            disabled={!query.trim() || loading}
            className="bg-shopify-green hover:bg-shopify-green-dark disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-btn transition-colors whitespace-nowrap"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Running…
              </span>
            ) : 'Run Simulation'}
          </button>
        </div>

        {/* Quick queries */}
        <div>
          <p className="text-xs text-shopify-secondary mb-2 font-medium">Quick examples:</p>
          <div className="flex flex-wrap gap-2">
            {SIMULATE_QUERIES.map((q, i) => (
              <button
                key={i}
                onClick={() => handleQuickQuery(q)}
                className="text-xs px-3 py-1.5 rounded-full border border-shopify-border text-shopify-secondary hover:border-shopify-green hover:text-shopify-green transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-card shadow-card p-5 animate-pulse">
              <div className="h-4 bg-shopify-border rounded w-1/3 mb-3" />
              <div className="h-3 bg-shopify-border rounded w-full mb-2" />
              <div className="h-3 bg-shopify-border rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !results && (
        <div className="bg-white rounded-card shadow-card py-14 flex flex-col items-center text-center gap-3">
          <span className="text-4xl">🔍</span>
          <p className="text-sm font-medium text-shopify-text">Enter a search query above</p>
          <p className="text-xs text-shopify-secondary max-w-xs">
            Type any query a customer might use — we'll show you exactly which products would surface in AI results and why.
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && results && (
        <div className="space-y-4 fade-up">

          {/* Query echo */}
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs text-shopify-secondary">Results for:</span>
            <span className="text-xs font-semibold text-shopify-text bg-white border border-shopify-border rounded-full px-3 py-0.5">
              "{results.query}"
            </span>
          </div>

          {/* Selected (top 2) */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="w-2.5 h-2.5 rounded-full bg-shopify-green" />
              <p className="text-xs font-semibold uppercase tracking-wide text-shopify-green">
                AI Would Surface These (Top 2)
              </p>
            </div>
            <div className="space-y-2">
              {selected.map((p, i) => (
                <div key={p.id} className="bg-white rounded-card shadow-card p-5 border-l-4 border-shopify-green">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-shopify-green bg-shopify-success-light rounded-full px-2 py-0.5">#{i + 1}</span>
                        <p className="text-sm font-semibold text-shopify-text">{p.name}</p>
                      </div>
                      <p className="text-xs text-shopify-secondary">{p.category} · {p.price}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-bold text-shopify-green">{p.score}</p>
                      <p className="text-xs text-shopify-secondary">match</p>
                    </div>
                  </div>
                  <MatchScoreBar score={p.score} />
                  <div className="mt-3 flex flex-wrap gap-1">
                    {p.reasons.map((r, j) => (
                      <span key={j} className="text-xs bg-shopify-success-light text-shopify-green px-2 py-0.5 rounded-full">✓ {r}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rejected */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="w-2.5 h-2.5 rounded-full bg-shopify-border" />
              <p className="text-xs font-semibold uppercase tracking-wide text-shopify-secondary">
                Not Selected ({rejected.length})
              </p>
            </div>
            <div className="bg-white rounded-card shadow-card overflow-hidden">
              {rejected.length === 0 ? (
                <p className="px-5 py-4 text-sm text-shopify-secondary">All products were surfaced.</p>
              ) : (
                <div className="divide-y divide-shopify-border">
                  {rejected.map(p => (
                    <div key={p.id} className="px-5 py-3.5">
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <div>
                          <p className="text-sm font-medium text-shopify-text">{p.name}</p>
                          <p className="text-xs text-shopify-secondary">{p.price}</p>
                        </div>
                        <div className="shrink-0 w-28">
                          <MatchScoreBar score={p.score} />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.weaknesses.map((w, j) => (
                          <span key={j} className="text-xs bg-shopify-critical-light text-shopify-critical px-2 py-0.5 rounded-full">✗ {w}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
