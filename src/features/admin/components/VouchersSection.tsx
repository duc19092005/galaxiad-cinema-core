// src/features/admin/components/VouchersSection.tsx
import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Edit2, Trash2, Loader2, ShoppingBag, X, Check } from 'lucide-react';
import { voucherApi, type VoucherDto, type CreateVoucherDto, type UpdateVoucherDto } from '../../../api/voucherApi';
import { adminApi } from '../../../api/adminApi';
import type { RoleDto } from '../../../types/admin.types';
import { showSuccess, showError } from '../../../utils/ToastUtils';

export const VouchersSection: React.FC = () => {
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

  return (
    <div className="animate-in">
      {/* Header Panel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Voucher Store Management</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Create, update, and manage public vouchers for the rewards system</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> New Voucher
        </button>
      </div>

      {/* Table grid */}
      <div className="table-container">
        {loading ? (
          <div className="state-center" style={{ minHeight: '30vh' }}>
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              Loading vouchers...
            </p>
          </div>
        ) : vouchers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            No vouchers created yet. Click "New Voucher" to start.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Voucher Name</th>
                <th>Discount</th>
                <th>Point Cost</th>
                <th>Stock Left</th>
                <th>Target Role</th>
                <th>Validity Period</th>
                <th style={{ width: 140 }}>Actions</th>
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
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>{v.voucherPointsCost} pts</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700 }}>{v.remainingQuantity} / {v.voucherQuantity}</span>
                  </td>
                  <td>
                    <span className={`badge ${getRoleBadgeClass(v.roleName)}`}>
                      {v.roleName || 'All'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span>From: {v.validFrom ? new Date(v.validFrom).toLocaleDateString('vi-VN') : 'Immediate'}</span>
                      <span>To: {v.validTo ? new Date(v.validTo).toLocaleDateString('vi-VN') : 'Unlimited'}</span>
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
                  {editingVoucher ? 'Edit Voucher config' : 'Create new Voucher'}
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
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Voucher Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special Student discount voucher"
                  value={form.voucherName}
                  onChange={(e) => setForm({ ...form, voucherName: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide voucher usage terms, rules, and value info..."
                  value={form.voucherDescription}
                  onChange={(e) => setForm({ ...form, voucherDescription: e.target.value })}
                  className="input"
                  style={{ width: '100%', resize: 'vertical', minHeight: '60px' }}
                />
              </div>

              {/* Group discount, cost, quantity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Discount (%) *</label>
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
                      {r.roleName}
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
