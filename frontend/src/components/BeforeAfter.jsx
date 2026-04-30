import { useState } from 'react'
import { PRODUCTS } from '../mockData'

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
    <div className="flex items-center gap-4 bg-shopify-success-light rounded-card px-6 py-4 border border-shopify-green/20">
      <div className="text-center">
        <p className="text-xs text-shopify-secondary mb-1">Current Score</p>
        <span className="text-3xl font-bold text-shopify-critical">{safeBefore}</span>
      </div>
      <div className="flex-1 text-center">
        <div className="flex items-center justify-center gap-1 text-shopify-green">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
            <polyline points="17 6 23 6 23 12"/>
          </svg>
          <span className="text-lg font-bold">+{delta}</span>
        </div>
        <p className="text-xs text-shopify-secondary">projected improvement</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-shopify-secondary mb-1">Projected Score</p>
        <span className="text-3xl font-bold text-shopify-green">{safeAfter}</span>
      </div>
    </div>
  )
}

export default function BeforeAfter({ selectedProduct }) {
  const product = selectedProduct || PRODUCTS.find(p => p.status === 'critical') || PRODUCTS[0]
  const [applied, setApplied] = useState(false)

  const projectedScore = Math.min(95, (isNaN(product.score) ? 0 : product.score) + 40)

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-shopify-text">Optimize Product</h1>
          <p className="text-sm text-shopify-secondary mt-0.5">
            AI-generated improvements for <span className="font-medium text-shopify-text">{product.name}</span>
          </p>
        </div>
        {applied && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-shopify-green bg-shopify-success-light px-3 py-1.5 rounded-card border border-shopify-green/20">
            ✓ Changes Applied
          </span>
        )}
      </div>

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
          label="Product Description"
          oldVal={product.description}
          newVal={product.optimizedDescription}
        />
        <FieldRow
          label="Return Policy"
          oldVal={product.returnPolicy}
          newVal="Free returns accepted within 30 days of delivery. Full refund processed within 3–5 business days."
        />
        <FieldRow
          label="Shipping Information"
          oldVal={product.shipping}
          newVal="Free standard delivery. Arrives in 5–7 business days. Express options available at checkout."
        />
        <FieldRow
          label="Product Tags"
          oldVal={product.tags.length ? product.tags.join(', ') : null}
          newVal={[...product.tags, 'free-returns', 'fast-shipping', 'ai-optimized'].join(', ')}
        />
      </div>

      {/* Action bar */}
      {!applied ? (
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => setApplied(true)}
            className="bg-shopify-green hover:bg-shopify-green-dark text-white text-sm font-medium px-6 py-2.5 rounded-btn transition-colors flex items-center gap-2"
          >
            ✓ Apply AI Improvements
          </button>
          <p className="text-xs text-shopify-secondary">
            Changes will sync back to your Shopify store description
          </p>
        </div>
      ) : (
        <div className="bg-shopify-success-light border border-shopify-green/20 rounded-card px-5 py-4">
          <p className="text-sm font-semibold text-shopify-green flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 12l3 3 5-5"/>
            </svg>
            Optimization complete!
          </p>
          <p className="text-xs text-shopify-secondary mt-1">
            Your product listing has been updated. AI systems will pick up the new data within 24–48 hours.
          </p>
        </div>
      )}
    </div>
  )
}
