import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyDemo = (email, password) => setForm({ email, password });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black)', padding: 24 }}>
      <div className="orb" style={{ width: 400, height: 400, background: 'var(--lime-glow)', top: -100, right: -100 }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 36, justifyContent: 'center' }}>
          <div style={{ width: 36, height: 36, background: 'var(--lime)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--black)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' }}>Golf<span style={{ color: 'var(--lime)' }}>Heroes</span></span>
        </Link>

        <div className="card animate-fadeUp">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: 6 }}>Welcome back</h1>
          <p className="text-muted" style={{ marginBottom: 18, fontSize: '0.9rem' }}>Sign in to your account</p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => applyDemo('player@golfheroes.com', 'Player123!')}>
              Use Demo Player
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => applyDemo('admin@golfheroes.com', 'Admin123!')}>
              Use Demo Admin
            </button>
          </div>

          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="your@email.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowPassword((current) => !current)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 4 }} disabled={loading}>
              {loading ? <><div className="spinner" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div className="divider" style={{ margin: '24px 0' }} />

          <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '14px 16px', fontSize: '0.8rem' }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-2)' }}>Demo Credentials</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
              <span>Player: player@golfheroes.com / Player123!</span>
              <span>Admin: admin@golfheroes.com / Admin123!</span>
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: 'var(--text-3)' }}>
            New here? <Link to="/register" style={{ color: 'var(--lime)' }}>Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
