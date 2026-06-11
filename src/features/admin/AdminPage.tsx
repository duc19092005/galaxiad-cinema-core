// src/features/admin/AdminPage.tsx
// Complete redesign with dark cinema theme

import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  ShieldAlert,
  Activity,
  Film,
  Calendar,
  DollarSign,
  Ticket,
  Search,
  MoreHorizontal,
  Loader2,
  RefreshCw,
  UserPlus,
  UserCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AppSidebar from '../../components/AppSidebar';
import type { SidebarSection } from '../../components/AppSidebar';
import Header from '../../components/Header';
import ManagementDashboard from '../../components/ManagementDashboard';
import TransferRightsView from './components/TransferRightsView';
import CinemaManagement from '../facilities/components/CinemaManagement';
import { facilitiesApi, type Cinema } from '../../api/facilitiesApi';

// ============================================
// CONSTANTS
// ============================================

const statsCardStyle: React.CSSProperties = {
  padding: '20px 24px',
  background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
  backdropFilter: 'blur(16px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
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
    <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>{value}</p>
  </div>
);

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

// ============================================
// MOCK DATA
// ============================================
const usersData = [
  { id: 1, name: 'Nguyen Van A', email: 'nguyenvana@cinema.com', role: 'Admin', status: 'Active', lastLogin: '2024-03-20 14:30' },
  { id: 2, name: 'Tran Thi B', email: 'tranthib@cinema.com', role: 'MovieManager', status: 'Active', lastLogin: '2024-03-19 09:15' },
  { id: 3, name: 'Le Van C', email: 'levanc@cinema.com', role: 'TheaterManager', status: 'Inactive', lastLogin: '2024-03-15 11:00' },
  { id: 4, name: 'Pham Thi D', email: 'phamthid@cinema.com', role: 'FacilitiesManager', status: 'Active', lastLogin: '2024-03-20 16:45' },
  { id: 5, name: 'Hoang Van E', email: 'hoangvane@cinema.com', role: 'Cashier', status: 'Pending', lastLogin: '2024-03-18 08:20' },
];


const auditLogs = [
  { id: 1, action: 'User Login', user: 'Nguyen Van A', target: 'Admin Panel', timestamp: '2024-03-20 14:30:00', status: 'Success' },
  { id: 2, action: 'Create Movie', user: 'Tran Thi B', target: 'Avatar 3', timestamp: '2024-03-20 13:15:00', status: 'Success' },
  { id: 3, action: 'Update Schedule', user: 'Le Van C', target: 'Theater 5', timestamp: '2024-03-20 11:45:00', status: 'Success' },
  { id: 4, action: 'Delete User', user: 'System', target: 'guest_01', timestamp: '2024-03-20 10:30:00', status: 'Failed' },
  { id: 5, action: 'Transfer Rights', user: 'Admin', target: 'Facility #3', timestamp: '2024-03-20 09:00:00', status: 'Success' },
];

// ============================================
// SECTION COMPONENTS
// ============================================

const UsersSection: React.FC = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = usersData.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
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
          <button className="btn btn-primary">
            <UserPlus size={14} />
            {t('Add User')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t('Name')}</th>
              <th>{t('Email')}</th>
              <th>{t('Role')}</th>
              <th>{t('Status')}</th>
              <th>{t('Last Login')}</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--accent-soft)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <UserCircle size={16} style={{ color: 'var(--accent)' }} />
                    </div>
                    <span style={{ fontWeight: 600 }}>{user.name}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                <td>
                  <span className={`badge ${user.role === 'Admin' ? 'badge-accent' : user.role === 'MovieManager' || user.role === 'TheaterManager' ? 'badge-warning' : 'badge-success'}`}>
                    {user.role}
                  </span>
                </td>
                <td><StatusBadge status={user.status} /></td>
                <td style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{user.lastLogin}</td>
                <td>
                  <button className="btn-icon">
                    <MoreHorizontal size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};



