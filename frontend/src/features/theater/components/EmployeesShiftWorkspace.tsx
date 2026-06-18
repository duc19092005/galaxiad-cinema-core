import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  BadgeCheck,
  Banknote,
  CalendarPlus,
  Check,
  CircleDollarSign,
  Loader2,
  RefreshCw,
  ScanFace,
  UserCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { staffShiftApi } from '../../../api/staffShiftApi';
import { theaterShiftApi } from '../../../api/theaterShiftApi';
import { showError, showSuccess } from '../../../utils/ToastUtils';
import type { PayrollDto, ShiftRegistrationDto, ShiftTemplateDto, StaffProfileDto } from '../../../types/shift.types';

const statusFilters = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'] as const;

const todayInput = () => new Date().toISOString().slice(0, 10);
const makeDemoVector = () => Array.from({ length: 128 }, (_, index) => Number((Math.cos(index + 3) * 0.07).toFixed(4)));

const parseFaceVector = (value: string): number[] => {
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) return parsed.map(Number).filter(Number.isFinite);
  } catch {
    // Fall through to CSV parsing.
  }
  return trimmed.split(/[\s,;]+/).map(Number).filter(Number.isFinite);
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) return fallback;
  const payload = error.response?.data as { message?: string; Message?: string; errorCode?: string; ErrorCode?: string } | undefined;
  const code = payload?.errorCode ?? payload?.ErrorCode;
  if (error.response?.status === 409 || code === 'SHIFT_ERR') return 'Shift capacity is being updated. Try again in a few seconds.';
  if (code === 'PAYROLL_ERR') return payload?.message ?? payload?.Message ?? 'Payroll cannot be processed for this staff member.';
  return payload?.message ?? payload?.Message ?? fallback;
};

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatMoney = (value: number) => `${value.toLocaleString('vi-VN')} VND`;

const statusBadgeClass = (status: string) => {
  if (status === 'Approved' || status === 'Paid') return 'badge badge-success';
  if (status === 'Pending') return 'badge badge-warning';
  if (status === 'Rejected' || status === 'Cancelled') return 'badge badge-danger';
  return 'badge badge-default';
};

