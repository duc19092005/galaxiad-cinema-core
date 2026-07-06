import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Check, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PricingPromotionConflictDto } from '../../../api/pricingPromotionApi';

interface ConflictResolution {
  [conflictRuleId: string]: 'keep' | 'replace';
}

interface Props {
  conflicts: PricingPromotionConflictDto[];
  onResolve: (deactivateRuleIds: string[]) => void;
  onCancel: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  FixedTicketPrice: '#818cf8',
  PercentDiscount: '#34d399',
  FixedDiscount: '#fbbf24',
  Surcharge: '#f87171',
};

const formatValue = (val: number, type: string): string => {
  if (type === 'PercentDiscount' || type === 'Surcharge') return `${val}%`;
  return `${val.toLocaleString('vi-VN')}đ`;
};

export const PricingPromotionConflictModal: React.FC<Props> = ({ conflicts, onResolve, onCancel }) => {
  const { t } = useTranslation();
  const [resolution, setResolution] = useState<ConflictResolution>(() => {
    const init: ConflictResolution = {};
    conflicts.forEach(c => { init[c.conflictRuleId] = 'keep'; });
    return init;
  });

  const handleResolve = () => {
    const deactivateIds = conflicts
      .filter(c => resolution[c.conflictRuleId] === 'replace')
      .map(c => c.conflictRuleId);
    onResolve(deactivateIds);
  };

  const replaceCount = Object.values(resolution).filter(v => v === 'replace').length;
  const keepCount = conflicts.length - replaceCount;

  return createPortal(
    <>
      <div
        onClick={onCancel}
        style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 2001,
        width: 'min(640px, 92vw)',
        maxHeight: '85vh',
        backgroundColor: 'var(--bg-elevated, #18181b)',
        border: '1px solid var(--border-color, #27272a)',
        borderRadius: 18,
        boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column',
        animation: 'modalIn 0.25s cubic-bezier(0.16,1,0.3,1)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '18px 22px',
          borderBottom: '1px solid rgba(255,138,0,0.15)',
          background: 'rgba(255,138,0,0.04)',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'rgba(255,138,0,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <AlertTriangle size={18} style={{ color: '#ff8a00' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#ffffff' }}>
              {t('pricingPromotions.conflictDetected')}
            </h3>
            <p style={{ fontSize: 12, color: '#a1a1aa', margin: '3px 0 0' }}>
              {t('pricingPromotions.conflictDesc')}
            </p>
          </div>
          <button onClick={onCancel} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30, borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.05)',
            cursor: 'pointer', color: '#ffffff',
          }}>
            <X size={14} />
          </button>
        </div>

        {/* Conflict List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px' }}>
          <div style={{ display: 'grid', gap: 12 }}>
            {conflicts.map((conflict) => {
              const color = TYPE_COLORS[conflict.promotionType as string] ?? '#ff8a00';
              const isReplace = resolution[conflict.conflictRuleId] === 'replace';

              return (
                <div
                  key={conflict.conflictRuleId}
                  style={{
                    border: `1px solid ${isReplace ? 'rgba(255,138,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 12,
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    background: isReplace ? 'rgba(255,138,0,0.04)' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  {/* Rule Info */}
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800,
                        padding: '2px 8px', borderRadius: 999,
                        background: `${color}20`, color,
                        border: `1px solid ${color}40`,
                      }}>
                        {conflict.promotionTypeName}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color }}>
                        {formatValue(conflict.adjustmentValue, conflict.promotionType as string)}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: '#a1a1aa', marginLeft: 'auto',
                        maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {t('pricingPromotions.conflictPromotion')}: {conflict.conflictPromotionTitle}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 11, color: '#a1a1aa' }}>
                      {conflict.movieFormatName && (
                        <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)' }}>
                          {conflict.movieFormatName}
                        </span>
                      )}
                      {!conflict.movieFormatName && (
                        <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)' }}>
                          {t('pricingPromotions.allFormats')}
                        </span>
                      )}
                      {conflict.cinemaName && (
                        <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)' }}>
                          {conflict.cinemaName}
                        </span>
                      )}
                      {!conflict.cinemaName && (
                        <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)' }}>
                          {t('pricingPromotions.allTheaters')}
                        </span>
                      )}
                      {conflict.userSegmentName && (
                        <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)' }}>
                          {conflict.userSegmentName}
                        </span>
                      )}
                      <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)' }}>
                        {conflict.daysOfWeekText}
                      </span>
                      {conflict.timeRange && (
                        <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)' }}>
                          {conflict.timeRange}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Resolution Toggle */}
                  <div style={{
                    display: 'flex', borderTop: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <button
                      type="button"
                      onClick={() => setResolution(r => ({ ...r, [conflict.conflictRuleId]: 'keep' }))}
                      style={{
                        flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                        background: !isReplace ? 'rgba(52,211,153,0.1)' : 'transparent',
                        color: !isReplace ? '#34d399' : '#a1a1aa',
                      }}
                    >
                      <ShieldCheck size={14} />
                      {t('pricingPromotions.keepExisting')}
                    </button>
                    <div style={{ width: 1, background: 'rgba(255,255,255,0.05)' }} />
                    <button
                      type="button"
                      onClick={() => setResolution(r => ({ ...r, [conflict.conflictRuleId]: 'replace' }))}
                      style={{
                        flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                        background: isReplace ? 'rgba(255,138,0,0.1)' : 'transparent',
                        color: isReplace ? '#ff8a00' : '#a1a1aa',
                      }}
                    >
                      <ArrowRight size={14} />
                      {t('pricingPromotions.replaceWithNew')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 22px',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(0,0,0,0.2)',
        }}>
          <div style={{ fontSize: 12, color: '#a1a1aa' }}>
            {replaceCount > 0 && (
              <span style={{ color: '#ff8a00' }}>
                {replaceCount} {t('pricingPromotions.replaceWithNew').toLowerCase()}
              </span>
            )}
            {replaceCount > 0 && keepCount > 0 && <span> · </span>}
            {keepCount > 0 && (
              <span style={{ color: '#34d399' }}>
                {keepCount} {t('pricingPromotions.keepExisting').toLowerCase()}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onCancel}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleResolve}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Check size={14} />
              {t('pricingPromotions.resolveConflicts')}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
