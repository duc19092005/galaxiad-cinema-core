import React, { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { BadgePercent, Check, Edit2, Loader2, Plus, Trash2, X, ChevronDown, ChevronUp, Calendar, Settings2, Tag, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
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

const promotionTypes: { value: PromotionTypeName; label: string; hint: string; color: string }[] = [
  { value: 'FixedTicketPrice', label: 'Đồng giá', hint: 'Thiết lập giá vé về một số tiền cố định (VND)', color: '#818cf8' },
  { value: 'PercentDiscount', label: 'Giảm %', hint: 'Trừ số phần trăm (%) từ giá vé hiện tại', color: '#34d399' },
  { value: 'FixedDiscount', label: 'Giảm tiền', hint: 'Trừ đi một số tiền cố định (VND)', color: '#fbbf24' },
  { value: 'Surcharge', label: 'Phụ thu', hint: 'Cộng thêm phần trăm (%) vào giá vé hiện tại', color: '#f87171' },
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
const getTypeColor = (type: string) => promotionTypes.find((item) => item.value === type)?.color ?? '#fff';

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

// ─── Reusable styled sub-components ────────────────────────────────────────

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'rgba(255,138,0,0.1)', color: 'var(--accent)' }}>
      {icon}
    </span>
    <div>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{title}</p>
      {subtitle && <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{subtitle}</p>}
    </div>
  </div>
);

