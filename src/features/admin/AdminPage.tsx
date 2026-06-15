// src/features/admin/AdminPage.tsx
// Complete redesign with dark cinema theme

import React, { useCallback, useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  ShieldAlert,
  KeyRound,
  Activity,
  Film,
  Calendar,
  DollarSign,
  Ticket,
  Camera,
  Search,
  Loader2,
  RefreshCw,
  UserCircle,
  CheckCircle,
  XCircle,
  UserPlus,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import AppSidebar from '../../components/AppSidebar';
import type { SidebarSection } from '../../components/AppSidebar';
import ManagementChrome from '../../components/ManagementChrome';
import ManagementDashboard from '../../components/ManagementDashboard';
import TransferRightsView from './components/TransferRightsView';
import RolePermissionsSection from './components/RolePermissionsSection';
import { adminApi } from '../../api/adminApi';
import type { AdminUserDto, AuditLogDto, ManagementDashboardDto, RoleDto } from '../../types/admin.types';
import RoleUpdateModal from '../../components/RoleUpdateModal';
import CinemaAssignModal from '../../components/CinemaAssignModal';
import { showSuccess, showError } from '../../utils/ToastUtils';
import { VouchersSection } from './components/VouchersSection';
import CinemaManagement from '../facilities/components/CinemaManagement';
import { facilitiesApi } from '../../api/facilitiesApi';
import type { Cinema } from '../../types/facilities.types';

// ============================================
// CONSTANTS
// ============================================

const statsCardStyle: React.CSSProperties = {
  padding: '18px 20px',
  background: 'linear-gradient(145deg, rgba(255,255,255,0.02), rgba(255,255,255,0.005)), var(--bg-surface)',
  backdropFilter: 'blur(18px) saturate(1.25)',
  WebkitBackdropFilter: 'blur(18px) saturate(1.25)',
  border: '1px solid var(--border-color)',
  borderRadius: 12,
  boxShadow: '0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.04)',
};

const getAdminErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== 'object' || error === null) return fallback;
  const response = (error as { response?: { data?: { message?: string; Message?: string } } }).response;
  return response?.data?.message ?? response?.data?.Message ?? fallback;
};

const formatCompactNumber = (value?: number | null) => (value ?? 0).toLocaleString('vi-VN');
const adminTabIds = new Set(['dashboard', 'users', 'cinemas', 'vouchers', 'permissions', 'rights', 'audit']);

const formatVnd = (value?: number | null) => {
  const amount = value ?? 0;
  if (Math.abs(amount) >= 1_000_000_000) return `VND ${(amount / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}B`;
  if (Math.abs(amount) >= 1_000_000) return `VND ${(amount / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}M`;
  return `VND ${amount.toLocaleString('vi-VN')}`;
};

