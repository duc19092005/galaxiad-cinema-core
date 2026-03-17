import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Dùng để chuyển trang
import axios from 'axios';
import { Clapperboard, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import Cookies from 'js-cookie';
import { authApi } from '../../api/authApi';
import type { LoginRequest, ApiErrorResponse } from '../../types/auth.types';
// Removed cookie reading logic - using HttpOnly cookie

// --- Reusable InputField (Giữ nguyên style rạp phim) ---
const InputField = ({ label, name, type = 'text', icon: Icon, placeholder, value, onChange }: any) => (
    <div className="flex flex-col">
        <label htmlFor={name} className="mb-2 text-sm font-medium text-gray-300 uppercase tracking-wider">
            {label}
        </label>
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Icon className="w-5 h-5 text-gray-500 transition-colors group-focus-within:text-red-500" />
            </div>
            <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full py-3.5 pl-12 pr-4 text-white placeholder-gray-500 bg-gray-800 border border-gray-700 rounded-lg outline-none focus:border-indigo-500/50 focus:shadow-[0_0_15px_rgba(99,102,241,0.3)] focus:ring-1 focus:ring-red-600 transition-all duration-200"
                required
            />
        </div>
    </div>
);

const LoginForm: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Check user info từ localStorage - nếu đã có thì có thể đã login
    // (Không check cookie vì là HttpOnly)
    useEffect(() => {
        const storedUser = localStorage.getItem('user_info');
        if (storedUser) {
            try {
                const userInfo = JSON.parse(storedUser);
                if (userInfo && userInfo.roles && userInfo.roles.length > 0) {
                    // Có user info, redirect đến role selection hoặc trang tương ứng
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
                }
            } catch (error) {
                // Invalid user info, allow login
                console.warn('Invalid user info in storage:', error);
            }
        }
    }, [navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setLoading(true);

        try {
            const payload: LoginRequest = {
                email: formData.email,
                password: formData.password
            };

            console.log('Attempting login with:', { email: payload.email });
            const res = await authApi.regularLogin(payload);
            console.log('Login response:', res);

            if (res.isSuccess) {
                // Lưu thông tin user để hiển thị ở Home
                localStorage.setItem('user_info', JSON.stringify(res.data));

                // Lưu token vào cookie cho backend trích xuất
                if (res.data.accessToken) {
                    Cookies.set('X-Access-Token', res.data.accessToken, { expires: 7, sameSite: 'Lax' });
                }

                // Chuyển hướng sang trang chọn role
                navigate('/role-selection');
            } else {
                setErrorMsg('Login failed. Please check your credentials.');
            }
        } catch (error: unknown) {
            console.error('Login error:', error);
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    const data = error.response.data as ApiErrorResponse;
                    // Hiển thị message lỗi từ server: "Invalid Password", "User Not Found"...
                    setErrorMsg(data.message || 'Login failed.');
                } else if (error.request) {
                    setErrorMsg('Unable to connect to server. Please check if the server is running.');
                } else {
                    setErrorMsg('An error occurred. Please try again.');
                }
            } else {
                setErrorMsg('An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative w-full min-h-screen overflow-hidden bg-black font-sans selection:bg-red-600 selection:text-white">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0 opacity-40 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop')" }}></div>
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>

            {/* Main Content */}
            <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4">
                <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
                    <div className="relative">
                        {/* Red Glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-900 rounded-2xl blur-lg opacity-30"></div>

                        <div className="relative bg-black/80 border border-gray-800 rounded-2xl p-8 shadow-2xl backdrop-blur-2xl">
                            {/* Header */}
                            <div className="flex flex-col items-center mb-8 text-center">
                                <div className="p-3 bg-red-600/20 rounded-full mb-4 border border-red-600/40 shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                                    <Clapperboard className="w-10 h-10 text-white" />
                                </div>
                                <h1 className="text-3xl font-black text-white uppercase tracking-[0.2em] drop-shadow-md">
                                    Welcome Back
                                </h1>
                                <p className="mt-2 text-gray-400 text-sm">Please sign in to continue</p>
                            </div>

                            {/* Error Message */}
                            {errorMsg && (
                                <div className="mb-6 p-4 rounded-lg bg-red-900/40 border border-red-500/50 flex items-center text-red-100 animate-pulse">
                                    <AlertCircle className="w-5 h-5 mr-3 shrink-0 text-red-500" />
                                    <span className="text-sm font-medium">{errorMsg}</span>
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <InputField label="Email Address" name="email" type="email" icon={Mail} placeholder="name@cinema.com" value={formData.email} onChange={handleChange} />
                                <InputField label="Password" name="password" type="password" icon={Lock} placeholder="••••••••" value={formData.password} onChange={handleChange} />

                                <button type="submit" disabled={loading} className={`group relative w-full mt-4 py-4 overflow-hidden rounded-xl text-white font-black uppercase tracking-[0.15em] shadow-[0_4px_20px_rgba(220,38,38,0.5)] ring-1 ring-white/10 ${loading ? 'bg-red-900 cursor-not-allowed opacity-80' : 'bg-red-700 transition-all hover:scale-[1.02] hover:bg-red-600'}`}>
                                    {!loading && <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine" />}
                                    <div className="flex items-center justify-center gap-3">
                                        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                                        <span className="relative text-lg">{loading ? 'Signing In...' : 'Login'}</span>
                                    </div>
                                </button>
                            </form>

                            <div className="mt-6 text-center text-lg text-gray-500">
                                Don't have an account? <Link to="/register" className="text-red-500 hover:text-red-400 font-bold transition-colors">Register now</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;