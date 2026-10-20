import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../api/services.js';
import { getErrorMessage } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Loading, ErrorState, AlertError, AlertSuccess } from '../../components/states.jsx';
import { Modal, formatDate } from '../../components/ui.jsx';

/**
 * Admin user & staff management. Lists all accounts, lets the admin create new
 * staff members, toggle an account's active state and change roles.
 */
export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showStaffModal, setShowStaffModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { users: list } = await adminApi.users(
        roleFilter ? { role: roleFilter } : {}
      );
      setUsers(list);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  };

  /** Toggles active state for a user and refreshes the row. */
  const toggleActive = async (u) => {
    try {
      await adminApi.setActive(u._id, !u.isActive);
      flash(`${u.name} ${u.isActive ? 'deactivated' : 'activated'}`);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  /** Changes a user's role. */
  const changeRole = async (u, role) => {
    try {
      await adminApi.setRole(u._id, role);
      flash(`${u.name} is now ${role}`);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Users &amp; Staff</h1>
          <div className="page-sub">Manage accounts and staff members</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowStaffModal(true)}>
          + Add Staff
        </button>
      </div>

      <AlertSuccess>{notice}</AlertSuccess>
      <AlertError>{error}</AlertError>

      <div className="toolbar">
        <div className="field">
          <label>Filter by role</label>
          <select
            className="select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All roles</option>
            <option value="user">Users</option>
            <option value="staff">Staff</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u._id === me.id || u._id === me._id;
                return (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <select
                        className="select"
                        style={{ padding: '4px 8px', width: 'auto' }}
                        value={u.role}
                        disabled={isSelf}
                        onChange={(e) => changeRole(u, e.target.value)}
                      >
                        <option value="user">user</option>
                        <option value="staff">staff</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>{u.department || '—'}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: u.isActive ? '#e2f6ea' : '#fde3e5',
                          color: u.isActive ? '#148a4e' : '#c22d39',
                        }}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        disabled={isSelf}
                        onClick={() => toggleActive(u)}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {error && !loading && <ErrorState message={error} onRetry={load} />}
        </div>
      )}

      {showStaffModal && (
        <AddStaffModal
          onClose={() => setShowStaffModal(false)}
          onCreated={(name) => {
            setShowStaffModal(false);
            flash(`Staff member ${name} created`);
            load();
          }}
        />
      )}
    </>
  );
}

/**
 * Modal form to create a new staff account.
 *
 * @param {{onClose: Function, onCreated: Function}} props
 */
function AddStaffModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Valid email required';
    if (!form.department.trim()) next.department = 'Department is required';
    if (form.password.length < 6) next.password = 'Min 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await adminApi.createStaff(form);
      onCreated(form.name);
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Add Staff Member" onClose={onClose}>
      <AlertError>{serverError}</AlertError>
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="s-name">Name</label>
          <input id="s-name" name="name" className="input" value={form.name} onChange={update} />
          {errors.name && <div className="field-error">{errors.name}</div>}
        </div>
        <div className="field">
          <label htmlFor="s-email">Email</label>
          <input id="s-email" name="email" className="input" value={form.email} onChange={update} />
          {errors.email && <div className="field-error">{errors.email}</div>}
        </div>
        <div className="field">
          <label htmlFor="s-phone">Phone</label>
          <input id="s-phone" name="phone" className="input" value={form.phone} onChange={update} />
        </div>
        <div className="field">
          <label htmlFor="s-dept">Department</label>
          <input
            id="s-dept"
            name="department"
            className="input"
            value={form.department}
            onChange={update}
            placeholder="e.g. Electrical, Plumbing"
          />
          {errors.department && <div className="field-error">{errors.department}</div>}
        </div>
        <div className="field">
          <label htmlFor="s-pass">Temporary password</label>
          <input
            id="s-pass"
            name="password"
            type="password"
            className="input"
            value={form.password}
            onChange={update}
          />
          {errors.password && <div className="field-error">{errors.password}</div>}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Staff'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
