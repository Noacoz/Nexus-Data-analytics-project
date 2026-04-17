import React from 'react'
import ViewShell from '../ViewShell'

export default function DataExplorerView() {
  return (
    <ViewShell
      title="Data Explorer"
      subtitle="Inspect table previews, column statistics, and filtering controls in one place."
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass rounded-3xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-slate-500">Preview dataset</p>
              <h2 className="text-2xl font-semibold text-white">Sample table preview</h2>
            </div>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Dataset-aware</span>
          </div>
          <div className="overflow-hidden rounded-3xl border border-white/10">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-0 bg-slate-900/90 text-slate-400 text-xs uppercase tracking-[0.2em] p-4">
              {['Column', 'Type', 'Nulls', 'Unique'].map(header => <div key={header} className="font-semibold">{header}</div>)}
            </div>
            <div className="divide-y divide-white/5 bg-slate-950/90">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-0 px-4 py-4 text-sm text-slate-300">
                  <span>column_{idx + 1}</span>
                  <span>string</span>
                  <span>3%</span>
                  <span>12</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-3xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Column statistics</h3>
            <div className="grid gap-4">
              {['Average length', 'Distinct values', 'Missing rate'].map((stat, index) => (
                <div key={index} className="rounded-3xl bg-slate-900/80 border border-white/10 p-4">
                  <p className="text-sm text-slate-500">{stat}</p>
                  <p className="mt-2 text-xl font-semibold text-white">{index === 0 ? '24.8' : index === 1 ? '72%' : '3.4%'}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Filters</h3>
              <span className="text-xs text-slate-500 uppercase tracking-[0.2em]">Draft</span>
            </div>
            <div className="space-y-4">
              {['Status', 'Region', 'Category'].map((filter, index) => (
                <div key={index} className="rounded-3xl bg-slate-900/80 p-4 border border-white/10">
                  <p className="text-sm text-slate-400">{filter}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {['Any', 'Active', 'Pending', 'Archived'].slice(0, 2).map(option => (
                      <button key={option} className="rounded-2xl border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition-all">{option}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ViewShell>
  )
}
