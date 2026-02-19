import React from 'react';
import { useNavigate } from 'react-router-dom';

const ShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
);

const ClipboardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    <path d="M9 14l2 2 4-4"/>
  </svg>
);

const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const CreditCardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const actions = [
  { label: 'New Inspection', href: '/create-assessment', icon: ShieldIcon, description: 'Start a new security assessment' },
  { label: 'Past Assessments', href: '/past-assessments', icon: ClipboardIcon, description: 'Review completed reports' },
  { label: 'User Profile', href: '/profile', icon: UserIcon, description: 'Manage account settings' },
  { label: 'Pricing Plans', href: '/pricing', icon: CreditCardIcon, description: 'View available plans' },
];

export default function ActionTiles() {
  const navigate = useNavigate();

  return (
    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-4 text-center">Quick Actions</h3>
      <div className="grid grid-cols-1 gap-3">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <button
              key={i}
              onClick={() => navigate(action.href)}
              className="flex items-center justify-center gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md transition-all duration-200 text-center w-full"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700">
                <Icon />
              </span>
              <div>
                <span className="text-sm font-semibold text-slate-800 block">{action.label}</span>
                <span className="text-xs text-slate-500">{action.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}