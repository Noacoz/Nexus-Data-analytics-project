import React, { useState } from 'react'
import { sidebarItems, sidebarSections } from '../sidebarConfig'

const normalizePath = (path) => {
  if (!path) return '/'
  return path.replace(/\/+$|^\s+|\s+$/g, '') || '/'
}

export default function Sidebar({ currentPath = '/', onNavigate, isOpen = false, onClose }) {
  const [expandedSections, setExpandedSections] = useState({ core: true, operations: true, admin: true })
  const normalizedCurrent = normalizePath(currentPath)

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const renderSidebar = () => (
    <div className="flex h-full flex-col justify-between bg-slate-950/95 border-r border-white/10 backdrop-blur-xl overflow-y-auto">
      <div className="px-6 py-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white text-lg">N</div>
          <div>
            <p className="text-sm font-semibold text-white">Nexus Analytics</p>
            <p className="text-xs text-slate-500">Enterprise data intelligence</p>
          </div>
        </div>
        <div className="space-y-6">
          {sidebarSections.map(section => {
            const items = sidebarItems.filter(item => item.section === section.key)
            return (
              <div key={section.key}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  className="w-full flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold mb-3"
                >
                  <span>{section.title}</span>
                  <span className="text-slate-500">{expandedSections[section.key] ? '−' : '+'}</span>
                </button>
                {expandedSections[section.key] && (
                  <div className="space-y-2">
                    {items.map(item => {
                      const isActive = normalizePath(item.route) === normalizedCurrent
                      return (
                        <button
                          key={item.route}
                          onClick={() => {
                            onNavigate(item.route)
                            onClose?.()
                          }}
                          className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${isActive ? 'bg-violet-500/15 text-violet-200 border border-violet-500/20' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                        >
                          <span className="w-8 h-8 rounded-xl bg-slate-900/80 flex items-center justify-center text-base">{item.icon}</span>
                          <span className="text-sm font-medium truncate">{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <div className="px-6 pb-6">
        <div className="rounded-3xl bg-slate-900/80 border border-white/10 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Workspace status</p>
          <p className="text-sm text-slate-300">Connected • Secure • Observability ready</p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-72 z-40">
        {renderSidebar()}
      </aside>
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 w-72 z-50">
            {renderSidebar()}
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-2xl bg-slate-900/90 px-4 py-2 text-sm font-semibold text-white border border-white/10"
          >
            Close
          </button>
        </div>
      )}
    </>
  )
}
