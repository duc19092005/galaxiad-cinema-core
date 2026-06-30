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
import { useTranslation } from 'react-i18next';
import FaceScanModal from '../../../components/FaceScanModal';


const statusFilters = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'] as const;

const todayInput = () => new Date().toISOString().slice(0, 10);

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

const addHoursToTime = (timeStr: string, hours: number): string => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const newH = (h + hours) % 24;
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const hoursArray = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutesArray = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

interface EmployeesShiftWorkspaceProps {
  cinemaId: string | null;
  defaultTab?: 'management' | 'scheduling';
  mode?: 'staff-only' | 'shift-management';
}
const EmployeesShiftWorkspace: React.FC<EmployeesShiftWorkspaceProps> = ({ cinemaId, defaultTab = 'management', mode = 'shift-management' }) => {
  const [activeTab, setActiveTab] = useState<'management' | 'scheduling'>(defaultTab);
  
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const { t } = useTranslation();

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
  const [showFaceScanModal, setShowFaceScanModal] = useState(false);

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
  const [newSchedShiftType, setNewSchedShiftType] = useState<1 | 2 | 3>(1);
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatWeeksCount, setRepeatWeeksCount] = useState(4);

  useEffect(() => {
    if (newSchedShiftType === 1) {
      setNewSchedEnd(addHoursToTime(newSchedStart, 8));
    } else if (newSchedShiftType === 2) {
      setNewSchedEnd(addHoursToTime(newSchedStart, 4));
    }
  }, [newSchedStart, newSchedShiftType]);

  const pendingRegistrations = registrations.filter((item) => item.status === 'Pending');
  const pendingPayrolls = payrolls.filter((item) => item.paymentStatus === 'Pending');
  const activeStaff = staff.filter((item) => item.workingStatus);
  const faceReadyCount = staff.filter((item) => item.hasFaceRegistered).length;

  // Removed unused defaultStaffId and defaultTemplateId

  const uniqueRoles = useMemo(() => {
    const map = new Map<string, string>();
    templates.forEach(t => {
      const rid = t.roleId ?? (t as any).RoleId;
      const rname = t.roleName ?? (t as any).RoleName;
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

      const rawStaff = staffRes.data ?? (staffRes as any).Data ?? (Array.isArray(staffRes) ? staffRes : []);
      const rawTemplates = templatesRes.data ?? (templatesRes as any).Data ?? (Array.isArray(templatesRes) ? templatesRes : []);
      const rawRegistrations = registrationsRes.data ?? (registrationsRes as any).Data ?? (Array.isArray(registrationsRes) ? registrationsRes : []);
      const rawPayrolls = payrollRes.data ?? (payrollRes as any).Data ?? (Array.isArray(payrollRes) ? payrollRes : []);
      const rawDepts = deptRes.data ?? (deptRes as any).Data ?? (Array.isArray(deptRes) ? deptRes : []);

      // Normalize all properties and keep DTO shape using spread operator
      const normalizedStaff = rawStaff.map((s: any) => ({
        ...s,
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
        ...t,
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
        ...r,
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
        ...p,
        payrollId: p.payrollId ?? p.PayrollId,
        salaryTotalLoggerId: p.salaryTotalLoggerId ?? p.SalaryTotalLoggerId,
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
        ...d,
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
      showError(getApiErrorMessage(error, t('employeesShiftWorkspace.errorLoadData')));
    } finally {
      setLoading(false);
    }
  }, [cinemaId, statusFilter, t]);

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
      const rawScheds = res.data ?? (res as any).Data ?? (Array.isArray(res) ? res : []);
      const normalizedScheds = rawScheds.map((s: any) => ({
        ...s,
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
          ...r,
          shiftRegistrationId: r.shiftRegistrationId ?? r.ShiftRegistrationId,
          staffId: r.staffId ?? r.StaffId,
          staffName: r.staffName ?? r.StaffName,
          status: r.status ?? r.Status,
        })),
      }));
      setSchedules(normalizedScheds);
    } catch (error) {
      showError(getApiErrorMessage(error, t('employeesShiftWorkspace.errorLoadSchedules')));
    }
  }, [cinemaId, activeTab, selectedDeptId, scheduleStartDate, scheduleEndDate, t]);

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
    const firstStaffId = staff[0]?.userId;
    const firstTemplateId = templates[0]?.shiftTemplateId;

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
      if (target.shiftType) {
        setNewSchedShiftType(target.shiftType as 1 | 2 | 3);
      }
      if (target.shiftType === 3) {
        setNewSchedEnd(target.endTime.slice(0, 5));
      } else {
        setNewSchedEnd(addHoursToTime(target.startTime.slice(0, 5), target.shiftType === 1 ? 8 : 4));
      }
      setNewSchedMaxStaff(target.maxStaff);
      setNewSchedRoleId(target.roleId);
    }
  };

  const runRegistrationAction = async (
    registration: ShiftRegistrationDto,
    action: 'approve' | 'reject' | 'cancel',
  ) => {
    const note = window.prompt(t('employeesShiftWorkspace.promptNotes', { action }), registration.notes || '');
    if (note === null) return;
    setActionLoading(`${action}-${registration.shiftRegistrationId}`);
    try {
      if (action === 'approve') await theaterShiftApi.approveShift(registration.shiftRegistrationId, { notes: note });
      if (action === 'reject') await theaterShiftApi.rejectShift(registration.shiftRegistrationId, { notes: note });
      if (action === 'cancel') await theaterShiftApi.cancelShift(registration.shiftRegistrationId, { notes: note });
      showSuccess(t('employeesShiftWorkspace.shiftActionCompleted', { action }));
      await loadData();
    } catch (error) {
      showError(getApiErrorMessage(error, t('employeesShiftWorkspace.errorShiftAction', { action })));
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignShift = async () => {
    if (!assignStaffId || !assignTemplateId || !assignDate) {
      showError(t('employeesShiftWorkspace.selectStaffTemplateDate'));
      return;
    }
    setActionLoading('assign');
    try {
      await theaterShiftApi.assignShift({
        staffId: assignStaffId,
        shiftTemplateId: assignTemplateId,
        registrationDate: `${assignDate}T00:00:00Z`,
      });
      showSuccess(t('employeesShiftWorkspace.shiftAssigned'));
      await loadData();
    } catch (error) {
      showError(getApiErrorMessage(error, t('employeesShiftWorkspace.errorAssignShift')));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCalculatePayroll = async () => {
    if (!payrollStaffId || !payrollUpToDate) {
      showError(t('employeesShiftWorkspace.selectStaffPayrollDate'));
      return;
    }
    setActionLoading('calculate-payroll');
    try {
      const response = await theaterShiftApi.calculatePayroll({
        staffId: payrollStaffId,
        upToDate: `${payrollUpToDate}T23:59:59Z`,
      });
      showSuccess(response.message || t('employeesShiftWorkspace.payrollCalculated'));
      await loadData();
    } catch (error) {
      showError(getApiErrorMessage(error, t('employeesShiftWorkspace.errorCalculatePayroll')));
    } finally {
      setActionLoading(null);
    }
  };

  const handlePayPayroll = async (payroll: PayrollDto) => {
    setActionLoading(`pay-${payroll.salaryTotalLoggerId}`);
    try {
      const response = await theaterShiftApi.payPayroll(payroll.salaryTotalLoggerId);
      showSuccess(response.message || t('employeesShiftWorkspace.payrollPaid'));
      await loadData();
    } catch (error) {
      showError(getApiErrorMessage(error, t('employeesShiftWorkspace.errorMarkPaid')));
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
      showSuccess(t('employeesShiftWorkspace.staffStatusUpdated'));
      await loadData();
    } catch (error) {
      showError(getApiErrorMessage(error, t('employeesShiftWorkspace.errorUpdateStatus')));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegisterFace = async (faceVector: number[]) => {
    if (!faceStaff) return;
    setShowFaceScanModal(false);
    setActionLoading(`face-${faceStaff.userId}`);
    try {
      await staffShiftApi.registerFace(faceStaff.userId, { faceVector });
      showSuccess(t('employeesShiftWorkspace.faceRegisteredSuccess', { name: faceStaff.userName }));
      setFaceStaff(null);
      await loadData();
    } catch (error) {
      showError(getApiErrorMessage(error, t('employeesShiftWorkspace.errorFaceRegister')));
    } finally {
      setActionLoading(null);
    }
  };

  // Create scheduled shift
  const handleCreateSchedule = async () => {
    if (!cinemaId || !selectedDeptId) return;
    if (!newSchedDate || !newSchedName || !newSchedStart || !newSchedEnd || !newSchedRoleId) {
      showError(t('employeesShiftWorkspace.fillAllDetails'));
      return;
    }

    const isValidTheaterHour = (timeStr: string): boolean => {
      if (!timeStr) return false;
      const [h, m] = timeStr.split(':').map(Number);
      const hourVal = h + m / 60;
      return hourVal >= 6 || hourVal <= 2;
    };

    if (!isValidTheaterHour(newSchedStart) || !isValidTheaterHour(newSchedEnd)) {
      showError(t('employeesShiftWorkspace.theaterHoursError'));
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
            shiftType: newSchedShiftType,
          }
        ],
        repeatWeekly,
        repeatWeeksCount: repeatWeekly ? repeatWeeksCount : undefined,
      });

      showSuccess(t('employeesShiftWorkspace.scheduleCreated'));
      setNewSchedName('');
      setPrefillTemplateId('');
      await loadSchedules();
      await loadData();
    } catch (error) {
      showError(getApiErrorMessage(error, t('employeesShiftWorkspace.errorCreateSchedule')));
    } finally {
      setActionLoading(null);
    }
  };

  // Delete scheduled shift
  const handleDeleteSchedule = async (id: string, hasRegistered: boolean) => {
    const confirmMsg = hasRegistered
      ? t('employeesShiftWorkspace.confirmDeleteHasRegistered')
      : t('employeesShiftWorkspace.confirmDeleteNoRegistered');
    
    if (!window.confirm(confirmMsg)) return;

    const reason = window.prompt(t('employeesShiftWorkspace.promptReason'), '');
    if (reason === null) return;
    if (hasRegistered && !reason.trim()) {
      showError(t('employeesShiftWorkspace.reasonRequired'));
      return;
    }

    setActionLoading(`delete-sched-${id}`);
    try {
      const res = await theaterShiftApi.deleteShiftSchedule(id, { reason });
      showSuccess(res.message || t('employeesShiftWorkspace.actionSuccess'));
      await loadSchedules();
      await loadData();
    } catch (error) {
      showError(getApiErrorMessage(error, t('employeesShiftWorkspace.errorDeleteSchedule')));
    } finally {
      setActionLoading(null);
    }
  };

  if (!cinemaId) {
    return (
      <div className="state-center glass-card" style={{ minHeight: 260, padding: 32 }}>
        <Users size={42} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{t('employeesShiftWorkspace.selectCinemaPrompt')}</p>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ display: 'grid', gap: 20 }}>
      {/* Workspace Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
            {mode === 'staff-only' ? t('employeesShiftWorkspace.titleStaffOnly') : t('employeesShiftWorkspace.titleShiftManagement')}
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            {mode === 'staff-only'
              ? t('employeesShiftWorkspace.subtitleStaffOnly')
              : t('employeesShiftWorkspace.subtitleShiftManagement')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {mode === 'shift-management' && (
            <>
              <button
                className={`btn ${activeTab === 'management' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('management')}
              >
                <CalendarPlus size={16} />
                {t('employeesShiftWorkspace.tabApproveShifts')}
              </button>
              <button
                className={`btn ${activeTab === 'scheduling' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('scheduling')}
              >
                <Calendar size={16} />
                {t('employeesShiftWorkspace.tabCreateSchedule')}
              </button>
            </>
          )}
          <button className="btn btn-secondary" onClick={loadData} disabled={loading}>
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
            {t('employeesShiftWorkspace.refresh')}
          </button>
        </div>
      </div>

      {/* RENDER: QUẢN LÝ NHÂN VIÊN (hiển thị cho cả 2 mode nhưng staff-only chỉ có phần này) */}
      {(mode === 'staff-only' || activeTab === 'management') && (
        <>
          <div className="employee-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
            <SummaryTile icon={<Users size={18} />} label={t('employeesShiftWorkspace.activeStaff')} value={`${activeStaff.length}/${staff.length}`} />
            <SummaryTile icon={<ScanFace size={18} />} label={t('employeesShiftWorkspace.faceRegistered')} value={`${faceReadyCount}/${staff.length}`} />
            <SummaryTile icon={<CalendarPlus size={18} />} label={t('employeesShiftWorkspace.pendingRegistrations')} value={String(pendingRegistrations.length)} />
            <SummaryTile icon={<Banknote size={18} />} label={t('employeesShiftWorkspace.pendingPayrolls')} value={String(pendingPayrolls.length)} />
          </div>

          {/* Phần duyệt ca chỉ hiện ở mode shift-management */}
          {mode === 'shift-management' && (
          <section className="employee-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 0.65fr)', gap: 16 }}>
            <div className="glass-card" style={{ padding: 20, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{t('employeesShiftWorkspace.shiftRegistrations')}</h3>
                <select className="input select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as (typeof statusFilters)[number])} style={{ width: 180 }}>
                  {statusFilters.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>

              {loading ? (
                <LoadingState label={t('employeesShiftWorkspace.loadingRegistrations')} />
              ) : registrations.length === 0 ? (
                <EmptyState label={t('employeesShiftWorkspace.noRegistrationsMatch')} />
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
                          {group.items.length} {t('employeesShiftWorkspace.registrationsCount')}
                        </span>
                      </div>
                      <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
                        <table style={{ width: '100%' }}>
                          <thead>
                            <tr>
                              <th style={{ color: 'var(--text-primary)', opacity: 0.9 }}>{t('employeesShiftWorkspace.colStaff')}</th>
                              <th style={{ color: 'var(--text-primary)', opacity: 0.9 }}>{t('employeesShiftWorkspace.colShift')}</th>
                              <th style={{ color: 'var(--text-primary)', opacity: 0.9 }}>{t('employeesShiftWorkspace.colStatus')}</th>
                              <th style={{ color: 'var(--text-primary)', opacity: 0.9 }}>{t('employeesShiftWorkspace.colNotes')}</th>
                              <th style={{ textAlign: 'right', color: 'var(--text-primary)', opacity: 0.9 }}>{t('employeesShiftWorkspace.colActions')}</th>
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
                                  <div style={{ fontSize: 11, color: 'var(--text-primary)', opacity: 0.8, marginTop: 2 }}>{registration.startTime} {t('employeesShiftWorkspace.timeTo')} {registration.endTime}</div>
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
                                        <ActionButton label={t('employeesShiftWorkspace.approve')} tone="success" icon={<Check size={13} />} loading={actionLoading === `approve-${registration.shiftRegistrationId}`} onClick={() => runRegistrationAction(registration, 'approve')} />
                                        <ActionButton label={t('employeesShiftWorkspace.reject')} tone="danger" icon={<X size={13} />} loading={actionLoading === `reject-${registration.shiftRegistrationId}`} onClick={() => runRegistrationAction(registration, 'reject')} />
                                      </>
                                    )}
                                    {registration.status === 'Approved' && (
                                      <ActionButton label={t('employeesShiftWorkspace.cancel')} tone="danger" icon={<X size={13} />} loading={actionLoading === `cancel-${registration.shiftRegistrationId}`} onClick={() => runRegistrationAction(registration, 'cancel')} />
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
              <Panel title={t('employeesShiftWorkspace.directAssignment')} icon={<CalendarPlus size={18} />}>
                <Field label={t('employeesShiftWorkspace.staff')}>
                  <select className="input select" value={assignStaffId} onChange={(event) => setAssignStaffId(event.target.value)}>
                    {staff.map((item) => <option key={item.userId} value={item.userId}>{item.userName}</option>)}
                  </select>
                </Field>
                <Field label={t('employeesShiftWorkspace.shiftTemplate')}>
                  <select className="input select" value={assignTemplateId} onChange={(event) => setAssignTemplateId(event.target.value)}>
                    {templates.map((template) => <option key={template.shiftTemplateId} value={template.shiftTemplateId}>{template.shiftName} ({template.roleName})</option>)}
                  </select>
                </Field>
                <Field label={t('employeesShiftWorkspace.date')}>
                  <input className="input" type="date" value={assignDate} onChange={(event) => setAssignDate(event.target.value)} />
                </Field>
                <button className="btn btn-primary" onClick={handleAssignShift} disabled={actionLoading === 'assign' || staff.length === 0 || templates.length === 0}>
                  {actionLoading === 'assign' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CalendarPlus size={16} />}
                  {t('employeesShiftWorkspace.assignShift')}
                </button>
              </Panel>

              <Panel title={t('employeesShiftWorkspace.payroll')} icon={<CircleDollarSign size={18} />}>
                <Field label={t('employeesShiftWorkspace.staff')}>
                  <select className="input select" value={payrollStaffId} onChange={(event) => setPayrollStaffId(event.target.value)}>
                    {staff.map((item) => <option key={item.userId} value={item.userId}>{item.userName}</option>)}
                  </select>
                </Field>
                <Field label={t('employeesShiftWorkspace.calculateUpTo')}>
                  <input className="input" type="date" value={payrollUpToDate} onChange={(event) => setPayrollUpToDate(event.target.value)} />
                </Field>
                <button className="btn btn-primary" onClick={handleCalculatePayroll} disabled={actionLoading === 'calculate-payroll' || staff.length === 0}>
                  {actionLoading === 'calculate-payroll' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Banknote size={16} />}
                  {t('employeesShiftWorkspace.calculatePayroll')}
                </button>
              </Panel>

              <Panel title={t('employeesShiftWorkspace.payrollHistory')} icon={<Banknote size={18} />}>
                {payrolls.length === 0 ? (
                  <EmptyState label={t('employeesShiftWorkspace.noPayrollRecords')} />
                ) : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>{t('employeesShiftWorkspace.colPayrollStaff')}</th>
                          <th>{t('employeesShiftWorkspace.colAmount')}</th>
                          <th>{t('employeesShiftWorkspace.colStatus')}</th>
                          <th>{t('employeesShiftWorkspace.colActions')}</th>
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
                                <ActionButton label={t('employeesShiftWorkspace.pay')} tone="success" icon={<BadgeCheck size={13} />} loading={actionLoading === `pay-${payroll.salaryTotalLoggerId}`} onClick={() => handlePayPayroll(payroll)} />
                              ) : (
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{payroll.paidByName || t('employeesShiftWorkspace.paid')}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
            </div>
          </section>
          )}{/* end mode === shift-management */}
          {/* Bảng nhân viên & phòng ban chỉ hiện ở trang Quản lý nhân viên */}
          {mode === 'staff-only' && (
          <section className="employee-layout" style={{ display: 'grid', gap: 16 }}>
            {/* ─── Bảng 1: Nhân viên thực thể ─── */}
            <div className="glass-card" style={{ padding: 20, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <UserRound size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{t('employeesShiftWorkspace.staff')}</h3>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                  background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent)',
                }}>
                  {staff.length} {t('employeesShiftWorkspace.people')}
                </span>
              </div>
              {staff.length === 0 ? (
                <EmptyState label={t('employeesShiftWorkspace.noStaffFound')} />
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('employeesShiftWorkspace.colStaffName')}</th>
                        <th>{t('employeesShiftWorkspace.colDepartment')}</th>
                        <th>{t('employeesShiftWorkspace.colFace')}</th>
                        <th>{t('employeesShiftWorkspace.colStatus')}</th>
                        <th>{t('employeesShiftWorkspace.colActions')}</th>
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
                              {profile.departmentName || t('employeesShiftWorkspace.unassigned')}
                            </span>
                          </td>
                          <td>
                            <span className={profile.hasFaceRegistered ? 'badge badge-success' : 'badge badge-warning'}>
                              {profile.hasFaceRegistered ? t('employeesShiftWorkspace.registered') : t('employeesShiftWorkspace.notYet')}
                            </span>
                          </td>
                          <td>
                            <span className={profile.workingStatus ? 'badge badge-success' : 'badge badge-default'}>
                              {profile.workingStatus ? t('employeesShiftWorkspace.active') : t('employeesShiftWorkspace.inactive')}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <ActionButton label={profile.workingStatus ? t('employeesShiftWorkspace.deactivate') : t('employeesShiftWorkspace.activate')} tone={profile.workingStatus ? 'danger' : 'success'} icon={<UserCheck size={13} />} loading={actionLoading === `staff-${profile.userId}`} onClick={() => handleToggleStaffStatus(profile)} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ─── Bảng 2: Tài khoản quầy phòng ban (POS Shared Accounts) ─── */}
            <div className="glass-card" style={{ padding: 20, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Users size={18} style={{ color: '#f59e0b' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{t('employeesShiftWorkspace.departmentAccounts')}</h3>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                  background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.35)',
                }}>
                  {departments.length} {t('employeesShiftWorkspace.departments')}
                </span>
              </div>
              {departments.length === 0 ? (
                <EmptyState label={t('employeesShiftWorkspace.noDepartments')} />
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('employeesShiftWorkspace.colDepartmentName')}</th>
                        <th>{t('employeesShiftWorkspace.colType')}</th>
                        <th>{t('employeesShiftWorkspace.colPOSEmail')}</th>
                        <th>{t('employeesShiftWorkspace.colStatus')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departments.map((dept, index) => {
                        const id = dept.departmentId ?? dept.DepartmentId;
                        const name = dept.departmentName ?? dept.DepartmentName;
                        const type = dept.cashierType ?? dept.CashierType ?? dept.departmentType ?? dept.DepartmentType;
                        const email = dept.sharedUserEmail ?? dept.SharedUserEmail;
                        const isActive = dept.isActive ?? dept.IsActive;
                        const typeLabel = type === 1 ? t('employeesShiftWorkspace.typeTicketCounter') : type === 2 ? t('employeesShiftWorkspace.typeFoodCounter') : type === 3 ? t('employeesShiftWorkspace.typeWarehouse') : t('employeesShiftWorkspace.typeDepartment');
                        const typeTone = type === 1 ? '#3b82f6' : type === 2 ? '#f59e0b' : type === 3 ? '#8b5cf6' : '#6b7280';
                        const itemKey = (!id || id === '00000000-0000-0000-0000-000000000000') ? `dept-${index}` : id;
                        return (
                          <tr key={itemKey}>
                            <td>
                              <strong style={{ color: 'var(--text-primary)' }}>{name}</strong>
                            </td>
                            <td>
                              <span style={{
                                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                                background: `${typeTone}18`, color: typeTone, border: `1px solid ${typeTone}40`,
                                whiteSpace: 'nowrap'
                              }}>
                                {typeLabel}
                              </span>
                            </td>
                            <td>
                              {email ? (
                                <div>
                                  <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{email}</div>
                                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{t('employeesShiftWorkspace.sharedPOSAccount')}</div>
                                </div>
                              ) : (
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{t('employeesShiftWorkspace.notConfigured')}</span>
                              )}
                            </td>
                            <td>
                              <span className={isActive ? 'badge badge-success' : 'badge badge-default'}>
                                {isActive ? t('employeesShiftWorkspace.active') : t('employeesShiftWorkspace.off')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ─── Bảng 3: Lịch sử lương ─── */}
            <div className="glass-card" style={{ padding: 20, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Banknote size={18} style={{ color: '#22c55e' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{t('employeesShiftWorkspace.payrollHistory')}</h3>
                {pendingPayrolls.length > 0 && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                    background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.35)',
                  }}>
                    {pendingPayrolls.length} {t('employeesShiftWorkspace.awaitingPayment')}
                  </span>
                )}
              </div>
              {payrolls.length === 0 ? (
                <EmptyState label={t('employeesShiftWorkspace.noPayrollRecords')} />
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('employeesShiftWorkspace.colPayrollStaff')}</th>
                        <th>{t('employeesShiftWorkspace.colAmount')}</th>
                        <th>{t('employeesShiftWorkspace.colStatus')}</th>
                        <th>{t('employeesShiftWorkspace.colActions')}</th>
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
                              <ActionButton label={t('employeesShiftWorkspace.pay')} tone="success" icon={<BadgeCheck size={13} />} loading={actionLoading === `pay-${payroll.salaryTotalLoggerId}`} onClick={() => handlePayPayroll(payroll)} />
                            ) : (
                              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{payroll.paidByName || t('employeesShiftWorkspace.paid')}</span>
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
          )}{/* end mode === staff-only */}
        </>
      )}

      {/* RENDER TAB 2: LẬP LỊCH LÀM VIỆC - chỉ hiện ở mode shift-management */}
      {mode === 'shift-management' && activeTab === 'scheduling' && (
        <section className="employee-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 0.65fr)', gap: 16 }}>
          {/* LEFT: SCHEDULE LIST */}
          <div className="glass-card" style={{ padding: 20, display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{t('employeesShiftWorkspace.departmentSchedule')}</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                  {t('employeesShiftWorkspace.departmentScheduleDesc')}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="input-label" style={{ margin: 0, fontSize: 13 }}>{t('employeesShiftWorkspace.department')}:</span>
                <select 
                  className="input select" 
                  value={selectedDeptId} 
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  style={{ width: 180 }}
                >
                  {departments.map((d, index) => {
                    const id = d.departmentId ?? d.DepartmentId;
                    const name = d.departmentName ?? d.DepartmentName;
                    const itemKey = (!id || id === '00000000-0000-0000-0000-000000000000') ? `dept-opt-${index}` : id;
                    return (
                      <option key={itemKey} value={id}>{name}</option>
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
              <span style={{ fontSize: 13, fontWeight: 700 }}>{t('employeesShiftWorkspace.from')}:</span>
              <input type="date" className="input" value={scheduleStartDate} onChange={(e) => setScheduleStartDate(e.target.value)} style={{ width: 140 }} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>{t('employeesShiftWorkspace.to')}:</span>
              <input type="date" className="input" value={scheduleEndDate} onChange={(e) => setScheduleEndDate(e.target.value)} style={{ width: 140 }} />
              <button className="btn btn-secondary" onClick={loadSchedules} style={{ marginLeft: 'auto' }}>
                <RefreshCw size={14} />
                {t('employeesShiftWorkspace.filter')}
              </button>
            </div>

            {schedules.length === 0 ? (
              <EmptyState label={t('employeesShiftWorkspace.noSchedules')} />
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
                                  {s.deletionStatus === 'PendingDeletion' ? t('adminShiftApproval.tableStatusPending') : s.deletionStatus}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                              {t('employeesShiftWorkspace.timeSlot', { start: s.startTime.slice(0, 5), end: s.endTime.slice(0, 5), max: s.maxStaff })}
                            </div>
                            {s.registeredStaff.length > 0 && (
                              <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{t('employeesShiftWorkspace.staffLabel')}:</span>
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
                              {t('employeesShiftWorkspace.registeredCount')}: {s.registeredCount}/{s.maxStaff}
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
                                {t('employeesShiftWorkspace.cancelShift')}
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
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{t('employeesShiftWorkspace.createNewShift')}</h3>
            </div>

            <Field label={t('employeesShiftWorkspace.selectDate')}>
              <input className="input" type="date" value={newSchedDate} onChange={(e) => setNewSchedDate(e.target.value)} />
            </Field>

            <Field label={t('employeesShiftWorkspace.prefillFromTemplate')}>
              <select className="input select" value={prefillTemplateId} onChange={(e) => handlePrefillTemplate(e.target.value)}>
                <option value="">-- {t('employeesShiftWorkspace.selectTemplate')} --</option>
                {templates.map((t) => (
                  <option key={t.shiftTemplateId} value={t.shiftTemplateId}>
                    {t.shiftName} ({t.startTime.slice(0, 5)}-{t.endTime.slice(0, 5)})
                  </option>
                ))}
              </select>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <Field label={t('employeesShiftWorkspace.shiftType')}>
                  <select
                    className="input select"
                    value={newSchedShiftType}
                    onChange={(e) => setNewSchedShiftType(Number(e.target.value) as 1 | 2 | 3)}
                  >
                    <option value={1}>{t('employeesShiftWorkspace.shiftTypeFulltime')}</option>
                    <option value={2}>{t('employeesShiftWorkspace.shiftTypeParttime')}</option>
                    <option value={3}>{t('employeesShiftWorkspace.shiftTypeFlexible')}</option>
                  </select>
                </Field>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <Field label={t('employeesShiftWorkspace.shiftName')}>
                  <input className="input" type="text" value={newSchedName} onChange={(e) => setNewSchedName(e.target.value)} placeholder={t('employeesShiftWorkspace.shiftNamePlaceholder')} />
                </Field>
              </div>
              <Field label={t('employeesShiftWorkspace.startTime')}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <select 
                    className="input select" 
                    value={newSchedStart.split(':')[0] || '08'} 
                    onChange={(e) => {
                      const min = newSchedStart.split(':')[1] || '00';
                      setNewSchedStart(`${e.target.value}:${min}`);
                    }}
                    style={{ flex: 1 }}
                  >
                    {hoursArray.map((h) => (
                      <option key={h} value={h}>{h}h</option>
                    ))}
                  </select>
                  <select 
                    className="input select" 
                    value={newSchedStart.split(':')[1] || '00'} 
                    onChange={(e) => {
                      const hr = newSchedStart.split(':')[0] || '08';
                      setNewSchedStart(`${hr}:${e.target.value}`);
                    }}
                    style={{ flex: 1 }}
                  >
                    {minutesArray.map((m) => (
                      <option key={m} value={m}>{m}m</option>
                    ))}
                  </select>
                </div>
              </Field>
              <Field label={t('employeesShiftWorkspace.endTime')}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <select 
                    className="input select" 
                    value={newSchedEnd.split(':')[0] || '16'} 
                    onChange={(e) => {
                      const min = newSchedEnd.split(':')[1] || '00';
                      setNewSchedEnd(`${e.target.value}:${min}`);
                    }}
                    disabled={newSchedShiftType !== 3}
                    style={{ flex: 1, ...(newSchedShiftType !== 3 ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
                  >
                    {hoursArray.map((h) => (
                      <option key={h} value={h}>{h}h</option>
                    ))}
                  </select>
                  <select 
                    className="input select" 
                    value={newSchedEnd.split(':')[1] || '00'} 
                    onChange={(e) => {
                      const hr = newSchedEnd.split(':')[0] || '16';
                      setNewSchedEnd(`${hr}:${e.target.value}`);
                    }}
                    disabled={newSchedShiftType !== 3}
                    style={{ flex: 1, ...(newSchedShiftType !== 3 ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
                  >
                    {minutesArray.map((m) => (
                      <option key={m} value={m}>{m}m</option>
                    ))}
                  </select>
                </div>
              </Field>
              <Field label={t('employeesShiftWorkspace.maxStaff')}>
                <input className="input" type="number" min={1} value={newSchedMaxStaff} onChange={(e) => setNewSchedMaxStaff(Number(e.target.value))} />
              </Field>
              <Field label={t('employeesShiftWorkspace.role')}>
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
                {t('employeesShiftWorkspace.autoRepeatWeekly')}
              </label>

              {repeatWeekly && (
                <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
                  <span className="input-label" style={{ margin: 0, fontSize: 12 }}>{t('employeesShiftWorkspace.repeatWeeksQuestion')}</span>
                  <select 
                    className="input select" 
                    value={repeatWeeksCount} 
                    onChange={(e) => setRepeatWeeksCount(Number(e.target.value))}
                  >
                    {repeatWeekChoices.map((choice) => (
                      <option key={choice.weeks} value={choice.weeks}>
                        {t('employeesShiftWorkspace.weekChoice', { weeks: choice.weeks, date: choice.dateStr })}
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
              {t('employeesShiftWorkspace.createSchedule')}
            </button>
          </div>
        </section>
      )}

      {/* Face Scan Modal — camera-based real AI recognition */}
      {faceStaff && showFaceScanModal && (
        <FaceScanModal
          mode="register"
          staffName={faceStaff.userName}
          onDescriptor={handleRegisterFace}
          onClose={() => {
            setShowFaceScanModal(false);
            setFaceStaff(null);
          }}
        />
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
