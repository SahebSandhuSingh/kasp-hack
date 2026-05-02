import { useState, useEffect, useMemo } from 'react'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../categoryConstants'

// Standard AI shopping queries (mirrors LIVE_QUERIES in backend/server.js)
const STANDARD_QUERIES = [
  'best beginner snowboard under ₹50000',
  'lightweight everyday t-shirt for men',
  'high protein low sugar snack bar',
  'professional ski accessories for advanced riders',
  'affordable gift for someone who loves winter sports',
  'complete snowboard setup for intermediate riders',
  'best value sports equipment for outdoor activities',
]

function coverageStatus(count) {
  if (count >= 3) return { label: 'Good', color: '#008060', pillBg: 'bg-shopify-success-light', pillText: 'text-shopify-green' }
  if (count >= 1) return { label: 'Weak', color: '#FFC453', pillBg: 'bg-shopify-warning-light', pillText: 'text-shopify-warning-text' }
  return { label: 'Blind Spot', color: '#D72C0D', pillBg: 'bg-shopify-critical-light', pillText: 'text-shopify-critical' }
}

function signalColor(pct) {
  if (pct >= 70) return { text: 'text-shopify-green', bar: '#008060', label: 'Strong' }
  if (pct >= 40) return { text: 'text-shopify-warning-text', bar: '#FFC453', label: 'Fair' }
  return { text: 'text-shopify-critical', bar: '#D72C0D', label: 'Weak' }
}

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

// ── Client-side issue detection (mirrors backend detect-issues.js) ──

function textContainsAny(text, keywords) {
  if (!text) return false
  const lower = text.toLowerCase()
  return keywords.some(kw => lower.includes(kw))
}

function getWordCount(text) {
  if (!text) return 0
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean ? clean.split(/\s+/).filter(Boolean).length : 0
}

function detectIssues(product) {
  const issues = []
  const bodyText = (product.description || '').replace(/\s+/g, ' ').trim()

  if (!textContainsAny(bodyText, ['return', 'refund', 'exchange'])) {
    issues.push({ type: 'missing_return_policy', label: 'Missing return policy', severity: 'critical' })
  }
  if (!textContainsAny(bodyText, ['shipping', 'delivery', 'dispatch'])) {
    issues.push({ type: 'missing_shipping_info', label: 'No shipping information', severity: 'critical' })
  }
  if (getWordCount(bodyText) < 80) {
    issues.push({ type: 'weak_description', label: 'Short description (<80 words)', severity: 'warning' })
  }
  const specKw = ['dimensions', 'weight', 'size', 'material', 'compatibility', 'specs', 'ingredients', 'ingredient']
  if (!textContainsAny(bodyText, specKw)) {
    issues.push({ type: 'missing_specifications', label: 'No ingredients / specs', severity: 'warning' })
  }
  if (!textContainsAny(bodyText, ['tag'])) {
    // tags check — use product tags if available
  }
  const price = parseFloat(product.price || 0)
  if (!price || price <= 0) {
    issues.push({ type: 'price_issue', label: 'Missing or zero price', severity: 'warning' })
  }
  return issues
}

function scoreProduct(product) {
  const issues = detectIssues(product)
  return Math.max(0, Math.min(100, 100 - issues.length * 15))
}

// ── SVG ring chart ──

function ScoreRing({ score }) {
  const safeScore = isNaN(score) ? 0 : score
  const r = 45
  const circ = 2 * Math.PI * r
  const offset = circ - (safeScore / 100) * circ

  const color =
    safeScore >= 70 ? '#008060' :
    safeScore >= 40 ? '#FFC453' : '#D72C0D'

  const label =
    safeScore >= 70 ? 'Good' :
    safeScore >= 40 ? 'Fair' : 'Poor'

  const [animated, setAnimated] = useState(circ)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(offset), 60)
    return () => clearTimeout(t)
  }, [offset])

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {/* Track */}
        <circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke="#E1E3E5"
          strokeWidth="10"
        />
        {/* Fill */}
        <circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={animated}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
        {/* Score text */}
        <text x="60" y="57" textAnchor="middle" fontSize="22" fontWeight="700" fill="#202223">{safeScore}</text>
        <text x="60" y="73" textAnchor="middle" fontSize="11" fill="#6D7175">/100</text>
      </svg>
      <span className="text-sm font-semibold px-3 py-0.5 rounded-full"
        style={{ background: color + '1A', color }}>
        {label}
      </span>
    </div>
  )
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-card shadow-card p-5 flex flex-col gap-1 fade-up">
      <span className="text-xs font-medium text-shopify-secondary uppercase tracking-wide">{label}</span>
      <span className={`text-3xl font-bold ${accent || 'text-shopify-text'}`}>{value}</span>
      {sub && <span className="text-xs text-shopify-secondary">{sub}</span>}
    </div>
  )
}

