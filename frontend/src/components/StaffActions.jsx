import { useState } from 'react';
import { complaintApi } from '../api/services.js';
import { getErrorMessage } from '../api/client.js';
import { AlertError } from './states.jsx';

/**
 * Action panel shown to staff on a complaint assigned to them. Supports the
 * work lifecycle: accept the task, mark in progress, and resolve/reject with
 * remarks and an optional work-completion image.
 *
 * @param {{complaint: object, onUpdated: Function}} props
 */
export default function StaffActions({ complaint, onUpdated }) {
  const [remarks, setRemarks] = useState(complaint.remarks || '');
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Which transitions make sense from the current status.
  const canAccept = complaint.status === 'Assigned';
  const canProgress = ['Assigned', 'Accepted'].includes(complaint.status);
  const canResolve = ['Accepted', 'In Progress'].includes(complaint.status);
  const isClosed = ['Resolved', 'Rejected'].includes(complaint.status);

  /**
   * Sends a status update. Uses multipart form data so a completion image can
   * accompany a resolution.
   *
   * @param {string} status - Target status.
   * @param {string} note - Timeline note.
   */
  const changeStatus = async (status, note) => {
    setError('');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('status', status);
      if (note) fd.append('note', note);
      fd.append('remarks', remarks);
      if (image && status === 'Resolved') fd.append('completionImage', image);

      const { complaint: updated } = await complaintApi.updateStatus(complaint._id, fd);
      onUpdated(updated, `Marked as ${status}`);
      setImage(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (isClosed) {
    return (
      <div className="card mt-16">
        <h3 style={{ marginTop: 0, fontSize: 15 }}>Task closed</h3>
        <p className="hint mb-0">
          This complaint is {complaint.status.toLowerCase()}. No further action is needed.
        </p>
      </div>
    );
  }

  return (
    <div className="card mt-16">
      <h3 style={{ marginTop: 0, fontSize: 15 }}>Update Progress</h3>
      <AlertError>{error}</AlertError>

      <div className="field">
        <label htmlFor="remarks">Remarks</label>
        <textarea
          id="remarks"
          className="textarea"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Add notes about the work..."
        />
      </div>

      {canResolve && (
        <div className="field">
          <label htmlFor="completion">Work-completion photo (optional)</label>
          <input
            id="completion"
            type="file"
            accept="image/*"
            className="input"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
        </div>
      )}

      <div className="row">
        {canAccept && (
          <button
            className="btn btn-primary btn-sm"
            disabled={busy}
            onClick={() => changeStatus('Accepted', 'Task accepted by staff')}
          >
            Accept Task
          </button>
        )}
        {canProgress && (
          <button
            className="btn btn-ghost btn-sm"
            disabled={busy}
            onClick={() => changeStatus('In Progress', 'Work started')}
          >
            Mark In Progress
          </button>
        )}
        {canResolve && (
          <button
            className="btn btn-success btn-sm"
            disabled={busy}
            onClick={() => changeStatus('Resolved', 'Work completed')}
          >
            Mark Resolved
          </button>
        )}
        <button
          className="btn btn-danger btn-sm"
          disabled={busy}
          onClick={() => changeStatus('Rejected', 'Complaint rejected')}
        >
          Reject
        </button>
      </div>
    </div>
  );
}
