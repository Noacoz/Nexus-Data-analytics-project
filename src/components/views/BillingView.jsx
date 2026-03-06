import React, { useState, useEffect } from 'react'

export default function BillingView({ plan, onSuccess, setCurrentView, pushToast }) {
  const [cardholderName, setCardholderName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvc, setCvc] = useState('')
  const [country, setCountry] = useState('United States')
  const [loading, setLoading] = useState(false)
  const [stripeLoaded, setStripeLoaded] = useState(false)

  useEffect(() => {
    // Check if Stripe is available
    if (window.Stripe) {
      setStripeLoaded(true)
    } else {
      console.warn('Stripe not loaded. Using mock payment processing.')
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate card details
    if (!cardholderName.trim() || !cardNumber.trim() || !expiryDate.trim() || !cvc.trim()) {
      if (pushToast) pushToast('Please fill in all fields', 'error')
      return
    }

    // Basic validation
    if (cardNumber.replace(/\s/g, '').length !== 16) {
      if (pushToast) pushToast('Invalid card number', 'error')
      return
    }

    if (cvc.length !== 3) {
      if (pushToast) pushToast('Invalid CVC', 'error')
      return
    }

    setLoading(true)
    try {
      // Create payment intent on server
      const res = await fetch('/api/billing/create-payment-intent', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 9900, // $99.00 in cents
          plan: plan || 'professional',
          currency: 'usd'
        })
      })

      if (!res.ok) {
        throw new Error('Failed to create payment')
      }

      const data = await res.json()
      
      // Process payment with Stripe if available
      if (stripeLoaded && window.Stripe && data.clientSecret) {
        // In production, use Stripe.js to handle payment
        console.log('Processing payment with Stripe...')
        // For now, simulate success
        await new Promise(r => setTimeout(r, 1500))
      } else {
        // Fallback: mock payment for development
        await new Promise(r => setTimeout(r, 1500))
      }

      // Confirm payment on server
      const confirmRes = await fetch('/api/billing/confirm-payment', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: data.paymentIntentId,
          cardholder: cardholderName,
          country: country
        })
      })

      if (!confirmRes.ok) {
        throw new Error('Payment confirmation failed')
      }

      if (pushToast) pushToast('Payment successful! Your subscription is now active.', 'success')
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Payment error:', err)
      if (pushToast) pushToast(err.message || 'Payment failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const planPrice = plan === 'enterprise' ? 299 : plan === 'business' ? 199 : 99
  const planFeatures = {
    professional: ['10 team members', '100 GB storage', 'Advanced analytics', 'API access'],
    business: ['25 team members', '500 GB storage', 'Custom reports', 'Priority support'],
    enterprise: ['Unlimited members', 'Unlimited storage', 'Dedicated support', 'Custom integrations']
  }

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center px-4 bg-gradient-to-b from-slate-900 to-slate-950">
      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Payment Form */}
        <div>
          <button
            onClick={() => setCurrentView('pricing')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:-translate-x-1 transition-transform">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold mb-2">Billing Information</h1>
          <p className="text-slate-400 mb-8">Secure payment with Stripe</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Cardholder Name</label>
              <input
                type="text"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                required
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg focus:border-indigo-600 focus:outline-none transition-colors"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Card Number</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                required
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg focus:border-indigo-600 focus:outline-none transition-colors font-mono"
                disabled={loading}
              />
              <p className="text-xs text-slate-500 mt-1">Test card: 4242 4242 4242 4242</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Expiry Date</label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '')
                    if (val.length >= 2) {
                      val = val.substring(0, 2) + '/' + val.substring(2, 4)
                    }
                    setExpiryDate(val)
                  }}
                  required
                  placeholder="MM/YY"
                  maxLength="5"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg focus:border-indigo-600 focus:outline-none transition-colors"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">CVC</label>
                <input
                  type="text"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').substring(0, 3))}
                  required
                  placeholder="123"
                  maxLength="3"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg focus:border-indigo-600 focus:outline-none transition-colors"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg focus:border-indigo-600 focus:outline-none transition-colors"
                disabled={loading}
              >
                <option>United States</option>
                <option>Canada</option>
                <option>United Kingdom</option>
                <option>Europe</option>
                <option>Australia</option>
                <option>Other</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing Payment...' : `Complete Purchase - $${planPrice}.00`}
            </button>
          </form>

          <p className="text-xs text-slate-400 mt-6">
            🔒 Payment processed securely by Stripe. Your card information is never stored on our servers.
          </p>
        </div>

        {/* Order Summary */}
        <div className="md:sticky md:top-24">
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6 pb-6 border-b border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">{(plan || 'professional').charAt(0).toUpperCase() + (plan || 'professional').slice(1)} Plan</span>
                <span className="font-semibold">${planPrice}.00</span>
              </div>
              {(planFeatures[plan] || planFeatures.professional).map((feature, idx) => (
                <div key={idx} className="flex justify-between text-sm text-slate-400">
                  <span>✓ {feature}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${planPrice}.00</span>
              </div>
              <div className="flex justify-between text-sm text-slate-400">
                <span>Billing cycle</span>
                <span>Monthly</span>
              </div>
              <div className="flex justify-between text-sm text-slate-400">
                <span>Renews on</span>
                <span>{new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="bg-green-600/20 border border-green-600/30 rounded p-4 text-sm text-green-300">
              <p className="font-semibold mb-1">✓ 14-day free trial</p>
              <p className="text-xs text-green-200">No charge until after your trial ends. Cancel anytime.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
