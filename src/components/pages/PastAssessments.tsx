import React, { useMemo } from 'react';
import AppShell from '../layout/AppShell';
import { listAssessments } from '../../services/data';
import './pages.css';

export const PastAssessments: React.FC = () => {
  const rows = useMemo(() => listAssessments(), []);

  const statusColors: Record<string, string> = {
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'in-progress': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    draft: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <AppShell title="Past Assessments">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Assessment History</h3>
            <p className="text-sm text-slate-500 mt-1">{rows.length} total assessments</p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-lg font-semibold text-slate-700">No assessments yet</p>
            <p className="text-sm text-slate-500 mt-2">Create a new assessment to get started.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{r.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{r.name}</td>
                    <td className="px-6 py-4">
                      <span className={`status-pill border ${statusColors[r.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{r.score != null ? `${r.score}%` : '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(r.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default PastAssessments;