import { useState } from 'react';
import { useComplaints } from '../../hooks/useComplaints.js';
import ComplaintCard from '../../components/ComplaintCard.jsx';
import ComplaintFilters from '../../components/ComplaintFilters.jsx';
import { Loading, ErrorState, EmptyState } from '../../components/states.jsx';

/**
 * Admin complaint management list. Admins see every complaint and can search,
 * filter, and drill into any one to assign staff, change priority, etc.
 */
export default function AdminComplaints() {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    priority: '',
  });
  const { items, loading, error, reload } = useComplaints(filters);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>All Complaints</h1>
          <div className="page-sub">Monitor, filter and assign every complaint</div>
        </div>
      </div>

      <ComplaintFilters filters={filters} onChange={setFilters} />

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState title="No complaints found" message="Try adjusting your filters." />
      ) : (
        <div className="complaint-list">
          {items.map((c) => (
            <ComplaintCard key={c._id} complaint={c} showOwner showAssignee />
          ))}
        </div>
      )}
    </>
  );
}
