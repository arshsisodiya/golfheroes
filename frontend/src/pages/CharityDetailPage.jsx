import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import api from '../utils/api';

export default function CharityDetailPage() {
  const { id } = useParams();
  const [charity, setCharity] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/charities/${id}`).then(setCharity),
      api.get('/charities').then(setRelated),
    ])
      .catch(() => {
        setCharity(null);
        setRelated([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ paddingTop: 64 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : !charity ? (
          <div className="container" style={{ padding: '80px 24px' }}>
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: 12 }}>Charity not found</h1>
              <Link to="/charities" className="btn btn-primary">Back to charity directory</Link>
            </div>
          </div>
        ) : (
          <>
            <section style={{ padding: '72px 24px 40px', borderBottom: '1px solid var(--border)' }}>
              <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28, alignItems: 'center' }}>
                <div>
                  <Link to="/charities" className="badge badge-dim" style={{ marginBottom: 18, textDecoration: 'none' }}>Back to directory</Link>
                  <h1 className="display-lg" style={{ marginBottom: 16 }}>{charity.name}</h1>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
                    <span className="badge badge-teal">{charity.category}</span>
                    {charity.featured && <span className="badge badge-lime">Featured Charity</span>}
                  </div>
                  <p className="text-muted text-lg" style={{ lineHeight: 1.8, marginBottom: 24 }}>{charity.description}</p>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    <div className="card" style={{ minWidth: 170 }}>
                      <div className="stat-label">Raised so far</div>
                      <div className="stat-value" style={{ color: 'var(--teal)' }}>INR {Number(charity.totalReceived || 0).toLocaleString()}</div>
                    </div>
                    <div className="card" style={{ minWidth: 170 }}>
                      <div className="stat-label">Upcoming events</div>
                      <div className="stat-value">{Array.isArray(charity.upcomingEvents) ? charity.upcomingEvents.length : 0}</div>
                    </div>
                  </div>
                </div>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ height: 320, background: charity.image ? `url(${charity.image}) center/cover` : 'var(--surface-2)' }} />
                </div>
              </div>
            </section>

            <section className="container" style={{ padding: '40px 24px 80px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
                <div className="card">
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 14 }}>Why this cause matters</h2>
                  <p className="text-muted" style={{ lineHeight: 1.8 }}>
                    Subscribers can direct part of every subscription to this charity, and visitors can also donate independently.
                    The platform keeps this cause visible on the homepage and inside the member dashboard so the charitable
                    impact stays central to the experience.
                  </p>
                </div>

                <div className="card">
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 14 }}>Upcoming events</h2>
                  {Array.isArray(charity.upcomingEvents) && charity.upcomingEvents.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {charity.upcomingEvents.map((eventName) => (
                        <div key={eventName} style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--surface-2)', color: 'var(--amber)' }}>
                          {eventName}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No upcoming events listed right now.</p>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 28 }} className="card">
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 14 }}>Support this charity</h2>
                <p className="text-muted" style={{ marginBottom: 18 }}>
                  Choose this charity during signup or update your member settings to direct your subscription contribution here.
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <Link to="/register" className="btn btn-primary">Register and choose this charity</Link>
                  <Link to="/charities" className="btn btn-ghost">Browse more charities</Link>
                </div>
              </div>

              {related.length > 1 && (
                <div style={{ marginTop: 32 }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 16 }}>More charities</h2>
                  <div className="grid-3" style={{ gap: 18 }}>
                    {related
                      .filter((entry) => entry.id !== charity.id)
                      .slice(0, 3)
                      .map((entry) => (
                        <Link
                          key={entry.id}
                          to={`/charities/${entry.id}`}
                          className="card card-hover"
                          style={{ textDecoration: 'none', display: 'block' }}
                        >
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 6 }}>{entry.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', lineHeight: 1.6 }}>{entry.description}</div>
                        </Link>
                      ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
