// src/features/admin/components/vouchers/VoucherTable.tsx
import React from 'react';
import { ShoppingBag, Edit2, Trash2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { VoucherDto } from '../../../../api/voucherApi';
import type { RoleDto } from '../../../../types/admin.types';
import { getRankLabel, getRoleBadgeClass, getRoleDisplayName } from './voucherHelpers';

interface VoucherTableProps {
  vouchers: VoucherDto[];
  roles: RoleDto[];
  loading: boolean;
  filterRole: string;
  onFilterRoleChange: (val: string) => void;
  filterRank: string;
  onFilterRankChange: (val: string) => void;
  sortBy: string;
  onSortByChange: (val: string) => void;
  onEdit: (voucher: VoucherDto) => void;
  onDelete: (voucherId: string) => void;
}

export const VoucherTable: React.FC<VoucherTableProps> = ({
  vouchers,
  roles,
  loading,
  filterRole,
  onFilterRoleChange,
  filterRank,
  onFilterRankChange,
  sortBy,
  onSortByChange,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Filter & Sort Bar */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center',
          padding: '12px 16px',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '8px',
          border: '1px solid var(--border-color, #27272a)',
        }}
      >
        {/* Filter by Role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Lọc vai trò:
          </span>
          <select
            value={filterRole}
            onChange={(e) => onFilterRoleChange(e.target.value)}
            className="input"
            style={{ height: '32px', padding: '0 8px', fontSize: '12px', minWidth: '120px', cursor: 'pointer' }}
          >
            <option value="">Tất cả</option>
            {roles.map((r) => (
              <option key={r.roleId} value={r.roleId}>
                {getRoleDisplayName(r.roleName)}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Rank */}
        {filterRole && roles.find((r) => r.roleId === filterRole)?.roleName === 'Customer' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Lọc hạng khách:
            </span>
            <select
              value={filterRank}
              onChange={(e) => onFilterRankChange(e.target.value)}
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
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Sắp xếp theo:
          </span>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
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
            <Loader2
              size={32}
              className="animate-spin"
              style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }}
            />
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              {t('vouchersSection.loading')}
            </p>
          </div>
        ) : vouchers.length === 0 ? (
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
              {vouchers.map((v) => (
                <tr key={v.voucherId}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{v.voucherName}</span>
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                          maxWidth: '240px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {v.voucherDescription}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, color: 'var(--primary, #ff8a00)' }}>
                      {v.voucherDiscountPercent}%
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)' }}>
                      <ShoppingBag size={12} style={{ color: 'var(--accent)' }} />
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
                        {v.voucherPointsCost} {t('vouchersSection.pts')}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700 }}>
                      {v.remainingQuantity} / {v.voucherQuantity}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className={`badge ${getRoleBadgeClass(v.roleName)}`}>
                        {getRoleDisplayName(v.roleName)}
                      </span>
                      {v.roleName === 'Customer' && (
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {v.targetRanks && v.targetRanks.length > 0
                            ? `Hạng: ${v.targetRanks.map((r) => getRankLabel(r)).join(', ')}`
                            : 'Tất cả hạng'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span>
                        {t('vouchersSection.validFrom')}:{' '}
                        {v.validFrom ? new Date(v.validFrom).toLocaleDateString('vi-VN') : t('vouchersSection.immediate')}
                      </span>
                      <span>
                        {t('vouchersSection.validTo')}:{' '}
                        {v.validTo ? new Date(v.validTo).toLocaleDateString('vi-VN') : t('vouchersSection.unlimited')}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => onEdit(v)}
                        className="btn"
                        style={{
                          padding: '4px 10px',
                          fontSize: 12,
                          height: 28,
                          minHeight: 0,
                          borderColor: 'rgba(99, 102, 241, 0.4)',
                          color: '#818cf8',
                          background: 'rgba(99, 102, 241, 0.05)',
                        }}
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => onDelete(v.voucherId)}
                        className="btn"
                        style={{
                          padding: '4px 10px',
                          fontSize: 12,
                          height: 28,
                          minHeight: 0,
                          borderColor: 'rgba(239, 68, 68, 0.4)',
                          color: 'var(--danger)',
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
    </>
  );
};
