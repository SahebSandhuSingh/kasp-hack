import { useEffect, useState } from 'react'

// ─────────────────────────────────────────────────────
// AI Rep Optimizer — Landing Page
// Purely informational, zero backend. All CTAs call onGetStarted()
// ─────────────────────────────────────────────────────

const COLORS = {
  bg: '#0A0F1E',
  card: '#111827',
  border: '#1F2937',
  green: '#00C87A',
  greenHover: '#00A866',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
}

// Smooth scroll helper
function scrollToId(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ── Icons (inline SVG) ───────────────────────────────

const Icon = {
  brain: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2a3 3 0 0 0-3 3v1a3 3 0 0 0-3 3v2a3 3 0 0 0 1 2.24V15a3 3 0 0 0 3 3 3 3 0 0 0 3 3v-1.5"/>
      <path d="M14.5 2a3 3 0 0 1 3 3v1a3 3 0 0 1 3 3v2a3 3 0 0 1-1 2.24V15a3 3 0 0 1-3 3 3 3 0 0 1-3 3v-1.5"/>
    </svg>
  ),
  gap: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="12" r="5"/>
      <circle cx="16" cy="12" r="5"/>
    </svg>
  ),
  plan: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2"/>
      <path d="M8 8h8M8 12h8M8 16h5"/>
    </svg>
  ),
  click: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11V5a3 3 0 0 1 6 0v6"/>
      <path d="M6 11h12a2 2 0 0 1 2 2v3a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6v-3a2 2 0 0 1 2-2z"/>
    </svg>
  ),
  proof: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"/>
      <path d="M7 14l4-4 4 4 5-5"/>
    </svg>
  ),
  fair: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  arrow: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7"/>
    </svg>
  ),
  logo: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" opacity="0.5"/>
    </svg>
  ),
}

// ── Components ───────────────────────────────────────

function NavBar({ onGetStarted, scrolled }) {
  return (
    <nav
      className="aro-nav"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 50,
        padding: scrolled ? '14px 32px' : '20px 32px',
        background: scrolled ? 'rgba(10, 15, 30, 0.8)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? `1px solid ${COLORS.border}` : '1px solid transparent',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.green, display: 'inline-block' }} />
            <span className="aro-pulse" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: COLORS.green }} />
          </span>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16, color: COLORS.text, letterSpacing: '-0.01em' }}>
            AI Rep Optimizer
          </span>
        </div>

        <div className="aro-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <button onClick={() => scrollToId('features')} className="aro-nav-link">Features</button>
          <button onClick={() => scrollToId('how-it-works')} className="aro-nav-link">How it Works</button>
          <button onClick={onGetStarted} className="aro-nav-link">Connect Store</button>
        </div>

        <button onClick={onGetStarted} className="aro-btn-primary aro-btn-sm">
          Connect Your Store
        </button>
      </div>
    </nav>
  )
}

function FloatingAuditCard() {
  return (
    <div
      className="aro-float"
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        padding: 24,
        width: 320,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 200, 122, 0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #1F2937, #374151)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.textSecondary} strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M8 12h8M12 8v8"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Product Audit</p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: COLORS.text, fontWeight: 500, margin: '2px 0 0' }}>Protein Bar · Berry</p>
        </div>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: 'rgba(215, 44, 13, 0.15)', color: '#F87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Critical</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
        <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 44, fontWeight: 700, color: '#F87171', lineHeight: 1 }}>34</span>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: COLORS.textSecondary }}>/100</span>
      </div>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: COLORS.textSecondary, margin: '0 0 14px' }}>AI Visibility Score</p>

      <div style={{ height: 6, background: COLORS.border, borderRadius: 999, marginBottom: 16, overflow: 'hidden' }}>
        <div className="aro-score-fill" style={{ height: '100%', width: '34%', background: '#F87171', borderRadius: 999 }} />
      </div>

      <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 14 }}>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>4 Issues Found</p>
        {[
          'Missing return policy',
          'Weak description (<60 words)',
          'No allergen info',
          'No certifications listed',
        ].map((iss, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#F87171' }} />
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: COLORS.text }}>{iss}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProblemCard({ title, description }) {
  return (
    <div className="aro-problem-card">
      <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: 19, fontWeight: 600, color: COLORS.text, margin: '0 0 12px', letterSpacing: '-0.01em' }}>
        {title}
      </h3>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: COLORS.textSecondary, lineHeight: 1.65, margin: 0 }}>
        {description}
      </p>
    </div>
  )
}

