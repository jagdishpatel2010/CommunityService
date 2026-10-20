import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useComplaints } from '../../hooks/useComplaints.js';
import ComplaintCard from '../../components/ComplaintCard.jsx';
import ComplaintFilters from '../../components/ComplaintFilters.jsx';
import { Loading, ErrorState, EmptyState } from '../../components/states.jsx';

/**
 * The user's full complaint list with search, category, status and priority
 * filtering. The list itself maps complaints to cards (the web equivalent of
 * a FlatList) with loading / error / empty states handled.
 */
export default function ComplaintList() {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    priority: '',
  });
  const { items, loading, error, reload } = useComplaints(filters);

  const hasActiveFilters =
    filters.search || filters.category || filters.status || filters.priority;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>My Complaints</h1>
          <div className="page-sub">Track the status of everything you've reported</div>
        </div>
        <Link className="btn btn-primary" to="/complaints/new">
          + New Complaint
        </Link>
      </div>

      <ComplaintFilters filters={filters} onChange={setFilters} />

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'No matching complaints' : 'No complaints yet'}
          message={
            hasActiveFilters
              ? 'Try adjusting your search or filters.'
              : 'Report your first issue to get started.'
          }
        />
      ) : (
        <div className="complaint-list">
          {items.map((c) => (
            <ComplaintCard key={c._id} complaint={c} />
          ))}
        </div>
      )}
    </>
  );
}
