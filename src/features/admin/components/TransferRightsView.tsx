// src/features/admin/components/TransferRightsView.tsx
import React, { useState, useEffect } from 'react';
import {
    ArrowRight,
    Building2,
    Film,
    ShieldAlert,
    Search,
    ChevronRight,
    Loader2,
    Users,
    Info
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { transferRightsApi } from '../../../api/transferRightsApi';
import type { ManagerDto, ManagedItemDto } from '../../../types/admin.types';
import toast from 'react-hot-toast';

const TransferRightsView: React.FC = () => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    const [transferType, setTransferType] = useState<1 | 2 | 3>(1); // 1: Facilities, 2: Theater, 3: Movie
    const [managers, setManagers] = useState<ManagerDto[]>([]);
    const [sourceUserId, setSourceUserId] = useState<string>('');
    const [targetUserId, setTargetUserId] = useState<string>('');
    const [managedItems, setManagedItems] = useState<ManagedItemDto[]>([]);

    const [loadingItems, setLoadingItems] = useState(false);
    const [executing, setExecuting] = useState(false);

    // Fetch managers when type changes
    useEffect(() => {
        const fetchManagers = async () => {
            try {
                const res = await transferRightsApi.getManagers(transferType);
                setManagers(res.data || []);
                // Reset selections
                setSourceUserId('');
                setTargetUserId('');
                setManagedItems([]);
            } catch (error) {
                toast.error(t('Failed to load managers'));
            }
        };
        fetchManagers();
    }, [transferType, t]);

    // Fetch managed items when source user or type changes
    useEffect(() => {
        const fetchItems = async () => {
            setLoadingItems(true);
            try {
                // If sourceUserId is empty string, we fetch unmanaged items (pass undefined to API)
                const res = await transferRightsApi.getManagedItems(
                    transferType,
                    sourceUserId === 'unmanaged' ? undefined : (sourceUserId || undefined)
                );
                setManagedItems(res.data || []);
            } catch (error) {
                toast.error(t('Failed to load managed items'));
            } finally {
                setLoadingItems(false);
            }
        };

        // If sourceUserId is empty (not 'unmanaged' and not a real ID), clear items
        if (sourceUserId === '') {
            setManagedItems([]);
            return;
        }

        fetchItems();
    }, [sourceUserId, transferType, t]);

    const handleExecute = async (itemId: string, itemName: string) => {
        if (!targetUserId) {
            toast.error(t('Please select target manager'));
            return;
        }

        // sourceUserId can be 'unmanaged', which means null in the API
        const apiSourceUserId = sourceUserId === 'unmanaged' ? null : sourceUserId;

        if (apiSourceUserId === targetUserId) {
            toast.error(t('Source and target cannot be the same person'));
            return;
        }

        const confirmTransfer = window.confirm(t('Are you sure you want to transfer "{0}" to the new manager?', { 0: itemName }));
        if (!confirmTransfer) return;

        setExecuting(true);
        try {
            await transferRightsApi.executeTransfer({
                sourceUserId: apiSourceUserId,
                targetUserId,
                transferType,
                itemId
            });
            toast.success(t('Transferred "{0}" successfully', { 0: itemName }));

            // Refresh managed items for the source user to reflect the change
            const resItems = await transferRightsApi.getManagedItems(
                transferType,
                sourceUserId === 'unmanaged' ? undefined : (sourceUserId || undefined)
            );
            setManagedItems(resItems.data || []);
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('Transfer failed'));
        } finally {
            setExecuting(false);
        }
    };

    return (
        <div className="p-16 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Type Selector */}
            <div className="flex justify-center">
                <div className={`p-1 rounded-2xl flex gap-1 ${(theme === 'modern' || theme === 'dark') ? 'bg-[#0E0A20]/60 border border-white/5 shadow-2xl' : 'bg-gray-100 border border-gray-200'
                    }`}>
                    <button
                        onClick={() => setTransferType(1)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${transferType === 1
                            ? (theme === 'modern' || theme === 'dark') ? 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Building2 className="w-4 h-4" />
                        {t('Facilities (CSVC)')}
                    </button>
                    <button
                        onClick={() => setTransferType(2)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${transferType === 2
                            ? (theme === 'modern' || theme === 'dark') ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <ShieldAlert className="w-4 h-4" />
                        {t('Operation (Vận hành)')}
                    </button>
                    <button
                        onClick={() => setTransferType(3)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${transferType === 3
                            ? (theme === 'modern' || theme === 'dark') ? 'bg-pink-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.4)]' : 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Film className="w-4 h-4" />
                        {t('Movie (Phim)')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* 1. Source Selection */}
                <div className={`p-6 rounded-3xl border transition-all h-full ${(theme === 'modern' || theme === 'dark') ? 'bg-[#0E0A20]/40 border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-sm'
                    }`}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`p-2.5 rounded-xl ${(theme === 'modern' || theme === 'dark') ? 'bg-red-500/10' : 'bg-red-50'}`}>
                            <Users className={`w-5 h-5 ${(theme === 'modern' || theme === 'dark') ? 'text-red-400' : 'text-red-500'}`} />
                        </div>
                        <div>
                            <h3 className="font-black text-sm uppercase tracking-tight">{t('1. From Manager')}</h3>
                            <p className="text-[10px] text-gray-400">{t('Owner of assets')}</p>
                        </div>
                    </div>

                    <div className="relative">
                        <select
                            value={sourceUserId}
                            onChange={(e) => setSourceUserId(e.target.value)}
                            className={`w-full h-12 pl-3 pr-10 rounded-xl appearance-none outline-none text-xs font-bold transition-all ${(theme === 'modern' || theme === 'dark') ? 'bg-[#151225] border-white/5 text-white focus:border-cyan-500/50' : 'bg-gray-50 border-gray-200 focus:border-red-600/50'
                                } border`}
                        >
                            <option value="">{t('Select source...')}</option>
                            <option value="unmanaged" className="text-red-400 font-black">--- {t('Unmanaged Assets')} ---</option>
                            {managers.map(m => (
                                <option key={m.userId} value={m.userId}>{m.userName} ({m.userEmail})</option>
                            ))}
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 rotate-90" />
                    </div>
                </div>

                {/* 2. Target Selection */}
                <div className={`p-6 rounded-3xl border transition-all h-full ${(theme === 'modern' || theme === 'dark') ? 'bg-[#0E0A20]/40 border-white/5 shadow-2xl relative' : 'bg-white border-gray-100 shadow-sm relative'
                    }`}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`p-2.5 rounded-xl ${(theme === 'modern' || theme === 'dark') ? 'bg-cyan-500/10' : 'bg-green-50'}`}>
                            <ShieldAlert className={`w-5 h-5 ${(theme === 'modern' || theme === 'dark') ? 'text-cyan-400' : 'text-green-500'}`} />
                        </div>
                        <div>
                            <h3 className="font-black text-sm uppercase tracking-tight">{t('2. To Manager')}</h3>
                            <p className="text-[10px] text-gray-400">{t('New recipient')}</p>
                        </div>
                    </div>

                    <div className="relative">
                        <select
                            value={targetUserId}
                            onChange={(e) => setTargetUserId(e.target.value)}
                            className={`w-full h-12 pl-3 pr-10 rounded-xl appearance-none outline-none text-xs font-bold transition-all ${(theme === 'modern' || theme === 'dark') ? 'bg-[#151225] border-white/5 text-white focus:border-cyan-500/50' : 'bg-gray-50 border-gray-200 focus:border-red-600/50'
                                } border`}
                        >
                            <option value="">{t('Select recipient...')}</option>
                            {managers
                                .filter(m => m.userId !== sourceUserId)
                                .map(m => (
                                    <option key={m.userId} value={m.userId}>{m.userName} ({m.userEmail})</option>
                                ))}
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 rotate-90" />
                    </div>
                </div>

                {/* 3. Items Transfer List */}
                <div className={`p-6 rounded-3xl border transition-all lg:col-span-1 h-full ${(theme === 'modern' || theme === 'dark') ? 'bg-[#0E0A20]/40 border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-sm'
                    }`}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${(theme === 'modern' || theme === 'dark') ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                                <Search className={`w-5 h-5 ${(theme === 'modern' || theme === 'dark') ? 'text-indigo-400' : 'text-indigo-500'}`} />
                            </div>
                            <div>
                                <h3 className="font-black text-sm uppercase tracking-tight">{t('3. Assets')}</h3>
                                <p className="text-[10px] text-gray-400">{t('Transfer individual items')}</p>
                            </div>
                        </div>
                    </div>

                    <div className={`rounded-2xl overflow-hidden border ${(theme === 'modern' || theme === 'dark') ? 'bg-[#151225]/40 border-white/5' : 'bg-gray-50/50 border-gray-100'
                        }`}>
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2 space-y-2">
                            {loadingItems ? (
                                <div className="py-20 flex flex-col items-center justify-center opacity-40">
                                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                                    <p className="text-[10px] uppercase font-black tracking-widest leading-none">{t('Loading Assets...')}</p>
                                </div>
                            ) : managedItems.length > 0 ? (
                                managedItems.map(item => (
                                    <div key={item.itemId} className={`group p-4 flex items-center gap-4 rounded-2xl border transition-all duration-300 ${(theme === 'modern' || theme === 'dark')
                                        ? 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-indigo-500/30'
                                        : 'border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md hover:border-red-600/30'
                                        }`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${(theme === 'modern' || theme === 'dark') ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-red-50 text-red-600 border border-red-100'
                                            }`}>
                                            {transferType === 1 && <Building2 className="w-5 h-5" />}
                                            {transferType === 2 && <ShieldAlert className="w-5 h-5" />}
                                            {transferType === 3 && <Film className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-black truncate ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}`}>{item.itemName}</p>
                                            <p className="text-[10px] opacity-40 truncate mt-0.5 font-medium">{item.description || t('No description available')}</p>
                                        </div>
                                        <button
                                            onClick={() => handleExecute(item.itemId, item.itemName)}
                                            disabled={!targetUserId || executing}
                                            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${!targetUserId || executing
                                                ? 'opacity-10 cursor-not-allowed'
                                                : (theme === 'modern' || theme === 'dark')
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95'
                                                    : 'bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-700 active:scale-95'
                                                }`}
                                        >
                                            {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center opacity-20">
                                    <Info className="w-12 h-12 mb-4" />
                                    <p className="text-[10px] uppercase font-black tracking-widest">{sourceUserId ? t('No items found') : t('Select source manager')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Warning Section */}
            <div className={`mt-4 p-4 rounded-2xl flex items-start gap-3 border ${(theme === 'modern' || theme === 'dark') ? 'bg-amber-500/5 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-100 text-amber-800'
                }`}>
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-60" />
                <div className="text-[10px] leading-relaxed opacity-80 font-medium italic">
                    {t('Tip: Select both Source and Target managers first, then click the arrow on each item to transfer it individually.')}
                </div>
            </div>
        </div>
    );
};

export default TransferRightsView;
