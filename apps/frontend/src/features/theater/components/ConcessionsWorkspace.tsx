// src/features/theater/components/ConcessionsWorkspace.tsx
// Theater Manager workspace: Default view is theater Inventory ("Hàng tồn kho").
// When requesting stock, fetches full master product catalog created by Admin.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  Package, RefreshCw, Loader2, Search, Boxes, History,
  AlertTriangle, X, Truck, Check, Popcorn as PopcornIcon, Plus, AlertCircle,
} from 'lucide-react';
import { concessionApi } from '../../../api/concessionApi';
import { showError, showSuccess } from '../../../utils/ToastUtils';
import type {
  ConcessionProductDto,
  InventoryStatusDto,
  InventoryTransactionDto,
} from '../../../types/concession.types';
import type { StockRequestDto } from '../../../types/stockRequest.types';
import type { WasteReportDto } from '../../../types/wasteReport.types';

const formatMoney = (value: number) => `${Math.round(value).toLocaleString('vi-VN')}đ`;

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) return fallback;
  const payload = error.response?.data as { message?: string; Message?: string } | undefined;
  return payload?.message ?? payload?.Message ?? fallback;
};

type WorkspaceTab = 'inventory' | 'requests' | 'waste' | 'history' | 'catalog';

interface ConcessionsWorkspaceProps {
  cinemaId: string | null;
}

const getStockHealth = (item: InventoryStatusDto) => {
  const available = Math.max(item.availableToSell, 0);
  const threshold = Math.max(item.lowStockThreshold, 1);

  if (available === 0) {
    return { label: 'Hết hàng', color: '#ef4444', percent: 3 };
  }
  if (available <= threshold) {
    return {
      label: 'Sắp hết',
      color: '#f59e0b',
      percent: Math.max(8, Math.round((available / threshold) * 34)),
    };
  }
  if (available <= threshold * 2) {
    return {
      label: 'Đủ dùng',
      color: '#eab308',
      percent: Math.round(34 + ((available - threshold) / threshold) * 32),
    };
  }
  return {
    label: 'Tồn kho tốt',
    color: '#22c55e',
    percent: Math.min(100, Math.round(66 + ((available - threshold * 2) / (threshold * 2)) * 34)),
  };
};

