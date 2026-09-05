import { Fragment } from 'react';
import type {
  AiResearchAnalysisType,
  AiResearchCity,
  AiResearchIeeeReference,
  AiResearchProgress,
} from '../../../../types/aiResearch.types';

export const templates = {
  PricingAnalysis: [
    { key: 'pricing', label: 'Giá vé', critical: true },
    { key: 'promotion', label: 'Khuyến mãi', critical: true },
    { key: 'competition', label: 'Đối thủ', critical: false },
    { key: 'trend_demand', label: 'Xu hướng nhu cầu', critical: false },
    { key: 'background', label: 'Bối cảnh thị trường', critical: false },
  ],
  SiteLocationFeasibility: [
    { key: 'zoning_policy', label: 'Quy hoạch và pháp lý', critical: true },
    { key: 'real_estate_price', label: 'Giá bất động sản', critical: true },
    { key: 'lease_cost', label: 'Chi phí thuê 1500-3000m²', critical: true },
    { key: 'infrastructure_trend', label: 'Hạ tầng và dân cư', critical: false },
    { key: 'investment_incentive', label: 'Ưu đãi đầu tư', critical: false },
  ],
} satisfies Record<AiResearchAnalysisType, Array<{ key: string; label: string; critical: boolean }>>;

export const terminalStatuses = new Set(['done', 'failed', 'cancelled']);

export const statusLabel = (status: string) =>
  ({
    connected: 'SSE',
    queued: 'Đang chờ',
    planning: 'Lập kế hoạch',
    claim_created: 'Tạo claim',
    thought: 'Suy luận',
    researching: 'Research',
    evidence_found: 'Evidence',
    arbitrating: 'Đối chiếu',
    claim_resolved: 'Claim xong',
    claim_insufficient: 'Thiếu nguồn',
    synthesizing: 'Tổng hợp',
    done: 'Hoàn thành',
    failed: 'Thất bại',
    cancelled: 'Đã hủy',
  }[status] || status);

export const cityLabel = (city: AiResearchCity) => (city === 'HCM' ? 'TPHCM' : 'Hà Nội');

/** Normalize reference array from API: ensure numeric id + stable sort. UI owns display numbering. */
export const normalizeReferences = (refs: AiResearchIeeeReference[] | undefined): AiResearchIeeeReference[] => {
  if (!refs?.length) return [];
  return [...refs]
    .map((ref, index) => {
      const parsedId = Number(ref.id);
      const id = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : index + 1;
      return {
        ...ref,
        id,
        title: ref.title || 'Untitled source',
        url: ref.url || '',
      };
    })
    .sort((a, b) => a.id - b.id);
};

export const formatIeeeReferenceBody = (ref: {
  title: string;
  url: string;
  domain?: string;
  ieeeText?: string;
}) => {
  if (ref.ieeeText) {
    return ref.ieeeText.replace(/^\s*\[\d+\]\s*/, '').trim();
  }
  const domain = ref.domain || 'web';
  return `“${ref.title}”, ${domain}, [Online]. Available: ${ref.url}`;
};

export const renderCitationText = (text: string, onCitationClick: (id: number) => void) =>
  text.split(/(\[\d+\])/g).map((part, index) => {
    const match = /^\[(\d+)\]$/.exec(part);
    if (!match) return <Fragment key={`${part}-${index}`}>{part.replace(/\*\*/g, '')}</Fragment>;
    const referenceId = Number(match[1]);
    return (
      <button key={`${part}-${index}`} type="button" className="ai-research-inline-citation" onClick={() => onCitationClick(referenceId)}>
        {part}
      </button>
    );
  });

export const renderInlineMarkdown = (text: string, onCitationClick: (id: number) => void) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`b-${index}`}>{renderCitationText(part.slice(2, -2), onCitationClick)}</strong>
      );
    }
    return <Fragment key={`t-${index}`}>{renderCitationText(part, onCitationClick)}</Fragment>;
  });
};

