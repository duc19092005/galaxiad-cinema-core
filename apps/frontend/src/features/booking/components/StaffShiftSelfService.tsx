import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  Banknote,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock4,
  Loader2,
  RefreshCw,
  Save,
  TimerReset,
  Trash2,
  X,
} from 'lucide-react';
import { staffShiftApi } from '../../../api/staffShiftApi';
import { showError, showSuccess } from '../../../utils/ToastUtils';
import type { PayrollDto, ShiftRegistrationDto, ShiftTemplateDto, StaffWorkingLogDto } from '../../../types/shift.types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SelectedShiftKey {
  shift: ShiftTemplateDto;
  dateValue: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DAY_WINDOW = 7;
const TIME_AXIS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00',
];
const TIME_COLUMN_COUNT = TIME_AXIS.length;
const TIME_SLOT_HEIGHT = 46;
const TIMELINE_START_MINUTES = 6 * 60;

// ─── Utils ────────────────────────────────────────────────────────────────────

const toInputDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
const todayInput = () => toInputDate(new Date());

const addDays = (dateValue: string, amount: number) => {
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);
  return toInputDate(date);
};

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  // Parse safely: if value is 'yyyy-MM-dd' or 'yyyy-MM-ddT...' take the date part directly
  // to avoid UTC-to-local shift when JS parses ISO strings without timezone offset
  const datePart = value.slice(0, 10); // 'yyyy-MM-dd'
  const [y, m, d] = datePart.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
const formatMoney = (value: number) => `${value.toLocaleString('vi-VN')} VND`;

const getApiErrorMessage = (error: unknown, fallback: string, t?: (key: string) => string) => {
  if (!axios.isAxiosError(error)) return fallback;
  const payload = error.response?.data as { message?: string; Message?: string; errorCode?: string } | undefined;
  const code = payload?.errorCode;
  if (error.response?.status === 409 || code === 'SHIFT_ERR')
    return payload?.message ?? payload?.Message ?? (t ? t('staffShiftSelf.shiftConflict') : 'Ca đăng ký bị xung đột. Thử lại sau.');
  return payload?.message ?? payload?.Message ?? fallback;
};

const parseTimeMinutes = (value: string) => {
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
};

const getShiftHours = (shift: ShiftTemplateDto) => {
  const start = parseTimeMinutes(shift.startTime);
  let end = parseTimeMinutes(shift.endTime);
  if (end <= start) end += 24 * 60;
  return (end - start) / 60;
};

const getRegistrationHours = (registration: ShiftRegistrationDto) => {
  const start = parseTimeMinutes(registration.startTime);
  let end = parseTimeMinutes(registration.endTime);
  if (end <= start) end += 24 * 60;
  return Math.max((end - start) / 60, 1);
};

const getTimelineBlockStyle = (registration: ShiftRegistrationDto): React.CSSProperties => {
  const start = parseTimeMinutes(registration.startTime);
  const offsetHours = Math.max((start - TIMELINE_START_MINUTES) / 60, 0);
  const durationHours = Math.min(getRegistrationHours(registration), TIME_COLUMN_COUNT - offsetHours);
  return {
    top: offsetHours * TIME_SLOT_HEIGHT + 4,
    height: Math.max(durationHours * TIME_SLOT_HEIGHT - 8, 32),
  };
};

const getTemplateTimelineBlockStyle = (shift: ShiftTemplateDto): React.CSSProperties => {
  const start = parseTimeMinutes(shift.startTime);
  const offsetHours = Math.max((start - TIMELINE_START_MINUTES) / 60, 0);
  const durationHours = Math.min(getShiftHours(shift), TIME_COLUMN_COUNT - offsetHours);
  return {
    top: offsetHours * TIME_SLOT_HEIGHT + 4,
    height: Math.max(durationHours * TIME_SLOT_HEIGHT - 8, 32),
  };
};

const isPartTime = (shift: ShiftTemplateDto) => {
  const name = shift.shiftName.toLowerCase();
  if (name.includes('part')) return true;
  if (name.includes('full')) return false;
  return getShiftHours(shift) <= 4.5;
};

// Extract the local date (yyyy-MM-dd) from a RegistrationDate returned by BE (already converted to VN time)
const registrationDateKey = (r: ShiftRegistrationDto) => r.registrationDate.slice(0, 10);

const statusClass = (status: string) => {
  if (status === 'Approved' || status === 'Paid') return 'badge badge-success';
  if (status === 'Pending') return 'badge badge-warning';
  if (status === 'Rejected' || status === 'Cancelled') return 'badge badge-danger';
  return 'badge badge-default';
};

// unique key for a selected slot so we can deduplicate
const selectionKey = (shift: ShiftTemplateDto, dateValue: string) =>
  `${shift.shiftScheduleId ?? shift.shiftTemplateId}::${dateValue}`;

