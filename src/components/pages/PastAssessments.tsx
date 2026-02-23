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
    void refreshKey; 
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
    <AppShell title="Reports" isDashboard={true}>
      <div 
        className="w-full min-h-screen bg-slate-50/50 flex flex-col items-center"
        style={{ paddingTop: '5rem', paddingBottom: '6rem', paddingLeft: '2rem', paddingRight: '2rem' }}
      >
        <div className="w-full max-w-7xl flex flex-col" style={{ gap: '2.5rem' }}>
          
          {/* PARALLEL HEADER: Fixed alignment and button spacing */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-end', 
            width: '100%', 
            paddingBottom: '2rem',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <div style={{ textAlign: 'left' }}>
              <h2 className="font-bold text-slate-900 tracking-tight" style={{ fontSize: '2.5rem', margin: 0 }}>
                Assessment Reports
              </h2>
              <p className="text-slate-500 font-medium mt-2" style={{ fontSize: '1rem' }}>
                {rows.length} total • <span className="text-emerald-600">{completed.length} completed</span> • <span className="text-amber-600">{inProgress.length} in progress</span>
              </p>
            </div>
            
            <button
              onClick={() => navigate('/create-assessment')}
              className="bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95 flex items-center gap-2 flex-shrink-0"
              style={{ padding: '1rem 2rem', borderRadius: '1rem', border: 'none', cursor: 'pointer' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Assessment
            </button>
          </div>

          {rows.length === 0 ? (
            <div className="bg-white border border-slate-200 text-center" style={{ padding: '5rem 2rem', borderRadius: '2rem' }}>
              <div className="w-20 h-20 bg-slate-50 text-slate-300 flex items-center justify-center rounded-2xl mx-auto mb-6">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
                  <path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01"/>
                </svg>
              </div>
              <p className="text-xl font-bold text-slate-700">No assessments yet</p>
              <p className="text-slate-500 mt-2">Create a new assessment to generate your first report.</p>
            </div>
          ) : (
            <div className="flex flex-col" style={{ gap: '3rem' }}>
              
              {/* IN PROGRESS SECTION */}
              {inProgress.length > 0 && (
                <div className="bg-white border border-slate-200 shadow-sm overflow-hidden" style={{ borderRadius: '2rem' }}>
                  <div className="px-8 py-5 bg-amber-50/50 border-b border-amber-100 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <h3 className="text-xs font-bold text-amber-800 uppercase tracking-[0.2em]">In Progress ({inProgress.length})</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {inProgress.map(r => (
                      <div key={r.id} className="flex flex-col sm:flex-row items-center justify-between px-8 py-6 hover:bg-slate-50/50 transition-colors" style={{ gap: '2rem' }}>
                        {/* Text wrapper with min-width 0 allows truncation to work */}
                        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                          <p className="text-xl font-bold text-slate-900 truncate m-0" style={{ maxWidth: '100%' }}>{r.name}</p>
                          <p className="text-sm text-slate-500 mt-2 flex flex-wrap items-center gap-2">
                            <span className="truncate">{r.address || 'Location Pending'}</span>
                            <span className="text-slate-300">•</span>
                            <span>{r.buildingType}</span>
                          </p>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                          <button
                            onClick={() => navigate(`/assessment?id=${encodeURIComponent(r.id)}`)}
                            className="bg-white border-2 border-slate-100 text-slate-700 font-bold hover:bg-slate-50 transition-all active:scale-95"
                            style={{ padding: '0.625rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.875rem' }}
                          >
                            Continue
                          </button>
                          <button
                            onClick={() => handleDelete(r.id, r.name)}
                            className="bg-white border-2 border-red-50 text-red-600 font-bold hover:bg-red-50 transition-all active:scale-95"
                            style={{ padding: '0.625rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.875rem' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* COMPLETED SECTION */}
              {completed.length > 0 && (
                <div className="bg-white border border-slate-200 shadow-sm overflow-hidden" style={{ borderRadius: '2rem' }}>
                  <div className="px-8 py-5 bg-emerald-50/50 border-b border-emerald-100 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-[0.2em]">Completed Reports ({completed.length})</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {completed.map(r => (
                      <div key={r.id} className="flex flex-col sm:flex-row items-center justify-between px-8 py-6 hover:bg-slate-50/50 transition-colors" style={{ gap: '2rem' }}>
                        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                          <p className="text-xl font-bold text-slate-900 truncate m-0" style={{ maxWidth: '100%' }}>{r.name}</p>
                          <p className="text-sm text-slate-500 mt-2 flex flex-wrap items-center gap-2">
                            <span className="truncate">{r.address}</span>
                            <span className="text-slate-300">•</span>
                            <span>{new Date(r.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </p>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexShrink: 0 }}>
                          <div style={{ textAlign: 'right' }}>
                             <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>Score</p>
                             <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669', margin: 0 }}>{r.score ?? 0}%</p>
                          </div>
                          <button
                            onClick={() => navigate(`/report/${r.id}`)}
                            className="bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                            style={{ padding: '0.75rem 1.5rem', borderRadius: '0.875rem', fontSize: '0.875rem', border: 'none' }}
                          >
                            View Report
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default PastAssessments;
