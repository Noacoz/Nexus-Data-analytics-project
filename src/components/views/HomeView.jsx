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

const CompanyLogo = ({ company, color }) => (
  <div style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 2rem' }}>
    <div
      style={{
        backgroundColor: color,
        padding: '0.75rem 1.5rem',
        borderRadius: '0.5rem',
        fontWeight: 700,
        color: 'white',
        fontSize: '0.875rem',
        whiteSpace: 'nowrap',
        opacity: 0.8,
        transition: 'opacity 0.3s, transform 0.3s',
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.05)'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {company}
    </div>
  </div>
);

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
  }, []);\n\n  const [chartType, setChartType] = React.useState('bar');\n  React.useEffect(() => {\n    const charts = ['bar', 'line', 'pie'];\n    let i = 0;\n    const interval = setInterval(() => {\n      i = (i + 1) % charts.length;\n      setChartType(charts[i]);\n    }, 3000);\n    return () => clearInterval(interval);\n  }, []);

  const companies = [\n    { name: 'Stripe',     color: '#635bff' },\n    { name: 'Snowflake',  color: '#29b5e8' },\n    { name: 'Databricks', color: '#ff3621' },\n    { name: 'Airbnb',     color: '#ff5a5f' },\n    { name: 'Netflix',    color: '#e50914' },\n    { name: 'Spotify',    color: '#1ed760' },\n    { name: 'Uber',       color: '#000000' },\n    { name: 'Shopify',    color: '#96bf48' },\n  ];\n\n  const conversation = [\n    { role: 'user', text: 'Show me top 5 products by revenue' },\n    { role: 'ai', text: 'Running query on your dataset...' },\n    { role: 'ai', text: 'Product A leads with $2.4M, up 23% this quarter.' },\n    { role: 'user', text: 'Any anomalies in the data?' },\n    { role: 'ai', text: 'Detected spike in returns on Day 14 — possible supply issue.' },\n    { role: 'user', text: 'Compare this month vs last month' },\n    { role: 'ai', text: 'Revenue up 18%, DAU up 31%. Strong growth signals.' },\n  ];\n  const [msgIndex, setMsgIndex] = React.useState(0);\n  const [visibleMessages, setVisibleMessages] = React.useState([conversation[0]]);\n  React.useEffect(() => {\n    const timer = setTimeout(() => {\n      const next = (msgIndex + 1) % conversation.length;\n      setMsgIndex(next);\n      setVisibleMessages(prev => {\n        const updated = [...prev, conversation[next]];\n        return updated.length > 4 ? updated.slice(-4) : updated;\n      });\n    }, 2000);\n    return () => clearTimeout(timer);\n  }, [msgIndex]);\n\n  return (
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
              <div className="flex justify-center mb-6 group cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-indigo-500/30 text-sm cursor-pointer transition-all duration-300 hover:border-yellow-400/60 hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:bg-yellow-400/5 group">\n                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />\n                  <span className="group-hover:text-yellow-300 transition-colors duration-300">Now with AI-powered insights</span>\n                  <span className="brand-gradient-text font-semibold group-hover:text-yellow-400 transition-colors duration-300">→ Try free</span>\n                </div>
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
            <div className="relative mt-16 mx-auto max-w-4xl">
              <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
                {/* Mockup header bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50 bg-slate-900/80">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  <span className="ml-3 text-xs text-slate-500 font-mono">AURORA — Nexus Analytics</span>
                  <div className="ml-auto flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-green-400">Live</span>
                  </div>
                </div>
                {/* Mockup content */}
                <div className="p-6 bg-slate-950/90">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                      { label: 'Datasets', value: '1,247', color: 'text-indigo-400', delay: '0s' },
                      { label: 'Rows Analysed', value: '2.4M', color: 'text-cyan-400', delay: '0.2s' },
                      { label: 'AI Insights', value: '8,391', color: 'text-purple-400', delay: '0.4s' },
                    ].map((stat) => (
                      <div key={stat.label} className="glass rounded-lg p-4 animate-fadeInUp" style={{ animationDelay: stat.delay }}>
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  {/* AI Conversation */}\n                  <div className="glass rounded-lg p-4 mb-4 h-32 overflow-hidden relative">\n                    <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">\n                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />\n                      AURORA AI — Live\n                    </div>\n                    <div className="space-y-2 overflow-hidden">\n                      {visibleMessages.map((msg, i) => (\n                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeInUp`}>\n                          <div className={`px-3 py-1.5 rounded-lg text-xs max-w-[80%] ${\n                            msg.role === 'user'\n                              ? 'bg-indigo-600/40 text-indigo-200'\n                              : 'bg-slate-700/60 text-slate-300'\n                          }`}>\n                            {msg.role === 'ai' && <span className="text-cyan-400 font-semibold mr-1">AURORA:</span>}\n                            {msg.text}\n                          </div>\n                        </div>\n                      ))}\n                    </div>\n                  </div>
                  {/* Cycling Charts */}\n                  <div className="glass rounded-lg p-4">\n                    <div className="flex items-center justify-between mb-3">\n                      <div className="text-xs text-slate-500">Analytics Overview</div>\n                      <div className="flex gap-1">\n                        {['bar', 'line', 'pie'].map((t) => (\n                          <div key={t} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${chartType === t ? 'bg-indigo-400' : 'bg-slate-600'}`} />\n                        ))}\n                      </div>\n                    </div>\n                    {chartType === 'bar' && (\n                      <div className="flex items-end gap-1.5 h-16">\n                        {[65, 85, 45, 92, 70, 55, 88, 73].map((h, i) => (\n                          <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-indigo-600 to-cyan-400 opacity-80 transition-all duration-500"\n                            style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }} />\n                        ))}\n                      </div>\n                    )}\n                    {chartType === 'line' && (\n                      <svg viewBox="0 0 200 60" className="w-full h-16">\n                        <defs>\n                          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">\n                            <stop offset="0%" stopColor="#6366f1" />\n                            <stop offset="100%" stopColor="#06b6d4" />\n                          </linearGradient>\n                        </defs>\n                        <polyline points="0,50 25,35 50,40 75,20 100,30 125,15 150,25 175,10 200,20"\n                          fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />\n                        {[0,25,50,75,100,125,150,175,200].map((x, i) => {\n                          const ys = [50,35,40,20,30,15,25,10,20];\n                          return <circle key={i} cx={x} cy={ys[i]} r="3" fill="#06b6d4" opacity="0.8" />;\n                        })}\n                        <polyline points="0,50 25,35 50,40 75,20 100,30 125,15 150,25 175,10 200,20"\n                          fill="url(#lineGrad)" fillOpacity="0.1" stroke="none" />\n                      </svg>\n                    )}\n                    {chartType === 'pie' && (\n                      <div className="flex items-center gap-4 h-16">\n                        <svg viewBox="0 0 60 60" className="h-16 w-16 flex-shrink-0" style={{ transform: 'rotate(-90deg)' }}>\n                          <circle cx="30" cy="30" r="24" fill="none" stroke="#1e293b" strokeWidth="12" />\n                          <circle cx="30" cy="30" r="24" fill="none" stroke="#6366f1" strokeWidth="12"\n                            strokeDasharray="75 150" strokeDashoffset="0" />\n                          <circle cx="30" cy="30" r="24" fill="none" stroke="#06b6d4" strokeWidth="12"\n                            strokeDasharray="45 150" strokeDashoffset="-75" />\n                          <circle cx="30" cy="30" r="24" fill="none" stroke="#a855f7" strokeWidth="12"\n                            strokeDasharray="30 150" strokeDashoffset="-120" />\n                        </svg>\n                        <div className="flex flex-col gap-1 text-xs">\n                          {[['#6366f1','Revenue','50%'],['#06b6d4','Users','30%'],['#a855f7','Churn','20%']].map(([c,l,v]) => (\n                            <div key={l} className="flex items-center gap-1.5">\n                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c }} />\n                              <span className="text-slate-400">{l}</span>\n                              <span className="text-slate-300 font-medium ml-auto">{v}</span>\n                            </div>\n                          ))}\n                        </div>\n                      </div>\n                    )}\n                  </div>
                </div>
              </div>
              {/* Glow effect under the mockup */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-indigo-600/20 blur-2xl rounded-full" />
            </div>

          </div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────── */}
      <FadeInUp delay={0.4}>
        <div className="py-10 px-6 md:px-12 border-y border-slate-800/50">
          <div className="max-w-6xl mx-auto grid grid-cols-3 gap-8 text-center">
            {[
              { number: '10,000+', label: 'Datasets analysed' },
              { number: '500+', label: 'Teams worldwide' },
              { number: '99.9%', label: 'Uptime SLA' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl md:text-4xl font-bold brand-gradient-text mb-1">{stat.number}</div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </div>
            ))}
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
