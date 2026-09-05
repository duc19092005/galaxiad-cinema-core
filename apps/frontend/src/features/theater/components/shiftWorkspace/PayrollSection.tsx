import React from 'react';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, Banknote, CircleDollarSign, Loader2 } from 'lucide-react';
import type { PayrollDto, StaffProfileDto } from '../../../../types/shift.types';
import {
  ActionButton,
  EmptyState,
  Field,
  Panel,
  formatDate,
  formatMoney,
  statusBadgeClass,
} from './shiftWorkspaceHelpers';

export const PayrollSection: React.FC<{
  staff: StaffProfileDto[];
  payrolls: PayrollDto[];
  payrollStaffId: string;
  setPayrollStaffId: (id: string) => void;
  payrollUpToDate: string;
  setPayrollUpToDate: (date: string) => void;
  actionLoading: string | null;
  onCalculatePayroll: () => void;
  onPayPayroll: (payroll: PayrollDto) => void;
}> = ({
  staff,
  payrolls,
  payrollStaffId,
  setPayrollStaffId,
  payrollUpToDate,
  setPayrollUpToDate,
  actionLoading,
  onCalculatePayroll,
  onPayPayroll,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Panel title={t('employeesShiftWorkspace.payroll')} icon={<CircleDollarSign size={18} />}>
        <Field label={t('employeesShiftWorkspace.staff')}>
          <select className="input select" value={payrollStaffId} onChange={(event) => setPayrollStaffId(event.target.value)}>
            {staff.map((item) => (
              <option key={item.userId} value={item.userId}>{item.userName}</option>
            ))}
          </select>
        </Field>
        <Field label={t('employeesShiftWorkspace.calculateUpTo')}>
          <input className="input" type="date" value={payrollUpToDate} onChange={(event) => setPayrollUpToDate(event.target.value)} />
        </Field>
        <button
          className="btn btn-primary"
          onClick={onCalculatePayroll}
          disabled={actionLoading === 'calculate-payroll' || staff.length === 0}
        >
          {actionLoading === 'calculate-payroll' ? (
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Banknote size={16} />
          )}
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
      </Panel>
    </>
  );
};
