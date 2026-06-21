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
  { value: 'Monday', label: 'T2' },
  { value: 'Tuesday', label: 'T3' },
  { value: 'Wednesday', label: 'T4' },
  { value: 'Thursday', label: 'T5' },
  { value: 'Friday', label: 'T6' },
  { value: 'Saturday', label: 'T7' },
  { value: 'Sunday', label: 'CN' },
];

const promotionTypes: { value: PromotionTypeName; label: string; hint: string }[] = [
  { value: 'FixedTicketPrice', label: 'Đồng giá', hint: 'Thiết lập giá vé về một số tiền cố định (VND)' },
  { value: 'PercentDiscount', label: 'Giảm phần trăm', hint: 'Trừ số phần trăm (%) từ giá vé hiện tại' },
  { value: 'FixedDiscount', label: 'Giảm tiền cố định', hint: 'Trừ đi một số tiền cố định (VND)' },
  { value: 'Surcharge', label: 'Phụ thu', hint: 'Cộng thêm phần trăm (%) vào giá vé hiện tại' },
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
      showError(getErrorMessage(error, 'Không thể tải dữ liệu chiến dịch giá.'));
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
        showSuccess(response.data?.isActive ? 'Đã kích hoạt chiến dịch giá.' : 'Đã tạm ngưng chiến dịch giá.');
        fetchData();
      }
    } catch (error) {
      showError(getErrorMessage(error, 'Không thể thay đổi trạng thái chiến dịch.'));
    }
  };

  const handleDelete = async (promotion: PricingPromotionDto) => {
    if (!window.confirm(`Xóa chiến dịch "${promotion.title}"? Các vé đã đặt sẽ không bị ảnh hưởng, nhưng các suất chiếu tương lai sẽ không áp dụng quy tắc này nữa.`)) return;
    try {
      const response = await pricingPromotionApi.delete(promotion.pricingPromotionId);
      if (response.isSuccess) {
        showSuccess('Pricing campaign deleted.');
        fetchData();
      }
    } catch (error) {
      showError(getErrorMessage(error, 'Không thể xóa chiến dịch.'));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.title.trim()) {
      showError('Tên nội bộ và tiêu đề công khai không được để trống.');
      return;
    }
    if (form.rules.some((rule) => rule.adjustmentValue < 0)) {
      showError('Giá trị quy tắc không được là số âm.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = toPayload(form);
      const response = editingPromotion
        ? await pricingPromotionApi.update(editingPromotion.pricingPromotionId, payload)
        : await pricingPromotionApi.create(payload);

      if (response.isSuccess) {
        showSuccess(editingPromotion ? 'Đã cập nhật chiến dịch giá thành công.' : 'Đã tạo chiến dịch giá mới thành công.');
        setIsModalOpen(false);
        fetchData();
      }
    } catch (error) {
      showError(getErrorMessage(error, 'Lưu chiến dịch giá thất bại.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="animate-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Quy tắc Định giá & Khuyến mãi</h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Quy tắc tự động tính giá vé cho giờ vàng, ưu đãi hàng tuần và phụ thu theo điều kiện.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="badge badge-accent">{activeCount} đang hoạt động</span>
          <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Thêm Khuyến mãi
          </button>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="state-center" style={{ minHeight: '30vh' }}>
            <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              Đang tải danh sách quy tắc giá...
            </p>
          </div>
        ) : promotions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            Chưa có chiến dịch giá nào. Hãy tạo một chương trình đồng giá giờ vàng hoặc ưu đãi hàng tuần.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Chiến dịch</th>
                <th>Trạng thái</th>
                <th>Khoảng ngày</th>
                <th>Quy tắc</th>
                <th>Chính sách công khai</th>
                <th style={{ width: 180 }}>Thao tác</th>
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
                      {promotion.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                    </button>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                    <div style={{ display: 'grid', gap: 2 }}>
                      <span>Từ: {promotion.startDate ? new Date(promotion.startDate).toLocaleDateString('vi-VN') : 'Ngay lập tức'}</span>
                      <span>Đến: {promotion.endDate ? new Date(promotion.endDate).toLocaleDateString('vi-VN') : 'Không giới hạn'}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <span style={{ fontWeight: 800 }}>{promotion.rules.length} quy tắc</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {promotion.rules.slice(0, 2).map((rule) => `${getTypeLabel(rule.promotionTypeName)} ${formatVnd(rule.adjustmentValue)}`).join(' • ') || 'Không có quy tắc hoạt động'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${promotion.excludeHolidays ? 'badge-warning' : 'badge-success'}`}>
                      {promotion.excludeHolidays ? 'Loại trừ ngày lễ' : 'Áp dụng cả ngày lễ'}
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
    </div>

      {isModalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            padding: 16,
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              width: '100%', maxWidth: 680,
              backgroundColor: 'var(--bg-elevated, #18181b)',
              border: '1px solid var(--border-color, #27272a)',
              borderRadius: 20, boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color, #27272a)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <BadgePercent size={20} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {editingPromotion ? 'Chỉnh sửa Chiến dịch Giá' : 'Tạo mới Chiến dịch Giá'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={14} />
              </button>
            </div>

            <form id="pricing-promotion-form" onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '78vh', overflowY: 'auto' }}>
              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Tên nội bộ *</span>
                  <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required placeholder="happy_hour_truoc_10" />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Đường dẫn (Slug)</span>
                  <input className="input" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="happy-hour-truoc-10" />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Tiêu đề công khai *</span>
                  <input className="input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required placeholder="Giờ vàng ưu đãi giá vé" />
                </label>
              </section>

              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Ngày bắt đầu</span>
                  <input type="date" className="input" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Ngày kết thúc</span>
                  <input type="date" className="input" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Đường dẫn ảnh</span>
                  <input className="input" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="https://..." />
                </label>
              </section>

              <section style={{ display: 'grid', gap: 12 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Mô tả ngắn</span>
                  <input className="input" value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} placeholder="Hiển thị trên thẻ thông tin khuyến mãi" />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Mô tả chi tiết</span>
                  <textarea className="input" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} style={{ resize: 'vertical' }} />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Điều khoản áp dụng</span>
                  <textarea className="input" rows={3} value={form.termsAndConditions} onChange={(event) => setForm({ ...form, termsAndConditions: event.target.value })} style={{ resize: 'vertical' }} />
                </label>
              </section>

              <section style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700 }}>
                  <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} style={{ accentColor: '#ff8a00' }} />
                  Chiến dịch hoạt động
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700 }}>
                  <input type="checkbox" checked={form.excludeHolidays} onChange={(event) => setForm({ ...form, excludeHolidays: event.target.checked })} style={{ accentColor: '#ff8a00' }} />
                  Loại trừ ngày lễ
                </label>
              </section>

              <section style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 850, color: 'var(--text-primary)' }}>Quy tắc Tính toán</h4>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>Các quy tắc áp dụng theo ngày giờ chiếu thực tế (Giờ Việt Nam).</p>
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={addRule} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34 }}>
                    <Plus size={14} /> Thêm Quy tắc
                  </button>
                </div>

                {form.rules.map((rule, index) => (
                  <div key={index} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.025)', padding: 14, display: 'grid', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 850, color: 'var(--accent)' }}>Quy tắc #{index + 1}</span>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700 }}>
                          <input type="checkbox" checked={rule.isActive} onChange={(event) => updateRule(index, { isActive: event.target.checked })} style={{ accentColor: '#ff8a00' }} />
                          Hoạt động
                        </label>
                        <button type="button" onClick={() => removeRule(index)} disabled={form.rules.length === 1} className="btn" style={{ padding: '4px 10px', height: 28, minHeight: 0, borderColor: 'rgba(239, 68, 68, 0.35)', color: 'var(--danger)', opacity: form.rules.length === 1 ? 0.4 : 1 }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Định dạng</span>
                        <select className="input select" value={rule.movieFormatId ?? ''} onChange={(event) => updateRule(index, { movieFormatId: event.target.value || null })}>
                          <option value="">Tất cả định dạng</option>
                          {(options.formats || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                      </label>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Chi nhánh rạp</span>
                        <select className="input select" value={rule.cinemaId ?? ''} onChange={(event) => updateRule(index, { cinemaId: event.target.value || null })}>
                          <option value="">Tất cả rạp</option>
                          {(options.cinemas || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                      </label>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Phòng chiếu</span>
                        <select className="input select" value={rule.auditoriumId ?? ''} onChange={(event) => updateRule(index, { auditoriumId: event.target.value || null })}>
                          <option value="">Tất cả phòng</option>
                          {(options.auditoriums || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                      </label>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Phân khúc đối tượng</span>
                        <select className="input select" value={rule.requiredMembershipTierId ?? ''} onChange={(event) => updateRule(index, { requiredMembershipTierId: event.target.value || null })}>
                          <option value="">Tất cả đối tượng</option>
                          {(options.membershipTiers || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                      </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 10 }}>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Loại</span>
                        <select className="input select" value={rule.promotionType} onChange={(event) => updateRule(index, { promotionType: event.target.value as PromotionTypeName })}>
                          {promotionTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                        </select>
                      </label>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Giá trị</span>
                        <input type="number" min={0} className="input" value={rule.adjustmentValue} onChange={(event) => updateRule(index, { adjustmentValue: Number(event.target.value) || 0 })} />
                      </label>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Độ ưu tiên</span>
                        <input type="number" className="input" value={rule.priority} onChange={(event) => updateRule(index, { priority: Number(event.target.value) || 0 })} />
                      </label>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Từ giờ</span>
                        <input type="time" className="input" value={toTimeInput(rule.timeFrom)} onChange={(event) => updateRule(index, { timeFrom: event.target.value })} />
                      </label>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Đến giờ</span>
                        <input type="time" className="input" value={toTimeInput(rule.timeTo)} onChange={(event) => updateRule(index, { timeTo: event.target.value })} />
                      </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Bắt đầu quy tắc</span>
                        <input type="date" className="input" value={typeof rule.startDate === 'string' ? toDateInput(rule.startDate) : ''} onChange={(event) => updateRule(index, { startDate: event.target.value })} />
                      </label>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Kết thúc quy tắc</span>
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
                <div style={{ display: 'flex', gap: 12, marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border-color, #27272a)' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                    Hủy
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                    {submitting ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang lưu...</> : <><Check size={16} /> Lưu quy tắc</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </>
  );
};
