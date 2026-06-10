// src/components/ProtectedRoute.tsx
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { verifyAuthAndGetUser } from '../utils/authHelpers';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const userInfo = await verifyAuthAndGetUser();

      if (!userInfo) {
        setIsAuthenticated(false);
        setIsChecking(false);
        return;
      }

      if (requiredRole) {
        const roles = userInfo.roles || [];
        if (!roles.includes(requiredRole) && !roles.includes('Admin')) {
          setIsAuthenticated(false);
          setIsChecking(false);
          return;
        }
      }

      setIsAuthenticated(true);
      setIsChecking(false);
    };

    checkAuth();
  }, [requiredRole]);

  if (isChecking) {
    return (
      <div className="state-center" style={{ minHeight: '100vh' }}>
        <Loader2 className="w-8 h-8" style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        <p className="text-secondary">Kiểm tra xác thực...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
