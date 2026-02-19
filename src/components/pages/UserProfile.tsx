import React, { useState } from 'react';
import AppShell from '../layout/AppShell';
import { useAuth } from '../../hooks/useAuth';
import { getProfile, saveProfile } from '../../services/data';
import './pages.css';

export const UserProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const initial = getProfile();
  const [displayName, setDisplayName] = useState(user?.displayName || initial.displayName || '');
  const [phone, setPhone] = useState(initial.phone || '');
  const [saved, setSaved] = useState(false);

  const onSave = async () => {
    await updateProfile(displayName);
    saveProfile({ displayName, phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <AppShell title="User Profile">
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 text-xl font-bold">
            {(displayName || 'G').charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{displayName || 'Guest'}</h3>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8">
          <h4 className="text-lg font-bold text-slate-900 mb-6">Account Details</h4>
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Display Name</span>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <input
                value={user?.email ?? ''}
                disabled
                className="mt-1 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-400 cursor-not-allowed"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Phone</span>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(555) 555-5555"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              />
            </label>
            <div className="flex items-center gap-4 pt-2">
              <button
                className="rounded-xl bg-emerald-600 text-white px-6 py-3 font-bold text-sm hover:bg-emerald-700 transition-colors duration-200"
                onClick={onSave}
              >
                Save Profile
              </button>
              {saved && <span className="text-sm font-semibold text-emerald-600">✓ Profile saved</span>}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default UserProfile;