// src/features/admin/components/vouchers/voucherHelpers.ts

export interface MembershipRank {
  id: number;
  name: string;
}

export const MEMBERSHIP_RANKS: MembershipRank[] = [
  { id: 0, name: 'Standard' },
  { id: 1, name: 'VIP' },
  { id: 2, name: 'Gold' },
  { id: 3, name: 'Diamond' },
];

export const getRankLabel = (rank: number): string => {
  switch (rank) {
    case 0: return 'Standard';
    case 1: return 'VIP';
    case 2: return 'Gold';
    case 3: return 'Diamond';
    default: return 'Unknown';
  }
};

export const getRoleBadgeClass = (name: string): string => {
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

export const getRoleDisplayName = (name: string): string => {
  if (!name) return 'All';
  if (name === 'Customer') return 'Customer (Regular User)';
  if (name === 'User') return 'User (Regular User)';
  return name;
};

export interface VoucherFormData {
  voucherName: string;
  voucherDescription: string;
  voucherAmount: number;
  voucherDiscountPercent: number;
  roleId: string;
  validFrom: string;
  validTo: string;
  voucherPointsCost: number;
  voucherQuantity: number;
  targetRanks: number[];
}
