import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BadgePercent,
  Ban,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
} from 'lucide-react';
import type { PricingPromotionOptionsDto } from '../../../../api/pricingPromotionApi';
import {
  buildNaturalPreview,
  createCondition,
  getTypeColor,
  type ConditionState,
  type WizardFormState,
} from './pricingPromotionHelpers';
import { ConditionCard, FieldLabel, ToggleButton } from './ConditionCard';

export const StepIndicator: React.FC<{ step: number; total: number; labels: string[] }> = ({ step, total, labels }) => (
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

export const Step1: React.FC<{ form: WizardFormState; setForm: React.Dispatch<React.SetStateAction<WizardFormState>> }> = ({ form, setForm }) => {
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

export const Step2: React.FC<{
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

export const Step3: React.FC<{
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
