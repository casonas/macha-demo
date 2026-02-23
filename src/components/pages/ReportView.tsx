import React, { useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppShell from '../layout/AppShell';
import { getAssessmentById } from '../../services/data';
import { useAuth } from '../../hooks/useAuth';
import './pages.css';

function getRiskLevel(score: number) {
  if (score >= 85) return { label: 'Low', color: '#000' };
  if (score >= 70) return { label: 'Moderate', color: '#000' };
  return { label: 'High', color: '#000' };
}

function countFindings(responses: Record<string, any>) {
  let high = 0, significant = 0, moderate = 0, low = 0;
  Object.entries(responses).forEach(([key, value]) => {
    if (key.endsWith('Comment') || value === true || value === 'Yes') return;
    if (value === false || value === 'No') {
      // Distribute findings across severity levels for demonstration
      const hash = key.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      switch (hash % 4) {
        case 0: high++; break;
        case 1: significant++; break;
        case 2: moderate++; break;
        default: low++; break;
      }
    }
  });
  return { high, significant, moderate, low };
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
  const dateStr = new Date(assessment.updatedAt || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const findings = countFindings(assessment.responses || {});
  const totalFindings = findings.high + findings.significant + findings.moderate + findings.low;

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
                    <span className="report-finding-box__label">High</span>
                    <span className="report-finding-box__count">{findings.high}</span>
                  </div>
                  <div className="report-finding-box">
                    <span className="report-finding-box__label">Significant</span>
                    <span className="report-finding-box__count">{findings.significant}</span>
                  </div>
                  <div className="report-finding-box">
                    <span className="report-finding-box__label">Moderate</span>
                    <span className="report-finding-box__count">{findings.moderate}</span>
                  </div>
                  <div className="report-finding-box">
                    <span className="report-finding-box__label">Low</span>
                    <span className="report-finding-box__count">{findings.low}</span>
                  </div>
                </div>
                <p className="report-body-text" style={{ marginTop: '0.75rem' }}>
                  Total findings: {totalFindings}. Overall risk rating: <strong>{risk.label}</strong>. Assessment score: <strong>{assessment.score ?? 0}%</strong>.
                </p>
              </div>

              {/* Detailed Findings */}
              {totalFindings > 0 && (
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
                            <p className="report-finding-row__title">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
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
                        {photo.name} — {photo.questionId.replace(/([A-Z])/g, ' $1').trim()}
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
