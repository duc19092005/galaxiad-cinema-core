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
          access_denied: 'Bạn đã từ chối quyền truy cập Google.',
          invalid_scope: 'Phạm vi truy cập không hợp lệ.',
          server_error: 'Máy chủ Google gặp sự cố.',
          temporarily_unavailable: 'Dịch vụ Google tạm thời không khả dụng.',
        };
        navigate('/login', { replace: true, state: { googleError: errorMessages[error] || `Đăng nhập thất bại (${error}).` } });
        return;
      }

      if (code && state) {
        try {
          const response = await identityAxios.get(`/IdentityAccess/google-callback-web?code=${code}&state=${state}`);
          if (response.data.isSuccess) {
            const data = response.data.data;
            const userInfo: UserLoginData = {
              userId: data.userId || '', username: data.username || '', userName: data.username || '',
              roles: data.roles || [], accessToken: data.accessToken,
            };
            localStorage.setItem('user_info', JSON.stringify(userInfo));
            window.dispatchEvent(new Event('user_info_updated'));
            if (userInfo.accessToken) Cookies.set('X-Access-Token', userInfo.accessToken, { expires: 7, sameSite: 'Lax' });

            if (userInfo.roles && userInfo.roles.length > 0) {
              if (userInfo.roles.length === 1) {
                const roleConfig: Record<string, string> = {
                  Customer: '/home', Cashier: '/cashier', Admin: '/admin',
                  MovieManager: '/movie-manager', TheaterManager: '/theater-manager', FacilitiesManager: '/facilities-manager',
                };
                navigate(roleConfig[userInfo.roles[0]] || '/role-selection', { replace: true });
              } else { navigate('/role-selection', { replace: true }); }
            } else { navigate('/home', { replace: true }); }
          } else {
            navigate('/login', { replace: true, state: { googleError: response.data?.message || 'Xác thực thất bại.' } });
          }
        } catch (err: any) {
          let errorMessage = 'Không thể kết nối đến máy chủ xác thực.';
          if (err.response?.data?.message) errorMessage = err.response.data.message;
          else if (err.response?.status === 400) errorMessage = 'Yêu cầu xác thực không hợp lệ.';
          else if (err.response?.status === 500) errorMessage = 'Máy chủ gặp sự cố.';
          navigate('/login', { replace: true, state: { googleError: errorMessage } });
        }
      } else {
        navigate('/login', { replace: true, state: { googleError: 'Phiên đăng nhập Google không hợp lệ.' } });
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
