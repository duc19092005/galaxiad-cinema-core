import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { UserLoginData } from '../../types/auth.types';
import { identityAxios } from '../../api/axiosClient';

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
                navigate('/login', { replace: true });
                return;
            }

            if (code && state) {
                try {
                    const response = await identityAxios.get(
                        `/IdentityAccess/google-callback-web?code=${code}&state=${state}`
                    );

                    if (response.data.isSuccess) {
                        const data = response.data.data;
                        const userInfo: UserLoginData = {
                            userId: data.userId || '',
                            username: data.username || '',
                            userName: data.username || '',
                            roles: data.roles || [],
                            accessToken: data.accessToken,
                        };
                        
                        // Lưu data user vào localstorage
                        localStorage.setItem('user_info', JSON.stringify(userInfo));
                        window.dispatchEvent(new Event('user_info_updated'));
                        
                        // Xử lý chuyển hướng giống như LoginForm (Role selection hoặc HomePage)
                        if (userInfo.roles && userInfo.roles.length > 0) {
                            if (userInfo.roles.length === 1) {
                                const roleConfig: Record<string, string> = {
                                    Customer: '/home',
                                    Cashier: '/cashier',
                                    Admin: '/admin',
                                    MovieManager: '/movie-manager',
                                    TheaterManager: '/theater-manager',
                                    FacilitiesManager: '/facilities-manager',
                                };
                                const route = roleConfig[userInfo.roles[0]] || '/role-selection';
                                navigate(route, { replace: true });
                            } else {
                                navigate('/role-selection', { replace: true });
                            }
                        } else {
                             navigate('/home', { replace: true });
                        }
                    } else {
                        // Xử lý báo lỗi đăng nhập Google thất bại
                        navigate('/login', { replace: true });
                    }
                } catch (err) {
                    console.error("Xác thực auth backend thất bại", err);
                    navigate('/login', { replace: true });
                }
            } else {
                navigate('/login', { replace: true });
            }
        };

        processGoogleLogin();
    }, [navigate, searchParams]);

    return (
        <div className="relative w-full min-h-screen overflow-hidden bg-black font-sans flex items-center justify-center">
             <div className="absolute inset-0 z-0 opacity-40 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop')" }}></div>
             <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
             <div className="relative z-10 text-white flex flex-col items-center">
                 <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                 <h2 className="text-xl font-bold tracking-widest uppercase shadow-black drop-shadow-lg">Đang xác thực Google...</h2>
             </div>
        </div>
    );
};

export default GoogleCallback;
