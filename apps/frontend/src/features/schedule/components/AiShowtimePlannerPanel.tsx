import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Sparkles,
  ThumbsDown,
  TrendingUp,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { scheduleApi } from '../../../api/scheduleApi';
import type {
  ApplyShowtimeRecommendationsResponse,
  ShowtimeRecommendationBatch,
  ShowtimeRecommendationItem,
  ShowtimeRecommendationPreview,
} from '../../../types/schedule.types';
import type { Auditorium } from '../types';
import { showError, showSuccess } from '../../../utils/ToastUtils';

interface AiShowtimePlannerPanelProps {
  open: boolean;
  cinemaId: string | null;
  auditoriums: Auditorium[];
  selectedAuditoriumId: string;
  onClose: () => void;
  onApplied: () => void;
  isEmbedded?: boolean;
}

type Step = 'configure' | 'review' | 'confirm';

const PAGE_SIZE = 5;

const toDateInput = (date: Date) => date.toISOString().slice(0, 10);

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const demandConfig = {
  High:   { color: '#22c55e', bg: 'rgba(34,197,94,0.18)',   label: 'High',   icon: '🟢' },
  Low:    { color: '#f97316', bg: 'rgba(249,115,22,0.18)',  label: 'Low',    icon: '🔴' },
  Medium: { color: '#eab308', bg: 'rgba(234,179,8,0.18)',   label: 'Medium', icon: '🟡' },
};
const getDemand = (level: string) =>
  demandConfig[level as keyof typeof demandConfig] ?? demandConfig.Medium;

// ─── Step indicator ──────────────────────────────────────────────────────────
const STEPS = [
  { key: 'configure', label: 'Configure' },
  { key: 'review',    label: 'Review' },
  { key: 'confirm',   label: 'Confirm' },
] as const;

