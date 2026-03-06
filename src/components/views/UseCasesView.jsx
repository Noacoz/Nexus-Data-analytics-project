import React from 'react';
import { FadeInUp, TiltCard, SpotlightCard } from '../Shared';

const UseCasesView = ({ setCurrentView }) => {
  const cases = [
    {
      role: 'Marketing Manager',
      emoji: '📣',
      color: 'linear-gradient(135deg, #a855f7, #ec4899)',
      pain: 'You spend half your week pulling campaign numbers from five different platforms into a spreadsheet nobody trusts.',
      solution: 'Connect all your sources once. Nexus auto-builds your campaign ROI dashboard and flags underperforming channels before budget is wasted.',
      metrics: ['Campaign ROI by channel', 'Customer acquisition cost', 'Conversion funnel analysis'],
    },
    {
      role: 'Operations Lead',
      emoji: '⚙️',
      color: 'linear-gradient(135deg, #f97316, #eab308)',
      pain: 'By the time your weekly ops report is ready, the data is already three days old and the problem has gotten worse.',
      solution: 'Live dashboards that update automatically. Anomaly alerts fire the moment something goes off-track — not three days later.',
      metrics: ['Supply chain bottleneck detection', 'SLA compliance tracking', 'Cost per unit over time'],
    },
    {
      role: 'Startup Founder',
      emoji: '🚀',
      color: 'linear-gradient(135deg, #6366f1, #06b6d4)',
      pain: "Your investors want metrics. Your analyst is busy. You're manually copying numbers into slides at 11pm before a board meeting.",
      solution: 'Investor-ready dashboards in one click. MRR, churn, growth rate, runway — all in one place, always up to date.',
      metrics: ['MRR and ARR growth', 'Churn rate and cohort analysis', 'Burn rate and runway'],
    },
    {
      role: 'Agency & Consultant',
      emoji: '💼',
      color: 'linear-gradient(135deg, #10b981, #3b82f6)',
      pain: "Client reports take your team a full day to produce. Half that time is formatting, not analysing.",
      solution: 'White-label reports built in minutes. Share a live dashboard link with clients. Look like a 20-person data team even if you are a team of two.',
      metrics: ['Client performance reporting', 'Multi-account dashboard management', 'Branded PDF exports'],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 py-20 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <FadeInUp delay={0.2}>
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Built for how your team{' '}
              <span className="brand-gradient-text">actually works</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Nexus Analytics adapts to your role, your industry, and your specific data challenges.
            </p>
          </div>
        </FadeInUp>

        {/* Use case cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {cases.map((item, index) => (
            <FadeInUp key={index} delay={0.3 + index * 0.15}>
              <TiltCard intensity={8}>
                <SpotlightCard className="glass rounded-2xl p-8 h-full">
                  {/* Icon + Role */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: item.color }}>
                      {item.emoji}
                    </div>
                    <h2 className="text-xl font-bold">{item.role}</h2>
                  </div>

                  {/* Pain point */}
                  <div className="mb-4 p-4 rounded-xl bg-slate-800 border-l-4 border-red-500">
                    <p className="text-sm text-slate-400 font-medium mb-1 uppercase tracking-wide">The problem</p>
                    <p className="text-slate-300 text-sm">{item.pain}</p>
                  </div>

                  {/* Solution */}
                  <div className="mb-6 p-4 rounded-xl bg-slate-800 border-l-4 border-cyan-400">
                    <p className="text-sm text-cyan-400 font-medium mb-1 uppercase tracking-wide">Nexus solution</p>
                    <p className="text-slate-300 text-sm">{item.solution}</p>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-2">
                    {item.metrics.map((metric, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-400">
                        <span className="text-cyan-400">✓</span>
                        {metric}
                      </div>
                    ))}
                  </div>
                </SpotlightCard>
              </TiltCard>
            </FadeInUp>
          ))}
        </div>

        {/* CTA */}
        <FadeInUp delay={0.8}>
          <div className="glass rounded-2xl p-12 text-center"
            style={{ border: '1px solid rgba(99,102,241,0.3)' }}>
            <h2 className="text-3xl font-bold mb-4">Ready to see it work for your team?</h2>
            <p className="text-slate-400 mb-8 text-lg max-w-xl mx-auto">
              Start free. No credit card. Your first insight in under 30 minutes.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <TiltCard intensity={8}>
                <button
                  className="px-8 py-3 brand-gradient text-white rounded-lg font-medium hover:opacity-90 transition-all"
                  onClick={() => setCurrentView('pricing')}
                >
                  Start free trial
                </button>
              </TiltCard>
              <TiltCard intensity={8}>
                <button
                  className="px-8 py-3 glass text-slate-300 rounded-lg font-medium hover:text-white transition-all"
                  onClick={() => setCurrentView('contact')}
                >
                  Talk to our team
                </button>
              </TiltCard>
            </div>
          </div>
        </FadeInUp>

      </div>
    </div>
  );
};

export default UseCasesView;
