import React from 'react';
import { CircleStop, Radio, Sparkles } from 'lucide-react';
import type {
  AiResearchJobDetail,
  AiResearchProgress,
  AiResearchTimelineItem,
} from '../../../../types/aiResearch.types';
import { statusLabel } from './aiResearchHelpers';

const phaseOrder = ['planning', 'researching', 'arbitrating', 'synthesizing'] as const;

interface AiResearchLiveProgressProps {
  activeJob: AiResearchJobDetail | null;
  isRunning: boolean;
  progress: AiResearchProgress | null;
  processedPercent: number;
  timeline: AiResearchTimelineItem[];
  timelineEndRef: React.RefObject<HTMLDivElement | null>;
  sseBadgeClass: string;
  sseLabel: string;
  onCancelJob: () => Promise<void>;
}

export const AiResearchLiveProgress: React.FC<AiResearchLiveProgressProps> = ({
  activeJob,
  isRunning,
  progress,
  processedPercent,
  timeline,
  timelineEndRef,
  sseBadgeClass,
  sseLabel,
  onCancelJob,
}) => {
  const activePhase = progress?.phase || activeJob?.status || '';
  const activePhaseIndex = phaseOrder.indexOf(
    (phaseOrder.includes(activePhase as (typeof phaseOrder)[number])
      ? activePhase
      : activeJob?.status === 'done'
        ? 'synthesizing'
        : 'planning') as (typeof phaseOrder)[number],
  );
  const budgetUsed = progress?.budgetUsed ?? activeJob?.budgetUsed ?? 0;
  const budgetCapValue = progress?.budgetCap ?? activeJob?.budgetCap ?? 30;
  const budgetPct = Math.min(100, Math.round((budgetUsed / Math.max(1, budgetCapValue)) * 100));

  return (
    <>
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
              onClick={() => void onCancelJob()}
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
    </>
  );
};
