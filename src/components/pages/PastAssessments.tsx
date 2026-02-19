import React, { useMemo } from 'react';
import AppShell from '../layout/AppShell';
import { listAssessments } from '../../services/data';
import { useNavigate } from 'react-router-dom';
import './pages.css';

export const PastAssessments: React.FC = () => {
  const rows = useMemo(() => listAssessments(), []);
  const navigate = useNavigate();

  const completed = rows.filter(r => r.status === 'completed');
  const inProgress = rows.filter(r => r.status !== 'completed');

  return (
    <AppShell title="Reports">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Assessment Reports</h2>
            <p className="text-sm text-slate-500 mt-1">{rows.length} total · {completed.length} completed · {inProgress.length} in progress</p>
          </div>
          <button
            onClick={() => navigate('/create-assessment')}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm"
          >
            + New Assessment
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-lg font-semibold text-slate-700">No assessments yet</p>
            <p className="text-sm text-slate-500 mt-2">Create a new assessment to generate your first report.</p>
            <button
              onClick={() => navigate('/create-assessment')}
              className="mt-5 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors"
            >
              Start First Assessment
            </button>
          </div>
        ) : (
          <>
            {/* Completed Assessments */}
            {completed.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100">
                  <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider">✅ Completed Reports ({completed.length})</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {completed.map(r => (
                    <div key={r.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900">{r.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {r.address && `📍 ${r.address} · `}
                          {r.buildingType && `🏢 ${r.buildingType} · `}
                          {new Date(r.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="status-pill border bg-emerald-100 text-emerald-700 border-emerald-200 font-bold">
                          {r.score ?? 0}%
                        </span>
                        <button
                          onClick={() => navigate(`/report/${r.id}`)}
                          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
                        >
                          View Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* In Progress */}
            {inProgress.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
                  <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider">🔄 In Progress ({inProgress.length})</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {inProgress.map(r => (
                    <div key={r.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900">{r.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {r.address && `📍 ${r.address} · `}
                          {r.buildingType && `🏢 ${r.buildingType} · `}
                          Started {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="status-pill border bg-amber-100 text-amber-700 border-amber-200">
                          In Progress
                        </span>
                        <button
                          onClick={() => navigate(`/assessment?id=${encodeURIComponent(r.id)}`)}
                          className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
};

export default PastAssessments;