const StockHealthBar: React.FC<{ item: InventoryStatusDto }> = ({ item }) => {
  const health = getStockHealth(item);
  return (
    <div style={{ flexBasis: '100%', display: 'grid', gap: 7, paddingTop: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', fontSize: 11 }}>
        <span style={{ color: health.color, fontWeight: 800 }}>{health.label}</span>
        <span style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
          Còn {Math.max(item.availableToSell, 0)} · Ngưỡng cảnh báo {item.lowStockThreshold}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`Mức tồn kho ${item.productName}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={health.percent}
        style={{ height: 7, borderRadius: 999, background: item.availableToSell <= 0 ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.08)', overflow: 'hidden' }}
      >
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: 999,
          background: health.color,
          transform: `scaleX(${health.percent / 100})`,
          transformOrigin: 'left center',
          transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        }} />
      </div>
    </div>
  );
};
const ConcessionsWorkspace: React.FC<ConcessionsWorkspaceProps> = ({ cinemaId }) => {
  const { t } = useTranslation();

  // Primary Default View: Inventory ("Hàng tồn kho tại rạp")
  const [tab, setTab] = useState<WorkspaceTab>('inventory');

  const [inventory, setInventory] = useState<InventoryStatusDto[]>([]);
  const [masterProducts, setMasterProducts] = useState<ConcessionProductDto[]>([]);
  const [stockRequests, setStockRequests] = useState<StockRequestDto[]>([]);
  const [wasteReports, setWasteReports] = useState<WasteReportDto[]>([]);
  const [history, setHistory] = useState<InventoryTransactionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Supply Chain Modals
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);
  const [prefilledProductId, setPrefilledProductId] = useState<string | null>(null);
  const [showCreateWasteModal, setShowCreateWasteModal] = useState(false);
  const [receiveTarget, setReceiveTarget] = useState<StockRequestDto | null>(null);

  // Load Inventory (Hàng tồn kho tại rạp - Primary View)
  const loadInventory = useCallback(async () => {
    if (!cinemaId) return;
    setLoading(true);
    try {
      const res = await concessionApi.getInventoryStatus(cinemaId);
      setInventory(res.data || []);
    } catch (err) {
      showError(getApiErrorMessage(err, 'Không tải được danh sách hàng tồn kho.'));
    } finally { setLoading(false); }
  }, [cinemaId]);

  // Load Master Products (Danh sách tất cả sản phẩm Admin khởi tạo)
  const loadMasterProducts = useCallback(async () => {
    if (!cinemaId) return [];
    try {
      const res = await concessionApi.getProducts(cinemaId);
      const list = res.data || [];
      setMasterProducts(list);
      return list;
    } catch (err) {
      showError(getApiErrorMessage(err, 'Không tải được danh sách sản phẩm chuẩn.'));
      return [];
    }
  }, [cinemaId]);

  const loadRequests = useCallback(async () => {
    if (!cinemaId) return;
    setLoading(true);
    try {
      const res = await concessionApi.getStockRequests(cinemaId);
      setStockRequests(res.data || []);
    } catch (err) {
      showError(getApiErrorMessage(err, 'Không tải được danh sách yêu cầu.'));
    } finally { setLoading(false); }
  }, [cinemaId]);

  const loadWaste = useCallback(async () => {
    if (!cinemaId) return;
    setLoading(true);
    try {
      const res = await concessionApi.getWasteReports(cinemaId);
      setWasteReports(res.data || []);
    } catch (err) {
      showError(getApiErrorMessage(err, 'Không tải được báo cáo hao hụt.'));
    } finally { setLoading(false); }
  }, [cinemaId]);

  const loadHistory = useCallback(async () => {
    if (!cinemaId) return;
    setLoading(true);
    try {
      const res = await concessionApi.getInventoryHistory(cinemaId, { page: 1, pageSize: 50 });
      setHistory(res.data || []);
    } catch (err) {
      showError(getApiErrorMessage(err, 'Không tải được lịch sử kho.'));
    } finally { setLoading(false); }
  }, [cinemaId]);

  useEffect(() => {
    if (tab === 'inventory') loadInventory();
    else if (tab === 'requests') loadRequests();
    else if (tab === 'waste') loadWaste();
    else if (tab === 'history') loadHistory();
    else if (tab === 'catalog') {
      setLoading(true);
      loadMasterProducts().finally(() => setLoading(false));
    }
  }, [tab, loadInventory, loadRequests, loadWaste, loadHistory, loadMasterProducts]);

  const filteredInventory = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return inventory;
    return inventory.filter((p) => p.productName.toLowerCase().includes(kw) || p.sku.toLowerCase().includes(kw));
  }, [inventory, search]);

  const filteredCatalog = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return masterProducts;
    return masterProducts.filter((p) => p.productName.toLowerCase().includes(kw) || p.sku.toLowerCase().includes(kw));
  }, [masterProducts, search]);

  // Click "Yêu cầu nhập hàng": Fetch full master products list if not loaded, then open Modal
  const handleOpenRequestModal = async (productId?: string) => {
    setPrefilledProductId(productId || null);
    if (masterProducts.length === 0) {
      setLoading(true);
      await loadMasterProducts();
      setLoading(false);
    }
    setShowCreateRequestModal(true);
  };

  const handleOpenWasteModal = async () => {
    if (masterProducts.length === 0) {
      setLoading(true);
      await loadMasterProducts();
      setLoading(false);
    }
    setShowCreateWasteModal(true);
  };

  if (!cinemaId) {
    return (
      <div className="state-center" style={{ minHeight: 200 }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('Please select a cinema first.')}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 24, paddingBottom: 40 }}>
      {/* Top Title & Header Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>Bắp Nước &amp; Kho hàng</h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-muted)', maxWidth: 540 }}>
            Quản lý tồn kho hàng tại rạp và tạo phiếu xin cấp hàng từ danh mục sản phẩm toàn hệ thống.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleOpenWasteModal} style={{ minHeight: 42, padding: '0 16px', fontWeight: 700 }}>
            <AlertTriangle size={16} style={{ color: 'var(--danger)' }} /> Báo hỏng / hao hụt
          </button>
          <button
            className="btn btn-primary"
            onClick={() => handleOpenRequestModal()}
            style={{
              minHeight: 42,
              padding: '0 20px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, var(--brand-orange, #f97316), #ea580c)',
              boxShadow: '0 4px 16px rgba(249,115,22,0.4)',
              border: 'none',
            }}
          >
            <Truck size={18} /> Yêu cầu nhập hàng
          </button>
        </div>
      </div>

      {/* Navigation Tabs & Search */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(24, 24, 27, 0.6)',
        padding: '6px 8px',
        borderRadius: 16,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        {/* Pills (Default tab is Inventory "Hàng tồn kho") */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'inventory', label: 'Hàng tồn kho', icon: <Boxes size={16} /> },
            { id: 'requests', label: 'Phiếu nhập hàng', icon: <Truck size={16} /> },
            { id: 'waste', label: 'Báo cáo hao hụt', icon: <AlertTriangle size={16} /> },
            { id: 'history', label: 'Lịch sử kho', icon: <History size={16} /> },
            { id: 'catalog', label: 'Tất cả sản phẩm', icon: <Package size={16} /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as WorkspaceTab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s ease',
                background: tab === item.id ? 'var(--brand-orange, #f97316)' : 'transparent',
                color: tab === item.id ? '#ffffff' : 'var(--text-muted)',
                boxShadow: tab === item.id ? '0 2px 10px rgba(249,115,22,0.3)' : 'none',
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {(tab === 'inventory' || tab === 'catalog') && (
            <div style={{ position: 'relative', width: 260 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
              <input
                className="input"
                placeholder="Tìm theo tên hoặc SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  paddingLeft: 36,
                  minHeight: 36,
                  fontSize: 12,
                  background: 'rgba(15, 15, 17, 0.6)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 12,
                }}
              />
            </div>
          )}
          <button
            className="btn-icon"
            onClick={() => (tab === 'inventory' ? loadInventory() : tab === 'requests' ? loadRequests() : tab === 'waste' ? loadWaste() : tab === 'history' ? loadHistory() : loadMasterProducts())}
            disabled={loading}
            style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : undefined, color: 'var(--text-muted)' }} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="state-center" style={{ minHeight: 250 }}>
          <Loader2 size={32} style={{ color: 'var(--brand-orange, #f97316)', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : tab === 'inventory' ? (
        /* Primary View: Inventory ("Hàng tồn kho tại rạp") */
        <div style={{ display: 'grid', gap: 14 }}>
          {filteredInventory.length === 0 && (
            <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
              <Boxes size={36} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
              <p style={{ margin: 0, fontSize: 14, color: '#ffffff', fontWeight: 700 }}>Chưa có dữ liệu tồn kho tại rạp.</p>
              <p style={{ margin: '6px 0 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                Bấm nút &quot;Yêu cầu nhập hàng&quot; bên trên để gửi đơn xin cấp sản phẩm từ danh mục hệ thống.
              </p>
              <button className="btn btn-primary" onClick={() => handleOpenRequestModal()} style={{ background: 'linear-gradient(135deg, var(--brand-orange, #f97316), #ea580c)', border: 'none' }}>
                <Truck size={16} /> Lập yêu cầu nhập hàng ngay
              </button>
            </div>
          )}

          {filteredInventory.map((item) => (
            <div key={item.productId} className="glass-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', borderRadius: 18 }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <strong style={{ fontSize: 16, color: '#ffffff' }}>{item.productName}</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{item.sku}</p>
              </div>

              <Stat label="Tồn kho thực" value={item.quantityOnHand} />
              <Stat label="Đang giữ đơn" value={item.quantityReserved} />
              <Stat label="Có thể bán" value={item.availableToSell} highlight={item.isLowStock} />

              {item.isLowStock && (
                <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={13} /> Cảnh báo sắp hết
                </span>
              )}

              <button
                className="btn btn-secondary"
                style={{
                  minHeight: 36,
                  fontSize: 12,
                  borderRadius: 12,
                  padding: '0 14px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(249,115,22,0.1)',
                  border: '1px solid rgba(249,115,22,0.3)',
                  color: 'var(--brand-orange, #f97316)',
                }}
                onClick={() => handleOpenRequestModal(item.productId)}
              >
                <Truck size={14} /> Xin cấp thêm
              </button>

              <StockHealthBar item={item} />
            </div>
          ))}
        </div>
      ) : tab === 'requests' ? (
        /* Stock Requests View */
        <div style={{ display: 'grid', gap: 14 }}>
          {stockRequests.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 40 }}>Chưa có phiếu nhập hàng nào.</p>}
          {stockRequests.map(req => (
            <div key={req.stockRequestId} className="glass-card" style={{ padding: 20, display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <strong style={{ fontSize: 16, color: 'var(--brand-orange, #f97316)', fontFamily: "'JetBrains Mono', monospace" }}>{req.requestCode}</strong>
                  <span className={`badge ${getStatusBadge(req.status)}`} style={{ marginLeft: 12 }}>{req.status}</span>
                </div>
                {req.status === 'Shipped' && (
                  <button className="btn btn-primary" style={{ minHeight: 34, fontSize: 12, background: 'linear-gradient(135deg, #059669, #10b981)', border: 'none' }} onClick={() => setReceiveTarget(req)}>
                    <Check size={14} /> Xác nhận thực nhận
                  </button>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                Tạo lúc: {new Date(req.createdAt).toLocaleString('vi-VN')} · Ghi chú: {req.note || 'Không có'}
              </p>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: 10 }}>
                Chi tiết: {req.items.map(i => `${i.productName} (Xin: ${i.requestedQuantity}, Duyệt: ${i.approvedQuantity}${req.status === 'Received' ? `, Nhận: ${i.receivedQuantity}` : ''})`).join('; ')}
              </div>
            </div>
          ))}
        </div>
      ) : tab === 'waste' ? (
        /* Waste Reports View */
        <div style={{ display: 'grid', gap: 14 }}>
          {wasteReports.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 40 }}>Chưa có báo cáo hao hụt nào.</p>}
          {wasteReports.map(rep => (
            <div key={rep.wasteReportId} className="glass-card" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <strong style={{ fontSize: 15, color: '#ffffff' }}>{rep.productName}</strong>
                  <span className={`badge ${getStatusBadge(rep.status)}`}>{rep.status}</span>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                  Số lượng hủy: <strong style={{ color: 'var(--danger)' }}>{rep.quantity}</strong> · Lý do: {rep.reason} · {new Date(rep.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : tab === 'history' ? (
        /* Inventory Ledger History */
        <div style={{ display: 'grid', gap: 10 }}>
          {history.map((tx) => (
            <div key={tx.transactionId} className="glass-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span className={tx.quantityChange >= 0 ? 'badge badge-success' : 'badge badge-danger'} style={{ minWidth: 90, textAlign: 'center' }}>
                {tx.transactionType}
              </span>
              <div style={{ flex: 1, minWidth: 160 }}>
                <strong style={{ fontSize: 14, color: '#ffffff' }}>{tx.productName}</strong>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                  {new Date(tx.occurredAt).toLocaleString('vi-VN')} {tx.performedByUserName ? `· ${tx.performedByUserName}` : ''}
                </p>
              </div>
              <strong style={{ fontSize: 15, color: tx.quantityChange >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {tx.quantityChange >= 0 ? '+' : ''}{tx.quantityChange}
              </strong>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Còn lại: {tx.quantityOnHandAfter}</span>
            </div>
          ))}
        </div>
      ) : (
        /* Master Catalog View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {filteredCatalog.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, gridColumn: '1 / -1', textAlign: 'center', padding: 40 }}>Chưa có sản phẩm chuẩn nào do Admin khởi tạo.</p>
          )}
          {filteredCatalog.map((product) => (
            <div
              key={product.productId}
              style={{
                background: 'rgba(24, 24, 27, 0.8)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 20,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.05))',
                  border: '1px solid rgba(249,115,22,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-orange, #f97316)',
                }}>
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.productName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }} />
                  ) : (
                    <PopcornIcon size={24} />
                  )}
                </div>
                <span className={product.isActive ? 'badge badge-success' : 'badge badge-danger'}>
                  {product.isActive ? 'Đang kinh doanh' : 'Tạm ẩn'}
                </span>
              </div>

              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#ffffff' }}>{product.productName}</h3>
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: 6 }}>
                  {product.sku}
                </span>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 18, color: 'var(--brand-orange, #f97316)' }}>{formatMoney(product.unitPrice)}</strong>
                {!product.isCombo && (
                  <button
                    className="btn btn-secondary"
                    style={{ minHeight: 32, fontSize: 12, borderRadius: 10, padding: '0 12px' }}
                    onClick={() => handleOpenRequestModal(product.productId)}
                  >
                    <Truck size={13} style={{ color: 'var(--brand-orange, #f97316)' }} /> Xin nhập
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateRequestModal && (
        <CreateRequestModal
          cinemaId={cinemaId}
          products={masterProducts.filter(p => !p.isCombo)}
          initialProductId={prefilledProductId}
          onClose={() => { setShowCreateRequestModal(false); setPrefilledProductId(null); }}
          onSaved={() => { setShowCreateRequestModal(false); setPrefilledProductId(null); setTab('requests'); loadRequests(); }}
        />
      )}

      {showCreateWasteModal && (
        <CreateWasteModal
          cinemaId={cinemaId}
          products={masterProducts.filter(p => !p.isCombo)}
          onClose={() => setShowCreateWasteModal(false)}
          onSaved={() => { setShowCreateWasteModal(false); setTab('waste'); loadWaste(); }}
        />
      )}

      {receiveTarget && (
        <ReceiveModal
          request={receiveTarget}
          onClose={() => setReceiveTarget(null)}
          onSaved={() => { setReceiveTarget(null); loadRequests(); }}
        />
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div style={{ textAlign: 'center', minWidth: 75 }}>
    <strong style={{ fontSize: 18, color: highlight ? 'var(--danger)' : '#ffffff' }}>{value}</strong>
    <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
  </div>
);

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Pending': return 'badge-warning';
    case 'Approved': return 'badge-accent';
    case 'Shipped': return 'badge-info';
    case 'Received': return 'badge-success';
    case 'Rejected': return 'badge-danger';
    default: return 'badge-secondary';
  }
};

// ================= Modals (Portal to document.body) =================

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
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#ffffff' }}>{title}</h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
};

const CreateRequestModal: React.FC<{
  cinemaId: string;
  products: ConcessionProductDto[];
  initialProductId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ cinemaId, products, initialProductId, onClose, onSaved }) => {
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>(() => {
    if (initialProductId) {
      return [{ productId: initialProductId, quantity: 20 }];
    }
    return products.length > 0 ? [{ productId: products[0].productId, quantity: 20 }] : [];
  });
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const addItem = () => {
    if (products.length === 0) return;
    setItems(prev => [...prev, { productId: products[0].productId, quantity: 10 }]);
  };

  const handleSave = async () => {
    if (items.length === 0) { showError('Vui lòng chọn ít nhất 1 sản phẩm.'); return; }
    setSaving(true);
    try {
      await concessionApi.createStockRequest({ cinemaId, items, note: note.trim() || undefined });
      showSuccess('Đã gửi yêu cầu nhập hàng tới kho tổng.');
      onSaved();
    } catch (err) { showError(getApiErrorMessage(err, 'Tạo yêu cầu thất bại.')); } finally { setSaving(false); }
  };

  return (
    <ModalShell title="Tạo yêu cầu nhập hàng từ Kho tổng" onClose={onClose}>
      <div style={{ display: 'grid', gap: 14 }}>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
          Chọn các sản phẩm từ danh mục hệ thống Admin đã tạo để yêu cầu cấp cho rạp.
        </p>

        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>Danh sách sản phẩm xin cấp</span>
            <button className="btn btn-secondary" style={{ minHeight: 28, fontSize: 12 }} onClick={addItem}><Plus size={13} /> Thêm dòng món</button>
          </div>
          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                className="input select"
                style={{ flex: 1, minHeight: 34 }}
                value={item.productId}
                onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, productId: e.target.value } : it))}
              >
                {products.map(p => (
                  <option key={p.productId} value={p.productId}>
                    {p.productName} ({p.sku})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                className="input"
                style={{ width: 80, minHeight: 34 }}
                value={item.quantity}
                onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: Number(e.target.value) || 1 } : it))}
              />
              <button className="btn-icon" onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}><X size={14} /></button>
            </div>
          ))}
        </div>

        <div>
          <label className="input-label">Ghi chú</label>
          <input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="VD: Món đang bán chạy, xin cấp gấp cho dịp cuối tuần" />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg, var(--brand-orange, #f97316), #ea580c)', border: 'none' }}>
            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Gửi yêu cầu nhập hàng'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

const CreateWasteModal: React.FC<{ cinemaId: string; products: ConcessionProductDto[]; onClose: () => void; onSaved: () => void }> = ({ cinemaId, products, onClose, onSaved }) => {
  const [productId, setProductId] = useState(products[0]?.productId || '');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [proofImageUrl, setProofImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!productId || !reason.trim() || Number(quantity) <= 0) {
      showError('Vui lòng điền đủ thông tin báo hỏng.'); return;
    }
    setSaving(true);
    try {
      await concessionApi.createWasteReport({
        cinemaId,
        productId,
        quantity: Number(quantity) || 1,
        reason: reason.trim(),
        proofImageUrl: proofImageUrl.trim() || undefined,
      });
      showSuccess('Đã gửi báo cáo hao hụt tới kho tổng.');
      onSaved();
    } catch (err) { showError(getApiErrorMessage(err, 'Gửi báo cáo thất bại.')); } finally { setSaving(false); }
  };

  return (
    <ModalShell title="Báo cáo hàng hỏng / hao hụt" onClose={onClose}>
      <div style={{ display: 'grid', gap: 14 }}>
        <div>
          <label className="input-label">Sản phẩm bị hỏng *</label>
          <select className="input select" value={productId} onChange={e => setProductId(e.target.value)}>
            {products.map(p => <option key={p.productId} value={p.productId}>{p.productName} ({p.sku})</option>)}
          </select>
        </div>

        <div>
          <label className="input-label">Số lượng *</label>
          <input type="number" min={1} className="input" value={quantity} onChange={e => setQuantity(e.target.value)} />
        </div>

        <div>
          <label className="input-label">Lý do báo hỏng *</label>
          <textarea className="input" rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="VD: Bắp mốc do ẩm ướt, ly vỡ khi vận chuyển" />
        </div>

        <div>
          <label className="input-label">Ảnh minh chứng (URL)</label>
          <input className="input" value={proofImageUrl} onChange={e => setProofImageUrl(e.target.value)} placeholder="https://..." />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg, var(--brand-orange, #f97316), #ea580c)', border: 'none' }}>
            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Gửi báo cáo'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

const ReceiveModal: React.FC<{ request: StockRequestDto; onClose: () => void; onSaved: () => void }> = ({ request, onClose, onSaved }) => {
  const [items, setItems] = useState(request.items.map(i => ({ productId: i.productId, receivedQuantity: i.approvedQuantity })));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await concessionApi.receiveStockRequest(request.stockRequestId, { items });
      showSuccess('Đã xác nhận nhận hàng & cộng tồn kho thành công!');
      onSaved();
    } catch (err) { showError(getApiErrorMessage(err, 'Thao tác thất bại.')); } finally { setSaving(false); }
  };

  return (
    <ModalShell title={`Xác nhận thực nhận: ${request.requestCode}`} onClose={onClose}>
      <div style={{ display: 'grid', gap: 14 }}>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Kiểm đếm thực tế khi mở thùng hàng tại rạp.</p>

        <div style={{ display: 'grid', gap: 10 }}>
          {request.items.map((item, idx) => (
            <div key={item.stockRequestItemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#ffffff' }}>{item.productName} (Được duyệt: {item.approvedQuantity})</span>
              <input
                type="number"
                min={0}
                className="input"
                style={{ width: 80, minHeight: 32 }}
                value={items[idx]?.receivedQuantity ?? item.approvedQuantity}
                onChange={e => {
                  const val = Number(e.target.value) || 0;
                  setItems(prev => prev.map((it, i) => i === idx ? { ...it, receivedQuantity: val } : it));
                }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg, #059669, #10b981)', border: 'none' }}>
            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Xác nhận &amp; Cộng tồn'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

export default ConcessionsWorkspace;
