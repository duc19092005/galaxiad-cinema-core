// src/features/admin/components/VouchersSection.tsx
import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Edit2, Trash2, Loader2, ShoppingBag, X, Check } from 'lucide-react';
import { voucherApi, type VoucherDto, type CreateVoucherDto, type UpdateVoucherDto } from '../../../api/voucherApi';
import { adminApi } from '../../../api/adminApi';
import type { RoleDto } from '../../../types/admin.types';
import { showSuccess, showError } from '../../../utils/ToastUtils';
import { useTranslation } from 'react-i18next';

export const VouchersSection: React.FC = () => {
  const { t } = useTranslation();
  const [vouchers, setVouchers] = useState<VoucherDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);

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
      const payload = {
        ...form,
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

      {/* Table grid */}
      <div className="table-container">
        {loading ? (
          <div className="state-center" style={{ minHeight: '30vh' }}>
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              {t('vouchersSection.loading')}
            </p>
          </div>
        ) : vouchers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            {t('vouchersSection.noVouchers')} {t('vouchersSection.startCreating')}
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
              {vouchers.map((v) => (
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
                    <span className={`badge ${getRoleBadgeClass(v.roleName)}`}>
                      {getRoleDisplayName(v.roleName)}
                    </span>
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
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            overflowY: 'auto',
            padding: '40px 16px',
            height: '70vh',
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '600px',
              backgroundColor: 'var(--bg-elevated, #18181b)',
              border: '1px solid var(--border-color, #27272a)',
              borderRadius: 'var(--radius-xl, 20px)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              boxSizing: 'border-box',
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

            {/* Scrollable Form Body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>
            {/* Form */}
            <form id="voucher-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

              {/* Role limitation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Target User Role constraint *</label>
                <select
                  value={form.roleId}
                  onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                  className="input"
                  style={{ width: '100%', cursor: 'pointer' }}
                >
                  {roles.map((r) => (
                    <option key={r.roleId} value={r.roleId}>
                      {getRoleDisplayName(r.roleName)}
                    </option>
                  ))}
                </select>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
