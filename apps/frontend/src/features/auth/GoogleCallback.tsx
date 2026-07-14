// src/features/auth/GoogleCallback.tsx
import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { UserLoginData } from '../../types/auth.types';
import { Loader2 } from 'lucide-react';

const GoogleCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isCalled = useRef(false);

  useEffect(() => {
    if (isCalled.current) return;
    isCalled.current = true;

    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');
    const rolesParam = searchParams.get('roles');

    if (success !== 'true' || error) {
      navigate('/login', {
        replace: true,
        state: { googleError: error || 'Authentication failed.' },
      });
      return;
    }

    if (userId && username) {
      const roles = rolesParam ? rolesParam.split(',') : [];
      const userInfo: UserLoginData = {
        userId,
        username,
        userName: username,
        roles,
        accessToken: undefined,
        isSharedPosAccount: false,
      };

      localStorage.setItem('user_info', JSON.stringify(userInfo));
      window.dispatchEvent(new Event('user_info_updated'));

      // Token is already in HttpOnly cookie (set by BE redirect)
      if (roles.length === 1) {
        const roleConfig: Record<string, string> = {
          Customer: '/home',
          Cashier: userInfo.isSharedPosAccount ? '/cashier' : '/staff',
          Admin: '/admin',
          MovieManager: '/movie-manager',
          TheaterManager: '/theater-manager',
          FacilitiesManager: '/facilities-manager/dashboard',
        };
        navigate(roleConfig[roles[0]] || '/role-selection', { replace: true });
      } else {
        navigate('/role-selection', { replace: true });
      }
    } else {
      navigate('/login', {
        replace: true,
        state: { googleError: 'Invalid Google login session.' },
      });
    }
  }, [navigate, searchParams]);

  return (
    <div className="state-center" style={{ minHeight: '100vh' }}>
      <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
      <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 500 }}>Đang xác thực Google...</h2>
    </div>
  );
};

export default GoogleCallback;
