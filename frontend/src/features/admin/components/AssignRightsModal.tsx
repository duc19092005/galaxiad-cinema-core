// src/features/admin/components/AssignRightsModal.tsx

import React, { useEffect, useState } from 'react';
import { X, UserPlus, Loader2, AlertCircle, Check, Search, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { transferRightsApi } from '../../../api/transferRightsApi';
import type { ManagerDto } from '../../../types/admin.types';
import { showSuccess, showError } from '../../../utils/ToastUtils';

interface AssignRightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemName: string;
  type: number;
  onSuccess: () => void;
}

const AssignRightsModal: React.FC<AssignRightsModalProps> = ({
  isOpen, onClose, itemId, itemName, type, onSuccess,
}) => {
  const { t } = useTranslation();
  const [managers, setManagers] = useState<ManagerDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) fetchManagers();
  }, [isOpen, type]);

  const fetchManagers = async () => {
    setLoading(true); setError(null);
    try {
      const res = await transferRightsApi.getManagers(type);
      setManagers(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load managers');
    } finally { setLoading(false); }
  };

  const handleAssign = async () => {
    if (!selectedManagerId) { showError(t('toast.selectManager')); return; }
    setAssigning(true);
    try {
      await transferRightsApi.executeTransfer({
        transferType: type, sourceUserId: null, targetUserId: selectedManagerId, itemId,
      });
      showSuccess(t('toast.assignRightsSuccess'));
      onSuccess();
      onClose();
    } catch (err: any) {
      showError(err.response?.data?.message || t('toast.assignRightsFailed'));
    } finally { setAssigning(false); }
  };

  const filteredManagers = managers.filter(m =>
    m.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const typeLabel = type === 1 ? 'Cinema' : type === 2 ? 'Theater' : 'Movie';

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={loading || assigning ? undefined : onClose}>
      <div className="modal-content" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #ff8a00, #ea580c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {t('Assign Manager')}
              </h2>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                {t('to')} {typeLabel}: <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{itemName}</span>
              </p>
            </div>
          </div>
          {!assigning && (
            <button onClick={onClose} className="btn-icon">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Search */}
        <div style={{ padding: '12px 24px 0' }}>
          <div className="relative">
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input"
              style={{ paddingLeft: 32 }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="modal-body">
          {loading ? (
            <div className="state-center py-12">
              <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Fetching managers...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', fontSize: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredManagers.length === 0 ? (
                <div className="state-center py-12 opacity-50">
                  <User size={28} />
                  <p style={{ fontSize: 12 }}>No managers found.</p>
                </div>
              ) : (
                filteredManagers.map((m) => (
                  <button
                    key={m.userId}
                    onClick={() => setSelectedManagerId(m.userId)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 12,
                      border: `1px solid ${selectedManagerId === m.userId ? 'var(--accent)' : 'var(--border-color)'}`,
                      background: selectedManagerId === m.userId ? 'rgba(255, 138, 0, 0.08)' : 'transparent',
                      cursor: 'pointer', textAlign: 'left', width: '100%',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => { if (selectedManagerId !== m.userId) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={e => { if (selectedManagerId !== m.userId) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: selectedManagerId === m.userId ? 'rgba(255, 138, 0, 0.2)' : 'rgba(255,255,255,0.05)',
                    }}>
                      <User size={14} style={{ color: selectedManagerId === m.userId ? 'var(--accent)' : 'var(--text-muted)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{m.userName}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.userEmail}</p>
                    </div>
                    {selectedManagerId === m.userId && (
                      <Check size={14} style={{ color: 'var(--accent)' }} />
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} disabled={assigning} className="btn btn-secondary">
            {t('Cancel')}
          </button>
          <button
            onClick={handleAssign}
            disabled={assigning || !selectedManagerId || loading}
            className="btn btn-primary"
          >
            {assigning ? (
              <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Assigning...</>
            ) : (
              <><UserPlus size={14} /> {t('Assign Manager')}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignRightsModal;
