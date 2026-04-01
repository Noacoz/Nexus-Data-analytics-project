import React, { useState, useEffect } from 'react';
import { CinematicText, FadeInUp, TiltCard, SpotlightCard } from '../Shared';

const GLOW_COLORS = ['#ff0080','#ff4500','#ff6b00','#ffaa00','#ffd700','#adff2f','#00ff88','#00ffff','#00bfff','#0080ff','#8000ff','#ff00ff','#ff1493','#ff6347','#7fff00','#00fa9a','#40e0d0','#1e90ff','#9370db','#ff69b4'];

const CompanyLogo = ({ company, color }) => {
  const [glowColor, setGlowColor] = useState(null);
  const randomColor = () => GLOW_COLORS[Math.floor(Math.random() * GLOW_COLORS.length)];
  return (
    <div style={{ flexShrink:0, display:'inline-flex', alignItems:'center', justifyContent:'center', margin:'0 2rem' }}>
      <div
        style={{
          backgroundColor: glowColor ? glowColor + '22' : color,
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          fontWeight: 700,
          color: glowColor || 'white',
          fontSize: '0.875rem',
          whiteSpace: 'nowrap',
          opacity: glowColor ? 1 : 0.85,
          transform: glowColor ? 'scale(1.06)' : 'scale(1)'
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
  const [hours, setHours] = useState(10);
  const hourlyRate = 45;
  const nexusReduction = 0.75;
  const hoursSaved = Math.round(hours * nexusReduction);
  const moneySaved = hoursSaved * hourlyRate;
  const cheapestPlan = 79;
  const netSaving = moneySaved - cheapestPlan;

  return (
    <div>
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
        />
        <div className="flex justify-between text-xs text-slate-600 mt-1"><span>2 hrs</span><span>40 hrs</span></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-slate-800 rounded-xl"><div className="text-3xl font-bold text-cyan-400 mb-1">{hoursSaved}h</div><div className="text-slate-400 text-sm">Hours saved per week</div></div>
        <div className="p-4 bg-slate-800 rounded-xl"><div className="text-3xl font-bold brand-gradient-text mb-1">${moneySaved.toLocaleString()}</div><div className="text-slate-400 text-sm">Monthly value recovered</div></div>
        <div className="p-4 rounded-xl" style={{ background: netSaving > 0 ? 'rgba(16,185,129,0.06)' : 'rgba(99,102,241,0.06)', border: `1px solid ${netSaving > 0 ? 'rgba(16,185,129,0.18)' : 'rgba(99,102,241,0.18)'}` }}>
          <div className="text-3xl font-bold mb-1" style={{ color: netSaving > 0 ? '#10b981' : '#a5b4fc' }}>${Math.abs(netSaving).toLocaleString()}</div>
          <div className="text-slate-400 text-sm">{netSaving > 0 ? 'Net monthly saving' : 'Investment after Nexus'}</div>
        </div>
      </div>

      {netSaving > 0 && <p className="text-slate-400 text-sm mb-6">At {hours} hours/week, Nexus pays for itself and saves <span className="text-green-400 font-semibold">${netSaving.toLocaleString()}/month</span>.</p>}
      <button onClick={() => setCurrentView('pricing')} className="px-8 py-3 brand-gradient text-white rounded-lg font-medium hover:opacity-90 transition-all">Start saving time - free trial</button>
    </div>
  );
};

const HomeView = ({ onExplore, onGetStarted, setCurrentView }) => {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY || 0);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const chartData = [
    { type: 'bar', title: 'Monthly Revenue by Product', values: [{ label: 'Analytics', val: '$42K', pct: 85, color: '#6366f1' }, { label: 'Reports', val: '$31K', pct: 62, color: '#06b6d4' }, { label: 'API', val: '$28K', pct: 56, color: '#a855f7' }], stats: [{ val: '$101K', label: 'Total', color: '#6366f1' }, { val: '+23%', label: 'Growth', color: '#10b981' }, { val: '3', label: 'Products', color: '#06b6d4' }] },
    { type: 'line', title: 'Daily Active Users - Q1 2024', points: '0,90 50,75 100,80 150,55 200,60', dots: [{ x: 0, y: 90 }, { x: 50, y: 75 }, { x: 100, y: 80 }], labels: ['Jan', 'Feb', 'Mar'], stats: [{ val: '8.4K', label: 'Peak DAU', color: '#6366f1' }, { val: '+61%', label: 'Growth', color: '#10b981' }, { val: '94%', label: 'Retention', color: '#06b6d4' }] },
    { type: 'pie', title: 'Revenue Breakdown by Region', slices: [{ label: 'North America', pct: '45%', color: '#6366f1', dash: 127, offset: 0 }, { label: 'Europe', pct: '28%', color: '#06b6d4', dash: 79, offset: -127 }, { label: 'Asia Pacific', pct: '18%', color: '#a855f7', dash: 51, offset: -206 }], stats: [{ val: '$2.4M', label: 'Total Rev', color: '#6366f1' }, { val: '4', label: 'Regions', color: '#06b6d4' }, { val: '+31%', label: 'YoY', color: '#10b981' }] }
  ];

  const [chartIndex, setChartIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setChartIndex(prev => (prev + 1) % chartData.length), 4200);
    return () => clearInterval(interval);
  }, []);

  const conversation = [
    { role: 'user', text: 'Show me revenue trends for Q1 2024' },
    { role: 'ai', text: 'Analysing your dataset across 847 rows...' },
    { role: 'ai', text: 'Revenue grew 31% MoM. Strongest month: March at $171K.' },
    { role: 'user', text: 'Which region is underperforming?' },
    { role: 'ai', text: 'Asia Pacific is 18% below target.' },
    { role: 'user', text: 'Generate a board-ready summary' },
    { role: 'ai', text: 'MRR $89K (+312% in 6 months), 142 customers, 92.8% retention.' }
  ];

  const [msgIndex, setMsgIndex] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState([conversation[0]]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = (msgIndex + 1) % conversation.length;
      if (conversation[next].role === 'ai') {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setMsgIndex(next);
          setVisibleMessages(prev => {
            const u = [...prev, conversation[next]];
            return u.length > 5 ? u.slice(-5) : u;
          });
        }, 900);
      } else {
        setMsgIndex(next);
        setVisibleMessages(prev => {
          const u = [...prev, conversation[next]];
          return u.length > 5 ? u.slice(-5) : u;
        });
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [msgIndex]);

  const companies = [{ name: 'Stripe', color: '#635bff' }, { name: 'Snowflake', color: '#29b5e8' }, { name: 'Databricks', color: '#ff3621' }, { name: 'Airbnb', color: '#ff5a5f' }, { name: 'Netflix', color: '#e50914' }, { name: 'Spotify', color: '#1ed760' }, { name: 'Uber', color: '#000000' }, { name: 'Shopify', color: '#96bf48' }];

  return (
    <div className="relative">
      <section className="relative py-20 px-6 md:px-12 overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 glow-bg parallax-bg" style={{ '--scroll-y': scrollY }} />
        <div className="max-w-6xl mx-auto relative z-10 w-full">
          <div className="text-center max-w-3xl mx-auto">
            <FadeInUp delay={0.1}>
              <div className="flex justify-center mb-6">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-indigo-500/30 text-sm cursor-pointer transition-all duration-300 hover:border-yellow-400/60 group">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="group-hover:text-yellow-300 transition-colors duration-300">Now with AI-powered insights</span>
                  <span className="brand-gradient-text font-semibold group-hover:text-yellow-400 transition-colors duration-300">Try free</span>
                </div>
              </div>
            </FadeInUp>

            <CinematicText text="Transform Your Data Into Insights Instantly" className="text-4xl md:text-6xl font-bold mb-6" delay={0.2} stagger={0.08} />

            <FadeInUp delay={1.2}>
              <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">AURORA is an AI-native analytics platform. Upload datasets, run analytics, visualize trends, and collaborate — all in one workspace.</p>
            </FadeInUp>

            <FadeInUp delay={1.8}>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <TiltCard intensity={8}><button className="px-8 py-3 brand-gradient text-white rounded-lg font-medium hover:opacity-90 transition-all duration-300" onClick={onGetStarted}>Start analyzing free</button></TiltCard>
                <TiltCard intensity={8}><button className="px-8 py-3 glass text-slate-300 rounded-lg font-medium hover:text-white transition-all duration-300" onClick={onExplore}>Request a demo</button></TiltCard>
              </div>
            </FadeInUp>

            <div className="relative mt-12 mx-auto max-w-5xl">
              <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50 bg-slate-900/80">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  <span className="ml-3 text-xs text-slate-500 font-mono">AURORA Analytics Platform</span>
                  <div className="ml-auto flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /><span className="text-xs text-green-400">Live</span></div>
                </div>
                <div className="p-6 bg-slate-950/90">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="glass rounded-xl p-4 flex flex-col" style={{ minHeight: '260px' }}>
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-700/50">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white">A</div>
                        <span className="text-xs font-semibold text-slate-300">AURORA AI Agent</span>
                        <div className="ml-auto flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /><span className="text-xs text-green-400">Online</span></div>
                      </div>
                      <div className="flex-1 flex flex-col gap-2 overflow-hidden justify-end">
                        {visibleMessages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'ai' && <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-xs text-white mr-2 flex-shrink-0">A</div>}
                            <div className={`px-3 py-2 rounded-xl text-xs max-w-[85%] leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600/50 text-indigo-100 rounded-br-none' : 'bg-slate-700/70 text-slate-200 rounded-bl-none'}`}>{msg.text}</div>
                            {msg.role === 'user' && <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-xs text-white ml-2 flex-shrink-0">U</div>}
                          </div>
                        ))}
                        {isTyping && (
                          <div className="flex justify-start">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-xs text-white mr-2 flex-shrink-0">A</div>
                            <div className="px-3 py-2 rounded-xl bg-slate-700/70 flex gap-1 items-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="glass rounded-xl p-4 flex flex-col" style={{ minHeight: '260px' }}>
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
                        <span className="text-xs font-semibold text-slate-300">{chartData[chartIndex].title}</span>
                        <div className="flex gap-1">{chartData.map((_, i) => (<div key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-300" style={{ background: i === chartIndex ? '#6366f1' : '#334155' }} />))}</div>
                      </div>
                      <div className="flex-1 flex items-center justify-center">
                        {chartData[chartIndex].type === 'bar' && (
                          <div className="w-full">
                            <div className="flex items-end gap-2 h-40 mb-2">
                              {chartData[chartIndex].values.map((v, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                  <span className="text-xs text-slate-400">{v.val}</span>
                                  <div className="w-full rounded-t transition-all duration-700" style={{ height: `${v.pct}%`, background: `linear-gradient(to top, ${v.color}, ${v.color}99)` }} />
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">{chartData[chartIndex].values.map((v, i) => <div key={i} className="flex-1 text-center text-xs text-slate-500 truncate">{v.label}</div>)}</div>
                          </div>
                        )}
                        {chartData[chartIndex].type === 'line' && (
                          <div className="w-full"><svg viewBox="0 0 300 120" className="w-full h-40"><polyline points={chartData[chartIndex].points} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                        )}
                        {chartData[chartIndex].type === 'pie' && (
                          <div className="flex items-center gap-6"><svg viewBox="0 0 120 120" className="w-36 h-36 flex-shrink-0" style={{ transform: 'rotate(-90deg)' }}>{chartData[chartIndex].slices.map((s, i) => <circle key={i} cx="60" cy="60" r="45" fill="none" stroke={s.color} strokeWidth="18" strokeDasharray={`${s.dash} ${283 - s.dash}`} strokeDashoffset={-s.offset} />)}</svg></div>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-700/50">
                        {chartData[chartIndex].stats.map((s, i) => (
                          <div key={i} className="text-center"><div className="text-sm font-bold" style={{ color: s.color }}>{s.val}</div><div className="text-xs text-slate-500">{s.label}</div></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <FadeInUp delay={0.4}>
        <div className="py-10 px-6 md:px-12 border-y border-slate-800/50">
          <div className="max-w-6xl mx-auto grid grid-cols-3 gap-8 text-center">{[{ number: '10,000+', label: 'Datasets analysed' }, { number: '500+', label: 'Teams worldwide' }, { number: '99.9%', label: 'Uptime SLA' }].map((stat, i) => (<div key={i}><div className="text-3xl md:text-4xl font-bold brand-gradient-text mb-1">{stat.number}</div><div className="text-slate-400 text-sm">{stat.label}</div></div>))}</div>
        </div>
      </FadeInUp>

      <FadeInUp delay={0.5}>
        <section className="py-16 px-6 md:px-12 border-y border-slate-800"><div className="max-w-6xl mx-auto"><p className="text-center text-slate-400 mb-12 text-lg font-medium">Trusted by data teams at</p><div className="overflow-hidden relative"><div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: 'max-content', animation: 'marquee 40s linear infinite' }}>{companies.map((c, i) => <CompanyLogo key={i} company={c.name} color={c.color} />)}{companies.map((c, i) => <CompanyLogo key={`d-${i}`} company={c.name} color={c.color} />)}</div></div></div></section>
      </FadeInUp>

      <section className="py-20 px-6 md:px-12"><div className="max-w-4xl mx-auto"><FadeInUp delay={0.3}><div className="glass rounded-2xl p-10 text-center" style={{ border: '1px solid rgba(99,102,241,0.12)' }}><h2 className="text-3xl font-bold mb-2">How much time is your team losing?</h2><p className="text-slate-400 mb-10">Move the slider to see how much AURORA could save you each month.</p><ROICalculator setCurrentView={setCurrentView} /></div></FadeInUp></div></section>

    </div>
  );
};

export default HomeView;

