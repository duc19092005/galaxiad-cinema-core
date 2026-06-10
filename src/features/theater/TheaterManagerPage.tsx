// src/features/theater/TheaterManagerPage.tsx
// Complete redesign with dark cinema theme

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { authApi } from '../../api/authApi';
import type { ApiErrorResponse } from '../../types/auth.types';
import AppSidebar, { SidebarSection } from '../../components/AppSidebar';
import Header from '../../components/Header';
import ScheduleManagerPage from '../schedule/ScheduleManagerPage';
import DragMovieCard from './components/DragMovieCard';
import FloatingActionButtons from '../../components/FloatingActionButtons';
import GlassCard from '../../components/GlassCard';
import { useCinema } from '../../contexts/CinemaContext';
import ManagementDashboard from '../../components/ManagementDashboard';
import LogoutModal from '../../components/LogoutModal';
import Cookies from 'js-cookie';
import { Loader2, AlertCircle, LayoutDashboard, Users, Calendar, Search } from 'lucide-react';

/**
 * TheaterManagerPage – UI for theater schedule management with dark cinema theme.
 * IMPORTANT: Keep the drag-and-drop logic intact for theater management.
 */
const TheaterManagerPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { managedCinemas, activeCinemaId, loading: cinemaLoading } = useCinema();
  const [user, setUser] = useState<{ username: string; roles?: string[] } | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'schedule'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  // Load user information & permissions
  useEffect(() => {
    const raw = localStorage.getItem('user_info');
    if (!raw) { navigate('/login'); return; }
    try {
      const parsed = JSON.parse(raw) as { username: string; roles?: string[] };
      const roles = parsed.roles || [];
      if (!roles.includes('TheaterManager') && !roles.includes('Admin')) {
        navigate('/role-selection');
        return;
      }
      setUser(parsed);
    } catch { navigate('/login'); }
  }, [navigate]);

  const handleLogout = async () => {
    setLogoutError(null);
    setLogoutLoading(true);
    try {
      await authApi.logout();
      localStorage.removeItem('user_info');
      Cookies.remove('X-Access-Token');
      navigate('/login');
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response) {
        setLogoutError((e.response.data as ApiErrorResponse).message || 'Logout failed');
      } else {
        setLogoutError('Unable to connect to server');
      }
    } finally { setLogoutLoading(false); }
  };

  const sidebarSections: SidebarSection[] = [
    {
      items: [
        { id: 'dashboard', label: t('Dashboard'), icon: <LayoutDashboard size={18} /> },
        { id: 'employees', label: t('Employees'), icon: <Users size={18} /> },
        { id: 'schedule', label: t('Schedule'), icon: <Calendar size={18} /> },
      ],
    },
  ];

  const renderContent = () => {
    if (cinemaLoading) {
      return (
        <div className="state-center" style={{ minHeight: 200 }}>
          <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{t('Loading cinema data...')}</p>
        </div>
      );
    }

    if (!user) return null;
    const isAdmin = user.roles?.includes('Admin') ?? false;
    if (!isAdmin && managedCinemas.length === 0) {
      return (
        <GlassCard className="flex flex-col items-center justify-center p-8">
          <AlertCircle size={48} style={{ color: 'var(--danger)' }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '12px 0 4px' }}>{t('Access Restricted')}</h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 400 }}>
            {t('Your account is not assigned to any theater. Contact admin.')}
          </p>
        </GlassCard>
      );
    }
    if (!isAdmin && !activeCinemaId) {
      return (
        <div className="state-center" style={{ minHeight: 200 }}>
          <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{t('Initializing selection…')}</p>
        </div>
      );
    }
    switch (activeTab) {
      case 'dashboard':
        return <ManagementDashboard role="theater" />;
      case 'employees':
        return (
          <div className="state-center" style={{ minHeight: 300 }}>
            <Users size={40} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{t('Employee Management coming soon…')}</p>
          </div>
        );
      case 'schedule':
        return (
          <div style={{ display: 'flex', gap: 16, minHeight: '60vh' }}>
            {/* Drag list */}
            <aside
              className="glass-card"
              style={{
                width: 320, padding: 16, overflowY: 'auto', flexShrink: 0,
                display: 'flex', flexDirection: 'column', gap: 12,
              }}
            >
              <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('Drag Movies')}
              </h4>
              <div className="relative">
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input placeholder={t('Filter films...')} className="input" style={{ paddingLeft: 32 }} />
              </div>
              <DragMovieCard posterUrl="https://via.placeholder.com/40x56" title="Dune: Part Three" duration="120 min" />
              <DragMovieCard posterUrl="https://via.placeholder.com/40x56" title="The Dark Knight" duration="152 min" />
            </aside>
            {/* Calendar grid */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ScheduleManagerPage embedded={true} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <AppSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as 'dashboard' | 'employees' | 'schedule')}
        sections={sidebarSections}
        role="Theater Manager"
      />

      <Header
        title={t('Theater Manager')}
        role="Theater Manager"
        showSidebarToggle
        onMenuToggle={() => setSidebarOpen(true)}
      />

      <main className="main-content">
        <div className="page-container">
          {renderContent()}
        </div>
      </main>

      {/* FABs – only on schedule tab */}
      {activeTab === 'schedule' && (
        <FloatingActionButtons
          buttons={[
            { icon: <Calendar size={18} />, label: 'Add', onClick: () => {} },
          ]}
        />
      )}

      <LogoutModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleLogout}
        loading={logoutLoading}
        error={logoutError}
      />
    </div>
  );
};

export default TheaterManagerPage;
