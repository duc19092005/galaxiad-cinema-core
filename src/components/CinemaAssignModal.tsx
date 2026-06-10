// src/components/CinemaAssignModal.tsx
import React, { useEffect, useState } from 'react';
import { X, MapPin, Loader2, AlertCircle, Check, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../api/adminApi';
import { facilitiesApi } from '../api/facilitiesApi';
import type { Cinema } from '../types/facilities.types';
import { showSuccess, showError } from '../utils/ToastUtils';

interface CinemaAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentUserEmail: string;
  onSuccess: () => void;
}

const CinemaAssignModal: React.FC<CinemaAssignModalProps> = ({
  isOpen, onClose, userId, currentUserEmail, onSuccess,
}) => {
  const { t } = useTranslation();
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { if (isOpen) fetchCinemas(); }, [isOpen]);

  const fetchCinemas = async () => {
    setLoading(true); setError(null);
    try {
      const res = await facilitiesApi.getCinemaList();
      setCinemas(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load cinemas');
    } finally { setLoading(false); }
  };

  const handleAssign = async () => {
    if (!selectedCinemaId) { showError(t('toast.selectCinema')); return; }
    setAssigning(true);
    try {
      await adminApi.assignTheaterManager(selectedCinemaId, userId);
      showSuccess(t('toast.assignManagerSuccess'));
      onSuccess(); onClose();
    } catch (err: any) {
      showError(err.response?.data?.message || t('toast.assignManagerFailed'));
    } finally { setAssigning(false); }
  };

  const filteredCinemas = cinemas.filter(c =>
    c.cinemaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cinemaLocation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              width: 40, height: 40,
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'var(--accent-soft)',
            }}>
              <MapPin size={18} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 className="heading-md" style={{ margin: 0 }}>Assign cinema</h2>
              <p className="text-muted" style={{ fontSize: 'var(--text-xs)', margin: 0 }}>
                {currentUserEmail}
              </p>
            </div>
          </div>
          {!assigning && (
            <button className="btn-icon" onClick={onClose}><X size={16} /></button>
          )}
        </div>

        {/* Search */}
        <div style={{ padding: '0 var(--space-6)', paddingTop: 'var(--space-3)' }}>
          <div className="input" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 0, paddingLeft: 'var(--space-3)' }}>
            <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search cinema name or address..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                all: 'unset',
                width: '100%',
                height: 34,
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="modal-body">
          {loading ? (
            <div className="state-center">
              <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
              <span>Loading cinemas...</span>
            </div>
          ) : error ? (
            <div className="card" style={{ padding: 'var(--space-3) var(--space-4)', borderColor: 'var(--danger)', backgroundColor: 'var(--danger-soft)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <span className="text-sm">{error}</span>
            </div>
          ) : (
            <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {filteredCinemas.length === 0 ? (
                <div className="state-center">No cinemas found.</div>
              ) : (
                filteredCinemas.map(cinema => (
                  <button
                    key={cinema.cinemaId}
                    onClick={() => setSelectedCinemaId(cinema.cinemaId)}
                    className="card card-hover"
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                      padding: 'var(--space-3) var(--space-4)',
                      width: '100%',
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: selectedCinemaId === cinema.cinemaId ? '1px solid var(--accent)' : undefined,
                      backgroundColor: selectedCinemaId === cinema.cinemaId ? 'var(--accent-soft)' : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span className="text-body" style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>
                        {cinema.cinemaName}
                      </span>
                      {selectedCinemaId === cinema.cinemaId && (
                        <Check size={14} style={{ color: 'var(--accent)' }} />
                      )}
                    </div>
                    <span className="text-muted" style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)' }}>
                      {cinema.cinemaLocation}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={assigning}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleAssign} disabled={assigning || !selectedCinemaId || loading}>
            {assigning ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Assigning...</> : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CinemaAssignModal;
