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

export interface AiResearchIeeeReference {
  id: number;
  title: string;
  url: string;
  domain?: string;
  sourceType?: string;
  trust?: string;
  ieeeText?: string;
}

export interface AiResearchReportAuthor {
  name: string;
  affiliation?: string;
  email?: string;
}

export interface AiResearchDecisionBasis {
  claimCode: string;
  claim: string;
  status: string;
  classification: string;
  confidence: number;
  supports: number;
  contradicts: number;
  evidenceCount: number;
  sourceDomains: string[];
  citationIds: number[];
}

export interface AiResearchProvenance {
  city: string;
  analysisType: string;
  managerNotes?: string;
  pipeline: string[];
  claimCount: number;
  referenceCount: number;
  sourceTrustTiers: Record<string, number>;
  sourceDomains: string[];
}

export interface AiResearchReport {
  generatedAt: string;
  title?: string;
  reportStyle?: string;
  sections: Array<{
    module: string;
    claims: Array<{
      claimId: string;
      text: string;
      status: string;
      classification: string;
      confidence: number;
      citations: Array<{ title: string; url: string; sourceType: string; domain?: string }>;
    }>;
  }>;
  summary: {
    totalClaims?: number;
    resolvedClaims?: number;
    insufficientClaims?: number;
    conflictingClaims?: number;
    avgConfidence?: number;
    referenceCount?: number;
    reportStyle?: string;
    title?: string;
    authors?: AiResearchReportAuthor[];
    abstract?: string;
    keywords?: string[];
    introduction?: string;
    relatedWork?: string;
    methodology?: string;
    resultsAndDiscussion?: string;
    conclusion?: string;
    appendix?: string;
    executiveMatrixMarkdown?: string;
    claimMatrix?: Array<{ claimCode?: string; text?: string; status?: string; classification?: string; confidence?: number; citations?: string }>;
    provenance?: AiResearchProvenance;
    decisionBasis?: AiResearchDecisionBasis[];
    references?: AiResearchIeeeReference[];
    headline?: string;
    executiveSummary?: string;
    keyFindings?: string[];
    recommendations?: string[];
    risksAndUnknowns?: string[];
    confidenceOverall?: 'high' | 'medium' | 'low' | string;
    confidenceNote?: string;
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
  phase?: 'planning' | 'researching' | 'arbitrating' | 'synthesizing' | string;
  agent?: string;
  activity?: string;
  currentModule?: string;
  currentClaimId?: string;
  iteration?: number;
  query?: string;
  evidenceCount?: number;
  sourceDomains?: string[];
  verdict?: { status?: string; classification?: string; confidence?: number; supports?: number; contradicts?: number; irrelevant?: number };
  resolvedClaims?: number;
  totalClaims?: number;
  criticalResolved?: number;
  criticalTotal?: number;
  budgetUsed: number;
  budgetCap: number;
  message?: string;
}

export interface AiResearchTimelineItem {
  id: string;
  event: string;
  message: string;
  activity?: string;
  agent?: string;
  at: number;
}

export interface AiResearchSseEvent {
  id?: string;
  event: string;
  data: AiResearchProgress;
}