import React from 'react';
import { LayoutDashboard, Users, CalendarDays, Menu, X, Languages } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    isOpen: boolean;
    onToggle: () => void;
    managedCinemaNames?: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isOpen, onToggle }) => {
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const menuItems = [
        { id: 'dashboard', label: t('sidebar.dashboard'), icon: LayoutDashboard },
        { id: 'employees', label: t('sidebar.employees', 'Employee Management'), icon: Users },
        { id: 'schedule', label: t('sidebar.schedule'), icon: CalendarDays },
    ];

    return (
        <>
            {/* Mobile Menu Button - Chỉ hiện khi Sidebar đóng */}
            {!isOpen && (
                <button
                    onClick={onToggle}
                    className={`lg:hidden fixed top-3 left-4 z-[60] p-2 border rounded-lg transition-colors ${theme === 'dark'
                        ? 'bg-gray-900 border-gray-700 text-white hover:bg-gray-800'
                        : theme === 'modern'
                            ? 'bg-[#1e293b]/30 backdrop-blur-xl border-indigo-500/20 text-white hover:bg-indigo-500/10'
                            : 'bg-white border-gray-300 text-gray-700 dark:text-gray-300 modern:text-gray-200 hover:bg-gray-50'
                        }`}
                    aria-label="Open menu"
                >
                    <Menu className="w-6 h-6" />
                </button>
            )}

            {/* Overlay cho mobile */}
            {isOpen && (
                <div
                    className={`lg:hidden fixed inset-0 z-50 ${theme === 'dark'
                        ? 'bg-black/50'
                        : theme === 'modern'
                            ? 'bg-slate-950/80'
                            : 'bg-black/30'
                        }`}
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full border-r z-[60] transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0 w-64 ${theme === 'dark'
                        ? 'bg-gray-900 border-gray-800'
                        : theme === 'modern'
                            ? 'bg-[#0f172a]/40 backdrop-blur-2xl border-indigo-500/20 shadow-sm'
                            : 'bg-white border-gray-200'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo & Close */}
                    <div className={`p-6 border-b flex items-center justify-between ${theme === 'dark'
                        ? 'border-gray-800'
                        : theme === 'modern'
                            ? 'border-indigo-500/20 shadow-sm'
                            : 'border-gray-200'
                        }`}>
                        <div>
                            <div className={`text-xl font-black tracking-widest uppercase ${theme === 'modern'
                                ? 'text-slate-100 font-semibold tracking-wide'
                                : 'text-red-600'
                                }`}>
                                CINEMA<span className={theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white modern:text-white'}>PRO</span>
                            </div>
                            <p className={`text-xs mt-1 ${theme === 'dark'
                                ? 'text-gray-400'
                                : theme === 'modern'
                                    ? 'text-white font-medium'
                                    : 'text-gray-600'
                                }`}>{t('sidebar.theaterManager')}</p>
                        </div>
                        <button
                            onClick={onToggle}
                            className={`lg:hidden p-2 -mr-2 rounded-lg transition-colors ${theme === 'dark'
                                ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                : theme === 'modern'
                                    ? 'text-white font-medium hover:bg-[#1F173D]/60 hover:text-white'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-white modern:text-white'
                                }`}
                            aria-label="Close menu"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        onTabChange(item.id);
                                        if (window.innerWidth < 1024) {
                                            onToggle();
                                        }
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                        ? theme === 'modern'
                                            ? 'bg-cyan-900/20 text-white/90 border border-cyan-500/50 shadow-[inset_0_0_20px_rgba(6,182,212,0.1),0_0_15px_rgba(6,182,212,0.2)]'
                                            : 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                                        : theme === 'dark'
                                            ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                            : theme === 'modern'
                                                ? 'text-white font-medium hover:bg-[#0f172a]/30 backdrop-blur-xl hover:text-white'
                                                : 'text-gray-700 dark:text-gray-300 modern:text-gray-200 hover:bg-gray-100 hover:text-gray-900 dark:text-white modern:text-white'
                                        }`}
                                >
                                    <Icon className="w-5 h-5 shrink-0" />
                                    <span className="font-medium whitespace-nowrap truncate">{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className={`p-4 border-t ${theme === 'dark'
                        ? 'border-gray-800'
                        : theme === 'modern'
                            ? 'border-indigo-500/20 shadow-sm'
                            : 'border-gray-200'
                        }`}>
                        <div className="flex items-center justify-between mb-4">
                            <span className={`text-sm flex items-center gap-2 font-medium ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white font-medium' : 'text-gray-600'}`}>
                                <Languages className="w-4 h-4" />
                                {t('sidebar.language')}
                            </span>
                            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                                <button
                                    onClick={() => i18n.changeLanguage('vi')}
                                    className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${i18n.language === 'vi' ? 'bg-white dark:bg-gray-700 shadow-sm text-red-600' : 'text-gray-500'}`}
                                >
                                    VI
                                </button>
                                <button
                                    onClick={() => i18n.changeLanguage('en')}
                                    className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${i18n.language === 'en' ? 'bg-white dark:bg-gray-700 shadow-sm text-red-600' : 'text-gray-500'}`}
                                >
                                    EN
                                </button>
                            </div>
                        </div>
                        <p className={`text-xs text-center ${theme === 'dark'
                            ? 'text-gray-500'
                            : theme === 'modern'
                                ? 'text-white/60'
                                : 'text-gray-400'
                            }`}>
                            © 2024 CinemaPro
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
