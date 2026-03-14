import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Settings,
    LayoutDashboard,
    LogOut,
    ChevronDown,
    UserCircle,
    Sun,
    Moon,
    Sparkles,
    Clapperboard,
    Loader2,
    Clock,
    CheckCircle,
    XCircle,
    UserCog,
    ShieldCheck,
    Filter,
    ArrowUpDown,
    SortAsc,
    SortDesc
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { adminApi } from '../../api/adminApi';
import { authApi } from '../../api/authApi';
import type { AdminUserDto, ScheduleJobDto } from '../../types/admin.types';
import toast from 'react-hot-toast';
import LogoutModal from '../../components/LogoutModal';
import RoleUpdateModal from '../../components/RoleUpdateModal';
import CinemaAssignModal from '../../components/CinemaAssignModal';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

// =============================================
// SIDEBAR COMPONENT
// =============================================
interface SidebarProps {
    activeTab: 'users' | 'jobs';
    onTabChange: (tab: 'users' | 'jobs') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const menuItems = [
        { id: 'users', label: t('User Management'), icon: Users },
        { id: 'jobs', label: t('Background Jobs'), icon: Clock },
    ] as const;

    return (
        <aside className={`fixed top-0 left-0 h-full w-64 z-50 border-r transition-transform duration-300 ${theme === 'dark'
            ? 'bg-gray-950 border-gray-800'
            : theme === 'modern'
                ? 'bg-[#0E0A20] border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                : 'bg-white border-gray-200'
            }`}>
            {/* Logo */}
            <div className={`h-16 flex items-center px-6 border-b ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/30 shadow-sm shadow-indigo-500/10' : 'border-gray-200'
                }`}>
                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => navigate('/admin')}
                >
                    <Clapperboard className={`w-7 h-7 ${theme === 'modern' ? 'text-cyan-400' : 'text-red-600'}`} />
                    <span className={`text-xl font-black tracking-wider ${theme === 'modern'
                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-300 to-rose-300 drop-shadow-sm'
                        : 'text-red-600'
                        }`}>
                        CINEMA<span className={theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}>PRO</span>
                    </span>
                </div>
            </div>

