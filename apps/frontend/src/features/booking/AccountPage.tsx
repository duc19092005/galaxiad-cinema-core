import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Calendar,
  IdCard,
  History,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Lock,
  Edit2,
  Check,
  X,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { bookingApi } from '../../api/bookingApi';
import { authApi } from '../../api/authApi';
import { showSuccess, showError } from '../../utils/ToastUtils';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import ChangePasswordModal from './components/ChangePasswordModal';
import type { UserAccountInfo, BookingHistoryItem } from '../../types/booking.types';
import type { UpdateProfileRequest } from '../../types/auth.types';
import { RankProgressBar } from './components/account/RankProgressBar';
import {
  TabButton,
  ProfileCard,
  EditableProfileCard,
} from './components/account/AccountProfileCards';
import { BookingHistoryList } from './components/account/BookingHistoryList';

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');

  const [accountInfo, setAccountInfo] = useState<UserAccountInfo | null>(null);
  const [history, setHistory] = useState<BookingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

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
        bookingApi.getBookingHistory(),
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
        showError(t('validation.dobInvalidFormat') || 'Invalid date format (DD/MM/YYYY)');
        return;
      }
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const birth = new Date(year, month, day);

      if (isNaN(birth.getTime()) || birth.getDate() !== day || birth.getMonth() !== month) {
        showError(t('validation.dobInvalidDate') || 'Invalid date');
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

    const originalValue =
      field === 'dateOfBirth'
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
        [field]: finalValue,
      };
      await authApi.updateProfile(updatePayload);
      showSuccess(t('account.updateSuccess'));
      await fetchAllData();
      handleCancelEdit();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        t('account.updateFailed');
      showError(msg);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMembershipRankLabel = (rank?: number | string) => {
    if (rank === 1 || rank === '1' || rank === 'VIP') return 'VIP';
    return 'Standard';
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg-base)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Loader2 size={48} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg-base)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <AlertCircle size={64} style={{ color: 'var(--danger)', marginBottom: '16px' }} />
        <p
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '16px',
          }}
        >
          {error}
        </p>
        <button onClick={() => navigate('/home')} className="btn-primary cta-glow">
          {t('common.goHome')}
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Header */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(12px, 3vw, 24px)',
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              width: 40,
              height: 40,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              marginRight: '16px',
            }}
            className="interactive"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 style={{ fontWeight: 800, fontSize: 20 }}>{t('account.myAccount')}</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LanguageSwitcher />
        </div>
      </header>

      <main
        style={{
          paddingTop: 88,
          paddingBottom: '48px',
          maxWidth: 960,
          margin: '0 auto',
          paddingLeft: 'clamp(12px, 3vw, 24px)',
          paddingRight: 'clamp(12px, 3vw, 24px)',
        }}
      >
        {/* User Hero */}
        <div
          style={{
            padding: 'clamp(16px, 4vw, 32px)',
            borderRadius: 'var(--radius-xl)',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(16px, 4vw, 32px)',
            flexWrap: 'wrap',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 'var(--radius-lg)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--accent), var(--accent))',
              boxShadow: '0 8px 32px rgba(255,138,0,0.3)',
            }}
          >
            <User size={36} style={{ color: 'black' }} />
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            {editingField === 'userName' ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                }}
              >
                <input
                  autoFocus
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--accent)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 16px',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    width: '100%',
                    maxWidth: 300,
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
                <button
                  onClick={() => handleSaveEdit('userName')}
                  style={{
                    padding: 8,
                    backgroundColor: 'var(--success)',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  disabled={updating}
                >
                  {updating ? (
                    <Loader2 size={18} style={{ color: 'white', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Check size={18} style={{ color: 'white' }} />
                  )}
                </button>
                <button
                  onClick={handleCancelEdit}
                  style={{
                    padding: 8,
                    backgroundColor: 'var(--danger)',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  disabled={updating}
                >
                  <X size={18} style={{ color: 'white' }} />
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px',
                }}
              >
                <h1 style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 800, margin: 0 }}>
                  {accountInfo?.userName}
                </h1>
                <button
                  onClick={() => handleStartEdit('userName', accountInfo?.userName || '')}
                  className="glass-card interactive"
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <Edit2 size={14} /> {t('common.edit')}
                </button>
              </div>
            )}
            <p
              style={{
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: 14,
                margin: '4px 0 0',
                wordBreak: 'break-word',
              }}
            >
              <Mail size={16} style={{ color: 'var(--accent)' }} /> {accountInfo?.email}
            </p>
            {accountInfo?.rewardPoints !== undefined && (
              <p
                style={{
                  color: 'var(--primary, #ff8a00)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: 14,
                  fontWeight: 'bold',
                  margin: '6px 0 0',
                }}
              >
                <Sparkles size={16} />{' '}
                {t('account.voucherPoints', {
                  points: accountInfo.rewardPoints.toLocaleString('vi-VN'),
                })}
              </p>
            )}
            {accountInfo?.totalPoint !== undefined && (
              <>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: 14,
                    fontWeight: 700,
                    margin: '6px 0 0',
                  }}
                >
                  <Trophy size={16} style={{ color: 'var(--accent)' }} />
                  {t('account.rankInfo', {
                    rank: getMembershipRankLabel(accountInfo.membershipRank),
                    points: accountInfo.totalPoint.toLocaleString('vi-VN'),
                  })}
                </p>
                <RankProgressBar
                  currentPoints={accountInfo.totalPoint}
                  currentRank={getMembershipRankLabel(accountInfo.membershipRank)}
                />
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
          <TabButton
            active={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
            icon={<User size={20} />}
            label={t('account.profileInfo')}
          />
          <TabButton
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
            icon={<History size={20} />}
            label={t('account.bookingHistory')}
          />
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {activeTab === 'profile' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
                  gap: '24px',
                }}
              >
                <ProfileCard
                  icon={<Mail size={20} />}
                  label={t('account.email')}
                  value={accountInfo?.email}
                />
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
                  onStart={() =>
                    handleStartEdit('phoneNumber', accountInfo?.phoneNumber || '')
                  }
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
                  onStart={() =>
                    handleStartEdit('identityCode', accountInfo?.identityCode || '')
                  }
                  updating={updating}
                />
                <EditableProfileCard
                  icon={<Calendar size={20} />}
                  label={t('account.dob')}
                  value={
                    accountInfo?.dateOfBirth
                      ? new Date(accountInfo.dateOfBirth).toLocaleDateString('vi-VN')
                      : 'N/A'
                  }
                  field="dateOfBirth"
                  type="date"
                  isEditing={editingField === 'dateOfBirth'}
                  tempValue={tempValue}
                  onChange={setTempValue}
                  onSave={() => handleSaveEdit('dateOfBirth')}
                  onCancel={handleCancelEdit}
                  onStart={() =>
                    handleStartEdit(
                      'dateOfBirth',
                      accountInfo?.dateOfBirth?.split('T')[0] || '',
                    )
                  }
                  updating={updating}
                />
              </div>

              <div>
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="glass-card interactive"
                  style={{
                    padding: '16px 32px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    fontSize: 13,
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  <Lock size={20} style={{ color: 'var(--accent)' }} />
                  {t('account.changePassword')}
                </button>
              </div>
            </div>
          ) : (
            <BookingHistoryList
              history={history}
              formatDate={formatDate}
              onViewTicket={(orderId) => navigate(`/booking/success?orderId=${orderId}`)}
            />
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

export default AccountPage;
