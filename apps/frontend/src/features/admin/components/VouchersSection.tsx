// src/features/admin/components/VouchersSection.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Ticket, Plus, Edit2, Trash2, Loader2, ShoppingBag, X, Check, Users, Briefcase } from 'lucide-react';
import { voucherApi, type VoucherDto, type CreateVoucherDto, type UpdateVoucherDto } from '../../../api/voucherApi';
import { adminApi } from '../../../api/adminApi';
import type { RoleDto } from '../../../types/admin.types';
import { showSuccess, showError } from '../../../utils/ToastUtils';
import { useTranslation } from 'react-i18next';

const MEMBERSHIP_RANKS = [
  { id: 0, name: 'Standard' },
  { id: 1, name: 'VIP' },
  { id: 2, name: 'Gold' },
  { id: 3, name: 'Diamond' },
];

const getRankLabel = (rank: number) => {
  switch (rank) {
    case 0: return 'Standard';
    case 1: return 'VIP';
    case 2: return 'Gold';
    case 3: return 'Diamond';
    default: return 'Unknown';
  }
};

export const VouchersSection: React.FC = () => {
  const { t } = useTranslation();
  const [vouchers, setVouchers] = useState<VoucherDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [creationType, setCreationType] = useState<'customer' | 'staff' | null>(null);
  const [hoveredCard, setHoveredCard] = useState<'customer' | 'staff' | null>(null);

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
    targetRanks: [] as number[],
  });

  // Filter & Sort State
  const [filterRole, setFilterRole] = useState('');
  const [filterRank, setFilterRank] = useState('');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, rRes] = await Promise.all([
        voucherApi.getAllVouchers(),
        adminApi.getRoles(),
      ]);
      if (vRes.isSuccess) setVouchers(vRes.data || []);
      if (rRes.isSuccess) setRoles(rRes.data || []);
    } catch (err) {
      console.error(err);
      showError(t('vouchersSection.errorFetchData'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingVoucher(null);
    setCreationType(null);
    const initialRoleId = roles.find(r => r.roleName === 'Customer' || r.roleName === 'User')?.roleId || roles[0]?.roleId || '';
    setForm({
      voucherName: '',
      voucherDescription: '',
      voucherAmount: 0,
      voucherDiscountPercent: 10,
      roleId: initialRoleId,
      validFrom: new Date().toISOString().split('T')[0],
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      voucherPointsCost: 100,
      voucherQuantity: 50,
      targetRanks: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: VoucherDto) => {
    setEditingVoucher(v);
    setCreationType(v.roleName === 'Customer' ? 'customer' : 'staff');
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
      targetRanks: v.targetRanks || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('vouchersSection.deleteConfirm'))) return;
    try {
      const res = await voucherApi.deleteVoucher(id);
      if (res.isSuccess) {
        showSuccess(t('vouchersSection.deleted'));
        fetchData();
      } else {
        showError(t('vouchersSection.deleteFailed'));
      }
    } catch (err) {
      console.error(err);
      showError(t('vouchersSection.deleteFailedConnection'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.voucherName.trim() || !form.voucherDescription.trim()) {
      showError(t('vouchersSection.errorFillNameDescription'));
      return;
    }
    if (form.voucherDiscountPercent <= 0 || form.voucherDiscountPercent > 100) {
      showError(t('vouchersSection.errorDiscountRange'));
      return;
    }
    if (form.voucherPointsCost < 0) {
      showError(t('vouchersSection.errorPointsNegative'));
      return;
    }
    if (form.voucherQuantity <= 0) {
      showError(t('vouchersSection.errorQuantityZero'));
      return;
    }

    setSubmitting(true);
    try {
      const selectedRole = roles.find(r => r.roleId === form.roleId);
      const isCustomer = selectedRole?.roleName === 'Customer';

      const payload = {
        ...form,
        targetRanks: isCustomer ? form.targetRanks : [],
        validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null,
        validTo: form.validTo ? new Date(form.validTo).toISOString() : null,
      };

      if (editingVoucher) {
        const res = await voucherApi.updateVoucher(editingVoucher.voucherId, payload as UpdateVoucherDto);
        if (res.isSuccess) {
          showSuccess(t('vouchersSection.updated'));
          setIsModalOpen(false);
          fetchData();
        } else {
          showError(t('vouchersSection.updateFailed'));
        }
      } else {
        const res = await voucherApi.createVoucher(payload as CreateVoucherDto);
        if (res.isSuccess) {
          showSuccess(t('vouchersSection.created'));
          setIsModalOpen(false);
          fetchData();
        } else {
          showError(t('vouchersSection.createFailed'));
        }
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || t('vouchersSection.submitFailed');
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeClass = (name: string) => {
    switch (name) {
      case 'Admin': return 'badge-accent';
      case 'VIP': return 'badge-accent';
      case 'Student': return 'badge-success';
      case 'Loyalty': return 'badge-warning';
      case 'User':
      case 'Customer': return 'badge-success';
      default: return 'badge-default';
    }
  };

  const getRoleDisplayName = (name: string) => {
    if (!name) return 'All';
    if (name === 'Customer') return 'Customer (Regular User)';
    if (name === 'User') return 'User (Regular User)';
    return name;
  };

  const processedVouchers = useMemo(() => {
    let result = [...vouchers];

    // Filter by Role
    if (filterRole) {
      result = result.filter(v => v.roleId === filterRole);
    }

    // Filter by Rank
    if (filterRank !== '') {
      const rankNum = parseInt(filterRank);
      result = result.filter(v => 
        v.roleName === 'Customer' && 
        v.targetRanks && (v.targetRanks.length === 0 || v.targetRanks.includes(rankNum))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.voucherName.localeCompare(b.voucherName);
      }
      if (sortBy === 'role') {
        return (a.roleName || '').localeCompare(b.roleName || '');
      }
      if (sortBy === 'rank') {
        const getHighestRank = (v: VoucherDto) => {
          if (v.roleName !== 'Customer') return -1;
          if (!v.targetRanks || v.targetRanks.length === 0) return 99; // "All ranks" first or last? Let's treat it as lowest restriction (value 99)
          return Math.max(...v.targetRanks);
        };
        return getHighestRank(b) - getHighestRank(a);
      }
      if (sortBy === 'discount') {
        return b.voucherDiscountPercent - a.voucherDiscountPercent;
      }
      if (sortBy === 'stock') {
        return b.remainingQuantity - a.remainingQuantity;
      }
      return 0;
    });

    return result;
  }, [vouchers, filterRole, filterRank, sortBy]);

  return (
    <div className="animate-in">
      {/* Header Panel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('vouchersSection.title')}</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>{t('vouchersSection.description')}</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> {t('vouchersSection.newVoucher')}
        </button>
      </div>

      {/* Filter & Sort Bar */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '8px',
        border: '1px solid var(--border-color, #27272a)'
      }}>
        {/* Filter by Role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Lọc vai trò:</span>
          <select
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value);
              setFilterRank(''); // reset rank filter if role changes
            }}
            className="input"
            style={{ height: '32px', padding: '0 8px', fontSize: '12px', minWidth: '120px', cursor: 'pointer' }}
          >
            <option value="">Tất cả</option>
            {roles.map(r => (
              <option key={r.roleId} value={r.roleId}>{getRoleDisplayName(r.roleName)}</option>
            ))}
          </select>
        </div>

        {/* Filter by Rank */}
        {filterRole && roles.find(r => r.roleId === filterRole)?.roleName === 'Customer' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Lọc hạng khách:</span>
            <select
              value={filterRank}
              onChange={(e) => setFilterRank(e.target.value)}
              className="input"
              style={{ height: '32px', padding: '0 8px', fontSize: '12px', minWidth: '120px', cursor: 'pointer' }}
            >
              <option value="">Tất cả hạng</option>
              <option value="0">Standard</option>
              <option value="1">VIP</option>
              <option value="2">Gold</option>
              <option value="3">Diamond</option>
            </select>
          </div>
        )}

        {/* Sort Option */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Sắp xếp theo:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input"
            style={{ height: '32px', padding: '0 8px', fontSize: '12px', minWidth: '160px', cursor: 'pointer' }}
          >
            <option value="name">Tên Voucher</option>
            <option value="role">Vai trò</option>
            <option value="rank">Hạng khách hàng</option>
            <option value="discount">Phần trăm giảm</option>
            <option value="stock">Số lượng còn lại</option>
          </select>
        </div>
      </div>

      {/* Table grid */}
      <div className="table-container">
        {loading ? (
          <div className="state-center" style={{ minHeight: '30vh' }}>
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              {t('vouchersSection.loading')}
            </p>
          </div>
        ) : processedVouchers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            Không tìm thấy voucher nào phù hợp.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('vouchersSection.voucherName')}</th>
                <th>{t('vouchersSection.discount')}</th>
                <th>{t('vouchersSection.pointCost')}</th>
                <th>{t('vouchersSection.stockLeft')}</th>
                <th>{t('vouchersSection.targetRole')}</th>
                <th>{t('vouchersSection.validityPeriod')}</th>
                <th style={{ width: 140 }}>{t('vouchersSection.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {processedVouchers.map((v) => (
                <tr key={v.voucherId}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{v.voucherName}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.voucherDescription}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, color: 'var(--primary, #ff8a00)' }}>{v.voucherDiscountPercent}%</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)' }}>
                      <ShoppingBag size={12} style={{ color: 'var(--accent)' }} />
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>{v.voucherPointsCost} {t('vouchersSection.pts')}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700 }}>{v.remainingQuantity} / {v.voucherQuantity}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className={`badge ${getRoleBadgeClass(v.roleName)}`}>
                        {getRoleDisplayName(v.roleName)}
                      </span>
                      {v.roleName === 'Customer' && (
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {v.targetRanks && v.targetRanks.length > 0
                            ? `Hạng: ${v.targetRanks.map(r => getRankLabel(r)).join(', ')}`
                            : 'Tất cả hạng'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span>{t('vouchersSection.validFrom')}: {v.validFrom ? new Date(v.validFrom).toLocaleDateString('vi-VN') : t('vouchersSection.immediate')}</span>
                      <span>{t('vouchersSection.validTo')}: {v.validTo ? new Date(v.validTo).toLocaleDateString('vi-VN') : t('vouchersSection.unlimited')}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenEdit(v)}
                        className="btn"
                        style={{
                          padding: '4px 10px', fontSize: 12, height: 28, minHeight: 0,
                          borderColor: 'rgba(99, 102, 241, 0.4)', color: '#818cf8',
                          background: 'rgba(99, 102, 241, 0.05)',
                        }}
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(v.voucherId)}
                        className="btn"
                        style={{
                          padding: '4px 10px', fontSize: 12, height: 28, minHeight: 0,
                          borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--danger)',
                          background: 'rgba(239, 68, 68, 0.05)',
                        }}
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

      {/* Create / Edit Modal overlay */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1000, overflowY: 'auto' }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: '600px',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
              overflow: 'hidden',
              margin: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color, #27272a)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editingVoucher === null && creationType !== null && (
                  <button
                    onClick={() => setCreationType(null)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-color, #27272a)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      marginRight: '8px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    &larr; Quay lại
                  </button>
                )}
                <Ticket size={20} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {editingVoucher ? t('vouchersSection.editTitle') : t('vouchersSection.createTitle')}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>
              {editingVoucher === null && creationType === null ? (
                /* Choice Step: Two Large Cards */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', padding: '16px 0' }}>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center', margin: 0 }}>
                    Vui lòng chọn loại voucher bạn muốn tạo:
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%' }}>
                    {/* Customer Voucher Option Card */}
                    <div
                      onClick={() => {
                        const customerRoleId = roles.find(r => r.roleName === 'Customer')?.roleId || '';
                        setForm({
                          ...form,
                          roleId: customerRoleId,
                          targetRanks: []
                        });
                        setCreationType('customer');
                      }}
                      onMouseEnter={() => setHoveredCard('customer')}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '24px 16px',
                        backgroundColor: hoveredCard === 'customer' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.03)',
                        border: hoveredCard === 'customer' ? '2px solid rgba(99, 102, 241, 0.6)' : '2px solid rgba(99, 102, 241, 0.2)',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                        boxShadow: hoveredCard === 'customer' ? '0 8px 24px rgba(99, 102, 241, 0.15)' : 'none'
                      }}
                    >
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Users size={28} style={{ color: '#818cf8' }} />
                      </div>
                      <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>Voucher Khách hàng</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        Dành riêng cho khách hàng. Có thể chọn một hoặc nhiều hạng khách hàng cụ thể (Standard, VIP, Gold, Diamond).
                      </span>
                    </div>

                    {/* Staff/Other Role Voucher Option Card */}
                    <div
                      onClick={() => {
                        const firstStaffRoleId = roles.find(r => r.roleName !== 'Customer' && r.roleName !== 'Admin')?.roleId || roles.find(r => r.roleName === 'Admin')?.roleId || '';
                        setForm({
                          ...form,
                          roleId: firstStaffRoleId,
                          targetRanks: []
                        });
                        setCreationType('staff');
                      }}
                      onMouseEnter={() => setHoveredCard('staff')}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '24px 16px',
                        backgroundColor: hoveredCard === 'staff' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.03)',
                        border: hoveredCard === 'staff' ? '2px solid rgba(245, 158, 11, 0.6)' : '2px solid rgba(245, 158, 11, 0.2)',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                        boxShadow: hoveredCard === 'staff' ? '0 8px 24px rgba(245, 158, 11, 0.15)' : 'none'
                      }}
                    >
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Briefcase size={28} style={{ color: '#f59e0b' }} />
                      </div>
                      <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>Voucher Nhân viên / Khác</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        Dành cho các vai trò nhân viên hoặc quản trị viên (Cashier, Managers, Admin...).
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Form Step */
                <form id="voucher-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Role configuration */}
                  {creationType === 'customer' ? (
                    /* Customer Voucher: Role is pre-set and static */
                    <div style={{
                      backgroundColor: 'rgba(99, 102, 241, 0.05)',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(99, 102, 241, 0.15)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Loại voucher
                      </span>
                      <span style={{ fontWeight: 800, fontSize: '14px', color: '#818cf8' }}>
                        Voucher Khách hàng (Customer)
                      </span>
                    </div>
                  ) : (
                    /* Staff/Other Voucher: Choose role from dropdown (excluding Customer) */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Target User Role constraint *</label>
                      <select
                        value={form.roleId}
                        onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                        className="input"
                        style={{ width: '100%', cursor: 'pointer' }}
                      >
                        {roles.filter(r => r.roleName !== 'Customer').map((r) => (
                          <option key={r.roleId} value={r.roleId}>
                            {getRoleDisplayName(r.roleName)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Customer Ranks Selection (if customer role is active) */}
                  {(creationType === 'customer' || roles.find(r => r.roleId === form.roleId)?.roleName === 'Customer') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        Hạng khách hàng áp dụng (Không chọn = Tất cả hạng)
                      </label>
                      <div style={{
                        display: 'flex',
                        gap: '16px',
                        flexWrap: 'wrap',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color, #27272a)'
                      }}>
                        {MEMBERSHIP_RANKS.map(rank => {
                          const isChecked = form.targetRanks.includes(rank.id);
                          return (
                            <label
                              key={rank.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                color: 'var(--text-primary)',
                                userSelect: 'none'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const nextRanks = e.target.checked
                                    ? [...form.targetRanks, rank.id]
                                    : form.targetRanks.filter(id => id !== rank.id);
                                  setForm({ ...form, targetRanks: nextRanks });
                                }}
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  accentColor: 'var(--accent)',
                                  cursor: 'pointer'
                                }}
                              />
                              <span style={{ fontWeight: 600 }}>{rank.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Name */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>{t('vouchersSection.nameLabel')}</label>
                    <input
                      type="text"
                      required
                      placeholder={t('vouchersSection.namePlaceholder')}
                      value={form.voucherName}
                      onChange={(e) => setForm({ ...form, voucherName: e.target.value })}
                      className="input"
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Description */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>{t('vouchersSection.descriptionLabel')}</label>
                    <textarea
                      required
                      rows={3}
                      placeholder={t('vouchersSection.descriptionPlaceholder')}
                      value={form.voucherDescription}
                      onChange={(e) => setForm({ ...form, voucherDescription: e.target.value })}
                      className="input"
                      style={{ width: '100%', resize: 'vertical', minHeight: '60px' }}
                    />
                  </div>

                  {/* Group discount, cost, quantity */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>{t('vouchersSection.discountPercentLabel')}</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        required
                        value={form.voucherDiscountPercent}
                        onChange={(e) => setForm({ ...form, voucherDiscountPercent: parseInt(e.target.value) || 0 })}
                        className="input"
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Points Cost *</label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={form.voucherPointsCost}
                        onChange={(e) => setForm({ ...form, voucherPointsCost: parseInt(e.target.value) || 0 })}
                        className="input"
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Quantity *</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={form.voucherQuantity}
                        onChange={(e) => setForm({ ...form, voucherQuantity: parseInt(e.target.value) || 0 })}
                        className="input"
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Valid From</label>
                      <input
                        type="date"
                        value={form.validFrom}
                        onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                        className="input"
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Valid To</label>
                      <input
                        type="date"
                        value={form.validTo}
                        onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>

                </form>
              )}
            </div>

            {/* Sticky Footer - Action Buttons outside scroll */}
            <div style={{ padding: '12px 24px 20px', borderTop: '1px solid var(--border-color, #27272a)', display: 'flex', gap: 12, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              {(editingVoucher !== null || creationType !== null) && (
                <button
                  form="voucher-form"
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Save Voucher
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
