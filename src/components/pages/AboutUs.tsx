import React from 'react';
import AppShell from '../layout/AppShell';
import './pages.css';

export const AboutUs: React.FC = () => (
  <AppShell title="About Us" isDashboard={true}>
    {/* Main Background Wrapper */}
    <div 
      className="w-full min-h-screen bg-slate-50/50 flex flex-col items-center"
      style={{ paddingTop: '3rem', paddingBottom: '6rem', paddingLeft: '1rem', paddingRight: '1rem' }}
    >
      <div className="w-full max-w-5xl flex flex-col" style={{ gap: '2.5rem' }}>
        
        {/* 1. HERO HEADER (Fixed: Icon and Text side-by-side) */}
        <div 
          className="relative w-full flex flex-col justify-center shadow-xl overflow-hidden" 
          style={{ 
            background: 'radial-gradient(circle at top, #142b14 0%, #050805 100%)',
            padding: '4rem 3rem',
            borderRadius: '2rem'
          }}
        >
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 -translate-y-1/2 translate-x-1/3" style={{ background: '#228b22' }} />
          
          <div className="relative z-10 w-full flex items-center" style={{ gap: '1.5rem', flexWrap: 'wrap' }}>
            <div 
              className="bg-white/10 backdrop-blur-md text-white flex items-center justify-center flex-shrink-0"
              style={{ width: '5rem', height: '5rem', borderRadius: '1.25rem' }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <div style={{ textAlign: 'left', flex: '1 1 300px' }}>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-2" style={{ lineHeight: '1.1' }}>
                About The Macha Group
              </h2>
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed m-0 max-w-2xl">
                Safeguarding organizations by proactively identifying and addressing vulnerabilities to minimize potential threats.
              </p>
            </div>
          </div>
        </div>

        {/* 2. MISSION & VISION GRID (Fixed: Icons parallel to text) */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '2.5rem' 
          }}
        >
          {/* Mission Card */}
          <div 
            className="bg-white border border-slate-200 shadow-sm flex flex-col text-left transition-transform hover:-translate-y-1"
            style={{ borderRadius: '2rem', padding: '2.5rem' }}
          >
            {/* Title Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div 
                className="bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0"
                style={{ width: '3.5rem', height: '3.5rem', borderRadius: '1rem' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 m-0">Our Mission</h3>
            </div>
            <p className="text-slate-600 leading-relaxed m-0 text-base">
              To <strong>safeguard organizations by proactively identifying and addressing vulnerabilities</strong>, minimizing potential threats. We are dedicated to empowering our clients with comprehensive advisory security services, ensuring a more secure and resilient operational environment.
            </p>
          </div>

          {/* Vision Card */}
          <div 
            className="bg-white border border-slate-200 shadow-sm flex flex-col text-left transition-transform hover:-translate-y-1"
            style={{ borderRadius: '2rem', padding: '2.5rem' }}
          >
             {/* Title Row */}
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div 
                className="bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0"
                style={{ width: '3.5rem', height: '3.5rem', borderRadius: '1rem' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 m-0">Our Vision</h3>
            </div>
            <p className="text-slate-600 leading-relaxed m-0 text-base">
              Our vision is to be the <strong>leading authority in vulnerability assessment and threat mitigation</strong>, setting the standard for proactive security solutions across industries.
            </p>
          </div>
        </div>

        {/* 3. ABOUT US SECTION (Fixed: Image strictly constrained so it doesn't get too wide) */}
        <div 
          className="bg-white border border-slate-200 shadow-sm"
          style={{ borderRadius: '2rem', padding: '3rem' }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', alignItems: 'center' }}>
            
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="text-3xl font-bold text-slate-900 mb-2">Who We Are</h3>
              <p className="text-slate-600 leading-relaxed text-lg m-0">
                In a world where security threats are constantly evolving—from planned physical attacks on public buildings and schools to sophisticated cyber-attacks targeting private companies—proactive defense isn’t just a best practice, it’s a necessity.
              </p>
              <p className="text-slate-600 leading-relaxed text-lg m-0">
                The Macha Group was founded in 2023 by a team built on discipline, integrity, and a deep understanding of threat dynamics.
              </p>
            </div>
            
            <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}>
              <img 
                src="/images/field-assessment.png" 
                alt="Security professional conducting a facility assessment" 
                className="shadow-md"
                style={{ 
                  width: '100%', 
                  maxWidth: '450px', // Prevents it from getting massive
                  borderRadius: '1.5rem', 
                  aspectRatio: '4/3', 
                  objectFit: 'cover' 
                }}
              />
            </div>

          </div>
        </div>

        {/* 4. LEADERSHIP SECTION (Fixed: Photos centered, max-width enforced, portrait aspect ratio) */}
        <div 
          className="bg-white border border-slate-200 shadow-sm flex flex-col"
          style={{ borderRadius: '2rem', padding: '3rem' }}
        >
          <h3 className="text-2xl font-bold text-slate-900 mb-8 border-b border-slate-100 pb-5 text-center sm:text-left">
            Executive Leadership
          </h3>
          
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
              gap: '3rem' 
            }}
          >
            {/* Travis Valley */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }} className="group">
              <div 
                className="overflow-hidden shadow-sm mb-4 bg-slate-100" 
                style={{ borderRadius: '1.5rem', width: '100%', maxWidth: '240px', aspectRatio: '4/5' }}
              >
                <img 
                  src="/images/Travis-Valley.png" 
                  alt="Travis Valley" 
                  className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                  style={{ objectFit: 'cover' }} 
                />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-1">Travis Valley</h4>
              <p className="text-emerald-600 font-bold text-sm tracking-wide m-0">Chief Executive Officer</p>
            </div>

            {/* Bobby Lambert */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }} className="group">
              <div 
                className="overflow-hidden shadow-sm mb-4 bg-slate-100" 
                style={{ borderRadius: '1.5rem', width: '100%', maxWidth: '240px', aspectRatio: '4/5' }}
              >
                <img 
                  src="/images/bobby-lambert.png" 
                  alt="Dr. Bobby Lambert" 
                  className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                  style={{ objectFit: 'cover' }} 
                />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-1">Dr. Bobby Lambert</h4>
              <p className="text-emerald-600 font-bold text-sm tracking-wide m-0">Chief Operating Officer</p>
            </div>

            {/* Schuyler Moran */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }} className="group">
              <div 
                className="overflow-hidden shadow-sm mb-4 bg-slate-100" 
                style={{ borderRadius: '1.5rem', width: '100%', maxWidth: '240px', aspectRatio: '4/5' }}
              >
                <img 
                  src="/images/schuyler-moran.png" 
                  alt="Schuyler Moran" 
                  className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                  style={{ objectFit: 'cover' }} 
                />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-1">Schuyler Moran</h4>
              <p className="text-emerald-600 font-bold text-sm tracking-wide m-0">Chief Technology Officer</p>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  </AppShell>
);

export default AboutUs;
