import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { complaintApi } from '../api/services.js';
import { getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Loading, ErrorState, AlertError, AlertSuccess } from '../components/states.jsx';
import { StatusBadge, PriorityBadge, Stars, formatDate } from '../components/ui.jsx';
import FeedbackForm from '../components/FeedbackForm.jsx';
import StaffActions from '../components/StaffActions.jsx';
import AdminActions from '../components/AdminActions.jsx';

/**
 * Shared complaint detail screen used by all roles. It shows the full record,
 * the status timeline, any evidence/completion images and feedback, then
 * renders the action panel appropriate to the current user's role.
 */
export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { complaint: c } = await complaintApi.get(id);
      setComplaint(c);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  /** Called by child action panels after a successful mutation. */
  const handleUpdated = (updated, message) => {
    setComplaint(updated);
    setNotice(message || 'Updated successfully');
    // Clear the success notice after a short delay.
    setTimeout(() => setNotice(''), 3500);
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!complaint) return null;

  const isOwner = complaint.createdBy?._id === user.id || complaint.createdBy?._id === user._id;
  const canGiveFeedback =
    user.role === 'user' && isOwner && complaint.status === 'Resolved' && !complaint.feedback;

  return (
    <>
      <div className="page-head">
        <div>
          <span className="ticket-id">{complaint.ticketId}</span>
          <h1 style={{ marginTop: 2 }}>{complaint.title}</h1>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <AlertSuccess>{notice}</AlertSuccess>

      <div className="detail-grid">
        {/* Left column: details, images, description, timeline */}
        <div>
          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>

            <div className="kv mt-16">
              <span className="k">Category</span>
              <span>{complaint.category}</span>
            </div>
            <div className="kv">
              <span className="k">Location</span>
              <span>{complaint.location || '—'}</span>
            </div>
            <div className="kv">
              <span className="k">Reported by</span>
              <span>{complaint.createdBy?.name || '—'}</span>
            </div>
            <div className="kv">
              <span className="k">Assigned to</span>
              <span>{complaint.assignedTo?.name || 'Not assigned'}</span>
            </div>
            <div className="kv">
              <span className="k">Created</span>
              <span>{formatDate(complaint.createdAt)}</span>
            </div>
            {complaint.resolvedAt && (
              <div className="kv">
                <span className="k">Resolved</span>
                <span>{formatDate(complaint.resolvedAt)}</span>
              </div>
            )}

            <h3 style={{ marginBottom: 6, marginTop: 16, fontSize: 15 }}>Description</h3>
            <p className="mb-0">{complaint.description}</p>

            {complaint.remarks && (
              <>
                <h3 style={{ marginBottom: 6, marginTop: 16, fontSize: 15 }}>Staff remarks</h3>
                <p className="mb-0">{complaint.remarks}</p>
              </>
            )}
          </div>

          {(complaint.image || complaint.completionImage) && (
            <div className="card mt-16">
              <h3 style={{ marginTop: 0, fontSize: 15 }}>Images</h3>
              <div className="grid grid-2">
                {complaint.image && (
                  <div>
                    <div className="hint">Reported evidence</div>
                    <img src={complaint.image} alt="Evidence" className="evidence-img" />
                  </div>
                )}
                {complaint.completionImage && (
                  <div>
                    <div className="hint">Work completed</div>
                    <img
                      src={complaint.completionImage}
                      alt="Completion"
                      className="evidence-img"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {complaint.feedback && (
            <div className="card mt-16">
              <h3 style={{ marginTop: 0, fontSize: 15 }}>User Feedback</h3>
              <Stars value={complaint.feedback.rating} />
              {complaint.feedback.comment && (
                <p className="mb-0 mt-16">{complaint.feedback.comment}</p>
              )}
            </div>
          )}
        </div>

        {/* Right column: timeline + role actions */}
        <div>
          <div className="card">
            <h3 style={{ marginTop: 0, fontSize: 15 }}>Status Timeline</h3>
            <ul className="timeline">
              {complaint.timeline.map((t, i) => (
                <li key={i}>
                  <div className="t-status">
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="t-meta">
                    {t.changedByName || 'System'} · {formatDate(t.at)}
                  </div>
                  {t.note && <div className="t-note">{t.note}</div>}
                </li>
              ))}
            </ul>
          </div>

          {user.role === 'staff' && (
            <StaffActions complaint={complaint} onUpdated={handleUpdated} />
          )}
          {user.role === 'admin' && (
            <AdminActions complaint={complaint} onUpdated={handleUpdated} />
          )}
          {canGiveFeedback && (
            <FeedbackForm complaintId={complaint._id} onUpdated={handleUpdated} />
          )}
        </div>
      </div>
    </>
  );
}
