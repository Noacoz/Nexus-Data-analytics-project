import React, { useState } from 'react'
import API from '../../lib/api'

export default function LoginView({ onLogin, setCurrentView, pushToast }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isSignUp) {
        if (!name.trim()) return pushToast('Name is required', 'error')
        if (password.length < 8) return pushToast('Password must be at least 8 characters', 'error')
        const result = await API.signup(name.trim(), email.trim(), password)
        setLoading(false)
        if (result?.error) return pushToast(result.error, 'error')
        pushToast('Account created! Welcome to Nexus Analytics.', 'success')
        if (onLogin) onLogin(result.user)
        return
      }

      // Sign in
      const result = await API.signin(email.trim(), password)
      setLoading(false)
      if (result?.error) return pushToast(result.error, 'error')
      pushToast('Welcome back!', 'success')
      if (onLogin) onLogin(result.user)
    } catch (err) {
      setLoading(false)
      pushToast('Authentication failed', 'error')
    }
  }

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center px-4 bg-gradient-to-b from-slate-900 to-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
          <p className="text-slate-400">{isSignUp ? 'Start your free 14-day trial' : 'Sign in to your Nexus account to continue'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field - Only for Sign Up */}
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isSignUp}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg focus:border-indigo-600 focus:outline-none transition-colors"
                disabled={loading}
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg focus:border-indigo-600 focus:outline-none transition-colors"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg focus:border-indigo-600 focus:outline-none transition-colors"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {isSignUp && <p className="text-xs text-slate-400 mt-1">Minimum 8 characters required</p>}
          </div>

          {/* Remember Me - Only for Sign In */}
          {!isSignUp && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-slate-400 cursor-pointer">
                Remember me
              </label>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Sign up' : 'Sign in')}
          </button>
        </form>

        {/* Social Auth */}
        {!isSignUp && (
          <div className="mt-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-950 text-slate-400">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                disabled={socialLoading === 'google' || loading}
                onClick={() => {
                  setSocialLoading('google')
                  if (pushToast) pushToast('Redirecting to Google...', 'info')
                  setTimeout(() => { API.loginWithGoogle() }, 600)
                }}
                className="px-4 py-3 border border-slate-800 rounded-lg hover:bg-slate-900/50 transition-colors font-medium text-slate-300 disabled:opacity-50"
              >
                {socialLoading === 'google' ? 'Connecting...' : 'Google'}
              </button>
              <button
                type="button"
                disabled={socialLoading === 'github' || loading}
                onClick={() => {
                  setSocialLoading('github')
                  if (pushToast) pushToast('Redirecting to GitHub...', 'info')
                  setTimeout(() => { API.loginWithGitHub() }, 600)
                }}
                className="px-4 py-3 border border-slate-800 rounded-lg hover:bg-slate-900/50 transition-colors font-medium text-slate-300 disabled:opacity-50"
              >
                {socialLoading === 'github' ? 'Connecting...' : 'GitHub'}
              </button>
            </div>
          </div>
        )}

        {/* Toggle Sign Up / Sign In */}
        <div className="mt-6 text-center text-slate-400">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false)
                  setName('')
                  setEmail('')
                  setPassword('')
                  setShowPassword(false)
                }}
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true)
                  setEmail('')
                  setPassword('')
                  setRememberMe(false)
                }}
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Sign up for free
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
