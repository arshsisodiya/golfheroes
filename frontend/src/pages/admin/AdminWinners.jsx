import { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

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
  return `INR ${Number(value || 0).toFixed(2)}`;
}

function labelForStatus(status) {
  return String(status || 'unknown').replace('_', ' ');
}

export default function AdminWinners() {
  const toast = useToast();
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try {
      const data = await api.get('/admin/winners');
      setWinners(asArray(data));
    } catch (error) {
      toast.error(error.message || 'Failed to load winners');
      setWinners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/admin/winners/${id}/verify`, { status });
      toast.success(`Winner marked ${status}`);
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const filteredWinners = filter === 'all' ? winners : winners.filter((winner) => winner.status === filter);
  const totalPending = winners.filter((winner) => ['pending', 'under_review'].includes(winner.status)).length;
  const totalPaid = winners.filter((winner) => winner.status === 'paid').reduce((sum, winner) => sum + Number(winner.amount || 0), 0);
  const totalAwarded = winners.reduce((sum, winner) => sum + Number(winner.amount || 0), 0);

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>Winners and Payouts</h1>
        <p className="text-muted" style={{ fontSize: '0.88rem' }}>Review proof submissions, approve winners, and track payouts.</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Awarded', val: money(totalAwarded), color: 'var(--lime)' },
          { label: 'Total Paid Out', val: money(totalPaid), color: 'var(--teal)' },
          { label: 'Pending Review', val: totalPending, color: totalPending > 0 ? 'var(--amber)' : 'var(--text)' },
          { label: 'Total Records', val: winners.length, color: 'var(--text)' },
        ].map(({ label, val, color }) => (
          <div key={label} className="card">
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ color, marginTop: 4 }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'pending', 'under_review', 'approved', 'paid', 'rejected'].map((status) => (
          <button
            key={status}
            className="btn btn-sm"
            onClick={() => setFilter(status)}
            style={{
              background: filter === status ? 'var(--amber)' : 'var(--surface-2)',
              color: filter === status ? 'var(--black)' : 'var(--text-2)',
              border: `1px solid ${filter === status ? 'var(--amber)' : 'var(--border)'}`,
              fontFamily: 'var(--font-display)',
              textTransform: 'capitalize',
            }}
          >
            {labelForStatus(status)} {status !== 'all' && `(${winners.filter((winner) => winner.status === status).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>
      ) : filteredWinners.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>No winners in this category yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredWinners.map((winner) => (
            <div key={winner.id} className="card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--amber)' }}>{money(winner.amount)}</span>
                    <span className={`badge ${STATUS_STYLES[winner.status] || 'badge-dim'}`}>{labelForStatus(winner.status)}</span>
                    <span className="badge badge-dim">{winner.matchType || 'Prize'}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{winner.userName || 'Unknown user'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                    {winner.userEmail || 'No email'} · {winner.createdAt ? new Date(winner.createdAt).toLocaleDateString('en-GB') : 'Date unavailable'}
                  </div>
                </div>
              </div>

              {winner.proofUrl && (
                <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '12px 14px', marginBottom: 14, fontSize: '0.82rem' }}>
                  <div style={{ color: 'var(--text-3)', marginBottom: 4, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Submitted proof</div>
                  <img
                    src={winner.proofUrl}
                    alt={`Proof from ${winner.userName || 'winner'}`}
                    style={{ width: '100%', maxWidth: 320, borderRadius: 10, border: '1px solid var(--border)' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {(winner.status === 'pending' || winner.status === 'under_review') && (
                  <>
                    <button className="btn btn-primary btn-sm" onClick={() => updateStatus(winner.id, 'approved')}>Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => updateStatus(winner.id, 'rejected')}>Reject</button>
                  </>
                )}
                {winner.status === 'approved' && (
                  <button className="btn btn-primary btn-sm" onClick={() => updateStatus(winner.id, 'paid')}>Mark as Paid</button>
                )}
                {!winner.proofUrl && winner.status === 'pending' && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--amber)', padding: '8px 0' }}>Awaiting proof from winner</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
