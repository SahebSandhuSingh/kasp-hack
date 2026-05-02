import { useState } from 'react'

const SIMULATE_QUERIES = [
  'best snowboard for beginners',
  'high protein snack under ₹500',
  'winter sports gift under ₹1000',
  'professional grade ski equipment',
]

// Deterministic scoring — assigns match score based on product data quality
function scoreProductForQuery(product, query) {
  const q = query.toLowerCase()
  let score = 0
  const reasons = []
  const weaknesses = []
  const breakdown = []

  // Description quality
  const wordCount = (product.description || '').split(/\s+/).filter(Boolean).length
  if (wordCount >= 30) {
    score += 25; reasons.push('Detailed description')
    breakdown.push({ key: 'description', label: 'Description Quality', earned: 25, max: 25, passed: true, detail: `${wordCount} words — substantive enough for AI to summarize and cite confidently.` })
  } else if (wordCount >= 10) {
    score += 10; reasons.push('Brief description')
    breakdown.push({ key: 'description', label: 'Description Quality', earned: 10, max: 25, passed: false, detail: `Only ${wordCount} words. AI models prefer 30+ words to extract meaningful claims. Add benefits, use cases, and unique features.` })
  } else {
    weaknesses.push('Missing or vague description')
    breakdown.push({ key: 'description', label: 'Description Quality', earned: 0, max: 25, passed: false, detail: wordCount === 0 ? 'No description at all — AI has nothing to work with. This product is invisible to AI shopping queries.' : `Description is only ${wordCount} words long. AI cannot derive enough context to recommend it.` })
  }

  // Return policy
  const queryAsksReturn = q.includes('return') || q.includes('refund')
  if (product.returnPolicy) {
    score += 20; reasons.push('Clear return policy')
    breakdown.push({ key: 'return_policy', label: 'Return Policy', earned: 20, max: 20, passed: true, detail: 'Return policy mentioned — high signal for trust queries.' })
  } else {
    weaknesses.push(queryAsksReturn ? 'No return policy — query specifically asks for this' : 'No return policy')
    breakdown.push({ key: 'return_policy', label: 'Return Policy', earned: 0, max: 20, passed: false, detail: queryAsksReturn ? `The query mentions returns/refunds — this product has no return info, so AI deprioritized it heavily.` : 'No return/refund policy mentioned. Add a sentence like "30-day free returns" to qualify for trust-related queries.' })
  }

  // Shipping
  const queryAsksShipping = q.includes('shipping') || q.includes('delivery') || q.includes('fast')
  if (product.shipping) {
    score += 15; reasons.push('Shipping info available')
    breakdown.push({ key: 'shipping', label: 'Shipping Info', earned: 15, max: 15, passed: true, detail: 'Shipping info present — good for delivery-related queries.' })
  } else {
    weaknesses.push(queryAsksShipping ? 'No shipping info — query asks for this' : 'No shipping info')
    breakdown.push({ key: 'shipping', label: 'Shipping Info', earned: 0, max: 15, passed: false, detail: queryAsksShipping ? 'The query mentions shipping/delivery — without shipping details AI has no basis to recommend this product for that intent.' : 'No shipping details. Add expected delivery time and rates.' })
  }

  // Tags
  const tagCount = product.tags ? product.tags.length : 0
  if (tagCount >= 3) {
    score += 15; reasons.push('Rich product tags')
    breakdown.push({ key: 'tags', label: 'Product Tags', earned: 15, max: 15, passed: true, detail: `${tagCount} tags help AI categorize this product accurately.` })
  } else {
    weaknesses.push('Few or no tags')
    breakdown.push({ key: 'tags', label: 'Product Tags', earned: 0, max: 15, passed: false, detail: `Only ${tagCount} tag${tagCount !== 1 ? 's' : ''}. Tags help AI match products to nuanced queries. Aim for 5+ relevant tags (use-case, material, audience, certification).` })
  }

  // Query keyword match
  const descLower = (product.description || '').toLowerCase()
  const nameLower = (product.name || '').toLowerCase()
  const tagText = (product.tags || []).join(' ').toLowerCase()
  const combined = descLower + ' ' + nameLower + ' ' + tagText
  const queryWords = q.split(/\s+/).filter(w => w.length > 3 && !['with','best','good','under','from','more','have','this','that'].includes(w))
  const matchedKeywords = queryWords.filter(w => combined.includes(w))
  const missingKeywords = queryWords.filter(w => !combined.includes(w))

  if (matchedKeywords.length > 0) {
    const earned = Math.min(25, matchedKeywords.length * 8)
    score += earned
    reasons.push(`Matches ${matchedKeywords.length} query keyword${matchedKeywords.length !== 1 ? 's' : ''}`)
    breakdown.push({ key: 'keywords', label: 'Query Keyword Match', earned, max: 25, passed: matchedKeywords.length >= 2, detail: `Matched: ${matchedKeywords.map(k => `"${k}"`).join(', ')}${missingKeywords.length ? ` · Missing: ${missingKeywords.map(k => `"${k}"`).join(', ')}` : ''}` })
  } else {
    weaknesses.push('No keyword match with query')
    breakdown.push({ key: 'keywords', label: 'Query Keyword Match', earned: 0, max: 25, passed: false, detail: queryWords.length ? `None of the query terms (${queryWords.map(k => `"${k}"`).join(', ')}) appear in this product's title, description, or tags. AI couldn't connect this product to the query intent.` : 'Query had no significant keywords to match.' })
  }

  return {
    score: Math.min(100, score),
    reasons,
    weaknesses,
    breakdown,
    matchedKeywords,
    missingKeywords,
    queryWords,
  }
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

export default function Simulate({ products = [] }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(null) // product id

  const runSimulation = async (q) => {
    const testQuery = q || query
    if (!testQuery.trim()) return
    setLoading(true)
    setResults(null)
    setExpanded(null)

    // Simulate API delay
    await new Promise(r => setTimeout(r, 900))

    const normalized = products.map(p => ({
      ...p,
      name: p.title || p.name || 'Untitled',
      description: p.description || '',
      returnPolicy: p.return_policy || null,
      shipping: p.shipping || null,
      tags: Array.isArray(p.tags) ? p.tags : (p.tags ? p.tags.split(',').map(t => t.trim()) : []),
      category: p.category || 'Uncategorized',
      price: typeof p.price === 'number' ? `₹${p.price}` : (p.price || '₹0'),
    }))
    const scored = normalized.map(p => ({
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
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6D7175" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/>
            <path d="M16 16l4.5 4.5"/>
          </svg>
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
                  {rejected.map(p => {
                    const isOpen = expanded === p.id
                    const topScore = selected[0]?.score || 100
                    const gap = topScore - p.score
                    return (
                      <div key={p.id}>
                        <button
                          onClick={() => setExpanded(isOpen ? null : p.id)}
                          className="w-full text-left px-5 py-3.5 hover:bg-shopify-bg transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3 mb-1.5">
                            <div className="flex items-center gap-2">
                              <svg
                                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                className={`text-shopify-secondary transition-transform ${isOpen ? 'rotate-90' : ''}`}
                              >
                                <polyline points="9 18 15 12 9 6"/>
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-shopify-text">{p.name}</p>
                                <p className="text-xs text-shopify-secondary">{p.category} · {p.price}</p>
                              </div>
                            </div>
                            <div className="shrink-0 w-28">
                              <MatchScoreBar score={p.score} />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1 ml-6">
                            {p.weaknesses.slice(0, 3).map((w, j) => (
                              <span key={j} className="text-xs bg-shopify-critical-light text-shopify-critical px-2 py-0.5 rounded-full">✗ {w}</span>
                            ))}
                            {p.weaknesses.length > 3 && (
                              <span className="text-xs text-shopify-secondary px-1 py-0.5">+{p.weaknesses.length - 3} more</span>
                            )}
                            {!isOpen && <span className="text-xs text-shopify-green font-medium ml-auto">See why →</span>}
                          </div>
                        </button>

                        {/* In-depth analysis panel */}
                        {isOpen && (
                          <div className="bg-shopify-bg border-t border-shopify-border px-5 py-4 fade-up">
                            {/* Headline summary */}
                            <div className="bg-white rounded-card border border-shopify-border p-4 mb-3">
                              <p className="text-xs uppercase tracking-wide font-semibold text-shopify-secondary mb-1">Why this didn't rank</p>
                              <p className="text-sm text-shopify-text leading-relaxed">
                                Scored <span className="font-bold text-shopify-critical">{p.score}/100</span> on this query
                                {selected.length > 0 && (
                                  <>
                                    {' '}— <span className="font-medium">{gap} points behind</span> the top match (<span className="italic">{selected[0].name}</span>).
                                  </>
                                )}
                                {' '}AI search ranks products by how well their content matches both the query intent and overall listing quality.
                              </p>
                            </div>

                            {/* Query keyword analysis */}
                            <div className="bg-white rounded-card border border-shopify-border p-4 mb-3">
                              <p className="text-xs uppercase tracking-wide font-semibold text-shopify-secondary mb-2">Query Keyword Analysis</p>
                              {p.queryWords && p.queryWords.length > 0 ? (
                                <div className="space-y-2">
                                  <div className="flex items-start gap-2 flex-wrap">
                                    <span className="text-xs text-shopify-secondary shrink-0 mt-0.5">Found in listing:</span>
                                    {p.matchedKeywords && p.matchedKeywords.length > 0 ? (
                                      p.matchedKeywords.map((k, j) => (
                                        <span key={j} className="text-xs bg-shopify-success-light text-shopify-green px-2 py-0.5 rounded-full font-medium">✓ {k}</span>
                                      ))
                                    ) : (
                                      <span className="text-xs italic text-shopify-secondary">none</span>
                                    )}
                                  </div>
                                  <div className="flex items-start gap-2 flex-wrap">
                                    <span className="text-xs text-shopify-secondary shrink-0 mt-0.5">Missing from listing:</span>
                                    {p.missingKeywords && p.missingKeywords.length > 0 ? (
                                      p.missingKeywords.map((k, j) => (
                                        <span key={j} className="text-xs bg-shopify-critical-light text-shopify-critical px-2 py-0.5 rounded-full font-medium">✗ {k}</span>
                                      ))
                                    ) : (
                                      <span className="text-xs italic text-shopify-green">all matched</span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs italic text-shopify-secondary">No significant keywords in the query to match against.</p>
                              )}
                            </div>

                            {/* Score breakdown */}
                            <div className="bg-white rounded-card border border-shopify-border p-4 mb-3">
                              <p className="text-xs uppercase tracking-wide font-semibold text-shopify-secondary mb-3">Score Breakdown</p>
                              <div className="space-y-2.5">
                                {p.breakdown && p.breakdown.map((b, j) => (
                                  <div key={j} className="border-l-2 pl-3 py-0.5" style={{ borderColor: b.passed ? '#008060' : (b.earned > 0 ? '#FFC453' : '#D72C0D') }}>
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-xs font-semibold text-shopify-text">
                                        {b.passed ? '✓' : (b.earned > 0 ? '◐' : '✗')} {b.label}
                                      </p>
                                      <span className="text-xs font-mono text-shopify-secondary">{b.earned}/{b.max} pts</span>
                                    </div>
                                    <p className="text-xs text-shopify-secondary mt-0.5 leading-relaxed">{b.detail}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Comparison with top product */}
                            {selected.length > 0 && (
                              <div className="bg-white rounded-card border border-shopify-border p-4 mb-3">
                                <p className="text-xs uppercase tracking-wide font-semibold text-shopify-secondary mb-2">What the top product has that this doesn't</p>
                                {(() => {
                                  const top = selected[0]
                                  const topReasonsSet = new Set(top.reasons || [])
                                  const myReasonsSet = new Set(p.reasons || [])
                                  const advantages = [...topReasonsSet].filter(r => !myReasonsSet.has(r))
                                  if (advantages.length === 0) {
                                    return <p className="text-xs italic text-shopify-secondary">Top product doesn't have meaningful advantages — this product just needs more relevance signals.</p>
                                  }
                                  return (
                                    <ul className="space-y-1">
                                      {advantages.map((a, j) => (
                                        <li key={j} className="text-xs text-shopify-text flex items-start gap-1.5">
                                          <span className="text-shopify-green font-bold mt-0.5">+</span>
                                          <span>{a}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )
                                })()}
                              </div>
                            )}

                            {/* Action recommendations */}
                            <div className="bg-shopify-success-light border border-shopify-green/20 rounded-card p-4">
                              <p className="text-xs uppercase tracking-wide font-semibold text-shopify-green mb-2">How to fix this</p>
                              <ul className="space-y-1.5">
                                {p.breakdown && p.breakdown.filter(b => !b.passed).slice(0, 4).map((b, j) => (
                                  <li key={j} className="text-xs text-shopify-text flex items-start gap-1.5">
                                    <span className="text-shopify-green font-bold mt-0.5">→</span>
                                    <span><span className="font-medium">{b.label}:</span> {b.detail}</span>
                                  </li>
                                ))}
                                {p.missingKeywords && p.missingKeywords.length > 0 && (
                                  <li className="text-xs text-shopify-text flex items-start gap-1.5">
                                    <span className="text-shopify-green font-bold mt-0.5">→</span>
                                    <span><span className="font-medium">Add query keywords:</span> Consider naturally including {p.missingKeywords.slice(0, 3).map(k => `"${k}"`).join(', ')} in the title or description to surface for similar queries.</span>
                                  </li>
                                )}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
