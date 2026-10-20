import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useComplaints } from '../../hooks/useComplaints.js';
import ComplaintCard from '../../components/ComplaintCard.jsx';
import { Loading, ErrorState, EmptyState } from '../../components/states.jsx';

/**
 * User home screen. Shows quick stats computed from the user's own complaints
 * and a preview of the most recent ones.
 */
export default function UserDashboard() {
  // No filters -> backend returns only this user's complaints.
  const { items, loading, error, reload } = useComplaints({});

  // Derive simple counts for the summary cards.
  const stats = useMemo(() => {
    const total = items.length;
    const resolved = items.filter((c) => c.status === 'Resolved').length;
    const pending = items.filter((c) => c.status === 'Pending').length;
    const active = total - resolved - pending;
    return { total, resolved, pending, active };
  }, [items]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>My Dashboard</h1>
          <div className="page-sub">Overview of your reported issues</div>
        </div>
        <Link className="btn btn-primary" to="/complaints/new">
          + New Complaint
        </Link>
      </div>

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
          <div className="value">{stats.active}</div>
          <div className="label">In Progress</div>
        </div>
        <div className="card stat accent-green">
          <div className="value">{stats.resolved}</div>
          <div className="label">Resolved</div>
        </div>
      </div>

      <h2 style={{ fontSize: 17 }}>Recent Complaints</h2>
      {items.length === 0 ? (
        <EmptyState
          title="No complaints yet"
          message="Report your first community issue to get started."
          action={
            <Link className="btn btn-primary" to="/complaints/new">
              Create a complaint
            </Link>
          }
        />
      ) : (
        <div className="complaint-list">
          {items.slice(0, 5).map((c) => (
            <ComplaintCard key={c._id} complaint={c} />
          ))}
        </div>
      )}
    </>
  );
}
