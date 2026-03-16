import React, { useMemo, useState, useCallback, useEffect } from 'react';
import AppShell from '../layout/AppShell';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getProfile, saveProfile, listAssessmentsByUser } from '../../services/data';
import { MfaEnrollment } from '../molecules/MfaEnrollment';
import {
  registerWebAuthnCredential,
  listTrustedDevices,
  revokeTrustedDevice,
  listWebauthnCredentials,
  revokeWebauthnCredential,
  type TrustedDeviceRecord,
  type WebAuthnCredentialRecord,
} from '../../services/auth/securitySessionService';
import './pages.css';

export const UserProfile: React.FC = () => {
  const { user, updateProfile: updateAuthProfile } = useAuth();
  const navigate = useNavigate();
  const initial = getProfile();
  const displayName = user?.displayName || initial.displayName || '';
  const phone = initial.phone || 'Not provided';
  const address = initial.address || 'Not provided';

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: displayName,
    phone: initial.phone || '',
    address: initial.address || '',
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [trustedDevices, setTrustedDevices] = useState<TrustedDeviceRecord[]>([]);
  const [webauthnCredentials, setWebauthnCredentials] = useState<WebAuthnCredentialRecord[]>([]);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [faceIdEnabled, setFaceIdEnabled] = useState(false);

  const assessments = useMemo(() => user ? listAssessmentsByUser(user.id) : [], [user]);
  const userId = user?.id || initial.userId || 'N/A';

  const handleEdit = useCallback(() => {
    setEditForm({
      displayName: displayName,
      phone: initial.phone || '',
      address: initial.address || '',
    });
    setEditing(true);
    setSuccessMsg('');
  }, [displayName, initial.phone, initial.address]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setSuccessMsg('');
  }, []);

  const handleSave = useCallback(async () => {
    if (!editForm.displayName.trim()) return;
    setSaving(true);
    try {
      await updateAuthProfile(editForm.displayName.trim());
      saveProfile({
        displayName: editForm.displayName.trim(),
        phone: editForm.phone.trim() || undefined,
        address: editForm.address.trim() || undefined,
        userId,
      });
      setEditing(false);
      setSuccessMsg('Profile updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } finally {
      setSaving(false);
    }
  }, [editForm, updateAuthProfile, userId]);

  const updateField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEditForm(prev => ({ ...prev, [field]: e.target.value }));

  const loadSecurityData = useCallback(async () => {
    if (!user) return;
    setSecurityLoading(true);
    setSecurityError('');
    try {
      const [devices, credentials] = await Promise.all([
        listTrustedDevices(),
        listWebauthnCredentials(),
      ]);
      setTrustedDevices(devices);
      setWebauthnCredentials(credentials);
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : 'Failed to load security data');
    } finally {
      setSecurityLoading(false);
    }
  }, [user]);

  useEffect(() => {
    setFaceIdEnabled(localStorage.getItem('macha.faceIdEnabled') === 'true');
    void loadSecurityData();
  }, [loadSecurityData]);

  const handleRegisterFaceId = useCallback(async () => {
    setSecurityLoading(true);
    setSecurityError('');
    setSecuritySuccess('');
    try {
      await registerWebAuthnCredential('My mobile Face ID');
      setFaceIdEnabled(true);
      localStorage.setItem('macha.faceIdEnabled', 'true');
      setSecuritySuccess('Face ID / platform authenticator registered.');
      await loadSecurityData();
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : 'Face ID registration failed');
    } finally {
      setSecurityLoading(false);
    }
  }, [loadSecurityData]);

  const handleToggleFaceId = useCallback((enabled: boolean) => {
    setFaceIdEnabled(enabled);
    localStorage.setItem('macha.faceIdEnabled', String(enabled));
  }, []);

  const handleRevokeTrustedDevice = useCallback(async (deviceHash: string) => {
    setSecurityLoading(true);
    setSecurityError('');
    try {
      await revokeTrustedDevice(deviceHash);
      await loadSecurityData();
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : 'Failed to revoke trusted device');
    } finally {
      setSecurityLoading(false);
    }
  }, [loadSecurityData]);

  const handleRevokeCredential = useCallback(async (credIdHash: string) => {
    setSecurityLoading(true);
    setSecurityError('');
    try {
      await revokeWebauthnCredential(credIdHash);
      await loadSecurityData();
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : 'Failed to revoke WebAuthn credential');
    } finally {
      setSecurityLoading(false);
    }
  }, [loadSecurityData]);

  return (
    <AppShell title="My Profile" isDashboard={true}>
      
      {/* 1. Main Background Wrapper */}
      <div 
        className="w-full min-h-screen bg-slate-50/50 flex flex-col items-center"
        style={{ paddingTop: '3rem', paddingBottom: '6rem', paddingLeft: '1rem', paddingRight: '1rem' }}
      >
        <div className="w-full max-w-4xl flex flex-col" style={{ gap: '2rem' }}>
          
          {/* 2. HERO HEADER - Expansive with a prominent avatar */}
          <div 
            className="relative w-full flex flex-col items-center justify-center shadow-xl overflow-hidden text-center" 
            style={{ 
              background: 'radial-gradient(circle at top, #142b14 0%, #050805 100%)',
              paddingTop: '4rem',
              paddingBottom: '4rem',
              borderRadius: '2rem'
            }}
          >
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 -translate-y-1/2 translate-x-1/3" style={{ background: '#228b22' }} />
            
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div 
                className="bg-white/20 backdrop-blur-md flex items-center justify-center font-extrabold text-white border-2 border-white/30 shadow-lg"
                style={{ width: '6rem', height: '6rem', borderRadius: '1.5rem', fontSize: '2.5rem' }}
              >
                {(displayName || 'G').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{displayName || 'Guest'}</h2>
                <p className="text-emerald-200 text-base mt-1">{user?.email}</p>
                <div className="mt-3 inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-300 text-xs font-mono tracking-wider">
                  ID: {userId}
                </div>
              </div>
            </div>
          </div>

          {/* Success Message Banner */}
          {successMsg && (
            <div className="w-full rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold px-6 py-4 flex items-center gap-3 shadow-sm animate-fade-in">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {successMsg}
            </div>
          )}

          {/* 3. ACCOUNT DETAILS CARD */}
          <div 
            className="bg-white border border-slate-200 shadow-sm flex flex-col"
            style={{ borderRadius: '2rem', padding: '3rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
              <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Account Details
              </h3>
              {!editing && (
                <button 
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-sm border border-slate-200 hover:border-emerald-200 transition-colors cursor-pointer"
                  style={{ borderRadius: '0.75rem' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  Edit Profile
                </button>
              )}
            </div>

            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label className="font-bold text-slate-700 text-sm ml-1">Full Name</label>
                    <input
                      value={editForm.displayName}
                      onChange={updateField('displayName')}
                      placeholder="Your full name"
                      className="border-2 border-slate-100 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 transition-all w-full"
                      style={{ padding: '0.875rem 1.25rem', borderRadius: '1rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label className="font-bold text-slate-700 text-sm ml-1">Phone Number</label>
                    <input
                      value={editForm.phone}
                      onChange={updateField('phone')}
                      placeholder="(555) 123-4567"
                      className="border-2 border-slate-100 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 transition-all w-full"
                      style={{ padding: '0.875rem 1.25rem', borderRadius: '1rem' }}
                    />
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="font-bold text-slate-700 text-sm ml-1">Address</label>
                  <input
                    value={editForm.address}
                    onChange={updateField('address')}
                    placeholder="123 Main St, City, ST 12345"
                    className="border-2 border-slate-100 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 transition-all w-full"
                    style={{ padding: '0.875rem 1.25rem', borderRadius: '1rem' }}
                  />
                </div>

                <div className="flex gap-3 justify-end mt-4">
                  <button 
                    onClick={handleCancel} disabled={saving}
                    className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                    style={{ borderRadius: '1rem' }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave} disabled={saving}
                    className="px-6 py-2.5 bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-sm active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                    style={{ borderRadius: '1rem' }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              /* Display Mode Grid - Left Aligned for Readability */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Full Name</span>
                  <p className="text-lg font-semibold text-slate-900">{displayName || 'Not provided'}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Email</span>
                  <p className="text-lg font-semibold text-slate-900">{user?.email ?? 'Not provided'}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Phone</span>
                  <p className="text-lg font-semibold text-slate-900">{phone}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Address</span>
                  <p className="text-lg font-semibold text-slate-900">{address}</p>
                </div>
              </div>
            )}
          </div>

          {/* 4. SMS MFA Section (Wrapped in a matching card) */}
          <div 
            className="bg-white border border-slate-200 shadow-sm flex flex-col"
            style={{ borderRadius: '2rem', padding: '3rem' }}
          >
            <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Two-Factor Authentication
            </h3>
            <MfaEnrollment userPhone={initial.phone} />
          </div>

          {/* 5. ASSESSMENT HISTORY CARD */}
          <div
            className="bg-white border border-slate-200 shadow-sm flex flex-col"
            style={{ borderRadius: '2rem', padding: '3rem' }}
          >
            <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Device & Face ID Security
            </h3>

            {securityError && <p className="text-red-600 text-sm mb-3">{securityError}</p>}
            {securitySuccess && <p className="text-emerald-700 text-sm mb-3">{securitySuccess}</p>}

            <div className="flex flex-col gap-3 mb-5">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={faceIdEnabled}
                  onChange={(e) => handleToggleFaceId(e.target.checked)}
                />
                Use Face ID / platform authenticator when available
              </label>
              <button
                onClick={handleRegisterFaceId}
                disabled={securityLoading}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 disabled:opacity-60 w-fit"
              >
                Register Face ID
              </button>
            </div>

            <div className="mb-4">
              <h4 className="font-bold text-slate-800 mb-2">Trusted Devices (24h)</h4>
              {trustedDevices.length === 0 ? (
                <p className="text-sm text-slate-500">No remembered devices.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {trustedDevices.map((device) => (
                    <div key={device.deviceHash} className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2">
                      <div className="text-xs text-slate-600">
                        <div>{device.label || 'Remembered device'}</div>
                        <div>{device.lastSeenIP || 'Unknown IP'} • {device.lastSeenUA || 'Unknown browser'}</div>
                      </div>
                      <button
                        onClick={() => handleRevokeTrustedDevice(device.deviceHash)}
                        disabled={securityLoading}
                        className="px-3 py-1 text-xs font-semibold border border-red-200 text-red-600 rounded-md hover:bg-red-50"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-2">Registered Face ID Credentials</h4>
              {webauthnCredentials.length === 0 ? (
                <p className="text-sm text-slate-500">No Face ID credentials registered yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {webauthnCredentials.map((cred) => (
                    <div key={cred.credIdHash} className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2">
                      <div className="text-xs text-slate-600">
                        <div>{cred.label || 'Platform authenticator'}</div>
                        <div>Credential hash: {cred.credIdHash?.slice(0, 12)}…</div>
                      </div>
                      <button
                        onClick={() => handleRevokeCredential(cred.credIdHash)}
                        disabled={securityLoading}
                        className="px-3 py-1 text-xs font-semibold border border-red-200 text-red-600 rounded-md hover:bg-red-50"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 6. ASSESSMENT HISTORY CARD */}
          <div 
            className="bg-white border border-slate-200 shadow-sm flex flex-col"
            style={{ borderRadius: '2rem', padding: '3rem' }}
          >
            <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Assessment History
            </h3>
            
            {assessments.length === 0 ? (
              <div className="text-center py-10 flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 flex items-center justify-center rounded-2xl mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <p className="text-lg font-bold text-slate-600">No assessments yet</p>
                <p className="text-sm text-slate-500 mt-1">Start your first inspection to see it here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {assessments.map(a => (
                  <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors" style={{ borderRadius: '1.25rem', gap: '1rem' }}>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold text-slate-900 truncate">{a.name}</p>
                      <p className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          {new Date(a.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {a.address && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="truncate">{a.address}</span>
                          </>
                        )}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`px-3 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider border ${
                        a.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        {a.status === 'completed' ? `Score: ${a.score ?? 0}%` : 'In Progress'}
                      </span>
                      
                      {a.status === 'completed' ? (
                        <button
                          onClick={() => navigate(`/report/${a.id}`)}
                          className="px-4 py-1.5 bg-white border border-emerald-200 text-emerald-700 font-bold text-sm rounded-lg hover:bg-emerald-50 transition-colors shadow-sm"
                        >
                          View Report
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/assessment?id=${encodeURIComponent(a.id)}`)}
                          className="px-4 py-1.5 bg-white border border-amber-200 text-amber-700 font-bold text-sm rounded-lg hover:bg-amber-50 transition-colors shadow-sm"
                        >
                          Continue
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </AppShell>
  );
};

export default UserProfile;
