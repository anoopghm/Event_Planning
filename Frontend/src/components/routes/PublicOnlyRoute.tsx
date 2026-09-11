import { Navigate } from "react-router-dom";
import { getAccessToken } from "../../utils/apiClient";

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const token = getAccessToken();

  if (token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default PublicOnlyRoute;
