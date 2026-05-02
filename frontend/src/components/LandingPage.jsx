import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const COLORS = {
  primary: '#008060',
  primaryDark: '#005C45',
  primaryLight: '#E6F4F0',
  bg: '#F8F9FA',
  surface: '#FFFFFF',
  textPrimary: '#0D1117',
  textSecondary: '#4B5563',
  border: '#E5E7EB',
  critical: '#DC2626',
  warning: '#D97706',
  success: '#008060',
};

// --- Hooks & Helpers ---
function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true);
        observer.disconnect();
      }
    }, { threshold: 0.1, ...options });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isIntersecting];
}

function CountUp({ end, duration = 2000, prefix = '', suffix = '' }) {
  const [count, setCount] = useState(0);
  const [ref, isIntersecting] = useIntersectionObserver();

  useEffect(() => {
    if (!isIntersecting) return;
    let start = 0;
    const endVal = parseFloat(end);
    if (isNaN(endVal)) { setCount(end); return; }
    
    const startTime = performance.now();
    const step = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(progress * endVal);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isIntersecting, end, duration]);

  const displayCount = end.toString().includes('.') ? count.toFixed(1) : Math.round(count);
  return <span ref={ref}>{prefix}{end === '< 10' ? '< 10' : displayCount}{suffix}</span>;
}

// --- Icons ---
const Icons = {
  sparkle: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor"/>
    </svg>
  ),
  plug: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  chart: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  lightning: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  hamburger: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  )
};

