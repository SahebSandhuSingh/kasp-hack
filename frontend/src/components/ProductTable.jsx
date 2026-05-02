import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CATEGORY_LABELS, CATEGORY_COLORS, ALL_CATEGORIES } from '../categoryConstants'

const STATUS_CONFIG = {
  optimized:  { label: 'Optimized',   bg: 'bg-shopify-success-light', text: 'text-shopify-green' },
  'needs-work': { label: 'Needs Work', bg: 'bg-shopify-warning-light', text: 'text-shopify-warning-text' },
  critical:   { label: 'Critical',    bg: 'bg-shopify-critical-light', text: 'text-shopify-critical' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['needs-work']
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

function ScorePill({ score }) {
  const safe = isNaN(score) ? 0 : score
  const color = safe >= 70 ? 'text-shopify-green' : safe >= 40 ? 'text-shopify-warning-text' : 'text-shopify-critical'
  return <span className={`font-bold text-sm ${color}`}>{safe}</span>
}

function SortIcon({ col, sortKey, sortDir }) {
  if (sortKey !== col) return (
    <svg className="inline ml-1 text-shopify-border" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 3.5L5 1.5L7 3.5M3 6.5L5 8.5L7 6.5"/>
    </svg>
  )
  return (
    <svg className="inline ml-1 text-shopify-green" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      {sortDir === 'asc'
        ? <path d="M3 6.5L5 4L7 6.5"/>
        : <path d="M3 4L5 6.5L7 4"/>
      }
    </svg>
  )
}

function CategoryBadge({ product, onOverride }) {
  const [open, setOpen] = useState(false)
  const cat = product.category || 'general'
  const conf = product.category_confidence || 'low'
  const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS.general
  const label = CATEGORY_LABELS[cat] || 'General'

  const borderStyle = conf === 'high' ? 'solid' : conf === 'medium' ? 'dashed' : 'dashed'
  const suffix = (conf === 'low' && cat !== 'general') ? '?' : ''

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors hover:opacity-80"
        style={{ backgroundColor: colors.bg, color: colors.text, borderWidth: '1px', borderStyle, borderColor: colors.text + '40' }}
        title={conf === 'low' ? 'Category auto-detected — click to correct' : `${label} (${conf} confidence)`}
      >
        {label}{suffix}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-40 bg-white rounded-card shadow-card border border-shopify-border py-1 w-44 fade-up">
          {ALL_CATEGORIES.map(c => {
            const cc = CATEGORY_COLORS[c] || CATEGORY_COLORS.general
            const cl = CATEGORY_LABELS[c] || c
            return (
              <button
                key={c}
                onClick={() => { onOverride(product.id, c); setOpen(false) }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-shopify-bg flex items-center gap-2 ${c === cat ? 'font-semibold' : ''}`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cc.text }} />
                {cl}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ProductTable({ setSelectedProduct, products = [] }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sortKey, setSortKey] = useState('score')
  const [sortDir, setSortDir] = useState('asc')
  const [overrides, setOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem('category_overrides') || '{}') } catch { return {} }
  })
  const [toast, setToast] = useState(null)

  const handleCategoryOverride = (productId, newCat) => {
    const next = { ...overrides, [productId]: newCat }
    setOverrides(next)
    localStorage.setItem('category_overrides', JSON.stringify(next))
    setToast('Category updated \u2014 score recalculated')
    setTimeout(() => setToast(null), 3000)
  }

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    let list = products.map(p => {
      const override = overrides[p.id]
      return {
        ...p,
        name: p.title || p.name,
        issues: p.issues_count ?? (Array.isArray(p.issues) ? p.issues.length : p.issues) ?? 0,
        score: p.score ?? 0,
        status: p.status || (p.score >= 70 ? 'optimized' : p.score >= 40 ? 'needs-work' : 'critical'),
        category: override || p.category || 'general',
        category_confidence: override ? 'high' : (p.category_confidence || 'low'),
        priceDisplay: typeof p.price === 'number' ? `\u20b9${p.price}` : (p.price || '\u20b90'),
      }
    })
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    }
    if (filter !== 'all') list = list.filter(p => p.status === filter)

    return [...list].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey]
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [search, filter, sortKey, sortDir, overrides])

  return (
    <div className="space-y-4">

      {/* Toast */}
      {toast && (
        <div className="bg-shopify-success-light border border-shopify-green/20 rounded-card px-4 py-3 text-sm font-medium text-shopify-green flex items-center gap-2 fade-up">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 12l3 3 5-5"/>
          </svg>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-shopify-text">Products</h1>
          <p className="text-sm text-shopify-secondary mt-0.5">{products.length} products synced from your store</p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white rounded-card shadow-card px-4 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-shopify-secondary" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="7" cy="7" r="4.5"/>
            <path d="M10.5 10.5L14 14"/>
          </svg>
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-shopify-border rounded-btn focus:outline-none focus:ring-1 focus:ring-shopify-green focus:border-shopify-green"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1">
          {['all', 'critical', 'needs-work', 'optimized'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-btn capitalize transition-colors ${
                filter === f
                  ? 'bg-shopify-green text-white'
                  : 'text-shopify-secondary hover:bg-shopify-bg'
              }`}
            >
              {f === 'all' ? `All (${products.length})` :
               f === 'critical' ? `Critical (${products.filter(p=>(p.score ?? 0) < 40).length})` :
               f === 'needs-work' ? `Needs Work (${products.filter(p=>(p.score ?? 0) >= 40 && (p.score ?? 0) < 70).length})` :
               `Optimized (${products.filter(p=>(p.score ?? 0) >= 70).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-card shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6D7175" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            <p className="text-sm font-medium text-shopify-text">No products match your search</p>
            <p className="text-xs text-shopify-secondary">Try a different search term or clear the filter</p>
            <button
              onClick={() => { setSearch(''); setFilter('all') }}
              className="mt-2 text-xs text-shopify-green font-medium hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-shopify-border bg-shopify-bg text-shopify-secondary text-xs uppercase tracking-wide">
                {[
                  { key: 'name', label: 'Product' },
                  { key: 'category', label: 'Category' },
                  { key: 'score', label: 'AI Score' },
                  { key: 'issues', label: 'Issues' },
                  { key: 'status', label: 'Status' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="text-left px-5 py-3 cursor-pointer select-none hover:text-shopify-text"
                  >
                    {col.label}
                    <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                  </th>
                ))}
                <th className="text-left px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-shopify-border">
              {filtered.map((p, i) => (
                <tr
                  key={p.id}
                  className="hover:bg-shopify-bg transition-colors"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-shopify-text">{p.name}</p>
                    <p className="text-xs text-shopify-secondary">{p.priceDisplay}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <CategoryBadge product={p} onOverride={handleCategoryOverride} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <ScorePill score={p.score} />
                      <div className="flex-1 bg-shopify-border rounded-full h-1.5 min-w-[48px]">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${isNaN(p.score) ? 0 : p.score}%`,
                            background: p.score >= 70 ? '#008060' : p.score >= 40 ? '#FFC453' : '#D72C0D',
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {p.issues === 0
                      ? <span className="text-shopify-secondary">—</span>
                      : <span className="font-medium text-shopify-critical">{p.issues} issue{p.issues !== 1 ? 's' : ''}</span>
                    }
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    {p.status !== 'optimized' ? (
                      <button
                        onClick={() => {
                          const original = products.find(op => String(op.id) === String(p.id)) || p
                          navigate(`/app/optimize?product_id=${original.id}`)
                        }}
                        className="text-xs font-medium text-shopify-green border border-shopify-green rounded-btn px-2.5 py-1 hover:bg-shopify-green-light transition-colors"
                      >
                        Optimize →
                      </button>
                    ) : (
                      <span className="text-xs text-shopify-secondary">✓ Done</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer count */}
      <p className="text-xs text-shopify-secondary text-right px-1">
        Showing {filtered.length} of {products.length} products
      </p>
    </div>
  )
}
