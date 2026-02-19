import React from 'react';
import AppShell from '../layout/AppShell';
import './pages.css';

const plans = [
  { name: 'Starter', price: '$99/mo', points: ['1 site', 'Core assessments', 'Email support'] },
  { name: 'Growth', price: '$299/mo', points: ['5 sites', 'Advanced reporting', 'Role permissions'] },
  { name: 'Enterprise', price: 'Custom', points: ['Unlimited sites', 'SSO/OAuth', 'Dedicated onboarding'] }
];

export const PricingModels: React.FC = () => (
  <AppShell title="Pricing Models">
    <div className="grid-3">
      {plans.map(plan => (
        <article key={plan.name} className="panel">
          <h3>{plan.name}</h3>
          <p className="kpi">{plan.price}</p>
          <ul>{plan.points.map(p => <li key={p}>{p}</li>)}</ul>
          <button className="primary-btn">Choose {plan.name}</button>
        </article>
      ))}
    </div>
  </AppShell>
);

export default PricingModels;