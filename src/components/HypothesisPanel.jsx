/**
 * HypothesisPanel Component
 * Rank competing explanations for dataset patterns
 */

import { useState } from "react";
import { hypothesize } from "../lib/nexus-api";

export function HypothesisPanel({ datasetId }) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleHypothesize = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await hypothesize(datasetId, question);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Causal Hypothesis Explorer
      </h3>

      {/* Question Input */}
      <form onSubmit={handleHypothesize} className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Why is... ? What causes... ? Is there a relationship between... ?"
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400"
          >
            {loading ? "Analyzing..." : "Explore"}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800 mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Question Interpretation */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded">
            <p className="text-sm font-semibold text-purple-900">
              Question Interpreted:
            </p>
            <p className="text-sm text-purple-800 mt-1">
              {result.question_interpreted}
            </p>
          </div>

          {/* Most Likely Explanation */}
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-sm font-semibold text-green-900 mb-2">
              Most Likely Explanation
            </p>
            <p className="text-sm text-green-800">{result.most_likely_explanation}</p>
          </div>

          {/* Ranked Hypotheses */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">
              Ranked Hypotheses
            </h4>
            <div className="space-y-3">
              {result.hypotheses?.map((h) => (
                <div key={h.rank} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        #{h.rank}: {h.hypothesis}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Confidence: {(h.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">
                        {(h.probability_weight * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-600">likely</p>
                    </div>
                  </div>

                  {/* Probability Bar */}
                  <div className="mb-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-600 h-full transition-all"
                      style={{ width: `${h.probability_weight * 100}%` }}
                    ></div>
                  </div>

                  {/* Evidence */}
                  {h.evidence_supporting?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-green-700 mb-1">
                        ✓ Supporting Evidence
                      </p>
                      <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                        {h.evidence_supporting.map((e, idx) => (
                          <li key={idx}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {h.evidence_against?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-red-700 mb-1">
                        ✗ Contradicting Evidence
                      </p>
                      <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                        {h.evidence_against.map((e, idx) => (
                          <li key={idx}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {h.testable_with && (
                    <div className="mt-3 p-2 bg-blue-50 rounded">
                      <p className="text-xs font-semibold text-blue-900">
                        How to test: {h.testable_with}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Data Insufficient For */}
          {result.data_insufficient_for?.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded">
              <p className="text-sm font-semibold text-amber-900 mb-2">
                ⚠️ Insufficient Data For:
              </p>
              <ul className="text-sm text-amber-800 list-disc list-inside space-y-1">
                {result.data_insufficient_for.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Investigation */}
          {result.recommended_investigation && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                Recommended Investigation:
              </p>
              <p className="text-sm text-blue-800">
                {result.recommended_investigation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default HypothesisPanel;
