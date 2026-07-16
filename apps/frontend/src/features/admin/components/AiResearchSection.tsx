import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  CircleStop,
  ExternalLink,
  Loader2,
  Play,
  RefreshCw,
} from 'lucide-react';
import { aiResearchApi } from '../../../api/aiResearchApi';
import type {
  AiResearchAnalysisType,
  AiResearchCity,
  AiResearchJobDetail,
  AiResearchJobSummary,
  AiResearchProgress,
  AiResearchRunMode,
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

const statusLabel = (status: string) => ({
  queued: 'Đang chờ',
  planning: 'Lập kế hoạch',
  researching: 'Research',
  arbitrating: 'Đối chiếu',
  synthesizing: 'Tổng hợp',
  done: 'Hoàn thành',
  failed: 'Thất bại',
  cancelled: 'Đã hủy',
}[status] || status);

const cityLabel = (city: AiResearchCity) => city === 'HCM' ? 'TPHCM' : 'Hà Nội';

const AiResearchSection = () => {
  const [city, setCity] = useState<AiResearchCity>('HCM');
  const [analysisType, setAnalysisType] = useState<AiResearchAnalysisType>('PricingAnalysis');
  const [runMode, setRunMode] = useState<AiResearchRunMode>('RunAll');
  const [selectedModules, setSelectedModules] = useState<string[]>(templates.PricingAnalysis.map(item => item.key));
  const [budgetCap, setBudgetCap] = useState(30);
  const [notes, setNotes] = useState('');
  const [jobs, setJobs] = useState<AiResearchJobSummary[]>([]);
  const [activeJob, setActiveJob] = useState<AiResearchJobDetail | null>(null);
  const [progress, setProgress] = useState<AiResearchProgress | null>(null);
  const [events, setEvents] = useState<Array<{ event: string; message: string }>>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [creating, setCreating] = useState(false);
  const streamAbortRef = useRef<AbortController | null>(null);

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
        resolvedClaims: detail.claims.filter(item => item.status === 'resolved').length,
        totalClaims: detail.claims.length,
        criticalResolved: detail.claims.filter(item => item.isCritical && item.status === 'resolved').length,
        criticalTotal: detail.claims.filter(item => item.isCritical).length,
        budgetUsed: detail.budgetUsed,
        budgetCap: detail.budgetCap,
        message: detail.errorMessage || statusLabel(detail.status),
      });
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Không tải được report.');
    }
  }, []);

  const streamJob = useCallback(async (jobId: string) => {
    streamAbortRef.current?.abort();
    const controller = new AbortController();
    streamAbortRef.current = controller;
    setEvents([]);
    try {
      await aiResearchApi.streamEvents(jobId, (event) => {
        setProgress(event.data);
        setEvents(current => [
          { event: event.event, message: event.data.message || statusLabel(event.event) },
          ...current,
        ].slice(0, 8));
        setActiveJob(current => current?.jobId === jobId
          ? { ...current, status: event.data.status, budgetUsed: event.data.budgetUsed }
          : current);
        if (terminalStatuses.has(event.event)) {
          void loadJob(jobId);
          void refreshJobs();
        }
      }, controller.signal);
    } catch (error) {
      if (!controller.signal.aborted) {
        showError(error instanceof Error ? error.message : 'Mất kết nối SSE.');
      }
    }
  }, [loadJob, refreshJobs]);

  useEffect(() => {
    void refreshJobs();
    return () => streamAbortRef.current?.abort();
  }, [refreshJobs]);

  useEffect(() => {
    setSelectedModules(templates[analysisType].map(item => item.key));
    setBudgetCap(runMode === 'RunAll' ? 50 : 30);
  }, [analysisType, runMode]);

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
        selectedModules: runMode === 'RunAll' ? modules.map(item => item.key) : selectedModules,
        budgetCap,
        notes,
      });
      setJobs(current => [job, ...current]);
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
        message: 'Job đã vào hàng đợi',
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
    () => Array.from(new Set(activeJob?.claims.map(claim => claim.category) || [])),
    [activeJob],
  );

  return (
    <div className="ai-research-page animate-in">
      <header className="ai-research-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: 'var(--accent)', marginBottom: 7 }}>
            <Bot size={18} />
            <span style={{ fontSize: 11, fontWeight: 850, textTransform: 'uppercase' }}>Business Research Multi-Agent</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.15 }}>AI Research Workspace</h1>
          <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
            Research giá, đối thủ, quy hoạch và chi phí mặt bằng với citation theo từng claim.
          </p>
        </div>
        <button className="ai-research-secondary" onClick={() => void refreshJobs()} disabled={loadingJobs}>
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
                  <select className="ai-research-select" value={city} onChange={event => setCity(event.target.value as AiResearchCity)}>
                    <option value="HCM">TPHCM</option>
                    <option value="HN">Hà Nội</option>
                  </select>
                </label>

                <label className="ai-research-field">
                  <span className="ai-research-label">Loại phân tích</span>
                  <select
                    className="ai-research-select"
                    value={analysisType}
                    onChange={event => setAnalysisType(event.target.value as AiResearchAnalysisType)}
                  >
                    <option value="PricingAnalysis">Pricing Analysis</option>
                    <option value="SiteLocationFeasibility">Site/Location Feasibility</option>
                  </select>
                </label>

                <div className="ai-research-field">
                  <span className="ai-research-label">Chế độ chạy</span>
                  <div className="ai-research-segmented">
                    <button className={runMode === 'RunAll' ? 'active' : ''} onClick={() => setRunMode('RunAll')}>Chạy tất cả</button>
                    <button className={runMode === 'SelectedModules' ? 'active' : ''} onClick={() => setRunMode('SelectedModules')}>Chọn module</button>
                  </div>
                </div>

                <div className="ai-research-field">
                  <span className="ai-research-label">Modules</span>
                  <div className="ai-research-modules">
                    {modules.map(module => {
                      const checked = runMode === 'RunAll' || selectedModules.includes(module.key);
                      return (
                        <label key={module.key} className={`ai-research-module ${runMode === 'RunAll' ? 'disabled' : ''}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={runMode === 'RunAll'}
                            onChange={() => setSelectedModules(current =>
                              current.includes(module.key)
                                ? current.filter(key => key !== module.key)
                                : [...current, module.key],
                            )}
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
                    onChange={event => setBudgetCap(Number(event.target.value))}
                  />
                </label>

                <label className="ai-research-field">
                  <span className="ai-research-label">Ghi chú</span>
                  <textarea
                    className="ai-research-textarea"
                    rows={3}
                    value={notes}
                    onChange={event => setNotes(event.target.value)}
                    placeholder="Ví dụ: ưu tiên khu Đông TPHCM hoặc khung giờ cuối tuần"
                  />
                </label>

                <button className="ai-research-primary" onClick={() => void createJob()} disabled={creating || isRunning}>
                  {creating ? <Loader2 size={17} className="spin" /> : <Play size={17} fill="currentColor" />}
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
                <div className="ai-research-panel-body" style={{ color: 'var(--text-muted)' }}>Chưa có research job.</div>
              )}
              {jobs.map(job => (
                <button
                  key={job.jobId}
                  className={`ai-research-history-item ${activeJob?.jobId === job.jobId ? 'active' : ''}`}
                  onClick={() => {
                    streamAbortRef.current?.abort();
                    void loadJob(job.jobId);
                    if (!terminalStatuses.has(job.status)) void streamJob(job.jobId);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong style={{ fontSize: 12 }}>{job.analysisType === 'PricingAnalysis' ? 'Pricing' : 'Site/Location'} · {cityLabel(job.city)}</strong>
                    <span className={`ai-research-badge ${job.status}`}>{statusLabel(job.status)}</span>
                  </div>
                  <div style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 11 }}>
                    {new Date(job.createdAt).toLocaleString('vi-VN')} · {job.budgetUsed}/{job.budgetCap} calls
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
              <div style={{ display: 'flex', gap: 8 }}>
                {activeJob && <span className={`ai-research-badge ${activeJob.status}`}>{statusLabel(activeJob.status)}</span>}
                {isRunning && (
                  <button className="ai-research-secondary" style={{ minHeight: 30, padding: '4px 9px' }} onClick={() => void cancelJob()}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 9 }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{progress?.message || statusLabel(activeJob.status)}</span>
                    <strong style={{ color: 'var(--accent)' }}>{processedPercent}%</strong>
                  </div>
                  <div className="ai-research-progress-track">
                    <div className="ai-research-progress-fill" style={{ width: `${processedPercent}%` }} />
                  </div>
                  <div className="ai-research-metrics">
                    <div className="ai-research-metric"><small>Claims</small><strong>{progress?.resolvedClaims || 0}/{progress?.totalClaims || 0}</strong></div>
                    <div className="ai-research-metric"><small>Critical</small><strong>{progress?.criticalResolved || 0}/{progress?.criticalTotal || 0}</strong></div>
                    <div className="ai-research-metric"><small>Budget</small><strong>{progress?.budgetUsed || activeJob.budgetUsed}/{activeJob.budgetCap}</strong></div>
                    <div className="ai-research-metric"><small>Module</small><strong>{progress?.currentModule || '-'}</strong></div>
                  </div>
                  {events.length > 0 && (
                    <div style={{ marginTop: 14, display: 'grid', gap: 7 }}>
                      {events.map((event, index) => (
                        <div key={`${event.event}-${index}`} style={{ display: 'grid', gridTemplateColumns: '105px 1fr', gap: 10, fontSize: 11 }}>
                          <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{statusLabel(event.event)}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{event.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {activeJob?.report && (
            <section className="ai-research-panel">
              <div className="ai-research-panel-header">
                <div>
                  <strong>Research report</strong>
                  <div style={{ marginTop: 3, color: 'var(--text-muted)', fontSize: 11 }}>
                    {cityLabel(activeJob.city)} · {new Date(activeJob.report.generatedAt).toLocaleString('vi-VN')}
                  </div>
                </div>
                <CheckCircle2 size={20} style={{ color: '#4ade80' }} />
              </div>
              <div className="ai-research-panel-body">
                <div className="ai-research-metrics" style={{ marginTop: 0, marginBottom: 18 }}>
                  <div className="ai-research-metric"><small>Tổng claim</small><strong>{summary?.totalClaims || activeJob.claims.length}</strong></div>
                  <div className="ai-research-metric"><small>Resolved</small><strong>{summary?.resolvedClaims || 0}</strong></div>
                  <div className="ai-research-metric"><small>Insufficient</small><strong>{summary?.insufficientClaims || 0}</strong></div>
                  <div className="ai-research-metric"><small>Conflicting</small><strong>{summary?.conflictingClaims || 0}</strong></div>
                </div>

                {reportModules.map(module => (
                  <div key={module} style={{ marginBottom: 20 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: 15, textTransform: 'capitalize' }}>{module.replaceAll('_', ' ')}</h3>
                    {activeJob.claims.filter(claim => claim.category === module).map(claim => (
                      <article className="ai-research-claim" key={claim.claimId}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ fontSize: 13, lineHeight: 1.55 }}>{claim.text}</div>
                          <strong style={{ color: 'var(--accent)', fontSize: 12, whiteSpace: 'nowrap' }}>
                            {Math.round(claim.confidence * 100)}%
                          </strong>
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                          <span className={`ai-research-badge ${claim.status}`}>{claim.status}</span>
                          <span className={`ai-research-badge ${claim.classification}`}>{claim.classification}</span>
                          {claim.isCritical && <span className="ai-research-badge">critical</span>}
                        </div>
                        {claim.evidence.map(evidence => (
                          <a
                            key={evidence.evidenceId}
                            className="ai-research-citation"
                            href={evidence.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink size={11} style={{ verticalAlign: '-1px', marginRight: 5 }} />
                            {evidence.title} · {evidence.sourceDomain}
                          </a>
                        ))}
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiResearchSection;
