import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  BadgeCheck,
  Banknote,
  Calendar,
  CalendarPlus,
  Check,
  CircleDollarSign,
  Loader2,
  RefreshCw,
  ScanFace,
  Trash2,
  UserCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { staffShiftApi } from '../../../api/staffShiftApi';
import { theaterShiftApi } from '../../../api/theaterShiftApi';
import { facilitiesApi } from '../../../api/facilitiesApi';
import { showError, showSuccess } from '../../../utils/ToastUtils';
import type { PayrollDto, ShiftRegistrationDto, ShiftTemplateDto, StaffProfileDto, ShiftScheduleDto } from '../../../types/shift.types';

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
  if (error.response?.status === 409 || code === 'SHIFT_ERR') return 'Capacity limit updated. Try again in a few seconds.';
  if (code === 'PAYROLL_ERR') return payload?.message ?? payload?.Message ?? 'Payroll cannot be processed.';
  return payload?.message ?? payload?.Message ?? fallback;
};

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatMoney = (value: number) => `${value.toLocaleString('vi-VN')} VND`;

const statusBadgeClass = (status: string) => {
  if (status === 'Approved' || status === 'Paid' || status === 'Active') return 'badge badge-success';
  if (status === 'Pending' || status === 'PendingDeletion') return 'badge badge-warning';
  if (status === 'Rejected' || status === 'Cancelled' || status === 'Deleted') return 'badge badge-danger';
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
  const [activeTab, setActiveTab] = useState<'management' | 'scheduling'>('management');

  // General State
  const [staff, setStaff] = useState<StaffProfileDto[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplateDto[]>([]);
  const [registrations, setRegistrations] = useState<ShiftRegistrationDto[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollDto[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>('Pending');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Direct Assignment State
  const [assignStaffId, setAssignStaffId] = useState('');
  const [assignTemplateId, setAssignTemplateId] = useState('');
  const [assignDate, setAssignDate] = useState(todayInput);

  // Payroll Calculation State
  const [payrollStaffId, setPayrollStaffId] = useState('');
  const [payrollUpToDate, setPayrollUpToDate] = useState(todayInput);

  // Face Registration State
  const [faceStaff, setFaceStaff] = useState<StaffProfileDto | null>(null);
  const [faceVectorText, setFaceVectorText] = useState(() => JSON.stringify(makeDemoVector()));

  // Scheduling Tab State
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [scheduleStartDate, setScheduleStartDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday of current week
    return new Date(d.setDate(diff)).toISOString().slice(0, 10);
  });
  const [scheduleEndDate, setScheduleEndDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) + 6; // Sunday of current week
    return new Date(d.setDate(diff)).toISOString().slice(0, 10);
  });
  const [schedules, setSchedules] = useState<ShiftScheduleDto[]>([]);

  // Schedule Creation Form State
  const [newSchedDate, setNewSchedDate] = useState(todayInput);
  const [prefillTemplateId, setPrefillTemplateId] = useState('');
  const [newSchedName, setNewSchedName] = useState('');
  const [newSchedStart, setNewSchedStart] = useState('08:00');
  const [newSchedEnd, setNewSchedEnd] = useState('16:00');
  const [newSchedMaxStaff, setNewSchedMaxStaff] = useState(2);
  const [newSchedRoleId, setNewSchedRoleId] = useState('');
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatWeeksCount, setRepeatWeeksCount] = useState(4);

  const pendingRegistrations = registrations.filter((item) => item.status === 'Pending');
  const pendingPayrolls = payrolls.filter((item) => item.paymentStatus === 'Pending');
  const activeStaff = staff.filter((item) => item.workingStatus);
  const faceReadyCount = staff.filter((item) => item.hasFaceRegistered).length;

  const defaultStaffId = useMemo(() => staff[0]?.userId || '', [staff]);
  const defaultTemplateId = useMemo(() => templates[0]?.shiftTemplateId || '', [templates]);

  const uniqueRoles = useMemo(() => {
    const map = new Map<string, string>();
    templates.forEach(t => {
      const rid = t.roleId ?? t.RoleId;
      const rname = t.roleName ?? t.RoleName;
      if (rid && rname) map.set(rid, rname);
    });
    const list = Array.from(map.entries()).map(([roleId, roleName]) => ({ roleId, roleName }));
    if (list.length === 0) {
      list.push({ roleId: '1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c', roleName: 'Cashier' });
    }
    return list;
  }, [templates]);

  // Generate repeating week choices based on selected newSchedDate
  const repeatWeekChoices = useMemo(() => {
    if (!newSchedDate) return [];
    const date = new Date(newSchedDate);
    const list = [];
    for (let i = 1; i <= 12; i++) {
      const future = new Date(date);
      future.setDate(date.getDate() + i * 7);
      list.push({
        weeks: i,
        dateStr: future.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      });
    }
    return list;
  }, [newSchedDate]);

  // Group schedules by date for rendering
  const groupedSchedules = useMemo(() => {
    const groups: { date: string; dateObj: Date; items: ShiftScheduleDto[] }[] = [];
    schedules.forEach(s => {
      const dateStr = formatDate(s.date);
      let group = groups.find(g => g.date === dateStr);
      if (!group) {
        group = { date: dateStr, dateObj: new Date(s.date), items: [] };
        groups.push(group);
      }
      group.items.push(s);
    });
    // Sort groups chronologically
    return groups.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [schedules]);

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
      const [staffRes, templatesRes, registrationsRes, payrollRes, deptRes] = await Promise.all([
        theaterShiftApi.getStaffProfiles(cinemaId),
        theaterShiftApi.getShiftTemplates(cinemaId),
        theaterShiftApi.getShiftRegistrations(cinemaId, statusFilter === 'All' ? undefined : statusFilter),
        theaterShiftApi.getCinemaPayroll(cinemaId),
        facilitiesApi.getDepartments(cinemaId),
      ]);

      const rawStaff = staffRes.data ?? staffRes.Data ?? (Array.isArray(staffRes) ? staffRes : []);
      const rawTemplates = templatesRes.data ?? templatesRes.Data ?? (Array.isArray(templatesRes) ? templatesRes : []);
      const rawRegistrations = registrationsRes.data ?? registrationsRes.Data ?? (Array.isArray(registrationsRes) ? registrationsRes : []);
      const rawPayrolls = payrollRes.data ?? payrollRes.Data ?? (Array.isArray(payrollRes) ? payrollRes : []);
      const rawDepts = deptRes.data ?? deptRes.Data ?? (Array.isArray(deptRes) ? deptRes : []);

      // Normalize all properties to standard camelCase
      const normalizedStaff = rawStaff.map((s: any) => ({
        userId: s.userId ?? s.UserId,
        username: s.username ?? s.Username,
        userName: s.userName ?? s.UserName,
        email: s.email ?? s.Email,
        phoneNumber: s.phoneNumber ?? s.PhoneNumber,
        workingStatus: s.workingStatus ?? s.WorkingStatus,
        hasFaceRegistered: s.hasFaceRegistered ?? s.HasFaceRegistered,
        roleName: s.roleName ?? s.RoleName,
        departmentId: s.departmentId ?? s.DepartmentId,
        departmentName: s.departmentName ?? s.DepartmentName,
      }));

      const normalizedTemplates = rawTemplates.map((t: any) => ({
        shiftTemplateId: t.shiftTemplateId ?? t.ShiftTemplateId,
        shiftScheduleId: t.shiftScheduleId ?? t.ShiftScheduleId,
        cinemaId: t.cinemaId ?? t.CinemaId,
        cinemaName: t.cinemaName ?? t.CinemaName,
        shiftName: t.shiftName ?? t.ShiftName,
        startTime: t.startTime ?? t.StartTime,
        endTime: t.endTime ?? t.EndTime,
        maxStaff: t.maxStaff ?? t.MaxStaff,
        registeredCount: t.registeredCount ?? t.RegisteredCount,
        roleId: t.roleId ?? t.RoleId,
        roleName: t.roleName ?? t.RoleName,
      }));

      const normalizedRegistrations = rawRegistrations.map((r: any) => ({
        shiftRegistrationId: r.shiftRegistrationId ?? r.ShiftRegistrationId,
        staffId: r.staffId ?? r.StaffId,
        staffName: r.staffName ?? r.StaffName,
        shiftTemplateId: r.shiftTemplateId ?? r.ShiftTemplateId,
        shiftScheduleId: r.shiftScheduleId ?? r.ShiftScheduleId,
        shiftName: r.shiftName ?? r.ShiftName,
        startTime: r.startTime ?? r.StartTime,
        endTime: r.endTime ?? r.EndTime,
        registrationDate: r.registrationDate ?? r.RegistrationDate,
        status: r.status ?? r.Status,
        approvedByName: r.approvedByName ?? r.ApprovedByName,
      }));

      const normalizedPayrolls = rawPayrolls.map((p: any) => ({
        payrollId: p.payrollId ?? p.PayrollId,
        staffId: p.staffId ?? p.StaffId,
        staffName: p.staffName ?? p.StaffName,
        totalHours: p.totalHours ?? p.TotalHours,
        hourlyRate: p.hourlyRate ?? p.HourlyRate,
        totalSalary: p.totalSalary ?? p.TotalSalary,
        paymentStatus: p.paymentStatus ?? p.PaymentStatus,
        paidAt: p.paidAt ?? p.PaidAt,
        periodStart: p.periodStart ?? p.PeriodStart,
        periodEnd: p.periodEnd ?? p.PeriodEnd,
      }));

      const normalizedDepts = rawDepts.map((d: any) => ({
        departmentId: d.departmentId ?? d.DepartmentId,
        departmentName: d.departmentName ?? d.DepartmentName,
        cinemaId: d.cinemaId ?? d.CinemaId,
        cinemaName: d.cinemaName ?? d.CinemaName,
        departmentType: d.departmentType ?? d.DepartmentType,
        cashierType: d.cashierType ?? d.CashierType,
        sharedUserId: d.sharedUserId ?? d.SharedUserId,
        sharedUserEmail: d.sharedUserEmail ?? d.SharedUserEmail,
        isActive: d.isActive ?? d.IsActive,
      }));

      setStaff(normalizedStaff);
      setTemplates(normalizedTemplates);
      setRegistrations(normalizedRegistrations);
      setPayrolls(normalizedPayrolls);
      setDepartments(normalizedDepts);

      const firstDeptId = normalizedDepts?.[0]?.departmentId ?? '';
      const firstStaffId = normalizedStaff?.[0]?.userId ?? '';
      const firstTemplateId = normalizedTemplates?.[0]?.shiftTemplateId ?? '';

      setSelectedDeptId((current) => current || firstDeptId);
      setAssignStaffId((current) => current || firstStaffId);
      setPayrollStaffId((current) => current || firstStaffId);
      setAssignTemplateId((current) => current || firstTemplateId);
      
      const defaultRoleId = normalizedTemplates?.[0]?.roleId ?? '';
      setNewSchedRoleId((current) => current || defaultRoleId);
    } catch (error) {
      showError(getApiErrorMessage(error, 'Unable to load workspace data.'));
    } finally {
      setLoading(false);
    }
  }, [cinemaId, statusFilter]);

  // Load scheduled shifts for the scheduling tab
  const loadSchedules = useCallback(async () => {
    if (!cinemaId || activeTab !== 'scheduling' || !selectedDeptId) return;
    try {
      const res = await theaterShiftApi.getShiftSchedules(
        cinemaId,
        selectedDeptId,
        `${scheduleStartDate}T00:00:00Z`,
        `${scheduleEndDate}T23:59:59Z`
      );
      const rawScheds = res.data ?? res.Data ?? (Array.isArray(res) ? res : []);
      const normalizedScheds = rawScheds.map((s: any) => ({
        shiftScheduleId: s.shiftScheduleId ?? s.ShiftScheduleId,
        shiftTemplateId: s.shiftTemplateId ?? s.ShiftTemplateId,
        cinemaId: s.cinemaId ?? s.CinemaId,
        departmentId: s.departmentId ?? s.DepartmentId,
        date: s.date ?? s.Date,
        shiftName: s.shiftName ?? s.ShiftName,
        startTime: s.startTime ?? s.StartTime,
        endTime: s.endTime ?? s.EndTime,
        maxStaff: s.maxStaff ?? s.MaxStaff,
        registeredCount: s.registeredCount ?? s.RegisteredCount,
        roleId: s.roleId ?? s.RoleId,
        roleName: s.roleName ?? s.RoleName,
        deletionStatus: s.deletionStatus ?? s.DeletionStatus,
        deletionReason: s.deletionReason ?? s.DeletionReason,
        registeredStaff: (s.registeredStaff ?? s.RegisteredStaff ?? []).map((r: any) => ({
          shiftRegistrationId: r.shiftRegistrationId ?? r.ShiftRegistrationId,
          staffId: r.staffId ?? r.StaffId,
          staffName: r.staffName ?? r.StaffName,
          status: r.status ?? r.Status,
        })),
      }));
      setSchedules(normalizedScheds);
    } catch (error) {
      showError(getApiErrorMessage(error, 'Unable to load schedules.'));
    }
  }, [cinemaId, activeTab, selectedDeptId, scheduleStartDate, scheduleEndDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  useEffect(() => {
    if (departments.length > 0 && !selectedDeptId) {
      const firstDeptId = departments[0].departmentId ?? departments[0].DepartmentId;
      if (firstDeptId) {
        setSelectedDeptId(firstDeptId);
      }
    }
  }, [departments, selectedDeptId]);

  useEffect(() => {
    const firstStaffId = staff[0]?.userId ?? staff[0]?.UserId;
    const firstTemplateId = templates[0]?.shiftTemplateId ?? templates[0]?.ShiftTemplateId;

    if (!assignStaffId && firstStaffId) setAssignStaffId(firstStaffId);
    if (!payrollStaffId && firstStaffId) setPayrollStaffId(firstStaffId);
    if (!assignTemplateId && firstTemplateId) setAssignTemplateId(firstTemplateId);
  }, [assignStaffId, assignTemplateId, staff, templates, payrollStaffId]);

  useEffect(() => {
    if (uniqueRoles.length > 0 && !newSchedRoleId) {
      setNewSchedRoleId(uniqueRoles[0].roleId);
    }
  }, [uniqueRoles, newSchedRoleId]);

  // Handle template pre-filling in scheduling form
  const handlePrefillTemplate = (templateId: string) => {
    setPrefillTemplateId(templateId);
    if (!templateId) return;
    const target = templates.find(t => t.shiftTemplateId === templateId);
    if (target) {
      setNewSchedName(target.shiftName);
      setNewSchedStart(target.startTime.slice(0, 5));
      setNewSchedEnd(target.endTime.slice(0, 5));
      setNewSchedMaxStaff(target.maxStaff);
      setNewSchedRoleId(target.roleId);
    }
  };

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

  // Create scheduled shift
  const handleCreateSchedule = async () => {
    if (!cinemaId || !selectedDeptId) return;
    if (!newSchedDate || !newSchedName || !newSchedStart || !newSchedEnd || !newSchedRoleId) {
      showError('Please fill in all shift details.');
      return;
    }

    setActionLoading('create-schedule');
    try {
      await theaterShiftApi.createShiftSchedule({
        cinemaId,
        departmentId: selectedDeptId,
        date: `${newSchedDate}T00:00:00Z`,
        shifts: [
          {
            shiftName: newSchedName,
            startTime: `${newSchedStart}:00`,
            endTime: `${newSchedEnd}:00`,
            maxStaff: newSchedMaxStaff,
            roleId: newSchedRoleId,
          }
        ],
        repeatWeekly,
        repeatWeeksCount: repeatWeekly ? repeatWeeksCount : undefined,
      });

      showSuccess('Lập lịch làm việc thành công!');
      setNewSchedName('');
      setPrefillTemplateId('');
      await loadSchedules();
      await loadData();
    } catch (error) {
      showError(getApiErrorMessage(error, 'Lập lịch làm việc thất bại.'));
    } finally {
      setActionLoading(null);
    }
  };

  // Delete scheduled shift
  const handleDeleteSchedule = async (id: string, hasRegistered: boolean) => {
    const confirmMsg = hasRegistered 
      ? 'Ca làm này đã có nhân viên đăng ký. Bạn có chắc muốn gửi yêu cầu hủy ca lên Admin?'
      : 'Bạn có chắc muốn xóa ca làm này?';
    
    if (!window.confirm(confirmMsg)) return;

    const reason = window.prompt('Nhập lý do hủy/xóa ca làm:', '');
    if (reason === null) return;
    if (hasRegistered && !reason.trim()) {
      showError('Bắt buộc phải nhập lý do khi hủy ca đã có nhân viên đăng ký.');
      return;
    }

    setActionLoading(`delete-sched-${id}`);
    try {
      const res = await theaterShiftApi.deleteShiftSchedule(id, { reason });
      showSuccess(res.message || 'Thao tác thành công.');
      await loadSchedules();
      await loadData();
    } catch (error) {
      showError(getApiErrorMessage(error, 'Không thể xóa ca làm.'));
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
      {/* Workspace Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Employee Operations</h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Manage shift templates, department schedules, registrations, face data, and payroll.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            className={`btn ${activeTab === 'management' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('management')}
          >
            <Users size={16} />
            Duyệt ca & Nhân sự
          </button>
          <button 
            className={`btn ${activeTab === 'scheduling' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('scheduling')}
          >
            <Calendar size={16} />
            Lập lịch làm việc
          </button>
          <button className="btn btn-secondary" onClick={loadData} disabled={loading}>
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
            Refresh
          </button>
        </div>
      </div>

      {/* RENDER TAB 1: DUYỆT CA & NHÂN SỰ */}
      {activeTab === 'management' && (
        <>
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
                              <th style={{ color: 'var(--text-primary)', opacity: 0.9 }}>Notes</th>
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
                        <th>Department</th>
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
                            <span className="badge badge-default" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                              {profile.departmentName || 'Chưa phân'}
                            </span>
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
        </>
      )}

      {/* RENDER TAB 2: LẬP LỊCH LÀM VIỆC */}
      {activeTab === 'scheduling' && (
        <section className="employee-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 0.65fr)', gap: 16 }}>
          {/* LEFT: SCHEDULE LIST */}
          <div className="glass-card" style={{ padding: 20, display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Lịch làm việc phòng ban</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                  Xem và xóa lịch làm việc theo phòng ban đã chọn.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="input-label" style={{ margin: 0, fontSize: 13 }}>Phòng ban:</span>
                <select 
                  className="input select" 
                  value={selectedDeptId} 
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  style={{ width: 180 }}
                >
                  {departments.map((d) => {
                    const id = d.departmentId ?? d.DepartmentId;
                    const name = d.departmentName ?? d.DepartmentName;
                    return (
                      <option key={id} value={id}>{name}</option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Date Range Selector */}
            <div style={{ 
              display: 'flex', 
              gap: 12, 
              alignItems: 'center', 
              padding: '10px 16px', 
              background: 'var(--bg-elevated)', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-color)',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Từ ngày:</span>
              <input type="date" className="input" value={scheduleStartDate} onChange={(e) => setScheduleStartDate(e.target.value)} style={{ width: 140 }} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Đến ngày:</span>
              <input type="date" className="input" value={scheduleEndDate} onChange={(e) => setScheduleEndDate(e.target.value)} style={{ width: 140 }} />
              <button className="btn btn-secondary" onClick={loadSchedules} style={{ marginLeft: 'auto' }}>
                <RefreshCw size={14} />
                Lọc
              </button>
            </div>

            {schedules.length === 0 ? (
              <EmptyState label="Chưa có lịch làm việc được lập cho phòng ban này trong khoảng thời gian đã chọn." />
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {groupedSchedules.map((group) => (
                  <div key={group.date} style={{ 
                    background: 'var(--bg-elevated)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-lg)', 
                    padding: '16px 20px',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <div style={{ width: 6, height: 16, background: 'var(--accent)', borderRadius: '2px' }} />
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{group.date}</span>
                    </div>

                    <div style={{ display: 'grid', gap: 12 }}>
                      {group.items.map((s) => (
                        <div key={s.shiftScheduleId} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          background: 'rgba(255,255,255,0.02)', 
                          padding: '10px 14px', 
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          flexWrap: 'wrap',
                          gap: 12
                        }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>{s.shiftName}</strong>
                              <span className="badge badge-default" style={{ fontSize: 10 }}>{s.roleName}</span>
                              {s.deletionStatus !== 'Active' && (
                                <span className={statusBadgeClass(s.deletionStatus)}>
                                  {s.deletionStatus === 'PendingDeletion' ? 'Yêu cầu hủy (Chờ duyệt)' : s.deletionStatus}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                              Khung giờ: {s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)} | Tối đa: {s.maxStaff} nhân viên
                            </div>
                            {s.registeredStaff.length > 0 && (
                              <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Nhân viên:</span>
                                {s.registeredStaff.map((r) => (
                                  <span key={r.shiftRegistrationId} style={{ 
                                    fontSize: 10, 
                                    background: r.status === 'Approved' ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)', 
                                    color: r.status === 'Approved' ? 'var(--success)' : 'var(--warning)', 
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    border: `1px solid ${r.status === 'Approved' ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)'}`
                                  }}>
                                    {r.staffName} ({r.status})
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: s.registeredCount >= s.maxStaff ? 'var(--success)' : 'var(--text-secondary)' }}>
                              Đăng ký: {s.registeredCount}/{s.maxStaff}
                            </span>
                            {s.deletionStatus === 'Active' && (
                              <button 
                                className="btn"
                                onClick={() => handleDeleteSchedule(s.shiftScheduleId, s.registeredCount > 0)}
                                disabled={actionLoading === `delete-sched-${s.shiftScheduleId}`}
                                style={{ 
                                  padding: '5px 10px', 
                                  fontSize: 12, 
                                  color: 'var(--danger)', 
                                  background: 'rgba(239,68,68,0.08)',
                                  border: '1px solid rgba(239,68,68,0.2)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                {actionLoading === `delete-sched-${s.shiftScheduleId}` ? (
                                  <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                                ) : (
                                  <Trash2 size={13} />
                                )}
                                Hủy ca
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: CREATE SCHEDULE FORM */}
          <div className="glass-card" style={{ padding: 20, display: 'grid', gap: 16, alignContent: 'start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '4px' }}>
              <CalendarPlus size={20} style={{ color: 'var(--accent)' }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Tạo ca làm việc mới</h3>
            </div>

            <Field label="Chọn ngày">
              <input className="input" type="date" value={newSchedDate} onChange={(e) => setNewSchedDate(e.target.value)} />
            </Field>

            <Field label="Lấy thông tin từ ca mẫu (Optional)">
              <select className="input select" value={prefillTemplateId} onChange={(e) => handlePrefillTemplate(e.target.value)}>
                <option value="">-- Chọn ca trực mẫu --</option>
                {templates.map((t) => (
                  <option key={t.shiftTemplateId} value={t.shiftTemplateId}>
                    {t.shiftName} ({t.startTime.slice(0, 5)}-{t.endTime.slice(0, 5)})
                  </option>
                ))}
              </select>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <Field label="Tên ca làm">
                  <input className="input" type="text" value={newSchedName} onChange={(e) => setNewSchedName(e.target.value)} placeholder="Ví dụ: Ca sáng full time" />
                </Field>
              </div>
              <Field label="Giờ bắt đầu">
                <input className="input" type="time" value={newSchedStart} onChange={(e) => setNewSchedStart(e.target.value)} />
              </Field>
              <Field label="Giờ kết thúc">
                <input className="input" type="time" value={newSchedEnd} onChange={(e) => setNewSchedEnd(e.target.value)} />
              </Field>
              <Field label="Số nhân viên tối đa">
                <input className="input" type="number" min={1} value={newSchedMaxStaff} onChange={(e) => setNewSchedMaxStaff(Number(e.target.value))} />
              </Field>
              <Field label="Vai trò">
                <select className="input select" value={newSchedRoleId} onChange={(e) => setNewSchedRoleId(e.target.value)}>
                  {uniqueRoles.map((r) => (
                    <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Repetition options */}
            <div style={{ 
              display: 'grid', 
              gap: 8, 
              padding: '12px 14px', 
              background: 'var(--bg-elevated)', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              marginTop: 4
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                <input type="checkbox" checked={repeatWeekly} onChange={(e) => setRepeatWeekly(e.target.checked)} style={{ width: 16, height: 16 }} />
                Tự động lặp lại hàng tuần
              </label>

              {repeatWeekly && (
                <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
                  <span className="input-label" style={{ margin: 0, fontSize: 12 }}>Áp dụng tới tuần số mấy?</span>
                  <select 
                    className="input select" 
                    value={repeatWeeksCount} 
                    onChange={(e) => setRepeatWeeksCount(Number(e.target.value))}
                  >
                    {repeatWeekChoices.map((choice) => (
                      <option key={choice.weeks} value={choice.weeks}>
                        Tuần {choice.weeks} (đến ngày {choice.dateStr})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button 
              className="btn btn-primary" 
              onClick={handleCreateSchedule} 
              disabled={actionLoading === 'create-schedule' || !selectedDeptId}
              style={{ width: '100%', marginTop: 8 }}
            >
              {actionLoading === 'create-schedule' ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <CalendarPlus size={16} />
              )}
              Lập lịch làm việc
            </button>
          </div>
        </section>
      )}

      {/* Face Vector Modal */}
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