function StepIndicator({ current }: { current: Step }) {
  const idx = STEPS.findIndex(s => s.key === current);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '12px 20px', borderBottom: '1px solid var(--border-color)' }}>
      {STEPS.map((step, i) => {
        const done    = i < idx;
        const active  = i === idx;
        const future  = i > idx;
        return (
          <React.Fragment key={step.key}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700,
                transition: 'all 0.3s',
                background: done ? 'var(--accent)' : active ? 'var(--accent)' : 'var(--bg-elevated)',
                color: done || active ? '#000' : '#9ca3af',
                border: future ? '1px solid var(--border-color)' : 'none',
                boxShadow: active ? '0 0 0 3px rgba(255,138,0,0.25)' : 'none',
              }}>
                {done ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
                color: active ? 'var(--accent)' : done ? '#d1d5db' : '#6b7280',
                textTransform: 'uppercase', whiteSpace: 'nowrap',
              }}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 1, margin: '0 6px', marginBottom: 20,
                background: done ? 'var(--accent)' : 'var(--border-color)',
                transition: 'background 0.4s',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Strategy Selector (Static Info List) ────────────────────────────────────
function StrategySelector() {
  const strategies = [
    { label: 'Peak Hours Analysis', desc: 'Analyzes prime times like weekends & evenings to maximize audience reach.' },
    { label: 'Demand-Based Scheduling', desc: 'Utilizes historical ticket sales data to predict high-demand slots.' },
    { label: 'Room Fit Optimization', desc: 'Matches movie genres and formats with the optimal screen size & hardware.' },
  ];

  return (
    <div style={{ display: 'grid', gap: 8, borderTop: '1px dashed var(--border-color)', paddingTop: 16, marginTop: 4 }}>
      <span style={fieldLabel}>AI Planning Factors</span>
      <div style={{ display: 'grid', gap: 8 }}>
        {strategies.map((s, index) => {
          return (
            <div
              key={index}
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#ffffff',
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#d1d5db',
                  marginTop: 4,
                  lineHeight: 1.4,
                }}
              >
                {s.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Skeleton card ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ borderRadius: 12, border: '1px solid var(--border-color)', padding: 16, display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div className="skeleton-shimmer" style={{ width: 4, alignSelf: 'stretch', borderRadius: 2 }} />
        <div style={{ flex: 1, display: 'grid', gap: 8 }}>
          <div className="skeleton-shimmer" style={{ height: 14, width: '70%', borderRadius: 6 }} />
          <div className="skeleton-shimmer" style={{ height: 11, width: '45%', borderRadius: 6 }} />
        </div>
        <div className="skeleton-shimmer" style={{ width: 44, height: 24, borderRadius: 20 }} />
      </div>
      <div className="skeleton-shimmer" style={{ height: 4, borderRadius: 4 }} />
    </div>
  );
}

// ─── Recommendation card ─────────────────────────────────────────────────────
function RecommendationCard({
  item,
  selected,
  onToggle,
  onDismiss,
  dismissing,
}: {
  item: ShowtimeRecommendationItem;
  selected: boolean;
  onToggle: () => void;
  onDismiss: () => void;
  dismissing: boolean;
}) {
  const demand = getDemand(item.demandLevel);
  const confidence = Math.round(item.confidenceScore);

  return (
    <article
      onClick={onToggle}
      style={{
        borderRadius: 12,
        border: `1px solid ${selected ? 'rgba(255,138,0,0.4)' : 'var(--border-color)'}`,
        background: selected
          ? 'linear-gradient(135deg, rgba(255,138,0,0.08) 0%, rgba(255,138,0,0.03) 100%)'
          : 'var(--bg-elevated)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'grid',
        overflow: 'hidden',
        boxShadow: selected ? '0 0 0 1px rgba(255,138,0,0.2), 0 4px 12px rgba(0,0,0,0.15)' : 'none',
      }}
    >
      {/* Accent stripe */}
      <div style={{ display: 'flex', gap: 0 }}>
        <div style={{ width: 4, background: selected ? 'var(--accent)' : demand.color, transition: 'background 0.2s', flexShrink: 0 }} />
        <div style={{ flex: 1, padding: '12px 12px 12px 10px', display: 'grid', gap: 8 }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            {/* Custom checkbox */}
            <div
              style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
                border: `2px solid ${selected ? 'var(--accent)' : 'rgba(255,255,255,0.3)'}`,
                background: selected ? 'var(--accent)' : 'transparent',
                display: 'grid', placeItems: 'center',
                transition: 'all 0.15s',
              }}
              onClick={e => { e.stopPropagation(); onToggle(); }}
            >
              {selected && <CheckCircle2 size={10} color="#000" strokeWidth={3} />}
            </div>

            {/* Movie info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{
                margin: 0, fontSize: 13, fontWeight: 700,
                color: '#ffffff', lineHeight: 1.35,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{item.movieName}</h4>
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 5, color: '#d1d5db', fontSize: 11 }}>
                <Clock3 size={11} />
                <span>{formatDateTime(item.startTime)}</span>
              </div>
            </div>

            {/* Demand badge */}
            <span style={{
              flexShrink: 0, fontSize: 10, fontWeight: 700,
              padding: '3px 8px', borderRadius: 20,
              background: demand.bg, color: demand.color,
              border: `1px solid ${demand.color}40`,
              letterSpacing: '0.03em',
            }}>
              {demand.icon} {demand.label}
            </span>
          </div>

          {/* Confidence bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                AI Confidence
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: confidence >= 70 ? '#22c55e' : confidence >= 40 ? '#eab308' : '#f97316' }}>
                {confidence}%
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 4, background: 'var(--bg-hover)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                width: `${confidence}%`,
                background: confidence >= 70
                  ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                  : confidence >= 40
                  ? 'linear-gradient(90deg, #ca8a04, #eab308)'
                  : 'linear-gradient(90deg, #ea580c, #f97316)',
                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              }} />
            </div>
          </div>

          {/* Meta pills row */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={pillStyle}>🏛 Aud. {item.auditoriumNumber}</span>
            {item.formatName && item.formatName !== 'Default' && (
              <span style={pillStyle}>{item.formatName}</span>
            )}
            <button
              onClick={e => { e.stopPropagation(); onDismiss(); }}
              disabled={dismissing}
              style={{
                marginLeft: 'auto', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4,
                borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)',
                background: 'transparent', color: '#9ca3af', fontSize: 10, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              aria-label="Dismiss"
            >
              <ThumbsDown size={10} />
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Pagination controls ─────────────────────────────────────────────────────
function PaginationBar({
  page,
  totalPages,
  total,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to   = Math.min(page * PAGE_SIZE, total);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 20px',
      borderTop: '1px solid var(--border-color)',
      background: 'var(--bg-elevated)',
      flexShrink: 0,
    }}>
      <button
        onClick={onPrev}
        disabled={page === 1}
        style={paginationBtn(page === 1)}
        aria-label="Previous page"
      >
        <ChevronLeft size={15} />
        <span>Prev</span>
      </button>

      <span style={{ fontSize: 11, color: '#d1d5db', fontWeight: 600 }}>
        {from}–{to} <span style={{ color: '#6b7280' }}>of</span> {total}
      </span>

      <button
        onClick={onNext}
        disabled={page === totalPages}
        style={paginationBtn(page === totalPages)}
        aria-label="Next page"
      >
        <span>Next</span>
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

const paginationBtn = (disabled: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '5px 10px', borderRadius: 8,
  background: disabled ? 'transparent' : 'rgba(255,255,255,0.06)',
  border: `1px solid ${disabled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.18)'}`,
  color: disabled ? '#4b5563' : '#e5e7eb',
  fontSize: 12, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.15s',
});

// ─── Main component ───────────────────────────────────────────────────────────
const AiShowtimePlannerPanel: React.FC<AiShowtimePlannerPanelProps> = ({
  open,
  cinemaId,
  auditoriums,
  selectedAuditoriumId,
  onClose,
  onApplied,
  isEmbedded = false,
}) => {
  const tomorrow = useMemo(() => {
    const value = new Date();
    value.setDate(value.getDate() + 1);
    return value;
  }, []);
  const weekEnd = useMemo(() => {
    const value = new Date(tomorrow);
    value.setDate(value.getDate() + 6);
    return value;
  }, [tomorrow]);

  const [step, setStep] = useState<Step>('configure');
  const [stepDir, setStepDir] = useState<'forward' | 'backward'>('forward');

  const [fromDate, setFromDate] = useState(toDateInput(tomorrow));
  const [toDate, setToDate] = useState(toDateInput(weekEnd));
  const [auditoriumId, setAuditoriumId] = useState<string>(selectedAuditoriumId || '');
  const [maxSuggestions, setMaxSuggestions] = useState(10);

  // Pagination state
  const [reviewPage, setReviewPage] = useState(1);

  const [batch, setBatch] = useState<ShowtimeRecommendationBatch | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<ShowtimeRecommendationPreview | null>(null);

  const [loadingAction, setLoadingAction] = useState<'generate' | 'preview' | 'apply' | 'dismiss' | null>(null);

  const recommendations = batch?.recommendations?.filter(item => item.status === 'Suggested') || [];
  const allSelected = recommendations.length > 0 && recommendations.every(item => selectedIds.has(item.recommendationId));
  const selectedArray = Array.from(selectedIds);
  const selectedCount = selectedArray.filter(id => recommendations.some(r => r.recommendationId === id)).length;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(recommendations.length / PAGE_SIZE));
  const safePage   = Math.min(reviewPage, totalPages);
  const pageItems  = recommendations.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Demand summary
  const demandSummary = recommendations.reduce((acc, r) => {
    acc[r.demandLevel] = (acc[r.demandLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const goStep = (next: Step, dir: 'forward' | 'backward') => {
    setStepDir(dir);
    setStep(next);
  };

  const toggleSelected = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(recommendations.map(r => r.recommendationId)));
  };

  const handleGenerate = async () => {
    if (!cinemaId) {
      showError('Please select a cinema before generating recommendations.');
      return;
    }
    setLoadingAction('generate');
    setPreview(null);
    setBatch(null);
    setReviewPage(1);
    try {
      const response = await scheduleApi.generateRecommendations({
        cinemaId,
        fromDate,
        toDate,
        auditoriumId: auditoriumId || null,
        maxSuggestions,
      });
      setBatch(response.data || null);
      setSelectedIds(new Set((response.data?.recommendations || []).map(r => r.recommendationId)));
      showSuccess(response.message || 'Showtime recommendations generated.');
      goStep('review', 'forward');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Could not generate showtime recommendations.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePreviewAndConfirm = async () => {
    const ids = selectedCount > 0 ? selectedArray.filter(id => recommendations.some(r => r.recommendationId === id)) : recommendations.map(r => r.recommendationId);
    if (!batch || ids.length === 0) {
      showError('Select at least one recommendation to apply.');
      return;
    }
    setLoadingAction('preview');
    try {
      const response = await scheduleApi.previewRecommendations({
        batchId: batch.batchId,
        recommendationIds: ids,
      });
      setPreview(response.data || null);
      goStep('confirm', 'forward');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Could not preview recommendations.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleApply = async () => {
    if (!batch || !preview) return;
    const ids = preview.validSuggestions.map(s => s.recommendationId);
    if (ids.length === 0) return;

    setLoadingAction('apply');
    try {
      const response = await scheduleApi.applyRecommendations({
        batchId: batch.batchId,
        recommendationIds: ids,
        applyValidOnly: true,
      });
      const data: ApplyShowtimeRecommendationsResponse | undefined = response.data;
      showSuccess(`✅ ${data?.applied?.length || 0} showtime(s) applied successfully!`);
      setBatch(null);
      setSelectedIds(new Set());
      setPreview(null);
      setReviewPage(1);
      goStep('configure', 'backward');
      onApplied();
    } catch (error: any) {
      showError(error.response?.data?.message || 'Could not apply recommendations.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDismiss = async (item: ShowtimeRecommendationItem) => {
    setLoadingAction('dismiss');
    try {
      await scheduleApi.dismissRecommendation(item.recommendationId);
      setBatch(prev => prev ? {
        ...prev,
        recommendations: prev.recommendations.filter(r => r.recommendationId !== item.recommendationId),
      } : prev);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(item.recommendationId);
        return next;
      });
      // Adjust page if current page becomes empty
      setReviewPage(prev => {
        const newTotal = Math.max(1, Math.ceil((recommendations.length - 1) / PAGE_SIZE));
        return Math.min(prev, newTotal);
      });
    } catch (error: any) {
      showError(error.response?.data?.message || 'Could not dismiss recommendation.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!open) return null;

  const stepClass = stepDir === 'forward' ? 'step-forward' : 'step-backward';

  return (
    // Outer wrapper: scrollable column, does NOT stretch to full height
    <div
      style={{
        width: 360,
        flexShrink: 0,
        alignSelf: 'flex-start',
        overflowY: 'auto',
        maxHeight: '100%',
      }}
    >
    <aside
      className={isEmbedded ? "glass-card animate-in" : ""}
      style={{
        background: isEmbedded ? undefined : 'var(--bg-surface)',
        borderLeft: isEmbedded ? undefined : '1px solid var(--border-color)',
        borderRight: isEmbedded ? undefined : '1px solid var(--border-color)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* ── Header ── */}
      <div style={{
        padding: '12px 16px',
        background: 'linear-gradient(135deg, rgba(255,138,0,0.10) 0%, transparent 60%)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(255,138,0,0.28), rgba(255,138,0,0.08))',
          border: '1px solid rgba(255,138,0,0.3)',
          display: 'grid', placeItems: 'center', color: 'var(--accent)',
        }}>
          <Bot size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
            AI Showtime Planner
          </h3>
          <p style={{ margin: '1px 0 0', fontSize: 10, color: '#9ca3af' }}>
            Powered by demand-based optimisation
          </p>
        </div>
          <button
            className="btn-ghost"
            onClick={handleClose}
            style={{ padding: 8, borderRadius: 8 }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Step indicator ── */}
        <StepIndicator current={step} />

        {/* ── Step Content ── */}
        <div key={step} className={stepClass} style={{ display: 'flex', flexDirection: 'column' }}>

          {/* ════ STEP 1: CONFIGURE ════ */}
          {step === 'configure' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Form area */}
              <div style={{ padding: '16px 20px 12px', display: 'grid', gap: 14 }}>
                {/* Date range */}
                <div>
                  <label style={sectionLabel}>Date Range</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                    <div style={fieldWrap}>
                      <span style={fieldLabel}>From</span>
                      <input
                        className="input"
                        type="date"
                        value={fromDate}
                        onChange={e => setFromDate(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div style={fieldWrap}>
                      <span style={fieldLabel}>To</span>
                      <input
                        className="input"
                        type="date"
                        value={toDate}
                        onChange={e => setToDate(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>

                {/* Auditorium */}
                <div style={fieldWrap}>
                  <span style={fieldLabel}>Auditorium</span>
                  <select
                    className="input"
                    value={auditoriumId}
                    onChange={e => setAuditoriumId(e.target.value)}
                    style={{ ...inputStyle, marginTop: 6 }}
                  >
                    <option value="">All auditoriums</option>
                    {auditoriums.map(a => (
                      <option key={a.id} value={a.id}>Auditorium {a.name}</option>
                    ))}
                  </select>
                </div>

                {/* Suggestions stepper */}
                <div>
                  <span style={fieldLabel}>Max Suggestions</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                    <button
                      style={stepperBtn}
                      onClick={() => setMaxSuggestions(v => Math.max(1, v - 1))}
                    >−</button>
                    <div style={{
                      flex: 1, textAlign: 'center', fontWeight: 800, fontSize: 24,
                      color: 'var(--accent)', fontVariantNumeric: 'tabular-nums',
                    }}>{maxSuggestions}</div>
                    <button
                      style={stepperBtn}
                      onClick={() => setMaxSuggestions(v => Math.min(20, v + 1))}
                    >+</button>
                  </div>
                  {/* Slider */}
                  <input
                    type="range" min={1} max={20}
                    value={maxSuggestions}
                    onChange={e => setMaxSuggestions(Number(e.target.value))}
                    style={{ width: '100%', marginTop: 6, accentColor: 'var(--accent)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6b7280', marginTop: 2 }}>
                    <span>1</span><span>20</span>
                  </div>
                </div>

                {/* Empty state / info */}
                <StrategySelector />
              </div>

              {/* Generate button — always visible at bottom */}
              <div style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--border-color)',
                flexShrink: 0,
                background: 'var(--bg-surface)',
              }}>
                <button
                  className="btn btn-primary"
                  onClick={handleGenerate}
                  disabled={loadingAction === 'generate'}
                  style={{
                    width: '100%', height: 46, fontSize: 14, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    borderRadius: 12,
                  }}
                >
                  {loadingAction === 'generate'
                    ? <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Generating…</>
                    : <><Sparkles size={18} /> Generate Recommendations</>
                  }
                </button>
              </div>
            </div>
          )}

          {/* ════ STEP 2: REVIEW ════ */}
          {step === 'review' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Summary bar */}
              <div style={{
                padding: '10px 16px',
                display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                borderBottom: '1px solid var(--border-color)', flexShrink: 0,
                background: 'var(--bg-elevated)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TrendingUp size={14} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                    {recommendations.length} suggestions
                  </span>
                </div>
                {Object.entries(demandSummary).map(([level, count]) => {
                  const d = getDemand(level);
                  return (
                    <span key={level} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: d.bg, color: d.color, fontWeight: 700 }}>
                      {d.icon} {count} {level}
                    </span>
                  );
                })}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  <button
                    style={{ ...ghostSmall, color: allSelected ? 'var(--accent)' : '#d1d5db' }}
                    onClick={handleSelectAll}
                    disabled={recommendations.length === 0}
                  >
                    {allSelected ? 'Clear all' : 'Select all'}
                  </button>
                </div>
              </div>

              {/* Cards list — paginated, 5 per page (no scroll, height driven by content) */}
              <div style={{ padding: '12px 16px', display: 'grid', gap: 8 }}>
                {loadingAction === 'generate' && [1,2,3].map(i => <SkeletonCard key={i} />)}
                {recommendations.length === 0 && loadingAction !== 'generate' && (
                  <div style={{
                    border: '1px dashed var(--border-color)', borderRadius: 12,
                    padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 13,
                  }}>
                    All recommendations have been dismissed or applied.
                  </div>
                )}
                {pageItems.map(item => (
                  <RecommendationCard
                    key={item.recommendationId}
                    item={item}
                    selected={selectedIds.has(item.recommendationId)}
                    onToggle={() => toggleSelected(item.recommendationId)}
                    onDismiss={() => handleDismiss(item)}
                    dismissing={loadingAction === 'dismiss'}
                  />
                ))}
              </div>

              {/* Pagination bar */}
              <PaginationBar
                page={safePage}
                totalPages={totalPages}
                total={recommendations.length}
                onPrev={() => setReviewPage(p => Math.max(1, p - 1))}
                onNext={() => setReviewPage(p => Math.min(totalPages, p + 1))}
              />

              {/* Action bar */}
              <div style={{
                padding: '12px 16px', borderTop: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'var(--bg-elevated)',
              }}>
                <button
                  style={ghostSmall}
                  onClick={() => goStep('configure', 'backward')}
                >
                  <ArrowLeft size={13} /> Configure
                </button>
                <div style={{ flex: 1, fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
                  {selectedCount > 0 ? (
                    <span><strong style={{ color: '#ffffff' }}>{selectedCount}</strong> selected</span>
                  ) : 'None selected'}
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handlePreviewAndConfirm}
                  disabled={loadingAction === 'preview' || recommendations.length === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10, fontWeight: 700, fontSize: 13 }}
                >
                  {loadingAction === 'preview'
                    ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Checking…</>
                    : <><Zap size={14} /> Apply {selectedCount > 0 ? selectedCount : 'All'} &rarr;</>
                  }
                </button>
              </div>
            </div>
          )}

          {/* ════ STEP 3: CONFIRM ════ */}
          {step === 'confirm' && preview && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Summary */}
              <div style={{
                padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
                display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap',
                background: 'var(--bg-elevated)',
              }}>
                <div style={summaryBadge('#22c55e', 'rgba(34,197,94,0.12)')}>
                  <CheckCircle2 size={14} />
                  <span>{preview.validSuggestions.length} valid</span>
                </div>
                <div style={summaryBadge('#ef4444', 'rgba(239,68,68,0.12)')}>
                  <XCircle size={14} />
                  <span>{preview.invalidSuggestions.length} blocked</span>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', alignSelf: 'center' }}>
                  Only valid showtimes will be scheduled.
                </p>
              </div>

              {/* Lists */}
              <div style={{ padding: '14px 16px', display: 'grid', gap: 8 }}>
                {/* Valid */}
                {preview.validSuggestions.length > 0 && (
                  <>
                    <div style={sectionDivider}>
                      <CheckCircle2 size={12} color="#22c55e" />
                      <span style={{ color: '#22c55e' }}>Valid — will be applied</span>
                    </div>
                    {preview.validSuggestions.map(item => (
                      <ConfirmItem key={item.recommendationId} item={item} valid />
                    ))}
                  </>
                )}

                {/* Blocked */}
                {preview.invalidSuggestions.length > 0 && (
                  <>
                    <div style={{ ...sectionDivider, marginTop: 8 }}>
                      <XCircle size={12} color="#ef4444" />
                      <span style={{ color: '#ef4444' }}>Blocked — conflicts detected</span>
                    </div>
                    {preview.invalidSuggestions.map(item => (
                      <ConfirmItem key={item.recommendationId} item={item} valid={false} />
                    ))}
                  </>
                )}
              </div>

              {/* Footer actions */}
              <div style={{
                padding: '12px 16px', borderTop: '1px solid var(--border-color)',
                display: 'flex', gap: 10,
                background: 'var(--bg-elevated)',
              }}>
                <button
                  style={ghostSmall}
                  onClick={() => goStep('review', 'backward')}
                  disabled={loadingAction === 'apply'}
                >
                  <ArrowLeft size={13} /> Back
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleApply}
                  disabled={preview.validSuggestions.length === 0 || loadingAction === 'apply'}
                  style={{
                    flex: 1, height: 44, borderRadius: 12, fontWeight: 700, fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {loadingAction === 'apply'
                    ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Applying…</>
                    : <><CheckCircle2 size={16} /> Apply {preview.validSuggestions.length} Showtime{preview.validSuggestions.length !== 1 ? 's' : ''}</>
                  }
                </button>
              </div>
            </div>
          )}

          {/* Confirm but no preview yet */}
          {step === 'confirm' && !preview && (
            <div style={{ padding: '40px 16px', display: 'grid', placeItems: 'center' }}>
              <Loader2 size={32} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--accent)' }} />
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

// ─── Confirm item ─────────────────────────────────────────────────────────────
function ConfirmItem({ item, valid }: { item: { recommendationId: string; movieName: string; auditoriumNumber: number | string; startTime: string; reasons: string[] }; valid: boolean }) {
  return (
    <div style={{
      borderRadius: 10,
      border: `1px solid ${valid ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
      background: valid ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
      padding: '10px 14px',
      display: 'grid', gap: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <strong style={{ fontSize: 13, color: '#ffffff', fontWeight: 700 }}>{item.movieName}</strong>
          <div style={{ fontSize: 11, color: '#d1d5db', marginTop: 3 }}>
            🏛 Auditorium {item.auditoriumNumber} · {formatDateTime(item.startTime)}
          </div>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, flexShrink: 0,
          background: valid ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          color: valid ? '#22c55e' : '#ef4444',
        }}>
          {valid ? '✓ Valid' : '✗ Blocked'}
        </span>
      </div>
      {item.reasons.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 16, color: '#9ca3af', fontSize: 11, lineHeight: 1.5 }}>
          {item.reasons.slice(0, 2).map(r => <li key={r}>{r}</li>)}
        </ul>
      )}
    </div>
  );
}

// ─── Shared style objects ─────────────────────────────────────────────────────
const sectionLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.06em', color: '#d1d5db',
};

const fieldWrap: React.CSSProperties = { display: 'grid', gap: 0 };

const fieldLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#d1d5db',
  textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6,
  display: 'block',
};

const inputStyle: React.CSSProperties = { width: '100%', fontSize: 13, minHeight: 40 };

const stepperBtn: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 10,
  background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.15)',
  color: '#ffffff', fontSize: 20, cursor: 'pointer',
  display: 'grid', placeItems: 'center', transition: 'all 0.15s',
};

const pillStyle: React.CSSProperties = {
  fontSize: 10, padding: '3px 8px', borderRadius: 20,
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#d1d5db', background: 'var(--bg-hover)',
};

const ghostSmall: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '7px 12px', borderRadius: 8,
  background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
  color: '#d1d5db', fontSize: 12, cursor: 'pointer',
  transition: 'all 0.15s', whiteSpace: 'nowrap',
};

const summaryBadge = (color: string, bg: string): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '6px 12px', borderRadius: 20,
  background: bg, color, fontWeight: 700, fontSize: 12,
  border: `1px solid ${color}40`,
});

const sectionDivider: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.05em', padding: '4px 0',
};

export default AiShowtimePlannerPanel;
