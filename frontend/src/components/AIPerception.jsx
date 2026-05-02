import { useMemo } from 'react'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../categoryConstants'

// Standard AI shopping queries (mirrors LIVE_QUERIES in backend/server.js)
const STANDARD_QUERIES = [
  'best product with free returns and clear description',
  'highly rated product with strong customer reviews',
  'product with fast free shipping',
  'most trusted product with detailed information',
  'best value product with clear pricing',
  'product with detailed ingredients or specifications',
  'best overall product with complete information',
]

// ── Helpers ──────────────────────────────────────

function textHasAny(text, keywords) {
  if (!text) return false
  const lower = text.toLowerCase()
  return keywords.some(k => lower.includes(k))
}

function wordCount(text) {
  if (!text) return 0
  return text.replace(/\s+/g, ' ').trim().split(/\s+/).filter(Boolean).length
}

// Coverage status thresholds
function coverageStatus(count) {
  if (count >= 3) return { label: 'Good', color: '#008060', bg: '#E3F1DF', pillBg: 'bg-shopify-success-light', pillText: 'text-shopify-green' }
  if (count >= 1) return { label: 'Weak', color: '#FFC453', bg: '#FFF5D9', pillBg: 'bg-shopify-warning-light', pillText: 'text-shopify-warning-text' }
  return { label: 'Blind Spot', color: '#D72C0D', bg: '#FFF0EE', pillBg: 'bg-shopify-critical-light', pillText: 'text-shopify-critical' }
}

// Trust signal color by percentage
function signalColor(pct) {
  if (pct >= 70) return { text: 'text-shopify-green', bar: '#008060', label: 'Strong' }
  if (pct >= 40) return { text: 'text-shopify-warning-text', bar: '#FFC453', label: 'Fair' }
  return { text: 'text-shopify-critical', bar: '#D72C0D', label: 'Weak' }
}

// ── Sub-components ───────────────────────────────

function TrustSignalCard({ label, count, total, description }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const cfg = signalColor(pct)
  return (
    <div className="bg-white rounded-card shadow-card p-5 fade-up">
      <p className="text-xs font-medium text-shopify-secondary uppercase tracking-wide">{label}</p>
      <div className="flex items-end gap-2 mt-2">
        <span className={`text-3xl font-bold ${cfg.text}`}>{pct}%</span>
        <span className={`text-xs font-medium mb-1 ${cfg.text}`}>{cfg.label}</span>
      </div>
      <p className="text-xs text-shopify-secondary mt-1">{count} of {total} products</p>
      <div className="h-1.5 bg-shopify-border rounded-full mt-3">
        <div
          className="h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: cfg.bar }}
        />
      </div>
      <p className="text-xs text-shopify-secondary mt-2.5 leading-relaxed">{description}</p>
    </div>
  )
}

// ── Main component ───────────────────────────────

