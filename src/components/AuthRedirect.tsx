// src/components/AuthRedirect.tsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { verifyAuthAndGetUser } from '../utils/authHelpers';

const roleConfig: Record<string, string> = {
  Customer: '/home',
  Cashier: '/staff',
  Admin: '/admin',
  MovieManager: '/movie-manager',
  TheaterManager: '/theater-manager',
  FacilitiesManager: '/facilities-manager',
};

const AuthRedirect: React.FC = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    const checkAndRedirect = async () => {
      const userInfo = await verifyAuthAndGetUser();
      if (!userInfo) { setRedirectPath('/login'); setIsChecking(false); return; }

      if (userInfo.roles.length === 1) {
        const onlyRole = userInfo.roles[0];
        setRedirectPath(onlyRole === 'Cashier' && userInfo.isSharedPosAccount ? '/cashier' : roleConfig[onlyRole] || '/role-selection');
      } else if (userInfo.roles.length > 1) {
        setRedirectPath('/role-selection');
      } else {
        setRedirectPath('/login');
      }
      setIsChecking(false);
    };
    checkAndRedirect();
  }, []);

  if (isChecking) {
    return (
      <div className="state-center" style={{ minHeight: '100vh' }}>
        <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        <p className="text-secondary">Đang kiểm tra xác thực...</p>
      </div>
    );
  }

  return <Navigate to={redirectPath || '/login'} replace />;
};

export default AuthRedirect;
