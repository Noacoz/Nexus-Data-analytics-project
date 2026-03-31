import React, { useState, useEffect } from 'react';
import { CinematicText, FadeInUp, TiltCard, SpotlightCard, ParallaxElement } from '../Shared';

const TypingText = ({ texts }) => {
  const [index, setIndex] = React.useState(0);
  const [displayed, setDisplayed] = React.useState('');
  const [typing, setTyping] = React.useState(true);
  React.useEffect(() => {
    const current = texts[index];
    if (typing) {
      if (displayed.length < current.length) {
        const t = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 50);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setTyping(false), 1500);
        return () => clearTimeout(t);
      }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 30);
        return () => clearTimeout(t);
      } else {
        setIndex((index + 1) % texts.length);
        setTyping(true);
      }
    }
  }, [displayed, typing, index, texts]);
  return <span className="text-sm text-slate-300 font-mono">{displayed}<span className="animate-pulse text-indigo-400">|</span></span>;
};

const GLOW_COLORS = [
  '#ff0080','#ff4500','#ff6b00','#ffaa00','#ffd700','#adff2f','#00ff88',
  '#00ffff','#00bfff','#0080ff','#8000ff','#ff00ff','#ff1493','#ff6347',
  '#7fff00','#00fa9a','#40e0d0','#1e90ff','#9370db','#ff69b4','#dc143c',
  '#00ced1','#ff8c00','#9400d3','#32cd32','#ff4081','#18ffff','#ea80fc',
  '#ccff90','#ffd180','#ff6e40','#40c4ff',
];
const CompanyLogo = ({ company, color }) => {
  const [glowColor, setGlowColor] = React.useState(null);
  const randomColor = () => GLOW_COLORS[Math.floor(Math.random() * GLOW_COLORS.length)];
  return (
    <div style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 2rem' }}>
      <div
        style={{
          backgroundColor: glowColor ? `${glowColor}22` : color,
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          fontWeight: 700,
          color: glowColor || 'white',
          fontSize: '0.875rem',
          whiteSpace: 'nowrap',
          opacity: glowColor ? 1 : 0.8,
          transform: glowColor ? 'scale(1.08)' : 'scale(1)',
          transition: 'all 0.3s ease',
          border: glowColor ? `1px solid ${glowColor}66` : '1px solid transparent',
          boxShadow: glowColor ? `0 0 20px ${glowColor}66, 0 0 40px ${glowColor}33` : 'none',
          cursor: 'pointer',
        }}
        onMouseEnter={() => setGlowColor(randomColor())}
        onMouseLeave={() => setGlowColor(null)}
      >
        {company}
      </div>
    </div>
  );
};

