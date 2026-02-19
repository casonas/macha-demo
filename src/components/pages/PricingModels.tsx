import React from 'react';
import AppShell from '../layout/AppShell';
import './pages.css';

const plans = [
  {
    name: 'Starter',
    price: '$99',
    period: '/mo',
    description: 'Perfect for small facilities and single-site operations.',
    features: [
      '1 facility',
      'Core security assessments',
      'Basic digital reports',
      'Email support',
      '30-day report history'
    ],
    highlight: false,
    cta: 'Get Started'
  },
  {
    name: 'Professional',
    price: '$299',
    period: '/mo',
    description: 'Best for growing organizations with multiple locations.',
    features: [
      'Up to 10 facilities',
      'Advanced assessments & scoring',
      'Executive summary reports',
      'PDF export & sharing',
      'Role-based access control',
      'Priority support',
      'Unlimited report history'
    ],
    highlight: true,
    cta: 'Start Free Trial'
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations requiring full customization.',
    features: [
      'Unlimited facilities',
      'Custom assessment templates',
      'White-label reports',
      'SSO / SAML integration',
      'API access',
      'Dedicated account manager',
      'Custom onboarding & training',
      'SLA guarantee'
    ],
    highlight: false,
    cta: 'Contact Sales'
  }
];

export const PricingModels: React.FC = () => (
  <AppShell title="Pricing">
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Simple, Transparent Pricing</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">Choose the plan that fits your organization. All plans include our core security assessment platform.</p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <article
            key={plan.name}
            className={`relative rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:shadow-lg flex flex-col overflow-hidden ${
              plan.highlight ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-slate-200'
            }`}
          >
            {plan.highlight && (
              <div className="bg-emerald-600 text-white text-center py-2 text-xs font-bold uppercase tracking-wider">
                Most Popular
              </div>
            )}
            <div className="p-6 sm:p-8 flex flex-col flex-1 text-center">
              <div className="mb-5">
                <h3 className="text-xl font-extrabold text-slate-900">{plan.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                  {plan.period && <span className="text-sm font-medium text-slate-500">{plan.period}</span>}
                </div>
              </div>

              <ul className="space-y-3 flex-1 mb-6 text-left mx-auto">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button className={`w-full rounded-xl py-3.5 font-bold text-sm transition-all duration-200 ${
                plan.highlight
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg'
                  : 'border border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50'
              }`}>
                {plan.cta}
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* FAQ/Contact */}
      <div className="text-center bg-slate-50 rounded-2xl p-8 border border-slate-200">
        <p className="text-sm text-slate-600">
          Need a custom solution? <strong>Contact our team</strong> for a personalized quote and demo.
        </p>
        <a href="mailto:info@machagroup.com" className="inline-block mt-3 text-sm font-bold text-emerald-600 hover:text-emerald-700">
          info@machagroup.com →
        </a>
      </div>
    </div>
  </AppShell>
);

export default PricingModels;