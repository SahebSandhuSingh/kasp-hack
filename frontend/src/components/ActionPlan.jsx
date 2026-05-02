import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
// ── Helpers ──────────────────────────────────────

function statusOf(score) {
  if (score >= 70) return 'optimized'
  if (score >= 40) return 'needs-work'
  return 'critical'
}

function severityConfig(sev) {
  if (sev === 'critical') {
    return {
      label: 'Critical',
      pillBg: 'bg-shopify-critical-light',
      pillText: 'text-shopify-critical',
      dot: 'bg-shopify-critical',
      border: 'border-shopify-critical/20',
    }
  }
  return {
    label: 'Warning',
    pillBg: 'bg-shopify-warning-light',
    pillText: 'text-shopify-warning-text',
    dot: 'bg-shopify-warning',
    border: 'border-shopify-warning/30',
  }
}

// ── Main component ───────────────────────────────

export default function ActionPlan({ storeData, products = [], setSelectedProduct }) {
  const storeName = storeData?.domain || 'your store'
  const navigate = useNavigate()

  // Normalize and calculate
  const { normalized, avgScore, totalIssues, totalProducts } = useMemo(() => {
    const norm = products.map(p => ({
      id: p.id,
      title: p.title || p.name || 'Untitled',
      name: p.title || p.name || 'Untitled',
      score: typeof p.score === 'number' ? p.score : 0,
      issues: Array.isArray(p.issues) ? p.issues : [],
      category: p.category || 'general',
      raw: p,
    }))
    const total = norm.length
    const avg = total > 0 ? Math.round(norm.reduce((s, p) => s + p.score, 0) / total) : 0
    const issuesSum = norm.reduce((s, p) => s + p.issues.length, 0)
    return { normalized: norm, avgScore: avg, totalIssues: issuesSum, totalProducts: total }
  }, [products])

  // Projected = current avg + (fixable issues * 4), capped at 85, with realism factor
  const realisticGain = Math.round((totalIssues * 4) * 0.85)
  const projectedScore = Math.max(avgScore, Math.min(85, avgScore + realisticGain))
  const scoreGain = projectedScore - avgScore
  const productsWithIssues = normalized.filter(p => p.issues.length > 0).length

  // ── SECTION 2: Ranked Action Plan ──
  // Group fixes by issue label across the whole store
  const rankedFixes = useMemo(() => {
    const map = {}
    normalized.forEach(p => {
      p.issues.forEach(issue => {
        const key = issue.label || issue.field || 'Unknown issue'
        if (!map[key]) {
          map[key] = {
            key,
            label: issue.label || issue.field,
            severity: issue.severity || 'warning',
            message: issue.message || '',
            pointsPerFix: issue.points_available || 10,
            affectedProducts: [],
          }
        }
        // If severities differ across products, escalate to critical
        if (issue.severity === 'critical') map[key].severity = 'critical'
        map[key].affectedProducts.push({ id: p.id, title: p.title, score: p.score })
      })
    })
    return Object.values(map)
      .map(f => ({
        ...f,
        affectedCount: f.affectedProducts.length,
        totalImpact: f.affectedProducts.length * f.pointsPerFix,
      }))
      .sort((a, b) => b.totalImpact - a.totalImpact)
  }, [normalized])

  const handleFixAll = (fix) => {
    // Store filter hint in sessionStorage so ProductTable can pick it up if implemented later;
    // for now we just jump to the Products page filtered by issue severity.
    try {
      sessionStorage.setItem('actionplan_filter', JSON.stringify({
        issueLabel: fix.label,
        severity: fix.severity,
      }))
    } catch {}
    navigate('/app/products')
  }

  // ── SECTION 3: Quick Wins (55-69) ──
  const quickWins = useMemo(() => {
    return normalized
      .filter(p => p.score >= 55 && p.score < 70)
      .sort((a, b) => b.score - a.score) // closest to 70 first
      .slice(0, 3)
  }, [normalized])

  const handleFixNow = (product) => {
    // If setSelectedProduct is available, we could update parent state,
    // but the URL will be the single source of truth for before/after.
    navigate(`/app/optimize?product_id=${product.id}`)
  }

  // ── SECTION 4: Store Health Trend ──
  const currentDistribution = useMemo(() => {
    const dist = { critical: 0, needsWork: 0, optimized: 0 }
    normalized.forEach(p => {
      const s = statusOf(p.score)
      if (s === 'critical') dist.critical += 1
      else if (s === 'needs-work') dist.needsWork += 1
      else dist.optimized += 1
    })
    return dist
  }, [normalized])

  const projectedDistribution = useMemo(() => {
    // After fixing quick wins, those products will cross into optimized
    const dist = { ...currentDistribution }
    dist.needsWork = Math.max(0, dist.needsWork - quickWins.length)
    dist.optimized += quickWins.length
    return dist
  }, [currentDistribution, quickWins.length])

  // ── Empty state ──
  if (totalProducts === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-shopify-text">Action Plan</h1>
          <p className="text-sm text-shopify-secondary mt-0.5">
            Your prioritized roadmap for improving store-wide AI visibility
          </p>
        </div>
        <div className="bg-white rounded-card shadow-card py-16 flex flex-col items-center text-center gap-3">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6D7175" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="2" width="18" height="20" rx="2"/>
            <path d="M8 6h8M8 11h8M8 16h5"/>
          </svg>
          <p className="text-sm font-medium text-shopify-text">No products to analyze yet</p>
          <p className="text-xs text-shopify-secondary max-w-xs">Connect a store with products to see your action plan.</p>
        </div>
      </div>
    )
  }

  // ── All clear state ──
  if (totalIssues === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-shopify-text">Action Plan</h1>
          <p className="text-sm text-shopify-secondary mt-0.5">
            Connected to <span className="font-medium text-shopify-text">{storeName}</span>
          </p>
        </div>
        <div className="bg-shopify-success-light border border-shopify-green/20 rounded-card p-10 flex flex-col items-center text-center gap-3 fade-up">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#008060" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 12l3 3 5-5"/>
          </svg>
          <p className="text-base font-semibold text-shopify-green">No fixes needed</p>
          <p className="text-sm text-shopify-text max-w-md">
            Your store has no detected issues. Every product is already optimized for AI visibility. Great work!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-shopify-text">Action Plan</h1>
          <p className="text-sm text-shopify-secondary mt-0.5">
            Your prioritized roadmap to boost <span className="font-medium text-shopify-text">{storeName}</span>'s AI visibility
          </p>
        </div>
      </div>

      {/* ─── SECTION 1 — Impact Summary Banner ─── */}
      <div className="bg-gradient-to-br from-shopify-success-light to-white border border-shopify-green/20 rounded-card p-6 fade-up">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1 min-w-[280px]">
            <div className="flex items-center gap-2 mb-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#008060" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              <p className="text-xs font-semibold uppercase tracking-widest text-shopify-green">
                Your store's opportunity
              </p>
            </div>
            <h2 className="text-lg font-semibold text-shopify-text leading-snug">
              Fix <span className="text-shopify-green">{totalIssues}</span> issue{totalIssues !== 1 ? 's' : ''} across{' '}
              <span className="text-shopify-green">{productsWithIssues}</span> product{productsWithIssues !== 1 ? 's' : ''} to improve your store score from{' '}
              <span className="text-shopify-text">{avgScore}</span> to{' '}
              <span className="text-shopify-green">{projectedScore}</span>
            </h2>
            <p className="text-sm text-shopify-secondary mt-2 leading-relaxed">
              Follow the ranked plan below — highest-impact fixes are at the top. Applying them all would improve your average AI visibility by <span className="font-semibold text-shopify-green">+{scoreGain} points</span>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center">
              <p className="text-xs font-medium text-shopify-secondary uppercase tracking-wide">Now</p>
              <p className="text-4xl font-bold text-shopify-text mt-1">{avgScore}</p>
            </div>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#008060" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
            <div className="text-center">
              <p className="text-xs font-medium text-shopify-green uppercase tracking-wide">After</p>
              <p className="text-4xl font-bold text-shopify-green mt-1">{projectedScore}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2 — Ranked Action Plan ─── */}
      <div className="bg-white rounded-card shadow-card fade-up">
        <div className="px-5 py-4 border-b border-shopify-border">
          <h2 className="text-sm font-semibold text-shopify-text">Ranked Action Plan</h2>
          <p className="text-xs text-shopify-secondary mt-0.5">
            Fix in this order for maximum store-wide impact
          </p>
        </div>
        <div className="divide-y divide-shopify-border">
          {rankedFixes.map((fix, i) => {
            const cfg = severityConfig(fix.severity)
            return (
              <div key={fix.key} className="px-5 py-4 flex items-start gap-4">

                {/* Rank number */}
                <div className="shrink-0 w-8 h-8 rounded-full bg-shopify-bg border border-shopify-border flex items-center justify-center">
                  <span className="text-sm font-bold text-shopify-text">{i + 1}</span>
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-shopify-text">{fix.label}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.pillBg} ${cfg.pillText}`}>
                      {cfg.label}
                    </span>
                  </div>
                  {fix.message && (
                    <p className="text-xs text-shopify-secondary mb-2 leading-relaxed">{fix.message}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-shopify-secondary flex-wrap">
                    <span className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      <span className="font-medium text-shopify-text">{fix.affectedCount}</span> product{fix.affectedCount !== 1 ? 's' : ''} affected
                    </span>
                    <span>
                      <span className="font-medium text-shopify-text">+{fix.pointsPerFix} pts</span> per fix
                    </span>
                    <span className="flex items-center gap-1">
                      <span>Store impact:</span>
                      <span className="font-semibold text-shopify-green">+{fix.totalImpact} pts</span>
                    </span>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => handleFixAll(fix)}
                  className="shrink-0 text-xs font-medium text-shopify-green border border-shopify-green rounded-btn px-3 py-1.5 hover:bg-shopify-green hover:text-white transition-colors"
                >
                  Fix all →
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── SECTION 3 — Quick Wins ─── */}
      {quickWins.length > 0 && (
        <div className="bg-white rounded-card shadow-card fade-up">
          <div className="px-5 py-4 border-b border-shopify-border">
            <div className="flex items-center gap-2 mb-0.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#008060" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              <h2 className="text-sm font-semibold text-shopify-text">Quick Wins</h2>
            </div>
            <p className="text-xs text-shopify-secondary">
              These products are close to Optimized — fix 1-2 issues each to unlock them
            </p>
          </div>
          <div className="divide-y divide-shopify-border">
            {quickWins.map(p => {
              const gap = 70 - p.score
              return (
                <div key={p.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-shopify-text truncate">{p.title}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-shopify-secondary">
                        Score: <span className="font-semibold text-shopify-warning-text">{p.score}</span>
                      </span>
                      <span className="text-xs text-shopify-secondary">
                        Needs <span className="font-semibold text-shopify-green">+{gap}</span> to reach Optimized
                      </span>
                      <span className="text-xs text-shopify-secondary">
                        <span className="font-semibold text-shopify-text">{p.issues.length}</span> issue{p.issues.length !== 1 ? 's' : ''} blocking
                      </span>
                    </div>
                    {p.issues.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.issues.slice(0, 3).map((iss, j) => (
                          <span
                            key={j}
                            className="text-xs bg-shopify-bg text-shopify-secondary border border-shopify-border px-2 py-0.5 rounded-full"
                          >
                            {iss.label}
                          </span>
                        ))}
                        {p.issues.length > 3 && (
                          <span className="text-xs text-shopify-secondary px-1 py-0.5">
                            +{p.issues.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Score gauge */}
                  <div className="shrink-0 w-32">
                    <div className="h-1.5 bg-shopify-border rounded-full relative">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${p.score}%`, backgroundColor: '#FFC453' }}
                      />
                      {/* 70 threshold marker */}
                      <div
                        className="absolute top-0 w-0.5 h-1.5 bg-shopify-green"
                        style={{ left: '70%' }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs font-semibold text-shopify-warning-text">{p.score}</span>
                      <span className="text-xs text-shopify-green">70</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleFixNow(p)}
                    className="shrink-0 text-xs font-medium text-white bg-shopify-green hover:bg-shopify-green-dark rounded-btn px-3 py-1.5 transition-colors"
                  >
                    Fix now →
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── SECTION 4 — Store Health Trend ─── */}
      <div className="bg-white rounded-card shadow-card fade-up">
        <div className="px-5 py-4 border-b border-shopify-border">
          <h2 className="text-sm font-semibold text-shopify-text">Store Health Trend</h2>
          <p className="text-xs text-shopify-secondary mt-0.5">
            How your product distribution changes after quick wins
          </p>
        </div>
        <div className="p-5 space-y-5">

          {/* Current state */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-shopify-secondary">Current state</p>
              <p className="text-xs text-shopify-secondary">{totalProducts} product{totalProducts !== 1 ? 's' : ''}</p>
            </div>
            <DistributionBar dist={currentDistribution} total={totalProducts} />
          </div>

          {/* After quick wins */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-shopify-green">
                After quick wins {quickWins.length > 0 && <span className="text-shopify-secondary font-normal normal-case">(+{quickWins.length} product{quickWins.length !== 1 ? 's' : ''} optimized)</span>}
              </p>
              <p className="text-xs text-shopify-secondary">{totalProducts} product{totalProducts !== 1 ? 's' : ''}</p>
            </div>
            <DistributionBar dist={projectedDistribution} total={totalProducts} />
          </div>

          {quickWins.length === 0 && (
            <p className="text-xs text-shopify-secondary italic">
              No quick wins available right now. Focus on the ranked action plan above to lift your lowest-scoring products into the Needs Work range first.
            </p>
          )}
        </div>
      </div>

    </div>
  )
}

// ── Distribution bar sub-component ───────────────

function DistributionBar({ dist, total }) {
  if (total === 0) return null
  const pct = {
    critical: (dist.critical / total) * 100,
    needsWork: (dist.needsWork / total) * 100,
    optimized: (dist.optimized / total) * 100,
  }
  return (
    <div>
      <div className="flex h-6 rounded-btn overflow-hidden bg-shopify-border">
        {dist.critical > 0 && (
          <div
            className="flex items-center justify-center text-xs font-semibold text-white"
            style={{ width: `${pct.critical}%`, backgroundColor: '#D72C0D' }}
            title={`${dist.critical} critical`}
          >
            {pct.critical >= 8 ? dist.critical : ''}
          </div>
        )}
        {dist.needsWork > 0 && (
          <div
            className="flex items-center justify-center text-xs font-semibold text-shopify-warning-text"
            style={{ width: `${pct.needsWork}%`, backgroundColor: '#FFC453' }}
            title={`${dist.needsWork} needs work`}
          >
            {pct.needsWork >= 8 ? dist.needsWork : ''}
          </div>
        )}
        {dist.optimized > 0 && (
          <div
            className="flex items-center justify-center text-xs font-semibold text-white"
            style={{ width: `${pct.optimized}%`, backgroundColor: '#008060' }}
            title={`${dist.optimized} optimized`}
          >
            {pct.optimized >= 8 ? dist.optimized : ''}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 flex-wrap">
        <span className="flex items-center gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-shopify-critical" />
          <span className="text-shopify-secondary">Critical</span>
          <span className="font-semibold text-shopify-text">{dist.critical}</span>
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-shopify-warning" />
          <span className="text-shopify-secondary">Needs Work</span>
          <span className="font-semibold text-shopify-text">{dist.needsWork}</span>
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-shopify-green" />
          <span className="text-shopify-secondary">Optimized</span>
          <span className="font-semibold text-shopify-text">{dist.optimized}</span>
        </span>
      </div>
    </div>
  )
}
