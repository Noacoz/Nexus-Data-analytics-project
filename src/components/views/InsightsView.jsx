import React, { useEffect, useState } from 'react'
import ViewShell from '../ViewShell'
import API from '../../lib/api'

export default function InsightsView() {
  const [datasets, setDatasets] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const { datasets: list } = await API.getDatasets()
        setDatasets(list || [])
        if (list?.length) {
          const dataset = list[0]
          setSelectedId(dataset.id)
          const { insights: datasetInsights } = await API.getInsights(dataset.id)
          setInsights(datasetInsights || [])
        }
      } catch (err) {
        setError(err?.message || 'Unable to load insights')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  async function handleSelect(datasetId) {
    setSelectedId(datasetId)
    setLoading(true)
    try {
      const { insights: datasetInsights } = await API.getInsights(datasetId)
      setInsights(datasetInsights || [])
      setError(null)
    } catch (err) {
      setError(err?.message || 'Unable to load insights')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ViewShell
      title="Insights"
      subtitle="Review generated insights with confidence, evidence, and explanation from actual analytics computation."
    >
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="glass rounded-3xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Datasets</h2>
          {datasets.length === 0 && <p className="text-slate-400">No datasets found. Upload a dataset to generate insights.</p>}
          <div className="space-y-3">
            {datasets.map((dataset) => (
              <button
                key={dataset.id}
                onClick={() => handleSelect(dataset.id)}
                className={`w-full text-left rounded-2xl p-4 transition ${selectedId === dataset.id ? 'bg-violet-600/20 border border-violet-500/30 text-white' : 'bg-white/5 border border-white/5 text-slate-300'}`}
              >
                <div className="font-semibold">{dataset.name}</div>
                <div className="text-xs text-slate-500">{dataset.status || 'unknown'} · {dataset.row_count || 0} rows</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {error && <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200">{error}</div>}
          <div className="glass rounded-3xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-2">Insight ledger</h2>
            <p className="text-slate-400">These insights are served directly from the backend analytics pipeline.</p>
          </div>

          {loading ? (
            <div className="glass rounded-3xl border border-white/10 p-6 text-slate-400">Loading insights…</div>
          ) : insights.length === 0 ? (
            <div className="glass rounded-3xl border border-white/10 p-6 text-slate-400">No computed insights are available for the selected dataset.</div>
          ) : (
            <div className="grid gap-4">
              {insights.map((insight) => (
                <div key={insight.id} className="glass rounded-3xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{insight.type}</span>
                      <h3 className="text-2xl font-semibold text-white mt-2">{insight.title}</h3>
                    </div>
                    <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-300">{(insight.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-slate-400 mb-4">{insight.description}</p>
                  <div className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-300 border border-white/10">
                    <p className="font-semibold text-slate-300">Evidence</p>
                    <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-400">{JSON.stringify(insight.evidence, null, 2)}</pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ViewShell>
  )
}
