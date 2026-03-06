/**
 * Dashboard Component
 * Main layout that orchestrates all views
 */

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
  const {
    dataset,
    insights,
    snapshot,
    loading,
    error,
    upload,
    loadDataset,
  } = useDataset();

  const [activeTab, setActiveTab] = useState("upload"); // upload | insights | statistics | chat | hypothesize | summary | alerts

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Nexus Analytics</h1>
          <p className="text-gray-600 mt-1">
            AI-Powered Decision Intelligence Platform
          </p>
          {dataset && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-900">
                📊 <strong>{dataset.name}</strong> • {dataset.row_count?.toLocaleString()} rows • Status: <strong>{dataset.status}</strong>
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {!dataset ? (
          // No dataset - show upload
          <div className="max-w-2xl mx-auto">
            <DataUpload
              userId={userId}
              onUploadComplete={(datasetId) => {
                loadDataset(datasetId);
              }}
            />
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-4">
              {[
                { id: "insights", label: "💡 Insights", count: insights.length },
                { id: "statistics", label: "📊 Statistics" },
                { id: "chat", label: "💬 Chat" },
                { id: "hypothesize", label: "🔍 Hypothesize" },
                { id: "summary", label: "📋 Summary" },
                { id: "alerts", label: "🚨 Alerts" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-2 bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs font-bold">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {/* Insights Tab */}
              {activeTab === "insights" && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900">Insights</h2>
                  {insights.length === 0 ? (
                    <p className="text-gray-600">No insights yet. Make sure analysis is complete.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {insights.map((insight) => (
                        <InsightCard key={insight.id} insight={insight} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Statistics Tab */}
              {activeTab === "statistics" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Statistical Analysis
                  </h2>
                  <StatisticalSnapshot snapshot={snapshot} />
                </div>
              )}

              {/* Chat Tab */}
              {activeTab === "chat" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Conversational Analysis
                  </h2>
                  <div className="h-96">
                    <ConversationalAnalyst datasetId={dataset.id} userId={userId} />
                  </div>
                </div>
              )}

              {/* Hypothesize Tab */}
              {activeTab === "hypothesize" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Hypothesis Explorer
                  </h2>
                  <HypothesisPanel datasetId={dataset.id} />
                </div>
              )}

              {/* Summary Tab */}
              {activeTab === "summary" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Executive Summary
                  </h2>
                  <ExecutiveSummary datasetId={dataset.id} />
                </div>
              )}

              {/* Alerts Tab */}
              {activeTab === "alerts" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Monitoring Alerts
                  </h2>
                  <AlertFeed userId={userId} />
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Global Error */}
      {error && (
        <div className="fixed bottom-4 right-4 p-4 bg-red-600 text-white rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
