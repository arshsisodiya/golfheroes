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
        <div className="orb" style={{ width: 420, height: 420, background: 'rgba(45,212,191,0.08)', bottom: -40, left: -120 }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")', opacity: 0.4 }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, padding: '80px 24px' }}>
          <div className="hero-panel" style={{ padding: '34px clamp(22px, 4vw, 42px)' }}>
            <div className="hero-grid">
              <div className="stack-md">
                <div className="section-kicker section-kicker-lime">Monthly prize draws now live</div>
                <div>
                  <h1 className="display-xl" style={{ marginBottom: 22 }}>
                    Play golf.
                    <br />
                    <span style={{ color: 'var(--lime)', position: 'relative' }}>
                      Change lives.
                      <svg style={{ position: 'absolute', bottom: -4, left: 0, width: '100%' }} height="6" viewBox="0 0 400 6" preserveAspectRatio="none">
                        <path d="M0 3 Q100 0 200 3 Q300 6 400 3" stroke="var(--lime)" strokeWidth="2" fill="none" opacity="0.5" />
                      </svg>
                    </span>
                    <br />
                    Win big.
                  </h1>
                  <p className="text-lg text-muted" style={{ maxWidth: 620, lineHeight: 1.75 }}>
                    Enter your Stableford scores every month for a chance to win cash prizes while supporting the charities that matter most to you.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Start Playing - {formatCurrency(9.99)}/mo
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </Link>
                  <Link to="/charities" className="btn btn-ghost btn-lg">Browse Charities</Link>
                </div>

                <div className="info-strip">
                  <span className="info-pill">5-score rolling entry logic</span>
                  <span className="info-pill">Monthly verified draws</span>
                  <span className="info-pill">Charity chosen by every player</span>
                </div>

                <div className="metric-grid">
                  {[['INR 125,000+', 'Donated to charity'], ['2,400+', 'Active subscribers'], ['Monthly', 'Prize draws'], ['5-match', 'Rolling jackpot']].map(([value, label]) => (
                    <div key={label} className="metric-card">
                      <div className="value">{value}</div>
                      <div className="note">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="stack-md">
                <div className="card card-soft card-spotlight">
                  <div className="section-kicker section-kicker-teal" style={{ marginBottom: 16 }}>Why golfers stay</div>
                  <div className="stack-sm">
                    {[
                      ['Transparent prize logic', 'See exactly how the pool is split across 3, 4, and 5 matches.'],
                      ['Meaningful charity choice', 'Every subscription can support the cause you personally care about.'],
                      ['Calm member dashboard', 'Track scores, draw readiness, charity impact, and winnings in one place.'],
                    ].map(([title, description]) => (
                      <div key={title} className="stat-panel">
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 6 }}>{title}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.65 }}>{description}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <DrawCard draw={latestDraw} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '88px 0 24px', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-heading">
            <div className="stack-sm">
              <div className="section-kicker section-kicker-amber">How it works</div>
              <h2 className="display-md">Simple. Transparent. Impactful.</h2>
            </div>
            <p className="text-muted text-lg">The flow is designed to feel clear and fair from score entry to verified winnings and charity support.</p>
          </div>

          <div className="grid-3" style={{ gap: 24 }}>
            {[
              { num: '01', title: 'Subscribe', desc: 'Choose a monthly or yearly plan. A portion goes to your chosen charity automatically every month.', color: 'var(--lime)' },
              { num: '02', title: 'Enter Your Scores', desc: 'Log your last 5 Stableford scores. The system keeps a rolling window with newest in and oldest out.', color: 'var(--teal)' },
              { num: '03', title: 'Win Every Month', desc: 'Match 3, 4 or all 5 drawn numbers with your scores to win. Jackpot rolls over if unclaimed.', color: 'var(--amber)' },
            ].map(({ num, title, desc, color }) => (
              <div key={num} className="card card-soft card-spotlight">
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
          <div className="hero-grid">
            <div>
              <div className="section-kicker section-kicker-amber" style={{ marginBottom: 20 }}>Prize Pool Breakdown</div>
              <h2 className="display-md" style={{ marginBottom: 16 }}>Your subscription funds real prizes</h2>
              <p className="text-muted" style={{ lineHeight: 1.8, marginBottom: 32 }}>60% of every subscription goes straight into the prize pool. The rest funds your chosen charity and platform operations with no hidden fees.</p>
              <Link to="/register" className="btn btn-primary">Join & Start Winning</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: '5-Number Match', pct: 40, color: 'var(--lime)', note: 'Jackpot that rolls over if unclaimed' },
                { label: '4-Number Match', pct: 35, color: 'var(--amber)', note: 'Split among all 4-match winners' },
                { label: '3-Number Match', pct: 25, color: 'var(--teal)', note: 'Split among all 3-match winners' },
              ].map(({ label, pct, color, note }) => (
                <div key={label} className="card card-soft">
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
            <div className="section-heading" style={{ marginBottom: 48 }}>
              <div className="stack-sm">
                <div className="section-kicker section-kicker-teal">Featured Causes</div>
                <h2 className="display-md">Golf that gives back</h2>
              </div>
              <Link to="/charities" className="btn btn-ghost">View All Charities</Link>
            </div>

            <div className="grid-3" style={{ gap: 20 }}>
              {charities.slice(0, 3).map((charity) => (
                <Link key={charity.id} to={`/charities/${charity.id}`} className="card card-hover card-soft card-spotlight" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', textDecoration: 'none', display: 'block' }}>
                  <div style={{ height: 170, background: `url(${charity.image}) center/cover`, position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 35%, rgba(10,10,10,0.92))' }} />
                    <div style={{ position: 'absolute', bottom: 14, left: 16 }}>
                      <span className="badge badge-teal" style={{ fontSize: '0.65rem' }}>{charity.category}</span>
                    </div>
                  </div>
                  <div style={{ padding: '18px 20px 20px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 8 }}>{charity.name}</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', lineHeight: 1.6 }}>{charity.description}</p>
                    <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--teal)' }}>{formatCurrencyCompact(charity.totalReceived)} raised</span>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-2)' }}>Open profile</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section style={{ padding: '100px 0', background: 'linear-gradient(135deg, var(--void) 0%, #0d1a0d 100%)', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="hero-panel" style={{ maxWidth: 760, margin: '0 auto', padding: '40px clamp(24px, 5vw, 44px)' }}>
            <h2 className="display-lg" style={{ marginBottom: 20 }}>Ready to <span style={{ color: 'var(--lime)' }}>make an impact?</span></h2>
            <p className="text-muted text-lg" style={{ marginBottom: 40 }}>Join thousands of golfers turning their passion into purpose. Every putt, every score count for something bigger.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-primary btn-lg">Get Started Free</Link>
              <Link to="/login" className="btn btn-ghost btn-lg">Sign In</Link>
            </div>
            <div style={{ marginTop: 24, fontSize: '0.8rem', color: 'var(--text-3)' }}>No credit card required to create an account. Cancel anytime.</div>
          </div>
        </div>
      </section>

      <footer style={{ padding: '32px 0', borderTop: '1px solid var(--border)', background: 'var(--void)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Golf<span style={{ color: 'var(--lime)' }}>Heroes</span></div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>Copyright 2026 GolfHeroes. Play. Give. Win.</div>
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
  if (!draw) {
    return (
      <div className="card card-soft">
        <div className="section-kicker section-kicker-amber" style={{ marginBottom: 16 }}>What happens each month</div>
        <div className="stack-sm">
          {[
            'Players store their latest 5 Stableford scores.',
            'The platform publishes a monthly draw with 5 numbers.',
            'Winners submit proof, get verified, and payouts are tracked.',
          ].map((line) => (
            <div key={line} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', fontSize: '0.84rem', color: 'var(--text-2)' }}>{line}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card card-soft card-spotlight">
      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Last Draw - {draw.month}</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {draw.drawnNumbers.map((number) => (
          <div key={number} className="num-ball num-ball-lime" style={{ width: 40, height: 40, fontSize: '0.9rem' }}>{number}</div>
        ))}
      </div>
      <div className="metric-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="metric-card">
          <div className="eyebrow">Jackpot</div>
          <div className="value" style={{ fontSize: '1.35rem', color: 'var(--lime)' }}>{formatCurrency(draw.jackpotPool, 0)}</div>
        </div>
        <div className="metric-card">
          <div className="eyebrow">5-match status</div>
          <div className="value" style={{ fontSize: '1.35rem', color: 'var(--amber)' }}>{draw.jackpotRolledOver ? 'Rolled' : 'Won'}</div>
        </div>
      </div>
    </div>
  );
}
