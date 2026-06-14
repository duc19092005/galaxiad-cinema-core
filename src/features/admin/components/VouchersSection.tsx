// src/features/admin/components/VouchersSection.tsx
import React, { useState, useEffect } from 'react';
import { 
  Ticket, Plus, Edit2, Trash2, Loader2, X, Check, 
  Tag, CheckCircle, TrendingDown, Award, Search, Info 
} from 'lucide-react';
import { voucherApi, type VoucherDto, type CreateVoucherDto, type UpdateVoucherDto } from '../../../api/voucherApi';
import { adminApi } from '../../../api/adminApi';
import type { RoleDto, AuditLogDto } from '../../../types/admin.types';
import { showSuccess, showError } from '../../../utils/ToastUtils';

export const VouchersSection: React.FC = () => {
  const [vouchers, setVouchers] = useState<VoucherDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Audit Logs State (Recent Activity)
  const [auditLogs, setAuditLogs] = useState<AuditLogDto[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherDto | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    voucherName: '',
    voucherDescription: '',
    voucherAmount: 0,
    voucherDiscountPercent: 10,
    roleId: '',
    validFrom: '',
    validTo: '',
    voucherPointsCost: 100,
    voucherQuantity: 50,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await adminApi.getRecentAuditLogs(50);
      if (res.isSuccess) {
        const logs = res.data || [];
        const voucherLogs = logs.filter(log => 
          log.entityType?.toLowerCase().includes('voucher') ||
          log.description?.toLowerCase().includes('voucher') ||
          log.action?.toLowerCase().includes('voucher')
        );
        // Fallback to recent system administrative logs if there are no voucher-specific logs
        setAuditLogs(voucherLogs.length > 0 ? voucherLogs : logs.slice(0, 8));
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, rRes] = await Promise.all([
        voucherApi.getAllVouchers(),
        adminApi.getRolesPermissions(),
      ]);
      if (vRes.isSuccess) setVouchers(vRes.data || []);
      if (rRes.isSuccess) {
        setRoles((rRes.data || []).map((role) => ({ roleId: role.roleId, roleName: role.roleName })));
      }
      fetchAuditLogs();
    } catch (err) {
      console.error(err);
      showError('Failed to fetch voucher management data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingVoucher(null);
    setForm({
      voucherName: '',
      voucherDescription: '',
      voucherAmount: 0,
      voucherDiscountPercent: 10,
      roleId: roles.find(r => r.roleName === 'User')?.roleId || roles[0]?.roleId || '',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      voucherPointsCost: 100,
      voucherQuantity: 50,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: VoucherDto) => {
    setEditingVoucher(v);
    setForm({
      voucherName: v.voucherName,
      voucherDescription: v.voucherDescription,
      voucherAmount: v.voucherAmount,
      voucherDiscountPercent: v.voucherDiscountPercent,
      roleId: v.roleId,
      validFrom: v.validFrom ? v.validFrom.split('T')[0] : '',
      validTo: v.validTo ? v.validTo.split('T')[0] : '',
      voucherPointsCost: v.voucherPointsCost,
      voucherQuantity: v.voucherQuantity,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this voucher? Users who redeemed it might still keep it.')) return;
    try {
      const res = await voucherApi.deleteVoucher(id);
      if (res.isSuccess) {
        showSuccess('Voucher deleted successfully.');
        fetchData();
      } else {
        showError('Delete failed.');
      }
    } catch (err) {
      console.error(err);
      showError('Delete failed due to connection error.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.voucherName.trim() || !form.voucherDescription.trim()) {
      showError('Please fill in Name and Description.');
      return;
    }
    if (form.voucherDiscountPercent <= 0 || form.voucherDiscountPercent > 100) {
      showError('Discount must be between 1% and 100%.');
      return;
    }
    if (form.voucherPointsCost < 0) {
      showError('Points cost cannot be negative.');
      return;
    }
    if (form.voucherQuantity <= 0) {
      showError('Quantity must be greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null,
        validTo: form.validTo ? new Date(form.validTo).toISOString() : null,
      };

      if (editingVoucher) {
        const res = await voucherApi.updateVoucher(editingVoucher.voucherId, payload as UpdateVoucherDto);
        if (res.isSuccess) {
          showSuccess('Voucher updated successfully.');
          setIsModalOpen(false);
          fetchData();
        } else {
          showError('Update failed.');
        }
      } else {
        const res = await voucherApi.createVoucher(payload as CreateVoucherDto);
        if (res.isSuccess) {
          showSuccess('Voucher created successfully.');
          setIsModalOpen(false);
          fetchData();
        } else {
          showError('Create failed.');
        }
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Submit operation failed.';
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleDisplayName = (name: string) => {
    if (!name) return 'All';
    if (name === 'Customer') return 'Customer (Regular User)';
    if (name === 'User') return 'User (Regular User)';
    return name;
  };

  // Helper date period formatter
  const formatPeriod = (v: VoucherDto) => {
    const fromStr = v.validFrom ? new Date(v.validFrom).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Immediate';
    const toStr = v.validTo ? new Date(v.validTo).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unlimited';
    return `${fromStr} — ${toStr}`;
  };

  // Help relative time formatter
  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return 'Unknown time';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Maps action string to nice log indicators
  const getLogIconAndColor = (action: string) => {
    const normalized = action.toLowerCase();
    if (normalized.includes('create') || normalized.includes('add') || normalized.includes('insert')) {
      return {
        icon: <Plus size={14} />,
        bgColor: 'bg-emerald-500/10 border border-emerald-500/20',
        textColor: 'text-emerald-400',
        title: 'Voucher Created'
      };
    }
    if (normalized.includes('update') || normalized.includes('edit') || normalized.includes('modify')) {
      return {
        icon: <Edit2 size={14} />,
        bgColor: 'bg-amber-500/10 border border-amber-500/20',
        textColor: 'text-amber-400',
        title: 'Voucher Updated'
      };
    }
    if (normalized.includes('delete') || normalized.includes('remove') || normalized.includes('expired')) {
      return {
        icon: <Trash2 size={14} />,
        bgColor: 'bg-rose-500/10 border border-rose-500/20',
        textColor: 'text-rose-400',
        title: 'Voucher Removed'
      };
    }
    return {
      icon: <Ticket size={14} />,
      bgColor: 'bg-cinema-accent/10 border border-cinema-accent/20',
      textColor: 'text-cinema-accent',
      title: action || 'Voucher Activity'
    };
  };

  // Filter vouchers on search query
  const filteredVouchers = vouchers.filter(v =>
    v.voucherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.voucherDescription.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dynamic calculations
  const totalVouchers = vouchers.length;
  const activeVouchers = vouchers.filter(v => v.isActive && (!v.validTo || new Date(v.validTo) > new Date())).length;
  
  const totalQty = vouchers.reduce((sum, v) => sum + v.voucherQuantity, 0);
  const totalRemaining = vouchers.reduce((sum, v) => sum + v.remainingQuantity, 0);
  const totalRedeemed = totalQty - totalRemaining;
  const redemptionRate = totalQty > 0 ? ((totalRedeemed / totalQty) * 100).toFixed(1) : '0';
  
  const totalPointsValue = vouchers.reduce((sum, v) => sum + (v.voucherPointsCost * v.voucherQuantity), 0);
  
  const formatPoints = (val: number) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toString();
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 p-1 min-w-0 animate-fade-in">
      {/* Main Section */}
      <div className="flex-1 space-y-6 min-w-0">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-cinema-accent tracking-tight">Voucher Management</h1>
            <p className="text-sm text-cinema-text-muted mt-1">Create, update, and manage public vouchers for the rewards system.</p>
          </div>
          <button 
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-cinema-accent hover:bg-cinema-accent-hover text-black font-bold text-xs rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-cinema-accent/10 whitespace-nowrap self-start sm:self-center"
          >
            <Plus size={16} />
            CREATE NEW VOUCHER
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Vouchers */}
          <div className="p-5 bg-cinema-surface border border-cinema-border/50 rounded-2xl shadow-sm hover:border-cinema-accent/20 transition-all duration-200">
            <div className="flex justify-between items-start mb-3">
              <span className="p-2 bg-cinema-accent/10 rounded-lg text-cinema-accent">
                <Tag size={20} />
              </span>
              <span className="text-emerald-400 text-xs font-semibold px-2 py-0.5 bg-emerald-500/10 rounded-full">
                Active: {activeVouchers}
              </span>
            </div>
            <p className="text-cinema-text-muted text-xs font-medium uppercase tracking-wider">Total Vouchers</p>
            <p className="text-2xl font-bold mt-1 text-cinema-text">{totalVouchers}</p>
          </div>

          {/* Card 2: Active Vouchers */}
          <div className="p-5 bg-cinema-surface border border-cinema-border/50 rounded-2xl shadow-sm hover:border-cinema-success/20 transition-all duration-200">
            <div className="flex justify-between items-start mb-3">
              <span className="p-2 bg-cinema-success/10 rounded-lg text-cinema-success">
                <CheckCircle size={20} />
              </span>
              <span className="text-cinema-success text-xs font-semibold px-2 py-0.5 bg-cinema-success/10 rounded-full">
                Healthy
              </span>
            </div>
            <p className="text-cinema-text-muted text-xs font-medium uppercase tracking-wider">Active Vouchers</p>
            <p className="text-2xl font-bold mt-1 text-cinema-text">{activeVouchers}</p>
          </div>

          {/* Card 3: Redemption Rate */}
          <div className="p-5 bg-cinema-surface border border-cinema-border/50 rounded-2xl shadow-sm hover:border-amber-500/20 transition-all duration-200">
            <div className="flex justify-between items-start mb-3">
              <span className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                <TrendingDown size={20} />
              </span>
              <span className="text-amber-400 text-xs font-semibold px-2 py-0.5 bg-amber-500/10 rounded-full">
                Redeemed: {totalRedeemed}
              </span>
            </div>
            <p className="text-cinema-text-muted text-xs font-medium uppercase tracking-wider">Redemption Rate</p>
            <p className="text-2xl font-bold mt-1 text-cinema-text">{redemptionRate}%</p>
          </div>

          {/* Card 4: Total Points Value */}
          <div className="p-5 bg-cinema-surface border border-cinema-border/50 rounded-2xl shadow-sm hover:border-blue-500/20 transition-all duration-200">
            <div className="flex justify-between items-start mb-3">
              <span className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <Award size={20} />
              </span>
              <span className="text-cinema-text-muted text-xs font-semibold">
                Max Value
              </span>
            </div>
            <p className="text-cinema-text-muted text-xs font-medium uppercase tracking-wider">Total Points Cost</p>
            <p className="text-2xl font-bold mt-1 text-cinema-text">{formatPoints(totalPointsValue)}</p>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-cinema-surface rounded-2xl border border-cinema-border/50 overflow-hidden shadow-md">
          {/* Table Header Card */}
          <div className="p-5 border-b border-cinema-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-cinema-text">Active Inventory</h3>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cinema-text-muted" />
                <input 
                  type="text" 
                  placeholder="Search vouchers..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 w-full sm:w-60 bg-cinema-elevated text-cinema-text text-sm rounded-lg border border-cinema-border focus:ring-1 focus:ring-cinema-accent focus:border-cinema-accent outline-none"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 size={36} className="animate-spin text-cinema-accent" />
                <p className="text-xs text-cinema-text-muted font-mono">Loading vouchers...</p>
              </div>
            ) : filteredVouchers.length === 0 ? (
              <div className="text-center py-20 text-cinema-text-muted text-sm">
                {searchQuery ? 'No vouchers match your search.' : 'No vouchers found. Create one to begin!'}
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-cinema-elevated/40 border-b border-cinema-border/30">
                    <th className="px-6 py-4 text-xs font-bold text-cinema-text-muted uppercase tracking-wider">Voucher Code</th>
                    <th className="px-6 py-4 text-xs font-bold text-cinema-text-muted uppercase tracking-wider text-right">Discount</th>
                    <th className="px-6 py-4 text-xs font-bold text-cinema-text-muted uppercase tracking-wider text-right">Points</th>
                    <th className="px-6 py-4 text-xs font-bold text-cinema-text-muted uppercase tracking-wider text-right">Qty</th>
                    <th className="px-6 py-4 text-xs font-bold text-cinema-text-muted uppercase tracking-wider">Validity Period</th>
                    <th className="px-6 py-4 text-xs font-bold text-cinema-text-muted uppercase tracking-wider text-center">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-cinema-text-muted uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cinema-border/30">
                  {filteredVouchers.map((v) => {
                    const validToDate = v.validTo ? new Date(v.validTo) : null;
                    const now = new Date();
                    const remainingDays = validToDate ? Math.ceil((validToDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                    const isExpired = validToDate ? validToDate < now : false;
                    const isVoucherActive = v.isActive && !isExpired;

                    return (
                      <tr key={v.voucherId} className="hover:bg-cinema-elevated/20 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-cinema-accent/10 rounded-lg flex items-center justify-center text-cinema-accent flex-shrink-0">
                              <Ticket size={16} />
                            </div>
                            <div>
                              <span className="font-mono text-sm font-extrabold text-cinema-accent">{v.voucherName}</span>
                              <p className="text-xs text-cinema-text-muted mt-0.5 line-clamp-1 max-w-[200px]" title={v.voucherDescription}>
                                {v.voucherDescription}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-sm text-cinema-text">{v.voucherDiscountPercent}%</td>
                        <td className="px-6 py-4 text-right font-mono text-sm text-cinema-accent">{v.voucherPointsCost} pts</td>
                        <td className="px-6 py-4 text-right text-sm text-cinema-text">
                          <span className="font-semibold">{v.remainingQuantity}</span>
                          <span className="text-cinema-text-muted/60">/{v.voucherQuantity}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-cinema-text">
                          <div className="flex flex-col">
                            <span>{formatPeriod(v)}</span>
                            <span className="text-xs text-cinema-text-muted mt-0.5">
                              {remainingDays !== null 
                                ? (remainingDays > 0 ? `Remaining: ${remainingDays} days` : 'Expired')
                                : 'Evergreen Promotion'
                              }
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            isVoucherActive 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : isExpired 
                                ? 'bg-rose-500/10 text-rose-400' 
                                : 'bg-zinc-500/10 text-zinc-400'
                          }`}>
                            {isVoucherActive ? 'Active' : isExpired ? 'Expired' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenEdit(v)}
                              className="p-1.5 bg-cinema-elevated hover:bg-cinema-accent/20 text-cinema-accent border border-cinema-border/60 hover:border-cinema-accent/30 rounded-lg transition-colors"
                              title="Edit Voucher"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(v.voucherId)}
                              className="p-1.5 bg-cinema-elevated hover:bg-rose-500/20 text-rose-400 border border-cinema-border/60 hover:border-rose-500/30 rounded-lg transition-colors"
                              title="Delete Voucher"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Side Sidebar (Activity & Promo) */}
      <aside className="w-full xl:w-80 flex flex-col gap-6 flex-shrink-0 animate-fade-in">
        
        {/* Recent Activity Card */}
        <div className="bg-cinema-surface rounded-2xl border border-cinema-border/50 p-6 flex flex-col h-[400px] xl:h-[480px]">
          <div className="flex justify-between items-center border-b border-cinema-border/30 pb-4 mb-4">
            <h3 className="text-base font-bold text-cinema-text">Recent Activity</h3>
            <span className="text-xs font-mono text-cinema-accent">Live Log</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            {logsLoading && auditLogs.length === 0 ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 size={24} className="animate-spin text-cinema-accent" />
              </div>
            ) : auditLogs.length === 0 ? (
              <p className="text-xs text-cinema-text-muted font-mono italic text-center py-20">No recent activity found.</p>
            ) : (
              auditLogs.map((log) => {
                const activity = getLogIconAndColor(log.action);
                return (
                  <div key={log.auditLogId} className="flex gap-3 relative group">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full ${activity.bgColor} flex items-center justify-center text-xs z-10`}>
                      {activity.icon}
                    </div>
                    <div className="flex-grow pb-1">
                      <p className="text-xs font-bold text-cinema-text">{activity.title}</p>
                      <p className="text-xs text-cinema-text-muted mt-0.5 leading-relaxed">{log.description || `${log.actorName} performed ${log.action} on ${log.entityName}`}</p>
                      <p className="text-[10px] text-cinema-text-muted/60 mt-1 font-mono">{formatRelativeTime(log.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Promo/Help Card */}
        <div className="bg-cinema-accent/5 border border-cinema-accent/15 rounded-2xl p-6 relative overflow-hidden group">
          <div className="relative z-10">
            <h4 className="text-base font-bold text-cinema-accent">Need Help?</h4>
            <p className="text-xs text-cinema-text-muted mt-2 leading-relaxed">
              Check out our administration documentation on voucher campaign strategies and points multiplier rules.
            </p>
            <a 
              href="/docs" 
              onClick={(e) => e.preventDefault()}
              className="mt-4 inline-flex items-center justify-center w-full px-4 py-2 bg-cinema-elevated hover:bg-cinema-hover text-cinema-accent text-xs font-bold rounded-lg border border-cinema-border transition-colors text-center"
            >
              System Documentation
            </a>
          </div>
          <div className="absolute -bottom-6 -right-6 text-cinema-accent/5 group-hover:scale-110 group-hover:text-cinema-accent/10 transition-all duration-300">
            <Info size={110} />
          </div>
        </div>
      </aside>

      {/* Create / Edit Modal overlay */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[1000] flex justify-center items-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-cinema-elevated border border-cinema-border rounded-2xl shadow-2xl flex flex-col max-h-[calc(100vh-48px)] min-h-0 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-cinema-border flex-shrink-0">
              <div className="flex items-center gap-2 text-cinema-accent">
                <Ticket size={20} />
                <h3 className="text-lg font-extrabold text-cinema-text">
                  {editingVoucher ? 'Edit Voucher Config' : 'Create New Voucher'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 bg-cinema-bg hover:bg-cinema-surface rounded-full text-cinema-text-muted hover:text-cinema-text transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 min-h-0">
              <form id="voucher-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                
                {/* Voucher Name / Code */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-cinema-text-muted">Voucher Name / Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUMMER2026"
                    value={form.voucherName}
                    onChange={(e) => setForm({ ...form, voucherName: e.target.value })}
                    className="w-full px-4 py-2 bg-cinema-surface border border-cinema-border/80 rounded-xl text-sm text-cinema-text focus:ring-1 focus:ring-cinema-accent focus:border-cinema-accent outline-none"
                  />
                </div>

                {/* Terms / Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-cinema-text-muted">Terms & Usage Info *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide voucher usage terms, rules, and value info..."
                    value={form.voucherDescription}
                    onChange={(e) => setForm({ ...form, voucherDescription: e.target.value })}
                    className="w-full px-4 py-2 bg-cinema-surface border border-cinema-border/80 rounded-xl text-sm text-cinema-text focus:ring-1 focus:ring-cinema-accent focus:border-cinema-accent outline-none resize-none"
                  />
                </div>

                {/* Discount, Points, Quantity Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-cinema-text-muted">Discount (%) *</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={form.voucherDiscountPercent}
                      onChange={(e) => setForm({ ...form, voucherDiscountPercent: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-cinema-surface border border-cinema-border/80 rounded-xl text-sm text-cinema-text focus:ring-1 focus:ring-cinema-accent focus:border-cinema-accent outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-cinema-text-muted">Points Cost *</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={form.voucherPointsCost}
                      onChange={(e) => setForm({ ...form, voucherPointsCost: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-cinema-surface border border-cinema-border/80 rounded-xl text-sm text-cinema-text focus:ring-1 focus:ring-cinema-accent focus:border-cinema-accent outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-cinema-text-muted">Quantity *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={form.voucherQuantity}
                      onChange={(e) => setForm({ ...form, voucherQuantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-cinema-surface border border-cinema-border/80 rounded-xl text-sm text-cinema-text focus:ring-1 focus:ring-cinema-accent focus:border-cinema-accent outline-none"
                    />
                  </div>
                </div>

                {/* Target User Role */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-cinema-text-muted">Target User Role Constraint *</label>
                  <select
                    value={form.roleId}
                    onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                    className="w-full px-4 py-2 bg-cinema-surface border border-cinema-border/80 rounded-xl text-sm text-cinema-text focus:ring-1 focus:ring-cinema-accent focus:border-cinema-accent outline-none cursor-pointer"
                  >
                    {roles.map((r) => (
                      <option key={r.roleId} value={r.roleId} className="bg-cinema-elevated">
                        {getRoleDisplayName(r.roleName)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-cinema-text-muted">Valid From</label>
                    <input
                      type="date"
                      value={form.validFrom}
                      onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                      className="w-full px-4 py-2 bg-cinema-surface border border-cinema-border/80 rounded-xl text-sm text-cinema-text focus:ring-1 focus:ring-cinema-accent focus:border-cinema-accent outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-cinema-text-muted">Valid To</label>
                    <input
                      type="date"
                      value={form.validTo}
                      onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                      className="w-full px-4 py-2 bg-cinema-surface border border-cinema-border/80 rounded-xl text-sm text-cinema-text focus:ring-1 focus:ring-cinema-accent focus:border-cinema-accent outline-none"
                    />
                  </div>
                </div>

              </form>
            </div>

            {/* Sticky Footer */}
            <div className="px-6 py-4 border-t border-cinema-border flex gap-3 flex-shrink-0 bg-cinema-elevated">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 bg-cinema-surface hover:bg-cinema-bg text-cinema-text border border-cinema-border rounded-xl text-sm font-semibold transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                form="voucher-form"
                type="submit"
                disabled={submitting}
                className="flex-[2] py-2.5 bg-cinema-accent hover:bg-cinema-accent-hover disabled:bg-cinema-accent/50 disabled:cursor-not-allowed text-black rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.99] shadow-lg shadow-cinema-accent/15"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    SAVE VOUCHER
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
