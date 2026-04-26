import { useState } from 'react'

export default function MerchantDashboard({ auditData, loading, onFixProduct }) {
  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '40px auto', padding: '24px' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading Store Health...</div>
      </div>
    )
  }

  const products = auditData?.products || []
  
  // Calculate metrics
  const avgRate = products.length
    ? (products.reduce((s, p) => s + p.inclusion_rate, 0) / products.length).toFixed(0)
    : 0
  const atRiskCount = products.filter(p => p.inclusion_rate < 50).length

  // Top Priority Product (just taking the first critical one for now)
  const topPriorityProduct = products.find(p => p.fix_priority?.includes('CRITICAL')) || products[0]

  return (
    <div className="animate-in" style={{ maxWidth: '900px', margin: '40px auto', padding: '0 24px 60px' }}>
      
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.03em' }}>
          AI Search Health Overview
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Identify and fix catalog gaps that are costing you AI-driven sales.</p>
      </div>

      {/* TOP METRICS & PRIORITY ACTION */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '40px' }}>
        
        {/* Metrics Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card-static" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Store AI Inclusion Rate</p>
            <p style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{avgRate}%</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>Only {avgRate}% of your products are recommended when relevant.</p>
          </div>

          <div className="card-static" style={{ padding: '24px', background: 'rgba(255,71,87,0.05)', border: '1px solid rgba(255,71,87,0.1)' }}>
            <p style={{ fontSize: '12px', color: 'var(--accent-red)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>At-Risk Products</p>
            <p style={{ fontSize: '36px', fontWeight: 800, color: 'var(--accent-red)', lineHeight: 1 }}>{atRiskCount}</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,71,87,0.8)', marginTop: '8px' }}>These products are invisible to AI agents.</p>
          </div>
        </div>

        {/* Priority Action Card */}
        <div className="card-static" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-red)', boxShadow: '0 0 12px var(--accent-red)' }}></div>
            <h2 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-red)', letterSpacing: '0.05em' }}>Top Priority Fix</h2>
          </div>
          
          <h3 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
            {topPriorityProduct?.name || 'Multiple Products Missing Specs'}
          </h3>
          
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15px', lineHeight: 1.5 }}>
            This product is actively being rejected due to missing trust signals and unclear specifications. Fixing this unlocks immediate visibility in high-intent AI queries.
          </p>
          
          <button 
            onClick={() => onFixProduct(topPriorityProduct?.id)}
            style={{
              background: 'var(--text-primary)', color: 'var(--bg-deep)', padding: '16px 24px',
              borderRadius: '8px', fontSize: '15px', fontWeight: 700, border: 'none', cursor: 'pointer',
              display: 'inline-block', alignSelf: 'flex-start', transition: 'transform 0.1s'
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Review & Fix Now
          </button>
        </div>

      </div>

      {/* PRODUCT LIST */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>AI Recommendation Status</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Header Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '100px 3fr 2fr', gap: '16px', padding: '0 16px 8px', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
            <div>Status</div>
            <div>Product</div>
            <div>Inclusion Rate</div>
          </div>

          {/* Product Rows */}
          {products.map((product) => {
             const isCritical = product.inclusion_rate < 40;
             const isWarning = product.inclusion_rate >= 40 && product.inclusion_rate < 80;
             const statusColor = isCritical ? 'var(--accent-red)' : isWarning ? 'var(--accent-amber)' : 'var(--accent-green)';
             const statusBg = isCritical ? 'var(--accent-red-dim)' : isWarning ? 'var(--accent-amber-dim)' : 'var(--accent-green-dim)';
             const statusText = isCritical ? 'Critical' : isWarning ? 'Needs Work' : 'Optimized';

             return (
               <div key={product.id} className="card" onClick={() => onFixProduct(product.id)} style={{ cursor: 'pointer', display: 'grid', gridTemplateColumns: '100px 3fr 2fr', gap: '16px', alignItems: 'center', padding: '16px' }}>
                 <div>
                   <span style={{ background: statusBg, color: statusColor, padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                     {statusText}
                   </span>
                 </div>
                 <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                   {product.name}
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                   <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                     <div style={{ width: `${Math.max(product.inclusion_rate, 2)}%`, height: '100%', background: statusColor, borderRadius: '3px' }} />
                   </div>
                   <span style={{ fontSize: '13px', fontWeight: 600, color: statusColor, minWidth: '40px', textAlign: 'right' }}>
                     {product.inclusion_rate}%
                   </span>
                 </div>
               </div>
             )
          })}
        </div>
      </div>

    </div>
  )
}
