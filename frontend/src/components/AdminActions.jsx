import { useEffect, useState } from 'react';
import { complaintApi, adminApi } from '../api/services.js';
import { getErrorMessage } from '../api/client.js';
import { AlertError } from './states.jsx';

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

/**
 * Admin action panel: assign the complaint to a staff member and/or change the
 * priority. Loads the active staff list for the assignment dropdown.
 *
 * @param {{complaint: object, onUpdated: Function}} props
 */
export default function AdminActions({ complaint, onUpdated }) {
  const [staff, setStaff] = useState([]);
  const [staffId, setStaffId] = useState(complaint.assignedTo?._id || '');
  const [priority, setPriority] = useState(complaint.priority);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Load active staff once for the dropdown.
  useEffect(() => {
    adminApi
      .staff()
      .then((d) => setStaff(d.staff))
      .catch(() => {});
  }, []);

  /** Assigns the complaint to the selected staff member (and sets priority). */
  const assign = async () => {
    setError('');
    if (!staffId) {
      setError('Please select a staff member');
      return;
    }
    setBusy(true);
    try {
      const { complaint: updated } = await complaintApi.assign(complaint._id, {
        staffId,
        priority,
      });
      onUpdated(updated, 'Complaint assigned');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  /** Updates priority only, without changing assignment. */
  const savePriority = async () => {
    setError('');
    setBusy(true);
    try {
      const { complaint: updated } = await complaintApi.setPriority(complaint._id, {
        priority,
      });
      onUpdated(updated, 'Priority updated');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card mt-16">
      <h3 style={{ marginTop: 0, fontSize: 15 }}>Manage Complaint</h3>
      <AlertError>{error}</AlertError>

      <div className="field">
        <label htmlFor="assignStaff">Assign to staff</label>
        <select
          id="assignStaff"
          className="select"
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
        >
          <option value="">Select staff member</option>
          {staff.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name} — {s.department}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="priority">Priority</label>
        <select
          id="priority"
          className="select"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="row">
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={assign}>
          Assign
        </button>
        <button className="btn btn-ghost btn-sm" disabled={busy} onClick={savePriority}>
          Update Priority
        </button>
      </div>
    </div>
  );
}
