import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import api from '../utils/api';
import { formatCurrency, formatCurrencyCompact } from '../utils/billing';

export default function HomePage() {
  const [charities, setCharities] = useState([]);
  const [draws, setDraws] = useState([]);

  useEffect(() => {
    api.get('/charities/featured').then(setCharities).catch(() => {});
    api.get('/draws').then(setDraws).catch(() => {});
  }, []);

  const latestDraw = draws[0];

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh' }}>
      <Navbar />

      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden', paddingTop: 64 }}>
        <div className="orb" style={{ width: 600, height: 600, background: 'var(--lime-glow)', top: -200, right: -100 }} />
        <div className="orb" style={{ width: 400, height: 400, background: 'rgba(45,212,191,0.06)', bottom: 0, left: -100 }} />

        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")', opacity: 0.4 }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, padding: '80px 24px' }}>
          <div style={{ maxWidth: 820 }}>
            <div className="badge badge-lime" style={{ marginBottom: 24, animation: 'fadeUp 0.5s ease forwards' }}>
              <span>•</span> Monthly prize draws now live
            </div>

            <h1 className="display-xl animate-fadeUp" style={{ animationDelay: '0.1s', marginBottom: 24 }}>
              Play golf.<br />
              <span style={{ color: 'var(--lime)', position: 'relative' }}>
                Change lives.
                <svg style={{ position: 'absolute', bottom: -4, left: 0, width: '100%' }} height="6" viewBox="0 0 400 6" preserveAspectRatio="none">
                  <path d="M0 3 Q100 0 200 3 Q300 6 400 3" stroke="var(--lime)" strokeWidth="2" fill="none" opacity="0.5" />
                </svg>
              </span><br />
              Win big.
            </h1>

            <p className="text-lg text-muted animate-fadeUp" style={{ animationDelay: '0.2s', maxWidth: 520, marginBottom: 40, lineHeight: 1.7 }}>
              Enter your Stableford scores every month for a chance to win cash prizes while supporting the charities that matter most to you.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', animation: 'fadeUp 0.5s 0.3s ease both' }}>
              <Link to="/register" className="btn btn-primary btn-lg">
                Start Playing - {formatCurrency(9.99)}/mo
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
              <Link to="/charities" className="btn btn-ghost btn-lg">Browse Charities</Link>
            </div>

            <div style={{ display: 'flex', gap: 40, marginTop: 60, flexWrap: 'wrap', animation: 'fadeUp 0.5s 0.4s ease both' }}>
              {[['INR 125,000+', 'Donated to charity'], ['2,400+', 'Active subscribers'], ['Monthly', 'Prize draws'], ['5-match', 'Rolling jackpot']].map(([value, label]) => (
                <div key={label}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--text)' }}>{value}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {latestDraw && (
          <div style={{ position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)', animation: 'float 6s ease-in-out infinite', display: 'none' }} className="show-desktop">
            <DrawCard draw={latestDraw} />
          </div>
        )}
      </section>

      <section style={{ padding: '100px 0', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="badge badge-dim" style={{ marginBottom: 16 }}>How it works</div>
            <h2 className="display-md">Simple. Transparent. Impactful.</h2>
          </div>

          <div className="grid-3" style={{ gap: 24 }}>
            {[
              { num: '01', title: 'Subscribe', desc: 'Choose a monthly or yearly plan. A portion goes to your chosen charity automatically every month.', color: 'var(--lime)' },
              { num: '02', title: 'Enter Your Scores', desc: 'Log your last 5 Stableford scores. The system keeps a rolling window with newest in and oldest out.', color: 'var(--teal)' },
              { num: '03', title: 'Win Every Month', desc: 'Match 3, 4 or all 5 drawn numbers with your scores to win. Jackpot rolls over if unclaimed.', color: 'var(--amber)' },
            ].map(({ num, title, desc, color }) => (
              <div key={num} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: '4rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--border)', lineHeight: 1, marginBottom: 20 }}>{num}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 10, color }}>{title}</h3>
                <p className="text-muted" style={{ lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 0', background: 'var(--void)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <div>
              <div className="badge badge-amber" style={{ marginBottom: 20 }}>Prize Pool Breakdown</div>
              <h2 className="display-md" style={{ marginBottom: 16 }}>Your subscription funds real prizes</h2>
              <p className="text-muted" style={{ lineHeight: 1.8, marginBottom: 32 }}>60% of every subscription goes straight into the prize pool. The rest funds your chosen charity and platform operations with no hidden fees.</p>
              <Link to="/register" className="btn btn-primary">Join & Start Winning</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: '5-Number Match', pct: 40, color: 'var(--lime)', note: 'Jackpot - rolls over!' },
                { label: '4-Number Match', pct: 35, color: 'var(--amber)', note: 'Split among winners' },
                { label: '3-Number Match', pct: 25, color: 'var(--teal)', note: 'Split among winners' },
              ].map(({ label, pct, color, note }) => (
                <div key={label} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>{note}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color }}>{pct}%</div>
                  </div>
                  <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {charities.length > 0 && (
        <section style={{ padding: '100px 0' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div className="badge badge-teal" style={{ marginBottom: 14 }}>Featured Causes</div>
                <h2 className="display-md">Golf that gives back</h2>
              </div>
              <Link to="/charities" className="btn btn-ghost">View All Charities</Link>
            </div>

            <div className="grid-3" style={{ gap: 20 }}>
              {charities.slice(0, 3).map((charity) => (
                <Link key={charity.id} to={`/charities/${charity.id}`} className="card card-hover" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', textDecoration: 'none', display: 'block' }}>
                  <div style={{ height: 160, background: `url(${charity.image}) center/cover`, position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(10,10,10,0.9))' }} />
                    <div style={{ position: 'absolute', bottom: 14, left: 16 }}>
                      <span className="badge badge-teal" style={{ fontSize: '0.65rem' }}>{charity.category}</span>
                    </div>
                  </div>
                  <div style={{ padding: '18px 20px 20px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 8 }}>{charity.name}</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', lineHeight: 1.6 }}>{charity.description}</p>
                    <div style={{ marginTop: 14, fontSize: '0.78rem', color: 'var(--teal)' }}>{formatCurrencyCompact(charity.totalReceived)} raised</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section style={{ padding: '100px 0', background: 'linear-gradient(135deg, var(--void) 0%, #0d1a0d 100%)', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 className="display-lg" style={{ marginBottom: 20 }}>Ready to <span style={{ color: 'var(--lime)' }}>make an impact?</span></h2>
            <p className="text-muted text-lg" style={{ marginBottom: 40 }}>Join thousands of golfers turning their passion into purpose. Every putt, every score - counting for something bigger.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-primary btn-lg">Get Started Free</Link>
              <Link to="/login" className="btn btn-ghost btn-lg">Sign In</Link>
            </div>
            <div style={{ marginTop: 24, fontSize: '0.8rem', color: 'var(--text-3)' }}>No credit card required to create an account • Cancel anytime</div>
          </div>
        </div>
      </section>

      <footer style={{ padding: '32px 0', borderTop: '1px solid var(--border)', background: 'var(--void)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Golf<span style={{ color: 'var(--lime)' }}>Heroes</span></div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>© 2026 GolfHeroes. Play. Give. Win.</div>
          <div style={{ display: 'flex', gap: 20, fontSize: '0.78rem', color: 'var(--text-3)' }}>
            <Link to="/charities" style={{ color: 'inherit' }}>Charities</Link>
            <Link to="/login" style={{ color: 'inherit' }}>Sign In</Link>
            <Link to="/register" style={{ color: 'inherit' }}>Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DrawCard({ draw }) {
  return (
    <div className="card" style={{ width: 280, background: 'var(--surface)', border: '1px solid var(--border-strong)' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Last Draw - {draw.month}</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {draw.drawnNumbers.map((number) => (
          <div key={number} className="num-ball num-ball-lime" style={{ width: 40, height: 40, fontSize: '0.9rem' }}>{number}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem' }}>
        <div><div style={{ color: 'var(--lime)', fontWeight: 700 }}>{formatCurrency(draw.jackpotPool, 0)}</div><div className="text-dim">Jackpot</div></div>
        <div><div style={{ color: 'var(--amber)', fontWeight: 700 }}>{draw.jackpotRolledOver ? 'Rolled' : 'Won'}</div><div className="text-dim">5-match</div></div>
      </div>
    </div>
  );
}
