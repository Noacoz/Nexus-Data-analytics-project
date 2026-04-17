import { useState } from "react";
import DataUpload from "./DataUpload";
import InsightCard from "./InsightCard";
import StatisticalSnapshot from "./StatisticalSnapshot";
import ConversationalAnalyst from "./ConversationalAnalyst";
import HypothesisPanel from "./HypothesisPanel";
import ExecutiveSummary from "./ExecutiveSummary";
import AlertFeed from "./AlertFeed";
import { useDataset } from "../hooks/useDataset";

export function Dashboard({ userId }) {
  const { dataset, insights, snapshot, loading, error, upload, loadDataset } = useDataset();
  const [activeTab, setActiveTab] = useState("upload");

  const stats = [
    { label: "Total Rows", value: dataset?.row_count?.toLocaleString() || "—", icon: "📊", trend: "+12%", trendUp: true },
    { label: "Columns", value: snapshot?.column_count || "—", icon: "🔢", trend: "—", trendUp: null },
    { label: "Quality Score", value: snapshot?.data_quality?.overall_score ? `${(snapshot.data_quality.overall_score * 100).toFixed(0)}%` : "—", icon: "✨", trend: "High", trendUp: true },
    { label: "Insights", value: insights.length, icon: "💡", trend: `${insights.length} found`, trendUp: true },
  ];

  return (
    <div className="min-h-screen bg-[#09090B]">
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
            Nexus Analytics
          </h1>
          <p className="text-zinc-400 mt-1">AI-Powered Decision Intelligence</p>
          {dataset && (
            <div className="mt-4 p-4 bg-violet-500/5 border border-violet-500/20 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white font-bold">
                  {dataset.name?.charAt(0) || "D"}
                </div>
                <div>
                  <p className="font-semibold text-white">{dataset.name}</p>
                  <p className="text-sm text-zinc-400">{dataset.row_count?.toLocaleString()} rows • {dataset.status}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {!dataset ? (
          <div className="max-w-2xl mx-auto">
            <div className="glass rounded-2xl p-8">
              <DataUpload userId={userId} onUploadComplete={(datasetId) => loadDataset(datasetId)} />
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, i) => (
                <div key={i} className="glass rounded-xl p-5 border border-white/5 hover:border-violet-500/30 transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{stat.icon}</span>
                    {stat.trendUp !== null && (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.trendUp ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/30'}`}>
                        {stat.trend}
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-white mt-3 tracking-tight">{stat.value}</p>
                  <p className="text-sm text-zinc-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mb-6 flex flex-wrap gap-1 p-1 glass rounded-2xl border border-white/5">
              {[
                { id: "insights", label: "Insights", icon: "💡", count: insights.length },
                { id: "statistics", label: "Statistics", icon: "📊" },
                { id: "chat", label: "AI Chat", icon: "🤖" },
                { id: "hypothesize", label: "Hypotheses", icon: "🔍" },
                { id: "summary", label: "Summary", icon: "📋" },
                { id: "alerts", label: "Alerts", icon: "🚨" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-900/30"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                  {tab.count !== undefined && activeTab === tab.id && (
                    <span className="ml-1 bg-white/20 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              {activeTab === "insights" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-white mb-4">Key Insights</h2>
                  {insights.length === 0 ? (
                    <div className="glass rounded-xl p-12 text-center border border-white/5">
                      <p className="text-zinc-400">No insights yet. Analysis in progress...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {insights.map((insight) => (
                        <InsightCard key={insight.id} insight={insight} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "statistics" && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Statistical Analysis</h2>
                  <StatisticalSnapshot snapshot={snapshot} />
                </div>
              )}

              {activeTab === "chat" && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">AI Conversational Analyst</h2>
                  <div className="glass rounded-xl border border-white/5 overflow-hidden h-[500px]">
                    <ConversationalAnalyst datasetId={dataset.id} userId={userId} />
                  </div>
                </div>
              )}

              {activeTab === "hypothesize" && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Hypothesis Explorer</h2>
                  <div className="glass rounded-xl border border-white/5 p-6">
                    <HypothesisPanel datasetId={dataset.id} />
                  </div>
                </div>
              )}

              {activeTab === "summary" && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Executive Summary</h2>
                  <div className="glass rounded-xl border border-white/5 p-6">
                    <ExecutiveSummary datasetId={dataset.id} />
                  </div>
                </div>
              )}

              {activeTab === "alerts" && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Monitoring Alerts</h2>
                  <div className="glass rounded-xl border border-white/5 p-6">
                    <AlertFeed userId={userId} />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {error && (
        <div className="fixed bottom-6 right-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 backdrop-blur-xl">
          {error}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
