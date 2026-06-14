import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Banknote, CalendarPlus, ClipboardList, GripVertical, History, Loader2, RefreshCw, TimerReset } from 'lucide-react';
import { staffShiftApi } from '../../../api/staffShiftApi';
import { showError, showSuccess } from '../../../utils/ToastUtils';
import type { PayrollDto, ShiftRegistrationDto, ShiftTemplateDto, StaffWorkingLogDto } from '../../../types/shift.types';

const todayInput = () => new Date().toISOString().slice(0, 10);

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) return fallback;
  const payload = error.response?.data as { message?: string; Message?: string; errorCode?: string; ErrorCode?: string } | undefined;
  const code = payload?.errorCode ?? payload?.ErrorCode;
  if (error.response?.status === 409 || code === 'SHIFT_ERR') return 'Shift registration is busy. Try again in a few seconds.';
  return payload?.message ?? payload?.Message ?? fallback;
};

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatMoney = (value: number) => `${value.toLocaleString('vi-VN')} VND`;

const statusClass = (status: string) => {
  if (status === 'Approved' || status === 'Paid') return 'badge badge-success';
  if (status === 'Pending') return 'badge badge-warning';
  if (status === 'Rejected' || status === 'Cancelled') return 'badge badge-danger';
  return 'badge badge-default';
};

