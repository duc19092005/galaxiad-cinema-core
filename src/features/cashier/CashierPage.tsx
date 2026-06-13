import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import {
  BadgeCheck,
  BellRing,
  Camera,
  Clock,
  DoorOpen,
  IdCard,
  Info,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Shirt,
  Ticket,
  UserRound,
} from 'lucide-react';
import { staffShiftApi, CASHIER_SHIFT_SESSION_KEY, POS_TERMINAL_TOKEN_KEY, readCashierShiftSession } from '../../api/staffShiftApi';
import { theaterShiftApi } from '../../api/theaterShiftApi';
import { showError, showSuccess } from '../../utils/ToastUtils';
import { useCinema } from '../../contexts/CinemaContext';
import type { CashierShiftSession, ShiftRegistrationDto, StaffProfileDto } from '../../types/shift.types';

const makeDemoVector = () => Array.from({ length: 128 }, (_, index) => Number((Math.sin(index + 1) * 0.08).toFixed(4)));

const parseFaceVector = (value: string): number[] => {
  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map(Number).filter(Number.isFinite);
    }
  } catch {
    // Fall through to CSV parsing.
  }

  return trimmed
    .split(/[\s,;]+/)
    .map(Number)
    .filter(Number.isFinite);
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) return fallback;
  const payload = error.response?.data as { message?: string; Message?: string; errorCode?: string; ErrorCode?: string } | undefined;
  const code = payload?.errorCode ?? payload?.ErrorCode;
  if (error.response?.status === 409 || code === 'SHIFT_ERR') {
    return 'Shift request is busy. Please wait a few seconds and try again.';
  }
  if (code === 'FACE_ERR') {
    return 'Face verification failed. Center the face in camera and scan again.';
  }
  if (code === 'CLOCK_IN_ERR') {
    return 'No approved shift is available for this staff member right now.';
  }
  return payload?.message ?? payload?.Message ?? fallback;
};

const formatDateTime = (value: string) => new Date(value).toLocaleString('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const makeShiftDateTime = (dateValue: string, timeValue: string) => {
  const datePart = dateValue.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  const timeMatch = timeValue.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!year || !month || !day || !timeMatch) return null;
  return new Date(year, month - 1, day, Number(timeMatch[1]), Number(timeMatch[2]), Number(timeMatch[3] || 0));
};

const formatShiftTime = (value: Date) => value.toLocaleTimeString('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
});