export default function AIPerception({ storeData, products = [], setView }) {
  const storeName = storeData?.domain || 'your store'

  // Normalize product data for analysis
  const analyzed = useMemo(() => {
    return products.map(p => {
      const desc = (p.description || p.raw_html || '').toString()
      const title = p.title || p.name || ''
      const tags = Array.isArray(p.tags) ? p.tags.join(' ') : (p.tags || '')
      const combined = `${title} ${desc} ${tags}`.toLowerCase()
      return {
        id: p.id,
        title: title || 'Untitled',
        score: typeof p.score === 'number' ? p.score : 0,
        category: p.category || 'general',
        product_type: (p.product_type || '').trim(),
        desc,
        descWordCount: wordCount(desc),
        combined,
        hasReturnPolicy: textHasAny(desc, ['return', 'refund', 'exchange', 'money back']),
        hasShippingInfo: textHasAny(desc, ['shipping', 'delivery', 'dispatch', 'ships']),
        hasRichDescription: wordCount(desc) >= 60,
        hasSpecifications: textHasAny(desc, ['dimensions', 'weight', 'size', 'material', 'compatibility', 'specs', 'specification', 'ingredients', 'ingredient', 'nutrition']),
      }
    })
  }, [products])

  const totalProducts = analyzed.length

  // ── SECTION 1 derivations: Store Perception Summary ──
  const avgScore = useMemo(() => {
    if (totalProducts === 0) return 0
    return Math.round(analyzed.reduce((sum, p) => sum + p.score, 0) / totalProducts)
  }, [analyzed, totalProducts])

  const recommendableCount = analyzed.filter(p => p.score >= 70).length
  const recommendablePct = totalProducts > 0 ? Math.round((recommendableCount / totalProducts) * 100) : 0

  const perceivedCategory = useMemo(() => {
    // Use product_type if available, otherwise fall back to detected category
    const counts = {}
    analyzed.forEach(p => {
      const key = p.product_type || p.category || 'general'
      counts[key] = (counts[key] || 0) + 1
    })
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    if (sorted.length === 0) return 'general'
    return sorted[0][0]
  }, [analyzed])

  const perceivedCategoryLabel = useMemo(() => {
    // Map backend category ids to labels; for raw product_type strings use as-is
    if (CATEGORY_LABELS[perceivedCategory]) return CATEGORY_LABELS[perceivedCategory]
    if (!perceivedCategory || perceivedCategory === 'general') return 'general merchandise'
    return perceivedCategory
  }, [perceivedCategory])

  const storeStatus = avgScore >= 70 ? 'Strong AI visibility'
    : avgScore >= 40 ? 'Partial AI visibility'
    : 'Low AI visibility'
  const storeStatusColor = avgScore >= 70 ? '#008060' : avgScore >= 40 ? '#FFC453' : '#D72C0D'

  // ── SECTION 2: Query Coverage Map ──
  const queryCoverage = useMemo(() => {
    return STANDARD_QUERIES.map(q => {
      // A product "surfaces" for a query if its overall score >= 70 AND it has some
      // thematic relevance (we use keyword overlap as a proxy for relevance).
      const keywords = q.toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3 && !['with','best','good','most','product','complete','clear','detailed'].includes(w))

      const surfacing = analyzed.filter(p => {
        if (p.score < 70) return false
        // Require at least one keyword match OR a high score (85+) to count as surfacing
        if (p.score >= 85) return true
        return keywords.some(k => p.combined.includes(k))
      })

      return {
        query: q,
        count: surfacing.length,
        status: coverageStatus(surfacing.length),
      }
    })
  }, [analyzed])

  const blindSpots = queryCoverage.filter(q => q.count === 0).length

  // ── SECTION 3: Perception Gap Analysis ──
  const categoryBreakdown = useMemo(() => {
    const map = {}
    analyzed.forEach(p => {
      const cat = p.category || 'general'
      if (!map[cat]) map[cat] = { category: cat, count: 0, totalScore: 0, productsWithIssues: 0 }
      map[cat].count += 1
      map[cat].totalScore += p.score
      if (p.score < 70) map[cat].productsWithIssues += 1
    })
    return Object.values(map).map(c => ({
      ...c,
      avgScore: Math.round(c.totalScore / c.count),
      label: CATEGORY_LABELS[c.category] || 'General',
      colors: CATEGORY_COLORS[c.category] || CATEGORY_COLORS.general,
    })).sort((a, b) => b.count - a.count)
  }, [analyzed])

  const whatYouSell = categoryBreakdown
  const whatAIRecommends = categoryBreakdown.filter(c => c.avgScore >= 60)
  const recommendedIds = new Set(whatAIRecommends.map(c => c.category))
  const perceptionGaps = whatYouSell.filter(c => !recommendedIds.has(c.category))

  // ── SECTION 4: Trust Signals ──
  const trustSignals = useMemo(() => ({
    returnPolicy: analyzed.filter(p => p.hasReturnPolicy).length,
    shipping: analyzed.filter(p => p.hasShippingInfo).length,
    description: analyzed.filter(p => p.hasRichDescription).length,
    specifications: analyzed.filter(p => p.hasSpecifications).length,
  }), [analyzed])

  // ── Empty state ──
  if (totalProducts === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-shopify-text">AI Perception</h1>
          <p className="text-sm text-shopify-secondary mt-0.5">
            How AI shopping agents see your store
          </p>
        </div>
        <div className="bg-white rounded-card shadow-card py-16 flex flex-col items-center text-center gap-3">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6D7175" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <p className="text-sm font-medium text-shopify-text">No products to analyze yet</p>
          <p className="text-xs text-shopify-secondary max-w-xs">Connect a store with products to see how AI shopping agents perceive your catalog.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-shopify-text">AI Perception</h1>
          <p className="text-sm text-shopify-secondary mt-0.5">
            How AI shopping agents see <span className="font-medium text-shopify-text">{storeName}</span> right now
          </p>
        </div>
        <button
          onClick={() => setView && setView('beforeafter')}
          className="bg-shopify-green hover:bg-shopify-green-dark text-white text-sm font-medium px-4 py-2 rounded-btn transition-colors"
        >
          Fix Perception Gaps →
        </button>
      </div>

      {/* ─── SECTION 1 — Store Perception Summary ─── */}
      <div className="bg-white rounded-card shadow-card p-6 fade-up relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: storeStatusColor }} />
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1 min-w-[280px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: storeStatusColor }} />
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: storeStatusColor }}>
                {storeStatus}
              </p>
            </div>
            <h2 className="text-lg font-semibold text-shopify-text leading-snug">
              AI agents currently identify your store as a{' '}
              <span className="text-shopify-green">{perceivedCategoryLabel}</span> store
            </h2>
            <p className="text-sm text-shopify-secondary mt-2 leading-relaxed">
              Based on the most common product type across your <span className="font-medium text-shopify-text">{totalProducts}</span> product{totalProducts !== 1 ? 's' : ''}, this is how AI shopping agents categorize your brand when answering customer queries.
            </p>
          </div>

          <div className="flex gap-6 flex-wrap">
            <div className="min-w-[120px]">
              <p className="text-xs font-medium text-shopify-secondary uppercase tracking-wide">AI Visibility</p>
              <p className="text-3xl font-bold mt-1" style={{ color: storeStatusColor }}>{avgScore}<span className="text-lg text-shopify-secondary font-medium">/100</span></p>
              <p className="text-xs text-shopify-secondary mt-0.5">average score</p>
            </div>
            <div className="min-w-[120px]">
              <p className="text-xs font-medium text-shopify-secondary uppercase tracking-wide">Recommended For</p>
              <p className="text-3xl font-bold mt-1 text-shopify-text">{recommendablePct}<span className="text-lg text-shopify-secondary font-medium">%</span></p>
              <p className="text-xs text-shopify-secondary mt-0.5">of relevant queries</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-shopify-border">
          <p className="text-xs text-shopify-secondary leading-relaxed">
            AI agents would confidently recommend <span className="font-semibold text-shopify-text">{recommendableCount}</span> of your <span className="font-semibold text-shopify-text">{totalProducts}</span> products when asked by shoppers — the rest have visibility issues that keep them out of AI-generated answers.
          </p>
        </div>
      </div>

      {/* ─── SECTION 2 — Query Coverage Map ─── */}
      <div className="bg-white rounded-card shadow-card fade-up">
        <div className="px-5 py-4 border-b border-shopify-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-shopify-text">Query Coverage Map</h2>
            <p className="text-xs text-shopify-secondary mt-0.5">
              What happens when AI agents get asked common shopping questions
            </p>
          </div>
          {blindSpots > 0 && (
            <span className="text-xs font-medium bg-shopify-critical-light text-shopify-critical px-2.5 py-1 rounded-full">
              {blindSpots} blind spot{blindSpots !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="divide-y divide-shopify-border">
          {queryCoverage.map((q, i) => {
            const isBlindSpot = q.count === 0
            const barPct = Math.min(100, (q.count / Math.max(1, totalProducts)) * 100)
            return (
              <div
                key={i}
                className={`px-5 py-3.5 ${isBlindSpot ? 'bg-shopify-critical-light/30' : ''}`}
              >
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: q.status.color }}
                    />
                    <p className={`text-sm truncate ${isBlindSpot ? 'font-medium text-shopify-critical' : 'text-shopify-text'}`}>
                      "{q.query}"
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-shopify-secondary whitespace-nowrap">
                      {q.count} product{q.count !== 1 ? 's' : ''} surface
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${q.status.pillBg} ${q.status.pillText}`}>
                      {q.status.label}
                    </span>
                  </div>
                </div>
                <div className="ml-3.5">
                  <div className="h-1 bg-shopify-border rounded-full">
                    <div
                      className="h-1 rounded-full transition-all duration-700"
                      style={{ width: `${barPct}%`, backgroundColor: q.status.color }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── SECTION 3 — Perception Gap Analysis ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* What you sell */}
        <div className="bg-white rounded-card shadow-card fade-up">
          <div className="px-5 py-4 border-b border-shopify-border">
            <h2 className="text-sm font-semibold text-shopify-text">What you sell</h2>
            <p className="text-xs text-shopify-secondary mt-0.5">All categories in your catalog</p>
          </div>
          <div className="divide-y divide-shopify-border">
            {whatYouSell.length === 0 && (
              <p className="px-5 py-4 text-sm text-shopify-secondary">No categories detected.</p>
            )}
            {whatYouSell.map(c => (
              <div key={c.category} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: c.colors.bg, color: c.colors.text }}
                  >
                    {c.label}
                  </span>
                </div>
                <span className="text-xs text-shopify-secondary">
                  {c.count} product{c.count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* What AI recommends you for */}
        <div className="bg-white rounded-card shadow-card fade-up">
          <div className="px-5 py-4 border-b border-shopify-border">
            <h2 className="text-sm font-semibold text-shopify-text">What AI recommends you for</h2>
            <p className="text-xs text-shopify-secondary mt-0.5">Categories with strong visibility (avg score ≥ 60)</p>
          </div>
          <div className="divide-y divide-shopify-border">
            {whatAIRecommends.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-sm text-shopify-critical font-medium">AI agents don't confidently recommend any of your categories yet</p>
                <p className="text-xs text-shopify-secondary mt-1">Every category has an average score below 60. Start by improving your strongest category first.</p>
              </div>
            ) : (
              whatAIRecommends.map(c => (
                <div key={c.category} className="px-5 py-3 flex items-center justify-between">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: c.colors.bg, color: c.colors.text }}
                  >
                    {c.label}
                  </span>
                  <span className="text-xs font-semibold text-shopify-green">
                    avg {c.avgScore}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Perception Gaps callout */}
      {perceptionGaps.length > 0 && (
        <div className="bg-shopify-critical-light border border-shopify-critical/20 rounded-card p-5 fade-up">
          <div className="flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D72C0D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-shopify-critical">
                {perceptionGaps.length} Perception Gap{perceptionGaps.length !== 1 ? 's' : ''} Detected
              </p>
              <p className="text-xs text-shopify-critical/90 mt-1">These categories exist in your catalog but AI agents rarely surface them:</p>
              <ul className="mt-3 space-y-1.5">
                {perceptionGaps.map(c => (
                  <li key={c.category} className="text-xs text-shopify-critical flex items-start gap-2">
                    <span className="text-shopify-critical font-bold mt-0.5">→</span>
                    <span>
                      <span className="font-semibold">{c.label}:</span> AI agents rarely surface your {c.label.toLowerCase()} products — {c.productsWithIssues} issue{c.productsWithIssues !== 1 ? 's' : ''} blocking visibility across {c.count} product{c.count !== 1 ? 's' : ''} (avg score: {c.avgScore})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ─── SECTION 4 — Trust Signal Audit ─── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-shopify-text">Trust Signal Audit</h2>
            <p className="text-xs text-shopify-secondary mt-0.5">Key signals AI uses to evaluate trustworthiness</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TrustSignalCard
            label="Return Policy Coverage"
            count={trustSignals.returnPolicy}
            total={totalProducts}
            description="AI prioritizes products with clear return policies for trust-related queries."
          />
          <TrustSignalCard
            label="Shipping Info Coverage"
            count={trustSignals.shipping}
            total={totalProducts}
            description="Shipping details help AI answer delivery-focused customer questions."
          />
          <TrustSignalCard
            label="Description Quality"
            count={trustSignals.description}
            total={totalProducts}
            description="Descriptions with 60+ words give AI enough context to cite confidently."
          />
          <TrustSignalCard
            label="Specification Coverage"
            count={trustSignals.specifications}
            total={totalProducts}
            description="Specs, ingredients, or dimensions help AI match specific customer needs."
          />
        </div>
      </div>

    </div>
  )
}
