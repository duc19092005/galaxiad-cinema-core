import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Banknote, CalendarPlus, ClipboardList, Loader2, RefreshCw } from 'lucide-react';
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

  return (
    <section className="glass-card" style={{ padding: 24, display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Staff shifts</h2>
          <p style={{ margin: '5px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
            Register shifts, follow approval status, and review payroll.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadSelfService} disabled={loading}>
          {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
          Refresh
        </button>
      </div>

      <div className="employee-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        <Metric icon={<ClipboardList size={17} />} label="Registrations" value={String(registrations.length)} />
        <Metric icon={<Banknote size={17} />} label="Paid payroll" value={formatMoney(totalPaid)} />
        <Metric icon={<CalendarPlus size={17} />} label="Work logs" value={String(history.length)} />
      </div>

      <div className="employee-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.8fr) minmax(0, 1.2fr)', gap: 16 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Register a shift</h3>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="input-label" style={{ margin: 0 }}>Available date</span>
            <input className="input" type="date" value={availableDate} onChange={(event) => setAvailableDate(event.target.value)} />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="input-label" style={{ margin: 0 }}>Shift</span>
            <select className="input select" value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)} disabled={availableShifts.length === 0}>
              {availableShifts.length === 0 && <option value="">No available shifts</option>}
              {availableShifts.map((shift) => (
                <option key={shift.shiftTemplateId} value={shift.shiftTemplateId}>
                  {shift.shiftName} ({shift.registeredCount ?? 0}/{shift.maxStaff})
                </option>
              ))}
            </select>
          </label>
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

        <div style={{ display: 'grid', gap: 16 }}>
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
