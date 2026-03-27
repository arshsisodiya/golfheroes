import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { APP_CURRENCY, PLAN_OPTIONS, formatCurrency } from '../utils/billing';

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [charities, setCharities] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', plan: 'monthly', charityId: '', charityContribution: 10 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/charities').then(setCharities).catch(() => {});
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const user = await register(form);
      toast.success('Account created. Complete your payment to activate the subscription.');
      navigate(user.role === 'admin' ? '/admin' : '/subscribe', { state: { plan: form.plan } });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', padding: '32px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="orb" style={{ width: 500, height: 500, background: 'var(--lime-glow)', top: -200, left: -150 }} />

      <div style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' }}>Golf<span style={{ color: 'var(--lime)' }}>Heroes</span></span>
        </Link>

        <div style={{ display: 'flex', gap: 8, marginBottom: 28, justifyContent: 'center' }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: s <= step ? 'var(--lime)' : 'var(--surface-2)', color: s <= step ? 'var(--black)' : 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.2s' }}>{s}</div>
              {s < 3 && <div style={{ width: 40, height: 2, background: s < step ? 'var(--lime)' : 'var(--surface-3)', transition: 'all 0.2s' }} />}
            </div>
          ))}
        </div>

        <div className="card animate-fadeIn">
          {step === 1 && (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: 6 }}>Create your account</h2>
              <p className="text-muted" style={{ fontSize: '0.88rem', marginBottom: 24 }}>Step 1 of 3 - Account details</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" type="text" placeholder="John Smith" value={form.name} onChange={(e) => set('name', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="john@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" placeholder="Min 8 characters" value={form.password} onChange={(e) => set('password', e.target.value)} required />
                </div>
                <button className="btn btn-primary" onClick={() => { if (!form.name || !form.email || form.password.length < 8) return toast.error('Please complete all fields (min 8 character password)'); setStep(2); }} style={{ marginTop: 4 }}>
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: 6 }}>Choose your plan</h2>
              <p className="text-muted" style={{ fontSize: '0.88rem', marginBottom: 24 }}>Step 2 of 3 - Subscription</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {PLAN_OPTIONS.map((p) => (
                  <div key={p.id} onClick={() => set('plan', p.id)} style={{ border: `2px solid ${form.plan === p.id ? 'var(--lime)' : 'var(--border)'}`, borderRadius: 12, padding: '16px 20px', cursor: 'pointer', background: form.plan === p.id ? 'var(--lime-glow)' : 'var(--surface-2)', transition: 'all 0.15s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{p.label}</span>
                        {p.popular && <span className="badge badge-lime" style={{ fontSize: '0.6rem' }}>Most Popular</span>}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>{p.note}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem' }}>{formatCurrency(p.amount)}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{p.period}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: 20 }}>
                Payment happens in the next step through Razorpay. Your account stays inactive until the payment is verified in {APP_CURRENCY}.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" onClick={() => setStep(1)} style={{ flex: 1 }}>Back</button>
                <button className="btn btn-primary" onClick={() => setStep(3)} style={{ flex: 2 }}>Continue</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: 6 }}>Choose your charity</h2>
              <p className="text-muted" style={{ fontSize: '0.88rem', marginBottom: 20 }}>Step 3 of 3 - Where your contribution goes</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, maxHeight: 280, overflowY: 'auto' }}>
                {charities.map((c) => (
                  <div key={c.id} onClick={() => set('charityId', c.id)} style={{ border: `2px solid ${form.charityId === c.id ? 'var(--teal)' : 'var(--border)'}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer', background: form.charityId === c.id ? 'rgba(45,212,191,0.08)' : 'var(--surface-2)', transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>{c.category}</div>
                      </div>
                      {form.charityId === c.id && <span style={{ color: 'var(--teal)', fontSize: '1.1rem' }}>✓</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Contribution % (min 10%)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="range" min="10" max="50" value={form.charityContribution} onChange={(e) => set('charityContribution', Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--teal)' }} />
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--teal)', minWidth: 40 }}>{form.charityContribution}%</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" onClick={() => setStep(2)} style={{ flex: 1 }}>Back</button>
                <button className="btn btn-primary" onClick={handleSubmit} style={{ flex: 2 }} disabled={loading || !form.charityId}>
                  {loading ? <><div className="spinner" /> Creating...</> : 'Create Account and Continue to Payment'}
                </button>
              </div>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: 'var(--text-3)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--lime)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
