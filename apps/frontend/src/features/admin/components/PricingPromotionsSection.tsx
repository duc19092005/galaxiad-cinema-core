import React, { useEffect, useMemo, useState, type FormEvent } from 'react';
import { BadgePercent, Check, Edit2, Loader2, Plus, Trash2, X } from 'lucide-react';
import {
  pricingPromotionApi,
  type PricingPromotionDto,
  type PricingPromotionOptionsDto,
  type PricingPromotionRuleRequestDto,
  type PricingPromotionUpsertDto,
  type PromotionTypeName,
} from '../../../api/pricingPromotionApi';
import { showError, showSuccess } from '../../../utils/ToastUtils';

const dayOptions = [
  { value: 'Monday', label: 'Mon' },
  { value: 'Tuesday', label: 'Tue' },
  { value: 'Wednesday', label: 'Wed' },
  { value: 'Thursday', label: 'Thu' },
  { value: 'Friday', label: 'Fri' },
  { value: 'Saturday', label: 'Sat' },
  { value: 'Sunday', label: 'Sun' },
];

const promotionTypes: { value: PromotionTypeName; label: string; hint: string }[] = [
  { value: 'FixedTicketPrice', label: 'Fixed price', hint: 'Set ticket to exact VND' },
  { value: 'PercentDiscount', label: 'Percent off', hint: 'Subtract % from current price' },
  { value: 'FixedDiscount', label: 'Fixed off', hint: 'Subtract VND amount' },
  { value: 'Surcharge', label: 'Surcharge', hint: 'Add % to current price' },
];

interface PromotionFormState {
  name: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  termsAndConditions: string;
  imageUrl: string;
  isActive: boolean;
  excludeHolidays: boolean;
  startDate: string;
  endDate: string;
  rules: PricingPromotionRuleRequestDto[];
}

const emptyOptions: PricingPromotionOptionsDto = {
  formats: [],
  cinemas: [],
  auditoriums: [],
  membershipTiers: [],
};

const createRule = (): PricingPromotionRuleRequestDto => ({
  movieFormatId: null,
  cinemaId: null,
  auditoriumId: null,
  requiredMembershipTierId: null,
  promotionType: 'FixedTicketPrice',
  adjustmentValue: 45000,
  startDate: null,
  endDate: null,
  timeFrom: '00:00:00',
  timeTo: '23:59:59',
  daysOfWeek: dayOptions.map((day) => day.value),
  priority: 100,
  isActive: true,
});

const createForm = (): PromotionFormState => ({
  name: '',
  slug: '',
  title: '',
  shortDescription: '',
  description: '',
  termsAndConditions: '',
  imageUrl: '',
  isActive: true,
  excludeHolidays: true,
  startDate: '',
  endDate: '',
  rules: [createRule()],
});

const toDateInput = (value?: string | null) => (value ? value.split('T')[0] : '');

const toTimeInput = (value?: string | null) => {
  if (!value) return '';
  return value.slice(0, 5);
};

const toApiDate = (value: string, endOfDay = false) => {
  if (!value) return null;
  return `${value}T${endOfDay ? '23:59:59' : '00:00:00'}+07:00`;
};

const toApiTime = (value?: string | null) => {
  if (!value) return null;
  return value.length === 5 ? `${value}:00` : value;
};

const formatVnd = (value?: number | null) => `${(value ?? 0).toLocaleString('vi-VN')} VND`;

const getTypeLabel = (type: string) => promotionTypes.find((item) => item.value === type)?.label ?? type;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== 'object' || error === null) return fallback;
  const response = (error as { response?: { data?: { message?: string; Message?: string } } }).response;
  return response?.data?.message ?? response?.data?.Message ?? fallback;
};

const buildFormFromPromotion = (promotion: PricingPromotionDto): PromotionFormState => ({
  name: promotion.name,
  slug: promotion.slug,
  title: promotion.title,
  shortDescription: promotion.shortDescription ?? '',
  description: promotion.description ?? '',
  termsAndConditions: promotion.termsAndConditions ?? '',
  imageUrl: promotion.imageUrl ?? '',
  isActive: promotion.isActive,
  excludeHolidays: promotion.excludeHolidays,
  startDate: toDateInput(promotion.startDate),
  endDate: toDateInput(promotion.endDate),
  rules: promotion.rules.length
    ? promotion.rules.map((rule) => ({
        pricingPromotionRuleId: rule.pricingPromotionRuleId,
        movieFormatId: rule.movieFormatId,
        cinemaId: rule.cinemaId,
        auditoriumId: rule.auditoriumId,
        requiredMembershipTierId: rule.requiredMembershipTierId,
        promotionType: rule.promotionTypeName as PromotionTypeName,
        adjustmentValue: rule.adjustmentValue,
        startDate: toDateInput(rule.startDate),
        endDate: toDateInput(rule.endDate),
        timeFrom: toTimeInput(rule.timeFrom),
        timeTo: toTimeInput(rule.timeTo),
        daysOfWeek: rule.daysOfWeek.length ? rule.daysOfWeek : dayOptions.map((day) => day.value),
        priority: rule.priority,
        isActive: rule.isActive,
      }))
    : [createRule()],
});

