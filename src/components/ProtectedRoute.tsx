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
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: '#0a0a0a',
        color: '#a1a1aa',
      }}>
        <Loader2 size={28} style={{ color: '#ff8a00', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.03em' }}>
          Verifying authentication...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
