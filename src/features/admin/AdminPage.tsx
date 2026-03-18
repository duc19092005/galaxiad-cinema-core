import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    LayoutDashboard,
    LogOut,
    ChevronDown,
    UserCircle,
    Sun,
    Moon,
    Sparkles,
    Loader2,
    Clock,
    CheckCircle,
    UserCog,
    ShieldCheck,
    Filter,
    ArrowLeftRight,
    ArrowUpDown,
    SortAsc,
    SortDesc,
    Menu,
    XCircle,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { adminApi } from '../../api/adminApi';
import { authApi } from '../../api/authApi';
import type { AdminUserDto, GroupedScheduleJobDto } from '../../types/admin.types';
import toast from 'react-hot-toast';
import LogoutModal from '../../components/LogoutModal';
import RoleUpdateModal from '../../components/RoleUpdateModal';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import TransferRightsView from './components/TransferRightsView';
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';

// =============================================
// SIDEBAR COMPONENT
// =============================================
interface SidebarProps {
    activeTab: 'users' | 'jobs' | 'transfer';
    onTabChange: (tab: 'users' | 'jobs' | 'transfer') => void;
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isOpen, onClose }) => {
    const { theme, setTheme } = useTheme();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const menuItems = [
        { id: 'users', label: t('User Management'), icon: Users },
        { id: 'jobs', label: t('Background Jobs'), icon: Clock },
        { id: 'transfer', label: t('Transfer Rights'), icon: Sparkles },
    ] as const;

    const storedUserStr = localStorage.getItem('user_info');
    const user = storedUserStr ? JSON.parse(storedUserStr) : null;

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch (e) {}
        localStorage.removeItem('user_info');
        import('js-cookie').then(Cookies => Cookies.default.remove('X-Access-Token'));
        navigate('/login');
    };

    return (
        <aside className={`fixed top-0 left-0 h-full w-72 z-[110] border-r transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) transform ${isOpen ? 'translate-x-0 scale-100' : '-translate-x-full lg:translate-x-0'
            } ${theme === 'dark' ? 'bg-black border-gray-800' :
                theme === 'modern' ? 'bg-[#030712] border-indigo-500/20 shadow-[10px_0_30px_rgba(0,0,0,0.5)]' :
                    'bg-white border-gray-100'
            } flex flex-col`}>
            {/* Sidebar Header */}
            <div className={`p-6 flex items-center justify-between border-b ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/20' : 'border-gray-100'
                }`}>
                <div
                    className={`text-xl font-black tracking-widest cursor-pointer transition-all active:scale-95 ${theme === 'modern' ? 'text-white' : 'text-red-600'}`}
                    onClick={() => navigate('/home')}
                >
                    CINEMA<span className={theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}>PRO</span>
                </div>
                <button
                    onClick={onClose}
                    className={`lg:hidden p-2 rounded-xl transition-all active:scale-90 ${theme === 'dark' || theme === 'modern' ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    <XCircle className="w-6 h-6" />
                </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                
                {/* -------------------- MOBILE ONLY VIEW -------------------- */}
                {user && (
                    <div className="lg:hidden space-y-4 pb-4 border-b border-gray-500/10">
                        <div className="flex items-center gap-4 mb-2 p-1">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg shrink-0 ${theme === 'modern' ? 'bg-gradient-to-br from-indigo-600 to-purple-700' : 'bg-gradient-to-br from-red-600 to-red-800'}`}>
                                <UserCircle className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-[10px] uppercase font-black tracking-widest leading-none mb-1 ${theme === 'dark' ? 'text-gray-500' : theme === 'modern' ? 'text-indigo-400' : 'text-gray-400'}`}>{t('ĐĂNG NHẬP BỞI')}</p>
                                <p className={`text-sm font-black truncate ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}`}>{user.username}</p>
                            </div>
                        </div>
                        <button onClick={() => { navigate('/account'); onClose(); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all active:scale-95 ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : theme === 'modern' ? 'text-white hover:bg-indigo-500/10' : 'text-gray-700 hover:bg-gray-100'}`}>
                            <UserCircle className="w-5 h-5 text-indigo-400" />
                            <span className="font-bold">{t('Thông Tin Tài Khoản')}</span>
                        </button>
                        {user.roles && user.roles.some((r: string) => r !== 'User' && r !== 'Cashier') && (
                            <button onClick={() => { navigate('/role-selection'); onClose(); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all active:scale-95 text-green-500 ${theme === 'dark' ? 'hover:bg-gray-800/50' : theme === 'modern' ? 'hover:bg-green-500/10' : 'hover:bg-green-50'}`}>
                                <LayoutDashboard className="w-5 h-5" />
                                <span className="font-bold">Management Hub</span>
                            </button>
                        )}
                        {user.roles && user.roles.length > 1 && (
                            <button onClick={() => { navigate('/role-selection'); onClose(); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all active:scale-95 text-blue-500 border-t ${theme === 'dark' ? 'border-gray-800 hover:bg-gray-800/50' : theme === 'modern' ? 'border-indigo-500/20 hover:bg-blue-500/10' : 'border-gray-100 hover:bg-blue-50'}`}>
                                <ArrowLeftRight className="w-5 h-5" />
                                <span className="font-bold">{t('Đổi Vai Trò')}</span>
                            </button>
                        )}
                        <button onClick={() => { handleLogout(); onClose(); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all active:scale-95 text-red-500 font-bold ${theme === 'dark' ? 'hover:bg-red-500/10' : theme === 'modern' ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}>
                            <LogOut className="w-5 h-5" />
                            <span>{t('Đăng Xuất')}</span>
                        </button>
                    </div>
                )}

                {/* Navigation Section */}
                <div className="space-y-4">
                    <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-indigo-400' : 'text-gray-500'}`}>
                        {t('Navigation')}
                    </h3>
                    <div className="space-y-2">
                        {/* Always have a Home button */}
                        <button
                            onClick={() => navigate('/home')}
                            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all active:scale-95 ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' :
                                    theme === 'modern' ? 'text-white hover:bg-indigo-500/10' :
                                        'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <LayoutDashboard className="w-5 h-5 text-indigo-400" />
                            <span className="font-bold">{t('Back To Home')}</span>
                        </button>

                        <div className={`mt-4 pt-4 border-t ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/10' : 'border-gray-100'}`}></div>

                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onTabChange(item.id);
                                    if (window.innerWidth < 1024) onClose();
                                }}
                                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all active:scale-95 ${activeTab === item.id
                                        ? theme === 'modern'
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                            : 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                                        : theme === 'dark'
                                            ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                            : theme === 'modern'
                                                ? 'text-white/70 hover:bg-white/5 hover:text-white'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-indigo-400'}`} />
                                <span className="font-bold">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Account Actions Section (Desktop only) */}
                <div className="hidden lg:block space-y-4">
                    <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-indigo-400' : 'text-gray-500'}`}>
                        {t('System')}
                    </h3>
                    <div className="space-y-2">
                        <button
                            onClick={() => navigate('/account')}
                            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all active:scale-95 ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' :
                                    theme === 'modern' ? 'text-white hover:bg-indigo-500/10' :
                                        'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <UserCircle className="w-5 h-5 text-cyan-400" />
                            <span className="font-bold">{t('Account Info')}</span>
                        </button>
                    </div>
                </div>

                {/* Preferences Section (Mobile Only) */}
                <div className="lg:hidden space-y-4">
                    <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-indigo-400' : 'text-gray-500'}`}>
                        {t('Preferences')}
                    </h3>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                            <span className={`text-sm font-bold tracking-tight ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}`}>{t('Language')}</span>
                            <LanguageSwitcher />
                        </div>
                        <div className="flex items-center justify-between px-2">
                            <span className={`text-sm font-bold tracking-tight ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}`}>{t('Theme')}</span>
                            <div className="flex gap-2">
                                {(['light', 'dark', 'modern'] as const).map((tMode) => (
                                    <button
                                        key={tMode}
                                        onClick={() => setTheme(tMode)}
                                        className={`p-2.5 rounded-xl transition-all transform active:scale-90 ${theme === tMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40' : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'}`}
                                        title={`Switch to ${tMode}`}
                                    >
                                        {tMode === 'light' ? <Sun className="w-4 h-4" /> : tMode === 'dark' ? <Moon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Footer (Desktop only) */}
            <div className={`hidden lg:block p-6 border-t ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/20' : 'border-gray-100'}`}>
                <button
                    onClick={() => navigate('/role-selection')}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all active:scale-95 ${theme === 'dark' ? 'text-blue-400 hover:bg-blue-500/10' :
                            theme === 'modern' ? 'text-cyan-400 hover:bg-cyan-500/10' :
                                'text-blue-600 hover:bg-blue-50'
                        }`}
                >
                    <ArrowLeftRight className="w-5 h-5" />
                    <span className="font-bold">{t('Switch Role')}</span>
                </button>
            </div>

        </aside>
    );
};

// =============================================
// MAIN ADMIN PAGE
// =============================================

const AdminPage: React.FC = () => {
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const { t } = useTranslation();

    const [activeTab, setActiveTab] = useState<'users' | 'jobs' | 'transfer'>('users');
    const [users, setUsers] = useState<AdminUserDto[]>([]);
    const [jobs, setJobs] = useState<GroupedScheduleJobDto[]>([]);
    const [loading, setLoading] = useState(true);

    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [logoutError, setLogoutError] = useState<string | null>(null);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
    const themeDropdownRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [user, setUser] = useState<{ username: string; roles?: string[]; userId?: string } | null>(null);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [selectedUserEmail, setSelectedUserEmail] = useState<string>('');
    const [selectedUserRoles, setSelectedUserRoles] = useState<string>('');

    const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);

    // Background Jobs Filter & Sort
    const [jobCategoryFilter, setJobCategoryFilter] = useState<string>('All');
    const [jobSortOrder, setJobSortOrder] = useState<'asc' | 'desc'>('desc');

    // Click outside handler for action menu and dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            // Handle activeActionMenu (the table dropdown)
            if (activeActionMenu && !target.closest('.action-menu-container')) {
                setActiveActionMenu(null);
            }

            // Handle header dropdowns
            if (dropdownRef.current && !dropdownRef.current.contains(target)) setIsDropdownOpen(false);
            if (themeDropdownRef.current && !themeDropdownRef.current.contains(target)) setIsThemeDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeActionMenu]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user_info');
        if (!storedUser) { navigate('/login'); return; }
        const parsed = JSON.parse(storedUser);
        if (!parsed.roles?.includes('Admin')) { navigate('/role-selection'); return; }
        setUser(parsed);
    }, [navigate]);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        if (activeTab === 'transfer') {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            if (activeTab === 'users') {
                const res = await adminApi.getUsers();
                setUsers(res.data || []);
            } else if (activeTab === 'jobs') {
                const res = await adminApi.getScheduleJobs();
                setJobs(res.data || []);
            }
        } catch (err) {
            toast.error('Failed to load data.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUserStatus = async (userId: string, newStatus: number) => {
        try {
            await adminApi.updateUserStatus(userId, newStatus);
            toast.success('User status updated successfully');
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update user status');
        }
    };

    const handleUpdateUserRole = (userId: string, email: string, roles: string) => {
        setSelectedUserId(userId);
        setSelectedUserEmail(email);
        setSelectedUserRoles(roles);
        setIsRoleModalOpen(true);
    };

    const handleRoleUpdateSuccess = (updatedUserId: string) => {
        if (updatedUserId === user?.userId) {
            toast.success('Your roles have been updated. Please log in again.');
            handleLogoutConfirm();
        } else {
            fetchData();
        }
    };

    const handleLogoutConfirm = async () => {
        setLogoutLoading(true);
        try {
            await authApi.logout();
            localStorage.removeItem('user_info');
            Cookies.remove('X-Access-Token');
            navigate('/login');
        } catch (error) {
            setLogoutError('Logout failed.');
        } finally {
            setLogoutLoading(false);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr || dateStr.startsWith('0001-01-01')) return 'N/A';
        // Strip 'Z' to treat as Wall Time (prevent local offset shifting)
        const wallTimeStr = dateStr.endsWith('Z') ? dateStr.slice(0, -1) : dateStr;
        return new Date(wallTimeStr).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className={`min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-black text-white' : theme === 'modern' ? 'bg-gradient-to-br from-[#0D081D] via-[#050A14] to-[#12081C] text-white' : 'bg-gray-50 text-gray-900'}`}>
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[55] lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* HEADER */}
            <header className={`fixed top-0 left-0 right-0 lg:left-64 z-50 backdrop-blur-md border-b h-16 flex items-center justify-between px-4 sm:px-6 shadow-lg transition-colors duration-300 ${theme === 'dark'
                ? 'bg-black/80 border-gray-800'
                : theme === 'modern'
                    ? 'bg-gradient-to-r from-[#0E0A20]/90 shadow-2xl border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                    : 'bg-white/80 border-gray-200'
                }`}>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className={`lg:hidden p-2 rounded-lg transition-all active:scale-95 z-[70] ${theme === 'dark' ? 'hover:bg-gray-800 text-white' :
                                theme === 'modern' ? 'hover:bg-indigo-500/20 text-white' :
                                    'hover:bg-gray-100 text-gray-700'
                            }`}
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div
                        className={`text-xl sm:text-2xl font-black tracking-widest cursor-pointer transition-all hover:scale-105 active:scale-95 ${theme === 'modern'
                            ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-300 to-rose-300 drop-shadow-sm'
                            : 'text-red-600'
                            }`}
                        onClick={() => navigate('/home')}
                    >
                        CINEMA<span className={theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}>PRO</span>
                    </div>
                </div>
                <div className="flex-1" />

                <div className="flex items-center gap-1.5 sm:gap-3">
                    <div className="hidden lg:block">
                        <LanguageSwitcher />
                    </div>
                    <div className="hidden lg:block relative" ref={themeDropdownRef}>
                        <button
                            onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${theme === 'dark'
                                ? 'hover:bg-gray-800 text-gray-300'
                                : theme === 'modern'
                                    ? 'hover:bg-indigo-800/40 text-white font-medium'
                                    : 'hover:bg-gray-100 text-gray-700'
                                }`}
                            aria-label="Select theme"
                        >
                            {theme === 'dark' ? (
                                <Moon className="w-5 h-5" />
                            ) : theme === 'modern' ? (
                                <Sparkles className="w-5 h-5" />
                            ) : (
                                <Sun className="w-5 h-5" />
                            )}
                            <span className="hidden sm:inline-block text-sm font-medium">
                                {theme === 'dark' ? t('Dark Mode') : theme === 'modern' ? t('Modern View') : t('Light Mode')}
                            </span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isThemeDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isThemeDropdownOpen && (
                            <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${theme === 'dark'
                                ? 'bg-gray-900 border border-gray-700'
                                : theme === 'modern'
                                    ? 'bg-gradient-to-br from-[#15102B]/95 to-[#0b061c]/95 border border-indigo-500/30 shadow-sm shadow-indigo-500/10 backdrop-blur-2xl'
                                    : 'bg-white border border-gray-200'} ${theme === 'modern' ? 'bg-[#0f172a]/40 backdrop-blur-2xl border-indigo-500/20' : ''}'
                                }`}>
                                <div className="py-2">
                                    <div className={`px-4 py-2 border-b ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/30 shadow-sm shadow-indigo-500/10' : 'border-gray-200'
                                        }`}>
                                        <p className={`text-xs uppercase font-bold ${theme === 'dark' ? 'text-gray-500' : theme === 'modern' ? 'text-white font-medium' : 'text-gray-400'
                                            }`}>
                                            {t('Select Theme')}
                                        </p>
                                        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-indigo-300' : 'text-gray-500'
                                            }`}>
                                            {t('Demo - Choose your favorite color tone')}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setTheme('light');
                                            setIsThemeDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === 'light'
                                            ? 'bg-gray-100 text-gray-900'
                                            : theme === 'dark'
                                                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                                : theme === 'modern'
                                                    ? 'text-white font-medium hover:bg-indigo-800/40 hover:text-white'
                                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                            }`}
                                    >
                                        <Sun className="w-4 h-4" />
                                        <div className="flex-1">
                                            <div className="font-semibold">{t('Light Mode')}</div>
                                            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-indigo-300/70' : 'text-gray-500'
                                                }`}>
                                                {t('Light Interface')}
                                            </div>
                                        </div>
                                        {theme === 'light' && <div className="w-2 h-2 rounded-full bg-red-600" />}
                                    </button>

                                    <button
                                        onClick={() => {
                                            setTheme('dark');
                                            setIsThemeDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === 'dark'
                                            ? 'bg-gray-800 text-white'
                                            : theme === 'modern'
                                                ? 'text-white font-medium hover:bg-indigo-800/40 hover:text-white'
                                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                            }`}
                                    >
                                        <Moon className="w-4 h-4" />
                                        <div className="flex-1">
                                            <div className="font-semibold">{t('Dark Mode')}</div>
                                            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-indigo-300/70' : 'text-gray-500'
                                                }`}>
                                                {t('Dark Interface')}
                                            </div>
                                        </div>
                                        {theme === 'dark' && <div className="w-2 h-2 rounded-full bg-red-600" />}
                                    </button>

                                    <button
                                        onClick={() => {
                                            setTheme('modern');
                                            setIsThemeDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === 'modern'
                                            ? 'bg-[#15102B] text-white'
                                            : theme === 'dark'
                                                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                            }`}
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        <div className="flex-1">
                                            <div className="font-semibold">{t('Modern View')}</div>
                                            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-indigo-300/70' : 'text-gray-500'
                                                }`}>
                                                {t('Web3 Color Tone')}
                                            </div>
                                        </div>
                                        {theme === 'modern' && <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500" />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="hidden lg:block relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg transition-colors outline-none focus:ring-2 shrink-0 ${theme === 'dark' ? 'hover:bg-gray-800 focus:ring-red-600/50' : theme === 'modern' ? 'hover:bg-indigo-500/10 hover:shadow-[0_0_8px_rgba(99,102,241,0.15)] focus:ring-indigo-500/50' : 'hover:bg-gray-100 focus:ring-red-600/50'
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg shrink-0 ${theme === 'modern' ? 'bg-gradient-to-br from-indigo-600 to-purple-700 opacity-90 shadow-indigo-500/20' : 'bg-gradient-to-br from-red-600 to-red-800'}`}>
                                <UserCircle className="w-5 h-5 text-white" />
                            </div>
                            <span className={`hidden md:block font-bold text-sm ${theme === 'dark' ? 'text-gray-200' : theme === 'modern' ? 'text-white' : 'text-gray-700'}`}>
                                {user?.username || 'Guest'}
                            </span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white/60' : 'text-gray-600'}`} />
                        </button>

                        {isDropdownOpen && (
                            <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${theme === 'dark' ? 'bg-gray-900 border border-gray-700' : theme === 'modern' ? 'bg-[#0f172a]/40 backdrop-blur-2xl border border-indigo-500/20' : 'bg-white border border-gray-200'
                                }`}>
                                <div className="py-2">
                                    <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/20' : 'border-gray-200'}`}>
                                        <p className={`text-xs uppercase font-bold ${theme === 'dark' ? 'text-gray-500' : theme === 'modern' ? 'text-indigo-400' : 'text-gray-400'}`}>{t('SIGNED IN AS')}</p>
                                        <p className={`text-sm font-bold truncate ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}`}>{user?.username}</p>
                                    </div>

                                    <button
                                        onClick={() => { navigate('/account'); setIsDropdownOpen(false); }}
                                        className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-indigo-400' : theme === 'modern' ? 'text-white hover:bg-indigo-500/20 hover:text-indigo-300 hover:drop-shadow-[0_0_3px_rgba(129,140,248,0.4)]' : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-400'}`}
                                    >
                                        <UserCircle className="w-4 h-4" />{t('header.accountInfo')}
                                    </button>

                                    <button
                                        onClick={() => navigate('/role-selection')}
                                        className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-blue-500' : theme === 'modern' ? 'text-white hover:bg-indigo-500/20 hover:text-indigo-300 hover:drop-shadow-[0_0_3px_rgba(129,140,248,0.4)]' : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                                            }`}
                                    >
                                        <ArrowLeftRight className="w-4 h-4" />
                                        {t('header.switchRole')}
                                    </button>

                                    <div className={`border-t mt-1 ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/20' : 'border-gray-200'}`}></div>

                                    <button
                                        onClick={() => setIsLogoutModalOpen(true)}
                                        className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors font-bold ${theme === 'dark' ? 'text-red-500 hover:bg-red-900/20' : theme === 'modern' ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-50'
                                            }`}
                                    >
                                        <LogOut className="w-4 h-4" />
                                        {t('header.logout')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className={`lg:hidden p-1.5 rounded-full transition-all active:scale-95 ${
                            theme === 'dark' ? 'bg-gray-800' : theme === 'modern' ? 'bg-indigo-500/20' : 'bg-gray-100'
                        }`}
                    >
                        <UserCircle className={`w-6 h-6 ${theme === 'modern' ? 'text-indigo-400' : 'text-red-500'}`} />
                    </button>
                </div>
            </header>

            <main className="pt-24 lg:pl-72 min-h-screen p-4 sm:p-6 w-full overflow-hidden">
                <div className={`w-full max-w-7xl rounded-xl border shadow-sm h-fit ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : theme === 'modern' ? 'bg-[#15102B]/80 border-indigo-500/30 backdrop-blur-xl' : 'bg-white border-gray-200'}`}>
                    {loading ? (
                        <div className="p-12 text-center">
                            <Loader2 className="w-10 h-10 animate-spin mx-auto text-red-600 mb-4" />
                            <p>Loading data...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto pb-10 sm:pb-20 custom-scrollbar w-full">
                            {activeTab === 'users' && (
                                <table className="w-full min-w-[900px] text-left text-sm">
                                    <thead className={`border-b ${theme === 'dark' ? 'bg-gray-950 border-gray-800' : theme === 'modern' ? 'bg-[#0E0A20]' : 'bg-gray-50'}`}>
                                        <tr>
                                            <th className="px-6 py-4 font-bold whitespace-nowrap">Email</th>
                                            <th className="px-6 py-4 font-bold whitespace-nowrap">{t('Full Name')}</th>
                                            <th className="px-6 py-4 font-bold whitespace-nowrap">{t('Roles')}</th>
                                            <th className="px-6 py-4 font-bold whitespace-nowrap">{t('Status')}</th>
                                            <th className="px-6 py-4 font-bold whitespace-nowrap text-right pr-8">{t('Actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 divide-opacity-20">
                                        {users.map(u => (
                                            <tr key={u.userId} className={`hover:bg-black/5 transaction-colors`}>
                                                <td className="px-6 py-4 break-all max-w-[200px]">{u.userEmail}</td>
                                                <td className="px-6 py-4 break-words max-w-[150px]">{u.userName || u.fullName || 'N/A'}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1 min-w-[120px]">
                                                        {(u.userRoles || '').split(',').map((role, idx) => (
                                                            <span key={idx} className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${role.trim() === 'Admin' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                                                                role.trim() === 'TheaterManager' ? 'bg-pink-500/10 text-pink-500 border-pink-500/30' :
                                                                    role.trim() === 'Customer' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' :
                                                                        'bg-gray-500/10 text-gray-400 border-gray-500/30'
                                                                }`}>
                                                                {role.trim()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {u.accountStatus === 1 && <span className="px-2 py-1 rounded text-[10px] bg-green-500/20 text-green-500 font-bold border border-green-500/30 whitespace-nowrap"><CheckCircle className="inline w-3 h-3 mr-1" /> Active</span>}
                                                    {u.accountStatus !== 1 && <span className="px-2 py-1 rounded text-[10px] bg-red-500/20 text-red-500 font-bold border border-red-500/30 whitespace-nowrap"><XCircle className="inline w-3 h-3 mr-1" /> Locked ({u.accountStatus})</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2 pr-4">
                                                        {u.accountStatus === 1 ? (
                                                            u.userId !== user?.userId && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleUpdateUserStatus(u.userId, 2); }}
                                                                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${theme === 'modern' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'}`}
                                                                >
                                                                    {t('Block')}
                                                                </button>
                                                            )
                                                        ) : (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleUpdateUserStatus(u.userId, 1); }}
                                                                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${theme === 'modern' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'}`}
                                                            >
                                                                {t('Activate')}
                                                            </button>
                                                        )}

                                                        <div className="relative action-menu-container">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveActionMenu(activeActionMenu === u.userId ? null : u.userId);
                                                                }}
                                                                className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${theme === 'modern'
                                                                    ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30'
                                                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                                                                    }`}
                                                            >
                                                                <UserCog className="w-3.5 h-3.5" />
                                                                Manage
                                                                <ChevronDown className={`w-3 h-3 transition-transform ${activeActionMenu === u.userId ? 'rotate-180' : ''}`} />
                                                            </button>

                                                            {activeActionMenu === u.userId && (
                                                                <div
                                                                    className={`absolute right-0 top-full mt-1 w-40 rounded-xl shadow-2xl z-[100] border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : theme === 'modern' ? 'bg-[#1e1a3a] border-indigo-500/40 shadow-indigo-500/20' : 'bg-white border-gray-200'
                                                                        }`}
                                                                    onMouseDown={(e) => e.stopPropagation()}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <div className="py-1">
                                                                        <button
                                                                            onClick={() => { handleUpdateUserRole(u.userId, u.userEmail, u.userRoles); setActiveActionMenu(null); }}
                                                                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-[10px] font-semibold transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : theme === 'modern' ? 'text-white hover:bg-indigo-500/20 hover:text-indigo-300' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                                                                }`}
                                                                        >
                                                                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                                                                            {t('Edit Roles')}
                                                                        </button>


                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {activeTab === 'jobs' && (
                                <>
                                    {/* Jobs Control Bar */}
                                    <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-4 ${theme === 'dark' ? 'bg-gray-950/50 border-gray-800' : theme === 'modern' ? 'bg-[#0E0A20]/40 border-indigo-500/20' : 'bg-gray-50'}`}>
                                        <div className="flex items-center gap-2">
                                            <Filter className="w-4 h-4 text-indigo-400" />
                                            <span className="text-xs font-bold uppercase tracking-wider opacity-60">Category:</span>
                                            <div className="flex bg-black/20 p-1 rounded-lg border border-white/5">
                                                {['All', 'Movies', 'Showtimes', 'Schedules'].map((cat) => (
                                                    <button
                                                        key={cat}
                                                        onClick={() => setJobCategoryFilter(cat)}
                                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${jobCategoryFilter === cat
                                                            ? (theme === 'modern' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-red-600 text-white')
                                                            : 'text-gray-400 hover:text-white'
                                                            }`}
                                                    >
                                                        {cat === 'All' ? 'Tất cả' : cat}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <ArrowUpDown className="w-4 h-4 text-indigo-400" />
                                            <span className="text-xs font-bold uppercase tracking-wider opacity-60">Sort:</span>
                                            <button
                                                onClick={() => setJobSortOrder(jobSortOrder === 'asc' ? 'desc' : 'asc')}
                                                className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-lg border transition-all ${theme === 'modern' ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20' : 'border-gray-700 bg-gray-800 text-gray-300'}`}
                                            >
                                                {jobSortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5" /> : <SortDesc className="w-3.5 h-3.5" />}
                                                {jobSortOrder === 'asc' ? 'Cũ nhất' : 'Mới nhất'}
                                            </button>
                                        </div>
                                    </div>
                                    <table className="w-full min-w-[800px] text-left text-sm">
                                        <thead className={`border-b ${theme === 'dark' ? 'bg-gray-950 border-gray-800' : theme === 'modern' ? 'bg-[#0E0A20]' : 'bg-gray-50'}`}>
                                            <tr>
                                                <th className="px-4 py-4 font-bold whitespace-nowrap">Target & Category</th>
                                                <th className="px-4 py-4 font-bold whitespace-nowrap">Start Schedule</th>
                                                <th className="px-4 py-4 font-bold whitespace-nowrap">End Schedule</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 divide-opacity-20">
                                            {[...jobs]
                                                .filter(job => jobCategoryFilter === 'All' || job.jobCategory === jobCategoryFilter)
                                                .sort((a, b) => {
                                                    const idA = a.targetId || '';
                                                    const idB = b.targetId || '';
                                                    return jobSortOrder === 'asc' ? idA.localeCompare(idB) : idB.localeCompare(idA);
                                                })
                                                .map((group, idx) => (
                                                    <tr key={group.targetId + idx} className={`hover:bg-black/5 transaction-colors`}>
                                                        {/* Target Info */}
                                                        <td className="px-4 py-4">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-xs font-mono opacity-60 truncate max-w-[150px]" title={group.targetId}>{group.targetId}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`w-2 h-2 rounded-full ${group.jobCategory === 'Schedules' ? 'bg-blue-500' : group.jobCategory === 'Movies' ? 'bg-cyan-500' : 'bg-purple-500'}`}></span>
                                                                    <span className="text-xs font-bold">{group.jobCategory}</span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Start Job Column */}
                                                        <td className="px-4 py-4">
                                                            {group.startScheduleJob ? (
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span
                                                                            title={group.startScheduleJob.failedReason}
                                                                            className={`text-[9px] px-2 py-0.5 rounded-full border ${group.startScheduleJob.scheduleJobStatus === 'Failed'
                                                                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                                                : group.startScheduleJob.scheduleJobStatus === 'Pending'
                                                                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                                                    : 'bg-green-500/10 text-green-400 border-green-500/20'
                                                                                }`}
                                                                        >
                                                                            {group.startScheduleJob.scheduleJobStatus}
                                                                        </span>
                                                                        <span className="text-[10px] font-mono opacity-40">#{group.startScheduleJob.jobId}</span>
                                                                    </div>
                                                                    <span className="text-[10px] opacity-60 italic">{formatDate(group.startScheduleJob.jobStartedAt)}</span>
                                                                    {group.startScheduleJob.failedReason && (
                                                                        <span className="text-[9px] text-red-400/60 truncate max-w-[150px]">{group.startScheduleJob.failedReason}</span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] opacity-20">N/A</span>
                                                            )}
                                                        </td>

                                                        {/* End Job Column */}
                                                        <td className="px-4 py-4">
                                                            {group.endScheduleJob ? (
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span
                                                                            title={group.endScheduleJob.failedReason}
                                                                            className={`text-[9px] px-2 py-0.5 rounded-full border ${group.endScheduleJob.scheduleJobStatus === 'Failed'
                                                                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                                                : group.endScheduleJob.scheduleJobStatus === 'Pending'
                                                                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                                                    : 'bg-green-500/10 text-green-400 border-green-500/20'
                                                                                }`}
                                                                        >
                                                                            {group.endScheduleJob.scheduleJobStatus}
                                                                        </span>
                                                                        <span className="text-[10px] font-mono opacity-40">#{group.endScheduleJob.jobId}</span>
                                                                    </div>
                                                                    <span className="text-[10px] opacity-60 italic">{formatDate(group.endScheduleJob.jobStartedAt)}</span>
                                                                    {group.endScheduleJob.failedReason && (
                                                                        <span className="text-[9px] text-red-400/60 truncate max-w-[150px]">{group.endScheduleJob.failedReason}</span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] opacity-20">N/A</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </>
                            )}

                            {activeTab === 'transfer' && (
                                <TransferRightsView />
                            )}
                        </div>
                    )}
                    {!loading && ((activeTab === 'users' && users.length === 0) || (activeTab === 'jobs' && jobs.length === 0)) && (
                        <div className="p-12 text-center opacity-50">
                            No data available.
                        </div>
                    )}
                </div>
            </main>

            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={handleLogoutConfirm}
                loading={logoutLoading}
                error={logoutError}
            />

            <RoleUpdateModal
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                userId={selectedUserId}
                currentUserEmail={selectedUserEmail}
                currentUserRoles={selectedUserRoles}
                onSuccess={() => handleRoleUpdateSuccess(selectedUserId)}
            />

        </div>
    );
};

export default AdminPage;
