import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from './SessionProvider.jsx'

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useSession()
  const location = useLocation()

  if (!isAuthenticated || (roles && !roles.includes(user?.role))) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
