import React, { useState } from 'react';
import AppShell from '../layout/AppShell';
import './pages.css';

export const ContactUs: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo-only contact flow: submitting toggles the confirmation state but
    // does not currently send the message to a backend or email service.
    setSubmitted(true);
  };

  const contactItems = [
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
      label: 'Email',
      value: 'info@machagroup.com',
      bg: 'bg-emerald-100',
      text: 'text-emerald-600',
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
      label: 'Phone',
      value: '(555) 123-4567',
      bg: 'bg-blue-100',
      text: 'text-blue-600',
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
      label: 'Office',
      value: 'United States',
      bg: 'bg-amber-100',
      text: 'text-amber-600',
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
      label: 'Business Hours',
      value: 'Mon - Fri, 9am - 5pm',
      bg: 'bg-purple-100',
      text: 'text-purple-600',
    },
  ];

  return (
    <AppShell title="Contact Us" isDashboard={true}>
      
      <div 
        className="w-full min-h-screen bg-slate-50/50 flex flex-col items-center"
        style={{ paddingTop: '3rem', paddingBottom: '6rem', paddingLeft: '1rem', paddingRight: '1rem' }}
      >
        <div className="w-full max-w-5xl flex flex-col" style={{ gap: '2rem' }}>
          
          {/* FIXED HERO HEADER: Icon and Text side-by-side (parallel) */}
          <div 
            className="relative w-full shadow-xl overflow-hidden" 
            style={{ 
              background: 'radial-gradient(circle at top, #142b14 0%, #050805 100%)',
              padding: '4rem 3rem',
              borderRadius: '2rem'
            }}
          >
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 -translate-y-1/2 translate-x-1/3" style={{ background: '#228b22' }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative', zIndex: 10 }}>
              <div 
                className="bg-white/10 backdrop-blur-md text-white flex items-center justify-center flex-shrink-0"
                style={{ width: '4rem', height: '4rem', borderRadius: '1rem' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <h2 className="font-bold text-white tracking-tight" style={{ fontSize: '2.5rem', marginBottom: '0.25rem', lineHeight: '1.1' }}>
                  Get in Touch
                </h2>
                <p className="text-slate-300" style={{ fontSize: '1rem', margin: 0 }}>
                  Have questions about our security services? We're ready to help.
                </p>
              </div>
            </div>
          </div>

          {/* CONTACT INFO GRID */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1.5rem' 
            }}
          >
            {contactItems.map((item, i) => (
              <div 
                key={i} 
                className="bg-white border border-slate-200 shadow-sm flex flex-col items-center text-center transition-transform hover:-translate-y-1"
                style={{ padding: '2rem 1.5rem', borderRadius: '1.5rem' }}
              >
                <div 
                  className={`flex items-center justify-center ${item.bg} ${item.text} mb-4`}
                  style={{ width: '3.5rem', height: '3.5rem', borderRadius: '1rem' }}
                >
                  {item.icon}
                </div>
                <p className="font-bold text-slate-900" style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{item.label}</p>
                <p className="text-slate-500 font-medium" style={{ fontSize: '0.875rem' }}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* CONTACT FORM */}
          <div 
            className="bg-white border border-slate-200 shadow-sm"
            style={{ padding: '3rem', borderRadius: '2rem' }}
          >
            {submitted ? (
              <div className="text-center flex flex-col items-center justify-center" style={{ padding: '4rem 0' }}>
                <div className="bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6" style={{ width: '5rem', height: '5rem', borderRadius: '9999px' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-3">Message Sent!</h3>
                <p className="text-slate-500 text-lg mb-8">We'll get back to you within 1-2 business days.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors shadow-lg"
                  style={{ padding: '1rem 2rem', borderRadius: '1rem', border: 'none' }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-10">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Send Us a Message</h3>
                  <p className="text-slate-500">Fill out the form below and we'll respond shortly.</p>
                </div>
                
                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '45rem', margin: '0 auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
                      <label className="font-bold text-slate-700" style={{ fontSize: '0.875rem', marginLeft: '0.25rem' }}>Full Name *</label>
                      <input type="text" required className="border-2 border-slate-100 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 transition-all w-full" style={{ padding: '1rem 1.25rem', borderRadius: '1rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
                      <label className="font-bold text-slate-700" style={{ fontSize: '0.875rem', marginLeft: '0.25rem' }}>Email *</label>
                      <input type="email" required className="border-2 border-slate-100 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 transition-all w-full" style={{ padding: '1rem 1.25rem', borderRadius: '1rem' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
                    <label className="font-bold text-slate-700" style={{ fontSize: '0.875rem', marginLeft: '0.25rem' }}>Subject *</label>
                    <select required className="border-2 border-slate-100 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 transition-all w-full appearance-none" style={{ padding: '1rem 1.25rem', borderRadius: '1rem', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1.5em 1.5em' }}>
                      <option value="">Select a topic</option>
                      <option value="general">General Inquiry</option>
                      <option value="assessment">Assessment Services</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
                    <label className="font-bold text-slate-700" style={{ fontSize: '0.875rem', marginLeft: '0.25rem' }}>Message *</label>
                    <textarea required className="border-2 border-slate-100 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 transition-all w-full" style={{ padding: '1.25rem', borderRadius: '1rem', minHeight: '150px' }} />
                  </div>
                  <button type="submit" className="bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-md w-full" style={{ padding: '1.25rem', borderRadius: '1rem', border: 'none', fontSize: '1.1rem' }}>
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
