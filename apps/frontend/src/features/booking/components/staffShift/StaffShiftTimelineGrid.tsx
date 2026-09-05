import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock4,
} from 'lucide-react';
import type { ShiftRegistrationDto, ShiftTemplateDto } from '../../../../types/shift.types';
import {
  DAY_WINDOW,
  TIME_AXIS,
  TIME_COLUMN_COUNT,
  TIME_SLOT_HEIGHT,
  formatDate,
  getRegistrationHours,
  getTemplateTimelineBlockStyle,
  getTimelineBlockStyle,
  isPartTime,
  statusClass,
  type SelectedShiftKey,
} from './staffShiftHelpers';

export const StaffShiftTimelineGrid: React.FC<{
  dateCells: string[];
  dateWindowStart: string;
  today: string;
  activeDate: string;
  setActiveDate: (date: string) => void;
  moveDateWindow: (offset: number) => void;
  selectedShifts: SelectedShiftKey[];
  toggleShiftSelect: (shift: ShiftTemplateDto, dateValue: string) => void;
  isShiftSelected: (shift: ShiftTemplateDto, dateValue: string) => boolean;
  weeklyAvailableShifts: Record<string, ShiftTemplateDto[]>;
  registrationsByDate: Map<string, ShiftRegistrationDto[]>;
  handleCancelRegistration: (id: string) => void;
}> = ({
  dateCells,
  dateWindowStart,
  today,
  activeDate,
  setActiveDate,
  moveDateWindow,
  selectedShifts,
  toggleShiftSelect,
  isShiftSelected,
  weeklyAvailableShifts,
  registrationsByDate,
  handleCancelRegistration,
}) => {
  const { t } = useTranslation();

  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-surface)' }}>
      {/* Calendar header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: 14, borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 850, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', gap: 8, alignItems: 'center' }}>
          <CalendarDays size={16} />
          {t('staffShiftSelf.weeklySchedule')} — {formatDate(dateCells[0])} – {formatDate(dateCells[dateCells.length - 1])}
        </h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {selectedShifts.length > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', background: 'rgba(255,138,0,0.1)', border: '1px solid rgba(255,138,0,0.3)', borderRadius: 'var(--radius-md)', padding: '4px 10px' }}>
              {t('staffShiftSelf.selected', { count: selectedShifts.length })}
            </span>
          )}
          <button className="btn btn-secondary" onClick={() => moveDateWindow(-7)} disabled={dateWindowStart <= today}>
            <ChevronLeft size={16} /> {t('staffShiftSelf.previousWeek')}
          </button>
          <button className="btn btn-secondary" onClick={() => moveDateWindow(7)}>
            {t('staffShiftSelf.nextWeek')} <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{ padding: 14, overflowX: 'auto', background: 'rgba(0,0,0,0.08)' }}>
        <div style={{ minWidth: 900 }}>
          <div style={{ display: 'grid', gridTemplateColumns: `76px repeat(${DAY_WINDOW}, minmax(112px, 1fr))`, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-base)' }}>
            {/* Corner cell */}
            <div style={{ borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }} />

            {/* Day headers */}
            {dateCells.map((dateValue) => {
              const date = new Date(`${dateValue}T00:00:00`);
              const isPast = dateValue < today;
              const isActive = dateValue === activeDate;
              return (
                <button
                  key={dateValue}
                  type="button"
                  onClick={() => setActiveDate(dateValue)}
                  style={{
                    minHeight: 58, display: 'grid', placeItems: 'center', gap: 2,
                    border: 0,
                    borderRight: '1px solid var(--border-color)',
                    borderBottom: isActive ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                    background: isActive ? 'rgba(255,138,0,0.1)' : 'var(--bg-surface)',
                    color: isPast ? 'var(--text-muted)' : isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    opacity: isPast ? 0.56 : 1,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 850, textTransform: 'uppercase' }}>
                    {date.toLocaleDateString('vi-VN', { weekday: 'short' })}
                  </span>
                  <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: isActive ? 800 : 600 }}>
                    {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                  </span>
                </button>
              );
            })}

            {/* Time axis */}
            <div style={{ display: 'grid', gridTemplateRows: `repeat(${TIME_COLUMN_COUNT}, ${TIME_SLOT_HEIGHT}px)`, borderRight: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.045)' }}>
              {TIME_AXIS.map((time) => (
                <div key={time} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '7px 10px 0 0', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)', opacity: 0.88, fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                  {time}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {dateCells.map((dateValue) => {
              const isPast = dateValue < today;
              const isActive = dateValue === activeDate;
              const dayRegistrations = registrationsByDate.get(dateValue) ?? [];
              const dayAvailableShifts = weeklyAvailableShifts[dateValue] ?? [];
              const unregisteredAvailable = dayAvailableShifts.filter(
                (shift) => !dayRegistrations.some((reg) => reg.shiftScheduleId === shift.shiftScheduleId),
              );

              return (
                <div
                  key={dateValue}
                  onClick={() => setActiveDate(dateValue)}
                  style={{
                    minHeight: TIME_COLUMN_COUNT * TIME_SLOT_HEIGHT,
                    position: 'relative',
                    borderRight: '1px solid var(--border-color)',
                    background: isPast
                      ? 'rgba(255,255,255,0.025)'
                      : isActive
                        ? 'rgba(255,138,0,0.035)'
                        : 'var(--bg-base)',
                    opacity: isPast ? 0.55 : 1,
                    cursor: 'default',
                    overflow: 'hidden',
                  }}
                >
                  {/* Hour grid lines */}
                  <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateRows: `repeat(${TIME_COLUMN_COUNT}, ${TIME_SLOT_HEIGHT}px)`, pointerEvents: 'none' }}>
                    {TIME_AXIS.map((tAxis) => <span key={tAxis} style={{ borderBottom: '1px solid rgba(255,255,255,0.055)' }} />)}
                  </div>

                  {/* Available shift slots */}
                  {!isPast && unregisteredAvailable.map((shift) => {
                    const remaining = shift.maxStaff - (shift.registeredCount ?? 0);
                    const isFull = remaining <= 0;
                    const isPart = isPartTime(shift);
                    const selected = isShiftSelected(shift, dateValue);

                    return (
                      <div
                        key={shift.shiftScheduleId ?? shift.shiftTemplateId}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isFull) return;
                          toggleShiftSelect(shift, dateValue);
                        }}
                        style={{
                          ...getTemplateTimelineBlockStyle(shift),
                          position: 'absolute',
                          left: 6,
                          right: 6,
                          zIndex: 1,
                          border: isFull
                            ? '1.5px dashed rgba(235,87,87,0.35)'
                            : selected
                              ? '1.5px solid var(--accent)'
                              : '1.5px dashed var(--accent)',
                          background: isFull
                            ? 'rgba(235,87,87,0.04)'
                            : selected
                              ? 'rgba(255,138,0,0.18)'
                              : 'rgba(255,138,0,0.04)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '7px 8px',
                          display: 'grid',
                          alignContent: 'start',
                          gap: 3,
                          cursor: isFull ? 'not-allowed' : 'pointer',
                          overflow: 'hidden',
                          transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: selected ? '0 0 0 2px rgba(255,138,0,0.25), 0 4px 14px rgba(255,138,0,0.2)' : 'none',
                        }}
                        onMouseEnter={(e) => {
                          if (isFull || selected) return;
                          e.currentTarget.style.background = 'rgba(255,138,0,0.09)';
                          e.currentTarget.style.boxShadow = '0 3px 10px rgba(255,138,0,0.12)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          if (isFull || selected) return;
                          e.currentTarget.style.background = 'rgba(255,138,0,0.04)';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'none';
                        }}
                      >
                        {selected && (
                          <span style={{ position: 'absolute', top: 4, right: 4, color: 'var(--accent)', display: 'flex' }}>
                            <CheckCircle2 size={13} fill="rgba(255,138,0,0.25)" />
                          </span>
                        )}

                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                          {isPart
                            ? <Clock4 size={11} style={{ color: '#0ea5e9', flexShrink: 0 }} />
                            : <CalendarDays size={11} style={{ color: '#10b981', flexShrink: 0 }} />}
                          <span style={{ fontSize: 10, fontWeight: 850, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selected ? 'var(--accent)' : 'var(--text-secondary)' }}>
                            {shift.shiftName}
                          </span>
                        </span>
                        <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: selected ? 'var(--accent)' : 'var(--text-secondary)' }}>
                          {shift.startTime.slice(0, 5)} – {shift.endTime.slice(0, 5)}
                        </span>
                        <span style={{
                          fontSize: 9, fontWeight: 800, padding: '1px 5px',
                          borderRadius: 'var(--radius-sm)', width: 'fit-content',
                          background: isFull ? 'rgba(235,87,87,0.15)' : 'rgba(16,185,129,0.15)',
                          color: isFull ? 'var(--danger)' : 'var(--success)',
                        }}>
                          {isFull ? t('staffShiftSelf.full') : t('staffShiftSelf.remaining', { remaining, total: shift.maxStaff })}
                        </span>
                      </div>
                    );
                  })}

                  {!isPast && dayRegistrations.length === 0 && dayAvailableShifts.length === 0 && (
                    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', pointerEvents: 'none', opacity: 0.35, writingMode: 'vertical-rl' }}>
                      {t('staffShiftSelf.noShift')}
                    </div>
                  )}

                  {/* My existing registrations */}
                  {dayRegistrations.map((registration, index) => {
                    const hours = getRegistrationHours(registration);
                    const isPart = hours <= 4.5;
                    return (
                      <div
                        key={registration.shiftRegistrationId}
                        style={{
                          ...getTimelineBlockStyle(registration),
                          position: 'absolute',
                          left: 8 + (index % 2) * 6,
                          right: 8,
                          zIndex: 2,
                          display: 'grid',
                          alignContent: 'start',
                          gap: 5,
                          padding: '8px 9px',
                          borderRadius: 'var(--radius-sm)',
                          borderLeft: `3px solid ${registration.status === 'Rejected' ? 'var(--danger)' : registration.status === 'Approved' ? 'var(--success)' : 'var(--accent)'}`,
                          background: 'var(--bg-elevated)',
                          boxShadow: '0 8px 18px rgba(0,0,0,0.2)',
                          overflow: 'hidden',
                        }}
                      >
                        {registration.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); void handleCancelRegistration(registration.shiftRegistrationId); }}
                            style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(235,87,87,0.1)', border: '1px solid rgba(235,87,87,0.2)', color: 'var(--danger)', cursor: 'pointer', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold', zIndex: 5 }}
                            title={t('staffShiftSelf.cancelRegistration')}
                          >
                            ×
                          </button>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                          {isPart ? <Clock4 size={12} style={{ color: '#0ea5e9', flexShrink: 0 }} /> : <CalendarDays size={12} style={{ color: '#10b981', flexShrink: 0 }} />}
                          <span style={{ fontSize: 10, fontWeight: 850, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {isPart ? 'PT' : 'FT'} {registration.startTime.slice(0, 5)}
                          </span>
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                          {registration.startTime.slice(0, 5)} – {registration.endTime.slice(0, 5)}
                        </span>
                        <span className={statusClass(registration.status)} style={{ width: 'fit-content', transform: 'scale(0.86)', transformOrigin: 'left center' }}>
                          {registration.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
