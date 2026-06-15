// src/features/facilities/components/AuditoriumListView.tsx
// Lists rooms (auditoriums) for a cinema with create/view/edit/delete

import React, { useEffect, useState } from 'react';
import {
  Plus, Search, Eye, Loader2, AlertCircle, Monitor,
  Trash2, Grid3x3, Pencil,
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { facilitiesApi, type Auditorium } from '../../../api/facilitiesApi';
import { showSuccess, showError } from '../../../utils/ToastUtils';
import RoomDetailModal from './RoomDetailModal';
import CreateAuditoriumModal from './CreateAuditoriumModal';

interface AuditoriumListViewProps {
  cinemaId: string;
  cinemaName: string;
}

const AuditoriumListView: React.FC<AuditoriumListViewProps> = ({ cinemaId, cinemaName }) => {
  const { theme } = useTheme();
  const [auditoriums, setAuditoriums] = useState<Auditorium[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Detail modal
  const [selectedAuditoriumId, setSelectedAuditoriumId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Create modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Edit modal
  const [editAuditoriumId, setEditAuditoriumId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (cinemaId) fetchAuditoriums();
  }, [cinemaId]);

  const fetchAuditoriums = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await facilitiesApi.getAuditoriumsByCinema(cinemaId);
      setAuditoriums(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load auditoriums');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (auditoriumId: string) => {
    if (!window.confirm('Are you sure you want to delete this auditorium?')) return;
    setDeletingId(auditoriumId);
    try {
      await facilitiesApi.updateAuditorium(auditoriumId, { isDeleted: true } as any);
      showSuccess('Auditorium deleted');
      fetchAuditoriums();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to delete auditorium');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setEditAuditoriumId(null);
    fetchAuditoriums();
  };

  const filtered = auditoriums.filter(a =>
    a.auditoriumNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.formatInfos?.some(f => f.formatName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isDark = theme === 'dark';
  const isModern = theme === 'modern';

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Auditoriums — <span style={{ color: 'var(--accent)' }}>{cinemaName}</span>
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {auditoriums.length} room{auditoriums.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="input" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 36 }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ all: 'unset', width: 140, fontSize: 13, color: 'var(--text-primary)' }}
            />
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
            style={{ height: 36, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Add Room</span>
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="state-center" style={{ minHeight: 160 }}>
          <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="card" style={{ padding: '16px 20px', borderColor: 'var(--danger)', backgroundColor: 'var(--danger-soft)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertCircle size={16} style={{ color: 'var(--danger)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{error}</span>
          <button className="btn btn-secondary" style={{ marginLeft: 'auto', height: 30, fontSize: 12 }} onClick={fetchAuditoriums}>
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="state-center" style={{ minHeight: 160 }}>
          <Monitor size={40} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
            {searchTerm ? 'No rooms match your search.' : 'No auditoriums yet. Add your first room!'}
          </p>
        </div>
      )}

      {/* Auditorium Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(aud => (
            <div
              key={aud.auditoriumId}
              className={`card card-hover ${
                isDark
                  ? 'bg-gray-900 border-gray-800'
                  : isModern
                    ? 'bg-[#0f172b]/90 backdrop-blur-xl border-indigo-500/15'
                    : 'bg-white border-gray-200'
              }`}
              style={{
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 36, height: 36,
                    borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--accent-soft)',
                  }}>
                    <Monitor size={16} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                      {aud.auditoriumNumber}
                    </span>
                    <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                      {aud.formatInfos?.map(f => (
                        <span key={f.formatId} style={{
                          fontSize: 10,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: 'var(--accent-soft)',
                          color: 'var(--accent)',
                          fontWeight: 600,
                        }}>
                          {f.formatName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Grid3x3 size={12} />
                  {aud.totalSeats} seats
                </span>
              </div>

              {/* Actions: 3 buttons - View, Edit, Delete */}
              <div style={{
                display: 'flex', gap: 6, marginTop: 4,
                borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                paddingTop: 8,
              }}>
                {/* View */}
                <button
                  onClick={() => {
                    setSelectedAuditoriumId(aud.auditoriumId);
                    setIsDetailModalOpen(true);
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1, height: 30, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                >
                  <Eye size={12} />
                  View
                </button>
                {/* Edit Seat Layout */}
                <button
                  onClick={() => {
                    setEditAuditoriumId(aud.auditoriumId);
                    setIsEditModalOpen(true);
                  }}
                  style={{
                    flex: 1, height: 30, fontSize: 11,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    background: 'var(--accent-soft)',
                    color: 'var(--accent)',
                    border: '1px solid var(--accent-soft)',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  <Pencil size={12} />
                  Edit
                </button>
                {/* Delete */}
                <button
                  onClick={() => handleDelete(aud.auditoriumId)}
                  disabled={deletingId === aud.auditoriumId}
                  className="btn"
                  style={{
                    flex: 1, height: 30, fontSize: 11,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    background: 'var(--danger-soft)',
                    color: 'var(--danger)',
                    border: '1px solid var(--danger-soft)',
                    borderRadius: 8,
                    cursor: deletingId === aud.auditoriumId ? 'not-allowed' : 'pointer',
                  }}
                >
                  {deletingId === aud.auditoriumId ? (
                    <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Trash2 size={12} />
                  )}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Room Detail Modal */}
      {isDetailModalOpen && selectedAuditoriumId && (
        <RoomDetailModal
          roomId={selectedAuditoriumId}
          cinemaId={cinemaId}
          isOpen={isDetailModalOpen}
          onClose={() => { setIsDetailModalOpen(false); setSelectedAuditoriumId(null); }}
        />
      )}

      {/* Create Auditorium Modal */}
      {isCreateModalOpen && (
        <CreateAuditoriumModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => { setIsCreateModalOpen(false); fetchAuditoriums(); }}
          cinemaId={cinemaId}
        />
      )}

      {/* Edit Auditorium Modal */}
      {isEditModalOpen && editAuditoriumId && (
        <CreateAuditoriumModal
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setEditAuditoriumId(null); }}
          onSuccess={handleEditSuccess}
          cinemaId={cinemaId}
          editAuditoriumId={editAuditoriumId}
        />
      )}
    </div>
  );
};

export default AuditoriumListView;
