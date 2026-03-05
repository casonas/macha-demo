import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './AppShell.css';

interface AppShellProps {
  title: string;
  children: React.ReactNode;
  isDashboard?: boolean; // <-- 1. Added this new prop
}

const navItems = [
  { to: '/home', label: 'Dashboard' },
  { to: '/create-assessment', label: 'New Assessment' },
  { to: '/reports', label: 'Reports' },
  { to: '/profile', label: 'My Profile' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact Us' }
];

export const AppShell: React.FC<AppShellProps> = ({ title, children, isDashboard }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const mobileOpenRef = useRef(mobileOpen);

  useEffect(() => {
    mobileOpenRef.current = mobileOpen;
  }, [mobileOpen]);

  useEffect(() => {
    if (mobileOpenRef.current) {
      setMobileOpen(false);
      requestAnimationFrame(() => {
        mainRef.current?.focus();
      });
    }
  }, [location.pathname]);

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className={`shell ${mobileOpen ? 'shell--open' : ''}`}>
      {/* Mobile overlay */}
      {mobileOpen && <div className="shell__overlay" onClick={() => setMobileOpen(false)} />}
      <aside className="shell__sidebar">
        <button
          className="shell__mobile-toggle"
          onClick={() => setMobileOpen(prev => !prev)}
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
          aria-controls="main-shell-nav"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M3 6h18M3 12h18M3 18h18" stroke="#D1FAE5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="brand">
          <img src="/Logo.png" alt="Macha Group" className="brand__logo" />
          <div>
            <h1 className="brand__title">Macha Group</h1>
            <p className="brand__subtitle">Security Platform</p>
          </div>
        </div>

        <nav id="main-shell-nav" className="shell__nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `shell__link ${isActive ? 'shell__link--active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="shell__user">
          <p className="shell__user-name">{user?.displayName ?? 'Guest'}</p>
          <p className="shell__user-email">{user?.email}</p>
          <button className="shell__logout" onClick={onLogout}>Sign out</button>
        </div>
      </aside>

      {/* 2. Added dynamic classes to remove padding when on the Dashboard */}
      <main
        ref={mainRef}
        className={`shell__main ${isDashboard ? 'shell__main--dashboard' : ''}`}
        tabIndex={-1}
      >
        {!isDashboard && (
          <header className="shell__header">
            <h2>{title}</h2>
          </header>
        )}
        <section className={`shell__content ${isDashboard ? 'shell__content--dashboard' : ''}`}>
          {children}
        </section>
      </main>
    </div>
  );
};

export default AppShell;
