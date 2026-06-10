// src/features/admin/components/TransferRightsView.tsx

import React, { useState, useEffect } from 'react';
import {
  ArrowRight, Building2, Film, ShieldAlert, Search,
  ChevronRight, Loader2, Users, Info, ArrowLeftRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { transferRightsApi } from '../../../api/transferRightsApi';
import type { ManagerDto, ManagedItemDto } from '../../../types/admin.types';
import { showSuccess, showError } from '../../../utils/ToastUtils';

const TransferRightsView: React.FC = () => {
  const { t } = useTranslation();

  const [transferType, setTransferType] = useState<1 | 2 | 3>(1);
  const [managers, setManagers] = useState<ManagerDto[]>([]);
  const [sourceUserId, setSourceUserId] = useState<string>('');
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [managedItems, setManagedItems] = useState<ManagedItemDto[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [executing, setExecuting] = useState(false);

  const typeConfig = {
    1: { icon: Building2, label: t('Facilities (CSVC)'), color: '#ff8a00' },
    2: { icon: ShieldAlert, label: t('Operation (Vận hành)'), color: '#8b5cf6' },
    3: { icon: Film, label: t('Movie (Phim)'), color: '#22c55e' },
  };

  const activeConfig = typeConfig[transferType];

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await transferRightsApi.getManagers(transferType);
        setManagers(res.data || []);
        setSourceUserId('');
        setTargetUserId('');
        setManagedItems([]);
      } catch (error) {
        showError(t('toast.loadManagersFailed'));
      }
    };
    fetchManagers();
  }, [transferType, t]);

  useEffect(() => {
    const fetchItems = async () => {
      setLoadingItems(true);
      try {
        const res = await transferRightsApi.getManagedItems(
          transferType,
          sourceUserId === 'unmanaged' ? undefined : (sourceUserId || undefined)
        );
        setManagedItems(res.data || []);
      } catch (error) {
        showError(t('toast.loadItemsFailed'));
      } finally { setLoadingItems(false); }
    };

    if (sourceUserId === '') { setManagedItems([]); return; }
    fetchItems();
  }, [sourceUserId, transferType, t]);

  const handleExecute = async (itemId: string, itemName: string) => {
    if (!targetUserId) { showError(t('toast.selectTargetManager')); return; }
    const apiSourceUserId = sourceUserId === 'unmanaged' ? null : sourceUserId;
    if (apiSourceUserId === targetUserId) { showError(t('toast.samePersonError')); return; }

    if (!window.confirm(t('Are you sure you want to transfer "{0}" to the new manager?', { 0: itemName }))) return;

    setExecuting(true);
    try {
      await transferRightsApi.executeTransfer({
        sourceUserId: apiSourceUserId, targetUserId, transferType, itemId,
      });
      showSuccess(t('toast.transferSuccess', { itemName }));
      const resItems = await transferRightsApi.getManagedItems(
        transferType,
        sourceUserId === 'unmanaged' ? undefined : (sourceUserId || undefined)
      );
      setManagedItems(resItems.data || []);
    } catch (error: any) {
      showError(error.response?.data?.message || t('toast.transferFailed'));
    } finally { setExecuting(false); }
  };

  return (
    <div className="animate-in" style={{ padding: 8 }}>
      {/* Type Selector */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <div style={{
          display: 'flex', gap: 4, padding: 4,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: 14,
        }}>
          {([1, 2, 3] as const).map((type) => {
            const config = typeConfig[type];
            const Icon = config.icon;
            const isActive = transferType === type;
            return (
              <button
                key={type}
                onClick={() => setTransferType(type)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 20px', borderRadius: 10,
                  border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.02em',
                  background: isActive ? `linear-gradient(135deg, ${config.color}, ${config.color}dd)` : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? `0 4px 16px ${config.color}33` : 'none',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <Icon size={16} />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
        alignItems: 'start',
      }}>
        {/* 1. Source Selection */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255, 138, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                {t('1. From Manager')}
              </h3>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0 0' }}>{t('Owner of assets')}</p>
            </div>
          </div>
          <div className="relative">
            <select
              value={sourceUserId}
              onChange={e => setSourceUserId(e.target.value)}
              className="input select"
              style={{ fontSize: 12 }}
            >
              <option value="">{t('Select source...')}</option>
              <option value="unmanaged" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                --- {t('Unmanaged Assets')} ---
              </option>
              {managers.map(m => (
                <option key={m.userId} value={m.userId}>{m.userName} ({m.userEmail})</option>
              ))}
            </select>
            <ChevronRight size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* 2. Target Selection */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeftRight size={16} style={{ color: '#8b5cf6' }} />
            </div>
            <div>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                {t('2. To Manager')}
              </h3>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0 0' }}>{t('New recipient')}</p>
            </div>
          </div>
          <div className="relative">
            <select
              value={targetUserId}
              onChange={e => setTargetUserId(e.target.value)}
              className="input select"
              style={{ fontSize: 12 }}
            >
              <option value="">{t('Select recipient...')}</option>
              {managers
                .filter(m => m.userId !== sourceUserId)
                .map(m => (
                  <option key={m.userId} value={m.userId}>{m.userName} ({m.userEmail})</option>
                ))}
            </select>
            <ChevronRight size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* 3. Assets List */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Search size={16} style={{ color: '#22c55e' }} />
            </div>
            <div>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                {t('3. Assets')}
              </h3>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0 0' }}>{t('Transfer individual items')}</p>
            </div>
          </div>

          <div style={{
            maxHeight: 360, overflowY: 'auto',
            border: '1px solid var(--border-color)',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.02)',
          }}>
            {loadingItems ? (
              <div className="state-center py-16 opacity-50">
                <Loader2 size={24} style={{ color: activeConfig.color, animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('Loading Assets...')}
                </p>
              </div>
            ) : managedItems.length > 0 ? (
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {managedItems.map(item => (
                  <div
                    key={item.itemId}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      borderRadius: 10, border: '1px solid var(--border-color)',
                      background: 'rgba(255,255,255,0.02)',
                      transition: 'all 0.2s ease',
                    }}
                    className="group"
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `${activeConfig.color}15`,
                      color: activeConfig.color,
                      flexShrink: 0,
                    }}>
                      {React.createElement(activeConfig.icon, { size: 16 })}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.itemName}
                      </p>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.description || t('No description available')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleExecute(item.itemId, item.itemName)}
                      disabled={!targetUserId || executing}
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: !targetUserId || executing ? 'var(--border-color)' : activeConfig.color,
                        color: '#fff', opacity: !targetUserId || executing ? 0.3 : 1,
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                      }}
                    >
                      {executing
                        ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        : <ArrowRight size={14} />
                      }
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="state-center py-16 opacity-30">
                <Info size={36} style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {sourceUserId ? t('No items found') : t('Select source manager')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warning */}
      <div style={{
        marginTop: 16, padding: '12px 16px', borderRadius: 10,
        background: 'rgba(245, 158, 11, 0.05)',
        border: '1px solid rgba(245, 158, 11, 0.15)',
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <Info size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
          {t('Tip: Select both Source and Target managers first, then click the arrow on each item to transfer it individually.')}
        </p>
      </div>
    </div>
  );
};

export default TransferRightsView;
