import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Film,
  MapPin,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react';
import type { PricingPromotionOptionsDto } from '../../../../api/pricingPromotionApi';
import {
  DAY_VALUES,
  formatValue,
  formatVnd,
  getDayOptions,
  getPromotionTypes,
  getTypeColor,
  getTypeLabel,
  type ConditionState,
} from './pricingPromotionHelpers';

export const PillButton: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}> = ({ label, active, onClick, color = '#ff8a00' }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
      cursor: 'pointer', transition: 'all 0.15s',
      border: active ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.12)',
      background: active ? `${color}22` : 'rgba(255,255,255,0.03)',
      color: active ? '#ffffff' : '#e4e4e7',
      boxShadow: active ? `0 0 10px ${color}20` : 'none',
    }}
  >{label}</button>
);

export const ToggleButton: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }> = ({ checked, onChange, label, sub }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s', flex: 1, textAlign: 'left',
      border: `1px solid ${checked ? '#ff8a00' : 'rgba(255,255,255,0.12)'}`,
      background: checked ? 'rgba(255,138,0,0.08)' : 'rgba(255,255,255,0.03)',
    }}
  >
    {checked
      ? <ToggleRight size={20} style={{ color: '#ff8a00', flexShrink: 0 }} />
      : <ToggleLeft size={20} style={{ color: '#a1a1aa', flexShrink: 0 }} />
    }
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 1 }}>{sub}</div>}
    </div>
  </button>
);

export const FieldLabel: React.FC<{ label: string; required?: boolean; hint?: string; children: React.ReactNode }> = ({ label, required, hint, children }) => (
  <label style={{ display: 'grid', gap: 5 }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}{required && <span style={{ color: '#ff8a00', marginLeft: 3 }}>*</span>}
    </span>
    {children}
    {hint && <span style={{ fontSize: 11, color: '#a1a1aa', marginTop: 1 }}>{hint}</span>}
  </label>
);

export interface ConditionCardProps {
  cond: ConditionState;
  index: number;
  total: number;
  options: PricingPromotionOptionsDto;
  onUpdate: (patch: Partial<ConditionState>) => void;
  onRemove: () => void;
}

