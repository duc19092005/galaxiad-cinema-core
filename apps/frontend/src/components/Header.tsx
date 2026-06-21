// src/components/Header.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/authApi';
import { notificationApi } from '../api/commentApi';
import type { UserNotification } from '../types/comment.types';
import Cookies from 'js-cookie';
import LanguageSwitcher from './LanguageSwitcher';
// import CinemaSelector from './CinemaSelector';
import LogoutModal from './LogoutModal';
import PublicCitySelector from '../features/public/components/PublicCitySelector';
import { 
  Menu, Search, MapPin, User, LayoutDashboard, 
  ArrowLeftRight, LogOut, LogIn, X, Ticket, Calendar, Film, HelpCircle, FileText, Bell
} from 'lucide-react';

interface HeaderProps {
  title?: string;
  role?: string;
  onMenuToggle?: () => void;
  showSidebarToggle?: boolean;
  rightContent?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({
  rightContent,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  // Dropdowns and Modals
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>(() => localStorage.getItem('user_selected_city') || '');

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const storedUserStr = localStorage.getItem('user_info');
  const user = storedUserStr ? JSON.parse(storedUserStr) : null;

  useEffect(() => {
    const checkSelectedCity = () => {
      setSelectedCity(localStorage.getItem('user_selected_city') || '');
    };
    checkSelectedCity();
    window.addEventListener('user_selected_city_changed', checkSelectedCity);
    return () => window.removeEventListener('user_selected_city_changed', checkSelectedCity);
  }, []);


  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    localStorage.setItem('user_selected_city', city);
    window.dispatchEvent(new Event('user_selected_city_changed'));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [storedUserStr]);

  useEffect(() => {
    const handler = () => {
      if (!user) return;
      fetchNotifications();
    };
    window.addEventListener('cinema-notification', handler);
    return () => window.removeEventListener('cinema-notification', handler);
  }, [storedUserStr]);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const res = await notificationApi.getNotifications();
      setNotifications(res.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleNotificationClick = async (notification: UserNotification) => {
    try {
      if (!notification.isRead) {
        await notificationApi.markAsRead(notification.notificationId);
      }
    } catch {
      // Keep navigation responsive even if the read marker fails.
    }

    setNotifications(prev => prev.map(item => item.notificationId === notification.notificationId ? { ...item, isRead: true } : item));
    setIsNotificationOpen(false);
    if (notification.relatedMovieId) {
      navigate(`/movie/${notification.relatedMovieId}`);
    }
  };

  const getRoleDashboardRoute = (role?: string) => {
    switch (role) {
      case 'Admin': return '/admin';
      case 'MovieManager': return '/movie-manager';
      case 'TheaterManager': return '/theater-manager';
      case 'FacilitiesManager': return '/facilities-manager';
      case 'Cashier': return user?.isSharedPosAccount ? '/cashier' : '/staff';
      default: return null;
    }
  };

  const handleLogout = async () => {
    setLogoutError(null);
    setLogoutLoading(true);
    try {
      await authApi.logout();
      localStorage.removeItem('user_info');
      Cookies.remove('X-Access-Token');
      setIsLogoutModalOpen(false);
      setIsMobileMenuOpen(false);
      navigate('/login');
    } catch {
      setLogoutError('Logout failed. Please try again.');
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <>
      <header className="fixed w-full top-0 z-50 bg-[#131313]/30 backdrop-blur-xl border-b border-white/10 shadow-sm transition-all duration-300">
        <nav className="flex justify-between items-center px-4 md:px-6 lg:px-10 py-3.5 max-w-7xl mx-auto gap-2">
          <div className="flex items-center gap-3 md:gap-5 lg:gap-8 min-w-0 flex-shrink-0">
            {/* Mobile Menu Hamburger Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="md:hidden hover:bg-white/5 p-2 rounded-full transition-all text-white bg-transparent border-none cursor-pointer flex-shrink-0 flex items-center justify-center"
              aria-label="Toggle Navigation Menu"
            >
              <Menu size={20} />
            </button>

            <a 
              onClick={() => navigate('/home')} 
              className="font-bold text-xl lg:text-2xl tracking-tighter text-[#ffb77f] hover:text-[#ff8a00] transition-colors cursor-pointer no-underline flex-shrink-0"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              CINEMA
            </a>
            
            <div className="hidden md:flex gap-3 lg:gap-5 min-w-0">
              <span 
                onClick={() => navigate('/home')} 
                className={`${(location.pathname === '/home' || location.pathname === '/') ? 'text-[#ffb77f] font-bold border-b-2 border-[#ffb77f] pb-1' : 'text-white/80 hover:text-[#ffb77f] border-b-2 border-transparent pb-1'} transition-colors font-sans text-xs lg:text-sm cursor-pointer whitespace-nowrap`}
              >
                {t('home.moviesNav', 'Movies')}
              </span>
              <span 
                onClick={() => navigate('/showtimes')} 
                className={`${location.pathname === '/showtimes' ? 'text-[#ffb77f] font-bold border-b-2 border-[#ffb77f] pb-1' : 'text-white/80 hover:text-[#ffb77f] border-b-2 border-transparent pb-1'} transition-colors font-sans text-xs lg:text-sm cursor-pointer whitespace-nowrap`}
              >
                {t('home.showtimesNav', 'Showtimes')}
              </span>
              <span 
                onClick={() => navigate('/theaters')} 
                className={`${location.pathname === '/theaters' ? 'text-[#ffb77f] font-bold border-b-2 border-[#ffb77f] pb-1' : 'text-white/80 hover:text-[#ffb77f] border-b-2 border-transparent pb-1'} transition-colors font-sans text-xs lg:text-sm cursor-pointer whitespace-nowrap`}
              >
                {t('home.theatersNav', 'Theaters')}
              </span>
              <span 
                onClick={() => navigate('/offers')} 
                className={`${location.pathname === '/offers' ? 'text-[#ffb77f] font-bold border-b-2 border-[#ffb77f] pb-1' : 'text-white/80 hover:text-[#ffb77f] border-b-2 border-transparent pb-1'} transition-colors font-sans text-xs lg:text-sm cursor-pointer whitespace-nowrap`}
              >
                {t('home.offersNav', 'Offers')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2.5 flex-shrink-0">
            {/* Search Input Box */}
            <div className="hidden xl:flex items-center bg-white/5 rounded-full px-3 py-1.5 border border-white/10">
              <Search size={15} className="text-[#ddc1ae] flex-shrink-0" />
              <input 
                className="bg-transparent border-none focus:outline-none text-white text-xs ml-2 w-36 placeholder:text-[#ddc1ae]/50" 
                placeholder="Search movies..." 
                type="text"
              />
            </div>

            <div className="flex gap-1 md:gap-2 items-center">
              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* City Selector */}
              <div className="hidden md:block">
                <PublicCitySelector selectedCity={selectedCity} onCityChange={handleCityChange} />
              </div>

              {user && (
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => {
                      setIsNotificationOpen(prev => !prev);
                      if (!isNotificationOpen) fetchNotifications();
                    }}
                    className="relative hover:bg-white/5 p-2 rounded-full transition-all duration-300 text-[#ffb77f] bg-transparent border-none cursor-pointer flex items-center justify-center"
                    aria-label="Notifications"
                  >
                    <Bell size={19} className="flex-shrink-0" />
                    {notifications.some(item => !item.isRead) && (
                      <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-[#ff8a00] border border-[#131313]" />
                    )}
                  </button>

                  {isNotificationOpen && (
                    <div
                      className="absolute right-0 mt-2 rounded-xl z-50 overflow-hidden"
                      style={{
                        width: 340,
                        maxWidth: 'calc(100vw - 24px)',
                        background: 'var(--bg-elevated, #18181b)',
                        border: '1px solid var(--border-color, #27272a)',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
                      }}
                    >
                      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                        <p className="text-sm font-bold text-white m-0">Thong bao</p>
                        <button
                          onClick={fetchNotifications}
                          className="text-xs text-[#ffb77f] hover:text-[#ff8a00] bg-transparent border-none cursor-pointer font-semibold"
                        >
                          Lam moi
                        </button>
                      </div>

                      <div className="max-h-[360px] overflow-y-auto">
                        {loadingNotifications ? (
                          <div className="px-4 py-6 text-sm text-zinc-400">Dang tai thong bao...</div>
                        ) : notifications.length === 0 ? (
                          <div className="px-4 py-6 text-sm text-zinc-400">Chua co thong bao moi.</div>
                        ) : (
                          notifications.map(notification => (
                            <button
                              key={notification.notificationId}
                              onClick={() => handleNotificationClick(notification)}
                              className={`w-full px-4 py-3 text-left border-none cursor-pointer transition-colors ${
                                notification.isRead ? 'bg-transparent hover:bg-white/5' : 'bg-[#ff8a00]/10 hover:bg-[#ff8a00]/15'
                              }`}
                            >
                              <span className="block text-sm font-bold text-white">{notification.title}</span>
                              <span className="block text-xs text-[#ddc1ae] mt-1 leading-relaxed">{notification.message}</span>
                              <span className="block text-[11px] text-zinc-500 mt-2">{new Date(notification.createdAt).toLocaleString('vi-VN')}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="hover:bg-white/5 p-2 rounded-full transition-all duration-300 text-[#ffb77f] bg-transparent border-none cursor-pointer flex items-center justify-center"
                  aria-label="User Account Options"
                >
                  <User size={20} className="flex-shrink-0" />
                </button>

                {isDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 py-1 rounded-xl z-50"
                    style={{
                      minWidth: 220,
                      background: 'var(--bg-elevated, #18181b)',
                      border: '1px solid var(--border-color, #27272a)',
                      boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
                    }}
                  >
                    {user ? (
                      <div className="px-4 py-3 border-b border-zinc-800">
                        <p className="text-[10px] text-zinc-500 font-mono m-0 mb-1 uppercase tracking-wider">
                          {t('SIGNED IN AS')}
                        </p>
                        <p className="text-sm font-semibold text-white m-0">
                          {user.username}
                        </p>
                      </div>
                    ) : (
                      <div className="px-4 py-3 border-b border-zinc-800">
                        <p className="text-sm font-semibold text-white m-0">
                          Guest Mode
                        </p>
                      </div>
                    )}

                    {user && (
                      <>
                        {user.selectedRole && user.selectedRole !== 'Customer' && (
                          <button
                            onClick={() => {
                              const route = getRoleDashboardRoute(user.selectedRole);
                              if (route) navigate(route);
                              setIsDropdownOpen(false);
                            }}
                            className="sidebar-nav-item w-full text-left px-4 py-2 hover:bg-zinc-800 text-[#ffb77f] flex items-center gap-3 text-sm border-none bg-transparent cursor-pointer font-semibold"
                          >
                            <LayoutDashboard size={16} className="flex-shrink-0" />
                            {t('Dashboard')}
                          </button>
                        )}

                        {user.roles && user.roles.length > 1 ? (
                          <>
                            <button
                              onClick={() => { navigate('/account'); setIsDropdownOpen(false); }}
                              className="sidebar-nav-item w-full text-left px-4 py-2 hover:bg-zinc-800 text-zinc-300 flex items-center gap-3 text-sm border-none bg-transparent cursor-pointer"
                            >
                              <User size={16} className="flex-shrink-0" />
                              {t('Account Info')}
                            </button>

                            <button
                              onClick={() => { navigate('/role-selection'); setIsDropdownOpen(false); }}
                              className="sidebar-nav-item w-full text-left px-4 py-2 hover:bg-zinc-800 text-zinc-300 flex items-center gap-3 text-sm border-none bg-transparent cursor-pointer"
                            >
                              <ArrowLeftRight size={16} className="flex-shrink-0" />
                              {t('Switch Role')}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => { navigate('/account'); setIsDropdownOpen(false); }}
                            className="sidebar-nav-item w-full text-left px-4 py-2 hover:bg-zinc-800 text-zinc-300 flex items-center gap-3 text-sm border-none bg-transparent cursor-pointer font-semibold"
                          >
                            <User size={16} className="flex-shrink-0" />
                            {t('header.myProfile', 'My profile')}
                          </button>
                        )}

                        <div className="h-px bg-zinc-800 my-1 mx-2" />
                      </>
                    )}

                    {user ? (
                      <button
                        onClick={() => { setIsDropdownOpen(false); setIsLogoutModalOpen(true); }}
                        className="sidebar-nav-item w-full text-left px-4 py-2 hover:bg-zinc-800 text-red-400 flex items-center gap-3 text-sm border-none bg-transparent cursor-pointer font-semibold"
                      >
                        <LogOut size={16} className="flex-shrink-0" />
                        {t('Logout')}
                      </button>
                    ) : (
                      <button
                        onClick={() => { navigate('/login'); setIsDropdownOpen(false); }}
                        className="sidebar-nav-item w-full text-left px-4 py-2 hover:bg-zinc-800 text-[#ffb77f] flex items-center gap-3 text-sm border-none bg-transparent cursor-pointer font-semibold"
                      >
                        <LogIn size={16} className="flex-shrink-0" />
                        {t('Sign In')}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Login Button / Welcome Message */}
              {user ? (
                <span 
                  className="hidden lg:inline-block text-xs font-semibold text-zinc-400 font-sans max-w-[90px] overflow-hidden text-ellipsis whitespace-nowrap"
                  title={user.username}
                >
                  {user.username}
                </span>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="hidden md:block bg-[#ff8a00] text-black px-4 py-1.5 rounded-full font-bold hover:scale-95 active:scale-90 transition-transform cursor-pointer border-none text-xs font-sans whitespace-nowrap"
                >
                  Sign In
                </button>
              )}
            </div>
            {rightContent}
          </div>
        </nav>
      </header>

      {/* ============================================
          MOBILE SIDEBAR DRAWER MENU
          ============================================ */}
      {/* Overlay backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm transition-all duration-300"
        />
      )}

      {/* Drawer Panel */}
      <div 
        className="fixed top-0 left-0 h-full w-[280px] bg-[#111114] border-r border-white/5 shadow-2xl flex flex-col z-[1001] transition-transform duration-300 ease-out"
        style={{
          transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <span 
            className="font-bold text-xl tracking-tighter text-[#ffb77f]"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            CINEMA
          </span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center border-none cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {/* Main Navigation Links */}
          <MobileNavItem icon={<Film size={18} />} label={t('home.moviesNav', 'Movies')} onClick={() => { navigate('/home'); setIsMobileMenuOpen(false); }} active={location.pathname === '/home' || location.pathname === '/'} />
          <MobileNavItem icon={<Calendar size={18} />} label={t('home.showtimesNav', 'Showtimes')} onClick={() => { navigate('/showtimes'); setIsMobileMenuOpen(false); }} active={location.pathname === '/showtimes'} />
          <MobileNavItem icon={<MapPin size={18} />} label={t('home.theatersNav', 'Theaters')} onClick={() => { navigate('/theaters'); setIsMobileMenuOpen(false); }} active={location.pathname === '/theaters'} />
          <MobileNavItem icon={<Ticket size={18} />} label={t('home.offersNav', 'Offers')} onClick={() => { navigate('/offers'); setIsMobileMenuOpen(false); }} active={location.pathname === '/offers'} />

          <div className="h-px bg-white/5 my-2" />

          <MobileNavItem icon={<HelpCircle size={18} />} label={t('servicesTitle', 'Services')} onClick={() => { navigate('/services'); setIsMobileMenuOpen(false); }} active={location.pathname === '/services'} />
          <MobileNavItem icon={<FileText size={18} />} label={t('helpTitle', 'Help')} onClick={() => { navigate('/help'); setIsMobileMenuOpen(false); }} active={location.pathname === '/help'} />

          <div className="h-px bg-white/5 my-2" />

          {/* User Account / Auth Section */}
          {!user ? (
            <div className="flex flex-col gap-2 pt-2">
              <button 
                onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
                className="w-full py-2.5 bg-gradient-to-r from-[#ff8a00] to-[#ea580c] hover:brightness-110 text-white font-bold text-sm rounded-xl border-none cursor-pointer transition-all active:scale-95"
              >
                {t('header.login', 'Sign In')}
              </button>
              <button 
                onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm rounded-xl border border-white/10 cursor-pointer transition-all"
              >
                {t('header.register', 'Register')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* User profile card */}
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-[#ffb77f] border border-white/10">
                  <User size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500 font-mono m-0 uppercase tracking-wider">Signed in as</p>
                  <p className="text-sm font-bold text-white m-0 truncate">{user.username}</p>
                </div>
              </div>

              {user.selectedRole && user.selectedRole !== 'Customer' && (
                <MobileNavItem
                  icon={<LayoutDashboard size={18} />}
                  label={t('Dashboard')}
                  onClick={() => {
                    const route = getRoleDashboardRoute(user.selectedRole);
                    if (route) navigate(route);
                    setIsMobileMenuOpen(false);
                  }}
                  active={false}
                />
              )}

              {user.roles && user.roles.length > 1 ? (
                <>
                  <MobileNavItem
                    icon={<User size={18} />}
                    label={t('Account Info')}
                    onClick={() => { navigate('/account'); setIsMobileMenuOpen(false); }}
                    active={location.pathname === '/account'}
                  />

                  <MobileNavItem
                    icon={<ArrowLeftRight size={18} />}
                    label={t('Switch Role')}
                    onClick={() => { navigate('/role-selection'); setIsMobileMenuOpen(false); }}
                    active={false}
                  />
                </>
              ) : (
                <MobileNavItem
                  icon={<User size={18} />}
                  label={t('header.myProfile', 'My profile')}
                  onClick={() => { navigate('/account'); setIsMobileMenuOpen(false); }}
                  active={location.pathname === '/account'}
                />
              )}

              <div className="h-px bg-white/5 my-2" />

              <button
                onClick={() => { setIsMobileMenuOpen(false); setIsLogoutModalOpen(true); }}
                className="w-full py-3 px-4 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 flex items-center gap-3 text-sm border-none bg-transparent cursor-pointer font-bold transition-colors text-left"
              >
                <LogOut size={18} />
                <span>{t('header.logout', 'Logout')}</span>
              </button>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1 min-h-[20px]" />

          {/* Language Selection */}
          <div className="border-t border-white/5 pt-4">
            <p className="text-[10px] text-zinc-500 font-mono m-0 mb-2 uppercase tracking-wider px-2">{t('sidebar.language')}</p>
            <div className="px-1">
              <LanguageSwitcher />
            </div>
          </div>

          {/* City Selection */}
          <div className="border-t border-white/5 pt-4">
            <p className="text-[10px] text-zinc-500 font-mono m-0 mb-2 uppercase tracking-wider px-2">City</p>
            <div className="px-1">
              <PublicCitySelector selectedCity={selectedCity} onCityChange={handleCityChange} />
            </div>
          </div>
        </div>
      </div>

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        loading={logoutLoading}
        error={logoutError}
      />
    </>
  );
};

/* Mobile nav item helper */
const MobileNavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active: boolean;
}> = ({ icon, label, onClick, active }) => (
  <button
    onClick={onClick}
    className={`w-full py-3 px-4 rounded-xl flex items-center gap-3 text-sm border-none cursor-pointer transition-colors text-left font-medium ${
      active 
        ? 'bg-[#ff8a00]/10 text-[#ffb77f] font-bold border border-[#ff8a00]/20' 
        : 'bg-transparent text-zinc-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    {icon}
    <span className="truncate">{label}</span>
  </button>
);

export default Header;
