import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  /** Optional: render children directly instead of <Outlet /> */
  children?: React.ReactNode;
}

/**
 * Guards a route behind authentication.
 * - Unauthenticated → redirects to /login (replace so the history stack stays clean).
 * - Authenticated   → renders nested <Outlet /> or explicit children.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
