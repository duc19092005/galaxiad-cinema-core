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
      // Verify authentication bằng cách gọi API (cookie HttpOnly sẽ tự động được gửi)
      const userInfo = await verifyAuthAndGetUser();

      if (!userInfo) {
        setIsAuthenticated(false);
        setIsChecking(false);
        return;
      }

      // Check role nếu có yêu cầu
      if (requiredRole) {
        if (!userInfo.roles || !userInfo.roles.includes(requiredRole)) {
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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-400">Đang kiểm tra xác thực...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
