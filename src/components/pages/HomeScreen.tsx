import React, { useMemo } from 'react';
import AppShell from '../layout/AppShell';
import { listAssessments } from '../../services/data';
import HomeDashboardContent from '../dashboard/HomeDashboardContent'; // Import the new UI
import './pages.css';

export const HomeScreen: React.FC = () => {
  const assessments = useMemo(() => listAssessments(), []);
  
  const completed = assessments.filter(a => a.status === 'completed').length;
  const inProgress = assessments.filter(a => a.status !== 'completed').length;
  
  const avgScore = assessments.filter(a => a.score).length
    ? Math.round(
        assessments.filter(a => a.score).reduce((s, a) => s + (a.score || 0), 0) /
        assessments.filter(a => a.score).length
      )
    : 0;

  return (
    <AppShell title="Home">
      {/* We are replacing the old <div className="grid-3"> 
          with the new component that handles the Gauge, 
          the Table, and the Action Tiles.
      */}
      <HomeDashboardContent 
        stats={{
          avgScore,
          completed,
          total: assessments.length,
          inProgress
        }}
        assessments={assessments}
      />
    </AppShell>
  );
};

export default HomeScreen;