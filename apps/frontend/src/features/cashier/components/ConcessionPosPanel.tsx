// src/features/cashier/components/ConcessionPosPanel.tsx
// Compact POS panel: cashier searches the F&B menu, builds a cart, and sells concessions.
// Handles ConcessionOutOfStockException gracefully by showing substitute suggestions.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Popcorn, Plus, Minus, X, Loader2, ShoppingBag, AlertTriangle, RefreshCw } from 'lucide-react';
import { concessionApi } from '../../../api/concessionApi';
import { showError, showSuccess } from '../../../utils/ToastUtils';
import type { ConcessionMenuItemDto, ConcessionStockConflictDto } from '../../../types/concession.types';

const formatMoney = (value: number) => `${Math.round(value).toLocaleString('vi-VN')}đ`;

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) return fallback;
  const payload = error.response?.data as { message?: string; Message?: string } | undefined;
  return payload?.message ?? payload?.Message ?? fallback;
};

interface ConcessionPosPanelProps {
  cinemaId: string | null;
  onClose: () => void;
}

const ConcessionPosPanel: React.FC<ConcessionPosPanelProps> = ({ cinemaId, onClose }) => {
  const { t } = useTranslation();
  const [menu, setMenu] = useState<ConcessionMenuItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [selling, setSelling] = useState(false);
  const [conflicts, setConflicts] = useState<ConcessionStockConflictDto[]>([]);

  const loadMenu = useCallback(async () => {
    if (!cinemaId) return;
    setLoading(true);
    try {
      const res = await concessionApi.getMenu(cinemaId);
      setMenu(res.data || []);
    } catch (err) {
      showError(getApiErrorMessage(err, 'Không tải được thực đơn bắp nước.'));
    } finally {
      setLoading(false);
    }
  }, [cinemaId]);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  const cartLines = useMemo(
    () => Object.entries(cart).filter(([, qty]) => qty > 0).map(([productId, qty]) => {
      const item = menu.find((m) => m.productId === productId);
      return item ? { item, qty } : null;
    }).filter((v): v is { item: ConcessionMenuItemDto; qty: number } => Boolean(v)),
    [cart, menu],
  );

  const cartTotal = useMemo(() => cartLines.reduce((sum, l) => sum + l.item.unitPrice * l.qty, 0), [cartLines]);
  const cartQty = useMemo(() => cartLines.reduce((sum, l) => sum + l.qty, 0), [cartLines]);

  const adjustQty = (productId: string, delta: number) => {
    setCart((prev) => {
      const next = Math.max(0, (prev[productId] || 0) + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleSell = async () => {
    if (!cinemaId || cartLines.length === 0) return;
    setSelling(true);
    setConflicts([]);
    try {
      const items = cartLines.map((l) => ({ productId: l.item.productId, quantity: l.qty }));
      const stockCheck = await concessionApi.checkStock({ cinemaId, items });
      if (!stockCheck.data.allAvailable) {
        setConflicts(stockCheck.data.conflicts);
        showError('Một vài sản phẩm không đủ hàng. Vui lòng xem gợi ý thay thế.');
        setSelling(false);
        return;
      }
      const res = await concessionApi.sell({ cinemaId, items });
      showSuccess(`Đã bán bắp nước — Tổng: ${formatMoney(res.data.totalAmount)}`);
      setCart({});
      loadMenu();
    } catch (err) {
      showError(getApiErrorMessage(err, 'Không thể hoàn tất đơn bắp nước.'));
    } finally {
      setSelling(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16,
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 780, maxHeight: '88vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Popcorn size={20} style={{ color: 'var(--accent)' }} />
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Bán Bắp Nước (POS)</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-icon" onClick={loadMenu} disabled={loading}>
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
            </button>
            <button className="btn-icon" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', flex: 1, overflow: 'hidden' }}>
          <div style={{ overflowY: 'auto', padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, alignContent: 'start' }}>
            {menu.map((item) => (
              <div key={item.productId} className="glass-card" style={{ padding: 12, display: 'grid', gap: 6, opacity: item.isOutOfStock ? 0.5 : 1 }}>
                <strong style={{ fontSize: 13 }}>{item.productName}</strong>
                <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>{formatMoney(item.unitPrice)}</span>
                {item.isOutOfStock ? (
                  <span className="badge badge-danger" style={{ fontSize: 10 }}>Hết hàng</span>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
                    <button className="btn-icon" style={{ width: 26, height: 26 }} onClick={() => adjustQty(item.productId, -1)}><Minus size={12} /></button>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{cart[item.productId] || 0}</span>
                    <button className="btn-icon" style={{ width: 26, height: 26 }} onClick={() => adjustQty(item.productId, 1)}><Plus size={12} /></button>
                  </div>
                )}
              </div>
            ))}
            {!loading && menu.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Chưa có sản phẩm nào khả dụng.</p>
            )}
          </div>

          <div style={{ borderLeft: '1px solid var(--border-color)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShoppingBag size={15} /> Giỏ hàng ({cartQty})
            </h3>
            {cartLines.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Chưa chọn sản phẩm nào.</p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {cartLines.map((l) => (
                  <div key={l.item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span>{l.item.productName} x{l.qty}</span>
                    <strong>{formatMoney(l.item.unitPrice * l.qty)}</strong>
                  </div>
                ))}
              </div>
            )}

            {conflicts.length > 0 && (
              <div style={{ display: 'grid', gap: 8, padding: 10, borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--danger)', fontWeight: 700 }}>
                  <AlertTriangle size={14} /> Thiếu hàng
                </span>
                {conflicts.map((c) => (
                  <div key={c.productId} style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {c.productName}: cần {c.requestedQuantity}, còn {c.availableQuantity}.
                    {c.suggestions.length > 0 && (
                      <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {c.suggestions.map((s) => (
                          <button
                            key={s.productId}
                            className="btn btn-secondary"
                            style={{ fontSize: 10, padding: '2px 8px', minHeight: 22 }}
                            onClick={() => {
                              setCart((prev) => {
                                const next = { ...prev };
                                delete next[c.productId];
                                next[s.productId] = (next[s.productId] || 0) + c.requestedQuantity;
                                return next;
                              });
                              setConflicts((prev) => prev.filter((x) => x.productId !== c.productId));
                            }}
                          >
                            Thay bằng {s.productName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ flex: 1 }} />
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10, display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span>Tổng cộng</span>
                <strong style={{ color: 'var(--accent)', fontSize: 17 }}>{formatMoney(cartTotal)}</strong>
              </div>
              <button className="btn btn-primary" disabled={cartLines.length === 0 || selling} onClick={handleSell} style={{ minHeight: 44 }}>
                {selling ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : t('cashierSales.confirmAndPrint', 'Xác nhận bán')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConcessionPosPanel;
