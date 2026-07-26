// src/features/staff/components/JanitorCleaningTasks.tsx
// Janitor's personal cleaning task list: view assigned tasks, start (requires Approved shift), complete with proof.

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Sparkles, Clock, RefreshCw, Loader2, PlayCircle, CheckCircle2, X, ImageIcon } from 'lucide-react';
import { cleaningApi } from '../../../api/cleaningApi';
import { showError, showSuccess } from '../../../utils/ToastUtils';
import type { CleaningTaskDto, CleaningTaskStatus } from '../../../types/cleaning.types';

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) return fallback;
  const payload = error.response?.data as { message?: string; Message?: string; errorCode?: string; ErrorCode?: string } | undefined;
  const code = payload?.errorCode ?? payload?.ErrorCode;
  if (code === 'CLEANING_SHIFT_ERR') {
    return 'Bạn cần đang trong ca làm việc đã được duyệt để bắt đầu dọn dẹp.';
  }
  return payload?.message ?? payload?.Message ?? fallback;
};

const STATUS_LABEL: Record<CleaningTaskStatus, string> = {
  Pending: 'Chờ gán',
  Assigned: 'Sẵn sàng bắt đầu',
  InProgress: 'Đang dọn',
  Completed: 'Đã gửi báo cáo',
  Verified: 'Đã xác nhận',
  Skipped: 'Bỏ qua',
};

const STATUS_BADGE: Record<CleaningTaskStatus, string> = {
  Pending: 'badge badge-warning',
  Assigned: 'badge badge-accent',
  InProgress: 'badge badge-accent',
  Completed: 'badge badge-warning',
  Verified: 'badge badge-success',
  Skipped: 'badge badge-danger',
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const JanitorCleaningTasks: React.FC = () => {
  const [tasks, setTasks] = useState<CleaningTaskDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [completeTarget, setCompleteTarget] = useState<CleaningTaskDto | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cleaningApi.getMyTasks(todayISO());
      setTasks(res.data || []);
    } catch (err) {
      showError(getApiErrorMessage(err, 'Không tải được nhiệm vụ dọn dẹp.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleStart = async (task: CleaningTaskDto) => {
    setActioningId(task.cleaningTaskId);
    try {
      await cleaningApi.startTask(task.cleaningTaskId);
      showSuccess('Đã bắt đầu dọn dẹp.');
      loadTasks();
    } catch (err) {
      showError(getApiErrorMessage(err, 'Không thể bắt đầu nhiệm vụ.'));
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 850, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={22} style={{ color: 'var(--accent)' }} /> Nhiệm vụ quét dọn hôm nay
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Danh sách phòng chiếu cần dọn dẹp được gán cho bạn.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadTasks} disabled={loading}>
          {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
          Làm mới
        </button>
      </div>

      {loading ? (
        <div className="state-center" style={{ minHeight: 200 }}>
          <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : tasks.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Không có nhiệm vụ nào được gán cho bạn hôm nay.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {tasks.map((task) => (
            <div key={task.cleaningTaskId} className="glass-card" style={{ padding: 18, display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 16 }}>Phòng {task.auditoriumNumber}</strong>
                <span className={STATUS_BADGE[task.status]}>{STATUS_LABEL[task.status]}</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> {new Date(task.scheduledAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                {task.dueAt ? ` · Hạn ${new Date(task.dueAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : ''}
              </span>
              {task.status === 'Assigned' && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleStart(task)}
                  disabled={actioningId === task.cleaningTaskId}
                  style={{ minHeight: 40 }}
                >
                  {actioningId === task.cleaningTaskId
                    ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    : <PlayCircle size={15} />}
                  Bắt đầu dọn
                </button>
              )}
              {task.status === 'InProgress' && (
                <button className="btn btn-primary" onClick={() => setCompleteTarget(task)} style={{ minHeight: 40 }}>
                  <CheckCircle2 size={15} /> Báo cáo hoàn thành
                </button>
              )}
              {(task.status === 'Completed' || task.status === 'Verified') && (
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                  {task.status === 'Verified' ? 'Quản lý đã xác nhận.' : 'Đang chờ quản lý xác nhận.'}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {completeTarget && (
        <CompleteTaskModal
          task={completeTarget}
          onClose={() => setCompleteTarget(null)}
          onSaved={() => { setCompleteTarget(null); loadTasks(); }}
        />
      )}
    </div>
  );
};

const CompleteTaskModal: React.FC<{ task: CleaningTaskDto; onClose: () => void; onSaved: () => void }> = ({ task, onClose, onSaved }) => {
  const [note, setNote] = useState('');
  const [proofImageUrl, setProofImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await cleaningApi.completeTask(task.cleaningTaskId, {
        note: note.trim() || undefined,
        proofImageUrl: proofImageUrl.trim() || undefined,
      });
      showSuccess('Đã gửi báo cáo hoàn thành.');
      onSaved();
    } catch (err) {
      showError(getApiErrorMessage(err, 'Không thể gửi báo cáo.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16,
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 440, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Hoàn thành: Phòng {task.auditoriumNumber}</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ImageIcon size={13} /> Ảnh minh chứng (URL)
            </label>
            <input className="input" value={proofImageUrl} onChange={(e) => setProofImageUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className="input-label">Ghi chú</label>
            <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú thêm nếu cần" />
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ minHeight: 44 }}>
            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Gửi báo cáo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JanitorCleaningTasks;
