import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, RefreshCw, Check, X, Calendar, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminShiftApi } from '../../../api/adminShiftApi';
import type { PendingDeletionRequestDto } from '../../../types/shift.types';
import { showSuccess, showError } from '../../../utils/ToastUtils';

const AdminShiftApprovalSection: React.FC = () => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<PendingDeletionRequestDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminShiftApi.getPendingDeletionRequests();
      setRequests(res.data || []);
    } catch (error) {
      showError(t('adminShiftApproval.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    const actionLabel = action === 'approve' ? t('adminShiftApproval.approve') : t('adminShiftApproval.reject');
    const confirmMessage = action === 'approve' ? t('adminShiftApproval.confirmApprove') : t('adminShiftApproval.confirmReject');
    if (!window.confirm(confirmMessage)) return;

    setActionLoading(`${action}-${id}`);
    try {
      if (action === 'approve') {
        await adminShiftApi.approveDeletionRequest(id);
        showSuccess(t('adminShiftApproval.approveSuccess'));
      } else {
        await adminShiftApi.rejectDeletionRequest(id);
        showSuccess(t('adminShiftApproval.rejectSuccess'));
      }
      await fetchRequests();
    } catch (error) {
      showError(t('adminShiftApproval.actionFailed', { action: actionLabel }));
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (valStr: string) => {
    return new Date(valStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="animate-in" style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>
            {t('adminShiftApproval.title')}
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            {t('adminShiftApproval.description')}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchRequests} disabled={loading}>
          {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
          {t('adminShiftApproval.refresh')}
        </button>
      </div>

      <div className="glass-card" style={{ padding: 20 }}>
        {loading ? (
          <div className="state-center" style={{ minHeight: 200 }}>
            <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>{t('adminShiftApproval.loading')}</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="state-center" style={{ minHeight: 200, border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
            <Calendar size={32} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: 10 }} />
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>{t('adminShiftApproval.noPendingRequests')}</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t('adminShiftApproval.tableTheater')}</th>
                  <th>{t('adminShiftApproval.tableShift')}</th>
                  <th>{t('adminShiftApproval.tableDate')}</th>
                  <th>{t('adminShiftApproval.tableRequester')}</th>
                  <th>{t('adminShiftApproval.tableReason')}</th>
                  <th>{t('adminShiftApproval.tableImpact')}</th>
                  <th style={{ textAlign: 'right' }}>{t('adminShiftApproval.tableActions')}</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.shiftScheduleId}>
                    <td>
                      <strong>{r.cinemaName}</strong>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{r.departmentName}</div>
                    </td>
                    <td>
                      <strong>{r.shiftName}</strong>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {r.startTime.slice(0, 5)} - {r.endTime.slice(0, 5)}
                      </div>
                    </td>
                    <td>{formatDate(r.date)}</td>
                    <td>
                      <strong>{r.deletionRequestedByUserName}</strong>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {formatDate(r.deletionRequestedAt)}
                      </div>
                    </td>
                    <td style={{ maxWidth: 200, wordBreak: 'break-word', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {r.deletionReason}
                    </td>
                    <td>
                      <span 
                        className="badge badge-warning" 
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: 4, 
                          background: 'rgba(234,179,8,0.1)', 
                          color: 'var(--warning)',
                          border: '1px solid rgba(234,179,8,0.2)' 
                        }}
                      >
                        <AlertTriangle size={11} />
                        {t('adminShiftApproval.staffCount', { count: r.registeredStaffCount })}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          className="btn"
                          disabled={actionLoading !== null}
                          onClick={() => handleAction(r.shiftScheduleId, 'approve')}
                          style={{
                            minHeight: 28,
                            padding: '5px 10px',
                            fontSize: 12,
                            color: 'var(--success)',
                            background: 'rgba(34,197,94,0.08)',
                            border: '1px solid rgba(34,197,94,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          {actionLoading === `approve-${r.shiftScheduleId}` ? (
                            <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <Check size={13} />
                          )}
                          {t('adminShiftApproval.approve')}
                        </button>
                        <button
                          className="btn"
                          disabled={actionLoading !== null}
                          onClick={() => handleAction(r.shiftScheduleId, 'reject')}
                          style={{
                            minHeight: 28,
                            padding: '5px 10px',
                            fontSize: 12,
                            color: 'var(--danger)',
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          {actionLoading === `reject-${r.shiftScheduleId}` ? (
                            <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <X size={13} />
                          )}
                          {t('adminShiftApproval.reject')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminShiftApprovalSection;
