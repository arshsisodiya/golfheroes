import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { Link } from 'react-router-dom';

export default function ScoresPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ value: '', date: new Date().toISOString().split('T')[0] });
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const isActive = user?.subscriptionStatus === 'active';

  const load = () => api.get('/scores').then(setScores).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { if (isActive) load(); else setLoading(false); }, [isActive]);

  const addScore = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { allScores } = await api.post('/scores', { value: Number(form.value), date: form.date });
      setScores(allScores);
      setForm({ value: '', date: new Date().toISOString().split('T')[0] });
      toast.success('Score added!');
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const saveEdit = async (id) => {
    try {
      await api.put(`/scores/${id}`, { value: Number(editForm.value), date: editForm.date });
      setEditId(null);
      load();
      toast.success('Score updated!');
    } catch (err) { toast.error(err.message); }
  };

  const deleteScore = async (id) => {
    if (!confirm('Delete this score?')) return;
    try {
      await api.delete(`/scores/${id}`);
      setScores(s => s.filter(x => x.id !== id));
      toast.success('Score deleted');
    } catch (err) { toast.error(err.message); }
  };

  if (!isActive) return (
    <div style={{ padding: '48px 28px', maxWidth: 600 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 16 }}>My Scores</h1>
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🔒</div>
        <p className="text-muted" style={{ marginBottom: 20 }}>You need an active subscription to enter scores.</p>
        <Link to="/subscribe" className="btn btn-primary">Subscribe Now</Link>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 8 }}>My Scores</h1>
        <p className="text-muted" style={{ fontSize: '0.88rem' }}>Enter your Stableford scores (1–45). Only your latest 5 are kept — oldest is replaced automatically.</p>
      </div>

      {/* Add form */}
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, var(--surface) 0%, #0f1a0a 100%)', border: '1px solid rgba(200,241,53,0.15)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Add New Score</h3>
        <form onSubmit={addScore} style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1 1 140px' }}>
            <label className="form-label">Stableford Score</label>
            <input className="form-input" type="number" min="1" max="45" placeholder="e.g. 32" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} required />
          </div>
          <div className="form-group" style={{ flex: '2 1 200px' }}>
            <label className="form-label">Date Played</label>
            <input className="form-input" type="date" value={form.date} max={new Date().toISOString().split('T')[0]} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginBottom: 1 }}>
            {submitting ? <div className="spinner" /> : <>+ Add Score</>}
          </button>
        </form>
        <div style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--text-3)' }}>
          {scores.length < 5 ? `${scores.length}/5 scores entered — ${5 - scores.length} more needed for full draw eligibility` : `5/5 scores entered — adding a new score will replace the oldest`}
        </div>
      </div>

      {/* Score list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>
      ) : scores.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>⛳</div>
          <p className="text-muted">No scores yet. Enter your first Stableford score above!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {scores.map((s, i) => (
            <div key={s.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Rank badge */}
              <div style={{ width: 40, height: 40, borderRadius: 10, background: i === 0 ? 'var(--lime-glow)' : 'var(--surface-2)', border: `1px solid ${i === 0 ? 'var(--lime)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.72rem', color: i === 0 ? 'var(--lime)' : 'var(--text-3)' }}>#{i + 1}</span>
              </div>

              {editId === s.id ? (
                <>
                  <input className="form-input" type="number" min="1" max="45" value={editForm.value} onChange={e => setEditForm(f => ({ ...f, value: e.target.value }))} style={{ width: 90 }} />
                  <input className="form-input" type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} style={{ width: 160 }} />
                  <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => saveEdit(s.id)}>Save</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--lime)' }}>{s.value}</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>Stableford points</span>
                      {i === 0 && <span className="badge badge-lime" style={{ fontSize: '0.6rem' }}>Most Recent</span>}
                      {i === scores.length - 1 && scores.length === 5 && <span className="badge badge-amber" style={{ fontSize: '0.6rem' }}>Next to be replaced</span>}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>
                      {new Date(s.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditId(s.id); setEditForm({ value: s.value, date: new Date(s.date).toISOString().split('T')[0] }); }}>Edit</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => deleteScore(s.id)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Score visual */}
      {scores.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Score Trend</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 80 }}>
            {[...scores].reverse().map((s, i) => {
              const pct = (s.value / 45) * 100;
              return (
                <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--lime)' }}>{s.value}</div>
                  <div style={{ width: '100%', background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden', height: 50 }}>
                    <div style={{ width: '100%', background: `linear-gradient(to top, var(--lime), var(--lime-dim))`, height: `${pct}%`, marginTop: `${100 - pct}%`, borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-3)' }}>{new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
