import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ChevronDown, LogOut, AlertCircle, ArrowLeftRight, Loader2, Sun, Moon, Sparkles, LayoutDashboard, UserCircle, Menu, X } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { authApi } from '../../api/authApi';
import { publicApi } from '../../api/publicApi';
import type { ApiErrorResponse } from '../../types/auth.types';
import type { PublicMovieListItem } from '../../types/public.types';
import LogoutModal from '../../components/LogoutModal';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import AdvancedSearch from './components/AdvancedSearch';
import PublicCinemaSelector from './components/PublicCinemaSelector';
import { Play } from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const [user, setUser] = useState<{ username: string; roles?: string[]; selectedRole?: string } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Movies state
  const [nowShowing, setNowShowing] = useState<PublicMovieListItem[]>([]);
  const [comingSoon, setComingSoon] = useState<PublicMovieListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>('');

  const [isScrolled, setIsScrolled] = useState(false);
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Intersection Observer for reveal animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-reveal');
        }
      });
    }, { threshold: 0.1 });

    sectionsRef.current.forEach(section => {
      if (section) observer.observe(section);
    });

    const storedUser = localStorage.getItem('user_info');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchMovies();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, [navigate, selectedCinemaId]);

  const fetchMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      const [nowRes, comingRes] = await Promise.all([
        publicApi.getNowShowing({ cinemaId: selectedCinemaId || undefined, pageSize: 5 }),
        publicApi.getComingSoon({ cinemaId: selectedCinemaId || undefined, pageSize: 5 })
      ]);
      setNowShowing(nowRes.data.items || []);
      setComingSoon(comingRes.data.items || []);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as ApiErrorResponse;
        if (data.statusCode === 401) {
          localStorage.removeItem('user_info');
          Cookies.remove('X-Access-Token');
          navigate('/login');
          return;
        }
        setError(data.message || 'Cannot load movies list.');
      } else {
        setError('Cannot connect to server.');
      }
    } finally {
      setLoading(false);
    }
  };

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-black text-white' : theme === 'modern' ? 'bg-gradient-to-br from-[#0D081D] via-[#050A14] to-[#12081C] text-white' : 'bg-gray-50 text-gray-900'
      }`}>
      {/* Dynamic Background for Modern Theme - Controlled and small */}
      {theme === 'modern' && (
        <div className="absolute inset-x-0 top-0 h-screen overflow-hidden pointer-events-none z-0 flex justify-center items-center opacity-70">
          <div className="absolute top-[20%] left-[30%] w-[300px] h-[300px] bg-cyan-500/20 rounded-full mix-blend-screen filter blur-[90px] animate-blob"></div>
          <div className="absolute top-[30%] right-[30%] w-[250px] h-[250px] bg-fuchsia-600/20 rounded-full mix-blend-screen filter blur-[90px] animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[20%] left-[40%] w-[350px] h-[350px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>
          
          <div className="absolute top-[15%] right-[20%] w-20 h-20 bg-blue-400/20 rounded-full blur-2xl animate-float"></div>
          <div className="absolute bottom-[25%] left-[20%] w-32 h-32 bg-pink-500/10 rounded-full blur-3xl animate-float stagger-2"></div>
        </div>
      )}

      {/* --- HEADER --- */}
      <header className={`fixed top-0 left-0 right-0 z-[60] backdrop-blur-md border-b flex items-center justify-between h-16 px-4 sm:px-8 transition-all duration-500 ${isScrolled
        ? theme === 'dark' ? 'bg-black/90 border-gray-800 shadow-2xl shadow-red-600/5' : theme === 'modern' ? 'bg-[#0E0A20]/95 border-indigo-500/30 shadow-2xl shadow-indigo-500/10' : 'bg-white/90 border-gray-200 shadow-lg'
        : 'bg-transparent border-transparent'
        }`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className={`lg:hidden p-2 rounded-lg transition-all active:scale-95 relative z-[70] ${
              theme === 'dark' ? 'hover:bg-gray-800 text-white' : 
              theme === 'modern' ? 'hover:bg-indigo-500/20 text-white' : 
              'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div
            className={`text-2xl sm:text-3xl font-black tracking-widest cursor-pointer transition-all hover:scale-105 active:scale-95 ${theme === 'modern'
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-300 to-rose-300 drop-shadow-[0_0_15px_rgba(165,180,252,0.3)]'
              : 'text-red-600'
              }`}
            onClick={() => navigate('/home')}
          >
            CINEMA<span className={theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}>PRO</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="hidden lg:flex items-center gap-3">
            <PublicCinemaSelector selectedCinemaId={selectedCinemaId} onCinemaChange={setSelectedCinemaId} />
            <LanguageSwitcher />
            {/* Theme Dropdown */}
            <div className="relative" ref={themeDropdownRef}>
              <button onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : theme === 'modern' ? 'hover:bg-indigo-800/40 text-white font-medium' : 'hover:bg-gray-100 text-gray-700'
                }`}>
                {theme === 'dark' ? <Moon className="w-5 h-5" /> : theme === 'modern' ? <Sparkles className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                <span className="hidden sm:inline-block text-sm font-medium">{theme === 'dark' ? 'Dark' : theme === 'modern' ? 'Modern' : 'Light'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isThemeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isThemeDropdownOpen && (
                <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-900 border border-gray-700' : theme === 'modern' ? 'bg-[#0E0A20]/95 border border-indigo-500/30 shadow-sm shadow-indigo-500/10 backdrop-blur-2xl' : 'bg-white border border-gray-200'
                  }`}>
                  {(['light', 'dark', 'modern'] as const).map((t) => (
                    <button key={t} onClick={() => { setTheme(t); setIsThemeDropdownOpen(false); }} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === t ? (theme === 'dark' ? 'bg-gray-800 text-white' : theme === 'modern' ? 'bg-[#15102B] text-white' : 'bg-gray-100 text-gray-900')
                      : theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : theme === 'modern' ? 'text-white font-medium hover:bg-indigo-800/40' : 'text-gray-700 hover:bg-gray-100'
                      }`}>
                      {t === 'light' ? <Sun className="w-4 h-4" /> : t === 'dark' ? <Moon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                      {t === 'light' ? 'Light Mode' : t === 'dark' ? 'Dark Mode' : 'Modern View'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User Section - Responsive */}
          <div className="flex items-center gap-2">
            {/* Mobile Auth Access (Quick Login/User) */}
            {!user ? (
              <button 
                onClick={() => navigate('/login')}
                className={`lg:hidden px-3 py-1.5 rounded-lg font-bold text-xs transition-all active:scale-95 ${
                  theme === 'modern' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-red-600 text-white'
                }`}
              >
                {t('header.login')}
              </button>
            ) : (
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className={`lg:hidden p-1.5 rounded-full transition-all active:scale-95 ${
                  theme === 'dark' ? 'bg-gray-800' : theme === 'modern' ? 'bg-indigo-500/20' : 'bg-gray-100'
                }`}
              >
                <UserCircle className={`w-6 h-6 ${theme === 'modern' ? 'text-indigo-400' : 'text-red-500'}`} />
              </button>
            )}

            {/* Desktop Full Menu */}
            <div className="hidden lg:flex items-center">
            {!user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <button 
                  onClick={() => navigate('/login')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all hover:scale-105 active:scale-95 ${
                    theme === 'modern' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-red-600 text-white'
                  }`}
                >
                  {t('header.login')}
                </button>
                <button 
                  onClick={() => navigate('/register')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm border transition-all hover:scale-105 active:scale-95 ${
                    theme === 'dark' || theme === 'modern' ? 'border-gray-700 text-white hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t('header.register')}
                </button>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg transition-colors outline-none focus:ring-2 shrink-0 ${theme === 'dark' ? 'hover:bg-gray-800 focus:ring-red-600/50' : theme === 'modern' ? 'hover:bg-indigo-500/10 hover:shadow-[0_0_8px_rgba(99,102,241,0.15)] focus:ring-indigo-500/50' : 'hover:bg-gray-100 focus:ring-red-600/50'
                    }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg shrink-0 ${theme === 'modern' ? 'bg-gradient-to-br from-indigo-600 to-purple-700 opacity-90 shadow-indigo-500/20' : 'bg-gradient-to-br from-red-600 to-red-800'}`}>
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <span className={`font-bold text-sm ${theme === 'dark' ? 'text-gray-200' : theme === 'modern' ? 'text-white' : 'text-gray-700'}`}>
                    {user.username}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white/60' : 'text-gray-600'}`} />
                </button>

                {isDropdownOpen && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${theme === 'dark' ? 'bg-gray-900 border border-gray-700' : theme === 'modern' ? 'bg-[#0f172a]/40 backdrop-blur-2xl border border-indigo-500/20' : 'bg-white border border-gray-200'
                    }`}>
                    <div className="py-2">
                      <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/20' : 'border-gray-200'}`}>
                        <p className={`text-xs uppercase font-bold ${theme === 'dark' ? 'text-gray-500' : theme === 'modern' ? 'text-indigo-400' : 'text-gray-400'}`}>{t('header.signedInAs')}</p>
                        <p className={`text-sm font-bold truncate ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}`}>{user.username}</p>
                      </div>

                      {user.roles && user.roles.some((r: string) => r !== 'User' && r !== 'Cashier') && (
                        <button
                          onClick={() => navigate('/role-selection')}
                          className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-green-500' : theme === 'modern' ? 'text-white hover:bg-indigo-500/20 hover:text-indigo-300 hover:drop-shadow-[0_0_3px_rgba(129,140,248,0.4)]' : 'text-gray-700 hover:bg-gray-100 hover:text-green-600'
                            }`}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Go To The Home Management Page
                        </button>
                      )}

                      <button
                        onClick={() => { navigate('/account'); setIsDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-indigo-400' : theme === 'modern' ? 'text-white hover:bg-indigo-500/20 hover:text-indigo-300 hover:drop-shadow-[0_0_3px_rgba(129,140,248,0.4)]' : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-400'}`}
                      >
                        <UserCircle className="w-4 h-4" />{t('header.accountInfo')}
                      </button>


                      {user.roles && user.roles.length > 1 && (
                        <button
                          onClick={() => navigate('/role-selection')}
                          className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-blue-500' : theme === 'modern' ? 'text-white hover:bg-indigo-500/20 hover:text-indigo-300 hover:drop-shadow-[0_0_3px_rgba(129,140,248,0.4)]' : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                            }`}
                        >
                          <ArrowLeftRight className="w-4 h-4" />
                          {t('header.switchRole')}
                        </button>
                      )}

                      <div className={`border-t mt-1 ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/20' : 'border-gray-200'}`}></div>

                      <button
                        onClick={handleLogoutClick}
                        className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors font-bold ${theme === 'dark' ? 'text-red-500 hover:bg-red-900/20 hover:drop-shadow-[0_0_4px_rgba(239,68,68,0.4)]' : theme === 'modern' ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:drop-shadow-[0_0_4px_rgba(248,113,113,0.4)]' : 'text-red-600 hover:bg-red-50'
                          }`}
                      >
                        <LogOut className="w-4 h-4" />
                        {t('header.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE SIDEBAR */}
      <div 
        className={`fixed inset-0 z-[100] lg:hidden transition-all duration-500 ease-in-out ${
          isMobileMenuOpen ? 'visible opacity-100 pointer-events-auto' : 'invisible opacity-0 pointer-events-none'
        }`}
      >
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div className={`absolute inset-y-0 left-0 z-[110] w-[280px] transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) transform ${
          isMobileMenuOpen ? 'translate-x-0 scale-100' : '-translate-x-full scale-95'
        } ${
          theme === 'dark' ? 'bg-black border-r border-gray-800' : theme === 'modern' ? 'bg-[#030712] border-r border-indigo-500/20 shadow-[10px_0_30px_rgba(0,0,0,0.5)]' : 'bg-white border-r border-gray-100'
        } flex flex-col`}>
          {/* Sidebar Header */}
          <div className={`p-6 flex items-center justify-between border-b ${
            theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/20' : 'border-gray-100'
          }`}>
            <div className={`text-xl font-black tracking-widest ${theme === 'modern' ? 'text-white' : 'text-red-600'}`}>
              CINEMA<span className={theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}>PRO</span>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`p-2 rounded-xl transition-all active:scale-90 ${theme === 'dark' || theme === 'modern' ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* Auth for Mobile */}
            {!user ? (
              <div className="space-y-4 pb-4 border-b border-gray-500/10">
                 <button 
                  onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
                  className="w-full py-4 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 active:scale-95 hover:bg-red-700 transition-all text-sm uppercase tracking-[0.1em]"
                 >
                   {t('header.login')}
                 </button>
                 <button 
                  onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-4 rounded-xl font-bold border transition-all active:scale-95 text-sm uppercase tracking-[0.1em] ${
                    theme === 'dark' || theme === 'modern' ? 'border-gray-700 text-white hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                 >
                   {t('header.register')}
                 </button>
              </div>
            ) : (
              <div className="space-y-4 pb-4 border-b border-gray-500/10">
                 <div className="flex items-center gap-4 mb-2 p-1">
                   <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg shrink-0 ${theme === 'modern' ? 'bg-gradient-to-br from-indigo-600 to-purple-700' : 'bg-gradient-to-br from-red-600 to-red-800'}`}>
                      <User className="w-6 h-6 text-white" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className={`text-[10px] uppercase font-black tracking-widest leading-none mb-1 ${theme === 'dark' ? 'text-gray-500' : theme === 'modern' ? 'text-indigo-400' : 'text-gray-400'}`}>{t('header.signedInAs')}</p>
                     <p className={`text-sm font-black truncate ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}`}>{user?.username}</p>
                   </div>
                 </div>
                 <button 
                  onClick={() => { navigate('/account'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all active:scale-95 ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : theme === 'modern' ? 'text-white hover:bg-indigo-500/10' : 'text-gray-700 hover:bg-gray-100'}`}
                 >
                   <UserCircle className="w-5 h-5 text-indigo-400" />
                   <span className="font-bold">{t('header.accountInfo')}</span>
                 </button>
                 {user?.roles && user.roles.some(r => r !== 'User' && r !== 'Cashier') && (
                      <button
                        onClick={() => { navigate('/role-selection'); setIsMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all active:scale-95 text-green-500 ${theme === 'dark' ? 'hover:bg-gray-800/50' : theme === 'modern' ? 'hover:bg-green-500/10' : 'hover:bg-green-50'}`}
                      >
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="font-bold">Management Hub</span>
                      </button>
                    )}
                 <button 
                  onClick={() => { handleLogoutClick(); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all active:scale-95 text-red-500 font-bold ${theme === 'dark' ? 'hover:bg-red-500/10' : theme === 'modern' ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
                 >
                   <LogOut className="w-5 h-5" />
                   <span>{t('header.logout')}</span>
                 </button>
              </div>
            )}

            {/* Cinema Selector */}
            <div className="space-y-4">
              <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-indigo-400' : 'text-gray-500'}`}>
                {t('Cinema Location')}
              </h3>
              <div className="p-1">
                <PublicCinemaSelector selectedCinemaId={selectedCinemaId} onCinemaChange={setSelectedCinemaId} />
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-4">
              <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-indigo-400' : 'text-gray-500'}`}>
                {t('Preferences')}
              </h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm font-bold tracking-tight">Language</span>
                  <LanguageSwitcher />
                </div>
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm font-bold tracking-tight">Theme</span>
                  <div className="flex gap-2">
                     {(['light', 'dark', 'modern'] as const).map((t) => (
                       <button 
                         key={t}
                         onClick={() => setTheme(t)}
                         className={`p-2.5 rounded-xl transition-all transform active:scale-90 ${theme === t ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40' : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'}`}
                       >
                         {t === 'light' ? <Sun className="w-4 h-4" /> : t === 'dark' ? <Moon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                       </button>
                     ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {logoutError && (
        <div className="pt-24 px-6 container mx-auto">
          <div className="mb-4 p-4 rounded-lg bg-red-900/40 border border-red-500/50 flex items-center text-red-100">
            <AlertCircle className="w-5 h-5 mr-3 shrink-0 text-red-500" />
            <span className="text-sm font-medium">{logoutError}</span>
          </div>
        </div>
      )}

      {/* --- HERO SECTION --- */}
      <section className="relative h-[80vh] w-full mt-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1920"
            className="w-full h-full object-cover brightness-50"
            alt="Hero Background"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
        </div>

        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 animate-float">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-white">{t('Experience Local Cinema Better')}</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black mb-6 uppercase tracking-tighter leading-tight sm:leading-none animate-reveal text-white">
            Cinematic<br />
            <span className={theme === 'modern' ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-rose-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'text-red-600'}>Adventure</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/70 max-w-xl mx-auto mb-10 opacity-0 animate-reveal stagger-2 px-4">
            {t('Discover the latest blockbusters and timeless classics at your favorite local theaters. Premium comfort, state-of-the-art sound, and endless magic.')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 opacity-0 animate-reveal stagger-3 w-full sm:w-auto px-6">
            <button className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm transition-all shadow-xl hover:scale-105 active:scale-95 ${theme === 'modern' ? 'bg-white text-black hover:shadow-cyan-500/40' : 'bg-red-600 text-white hover:bg-red-700'
              }`}>
              {t('Explore Now')}
            </button>
            <button className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm bg-white/5 backdrop-blur-md border border-white/20 hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-white hover:scale-105 active:scale-95">
              <Play className="w-4 h-4 fill-white" />
              {t('Watch Trailer')}
            </button>
          </div>
        </div>
      </section>

      {/* --- ADVANCED SEARCH SECTION --- */}
      <section className="-mt-12 relative z-20">
        <AdvancedSearch />
      </section>

      {/* --- BODY CONTENT --- */}
      <main className="px-6 container mx-auto mb-16 relative z-10">
        <h2 
          ref={el => { sectionsRef.current[0] = el; }}
          className={`text-4xl font-black mb-8 border-l-8 pl-6 flex items-center gap-4 opacity-0 ${theme === 'modern' ? 'border-cyan-400 text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'border-red-600 text-gray-900 dark:text-white'
          }`}>
          <div className={`w-3 h-3 rounded-full animate-pulse ${theme === 'modern' ? 'bg-cyan-400' : 'bg-red-600'}`}></div>
          {t('Now Showing')}
        </h2>

        {error && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center ${theme === 'dark' || theme === 'modern' ? 'bg-red-900/40 border-red-500/50 text-red-100' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
            <AlertCircle className="w-5 h-5 mr-3 text-red-500" />
            <span className="text-sm font-medium flex-1">{error}</span>
            <button onClick={fetchMovies} className="ml-3 px-3 py-1 rounded text-sm font-semibold bg-red-600 hover:bg-red-700 text-white">Retry</button>
          </div>
        )}

        {loading ? (
          <div className={`text-center py-20 rounded-xl border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : theme === 'modern' ? 'bg-gradient-to-br from-[#15102B]/80 border-indigo-500/30 shadow-sm shadow-indigo-500/10' : 'bg-white border-gray-200'
            }`}>
            <Loader2 className={`w-12 h-12 animate-spin mx-auto mb-4 ${theme === 'modern' ? 'text-indigo-300' : 'text-red-600'}`} />
            <p className={theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white font-medium' : 'text-gray-600'}>Loading movies...</p>
          </div>
        ) : nowShowing.length === 0 ? (
          <div className={`text-center py-20 rounded-xl border ${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-white border-gray-200 text-gray-500'}`}>
            <p className="text-xl">No movies currently showing.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-12">
            {nowShowing.map((movie, index) => (
              <div
                key={movie.movieId}
                className={`group rounded-xl overflow-hidden shadow-lg border transition-all hover:-translate-y-1 cursor-pointer opacity-0 animate-reveal ${
                  `stagger-${(index % 5) + 1}`
                } ${theme === 'dark'
                  ? 'bg-gray-900 border-gray-800 hover:border-red-600'
                  : theme === 'modern'
                    ? 'bg-gradient-to-br from-[#15102B]/80 border-indigo-500/30 shadow-sm shadow-indigo-500/10 hover:border-cyan-400 text-white shadow-md shadow-cyan-500/20 backdrop-blur-2xl'
                    : 'bg-white border-gray-200 hover:border-red-600 shadow-sm'
                  }`}
                onClick={() => navigate(`/movie/${movie.movieId}`)}
              >
                <div className="aspect-[2/3] relative">
                  <img
                    src={movie.movieImageUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500'}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    alt={movie.movieName}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                    <div className="p-4 w-full">
                      <button className={`w-full py-2 rounded font-bold text-sm ${theme === 'modern' ? 'bg-cyan-600 shadow-md shadow-cyan-500/20 text-white' : 'bg-red-600 text-white'}`}>Book Ticket</button>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className={`font-bold text-sm sm:text-base truncate mb-1 ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'
                    }`}>{movie.movieName}</h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {movie.movieGenres.slice(0, 2).map((genre, i) => (
                      <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : theme === 'modern' ? 'bg-indigo-800/40 text-white font-medium' : 'bg-gray-100 text-gray-600'
                        }`}>{genre}</span>
                    ))}
                  </div>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : theme === 'modern' ? 'text-indigo-300' : 'text-gray-500'}`}>
                    {movie.movieDuration} min • {formatDate(movie.startedDate)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 
          ref={el => { sectionsRef.current[1] = el; }}
          className={`text-4xl font-black mt-12 mb-8 border-l-8 pl-6 flex items-center gap-4 opacity-0 ${theme === 'modern' ? 'border-pink-400 text-white drop-shadow-[0_0_10px_rgba(236,72,153,0.2)]' : 'border-red-600 text-gray-900 dark:text-white'
          }`}>
          <div className={`w-3 h-3 rounded-full animate-pulse ${theme === 'modern' ? 'bg-pink-400' : 'bg-red-600'}`}></div>
          {t('Coming Soon')}
        </h2>

        {!loading && comingSoon.length === 0 ? (
          <div className={`text-center py-20 rounded-xl border ${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-white border-gray-200 text-gray-500'}`}>
            <p className="text-xl">No movies coming soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {comingSoon.map((movie, index) => (
              <div
                key={movie.movieId}
                className={`group rounded-xl overflow-hidden shadow-lg border transition-all hover:-translate-y-1 cursor-pointer opacity-0 animate-reveal ${
                  `stagger-${(index % 5) + 1}`
                } ${theme === 'dark'
                  ? 'bg-gray-900 border-gray-800 hover:border-red-600'
                  : theme === 'modern'
                    ? 'bg-gradient-to-br from-[#15102B]/80 border-indigo-500/30 shadow-sm shadow-indigo-500/10 hover:border-pink-400 text-white shadow-md shadow-pink-500/20 backdrop-blur-2xl'
                    : 'bg-white border-gray-200 hover:border-red-600 shadow-sm'
                  }`}
                onClick={() => navigate(`/movie/${movie.movieId}`)}
              >
                <div className="aspect-[2/3] relative">
                  <img
                    src={movie.movieImageUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500'}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    alt={movie.movieName}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                    <div className="p-4 w-full text-center">
                      <span className={`px-4 py-2 rounded font-bold text-sm bg-gray-800/80 text-white`}>Coming Soon</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className={`font-bold text-sm sm:text-base truncate mb-1 ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'
                    }`}>{movie.movieName}</h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {movie.movieGenres.slice(0, 2).map((genre, i) => (
                      <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : theme === 'modern' ? 'bg-indigo-800/40 text-white font-medium' : 'bg-gray-100 text-gray-600'
                        }`}>{genre}</span>
                    ))}
                  </div>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : theme === 'modern' ? 'text-indigo-300' : 'text-gray-500'}`}>
                    Starting: {formatDate(movie.startedDate)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
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

export default HomePage;