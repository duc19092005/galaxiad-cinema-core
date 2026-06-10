// src/features/admin/AdminPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, ChevronDown, UserCircle,
  Sun, Moon, Sparkles, Loader2, CheckCircle,
  ShieldCheck, Filter, ArrowLeftRight, SortAsc, SortDesc,
  Menu, XCircle, Search, Download, TrendingUp,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { adminApi } from '../../api/adminApi';
import { authApi } from '../../api/authApi';
import type { AdminUserDto, AuditLogDto, GroupedScheduleJobDto, ManagementDashboardDto } from '../../types/admin.types';
import { showSuccess, showError } from '../../utils/ToastUtils';
import LogoutModal from '../../components/LogoutModal';
import RoleUpdateModal from '../../components/RoleUpdateModal';
import TransferRightsView from './components/TransferRightsView';
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';
import { formatVietnamDateTime } from '../../utils/dateTimeUtils';

// =============================================
// ADMIN THEME COLORS
// =============================================
const ADMIN = {
  bg: '#051424',
  surface: '#0d1c2d',
  surfaceLow: '#122131',
  surfaceHigh: '#1c2b3c',
  surfaceHighest: '#273647',
  surfaceBright: '#2c3a4c',
  border: '#564334',
  text: '#d4e4fa',
  textMuted: '#ddc1ae',
  textVariant: '#ddc1ae',
  primary: '#ffb77f',
  primaryContainer: '#ff8a00',
  error: '#ffb4ab',
  success: '#10B981',
};

// =============================================
// SIDEBAR
// =============================================
interface SidebarProps {
  activeTab: 'users' | 'jobs' | 'transfer' | 'audit' | 'dashboard';
  onTabChange: (tab: 'users' | 'jobs' | 'transfer' | 'audit' | 'dashboard') => void;
  isOpen: boolean;
  onClose: () => void;
}

const ICONS: Record<string, string> = {
  dashboard: 'dashboard',
  users: 'group',
  audit: 'history',
  jobs: 'work_history',
  transfer: 'swap_horiz',
  settings: 'settings',
  logout: 'logout',
};

const LABELS: Record<string, string> = {
  dashboard: 'Management Hub',
  users: 'User Management',
  audit: 'Activity Logs',
  jobs: 'Background Jobs',
  transfer: 'Transfer Rights',
};

