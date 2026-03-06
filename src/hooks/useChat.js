/**
 * useChat Hook
 * Manages chat session and message state
 */

import { useState, useCallback, useEffect } from "react";
import { sendChatMessage } from "../lib/nexus-api";

const SESSION_STORAGE_KEY = "nexus_chat_session_id";

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load session ID from localStorage on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSessionId) {
      setSessionId(savedSessionId);
    }
  }, []);

  /**
   * Send message
   */
  const send = useCallback(
    async (text, datasetId, userId) => {
      if (!text.trim()) return;

      setLoading(true);
      setError(null);

      // Optimistic update
      const userMessage = {
        id: Date.now(),
        role: "user",
        content: text,
      };

      setMessages((prev) => [...prev, userMessage]);

      try {
        const response = await sendChatMessage(
          text,
          sessionId,
          datasetId,
          userId
        );

        // Update session ID if new
        if (response.session_id && !sessionId) {
          setSessionId(response.session_id);
          localStorage.setItem(SESSION_STORAGE_KEY, response.session_id);
        }

        // Add assistant message
        const assistantMessage = {
          id: Date.now() + 1,
          role: "assistant",
          content: response.response,
          reasoning_used: response.reasoning_used,
          clarification_needed: response.clarification_needed,
          suggested_followup: response.suggested_followup,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        return response;
      } catch (err) {
        setError(err.message);
        // Remove the user message on error
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  /**
   * Clear conversation
   */
  const clear = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  return {
    messages,
    sessionId,
    loading,
    error,
    send,
    clear,
  };
}
