import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function navButtonStyle(active) {
  return {
    background: active ? 'var(--lime-glow)' : 'var(--surface-2)',
    color: active ? 'var(--lime)' : 'var(--text)',
    border: `1px solid ${active ? 'rgba(200,241,53,0.25)' : 'var(--border)'}`,
  };
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const charitiesActive = location.pathname.startsWith('/charities');
  const dashboardHref = user?.role === 'admin' ? '/admin' : '/dashboard';
  const dashboardActive = user && location.pathname.startsWith(user.role === 'admin' ? '/admin' : '/dashboard');

  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
      <div className="container" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'var(--lime)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--black)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>
            Golf<span style={{ color: 'var(--lime)' }}>Heroes</span>
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="hide-mobile">
          <Link to="/charities" className="btn btn-sm" style={navButtonStyle(charitiesActive)}>Charities</Link>
          {user ? (
            <>
              <Link to={dashboardHref} className="btn btn-sm" style={navButtonStyle(dashboardActive)}>My Area</Link>
              <button onClick={logout} className="btn btn-outline btn-sm">Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>

        <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'none', padding: 8, color: 'var(--text)' }} className="show-mobile">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={menuOpen ? 'M18 6L6 18M6 6l12 12' : 'M3 12h18M3 6h18M3 18h18'} /></svg>
        </button>
      </div>

      {menuOpen && (
        <div style={{ padding: '16px 24px 20px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link to="/charities" className="btn btn-ghost" style={navButtonStyle(charitiesActive)} onClick={() => setMenuOpen(false)}>Charities</Link>
          {user ? (
            <>
              <Link to={dashboardHref} className="btn btn-ghost" style={navButtonStyle(dashboardActive)} onClick={() => setMenuOpen(false)}>My Area</Link>
              <button onClick={() => { logout(); setMenuOpen(false); }} className="btn btn-outline">Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost" onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/register" className="btn btn-primary" onClick={() => setMenuOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
