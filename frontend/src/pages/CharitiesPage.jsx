import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import api from '../utils/api';
import { formatCurrencyCompact } from '../utils/billing';

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

  const filtered = charities.filter((charity) => {
    const matchSearch = !search || charity.name.toLowerCase().includes(search.toLowerCase()) || charity.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'All' || charity.category === category;
    return matchSearch && matchCategory;
  });

  const submitDonation = async (event) => {
    event.preventDefault();
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
      setCharities((current) => current.map((charity) => (charity.id === result.donation.charityId ? { ...charity, totalReceived: result.charityTotal } : charity)));
    } catch (error) {
      setDonationMessage(error.message);
    } finally {
      setDonating(false);
    }
  };

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ paddingTop: 64 }}>
        <div style={{ padding: '80px 24px 60px', borderBottom: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
          <div className="orb" style={{ width: 500, height: 300, background: 'rgba(45,212,191,0.07)', top: -100, left: '50%', transform: 'translateX(-50%)' }} />
          <div className="container" style={{ position: 'relative', zIndex: 1 }}>
            <div className="hero-panel" style={{ padding: '34px clamp(22px, 4vw, 42px)' }}>
              <div className="hero-grid">
                <div className="stack-md">
                  <div className="section-kicker section-kicker-teal">Community Impact</div>
                  <div>
                    <h1 className="display-lg" style={{ marginBottom: 16 }}>Causes We Champion</h1>
                    <p className="text-muted text-lg" style={{ maxWidth: 620, lineHeight: 1.75 }}>
                      Every subscriber chooses a charity. Every subscription contributes. Together, we are making golf matter beyond the fairway.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <Link to="/register" className="btn btn-primary btn-lg">Subscribe and Give Back</Link>
                    <a href="#direct-donation" className="btn btn-ghost btn-lg">Make a Direct Donation</a>
                  </div>
                </div>

                <div className="stack-sm">
                  {[
                    ['Subscriber-led giving', 'Every player chooses which listed charity receives their contribution.'],
                    ['Independent donations', 'Support any listed cause directly even if you are not part of the draw.'],
                    ['Story-rich profiles', 'Browse causes, categories, and upcoming activity before you choose.'],
                  ].map(([title, description]) => (
                    <div key={title} className="stat-panel">
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 6 }}>{title}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.65 }}>{description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container" style={{ padding: '48px 24px' }}>
          <div id="direct-donation" className="hero-panel" style={{ padding: '28px clamp(20px, 3vw, 32px)', marginBottom: 28 }}>
            <div className="section-heading">
              <div className="stack-sm">
                <div className="section-kicker section-kicker-teal">Direct support</div>
                <h2 style={{ fontFamily: 'var(--font-display)' }}>Make an Independent Donation</h2>
              </div>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>Support a charity directly, even without participating in gameplay.</p>
            </div>
            <form onSubmit={submitDonation} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              <select className="form-input form-select" value={donationForm.charityId} onChange={(event) => setDonationForm((current) => ({ ...current, charityId: event.target.value }))} required>
                <option value="">Select charity</option>
                {charities.map((charity) => <option key={charity.id} value={charity.id}>{charity.name}</option>)}
              </select>
              <input className="form-input" type="number" min="1" step="0.01" placeholder="Amount (INR)" value={donationForm.amount} onChange={(event) => setDonationForm((current) => ({ ...current, amount: event.target.value }))} required />
              <input className="form-input" placeholder="Your name (optional)" value={donationForm.donorName} onChange={(event) => setDonationForm((current) => ({ ...current, donorName: event.target.value }))} />
              <input className="form-input" type="email" placeholder="Email (optional receipt)" value={donationForm.donorEmail} onChange={(event) => setDonationForm((current) => ({ ...current, donorEmail: event.target.value }))} />
              <input className="form-input" placeholder="Note (optional)" value={donationForm.note} onChange={(event) => setDonationForm((current) => ({ ...current, note: event.target.value }))} />
              <button className="btn btn-primary" type="submit" disabled={donating}>{donating ? 'Submitting...' : 'Donate Now'}</button>
            </form>
            {donationMessage && <div style={{ marginTop: 10, fontSize: '0.8rem', color: donationMessage.toLowerCase().includes('thank') ? 'var(--teal)' : 'var(--rose)' }}>{donationMessage}</div>}
          </div>

          <div className="card card-soft" style={{ marginBottom: 32 }}>
            <div className="section-heading" style={{ marginBottom: 18 }}>
              <div className="stack-sm">
                <div className="section-kicker section-kicker-amber">Explore causes</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem' }}>Find a charity that fits your values</h2>
              </div>
              <span className="badge badge-dim">{filtered.length} charities</span>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <input className="form-input" style={{ flex: 1, minWidth: 200, maxWidth: 360 }} placeholder="Search charities..." value={search} onChange={(event) => setSearch(event.target.value)} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CATEGORIES.map((item) => (
                  <button
                    key={item}
                    className="btn btn-sm"
                    onClick={() => setCategory(item)}
                    style={{ background: category === item ? 'var(--teal)' : 'var(--surface-2)', color: category === item ? 'var(--black)' : 'var(--text-2)', border: `1px solid ${category === item ? 'var(--teal)' : 'var(--border)'}`, fontFamily: 'var(--font-display)' }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
          ) : (
            <>
              <div className="grid-3" style={{ gap: 24 }}>
                {filtered.map((charity) => (
                  <Link key={charity.id} to={`/charities/${charity.id}`} className="card card-hover card-soft card-spotlight" style={{ padding: 0, overflow: 'hidden', textDecoration: 'none', display: 'block' }}>
                    <div style={{ height: 180, background: charity.image ? `url(${charity.image}) center/cover` : 'var(--surface-2)', position: 'relative' }}>
                      {charity.featured && (
                        <div style={{ position: 'absolute', top: 12, left: 12 }}>
                          <span className="badge badge-lime" style={{ fontSize: '0.6rem' }}>Featured</span>
                        </div>
                      )}
                      <div style={{ position: 'absolute', bottom: 12, left: 14 }}>
                        <span className="badge badge-teal" style={{ fontSize: '0.6rem' }}>{charity.category}</span>
                      </div>
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(10,10,10,0.7))' }} />
                    </div>

                    <div style={{ padding: '20px 20px 22px' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 8, lineHeight: 1.3 }}>{charity.name}</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 14 }}>{charity.description}</p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--teal)', fontSize: '1rem' }}>{formatCurrencyCompact(charity.totalReceived)}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>Raised so far</div>
                        </div>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-2)' }}>Open profile</span>
                      </div>

                      {charity.upcomingEvents?.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Upcoming Events</div>
                          {charity.upcomingEvents.map((eventName) => (
                            <div key={eventName} style={{ fontSize: '0.78rem', color: 'var(--amber)', marginBottom: 2 }}>{eventName}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 12 }}>No matches</div>
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
