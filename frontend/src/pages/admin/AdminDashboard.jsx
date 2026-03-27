import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/billing';

function currency(value) {
  return formatCurrency(value || 0);
}

export default function AdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then((data) => setStats(data))
      .catch((error) => toast.error(error.message || 'Failed to load admin stats'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-shell-wide">
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--amber)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Admin Panel</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800 }}>Platform Overview</h1>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : !stats ? (
        <div className="card" style={{ color: 'var(--text-3)' }}>Admin stats are unavailable right now.</div>
      ) : (
        <>
          <div className="grid-4" style={{ marginBottom: 24 }}>
            {[
              { label: 'Total Users', value: stats.totalUsers, color: 'var(--text)', note: 'All registered accounts' },
              { label: 'Active Subscribers', value: stats.activeSubscribers, color: 'var(--lime)', note: 'Currently active' },
              { label: 'Monthly Revenue', value: currency(stats.monthlyRevenue), color: 'var(--amber)', note: 'Estimated current billing' },
              { label: 'Pending Winners', value: stats.pendingWinners, color: stats.pendingWinners > 0 ? 'var(--rose)' : 'var(--text)', note: 'Need review' },
            ].map((item) => (
              <div key={item.label} className="card">
                <div className="stat-label">{item.label}</div>
                <div className="stat-value" style={{ color: item.color, marginTop: 4 }}>{item.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 4 }}>{item.note}</div>
              </div>
            ))}
          </div>

          <div className="grid-4" style={{ marginBottom: 28 }}>
            {[
              { label: 'Prize Pool', value: currency(stats.totalPrizePool), color: 'var(--lime)', note: 'Current estimate' },
              { label: 'Charity Contributions', value: currency(stats.totalCharityContributed), color: 'var(--teal)', note: 'Current estimate' },
              { label: 'Independent Donations', value: currency(stats.independentDonations), color: 'var(--teal)', note: 'Outside subscriptions' },
              { label: 'Total Draws', value: stats.totalDraws, color: 'var(--violet)', note: 'Published draws' },
              { label: 'Active Charities', value: stats.totalCharities, color: 'var(--amber)', note: 'Currently listed' },
            ].map((item) => (
              <div key={item.label} className="card">
                <div className="stat-label">{item.label}</div>
                <div className="stat-value" style={{ color: item.color }}>{item.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 4 }}>{item.note}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>Draw Statistics</h2>
              <span className="badge badge-dim">Operational Analytics</span>
            </div>
            <div className="grid-4" style={{ gap: 14 }}>
              {[
                { label: 'Eligible Entries', value: stats.drawStats?.totalEntries ?? 0, note: 'Across published draws' },
                { label: 'Avg Entries / Draw', value: stats.drawStats?.averageEligibleEntries ?? 0, note: 'Eligible players per draw' },
                { label: 'Jackpot Rollovers', value: stats.drawStats?.jackpotRollovers ?? 0, note: 'Published rollover count' },
                { label: 'Paid Payouts', value: currency(stats.drawStats?.totalPayoutsMarkedPaid ?? 0), note: 'Marked paid in winners' },
              ].map((item) => (
                <div key={item.label} style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 14 }}>
                  <div className="stat-label">{item.label}</div>
                  <div className="stat-value" style={{ marginTop: 4 }}>{item.value}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 4 }}>{item.note}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16, fontSize: '0.78rem', color: 'var(--text-3)' }}>
              <span>Random draws: {stats.drawStats?.randomDraws ?? 0}</span>
              <span>Algorithmic draws: {stats.drawStats?.algorithmicDraws ?? 0}</span>
              <span>Total winners: {stats.drawStats?.totalWinners ?? 0}</span>
            </div>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>Quick Actions</h2>
          <div className="grid-4" style={{ gap: 14 }}>
            {[
              { to: '/admin/draws', label: 'Run New Draw', desc: 'Simulate or publish a monthly draw' },
              { to: '/admin/winners', label: 'Review Winners', desc: `${stats.pendingWinners} pending verification records` },
              { to: '/admin/users', label: 'Manage Users', desc: `${stats.totalUsers} registered users` },
              { to: '/admin/charities', label: 'Manage Charities', desc: `${stats.totalCharities} active charities` },
            ].map((item) => (
              <Link key={item.to} to={item.to} className="card card-hover" style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{item.desc}</div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
