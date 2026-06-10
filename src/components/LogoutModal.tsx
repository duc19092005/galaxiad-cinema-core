// src/components/LogoutModal.tsx

import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Loader2, X } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  error?: string | null;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose, onConfirm, loading, error }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={loading ? undefined : onClose}>
      <div className="modal-content" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {t('Confirm Logout')}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                {t('Are you sure you want to logout?')}
              </p>
            </div>
          </div>
          {!loading && (
            <button onClick={onClose} className="btn-icon">
              <X size={18} />
            </button>
          )}
        </div>

        {error && (
          <div style={{
            margin: '0 24px', padding: '10px 14px', borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--danger)', fontSize: 12,
          }}>
            {error}
          </div>
        )}

        <div className="modal-footer">
          <button onClick={onClose} disabled={loading} className="btn btn-secondary">
            {t('Cancel')}
          </button>
          <button onClick={onConfirm} disabled={loading} className="btn btn-danger flex items-center gap-2">
            {loading ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                {t('Logging out...')}
              </>
            ) : (
              t('Logout')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
