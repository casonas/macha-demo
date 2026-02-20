import React, { useState } from 'react';
import AppShell from '../layout/AppShell';
import './pages.css';

export const ContactUs: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <AppShell title="Contact Us">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Get in Touch</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">
            Have questions about our security assessment services? Our team is here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Email</p>
                  <p className="text-xs text-slate-500">info@machagroup.com</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Phone</p>
                  <p className="text-xs text-slate-500">(555) 123-4567</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Office</p>
                  <p className="text-xs text-slate-500">United States</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Business Hours</p>
                  <p className="text-xs text-slate-500">Mon - Fri, 9:00 AM - 5:00 PM EST</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            {submitted ? (
              <div className="text-center py-12">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <h3 className="text-xl font-bold text-slate-900">Message Sent</h3>
                <p className="text-sm text-slate-500 mt-2">Thank you for reaching out. Our team will get back to you within 1-2 business days.</p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  className="mt-5 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-slate-900 mb-6">Send Us a Message</h3>
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={update('name')}
                        placeholder="John Doe"
                        required
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={update('email')}
                        placeholder="john@example.com"
                        required
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Subject</label>
                    <select
                      value={form.subject}
                      onChange={update('subject')}
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    >
                      <option value="">Select a topic</option>
                      <option value="general">General Inquiry</option>
                      <option value="assessment">Assessment Services</option>
                      <option value="pricing">Pricing Information</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnership Opportunity</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Message</label>
                    <textarea
                      value={form.message}
                      onChange={update('message')}
                      placeholder="How can we help you?"
                      required
                      rows={5}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-vertical"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    Send Message
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default ContactUs;
