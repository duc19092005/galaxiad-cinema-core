import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  BrainCircuit,
  FlaskConical,
  LineChart,
  MapPinned,
  MessageSquareText,
  Sparkles,
  Ticket,
} from 'lucide-react';
import AppSidebar, { type SidebarSection } from '../../components/AppSidebar';
import ManagementChrome from '../../components/ManagementChrome';
import AiResearchSection from './components/AiResearchSection';
import './components/AdminAiHubSection.css';

export type AiModuleId =
  | 'business-research'
  | 'chatbot-insight'
  | 'recommendation-lab'
  | 'pricing-copilot'
  | 'site-scout';

const AI_MODULE_IDS = new Set<string>([
  'business-research',
  'chatbot-insight',
  'recommendation-lab',
  'pricing-copilot',
  'site-scout',
]);

interface ExperimentalMetric {
  label: string;
  value: string;
  hint: string;
}

interface ExperimentalRow {
  id: string;
  title: string;
  status: string;
  score: string;
  updatedAt: string;
}

const EXPERIMENTAL_SEED: Record<
  Exclude<AiModuleId, 'business-research'>,
  {
    title: string;
    blurb: string;
    metrics: ExperimentalMetric[];
    rows: ExperimentalRow[];
  }
> = {
  'chatbot-insight': {
    title: 'Chatbot Insight',
    blurb:
      'Phân tích intent, tỷ lệ chuyển đổi đặt vé và câu hỏi hay gặp từ chatbot khách hàng.',
    metrics: [
      { label: 'Phiên chat / ngày', value: '1.284', hint: 'Seed demo' },
      { label: 'Intent booking', value: '38%', hint: 'Seed demo' },
      { label: 'Escalate nhân viên', value: '6.2%', hint: 'Seed demo' },
      { label: 'CSAT ảo', value: '4.4/5', hint: 'Seed demo' },
    ],
    rows: [
      {
        id: 'cb-1',
        title: 'Hỏi lịch chiếu cuối tuần · TPHCM',
        status: 'Hot',
        score: '412 hits',
        updatedAt: '2026-07-20 09:12',
      },
      {
        id: 'cb-2',
        title: 'Đổi ghế / hủy vé qua chat',
        status: 'Watch',
        score: '96 hits',
        updatedAt: '2026-07-19 16:40',
      },
      {
        id: 'cb-3',
        title: 'Ưu đãi sinh viên',
        status: 'Rising',
        score: '151 hits',
        updatedAt: '2026-07-18 11:05',
      },
    ],
  },
  'recommendation-lab': {
    title: 'Recommendation Lab',
    blurb:
      'Thử nghiệm ranking phim theo genre survey, viewing history và interest score (sandbox).',
    metrics: [
      { label: 'Mô hình', value: 'BGE-M3', hint: 'Embedding' },
      { label: 'CTR ảo', value: '12.8%', hint: 'Seed demo' },
      { label: 'Coverage', value: '91%', hint: 'Catalog' },
      { label: 'A/B variants', value: '3', hint: 'Sandbox' },
    ],
    rows: [
      {
        id: 'rec-1',
        title: 'Variant A · hybrid collaborative',
        status: 'Running',
        score: 'NDCG 0.71',
        updatedAt: '2026-07-21 08:00',
      },
      {
        id: 'rec-2',
        title: 'Variant B · content-only',
        status: 'Paused',
        score: 'NDCG 0.64',
        updatedAt: '2026-07-17 14:22',
      },
      {
        id: 'rec-3',
        title: 'Cold-start new release boost',
        status: 'Draft',
        score: '—',
        updatedAt: '2026-07-15 10:10',
      },
    ],
  },
  'pricing-copilot': {
    title: 'Pricing Copilot',
    blurb:
      'Gợi ý khung giá vé / phụ thu format theo khung giờ và phân khúc (chỉ môi trường thử nghiệm).',
    metrics: [
      { label: 'Rules gợi ý', value: '18', hint: 'Seed' },
      { label: 'Δ doanh thu ảo', value: '+4.1%', hint: 'Simulation' },
      { label: 'Khung giờ peak', value: '19:00-21:30', hint: 'HCM' },
      { label: 'Rủi ro', value: 'Trung bình', hint: 'Sandbox' },
    ],
    rows: [
      {
        id: 'px-1',
        title: 'Phụ thu IMAX cuối tuần +15k',
        status: 'Suggested',
        score: 'Impact +2.4%',
        updatedAt: '2026-07-21 12:30',
      },
      {
        id: 'px-2',
        title: 'Giảm giá midweek 2D sinh viên',
        status: 'Suggested',
        score: 'Impact +1.1%',
        updatedAt: '2026-07-20 18:05',
      },
      {
        id: 'px-3',
        title: 'Bundle bắp nước giờ thấp điểm',
        status: 'Review',
        score: 'Impact +0.6%',
        updatedAt: '2026-07-19 09:45',
      },
    ],
  },
  'site-scout': {
    title: 'Site Scout',
    blurb:
      'Bản đồ shortlist mặt bằng rạp (footfall, thuê m², hạ tầng) — demo UI, chưa nối pipeline live.',
    metrics: [
      { label: 'Shortlist ảo', value: '7', hint: 'TPHCM' },
      { label: 'Avg rent ảo', value: '1.2–2.1M', hint: 'VND/m²' },
      { label: 'Metro nearby', value: '4', hint: 'Seed' },
      { label: 'Risk score', value: 'B+', hint: 'Sandbox' },
    ],
    rows: [
      {
        id: 'st-1',
        title: 'TTTM khu Đông · 2.400m²',
        status: 'P0',
        score: 'Fit 86',
        updatedAt: '2026-07-21 07:55',
      },
      {
        id: 'st-2',
        title: 'Bình Thạnh mid-box · 1.800m²',
        status: 'P1',
        score: 'Fit 79',
        updatedAt: '2026-07-20 15:18',
      },
      {
        id: 'st-3',
        title: 'Vùng vệ tinh phía Nam · 3.000m²',
        status: 'Watch',
        score: 'Fit 71',
        updatedAt: '2026-07-18 13:02',
      },
    ],
  },
};

