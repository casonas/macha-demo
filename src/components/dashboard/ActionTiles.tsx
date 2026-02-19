import React from 'react';
import { useNavigate } from 'react-router-dom';

const actions = [
  { label: 'New Inspection', href: '/create-assessment', icon: '🛡️', description: 'Start a new security assessment' },
  { label: 'Past Assessments', href: '/past-assessments', icon: '📋', description: 'Review completed reports' },
  { label: 'User Profile', href: '/profile', icon: '👤', description: 'Manage account settings' },
  { label: 'Pricing Plans', href: '/pricing', icon: '💼', description: 'View available plans' },
];

export default function ActionTiles() {
  const navigate = useNavigate();

  return (
    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 gap-3">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={() => navigate(action.href)}
            className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md transition-all duration-200 text-left w-full"
          >
            <span className="text-2xl">{action.icon}</span>
            <div>
              <span className="text-sm font-semibold text-slate-800 block">{action.label}</span>
              <span className="text-xs text-slate-500">{action.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}