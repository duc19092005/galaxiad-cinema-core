// src/features/admin/AdminPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, LayoutDashboard, LogOut, ChevronDown, UserCircle,
  Sun, Moon, Sparkles, Loader2, Clock, CheckCircle, UserCog,
  ShieldCheck, Filter, ArrowLeftRight, SortAsc, SortDesc,
  Menu, XCircle, History,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { adminApi } from '../../api/adminApi';
import { authApi } from '../../api/authApi';
import type { AdminUserDto, AuditLogDto, GroupedScheduleJobDto } from '../../types/admin.types';
import { showSuccess, showError } from '../../utils/ToastUtils';
import LogoutModal from '../../components/LogoutModal';
import RoleUpdateModal from '../../components/RoleUpdateModal';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import TransferRightsView from './components/TransferRightsView';
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';
import { formatVietnamDateTime } from '../../utils/dateTimeUtils';

// =============================================
// SIDEBAR
// =============================================
interface SidebarProps {
  activeTab: 'users' | 'jobs' | 'transfer' | 'audit';
  onTabChange: (tab: 'users' | 'jobs' | 'transfer' | 'audit') => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'users', label: t('User Management'), icon: Users },
    { id: 'audit', label: t('Activity Logs'), icon: History },
    { id: 'jobs', label: t('Background Jobs'), icon: Clock },
    { id: 'transfer', label: t('Transfer Rights'), icon: Sparkles },
  ] as const;

  const storedUserStr = localStorage.getItem('user_info');
  const user = storedUserStr ? JSON.parse(storedUserStr) : null;

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem('user_info');
    import('js-cookie').then(Cookies => Cookies.default.remove('X-Access-Token'));
    navigate('/login');
  };

  return (
    <aside
      className="surface-elevated"
      style={{
        position: 'fixed', top: 0, left: 0, height: '100%', width: 288, zIndex: 110,
        borderRight: '1px solid var(--border)',
        transition: 'transform var(--duration) var(--ease)',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ padding: 'var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
        <div className="navbar-brand" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
          Cinema<span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>Pro</span>
        </div>
        <button onClick={onClose} className="btn-icon" style={{ display: 'inline-flex' }}>
          <XCircle size={20} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {/* Mobile user */}
        {user && (
          <div className="lg:hidden" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--accent-soft)' }}>
                <UserCircle size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="text-muted" style={{ fontSize: 'var(--text-xs)', margin: 0 }}>{t('ĐĂNG NHẬP BỞI')}</p>
                <p style={{ fontWeight: 500, margin: 0 }}>{user.username}</p>
              </div>
            </div>
            <button onClick={() => { navigate('/account'); onClose(); }} className="btn-ghost" style={{ justifyContent: 'flex-start' }}>
              <UserCircle size={16} />{t('Thông Tin Tài Khoản')}
            </button>
            {user.roles && user.roles.some((r: string) => r !== 'User' && r !== 'Cashier') && (
              <button onClick={() => { navigate('/role-selection'); onClose(); }} className="btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--success)' }}>
                <LayoutDashboard size={16} />Management Hub
              </button>
            )}
            <button onClick={() => { navigate('/role-selection'); onClose(); }} className="btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--info)' }}>
              <ArrowLeftRight size={16} />{t('Đổi Vai Trò')}
            </button>
            <button onClick={() => { handleLogout(); onClose(); }} className="btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--danger)' }}>
              <LogOut size={16} />{t('Đăng Xuất')}
            </button>
          </div>
        )}

        {/* Navigation */}
        <div>
          <p className="text-muted" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.3px', marginBottom: 'var(--space-3)' }}>
            {t('Navigation')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <button onClick={() => navigate('/home')} className="btn-ghost" style={{ justifyContent: 'flex-start' }}>
              <LayoutDashboard size={16} />{t('Back To Home')}
            </button>
            <div style={{ height: 1, backgroundColor: 'var(--border)', margin: 'var(--space-2) 0' }} />
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => { onTabChange(item.id); if (window.innerWidth < 1024) onClose(); }}
                className="btn-ghost"
                style={{
                  justifyContent: 'flex-start',
                  backgroundColor: activeTab === item.id ? 'var(--accent-soft)' : 'transparent',
                  color: activeTab === item.id ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Account (desktop) */}
        <div className="hidden lg:block" style={{ marginTop: 'auto' }}>
          <p className="text-muted" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.3px', marginBottom: 'var(--space-3)' }}>
            {t('System')}
          </p>
          <button onClick={() => navigate('/account')} className="btn-ghost" style={{ justifyContent: 'flex-start' }}>
            <UserCircle size={16} />{t('Account Info')}
          </button>
        </div>

        {/* Preferences (mobile) */}
        <div className="lg:hidden">
          <p className="text-muted" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.3px', marginBottom: 'var(--space-3)' }}>
            {t('Preferences')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{t('Language')}</span>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* Footer (desktop) */}
      <div className="hidden lg:block" style={{ padding: 'var(--space-6)', borderTop: '1px solid var(--border)' }}>
        <button onClick={() => navigate('/role-selection')} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--info)' }}>
          <ArrowLeftRight size={16} />{t('Switch Role')}
        </button>
      </div>
    </aside>
  );
};

