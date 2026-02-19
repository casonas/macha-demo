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
      <div className="space-y-6 max-w-2xl">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">New Assessment</h3>
          <p className="text-sm text-slate-500 mt-1">Configure and launch a new security assessment</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8">
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Assessment Name</span>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Building</span>
              <select
                value={buildingId}
                onChange={e => setBuildingId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 bg-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              >
                <option value="building-001">Main Campus</option>
                <option value="building-002">North Campus</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Question Set</span>
              <select
                value={assessmentId}
                onChange={e => setAssessmentId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 bg-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              >
                <option value="physical-security">Physical Security</option>
              </select>
            </label>
            <div className="pt-2">
              <button
                className="rounded-xl bg-emerald-600 text-white px-6 py-3 font-bold text-sm hover:bg-emerald-700 transition-colors duration-200"
                onClick={onCreate}
              >
                Start Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default CreateAssessment;