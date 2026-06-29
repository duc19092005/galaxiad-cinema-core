import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle, Building2, CalendarDays, Check, CheckCircle2,
  Clock4, Loader2, MapPin, Phone, Search, Shield, User, X, Camera,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { facilitiesApi } from '../api/facilitiesApi';
import { staffShiftApi } from '../api/staffShiftApi';
import { detectFaceDescriptor } from '../utils/faceApiUtils';
import { showError, showSuccess } from '../utils/ToastUtils';
import type { AdminUserDto, RoleDto } from '../types/admin.types';
import type { Cinema, Department } from '../types/facilities.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getApiError = (err: unknown, fallback: string) => {
  if (typeof err !== 'object' || err === null) return fallback;
  const r = (err as { response?: { data?: { message?: string; Message?: string } } }).response;
  return r?.data?.message ?? r?.data?.Message ?? fallback;
};

const isAccountActive = (status: number | string) =>
  Number(status) === 1 || status === 'Active';

type Tab = 'info' | 'roles' | 'cinema';

// ─── Props ────────────────────────────────────────────────────────────────────

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserDto;
  onSuccess: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({ isOpen, onClose, user, onSuccess }) => {
  const [tab, setTab] = useState<Tab>('info');

  // ── Basic info state
  const [userName, setUserName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  // ── Role state
  const [allRoles, setAllRoles] = useState<RoleDto[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [initialRoleIds, setInitialRoleIds] = useState<string[]>([]);
  const [employeeType, setEmployeeType] = useState<number>(1);
  const [initialEmployeeType, setInitialEmployeeType] = useState<number>(1);
  const [rolesLoading, setRolesLoading] = useState(false);

  // ── Cinema & Department state
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState('');
  const [cinemaSearch, setCinemaSearch] = useState('');
  const [cinemasLoading, setCinemasLoading] = useState(false);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  // ── Status
  const [accountActive, setAccountActive] = useState(true);
  const [statusChanging, setStatusChanging] = useState(false);

  // ── Submission
  const [saving, setSaving] = useState(false);

  // ── Portrait & Face Vector
  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null);
  const [faceVector, setFaceVector] = useState<number[] | null>(null);
  const [portraitLoading, setPortraitLoading] = useState(false);

  const initialized = useRef(false);

  // ── Init on open ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) { initialized.current = false; return; }
    if (initialized.current) return;
    initialized.current = true;

    // Basic info
    setUserName(user.userName ?? '');
    setPhoneNumber(user.phoneNumber ?? '');
    setDateOfBirth(user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '');
    setAccountActive(isAccountActive(user.accountStatus));
    setTab('info');

    // Reset portrait edit states
    setPortraitFile(null);
    setPortraitPreview(null);
    setFaceVector(null);
    setPortraitLoading(false);

    // Employee type
    const et = user.employeeType ?? 1;
    setEmployeeType(et);
    setInitialEmployeeType(et);

    // Set initial Cinema & Department
    setSelectedCinemaId(user.cinemaId ?? '');
    setSelectedDepartmentId(user.departmentId ?? '');
    setCinemaSearch('');

    // Load roles
    (async () => {
      setRolesLoading(true);
      try {
        const [rolesRes, userRolesRes] = await Promise.all([
          adminApi.getRoles(),
          adminApi.getUserRoles(user.userId),
        ]);
        const roles = rolesRes.data ?? [];
        setAllRoles(roles);
        const userCurrentRoles = userRolesRes.data ?? [];
        const ids = userCurrentRoles
          .map((r: unknown) => {
            if (typeof r === 'string') return roles.find(x => x.roleName === r)?.roleId;
            const rr = r as RoleDto;
            return rr.roleId;
          })
          .filter(Boolean) as string[];
        setSelectedRoleIds(ids);
        setInitialRoleIds(ids);
      } catch { /* keep defaults */ } finally {
        setRolesLoading(false);
      }
    })();

    // Load cinemas
    (async () => {
      setCinemasLoading(true);
      try {
        const res = await facilitiesApi.getCinemaList();
        setCinemas(res.data ?? []);
      } catch { /* ignore */ } finally {
        setCinemasLoading(false);
      }
    })();
  }, [isOpen, user]);

  // ── Load departments when selected cinema changes ────────────────────────

  useEffect(() => {
    if (!selectedCinemaId) {
      setDepartments([]);
      setSelectedDepartmentId('');
      return;
    }

    (async () => {
      setDepartmentsLoading(true);
      try {
        const res = await facilitiesApi.getDepartments(selectedCinemaId);
        const list = res.data ?? [];
        setDepartments(list);
        
        // If the loaded cinema matches the user's initial cinema, restore initial department,
        // otherwise reset selected department to empty.
        if (selectedCinemaId === user.cinemaId) {
          setSelectedDepartmentId(user.departmentId ?? '');
        } else {
          setSelectedDepartmentId('');
        }
      } catch {
        setDepartments([]);
        setSelectedDepartmentId('');
      } finally {
        setDepartmentsLoading(false);
      }
    })();
  }, [selectedCinemaId, user.cinemaId, user.departmentId]);

  // ── Computed ─────────────────────────────────────────────────────────────

  const isCashierSelected = allRoles.some(r => selectedRoleIds.includes(r.roleId) && r.roleName === 'Cashier');
  const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every(id => b.includes(id));
  const rolesChanged = !sameSet(selectedRoleIds, initialRoleIds);
  const etChanged = isCashierSelected && employeeType !== initialEmployeeType;
  const cinemaChanged = selectedCinemaId !== (user.cinemaId ?? '');
  const departmentChanged = selectedDepartmentId !== (user.departmentId ?? '');
  const infoChanged = userName !== (user.userName ?? '') || phoneNumber !== (user.phoneNumber ?? '') || dateOfBirth !== (user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '');
  const portraitChanged = !!portraitFile;
  const hasAnyChange = infoChanged || rolesChanged || etChanged || cinemaChanged || departmentChanged || portraitChanged;

  const filteredCinemas = cinemas.filter(c =>
    c.cinemaName.toLowerCase().includes(cinemaSearch.toLowerCase()) ||
    c.cinemaLocation.toLowerCase().includes(cinemaSearch.toLowerCase()),
  );

  // ── Handlers ─────────────────────────────────────────────────────────────

  const toggleRole = (role: RoleDto) => {
    const stored = JSON.parse(localStorage.getItem('user_info') || '{}');
    if (stored.userId === user.userId && role.roleName === 'Admin' && selectedRoleIds.includes(role.roleId)) {
      showError('Không thể tự xóa quyền Admin của chính mình.'); return;
    }
    setSelectedRoleIds(prev =>
      prev.includes(role.roleId) ? prev.filter(id => id !== role.roleId) : [...prev, role.roleId],
    );
  };

  const handlePortraitChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPortraitFile(file);
    setPortraitPreview(URL.createObjectURL(file));
    setPortraitLoading(true);

    try {
      showSuccess('Đang quét khuôn mặt trong ảnh...');
      const descriptor = await detectFaceDescriptor(file);
      if (!descriptor) {
        showError('Không tìm thấy khuôn mặt trong ảnh. Hãy sử dụng ảnh chân dung rõ nét, nhìn thẳng.');
        setPortraitFile(null);
        setPortraitPreview(null);
        setFaceVector(null);
      } else {
        setFaceVector(Array.from(descriptor));
        showSuccess('Quét và trích xuất khuôn mặt thành công!');
      }
    } catch (err) {
      showError('Lỗi trích xuất khuôn mặt. Vui lòng thử lại.');
      setPortraitFile(null);
      setPortraitPreview(null);
      setFaceVector(null);
    } finally {
      setPortraitLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    setStatusChanging(true);
    try {
      await adminApi.updateUserStatus(user.userId, accountActive ? 2 : 1);
      setAccountActive(prev => !prev);
      showSuccess(accountActive ? 'Đã khóa tài khoản.' : 'Đã kích hoạt tài khoản.');
    } catch (err) {
      showError(getApiError(err, 'Không thể cập nhật trạng thái.'));
    } finally {
      setStatusChanging(false);
    }
  };

  const handleSave = async () => {
    if (!hasAnyChange) { onClose(); return; }
    setSaving(true);
    let anySuccess = false;
    const errors: string[] = [];

    try {
      // 1. Basic profile update
      if (infoChanged) {
        try {
          await adminApi.updateUserProfile(user.userId, {
            userName: userName.trim() || undefined,
            phoneNumber: phoneNumber.trim() || undefined,
            dateOfBirth: dateOfBirth || undefined,
          });
          anySuccess = true;
        } catch (err) {
          errors.push(`Thông tin cơ bản: ${getApiError(err, 'Lỗi không xác định')}`);
        }
      }

      // 2. Roles, employee type, cinema, and department (unified API request)
      if (rolesChanged || etChanged || cinemaChanged || departmentChanged) {
        try {
          await adminApi.updateUserRole(
            user.userId,
            selectedRoleIds,
            isCashierSelected ? employeeType : undefined,
            selectedCinemaId || null,
            selectedDepartmentId || null
          );
          setInitialRoleIds(selectedRoleIds);
          setInitialEmployeeType(employeeType);
          anySuccess = true;

          // If current user modified their own roles, log out
          const stored = JSON.parse(localStorage.getItem('user_info') || '{}');
          if (stored.userId === user.userId) {
            showSuccess('Quyền thay đổi. Đang đăng xuất...', { duration: 2000 });
            setTimeout(() => {
              localStorage.removeItem('user_info');
              document.cookie = 'X-Access-Token=; Max-Age=0; path=/;';
              window.location.href = '/login';
            }, 1500);
            return;
          }
        } catch (err) {
          errors.push(`Phân quyền & Rạp: ${getApiError(err, 'Lỗi không xác định')}`);
        }
      }

      // 3. Cinema assignment for managers (updating TheaterManager / FacilitiesManager links on the Cinema object itself)
      if (cinemaChanged && selectedCinemaId) {
        const hasManagerRole = currentRoleList.some(r => r.roleName === 'TheaterManager' || r.roleName === 'FacilitiesManager');
        if (hasManagerRole) {
          try {
            await adminApi.assignTheaterManager(selectedCinemaId, user.userId);
            anySuccess = true;
          } catch (err) {
            errors.push(`Gán quản lý rạp: ${getApiError(err, 'Lỗi không xác định')}`);
          }
        }
      }

      // 4. Update portrait and face vector if changed
      if (portraitFile && faceVector) {
        try {
          await adminApi.updateUserPortrait(user.userId, portraitFile);
          await staffShiftApi.registerFace(user.userId, { faceVector });
          anySuccess = true;
        } catch (err) {
          errors.push(`Cập nhật ảnh & khuôn mặt: ${getApiError(err, 'Lỗi không xác định')}`);
        }
      }
    } finally {
      setSaving(false);
    }

    if (errors.length > 0) errors.forEach(e => showError(e));
    if (anySuccess) {
      showSuccess('Cập nhật nhân viên thành công!');
      onSuccess();
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentRoleList = allRoles.filter(r => selectedRoleIds.includes(r.roleId));
  const availableRoleList = allRoles.filter(r => !selectedRoleIds.includes(r.roleId));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 660, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
      >
        {/* ── Header ── */}
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Chỉnh sửa nhân viên</h2>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>{user.userEmail}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Status toggle */}
            <button
              onClick={handleStatusToggle}
              disabled={statusChanging}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 'var(--radius-md)',
                border: `1px solid ${accountActive ? 'rgba(239,68,68,0.35)' : 'rgba(34,197,94,0.35)'}`,
                background: accountActive ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)',
                color: accountActive ? 'var(--danger)' : 'var(--success)',
                cursor: 'pointer', fontSize: 12, fontWeight: 700,
              }}
            >
              {statusChanging ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              {accountActive ? 'Khóa TK' : 'Kích hoạt'}
            </button>
            <button className="btn-icon" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 24px', flexShrink: 0 }}>
          {([
            { key: 'info', label: 'Thông tin', icon: <User size={14} /> },
            { key: 'roles', label: 'Phân quyền', icon: <Shield size={14} /> },
            { key: 'cinema', label: 'Nơi làm việc', icon: <Building2 size={14} /> },
          ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(({ key, label, icon }) => {
            const active = tab === key;
            const hasBadge =
              (key === 'roles' && (rolesChanged || etChanged)) ||
              (key === 'cinema' && (cinemaChanged || departmentChanged)) ||
              (key === 'info' && infoChanged);
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '12px 16px', border: 0, background: 'transparent',
                  borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: active ? 800 : 600, fontSize: 13, cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {icon} {label}
                {hasBadge && (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', position: 'absolute', top: 8, right: 4 }} />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Body ── */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

          {/* ── Tab: Info ── */}
          {tab === 'info' && (
            <div style={{ display: 'grid', gap: 20 }}>
              {/* Avatar Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{
                  position: 'relative',
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid var(--border-color)',
                  background: 'var(--bg-surface)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}>
                  {portraitPreview || user.portraitImageUrl ? (
                    <img
                      src={(portraitPreview || user.portraitImageUrl) ?? undefined}
                      alt="Portrait"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <User size={36} />
                    </div>
                  )}
                  {portraitLoading && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.65)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Loader2 size={24} style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />
                    </div>
                  )}
                </div>
                <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 12px' }}>
                  <Camera size={14} />
                  Thay ảnh chân dung (Quét khuôn mặt)
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePortraitChange}
                    style={{ display: 'none' }}
                    disabled={portraitLoading}
                  />
                </label>
              </div>

              {/* Email (read-only) */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Email (không thể chỉnh)
                </label>
                <div className="input" style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.6, cursor: 'not-allowed' }}>
                  <User size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ fontSize: 13 }}>{user.userEmail}</span>
                </div>
              </div>

              {/* Full name */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Họ và tên
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="input"
                    style={{ paddingLeft: 36 }}
                    placeholder="Nhập họ và tên"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Số điện thoại
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="input"
                    style={{ paddingLeft: 36 }}
                    placeholder="10 chữ số"
                    maxLength={10}
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              {/* Date of birth */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Ngày sinh
                </label>
                <div style={{ position: 'relative' }}>
                  <CalendarDays size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    className="input"
                    style={{ paddingLeft: 36 }}
                    type="date"
                    value={dateOfBirth}
                    onChange={e => setDateOfBirth(e.target.value)}
                  />
                </div>
              </div>

              {/* Current cinema summary */}
              {user.cinemaName && (
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(255,138,0,0.06)', border: '1px solid rgba(255,138,0,0.2)', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <MapPin size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Rạp hiện tại: <strong style={{ color: 'var(--text-primary)' }}>{user.cinemaName}</strong> {user.departmentName && <span> - Phòng ban: <strong style={{ color: 'var(--text-primary)' }}>{user.departmentName}</strong></span>}</span>
                </div>
              )}

              {/* Warning about what can't be changed */}
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <AlertCircle size={14} style={{ color: '#0ea5e9', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Username và mật khẩu không thể thay đổi từ trang quản trị. Nhân viên tự thay đổi qua trang hồ sơ cá nhân.
                </span>
              </div>
            </div>
          )}

          {/* ── Tab: Roles ── */}
          {tab === 'roles' && (
            <div style={{ display: 'grid', gap: 22 }}>
              {rolesLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12, color: 'var(--text-muted)' }}>
                  <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
                  Đang tải quyền...
                </div>
              ) : (
                <>
                  {/* Current roles */}
                  <div>
                    <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Quyền hiện tại</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {currentRoleList.length === 0 ? (
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa có quyền nào.</span>
                      ) : currentRoleList.map(role => {
                        const isSelf = JSON.parse(localStorage.getItem('user_info') || '{}').userId === user.userId;
                        const isProtected = isSelf && role.roleName === 'Admin';
                        return (
                          <span
                            key={role.roleId}
                            className="badge badge-accent"
                            style={{ gap: 6, padding: '7px 10px 7px 14px', fontSize: 13, borderRadius: 'var(--radius-md)' }}
                          >
                            {role.roleName}
                            {isProtected
                              ? <Shield size={11} />
                              : (
                                <button
                                  onClick={() => toggleRole(role)}
                                  style={{ all: 'unset', cursor: 'pointer', display: 'flex', borderRadius: '50%', padding: 2, background: 'rgba(0,0,0,0.15)' }}
                                >
                                  <X size={10} />
                                </button>
                              )}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add roles */}
                  {availableRoleList.length > 0 && (
                    <div>
                      <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Thêm quyền</p>
                      <div style={{ display: 'grid', gap: 8 }}>
                        {availableRoleList.map(role => (
                          <button
                            key={role.roleId}
                            onClick={() => toggleRole(role)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '12px 16px', border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.025)',
                              cursor: 'pointer', width: '100%',
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                          >
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{role.roleName}</span>
                            <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border-color)' }} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Employee type for cashier */}
                  {isCashierSelected && (
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 18 }}>
                      <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        Loại hình nhân viên (Cashier)
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {([
                          { value: 1, label: 'Full-time', icon: <CalendarDays size={14} />, desc: 'Ca 8h, đăng ký linh hoạt hơn', color: '#10b981' },
                          { value: 2, label: 'Part-time', icon: <Clock4 size={14} />, desc: 'Chỉ đăng ký ca ≤ 4h', color: '#0ea5e9' },
                        ] as const).map(opt => {
                          const sel = employeeType === opt.value;
                          return (
                            <div
                              key={opt.value}
                              onClick={() => setEmployeeType(opt.value)}
                              style={{
                                padding: '12px 14px', borderRadius: 'var(--radius-md)',
                                border: `1.5px solid ${sel ? opt.color : 'rgba(255,255,255,0.1)'}`,
                                background: sel ? `${opt.color}15` : 'rgba(255,255,255,0.025)',
                                cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6,
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: sel ? opt.color : 'var(--text-primary)', fontWeight: 800, fontSize: 13 }}>
                                <span style={{ color: opt.color }}>{opt.icon}</span>
                                {opt.label}
                                {sel && <CheckCircle2 size={13} style={{ marginLeft: 'auto', color: opt.color }} />}
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{opt.desc}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Tab: Cinema ── */}
          {tab === 'cinema' && (
            <div style={{ display: 'grid', gap: 20 }}>
              {/* Cinema Selector */}
              <div>
                <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Rạp làm việc</p>
                
                {/* Search */}
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="input"
                    style={{ paddingLeft: 36 }}
                    placeholder="Tìm tên rạp hoặc địa chỉ..."
                    value={cinemaSearch}
                    onChange={e => setCinemaSearch(e.target.value)}
                  />
                </div>

                {/* Cinema list */}
                <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 8, background: 'rgba(0,0,0,0.1)' }}>
                  {cinemasLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30, gap: 12 }}>
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Đang tải danh sách rạp...</span>
                    </div>
                  ) : filteredCinemas.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>Không tìm thấy rạp.</div>
                  ) : filteredCinemas.map(cinema => {
                    const isSelected = selectedCinemaId === cinema.cinemaId;
                    return (
                      <button
                        key={cinema.cinemaId}
                        onClick={() => setSelectedCinemaId(cinema.cinemaId)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                          padding: '10px 14px', width: '100%', textAlign: 'left', cursor: 'pointer',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? '1.5px solid var(--accent)' : '1px solid var(--border-color)',
                          background: isSelected ? 'var(--accent-soft)' : 'rgba(255,255,255,0.02)',
                          transition: 'all 0.12s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>
                            {cinema.cinemaName}
                          </span>
                          {isSelected && <Check size={14} style={{ color: 'var(--accent)' }} />}
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                          {cinema.cinemaLocation}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Department Selector */}
              {selectedCinemaId && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                  <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Phòng ban gán làm việc</p>
                  
                  {departmentsLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12 }}>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Đang tải danh sách phòng ban...</span>
                    </div>
                  ) : departments.length === 0 ? (
                    <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-color)', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                      Rạp này chưa cấu hình phòng ban nào.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {/* No department option */}
                      <button
                        onClick={() => setSelectedDepartmentId('')}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 14px', borderRadius: 'var(--radius-md)',
                          border: !selectedDepartmentId ? '1.5px solid var(--accent)' : '1px solid var(--border-color)',
                          background: !selectedDepartmentId ? 'var(--accent-soft)' : 'rgba(255,255,255,0.02)',
                          cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: !selectedDepartmentId ? 'var(--accent)' : 'var(--text-primary)' }}>Không gán phòng ban</p>
                          <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--text-muted)' }}>Chỉ gán rạp chung</p>
                        </div>
                        {!selectedDepartmentId && <Check size={14} style={{ color: 'var(--accent)' }} />}
                      </button>

                      {departments.map(dept => {
                        const isSelected = selectedDepartmentId === dept.departmentId;
                        return (
                          <button
                            key={dept.departmentId}
                            onClick={() => setSelectedDepartmentId(dept.departmentId)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '12px 14px', borderRadius: 'var(--radius-md)',
                              border: isSelected ? '1.5px solid var(--accent)' : '1px solid var(--border-color)',
                              background: isSelected ? 'var(--accent-soft)' : 'rgba(255,255,255,0.02)',
                              cursor: 'pointer', textAlign: 'left',
                            }}
                          >
                            <div>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>{dept.departmentName}</p>
                              <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--text-muted)' }}>Phòng ban thuộc rạp</p>
                            </div>
                            {isSelected && <Check size={14} style={{ color: 'var(--accent)' }} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="modal-footer" style={{ flexShrink: 0 }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Hủy
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !hasAnyChange}
            style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}
          >
            {saving
              ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Đang lưu...</>
              : <><Check size={15} /> {hasAnyChange ? 'Lưu thay đổi' : 'Không có thay đổi'}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEmployeeModal;
