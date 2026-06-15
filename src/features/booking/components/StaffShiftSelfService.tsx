import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Banknote,
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock4,
  GripVertical,
  Loader2,
  RefreshCw,
  TimerReset,
} from 'lucide-react';
import { staffShiftApi } from '../../../api/staffShiftApi';
import { showError, showSuccess } from '../../../utils/ToastUtils';
import type { PayrollDto, ShiftRegistrationDto, ShiftTemplateDto, StaffWorkingLogDto } from '../../../types/shift.types';

type ShiftWorkType = 'part-time' | 'full-time';

const DAY_WINDOW = 7;
const TIME_AXIS = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00'];
const TIME_COLUMN_COUNT = TIME_AXIS.length;
const TIME_SLOT_HEIGHT = 46;
const TIMELINE_START_MINUTES = 6 * 60;
const WORK_TYPES: Array<{ id: ShiftWorkType; label: string; hours: number; description: string }> = [
  { id: 'part-time', label: 'Part-time', hours: 4, description: 'Ca ngan 4 tieng' },
  { id: 'full-time', label: 'Full-time', hours: 8, description: 'Ca dai 8 tieng' },
];

const toInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatMoney = (value: number) => `${value.toLocaleString('vi-VN')} VND`;

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) return fallback;
  const payload = error.response?.data as { message?: string; Message?: string; errorCode?: string; ErrorCode?: string } | undefined;
  const code = payload?.errorCode ?? payload?.ErrorCode;
  if (error.response?.status === 409 || code === 'SHIFT_ERR') return payload?.message ?? payload?.Message ?? 'Shift registration is busy. Try again in a few seconds.';
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

const getShiftWorkType = (shift: ShiftTemplateDto): ShiftWorkType | null => {
  const name = shift.shiftName.toLowerCase();
  if (name.includes('part')) return 'part-time';
  if (name.includes('full')) return 'full-time';
  const hours = getShiftHours(shift);
  if (hours <= 4.5) return 'part-time';
  if (hours >= 7.5) return 'full-time';
  return null;
};

const pickTemplate = (shifts: ShiftTemplateDto[], workType: ShiftWorkType) => (
  shifts
    .filter((shift) => getShiftWorkType(shift) === workType)
    .filter((shift) => (shift.registeredCount ?? 0) < shift.maxStaff)
    .sort((a, b) => parseTimeMinutes(a.startTime) - parseTimeMinutes(b.startTime))[0] || null
);

const registrationDateKey = (registration: ShiftRegistrationDto) => registration.registrationDate.slice(0, 10);

const statusClass = (status: string) => {
  if (status === 'Approved' || status === 'Paid') return 'badge badge-success';
  if (status === 'Pending') return 'badge badge-warning';
  if (status === 'Rejected' || status === 'Cancelled') return 'badge badge-danger';
  return 'badge badge-default';
};

