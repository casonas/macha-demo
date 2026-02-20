import React, { useMemo, useState, useCallback } from 'react';
import AppShell from '../layout/AppShell';
import { listAssessmentsByUser, deleteAssessment } from '../../services/data';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './pages.css';

export const PastAssessments: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const rows = useMemo(() => {
    if (!user) return [];
    void refreshKey; // trigger re-computation on delete
    return listAssessmentsByUser(user.id);
  }, [user, refreshKey]);

  const completed = rows.filter(r => r.status === 'completed');
  const inProgress = rows.filter(r => r.status !== 'completed');

  const handleDelete = useCallback((id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      deleteAssessment(id);
      setRefreshKey(k => k + 1);
    }
  }, []);

  return (
    <AppShell title="Reports">
      <div className="space-y-6 flex flex-col items-center">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full text-center sm:text-left">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Assessment Reports</h2>
            <p className="text-sm text-slate-500 mt-1">{rows.length} total | {completed.length} completed | {inProgress.length} in progress</p>
          </div>
          <button
            onClick={() => navigate('/create-assessment')}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap"
          >
            + New Assessment
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem' }}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01"/></svg>
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
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
                <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100">
                  <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider">Completed Reports ({completed.length})</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {completed.map(r => (
                    <div key={r.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900">{r.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {r.address && <>{r.address} &middot; </>}
                          {r.buildingType && <>{r.buildingType} &middot; </>}
                          {new Date(r.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
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
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
                <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
                  <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider">In Progress ({inProgress.length})</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {inProgress.map(r => (
                    <div key={r.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900">{r.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {r.address && <>{r.address} &middot; </>}
                          {r.buildingType && <>{r.buildingType} &middot; </>}
                          Started {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                        <span className="status-pill border bg-amber-100 text-amber-700 border-amber-200">
                          In Progress
                        </span>
                        <button
                          onClick={() => navigate(`/assessment?id=${encodeURIComponent(r.id)}`)}
                          className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                        >
                          Continue
                        </button>
                        <button
                          onClick={() => handleDelete(r.id, r.name)}
                          className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors"
                        >
                          Delete
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