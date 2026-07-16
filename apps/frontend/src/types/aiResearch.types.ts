export type AiResearchCity = 'HCM' | 'HN';
export type AiResearchAnalysisType = 'PricingAnalysis' | 'SiteLocationFeasibility';
export type AiResearchRunMode = 'RunAll' | 'SelectedModules';

export interface CreateAiResearchJobRequest {
  city: AiResearchCity;
  analysisType: AiResearchAnalysisType;
  runMode: AiResearchRunMode;
  selectedModules: string[];
  budgetCap: number;
  notes: string;
}

export interface AiResearchJobSummary {
  jobId: string;
  city: AiResearchCity;
  analysisType: AiResearchAnalysisType;
  runMode: AiResearchRunMode;
  selectedModules: string[];
  status: string;
  budgetUsed: number;
  budgetCap: number;
  createdAt: string;
  completedAt?: string | null;
  errorMessage?: string | null;
}

export interface AiResearchEvidence {
  evidenceId: string;
  url: string;
  title: string;
  snippet: string;
  publishedDate?: string | null;
  sourceDomain: string;
  sourceType: string;
  domainTrustTier: string;
  relation: string;
}

export interface AiResearchClaim {
  claimId: string;
  text: string;
  category: string;
  isCritical: boolean;
  status: string;
  iterationCount: number;
  confidence: number;
  classification: string;
  evidence: AiResearchEvidence[];
}

export interface AiResearchReport {
  generatedAt: string;
  sections: Array<{
    module: string;
    claims: Array<{
      claimId: string;
      text: string;
      status: string;
      classification: string;
      confidence: number;
      citations: Array<{ title: string; url: string; sourceType: string }>;
    }>;
  }>;
  summary: {
    totalClaims?: number;
    resolvedClaims?: number;
    insufficientClaims?: number;
    conflictingClaims?: number;
  };
}

export interface AiResearchJobDetail extends AiResearchJobSummary {
  notes: string;
  claims: AiResearchClaim[];
  report?: AiResearchReport | null;
}

export interface AiResearchProgress {
  jobId: string;
  status: string;
  currentModule?: string;
  currentClaimId?: string;
  resolvedClaims?: number;
  totalClaims?: number;
  criticalResolved?: number;
  criticalTotal?: number;
  budgetUsed: number;
  budgetCap: number;
  message?: string;
}

export interface AiResearchSseEvent {
  id?: string;
  event: string;
  data: AiResearchProgress;
}
