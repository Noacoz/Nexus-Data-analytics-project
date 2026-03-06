import React, { useState, useEffect } from 'react'

export default function SettingsView({ settings, onSave, setCurrentView, pushToast }) {
  const [workspaceSettings, setWorkspaceSettings] = useState(settings || { name: 'My Workspace', timezone: 'UTC' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load settings from API if available
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/settings', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (data.settings) {
            setWorkspaceSettings(prev => ({ ...prev, ...data.settings }))
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      }
    }
    loadSettings()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workspaceSettings)
      })

      if (!res.ok) {
        throw new Error('Failed to save settings')
      }

      if (pushToast) pushToast('Settings saved successfully', 'success')
      if (onSave) onSave(workspaceSettings)
    } catch (err) {
      console.error('Save error:', err)
      if (pushToast) pushToast(err.message || 'Failed to save settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  const timezones = [
    'UTC', 'EST', 'CST', 'MST', 'PST', 'GMT', 'CET', 'IST', 'JST', 'AEST'
  ]

  return (
    <div className="min-h-screen pt-16 bg-slate-950">
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => setCurrentView('dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:-translate-x-1 transition-transform">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back
        </button>
        <h1 className="text-4xl font-bold mb-8">Settings</h1>

        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-8 space-y-8">
          {/* Workspace Settings */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Workspace Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Workspace Name</label>
                <input
                  type="text"
                  value={workspaceSettings.name || ''}
                  onChange={(e) => setWorkspaceSettings({...workspaceSettings, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg focus:border-indigo-600 focus:outline-none transition-colors"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Timezone</label>
                <select
                  value={workspaceSettings.timezone || 'UTC'}
                  onChange={(e) => setWorkspaceSettings({...workspaceSettings, timezone: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg focus:border-indigo-600 focus:outline-none transition-colors"
                  disabled={loading}
                >
                  {timezones.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Data Preferences */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Data Preferences</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={workspaceSettings.anonymizeData || false}
                  onChange={(e) => setWorkspaceSettings({...workspaceSettings, anonymizeData: e.target.checked})}
                  className="w-4 h-4" 
                  disabled={loading}
                />
                <span>Anonymize personal data</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={workspaceSettings.shareMetrics !== false}
                  onChange={(e) => setWorkspaceSettings({...workspaceSettings, shareMetrics: e.target.checked})}
                  className="w-4 h-4" 
                  disabled={loading}
                />
                <span>Share usage metrics</span>
              </label>
            </div>
          </div>

          {/* Data Retention */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Data Retention</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Auto-delete datasets after (days)</label>
                <input
                  type="number"
                  min="0"
                  value={workspaceSettings.retentionDays || 90}
                  onChange={(e) => setWorkspaceSettings({...workspaceSettings, retentionDays: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg focus:border-indigo-600 focus:outline-none transition-colors"
                  disabled={loading}
                />
                <p className="text-xs text-slate-400 mt-1">Set to 0 to disable auto-deletion</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
