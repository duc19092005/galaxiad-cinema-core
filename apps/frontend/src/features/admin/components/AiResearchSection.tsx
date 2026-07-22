import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  CircleStop,
  ExternalLink,
  Loader2,
  Play,
  Radio,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { aiResearchApi } from '../../../api/aiResearchApi';
import type {
  AiResearchAnalysisType,
  AiResearchCity,
  AiResearchIeeeReference,
  AiResearchJobDetail,
  AiResearchJobSummary,
  AiResearchProgress,
  AiResearchRunMode,
  AiResearchTimelineItem,
} from '../../../types/aiResearch.types';
import { showError, showSuccess } from '../../../utils/ToastUtils';
import './AiResearchSection.css';

const templates = {
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

const terminalStatuses = new Set(['done', 'failed', 'cancelled']);

const statusLabel = (status: string) =>
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

const cityLabel = (city: AiResearchCity) => (city === 'HCM' ? 'TPHCM' : 'Hà Nội');

/** Normalize reference array from API: ensure numeric id + stable sort. UI owns display numbering. */
const normalizeReferences = (refs: AiResearchIeeeReference[] | undefined): AiResearchIeeeReference[] => {
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

const formatIeeeReferenceBody = (ref: {
  title: string;
  url: string;
  domain?: string;
  ieeeText?: string;
}) => {
  if (ref.ieeeText) {
    // Strip any leading [n] — UI always paints the number itself.
    return ref.ieeeText.replace(/^\s*\[\d+\]\s*/, '').trim();
  }
  const domain = ref.domain || 'web';
  return `“${ref.title}”, ${domain}, [Online]. Available: ${ref.url}`;
};

const renderCitationText = (text: string, onCitationClick: (id: number) => void) =>
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

const renderInlineMarkdown = (text: string, onCitationClick: (id: number) => void) => {
  // Bold **...** then citations.
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

/** Lightweight Markdown: headings, tables, bullets, prose + clickable [n] citations. */
const renderIeeeMarkdown = (raw: string, onCitationClick: (id: number) => void) => {
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
    // Multi-line block that starts with a markdown heading.
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
const mergeProgress = (
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

const AiResearchSection = () => {
  const [city, setCity] = useState<AiResearchCity>('HCM');
  const [analysisType, setAnalysisType] = useState<AiResearchAnalysisType>('PricingAnalysis');
  const [runMode, setRunMode] = useState<AiResearchRunMode>('RunAll');
  const [selectedModules, setSelectedModules] = useState<string[]>(
    templates.PricingAnalysis.map((item) => item.key),
  );
  const [budgetCap, setBudgetCap] = useState(30);
  const [notes, setNotes] = useState('');
  const [jobs, setJobs] = useState<AiResearchJobSummary[]>([]);
  const [activeJob, setActiveJob] = useState<AiResearchJobDetail | null>(null);
  const [progress, setProgress] = useState<AiResearchProgress | null>(null);
  const [timeline, setTimeline] = useState<AiResearchTimelineItem[]>([]);
  const [sseState, setSseState] = useState<'idle' | 'connecting' | 'live' | 'reconnecting' | 'degraded' | 'completed' | 'failed'>('idle');
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [creating, setCreating] = useState(false);
  const streamAbortRef = useRef<AbortController | null>(null);
  const timelineEndRef = useRef<HTMLDivElement | null>(null);
  const eventSeqRef = useRef(0);
  const lastEventIdRef = useRef(0);
  const seenEventIdsRef = useRef(new Set<number>());

  const modules = templates[analysisType];
  const isRunning = Boolean(activeJob && !terminalStatuses.has(activeJob.status));
  const processedPercent = Math.round(
    ((progress?.resolvedClaims || 0) / Math.max(1, progress?.totalClaims || 0)) * 100,
  );

  const refreshJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      setJobs(await aiResearchApi.listJobs());
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Không tải được lịch sử research.');
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  const loadJob = useCallback(async (jobId: string) => {
    try {
      const detail = await aiResearchApi.getJob(jobId);
      setActiveJob(detail);
      setProgress({
        jobId: detail.jobId,
        status: detail.status,
        resolvedClaims: detail.claims.filter((item) => item.status === 'resolved').length,
        totalClaims: detail.claims.length,
        criticalResolved: detail.claims.filter((item) => item.isCritical && item.status === 'resolved')
          .length,
        criticalTotal: detail.claims.filter((item) => item.isCritical).length,
        budgetUsed: detail.budgetUsed,
        budgetCap: detail.budgetCap,
        message: detail.errorMessage || statusLabel(detail.status),
      });
      return detail;
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Không tải được report.');
      return null;
    }
  }, []);

  const appendTimeline = useCallback((event: string, data: AiResearchProgress) => {
    if (event === 'connected') {
      setSseState('live');
      return;
    }
    const message = data.message || data.activity || statusLabel(event);
    eventSeqRef.current += 1;
    setTimeline((current) => {
      const next: AiResearchTimelineItem = {
        id: `${data.jobId}-${eventSeqRef.current}-${event}`,
        event,
        message,
        activity: data.activity,
        agent: data.agent,
        at: Date.now(),
      };
      // Newest at bottom for a readable agent-activity audit trail.
      return [...current, next].slice(-80);
    });
  }, []);

  const streamJob = useCallback(
    async (jobId: string) => {
      streamAbortRef.current?.abort();
      const controller = new AbortController();
      streamAbortRef.current = controller;
      setTimeline([]);
      eventSeqRef.current = 0;
      lastEventIdRef.current = 0;
      seenEventIdsRef.current.clear();
      setSseState('connecting');

      try {
        await aiResearchApi.streamEvents(
          jobId,
          (event) => {
            const numericEventId = event.id ? Number(event.id) : NaN;
            if (Number.isFinite(numericEventId)) {
              if (numericEventId <= lastEventIdRef.current || seenEventIdsRef.current.has(numericEventId)) return;
              lastEventIdRef.current = numericEventId;
              seenEventIdsRef.current.add(numericEventId);
            }
            setSseState(['done', 'failed', 'cancelled'].includes(event.event) ? (event.event === 'done' ? 'completed' : 'failed') : 'live');
            const payload = event.data || ({} as AiResearchProgress);
            const status = payload.status || event.event;

            setProgress((current) =>
              mergeProgress(
                current,
                {
                  ...payload,
                  status: event.event === 'connected' ? current?.status || 'queued' : status,
                },
                jobId,
                current?.budgetCap || budgetCap,
              ),
            );

            setActiveJob((current) =>
              current?.jobId === jobId
                ? {
                    ...current,
                    status:
                      event.event === 'done' ||
                      event.event === 'failed' ||
                      event.event === 'cancelled'
                        ? event.event
                        : current.status === 'queued' || !terminalStatuses.has(status)
                          ? status === 'connected'
                            ? current.status
                            : [
                                  'planning',
                                  'researching',
                                  'arbitrating',
                                  'synthesizing',
                                  'queued',
                                ].includes(status)
                              ? status
                              : current.status
                          : current.status,
                    budgetUsed: payload.budgetUsed ?? current.budgetUsed,
                  }
                : current,
            );

            appendTimeline(event.event, {
              ...payload,
              jobId,
              status,
              budgetUsed: payload.budgetUsed ?? 0,
              budgetCap: payload.budgetCap ?? budgetCap,
            });

            if (terminalStatuses.has(event.event)) {
              void loadJob(jobId);
              void refreshJobs();
              setSseState('idle');
            }
          },
          controller.signal,
          lastEventIdRef.current,
          // Headers received — show live immediately even before the first parsed frame.
          () => setSseState((current) => (current === 'connecting' || current === 'reconnecting' ? 'live' : current)),
        );
      } catch (error) {
        if (!controller.signal.aborted) {
          setSseState('degraded');
          showError(error instanceof Error ? error.message : 'Mất kết nối SSE.');
        }
      }
    },
    [appendTimeline, budgetCap, loadJob, refreshJobs],
  );

  useEffect(() => {
    void refreshJobs();
    return () => streamAbortRef.current?.abort();
  }, [refreshJobs]);

  useEffect(() => {
    setSelectedModules(templates[analysisType].map((item) => item.key));
    setBudgetCap(runMode === 'RunAll' ? 50 : 30);
  }, [analysisType, runMode]);

  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [timeline]);

  // Lightweight status polling while a job is running — backup if a few SSE frames drop.
  useEffect(() => {
    if (!activeJob || terminalStatuses.has(activeJob.status)) return;
    const timer = window.setInterval(() => {
      void (async () => {
        try {
          const detail = await aiResearchApi.getJob(activeJob.jobId);
          setActiveJob((current) =>
            current?.jobId === detail.jobId
              ? {
                  ...current,
                  status: detail.status,
                  budgetUsed: detail.budgetUsed,
                  report: detail.report,
                  claims: detail.claims.length ? detail.claims : current.claims,
                  errorMessage: detail.errorMessage,
                }
              : current,
          );
          setProgress((current) =>
            mergeProgress(
              current,
              {
                status: detail.status,
                budgetUsed: detail.budgetUsed,
                budgetCap: detail.budgetCap,
                message: detail.errorMessage || current?.message,
                resolvedClaims: detail.claims.filter((item) => item.status === 'resolved').length,
                totalClaims: detail.claims.length || current?.totalClaims,
              },
              detail.jobId,
              detail.budgetCap,
            ),
          );
          if (terminalStatuses.has(detail.status)) {
            void refreshJobs();
          }
        } catch {
          // Ignore polling errors; SSE remains primary.
        }
      })();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [activeJob?.jobId, activeJob?.status, refreshJobs]);

  const createJob = async () => {
    if (runMode === 'SelectedModules' && selectedModules.length === 0) {
      showError('Chọn ít nhất một module để chạy.');
      return;
    }
    setCreating(true);
    try {
      const job = await aiResearchApi.createJob({
        city,
        analysisType,
        runMode,
        selectedModules: runMode === 'RunAll' ? modules.map((item) => item.key) : selectedModules,
        budgetCap,
        notes,
      });
      setJobs((current) => [job, ...current]);
      setActiveJob({ ...job, notes, claims: [], report: null });
      setProgress({
        jobId: job.jobId,
        status: 'queued',
        resolvedClaims: 0,
        totalClaims: 0,
        criticalResolved: 0,
        criticalTotal: 0,
        budgetUsed: 0,
        budgetCap: job.budgetCap,
        message: 'Job đã vào hàng đợi · đang mở SSE…',
      });
      showSuccess('Đã tạo AI research job.');
      void streamJob(job.jobId);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Không tạo được research job.');
    } finally {
      setCreating(false);
    }
  };

  const cancelJob = async () => {
    if (!activeJob) return;
    try {
      await aiResearchApi.cancelJob(activeJob.jobId);
      showSuccess('Đã gửi yêu cầu hủy job.');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Không hủy được job.');
    }
  };

  const summary = activeJob?.report?.summary;
  const numberedReferences = useMemo(
    () => normalizeReferences(summary?.references),
    [summary?.references],
  );
  const scrollToReference = useCallback((referenceId: number) => {
    document.getElementById(`ai-research-reference-${referenceId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);


  const phaseOrder = ['planning', 'researching', 'arbitrating', 'synthesizing'] as const;
  const activePhase = progress?.phase || activeJob?.status || '';
  const activePhaseIndex = phaseOrder.indexOf(
    (phaseOrder.includes(activePhase as (typeof phaseOrder)[number])
      ? activePhase
      : activeJob?.status === 'done'
        ? 'synthesizing'
        : 'planning') as (typeof phaseOrder)[number],
  );
  const budgetUsed = progress?.budgetUsed ?? activeJob?.budgetUsed ?? 0;
  const budgetCapValue = progress?.budgetCap ?? activeJob?.budgetCap ?? budgetCap;
  const budgetPct = Math.min(100, Math.round((budgetUsed / Math.max(1, budgetCapValue)) * 100));
  const sseBadgeClass =
    sseState === 'live'
      ? 'live'
      : sseState === 'degraded' || sseState === 'failed'
        ? 'degraded'
        : sseState === 'connecting' || sseState === 'reconnecting'
          ? 'connecting'
          : '';
  const sseLabel =
    sseState === 'live'
      ? 'SSE live'
      : sseState === 'connecting'
        ? 'Đang nối SSE'
        : sseState === 'reconnecting'
          ? 'Đang nối lại'
          : sseState === 'degraded' || sseState === 'failed'
            ? 'SSE đang khôi phục'
            : 'SSE idle';

  return (
    <div className="ai-research-page animate-in">
      <header className="ai-research-header">
        <div>
          <div className="ai-research-eyebrow">
            <Bot size={14} />
            <span>Business Research Multi-Agent</span>
          </div>
          <h1>AI Research Workspace</h1>
          <p>
            Research giá, đối thủ, quy hoạch và chi phí mặt bằng với citation theo từng claim.
          </p>
        </div>
        <div className="ai-research-header-actions">
          <button
            type="button"
            className="ai-research-secondary"
            onClick={() => void refreshJobs()}
            disabled={loadingJobs}
          >
            <RefreshCw size={16} className={loadingJobs ? 'spin' : ''} />
            Làm mới
          </button>
        </div>
      </header>

      <div className="ai-research-layout">
        {/* LEFT: config + history */}
        <aside className="ai-research-col-left">
          <section className="ai-research-panel">
            <div className="ai-research-panel-header">
              <strong>Cấu hình job</strong>
              <span className="ai-research-badge pulse">{cityLabel(city)}</span>
            </div>
            <div className="ai-research-panel-body">
              <div className="ai-research-form">
                <label className="ai-research-field">
                  <span className="ai-research-label">Thành phố</span>
                  <select
                    className="ai-research-select"
                    value={city}
                    onChange={(event) => setCity(event.target.value as AiResearchCity)}
                  >
                    <option value="HCM">TPHCM</option>
                    <option value="HN">Hà Nội</option>
                  </select>
                </label>

                <label className="ai-research-field">
                  <span className="ai-research-label">Loại phân tích</span>
                  <select
                    className="ai-research-select"
                    value={analysisType}
                    onChange={(event) =>
                      setAnalysisType(event.target.value as AiResearchAnalysisType)
                    }
                  >
                    <option value="PricingAnalysis">Pricing Analysis</option>
                    <option value="SiteLocationFeasibility">Site/Location Feasibility</option>
                  </select>
                </label>

                <div className="ai-research-field">
                  <span className="ai-research-label">Chế độ chạy</span>
                  <div className="ai-research-segmented">
                    <button
                      type="button"
                      className={runMode === 'RunAll' ? 'active' : ''}
                      onClick={() => setRunMode('RunAll')}
                    >
                      Chạy tất cả
                    </button>
                    <button
                      type="button"
                      className={runMode === 'SelectedModules' ? 'active' : ''}
                      onClick={() => setRunMode('SelectedModules')}
                    >
                      Chọn module
                    </button>
                  </div>
                </div>

                <div className="ai-research-field">
                  <span className="ai-research-label">Modules</span>
                  <div className="ai-research-modules">
                    {modules.map((module) => {
                      const checked = runMode === 'RunAll' || selectedModules.includes(module.key);
                      return (
                        <label
                          key={module.key}
                          className={`ai-research-module ${runMode === 'RunAll' ? 'disabled' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={runMode === 'RunAll'}
                            onChange={() =>
                              setSelectedModules((current) =>
                                current.includes(module.key)
                                  ? current.filter((key) => key !== module.key)
                                  : [...current, module.key],
                              )
                            }
                          />
                          <span>{module.label}</span>
                          {module.critical && <span className="ai-research-badge">critical</span>}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="ai-research-field">
                  <span className="ai-research-label">Tavily call budget: {budgetCap}</span>
                  <div className="ai-research-range-wrap">
                    <input
                      type="range"
                      min={5}
                      max={100}
                      step={5}
                      value={budgetCap}
                      onChange={(event) => setBudgetCap(Number(event.target.value))}
                    />
                  </div>
                </div>

                <label className="ai-research-field">
                  <span className="ai-research-label">Ghi chú</span>
                  <textarea
                    className="ai-research-textarea"
                    rows={3}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Ví dụ: ưu tiên khu Đông TPHCM hoặc khung giờ cuối tuần"
                  />
                </label>

                <button
                  type="button"
                  className="ai-research-primary"
                  onClick={() => void createJob()}
                  disabled={creating || isRunning}
                >
                  {creating ? (
                    <Loader2 size={17} className="spin" />
                  ) : (
                    <Play size={17} fill="currentColor" />
                  )}
                  Khởi chạy research
                </button>
              </div>
            </div>
          </section>

          <section className="ai-research-panel">
            <div className="ai-research-panel-header">
              <strong>Lịch sử job</strong>
              <span className="ai-research-badge">{jobs.length}</span>
            </div>
            <div className="ai-research-history">
              {loadingJobs && <div className="ai-research-panel-body">Đang tải...</div>}
              {!loadingJobs && jobs.length === 0 && (
                <div className="ai-research-panel-body" style={{ color: 'var(--text-muted)' }}>
                  Chưa có research job.
                </div>
              )}
              {jobs.map((job) => (
                <button
                  type="button"
                  key={job.jobId}
                  className={`ai-research-history-item ${activeJob?.jobId === job.jobId ? 'active' : ''}`}
                  onClick={() => {
                    streamAbortRef.current?.abort();
                    void loadJob(job.jobId);
                    if (!terminalStatuses.has(job.status)) void streamJob(job.jobId);
                    else {
                      setTimeline([]);
                      setSseState('idle');
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                    <strong>
                      {job.analysisType === 'PricingAnalysis' ? 'Pricing' : 'Site/Location'} ·{' '}
                      {cityLabel(job.city)}
                    </strong>
                    <span className={`ai-research-badge ${job.status}`}>
                      {statusLabel(job.status)}
                    </span>
                  </div>
                  <div className="ai-research-history-meta">
                    {new Date(job.createdAt).toLocaleString('vi-VN')} · {job.budgetUsed}/
                    {job.budgetCap} calls
                  </div>
                </button>
              ))}
            </div>
          </section>
        </aside>

        {/* RIGHT: realtime cockpit */}
        <div className="ai-research-col-right">
          <div className="ai-research-stage-header">
            <h2>Tiến độ realtime</h2>
            <div className="ai-research-stage-actions">
              <span className={`ai-research-badge ${sseBadgeClass}`} title="Trạng thái kênh SSE">
                <Radio size={11} />
                {sseLabel}
              </span>
              {activeJob && (
                <span className={`ai-research-badge ${activeJob.status}`}>
                  {statusLabel(activeJob.status)}
                </span>
              )}
              {isRunning && (
                <button
                  type="button"
                  className="ai-research-secondary ghost-sm"
                  onClick={() => void cancelJob()}
                >
                  <CircleStop size={14} /> Hủy
                </button>
              )}
            </div>
          </div>

          {!activeJob && (
            <div className="ai-research-empty-stage">
              Chọn một job ở lịch sử hoặc khởi chạy research mới để xem pipeline multi-agent realtime.
            </div>
          )}

          {activeJob && (
            <>
              <div className={`ai-research-progress-card ${isRunning ? 'is-live' : ''}`}>
                <div className="ai-research-progress-row">
                  <span>{progress?.message || statusLabel(activeJob.status)}</span>
                  <strong>
                    {progress?.totalClaims ? `${processedPercent}%` : isRunning ? '…' : '0%'}
                  </strong>
                </div>
                <div className="ai-research-progress-track">
                  <div
                    className={`ai-research-progress-fill ${isRunning ? 'running' : ''}`}
                    style={{
                      width: `${progress?.totalClaims ? processedPercent : isRunning ? 8 : 0}%`,
                    }}
                  />
                </div>

                <div className="ai-research-phase-stepper" aria-label="Tiến trình multi-agent">
                  {phaseOrder.map((phase, index) => (
                    <span
                      key={phase}
                      className={
                        progress?.phase === phase || activeJob.status === phase
                          ? 'active'
                          : activePhaseIndex > index || activeJob.status === 'done'
                            ? 'done'
                            : ''
                      }
                    >
                      {statusLabel(phase)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="ai-research-metrics">
                <div className="ai-research-metric">
                  <small>Claims</small>
                  <strong>
                    {progress?.resolvedClaims || 0}
                    <em>/{progress?.totalClaims || 0}</em>
                  </strong>
                </div>
                <div className="ai-research-metric">
                  <small>Critical</small>
                  <strong>
                    {progress?.criticalResolved || 0}
                    <em>/{progress?.criticalTotal || 0}</em>
                  </strong>
                </div>
                <div className="ai-research-metric">
                  <small>Budget</small>
                  <strong>
                    {budgetUsed}
                    <em>/{budgetCapValue}</em>
                  </strong>
                  <span className="metric-bar" style={{ width: `${budgetPct}%` }} />
                </div>
                <div className="ai-research-metric">
                  <small>Module</small>
                  <strong style={{ fontSize: 16, marginTop: 4 }}>
                    {progress?.currentModule || '-'}
                  </strong>
                </div>
              </div>

              <div className="ai-research-live-context">
                <div>
                  <small>Agent</small>
                  <strong>{progress?.agent || '-'}</strong>
                </div>
                <div>
                  <small>Claim</small>
                  <strong>
                    {progress?.currentClaimId ? progress.currentClaimId.slice(0, 8) : '-'}
                  </strong>
                </div>
                <div>
                  <small>Evidence</small>
                  <strong>{progress?.evidenceCount ?? 0}</strong>
                </div>
                <div>
                  <small>Verdict</small>
                  <strong>{progress?.verdict?.status || '-'}</strong>
                </div>
                {progress?.query && (
                  <p>
                    <small>Truy vấn hiện tại: </small>
                    {progress.query}
                  </p>
                )}
              </div>

              <div className={`ai-research-cot ${isRunning ? 'is-live' : ''}`}>
                <div className="ai-research-cot-toolbar">
                  <span className="live-pill">
                    <Sparkles size={13} className={isRunning ? 'spin' : ''} />
                    Hoạt động agent (live)
                    <span className="ai-research-badge">{timeline.length}</span>
                  </span>
                </div>
                <div className="ai-research-cot-header" aria-hidden={timeline.length === 0}>
                  <div>Agent</div>
                  <div>Claim / Activity</div>
                  <div>Evidence</div>
                  <div>Verdict</div>
                </div>
                <div className="ai-research-cot-stream">
                  {timeline.length === 0 && (
                    <div className="ai-research-cot-empty">
                      {isRunning
                        ? 'Đang chờ event SSE từ pipeline…'
                        : 'Chưa có bước suy luận. Chạy job để xem realtime.'}
                    </div>
                  )}
                  {timeline.map((item) => (
                    <div key={item.id} className={`ai-research-cot-item event-${item.event}`}>
                      <div className="col-agent">{item.agent || statusLabel(item.event)}</div>
                      <div className="col-claim">
                        {item.message}
                        {item.activity && item.activity !== item.message && (
                          <div className="ai-research-cot-meta-line">{item.activity}</div>
                        )}
                        <div className="ai-research-cot-meta-line">
                          {new Date(item.at).toLocaleTimeString('vi-VN')}
                        </div>
                      </div>
                      <div className="col-evidence">
                        {typeof progress?.evidenceCount === 'number' && item.event.includes('evidence')
                          ? progress.evidenceCount
                          : item.event === 'evidence_found'
                            ? '1+'
                            : '-'}
                      </div>
                      <div className="col-verdict">{statusLabel(item.event)}</div>
                    </div>
                  ))}
                  <div ref={timelineEndRef} />
                </div>
              </div>
            </>
          )}

          {activeJob?.report && (
            <section className="ai-research-panel">
              <div className="ai-research-panel-header">
                <div>
                  <strong>Báo cáo khả thi điều hành · Galaxy Cinema</strong>
                  <div style={{ marginTop: 3, color: 'var(--text-muted)', fontSize: 11 }}>
                    {cityLabel(activeJob.city)} ·{' '}
                    {new Date(activeJob.report.generatedAt).toLocaleString('vi-VN')}
                    {' · '}dành cho CEO / CFO / HĐQT · trích dẫn IEEE [n]
                  </div>
                </div>
                <CheckCircle2 size={20} style={{ color: '#4ade80' }} />
              </div>
              <div className="ai-research-panel-body">
                <div className="ai-research-metrics" style={{ marginTop: 0, marginBottom: 16 }}>
                  <div className="ai-research-metric">
                    <small>Giả thuyết KT</small>
                    <strong>{summary?.totalClaims || activeJob.claims.length}</strong>
                  </div>
                  <div className="ai-research-metric">
                    <small>Đã xác nhận</small>
                    <strong>{summary?.resolvedClaims || 0}</strong>
                  </div>
                  <div className="ai-research-metric">
                    <small>Cần thẩm định</small>
                    <strong>{summary?.insufficientClaims || 0}</strong>
                  </div>
                  <div className="ai-research-metric">
                    <small>Tài liệu</small>
                    <strong>
                      {numberedReferences.length || summary?.referenceCount || 0}
                    </strong>
                  </div>
                </div>

                <article className="ai-research-ieee">
                  <h1 className="ai-research-ieee-title">
                    {summary?.title ||
                      summary?.headline ||
                      activeJob.report.title ||
                      'Báo cáo đánh giá khả thi mở rộng Galaxy Cinema'}
                  </h1>

                  {(summary?.executiveSummary || summary?.abstract) && (
                    <section className="ai-research-ieee-section">
                      <h2>1. Tóm tắt điều hành (Executive Summary)</h2>
                      <div className="ai-research-exec">
                        <p className="ai-research-exec-body">
                          {summary?.executiveSummary || summary?.abstract}
                        </p>
                        {summary?.confidenceNote && (
                          <p className="ai-research-exec-note">
                            Đánh giá rủi ro dữ liệu tổng thể: {summary.confidenceNote}
                          </p>
                        )}
                      </div>
                    </section>
                  )}

                  {!!summary?.recommendations?.length && (
                    <section className="ai-research-ieee-section">
                      <h2>2. Đề xuất hành động theo thứ tự ưu tiên</h2>
                      <ol className="ai-research-md-list ai-research-rec-list">
                        {summary.recommendations.map((item, index) => (
                          <li key={`rec-${index}`}>{renderCitationText(item, scrollToReference)}</li>
                        ))}
                      </ol>
                    </section>
                  )}

                  {!!summary?.keyFindings?.length && (
                    <section className="ai-research-ieee-section">
                      <h2>Phát hiện then chốt</h2>
                      <ul className="ai-research-md-list">
                        {summary.keyFindings.map((item, index) => (
                          <li key={`kf-${index}`}>{renderCitationText(item, scrollToReference)}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {summary?.introduction && (
                    <section className="ai-research-ieee-section">
                      <h2>Bối cảnh thị trường</h2>
                      <div className="ai-research-ieee-prose-block">
                        {renderIeeeMarkdown(summary.introduction, scrollToReference)}
                      </div>
                    </section>
                  )}

                  {summary?.resultsAndDiscussion && (
                    <section className="ai-research-ieee-section">
                      <h2>3. Phân tích chi tiết theo trụ cột kinh doanh</h2>
                      <p className="ai-research-section-hint">
                        Mỗi trụ cột: Thực trạng thị trường · Đánh giá rủi ro &amp; độ tin cậy · Tác động
                        CapEx/OpEx/Doanh thu. Trích dẫn IEEE [n].
                      </p>
                      <div className="ai-research-ieee-prose-block">
                        {renderIeeeMarkdown(summary.resultsAndDiscussion, scrollToReference)}
                      </div>
                    </section>
                  )}

                  {summary?.executiveMatrixMarkdown &&
                    !summary.resultsAndDiscussion?.includes('Trụ cột phân tích') && (
                      <section className="ai-research-ieee-section">
                        <h2>4. Bảng tổng hợp khả thi địa điểm &amp; chi phí</h2>
                        <div className="ai-research-ieee-prose-block">
                          {renderIeeeMarkdown(summary.executiveMatrixMarkdown, scrollToReference)}
                        </div>
                      </section>
                    )}

                  {!!summary?.risksAndUnknowns?.length && (
                    <section className="ai-research-ieee-section">
                      <h2>Rủi ro chiến lược &amp; khoảng trống dữ liệu</h2>
                      <ul className="ai-research-md-list ai-research-risk-list">
                        {summary.risksAndUnknowns.map((item, index) => (
                          <li key={`risk-${index}`}>{renderCitationText(item, scrollToReference)}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {summary?.conclusion && (
                    <section className="ai-research-ieee-section">
                      <h2>Kết luận &amp; bước thẩm định tiếp theo</h2>
                      <div className="ai-research-ieee-prose-block">
                        {renderIeeeMarkdown(summary.conclusion, scrollToReference)}
                      </div>
                    </section>
                  )}

                  {numberedReferences.length > 0 && (
                    <section className="ai-research-ieee-section">
                      <h2>5. Tài liệu tham khảo (IEEE)</h2>
                      <ol className="ai-research-ieee-refs">
                        {numberedReferences.map((ref) => (
                          <li
                            id={`ai-research-reference-${ref.id}`}
                            key={`${ref.id}-${ref.url}`}
                            className="ai-research-ref-item"
                            value={ref.id}
                          >
                            <span className="ai-research-ref-num" aria-hidden>
                              [{ref.id}]
                            </span>
                            <span className="ai-research-ref-body">
                              {formatIeeeReferenceBody(ref)}{' '}
                              {ref.url ? (
                                <a href={ref.url} target="_blank" rel="noreferrer" title={ref.url}>
                                  <ExternalLink size={12} style={{ verticalAlign: '-2px' }} />
                                </a>
                              ) : null}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </section>
                  )}
                </article>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiResearchSection;
