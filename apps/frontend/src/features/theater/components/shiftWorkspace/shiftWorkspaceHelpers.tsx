import React from 'react';
import axios from 'axios';
import { Loader2, UserRound } from 'lucide-react';

export const statusFilters = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'] as const;

/** Local calendar YYYY-MM-DD (avoids UTC shift from toISOString). */
export const toLocalDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const parseLocalDate = (yyyyMmDd: string) => {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const todayInput = () => toLocalDateKey(new Date());

/** Normalize API schedule date to YYYY-MM-DD for filtering/grouping. */
export const scheduleDateKey = (value?: string | null) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return toLocalDateKey(d);
};

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) return fallback;
  const payload = error.response?.data as { message?: string; Message?: string; errorCode?: string; ErrorCode?: string } | undefined;
  const code = payload?.errorCode ?? payload?.ErrorCode;
  if (error.response?.status === 409 || code === 'SHIFT_ERR') return 'Capacity limit updated. Try again in a few seconds.';
  if (code === 'PAYROLL_ERR') return payload?.message ?? payload?.Message ?? 'Payroll cannot be processed.';
  return payload?.message ?? payload?.Message ?? fallback;
};

export const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatMoney = (value: number) => `${value.toLocaleString('vi-VN')} VND`;

export const statusBadgeClass = (status: string) => {
  if (status === 'Approved' || status === 'Paid' || status === 'Active') return 'badge badge-success';
  if (status === 'Pending' || status === 'PendingDeletion') return 'badge badge-warning';
  if (status === 'Rejected' || status === 'Cancelled' || status === 'Deleted') return 'badge badge-danger';
  return 'badge badge-default';
};

export const StaffPortrait: React.FC<{ src?: string | null; name: string }> = ({ src, name }) => (
  <div style={{
    width: 34,
    height: 34,
    borderRadius: '50%',
    overflow: 'hidden',
    background: 'var(--accent-soft)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }}>
    {src ? (
      <img src={src} alt={`${name} portrait`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    ) : (
      <UserRound size={16} style={{ color: 'var(--accent)' }} />
    )}
  </div>
);

export const addHoursToTime = (timeStr: string, hours: number): string => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const newH = (h + hours) % 24;
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const hoursArray = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
export const minutesArray = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export const SummaryTile: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="glass-card" style={{ padding: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ color: 'var(--accent)' }}>{icon}</div>
      <span style={{ fontSize: 22, fontWeight: 800 }}>{value}</span>
    </div>
    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>{label}</p>
  </div>
);

export const Panel: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="glass-card" style={{ padding: 18, display: 'grid', gap: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ color: 'var(--accent)' }}>{icon}</span>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{title}</h3>
    </div>
    {children}
  </div>
);

export const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label style={{ display: 'grid', gap: 6 }}>
    <span className="input-label" style={{ margin: 0 }}>{label}</span>
    {children}
  </label>
);

export const LoadingState: React.FC<{ label: string }> = ({ label }) => (
  <div className="state-center" style={{ minHeight: 180 }}>
    <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{label}</p>
  </div>
);

export const EmptyState: React.FC<{ label: string }> = ({ label }) => (
  <div className="state-center" style={{ minHeight: 150, border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
    <UserRound size={28} style={{ color: 'var(--text-muted)', opacity: 0.45 }} />
    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>{label}</p>
  </div>
);

export const ActionButton: React.FC<{
  label: string;
  tone: 'success' | 'danger' | 'neutral';
  icon: React.ReactNode;
  loading: boolean;
  onClick: () => void;
}> = ({ label, tone, icon, loading, onClick }) => {
  const color = tone === 'success' ? 'var(--success)' : tone === 'danger' ? 'var(--danger)' : 'var(--text-secondary)';
  const background = tone === 'success'
    ? 'rgba(34,197,94,0.08)'
    : tone === 'danger'
      ? 'rgba(239,68,68,0.08)'
      : 'rgba(255,255,255,0.04)';
  return (
    <button
      className="btn"
      onClick={onClick}
      disabled={loading}
      style={{
        minHeight: 28,
        padding: '5px 10px',
        fontSize: 12,
        color,
        background,
        border: `1px solid ${tone === 'neutral' ? 'var(--border-color)' : `${color}44`}`,
      }}
    >
      {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : icon}
      {label}
    </button>
  );
};
