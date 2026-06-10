// src/features/theater/TheaterManagerPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, Menu, LogOut, AlertCircle, UserCircle, ChevronDown,
  ArrowLeftRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { authApi } from '../../api/authApi';
import type { ApiErrorResponse } from '../../types/auth.types';
import Sidebar from './components/Sidebar';
import LogoutModal from '../../components/LogoutModal';
import ScheduleManagerPage from '../schedule/ScheduleManagerPage';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import Cookies from 'js-cookie';
import { useCinema } from '../../contexts/CinemaContext';
import CinemaSelector from '../../components/CinemaSelector';
import ManagementDashboard from '../../components/ManagementDashboard';

const EmployeeManagementPlaceholder = () => <div className="p-6">Employee Management functionality coming soon...</div>;

const TheaterManagerPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { managedCinemas, activeCinemaId, loading: cinemaContextLoading } = useCinema();
  const [user, setUser] = useState<{ username: string; roles?: string[]; selectedRole?: string } | null>(null);

  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user_info');
    if (!storedUser) { navigate('/login'); return; }
    try {
      const parsed = JSON.parse(storedUser) as { username: string; roles?: string[]; selectedRole?: string };
      const roles = parsed.roles || [];
      if (!roles.includes('TheaterManager') && !roles.includes('Admin')) { navigate('/role-selection'); return; }
      setUser(parsed);
    } catch { navigate('/login'); }
  }, [navigate]);

  const handleLogoutClick = () => { setIsLogoutModalOpen(true); setLogoutError(null); };

  const handleLogoutConfirm = async () => {
    setLogoutError(null); setLogoutLoading(true);
    try {
      await authApi.logout();
      localStorage.removeItem('user_info');
      Cookies.remove('X-Access-Token');
      setIsLogoutModalOpen(false);
      navigate('/login');
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        setLogoutError((error.response.data as ApiErrorResponse).message || 'Logout failed.');
      } else { setLogoutError('Unable to connect to server.'); }
    } finally { setLogoutLoading(false); }
  };

  const renderContent = () => {
    if (cinemaContextLoading) {
      return (
        <div className="state-center" style={{ minHeight: 200 }}>
          <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
          <span className="text-muted">{t('Loading Cinema Context...')}</span>
        </div>
      );
    }

    const isAdmin = user?.roles?.includes('Admin') ?? false;

    if (!isAdmin && managedCinemas.length === 0) {
      return (
        <div className="state-center" style={{ minHeight: 200 }}>
          <AlertCircle size={40} style={{ color: 'var(--danger)' }} />
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 500 }}>{t('Access Restricted')}</h2>
          <p className="text-secondary" style={{ fontSize: 'var(--text-sm)', maxWidth: 400 }}>
            {t('Tài khoản của bạn chưa được chỉ định quản lý Rạp phim nào. Vui lòng liên hệ Admin')}
          </p>
        </div>
      );
    }

    if (!isAdmin && !activeCinemaId) {
      return (
        <div className="state-center" style={{ minHeight: 200 }}>
          <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
          <span className="text-muted">{t('Initializing Cinema Selection...')}</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <ManagementDashboard role="theater" />;
      case 'employees': return <EmployeeManagementPlaceholder />;
      case 'schedule': return <ScheduleManagerPage embedded={true} />;
      default: return <ManagementDashboard role="theater" />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* HEADER */}
      <header className="navbar" style={{ position: 'fixed', left: 288, height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button onClick={() => setSidebarOpen(true)} className="btn-icon">
            <Menu size={20} />
          </button>
          <div className="navbar-brand" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
            CinemaPro
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div className="hidden lg:flex" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <CinemaSelector />
            <div style={{ width: 1, height: 20, backgroundColor: 'var(--border)' }} />
            <LanguageSwitcher />

            {/* User dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="btn btn-secondary" style={{ padding: '2px 12px 2px 2px', gap: 'var(--space-2)', height: 'auto', borderRadius: 'var(--radius-full)', borderColor: 'var(--border)' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--accent-soft)' }}>
                  <UserCircle size={16} style={{ color: 'var(--accent)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span className="text-muted" style={{ fontSize: '10px', letterSpacing: '0.3px', lineHeight: 1.2 }}>Theater Manager</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, lineHeight: 1.3 }}>{user?.username || 'Guest'}</span>
                </div>
                <ChevronDown size={12} style={{ color: 'var(--text-muted)', transition: 'transform 300ms var(--ease)', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>

              {isDropdownOpen && (
                <div className="card surface-elevated" style={{ position: 'absolute', right: 0, marginTop: 'var(--space-2)', width: 200, padding: 'var(--space-1)', boxShadow: 'var(--shadow-lg)', zIndex: 100 }}>
                  <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border)' }}>
                    <p className="text-muted" style={{ fontSize: 'var(--text-xs)', margin: 0 }}>{t('SIGNED IN AS')}</p>
                    <p style={{ fontWeight: 500, fontSize: 'var(--text-sm)', margin: 0 }}>{user?.username}</p>
                  </div>
                  <button onClick={() => { navigate('/account'); setIsDropdownOpen(false); }} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 'var(--text-sm)' }}>
                    <UserCircle size={14} />{t('header.accountInfo')}
                  </button>
                  <button onClick={() => navigate('/role-selection')} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 'var(--text-sm)' }}>
                    <ArrowLeftRight size={14} />{t('header.switchRole')}
                  </button>
                  <div style={{ height: 1, backgroundColor: 'var(--border)', margin: 'var(--space-1) 0' }} />
                  <button onClick={handleLogoutClick} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 'var(--text-sm)', color: 'var(--danger)' }}>
                    <LogOut size={14} />{t('header.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>

          <button onClick={() => setSidebarOpen(true)} className="btn-icon">
            <UserCircle size={20} />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main style={{
        paddingTop: 64,
        paddingLeft: 288,
        display: 'flex', flexDirection: 'column',
        height: activeTab === 'schedule' ? '100vh' : 'auto',
        minHeight: activeTab === 'schedule' ? undefined : '100vh',
      }}>
        <div style={{
          display: 'flex', flexDirection: 'column',
          overflow: activeTab === 'schedule' ? 'hidden' : 'visible',
          flex: activeTab === 'schedule' ? 1 : undefined,
          padding: activeTab === 'schedule' ? 'var(--space-4)' : 'var(--space-6)',
        }}>
          {/* Mobile Cinema Selector */}
          {activeTab !== 'schedule' && (
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <CinemaSelector />
            </div>
          )}

          {logoutError && (
            <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', borderColor: 'var(--danger)', backgroundColor: 'var(--danger-soft)' }}>
              <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <span style={{ fontSize: 'var(--text-sm)' }}>{logoutError}</span>
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
