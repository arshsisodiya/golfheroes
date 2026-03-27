import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import api from '../utils/api';

const CATEGORIES = ['All', 'Youth Sports', 'Health', 'Veterans', 'Education', 'Mental Health', 'Humanitarian'];

export default function CharitiesPage() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [donationForm, setDonationForm] = useState({ charityId: '', amount: '', donorName: '', donorEmail: '', note: '' });
  const [donating, setDonating] = useState(false);
  const [donationMessage, setDonationMessage] = useState('');

  useEffect(() => {
    api.get('/charities').then(setCharities).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = charities.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || c.category === category;
    return matchSearch && matchCat;
  });

  const submitDonation = async (e) => {
    e.preventDefault();
    setDonationMessage('');
    setDonating(true);
    try {
      const result = await api.post('/donations', {
        charityId: donationForm.charityId,
        amount: Number(donationForm.amount),
        donorName: donationForm.donorName,
        donorEmail: donationForm.donorEmail,
        note: donationForm.note,
      });
      setDonationMessage('Donation submitted. Thank you for your support.');
      setDonationForm({ charityId: donationForm.charityId, amount: '', donorName: '', donorEmail: '', note: '' });
      setCharities((prev) => prev.map((c) => c.id === result.donation.charityId ? { ...c, totalReceived: result.charityTotal } : c));
    } catch (err) {
      setDonationMessage(err.message);
    } finally {
      setDonating(false);
    }
  };

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ paddingTop: 64 }}>
        {/* Hero */}
        <div style={{ padding: '80px 24px 60px', textAlign: 'center', borderBottom: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
          <div className="orb" style={{ width: 500, height: 300, background: 'rgba(45,212,191,0.07)', top: -100, left: '50%', transform: 'translateX(-50%)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="badge badge-teal" style={{ marginBottom: 18 }}>Community Impact</div>
            <h1 className="display-lg" style={{ marginBottom: 16 }}>Causes We Champion</h1>
            <p className="text-muted text-lg" style={{ maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.7 }}>
              Every subscriber chooses a charity. Every subscription contributes. Together, we're making golf matter beyond the fairway.
            </p>
            <Link to="/register" className="btn btn-primary btn-lg">Subscribe & Give Back</Link>
          </div>
        </div>

        <div className="container" style={{ padding: '48px 24px' }}>
          <div className="card" style={{ marginBottom: 28, background: 'linear-gradient(135deg, var(--surface) 0%, #10211a 100%)', border: '1px solid rgba(45,212,191,0.2)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>Make an Independent Donation</h2>
            <p className="text-muted" style={{ marginBottom: 14, fontSize: '0.84rem' }}>Support a charity directly, even without participating in gameplay.</p>
            <form onSubmit={submitDonation} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              <select className="form-input form-select" value={donationForm.charityId} onChange={e => setDonationForm(f => ({ ...f, charityId: e.target.value }))} required>
                <option value="">Select charity</option>
                {charities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input className="form-input" type="number" min="1" step="0.01" placeholder="Amount (INR)" value={donationForm.amount} onChange={e => setDonationForm(f => ({ ...f, amount: e.target.value }))} required />
              <input className="form-input" placeholder="Your name (optional)" value={donationForm.donorName} onChange={e => setDonationForm(f => ({ ...f, donorName: e.target.value }))} />
              <input className="form-input" type="email" placeholder="Email (optional receipt)" value={donationForm.donorEmail} onChange={e => setDonationForm(f => ({ ...f, donorEmail: e.target.value }))} />
              <input className="form-input" placeholder="Note (optional)" value={donationForm.note} onChange={e => setDonationForm(f => ({ ...f, note: e.target.value }))} />
              <button className="btn btn-primary" type="submit" disabled={donating}>{donating ? 'Submitting...' : 'Donate Now'}</button>
            </form>
            {donationMessage && <div style={{ marginTop: 10, fontSize: '0.8rem', color: donationMessage.toLowerCase().includes('thank') ? 'var(--teal)' : 'var(--rose)' }}>{donationMessage}</div>}
          </div>

          {/* Search + filter */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
            <input className="form-input" style={{ flex: 1, minWidth: 200, maxWidth: 360 }} placeholder="Search charities…" value={search} onChange={e => setSearch(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button key={cat} className="btn btn-sm" onClick={() => setCategory(cat)}
                  style={{ background: category === cat ? 'var(--teal)' : 'var(--surface-2)', color: category === cat ? 'var(--black)' : 'var(--text-2)', border: `1px solid ${category === cat ? 'var(--teal)' : 'var(--border)'}`, fontFamily: 'var(--font-display)' }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
          ) : (
            <>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: 20 }}>{filtered.length} charities</div>
              <div className="grid-3" style={{ gap: 24 }}>
                {filtered.map(c => (
                  <Link key={c.id} to={`/charities/${c.id}`} className="card card-hover" style={{ padding: 0, overflow: 'hidden', textDecoration: 'none', display: 'block' }}>
                    <div style={{ height: 180, background: c.image ? `url(${c.image}) center/cover` : 'var(--surface-2)', position: 'relative' }}>
                      {c.featured && (
                        <div style={{ position: 'absolute', top: 12, left: 12 }}>
                          <span className="badge badge-lime" style={{ fontSize: '0.6rem' }}>Featured</span>
                        </div>
                      )}
                      <div style={{ position: 'absolute', bottom: 12, left: 14 }}>
                        <span className="badge badge-teal" style={{ fontSize: '0.6rem' }}>{c.category}</span>
                      </div>
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(10,10,10,0.7))' }} />
                    </div>

                    <div style={{ padding: '20px 20px 22px' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 8, lineHeight: 1.3 }}>{c.name}</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 14 }}>{c.description}</p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--teal)', fontSize: '1rem' }}>INR {c.totalReceived.toLocaleString()}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>Raised so far</div>
                        </div>
                      </div>

                      {c.upcomingEvents?.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Upcoming Events</div>
                          {c.upcomingEvents.map(ev => (
                            <div key={ev} style={{ fontSize: '0.78rem', color: 'var(--amber)', marginBottom: 2 }}>📅 {ev}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔍</div>
                  No charities match your search. Try a different term.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
