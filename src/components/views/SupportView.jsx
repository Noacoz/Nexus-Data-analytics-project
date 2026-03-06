import React, { useState } from 'react'

export default function SupportView({ setCurrentView }) {
  const [expandedFaq, setExpandedFaq] = useState(null)

  const faqs = [
    {
      question: 'What file formats do you support?',
      answer: 'We support CSV, JSON, Parquet, Excel, and many other formats. You can also connect directly to databases.'
    },
    {
      question: 'How secure is my data?',
      answer: 'Your data is encrypted both in transit and at rest. We use enterprise-grade security and comply with GDPR, HIPAA, and SOC 2.'
    },
    {
      question: 'Can I export my analysis?',
      answer: 'Yes! You can export as PDF, PNG, CSV, or connect directly to your favorite BI tools.'
    }
  ]

  const kbArticles = [
    { title: 'Getting Started with Nexus', description: 'A quick guide to upload your first dataset and generate insights.' },
    { title: 'Advanced Analytics Guide', description: 'Learn how to use custom models and advanced features.' },
    { title: 'API Documentation', description: 'Integrate Nexus with your applications using our RESTful API.' },
    { title: 'Security & Compliance', description: 'Information about data security, encryption, and compliance certifications.' },
    { title: 'Team Management', description: 'Manage team members, roles, and permissions.' },
  ]

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setCurrentView('dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:-translate-x-1 transition-transform">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back
        </button>
        <h1 className="text-4xl font-bold mb-4">Support Center</h1>
        <p className="text-slate-400 text-lg mb-12">Find answers and get help when you need it</p>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-8 text-center hover:border-indigo-600/30 transition-all cursor-pointer">
            <p className="text-4xl mb-4">📧</p>
            <h3 className="text-xl font-bold mb-2">Email Support</h3>
            <p className="text-slate-400 mb-4">support@nexusanalytics.com</p>
            <p className="text-sm text-slate-500">Response time: 24 hours</p>
          </div>
          <div onClick={() => window.dispatchEvent(new CustomEvent('nexus:open-chat'))} className="bg-slate-900/50 border border-slate-800 rounded-lg p-8 text-center hover:border-indigo-600/30 transition-all cursor-pointer">
            <p className="text-4xl mb-4">💬</p>
            <h3 className="text-xl font-bold mb-2">Live Chat</h3>
            <p className="text-slate-400 mb-4">Available 24/7 for pro users</p>
            <p className="text-sm text-slate-500">Chat now</p>
          </div>
        </div>

        {/* Knowledge Base */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Knowledge Base</h2>
          <div className="space-y-3">
            {kbArticles.map((article, idx) => (
              <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-all cursor-pointer">
                <h3 className="font-semibold mb-2">{article.title}</h3>
                <p className="text-slate-400 text-sm">{article.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full p-6 flex justify-between items-center hover:bg-slate-800/50 transition-colors text-left"
                >
                  <span className="font-semibold">{faq.question}</span>
                  <span className="text-indigo-400">{expandedFaq === idx ? '−' : '+'}</span>
                </button>
                {expandedFaq === idx && (
                  <div className="px-6 py-4 border-t border-slate-700 bg-slate-800/20">
                    <p className="text-slate-300">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
