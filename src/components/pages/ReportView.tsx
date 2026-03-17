import React, { useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppShell from '../layout/AppShell';
import { getAssessmentById } from '../../services/data';
import { useAuth } from '../../hooks/useAuth';
import { useAssessment } from '../../hooks/useAssessment';
import './pages.css';

function getRiskLevel(score: number) {
  if (score >= 85) return { label: 'Low', color: '#000' };
  if (score >= 70) return { label: 'Moderate', color: '#000' };
  return { label: 'High', color: '#000' };
}

function countFindings(responses: Record<string, any>) {
  // Reports currently treat negative boolean answers ("false"/"No") as
  // findings and ignore free-text comment fields when counting totals.
  let total = 0;
  Object.entries(responses).forEach(([key, value]) => {
    if (key.endsWith('Comment')) return;
    if (value === false || value === 'No') {
      total++;
    }
  });
  return { total };
}

export const ReportView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);

  const assessment = useMemo(() => {
    if (!id) return null;
    const record = getAssessmentById(id);
    // Protect against manually entered URLs by hiding records that belong to a
    // different local user, even though routes are already behind AuthGuard.
    if (record && user && record.userId && record.userId !== user.id) return null;
    return record;
  }, [id, user]);

  // Load the assessment definition to get full question text
  const { assessment: assessmentDef } = useAssessment(assessment?.assessmentId ?? null);

  // Completed records store response keys, not denormalized prompt text, so we
  // rebuild this map from the assessment definition for readable findings/photos.
  const questionTextMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (assessmentDef) {
      assessmentDef.categories.forEach(cat => {
        cat.questions.forEach(q => {
          map[q.id] = q.text;
        });
      });
    }
    return map;
  }, [assessmentDef]);

  if (!assessment) return null;

  const risk = getRiskLevel(assessment.score ?? 0);
  const dateStr = new Date(assessment.updatedAt || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const findings = countFindings(assessment.responses || {});

  // Collect all photos from the assessment
  const allPhotos: { questionId: string; name: string; dataUrl: string }[] = [];
  if (assessment.photos) {
    Object.entries(assessment.photos).forEach(([questionId, photoList]) => {
      photoList.forEach(photo => {
        allPhotos.push({ questionId, name: photo.name, dataUrl: photo.dataUrl });
      });
    });
  }

  return (
    <AppShell title="Executive Summary Report" isDashboard={true}>
      <div className="w-full min-h-screen bg-white flex flex-col items-center py-12 px-4">
        
        {/* Action Bar (Hidden during print) */}
        <div className="w-full max-w-4xl flex justify-between mb-6 no-print">
          <button onClick={() => navigate('/reports')} className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-2">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
             Back to Reports
          </button>
          <button onClick={() => window.print()} className="bg-black text-white px-6 py-2 rounded font-bold text-sm hover:bg-gray-800 transition-all">
            Export as PDF
          </button>
        </div>

        {/* REPORT DOCUMENT */}
        <div ref={reportRef} className="report-document">

          {/* REPORT HEADER */}
          <div className="report-header">
            <div className="report-header__logo">
              <img src="/Logo.png" alt="The Macha Group" className="report-header__logo-img" />
            </div>
            <h1 className="report-header__title">Executive Summary Report</h1>
            <div className="report-header__line" />
          </div>

          {/* REPORT DETAILS */}
          <section className="report-section">
            <h2 className="report-section__title">Report Details</h2>
            <table className="report-details-table">
              <tbody>
                <tr><td className="report-details-table__label">Reported By:</td><td>{user?.displayName || 'The Macha Group'}</td></tr>
                <tr><td className="report-details-table__label">File Name:</td><td>{assessment.name}</td></tr>
                <tr><td className="report-details-table__label">Date of Report:</td><td>{dateStr}</td></tr>
                <tr><td className="report-details-table__label">Report Lead:</td><td>{user?.displayName || 'N/A'}</td></tr>
              </tbody>
            </table>
          </section>

          {/* TEAM COMPOSITION */}
          <section className="report-section">
            <h2 className="report-section__title">Team Composition</h2>
            <p className="report-body-text">{user?.displayName || 'N/A'} — Assessment Lead</p>
          </section>

          <div className="report-divider" />

          {/* EXECUTIVE SUMMARY */}
          <section className="report-section">
            <h2 className="report-section__title">Executive Summary</h2>
            <p className="report-date-label">{new Date(assessment.updatedAt || Date.now()).toISOString().split('T')[0]}</p>

            <div className="report-summary-items">
              <div className="report-summary-item">
                <h3 className="report-summary-item__number">1) Purpose:</h3>
                <p className="report-body-text">
                  The purpose of this assessment is to conduct a comprehensive physical security evaluation to identify vulnerabilities, assess risk levels, and provide actionable recommendations to strengthen the overall security posture of the facility.
                </p>
              </div>

              <div className="report-summary-item">
                <h3 className="report-summary-item__number">2) Background:</h3>
                <p className="report-body-text">
                  This assessment was conducted for {assessment.buildingType || 'the facility'} located at {assessment.address || 'the designated site'}. The evaluation follows established security assessment methodologies and industry best practices.
                </p>
              </div>

              <div className="report-summary-item">
                <h3 className="report-summary-item__number">3) Focus Areas:</h3>
                <p className="report-body-text">
                  Physical security controls, access management, surveillance systems, emergency preparedness, perimeter security, and operational procedures.
                </p>
              </div>

              <div className="report-summary-item">
                <h3 className="report-summary-item__number">4) Sites Assessed:</h3>
                <p className="report-body-text">
                  {assessment.address || 'Primary facility'} — {assessment.buildingType || 'Standard facility'}
                </p>
              </div>

              <div className="report-summary-item">
                <h3 className="report-summary-item__number">5) Sites Not Assessed:</h3>
                <p className="report-body-text">None listed.</p>
              </div>

              <div className="report-summary-item">
                <h3 className="report-summary-item__number">6) Leader's Areas of Interest:</h3>
                <p className="report-body-text">
                  Overall facility security posture, identification of critical vulnerabilities, and prioritized remediation recommendations.
                </p>
              </div>

              <div className="report-summary-item">
                <h3 className="report-summary-item__number">7) Observations (Findings):</h3>
                <div className="report-findings-grid">
                  <div className="report-finding-box">
                    <span className="report-finding-box__label">Total Findings</span>
                    <span className="report-finding-box__count">{findings.total}</span>
                  </div>
                  <div className="report-finding-box">
                    <span className="report-finding-box__label">Risk Rating</span>
                    <span className="report-finding-box__count">{risk.label}</span>
                  </div>
                  <div className="report-finding-box">
                    <span className="report-finding-box__label">Score</span>
                    <span className="report-finding-box__count">{assessment.score ?? 0}%</span>
                  </div>
                </div>
              </div>

              {/* Detailed Findings */}
              {findings.total > 0 && (
                <div className="report-summary-item">
                  <h3 className="report-summary-item__number">Detailed Findings:</h3>
                  <div className="report-findings-list">
                    {Object.entries(assessment.responses || {}).map(([key, value]) => {
                      if (key.endsWith('Comment') || value === true || value === 'Yes') return null;
                      if (value !== false && value !== 'No') return null;
                      const comment = assessment.responses?.[`${key}Comment`];
                      return (
                        <div key={key} className="report-finding-row">
                          <span className="report-finding-row__bullet">■</span>
                          <div>
                            <p className="report-finding-row__title">{questionTextMap[key] || key}</p>
                            {comment && <p className="report-finding-row__comment">{comment}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="report-summary-item">
                <h3 className="report-summary-item__number">8) Points of Contact:</h3>
                <p className="report-body-text">
                  {user?.displayName || 'N/A'} — {user?.email || 'info@machagroup.com'}
                </p>
                <p className="report-body-text">The Macha Group — info@machagroup.com</p>
              </div>
            </div>
          </section>

          {/* PHOTOS SECTION */}
          {allPhotos.length > 0 && (
            <>
              <div className="report-divider" />
              <section className="report-section">
                <h2 className="report-section__title">Photo Documentation</h2>
                <div className="report-photos-grid">
                  {allPhotos.map((photo, idx) => (
                    <div key={idx} className="report-photo-item">
                      <img src={photo.dataUrl} alt={photo.name} className="report-photo-item__img" />
                      <p className="report-photo-item__caption">
                        {questionTextMap[photo.questionId] || photo.questionId}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* FOOTER */}
          <div className="report-divider" />
          <footer className="report-footer">
            <p>© {new Date().getFullYear()} The Macha Group. All rights reserved.</p>
            <p>This report is confidential and intended solely for the use of the authorized recipient.</p>
          </footer>
        </div>
      </div>
    </AppShell>
  );
};

export default ReportView;
