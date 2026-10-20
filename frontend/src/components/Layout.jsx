import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * App chrome: top navigation bar with role-aware links plus the page content.
 * Navigation adapts to the signed-in user's role.
 *
 * @param {{children: React.ReactNode}} props
 */
export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="brand">
            🏘️ Community<span>Care</span>
          </div>

          <div className="nav-links">
            {user?.role === 'user' && (
              <>
                <NavLink to="/dashboard">Dashboard</NavLink>
                <NavLink to="/complaints">My Complaints</NavLink>
                <NavLink to="/complaints/new">New Complaint</NavLink>
              </>
            )}
            {user?.role === 'staff' && (
              <>
                <NavLink to="/staff">My Tasks</NavLink>
              </>
            )}
            {user?.role === 'admin' && (
              <>
                <NavLink to="/admin">Dashboard</NavLink>
                <NavLink to="/admin/complaints">Complaints</NavLink>
                <NavLink to="/admin/users">Users &amp; Staff</NavLink>
              </>
            )}
          </div>

          <div className="nav-user">
            <span className="role-pill">{user?.role}</span>
            <span>{user?.name}</span>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="container">{children}</main>
    </div>
  );
}
