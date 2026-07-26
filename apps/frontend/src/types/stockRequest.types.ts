// src/types/stockRequest.types.ts

export type StockRequestStatus = 'Pending' | 'Approved' | 'Shipped' | 'Received' | 'Rejected' | 'Cancelled';

export interface ReqCreateStockRequestItem {
  productId: string;
  quantity: number;
}

export interface ReqCreateStockRequest {
  cinemaId: string;
  items: ReqCreateStockRequestItem[];
  note?: string;
}

export interface ReqApproveStockRequestItem {
  productId: string;
  approvedQuantity: number;
}

export interface ReqApproveStockRequest {
  items: ReqApproveStockRequestItem[];
  note?: string;
}

export interface ReqRejectStockRequest {
  reason: string;
}

export interface ReqReceiveStockRequestItem {
  productId: string;
  receivedQuantity: number;
}

export interface ReqReceiveStockRequest {
  items: ReqReceiveStockRequestItem[];
  note?: string;
}

export interface StockRequestItemDto {
  stockRequestItemId: string;
  productId: string;
  productName: string;
  sku: string;
  requestedQuantity: number;
  approvedQuantity: number;
  receivedQuantity: number;
}

export interface StockRequestDto {
  stockRequestId: string;
  requestCode: string;
  cinemaId: string;
  cinemaName: string;
  status: StockRequestStatus;
  requestedByUserId: string;
  requestedByUserName: string;
  approvedByUserId?: string | null;
  approvedByUserName?: string | null;
  shippedByUserId?: string | null;
  shippedByUserName?: string | null;
  receivedByUserId?: string | null;
  receivedByUserName?: string | null;
  note?: string | null;
  rejectReason?: string | null;
  createdAt: string;
  approvedAt?: string | null;
  shippedAt?: string | null;
  receivedAt?: string | null;
  items: StockRequestItemDto[];
}
