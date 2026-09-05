import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import type { ShiftRegistrationDto } from '../../../../types/shift.types';
import {
  ActionButton,
  EmptyState,
  LoadingState,
  statusBadgeClass,
  statusFilters,
} from './shiftWorkspaceHelpers';

export const ShiftRegistrationsSection: React.FC<{
  registrations: ShiftRegistrationDto[];
  groupedRegistrations: { date: string; items: ShiftRegistrationDto[] }[];
  statusFilter: (typeof statusFilters)[number];
  setStatusFilter: (filter: (typeof statusFilters)[number]) => void;
  loading: boolean;
  actionLoading: string | null;
  onAction: (registration: ShiftRegistrationDto, action: 'approve' | 'reject' | 'cancel') => void;
}> = ({
  registrations,
  groupedRegistrations,
  statusFilter,
  setStatusFilter,
  loading,
  actionLoading,
  onAction,
}) => {
  const { t } = useTranslation();

  return (
    <div className="glass-card" style={{ padding: 20, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{t('employeesShiftWorkspace.shiftRegistrations')}</h3>
        <select
          className="input select"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as (typeof statusFilters)[number])}
          style={{ width: 180 }}
        >
          {statusFilters.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingState label={t('employeesShiftWorkspace.loadingRegistrations')} />
      ) : registrations.length === 0 ? (
        <EmptyState label={t('employeesShiftWorkspace.noRegistrationsMatch')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {groupedRegistrations.map((group) => (
            <div key={group.date} style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              boxShadow: 'var(--shadow-md)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <div style={{ width: 6, height: 16, background: 'var(--accent)', borderRadius: '2px' }} />
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{group.date}</span>
                <span style={{
                  fontSize: '11px',
                  color: 'var(--accent)',
                  background: 'var(--accent-soft)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  marginLeft: '8px',
                }}>
                  {group.items.length} {t('employeesShiftWorkspace.registrationsCount')}
                </span>
              </div>
              <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ color: 'var(--text-primary)', opacity: 0.9 }}>{t('employeesShiftWorkspace.colStaff')}</th>
                      <th style={{ color: 'var(--text-primary)', opacity: 0.9 }}>{t('employeesShiftWorkspace.colShift')}</th>
                      <th style={{ color: 'var(--text-primary)', opacity: 0.9 }}>{t('employeesShiftWorkspace.colStatus')}</th>
                      <th style={{ color: 'var(--text-primary)', opacity: 0.9 }}>{t('employeesShiftWorkspace.colNotes')}</th>
                      <th style={{ textAlign: 'right', color: 'var(--text-primary)', opacity: 0.9 }}>{t('employeesShiftWorkspace.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((registration) => (
                      <tr key={registration.shiftRegistrationId}>
                        <td>
                          <strong style={{ color: 'var(--text-primary)', fontWeight: 650 }}>{registration.staffName}</strong>
                        </td>
                        <td>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{registration.shiftName}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-primary)', opacity: 0.8, marginTop: 2 }}>
                            {registration.startTime} {t('employeesShiftWorkspace.timeTo')} {registration.endTime}
                          </div>
                        </td>
                        <td>
                          <span className={statusBadgeClass(registration.status)}>{registration.status}</span>
                        </td>
                        <td style={{
                          color: registration.notes ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontSize: 13,
                          fontStyle: registration.notes ? 'normal' : 'italic',
                          fontWeight: registration.notes ? 500 : 'normal',
                          opacity: registration.notes ? 1 : 0.6,
                        }}>
                          {registration.notes || '-'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            {registration.status === 'Pending' && (
                              <>
                                <ActionButton
                                  label={t('employeesShiftWorkspace.approve')}
                                  tone="success"
                                  icon={<Check size={13} />}
                                  loading={actionLoading === `approve-${registration.shiftRegistrationId}`}
                                  onClick={() => onAction(registration, 'approve')}
                                />
                                <ActionButton
                                  label={t('employeesShiftWorkspace.reject')}
                                  tone="danger"
                                  icon={<X size={13} />}
                                  loading={actionLoading === `reject-${registration.shiftRegistrationId}`}
                                  onClick={() => onAction(registration, 'reject')}
                                />
                              </>
                            )}
                            {registration.status === 'Approved' && (
                              <ActionButton
                                label={t('employeesShiftWorkspace.cancel')}
                                tone="danger"
                                icon={<X size={13} />}
                                loading={actionLoading === `cancel-${registration.shiftRegistrationId}`}
                                onClick={() => onAction(registration, 'cancel')}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
