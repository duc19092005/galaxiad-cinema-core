import React, { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  BadgePercent, Check, Edit2, Loader2, Plus, Trash2, X,
  ChevronDown, ChevronUp, ChevronRight, ChevronLeft,
  ToggleLeft, ToggleRight, Eye, Film, MapPin, Calendar, Ban
} from 'lucide-react';
import {
  pricingPromotionApi,
  type PricingPromotionDto,
  type PricingPromotionOptionsDto,
  type PricingPromotionRuleRequestDto,
  type PricingPromotionUpsertDto,
  type PromotionTypeName,
} from '../../../api/pricingPromotionApi';
import { showError, showSuccess } from '../../../utils/ToastUtils';
import { useTranslation } from 'react-i18next';

// ─── Constants ───────────────────────────────────────────────────────────────

const getDayOptions = (t: (key: string) => string) => [
  { value: 'Monday', label: t('pricingPromotions.dayMon'), short: t('pricingPromotions.dayMon') },
  { value: 'Tuesday', label: t('pricingPromotions.dayTue'), short: t('pricingPromotions.dayTue') },
  { value: 'Wednesday', label: t('pricingPromotions.dayWed'), short: t('pricingPromotions.dayWed') },
  { value: 'Thursday', label: t('pricingPromotions.dayThu'), short: t('pricingPromotions.dayThu') },
  { value: 'Friday', label: t('pricingPromotions.dayFri'), short: t('pricingPromotions.dayFri') },
  { value: 'Saturday', label: t('pricingPromotions.daySat'), short: t('pricingPromotions.daySat') },
  { value: 'Sunday', label: t('pricingPromotions.daySun'), short: t('pricingPromotions.daySun') },
];