const navItems = ['dashboard', 'users', 'audit', 'jobs', 'transfer'] as const;

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isOpen, onClose }) => {
  const navigate = useNavigate();
  const storedUserStr = localStorage.getItem('user_info');
  const user = storedUserStr ? JSON.parse(storedUserStr) : null;

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem('user_info');
    Cookies.remove('X-Access-Token');
    navigate('/login');
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 49,
            backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          }}
        />
      )}
      <aside
        style={{
          position: 'fixed', top: 0, left: 0, height: '100vh', width: 260, zIndex: 50,
          backgroundColor: ADMIN.surfaceLow,
          borderRight: `1px solid ${ADMIN.border}`,
          display: 'flex', flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
        }}
        className="lg:translate-x-0"
      >
        {/* Brand */}
        <div style={{ padding: '24px 24px 40px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32,
            backgroundColor: ADMIN.primaryContainer,
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined" style={{ color: '#2f1500', fontWeight: 700, fontSize: 18 }}>
              communities
            </span>
          </div>
          <h1 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 18, fontWeight: 700, color: ADMIN.primary, margin: 0 }}>
            Admin Console
          </h1>
        </div>

        <div style={{ padding: '0 24px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
            backgroundColor: ADMIN.surfaceHighest, border: `1px solid ${ADMIN.border}`,
          }}>
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAR3FhZPlCQJGg_SqAjnw6f6k2XNKCctH2xveFbQz7Ug7uCMHwSNc_y_gCSqNwrEx2X4dT9OxRQbxuX5w-qxRb55cugDS5UmxYfatjV99EEZ3ixz47C24GRfZMIVfGjk4Rj80LBAE_9L0A_DzVyK3adeCYt25IHNkxGla_vHmCMVckIJll8llogeQrrgLi1b3zxPDglBLYqPk3uM-FqcTc_3qXwftLAiTk10GXogeWX9AvKmMu07vANstB899jaYEHCYXbqW0uxNCQ"
              alt="Admin"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: ADMIN.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.username || 'Admin User'}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: ADMIN.textVariant, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Midnight Premiere v1.0
            </p>
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' }}>
          {navItems.map(item => {
            const isActive = activeTab === item;
            return (
              <button
                key={item}
                onClick={() => { onTabChange(item); if (window.innerWidth < 1024) onClose(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '10px 16px',
                  color: isActive ? ADMIN.text : ADMIN.textVariant,
                  backgroundColor: isActive ? ADMIN.surfaceHigh : 'transparent',
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                  borderLeft: isActive ? `4px solid ${ADMIN.primary}` : '4px solid transparent',
                  fontWeight: isActive ? 700 : 400,
                  fontSize: 14, textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = ADMIN.surfaceHigh; e.currentTarget.style.color = ADMIN.text; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = ADMIN.textVariant; } }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: isActive ? ADMIN.primary : ADMIN.textVariant }}>
                  {ICONS[item]}
                </span>
                <span>{LABELS[item]}</span>
              </button>
            );
          })}
        </nav>

        <nav style={{ padding: '8px', borderTop: `1px solid ${ADMIN.border}`, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button
            onClick={() => navigate('/account')}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              padding: '10px 16px', color: ADMIN.textVariant,
              backgroundColor: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer',
              fontSize: 14, textAlign: 'left',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = ADMIN.surfaceHigh; e.currentTarget.style.color = ADMIN.text; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = ADMIN.textVariant; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>settings</span>
            <span>Settings</span>
          </button>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              padding: '10px 16px', color: ADMIN.textVariant,
              backgroundColor: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer',
              fontSize: 14, textAlign: 'left',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = ADMIN.surfaceHigh; e.currentTarget.style.color = ADMIN.text; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = ADMIN.textVariant; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
            <span>Logout</span>
          </button>
        </nav>
      </aside>
    </>
  );
};

