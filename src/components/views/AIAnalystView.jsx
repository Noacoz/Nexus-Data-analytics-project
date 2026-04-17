import React from 'react'
import ViewShell from '../ViewShell'

export default function AIAnalystView() {
  return (
    <ViewShell
      title="AI Analyst"
      subtitle="Interact with a dataset-aware AI assistant for fast analysis and exploratory guidance."
    >
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="glass rounded-3xl border border-white/10 p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-400">Current dataset</p>
              <h2 className="text-2xl font-semibold text-white">Customer Churn Insights</h2>
            </div>
            <span className="rounded-full bg-slate-900/80 px-4 py-2 text-sm text-slate-300 border border-white/10">Dataset-aware</span>
          </div>
          <div className="rounded-3xl bg-slate-900/80 border border-white/10 p-5 min-h-[420px]">
            <div className="flex h-full flex-col justify-between gap-4">
              <div className="space-y-4 overflow-y-auto pr-1">
                {['Welcome back! Ask me about this dataset, key trends, or correlation signals.', 'How does feature engagement impact retention?', 'Show me anomalies in the latest month.'].map((message, idx) => (
                  <div key={idx} className={`rounded-3xl p-4 ${idx % 2 === 0 ? 'bg-slate-950/90 text-slate-200' : 'bg-slate-900/80 text-slate-300'}`}>
                    <p className="text-sm">{message}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <textarea
                  rows={3}
                  placeholder="Ask a question about the data..."
                  className="w-full resize-none rounded-3xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-slate-100 outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Placeholder conversational UI</span>
                  <button className="rounded-3xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:from-violet-700 hover:to-cyan-700 transition-all">Send</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-3xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">AI assistant status</h3>
            <div className="space-y-4">
              {['Dataset connection active', 'Context window ready', 'Response latency optimized'].map((line, idx) => (
                <div key={idx} className="rounded-3xl bg-slate-900/80 p-4 border border-white/10 text-slate-300">{line}</div>
              ))}
            </div>
          </div>
          <div className="glass rounded-3xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Suggested prompts</h3>
            <div className="grid gap-3">
              {['What are the top 3 drivers of churn?', 'Summarize the most anomalous segments.', 'Compare last quarter to this quarter.'].map((prompt, idx) => (
                <button key={idx} className="rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/5 transition-all">{prompt}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ViewShell>
  )
}
