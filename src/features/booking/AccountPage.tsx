import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    User, Mail, Phone, Calendar, IdCard, 
    History, ChevronLeft, Loader2, AlertCircle,
    Ticket, MapPin, Clock, CheckCircle2, Timer,
    ExternalLink, Lock, Edit2, Check, X,
    Sun, Moon, Sparkles, ChevronDown
} from 'lucide-react';
import { bookingApi } from '../../api/bookingApi';
import { authApi } from '../../api/authApi';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import ChangePasswordModal from './components/ChangePasswordModal';
import type { UserAccountInfo, BookingHistoryItem } from '../../types/booking.types';
import type { UpdateProfileRequest } from '../../types/auth.types';
import { useTheme } from '../../contexts/ThemeContext';

const AccountPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { theme, setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');
    
    const [accountInfo, setAccountInfo] = useState<UserAccountInfo | null>(null);
    const [history, setHistory] = useState<BookingHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    // Theme dropdown state
    const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
    const themeDropdownRef = useRef<HTMLDivElement>(null);

    // Inline Edit States
    const [editingField, setEditingField] = useState<string | null>(null);
    const [tempValue, setTempValue] = useState<string>('');
    const [updating, setUpdating] = useState(false);

    const fetchAllData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [accountRes, historyRes] = await Promise.all([
                bookingApi.getAccountInfo(),
                bookingApi.getBookingHistory()
            ]);
            setAccountInfo(accountRes.data);
            setHistory(historyRes.data || []);
        } catch (err: any) {
            const msg = err.response?.data?.message || t('account.failedToLoad');
            setError(msg);
            if (err.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [navigate]);

    // Handle outside click for theme dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
                setIsThemeDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleStartEdit = (field: string, initialValue: string) => {
        setEditingField(field);
        if (field === 'dateOfBirth' && initialValue && initialValue !== 'N/A') {
            // Robust parsing of YYYY-MM-DD or ISO string
            const datePart = initialValue.split('T')[0];
            const parts = datePart.split('-');
            if (parts.length === 3) {
                const year = parts[0];
                const month = parts[1];
                const day = parts[2];
                setTempValue(`${day}/${month}/${year}`);
            } else {
                setTempValue('');
            }
        } else {
            setTempValue(initialValue || '');
        }
    };

    const handleCancelEdit = () => {
        setEditingField(null);
        setTempValue('');
    };

    const handleSaveEdit = async (field: keyof UpdateProfileRequest) => {
        if (!accountInfo) return;
        
        // 1. Validation Logic
        if (field === 'phoneNumber') {
            if (tempValue.length !== 10 || !/^\d+$/.test(tempValue)) {
                toast.error(t('validation.phoneLength'));
                return;
            }
        }
        if (field === 'identityCode') {
            if (tempValue.length !== 12 || !/^\d+$/.test(tempValue)) {
                toast.error(t('validation.idLength'));
                return;
            }
        }
        if (field === 'userName') {
            if (/[^a-zA-Z0-9\sÀ-ỹ]/.test(tempValue)) {
                toast.error(t('validation.nameSpecialChar'));
                return;
            }
        }
        if (field === 'dateOfBirth') {
            if (!tempValue) {
                toast.error(t('validation.dobRequired'));
                return;
            }
            // Parse DD/MM/YYYY
            const parts = tempValue.split('/');
            if (parts.length !== 3) {
                toast.error(t('validation.dobInvalidFormat') || "Định dạng ngày không hợp lệ (DD/MM/YYYY)");
                return;
            }
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            const birth = new Date(year, month, day);

            if (isNaN(birth.getTime()) || birth.getDate() !== day || birth.getMonth() !== month) {
                toast.error(t('validation.dobInvalidDate') || "Ngày tháng không hợp lệ");
                return;
            }

            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
            
            if (age < 16 || age > 80) {
                toast.error(t('validation.ageLimit'));
                return;
            }
        }

        // 2. Only send if changed
        const originalValue = field === 'dateOfBirth' 
            ? accountInfo.dateOfBirth?.split('T')[0] 
            : accountInfo[field as keyof UserAccountInfo];
            
        if (tempValue === originalValue) {
            handleCancelEdit();
            return;
        }

        setUpdating(true);
        try {
            let finalValue = tempValue;
            if (field === 'dateOfBirth') {
                const [d, m, y] = tempValue.split('/');
                const day = d.padStart(2, '0');
                const month = m.padStart(2, '0');
                const year = y.padStart(4, '0');
                // Construct string manually to avoid timezone shift
                finalValue = `${year}-${month}-${day}T00:00:00`;
            }
            const updatePayload: UpdateProfileRequest = {
                [field]: finalValue
            };
            await authApi.updateProfile(updatePayload);
            toast.success(t('account.updateSuccess'));
            await fetchAllData(); 
            handleCancelEdit();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data?.errors?.[0] || t('account.updateFailed');
            toast.error(msg);
        } finally {
            setUpdating(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Booked': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'Pending': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'Canceled': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    const getAiringStatusIcon = (status: string) => {
        switch (status) {
            case 'Upcoming': return <Timer className="w-3 h-3" />;
            case 'Airing': return <PlayCircle className="w-3 h-3 animate-pulse" />;
            case 'Finished': return <CheckCircle2 className="w-3 h-3" />;
            default: return null;
        }
    };

    const PlayCircle = ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
        </svg>
    );

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-black text-white' : theme === 'modern' ? 'bg-[#0D081D] text-white' : 'bg-gray-50 text-gray-900'}`}>
                <Loader2 className="w-12 h-12 animate-spin text-red-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${theme === 'dark' ? 'bg-black text-white' : theme === 'modern' ? 'bg-[#0D081D] text-white' : 'bg-gray-50 text-gray-900'}`}>
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <p className="text-xl font-bold mb-4">{error}</p>
                <button onClick={() => navigate('/home')} className="px-6 py-2 bg-red-600 text-white rounded-lg">{t('common.goHome')}</button>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            theme === 'dark' ? 'bg-black text-white' : 
            theme === 'modern' ? 'bg-gradient-to-br from-[#0D081D] via-[#050A14] to-[#12081C] text-white' : 
            'bg-gray-50 text-gray-900'
        }`}>
            {/* Header */}
            <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b h-16 flex items-center justify-between px-6 transition-all ${
                theme === 'dark' ? 'bg-black/80 border-gray-800' : 
                theme === 'modern' ? 'bg-[#0E0A20]/90 border-indigo-500/30' : 
                'bg-white/80 border-gray-200 shadow-sm'
            }`}>
                <div className="flex items-center">
                    <button 
                        onClick={() => navigate('/home')} 
                        className={`p-2 mr-4 rounded-lg transition-colors ${
                            theme === 'dark' ? 'hover:bg-gray-800 text-white' : 
                            theme === 'modern' ? 'hover:bg-indigo-500/20 text-white' : 
                            'hover:bg-gray-100 text-gray-700'
                        }`}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h2 className="font-black">{t('account.myAccount')}</h2>
                </div>

                <div className="flex items-center gap-4">
                    <LanguageSwitcher />
                    
                    {/* Theme Dropdown */}
                    <div className="relative" ref={themeDropdownRef}>
                        <button 
                            onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)} 
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                                theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 
                                theme === 'modern' ? 'hover:bg-indigo-800/40 text-white font-medium' : 
                                'hover:bg-gray-100 text-gray-700'
                            }`}
                        >
                            {theme === 'dark' ? <Moon className="w-5 h-5" /> : theme === 'modern' ? <Sparkles className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                            <span className="hidden sm:inline-block text-sm font-medium">
                                {theme === 'dark' ? 'Dark' : theme === 'modern' ? 'Modern' : 'Light'}
                            </span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isThemeDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isThemeDropdownOpen && (
                            <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
                                theme === 'dark' ? 'bg-gray-900 border border-gray-700' : 
                                theme === 'modern' ? 'bg-[#0E0A20]/95 border border-indigo-500/30 backdrop-blur-2xl' : 
                                'bg-white border border-gray-200'
                            }`}>
                                {(['light', 'dark', 'modern'] as const).map((tValue) => (
                                    <button 
                                        key={tValue} 
                                        onClick={() => { setTheme(tValue); setIsThemeDropdownOpen(false); }} 
                                        className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${
                                            theme === tValue 
                                            ? (theme === 'dark' ? 'bg-gray-800 text-white' : theme === 'modern' ? 'bg-indigo-500/20 text-white' : 'bg-gray-100 text-gray-900')
                                            : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : theme === 'modern' ? 'text-white hover:bg-indigo-500/10' : 'text-gray-700 hover:bg-gray-100')
                                        }`}
                                    >
                                        {tValue === 'light' ? <Sun className="w-4 h-4" /> : tValue === 'dark' ? <Moon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                        <span className="capitalize">{tValue}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="pt-24 pb-12 container mx-auto px-6 max-w-5xl">
                {/* User Hero */}
                <div className={`p-8 rounded-3xl mb-8 flex flex-col md:flex-row items-center gap-8 border transition-all ${
                    theme === 'modern' ? 'bg-indigo-600 shadow-indigo-500/20 border-indigo-400/30' : 
                    theme === 'dark' ? 'bg-gray-900 border-gray-800' : 
                    'bg-white border-gray-200 shadow-xl'
                }`}>
                    <div className={`shrink-0 w-24 h-24 rounded-2xl flex items-center justify-center shadow-2xl ${
                        theme === 'modern' ? 'bg-white/20 backdrop-blur-md' : 'bg-red-600'
                    }`}>
                        <User className="w-12 h-12 text-white" />
                    </div>
                    
                    <div className="text-center md:text-left flex-1">
                        {editingField === 'userName' ? (
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    autoFocus
                                    className={`text-3xl font-black bg-white/20 border border-white/40 rounded-lg px-3 py-1 outline-none text-white w-full max-md:max-w-xs ${updating ? 'opacity-50' : ''}`}
                                    value={tempValue}
                                    onChange={(e) => setTempValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveEdit('userName');
                                        if (e.key === 'Escape') handleCancelEdit();
                                    }}
                                    disabled={updating}
                                />
                                <button onClick={() => handleSaveEdit('userName')} className="p-2 bg-green-500 rounded-lg shrink-0" disabled={updating}>
                                    {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 text-white" />}
                                </button>
                                <button onClick={handleCancelEdit} className="p-2 bg-red-500 rounded-lg shrink-0" disabled={updating}>
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        ) : (
                            <div className="group flex items-center gap-3 justify-center md:justify-start">
                                <h1 className="text-3xl font-black mb-1">{accountInfo?.userName}</h1>
                                <button 
                                    onClick={() => handleStartEdit('userName', accountInfo?.userName || '')}
                                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all flex items-center gap-1.5"
                                >
                                    <Edit2 className="w-4 h-4 text-white/90" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">{t('common.edit')}</span>
                                </button>
                            </div>
                        )}
                        <p className="opacity-60 flex items-center justify-center md:justify-start gap-2">
                            <Mail className="w-4 h-4" /> {accountInfo?.email}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8">
                    <button 
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border transition-all ${
                            activeTab === 'profile' 
                            ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20' 
                            : theme === 'dark' ? 'bg-gray-900 border-gray-800 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-red-600 transition-colors'
                        }`}
                    >
                        <User className="w-5 h-5" /> {t('account.profileInfo')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border transition-all ${
                            activeTab === 'history' 
                            ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20' 
                            : theme === 'dark' ? 'bg-gray-900 border-gray-800 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-red-600 transition-colors'
                        }`}
                    >
                        <History className="w-5 h-5" /> {t('account.bookingHistory')}
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {activeTab === 'profile' ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ProfileCard icon={<Mail className="w-5 h-5" />} label={t('account.email')} value={accountInfo?.email} theme={theme} />
                                <EditableProfileCard 
                                    icon={<Phone className="w-5 h-5" />} 
                                    label={t('account.phone')} 
                                    value={accountInfo?.phoneNumber || ''} 
                                    field="phoneNumber"
                                    isEditing={editingField === 'phoneNumber'}
                                    tempValue={tempValue}
                                    onChange={setTempValue}
                                    onSave={() => handleSaveEdit('phoneNumber')}
                                    onCancel={handleCancelEdit}
                                    onStart={() => handleStartEdit('phoneNumber', accountInfo?.phoneNumber || '')}
                                    updating={updating}
                                    theme={theme}
                                    t={t}
                                />
                                <EditableProfileCard 
                                    icon={<IdCard className="w-5 h-5" />} 
                                    label={t('account.identityCode')} 
                                    value={accountInfo?.identityCode || ''} 
                                    field="identityCode"
                                    isEditing={editingField === 'identityCode'}
                                    tempValue={tempValue}
                                    onChange={setTempValue}
                                    onSave={() => handleSaveEdit('identityCode')}
                                    onCancel={handleCancelEdit}
                                    onStart={() => handleStartEdit('identityCode', accountInfo?.identityCode || '')}
                                    updating={updating}
                                    theme={theme}
                                    t={t}
                                />
                                <EditableProfileCard 
                                    icon={<Calendar className="w-5 h-5" />} 
                                    label={t('account.dob')} 
                                    value={accountInfo?.dateOfBirth ? new Date(accountInfo.dateOfBirth).toLocaleDateString('vi-VN') : 'N/A'} 
                                    field="dateOfBirth"
                                    type="date"
                                    isEditing={editingField === 'dateOfBirth'}
                                    tempValue={tempValue}
                                    onChange={setTempValue}
                                    onSave={() => handleSaveEdit('dateOfBirth')}
                                    onCancel={handleCancelEdit}
                                    onStart={() => handleStartEdit('dateOfBirth', accountInfo?.dateOfBirth?.split('T')[0] || '')}
                                    updating={updating}
                                    theme={theme}
                                    t={t}
                                />
                            </div>
                            
                            <div className="flex justify-center md:justify-start">
                                <button 
                                    onClick={() => setIsPasswordModalOpen(true)}
                                    className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 transition-all hover:-translate-y-1 active:scale-95 shadow-xl ${
                                        theme === 'modern' ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-red-500/20' :
                                        theme === 'dark' ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 shadow-xl shadow-black/50' :
                                        'bg-white border-2 border-red-600 text-red-600 hover:bg-red-50 shadow-xl shadow-red-600/5'
                                    }`}
                                >
                                    <Lock className="w-5 h-5" />
                                    {t('account.changePassword')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                            {history.length === 0 ? (
                                <div className={`p-12 text-center rounded-3xl border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                                    <Ticket className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="opacity-40 font-bold">{t('account.noBookings')}</p>
                                </div>
                            ) : (
                                history.map((item) => (
                                    <div key={item.orderId} className={`group p-6 rounded-3xl border transition-all hover:-translate-y-1 ${
                                        theme === 'dark' ? 'bg-gray-900 border-gray-800' : 
                                        theme === 'modern' ? 'bg-white/5 border-indigo-500/20 backdrop-blur-md' :
                                        'bg-white border-gray-200 shadow-lg'
                                    }`}>
                                        <div className="flex flex-col md:flex-row gap-6">
                                            <div className="w-full md:w-32 h-44 shrink-0 rounded-2xl overflow-hidden shadow-xl border border-white/10">
                                                <img 
                                                    src={item.movieImageUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500'} 
                                                    alt={item.movieName} 
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" 
                                                />
                                            </div>

                                            <div className="flex-1 space-y-4">
                                                <div className="flex flex-wrap items-start justify-between gap-4">
                                                    <div>
                                                        <h3 className="text-xl font-black mb-1">{item.movieName}</h3>
                                                        <div className="flex flex-wrap items-center gap-3 text-sm opacity-60">
                                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.cinemaName}</span>
                                                            <span className="flex items-center gap-1"><IdCard className="w-3 h-3" /> {item.auditoriumNumber}</span>
                                                        </div>
                                                    </div>
                                                    <div className={`px-4 py-1.5 rounded-full text-xs font-black border uppercase tracking-wider ${getStatusColor(item.orderStatus)}`}>
                                                        {item.orderStatus}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] uppercase font-bold opacity-40">{t('booking.bookingDate')}</p>
                                                        <p className="text-sm font-bold flex items-center gap-2"><Clock className="w-3 h-3 text-red-600" /> {formatDate(item.orderDate)}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] uppercase font-bold opacity-40">{t('booking.showtime')}</p>
                                                        <p className="text-sm font-bold flex items-center gap-2"><Calendar className="w-3 h-3 text-red-600" /> {formatDate(item.startTime)}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] uppercase font-bold opacity-40">{t('booking.seats')}</p>
                                                        <p className="text-sm font-black text-red-600">{item.seats.join(', ')}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] uppercase font-bold opacity-40">{t('booking.amount')}</p>
                                                        <p className="text-lg font-black text-red-600">{item.totalPrice.toLocaleString('vi-VN')}đ</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-dashed border-white/10 flex flex-wrap items-center justify-between gap-4">
                                           <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg ${
                                               item.movieAiringStatus === 'Airing' ? 'text-green-500 bg-green-500/10' :
                                               item.movieAiringStatus === 'Finished' ? 'text-blue-500 bg-blue-500/10' :
                                               'text-yellow-500 bg-yellow-500/10'
                                           }`}>
                                               {getAiringStatusIcon(item.movieAiringStatus)}
                                               {item.movieAiringStatus}
                                           </div>
                                           <button className="text-xs font-bold flex items-center gap-1 hover:text-red-500 transition-colors uppercase tracking-widest opacity-60">
                                               {t('common.viewDetails')} <ExternalLink className="w-3 h-3" />
                                           </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </main>

            <ChangePasswordModal 
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />
        </div>
    );
};

const ProfileCard = ({ icon, label, value, theme }: any) => (
    <div className={`p-6 rounded-3xl border transition-all ${
        theme === 'dark' ? 'bg-gray-900 border-gray-800' : 
        theme === 'modern' ? 'bg-white/5 border-indigo-500/20 shadow-xl' : 
        'bg-white border-gray-200 shadow-lg'
    }`}>
        <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center text-red-600">
                {icon}
            </div>
            <span className="text-xs font-black uppercase tracking-widest opacity-40">{label}</span>
        </div>
        <p className="text-lg font-bold">{value || 'N/A'}</p>
    </div>
);

const EditableProfileCard = ({ icon, label, value, field, type = 'text', isEditing, tempValue, onChange, onSave, onCancel, onStart, updating, theme, t }: any) => (
    <div className={`p-6 rounded-3xl border transition-all ${
        isEditing ? 'ring-2 ring-indigo-500' : ''
    } ${
        theme === 'dark' ? 'bg-gray-900 border-gray-800' : 
        theme === 'modern' ? 'bg-white/5 border-indigo-500/20 shadow-xl' : 
        'bg-white border-gray-200 shadow-lg'
    }`}>
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center text-red-600">
                    {icon}
                </div>
                <span className="text-xs font-black uppercase tracking-widest opacity-40">{label}</span>
            </div>
            {!isEditing && (
                <button onClick={onStart} className="p-2 bg-gray-500/5 hover:bg-gray-500/10 rounded-lg transition-all flex items-center gap-1.5">
                    <Edit2 className="w-4 h-4 opacity-70" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{t('common.edit')}</span>
                </button>
            )}
        </div>
        
        {isEditing ? (
            <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2">
                    <input
                        type={field === 'dateOfBirth' ? 'text' : type}
                        autoFocus
                        placeholder={field === 'dateOfBirth' ? 'DD/MM/YYYY' : ''}
                        className={`flex-1 bg-transparent border-b-2 font-bold text-lg outline-none pb-1 ${
                            theme === 'light' ? 'border-gray-300 focus:border-red-600 text-gray-900' : 'border-white/20 focus:border-cyan-400 text-white'
                        } ${updating ? 'opacity-50' : ''}`}
                        value={tempValue}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') onSave();
                            if (e.key === 'Escape') onCancel();
                        }}
                        disabled={updating}
                    />
                    <button 
                        onClick={onSave} 
                        className={`p-2 rounded-lg text-white ${theme === 'modern' ? 'bg-cyan-600' : 'bg-green-600'} ${updating ? 'opacity-50' : ''}`}
                        disabled={updating}
                    >
                        {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-white" />}
                    </button>
                    <button onClick={onCancel} className="p-2 bg-gray-500/20 rounded-lg text-white" disabled={updating}>
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>
                {field === 'dateOfBirth' && (
                    <p className="text-[10px] font-extrabold tracking-widest opacity-80 text-red-400 animate-pulse">
                        {t('account.dobFormatNote')}
                    </p>
                )}
            </div>
        ) : (
            <div className="space-y-1">
                <p className="text-lg font-bold truncate">{value || 'N/A'}</p>
                {field === 'dateOfBirth' && (
                    <p className="text-[10px] font-extrabold tracking-widest opacity-80 text-indigo-400">
                        {t('account.dobFormatNote')}
                    </p>
                )}
            </div>
        )}
    </div>
);


export default AccountPage;