// --- Components ---
function NavBar({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md border-b border-gray-200 py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          {Icons.sparkle}
          <span className="font-bold text-xl tracking-tight text-textPrimary" style={{ fontFamily: '"Dancing Script", cursive', fontSize: '28px', color: COLORS.textPrimary }}>Visibly</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-textSecondary">
          <a href="#features" className="hover:text-textPrimary transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-textPrimary transition-colors">How it Works</a>
          <a href="#pricing" className="hover:text-textPrimary transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-textPrimary transition-colors">FAQ</a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link to="/connect" className="text-sm font-medium text-textSecondary hover:text-textPrimary transition-colors">Sign in</Link>
          <Link to="/connect" className="btn-primary text-sm px-5 py-2">Start Free Trial</Link>
        </div>

        <button className="md:hidden text-textPrimary" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {Icons.hamburger}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-border p-4 flex flex-col gap-4 shadow-lg">
          <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-textSecondary font-medium">Features</a>
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-textSecondary font-medium">How it Works</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-textSecondary font-medium">Pricing</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-textSecondary font-medium">FAQ</a>
          <div className="border-t border-border pt-4 flex flex-col gap-3">
            <Link to="/connect" className="text-textSecondary font-medium text-left">Sign in</Link>
            <Link to="/connect" className="btn-primary w-full py-2">Start Free Trial</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border py-4">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-left focus:outline-none">
        <span className="font-semibold text-textPrimary">{q}</span>
        <span className="text-textSecondary transform transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="6 8 10 12 14 8"/>
          </svg>
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-40 mt-3' : 'max-h-0'}`}>
        <p className="text-textSecondary text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

// --- Main Page ---
export default function LandingPage({ onGetStarted }) {
  return (
    <div className="bg-bg min-h-screen font-sans text-textPrimary overflow-x-hidden selection:bg-primaryLight selection:text-primaryDark">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Dancing+Script:wght@600;700&display=swap');
        
        body { font-family: 'Inter', sans-serif; }
        
        .btn-primary {
          background-color: ${COLORS.primary};
          color: white;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .btn-primary:hover {
          background-color: ${COLORS.primaryDark};
          transform: scale(1.02);
          box-shadow: 0 4px 14px rgba(0, 128, 96, 0.25);
        }
        .btn-outline {
          background-color: transparent;
          color: ${COLORS.textPrimary};
          border: 1px solid ${COLORS.border};
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .btn-outline:hover {
          border-color: ${COLORS.textSecondary};
          transform: scale(1.02);
        }
        
        @keyframes float {
          0% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-8px) rotate(-2deg); }
          100% { transform: translateY(0px) rotate(-2deg); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        
        .fade-up-scroll {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        .fade-up-scroll.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .hero-bg {
          background: radial-gradient(circle at 50% 0%, rgba(0, 128, 96, 0.08) 0%, transparent 60%);
        }
      `}</style>

      <NavBar onGetStarted={onGetStarted} />

      {/* 2. HERO */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 hero-bg overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          
          {/* Left: Copy */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primaryLight text-primary text-xs font-semibold tracking-wide mb-6">
              Built for the AI commerce era <span className="text-primary text-lg leading-none">✦</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 text-textPrimary">
              Your products are<br />
              <span className="text-primary">invisible to AI.</span><br />
              Let's fix that.
            </h1>
            
            <p className="text-lg text-textSecondary mb-8 max-w-lg leading-relaxed">
              AI shopping agents decide which products to recommend.
              If your Shopify store has weak descriptions, missing policies, 
              or incomplete data — they skip you entirely. Visibly shows you exactly why, and fixes it in one click.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link to="/connect" className="btn-primary px-8 py-4 text-base shadow-sm">
                Connect Your Store →
              </Link>
              <a href="#how-it-works" className="btn-outline px-8 py-4 text-base bg-white">
                See How It Works
              </a>
            </div>
            
            <div className="flex items-center gap-4 text-sm font-medium text-textSecondary">
              <span className="flex items-center gap-1.5"><span className="text-primary font-bold">✓</span> Free 14-day trial</span>
              <span className="flex items-center gap-1.5"><span className="text-primary font-bold">✓</span> No credit card</span>
              <span className="flex items-center gap-1.5"><span className="text-primary font-bold">✓</span> 2 min setup</span>
            </div>
          </div>

          {/* Right: Floating Cards */}
          <div className="relative flex justify-center md:justify-end perspective-1000">
            {/* Subtle radial glow behind */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primaryLight rounded-full blur-3xl opacity-50 -z-20"></div>
            
            {/* Background stack card */}
            <div className="absolute top-4 right-[-10px] w-full max-w-[400px] h-full bg-white rounded-2xl border border-border shadow-sm transform rotate-3 opacity-60 -z-10"></div>
            
            {/* Main Floating Card */}
            <div className="animate-float w-full max-w-[400px] bg-white rounded-2xl border border-border shadow-xl p-6 relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-gray-900 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-textSecondary uppercase tracking-wider">Product Audit</div>
                    <div className="text-sm font-semibold text-textPrimary">Protein Bar · Berry</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-critical uppercase tracking-wider">Critical</span>
              </div>
              
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold text-critical tracking-tighter">34</span>
                  <span className="text-sm font-semibold text-textSecondary">/100</span>
                </div>
                <div className="text-xs font-medium text-textSecondary mb-2">AI Visibility Score</div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-critical w-[34%] rounded-full"></div>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-5">
                <div className="text-xs font-bold text-critical mb-0.5">AI Citation Probability: 12%</div>
                <div className="text-[11px] text-red-700">Almost never cited by AI</div>
              </div>
              
              <div className="space-y-2.5 mb-6">
                {['Missing return policy', 'Weak description (<60 words)', 'No allergen info', 'No certifications listed'].map((issue, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-critical"></div>
                    <span className="text-sm text-textPrimary font-medium">{issue}</span>
                  </div>
                ))}
              </div>
              
              <button className="w-full py-2.5 rounded-lg border border-border text-sm font-semibold text-primary hover:bg-primaryLight transition-colors">
                Fix all issues →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. LOGO BAR */}
      <section className="py-10 border-y border-border bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <p className="text-sm font-semibold text-textSecondary uppercase tracking-widest mb-6 text-center">
            Trusted by Shopify merchants in 12+ categories
          </p>
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 opacity-70">
            {['Health Food', 'Apparel', 'Electronics', 'Beauty', 'Sports', 'Home & Living', 'Food & Beverage', 'Baby & Kids'].map(cat => (
              <span key={cat} className="px-4 py-1.5 rounded-full border border-gray-300 bg-gray-50 text-xs font-semibold text-gray-500 whitespace-nowrap">
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 4. THE PROBLEM */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold text-textSecondary uppercase tracking-widest mb-3">The Silent Problem</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-textPrimary max-w-2xl mx-auto leading-tight">
            AI agents are becoming the new search engine. Most merchants don't know they're invisible.
          </h3>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            { num: '67', suffix: '%', text: 'of AI shopping queries return zero results from most stores' },
            { num: '4.2', suffix: 'x', text: 'more revenue earned by stores with AI visibility scores above 70' },
            { num: '< 10', suffix: '%', text: 'of Shopify stores are optimized for AI-powered recommendations' }
          ].map((stat, i) => {
            const [ref, isVisible] = useIntersectionObserver();
            return (
              <div key={i} ref={ref} className={`bg-white border border-border rounded-xl p-8 shadow-sm transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="text-5xl font-extrabold text-primary tracking-tighter mb-4">
                  <CountUp end={stat.num} suffix={stat.suffix} />
                </div>
                <p className="text-textSecondary text-sm leading-relaxed font-medium">{stat.text}</p>
              </div>
            );
          })}
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 text-xs font-semibold text-textSecondary">
          <div className="px-4 py-2 border border-border bg-white rounded shadow-sm">Shopper asks AI</div>
          <span className="hidden md:block text-border">→</span>
          <div className="px-4 py-2 border border-border bg-white rounded shadow-sm">AI checks product data</div>
          <span className="hidden md:block text-border">→</span>
          <div className="px-4 py-2 border border-border bg-red-50 text-critical rounded shadow-sm">Missing info?</div>
          <span className="hidden md:block text-border">→</span>
          <div className="px-4 py-2 border border-border bg-white rounded shadow-sm">Your product skipped</div>
          <span className="hidden md:block text-border">→</span>
          <div className="px-4 py-2 border border-border bg-gray-100 text-textPrimary rounded shadow-sm">Sale lost</div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-6 bg-white border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-textPrimary mb-3">How Visibly Works</h2>
            <p className="text-textSecondary text-lg">From invisible to recommended in minutes</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-10 left-1/6 right-1/6 h-[2px] bg-gray-100 border-t-2 border-dashed border-gray-200 -z-10"></div>
            
            {[
              { icon: Icons.plug, title: 'Connect Your Store', text: 'Paste your Shopify store URL and API credentials. Visibly fetches all your products instantly.' },
              { icon: Icons.chart, title: 'AI Scores Every Product', text: "Each product gets a category-specific AI Visibility Score and Citation Probability. You see exactly what's missing and why." },
              { icon: Icons.lightning, title: 'Fix in One Click', text: 'AI generates optimized descriptions, tags, and policies. One click applies changes directly to your Shopify store.' }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center relative bg-white">
                <div className="w-20 h-20 bg-primaryLight text-primary rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-sm">
                  {step.icon}
                </div>
                <div className="text-xs font-bold text-primary mb-2 uppercase tracking-widest">Step {i + 1}</div>
                <h4 className="text-xl font-bold text-textPrimary mb-3">{step.title}</h4>
                <p className="text-textSecondary text-sm leading-relaxed max-w-xs">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FEATURES */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto space-y-32">
        
        {/* Feature 1 */}
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1">
            <div className="text-xs font-bold text-primary mb-3 uppercase tracking-widest">Category-Aware Scoring</div>
            <h3 className="text-3xl font-bold text-textPrimary mb-4">Not generic feedback.<br/>Hyper-specific.</h3>
            <p className="text-textSecondary leading-relaxed text-lg">
              A protein bar is scored on ingredients, macros, allergens, and certifications. A snowboard is scored on flex rating, terrain type, and skill level. Visibly knows the difference.
            </p>
          </div>
          <div className="order-1 md:order-2 bg-white border border-border shadow-lg rounded-xl p-6">
            <div className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-4 border-b border-border pb-2">Category: Health Food</div>
            <div className="space-y-3 mb-4 text-sm font-medium">
              <div className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="text-success font-bold">✓</span> Ingredients List</span><span className="text-textSecondary">20/20</span></div>
              <div className="flex justify-between items-center text-critical"><span className="flex items-center gap-2"><span>✗</span> Nutritional Macros</span><span>0/15</span></div>
              <div className="flex justify-between items-center text-critical"><span className="flex items-center gap-2"><span>✗</span> Certifications</span><span>0/15</span></div>
              <div className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="text-success font-bold">✓</span> Allergen Info</span><span className="text-textSecondary">15/15</span></div>
              <div className="flex justify-between items-center text-warning"><span className="flex items-center gap-2"><span>✗</span> Serving Info</span><span>0/10</span></div>
            </div>
            <div className="border-t border-border pt-4 flex justify-between items-center font-bold text-textPrimary">
              <span>Total Score</span>
              <span className="text-xl">35/100</span>
            </div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="bg-white border border-border shadow-lg rounded-xl p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-textSecondary uppercase tracking-widest">Before</div>
                <div className="text-sm font-medium text-textPrimary">Score: <span className="font-bold">22</span></div>
                <div className="text-sm font-medium text-textPrimary">Citation: <span className="font-bold text-critical">8%</span></div>
                <div className="text-xs text-textSecondary italic">"Almost never cited"</div>
              </div>
              <div className="text-primary opacity-50 transform rotate-90 md:rotate-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-textSecondary uppercase tracking-widest">After Fix</div>
                <div className="text-sm font-medium text-textPrimary">Score: <span className="font-bold">78</span></div>
                <div className="text-sm font-medium text-textPrimary">Citation: <span className="font-bold text-success">71%</span></div>
                <div className="text-xs text-textSecondary italic">"Likely to be cited"</div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primaryLight text-primary rounded-full text-xs font-bold">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                +49 points · +63% citation probability
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-primary mb-3 uppercase tracking-widest">AI Citation Probability</div>
            <h3 className="text-3xl font-bold text-textPrimary mb-4">A score that means something.</h3>
            <p className="text-textSecondary leading-relaxed text-lg">
              Stop guessing. See the exact probability your products appear when customers ask AI assistants to recommend something. Before and after every fix.
            </p>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1">
            <div className="text-xs font-bold text-primary mb-3 uppercase tracking-widest">One-Click Apply</div>
            <h3 className="text-3xl font-bold text-textPrimary mb-4">No copy-pasting. Changes go live instantly.</h3>
            <p className="text-textSecondary leading-relaxed text-lg">
              Visibly writes AI-generated improvements directly back to your Shopify store via the API. Review the changes, click Apply, done. Undo anytime from your optimization history.
            </p>
          </div>
          <div className="order-1 md:order-2 bg-white border border-border shadow-lg rounded-xl p-6">
            <div className="font-semibold text-textPrimary mb-4">Apply changes to <span className="italic">Protein Bar</span>?</div>
            <div className="space-y-2 mb-6 text-sm font-medium text-textSecondary">
              <div className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> Description updated</div>
              <div className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> Tags added (6)</div>
              <div className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> Return policy added</div>
              <div className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> Certifications added</div>
            </div>
            <button className="w-full btn-primary py-3 mb-3">Confirm & Apply</button>
            <div className="text-center text-xs text-textSecondary">Changes go live on your Shopify store immediately</div>
          </div>
        </div>

      </section>

      {/* 7. ANALYTICS PREVIEW */}
      <section className="bg-primaryLight py-24 px-6 border-y border-[#cce5df]">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-textPrimary mb-3">Track your AI visibility over time</h2>
          <p className="text-textSecondary text-lg max-w-2xl mx-auto">See which products are gaining or losing AI citation probability week over week.</p>
        </div>
        
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-[#cce5df] p-6 md:p-10">
          <div className="relative h-64 w-full">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-[10px] font-medium text-gray-400">
              <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
            </div>
            
            {/* Chart Area */}
            <div className="absolute left-10 right-0 top-2 bottom-8 border-l border-b border-gray-200">
              {/* Grid lines */}
              {[25, 50, 75, 100].map((y, i) => (
                <div key={i} className="absolute left-0 right-0 border-t border-gray-100" style={{ bottom: `${y}%` }}></div>
              ))}
              
              {/* Target Line */}
              <div className="absolute left-0 right-0 border-t-2 border-dashed border-gray-300" style={{ bottom: '70%' }}>
                <span className="absolute -top-5 right-0 text-[10px] font-bold text-gray-400 uppercase">Target 70</span>
              </div>
              
              {/* Green Line (Manual SVG implementation) */}
              <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <polyline 
                  points="0,66 20,62 40,55 60,42 80,38 100,33" 
                  fill="none" stroke={COLORS.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
              
              {/* Dots */}
              <div className="absolute w-3 h-3 bg-white border-2 border-primary rounded-full shadow-sm" style={{ left: '40%', bottom: '45%', transform: 'translate(-50%, 50%)' }} title="Optimized"></div>
              <div className="absolute w-3 h-3 bg-white border-2 border-primary rounded-full shadow-sm" style={{ left: '60%', bottom: '58%', transform: 'translate(-50%, 50%)' }} title="Optimized"></div>
              <div className="absolute w-3 h-3 bg-white border-2 border-primary rounded-full shadow-sm" style={{ left: '100%', bottom: '67%', transform: 'translate(-50%, 50%)' }} title="Optimized"></div>
            </div>
            
            {/* X-axis labels */}
            <div className="absolute left-10 right-0 bottom-0 h-6 flex justify-between text-[10px] font-medium text-gray-400 pt-2 px-2">
              <span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span><span>Week 5</span><span>Week 6</span>
            </div>
          </div>
          
          <div className="mt-8 flex flex-col md:flex-row justify-center gap-4">
            <div className="px-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-xs font-semibold text-textPrimary flex items-center justify-center gap-2">
              <span className="text-primary">↑</span> +33 pts in 6 weeks
            </div>
            <div className="px-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-xs font-semibold text-textPrimary flex items-center justify-center">
              12 products optimized
            </div>
            <div className="px-4 py-2 rounded-full border border-border bg-white shadow-sm text-xs font-bold text-textPrimary flex items-center justify-center">
              Est. ₹2.4L revenue recovered
            </div>
          </div>
        </div>
      </section>

      {/* 8. PRICING */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-textPrimary mb-3">Simple pricing</h2>
          <p className="text-textSecondary text-lg">Start free. Scale as you grow.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Starter */}
          <div className="bg-white border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold text-textPrimary mb-1">Starter</h3>
            <div className="text-3xl font-extrabold text-textPrimary mb-2">Free</div>
            <p className="text-sm font-medium text-textSecondary mb-6">Up to 25 products</p>
            <Link to="/connect" className="w-full btn-outline py-2.5 mb-8">Start Free</Link>
            <div className="space-y-3 text-sm text-textPrimary font-medium">
              <div className="flex items-center gap-2"><span className="text-success font-bold">✓</span> AI Visibility Score</div>
              <div className="flex items-center gap-2"><span className="text-success font-bold">✓</span> Category-specific rubrics</div>
              <div className="flex items-center gap-2"><span className="text-success font-bold">✓</span> Issue detection</div>
              <div className="flex items-center gap-2"><span className="text-success font-bold">✓</span> 5 AI optimizations/month</div>
              <div className="flex items-center gap-2 text-gray-400"><span>✗</span> One-click apply</div>
              <div className="flex items-center gap-2 text-gray-400"><span>✗</span> Analytics & trends</div>
            </div>
          </div>
          
          {/* Growth */}
          <div className="bg-white border-2 border-primary rounded-2xl p-8 shadow-md relative hover:shadow-xl transition-shadow transform md:-translate-y-4">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Most Popular</div>
            <h3 className="text-xl font-bold text-textPrimary mb-1">Growth</h3>
            <div className="text-3xl font-extrabold text-textPrimary mb-2">₹2,999<span className="text-base font-medium text-textSecondary">/mo</span></div>
            <p className="text-sm font-medium text-textSecondary mb-6">Up to 200 products</p>
            <Link to="/connect" className="w-full btn-primary py-2.5 mb-8">Start Free Trial</Link>
            <div className="space-y-3 text-sm text-textPrimary font-medium">
              <div className="flex items-center gap-2"><span className="text-success font-bold">✓</span> Everything in Starter</div>
              <div className="flex items-center gap-2"><span className="text-success font-bold">✓</span> One-click apply to Shopify</div>
              <div className="flex items-center gap-2"><span className="text-success font-bold">✓</span> Analytics & score trends</div>
              <div className="flex items-center gap-2"><span className="text-success font-bold">✓</span> Unlimited optimizations</div>
              <div className="flex items-center gap-2"><span className="text-success font-bold">✓</span> Sales correlation report</div>
              <div className="flex items-center gap-2 text-gray-400"><span>✗</span> Competitor benchmarking</div>
            </div>
          </div>
          
          {/* Scale */}
          <div className="bg-white border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold text-textPrimary mb-1">Scale</h3>
            <div className="text-3xl font-extrabold text-textPrimary mb-2">₹7,999<span className="text-base font-medium text-textSecondary">/mo</span></div>
            <p className="text-sm font-medium text-textSecondary mb-6">Unlimited products</p>
            <Link to="/connect" className="w-full btn-outline py-2.5 mb-8">Contact Sales</Link>
            <div className="space-y-3 text-sm text-textPrimary font-medium">
              <div className="flex items-center gap-2"><span className="text-success font-bold">✓</span> Everything in Growth</div>
              <div className="flex items-center gap-2"><span className="text-success font-bold">✓</span> Competitor benchmarking</div>
              <div className="flex items-center gap-2"><span className="text-success font-bold">✓</span> Priority support</div>
              <div className="flex items-center gap-2"><span className="text-success font-bold">✓</span> Custom category rubrics</div>
              <div className="flex items-center gap-2"><span className="text-success font-bold">✓</span> API access</div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section id="faq" className="py-24 px-6 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-textPrimary">Frequently asked questions</h2>
        </div>
        <div className="border-t border-border">
          {[
            { q: "Do I need technical knowledge to use Visibly?", a: "No. You just need your Shopify store URL and API credentials. Setup takes under 2 minutes." },
            { q: "Will this actually change my Shopify store?", a: "Only when you click \"Apply\". You review every AI suggestion before anything goes live. You can undo any change instantly from your history." },
            { q: "How is this different from just asking ChatGPT?", a: "ChatGPT doesn't have access to your store. Visibly pulls your real product data, scores it against category-specific rubrics, applies fixes via the Shopify API, and tracks your improvement over time." },
            { q: "What's AI Citation Probability?", a: "It's a metric showing how likely your product is to be recommended when a shopper asks an AI agent (like ChatGPT or Perplexity) for a product recommendation." },
            { q: "Which Shopify plans are supported?", a: "All Shopify plans — Basic, Shopify, Advanced, and Plus." },
            { q: "Is my store data secure?", a: "Your credentials are stored only in your browser session and never saved to our servers permanently. All Shopify API calls happen server-side over HTTPS." }
          ].map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* 10. CTA BANNER */}
      <section className="py-24 px-6 text-center" style={{ backgroundColor: COLORS.primaryDark }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Stop losing sales to invisible listings.</h2>
          <p className="text-xl text-primaryLight opacity-90 mb-10 max-w-2xl mx-auto">
            Join merchants who are already winning AI-powered shopping recommendations.
          </p>
          <Link to="/connect" className="bg-white text-primaryDark font-bold text-lg px-8 py-4 rounded-lg hover:bg-gray-50 transform hover:scale-105 transition-all shadow-lg inline-flex items-center justify-center mb-6">
            Connect Your Store — It's Free →
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-white opacity-80">
            <span>✓ 14-day free trial</span>
            <span>✓ No credit card</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="py-12 px-6 border-t border-border bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2 text-primary">
              {Icons.sparkle}
              <span className="font-bold text-lg" style={{ fontFamily: '"Dancing Script", cursive', fontSize: '24px', color: COLORS.textPrimary }}>Visibly</span>
            </div>
            <span className="text-xs font-medium text-textSecondary">AI visibility for Shopify merchants</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-textSecondary">
            <a href="#features" className="hover:text-textPrimary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-textPrimary transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-textPrimary transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-textPrimary transition-colors">FAQ</a>
            <a href="#" className="hover:text-textPrimary transition-colors">Privacy</a>
            <a href="#" className="hover:text-textPrimary transition-colors">Terms</a>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-1">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-textPrimary">
              Built for Shopify merchants <span className="w-4 h-4 bg-green-500 rounded-sm inline-block ml-1 opacity-80"></span>
            </div>
            <div className="text-xs text-textSecondary">© 2026 Visibly. All rights reserved.</div>
          </div>
        </div>
      </footer>

    </div>
  );
}
