import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/services.js';
import { getErrorMessage } from '../../api/client.js';
import { Loading, ErrorState } from '../../components/states.jsx';
import { StatusBadge, PriorityBadge, Stars, formatDate } from '../../components/ui.jsx';
import {
  DonutChart,
  BarChart,
  STATUS_COLORS,
  PRIORITY_COLORS,
} from '../../components/Charts.jsx';

/**
 * Admin dashboard: headline statistics, breakdowns by status/category and a
 * list of the most recent complaints. Data comes from /api/admin/stats.
 */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setStats(await adminApi.stats());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Admin Dashboard</h1>
          <div className="page-sub">Service performance at a glance</div>
        </div>
      </div>

      {/* Headline stats */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <div className="card stat accent-blue">
          <div className="value">{stats.total}</div>
          <div className="label">Total Complaints</div>
        </div>
        <div className="card stat accent-orange">
          <div className="value">{stats.pending}</div>
          <div className="label">Pending</div>
        </div>
        <div className="card stat">
          <div className="value">{stats.inProgress}</div>
          <div className="label">In Progress</div>
        </div>
        <div className="card stat accent-green">
          <div className="value">{stats.resolved}</div>
          <div className="label">Resolved</div>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <div className="card stat">
          <div className="value">{stats.totalUsers}</div>
          <div className="label">Registered Users</div>
        </div>
        <div className="card stat">
          <div className="value">{stats.totalStaff}</div>
          <div className="label">Staff Members</div>
        </div>
        <div className="card stat">
          <div className="value">
            {stats.avgRating != null ? stats.avgRating : '—'}
          </div>
          <div className="label">
            Avg. Rating{' '}
            {stats.avgRating != null && <Stars value={stats.avgRating} />}
          </div>
        </div>
        <div className="card stat">
          <div className="value">{stats.ratingCount}</div>
          <div className="label">Feedback Received</div>
        </div>
      </div>

      {/* Charts: status donut + category/priority bars */}
      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <DonutChart title="Complaints by Status" data={stats.byStatus} colors={STATUS_COLORS} />
        <BarChart title="Complaints by Category" data={stats.byCategory} />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <BarChart title="Complaints by Priority" data={stats.byPriority} colors={PRIORITY_COLORS} />
        <DonutChart title="Priority Distribution" data={stats.byPriority} colors={PRIORITY_COLORS} />
      </div>

      {/* Recent complaints */}
      <div className="card">
        <h3 style={{ marginTop: 0, fontSize: 15 }}>Recent Complaints</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Title</th>
              <th>Reporter</th>
              <th>Assigned</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {stats.recent.map((c) => (
              <tr
                key={c._id}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/complaints/${c._id}`)}
              >
                <td className="ticket-id">{c.ticketId}</td>
                <td>{c.title}</td>
                <td>{c.createdBy?.name || '—'}</td>
                <td>{c.assignedTo?.name || '—'}</td>
                <td><PriorityBadge priority={c.priority} /></td>
                <td><StatusBadge status={c.status} /></td>
                <td>{formatDate(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