const StaffShiftSelfService: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<{ roles?: string[]; isSharedPosAccount?: boolean } | null>(null);
  const [activeDate, setActiveDate] = useState(todayInput);
  const [dateWindowStart, setDateWindowStart] = useState(todayInput);
  const [selectedWorkType, setSelectedWorkType] = useState<ShiftWorkType>('part-time');
  const [notes, setNotes] = useState('');
  const [availableShifts, setAvailableShifts] = useState<ShiftTemplateDto[]>([]);
  const [registrations, setRegistrations] = useState<ShiftRegistrationDto[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollDto[]>([]);
  const [history, setHistory] = useState<StaffWorkingLogDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [registeringKey, setRegisteringKey] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

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

  const totalPaid = useMemo(
    () => payrolls.filter((item) => item.paymentStatus === 'Paid').reduce((sum, item) => sum + item.totalReceived, 0),
    [payrolls],
  );
  const totalPending = useMemo(
    () => payrolls.filter((item) => item.paymentStatus !== 'Paid').reduce((sum, item) => sum + item.totalReceived, 0),
    [payrolls],
  );
  const workedHours = useMemo(
    () => history.reduce((sum, item) => sum + item.workingHour, 0),
    [history],
  );
  const approvedCount = registrations.filter((item) => item.status === 'Approved').length;

  const dateCells = useMemo(
    () => Array.from({ length: DAY_WINDOW }, (_, index) => addDays(dateWindowStart, index)),
    [dateWindowStart],
  );

  const registrationsByDate = useMemo(() => {
    const grouped = new Map<string, ShiftRegistrationDto[]>();
    registrations.forEach((registration) => {
      const key = registrationDateKey(registration);
      grouped.set(key, [...(grouped.get(key) || []), registration]);
    });
    return grouped;
  }, [registrations]);

  const selectedTypeTemplates = availableShifts.filter((shift) => getShiftWorkType(shift) === selectedWorkType);

  const loadSelfService = useCallback(async (dateOverride?: string) => {
    if (isSharedPosAccount && !staffToken) return;
    const date = dateOverride || activeDate;
    setLoading(true);
    try {
      const [availableRes, registrationsRes, payrollRes, historyRes] = await Promise.all([
        staffShiftApi.getAvailableShifts(date, isSharedPosAccount ? staffToken : undefined),
        staffShiftApi.getMyRegistrations(isSharedPosAccount ? staffToken : undefined),
        staffShiftApi.getMyPayroll(isSharedPosAccount ? staffToken : undefined),
        staffShiftApi.getMyHistory(isSharedPosAccount ? staffToken : undefined),
      ]);
      setAvailableShifts(availableRes.data || []);
      setRegistrations(registrationsRes.data || []);
      setPayrolls(payrollRes.data || []);
      setHistory(historyRes.data || []);
    } catch (error) {
      showError(getApiErrorMessage(error, 'Unable to load shift data.'));
    } finally {
      setLoading(false);
    }
  }, [activeDate, isSharedPosAccount, staffToken]);

  useEffect(() => {
    loadSelfService();
  }, [loadSelfService]);

  const registerWorkTypeOnDate = async (workType: ShiftWorkType, targetDate: string) => {
    if (targetDate < today) {
      showError('Khong the dang ky ngay trong qua khu.');
      return;
    }

    const key = `${workType}-${targetDate}`;
    setRegisteringKey(key);
    setActiveDate(targetDate);

    try {
      const availableRes = await staffShiftApi.getAvailableShifts(targetDate, isSharedPosAccount ? staffToken : undefined);
      const shiftsForDate = availableRes.data || [];
      setAvailableShifts(shiftsForDate);

      const template = pickTemplate(shiftsForDate, workType);
      if (!template) {
        showError(`Ngay ${formatDate(targetDate)} khong co ca ${workType === 'part-time' ? 'Part-time 4h' : 'Full-time 8h'} con slot.`);
        return;
      }

      const response = await staffShiftApi.registerShift({
        shiftTemplateId: template.shiftTemplateId,
        startDate: `${targetDate}T00:00:00Z`,
        endDate: `${targetDate}T00:00:00Z`,
        notes: notes.trim() || undefined,
      }, isSharedPosAccount ? staffToken : undefined);

      showSuccess(response.message || 'Shift registration submitted.');
      setNotes('');
      await loadSelfService(targetDate);
    } catch (error) {
      showError(getApiErrorMessage(error, 'Unable to register shift.'));
    } finally {
      setRegisteringKey(null);
      setDragOverDate(null);
    }
  };

  const handleWorkTypeDragStart = (event: React.DragEvent<HTMLDivElement>, workType: ShiftWorkType) => {
    event.dataTransfer.setData('application/x-shift-work-type', workType);
    event.dataTransfer.effectAllowed = 'copy';
    setSelectedWorkType(workType);
  };

  const handleDateDrop = (event: React.DragEvent<HTMLDivElement>, targetDate: string) => {
    event.preventDefault();
    const workType = event.dataTransfer.getData('application/x-shift-work-type') as ShiftWorkType;
    if (!workType) return;
    setSelectedWorkType(workType);
    void registerWorkTypeOnDate(workType, targetDate);
  };

  const moveDateWindow = (amount: number) => {
    const next = addDays(dateWindowStart, amount);
    const safeNext = next < today ? today : next;
    setDateWindowStart(safeNext);
    setActiveDate(safeNext);
  };

  if (isSharedPosAccount && !staffToken) {
    return (
      <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--accent-soft)', color: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Banknote size={24} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Chua co nhan vien truc ca</h3>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 420, lineHeight: 1.6 }}>
            Vui long quay lai POS terminal va thuc hien Clock-In truoc khi truy cap ho so ca lam.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Cashier profile
          </p>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 850 }}>Dang ky lich lam viec</h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Keo template ca vao weekly board de gui yeu cau cho quan ly rap.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '9px 12px', color: 'var(--accent)', background: 'var(--bg-surface)', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
            Current Date: {new Date(`${today}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
          <button className="btn btn-secondary" onClick={() => loadSelfService()} disabled={loading}>
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
            Refresh
          </button>
        </div>
      </div>

      <div className="employee-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 0.8fr) minmax(0, 1.6fr)', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <Panel title="Available shift templates" hint="Drag to calendar to register a work day.">
            <div style={{ display: 'grid', gap: 12 }}>
              {WORK_TYPES.map((workType) => {
                const isSelected = workType.id === selectedWorkType;
                const icon = workType.id === 'part-time' ? <Clock4 size={18} /> : <CalendarDays size={18} />;
                return (
                  <div
                    key={workType.id}
                    draggable
                    onDragStart={(event) => handleWorkTypeDragStart(event, workType.id)}
                    onClick={() => setSelectedWorkType(workType.id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) 22px',
                      gap: 10,
                      alignItems: 'center',
                      padding: 13,
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                      background: isSelected ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                      cursor: 'grab',
                      transition: 'border-color 160ms ease, background 160ms ease, transform 160ms ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span style={{ color: isSelected ? 'var(--accent)' : 'var(--text-secondary)' }}>{icon}</span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 16, fontWeight: 850, color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>
                          Ca {workType.label}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                          ({workType.hours} tieng)
                        </p>
                      </div>
                    </div>
                    <GripVertical size={18} style={{ color: 'var(--text-muted)' }} />
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Overview">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Metric icon={<ClipboardList size={17} />} label="My registrations" value={`${registrations.length} shifts`} />
              <Metric icon={<CalendarDays size={17} />} label="Approved shifts" value={String(approvedCount)} />
              <Metric icon={<Banknote size={17} />} label="Paid payroll" value={formatMoney(totalPaid)} />
              <Metric icon={<Banknote size={17} />} label="Pending payroll" value={formatMoney(totalPending)} />
              <Metric icon={<TimerReset size={17} />} label="Worked hours" value={`${workedHours.toLocaleString('vi-VN')}h`} />
              <Metric icon={<CalendarPlus size={17} />} label="Available shifts" value={String(availableShifts.length)} />
            </div>
          </Panel>

          <Panel title="Message">
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="input-label" style={{ margin: 0 }}>Message cho quan ly</span>
              <textarea
                className="input"
                rows={4}
                placeholder="Ly do dang ky, ghi chu ca lam..."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                style={{ resize: 'vertical' }}
              />
            </label>
          </Panel>

          <ListPanel title={`Template ${selectedWorkType === 'part-time' ? 'Part-time' : 'Full-time'} trong ngay`}>
            {loading ? (
              <EmptyLine label="Dang tai template..." />
            ) : selectedTypeTemplates.length === 0 ? (
              <EmptyLine label="Ngay dang chon chua co template phu hop." />
            ) : selectedTypeTemplates.map((shift) => (
              <Row
                key={shift.shiftTemplateId}
                title={shift.shiftName}
                meta={`${shift.startTime} - ${shift.endTime} | ${shift.registeredCount ?? 0}/${shift.maxStaff}`}
                badge={`${getShiftHours(shift).toLocaleString('vi-VN')}h`}
              />
            ))}
          </ListPanel>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: 14, borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 850, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <CalendarDays size={16} />
                  Weekly Schedule - {formatDate(dateCells[0])} - {formatDate(dateCells[dateCells.length - 1])}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" onClick={() => moveDateWindow(-7)} disabled={dateWindowStart <= today}>
                  <ChevronLeft size={16} />
                  Prev
                </button>
                <button className="btn btn-secondary" onClick={() => moveDateWindow(7)}>
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div style={{ padding: 14, overflowX: 'auto', background: 'rgba(0,0,0,0.08)' }}>
              <div style={{ minWidth: 900 }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `76px repeat(${DAY_WINDOW}, minmax(112px, 1fr))`,
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  background: 'var(--bg-base)',
                }}>
                  <div style={{ borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }} />
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
                          minHeight: 58,
                          display: 'grid',
                          placeItems: 'center',
                          gap: 2,
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

                  <div style={{ display: 'grid', gridTemplateRows: `repeat(${TIME_COLUMN_COUNT}, ${TIME_SLOT_HEIGHT}px)`, borderRight: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.045)' }}>
                    {TIME_AXIS.map((time) => (
                      <div key={time} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '7px 10px 0 0', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)', opacity: 0.88, fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                        {time}
                      </div>
                    ))}
                  </div>

                  {dateCells.map((dateValue) => {
                    const isPast = dateValue < today;
                    const isActive = dateValue === activeDate;
                    const isDropping = dragOverDate === dateValue;
                    const dayRegistrations = registrationsByDate.get(dateValue) || [];
                    const registerKey = `${selectedWorkType}-${dateValue}`;

                    return (
                      <div
                        key={dateValue}
                        onClick={() => setActiveDate(dateValue)}
                        onDragOver={(event) => {
                          if (isPast) return;
                          event.preventDefault();
                          setDragOverDate(dateValue);
                        }}
                        onDragLeave={() => setDragOverDate((current) => current === dateValue ? null : current)}
                        onDrop={(event) => handleDateDrop(event, dateValue)}
                        style={{
                          minHeight: TIME_COLUMN_COUNT * TIME_SLOT_HEIGHT,
                          position: 'relative',
                          borderRight: '1px solid var(--border-color)',
                          background: isPast
                            ? 'rgba(255,255,255,0.025)'
                            : isDropping
                              ? 'rgba(255,138,0,0.13)'
                              : isActive
                                ? 'rgba(255,138,0,0.045)'
                                : 'var(--bg-base)',
                          opacity: isPast ? 0.55 : 1,
                          cursor: isPast ? 'not-allowed' : 'copy',
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateRows: `repeat(${TIME_COLUMN_COUNT}, ${TIME_SLOT_HEIGHT}px)`, pointerEvents: 'none' }}>
                          {TIME_AXIS.map((time) => <span key={time} style={{ borderBottom: '1px solid rgba(255,255,255,0.055)' }} />)}
                        </div>

                        {!isPast && dayRegistrations.length === 0 && (
                          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', pointerEvents: 'none', opacity: isDropping ? 1 : 0.42, writingMode: 'vertical-rl' }}>
                            Drop shift here
                          </div>
                        )}

                        {registeringKey === registerKey && (
                          <span className="badge badge-accent" style={{ position: 'absolute', top: 8, left: 8, right: 8, zIndex: 4, justifyContent: 'center' }}>
                            <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                            Sending
                          </span>
                        )}

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
                                color: 'var(--text-primary)',
                                boxShadow: '0 8px 18px rgba(0,0,0,0.2)',
                                overflow: 'hidden',
                              }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                                {isPart ? <Clock4 size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} /> : <CalendarDays size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                                <span style={{ fontSize: 10, fontWeight: 850, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {isPart ? 'PT' : 'FT'} {registration.startTime.slice(0, 5)}
                                </span>
                              </span>
                              <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                                {registration.startTime.slice(0, 5)} - {registration.endTime.slice(0, 5)}
                              </span>
                              <span className={statusClass(registration.status)} style={{ width: 'fit-content', transform: 'scale(0.86)', transformOrigin: 'left center' }}>{registration.status}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: 14, borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface)', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => { setNotes(''); setActiveDate(today); setDateWindowStart(today); }}>
                Reset Board
              </button>
              <button className="btn btn-primary" onClick={() => registerWorkTypeOnDate(selectedWorkType, activeDate)} disabled={Boolean(registeringKey)}>
                {registeringKey === `${selectedWorkType}-${activeDate}` ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CalendarPlus size={16} />}
                Submit Registration
              </button>
            </div>
          </div>

          <ListPanel title="My registrations">
            {registrations.length === 0 ? (
              <EmptyLine label="No shift registrations yet." />
            ) : registrations.slice(0, 7).map((item) => (
              <Row
                key={item.shiftRegistrationId}
                title={item.shiftName}
                meta={`${formatDate(item.registrationDate)} - ${item.startTime} to ${item.endTime}${item.status === 'Rejected' && item.notes ? ` | Ly do: ${item.notes}` : ''}`}
                badge={item.status}
              />
            ))}
          </ListPanel>

          <ListPanel title="Recent working logs">
            {history.length === 0 ? (
              <EmptyLine label="No working logs yet." />
            ) : history.slice(0, 4).map((item) => (
              <Row
                key={item.staffWorkingLoggerId}
                title={formatMoney(item.totalReceived)}
                meta={`${formatDate(item.workingDate)} - ${item.workingHour}h at ${formatMoney(item.salaryPerHour)}/h`}
                badge={item.endedShiftTime ? 'Closed' : 'Open'}
              />
            ))}
          </ListPanel>

          <ListPanel title="My payroll">
            {payrolls.length === 0 ? (
              <EmptyLine label="No payroll records yet." />
            ) : payrolls.slice(0, 4).map((item) => (
              <Row key={item.salaryTotalLoggerId} title={formatMoney(item.totalReceived)} meta={`${formatDate(item.receivedDay)} - ${item.paidByName || 'Awaiting payment'}`} badge={item.paymentStatus} />
            ))}
          </ListPanel>
        </div>
      </div>
    </section>
  );
};

const Metric: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 14, background: 'var(--bg-surface)' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ color: 'var(--accent)' }}>{icon}</span>
      <strong style={{ fontSize: 16 }}>{value}</strong>
    </div>
    <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>{label}</p>
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

const ListPanel: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-surface)' }}>
    <h3 style={{ margin: 0, padding: '12px 14px', fontSize: 13, fontWeight: 800, borderBottom: '1px solid var(--border-color)' }}>{title}</h3>
    <div style={{ display: 'grid' }}>{children}</div>
  </div>
);

const Row: React.FC<{ title: string; meta: string; badge: string }> = ({ title, meta, badge }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{title}</p>
      <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>{meta}</p>
    </div>
    <span className={statusClass(badge)} style={{ alignSelf: 'center', flexShrink: 0 }}>{badge}</span>
  </div>
);

const EmptyLine: React.FC<{ label: string }> = ({ label }) => (
  <p style={{ margin: 0, padding: 16, fontSize: 12, color: 'var(--text-muted)' }}>{label}</p>
);

export default StaffShiftSelfService;
