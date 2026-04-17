import React from 'react'

export default function ViewShell({ title, subtitle, children, actions }) {
  return (
    <div className="min-h-screen bg-[#09090B] p-6 lg:pl-0">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">{title}</h1>
          {subtitle && <p className="text-zinc-400 mt-2 max-w-2xl">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  )
}
