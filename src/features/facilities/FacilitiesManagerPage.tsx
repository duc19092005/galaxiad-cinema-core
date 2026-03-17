import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  ChevronDown,
  LogOut,
  UserCircle,
  AlertCircle,
  Sun,
  Moon,
  Sparkles,
  ArrowLeftRight,
  Loader2
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
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<{ username: string; roles?: string[]; selectedRole?: string } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Sidebar state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      console.log('Tab cinemas active, fetching cinemas...');
      fetchCinemas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Đóng dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setIsThemeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCinemas = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching cinemas...');
      const res = await facilitiesApi.getCinemaList();
      console.log('Cinemas response:', res);
      const cinemasData = res.data || [];
      console.log('Cinemas data:', cinemasData);
      setCinemas(cinemasData);
    } catch (err) {
      console.error('Error fetching cinemas:', err);
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as ApiErrorResponse;
        console.error('Error response:', data);
        if (data.statusCode === 401) {
          // Token / cookie hết hạn → logout
          localStorage.removeItem('user_info');
          Cookies.remove('X-Access-Token');
          navigate('/login');
          return;
        }
        setError(data.message || 'Cannot load cinemas list.');
      } else if (axios.isAxiosError(err) && err.request) {
        console.error('No response received:', err.request);
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
        ? 'bg-gradient-to-br from-[#0D081D] via-[#050A14] to-[#12081C] text-white'
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
      <header className={`fixed top-0 left-0 right-0 lg:left-64 z-50 backdrop-blur-md border-b h-16 flex items-center justify-between px-6 shadow-lg transition-colors duration-300 ${theme === 'dark'
        ? 'bg-black/80 border-gray-800'
        : theme === 'modern'
          ? 'bg-gradient-to-r from-[#0E0A20]/90 shadow-2xl border-indigo-500/30 shadow-sm shadow-indigo-500/10'
          : 'bg-white/80 border-gray-200'
        }`}>
        {/* Logo bên trái - ẩn trên mobile vì có sidebar button */}
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
            Facilities Manager Dashboard
          </span>
        </div>

        {/* Spacer cho mobile */}
        <div className="lg:hidden flex-1" />

        {/* Theme Selector & User Menu */}
        <div className="flex items-center gap-3">
          <CinemaSelector />
          <LanguageSwitcher />
          {/* Theme Dropdown */}
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
                {theme === 'dark' ? 'Dark' : theme === 'modern' ? 'Modern' : 'Light'}
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
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-indigo-300' : 'text-gray-500'
                      }`}>
                      Demo - Choose your favorite color tone
                    </p>
                  </div>

                  {/* Light Mode */}
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
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-indigo-300/70' : 'text-gray-500'
                        }`}>
                        Light Interface
                      </div>
                    </div>
                    {theme === 'light' && (
                      <div className="w-2 h-2 rounded-full bg-red-600" />
                    )}
                  </button>

                  {/* Dark Mode */}
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
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-indigo-300/70' : 'text-gray-500'
                        }`}>
                        Dark Interface
                      </div>
                    </div>
                    {theme === 'dark' && (
                      <div className="w-2 h-2 rounded-full bg-red-600" />
                    )}
                  </button>

                  {/* Modern Mode */}
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
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-indigo-300/70' : 'text-gray-500'
                        }`}>
                        Modern Color Tone
                      </div>
                    </div>
                    {theme === 'modern' && (
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors outline-none focus:ring-2 ${theme === 'dark' ? 'hover:bg-gray-800 focus:ring-red-600/50' : theme === 'modern' ? 'hover:bg-indigo-500/10 hover:shadow-[0_0_8px_rgba(99,102,241,0.15)] focus:ring-indigo-500/50' : 'hover:bg-gray-100 focus:ring-red-600/50'
                }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${theme === 'modern' ? 'bg-gradient-to-br from-indigo-600 to-purple-700 opacity-90 shadow-indigo-500/20' : 'bg-gradient-to-br from-red-600 to-red-800'}`}>
                <User className="w-5 h-5 text-white" />
              </div>
              <span className={`hidden sm:block font-bold text-sm ${theme === 'dark' ? 'text-gray-200' : theme === 'modern' ? 'text-white' : 'text-gray-700'}`}>
                {user?.username || 'Guest'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white/60' : 'text-gray-600'}`} />
            </button>

            {isDropdownOpen && (
              <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${theme === 'dark' ? 'bg-gray-900 border border-gray-700' : theme === 'modern' ? 'bg-[#0f172a]/40 backdrop-blur-2xl border border-indigo-500/20' : 'bg-white border border-gray-200'
                }`}>
                <div className="py-2">
                  <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/20' : 'border-gray-200'}`}>
                    <p className={`text-xs uppercase font-bold ${theme === 'dark' ? 'text-gray-500' : theme === 'modern' ? 'text-indigo-400' : 'text-gray-400'}`}>SIGNED IN AS</p>
                    <p className={`text-sm font-bold truncate ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}`}>{user?.username}</p>
                    {user?.selectedRole && (
                      <p className={`mt-1 text-[11px] uppercase tracking-wide ${theme === 'modern' ? 'text-indigo-300' : 'text-red-400'}`}>
                        Role: {user.selectedRole}
                      </p>
                    )}
                  </div>

                  <button 
                    onClick={() => { navigate('/account'); setIsDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-indigo-400' : theme === 'modern' ? 'text-white hover:bg-indigo-500/20 hover:text-indigo-300 hover:drop-shadow-[0_0_3px_rgba(129,140,248,0.4)]' : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-400'}`}
                  >
                    <UserCircle className="w-4 h-4" />Account Information
                  </button>



                  {user?.roles && user.roles.length > 1 && (
                    <button
                      onClick={() => navigate('/role-selection')}
                      className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-blue-500' : theme === 'modern' ? 'text-white hover:bg-indigo-500/20 hover:text-indigo-300 hover:drop-shadow-[0_0_3px_rgba(129,140,248,0.4)]' : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                        }`}
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                      Switch Role
                    </button>
                  )}

                  <div className={`border-t mt-1 ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/20' : 'border-gray-200'}`}></div>

                  <button
                    onClick={handleLogoutClick}
                    className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors font-bold ${theme === 'dark' ? 'text-red-500 hover:bg-red-900/20 hover:drop-shadow-[0_0_4px_rgba(239,68,68,0.4)]' : theme === 'modern' ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:drop-shadow-[0_0_4px_rgba(248,113,113,0.4)]' : 'text-red-600 hover:bg-red-50'
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
      </header>

      {/* MAIN CONTENT */}
      <main className="pt-16 lg:pl-64 min-h-screen">
        <div className="p-4 lg:p-6 container mx-auto max-w-7xl">
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

          {/* Error state - chỉ hiển thị ở dashboard vì cinemas tab đã có error handling riêng */}
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
