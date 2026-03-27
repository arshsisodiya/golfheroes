import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', icon: 'OV' },
  { to: '/admin/users', label: 'Users', icon: 'US' },
  { to: '/admin/draws', label: 'Draws', icon: 'DR' },
  { to: '/admin/charities', label: 'Charities', icon: 'CH' },
  { to: '/admin/winners', label: 'Winners', icon: 'WI' },
];

export default function AdminShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/');
  };

  const Sidebar = ({ mobile = false }) => (
    <aside style={{ width: 220, minHeight: '100vh', background: 'var(--void)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem' }}>Golf<span style={{ color: 'var(--lime)' }}>Heroes</span></div>
        <div style={{ fontSize: '0.7rem', color: 'var(--amber)', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin Panel</div>
      </div>

      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {ADMIN_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            onClick={() => mobile && setMobileOpen(false)}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 8,
              color: isActive ? 'var(--amber)' : 'var(--text-2)',
              background: isActive ? 'rgba(245,166,35,0.1)' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              fontSize: '0.875rem',
              textDecoration: 'none',
              transition: 'all 0.15s',
            })}
          >
            <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--surface-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <div style={{ padding: '8px 12px', fontSize: '0.78rem', color: 'var(--text-3)' }}>{user?.name}</div>
        <NavLink to="/dashboard" onClick={() => mobile && setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-3)', borderRadius: 8, textDecoration: 'none' }}>User View</NavLink>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', width: '100%', fontSize: '0.8rem', color: 'var(--text-3)', borderRadius: 8 }}>Sign Out</button>
      </div>
    </aside>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div className="hide-mobile"><Sidebar /></div>
      <div className="show-mobile" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40, background: 'rgba(17,17,20,0.96)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Admin<span style={{ color: 'var(--amber)' }}> Panel</span></div>
        <button onClick={() => setMobileOpen((open) => !open)} className="btn btn-ghost btn-sm">
          {mobileOpen ? 'Close' : 'Menu'}
        </button>
      </div>
      {mobileOpen && (
        <div className="show-mobile" style={{ position: 'fixed', inset: 0, zIndex: 45, background: 'rgba(0,0,0,0.6)' }} onClick={() => setMobileOpen(false)}>
          <div style={{ width: 220, maxWidth: '82vw' }} onClick={(event) => event.stopPropagation()}>
            <Sidebar mobile />
          </div>
        </div>
      )}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <div className="show-mobile" style={{ height: 65 }} />
        <Outlet />
      </main>
    </div>
  );
}
