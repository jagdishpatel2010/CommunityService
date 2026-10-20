import { useNavigate } from 'react-router-dom';
import { StatusBadge, PriorityBadge, formatDate } from './ui.jsx';

/**
 * A single complaint row rendered as a clickable card. Used by the user,
 * staff and admin list screens for a consistent look.
 *
 * @param {{complaint: object, showOwner?: boolean, showAssignee?: boolean}} props
 */
export default function ComplaintCard({ complaint, showOwner, showAssignee }) {
  const navigate = useNavigate();

  return (
    <div
      className="card complaint-card"
      onClick={() => navigate(`/complaints/${complaint._id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/complaints/${complaint._id}`)}
    >
      <div>
        <span className="ticket-id">{complaint.ticketId}</span>
        <h3>{complaint.title}</h3>
        <div className="meta">
          <span>🏷️ {complaint.category}</span>
          {complaint.location && <span>📍 {complaint.location}</span>}
          {showOwner && complaint.createdBy && <span>👤 {complaint.createdBy.name}</span>}
          {showAssignee && (
            <span>🔧 {complaint.assignedTo ? complaint.assignedTo.name : 'Unassigned'}</span>
          )}
          <span>🕒 {formatDate(complaint.createdAt)}</span>
        </div>
      </div>
      <div className="badges-col">
        <StatusBadge status={complaint.status} />
        <PriorityBadge priority={complaint.priority} />
      </div>
    </div>
  );
}
