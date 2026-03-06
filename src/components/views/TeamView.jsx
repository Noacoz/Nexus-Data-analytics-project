import React, { useState, useEffect } from 'react'
import API from '../../lib/api'

export default function TeamView({ onInvite, setCurrentView, pushToast }) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Load team members from API or use fallback
    const loadTeamMembers = async () => {
      try {
        // Attempt to load from API
        const res = await fetch('/api/team', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (data.members && Array.isArray(data.members)) {
            setTeamMembers(data.members)
          } else {
            setTeamMembers(getDefaultTeamMembers())
          }
        } else {
          setTeamMembers(getDefaultTeamMembers())
        }
      } catch (err) {
        console.error('Failed to load team:', err)
        setTeamMembers(getDefaultTeamMembers())
      } finally {
        setLoading(false)
      }
    }
    loadTeamMembers()
  }, [])

  const getDefaultTeamMembers = () => [
    { name: 'Alex Johnson', role: 'Owner', status: 'Active', email: 'alex@example.com' },
    { name: 'Sarah Chen', role: 'Admin', status: 'Active', email: 'sarah@example.com' },
    { name: 'Jordan Lee', role: 'Member', status: 'Active', email: 'jordan@example.com' },
    { name: 'Casey Kim', role: 'Member', status: 'Invited', email: 'casey@example.com' },
  ]

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) {
      if (pushToast) pushToast('Please enter an email address', 'error')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      })

      if (!res.ok) {
        throw new Error('Failed to send invite')
      }

      const data = await res.json()
      if (pushToast) pushToast('Invitation sent successfully!', 'success')
      
      // Add to local list
      setTeamMembers(prev => [...prev, { 
        name: inviteEmail.split('@')[0], 
        email: inviteEmail, 
        role: inviteRole, 
        status: 'Invited' 
      }])
      
      setInviteEmail('')
      if (onInvite) onInvite({ email: inviteEmail, role: inviteRole })
    } catch (err) {
      console.error('Invite error:', err)
      if (pushToast) pushToast(err.message || 'Failed to send invite', 'error')
    } finally {
      setSubmitting(false)
    }
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
        <h1 className="text-4xl font-bold mb-8">Team Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Current Team */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Team Members</h2>
            {loading ? (
              <div className="text-slate-400">Loading team members...</div>
            ) : teamMembers.length === 0 ? (
              <div className="text-slate-400">No team members yet</div>
            ) : (
              <div className="space-y-4">
                {teamMembers.map((member, idx) => (
                  <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors">
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-slate-400">{member.role} • <span className={member.status === 'Active' ? 'text-green-400' : 'text-amber-400'}>{member.status}</span></p>
                    {member.email && <p className="text-xs text-slate-500 mt-1">{member.email}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invite Form */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Invite Team Member</h2>
            <form onSubmit={handleInvite} className="space-y-4 bg-slate-900/50 border border-slate-800 rounded-lg p-6">
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg focus:border-indigo-600 focus:outline-none transition-colors"
                  disabled={submitting}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg focus:border-indigo-600 focus:outline-none transition-colors"
                  disabled={submitting}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={submitting || !inviteEmail.trim()}
                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending...' : 'Send Invite'}
              </button>
              <p className="text-xs text-slate-400 mt-2">Team members will receive an email invitation to join your workspace.</p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