// ─── Main Component ───────────────────────────────────────────────────────────

const StaffShiftSelfService: React.FC = () => {
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState<{ roles?: string[]; isSharedPosAccount?: boolean } | null>(null);
  const [activeDate, setActiveDate] = useState(todayInput);
  const [dateWindowStart, setDateWindowStart] = useState(todayInput);
  const [notes, setNotes] = useState('');

  const [availableShifts, setAvailableShifts] = useState<ShiftTemplateDto[]>([]);
  const [weeklyAvailableShifts, setWeeklyAvailableShifts] = useState<Record<string, ShiftTemplateDto[]>>({});
  const [registrations, setRegistrations] = useState<ShiftRegistrationDto[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollDto[]>([]);
  const [history, setHistory] = useState<StaffWorkingLogDto[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Multi-select for shift registration
  const [selectedShifts, setSelectedShifts] = useState<SelectedShiftKey[]>([]);

  // Bulk-cancel select mode for existing registrations
  const [cancelSelectIds, setCancelSelectIds] = useState<string[]>([]);
  const [isCancelMode, setIsCancelMode] = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user_info');
      if (stored) setCurrentUser(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const storedSession = localStorage.getItem('cashier_shift_session');
  const session = storedSession ? JSON.parse(storedSession) : null;
  const staffToken = session?.accessToken;
  const isSharedPosAccount = currentUser?.isSharedPosAccount ?? false;
  const today = todayInput();

  const dateCells = useMemo(
    () => Array.from({ length: DAY_WINDOW }, (_, i) => addDays(dateWindowStart, i)),
    [dateWindowStart],
  );

  const registrationsByDate = useMemo(() => {
    const grouped = new Map<string, ShiftRegistrationDto[]>();
    registrations.forEach((r) => {
      const key = registrationDateKey(r);
      grouped.set(key, [...(grouped.get(key) ?? []), r]);
    });
    return grouped;
  }, [registrations]);

  const pendingRegistrations = useMemo(
    () => registrations.filter((r) => r.status === 'Pending'),
    [registrations],
  );

  const groupedRegistrationsList = useMemo(() => {
    const grouped = new Map<string, ShiftRegistrationDto[]>();
    registrations.forEach((r) => {
      const key = registrationDateKey(r);
      grouped.set(key, [...(grouped.get(key) ?? []), r]);
    });
    return Array.from(grouped.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [registrations]);

  const totalPaid = useMemo(
    () => payrolls.filter((p) => p.paymentStatus === 'Paid').reduce((s, p) => s + p.totalReceived, 0),
    [payrolls],
  );
  const totalPending = useMemo(
    () => payrolls.filter((p) => p.paymentStatus !== 'Paid').reduce((s, p) => s + p.totalReceived, 0),
    [payrolls],
  );
  const workedHours = useMemo(() => history.reduce((s, h) => s + h.workingHour, 0), [history]);
  const approvedCount = registrations.filter((r) => r.status === 'Approved').length;

  // ── Data loading ─────────────────────────────────────────────────────────

  const loadSelfService = useCallback(async (dateOverride?: string) => {
    if (isSharedPosAccount && !staffToken) return;
    const date = dateOverride ?? activeDate;
    setLoading(true);
    try {
      const [registrationsRes, payrollRes, historyRes] = await Promise.all([
        staffShiftApi.getMyRegistrations(isSharedPosAccount ? staffToken : undefined),
        staffShiftApi.getMyPayroll(isSharedPosAccount ? staffToken : undefined),
        staffShiftApi.getMyHistory(isSharedPosAccount ? staffToken : undefined),
      ]);
      setRegistrations(registrationsRes.data ?? []);
      setPayrolls(payrollRes.data ?? []);
      setHistory(historyRes.data ?? []);

      const weeklyResults = await Promise.all(
        dateCells.map(async (dateVal) => {
          const res = await staffShiftApi.getAvailableShifts(dateVal, isSharedPosAccount ? staffToken : undefined);
          return { dateVal, shifts: res.data ?? [] };
        }),
      );
      const map: Record<string, ShiftTemplateDto[]> = {};
      weeklyResults.forEach(({ dateVal, shifts }) => { map[dateVal] = shifts; });
      setWeeklyAvailableShifts(map);
      setAvailableShifts(map[date] ?? []);

      setSelectedShifts([]);
      setCancelSelectIds([]);
      setIsCancelMode(false);
    } catch (error) {
      showError(getApiErrorMessage(error, t('staffShiftSelf.errorLoadShifts'), t));
    } finally {
      setLoading(false);
    }
  }, [activeDate, dateCells, isSharedPosAccount, staffToken]);

  useEffect(() => { loadSelfService(); }, [loadSelfService]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const isShiftSelected = (shift: ShiftTemplateDto, dateValue: string) =>
    selectedShifts.some((s) => selectionKey(s.shift, s.dateValue) === selectionKey(shift, dateValue));

  const toggleShiftSelect = (shift: ShiftTemplateDto, dateValue: string) => {
    const key = selectionKey(shift, dateValue);
    setSelectedShifts((prev) =>
      prev.some((s) => selectionKey(s.shift, s.dateValue) === key)
        ? prev.filter((s) => selectionKey(s.shift, s.dateValue) !== key)
        : [...prev, { shift, dateValue }],
    );
  };

  const clearSelection = () => setSelectedShifts([]);

  // ── Save (batch register) ─────────────────────────────────────────────────

  const handleSaveSelected = async () => {
    if (selectedShifts.length === 0) return;
    setSaving(true);
    let successCount = 0;
    const errors: string[] = [];

    for (const { shift, dateValue } of selectedShifts) {
      try {
        await staffShiftApi.registerShift({
          shiftTemplateId:
            shift.shiftTemplateId && shift.shiftTemplateId !== '00000000-0000-0000-0000-000000000000'
              ? shift.shiftTemplateId
              : undefined,
          shiftScheduleId:
            shift.shiftScheduleId && shift.shiftScheduleId !== '00000000-0000-0000-0000-000000000000'
              ? shift.shiftScheduleId
              : undefined,
          // Send date as local (no Z suffix) so the backend NormalizeIncoming treats it as VN time → UTC
          startDate: `${dateValue}T00:00:00`,
          endDate: `${dateValue}T00:00:00`,
          notes: notes.trim() || undefined,
        }, isSharedPosAccount ? staffToken : undefined);
        successCount++;
      } catch (error) {
        const label = `${shift.shiftName} (${formatDate(dateValue)})`;
        errors.push(`${label}: ${getApiErrorMessage(error, t('staffShiftSelf.unknownError'), t)}`);
      }
    }

    setSaving(false);
    setSelectedShifts([]);

    if (successCount > 0) {
      showSuccess(t('staffShiftSelf.registerSuccess', { count: successCount }));
      setNotes('');
    }
    if (errors.length > 0) {
      errors.forEach((e) => showError(e));
    }
    await loadSelfService();
  };

  // ── Cancel handlers ───────────────────────────────────────────────────────

  const handleCancelRegistration = async (registrationId: string) => {
    if (!window.confirm(t('staffShiftSelf.confirmCancelSingle'))) return;
    try {
      setLoading(true);
      const res = await staffShiftApi.cancelRegistration(registrationId, isSharedPosAccount ? staffToken : undefined);
      showSuccess(res.message ?? t('staffShiftSelf.cancelSuccess'));
      await loadSelfService();
    } catch (error) {
      showError(getApiErrorMessage(error, t('staffShiftSelf.errorCancelShift'), t));
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCancel = async () => {
    if (cancelSelectIds.length === 0) return;
    if (!window.confirm(t('staffShiftSelf.confirmBulkCancel', { count: cancelSelectIds.length }))) return;
    try {
      setLoading(true);
      const res = await staffShiftApi.cancelBulkRegistrations(cancelSelectIds, isSharedPosAccount ? staffToken : undefined);
      showSuccess(res.message ?? t('staffShiftSelf.bulkCancelSuccess'));
      setCancelSelectIds([]);
      await loadSelfService();
    } catch (error) {
      showError(getApiErrorMessage(error, t('staffShiftSelf.errorBulkCancel'), t));
    } finally {
      setLoading(false);
    }
  };

  const moveDateWindow = (amount: number) => {
    const next = addDays(dateWindowStart, amount);
    const safeNext = next < today ? today : next;
    setDateWindowStart(safeNext);
    setActiveDate(safeNext);
  };

  // ── Guard ─────────────────────────────────────────────────────────────────

  if (isSharedPosAccount && !staffToken) {
    return (
      <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Banknote size={24} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{t('staffShiftSelf.noStaffOnDuty')}</h3>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 420, lineHeight: 1.6 }}>
            {t('staffShiftSelf.clockInRequired')}
          </p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section style={{ display: 'grid', gap: 20, paddingBottom: selectedShifts.length > 0 ? 90 : 0, transition: 'padding-bottom 0.3s ease' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {t('staffShiftSelf.cashierProfile')}
          </p>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 850 }}>{t('staffShiftSelf.registerSchedule')}</h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            {t('staffShiftSelf.registerScheduleDesc')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '9px 12px', color: 'var(--accent)', background: 'var(--bg-surface)', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
            {new Date(`${today}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
          <button className="btn btn-secondary" onClick={() => loadSelfService()} disabled={loading}>
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
            {t('staffShiftSelf.refresh')}
          </button>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="employee-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 0.7fr) minmax(0, 1.8fr)', gap: 18, alignItems: 'start' }}>

        {/* ─────────── LEFT SIDEBAR ─────────── */}
        <div style={{ display: 'grid', gap: 18 }}>

          {/* Available shifts for selected day */}
          <ListPanel title={`${t('staffShiftSelf.availableShifts')} — ${formatDate(activeDate)}`}>
            {loading ? (
              <EmptyLine label={t('staffShiftSelf.loading')} />
            ) : availableShifts.length === 0 ? (
              <EmptyLine label={t('staffShiftSelf.noShiftsForDay')} />
            ) : (
              <div style={{ display: 'grid', padding: '10px 12px', gap: 8 }}>
                {availableShifts.map((shift) => {
                  const isPart = isPartTime(shift);
                  const iconColor = isPart ? '#0ea5e9' : '#10b981';
                  const remaining = shift.maxStaff - (shift.registeredCount ?? 0);
                  const full = remaining <= 0;
                  return (
                    <div
                      key={shift.shiftTemplateId}
                      style={{
                        display: 'flex', justifyContent: 'space-between', gap: 10,
                        padding: '10px 12px', background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                        alignItems: 'center', opacity: full ? 0.5 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: isPart ? 'rgba(14,165,233,0.1)' : 'rgba(16,185,129,0.1)', color: iconColor, flexShrink: 0 }}>
                          {isPart ? <Clock4 size={14} /> : <CalendarDays size={14} />}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 750, color: 'var(--text-primary)' }}>{shift.shiftName}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>
                            {shift.startTime.slice(0, 5)} – {shift.endTime.slice(0, 5)} · {full ? t('staffShiftSelf.full') : t('staffShiftSelf.remaining', { remaining, total: shift.maxStaff })}
                          </p>
                        </div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: full ? 'rgba(235,87,87,0.12)' : (isPart ? 'rgba(14,165,233,0.12)' : 'rgba(16,185,129,0.12)'), color: full ? 'var(--danger)' : iconColor, textTransform: 'uppercase', flexShrink: 0 }}>
                        {full ? t('staffShiftSelf.fullShort') : isPart ? 'Part' : 'Full'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </ListPanel>

          {/* Overview */}
          <Panel title={t('staffShiftSelf.overview')}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Metric icon={<ClipboardList size={17} />} label={t('staffShiftSelf.registeredShifts')} value={`${registrations.length}`} />
              <Metric icon={<CalendarDays size={17} />} label={t('staffShiftSelf.approvedShifts')} value={`${approvedCount}`} />
              <Metric icon={<Banknote size={17} />} label={t('staffShiftSelf.paidSalary')} value={formatMoney(totalPaid)} />
              <Metric icon={<Banknote size={17} />} label={t('staffShiftSelf.pendingSalary')} value={formatMoney(totalPending)} />
              <Metric icon={<TimerReset size={17} />} label={t('staffShiftSelf.workedHours')} value={`${workedHours.toLocaleString('vi-VN')}h`} />
              <Metric icon={<CalendarPlus size={17} />} label={t('staffShiftSelf.availableToday')} value={`${availableShifts.length}`} />
            </div>
          </Panel>

          {/* Notes */}
          <Panel title={t('staffShiftSelf.notesForManager')}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('staffShiftSelf.notesHint')}</span>
              <textarea
                className="input"
                rows={4}
                placeholder={t('staffShiftSelf.notesPlaceholder')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </label>
          </Panel>
        </div>

        {/* ─────────── RIGHT — WEEKLY BOARD ─────────── */}
        <div style={{ display: 'grid', gap: 18 }}>

          {/* ── Weekly calendar ── */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', overflow: 'hidden' }}>

            {/* Calendar header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: 14, borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 850, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', gap: 8, alignItems: 'center' }}>
                <CalendarDays size={16} />
                {t('staffShiftSelf.weeklySchedule')} — {formatDate(dateCells[0])} – {formatDate(dateCells[dateCells.length - 1])}
              </h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {selectedShifts.length > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', background: 'rgba(255,138,0,0.1)', border: '1px solid rgba(255,138,0,0.3)', borderRadius: 'var(--radius-md)', padding: '4px 10px' }}>
                    {t('staffShiftSelf.selected', { count: selectedShifts.length })}
                  </span>
                )}
                <button className="btn btn-secondary" onClick={() => moveDateWindow(-7)} disabled={dateWindowStart <= today}>
                  <ChevronLeft size={16} /> {t('staffShiftSelf.previousWeek')}
                </button>
                <button className="btn btn-secondary" onClick={() => moveDateWindow(7)}>
                  {t('staffShiftSelf.nextWeek')} <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Calendar grid */}
            <div style={{ padding: 14, overflowX: 'auto', background: 'rgba(0,0,0,0.08)' }}>
              <div style={{ minWidth: 900 }}>
                <div style={{ display: 'grid', gridTemplateColumns: `76px repeat(${DAY_WINDOW}, minmax(112px, 1fr))`, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-base)' }}>

                  {/* Corner cell */}
                  <div style={{ borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }} />

                  {/* Day headers */}
                  {dateCells.map((dateValue) => {
                    const date = new Date(`${dateValue}T00:00:00`);
                    const isPast = dateValue < today;
                    const isActive = dateValue === activeDate;
                    return (
                      <button
                        key={dateValue}
                        type="button"
                        onClick={() => setActiveDate(dateValue)}
                        style={{
                          minHeight: 58, display: 'grid', placeItems: 'center', gap: 2,
                          border: 0,
                          borderRight: '1px solid var(--border-color)',
                          borderBottom: isActive ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                          background: isActive ? 'rgba(255,138,0,0.1)' : 'var(--bg-surface)',
                          color: isPast ? 'var(--text-muted)' : isActive ? 'var(--accent)' : 'var(--text-secondary)',
                          opacity: isPast ? 0.56 : 1,
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 850, textTransform: 'uppercase' }}>
                          {date.toLocaleDateString('vi-VN', { weekday: 'short' })}
                        </span>
                        <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: isActive ? 800 : 600 }}>
                          {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </button>
                    );
                  })}

                  {/* Time axis */}
                  <div style={{ display: 'grid', gridTemplateRows: `repeat(${TIME_COLUMN_COUNT}, ${TIME_SLOT_HEIGHT}px)`, borderRight: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.045)' }}>
                    {TIME_AXIS.map((time) => (
                      <div key={time} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '7px 10px 0 0', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)', opacity: 0.88, fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                        {time}
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {dateCells.map((dateValue) => {
                    const isPast = dateValue < today;
                    const isActive = dateValue === activeDate;
                    const dayRegistrations = registrationsByDate.get(dateValue) ?? [];
                    const dayAvailableShifts = weeklyAvailableShifts[dateValue] ?? [];
                    // Hide available slots that already have a registration by the user
                    const unregisteredAvailable = dayAvailableShifts.filter(
                      (shift) => !dayRegistrations.some((reg) => reg.shiftScheduleId === shift.shiftScheduleId),
                    );

                    return (
                      <div
                        key={dateValue}
                        onClick={() => setActiveDate(dateValue)}
                        style={{
                          minHeight: TIME_COLUMN_COUNT * TIME_SLOT_HEIGHT,
                          position: 'relative',
                          borderRight: '1px solid var(--border-color)',
                          background: isPast
                            ? 'rgba(255,255,255,0.025)'
                            : isActive
                              ? 'rgba(255,138,0,0.035)'
                              : 'var(--bg-base)',
                          opacity: isPast ? 0.55 : 1,
                          cursor: 'default',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Hour grid lines */}
                        <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateRows: `repeat(${TIME_COLUMN_COUNT}, ${TIME_SLOT_HEIGHT}px)`, pointerEvents: 'none' }}>
                          {TIME_AXIS.map((t) => <span key={t} style={{ borderBottom: '1px solid rgba(255,255,255,0.055)' }} />)}
                        </div>

                        {/* ── Available shift slots (clickable / selectable) ── */}
                        {!isPast && unregisteredAvailable.map((shift) => {
                          const remaining = shift.maxStaff - (shift.registeredCount ?? 0);
                          const isFull = remaining <= 0;
                          const isPart = isPartTime(shift);
                          const selected = isShiftSelected(shift, dateValue);

                          return (
                            <div
                              key={shift.shiftScheduleId ?? shift.shiftTemplateId}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isFull) return;
                                toggleShiftSelect(shift, dateValue);
                              }}
                              style={{
                                ...getTemplateTimelineBlockStyle(shift),
                                position: 'absolute',
                                left: 6,
                                right: 6,
                                zIndex: 1,
                                border: isFull
                                  ? '1.5px dashed rgba(235,87,87,0.35)'
                                  : selected
                                    ? '1.5px solid var(--accent)'
                                    : '1.5px dashed var(--accent)',
                                background: isFull
                                  ? 'rgba(235,87,87,0.04)'
                                  : selected
                                    ? 'rgba(255,138,0,0.18)'
                                    : 'rgba(255,138,0,0.04)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '7px 8px',
                                display: 'grid',
                                alignContent: 'start',
                                gap: 3,
                                cursor: isFull ? 'not-allowed' : 'pointer',
                                overflow: 'hidden',
                                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: selected ? '0 0 0 2px rgba(255,138,0,0.25), 0 4px 14px rgba(255,138,0,0.2)' : 'none',
                              }}
                              onMouseEnter={(e) => {
                                if (isFull || selected) return;
                                e.currentTarget.style.background = 'rgba(255,138,0,0.09)';
                                e.currentTarget.style.boxShadow = '0 3px 10px rgba(255,138,0,0.12)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }}
                              onMouseLeave={(e) => {
                                if (isFull || selected) return;
                                e.currentTarget.style.background = 'rgba(255,138,0,0.04)';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.transform = 'none';
                              }}
                            >
                              {/* Selected checkmark */}
                              {selected && (
                                <span style={{ position: 'absolute', top: 4, right: 4, color: 'var(--accent)', display: 'flex' }}>
                                  <CheckCircle2 size={13} fill="rgba(255,138,0,0.25)" />
                                </span>
                              )}

                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                                {isPart
                                  ? <Clock4 size={11} style={{ color: '#0ea5e9', flexShrink: 0 }} />
                                  : <CalendarDays size={11} style={{ color: '#10b981', flexShrink: 0 }} />}
                                <span style={{ fontSize: 10, fontWeight: 850, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selected ? 'var(--accent)' : 'var(--text-secondary)' }}>
                                  {shift.shiftName}
                                </span>
                              </span>
                              <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: selected ? 'var(--accent)' : 'var(--text-secondary)' }}>
                                {shift.startTime.slice(0, 5)} – {shift.endTime.slice(0, 5)}
                              </span>
                              <span style={{
                                fontSize: 9, fontWeight: 800, padding: '1px 5px',
                                borderRadius: 'var(--radius-sm)', width: 'fit-content',
                                background: isFull ? 'rgba(235,87,87,0.15)' : 'rgba(16,185,129,0.15)',
                                color: isFull ? 'var(--danger)' : 'var(--success)',
                              }}>
                                {isFull ? t('staffShiftSelf.full') : t('staffShiftSelf.remaining', { remaining, total: shift.maxStaff })}
                              </span>
                            </div>
                          );
                        })}

                        {/* ── Empty hint ── */}
                        {!isPast && dayRegistrations.length === 0 && dayAvailableShifts.length === 0 && (
                          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', pointerEvents: 'none', opacity: 0.35, writingMode: 'vertical-rl' }}>
                            {t('staffShiftSelf.noShift')}
                          </div>
                        )}

                        {/* ── My existing registrations ── */}
                        {dayRegistrations.map((registration, index) => {
                          const hours = getRegistrationHours(registration);
                          const isPart = hours <= 4.5;
                          return (
                            <div
                              key={registration.shiftRegistrationId}
                              style={{
                                ...getTimelineBlockStyle(registration),
                                position: 'absolute',
                                left: 8 + (index % 2) * 6,
                                right: 8,
                                zIndex: 2,
                                display: 'grid',
                                alignContent: 'start',
                                gap: 5,
                                padding: '8px 9px',
                                borderRadius: 'var(--radius-sm)',
                                borderLeft: `3px solid ${registration.status === 'Rejected' ? 'var(--danger)' : registration.status === 'Approved' ? 'var(--success)' : 'var(--accent)'}`,
                                background: 'var(--bg-elevated)',
                                boxShadow: '0 8px 18px rgba(0,0,0,0.2)',
                                overflow: 'hidden',
                              }}
                            >
                              {registration.status === 'Pending' && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); void handleCancelRegistration(registration.shiftRegistrationId); }}
                                  style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(235,87,87,0.1)', border: '1px solid rgba(235,87,87,0.2)', color: 'var(--danger)', cursor: 'pointer', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold', zIndex: 5 }}
                                  title={t('staffShiftSelf.cancelRegistration')}
                                >
                                  ×
                                </button>
                              )}
                              <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                                {isPart ? <Clock4 size={12} style={{ color: '#0ea5e9', flexShrink: 0 }} /> : <CalendarDays size={12} style={{ color: '#10b981', flexShrink: 0 }} />}
                                <span style={{ fontSize: 10, fontWeight: 850, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {isPart ? 'PT' : 'FT'} {registration.startTime.slice(0, 5)}
                                </span>
                              </span>
                              <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                                {registration.startTime.slice(0, 5)} – {registration.endTime.slice(0, 5)}
                              </span>
                              <span className={statusClass(registration.status)} style={{ width: 'fit-content', transform: 'scale(0.86)', transformOrigin: 'left center' }}>
                                {registration.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── My Registrations list ── */}
          <ListPanel
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{t('staffShiftSelf.mySchedule')}</span>
                  {!isCancelMode && pendingRegistrations.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCancelMode(true)}
                      style={{ background: 'transparent', border: 0, padding: 4, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)', transition: 'color 160ms, background 160ms' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--danger)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      title={t('staffShiftSelf.selectMultipleToCancel')}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </span>
                {isCancelMode && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 'bold' }}>{t('staffShiftSelf.selectedCount', { count: cancelSelectIds.length })}</span>
                    <button type="button" onClick={() => setCancelSelectIds(pendingRegistrations.map((r) => r.shiftRegistrationId))} className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: 11, height: 24, minHeight: 24 }}>
                      {t('staffShiftSelf.selectAll')}
                    </button>
                    <button type="button" onClick={() => setCancelSelectIds([])} className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: 11, height: 24, minHeight: 24 }}>
                      {t('staffShiftSelf.deselectAll')}
                    </button>
                    {cancelSelectIds.length > 0 && (
                      <button type="button" onClick={handleBulkCancel} className="btn btn-primary" style={{ padding: '3px 10px', fontSize: 11, height: 24, minHeight: 24, background: 'var(--danger)', borderColor: 'var(--danger)', color: '#fff', fontWeight: 'bold' }}>
                        {t('staffShiftSelf.cancelSelected', { count: cancelSelectIds.length })}
                      </button>
                    )}
                    <button type="button" onClick={() => { setIsCancelMode(false); setCancelSelectIds([]); }} className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: 11, height: 24, minHeight: 24 }}>
                      <X size={12} /> {t('staffShiftSelf.exit')}
                    </button>
                  </div>
                )}
              </div>
            }
          >
            {groupedRegistrationsList.length === 0 ? (
              <EmptyLine label={t('staffShiftSelf.noRegistrations')} />
            ) : (
              <div style={{ display: 'grid', gap: 14, padding: 14 }}>
                {groupedRegistrationsList.slice(0, 10).map(([dateKey, dateItems]) => (
                  <div key={dateKey} style={{ display: 'grid', gap: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', background: 'rgba(255,138,0,0.06)', padding: '5px 10px', borderRadius: 'var(--radius-sm)', width: 'fit-content', letterSpacing: '0.05em' }}>
                      {t('staffShiftSelf.day')} {formatDate(dateKey)}
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                      {dateItems.map((item) => {
                        const isPending = item.status === 'Pending';
                        const isCancelSelected = cancelSelectIds.includes(item.shiftRegistrationId);
                        const hours = getRegistrationHours(item);
                        const isPart = hours <= 4.5;
                        const iconColor = isPart ? '#0ea5e9' : '#10b981';
                        return (
                          <li
                            key={item.shiftRegistrationId}
                            style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 12px', background: isCancelSelected ? 'rgba(235,87,87,0.06)' : 'var(--bg-elevated)', border: isCancelSelected ? '1px solid rgba(235,87,87,0.4)' : '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', alignItems: 'center', transition: 'background 160ms, border-color 160ms' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                              {isCancelMode && (
                                isPending
                                  ? <input type="checkbox" checked={isCancelSelected} onChange={() => setCancelSelectIds((prev) => prev.includes(item.shiftRegistrationId) ? prev.filter((id) => id !== item.shiftRegistrationId) : [...prev, item.shiftRegistrationId])} style={{ cursor: 'pointer', width: 15, height: 15, flexShrink: 0, accentColor: 'var(--danger)' }} />
                                  : <input type="checkbox" disabled style={{ opacity: 0.3, width: 15, height: 15, flexShrink: 0 }} />
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: isPart ? 'rgba(14,165,233,0.1)' : 'rgba(16,185,129,0.1)', color: iconColor, flexShrink: 0 }}>
                                {isPart ? <Clock4 size={14} /> : <CalendarDays size={14} />}
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <p style={{ margin: 0, fontSize: 13, fontWeight: 750, color: 'var(--text-primary)' }}>{item.shiftName}</p>
                                  <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 'var(--radius-sm)', background: isPart ? 'rgba(14,165,233,0.12)' : 'rgba(16,185,129,0.12)', color: iconColor, textTransform: 'uppercase' }}>
                                    {isPart ? 'Part' : 'Full'}
                                  </span>
                                </div>
                                <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>
                                  {item.startTime.slice(0, 5)} – {item.endTime.slice(0, 5)}
                                  {item.status === 'Rejected' && item.notes ? ` · ${t('staffShiftSelf.reason')}: ${item.notes}` : ''}
                                </p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                              <span className={statusClass(item.status)}>{item.status}</span>
                              {!isCancelMode && isPending && (
                                <button
                                  type="button"
                                  onClick={() => void handleCancelRegistration(item.shiftRegistrationId)}
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: 11, height: 24, minHeight: 24, color: 'var(--danger)', borderColor: 'rgba(235,87,87,0.2)', background: 'rgba(235,87,87,0.05)' }}
                                >
                                  {t('staffShiftSelf.cancel')}
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </ListPanel>

          {/* Working logs & payroll */}
          <ListPanel title={t('staffShiftSelf.recentWorkLogs')}>
            {history.length === 0
              ? <EmptyLine label={t('staffShiftSelf.noWorkLogs')} />
              : history.slice(0, 4).map((item) => (
                <div key={item.staffWorkingLoggerId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <Row title={formatMoney(item.totalReceived)} meta={`${formatDate(item.workingDate)} – ${item.workingHour}h @ ${formatMoney(item.salaryPerHour)}/h`} badge={item.endedShiftTime ? 'Closed' : 'Open'} />
                  {(item.sales?.length ?? 0) > 0 && (
                    <div style={{ display: 'grid', gap: 8, padding: '0 14px 12px 14px' }}>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase' }}>{t('staffShiftSelf.ticketSalesHistory')}</p>
                      {item.sales!.map((sale) => (
                        <div key={sale.orderId} style={{ padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', display: 'grid', gap: 5 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                            <strong style={{ fontSize: 12, color: 'var(--text-primary)' }}>{sale.movieName}</strong>
                            <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 800 }}>{formatMoney(sale.totalPrice)}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)' }}>
                            {sale.bookingCode} · {sale.cinemaName} · {sale.auditoriumNumber} · {t('staffShiftSelf.seats')} {sale.seats.join(', ')}
                          </p>
                          <span className={statusClass(sale.orderStatus)} style={{ width: 'fit-content' }}>{sale.orderStatus}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </ListPanel>

          <ListPanel title={t('staffShiftSelf.payroll')}>
            {payrolls.length === 0
              ? <EmptyLine label={t('staffShiftSelf.noPayroll')} />
              : payrolls.slice(0, 4).map((item) => (
                <Row key={item.salaryTotalLoggerId} title={formatMoney(item.totalReceived)} meta={`${formatDate(item.receivedDay)} – ${item.paidByName ?? t('staffShiftSelf.pendingPayment')}`} badge={item.paymentStatus} />
              ))}
          </ListPanel>
        </div>
      </div>

      {/* ── Floating Save Bar ── */}
      {selectedShifts.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 22px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 8px 32px rgba(255,138,0,0.22), 0 2px 8px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)',
            minWidth: 320,
            animation: 'slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
              {t('staffShiftSelf.selectedShifts', { count: selectedShifts.length })}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>
              {selectedShifts.map(({ shift, dateValue }) => `${shift.shiftName} (${new Date(`${dateValue}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })})`).join(' · ')}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={clearSelection}
            disabled={saving}
            style={{ padding: '8px 12px', fontSize: 12, flexShrink: 0 }}
          >
            <X size={14} /> {t('staffShiftSelf.deselect')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveSelected}
            disabled={saving}
            style={{ padding: '10px 20px', fontSize: 13, fontWeight: 800, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {saving
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> {t('staffShiftSelf.saving')}</>
              : <><Save size={16} /> {t('staffShiftSelf.saveSchedule', { count: selectedShifts.length })}</>}
          </button>
        </div>
      )}
    </section>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Metric: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 14, background: 'var(--bg-surface)' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ color: 'var(--accent)' }}>{icon}</span>
      <strong style={{ fontSize: 15 }}>{value}</strong>
    </div>
    <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>{label}</p>
  </div>
);

const Panel: React.FC<{ title: string; hint?: string; children: React.ReactNode }> = ({ title, hint, children }) => (
  <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 16, background: 'var(--bg-surface)', display: 'grid', gap: 14 }}>
    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
      <h3 style={{ margin: 0, fontSize: 12, fontWeight: 850, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</h3>
      {hint && <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
    {children}
  </div>
);

const ListPanel: React.FC<{ title: string | React.ReactNode; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-surface)' }}>
    <h3 style={{ margin: 0, padding: '12px 14px', fontSize: 13, fontWeight: 800, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }}>{title}</h3>
    <div style={{ display: 'grid' }}>{children}</div>
  </div>
);

const Row: React.FC<{ title: string; meta: string; badge: string }> = ({ title, meta, badge }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{title}</p>
      <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-secondary)', overflowWrap: 'anywhere' }}>{meta}</p>
    </div>
    <span className={statusClass(badge)} style={{ alignSelf: 'center', flexShrink: 0 }}>{badge}</span>
  </div>
);

const EmptyLine: React.FC<{ label: string }> = ({ label }) => (
  <p style={{ margin: 0, padding: 16, fontSize: 12, color: 'var(--text-muted)' }}>{label}</p>
);

export default StaffShiftSelfService;
