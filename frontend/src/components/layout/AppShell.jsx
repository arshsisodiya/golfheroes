import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { to: '/scores', label: 'My Scores', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 19V6l12-3v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="15" r="3"/></svg> },
  { to: '/draws', label: 'Prize Draws', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> },
  { to: '/winnings', label: 'Winnings', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
  { to: '/settings', label: 'Settings', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActive = user?.subscriptionStatus === 'active';

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/');
  };

  const SidebarContent = ({ mobile = false }) => (
    <aside style={{
      width: collapsed ? 72 : 252,
      minHeight: '100vh',
      background: 'var(--void)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
    }}>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
        <div style={{ width: 32, height: 32, background: 'var(--lime)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--black)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
        </div>
        {!collapsed && <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', whiteSpace: 'nowrap' }}>Golf<span style={{ color: 'var(--lime)' }}>Heroes</span></span>}
      </div>

      {!collapsed && (
        <div style={{ padding: '14px 12px 0' }}>
          <div className="card" style={{ padding: 14, background: isActive ? 'linear-gradient(135deg, rgba(200,241,53,0.12), rgba(45,212,191,0.08))' : 'var(--surface)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quick status</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{isActive ? 'You are ready to play this month' : 'Finish setup to unlock the platform'}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.5 }}>
              {isActive ? 'Add scores, check your draw status, and follow your winnings.' : 'Activate your subscription to enter scores and join monthly draws.'}
            </div>
          </div>
        </div>
      )}

      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            onClick={() => mobile && setMobileOpen(false)}
            style={({ isActive: active }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '11px 12px',
              borderRadius: 10,
              color: active ? 'var(--lime)' : 'var(--text-2)',
              background: active ? 'var(--lime-glow)' : 'transparent',
              border: `1px solid ${active ? 'rgba(200,241,53,0.2)' : 'transparent'}`,
              fontWeight: active ? 600 : 500,
              fontSize: '0.875rem',
              transition: 'all 0.15s',
              textDecoration: 'none',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            })}
          >
            <span style={{ flexShrink: 0 }}>{icon}</span>
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', overflow: 'hidden' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--lime)', flexShrink: 0 }}>{user?.avatarInitials}</div>
          {!collapsed && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{isActive ? 'Subscription active' : 'Subscription inactive'}</div>
            </div>
          )}
        </div>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', width: '100%', color: 'var(--text-3)', fontSize: '0.8rem', borderRadius: 8, transition: 'color 0.15s' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          {!collapsed && 'Sign Out'}
        </button>
        <button onClick={() => setCollapsed((current) => !current)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', width: '100%', color: 'var(--text-3)', fontSize: '0.8rem', borderRadius: 8, transition: 'color 0.15s', marginTop: 2 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={collapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'} /></svg>
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div className="hide-mobile"><SidebarContent /></div>
      <div className="show-mobile" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40, background: 'rgba(17,17,20,0.96)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Golf<span style={{ color: 'var(--lime)' }}>Heroes</span></div>
        <button onClick={() => setMobileOpen((open) => !open)} className="btn btn-ghost btn-sm">
          {mobileOpen ? 'Close' : 'Menu'}
        </button>
      </div>
      {mobileOpen && (
        <div className="show-mobile" style={{ position: 'fixed', inset: 0, zIndex: 45, background: 'rgba(0,0,0,0.6)' }} onClick={() => setMobileOpen(false)}>
          <div style={{ width: 252, maxWidth: '82vw' }} onClick={(event) => event.stopPropagation()}>
            <SidebarContent mobile />
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
