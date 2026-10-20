import { useMemo, useState } from 'react';
import { useComplaints } from '../../hooks/useComplaints.js';
import ComplaintCard from '../../components/ComplaintCard.jsx';
import ComplaintFilters from '../../components/ComplaintFilters.jsx';
import { Loading, ErrorState, EmptyState } from '../../components/states.jsx';

/**
 * Staff landing screen. The backend already scopes the complaint list to those
 * assigned to the signed-in staff member, so this view simply presents them
 * with quick counts and the same search/filter toolbar.
 */
export default function StaffTasks() {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    priority: '',
  });
  const { items, loading, error, reload } = useComplaints(filters);

  // Counts reflect the currently loaded (filtered) set.
  const counts = useMemo(() => {
    const open = items.filter((c) =>
      ['Assigned', 'Accepted', 'In Progress'].includes(c.status)
    ).length;
    const resolved = items.filter((c) => c.status === 'Resolved').length;
    return { total: items.length, open, resolved };
  }, [items]);

  const hasActiveFilters =
    filters.search || filters.category || filters.status || filters.priority;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>My Assigned Tasks</h1>
          <div className="page-sub">Complaints assigned to you for resolution</div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <div className="card stat accent-blue">
          <div className="value">{counts.total}</div>
          <div className="label">Total Assigned</div>
        </div>
        <div className="card stat accent-orange">
          <div className="value">{counts.open}</div>
          <div className="label">Open Tasks</div>
        </div>
        <div className="card stat accent-green">
          <div className="value">{counts.resolved}</div>
          <div className="label">Resolved</div>
        </div>
      </div>

      <ComplaintFilters filters={filters} onChange={setFilters} />

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'No matching tasks' : 'No tasks assigned yet'}
          message={
            hasActiveFilters
              ? 'Try adjusting your filters.'
              : 'When an administrator assigns you a complaint, it will appear here.'
          }
        />
      ) : (
        <div className="complaint-list">
          {items.map((c) => (
            <ComplaintCard key={c._id} complaint={c} showOwner />
          ))}
        </div>
      )}
    </>
  );
}