            {/* Role badge */}
            <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/30 shadow-sm shadow-indigo-500/10' : 'border-gray-200'
                }`}>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider ${theme === 'modern'
                    ? 'bg-gradient-to-r from-[#1E293B] to-[#0F172A] text-cyan-400 border border-slate-700'
                    : 'bg-red-600/10 text-red-500'
                    }`}>
                    <LayoutDashboard className="w-4 h-4" />
                    {t('roles.admin')}
                </div>
            </div>

            {/* Menu */}
            <nav className="p-4 space-y-1">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === item.id
                            ? theme === 'modern'
                                ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-500/50 shadow-[inset_0_0_20px_rgba(6,182,212,0.1),0_0_15px_rgba(6,182,212,0.2)]'
                                : 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                            : theme === 'dark'
                                ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                : theme === 'modern'
                                    ? 'text-white font-medium hover:bg-[#15102B]/60 hover:text-white'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                    >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                    </button>
                ))}
            </nav>
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

    const [activeTab, setActiveTab] = useState<'users' | 'jobs'>('users');
    const [users, setUsers] = useState<AdminUserDto[]>([]);
    const [jobs, setJobs] = useState<ScheduleJobDto[]>([]);
    const [loading, setLoading] = useState(true);

    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [logoutError, setLogoutError] = useState<string | null>(null);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
    const themeDropdownRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [user, setUser] = useState<{ username: string; roles?: string[]; userId?: string } | null>(null);

    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [selectedUserEmail, setSelectedUserEmail] = useState<string>('');
    const [selectedUserRoles, setSelectedUserRoles] = useState<string>('');

    const [isCinemaModalOpen, setIsCinemaModalOpen] = useState(false);
    const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);

    // Background Jobs Filter & Sort
    const [jobTypeFilter, setJobTypeFilter] = useState<'All' | 'StartSchedule' | 'EndSchedule'>('All');
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
        setLoading(true);
        try {
            if (activeTab === 'users') {
                const res = await adminApi.getUsers();
                setUsers(res.data || []);
            } else {
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

    const handleAssignTheaterManager = (userId: string, email: string) => {
        setSelectedUserId(userId);
        setSelectedUserEmail(email);
        setIsCinemaModalOpen(true);
    };

    const handleLogoutConfirm = async () => {
        setLogoutLoading(true);
        try {
            await authApi.logout();
            localStorage.removeItem('user_info');
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
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* HEADER */}
            <header className={`fixed top-0 left-0 right-0 lg:left-64 z-50 backdrop-blur-md border-b h-16 flex items-center justify-between px-6 shadow-lg transition-colors duration-300 ${theme === 'dark'
                ? 'bg-black/80 border-gray-800'
                : theme === 'modern'
                    ? 'bg-gradient-to-r from-[#0E0A20]/90 shadow-2xl border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                    : 'bg-white/80 border-gray-200'
                }`}>
                <div
                    className="hidden lg:flex items-center gap-3 cursor-pointer"
                    onClick={() => navigate('/home')}
                >
                    <div className={`text-2xl font-black tracking-widest uppercase ${theme === 'modern'
                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-300 to-rose-300 drop-shadow-sm'
                        : 'text-red-600'
                        }`}>
                        CINEMA<span className={theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}>PRO</span>
                    </div>
                    <span className={`text-xs border-l pl-3 ${theme === 'dark'
                        ? 'text-gray-400 border-gray-700'
                        : theme === 'modern'
                            ? 'text-white font-medium border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                            : 'text-gray-600 border-gray-300'
                        }`}>
                        {t('User Management')}
                    </span>
                </div>

                <div className="lg:hidden flex-1" />

                <div className="flex items-center gap-3">
                    <LanguageSwitcher />
                    <div className="relative" ref={themeDropdownRef}>
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

                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`flex items-center gap-3 p-2 rounded-lg transition-colors outline-none focus:ring-2 ${theme === 'dark' ? 'hover:bg-gray-800 focus:ring-red-600/50' : theme === 'modern' ? 'hover:bg-indigo-500/10 hover:shadow-[0_0_8px_rgba(99,102,241,0.15)] focus:ring-indigo-500/50' : 'hover:bg-gray-100 focus:ring-red-600/50'
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${theme === 'modern' ? 'bg-gradient-to-br from-indigo-600 to-purple-700 opacity-90 shadow-indigo-500/20' : 'bg-gradient-to-br from-red-600 to-red-800'}`}>
                                <UserCircle className="w-5 h-5 text-white" />
                            </div>
                            <span className={`hidden sm:block font-bold text-sm ${theme === 'dark' ? 'text-gray-200' : theme === 'modern' ? 'text-white' : 'text-gray-700'}`}>
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

                                    <button className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-indigo-400' : theme === 'modern' ? 'text-white hover:bg-indigo-500/20 hover:text-indigo-300 hover:drop-shadow-[0_0_3px_rgba(129,140,248,0.4)]' : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-400'}`}>
                                        <UserCircle className="w-4 h-4" />{t('Account Information')}
                                    </button>

                                    <button className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-indigo-400' : theme === 'modern' ? 'text-white hover:bg-indigo-500/20 hover:text-indigo-300 hover:drop-shadow-[0_0_3px_rgba(129,140,248,0.4)]' : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-400'}`}>
                                        <Settings className="w-4 h-4" />{t('Change Password')}
                                    </button>

                                    <button
                                        onClick={() => navigate('/role-selection')}
                                        className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-blue-500' : theme === 'modern' ? 'text-white hover:bg-indigo-500/20 hover:text-indigo-300 hover:drop-shadow-[0_0_3px_rgba(129,140,248,0.4)]' : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                                            }`}
                                    >
                                        <Users className="w-4 h-4" />
                                        {t('Switch Role')}
                                    </button>

                                    <div className={`border-t mt-1 ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/20' : 'border-gray-200'}`}></div>

                                    <button
                                        onClick={() => setIsLogoutModalOpen(true)}
                                        className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors font-bold ${theme === 'dark' ? 'text-red-500 hover:bg-red-900/20 hover:drop-shadow-[0_0_4px_rgba(239,68,68,0.4)]' : theme === 'modern' ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:drop-shadow-[0_0_4px_rgba(248,113,113,0.4)]' : 'text-red-600 hover:bg-red-50'
                                            }`}
                                    >
                                        <LogOut className="w-4 h-4" />
                                        {t('Logout')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="pt-24 lg:pl-64 min-h-screen p-6 flex justify-center">
                <div className={`w-full max-w-7xl rounded-xl border shadow-sm h-fit ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : theme === 'modern' ? 'bg-[#15102B]/80 border-indigo-500/30 backdrop-blur-xl' : 'bg-white border-gray-200'}`}>
                    {loading ? (
                        <div className="p-12 text-center">
                            <Loader2 className="w-10 h-10 animate-spin mx-auto text-red-600 mb-4" />
                            <p>Loading data...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto pb-20">
                            {activeTab === 'users' && (
                                <table className="w-full text-left text-sm">
                                    <thead className={`border-b ${theme === 'dark' ? 'bg-gray-950 border-gray-800' : theme === 'modern' ? 'bg-[#0E0A20]' : 'bg-gray-50'}`}>
                                        <tr>
                                            <th className="px-6 py-4 font-bold">Email</th>
                                            <th className="px-6 py-4 font-bold">{t('Full Name')}</th>
                                            <th className="px-6 py-4 font-bold">{t('Roles')}</th>
                                            <th className="px-6 py-4 font-bold">{t('Status')}</th>
                                            <th className="px-6 py-4 font-bold text-right pr-8">{t('Actions')}</th>
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

                                                                        {(u.userRoles || '').includes('TheaterManager') && (
                                                                            <button
                                                                                onClick={() => { handleAssignTheaterManager(u.userId, u.userEmail); setActiveActionMenu(null); }}
                                                                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-[10px] font-semibold transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : theme === 'modern' ? 'text-white hover:bg-pink-500/20 hover:text-pink-300' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                                                                    }`}
                                                                            >
                                                                                <Clapperboard className="w-3.5 h-3.5 text-pink-400" />
                                                                                {t('Assign Cinema')}
                                                                            </button>
                                                                        )}
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
                                            <span className="text-xs font-bold uppercase tracking-wider opacity-60">Filter Status:</span>
                                            <div className="flex bg-black/20 p-1 rounded-lg border border-white/5">
                                                {(['All', 'StartSchedule', 'EndSchedule'] as const).map((type) => (
                                                    <button
                                                        key={type}
                                                        onClick={() => setJobTypeFilter(type)}
                                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${jobTypeFilter === type 
                                                            ? (theme === 'modern' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-red-600 text-white')
                                                            : 'text-gray-400 hover:text-white'
                                                        }`}
                                                    >
                                                        {type === 'All' ? 'Tất cả' : type === 'StartSchedule' ? 'Start' : 'End'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <ArrowUpDown className="w-4 h-4 text-indigo-400" />
                                            <span className="text-xs font-bold uppercase tracking-wider opacity-60">Sort By ID:</span>
                                            <button
                                                onClick={() => setJobSortOrder(jobSortOrder === 'asc' ? 'desc' : 'asc')}
                                                className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-lg border transition-all ${theme === 'modern' ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20' : 'border-gray-700 bg-gray-800 text-gray-300'}`}
                                            >
                                                {jobSortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5" /> : <SortDesc className="w-3.5 h-3.5" />}
                                                {jobSortOrder === 'asc' ? 'Cũ nhất' : 'Mới nhất'}
                                            </button>
                                        </div>
                                    </div>

                                    <table className="w-full text-left text-sm">
                                        <thead className={`border-b ${theme === 'dark' ? 'bg-gray-950 border-gray-800' : theme === 'modern' ? 'bg-[#0E0A20]' : 'bg-gray-50'}`}>
                                            <tr>
                                                <th className="px-4 py-4 font-bold">Job ID</th>
                                                <th className="px-4 py-4 font-bold">{t('Job Type')}</th>
                                                <th className="px-4 py-4 font-bold">{t('Actions')}</th>
                                                <th className="px-4 py-4 font-bold">{t('Started Time')}</th>
                                                <th className="px-4 py-4 font-bold">{t('Ended Time')}</th>
                                                <th className="px-4 py-4 font-bold">{t('Job Status')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 divide-opacity-20">
                                            {[...jobs]
                                                .filter(job => jobTypeFilter === 'All' || job.scheduleJobStatusType === jobTypeFilter)
                                                .sort((a, b) => {
                                                    const idA = parseInt(a.jobId) || 0;
                                                    const idB = parseInt(b.jobId) || 0;
                                                    return jobSortOrder === 'asc' ? idA - idB : idB - idA;
                                                })
                                                .map((job, idx) => (
                                                    <tr key={job.jobId || idx} className={`hover:bg-black/5 transaction-colors`}>
                                                        <td className="px-4 py-4 text-xs font-mono opacity-60">#{job.jobId}</td>
                                                        <td className="px-4 py-4 font-bold">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-2 h-2 rounded-full ${job.scheduleJobCategory === 'Schedules' ? 'bg-blue-500' : job.scheduleJobCategory === 'Movies' ? 'bg-cyan-500' : 'bg-purple-500'}`}></span>
                                                                {job.scheduleJobCategory}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-xs font-medium">
                                                            <span className={`px-2 py-0.5 rounded-full border text-[9px] ${job.scheduleJobStatusType === 'StartSchedule' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                                                {job.scheduleJobStatusType}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-xs">{formatDate(job.jobStartedAt)}</td>
                                                        <td className="px-4 py-4 text-xs">{formatDate(job.jobEndedAt)}</td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex flex-col gap-1">
                                                                <span className={`px-2 py-1 rounded text-[10px] border font-bold w-fit ${job.scheduleJobStatus === 'Completed' ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                                                                    job.scheduleJobStatus === 'Pending' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' :
                                                                        'bg-red-500/20 text-red-500 border-red-500/30'
                                                                    }`}>
                                                                    {job.scheduleJobStatus}
                                                                </span>
                                                                {job.failedReason && (
                                                                    <span className="text-[10px] text-red-400 font-medium truncate max-w-[150px]" title={job.failedReason}>
                                                                        {job.failedReason}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </>
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
                onSuccess={fetchData}
            />

            <CinemaAssignModal
                isOpen={isCinemaModalOpen}
                onClose={() => setIsCinemaModalOpen(false)}
                userId={selectedUserId}
                currentUserEmail={selectedUserEmail}
                onSuccess={fetchData}
            />
        </div>
    );
};

export default AdminPage;
