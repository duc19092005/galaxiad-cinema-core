import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  CalendarPlus,
  Loader2,
  RefreshCw,
  Users,
} from 'lucide-react';
import { staffShiftApi } from '../../../api/staffShiftApi';
import { theaterShiftApi } from '../../../api/theaterShiftApi';
import { facilitiesApi } from '../../../api/facilitiesApi';
import { showError, showSuccess } from '../../../utils/ToastUtils';
import type {
  PayrollDto,
  ShiftRegistrationDto,
  ShiftScheduleDto,
  ShiftTemplateDto,
  StaffProfileDto,
} from '../../../types/shift.types';
import FaceScanModal from '../../../components/FaceScanModal';
import {
  addHoursToTime,
  formatDate,
  getApiErrorMessage,
  parseLocalDate,
  scheduleDateKey,
  statusFilters,
  todayInput,
  toLocalDateKey,
} from './shiftWorkspace/shiftWorkspaceHelpers';
import { ShiftSummaryCards } from './shiftWorkspace/ShiftSummaryCards';
import { ShiftRegistrationsSection } from './shiftWorkspace/ShiftRegistrationsSection';
import { ShiftDirectAssignmentSection } from './shiftWorkspace/ShiftDirectAssignmentSection';
import { PayrollSection } from './shiftWorkspace/PayrollSection';
import { StaffDirectorySection } from './shiftWorkspace/StaffDirectorySection';
import { ShiftSchedulingSection } from './shiftWorkspace/ShiftSchedulingSection';

interface EmployeesShiftWorkspaceProps {
  cinemaId: string | null;
  defaultTab?: 'management' | 'scheduling';
  mode?: 'staff-only' | 'shift-management';
  /** When true, hide management/scheduling tab switcher (dedicated route pages). */
  lockToDefaultTab?: boolean;
}

