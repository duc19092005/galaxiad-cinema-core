import React, { useEffect, useState } from 'react';
import { X, Building2, MapPin, Phone, Film, Loader2, AlertCircle, Plus, Trash2, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { facilitiesApi, type Cinema, type Auditorium } from '../../../api/facilitiesApi';
import axios from 'axios';
import type { ApiErrorResponse } from '../../../types/auth.types';
import RoomDetailModal from './RoomDetailModal';
import CreateAuditoriumModal from './CreateAuditoriumModal';

interface CinemaDetailModalProps {
  cinemaId: string;
  isOpen: boolean;
  onClose: () => void;
}

const CinemaDetailModal: React.FC<CinemaDetailModalProps> = ({ cinemaId, isOpen, onClose }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [cinema, setCinema] = useState<Cinema | null>(null);
  const [auditoriums, setAuditoriums] = useState<Auditorium[]>([]);
  const [loading, setLoading] = useState(false);
  const [auditoriumsLoading, setAuditoriumsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditoriumsError, setAuditoriumsError] = useState<string | null>(null);

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isRoomDetailModalOpen, setIsRoomDetailModalOpen] = useState(false);
  const [isCreateAuditoriumModalOpen, setIsCreateAuditoriumModalOpen] = useState(false);

  const isDark = theme === 'dark';
  const isModern = theme === 'modern';

  useEffect(() => {
    if (isOpen && cinemaId) {
      fetchCinemaDetail();
      fetchCinemaAuditoriums();
    } else {
      setCinema(null);
      setAuditoriums([]);
      setError(null);
      setAuditoriumsError(null);
    }
  }, [isOpen, cinemaId]);

  const fetchCinemaDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await facilitiesApi.getCinemaDetail(cinemaId);
      setCinema(res.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as ApiErrorResponse;
        setError(data.message || 'Failed to load cinema information.');
      } else {
        setError('Unable to connect to server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCinemaAuditoriums = async () => {
    setAuditoriumsLoading(true);
    setAuditoriumsError(null);
    try {
      const res = await facilitiesApi.getAuditoriumsByCinema(cinemaId);
      if (res.isSuccess && res.data) {
        setAuditoriums(res.data);
      } else {
        setAuditoriumsError(res.message || 'Failed to load auditoriums.');
        setAuditoriums([]);
      }
    } catch (err) {
      console.error('Error fetching auditoriums:', err);
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as ApiErrorResponse;
        setAuditoriumsError(data.message || 'Failed to load auditoriums.');
      } else {
        setAuditoriumsError('Unable to connect to server.');
      }
      setAuditoriums([]);
    } finally {
      setAuditoriumsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          className={`relative w-full max-w-4xl max-h-[90vh] rounded-2xl border shadow-2xl transition-all flex flex-col ${
            isModern
              ? 'bg-[#0b1326]/95 backdrop-blur-2xl border-cinema-accent/15'
              : isDark
                ? 'bg-cinema-surface border-cinema-border/30'
                : 'bg-white border-gray-200'
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${
            isModern ? 'border-cinema-accent/15' : isDark ? 'border-cinema-border/30' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-soft)' }}>
                <Building2 size={20} style={{ color: 'var(--primary)' }} />
              </div>
              <h2 className="text-xl font-extrabold" style={{ color: isDark || isModern ? 'var(--text-primary)' : '#09090b' }}>
                {t('cinemaManagement.cinemaDetails')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" style={{ color: 'var(--primary)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Đang tải thông tin...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl border flex items-center mb-6" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
                <AlertCircle className="w-5 h-5 mr-3 shrink-0" style={{ color: '#ef4444' }} />
                <span className="text-sm font-medium" style={{ color: '#ef4444' }}>{error}</span>
              </div>
            )}

            {!loading && !error && cinema && (
              <div className="space-y-6">
                {/* Cinema Info Card */}
                <div
                  className="p-6 rounded-xl border"
                  style={{
                    background: isModern ? 'rgba(15,23,42,0.4)' : isDark ? 'var(--bg-elevated)' : '#f8fafc',
                    borderColor: isModern ? 'rgba(99,102,241,0.08)' : isDark ? 'var(--border-color)' : '#e2e8f0',
                  }}
                >
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                      <Building2 className="w-7 h-7 text-black" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold" style={{ color: isDark || isModern ? 'var(--text-primary)' : '#09090b' }}>
                        {cinema.cinemaName}
                      </h3>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1"
                        style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
                                          {t('cinemaManagement.active')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {cinema.cinemaDescription && (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {cinema.cinemaDescription}
                      </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)' }}>
                        <MapPin size={18} style={{ color: 'var(--primary)', marginTop: 2 }} />
                        <div>
                          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Địa chỉ</p>
                          <p className="text-sm font-semibold" style={{ color: isDark || isModern ? 'var(--text-primary)' : '#1e293b' }}>
                            {cinema.cinemaLocation}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)' }}>
                        <Phone size={18} style={{ color: 'var(--primary)', marginTop: 2 }} />
                        <div>
                          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Hotline</p>
                          <p className="text-sm font-semibold" style={{ color: isDark || isModern ? 'var(--text-primary)' : '#1e293b' }}>
                            {cinema.cinemaHotlineNumber}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl flex items-center gap-4" style={{
                      background: isModern ? 'rgba(255,138,0,0.06)' : isDark ? 'rgba(255,138,0,0.04)' : 'rgba(255,138,0,0.04)',
                      border: '1px solid rgba(255,138,0,0.12)',
                    }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,138,0,0.12)' }}>
                        <Film size={20} style={{ color: 'var(--primary)' }} />
                      </div>
                      <div>
                        <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Tổng số phòng chiếu</p>
                        <p className="text-xl font-extrabold" style={{ color: isDark || isModern ? 'var(--text-primary)' : '#09090b' }}>
                          {cinema.totalRooms || 0} phòng
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rooms List Section */}
                <div
                  className="rounded-xl border overflow-hidden"
                  style={{
                    background: isModern ? 'rgba(15,23,42,0.3)' : isDark ? 'var(--bg-elevated)' : '#f8fafc',
                    borderColor: isModern ? 'rgba(99,102,241,0.08)' : isDark ? 'var(--border-color)' : '#e2e8f0',
                  }}
                >
                  <div className={`flex items-center justify-between p-5 border-b ${
                    isModern ? 'border-cinema-accent/10' : isDark ? 'border-cinema-border/20' : 'border-gray-200'
                  }`}>
                    <h3 className="text-lg font-extrabold" style={{ color: isDark || isModern ? 'var(--text-primary)' : '#09090b' }}>
                                    {t('cinemaManagement.auditoriumList', { count: auditoriums.length })}
                    </h3>
                    <button
                      onClick={() => setIsCreateAuditoriumModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.97]"
                      style={{ background: 'var(--primary)', color: '#000' }}
                    >
                      <Plus className="w-4 h-4" />
                                    {t('cinemaManagement.addAuditorium')}
                    </button>
                  </div>

                  <div className="p-5">
                    {auditoriumsLoading && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)' }} />
                      </div>
                    )}

                    {auditoriumsError && (
                      <div className="p-4 rounded-xl border flex items-center mb-4" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
                        <AlertCircle className="w-5 h-5 mr-3 shrink-0" style={{ color: '#ef4444' }} />
                        <span className="text-sm font-medium" style={{ color: '#ef4444' }}>{auditoriumsError}</span>
                      </div>
                    )}

                    {!auditoriumsLoading && !auditoriumsError && (
                      <>
                        {auditoriums.length === 0 ? (
                          <div className="text-center py-12">
                            <Film className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>            {t('cinemaManagement.noAuditoriums')}</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {auditoriums.map((auditorium) => (
                              <div
                                key={auditorium.auditoriumId}
                                className="group p-5 rounded-2xl border transition-all duration-200"
                                style={{
                                  background: isModern ? 'rgba(15,23,42,0.3)' : isDark ? '#131316' : '#fff',
                                  borderColor: isModern ? 'rgba(99,102,241,0.08)' : isDark ? '#2e2e38' : '#e2e8f0',
                                }}
                                onMouseEnter={e => {
                                  if (isDark || isModern) {
                                    e.currentTarget.style.borderColor = 'rgba(255,138,0,0.2)';
                                    e.currentTarget.style.background = isModern ? 'rgba(15,23,42,0.5)' : '#1a1a20';
                                  }
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.borderColor = isModern ? 'rgba(99,102,241,0.08)' : isDark ? '#2e2e38' : '#e2e8f0';
                                  e.currentTarget.style.background = isModern ? 'rgba(15,23,42,0.3)' : isDark ? '#131316' : '#fff';
                                }}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                                      style={{ background: 'rgba(255,138,0,0.1)' }}>
                                      <Film size={22} style={{ color: 'var(--primary)' }} />
                                    </div>
                                    <div>
                                      <h4 className="text-base font-extrabold" style={{ color: isDark || isModern ? 'var(--text-primary)' : '#09090b' }}>
                                        {auditorium.auditoriumNumber}
                                      </h4>
                                      <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                                        {auditorium.totalSeats} Ghế
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap items-center justify-end gap-1 max-w-[100px]">
                                    {auditorium.formatInfos?.map((f: any, idx: number) => (
                                      <span key={idx} className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-tight"
                                        style={{
                                          background: isModern ? 'rgba(99,102,241,0.1)' : 'rgba(255,138,0,0.1)',
                                          color: isModern ? '#818cf8' : 'var(--primary)',
                                          border: `1px solid ${isModern ? 'rgba(99,102,241,0.15)' : 'rgba(255,138,0,0.15)'}`,
                                        }}>
                                        {f.formatName}
                                      </span>
                                    )) || <span className="text-[10px] opacity-20" style={{ color: 'var(--text-muted)' }}>N/A</span>}
                                  </div>
                                </div>

                                <div className="mb-3 p-3 rounded-xl" style={{
                                  background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
                                  border: `1px solid ${isModern ? 'rgba(99,102,241,0.06)' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'}`,
                                }}>
                                  <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>Rạp</p>
                                  <p className="text-xs font-bold truncate" style={{ color: isDark || isModern ? 'var(--text-primary)' : '#475569' }}>
                                    {auditorium.cinemaName}
                                  </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-1">
                                  <button
                                    onClick={() => {
                                      if (auditorium.auditoriumId) {
                                        setSelectedRoomId(auditorium.auditoriumId);
                                        setIsRoomDetailModalOpen(true);
                                      }
                                    }}
                                    disabled={!auditorium.auditoriumId}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                                    style={{
                                      background: isModern ? 'rgba(99,102,241,0.08)' : 'var(--bg-elevated)',
                                      color: 'var(--text-secondary)',
                                      border: `1px solid ${isModern ? 'rgba(99,102,241,0.12)' : 'var(--border-color)'}`,
                                    }}
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    Xem
                                  </button>
                                  <button
                                    className="p-2.5 rounded-xl transition-all border"
                                    style={{
                                      background: 'rgba(239,68,68,0.06)',
                                      color: '#ef4444',
                                      borderColor: 'rgba(239,68,68,0.12)',
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Cinema ID reference */}
                {cinema.cinemaId && (
                  <div className="p-3 rounded-xl"
                    style={{
                      background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                      border: '1px solid var(--border-color)',
                    }}>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Cinema ID</p>
                    <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{cinema.cinemaId}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`flex justify-end gap-3 p-6 border-t ${
            isModern ? 'border-cinema-accent/10' : isDark ? 'border-cinema-border/20' : 'border-gray-200'
          }`}>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: isDark ? 'var(--bg-elevated)' : '#f1f5f9',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
                        {t('cinemaManagement.close')}
            </button>
          </div>
        </div>
      </div>

      {selectedRoomId && (
        <RoomDetailModal
          roomId={selectedRoomId}
          cinemaId={cinemaId}
          isOpen={isRoomDetailModalOpen}
          onClose={() => {
            setIsRoomDetailModalOpen(false);
            setSelectedRoomId(null);
          }}
        />
      )}

      {cinema?.cinemaId && (
        <CreateAuditoriumModal
          cinemaId={cinema.cinemaId}
          isOpen={isCreateAuditoriumModalOpen}
          onClose={() => setIsCreateAuditoriumModalOpen(false)}
          onSuccess={async () => {
            await fetchCinemaAuditoriums();
            await fetchCinemaDetail();
          }}
        />
      )}
    </>
  );
};

export default CinemaDetailModal;
