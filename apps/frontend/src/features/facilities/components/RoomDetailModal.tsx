import React, { useEffect, useState } from 'react';
import { X, Film, Users, Loader2, AlertCircle, Pencil } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { facilitiesApi, type Room } from '../../../api/facilitiesApi';
import axios from 'axios';
import type { ApiErrorResponse } from '../../../types/auth.types';
import { useTranslation } from 'react-i18next';
import CreateAuditoriumModal from './CreateAuditoriumModal';

interface RoomDetailModalProps {
  roomId: string;
  cinemaId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const RoomDetailModal: React.FC<RoomDetailModalProps> = ({ roomId, cinemaId: propCinemaId, isOpen, onClose }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use prop cinemaId, or try to extract from room API data as fallback
  const [roomCinemaId, setRoomCinemaId] = useState<string | null>(null);
  const effectiveCinemaId = propCinemaId || roomCinemaId;

  // Edit auditorium modal state
  const [isEditAuditoriumModalOpen, setIsEditAuditoriumModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && roomId) {
      fetchRoomDetail();
    } else {
      setRoom(null);
      setError(null);
    }
  }, [isOpen, roomId]);

  const fetchRoomDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await facilitiesApi.getAuditoriumDetail(roomId);
      const data = res.data as any;
      setRoom(data);
      // Try to extract cinemaId from response as fallback
      if (data?.cinemaId) {
        setRoomCinemaId(data.cinemaId);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as ApiErrorResponse;
        setError(data.message || 'Cannot load room information.');
      } else {
        setError('Cannot connect to server.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const isModern = theme === 'modern';

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="absolute inset-0 backdrop-blur-sm"
          style={{ background: 'var(--bg-overlay)' }}
          onClick={onClose}
        />

        {/* Modal */}
        <div
          className={`relative w-full max-w-lg rounded-xl border shadow-2xl transition-all overflow-hidden ${
            isDark
              ? 'bg-[#131316] border-[#2e2e38]'
              : isModern
                ? 'bg-[#0b1326]/95 backdrop-blur-2xl border-[rgba(99,102,241,0.15)]'
                : 'bg-white border-gray-200'
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-5 border-b ${
            isDark ? 'border-[#2e2e38]' : isModern ? 'border-[rgba(99,102,241,0.1)]' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-soft)' }}>
                <Film className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              </div>
              <h2 className={`text-lg font-bold ${isDark || isModern ? 'text-white' : 'text-gray-900'}`}>
                {t('roomDetail.title')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'hover:bg-[#2e2e38] text-gray-400'
                  : isModern
                    ? 'hover:bg-[rgba(99,102,241,0.1)] text-gray-400'
                    : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" style={{ color: 'var(--primary)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {t('common.loading')}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className={`p-4 rounded-lg border ${
                isDark || isModern
                  ? 'bg-red-900/20 border-red-500/30'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <span className={`text-sm font-medium ${isDark || isModern ? 'text-red-200' : 'text-red-800'}`}>
                    {error}
                  </span>
                </div>
              </div>
            )}

            {!loading && !error && room && (
              <div className="space-y-5">
                {/* Room Number */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                    <Film className="w-7 h-7 text-black" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold" style={{ color: isDark || isModern ? 'var(--text-primary)' : '#09090b' }}>
                      {room.auditoriumNumber || t('roomDetail.room')}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {(room as any).cinemaName || t('roomDetail.room')}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl border ${
                    isDark
                      ? 'bg-[#1a1a20] border-[#2e2e38]'
                      : isModern
                        ? 'bg-[rgba(15,23,42,0.3)] border-[rgba(99,102,241,0.08)]'
                        : 'bg-gray-50 border-gray-200'
                  }`}>
                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                      {t('roomDetail.totalSeats')}
                    </p>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                      <span className="text-2xl font-extrabold" style={{ color: isDark || isModern ? 'var(--text-primary)' : '#09090b' }}>
                        {room.totalSeats || 0}
                      </span>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${
                    isDark
                      ? 'bg-[#1a1a20] border-[#2e2e38]'
                      : isModern
                        ? 'bg-[rgba(15,23,42,0.3)] border-[rgba(99,102,241,0.08)]'
                        : 'bg-gray-50 border-gray-200'
                  }`}>
                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                      {t('roomDetail.format')}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {room.formatInfos?.length ? room.formatInfos.map((f: any, i: number) => (
                        <span key={i} className="px-2.5 py-1 rounded text-xs font-bold" style={{
                          background: isModern ? 'rgba(99,102,241,0.1)' : 'rgba(255,138,0,0.1)',
                          color: isModern ? '#818cf8' : 'var(--primary)',
                          border: `1px solid ${isModern ? 'rgba(99,102,241,0.15)' : 'rgba(255,138,0,0.15)'}`,
                        }}>
                          {f.formatName}
                        </span>
                      )) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('roomDetail.noFormat')}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Room ID reference */}
                {room.auditoriumId && (
                  <div className={`p-3 rounded-lg border ${
                    isDark
                      ? 'bg-[#1a1a20] border-[#2e2e38]'
                      : isModern
                        ? 'bg-[rgba(15,23,42,0.3)] border-[rgba(99,102,241,0.08)]'
                        : 'bg-gray-50 border-gray-200'
                  }`}>
                    <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{t('roomDetail.roomId')}</p>
                    <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{room.auditoriumId}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`flex justify-between gap-3 px-6 py-4 border-t ${
            isDark ? 'border-[#2e2e38]' : isModern ? 'border-[rgba(99,102,241,0.1)]' : 'border-gray-200'
          }`}>
            <button
              onClick={() => setIsEditAuditoriumModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all active:scale-[0.97]"
              style={{
                background: 'var(--primary)',
                color: '#000',
              }}
            >
              <Pencil className="w-4 h-4" />
              {t('roomDetail.editRoom')}
            </button>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                isDark
                  ? 'bg-[#2e2e38] hover:bg-[#3e3e4e] text-gray-300'
                  : isModern
                    ? 'bg-[rgba(30,41,59,0.5)] hover:bg-[rgba(30,41,59,0.7)] text-gray-300 backdrop-blur-sm border border-[rgba(99,102,241,0.1)]'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Auditorium Modal */}
      {isEditAuditoriumModalOpen && effectiveCinemaId && (
        <CreateAuditoriumModal
          cinemaId={effectiveCinemaId}
          isOpen={isEditAuditoriumModalOpen}
          onClose={() => {
            setIsEditAuditoriumModalOpen(false);
            fetchRoomDetail(); // Refresh after edit
          }}
          onSuccess={() => {
            setIsEditAuditoriumModalOpen(false);
            fetchRoomDetail();
          }}
          editAuditoriumId={roomId}
        />
      )}
    </>
  );
};

export default RoomDetailModal;
