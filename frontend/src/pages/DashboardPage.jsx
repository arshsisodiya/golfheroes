import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatCurrency, formatCurrencyCompact } from '../utils/billing';

export default function DashboardPage() {
  const { user } = useAuth();
  const [scores, setScores] = useState([]);
  const [upcoming, setUpcoming] = useState(null);
  const [draws, setDraws] = useState([]);
  const [charity, setCharity] = useState(null);
  const [winnings, setWinnings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const active = user?.subscriptionStatus === 'active';
    const fetches = [
      active ? api.get('/scores').then(setScores).catch(() => {}) : Promise.resolve(),
      active ? api.get('/draws/upcoming').then(setUpcoming).catch(() => {}) : Promise.resolve(),
      api.get('/draws').then(setDraws).catch(() => {}),
      user?.charityId ? api.get(`/charities/${user.charityId}`).then(setCharity).catch(() => {}) : Promise.resolve(),
      active ? api.get('/winners/my').then(setWinnings).catch(() => {}) : Promise.resolve(),
    ];
    Promise.all(fetches).finally(() => setLoading(false));
  }, [user]);

  const isActive = user?.subscriptionStatus === 'active';
  const latestDraw = draws[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const hasFiveScores = scores.length === 5;
  const nextSteps = [
    {
      key: 'subscription',
      done: isActive,
      title: 'Activate your subscription',
      description: 'This unlocks score entry, draw access, and member-only features.',
      href: '/subscribe',
      cta: 'Choose a plan',
    },
    {
      key: 'scores',
      done: hasFiveScores,
      title: 'Add your 5 latest Stableford scores',
      description: 'You need all 5 scores stored to be eligible for the monthly draw.',
      href: '/scores',
      cta: hasFiveScores ? 'Review scores' : 'Add scores',
    },
    {
      key: 'charity',
      done: Boolean(user?.charityId),
      title: 'Choose your charity',
      description: 'Pick the cause that receives your subscription contribution.',
      href: '/settings',
      cta: user?.charityId ? 'Update charity' : 'Choose charity',
    },
  ];
  const completedSteps = nextSteps.filter((step) => step.done).length;

  return (
    <div className="page-shell-wide stack-lg">
      <div className="hero-panel" style={{ padding: '28px clamp(20px, 3vw, 34px)' }}>
        <div className="hero-grid">
          <div className="stack-md">
            <div className="section-kicker section-kicker-lime">{greeting}</div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.1rem, 4vw, 3.2rem)', fontWeight: 800, marginBottom: 10 }}>{user?.name}</h1>
              <p className="text-muted text-lg" style={{ maxWidth: 640 }}>
                Your member home for scores, draw readiness, charity impact, and winnings.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span className={`badge ${isActive ? 'badge-lime' : 'badge-rose'}`}>
                {isActive ? 'Active' : 'Inactive'} - {user?.subscriptionPlan || 'No plan'}
              </span>
              {user?.subscriptionRenewal && (
                <span className="badge badge-dim">
                  {user?.subscriptionWillCancel ? 'Access ends' : 'Renews'} {new Date(user.subscriptionRenewal).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
            <div className="info-strip">
              <span className="info-pill">{hasFiveScores ? '5 scores locked in' : `${scores.length}/5 scores ready`}</span>
              <span className="info-pill">{user?.charityId ? 'Charity selected' : 'Charity selection pending'}</span>
              <span className="info-pill">{formatCurrency(user?.totalWon || 0)} won to date</span>
            </div>
          </div>

          <div className="metric-grid">
            <div className="metric-card">
              <div className="eyebrow">Setup progress</div>
              <div className="value" style={{ color: 'var(--lime)' }}>{completedSteps}/3</div>
              <div className="note">Core member tasks complete</div>
            </div>
            <div className="metric-card">
              <div className="eyebrow">Draw status</div>
              <div className="value" style={{ color: upcoming?.eligible ? 'var(--teal)' : 'var(--amber)' }}>{upcoming?.eligible ? 'Live' : 'Pending'}</div>
              <div className="note">{upcoming?.eligible ? 'You are currently in the next draw' : 'Finish setup to enter the next draw'}</div>
            </div>
            <div className="metric-card">
              <div className="eyebrow">My charity</div>
              <div className="value" style={{ fontSize: '1.35rem', color: 'var(--teal)' }}>{charity?.name || 'Not set'}</div>
              <div className="note">{user?.charityContribution || 10}% of your plan contribution</div>
            </div>
            <div className="metric-card">
              <div className="eyebrow">Latest entry</div>
              <div className="value" style={{ fontSize: '1.35rem', color: 'var(--amber)' }}>{upcoming?.latestEntry ? `${upcoming.latestEntry.matches} matches` : 'No entries yet'}</div>
              <div className="note">{upcoming?.latestEntry ? `${upcoming.latestEntry.month} snapshot` : 'Entry history appears after your first published draw'}</div>
            </div>
          </div>
        </div>
      </div>

      {!isActive && (
        <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--rose)', marginBottom: 2 }}>Subscription inactive</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>Subscribe to enter scores and participate in monthly draws.</div>
          </div>
          <Link to="/subscribe" className="btn btn-primary btn-sm">Subscribe Now</Link>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : (
        <>
          <div className="hero-panel" style={{ padding: '28px clamp(20px, 3vw, 28px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
              <div>
                <div className="section-kicker section-kicker-amber" style={{ marginBottom: 10 }}>Next steps</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: 6 }}>Keep moving forward</h2>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-3)' }}>{completedSteps}/3 setup tasks complete</div>
              </div>
              <div style={{ minWidth: 180 }}>
                <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${(completedSteps / nextSteps.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--lime), var(--teal))' }} />
                </div>
              </div>
            </div>
            <div className="grid-3">
              {nextSteps.map((step) => (
                <div key={step.key} className="action-card" style={{ background: 'var(--surface-2)', borderRadius: 16, padding: 18, border: `1px solid ${step.done ? 'rgba(45,212,191,0.18)' : 'var(--border)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: step.done ? 'rgba(45,212,191,0.15)' : 'var(--surface-3)',
                      color: step.done ? 'var(--teal)' : 'var(--text-3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}>
                      {step.done ? 'OK' : '...'}
                    </div>
                    <div style={{ fontWeight: 700 }}>{step.title}</div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 14 }}>{step.description}</div>
                  <Link to={step.href} className={step.done ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm'}>
                    {step.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="grid-4">
            <div className="card card-soft">
              <div className="stat-label">My Scores</div>
              <div className="stat-value" style={{ color: 'var(--lime)' }}>{scores.length}<span style={{ fontSize: '1rem', color: 'var(--text-3)' }}>/5</span></div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 4 }}>Slots filled</div>
            </div>
            <div className="card card-soft">
              <div className="stat-label">Avg Score</div>
              <div className="stat-value">{scores.length ? Math.round(scores.reduce((sum, score) => sum + score.value, 0) / scores.length) : '-'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 4 }}>Stableford pts</div>
            </div>
            <div className="card card-soft">
              <div className="stat-label">Total Won</div>
              <div className="stat-value" style={{ color: 'var(--amber)' }}>{formatCurrency(user?.totalWon || 0, 0)}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 4 }}>All time</div>
            </div>
            <div className="card card-soft">
              <div className="stat-label">Charity %</div>
              <div className="stat-value" style={{ color: 'var(--teal)' }}>{user?.charityContribution || 10}%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 4 }}>Of subscription</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card card-soft">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>My Last 5 Scores</h3>
                <Link to="/scores" className="btn btn-ghost btn-sm">Manage</Link>
              </div>
              {scores.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)' }}>
                  <div style={{ fontSize: '0.85rem' }}>No scores yet</div>
                  <Link to="/scores" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Add First Score</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {scores.map((score, index) => (
                    <div key={score.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: index < scores.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--lime-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--lime)', fontSize: '0.9rem' }}>{score.value}</div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>Stableford {score.value} pts</div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-3)' }}>{new Date(score.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="hero-panel" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Next Prize Draw</h3>
                <Link to="/draws" className="btn btn-ghost btn-sm">Details</Link>
              </div>
              {upcoming ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                    {[
                      { label: '5-Match Jackpot', val: formatCurrency(upcoming.pools.jackpotPool, 0), color: 'var(--lime)' },
                      { label: '4-Match Prize', val: formatCurrency(upcoming.pools.fourMatchPool, 0), color: 'var(--amber)' },
                      { label: '3-Match Prize', val: formatCurrency(upcoming.pools.threeMatchPool, 0), color: 'var(--teal)' },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="metric-card" style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color }}>{val}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginTop: 6, lineHeight: 1.3 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 6 }}>Your scores in play</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {upcoming.userScores.length > 0 ? upcoming.userScores.map((value, index) => (
                        <div key={index} className="num-ball" style={{ width: 36, height: 36, fontSize: '0.82rem' }}>{value}</div>
                      )) : <span style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>Add scores to be eligible</span>}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-3)', marginTop: 8 }}>
                      {upcoming.eligible
                        ? 'You have all 5 required scores for this month\'s draw.'
                        : `${upcoming.scoresNeeded} more score${upcoming.scoresNeeded === 1 ? '' : 's'} needed to unlock draw eligibility.`}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)', fontSize: '0.85rem' }}>Subscribe to see prize pool</div>
              )}
            </div>
          </div>

          <div className="card card-soft">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Participation Summary</h3>
              <span className="badge badge-dim">{upcoming?.nextDrawMonth || 'Upcoming draw'}</span>
            </div>
            <div className="grid-3">
              <div className="stat-panel">
                <div className="stat-label">Draws Entered</div>
                <div className="stat-value" style={{ marginTop: 4 }}>{upcoming?.drawsEntered || 0}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-3)', marginTop: 4 }}>Published draws with all 5 scores locked in</div>
              </div>
              <div className="stat-panel">
                <div className="stat-label">Upcoming Draw</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem', marginTop: 4 }}>{upcoming?.nextDrawMonth || 'Not available'}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-3)', marginTop: 4 }}>
                  {upcoming?.eligible ? 'You are currently entered.' : 'Complete all 5 scores to enter.'}
                </div>
              </div>
              <div className="stat-panel">
                <div className="stat-label">Latest Entry Result</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem', marginTop: 4 }}>
                  {upcoming?.latestEntry ? `${upcoming.latestEntry.matches} match${upcoming.latestEntry.matches === 1 ? '' : 'es'}` : 'No prior entries'}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-3)', marginTop: 4 }}>
                  {upcoming?.latestEntry ? `${upcoming.latestEntry.month} participation snapshot` : 'Your entry history will appear here after your first published draw.'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card card-soft">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>My Charity</h3>
                <Link to="/settings" className="btn btn-ghost btn-sm">Change</Link>
              </div>
              {charity ? (
                <div>
                  {charity.image && <div style={{ height: 100, borderRadius: 10, background: `url(${charity.image}) center/cover`, marginBottom: 14 }} />}
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{charity.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 12 }}>{charity.description}</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span className="badge badge-teal">{charity.category}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--teal)' }}>{formatCurrencyCompact(charity.totalReceived)} raised</span>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-3)', fontSize: '0.85rem' }}>
                  No charity selected
                  <br />
                  <Link to="/settings" className="btn btn-outline btn-sm" style={{ marginTop: 10 }}>Choose Charity</Link>
                </div>
              )}
            </div>

            <div className="card card-soft">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Winnings</h3>
                <Link to="/winnings" className="btn btn-ghost btn-sm">Full History</Link>
              </div>
              {winnings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)' }}>
                  <div style={{ fontSize: '0.85rem' }}>No winnings yet. Keep playing.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {winnings.slice(0, 4).map((winner) => (
                    <div key={winner.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{winner.matchType}</div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-3)' }}>{new Date(winner.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--amber)' }}>{formatCurrency(winner.amount || 0)}</span>
                        <span className={`badge badge-${winner.status === 'paid' ? 'lime' : winner.status === 'pending' ? 'amber' : 'dim'}`} style={{ fontSize: '0.6rem' }}>{winner.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {latestDraw && (
            <div className="card card-soft card-spotlight">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Latest Draw - {latestDraw.month}</h3>
                <Link to="/draws" className="btn btn-ghost btn-sm">All Results</Link>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginRight: 4 }}>Drawn numbers:</span>
                {latestDraw.drawnNumbers.map((number) => (
                  <div key={number} className="num-ball num-ball-lime">{number}</div>
                ))}
                {latestDraw.jackpotRolledOver && <span className="badge badge-amber" style={{ marginLeft: 8 }}>Jackpot Rolled Over</span>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
