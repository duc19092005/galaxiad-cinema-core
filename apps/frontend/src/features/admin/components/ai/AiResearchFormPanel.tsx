import React from 'react';
import { Loader2, Play } from 'lucide-react';
import type {
  AiResearchAnalysisType,
  AiResearchCity,
  AiResearchJobDetail,
  AiResearchJobSummary,
  AiResearchRunMode,
} from '../../../../types/aiResearch.types';
import { cityLabel, statusLabel } from './aiResearchHelpers';

interface AiResearchFormPanelProps {
  city: AiResearchCity;
  setCity: (city: AiResearchCity) => void;
  analysisType: AiResearchAnalysisType;
  setAnalysisType: (type: AiResearchAnalysisType) => void;
  runMode: AiResearchRunMode;
  setRunMode: (mode: AiResearchRunMode) => void;
  selectedModules: string[];
  setSelectedModules: React.Dispatch<React.SetStateAction<string[]>>;
  budgetCap: number;
  setBudgetCap: (budget: number) => void;
  notes: string;
  setNotes: (notes: string) => void;
  modules: Array<{ key: string; label: string; critical: boolean }>;
  jobs: AiResearchJobSummary[];
  activeJob: AiResearchJobDetail | null;
  loadingJobs: boolean;
  creating: boolean;
  isRunning: boolean;
  onCreateJob: () => Promise<void>;
  onSelectJob: (job: AiResearchJobSummary) => void;
}

export const AiResearchFormPanel: React.FC<AiResearchFormPanelProps> = ({
  city,
  setCity,
  analysisType,
  setAnalysisType,
  runMode,
  setRunMode,
  selectedModules,
  setSelectedModules,
  budgetCap,
  setBudgetCap,
  notes,
  setNotes,
  modules,
  jobs,
  activeJob,
  loadingJobs,
  creating,
  isRunning,
  onCreateJob,
  onSelectJob,
}) => {
  return (
    <aside className="ai-research-col-left">
      {/* Config Panel */}
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
              onClick={() => void onCreateJob()}
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

      {/* History Panel */}
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
              onClick={() => onSelectJob(job)}
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
  );
};
