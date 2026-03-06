import React from 'react'

export default function NotFoundView({ onBack }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text mb-4">
          404
        </h1>
        <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
        <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist. Let's get you back on track.
        </p>
        <button
          onClick={onBack}
          className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-cyan-700 transition-all"
        >
          Back to Home
        </button>
      </div>
    </div>
  )
}
