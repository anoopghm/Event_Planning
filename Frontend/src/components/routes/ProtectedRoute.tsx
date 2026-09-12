import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../../utils/apiClient";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const loggedIn = isAuthenticated();

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