function Step({ num, title, description, isLast }) {
  return (
    <div className="aro-step">
      <div className="aro-step-number">{num}</div>
      <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 600, color: COLORS.text, margin: '20px 0 10px', letterSpacing: '-0.01em' }}>
        {title}
      </h3>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: COLORS.textSecondary, lineHeight: 1.6, margin: 0 }}>
        {description}
      </p>
      {!isLast && (
        <div className="aro-step-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7"/>
          </svg>
        </div>
      )}
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="aro-feature-card">
      <div className="aro-feature-icon" style={{ color: COLORS.green }}>{icon}</div>
      <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: 17, fontWeight: 600, color: COLORS.text, margin: '16px 0 8px', letterSpacing: '-0.01em' }}>
        {title}
      </h3>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: COLORS.textSecondary, lineHeight: 1.6, margin: 0 }}>
        {description}
      </p>
    </div>
  )
}

// ── Main Component ───────────────────────────────────

export default function LandingPage({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.text, fontFamily: 'DM Sans, sans-serif' }}>

      {/* Styles + Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap');

        * { box-sizing: border-box; }

        html { scroll-behavior: smooth; }

        @keyframes aro-pulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        .aro-pulse {
          animation: aro-pulse 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        @keyframes aro-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .aro-float {
          animation: aro-float 6s ease-in-out infinite;
        }

        @keyframes aro-score-fill {
          0% { width: 0%; }
          100% { width: 34%; }
        }
        .aro-score-fill {
          animation: aro-score-fill 1.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes aro-mesh {
          0%   { transform: translate(0%, 0%) scale(1); }
          33%  { transform: translate(6%, -4%) scale(1.08); }
          66%  { transform: translate(-5%, 5%) scale(0.95); }
          100% { transform: translate(0%, 0%) scale(1); }
        }
        .aro-mesh-1 { animation: aro-mesh 22s ease-in-out infinite; }
        .aro-mesh-2 { animation: aro-mesh 28s ease-in-out infinite reverse; }
        .aro-mesh-3 { animation: aro-mesh 18s ease-in-out infinite; }

        @keyframes aro-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .aro-fade-up { animation: aro-fade-up 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
        .aro-delay-1 { animation-delay: 0.08s; }
        .aro-delay-2 { animation-delay: 0.16s; }
        .aro-delay-3 { animation-delay: 0.24s; }

        .aro-nav-link {
          background: transparent;
          border: none;
          cursor: pointer;
          color: ${COLORS.textSecondary};
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          padding: 6px 2px;
          transition: color 0.2s;
        }
        .aro-nav-link:hover { color: ${COLORS.text}; }

        .aro-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: ${COLORS.green};
          color: #031B11;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 15px;
          border: none;
          border-radius: 10px;
          padding: 14px 24px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 0 0 0 rgba(0, 200, 122, 0.4);
        }
        .aro-btn-primary:hover {
          background: ${COLORS.greenHover};
          transform: translateY(-1px);
          box-shadow: 0 10px 32px -6px rgba(0, 200, 122, 0.5);
        }
        .aro-btn-primary.aro-btn-sm {
          padding: 10px 18px;
          font-size: 13.5px;
          border-radius: 8px;
        }

        .aro-btn-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: transparent;
          color: ${COLORS.text};
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          font-size: 15px;
          border: 1px solid ${COLORS.border};
          border-radius: 10px;
          padding: 14px 24px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .aro-btn-ghost:hover {
          border-color: ${COLORS.green};
          color: ${COLORS.green};
        }

        .aro-problem-card {
          background: ${COLORS.card};
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          padding: 28px;
          transition: all 0.3s;
        }
        .aro-problem-card:hover {
          border-color: rgba(0, 200, 122, 0.4);
          transform: translateY(-3px);
          box-shadow: 0 12px 32px -8px rgba(0, 200, 122, 0.15);
        }

        .aro-step {
          position: relative;
          text-align: center;
          padding: 0 12px;
        }
        .aro-step-number {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(0, 200, 122, 0.15), rgba(0, 200, 122, 0.05));
          border: 1px solid rgba(0, 200, 122, 0.25);
          color: ${COLORS.green};
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          font-size: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }
        .aro-step-arrow {
          position: absolute;
          right: -16px;
          top: 20px;
          display: none;
        }
        @media (min-width: 900px) {
          .aro-step-arrow { display: block; }
        }

        .aro-feature-card {
          background: ${COLORS.card};
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          padding: 24px;
          transition: all 0.3s;
        }
        .aro-feature-card:hover {
          border-color: rgba(0, 200, 122, 0.35);
          transform: translateY(-2px);
        }
        .aro-feature-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: rgba(0, 200, 122, 0.1);
          border: 1px solid rgba(0, 200, 122, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 740px) {
          .aro-nav-links { display: none !important; }
          .aro-hero-grid { grid-template-columns: 1fr !important; }
          .aro-hero-floating { display: none !important; }
          .aro-problem-grid { grid-template-columns: 1fr !important; }
          .aro-steps-grid { grid-template-columns: 1fr !important; }
          .aro-features-grid { grid-template-columns: 1fr !important; }
          .aro-hero-title { font-size: 42px !important; }
        }
      `}</style>

      {/* ─── SECTION 1 — Nav ─── */}
      <NavBar onGetStarted={onGetStarted} scrolled={scrolled} />

      {/* ─── SECTION 2 — Hero ─── */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '160px 32px 120px' }}>

        {/* Animated mesh background */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div
            className="aro-mesh-1"
            style={{
              position: 'absolute', top: '-20%', left: '-10%',
              width: 600, height: 600,
              background: 'radial-gradient(circle, rgba(0, 200, 122, 0.22), transparent 60%)',
              filter: 'blur(40px)',
            }}
          />
          <div
            className="aro-mesh-2"
            style={{
              position: 'absolute', top: '10%', right: '-15%',
              width: 550, height: 550,
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.18), transparent 60%)',
              filter: 'blur(40px)',
            }}
          />
          <div
            className="aro-mesh-3"
            style={{
              position: 'absolute', bottom: '-20%', left: '30%',
              width: 500, height: 500,
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.14), transparent 60%)',
              filter: 'blur(40px)',
            }}
          />
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="aro-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48, alignItems: 'center' }}>
            <div>
              <div className="aro-fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'rgba(0, 200, 122, 0.08)', border: '1px solid rgba(0, 200, 122, 0.2)', marginBottom: 24 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.green }} />
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: COLORS.green, fontWeight: 500, letterSpacing: '0.02em' }}>
                  Built for the AI commerce era
                </span>
              </div>

              <h1 className="aro-fade-up aro-delay-1 aro-hero-title" style={{ fontFamily: 'Sora, sans-serif', fontSize: 60, fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.025em', margin: '0 0 24px', color: COLORS.text }}>
                Your products are{' '}
                <span style={{ background: 'linear-gradient(135deg, #00C87A, #5EEAD4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>invisible to AI</span>.
                <br />Let's fix that.
              </h1>

              <p className="aro-fade-up aro-delay-2" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, color: COLORS.textSecondary, lineHeight: 1.6, margin: '0 0 36px', maxWidth: 560 }}>
                AI shopping agents decide which products to recommend. If your Shopify store has weak descriptions, missing policies, or incomplete data — they skip you entirely. AI Rep Optimizer shows you exactly why, and fixes it.
              </p>

              <div className="aro-fade-up aro-delay-3" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <button onClick={onGetStarted} className="aro-btn-primary">
                  Connect Your Store {Icon.arrow}
                </button>
                <button onClick={() => scrollToId('how-it-works')} className="aro-btn-ghost">
                  See How It Works
                </button>
              </div>
            </div>

            <div className="aro-hero-floating" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <FloatingAuditCard />
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3 — Problem ─── */}
      <section style={{ padding: '100px 32px', borderTop: `1px solid ${COLORS.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: COLORS.green, textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600, margin: '0 0 16px' }}>
              The silent problem
            </p>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 42, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', color: COLORS.text, margin: 0, maxWidth: 720, marginInline: 'auto' }}>
              The problem most merchants don't know they have
            </h2>
          </div>

          <div className="aro-problem-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            <ProblemCard
              title="AI agents are the new search"
              description="When a buyer asks an AI for recommendations, it reasons about your product data — not your SEO. A missing return policy or vague description is an instant rejection signal."
            />
            <ProblemCard
              title="No visibility, no tool"
              description="There's no Google Search Console for AI visibility. Until now, merchants had no way to see how AI agents evaluate their store. They just lose sales silently."
            />
            <ProblemCard
              title="The gap is growing"
              description="AI-driven product discovery is accelerating. Stores that optimize for AI agents now will own the next wave of commerce."
            />
          </div>
        </div>
      </section>

      {/* ─── SECTION 4 — How It Works ─── */}
      <section id="how-it-works" style={{ padding: '100px 32px', borderTop: `1px solid ${COLORS.border}`, background: 'linear-gradient(180deg, #0A0F1E, #0B1324)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: COLORS.green, textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600, margin: '0 0 16px' }}>
              How it works
            </p>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 42, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', color: COLORS.text, margin: 0, maxWidth: 720, marginInline: 'auto' }}>
              From invisible to recommended in minutes
            </h2>
          </div>

          <div className="aro-steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
            <Step num="1" title="Connect your store" description="Enter your Shopify store URL. No manual token setup required." />
            <Step num="2" title="AI scans your catalogue" description="We simulate how AI shopping agents evaluate each product against real buyer queries." />
            <Step num="3" title="See exactly what's broken" description="Ranked issues by impact. Return policy missing on 6 products. Descriptions too weak on 4." />
            <Step num="4" title="Apply fixes instantly" description="One click applies AI-generated improvements directly to your Shopify store." isLast />
          </div>
        </div>
      </section>

      {/* ─── SECTION 5 — Features ─── */}
      <section id="features" style={{ padding: '100px 32px', borderTop: `1px solid ${COLORS.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: COLORS.green, textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600, margin: '0 0 16px' }}>
              Features
            </p>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 42, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', color: COLORS.text, margin: 0, maxWidth: 720, marginInline: 'auto' }}>
              Everything you need to win AI search
            </h2>
          </div>

          <div className="aro-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            <FeatureCard icon={Icon.brain} title="AI Simulation Engine" description="Simulates actual AI agent decision-making, not keyword scanning." />
            <FeatureCard icon={Icon.gap} title="Perception Gap Analysis" description="See what you sell vs what AI recommends you for." />
            <FeatureCard icon={Icon.plan} title="Ranked Action Plan" description="Fixes prioritized by total store impact." />
            <FeatureCard icon={Icon.click} title="One-Click Optimization" description="Apply improvements directly to Shopify." />
            <FeatureCard icon={Icon.proof} title="Before & After Proof" description="Real inclusion rate delta, not promises." />
            <FeatureCard icon={Icon.fair} title="Fairness Checker" description="Only actionable issues flagged, no false alarms." />
          </div>
        </div>
      </section>

      {/* ─── SECTION 6 — Final CTA ─── */}
      <section style={{ padding: '120px 32px', borderTop: `1px solid ${COLORS.border}`, position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 800, height: 400,
            background: 'radial-gradient(ellipse, rgba(0, 200, 122, 0.12), transparent 60%)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 46, fontWeight: 700, lineHeight: 1.12, letterSpacing: '-0.025em', color: COLORS.text, margin: '0 0 20px' }}>
            See how AI agents see your store
          </h2>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, color: COLORS.textSecondary, lineHeight: 1.5, margin: '0 0 36px' }}>
            Connect your Shopify store. No credit card. Takes 30 seconds.
          </p>
          <button onClick={onGetStarted} className="aro-btn-primary" style={{ fontSize: 16, padding: '18px 32px' }}>
            Analyze My Store {Icon.arrow}
          </button>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: COLORS.textSecondary, margin: '20px 0 0' }}>
            Tokens are managed securely on the server. We never store your credentials.
          </p>
        </div>
      </section>

      {/* ─── SECTION 7 — Footer ─── */}
      <footer style={{ padding: '40px 32px', borderTop: `1px solid ${COLORS.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.green, display: 'inline-block' }} />
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 14, color: COLORS.text }}>
              AI Rep Optimizer
            </span>
          </div>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: COLORS.textSecondary, margin: 0 }}>
            Making every Shopify product AI-visible.
          </p>
        </div>
      </footer>

    </div>
  )
}