const SEVERITY_CONFIG = {
  critical: { bg: 'bg-shopify-critical-light', text: 'text-shopify-critical', dot: 'bg-shopify-critical', label: 'Critical' },
  warning:  { bg: 'bg-shopify-warning-light',  text: 'text-shopify-warning-text', dot: 'bg-shopify-warning', label: 'Warning' },
  good:     { bg: 'bg-shopify-success-light',  text: 'text-shopify-green', dot: 'bg-shopify-green', label: 'Good' },
}

function IssueBadge({ severity }) {
  const cfg = SEVERITY_CONFIG[severity]
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

export default function Dashboard({ setView, storeData }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [optHistory, setOptHistory] = useState([])

  useEffect(() => {
    setLoading(true)
    fetch('/api/audit', { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch audit data')))
      .then(data => {
        setProducts(data.products || [])
      })
      .catch(err => console.error('Dashboard audit fetch error:', err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!storeData?.domain) return
    fetch('/api/products/optimization-history', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => setOptHistory(Array.isArray(data) ? data : []))
      .catch(() => setOptHistory([]))
  }, [storeData?.domain])

  const scoredProducts = useMemo(() => {
    return products.map(p => {
      const score = p.score ?? scoreProduct(p)
      const issueList = Array.isArray(p.issues) ? p.issues : detectIssues(p)
      const status = p.status || (score < 40 ? 'critical' : score < 70 ? 'needs-work' : 'optimized')
      return { ...p, name: p.title || p.name, score, issues: issueList.length, issueList, status, category: p.category || 'general' }
    })
  }, [products])

  const categorySummary = useMemo(() => {
    const catMap = {}
    scoredProducts.forEach(p => {
      const cat = p.category || 'general'
      if (!catMap[cat]) catMap[cat] = { category: cat, product_count: 0, total_score: 0, critical: 0 }
      catMap[cat].product_count += 1
      catMap[cat].total_score += p.score
      if (p.score < 40) catMap[cat].critical += 1
    })
    return Object.values(catMap)
      .map(c => ({ ...c, avg_score: Math.round(c.total_score / c.product_count) }))
      .sort((a, b) => a.avg_score - b.avg_score)
  }, [scoredProducts])

  const critical = scoredProducts.filter(p => p.status === 'critical')
  const optimized = scoredProducts.filter(p => p.status === 'optimized')

  const avgScore = useMemo(() => {
    if (scoredProducts.length === 0) return 0
    return Math.round(scoredProducts.reduce((sum, p) => sum + p.score, 0) / scoredProducts.length)
  }, [scoredProducts])

  const totalIssues = useMemo(() => {
    return scoredProducts.reduce((sum, p) => sum + p.issues, 0)
  }, [scoredProducts])

  const issuesSummary = useMemo(() => {
    const counts = {}
    scoredProducts.forEach(p => {
      p.issueList.forEach(issue => {
        if (!counts[issue.type]) counts[issue.type] = { label: issue.label, severity: issue.severity, count: 0 }
        counts[issue.type].count += 1
      })
    })
    return Object.values(counts).sort((a, b) => b.count - a.count)
  }, [scoredProducts])

  // ── Perception derivations ──

  const perceivedCategoryLabel = useMemo(() => {
    const counts = {}
    scoredProducts.forEach(p => {
      const key = (p.product_type || '').trim() || p.category || 'general'
      counts[key] = (counts[key] || 0) + 1
    })
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    if (sorted.length === 0) return 'general merchandise'
    const top = sorted[0][0]
    if (CATEGORY_LABELS[top]) return CATEGORY_LABELS[top]
    if (!top || top === 'general') return 'general merchandise'
    return top
  }, [scoredProducts])

  const recommendableCount = scoredProducts.filter(p => p.score >= 70).length
  const recommendablePct = scoredProducts.length > 0
    ? Math.round((recommendableCount / scoredProducts.length) * 100)
    : 0

  const queryCoverage = useMemo(() => {
    const stopwords = ['with','best','good','most','product','complete','clear','detailed']
    return STANDARD_QUERIES.map(q => {
      const keywords = q.toLowerCase().split(/\s+/)
        .filter(w => w.length > 3 && !stopwords.includes(w))
      const surfacing = scoredProducts.filter(p => {
        if (p.score < 70) return false
        if (p.score >= 85) return true
        const combined = `${p.name || ''} ${p.description || ''} ${(Array.isArray(p.tags) ? p.tags.join(' ') : (p.tags || ''))}`.toLowerCase()
        return keywords.some(k => combined.includes(k))
      })
      return { query: q, count: surfacing.length, status: coverageStatus(surfacing.length) }
    })
  }, [scoredProducts])

  const blindSpots = queryCoverage.filter(q => q.count === 0).length

  const trustSignals = useMemo(() => {
    const hasReturn = p => textContainsAny(p.description || '', ['return', 'refund', 'exchange', 'money back'])
    const hasShipping = p => textContainsAny(p.description || '', ['shipping', 'delivery', 'dispatch', 'ships'])
    const hasRichDesc = p => getWordCount(p.description || '') >= 60
    const hasSpecs = p => textContainsAny(p.description || '', ['dimensions', 'weight', 'size', 'material', 'compatibility', 'specs', 'specification', 'ingredients', 'ingredient', 'nutrition'])
    return {
      returnPolicy: scoredProducts.filter(hasReturn).length,
      shipping: scoredProducts.filter(hasShipping).length,
      description: scoredProducts.filter(hasRichDesc).length,
      specifications: scoredProducts.filter(hasSpecs).length,
    }
  }, [scoredProducts])

  const storeStatus = avgScore >= 70 ? 'Strong AI visibility'
    : avgScore >= 40 ? 'Partial AI visibility'
    : 'Low AI visibility'
  const storeStatusColor = avgScore >= 70 ? '#008060' : avgScore >= 40 ? '#FFC453' : '#D72C0D'

  const optTotal = optHistory.filter(h => h.status === 'applied').length
  const optThisWeek = useMemo(() => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return optHistory.filter(h => h.status === 'applied' && new Date(h.applied_at) >= weekAgo).length
  }, [optHistory])

  const storeName = storeData?.domain || 'Your Store'
  const totalProducts = storeData?.productCount || scoredProducts.length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin w-8 h-8 text-shopify-green" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <p className="text-sm text-shopify-secondary">Loading store data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Page header */}
      {storeData?.hasWriteAccess === false && (
        <div className="bg-shopify-warning-light border border-shopify-warning rounded-card px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-shopify-warning-text">⚠️ Limited access: Can't apply optimizations directly. Enable write_products scope to unlock one-click apply.</p>
          <button onClick={() => alert('Open Shopify Admin → Settings → Apps → Develop apps → API credentials → Configure Admin API scopes, enable write_products, save, then reconnect.')} className="text-xs font-medium text-shopify-warning-text underline">Fix this →</button>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-shopify-text">Store Overview</h1>
          <p className="text-sm text-shopify-secondary mt-0.5">
            Connected to <span className="font-medium text-shopify-text">{storeName}</span>
            <span className="ml-2 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-shopify-green" />
              <span className="text-shopify-green font-medium">Live</span>
            </span>
          </p>
        </div>
        <button
          onClick={() => setView('products')}
          className="bg-shopify-green hover:bg-shopify-green-dark text-white text-sm font-medium px-4 py-2 rounded-btn transition-colors"
        >
          Start Optimizing →
        </button>
      </div>

      {/* Hero + stat cards row */}
      <div className="grid grid-cols-12 gap-4">

        {/* Score card */}
        <div className="col-span-12 md:col-span-4 bg-white rounded-card shadow-card p-6 fade-up flex flex-col items-center justify-center gap-4">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-shopify-secondary mb-3">
              AI Visibility Score
            </p>
            <ScoreRing score={avgScore} />
          </div>
          <p className="text-xs text-shopify-secondary text-center max-w-[180px]">
            How well your products appear in AI-powered shopping recommendations
          </p>
        </div>

        {/* Stat cards */}
        <div className="col-span-12 md:col-span-8 grid grid-cols-2 gap-4">
          <StatCard
            label="Total Products"
            value={totalProducts}
            sub={`${optimized.length} fully optimized`}
          />
          <StatCard
            label="Products Optimized"
            value={optimized.length}
            sub={`${totalProducts - optimized.length} still need work`}
            accent="text-shopify-green"
          />
          <StatCard
            label="Issues Found"
            value={totalIssues}
            sub="Across all products"
            accent="text-shopify-critical"
          />
          <StatCard
            label="Est. Revenue Impact"
            value={totalIssues > 0 ? `+₹${(totalIssues * 3500).toLocaleString()}` : '₹0'}
            sub="If all issues are fixed"
            accent="text-shopify-green"
          />
          <StatCard
            label="Optimizations Applied"
            value={optTotal}
            sub={`${optThisWeek} this week`}
            accent="text-shopify-green"
          />
        </div>
      </div>

      {/* ─── AI Perception summary ─── */}
      {scoredProducts.length > 0 && (
        <div className="pt-2">
          <h2 className="text-xl font-semibold text-shopify-text">AI Perception</h2>
        </div>
      )}

      {scoredProducts.length > 0 && (
        <div className="bg-white rounded-card shadow-card p-6 fade-up relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: storeStatusColor }} />
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: storeStatusColor }} />
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: storeStatusColor }}>
                  How AI sees your store · {storeStatus}
                </p>
              </div>
              <h2 className="text-lg font-semibold text-shopify-text leading-snug">
                AI agents identify your store as a{' '}
                <span className="text-shopify-green">{perceivedCategoryLabel}</span> store
              </h2>
              <p className="text-sm text-shopify-secondary mt-2 leading-relaxed">
                They would confidently recommend <span className="font-semibold text-shopify-text">{recommendableCount}</span> of your <span className="font-semibold text-shopify-text">{scoredProducts.length}</span> products — that's <span className="font-semibold text-shopify-text">{recommendablePct}%</span> of your catalog surfacing in AI-generated answers.
              </p>
            </div>
            <div className="flex gap-6 flex-wrap shrink-0">
              <div className="min-w-[110px]">
                <p className="text-xs font-medium text-shopify-secondary uppercase tracking-wide">Visibility</p>
                <p className="text-3xl font-bold mt-1" style={{ color: storeStatusColor }}>
                  {avgScore}<span className="text-lg text-shopify-secondary font-medium">/100</span>
                </p>
              </div>
              <div className="min-w-[110px]">
                <p className="text-xs font-medium text-shopify-secondary uppercase tracking-wide">Recommended</p>
                <p className="text-3xl font-bold mt-1 text-shopify-text">
                  {recommendablePct}<span className="text-lg text-shopify-secondary font-medium">%</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Query Coverage Map ─── */}
      {scoredProducts.length > 0 && (
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
              const barPct = Math.min(100, (q.count / Math.max(1, scoredProducts.length)) * 100)
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
      )}

      {/* ─── Trust Signal Audit ─── */}
      {scoredProducts.length > 0 && (
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
              total={scoredProducts.length}
              description="AI prioritizes products with clear return policies for trust-related queries."
            />
            <TrustSignalCard
              label="Shipping Info Coverage"
              count={trustSignals.shipping}
              total={scoredProducts.length}
              description="Shipping details help AI answer delivery-focused customer questions."
            />
            <TrustSignalCard
              label="Description Quality"
              count={trustSignals.description}
              total={scoredProducts.length}
              description="Descriptions with 60+ words give AI enough context to cite confidently."
            />
            <TrustSignalCard
              label="Specification Coverage"
              count={trustSignals.specifications}
              total={scoredProducts.length}
              description="Specs, ingredients, or dimensions help AI match specific customer needs."
            />
          </div>
        </div>
      )}

      {/* Issues + critical products row */}
      <div className="grid grid-cols-12 gap-4">

        {/* Issues breakdown */}
        <div className="col-span-12 md:col-span-6 bg-white rounded-card shadow-card fade-up">
          <div className="px-5 py-4 border-b border-shopify-border">
            <h2 className="text-sm font-semibold text-shopify-text">Issues Breakdown</h2>
          </div>
          <div className="divide-y divide-shopify-border">
            {issuesSummary.length === 0 ? (
              <div className="px-5 py-6 text-center text-sm text-shopify-secondary">No issues detected</div>
            ) : (
              issuesSummary.map((issue, i) => {
                const cfg = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.warning
                return (
                  <div key={i} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      <span className="text-sm text-shopify-text">{issue.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-shopify-text">{issue.count}</span>
                      <IssueBadge severity={issue.severity} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Critical products */}
        <div className="col-span-12 md:col-span-6 bg-white rounded-card shadow-card fade-up">
          <div className="px-5 py-4 border-b border-shopify-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-shopify-text">
              Critical Products
            </h2>
            <button
              onClick={() => setView('products')}
              className="text-xs text-shopify-green font-medium hover:underline"
            >
              View all →
            </button>
          </div>
          {critical.length === 0 ? (
            <div className="px-5 py-10 flex flex-col items-center text-center gap-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#008060" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12l3 3 5-5"/>
              </svg>
              <p className="text-sm font-medium text-shopify-text">No critical products!</p>
              <p className="text-xs text-shopify-secondary">All your products are in good shape.</p>
            </div>
          ) : (
            <div className="divide-y divide-shopify-border">
              {critical.map(p => (
                <div key={p.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-shopify-text">{p.name}</p>
                    <p className="text-xs text-shopify-secondary mt-0.5">
                      Score: <span className="font-semibold text-shopify-critical">{p.score}</span>
                      &nbsp;·&nbsp; {p.issues} issue{p.issues !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setView('beforeafter')}
                    className="text-xs font-medium text-shopify-green border border-shopify-green rounded-btn px-2.5 py-1 hover:bg-shopify-green-light transition-colors"
                  >
                    Fix now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Catalog by Category */}
      {categorySummary.length > 0 && (
        <div className="bg-white rounded-card shadow-card fade-up">
          <div className="px-5 py-4 border-b border-shopify-border">
            <h2 className="text-sm font-semibold text-shopify-text">Catalog by Category</h2>
            <p className="text-xs text-shopify-secondary mt-0.5">AI score breakdown across product categories</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 divide-x divide-y divide-shopify-border">
            {categorySummary.map(cat => {
              const colors = CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.general
              const label = CATEGORY_LABELS[cat.category] || 'General'
              return (
                <div key={cat.category} className="px-5 py-4 flex flex-col gap-2">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium self-start"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {label}
                  </span>
                  <div className="flex items-end gap-2">
                    <span className={`text-2xl font-bold ${cat.avg_score >= 70 ? 'text-shopify-green' : cat.avg_score >= 40 ? 'text-shopify-warning-text' : 'text-shopify-critical'}`}>
                      {cat.avg_score}
                    </span>
                    <span className="text-xs text-shopify-secondary mb-1">avg score</span>
                  </div>
                  <p className="text-xs text-shopify-secondary">
                    {cat.product_count} product{cat.product_count !== 1 ? 's' : ''}
                    {cat.critical > 0 && <span className="text-shopify-critical"> · {cat.critical} critical</span>}
                  </p>
                  <div className="h-1.5 bg-shopify-border rounded-full">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${cat.avg_score}%`,
                        backgroundColor: cat.avg_score >= 70 ? '#008060' : cat.avg_score >= 40 ? '#FFC453' : '#D72C0D'
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
