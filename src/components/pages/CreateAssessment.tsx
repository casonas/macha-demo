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
  const [assessmentId] = useState('school-security-v1');
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
    <AppShell title="New Assessment" isDashboard={true}>
      <div 
        className="w-full min-h-screen bg-slate-50/50 flex flex-col items-center"
        style={{ paddingTop: '4rem', paddingBottom: '6rem', paddingLeft: '1rem', paddingRight: '1rem' }}
      >
        <div className="w-full max-w-2xl flex flex-col gap-8">
          
          <div 
            className="bg-white border border-slate-200 shadow-xl flex flex-col relative overflow-hidden"
            style={{ padding: '3rem', borderRadius: '2rem' }}
          >
            {/* Decorative top accent line */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-600" />

            {/* HEADER SECTION - Side-by-side layout (Icon + Text) to fix alignment */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
              <div 
                className="bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm flex-shrink-0"
                style={{ width: '4rem', height: '4rem', borderRadius: '1rem' }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <h2 className="font-bold text-slate-900 tracking-tight" style={{ fontSize: '2.25rem', marginBottom: '0.25rem', lineHeight: '1.2' }}>
                  New Assessment
                </h2>
                <p className="text-slate-500" style={{ fontSize: '1rem', margin: 0 }}>
                  Enter the facility details below to begin your security inspection.
                </p>
              </div>
            </div>

            {/* FORM FIELDS - Forced padding inline so index.css can't ruin it */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
              
              {/* Assessment Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label className="font-bold text-slate-700" style={{ fontSize: '0.875rem', marginLeft: '0.25rem' }}>
                  Assessment Name <span className="text-emerald-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Westfield Elementary Security Review"
                  className="border-2 border-slate-100 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 transition-all w-full"
                  style={{ borderRadius: '1rem', padding: '1rem 1.25rem', fontSize: '1rem' }}
                />
              </div>

              {/* Address */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label className="font-bold text-slate-700" style={{ fontSize: '0.875rem', marginLeft: '0.25rem' }}>
                  Facility Address <span className="text-emerald-500">*</span>
                </label>
                <input
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. 1234 Main St, Springfield, IL 62701"
                  className="border-2 border-slate-100 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 transition-all w-full"
                  style={{ borderRadius: '1rem', padding: '1rem 1.25rem', fontSize: '1rem' }}
                />
              </div>

              {/* Building Type */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label className="font-bold text-slate-700" style={{ fontSize: '0.875rem', marginLeft: '0.25rem' }}>
                  Building Type <span className="text-emerald-500">*</span>
                </label>
                <select
                  value={buildingType}
                  onChange={e => setBuildingType(e.target.value)}
                  className="border-2 border-slate-100 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer w-full"
                  style={{ 
                    borderRadius: '1rem', 
                    padding: '1rem 1.25rem', 
                    fontSize: '1rem',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, 
                    backgroundRepeat: 'no-repeat', 
                    backgroundPosition: 'right 1.25rem center', 
                    backgroundSize: '1.5em 1.5em' 
                  }}
                >
                  <option value="" disabled>Select building type…</option>
                  {buildingTypes.map(bt => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
              </div>

              {/* Summary Box (Only shows when valid) */}
              {isValid && (
                <div className="bg-emerald-50 border border-emerald-100 transition-all" style={{ padding: '1.25rem', borderRadius: '1rem', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <div className="bg-emerald-200 text-emerald-700 flex items-center justify-center" style={{ width: '2rem', height: '2rem', borderRadius: '9999px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <p className="font-bold text-emerald-900" style={{ fontSize: '0.875rem', margin: 0 }}>Ready to begin</p>
                  </div>
                  <p className="text-emerald-800 leading-relaxed" style={{ fontSize: '0.875rem', margin: 0, marginLeft: '2.75rem' }}>
                    <strong>{name}</strong> <br/>
                    <span style={{ opacity: 0.8 }}>{buildingType} at {address}</span>
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={onCreate}
                disabled={!isValid}
                className={`transition-all duration-200 whitespace-nowrap w-full ${
                  isValid
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg cursor-pointer'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
                style={{ 
                  borderRadius: '1rem', 
                  padding: '1rem 1.5rem', 
                  fontSize: '1.125rem', 
                  fontWeight: 'bold',
                  marginTop: '1.5rem',
                  border: 'none'
                }}
              >
                Begin Security Assessment
              </button>
              
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default CreateAssessment;
