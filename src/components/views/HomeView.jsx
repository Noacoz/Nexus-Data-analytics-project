import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const SYSTEM_SEQUENCE = [
  { role: 'ai', text: 'Good morning, Noah. Initiating Aurora briefing for Q1 revenue and performance.' },
  { role: 'ai', text: 'Scanning live datasets now... I am analyzing revenue, user growth, and operational velocity.' },
  { role: 'ai', text: 'Revenue rose 31% month-over-month with a strong rebound in enterprise renewals.' },
  { role: 'ai', text: 'Asia Pacific is underperforming by 18% versus target, while North America remains ahead of plan.' },
  { role: 'ai', text: 'I recommend prioritizing pricing adjustments and retention campaigns for Q2.' }
];

const VIEW_KEYWORDS = [
  { regex: /revenue/i, view: 'revenue' },
  { regex: /users|growth/i, view: 'metrics' },
  { regex: /fix|recommend/i, view: 'status' }
];

const bubbleVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 150, damping: 18 } }
};

const statusVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const chartPathVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1, transition: { duration: 1, ease: 'easeOut' } }
};

const commandOptions = [
  { title: 'System Briefing', view: 'status', description: 'Aurora starts the analysis flow.' },
  { title: 'Revenue Pulse', view: 'revenue', description: 'Review top-line momentum and targets.' },
  { title: 'User Metrics', view: 'metrics', description: 'Inspect adoption and retention trends.' }
];

const StatusView = ({ agentState }) => (
  <motion.div
    key="status"
    variants={statusVariants}
    initial="hidden"
    animate="visible"
    exit="hidden"
    className="relative rounded-3xl border border-white/10 bg-slate-950/70 p-6 min-h-[350px] overflow-hidden"
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.18),_transparent_28%)]" />
    <div className="relative z-10 flex items-center gap-3 mb-6">
      <div className="w-12 h-12 rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center justify-center text-2xl text-white">⚡</div>
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-violet-300/80">Live analysis</p>
        <h3 className="text-2xl font-semibold text-white">{agentState}</h3>
      </div>
    </div>

    <div className="flex flex-col gap-4">
      <div className="rounded-3xl bg-slate-900/70 border border-white/5 p-4 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
        <p className="text-slate-400 text-sm">Aurora is proactively scanning your dataset for anomalies, revenue momentum, and customer health signals.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {['Revenue', 'Users', 'Retention', 'APAC'].map((label, idx) => (
          <div key={idx} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-center">
            <p className="text-3xl font-semibold text-white">{idx === 0 ? '31%' : idx === 1 ? '+18%' : idx === 2 ? '92.8%' : '-18%'}</p>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mt-2">{label}</p>
          </div>
        ))}
      </div>
      <div className="relative rounded-3xl bg-slate-900/80 border border-violet-500/10 p-4">
        <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
        <p className="text-slate-300 text-sm">Aurora’s glass overlay is active while the system interprets results and surfaces the most urgent opportunities.</p>
      </div>
    </div>
  </motion.div>
);

