import React, { useState, useMemo } from 'react';
import AppShell from '../layout/AppShell';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getProfile, saveProfile, listAssessments } from '../../services/data';
import './pages.css';

export const UserProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const initial = getProfile();
  const [displayName, setDisplayName] = useState(user?.displayName || initial.displayName || '');
  const [phone, setPhone] = useState(initial.phone || '');
  const [address, setAddress] = useState(initial.address || '');
  const [saved, setSaved] = useState(false);

  const assessments = useMemo(() => listAssessments(), []);
  const userId = user?.id || initial.userId || 'N/A';

  const onSave = async () => {
    await updateProfile(displayName);
    saveProfile({ displayName, phone, address, userId });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppShell title="My Profile">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-extrabold text-white border-2 border-white/30">
            {(displayName || 'G').charAt(0).toUpperCase()}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-extrabold">{displayName || 'Guest'}</h2>
            <p className="text-emerald-200 text-sm mt-1">{user?.email}</p>
            <p className="text-emerald-300 text-xs mt-1 font-mono">ID: {userId}</p>
          </div>
        </div>

        {/* Account Details Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Account Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Full Name</span>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your full name"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <input
                value={user?.email ?? ''}
                disabled
                className="mt-1.5 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-400 cursor-not-allowed"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Phone</span>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(555) 555-5555"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Address</span>
              <input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="123 Main St, City, State"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              />
            </label>
          </div>
          <div className="flex items-center gap-4 mt-6">
            <button
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm"
              onClick={onSave}
            >
              Save Changes
            </button>
            {saved && <span className="text-sm font-semibold text-emerald-600">✓ Saved successfully</span>}
          </div>
        </div>

        {/* Assessment History */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Assessment History</h3>
          {assessments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-sm text-slate-500">No assessments yet. Start your first one!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {assessments.map(a => (
                <div key={a.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{a.name}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(a.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {a.address && ` · ${a.address}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className={`status-pill border text-xs ${
                      a.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-amber-100 text-amber-700 border-amber-200'
                    }`}>
                      {a.status === 'completed' ? `${a.score ?? 0}%` : a.status}
                    </span>
                    {a.status === 'completed' && (
                      <button
                        onClick={() => navigate(`/report/${a.id}`)}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        View
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default UserProfile;