const getPromotionTypes = (t: (key: string) => string): { value: PromotionTypeName; label: string; desc: string; unit: string; color: string }[] => [
  { value: 'FixedTicketPrice', label: t('pricingPromotions.fixedPrice'), desc: t('pricingPromotions.fixedPriceDesc'), unit: 'Đ', color: '#818cf8' },
  { value: 'PercentDiscount', label: t('pricingPromotions.percentDiscountLabel'), desc: t('pricingPromotions.percentDiscountDesc'), unit: '%', color: '#34d399' },
  { value: 'FixedDiscount', label: t('pricingPromotions.fixedDiscountLabel'), desc: t('pricingPromotions.fixedDiscountDesc'), unit: 'Đ', color: '#fbbf24' },
  { value: 'Surcharge', label: t('pricingPromotions.surcharge'), desc: t('pricingPromotions.surchargeDesc'), unit: '%', color: '#f87171' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConditionState {
  movieFormatIds: string[];
  cinemaIds: string[];
  promotionType: PromotionTypeName;
  adjustmentValue: number;
  timeFrom: string;
  timeTo: string;
  daysOfWeek: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface WizardFormState {
  // Step 1
  title: string;
  shortDescription: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  excludeHolidays: boolean;
  // Advanced (hidden)
  name: string;
  slug: string;
  description: string;
  termsAndConditions: string;
  // Step 2
  conditions: ConditionState[];
}

const emptyOptions: PricingPromotionOptionsDto = { formats: [], cinemas: [], auditoriums: [], membershipTiers: [] };

const DAY_VALUES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const createCondition = (): ConditionState => ({
  movieFormatIds: [],
  cinemaIds: [],
  promotionType: 'FixedTicketPrice',
  adjustmentValue: 45000,
  timeFrom: '00:00',
  timeTo: '23:59',
  daysOfWeek: [...DAY_VALUES],
  startDate: '',
  endDate: '',
  isActive: true,
});

const createWizardForm = (): WizardFormState => ({
  title: '',
  shortDescription: '',
  imageUrl: '',
  startDate: '',
  endDate: '',
  isActive: true,
  excludeHolidays: false,
  name: '',
  slug: '',
  description: '',
  termsAndConditions: '',
  conditions: [createCondition()],
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toDateInput = (v?: string | null) => (v ? v.split('T')[0] : '');
const toTimeInput = (v?: string | null) => (v ? v.slice(0, 5) : '');
const toApiDate = (v: string, endOfDay = false) => (!v ? null : `${v}T${endOfDay ? '23:59:59' : '00:00:00'}+07:00`);
const toApiTime = (v?: string | null) => (!v ? null : v.length === 5 ? `${v}:00` : v);
const formatVnd = (v?: number | null) => `${(v ?? 0).toLocaleString('vi-VN')}Đ`;
const TYPE_STATIC_INFO: Record<string, { unit: string; color: string }> = {
  FixedTicketPrice: { unit: 'Đ', color: '#818cf8' },
  PercentDiscount: { unit: '%', color: '#34d399' },
  FixedDiscount: { unit: 'Đ', color: '#fbbf24' },
  Surcharge: { unit: '%', color: '#f87171' },
};
const getTypeInfo = (typeName: string) => {
  const staticInfo = TYPE_STATIC_INFO[typeName];
  return staticInfo ? { value: typeName as PromotionTypeName, ...staticInfo } : undefined;
};
const getTypeColor = (typeName: string) => TYPE_STATIC_INFO[typeName]?.color ?? '#fff';
const TYPE_LABEL_KEYS: Record<string, string> = {
  FixedTicketPrice: 'pricingPromotions.fixedPrice',
  PercentDiscount: 'pricingPromotions.percentDiscountLabel',
  FixedDiscount: 'pricingPromotions.fixedDiscountLabel',
  Surcharge: 'pricingPromotions.surcharge',
};
const getTypeLabel = (typeName: string, t: (key: string, options?: Record<string, unknown>) => string) => {
  const key = TYPE_LABEL_KEYS[typeName];
  return key ? t(key) : typeName;
};

const formatValue = (val: number, type: PromotionTypeName): string => {
  const info = getTypeInfo(type);
  if (!info) return val.toString();
  if (info.unit === '%') return `${val}%`;
  return `${val.toLocaleString('vi-VN')}Đ`;
};

const buildNaturalPreview = (
  cond: ConditionState,
  options: PricingPromotionOptionsDto,
  t: (key: string, options?: Record<string, unknown>) => string
): string => {
  const value = formatValue(cond.adjustmentValue, cond.promotionType);

  const formats = cond.movieFormatIds.length === 0
    ? t('pricingPromotions.allFormatsPreview')
    : cond.movieFormatIds.map(id => options.formats.find(f => f.id === id)?.name ?? id).join(', ');

  const cinemas = cond.cinemaIds.length === 0
    ? t('pricingPromotions.allCinemasPreview')
    : cond.cinemaIds.map(id => options.cinemas.find(c => c.id === id)?.name ?? id).join(', ');

  const allDays = getDayOptions(t).every(d => cond.daysOfWeek.includes(d.value));
  const days = allDays ? t('pricingPromotions.dailyPreview') : cond.daysOfWeek.map(d => getDayOptions(t).find(x => x.value === d)?.label).join(', ');

  const time = (cond.timeFrom === '00:00' && cond.timeTo === '23:59')
    ? t('pricingPromotions.allDayPreview')
    : `${cond.timeFrom}–${cond.timeTo}`;

  return t('pricingPromotions.previewSummary', { type: getTypeLabel(cond.promotionType, t), value, formats, cinemas, days, time });
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== 'object' || error === null) return fallback;
  const r = (error as { response?: { data?: { message?: string; Message?: string } } }).response;
  return r?.data?.message ?? r?.data?.Message ?? fallback;
};

const buildFormFromPromotion = (p: PricingPromotionDto): WizardFormState => {
  // Group flat rules into logical conditions
  const groups: ConditionState[] = [];
  for (const rule of p.rules) {
    const existing = groups.find(g =>
      g.promotionType === rule.promotionTypeName &&
      g.adjustmentValue === rule.adjustmentValue &&
      g.timeFrom === toTimeInput(rule.timeFrom) &&
      g.timeTo === toTimeInput(rule.timeTo) &&
      g.startDate === toDateInput(rule.startDate) &&
      g.endDate === toDateInput(rule.endDate) &&
      g.isActive === rule.isActive &&
      JSON.stringify(g.daysOfWeek.slice().sort()) === JSON.stringify(rule.daysOfWeek.slice().sort())
    );
    if (existing) {
      if (rule.movieFormatId && !existing.movieFormatIds.includes(rule.movieFormatId))
        existing.movieFormatIds.push(rule.movieFormatId);
      if (rule.cinemaId && !existing.cinemaIds.includes(rule.cinemaId))
        existing.cinemaIds.push(rule.cinemaId);
    } else {
      groups.push({
        movieFormatIds: rule.movieFormatId ? [rule.movieFormatId] : [],
        cinemaIds: rule.cinemaId ? [rule.cinemaId] : [],
        promotionType: rule.promotionTypeName as PromotionTypeName,
        adjustmentValue: rule.adjustmentValue,
        timeFrom: toTimeInput(rule.timeFrom),
        timeTo: toTimeInput(rule.timeTo),
        daysOfWeek: rule.daysOfWeek.length ? rule.daysOfWeek : [...DAY_VALUES],
        startDate: toDateInput(rule.startDate),
        endDate: toDateInput(rule.endDate),
        isActive: rule.isActive,
      });
    }
  }
  return {
    title: p.title,
    shortDescription: p.shortDescription ?? '',
    imageUrl: p.imageUrl ?? '',
    startDate: toDateInput(p.startDate),
    endDate: toDateInput(p.endDate),
    isActive: p.isActive,
    excludeHolidays: p.excludeHolidays,
    name: p.name,
    slug: p.slug,
    description: p.description ?? '',
    termsAndConditions: p.termsAndConditions ?? '',
    conditions: groups.length ? groups : [createCondition()],
  };
};

const toPayload = (form: WizardFormState): PricingPromotionUpsertDto => {
  const rules: PricingPromotionRuleRequestDto[] = form.conditions.map(cond => ({
    movieFormatIds: cond.movieFormatIds.length > 0 ? cond.movieFormatIds : [],
    cinemaIds: cond.cinemaIds.length > 0 ? cond.cinemaIds : [],
    promotionType: cond.promotionType,
    adjustmentValue: cond.adjustmentValue,
    startDate: toApiDate(cond.startDate),
    endDate: toApiDate(cond.endDate, true),
    timeFrom: toApiTime(cond.timeFrom),
    timeTo: toApiTime(cond.timeTo),
    daysOfWeek: cond.daysOfWeek.length ? cond.daysOfWeek : [...DAY_VALUES],
    priority: 100,
    isActive: cond.isActive,
  }));

  const title = form.title.trim();
  return {
    name: (form.name.trim() || title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')).slice(0, 150) || `promo_${Date.now()}`,
    slug: form.slug.trim() || null,
    title,
    shortDescription: form.shortDescription.trim() || null,
    description: form.description.trim() || null,
    termsAndConditions: form.termsAndConditions.trim() || null,
    imageUrl: form.imageUrl.trim() || null,
    isActive: form.isActive,
    excludeHolidays: form.excludeHolidays,
    startDate: toApiDate(form.startDate),
    endDate: toApiDate(form.endDate, true),
    rules,
  };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const PillButton: React.FC<{
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

const ToggleButton: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }> = ({ checked, onChange, label, sub }) => (
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

const FieldLabel: React.FC<{ label: string; required?: boolean; hint?: string; children: React.ReactNode }> = ({ label, required, hint, children }) => (
  <label style={{ display: 'grid', gap: 5 }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}{required && <span style={{ color: '#ff8a00', marginLeft: 3 }}>*</span>}
    </span>
    {children}
    {hint && <span style={{ fontSize: 11, color: '#a1a1aa', marginTop: 1 }}>{hint}</span>}
  </label>
);

// ─── Condition Card ───────────────────────────────────────────────────────────

const ConditionCard: React.FC<{
  cond: ConditionState;
  index: number;
  total: number;
  options: PricingPromotionOptionsDto;
  onUpdate: (patch: Partial<ConditionState>) => void;
  onRemove: () => void;
}> = ({ cond, index, total, options, onUpdate, onRemove }) => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const isPercent = cond.promotionType === 'PercentDiscount' || cond.promotionType === 'Surcharge';

  const toggleFormat = (id: string) => {
    let next: string[];
    if (cond.movieFormatIds.length === 0) {
      // All were active. Clicking one deactivates it.
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
      // All were active. Clicking one deactivates it.
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
                        nextVal = 10; // Sensible default like 10%
                      } else if (!nextIsPercent && nextVal <= 100) {
                        nextVal = 45000; // Sensible ticket price like 45k
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
            <FieldLabel label={t('pricingPromotions.fromTime')}>
              <input type="time" className="input" value={cond.timeFrom} onChange={e => onUpdate({ timeFrom: e.target.value })} />
            </FieldLabel>
            <FieldLabel label={t('pricingPromotions.toTime')}>
              <input type="time" className="input" value={cond.timeTo} onChange={e => onUpdate({ timeTo: e.target.value })} />
            </FieldLabel>
            <FieldLabel label={t('pricingPromotions.fromDate')}>
              <input type="date" className="input" value={cond.startDate} onChange={e => onUpdate({ startDate: e.target.value })} />
            </FieldLabel>
            <FieldLabel label={t('pricingPromotions.toDate')}>
              <input type="date" className="input" value={cond.endDate} onChange={e => onUpdate({ endDate: e.target.value })} />
            </FieldLabel>
          </div>

        </div>
      )}
    </div>
  );
};

// ─── Wizard Steps ─────────────────────────────────────────────────────────────

const StepIndicator: React.FC<{ step: number; total: number; labels: string[] }> = ({ step, total, labels }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
    {labels.map((label, i) => (
      <React.Fragment key={i}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, transition: 'all 0.2s',
            background: i < step ? '#ff8a00' : i === step ? 'rgba(255,138,0,0.2)' : 'rgba(255,255,255,0.06)',
            color: i < step ? '#000' : i === step ? '#ff8a00' : '#a1a1aa',
            border: i === step ? '2px solid #ff8a00' : '2px solid transparent',
          }}>
            {i < step ? <Check size={13} /> : i + 1}
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: i === step ? '#ff8a00' : '#a1a1aa', whiteSpace: 'nowrap' }}>{label}</span>
        </div>
        {i < total - 1 && (
          <div style={{ flex: 1, height: 2, margin: '0 6px', marginBottom: 18, background: i < step ? '#ff8a00' : 'rgba(255,255,255,0.08)', transition: 'all 0.3s' }} />
        )}
      </React.Fragment>
    ))}
  </div>
);

const Step1: React.FC<{ form: WizardFormState; setForm: React.Dispatch<React.SetStateAction<WizardFormState>> }> = ({ form, setForm }) => {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const set = (patch: Partial<WizardFormState>) => setForm(f => ({ ...f, ...patch }));

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <FieldLabel label={t('pricingPromotions.campaignName')} required hint={t('pricingPromotions.campaignNameHint')}>
        <input className="input" style={{ fontSize: 15, fontWeight: 600, color: '#ffffff', background: 'rgba(255,255,255,0.03)' }} value={form.title} onChange={e => set({ title: e.target.value })} required placeholder={t('pricingPromotions.campaignNamePlaceholder')} />
      </FieldLabel>

      <FieldLabel label={t('pricingPromotions.shortDescription')} hint={t('pricingPromotions.shortDescriptionHint')}>
        <input className="input" style={{ color: '#ffffff', background: 'rgba(255,255,255,0.03)' }} value={form.shortDescription} onChange={e => set({ shortDescription: e.target.value })} placeholder={t('pricingPromotions.shortDescriptionPlaceholder')} />
      </FieldLabel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FieldLabel label={t('pricingPromotions.startDate')} hint={t('pricingPromotions.startDateHint')}>
          <input type="date" className="input" style={{ color: '#ffffff', background: 'rgba(255,255,255,0.03)' }} value={form.startDate} onChange={e => set({ startDate: e.target.value })} />
        </FieldLabel>
        <FieldLabel label={t('pricingPromotions.endDate')} hint={t('pricingPromotions.endDateHint')}>
          <input type="date" className="input" style={{ color: '#ffffff', background: 'rgba(255,255,255,0.03)' }} value={form.endDate} onChange={e => set({ endDate: e.target.value })} />
        </FieldLabel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <ToggleButton checked={form.isActive} onChange={v => set({ isActive: v })} label={t('pricingPromotions.activateNow')} sub={t('pricingPromotions.activateNowSub')} />
        <ToggleButton checked={form.excludeHolidays} onChange={v => set({ excludeHolidays: v })} label={t('pricingPromotions.excludeHolidays')} sub={t('pricingPromotions.excludeHolidaysSub')} />
      </div>

      <button type="button" onClick={() => setShowAdvanced(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: 0 }}>
        {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {t('pricingPromotions.advancedSettings')}
      </button>

      {showAdvanced && (
        <div style={{ padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FieldLabel label="Slug (URL)" hint={t('pricingPromotions.slugHint')}>
              <input className="input" style={{ color: '#ffffff', background: 'rgba(255,255,255,0.03)' }} value={form.slug} onChange={e => set({ slug: e.target.value })} placeholder="giam-gia-sang-som" />
            </FieldLabel>
            <FieldLabel label={t('pricingPromotions.bannerImage')}>
              <input className="input" style={{ color: '#ffffff', background: 'rgba(255,255,255,0.03)' }} value={form.imageUrl} onChange={e => set({ imageUrl: e.target.value })} placeholder="https://..." />
            </FieldLabel>
          </div>
          <FieldLabel label={t('pricingPromotions.detailedDescription')}>
            <textarea className="input" style={{ color: '#ffffff', background: 'rgba(255,255,255,0.03)', resize: 'vertical' }} rows={3} value={form.description} onChange={e => set({ description: e.target.value })} />
          </FieldLabel>
          <FieldLabel label={t('pricingPromotions.termsConditions')}>
            <textarea className="input" style={{ color: '#ffffff', background: 'rgba(255,255,255,0.03)', resize: 'vertical' }} rows={3} value={form.termsAndConditions} onChange={e => set({ termsAndConditions: e.target.value })} />
          </FieldLabel>
        </div>
      )}
    </div>
  );
};

const Step2: React.FC<{
  form: WizardFormState;
  setForm: React.Dispatch<React.SetStateAction<WizardFormState>>;
  options: PricingPromotionOptionsDto;
}> = ({ form, setForm, options }) => {
  const { t } = useTranslation();
  const updateCondition = (index: number, patch: Partial<ConditionState>) => {
    setForm(f => ({ ...f, conditions: f.conditions.map((c, i) => i === index ? { ...c, ...patch } : c) }));
  };
  const addCondition = () => setForm(f => ({ ...f, conditions: [...f.conditions, createCondition()] }));
  const removeCondition = (i: number) => setForm(f => ({ ...f, conditions: form.conditions.length === 1 ? f.conditions : f.conditions.filter((_, idx) => idx !== i) }));

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 800, color: '#ffffff' }}>{t('pricingPromotions.conditionsTitle')}</p>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: '#a1a1aa' }}>
          {t('pricingPromotions.conditionsDesc')}
        </p>
      </div>

      {form.conditions.map((cond, i) => (
        <ConditionCard
          key={i}
          cond={cond}
          index={i}
          total={form.conditions.length}
          options={options}
          onUpdate={patch => updateCondition(i, patch)}
          onRemove={() => removeCondition(i)}
        />
      ))}

      <button type="button" onClick={addCondition} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 42 }}>
        <Plus size={15} /> {t('pricingPromotions.addCondition')}
      </button>
    </div>
  );
};

