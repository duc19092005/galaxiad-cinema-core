import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { authApi } from '../../api/authApi';
import type { ApiErrorResponse } from '../../types/auth.types';
import Sidebar from './components/Sidebar';
import Header from '../../components/Header';
import ScheduleManagerPage from '../schedule/ScheduleManagerPage';
import DragMovieCard from './components/DragMovieCard';
import FloatingActionButtons from '../../components/FloatingActionButtons';
import GlassCard from '../../components/GlassCard';
import { useCinema } from '../../contexts/CinemaContext';
import ManagementDashboard from '../../components/ManagementDashboard';
import LogoutModal from '../../components/LogoutModal';
import Cookies from 'js-cookie';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * TheaterManagerPage – UI for theater schedule management using the new design system.
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
    } finally {
      setLogoutLoading(false);
    }
  };

  const renderContent = () => {
    if (cinemaLoading) {
      return (
        <div className="state-center" style={{ minHeight: 200 }}>
          <Loader2 size={24} className="text-primary spin" />
          <p className="text-muted mt-2">{t('Loading cinema data...')}</p>
        </div>
      );
    }

    if (!user) return null;
    const isAdmin = user.roles?.includes('Admin') ?? false;
    if (!isAdmin && managedCinemas.length === 0) {
      return (
        <GlassCard className="flex flex-col items-center justify-center p-8">
          <AlertCircle size={48} className="text-error" />
          <h2 className="heading-md mt-4">{t('Access Restricted')}</h2>
          <p className="text-secondary mt-2 max-w-md text-center">
            {t('Your account is not assigned to any theater. Contact admin.')}
          </p>
        </GlassCard>
      );
    }
    if (!isAdmin && !activeCinemaId) {
      return (
        <div className="state-center" style={{ minHeight: 200 }}>
          <Loader2 size={24} className="text-primary spin" />
          <p className="text-muted mt-2">{t('Initializing selection…')}</p>
        </div>
      );
    }
    switch (activeTab) {
      case 'dashboard':
        return <ManagementDashboard role="theater" />;
      case 'employees':
        return <div className="p-6">Employee Management coming soon…</div>;
      case 'schedule':
        return (
          <div className="flex gap-4">
            {/* Drag list */}
            <aside className="w-80 bg-surface-low border-r border-base p-4 overflow-y-auto custom-scrollbar">
              <h4 className="text-secondary text-sm uppercase mb-4">{t('Drag Movies')}</h4>
              <input placeholder={t('Filter films...')} className="w-full bg-surface-high border border-base rounded-lg py-2.5 px-4 text-body-md focus:ring-1 focus:ring-primary outline-none mb-4" />
              {/* Example movie cards */}
              <DragMovieCard posterUrl="https://via.placeholder.com/40x56" title="Dune: Part Three" duration="120 min" />
              <DragMovieCard posterUrl="https://via.placeholder.com/40x56" title="The Dark Knight" duration="152 min" />
            </aside>
            {/* Calendar grid */}
            <div className="flex-1 relative bg-surface-low/30 overflow-hidden">
              <ScheduleManagerPage embedded={true} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-base text-primary relative">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={(tab: string) => setActiveTab(tab as 'dashboard' | 'employees' | 'schedule')} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      {/* Header */}
      <Header />
      {/* Main */}
      <main className="pt-16 pl-72 px-8 pb-8">
        {renderContent()}
      </main>
      {/* FABs – only on schedule tab */}
      {activeTab === 'schedule' && (
        <FloatingActionButtons
          onAdd={() => console.log('Add')}
          onZoomIn={() => console.log('Zoom In')}
          onZoomOut={() => console.log('Zoom Out')}
          onDelete={() => console.log('Delete')}
        />
      )}
      {/* Logout modal */}
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
