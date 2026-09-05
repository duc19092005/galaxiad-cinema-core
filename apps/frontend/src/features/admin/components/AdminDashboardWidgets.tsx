import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Film } from 'lucide-react';
import type { ManagementDashboardDto } from '../../../types/admin.types';

export const statsCardStyle: React.CSSProperties = {
  padding: '18px 20px',
  background: 'linear-gradient(145deg, rgba(255,255,255,0.02), rgba(255,255,255,0.005)), var(--bg-surface)',
  backdropFilter: 'blur(18px) saturate(1.25)',
  WebkitBackdropFilter: 'blur(18px) saturate(1.25)',
  border: '1px solid var(--border-color)',
  borderRadius: 12,
  boxShadow: '0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.04)',
};

export const formatCompactNumber = (value?: number | null) => (value ?? 0).toLocaleString('vi-VN');

export const formatVnd = (value?: number | null) => {
  const amount = value ?? 0;
  if (Math.abs(amount) >= 1_000_000_000) return `VND ${(amount / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}B`;
  if (Math.abs(amount) >= 1_000_000) return `VND ${(amount / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}M`;
  return `VND ${amount.toLocaleString('vi-VN')}`;
};

export const StatCard: React.FC<{
  label: string;
  value: string;
  trend?: string;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}> = ({ label, value, trend, icon, color, delay = 0 }) => (
  <div
    style={{
      ...statsCardStyle,
      animation: 'fadeIn 0.4s ease-out forwards',
      opacity: 0,
      animationDelay: `${delay}ms`,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}1A`,
        color,
      }}>
        {icon}
      </div>
      {trend && (
        <span style={{
          fontSize: 10, color: 'var(--text-muted)',
          fontFamily: "'JetBrains Mono', monospace",
          background: 'rgba(255,255,255,0.03)',
          padding: '2px 10px', borderRadius: 999,
        }}>
          {trend}
        </span>
      )}
    </div>
    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px', fontWeight: 500 }}>{label}</p>
    <p style={{ fontSize: 30, fontWeight: 850, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>{value}</p>
  </div>
);

export const AdminRevenueChart: React.FC<{ data?: ManagementDashboardDto | null }> = ({ data }) => {
  const revenueRows = data?.revenueByDay?.length
    ? data.revenueByDay
    : Array.from({ length: 7 }, (_, i) => ({
      date: '', dateLabel: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i], revenue: 0, ticketCount: 0,
    }));

  const now = new Date();
  const dow = now.getDay();
  const monOff = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(now);
  mon.setDate(now.getDate() + monOff);
  const weekLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i);
    return `${['MON','TUE','WED','THU','FRI','SAT','SUN'][i]} ${d.getDate()}`;
  });

  const revVals = revenueRows.map(r => r.revenue);
  const ticketVals = revenueRows.map(r => r.ticketCount);
  const maxRev = Math.max(...revVals, 1);
  const maxTic = Math.max(...ticketVals, 1);
  const n = 7;

  // Fixed pixel SVG
  const W = 840, H = 300;
  const pL = 20, pR = 40, pT = 16, pB = 44;
  const cW = W - pL - pR, cH = H - pT - pB;

  const gx = (i: number) => pL + (i / (n - 1)) * cW;
  const ry = (v: number) => pT + cH - (v / maxRev) * cH;
  const ty = (v: number) => pT + cH - (v / maxTic) * cH;

  const smooth = (getY: (v: number) => number, vals: number[]) => {
    const pts = vals.map((v, i) => [gx(i), getY(v)]);
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [px, py] = pts[i - 1], [cx, cy] = pts[i];
      const c1x = px + (cx - px) * 0.35, c2x = cx - (cx - px) * 0.35;
      d += `C${c1x},${py} ${c2x},${cy} ${cx},${cy}`;
    }
    return d;
  };

  const rLine = smooth(ry, revVals);
  const tLine = smooth(ty, ticketVals);
  const rArea = `${rLine}L${gx(n - 1)},${pT + cH}L${gx(0)},${pT + cH}Z`;
  const tArea = `${tLine}L${gx(n - 1)},${pT + cH}L${gx(0)},${pT + cH}Z`;

  const gridYs = [0.25, 0.5, 0.75].map(p => pT + cH * (1 - p));

  return (
    <section className="admin-dashboard-card" style={{ padding: '24px 20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }}>Tổng Quan Doanh Thu</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#999' }}>Doanh thu gross và số vé bán trong tuần hiện tại.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: '#bbb' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: '#ff8a00', display: 'inline-block' }} /> Gross Revenue
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: '#22c55e', display: 'inline-block' }} /> Ticket Sales
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff8a00" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#ff8a00" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridYs.map((y, i) => (
          <line key={i} x1={pL} y1={y} x2={W - pR} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        ))}
        <line x1={pL} y1={pT + cH} x2={W - pR} y2={pT + cH} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />

        {/* Area fills */}
        <path d={rArea} fill="url(#rg)" />
        <path d={tArea} fill="url(#tg)" />

        {/* Lines */}
        <path d={rLine} fill="none" stroke="#ff8a00" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <path d={tLine} fill="none" stroke="#22c55e" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots — revenue */}
        {revVals.map((v, i) => (
          <g key={`r${i}`}>
            <circle cx={gx(i)} cy={ry(v)} r={6} fill="#ff8a00" opacity={0.4} />
            <circle cx={gx(i)} cy={ry(v)} r={4} fill="#ff8a00" />
            <circle cx={gx(i)} cy={ry(v)} r={2} fill="#131316" />
          </g>
        ))}

        {/* Dots — tickets */}
        {ticketVals.map((v, i) => (
          <g key={`t${i}`}>
            <circle cx={gx(i)} cy={ty(v)} r={6} fill="#22c55e" opacity={0.4} />
            <circle cx={gx(i)} cy={ty(v)} r={4} fill="#22c55e" />
            <circle cx={gx(i)} cy={ty(v)} r={2} fill="#131316" />
          </g>
        ))}

        {/* X-axis labels */}
        {weekLabels.map((lbl, i) => (
          <text key={i} x={gx(i)} y={H - 8} textAnchor="middle" fill="#aaa" fontSize={13} fontFamily="'JetBrains Mono',monospace" fontWeight={700}>
            {lbl}
          </text>
        ))}
      </svg>
    </section>
  );
};

export const AdminOpsTiles: React.FC<{ data?: ManagementDashboardDto | null }> = ({ data }) => {
  const { t } = useTranslation();
  const topMovie = data?.hotMovies?.[0];
  const latestTransaction = data?.recentTransactions?.[0];
  const latestCinema = data?.recentCinemas?.[0];

  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
      <div className="admin-dashboard-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, borderLeft: '4px solid var(--accent)' }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('adminPerformanceDashboard.topMovie')}</p>
          <h4 style={{ margin: 0, fontSize: 22, fontWeight: 850 }}>{topMovie?.movieName || t('adminPerformanceDashboard.noTicketData')}</h4>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
            {t('adminPerformanceDashboard.ticketsSold', { count: topMovie?.ticketsSold })}
          </p>
        </div>
        <Film size={34} style={{ color: 'var(--accent)' }} />
      </div>

      <div className="admin-dashboard-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, borderLeft: '4px solid var(--success)' }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('adminPerformanceDashboard.latestBooking')}</p>
          <h4 style={{ margin: 0, fontSize: 22, fontWeight: 850 }}>{latestTransaction?.movieName || t('adminPerformanceDashboard.noRecentBooking')}</h4>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
            {latestTransaction ? formatVnd(latestTransaction.totalPrice) : t('adminPerformanceDashboard.waitingForPaidOrders')}
          </p>
        </div>
        <CheckCircle size={36} style={{ color: 'var(--success)' }} />
      </div>

      <div className="admin-dashboard-card" style={{
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        borderColor: 'rgba(255,138,0,0.28)',
        background: 'linear-gradient(120deg, rgba(255,138,0,0.16), rgba(255,255,255,0.035))',
      }}>
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--accent)', fontWeight: 800 }}>{t('adminPerformanceDashboard.latestBranch')}</p>
          <h4 style={{ margin: 0, fontSize: 18, fontWeight: 850 }}>{latestCinema?.cinemaName || t('adminPerformanceDashboard.noCinemaActivity')}</h4>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
            {latestCinema?.cinemaLocation || t('adminPerformanceDashboard.cinemasInSystem', { count: data?.totalCinemas ?? 0 })}
          </p>
        </div>
        <button className="btn btn-primary" style={{ minWidth: 132 }}>{t('adminPerformanceDashboard.viewBranches')}</button>
      </div>
    </section>
  );
};
