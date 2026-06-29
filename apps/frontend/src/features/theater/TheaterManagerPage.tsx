// src/features/theater/TheaterManagerPage.tsx
// Complete redesign with dark cinema theme

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { authApi } from '../../api/authApi';
import type { ApiErrorResponse } from '../../types/auth.types';
import AppSidebar from '../../components/AppSidebar';
import type { SidebarSection } from '../../components/AppSidebar';
import ManagementChrome from '../../components/ManagementChrome';
import ScheduleManagerPage from '../schedule/ScheduleManagerPage';
import FloatingActionButtons from '../../components/FloatingActionButtons';
import GlassCard from '../../components/GlassCard';
import { useCinema } from '../../contexts/CinemaContext';
import ManagementDashboard from '../../components/ManagementDashboard';
import LogoutModal from '../../components/LogoutModal';
import Cookies from 'js-cookie';
import { Loader2, AlertCircle, LayoutDashboard, Users, Calendar, Film } from 'lucide-react';
import EmployeesShiftWorkspace from './components/EmployeesShiftWorkspace';
import { facilitiesApi } from '../../api/facilitiesApi';
import type { Cinema } from '../../types/facilities.types';

/**
 * TheaterManagerPage – UI for theater schedule management with dark cinema theme.
 * IMPORTANT: Keep the drag-and-drop logic intact for theater management.
 */
const TheaterManagerPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { managedCinemas, activeCinemaId, activeCinemaName, setActiveCinemaId, loading: cinemaLoading } = useCinema();
  const [user, setUser] = useState<{ username: string; roles?: string[]; selectedRole?: string } | null>(null);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const { tab } = useParams<{ tab?: string }>();
  const activeTab = (tab || 'dashboard') as 'dashboard' | 'employees' | 'employees-schedule' | 'schedule';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const isAdmin = user?.roles?.includes('Admin') ?? false;

  // Load user information & permissions
  useEffect(() => {
    const raw = localStorage.getItem('user_info');
    if (!raw) { navigate('/login'); return; }
    try {
      const parsed = JSON.parse(raw) as { username: string; roles?: string[]; selectedRole?: string };
      const roles = parsed.roles || [];
      if (!roles.includes('TheaterManager') && !roles.includes('Admin')) {
        navigate('/role-selection');
        return;
      }
      if (parsed.selectedRole && !['TheaterManager', 'Admin'].includes(parsed.selectedRole)) {
        navigate('/role-selection');
        return;
      }
      setUser(parsed);
      if (roles.includes('Admin')) {
        facilitiesApi.getCinemaList()
          .then((res) => {
            const list = res.data || [];
            setCinemas(list);
            if (list.length > 0 && !activeCinemaId) {
              setActiveCinemaId(list[0].cinemaId);
            }
          })
          .catch((err) => console.error('Failed to load cinemas list', err));
      }
    } catch { navigate('/login'); }
  }, [navigate, activeCinemaId, setActiveCinemaId]);

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
        { id: 'dashboard', label: t('sidebar.dashboard', 'Tổng quan'), icon: <LayoutDashboard size={18} /> },
        { id: 'employees', label: t('Employees', 'Quản lý nhân viên'), icon: <Users size={18} /> },
        { id: 'employees-schedule', label: t('sidebar.workSchedule', 'Ca làm việc'), icon: <Calendar size={18} /> },
        { id: 'schedule', label: t('sidebar.schedule', 'Lịch chiếu'), icon: <Film size={18} /> },
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
        return (
          <div className="animate-in">
            <ManagementDashboard role="theater" />
          </div>
        );
      case 'employees':
        return <EmployeesShiftWorkspace cinemaId={activeCinemaId} defaultTab="management" mode="staff-only" />;
      case 'employees-schedule':
        return <EmployeesShiftWorkspace cinemaId={activeCinemaId} defaultTab="scheduling" mode="shift-management" />;
      case 'schedule':
        return (
          <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <ScheduleManagerPage isEmbedded={true} />
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
        onToggle={() => setSidebarOpen((open) => !open)}
        activeTab={activeTab}
        onTabChange={(tab) => navigate(`/theater-manager/${tab}`)}
        sections={sidebarSections}
        role="Theater Manager"
        collapsibleDesktop
      />

      <ManagementChrome
        sidebarOpen={sidebarOpen}
        onSidebarToggle={() => setSidebarOpen((open) => !open)}
        cinemaSelector={isAdmin ? {
          cinemas,
          activeCinemaId,
          activeCinemaName,
          onChange: (id) => setActiveCinemaId(id),
        } : undefined}
      />

      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
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
