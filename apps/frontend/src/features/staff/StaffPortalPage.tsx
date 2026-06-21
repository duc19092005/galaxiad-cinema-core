import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';
import { Banknote, CalendarDays, Clock3, LayoutDashboard, LogIn, RefreshCw, TimerReset } from 'lucide-react';
import AppSidebar from '../../components/AppSidebar';
import type { SidebarSection } from '../../components/AppSidebar';
import ManagementChrome from '../../components/ManagementChrome';
import StaffShiftSelfService from '../booking/components/StaffShiftSelfService';
import { staffShiftApi } from '../../api/staffShiftApi';
import type { PayrollDto, ShiftRegistrationDto, StaffWorkingLogDto } from '../../types/shift.types';
import { showError } from '../../utils/ToastUtils';

const formatMoney = (value: number) => `${Math.round(value).toLocaleString('vi-VN')} VND`;
const todayKey = () => new Date().toISOString().slice(0, 10);

const makeShiftDateTime = (dateValue: string, timeValue: string) => {
  const datePart = dateValue.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  const timeMatch = timeValue.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!year || !month || !day || !timeMatch) return null;
  return new Date(year, month - 1, day, Number(timeMatch[1]), Number(timeMatch[2]), Number(timeMatch[3] || 0));
};

const minutesUntil = (date: Date) => Math.round((date.getTime() - Date.now()) / 60000);

const StaffPortalPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [registrations, setRegistrations] = useState<ShiftRegistrationDto[]>([]);
  const [history, setHistory] = useState<StaffWorkingLogDto[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollDto[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [registrationsRes, historyRes, payrollRes] = await Promise.all([
        staffShiftApi.getMyRegistrations(),
        staffShiftApi.getMyHistory(),
        staffShiftApi.getMyPayroll(),
      ]);
      setRegistrations(registrationsRes.data || []);
      setHistory(historyRes.data || []);
      setPayrolls(payrollRes.data || []);
    } catch {
      showError(t('staffPortal.loadError', 'Không tải được dữ liệu nhân viên.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user_info');
      const user = stored ? JSON.parse(stored) : null;
      if (user?.isSharedPosAccount) navigate('/cashier', { replace: true });
    } catch {
      // ignore invalid cached user data
    }
  }, [navigate]);

  const dashboard = useMemo(() => {
    const today = todayKey();
    const todayLogs = history.filter((log) => log.workingDate?.slice(0, 10) === today);
    const todayHours = todayLogs.reduce((sum, log) => sum + (Number(log.workingHour) || 0), 0);
    const todayMoney = todayLogs.reduce((sum, log) => sum + (Number(log.totalReceived) || 0), 0);
    const pending = registrations.filter((item) => item.status === 'Pending').length;
    const approved = registrations.filter((item) => item.status === 'Approved').length;
    const totalPayroll = payrolls.reduce((sum, item) => sum + (Number(item.totalReceived) || 0), 0);
    const upcoming = registrations
      .filter((item) => item.status === 'Approved')
      .map((item) => {
        const startsAt = makeShiftDateTime(item.registrationDate, item.startTime);
        return startsAt ? { item, startsAt } : null;
      })
      .filter((item): item is { item: ShiftRegistrationDto; startsAt: Date } => Boolean(item))
      .filter((item) => item.startsAt.getTime() >= Date.now() - 30 * 60000)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0] || null;

    return { todayHours, todayMoney, pending, approved, totalPayroll, upcoming };
  }, [history, payrolls, registrations]);

  const handleGoToPosLogin = () => {
    localStorage.removeItem('user_info');
    Cookies.remove('X-Access-Token');
    navigate('/login', { replace: true });
  };

  const sidebarSections: SidebarSection[] = [
    {
      label: 'Personal',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
        { id: 'schedule', label: t('staffPortal.schedule'), icon: <CalendarDays size={16} /> },
      ],
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <AppSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((value) => !value)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sections={sidebarSections}
        role="Cashier Staff"
        collapsibleDesktop
      />
      <ManagementChrome sidebarOpen={sidebarOpen} onSidebarToggle={() => setSidebarOpen((value) => !value)} />

      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
        <div className="page-container">
          {activeTab === 'schedule' ? (
            <StaffShiftSelfService />
          ) : (
            <section style={{ display: 'grid', gap: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 850 }}>{t('staffPortal.dashboardTitle')}</h1>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                  {t('staffPortal.trackWork')}
                </p>
              </div>
              <button className="btn btn-secondary" onClick={loadDashboard} disabled={loading}>
                <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : undefined }} />
                Refresh
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
              <Metric icon={<TimerReset size={18} />} label={t('staffPortal.todayHours')} value={`${dashboard.todayHours.toLocaleString('vi-VN')}h`} />
              <Metric icon={<Banknote size={18} />} label={t('staffPortal.todayMoney')} value={formatMoney(dashboard.todayMoney)} />
              <Metric icon={<CalendarDays size={18} />} label={t('staffPortal.approved')} value={String(dashboard.approved)} />
              <Metric icon={<Clock3 size={18} />} label={t('staffPortal.pending')} value={String(dashboard.pending)} />
              <Metric icon={<Banknote size={18} />} label={t('staffPortal.totalPayroll')} value={formatMoney(dashboard.totalPayroll)} />
            </div>

            <div style={{
              display: 'grid',
              gap: 14,
              padding: 20,
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-surface)',
            }}>
              {dashboard.upcoming ? (
                <>
                  <span className={minutesUntil(dashboard.upcoming.startsAt) <= 30 ? 'badge badge-warning' : 'badge badge-accent'} style={{ width: 'fit-content' }}>
                    {minutesUntil(dashboard.upcoming.startsAt) <= 0
                    ? t('staffPortal.shiftTimeNow')
                      : t('staffPortal.shiftCountdown', { minutes: minutesUntil(dashboard.upcoming.startsAt) })}
                  </span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 850 }}>{dashboard.upcoming.item.shiftName}</h2>
                    <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                      {dashboard.upcoming.startsAt.toLocaleString('vi-VN')} | {dashboard.upcoming.item.startTime} - {dashboard.upcoming.item.endTime}
                    </p>
                  </div>
                  <button className="btn btn-primary" onClick={handleGoToPosLogin} style={{ width: 'fit-content' }}>
                    <LogIn size={16} />
                    {t('staffPortal.loginPos')}
                  </button>
                </>
              ) : (
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>
                  {t('staffPortal.noUpcomingShift')}
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 850 }}>{t('staffPortal.recentRegistrations')}</h2>
              {registrations.slice(0, 6).map((item) => (
                <div key={item.shiftRegistrationId} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: 14, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }}>
                  <div>
                    <strong>{item.shiftName}</strong>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 12 }}>{new Date(item.registrationDate).toLocaleDateString('vi-VN')} | {item.startTime} - {item.endTime}</p>
                    {item.status === 'Rejected' && item.notes && (
                      <p style={{ margin: '6px 0 0', color: 'var(--danger)', fontSize: 12 }}>{t('staffPortal.reason')}: {item.notes}</p>
                    )}
                  </div>
                  <span className={item.status === 'Approved' ? 'badge badge-success' : item.status === 'Pending' ? 'badge badge-warning' : 'badge badge-danger'} style={{ alignSelf: 'center' }}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

const Metric: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 16, background: 'var(--bg-surface)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
      <span style={{ color: 'var(--accent)' }}>{icon}</span>
      <strong style={{ fontSize: 18 }}>{value}</strong>
    </div>
    <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: 12 }}>{label}</p>
  </div>
);

export default StaffPortalPage;
