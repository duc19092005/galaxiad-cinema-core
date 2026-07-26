// src/types/wasteReport.types.ts

export type WasteReportStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ReqCreateWasteReport {
  cinemaId: string;
  productId: string;
  quantity: number;
  reason: string;
  proofImageUrl?: string;
}

export interface ReqReviewWasteReport {
  approve: boolean;
  reviewNote?: string;
}

export interface WasteReportDto {
  wasteReportId: string;
  cinemaId: string;
  cinemaName: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  reason: string;
  proofImageUrl?: string | null;
  status: WasteReportStatus;
  reportedByUserId: string;
  reportedByUserName: string;
  reviewedByUserId?: string | null;
  reviewedByUserName?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}