const MODULE_META: Array<{
  id: AiModuleId;
  label: string;
  icon: ReactNode;
  live: boolean;
  description: string;
}> = [
  {
    id: 'business-research',
    label: 'Business Research',
    icon: <BrainCircuit size={18} />,
    live: true,
    description: 'Multi-agent nghiên cứu khả thi / giá / địa điểm — pipeline live.',
  },
  {
    id: 'chatbot-insight',
    label: 'Chatbot Insight',
    icon: <MessageSquareText size={18} />,
    live: false,
    description: 'Insight hội thoại chatbot (đang thử nghiệm).',
  },
  {
    id: 'recommendation-lab',
    label: 'Recommendation Lab',
    icon: <Sparkles size={18} />,
    live: false,
    description: 'Lab ranking & gợi ý phim (đang thử nghiệm).',
  },
  {
    id: 'pricing-copilot',
    label: 'Pricing Copilot',
    icon: <Ticket size={18} />,
    live: false,
    description: 'Gợi ý giá & phụ thu (đang thử nghiệm).',
  },
  {
    id: 'site-scout',
    label: 'Site Scout',
    icon: <MapPinned size={18} />,
    live: false,
    description: 'Shortlist mặt bằng rạp (đang thử nghiệm).',
  },
];

const ExperimentalPanel = ({ moduleId }: { moduleId: Exclude<AiModuleId, 'business-research'> }) => {
  const data = EXPERIMENTAL_SEED[moduleId];
  return (
    <div className="admin-ai-experimental animate-in">
      <div className="admin-ai-experimental-banner">
        <FlaskConical size={18} />
        <div>
          <strong>Đang thử nghiệm</strong>
          <p>
            Module này dùng <em>seed data demo</em> trên frontend, chưa nối API/Hangfire/multi-agent
            production. Chỉ phục vụ mock UI &amp; demo HĐQT.
          </p>
        </div>
        <span className="admin-ai-pill experimental">Experimental</span>
      </div>

      <header className="admin-ai-experimental-header">
        <div>
          <h2>{data.title}</h2>
          <p>{data.blurb}</p>
        </div>
        <span className="admin-ai-pill seed">Seed data</span>
      </header>

      <div className="admin-ai-metric-grid">
        {data.metrics.map((metric) => (
          <article key={metric.label} className="admin-ai-metric-card">
            <small>{metric.label}</small>
            <strong>{metric.value}</strong>
            <span>{metric.hint}</span>
          </article>
        ))}
      </div>

      <div className="admin-ai-seed-table-wrap">
        <div className="admin-ai-seed-table-head">
          <LineChart size={15} />
          <strong>Bảng seed demo</strong>
          <span>{data.rows.length} rows</span>
        </div>
        <table className="admin-ai-seed-table">
          <thead>
            <tr>
              <th>Hạng mục</th>
              <th>Trạng thái</th>
              <th>Chỉ số</th>
              <th>Cập nhật</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.id}>
                <td>{row.title}</td>
                <td>
                  <span className="admin-ai-row-status">{row.status}</span>
                </td>
                <td>{row.score}</td>
                <td>{row.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminAiPage = () => {
  const navigate = useNavigate();
  const { module } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeModule: AiModuleId =
    module && AI_MODULE_IDS.has(module) ? (module as AiModuleId) : 'business-research';

  useEffect(() => {
    if (!module || !AI_MODULE_IDS.has(module)) {
      navigate('/admin/ai/business-research', { replace: true });
    }
  }, [module, navigate]);

  const activeMeta = useMemo(
    () => MODULE_META.find((item) => item.id === activeModule) ?? MODULE_META[0],
    [activeModule],
  );

  const sidebarSections: SidebarSection[] = useMemo(
    () => [
      {
        id: 'nav-admin',
        collapsible: false,
        items: [
          {
            id: 'back-admin',
            label: 'Về Admin',
            icon: <ArrowLeft size={18} />,
            onClick: () => navigate('/admin'),
          },
        ],
      },
      {
        id: 'ai-live',
        label: 'AI Live',
        description: 'Pipeline production',
        icon: <BrainCircuit size={18} />,
        defaultOpen: true,
        collapsible: true,
        items: MODULE_META.filter((item) => item.live).map((item) => ({
          id: item.id,
          label: item.label,
          icon: item.icon,
          onClick: () => navigate(`/admin/ai/${item.id}`),
        })),
      },
      {
        id: 'ai-experimental',
        label: 'Đang thử nghiệm',
        description: 'Sandbox + seed demo',
        icon: <FlaskConical size={18} />,
        defaultOpen: false,
        collapsible: true,
        items: MODULE_META.filter((item) => !item.live).map((item) => ({
          id: item.id,
          label: item.label,
          icon: item.icon,
          onClick: () => navigate(`/admin/ai/${item.id}`),
        })),
      },
    ],
    [navigate],
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <AppSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((open) => !open)}
        activeTab={activeModule}
        onTabChange={(id) => {
          if (id === 'back-admin') {
            navigate('/admin');
            return;
          }
          if (AI_MODULE_IDS.has(id)) {
            navigate(`/admin/ai/${id}`);
          }
        }}
        sections={sidebarSections}
        role="Admin · AI"
        collapsibleDesktop
      />

      <ManagementChrome
        sidebarOpen={sidebarOpen}
        onSidebarToggle={() => setSidebarOpen((open) => !open)}
      />

      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
        <div className="page-container">
          <div key={activeModule} className="tab-content-enter admin-ai-hub">
            <header className="admin-ai-hub-header">
              <div className="admin-ai-hub-eyebrow">
                <Bot size={16} />
                <span>Galaxy Cinema · AI Control Room</span>
                {activeMeta.live ? (
                  <span className="admin-ai-pill seed" style={{ marginLeft: 8 }}>
                    Live
                  </span>
                ) : (
                  <span className="admin-ai-pill experimental" style={{ marginLeft: 8 }}>
                    Đang thử nghiệm
                  </span>
                )}
              </div>
              <h1>{activeMeta.label}</h1>
              <p>{activeMeta.description}</p>
            </header>

            {activeModule === 'business-research' ? (
              <AiResearchSection />
            ) : (
              <ExperimentalPanel moduleId={activeModule} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminAiPage;
