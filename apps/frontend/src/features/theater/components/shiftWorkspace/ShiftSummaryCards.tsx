import React from 'react';
import { useTranslation } from 'react-i18next';
import { Banknote, CalendarPlus, ScanFace, Users } from 'lucide-react';
import { SummaryTile } from './shiftWorkspaceHelpers';

export const ShiftSummaryCards: React.FC<{
  activeStaffCount: number;
  totalStaffCount: number;
  faceReadyCount: number;
  pendingRegistrationsCount: number;
  pendingPayrollsCount: number;
}> = ({
  activeStaffCount,
  totalStaffCount,
  faceReadyCount,
  pendingRegistrationsCount,
  pendingPayrollsCount,
}) => {
  const { t } = useTranslation();

  return (
    <div className="employee-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
      <SummaryTile icon={<Users size={18} />} label={t('employeesShiftWorkspace.activeStaff')} value={`${activeStaffCount}/${totalStaffCount}`} />
      <SummaryTile icon={<ScanFace size={18} />} label={t('employeesShiftWorkspace.faceRegistered')} value={`${faceReadyCount}/${totalStaffCount}`} />
      <SummaryTile icon={<CalendarPlus size={18} />} label={t('employeesShiftWorkspace.pendingRegistrations')} value={String(pendingRegistrationsCount)} />
      <SummaryTile icon={<Banknote size={18} />} label={t('employeesShiftWorkspace.pendingPayrolls')} value={String(pendingPayrollsCount)} />
    </div>
  );
};