// =============================================
// ADMIN PAGE
// =============================================

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'users' | 'jobs' | 'transfer' | 'audit'>('users');
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [jobs, setJobs] = useState<GroupedScheduleJobDto[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogDto[]>([]);
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

  // Background Jobs Filter & Sort
  const [jobCategoryFilter, setJobCategoryFilter] = useState<string>('All');
  const [jobSortOrder, setJobSortOrder] = useState<'asc' | 'desc'>('desc');

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

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    if (activeTab === 'transfer') { setLoading(false); return; }
    setLoading(true);
    try {
      if (activeTab === 'users') { const res = await adminApi.getUsers(); setUsers(res.data || []); }
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

  // -- Table renderers --
  const renderUserTable = () => (
    <table className="table-minimal">
      <thead>
        <tr>
          <Th>{t('Email')}</Th>
          <Th>{t('Full Name')}</Th>
          <Th>{t('Roles')}</Th>
          <Th>{t('Status')}</Th>
          <Th>{t('Actions')}</Th>
        </tr>
      </thead>
      <tbody>
        {users.map(u => (
          <tr key={u.userId}>
            <td className="td"><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontWeight: 500 }}>{u.userEmail}</span>
              <span className="text-muted" style={{ fontSize: '10px' }}>ID: {u.userId}</span>
            </div></td>
            <td className="td">{u.userName || u.fullName || 'N/A'}</td>
            <td className="td"><div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', justifyContent: 'center' }}>
              {(u.userRoles || '').split(',').map((role, idx) => (
                <span key={idx} className="badge badge-accent">{role.trim()}</span>
              ))}
            </div></td>
            <td className="td">
              {u.accountStatus === 1 ? (
                <span className="badge" style={{ backgroundColor: 'var(--success-soft)', color: 'var(--success)' }}>
                  <CheckCircle size={12} /> {t('Active')}
                </span>
              ) : (
                <span className="badge" style={{ backgroundColor: 'var(--danger-soft)', color: 'var(--danger)' }}>
                  <XCircle size={12} /> {t('Locked')} ({u.accountStatus})
                </span>
              )}
            </td>
            <td className="td">
              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center', alignItems: 'center' }}>
                {u.accountStatus === 1 ? (
                  u.userId !== user?.userId && (
                    <button className="btn btn-danger" style={{ fontSize: 'var(--text-xs)', padding: '4px 12px' }} onClick={() => handleUpdateUserStatus(u.userId, 2)}>
                      {t('Block')}
                    </button>
                  )
                ) : (
                  <button className="btn btn-primary" style={{ fontSize: 'var(--text-xs)', padding: '4px 12px' }} onClick={() => handleUpdateUserStatus(u.userId, 1)}>
                    {t('Activate')}
                  </button>
                )}
                <div className="action-menu-container" style={{ position: 'relative' }}>
                  <button className="btn btn-secondary" style={{ fontSize: 'var(--text-xs)', padding: '4px 12px' }}
                    onClick={(e) => { e.stopPropagation(); setActiveActionMenu(activeActionMenu === u.userId ? null : u.userId); }}>
                    <UserCog size={12} /> {t('Manage')} <ChevronDown size={10} style={{ transform: activeActionMenu === u.userId ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 300ms var(--ease)' }} />
                  </button>
                  {activeActionMenu === u.userId && (
                    <div className="card surface-elevated" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 'var(--space-2)', width: 180, padding: 'var(--space-1)', zIndex: 100, boxShadow: 'var(--shadow-lg)' }}
                      onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                      <button className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 'var(--text-sm)' }}
                        onClick={() => { handleUpdateUserRole(u.userId, u.userEmail, u.userRoles); setActiveActionMenu(null); }}>
                        <ShieldCheck size={14} /> {t('Edit Roles')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderJobsTable = () => (
    <>
      {/* Controls */}
      <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          <span className="text-muted" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.3px' }}>{t('Category')}:</span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
          {['All', 'Movies', 'Showtimes', 'Schedules'].map(cat => (
            <button key={cat} onClick={() => setJobCategoryFilter(cat)}
              className="btn btn-ghost"
              style={{
                fontSize: 'var(--text-xs)',
                backgroundColor: jobCategoryFilter === cat ? 'var(--accent-soft)' : 'transparent',
                color: jobCategoryFilter === cat ? 'var(--accent)' : 'var(--text-muted)',
              }}>
              {cat === 'All' ? t('Tất cả') : cat}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className="text-muted" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.3px' }}>{t('Sort')}:</span>
          <button onClick={() => setJobSortOrder(jobSortOrder === 'asc' ? 'desc' : 'asc')}
            className="btn btn-secondary" style={{ fontSize: 'var(--text-xs)', padding: '4px 12px' }}>
            {jobSortOrder === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />}
            {jobSortOrder === 'asc' ? t('Cũ nhất') : t('Mới nhất')}
          </button>
        </div>
      </div>

      <table className="table-minimal">
        <thead>
          <tr>
            <Th>{t('Target & Category')}</Th>
            <Th>{t('Start Schedule')}</Th>
            <Th>{t('End Schedule')}</Th>
          </tr>
        </thead>
        <tbody>
          {[...jobs]
            .filter(job => jobCategoryFilter === 'All' || job.jobCategory === jobCategoryFilter)
            .sort((a, b) => jobSortOrder === 'asc' ? (a.targetId || '').localeCompare(b.targetId || '') : (b.targetId || '').localeCompare(a.targetId || ''))
            .map((group, idx) => (
              <tr key={group.targetId + idx}>
                <td className="td">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.3em', textTransform: 'uppercase' }}>{group.jobCategory}</span>
                    <span className="text-muted" style={{ fontSize: '10px' }}>{t('Target')}: {group.targetId}</span>
                  </div>
                </td>
                <td className="td">
                  {group.startScheduleJob ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <StatusBadge status={group.startScheduleJob.scheduleJobStatus} />
                      <span className="text-muted" style={{ fontSize: '10px' }}>{formatDate(group.startScheduleJob.jobStartedAt)}</span>
                      {group.startScheduleJob.failedReason && <span className="text-muted" style={{ fontSize: '10px', color: 'var(--danger)' }}>{group.startScheduleJob.failedReason}</span>}
                    </div>
                  ) : <span className="text-muted">N/A</span>}
                </td>
                <td className="td">
                  {group.endScheduleJob ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <StatusBadge status={group.endScheduleJob.scheduleJobStatus} />
                      <span className="text-muted" style={{ fontSize: '10px' }}>{formatDate(group.endScheduleJob.jobStartedAt)}</span>
                      {group.endScheduleJob.failedReason && <span className="text-muted" style={{ fontSize: '10px', color: 'var(--danger)' }}>{group.endScheduleJob.failedReason}</span>}
                    </div>
                  ) : <span className="text-muted">N/A</span>}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </>
  );

  const renderAuditTable = () => (
    <table className="table-minimal">
      <thead>
        <tr>
          <Th>Time</Th>
          <Th>Action</Th>
          <Th>Target</Th>
          <Th>Actor</Th>
          <Th>Note</Th>
        </tr>
      </thead>
      <tbody>
        {auditLogs.map(log => (
          <tr key={log.auditLogId}>
            <td className="td" style={{ fontSize: 'var(--text-xs)' }}>{formatDate(log.createdAt)}</td>
            <td className="td">
              <span className="badge" style={{
                backgroundColor: log.action === 'Delete' ? 'var(--danger-soft)' : log.action === 'Create' ? 'var(--success-soft)' : 'var(--info-soft)',
                color: log.action === 'Delete' ? 'var(--danger)' : log.action === 'Create' ? 'var(--success)' : 'var(--info)',
              }}>
                {log.action}
              </span>
            </td>
            <td className="td">
              <div style={{ fontWeight: 500 }}>{log.entityName || 'N/A'}</div>
              <div className="text-muted" style={{ fontSize: '10px', letterSpacing: '0.3em' }}>{log.entityType}</div>
            </td>
            <td className="td">
              <div style={{ fontWeight: 500 }}>{log.actorName}</div>
              <div className="text-muted" style={{ fontSize: '10px' }}>{log.isAdminAction ? 'Admin action' : log.actorPrimaryRole}</div>
            </td>
            <td className="td" style={{ fontSize: 'var(--text-xs)' }}>{log.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {isSidebarOpen && (
        <div className="overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* HEADER */}
      <header className="navbar" style={{ position: 'fixed', left: 288 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button onClick={() => setIsSidebarOpen(true)} className="btn-icon">
            <Menu size={20} />
          </button>
          <div className="navbar-brand" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
            CinemaPro
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div className="hidden lg:block">
            <LanguageSwitcher />
          </div>

          {/* Theme dropdown (desktop) */}
          <div className="hidden lg:block relative" ref={themeDropdownRef}>
            <button onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)} className="btn btn-secondary" style={{ padding: '6px 12px', gap: 'var(--space-2)', height: 'auto' }}>
              {theme === 'dark' ? <Moon size={14} /> : theme === 'modern' ? <Sparkles size={14} /> : <Sun size={14} />}
              <span style={{ fontSize: 'var(--text-sm)' }}>{theme === 'dark' ? t('Dark Mode') : theme === 'modern' ? t('Modern View') : t('Light Mode')}</span>
              <ChevronDown size={12} style={{ transition: 'transform 300ms var(--ease)', transform: isThemeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>
            {isThemeDropdownOpen && (
              <div className="card surface-elevated" style={{ position: 'absolute', right: 0, marginTop: 'var(--space-2)', width: 200, padding: 'var(--space-1)', boxShadow: 'var(--shadow-lg)', zIndex: 100 }}>
                <div style={{ padding: 'var(--space-2) var(--space-3)', borderBottom: '1px solid var(--border)' }}>
                  <p className="text-muted" style={{ fontSize: 'var(--text-xs)', margin: 0 }}>{t('Select Theme')}</p>
                </div>
                {(['light', 'dark', 'modern'] as const).map(tMode => (
                  <button key={tMode} onClick={() => { setTheme(tMode); setIsThemeDropdownOpen(false); }}
                    className="btn-ghost" style={{
                      width: '100%', justifyContent: 'flex-start', fontSize: 'var(--text-sm)',
                      backgroundColor: theme === tMode ? 'var(--accent-soft)' : 'transparent',
                      color: theme === tMode ? 'var(--accent)' : 'var(--text-secondary)',
                    }}>
                    {tMode === 'light' ? <Sun size={14} /> : tMode === 'dark' ? <Moon size={14} /> : <Sparkles size={14} />}
                    {tMode === 'light' ? t('Light Mode') : tMode === 'dark' ? t('Dark Mode') : t('Modern View')}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="btn btn-secondary" style={{ padding: '2px 12px 2px 2px', gap: 'var(--space-2)', height: 'auto', borderRadius: 'var(--radius-full)', borderColor: 'var(--border)' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--accent-soft)' }}>
                <UserCircle size={16} style={{ color: 'var(--accent)' }} />
              </div>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{user?.username || 'Guest'}</span>
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
                <button onClick={() => setIsLogoutModalOpen(true)} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 'var(--text-sm)', color: 'var(--danger)' }}>
                  <LogOut size={14} />{t('header.logout')}
                </button>
              </div>
            )}
          </div>

          <button onClick={() => setIsSidebarOpen(true)} className="btn-icon">
            <UserCircle size={20} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{ paddingTop: 'var(--space-14)', paddingLeft: 288, minHeight: '100vh' }}>
        <div className="card" style={{ margin: 'var(--space-6)', overflow: 'hidden' }}>
          {loading ? (
            <div className="state-center" style={{ minHeight: 200 }}>
              <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
              <span>Loading data...</span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              {activeTab === 'users' && renderUserTable()}
              {activeTab === 'jobs' && renderJobsTable()}
              {activeTab === 'audit' && renderAuditTable()}
              {activeTab === 'transfer' && <TransferRightsView />}
            </div>
          )}
          {!loading && (
            <>
              {(activeTab === 'users' && users.length === 0) ||
               (activeTab === 'jobs' && jobs.length === 0) ||
               (activeTab === 'audit' && auditLogs.length === 0) ? (
                <div className="state-center" style={{ minHeight: 100 }}>No data available.</div>
              ) : null}
            </>
          )}
        </div>
      </main>

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        loading={logoutLoading}
        error={logoutError}
      />
      <RoleUpdateModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        userId={selectedUserId}
        currentUserEmail={selectedUserEmail}
        currentUserRoles={selectedUserRoles}
        onSuccess={() => handleRoleUpdateSuccess(selectedUserId)}
      />
    </div>
  );
};

// Sub-components
const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th className="th">{children}</th>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const color = status === 'Failed' ? 'var(--danger)' : status === 'Pending' ? 'var(--warning)' : 'var(--success)';
  const bg = status === 'Failed' ? 'var(--danger-soft)' : status === 'Pending' ? 'var(--warning-soft)' : 'var(--success-soft)';
  return <span className="badge" style={{ backgroundColor: bg, color }}>{status}</span>;
};

export default AdminPage;
