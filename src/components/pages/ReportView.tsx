import React, { useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppShell from '../layout/AppShell';
import { getAssessmentById } from '../../services/data';
import { useAuth } from '../../hooks/useAuth';
import ScoreGauge from '../dashboard/ScoreGauge';
import './pages.css';

function getRiskLevel(score: number): { label: string; color: string; bg: string; border: string } {
  if (score >= 85) return { label: 'Low Risk', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' };
  if (score >= 70) return { label: 'Moderate Risk', color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200' };
  return { label: 'High Risk', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200' };
}

function generateExecutiveSummary(name: string, score: number, address?: string, buildingType?: string): string {
  const risk = getRiskLevel(score);
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return `Executive Summary — ${date}

This report presents the findings of the physical security assessment conducted for "${name}"${address ? ` located at ${address}` : ''}${buildingType ? ` (${buildingType})` : ''}.

Overall Security Score: ${score}% — ${risk.label}

${score >= 85
    ? 'The facility demonstrates a strong security posture with comprehensive controls in place. Minor improvements are recommended to maintain the current level of protection and address evolving threat landscapes.'
    : score >= 70
    ? 'The facility shows an adequate security baseline but several areas require attention. Recommended actions include strengthening access controls, improving surveillance coverage, and updating emergency response protocols.'
    : 'The facility has significant security gaps that require immediate attention. Critical recommendations include implementing access control systems, installing surveillance equipment, developing emergency procedures, and conducting staff security awareness training.'}

Key findings and recommendations are detailed in the full report sections below. The Macha Group recommends scheduling a follow-up assessment within ${score >= 85 ? '12' : score >= 70 ? '6' : '3'} months to track progress on implemented improvements.`;
}

export const ReportView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);

  const assessment = useMemo(() => id ? getAssessmentById(id) : null, [id]);

  if (!assessment) {
    return (
      <AppShell title="Report">
        <div className="text-center py-16">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <h2 className="text-xl font-bold text-slate-900">Report Not Found</h2>
          <p className="text-sm text-slate-500 mt-2">This assessment doesn't exist or hasn't been completed yet.</p>
          <button onClick={() => navigate('/reports')} className="mt-5 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors">
            Back to Reports
          </button>
        </div>
      </AppShell>
    );
  }

  const risk = getRiskLevel(assessment.score ?? 0);
  const summary = generateExecutiveSummary(assessment.name, assessment.score ?? 0, assessment.address, assessment.buildingType);
  const responseEntries = Object.entries(assessment.responses || {}).filter(([key]) => !key.endsWith('Comment'));
  const answered = responseEntries.length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell title="Assessment Report">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
          <button onClick={() => navigate('/reports')} className="text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">
            ← Back to Reports
          </button>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
            >
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div ref={reportRef} className="space-y-6">
          {/* Report Header */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 sm:p-10 text-white print-section">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Security Assessment Report</p>
                <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">{assessment.name}</h1>
                {assessment.address && (
                  <p className="text-slate-300 text-sm mt-2">{assessment.address}</p>
                )}
                {assessment.buildingType && (
                  <p className="text-slate-400 text-xs mt-1">{assessment.buildingType}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-4 text-xs text-slate-400">
                  <span>Report ID: {assessment.id}</span>
                  <span>·</span>
                  <span>Generated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span>·</span>
                  <span>Assessor: {user?.displayName || 'N/A'}</span>
                </div>
              </div>
              {assessment.score != null && (
                <div className="flex-shrink-0 w-32 h-32 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur">
                  <ScoreGauge value={assessment.score} />
                </div>
              )}
            </div>
          </div>

          {/* Score Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overall Score</p>
              <p className="text-4xl font-extrabold text-slate-900 mt-2">{assessment.score ?? 0}%</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Risk Level</p>
              <p className={`text-lg font-extrabold mt-2 ${risk.color}`}>{risk.label}</p>
              <span className={`inline-block mt-2 status-pill border ${risk.bg} ${risk.color} ${risk.border}`}>{risk.label}</span>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Questions Answered</p>
              <p className="text-4xl font-extrabold text-slate-900 mt-2">{answered}</p>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 print-section">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              Executive Summary
            </h3>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">{summary}</pre>
            </div>
          </div>

          {/* Detailed Responses */}
          {responseEntries.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 print-section">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Detailed Responses</h3>
              <div className="divide-y divide-slate-100">
                {responseEntries.map(([key, value]) => {
                  const comment = assessment.responses[`${key}Comment`];
                  return (
                    <div key={key} className="py-3">
                      <p className="text-sm font-semibold text-slate-700">{key}</p>
                      <p className="text-sm text-slate-900 mt-1">
                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                      </p>
                      {comment && (
                        <p className="text-xs text-slate-500 mt-1 italic">Note: {comment}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center py-6 text-xs text-slate-400 print-section">
            <p>Report generated by The Macha Group Security Platform</p>
            <p className="mt-1">© {new Date().getFullYear()} The Macha Group. All rights reserved.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default ReportView;
