// src/components/Header.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/authApi';
import Cookies from 'js-cookie';
import LanguageSwitcher from './LanguageSwitcher';
import CinemaSelector from './CinemaSelector';
import LogoutModal from './LogoutModal';
import { ProximitySelectorModal } from './ProximitySelectorModal';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  role?: string;
  onMenuToggle?: () => void;
  showSidebarToggle?: boolean;
  rightContent?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({
  onMenuToggle,
  showSidebarToggle = false,
  rightContent,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedCinemaName, setSelectedCinemaName] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const storedUserStr = localStorage.getItem('user_info');
  const user = storedUserStr ? JSON.parse(storedUserStr) : null;

  useEffect(() => {
    const checkSelectedCinema = () => {
      const stored = localStorage.getItem('user_selected_cinema');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSelectedCinemaName(parsed.cinemaName);
        } catch {
          setSelectedCinemaName(null);
        }
      } else {
        setSelectedCinemaName(null);
      }
    };

    checkSelectedCinema();
    window.addEventListener('user_selected_cinema_changed', checkSelectedCinema);
    return () => window.removeEventListener('user_selected_cinema_changed', checkSelectedCinema);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleDashboardRoute = (role?: string) => {
    switch (role) {
      case 'Admin': return '/admin';
      case 'MovieManager': return '/movie-manager';
      case 'TheaterManager': return '/theater-manager';
      case 'FacilitiesManager': return '/facilities-manager';
      case 'Cashier': return '/cashier';
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
        <nav className="flex justify-between items-center px-4 md:px-8 lg:px-12 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-6 lg:gap-12">
            {/* Sidebar toggle for dashboards */}
            {showSidebarToggle && (
              <button 
                onClick={onMenuToggle} 
                className="hover:bg-white/5 p-2 rounded-full transition-all text-white bg-transparent border-none cursor-pointer lg:hidden"
              >
                <span className="material-symbols-outlined text-[24px]">menu</span>
              </button>
            )}

            <a 
              onClick={() => navigate('/home')} 
              className="font-bold text-2xl tracking-tighter text-[#ffb77f] hover:text-[#ff8a00] transition-colors cursor-pointer no-underline"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              CINEMA
            </a>
            
            <div className="hidden md:flex gap-4 lg:gap-8">
              <span 
                onClick={() => navigate('/home')} 
                className={`${(location.pathname === '/home' || location.pathname === '/') ? 'text-[#ffb77f] font-bold border-b-2 border-[#ffb77f] pb-1' : 'text-white/80 hover:text-[#ffb77f] border-b-2 border-transparent pb-1'} transition-colors font-sans text-sm cursor-pointer`}
              >
                {t('home.moviesNav', 'Movies')}
              </span>
              <span 
                onClick={() => navigate('/showtimes')} 
                className={`${location.pathname === '/showtimes' ? 'text-[#ffb77f] font-bold border-b-2 border-[#ffb77f] pb-1' : 'text-white/80 hover:text-[#ffb77f] border-b-2 border-transparent pb-1'} transition-colors font-sans text-sm cursor-pointer`}
              >
                {t('home.showtimesNav', 'Showtimes')}
              </span>
              <span 
                onClick={() => navigate('/theaters')} 
                className={`${location.pathname === '/theaters' ? 'text-[#ffb77f] font-bold border-b-2 border-[#ffb77f] pb-1' : 'text-white/80 hover:text-[#ffb77f] border-b-2 border-transparent pb-1'} transition-colors font-sans text-sm cursor-pointer`}
              >
                {t('home.theatersNav', 'Theaters')}
              </span>
              <span 
                onClick={() => navigate('/offers')} 
                className={`${location.pathname === '/offers' ? 'text-[#ffb77f] font-bold border-b-2 border-[#ffb77f] pb-1' : 'text-white/80 hover:text-[#ffb77f] border-b-2 border-transparent pb-1'} transition-colors font-sans text-sm cursor-pointer`}
              >
                {t('home.offersNav', 'Offers')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Search Input Box */}
            <div className="hidden xl:flex items-center bg-white/5 rounded-full px-4 py-2 border border-white/10">
              <span className="material-symbols-outlined text-[#ddc1ae] text-[20px]">search</span>
              <input 
                className="bg-transparent border-none focus:outline-none text-white text-sm ml-2 w-48 placeholder:text-[#ddc1ae]/50" 
                placeholder="Search movies..." 
                type="text"
              />
            </div>

            <div className="flex gap-1.5 md:gap-3 items-center">
              {/* Cinema Selector (Only for TheaterManager) */}
              {user?.selectedRole === 'TheaterManager' && <CinemaSelector />}

              {/* Language Switcher */}
              <LanguageSwitcher />

              <button 
                onClick={() => setIsLocationModalOpen(true)}
                title={selectedCinemaName || "Select Cinema Location"}
                className="hover:bg-white/5 p-2 rounded-full transition-all duration-300 bg-transparent border-none cursor-pointer flex items-center gap-1.5"
                style={{ color: selectedCinemaName ? 'var(--primary, #ff8a00)' : 'white' }}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontSize: '20px' }}>location_on</span>
                {selectedCinemaName && (
                  <span className="hidden lg:inline text-xs font-semibold max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap font-sans">
                    {selectedCinemaName}
                  </span>
                )}
              </button>

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="hover:bg-white/5 p-2 rounded-full transition-all duration-300 text-[#ffb77f] bg-transparent border-none cursor-pointer flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[24px]">account_circle</span>
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
                            <span className="material-symbols-outlined text-[18px]">dashboard</span>
                            {t('Dashboard')}
                          </button>
                        )}

                        <button
                          onClick={() => { navigate('/account'); setIsDropdownOpen(false); }}
                          className="sidebar-nav-item w-full text-left px-4 py-2 hover:bg-zinc-800 text-zinc-300 flex items-center gap-3 text-sm border-none bg-transparent cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">person</span>
                          {t('Account Info')}
                        </button>

                        <button
                          onClick={() => { navigate('/role-selection'); setIsDropdownOpen(false); }}
                          className="sidebar-nav-item w-full text-left px-4 py-2 hover:bg-zinc-800 text-zinc-300 flex items-center gap-3 text-sm border-none bg-transparent cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                          {t('Switch Role')}
                        </button>

                        <div className="h-px bg-zinc-800 my-1 mx-2" />
                      </>
                    )}

                    {user ? (
                      <button
                        onClick={() => { setIsDropdownOpen(false); setIsLogoutModalOpen(true); }}
                        className="sidebar-nav-item w-full text-left px-4 py-2 hover:bg-zinc-800 text-red-400 flex items-center gap-3 text-sm border-none bg-transparent cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        {t('Logout')}
                      </button>
                    ) : (
                      <button
                        onClick={() => { navigate('/login'); setIsDropdownOpen(false); }}
                        className="sidebar-nav-item w-full text-left px-4 py-2 hover:bg-zinc-800 text-[#ffb77f] flex items-center gap-3 text-sm border-none bg-transparent cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">login</span>
                        {t('Sign In')}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Login Button / Welcome Message */}
              {user ? (
                <span 
                  className="hidden xl:inline-block text-xs font-semibold text-zinc-400 font-sans max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap"
                  title={user.username}
                >
                  {t('Hi', 'Hi')}, {user.username}
                </span>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="hidden md:block bg-[#ff8a00] text-black px-6 py-2 rounded-full font-bold hover:scale-95 active:scale-90 transition-transform cursor-pointer border-none text-sm font-sans"
                >
                  Sign In
                </button>
              )}
            </div>
            {rightContent}
          </div>
        </nav>
      </header>

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        loading={logoutLoading}
        error={logoutError}
      />

      <ProximitySelectorModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </>
  );
};

export default Header;