export const renderIeeeMarkdown = (raw: string, onCitationClick: (id: number) => void) => {
  const blocks = raw.replace(/\r\n/g, '\n').split(/\n{2,}/);
  return blocks.map((block, blockIndex) => {
    const lines = block.split('\n').map((line) => line.trimEnd());
    const heading = /^(#{1,3})\s+(.+)$/.exec(lines[0]?.trim() || '');
    if (heading && lines.length === 1) {
      const level = heading[1].length;
      const Tag = (level === 1 ? 'h3' : 'h4') as 'h3' | 'h4';
      return (
        <Tag key={`md-h-${blockIndex}`} className="ai-research-md-heading">
          {renderInlineMarkdown(heading[2], onCitationClick)}
        </Tag>
      );
    }
    const isTable =
      lines.length >= 2 &&
      lines[0].includes('|') &&
      lines.some((line) => /^\|?\s*:?-{3,}/.test(line.replace(/\s/g, '')) || line.includes('---'));
    if (isTable) {
      const rows = lines
        .filter((line) => line.includes('|'))
        .filter((line) => !/^\|?\s*[:\-| ]+\|?\s*$/.test(line))
        .map((line) =>
          line
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((cell) => cell.trim()),
        );
      if (!rows.length) return null;
      const [header, ...body] = rows;
      return (
        <div key={`md-table-${blockIndex}`} className="ai-research-ieee-table-wrap">
          <table className="ai-research-ieee-table">
            <thead>
              <tr>
                {header.map((cell, index) => (
                  <th key={`${cell}-${index}`}>{renderCitationText(cell, onCitationClick)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={`r-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${rowIndex}-${cellIndex}`}>
                      {renderCitationText(cell, onCitationClick)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    const bulletLines = lines.filter((line) => /^[-*•]\s+/.test(line.trim()) || /^\d+\.\s+/.test(line.trim()) || /^A\d+\.\s+/.test(line.trim()));
    if (bulletLines.length === lines.length && lines.length > 0) {
      return (
        <ol key={`md-list-${blockIndex}`} className="ai-research-md-list">
          {lines.map((line, lineIndex) => {
            const content = line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').replace(/^A\d+\.\s+/, '');
            return <li key={lineIndex}>{renderInlineMarkdown(content, onCitationClick)}</li>;
          })}
        </ol>
      );
    }
    if (heading) {
      const rest = lines.slice(1).join('\n').trim();
      const Tag = (heading[1].length === 1 ? 'h3' : 'h4') as 'h3' | 'h4';
      return (
        <div key={`md-hblock-${blockIndex}`} className="ai-research-md-block">
          <Tag className="ai-research-md-heading">{renderInlineMarkdown(heading[2], onCitationClick)}</Tag>
          {rest ? <p className="ai-research-ieee-prose">{renderInlineMarkdown(rest, onCitationClick)}</p> : null}
        </div>
      );
    }
    return (
      <p key={`md-p-${blockIndex}`} className="ai-research-ieee-prose">
        {renderInlineMarkdown(block, onCitationClick)}
      </p>
    );
  });
};

export const mergeProgress = (
  previous: AiResearchProgress | null,
  next: Partial<AiResearchProgress> & { status?: string },
  jobId: string,
  fallbackBudgetCap: number,
): AiResearchProgress => ({
  jobId,
  status: next.status || previous?.status || 'queued',
  currentModule: next.currentModule ?? previous?.currentModule,
  currentClaimId: next.currentClaimId ?? previous?.currentClaimId,
  resolvedClaims: next.resolvedClaims ?? previous?.resolvedClaims ?? 0,
  totalClaims: next.totalClaims ?? previous?.totalClaims ?? 0,
  criticalResolved: next.criticalResolved ?? previous?.criticalResolved ?? 0,
  criticalTotal: next.criticalTotal ?? previous?.criticalTotal ?? 0,
  budgetUsed: next.budgetUsed ?? previous?.budgetUsed ?? 0,
  budgetCap: next.budgetCap ?? previous?.budgetCap ?? fallbackBudgetCap,
  message: next.message ?? previous?.message,
  phase: next.phase ?? previous?.phase,
  agent: next.agent ?? previous?.agent,
  activity: next.activity ?? previous?.activity,
  iteration: next.iteration ?? previous?.iteration,
  query: next.query ?? previous?.query,
  evidenceCount: next.evidenceCount ?? previous?.evidenceCount,
  sourceDomains: next.sourceDomains ?? previous?.sourceDomains,
  verdict: next.verdict ?? previous?.verdict,
});
