import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import type { ShiftScheduleDto, ShiftTemplateDto } from '../../../../types/shift.types';
import {
  EmptyState,
  Field,
  LoadingState,
  hoursArray,
  minutesArray,
  parseLocalDate,
  statusBadgeClass,
  toLocalDateKey,
} from './shiftWorkspaceHelpers';

export const ShiftSchedulingSection: React.FC<{
  departments: any[];
  selectedDeptId: string;
  setSelectedDeptId: (id: string) => void;
  scheduleStartDate: string;
  setScheduleStartDate: (date: string) => void;
  scheduleEndDate: string;
  setScheduleEndDate: (date: string) => void;
  loadSchedules: () => void;
  shiftStats: { total: number; full: number; open: number; pendingDel: number };
  shiftWeekDays: { key: string; label: string; sub: string; count: number; isToday: boolean }[];
  focusedDay: string | null;
  setFocusedDay: (day: string | null | ((prev: string | null) => string | null)) => void;
  shiftRangeByDays: (anchor: string, offsetWeeks: number) => void;
  visibleSchedules: ShiftScheduleDto[];
  groupedSchedules: { date: string; dateKey: string; dateObj: Date; items: ShiftScheduleDto[] }[];
  schedulesLoading: boolean;
  loading: boolean;
  actionLoading: string | null;
  handleDeleteSchedule: (id: string, hasRegistered: boolean) => void;
  newSchedDate: string;
  setNewSchedDate: (date: string) => void;
  prefillTemplateId: string;
  handlePrefillTemplate: (templateId: string) => void;
  templates: ShiftTemplateDto[];
  newSchedShiftType: 1 | 2 | 3;
  setNewSchedShiftType: (type: 1 | 2 | 3) => void;
  newSchedName: string;
  setNewSchedName: (name: string) => void;
  newSchedStart: string;
  setNewSchedStart: (time: string) => void;
  newSchedEnd: string;
  setNewSchedEnd: (time: string) => void;
  newSchedMaxStaff: number;
  setNewSchedMaxStaff: (count: number) => void;
  newSchedRoleId: string;
  setNewSchedRoleId: (roleId: string) => void;
  uniqueRoles: { roleId: string; roleName: string }[];
  repeatWeekly: boolean;
  setRepeatWeekly: (repeat: boolean) => void;
  repeatWeeksCount: number;
  setRepeatWeeksCount: (count: number) => void;
  repeatWeekChoices: { weeks: number; dateStr: string }[];
  handleCreateSchedule: () => void;
}> = ({
  departments,
  selectedDeptId,
  setSelectedDeptId,
  scheduleStartDate,
  setScheduleStartDate,
  scheduleEndDate,
  setScheduleEndDate,
  loadSchedules,
  shiftStats,
  shiftWeekDays,
  focusedDay,
  setFocusedDay,
  shiftRangeByDays,
  visibleSchedules,
  groupedSchedules,
  schedulesLoading,
  loading,
  actionLoading,
  handleDeleteSchedule,
  newSchedDate,
  setNewSchedDate,
  prefillTemplateId,
  handlePrefillTemplate,
  templates,
  newSchedShiftType,
  setNewSchedShiftType,
  newSchedName,
  setNewSchedName,
  newSchedStart,
  setNewSchedStart,
  newSchedEnd,
  setNewSchedEnd,
  newSchedMaxStaff,
  setNewSchedMaxStaff,
  newSchedRoleId,
  setNewSchedRoleId,
  uniqueRoles,
  repeatWeekly,
  setRepeatWeekly,
  repeatWeeksCount,
  setRepeatWeeksCount,
  repeatWeekChoices,
  handleCreateSchedule,
}) => {
  const { t } = useTranslation();

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
        }}
      >
        {[
          { label: t('employeesShiftWorkspace.shiftsInRange', 'Ca trong kỳ'), value: shiftStats.total, color: 'var(--accent)' },
          { label: t('employeesShiftWorkspace.openSlots', 'Còn chỗ'), value: shiftStats.open, color: '#22c55e' },
          { label: t('employeesShiftWorkspace.fullShifts', 'Đã đủ người'), value: shiftStats.full, color: '#3b82f6' },
          { label: t('employeesShiftWorkspace.pendingDeletion', 'Chờ xóa'), value: shiftStats.pendingDel, color: '#f59e0b' },
        ].map((item) => (
          <div
            key={item.label}
            className="glass-card"
            style={{
              padding: '14px 16px',
              borderTop: `3px solid ${item.color}`,
            }}
          >
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {item.label}
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 850, color: 'var(--text-primary)' }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar: department + compact week filter */}
      <div
        className="glass-card"
        style={{
          padding: '10px 12px',
          display: 'grid',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
              {t('employeesShiftWorkspace.department')}
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {departments.length === 0 ? (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('employeesShiftWorkspace.noDepartments')}</span>
              ) : (
                departments.map((d, index) => {
                  const id = d.departmentId ?? d.DepartmentId;
                  const name = d.departmentName ?? d.DepartmentName;
                  const itemKey = (!id || id === '00000000-0000-0000-0000-000000000000') ? `dept-pill-${index}` : id;
                  const active = selectedDeptId === id;
                  return (
                    <button
                      key={itemKey}
                      type="button"
                      onClick={() => setSelectedDeptId(id)}
                      style={{
                        padding: '4px 9px',
                        borderRadius: 999,
                        border: active ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                        background: active ? 'rgba(255,138,0,0.14)' : 'var(--bg-elevated)',
                        color: active ? 'var(--accent)' : 'var(--text-secondary)',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        lineHeight: 1.2,
                      }}
                    >
                      {name}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Compact From — To filter */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              flexWrap: 'wrap',
              padding: '3px 4px 3px 6px',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-elevated)',
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', paddingLeft: 2 }}>
              {t('employeesShiftWorkspace.from', 'From')}
            </span>
            <input
              type="date"
              value={scheduleStartDate}
              onChange={(e) => {
                const start = e.target.value;
                setFocusedDay(null);
                setScheduleStartDate(start);
                if (start && scheduleEndDate && start > scheduleEndDate) {
                  const d = parseLocalDate(start);
                  d.setDate(d.getDate() + 6);
                  setScheduleEndDate(toLocalDateKey(d));
                }
              }}
              style={{
                width: 118,
                height: 26,
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
              }}
            />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>
              {t('employeesShiftWorkspace.to', 'To')}
            </span>
            <input
              type="date"
              value={scheduleEndDate}
              onChange={(e) => {
                setFocusedDay(null);
                const end = e.target.value;
                setScheduleEndDate(end);
                if (end && scheduleStartDate && end < scheduleStartDate) {
                  setScheduleStartDate(end);
                }
              }}
              style={{
                width: 118,
                height: 26,
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              type="button"
              onClick={() => shiftRangeByDays(scheduleStartDate, -1)}
              title={t('employeesShiftWorkspace.prevWeek', 'Tuần trước')}
              style={{
                width: 26,
                height: 26,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <ChevronLeft size={13} />
            </button>
            <button
              type="button"
              onClick={() => shiftRangeByDays(scheduleStartDate, 1)}
              title={t('employeesShiftWorkspace.nextWeek', 'Tuần sau')}
              style={{
                width: 26,
                height: 26,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <ChevronRight size={13} />
            </button>
            <button
              type="button"
              onClick={loadSchedules}
              title={t('employeesShiftWorkspace.filter', 'Filter')}
              style={{
                height: 26,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '0 8px',
                borderRadius: 6,
                border: '1px solid rgba(255,138,0,0.35)',
                background: 'rgba(255,138,0,0.12)',
                color: 'var(--accent)',
                fontSize: 11,
                fontWeight: 750,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={11} />
              {t('employeesShiftWorkspace.filter', 'Filter')}
            </button>
          </div>
        </div>

        {/* Compact week day strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gap: 5,
          }}
        >
          {shiftWeekDays.map((day) => {
            const selected = focusedDay === day.key || (!focusedDay && newSchedDate === day.key);
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => {
                  setNewSchedDate(day.key);
                  setFocusedDay((prev) => (prev === day.key ? null : day.key));
                }}
                style={{
                  padding: '6px 4px',
                  borderRadius: 8,
                  border: selected
                    ? '1px solid var(--accent)'
                    : day.isToday
                      ? '1px solid rgba(255,138,0,0.35)'
                      : '1px solid var(--border-color)',
                  background: selected
                    ? 'rgba(255,138,0,0.16)'
                    : day.isToday
                      ? 'rgba(255,138,0,0.06)'
                      : 'var(--bg-elevated)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {day.label}
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginTop: 1 }}>
                  {day.sub}
                </div>
                <div
                  style={{
                    marginTop: 3,
                    fontSize: 9,
                    fontWeight: 700,
                    color: day.count > 0 ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                >
                  {day.count} ca
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="employee-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, 0.7fr)',
          gap: 16,
          alignItems: 'start',
        }}
      >
        {/* LEFT: SCHEDULE LIST */}
        <div className="glass-card" style={{ padding: 20, display: 'grid', gap: 16, minHeight: 360 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{t('employeesShiftWorkspace.departmentSchedule')}</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                {t('employeesShiftWorkspace.departmentScheduleDesc')}
              </p>
            </div>
          </div>

          {schedulesLoading || loading ? (
            <LoadingState label={t('employeesShiftWorkspace.loadingSchedules', 'Đang tải lịch ca…')} />
          ) : visibleSchedules.length === 0 ? (
            <EmptyState
              label={
                focusedDay
                  ? t('employeesShiftWorkspace.noSchedulesOnDay', 'Không có ca trong ngày đã chọn.')
                  : t('employeesShiftWorkspace.noSchedules')
              }
            />
          ) : (
            <div style={{ display: 'grid', gap: 18 }}>
              {groupedSchedules.map((group) => (
                <div key={group.date}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        display: 'grid',
                        placeItems: 'center',
                        background: 'rgba(255,138,0,0.12)',
                        color: 'var(--accent)',
                      }}
                    >
                      <Calendar size={15} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{group.date}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {group.items.length} {t('employeesShiftWorkspace.shifts', 'ca')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 10 }}>
                    {group.items.map((s) => {
                      const fill = s.maxStaff > 0 ? Math.min(100, Math.round((s.registeredCount / s.maxStaff) * 100)) : 0;
                      const isFull = s.registeredCount >= s.maxStaff;
                      return (
                        <div
                          key={s.shiftScheduleId}
                          style={{
                            padding: '14px 16px',
                            borderRadius: 14,
                            border: '1px solid var(--border-color)',
                            background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                            display: 'grid',
                            gap: 10,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <strong style={{ fontSize: 15, color: 'var(--text-primary)' }}>{s.shiftName}</strong>
                                <span className="badge badge-default" style={{ fontSize: 10 }}>{s.roleName}</span>
                                {s.deletionStatus !== 'Active' && (
                                  <span className={statusBadgeClass(s.deletionStatus)}>
                                    {s.deletionStatus === 'PendingDeletion'
                                      ? t('adminShiftApproval.tableStatusPending')
                                      : s.deletionStatus}
                                  </span>
                                )}
                              </div>
                              <div
                                style={{
                                  marginTop: 6,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  fontSize: 12,
                                  color: 'var(--text-secondary)',
                                  fontWeight: 600,
                                }}
                              >
                                <Clock3 size={13} style={{ color: 'var(--accent)' }} />
                                {s.startTime?.slice(0, 5)} – {s.endTime?.slice(0, 5)}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ textAlign: 'right' }}>
                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 800,
                                    color: isFull ? 'var(--success)' : 'var(--text-primary)',
                                  }}
                                >
                                  {s.registeredCount}/{s.maxStaff}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                  {isFull
                                    ? t('employeesShiftWorkspace.full', 'Đủ')
                                    : t('employeesShiftWorkspace.registeredCount')}
                                </div>
                              </div>
                              {s.deletionStatus === 'Active' && (
                                <button
                                  className="btn"
                                  onClick={() => handleDeleteSchedule(s.shiftScheduleId, s.registeredCount > 0)}
                                  disabled={actionLoading === `delete-sched-${s.shiftScheduleId}`}
                                  style={{
                                    padding: '7px 10px',
                                    fontSize: 12,
                                    color: 'var(--danger)',
                                    background: 'rgba(239,68,68,0.08)',
                                    border: '1px solid rgba(239,68,68,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                >
                                  {actionLoading === `delete-sched-${s.shiftScheduleId}` ? (
                                    <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                                  ) : (
                                    <Trash2 size={13} />
                                  )}
                                  {t('employeesShiftWorkspace.cancelShift')}
                                </button>
                              )}
                            </div>
                          </div>

                          <div
                            style={{
                              height: 6,
                              borderRadius: 999,
                              background: 'var(--bg-elevated)',
                              overflow: 'hidden',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            <div
                              style={{
                                width: `${fill}%`,
                                height: '100%',
                                borderRadius: 999,
                                background: isFull
                                  ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                                  : 'linear-gradient(90deg, #ff8a00, #f59e0b)',
                                transition: 'width 0.25s ease',
                              }}
                            />
                          </div>

                          {s.registeredStaff?.length > 0 && (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                                {t('employeesShiftWorkspace.staffLabel')}:
                              </span>
                              {s.registeredStaff.map((r) => (
                                <span
                                  key={r.shiftRegistrationId}
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 650,
                                    background:
                                      r.status === 'Approved'
                                        ? 'rgba(34,197,94,0.12)'
                                        : 'rgba(234,179,8,0.12)',
                                    color: r.status === 'Approved' ? 'var(--success)' : 'var(--warning)',
                                    padding: '3px 8px',
                                    borderRadius: 999,
                                    border: `1px solid ${
                                      r.status === 'Approved'
                                        ? 'rgba(34,197,94,0.25)'
                                        : 'rgba(234,179,8,0.25)'
                                    }`,
                                  }}
                                >
                                  {r.staffName}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: CREATE SCHEDULE FORM */}
        <div
          className="glass-card"
          style={{
            padding: 0,
            overflow: 'hidden',
            position: 'sticky',
            top: 16,
            alignSelf: 'start',
          }}
        >
          <div
            style={{
              padding: '16px 18px',
              borderBottom: '1px solid var(--border-color)',
              background: 'linear-gradient(135deg, rgba(255,138,0,0.12), transparent)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                display: 'grid',
                placeItems: 'center',
                background: 'rgba(255,138,0,0.16)',
                color: 'var(--accent)',
              }}
            >
              <CalendarPlus size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{t('employeesShiftWorkspace.createNewShift')}</h3>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                {t('employeesShiftWorkspace.createShiftHint', 'Chọn ngày trên dải tuần, điền ca rồi tạo.')}
              </p>
            </div>
          </div>

          <div style={{ padding: 18, display: 'grid', gap: 14 }}>
            <Field label={t('employeesShiftWorkspace.selectDate')}>
              <input className="input" type="date" value={newSchedDate} onChange={(e) => setNewSchedDate(e.target.value)} />
            </Field>

            <Field label={t('employeesShiftWorkspace.prefillFromTemplate')}>
              <select className="input select" value={prefillTemplateId} onChange={(e) => handlePrefillTemplate(e.target.value)}>
                <option value="">-- {t('employeesShiftWorkspace.selectTemplate')} --</option>
                {templates.map((tpl) => (
                  <option key={tpl.shiftTemplateId} value={tpl.shiftTemplateId}>
                    {tpl.shiftName} ({tpl.startTime.slice(0, 5)}-{tpl.endTime.slice(0, 5)})
                  </option>
                ))}
              </select>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <Field label={t('employeesShiftWorkspace.shiftType')}>
                  <select
                    className="input select"
                    value={newSchedShiftType}
                    onChange={(e) => setNewSchedShiftType(Number(e.target.value) as 1 | 2 | 3)}
                  >
                    <option value={1}>{t('employeesShiftWorkspace.shiftTypeFulltime')}</option>
                    <option value={2}>{t('employeesShiftWorkspace.shiftTypeParttime')}</option>
                    <option value={3}>{t('employeesShiftWorkspace.shiftTypeFlexible')}</option>
                  </select>
                </Field>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <Field label={t('employeesShiftWorkspace.shiftName')}>
                  <input
                    className="input"
                    type="text"
                    value={newSchedName}
                    onChange={(e) => setNewSchedName(e.target.value)}
                    placeholder={t('employeesShiftWorkspace.shiftNamePlaceholder')}
                  />
                </Field>
              </div>
              <Field label={t('employeesShiftWorkspace.startTime')}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <select
                    className="input select"
                    value={newSchedStart.split(':')[0] || '08'}
                    onChange={(e) => {
                      const min = newSchedStart.split(':')[1] || '00';
                      setNewSchedStart(`${e.target.value}:${min}`);
                    }}
                    style={{ flex: 1 }}
                  >
                    {hoursArray.map((h) => (
                      <option key={h} value={h}>{h}h</option>
                    ))}
                  </select>
                  <select
                    className="input select"
                    value={newSchedStart.split(':')[1] || '00'}
                    onChange={(e) => {
                      const hr = newSchedStart.split(':')[0] || '08';
                      setNewSchedStart(`${hr}:${e.target.value}`);
                    }}
                    style={{ flex: 1 }}
                  >
                    {minutesArray.map((m) => (
                      <option key={m} value={m}>{m}m</option>
                    ))}
                  </select>
                </div>
              </Field>
              <Field label={t('employeesShiftWorkspace.endTime')}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <select
                    className="input select"
                    value={newSchedEnd.split(':')[0] || '16'}
                    onChange={(e) => {
                      const min = newSchedEnd.split(':')[1] || '00';
                      setNewSchedEnd(`${e.target.value}:${min}`);
                    }}
                    disabled={newSchedShiftType !== 3}
                    style={{ flex: 1, ...(newSchedShiftType !== 3 ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
                  >
                    {hoursArray.map((h) => (
                      <option key={h} value={h}>{h}h</option>
                    ))}
                  </select>
                  <select
                    className="input select"
                    value={newSchedEnd.split(':')[1] || '00'}
                    onChange={(e) => {
                      const hr = newSchedEnd.split(':')[0] || '16';
                      setNewSchedEnd(`${hr}:${e.target.value}`);
                    }}
                    disabled={newSchedShiftType !== 3}
                    style={{ flex: 1, ...(newSchedShiftType !== 3 ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
                  >
                    {minutesArray.map((m) => (
                      <option key={m} value={m}>{m}m</option>
                    ))}
                  </select>
                </div>
              </Field>
              <Field label={t('employeesShiftWorkspace.maxStaff')}>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={newSchedMaxStaff}
                  onChange={(e) => setNewSchedMaxStaff(Number(e.target.value))}
                />
              </Field>
              <Field label={t('employeesShiftWorkspace.role')}>
                <select className="input select" value={newSchedRoleId} onChange={(e) => setNewSchedRoleId(e.target.value)}>
                  {uniqueRoles.map((r) => (
                    <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div
              style={{
                display: 'grid',
                gap: 8,
                padding: '12px 14px',
                background: 'var(--bg-elevated)',
                borderRadius: 12,
                border: '1px solid var(--border-color)',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                <input
                  type="checkbox"
                  checked={repeatWeekly}
                  onChange={(e) => setRepeatWeekly(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                {t('employeesShiftWorkspace.autoRepeatWeekly')}
              </label>

              {repeatWeekly && (
                <div style={{ display: 'grid', gap: 6, marginTop: 4 }}>
                  <span className="input-label" style={{ margin: 0, fontSize: 12 }}>
                    {t('employeesShiftWorkspace.repeatWeeksQuestion')}
                  </span>
                  <select
                    className="input select"
                    value={repeatWeeksCount}
                    onChange={(e) => setRepeatWeeksCount(Number(e.target.value))}
                  >
                    {repeatWeekChoices.map((choice) => (
                      <option key={choice.weeks} value={choice.weeks}>
                        {t('employeesShiftWorkspace.weekChoice', { weeks: choice.weeks, date: choice.dateStr })}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button
              className="btn btn-primary"
              onClick={handleCreateSchedule}
              disabled={actionLoading === 'create-schedule' || !selectedDeptId}
              style={{ width: '100%' }}
            >
              {actionLoading === 'create-schedule' ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <CalendarPlus size={16} />
              )}
              {t('employeesShiftWorkspace.createSchedule')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
