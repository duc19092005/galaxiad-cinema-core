// src/features/admin/AdminPage.tsx
// Complete redesign with dark cinema theme

import React, { useCallback, useEffect, useState, useMemo } from 'react';
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
  Ticket, TicketPercent, Popcorn,
  Loader2,
  CheckCircle,
  XCircle,
  BadgePercent,
  Image,
  Bot,
  Brain,
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
import EditEmployeeModal from '../../components/EditEmployeeModal';
import { showSuccess, showError } from '../../utils/ToastUtils';
import { VouchersSection } from './components/VouchersSection';
import { PricingPromotionsSection } from './components/PricingPromotionsSection';
import { BannersSection } from './components/BannersSection';
import CinemaManagement from '../facilities/components/CinemaManagement';
import { facilitiesApi } from '../../api/facilitiesApi';
import type { Cinema, Department } from '../../types/facilities.types';
import AdminShiftApprovalSection from './components/AdminShiftApprovalSection';
import UsersSection from './components/UsersSection';
import BusinessIntelligenceSection from './components/BusinessIntelligenceSection';
import { ConcessionCatalogSection } from './components/ConcessionCatalogSection';
import { useCinema } from '../../contexts/CinemaContext';
import {
  StatCard,
  AdminRevenueChart,
  AdminOpsTiles,
  formatCompactNumber,
  formatVnd,
} from './components/AdminDashboardWidgets';
import { AuditSection } from './components/AuditSection';
import { CreateUserModal } from './components/CreateUserModal';

// ============================================
// CONSTANTS & HELPERS
// ============================================

const getAdminErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== 'object' || error === null) return fallback;
  const response = (error as { response?: { data?: { message?: string; Message?: string } } }).response;
  return response?.data?.message ?? response?.data?.Message ?? fallback;
};

const adminTabIds = new Set(['dashboard', 'users', 'cinemas', 'vouchers', 'pricing-promotions', 'banners', 'permissions', 'rights', 'audit', 'shifts', 'business-intel', 'concessions']);

const createFaceVectorFromImage = async (file: File): Promise<number[] | null> => {
  try {
    const { detectFaceDescriptor } = await import('../../utils/faceApiUtils');
    const descriptor = await detectFaceDescriptor(file);
    if (!descriptor) return null;
    return Array.from(descriptor);
  } catch (err) {
    console.error('Face detection failed:', err);
    return null;
  }
};

// ============================================
// MAIN ADMIN PAGE
// ============================================

const AdminPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tab } = useParams();
  const { activeCinemaId, activeCinemaName, setActiveCinemaId } = useCinema();
  // Legacy /admin/ai → dedicated AI workspace route
  useEffect(() => {
    if (tab === 'ai') {
      navigate('/admin/ai/business-research', { replace: true });
    }
  }, [tab, navigate]);
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
  const [createUserDepartments, setCreateUserDepartments] = useState<Department[]>([]);
  const [createUserDepartmentsLoading, setCreateUserDepartmentsLoading] = useState(false);

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserDto | null>(null);

  // Create User Modal
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [createUserSubmitting, setCreateUserSubmitting] = useState(false);
  // 1 = FullTime, 2 = PartTime  (mirrors backend EmployeeWorkType enum)
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
    cinemaId: '',
    departmentId: '',
    employeeType: 1 as 1 | 2,
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
      const res = await adminApi.getRecentAuditLogs(200);
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
      const res = await adminApi.getManagementDashboard(activeCinemaId || undefined);
      setDashboardData(res.data || null);
      setAuditLogs(res.data?.recentActivities || []);
    } catch {
      showError(t('toast.loadDataFailed'));
    } finally {
      setDashboardLoading(false);
    }
  }, [t, activeCinemaId]);

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

  useEffect(() => {
    fetchCinemas();
  }, [fetchCinemas]);

  const handleOpenEditModal = (user: AdminUserDto) => {
    setEditingUser(user);
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    fetchUsers();
  };

  const handleTabChange = (tabId: string) => {
    if (tabId === 'ai') {
      navigate('/admin/ai/business-research');
      return;
    }
    setActiveTab(tabId);
    const newPath = tabId === 'dashboard' ? '/admin' : `/admin/${tabId}`;
    window.history.pushState(null, '', newPath);
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
      cinemaId: '',
      departmentId: '',
      employeeType: 1,
    });
    setCreateUserPortraitFile(null);
    setCreateUserPortraitPreview(null);
    setCreateUserDepartments([]);
    setCreateUserModalOpen(true);
    if (staffRoles.length === 0) {
      fetchStaffRoles();
    }
    if (cinemas.length === 0) {
      fetchCinemas();
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

  const selectedCreateRoles = staffRoles.filter((role) => createUserForm.roleIds.includes(role.roleId));
  const hasCreateStaffRole = selectedCreateRoles.length > 0;
  const hasCreateCashierRole = selectedCreateRoles.some((role) => role.roleName === 'Cashier');

  useEffect(() => {
    if (!createUserModalOpen || !createUserForm.cinemaId) {
      setCreateUserDepartments([]);
      return;
    }

    let cancelled = false;
    setCreateUserDepartmentsLoading(true);
    facilitiesApi.getDepartments(createUserForm.cinemaId)
      .then((res) => {
        if (!cancelled) setCreateUserDepartments(res.data || []);
      })
      .catch(() => {
        if (!cancelled) {
          setCreateUserDepartments([]);
          showError('Unable to load departments for selected cinema.');
        }
      })
      .finally(() => {
        if (!cancelled) setCreateUserDepartmentsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [createUserForm.cinemaId, createUserModalOpen]);

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
    if (hasCreateStaffRole && !createUserForm.cinemaId) {
      showError('Select a cinema for this staff account.');
      return;
    }
    if (hasCreateCashierRole && !createUserForm.departmentId) {
      showError('Select a cashier department for this staff account.');
      return;
    }
    if (hasCreateStaffRole && !createUserPortraitFile) {
      showError('Staff accounts need a portrait image for face vector registration.');
      return;
    }
    setCreateUserSubmitting(true);
    try {
      let faceVector: number[] | undefined = undefined;
      if (createUserPortraitFile && hasCreateStaffRole) {
        showSuccess('Đang phân tích khuôn mặt trong ảnh...');
        const detected = await createFaceVectorFromImage(createUserPortraitFile);
        if (!detected) {
          showError('Không phát hiện được khuôn mặt trong ảnh. Hãy dùng ảnh chân dung rõ nét, đủ ánh sáng và khuôn mặt nhìn thẳng.');
          setCreateUserSubmitting(false);
          return;
        }
        faceVector = detected;
      }
      const res = await adminApi.createUser({
        userName: createUserForm.userName,
        userEmail: createUserForm.userEmail,
        userPassword: createUserForm.password,
        userRepassword: createUserForm.confirmPassword,
        identityCode: createUserForm.identityCode,
        phoneNumber: createUserForm.phoneNumber,
        dateOfBirth: new Date(`${createUserForm.dateOfBirth}T00:00:00`).toISOString(),
        roleIds: createUserForm.roleIds,
        cinemaId: createUserForm.cinemaId || undefined,
        departmentId: createUserForm.departmentId || undefined,
        faceVector,
        employeeType: hasCreateCashierRole ? createUserForm.employeeType : undefined,
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

  const sidebarSections: SidebarSection[] = useMemo(
    () => [
      {
        id: 'ai-workspace',
        label: 'AI Workspace',
        description: 'Research multi-agent & lab AI',
        icon: <Bot size={18} />,
        defaultOpen: false,
        collapsible: true,
        items: [
          {
            id: 'ai',
            label: 'Mở AI Workspace',
            icon: <Bot size={16} />,
            onClick: () => navigate('/admin/ai/business-research'),
          },
        ],
      },
      {
        id: 'admin-ops',
        label: 'Quản trị hệ thống',
        description: 'Users, rạp, voucher, quyền…',
        icon: <LayoutDashboard size={18} />,
        defaultOpen: true,
        collapsible: true,
        items: [
          { id: 'dashboard', label: t('Dashboard'), icon: <LayoutDashboard size={16} /> },
          { id: 'business-intel', label: t('adminBi.sidebar', 'Phân tích KD'), icon: <Brain size={16} /> },
          { id: 'users', label: t('Users'), icon: <Users size={16} /> },
          { id: 'cinemas', label: t('Cinemas'), icon: <Building2 size={16} /> },
          { id: 'concessions', label: 'Danh mục F&B', icon: <Popcorn size={16} /> },
          { id: 'vouchers', label: t('Vouchers'), icon: <TicketPercent size={16} /> },
          { id: 'pricing-promotions', label: t('Pricing Rules'), icon: <BadgePercent size={16} /> },
          { id: 'banners', label: 'Banners', icon: <Image size={16} /> },
          { id: 'permissions', label: t('Permissions'), icon: <KeyRound size={16} /> },
          { id: 'rights', label: t('Transfer Rights'), icon: <ShieldAlert size={16} /> },
          { id: 'audit', label: t('Audit Log'), icon: <Activity size={16} /> },
          { id: 'shifts', label: t('adminShiftCancel.sidebarLabel'), icon: <Calendar size={16} /> },
        ],
      },
    ],
    [navigate, t],
  );

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
              <div className="admin-dashboard-card" style={{ padding: 24 }}>
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

      case 'business-intel':
        return <BusinessIntelligenceSection />;

      case 'users':
        return (
          <UsersSection
            users={users}
            loading={usersLoading}
            cinemas={cinemas}
            onEditUser={handleOpenEditModal}
            onCreateUser={handleOpenCreateUser}
          />
        );

      case 'vouchers':
        return <VouchersSection />;

      case 'pricing-promotions':
        return <PricingPromotionsSection />;

      case 'banners':
        return <BannersSection />;

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

      case 'concessions':
        return <ConcessionCatalogSection cinemaId={activeCinemaId} />;

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
 
      case 'shifts':
        return <AdminShiftApprovalSection />;

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
        cinemaSelector={{
          cinemas,
          activeCinemaId,
          activeCinemaName,
          onChange: (id) => setActiveCinemaId(id),
        }}
      />

      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
        <div className="page-container">
          <div key={activeTab} className="tab-content-enter">
            {renderContent()}
          </div>
        </div>
      </main>

      {editModalOpen && editingUser && (
        <EditEmployeeModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingUser(null);
          }}
          user={editingUser}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={createUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        onSubmit={handleCreateUser}
        formData={createUserForm}
        setFormData={setCreateUserForm}
        portraitPreview={createUserPortraitPreview}
        onPortraitChange={handleCreateUserPortraitChange}
        staffRoles={staffRoles}
        rolesLoading={rolesLoading}
        cinemas={cinemas}
        cinemasLoading={cinemasLoading}
        departments={createUserDepartments}
        departmentsLoading={createUserDepartmentsLoading}
        isSubmitting={createUserSubmitting}
        toggleRole={toggleCreateRole}
      />
    </div>
  );
};

export default AdminPage;
