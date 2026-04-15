import { Navigate } from 'react-router-dom'
import { isAuthenticated, getUserRole } from '../services/auth'

/**
 * ProtectedRoute Component
 * Prevents unauthenticated users from accessing protected pages
 * Optionally checks for specific roles
 * 
 * Usage:
 *   <Route path="/company/dashboard" element={<ProtectedRoute roles={['company']}><DashboardPage /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children, roles = null }) {
  const token = isAuthenticated()
  const userRole = getUserRole()

  // Not authenticated - redirect to login
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Check if user has required role
  if (roles && !roles.includes(userRole)) {
    return <Navigate to="/" replace />
  }

  // All checks passed - render component
  return children
}
