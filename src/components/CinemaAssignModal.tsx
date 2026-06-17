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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 40, height: 40,
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'var(--accent-soft)',
            }}>
              <MapPin size={18} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 className="heading-md" style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Assign cinema</h2>
              <p className="text-muted" style={{ fontSize: 12, margin: '2px 0 0' }}>
                {currentUserEmail}
              </p>
            </div>
          </div>
          {!assigning && (
            <button className="btn-icon" onClick={onClose}><X size={16} /></button>
          )}
        </div>

        {/* Search */}
        <div style={{ padding: '0 24px', marginTop: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            transition: 'all 0.2s ease',
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 138, 0, 0.15)';
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search cinema name or address..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                all: 'unset',
                width: '100%',
                fontSize: '14px',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="modal-body">
          {loading ? (
            <div className="state-center" style={{ minHeight: '120px' }}>
              <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
              <span className="text-muted" style={{ fontSize: 13 }}>Loading cinemas...</span>
            </div>
          ) : error ? (
            <div className="card" style={{ padding: '12px 16px', borderColor: 'var(--danger)', backgroundColor: 'var(--danger-soft)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <span className="text-sm" style={{ color: 'var(--danger)' }}>{error}</span>
            </div>
          ) : (
            <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
              {filteredCinemas.length === 0 ? (
                <div className="state-center" style={{ minHeight: '100px', color: 'var(--text-secondary)' }}>No cinemas found.</div>
              ) : (
                filteredCinemas.map(cinema => {
                  const isSelected = selectedCinemaId === cinema.cinemaId;
                  return (
                    <button
                      key={cinema.cinemaId}
                      onClick={() => setSelectedCinemaId(cinema.cinemaId)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '14px 18px',
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                        backgroundColor: isSelected ? 'var(--accent-soft)' : 'rgba(255, 255, 255, 0.03)',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span className="text-body" style={{ fontWeight: 600, fontSize: '14px', color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>
                          {cinema.cinemaName}
                        </span>
                        {isSelected && (
                          <Check size={16} style={{ color: 'var(--accent)' }} />
                        )}
                      </div>
                      <span className="text-muted" style={{ fontSize: '12px', marginTop: '6px', lineHeight: 1.4 }}>
                        {cinema.cinemaLocation}
                      </span>
                    </button>
                  );
                })
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
