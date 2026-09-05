import React from 'react';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import type {
  AiResearchIeeeReference,
  AiResearchJobDetail,
} from '../../../../types/aiResearch.types';
import {
  cityLabel,
  formatIeeeReferenceBody,
  renderCitationText,
  renderIeeeMarkdown,
} from './aiResearchHelpers';

interface AiResearchReportViewerProps {
  activeJob: AiResearchJobDetail;
  numberedReferences: AiResearchIeeeReference[];
  scrollToReference: (referenceId: number) => void;
}

export const AiResearchReportViewer: React.FC<AiResearchReportViewerProps> = ({
  activeJob,
  numberedReferences,
  scrollToReference,
}) => {
  if (!activeJob.report) return null;

  const summary = activeJob.report.summary;

  return (
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
  );
};
