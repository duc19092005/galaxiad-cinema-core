// src/features/facilities/FacilitiesManagerPage.tsx
// Complete redesign with dark cinema theme

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, AlertCircle, Loader2, Menu, UserCircle, ChevronDown,
  ArrowLeftRight, LayoutDashboard, Building2, BarChart3,
} from 'lucide-react';
import { facilitiesApi, type Cinema } from '../../api/facilitiesApi';
import axios from 'axios';
import { authApi } from '../../api/authApi';
import type { ApiErrorResponse } from '../../types/auth.types';
import { useCinema } from '../../contexts/CinemaContext';
import AppSidebar from '../../components/AppSidebar';
import type { SidebarSection } from '../../components/AppSidebar';
import Header from '../../components/Header';
import CinemaManagement from './components/CinemaManagement';
import SeatReport from './components/SeatReport';
import LogoutModal from '../../components/LogoutModal';
import ManagementDashboard from '../../components/ManagementDashboard';
import Cookies from 'js-cookie';

const FacilitiesManagerPage: React.FC = () => {
  const navigate = useNavigate();

  const { managedCinemas, activeCinemaId, loading: cinemaContextLoading } = useCinema();
  const [user, setUser] = useState<{ username: string; roles?: string[]; selectedRole?: string } | null>(null);

  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
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
      if (!roles.includes('FacilitiesManager') && !roles.includes('Admin')) { navigate('/role-selection'); return; }
      setUser(parsed);
      fetchCinemas();
    } catch { navigate('/login'); }
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'cinemas' && cinemas.length === 0 && !loading) fetchCinemas();
  }, [activeTab]);

  const fetchCinemas = async () => {
    setLoading(true); setError(null);
    try {
      const res = await facilitiesApi.getCinemaList();
      setCinemas(res.data || []);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as ApiErrorResponse;
        if (data.statusCode === 401) { localStorage.removeItem('user_info'); Cookies.remove('X-Access-Token'); navigate('/login'); return; }
        setError(data.message || 'Cannot load cinemas list.');
      } else { setError('Cannot connect to server.'); }
    } finally { setLoading(false); }
  };

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

  const sidebarSections: SidebarSection[] = [
    {
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        { id: 'cinemas', label: 'Cinemas', icon: <Building2 size={18} /> },
        { id: 'seat-reports', label: 'Seat Reports', icon: <BarChart3 size={18} /> },
      ],
    },
  ];

  const renderContent = () => {
    const isAdmin = user?.roles?.includes('Admin') ?? false;

    if (cinemaContextLoading) {
      return (
        <div className="state-center" style={{ minHeight: 200 }}>
          <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>Loading Cinema Context...</span>
        </div>
      );
    }

    if (!isAdmin && managedCinemas.length === 0) {
      return (
        <div className="state-center" style={{ minHeight: 200 }}>
          <AlertCircle size={40} style={{ color: 'var(--danger)' }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '12px 0 4px' }}>Access Restricted</h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 400 }}>
            Tài khoản của bạn chưa được chỉ định quản lý Rạp phim nào. Vui lòng liên hệ Admin
          </p>
        </div>
      );
    }

    if (!isAdmin && !activeCinemaId) {
      return (
        <div className="state-center" style={{ minHeight: 200 }}>
          <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>Initializing Cinema Selection...</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <ManagementDashboard role="facilities" />;
      case 'cinemas': return <CinemaManagement cinemas={cinemas} loading={loading} error={error} onRefresh={fetchCinemas} />;
      case 'seat-reports': return <SeatReport />;
      default: return <ManagementDashboard role="facilities" />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <AppSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sections={sidebarSections}
        role="Facilities Manager"
      />

      <Header
        title="Facilities Manager"
        role="Facilities Manager"
        showSidebarToggle
        onMenuToggle={() => setSidebarOpen(true)}
      />

      <main className="main-content">
        <div className="page-container">
          {logoutError && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              <AlertCircle size={16} />
              <span>{logoutError}</span>
            </div>
          )}

          {error && activeTab === 'dashboard' && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
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

export default FacilitiesManagerPage;
