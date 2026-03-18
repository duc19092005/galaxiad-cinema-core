import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Loader2,
    Menu,
    LogOut,
    AlertCircle,
    UserCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { authApi } from '../../api/authApi';
import type { ApiErrorResponse } from '../../types/auth.types';
import { useTheme } from '../../contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import LogoutModal from '../../components/LogoutModal';
import ScheduleManagerPage from '../schedule/ScheduleManagerPage';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import Cookies from 'js-cookie';
import { useCinema } from '../../contexts/CinemaContext';
import CinemaSelector from '../../components/CinemaSelector';

// Placeholder for Employee Management & Dashboard until fully implemented
const DashboardPlaceholder = () => <div className="p-6">Dashboard functionality coming soon...</div>;
const EmployeeManagementPlaceholder = () => <div className="p-6">Employee Management functionality coming soon...</div>;

const TheaterManagerPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { managedCinemas, activeCinemaId, loading: cinemaContextLoading } = useCinema();
    const [user, setUser] = useState<{ username: string; roles?: string[]; selectedRole?: string } | null>(null);

    const [logoutError, setLogoutError] = useState<string | null>(null);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    // Sidebar state
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user_info');
        if (!storedUser) {
            navigate('/login');
            return;
        }

        try {
            const parsed = JSON.parse(storedUser) as { username: string; roles?: string[]; selectedRole?: string };
            const roles = parsed.roles || [];

            if (!roles.includes('TheaterManager')) {
                navigate('/role-selection');
                return;
            }

            setUser(parsed);
        } catch {
            navigate('/login');
        }
    }, [navigate]);

    const handleLogoutClick = () => {
        setIsLogoutModalOpen(true);
        setLogoutError(null);
    };

    const handleLogoutConfirm = async () => {
        setLogoutError(null);
        setLogoutLoading(true);
        try {
            await authApi.logout();
            localStorage.removeItem('user_info');
            Cookies.remove('X-Access-Token');
            setIsLogoutModalOpen(false);
            navigate('/login');
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response) {
                const data = error.response.data as ApiErrorResponse;
                setLogoutError(data.message || 'Logout failed.');
            } else {
                setLogoutError('Unable to connect to server.');
            }
        } finally {
            setLogoutLoading(false);
        }
    };

    // Render content based on active tab
    const renderContent = () => {
        if (cinemaContextLoading) {
            return (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-700">
                    <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-4" />
                    <p className="text-sm font-bold opacity-40 uppercase tracking-widest">{t('Loading Cinema Context...')}</p>
                </div>
            );
        }

        if (managedCinemas.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-700">
                    <div className="p-4 bg-red-600/10 rounded-full mb-6 border border-red-600/20 shadow-2xl shadow-red-600/10">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                    <h2 className="text-xl font-black mb-2 uppercase tracking-tight">{t('Access Restricted')}</h2>
                    <p className={`max-w-md mx-auto text-sm ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white/60' : 'text-gray-600'}`}>
                        {t('Tài khoản của bạn chưa được chỉ định quản lý Rạp phim nào. Vui lòng liên hệ Admin')}
                    </p>
                </div>
            );
        }

        if (!activeCinemaId) {
            return (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-700">
                    <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-4" />
                    <p className="text-sm font-bold opacity-40 uppercase tracking-widest">{t('Initializing Cinema Selection...')}</p>
                </div>
            );
        }

        switch (activeTab) {
            case 'dashboard':
                return <DashboardPlaceholder />;
            case 'employees':
                return <EmployeeManagementPlaceholder />;
            case 'schedule':
                return <ScheduleManagerPage embedded={true} />;
            default:
                return <DashboardPlaceholder />;
        }
    };

    return (
        <div className={`min-h-screen font-sans transition-colors duration-300 ${theme === 'dark'
            ? 'bg-black text-white'
            : theme === 'modern'
                ? 'bg-[#0D081D] via-[#050A14] to-[#12081C] text-white'
                : 'bg-gray-50 text-gray-900'
            }`}>
            {/* Sidebar */}
            <Sidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
            />

            {/* HEADER */}
            <header className={`fixed top-0 left-0 right-0 z-[100] h-20 border-b flex items-center justify-between px-6 transition-all duration-300 backdrop-blur-xl ${theme === 'dark'
                ? 'bg-black/80 border-gray-800'
                : theme === 'modern'
                    ? 'bg-[#030712]/80 border-indigo-500/20 shadow-2xl shadow-indigo-500/5'
                    : 'bg-white/80 border-gray-100'
                }`}>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className={`lg:hidden p-2 rounded-xl transition-all active:scale-95 z-[70] ${theme === 'dark' ? 'hover:bg-gray-800 text-white' :
                            theme === 'modern' ? 'hover:bg-indigo-500/20 text-white' :
                                'hover:bg-gray-100 text-gray-700'
                            }`}
                        title="Open Menu"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div
                        className={`text-xl sm:text-2xl font-black tracking-widest cursor-pointer transition-all hover:scale-105 active:scale-95 ${theme === 'modern' ? 'text-white' : 'text-red-600'}`}
                        onClick={() => navigate('/home')}
                    >
                        CINEMA<span className={theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}>PRO</span>
                    </div>
                </div>

                <div className="flex-1" />

                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="hidden lg:flex items-center gap-2 sm:gap-4">
                        {/* Cinema Selector Integrated */}
                        <div className="hidden md:block">
                            <CinemaSelector />
                        </div>

                        <div className="h-8 w-[1px] bg-gray-500/20 mx-2" />
                        <LanguageSwitcher />
                        <div className="h-8 w-[1px] bg-gray-500/20 mx-2" />

                        <div className="flex items-center gap-3 pr-2">
                            <div className="hidden sm:block text-right">
                                <p className={`text-[10px] uppercase font-black tracking-widest leading-none mb-1 ${theme === 'dark' ? 'text-gray-500' : theme === 'modern' ? 'text-indigo-400' : 'text-gray-400'}`}>Theater Manager</p>
                                <p className={`text-sm font-black truncate max-w-[150px] ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}`}>{user?.username}</p>
                            </div>
                            <button
                                onClick={handleLogoutClick}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-lg ${theme === 'modern' ? 'bg-gradient-to-br from-indigo-600 to-purple-700 shadow-indigo-500/20' : 'bg-red-600 shadow-red-600/20'
                                    }`}
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={() => setSidebarOpen(true)}
                        className={`lg:hidden p-1.5 rounded-full transition-all active:scale-95 ${
                            theme === 'dark' ? 'bg-gray-800' : theme === 'modern' ? 'bg-indigo-500/20' : 'bg-gray-100'
                        }`}
                    >
                        <UserCircle className={`w-6 h-6 ${theme === 'modern' ? 'text-indigo-400' : 'text-red-500'}`} />
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="pt-24 lg:pl-72 min-h-screen">
                <div className="p-4 lg:p-10 w-full overflow-hidden">
                    {/* Mobile Cinema Selector */}
                    <div className="md:hidden mb-6">
                        <CinemaSelector />
                    </div>
                    {logoutError && (
                        <div className={`mb-4 p-4 rounded-lg border flex items-center ${theme === 'dark'
                            ? 'bg-red-900/40 border-red-500/50 text-red-100'
                            : 'bg-red-50 border-red-200 text-red-800'
                            }`}>
                            <AlertCircle className="w-5 h-5 mr-3 shrink-0 text-red-500" />
                            <span className="text-sm font-medium">{logoutError}</span>
                        </div>
                    )}

                    {renderContent()}
                </div>
            </main>

            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={handleLogoutConfirm}
                loading={logoutLoading}
                error={logoutError}
            />
        </div>
    );
};

export default TheaterManagerPage;
