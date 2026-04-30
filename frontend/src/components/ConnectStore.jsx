import { useState } from 'react'

const STEPS = [
  'Go to your Shopify Admin',
  'Click Settings → Apps and sales channels',
  'Click Develop apps → Create an app',
  'Under API credentials, click Install app',
  'Copy the Admin API access token',
]

export default function ConnectStore({ onConnected }) {
  const [domain, setDomain] = useState('')
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleanDomain = domain.trim()
    const cleanToken = token.trim()

    if (!cleanDomain || !cleanToken) {
      setError('Both store URL and access token are required.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/connect-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: cleanDomain, accessToken: cleanToken }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `Connection failed (HTTP ${res.status})`)
      }

      // Pass store info to parent
      onConnected({
        domain: data.store.domain,
        accessToken: cleanToken,
        productCount: data.store.product_count,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-shopify-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[480px] fade-up">

        {/* Logo & tagline */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-shopify-green flex items-center justify-center shadow-card">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <span className="text-lg font-semibold text-shopify-text tracking-tight">
              AI Rep Optimizer
            </span>
          </div>
          <p className="text-sm text-shopify-secondary">
            Optimize your products for AI-powered shopping
          </p>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-card shadow-card">
          <div className="px-6 py-5 border-b border-shopify-border">
            <h1 className="text-base font-semibold text-shopify-text">Connect your Shopify Store</h1>
            <p className="text-xs text-shopify-secondary mt-0.5">
              We'll fetch your products and analyze them for AI readiness
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

            {/* Store URL */}
            <div>
              <label htmlFor="store-domain" className="block text-sm font-medium text-shopify-text mb-1">
                Store URL
              </label>
              <input
                id="store-domain"
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="yourstore.myshopify.com"
                disabled={loading}
                className="w-full px-3 py-2 text-sm border border-[#C9CCCF] rounded-btn
                  focus:outline-none focus:ring-1 focus:ring-shopify-green focus:border-shopify-green
                  disabled:opacity-50 disabled:bg-shopify-bg"
              />
              <p className="text-xs text-shopify-secondary mt-1">
                Enter your store's <span className="font-mono text-xs">.myshopify.com</span> domain
              </p>
            </div>

            {/* Access Token */}
            <div>
              <label htmlFor="access-token" className="block text-sm font-medium text-shopify-text mb-1">
                Admin API Access Token
              </label>
              <div className="relative">
                <input
                  id="access-token"
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="shpat_xxxxxxxxxxxx"
                  disabled={loading}
                  className="w-full px-3 py-2 pr-10 text-sm border border-[#C9CCCF] rounded-btn
                    focus:outline-none focus:ring-1 focus:ring-shopify-green focus:border-shopify-green
                    disabled:opacity-50 disabled:bg-shopify-bg font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-shopify-secondary hover:text-shopify-text text-xs"
                  tabIndex={-1}
                >
                  {showToken ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-xs text-shopify-secondary mt-1">
                Found in Shopify Admin → Apps → API credentials
              </p>

              {/* Error message below token field */}
              {error && (
                <div className="mt-2 bg-shopify-critical-light border border-red-200 rounded-btn px-3 py-2">
                  <p className="text-xs text-shopify-critical font-medium">{error}</p>
                </div>
              )}
            </div>

            {/* How-to collapsible */}
            <div className="border border-shopify-border rounded-btn overflow-hidden">
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-shopify-secondary hover:bg-shopify-bg transition-colors"
              >
                <span className="font-medium">How to get your access token</span>
                <span className={`text-xs transition-transform ${showHelp ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {showHelp && (
                <div className="px-3 pb-3 border-t border-shopify-border bg-shopify-bg">
                  <ol className="space-y-2 mt-3">
                    {STEPS.map((step, i) => (
                      <li key={i} className="flex gap-2.5 text-sm text-shopify-text">
                        <span className="w-5 h-5 rounded-full bg-shopify-green text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !domain.trim() || !token.trim()}
              className="w-full bg-shopify-green hover:bg-shopify-green-dark disabled:opacity-50
                text-white text-sm font-medium py-2.5 rounded-btn transition-colors
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Connecting to store…
                </>
              ) : (
                'Connect Store'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-shopify-secondary mt-4">
          Your credentials are stored locally and never shared
        </p>
      </div>
    </div>
  )
}