const formatShiftDate = (value: Date) => value.toLocaleDateString('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const getMinutesUntil = (value: Date) => Math.round((value.getTime() - Date.now()) / 60000);

const getReminderCopy = (minutesUntil: number) => {
  if (minutesUntil <= 0) return {
    badge: 'Đến giờ vào ca',
    title: 'Ca làm của bạn đã tới giờ',
    detail: 'Hãy clock-in ngay khi đã sẵn sàng nhận quầy.',
    tone: 'danger',
  };
  if (minutesUntil <= 30) return {
    badge: `Còn ${minutesUntil} phút`,
    title: 'Bạn sắp tới ca làm rồi',
    detail: 'Chuẩn bị đồng phục, bảng tên và kiểm tra khu vực quầy trước khi clock-in.',
    tone: 'warning',
  };
  if (minutesUntil <= 120) return {
    badge: `Còn ${Math.round(minutesUntil / 60 * 10) / 10} giờ`,
    title: 'Sắp tới ca làm',
    detail: 'Nên có mặt sớm 10-15 phút để bàn giao quầy gọn gàng.',
    tone: 'accent',
  };
  return {
    badge: 'Đã lên lịch',
    title: 'Ca làm tiếp theo',
    detail: 'Theo dõi giờ vào ca và chuẩn bị trước khi tới rạp.',
    tone: 'default',
  };
};

const shiftPreparationNotes = [
  'Mặc đúng đồng phục, đeo bảng tên và giữ tác phong gọn gàng.',
  'Có mặt sớm 10-15 phút để nhận bàn giao, kiểm tra máy POS và máy in vé.',
  'Kiểm tra tiền lẻ, hóa đơn, vé in thử và báo quản lý nếu thiết bị có lỗi.',
  'Không dùng tài khoản cá nhân của người khác; clock-in bằng đúng Staff ID của mình.',
];

const CashierPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeCinemaId, activeCinemaName } = useCinema();
  const demoVector = useMemo(() => makeDemoVector(), []);
  const [session, setSession] = useState<CashierShiftSession | null>(() => readCashierShiftSession());
  const [staffProfiles, setStaffProfiles] = useState<StaffProfileDto[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [manualStaffId, setManualStaffId] = useState('');
  const [vectorText, setVectorText] = useState(() => JSON.stringify(demoVector));
  const [simulatedDateTime, setSimulatedDateTime] = useState('');
  const [registrations, setRegistrations] = useState<ShiftRegistrationDto[]>([]);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const effectiveStaffId = selectedStaffId || manualStaffId.trim();

  const loadStaffProfiles = useCallback(async () => {
    if (!activeCinemaId) return;
    setStaffLoading(true);
    try {
      const response = await theaterShiftApi.getStaffProfiles(activeCinemaId);
      setStaffProfiles(response.data || []);
    } catch {
      setStaffProfiles([]);
    } finally {
      setStaffLoading(false);
    }
  }, [activeCinemaId]);

  useEffect(() => {
    loadStaffProfiles();
  }, [loadStaffProfiles]);

  const loadShiftReminders = useCallback(async () => {
    setReminderLoading(true);
    setReminderError(null);
    try {
      const response = await staffShiftApi.getMyRegistrations();
      setRegistrations(response.data || []);
    } catch {
      setRegistrations([]);
      setReminderError('Chưa tải được lịch ca của bạn. Hãy refresh lại hoặc kiểm tra đăng nhập.');
    } finally {
      setReminderLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShiftReminders();
  }, [loadShiftReminders]);

  const upcomingShift = useMemo(() => {
    const now = Date.now();
    return registrations
      .filter((registration) => registration.status === 'Approved')
      .map((registration) => {
        const startsAt = makeShiftDateTime(registration.registrationDate, registration.startTime);
        const endsAt = makeShiftDateTime(registration.registrationDate, registration.endTime);
        return startsAt ? { registration, startsAt, endsAt } : null;
      })
      .filter((item): item is { registration: ShiftRegistrationDto; startsAt: Date; endsAt: Date | null } => Boolean(item))
      .filter((item) => (item.endsAt?.getTime() ?? item.startsAt.getTime()) >= now)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0] || null;
  }, [registrations]);

  const reminderCopy = upcomingShift ? getReminderCopy(getMinutesUntil(upcomingShift.startsAt)) : null;

  const handleUseDemoVector = () => {
    setVectorText(JSON.stringify(demoVector));
  };

  const handleClockIn = async () => {
    if (!effectiveStaffId) {
      showError('Select a staff member or enter Staff ID.');
      return;
    }

    const faceVector = parseFaceVector(vectorText);
    if (faceVector.length !== 128) {
      showError(`Face vector must contain 128 numbers. Current: ${faceVector.length}.`);
      return;
    }

    setSubmitting(true);
    try {
      const currentToken = Cookies.get('X-Access-Token');
      if (currentToken) {
        sessionStorage.setItem(POS_TERMINAL_TOKEN_KEY, currentToken);
      }

      const response = await staffShiftApi.clockIn({
        staffId: effectiveStaffId,
        faceVector,
        simulatedDateTime: simulatedDateTime ? new Date(simulatedDateTime).toISOString() : null,
      });

      Cookies.set('X-Access-Token', response.data.accessToken, { expires: 1, sameSite: 'Lax', path: '/' });
      const nextSession: CashierShiftSession = {
        staffName: response.data.staffName,
        accessToken: response.data.accessToken,
        clockedInAt: new Date().toISOString(),
      };
      localStorage.setItem(CASHIER_SHIFT_SESSION_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
      showSuccess(response.message || `Welcome ${response.data.staffName}.`);
    } catch (error) {
      const previousToken = sessionStorage.getItem(POS_TERMINAL_TOKEN_KEY);
      if (previousToken) Cookies.set('X-Access-Token', previousToken, { expires: 7, sameSite: 'Lax', path: '/' });
      showError(getApiErrorMessage(error, 'Clock-in failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    setSubmitting(true);
    try {
      const response = await staffShiftApi.clockOut({
        simulatedDateTime: simulatedDateTime ? new Date(simulatedDateTime).toISOString() : null,
      });
      const posToken = sessionStorage.getItem(POS_TERMINAL_TOKEN_KEY);
      if (posToken) {
        Cookies.set('X-Access-Token', posToken, { expires: 7, sameSite: 'Lax', path: '/' });
      } else {
        Cookies.remove('X-Access-Token', { path: '/' });
      }
      sessionStorage.removeItem(POS_TERMINAL_TOKEN_KEY);
      localStorage.removeItem(CASHIER_SHIFT_SESSION_KEY);
      setSession(null);
      showSuccess(response.message || 'Clock-out completed.');
    } catch (error) {
      showError(getApiErrorMessage(error, 'Clock-out failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStaff = staffProfiles.find((staff) => staff.userId === effectiveStaffId);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <header style={{
        height: 68,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-surface)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
          }}>
            <Ticket size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>POS Shift Terminal</h1>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
              {activeCinemaName || 'Shared cashier station'}
            </p>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/role-selection')}>
          <DoorOpen size={16} />
          Switch role
        </button>
      </header>

      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 20px 56px' }}>
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.15fr) minmax(320px, 0.85fr)',
          gap: 20,
        }} className="cashier-grid">
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Attendance
                </p>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
                  {session ? 'Staff session active' : 'Clock in with face vector'}
                </h2>
              </div>
              <div className={session ? 'badge badge-success' : 'badge badge-warning'}>
                {session ? 'On shift' : 'Waiting'}
              </div>
            </div>

            {session ? (
              <div style={{ display: 'grid', gap: 16 }}>
                <div style={{
                  padding: 20,
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(34,197,94,0.22)',
                  background: 'rgba(34,197,94,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}>
                  <BadgeCheck size={32} style={{ color: 'var(--success)' }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{session.staffName}</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                      Clocked in at {formatDateTime(session.clockedInAt)}
                    </p>
                  </div>
                </div>

                <label className="input-label" htmlFor="clockout-time">Simulated clock-out time</label>
                <input
                  id="clockout-time"
                  className="input"
                  type="datetime-local"
                  value={simulatedDateTime}
                  onChange={(event) => setSimulatedDateTime(event.target.value)}
                />

                <button className="btn btn-danger" onClick={handleClockOut} disabled={submitting} style={{ minHeight: 44 }}>
                  {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <LogOut size={16} />}
                  Clock out and restore POS account
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                  <div>
                    <label className="input-label" htmlFor="staff-select">Staff profile</label>
                    <select
                      id="staff-select"
                      className="input select"
                      value={selectedStaffId}
                      onChange={(event) => {
                        setSelectedStaffId(event.target.value);
                        if (event.target.value) setManualStaffId('');
                      }}
                      disabled={staffLoading || staffProfiles.length === 0}
                    >
                      <option value="">{staffProfiles.length ? 'Select staff from cinema' : 'No managed staff loaded'}</option>
                      {staffProfiles.map((staff) => (
                        <option key={staff.userId} value={staff.userId}>
                          {staff.userName} - {staff.hasFaceRegistered ? 'face ready' : 'no face'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button className="btn btn-secondary" onClick={loadStaffProfiles} disabled={!activeCinemaId || staffLoading} style={{ alignSelf: 'end', minHeight: 42 }}>
                    {staffLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
                  </button>
                </div>

                <div>
                  <label className="input-label" htmlFor="manual-staff">Manual Staff ID</label>
                  <input
                    id="manual-staff"
                    className="input"
                    placeholder="Paste staff UserId when POS account cannot list staff"
                    value={manualStaffId}
                    onChange={(event) => {
                      setManualStaffId(event.target.value);
                      if (event.target.value) setSelectedStaffId('');
                    }}
                  />
                </div>

                <div>
                  <label className="input-label" htmlFor="face-vector">Face vector</label>
                  <textarea
                    id="face-vector"
                    className="input"
                    value={vectorText}
                    onChange={(event) => setVectorText(event.target.value)}
                    rows={7}
                    style={{ resize: 'vertical', lineHeight: 1.5, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                  <div>
                    <label className="input-label" htmlFor="clockin-time">Simulated clock-in time</label>
                    <input
                      id="clockin-time"
                      className="input"
                      type="datetime-local"
                      value={simulatedDateTime}
                      onChange={(event) => setSimulatedDateTime(event.target.value)}
                    />
                  </div>
                  <button className="btn btn-secondary" onClick={handleUseDemoVector} style={{ alignSelf: 'end', minHeight: 42 }}>
                    <Camera size={16} />
                    Demo vector
                  </button>
                </div>

                <button className="btn btn-primary" onClick={handleClockIn} disabled={submitting} style={{ minHeight: 46 }}>
                  {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ShieldCheck size={16} />}
                  Clock in staff session
                </button>
              </div>
            )}
          </div>

          <aside style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
            <div className="glass-card" style={{
              padding: 20,
              borderColor: reminderCopy?.tone === 'warning'
                ? 'rgba(245, 158, 11, 0.32)'
                : reminderCopy?.tone === 'danger'
                  ? 'rgba(239, 68, 68, 0.32)'
                  : 'rgba(255,255,255,0.06)',
              background: reminderCopy?.tone === 'warning'
                ? 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(255,255,255,0.015))'
                : reminderCopy?.tone === 'danger'
                  ? 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(255,255,255,0.015))'
                  : undefined,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <BellRing size={18} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Thông báo ca làm</h3>
                </div>
                <button className="btn-icon" onClick={loadShiftReminders} disabled={reminderLoading} title="Refresh reminders">
                  {reminderLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
                </button>
              </div>

              {reminderLoading ? (
                <div className="state-center" style={{ minHeight: 120 }}>
                  <Loader2 size={22} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Đang tải lịch ca...</p>
                </div>
              ) : reminderError ? (
                <div style={{ display: 'grid', gap: 10, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Info size={17} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
                    <p style={{ margin: 0 }}>{reminderError}</p>
                  </div>
                </div>
              ) : upcomingShift && reminderCopy ? (
                <div style={{ display: 'grid', gap: 14 }}>
                  <div className={reminderCopy.tone === 'danger' ? 'badge badge-danger' : reminderCopy.tone === 'warning' ? 'badge badge-warning' : 'badge badge-accent'} style={{ width: 'fit-content' }}>
                    {reminderCopy.badge}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 18, fontWeight: 850 }}>{reminderCopy.title}</h4>
                    <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                      {reminderCopy.detail}
                    </p>
                  </div>
                  <div style={{
                    display: 'grid',
                    gap: 8,
                    padding: 12,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                  }}>
                    <strong style={{ fontSize: 14 }}>{upcomingShift.registration.shiftName}</strong>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {formatShiftDate(upcomingShift.startsAt)}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 800 }}>
                      Vào ca lúc {formatShiftTime(upcomingShift.startsAt)}
                      {upcomingShift.endsAt ? ` - kết thúc ${formatShiftTime(upcomingShift.endsAt)}` : ''}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 10, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Info size={17} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
                    <p style={{ margin: 0 }}>Hiện chưa có ca đã duyệt sắp tới cho tài khoản cashier này.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Shirt size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Dặn dò trước ca</h3>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {shiftPreparationNotes.map((note) => (
                  <div key={note} style={{ display: 'grid', gridTemplateColumns: '18px 1fr', gap: 8, alignItems: 'start' }}>
                    <BadgeCheck size={15} style={{ color: 'var(--success)', marginTop: 2 }} />
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <UserRound size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Selected staff</h3>
              </div>
              {selectedStaff ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      background: 'var(--accent-soft)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {selectedStaff.portraitImageUrl ? (
                        <img src={selectedStaff.portraitImageUrl} alt={`${selectedStaff.userName} portrait`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <UserRound size={22} style={{ color: 'var(--accent)' }} />
                      )}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{selectedStaff.userName}</p>
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>{selectedStaff.email}</p>
                    </div>
                  </div>
                  <div className={selectedStaff.hasFaceRegistered ? 'badge badge-success' : 'badge badge-warning'} style={{ width: 'fit-content' }}>
                    {selectedStaff.hasFaceRegistered ? 'Face registered' : 'Needs face registration'}
                  </div>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Pick a profile from the cinema staff list or paste a Staff ID manually.
                </p>
              )}
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Clock size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Session rules</h3>
              </div>
              <div style={{ display: 'grid', gap: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <p style={{ margin: 0 }}>Clock-in stores the current POS token, then switches the browser cookie to the staff JWT returned by backend.</p>
                <p style={{ margin: 0 }}>Clock-out calls backend with the staff JWT, clears the staff session, and restores the POS token.</p>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <IdCard size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Current Staff ID</h3>
              </div>
              <code style={{
                display: 'block',
                padding: 12,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontSize: 11,
                overflowWrap: 'anywhere',
              }}>
                {effectiveStaffId || 'Not selected'}
              </code>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
};

export default CashierPage;
