import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, RefreshCw, Check, X, Calendar, AlertTriangle } from 'lucide-react';
import { adminShiftApi } from '../../../api/adminShiftApi';
import type { PendingDeletionRequestDto } from '../../../types/shift.types';
import { showSuccess, showError } from '../../../utils/ToastUtils';

const AdminShiftApprovalSection: React.FC = () => {
  const [requests, setRequests] = useState<PendingDeletionRequestDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminShiftApi.getPendingDeletionRequests();
      setRequests(res.data || []);
    } catch (error) {
      showError('Không thể tải danh sách yêu cầu hủy ca.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    const actionLabel = action === 'approve' ? 'Duyệt hủy' : 'Từ chối';
    if (!window.confirm(`Bạn có chắc muốn ${actionLabel} yêu cầu này?`)) return;

    setActionLoading(`${action}-${id}`);
    try {
      if (action === 'approve') {
        await adminShiftApi.approveDeletionRequest(id);
        showSuccess('Đã duyệt yêu cầu hủy ca làm việc.');
      } else {
        await adminShiftApi.rejectDeletionRequest(id);
        showSuccess('Đã từ chối yêu cầu hủy ca làm việc.');
      }
      await fetchRequests();
    } catch (error) {
      showError(`Thao tác ${actionLabel} thất bại.`);
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
            Yêu cầu hủy lịch làm việc
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Danh sách yêu cầu hủy ca làm việc từ Quản lý các rạp chiếu (chỉ áp dụng đối với ca đã có nhân viên đăng ký).
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchRequests} disabled={loading}>
          {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
          Làm mới
        </button>
      </div>

      <div className="glass-card" style={{ padding: 20 }}>
        {loading ? (
          <div className="state-center" style={{ minHeight: 200 }}>
            <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>Đang tải yêu cầu...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="state-center" style={{ minHeight: 200, border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
            <Calendar size={32} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: 10 }} />
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>Không có yêu cầu hủy ca nào đang chờ duyệt.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Rạp & Phòng ban</th>
                  <th>Ca làm việc</th>
                  <th>Ngày làm việc</th>
                  <th>Người yêu cầu</th>
                  <th>Lý do hủy</th>
                  <th>Ảnh hưởng</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
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
                        {r.registeredStaffCount} nhân viên
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
                          Duyệt
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
                          Từ chối
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
