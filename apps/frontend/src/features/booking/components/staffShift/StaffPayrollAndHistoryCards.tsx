import React from 'react';
import { useTranslation } from 'react-i18next';
import type { PayrollDto, StaffWorkingLogDto } from '../../../../types/shift.types';
import { EmptyLine, ListPanel, Row, formatDate, formatMoney, statusClass } from './staffShiftHelpers';

export const StaffPayrollAndHistoryCards: React.FC<{
  history: StaffWorkingLogDto[];
  payrolls: PayrollDto[];
}> = ({ history, payrolls }) => {
  const { t } = useTranslation();

  return (
    <>
      <ListPanel title={t('staffShiftSelf.recentWorkLogs')}>
        {history.length === 0 ? (
          <EmptyLine label={t('staffShiftSelf.noWorkLogs')} />
        ) : (
          history.slice(0, 4).map((item) => (
            <div key={item.staffWorkingLoggerId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <Row
                title={formatMoney(item.totalReceived)}
                meta={`${formatDate(item.workingDate)} – ${item.workingHour}h @ ${formatMoney(item.salaryPerHour)}/h`}
                badge={item.endedShiftTime ? 'Closed' : 'Open'}
              />
              {(item.sales?.length ?? 0) > 0 && (
                <div style={{ display: 'grid', gap: 8, padding: '0 14px 12px 14px' }}>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase' }}>
                    {t('staffShiftSelf.ticketSalesHistory')}
                  </p>
                  {item.sales!.map((sale) => (
                    <div
                      key={sale.orderId}
                      style={{
                        padding: 10,
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-elevated)',
                        display: 'grid',
                        gap: 5,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <strong style={{ fontSize: 12, color: 'var(--text-primary)' }}>{sale.movieName}</strong>
                        <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 800 }}>{formatMoney(sale.totalPrice)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)' }}>
                        {sale.bookingCode} · {sale.cinemaName} · {sale.auditoriumNumber} · {t('staffShiftSelf.seats')} {sale.seats.join(', ')}
                      </p>
                      <span className={statusClass(sale.orderStatus)} style={{ width: 'fit-content' }}>
                        {sale.orderStatus}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </ListPanel>

      <ListPanel title={t('staffShiftSelf.payroll')}>
        {payrolls.length === 0 ? (
          <EmptyLine label={t('staffShiftSelf.noPayroll')} />
        ) : (
          payrolls.slice(0, 4).map((item) => (
            <Row
              key={item.salaryTotalLoggerId}
              title={formatMoney(item.totalReceived)}
              meta={`${formatDate(item.receivedDay)} – ${item.paidByName ?? t('staffShiftSelf.pendingPayment')}`}
              badge={item.paymentStatus}
            />
          ))
        )}
      </ListPanel>
    </>
  );
};
