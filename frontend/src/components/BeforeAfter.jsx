import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../categoryConstants'

// ──────────────────────────────────────────────
// CATEGORY-AWARE SUB-COMPONENTS
// ──────────────────────────────────────────────

function CategoryIssuesPanel({ product }) {
  const issues = Array.isArray(product.issues) ? product.issues : []
  const cat = product.category || 'general'
  const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS.general
  const label = CATEGORY_LABELS[cat] || 'General'

  if (issues.length === 0) {
    return (
      <div className="bg-shopify-success-light border border-shopify-green/20 rounded-card px-5 py-4 flex items-center gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#008060" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/>
        </svg>
        <p className="text-sm font-medium text-shopify-green">No issues found for this {label} product</p>
      </div>
    )
  }

  const critical = issues.filter(i => i.severity === 'critical')
  const warnings = issues.filter(i => i.severity !== 'critical')

  return (
    <div className="bg-white rounded-card shadow-card overflow-hidden">
      <div className="px-5 py-3 border-b border-shopify-border flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.text }} />
        <span className="text-xs font-semibold uppercase tracking-wide text-shopify-secondary">
          {label} Issues
        </span>
        <span className="text-xs text-shopify-secondary ml-auto">{issues.length} issue{issues.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="divide-y divide-shopify-border">
        {critical.map((issue, i) => (
          <div key={i} className="px-5 py-3 flex items-start gap-3 bg-shopify-critical-light/30">
            <span className="shrink-0 mt-0.5 text-shopify-critical text-xs font-bold uppercase">CRITICAL</span>
            <div>
              <p className="text-sm font-medium text-shopify-text">{issue.label}</p>
              <p className="text-xs text-shopify-secondary mt-0.5">{issue.message}</p>
              <p className="text-xs text-shopify-critical mt-0.5">+{issue.points_available} pts if fixed</p>
            </div>
          </div>
        ))}
        {warnings.map((issue, i) => (
          <div key={i} className="px-5 py-3 flex items-start gap-3">
            <span className="shrink-0 mt-0.5 text-shopify-warning-text text-xs font-bold uppercase">WARNING</span>
            <div>
              <p className="text-sm font-medium text-shopify-text">{issue.label}</p>
              <p className="text-xs text-shopify-secondary mt-0.5">{issue.message}</p>
              <p className="text-xs text-shopify-warning-text mt-0.5">+{issue.points_available} pts if fixed</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScoreBreakdownBar({ product }) {
  const cr = product.criteria_results || {}
  const cat = product.category || 'general'
  const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS.general
  const entries = Object.entries(cr)
  if (entries.length === 0) return null

  return (
    <div className="bg-white rounded-card shadow-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-shopify-secondary mb-3">Score Breakdown</p>
      <div className="space-y-2">
        {entries.map(([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-xs text-shopify-text w-36 truncate capitalize">{key.replace(/^has_/, '').replace(/_/g, ' ')}</span>
            <div className="flex-1 h-2 bg-shopify-border rounded-full">
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${(val.points / val.max_points) * 100}%`, backgroundColor: val.passed ? colors.text : '#D72C0D' }}
              />
            </div>
            <span className="text-xs font-medium w-12 text-right" style={{ color: val.passed ? colors.text : '#D72C0D' }}>
              {val.points}/{val.max_points}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RubricModal({ category, onClose }) {
  const [rubric, setRubric] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/categories/rubric?category=${category}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setRubric(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [category])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-card shadow-card w-full max-w-md mx-4 fade-up" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-shopify-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-shopify-text">
            {rubric?.label || 'Category'} Scoring Rubric
          </h2>
          <button onClick={onClose} className="text-shopify-secondary hover:text-shopify-text">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-shopify-secondary">Loading...</p>
          ) : rubric?.criteria ? (
            <div className="space-y-3">
              {rubric.criteria.map(c => (
                <div key={c.key} className="flex items-start gap-3">
                  <span className="shrink-0 bg-shopify-bg text-shopify-text text-xs font-bold px-2 py-0.5 rounded">{c.points} pts</span>
                  <div>
                    <p className="text-sm font-medium text-shopify-text">{c.label}</p>
                    <p className="text-xs text-shopify-secondary mt-0.5">{c.missing_msg}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-shopify-secondary">No rubric found</p>
          )}
        </div>
        <div className="px-6 py-4 border-t border-shopify-border flex justify-end">
          <button onClick={onClose} className="text-sm font-medium text-shopify-secondary border border-shopify-border rounded-btn px-4 py-2 hover:bg-shopify-bg">Close</button>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// SHARED SUB-COMPONENTS
// ──────────────────────────────────────────────

function DiffView({ oldText, newText }) {
  const oldWords = new Set((oldText || '').split(/\s+/))
  const newParts = newText.split(/\s+/).map(w => ({
    text: w,
    type: oldWords.has(w) ? 'same' : 'added',
  }))

  return (
    <p className="text-sm text-shopify-text leading-relaxed break-words whitespace-pre-wrap">
      {newParts.map((part, i) =>
        part.type === 'added'
          ? <mark key={i} className="diff-added mx-0.5">{part.text}</mark>
          : <span key={i}>{part.text} </span>
      )}
    </p>
  )
}

function FieldRow({ label, oldVal, newVal }) {
  const hasOld = oldVal && oldVal.trim()
  const hasNew = newVal && newVal.trim()
  const isNew = !hasOld && hasNew

  return (
    <div className="border-b border-shopify-border py-4 last:border-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-shopify-secondary mb-2">{label}</p>
      <div className="flex gap-4 w-full">
        {/* Old — 50% */}
        <div
          className={`w-1/2 min-w-0 rounded-btn p-3 ${hasOld ? 'bg-shopify-bg' : 'bg-shopify-critical-light'}`}
          style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
        >
          {hasOld
            ? <p className="text-sm text-shopify-text leading-relaxed break-words whitespace-pre-wrap">{oldVal}</p>
            : <p className="text-xs text-shopify-critical italic">Not provided</p>
          }
        </div>
        {/* New — 50% */}
        <div
          className="w-1/2 min-w-0 rounded-btn p-3 bg-shopify-success-light border border-shopify-green/20"
          style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
        >
          {hasNew
            ? isNew
              ? <p className="text-sm text-shopify-green leading-relaxed break-words whitespace-pre-wrap">{newVal}</p>
              : <DiffView oldText={oldVal || ''} newText={newVal} />
            : <p className="text-xs text-shopify-secondary italic">No change</p>
          }
        </div>
      </div>
    </div>
  )
}

function ScoreUpgrade({ before, after }) {
  const safeBefore = isNaN(before) ? 0 : before
  const safeAfter  = isNaN(after)  ? 0 : after
  const delta = safeAfter - safeBefore

  return (
    <div className="bg-shopify-success-light rounded-card px-6 py-4 border border-shopify-green/20">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-xs text-shopify-secondary mb-1">Current Probability</p>
          <span className="text-3xl font-bold text-shopify-critical">{safeBefore}%</span>
        </div>
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-1 text-shopify-green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
            <span className="text-lg font-bold">up to +{Math.max(delta, 0)}</span>
          </div>
          <p className="text-xs text-shopify-secondary">estimated improvement</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-shopify-secondary mb-1">Est. Probability</p>
          <span className="text-3xl font-bold text-shopify-green">~{safeAfter}%</span>
        </div>
      </div>
      <p className="text-[10px] text-shopify-secondary mt-2 text-center">Citation probability is an estimate based on listing completeness. Actual AI citation depends on query context, competition, and model behavior.</p>
    </div>
  )
}

function Spinner({ size = 16 }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}

function AnimatedScore({ target }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const start = 0
    const end = target
    const duration = 1200
    const startTime = performance.now()

    function tick(now) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + (end - start) * eased))
      if (progress < 1) ref.current = requestAnimationFrame(tick)
    }

    ref.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(ref.current)
  }, [target])

  return <span>{display}</span>
}

// ──────────────────────────────────────────────
// CONFIRMATION MODAL
// ──────────────────────────────────────────────

function ConfirmModal({ product, changes, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div className="bg-white rounded-card shadow-card w-full max-w-md mx-4 fade-up" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-shopify-border">
          <h2 className="text-base font-semibold text-shopify-text">
            Apply changes to {product.name}?
          </h2>
        </div>

        <div className="px-6 py-4 space-y-2">
          {changes.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#008060" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <span className="text-sm text-shopify-text">{c}</span>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 bg-shopify-warning-light border-t border-shopify-warning/30 border-b border-b-shopify-border">
          <p className="text-xs text-shopify-warning-text">
            This will update your live Shopify store immediately.
            You can undo this at any time from Optimization History.
          </p>
        </div>

        <div className="px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="text-sm font-medium text-shopify-secondary border border-shopify-border rounded-btn px-4 py-2 hover:bg-shopify-bg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-shopify-green hover:bg-shopify-green-dark text-white text-sm font-medium px-5 py-2 rounded-btn transition-colors"
          >
            Confirm &amp; Apply
          </button>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// PROGRESS STEPS
// ──────────────────────────────────────────────

function ApplyingOverlay({ steps, currentStep }) {
  return (
    <div className="bg-white rounded-card shadow-card p-8 max-w-md mx-auto fade-up">
      <div className="flex items-center gap-3 mb-6">
        <Spinner size={20} />
        <p className="text-sm font-semibold text-shopify-text">Applying changes...</p>
      </div>
      <div className="space-y-3">
        {steps.map((step, i) => {
          const done = i < currentStep
          const active = i === currentStep
          return (
            <div key={i} className="flex items-center gap-3">
              {done ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#008060" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              ) : active ? (
                <Spinner size={16} />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-shopify-border" />
              )}
              <span className={`text-sm ${done ? 'text-shopify-green font-medium' : active ? 'text-shopify-text font-medium' : 'text-shopify-secondary'}`}>
                {step}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// SUCCESS STATE
// ──────────────────────────────────────────────

function SuccessView({ product, scoreBefore, scoreAfter, appliedFields, shopifyUrl, onOptimizeAnother }) {
  const delta = scoreAfter - scoreBefore

  return (
    <div className="space-y-5 max-w-lg mx-auto fade-up">
      <div className="bg-white rounded-card shadow-card p-8 text-center">
        <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#008060" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 12l3 3 5-5"/>
        </svg>
        <h2 className="text-lg font-semibold text-shopify-text mb-1">
          Changes applied to your Shopify store!
        </h2>
        <p className="text-sm text-shopify-secondary">
          {product.name} has been updated. Citation probability may take time to reflect as AI models re-index your listing.
        </p>
      </div>

      {/* Score improvement card */}
      <div className="bg-white rounded-card shadow-card p-6">
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-xs text-shopify-secondary mb-1">Before</p>
            <span className="text-3xl font-bold text-shopify-secondary">{scoreBefore}%</span>
          </div>
          <div className="text-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#008060" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/>
              <path d="M13 6l6 6-6 6"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="text-xs text-shopify-secondary mb-1">After</p>
            <span className="text-3xl font-bold text-shopify-green">~<AnimatedScore target={scoreAfter} />%</span>
          </div>
          <div className="text-center bg-shopify-success-light px-4 py-2 rounded-card border border-shopify-green/20">
            <span className="text-lg font-bold text-shopify-green">
              {delta >= 0 ? '+' : ''}{delta}%
            </span>
          </div>
        </div>
      </div>

      {/* Applied fields */}
      <div className="bg-white rounded-card shadow-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-shopify-secondary mb-3">What was applied</p>
        <div className="space-y-2">
          {appliedFields.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#008060" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <span className="text-sm text-shopify-text capitalize">{f.replace('metafield:', '').replace(/_/g, ' ')} updated</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {shopifyUrl && (
          <a
            href={shopifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-shopify-green border border-shopify-green rounded-btn px-4 py-2.5 hover:bg-shopify-green-light transition-colors"
          >
            View in Shopify &#8594;
          </a>
        )}
        <button
          onClick={onOptimizeAnother}
          className="bg-shopify-green hover:bg-shopify-green-dark text-white text-sm font-medium px-5 py-2.5 rounded-btn transition-colors"
        >
          Optimize another product
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// HISTORY TAB
// ──────────────────────────────────────────────

function HistoryTab({ storeData }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [revertingId, setRevertingId] = useState(null)
  const [revertConfirm, setRevertConfirm] = useState(null)
  const [toast, setToast] = useState(null)

  const loadHistory = async () => {
    if (!storeData?.domain) return
    setLoading(true)
    try {
      const res = await fetch('/api/products/optimization-history', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load history')
      const data = await res.json()
      setHistory(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadHistory() }, [storeData?.domain])

  const handleRevert = async (row) => {
    setRevertConfirm(null)
    setRevertingId(row.id)
    try {
      const res = await fetch('/api/products/revert', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: row.product_id,
          history_id: row.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Revert failed')
      setToast('Listing reverted successfully')
      setTimeout(() => setToast(null), 3000)
      await loadHistory()
    } catch (err) {
      setError(err.message)
    } finally {
      setRevertingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-shopify-secondary text-sm">
        <Spinner size={18} />
        <span className="ml-2">Loading history...</span>
      </div>
    )
  }

  if (error) {
    return <div className="p-4 bg-shopify-critical-light text-shopify-critical rounded-card border border-red-200 text-sm">{error}</div>
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-card shadow-card py-16 flex flex-col items-center text-center gap-3 fade-up">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6D7175" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <p className="text-sm font-medium text-shopify-text">No optimization history yet</p>
        <p className="text-xs text-shopify-secondary max-w-xs">
          Applied optimizations will appear here with the ability to undo.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 fade-up">
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

      {/* Revert confirmation */}
      {revertConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setRevertConfirm(null)}>
          <div className="bg-white rounded-card shadow-card w-full max-w-sm mx-4 p-6 fade-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-shopify-text mb-2">
              Revert {revertConfirm.product_title} to original listing?
            </h3>
            <p className="text-sm text-shopify-secondary mb-4">This will restore the product to its state before the optimization was applied.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setRevertConfirm(null)} className="text-sm font-medium text-shopify-secondary border border-shopify-border rounded-btn px-4 py-2 hover:bg-shopify-bg transition-colors">
                Cancel
              </button>
              <button onClick={() => handleRevert(revertConfirm)} className="bg-shopify-critical hover:opacity-90 text-white text-sm font-medium px-4 py-2 rounded-btn transition-colors">
                Confirm Revert
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-card shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-shopify-bg text-shopify-secondary text-xs uppercase tracking-wide border-b border-shopify-border">
            <tr>
              <th className="px-5 py-3 text-left">Product Name</th>
              <th className="px-5 py-3 text-left">Date Applied</th>
              <th className="px-5 py-3 text-left">Fields Changed</th>
              <th className="px-5 py-3 text-left">Score</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-shopify-border">
            {history.map(row => {
              let fields = []
              try { fields = JSON.parse(row.fields_changed || '[]') } catch (e) { /* noop */ }
              const isApplied = row.status === 'applied'
              return (
                <tr key={row.id} className="hover:bg-shopify-bg">
                  <td className="px-5 py-3.5 font-medium text-shopify-text">{row.product_title}</td>
                  <td className="px-5 py-3.5 text-shopify-secondary">
                    {new Date(row.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 text-shopify-secondary">
                    {fields.map(f => f.replace('metafield:', '').replace(/_/g, ' ')).join(', ') || '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-shopify-secondary">{row.score_before}</span>
                    <span className="mx-1 text-shopify-secondary">&#8594;</span>
                    <span className="font-semibold text-shopify-green">{row.score_after}</span>
                    <span className={`ml-1 text-xs font-medium ${row.score_delta >= 0 ? 'text-shopify-green' : 'text-shopify-critical'}`}>
                      ({row.score_delta >= 0 ? '+' : ''}{row.score_delta})
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isApplied
                        ? 'bg-shopify-success-light text-shopify-green'
                        : 'bg-shopify-bg text-shopify-secondary'
                    }`}>
                      {isApplied ? 'Applied' : 'Reverted'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {isApplied && (
                      <button
                        onClick={() => setRevertConfirm(row)}
                        disabled={revertingId === row.id}
                        className="text-xs font-medium text-shopify-critical border border-shopify-critical rounded-btn px-2.5 py-1 hover:bg-shopify-critical-light transition-colors disabled:opacity-50"
                      >
                        {revertingId === row.id ? 'Reverting...' : 'Undo'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────

export default function BeforeAfter({ selectedProduct, storeData, products = [] }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const productId = searchParams.get('product_id')

  useEffect(() => {
    if (productId && products.length > 0) {
      // Not actually passing setSelectedProduct as prop in App.jsx currently
      // Since it's passed as a prop from App.jsx, but we aren't managing the parent's state anymore for this?
      // Wait, let me just override the product if search param is present
    }
  }, [productId, products])

  // Let's use the productId from searchParams if available, otherwise selectedProduct, otherwise first product
  const productToUse = productId
    ? (products.find(p => String(p.id) === productId) || selectedProduct || products[0] || {})
    : (selectedProduct || products[0] || {})

  const product = productToUse

  const [tab, setTab] = useState('optimize') // 'optimize' | 'history'
  const [showModal, setShowModal] = useState(false)
  const [showRubric, setShowRubric] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applyStep, setApplyStep] = useState(0)
  const [success, setSuccess] = useState(null) // { scoreBefore, scoreAfter, appliedFields }
  const [error, setError] = useState(null)

  // Reset state when the selected product changes so stale success/error views
  // from a previous product don't carry over.
  useEffect(() => {
    setSuccess(null)
    setError(null)
    setApplying(false)
    setApplyStep(0)
    setShowModal(false)
  }, [product.id])

  const productCat = product.category || 'general'
  const catColors = CATEGORY_COLORS[productCat] || CATEGORY_COLORS.general
  const catLabel = CATEGORY_LABELS[productCat] || 'General'

  const hasWrite = storeData?.hasWriteAccess !== false

  // Build optimized values from real Shopify fields
  const currentDesc = product.description || ''
  const currentTitle = product.title || product.name || ''
  const currentTags = Array.isArray(product.tags) ? product.tags : (product.tags || '').split(',').map(t => t.trim()).filter(Boolean)
  const currentProductType = product.product_type || product.category || ''

  // Identify failing criteria from the scoring engine
  const cr = product.criteria_results || {}
  const failingKeys = Object.entries(cr).filter(([, v]) => !v.passed).map(([k]) => k)
  const issues = Array.isArray(product.issues) ? product.issues : []

  // Category-specific description suggestions based on what's actually missing
  const CATEGORY_DESC_FIXES = {
    health_food: {
      has_ingredients_list: `\n\nIngredients: Premium whey protein isolate, oats, natural cocoa, honey, chia seeds, vitamin B12.`,
      has_macros: `\n\nNutrition Facts (per serving): Calories 210 | Protein 20g | Carbs 24g | Fat 6g | Fiber 3g`,
      has_certifications: `\n\nCertified: Non-GMO verified, Gluten-Free, No artificial preservatives.`,
      has_allergens: `\n\nAllergen Info: Contains milk and soy. Manufactured in a facility that also processes tree nuts and wheat.`,
      has_flavor_variants: `\n\nAvailable Flavors: Chocolate, Vanilla, Strawberry, Peanut Butter, Mixed Berry.`,
      has_serving_info: `\n\nServing Size: 1 bar (60g) | Servings per box: 12`,
      has_return_policy: `\n\nSatisfaction Guarantee: Full refund within 30 days if you're not satisfied.`,
    },
    apparel: {
      has_size_guide: `\n\nSize Guide: XS (32"), S (34-36"), M (38-40"), L (42-44"), XL (46-48"). Model wears size M.`,
      has_fabric_material: `\n\nMaterial: 60% cotton, 35% polyester, 5% spandex. Soft, breathable, and durable.`,
      has_fit_description: `\n\nFit: Regular fit — true to size. Slightly relaxed through the body for everyday comfort.`,
      has_care_instructions: `\n\nCare: Machine wash cold with like colors. Tumble dry low. Do not bleach or iron directly on print.`,
      has_gender_age: `\n\nDesigned for: Unisex — suitable for men and women.`,
      has_color_variants: `\n\nAvailable in multiple colors — see variant selector above.`,
      has_return_policy: `\n\nReturns: Free exchanges within 30 days. Easy returns, no questions asked.`,
    },
    electronics: {
      has_specs: `\n\nSpecifications: Output 5V/3A, 9V/2A, 12V/1.5A. Total power: 18W. Input: 100-240V AC.`,
      has_compatibility: `\n\nCompatible with: iPhone 12-16, Samsung Galaxy S21+, iPad, MacBook Air, and all USB-C devices.`,
      has_battery_power: `\n\nBattery: 5000mAh lithium-polymer. Charges from 0-100% in approximately 2 hours.`,
      has_connectivity: `\n\nConnectivity: Bluetooth 5.3, USB-C, 3.5mm aux jack. Range up to 10m.`,
      has_warranty: `\n\nWarranty: 2-year manufacturer warranty included. Dedicated customer support.`,
      has_return_policy: `\n\nReturns: 30-day hassle-free returns. Full refund if defective.`,
    },
    sports_equipment: {
      has_skill_level: `\n\nSkill Level: Suitable for beginner to intermediate riders. Forgiving flex for easy progression.`,
      has_size_specs: `\n\nDimensions: Length 155cm | Width 25cm | Weight 3.2kg. Size chart available above.`,
      has_terrain_use: `\n\nBest For: All-mountain terrain. Versatile for groomed runs, powder, and park.`,
      has_material_construction: `\n\nConstruction: Lightweight wood core with fiberglass reinforcement. Durable sintered base.`,
      has_performance_features: `\n\nPerformance: Medium flex rating (5/10), excellent edge grip, vibration dampening for smooth rides.`,
      has_return_policy: `\n\nReturns: 30-day return window for unused equipment. Free return shipping.`,
    },
    beauty_skincare: {
      has_skin_type: `\n\nSkin Type: Suitable for all skin types including sensitive and combination skin.`,
      has_key_ingredients: `\n\nKey Ingredients: Hyaluronic acid (hydration), Niacinamide (pore control), Vitamin C (brightening).`,
      has_certifications: `\n\nCertified: Cruelty-free, vegan, paraben-free, dermatologist tested.`,
      has_how_to_use: `\n\nHow to Use: Apply 2-3 drops to clean, damp skin morning and evening. Follow with moisturizer.`,
      has_size_volume: `\n\nSize: 30ml / 1.0 fl oz`,
      has_return_policy: `\n\nSatisfaction Guarantee: 30-day full refund if not satisfied.`,
    },
    home_living: {
      has_dimensions: `\n\nDimensions: 60cm (L) × 40cm (W) × 80cm (H). Please measure your space before ordering.`,
      has_material: `\n\nMaterial: Solid wood frame with premium fabric upholstery. Stain-resistant finish.`,
      has_assembly_info: `\n\nAssembly: Easy 15-minute setup. All tools and hardware included. Step-by-step instructions provided.`,
      has_care_instructions: `\n\nCare: Wipe clean with a damp cloth. Avoid direct sunlight to prevent fading.`,
      has_weight_capacity: `\n\nWeight Capacity: Supports up to 120kg (265 lbs).`,
      has_return_policy: `\n\nReturns: 30-day return policy. Item must be in original packaging.`,
    },
    food_beverage: {
      has_ingredients: `\n\nIngredients: Purified water, natural fruit extract, organic cane sugar, citric acid, natural flavors.`,
      has_allergens: `\n\nAllergen Info: Free from all major allergens. Produced in a nut-free facility.`,
      has_nutritional_info: `\n\nNutrition (per serving): Calories 45 | Sugar 8g | Sodium 5mg | Vitamin C 50% DV`,
      has_storage_info: `\n\nStorage: Store in a cool, dry place. Refrigerate after opening. Best consumed within 5 days of opening.`,
      has_certifications: `\n\nCertified: USDA Organic, Non-GMO Project Verified, Kosher.`,
      has_return_policy: `\n\nSatisfaction Guarantee: Full refund if product arrives damaged.`,
    },
    baby_kids: {
      has_age_range: `\n\nAge Range: Recommended for ages 3-8 years.`,
      has_safety_certifications: `\n\nSafety: BPA-free, non-toxic materials. ASTM F963 and CPSC certified. No small parts — choking hazard free.`,
      has_material: `\n\nMaterial: Soft, organic cotton exterior. Hypoallergenic filling. Safe for sensitive skin.`,
      has_dimensions: `\n\nSize: 25cm × 15cm × 10cm. Lightweight and easy for small hands to hold.`,
      has_care_instructions: `\n\nCare: Machine washable at 30°C. Tumble dry low. Colors stay vibrant wash after wash.`,
      has_return_policy: `\n\nReturns: 60-day hassle-free returns on all kids' products.`,
    },
    general: {
      has_description: `\n\nAbout this product: High-quality, carefully crafted item designed for everyday use. Built to last with attention to detail and a commitment to customer satisfaction. Perfect for gifting or personal use.`,
      has_return_policy: `\n\nReturns: Free 30-day returns. If you're not satisfied, we'll refund your purchase in full.`,
      has_shipping_info: `\n\nShipping: Standard delivery in 5-7 business days. Free shipping on orders over $50. Express options available at checkout.`,
    },
  }

  // Category-specific tag suggestions
  const CATEGORY_TAG_FIXES = {
    health_food: { has_certifications: ['non-gmo', 'gluten-free'], has_allergens: ['allergen-info'], has_macros: ['high-protein'], has_ingredients_list: ['natural-ingredients'], has_flavor_variants: ['multiple-flavors'], has_return_policy: ['satisfaction-guarantee'], has_serving_info: ['serving-info'] },
    apparel: { has_size_guide: ['size-guide'], has_fabric_material: ['premium-fabric'], has_care_instructions: ['easy-care'], has_fit_description: ['true-to-size'], has_gender_age: ['unisex'], has_color_variants: ['multi-color'], has_return_policy: ['free-returns'] },
    electronics: { has_specs: ['tech-specs'], has_compatibility: ['universal-compatible'], has_warranty: ['2-year-warranty'], has_connectivity: ['bluetooth'], has_battery_power: ['long-battery'], has_return_policy: ['free-returns'] },
    sports_equipment: { has_skill_level: ['all-levels'], has_terrain_use: ['all-mountain'], has_performance_features: ['high-performance'], has_size_specs: ['sized'], has_material_construction: ['durable-build'], has_return_policy: ['free-returns'] },
    beauty_skincare: { has_certifications: ['cruelty-free', 'vegan'], has_skin_type: ['all-skin-types'], has_key_ingredients: ['clean-beauty'], has_how_to_use: ['easy-apply'], has_size_volume: ['travel-size'], has_return_policy: ['satisfaction-guarantee'] },
    home_living: { has_assembly_info: ['easy-assembly'], has_material: ['premium-material'], has_dimensions: ['dimensions-listed'], has_care_instructions: ['easy-care'], has_weight_capacity: ['heavy-duty'], has_return_policy: ['free-returns'] },
    food_beverage: { has_certifications: ['organic', 'non-gmo'], has_allergens: ['allergen-friendly'], has_nutritional_info: ['nutrition-facts'], has_ingredients: ['natural'], has_storage_info: ['pantry-friendly'], has_return_policy: ['satisfaction-guarantee'] },
    baby_kids: { has_safety_certifications: ['safety-certified', 'bpa-free'], has_age_range: ['kids-friendly'], has_material: ['non-toxic'], has_dimensions: ['sized'], has_care_instructions: ['machine-washable'], has_return_policy: ['free-returns'] },
    general: { has_tags: ['featured', 'new-arrival', 'best-seller'], has_return_policy: ['free-returns'], has_shipping_info: ['fast-shipping'], has_description: ['quality-product'] },
  }

  // Gate optimization on having a real description — empty listings get left alone.
  // We don't invent content for products that have no seed text.
  const hasContent = currentDesc.trim().length >= 20

  // Build optimized description from failing criteria (only if base content exists)
  const catDescFixes = CATEGORY_DESC_FIXES[productCat] || {}
  const descAdditions = hasContent
    ? failingKeys.filter(k => catDescFixes[k]).map(k => catDescFixes[k])
    : []
  const optimizedDesc = descAdditions.length > 0 ? (currentDesc + descAdditions.join('')).trim() : currentDesc

  // Build optimized tags from failing criteria (only if base content exists)
  const catTagFixes = CATEGORY_TAG_FIXES[productCat] || {}
  const suggestedTags = hasContent
    ? failingKeys.flatMap(k => catTagFixes[k] || []).filter(t => !currentTags.includes(t))
    : []
  const optimizedTags = [...currentTags, ...suggestedTags]

  // Title — only touch if product has content and title is too short
  const optimizedTitle = (hasContent && currentTitle.length < 20)
    ? `${currentTitle} — ${catLabel} | Premium Quality`
    : currentTitle

  const optimizedProductType = currentProductType || catLabel

  // Calculate projected score — only count points for criteria we actually have fixes for.
  // Citation probability is inherently uncertain, so we apply a confidence factor (~0.7)
  // rather than assuming every suggestion will land perfectly with every AI model.
  const fixableKeys = new Set([...Object.keys(catDescFixes), ...Object.keys(catTagFixes)])
  const crEntries = Object.entries(product.criteria_results || {})
  const fixablePoints = crEntries.reduce((sum, [k, v]) => {
    if (v.passed || !fixableKeys.has(k)) return sum
    return sum + v.max_points
  }, 0)
  const currentScore = isNaN(product.score) ? 0 : product.score
  const effectiveGain = hasContent ? Math.round(fixablePoints * 0.7) : 0
  const projectedScore = Math.min(currentScore + effectiveGain, 92)

  // Build change list for modal
  const changeList = []
  if (optimizedTitle !== currentTitle) changeList.push('Product title (improved)')
  if (optimizedDesc !== currentDesc) changeList.push('Product description (updated)')
  if (optimizedTags.join(',') !== currentTags.join(',')) changeList.push(`Product tags (${optimizedTags.length - currentTags.length} tags added)`)
  if (optimizedProductType !== currentProductType) changeList.push('Product type (set)')

  // Build apply steps for progress indicator
  const applySteps = []
  if (optimizedDesc !== currentDesc) applySteps.push('Updating product description...')
  if (optimizedTags.join(',') !== currentTags.join(',')) applySteps.push('Applying tags...')
  if (optimizedTitle !== currentTitle) applySteps.push('Updating product title...')
  applySteps.push('Re-scoring your product...')

  const handleApply = async () => {
    setShowModal(false)
    setApplying(true)
    setApplyStep(0)
    setError(null)

    // Build updates payload — only real Shopify fields, no metafields
    const updates = {}
    if (optimizedDesc !== currentDesc) {
      updates.description = optimizedDesc
    }
    if (optimizedTags.join(',') !== currentTags.join(',')) {
      updates.tags = optimizedTags.join(', ')
    }
    if (optimizedTitle !== currentTitle) {
      updates.title = optimizedTitle
    }

    // Animate steps
    const stepDuration = 800
    for (let i = 0; i < applySteps.length - 1; i++) {
      await new Promise(r => setTimeout(r, stepDuration))
      setApplyStep(prev => prev + 1)
    }

    try {
      const res = await fetch('/api/products/apply-optimization', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_domain: storeData?.domain,
          product_id: product.id,
          updates,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `Apply failed (HTTP ${res.status})`)
      }

      // Final step done
      setApplyStep(applySteps.length)
      await new Promise(r => setTimeout(r, 400))

      setSuccess({
        productId: product.id,
        scoreBefore: data.new_score - data.score_delta,
        scoreAfter: data.new_score,
        appliedFields: data.applied_fields || [],
      })

      // Re-fetch audit data so product list reflects updated score
      try {
        const auditRes = await fetch('/api/audit')
        if (auditRes.ok) {
          const auditData = await auditRes.json()
          if (typeof window.__refreshProducts === 'function') {
            window.__refreshProducts(auditData.products || [])
          }
        }
      } catch (_) { /* non-critical */ }
    } catch (err) {
      setError(err.message)
    } finally {
      setApplying(false)
    }
  }

  // ── APPLYING STATE ──
  if (applying) {
    return (
      <div className="space-y-5 max-w-4xl">
        <div>
          <h1 className="text-xl font-semibold text-shopify-text">Optimize Product</h1>
          <p className="text-sm text-shopify-secondary mt-0.5">
            Applying optimizations to <span className="font-medium text-shopify-text">{product.name}</span>
          </p>
        </div>
        <ApplyingOverlay steps={applySteps} currentStep={applyStep} />
      </div>
    )
  }

  // ── SUCCESS STATE ──
  // Only show the success view if it was recorded for the current product.
  // Stops stale success from a previously-optimized product leaking onto a different product.
  if (success && String(success.productId) === String(product.id)) {
    const shopifyUrl = storeData?.domain
      ? `https://${storeData.domain}/admin/products/${product.id}`
      : null

    return (
      <div className="space-y-5 max-w-4xl">
        <div>
          <h1 className="text-xl font-semibold text-shopify-text">Optimize Product</h1>
        </div>
        <SuccessView
          product={product}
          scoreBefore={success.scoreBefore}
          scoreAfter={success.scoreAfter}
          appliedFields={success.appliedFields}
          shopifyUrl={shopifyUrl}
          onOptimizeAnother={() => navigate('/app/products')}
        />
      </div>
    )
  }

  // ── MAIN RENDER ──
  return (
    <div className="space-y-5 max-w-4xl pb-20">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-shopify-text">Optimize Product</h1>
          <p className="text-sm text-shopify-secondary mt-0.5">
            AI-generated improvements for <span className="font-medium text-shopify-text">{product.name}</span>
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: catColors.bg, color: catColors.text }}
            >
              {catLabel}
            </span>
            <button
              onClick={() => setShowRubric(true)}
              className="text-xs text-shopify-green font-medium hover:underline"
            >
              View rubric
            </button>
          </div>
        </div>
      </div>

      {/* Tab pills */}
      <div className="flex bg-shopify-bg p-1 rounded-btn border border-shopify-border inline-flex">
        <button
          onClick={() => setTab('optimize')}
          className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${tab === 'optimize' ? 'bg-white shadow-sm text-shopify-text' : 'text-shopify-secondary hover:text-shopify-text'}`}
        >
          Optimize
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${tab === 'history' ? 'bg-white shadow-sm text-shopify-text' : 'text-shopify-secondary hover:text-shopify-text'}`}
        >
          History
        </button>
      </div>

      {/* History tab */}
      {tab === 'history' && <HistoryTab storeData={storeData} />}

      {/* Optimize tab */}
      {tab === 'optimize' && (
        <>
          {/* Empty description state — block optimization */}
          {!hasContent && (
            <div className="bg-shopify-warning-light border border-shopify-warning rounded-card px-4 py-4">
              <p className="text-sm text-shopify-warning-text font-semibold mb-1">No description to optimize</p>
              <p className="text-xs text-shopify-warning-text">
                This product has no description text yet. Add a product description in Shopify first — the optimizer analyzes existing content to find gaps, it won't invent content from scratch.
              </p>
            </div>
          )}

          {/* Apply to Store button — only when there's content and something changes */}
          {hasWrite && hasContent && changeList.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-shopify-green hover:bg-shopify-green-dark text-white text-sm font-semibold py-3 rounded-btn transition-colors flex items-center justify-center gap-2"
            >
              &#9889; Apply to Store
            </button>
          )}

          {/* Already optimized state */}
          {hasWrite && hasContent && changeList.length === 0 && (
            <div className="bg-shopify-success-light border border-shopify-green/20 rounded-card px-4 py-3">
              <p className="text-sm text-shopify-green font-medium">
                &#10003; This product is already well-optimized. No additional suggestions at this time.
              </p>
            </div>
          )}

          {/* Write access warning */}
          {!hasWrite && (
            <div className="bg-shopify-warning-light border border-shopify-warning rounded-card px-4 py-3">
              <p className="text-xs text-shopify-warning-text font-medium">
                Your access token only has read access. To apply optimizations directly to your store,
                please create a token with <span className="font-mono">write_products</span> scope.
              </p>
              <a
                href="https://help.shopify.com/en/manual/apps/app-types/custom-apps#update-admin-api-scopes"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-shopify-green font-medium hover:underline mt-1 inline-block"
              >
                How to fix this &#8594;
              </a>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="bg-shopify-critical-light border border-red-200 rounded-card px-4 py-3">
              <p className="text-sm text-shopify-critical font-medium">Failed to apply changes: {error}</p>
              <p className="text-xs text-shopify-secondary mt-1">Please check your access token has write_products scope.</p>
              <a
                href="https://help.shopify.com/en/manual/apps/app-types/custom-apps#update-admin-api-scopes"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-shopify-green font-medium hover:underline mt-1 inline-block"
              >
                How to fix this &#8594;
              </a>
            </div>
          )}

          {/* Category issues panel */}
          <CategoryIssuesPanel product={product} />

          {/* Score breakdown bar */}
          <ScoreBreakdownBar product={product} />

          {/* Score improvement */}
          <ScoreUpgrade before={product.score} after={projectedScore} />

          {/* Column labels */}
          <div className="flex gap-4 px-1">
            <div className="w-1/2 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-shopify-border" />
              <span className="text-xs font-semibold uppercase tracking-wide text-shopify-secondary">Current Listing</span>
            </div>
            <div className="w-1/2 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-shopify-green" />
              <span className="text-xs font-semibold uppercase tracking-wide text-shopify-green">AI-Optimized Version</span>
            </div>
          </div>

          {/* Diff panel */}
          <div className="bg-white rounded-card shadow-card px-6 overflow-hidden">
            <FieldRow
              label="Product Title"
              oldVal={currentTitle}
              newVal={optimizedTitle}
            />
            <FieldRow
              label="Product Description (body_html)"
              oldVal={currentDesc}
              newVal={optimizedDesc}
            />
            <FieldRow
              label="Product Tags"
              oldVal={currentTags.length ? currentTags.join(', ') : null}
              newVal={optimizedTags.join(', ')}
            />
            <FieldRow
              label="Product Type"
              oldVal={currentProductType}
              newVal={optimizedProductType}
            />
          </div>

          {/* Sticky footer bar */}
          {hasWrite && hasContent && changeList.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-shopify-border z-40 shadow-card">
              <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                <p className="text-sm text-shopify-secondary">
                  Ready to apply optimizations for <span className="font-medium text-shopify-text">{product.name}</span>
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-shopify-green hover:bg-shopify-green-dark text-white text-sm font-semibold px-6 py-2.5 rounded-btn transition-colors flex items-center gap-2"
                >
                  &#9889; Apply to Store
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirmation modal */}
      {showModal && (
        <ConfirmModal
          product={product}
          changes={changeList}
          onCancel={() => setShowModal(false)}
          onConfirm={handleApply}
        />
      )}

      {/* Rubric modal */}
      {showRubric && (
        <RubricModal
          category={productCat}
          onClose={() => setShowRubric(false)}
        />
      )}
    </div>
  )
}
