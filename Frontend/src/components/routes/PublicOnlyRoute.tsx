import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { checkAuth, isAuthenticated } from "../../utils/apiClient";

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const initiallyAuthenticated = isAuthenticated();
  const [isValid, setIsValid] = useState<boolean>(initiallyAuthenticated);
  const [isChecking, setIsChecking] = useState<boolean>(initiallyAuthenticated);

  useEffect(() => {
    let mounted = true;

    if (initiallyAuthenticated) {
      checkAuth().then((valid) => {
        if (mounted) {
          setIsValid(valid);
          setIsChecking(false);
        }
      });
    }

    return () => {
      mounted = false;
    };
  }, [initiallyAuthenticated]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-red-500" />
      </div>
    );
  }

  if (isValid) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default PublicOnlyRoute;
