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
      <div className="space-y-6 sm:space-y-8">
        {/* Welcome Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 p-6 sm:p-10 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600 rounded-full opacity-20 -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500 rounded-full opacity-10 translate-y-1/2 -translate-x-1/4" />
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Welcome back, {firstName} 👋</h1>
            <p className="mt-2 text-emerald-100 text-sm sm:text-base max-w-xl">
              Your security assessment platform is ready. Start a new inspection or review your latest reports.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/create-assessment')}
                className="px-5 py-2.5 bg-white text-emerald-800 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-all shadow-lg"
              >
                + New Assessment
              </button>
              <button
                onClick={() => navigate('/reports')}
                className="px-5 py-2.5 border border-emerald-400 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all"
              >
                View Reports
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 text-lg">📊</div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{total}</p>
            <p className="text-xs text-slate-500 mt-1">Assessments</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 text-lg">✅</div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Completed</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{completed}</p>
            <p className="text-xs text-slate-500 mt-1">Finished reports</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 text-lg">🔄</div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">In Progress</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{inProgress}</p>
            <p className="text-xs text-slate-500 mt-1">Active inspections</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 text-lg">🎯</div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Score</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{avgScore > 0 ? `${avgScore}%` : '—'}</p>
            <p className="text-xs text-slate-500 mt-1">Security rating</p>
          </div>
        </div>

        {/* Main Content: Last Assessment + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Last Assessment Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Latest Assessment</h3>
            {lastAssessment ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {lastAssessment.score != null && (
                  <div className="flex-shrink-0 w-32 h-32">
                    <ScoreGauge value={lastAssessment.score} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-bold text-slate-900 truncate">{lastAssessment.name}</p>
                  {lastAssessment.address && (
                    <p className="text-sm text-slate-500 mt-1">📍 {lastAssessment.address}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
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
                <p className="text-4xl mb-3">🏢</p>
                <p className="text-lg font-semibold text-slate-700">No assessments yet</p>
                <p className="text-sm text-slate-500 mt-1">Create your first security assessment to get started.</p>
                <button
                  onClick={() => navigate('/create-assessment')}
                  className="mt-4 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors"
                >
                  Start First Assessment
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {[
                { icon: '🛡️', label: 'New Inspection', desc: 'Start a security assessment', href: '/create-assessment' },
                { icon: '📋', label: 'View Reports', desc: 'Browse completed reports', href: '/reports' },
                { icon: '👤', label: 'My Profile', desc: 'Manage your account', href: '/profile' },
                { icon: '💼', label: 'Pricing Plans', desc: 'View available plans', href: '/pricing' },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={() => navigate(action.href)}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all duration-200 text-left w-full group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{action.icon}</span>
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
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