const StaffShiftSelfService: React.FC = () => {
  const [availableDate, setAvailableDate] = useState(todayInput);
  const [startDate, setStartDate] = useState(todayInput);
  const [endDate, setEndDate] = useState(todayInput);
  const [notes, setNotes] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [availableShifts, setAvailableShifts] = useState<ShiftTemplateDto[]>([]);
  const [registrations, setRegistrations] = useState<ShiftRegistrationDto[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollDto[]>([]);
  const [history, setHistory] = useState<StaffWorkingLogDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);

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
  const selectedTemplate = availableShifts.find((shift) => shift.shiftTemplateId === selectedTemplateId);
  const approvedCount = registrations.filter((item) => item.status === 'Approved').length;

  const loadSelfService = useCallback(async () => {
    setLoading(true);
    try {
      const [availableRes, registrationsRes, payrollRes, historyRes] = await Promise.all([
        staffShiftApi.getAvailableShifts(availableDate),
        staffShiftApi.getMyRegistrations(),
        staffShiftApi.getMyPayroll(),
        staffShiftApi.getMyHistory(),
      ]);
      setAvailableShifts(availableRes.data || []);
      setRegistrations(registrationsRes.data || []);
      setPayrolls(payrollRes.data || []);
      setHistory(historyRes.data || []);
      setSelectedTemplateId((current) => current || availableRes.data?.[0]?.shiftTemplateId || '');
    } catch (error) {
      showError(getApiErrorMessage(error, 'Unable to load shift data.'));
    } finally {
      setLoading(false);
    }
  }, [availableDate]);

  useEffect(() => {
    loadSelfService();
  }, [loadSelfService]);

  const handleRegisterShift = async () => {
    if (!selectedTemplateId || !startDate || !endDate) {
      showError('Select shift and date range.');
      return;
    }
    setRegistering(true);
    try {
      const response = await staffShiftApi.registerShift({
        shiftTemplateId: selectedTemplateId,
        startDate: `${startDate}T00:00:00Z`,
        endDate: `${endDate}T00:00:00Z`,
        notes: notes.trim() || undefined,
      });
      showSuccess(response.message || 'Shift registration submitted.');
      setNotes('');
      await loadSelfService();
    } catch (error) {
      showError(getApiErrorMessage(error, 'Unable to register shift.'));
    } finally {
      setRegistering(false);
    }
  };

  const handleShiftDragStart = (event: React.DragEvent<HTMLDivElement>, shiftTemplateId: string) => {
    event.dataTransfer.setData('text/plain', shiftTemplateId);
    event.dataTransfer.effectAllowed = 'copy';
  };

  const handleShiftDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const shiftTemplateId = event.dataTransfer.getData('text/plain');
    if (shiftTemplateId) setSelectedTemplateId(shiftTemplateId);
  };

  return (
    <section className="glass-card" style={{ padding: 24, display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Cashier profile
          </p>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 850 }}>Salary, shifts, and extra work</h2>
          <p style={{ margin: '5px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
            Drag a shift into the registration board, choose dates, then submit it for manager approval.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadSelfService} disabled={loading}>
          {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
          Refresh
        </button>
      </div>

      <div className="employee-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        <Metric icon={<ClipboardList size={17} />} label="Registrations" value={`${approvedCount}/${registrations.length} approved`} />
        <Metric icon={<Banknote size={17} />} label="Paid payroll" value={formatMoney(totalPaid)} />
        <Metric icon={<TimerReset size={17} />} label="Worked hours" value={`${workedHours.toLocaleString('vi-VN')}h`} />
        <Metric icon={<History size={17} />} label="Work logs" value={String(history.length)} />
        <Metric icon={<CalendarPlus size={17} />} label="Available shifts" value={String(availableShifts.length)} />
        <Metric icon={<Banknote size={17} />} label="Pending payroll" value={formatMoney(totalPending)} />
      </div>

      <div className="employee-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 0.95fr) minmax(0, 1.05fr)', gap: 16 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'end' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Available shift templates</h3>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 11 }}>Pick by click or drag into the board.</p>
            </div>
          </div>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="input-label" style={{ margin: 0 }}>Available date</span>
            <input className="input" type="date" value={availableDate} onChange={(event) => setAvailableDate(event.target.value)} />
          </label>
          <div style={{ display: 'grid', gap: 10, minHeight: 280 }}>
            {loading ? (
              <div className="state-center" style={{ minHeight: 180 }}>
                <Loader2 size={22} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 12 }}>Loading shifts...</p>
              </div>
            ) : availableShifts.length === 0 ? (
              <EmptyLine label="No available shifts for this date." />
            ) : availableShifts.map((shift) => {
              const isSelected = shift.shiftTemplateId === selectedTemplateId;
              return (
                <div
                  key={shift.shiftTemplateId}
                  draggable
                  onDragStart={(event) => handleShiftDragStart(event, shift.shiftTemplateId)}
                  onClick={() => setSelectedTemplateId(shift.shiftTemplateId)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '24px minmax(0, 1fr) auto',
                    gap: 10,
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                    background: isSelected ? 'var(--accent-soft)' : 'var(--bg-surface)',
                    cursor: 'grab',
                    boxShadow: isSelected ? '0 0 0 3px rgba(255,138,0,0.08)' : undefined,
                  }}
                >
                  <GripVertical size={16} style={{ color: 'var(--text-muted)' }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>{shift.shiftName}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>
                      {shift.startTime} - {shift.endTime} | {shift.cinemaName}
                    </p>
                  </div>
                  <span className={shift.registeredCount && shift.registeredCount >= shift.maxStaff ? 'badge badge-danger' : 'badge badge-default'}>
                    {shift.registeredCount ?? 0}/{shift.maxStaff}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleShiftDrop}
            style={{
              display: 'grid',
              gap: 12,
              padding: 16,
              minHeight: 248,
              border: selectedTemplate ? '1px solid rgba(255,138,0,0.45)' : '1px dashed rgba(255,255,255,0.18)',
              borderRadius: 'var(--radius-lg)',
              background: selectedTemplate ? 'linear-gradient(135deg, rgba(255,138,0,0.12), rgba(255,255,255,0.02))' : 'var(--bg-surface)',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Registration board</h3>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 11 }}>Drop a shift here, then set the date range.</p>
            </div>
            {selectedTemplate ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ padding: 14, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.12)' }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 850 }}>{selectedTemplate.shiftName}</p>
                  <p style={{ margin: '5px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                    {selectedTemplate.startTime} - {selectedTemplate.endTime} | {selectedTemplate.cinemaName}
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label style={{ display: 'grid', gap: 6 }}>
                    <span className="input-label" style={{ margin: 0 }}>Start</span>
                    <input className="input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                  </label>
                  <label style={{ display: 'grid', gap: 6 }}>
                    <span className="input-label" style={{ margin: 0 }}>End</span>
                    <input className="input" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                  </label>
                </div>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Notes for manager"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  style={{ resize: 'vertical' }}
                />
                <button className="btn btn-primary" onClick={handleRegisterShift} disabled={registering || availableShifts.length === 0}>
                  {registering ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CalendarPlus size={16} />}
                  Submit registration
                </button>
              </div>
            ) : (
              <div className="state-center" style={{ minHeight: 150, color: 'var(--text-muted)' }}>
                <CalendarPlus size={28} style={{ color: 'var(--accent)' }} />
                <p style={{ margin: 0, fontSize: 12 }}>Drag an available shift into this area.</p>
              </div>
            )}
          </div>

          <ListPanel title="My registrations">
            {registrations.length === 0 ? (
              <EmptyLine label="No shift registrations yet." />
            ) : registrations.slice(0, 5).map((item) => (
              <Row key={item.shiftRegistrationId} title={item.shiftName} meta={`${formatDate(item.registrationDate)} - ${item.startTime} to ${item.endTime}`} badge={item.status} />
            ))}
          </ListPanel>

          <ListPanel title="My payroll">
            {payrolls.length === 0 ? (
              <EmptyLine label="No payroll records yet." />
            ) : payrolls.slice(0, 4).map((item) => (
              <Row key={item.salaryTotalLoggerId} title={formatMoney(item.totalReceived)} meta={`${formatDate(item.receivedDay)} - ${item.paidByName || 'Awaiting payment'}`} badge={item.paymentStatus} />
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

const ListPanel: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-surface)' }}>
    <h3 style={{ margin: 0, padding: '12px 14px', fontSize: 13, fontWeight: 800, borderBottom: '1px solid var(--border-color)' }}>{title}</h3>
    <div style={{ display: 'grid' }}>{children}</div>
  </div>
);

const Row: React.FC<{ title: string; meta: string; badge: string }> = ({ title, meta, badge }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
    <div>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{title}</p>
      <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{meta}</p>
    </div>
    <span className={statusClass(badge)} style={{ alignSelf: 'center' }}>{badge}</span>
  </div>
);

const EmptyLine: React.FC<{ label: string }> = ({ label }) => (
  <p style={{ margin: 0, padding: 16, fontSize: 12, color: 'var(--text-muted)' }}>{label}</p>
);

export default StaffShiftSelfService;
