import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../../utils/apiClient";

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const loggedIn = isAuthenticated();

  if (loggedIn) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default PublicOnlyRoute;