const FieldLabel: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <label style={{ display: 'grid', gap: 5 }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}{required && <span style={{ color: 'var(--accent)', marginLeft: 3 }}>*</span>}
    </span>
    {children}
  </label>
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
      borderRadius: 10,
      border: `1px solid ${checked ? 'rgba(255,138,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
      background: checked ? 'rgba(255,138,0,0.08)' : 'rgba(255,255,255,0.03)',
      cursor: 'pointer',
      transition: 'all 0.2s',
      flex: 1,
    }}
  >
    {checked
      ? <ToggleRight size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
      : <ToggleLeft size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    }
    <span style={{ fontSize: 13, fontWeight: 700, color: checked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{label}</span>
  </button>
);

// ─── Rule Card Component ────────────────────────────────────────────────────

const RuleCard: React.FC<{
  rule: PricingPromotionRuleRequestDto;
  index: number;
  options: PricingPromotionOptionsDto;
  total: number;
  onUpdate: (patch: Partial<PricingPromotionRuleRequestDto>) => void;
  onToggleDay: (day: string) => void;
  onRemove: () => void;
}> = ({ rule, index, options, total, onUpdate, onToggleDay, onRemove }) => {
  const [collapsed, setCollapsed] = useState(false);
  const typeInfo = promotionTypes.find(t => t.value === rule.promotionType);

  return (
    <div style={{
      border: `1px solid ${rule.isActive ? 'rgba(255,138,0,0.2)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 12,
      background: rule.isActive ? 'rgba(255,138,0,0.04)' : 'rgba(255,255,255,0.02)',
      overflow: 'hidden',
      transition: 'all 0.2s',
    }}>
      {/* Rule header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 10px', borderRadius: 999, background: `${getTypeColor(rule.promotionType)}18`, color: getTypeColor(rule.promotionType), border: `1px solid ${getTypeColor(rule.promotionType)}40` }}>
          Quy tắc #{index + 1} · {typeInfo?.label}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', flex: 1 }}>
          {rule.adjustmentValue.toLocaleString('vi-VN')}{rule.promotionType === 'PercentDiscount' || rule.promotionType === 'Surcharge' ? '%' : ' đ'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => onUpdate({ isActive: !rule.isActive })}
            style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, border: `1px solid ${rule.isActive ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)'}`, background: rule.isActive ? 'rgba(52,211,153,0.1)' : 'transparent', color: rule.isActive ? '#34d399' : 'var(--text-muted)', cursor: 'pointer' }}
          >
            {rule.isActive ? 'Bật' : 'Tắt'}
          </button>
          <button type="button" onClick={() => setCollapsed(c => !c)} style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
          <button type="button" onClick={onRemove} disabled={total === 1} style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: 'var(--danger)', cursor: total === 1 ? 'not-allowed' : 'pointer', opacity: total === 1 ? 0.35 : 1 }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Rule body */}
      {!collapsed && (
        <div style={{ padding: '14px', display: 'grid', gap: 14 }}>
          {/* Type + Value + Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <FieldLabel label="Loại điều chỉnh">
              <select className="input select" value={rule.promotionType} onChange={(e) => onUpdate({ promotionType: e.target.value as PromotionTypeName })}>
                {promotionTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </FieldLabel>
            <FieldLabel label={rule.promotionType === 'PercentDiscount' || rule.promotionType === 'Surcharge' ? 'Giá trị (%)' : 'Giá trị (VND)'}>
              <input type="number" min={0} className="input" value={rule.adjustmentValue} onChange={(e) => onUpdate({ adjustmentValue: Number(e.target.value) || 0 })} />
            </FieldLabel>
            <FieldLabel label="Độ ưu tiên">
              <input type="number" className="input" value={rule.priority} onChange={(e) => onUpdate({ priority: Number(e.target.value) || 0 })} />
            </FieldLabel>
          </div>

          {/* Hint */}
          <p style={{ margin: 0, fontSize: 11, color: getTypeColor(rule.promotionType), padding: '6px 10px', borderRadius: 6, background: `${getTypeColor(rule.promotionType)}10`, border: `1px solid ${getTypeColor(rule.promotionType)}20` }}>
            💡 {typeInfo?.hint}
          </p>

          {/* Scope filters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            <FieldLabel label="Định dạng phim">
              <select className="input select" value={rule.movieFormatId ?? ''} onChange={(e) => onUpdate({ movieFormatId: e.target.value || null })}>
                <option value="">Tất cả định dạng</option>
                {(options.formats || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </FieldLabel>
            <FieldLabel label="Chi nhánh rạp">
              <select className="input select" value={rule.cinemaId ?? ''} onChange={(e) => onUpdate({ cinemaId: e.target.value || null })}>
                <option value="">Tất cả rạp</option>
                {(options.cinemas || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </FieldLabel>
            <FieldLabel label="Phòng chiếu">
              <select className="input select" value={rule.auditoriumId ?? ''} onChange={(e) => onUpdate({ auditoriumId: e.target.value || null })}>
                <option value="">Tất cả phòng</option>
                {(options.auditoriums || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </FieldLabel>
            <FieldLabel label="Phân khúc thành viên">
              <select className="input select" value={rule.requiredMembershipTierId ?? ''} onChange={(e) => onUpdate({ requiredMembershipTierId: e.target.value || null })}>
                <option value="">Tất cả đối tượng</option>
                {(options.membershipTiers || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </FieldLabel>
          </div>

          {/* Time range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
            <FieldLabel label="Từ giờ">
              <input type="time" className="input" value={toTimeInput(rule.timeFrom)} onChange={(e) => onUpdate({ timeFrom: e.target.value })} />
            </FieldLabel>
            <FieldLabel label="Đến giờ">
              <input type="time" className="input" value={toTimeInput(rule.timeTo)} onChange={(e) => onUpdate({ timeTo: e.target.value })} />
            </FieldLabel>
            <FieldLabel label="Bắt đầu quy tắc">
              <input type="date" className="input" value={typeof rule.startDate === 'string' ? toDateInput(rule.startDate) : ''} onChange={(e) => onUpdate({ startDate: e.target.value })} />
            </FieldLabel>
            <FieldLabel label="Kết thúc quy tắc">
              <input type="date" className="input" value={typeof rule.endDate === 'string' ? toDateInput(rule.endDate) : ''} onChange={(e) => onUpdate({ endDate: e.target.value })} />
            </FieldLabel>
          </div>

          {/* Days of week */}
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Áp dụng vào các ngày</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {dayOptions.map((day) => {
                const active = rule.daysOfWeek.includes(day.value);
                return (
                  <button
                    type="button"
                    key={day.value}
                    onClick={() => onToggleDay(day.value)}
                    style={{
                      minWidth: 44, height: 34, borderRadius: 8, fontWeight: 800, fontSize: 12, cursor: 'pointer',
                      border: active ? '1px solid rgba(255,138,0,0.5)' : '1px solid rgba(255,255,255,0.1)',
                      background: active ? 'rgba(255,138,0,0.14)' : 'rgba(255,255,255,0.03)',
                      color: active ? 'var(--accent)' : 'var(--text-muted)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {day.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  const allSelected = dayOptions.every(d => rule.daysOfWeek.includes(d.value));
                  onUpdate({ daysOfWeek: allSelected ? [] : dayOptions.map(d => d.value) });
                }}
                style={{ padding: '0 12px', height: 34, borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-muted)', transition: 'all 0.15s' }}
              >
                {dayOptions.every(d => rule.daysOfWeek.includes(d.value)) ? 'Bỏ tất cả' : 'Chọn tất cả'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────

export const PricingPromotionsSection: React.FC = () => {
  const [promotions, setPromotions] = useState<PricingPromotionDto[]>([]);
  const [options, setOptions] = useState<PricingPromotionOptionsDto>(emptyOptions);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<PricingPromotionDto | null>(null);
  const [form, setForm] = useState<PromotionFormState>(createForm);

  const activeCount = useMemo(() => promotions.filter((p) => p.isActive).length, [promotions]);

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

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditingPromotion(null); setForm(createForm()); setIsDrawerOpen(true); };
  const openEdit = (p: PricingPromotionDto) => { setEditingPromotion(p); setForm(buildFormFromPromotion(p)); setIsDrawerOpen(true); };
  const closeDrawer = () => setIsDrawerOpen(false);

  const updateRule = (index: number, patch: Partial<PricingPromotionRuleRequestDto>) => {
    setForm((cur) => ({ ...cur, rules: cur.rules.map((r, i) => i === index ? { ...r, ...patch } : r) }));
  };

  const toggleRuleDay = (index: number, day: string) => {
    const rule = form.rules[index];
    if (!rule) return;
    const daysOfWeek = rule.daysOfWeek.includes(day)
      ? rule.daysOfWeek.filter((d) => d !== day)
      : [...rule.daysOfWeek, day];
    updateRule(index, { daysOfWeek });
  };

  const addRule = () => setForm((cur) => ({ ...cur, rules: [...cur.rules, createRule()] }));
  const removeRule = (index: number) => setForm((cur) => ({ ...cur, rules: cur.rules.length === 1 ? cur.rules : cur.rules.filter((_, i) => i !== index) }));

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
      if (response.isSuccess) { showSuccess('Đã xóa chiến dịch giá.'); fetchData(); }
    } catch (error) {
      showError(getErrorMessage(error, 'Không thể xóa chiến dịch.'));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.title.trim()) { showError('Tên nội bộ và tiêu đề công khai không được để trống.'); return; }
    if (form.rules.some((r) => r.adjustmentValue < 0)) { showError('Giá trị quy tắc không được là số âm.'); return; }
    setSubmitting(true);
    try {
      const payload = toPayload(form);
      const response = editingPromotion
        ? await pricingPromotionApi.update(editingPromotion.pricingPromotionId, payload)
        : await pricingPromotionApi.create(payload);
      if (response.isSuccess) {
        showSuccess(editingPromotion ? 'Đã cập nhật chiến dịch giá thành công.' : 'Đã tạo chiến dịch giá mới thành công.');
        closeDrawer();
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
        {/* Page header */}
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

        {/* Table */}
        <div className="table-container">
          {loading ? (
            <div className="state-center" style={{ minHeight: '30vh' }}>
              <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>Đang tải danh sách quy tắc giá...</p>
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
                  <th style={{ width: 100 }}>Thao tác</th>
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
                      <button onClick={() => handleToggle(promotion)} className={`badge ${promotion.isActive ? 'badge-success' : 'badge-default'}`} style={{ border: 'none', cursor: 'pointer' }}>
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
                      <div style={{ display: 'grid', gap: 4 }}>
                        <span style={{ fontWeight: 800 }}>{promotion.rules.length} quy tắc</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {promotion.rules.slice(0, 2).map((rule, i) => (
                            <span key={i} style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: `${getTypeColor(rule.promotionTypeName)}15`, color: getTypeColor(rule.promotionTypeName), border: `1px solid ${getTypeColor(rule.promotionTypeName)}30` }}>
                              {getTypeLabel(rule.promotionTypeName)} · {formatVnd(rule.adjustmentValue)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${promotion.excludeHolidays ? 'badge-warning' : 'badge-success'}`}>
                        {promotion.excludeHolidays ? 'Loại trừ ngày lễ' : 'Áp dụng cả ngày lễ'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(promotion)} className="btn" style={{ padding: '4px 10px', fontSize: 12, height: 28, minHeight: 0, borderColor: 'rgba(99,102,241,0.4)', color: '#818cf8', background: 'rgba(99,102,241,0.05)' }} aria-label="Edit promotion">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => handleDelete(promotion)} className="btn" style={{ padding: '4px 10px', fontSize: 12, height: 28, minHeight: 0, borderColor: 'rgba(239,68,68,0.4)', color: 'var(--danger)', background: 'rgba(239,68,68,0.05)' }} aria-label="Delete promotion">
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

      {/* ── Slide-over Drawer ── */}
      {isDrawerOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            onClick={closeDrawer}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease' }}
          />

          {/* Drawer panel */}
          <div
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1001,
              width: 'min(780px, 95vw)',
              backgroundColor: 'var(--bg-elevated, #18181b)',
              borderLeft: '1px solid var(--border-color, #27272a)',
              boxShadow: '-24px 0 80px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column',
              animation: 'slideInRight 0.25s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {/* Drawer header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid var(--border-color)', flexShrink: 0, background: 'rgba(255,138,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 10, background: 'rgba(255,138,0,0.12)' }}>
                  <BadgePercent size={20} style={{ color: 'var(--accent)' }} />
                </span>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    {editingPromotion ? 'Chỉnh sửa Chiến dịch Giá' : 'Tạo mới Chiến dịch Giá'}
                  </h3>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>
                    {editingPromotion ? `Đang chỉnh sửa: ${editingPromotion.name}` : 'Điền thông tin để tạo chương trình khuyến mãi mới'}
                  </p>
                </div>
              </div>
              <button onClick={closeDrawer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={15} />
              </button>
            </div>

            {/* Drawer form body */}
            <form id="pricing-promotion-form" onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* ① Basic info */}
              <div style={{ display: 'grid', gap: 16, padding: 18, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <SectionHeader icon={<Tag size={15} />} title="Thông tin cơ bản" subtitle="Tên nội bộ và tiêu đề hiển thị công khai" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <FieldLabel label="Tên nội bộ" required>
                    <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="happy_hour_truoc_10" />
                  </FieldLabel>
                  <FieldLabel label="Đường dẫn (Slug)">
                    <input className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="happy-hour-truoc-10" />
                  </FieldLabel>
                </div>
                <FieldLabel label="Tiêu đề công khai" required>
                  <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Giờ vàng ưu đãi giá vé" />
                </FieldLabel>
              </div>

              {/* ② Timeline */}
              <div style={{ display: 'grid', gap: 16, padding: 18, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <SectionHeader icon={<Calendar size={15} />} title="Thời gian hiệu lực" subtitle="Bỏ trống để áp dụng ngay và không giới hạn" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <FieldLabel label="Ngày bắt đầu">
                    <input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                  </FieldLabel>
                  <FieldLabel label="Ngày kết thúc">
                    <input type="date" className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                  </FieldLabel>
                  <FieldLabel label="Ảnh Banner (URL)">
                    <input className="input" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
                  </FieldLabel>
                </div>
              </div>

              {/* ③ Content */}
              <div style={{ display: 'grid', gap: 16, padding: 18, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <SectionHeader icon={<FileText size={15} />} title="Nội dung mô tả" subtitle="Hiển thị trên trang khuyến mãi công khai" />
                <FieldLabel label="Mô tả ngắn">
                  <input className="input" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} placeholder="Hiển thị trên thẻ thông tin khuyến mãi" />
                </FieldLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <FieldLabel label="Mô tả chi tiết">
                    <textarea className="input" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
                  </FieldLabel>
                  <FieldLabel label="Điều khoản áp dụng">
                    <textarea className="input" rows={4} value={form.termsAndConditions} onChange={(e) => setForm({ ...form, termsAndConditions: e.target.value })} style={{ resize: 'vertical' }} />
                  </FieldLabel>
                </div>
              </div>

              {/* ④ Settings toggles */}
              <div style={{ display: 'grid', gap: 16, padding: 18, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <SectionHeader icon={<Settings2 size={15} />} title="Cài đặt" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="Chiến dịch hoạt động" />
                  <Toggle checked={form.excludeHolidays} onChange={(v) => setForm({ ...form, excludeHolidays: v })} label="Loại trừ ngày lễ" />
                </div>
              </div>

              {/* ⑤ Rules */}
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Quy tắc Tính toán</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>Các quy tắc áp dụng theo ngày giờ chiếu thực tế (Giờ Việt Nam)</p>
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={addRule} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, flexShrink: 0 }}>
                    <Plus size={14} /> Thêm Quy tắc
                  </button>
                </div>
                {form.rules.map((rule, index) => (
                  <RuleCard
                    key={index}
                    rule={rule}
                    index={index}
                    options={options}
                    total={form.rules.length}
                    onUpdate={(patch) => updateRule(index, patch)}
                    onToggleDay={(day) => toggleRuleDay(index, day)}
                    onRemove={() => removeRule(index)}
                  />
                ))}
              </div>
            </form>

            {/* Drawer footer */}
            <div style={{ display: 'flex', gap: 12, padding: '16px 24px', borderTop: '1px solid var(--border-color)', flexShrink: 0, background: 'rgba(0,0,0,0.2)' }}>
              <button type="button" onClick={closeDrawer} className="btn btn-secondary" style={{ flex: 1 }}>Hủy</button>
              <button form="pricing-promotion-form" type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                {submitting ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang lưu...</> : <><Check size={16} /> Lưu chiến dịch</>}
              </button>
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
