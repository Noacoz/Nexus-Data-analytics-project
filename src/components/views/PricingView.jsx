import React, { useState } from 'react'

export default function PricingView({ onSelectPlan }) {
  const [isAnnual, setIsAnnual] = useState(false)

  const plans = [
    {
      name: 'Starter',
      monthlyPrice: 29,
      annualPrice: 290,
      description: 'For individuals and small teams',
      features: [
        'Up to 5 datasets',
        '1 GB storage',
        'Basic insights',
        'Email support',
        '1 team member'
      ],
      highlighted: false
    },
    {
      name: 'Professional',
      monthlyPrice: 99,
      annualPrice: 990,
      description: 'For growing companies',
      features: [
        'Unlimited datasets',
        '100 GB storage',
        'Advanced AI insights',
        'Priority support',
        'Up to 10 team members',
        'Custom integrations',
        'Advanced security'
      ],
      highlighted: true
    },
    {
      name: 'Enterprise',
      monthlyPrice: 299,
      annualPrice: 2990,
      description: 'For large organizations',
      features: [
        'Everything in Professional',
        'Unlimited storage',
        'Custom models',
        'Dedicated support',
        'Unlimited team members',
        'SLA guarantee',
        'On-premise option'
      ],
      highlighted: false
    }
  ]

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-slate-400 mb-8">Choose the plan that's right for you</p>

          {/* Billing Toggle */}
          <div className="flex justify-center gap-4 items-center bg-slate-900/50 border border-slate-800 rounded-lg p-2 w-fit mx-auto">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 rounded font-medium transition-all ${
                !isAnnual
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 rounded font-medium transition-all ${
                isAnnual
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Annual
            </button>
            {isAnnual && (
              <span className="ml-2 px-3 py-1 bg-green-600/20 text-green-400 text-sm font-medium rounded">
                Save 17%
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative p-8 rounded-lg border transition-all ${
                plan.highlighted
                  ? 'border-indigo-600 bg-indigo-600/10 shadow-lg shadow-indigo-900/30'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-sm font-semibold rounded-full">
                  Most Popular
                </div>
              )}

              <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
              <p className="text-slate-400 text-sm mb-6">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold">
                  ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                </span>
                <span className="text-slate-400 ml-2">
                  {isAnnual ? '/year' : '/month'}
                </span>
              </div>

              <button
                onClick={() => onSelectPlan(plan.name)}
                className={`w-full py-3 font-semibold rounded-lg mb-8 transition-all ${
                  plan.highlighted
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Get Started
              </button>

              <div className="space-y-4">
                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex gap-3">
                    <span className="text-indigo-400 flex-shrink-0">✓</span>
                    <span className="text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-slate-400 mb-4">All plans include a 14-day free trial. No credit card required.</p>
        </div>
      </div>
    </div>
  )
}
