import React from 'react';
import { 
    LayoutDashboard, 
    Users, 
    CalendarDays, 
    XCircle, 
    UserCircle, 
    ArrowLeftRight,
    LogOut,
    Sun,
    Moon,
    Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../../api/authApi';
import Cookies from 'js-cookie';
import LanguageSwitcher from '../../../components/LanguageSwitcher';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    isOpen: boolean;
    onToggle: () => void;
    managedCinemaNames?: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isOpen, onToggle }) => {
    const { theme, setTheme } = useTheme();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const menuItems = [
        { id: 'dashboard', label: t('Dashboard'), icon: LayoutDashboard },
        { id: 'employees', label: t('Employee Management'), icon: Users },
        { id: 'schedule', label: t('Schedule'), icon: CalendarDays },
    ];

    const storedUserStr = localStorage.getItem('user_info');
    const user = storedUserStr ? JSON.parse(storedUserStr) : null;

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch (e) {}
        localStorage.removeItem('user_info');
        Cookies.remove('X-Access-Token');
        navigate('/login');
    };

    return (
        <>
            {/* Overlay */}
            <div 
              className={`fixed inset-0 z-[100] lg:hidden transition-all duration-500 ease-in-out ${
                isOpen ? 'visible opacity-100 pointer-events-auto' : 'invisible opacity-0 pointer-events-none'
              }`}
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onToggle} />
            </div>

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 h-full w-72 z-[110] border-r transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) transform ${
              isOpen ? 'translate-x-0 scale-100' : '-translate-x-full lg:translate-x-0'
            } ${
              theme === 'dark' ? 'bg-black border-gray-800' : 
              theme === 'modern' ? 'bg-[#030712] border-indigo-500/20 shadow-[10px_0_30px_rgba(0,0,0,0.5)]' : 
              'bg-white border-gray-100'
            } flex flex-col`}>
                {/* Sidebar Header */}
                <div className={`p-6 flex items-center justify-between border-b ${
                    theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/20' : 'border-gray-100'
                }`}>
                    <div>
                        <div 
                            className={`text-xl font-black tracking-widest cursor-pointer transition-all active:scale-95 ${theme === 'modern' ? 'text-white' : 'text-red-600'}`}
                            onClick={() => navigate('/home')}
                        >
                            CINEMA<span className={theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}>PRO</span>
                        </div>
                        <p className={`text-[10px] uppercase font-black tracking-widest mt-1 ${theme === 'modern' ? 'text-indigo-400' : 'text-gray-500'}`}>
                            {t('Theater Manager')}
                        </p>
                    </div>
                    <button 
                      onClick={onToggle}
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
                            <button onClick={() => { navigate('/account'); onToggle(); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all active:scale-95 ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : theme === 'modern' ? 'text-white hover:bg-indigo-500/10' : 'text-gray-700 hover:bg-gray-100'}`}>
                                <UserCircle className="w-5 h-5 text-indigo-400" />
                                <span className="font-bold">{t('Thông Tin Tài Khoản')}</span>
                            </button>
                            {user.roles && user.roles.some((r: string) => r !== 'User' && r !== 'Cashier') && (
                                <button onClick={() => { navigate('/role-selection'); onToggle(); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all active:scale-95 text-green-500 ${theme === 'dark' ? 'hover:bg-gray-800/50' : theme === 'modern' ? 'hover:bg-green-500/10' : 'hover:bg-green-50'}`}>
                                    <LayoutDashboard className="w-5 h-5" />
                                    <span className="font-bold">Management Hub</span>
                                </button>
                            )}
                            {user.roles && user.roles.length > 1 && (
                                <button onClick={() => { navigate('/role-selection'); onToggle(); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all active:scale-95 text-blue-500 border-t ${theme === 'dark' ? 'border-gray-800 hover:bg-gray-800/50' : theme === 'modern' ? 'border-indigo-500/20 hover:bg-blue-500/10' : 'border-gray-100 hover:bg-blue-50'}`}>
                                    <ArrowLeftRight className="w-5 h-5" />
                                    <span className="font-bold">{t('Đổi Vai Trò')}</span>
                                </button>
                            )}
                            <button onClick={() => { handleLogout(); onToggle(); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all active:scale-95 text-red-500 font-bold ${theme === 'dark' ? 'hover:bg-red-500/10' : theme === 'modern' ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}>
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
                            {/* Home button */}
                            <button
                                onClick={() => navigate('/home')}
                                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all active:scale-95 ${
                                    theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : 
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
                                        if (window.innerWidth < 1024) onToggle();
                                    }}
                                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all active:scale-95 ${
                                        activeTab === item.id
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

                    {/* System Section (Desktop only) */}
                    <div className="hidden lg:block space-y-4">
                        <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-indigo-400' : 'text-gray-500'}`}>
                            {t('System')}
                        </h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => navigate('/account')}
                                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all active:scale-95 ${
                                    theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : 
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

                {/* Sidebar Footer */}
                <div className={`hidden lg:block p-6 border-t ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/20' : 'border-gray-100'}`}>
                    <button
                        onClick={() => navigate('/role-selection')}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all active:scale-95 ${
                            theme === 'dark' ? 'text-blue-400 hover:bg-blue-500/10' : 
                            theme === 'modern' ? 'text-cyan-400 hover:bg-cyan-500/10' : 
                            'text-blue-600 hover:bg-blue-50'
                        }`}
                    >
                        <ArrowLeftRight className="w-5 h-5" />
                        <span className="font-bold">{t('Switch Role')}</span>
                    </button>
                    <p className={`text-[10px] text-center mt-4 uppercase font-black tracking-widest ${theme === 'dark' ? 'text-gray-600' : theme === 'modern' ? 'text-indigo-500/40' : 'text-gray-400'}`}>
                        © 2024 CinemaPro
                    </p>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
