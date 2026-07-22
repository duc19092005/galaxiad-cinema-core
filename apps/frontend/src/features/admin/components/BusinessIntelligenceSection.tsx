import React, { useMemo, useState } from 'react';
import {
  Activity,
  Bot,
  Brain,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Film,
  GitBranch,
  Layers,
  Lightbulb,
  MapPin,
  Network,
  Play,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

type AnalysisScope = 'network' | 'cinema' | 'movies' | 'showtimes';
type AgentStatus = 'idle' | 'running' | 'done' | 'waiting';

interface AgentCard {
  id: string;
  name: string;
  role: string;
  focus: string;
  status: AgentStatus;
  color: string;
  icon: React.ReactNode;
  outputs: string[];
}

interface RecommendationItem {
  id: string;
  domain: 'Địa chỉ rạp' | 'Phim hệ thống' | 'Lịch chiếu';
  title: string;
  impact: 'Cao' | 'Trung bình' | 'Thấp';
  confidence: number;
  agents: string[];
  summary: string;
  actions: string[];
}

const SCOPE_OPTIONS: { id: AnalysisScope; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: 'network',
    label: 'Toàn hệ thống',
    desc: 'Mạng rạp + phim + lịch chiếu',
    icon: <Network size={16} />,
  },
  {
    id: 'cinema',
    label: 'Địa chỉ rạp',
    desc: 'Vị trí, mật độ, cạnh tranh khu vực',
    icon: <MapPin size={16} />,
  },
  {
    id: 'movies',
    label: 'Danh mục phim',
    desc: 'Portfolio phim theo rạp / vùng',
    icon: <Film size={16} />,
  },
  {
    id: 'showtimes',
    label: 'Lịch chiếu',
    desc: 'Slot, phòng, khung giờ vàng',
    icon: <Clock3 size={16} />,
  },
];

const SEED_AGENTS: AgentCard[] = [
  {
    id: 'geo',
    name: 'Geo Placement Agent',
    role: 'Bố trí địa chỉ rạp',
    focus: 'Mật độ dân cư, cạnh tranh, khoảng cách cụm rạp',
    status: 'done',
    color: '#3b82f6',
    icon: <MapPin size={18} />,
    outputs: [
      'Ưu tiên mở rộng vành đai Đông Sài Gòn',
      'Tránh trùng bán kính 3km với 2 cụm hiện hữu',
      'Đề xuất 3 vị trí shortlist theo footfall',
    ],
  },
  {
    id: 'catalog',
    name: 'Catalog Strategy Agent',
    role: 'Sắp xếp phim hệ thống',
    focus: 'Mix genre, lifecycle phim, độ phủ rạp',
    status: 'done',
    color: '#a855f7',
    icon: <Film size={18} />,
    outputs: [
      'Tăng phim family ở rạp ngoại ô cuối tuần',
      'Giảm trùng format IMAX giữa 2 rạp lân cận',
      'Ưu tiên phim hot → rạp high-capacity 14 ngày đầu',
    ],
  },
  {
    id: 'schedule',
    name: 'Showtime Optimizer Agent',
    role: 'Tối ưu lịch chiếu',
    focus: 'Prime time, cleaning gap, demand theo ngày',
    status: 'running',
    color: '#ff8a00',
    icon: <Clock3 size={18} />,
    outputs: [
      'Dồn 18:30–21:00 cho top demand movies',
      'Mở thêm slot 14:00 cuối tuần phòng lớn',
      'Giảm suất midweek low-fill dưới 25%',
    ],
  },
  {
    id: 'demand',
    name: 'Demand & Revenue Agent',
    role: 'Nhu cầu & doanh thu',
    focus: 'Vé sold, occupancy, elasticity giá',
    status: 'waiting',
    color: '#22c55e',
    icon: <TrendingUp size={18} />,
    outputs: [
      'Chờ signal từ 3 agent phía trên',
      'Sẽ chấm ROI từng recommendation',
    ],
  },
  {
    id: 'orchestrator',
    name: 'Orchestrator Agent',
    role: 'Điều phối multi-agent',
    focus: 'Gộp insight, resolve conflict, ranking',
    status: 'waiting',
    color: '#06b6d4',
    icon: <Workflow size={18} />,
    outputs: [
      'Chờ demand agent hoàn tất',
      'Xuất playbook áp dụng theo phase',
    ],
  },
];

