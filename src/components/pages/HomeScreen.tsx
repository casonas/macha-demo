import React, { useMemo } from 'react';
import AppShell from '../layout/AppShell';
import { listAssessments } from '../../services/data';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import ScoreGauge from '../dashboard/ScoreGauge';
import './pages.css';

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const assessments = useMemo(() => listAssessments(), []);

  const completed = assessments.filter(a => a.status === 'completed').length;
  const inProgress = assessments.filter(a => a.status !== 'completed').length;
  const total = assessments.length;

  const avgScore = assessments.filter(a => a.score).length
    ? Math.round(
        assessments.filter(a => a.score).reduce((s, a) => s + (a.score || 0), 0) /
        assessments.filter(a => a.score).length
      )
    : 0;

  const lastAssessment = assessments[0];
  const firstName = (user?.displayName || 'there').split(' ')[0];

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6 sm:space-y-8 flex flex-col items-center">
        {/* Welcome Hero */}
        <div className="relative overflow-hidden rounded-2xl p-14 pb-28 sm:p-20 sm:pb-32 text-white text-center w-full flex flex-col items-center justify-center" style={{ background: 'radial-gradient(circle at top, #142b14 0%, #050805 75%)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-15 -translate-y-1/2 translate-x-1/3" style={{ background: '#228b22' }} />
          <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-10 translate-y-1/2 -translate-x-1/4" style={{ background: '#32dc32' }} />
          <div className="relative z-10 w-full flex flex-col items-center text-center">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Welcome back, {firstName}</h1>
            <p className="mt-3 text-slate-300 text-sm sm:text-base text-center">
              Your security assessment platform is ready. Start a new inspection or review your latest reports.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center pb-2">
              <button
                onClick={() => navigate('/create-assessment')}
                className="px-6 py-3.5 bg-white text-emerald-900 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-all shadow-lg whitespace-nowrap"
              >
                + New Assessment
              </button>
              <button
                onClick={() => navigate('/reports')}
                className="px-6 py-3.5 border border-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-white/10 transition-all whitespace-nowrap"
              >
                View Reports
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{total}</p>
            <p className="text-xs text-slate-500 mt-1.5">Assessments</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Completed</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{completed}</p>
            <p className="text-xs text-slate-500 mt-1.5">Finished reports</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">In Progress</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{inProgress}</p>
            <p className="text-xs text-slate-500 mt-1.5">Active inspections</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Score</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{avgScore > 0 ? `${avgScore}%` : '—'}</p>
            <p className="text-xs text-slate-500 mt-1.5">Security rating</p>
          </div>
        </div>

        {/* Main Content: Last Assessment + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* Last Assessment Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 text-center">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Latest Assessment</h3>
            {lastAssessment ? (
              <div className="flex flex-col items-center gap-6">
                {lastAssessment.score != null && (
                  <div className="flex-shrink-0 w-32 h-32">
                    <ScoreGauge value={lastAssessment.score} />
                  </div>
                )}
                <div className="flex-1 min-w-0 text-center">
                  <p className="text-xl font-bold text-slate-900 truncate">{lastAssessment.name}</p>
                  {lastAssessment.address && (
                    <p className="text-sm text-slate-500 mt-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px'}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {lastAssessment.address}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3 justify-center">
                    <span className={`status-pill border ${
                      lastAssessment.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-amber-100 text-amber-700 border-amber-200'
                    }`}>
                      {lastAssessment.status}
                    </span>
                    {lastAssessment.score != null && (
                      <span className="status-pill border bg-slate-100 text-slate-700 border-slate-200">
                        Score: {lastAssessment.score}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-3">
                    Updated {new Date(lastAssessment.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  {lastAssessment.status === 'completed' && (
                    <button
                      onClick={() => navigate(`/report/${lastAssessment.id}`)}
                      className="mt-4 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      View Full Report →
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-4xl mb-3"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{margin: '0 auto'}}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01"/></svg></p>
                <p className="text-lg font-semibold text-slate-700">No assessments yet</p>
                <p className="text-sm text-slate-500 mt-1">Create your first security assessment to get started.</p>
                <button
                  onClick={() => navigate('/create-assessment')}
                  className="mt-4 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors whitespace-nowrap"
                >
                  Start First Assessment
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Quick Actions</h3>
            <div className="space-y-3 w-full">
              {[
                { label: 'New Inspection', desc: 'Start a security assessment', href: '/create-assessment',
                  iconSvg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg> },
                { label: 'View Reports', desc: 'Browse completed reports', href: '/reports',
                  iconSvg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14l2 2 4-4"/></svg> },
                { label: 'My Profile', desc: 'Manage your account', href: '/profile',
                  iconSvg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                { label: 'Pricing Plans', desc: 'View available plans', href: '/pricing',
                  iconSvg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={() => navigate(action.href)}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all duration-200 text-left w-full group"
                >
                  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 group-hover:scale-110 transition-transform">{action.iconSvg}</span>
                  <div>
                    <span className="text-sm font-semibold text-slate-800 block">{action.label}</span>
                    <span className="text-xs text-slate-500">{action.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Assessments List */}
        {assessments.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 text-center w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
              <button onClick={() => navigate('/reports')} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">View All →</button>
            </div>
            <div className="divide-y divide-slate-100">
              {assessments.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between py-3 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                      {a.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{a.name}</p>
                      <p className="text-xs text-slate-500">{new Date(a.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`status-pill border text-xs ${
                      a.status === 'completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                    }`}>
                      {a.status}
                    </span>
                    {a.status === 'completed' && (
                      <button
                        onClick={() => navigate(`/report/${a.id}`)}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hidden sm:block"
                      >
                        Report
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default HomeScreen;