const toPayload = (form: PromotionFormState): PricingPromotionUpsertDto => ({
  name: form.name.trim(),
  slug: form.slug.trim() || null,
  title: form.title.trim(),
  shortDescription: form.shortDescription.trim() || null,
  description: form.description.trim() || null,
  termsAndConditions: form.termsAndConditions.trim() || null,
  imageUrl: form.imageUrl.trim() || null,
  isActive: form.isActive,
  excludeHolidays: form.excludeHolidays,
  startDate: toApiDate(form.startDate),
  endDate: toApiDate(form.endDate, true),
  rules: form.rules.map((rule) => ({
    ...rule,
    movieFormatId: rule.movieFormatId || null,
    cinemaId: rule.cinemaId || null,
    auditoriumId: rule.auditoriumId || null,
    requiredMembershipTierId: rule.requiredMembershipTierId || null,
    startDate: typeof rule.startDate === 'string' ? toApiDate(rule.startDate) : null,
    endDate: typeof rule.endDate === 'string' ? toApiDate(rule.endDate, true) : null,
    timeFrom: toApiTime(rule.timeFrom),
    timeTo: toApiTime(rule.timeTo),
    daysOfWeek: rule.daysOfWeek.length ? rule.daysOfWeek : dayOptions.map((day) => day.value),
    adjustmentValue: Number(rule.adjustmentValue) || 0,
    priority: Number(rule.priority) || 0,
  })),
});

