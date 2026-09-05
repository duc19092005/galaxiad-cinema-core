import React from 'react';
import axios from 'axios';
import type { ShiftRegistrationDto, ShiftTemplateDto } from '../../../../types/shift.types';

export interface SelectedShiftKey {
  shift: ShiftTemplateDto;
  dateValue: string;
}

export const DAY_WINDOW = 7;
export const TIME_AXIS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00',
];
export const TIME_COLUMN_COUNT = TIME_AXIS.length;
export const TIME_SLOT_HEIGHT = 46;
export const TIMELINE_START_MINUTES = 6 * 60;

export const toInputDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
export const todayInput = () => toInputDate(new Date());

export const addDays = (dateValue: string, amount: number) => {
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);
  return toInputDate(date);
};

export const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  const datePart = value.slice(0, 10);
  const [y, m, d] = datePart.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatMoney = (value: number) => `${value.toLocaleString('vi-VN')} VND`;

export const getApiErrorMessage = (error: unknown, fallback: string, t?: (key: string) => string) => {
  if (!axios.isAxiosError(error)) return fallback;
  const payload = error.response?.data as { message?: string; Message?: string; errorCode?: string } | undefined;
  const code = payload?.errorCode;
  if (error.response?.status === 409 || code === 'SHIFT_ERR')
    return payload?.message ?? payload?.Message ?? (t ? t('staffShiftSelf.shiftConflict') : 'Ca đăng ký bị xung đột. Thử lại sau.');
  return payload?.message ?? payload?.Message ?? fallback;
};

export const parseTimeMinutes = (value: string) => {
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
};

export const getShiftHours = (shift: ShiftTemplateDto) => {
  const start = parseTimeMinutes(shift.startTime);
  let end = parseTimeMinutes(shift.endTime);
  if (end <= start) end += 24 * 60;
  return (end - start) / 60;
};

export const getRegistrationHours = (registration: ShiftRegistrationDto) => {
  const start = parseTimeMinutes(registration.startTime);
  let end = parseTimeMinutes(registration.endTime);
  if (end <= start) end += 24 * 60;
  return Math.max((end - start) / 60, 1);
};

export const getTimelineBlockStyle = (registration: ShiftRegistrationDto): React.CSSProperties => {
  const start = parseTimeMinutes(registration.startTime);
  const offsetHours = Math.max((start - TIMELINE_START_MINUTES) / 60, 0);
  const durationHours = Math.min(getRegistrationHours(registration), TIME_COLUMN_COUNT - offsetHours);
  return {
    top: offsetHours * TIME_SLOT_HEIGHT + 4,
    height: Math.max(durationHours * TIME_SLOT_HEIGHT - 8, 32),
  };
};

export const getTemplateTimelineBlockStyle = (shift: ShiftTemplateDto): React.CSSProperties => {
  const start = parseTimeMinutes(shift.startTime);
  const offsetHours = Math.max((start - TIMELINE_START_MINUTES) / 60, 0);
  const durationHours = Math.min(getShiftHours(shift), TIME_COLUMN_COUNT - offsetHours);
  return {
    top: offsetHours * TIME_SLOT_HEIGHT + 4,
    height: Math.max(durationHours * TIME_SLOT_HEIGHT - 8, 32),
  };
};

export const isPartTime = (shift: ShiftTemplateDto) => {
  const name = shift.shiftName.toLowerCase();
  if (name.includes('part')) return true;
  if (name.includes('full')) return false;
  return getShiftHours(shift) <= 4.5;
};

export const registrationDateKey = (r: ShiftRegistrationDto) => r.registrationDate.slice(0, 10);

export const statusClass = (status: string) => {
  if (status === 'Approved' || status === 'Paid') return 'badge badge-success';
  if (status === 'Pending') return 'badge badge-warning';
  if (status === 'Rejected' || status === 'Cancelled') return 'badge badge-danger';
  return 'badge badge-default';
};

export const selectionKey = (shift: ShiftTemplateDto, dateValue: string) =>
  `${shift.shiftScheduleId ?? shift.shiftTemplateId}::${dateValue}`;

export const Metric: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 14, background: 'var(--bg-surface)' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ color: 'var(--accent)' }}>{icon}</span>
      <strong style={{ fontSize: 15 }}>{value}</strong>
    </div>
    <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>{label}</p>
  </div>
);

export const Panel: React.FC<{ title: string; hint?: string; children: React.ReactNode }> = ({ title, hint, children }) => (
  <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 16, background: 'var(--bg-surface)', display: 'grid', gap: 14 }}>
    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
      <h3 style={{ margin: 0, fontSize: 12, fontWeight: 850, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</h3>
      {hint && <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
    {children}
  </div>
);

export const ListPanel: React.FC<{ title: string | React.ReactNode; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-surface)' }}>
    <h3 style={{ margin: 0, padding: '12px 14px', fontSize: 13, fontWeight: 800, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }}>{title}</h3>
    <div style={{ display: 'grid' }}>{children}</div>
  </div>
);

export const Row: React.FC<{ title: string; meta: string; badge: string }> = ({ title, meta, badge }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{title}</p>
      <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-secondary)', overflowWrap: 'anywhere' }}>{meta}</p>
    </div>
    <span className={statusClass(badge)} style={{ alignSelf: 'center', flexShrink: 0 }}>{badge}</span>
  </div>
);

export const EmptyLine: React.FC<{ label: string }> = ({ label }) => (
  <p style={{ margin: 0, padding: 16, fontSize: 12, color: 'var(--text-muted)' }}>{label}</p>
);
