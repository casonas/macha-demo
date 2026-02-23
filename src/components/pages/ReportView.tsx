import React, { useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppShell from '../layout/AppShell';
import { getAssessmentById } from '../../services/data';
import { useAuth } from '../../hooks/useAuth';
import ScoreGauge from '../dashboard/ScoreGauge';
import './pages.css';

// Logic for finding risk levels and corresponding styles
function getRiskLevel(score: number) {
  if (score >= 85) return { label: 'Low Risk', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  if (score >= 70) return { label: 'Moderate Risk', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
  return { label: 'High Risk', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
}

export const ReportView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);

  const assessment = useMemo(() => {
    if (!id) return null;
    const record = getAssessmentById(id);
    if (record && user && record.userId && record.userId !== user.id) return null;
    return record;
  }, [id, user]);

  if (!assessment) return null;

  const risk = getRiskLevel(assessment.score ?? 0);
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <AppShell title="Executive Summary Report" isDashboard={true}>
      <div className="w-full min-h-screen bg-slate-50/50 flex flex-col items-center py-12 px-4">
        
        {/* Action Bar (Hidden during print) */}
        <div className="w-full max-w-4xl flex justify-between mb-6 no-print">
          <button onClick={() => navigate('/reports')} className="text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-2">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
             Back to Reports
          </button>
          <button onClick={() => window.print()} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-emerald-700 transition-all">
            Export as PDF
          </button>
        </div>

        {/* 1. REPORT HEADER - Derived from [cite: 1, 3, 4] */}
        <div ref={reportRef} className="w-full max-w-4xl bg-white shadow-2xl overflow-hidden" style={{ borderRadius: '2rem' }}>
          <div className="bg-slate-900 p-12 text-white">
            <div className="flex justify-between items-start">
              <div className="text-left">
                <p className="text-emerald-400 font-bold tracking-[0.2em] text-xs uppercase mb-2">Executive Summary Report [cite: 7, 11]</p>
                <h1 className="text-4xl font-black mb-4">{assessment.name} [cite: 3]</h1>
                <div className="space-y-1 text-slate-400 text-sm">
                   <p><strong>Reported By:</strong> {user?.displayName || 'The Macha Group'} [cite: 2]</p>
                   <p><strong>Date of Report:</strong> {dateStr} [cite: 4, 9]</p>
                   <p><strong>Report Lead:</strong> {user?.displayName || 'N/A'} [cite: 5]</p>
                </div>
              </div>
              <div className="w-32 h-32 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10">
                <ScoreGauge value={assessment.score ?? 0} />
              </div>
            </div>
          </div>

          {/* 2. EXECUTIVE SUMMARY SECTION - Derived from [cite: 8, 12, 13, 14] */}
          <div className="p-12 space-y-10 text-left">
            <section className="print-section">
              <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 mb-6">1) Purpose & Background </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-600">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Purpose</h4>
                  <p className="text-sm">Comprehensive physical security assessment to identify vulnerabilities and mitigate threats[cite: 12].</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Background</h4>
                  <p className="text-sm">Analysis of current security posture for {assessment.buildingType || 'the facility'}[cite: 13].</p>
                </div>
              </div>
            </section>

            {/* 3. FOCUS AREAS & SCOPE - Derived from [cite: 14, 15, 16] */}
            <section className="print-section">
              <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 mb-6">2) Assessment Scope </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-6 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Sites Assessed [cite: 15]</h4>
                  <p className="text-sm font-bold text-slate-800">{assessment.address || 'Standard Perimeter'}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Focus Areas [cite: 14]</h4>
                  <p className="text-sm font-bold text-slate-800">Physical & Operational</p>
                </div>
                <div className={`p-6 rounded-2xl border ${risk.border} ${risk.bg}`}>
                  <h4 className={`text-xs font-bold uppercase mb-3 ${risk.color}`}>Risk Rating</h4>
                  <p className={`text-sm font-bold ${risk.color}`}>{risk.label}</p>
                </div>
              </div>
            </section>

            {/* 4. OBSERVATIONS & FINDINGS - Derived from [cite: 18, 19] */}
            <section className="print-section">
              <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 mb-6">3) Observations (Findings) </h3>
              <div className="space-y-4">
                 {/* This section programmatically sorts responses into risk levels based on 'No' answers */}
                 {Object.entries(assessment.responses || {}).map(([key, value]) => {
                   if (key.endsWith('Comment') || value === true || value === 'Yes') return null;
                   return (
                    <div key={key} className="flex items-start gap-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl">
                      <div className="mt-1 text-red-600">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{key.replace(/([A-Z])/g, ' $1')}</p>
                        <p className="text-xs text-red-700 mt-1">Vulnerability identified during physical walkthrough.</p>
                      </div>
                    </div>
                   );
                 })}
              </div>
            </section>

            {/* 5. FOOTER DETAILS - Derived from [cite: 6, 20] */}
            <footer className="pt-10 mt-10 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-end gap-6">
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Points of Contact [cite: 20]</p>
                <p className="text-xs font-bold text-slate-700 mt-1">info@machagroup.com</p>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">© 2026 The Macha Group Security Platform. All rights reserved.</p>
            </footer>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default ReportView;