export const PricingPromotionsSection: React.FC = () => {
  const [promotions, setPromotions] = useState<PricingPromotionDto[]>([]);
  const [options, setOptions] = useState<PricingPromotionOptionsDto>(emptyOptions);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<PricingPromotionDto | null>(null);
  const [form, setForm] = useState<PromotionFormState>(createForm);

  const activeCount = useMemo(() => promotions.filter((promotion) => promotion.isActive).length, [promotions]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [promotionRes, optionsRes] = await Promise.all([
        pricingPromotionApi.getAll(),
        pricingPromotionApi.getOptions(),
      ]);
      if (promotionRes.isSuccess) setPromotions(promotionRes.data || []);
      if (optionsRes.isSuccess) setOptions(optionsRes.data || emptyOptions);
    } catch (error) {
      showError(getErrorMessage(error, 'Failed to load pricing promotion data.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditingPromotion(null);
    setForm(createForm());
    setIsModalOpen(true);
  };

  const openEdit = (promotion: PricingPromotionDto) => {
    setEditingPromotion(promotion);
    setForm(buildFormFromPromotion(promotion));
    setIsModalOpen(true);
  };

  const updateRule = (index: number, patch: Partial<PricingPromotionRuleRequestDto>) => {
    setForm((current) => ({
      ...current,
      rules: current.rules.map((rule, ruleIndex) => (ruleIndex === index ? { ...rule, ...patch } : rule)),
    }));
  };

  const toggleRuleDay = (index: number, day: string) => {
    const rule = form.rules[index];
    if (!rule) return;
    const hasDay = rule.daysOfWeek.includes(day);
    const daysOfWeek = hasDay
      ? rule.daysOfWeek.filter((item) => item !== day)
      : [...rule.daysOfWeek, day];
    updateRule(index, { daysOfWeek });
  };

  const addRule = () => {
    setForm((current) => ({ ...current, rules: [...current.rules, createRule()] }));
  };

  const removeRule = (index: number) => {
    setForm((current) => ({
      ...current,
      rules: current.rules.length === 1 ? current.rules : current.rules.filter((_, ruleIndex) => ruleIndex !== index),
    }));
  };

  const handleToggle = async (promotion: PricingPromotionDto) => {
    try {
      const response = await pricingPromotionApi.toggle(promotion.pricingPromotionId);
      if (response.isSuccess) {
        showSuccess(response.data?.isActive ? 'Promotion enabled.' : 'Promotion disabled.');
        fetchData();
      }
    } catch (error) {
      showError(getErrorMessage(error, 'Failed to toggle promotion.'));
    }
  };

  const handleDelete = async (promotion: PricingPromotionDto) => {
    if (!window.confirm(`Delete "${promotion.title}"? Booking snapshots stay unchanged, but future pricing will ignore it.`)) return;
    try {
      const response = await pricingPromotionApi.delete(promotion.pricingPromotionId);
      if (response.isSuccess) {
        showSuccess('Pricing promotion deleted.');
        fetchData();
      }
    } catch (error) {
      showError(getErrorMessage(error, 'Failed to delete promotion.'));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.title.trim()) {
      showError('Name and title are required.');
      return;
    }
    if (form.rules.some((rule) => rule.adjustmentValue < 0)) {
      showError('Rule value cannot be negative.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = toPayload(form);
      const response = editingPromotion
        ? await pricingPromotionApi.update(editingPromotion.pricingPromotionId, payload)
        : await pricingPromotionApi.create(payload);

      if (response.isSuccess) {
        showSuccess(editingPromotion ? 'Pricing promotion updated.' : 'Pricing promotion created.');
        setIsModalOpen(false);
        fetchData();
      }
    } catch (error) {
      showError(getErrorMessage(error, 'Failed to save pricing promotion.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Pricing Promotions</h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Automatic ticket pricing rules for happy hours, weekly deals, and surcharge windows.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="badge badge-accent">{activeCount} active</span>
          <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> New Promotion
          </button>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="state-center" style={{ minHeight: '30vh' }}>
            <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              Loading pricing promotions...
            </p>
          </div>
        ) : promotions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            No pricing promotions yet. Create one for happy-hour or weekly ticket pricing.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Status</th>
                <th>Date Range</th>
                <th>Rules</th>
                <th>Public Policy</th>
                <th style={{ width: 180 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promotion) => (
                <tr key={promotion.pricingPromotionId}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 340 }}>
                      <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{promotion.title}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {promotion.shortDescription || promotion.name}
                      </span>
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggle(promotion)}
                      className={`badge ${promotion.isActive ? 'badge-success' : 'badge-default'}`}
                      style={{ border: 'none', cursor: 'pointer' }}
                    >
                      {promotion.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                    <div style={{ display: 'grid', gap: 2 }}>
                      <span>From: {promotion.startDate ? new Date(promotion.startDate).toLocaleDateString('vi-VN') : 'Immediate'}</span>
                      <span>To: {promotion.endDate ? new Date(promotion.endDate).toLocaleDateString('vi-VN') : 'Unlimited'}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <span style={{ fontWeight: 800 }}>{promotion.rules.length} rule(s)</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {promotion.rules.slice(0, 2).map((rule) => `${getTypeLabel(rule.promotionTypeName)} ${formatVnd(rule.adjustmentValue)}`).join(' • ') || 'No active rule'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${promotion.excludeHolidays ? 'badge-warning' : 'badge-success'}`}>
                      {promotion.excludeHolidays ? 'Excludes holidays' : 'Includes holidays'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => openEdit(promotion)}
                        className="btn"
                        style={{ padding: '4px 10px', fontSize: 12, height: 28, minHeight: 0, borderColor: 'rgba(99, 102, 241, 0.4)', color: '#818cf8', background: 'rgba(99, 102, 241, 0.05)' }}
                        aria-label="Edit promotion"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(promotion)}
                        className="btn"
                        style={{ padding: '4px 10px', fontSize: 12, height: 28, minHeight: 0, borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)' }}
                        aria-label="Delete promotion"
                      >
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

      {isModalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.74)', backdropFilter: 'blur(8px)', padding: 16 }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{ width: '100%', maxWidth: 980, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-elevated, #18181b)', border: '1px solid var(--border-color, #27272a)', borderRadius: 'var(--radius-xl, 20px)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <BadgePercent size={20} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: 18, fontWeight: 850, margin: 0, color: 'var(--text-primary)' }}>
                  {editingPromotion ? 'Edit Pricing Promotion' : 'Create Pricing Promotion'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ width: 30, height: 30, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={15} />
              </button>
            </div>

            <form id="pricing-promotion-form" onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: 22, display: 'grid', gap: 18 }}>
              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Internal Name *</span>
                  <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required placeholder="happy_hour_before_10" />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Slug</span>
                  <input className="input" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="happy-hour-before-10" />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Public Title *</span>
                  <input className="input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required placeholder="Happy Hour Ticket Deal" />
                </label>
              </section>

              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Start Date</span>
                  <input type="date" className="input" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>End Date</span>
                  <input type="date" className="input" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Image URL</span>
                  <input className="input" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="https://..." />
                </label>
              </section>

              <section style={{ display: 'grid', gap: 12 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Short Description</span>
                  <input className="input" value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} placeholder="Shown on promotion cards" />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Description</span>
                  <textarea className="input" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} style={{ resize: 'vertical' }} />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Terms & Conditions</span>
                  <textarea className="input" rows={3} value={form.termsAndConditions} onChange={(event) => setForm({ ...form, termsAndConditions: event.target.value })} style={{ resize: 'vertical' }} />
                </label>
              </section>

              <section style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700 }}>
                  <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} style={{ accentColor: '#ff8a00' }} />
                  Active campaign
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700 }}>
                  <input type="checkbox" checked={form.excludeHolidays} onChange={(event) => setForm({ ...form, excludeHolidays: event.target.checked })} style={{ accentColor: '#ff8a00' }} />
                  Exclude holidays
                </label>
              </section>

              <section style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 850, color: 'var(--text-primary)' }}>Calculation Rules</h4>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>Rules match Vietnam local schedule date/time.</p>
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={addRule} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34 }}>
                    <Plus size={14} /> Add Rule
                  </button>
                </div>

                {form.rules.map((rule, index) => (
                  <div key={index} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.025)', padding: 14, display: 'grid', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 850, color: 'var(--accent)' }}>Rule #{index + 1}</span>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700 }}>
                          <input type="checkbox" checked={rule.isActive} onChange={(event) => updateRule(index, { isActive: event.target.checked })} style={{ accentColor: '#ff8a00' }} />
                          Active
                        </label>
                        <button type="button" onClick={() => removeRule(index)} disabled={form.rules.length === 1} className="btn" style={{ padding: '4px 10px', height: 28, minHeight: 0, borderColor: 'rgba(239, 68, 68, 0.35)', color: 'var(--danger)', opacity: form.rules.length === 1 ? 0.4 : 1 }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Format</span>
                        <select className="input select" value={rule.movieFormatId ?? ''} onChange={(event) => updateRule(index, { movieFormatId: event.target.value || null })}>
                          <option value="">All formats</option>
                          {options.formats.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                      </label>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Cinema</span>
                        <select className="input select" value={rule.cinemaId ?? ''} onChange={(event) => updateRule(index, { cinemaId: event.target.value || null })}>
                          <option value="">All cinemas</option>
                          {options.cinemas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                      </label>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Auditorium</span>
                        <select className="input select" value={rule.auditoriumId ?? ''} onChange={(event) => updateRule(index, { auditoriumId: event.target.value || null })}>
                          <option value="">All auditoriums</option>
                          {options.auditoriums.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                      </label>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Customer Segment</span>
                        <select className="input select" value={rule.requiredMembershipTierId ?? ''} onChange={(event) => updateRule(index, { requiredMembershipTierId: event.target.value || null })}>
                          <option value="">All segments</option>
                          {options.membershipTiers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                      </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 10 }}>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Type</span>
                        <select className="input select" value={rule.promotionType} onChange={(event) => updateRule(index, { promotionType: event.target.value as PromotionTypeName })}>
                          {promotionTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                        </select>
                      </label>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Value</span>
                        <input type="number" min={0} className="input" value={rule.adjustmentValue} onChange={(event) => updateRule(index, { adjustmentValue: Number(event.target.value) || 0 })} />
                      </label>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Priority</span>
                        <input type="number" className="input" value={rule.priority} onChange={(event) => updateRule(index, { priority: Number(event.target.value) || 0 })} />
                      </label>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>From Time</span>
                        <input type="time" className="input" value={toTimeInput(rule.timeFrom)} onChange={(event) => updateRule(index, { timeFrom: event.target.value })} />
                      </label>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>To Time</span>
                        <input type="time" className="input" value={toTimeInput(rule.timeTo)} onChange={(event) => updateRule(index, { timeTo: event.target.value })} />
                      </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Rule Start</span>
                        <input type="date" className="input" value={typeof rule.startDate === 'string' ? toDateInput(rule.startDate) : ''} onChange={(event) => updateRule(index, { startDate: event.target.value })} />
                      </label>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Rule End</span>
                        <input type="date" className="input" value={typeof rule.endDate === 'string' ? toDateInput(rule.endDate) : ''} onChange={(event) => updateRule(index, { endDate: event.target.value })} />
                      </label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {dayOptions.map((day) => {
                        const checked = rule.daysOfWeek.includes(day.value);
                        return (
                          <button
                            type="button"
                            key={day.value}
                            onClick={() => toggleRuleDay(index, day.value)}
                            style={{
                              minWidth: 46,
                              height: 32,
                              borderRadius: 999,
                              border: checked ? '1px solid rgba(255,138,0,0.55)' : '1px solid rgba(255,255,255,0.1)',
                              background: checked ? 'rgba(255,138,0,0.14)' : 'rgba(255,255,255,0.025)',
                              color: checked ? 'var(--accent)' : 'var(--text-secondary)',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>

                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {promotionTypes.find((item) => item.value === rule.promotionType)?.hint}
                    </span>
                  </div>
                ))}
              </section>
            </form>

            <div style={{ padding: '14px 22px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button form="pricing-promotion-form" type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                {submitting ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Check size={16} /> Save Promotion</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
