import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, RefreshCw } from 'lucide-react';
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
import {
  mergeProgress,
  normalizeReferences,
  statusLabel,
  templates,
  terminalStatuses,
} from './ai/aiResearchHelpers';
import { AiResearchFormPanel } from './ai/AiResearchFormPanel';
import { AiResearchLiveProgress } from './ai/AiResearchLiveProgress';
import { AiResearchReportViewer } from './ai/AiResearchReportViewer';
import './AiResearchSection.css';

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
  const [sseState, setSseState] = useState<
    'idle' | 'connecting' | 'live' | 'reconnecting' | 'degraded' | 'completed' | 'failed'
  >('idle');
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
              if (numericEventId <= lastEventIdRef.current || seenEventIdsRef.current.has(numericEventId))
                return;
              lastEventIdRef.current = numericEventId;
              seenEventIdsRef.current.add(numericEventId);
            }
            setSseState(
              ['done', 'failed', 'cancelled'].includes(event.event)
                ? event.event === 'done'
                  ? 'completed'
                  : 'failed'
                : 'live',
            );
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
          () =>
            setSseState((current) =>
              current === 'connecting' || current === 'reconnecting' ? 'live' : current,
            ),
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

  // Lightweight status polling while a job is running
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
    document
      .getElementById(`ai-research-reference-${referenceId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

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
        <AiResearchFormPanel
          city={city}
          setCity={setCity}
          analysisType={analysisType}
          setAnalysisType={setAnalysisType}
          runMode={runMode}
          setRunMode={setRunMode}
          selectedModules={selectedModules}
          setSelectedModules={setSelectedModules}
          budgetCap={budgetCap}
          setBudgetCap={setBudgetCap}
          notes={notes}
          setNotes={setNotes}
          modules={modules}
          jobs={jobs}
          activeJob={activeJob}
          loadingJobs={loadingJobs}
          creating={creating}
          isRunning={isRunning}
          onCreateJob={createJob}
          onSelectJob={(job) => {
            streamAbortRef.current?.abort();
            void loadJob(job.jobId);
            if (!terminalStatuses.has(job.status)) void streamJob(job.jobId);
            else {
              setTimeline([]);
              setSseState('idle');
            }
          }}
        />

        {/* RIGHT: realtime cockpit */}
        <div className="ai-research-col-right">
          <AiResearchLiveProgress
            activeJob={activeJob}
            isRunning={isRunning}
            progress={progress}
            processedPercent={processedPercent}
            timeline={timeline}
            timelineEndRef={timelineEndRef}
            sseBadgeClass={sseBadgeClass}
            sseLabel={sseLabel}
            onCancelJob={cancelJob}
          />

          {activeJob && (
            <AiResearchReportViewer
              activeJob={activeJob}
              numberedReferences={numberedReferences}
              scrollToReference={scrollToReference}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AiResearchSection;
