import React, { useEffect, useState } from 'react'
import API from '../../lib/api'

export default function ReportsView({ setCurrentView }) {
  const [datasets, setDatasets] = useState([])
  const [insights, setInsights] = useState([])
  const [selectedDataset, setSelectedDataset] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { datasets: list } = await API.getDatasets()
        setDatasets(list || [])
        if (list?.length) {
          setSelectedDataset(list[0])
          const { insights: datasetInsights } = await API.getInsights(list[0].id)
          setInsights(datasetInsights || [])
        }
      } catch (err) {
        setError(err?.message || 'Unable to load reports')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function selectDataset(dataset) {
    setSelectedDataset(dataset)
    setLoading(true)
    try {
      const { insights: datasetInsights } = await API.getInsights(dataset.id)
      setInsights(datasetInsights || [])
    } catch (err) {
      setError(err?.message || 'Unable to load insights')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#09090B] p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button onClick={() => setCurrentView('dashboard')} className="text-zinc-400 hover:text-white mb-2">← Back</button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Reports</h1>
          <p className="text-slate-400 mt-2">Structured analytics reports generated from actual dataset computation.</p>
        </div>
      </div>

      {error && <div className="mb-6 rounded-3xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="glass rounded-3xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Datasets</h2>
          {loading && <p className="text-slate-400">Loading datasets…</p>}
          {!loading && datasets.length === 0 && <p className="text-slate-400">No datasets available. Upload a dataset to generate real insights.</p>}
          <div className="space-y-3">
            {datasets.map((dataset) => (
              <button
                key={dataset.id}
                onClick={() => selectDataset(dataset)}
                className={`w-full text-left rounded-2xl p-4 transition ${selectedDataset?.id === dataset.id ? 'bg-violet-600/20 border border-violet-500/30 text-white' : 'bg-white/5 border border-white/5 text-slate-300'}`}
              >
                <div className="font-semibold">{dataset.name}</div>
                <div className="text-xs text-slate-500">{dataset.status || 'unknown'} · {dataset.row_count || 0} rows</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-3xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-2">{selectedDataset ? selectedDataset.name : 'Select a dataset'}</h2>
            <p className="text-slate-400">Insights shown below are computed from the dataset stored in the analytics engine.</p>
          </div>

          {loading ? (
            <div className="glass rounded-3xl border border-white/10 p-6 text-slate-400">Loading insights…</div>
          ) : insights.length === 0 ? (
            <div className="glass rounded-3xl border border-white/10 p-6 text-slate-400">No structured insights found for this dataset. Ensure analysis completed successfully.</div>
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
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-300 border border-white/10">
                      <p className="font-semibold text-slate-300">Evidence</p>
                      <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-400">{JSON.stringify(insight.evidence, null, 2)}</pre>
                    </div>
                    <div className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-300 border border-white/10">
                      <p className="font-semibold text-slate-300">Created</p>
                      <p className="mt-2 text-sm text-slate-400">{new Date(insight.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
