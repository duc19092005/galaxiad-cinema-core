// src/features/warehouse/WarehouseManagerPage.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes, Truck, AlertTriangle, RefreshCw, Loader2, Check, X,
} from 'lucide-react';
import { warehouseApi } from '../../api/warehouseApi';
import type { StockRequestDto, StockRequestStatus } from '../../types/stockRequest.types';
import type { WasteReportDto, WasteReportStatus } from '../../types/wasteReport.types';
import { showError, showSuccess } from '../../utils/ToastUtils';
import AppSidebar from '../../components/AppSidebar';
import type { SidebarSection } from '../../components/AppSidebar';
import ManagementChrome from '../../components/ManagementChrome';
import LogoutModal from '../../components/LogoutModal';
import { authApi } from '../../api/authApi';
import Cookies from 'js-cookie';

type WarehouseTab = 'requests' | 'waste';

const WarehouseManagerPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<WarehouseTab>('requests');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Data states
  const [stockRequests, setStockRequests] = useState<StockRequestDto[]>([]);
  const [wasteReports, setWasteReports] = useState<WasteReportDto[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Action Modals
  const [approveTarget, setApproveTarget] = useState<StockRequestDto | null>(null);
  const [rejectTarget, setRejectTarget] = useState<StockRequestDto | null>(null);
  const [reviewWasteTarget, setReviewWasteTarget] = useState<WasteReportDto | null>(null);

  // Auth Guard
  useEffect(() => {
    const raw = localStorage.getItem('user_info');
    if (!raw) { navigate('/login'); return; }
    try {
      const parsed = JSON.parse(raw);
      const roles: string[] = parsed.roles || [];
      if (!roles.includes('WarehouseManager') && !roles.includes('Admin')) {
        navigate('/role-selection');
      }
    } catch { navigate('/login'); }
  }, [navigate]);

  const loadStockRequests = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = selectedStatus !== 'ALL' ? (selectedStatus as StockRequestStatus) : undefined;
      const res = await warehouseApi.getStockRequests(undefined, statusParam);
      setStockRequests(res.data || []);
    } catch {
      showError('Không thể tải danh sách yêu cầu nhập hàng.');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  const loadWasteReports = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = selectedStatus !== 'ALL' ? (selectedStatus as WasteReportStatus) : undefined;
      const res = await warehouseApi.getWasteReports(undefined, statusParam);
      setWasteReports(res.data || []);
    } catch {
      showError('Không thể tải danh sách báo cáo hao hụt.');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    if (activeTab === 'requests') loadStockRequests();
    else loadWasteReports();
  }, [activeTab, loadStockRequests, loadWasteReports]);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await authApi.logout();
      localStorage.removeItem('user_info');
      Cookies.remove('X-Access-Token');
      navigate('/login');
    } catch {
      showError('Đăng xuất thất bại.');
    } finally { setLogoutLoading(false); }
  };

  const handleShipRequest = async (id: string) => {
    try {
      await warehouseApi.shipStockRequest(id);
      showSuccess('Đã cập nhật trạng thái: Đang vận chuyển!');
      loadStockRequests();
    } catch {
      showError('Không thể cập nhật trạng thái vận chuyển.');
    }
  };

  const sidebarSections: SidebarSection[] = [
    {
      id: 'warehouse-menu',
      label: 'Kho tổng F&B',
      description: 'Điều phối hàng hóa & duyệt hao hụt',
      icon: <Boxes size={18} />,
      defaultOpen: true,
      collapsible: true,
      items: [
        { id: 'requests', label: 'Yêu cầu nhập hàng', icon: <Truck size={16} /> },
        { id: 'waste', label: 'Báo cáo hao hụt', icon: <AlertTriangle size={16} /> },
      ],
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <AppSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(open => !open)}
        activeTab={activeTab}
        onTabChange={(tab) => { setActiveTab(tab as WarehouseTab); setSelectedStatus('ALL'); }}
        sections={sidebarSections}
        role="Warehouse Manager"
        collapsibleDesktop
      />

      <ManagementChrome
        sidebarOpen={sidebarOpen}
        onSidebarToggle={() => setSidebarOpen(open => !open)}
      />

      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
        <div className="page-container" style={{ padding: '24px 20px', display: 'grid', gap: 20 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 850 }}>
                {activeTab === 'requests' ? 'Quản lý yêu cầu nhập hàng' : 'Duyệt báo cáo hàng hỏng / hao hụt'}
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                {activeTab === 'requests'
                  ? 'Duyệt phiếu xin cấp hàng từ các rạp, điều chỉnh số lượng xuất kho và khởi tạo vận chuyển.'
                  : 'Kiểm tra lý do & ảnh bằng chứng hao hụt từ các rạp để duyệt trừ tồn kho.'}
              </p>
            </div>
            <button className="btn btn-secondary" onClick={() => activeTab === 'requests' ? loadStockRequests() : loadWasteReports()} disabled={loading}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : undefined }} /> Tải lại
            </button>
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 8, border: '1px solid var(--border-color)' }}>
              {['ALL', 'Pending', 'Approved', 'Shipped', 'Received', 'Rejected'].map(st => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`btn ${selectedStatus === st ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ minHeight: 30, padding: '4px 10px', fontSize: 12 }}
                >
                  {st === 'ALL' ? 'Tất cả' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Main List */}
          {loading ? (
            <div className="state-center" style={{ minHeight: 250 }}>
              <Loader2 size={28} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Đang tải dữ liệu...</p>
            </div>
          ) : activeTab === 'requests' ? (
            <div style={{ display: 'grid', gap: 14 }}>
              {stockRequests.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 40 }}>Không có yêu cầu nhập hàng nào.</p>
              )}
              {stockRequests.map(req => (
                <div key={req.stockRequestId} className="glass-card" style={{ padding: 18, display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <strong style={{ fontSize: 16, fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent)' }}>{req.requestCode}</strong>
                        <span className={`badge ${getStatusBadgeClass(req.status)}`}>{req.status}</span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                        Rạp: <strong>{req.cinemaName}</strong> · Người yêu cầu: {req.requestedByUserName} · {new Date(req.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {req.status === 'Pending' && (
                        <>
                          <button className="btn btn-primary" style={{ minHeight: 32, fontSize: 12 }} onClick={() => setApproveTarget(req)}>
                            <Check size={14} /> Duyệt đơn
                          </button>
                          <button className="btn btn-danger" style={{ minHeight: 32, fontSize: 12 }} onClick={() => setRejectTarget(req)}>
                            <X size={14} /> Từ chối
                          </button>
                        </>
                      )}
                      {req.status === 'Approved' && (
                        <button className="btn btn-primary" style={{ minHeight: 32, fontSize: 12, background: 'linear-gradient(135deg, #059669, #10b981)', border: 'none' }} onClick={() => handleShipRequest(req.stockRequestId)}>
                          <Truck size={14} /> Xuất kho vận chuyển
                        </button>
                      )}
                    </div>
                  </div>

                  {req.note && (
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: 6 }}>
                      Ghi chú: {req.note}
                    </p>
                  )}
                  {req.rejectReason && (
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--danger)', background: 'rgba(239,68,68,0.08)', padding: '6px 10px', borderRadius: 6 }}>
                      Lý do từ chối: {req.rejectReason}
                    </p>
                  )}

                  {/* Items Table */}
                  <div className="table-container" style={{ margin: 0 }}>
                    <table style={{ width: '100%', fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th>Sản phẩm</th>
                          <th>SKU</th>
                          <th style={{ textAlign: 'center' }}>Số lượng xin</th>
                          <th style={{ textAlign: 'center' }}>Số lượng duyệt</th>
                          <th style={{ textAlign: 'center' }}>Thực nhận</th>
                        </tr>
                      </thead>
                      <tbody>
                        {req.items.map(item => (
                          <tr key={item.stockRequestItemId}>
                            <td><strong>{item.productName}</strong></td>
                            <td style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>{item.sku}</td>
                            <td style={{ textAlign: 'center' }}>{item.requestedQuantity}</td>
                            <td style={{ textAlign: 'center', color: 'var(--accent)', fontWeight: 700 }}>{item.approvedQuantity}</td>
                            <td style={{ textAlign: 'center', color: 'var(--success)' }}>{req.status === 'Received' ? item.receivedQuantity : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {wasteReports.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 40 }}>Không có báo cáo hao hụt nào.</p>
              )}
              {wasteReports.map(report => (
                <div key={report.wasteReportId} className="glass-card" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <strong style={{ fontSize: 15 }}>{report.productName}</strong>
                      <span className={`badge ${getStatusBadgeClass(report.status)}`}>{report.status}</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                      Rạp: <strong>{report.cinemaName}</strong> · Số lượng hủy: <strong style={{ color: 'var(--danger)' }}>{report.quantity}</strong> · Người báo: {report.reportedByUserName}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                      Lý do: {report.reason}
                    </p>
                    {report.proofImageUrl && (
                      <a href={report.proofImageUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, display: 'inline-block' }}>
                        Xem ảnh minh chứng ↗
                      </a>
                    )}
                  </div>
                  {report.status === 'Pending' && (
                    <button className="btn btn-primary" style={{ minHeight: 34, fontSize: 12 }} onClick={() => setReviewWasteTarget(report)}>
                      Xem xét &amp; Duyệt
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Approve Stock Request Modal */}
      {approveTarget && (
        <ApproveModal
          request={approveTarget}
          onClose={() => setApproveTarget(null)}
          onSaved={() => { setApproveTarget(null); loadStockRequests(); }}
        />
      )}

      {/* Reject Stock Request Modal */}
      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onSaved={() => { setRejectTarget(null); loadStockRequests(); }}
        />
      )}

      {/* Review Waste Report Modal */}
      {reviewWasteTarget && (
        <ReviewWasteModal
          report={reviewWasteTarget}
          onClose={() => setReviewWasteTarget(null)}
          onSaved={() => { setReviewWasteTarget(null); loadWasteReports(); }}
        />
      )}

      <LogoutModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleLogout}
        loading={logoutLoading}
      />
    </div>
  );
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'Pending': return 'badge-warning';
    case 'Approved': return 'badge-accent';
    case 'Shipped': return 'badge-info';
    case 'Received': return 'badge-success';
    case 'Rejected': return 'badge-danger';
    default: return 'badge-secondary';
  }
};

// ================= Modals =================

const ApproveModal: React.FC<{ request: StockRequestDto; onClose: () => void; onSaved: () => void }> = ({ request, onClose, onSaved }) => {
  const [items, setItems] = useState(request.items.map(i => ({ productId: i.productId, approvedQuantity: i.requestedQuantity })));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await warehouseApi.approveStockRequest(request.stockRequestId, { items, note: note.trim() || undefined });
      showSuccess('Đã duyệt yêu cầu nhập hàng.');
      onSaved();
    } catch {
      showError('Duyệt thất bại.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 500, padding: 24, display: 'grid', gap: 14 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Duyệt đơn: {request.requestCode}</h2>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Có thể điều chỉnh số lượng xuất kho thực tế nếu rạp xin vượt hạn mức.</p>

        <div style={{ display: 'grid', gap: 10, maxHeight: 240, overflowY: 'auto' }}>
          {request.items.map((item, idx) => (
            <div key={item.stockRequestItemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, flex: 1 }}>{item.productName} (Xin: {item.requestedQuantity})</span>
              <input
                type="number"
                min={0}
                className="input"
                style={{ width: 90, minHeight: 32 }}
                value={items[idx]?.approvedQuantity ?? item.requestedQuantity}
                onChange={e => {
                  const val = Number(e.target.value) || 0;
                  setItems(prev => prev.map((it, i) => i === idx ? { ...it, approvedQuantity: val } : it));
                }}
              />
            </div>
          ))}
        </div>

        <div>
          <label className="input-label">Ghi chú duyệt</label>
          <input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="VD: Giảm 10 do hết hàng tại kho" />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Xác nhận duyệt'}
          </button>
        </div>
      </div>
    </div>
  );
};

const RejectModal: React.FC<{ request: StockRequestDto; onClose: () => void; onSaved: () => void }> = ({ request, onClose, onSaved }) => {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!reason.trim()) { showError('Vui lòng nhập lý do từ chối.'); return; }
    setSaving(true);
    try {
      await warehouseApi.rejectStockRequest(request.stockRequestId, { reason: reason.trim() });
      showSuccess('Đã từ chối yêu cầu.');
      onSaved();
    } catch { showError('Thao tác thất bại.'); } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 420, padding: 24, display: 'grid', gap: 14 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--danger)' }}>Từ chối đơn: {request.requestCode}</h2>
        <div>
          <label className="input-label">Lý do từ chối *</label>
          <textarea className="input" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="VD: Hàng tạm thời ngưng kinh doanh" />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-danger" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Xác nhận từ chối'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ReviewWasteModal: React.FC<{ report: WasteReportDto; onClose: () => void; onSaved: () => void }> = ({ report, onClose, onSaved }) => {
  const [reviewNote, setReviewNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleReview = async (approve: boolean) => {
    setSaving(true);
    try {
      await warehouseApi.reviewWasteReport(report.wasteReportId, { approve, reviewNote: reviewNote.trim() || undefined });
      showSuccess(approve ? 'Đã duyệt hủy hàng và trừ tồn kho rạp.' : 'Đã từ chối báo cáo.');
      onSaved();
    } catch { showError('Thao tác thất bại.'); } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 460, padding: 24, display: 'grid', gap: 14 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Xem xét báo cáo hao hụt</h2>
        <div style={{ fontSize: 13, display: 'grid', gap: 6 }}>
          <p style={{ margin: 0 }}>Sản phẩm: <strong>{report.productName}</strong> ({report.sku})</p>
          <p style={{ margin: 0 }}>Số lượng hủy: <strong style={{ color: 'var(--danger)' }}>{report.quantity}</strong></p>
          <p style={{ margin: 0 }}>Rạp: <strong>{report.cinemaName}</strong> · Người báo: {report.reportedByUserName}</p>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Lý do: {report.reason}</p>
        </div>
        <div>
          <label className="input-label">Ghi chú phản hồi</label>
          <input className="input" value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="Ghi chú thêm (nếu có)" />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-danger" onClick={() => handleReview(false)} disabled={saving}>Từ chối</button>
          <button className="btn btn-primary" onClick={() => handleReview(true)} disabled={saving}>
            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Duyệt trừ tồn kho'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarehouseManagerPage;
