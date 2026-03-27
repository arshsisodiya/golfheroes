import { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

function currency(value) {
  return `INR ${Number(value || 0).toFixed(2)}`;
}

export default function AdminDraws() {
  const toast = useToast();
  const [draws, setDraws] = useState([]);
  const [simulation, setSimulation] = useState(null);
  const [drawType, setDrawType] = useState('random');
  const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
  const [simLoading, setSimLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);

  const loadDraws = async () => {
    try {
      const data = await api.get('/admin/draws');
      setDraws(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || 'Failed to load draws');
    }
  };

  useEffect(() => {
    loadDraws();
  }, []);

  const runSimulation = async () => {
    setSimLoading(true);
    setSimulation(null);
    try {
      const result = await api.post('/admin/draws/simulate', { drawType });
      setSimulation(result);
      toast.info('Simulation complete. Review the result before publishing.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSimLoading(false);
    }
  };

  const publishDraw = async () => {
    if (!confirm(`Publish the ${month} draw? This awards real prizes and cannot be undone.`)) return;
    setPublishLoading(true);
    try {
      await api.post('/admin/draws/publish', { drawType, month });
      toast.success(`${month} draw published`);
      setSimulation(null);
      await loadDraws();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPublishLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1000 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>Draw Engine</h1>
        <p className="text-muted" style={{ fontSize: '0.88rem' }}>Simulate or publish monthly prize draws. Always simulate first to preview results.</p>
      </div>

      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, var(--surface) 0%, #1a1a0a 100%)', border: '1px solid rgba(200,241,53,0.15)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 18 }}>Configure Draw</h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
            <label className="form-label">Draw Month</label>
            <input className="form-input" value={month} onChange={(event) => setMonth(event.target.value)} placeholder="March 2026" />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
            <label className="form-label">Draw Algorithm</label>
            <select className="form-input form-select" value={drawType} onChange={(event) => setDrawType(event.target.value)}>
              <option value="random">Random</option>
              <option value="algorithmic">Algorithmic</option>
            </select>
          </div>
        </div>

        <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: '0.8rem', color: 'var(--text-3)' }}>
          {drawType === 'random'
            ? 'Standard random draw. Five numbers are picked from 1 to 45.'
            : 'Algorithmic draw. Numbers are weighted using platform score frequency.'}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={runSimulation} disabled={simLoading}>
            {simLoading ? <><div className="spinner" /> Simulating</> : 'Run Simulation'}
          </button>
          <button className="btn btn-primary" onClick={publishDraw} disabled={publishLoading}>
            {publishLoading ? <><div className="spinner" /> Publishing</> : 'Publish Official Draw'}
          </button>
        </div>
      </div>

      {simulation && (
        <div className="card" style={{ marginBottom: 24, border: '1px solid rgba(200,241,53,0.2)', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Simulation Result</h2>
            <span className="badge badge-amber">Preview Only</span>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: 10 }}>Would-be drawn numbers</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {simulation.drawnNumbers?.map((number) => (
                <div key={number} className="num-ball num-ball-lime" style={{ width: 52, height: 52, fontSize: '1.1rem' }}>{number}</div>
              ))}
            </div>
          </div>

          <div className="grid-3" style={{ marginBottom: 18 }}>
            {[
              { label: 'Prize Pool', value: currency(simulation.pools?.totalPool), color: 'var(--text)' },
              { label: 'Jackpot (5-match)', value: currency(simulation.pools?.jackpotPool), color: 'var(--lime)' },
              { label: 'Active Players', value: simulation.pools?.activeSubscribers || 0, color: 'var(--teal)' },
            ].map((item) => (
              <div key={item.label} style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 14 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: item.color }}>{item.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 3 }}>{item.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: '5-Match Winners', list: simulation.jackpotWinners || [], color: 'var(--lime)' },
              { label: '4-Match Winners', list: simulation.fourMatchWinners || [], color: 'var(--amber)' },
              { label: '3-Match Winners', list: simulation.threeMatchWinners || [], color: 'var(--teal)' },
            ].map((group) => (
              <div key={group.label} style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', color: group.color, marginBottom: 6 }}>
                  {group.label} - {group.list.length}
                </div>
                {group.list.length === 0 ? (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>No winners</span>
                ) : (
                  group.list.map((winner) => (
                    <div key={winner.userId} style={{ fontSize: '0.82rem', padding: '3px 0', color: 'var(--text-2)' }}>
                      {winner.name} ({winner.scores.join(', ')})
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', marginBottom: 16 }}>Draw History</h2>
      {draws.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>No draws published yet.</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Month</th><th>Type</th><th>Numbers</th><th>Pool</th><th>Jackpot</th><th>Status</th></tr>
              </thead>
              <tbody>
                {draws.map((draw) => (
                  <tr key={draw.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{draw.month}</td>
                    <td><span className="badge badge-dim">{draw.drawType}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {draw.drawnNumbers?.map((number) => (
                          <span key={number} style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--lime-glow)', color: 'var(--lime)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700 }}>{number}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>{currency(draw.totalPool)}</td>
                    <td style={{ color: 'var(--lime)', fontFamily: 'var(--font-mono)' }}>{currency(draw.jackpotPool)}</td>
                    <td>
                      {draw.jackpotRolledOver
                        ? <span className="badge badge-amber">Rolled</span>
                        : draw.jackpotWinners?.length > 0
                          ? <span className="badge badge-lime">Won</span>
                          : <span className="badge badge-dim">No winner</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
