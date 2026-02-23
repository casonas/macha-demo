import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AssessmentForm } from '../organisms/AssessmentForm';
import AppShell from '../layout/AppShell';
import { completeAssessment, getActiveAssessmentId, getAssessmentById, saveAssessmentProgress } from '../../services/data';
import './AssessmentDemo.css';

export const AssessmentDemo: React.FC = () => {
const [params] = useSearchParams();
const navigate = useNavigate();
const recordId = params.get('id') || getActiveAssessmentId() || 'AS-LOCAL';
const record = getAssessmentById(recordId);
const assessmentId = record?.assessmentId || 'school-security-v1';
const buildingId = record?.buildingId || 'building-001';
const savedResponses = record?.responses || {};

const handleSubmit = async (responses: Record<string, any>, photos: Record<string, { name: string; dataUrl: string }[]>) => {
completeAssessment(recordId, responses, photos);
navigate(`/report/${recordId}`);
};

const handleSave = (responses: Record<string, any>) => {
saveAssessmentProgress(recordId, responses);
alert('Progress saved.');
};

return (
<AppShell title="Assessment Workspace">
<div className="assessment-demo">
<AssessmentForm
assessmentId={assessmentId}
buildingId={buildingId}
onSubmit={handleSubmit}
onSave={handleSave}
initialData={savedResponses}
/>
</div>
</AppShell>
);
};

export default AssessmentDemo;