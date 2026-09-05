import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarPlus, Loader2 } from 'lucide-react';
import type { ShiftTemplateDto, StaffProfileDto } from '../../../../types/shift.types';
import { Field, Panel } from './shiftWorkspaceHelpers';

export const ShiftDirectAssignmentSection: React.FC<{
  staff: StaffProfileDto[];
  templates: ShiftTemplateDto[];
  assignStaffId: string;
  setAssignStaffId: (id: string) => void;
  assignTemplateId: string;
  setAssignTemplateId: (id: string) => void;
  assignDate: string;
  setAssignDate: (date: string) => void;
  actionLoading: string | null;
  onAssignShift: () => void;
}> = ({
  staff,
  templates,
  assignStaffId,
  setAssignStaffId,
  assignTemplateId,
  setAssignTemplateId,
  assignDate,
  setAssignDate,
  actionLoading,
  onAssignShift,
}) => {
  const { t } = useTranslation();

  return (
    <Panel title={t('employeesShiftWorkspace.directAssignment')} icon={<CalendarPlus size={18} />}>
      <Field label={t('employeesShiftWorkspace.staff')}>
        <select className="input select" value={assignStaffId} onChange={(event) => setAssignStaffId(event.target.value)}>
          {staff.map((item) => (
            <option key={item.userId} value={item.userId}>{item.userName}</option>
          ))}
        </select>
      </Field>
      <Field label={t('employeesShiftWorkspace.shiftTemplate')}>
        <select className="input select" value={assignTemplateId} onChange={(event) => setAssignTemplateId(event.target.value)}>
          {templates.map((template) => (
            <option key={template.shiftTemplateId} value={template.shiftTemplateId}>
              {template.shiftName} ({template.roleName})
            </option>
          ))}
        </select>
      </Field>
      <Field label={t('employeesShiftWorkspace.date')}>
        <input className="input" type="date" value={assignDate} onChange={(event) => setAssignDate(event.target.value)} />
      </Field>
      <button
        className="btn btn-primary"
        onClick={onAssignShift}
        disabled={actionLoading === 'assign' || staff.length === 0 || templates.length === 0}
      >
        {actionLoading === 'assign' ? (
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <CalendarPlus size={16} />
        )}
        {t('employeesShiftWorkspace.assignShift')}
      </button>
    </Panel>
  );
};
