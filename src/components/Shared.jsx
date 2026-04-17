import React, { useState, useEffect, useRef } from 'react';

// Toast Component
export function Toast({ id, message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const typeStyles = {
    success: 'border-l-4 border-green-500 bg-green-500 bg-opacity-10',
    error: 'border-l-4 border-red-500 bg-red-500 bg-opacity-10',
    info: 'border-l-4 border-blue-500 bg-blue-500 bg-opacity-10',
    warning: 'border-l-4 border-yellow-500 bg-yellow-500 bg-opacity-10',
  };

  const dotColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  return (
    <div className={`glass rounded-lg p-4 mb-3 flex items-center gap-3 animate-slideInRight ${typeStyles[type] || typeStyles.info}`}>
      <div className={`w-2 h-2 rounded-full ${dotColors[type] || dotColors.info}`}></div>
      <span className="text-sm text-slate-100 flex-1">{message}</span>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-100 text-lg">✕</button>
    </div>
  );
}

export function ToastContainer({ toasts, onRemoveToast }) {
  return (
    <div className="fixed top-5 right-5 z-1000 max-w-md">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => onRemoveToast(toast.id)}
        />
      ))}
    </div>
  );
}

// Loading Overlay
export function LoadingOverlay({ isLoading }) {
  return (
    <div className={`fixed inset-0 z-9999 loading-overlay flex items-center justify-center transition-opacity duration-300 ${!isLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-cyan-400 animate-spin"></div>
        <p className="text-slate-300">Loading...</p>
      </div>
    </div>
  );
}

// Aurora Background
export function AuroraBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div 
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl mix-blend-screen" 
        style={{ 
          background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)',
          top: '-15%', 
          left: '-10%', 
          animation: 'aurora-drift 20s ease-in-out infinite' 
        }}
      />
      <div 
        className="absolute w-[450px] h-[450px] rounded-full blur-3xl mix-blend-screen" 
        style={{ 
          background: 'radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)',
          top: '35%', 
          right: '-12%', 
          animation: 'aurora-drift 20s ease-in-out infinite 7s' 
        }}
      />
      <div 
        className="absolute w-[480px] h-[480px] rounded-full blur-3xl mix-blend-screen" 
        style={{ 
          background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)',
          bottom: '-10%', 
          left: '25%', 
          animation: 'aurora-drift 20s ease-in-out infinite 14s' 
        }}
      />
    </div>
  );
}

// Film Grain Overlay
export function FilmGrainOverlay() {
  return <div className="film-grain"></div>;
}

// Utility: CinematicText
export function CinematicText({ text, className = '', delay = 0, stagger = 0.1, typewriter = false }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  if (typewriter) {
    return (
      <div ref={ref} className={`${className} typewriter`} style={{ animationDelay: `${delay}s`, width: isVisible ? '100%' : '0%' }}>
        {text}
      </div>
    );
  }

  const words = text.split(' ');
  return (
    <div ref={ref} className={className}>
      {words.map((word, i) => (
        <div 
          key={i} 
          className="text-reveal-container" 
          style={{ 
            animationDelay: `${delay + i * stagger}s`,
            opacity: isVisible ? 1 : undefined,
            transform: isVisible ? 'translateY(0)' : undefined,
            transition: 'all 0.8s ease-out'
          }}
        >
          <span>{word}&nbsp;</span>
        </div>
      ))}
    </div>
  );
}

// Utility: ParallaxElement
export function ParallaxElement({ children, speed = 0.5, className = '' }) {
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffsetY(window.scrollY * speed);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div className={`parallax-element ${className}`} style={{ transform: `translateY(${offsetY}px)` }}>
      {children}
    </div>
  );
}

// Utility: useScrollAnimation hook
export function useScrollAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}

// Utility: FadeInUp
export function FadeInUp({ children, delay = 0, className = '' }) {
  const [ref, isVisible] = useScrollAnimation();
  return (
    <div ref={ref} className={`${className} ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

// Utility: SlideInLeft
export function SlideInLeft({ children, delay = 0, className = '' }) {
  const [ref, isVisible] = useScrollAnimation();
  return (
    <div ref={ref} className={`${className} ${isVisible ? 'animate-slideInLeft' : 'opacity-0'}`} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

// Utility: ScaleIn
export function ScaleIn({ children, delay = 0, className = '' }) {
  const [ref, isVisible] = useScrollAnimation();
  return (
    <div ref={ref} className={`${className} ${isVisible ? 'animate-scaleIn' : 'opacity-0'}`} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

// Utility: StaggerContainer
export function StaggerContainer({ children, className = '', staggerDelay = 0.1 }) {
  const [ref, isVisible] = useScrollAnimation();
  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, i) =>
        React.cloneElement(child, { style: { animationDelay: isVisible ? `${i * staggerDelay}s` : '0s' } })
      )}
    </div>
  );
}

// Utility: TiltCard
export function TiltCard({ children, className = '', intensity = 10, onClick }) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRotateX((y - centerY) / centerY * intensity);
    setRotateY((centerX - x) / centerX * intensity);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      ref={cardRef}
      className={`${className} transition-transform duration-100 ${onClick ? 'cursor-pointer' : ''}`}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

// Utility: SpotlightCard
export function SpotlightCard({ children, className = '', onClick }) {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setX(e.clientX - rect.left);
    setY(e.clientY - rect.top);
  };

  return (
    <div
      ref={cardRef}
      className={`spotlight ${className}`}
      style={{ '--x': `${x}px`, '--y': `${y}px` }}
      onMouseMove={handleMouseMove}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Icon Component
export function Icon({ name, className = '' }) {
  const icons = {
    menu: '☰',
    x: '✕',
    check: '✓',
    layout: '⧉',
    zap: '⚡',
    shield: '🛡️',
    mail: '✉️',
    message: '💬',
    map: '📍',
    user: '👤',
    lock: '🔒',
    eye: '👁️',
    eyeOff: '🙈',
    arrowRight: '→',
    creditCard: '💳',
    calendar: '📅',
    database: '🗄️',
    chart: '📈',
    analytics: '🔍',
    security: '🔐',
    collaboration: '🤝',
    scale: '⚖️',
    download: '📥',
    upload: '📤',
    trash: '🗑️',
    edit: '✏️',
    share: '↗️',
    bell: '🔔',
    search: '🔍',
    grid: '🔲',
    list: '📋',
    plus: '➕',
    projects: '📊',
    team: '👥',
    settings: '⚙️',
  };

  return <span className={className}>{icons[name] || '•'}</span>;
}

// Footer Component
export function Footer({ setCurrentView }) {
  return (
    <footer className="glass border-t border-slate-800 py-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full brand-gradient animate-float"></div>
          <span className="font-semibold">Nexus Analytics</span>
        </div>
        <div className="flex gap-8">
          <button onClick={() => setCurrentView('terms')} className="text-slate-400 hover:text-white">Terms of Service</button>
          <button onClick={() => setCurrentView('privacy')} className="text-slate-400 hover:text-white">Privacy Policy</button>
          <button onClick={() => setCurrentView('contact')} className="text-slate-400 hover:text-white">Contact</button>
          <button onClick={() => setCurrentView('support')} className="text-slate-400 hover:text-white">Support</button>
        </div>
        <div className="text-slate-500 text-sm">© 2024 Nexus Analytics. All rights reserved.</div>
      </div>
    </footer>
  );
}
