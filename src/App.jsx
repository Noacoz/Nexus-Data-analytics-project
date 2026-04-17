/**
 * App.jsx
 * Root application component for Nexus Analytics Platform
 */

import { useState, useEffect, useCallback } from 'react'
import API from './lib/api'
import Navigation from './components/Navigation'
import Sidebar from './components/Sidebar'
import CommandPalette from './components/CommandPalette'
import { Footer, LoadingOverlay, ToastContainer, AuroraBackground, FilmGrainOverlay } from './components/Shared'
import ChatBot from './components/ChatBot'
import AIChatbot from './components/AIChatbot'
import HomeView from './components/views/HomeView'
import ProductView from './components/views/ProductView'
import PricingView from './components/views/PricingView'
import ContactView from './components/views/ContactView'
import LoginView from './components/views/LoginView'
import BillingView from './components/views/BillingView'
import DashboardView from './components/views/DashboardView'
import DatasetsView from './components/views/DatasetsView'
import DataExplorerView from './components/views/DataExplorerView'
import AnalysisView from './components/views/AnalysisView'
import AIAnalystView from './components/views/AIAnalystView'
import InsightsView from './components/views/InsightsView'
import MonitoringView from './components/views/MonitoringView'
import WorkflowsView from './components/views/WorkflowsView'
import SystemLogsView from './components/views/SystemLogsView'
import AuditView from './components/views/AuditView'
import ProfileView from './components/views/ProfileView'
import DatasetDetailView from './components/views/DatasetDetailView'
import DatasetUploadView from './components/views/DatasetUploadView'
import TeamView from './components/views/TeamView'
import ReportsView from './components/views/ReportsView'
import SettingsView from './components/views/SettingsView'
import SupportView from './components/views/SupportView'
import UseCasesView from './components/views/UseCasesView'
import TermsView from './components/views/TermsView'
import PrivacyView from './components/views/PrivacyView'
import NotFoundView from './components/views/NotFoundView'