const SEED_RECS: RecommendationItem[] = [
  {
    id: 'r1',
    domain: 'Địa chỉ rạp',
    title: 'Mở cụm rạp mới khu Thủ Đức – high footfall weekend',
    impact: 'Cao',
    confidence: 86,
    agents: ['Geo Placement', 'Demand & Revenue'],
    summary:
      'Khu vực có gap coverage > 4.5km so với cụm gần nhất, mật độ dân cư & mall traffic cao vào cuối tuần.',
    actions: [
      'Survey 2–3 mặt bằng trong bán kính 1.2km',
      'Ưu tiên 6–8 phòng, 1 phòng large-format',
      'Gắn phim family + blockbuster cho 30 ngày đầu',
    ],
  },
  {
    id: 'r2',
    domain: 'Phim hệ thống',
    title: 'Phân bổ phim hot theo capacity rạp, tránh cannibalization',
    impact: 'Cao',
    confidence: 81,
    agents: ['Catalog Strategy', 'Orchestrator'],
    summary:
      'Hai rạp lân cận đang chiếu cùng 3 title peak → làm loãng lấp đầy. Nên chia portfolio theo strength từng rạp.',
    actions: [
      'Rạp A: giữ blockbuster + IMAX exclusive',
      'Rạp B: tăng arthouse / VN local peak midweek',
      'Review lại sau 7 ngày occupancy',
    ],
  },
  {
    id: 'r3',
    domain: 'Lịch chiếu',
    title: 'Siết slot 18:30–21:00 và mở thêm 14:00 cuối tuần',
    impact: 'Trung bình',
    confidence: 78,
    agents: ['Showtime Optimizer', 'Demand & Revenue'],
    summary:
      'Prime evening full > 70% nhưng afternoon weekend còn trống. Dời 1–2 suất mid-demand sang 14:00.',
    actions: [
      'Mỗi phòng lớn: +1 suất 14:00 T7–CN',
      'Giảm 1 suất 22:30 midweek low-fill',
      'Giữ cleaning gap 15 phút',
    ],
  },
  {
    id: 'r4',
    domain: 'Lịch chiếu',
    title: 'Cân bằng format 2D/3D theo lịch sử bán vé',
    impact: 'Trung bình',
    confidence: 74,
    agents: ['Catalog Strategy', 'Showtime Optimizer'],
    summary:
      '3D đang over-supply trên rạp mid-size; 2D family fill tốt hơn vào khung 10:00–12:00 cuối tuần.',
    actions: [
      'Giảm 20% suất 3D midweek',
      'Tăng 2D family sáng T7–CN',
      'Theo dõi ADR / occupancy 14 ngày',
    ],
  },
];