export const ConditionCard: React.FC<ConditionCardProps> = ({
  cond,
  index,
  total,
  options,
  onUpdate,
  onRemove,
}) => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const isPercent = cond.promotionType === 'PercentDiscount' || cond.promotionType === 'Surcharge';

  const toggleFormat = (id: string) => {
    let next: string[];
    if (cond.movieFormatIds.length === 0) {
      next = options.formats.map(f => f.id).filter(x => x !== id);
    } else {
      next = cond.movieFormatIds.includes(id)
        ? cond.movieFormatIds.filter(x => x !== id)
        : [...cond.movieFormatIds, id];
      if (next.length === options.formats.length) {
        next = [];
      }
    }
    onUpdate({ movieFormatIds: next });
  };

  const toggleCinema = (id: string) => {
    let next: string[];
    if (cond.cinemaIds.length === 0) {
      next = options.cinemas.map(c => c.id).filter(x => x !== id);
    } else {
      next = cond.cinemaIds.includes(id)
        ? cond.cinemaIds.filter(x => x !== id)
        : [...cond.cinemaIds, id];
      if (next.length === options.cinemas.length) {
        next = [];
      }
    }
    onUpdate({ cinemaIds: next });
  };

  const toggleSegment = (id: string) => {
    let next: string[];
    if (cond.userSegmentIds.length === 0) {
      next = options.membershipTiers.map(tier => tier.id).filter(x => x !== id);
    } else {
      next = cond.userSegmentIds.includes(id)
        ? cond.userSegmentIds.filter(x => x !== id)
        : [...cond.userSegmentIds, id];
      if (next.length === options.membershipTiers.length) {
        next = [];
      }
    }
    onUpdate({ userSegmentIds: next });
  };

  const toggleDay = (val: string) => {
    const next = cond.daysOfWeek.includes(val)
      ? cond.daysOfWeek.filter(d => d !== val)
      : [...cond.daysOfWeek, val];
    onUpdate({ daysOfWeek: next });
  };

  return (
    <div style={{
      border: `1px solid ${cond.isActive ? `${getTypeColor(cond.promotionType)}40` : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 14, overflow: 'hidden', transition: 'all 0.2s',
      background: cond.isActive ? `${getTypeColor(cond.promotionType)}06` : 'rgba(255,255,255,0.015)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 10px', borderRadius: 999, background: `${getTypeColor(cond.promotionType)}18`, color: getTypeColor(cond.promotionType), border: `1px solid ${getTypeColor(cond.promotionType)}40`, flexShrink: 0 }}>
          #{index + 1} · {getTypeLabel(cond.promotionType, t)}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {formatValue(cond.adjustmentValue, cond.promotionType)}
        </span>
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          <button type="button" onClick={() => onUpdate({ isActive: !cond.isActive })} style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 999, border: `1px solid ${cond.isActive ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.1)'}`, background: cond.isActive ? 'rgba(52,211,153,0.1)' : 'transparent', color: cond.isActive ? '#34d399' : '#a1a1aa', cursor: 'pointer' }}>
            {cond.isActive ? t('pricingPromotions.onLabel') : t('pricingPromotions.offLabel')}
          </button>
          <button type="button" onClick={() => setCollapsed(c => !c)} style={{ display: 'flex', alignItems: 'center', padding: '4px 7px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#ffffff', cursor: 'pointer' }}>
            {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </button>
          <button type="button" onClick={onRemove} disabled={total === 1} style={{ display: 'flex', alignItems: 'center', padding: '4px 7px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: 'var(--danger)', cursor: total === 1 ? 'not-allowed' : 'pointer', opacity: total === 1 ? 0.3 : 1 }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div style={{ padding: 16, display: 'grid', gap: 16 }}>

          {/* Type + Value row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FieldLabel label={t('pricingPromotions.adjustmentType')}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {getPromotionTypes(t).map(pt => (
                  <button
                    type="button"
                    key={pt.value}
                    onClick={() => {
                      let nextVal = cond.adjustmentValue;
                      const nextIsPercent = pt.value === 'PercentDiscount' || pt.value === 'Surcharge';
                      if (nextIsPercent && nextVal > 100) {
                        nextVal = 10;
                      } else if (!nextIsPercent && nextVal <= 100) {
                        nextVal = 45000;
                      }
                      onUpdate({ promotionType: pt.value, adjustmentValue: nextVal });
                    }}
                    style={{
                      padding: '8px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                      border: `1px solid ${cond.promotionType === pt.value ? `${pt.color}60` : 'rgba(255,255,255,0.07)'}`,
                      background: cond.promotionType === pt.value ? `${pt.color}14` : 'rgba(255,255,255,0.02)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, color: cond.promotionType === pt.value ? pt.color : '#e4e4e7' }}>{pt.label}</div>
                    <div style={{ fontSize: 10, color: '#a1a1aa', marginTop: 2 }}>{pt.desc}</div>
                  </button>
                ))}
              </div>
            </FieldLabel>
            <FieldLabel label={isPercent ? t('pricingPromotions.valuePercent') : t('pricingPromotions.valueVnd')}>
              <input
                type="text"
                className="input"
                style={{ fontSize: 18, fontWeight: 800, textAlign: 'center', color: getTypeColor(cond.promotionType) }}
                value={isPercent ? cond.adjustmentValue.toString() : cond.adjustmentValue.toLocaleString('vi-VN')}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^\d]/g, '');
                  let val = clean ? parseInt(clean, 10) : 0;
                  if (isPercent && val > 100) {
                    val = 100;
                  }
                  onUpdate({ adjustmentValue: val });
                }}
              />
              <span style={{ fontSize: 11, color: '#a1a1aa', textAlign: 'center' }}>
                {cond.promotionType === 'PercentDiscount' ? t('pricingPromotions.percentDiscountPreview', { value: cond.adjustmentValue }) :
                 cond.promotionType === 'Surcharge' ? t('pricingPromotions.surchargePreview', { value: cond.adjustmentValue }) :
                 cond.promotionType === 'FixedDiscount' ? t('pricingPromotions.fixedDiscountPreview', { value: formatVnd(cond.adjustmentValue) }) :
                 t('pricingPromotions.fixedPricePreview', { value: formatVnd(cond.adjustmentValue) })}
              </span>
            </FieldLabel>
          </div>

          {/* Formats */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Film size={12} style={{ color: '#ff8a00' }} /> {t('pricingPromotions.filmFormats')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <PillButton label={t('pricingPromotions.allFormats')} active={cond.movieFormatIds.length === 0} onClick={() => onUpdate({ movieFormatIds: [] })} />
              {options.formats.map(f => {
                const isAct = cond.movieFormatIds.length === 0 || cond.movieFormatIds.includes(f.id);
                return (
                  <PillButton key={f.id} label={f.name} active={isAct} onClick={() => toggleFormat(f.id)} />
                );
              })}
            </div>
          </div>

          {/* Cinemas */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <MapPin size={12} style={{ color: '#ff8a00' }} /> {t('pricingPromotions.theaterBranches')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <PillButton label={t('pricingPromotions.allTheaters')} active={cond.cinemaIds.length === 0} onClick={() => onUpdate({ cinemaIds: [] })} />
              {options.cinemas.map(c => {
                const isAct = cond.cinemaIds.length === 0 || cond.cinemaIds.includes(c.id);
                return (
                  <PillButton key={c.id} label={c.name} active={isAct} onClick={() => toggleCinema(c.id)} />
                );
              })}
            </div>
          </div>

          {/* User segments */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Tệp người dùng áp dụng
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <PillButton
                label="Tất cả tệp người dùng"
                active={cond.userSegmentIds.length === 0}
                onClick={() => onUpdate({ userSegmentIds: [] })}
              />
              {options.membershipTiers.map(seg => {
                const isAct = cond.userSegmentIds.length === 0 || cond.userSegmentIds.includes(seg.id);
                return (
                  <PillButton
                    key={seg.id}
                    label={seg.name}
                    active={isAct}
                    onClick={() => toggleSegment(seg.id)}
                  />
                );
              })}
            </div>
          </div>

          {/* Days */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Calendar size={12} style={{ color: '#ff8a00' }} /> {t('pricingPromotions.appliedDays')}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {getDayOptions(t).map(day => (
                <button
                  type="button"
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  style={{
                    minWidth: 40, height: 34, borderRadius: 8, fontWeight: 800, fontSize: 12,
                    cursor: 'pointer', transition: 'all 0.15s',
                    border: cond.daysOfWeek.includes(day.value) ? '1px solid #ff8a00' : '1px solid rgba(255,255,255,0.12)',
                    background: cond.daysOfWeek.includes(day.value) ? 'rgba(255,138,0,0.14)' : 'rgba(255,255,255,0.03)',
                    color: cond.daysOfWeek.includes(day.value) ? '#ffffff' : '#e4e4e7',
                  }}
                >
                  {day.label}
                </button>
              ))}
              <button type="button" onClick={() => {
                const allSel = getDayOptions(t).every(d => cond.daysOfWeek.includes(d.value));
                onUpdate({ daysOfWeek: allSel ? [] : [...DAY_VALUES] });
              }} style={{ padding: '0 12px', height: 34, borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#e4e4e7' }}>
                {getDayOptions(t).every(d => cond.daysOfWeek.includes(d.value)) ? t('pricingPromotions.deselectAll') : t('pricingPromotions.selectAll')}
              </button>
            </div>
          </div>

          {/* Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FieldLabel label={t('pricingPromotions.fromTime')}>
              <input type="time" className="input" value={cond.timeFrom} onChange={e => onUpdate({ timeFrom: e.target.value })} />
            </FieldLabel>
            <FieldLabel label={t('pricingPromotions.toTime')}>
              <input type="time" className="input" value={cond.timeTo} onChange={e => onUpdate({ timeTo: e.target.value })} />
            </FieldLabel>
          </div>

        </div>
      )}
    </div>
  );
};
