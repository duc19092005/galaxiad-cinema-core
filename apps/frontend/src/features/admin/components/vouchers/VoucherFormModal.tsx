// src/features/admin/components/vouchers/VoucherFormModal.tsx
import React from 'react';
import { Ticket, X, Users, Briefcase, Loader2, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { VoucherDto } from '../../../../api/voucherApi';
import type { RoleDto } from '../../../../types/admin.types';
import { MEMBERSHIP_RANKS, getRoleDisplayName, type VoucherFormData } from './voucherHelpers';

interface VoucherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingVoucher: VoucherDto | null;
  creationType: 'customer' | 'staff' | null;
  setCreationType: (type: 'customer' | 'staff' | null) => void;
  form: VoucherFormData;
  setForm: React.Dispatch<React.SetStateAction<VoucherFormData>>;
  roles: RoleDto[];
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  hoveredCard: 'customer' | 'staff' | null;
  setHoveredCard: (card: 'customer' | 'staff' | null) => void;
}

export const VoucherFormModal: React.FC<VoucherFormModalProps> = ({
  isOpen,
  onClose,
  editingVoucher,
  creationType,
  setCreationType,
  form,
  setForm,
  roles,
  submitting,
  onSubmit,
  hoveredCard,
  setHoveredCard,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 1000, overflowY: 'auto' }}
      onClick={onClose}
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color, #27272a)',
            flexShrink: 0,
          }}
        >
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
                  gap: '4px',
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
            onClick={onClose}
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
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                alignItems: 'center',
                padding: '16px 0',
              }}
            >
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  textAlign: 'center',
                  margin: 0,
                }}
              >
                Vui lòng chọn loại voucher bạn muốn tạo:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%' }}>
                {/* Customer Voucher Option Card */}
                <div
                  onClick={() => {
                    const customerRoleId =
                      roles.find((r) => r.roleName === 'Customer')?.roleId || '';
                    setForm({
                      ...form,
                      roleId: customerRoleId,
                      targetRanks: [],
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
                    backgroundColor:
                      hoveredCard === 'customer'
                        ? 'rgba(99, 102, 241, 0.08)'
                        : 'rgba(99, 102, 241, 0.03)',
                    border:
                      hoveredCard === 'customer'
                        ? '2px solid rgba(99, 102, 241, 0.6)'
                        : '2px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                    boxShadow:
                      hoveredCard === 'customer' ? '0 8px 24px rgba(99, 102, 241, 0.15)' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Users size={28} style={{ color: '#818cf8' }} />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>
                    Voucher Khách hàng
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Dành riêng cho khách hàng. Có thể chọn một hoặc nhiều hạng khách hàng cụ thể (Standard, VIP, Gold, Diamond).
                  </span>
                </div>

                {/* Staff/Other Role Voucher Option Card */}
                <div
                  onClick={() => {
                    const firstStaffRoleId =
                      roles.find((r) => r.roleName !== 'Customer' && r.roleName !== 'Admin')?.roleId ||
                      roles.find((r) => r.roleName === 'Admin')?.roleId ||
                      '';
                    setForm({
                      ...form,
                      roleId: firstStaffRoleId,
                      targetRanks: [],
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
                    backgroundColor:
                      hoveredCard === 'staff'
                        ? 'rgba(245, 158, 11, 0.08)'
                        : 'rgba(245, 158, 11, 0.03)',
                    border:
                      hoveredCard === 'staff'
                        ? '2px solid rgba(245, 158, 11, 0.6)'
                        : '2px solid rgba(245, 158, 11, 0.2)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                    boxShadow:
                      hoveredCard === 'staff' ? '0 8px 24px rgba(245, 158, 11, 0.15)' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Briefcase size={28} style={{ color: '#f59e0b' }} />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>
                    Voucher Nhân viên / Khác
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Dành cho các vai trò nhân viên hoặc quản trị viên (Cashier, Managers, Admin...).
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Form Step */
            <form
              id="voucher-form"
              onSubmit={onSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              {/* Role configuration */}
              {creationType === 'customer' ? (
                /* Customer Voucher: Role is pre-set and static */
                <div
                  style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.05)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(99, 102, 241, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Loại voucher
                  </span>
                  <span style={{ fontWeight: 800, fontSize: '14px', color: '#818cf8' }}>
                    Voucher Khách hàng (Customer)
                  </span>
                </div>
              ) : (
                /* Staff/Other Voucher: Choose role from dropdown (excluding Customer) */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Target User Role constraint *
                  </label>
                  <select
                    value={form.roleId}
                    onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                    className="input"
                    style={{ width: '100%', cursor: 'pointer' }}
                  >
                    {roles
                      .filter((r) => r.roleName !== 'Customer')
                      .map((r) => (
                        <option key={r.roleId} value={r.roleId}>
                          {getRoleDisplayName(r.roleName)}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Customer Ranks Selection (if customer role is active) */}
              {(creationType === 'customer' ||
                roles.find((r) => r.roleId === form.roleId)?.roleName === 'Customer') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Hạng khách hàng áp dụng (Không chọn = Tất cả hạng)
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      gap: '16px',
                      flexWrap: 'wrap',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #27272a)',
                    }}
                  >
                    {MEMBERSHIP_RANKS.map((rank) => {
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
                            userSelect: 'none',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const nextRanks = e.target.checked
                                ? [...form.targetRanks, rank.id]
                                : form.targetRanks.filter((id) => id !== rank.id);
                              setForm({ ...form, targetRanks: nextRanks });
                            }}
                            style={{
                              width: '16px',
                              height: '16px',
                              accentColor: 'var(--accent)',
                              cursor: 'pointer',
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
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {t('vouchersSection.nameLabel')}
                </label>
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
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {t('vouchersSection.descriptionLabel')}
                </label>
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
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {t('vouchersSection.discountPercentLabel')}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={form.voucherDiscountPercent}
                    onChange={(e) =>
                      setForm({ ...form, voucherDiscountPercent: parseInt(e.target.value) || 0 })
                    }
                    className="input"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Points Cost *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.voucherPointsCost}
                    onChange={(e) =>
                      setForm({ ...form, voucherPointsCost: parseInt(e.target.value) || 0 })
                    }
                    className="input"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.voucherQuantity}
                    onChange={(e) =>
                      setForm({ ...form, voucherQuantity: parseInt(e.target.value) || 0 })
                    }
                    className="input"
                  />
                </div>
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={form.validFrom}
                    onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                    className="input"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Valid To
                  </label>
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
        <div
          style={{
            padding: '12px 24px 20px',
            borderTop: '1px solid var(--border-color, #27272a)',
            display: 'flex',
            gap: 12,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
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
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
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
  );
};
