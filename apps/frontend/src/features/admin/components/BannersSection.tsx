import React, { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  Image, Check, Edit2, Loader2, Plus, Trash2, X,
  ToggleLeft, ToggleRight, Film, Ticket, Sparkles, Search,
  ChevronDown, ChevronRight, Copy, AlertTriangle, Building2, Globe, Eye,
} from 'lucide-react';
import {
  bannerApi,
  type BannerDto,
  type BannerUpsertDto,
  type BannerContentType,
  type BannerScopeDto,
  type BannerOverviewDto,
} from '../../../api/bannerApi';
import { showError, showSuccess } from '../../../utils/ToastUtils';

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = { Fixed: '#818cf8', Trending: '#f87171', Upcoming: '#34d399', HotVouchers: '#fbbf24' };
const TYPE_LABELS: Record<string, string> = { Fixed: 'Hình ảnh', Trending: 'Thịnh hành', Upcoming: 'Sắp ra mắt', HotVouchers: 'Voucher hot' };
const TYPE_ICONS: Record<string, React.ReactNode> = { Fixed: <Image size={14} />, Trending: <Sparkles size={14} />, Upcoming: <Film size={14} />, HotVouchers: <Ticket size={14} /> };

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContentConfig { mode: 'auto' | 'manual'; maxItems: number; selectedIds: string[]; }
interface BannerFormState {
  title: string; subtitle: string; imageUrl: string; linkUrl: string;
  contentType: BannerContentType; contentConfig: ContentConfig;
  displayOrder: number; isActive: boolean;
  scopeType: 'system' | 'city'; cinemaCity: string;
  startDisplayAt: string; endDisplayAt: string;
}
interface PickerItem { id: string; name: string; image?: string; extra?: string; }

const defaultConfig: ContentConfig = { mode: 'auto', maxItems: 5, selectedIds: [] };
const createBannerForm = (scopeType: 'system' | 'city' = 'system', cinemaCity = ''): BannerFormState => ({
  title: '', subtitle: '', imageUrl: '', linkUrl: '',
  contentType: 'Trending', contentConfig: { ...defaultConfig },
  displayOrder: 0, isActive: true,
  scopeType, cinemaCity,
  startDisplayAt: '', endDisplayAt: '',
});
const toDateInput = (v?: string | null) => (v ? v.split('T')[0] : '');
const toApiDate = (v: string, endOfDay = false) => (!v ? null : `${v}T${endOfDay ? '23:59:59' : '00:00:00'}+07:00`);
const parseConfig = (raw: string | null | undefined): ContentConfig => {
  if (!raw) return { ...defaultConfig };
  try { const p = JSON.parse(raw); return { mode: p.mode || 'auto', maxItems: p.maxItems || 5, selectedIds: p.selectedIds || [] }; }
  catch { return { ...defaultConfig }; }
};
const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== 'object' || error === null) return fallback;
  const r = (error as { response?: { data?: { message?: string } } }).response;
  return r?.data?.message ?? fallback;
};
const buildFormFromBanner = (b: BannerDto): BannerFormState => ({
  title: b.title, subtitle: b.subtitle ?? '', imageUrl: b.imageUrl ?? '', linkUrl: b.linkUrl ?? '',
  contentType: b.contentType, contentConfig: parseConfig(b.contentConfig),
  displayOrder: b.displayOrder, isActive: b.isActive,
  scopeType: b.cinemaCity ? 'city' : 'system',
  cinemaCity: b.cinemaCity ?? '',
  startDisplayAt: toDateInput(b.startDisplayAt), endDisplayAt: toDateInput(b.endDisplayAt),
});
const toPayload = (form: BannerFormState): BannerUpsertDto => {
  const isDynamic = form.contentType !== 'Fixed';
  return {
    title: isDynamic ? TYPE_LABELS[form.contentType] : form.title.trim(),
    subtitle: isDynamic ? null : (form.subtitle.trim() || null),
    imageUrl: isDynamic ? null : (form.imageUrl.trim() || null),
    linkUrl: isDynamic ? null : (form.linkUrl.trim() || null),
    contentType: form.contentType, contentConfig: JSON.stringify(form.contentConfig),
    displayOrder: form.displayOrder, isActive: form.isActive,
    cinemaId: null,
    cinemaCity: form.scopeType === 'city' && form.cinemaCity ? form.cinemaCity.trim() : null,
    startDisplayAt: toApiDate(form.startDisplayAt), endDisplayAt: toApiDate(form.endDisplayAt, true),
  };
};