// =============================================
// ADMIN PAGE
// =============================================
const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'users' | 'jobs' | 'transfer' | 'audit' | 'dashboard'>('users');
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [jobs, setJobs] = useState<GroupedScheduleJobDto[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogDto[]>([]);
  const [dashboard, setDashboard] = useState<ManagementDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<{ username: string; roles?: string[]; userId?: string } | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>('');
  const [selectedUserRoles, setSelectedUserRoles] = useState<string>('');

  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  const [jobCategoryFilter, setJobCategoryFilter] = useState<string>('All');
  const [jobSortOrder, setJobSortOrder] = useState<'asc' | 'desc'>('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (activeActionMenu && !target.closest('.action-menu-container')) setActiveActionMenu(null);
      if (dropdownRef.current && !dropdownRef.current.contains(target)) setIsDropdownOpen(false);
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(target)) setIsThemeDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeActionMenu]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user_info');
    if (!storedUser) { navigate('/login'); return; }
    const parsed = JSON.parse(storedUser);
    if (!parsed.roles?.includes('Admin')) { navigate('/role-selection'); return; }
    setUser(parsed);
  }, [navigate]);

  useEffect(() => {
    setCurrentPage(1);
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    if (activeTab === 'transfer') { setLoading(false); return; }
    setLoading(true);
    try {
      if (activeTab === 'users') { const res = await adminApi.getUsers(); setUsers(res.data || []); }
      else if (activeTab === 'dashboard') {
        try {
          const res = await adminApi.getManagementDashboard();
          setDashboard(res.data || null);
        } catch { setDashboard(null); }
        setLoading(false); return;
      }
      else if (activeTab === 'jobs') { const res = await adminApi.getScheduleJobs(); setJobs(res.data || []); }
      else if (activeTab === 'audit') { const res = await adminApi.getRecentAuditLogs(50); setAuditLogs(res.data || []); }
    } catch { showError(t('toast.loadDataFailed')); }
    finally { setLoading(false); }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: number) => {
    try {
      await adminApi.updateUserStatus(userId, newStatus);
      showSuccess(t('toast.userStatusUpdated'));
      fetchData();
    } catch (err: any) { showError(err.response?.data?.message || t('toast.userStatusUpdateFailed')); }
  };

  const handleUpdateUserRole = (userId: string, email: string, roles: string) => {
    setSelectedUserId(userId); setSelectedUserEmail(email); setSelectedUserRoles(roles); setIsRoleModalOpen(true);
  };

  const handleRoleUpdateSuccess = (updatedUserId: string) => {
    if (updatedUserId === user?.userId) { showSuccess(t('toast.rolesRefreshLogin')); handleLogoutConfirm(); }
    else fetchData();
  };

  const handleLogoutConfirm = async () => {
    setLogoutLoading(true);
    try {
      await authApi.logout();
      localStorage.removeItem('user_info');
      Cookies.remove('X-Access-Token');
      navigate('/login');
    } catch { setLogoutError('Logout failed.'); }
    finally { setLogoutLoading(false); }
  };

  const formatDate = formatVietnamDateTime;

  const filteredUsers = users.filter(u =>
    !searchQuery || u.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.accountStatus === 1).length;
  const blockedUsers = users.filter(u => u.accountStatus !== 1).length;
  const managerUsers = users.filter(u => u.userRoles?.includes('TheaterManager') || u.userRoles?.includes('FacilitiesManager')).length;

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon size={14} />;
    if (theme === 'modern') return <Sparkles size={14} />;
    return <Sun size={14} />;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: ADMIN.bg, color: ADMIN.text, display: 'flex' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; vertical-align: middle; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #0d1c2d; }
        ::-webkit-scrollbar-thumb { background: #273647; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #ffb77f; }
        @keyframes admin-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes admin-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main style={{ flex: 1, marginLeft: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}
        className="lg:ml-[260px]"
      >
        {/* TOP NAV */}
        <header style={{
          width: '100%', position: 'sticky', top: 0, zIndex: 40,
          backgroundColor: ADMIN.bg, borderBottom: `1px solid ${ADMIN.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', height: 64,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, maxWidth: 480 }}>
            <button onClick={() => setIsSidebarOpen(true)}
              style={{ display: 'inline-flex', background: 'none', border: 'none', color: ADMIN.textVariant, cursor: 'pointer', padding: 4 }}
              className="lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: ADMIN.textVariant, pointerEvents: 'none',
              }} />
              <input
                type="text"
                placeholder="Search Command Center..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{
                  width: '100%', backgroundColor: ADMIN.surface,
                  border: `1px solid ${ADMIN.border}`, borderRadius: 8,
                  padding: '8px 12px 8px 36px', color: ADMIN.text, fontSize: 12,
                  outline: 'none', fontFamily: "'JetBrains Mono', monospace",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = ADMIN.primary; }}
                onBlur={e => { e.currentTarget.style.borderColor = ADMIN.border; }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div className="relative" ref={themeDropdownRef}>
              <button onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                style={{ background: 'none', border: 'none', color: ADMIN.textVariant, cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}>
                {getThemeIcon()}
              </button>
              {isThemeDropdownOpen && (
                <div style={{ position: 'absolute', right: 0, marginTop: 8, width: 160, backgroundColor: ADMIN.surfaceHigh, border: `1px solid ${ADMIN.border}`, borderRadius: 8, padding: 4, zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                  {(['light', 'dark', 'modern'] as const).map(tMode => (
                    <button key={tMode} onClick={() => { setTheme(tMode); setIsThemeDropdownOpen(false); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 13, backgroundColor: theme === tMode ? ADMIN.surfaceHighest : 'transparent', color: theme === tMode ? ADMIN.primary : ADMIN.textVariant, border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                      {tMode === 'light' ? <Sun size={14} /> : tMode === 'dark' ? <Moon size={14} /> : <Sparkles size={14} />}
                      <span>{tMode === 'light' ? 'Light' : tMode === 'dark' ? 'Dark' : 'Modern'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ height: 24, width: 1, backgroundColor: ADMIN.border }} />
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <span style={{ fontSize: 11, color: ADMIN.textVariant, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.03em' }}>Account Settings</span>
                <ChevronDown size={14} style={{ color: ADMIN.textVariant, transition: 'transform 0.2s ease', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
              </button>
              {isDropdownOpen && (
                <div style={{ position: 'absolute', right: 0, marginTop: 8, width: 200, backgroundColor: ADMIN.surfaceHigh, border: `1px solid ${ADMIN.border}`, borderRadius: 8, padding: 4, zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                  <div style={{ padding: '8px 12px', borderBottom: `1px solid ${ADMIN.border}`, marginBottom: 4 }}>
                    <p style={{ margin: 0, fontSize: 11, color: ADMIN.textVariant }}>SIGNED IN AS</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{user?.username}</p>
                  </div>
                  <button onClick={() => { navigate('/account'); setIsDropdownOpen(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 13, color: ADMIN.textVariant, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4 }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = ADMIN.surfaceHighest; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <UserCircle size={14} /> Account Info
                  </button>
                  <button onClick={() => navigate('/role-selection')}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 13, color: ADMIN.textVariant, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4 }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = ADMIN.surfaceHighest; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <ArrowLeftRight size={14} /> Switch Role
                  </button>
                  <div style={{ height: 1, backgroundColor: ADMIN.border, margin: '4px 0' }} />
                  <button onClick={() => setIsLogoutModalOpen(true)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 13, color: ADMIN.error, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4 }}>
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div style={{ padding: '24px 32px', overflow: 'auto', flex: 1 }}>
          {activeTab === 'users' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }} className="md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 24, fontWeight: 600, color: ADMIN.text, margin: 0, marginBottom: 4 }}>User Management</h2>
                  <p style={{ fontSize: 14, color: ADMIN.textVariant, margin: 0 }}>Manage permissions, roles, and status for all platform members.</p>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 16, marginBottom: 24 }} className="md:grid-cols-4">
                <StatCard label="Total Users" value={totalUsers.toLocaleString()} trend="+12% from last month" color={ADMIN.primary} />
                <StatCard label="Active Now" value={activeUsers.toLocaleString()} live />
                <StatCard label="Managers" value={managerUsers.toLocaleString()} sub="Staff & Administrative" />
                <StatCard label="Blocked Accounts" value={blockedUsers.toLocaleString()} sub="Requires review" isError />
              </div>

              {/* Table */}
              <div style={{ backgroundColor: '#010f1f', border: `1px solid ${ADMIN.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                <div style={{ padding: 16, borderBottom: `1px solid ${ADMIN.border}`, display: 'flex', flexDirection: 'column', gap: 16, backgroundColor: ADMIN.surface }}
                  className="sm:flex-row sm:items-center sm:justify-between">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', backgroundColor: ADMIN.surfaceHighest, border: `1px solid ${ADMIN.border}`, borderRadius: 8, color: ADMIN.text, fontSize: 12, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" }}>
                      <Filter size={14} /> Filter
                    </button>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', backgroundColor: ADMIN.surfaceHighest, border: `1px solid ${ADMIN.border}`, borderRadius: 8, color: ADMIN.text, fontSize: 12, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" }}>
                      <Download size={14} /> Export
                    </button>
                  </div>
                  <span style={{ fontSize: 12, color: ADMIN.textVariant, fontFamily: "'JetBrains Mono', monospace" }}>
                    Showing {Math.min((currentPage - 1) * pageSize + 1, filteredUsers.length)}-{Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} users
                  </span>
                </div>

                {loading ? (
                  <div style={{ padding: '80px 24px', textAlign: 'center' }}>
                    <Loader2 size={24} style={{ color: ADMIN.primary, animation: 'admin-spin 1s linear infinite', margin: '0 auto 12px' }} />
                    <span style={{ fontSize: 13, color: ADMIN.textVariant }}>Loading data...</span>
                  </div>
                ) : (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <thead>
                          <tr style={{ backgroundColor: ADMIN.surfaceHigh }}>
                            <th style={thStyle}>User Account</th>
                            <th style={thStyle}>Full Name</th>
                            <th style={thStyle}>Permissions / Role</th>
                            <th style={thStyle}>Current Status</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody style={{ borderTop: `1px solid ${ADMIN.border}` }}>
                          {paginatedUsers.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ padding: '48px 24px', textAlign: 'center', color: ADMIN.textVariant, fontSize: 13 }}>
                                {searchQuery ? 'No users match your search.' : 'No users found.'}
                              </td>
                            </tr>
                          ) : paginatedUsers.map(u => (
                            <tr key={u.userId} style={{ borderBottom: `1px solid ${ADMIN.border}` }}
                              onMouseEnter={e => { e.currentTarget.style.backgroundColor = ADMIN.surface; }}
                              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                              <td style={tdStyle}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: 500, color: ADMIN.text }}>{u.userEmail}</span>
                                  <span style={{ fontSize: 10, color: ADMIN.textVariant, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>ID: {u.userId}</span>
                                </div>
                              </td>
                              <td style={tdStyle}><span>{u.userName || u.fullName || 'N/A'}</span></td>
                              <td style={tdStyle}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                  {(u.userRoles || '').split(',').filter(Boolean).map((role, idx) => (
                                    <span key={idx} style={{ padding: '1px 8px', borderRadius: 4, border: `1px solid ${ADMIN.border}`, fontSize: 10, color: role.trim() === 'Admin' ? ADMIN.primary : ADMIN.textVariant, fontFamily: "'JetBrains Mono', monospace" }}>
                                      {role.trim()}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td style={tdStyle}>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 9999,
                                  fontSize: 11, fontWeight: 700,
                                  backgroundColor: u.accountStatus === 1 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: u.accountStatus === 1 ? ADMIN.success : ADMIN.error,
                                }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'currentColor' }} />
                                  {u.accountStatus === 1 ? 'ACTIVE' : 'BLOCKED'}
                                </span>
                              </td>
                              <td style={{ ...tdStyle, textAlign: 'right' }}>
                                <div className="action-menu-container" style={{ position: 'relative', display: 'inline-block' }}>
                                  <button
                                    onClick={() => setActiveActionMenu(activeActionMenu === u.userId ? null : u.userId)}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                                      backgroundColor: ADMIN.surfaceHighest, border: `1px solid ${ADMIN.border}`, borderRadius: 8,
                                      color: ADMIN.textVariant, fontSize: 12, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = ADMIN.primary; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = ADMIN.border; }}>
                                    Manage <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: activeActionMenu === u.userId ? 'rotate(180deg)' : 'rotate(0)' }} />
                                  </button>
                                  {activeActionMenu === u.userId && (
                                    <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, width: 180, backgroundColor: ADMIN.surfaceHigh, border: `1px solid ${ADMIN.border}`, borderRadius: 8, padding: 4, zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', textAlign: 'left' }}>
                                      <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 13, color: ADMIN.textVariant, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4 }}
                                        onClick={() => { handleUpdateUserRole(u.userId, u.userEmail, u.userRoles); setActiveActionMenu(null); }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = ADMIN.surfaceHighest; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                        <ShieldCheck size={14} /> Edit Roles
                                      </button>
                                      {u.accountStatus === 1 ? (
                                        u.userId !== user?.userId && (
                                          <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 13, color: ADMIN.error, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4 }}
                                            onClick={() => { handleUpdateUserStatus(u.userId, 2); setActiveActionMenu(null); }}
                                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = ADMIN.surfaceHighest; }}
                                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                            <XCircle size={14} /> Block User
                                          </button>
                                        )
                                      ) : (
                                        <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 13, color: ADMIN.success, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4 }}
                                          onClick={() => { handleUpdateUserStatus(u.userId, 1); setActiveActionMenu(null); }}
                                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = ADMIN.surfaceHighest; }}
                                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                          <CheckCircle size={14} /> Activate
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div style={{ padding: '16px 24px', backgroundColor: ADMIN.surface, borderTop: `1px solid ${ADMIN.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        style={{ padding: '8px 16px', backgroundColor: ADMIN.surfaceHighest, border: `1px solid ${ADMIN.border}`, borderRadius: 8, color: currentPage <= 1 ? ADMIN.textVariant : ADMIN.text, fontSize: 12, cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', opacity: currentPage <= 1 ? 0.5 : 1, fontFamily: "'JetBrains Mono', monospace" }}>
                        Previous
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) pageNum = i + 1;
                          else if (currentPage <= 3) pageNum = i + 1;
                          else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                          else pageNum = currentPage - 2 + i;
                          const isCurrent = pageNum === currentPage;
                          return (
                            <button key={pageNum} onClick={() => setCurrentPage(pageNum)}
                              style={{ width: 32, height: 32, borderRadius: 8, border: 'none', backgroundColor: isCurrent ? ADMIN.primaryContainer : 'transparent', color: isCurrent ? '#2f1500' : ADMIN.textVariant, fontSize: 12, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontWeight: isCurrent ? 700 : 400, transition: 'all 0.2s ease' }}>
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        style={{ padding: '8px 16px', backgroundColor: ADMIN.surfaceHighest, border: `1px solid ${ADMIN.border}`, borderRadius: 8, color: currentPage >= totalPages ? ADMIN.textVariant : ADMIN.text, fontSize: 12, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', opacity: currentPage >= totalPages ? 0.5 : 1, fontFamily: "'JetBrains Mono', monospace" }}>
                        Next
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {activeTab === 'jobs' && (
            <div style={{ backgroundColor: '#010f1f', border: `1px solid ${ADMIN.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
              <div style={{ padding: 16, borderBottom: `1px solid ${ADMIN.border}`, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', backgroundColor: ADMIN.surface }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Filter size={14} style={{ color: ADMIN.textVariant }} />
                  <span style={{ fontSize: 11, color: ADMIN.textVariant, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.03em' }}>CATEGORY:</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['All', 'Movies', 'Showtimes', 'Schedules'].map(cat => (
                    <button key={cat} onClick={() => setJobCategoryFilter(cat)}
                      style={{ padding: '6px 12px', fontSize: 11, backgroundColor: jobCategoryFilter === cat ? ADMIN.primaryContainer : ADMIN.surfaceHighest, color: jobCategoryFilter === cat ? '#2f1500' : ADMIN.textVariant, border: `1px solid ${ADMIN.border}`, borderRadius: 6, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" }}>
                      {cat}
                    </button>
                  ))}
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: ADMIN.textVariant, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.03em' }}>SORT:</span>
                  <button onClick={() => setJobSortOrder(jobSortOrder === 'asc' ? 'desc' : 'asc')}
                    style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, backgroundColor: ADMIN.surfaceHighest, border: `1px solid ${ADMIN.border}`, borderRadius: 6, color: ADMIN.text, fontSize: 11, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" }}>
                    {jobSortOrder === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />}
                    {jobSortOrder === 'asc' ? 'Oldest' : 'Newest'}
                  </button>
                </div>
              </div>
              {loading ? (
                <div style={{ padding: '80px 24px', textAlign: 'center' }}>
                  <Loader2 size={24} style={{ color: ADMIN.primary, animation: 'admin-spin 1s linear infinite', margin: '0 auto 12px' }} />
                  <span style={{ fontSize: 13, color: ADMIN.textVariant }}>Loading jobs...</span>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead><tr style={{ backgroundColor: ADMIN.surfaceHigh }}>
                      <th style={thStyle}>Target & Category</th>
                      <th style={thStyle}>Start Schedule</th>
                      <th style={thStyle}>End Schedule</th>
                    </tr></thead>
                    <tbody>
                      {[...jobs]
                        .filter(job => jobCategoryFilter === 'All' || job.jobCategory === jobCategoryFilter)
                        .sort((a, b) => jobSortOrder === 'asc' ? (a.targetId || '').localeCompare(b.targetId || '') : (b.targetId || '').localeCompare(a.targetId || ''))
                        .map((group, idx) => (
                          <tr key={group.targetId + idx} style={{ borderBottom: `1px solid ${ADMIN.border}` }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = ADMIN.surface; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em', textTransform: 'uppercase', color: ADMIN.textVariant }}>{group.jobCategory}</span>
                                <span style={{ fontSize: 11, color: ADMIN.textMuted }}>Target: {group.targetId}</span>
                              </div>
                            </td>
                            <td style={tdStyle}>
                              {group.startScheduleJob ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  <StatusBadge status={group.startScheduleJob.scheduleJobStatus} />
                                  <span style={{ fontSize: 11, color: ADMIN.textVariant }}>{formatDate(group.startScheduleJob.jobStartedAt)}</span>
                                  {group.startScheduleJob.failedReason && <span style={{ fontSize: 10, color: ADMIN.error }}>{group.startScheduleJob.failedReason}</span>}
                                </div>
                              ) : <span style={{ color: ADMIN.textVariant, fontSize: 12 }}>N/A</span>}
                            </td>
                            <td style={tdStyle}>
                              {group.endScheduleJob ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  <StatusBadge status={group.endScheduleJob.scheduleJobStatus} />
                                  <span style={{ fontSize: 11, color: ADMIN.textVariant }}>{formatDate(group.endScheduleJob.jobStartedAt)}</span>
                                  {group.endScheduleJob.failedReason && <span style={{ fontSize: 10, color: ADMIN.error }}>{group.endScheduleJob.failedReason}</span>}
                                </div>
                              ) : <span style={{ color: ADMIN.textVariant, fontSize: 12 }}>N/A</span>}
                            </td>
                          </tr>
                        ))}
                      {jobs.filter(job => jobCategoryFilter === 'All' || job.jobCategory === jobCategoryFilter).length === 0 && (
                        <tr><td colSpan={3} style={{ padding: '48px 24px', textAlign: 'center', color: ADMIN.textVariant, fontSize: 13 }}>No background jobs found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div style={{ backgroundColor: '#010f1f', border: `1px solid ${ADMIN.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
              <div style={{ padding: '12px 16px', backgroundColor: ADMIN.surface, borderBottom: `1px solid ${ADMIN.border}` }}>
                <span style={{ fontSize: 11, color: ADMIN.textVariant, fontFamily: "'JetBrains Mono', monospace" }}>ACTIVITY LOGS • RECENT 50</span>
              </div>
              {loading ? (
                <div style={{ padding: '80px 24px', textAlign: 'center' }}>
                  <Loader2 size={24} style={{ color: ADMIN.primary, animation: 'admin-spin 1s linear infinite', margin: '0 auto 12px' }} />
                  <span style={{ fontSize: 13, color: ADMIN.textVariant }}>Loading logs...</span>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead><tr style={{ backgroundColor: ADMIN.surfaceHigh }}>
                      <th style={thStyle}>Time</th>
                      <th style={thStyle}>Action</th>
                      <th style={thStyle}>Target</th>
                      <th style={thStyle}>Actor</th>
                      <th style={thStyle}>Note</th>
                    </tr></thead>
                    <tbody>
                      {auditLogs.map(log => (
                        <tr key={log.auditLogId} style={{ borderBottom: `1px solid ${ADMIN.border}` }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = ADMIN.surface; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                          <td style={{ ...tdStyle, fontSize: 12, color: ADMIN.textVariant }}>{formatDate(log.createdAt)}</td>
                          <td style={tdStyle}>
                            <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                              backgroundColor: log.action === 'Delete' ? 'rgba(239, 68, 68, 0.15)' : log.action === 'Create' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(96, 165, 250, 0.15)',
                              color: log.action === 'Delete' ? ADMIN.error : log.action === 'Create' ? ADMIN.success : '#60a5fa' }}>
                              {log.action}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontWeight: 500, fontSize: 13 }}>{log.entityName || 'N/A'}</span>
                              <span style={{ fontSize: 10, color: ADMIN.textVariant, letterSpacing: '0.05em', fontFamily: "'JetBrains Mono', monospace" }}>{log.entityType}</span>
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontWeight: 500, fontSize: 13 }}>{log.actorName}</span>
                              <span style={{ fontSize: 10, color: ADMIN.textVariant }}>{log.isAdminAction ? 'Admin action' : log.actorPrimaryRole}</span>
                            </div>
                          </td>
                          <td style={{ ...tdStyle, fontSize: 12, color: ADMIN.textVariant }}>{log.description}</td>
                        </tr>
                      ))}
                      {auditLogs.length === 0 && (
                        <tr><td colSpan={5} style={{ padding: '48px 24px', textAlign: 'center', color: ADMIN.textVariant, fontSize: 13 }}>No audit logs found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transfer' && <TransferRightsView />}

          {activeTab === 'dashboard' && (
            <div style={{ backgroundColor: '#010f1f', border: `1px solid ${ADMIN.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', padding: 24 }}>
              {!dashboard ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <h3 style={{ color: ADMIN.text, marginBottom: 8, fontFamily: "'Manrope', sans-serif" }}>Management Dashboard</h3>
                  <p style={{ color: ADMIN.textVariant, fontSize: 13 }}>Dashboard data will appear here.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                  <DashboardCard label="Tickets Sold Today" value={dashboard.ticketsSoldToday.toString()} />
                  <DashboardCard label="Revenue Today" value={`${dashboard.revenueToday.toLocaleString()}đ`} />
                  <DashboardCard label="Total Tickets Sold" value={dashboard.totalTicketsSold.toLocaleString()} />
                  <DashboardCard label="Busiest Hour" value={dashboard.busiestHourLabel} />
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ position: 'fixed', bottom: 0, right: 0, width: 384, height: 384, backgroundColor: `${ADMIN.primary}0D`, filter: 'blur(120px)', pointerEvents: 'none', zIndex: -10 }} />
      </main>

      <LogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} onConfirm={handleLogoutConfirm} loading={logoutLoading} error={logoutError} />
      <RoleUpdateModal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} userId={selectedUserId} currentUserEmail={selectedUserEmail} currentUserRoles={selectedUserRoles} onSuccess={() => handleRoleUpdateSuccess(selectedUserId)} />
    </div>
  );
};

// Sub-components
interface StatCardProps {
  label: string; value: string;
  trend?: string; sub?: string; color?: string; live?: boolean; isError?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, trend, sub, color, live, isError }) => (
  <div style={{ padding: 20, borderRadius: 12, border: `1px solid ${ADMIN.border}`, backgroundColor: ADMIN.surface }}>
    <p style={{ fontSize: 11, color: ADMIN.textVariant, margin: '0 0 4px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.03em' }}>{label}</p>
    <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 28, fontWeight: 600, margin: 0, color: isError ? ADMIN.error : color || ADMIN.text }}>{value}</h3>
    {trend && (
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
        <TrendingUp size={12} style={{ color: ADMIN.primary }} />
        <span style={{ fontSize: 10, color: ADMIN.primary, fontFamily: "'JetBrains Mono', monospace" }}>{trend}</span>
      </div>
    )}
    {live && (
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: ADMIN.success, animation: 'admin-pulse 2s ease-in-out infinite' }} />
        <span style={{ fontSize: 10, color: ADMIN.textVariant, fontFamily: "'JetBrains Mono', monospace" }}>Live platform traffic</span>
      </div>
    )}
    {sub && !trend && !live && <p style={{ fontSize: 10, color: ADMIN.textVariant, marginTop: 8, fontFamily: "'JetBrains Mono', monospace" }}>{sub}</p>}
  </div>
);

const DashboardCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ padding: 16, backgroundColor: ADMIN.surface, borderRadius: 8, border: `1px solid ${ADMIN.border}` }}>
    <p style={{ fontSize: 11, color: ADMIN.textVariant, margin: '0 0 4px' }}>{label}</p>
    <h3 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: ADMIN.primary }}>{value}</h3>
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const color = status === 'Failed' ? ADMIN.error : status === 'Pending' ? '#f59e0b' : ADMIN.success;
  const bg = status === 'Failed' ? 'rgba(239, 68, 68, 0.15)' : status === 'Pending' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)';
  return <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 500, backgroundColor: bg, color, fontFamily: "'JetBrains Mono', monospace" }}>{status}</span>;
};

const thStyle: React.CSSProperties = {
  padding: '12px 16px', fontSize: 11, color: ADMIN.textVariant,
  fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em',
  textTransform: 'uppercase', textAlign: 'left', fontWeight: 500, whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px', fontSize: 13, verticalAlign: 'middle',
};

export default AdminPage;
