import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute, { homeFor } from './components/ProtectedRoute.jsx';
import { Loading } from './components/states.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import UserDashboard from './pages/user/UserDashboard.jsx';
import ComplaintList from './pages/user/ComplaintList.jsx';
import NewComplaint from './pages/user/NewComplaint.jsx';
import ComplaintDetail from './pages/ComplaintDetail.jsx';
import StaffTasks from './pages/staff/StaffTasks.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminComplaints from './pages/admin/AdminComplaints.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';

/**
 * Top-level router. Sends authenticated users to their role landing page and
 * guards every protected route by role.
 */
export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <Loading label="Starting up..." />;

  return (
    <Routes>
      {/* Public auth routes. Redirect away if already logged in. */}
      <Route path="/login" element={user ? <Navigate to={homeFor(user.role)} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={homeFor(user.role)} replace /> : <Register />} />

      {/* User routes */}
      <Route path="/dashboard" element={<ProtectedRoute roles={['user']}><UserDashboard /></ProtectedRoute>} />
      <Route path="/complaints" element={<ProtectedRoute roles={['user']}><ComplaintList /></ProtectedRoute>} />
      <Route path="/complaints/new" element={<ProtectedRoute roles={['user']}><NewComplaint /></ProtectedRoute>} />

      {/* Shared detail view (user/staff/admin — backend enforces visibility) */}
      <Route path="/complaints/:id" element={<ProtectedRoute roles={['user', 'staff', 'admin']}><ComplaintDetail /></ProtectedRoute>} />

      {/* Staff routes */}
      <Route path="/staff" element={<ProtectedRoute roles={['staff']}><StaffTasks /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/complaints" element={<ProtectedRoute roles={['admin']}><AdminComplaints /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />

      {/* Default + fallback */}
      <Route path="/" element={<Navigate to={user ? homeFor(user.role) : '/login'} replace />} />
      <Route path="*" element={<Navigate to={user ? homeFor(user.role) : '/login'} replace />} />
    </Routes>
  );
}
