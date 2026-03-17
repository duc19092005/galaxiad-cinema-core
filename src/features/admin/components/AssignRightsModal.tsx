import React, { useEffect, useState } from 'react';
import { X, UserPlus, Loader2, AlertCircle, Check, Search, User } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { transferRightsApi } from '../../../api/transferRightsApi';
import type { ManagerDto } from '../../../types/admin.types';
import toast from 'react-hot-toast';

interface AssignRightsModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemId: string;
    itemName: string;
    type: number; // 1: Facilities, 2: Theater, 3: Movie
    onSuccess: () => void;
}

const AssignRightsModal: React.FC<AssignRightsModalProps> = ({
    isOpen,
    onClose,
    itemId,
    itemName,
    type,
    onSuccess,
}) => {
    const { theme } = useTheme();
    const [managers, setManagers] = useState<ManagerDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedManagerId, setSelectedManagerId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchManagers();
        }
    }, [isOpen, type]);

    const fetchManagers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await transferRightsApi.getManagers(type);
            setManagers(res.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load managers');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedManagerId) {
            toast.error('Please select a manager');
            return;
        }
        setAssigning(true);
        try {
            await transferRightsApi.executeTransfer({
                transferType: type,
                sourceUserId: null, // As requested, null for individual assignment
                targetUserId: selectedManagerId,
                itemId: itemId
            });
            toast.success('Management rights assigned successfully');
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to assign management rights');
        } finally {
            setAssigning(false);
        }
    };

    const filteredManagers = managers.filter(m =>
        m.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const typeLabel = type === 1 ? 'Cinema' : type === 2 ? 'Theater' : 'Movie';

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
                className={`relative w-full max-w-lg rounded-xl border shadow-2xl transition-all flex flex-col max-h-[90vh] ${theme === 'dark'
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
                            ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                            : 'bg-indigo-600'
                            }`}>
                            <UserPlus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className={`text-xl font-black ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'
                                }`}>
                                Assign Manager
                            </h2>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-indigo-300' : 'text-gray-500'}`}>
                                to {typeLabel}: <span className="font-bold">{itemName}</span>
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
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${theme === 'dark'
                                ? 'bg-gray-800 border-gray-700 text-white'
                                : theme === 'modern'
                                    ? 'bg-white/5 border-white/10 text-white'
                                    : 'bg-gray-50 border-gray-200 text-gray-900'
                                }`}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-hidden flex flex-col">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                            <p className={theme === 'dark' || theme === 'modern' ? 'text-gray-300' : 'text-gray-600'}>Fetching managers...</p>
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
                        <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-2 custom-scrollbar">
                            {filteredManagers.length === 0 ? (
                                <div className="text-center py-12 opacity-50">No managers found.</div>
                            ) : (
                                filteredManagers.map((m) => (
                                    <button
                                        key={m.userId}
                                        onClick={() => setSelectedManagerId(m.userId)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${selectedManagerId === m.userId
                                            ? theme === 'modern'
                                                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                                                : 'bg-indigo-600 border-indigo-600 text-white'
                                            : theme === 'dark'
                                                ? 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-500'
                                                : theme === 'modern'
                                                    ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                            selectedManagerId === m.userId ? 'bg-white/20' : 'bg-gray-500/20'
                                        }`}>
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold truncate">{m.userName}</p>
                                            <p className={`text-[10px] truncate ${selectedManagerId === m.userId ? 'opacity-80' : 'opacity-50'}`}>
                                                {m.userEmail}
                                            </p>
                                        </div>
                                        {selectedManagerId === m.userId && <Check className="w-4 h-4 flex-shrink-0" />}
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
                        disabled={assigning || !selectedManagerId || loading}
                        className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${assigning || !selectedManagerId || loading
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                            } ${theme === 'modern'
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                            }`}
                    >
                        {assigning ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Assigning...
                            </>
                        ) : (
                            'Assign Manager'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignRightsModal;
