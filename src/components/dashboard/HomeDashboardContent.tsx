import React, { useState, useEffect } from 'react';
import KpiCard from './KpiCard';
import ScoreGauge from './ScoreGauge';
import RecentAssessmentsTable, { AssessmentRow } from './RecentAssessmentsTable';
import ActionTiles from './ActionTiles';

interface DashboardStats {
  avgScore: number;
  completed: number;
  total: number;
  inProgress: number;
}

interface AssessmentLike {
  id: string;
  siteName?: string;
  schoolName?: string;
  assessorName?: string;
  updatedAt?: string;
  completedAt?: string;
  score?: number;
}

const toRows = (items: AssessmentLike[]): AssessmentRow[] => {
  return items.slice(0, 8).map((a, idx) => ({
    id: a.id || String(idx),
    siteLocation: a.siteName || a.schoolName || `Site #${a.id.slice(0, 5)}`,
    inspector: a.assessorName || 'Lead Analyst',
    // Formats those long ISO strings into "Feb 19"
    lastActivity: a.updatedAt 
      ? new Date(a.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
      : 'Pending',
    riskLevel: (a.score && a.score >= 85) ? 'Low' : (a.score && a.score >= 70) ? 'Moderate' : 'High'
  }));
};

export default function HomeDashboardContent({ stats, assessments }: { stats: DashboardStats, assessments: AssessmentLike[] }) {
  const [lastSynced, setLastSynced] = useState('');

  useEffect(() => {
    setLastSynced(new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8 lg:p-12 space-y-10" style={{ backgroundColor: '#F8FAFC' }}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-4">
        <div className="space-y-2">
          <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">Safety Dashboard</h1>
          <p className="text-base text-slate-500 font-normal">Physical Security Overview • 2026</p>
        </div>
        <div className="text-sm text-slate-600 font-medium">Synced: {lastSynced}</div>
      </header>

      {/* Top: large status card */}
      <section>
        {assessments[0] && assessments[0].score !== undefined ? (
          <div className="macha-card p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-44 h-44 bg-white rounded-lg flex items-center justify-center">
                  <ScoreGauge value={assessments[0].score} />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Last Assessment</p>
                <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2">{assessments[0].siteName || assessments[0].schoolName || 'Untitled Site'}</h2>
                <p className="mt-3 text-lg font-semibold text-slate-700">Status: <span className="font-black">{assessments[0].score}%</span> — <span className="text-sm text-slate-500">{assessments[0].assessorName || 'Lead Analyst'}</span></p>
                <p className="mt-4 text-sm text-slate-500">Updated: {assessments[0].updatedAt ? new Date(assessments[0].updatedAt).toLocaleString() : '—'}</p>
              </div>
              <div className="mt-4 lg:mt-0">
                <span className="status-pill border bg-emerald-50 text-emerald-700">{assessments[0].score >= 85 ? 'Secure' : assessments[0].score >= 70 ? 'Moderate' : 'High'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="macha-card p-8 lg:p-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Last Assessment</p>
                <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2">No recent assessments</h2>
                <p className="mt-3 text-sm text-slate-500">Start a new inspection to see live status here.</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* KPI row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-1">
        <KpiCard title="Assessments" value={stats.completed} subtitle="Completed this quarter" trend="↑ 12%" />
        <KpiCard title="Active Sites" value={stats.total} subtitle="Under monitoring" trend="Stable" />
        <KpiCard title="In Progress" value={stats.inProgress} subtitle="Currently active" trend="—" />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <RecentAssessmentsTable rows={toRows(assessments)} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <ActionTiles />
        </div>
      </div>
    </div>
  );
}