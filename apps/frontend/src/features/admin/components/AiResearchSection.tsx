import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

/** Lightweight Markdown subset for IEEE body: tables + paragraphs (no raw URL requirement in body). */
const renderIeeeMarkdown = (raw: string) => {
  const blocks = raw.replace(/\r\n/g, '\n').split(/\n{2,}/);
  return blocks.map((block, blockIndex) => {
    const lines = block.split('\n').map((line) => line.trimEnd());
    const isTable =
      lines.length >= 2 &&
      lines[0].includes('|') &&
      lines.some((line) => /^\|?\s*:?-{3,}/.test(line.replace(/\s/g, '')) || line.includes('---'));

    if (isTable) {
      const tableLines = lines.filter((line) => line.includes('|'));
      const rows = tableLines
        .filter((line) => !/^\|?\s*[:\-| ]+\|?\s*$/.test(line))
        .map((line) =>
          line
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((cell) => cell.trim()),
        );
      if (rows.length === 0) return null;
      const [header, ...body] = rows;
      return (
        <div key={`md-table-${blockIndex}`} className="ai-research-ieee-table-wrap">
          <table className="ai-research-ieee-table">
            <thead>
              <tr>
                {header.map((cell) => (
                  <th key={cell}>{cell.replace(/\*\*/g, '')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={`r-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${rowIndex}-${cellIndex}`}>{cell.replace(/\*\*/g, '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <p key={`md-p-${blockIndex}`} className="ai-research-ieee-prose">
        {block}
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
  thought: next.thought ?? previous?.thought,
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
  const [sseState, setSseState] = useState<'idle' | 'connecting' | 'live' | 'error'>('idle');
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [creating, setCreating] = useState(false);
  const streamAbortRef = useRef<AbortController | null>(null);
  const timelineEndRef = useRef<HTMLDivElement | null>(null);
  const eventSeqRef = useRef(0);

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
    const message = data.message || data.thought || statusLabel(event);
    eventSeqRef.current += 1;
    setTimeline((current) => {
      const next: AiResearchTimelineItem = {
        id: `${data.jobId}-${eventSeqRef.current}-${event}`,
        event,
        message,
        thought: data.thought,
        at: Date.now(),
      };
      // Newest at bottom for natural reading of chain-of-thought.
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
      setSseState('connecting');

      try {
        await aiResearchApi.streamEvents(
          jobId,
          (event) => {
            setSseState('live');
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
        );
      } catch (error) {
        if (!controller.signal.aborted) {
          setSseState('error');
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
  const reportModules = useMemo(
    () => Array.from(new Set(activeJob?.claims.map((claim) => claim.category) || [])),
    [activeJob],
  );

  return (
    <div className="ai-research-page animate-in">
      <header className="ai-research-header">
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              color: 'var(--accent)',
              marginBottom: 7,
            }}
          >
            <Bot size={18} />
            <span style={{ fontSize: 11, fontWeight: 850, textTransform: 'uppercase' }}>
              Business Research Multi-Agent
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.15 }}>AI Research Workspace</h1>
          <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
            Research giá, đối thủ, quy hoạch và chi phí mặt bằng với citation theo từng claim.
          </p>
        </div>
        <button
          className="ai-research-secondary"
          onClick={() => void refreshJobs()}
          disabled={loadingJobs}
        >
          <RefreshCw size={16} className={loadingJobs ? 'spin' : ''} />
          Làm mới
        </button>
      </header>

      <div className="ai-research-layout">
        <div className="ai-research-workspace">
          <section className="ai-research-panel">
            <div className="ai-research-panel-header">
              <strong>Cấu hình job</strong>
              <span className="ai-research-badge">{cityLabel(city)}</span>
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
                      className={runMode === 'RunAll' ? 'active' : ''}
                      onClick={() => setRunMode('RunAll')}
                    >
                      Chạy tất cả
                    </button>
                    <button
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

                <label className="ai-research-field">
                  <span className="ai-research-label">Tavily call budget: {budgetCap}</span>
                  <input
                    className="ai-research-input"
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={budgetCap}
                    onChange={(event) => setBudgetCap(Number(event.target.value))}
                  />
                </label>

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
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong style={{ fontSize: 12 }}>
                      {job.analysisType === 'PricingAnalysis' ? 'Pricing' : 'Site/Location'} ·{' '}
                      {cityLabel(job.city)}
                    </strong>
                    <span className={`ai-research-badge ${job.status}`}>
                      {statusLabel(job.status)}
                    </span>
                  </div>
                  <div style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 11 }}>
                    {new Date(job.createdAt).toLocaleString('vi-VN')} · {job.budgetUsed}/
                    {job.budgetCap} calls
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="ai-research-workspace">
          <section className="ai-research-panel">
            <div className="ai-research-panel-header">
              <strong>Tiến độ realtime</strong>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span
                  className={`ai-research-badge ${sseState === 'live' ? 'resolved' : sseState === 'error' ? 'conflicting' : ''}`}
                  title="Trạng thái kênh SSE"
                >
                  <Radio size={11} style={{ marginRight: 4 }} />
                  {sseState === 'live'
                    ? 'SSE live'
                    : sseState === 'connecting'
                      ? 'Đang nối SSE'
                      : sseState === 'error'
                        ? 'SSE lỗi'
                        : 'SSE idle'}
                </span>
                {activeJob && (
                  <span className={`ai-research-badge ${activeJob.status}`}>
                    {statusLabel(activeJob.status)}
                  </span>
                )}
                {isRunning && (
                  <button
                    className="ai-research-secondary"
                    style={{ minHeight: 30, padding: '4px 9px' }}
                    onClick={() => void cancelJob()}
                  >
                    <CircleStop size={14} /> Hủy
                  </button>
                )}
              </div>
            </div>
            <div className="ai-research-panel-body">
              {!activeJob && (
                <div style={{ color: 'var(--text-muted)', padding: '30px 0', textAlign: 'center' }}>
                  Chọn một job hoặc khởi chạy research mới.
                </div>
              )}
              {activeJob && (
                <>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      marginBottom: 9,
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {progress?.message || statusLabel(activeJob.status)}
                    </span>
                    <strong style={{ color: 'var(--accent)' }}>
                      {progress?.totalClaims ? `${processedPercent}%` : isRunning ? '…' : '0%'}
                    </strong>
                  </div>
                  <div className="ai-research-progress-track">
                    <div
                      className="ai-research-progress-fill"
                      style={{
                        width: `${progress?.totalClaims ? processedPercent : isRunning ? 8 : 0}%`,
                      }}
                    />
                  </div>
                  <div className="ai-research-metrics">
                    <div className="ai-research-metric">
                      <small>Claims</small>
                      <strong>
                        {progress?.resolvedClaims || 0}/{progress?.totalClaims || 0}
                      </strong>
                    </div>
                    <div className="ai-research-metric">
                      <small>Critical</small>
                      <strong>
                        {progress?.criticalResolved || 0}/{progress?.criticalTotal || 0}
                      </strong>
                    </div>
                    <div className="ai-research-metric">
                      <small>Budget</small>
                      <strong>
                        {progress?.budgetUsed || activeJob.budgetUsed}/{activeJob.budgetCap}
                      </strong>
                    </div>
                    <div className="ai-research-metric">
                      <small>Module</small>
                      <strong>{progress?.currentModule || '-'}</strong>
                    </div>
                  </div>

                  <div className="ai-research-cot">
                    <div className="ai-research-cot-header">
                      <Sparkles size={14} />
                      <strong>Chain of thought (live)</strong>
                      <span className="ai-research-badge">{timeline.length}</span>
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
                          <div className="ai-research-cot-meta">
                            <span className="ai-research-cot-event">{statusLabel(item.event)}</span>
                            <span className="ai-research-cot-time">
                              {new Date(item.at).toLocaleTimeString('vi-VN')}
                            </span>
                          </div>
                          <div className="ai-research-cot-message">{item.message}</div>
                          {item.thought && item.thought !== item.message && (
                            <div className="ai-research-cot-thought">{item.thought}</div>
                          )}
                        </div>
                      ))}
                      <div ref={timelineEndRef} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {activeJob?.report && (
            <section className="ai-research-panel">
              <div className="ai-research-panel-header">
                <div>
                  <strong>Báo cáo IEEE · Galaxy Cinema Research</strong>
                  <div style={{ marginTop: 3, color: 'var(--text-muted)', fontSize: 11 }}>
                    {cityLabel(activeJob.city)} ·{' '}
                    {new Date(activeJob.report.generatedAt).toLocaleString('vi-VN')}
                    {' · '}citation [n] only · URLs in References
                  </div>
                </div>
                <CheckCircle2 size={20} style={{ color: '#4ade80' }} />
              </div>
              <div className="ai-research-panel-body">
                <div className="ai-research-metrics" style={{ marginTop: 0, marginBottom: 16 }}>
                  <div className="ai-research-metric">
                    <small>Tổng claim</small>
                    <strong>{summary?.totalClaims || activeJob.claims.length}</strong>
                  </div>
                  <div className="ai-research-metric">
                    <small>Resolved</small>
                    <strong>{summary?.resolvedClaims || 0}</strong>
                  </div>
                  <div className="ai-research-metric">
                    <small>Insufficient</small>
                    <strong>{summary?.insufficientClaims || 0}</strong>
                  </div>
                  <div className="ai-research-metric">
                    <small>References</small>
                    <strong>{summary?.references?.length || summary?.referenceCount || 0}</strong>
                  </div>
                </div>

                {/* IEEE paper body (new jobs). Older jobs may only have executive fields. */}
                {(summary?.title || summary?.abstract || summary?.introduction) ? (
                  <article className="ai-research-ieee">
                    <h1 className="ai-research-ieee-title">
                      {summary?.title || summary?.headline || activeJob.report.title || 'Untitled'}
                    </h1>

                    {!!summary?.authors?.length && (
                      <div className="ai-research-ieee-authors">
                        {summary.authors.map((author, index) => (
                          <div key={`${author.name}-${index}`} className="ai-research-ieee-author">
                            <strong>{author.name}</strong>
                            {author.affiliation && <em>{author.affiliation}</em>}
                            {author.email && <span className="mono">Contact: {author.email}</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {summary?.abstract && (
                      <section className="ai-research-ieee-section">
                        <h2>TÓM TẮT (ABSTRACT)</h2>
                        <p className="ai-research-ieee-prose">{summary.abstract}</p>
                      </section>
                    )}

                    {!!summary?.keywords?.length && (
                      <p className="ai-research-ieee-keywords">
                        <strong>Từ khóa (Keywords):</strong> {summary.keywords.join('; ')}.
                      </p>
                    )}

                    {summary?.introduction && (
                      <section className="ai-research-ieee-section">
                        <h2>I. MỞ ĐẦU (INTRODUCTION)</h2>
                        <div className="ai-research-ieee-prose-block">
                          {renderIeeeMarkdown(summary.introduction)}
                        </div>
                      </section>
                    )}

                    {summary?.relatedWork && (
                      <section className="ai-research-ieee-section">
                        <h2>II. TỔNG QUAN NGHIÊN CỨU (RELATED WORK)</h2>
                        <div className="ai-research-ieee-prose-block">
                          {renderIeeeMarkdown(summary.relatedWork)}
                        </div>
                      </section>
                    )}

                    {summary?.methodology && (
                      <section className="ai-research-ieee-section">
                        <h2>III. PHƯƠNG PHÁP NGHIÊN CỨU (METHODOLOGY)</h2>
                        <div className="ai-research-ieee-prose-block">
                          {renderIeeeMarkdown(summary.methodology)}
                        </div>
                      </section>
                    )}

                    {summary?.resultsAndDiscussion && (
                      <section className="ai-research-ieee-section">
                        <h2>IV. THỰC NGHIỆM VÀ KẾT QUẢ (RESULTS &amp; DISCUSSION)</h2>
                        <div className="ai-research-ieee-prose-block">
                          {renderIeeeMarkdown(summary.resultsAndDiscussion)}
                        </div>
                      </section>
                    )}

                    {summary?.conclusion && (
                      <section className="ai-research-ieee-section">
                        <h2>V. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN (CONCLUSION &amp; FUTURE WORK)</h2>
                        <div className="ai-research-ieee-prose-block">
                          {renderIeeeMarkdown(summary.conclusion)}
                        </div>
                      </section>
                    )}

                    {!!summary?.references?.length && (
                      <section className="ai-research-ieee-section">
                        <h2>TÀI LIỆU THAM KHẢO (REFERENCES)</h2>
                        <ol className="ai-research-ieee-refs">
                          {summary.references.map((ref) => (
                            <li key={ref.id} value={ref.id}>
                              {ref.ieeeText ? (
                                <span>
                                  {ref.ieeeText.replace(/^\s*\[\d+\]\s*/, '')}
                                </span>
                              ) : (
                                <span>
                                  “{ref.title}”, {ref.domain || 'web'}, [Online]. Available:{' '}
                                  {ref.url}
                                </span>
                              )}
                            </li>
                          ))}
                        </ol>
                      </section>
                    )}

                    {summary?.appendix && (
                      <section className="ai-research-ieee-section">
                        <h2>PHỤ LỤC (APPENDIX) — RAW AUDIT MATRIX</h2>
                        <pre className="ai-research-ieee-prose pre">{summary.appendix}</pre>
                      </section>
                    )}

                    {summary?.confidenceNote && (
                      <p className="ai-research-exec-note">{summary.confidenceNote}</p>
                    )}
                  </article>
                ) : (
                  <>
                    {(summary?.headline || summary?.executiveSummary) && (
                      <div className="ai-research-exec">
                        {summary?.headline && (
                          <h2 className="ai-research-exec-headline">{summary.headline}</h2>
                        )}
                        {summary?.executiveSummary && (
                          <p className="ai-research-exec-body">{summary.executiveSummary}</p>
                        )}
                      </div>
                    )}
                    {!!summary?.keyFindings?.length && (
                      <div className="ai-research-exec-block">
                        <h3>Phát hiện chính</h3>
                        <ul>
                          {summary.keyFindings.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                <details className="ai-research-appendix">
                  <summary>Phụ lục — ma trận claim / evidence thô (audit)</summary>
                  <div className="ai-research-appendix-body">
                    {reportModules.map((module) => (
                      <div key={module} style={{ marginBottom: 18 }}>
                        <h4 style={{ margin: '0 0 6px', fontSize: 13, textTransform: 'capitalize' }}>
                          {module.replaceAll('_', ' ')}
                        </h4>
                        {activeJob.claims
                          .filter((claim) => claim.category === module)
                          .map((claim) => (
                            <article className="ai-research-claim" key={claim.claimId}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  justifyContent: 'space-between',
                                  gap: 12,
                                }}
                              >
                                <div style={{ fontSize: 13, lineHeight: 1.55 }}>{claim.text}</div>
                                <strong
                                  style={{
                                    color: 'var(--accent)',
                                    fontSize: 12,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {Math.round(claim.confidence * 100)}%
                                </strong>
                              </div>
                              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                                <span className={`ai-research-badge ${claim.status}`}>
                                  {claim.status}
                                </span>
                                <span className={`ai-research-badge ${claim.classification}`}>
                                  {claim.classification}
                                </span>
                              </div>
                              {claim.evidence.map((evidence) => (
                                <a
                                  key={evidence.evidenceId}
                                  className="ai-research-citation"
                                  href={evidence.url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <ExternalLink
                                    size={11}
                                    style={{ verticalAlign: '-1px', marginRight: 5 }}
                                  />
                                  {evidence.title} · {evidence.sourceDomain}
                                </a>
                              ))}
                            </article>
                          ))}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiResearchSection;