function App() {
  const VIEW_TO_PATH = {
    home: '/',
    product: '/product',
    pricing: '/pricing',
    contact: '/contact',
    support: '/support',
    login: '/login',
    billing: '/billing',
    dashboard: '/dashboard',
    datasets: '/datasets',
    'data-explorer': '/data-explorer',
    analysis: '/analysis',
    'ai-analyst': '/ai-analyst',
    insights: '/insights',
    reports: '/reports',
    monitoring: '/monitoring',
    workflows: '/workflows',
    team: '/team',
    'system-logs': '/system-logs',
    audit: '/audit',
    settings: '/settings',
    profile: '/profile',
    'dataset-upload': '/dataset-upload',
    usecases: '/usecases',
    terms: '/terms',
    privacy: '/privacy',
  }

  const PATH_TO_VIEW = Object.fromEntries(Object.entries(VIEW_TO_PATH).map(([view, route]) => [route, view]))

  const normalizePath = (path) => {
    if (!path) return '/'
    const trimmed = path.split('?')[0].split('#')[0].replace(/\/+$/, '')
    return trimmed === '' ? '/' : trimmed
  }

  const getViewFromPath = (path) => {
    const normalized = normalizePath(path)
    if (normalized.startsWith('/datasets/') && normalized !== '/datasets/') {
      const id = normalized.split('/')[2]
      return { view: 'dataset-detail', datasetId: isNaN(Number(id)) ? id : Number(id) }
    }
    return PATH_TO_VIEW[normalized] || 'notfound'
  }

  const getPathFromView = (view) => {
    if (typeof view === 'object' && view?.view === 'dataset-detail') {
      return `/datasets/${view.datasetId}`
    }
    return VIEW_TO_PATH[view] || '/'
  }

  const [currentView, setCurrentView] = useState(() => getViewFromPath(window.location.pathname))
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [datasets, setDatasets] = useState([])
  const [toasts, setToasts] = useState([])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showTrialBanner, setShowTrialBanner] = useState(true)
  const [showChatbot, setShowChatbot] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [workspaceSettings, setWorkspaceSettings] = useState({})
  const [viewHistory, setViewHistory] = useState([])
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [datasetsLoading, setDatasetsLoading] = useState(false)

  const appViews = new Set([
    'dashboard',
    'datasets',
    'data-explorer',
    'analysis',
    'ai-analyst',
    'insights',
    'reports',
    'monitoring',
    'workflows',
    'team',
    'system-logs',
    'audit',
    'settings',
    'profile',
    'dataset-upload',
    'dataset-detail',
  ])

  const getViewKey = (view) => (typeof view === 'object' ? view?.view : view)

  const currentRoute = getPathFromView(currentView)


  // Open chatbot via custom event
  useEffect(() => {
    const openHandler = () => setShowChatbot(true)
    window.addEventListener('open-chatbot', openHandler)
    return () => window.removeEventListener('open-chatbot', openHandler)
  }, [])

  // Auth init
  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search)

      if (params.get('auth_success')) {
        window.history.replaceState({}, '', '/')
        try {
          const { user } = await API.getMe()
          if (user) {
            setCurrentUser(user)
            setIsLoggedIn(true)
            setDatasetsLoading(true)
            const { datasets: ds } = await API.getDatasets()
            setDatasets(ds || [])
            setDatasetsLoading(false)
            setCurrentView('dashboard')
            addToast(`Welcome back, ${user.name}!`, 'success')
          }
        } catch {}
        setIsCheckingAuth(false)
        return
      }

      const authError = params.get('auth_error')
      if (authError) {
        window.history.replaceState({}, '', '/')
        addToast('Sign-in failed. Please try again.', 'error')
        setIsCheckingAuth(false)
        return
      }

      try {
        const { user } = await API.getMe()
        if (user) {
          setCurrentUser(user)
          setIsLoggedIn(true)
          setCurrentView('dashboard')
          setDatasetsLoading(true)
          const { datasets: ds } = await API.getDatasets()
          setDatasets(ds || [])
          setDatasetsLoading(false)
        }
      } catch {
        setDatasetsLoading(false)
      }
      setIsCheckingAuth(false)
    }
    init()
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isLoggedIn) setPaletteOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isLoggedIn])

  useEffect(() => {
    const onPopState = () => {
      setCurrentView(getViewFromPath(window.location.pathname))
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    if (duration > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
    }
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const handleViewChange = useCallback((target) => {
    let nextPath = '/'
    let nextView = 'home'

    if (typeof target === 'string') {
      nextPath = target.startsWith('/') ? target : VIEW_TO_PATH[target] || `/${target}`
      nextView = getViewFromPath(nextPath)
    } else if (typeof target === 'object' && target !== null) {
      if (target.view === 'dataset-detail' && target.datasetId != null) {
        nextPath = `/datasets/${target.datasetId}`
        nextView = { view: 'dataset-detail', datasetId: target.datasetId }
      } else if (typeof target.route === 'string') {
        nextPath = target.route
        nextView = getViewFromPath(nextPath)
      } else {
        nextView = getViewFromPath(window.location.pathname)
        nextPath = getPathFromView(nextView)
      }
    }

    const currentPath = getPathFromView(currentView)
    if (currentPath === nextPath) return

    setIsTransitioning(true)
    setIsMenuOpen(false)
    setViewHistory(prev => [...prev, currentView])
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }
    setTimeout(() => {
      setCurrentView(nextView)
      setIsTransitioning(false)
    }, 300)
  }, [currentView])

  const handleBack = useCallback(() => {
    setViewHistory(prev => {
      if (prev.length === 0) return prev
      const history = [...prev]
      const previousView = history.pop()
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentView(previousView)
        setIsTransitioning(false)
      }, 300)
      return history
    })
  }, [])

  const handlePlanSelection = useCallback((plan) => {
    setSelectedPlan(plan)
    handleViewChange('billing')
  }, [handleViewChange])

  const handleLogin = useCallback(async (user) => {
    setCurrentUser(user)
    setIsLoggedIn(true)
    setDatasetsLoading(true)
    try {
      const { datasets: ds } = await API.getDatasets()
      if (ds) setDatasets(ds)
    } catch {}
    setDatasetsLoading(false)
    addToast('Login successful!', 'success')
    handleViewChange('dashboard')
  }, [addToast, handleViewChange])

  const handleLogout = useCallback(async () => {
    await API.signout()
    setIsLoggedIn(false)
    setCurrentUser(null)
    setDatasets([])
    addToast('Signed out', 'info')
    handleViewChange('home')
  }, [addToast, handleViewChange])

  const handleAddDataset = useCallback((dataset) => {
    setDatasets(prev => [{
      id: Date.now(), ...dataset,
      createdAt: new Date().toISOString(),
      visualizations: 0, insights: 0, comments: 0
    }, ...prev])
    addToast(`Dataset "${dataset.name}" uploaded successfully!`, 'success')
    handleViewChange('dashboard')
  }, [addToast, handleViewChange])

  const handleAddTeamMember = useCallback((member) => {
    addToast(`Invited ${member.email} to the team`, 'success')
  }, [addToast])

  const handleContactSubmit = useCallback(() => {
    addToast("Thank you! We'll get back to you soon.", 'success')
  }, [addToast])

  const viewKey = getViewKey(currentView)
  const shouldShowSidebar = appViews.has(viewKey)
  const shouldShowTopNav = !shouldShowSidebar

  const shouldShowFooter = shouldShowTopNav && (
    viewKey === 'home' ||
    viewKey === 'product' ||
    viewKey === 'terms' ||
    viewKey === 'privacy'
  )

  const renderView = () => {
  if (isCheckingAuth) return null;
    if (currentView === 'home') return <HomeView onExplore={() => handleViewChange('product')} onGetStarted={() => handleViewChange('login')} />
    if (currentView === 'product') return <ProductView />
    if (currentView === 'pricing') return <PricingView onSelectPlan={handlePlanSelection} />
    if (currentView === 'contact') return <ContactView onSubmit={handleContactSubmit} />
    if (currentView === 'login') return <LoginView onLogin={handleLogin} setCurrentView={handleViewChange} pushToast={addToast} />
    if (currentView === 'billing') return <BillingView plan={selectedPlan} onSuccess={() => { setIsLoggedIn(true); addToast('Payment processed!', 'success'); handleViewChange('dashboard') }} setCurrentView={handleViewChange} />
    if (currentView === 'dashboard') return <DashboardView datasets={datasets} isLoading={datasetsLoading} onViewDataset={(datasetId) => handleViewChange({view: 'dataset-detail', datasetId})} onUpload={() => handleViewChange('dataset-upload')} showTrialBanner={showTrialBanner} onDismissTrial={() => setShowTrialBanner(false)} setCurrentView={handleViewChange} pushToast={addToast} currentUser={currentUser} />
    if (currentView === 'profile') return <ProfileView isLoggedIn={isLoggedIn} onLogout={handleLogout} setCurrentView={handleViewChange} pushToast={addToast} currentUser={currentUser} onBack={handleBack} />
    if (typeof currentView === 'object' && currentView.view === 'dataset-detail') return <DatasetDetailView datasetId={currentView.datasetId} datasets={datasets} onBack={handleBack} />
    if (currentView === 'dataset-upload') return <DatasetUploadView onUpload={handleAddDataset} onCancel={() => handleViewChange('dashboard')} />
    if (currentView === 'team') return <TeamView onInvite={handleAddTeamMember} setCurrentView={handleViewChange} />
    if (currentView === 'reports') return <ReportsView setCurrentView={handleViewChange} />
    if (currentView === 'settings') return <SettingsView settings={workspaceSettings} onSave={(s) => { setWorkspaceSettings(s); addToast('Settings saved!', 'success') }} setCurrentView={handleViewChange} />
    if (currentView === 'support') return <SupportView setCurrentView={handleViewChange} onBack={handleBack} />
    if (currentView === 'usecases') return <UseCasesView setCurrentView={handleViewChange} />
    if (currentView === 'terms') return <TermsView setCurrentView={handleViewChange} />
    if (currentView === 'privacy') return <PrivacyView setCurrentView={handleViewChange} />
    return <NotFoundView onBack={() => handleViewChange('home')} />
  }

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>

      {/* Background Effects */}
      <AuroraBackground />
      <FilmGrainOverlay />

      {/* Navigation */}
      {shouldShowTopNav && (
        <Navigation
          currentView={currentView}
          isLoggedIn={isLoggedIn}
          isMenuOpen={isMenuOpen}
          onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
          onNavigate={handleViewChange}
          onLogout={handleLogout}
          onOpenPalette={() => setPaletteOpen(true)}
        />
      )}

      {/* Sidebar for analytics routes */}
      {shouldShowSidebar && (
        <Sidebar
          currentPath={currentRoute}
          onNavigate={handleViewChange}
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        />
      )}

      {/* Loading Overlay */}
      {isTransitioning && <LoadingOverlay isLoading={true} />}

      {/* Main Content */}
      <main className={`relative z-10 ${shouldShowSidebar ? 'lg:pl-72 pt-6' : 'pt-16'}`}>
        {shouldShowSidebar && (
          <button
            onClick={() => setIsMenuOpen(true)}
            className="lg:hidden fixed top-4 left-4 z-50 rounded-2xl bg-slate-900/95 border border-white/10 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/40"
          >
            Menu
          </button>
        )}
        {renderView()}
      </main>

      {/* Footer */}
      {shouldShowFooter && <Footer onNavigate={handleViewChange} />}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      {/* AI Chatbot - toggled via custom event */}
      {showChatbot && (
        <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 60, width: 420, maxWidth: '90vw', boxShadow: '0 10px 30px rgba(2,6,23,0.6)' }}>
          <div style={{ background: '#071428', borderRadius: 12, overflow: 'hidden' }}>
            <button onClick={() => setShowChatbot(false)} style={{ position: 'absolute', right: 8, top: 8, zIndex: 70, background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>âœ•</button>
            <AIChatbot />
          </div>
        </div>
      )}

      {/* Global floating ChatBot (persistent bubble) */}
      <ChatBot />

      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={handleViewChange}
        datasets={datasets}
      />

    </div>
  )
}

export default App