const EmployeesShiftWorkspace: React.FC<EmployeesShiftWorkspaceProps> = ({
  cinemaId,
  defaultTab = 'management',
  mode = 'shift-management',
  lockToDefaultTab = false,
}) => {
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
    d.setDate(diff);
    return toLocalDateKey(d);
  });
  const [scheduleEndDate, setScheduleEndDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) + 6; // Sunday of current week
    d.setDate(diff);
    return toLocalDateKey(d);
  });
  const [focusedDay, setFocusedDay] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<ShiftScheduleDto[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);

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

  const uniqueRoles = useMemo(() => {
    const map = new Map<string, string>();
    templates.forEach(tpl => {
      const rid = tpl.roleId ?? (tpl as any).RoleId;
      const rname = tpl.roleName ?? (tpl as any).RoleName;
      if (rid && rname) map.set(rid, rname);
    });
    const list = Array.from(map.entries()).map(([roleId, roleName]) => ({ roleId, roleName }));
    const requiredRoles = [
      { roleId: '1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c', roleName: 'Cashier' },
      { roleId: '7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1', roleName: 'Janitor' },
    ];
    requiredRoles.forEach((role) => {
      if (!list.some((item) => item.roleId === role.roleId)) list.push(role);
    });
    return list;
  }, [templates]);

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

  const shiftWeekDays = useMemo(() => {
    const start = parseLocalDate(scheduleStartDate);
    if (Number.isNaN(start.getTime())) return [];
    const todayKey = todayInput();
    const end = parseLocalDate(scheduleEndDate);
    const days = [];
    const cursor = new Date(start);
    for (let i = 0; i < 14 && cursor.getTime() <= end.getTime(); i++) {
      const key = toLocalDateKey(cursor);
      const count = schedules.filter((s) => scheduleDateKey(s.date) === key).length;
      days.push({
        key,
        label: cursor.toLocaleDateString('vi-VN', { weekday: 'short' }),
        sub: cursor.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        count,
        isToday: key === todayKey,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [scheduleStartDate, scheduleEndDate, schedules]);

  const visibleSchedules = useMemo(() => {
    if (!focusedDay) return schedules;
    return schedules.filter((s) => scheduleDateKey(s.date) === focusedDay);
  }, [schedules, focusedDay]);

  const shiftStats = useMemo(() => {
    const list = visibleSchedules;
    const total = list.length;
    const full = list.filter((s) => s.registeredCount >= s.maxStaff).length;
    const open = list.filter((s) => s.registeredCount < s.maxStaff && s.deletionStatus === 'Active').length;
    const pendingDel = list.filter((s) => s.deletionStatus === 'PendingDeletion').length;
    return { total, full, open, pendingDel };
  }, [visibleSchedules]);

  const shiftRangeByDays = (anchor: string, offsetWeeks: number) => {
    const start = parseLocalDate(anchor);
    if (Number.isNaN(start.getTime())) return;
    start.setDate(start.getDate() + offsetWeeks * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    setFocusedDay(null);
    setScheduleStartDate(toLocalDateKey(start));
    setScheduleEndDate(toLocalDateKey(end));
  };

  const groupedSchedules = useMemo(() => {
    const groups: { date: string; dateKey: string; dateObj: Date; items: ShiftScheduleDto[] }[] = [];
    visibleSchedules.forEach((s) => {
      const key = scheduleDateKey(s.date);
      const dateStr = formatDate(s.date);
      let group = groups.find((g) => g.dateKey === key);
      if (!group) {
        group = { date: dateStr, dateKey: key, dateObj: parseLocalDate(key || todayInput()), items: [] };
        groups.push(group);
      }
      group.items.push(s);
    });
    return groups.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [visibleSchedules]);

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

  const loadSchedules = useCallback(async () => {
    if (!cinemaId || activeTab !== 'scheduling') return;
    if (!selectedDeptId) {
      setSchedules([]);
      return;
    }
    const start = scheduleStartDate.slice(0, 10);
    const end = scheduleEndDate.slice(0, 10);
    if (!start || !end) return;

    setSchedulesLoading(true);
    try {
      const res = await theaterShiftApi.getShiftSchedules(cinemaId, selectedDeptId, start, end);
      const rawScheds = res.data ?? (res as any).Data ?? (Array.isArray(res) ? res : []);
      const normalizedScheds = (Array.isArray(rawScheds) ? rawScheds : []).map((s: any) => ({
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
      setSchedules([]);
      showError(getApiErrorMessage(error, t('employeesShiftWorkspace.errorLoadSchedules')));
    } finally {
      setSchedulesLoading(false);
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
      if (firstDeptId) setSelectedDeptId(firstDeptId);
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

  const handlePrefillTemplate = (templateId: string) => {
    setPrefillTemplateId(templateId);
    if (!templateId) return;
    const target = templates.find(tpl => tpl.shiftTemplateId === templateId);
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
        date: `${newSchedDate}T00:00:00`,
        shifts: [
          {
            shiftName: newSchedName,
            startTime: `${newSchedStart}:00`,
            endTime: `${newSchedEnd}:00`,
            maxStaff: newSchedMaxStaff,
            roleId: newSchedRoleId,
            shiftType: newSchedShiftType,
          },
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

  const isScheduleOnlyView = mode === 'shift-management' && (lockToDefaultTab ? defaultTab === 'scheduling' : activeTab === 'scheduling');

  return (
    <div className="animate-in" style={{ display: 'grid', gap: 20 }}>
      {/* Workspace Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
          padding: isScheduleOnlyView ? '18px 20px' : 0,
          borderRadius: isScheduleOnlyView ? 16 : 0,
          border: isScheduleOnlyView ? '1px solid var(--border-color)' : 'none',
          background: isScheduleOnlyView
            ? 'linear-gradient(135deg, rgba(255,138,0,0.08), rgba(255,255,255,0.02))'
            : 'transparent',
        }}
      >
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          {isScheduleOnlyView && (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                display: 'grid',
                placeItems: 'center',
                background: 'rgba(255,138,0,0.16)',
                border: '1px solid rgba(255,138,0,0.28)',
                color: 'var(--accent)',
                flexShrink: 0,
              }}
            >
              <Calendar size={22} />
            </div>
          )}
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
              {mode === 'staff-only'
                ? t('employeesShiftWorkspace.titleStaffOnly')
                : isScheduleOnlyView
                  ? t('employeesShiftWorkspace.tabCreateSchedule', 'Lập lịch ca làm')
                  : t('employeesShiftWorkspace.titleShiftManagement')}
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)', maxWidth: 560, lineHeight: 1.5 }}>
              {mode === 'staff-only'
                ? t('employeesShiftWorkspace.subtitleStaffOnly')
                : isScheduleOnlyView
                  ? t(
                      'employeesShiftWorkspace.schedulePageSubtitle',
                      'Tạo ca theo phòng ban, xem tuần làm việc và theo dõi sức chứa đăng ký theo ngày.',
                    )
                  : t('employeesShiftWorkspace.subtitleShiftManagement')}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {mode === 'shift-management' && !lockToDefaultTab && (
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
          <button
            className="btn btn-secondary"
            onClick={() => {
              loadData();
              if (activeTab === 'scheduling') loadSchedules();
            }}
            disabled={loading}
          >
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
            {t('employeesShiftWorkspace.refresh')}
          </button>
        </div>
      </div>

      {/* RENDER: QUẢN LÝ NHÂN VIÊN */}
      {(mode === 'staff-only' || activeTab === 'management') && (
        <>
          <ShiftSummaryCards
            activeStaffCount={activeStaff.length}
            totalStaffCount={staff.length}
            faceReadyCount={faceReadyCount}
            pendingRegistrationsCount={pendingRegistrations.length}
            pendingPayrollsCount={pendingPayrolls.length}
          />

          {mode === 'shift-management' && (
            <section className="employee-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 0.65fr)', gap: 16 }}>
              <ShiftRegistrationsSection
                registrations={registrations}
                groupedRegistrations={groupedRegistrations}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                loading={loading}
                actionLoading={actionLoading}
                onAction={runRegistrationAction}
              />

              <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
                <ShiftDirectAssignmentSection
                  staff={staff}
                  templates={templates}
                  assignStaffId={assignStaffId}
                  setAssignStaffId={setAssignStaffId}
                  assignTemplateId={assignTemplateId}
                  setAssignTemplateId={setAssignTemplateId}
                  assignDate={assignDate}
                  setAssignDate={setAssignDate}
                  actionLoading={actionLoading}
                  onAssignShift={handleAssignShift}
                />

                <PayrollSection
                  staff={staff}
                  payrolls={payrolls}
                  payrollStaffId={payrollStaffId}
                  setPayrollStaffId={setPayrollStaffId}
                  payrollUpToDate={payrollUpToDate}
                  setPayrollUpToDate={setPayrollUpToDate}
                  actionLoading={actionLoading}
                  onCalculatePayroll={handleCalculatePayroll}
                  onPayPayroll={handlePayPayroll}
                />
              </div>
            </section>
          )}

          {mode === 'staff-only' && (
            <StaffDirectorySection
              staff={staff}
              departments={departments}
              payrolls={payrolls}
              pendingPayrolls={pendingPayrolls}
              actionLoading={actionLoading}
              onToggleStaffStatus={handleToggleStaffStatus}
              onPayPayroll={handlePayPayroll}
            />
          )}
        </>
      )}

      {/* RENDER TAB 2: LẬP LỊCH LÀM VIỆC */}
      {mode === 'shift-management' && activeTab === 'scheduling' && (
        <ShiftSchedulingSection
          departments={departments}
          selectedDeptId={selectedDeptId}
          setSelectedDeptId={setSelectedDeptId}
          scheduleStartDate={scheduleStartDate}
          setScheduleStartDate={setScheduleStartDate}
          scheduleEndDate={scheduleEndDate}
          setScheduleEndDate={setScheduleEndDate}
          loadSchedules={loadSchedules}
          shiftStats={shiftStats}
          shiftWeekDays={shiftWeekDays}
          focusedDay={focusedDay}
          setFocusedDay={setFocusedDay}
          shiftRangeByDays={shiftRangeByDays}
          visibleSchedules={visibleSchedules}
          groupedSchedules={groupedSchedules}
          schedulesLoading={schedulesLoading}
          loading={loading}
          actionLoading={actionLoading}
          handleDeleteSchedule={handleDeleteSchedule}
          newSchedDate={newSchedDate}
          setNewSchedDate={setNewSchedDate}
          prefillTemplateId={prefillTemplateId}
          handlePrefillTemplate={handlePrefillTemplate}
          templates={templates}
          newSchedShiftType={newSchedShiftType}
          setNewSchedShiftType={setNewSchedShiftType}
          newSchedName={newSchedName}
          setNewSchedName={setNewSchedName}
          newSchedStart={newSchedStart}
          setNewSchedStart={setNewSchedStart}
          newSchedEnd={newSchedEnd}
          setNewSchedEnd={setNewSchedEnd}
          newSchedMaxStaff={newSchedMaxStaff}
          setNewSchedMaxStaff={setNewSchedMaxStaff}
          newSchedRoleId={newSchedRoleId}
          setNewSchedRoleId={setNewSchedRoleId}
          uniqueRoles={uniqueRoles}
          repeatWeekly={repeatWeekly}
          setRepeatWeekly={setRepeatWeekly}
          repeatWeeksCount={repeatWeeksCount}
          setRepeatWeeksCount={setRepeatWeeksCount}
          repeatWeekChoices={repeatWeekChoices}
          handleCreateSchedule={handleCreateSchedule}
        />
      )}

      {/* Face Scan Modal */}
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

export default EmployeesShiftWorkspace;
