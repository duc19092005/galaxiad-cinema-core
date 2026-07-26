// src/features/theater/components/CleaningBoardWorkspace.tsx
// Theater Manager board for janitor cleaning tasks: assign staff, verify completion, generate tasks.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  RefreshCw, Loader2, CheckCircle2, UserPlus, Sparkles, Clock, ImageIcon, X,
} from 'lucide-react';
import { cleaningApi } from '../../../api/cleaningApi';
import { theaterShiftApi } from '../../../api/theaterShiftApi';
import { showError, showSuccess } from '../../../utils/ToastUtils';
import type { CleaningBoardCellDto, CleaningTaskDto, CleaningTaskStatus } from '../../../types/cleaning.types';
import type { StaffProfileDto } from '../../../types/shift.types';

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) return fallback;
  const payload = error.response?.data as { message?: string; Message?: string } | undefined;
  return payload?.message ?? payload?.Message ?? fallback;
};

const STATUS_LABEL: Record<CleaningTaskStatus, string> = {
  Pending: 'Chờ gán',
  Assigned: 'Đã gán',
  InProgress: 'Đang dọn',
  Completed: 'Chờ xác nhận',
  Verified: 'Hoàn tất',
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

interface CleaningBoardWorkspaceProps {
  cinemaId: string | null;
}

const CleaningBoardWorkspace: React.FC<CleaningBoardWorkspaceProps> = ({ cinemaId }) => {
  const [board, setBoard] = useState<CleaningBoardCellDto[]>([]);
  const [staffProfiles, setStaffProfiles] = useState<StaffProfileDto[]>([]);
  const [date, setDate] = useState(todayISO());
  const [loading, setLoading] = useState(false);
  const [assignTask, setAssignTask] = useState<CleaningTaskDto | null>(null);
  const [verifyTask, setVerifyTask] = useState<CleaningTaskDto | null>(null);
  const [generating, setGenerating] = useState(false);

  const loadBoard = useCallback(async () => {
    if (!cinemaId) return;
    setLoading(true);
    try {
      const res = await cleaningApi.getBoard(cinemaId, date);
      setBoard(res.data || []);
    } catch (err) {
      showError(getApiErrorMessage(err, 'Không tải được bảng công việc dọn dẹp.'));
    } finally {
      setLoading(false);
    }
  }, [cinemaId, date]);

  const loadStaff = useCallback(async () => {
    if (!cinemaId) return;
    try {
      const res = await theaterShiftApi.getStaffProfiles(cinemaId);
      setStaffProfiles((res.data || []).filter((staff) => staff.workingStatus && staff.roleNames?.includes('Janitor')));
    } catch {
      setStaffProfiles([]);
    }
  }, [cinemaId]);

  useEffect(() => { loadBoard(); }, [loadBoard]);
  useEffect(() => { loadStaff(); }, [loadStaff]);

  const allTasks = useMemo(() => board.flatMap((cell) => cell.tasks), [board]);
  const summary = useMemo(() => ({
    pending: allTasks.filter((t) => t.status === 'Pending').length,
    inProgress: allTasks.filter((t) => t.status === 'Assigned' || t.status === 'InProgress').length,
    awaitingVerify: allTasks.filter((t) => t.status === 'Completed').length,
    verified: allTasks.filter((t) => t.status === 'Verified').length,
  }), [allTasks]);

  const handleGenerateTasks = async () => {
    if (!cinemaId) return;
    setGenerating(true);
    try {
      const from = `${date}T00:00:00`;
      const to = `${date}T23:59:59`;
      const res = await cleaningApi.generateTasks(cinemaId, from, to);
      showSuccess(`Đã sinh ${res.data ?? 0} nhiệm vụ dọn dẹp mới.`);
      loadBoard();
    } catch (err) {
      showError(getApiErrorMessage(err, 'Không thể sinh nhiệm vụ.'));
    } finally {
      setGenerating(false);
    }
  };

  if (!cinemaId) {
    return (
      <div className="state-center" style={{ minHeight: 200 }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Vui lòng chọn rạp trước.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 850 }}>Bảng công việc quét dọn</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Theo dõi và phân công nhân viên vệ sinh sau mỗi suất chiếu.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ minHeight: 38 }} />
          <button className="btn btn-secondary" onClick={handleGenerateTasks} disabled={generating}>
            {generating ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
            Sinh nhiệm vụ
          </button>
          <button className="btn-icon" onClick={loadBoard} disabled={loading}>
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <MiniStat label="Chờ gán" value={summary.pending} tone="warning" />
        <MiniStat label="Đang dọn" value={summary.inProgress} tone="accent" />
        <MiniStat label="Chờ xác nhận" value={summary.awaitingVerify} tone="warning" />
        <MiniStat label="Hoàn tất" value={summary.verified} tone="success" />
      </div>

      {loading ? (
        <div className="state-center" style={{ minHeight: 200 }}>
          <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : board.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Chưa có nhiệm vụ nào cho ngày này. Bấm "Sinh nhiệm vụ" để tạo tự động từ lịch chiếu.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {board.map((cell) => (
            <div key={cell.auditoriumId} className="glass-card" style={{ padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800 }}>Phòng {cell.auditoriumNumber}</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {cell.tasks.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Không có nhiệm vụ.</p>}
                {cell.tasks.map((task) => (
                  <div key={task.cleaningTaskId} style={{
                    padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-surface)',
                    display: 'grid', gap: 6,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={STATUS_BADGE[task.status]}>{STATUS_LABEL[task.status]}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} /> {new Date(task.scheduledAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {task.assignedStaffName && (
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>NV: {task.assignedStaffName}</p>
                    )}
                    {task.dueAt && (
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                        Hạn: {new Date(task.dueAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(task.status === 'Pending') && (
                        <button className="btn btn-secondary" style={{ flex: 1, minHeight: 28, fontSize: 11 }} onClick={() => setAssignTask(task)}>
                          <UserPlus size={12} /> Gán NV
                        </button>
                      )}
                      {task.status === 'Completed' && (
                        <button className="btn btn-primary" style={{ flex: 1, minHeight: 28, fontSize: 11 }} onClick={() => setVerifyTask(task)}>
                          <CheckCircle2 size={12} /> Xác nhận
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {assignTask && (
        <AssignModal
          task={assignTask}
          staffProfiles={staffProfiles}
          onClose={() => setAssignTask(null)}
          onSaved={() => { setAssignTask(null); loadBoard(); }}
        />
      )}

      {verifyTask && (
        <VerifyModal
          task={verifyTask}
          onClose={() => setVerifyTask(null)}
          onSaved={() => { setVerifyTask(null); loadBoard(); }}
        />
      )}
    </div>
  );
};

const MiniStat: React.FC<{ label: string; value: number; tone: 'warning' | 'accent' | 'success' }> = ({ label, value, tone }) => (
  <div className="glass-card" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
    <strong style={{
      fontSize: 20,
      color: tone === 'warning' ? 'var(--warning)' : tone === 'success' ? 'var(--success)' : 'var(--accent)',
    }}>{value}</strong>
  </div>
);

const ModalShell: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16,
  }}>
    <div className="glass-card" style={{ width: '100%', maxWidth: 440, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{title}</h2>
        <button className="btn-icon" onClick={onClose}><X size={18} /></button>
      </div>
      {children}
    </div>
  </div>
);

const AssignModal: React.FC<{
  task: CleaningTaskDto;
  staffProfiles: StaffProfileDto[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ task, staffProfiles, onClose, onSaved }) => {
  const [staffId, setStaffId] = useState(staffProfiles[0]?.userId || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!staffId) {
      showError('Vui lòng chọn nhân viên.');
      return;
    }
    setSaving(true);
    try {
      await cleaningApi.assignTask(task.cleaningTaskId, { staffId });
      showSuccess('Đã gán nhiệm vụ cho nhân viên.');
      onSaved();
    } catch (err) {
      showError(getApiErrorMessage(err, 'Không thể gán nhiệm vụ.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={`Gán nhân viên — Phòng ${task.auditoriumNumber}`} onClose={onClose}>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label className="input-label">Chọn nhân viên vệ sinh</label>
          <select className="input select" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            {staffProfiles.length === 0 && <option value="">Không có nhân viên</option>}
            {staffProfiles.map((s) => <option key={s.userId} value={s.userId}>{s.userName}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ minHeight: 44 }}>
          {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Xác nhận gán'}
        </button>
      </div>
    </ModalShell>
  );
};

const VerifyModal: React.FC<{ task: CleaningTaskDto; onClose: () => void; onSaved: () => void }> = ({ task, onClose, onSaved }) => {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await cleaningApi.verifyTask(task.cleaningTaskId, { note: note.trim() || undefined });
      showSuccess('Đã xác nhận hoàn thành nhiệm vụ.');
      onSaved();
    } catch (err) {
      showError(getApiErrorMessage(err, 'Không thể xác nhận.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={`Xác nhận hoàn thành — Phòng ${task.auditoriumNumber}`} onClose={onClose}>
      <div style={{ display: 'grid', gap: 12 }}>
        {task.proofImageUrl ? (
          <img src={task.proofImageUrl} alt="Proof" style={{ width: '100%', borderRadius: 'var(--radius-md)', maxHeight: 220, objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12 }}>
            <ImageIcon size={16} /> Không có ảnh minh chứng.
          </div>
        )}
        {task.note && <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Ghi chú NV: {task.note}</p>}
        <div>
          <label className="input-label">Ghi chú xác nhận (tuỳ chọn)</label>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Đạt yêu cầu" />
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ minHeight: 44 }}>
          {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Xác nhận hoàn tất'}
        </button>
      </div>
    </ModalShell>
  );
};

export default CleaningBoardWorkspace;
