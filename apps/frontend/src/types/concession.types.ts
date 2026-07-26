// src/types/concession.types.ts
// Types for F&B (Concessions) products, combos, POS sales and inventory.

export type ConcessionCategory = 'Popcorn' | 'Drink' | 'Snack' | 'Merchandise' | 'Combo';
export type ConcessionUnit = 'Piece' | 'Cup' | 'Box' | 'Combo';
export type InventoryTransactionType =
  | 'Restock' | 'Sale' | 'Reserve' | 'ReleaseReservation' | 'Waste' | 'Adjustment' | 'StockCount' | 'Return';

export interface ComboItemDto {
  componentProductId: string;
  componentProductName: string;
  quantity: number;
}

export interface ConcessionProductDto {
  productId: string;
  cinemaId: string;
  productName: string;
  sku: string;
  category: ConcessionCategory;
  unitPrice: number;
  costPrice: number;
  unit: ConcessionUnit;
  imageUrl?: string | null;
  description?: string | null;
  isActive: boolean;
  isAvailableOnline: boolean;
  isHot: boolean;
  isCombo: boolean;
  lowStockThreshold: number;
  quantityOnHand: number;
  quantityReserved: number;
  availableToSell: number;
  isLowStock: boolean;
  comboItems: ComboItemDto[];
}

export interface CreateConcessionProductRequest {
  cinemaId: string;
  productName: string;
  sku: string;
  category: number; // enum ordinal: Popcorn=0 Drink=1 Snack=2 Merchandise=3
  unitPrice: number;
  costPrice: number;
  unit?: number; // Piece=0 Cup=1 Box=2
  imageUrl?: string;
  description?: string;
  isAvailableOnline?: boolean;
  lowStockThreshold?: number;
  initialQuantity?: number;
}

export interface UpdateConcessionProductRequest {
  productName: string;
  unitPrice: number;
  costPrice: number;
  unit?: number;
  imageUrl?: string;
  description?: string;
  isAvailableOnline?: boolean;
  lowStockThreshold?: number;
}

export interface ComboItemRequest {
  componentProductId: string;
  quantity: number;
}

export interface CreateComboRequest {
  cinemaId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  imageUrl?: string;
  description?: string;
  isAvailableOnline?: boolean;
  items: ComboItemRequest[];
}

export interface ConcessionMenuItemDto {
  productId: string;
  productName: string;
  category: ConcessionCategory;
  unitPrice: number;
  unit: ConcessionUnit;
  imageUrl?: string | null;
  description?: string | null;
  isCombo: boolean;
  isHot: boolean;
  availableToSell: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

export interface ConcessionItemRequest {
  productId: string;
  quantity: number;
}

export interface SellConcessionPosRequest {
  cinemaId: string;
  items: ConcessionItemRequest[];
  staffId?: string;
}

export interface CheckConcessionStockRequest {
  cinemaId: string;
  items: ConcessionItemRequest[];
}

export interface ConcessionSaleResultDto {
  orderId: string;
  totalAmount: number;
  soldAt: string;
}

export interface ConcessionSubstituteDto {
  productId: string;
  productName: string;
  unitPrice: number;
  availableToSell: number;
  imageUrl?: string | null;
}

export interface ConcessionStockConflictDto {
  productId: string;
  productName: string;
  requestedQuantity: number;
  availableQuantity: number;
  suggestions: ConcessionSubstituteDto[];
}

export interface ConcessionStockCheckResultDto {
  allAvailable: boolean;
  conflicts: ConcessionStockConflictDto[];
}

// -------- Inventory --------

export interface RestockInventoryRequest {
  productId: string;
  quantity: number;
  note?: string;
}

export interface AdjustInventoryRequest {
  productId: string;
  quantityChange: number;
  transactionType: number; // InventoryTransactionType ordinal
  note?: string;
}

export interface StockCountRequest {
  productId: string;
  countedQuantity: number;
  note?: string;
}

export interface InventoryStatusDto {
  productId: string;
  productName: string;
  sku: string;
  category: ConcessionCategory;
  quantityOnHand: number;
  quantityReserved: number;
  availableToSell: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  lastRestockedAt?: string | null;
  lastCountedAt?: string | null;
}

export interface InventoryTransactionDto {
  transactionId: string;
  productId: string;
  productName: string;
  transactionType: InventoryTransactionType;
  quantityChange: number;
  quantityOnHandAfter: number;
  quantityReservedAfter: number;
  orderId?: string | null;
  performedByUserId?: string | null;
  performedByUserName?: string | null;
  note?: string | null;
  occurredAt: string;
}

export interface InventoryHistoryFilter {
  productId?: string;
  transactionType?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}
