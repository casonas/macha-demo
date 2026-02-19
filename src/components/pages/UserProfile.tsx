import React, { useMemo } from 'react';
import AppShell from '../layout/AppShell';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getProfile, listAssessments } from '../../services/data';
import './pages.css';

export const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const initial = getProfile();
  const displayName = user?.displayName || initial.displayName || '';
  const phone = initial.phone || 'Not provided';
  const address = initial.address || 'Not provided';

  const assessments = useMemo(() => listAssessments(), []);
  const userId = user?.id || initial.userId || 'N/A';

  return (
    <AppShell title="My Profile">
      <div className="space-y-6 flex flex-col items-center w-full">
        {/* Profile Header */}
        <div className="relative overflow-hidden rounded-2xl p-10 sm:p-12 text-white flex flex-col items-center gap-5 text-center w-full" style={{ background: 'radial-gradient(circle at top, #142b14 0%, #050805 75%)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-15 -translate-y-1/2 translate-x-1/3" style={{ background: '#228b22' }} />
          <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-10 translate-y-1/2 -translate-x-1/4" style={{ background: '#32dc32' }} />
          <div className="relative z-10 w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-extrabold text-white border-2 border-white/30 mx-auto">
            {(displayName || 'G').charAt(0).toUpperCase()}
          </div>
          <div className="relative z-10 text-center w-full">
            <h2 className="text-2xl font-extrabold">{displayName || 'Guest'}</h2>
            <p className="text-emerald-200 text-sm mt-1">{user?.email}</p>
            <p className="text-emerald-300 text-xs mt-1 font-mono">ID: {userId}</p>
          </div>
        </div>

        {/* Account Details Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 text-center w-full flex flex-col items-center">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Account Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-xl mx-auto">
            <div className="block">
              <span className="text-sm font-semibold text-slate-700">Full Name</span>
              <p className="mt-1.5 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-900 text-center">
                {displayName || 'Not provided'}
              </p>
            </div>
            <div className="block">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <p className="mt-1.5 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-900 text-center">
                {user?.email ?? 'Not provided'}
              </p>
            </div>
            <div className="block">
              <span className="text-sm font-semibold text-slate-700">Phone</span>
              <p className="mt-1.5 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-900 text-center">
                {phone}
              </p>
            </div>
            <div className="block">
              <span className="text-sm font-semibold text-slate-700">Address</span>
              <p className="mt-1.5 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-900 text-center">
                {address}
              </p>
            </div>
          </div>
        </div>

        {/* Assessment History */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 text-center w-full flex flex-col items-center">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Assessment History</h3>
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