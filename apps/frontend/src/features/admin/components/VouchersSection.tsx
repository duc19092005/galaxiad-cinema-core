// src/features/admin/components/VouchersSection.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { voucherApi, type VoucherDto, type CreateVoucherDto, type UpdateVoucherDto } from '../../../api/voucherApi';
import { adminApi } from '../../../api/adminApi';
import type { RoleDto } from '../../../types/admin.types';
import { showSuccess, showError } from '../../../utils/ToastUtils';
import { useTranslation } from 'react-i18next';
import { VoucherTable } from './vouchers/VoucherTable';
import { VoucherFormModal } from './vouchers/VoucherFormModal';
import type { VoucherFormData } from './vouchers/voucherHelpers';

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
  const [form, setForm] = useState<VoucherFormData>({
    voucherName: '',
    voucherDescription: '',
    voucherAmount: 0,
    voucherDiscountPercent: 10,
    roleId: '',
    validFrom: '',
    validTo: '',
    voucherPointsCost: 100,
    voucherQuantity: 50,
    targetRanks: [],
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
    const initialRoleId =
      roles.find((r) => r.roleName === 'Customer' || r.roleName === 'User')?.roleId ||
      roles[0]?.roleId ||
      '';
    setForm({
      voucherName: '',
      voucherDescription: '',
      voucherAmount: 0,
      voucherDiscountPercent: 10,
      roleId: initialRoleId,
      validFrom: new Date().toISOString().split('T')[0],
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
      const selectedRole = roles.find((r) => r.roleId === form.roleId);
      const isCustomer = selectedRole?.roleName === 'Customer';

      const payload = {
        ...form,
        targetRanks: isCustomer ? form.targetRanks : [],
        validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null,
        validTo: form.validTo ? new Date(form.validTo).toISOString() : null,
      };

      if (editingVoucher) {
        const res = await voucherApi.updateVoucher(
          editingVoucher.voucherId,
          payload as UpdateVoucherDto
        );
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

  const processedVouchers = useMemo(() => {
    let result = [...vouchers];

    // Filter by Role
    if (filterRole) {
      result = result.filter((v) => v.roleId === filterRole);
    }

    // Filter by Rank
    if (filterRank !== '') {
      const rankNum = parseInt(filterRank);
      result = result.filter(
        (v) =>
          v.roleName === 'Customer' &&
          v.targetRanks &&
          (v.targetRanks.length === 0 || v.targetRanks.includes(rankNum))
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
          if (!v.targetRanks || v.targetRanks.length === 0) return 99;
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {t('vouchersSection.title')}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            {t('vouchersSection.description')}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleOpenCreate}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> {t('vouchersSection.newVoucher')}
        </button>
      </div>

      {/* Filter, Sort & Table */}
      <VoucherTable
        vouchers={processedVouchers}
        roles={roles}
        loading={loading}
        filterRole={filterRole}
        onFilterRoleChange={(val) => {
          setFilterRole(val);
          setFilterRank('');
        }}
        filterRank={filterRank}
        onFilterRankChange={setFilterRank}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
      />

      {/* Create / Edit Modal */}
      <VoucherFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingVoucher={editingVoucher}
        creationType={creationType}
        setCreationType={setCreationType}
        form={form}
        setForm={setForm}
        roles={roles}
        submitting={submitting}
        onSubmit={handleSubmit}
        hoveredCard={hoveredCard}
        setHoveredCard={setHoveredCard}
      />
    </div>
  );
};