const AuditSection: React.FC = () => {
  const { t } = useTranslation();
  const getStatusIcon = (status: string) => {
    if (status === 'Success') return <CheckCircle size={14} style={{ color: 'var(--success)' }} />;
    return <XCircle size={14} style={{ color: 'var(--danger)' }} />;
  };

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('Audit Log')}</h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{t('System activity and security events')}</p>
        </div>
        <button className="btn btn-secondary">
          <RefreshCw size={14} />
          {t('Refresh')}
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t('Action')}</th>
              <th>{t('User')}</th>
              <th>{t('Target')}</th>
              <th>{t('Timestamp')}</th>
              <th>{t('Status')}</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => (
              <tr key={log.id}>
                <td style={{ fontWeight: 500 }}>{log.action}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{log.user}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{log.target}</td>
                <td style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{log.timestamp}</td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {getStatusIcon(log.status)}
                    <StatusBadge status={log.status} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================
// MAIN ADMIN PAGE
// ============================================

const AdminPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Real cinema management states for Admin
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [cinemasLoading, setCinemasLoading] = useState(false);
  const [cinemasError, setCinemasError] = useState<string | null>(null);

  const fetchCinemas = async () => {
    setCinemasLoading(true);
    setCinemasError(null);
    try {
      const res = await facilitiesApi.getCinemaList();
      setCinemas(res.data || []);
    } catch (err) {
      setCinemasError('Failed to load cinemas list.');
    } finally {
      setCinemasLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'facilities') {
      fetchCinemas();
    }
  }, [activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const sidebarSections: SidebarSection[] = [
    {
      items: [
        { id: 'dashboard', label: t('Dashboard'), icon: <LayoutDashboard size={18} /> },
        { id: 'users', label: t('Users'), icon: <Users size={18} /> },
        { id: 'facilities', label: t('Facilities'), icon: <Building2 size={18} /> },
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
          <div className="animate-in">
            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
              marginBottom: 32,
            }}>
              <StatCard
                label={t('Total Users')}
                value="42"
                trend="+5 this month"
                icon={<Users size={22} />}
                color="#ff8a00"
                delay={0}
              />
              <StatCard
                label={t('Total Cinemas')}
                value="8"
                trend="2 regions"
                icon={<Building2 size={22} />}
                color="#22c55e"
                delay={80}
              />
              <StatCard
                label={t('Active Movies')}
                value="24"
                trend="+3 this week"
                icon={<Film size={22} />}
                color="#3b82f6"
                delay={160}
              />
              <StatCard
                label={t('Revenue (Month)')}
                value="₫ 156.8M"
                trend="+12.5% growth"
                icon={<DollarSign size={22} />}
                color="#a855f7"
                delay={240}
              />
              <StatCard
                label={t('Total Bookings')}
                value="3,842"
                trend="+18% vs last month"
                icon={<Ticket size={22} />}
                color="#06b6d4"
                delay={320}
              />
              <StatCard
                label={t('Active Schedules')}
                value="156"
                trend="12 today"
                icon={<Calendar size={22} />}
                color="#f59e0b"
                delay={400}
              />
            </div>

            {/* Recent Activity */}
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>
                {t('Recent Activity')}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {auditLogs.slice(0, 4).map((log) => (
                  <div
                    key={log.id}
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
                      background: log.status === 'Success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    }}>
                      {log.status === 'Success'
                        ? <CheckCircle size={14} style={{ color: 'var(--success)' }} />
                        : <XCircle size={14} style={{ color: 'var(--danger)' }} />
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{log.action}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                        {log.user} → {log.target}
                      </p>
                    </div>
                    <span style={{
                      fontSize: 10, color: 'var(--text-muted)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {log.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'users':
        return <UsersSection />;

      case 'facilities':
        return (
          <CinemaManagement
            cinemas={cinemas}
            loading={cinemasLoading}
            error={cinemasError}
            onRefresh={fetchCinemas}
          />
        );

      case 'rights':
        return <TransferRightsView />;

      case 'audit':
        return <AuditSection />;

      default:
        return <ManagementDashboard role="admin" />;
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
        role="Admin"
      />

      <Header
        title={t('Admin Panel')}
        role="Administrator"
        showSidebarToggle
        onMenuToggle={() => setSidebarOpen(true)}
      />

      <main className="main-content">
        <div className="page-container">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
