import { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { formatCurrency } from '../utils/billing';

const STATUS_STYLES = {
  pending: 'badge-amber',
  under_review: 'badge-teal',
  approved: 'badge-lime',
  rejected: 'badge-rose',
  paid: 'badge-lime',
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function money(value) {
  return formatCurrency(value || 0);
}

function labelForStatus(status) {
  return String(status || 'unknown').replace('_', ' ');
}

export default function WinningsPage() {
  const toast = useToast();
  const [winnings, setWinnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proofInputs, setProofInputs] = useState({});
  const [uploadingId, setUploadingId] = useState(null);

  const load = async () => {
    try {
      const data = await api.get('/winners/my');
      setWinnings(asArray(data));
    } catch {
      setWinnings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleFileChange = (winnerId, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image screenshot');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProofInputs((current) => ({
        ...current,
        [winnerId]: {
          dataUrl: reader.result,
          name: file.name,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const submitProof = async (winnerId) => {
    const proof = proofInputs[winnerId];
    if (!proof?.dataUrl) {
      toast.error('Please upload a screenshot image');
      return;
    }

    setUploadingId(winnerId);
    try {
      await api.post(`/winners/${winnerId}/proof`, { proofDataUrl: proof.dataUrl });
      toast.success('Proof submitted for review');
      await load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploadingId(null);
    }
  };

  const totalPaid = winnings
    .filter((winner) => winner.status === 'paid')
    .reduce((sum, winner) => sum + Number(winner.amount || 0), 0);

  const totalPending = winnings
    .filter((winner) => ['pending', 'under_review', 'approved'].includes(winner.status))
    .reduce((sum, winner) => sum + Number(winner.amount || 0), 0);

  return (
    <div className="page-shell">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 8 }}>My Winnings</h1>
        <p className="text-muted" style={{ fontSize: '0.88rem' }}>Track your prize history, submit proof, and follow payout status.</p>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="stat-value" style={{ color: 'var(--lime)' }}>{money(totalPaid)}</div>
          <div className="stat-label" style={{ marginTop: 4 }}>Total Paid</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="stat-value" style={{ color: 'var(--amber)' }}>{money(totalPending)}</div>
          <div className="stat-label" style={{ marginTop: 4 }}>Pending Payout</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="stat-value">{winnings.length}</div>
          <div className="stat-label" style={{ marginTop: 4 }}>Total Prizes</div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>
      ) : winnings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>No winnings yet</h3>
          <p className="text-muted" style={{ fontSize: '0.88rem' }}>Keep entering your scores each month to stay in the running for the next draw.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {winnings.map((winner) => (
            <div key={winner.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--amber)' }}>{money(winner.amount)}</span>
                    <span className={`badge ${STATUS_STYLES[winner.status] || 'badge-dim'}`}>{labelForStatus(winner.status)}</span>
                    <span className="badge badge-dim">{winner.matchType || 'Prize'}</span>
                  </div>
                  <div style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--text-3)' }}>
                    {winner.createdAt ? new Date(winner.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date unavailable'}
                  </div>
                </div>
              </div>

              {winner.status === 'pending' && (
                <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8 }}>Submit verification proof</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: 12 }}>
                    Upload a screenshot of your recorded scores so the admin team can review your win.
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      className="form-input"
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleFileChange(winner.id, event.target.files?.[0])}
                      style={{ flex: 1, minWidth: 220 }}
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => submitProof(winner.id)} disabled={uploadingId === winner.id}>
                      {uploadingId === winner.id ? <div className="spinner" /> : 'Submit Proof'}
                    </button>
                  </div>
                  {proofInputs[winner.id]?.dataUrl && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: 8 }}>
                        Ready to submit: {proofInputs[winner.id].name}
                      </div>
                      <img
                        src={proofInputs[winner.id].dataUrl}
                        alt="Proof preview"
                        style={{ width: '100%', maxWidth: 280, borderRadius: 10, border: '1px solid var(--border)' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {winner.status === 'under_review' && (
                <div style={{ background: 'rgba(45,212,191,0.07)', borderRadius: 10, padding: '12px 14px', fontSize: '0.82rem', color: 'var(--teal)' }}>
                  Your proof has been submitted and is under review.
                  {winner.proofUrl && (
                    <div style={{ marginTop: 10 }}>
                      <img
                        src={winner.proofUrl}
                        alt="Submitted proof"
                        style={{ width: '100%', maxWidth: 280, borderRadius: 10, border: '1px solid var(--border)' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {winner.status === 'approved' && (
                <div style={{ background: 'var(--lime-glow)', borderRadius: 10, padding: '12px 14px', fontSize: '0.82rem', color: 'var(--lime)' }}>
                  Approved. Your payout is being processed.
                </div>
              )}

              {winner.status === 'rejected' && (
                <div style={{ background: 'rgba(244,63,94,0.08)', borderRadius: 10, padding: '12px 14px', fontSize: '0.82rem', color: 'var(--rose)' }}>
                  Proof rejected. Please contact support if this looks wrong.
                </div>
              )}

              {winner.status === 'paid' && (
                <div style={{ background: 'var(--lime-glow)', borderRadius: 10, padding: '12px 14px', fontSize: '0.82rem', color: 'var(--lime)' }}>
                  Paid. {money(winner.amount)} has been marked as sent.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: 24, background: 'var(--surface-2)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 14, fontSize: '1rem' }}>Payout process</h3>
        <div style={{ display: 'flex', gap: 0, position: 'relative', flexWrap: 'wrap' }}>
          <div style={{ position: 'absolute', top: 14, left: 0, right: 0, height: 1, background: 'var(--border)', zIndex: 0 }} />
          {['Win in Draw', 'Submit Proof', 'Admin Review', 'Payout Sent'].map((step, index) => (
            <div key={step} style={{ flex: 1, minWidth: 120, textAlign: 'center', position: 'relative', zIndex: 1, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: '0.72rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--lime)' }}>{index + 1}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', lineHeight: 1.3 }}>{step}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
