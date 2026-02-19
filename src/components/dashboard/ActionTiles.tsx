import React from 'react';

const actions = [
  { label: 'New Inspection', href: '/create-assessment' },
  { label: 'View Reports', href: '/reports' },
  { label: 'Site Map', href: '/map' },
  { label: 'Settings', href: '/settings' },
];

export default function ActionTiles() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {actions.map((action, i) => (
        <a
          key={i}
          href={action.href}
          className="flex items-center justify-center p-6 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md transition-all duration-200 text-center"
        >
          <span className="text-lg font-semibold text-slate-700 hover:text-emerald-700">{action.label}</span>
        </a>
      ))}
    </div>
  );
}