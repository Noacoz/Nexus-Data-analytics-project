import React, { useState, useEffect } from 'react'
import API from '../../lib/api'

export default function ProfileView({ isLoggedIn, onLogout, setCurrentView, pushToast }) {
  const [activeTab, setActiveTab] = useState('personal')
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({ name: '', role: '', bio: '' })
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn) return
    const loadUserData = async () => {
      try {
        const result = await API.getMe()
        if (result?.user) {
          setUser(result.user)
          setFormData({
            name: result.user.name || '',
            role: result.user.role || '',
            bio: result.user.bio || ''
          })
        }
      } catch (err) {
        console.error('Failed to load user data:', err)
        if (pushToast) pushToast('Failed to load profile', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadUserData()
  }, [isLoggedIn, pushToast])

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Please log in to view your profile</p>
          <button
            onClick={() => setCurrentView('login')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center text-slate-400">Loading profile...</div>
      </div>
    )
  }

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
        <h1 className="text-4xl font-bold mb-8">Profile Settings</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            {['personal', 'security', 'notifications', 'preferences'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-2 rounded transition-colors ${
                  activeTab === tab
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="md:col-span-3 bg-slate-900/50 border border-slate-800 rounded-lg p-8">
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Personal Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input type="email" value={user?.email || ''} disabled className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded focus:border-indigo-600 focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Role</label>
                    <input type="text" value={formData.role} onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded focus:border-indigo-600 focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Bio</label>
                    <textarea value={formData.bio} onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))} rows="4" className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded focus:border-indigo-600 focus:outline-none transition-colors resize-none" />
                  </div>
                  <button onClick={async () => {
                    try {
                      const res = await API.updateProfile({ name: formData.name, role: formData.role, bio: formData.bio })
                      if (res?.error) {
                        if (pushToast) pushToast(res.error, 'error')
                      } else {
                        if (pushToast) pushToast('Profile updated successfully', 'success')
                        setUser(prev => ({ ...prev, ...formData }))
                      }
                    } catch (err) {
                      console.error('Update error:', err)
                      if (pushToast) pushToast('Failed to update profile', 'error')
                    }
                  }} className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">Save Changes</button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Security Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Current Password</label>
                    <input type="password" value={passwords.current} onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded focus:border-indigo-600 focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">New Password</label>
                    <input type="password" value={passwords.new} onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded focus:border-indigo-600 focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                    <input type="password" value={passwords.confirm} onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded focus:border-indigo-600 focus:outline-none transition-colors" />
                  </div>
                  <button onClick={async () => {
                    if (passwords.new !== passwords.confirm) {
                      if (pushToast) pushToast('Passwords do not match', 'error')
                      return
                    }
                    if (passwords.new.length < 8) {
                      if (pushToast) pushToast('Password must be at least 8 characters', 'error')
                      return
                    }
                    try {
                      const res = await API.changePassword(passwords.current, passwords.new)
                      if (res?.error) {
                        if (pushToast) pushToast(res.error, 'error')
                      } else {
                        if (pushToast) pushToast('Password updated successfully', 'success')
                        setPasswords({ current: '', new: '', confirm: '' })
                      }
                    } catch (err) {
                      console.error('Password change error:', err)
                      if (pushToast) pushToast('Failed to change password', 'error')
                    }
                  }} className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">Change Password</button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Notification Preferences</h2>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span>Email notifications for new insights</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span>Weekly summary reports</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" />
                    <span>Marketing and product updates</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">User Preferences</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Theme</label>
                    <select className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded focus:border-indigo-600 focus:outline-none transition-colors">
                      <option>Dark Mode</option>
                      <option>Light Mode</option>
                      <option>Auto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Data Language</label>
                    <select className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded focus:border-indigo-600 focus:outline-none transition-colors">
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                  </div>
                  <button onClick={() => {
                    if (pushToast) pushToast('Preferences saved', 'success')
                  }} className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">Save Preferences</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-8">
          <button
            onClick={async () => {
              await API.signout()
              if (onLogout) onLogout()
              if (pushToast) pushToast('Logged out successfully', 'info')
            }}
            className="px-6 py-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors font-medium"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  )
}
