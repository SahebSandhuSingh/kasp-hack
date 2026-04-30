import { useState, useEffect } from 'react'
import { STORE, OVERVIEW, ISSUES_SUMMARY, PRODUCTS } from '../mockData'

// SVG ring chart
function ScoreRing({ score }) {
  const safeScore = isNaN(score) ? 0 : score
  const r = 45
  const circ = 2 * Math.PI * r   // ≈ 282.7
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

export default function Dashboard({ setView }) {
  const critical = PRODUCTS.filter(p => p.status === 'critical')
  const optimized = PRODUCTS.filter(p => p.status === 'optimized')

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-shopify-text">Store Overview</h1>
          <p className="text-sm text-shopify-secondary mt-0.5">
            Connected to <span className="font-medium text-shopify-text">{STORE.name}</span>
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
            <ScoreRing score={OVERVIEW.aiVisibilityScore} />
          </div>
          <p className="text-xs text-shopify-secondary text-center max-w-[180px]">
            How well your products appear in AI-powered shopping recommendations
          </p>
        </div>

        {/* Stat cards */}
        <div className="col-span-12 md:col-span-8 grid grid-cols-2 gap-4">
          <StatCard
            label="Total Products"
            value={STORE.totalProducts}
            sub={`${optimized.length} fully optimized`}
          />
          <StatCard
            label="Products Optimized"
            value={optimized.length}
            sub={`${STORE.totalProducts - optimized.length} still need work`}
            accent="text-shopify-green"
          />
          <StatCard
            label="Issues Found"
            value={OVERVIEW.issuesFound}
            sub="Across all products"
            accent="text-shopify-critical"
          />
          <StatCard
            label="Est. Revenue Impact"
            value={OVERVIEW.estRevenueImpact}
            sub="If all issues are fixed"
            accent="text-shopify-green"
          />
        </div>
      </div>

      {/* Issues + critical products row */}
      <div className="grid grid-cols-12 gap-4">

        {/* Issues breakdown */}
        <div className="col-span-12 md:col-span-6 bg-white rounded-card shadow-card fade-up">
          <div className="px-5 py-4 border-b border-shopify-border">
            <h2 className="text-sm font-semibold text-shopify-text">Issues Breakdown</h2>
          </div>
          <div className="divide-y divide-shopify-border">
            {ISSUES_SUMMARY.map((issue, i) => {
              const cfg = SEVERITY_CONFIG[issue.severity]
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
            })}
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
              <span className="text-2xl">🎉</span>
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

    </div>
  )
}
