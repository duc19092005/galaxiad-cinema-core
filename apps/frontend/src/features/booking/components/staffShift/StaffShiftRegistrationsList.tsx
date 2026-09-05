import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Clock4, Trash2, X } from 'lucide-react';
import type { ShiftRegistrationDto } from '../../../../types/shift.types';
import {
  EmptyLine,
  ListPanel,
  formatDate,
  getRegistrationHours,
  statusClass,
} from './staffShiftHelpers';

export const StaffShiftRegistrationsList: React.FC<{
  activeGroupedRegistrations: [string, ShiftRegistrationDto[]][];
  canceledGroupedRegistrations: [string, ShiftRegistrationDto[]][];
  pendingRegistrations: ShiftRegistrationDto[];
  isCancelMode: boolean;
  setIsCancelMode: (active: boolean) => void;
  cancelSelectIds: string[];
  setCancelSelectIds: React.Dispatch<React.SetStateAction<string[]>>;
  onBulkCancel: () => void;
  onCancelRegistration: (id: string) => void;
}> = ({
  activeGroupedRegistrations,
  canceledGroupedRegistrations,
  pendingRegistrations,
  isCancelMode,
  setIsCancelMode,
  cancelSelectIds,
  setCancelSelectIds,
  onBulkCancel,
  onCancelRegistration,
}) => {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
      {/* Active registrations */}
      <ListPanel
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{t('staffShiftSelf.mySchedule')}</span>
              {!isCancelMode && pendingRegistrations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCancelMode(true)}
                  style={{ background: 'transparent', border: 0, padding: 4, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)', transition: 'color 160ms, background 160ms' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--danger)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  title={t('staffShiftSelf.selectMultipleToCancel')}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </span>
            {isCancelMode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 'bold' }}>{t('staffShiftSelf.selectedCount', { count: cancelSelectIds.length })}</span>
                <button
                  type="button"
                  onClick={() => setCancelSelectIds(pendingRegistrations.map((r) => r.shiftRegistrationId))}
                  className="btn btn-secondary"
                  style={{ padding: '3px 8px', fontSize: 11, height: 24, minHeight: 24 }}
                >
                  {t('staffShiftSelf.selectAll')}
                </button>
                <button
                  type="button"
                  onClick={() => setCancelSelectIds([])}
                  className="btn btn-secondary"
                  style={{ padding: '3px 8px', fontSize: 11, height: 24, minHeight: 24 }}
                >
                  {t('staffShiftSelf.deselectAll')}
                </button>
                {cancelSelectIds.length > 0 && (
                  <button
                    type="button"
                    onClick={onBulkCancel}
                    className="btn btn-primary"
                    style={{ padding: '3px 10px', fontSize: 11, height: 24, minHeight: 24, background: 'var(--danger)', borderColor: 'var(--danger)', color: '#fff', fontWeight: 'bold' }}
                  >
                    {t('staffShiftSelf.cancelSelected', { count: cancelSelectIds.length })}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setIsCancelMode(false); setCancelSelectIds([]); }}
                  className="btn btn-secondary"
                  style={{ padding: '3px 8px', fontSize: 11, height: 24, minHeight: 24 }}
                >
                  <X size={12} /> {t('staffShiftSelf.exit')}
                </button>
              </div>
            )}
          </div>
        }
      >
        {activeGroupedRegistrations.length === 0 ? (
          <EmptyLine label={t('staffShiftSelf.noRegistrations')} />
        ) : (
          <div style={{ display: 'grid', gap: 14, padding: 14 }}>
            {activeGroupedRegistrations.slice(0, 10).map(([dateKey, dateItems]) => (
              <div key={dateKey} style={{ display: 'grid', gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', background: 'rgba(255,138,0,0.06)', padding: '5px 10px', borderRadius: 'var(--radius-sm)', width: 'fit-content', letterSpacing: '0.05em' }}>
                  {t('staffShiftSelf.day')} {formatDate(dateKey)}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                  {dateItems.map((item) => {
                    const isPending = item.status === 'Pending';
                    const isCancelSelected = cancelSelectIds.includes(item.shiftRegistrationId);
                    const hours = getRegistrationHours(item);
                    const isPart = hours <= 4.5;
                    const iconColor = isPart ? '#0ea5e9' : '#10b981';
                    return (
                      <li
                        key={item.shiftRegistrationId}
                        style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 12px', background: isCancelSelected ? 'rgba(235,87,87,0.06)' : 'var(--bg-elevated)', border: isCancelSelected ? '1px solid rgba(235,87,87,0.4)' : '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', alignItems: 'center', transition: 'background 160ms, border-color 160ms' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                          {isCancelMode && (
                            isPending
                              ? <input type="checkbox" checked={isCancelSelected} onChange={() => setCancelSelectIds((prev) => prev.includes(item.shiftRegistrationId) ? prev.filter((id) => id !== item.shiftRegistrationId) : [...prev, item.shiftRegistrationId])} style={{ cursor: 'pointer', width: 15, height: 15, flexShrink: 0, accentColor: 'var(--danger)' }} />
                              : <input type="checkbox" disabled style={{ opacity: 0.3, width: 15, height: 15, flexShrink: 0 }} />
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: isPart ? 'rgba(14,165,233,0.1)' : 'rgba(16,185,129,0.1)', color: iconColor, flexShrink: 0 }}>
                            {isPart ? <Clock4 size={14} /> : <CalendarDays size={14} />}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 750, color: 'var(--text-primary)' }}>{item.shiftName}</p>
                              <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 'var(--radius-sm)', background: isPart ? 'rgba(14,165,233,0.12)' : 'rgba(16,185,129,0.12)', color: iconColor, textTransform: 'uppercase' }}>
                                {isPart ? 'Part' : 'Full'}
                              </span>
                            </div>
                            <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>
                              {item.startTime.slice(0, 5)} – {item.endTime.slice(0, 5)}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span className={statusClass(item.status)}>{item.status}</span>
                          {!isCancelMode && isPending && (
                            <button
                              type="button"
                              onClick={() => onCancelRegistration(item.shiftRegistrationId)}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: 11, height: 24, minHeight: 24, color: 'var(--danger)', borderColor: 'rgba(235,87,87,0.2)', background: 'rgba(235,87,87,0.05)' }}
                            >
                              {t('staffShiftSelf.cancel')}
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </ListPanel>

      {/* Canceled/Rejected registrations */}
      <ListPanel title={t('staffShiftSelf.canceledSchedule')}>
        {canceledGroupedRegistrations.length === 0 ? (
          <EmptyLine label={t('staffShiftSelf.noRegistrations')} />
        ) : (
          <div style={{ display: 'grid', gap: 14, padding: 14 }}>
            {canceledGroupedRegistrations.slice(0, 10).map(([dateKey, dateItems]) => (
              <div key={dateKey} style={{ display: 'grid', gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', background: 'rgba(255,138,0,0.06)', padding: '5px 10px', borderRadius: 'var(--radius-sm)', width: 'fit-content', letterSpacing: '0.05em' }}>
                  {t('staffShiftSelf.day')} {formatDate(dateKey)}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                  {dateItems.map((item) => {
                    const hours = getRegistrationHours(item);
                    const isPart = hours <= 4.5;
                    const iconColor = isPart ? '#0ea5e9' : '#10b981';
                    return (
                      <li
                        key={item.shiftRegistrationId}
                        style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', alignItems: 'center' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: isPart ? 'rgba(14,165,233,0.1)' : 'rgba(16,185,129,0.1)', color: iconColor, flexShrink: 0 }}>
                            {isPart ? <Clock4 size={14} /> : <CalendarDays size={14} />}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 750, color: 'var(--text-primary)' }}>{item.shiftName}</p>
                              <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 'var(--radius-sm)', background: isPart ? 'rgba(14,165,233,0.12)' : 'rgba(16,185,129,0.12)', color: iconColor, textTransform: 'uppercase' }}>
                                {isPart ? 'Part' : 'Full'}
                              </span>
                            </div>
                            <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>
                              {item.startTime.slice(0, 5)} – {item.endTime.slice(0, 5)}
                              {item.notes ? ` · ${t('staffShiftSelf.reason')}: ${item.notes}` : ''}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span className={statusClass(item.status)}>{item.status}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </ListPanel>
    </div>
  );
};
