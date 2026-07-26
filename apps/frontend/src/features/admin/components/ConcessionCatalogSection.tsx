// src/features/admin/components/ConcessionCatalogSection.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import {
  Plus, RefreshCw, Loader2, Search, Layers, X, ImagePlus, Edit3, Power, Package, Upload, CircleCheck, CircleOff,
} from 'lucide-react';
import { adminConcessionApi } from '../../../api/adminConcessionApi';
import { concessionApi } from '../../../api/concessionApi';
import { showError, showSuccess } from '../../../utils/ToastUtils';
import type { ConcessionProductDto } from '../../../types/concession.types';

const CATEGORY_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Bắp rang' },
  { value: 1, label: 'Nước uống' },
  { value: 2, label: 'Snack' },
  { value: 3, label: 'Lưu niệm' },
];

const formatMoney = (value: number) => `${Math.round(value).toLocaleString('vi-VN')}₫`;

type TypeFilter = 'ALL' | 'SINGLE' | 'COMBO';
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

interface ConcessionCatalogSectionProps {
  cinemaId: string | null;
}

export const ConcessionCatalogSection: React.FC<ConcessionCatalogSectionProps> = ({ cinemaId }) => {
  const [products, setProducts] = useState<ConcessionProductDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [showCreateModal, setShowCreateModal] = useState<'product' | 'combo' | null>(null);
  const [editProduct, setEditProduct] = useState<ConcessionProductDto | null>(null);

  const loadProducts = useCallback(async () => {
    if (!cinemaId) return;
    setLoading(true);
    try {
      const res = await concessionApi.getProducts(cinemaId);
      setProducts(res.data || []);
    } catch {
      showError('Không thể tải danh mục sản phẩm F&B.');
    } finally {
      setLoading(false);
    }
  }, [cinemaId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesKw = !kw || p.productName.toLowerCase().includes(kw) || p.sku.toLowerCase().includes(kw);
      const matchesType = typeFilter === 'ALL' || (typeFilter === 'COMBO' ? p.isCombo : !p.isCombo);
      const matchesStatus = statusFilter === 'ALL'
        || (statusFilter === 'ACTIVE' ? p.isActive : !p.isActive);
      return matchesKw && matchesType && matchesStatus;
    });
  }, [products, search, statusFilter, typeFilter]);

  const handleToggleStatus = async (product: ConcessionProductDto) => {
    try {
      await adminConcessionApi.toggleProductStatus(product.productId, !product.isActive);
      showSuccess(product.isActive ? 'Đã ẩn sản phẩm.' : 'Đã kích hoạt sản phẩm.');
      loadProducts();
    } catch {
      showError('Không thể cập nhật trạng thái.');
    }
  };

  if (!cinemaId) {
    return (
      <div className="state-center" style={{ minHeight: 200 }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Vui lòng chọn rạp trước để quản lý sản phẩm F&amp;B.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Quản lý Danh mục F&amp;B chuẩn</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Admin khởi tạo và quản lý tất cả sản phẩm, combo F&amp;B chuẩn cho rạp.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setShowCreateModal('product')}>
            <Plus size={16} /> Thêm sản phẩm
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal('combo')} style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)', border: 'none' }}>
            <Layers size={16} /> Tạo Combo
          </button>
          <button className="btn-icon" onClick={loadProducts} disabled={loading}>
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : undefined }} />
          </button>
        </div>
      </div>

      {/* Filter Bar: Filter Pills & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        {/* Type Filter Pills */}
        <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.04)', padding: 4, borderRadius: 12, border: '1px solid var(--border-color)' }}>
          {[
            { id: 'ALL', label: 'Tất cả', icon: <Package size={14} /> },
            { id: 'SINGLE', label: 'Sản phẩm đơn', icon: <Plus size={14} /> },
            { id: 'COMBO', label: 'Gói Combo', icon: <Layers size={14} /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTypeFilter(item.id as TypeFilter)}
              className={`btn ${typeFilter === item.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                minHeight: 32,
                padding: '4px 12px',
                fontSize: 12,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div
          role="group"
          aria-label="Lọc theo trạng thái kinh doanh"
          style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.04)', padding: 4, borderRadius: 12, border: '1px solid var(--border-color)', flexWrap: 'wrap' }}
        >
          {[
            { id: 'ALL', label: `Tất cả (${products.length})`, icon: <Package size={14} />, tone: '#f97316' },
            { id: 'ACTIVE', label: `Đang kinh doanh (${products.filter((p) => p.isActive).length})`, icon: <CircleCheck size={14} />, tone: '#22c55e' },
            { id: 'INACTIVE', label: `Ngừng kinh doanh (${products.filter((p) => !p.isActive).length})`, icon: <CircleOff size={14} />, tone: '#ef4444' },
          ].map((item) => {
            const selected = statusFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatusFilter(item.id as StatusFilter)}
                aria-pressed={selected}
                style={{
                  minHeight: 34,
                  padding: '5px 12px',
                  fontSize: 12,
                  fontWeight: 750,
                  borderRadius: 8,
                  border: `1px solid ${selected ? item.tone : 'rgba(255,255,255,0.12)'}`,
                  background: selected ? `${item.tone}22` : 'rgba(255,255,255,0.025)',
                  color: selected ? item.tone : 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  transition: 'transform 160ms ease, border-color 160ms ease, background 160ms ease',
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: 280 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
          <input
            className="input"
            placeholder="Tìm theo tên sản phẩm hoặc SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 34, minHeight: 36, fontSize: 12 }}
          />
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="state-center" style={{ minHeight: 200 }}>
          <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filteredProducts.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, gridColumn: '1 / -1', textAlign: 'center', padding: 30 }}>
              Không tìm thấy sản phẩm hoặc combo nào.
            </p>
          )}
          {filteredProducts.map((product) => (
            <div key={product.productId} className="glass-card" style={{ padding: 14, display: 'grid', gap: 12, overflow: 'hidden' }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '100%', aspectRatio: '16 / 10', borderRadius: 12, overflow: 'hidden',
                  background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <ImagePlus size={30} style={{ color: 'var(--accent)' }} />
                  )}
                </div>
                <span
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    minHeight: 28,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: 'rgba(9, 9, 11, 0.88)',
                    border: `1px solid ${product.isActive ? 'rgba(34,197,94,0.72)' : 'rgba(239,68,68,0.72)'}`,
                    color: product.isActive ? '#86efac' : '#fca5a5',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(10px)',
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.01em',
                  }}
                >
                  {product.isActive ? <CircleCheck size={13} /> : <CircleOff size={13} />}
                  {product.isActive ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
                </span>
              </div>

              <div>
                <strong style={{ fontSize: 15, color: 'var(--text-primary)' }}>{product.productName}</strong>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{product.sku}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', minHeight: 24 }}>
                <strong style={{ color: 'var(--accent)', fontSize: 16 }}>{formatMoney(product.unitPrice)}</strong>
                {product.isCombo && <span className="badge badge-accent">Combo</span>}
              </div>

              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button className="btn btn-secondary" style={{ flex: 1, minHeight: 32, fontSize: 12 }} onClick={() => setEditProduct(product)}>
                  <Edit3 size={13} /> Sửa
                </button>
                <button
                  className={product.isActive ? 'btn btn-danger' : 'btn btn-primary'}
                  style={{ flex: 1, minHeight: 32, fontSize: 12 }}
                  onClick={() => handleToggleStatus(product)}
                >
                  <Power size={13} /> {product.isActive ? 'Ngừng bán' : 'Mở bán'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateModal
          mode={showCreateModal}
          cinemaId={cinemaId}
          onClose={() => setShowCreateModal(null)}
          onSaved={() => { setShowCreateModal(null); loadProducts(); }}
        />
      )}

      {editProduct && (
        <EditModal
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onSaved={() => { setEditProduct(null); loadProducts(); }}
        />
      )}
    </div>
  );
};

// Component chọn / nạp ảnh (Upload file từ máy + URL)
const ImagePickerInput: React.FC<{
  value: string;
  onChange: (url: string) => void;
}> = ({ value, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showError('Dung lượng ảnh vượt quá 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
        showSuccess('Đã nạp tệp ảnh thành công!');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <label className="input-label">Hình ảnh sản phẩm</label>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {/* Preview Thumbnail */}
        <div style={{
          width: 56, height: 56, borderRadius: 12, overflow: 'hidden',
          background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {value ? (
            <img src={value} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <ImagePlus size={20} style={{ color: 'var(--text-muted)' }} />
          )}
        </div>

        <div style={{ flex: 1, display: 'grid', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1, minHeight: 32, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={13} /> Tải tệp ảnh từ máy...
            </button>
            {value && (
              <button
                type="button"
                className="btn btn-danger"
                style={{ minHeight: 32, fontSize: 12, padding: '0 10px' }}
                onClick={() => onChange('')}
              >
                <X size={14} /> Xóa
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <input
            className="input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Hoặc dán link URL ảnh (https://...)"
            style={{ fontSize: 12, minHeight: 32 }}
          />
        </div>
      </div>
    </div>
  );
};

// Modals using React Portal to render at document.body level (prevents ancestor transform/filter clipping)
const ModalShell: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => {
  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: 16,
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', padding: 24, borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
};

const CreateModal: React.FC<{
  mode: 'product' | 'combo';
  cinemaId: string;
  onClose: () => void;
  onSaved: () => void;
}> = ({ mode, cinemaId, onClose, onSaved }) => {
  const [productName, setProductName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState(0);
  const [unitPrice, setUnitPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!productName.trim() || !sku.trim() || !unitPrice) {
      showError('Vui lòng điền đủ Tên, SKU và Giá bán.'); return;
    }
    setSaving(true);
    try {
      if (mode === 'product') {
        await adminConcessionApi.createProduct({
          cinemaId,
          productName: productName.trim(),
          sku: sku.trim(),
          category,
          unitPrice: Number(unitPrice) || 0,
          costPrice: Number(costPrice) || 0,
          imageUrl: imageUrl.trim() || undefined,
        });
        showSuccess('Đã tạo sản phẩm mới.');
      } else {
        await adminConcessionApi.createCombo({
          cinemaId,
          productName: productName.trim(),
          sku: sku.trim(),
          unitPrice: Number(unitPrice) || 0,
          imageUrl: imageUrl.trim() || undefined,
          items: [],
        });
        showSuccess('Đã tạo combo mới.');
      }
      onSaved();
    } catch { showError('Không thể lưu sản phẩm.'); } finally { setSaving(false); }
  };

  return (
    <ModalShell title={mode === 'product' ? 'Thêm sản phẩm mới (Admin)' : 'Tạo combo mới (Admin)'} onClose={onClose}>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label className="input-label">Tên sản phẩm *</label>
          <input className="input" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="VD: Bắp rang phô mai" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label className="input-label">SKU *</label>
            <input className="input" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="CHEESE-L" />
          </div>
          {mode === 'product' && (
            <div>
              <label className="input-label">Danh mục</label>
              <select className="input select" value={category} onChange={(e) => setCategory(Number(e.target.value))}>
                {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: mode === 'product' ? '1fr 1fr' : '1fr', gap: 10 }}>
          <div>
            <label className="input-label">Giá bán (VND) *</label>
            <input className="input" type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="55000" />
          </div>
          {mode === 'product' && (
            <div>
              <label className="input-label">Giá vốn (VND)</label>
              <input className="input" type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="25000" />
            </div>
          )}
        </div>

        <ImagePickerInput value={imageUrl} onChange={setImageUrl} />

        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ minHeight: 44, marginTop: 8 }}>
          {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Xác nhận tạo'}
        </button>
      </div>
    </ModalShell>
  );
};

const EditModal: React.FC<{ product: ConcessionProductDto; onClose: () => void; onSaved: () => void }> = ({ product, onClose, onSaved }) => {
  const [productName, setProductName] = useState(product.productName);
  const [unitPrice, setUnitPrice] = useState(String(product.unitPrice));
  const [costPrice, setCostPrice] = useState(String(product.costPrice));
  const [imageUrl, setImageUrl] = useState(product.imageUrl || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminConcessionApi.updateProduct(product.productId, {
        productName: productName.trim(),
        unitPrice: Number(unitPrice) || 0,
        costPrice: Number(costPrice) || 0,
        imageUrl: imageUrl.trim() || undefined,
      });
      showSuccess('Đã cập nhật sản phẩm.');
      onSaved();
    } catch { showError('Cập nhật thất bại.'); } finally { setSaving(false); }
  };

  return (
    <ModalShell title={`Chỉnh sửa: ${product.productName}`} onClose={onClose}>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label className="input-label">Tên sản phẩm</label>
          <input className="input" value={productName} onChange={(e) => setProductName(e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label className="input-label">Giá bán</label>
            <input className="input" type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
          </div>
          <div>
            <label className="input-label">Giá vốn</label>
            <input className="input" type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
          </div>
        </div>

        <ImagePickerInput value={imageUrl} onChange={setImageUrl} />

        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ minHeight: 44, marginTop: 8 }}>
          {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Lưu thay đổi'}
        </button>
      </div>
    </ModalShell>
  );
};