const StaffPortrait: React.FC<{ src?: string | null; name: string }> = ({ src, name }) => (
  <div style={{
    width: 34,
    height: 34,
    borderRadius: '50%',
    overflow: 'hidden',
    background: 'var(--accent-soft)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }}>
    {src ? (
      <img src={src} alt={`${name} portrait`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    ) : (
      <UserRound size={16} style={{ color: 'var(--accent)' }} />
    )}
  </div>
);

interface EmployeesShiftWorkspaceProps {
  cinemaId: string | null;
}

const EmployeesShiftWorkspace: React.FC<EmployeesShiftWorkspaceProps> = ({ cinemaId }) => {
  const [staff, setStaff] = useState<StaffProfileDto[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplateDto[]>([]);
  const [registrations, setRegistrations] = useState<ShiftRegistrationDto[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>('Pending');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [assignStaffId, setAssignStaffId] = useState('');
  const [assignTemplateId, setAssignTemplateId] = useState('');
  const [assignDate, setAssignDate] = useState(todayInput);
  const [payrollStaffId, setPayrollStaffId] = useState('');
  const [payrollUpToDate, setPayrollUpToDate] = useState(todayInput);
  const [faceStaff, setFaceStaff] = useState<StaffProfileDto | null>(null);
  const [faceVectorText, setFaceVectorText] = useState(() => JSON.stringify(makeDemoVector()));

  const pendingRegistrations = registrations.filter((item) => item.status === 'Pending');
  const pendingPayrolls = payrolls.filter((item) => item.paymentStatus === 'Pending');
  const activeStaff = staff.filter((item) => item.workingStatus);
  const faceReadyCount = staff.filter((item) => item.hasFaceRegistered).length;

  const defaultStaffId = useMemo(() => staff[0]?.userId || '', [staff]);
  const defaultTemplateId = useMemo(() => templates[0]?.shiftTemplateId || '', [templates]);

  const groupedRegistrations = useMemo(() => {
    const groups: { date: string; items: ShiftRegistrationDto[] }[] = [];
    registrations.forEach(r => {
      const formattedDate = formatDate(r.registrationDate);
      let group = groups.find(g => g.date === formattedDate);
      if (!group) {
        group = { date: formattedDate, items: [] };
        groups.push(group);
      }
      group.items.push(r);
    });
    return groups;
  }, [registrations]);

  const loadData = useCallback(async () => {
    if (!cinemaId) return;
    setLoading(true);
    try {
      const [staffRes, templatesRes, registrationsRes, payrollRes] = await Promise.all([
        theaterShiftApi.getStaffProfiles(cinemaId),
        theaterShiftApi.getShiftTemplates(cinemaId),
        theaterShiftApi.getShiftRegistrations(cinemaId, statusFilter === 'All' ? undefined : statusFilter),
        theaterShiftApi.getCinemaPayroll(cinemaId),
      ]);
      setStaff(staffRes.data || []);
      setTemplates(templatesRes.data || []);
      setRegistrations(registrationsRes.data || []);
      setPayrolls(payrollRes.data || []);
      setAssignStaffId((current) => current || staffRes.data?.[0]?.userId || '');
      setPayrollStaffId((current) => current || staffRes.data?.[0]?.userId || '');
      setAssignTemplateId((current) => current || templatesRes.data?.[0]?.shiftTemplateId || '');
    } catch (error) {
      showError(getApiErrorMessage(error, 'Unable to load employee workspace.'));
    } finally {
      setLoading(false);
    }
  }, [cinemaId, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!assignStaffId && defaultStaffId) setAssignStaffId(defaultStaffId);
    if (!payrollStaffId && defaultStaffId) setPayrollStaffId(defaultStaffId);
    if (!assignTemplateId && defaultTemplateId) setAssignTemplateId(defaultTemplateId);
  }, [assignStaffId, assignTemplateId, defaultStaffId, defaultTemplateId, payrollStaffId]);

  const runRegistrationAction = async (
    registration: ShiftRegistrationDto,
    action: 'approve' | 'reject' | 'cancel',
  ) => {
    const note = window.prompt(`Notes for ${action}`, registration.notes || '');
    if (note === null) return;
    setActionLoading(`${action}-${registration.shiftRegistrationId}`);
    try {
      if (action === 'approve') await theaterShiftApi.approveShift(registration.shiftRegistrationId, { notes: note });
      if (action === 'reject') await theaterShiftApi.rejectShift(registration.shiftRegistrationId, { notes: note });
      if (action === 'cancel') await theaterShiftApi.cancelShift(registration.shiftRegistrationId, { notes: note });
      showSuccess(`Shift ${action} completed.`);
      await loadData();
    } catch (error) {
      showError(getApiErrorMessage(error, `Unable to ${action} shift.`));
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignShift = async () => {
    if (!assignStaffId || !assignTemplateId || !assignDate) {
      showError('Select staff, shift template, and date.');
      return;
    }
    setActionLoading('assign');
    try {
      await theaterShiftApi.assignShift({
        staffId: assignStaffId,
        shiftTemplateId: assignTemplateId,
        registrationDate: `${assignDate}T00:00:00Z`,
      });
      showSuccess('Shift assigned.');
      await loadData();
    } catch (error) {
      showError(getApiErrorMessage(error, 'Unable to assign shift.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCalculatePayroll = async () => {
    if (!payrollStaffId || !payrollUpToDate) {
      showError('Select staff and payroll date.');
      return;
    }
    setActionLoading('calculate-payroll');
    try {
      const response = await theaterShiftApi.calculatePayroll({
        staffId: payrollStaffId,
        upToDate: `${payrollUpToDate}T23:59:59Z`,
      });
      showSuccess(response.message || 'Payroll calculated.');
      await loadData();
    } catch (error) {
      showError(getApiErrorMessage(error, 'Unable to calculate payroll.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handlePayPayroll = async (payroll: PayrollDto) => {
    setActionLoading(`pay-${payroll.salaryTotalLoggerId}`);
    try {
      const response = await theaterShiftApi.payPayroll(payroll.salaryTotalLoggerId);
      showSuccess(response.message || 'Payroll paid.');
      await loadData();
    } catch (error) {
      showError(getApiErrorMessage(error, 'Unable to mark payroll as paid.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStaffStatus = async (profile: StaffProfileDto) => {
    setActionLoading(`staff-${profile.userId}`);
    try {
      await theaterShiftApi.updateStaffProfile(profile.userId, {
        cinemaId: profile.cinemaId,
        isCinemaManager: profile.isCinemaManager,
        workingStatus: !profile.workingStatus,
      });
      showSuccess('Staff status updated.');
      await loadData();
    } catch (error) {
      showError(getApiErrorMessage(error, 'Unable to update staff status.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegisterFace = async () => {
    if (!faceStaff) return;
    const faceVector = parseFaceVector(faceVectorText);
    if (faceVector.length !== 128) {
      showError(`Face vector must contain 128 numbers. Current: ${faceVector.length}.`);
      return;
    }
    setActionLoading(`face-${faceStaff.userId}`);
    try {
      await staffShiftApi.registerFace(faceStaff.userId, { faceVector });
      showSuccess('Face vector saved.');
      setFaceStaff(null);
      await loadData();
    } catch (error) {
      showError(getApiErrorMessage(error, 'Unable to register face vector.'));
    } finally {
      setActionLoading(null);
    }
  };

  if (!cinemaId) {
    return (
      <div className="state-center glass-card" style={{ minHeight: 260, padding: 32 }}>
        <Users size={42} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Select a cinema before managing employees.</p>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Employee Operations</h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Manage shift approvals, direct assignments, face vectors, and payroll.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadData} disabled={loading}>
          {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
          Refresh
        </button>
      </div>

      <div className="employee-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        <SummaryTile icon={<Users size={18} />} label="Active staff" value={`${activeStaff.length}/${staff.length}`} />
        <SummaryTile icon={<CalendarPlus size={18} />} label="Pending requests" value={String(pendingRegistrations.length)} />
        <SummaryTile icon={<ScanFace size={18} />} label="Face ready" value={`${faceReadyCount}/${staff.length}`} />
        <SummaryTile icon={<Banknote size={18} />} label="Pending payrolls" value={String(pendingPayrolls.length)} />
      </div>

      <section className="employee-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 0.65fr)', gap: 16 }}>
        <div className="glass-card" style={{ padding: 20, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Shift registrations</h3>
            <select className="input select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as (typeof statusFilters)[number])} style={{ width: 180 }}>
              {statusFilters.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>

          {loading ? (
            <LoadingState label="Loading registrations..." />
          ) : registrations.length === 0 ? (
            <EmptyState label="No shift registrations match this filter." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {groupedRegistrations.map((group) => (
                <div key={group.date} style={{ 
                  background: 'var(--bg-elevated)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-lg)', 
                  padding: '16px 20px',
                  boxShadow: 'var(--shadow-md)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <div style={{ width: 6, height: 16, background: 'var(--accent)', borderRadius: '2px' }} />
                    <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{group.date}</span>
                    <span style={{ 
                      fontSize: '11px', 
                      color: 'var(--accent)', 
                      background: 'var(--accent-soft)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 700,
                      marginLeft: '8px'
                    }}>
                      {group.items.length} đăng ký
                    </span>
                  </div>
                  <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
                    <table style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ color: 'var(--text-primary)', opacity: 0.9 }}>Staff</th>
                          <th style={{ color: 'var(--text-primary)', opacity: 0.9 }}>Shift</th>
                          <th style={{ color: 'var(--text-primary)', opacity: 0.9 }}>Status</th>
                          <th style={{ color: 'var(--text-primary)', opacity: 0.9 }}>Lý do (Notes)</th>
                          <th style={{ textAlign: 'right', color: 'var(--text-primary)', opacity: 0.9 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((registration) => (
                          <tr key={registration.shiftRegistrationId}>
                            <td>
                              <strong style={{ color: 'var(--text-primary)', fontWeight: 650 }}>{registration.staffName}</strong>
                            </td>
                            <td>
                              <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{registration.shiftName}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-primary)', opacity: 0.8, marginTop: 2 }}>{registration.startTime} to {registration.endTime}</div>
                            </td>
                            <td><span className={statusBadgeClass(registration.status)}>{registration.status}</span></td>
                            <td style={{ 
                              color: registration.notes ? 'var(--text-primary)' : 'var(--text-secondary)', 
                              fontSize: 13, 
                              fontStyle: registration.notes ? 'normal' : 'italic',
                              fontWeight: registration.notes ? 500 : 'normal',
                              opacity: registration.notes ? 1 : 0.6
                            }}>
                              {registration.notes || '-'}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                {registration.status === 'Pending' && (
                                  <>
                                    <ActionButton label="Approve" tone="success" icon={<Check size={13} />} loading={actionLoading === `approve-${registration.shiftRegistrationId}`} onClick={() => runRegistrationAction(registration, 'approve')} />
                                    <ActionButton label="Reject" tone="danger" icon={<X size={13} />} loading={actionLoading === `reject-${registration.shiftRegistrationId}`} onClick={() => runRegistrationAction(registration, 'reject')} />
                                  </>
                                )}
                                {registration.status === 'Approved' && (
                                  <ActionButton label="Cancel" tone="danger" icon={<X size={13} />} loading={actionLoading === `cancel-${registration.shiftRegistrationId}`} onClick={() => runRegistrationAction(registration, 'cancel')} />
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <Panel title="Direct assignment" icon={<CalendarPlus size={18} />}>
            <Field label="Staff">
              <select className="input select" value={assignStaffId} onChange={(event) => setAssignStaffId(event.target.value)}>
                {staff.map((item) => <option key={item.userId} value={item.userId}>{item.userName}</option>)}
              </select>
            </Field>
            <Field label="Shift template">
              <select className="input select" value={assignTemplateId} onChange={(event) => setAssignTemplateId(event.target.value)}>
                {templates.map((template) => <option key={template.shiftTemplateId} value={template.shiftTemplateId}>{template.shiftName} ({template.roleName})</option>)}
              </select>
            </Field>
            <Field label="Date">
              <input className="input" type="date" value={assignDate} onChange={(event) => setAssignDate(event.target.value)} />
            </Field>
            <button className="btn btn-primary" onClick={handleAssignShift} disabled={actionLoading === 'assign' || staff.length === 0 || templates.length === 0}>
              {actionLoading === 'assign' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CalendarPlus size={16} />}
              Assign shift
            </button>
          </Panel>

          <Panel title="Payroll" icon={<CircleDollarSign size={18} />}>
            <Field label="Staff">
              <select className="input select" value={payrollStaffId} onChange={(event) => setPayrollStaffId(event.target.value)}>
                {staff.map((item) => <option key={item.userId} value={item.userId}>{item.userName}</option>)}
              </select>
            </Field>
            <Field label="Calculate up to">
              <input className="input" type="date" value={payrollUpToDate} onChange={(event) => setPayrollUpToDate(event.target.value)} />
            </Field>
            <button className="btn btn-primary" onClick={handleCalculatePayroll} disabled={actionLoading === 'calculate-payroll' || staff.length === 0}>
              {actionLoading === 'calculate-payroll' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Banknote size={16} />}
              Calculate payroll
            </button>
          </Panel>
        </div>
      </section>

      <section className="employee-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}>
        <div className="glass-card" style={{ padding: 20, overflow: 'hidden' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Staff profiles</h3>
          {staff.length === 0 ? (
            <EmptyState label="No staff profiles found for this cinema." />
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Staff</th>
                    <th>Face</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((profile) => (
                    <tr key={profile.userId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <StaffPortrait src={profile.portraitImageUrl} name={profile.userName} />
                          <div>
                            <strong>{profile.userName}</strong>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{profile.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={profile.hasFaceRegistered ? 'badge badge-success' : 'badge badge-warning'}>
                          {profile.hasFaceRegistered ? 'Ready' : 'Missing'}
                        </span>
                      </td>
                      <td>
                        <span className={profile.workingStatus ? 'badge badge-success' : 'badge badge-default'}>
                          {profile.workingStatus ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <ActionButton label="Face" tone="neutral" icon={<ScanFace size={13} />} loading={actionLoading === `face-${profile.userId}`} onClick={() => setFaceStaff(profile)} />
                          <ActionButton label={profile.workingStatus ? 'Disable' : 'Enable'} tone={profile.workingStatus ? 'danger' : 'success'} icon={<UserCheck size={13} />} loading={actionLoading === `staff-${profile.userId}`} onClick={() => handleToggleStaffStatus(profile)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: 20, overflow: 'hidden' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Payroll history</h3>
          {payrolls.length === 0 ? (
            <EmptyState label="No payroll records found." />
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Staff</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map((payroll) => (
                    <tr key={payroll.salaryTotalLoggerId}>
                      <td>
                        <strong>{payroll.staffName}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(payroll.receivedDay)}</div>
                      </td>
                      <td>{formatMoney(payroll.totalReceived)}</td>
                      <td><span className={statusBadgeClass(payroll.paymentStatus)}>{payroll.paymentStatus}</span></td>
                      <td>
                        {payroll.paymentStatus === 'Pending' ? (
                          <ActionButton label="Pay" tone="success" icon={<BadgeCheck size={13} />} loading={actionLoading === `pay-${payroll.salaryTotalLoggerId}`} onClick={() => handlePayPayroll(payroll)} />
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{payroll.paidByName || 'Closed'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {faceStaff && (
        <div className="modal-overlay" onClick={() => setFaceStaff(null)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Register face vector</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>{faceStaff.userName}</p>
              </div>
              <button className="btn-icon" onClick={() => setFaceStaff(null)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gap: 12 }}>
              <textarea
                className="input"
                rows={8}
                value={faceVectorText}
                onChange={(event) => setFaceVectorText(event.target.value)}
                style={{ resize: 'vertical', lineHeight: 1.5, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
              />
              <button className="btn btn-secondary" onClick={() => setFaceVectorText(JSON.stringify(makeDemoVector()))}>
                <ScanFace size={16} />
                Fill demo vector
              </button>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setFaceStaff(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRegisterFace} disabled={actionLoading === `face-${faceStaff.userId}`}>
                {actionLoading === `face-${faceStaff.userId}` ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ScanFace size={16} />}
                Save vector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryTile: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="glass-card" style={{ padding: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ color: 'var(--accent)' }}>{icon}</div>
      <span style={{ fontSize: 22, fontWeight: 800 }}>{value}</span>
    </div>
    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>{label}</p>
  </div>
);

const Panel: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="glass-card" style={{ padding: 18, display: 'grid', gap: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ color: 'var(--accent)' }}>{icon}</span>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{title}</h3>
    </div>
    {children}
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label style={{ display: 'grid', gap: 6 }}>
    <span className="input-label" style={{ margin: 0 }}>{label}</span>
    {children}
  </label>
);

const LoadingState: React.FC<{ label: string }> = ({ label }) => (
  <div className="state-center" style={{ minHeight: 180 }}>
    <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{label}</p>
  </div>
);

const EmptyState: React.FC<{ label: string }> = ({ label }) => (
  <div className="state-center" style={{ minHeight: 150, border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
    <UserRound size={28} style={{ color: 'var(--text-muted)', opacity: 0.45 }} />
    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>{label}</p>
  </div>
);

const ActionButton: React.FC<{
  label: string;
  tone: 'success' | 'danger' | 'neutral';
  icon: React.ReactNode;
  loading: boolean;
  onClick: () => void;
}> = ({ label, tone, icon, loading, onClick }) => {
  const color = tone === 'success' ? 'var(--success)' : tone === 'danger' ? 'var(--danger)' : 'var(--text-secondary)';
  const background = tone === 'success'
    ? 'rgba(34,197,94,0.08)'
    : tone === 'danger'
      ? 'rgba(239,68,68,0.08)'
      : 'rgba(255,255,255,0.04)';
  return (
    <button
      className="btn"
      onClick={onClick}
      disabled={loading}
      style={{
        minHeight: 28,
        padding: '5px 10px',
        fontSize: 12,
        color,
        background,
        border: `1px solid ${tone === 'neutral' ? 'var(--border-color)' : `${color}44`}`,
      }}
    >
      {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : icon}
      {label}
    </button>
  );
};

export default EmployeesShiftWorkspace;
