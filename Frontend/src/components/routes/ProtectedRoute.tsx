import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { checkAuth, isAuthenticated } from "../../utils/apiClient";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const initiallyAuthenticated = isAuthenticated();
  const [isValid, setIsValid] = useState<boolean>(initiallyAuthenticated);
  const [isChecking, setIsChecking] = useState<boolean>(initiallyAuthenticated);

  useEffect(() => {
    let mounted = true;

    const handleAuthExpired = () => {
      if (mounted) {
        setIsValid(false);
        setIsChecking(false);
      }
    };
    window.addEventListener("auth:expired", handleAuthExpired);

    if (initiallyAuthenticated) {
      // Validate session with backend using cookies
      checkAuth().then((valid) => {
        if (mounted) {
          setIsValid(valid);
          setIsChecking(false);
        }
      });
    }

    return () => {
      mounted = false;
      window.removeEventListener("auth:expired", handleAuthExpired);
    };
  }, [initiallyAuthenticated]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-red-500" />
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
