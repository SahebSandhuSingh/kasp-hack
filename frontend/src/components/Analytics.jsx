import { useState, useEffect } from 'react';
import { LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { CATEGORY_LABELS, CATEGORY_COLORS, ALL_CATEGORIES } from '../categoryConstants';

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
const fetchJson = async (url) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

// ─────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────
export default function Analytics({ storeData, setView }) {
  const [tab, setTab] = useState('traffic'); // 'traffic' | 'trends' | 'correlation'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Data states
  const [trafficReport, setTrafficReport] = useState([]);
  const [storeHistory, setStoreHistory] = useState([]);
  
  // Trend specific
  const [trendView, setTrendView] = useState('store'); // 'store' | 'product'
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productHistory, setProductHistory] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Load data
  const loadData = async () => {
    if (!storeData?.domain) return;
    setLoading(true);
    setError(null);
    try {
      const [traffic, history] = await Promise.all([
        fetchJson('/api/products/traffic-report'),
        fetchJson('/api/snapshots/history')
      ]);
      setTrafficReport(traffic);
      setStoreHistory(history);
      if (traffic.length > 0) setSelectedProduct(traffic[0].product_id);
    } catch (err) {
      setError('Failed to load analytics data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [storeData?.domain]);

  // Load product history when selected
  useEffect(() => {
    if (trendView === 'product' && selectedProduct && storeData?.domain) {
      fetchJson(`/api/snapshots/history?product_id=${selectedProduct}`)
        .then(setProductHistory)
        .catch(e => console.error(e));
    }
  }, [trendView, selectedProduct, storeData?.domain]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!res.ok) throw new Error('Refresh failed');
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  // ─────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────
  if (!storeData) {
    return (
      <div className="bg-white rounded-card shadow-card py-16 flex flex-col items-center justify-center text-center max-w-2xl mx-auto mt-10 fade-up">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#008060" strokeWidth="1.5" className="mb-4">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
        <h2 className="text-lg font-semibold text-shopify-text mb-1">No data yet</h2>
        <p className="text-sm text-shopify-secondary mb-6 max-w-sm">Connect your store to start tracking AI traffic, score trends, and revenue correlations.</p>
        <button onClick={() => setView('dashboard')} className="bg-shopify-green text-white px-5 py-2.5 rounded-btn text-sm font-medium hover:bg-shopify-green-dark">
          Go to Connect Store
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-shopify-secondary text-sm">
        <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
        </svg>
        Loading analytics...
      </div>
    );
  }

  if (error) {
    return <div className="p-4 bg-shopify-critical-light text-shopify-critical rounded-card border border-red-200 text-sm">{error}</div>;
  }

  // ─────────────────────────────────────────
  // TAB 1: TRAFFIC REPORT
  // ─────────────────────────────────────────
  const renderTraffic = () => {
    const catFiltered = categoryFilter === 'all' ? trafficReport : trafficReport.filter(p => (p.category || 'general') === categoryFilter);
    const high = catFiltered.filter(p => p.latest_score >= 70);
    const mod = catFiltered.filter(p => p.latest_score >= 40 && p.latest_score < 70);
    const risk = catFiltered.filter(p => p.latest_score < 40);
    
    const riskRevenue = risk.reduce((sum, p) => sum + p.revenue, 0);
    const showWarning = catFiltered.length > 0 && (risk.length / catFiltered.length) > 0.3;

    const uniqueCategories = [...new Set(trafficReport.map(p => p.category || 'general'))];

    return (
      <div className="space-y-6 fade-up">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-shopify-text">AI Visibility by Product</h2>
            <p className="text-sm text-shopify-secondary mt-0.5">Products ranked by how likely AI shopping assistants are to recommend them</p>
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-shopify-border rounded-btn focus:ring-1 focus:ring-shopify-green outline-none"
          >
            <option value="all">All Categories</option>
            {uniqueCategories.map(c => (
              <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
            ))}
          </select>
        </div>

        {showWarning && (
          <div className="bg-shopify-warning-light border border-shopify-warning rounded-card p-4 flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-shopify-text">{risk.length} of your products are invisible to AI shoppers.</p>
              <p className="text-xs text-shopify-secondary mt-0.5">Fixing them could recover est. {formatCurrency(riskRevenue)} in monthly revenue.</p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <div className="bg-shopify-success-light px-4 py-3 rounded-card border border-shopify-green/20 flex-1">
            <p className="text-xs font-semibold uppercase text-shopify-green mb-1">High Visibility</p>
            <p className="text-2xl font-bold text-shopify-text">{high.length}</p>
          </div>
          <div className="bg-shopify-warning-light px-4 py-3 rounded-card border border-shopify-warning/20 flex-1">
            <p className="text-xs font-semibold uppercase text-shopify-warning-text mb-1">Moderate</p>
            <p className="text-2xl font-bold text-shopify-text">{mod.length}</p>
          </div>
          <div className="bg-shopify-critical-light px-4 py-3 rounded-card border border-shopify-critical/20 flex-1">
            <p className="text-xs font-semibold uppercase text-shopify-critical mb-1">At Risk</p>
            <p className="text-2xl font-bold text-shopify-text">{risk.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-shopify-bg text-shopify-secondary text-xs uppercase tracking-wide border-b border-shopify-border">
              <tr>
                <th className="px-5 py-3 text-left w-12">#</th>
                <th className="px-5 py-3 text-left">Product</th>
                <th className="px-5 py-3 text-left">AI Score</th>
                <th className="px-5 py-3 text-right">Revenue (30d)</th>
                <th className="px-5 py-3 text-right">Orders</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-shopify-border">
              {[...catFiltered].sort((a,b) => b.latest_score - a.latest_score).map((p, i) => (
                <tr key={p.product_id} className="hover:bg-shopify-bg">
                  <td className="px-5 py-3.5 text-shopify-secondary">{i + 1}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-shopify-text">{p.product_title}</p>
                    <span
                      className="inline-flex items-center px-1.5 py-0 rounded-full text-xs mt-0.5"
                      style={{ backgroundColor: (CATEGORY_COLORS[p.category] || CATEGORY_COLORS.general).bg, color: (CATEGORY_COLORS[p.category] || CATEGORY_COLORS.general).text }}
                    >
                      {CATEGORY_LABELS[p.category] || 'General'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold w-6">{p.latest_score}</span>
                      <div className="flex-1 h-1.5 bg-shopify-border rounded-full min-w-[50px]">
                        <div className="h-full rounded-full" style={{
                          width: `${p.latest_score}%`,
                          backgroundColor: p.latest_score >= 70 ? '#008060' : p.latest_score >= 40 ? '#FFC453' : '#D72C0D'
                        }}/>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">{formatCurrency(p.revenue)}</td>
                  <td className="px-5 py-3.5 text-right">{p.orders_count}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.latest_score >= 70 ? 'bg-shopify-success-light text-shopify-green' :
                      p.latest_score >= 40 ? 'bg-shopify-warning-light text-shopify-warning-text' :
                      'bg-shopify-critical-light text-shopify-critical'
                    }`}>
                      {p.ai_traffic_tier}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {p.latest_score < 70 && (
                      <button onClick={() => setView('products')} className="text-xs font-medium text-shopify-green border border-shopify-green rounded-btn px-2.5 py-1 hover:bg-shopify-green-light">
                        Fix Now
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────
  // TAB 2: SCORE TRENDS
  // ─────────────────────────────────────────
  const renderTrends = () => {
    const data = trendView === 'store' ? storeHistory : productHistory;
    
    // Calculate delta for store
    let deltaText = "";
    if (trendView === 'store' && storeHistory.length >= 2) {
      const first = storeHistory[0].avgScore;
      const last = storeHistory[storeHistory.length - 1].avgScore;
      const diff = last - first;
      deltaText = diff >= 0 
        ? `Your store score improved ${diff} points in the tracked period.`
        : `Your store score dropped ${Math.abs(diff)} points.`;
    }

    return (
      <div className="space-y-6 fade-up">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-shopify-text">AI Score Over Time</h2>
          </div>
          <div className="flex bg-shopify-bg p-1 rounded-btn border border-shopify-border">
            <button 
              onClick={() => setTrendView('store')}
              className={`px-3 py-1 text-xs font-medium rounded ${trendView === 'store' ? 'bg-white shadow-sm text-shopify-text' : 'text-shopify-secondary'}`}
            >Store Average</button>
            <button 
              onClick={() => setTrendView('product')}
              className={`px-3 py-1 text-xs font-medium rounded ${trendView === 'product' ? 'bg-white shadow-sm text-shopify-text' : 'text-shopify-secondary'}`}
            >By Product</button>
          </div>
        </div>

        {trendView === 'product' && (
          <select 
            value={selectedProduct} 
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full max-w-sm px-3 py-2 text-sm border border-shopify-border rounded-btn focus:ring-1 focus:ring-shopify-green outline-none"
          >
            {trafficReport.map(p => <option key={p.product_id} value={p.product_id}>{p.product_title}</option>)}
          </select>
        )}

        <div className="bg-white rounded-card shadow-card p-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E3E5" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6D7175'}} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{fontSize: 12, fill: '#6D7175'}} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                  itemStyle={{color: '#008060', fontWeight: 'bold'}}
                />
                <ReferenceLine y={70} stroke="#FFC453" strokeDasharray="3 3" label={{position: 'insideTopLeft', value: 'Target (70)', fill: '#6D7175', fontSize: 11}} />
                <Line 
                  type="monotone" 
                  dataKey={trendView === 'store' ? 'avgScore' : 'score'} 
                  stroke="#008060" 
                  strokeWidth={3} 
                  dot={{r: 4, strokeWidth: 2, fill: '#fff'}} 
                  activeDot={{r: 6, fill: '#008060'}}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {trendView === 'store' && <p className="text-sm font-medium text-shopify-text mt-4 text-center">{deltaText}</p>}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────
  // TAB 3: CORRELATION
  // ─────────────────────────────────────────
  const renderCorrelation = () => {
    // Filter out zero revenue for better scatter visual
    const data = trafficReport.filter(p => p.revenue > 0).map(p => ({
      ...p,
      fill: p.latest_score >= 70 ? '#008060' : p.latest_score >= 40 ? '#FFC453' : '#D72C0D'
    }));

    // Simple insight calc
    const highAvg = data.filter(p => p.latest_score >= 70).reduce((s, p) => s + p.revenue, 0) / (data.filter(p => p.latest_score >= 70).length || 1);
    const lowAvg = data.filter(p => p.latest_score < 40).reduce((s, p) => s + p.revenue, 0) / (data.filter(p => p.latest_score < 40).length || 1);
    const diff = Math.max(0, highAvg - lowAvg);

    // Biggest opportunities: High revenue, low score
    const ops = [...trafficReport]
      .filter(p => p.latest_score < 60 && p.revenue > 0)
      .sort((a,b) => b.revenue - a.revenue)
      .slice(0, 5);

    return (
      <div className="space-y-6 fade-up">
        <div>
          <h2 className="text-lg font-semibold text-shopify-text">Does a better AI score mean more sales?</h2>
          <p className="text-sm text-shopify-secondary mt-0.5">See how your listing quality correlates with revenue (showing products with sales)</p>
        </div>

        <div className="bg-white rounded-card shadow-card p-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E1E3E5" />
                <XAxis dataKey="latest_score" type="number" name="AI Score" domain={[0, 100]} label={{ value: 'AI Visibility Score (0-100)', position: 'insideBottom', offset: -10, fill: '#6D7175', fontSize: 12 }} tick={{fontSize: 12, fill: '#6D7175'}} />
                <YAxis dataKey="revenue" type="number" name="Revenue" tickFormatter={(val) => `₹${val/1000}k`} tick={{fontSize: 12, fill: '#6D7175'}} />
                <Tooltip 
                  cursor={{strokeDasharray: '3 3'}}
                  content={({active, payload}) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-card shadow-card border border-shopify-border text-sm">
                          <p className="font-semibold text-shopify-text mb-1">{d.product_title}</p>
                          <p className="text-shopify-secondary">Score: <span className="font-medium text-shopify-text">{d.latest_score}</span></p>
                          <p className="text-shopify-secondary">Rev: <span className="font-medium text-shopify-green">{formatCurrency(d.revenue)}</span></p>
                          <p className="text-shopify-secondary">Orders: {d.orders_count}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter data={data} fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-8 bg-shopify-success-light border border-shopify-green/20 rounded-card p-4 text-center">
            <p className="text-sm text-shopify-text">
              Products scoring above 70 generate on average <span className="font-bold text-shopify-green">{formatCurrency(diff)}</span> more revenue per month than products scoring below 40.
            </p>
          </div>
        </div>

        {ops.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-shopify-text mb-3">Your biggest revenue opportunities</h3>
            <div className="bg-white rounded-card shadow-card overflow-hidden divide-y divide-shopify-border">
              {ops.map(p => (
                <div key={p.product_id} className="px-5 py-3.5 flex items-center justify-between hover:bg-shopify-bg">
                  <div>
                    <p className="text-sm font-medium text-shopify-text">{p.product_title}</p>
                    <p className="text-xs text-shopify-secondary mt-0.5">Current Score: <span className="font-semibold text-shopify-critical">{p.latest_score}</span> · Revenue: {formatCurrency(p.revenue)}</p>
                  </div>
                  <button onClick={() => setView('products')} className="text-xs font-medium text-shopify-green hover:underline">
                    Fix this first →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex bg-shopify-bg p-1 rounded-btn border border-shopify-border inline-flex">
          <button onClick={() => setTab('traffic')} className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${tab === 'traffic' ? 'bg-white shadow-sm text-shopify-text' : 'text-shopify-secondary hover:text-shopify-text'}`}>AI Traffic</button>
          <button onClick={() => setTab('trends')} className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${tab === 'trends' ? 'bg-white shadow-sm text-shopify-text' : 'text-shopify-secondary hover:text-shopify-text'}`}>Score Trends</button>
          <button onClick={() => setTab('correlation')} className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${tab === 'correlation' ? 'bg-white shadow-sm text-shopify-text' : 'text-shopify-secondary hover:text-shopify-text'}`}>Sales Correlation</button>
        </div>
        
        <button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="flex items-center gap-2 text-sm font-medium text-shopify-secondary hover:text-shopify-text disabled:opacity-50"
        >
          {refreshing ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
          )}
          Refresh Data
        </button>
      </div>

      {/* Content */}
      {tab === 'traffic' && renderTraffic()}
      {tab === 'trends' && renderTrends()}
      {tab === 'correlation' && renderCorrelation()}
    </div>
  );
}
