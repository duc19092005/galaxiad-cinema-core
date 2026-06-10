// src/components/LogoutModal.tsx
import React from 'react';
import { X, LogOut, Loader2, AlertCircle } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  error?: string | null;
}

const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  error = null,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--danger-soft)',
            }}>
              <LogOut size={18} style={{ color: 'var(--danger)' }} />
            </div>
            <div>
              <h2 className="heading-md" style={{ margin: 0 }}>Confirm logout</h2>
              <p className="text-muted" style={{ fontSize: 'var(--text-xs)', margin: 0 }}>
                You will be redirected to login
              </p>
            </div>
          </div>
          {!loading && (
            <button className="btn-icon" onClick={onClose}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="modal-body">
          {error && (
            <div className="card" style={{
              padding: 'var(--space-3) var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-4)',
              borderColor: 'var(--danger)',
              backgroundColor: 'var(--danger-soft)',
            }}>
              <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{error}</span>
            </div>
          )}

          <p className="text-body" style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-3)' }}>
            Are you sure you want to log out?
          </p>
          <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
            After logging out, you will need to log back in to continue using the service.
          </p>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Logging out...</>
            ) : (
              <><LogOut size={14} /> Logout</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
