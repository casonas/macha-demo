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
      <article className="panel form-panel">
        <h3>Account Details</h3>
        <label>Display Name<input value={displayName} onChange={e => setDisplayName(e.target.value)} /></label>
        <label>Email<input value={user?.email ?? ''} disabled /></label>
        <label>Phone<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 555-5555" /></label>
        <button className="primary-btn" onClick={onSave}>Save Profile</button>
        {saved && <p className="ok-note">Profile saved.</p>}
      </article>
    </AppShell>
  );
};

export default UserProfile;