/**
 * App.jsx
 * Root application component for Nexus Analytics Platform
 */

import { useState, useEffect, useCallback } from 'react'
import API from './lib/api'
import Navigation from './components/Navigation'
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
  const [currentView, setCurrentView] = useState('home')
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
  const [workspaceSettings, setWorkspaceSettings] = useState({})
  const [viewHistory, setViewHistory] = useState([])
  const [isDarkMode, setIsDarkMode] = useState(true)


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
            const { datasets: ds } = await API.getDatasets()
            setDatasets(ds || [])
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
          const { datasets: ds } = await API.getDatasets()
          setDatasets(ds || [])
        }
      } catch {}
      setIsCheckingAuth(false)
    }
    init()
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

  const handleViewChange = useCallback((newView) => {
    if (newView === currentView) return
    setIsTransitioning(true)
    setIsMenuOpen(false)
    setViewHistory(prev => [...prev, currentView])
    setTimeout(() => {
      setCurrentView(newView)
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
    try {
      const { datasets: ds } = await API.getDatasets()
      if (ds) setDatasets(ds)
    } catch {}
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

  const shouldShowNav = !['billing', 'login', 'profile', 'dataset-detail',
    'dataset-upload', 'team', 'reports', 'settings', 'support'].includes(currentView)
    && typeof currentView === 'string'

  const shouldShowFooter = shouldShowNav
    || currentView === 'home'
    || currentView === 'product'
    || (typeof currentView === 'string' && ['terms', 'privacy'].includes(currentView))

  const renderView = () => {
    if (currentView === 'home') return <HomeView onExplore={() => handleViewChange('product')} onGetStarted={() => handleViewChange('login')} />
    if (currentView === 'product') return <ProductView />
    if (currentView === 'pricing') return <PricingView onSelectPlan={handlePlanSelection} />
    if (currentView === 'contact') return <ContactView onSubmit={handleContactSubmit} />
    if (currentView === 'login') return <LoginView onLogin={handleLogin} setCurrentView={handleViewChange} pushToast={addToast} />
    if (currentView === 'billing') return <BillingView plan={selectedPlan} onSuccess={() => { setIsLoggedIn(true); addToast('Payment processed!', 'success'); handleViewChange('dashboard') }} setCurrentView={handleViewChange} />
    if (currentView === 'dashboard') return <DashboardView datasets={datasets} onViewDataset={(datasetId) => handleViewChange({view: 'dataset-detail', datasetId})} onUpload={() => handleViewChange('dataset-upload')} showTrialBanner={showTrialBanner} onDismissTrial={() => setShowTrialBanner(false)} setCurrentView={handleViewChange} pushToast={addToast} currentUser={currentUser} />
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
      {shouldShowNav && (
        <Navigation
          currentView={currentView}
          isLoggedIn={isLoggedIn}
          isMenuOpen={isMenuOpen}
          onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
          onNavigate={handleViewChange}
          onLogout={handleLogout}
        />
      )}

      {/* Loading Overlay */}
      {isTransitioning && <LoadingOverlay isLoading={true} />}

      {/* Main Content */}
      <main className="relative z-10">
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
            <button onClick={() => setShowChatbot(false)} style={{ position: 'absolute', right: 8, top: 8, zIndex: 70, background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>✕</button>
            <AIChatbot />
          </div>
        </div>
      )}

      {/* Global floating ChatBot (persistent bubble) */}
      <ChatBot />

    </div>
  )
}

export default App
