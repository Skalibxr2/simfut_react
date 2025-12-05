import { Navigate } from 'react-router-dom'
import { useSession } from './SessionProvider.jsx'

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useSession()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
