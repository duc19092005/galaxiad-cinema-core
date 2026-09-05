import React from 'react';
import { useTranslation } from 'react-i18next';
import { Banknote, CalendarDays, CalendarPlus, ClipboardList, TimerReset } from 'lucide-react';
import { Metric, Panel, formatMoney } from './staffShiftHelpers';

export const StaffShiftSummaryCards: React.FC<{
  registrationsCount: number;
  approvedCount: number;
  totalPaid: number;
  totalPending: number;
  workedHours: number;
  availableTodayCount: number;
}> = ({
  registrationsCount,
  approvedCount,
  totalPaid,
  totalPending,
  workedHours,
  availableTodayCount,
}) => {
  const { t } = useTranslation();

  return (
    <Panel title={t('staffShiftSelf.overview')}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Metric icon={<ClipboardList size={17} />} label={t('staffShiftSelf.registeredShifts')} value={`${registrationsCount}`} />
        <Metric icon={<CalendarDays size={17} />} label={t('staffShiftSelf.approvedShifts')} value={`${approvedCount}`} />
        <Metric icon={<Banknote size={17} />} label={t('staffShiftSelf.paidSalary')} value={formatMoney(totalPaid)} />
        <Metric icon={<Banknote size={17} />} label={t('staffShiftSelf.pendingSalary')} value={formatMoney(totalPending)} />
        <Metric icon={<TimerReset size={17} />} label={t('staffShiftSelf.workedHours')} value={`${workedHours.toLocaleString('vi-VN')}h`} />
        <Metric icon={<CalendarPlus size={17} />} label={t('staffShiftSelf.availableToday')} value={`${availableTodayCount}`} />
      </div>
    </Panel>
  );
};
