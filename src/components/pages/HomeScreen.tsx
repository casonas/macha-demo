import React, { useMemo } from 'react';
import AppShell from '../layout/AppShell';
import { listAssessmentsByUser } from '../../services/data';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useAssessment } from '../../hooks/useAssessment';
import ScoreGauge from '../dashboard/ScoreGauge';
import './pages.css';

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const assessments = useMemo(() => user ? listAssessmentsByUser(user.id) : [], [user]);

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

  const { assessment: assessmentDef } = useAssessment(lastAssessment?.assessmentId ?? null);
  const totalQuestions = useMemo(() => {
    if (!assessmentDef) return 0;
    return assessmentDef.categories.reduce((sum, c) => sum + c.questions.length, 0);
  }, [assessmentDef]);

  const answeredCount = useMemo(() => {
    if (!lastAssessment?.responses) return 0;
    return Object.entries(lastAssessment.responses).filter(
      ([key, v]) => !key.endsWith('Comment') && v !== '' && v !== null && v !== undefined
    ).length;
  }, [lastAssessment]);

  const percentComplete = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const latestProgress = lastAssessment?.status === 'completed' ? 100 : percentComplete;
  const latestProgressLabel = lastAssessment?.status === 'completed'
    ? 'Submitted'
    : totalQuestions > 0
      ? `${answeredCount} / ${totalQuestions} Questions`
      : `${answeredCount} Questions Answered`;

  const quickActions = [
    { label: 'New Inspection', href: '/create-assessment', icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
    { label: 'View Reports', href: '/reports', icon: <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></> },
    { label: 'My Profile', href: '/profile', icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></> },
    { label: 'Need Help?', href: '/contact', icon: <><path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></> }
  ];

  return (
    <AppShell title="Dashboard" isDashboard={true}>
      
      <div className="w-full min-h-screen bg-slate-50/50 py-12">
        <div className="w-full max-w-7xl mx-auto flex flex-col px-4 sm:px-6 lg:px-8">
          
          {/* 1. HERO BANNER */}
          <div 
            className="relative w-full flex flex-col items-center justify-center shadow-xl overflow-hidden" 
            style={{ 
              background: 'radial-gradient(circle at top, #142b14 0%, #050805 100%)',
              paddingTop: '5rem',
              paddingBottom: '5rem',
              borderRadius: '2rem'
            }}
          >
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 -translate-y-1/2 translate-x-1/3" style={{ background: '#228b22' }} />
            
            <div className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center gap-6 px-6">
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white">Welcome back, {firstName}</h1>
              <p className="text-slate-400 text-base sm:text-lg text-center max-w-2xl leading-relaxed">
                Your security assessment platform is ready. Start a new inspection or review your latest reports.
              </p>
              
              <div className="flex flex-wrap gap-5 justify-center mt-8">
                <button
                  onClick={() => navigate('/create-assessment')}
                  className="px-10 py-4 bg-white text-emerald-900 rounded-xl font-bold text-base hover:bg-emerald-50 transition-all shadow-lg active:scale-95"
                >
                  + New Assessment
                </button>
                <button
                  onClick={() => navigate('/reports')}
                  className="px-10 py-4 border-2 border-emerald-500 text-white rounded-xl font-bold text-base hover:bg-white/10 transition-all active:scale-95"
                >
                  View Reports
                </button>
              </div>
            </div>
          </div>

          {/* 2. KPI TABS: Adjusted Margins, forced gap, fixed Total icon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-10 mb-10 gap-6 lg:gap-8">
            {[
              { label: 'Total', val: total, color: 'bg-emerald-100 text-emerald-600', icon: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></> },
              { label: 'Completed', val: completed, color: 'bg-blue-100 text-blue-600', icon: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></> },
              { label: 'In Progress', val: inProgress, color: 'bg-amber-100 text-amber-600', icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
              { label: 'Avg Score', val: avgScore > 0 ? `${avgScore}%` : '—', color: 'bg-emerald-100 text-emerald-600', icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/> }
            ].map((kpi, i) => (
              <div 
                key={i} 
                className="bg-white border border-slate-200 shadow-sm flex flex-col justify-center items-center sm:items-start text-center sm:text-left transition-all hover:shadow-md"
                style={{ minHeight: '160px', padding: '2rem', borderRadius: '1.5rem' }} 
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${kpi.color}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{kpi.icon}</svg>
                  </div>
                  <span className="text-sm font-bold uppercase tracking-widest text-slate-400">{kpi.label}</span>
                </div>
                <p className="text-5xl font-bold text-slate-900">{kpi.val}</p>
              </div>
            ))}
          </div>

          {/* 3. BOTTOM CARDS: Forced gap and border-radius */}
          <div className="grid grid-cols-1 lg:grid-cols-3 items-stretch pb-20 gap-6 lg:gap-8">
            
            <div 
              className="lg:col-span-2 bg-white border border-slate-200 shadow-sm flex flex-col h-full"
              style={{ minHeight: '450px', padding: '3rem', borderRadius: '1.5rem' }}
            >
              <h3 className="text-xl font-bold text-slate-900 mb-8 border-b border-slate-100 pb-4">Latest Assessment</h3>
              
              {lastAssessment ? (
                <div className="flex-grow flex flex-col w-full">
                  <div className="flex-grow flex flex-col items-center justify-center gap-6 w-full">
                    {lastAssessment.score != null && (
                      <div className="w-56 h-56 flex-shrink-0">
                        <ScoreGauge value={lastAssessment.score} />
                      </div>
                    )}
                    <div className="text-center w-full mt-4">
                      <h4 className="text-3xl font-bold text-slate-900 mb-4 break-words" style={{ overflowWrap: 'anywhere' }}>{lastAssessment.name}</h4>
                      <span className={`inline-block px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        lastAssessment.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {lastAssessment.status}
                      </span>
                      
                         <div className="mt-10 w-full max-w-lg mx-auto">
                           <div className="flex justify-between text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">
                             <span>{latestProgressLabel}</span>
                             <span className="text-emerald-600">{latestProgress}%</span>
                           </div>
                           <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                             <div
                               className={`h-full rounded-full transition-all duration-1000 ${lastAssessment.status === 'completed' ? 'bg-emerald-600' : 'bg-emerald-500'}`}
                               style={{ width: `${latestProgress}%` }}
                             />
                           </div>
                           <p className="mt-2 text-xs text-slate-500">
                             {lastAssessment.status === 'completed' ? 'Report has been submitted.' : 'Save progress anytime and continue later.'}
                           </p>
                         </div>
                      </div>
                    </div>
                  <button
                    onClick={() => navigate(lastAssessment.status === 'completed' ? `/report/${lastAssessment.id}` : `/assessment?id=${encodeURIComponent(lastAssessment.id)}`)}
                    className="mt-8 self-center px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm active:scale-95"
                  >
                    {lastAssessment.status === 'completed' ? 'View Report' : 'Continue Assessment'}
                  </button>
                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-slate-400">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-6 opacity-30"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01"/></svg>
                  <p className="font-bold uppercase tracking-widest text-lg">No assessments found.</p>
                </div>
              )}
            </div>

            <div 
              className="lg:col-span-1 bg-white border border-slate-200 shadow-sm flex flex-col h-full"
              style={{ minHeight: '450px', padding: '3rem', borderRadius: '1.5rem' }} 
            >
              <h3 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-3">Quick Actions</h3>
              <div className="flex flex-col gap-7 flex-grow justify-start">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(action.href)}
                    className="flex items-center gap-5 p-5 bg-slate-50 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all text-left active:scale-95 group w-full"
                    style={{ borderRadius: '1rem' }}
                  >
                    <div className="w-14 h-14 bg-white flex flex-shrink-0 items-center justify-center text-emerald-600 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors" style={{ borderRadius: '0.75rem' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {action.icon}
                      </svg>
                    </div>
                    <span className="text-base font-bold text-slate-700">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default HomeScreen;
