import React, { useMemo, useState } from 'react';
import { Bot, CheckCircle2, Clock3, Loader2, Sparkles, Trash2, X } from 'lucide-react';
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
}

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

const AiShowtimePlannerPanel: React.FC<AiShowtimePlannerPanelProps> = ({
  open,
  cinemaId,
  auditoriums,
  selectedAuditoriumId,
  onClose,
  onApplied,
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

  const [fromDate, setFromDate] = useState(toDateInput(tomorrow));
  const [toDate, setToDate] = useState(toDateInput(weekEnd));
  const [auditoriumId, setAuditoriumId] = useState<string>(selectedAuditoriumId || '');
  const [maxSuggestions, setMaxSuggestions] = useState(10);
  const [batch, setBatch] = useState<ShowtimeRecommendationBatch | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<ShowtimeRecommendationPreview | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'generate' | 'preview' | 'apply' | 'dismiss' | null>(null);

  const recommendations = batch?.recommendations?.filter(item => item.status === 'Suggested') || [];
  const allSelected = recommendations.length > 0 && recommendations.every(item => selectedIds.has(item.recommendationId));

  const toggleSelected = (recommendationId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(recommendationId)) next.delete(recommendationId);
      else next.add(recommendationId);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(recommendations.map(item => item.recommendationId)));
  };

  const handleGenerate = async () => {
    if (!cinemaId) {
      showError('Please select a cinema before generating recommendations.');
      return;
    }

    setLoadingAction('generate');
    setPreview(null);
    setPreviewOpen(false);
    try {
      const response = await scheduleApi.generateRecommendations({
        cinemaId,
        fromDate,
        toDate,
        auditoriumId: auditoriumId || null,
        maxSuggestions,
      });
      setBatch(response.data || null);
      setSelectedIds(new Set((response.data?.recommendations || []).map(item => item.recommendationId)));
      showSuccess(response.message || 'Showtime recommendations generated successfully.');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Could not generate showtime recommendations.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePreview = async (ids: string[]) => {
    if (!batch || ids.length === 0) {
      showError('Select at least one recommendation to preview.');
      return;
    }

    setLoadingAction('preview');
    try {
      const response = await scheduleApi.previewRecommendations({
        batchId: batch.batchId,
        recommendationIds: ids,
      });
      setPreview(response.data || null);
      setPreviewOpen(true);
    } catch (error: any) {
      showError(error.response?.data?.message || 'Could not preview recommendations.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleApply = async (ids: string[], applyValidOnly: boolean) => {
    if (!batch || ids.length === 0) return;

    setLoadingAction('apply');
    try {
      const response = await scheduleApi.applyRecommendations({
        batchId: batch.batchId,
        recommendationIds: ids,
        applyValidOnly,
      });
      const data: ApplyShowtimeRecommendationsResponse | undefined = response.data;
      showSuccess(`${data?.applied?.length || 0} recommendation(s) applied.`);
      setPreviewOpen(false);
      setBatch(prev => prev ? {
        ...prev,
        recommendations: prev.recommendations.filter(item => !ids.includes(item.recommendationId)),
      } : prev);
      setSelectedIds(new Set());
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
        recommendations: prev.recommendations.filter(current => current.recommendationId !== item.recommendationId),
      } : prev);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(item.recommendationId);
        return next;
      });
    } catch (error: any) {
      showError(error.response?.data?.message || 'Could not dismiss recommendation.');
    } finally {
      setLoadingAction(null);
    }
  };

  if (!open) return null;

  const selectedArray = Array.from(selectedIds);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 70,
        }}
        onClick={onClose}
      />
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(480px, 100vw)',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-color)',
          zIndex: 80,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.38)',
        }}
      >
        <header style={{ padding: 20, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'rgba(255,138,0,0.14)', color: 'var(--accent)' }}>
            <Bot size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 18, fontWeight: 800 }}>AI Planner</h3>
            <p style={{ margin: '3px 0 0', color: 'var(--text-muted)', fontSize: 12 }}>Prime-time showtime suggestions</p>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: 8 }} aria-label="Close AI Planner">
            <X size={18} />
          </button>
        </header>

        <div style={{ padding: 16, borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={labelStyle}>
            From
            <input className="input" type="date" value={fromDate} onChange={event => setFromDate(event.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            To
            <input className="input" type="date" value={toDate} onChange={event => setToDate(event.target.value)} style={inputStyle} />
          </label>
          <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>
            Auditorium
            <select className="input" value={auditoriumId} onChange={event => setAuditoriumId(event.target.value)} style={inputStyle}>
              <option value="">All auditoriums</option>
              {auditoriums.map(auditorium => (
                <option key={auditorium.id} value={auditorium.id}>Auditorium {auditorium.name}</option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            Max suggestions
            <input
              className="input"
              type="number"
              min={1}
              max={20}
              value={maxSuggestions}
              onChange={event => setMaxSuggestions(Math.max(1, Math.min(20, Number(event.target.value) || 10)))}
              style={inputStyle}
            />
          </label>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={loadingAction === 'generate'} style={{ alignSelf: 'end', minHeight: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loadingAction === 'generate' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
            Generate
          </button>
        </div>

        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border-color)' }}>
          <button className="btn-ghost" onClick={handleSelectAll} disabled={recommendations.length === 0} style={{ padding: '7px 10px', fontSize: 12 }}>
            {allSelected ? 'Clear' : 'Select all'}
          </button>
          <button className="btn-ghost" onClick={() => handlePreview(selectedArray)} disabled={selectedArray.length === 0 || loadingAction === 'preview'} style={{ padding: '7px 10px', fontSize: 12 }}>
            Preview selected
          </button>
          <button className="btn btn-primary" onClick={() => handlePreview(recommendations.map(item => item.recommendationId))} disabled={recommendations.length === 0 || loadingAction === 'preview'} style={{ marginLeft: 'auto', padding: '7px 10px', fontSize: 12 }}>
            Apply all
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'grid', gap: 12, alignContent: 'start' }}>
          {recommendations.length === 0 && (
            <div style={{ border: '1px dashed var(--border-color)', borderRadius: 8, padding: 24, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
              Generate suggestions to review AI-planned showtimes.
            </div>
          )}
          {recommendations.map(item => (
            <article key={item.recommendationId} className="glass-card" style={{ padding: 14, borderRadius: 8, display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.recommendationId)}
                  onChange={() => toggleSelected(item.recommendationId)}
                  style={{ marginTop: 3 }}
                  aria-label={`Select ${item.movieName}`}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 14, fontWeight: 800, lineHeight: 1.3 }}>{item.movieName}</h4>
                  <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 12 }}>
                    <Clock3 size={13} />
                    <span>{formatDateTime(item.startTime)}</span>
                  </div>
                </div>
                <span style={{ ...badgeStyle, color: demandColor(item.demandLevel), borderColor: demandColor(item.demandLevel) }}>
                  {Math.round(item.confidenceScore)}%
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11 }}>
                <span style={pillStyle}>Auditorium {item.auditoriumNumber}</span>
                <span style={pillStyle}>{item.formatName || 'Default'}</span>
                <span style={pillStyle}>{item.demandLevel} demand</span>
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.5 }}>{item.expectedImpact}</p>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.5 }}>
                {item.reasons.slice(0, 3).map(reason => <li key={reason}>{reason}</li>)}
              </ul>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn-ghost" onClick={() => handleDismiss(item)} disabled={loadingAction === 'dismiss'} style={{ padding: 7 }} aria-label="Dismiss recommendation">
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </aside>

      {previewOpen && preview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(0,0,0,0.55)' }}>
          <div className="glass-card" style={{ width: 'min(680px, 100%)', maxHeight: '82vh', overflow: 'hidden', borderRadius: 8, display: 'flex', flexDirection: 'column' }}>
            <header style={{ padding: 18, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle2 size={20} style={{ color: 'var(--accent)' }} />
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 17 }}>Preview recommendations</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 12 }}>
                  {preview.validSuggestions.length} valid, {preview.invalidSuggestions.length} blocked
                </p>
              </div>
              <button className="btn-ghost" onClick={() => setPreviewOpen(false)} style={{ padding: 8 }}><X size={16} /></button>
            </header>
            <div style={{ padding: 16, overflowY: 'auto', display: 'grid', gap: 12 }}>
              {[...preview.validSuggestions, ...preview.invalidSuggestions].map(item => (
                <div key={item.recommendationId} style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>{item.movieName}</strong>
                    <span style={{ color: item.isValid ? '#16a34a' : '#ef4444', fontSize: 12, fontWeight: 800 }}>
                      {item.isValid ? 'Valid' : 'Blocked'}
                    </span>
                  </div>
                  <div style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: 12 }}>
                    Auditorium {item.auditoriumNumber} - {formatDateTime(item.startTime)}
                  </div>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.5 }}>
                    {item.reasons.map(reason => <li key={reason}>{reason}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <footer style={{ padding: 16, borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-ghost" onClick={() => setPreviewOpen(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={preview.validSuggestions.length === 0 || loadingAction === 'apply'}
                onClick={() => handleApply(selectedArray.length > 0 ? selectedArray : recommendations.map(item => item.recommendationId), preview.invalidSuggestions.length > 0)}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {loadingAction === 'apply' && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                Apply valid
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  color: 'var(--text-secondary)',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontSize: 12,
  minHeight: 38,
};

const pillStyle: React.CSSProperties = {
  border: '1px solid var(--border-color)',
  color: 'var(--text-secondary)',
  borderRadius: 999,
  padding: '3px 8px',
};

const badgeStyle: React.CSSProperties = {
  border: '1px solid',
  borderRadius: 999,
  padding: '4px 8px',
  fontSize: 11,
  fontWeight: 900,
  minWidth: 48,
  textAlign: 'center',
};

const demandColor = (level: string) => {
  if (level === 'High') return '#16a34a';
  if (level === 'Low') return '#f97316';
  return '#eab308';
};

export default AiShowtimePlannerPanel;
