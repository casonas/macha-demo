import React, { useMemo } from 'react';
import AppShell from '../layout/AppShell';
import { listAssessments } from '../../services/data';
import './pages.css';

export const PastAssessments: React.FC = () => {
  const rows = useMemo(() => listAssessments(), []);

  return (
    <AppShell title="Past Assessments">
      <article className="panel">
        <h3>Assessment History</h3>
        <table className="data-table">
          <thead><tr><th>ID</th><th>Name</th><th>Status</th><th>Score</th><th>Updated</th></tr></thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5}>No assessments yet.</td></tr>
            )}
            {rows.map(r => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.name}</td>
                <td>{r.status}</td>
                <td>{r.score ?? '-'}</td>
                <td>{new Date(r.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </AppShell>
  );
};

export default PastAssessments;