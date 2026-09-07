export type ContractStatus = 'Draft' | 'PendingReview' | 'ReadyToSign' | 'Signed' | 'Activated' | 'Suspended' | 'Terminated' | 'Cancelled';
export type ScopeState = 'Unresolved' | 'Specified' | 'NoAdditionalRestrictionConfirmed';

export interface ContractSummary {
  contractId: string;
  internalCode: string;
  counterpartyContractNumber?: string;
  distributorName?: string;
  assignedMovieManagerName?: string;
  status: ContractStatus;
  processingStatus: string;
  currentRevisionNumber: number;
  updatedAt: string;
}

export interface ContractDocument {
  contractDocumentId: string;
  fileName: string;
  kind: string;
  contentType: string;
  fileSize: number;
  sha256: string;
}

export interface ContractMovieLine {
  contractMovieLineId?: string;
  movieId?: string;
  vietnameseTitle: string;
  englishTitle?: string;
  description?: string;
  posterUrl?: string;
  trailerUrl?: string;
  director?: string;
  actors?: string;
  durationMinutes: number;
  movieRequiredAgeId: string;
  licenseStartAt: string;
  licenseEndAt: string;
  cinemaScopeState: ScopeState;
  formatScopeState: ScopeState;
  cinemaIds: string[];
  formatIds: string[];
  cinemaSharePercent: number;
  distributorSharePercent: number;
  revenueBasis: string;
  settlementCycle: 'Weekly' | 'Monthly';
  reviewed: boolean;
}

export interface ContractDetail extends ContractSummary {
  distributorId?: string;
  assignedMovieManagerId: string;
  templateId?: string;
  templateName?: string;
  allowedActions: string[];
  revision?: {
    contractRevisionId: string;
    revisionNumber: number;
    extractedText: string;
    extractionJson: string;
    reviewHistoryJson?: string;
    dataReviewed: boolean;
    financialPolicyReviewed: boolean;
    documents: ContractDocument[];
    movieLines: ContractMovieLine[];
  };
}

export interface ContractTemplate {
  contractTemplateId: string;
  code: string;
  name: string;
  version: number;
  status: 'Draft' | 'Published' | 'Retired';
  schemaJson: string;
  bodyTemplate: string;
}
