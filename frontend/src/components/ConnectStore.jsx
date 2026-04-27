import { useState } from 'react'

function CheckIcon({ pass }) {
  return pass
    ? <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓</span>
    : <span style={{ color: 'var(--red)', fontWeight: 700 }}>✗</span>
}

function CompletionBadge({ hasDescription, hasReturn, hasShipping }) {
  const score = [hasDescription, hasReturn, hasShipping].filter(Boolean).length
  if (score === 3) return <span className="badge-success">Ready</span>
  if (score === 2) return <span className="badge-warning">Partial</span>
  return <span className="badge-critical">Incomplete</span>
}

export default function ConnectStore({ storeData, setStoreData, setAuditData, setView }) {
  const [domain, setDomain] = useState(storeData?.domain || '')
  const [accessToken, setAccessToken] = useState(storeData?.accessToken || '')

  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState(null)
  const [preview, setPreview] = useState(null)   // { domain, product_count, products }

  const [auditing, setAuditing] = useState(false)
  const [auditError, setAuditError] = useState(null)

  const handleConnect = async () => {
    if (!domain.trim() || !accessToken.trim()) {
      setConnectError('Both store domain and access token are required.')
      return
    }
    setConnecting(true)
    setConnectError(null)
    setPreview(null)
    try {
      const res = await fetch('/api/connect-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim(), accessToken: accessToken.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setPreview(data.store)
      setStoreData({ domain: data.store.domain, accessToken: accessToken.trim(), productCount: data.store.product_count })
    } catch (err) {
      setConnectError(err.message)
    } finally {
      setConnecting(false)
    }
  }

  const handleRunAudit = async () => {
    setAuditing(true)
    setAuditError(null)
    try {
      const res = await fetch('/api/live-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: preview.domain, accessToken: accessToken.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setAuditData(data.audit)
      setView('dashboard')
    } catch (err) {
      setAuditError(err.message)
    } finally {
      setAuditing(false)
    }
  }

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', animation: 'fadeInUp 0.3s ease both' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Connect Your Shopify Store</h1>
        <p className="page-subtitle">Enter your store credentials to analyze your live product catalog</p>
      </div>

      {/* Success banner */}
      {preview && (
        <div style={{
          background: 'var(--green-light)',
          border: '1px solid var(--green-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          marginBottom: '20px',
          color: 'var(--green)',
          fontSize: '14px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '16px' }}>✓</span>
          Connected to <strong>{preview.domain}</strong> — {preview.product_count} products found
        </div>
      )}

      {/* Credentials card */}
      <div className="card-padded" style={{ borderTop: '3px solid var(--green)', marginBottom: '20px' }}>

        {/* Domain field */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Store Domain
          </label>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Found in your Shopify admin URL
          </p>
          <input
            className="input-field"
            type="text"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            placeholder="your-store.myshopify.com"
            disabled={connecting}
          />
        </div>

        {/* Token field */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Admin API Access Token
          </label>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Settings → Apps → Develop apps → your app → API credentials
          </p>
          <input
            className="input-field"
            type="password"
            value={accessToken}
            onChange={e => setAccessToken(e.target.value)}
            placeholder="shpat_xxxxxxxxxxxxxxxxxxxx"
            disabled={connecting}
          />
        </div>

        {/* Error */}
        {connectError && (
          <div style={{
            background: 'var(--red-light)',
            border: '1px solid var(--red-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            color: 'var(--red)',
            fontSize: '13px',
            marginBottom: '16px',
          }}>
            {connectError}
          </div>
        )}

        {/* Connect button */}
        <button
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
          onClick={handleConnect}
          disabled={connecting}
        >
          {connecting ? (
            <>
              <span style={{
                width: '14px', height: '14px',
                border: '2px solid rgba(255,255,255,0.4)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
                flexShrink: 0,
              }} />
              Fetching products…
            </>
          ) : 'Connect & Fetch Products'}
        </button>

        {connecting && (
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Connecting to Shopify Admin API…
          </p>
        )}
      </div>

      {/* Demo mode link */}
      {!preview && (
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
          Don't have credentials?{' '}
          <button
            onClick={() => setView('dashboard')}
            style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', fontSize: '13px', fontWeight: 500, padding: 0 }}
          >
            Use demo data instead →
          </button>
        </p>
      )}

      {/* Product preview table */}
      {preview && preview.products && (
        <div className="card" style={{ marginBottom: '20px', animation: 'fadeInUp 0.3s ease both', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface-2)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Product Preview — {preview.product_count} products
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th style={{ textAlign: 'center' }}>Desc</th>
                  <th style={{ textAlign: 'center' }}>Returns</th>
                  <th style={{ textAlign: 'center' }}>Shipping</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.products.slice(0, 10).map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name.length > 40 ? p.name.slice(0, 40) + '…' : p.name}
                    </td>
                    <td style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      ₹{p.price}
                    </td>
                    <td style={{ textAlign: 'center' }}><CheckIcon pass={p.has_description} /></td>
                    <td style={{ textAlign: 'center' }}><CheckIcon pass={p.has_return_policy} /></td>
                    <td style={{ textAlign: 'center' }}><CheckIcon pass={p.has_shipping} /></td>
                    <td>
                      <CompletionBadge
                        hasDescription={p.has_description}
                        hasReturn={p.has_return_policy}
                        hasShipping={p.has_shipping}
                      />
                    </td>
                  </tr>
                ))}
                {preview.products.length > 10 && (
                  <tr>
                    <td colSpan={6} style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '10px', background: 'var(--bg-surface-2)' }}>
                      + {preview.products.length - 10} more products
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Audit section */}
          <div style={{ padding: '16px', borderTop: '1px solid var(--border)', background: 'var(--bg-surface-2)' }}>
            {auditError && (
              <div style={{
                background: 'var(--red-light)', border: '1px solid var(--red-border)',
                borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                color: 'var(--red)', fontSize: '13px', marginBottom: '12px',
              }}>
                {auditError}
              </div>
            )}

            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
              onClick={handleRunAudit}
              disabled={auditing}
            >
              {auditing ? (
                <>
                  <span style={{
                    width: '14px', height: '14px',
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                    flexShrink: 0,
                  }} />
                  Running AI audit…
                </>
              ) : 'Run AI Audit →'}
            </button>

            {auditing && (
              <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Running 7 queries against your products — this takes ~2 minutes
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
