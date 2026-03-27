import { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

function currency(value) {
  return `INR ${Number(value || 0).toFixed(2)}`;
}

export default function AdminUsers() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [viewScores, setViewScores] = useState(null);
  const [scores, setScores] = useState([]);
  const [editingScoreId, setEditingScoreId] = useState(null);
  const [scoreEditForm, setScoreEditForm] = useState({ value: '', date: '' });

  const load = async () => {
    try {
      const data = await api.get('/admin/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredUsers = users.filter((user) => !search || user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase()));

  const saveEdit = async () => {
    try {
      await api.put(`/admin/users/${editId}`, editForm);
      toast.success('User updated');
      setEditId(null);
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const loadScores = async (userId) => {
    try {
      const data = await api.get(`/admin/users/${userId}/scores`);
      setScores(Array.isArray(data) ? data : []);
      setViewScores(userId);
      setEditingScoreId(null);
    } catch (error) {
      toast.error(error.message || 'Failed to load scores');
    }
  };

  const saveScore = async () => {
    if (!viewScores || !editingScoreId) return;
    try {
      await api.put(`/admin/users/${viewScores}/scores/${editingScoreId}`, {
        value: Number(scoreEditForm.value),
        date: scoreEditForm.date,
      });
      toast.success('Score updated');
      setEditingScoreId(null);
      await loadScores(viewScores);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const deleteScore = async (scoreId) => {
    if (!viewScores) return;
    if (!confirm('Delete this score?')) return;
    try {
      await api.delete(`/admin/users/${viewScores}/scores/${scoreId}`);
      toast.success('Score deleted');
      await loadScores(viewScores);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>Users</h1>
        <p className="text-muted" style={{ fontSize: '0.88rem' }}>Manage subscriber accounts, subscription details, and score history.</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input className="form-input" style={{ flex: 1, maxWidth: 320 }} placeholder="Search by name or email" value={search} onChange={(event) => setSearch(event.target.value)} />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-3)' }}>
          <span>{filteredUsers.length} users</span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Scores</th>
                  <th>Total Won</th>
                  <th>Charity %</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: user.role === 'admin' ? 'var(--amber)' : 'var(--lime)', flexShrink: 0 }}>{user.avatarInitials}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.88rem' }}>{user.name}</div>
                          <div style={{ fontSize: '0.73rem', color: 'var(--text-3)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {editId === user.id ? (
                        <select className="form-input form-select" style={{ padding: '4px 8px', fontSize: '0.8rem', width: 110 }} value={editForm.subscriptionPlan || ''} onChange={(event) => setEditForm((current) => ({ ...current, subscriptionPlan: event.target.value }))}>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      ) : (
                        <span className="badge badge-dim">{user.subscriptionPlan || '-'}</span>
                      )}
                    </td>
                    <td>
                      {editId === user.id ? (
                        <select className="form-input form-select" style={{ padding: '4px 8px', fontSize: '0.8rem', width: 110 }} value={editForm.subscriptionStatus || ''} onChange={(event) => setEditForm((current) => ({ ...current, subscriptionStatus: event.target.value }))}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <span className={`badge ${user.subscriptionStatus === 'active' ? 'badge-lime' : 'badge-dim'}`}>{user.subscriptionStatus}</span>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => loadScores(user.id)} style={{ fontSize: '0.78rem' }}>
                        {user.scoreCount} scores
                      </button>
                    </td>
                    <td style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{currency(user.totalWon)}</td>
                    <td>
                      {editId === user.id ? (
                        <input className="form-input" type="number" min="10" max="100" style={{ width: 60, padding: '4px 8px', fontSize: '0.8rem' }} value={editForm.charityContribution || ''} onChange={(event) => setEditForm((current) => ({ ...current, charityContribution: Number(event.target.value) }))} />
                      ) : (
                        <span style={{ fontSize: '0.85rem' }}>{user.charityContribution}%</span>
                      )}
                    </td>
                    <td>
                      {user.role !== 'admin' && (
                        editId === user.id ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-primary btn-sm" onClick={saveEdit}>Save</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                          </div>
                        ) : (
                          <button className="btn btn-ghost btn-sm" onClick={() => {
                            setEditId(user.id);
                            setEditForm({
                              subscriptionStatus: user.subscriptionStatus,
                              subscriptionPlan: user.subscriptionPlan,
                              charityContribution: user.charityContribution,
                            });
                          }}>Edit</button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewScores && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setViewScores(null)}>
          <div className="card" style={{ width: '100%', maxWidth: 440, maxHeight: '80vh', overflowY: 'auto' }} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>User Scores</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setViewScores(null)}>Close</button>
            </div>
            {scores.length === 0 ? (
              <p className="text-muted" style={{ textAlign: 'center', padding: '20px 0' }}>No scores entered.</p>
            ) : scores.map((score) => (
              <div key={score.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '0.88rem' }}>
                {editingScoreId === score.id ? (
                  <>
                    <input className="form-input" type="number" min="1" max="45" value={scoreEditForm.value} onChange={(event) => setScoreEditForm((current) => ({ ...current, value: event.target.value }))} style={{ width: 80, padding: '4px 8px' }} />
                    <input className="form-input" type="date" value={scoreEditForm.date} onChange={(event) => setScoreEditForm((current) => ({ ...current, date: event.target.value }))} style={{ width: 140, padding: '4px 8px' }} />
                    <button className="btn btn-primary btn-sm" onClick={saveScore}>Save</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingScoreId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--lime)' }}>{score.value} pts</span>
                    <span style={{ color: 'var(--text-3)' }}>{new Date(score.date).toLocaleDateString('en-GB')}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => {
                        setEditingScoreId(score.id);
                        setScoreEditForm({ value: score.value, date: new Date(score.date).toISOString().split('T')[0] });
                      }}>Edit</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => deleteScore(score.id)}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
