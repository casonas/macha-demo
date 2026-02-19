import React, { useState } from 'react';
import AppShell from '../layout/AppShell';
import { useNavigate } from 'react-router-dom';
import { createAssessment } from '../../services/data';
import './pages.css';

export const CreateAssessment: React.FC = () => {
  const [name, setName] = useState('Physical Security Assessment');
  const [buildingId, setBuildingId] = useState('building-001');
  const [assessmentId, setAssessmentId] = useState('physical-security');
  const navigate = useNavigate();

  const onCreate = () => {
    const rec = createAssessment({ name, buildingId, assessmentId });
    navigate(`/assessment?id=${encodeURIComponent(rec.id)}`);
  };

  return (
    <AppShell title="Create Assessment">
      <article className="panel form-panel">
        <h3>Create New Assessment</h3>
        <label>Assessment Name<input value={name} onChange={e => setName(e.target.value)} /></label>
        <label>Building<select value={buildingId} onChange={e => setBuildingId(e.target.value)}>
          <option value="building-001">Main Campus</option>
          <option value="building-002">North Campus</option>
        </select></label>
        <label>Question Set<select value={assessmentId} onChange={e => setAssessmentId(e.target.value)}>
          <option value="physical-security">Physical Security</option>
        </select></label>
        <button className="primary-btn" onClick={onCreate}>Start Assessment</button>
      </article>
    </AppShell>
  );
};

export default CreateAssessment;