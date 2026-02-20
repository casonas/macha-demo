import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../atoms/Card';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { useAuth } from '../../hooks/useAuth';
import './auth-pages.css';

export const CreateAccount: React.FC = () => {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    organization: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.fullName.trim() || !form.email.trim() || !form.password) {
      setError('Full name, email, and password are required.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await register(form.fullName, form.email, form.password);
      navigate('/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create account');
    }
  };

  const US_STATES = [
    '', 'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY',
    'LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH',
    'OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
  ];

  return (
    <div className="auth-page">
      <Card className="auth-card auth-card--wide" padding="lg" shadow="lg">
        <div className="create-account__header">
          <img src="/Logo.png" alt="Macha Group" className="create-account__logo" />
          <h2 className="create-account__title">Create Your Account</h2>
          <p className="create-account__subtitle">Set up your organization profile to start security assessments.</p>
        </div>

        {error && <div className="create-account__error">{error}</div>}

        <form onSubmit={onSubmit} className="create-account__form">
          {/* Personal Information */}
          <fieldset className="create-account__fieldset">
            <legend className="create-account__legend">Personal Information</legend>
            <div className="create-account__row">
              <Input label="Full Name" value={form.fullName} onChange={update('fullName')} placeholder="John Doe" required fullWidth />
              <Input label="Email Address" type="email" value={form.email} onChange={update('email')} placeholder="john@example.com" required fullWidth />
            </div>
            <div className="create-account__row">
              <Input label="Phone Number" value={form.phone} onChange={update('phone')} placeholder="(555) 123-4567" fullWidth />
              <Input label="Organization" value={form.organization} onChange={update('organization')} placeholder="School District / Company" fullWidth />
            </div>
          </fieldset>

          {/* Address */}
          <fieldset className="create-account__fieldset">
            <legend className="create-account__legend">Address</legend>
            <Input label="Street Address" value={form.streetAddress} onChange={update('streetAddress')} placeholder="123 Main Street" fullWidth />
            <div className="create-account__row create-account__row--3">
              <Input label="City" value={form.city} onChange={update('city')} placeholder="Springfield" fullWidth />
              <div className="create-account__select-wrapper">
                <label className="input__label" htmlFor="state-select">State</label>
                <select id="state-select" className="create-account__select" value={form.state} onChange={update('state')}>
                  <option value="">Select</option>
                  {US_STATES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <Input label="Zip Code" value={form.zipCode} onChange={update('zipCode')} placeholder="62704" fullWidth />
            </div>
          </fieldset>

          {/* Security */}
          <fieldset className="create-account__fieldset">
            <legend className="create-account__legend">Security</legend>
            <div className="create-account__row">
              <Input label="Password" type="password" value={form.password} onChange={update('password')} placeholder="Min 8 chars, 1 upper, 1 number" required fullWidth />
              <Input label="Confirm Password" type="password" value={form.confirmPassword} onChange={update('confirmPassword')} placeholder="Re-enter password" required fullWidth />
            </div>
            <p className="create-account__hint">Password must be at least 8 characters with one uppercase letter and one number.</p>
          </fieldset>

          <Button type="submit" fullWidth loading={loading} size="lg">Create Account</Button>
        </form>

        <p className="auth-links" style={{ textAlign: 'center', marginTop: '1rem' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </Card>
    </div>
  );
};

export default CreateAccount;