// src/components/CinemaAssignModal.tsx
import React, { useEffect, useState } from 'react';
import { X, MapPin, Loader2, AlertCircle, Check, Search } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { adminApi } from '../api/adminApi';
import { facilitiesApi } from '../api/facilitiesApi';
import type { Cinema } from '../types/facilities.types';
import toast from 'react-hot-toast';

interface CinemaAssignModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    currentUserEmail: string;
    onSuccess: () => void;
}

const CinemaAssignModal: React.FC<CinemaAssignModalProps> = ({
    isOpen,
    onClose,
    userId,
    currentUserEmail,
    onSuccess,
}) => {
    const { theme } = useTheme();
    const [cinemas, setCinemas] = useState<Cinema[]>([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCinemaId, setSelectedCinemaId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchCinemas();
        }
    }, [isOpen]);

    const fetchCinemas = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await facilitiesApi.getCinemaList();
            setCinemas(res.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load cinemas');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedCinemaId) {
            toast.error('Please select a cinema');
            return;
        }
        setAssigning(true);
        try {
            await adminApi.assignTheaterManager(selectedCinemaId, userId);
            toast.success('Theater manager assigned successfully');
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to assign theater manager');
        } finally {
            setAssigning(false);
        }
    };

    const filteredCinemas = cinemas.filter(c => 
        c.cinemaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cinemaLocation.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`relative w-full max-w-lg rounded-xl border shadow-2xl transition-all ${theme === 'dark'
                    ? 'bg-gray-900 border-gray-800'
                    : theme === 'modern'
                        ? 'bg-[#15102B]/95 backdrop-blur-2xl border-indigo-500/30'
                        : 'bg-white border-gray-200'
                    }`}
            >
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/20 shadow-sm' : 'border-gray-200'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${theme === 'modern'
                            ? 'bg-gradient-to-br from-pink-500 to-rose-600'
                            : 'bg-pink-600'
                            }`}>
                            <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className={`text-xl font-black ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'
                                }`}>
                                Assign Cinema
                            </h2>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-indigo-300' : 'text-gray-500'}`}>
                                {currentUserEmail}
                            </p>
                        </div>
                    </div>
                    {!assigning && (
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                                ? 'hover:bg-gray-800 text-gray-400'
                                : theme === 'modern'
                                    ? 'hover:bg-white/10 text-white'
                                    : 'hover:bg-gray-100 text-gray-600'
                                }`}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Search */}
                <div className="px-6 pt-4">
                    <div className="relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' || theme === 'modern' ? 'text-gray-500' : 'text-gray-400'}`} />
                        <input
                            type="text"
                            placeholder="Search cinema name or address..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all ${theme === 'dark'
                                ? 'bg-gray-800 border-gray-700 text-white'
                                : theme === 'modern'
                                    ? 'bg-white/5 border-white/10 text-white'
                                    : 'bg-gray-50 border-gray-200 text-gray-900'
                                }`}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                            <p className={theme === 'dark' || theme === 'modern' ? 'text-gray-300' : 'text-gray-600'}>Fetching cinemas...</p>
                        </div>
                    ) : error ? (
                        <div className={`p-4 rounded-lg border flex items-center ${theme === 'dark' || theme === 'modern'
                            ? 'bg-red-900/20 border-red-500/50 text-red-100'
                            : 'bg-red-50 border-red-200 text-red-800'
                            }`}>
                            <AlertCircle className="w-5 h-5 mr-3 shrink-0 text-red-500" />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredCinemas.length === 0 ? (
                                <div className="text-center py-8 opacity-50">No cinemas found.</div>
                            ) : (
                                filteredCinemas.map((cinema) => (
                                    <button
                                        key={cinema.cinemaId}
                                        onClick={() => setSelectedCinemaId(cinema.cinemaId)}
                                        className={`flex flex-col items-start px-4 py-3 rounded-xl border transition-all ${selectedCinemaId === cinema.cinemaId
                                            ? theme === 'modern'
                                                ? 'bg-pink-500/20 border-pink-500 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.2)]'
                                                : 'bg-pink-600 border-pink-600 text-white'
                                            : theme === 'dark'
                                                ? 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-500'
                                                : theme === 'modern'
                                                    ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className="font-bold">{cinema.cinemaName}</span>
                                            {selectedCinemaId === cinema.cinemaId && <Check className="w-4 h-4" />}
                                        </div>
                                        <span className={`text-xs mt-1 ${selectedCinemaId === cinema.cinemaId ? 'text-pink-100/70' : 'text-gray-500'}`}>
                                            {cinema.cinemaLocation}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`flex justify-end gap-3 p-6 border-t ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/20' : 'border-gray-200'
                    }`}>
                    <button
                        onClick={onClose}
                        disabled={assigning}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${assigning
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                            } ${theme === 'dark'
                                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                : theme === 'modern'
                                    ? 'bg-white/5 hover:bg-white/10 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={assigning || !selectedCinemaId || loading}
                        className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${assigning || !selectedCinemaId || loading
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                            } ${theme === 'modern'
                                ? 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white shadow-lg shadow-pink-500/25'
                                : 'bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-600/20'
                            }`}
                    >
                        {assigning ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Assigning...</span>
                            </>
                        ) : (
                            <>
                                <MapPin className="w-4 h-4" />
                                <span>Assign Cinema</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CinemaAssignModal;
