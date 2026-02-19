import React from 'react';

export interface AssessmentRow {
  id: string;
  siteLocation: string;
  inspector: string;
  lastActivity: string;
  riskLevel: 'Low' | 'Moderate' | 'High';
}

export default function RecentAssessmentsTable({ rows }: { rows: AssessmentRow[] }) {
  const riskColors = {
    Low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Moderate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    High: 'bg-red-100 text-red-700 border-red-200'
  };

  return (
    <div>
      <h3 className="text-3xl font-bold text-slate-900 mb-2 text-center">Recent Assessments</h3>
      <p className="text-sm text-slate-500 mb-4 text-center">Legend: <span className="font-semibold">High</span> = score &lt; 70 (elevated risk). <span className="font-semibold">12%</span> indicates change vs previous quarter. "Last assessment" shows the most recent assessment status.</p>
      <div className="space-y-3 divide-y divide-slate-100">
        {rows.map((row, idx) => {
          const initials = (row.siteLocation || '')
            .split(' ')
            .map((s) => s[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <div key={row.id} className={`list-row group cursor-pointer ${idx === 0 ? 'pt-0' : ''}`}>
                <div className="flex items-center gap-4 flex-1">
                  <div className="initials">{(row.siteLocation || '').toLowerCase().startsWith('site') ? 'S' : (initials || 'NA')}</div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{row.siteLocation}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{row.inspector}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-tight">Last Activity</p>
                  <p className="text-sm font-semibold text-slate-600 mt-1">{row.lastActivity}</p>
                </div>
                <span className={`status-pill border ${riskColors[row.riskLevel]}`}>
                  {row.riskLevel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}