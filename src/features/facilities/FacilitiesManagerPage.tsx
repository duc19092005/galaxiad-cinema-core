import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  AlertCircle,
  Loader2,
  Menu,
  UserCircle,
  ChevronDown,
  Sun,
  Moon,
  Sparkles,
  ArrowLeftRight,
} from 'lucide-react';
import { facilitiesApi, type Cinema } from '../../api/facilitiesApi';
import axios from 'axios';
import { authApi } from '../../api/authApi';
import type { ApiErrorResponse } from '../../types/auth.types';
import { useTheme } from '../../contexts/ThemeContext';
import { useCinema } from '../../contexts/CinemaContext';
import CinemaSelector from '../../components/CinemaSelector';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CinemaManagement from './components/CinemaManagement';
import SeatReport from './components/SeatReport';
import LogoutModal from '../../components/LogoutModal';

import LanguageSwitcher from '../../components/LanguageSwitcher';
import Cookies from 'js-cookie';

const FacilitiesManagerPage: React.FC = () => {
  const navigate = useNavigate();

  const { theme, setTheme } = useTheme();
  const { managedCinemas, activeCinemaId, loading: cinemaContextLoading } = useCinema();
  const [user, setUser] = useState<{ username: string; roles?: string[]; selectedRole?: string } | null>(null);

  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Sidebar state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const themeDropdownRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) setIsDropdownOpen(false);
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(target)) setIsThemeDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load user info và check quyền FacilitiesManager
  useEffect(() => {
    const storedUser = localStorage.getItem('user_info');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    try {
      const parsed = JSON.parse(storedUser) as { username: string; roles?: string[]; selectedRole?: string };
      const roles = parsed.roles || [];

      // Nếu không có quyền FacilitiesManager thì đá về chọn role
      if (!roles.includes('FacilitiesManager')) {
        navigate('/role-selection');
        return;
      }

      setUser(parsed);
      // Gọi API ngay khi load page
      fetchCinemas();
    } catch {
      navigate('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Gọi lại API khi chuyển sang tab cinemas nếu chưa có dữ liệu hoặc có lỗi
  useEffect(() => {
    if (activeTab === 'cinemas' && cinemas.length === 0 && !loading) {
      fetchCinemas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchCinemas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await facilitiesApi.getCinemaList();
      const cinemasData = res.data || [];
      setCinemas(cinemasData);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as ApiErrorResponse;
        if (data.statusCode === 401) {
          localStorage.removeItem('user_info');
          Cookies.remove('X-Access-Token');
          navigate('/login');
          return;
        }
        setError(data.message || 'Cannot load cinemas list.');
      } else if (axios.isAxiosError(err) && err.request) {
        setError('Cannot connect to server. Please check your network connection.');
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-sm font-bold opacity-40 uppercase tracking-widest">Loading Cinema Context...</p>
        </div>
      );
    }

    if (managedCinemas.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-700">
          <div className="p-4 bg-red-600/10 rounded-full mb-6 border border-red-600/20 shadow-2xl shadow-red-600/10">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-xl font-black mb-2 uppercase tracking-tight">Access Restricted</h2>
          <p className={`max-w-md mx-auto text-sm ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white/60' : 'text-gray-600'}`}>
            Tài khoản của bạn chưa được chỉ định quản lý Rạp phim nào. Vui lòng liên hệ Admin
          </p>
        </div>
      );
    }

    if (!activeCinemaId) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-700">
          <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-4" />
          <p className="text-sm font-bold opacity-40 uppercase tracking-widest">Initializing Cinema Selection...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard cinemas={cinemas} loading={loading} />;
      case 'cinemas':
        return <CinemaManagement cinemas={cinemas} loading={loading} error={error} onRefresh={fetchCinemas} />;
      case 'seat-reports':
        return <SeatReport />;
      default:
        return <Dashboard cinemas={cinemas} loading={loading} />;
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
      <header className={`fixed top-0 left-0 right-0 lg:left-72 z-[100] h-20 border-b flex items-center justify-between px-6 transition-all duration-300 backdrop-blur-xl ${theme === 'dark'
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
            className={`flex-shrink-0 ml-4 text-xl sm:text-2xl font-black tracking-widest cursor-pointer transition-all hover:scale-105 active:scale-95 ${theme === 'modern' ? 'text-white' : 'text-red-600'}`}
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

            {/* Theme Switcher */}
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
                  {theme === 'dark' ? 'Dark Mode' : theme === 'modern' ? 'Modern View' : 'Light Mode'}
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
                        Select Theme
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
                        <div className="font-semibold">Light Mode</div>
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
                        <div className="font-semibold">Dark Mode</div>
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
                        <div className="font-semibold">Modern View</div>
                      </div>
                      {theme === 'modern' && <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500" />}
                    </button>
                  </div>
                </div>
              )}
            </div>


            <div className="h-8 w-[1px] bg-gray-500/20 mx-2" />

            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg transition-colors outline-none focus:ring-2 shrink-0 ${theme === 'dark' ? 'hover:bg-gray-800 focus:ring-red-600/50' : theme === 'modern' ? 'hover:bg-indigo-500/10 hover:shadow-[0_0_8px_rgba(99,102,241,0.15)] focus:ring-indigo-500/50' : 'hover:bg-gray-100 focus:ring-red-600/50'
                  }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg shrink-0 ${theme === 'modern' ? 'bg-gradient-to-br from-indigo-600 to-purple-700 opacity-90 shadow-indigo-500/20' : 'bg-gradient-to-br from-red-600 to-red-800'}`}>
                  <UserCircle className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className={`text-[10px] uppercase font-black tracking-widest leading-none mb-1 ${theme === 'dark' ? 'text-gray-500' : theme === 'modern' ? 'text-indigo-400' : 'text-gray-400'}`}>Facilities Manager</p>
                  <span className={`font-bold text-sm ${theme === 'dark' ? 'text-gray-200' : theme === 'modern' ? 'text-white' : 'text-gray-700'}`}>
                    {user?.username || 'Guest'}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white/60' : 'text-gray-600'}`} />
              </button>

              {isDropdownOpen && (
                <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${theme === 'dark' ? 'bg-gray-900 border border-gray-700' : theme === 'modern' ? 'bg-[#0f172a]/40 backdrop-blur-2xl border border-indigo-500/20' : 'bg-white border border-gray-200'
                  }`}>
                  <div className="py-2">
                    <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/20' : 'border-gray-200'}`}>
                      <p className={`text-xs uppercase font-bold ${theme === 'dark' ? 'text-gray-500' : theme === 'modern' ? 'text-indigo-400' : 'text-gray-400'}`}>SIGNED IN AS</p>
                      <p className={`text-sm font-bold truncate ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}`}>{user?.username}</p>
                    </div>

                    <button
                      onClick={() => { navigate('/account'); setIsDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-indigo-400' : theme === 'modern' ? 'text-white hover:bg-indigo-500/20 hover:text-indigo-300 hover:drop-shadow-[0_0_3px_rgba(129,140,248,0.4)]' : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-400'}`}
                    >
                      <UserCircle className="w-4 h-4" />Account Info
                    </button>

                    <button
                      onClick={() => navigate('/role-selection')}
                      className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-blue-500' : theme === 'modern' ? 'text-white hover:bg-indigo-500/20 hover:text-indigo-300 hover:drop-shadow-[0_0_3px_rgba(129,140,248,0.4)]' : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                        }`}
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                      Switch Role
                    </button>

                    <div className={`border-t mt-1 ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/20' : 'border-gray-200'}`}></div>

                    <button
                      onClick={handleLogoutClick}
                      className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors font-bold ${theme === 'dark' ? 'text-red-500 hover:bg-red-900/20' : theme === 'modern' ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-50'
                        }`}
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(true)}
            className={`lg:hidden p-1.5 rounded-full transition-all active:scale-95 ${theme === 'dark' ? 'bg-gray-800' : theme === 'modern' ? 'bg-indigo-500/20' : 'bg-gray-100'
              }`}
          >
            <UserCircle className={`w-6 h-6 ${theme === 'modern' ? 'text-indigo-400' : 'text-red-500'}`} />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="pt-24 lg:pl-72 min-h-screen">
        <div className="p-4 lg:p-10 mx-auto max-w-7xl w-full overflow-hidden">
          {/* Mobile Cinema Selector */}
          <div className="md:hidden mb-6">
            <CinemaSelector />
          </div>

          {/* Thông báo lỗi Logout */}
          {logoutError && (
            <div className={`mb-4 p-4 rounded-lg border flex items-center ${theme === 'dark'
              ? 'bg-red-900/40 border-red-500/50 text-red-100'
              : 'bg-red-50 border-red-200 text-red-800'
              }`}>
              <AlertCircle className="w-5 h-5 mr-3 shrink-0 text-red-500" />
              <span className="text-sm font-medium">{logoutError}</span>
            </div>
          )}

          {/* Error state */}
          {error && activeTab === 'dashboard' && (
            <div className={`mb-6 p-4 rounded-lg border flex items-center ${theme === 'dark'
              ? 'bg-red-900/40 border-red-500/50 text-red-100'
              : 'bg-red-50 border-red-200 text-red-800'
              }`}>
              <AlertCircle className="w-5 h-5 mr-3 shrink-0 text-red-500" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Render content based on active tab */}
          {renderContent()}
        </div>
      </main>

      {/* Logout Modal */}
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

export default FacilitiesManagerPage;
