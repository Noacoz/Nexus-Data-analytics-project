import React from 'react'

export default function ProductView() {
  const features = [
    {
      title: 'Smart Analysis',
      description: 'AI automatically identifies trends, anomalies, and correlations in your data.'
    },
    {
      title: 'Auto Visualizations',
      description: 'Get the right chart for your data, without manual configuration.'
    },
    {
      title: 'Natural Language',
      description: 'Ask questions in plain English and get instant answers.'
    }
  ]

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-6">Powerful Analytics Made Simple</h1>
        <p className="text-xl text-slate-400 mb-16">Nexus uses advanced AI to extract insights from your data without requiring data science expertise.</p>
        
        <div className="space-y-12">
          {features.map((feature, idx) => (
            <div key={idx} className="flex gap-8 items-center">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                {idx + 1}
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">{feature.title}</h2>
                <p className="text-slate-400 text-lg">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
