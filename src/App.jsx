/**
 * App.jsx
 * Root application component for Nexus Analytics Platform
 */

import { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";

function App() {
  // For demo/development purposes, use a fixeds user ID
  // In production, this would come from authentication
  const [userId] = useState("demo-user-" + Math.random().toString(36).substr(2, 9));
  const [isReady, setIsReady] = useState(true);

  useEffect(() => {
    // Initialize app - check API connectivity, auth, etc.
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Nexus Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard userId={userId} />
    </div>
  );
}

export default App;

  useEffect(() => {
    const openHandler = () => setShowChatbot(true)
    window.addEventListener('open-chatbot', openHandler)
    return () => window.removeEventListener('open-chatbot', openHandler)
  }, [])

  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('auth_success')) {
        window.history.replaceState({}, '', '/');
        try {
          const { user } = await API.getMe();
          if (user) {
            setCurrentUser(user);
            setIsLoggedIn(true);
            const { datasets: ds } = await API.getDatasets();
            setDatasets(ds || []);
            setCurrentView('dashboard');
            addToast(`Welcome back, ${user.name}!`, 'success')
          }
        } catch {}
        setIsCheckingAuth(false);
        return;
      }

      const authError = params.get('auth_error');
      if (authError) {
        window.history.replaceState({}, '', '/');
        addToast('Sign-in failed. Please try again.', 'error');
        setIsCheckingAuth(false);
        return;
      }

      try {
        const { user } = await API.getMe();
        if (user) {
          setCurrentUser(user);
          setIsLoggedIn(true);
          const { datasets: ds } = await API.getDatasets();
          setDatasets(ds || []);
        }
      } catch {}
      setIsCheckingAuth(false);
    };
    init();
  }, [])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
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
    setTimeout(() => {
      setCurrentView(newView)
      setIsTransitioning(false)
    }, 300)
  }, [currentView])

  const handlePlanSelection = useCallback((plan) => {
    setSelectedPlan(plan)
    handleViewChange('billing')
  }, [handleViewChange])

  const handleLogin = useCallback(async (user) => {
    setCurrentUser(user)
    setIsLoggedIn(true)
    try {
      const { datasets: ds } = await API.getDatasets();
      if (ds) setDatasets(ds)
    } catch {}
    addToast('Login successful!', 'success')
    handleViewChange('dashboard')
  }, [addToast, handleViewChange])

  const handleLogout = useCallback(async () => {
    await API.signout();
    setIsLoggedIn(false)
    setCurrentUser(null)
    setDatasets([])
    addToast('Signed out', 'info')
    handleViewChange('home')
  }, [addToast, handleViewChange])

  const handleAddDataset = useCallback((dataset) => {
    setDatasets(prev => [{ id: Date.now(), ...dataset, createdAt: new Date().toISOString(), visualizations: 0, insights: 0, comments: 0 }, ...prev])
    addToast(`Dataset "${dataset.name}" uploaded successfully!`, 'success')
    handleViewChange('dashboard')
  }, [addToast, handleViewChange])

  const handleAddTeamMember = useCallback((member) => {
    addToast(`Invited ${member.email} to the team`, 'success')
  }, [addToast])

  const handleContactSubmit = useCallback((data) => {
    addToast('Thank you! We\'ll get back to you soon.', 'success')
  }, [addToast])

  const shouldShowNav = !['billing', 'dashboard', 'login', 'profile', 'dataset-detail', 'dataset-upload', 'team', 'reports', 'settings', 'support'].includes(currentView) && typeof currentView === 'string'
  const shouldShowFooter = shouldShowNav || currentView === 'home' || currentView === 'product' || (typeof currentView === 'string' && ['terms', 'privacy'].includes(currentView))

  const renderView = () => {
    if (currentView === 'home') return <HomeView onExplore={() => handleViewChange('product')} onGetStarted={() => handleViewChange('login')} />
    if (currentView === 'product') return <ProductView />
    if (currentView === 'pricing') return <PricingView onSelectPlan={handlePlanSelection} />
    if (currentView === 'contact') return <ContactView onSubmit={handleContactSubmit} />
    if (currentView === 'login') return <LoginView onLogin={handleLogin} setCurrentView={handleViewChange} pushToast={addToast} />
    if (currentView === 'billing') return <BillingView plan={selectedPlan} onSuccess={() => { setIsLoggedIn(true); addToast('Payment processed!', 'success'); handleViewChange('dashboard') }} setCurrentView={handleViewChange} />
    if (currentView === 'dashboard') return <DashboardView datasets={datasets} onViewDataset={(id) => { setCurrentView(Object.assign(Object.create(Object.getPrototypeOf(currentView)), currentView, { view: 'dataset-detail', datasetId: id })) }} onUpload={() => handleViewChange('dataset-upload')} showTrialBanner={showTrialBanner} onDismissTrial={() => setShowTrialBanner(false)} setCurrentView={handleViewChange} pushToast={addToast} currentUser={currentUser} />
    if (currentView === 'profile') return <ProfileView isLoggedIn={isLoggedIn} onLogout={handleLogout} setCurrentView={handleViewChange} pushToast={addToast} currentUser={currentUser} />
    if (typeof currentView === 'object' && currentView.view === 'dataset-detail') return <DatasetDetailView datasetId={currentView.datasetId} datasets={datasets} onBack={() => handleViewChange('dashboard')} />
    if (currentView === 'dataset-upload') return <DatasetUploadView onUpload={handleAddDataset} onCancel={() => handleViewChange('dashboard')} />
    if (currentView === 'team') return <TeamView onInvite={handleAddTeamMember} setCurrentView={handleViewChange} />
    if (currentView === 'reports') return <ReportsView setCurrentView={handleViewChange} />
    if (currentView === 'settings') return <SettingsView settings={workspaceSettings} onSave={(settings) => { setWorkspaceSettings(settings); addToast('Settings saved!', 'success') }} setCurrentView={handleViewChange} />
    if (currentView === 'support') return <SupportView setCurrentView={handleViewChange} />
    if (currentView === 'usecases') return <UseCasesView setCurrentView={handleViewChange} />
    if (currentView === 'terms') return <TermsView setCurrentView={handleViewChange} />
    if (currentView === 'privacy') return <PrivacyView setCurrentView={handleViewChange} />
    return <NotFoundView onBack={() => handleViewChange('home')} />
  }

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      {/* Background Effects - Always rendered, fixed position */}
      <AuroraBackground />
      <FilmGrainOverlay />
      
      {/* Navigation - Conditionally shown */}
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

      {/* Loading Overlay - Fixed position, conditionally visible */}
      {isTransitioning && <LoadingOverlay isLoading={true} />}

      {/* Main Content */}
      <main className="relative z-10">
        {renderView()}
      </main>

      {/* Footer - Conditionally shown */}
      {shouldShowFooter && <Footer onNavigate={handleViewChange} />}

      {/* Toast Notifications - Always available */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* AI Chatbot - mounted once and toggled via custom event */}
      {showChatbot && (
        <div style={{position:'fixed',right:20,bottom:20,zIndex:60,width:420,maxWidth:'90vw',boxShadow:'0 10px 30px rgba(2,6,23,0.6)'}}>
          <div style={{background:'#071428',borderRadius:12,overflow:'hidden'}}>
            <button onClick={()=>setShowChatbot(false)} style={{position:'absolute',right:8,top:8,zIndex:70,background:'transparent',border:'none',color:'#9ca3af',cursor:'pointer'}}>✕</button>
            <AIChatbot />
          </div>
        </div>
      )}

      {/* Global floating ChatBot (persistent bubble) */}
      <ChatBot />
    </div>
  )
}