// ============================================
// STAT CARD COMPONENT
// ============================================
const StatCard: React.FC<{
  label: string;
  value: string;
  trend?: string;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}> = ({ label, value, trend, icon, color, delay = 0 }) => (
  <div
    style={{
      ...statsCardStyle,
      animation: 'fadeIn 0.4s ease-out forwards',
      opacity: 0,
      animationDelay: `${delay}ms`,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}1A`,
        color,
      }}>
        {icon}
      </div>
      {trend && (
        <span style={{
          fontSize: 10, color: 'var(--text-muted)',
          fontFamily: "'JetBrains Mono', monospace",
          background: 'rgba(255,255,255,0.03)',
          padding: '2px 10px', borderRadius: 999,
        }}>
          {trend}
        </span>
      )}
    </div>
    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px', fontWeight: 500 }}>{label}</p>
    <p style={{ fontSize: 30, fontWeight: 850, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>{value}</p>
  </div>
);

const AdminRevenueChart: React.FC<{ data?: ManagementDashboardDto | null }> = ({ data }) => {
  const revenueRows = data?.revenueByDay?.length
    ? data.revenueByDay
    : Array.from({ length: 7 }, (_, index) => ({
      date: '',
      dateLabel: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
      revenue: 0,
      ticketCount: 0,
    }));
  const maxRevenue = Math.max(...revenueRows.map((row) => row.revenue), 1);

  return (
    <section className="admin-dashboard-card" style={{ padding: 24, minHeight: 420 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em' }}>Revenue Overview</h3>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Daily gross revenue comparison across all regions.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><i style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--accent)' }} /> Revenue</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><i style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--success)' }} /> Tickets</span>
        </div>
      </div>

      <div style={{
        height: 300,
        display: 'grid',
        gridTemplateColumns: `repeat(${revenueRows.length}, minmax(34px, 1fr))`,
        alignItems: 'end',
        gap: 14,
        padding: '24px 4px 0',
        borderBottom: '1px solid var(--border-color)',
        backgroundImage: 'linear-gradient(to top, rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '100% 25%',
      }}>
        {revenueRows.map((row) => {
          const revenueHeight = Math.max(4, Math.round((row.revenue / maxRevenue) * 100));
          const ticketHeight = Math.max(4, Math.min(100, row.ticketCount * 8));
          return (
            <div key={`${row.dateLabel}-${row.date}`} style={{ height: '100%', display: 'grid', alignItems: 'end', gap: 10 }}>
              <div style={{ height: '100%', display: 'flex', alignItems: 'end', justifyContent: 'center', gap: 5 }}>
                <div title={`Revenue ${row.revenue.toLocaleString('vi-VN')} VND`} style={{
                  width: '38%',
                  maxWidth: 30,
                  height: `${revenueHeight}%`,
                  borderRadius: '8px 8px 2px 2px',
                  background: 'linear-gradient(180deg, #ffc174, #ff8a00)',
                  boxShadow: '0 10px 24px rgba(255,138,0,0.24)',
                }} />
                <div title={`${row.ticketCount} tickets`} style={{
                  width: '26%',
                  maxWidth: 20,
                  height: `${ticketHeight}%`,
                  borderRadius: '8px 8px 2px 2px',
                  background: 'rgba(34,197,94,0.78)',
                }} />
              </div>
              <span style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' }}>
                {row.dateLabel}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const AdminOpsTiles: React.FC<{ data?: ManagementDashboardDto | null }> = ({ data }) => {
  const topMovie = data?.hotMovies?.[0];
  const latestTransaction = data?.recentTransactions?.[0];
  const latestCinema = data?.recentCinemas?.[0];

  return (
  <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
    <div className="admin-dashboard-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, borderLeft: '4px solid var(--accent)' }}>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Top Movie</p>
        <h4 style={{ margin: 0, fontSize: 22, fontWeight: 850 }}>{topMovie?.movieName || 'No ticket data'}</h4>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
          {formatCompactNumber(topMovie?.ticketsSold)} tickets sold
        </p>
      </div>
      <Film size={34} style={{ color: 'var(--accent)' }} />
    </div>

    <div className="admin-dashboard-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, borderLeft: '4px solid var(--success)' }}>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Latest Booking</p>
        <h4 style={{ margin: 0, fontSize: 22, fontWeight: 850 }}>{latestTransaction?.movieName || 'No recent booking'}</h4>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
          {latestTransaction ? formatVnd(latestTransaction.totalPrice) : 'Waiting for paid orders'}
        </p>
      </div>
      <CheckCircle size={36} style={{ color: 'var(--success)' }} />
    </div>

    <div className="admin-dashboard-card" style={{
      padding: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      borderColor: 'rgba(255,138,0,0.28)',
      background: 'linear-gradient(120deg, rgba(255,138,0,0.16), rgba(255,255,255,0.035))',
    }}>
      <div>
        <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--accent)', fontWeight: 800 }}>Latest Branch</p>
        <h4 style={{ margin: 0, fontSize: 18, fontWeight: 850 }}>{latestCinema?.cinemaName || 'No cinema activity yet'}</h4>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
          {latestCinema?.cinemaLocation || `${formatCompactNumber(data?.totalCinemas)} cinemas in the system`}
        </p>
      </div>
      <button className="btn btn-primary" style={{ minWidth: 132 }}>View branches</button>
    </div>
  </section>
  );
};

// ============================================
// STATUS BADGE
// ============================================
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const color =
    status === 'Active' || status === 'Success' ? 'var(--success)' :
    status === 'Pending' || status === 'Pending' ? '#f59e0b' :
    'var(--danger)';

  const bg =
    status === 'Active' || status === 'Success' ? 'rgba(34, 197, 94, 0.1)' :
    status === 'Pending' ? 'rgba(245, 158, 11, 0.1)' :
    'rgba(239, 68, 68, 0.1)';

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 999,
      fontSize: 11, fontWeight: 600,
      fontFamily: "'JetBrains Mono', monospace",
      background: bg, color,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
      {status}
    </span>
  );
};

const UserPortrait: React.FC<{ src?: string | null; name?: string; size?: number }> = ({ src, name, size = 32 }) => (
  <div style={{
    width: size,
    height: size,
    borderRadius: '50%',
    overflow: 'hidden',
    background: 'var(--accent-soft)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    border: '1px solid var(--border-color)',
  }}>
    {src ? (
      <img
        src={src}
        alt={name ? `${name} portrait` : 'User portrait'}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    ) : (
      <UserCircle size={Math.max(16, size * 0.52)} style={{ color: 'var(--accent)' }} />
    )}
  </div>
);

// Database-backed real Admin Page

// ============================================
// SECTION COMPONENTS
// ============================================

interface UsersSectionProps {
  users: AdminUserDto[];
  loading: boolean;
  onUpdateStatus: (userId: string, newStatus: number) => void;
  onUpdateRole: (userId: string, email: string, roles: string) => void;
  onAssignCinema: (userId: string, email: string) => void;
  onCreateUser: () => void;
}

const UsersSection: React.FC<UsersSectionProps> = ({
  users,
  loading,
  onUpdateStatus,
  onUpdateRole,
  onAssignCinema,
  onCreateUser,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = users.filter(u =>
    u.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.userName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('User Management')}</h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{t('Manage system users and their roles')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="relative">
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={t('Search users...')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input"
              style={{ paddingLeft: 32, width: 240 }}
            />
          </div>
          <button
            onClick={onCreateUser}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
          >
            <UserPlus size={16} />
            {t('Add User')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="state-center" style={{ minHeight: '30vh' }}>
            <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              {t('Loading users...')}
            </p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('Name')}</th>
                <th>{t('Email')}</th>
                <th>{t('Role')}</th>
                <th>{t('Status')}</th>
                <th style={{ width: 300 }}>{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.userId}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <UserPortrait src={user.portraitImageUrl} name={user.fullName || user.userName} />
                      <span style={{ fontWeight: 600 }}>{user.fullName || user.userName || 'N/A'}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{user.userEmail}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(user.userRoles || '').split(',').filter(Boolean).map((role, idx) => (
                        <span key={idx} className={`badge ${role.trim() === 'Admin' ? 'badge-accent' : role.trim() === 'MovieManager' || role.trim() === 'TheaterManager' ? 'badge-warning' : 'badge-success'}`}>
                          {role.trim()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={user.accountStatus === 1 ? 'Active' : 'Locked'} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {user.accountStatus === 1 ? (
                        <button
                          onClick={() => onUpdateStatus(user.userId, 2)}
                          className="btn"
                          style={{
                            padding: '4px 10px', fontSize: 12, height: 28, minHeight: 0,
                            borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--danger)',
                            background: 'rgba(239, 68, 68, 0.05)',
                          }}
                        >
                          {t('Block')}
                        </button>
                      ) : (
                        <button
                          onClick={() => onUpdateStatus(user.userId, 1)}
                          className="btn"
                          style={{
                            padding: '4px 10px', fontSize: 12, height: 28, minHeight: 0,
                            borderColor: 'rgba(34, 197, 94, 0.4)', color: 'var(--success)',
                            background: 'rgba(34, 197, 94, 0.05)',
                          }}
                        >
                          {t('Activate')}
                        </button>
                      )}
                      <button
                        onClick={() => onUpdateRole(user.userId, user.userEmail, user.userRoles)}
                        className="btn"
                        style={{
                          padding: '4px 10px', fontSize: 12, height: 28, minHeight: 0,
                          borderColor: 'rgba(99, 102, 241, 0.4)', color: '#818cf8',
                          background: 'rgba(99, 102, 241, 0.05)',
                        }}
                      >
                        {t('Role')}
                      </button>
                      <button
                        onClick={() => onAssignCinema(user.userId, user.userEmail)}
                        className="btn"
                        style={{
                          padding: '4px 10px', fontSize: 12, height: 28, minHeight: 0,
                          borderColor: 'rgba(236, 72, 153, 0.4)', color: '#f472b6',
                          background: 'rgba(236, 72, 153, 0.05)',
                        }}
                      >
                        {t('Assign Cinema')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    {t('No users found.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};



interface AuditSectionProps {
  auditLogs: AuditLogDto[];
  loading: boolean;
  onRefresh: () => void;
}

const AuditSection: React.FC<AuditSectionProps> = ({ auditLogs, loading, onRefresh }) => {
  const { t } = useTranslation();

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('Audit Log')}</h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{t('System activity and security events')}</p>
        </div>
        <button className="btn btn-secondary" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={14} style={{ marginRight: 6, animation: loading ? 'spin 1s linear infinite' : undefined }} />
          {t('Refresh')}
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="state-center" style={{ minHeight: '30vh' }}>
            <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              {t('Loading audit logs...')}
            </p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('Time')}</th>
                <th>{t('Action')}</th>
                <th>{t('Target')}</th>
                <th>{t('Actor')}</th>
                <th>{t('Note')}</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => {
                const actionColor =
                  log.action === 'Delete' ? 'var(--danger)' :
                  log.action === 'Create' ? 'var(--success)' :
                  '#3b82f6';
                const actionBg =
                  log.action === 'Delete' ? 'rgba(239, 68, 68, 0.1)' :
                  log.action === 'Create' ? 'rgba(34, 197, 94, 0.1)' :
                  'rgba(59, 130, 246, 0.1)';

                return (
                  <tr key={log.auditLogId}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                      {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : 'N/A'}
                    </td>
                    <td>
                      <span className="badge" style={{ color: actionColor, background: actionBg, borderColor: `${actionColor}33`, fontWeight: 600 }}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 600 }}>{log.entityName || 'N/A'}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                          {log.entityType}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 600 }}>{log.actorName}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                          {log.isAdminAction ? t('Admin Action') : log.actorPrimaryRole}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                      {log.description}
                    </td>
                  </tr>
                );
              })}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    {t('No audit logs found.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ============================================
// MAIN ADMIN PAGE
// ============================================

const AdminPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tab } = useParams();
  const initialTab = tab && adminTabIds.has(tab) ? tab : 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Real data states
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogDto[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<ManagementDashboardDto | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [staffRoles, setStaffRoles] = useState<RoleDto[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [cinemasLoading, setCinemasLoading] = useState(false);

  // Modals state
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [cinemaModalOpen, setCinemaModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [selectedUserRoles, setSelectedUserRoles] = useState('');

  // Create User Modal
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [createUserSubmitting, setCreateUserSubmitting] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    userName: '',
    userEmail: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    identityCode: '',
    phoneNumber: '',
    dateOfBirth: '',
    roleIds: [] as string[],
  });
  const [createUserPortraitFile, setCreateUserPortraitFile] = useState<File | null>(null);
  const [createUserPortraitPreview, setCreateUserPortraitPreview] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await adminApi.getUsers();
      setUsers(res.data || []);
    } catch {
      showError(t('toast.loadDataFailed'));
    } finally {
      setUsersLoading(false);
    }
  }, [t]);

  const fetchAuditLogs = useCallback(async () => {
    setAuditLogsLoading(true);
    try {
      const res = await adminApi.getRecentAuditLogs(50);
      setAuditLogs(res.data || []);
    } catch {
      showError(t('toast.loadDataFailed'));
    } finally {
      setAuditLogsLoading(false);
    }
  }, [t]);

  const fetchDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const res = await adminApi.getManagementDashboard();
      setDashboardData(res.data || null);
      setAuditLogs(res.data?.recentActivities || []);
    } catch {
      showError(t('toast.loadDataFailed'));
    } finally {
      setDashboardLoading(false);
    }
  }, [t]);

  const fetchStaffRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const res = await adminApi.getRoles();
      setStaffRoles(res.data || []);
    } catch (err) {
      showError(getAdminErrorMessage(err, 'Unable to load roles.'));
    } finally {
      setRolesLoading(false);
    }
  }, []);

  const fetchCinemas = useCallback(async () => {
    setCinemasLoading(true);
    try {
      const res = await facilitiesApi.getCinemaList();
      setCinemas(res.data || []);
    } catch {
      showError(t('toast.loadDataFailed'));
    } finally {
      setCinemasLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const nextTab = tab && adminTabIds.has(tab) ? tab : 'dashboard';
    setActiveTab(nextTab);
  }, [tab]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    } else if (activeTab === 'cinemas') {
      fetchCinemas();
    } else if (activeTab === 'dashboard') {
      fetchDashboard();
    }
  }, [activeTab, fetchAuditLogs, fetchDashboard, fetchCinemas, fetchUsers]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleUpdateUserStatus = async (userId: string, newStatus: number) => {
    try {
      await adminApi.updateUserStatus(userId, newStatus);
      showSuccess(t('toast.userStatusUpdated'));
      fetchUsers();
    } catch (err) {
      showError(getAdminErrorMessage(err, t('toast.userStatusUpdateFailed')));
    }
  };

  const handleOpenRoleModal = (userId: string, email: string, roles: string) => {
    setSelectedUserId(userId);
    setSelectedUserEmail(email);
    setSelectedUserRoles(roles);
    setRoleModalOpen(true);
  };

  const handleOpenCinemaModal = (userId: string, email: string) => {
    setSelectedUserId(userId);
    setSelectedUserEmail(email);
    setCinemaModalOpen(true);
  };

  const handleRoleUpdateSuccess = () => {
    fetchUsers();
  };

  const handleCinemaAssignSuccess = () => {
    fetchUsers();
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    navigate(tabId === 'dashboard' ? '/admin' : `/admin/${tabId}`);
  };

  const handleOpenCreateUser = () => {
    setCreateUserForm({
      userName: '',
      userEmail: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      identityCode: '',
      phoneNumber: '',
      dateOfBirth: '',
      roleIds: [],
    });
    setCreateUserPortraitFile(null);
    setCreateUserPortraitPreview(null);
    setCreateUserModalOpen(true);
    if (staffRoles.length === 0) {
      fetchStaffRoles();
    }
  };

  const toggleCreateRole = (roleId: string) => {
    setCreateUserForm((current) => ({
      ...current,
      roleIds: current.roleIds.includes(roleId)
        ? current.roleIds.filter((id) => id !== roleId)
        : [...current.roleIds, roleId],
    }));
  };

  const handleCreateUserPortraitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError('Please choose an image file.');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError('Portrait image must be under 5MB.');
      event.target.value = '';
      return;
    }

    setCreateUserPortraitFile(file);
    const reader = new FileReader();
    reader.onload = () => setCreateUserPortraitPreview(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createUserForm.password !== createUserForm.confirmPassword) {
      showError('Passwords do not match.');
      return;
    }
    if (createUserForm.password.length < 8) {
      showError('Password must be at least 8 characters.');
      return;
    }
    if (!/^\d{12}$/.test(createUserForm.identityCode)) {
      showError('Identity code must be exactly 12 digits.');
      return;
    }
    if (!/^\d{10}$/.test(createUserForm.phoneNumber)) {
      showError('Phone number must be exactly 10 digits.');
      return;
    }
    if (!createUserForm.dateOfBirth) {
      showError('Date of birth is required.');
      return;
    }
    setCreateUserSubmitting(true);
    try {
      const res = await adminApi.createUser({
        userName: createUserForm.userName,
        userEmail: createUserForm.userEmail,
        userPassword: createUserForm.password,
        userRepassword: createUserForm.confirmPassword,
        identityCode: createUserForm.identityCode,
        phoneNumber: createUserForm.phoneNumber,
        dateOfBirth: new Date(`${createUserForm.dateOfBirth}T00:00:00`).toISOString(),
        roleIds: createUserForm.roleIds,
      });
      if (res.isSuccess) {
        const createdUserId = res.data?.userId;
        if (createUserPortraitFile && createdUserId) {
          try {
            await adminApi.updateUserPortrait(createdUserId, createUserPortraitFile);
            showSuccess('User account and portrait created successfully!');
          } catch (portraitError) {
            showError(getAdminErrorMessage(portraitError, 'Account created, but portrait upload failed.'));
          }
        } else {
          showSuccess('User account created successfully!');
        }
        setCreateUserModalOpen(false);
        setCreateUserPortraitFile(null);
        setCreateUserPortraitPreview(null);
        fetchUsers();
      } else {
        showError(res.message || 'Failed to create user.');
      }
    } catch (err) {
      showError(getAdminErrorMessage(err, 'Failed to create user account.'));
    } finally {
      setCreateUserSubmitting(false);
    }
  };

  const sidebarSections: SidebarSection[] = [
    {
      items: [
        { id: 'dashboard', label: t('Dashboard'), icon: <LayoutDashboard size={18} /> },
        { id: 'users', label: t('Users'), icon: <Users size={18} /> },
        { id: 'cinemas', label: t('Cinemas'), icon: <Building2 size={18} /> },
        { id: 'vouchers', label: t('Vouchers'), icon: <Ticket size={18} /> },
        { id: 'permissions', label: t('Permissions'), icon: <KeyRound size={18} /> },
        { id: 'rights', label: t('Transfer Rights'), icon: <ShieldAlert size={18} /> },
        { id: 'audit', label: t('Audit Log'), icon: <Activity size={18} /> },
      ],
    },
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="state-center" style={{ minHeight: '60vh' }}>
          <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
            Loading admin panel...
          </p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="animate-in admin-dashboard-canvas" style={{ display: 'grid', gap: 22 }}>
            <section className="admin-dashboard-hero" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--accent)', fontWeight: 850, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  CinemaPro Admin
                </p>
                <h1 style={{ margin: 0, fontSize: 'clamp(32px, 4vw, 46px)', lineHeight: 1.05, fontWeight: 900, letterSpacing: '-0.035em' }}>
                  Performance Dashboard
                </h1>
                <p style={{ margin: '10px 0 0', fontSize: 15, color: 'var(--text-secondary)', maxWidth: 620, lineHeight: 1.6 }}>
                  Real-time overview of cinema operations, revenue, access control, and system activity.
                </p>
              </div>
              <div style={{
                display: 'inline-flex',
                gap: 6,
                padding: 5,
                borderRadius: 12,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-surface)',
              }}>
                <button className="btn btn-primary" style={{ minHeight: 36, padding: '8px 14px' }}>Last 30 days</button>
                <button className="btn btn-secondary" style={{ minHeight: 36, padding: '8px 14px' }}>Quarter</button>
                <button className="btn btn-secondary" style={{ minHeight: 36, width: 38, padding: 0 }} aria-label="Calendar filter">
                  <Calendar size={16} />
                </button>
              </div>
            </section>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 16,
            }}>
              <StatCard
                label={t('Total Users')}
                value={dashboardLoading ? '...' : formatCompactNumber(dashboardData?.activeUsers)}
                trend="Live data"
                icon={<Users size={22} />}
                color="#ff8a00"
                delay={0}
              />
              <StatCard
                label={t('Total Cinemas')}
                value={dashboardLoading ? '...' : formatCompactNumber(dashboardData?.totalCinemas)}
                trend="Live data"
                icon={<Building2 size={22} />}
                color="var(--success)"
                delay={80}
              />
              <StatCard
                label={t('Active Movies')}
                value={dashboardLoading ? '...' : formatCompactNumber(dashboardData?.activeMovies)}
                trend="Live data"
                icon={<Film size={22} />}
                color="#b7c8e1"
                delay={160}
              />
              <StatCard
                label={t('Revenue (Month)')}
                value={dashboardLoading ? '...' : formatVnd(dashboardData?.monthRevenue)}
                trend="Paid orders"
                icon={<DollarSign size={22} />}
                color="#ffc174"
                delay={240}
              />
              <StatCard
                label={t('Total Bookings')}
                value={dashboardLoading ? '...' : formatCompactNumber(dashboardData?.totalBookings)}
                trend="Paid tickets"
                icon={<Ticket size={22} />}
                color="#d3e4fe"
                delay={320}
              />
              <StatCard
                label={t('Active Schedules')}
                value={dashboardLoading ? '...' : formatCompactNumber(dashboardData?.activeSchedules)}
                trend="Active only"
                icon={<Calendar size={22} />}
                color="#f59e0b"
                delay={400}
              />
            </div>

            <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', gap: 16 }} className="admin-dashboard-main-grid">
              <AdminRevenueChart data={dashboardData} />
              <div className="admin-dashboard-card" style={{ padding: 24, minHeight: 420 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>
                {t('Recent Activity')}
              </h3>
              {dashboardLoading || auditLogsLoading ? (
                <div className="state-center" style={{ minHeight: 100 }}>
                  <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {auditLogs.slice(0, 4).map((log) => (
                    <div
                      key={log.auditLogId}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: log.action === 'Delete' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                      }}>
                        {log.action === 'Delete'
                          ? <XCircle size={14} style={{ color: 'var(--danger)' }} />
                          : <CheckCircle size={14} style={{ color: 'var(--success)' }} />
                        }
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{log.action}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                          {log.actorName} to {log.entityName}
                        </p>
                      </div>
                      <span style={{
                        fontSize: 10, color: 'var(--text-muted)',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : 'N/A'}
                      </span>
                    </div>
                  ))}
                  {auditLogs.length === 0 && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
                      {t('No recent activity.')}
                    </p>
                  )}
                </div>
              )}
              </div>
            </section>

            <AdminOpsTiles data={dashboardData} />
          </div>
        );

      case 'users':
        return (
          <UsersSection
            users={users}
            loading={usersLoading}
            onUpdateStatus={handleUpdateUserStatus}
            onUpdateRole={handleOpenRoleModal}
            onAssignCinema={handleOpenCinemaModal}
            onCreateUser={handleOpenCreateUser}
          />
        );

      case 'vouchers':
        return <VouchersSection />;

      case 'cinemas':
        return (
          <div className="animate-in">
            <CinemaManagement
              cinemas={cinemas}
              loading={cinemasLoading}
              onRefresh={fetchCinemas}
            />
          </div>
        );

      case 'permissions':
        return <RolePermissionsSection />;

      case 'rights':
        return <TransferRightsView />;

      case 'audit':
        return (
          <AuditSection
            auditLogs={auditLogs}
            loading={auditLogsLoading}
            onRefresh={fetchAuditLogs}
          />
        );

      default:
        return <ManagementDashboard role="admin" />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <AppSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((open) => !open)}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        sections={sidebarSections}
        role="Admin"
        collapsibleDesktop
      />

      <ManagementChrome
        sidebarOpen={sidebarOpen}
        onSidebarToggle={() => setSidebarOpen((open) => !open)}
      />

      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`} style={{ paddingTop: 0 }}>
        <div className="page-container">
          {renderContent()}
        </div>
      </main>

      <RoleUpdateModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        userId={selectedUserId}
        currentUserEmail={selectedUserEmail}
        currentUserRoles={selectedUserRoles}
        onSuccess={handleRoleUpdateSuccess}
      />

      <CinemaAssignModal
        isOpen={cinemaModalOpen}
        onClose={() => setCinemaModalOpen(false)}
        userId={selectedUserId}
        currentUserEmail={selectedUserEmail}
        onSuccess={handleCinemaAssignSuccess}
      />

      {/* Create User Modal */}
      {createUserModalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            padding: 16,
          }}
          onClick={() => setCreateUserModalOpen(false)}
        >
          <div
            style={{
              width: '100%', maxWidth: 680,
              backgroundColor: 'var(--bg-elevated, #18181b)',
              border: '1px solid var(--border-color, #27272a)',
              borderRadius: 20, boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color, #27272a)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <UserPlus size={20} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Create New Account</h3>
              </div>
              <button
                onClick={() => setCreateUserModalOpen(false)}
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUser} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '78vh', overflowY: 'auto' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '96px 1fr',
                gap: 16,
                alignItems: 'center',
                padding: 14,
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(255,255,255,0.025)',
              }}>
                <label htmlFor="create-user-portrait" style={{
                  width: 96,
                  height: 96,
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed rgba(255, 138, 0, 0.45)',
                  background: 'var(--bg-surface)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}>
                  {createUserPortraitPreview ? (
                    <img src={createUserPortraitPreview} alt="Portrait preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Camera size={24} style={{ color: 'var(--accent)' }} />
                  )}
                </label>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>Employee portrait</p>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Optional square portrait for staff identity checks. JPG, PNG, or WebP under 5MB.
                    </p>
                  </div>
                  <input
                    id="create-user-portrait"
                    type="file"
                    accept="image/*"
                    onChange={handleCreateUserPortraitChange}
                    style={{ fontSize: 12, color: 'var(--text-secondary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Username *</label>
                <input
                  type="text" required
                  placeholder="e.g. john_doe"
                  value={createUserForm.userName}
                  onChange={e => setCreateUserForm({ ...createUserForm, userName: e.target.value })}
                  className="input"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Email *</label>
                <input
                  type="email" required
                  placeholder="user@example.com"
                  value={createUserForm.userEmail}
                  onChange={e => setCreateUserForm({ ...createUserForm, userEmail: e.target.value })}
                  className="input"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe (optional)"
                  value={createUserForm.fullName}
                  onChange={e => setCreateUserForm({ ...createUserForm, fullName: e.target.value })}
                  className="input"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Identity Code *</label>
                  <input
                    type="text" required
                    inputMode="numeric"
                    maxLength={12}
                    placeholder="12 digit ID"
                    value={createUserForm.identityCode}
                    onChange={e => setCreateUserForm({ ...createUserForm, identityCode: e.target.value.replace(/\D/g, '') })}
                    className="input"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Phone Number *</label>
                  <input
                    type="text" required
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10 digits"
                    value={createUserForm.phoneNumber}
                    onChange={e => setCreateUserForm({ ...createUserForm, phoneNumber: e.target.value.replace(/\D/g, '') })}
                    className="input"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Date of Birth *</label>
                <input
                  type="date" required
                  value={createUserForm.dateOfBirth}
                  onChange={e => setCreateUserForm({ ...createUserForm, dateOfBirth: e.target.value })}
                  className="input"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Password *</label>
                  <input
                    type="password" required
                    placeholder="Min 8 chars"
                    value={createUserForm.password}
                    onChange={e => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                    className="input"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Confirm Password *</label>
                  <input
                    type="password" required
                    placeholder="Repeat password"
                    value={createUserForm.confirmPassword}
                    onChange={e => setCreateUserForm({ ...createUserForm, confirmPassword: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <section style={{
                display: 'grid',
                gap: 12,
                padding: 14,
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(255,255,255,0.035)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 850, color: 'var(--text-primary)' }}>Staff roles</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Optional. Leave empty to create an account without staff access.
                    </p>
                  </div>
                  {rolesLoading && <Loader2 size={18} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite', flexShrink: 0 }} />}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                  {staffRoles.map((role) => {
                    const checked = createUserForm.roleIds.includes(role.roleId);
                    return (
                      <label
                        key={role.roleId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          minHeight: 44,
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${checked ? 'rgba(255, 138, 0, 0.48)' : 'rgba(255,255,255,0.1)'}`,
                          background: checked ? 'rgba(255, 138, 0, 0.12)' : 'rgba(255,255,255,0.025)',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCreateRole(role.roleId)}
                          style={{ width: 16, height: 16, accentColor: '#ff8a00' }}
                        />
                        <span style={{ fontSize: 14, fontWeight: 750, color: checked ? 'var(--accent)' : 'var(--text-primary)' }}>
                          {role.roleName}
                        </span>
                      </label>
                    );
                  })}
                  {!rolesLoading && staffRoles.length === 0 && (
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                      No assignable staff roles found.
                    </p>
                  )}
                </div>
              </section>

              <div style={{ display: 'flex', gap: 12, marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border-color, #27272a)' }}>
                <button type="button" onClick={() => setCreateUserModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button
                  type="submit"
                  disabled={createUserSubmitting}
                  className="btn btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  {createUserSubmitting ? (
                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</>
                  ) : (
                    <><UserPlus size={16} /> Create Account</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
