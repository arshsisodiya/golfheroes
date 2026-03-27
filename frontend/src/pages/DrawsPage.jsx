import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function DrawsPage() {
  const { user } = useAuth();
  const [draws, setDraws] = useState([]);
  const [upcoming, setUpcoming] = useState(null);
  const [loading, setLoading] = useState(true);
  const isActive = user?.subscriptionStatus === 'active';

  useEffect(() => {
    const requests = [api.get('/draws').then(setDraws).catch(() => {})];
    if (isActive) requests.push(api.get('/draws/upcoming').then(setUpcoming).catch(() => {}));
    Promise.all(requests).finally(() => setLoading(false));
  }, [isActive]);

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1000 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 8 }}>Prize Draws</h1>
        <p className="text-muted" style={{ fontSize: '0.88rem' }}>Monthly draws. Match 3, 4 or all 5 numbers with your Stableford scores to win.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : (
        <>
          <div className="grid-3" style={{ marginBottom: 24 }}>
            {[
              { label: '5-Number Match', share: '40%', color: 'var(--lime)', note: 'Jackpot rolls over if unclaimed', amount: upcoming?.pools?.jackpotPool },
              { label: '4-Number Match', share: '35%', color: 'var(--amber)', note: 'Split equally among winners', amount: upcoming?.pools?.fourMatchPool },
              { label: '3-Number Match', share: '25%', color: 'var(--teal)', note: 'Split equally among winners', amount: upcoming?.pools?.threeMatchPool },
            ].map(({ label, share, color, note, amount }) => (
              <div key={label} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', color, marginBottom: 4 }}>
                  {amount !== undefined ? `INR ${amount.toFixed(0)}` : share}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{note}</div>
                {amount !== undefined && <div style={{ fontSize: '0.72rem', color, marginTop: 6 }}>{share} of pool</div>}
              </div>
            ))}
          </div>

          {isActive && upcoming && (
            <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, var(--surface) 0%, #0f1a0a 100%)', border: '1px solid rgba(200,241,53,0.15)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Your Numbers in Play This Month</h3>
              {upcoming.userScores.length > 0 ? (
                <>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                    {upcoming.userScores.map((value, index) => (
                      <div key={index} className="num-ball num-ball-lime" style={{ width: 52, height: 52, fontSize: '1.1rem' }}>{value}</div>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>These are your Stableford scores. The draw picks 5 numbers and checks for matches.</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                    <span className={`badge ${upcoming.eligible ? 'badge-lime' : 'badge-amber'}`}>
                      {upcoming.eligible ? 'Eligible for draw' : `${upcoming.scoresNeeded} more score${upcoming.scoresNeeded === 1 ? '' : 's'} needed`}
                    </span>
                    <span className="badge badge-dim">{upcoming.pools?.activeSubscribers} active players</span>
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-3)', fontSize: '0.88rem' }}>You have no scores entered yet. <Link to="/scores" style={{ color: 'var(--lime)' }}>Add scores</Link></div>
              )}
            </div>
          )}

          <div className="card" style={{ marginBottom: 24, background: 'var(--surface-2)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 14 }}>How Draws Work</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { title: 'Monthly Draw', desc: 'On the last day of each month, 5 numbers from 1 to 45 are drawn.' },
                { title: 'Score Matching', desc: 'Your stored Stableford scores are checked against the drawn numbers.' },
                { title: 'Prizes Paid', desc: 'Match 3 wins 25%, match 4 wins 35%, and match 5 wins the 40% jackpot.' },
                { title: 'Jackpot Rollover', desc: 'If nobody matches all 5, the jackpot carries over to next month.' },
              ].map(({ title, desc }) => (
                <div key={title}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', marginBottom: 16 }}>Past Draw Results</h2>
          {draws.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>No draw results yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {draws.map((draw) => (
                <div key={draw.id} className="card" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>{draw.month}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>
                        {draw.drawType === 'algorithmic' ? 'Algorithmic draw' : 'Random draw'} · Published {new Date(draw.publishedAt).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {draw.jackpotRolledOver && <span className="badge badge-amber">Jackpot Rolled Over</span>}
                      {draw.jackpotWinners?.length > 0 && <span className="badge badge-lime">Jackpot Won</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                    {draw.drawnNumbers.map((number) => (
                      <div key={number} className="num-ball num-ball-lime" style={{ width: 44, height: 44 }}>{number}</div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Jackpot (5-match)', val: `INR ${draw.jackpotPool?.toFixed(2)}`, winners: draw.jackpotWinners?.length || 0, color: 'var(--lime)' },
                      { label: '4-match Prize', val: `INR ${draw.fourMatchPool?.toFixed(2)}`, winners: draw.fourMatchWinners?.length || 0, color: 'var(--amber)' },
                      { label: '3-match Prize', val: `INR ${draw.threeMatchPool?.toFixed(2)}`, winners: draw.threeMatchWinners?.length || 0, color: 'var(--teal)' },
                    ].map(({ label, val, winners, color }) => (
                      <div key={label} style={{ fontSize: '0.8rem' }}>
                        <div style={{ color, fontWeight: 700 }}>{val}</div>
                        <div style={{ color: 'var(--text-3)', marginTop: 1 }}>{label} · {winners} winner{winners !== 1 ? 's' : ''}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
