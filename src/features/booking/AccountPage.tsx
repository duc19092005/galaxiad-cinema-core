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
import { showSuccess, showError } from '../../utils/ToastUtils';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import ChangePasswordModal from './components/ChangePasswordModal';
import type { UserAccountInfo, BookingHistoryItem } from '../../types/booking.types';
import type { UpdateProfileRequest } from '../../types/auth.types';

const AccountPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');
    
    const [accountInfo, setAccountInfo] = useState<UserAccountInfo | null>(null);
    const [history, setHistory] = useState<BookingHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    // Theme state
    const { theme, setTheme } = useTheme();
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
            const datePart = initialValue.split('T')[0];
            const parts = datePart.split('-');
            if (parts.length === 3) {
                setTempValue(`${parts[2]}/${parts[1]}/${parts[0]}`);
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
        
        if (field === 'phoneNumber') {
            if (tempValue.length !== 10 || !/^\d+$/.test(tempValue)) {
                showError(t('validation.phoneLength'));
                return;
            }
        }
        if (field === 'identityCode') {
            if (tempValue.length !== 12 || !/^\d+$/.test(tempValue)) {
                showError(t('validation.idLength'));
                return;
            }
        }
        if (field === 'userName') {
            if (/[^a-zA-Z0-9\sÀ-ỹ]/.test(tempValue)) {
                showError(t('validation.nameSpecialChar'));
                return;
            }
        }
        if (field === 'dateOfBirth') {
            if (!tempValue) {
                showError(t('validation.dobRequired'));
                return;
            }
            const parts = tempValue.split('/');
            if (parts.length !== 3) {
                showError(t('validation.dobInvalidFormat') || "Invalid date format (DD/MM/YYYY)");
                return;
            }
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            const birth = new Date(year, month, day);

            if (isNaN(birth.getTime()) || birth.getDate() !== day || birth.getMonth() !== month) {
                showError(t('validation.dobInvalidDate') || "Invalid date");
                return;
            }

            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
            
            if (age < 16 || age > 80) {
                showError(t('validation.ageLimit'));
                return;
            }
        }

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
                finalValue = `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`;
            }
            const updatePayload: UpdateProfileRequest = {
                [field]: finalValue
            };
            await authApi.updateProfile(updatePayload);
            showSuccess(t('account.updateSuccess'));
            await fetchAllData(); 
            handleCancelEdit();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data?.errors?.[0] || t('account.updateFailed');
            showError(msg);
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

    const getStatusColor = (status: string): React.CSSProperties => {
        switch (status) {
            case 'Booked': return { color: 'var(--success)', backgroundColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)' };
            case 'Pending': return { color: 'var(--warning)', backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)' };
            case 'Canceled': return { color: 'var(--danger)', backgroundColor: 'rgba(255,180,171,0.08)', borderColor: 'rgba(255,180,171,0.2)' };
            default: return { color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' };
        }
    };

    const getAiringStatusIcon = (status: string) => {
        switch (status) {
            case 'Upcoming': return <Timer size={14} />;
            case 'Airing': return (
                <svg style={{ width: 14, height: 14, animation: 'pulse 2s infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
                </svg>
            );
            case 'Finished': return <CheckCircle2 size={14} />;
            default: return null;
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={48} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                <AlertCircle size={64} style={{ color: 'var(--danger)', marginBottom: '16px' }} />
                <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>{error}</p>
                <button onClick={() => navigate('/home')} className="btn-primary cta-glow">{t('common.goHome')}</button>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
            {/* Header */}
            <header style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
                height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 24px',
                backgroundColor: 'var(--bg-surface)',
                backdropFilter: 'blur(24px)',
                borderBottom: '1px solid var(--border-color)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button 
                        onClick={() => navigate('/home')} 
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', width: 40, height: 40, color: 'var(--text-primary)', cursor: 'pointer', marginRight: '16px' }}
                        className="interactive"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <h2 style={{ fontWeight: 800, fontSize: 20 }}>{t('account.myAccount')}</h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <LanguageSwitcher />
                    
                    {/* Theme Dropdown */}
                    <div style={{ position: 'relative' }} ref={themeDropdownRef}>
                        <button 
                            onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)} 
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: 14 }}
                            className="interactive"
                        >
                            {theme === 'dark' ? <Moon size={18} /> : theme === 'modern' ? <Sparkles size={18} /> : <Sun size={18} />}
                            <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{theme}</span>
                            <ChevronDown size={16} style={{ transform: isThemeDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s ease' }} />
                        </button>

                        {isThemeDropdownOpen && (
                            <div style={{
                                position: 'absolute', right: 0, marginTop: '8px', width: 180,
                                borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-elevated)', boxShadow: 'var(--shadow-xl)',
                                overflow: 'hidden', zIndex: 100,
                            }}>
                                {(['light', 'dark', 'modern'] as const).map((tValue) => (
                                    <button 
                                        key={tValue} 
                                        onClick={() => { setTheme(tValue); setIsThemeDropdownOpen(false); }} 
                                        style={{
                                            width: '100%', textAlign: 'left', padding: '12px 16px', fontSize: 14,
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            cursor: 'pointer', border: 'none',
                                            backgroundColor: theme === tValue ? 'var(--bg-surface)' : 'transparent',
                                            color: theme === tValue ? 'var(--accent)' : 'var(--text-secondary)',
                                            transition: 'all 0.2s ease',
                                            fontWeight: theme === tValue ? 600 : 400,
                                        }}
                                    >
                                        {tValue === 'light' ? <Sun size={16} /> : tValue === 'dark' ? <Moon size={16} /> : <Sparkles size={16} />}
                                        <span style={{ textTransform: 'capitalize' }}>{tValue}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main style={{ paddingTop: 88, paddingBottom: '48px', maxWidth: 960, margin: '0 auto', paddingLeft: '24px', paddingRight: '24px' }}>
                {/* User Hero */}
                <div style={{
                    padding: '32px', borderRadius: 'var(--radius-xl)', marginBottom: '32px',
                    display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap',
                    backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-lg)',
                }}>
                    <div style={{
                        width: 96, height: 96, borderRadius: 'var(--radius-lg)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, var(--accent), var(--accent))',
                        boxShadow: '0 8px 32px rgba(255,138,0,0.3)',
                    }}>
                        <User size={48} style={{ color: 'black' }} />
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 200 }}>
                        {editingField === 'userName' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <input
                                    autoFocus
                                    style={{
                                        fontSize: 28, fontWeight: 800,
                                        backgroundColor: 'var(--bg-surface)', border: '1px solid var(--accent)',
                                        borderRadius: 'var(--radius-md)', padding: '8px 16px', outline: 'none',
                                        color: 'var(--text-primary)', width: '100%', maxWidth: 300,
                                        opacity: updating ? 0.5 : 1,
                                    }}
                                    value={tempValue}
                                    onChange={(e) => setTempValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveEdit('userName');
                                        if (e.key === 'Escape') handleCancelEdit();
                                    }}
                                    disabled={updating}
                                />
                                <button onClick={() => handleSaveEdit('userName')} style={{ padding: 8, backgroundColor: 'var(--success)', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }} disabled={updating}>
                                    {updating ? <Loader2 size={18} style={{ color: 'white', animation: 'spin 1s linear infinite' }} /> : <Check size={18} style={{ color: 'white' }} />}
                                </button>
                                <button onClick={handleCancelEdit} style={{ padding: 8, backgroundColor: 'var(--danger)', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }} disabled={updating}>
                                    <X size={18} style={{ color: 'white' }} />
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>{accountInfo?.userName}</h1>
                                <button 
                                    onClick={() => handleStartEdit('userName', accountInfo?.userName || '')}
                                    className="glass-card interactive"
                                    style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                >
                                    <Edit2 size={14} /> {t('common.edit')}
                                </button>
                            </div>
                        )}
                        <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: 14, margin: '4px 0 0' }}>
                            <Mail size={16} style={{ color: 'var(--accent)' }} /> {accountInfo?.email}
                        </p>
                        {accountInfo?.rewardPoints !== undefined && (
                            <p style={{ color: 'var(--primary, #ff8a00)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: 14, fontWeight: 'bold', margin: '6px 0 0' }}>
                                <Sparkles size={16} /> {accountInfo.rewardPoints} points
                            </p>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                    <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={20} />} label={t('account.profileInfo')} />
                    <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={20} />} label={t('account.bookingHistory')} />
                </div>

                {/* Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {activeTab === 'profile' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                                <ProfileCard icon={<Mail size={20} />} label={t('account.email')} value={accountInfo?.email} />
                                <EditableProfileCard 
                                    icon={<Phone size={20} />} 
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
                                />
                                <EditableProfileCard 
                                    icon={<IdCard size={20} />} 
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
                                />
                                <EditableProfileCard 
                                    icon={<Calendar size={20} />} 
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
                                />
                            </div>
                            
                            <div>
                                <button 
                                    onClick={() => setIsPasswordModalOpen(true)}
                                    className="glass-card interactive"
                                    style={{
                                        padding: '16px 32px', borderRadius: 'var(--radius-md)',
                                        fontWeight: 800, textTransform: 'uppercase', fontSize: 13,
                                        letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '12px',
                                        cursor: 'pointer', border: '1px solid var(--border-color)',
                                        background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)',
                                        boxShadow: 'var(--shadow-md)',
                                    }}
                                >
                                    <Lock size={20} style={{ color: 'var(--accent)' }} />
                                    {t('account.changePassword')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {history.length === 0 ? (
                                <div style={{
                                    padding: '48px', textAlign: 'center', borderRadius: 'var(--radius-xl)',
                                    backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
                                }}>
                                    <Ticket size={48} style={{ margin: '0 auto 16px', opacity: 0.2, color: 'var(--text-secondary)' }} />
                                    <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{t('account.noBookings')}</p>
                                </div>
                            ) : (
                                history.map((item) => (
                                    <div key={item.orderId} style={{
                                        padding: '24px', borderRadius: 'var(--radius-xl)',
                                        backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
                                        boxShadow: 'var(--shadow-md)', transition: 'all 0.3s ease',
                                    }} className="interactive">
                                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                            <div style={{ width: 128, height: 176, flexShrink: 0, borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                                                <img 
                                                    src={item.movieImageUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500'} 
                                                    alt={item.movieName} 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                />
                                            </div>

                                            <div style={{ flex: 1, minWidth: 250, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                                                    <div>
                                                        <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 'var(--space-4)' }}>{item.movieName}</h3>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} style={{ color: 'var(--accent)' }} /> {item.cinemaName}</span>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IdCard size={14} style={{ color: 'var(--accent)' }} /> {item.auditoriumNumber}</span>
                                                        </div>
                                                    </div>
                                                    <div style={{ padding: '4px 16px', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', ...getStatusColor(item.orderStatus) }}>
                                                        {item.orderStatus}
                                                    </div>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                                                    <div>
                                                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>{t('booking.bookingDate')}</p>
                                                        <p style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} style={{ color: 'var(--accent)' }} /> {formatDate(item.orderDate)}</p>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>{t('booking.showtime')}</p>
                                                        <p style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} style={{ color: 'var(--accent)' }} /> {formatDate(item.startTime)}</p>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>{t('booking.seats')}</p>
                                                        <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent)' }}>{item.seats.join(', ')}</p>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>{t('booking.amount')}</p>
                                                        <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>{item.totalPrice.toLocaleString('vi-VN')}đ</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border-color)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                                {getAiringStatusIcon(item.movieAiringStatus)}
                                                {item.movieAiringStatus}
                                            </div>
                                            <button style={{ fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                                {t('common.viewDetails')} <ExternalLink size={14} />
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

// ===== Sub-components =====

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        style={{
            flex: 1, padding: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            borderRadius: 'var(--radius-lg)', cursor: 'pointer', border: '1px solid var(--border-color)',
            fontWeight: 700, fontSize: 15, transition: 'all 0.3s ease',
            backgroundColor: active ? 'var(--accent)' : 'var(--bg-elevated)',
            color: active ? 'black' : 'var(--text-secondary)',
            boxShadow: active ? '0 4px 16px rgba(255,138,0,0.3)' : 'none',
        }}
    >
        {icon}
        {label}
    </button>
);

const ProfileCard: React.FC<{ icon: React.ReactNode; label: string; value?: string }> = ({ icon, label, value }) => (
    <div style={{
        padding: '24px', borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-md)',
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,138,0,0.1)', color: 'var(--accent)' }}>
                {icon}
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>{label}</span>
        </div>
        <p style={{ fontSize: 18, fontWeight: 700 }}>{value || 'N/A'}</p>
    </div>
);

const EditableProfileCard: React.FC<{
    icon: React.ReactNode; label: string; value: string; field: string;
    type?: string; isEditing: boolean; tempValue: string;
    onChange: (v: string) => void; onSave: () => void; onCancel: () => void;
    onStart: () => void; updating: boolean;
}> = ({ icon, label, value, field, type = 'text', isEditing, tempValue, onChange, onSave, onCancel, onStart, updating }) => (
    <div style={{
        padding: '24px', borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-elevated)', border: isEditing ? '1px solid var(--accent)' : '1px solid var(--border-color)',
        boxShadow: isEditing ? '0 0 16px rgba(255,183,127,0.2)' : 'var(--shadow-md)',
        transition: 'all 0.3s ease',
    }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,138,0,0.1)', color: 'var(--accent)' }}>
                    {icon}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>{label}</span>
            </div>
            {!isEditing && (
                <button onClick={onStart} className="glass-card interactive" style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Edit2 size={14} /> Edit
                </button>
            )}
        </div>
        
        {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                        type={field === 'dateOfBirth' ? 'text' : type}
                        autoFocus
                        placeholder={field === 'dateOfBirth' ? 'DD/MM/YYYY' : ''}
                        style={{
                            flex: 1, backgroundColor: 'transparent', border: 'none', borderBottom: '2px solid var(--accent)',
                            fontSize: 16, fontWeight: 600, outline: 'none', paddingBottom: 'var(--space-4)',
                            color: 'var(--text-primary)', opacity: updating ? 0.5 : 1,
                        }}
                        value={tempValue}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') onSave();
                            if (e.key === 'Escape') onCancel();
                        }}
                        disabled={updating}
                    />
                    <button onClick={onSave} style={{ padding: 8, backgroundColor: 'var(--success)', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', opacity: updating ? 0.5 : 1 }} disabled={updating}>
                        {updating ? <Loader2 size={16} style={{ color: 'white', animation: 'spin 1s linear infinite' }} /> : <Check size={16} style={{ color: 'white' }} />}
                    </button>
                    <button onClick={onCancel} style={{ padding: 8, backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', cursor: 'pointer' }} disabled={updating}>
                        <X size={16} style={{ color: 'var(--text-secondary)' }} />
                    </button>
                </div>
                {field === 'dateOfBirth' && (
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--accent)' }}>
                        Format: DD/MM/YYYY
                    </p>
                )}
            </div>
        ) : (
            <div>
                <p style={{ fontSize: 18, fontWeight: 700 }}>{value || 'N/A'}</p>
            </div>
        )}
    </div>
);

export default AccountPage;
