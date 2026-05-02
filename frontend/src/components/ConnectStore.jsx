import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CONNECT_STEPS = [
  'Verifying credentials...',
  'Checking API permissions...',
  'Fetching your products...',
  'Running initial AI score...',
]

const HELP_STEPS = [
  { title: 'Go to your Shopify Admin', text: 'Settings → Apps and sales channels' },
  { title: 'Click "Develop apps"', text: 'Then "Create an app" (or select existing)' },
  { title: 'Click "Configure Admin API scopes"', text: 'Enable read_products, write_products, and read_orders, then click "Save"' },
  { title: 'Click "Install app" → "Install"', text: 'This activates the app for your store' },
  { title: 'Under "API credentials" tab', text: 'Copy "Client ID" and "API secret key" from the API credentials tab' },
]

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}

export default function ConnectStore({ onConnected, message }) {
  const navigate = useNavigate()
  const [domain, setDomain] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [focusedClientId, setFocusedClientId] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [progressStep, setProgressStep] = useState(0)
  const [fieldErrors, setFieldErrors] = useState({})
  const [apiError, setApiError] = useState(message || null)
  const [shake, setShake] = useState(false)

  const cleanDomain = (value) => value.replace(/^https?:\/\//, '').replace(/\/+$/, '').trim()

  const validate = () => {
    const errors = {}
    if (!cleanDomain(domain)) errors.store_domain = 'Store URL is required.'
    if (!clientId.trim()) errors.client_id = 'Client ID is required.'
    if (!clientSecret.trim()) errors.client_secret = 'Client Secret is required.'
    return errors
  }

  const animateProgress = async () => {
    for (let i = 0; i < CONNECT_STEPS.length; i++) {
      setProgressStep(i)
      await new Promise(r => setTimeout(r, 800))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validate()

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setShake(true)
      setTimeout(() => setShake(false), 450)
      return
    }

    setLoading(true)
    setApiError(null)
    setFieldErrors({})
    setProgressStep(0)

    try {
      const progress = animateProgress()
      const res = await fetch('/api/auth/connect', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_domain: cleanDomain(domain),
          client_id: clientId.trim(),
          client_secret: clientSecret.trim(),
        }),
      })
      const data = await res.json()
      await progress

      if (!res.ok) {
        if (res.status === 400 && data.errors) {
          setFieldErrors(data.errors)
          setShake(true)
          setTimeout(() => setShake(false), 450)
          setLoading(false)
          return
        }
        if (res.status === 401) throw new Error(data.error || 'Invalid credentials. Double-check your Client ID and Secret.')
        if (res.status === 403 && data.error === 'missing_scopes') {
          setShowHelp(true)
          throw new Error(`Connected, but missing permissions. Please enable ${data.missing.join(', ')} in your app settings.`)
        }
        throw new Error(data.error || data.message || 'Unable to connect to Shopify.')
      }

      setSuccess(true)
      setTimeout(() => {
        onConnected({
          domain: data.shop.domain,
          name: data.shop.name,
          planName: data.shop.plan_name,
          scopeStatus: data.scope_status,
          hasWriteAccess: data.scope_status?.has_write_products === true,
          warning: data.warning,
        })
        navigate('/app/overview')
      }, 1000)
    } catch (err) {
      setApiError(err.message || 'Network error. Please try again.')
      setLoading(false)
    }
  }

  const disabled = loading || !domain.trim() || !clientId.trim() || !clientSecret.trim()

  return (
    <div className="min-h-screen bg-shopify-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[520px] fade-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <img src="/logo.png" alt="Visibly Logo" className="w-9 h-9 rounded-lg shadow-card object-cover" />
            <span className="text-shopify-text tracking-tight" style={{ fontFamily: '"Dancing Script", cursive', fontSize: '26px', fontWeight: 700 }}>Visibly</span>
          </div>
          <p className="text-sm text-shopify-secondary">Optimize your products for AI-powered shopping</p>
        </div>

        <div className={`bg-white rounded-card shadow-card ${shake ? 'animate-[shake_0.4s]' : ''}`}>
          <div className="px-6 py-5 border-b border-shopify-border">
            <h1 className="text-base font-semibold text-shopify-text">Connect your Shopify Store</h1>
            <p className="text-xs text-shopify-secondary mt-0.5">We'll fetch your products and analyze them for AI visibility</p>
          </div>

          {success ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto mb-3" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#008060" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/>
              </svg>
              <p className="text-sm font-semibold text-shopify-green">Store connected successfully</p>
            </div>
          ) : loading ? (
            <div className="px-6 py-6 space-y-4">
              {CONNECT_STEPS.map((step, i) => {
                const done = i < progressStep
                const active = i === progressStep
                return (
                  <div key={step} className="flex items-center gap-3">
                    {done ? <span className="text-shopify-green font-bold">✓</span> : active ? <Spinner /> : <span className="w-4 h-4 rounded-full border border-shopify-border" />}
                    <span className={`text-sm ${done ? 'text-shopify-green font-medium' : active ? 'text-shopify-text font-medium' : 'text-shopify-secondary'}`}>{step}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              {apiError && (
                <div className="bg-shopify-critical-light border border-red-200 rounded-btn px-3 py-2">
                  <p className="text-xs text-shopify-critical font-medium">❌ {apiError}</p>
                  <button type="button" onClick={() => setApiError(null)} className="text-xs text-shopify-critical underline mt-1">Try again</button>
                </div>
              )}

              <div>
                <label htmlFor="store-domain" className="block text-sm font-medium text-shopify-text mb-1">Store URL</label>
                <input id="store-domain" type="text" value={domain} onChange={e => setDomain(cleanDomain(e.target.value))} placeholder="yourstore.myshopify.com" className="w-full px-3 py-2 text-sm border border-[#C9CCCF] rounded-btn focus:outline-none focus:ring-1 focus:ring-shopify-green focus:border-shopify-green" />
                <p className="text-xs text-shopify-secondary mt-1">Enter your store's <span className="font-mono text-xs">.myshopify.com</span> domain</p>
                {fieldErrors.store_domain && <p className="text-xs text-shopify-critical mt-1">{fieldErrors.store_domain}</p>}
              </div>

              <div>
                <label htmlFor="client-id" className="block text-sm font-medium text-shopify-text mb-1">Client ID</label>
                <input id="client-id" type="text" value={clientId} onFocus={() => setFocusedClientId(true)} onBlur={() => setFocusedClientId(false)} onChange={e => setClientId(e.target.value)} placeholder="Enter your Shopify app Client ID" className="w-full px-3 py-2 text-sm border border-[#C9CCCF] rounded-btn focus:outline-none focus:ring-1 focus:ring-shopify-green focus:border-shopify-green" />
                {focusedClientId && <p className="text-xs text-shopify-secondary mt-1">Found in Shopify Admin → Settings → Apps → Develop apps → [Your App] → API credentials</p>}
                {fieldErrors.client_id && <p className="text-xs text-shopify-critical mt-1">{fieldErrors.client_id}</p>}
              </div>

              <div>
                <label htmlFor="client-secret" className="block text-sm font-medium text-shopify-text mb-1">Client Secret</label>
                <div className="relative">
                  <input id="client-secret" type={showSecret ? 'text' : 'password'} value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="shpss_xxxxxxxxxxxxxxxx" className="w-full px-3 py-2 pr-10 text-sm border border-[#C9CCCF] rounded-btn focus:outline-none focus:ring-1 focus:ring-shopify-green focus:border-shopify-green" />
                  <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-shopify-secondary text-xs">{showSecret ? 'Hide' : 'Show'}</button>
                </div>
                <p className="text-xs text-shopify-secondary mt-1">This is your app's API secret key</p>
                {fieldErrors.client_secret && <p className="text-xs text-shopify-critical mt-1">{fieldErrors.client_secret}</p>}
              </div>

              <div className="border border-shopify-border rounded-btn overflow-hidden">
                <button type="button" onClick={() => setShowHelp(!showHelp)} className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-shopify-secondary hover:bg-shopify-bg transition-colors">
                  <span className="font-medium">How to get your credentials</span>
                  <svg className={`transition-transform ${showHelp ? 'rotate-180' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4.5L6 7.5L9 4.5"/></svg>
                </button>
                {showHelp && (
                  <div className="px-3 pb-3 border-t border-shopify-border bg-shopify-bg">
                    <ol className="space-y-3 mt-3">
                      {HELP_STEPS.map((step, i) => (
                        <li key={i} className="flex gap-2.5 text-sm text-shopify-text">
                          <span className="w-5 h-5 rounded-full bg-shopify-green text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                          <div>
                            <p className="font-medium">{step.title}</p>
                            <p className="text-xs text-shopify-secondary mt-0.5">{step.text}</p>
                            {i === 2 && (
                              <div className="text-xs text-shopify-green mt-1 space-y-0.5">
                                <p>✓ read_products (required)</p>
                                <p>✓ write_products (to apply optimizations)</p>
                                <p>✓ read_orders (for sales analytics)</p>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              <button type="submit" disabled={disabled} className="w-full bg-shopify-green hover:bg-shopify-green-dark disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-btn transition-colors flex items-center justify-center gap-2">
                Connect Store
              </button>

              <p className="text-xs text-shopify-secondary flex items-center justify-center gap-1">
                <span>🔒</span>
                Your credentials are stored only in your browser session and never saved to disk
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
