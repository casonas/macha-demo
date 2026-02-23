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

  const contactItems = [
    {
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
      label: 'Email',
      value: 'info@machagroup.com',
      bg: 'bg-emerald-100',
      text: 'text-emerald-600',
    },
    {
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
      label: 'Phone',
      value: '(555) 123-4567',
      bg: 'bg-blue-100',
      text: 'text-blue-600',
    },
    {
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
      label: 'Office',
      value: 'United States',
      bg: 'bg-amber-100',
      text: 'text-amber-600',
    },
    {
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
      label: 'Business Hours',
      value: 'Mon - Fri, 9:00 AM - 5:00 PM EST',
      bg: 'bg-purple-100',
      text: 'text-purple-600',
    },
  ];

  return (
    <AppShell title="Contact Us">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl p-8 sm:p-12 text-white text-center" style={{ background: 'radial-gradient(circle at top, #142b14 0%, #050805 75%)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-15 -translate-y-1/2 translate-x-1/3" style={{ background: '#228b22' }} />
          <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-10 translate-y-1/2 -translate-x-1/4" style={{ background: '#32dc32' }} />
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Get in Touch</h2>
            <p className="text-slate-300 text-sm sm:text-base mt-3 max-w-lg mx-auto">
              Have questions about our security assessment services? Our team is ready to help you protect what matters most.
            </p>
          </div>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {contactItems.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow text-center group">
              <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center ${item.text} mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                {item.icon}
              </div>
              <p className="text-sm font-bold text-slate-900">{item.label}</p>
              <p className="text-xs text-slate-500 mt-1">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10">
          {submitted ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900">Message Sent Successfully!</h3>
              <p className="text-sm text-slate-500 mt-3 max-w-md mx-auto">Thank you for reaching out. Our team will review your message and get back to you within 1-2 business days.</p>
              <button
                onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                className="mt-6 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h3 className="text-xl font-extrabold text-slate-900">Send Us a Message</h3>
                <p className="text-sm text-slate-500 mt-1">Fill out the form below and we'll respond as soon as possible.</p>
              </div>
              <form onSubmit={onSubmit} className="space-y-5 max-w-2xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={update('name')}
                      placeholder="John Doe"
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow hover:shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={update('email')}
                      placeholder="john@example.com"
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow hover:shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject</label>
                  <select
                    value={form.subject}
                    onChange={update('subject')}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-shadow hover:shadow-sm"
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
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message</label>
                  <textarea
                    value={form.message}
                    onChange={update('message')}
                    placeholder="How can we help you?"
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-vertical transition-shadow hover:shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md"
                >
                  Send Message
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default ContactUs;
