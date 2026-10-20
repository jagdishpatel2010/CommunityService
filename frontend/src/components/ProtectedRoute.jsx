import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Layout from './Layout.jsx';
import { Loading } from './states.jsx';

/**
 * Guards routes that require authentication and (optionally) a specific role.
 * While the session is being restored it shows a spinner; unauthenticated
 * users are redirected to login; users with the wrong role are sent to their
 * own home screen.
 *
 * @param {{children: React.ReactNode, roles?: string[]}} props
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading label="Checking your session..." />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Logged in but not allowed here — bounce to the role's landing page.
    return <Navigate to={homeFor(user.role)} replace />;
  }

  return <Layout>{children}</Layout>;
}

/**
 * Returns the landing route for a given role.
 *
 * @param {string} role - 'user' | 'staff' | 'admin'
 * @returns {string} Route path.
 */
export function homeFor(role) {
  if (role === 'admin') return '/admin';
  if (role === 'staff') return '/staff';
  return '/dashboard';
}