const Step3: React.FC<{
  form: WizardFormState;
  options: PricingPromotionOptionsDto;
  submitting: boolean;
}> = ({ form, options, submitting }) => {
  const { t } = useTranslation();
  return (
  <div style={{ display: 'grid', gap: 20 }}>
    {/* Campaign summary */}
    <div style={{ padding: 18, borderRadius: 14, border: '1px solid rgba(255,138,0,0.2)', background: 'rgba(255,138,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <BadgePercent size={18} style={{ color: '#ff8a00' }} />
        <span style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>{form.title || t('pricingPromotions.noNameYet')}</span>
        <span className={`badge ${form.isActive ? 'badge-success' : 'badge-default'}`} style={{ marginLeft: 'auto' }}>{form.isActive ? t('pricingPromotions.willActivate') : t('pricingPromotions.off')}</span>
      </div>
      {form.shortDescription && <p style={{ margin: '0 0 10px', fontSize: 13, color: '#e4e4e7' }}>{form.shortDescription}</p>}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
        <span style={{ fontSize: 13, color: '#e4e4e7', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={14} style={{ color: '#ff8a00' }} />
          {form.startDate ? new Date(form.startDate).toLocaleDateString('vi-VN') : t('pricingPromotions.startDateHint')} → {form.endDate ? new Date(form.endDate).toLocaleDateString('vi-VN') : t('pricingPromotions.endDateHint')}
        </span>
        {form.excludeHolidays && (
          <span style={{ fontSize: 13, color: '#e4e4e7', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Ban size={14} style={{ color: '#f87171' }} />
            {t('pricingPromotions.excludedHoliday')}
          </span>
        )}
      </div>
    </div>

    {/* Conditions summary */}
    <div>
      <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 800, color: '#ffffff' }}>{t('pricingPromotions.conditionsCount', { count: form.conditions.length })}</p>
      <div style={{ display: 'grid', gap: 8 }}>
        {form.conditions.map((cond, i) => {
          const preview = buildNaturalPreview(cond, options, t);
          const color = getTypeColor(cond.promotionType);
          return (
            <div key={i} style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${color}30`, background: `${color}08` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: `${color}20`, color, border: `1px solid ${color}40` }}>
                  #{i + 1}
                </span>
                <span style={{ fontSize: 12, color: '#e4e4e7' }}>{preview}</span>
                {!cond.isActive && <span className="badge badge-default" style={{ marginLeft: 'auto', fontSize: 10 }}>{t('pricingPromotions.off')}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {submitting && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a1a1aa', fontSize: 13 }}>
        <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
        {t('pricingPromotions.saving')}
      </div>
    )}
  </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const PricingPromotionsSection: React.FC = () => {
  const { t } = useTranslation();
  const [promotions, setPromotions] = useState<PricingPromotionDto[]>([]);
  const [options, setOptions] = useState<PricingPromotionOptionsDto>(emptyOptions);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [editingPromotion, setEditingPromotion] = useState<PricingPromotionDto | null>(null);
  const [form, setForm] = useState<WizardFormState>(createWizardForm);

  const activeCount = useMemo(() => promotions.filter(p => p.isActive).length, [promotions]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pr, or] = await Promise.all([pricingPromotionApi.getAll(), pricingPromotionApi.getOptions()]);
      if (pr.isSuccess) setPromotions(pr.data || []);
      if (or.isSuccess) setOptions(or.data || emptyOptions);
    } catch (e) {
      showError(getErrorMessage(e, t('pricingPromotions.loadDataFailed')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditingPromotion(null); setForm(createWizardForm()); setStep(0); setIsDrawerOpen(true); };
  const openEdit = (p: PricingPromotionDto) => { setEditingPromotion(p); setForm(buildFormFromPromotion(p)); setStep(0); setIsDrawerOpen(true); };
  const closeDrawer = () => setIsDrawerOpen(false);

  const handleNext = () => {
    if (step === 0 && !form.title.trim()) { showError(t('pricingPromotions.fillNameFirst')); return; }
    setStep(s => Math.min(s + 1, 2));
  };
  const handleBack = () => setStep(s => Math.max(s - 1, 0));

  const handleToggle = async (p: PricingPromotionDto) => {
    try {
      const r = await pricingPromotionApi.toggle(p.pricingPromotionId);
      if (r.isSuccess) { showSuccess(r.data?.isActive ? t('pricingPromotions.active') : t('pricingPromotions.off')); fetchData(); }
    } catch (e) { showError(getErrorMessage(e, t('pricingPromotions.loadDataFailed'))); }
  };

  const handleDelete = async (p: PricingPromotionDto) => {
    if (!window.confirm(t('pricingPromotions.confirmDelete', { title: p.title }))) return;
    try {
      const r = await pricingPromotionApi.delete(p.pricingPromotionId);
      if (r.isSuccess) { showSuccess(t('pricingPromotions.deleteSuccess')); fetchData(); }
    } catch (e) { showError(getErrorMessage(e, t('pricingPromotions.loadDataFailed'))); }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { showError(t('pricingPromotions.fillNameRequired')); return; }
    if (form.conditions.some(c => c.adjustmentValue < 0)) { showError(t('pricingPromotions.noNegativeValue')); return; }
    setSubmitting(true);
    try {
      const payload = toPayload(form);
      const r = editingPromotion
        ? await pricingPromotionApi.update(editingPromotion.pricingPromotionId, payload)
        : await pricingPromotionApi.create(payload);
      if (r.isSuccess) {
        showSuccess(editingPromotion ? t('pricingPromotions.saveSuccess') : t('pricingPromotions.saveSuccess'));
        closeDrawer();
        fetchData();
      }
    } catch (e) {
      showError(getErrorMessage(e, t('pricingPromotions.saveSuccess')));
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = [t('pricingPromotions.stepInfo'), t('pricingPromotions.stepConditions'), t('pricingPromotions.stepReview')];

  return (
    <>
      <div className="animate-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('pricingPromotions.ticketPromotions')}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              {t('pricingPromotions.ticketPromotionsDesc')}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge badge-accent">{t('pricingPromotions.activeCount', { count: activeCount })}</span>
            <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} /> {t('pricingPromotions.createPromotion')}
            </button>
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="state-center" style={{ minHeight: '30vh' }}>
              <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{t('pricingPromotions.loading')}</p>
            </div>
          ) : promotions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
              {t('pricingPromotions.noRules')}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t('pricingPromotions.ruleName')}</th>
                  <th>{t('pricingPromotions.active')}</th>
                  <th>{t('pricingPromotions.dateRange')}</th>
                  <th>{t('pricingPromotions.conditionsTitle')}</th>
                  <th>{t('pricingPromotions.excludeHolidays')}</th>
                  <th style={{ width: 100 }}>{t('pricingPromotions.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map(p => (
                  <tr key={p.pricingPromotionId}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 340 }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{p.title}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.shortDescription || p.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <button onClick={() => handleToggle(p)} className={`badge ${p.isActive ? 'badge-success' : 'badge-default'}`} style={{ border: 'none', cursor: 'pointer' }}>
                        {p.isActive ? t('pricingPromotions.active') : t('pricingPromotions.off')}
                      </button>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                      <div style={{ display: 'grid', gap: 2 }}>
                        <span>{t('pricingPromotions.fromDate')}: {p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : t('pricingPromotions.startDateHint')}</span>
                        <span>{t('pricingPromotions.toDate')}: {p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : '∞'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {p.rules.slice(0, 2).map((r, i) => (
                          <span key={i} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: `${getTypeColor(r.promotionTypeName)}15`, color: getTypeColor(r.promotionTypeName), border: `1px solid ${getTypeColor(r.promotionTypeName)}30` }}>
                            {formatVnd(r.adjustmentValue)}
                          </span>
                        ))}
                        {p.rules.length > 2 && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{p.rules.length - 2}</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${p.excludeHolidays ? 'badge-warning' : 'badge-success'}`}>
                        {p.excludeHolidays ? t('pricingPromotions.excludeHolidays') : t('pricingPromotions.active')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(p)} className="btn" style={{ padding: '4px 10px', fontSize: 12, height: 28, minHeight: 0, borderColor: 'rgba(99,102,241,0.4)', color: '#818cf8', background: 'rgba(99,102,241,0.05)' }}>
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => handleDelete(p)} className="btn" style={{ padding: '4px 10px', fontSize: 12, height: 28, minHeight: 0, borderColor: 'rgba(239,68,68,0.4)', color: 'var(--danger)', background: 'rgba(239,68,68,0.05)' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isDrawerOpen && createPortal(
        <>
          <div onClick={closeDrawer} style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease' }} />

          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1001,
            width: 'min(760px, 95vw)',
            backgroundColor: 'var(--bg-elevated, #18181b)',
            borderLeft: '1px solid var(--border-color, #27272a)',
            boxShadow: '-24px 0 80px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideInRight 0.25s cubic-bezier(0.16,1,0.3,1)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', flexShrink: 0, background: 'rgba(255,138,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 9, background: 'rgba(255,138,0,0.12)' }}>
                  <BadgePercent size={17} style={{ color: '#ff8a00' }} />
                </span>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    {editingPromotion ? t('pricingPromotions.editPromotion') : t('pricingPromotions.createPromotionNew')}
                  </h3>
                  <p style={{ fontSize: 11, color: '#a1a1aa', margin: 0, marginTop: 1 }}>
                    {editingPromotion ? editingPromotion.title : t('pricingPromotions.fillInfoByStep')}
                  </p>
                </div>
              </div>
              <button onClick={closeDrawer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', color: '#ffffff' }}>
                <X size={14} />
              </button>
            </div>

            {/* Stepper */}
            <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
              <StepIndicator step={step} total={3} labels={stepLabels} />
            </div>

            {/* Body */}
            <form id="wizard-form" onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
              {step === 0 && <Step1 form={form} setForm={setForm} />}
              {step === 1 && <Step2 form={form} setForm={setForm} options={options} />}
              {step === 2 && <Step3 form={form} options={options} submitting={submitting} />}
            </form>

            {/* Footer */}
            <div style={{ display: 'flex', gap: 10, padding: '14px 24px', borderTop: '1px solid var(--border-color)', flexShrink: 0, background: 'rgba(0,0,0,0.2)' }}>
              {step > 0 ? (
                <button type="button" onClick={handleBack} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                  <ChevronLeft size={15} /> {t('common.back')}
                </button>
              ) : (
                <button type="button" onClick={closeDrawer} className="btn btn-secondary" style={{ flex: 1 }}>{t('common.cancel')}</button>
              )}

              {step < 2 ? (
                <button type="button" onClick={handleNext} className="btn btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {step === 1 ? <><Eye size={15} /> {t('pricingPromotions.stepReview')}</> : <>{t('common.next')} <ChevronRight size={15} /></>}
                </button>
              ) : (
                <button form="wizard-form" type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {submitting ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> {t('pricingPromotions.saving')}</> : <><Check size={15} /> {editingPromotion ? t('pricingPromotions.update') : t('pricingPromotions.createPromotion')}</>}
                </button>
              )}
            </div>
          </div>
        </>,
        document.body
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </>
  );
};
