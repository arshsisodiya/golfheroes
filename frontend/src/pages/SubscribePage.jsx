import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { formatCurrency, getPlanOption, PLAN_OPTIONS } from '../utils/billing';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function SubscribePage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [plan, setPlan] = useState(location.state?.plan || user?.subscriptionPlan || 'monthly');
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    api.get('/subscriptions/config')
      .then((data) => setConfigured(Boolean(data.configured && data.razorpayKeyId)))
      .catch(() => setConfigured(false));
  }, []);

  const launchCheckout = async () => {
    setLoading(true);
    try {
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady) {
        throw new Error('Failed to load Razorpay checkout');
      }

      const data = await api.post('/subscriptions/create-order', { plan });
      const planLabel = getPlanOption(plan)?.label || plan;

      const razorpay = new window.Razorpay({
        key: data.razorpayKeyId,
        order_id: data.order.id,
        name: 'GolfHeroes',
        description: `${planLabel} subscription`,
        amount: data.order.amount,
        currency: data.order.currency,
        prefill: {
          name: data.user?.name || user?.name || '',
          email: data.user?.email || user?.email || '',
        },
        theme: {
          color: '#c8f135',
        },
        handler: async (response) => {
          try {
            await api.post('/subscriptions/verify-payment', response);
            await refreshUser();
            toast.success('Payment verified and subscription activated');
            navigate('/dashboard');
          } catch (error) {
            toast.error(error.message || 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      });

      razorpay.on('payment.failed', (event) => {
        toast.error(event.error?.description || 'Payment failed');
      });

      razorpay.open();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="orb" style={{ width: 400, height: 400, background: 'var(--lime-glow)', top: -100, left: '50%', transform: 'translateX(-50%)' }} />
      <div style={{ maxWidth: 460, width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 8 }}>Choose Your Plan</h1>
          <p className="text-muted">Your subscription is activated only after successful payment verification.</p>
        </div>

        {!configured && (
          <div className="card" style={{ marginBottom: 18, border: '1px solid rgba(244,63,94,0.2)', background: 'rgba(244,63,94,0.06)' }}>
            <div style={{ fontWeight: 700, color: 'var(--rose)', marginBottom: 6 }}>Payments are not configured yet</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
              Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the backend environment to enable checkout.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
          {PLAN_OPTIONS.map((entry) => (
            <div
              key={entry.id}
              onClick={() => setPlan(entry.id)}
              style={{
                border: `2px solid ${plan === entry.id ? 'var(--lime)' : 'var(--border)'}`,
                borderRadius: 14,
                padding: '18px 22px',
                cursor: 'pointer',
                background: plan === entry.id ? 'var(--lime-glow)' : 'var(--surface)',
                transition: 'all 0.15s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>{entry.label}</span>
                  {entry.popular && <span className="badge badge-lime" style={{ fontSize: '0.6rem' }}>Best Value</span>}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 3 }}>{entry.note}</div>
              </div>
              <div>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem' }}>{formatCurrency(entry.amount)}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{entry.period}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontSize: '0.8rem', color: 'var(--text-3)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>Verified Razorpay payment before activation</span>
          <span>Monthly prize draw entry after successful payment</span>
          <span>Minimum 10% of your subscription goes to your chosen charity</span>
          <span>Automatic access control for active and lapsed subscriptions</span>
        </div>

        <button className="btn btn-primary" style={{ width: '100%' }} onClick={launchCheckout} disabled={loading || !configured}>
          {loading ? <div className="spinner" /> : `Pay with Razorpay - ${formatCurrency(getPlanOption(plan)?.amount)}`}
        </button>
      </div>
    </div>
  );
}
