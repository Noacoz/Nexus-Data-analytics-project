import React from 'react'
import { Icon } from './Shared'

export default function Navigation({ currentView, isLoggedIn, isMenuOpen, onMenuToggle, onNavigate, onLogout }) {
  const navItems = [
    { label: 'Home', view: 'home' },
    { label: 'Use Cases', view: 'usecases' },
    { label: 'Product', view: 'product' },
    { label: 'Pricing', view: 'pricing' },
    { label: 'Contact', view: 'contact' },
    { label: 'Support', view: 'support' },
  ]

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 sticky top-0 z-50 glass py-4 px-6 md:px-12 transition-all duration-300">
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
          {/* Logo with floating gradient ball */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 scale-in"
            style={{ animationDelay: '0.2s' }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onNavigate('home')
              }
            }}
          >
            <div className="w-8 h-8 rounded-full brand-gradient animate-float"></div>
            <span className="text-xl font-bold">Nexus Analytics</span>
          </button>

          {/* Nav Items */}
          <div className="flex gap-8 items-center">
            {navItems.map(item => (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`text-sm font-medium transition-colors duration-200 ${
                  currentView === item.view
                    ? 'text-indigo-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Auth */}
          <div className="flex gap-4 items-center">
            {isLoggedIn ? (
              <>
                <button onClick={() => onNavigate('dashboard')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors">
                  Dashboard
                </button>
                <button
                  onClick={() => onNavigate('profile')}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors"
                >
                  Profile
                </button>
                <button
                  onClick={onLogout}
                  className="px-4 py-2 text-sm font-medium bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-all"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('login')}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => onNavigate('pricing')}
                  className="px-6 py-2 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-lg hover:from-indigo-700 hover:to-cyan-700 transition-all shadow-lg shadow-indigo-900/30"
                >
                  Start analyzing free
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="flex md:hidden fixed top-0 left-0 right-0 h-14 glass z-50 px-4 items-center justify-between">
        <button
          onClick={() => onNavigate('home')}
          className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent"
        >
          Nexus
        </button>
        <button
          onClick={onMenuToggle}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-14 bg-slate-950 z-40 md:hidden p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            {navItems.map(item => (
              <button
                key={item.view}
                onClick={() => {
                  onNavigate(item.view)
                  onMenuToggle()
                }}
                className={`text-left text-sm font-medium transition-colors ${
                  currentView === item.view
                    ? 'text-indigo-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {isLoggedIn ? (
            <div className="flex flex-col gap-2 pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  onNavigate('dashboard')
                  onMenuToggle()
                }}
                className="w-full px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors mb-1"
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  onNavigate('profile')
                  onMenuToggle()
                }}
                className="text-left text-sm font-medium text-slate-300 hover:text-slate-100"
              >
                Profile
              </button>
              <button
                onClick={onLogout}
                className="text-left text-sm font-medium text-red-400 hover:text-red-300"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  onNavigate('login')
                  onMenuToggle()
                }}
                className="w-full px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100"
              >
                Log in
              </button>
              <button
                onClick={() => {
                  onNavigate('pricing')
                  onMenuToggle()
                }}
                className="w-full px-4 py-2 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-lg"
              >
                Start analyzing free
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