// ─── Content Picker ──────────────────────────────────────────────────────────

const ContentPicker: React.FC<{
  contentType: BannerContentType; config: ContentConfig; onChange: (c: ContentConfig) => void;
}> = ({ contentType, config, onChange }) => {
  const [items, setItems] = useState<PickerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  useEffect(() => {
    if (config.mode !== 'manual') return;
    setLoading(true);
    const fetch = async () => {
      try {
        if (contentType === 'Trending') { const r = await bannerApi.getMoviesForPicker('trending'); setItems((r.data || []).map((m: any) => ({ id: m.movieId, name: m.movieName, image: m.movieImageUrl }))); }
        else if (contentType === 'Upcoming') { const r = await bannerApi.getMoviesForPicker('upcoming'); setItems((r.data || []).map((m: any) => ({ id: m.movieId, name: m.movieName, image: m.movieImageUrl }))); }
        else if (contentType === 'HotVouchers') { const r = await bannerApi.getVouchersForPicker(); setItems((r.data || []).map((v: any) => ({ id: v.voucherId, name: v.voucherName, extra: `${v.discountPercent}% off` }))); }
      } catch { setItems([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, [contentType, config.mode]);
  const filtered = search ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())) : items;
  const toggleItem = (id: string) => {
    const next = config.selectedIds.includes(id) ? config.selectedIds.filter(x => x !== id) : [...config.selectedIds, id];
    onChange({ ...config, selectedIds: next });
  };
  return (
    <div style={{ padding: 14, borderRadius: 10, border: `1px solid ${TYPE_COLORS[contentType]}30`, background: `${TYPE_COLORS[contentType]}08` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {TYPE_ICONS[contentType]}
        <span style={{ fontSize: 13, fontWeight: 800, color: TYPE_COLORS[contentType] }}>Chọn nội dung {TYPE_LABELS[contentType].toLowerCase()}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button type="button" onClick={() => onChange({ ...config, mode: 'auto', selectedIds: [] })}
          style={{ flex: 1, padding: '10px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `2px solid ${config.mode === 'auto' ? '#ff8a00' : 'rgba(255,255,255,0.12)'}`, background: config.mode === 'auto' ? 'rgba(255,138,0,0.14)' : 'transparent', color: config.mode === 'auto' ? '#fff' : '#e4e4e7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}><Sparkles size={14} /> Hệ thống tự chọn</div>
          <div style={{ fontSize: 10, color: '#a1a1aa', marginTop: 2 }}>Tự động lấy từ database</div>
        </button>
        <button type="button" onClick={() => onChange({ ...config, mode: 'manual' })}
          style={{ flex: 1, padding: '10px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `2px solid ${config.mode === 'manual' ? '#ff8a00' : 'rgba(255,255,255,0.12)'}`, background: config.mode === 'manual' ? 'rgba(255,138,0,0.14)' : 'transparent', color: config.mode === 'manual' ? '#fff' : '#e4e4e7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}><Edit2 size={14} /> Admin tự chọn</div>
          <div style={{ fontSize: 10, color: '#a1a1aa', marginTop: 2 }}>Chọn thủ công từng mục</div>
        </button>
      </div>
      {config.mode === 'auto' && (
        <label style={{ display: 'grid', gap: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>Số lượng hiển thị</span>
          <input type="number" min={1} max={10} className="input" style={{ color: '#fff', width: 80 }} value={config.maxItems} onChange={e => onChange({ ...config, maxItems: parseInt(e.target.value) || 5 })} />
        </label>
      )}
      {config.mode === 'manual' && (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
              <input className="input" style={{ color: '#fff', paddingLeft: 32 }} placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <span style={{ fontSize: 11, color: '#a1a1aa', whiteSpace: 'nowrap' }}>{config.selectedIds.length} đã chọn</span>
          </div>
          {loading ? <div style={{ textAlign: 'center', padding: 16 }}><Loader2 size={20} style={{ color: TYPE_COLORS[contentType], animation: 'spin 1s linear infinite' }} /></div> : (
            <div style={{ maxHeight: 240, overflowY: 'auto', display: 'grid', gap: 4 }}>
              {filtered.map(item => {
                const sel = config.selectedIds.includes(item.id);
                return (
                  <button type="button" key={item.id} onClick={() => toggleItem(item.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${sel ? '#ff8a00' : 'rgba(255,255,255,0.06)'}`, background: sel ? 'rgba(255,138,0,0.08)' : 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                    {item.image ? <img src={item.image} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} /> : <div style={{ width: 36, height: 36, borderRadius: 6, background: `${TYPE_COLORS[contentType]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{TYPE_ICONS[contentType]}</div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                      {item.extra && <div style={{ fontSize: 10, color: '#a1a1aa' }}>{item.extra}</div>}
                    </div>
                    {sel && <Check size={16} style={{ color: '#ff8a00', flexShrink: 0 }} />}
                  </button>
                );
              })}
              {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 16, color: '#a1a1aa', fontSize: 12 }}>Không có dữ liệu</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Banner Card ─────────────────────────────────────────────────────────────

const BannerCard: React.FC<{
  banner: BannerDto;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}> = ({ banner, onEdit, onDelete, onToggle }) => {
  const cfg = parseConfig(banner.contentConfig);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 999, background: `${TYPE_COLORS[banner.contentType]}20`, color: TYPE_COLORS[banner.contentType], border: `1px solid ${TYPE_COLORS[banner.contentType]}40`, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        {TYPE_ICONS[banner.contentType]} {TYPE_LABELS[banner.contentType]}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{banner.title}</span>
      <span style={{ fontSize: 10, color: '#a1a1aa' }}>{cfg.mode === 'auto' ? 'Auto' : `Manual (${cfg.selectedIds.length})`}</span>
      <button onClick={onToggle} style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 999, border: `1px solid ${banner.isActive ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.1)'}`, background: banner.isActive ? 'rgba(52,211,153,0.1)' : 'transparent', color: banner.isActive ? '#34d399' : '#a1a1aa', cursor: 'pointer' }}>
        {banner.isActive ? 'On' : 'Off'}
      </button>
      <button onClick={onEdit} style={{ padding: 3, borderRadius: 4, border: '1px solid rgba(99,102,241,0.3)', background: 'transparent', color: '#818cf8', cursor: 'pointer' }}><Edit2 size={11} /></button>
      <button onClick={onDelete} style={{ padding: 3, borderRadius: 4, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#f87171', cursor: 'pointer' }}><Trash2 size={11} /></button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const BannersSection: React.FC = () => {
  const [overview, setOverview] = useState<BannerOverviewDto | null>(null);
  const [scope, setScope] = useState<BannerScopeDto>({ cinemas: [], cities: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerDto | null>(null);
  const [form, setForm] = useState<BannerFormState>(createBannerForm());
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const [searchCinema, setSearchCinema] = useState('');
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideAction, setOverrideAction] = useState<'copy' | 'override' | null>(null);
  const [selectedCinemas, setSelectedCinemas] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ovr, sr] = await Promise.all([bannerApi.getOverview(), bannerApi.getScope()]);
      if (ovr.isSuccess) setOverview(ovr.data!);
      if (sr.isSuccess) setScope(sr.data || { cinemas: [], cities: [] });
    } catch (e) { showError(getErrorMessage(e, 'Lỗi tải dữ liệu')); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreateForCity = (city: string) => {
    setEditingBanner(null);
    setForm(createBannerForm('city', city));
    setIsDrawerOpen(true);
  };
  const openCreateForSystem = () => {
    setEditingBanner(null);
    setForm(createBannerForm('system'));
    setIsDrawerOpen(true);
  };
  const openEdit = (b: BannerDto) => { setEditingBanner(b); setForm(buildFormFromBanner(b)); setIsDrawerOpen(true); };
  const closeDrawer = () => setIsDrawerOpen(false);

  const handleToggle = async (b: BannerDto) => {
    try { const r = await bannerApi.toggle(b.bannerId); if (r.isSuccess) { showSuccess(r.data?.isActive ? 'Đã bật' : 'Đã tắt'); fetchData(); } }
    catch (e) { showError(getErrorMessage(e, 'Lỗi')); }
  };
  const handleDelete = async (b: BannerDto) => {
    if (!window.confirm(`Xóa banner "${b.title}"?`)) return;
    try { const r = await bannerApi.delete(b.bannerId); if (r.isSuccess) { showSuccess('Đã xóa'); fetchData(); } }
    catch (e) { showError(getErrorMessage(e, 'Lỗi')); }
  };
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.contentType === 'Fixed' && !form.title.trim()) { showError('Vui lòng nhập tên'); return; }
    if (form.contentConfig.mode === 'manual' && form.contentConfig.selectedIds.length === 0) { showError('Chọn ít nhất 1 mục'); return; }
    setSubmitting(true);
    try {
      const payload = toPayload(form);
      const r = editingBanner ? await bannerApi.update(editingBanner.bannerId, payload) : await bannerApi.create(payload);
      if (r.isSuccess) { showSuccess(editingBanner ? 'Đã cập nhật' : 'Đã tạo'); closeDrawer(); fetchData(); }
    } catch (e) { showError(getErrorMessage(e, 'Lỗi lưu')); }
    finally { setSubmitting(false); }
  };

  const handleAutoAll = async () => {
    if (!window.confirm('Tạo banner tự động (Trending + Upcoming + Voucher) cho tất cả rạp chưa có banner?')) return;
    try {
      const r = await bannerApi.autoGenerateAll();
      if (r.isSuccess) { showSuccess(r.data?.message || 'Thành công'); fetchData(); }
    } catch (e) { showError(getErrorMessage(e, 'Lỗi')); }
  };

  const handleOverride = async () => {
    if (!overrideAction || selectedCinemas.length === 0) return;
    const actionLabel = overrideAction === 'copy' ? 'copy banner cho' : 'ghi đè banner của';
    if (!window.confirm(`Bạn có chắc muốn ${actionLabel} ${selectedCinemas.length} rạp?`)) return;
    try {
      const r = overrideAction === 'copy'
        ? await bannerApi.copySystemToLocal(selectedCinemas)
        : await bannerApi.overrideLocal(selectedCinemas);
      if (r.isSuccess) { showSuccess('Thành công'); setOverrideModalOpen(false); setSelectedCinemas([]); fetchData(); }
    } catch (e) { showError(getErrorMessage(e, 'Lỗi')); }
  };

  const set = (patch: Partial<BannerFormState>) => setForm(f => ({ ...f, ...patch }));
  const setConfig = (cfg: ContentConfig) => setForm(f => ({ ...f, contentConfig: cfg }));
  const isDynamic = form.contentType !== 'Fixed';

  return (
    <>
      <div className="animate-in">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Banner Trang Chủ</h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Quản lý banner cho từng rạp. Hệ thống tự động lấy data từ DB hoặc admin chọn thủ công.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={handleAutoAll} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <Sparkles size={14} /> Tự động toàn bộ
            </button>
            {overview && overview.systemBanners.length > 0 && (
              <button className="btn btn-secondary" onClick={() => setOverrideModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <Copy size={14} /> Copy/Override
              </button>
            )}
            <button className="btn btn-primary" onClick={openCreateForSystem} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} /> Bổ sung Banner
            </button>
          </div>
        </div>

        {loading ? (
          <div className="state-center" style={{ minHeight: '30vh' }}><Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} /></div>
        ) : !overview ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Lỗi tải dữ liệu</div>
        ) : (
          <>
            {/* System-wide section */}
            <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, border: '1px solid rgba(255,138,0,0.2)', background: 'rgba(255,138,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Globe size={16} style={{ color: '#ff8a00' }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Toàn hệ thống</span>
                  <span style={{ fontSize: 11, color: '#a1a1aa' }}>({overview.systemBanners.length} banner)</span>
                </div>
                <button onClick={openCreateForSystem} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(255,138,0,0.3)', background: 'rgba(255,138,0,0.1)', color: '#ff8a00' }}>
                  <Plus size={12} /> Thêm
                </button>
              </div>
              {overview.systemBanners.length === 0 ? (
                <p style={{ margin: 0, fontSize: 12, color: '#a1a1aa' }}>Chưa có banner toàn hệ thống.</p>
              ) : (
                <div style={{ display: 'grid', gap: 6 }}>
                  {overview.systemBanners.map(b => <BannerCard key={b.bannerId} banner={b} onEdit={() => openEdit(b)} onDelete={() => handleDelete(b)} onToggle={() => handleToggle(b)} />)}
                </div>
              )}
              {overview.systemBanners.length > 0 && (
                <p style={{ margin: '10px 0 0', fontSize: 11, color: '#a1a1aa' }}>
                  Banner toàn hệ thống sẽ hiển thị ở tất cả rạp chưa có banner riêng. Dùng "Copy/Override" để áp dụng cho rạp cụ thể.
                </p>
              )}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
              <input className="input" style={{ color: '#fff', paddingLeft: 36, width: '100%', maxWidth: 400 }} placeholder="Tìm thành phố..." value={searchCinema} onChange={e => setSearchCinema(e.target.value)} />
            </div>

            {/* City sections */}
            {scope.cities
              .filter(city => !searchCinema || city.toLowerCase().includes(searchCinema.toLowerCase()))
              .map(city => {
                const isExpanded = expandedCities.has(city);
                return (
                  <div key={city} style={{ marginBottom: 12, borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <button onClick={() => {
                      const next = new Set(expandedCities);
                      isExpanded ? next.delete(city) : next.add(city);
                      setExpandedCities(next);
                    }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 16px', background: 'var(--bg-surface)', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      {isExpanded ? <ChevronDown size={16} style={{ color: '#a1a1aa' }} /> : <ChevronRight size={16} style={{ color: '#a1a1aa' }} />}
                      <Building2 size={16} style={{ color: '#ff8a00' }} />
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', flex: 1 }}>{city}</span>
                      <button onClick={(e) => { e.stopPropagation(); openCreateForCity(city); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(255,138,0,0.3)', background: 'rgba(255,138,0,0.1)', color: '#ff8a00' }}>
                        <Plus size={12} /> Thêm
                      </button>
                    </button>
                    {isExpanded && (
                      <div style={{ padding: '8px 16px 12px', display: 'grid', gap: 6 }}>
                        <p style={{ margin: 0, fontSize: 11, color: '#a1a1aa' }}>Banner địa phương sẽ hiển thị ưu tiên hơn banner toàn hệ thống khi khách chọn thành phố này.</p>
                      </div>
                    )}
                  </div>
                );
              })}
          </>
        )}
      </div>

      {/* Override Modal */}
      {overrideModalOpen && overview && createPortal(
        <>
          <div onClick={() => setOverrideModalOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 2000, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 2001, width: 'min(520px, 90vw)', maxHeight: '80vh', backgroundColor: 'var(--bg-elevated, #18181b)', border: '1px solid var(--border-color)', borderRadius: 16, boxShadow: '0 25px 80px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#fff' }}>Copy/Override Banner Toàn Hệ Thống</h3>
              <button onClick={() => setOverrideModalOpen(false)} style={{ padding: 4, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#fff', cursor: 'pointer' }}><X size={14} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: '#a1a1aa' }}>Chọn hành động áp dụng banner toàn hệ thống cho các rạp:</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={() => setOverrideAction('copy')}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', border: `2px solid ${overrideAction === 'copy' ? '#34d399' : 'rgba(255,255,255,0.07)'}`, background: overrideAction === 'copy' ? 'rgba(52,211,153,0.08)' : 'transparent' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: overrideAction === 'copy' ? '#34d399' : '#e4e4e7' }}><Copy size={14} style={{ marginRight: 6 }} />Copy</div>
                  <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 4 }}>Copy banner cho rạp chưa có banner</div>
                </button>
                <button onClick={() => setOverrideAction('override')}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', border: `2px solid ${overrideAction === 'override' ? '#f87171' : 'rgba(255,255,255,0.07)'}`, background: overrideAction === 'override' ? 'rgba(248,113,113,0.08)' : 'transparent' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: overrideAction === 'override' ? '#f87171' : '#e4e4e7' }}><AlertTriangle size={14} style={{ marginRight: 6 }} />Ghi đè</div>
                  <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 4 }}>Xóa banner cũ, thay bằng banner hệ thống</div>
                </button>
              </div>
              {overrideAction && (
                <>
                  <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#fff' }}>Chọn rạp:</p>
                  <div style={{ maxHeight: 250, overflowY: 'auto', display: 'grid', gap: 4 }}>
                    {overview.allCinemas.map(c => {
                      const sel = selectedCinemas.includes(c.cinemaId);
                      return (
                        <button key={c.cinemaId} onClick={() => setSelectedCinemas(prev => sel ? prev.filter(x => x !== c.cinemaId) : [...prev, c.cinemaId])}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${sel ? '#ff8a00' : 'rgba(255,255,255,0.06)'}`, background: sel ? 'rgba(255,138,0,0.08)' : 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{c.cinemaName}</div>
                            <div style={{ fontSize: 10, color: '#a1a1aa' }}>{c.cinemaCity} · {c.bannerCount} banner hiện tại</div>
                          </div>
                          {sel && <Check size={16} style={{ color: '#ff8a00' }} />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 10 }}>
              <button onClick={() => setOverrideModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>Hủy</button>
              <button onClick={handleOverride} disabled={!overrideAction || selectedCinemas.length === 0} className="btn btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Check size={15} /> Áp dụng ({selectedCinemas.length} rạp)
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Create/Edit Drawer */}
      {isDrawerOpen && createPortal(
        <>
          <div onClick={closeDrawer} style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1001, width: 'min(560px, 95vw)', backgroundColor: 'var(--bg-elevated, #18181b)', borderLeft: '1px solid var(--border-color)', boxShadow: '-24px 0 80px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#fff' }}>{editingBanner ? 'Sửa Banner' : 'Thêm Banner Mới'}</h3>
              <button onClick={closeDrawer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', color: '#fff' }}><X size={14} /></button>
            </div>
            <form id="banner-form" onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              <div style={{ display: 'grid', gap: 18 }}>
                <label style={{ display: 'grid', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Chọn loại nội dung <span style={{ color: '#ff8a00' }}>*</span></span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {(['Trending', 'Upcoming', 'HotVouchers', 'Fixed'] as BannerContentType[]).map(ct => (
                      <button type="button" key={ct} onClick={() => set({ contentType: ct, contentConfig: ct === 'Fixed' ? { ...defaultConfig } : { mode: 'auto', maxItems: 5, selectedIds: [] } })}
                        style={{ padding: '14px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', border: `2px solid ${form.contentType === ct ? TYPE_COLORS[ct] : 'rgba(255,255,255,0.07)'}`, background: form.contentType === ct ? `${TYPE_COLORS[ct]}14` : 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: form.contentType === ct ? TYPE_COLORS[ct] : '#a1a1aa' }}>{TYPE_ICONS[ct]}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: form.contentType === ct ? TYPE_COLORS[ct] : '#e4e4e7' }}>{TYPE_LABELS[ct]}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </label>
                {isDynamic && <ContentPicker contentType={form.contentType} config={form.contentConfig} onChange={setConfig} />}
                {form.contentType === 'Fixed' && (
                  <>
                    <label style={{ display: 'grid', gap: 5 }}><span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>Tiêu đề <span style={{ color: '#ff8a00' }}>*</span></span><input className="input" style={{ fontSize: 14, color: '#fff' }} value={form.title} onChange={e => set({ title: e.target.value })} required placeholder="VD: Ưu đãi cuối tuần" /></label>
                    <label style={{ display: 'grid', gap: 5 }}><span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>Mô tả</span><input className="input" style={{ color: '#fff' }} value={form.subtitle} onChange={e => set({ subtitle: e.target.value })} /></label>
                    <label style={{ display: 'grid', gap: 5 }}><span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>Hình ảnh URL</span><input className="input" style={{ color: '#fff' }} value={form.imageUrl} onChange={e => set({ imageUrl: e.target.value })} placeholder="https://..." /></label>
                    <label style={{ display: 'grid', gap: 5 }}><span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>Link khi click</span><input className="input" style={{ color: '#fff' }} value={form.linkUrl} onChange={e => set({ linkUrl: e.target.value })} placeholder="https://..." /></label>
                  </>
                )}
                {/* Scope — auto-set when editing or pre-selected cinema */}
                {editingBanner || form.cinemaCity ? (
                  <div style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,138,0,0.2)', background: 'rgba(255,138,0,0.04)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Building2 size={14} style={{ color: '#ff8a00' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                      {form.scopeType === 'city' ? form.cinemaCity || 'Thành phố' : 'Toàn hệ thống'}
                    </span>
                    {editingBanner && <button type="button" onClick={() => set({ scopeType: 'system', cinemaCity: '' })} style={{ marginLeft: 'auto', fontSize: 11, color: '#a1a1aa', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Thay đổi</button>}
                  </div>
                ) : (
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>Phạm vi</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['system', 'city'] as const).map(opt => (
                        <button type="button" key={opt} onClick={() => set({ scopeType: opt })}
                          style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `1px solid ${form.scopeType === opt ? '#ff8a00' : 'rgba(255,255,255,0.12)'}`, background: form.scopeType === opt ? 'rgba(255,138,0,0.14)' : 'rgba(255,255,255,0.03)', color: form.scopeType === opt ? '#fff' : '#e4e4e7' }}>
                          {opt === 'system' ? 'Toàn hệ thống' : 'Thành phố'}
                        </button>
                      ))}
                    </div>
                    {form.scopeType === 'city' && <select className="input" style={{ color: '#fff' }} value={form.cinemaCity} onChange={e => set({ cinemaCity: e.target.value })}><option value="">Chọn thành phố...</option>{scope.cities.map(c => <option key={c} value={c}>{c}</option>)}</select>}
                  </label>
                )}
                <label style={{ display: 'grid', gap: 5 }}><span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>Thứ tự</span><input type="number" className="input" style={{ color: '#fff', width: 120 }} value={form.displayOrder} onChange={e => set({ displayOrder: parseInt(e.target.value) || 0 })} /></label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, border: `1px solid ${form.isActive ? '#ff8a00' : 'rgba(255,255,255,0.12)'}`, background: form.isActive ? 'rgba(255,138,0,0.08)' : 'transparent', cursor: 'pointer' }} onClick={() => set({ isActive: !form.isActive })}>
                  {form.isActive ? <ToggleRight size={20} style={{ color: '#ff8a00' }} /> : <ToggleLeft size={20} style={{ color: '#a1a1aa' }} />}
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{form.isActive ? 'Kích hoạt' : 'Tắt'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label style={{ display: 'grid', gap: 5 }}><span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>Từ ngày</span><input type="date" className="input" style={{ color: '#fff' }} value={form.startDisplayAt} onChange={e => set({ startDisplayAt: e.target.value })} /></label>
                  <label style={{ display: 'grid', gap: 5 }}><span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>Đến ngày</span><input type="date" className="input" style={{ color: '#fff' }} value={form.endDisplayAt} onChange={e => set({ endDisplayAt: e.target.value })} /></label>
                </div>

                {/* Preview — hero style matching HomePage */}
                <div style={{ padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Eye size={12} /> Xem trước (như trang chủ)
                  </div>
                  <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', height: 200 }}>
                    {/* Background */}
                    {form.contentType === 'Fixed' && form.imageUrl ? (
                      <img src={form.imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${TYPE_COLORS[form.contentType]}33, ${TYPE_COLORS[form.contentType]}11)` }} />
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)' }} />
                    {/* Content */}
                    <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
                      <div style={{ maxWidth: 280 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', fontSize: 10, fontWeight: 800, color: '#ff8a00', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                          <Sparkles size={10} />
                          {TYPE_LABELS[form.contentType]}
                        </span>
                        <h4 style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.1, margin: '0 0 8px', color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                          {form.contentType === 'Fixed' ? (form.title || '(Chưa có tên)') : TYPE_LABELS[form.contentType]}
                        </h4>
                        {form.contentType === 'Fixed' && form.subtitle && (
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: '0 0 12px', lineHeight: 1.5, textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
                            {form.subtitle}
                          </p>
                        )}
                        {isDynamic && (
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: '0 0 12px' }}>
                            {form.contentConfig.mode === 'auto' ? `Tự động · ${form.contentConfig.maxItems} mục` : `Thủ công · ${form.contentConfig.selectedIds.length} mục đã chọn`}
                          </p>
                        )}
                        {form.contentType === 'Fixed' && form.linkUrl && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 999, background: '#ff8a00', color: '#fff', fontWeight: 800, fontSize: 11, boxShadow: '0 4px 20px rgba(255,138,0,0.4)' }}>
                            Xem ngay
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
            <div style={{ display: 'flex', gap: 10, padding: '14px 24px', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
              <button type="button" onClick={closeDrawer} className="btn btn-secondary" style={{ flex: 1 }}>Hủy</button>
              <button form="banner-form" type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {submitting ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Đang lưu...</> : <><Check size={15} /> {editingBanner ? 'Cập nhật' : 'Tạo Banner'}</>}
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};
