import React from 'react'

export default function PrivacyView({ setCurrentView }) {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:-translate-x-1 transition-transform">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back
        </button>
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-slate-400 text-sm mb-12">Last updated: January 15, 2024</p>

        <div className="space-y-12 text-slate-300">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you create an account, subscribe to our service, or contact us for support. This includes your name, email address, and billing information.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
            <p>We use the information we collect to provide, maintain, and improve our service, process transactions, and send you technical notices and support messages. We may also use your information to comply with legal obligations.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Data Security</h2>
            <p>We implement appropriate technical and organizational measures designed to protect personal information against unauthorized access, alteration, disclosure, or destruction. Your data is encrypted both in transit and at rest.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal information. You may also have the right to data portability and the right to object to certain processing of your data. To exercise these rights, please contact us at privacy@nexusanalytics.com.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
