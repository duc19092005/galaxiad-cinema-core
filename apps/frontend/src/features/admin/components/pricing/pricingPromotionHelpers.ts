import type {
  PricingPromotionDto,
  PricingPromotionOptionsDto,
  PricingPromotionRuleRequestDto,
  PricingPromotionUpsertDto,
  PromotionTypeName,
} from '../../../../api/pricingPromotionApi';

export interface ConditionState {
  movieFormatIds: string[];
  cinemaIds: string[];
  userSegmentIds: string[];
  promotionType: PromotionTypeName;
  adjustmentValue: number;
  timeFrom: string;
  timeTo: string;
  daysOfWeek: string[];
  isActive: boolean;
}

export interface WizardFormState {
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

export const emptyOptions: PricingPromotionOptionsDto = { formats: [], cinemas: [], auditoriums: [], membershipTiers: [] };

export const DAY_VALUES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const createCondition = (): ConditionState => ({
  movieFormatIds: [],
  cinemaIds: [],
  userSegmentIds: [],
  promotionType: 'FixedTicketPrice',
  adjustmentValue: 45000,
  timeFrom: '00:00',
  timeTo: '23:59',
  daysOfWeek: [...DAY_VALUES],
  isActive: true,
});

export const createWizardForm = (): WizardFormState => ({
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

export const getDayOptions = (t: (key: string) => string) => [
  { value: 'Monday', label: t('pricingPromotions.dayMon'), short: t('pricingPromotions.dayMon') },
  { value: 'Tuesday', label: t('pricingPromotions.dayTue'), short: t('pricingPromotions.dayTue') },
  { value: 'Wednesday', label: t('pricingPromotions.dayWed'), short: t('pricingPromotions.dayWed') },
  { value: 'Thursday', label: t('pricingPromotions.dayThu'), short: t('pricingPromotions.dayThu') },
  { value: 'Friday', label: t('pricingPromotions.dayFri'), short: t('pricingPromotions.dayFri') },
  { value: 'Saturday', label: t('pricingPromotions.daySat'), short: t('pricingPromotions.daySat') },
  { value: 'Sunday', label: t('pricingPromotions.daySun'), short: t('pricingPromotions.daySun') },
];

export const getPromotionTypes = (t: (key: string) => string): { value: PromotionTypeName; label: string; desc: string; unit: string; color: string }[] => [
  { value: 'FixedTicketPrice', label: t('pricingPromotions.fixedPrice'), desc: t('pricingPromotions.fixedPriceDesc'), unit: 'Đ', color: '#818cf8' },
  { value: 'PercentDiscount', label: t('pricingPromotions.percentDiscountLabel'), desc: t('pricingPromotions.percentDiscountDesc'), unit: '%', color: '#34d399' },
  { value: 'FixedDiscount', label: t('pricingPromotions.fixedDiscountLabel'), desc: t('pricingPromotions.fixedDiscountDesc'), unit: 'Đ', color: '#fbbf24' },
  { value: 'Surcharge', label: t('pricingPromotions.surcharge'), desc: t('pricingPromotions.surchargeDesc'), unit: '%', color: '#f87171' },
];

export const toDateInput = (v?: string | null) => (v ? v.split('T')[0] : '');
export const toTimeInput = (v?: string | null) => (v ? v.slice(0, 5) : '');
export const toApiDate = (v: string, endOfDay = false) => (!v ? null : `${v}T${endOfDay ? '23:59:59' : '00:00:00'}+07:00`);
export const toApiTime = (v?: string | null) => (!v ? null : v.length === 5 ? `${v}:00` : v);
export const formatVnd = (v?: number | null) => `${(v ?? 0).toLocaleString('vi-VN')}Đ`;

export const TYPE_STATIC_INFO: Record<string, { unit: string; color: string }> = {
  FixedTicketPrice: { unit: 'Đ', color: '#818cf8' },
  PercentDiscount: { unit: '%', color: '#34d399' },
  FixedDiscount: { unit: 'Đ', color: '#fbbf24' },
  Surcharge: { unit: '%', color: '#f87171' },
};

export const getTypeInfo = (typeName: string) => {
  const staticInfo = TYPE_STATIC_INFO[typeName];
  return staticInfo ? { value: typeName as PromotionTypeName, ...staticInfo } : undefined;
};

export const getTypeColor = (typeName: string) => TYPE_STATIC_INFO[typeName]?.color ?? '#fff';

export const TYPE_LABEL_KEYS: Record<string, string> = {
  FixedTicketPrice: 'pricingPromotions.fixedPrice',
  PercentDiscount: 'pricingPromotions.percentDiscountLabel',
  FixedDiscount: 'pricingPromotions.fixedDiscountLabel',
  Surcharge: 'pricingPromotions.surcharge',
};

export const getTypeLabel = (typeName: string, t: (key: string, options?: Record<string, unknown>) => string) => {
  const key = TYPE_LABEL_KEYS[typeName];
  return key ? t(key) : typeName;
};

export const formatValue = (val: number, type: PromotionTypeName): string => {
  const info = getTypeInfo(type);
  if (!info) return val.toString();
  if (info.unit === '%') return `${val}%`;
  return `${val.toLocaleString('vi-VN')}Đ`;
};

export const buildNaturalPreview = (
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

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== 'object' || error === null) return fallback;
  const r = (error as { response?: { data?: { message?: string; Message?: string } } }).response;
  return r?.data?.message ?? r?.data?.Message ?? fallback;
};

export const buildFormFromPromotion = (p: PricingPromotionDto): WizardFormState => {
  const groups: ConditionState[] = [];
  for (const rule of p.rules) {
    const existing = groups.find(g =>
      g.promotionType === rule.promotionTypeName &&
      g.adjustmentValue === rule.adjustmentValue &&
      g.timeFrom === toTimeInput(rule.timeFrom) &&
      g.timeTo === toTimeInput(rule.timeTo) &&
      g.isActive === rule.isActive &&
      JSON.stringify(g.daysOfWeek.slice().sort()) === JSON.stringify(rule.daysOfWeek.slice().sort())
    );
    if (existing) {
      if (rule.movieFormatId && !existing.movieFormatIds.includes(rule.movieFormatId))
        existing.movieFormatIds.push(rule.movieFormatId);
      if (rule.cinemaId && !existing.cinemaIds.includes(rule.cinemaId))
        existing.cinemaIds.push(rule.cinemaId);
      if (rule.userSegmentId && !existing.userSegmentIds.includes(rule.userSegmentId))
        existing.userSegmentIds.push(rule.userSegmentId);
    } else {
      groups.push({
        movieFormatIds: rule.movieFormatId ? [rule.movieFormatId] : [],
        cinemaIds: rule.cinemaId ? [rule.cinemaId] : [],
        userSegmentIds: rule.userSegmentId ? [rule.userSegmentId] : [],
        promotionType: rule.promotionTypeName as PromotionTypeName,
        adjustmentValue: rule.adjustmentValue,
        timeFrom: toTimeInput(rule.timeFrom),
        timeTo: toTimeInput(rule.timeTo),
        daysOfWeek: rule.daysOfWeek.length ? rule.daysOfWeek : [...DAY_VALUES],
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

export const toPayload = (form: WizardFormState): PricingPromotionUpsertDto => {
  const rules: PricingPromotionRuleRequestDto[] = form.conditions.map(cond => ({
    movieFormatIds: cond.movieFormatIds.length > 0 ? cond.movieFormatIds : [],
    cinemaIds: cond.cinemaIds.length > 0 ? cond.cinemaIds : [],
    userSegmentIds: cond.userSegmentIds.length > 0 ? cond.userSegmentIds : [],
    promotionType: cond.promotionType,
    adjustmentValue: cond.adjustmentValue,
    startDate: toApiDate(form.startDate),
    endDate: toApiDate(form.endDate, true),
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
