import React from 'react';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, Banknote, UserCheck, UserRound, Users } from 'lucide-react';
import type { PayrollDto, StaffProfileDto } from '../../../../types/shift.types';
import {
  ActionButton,
  EmptyState,
  StaffPortrait,
  formatDate,
  formatMoney,
  statusBadgeClass,
} from './shiftWorkspaceHelpers';

export const StaffDirectorySection: React.FC<{
  staff: StaffProfileDto[];
  departments: any[];
  payrolls: PayrollDto[];
  pendingPayrolls: PayrollDto[];
  actionLoading: string | null;
  onToggleStaffStatus: (profile: StaffProfileDto) => void;
  onPayPayroll: (payroll: PayrollDto) => void;
}> = ({
  staff,
  departments,
  payrolls,
  pendingPayrolls,
  actionLoading,
  onToggleStaffStatus,
  onPayPayroll,
}) => {
  const { t } = useTranslation();

  return (
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
                        <ActionButton
                          label={profile.workingStatus ? t('employeesShiftWorkspace.deactivate') : t('employeesShiftWorkspace.activate')}
                          tone={profile.workingStatus ? 'danger' : 'success'}
                          icon={<UserCheck size={13} />}
                          loading={actionLoading === `staff-${profile.userId}`}
                          onClick={() => onToggleStaffStatus(profile)}
                        />
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
                  const departmentType = dept.departmentType ?? dept.DepartmentType;
                  const isJanitorial = departmentType === 1 || departmentType === 'Janitorial';
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
                          whiteSpace: 'nowrap',
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
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', minHeight: 26,
                            padding: '4px 9px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                            color: isJanitorial ? '#22c55e' : 'var(--text-muted)',
                            background: isJanitorial ? 'rgba(34,197,94,0.10)' : 'transparent',
                            border: isJanitorial ? '1px solid rgba(34,197,94,0.28)' : 'none',
                            fontStyle: isJanitorial ? 'normal' : 'italic',
                          }}>
                            {isJanitorial
                              ? t('employeesShiftWorkspace.noPOSRequired')
                              : t('employeesShiftWorkspace.notConfigured')}
                          </span>
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
                    <td>
                      <span className={statusBadgeClass(payroll.paymentStatus)}>{payroll.paymentStatus}</span>
                    </td>
                    <td>
                      {payroll.paymentStatus === 'Pending' ? (
                        <ActionButton
                          label={t('employeesShiftWorkspace.pay')}
                          tone="success"
                          icon={<BadgeCheck size={13} />}
                          loading={actionLoading === `pay-${payroll.salaryTotalLoggerId}`}
                          onClick={() => onPayPayroll(payroll)}
                        />
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {payroll.paidByName || t('employeesShiftWorkspace.paid')}
                        </span>
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
  );
};
