import React, { useState } from 'react';
import AppShell from '../layout/AppShell';
import { useNavigate } from 'react-router-dom';
import { createAssessment } from '../../services/data';
import { useAuth } from '../../hooks/useAuth';
import './pages.css';

const buildingTypes = [
  'School / University',
  'Office Building',
  'Government Facility',
  'Hospital / Healthcare',
  'Warehouse / Industrial',
  'Retail / Commercial',
  'Residential Complex',
  'Other'
];

export const CreateAssessment: React.FC = () => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [buildingType, setBuildingType] = useState('');
  const [assessmentId] = useState('physical-security');
  const navigate = useNavigate();
  const { user } = useAuth();

  const isValid = name.trim() && address.trim() && buildingType;

  const onCreate = () => {
    if (!isValid) return;
    const rec = createAssessment({
      name,
      buildingId: buildingType.toLowerCase().replace(/[\s/]+/g, '-'),
      assessmentId,
      address,
      buildingType,
      userId: user?.id
    });
    navigate(`/assessment?id=${encodeURIComponent(rec.id)}`);
  };

  return (
    <AppShell title="New Assessment">
      <div className="space-y-6 flex flex-col items-center w-full">
        {/* Header */}
        <div className="text-center w-full">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Start a New Assessment</h2>
          <p className="text-sm text-slate-500 mt-2">Enter the facility details below to begin your security inspection.</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 space-y-6 text-center w-full">
          {/* Assessment Name */}
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Assessment Name <span className="text-red-400">*</span></span>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Westfield Elementary Security Review"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
            />
          </label>

          {/* Address */}
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Facility Address <span className="text-red-400">*</span></span>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="e.g. 1234 Main St, Springfield, IL 62701"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
            />
          </label>

          {/* Building Type */}
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Building Type <span className="text-red-400">*</span></span>
            <select
              value={buildingType}
              onChange={e => setBuildingType(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 bg-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
            >
              <option value="">Select building type…</option>
              {buildingTypes.map(bt => (
                <option key={bt} value={bt}>{bt}</option>
              ))}
            </select>
          </label>

          {/* Summary before starting */}
          {isValid && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <p className="text-sm font-semibold text-emerald-800">Ready to begin</p>
              <p className="text-xs text-emerald-700 mt-1">
                <strong>{name}</strong> — {buildingType} at {address}
              </p>
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={onCreate}
            disabled={!isValid}
            className={`w-full rounded-xl py-3.5 px-6 font-bold text-sm transition-all duration-200 whitespace-nowrap ${
              isValid
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            Begin Security Assessment
          </button>
        </div>
      </div>
    </AppShell>
  );
};

export default CreateAssessment;