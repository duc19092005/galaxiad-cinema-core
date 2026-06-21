// src/features/auth/GoogleCallback.tsx
import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { UserLoginData } from '../../types/auth.types';
import { identityAxios } from '../../api/axiosClient';
import Cookies from 'js-cookie';
import { Loader2 } from 'lucide-react';

const GoogleCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isCalled = useRef(false);

  useEffect(() => {
    if (isCalled.current) return;
    isCalled.current = true;

    const processGoogleLogin = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        const errorMessages: Record<string, string> = {
          access_denied: 'You denied Google access permission.',
          invalid_scope: 'Invalid access scope.',
          server_error: 'Google server encountered an error.',
          temporarily_unavailable: 'Google service is temporarily unavailable.',
        };
        navigate('/login', { replace: true, state: { googleError: errorMessages[error] || `Login failed (${error}).` } });
        return;
      }

      if (code && state) {
        try {
          const response = await identityAxios.get(`/IdentityAccess/google-callback-web?code=${code}&state=${state}`);
          if (response.data.isSuccess) {
            const data = response.data.data;
            const userInfo: UserLoginData = {
              userId: data.userId || '', username: data.username || '', userName: data.username || '',
              roles: data.roles || [], accessToken: data.accessToken, isSharedPosAccount: data.isSharedPosAccount,
            };
            localStorage.setItem('user_info', JSON.stringify(userInfo));
            window.dispatchEvent(new Event('user_info_updated'));
            if (userInfo.accessToken) Cookies.set('X-Access-Token', userInfo.accessToken, { expires: 7, sameSite: 'Lax' });

            if (userInfo.roles && userInfo.roles.length > 0) {
              if (userInfo.roles.length === 1) {
                const roleConfig: Record<string, string> = {
                  Customer: '/home', Cashier: userInfo.isSharedPosAccount ? '/cashier' : '/staff', Admin: '/admin',
                  MovieManager: '/movie-manager', TheaterManager: '/theater-manager', FacilitiesManager: '/facilities-manager',
                };
                navigate(roleConfig[userInfo.roles[0]] || '/role-selection', { replace: true });
              } else { navigate('/role-selection', { replace: true }); }
            } else { navigate('/home', { replace: true }); }
          } else {
            navigate('/login', { replace: true, state: { googleError: response.data?.message || 'Authentication failed.' } });
          }
        } catch (err: any) {
          let errorMessage = 'Could not connect to authentication server.';
          if (err.response?.data?.message) errorMessage = err.response.data.message;
          else if (err.response?.status === 400) errorMessage = 'Invalid authentication request.';
          else if (err.response?.status === 500) errorMessage = 'Server encountered an error.';
          navigate('/login', { replace: true, state: { googleError: errorMessage } });
        }
      } else {
        navigate('/login', { replace: true, state: { googleError: 'Invalid Google login session.' } });
      }
    };
    processGoogleLogin();
  }, [navigate, searchParams]);

  return (
    <div className="state-center" style={{ minHeight: '100vh' }}>
      <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
      <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 500 }}>Đang xác thực Google...</h2>
    </div>
  );
};

export default GoogleCallback;
