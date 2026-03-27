import { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

const EMPTY_FORM = {
  name: '',
  description: '',
  category: 'General',
  image: '',
  featured: false,
  upcomingEvents: [],
};

const CATEGORIES = ['General', 'Youth Sports', 'Health', 'Veterans', 'Education', 'Mental Health', 'Humanitarian'];

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function currency(value) {
  return `INR ${Number(value || 0).toLocaleString()}`;
}

export default function AdminCharities() {
  const toast = useToast();
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [eventInput, setEventInput] = useState('');

  const load = async () => {
    try {
      const data = await api.get('/admin/charities');
      setCharities(asArray(data));
    } catch (error) {
      toast.error(error.message || 'Failed to load charities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setEventInput('');
    setShowForm(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/admin/charities/${editId}`, form);
        toast.success('Charity updated');
      } else {
        await api.post('/admin/charities', form);
        toast.success('Charity created');
      }
      resetForm();
      await load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (id) => {
    if (!confirm('Deactivate this charity?')) return;
    try {
      await api.delete(`/admin/charities/${id}`);
      toast.success('Charity deactivated');
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const startEdit = (charity) => {
    setEditId(charity.id);
    setForm({
      name: charity.name || '',
      description: charity.description || '',
      category: charity.category || 'General',
      image: charity.image || '',
      featured: Boolean(charity.featured),
      upcomingEvents: asArray(charity.upcomingEvents),
    });
    setEventInput('');
    setShowForm(true);
  };

  const addEvent = () => {
    const nextValue = eventInput.trim();
    if (!nextValue) return;
    updateForm('upcomingEvents', [...asArray(form.upcomingEvents), nextValue]);
    setEventInput('');
  };

  return (
    <div className="page-shell-wide">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: 4 }}>Charities</h1>
          <p className="text-muted" style={{ fontSize: '0.88rem' }}>Manage charity listings, content, and upcoming events.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setEditId(null); setEventInput(''); setShowForm(true); }}>Add Charity</button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={resetForm}>
          <div className="card" style={{ width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{editId ? 'Edit Charity' : 'Add Charity'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={resetForm}>Close</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="Charity name" />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-input" rows={3} value={form.description} onChange={(event) => updateForm('description', event.target.value)} placeholder="Short description" style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input form-select" value={form.category} onChange={(event) => updateForm('category', event.target.value)}>
                  {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input className="form-input" value={form.image} onChange={(event) => updateForm('image', event.target.value)} placeholder="https://example.com/image.jpg" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="featured" checked={form.featured} onChange={(event) => updateForm('featured', event.target.checked)} style={{ accentColor: 'var(--lime)', width: 16, height: 16 }} />
                <label htmlFor="featured" style={{ fontSize: '0.88rem' }}>Featured on homepage</label>
              </div>
              <div className="form-group">
                <label className="form-label">Upcoming Events</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input className="form-input" value={eventInput} onChange={(event) => setEventInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addEvent(); } }} placeholder="Event name and date" style={{ flex: 1 }} />
                  <button className="btn btn-ghost btn-sm" onClick={addEvent}>Add</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {asArray(form.upcomingEvents).map((eventName, index) => (
                    <div key={`${eventName}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)', padding: '6px 10px', borderRadius: 6, fontSize: '0.82rem' }}>
                      {eventName}
                      <button onClick={() => updateForm('upcomingEvents', asArray(form.upcomingEvents).filter((_, itemIndex) => itemIndex !== index))} style={{ color: 'var(--rose)', cursor: 'pointer' }}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={resetForm}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={save} disabled={saving || !form.name || !form.description}>
                {saving ? <div className="spinner" /> : editId ? 'Save Changes' : 'Create Charity'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>
      ) : (
        <div className="grid-3" style={{ gap: 20 }}>
          {charities.map((charity) => (
            <div key={charity.id} className="card" style={{ padding: 0, overflow: 'hidden', opacity: charity.active === false ? 0.65 : 1 }}>
              {charity.image && <div style={{ height: 120, background: `url(${charity.image}) center/cover` }} />}
              <div style={{ padding: '16px 18px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3 }}>{charity.name}</h3>
                  {charity.featured && <span className="badge badge-lime" style={{ fontSize: '0.6rem', marginLeft: 8, flexShrink: 0 }}>Featured</span>}
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 12 }}>{charity.description}</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  <span className="badge badge-teal" style={{ fontSize: '0.6rem' }}>{charity.category}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--teal)' }}>{currency(charity.totalReceived)} raised</span>
                  {charity.active === false && <span className="badge badge-dim" style={{ fontSize: '0.6rem' }}>Inactive</span>}
                </div>
                {asArray(charity.upcomingEvents).length > 0 && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--amber)', marginBottom: 12 }}>
                    {asArray(charity.upcomingEvents).length} upcoming event{asArray(charity.upcomingEvents).length !== 1 ? 's' : ''}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => startEdit(charity)}>Edit</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => deactivate(charity.id)}>Deactivate</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
