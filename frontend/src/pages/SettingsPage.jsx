import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { formatCurrency, getPlanOption } from '../utils/billing';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [charities, setCharities] = useState([]);
  const [name, setName] = useState(user?.name || '');
  const [charityId, setCharityId] = useState(user?.charityId || '');
  const [contribution, setContribution] = useState(user?.charityContribution || 10);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.get('/charities').then(setCharities).catch(() => {});
    setName(user?.name || '');
    setCharityId(user?.charityId || '');
    setContribution(user?.charityContribution || 10);
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/users/profile', { name });
      await refreshUser();
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const saveCharity = async () => {
    setSaving(true);
    try {
      await api.put('/subscriptions/charity', { charityId, charityContribution: contribution });
      await refreshUser();
      toast.success('Charity preferences saved');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const cancelSubscription = async () => {
    if (!confirm('Cancel your subscription at the end of the current billing period?')) return;
    setCancelling(true);
    try {
      const result = await api.post('/subscriptions/cancel');
      await refreshUser();
      toast.info(result.message || 'Subscription updated');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCancelling(false);
    }
  };

  const isActive = user?.subscriptionStatus === 'active';
  const yearlyPlan = getPlanOption('yearly');
  const monthlyPlan = getPlanOption('monthly');
  const planPrice = user?.subscriptionPlan === 'yearly'
    ? `${formatCurrency(yearlyPlan.amount)}/year`
    : `${formatCurrency(monthlyPlan.amount)}/month`;

  return (
    <div style={{ padding: '32px 28px', maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 8 }}>Settings</h1>
        <p className="text-muted" style={{ fontSize: '0.88rem' }}>Manage your profile, subscription, and charity preferences.</p>
      </div>

      <section className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 18 }}>Profile</h2>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, width: '100%' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700, color: 'var(--lime)' }}>{user?.avatarInitials}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>{user?.email}</div>
            </div>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
            <label className="form-label">Display Name</label>
            <input className="form-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
          </div>
          <button className="btn btn-primary" onClick={saveProfile} disabled={saving || name === user?.name}>{saving ? <div className="spinner" /> : 'Save Name'}</button>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 18 }}>Subscription</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 10, marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>{user?.subscriptionPlan ? user.subscriptionPlan.charAt(0).toUpperCase() + user.subscriptionPlan.slice(1) : 'No'} Plan</span>
              <span className={`badge ${isActive ? 'badge-lime' : 'badge-dim'}`}>{user?.subscriptionStatus}</span>
            </div>
            {isActive && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                {planPrice} · {user?.subscriptionWillCancel ? 'Access ends' : 'Renews'} {user?.subscriptionRenewal ? new Date(user.subscriptionRenewal).toLocaleDateString('en-GB') : '-'}
              </div>
            )}
          </div>
          {isActive ? (
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={cancelSubscription} disabled={cancelling}>
              {cancelling ? <div className="spinner" /> : user?.subscriptionWillCancel ? 'Cancellation Scheduled' : 'Cancel Plan'}
            </button>
          ) : (
            <Link to="/subscribe" className="btn btn-primary btn-sm">Subscribe</Link>
          )}
        </div>
        {user?.subscriptionWillCancel && (
          <div style={{ fontSize: '0.78rem', color: 'var(--amber)', marginBottom: 14 }}>
            Your subscription is set to cancel at the end of the current billing period. You still have access until {user?.subscriptionRenewal ? new Date(user.subscriptionRenewal).toLocaleDateString('en-GB') : 'the end of this cycle'}.
          </div>
        )}
        {isActive && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <span>Full score entry access</span>
            <span>Monthly prize draw eligibility</span>
            <span>{user?.charityContribution}% charity contribution</span>
          </div>
        )}
      </section>

      <section className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 18 }}>Charity Preferences</h2>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Selected Charity</label>
          <select className="form-input form-select" value={charityId} onChange={(event) => setCharityId(event.target.value)}>
            <option value="">Select a charity</option>
            {charities.map((charity) => <option key={charity.id} value={charity.id}>{charity.name} - {charity.category}</option>)}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Monthly Contribution: <strong style={{ color: 'var(--teal)' }}>{contribution}%</strong></label>
          <input type="range" min="10" max="50" value={contribution} onChange={(event) => setContribution(Number(event.target.value))} style={{ width: '100%', accentColor: 'var(--teal)', marginTop: 8 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 4 }}>
            <span>10% minimum</span>
            <span>50% maximum</span>
          </div>
          {user?.subscriptionPlan && (
            <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--teal)' }}>
              Approx. {formatCurrency(((user.subscriptionPlan === 'yearly' ? yearlyPlan.amount / 12 : monthlyPlan.amount) * contribution) / 100)}/month to charity
            </div>
          )}
        </div>

        <button className="btn btn-primary" onClick={saveCharity} disabled={saving || !charityId}>
          {saving ? <div className="spinner" /> : 'Save Charity Preferences'}
        </button>
      </section>

      <section className="card" style={{ background: 'var(--surface-2)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 14 }}>Account Info</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['Email', user?.email],
            ['Role', user?.role],
            ['Member since', user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB') : '-'],
            ['Total won', formatCurrency(user?.totalWon || 0)],
          ].map(([key, value]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-3)' }}>{key}</span>
              <span style={{ fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
