import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  Clock4,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { staffShiftApi } from '../../../api/staffShiftApi';
import { showError, showSuccess } from '../../../utils/ToastUtils';
import type {
  PayrollDto,
  ShiftRegistrationDto,
  ShiftTemplateDto,
  StaffWorkingLogDto,
} from '../../../types/shift.types';
import {
  DAY_WINDOW,
  ListPanel,
  Panel,
  addDays,
  formatDate,
  getApiErrorMessage,
  isPartTime,
  registrationDateKey,
  selectionKey,
  todayInput,
  type SelectedShiftKey,
} from './staffShift/staffShiftHelpers';
import { StaffShiftSummaryCards } from './staffShift/StaffShiftSummaryCards';
import { StaffShiftTimelineGrid } from './staffShift/StaffShiftTimelineGrid';
import { StaffShiftRegistrationsList } from './staffShift/StaffShiftRegistrationsList';
import { StaffPayrollAndHistoryCards } from './staffShift/StaffPayrollAndHistoryCards';
import { StaffShiftRegistrationDrawer } from './staffShift/StaffShiftRegistrationDrawer';

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
    registrations
      .filter((r) => r.status !== 'Cancelled' && r.status !== 'Rejected')
      .forEach((r) => {
        const key = registrationDateKey(r);
        grouped.set(key, [...(grouped.get(key) ?? []), r]);
      });
    return grouped;
  }, [registrations]);

  const pendingRegistrations = useMemo(
    () => registrations.filter((r) => r.status === 'Pending'),
    [registrations],
  );

  const activeGroupedRegistrations = useMemo(() => {
    const grouped = new Map<string, ShiftRegistrationDto[]>();
    registrations
      .filter((r) => r.status !== 'Cancelled' && r.status !== 'Rejected')
      .forEach((r) => {
        const key = registrationDateKey(r);
        grouped.set(key, [...(grouped.get(key) ?? []), r]);
      });
    return Array.from(grouped.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [registrations]);

  const canceledGroupedRegistrations = useMemo(() => {
    const grouped = new Map<string, ShiftRegistrationDto[]>();
    registrations
      .filter((r) => r.status === 'Cancelled' || r.status === 'Rejected')
      .forEach((r) => {
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
  }, [activeDate, dateCells, isSharedPosAccount, staffToken, t]);

  useEffect(() => { loadSelfService(); }, [loadSelfService]);

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
      showSuccess(res.message ?? t('staffShiftSelf.bulkCancelSuccess', { count: cancelSelectIds.length }));
      await loadSelfService();
    } catch (error) {
      showError(getApiErrorMessage(error, t('staffShiftSelf.errorBulkCancel'), t));
    } finally {
      setLoading(false);
    }
  };

  const moveDateWindow = (offsetDays: number) => {
    const next = addDays(dateWindowStart, offsetDays);
    if (next < today) return;
    setDateWindowStart(next);
    setActiveDate(next);
  };

  return (
    <section className="staff-shift-self-service animate-in" style={{ display: 'grid', gap: 20 }}>
      {/* ── Header bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
            {t('staffShiftSelf.title')}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
            {t('staffShiftSelf.subtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            className="input"
            type="date"
            min={today}
            value={activeDate}
            onChange={(e) => {
              const val = e.target.value;
              setActiveDate(val);
              setDateWindowStart(val);
            }}
            style={{ width: 'auto', padding: '7px 12px', fontSize: 13 }}
          />
          <button
            className="btn btn-secondary"
            onClick={() => loadSelfService()}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={15} />}
            {t('staffShiftSelf.refresh')}
          </button>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="staff-shift-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: 20, alignItems: 'start' }}>
        {/* LEFT COLUMN: Sidebar */}
        <div style={{ display: 'grid', gap: 16 }}>
          <StaffShiftSummaryCards
            registrationsCount={registrations.length}
            approvedCount={approvedCount}
            totalPaid={totalPaid}
            totalPending={totalPending}
            workedHours={workedHours}
            availableTodayCount={availableShifts.length}
          />

          {/* Notes for manager */}
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

          {/* Today's available shifts */}
          <ListPanel title={t('staffShiftSelf.shiftsOnDate', { date: formatDate(activeDate) })}>
            {availableShifts.length === 0 ? (
              <p style={{ margin: 0, padding: 16, fontSize: 12, color: 'var(--text-muted)' }}>{t('staffShiftSelf.noShiftsOnDate')}</p>
            ) : (
              <div style={{ display: 'grid', gap: 8, padding: 12 }}>
                {availableShifts.map((shift) => {
                  const remaining = shift.maxStaff - (shift.registeredCount ?? 0);
                  const full = remaining <= 0;
                  const isPart = isPartTime(shift);
                  const iconColor = isPart ? '#0ea5e9' : '#10b981';
                  return (
                    <div
                      key={shift.shiftScheduleId ?? shift.shiftTemplateId}
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
        </div>

        {/* RIGHT COLUMN: Calendar + Registrations + History */}
        <div style={{ display: 'grid', gap: 20 }}>
          <StaffShiftTimelineGrid
            dateCells={dateCells}
            dateWindowStart={dateWindowStart}
            today={today}
            activeDate={activeDate}
            setActiveDate={setActiveDate}
            moveDateWindow={moveDateWindow}
            selectedShifts={selectedShifts}
            toggleShiftSelect={toggleShiftSelect}
            isShiftSelected={isShiftSelected}
            weeklyAvailableShifts={weeklyAvailableShifts}
            registrationsByDate={registrationsByDate}
            handleCancelRegistration={handleCancelRegistration}
          />

          <StaffShiftRegistrationsList
            activeGroupedRegistrations={activeGroupedRegistrations}
            canceledGroupedRegistrations={canceledGroupedRegistrations}
            pendingRegistrations={pendingRegistrations}
            isCancelMode={isCancelMode}
            setIsCancelMode={setIsCancelMode}
            cancelSelectIds={cancelSelectIds}
            setCancelSelectIds={setCancelSelectIds}
            onBulkCancel={handleBulkCancel}
            onCancelRegistration={handleCancelRegistration}
          />

          <StaffPayrollAndHistoryCards
            history={history}
            payrolls={payrolls}
          />
        </div>
      </div>

      {/* ── Floating Save Bar ── */}
      <StaffShiftRegistrationDrawer
        selectedShifts={selectedShifts}
        saving={saving}
        onClear={clearSelection}
        onSave={handleSaveSelected}
      />
    </section>
  );
};

export default StaffShiftSelfService;