const statusMeta = (status: AgentStatus) => {
  switch (status) {
    case 'running':
      return { label: 'Đang chạy', color: '#ff8a00', bg: 'rgba(255,138,0,0.12)' };
    case 'done':
      return { label: 'Hoàn tất', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' };
    case 'waiting':
      return { label: 'Chờ phụ thuộc', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' };
    default:
      return { label: 'Idle', color: '#64748b', bg: 'rgba(100,116,139,0.12)' };
  }
};

const impactColor = (impact: RecommendationItem['impact']) => {
  if (impact === 'Cao') return '#ef4444';
  if (impact === 'Trung bình') return '#f59e0b';
  return '#22c55e';
};

/**
 * Seed UI for multi-agent business intelligence.
 * No live multi-agent backend yet — demo orchestration surface for research.
 */
const BusinessIntelligenceSection: React.FC = () => {
  const { t } = useTranslation();
  const [scope, setScope] = useState<AnalysisScope>('network');
  const [horizon, setHorizon] = useState<'7d' | '30d' | '90d'>('30d');
  const [running, setRunning] = useState(false);
  const [agents, setAgents] = useState(SEED_AGENTS);
  const [selectedRec, setSelectedRec] = useState<RecommendationItem | null>(SEED_RECS[0]);
  const [runNote, setRunNote] = useState('Seed snapshot — multi-agent pipeline demo (chưa nối backend).');

  const doneCount = agents.filter((a) => a.status === 'done').length;
  const progress = Math.round((doneCount / agents.length) * 100);

  const pipeline = useMemo(
    () => [
      { step: 1, title: 'Thu thập signal', desc: 'Rạp · phim · lịch · vé · geo' },
      { step: 2, title: 'Chạy agent song song', desc: 'Geo · Catalog · Showtime' },
      { step: 3, title: 'Demand scoring', desc: 'Revenue / occupancy model' },
      { step: 4, title: 'Orchestrator merge', desc: 'Conflict resolve + rank' },
      { step: 5, title: 'Playbook gợi ý', desc: 'Hành động áp dụng theo phase' },
    ],
    [],
  );

  const handleRunSeed = () => {
    if (running) return;
    setRunning(true);
    setRunNote('Đang giả lập multi-agent run (seed UI)…');
    setAgents((prev) =>
      prev.map((a) => ({
        ...a,
        status: a.id === 'orchestrator' || a.id === 'demand' ? 'waiting' : 'running',
      })),
    );

    window.setTimeout(() => {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === 'geo' || a.id === 'catalog' || a.id === 'schedule'
            ? { ...a, status: 'done' as AgentStatus }
            : a.id === 'demand'
              ? { ...a, status: 'running' as AgentStatus }
              : a,
        ),
      );
      setRunNote('3 agent chuyên biệt hoàn tất · Demand agent đang chấm điểm…');
    }, 1200);

    window.setTimeout(() => {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === 'demand'
            ? { ...a, status: 'done' as AgentStatus }
            : a.id === 'orchestrator'
              ? { ...a, status: 'running' as AgentStatus }
              : a,
        ),
      );
      setRunNote('Demand xong · Orchestrator đang gộp recommendation…');
    }, 2400);

    window.setTimeout(() => {
      setAgents((prev) => prev.map((a) => ({ ...a, status: 'done' as AgentStatus })));
      setRunNote('Seed run hoàn tất. Kết nối multi-agent backend sẽ thay thế dữ liệu demo này.');
      setRunning(false);
      setSelectedRec(SEED_RECS[0]);
    }, 3600);
  };

  return (
    <div className="animate-in" style={{ display: 'grid', gap: 18 }}>
      {/* Hero */}
      <section
        style={{
          borderRadius: 18,
          border: '1px solid var(--border-color)',
          background:
            'radial-gradient(1200px 280px at 10% -20%, rgba(255,138,0,0.18), transparent), radial-gradient(900px 240px at 90% 0%, rgba(59,130,246,0.12), transparent), var(--bg-surface)',
          padding: '22px 24px',
          display: 'grid',
          gap: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 16,
            alignItems: 'flex-start',
          }}
        >
          <div style={{ display: 'flex', gap: 14, maxWidth: 720 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                display: 'grid',
                placeItems: 'center',
                background: 'linear-gradient(135deg, rgba(255,138,0,0.25), rgba(59,130,246,0.2))',
                border: '1px solid rgba(255,138,0,0.3)',
                color: 'var(--accent)',
                flexShrink: 0,
              }}
            >
              <Brain size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 850, color: 'var(--text-primary)' }}>
                  {t('adminBi.title', 'Phân tích kinh doanh · Multi-Agent')}
                </h2>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: 'rgba(255,138,0,0.14)',
                    color: 'var(--accent)',
                    border: '1px solid rgba(255,138,0,0.28)',
                  }}
                >
                  Seed UI
                </span>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {t(
                  'adminBi.subtitle',
                  'Không gian gợi ý sắp xếp địa chỉ rạp, danh mục phim toàn hệ thống và lịch chiếu — điều phối bởi nhiều agent chuyên biệt. Hiện là giao diện seed để nghiên cứu multi-agent.',
                )}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" disabled={running} onClick={() => setAgents(SEED_AGENTS)}>
              <RefreshCw size={15} />
              Reset seed
            </button>
            <button type="button" className="btn btn-primary" disabled={running} onClick={handleRunSeed}>
              {running ? <Activity size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={15} />}
              {running ? 'Đang chạy agents…' : 'Chạy phân tích (demo)'}
            </button>
          </div>
        </div>

        {/* Scope chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SCOPE_OPTIONS.map((opt) => {
            const active = scope === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setScope(opt.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: active ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                  background: active ? 'rgba(255,138,0,0.12)' : 'var(--bg-elevated)',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {opt.icon}
                <span>
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 800 }}>{opt.label}</span>
                  <span style={{ display: 'block', fontSize: 10, opacity: 0.8, marginTop: 2 }}>{opt.desc}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Khung thời gian</span>
          {(['7d', '30d', '90d'] as const).map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHorizon(h)}
              style={{
                padding: '5px 10px',
                borderRadius: 999,
                border: horizon === h ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                background: horizon === h ? 'rgba(255,138,0,0.14)' : 'transparent',
                color: horizon === h ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 11,
                fontWeight: 750,
                cursor: 'pointer',
              }}
            >
              {h === '7d' ? '7 ngày' : h === '30d' ? '30 ngày' : '90 ngày'}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{runNote}</span>
        </div>
      </section>

      {/* KPI strip */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
        }}
      >
        {[
          { label: 'Agents active', value: `${doneCount}/${agents.length}`, icon: <Bot size={16} />, color: '#a855f7' },
          { label: 'Pipeline progress', value: `${progress}%`, icon: <GitBranch size={16} />, color: '#ff8a00' },
          { label: 'Gợi ý seed', value: String(SEED_RECS.length), icon: <Lightbulb size={16} />, color: '#22c55e' },
          { label: 'Phạm vi', value: SCOPE_OPTIONS.find((s) => s.id === scope)?.label ?? '—', icon: <Target size={16} />, color: '#3b82f6' },
        ].map((k) => (
          <div
            key={k.label}
            className="glass-card"
            style={{ padding: '14px 16px', borderTop: `3px solid ${k.color}` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                {k.label}
              </span>
              <span style={{ color: k.color }}>{k.icon}</span>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 22, fontWeight: 850, color: 'var(--text-primary)' }}>{k.value}</p>
          </div>
        ))}
      </section>

      {/* Pipeline */}
      <section className="glass-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Layers size={16} style={{ color: 'var(--accent)' }} />
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Luồng multi-agent (seed)</h3>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 10,
          }}
        >
          {pipeline.map((p, idx) => (
            <div
              key={p.step}
              style={{
                position: 'relative',
                padding: '12px 12px 14px',
                borderRadius: 12,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-elevated)',
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 8,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                  background: 'rgba(255,138,0,0.14)',
                  color: 'var(--accent)',
                  marginBottom: 8,
                }}
              >
                {p.step}
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>{p.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>{p.desc}</div>
              {idx < pipeline.length - 1 && (
                <ChevronRight
                  size={14}
                  style={{
                    position: 'absolute',
                    right: -8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    opacity: 0.5,
                    display: 'none',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Agents + Recommendations */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1.15fr)',
          gap: 16,
          alignItems: 'start',
        }}
        className="admin-bi-grid"
      >
        {/* Agent swarm */}
        <div className="glass-card" style={{ padding: 18, display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} style={{ color: 'var(--accent)' }} />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Đội agent</h3>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>5 agents · demo</span>
          </div>

          {agents.map((agent) => {
            const st = statusMeta(agent.status);
            return (
              <div
                key={agent.id}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  border: '1px solid var(--border-color)',
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.02), transparent)',
                  display: 'grid',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      display: 'grid',
                      placeItems: 'center',
                      background: `${agent.color}22`,
                      color: agent.color,
                      border: `1px solid ${agent.color}44`,
                      flexShrink: 0,
                    }}
                  >
                    {agent.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{agent.name}</strong>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 750,
                          padding: '2px 8px',
                          borderRadius: 999,
                          color: st.color,
                          background: st.bg,
                        }}
                      >
                        {st.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{agent.role}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.45 }}>
                      {agent.focus}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {agent.outputs.map((o) => (
                    <span
                      key={o}
                      style={{
                        fontSize: 11,
                        padding: '4px 8px',
                        borderRadius: 8,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {o}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Recommendations board */}
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="glass-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Sparkles size={16} style={{ color: 'var(--accent)' }} />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Gợi ý sắp xếp (seed)</h3>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {SEED_RECS.map((rec) => {
                const active = selectedRec?.id === rec.id;
                return (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => setSelectedRec(rec)}
                    style={{
                      textAlign: 'left',
                      padding: 14,
                      borderRadius: 14,
                      border: active ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                      background: active ? 'rgba(255,138,0,0.08)' : 'var(--bg-elevated)',
                      cursor: 'pointer',
                      display: 'grid',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {rec.domain}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 999,
                          color: impactColor(rec.impact),
                          background: `${impactColor(rec.impact)}18`,
                        }}
                      >
                        Impact {rec.impact}
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 750, color: 'var(--accent)' }}>
                        {rec.confidence}% tin cậy
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {rec.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Agents: {rec.agents.join(' · ')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedRec && (
            <div className="glass-card" style={{ padding: 18, display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={16} style={{ color: 'var(--accent)' }} />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Chi tiết playbook</h3>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {selectedRec.summary}
              </p>
              <div style={{ display: 'grid', gap: 8 }}>
                {selectedRec.actions.map((action, i) => (
                  <div
                    key={action}
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start',
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <CheckCircle2 size={15} style={{ color: 'var(--success)', marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)' }}>Bước {i + 1}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 2, lineHeight: 1.45 }}>
                        {action}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: 4,
                  padding: 12,
                  borderRadius: 12,
                  border: '1px dashed rgba(255,138,0,0.35)',
                  background: 'rgba(255,138,0,0.06)',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: 'var(--accent)' }}>Ghi chú nghiên cứu:</strong> Nút áp dụng / multi-agent
                runtime sẽ nối backend (orchestrator + tools) sau. Trang này chỉ seed UI/UX để bạn thiết kế
                workflow.
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-primary" disabled title="Sẽ nối backend multi-agent">
                  <Building2 size={14} />
                  Áp dụng (sắp có)
                </button>
                <button type="button" className="btn btn-secondary" disabled>
                  Xuất playbook
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <style>{`
        @media (max-width: 960px) {
          .admin-bi-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BusinessIntelligenceSection;
