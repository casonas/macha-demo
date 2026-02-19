import React from 'react';
import AppShell from '../layout/AppShell';
import './pages.css';

const plans = [
  { name: 'Starter', price: '$99', period: '/mo', points: ['1 site', 'Core assessments', 'Email support'], highlight: false },
  { name: 'Growth', price: '$299', period: '/mo', points: ['5 sites', 'Advanced reporting', 'Role permissions'], highlight: true },
  { name: 'Enterprise', price: 'Custom', period: '', points: ['Unlimited sites', 'SSO/OAuth', 'Dedicated onboarding'], highlight: false }
];

export const PricingModels: React.FC = () => (
  <AppShell title="Pricing Models">
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-slate-900">Choose Your Plan</h3>
        <p className="text-sm text-slate-500 mt-2">Scale your security assessments with the right plan</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <article
            key={plan.name}
            className={`relative rounded-2xl border bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col ${
              plan.highlight ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-slate-200'
            }`}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Popular</span>
            )}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                {plan.period && <span className="text-sm font-medium text-slate-500">{plan.period}</span>}
              </div>
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              {plan.points.map(p => (
                <li key={p} className="flex items-center gap-2 text-sm text-slate-700">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {p}
                </li>
              ))}
            </ul>
            <button className={`w-full rounded-xl py-3 font-bold text-sm transition-all duration-200 ${
              plan.highlight
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'border border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50'
            }`}>
              Choose {plan.name}
            </button>
          </article>
        ))}
      </div>
    </div>
  </AppShell>
);

export default PricingModels;