const RevenueView = () => (
  <motion.div
    key="revenue"
    variants={statusVariants}
    initial="hidden"
    animate="visible"
    exit="hidden"
    className="relative rounded-3xl border border-white/10 bg-slate-950/70 p-6 min-h-[350px] overflow-hidden"
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(168,85,247,0.14),_transparent_30%)]" />
    <div className="relative z-10 flex items-center gap-3 mb-6">
      <div className="w-12 h-12 rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center justify-center text-2xl text-white">💠</div>
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-violet-300/80">Revenue View</p>
        <h3 className="text-2xl font-semibold text-white">Donut chart live draw</h3>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-center">
      <div className="relative w-full max-w-[220px] mx-auto">
        <svg viewBox="0 0 120 120" className="w-full h-auto">
          <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="18" />
          <motion.circle
            cx="60"
            cy="60"
            r="44"
            fill="none"
            stroke="#A855F7"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray="276"
            strokeDashoffset="0"
            variants={chartPathVariants}
            initial="hidden"
            animate="visible"
          />
          <motion.circle
            cx="60"
            cy="60"
            r="34"
            fill="transparent"
            stroke="#4F46E5"
            strokeWidth="8"
            strokeDasharray="213"
            strokeDashoffset="0"
            variants={chartPathVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />
          <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="text-white" fontSize="18" fill="#FFFFFF">Q1</text>
        </svg>
      </div>
      <div className="space-y-4">
        {[
          { label: 'Total Revenue', value: '$2.4M', accent: '#A855F7' },
          { label: 'Growth vs prior', value: '+31%', accent: '#4F46E5' },
          { label: 'Active Deals', value: '142', accent: '#8B5CF6' }
        ].map((item) => (
          <div key={item.label} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
            <p className="text-sm text-slate-400 uppercase tracking-[0.3em]">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold" style={{ color: item.accent }}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

const MetricsView = () => {
  const metrics = [
    { label: 'New Users', value: 72, accent: '#A855F7' },
    { label: 'Retention', value: 84, accent: '#4F46E5' },
    { label: 'Churn', value: 12, accent: '#C084FC' }
  ];

  return (
    <motion.div
      key="metrics"
      variants={statusVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="relative rounded-3xl border border-white/10 bg-slate-950/70 p-6 min-h-[350px] overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(79,70,229,0.15),_transparent_30%)]" />
      <div className="relative z-10 flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center justify-center text-2xl text-white">📈</div>
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-violet-300/80">Metrics Stage</p>
          <h3 className="text-2xl font-semibold text-white">Glowing adoption chart</h3>
        </div>
      </div>
      <div className="grid gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            className="rounded-3xl border border-white/10 bg-slate-900/80 p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 150, damping: 18 }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm uppercase tracking-[0.25em] text-slate-500">{metric.label}</span>
              <span className="text-lg font-semibold" style={{ color: metric.accent }}>{metric.value}%</span>
            </div>
            <div className="mt-4 h-4 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: metric.value / 100 }}
                style={{ transformOrigin: 'left' }}
                transition={{ type: 'spring', stiffness: 150, damping: 18, duration: 0.9 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const HomeView = ({ onExplore, onGetStarted }) => {
  const [messages, setMessages] = useState([SYSTEM_SEQUENCE[0]]);
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [activeDisplay, setActiveDisplay] = useState('status');
  const [agentState, setAgentState] = useState('Initializing');

  useEffect(() => {
    if (sequenceIndex === SYSTEM_SEQUENCE.length - 1) {
      setIsTyping(false);
      return;
    }

    const controlTimer = setTimeout(() => {
      setAgentState('Scanning');
      const typingTimer = setTimeout(() => {
        const nextIndex = sequenceIndex + 1;
        setMessages((prev) => [...prev, SYSTEM_SEQUENCE[nextIndex]]);
        setSequenceIndex(nextIndex);
        setIsTyping(false);
      }, 900);

      return () => clearTimeout(typingTimer);
    }, 1600);

    return () => clearTimeout(controlTimer);
  }, [sequenceIndex]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1]?.text ?? '';
    const matched = VIEW_KEYWORDS.find((item) => item.regex.test(lastMessage));
    setActiveDisplay(matched?.view ?? 'status');
    if (/scanning|briefing|recommend/i.test(lastMessage)) {
      setAgentState('Scanning');
    } else {
      setAgentState('Reviewing');
    }
  }, [messages]);

  const handleViewChange = (view) => {
    setActiveDisplay(view);
    setAgentState(view === 'status' ? 'Scanning' : 'Reviewing');
  };

  return (
    <section className="relative min-h-screen bg-slate-950/90 text-slate-100 overflow-hidden py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.18),_transparent_30%)]" />
      <div className="absolute -top-24 left-1/2 w-[420px] h-[420px] rounded-full bg-[#A855F7]/10 blur-3xl opacity-60" />
      <div className="relative z-10 mx-auto max-w-[1600px] px-4">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-violet-300/80">Aurora AI Agent</p>
            <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Dual-Canvas Intelligence for Autonomous Decisions</h1>
            <p className="mt-4 max-w-2xl text-slate-400">A proactive analytics interface built for executive workflows. Aurora begins briefing instantly and animates insights as it speaks.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={onGetStarted} className="rounded-2xl bg-[#A855F7] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] transition hover:bg-[#c084fc]">Launch Briefing</button>
            <button onClick={onExplore} className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-violet-300 hover:text-white">Request Demo</button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
          <aside className="sticky top-6 rounded-[32px] border border-white/10 bg-slate-950/60 backdrop-blur-2xl p-6 shadow-[0_0_15px_rgba(168,85,247,0.18)]">
            <div className="mb-6 flex items-center gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-[0_0_15px_rgba(168,85,247,0.12)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[#A855F7]/15 text-2xl text-[#A855F7] shadow-[0_0_15px_rgba(168,85,247,0.2)]">A</div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-violet-300/80">Command Stream</p>
                <p className="mt-1 text-white font-semibold">Live AI briefing</p>
              </div>
            </div>

            <div className="mb-6 rounded-3xl border border-white/10 bg-slate-900/75 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Status</p>
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-200">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#A855F7] animate-pulse" />
                <span>Autonomous briefing engaged</span>
              </div>
            </div>

            <div className="space-y-4">
              {messages.slice(-5).map((message, index) => (
                <motion.div
                  key={`${message.text}-${index}`}
                  initial="hidden"
                  animate="visible"
                  variants={bubbleVariants}
                  className={`rounded-3xl p-4 text-sm shadow-[0_0_15px_rgba(168,85,247,0.12)] ${message.role === 'ai' ? 'bg-slate-900/85 text-slate-100' : 'bg-[#4F46E5]/20 text-indigo-100 self-end'}`}
                >
                  <p className={`whitespace-pre-line ${message.role === 'ai' ? 'text-slate-100' : 'text-indigo-100'}`}>{message.text}</p>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-3xl bg-slate-900/85 p-4 text-sm text-slate-300"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-400 animate-bounce" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-400 animate-bounce delay-150" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-400 animate-bounce delay-300" />
                    <span>Composing insight...</span>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Control Panel</p>
              <div className="mt-4 space-y-3">
                {commandOptions.map((option) => (
                  <button
                    key={option.view}
                    onClick={() => handleViewChange(option.view)}
                    className={`group flex w-full items-center justify-between rounded-3xl border px-4 py-3 text-left transition ${activeDisplay === option.view ? 'border-[#A855F7] bg-[#A855F7]/10 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'border-white/10 bg-slate-950/80 hover:border-violet-400/40 hover:bg-slate-900/80'}`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{option.title}</p>
                      <p className="text-xs text-slate-500">{option.description}</p>
                    </div>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-[#A855F7] transition group-hover:scale-110 group-hover:brightness-125">→</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main className="rounded-[32px] border border-white/10 bg-slate-950/60 backdrop-blur-2xl p-6 shadow-[0_0_15px_rgba(168,85,247,0.18)]">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-violet-300/80">Insight Stage</p>
                <h2 className="text-3xl font-semibold text-white">High-Fidelity Dashboard</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#A855F7] animate-pulse" />
                <span>{agentState}</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeDisplay === 'status' && <StatusView agentState={agentState} />}
              {activeDisplay === 'revenue' && <RevenueView />}
              {activeDisplay === 'metrics' && <MetricsView />}
            </AnimatePresence>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Live throughput', value: '4.2k req/s', accent: '#A855F7' },
                { label: 'Decision velocity', value: '18ms', accent: '#4F46E5' },
                { label: 'Signal confidence', value: '97%', accent: '#8B5CF6' }
              ].map((metric) => (
                <div key={metric.label} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
                  <p className="mt-3 text-2xl font-semibold" style={{ color: metric.accent }}>{metric.value}</p>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </section>
  );
};

export default HomeView;