const ROICalculator = ({ setCurrentView }) => {
  const [hours, setHours] = React.useState(10);
  const hourlyRate = 45;
  const nexusReduction = 0.75;
  const hoursSaved = Math.round(hours * nexusReduction);
  const moneySaved = hoursSaved * hourlyRate;
  const cheapestPlan = 79;
  const netSaving = moneySaved - cheapestPlan;

  return (
    <div>
      {/* Slider */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-slate-400 text-sm">Hours spent on reporting per week</span>
          <span className="text-2xl font-bold brand-gradient-text">{hours}h</span>
        </div>
        <input
          type="range"
          min={2}
          max={40}
          value={hours}
          onChange={e => setHours(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #6366f1 0%, #06b6d4 ${((hours - 2) / 38) * 100}%, #1e293b ${((hours - 2) / 38) * 100}%, #1e293b 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>2 hrs</span>
          <span>40 hrs</span>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-slate-800 rounded-xl">
          <div className="text-3xl font-bold text-cyan-400 mb-1">{hoursSaved}h</div>
          <div className="text-slate-400 text-sm">Hours saved per week</div>
        </div>
        <div className="p-4 bg-slate-800 rounded-xl">
          <div className="text-3xl font-bold brand-gradient-text mb-1">${moneySaved.toLocaleString()}</div>
          <div className="text-slate-400 text-sm">Monthly value recovered</div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: netSaving > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)', border: `1px solid ${netSaving > 0 ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}` }}>
          <div className="text-3xl font-bold mb-1" style={{ color: netSaving > 0 ? '#10b981' : '#a5b4fc' }}>
            ${Math.abs(netSaving).toLocaleString()}
          </div>
          <div className="text-slate-400 text-sm">{netSaving > 0 ? 'Net monthly saving' : 'Investment after Nexus'}</div>
        </div>
      </div>

      {netSaving > 0 && (
        <p className="text-slate-400 text-sm mb-6">
          At {hours} hours/week of reporting, Nexus pays for itself and saves your team an extra{' '}
          <span className="text-green-400 font-semibold">${netSaving.toLocaleString()}/month</span> in recovered productivity.
        </p>
      )}

      <button
        onClick={() => setCurrentView('pricing')}
        className="px-8 py-3 brand-gradient text-white rounded-lg font-medium hover:opacity-90 transition-all"
      >
        Start saving time — free trial
      </button>
    </div>
  );
};

const HomeView = ({ onExplore, onGetStarted, setCurrentView }) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const chartData = [
    { type: 'bar', title: 'Monthly Revenue by Product', values: [
      { label: 'Analytics', val: '$42K', pct: 85, color: '#6366f1' },
      { label: 'Reports', val: '$31K', pct: 62, color: '#06b6d4' },
      { label: 'API', val: '$28K', pct: 56, color: '#a855f7' },
      { label: 'Enterprise', val: '$51K', pct: 100, color: '#10b981' },
      { label: 'Support', val: '$19K', pct: 38, color: '#f59e0b' },
    ], stats: [{val:'$171K',label:'Total',color:'#6366f1'},{val:'+23%',label:'Growth',color:'#10b981'},{val:'5',label:'Products',color:'#06b6d4'}] },
    { type: 'line', title: 'Daily Active Users — Q1 2024', points: '0,90 50,75 100,80 150,55 200,60 250,40 300,35',
      dots: [{x:0,y:90},{x:50,y:75},{x:100,y:80},{x:150,y:55},{x:200,y:60},{x:250,y:40},{x:300,y:35}],
      labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul'],
      stats: [{val:'8.4K',label:'Peak DAU',color:'#6366f1'},{val:'+61%',label:'Growth',color:'#10b981'},{val:'94%',label:'Retention',color:'#06b6d4'}] },
    { type: 'pie', title: 'Revenue Breakdown by Region', slices: [
      { label: 'North America', pct: '45%', color: '#6366f1', dash: 127, offset: 0 },
      { label: 'Europe', pct: '28%', color: '#06b6d4', dash: 79, offset: -127 },
      { label: 'Asia Pacific', pct: '18%', color: '#a855f7', dash: 51, offset: -206 },
      { label: 'Other', pct: '9%', color: '#f59e0b', dash: 25, offset: -257 },
    ], stats: [{val:'$2.4M',label:'Total Rev',color:'#6366f1'},{val:'4',label:'Regions',color:'#06b6d4'},{val:'+31%',label:'YoY',color:'#10b981'}] },
    { type: 'bar', title: 'Customer Acquisition by Channel', values: [
      { label: 'Organic', val: '2.1K', pct: 78, color: '#10b981' },
      { label: 'Paid', val: '1.4K', pct: 52, color: '#6366f1' },
      { label: 'Referral', val: '2.7K', pct: 100, color: '#f59e0b' },
      { label: 'Social', val: '0.9K', pct: 33, color: '#ec4899' },
      { label: 'Email', val: '1.8K', pct: 67, color: '#06b6d4' },
    ], stats: [{val:'8.9K',label:'Total',color:'#10b981'},{val:'$24',label:'CAC',color:'#6366f1'},{val:'3.2x',label:'ROAS',color:'#f59e0b'}] },
    { type: 'area', title: 'Sessions vs Conversions Over Time',
      line1: '0,100 50,85 100,70 150,60 200,45 250,35 300,20',
      line2: '0,115 50,105 100,95 150,85 200,75 250,65 300,55',
      legend: ['Conversions', 'Sessions'],
      stats: [{val:'94K',label:'Sessions',color:'#06b6d4'},{val:'11.2K',label:'Conversions',color:'#a855f7'},{val:'11.9%',label:'CVR',color:'#10b981'}] },
    { type: 'line', title: 'MRR Growth Trajectory', points: '0,110 50,100 100,85 150,70 200,50 250,30 300,15',
      dots: [{x:0,y:110},{x:50,y:100},{x:100,y:85},{x:150,y:70},{x:200,y:50},{x:250,y:30},{x:300,y:15}],
      labels: ['Aug','Sep','Oct','Nov','Dec','Jan','Feb'],
      stats: [{val:'$89K',label:'MRR',color:'#6366f1'},{val:'+312%',label:'6mo Growth',color:'#10b981'},{val:'142',label:'Customers',color:'#06b6d4'}] },
    { type: 'pie', title: 'Churn Analysis by Segment', slices: [
      { label: 'Enterprise', pct: '2%', color: '#10b981', dash: 6, offset: 0 },
      { label: 'Mid-market', pct: '8%', color: '#f59e0b', dash: 23, offset: -6 },
      { label: 'SMB', pct: '18%', color: '#ef4444', dash: 51, offset: -29 },
      { label: 'Retained', pct: '72%', color: '#6366f1', dash: 204, offset: -80 },
    ], stats: [{val:'7.2%',label:'Avg Churn',color:'#ef4444'},{val:'$340',label:'ACV Lost',color:'#f59e0b'},{val:'92.8%',label:'Retained',color:'#10b981'}] },
    { type: 'bar', title: 'Support Ticket Resolution Time', values: [
      { label: '<1hr', val: '38%', pct: 76, color: '#10b981' },
      { label: '1-4hr', val: '29%', pct: 58, color: '#06b6d4' },
      { label: '4-24hr', val: '21%', pct: 42, color: '#f59e0b' },
      { label: '>24hr', val: '12%', pct: 24, color: '#ef4444' },
    ], stats: [{val:'2.1hr',label:'Avg Time',color:'#06b6d4'},{val:'96%',label:'CSAT',color:'#10b981'},{val:'847',label:'Tickets',color:'#6366f1'}] },
    { type: 'area', title: 'Infrastructure Cost vs Revenue',
      line1: '0,60 50,55 100,50 150,45 200,42 250,38 300,35',
      line2: '0,110 50,100 100,85 150,68 200,50 250,32 300,18',
      legend: ['Infrastructure Cost', 'Revenue'],
      stats: [{val:'71%',label:'Margin',color:'#10b981'},{val:'$12K',label:'Infra/mo',color:'#ef4444'},{val:'3.1x',label:'Rev Ratio',color:'#6366f1'}] },
    { type: 'line', title: 'Feature Adoption Rates', points: '0,100 50,88 100,72 150,58 200,42 250,28 300,18',
      dots: [{x:0,y:100},{x:50,y:88},{x:100,y:72},{x:150,y:58},{x:200,y:42},{x:250,y:28},{x:300,y:18}],
      labels: ['NL Query','Charts','Export','API','Teams','Alerts','Mobile'],
      stats: [{val:'82%',label:'NL Adoption',color:'#6366f1'},{val:'+44%',label:'MoM',color:'#10b981'},{val:'7',label:'Features',color:'#06b6d4'}] },
  ];
  const [chartIndex, setChartIndex] = React.useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => {
      setChartIndex(prev => (prev + 1) % chartData.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const conversation = [
    { role: 'user', text: 'Show me revenue trends for Q1 2024' },
    { role: 'ai', text: 'Analysing your dataset across 847 rows...' },
    { role: 'ai', text: 'Revenue grew 31% MoM. Strongest month: March at $171K. Enterprise tier led growth.' },
    { role: 'user', text: 'Which region is underperforming?' },
    { role: 'ai', text: 'Asia Pacific is 18% below target. Conversion rate dropped from 14% to 9% in February.' },
    { role: 'user', text: 'Why did conversions drop in Feb?' },
    { role: 'ai', text: 'Detected pricing page bounce spike (+67%) coinciding with competitor price cut on Feb 3rd.' },
    { role: 'user', text: 'What should we do about churn?' },
    { role: 'ai', text: 'SMB segment shows 18% churn. Recommend onboarding flow improvement — users who complete setup churn 4x less.' },
    { role: 'user', text: 'Generate a board-ready summary' },
    { role: 'ai', text: 'Generating executive report... MRR $89K (+312% in 6 months), 142 customers, 92.8% retention. Ready to export.' },
    { role: 'user', text: 'Compare our CAC to industry benchmark' },
    { role: 'ai', text: 'Your CAC is $24 vs industry avg $67. You are 64% more efficient. Referral channel has best ROI at 3.2x.' },
  ];
  const [msgIndex, setMsgIndex] = React.useState(0);
  const [visibleMessages, setVisibleMessages] = React.useState([conversation[0]]);
  const [isTyping, setIsTyping] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const next = (msgIndex + 1) % conversation.length;
      if (conversation[next].role === 'ai') {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setMsgIndex(next);
          setVisibleMessages(prev => {
            const updated = [...prev, conversation[next]];
            return updated.length > 5 ? updated.slice(-5) : updated;
          });
        }, 1200);
      } else {
        setMsgIndex(next);
        setVisibleMessages(prev => {
          const updated = [...prev, conversation[next]];
          return updated.length > 5 ? updated.slice(-5) : updated;
        });
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [msgIndex]);



  const companies = [
    { name: 'Stripe',     color: '#635bff' },
    { name: 'Snowflake',  color: '#29b5e8' },
    { name: 'Databricks', color: '#ff3621' },
    { name: 'Airbnb',     color: '#ff5a5f' },
    { name: 'Netflix',    color: '#e50914' },
    { name: 'Spotify',    color: '#1ed760' },
    { name: 'Uber',       color: '#000000' },
    { name: 'Shopify',    color: '#96bf48' },
  ];

  return (
    <div className="relative">


      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative py-20 px-6 md:px-12 overflow-hidden min-h-screen flex items-center">
        <div
          className="absolute inset-0 glow-bg parallax-bg"
          style={{ '--scroll-y': scrollY }}
        />
        <div className="max-w-6xl mx-auto relative z-10 w-full">
          <div className="text-center max-w-3xl mx-auto">

            {/* Animated Badge */}
            <FadeInUp delay={0.1}>
              <div className="flex justify-center mb-6">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-indigo-500/30 text-sm cursor-pointer transition-all duration-300 hover:border-yellow-400/60 hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:bg-yellow-400/5 group">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="group-hover:text-yellow-300 transition-colors duration-300">Now with AI-powered insights</span>
                  <span className="brand-gradient-text font-semibold group-hover:text-yellow-400 transition-colors duration-300">→ Try free</span>
                </div>
              </div>
            </FadeInUp>

            <CinematicText
              text="Transform Your Data Into Insights-Instantly"
              className="text-4xl md:text-6xl font-bold mb-6"
              delay={0.2}
              stagger={0.08}
            />

            <FadeInUp delay={1.5}>
              <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                Nexus Analytics is a cloud-based platform that lets you upload datasets, run analytics,
                visualize trends, and collaborate with your team-all in one workspace.
              </p>
            </FadeInUp>

            <FadeInUp delay={2.0}>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <TiltCard intensity={8}>
                  <button
                    className="px-8 py-3 brand-gradient text-white rounded-lg font-medium hover:opacity-90 transition-all duration-300"
                    onClick={onGetStarted}
                  >
                    Start analyzing free
                  </button>
                </TiltCard>
                <TiltCard intensity={8}>
                  <button
                    className="px-8 py-3 glass text-slate-300 rounded-lg font-medium hover:text-white transition-all duration-300"
                    onClick={onExplore}
                  >
                    Request a demo
                  </button>
                </TiltCard>
              </div>
            </FadeInUp>

            {/* Animated Dashboard Preview */}
            <div className="relative mt-16 mx-auto max-w-5xl">
              <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50 bg-slate-900/80">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  <span className="ml-3 text-xs text-slate-500 font-mono">AURORA — Nexus Analytics Platform</span>
                  <div className="ml-auto flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-green-400">Live</span>
                  </div>
                </div>
                {/* Main content */}
                <div className="p-6 bg-slate-950/90">
                  <div className="grid grid-cols-2 gap-6">
                    {/* LEFT — AI Conversation */}
                    <div className="glass rounded-xl p-4 flex flex-col" style={{ minHeight: '320px' }}>
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-700/50">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white">A</div>
                        <span className="text-xs font-semibold text-slate-300">AURORA AI Agent</span>
                        <div className="ml-auto flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          <span className="text-xs text-green-400">Online</span>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col gap-2 overflow-hidden justify-end">
                        {visibleMessages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            style={{ animation: 'fadeInUp 0.4s ease-out forwards' }}>
                            {msg.role === 'ai' && (
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-xs text-white mr-2 flex-shrink-0 mt-0.5">A</div>
                            )}
                            <div className={`px-3 py-2 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                              msg.role === 'user'
                                ? 'bg-indigo-600/50 text-indigo-100 rounded-br-none'
                                : 'bg-slate-700/70 text-slate-200 rounded-bl-none'
                            }`}>
                              {msg.text}
                            </div>
                            {msg.role === 'user' && (
                              <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-xs text-white ml-2 flex-shrink-0 mt-0.5">U</div>
                            )}
                          </div>
                        ))}
                        {isTyping && (
                          <div className="flex justify-start">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-xs text-white mr-2 flex-shrink-0">A</div>
                            <div className="px-3 py-2 rounded-xl bg-slate-700/70 flex gap-1 items-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0s' }} />
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* RIGHT — Cycling Charts */}
                    <div className="glass rounded-xl p-4 flex flex-col" style={{ minHeight: '320px' }}>
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
                        <span className="text-xs font-semibold text-slate-300">{chartData[chartIndex].title}</span>
                        <div className="flex gap-1">
                          {chartData.map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                              style={{ background: i === chartIndex ? '#6366f1' : '#334155' }} />
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 flex items-center justify-center">
                        {chartData[chartIndex].type === 'bar' && (
                          <div className="w-full">
                            <div className="flex items-end gap-2 h-40 mb-2">
                              {chartData[chartIndex].values.map((v, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                  <span className="text-xs text-slate-400">{v.val}</span>
                                  <div className="w-full rounded-t transition-all duration-700"
                                    style={{ height: `${v.pct}%`, background: `linear-gradient(to top, ${v.color}, ${v.color}99)` }} />
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              {chartData[chartIndex].values.map((v, i) => (
                                <div key={i} className="flex-1 text-center text-xs text-slate-500 truncate">{v.label}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        {chartData[chartIndex].type === 'line' && (
                          <div className="w-full">
                            <svg viewBox="0 0 300 120" className="w-full h-40">
                              <defs>
                                <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                </linearGradient>
                              </defs>
                              <polyline points={chartData[chartIndex].points}
                                fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              <polygon points={`0,120 ${chartData[chartIndex].points} 300,120`}
                                fill="url(#lg1)" />
                              {chartData[chartIndex].dots.map((d, i) => (
                                <circle key={i} cx={d.x} cy={d.y} r="4" fill="#06b6d4" stroke="#0f172a" strokeWidth="2" />
                              ))}
                            </svg>
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                              {chartData[chartIndex].labels.map((l, i) => <span key={i}>{l}</span>)}
                            </div>
                          </div>
                        )}
                        {chartData[chartIndex].type === 'pie' && (
                          <div className="flex items-center gap-6">
                            <svg viewBox="0 0 120 120" className="w-36 h-36 flex-shrink-0" style={{ transform: 'rotate(-90deg)' }}>
                              {chartData[chartIndex].slices.map((s, i) => (
                                <circle key={i} cx="60" cy="60" r="45"
                                  fill="none" stroke={s.color} strokeWidth="18"
                                  strokeDasharray={`${s.dash} ${283 - s.dash}`}
                                  strokeDashoffset={-s.offset} />
                              ))}
                            </svg>
                            <div className="flex flex-col gap-2">
                              {chartData[chartIndex].slices.map((s, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                                  <span className="text-slate-400">{s.label}</span>
                                  <span className="text-slate-200 font-semibold ml-auto">{s.pct}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {chartData[chartIndex].type === 'area' && (
                          <div className="w-full">
                            <svg viewBox="0 0 300 120" className="w-full h-40">
                              <defs>
                                <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                                </linearGradient>
                                <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                                </linearGradient>
                              </defs>
                              <polygon points={`0,120 ${chartData[chartIndex].line1} 300,120`} fill="url(#ag1)" />
                              <polyline points={chartData[chartIndex].line1} fill="none" stroke="#06b6d4" strokeWidth="2" />
                              <polygon points={`0,120 ${chartData[chartIndex].line2} 300,120`} fill="url(#ag2)" />
                              <polyline points={chartData[chartIndex].line2} fill="none" stroke="#a855f7" strokeWidth="2" />
                            </svg>
                            <div className="flex gap-4 justify-center text-xs mt-1">
                              <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-cyan-400" /><span className="text-slate-400">{chartData[chartIndex].legend[0]}</span></div>
                              <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-purple-400" /><span className="text-slate-400">{chartData[chartIndex].legend[1]}</span></div>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-700/50">
                        {chartData[chartIndex].stats.map((s, i) => (
                          <div key={i} className="text-center">
                            <div className="text-sm font-bold" style={{ color: s.color }}>{s.val}</div>
                            <div className="text-xs text-slate-500">{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-indigo-600/20 blur-2xl rounded-full" />
            </div>

                  </div>
                  {/* AI Conversation */}
                  <div className="glass rounded-lg p-4 mb-4 h-32 overflow-hidden relative">
                    <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      AURORA AI — Live
                    </div>
                    <div className="space-y-2 overflow-hidden">
                      {visibleMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeInUp`}>
                          <div className={`px-3 py-1.5 rounded-lg text-xs max-w-[80%] ${
                            msg.role === 'user'
                              ? 'bg-indigo-600/40 text-indigo-200'
                              : 'bg-slate-700/60 text-slate-300'
                          }`}>
                            {msg.role === 'ai' && <span className="text-cyan-400 font-semibold mr-1">AURORA:</span>}
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Cycling Charts */}
                  <div className="glass rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs text-slate-500">Analytics Overview</div>
                      <div className="flex gap-1">
                        {['bar', 'line', 'pie'].map((t) => (
                          <div key={t} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${chartType === t ? 'bg-indigo-400' : 'bg-slate-600'}`} />
                        ))}
                      </div>
                    </div>
                    {chartType === 'bar' && (
                      <div className="flex items-end gap-1.5 h-16">
                        {[65, 85, 45, 92, 70, 55, 88, 73].map((h, i) => (
                          <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-indigo-600 to-cyan-400 opacity-80 transition-all duration-500"
                            style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }} />
                        ))}
                      </div>
                    )}
                    {chartType === 'line' && (
                      <svg viewBox="0 0 200 60" className="w-full h-16">
                        <defs>
                          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#06b6d4" />
                          </linearGradient>
                        </defs>
                        <polyline points="0,50 25,35 50,40 75,20 100,30 125,15 150,25 175,10 200,20"
                          fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        {[0,25,50,75,100,125,150,175,200].map((x, i) => {
                          const ys = [50,35,40,20,30,15,25,10,20];
                          return <circle key={i} cx={x} cy={ys[i]} r="3" fill="#06b6d4" opacity="0.8" />;
                        })}
                        <polyline points="0,50 25,35 50,40 75,20 100,30 125,15 150,25 175,10 200,20"
                          fill="url(#lineGrad)" fillOpacity="0.1" stroke="none" />
                      </svg>
                    )}
                    {chartType === 'pie' && (
                      <div className="flex items-center gap-4 h-16">
                        <svg viewBox="0 0 60 60" className="h-16 w-16 flex-shrink-0" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="30" cy="30" r="24" fill="none" stroke="#1e293b" strokeWidth="12" />
                          <circle cx="30" cy="30" r="24" fill="none" stroke="#6366f1" strokeWidth="12"
                            strokeDasharray="75 150" strokeDashoffset="0" />
                          <circle cx="30" cy="30" r="24" fill="none" stroke="#06b6d4" strokeWidth="12"
                            strokeDasharray="45 150" strokeDashoffset="-75" />
                          <circle cx="30" cy="30" r="24" fill="none" stroke="#a855f7" strokeWidth="12"
                            strokeDasharray="30 150" strokeDashoffset="-120" />
                        </svg>
                        <div className="flex flex-col gap-1 text-xs">
                          {[['#6366f1','Revenue','50%'],['#06b6d4','Users','30%'],['#a855f7','Churn','20%']].map(([c,l,v]) => (
                            <div key={l} className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c }} />
                              <span className="text-slate-400">{l}</span>
                              <span className="text-slate-300 font-medium ml-auto">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-indigo-600/20 blur-2xl rounded-full" />
            </div>

          </div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────── */}
      <FadeInUp delay={0.4}>
        <div className="py-10 px-6 md:px-12 border-y border-slate-800/50">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
              {[
                { number: '10,000+', label: 'Datasets analysed' },
                { number: '500+', label: 'Teams worldwide' },
                { number: '99.9%', label: 'Uptime SLA' },
                { number: '2.4M', label: 'Rows Analysed', color: 'text-cyan-400' },
                { number: '8,391', label: 'AI Insights', color: 'text-purple-400' },
              ].map((stat, i) => (
                <div key={i} className="glass rounded-lg p-4">
                  <div className={`text-2xl md:text-3xl font-bold ${stat.color || 'brand-gradient-text'} mb-1`}>{stat.number}</div>
                  <div className="text-slate-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeInUp>

      {/* ── TRUSTED BY ──────────────────────────────────────── */}
      <FadeInUp delay={0.5}>
        <section className="py-16 px-6 md:px-12 border-y border-slate-800">
          <div className="max-w-6xl mx-auto">
            <p className="text-center text-slate-400 mb-12 text-lg font-medium">
              Trusted by data teams at
            </p>
            <div className="overflow-hidden relative">
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: 'max-content',
                  animation: 'marquee 40s linear infinite',
                }}
              >
                {companies.map((company, i) => (
                  <CompanyLogo key={i} company={company.name} color={company.color} />
                ))}
                {companies.map((company, i) => (
                  <CompanyLogo key={`dup-${i}`} company={company.name} color={company.color} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </FadeInUp>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <FadeInUp delay={0.3}>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                From raw data to insights in{' '}
                <span className="brand-gradient-text">three steps</span>
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                No setup. No training. No data science degree required.
              </p>
            </div>
          </FadeInUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-px bg-gradient-to-r from-indigo-500 to-cyan-400 opacity-30" />

            <FadeInUp delay={0.4}>
              <TiltCard intensity={8}>
                <div className="glass rounded-2xl p-8 text-center relative">
                  <div className="w-16 h-16 rounded-2xl brand-gradient flex items-center justify-center mx-auto mb-6 text-2xl">
                    📤
                  </div>
                  <div className="text-5xl font-bold brand-gradient-text mb-3 opacity-20 absolute top-6 right-6">01</div>
                  <h3 className="text-xl font-bold mb-3">Upload</h3>
                  <p className="text-slate-400">
                    Drag in your CSV, Excel, or JSON file. Or connect directly to your database. Takes 30 seconds.
                  </p>
                </div>
              </TiltCard>
            </FadeInUp>

            <FadeInUp delay={0.6}>
              <TiltCard intensity={8}>
                <div className="glass rounded-2xl p-8 text-center relative" style={{ border: '1px solid rgba(99,102,241,0.4)' }}>
                  <div className="w-16 h-16 rounded-2xl brand-gradient flex items-center justify-center mx-auto mb-6 text-2xl">
                    📈
                  </div>
                  <div className="text-5xl font-bold brand-gradient-text mb-3 opacity-20 absolute top-6 right-6">02</div>
                  <h3 className="text-xl font-bold mb-3">Analyse</h3>
                  <p className="text-slate-400">
                    AI instantly surfaces trends, anomalies, and patterns in your data. No configuration. No SQL.
                  </p>
                  <div className="mt-4 inline-block px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
                    ⚡ Usually under 60 seconds
                  </div>
                </div>
              </TiltCard>
            </FadeInUp>

            <FadeInUp delay={0.8}>
              <TiltCard intensity={8}>
                <div className="glass rounded-2xl p-8 text-center relative">
                  <div className="w-16 h-16 rounded-2xl brand-gradient flex items-center justify-center mx-auto mb-6 text-2xl">
                    ↗️
                  </div>
                  <div className="text-5xl font-bold brand-gradient-text mb-3 opacity-20 absolute top-6 right-6">03</div>
                  <h3 className="text-xl font-bold mb-3">Share</h3>
                  <p className="text-slate-400">
                    Send a live dashboard link or export a polished PDF report. Your whole team stays aligned.
                  </p>
                </div>
              </TiltCard>
            </FadeInUp>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <FadeInUp delay={0.3}>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              What data teams are <span className="brand-gradient-text">saying</span>
            </h2>
          </FadeInUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "We cut our weekly reporting time from 8 hours to 45 minutes. Our analysts now spend their time on actual analysis instead of formatting spreadsheets.",
                name: "Amara Osei",
                role: "Head of Data, Growthify",
                avatar: "AO",
                color: "#6366f1"
              },
              {
                quote: "I needed investor-ready metrics before a Series A pitch. I uploaded our data on a Monday, had a full dashboard by Tuesday. We closed the round.",
                name: "James Mwangi",
                role: "Founder, Pula Ventures",
                avatar: "JM",
                color: "#06b6d4"
              },
              {
                quote: "Our marketing team used to argue about which campaign worked. Now we all look at the same live dashboard. No more debates, just decisions.",
                name: "Priya Sharma",
                role: "CMO, Stackly",
                avatar: "PS",
                color: "#10b981"
              }
            ].map((t, i) => (
              <FadeInUp key={i} delay={0.4 + i * 0.15}>
                <TiltCard intensity={8}>
                  <SpotlightCard className="glass rounded-2xl p-6 h-full flex flex-col">
                    {/* Stars */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <span key={j} className="text-yellow-400">★</span>
                      ))}
                    </div>
                    {/* Quote */}
                    <p className="text-slate-300 text-sm leading-relaxed flex-1 mb-6">
                      "{t.quote}"
                    </p>
                    {/* Author */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ background: t.color }}>
                        {t.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{t.name}</p>
                        <p className="text-slate-500 text-xs">{t.role}</p>
                      </div>
                    </div>
                  </SpotlightCard>
                </TiltCard>
              </FadeInUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROI CALCULATOR ───────────────────────────────── */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <FadeInUp delay={0.3}>
            <div className="glass rounded-2xl p-10 text-center" style={{ border: '1px solid rgba(99,102,241,0.3)' }}>
              <h2 className="text-3xl font-bold mb-2">How much time is your team losing?</h2>
              <p className="text-slate-400 mb-10">
                Move the slider to see how much Nexus could save you each month.
              </p>

              <ROICalculator setCurrentView={setCurrentView} />
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">

          <FadeInUp delay={0.5}>
            <CinematicText
              text="Enterprise-grade analytics for modern teams"
              className="text-3xl md:text-4xl font-bold text-center mb-16"
              delay={0.2}
              stagger={0.05}
            />
          </FadeInUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Feature 1 — Unified Data Workspace (spans 2 cols) */}
            <FadeInUp delay={0.7}>
              <TiltCard intensity={10}>
                <SpotlightCard className="glass rounded-2xl p-6 col-span-1 md:col-span-2 transition-all duration-300 hover:scale-102">
                  <div className="w-12 h-12 rounded-lg brand-gradient flex items-center justify-center mb-4">
                    <span className="text-white text-xl">🗄️</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">Unified Data Workspace</h3>
                  <p className="text-slate-300 mb-4">
                    Upload, clean, and manage datasets in a collaborative environment designed for data teams.
                    Support for CSV, JSON, Parquet, and more.
                  </p>
                  <div className="mt-6 p-4 bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-400">Process datasets 5x faster with our optimized data engine.</p>
                  </div>
                </SpotlightCard>
              </TiltCard>
            </FadeInUp>

            {/* Feature 2 — AI-Powered Insights */}
            <FadeInUp delay={0.9}>
              <TiltCard intensity={10}>
                <SpotlightCard className="glass rounded-2xl p-6 transition-all duration-300 hover:scale-102">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
                    <span className="text-white text-xl">🔍</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">AI-Powered Insights</h3>
                  <p className="text-slate-300 mb-4">Automated pattern detection and intelligent recommendations.</p>
                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex items-start"><span className="text-cyan-400 mr-2 mt-0.5 flex-shrink-0">✓</span><span>Automated trend detection</span></div>
                    <div className="flex items-start"><span className="text-cyan-400 mr-2 mt-0.5 flex-shrink-0">✓</span><span>Anomaly identification</span></div>
                    <div className="flex items-start"><span className="text-cyan-400 mr-2 mt-0.5 flex-shrink-0">✓</span><span>Predictive analytics</span></div>
                  </div>
                </SpotlightCard>
              </TiltCard>
            </FadeInUp>

            {/* Feature 3 — Visual Analytics */}
            <FadeInUp delay={1.1}>
              <TiltCard intensity={10}>
                <SpotlightCard className="glass rounded-2xl p-6 transition-all duration-300 hover:scale-102">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #3b82f6, #22d3ee)' }}>
                    <span className="text-white text-xl">📈</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">Visual Analytics</h3>
                  <p className="text-slate-300 mb-4">Beautiful, interactive charts generated automatically from your data.</p>
                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex items-start"><span className="text-cyan-400 mr-2 mt-0.5 flex-shrink-0">✓</span><span>30+ chart types</span></div>
                    <div className="flex items-start"><span className="text-cyan-400 mr-2 mt-0.5 flex-shrink-0">✓</span><span>Interactive dashboards</span></div>
                    <div className="flex items-start"><span className="text-cyan-400 mr-2 mt-0.5 flex-shrink-0">✓</span><span>Export to PDF/PNG</span></div>
                  </div>
                </SpotlightCard>
              </TiltCard>
            </FadeInUp>

            {/* Feature 4 — Secure Collaboration */}
            <FadeInUp delay={1.3}>
              <TiltCard intensity={10}>
                <SpotlightCard className="glass rounded-2xl p-6 transition-all duration-300 hover:scale-102">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #22c55e, #34d399)' }}>
                    <span className="text-white text-xl">🔐</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">Secure Collaboration</h3>
                  <p className="text-slate-300 mb-4">Enterprise-grade security with role-based access.</p>
                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex items-start"><span className="text-cyan-400 mr-2 mt-0.5 flex-shrink-0">✓</span><span>Role-based permissions</span></div>
                    <div className="flex items-start"><span className="text-cyan-400 mr-2 mt-0.5 flex-shrink-0">✓</span><span>End-to-end encryption</span></div>
                    <div className="flex items-start"><span className="text-cyan-400 mr-2 mt-0.5 flex-shrink-0">✓</span><span>Audit trail logging</span></div>
                  </div>
                </SpotlightCard>
              </TiltCard>
            </FadeInUp>

            {/* Feature 5 — Team Collaboration */}
            <FadeInUp delay={1.5}>
              <TiltCard intensity={10}>
                <SpotlightCard className="glass rounded-2xl p-6 transition-all duration-300 hover:scale-102">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}>
                    <span className="text-white text-xl">🤝</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">Team Collaboration</h3>
                  <p className="text-slate-300">
                    Share insights, comment on datasets, and collaborate in real-time with your entire data team.
                  </p>
                </SpotlightCard>
              </TiltCard>
            </FadeInUp>

            {/* Feature 6 — Scale Without Limits (spans 3 cols) */}
            <FadeInUp delay={1.7}>
              <TiltCard intensity={10}>
                <SpotlightCard className="glass rounded-2xl p-6 col-span-1 md:col-span-3 transition-all duration-300 hover:scale-102">
                  <div className="flex flex-col md:flex-row items-center">
                    <div className="md:w-2/3 md:pr-8">
                      <h3 className="text-2xl font-bold mb-4">Scale Without Limits</h3>
                      <p className="text-slate-300 mb-6">
                        From startups to Fortune 500 companies, Nexus Analytics grows with your data needs.
                        Our infrastructure handles petabytes of data with 99.99% uptime.
                      </p>
                      <TiltCard intensity={8}>
                        <button
                          className="px-6 py-3 brand-gradient text-white rounded-lg font-medium hover:opacity-90 transition-all duration-300 hover:scale-105"
                          onClick={onExplore}
                        >
                          Explore capabilities
                        </button>
                      </TiltCard>
                    </div>
                    <div className="md:w-1/3 mt-6 md:mt-0 flex justify-center">
                      <div className="w-full h-48 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center transition-all duration-300 hover:scale-105">
                        <div className="text-center">
                          <div className="text-4xl font-bold brand-gradient-text mb-2">99.99%</div>
                          <p className="text-slate-400">Uptime SLA</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </TiltCard>
            </FadeInUp>

          </div>
        </div>
      </section>

    </div>
  );
};

export default HomeView;

