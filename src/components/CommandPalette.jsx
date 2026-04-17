import React, { useState, useEffect, useRef } from 'react'

const COMMANDS = [
  { id: 'nav-dashboard', label: 'Go to Dashboard', icon: '📊', category: 'Navigation', action: 'navigate', target: 'dashboard' },
  { id: 'nav-datasets', label: 'Open Datasets', icon: '🗂️', category: 'Navigation', action: 'navigate', target: 'datasets' },
  { id: 'nav-data-explorer', label: 'Open Data Explorer', icon: '🧭', category: 'Navigation', action: 'navigate', target: 'data-explorer' },
  { id: 'nav-analysis', label: 'Open Analysis / Models', icon: '📈', category: 'Navigation', action: 'navigate', target: 'analysis' },
  { id: 'nav-ai-analyst', label: 'Open AI Analyst', icon: '🤖', category: 'Navigation', action: 'navigate', target: 'ai-analyst' },
  { id: 'nav-insights', label: 'Open Insights', icon: '💡', category: 'Navigation', action: 'navigate', target: 'insights' },
  { id: 'nav-reports', label: 'View Reports', icon: '📋', category: 'Navigation', action: 'navigate', target: 'reports' },
  { id: 'nav-monitoring', label: 'Open Monitoring', icon: '🚨', category: 'Navigation', action: 'navigate', target: 'monitoring' },
  { id: 'nav-workflows', label: 'Open Workflows', icon: '⚙️', category: 'Navigation', action: 'navigate', target: 'workflows' },
  { id: 'nav-system-logs', label: 'View System Logs', icon: '📝', category: 'Navigation', action: 'navigate', target: 'system-logs' },
  { id: 'nav-audit', label: 'Open Audit', icon: '🔎', category: 'Navigation', action: 'navigate', target: 'audit' },
  { id: 'nav-settings', label: 'Open Settings', icon: '⚙️', category: 'Navigation', action: 'navigate', target: 'settings' },
  { id: 'nav-team', label: 'Manage Team', icon: '👥', category: 'Navigation', action: 'navigate', target: 'team' },
  { id: 'nav-profile', label: 'My Profile', icon: '👤', category: 'Navigation', action: 'navigate', target: 'profile' },
  { id: 'action-nl', label: 'Ask AURORA AI...', icon: '🤖', category: 'AI', action: 'nl-query' },
  { id: 'action-new-report', label: 'Create New Report', icon: '📝', category: 'Actions', action: 'navigate', target: 'reports' },
  { id: 'action-support', label: 'Get Support', icon: '🆘', category: 'Actions', action: 'navigate', target: 'support' },
]

const CommandPalette = ({ isOpen, onClose, onNavigate, datasets = [] }) => {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)

  const datasetCommands = datasets.map(d => ({
    id: `dataset-${d.id}`,
    label: `Open: ${d.name}`,
    icon: '🗄️',
    category: 'Datasets',
    action: 'navigate',
    target: { view: 'dataset-detail', datasetId: d.id },
  }))

  const allCommands = [...COMMANDS, ...datasetCommands]

  const filtered = query.trim() === ''
    ? allCommands
    : allCommands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
      )

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => { setSelected(0) }, [query])

  const execute = (cmd) => {
    if (!cmd) return
    if (cmd.action === 'navigate') onNavigate(cmd.target)
    onClose()
  }

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter') execute(filtered[selected])
    if (e.key === 'Escape') onClose()
  }

  if (!isOpen) return null

  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = []
    acc[cmd.category].push(cmd)
    return acc
  }, {})

  let globalIndex = 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl mx-4 glass rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ boxShadow: '0 0 40px rgba(168,85,247,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <span className="text-slate-400 text-lg">⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search commands, datasets, actions..."
            className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
          />
          <kbd className="text-xs text-slate-600 border border-slate-700 rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">No commands found</div>
          ) : (
            Object.entries(grouped).map(([category, cmds]) => (
              <div key={category}>
                <div className="px-4 py-1 text-xs font-semibold text-slate-600 uppercase tracking-wider">{category}</div>
                {cmds.map(cmd => {
                  const idx = globalIndex++
                  return (
                    <div
                      key={cmd.id}
                      onClick={() => execute(cmd)}
                      onMouseEnter={() => setSelected(idx)}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                        selected === idx ? 'bg-purple-600/20 border-l-2 border-purple-500' : 'hover:bg-white/5'
                      }`}
                    >
                      <span className="text-base w-6 text-center flex-shrink-0">{cmd.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-slate-200">{cmd.label}</span>
                      </div>
                      {selected === idx && (
                        <kbd className="text-xs text-slate-500 border border-slate-700 rounded px-1.5 py-0.5 flex-shrink-0">↵</kbd>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-white/10 flex gap-4 text-xs text-slate-600">
          <span><kbd className="border border-slate-700 rounded px-1">↑↓</kbd> navigate</span>
          <span><kbd className="border border-slate-700 rounded px-1">↵</kbd> select</span>
          <span><kbd className="border border-slate-700 rounded px-1">esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
