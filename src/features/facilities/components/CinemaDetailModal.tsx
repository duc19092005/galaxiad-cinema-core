import React, { useEffect, useState } from 'react';
import { X, Building2, MapPin, Phone, Film, Loader2, AlertCircle, Plus, Edit, Trash2, Eye } from 'lucide-react';
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
  const [cinema, setCinema] = useState<Cinema | null>(null);
  const [auditoriums, setAuditoriums] = useState<Auditorium[]>([]);
  const [loading, setLoading] = useState(false);
  const [auditoriumsLoading, setAuditoriumsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditoriumsError, setAuditoriumsError] = useState<string | null>(null);

  // Room detail modal state
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isRoomDetailModalOpen, setIsRoomDetailModalOpen] = useState(false);

  // Create auditorium modal state
  const [isCreateAuditoriumModalOpen, setIsCreateAuditoriumModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && cinemaId) {
      fetchCinemaDetail();
      fetchCinemaAuditoriums();
    } else {
      // Reset state when modal closes
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
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          className={`relative w-full max-w-4xl max-h-[90vh] rounded-xl border shadow-2xl transition-all flex flex-col ${theme === 'dark'
            ? 'bg-gray-900 border-gray-800'
            : 'bg-white border-gray-200'
            }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
            }`}>
            <h2 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900 dark:text-white modern:text-white'
              }`}>
              Cinema Details
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                ? 'hover:bg-gray-800 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
                }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto mb-4" />
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    Loading information...
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className={`p-4 rounded-lg border flex items-center mb-6 ${theme === 'dark'
                ? 'bg-red-900/40 border-red-500/50 text-red-100'
                : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                <AlertCircle className="w-5 h-5 mr-3 shrink-0 text-red-500" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {!loading && !error && cinema && (
              <div className="space-y-6">
                {/* Cinema Info Card */}
                <div className={`p-6 rounded-lg border ${theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-gray-50 border-gray-200'
                  }`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className={`text-2xl font-black mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900 dark:text-white modern:text-white'
                        }`}>
                        {cinema.cinemaName}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${theme === 'dark'
                        ? 'bg-green-900/40 text-green-400 border-green-700'
                        : 'bg-green-50 text-green-700 border-green-300'
                        }`}>
                        Active
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    {cinema.cinemaDescription && (
                      <div>
                        <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                          Description
                        </p>
                        <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700 dark:text-gray-300 modern:text-gray-200'}>
                          {cinema.cinemaDescription}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <MapPin className={`w-5 h-5 mt-0.5 ${theme === 'dark' ? 'text-red-500' : 'text-red-600'
                          }`} />
                        <div>
                          <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                            Location
                          </p>
                          <p className={theme === 'dark' ? 'text-white' : 'text-gray-900 dark:text-white modern:text-white'}>
                            {cinema.cinemaLocation}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Phone className={`w-5 h-5 mt-0.5 ${theme === 'dark' ? 'text-red-500' : 'text-red-600'
                          }`} />
                        <div>
                          <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                            Hotline
                          </p>
                          <p className={theme === 'dark' ? 'text-white' : 'text-gray-900 dark:text-white modern:text-white'}>
                            {cinema.cinemaHotlineNumber}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'
                      }`}>
                      <div className="flex items-center gap-3">
                        <Film className={`w-5 h-5 ${theme === 'dark' ? 'text-red-500' : 'text-red-600'
                          }`} />
                        <div>
                          <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                            Total Auditoriums
                          </p>
                          <p className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900 dark:text-white modern:text-white'
                            }`}>
                            {cinema.totalRooms} rooms
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rooms List Section */}
                <div className={`rounded-lg border ${theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-gray-50 border-gray-200'
                  }`}>
                  <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                    <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900 dark:text-white modern:text-white'
                      }`}>
                      Auditorium List ({auditoriums.length})
                    </h3>
                    <button
                      onClick={() => setIsCreateAuditoriumModalOpen(true)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${theme === 'dark'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                    >
                      <Plus className="w-4 h-4" />
                      Add Auditorium
                    </button>
                  </div>

                  <div className="p-6">
                    {auditoriumsLoading && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                      </div>
                    )}

                    {auditoriumsError && (
                      <div className={`p-4 rounded-lg border flex items-center mb-4 ${theme === 'dark'
                        ? 'bg-red-900/40 border-red-500/50 text-red-100'
                        : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                        <AlertCircle className="w-5 h-5 mr-3 shrink-0 text-red-500" />
                        <span className="text-sm font-medium">{auditoriumsError}</span>
                      </div>
                    )}

                    {!auditoriumsLoading && !auditoriumsError && (
                      <>
                        {auditoriums.length === 0 ? (
                          <div className="text-center py-12">
                            <Film className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                              }`} />
                            <p className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>
                              No auditoriums available
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {auditoriums.map((auditorium) => (
                              <div
                                key={auditorium.auditoriumId}
                                className={`p-4 rounded-lg border transition-all ${theme === 'dark'
                                  ? 'bg-gray-900 border-gray-700 hover:border-red-600'
                                  : 'bg-white border-gray-200 hover:border-red-600'
                                  }`}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                                      <Film className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                      <h4 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900 dark:text-white modern:text-white'
                                        }`}>
                                        {auditorium.auditoriumNumber}
                                      </h4>
                                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                        {auditorium.totalSeats} ghế
                                      </p>
                                    </div>
                                  </div>
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${theme === 'dark'
                                    ? 'bg-blue-900/40 text-blue-400 border-blue-700'
                                    : 'bg-blue-50 text-blue-700 border-blue-300'
                                    }`}>
                                    {auditorium.formatInfos?.map((f: any) => f.formatName).join(', ') || 'N/A'}
                                  </span>
                                </div>

                                <div className={`mb-3 p-2 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                                  }`}>
                                  <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    Cinema
                                  </p>
                                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900 dark:text-white modern:text-white'
                                    }`}>
                                    {auditorium.cinemaName}
                                  </p>
                                </div>

                                {/* Actions */}
                                <div className={`flex gap-2 pt-3 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                                  }`}>
                                  <button
                                    onClick={() => {
                                      if (auditorium.auditoriumId) {
                                        setSelectedRoomId(auditorium.auditoriumId);
                                        setIsRoomDetailModalOpen(true);
                                      }
                                    }}
                                    disabled={!auditorium.auditoriumId}
                                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs transition-colors ${!auditorium.auditoriumId
                                      ? 'opacity-50 cursor-not-allowed'
                                      : ''
                                      } ${theme === 'dark'
                                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:text-gray-300 modern:text-gray-200'
                                      }`}
                                  >
                                    <Eye className="w-3 h-3" />
                                    View
                                  </button>
                                  <button 
                                    onClick={() => {
                                      if (auditorium.auditoriumId) {
                                        setSelectedRoomId(auditorium.auditoriumId);
                                        setIsRoomDetailModalOpen(true);
                                      }
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs transition-colors ${theme === 'dark'
                                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:text-gray-300 modern:text-gray-200'
                                      }`}
                                  >
                                    <Edit className="w-3 h-3" />
                                    Edit
                                  </button>
                                  <button className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs transition-colors border ${theme === 'dark'
                                    ? 'bg-red-900/40 hover:bg-red-900/60 text-red-400 border-red-800'
                                    : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-300'
                                    }`}>
                                    <Trash2 className="w-3 h-3" />
                                    Delete
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

                {/* Cinema ID (for reference) */}
                {cinema.cinemaId && (
                  <div className={`p-3 rounded-lg border ${theme === 'dark'
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-gray-50 border-gray-200'
                    }`}>
                    <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                      Cinema ID
                    </p>
                    <p className={`text-xs font-mono ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                      {cinema.cinemaId}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`flex justify-end gap-3 p-6 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
            }`}>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:text-gray-300 modern:text-gray-200'
                }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Room Detail Modal */}
      {selectedRoomId && (
        <RoomDetailModal
          roomId={selectedRoomId}
          isOpen={isRoomDetailModalOpen}
          onClose={() => {
            setIsRoomDetailModalOpen(false);
            setSelectedRoomId(null);
          }}
        />
      )}

      {/* Create Auditorium Modal */}
      {cinema?.cinemaId && (
        <CreateAuditoriumModal
          cinemaId={cinema.cinemaId}
          isOpen={isCreateAuditoriumModalOpen}
          onClose={() => setIsCreateAuditoriumModalOpen(false)}
          onSuccess={async () => {
            // Refresh danh sách phòng sau khi tạo thành công
            await fetchCinemaAuditoriums();
            await fetchCinemaDetail();
          }}
        />
      )}
    </>
  );
};

export default CinemaDetailModal;
