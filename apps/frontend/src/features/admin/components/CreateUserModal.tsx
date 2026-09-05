import React from 'react';
import { Camera, Loader2, UserPlus, X } from 'lucide-react';
import type { RoleDto } from '../../../types/admin.types';
import type { Cinema, Department } from '../../../types/facilities.types';

export interface CreateUserFormData {
  userName: string;
  userEmail: string;
  fullName: string;
  identityCode: string;
  phoneNumber: string;
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
  roleIds: string[];
  cinemaId: string;
  departmentId: string;
  employeeType: 1 | 2;
}

export interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: CreateUserFormData;
  setFormData: React.Dispatch<React.SetStateAction<CreateUserFormData>>;
  portraitPreview: string | null;
  onPortraitChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  staffRoles: RoleDto[];
  rolesLoading: boolean;
  cinemas: Cinema[];
  cinemasLoading: boolean;
  departments: Department[];
  departmentsLoading: boolean;
  isSubmitting: boolean;
  toggleRole: (roleId: string) => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  portraitPreview,
  onPortraitChange,
  staffRoles,
  rolesLoading,
  cinemas,
  cinemasLoading,
  departments,
  departmentsLoading,
  isSubmitting,
  toggleRole,
}) => {
  if (!isOpen) return null;

  const hasCreateStaffRole = formData.roleIds.length > 0;
  const hasCreateCashierRole = staffRoles.some(
    r => r.roleName === 'Cashier' && formData.roleIds.includes(r.roleId)
  );

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: 680,
          backgroundColor: 'var(--bg-elevated, #18181b)',
          border: '1px solid var(--border-color, #27272a)',
          borderRadius: 20, boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color, #27272a)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserPlus size={20} style={{ color: 'var(--accent)' }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Create New Account</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '78vh', overflowY: 'auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '96px 1fr',
            gap: 16,
            alignItems: 'center',
            padding: 14,
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(255,255,255,0.025)',
          }}>
            <label htmlFor="create-user-portrait" style={{
              width: 96,
              height: 96,
              borderRadius: 'var(--radius-md)',
              border: '1px dashed rgba(255, 138, 0, 0.45)',
              background: 'var(--bg-surface)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}>
              {portraitPreview ? (
                <img src={portraitPreview} alt="Portrait preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Camera size={24} style={{ color: 'var(--accent)' }} />
              )}
            </label>
            <div style={{ display: 'grid', gap: 8 }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>Employee portrait</p>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Optional square portrait for staff identity checks. JPG, PNG, or WebP under 5MB.
                </p>
              </div>
              <input
                id="create-user-portrait"
                type="file"
                accept="image/*"
                onChange={onPortraitChange}
                style={{ fontSize: 12, color: 'var(--text-secondary)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Username *</label>
            <input
              type="text" required
              placeholder="e.g. john_doe"
              value={formData.userName}
              onChange={e => setFormData({ ...formData, userName: e.target.value })}
              className="input"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Email *</label>
            <input
              type="email" required
              placeholder="user@example.com"
              value={formData.userEmail}
              onChange={e => setFormData({ ...formData, userEmail: e.target.value })}
              className="input"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Full Name</label>
            <input
              type="text"
              placeholder="John Doe (optional)"
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              className="input"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Identity Code *</label>
              <input
                type="text" required
                inputMode="numeric"
                maxLength={12}
                placeholder="12 digit ID"
                value={formData.identityCode}
                onChange={e => setFormData({ ...formData, identityCode: e.target.value.replace(/\D/g, '') })}
                className="input"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Phone Number *</label>
              <input
                type="text" required
                inputMode="numeric"
                maxLength={10}
                placeholder="10 digits"
                value={formData.phoneNumber}
                onChange={e => setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, '') })}
                className="input"
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Date of Birth *</label>
            <input
              type="date" required
              value={formData.dateOfBirth}
              onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="input"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Password *</label>
              <input
                type="password" required
                placeholder="Min 8 chars"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="input"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Confirm Password *</label>
              <input
                type="password" required
                placeholder="Repeat password"
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <section style={{
            display: 'grid',
            gap: 12,
            padding: 14,
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(255,255,255,0.035)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 850, color: 'var(--text-primary)' }}>Staff roles</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Optional. Leave empty to create an account without staff access.
                </p>
              </div>
              {rolesLoading && <Loader2 size={18} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite', flexShrink: 0 }} />}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {staffRoles.map((role) => {
                const checked = formData.roleIds.includes(role.roleId);
                return (
                  <div
                    key={role.roleId}
                    onClick={() => toggleRole(role.roleId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      minHeight: 44,
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${checked ? 'rgba(255, 138, 0, 0.48)' : 'rgba(255,255,255,0.1)'}`,
                      background: checked ? 'rgba(255, 138, 0, 0.12)' : 'rgba(255,255,255,0.025)',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      readOnly
                      style={{ width: 16, height: 16, accentColor: '#ff8a00' }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 750, color: checked ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {role.roleName}
                    </span>
                  </div>
                );
              })}
              {!rolesLoading && staffRoles.length === 0 && (
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                  No assignable staff roles found.
                </p>
              )}
            </div>
          </section>

          {hasCreateStaffRole && (
            <section style={{
              display: 'grid',
              gap: 12,
              padding: 14,
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(255,255,255,0.035)',
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 850, color: 'var(--text-primary)' }}>Staff assignment</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Choose the cinema branch and cashier department this employee belongs to.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: hasCreateCashierRole ? '1fr 1fr' : '1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Cinema *</span>
                  <select
                    className="input select"
                    value={formData.cinemaId}
                    disabled={cinemasLoading}
                    onChange={(event) => setFormData({ ...formData, cinemaId: event.target.value, departmentId: '' })}
                    required={hasCreateStaffRole}
                  >
                    <option value="">{cinemasLoading ? 'Loading cinemas...' : 'Select cinema'}</option>
                    {cinemas.map((cinema) => (
                      <option key={cinema.cinemaId} value={cinema.cinemaId}>{cinema.cinemaName}</option>
                    ))}
                  </select>
                </label>

                {hasCreateCashierRole && (
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Cashier department *</span>
                    <select
                      className="input select"
                      value={formData.departmentId}
                      disabled={!formData.cinemaId || departmentsLoading}
                      onChange={(event) => setFormData({ ...formData, departmentId: event.target.value })}
                      required={hasCreateCashierRole}
                    >
                      <option value="">
                        {!formData.cinemaId
                          ? 'Select cinema first'
                          : departmentsLoading
                            ? 'Loading departments...'
                            : 'Select department'}
                      </option>
                      {departments.map((department) => (
                        <option key={department.departmentId} value={department.departmentId}>
                          {department.departmentName} - {department.cashierType}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              {hasCreateCashierRole && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Loại nhân viên *</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {([{ value: 1, label: 'Full-time', desc: 'Ca 8h, lý do bắt buộc nếu đăng ký ca ngắn' }, { value: 2, label: 'Part-time', desc: 'Chỉ đăng ký được ca ≤ 4h' }] as const).map((opt) => {
                      const selected = formData.employeeType === opt.value;
                      return (
                        <div
                          key={opt.value}
                          onClick={() => setFormData({ ...formData, employeeType: opt.value })}
                          style={{
                            padding: '12px 14px',
                            borderRadius: 'var(--radius-md)',
                            border: `1.5px solid ${selected ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
                            background: selected ? 'rgba(255, 138, 0, 0.1)' : 'rgba(255,255,255,0.025)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            transition: 'all 0.15s ease',
                            userSelect: 'none',
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 800, color: selected ? 'var(--accent)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ width: 12, height: 12, borderRadius: '50%', border: `2px solid ${selected ? 'var(--accent)' : 'rgba(255,255,255,0.3)'}`, background: selected ? 'var(--accent)' : 'transparent', flexShrink: 0, display: 'inline-block' }} />
                            {opt.label}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{opt.desc}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border-color, #27272a)' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              {isSubmitting ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</>
              ) : (
                <><UserPlus size={16} /> Create Account</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
