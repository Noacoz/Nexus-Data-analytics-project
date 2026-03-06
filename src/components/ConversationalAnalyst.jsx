/**
 * ConversationalAnalyst Component
 * AI chatbot with memory and reasoning display
 */

import { useState, useRef, useEffect } from "react";
import { useChat } from "../hooks/useChat";
import { formatDate } from "../lib/formatting";

export function ConversationalAnalyst({ datasetId, userId }) {
  const { messages, sessionId, loading, error, send, clear } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const [showReasoning, setShowReasoning] = useState(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const text = input;
    setInput("");

    try {
      await send(text, datasetId, userId);
    } catch (err) {
      console.error("Send failed:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Conversational Analyst
          </h3>
          {datasetId && (
            <p className="text-sm text-gray-600">
              Analyzing dataset • Session ID: {sessionId?.slice(0, 8)}...
            </p>
          )}
        </div>
        {messages.length > 0 && (
          <button
            onClick={clear}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <p className="text-gray-600 mb-2">No messages yet</p>
              <p className="text-sm text-gray-500">
                Ask questions about your dataset and I'll help analyze it
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-md px-4 py-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {msg.role === "assistant" && msg.clarification_needed && (
                  <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    ⚠️ {msg.clarification_needed}
                  </div>
                )}

                <p className="text-sm leading-relaxed mb-2">{msg.content}</p>

                {msg.role === "assistant" && msg.reasoning_used && (
                  <>
                    <button
                      onClick={() =>
                        setShowReasoning(
                          showReasoning === msg.id ? null : msg.id
                        )
                      }
                      className={`text-xs font-medium mt-2 ${
                        msg.role === "user" ? "text-blue-100" : "text-blue-600"
                      } hover:underline`}
                    >
                      {showReasoning === msg.id
                        ? "▼ Hide reasoning"
                        : "▶ Show reasoning"}
                    </button>

                    {showReasoning === msg.id && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                        <p className="font-semibold mb-1">Reasoning:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {msg.reasoning_used.data_referenced?.map(
                            (ref, idx) => (
                              <li key={idx}>{ref}</li>
                            )
                          )}
                        </ul>
                        <p className="mt-2">
                          Confidence: {(msg.reasoning_used.confidence_applied * 100).toFixed(0)}%
                        </p>
                      </div>
                    )}
                  </>
                )}

                {msg.role === "assistant" && msg.suggested_followup && (
                  <button
                    onClick={() => {
                      setInput(msg.suggested_followup);
                    }}
                    className={`text-xs font-medium mt-2 px-2 py-1 rounded ${
                      msg.role === "user"
                        ? "bg-blue-500 text-blue-100 hover:bg-blue-400"
                        : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                    }`}
                  >
                    💡 {msg.suggested_followup}
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-3 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            Error: {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-200">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your data..."
            disabled={loading || !datasetId}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || !datasetId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Shift+Enter for newline • Results based on computed statistics
        </p>
      </form>
    </div>
  );
}

export default ConversationalAnalyst;
