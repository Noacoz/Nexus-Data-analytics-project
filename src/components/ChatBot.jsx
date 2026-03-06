import React, { useState, useRef, useEffect } from 'react';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm Nexus, your analytics assistant. I can help you understand our platform, choose the right plan, or answer any questions about your data workflow. What can I help you with?",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  // Quick-start suggestion chips
  const suggestions = [
    "What's included in the free plan?",
    "How do I upload my first dataset?",
    "Can I collaborate with my team?",
    "How does AI analysis work?",
  ];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('nexus:open-chat', handler);
    return () => window.removeEventListener('nexus:open-chat', handler);
  }, []);

  const sendMessage = async (text) => {
    const userText = (text || inputValue).trim();
    if (!userText || isStreaming) return;

    setInputValue('');
    setHasUnread(false);

    const userMessage = { role: 'user', content: userText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsStreaming(true);

    // Add empty assistant message that will be filled by streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      // Build the messages array for the API (exclude the initial greeting)
      const apiMessages = updatedMessages
        .filter((_, i) => !(i === 0 && updatedMessages[0].role === 'assistant'))
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: apiMessages
        }),
        signal: abortRef.current,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices?.[0]?.delta?.content || '';
              if (token) {
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: updated[updated.length - 1].content + token,
                  };
                  return updated;
                });
              }
              if (parsed.error) {
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: "I'm having trouble connecting right now. Please try again or email us at support@nexusanalytics.com",
                  };
                  return updated;
                });
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: "Something went wrong. Please try again in a moment.",
          };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Hi! I'm Nexus, your analytics assistant. I can help you understand our platform, choose the right plan, or answer any questions about your data workflow. What can I help you with?",
    }]);
  };

  // Render markdown-like content (bold, lists)
  const renderContent = (content) => {
    if (!content) return null;
    const lines = content.split('\n');
    return lines.map((line, i) => {
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '4px' }}>
            <span style={{ color: '#06b6d4', marginRight: '8px', flexShrink: 0 }}>•</span>
            <span dangerouslySetInnerHTML={{ __html: line.slice(2) }} />
          </div>
        );
      }
      if (line === '') return <div key={i} style={{ height: '8px' }} />;
      return <div key={i} dangerouslySetInnerHTML={{ __html: line }} />;
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close chat' : 'Open chat assistant'}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
          zIndex: 9998,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          transform: isOpen ? 'scale(0.9)' : 'scale(1)',
        }}
        onMouseEnter={e => { if (!isOpen) e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { if (!isOpen) e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {hasUnread && !isOpen && (
          <div style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: '#ef4444',
            border: '2px solid #020617',
            animation: 'pulse 2s infinite',
          }} />
        )}
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        )}
      </button>

      <div
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '24px',
          width: '380px',
          height: '560px',
          borderRadius: '20px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)',
          zIndex: 9997,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
          pointerEvents: isOpen ? 'all' : 'none',
        }}
      >
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(6,182,212,0.2) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 16px rgba(99,102,241,0.5)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#f8fafc' }}>Nexus AI</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Online · Typically replies instantly</span>
            </div>
          </div>
          <button
            onClick={clearChat}
            title="Clear chat"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', borderRadius: '6px' }}
            onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
          </button>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#334155 transparent',
        }}>
          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end',
                gap: '8px',
              }}
            >
              {message.role === 'assistant' && (
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: 'white',
                  fontWeight: 700,
                }}>N</div>
              )}

              <div style={{
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: message.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: message.role === 'user'
                  ? 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)'
                  : 'rgba(30, 41, 59, 0.8)',
                border: message.role === 'assistant' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#f1f5f9',
              }}>
                {message.content === '' && isStreaming && index === messages.length - 1 ? (
                  <div style={{ display: 'flex', gap: '4px', padding: '2px 4px' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: '7px', height: '7px', borderRadius: '50%',
                        background: '#6366f1',
                        animation: `bounce 1.2s infinite ${i * 0.2}s`,
                      }} />
                    ))}
                  </div>
                ) : (
                  renderContent(message.content)
                )}
              </div>
            </div>
          ))}

          {messages.length === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <p style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: '36px' }}>
                Quick questions
              </p>
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(suggestion)}
                  style={{
                    marginLeft: '36px',
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    color: '#a5b4fc',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'; }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(15, 23, 42, 0.9)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '10px',
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '14px',
            padding: '10px 14px',
            transition: 'border-color 0.15s ease',
          }}
            onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'}
            onBlurCapture={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'}
          >
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about Nexus Analytics..."
              disabled={isStreaming}
              rows={1}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#f1f5f9',
                fontSize: '14px',
                lineHeight: '1.5',
                resize: 'none',
                maxHeight: '96px',
                fontFamily: 'Inter, sans-serif',
                caretColor: '#06b6d4',
              }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!inputValue.trim() || isStreaming}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: inputValue.trim() && !isStreaming
                  ? 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)'
                  : 'rgba(99,102,241,0.2)',
                border: 'none',
                cursor: inputValue.trim() && !isStreaming ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#475569', marginTop: '8px' }}>
            Powered by Claude AI · Press Enter to send
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
};

export default ChatBot;
