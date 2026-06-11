// src/components/ManagementDashboard.tsx
// Unified dashboard with cinema dark theme

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Film,
  Calendar,
  Users,
  Building2,
  Ticket,
  DollarSign,
  Activity,
  Loader2,
} from 'lucide-react';

interface DashboardStat {
  label: string;
  value: string;
  trend?: string;
  icon: React.ReactNode;
  color: string;
}

interface ManagementDashboardProps {
  role: 'admin' | 'facilities' | 'movie' | 'theater' | 'schedule';
}

const ManagementDashboard: React.FC<ManagementDashboardProps> = ({ role }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const getStats = (): DashboardStat[] => {
    const base: DashboardStat[] = [
      {
        label: t('Total Movies'),
        value: '24',
        trend: '+3 this week',
        icon: <Film size={20} />,
        color: '#ff8a00',
      },
      {
        label: t('Active Schedules'),
        value: '156',
        trend: '+12 today',
        icon: <Calendar size={20} />,
        color: '#22c55e',
      },
      {
        label: t('Total Bookings'),
        value: '1,284',
        trend: '+18% vs last week',
        icon: <Ticket size={20} />,
        color: '#3b82f6',
      },
      {
        label: t('Revenue'),
        value: '₫ 45.6M',
        trend: '+8.3% growth',
        icon: <DollarSign size={20} />,
        color: '#a855f7',
      },
    ];

    if (role === 'admin') {
      return [
        ...base,
        {
          label: t('Active Users'),
          value: '42',
          trend: '+5 new',
          icon: <Users size={20} />,
          color: '#06b6d4',
        },
      ];
    }

    return base;
  };

  const stats = getStats();

  const shortcuts = [
    { label: t('Manage Movies'), icon: <Film size={18} />, path: '/movie-manager', color: '#ff8a00' },
    { label: t('Schedule'), icon: <Calendar size={18} />, path: '/schedule', color: '#22c55e' },
    { label: t('Theaters'), icon: <Building2 size={18} />, path: '/theater-manager', color: '#3b82f6' },
    { label: t('Facilities'), icon: <Activity size={18} />, path: '/facilities-manager', color: '#a855f7' },
  ].filter(item => {
    if (role === 'admin' && item.path === '/facilities-manager') return false;
    return true;
  });

  if (loading) {
    return (
      <div className="state-center" style={{ minHeight: 300 }}>
        <Loader2 size={28} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
          Loading dashboard...
        </span>
      </div>
    );
  }

  return (
    <div className="animate-in">
      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 32,
      }}>
        {stats.map((stat, i) => (
          <div
            key={i}
            className="glass-card"
            style={{
              padding: '20px 24px',
              animationDelay: `${i * 80}ms`,
              animation: 'fadeIn 0.4s ease-out forwards',
              opacity: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `rgba(${stat.color === '#ff8a00' ? '255, 138, 0' : stat.color === '#22c55e' ? '34, 197, 94' : stat.color === '#3b82f6' ? '59, 130, 246' : stat.color === '#a855f7' ? '168, 85, 247' : stat.color === '#06b6d4' ? '6, 182, 212' : '245, 158, 11'}, 0.1)`,
                color: stat.color,
              }}>
                {stat.icon}
              </div>
              <span style={{
                fontSize: 10, color: 'var(--text-muted)',
                fontFamily: "'JetBrains Mono', monospace",
                background: 'rgba(255,255,255,0.03)',
                padding: '2px 8px', borderRadius: 'var(--radius-full)',
              }}>
                {stat.trend}
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 4px', fontWeight: 500 }}>
              {stat.label}
            </p>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 style={{
          fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
          marginBottom: 12, letterSpacing: '-0.01em',
        }}>
          Quick Actions
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}>
          {shortcuts.map((item, i) => (
            <button
              key={i}
              onClick={() => navigate(item.path)}
              className="glass-card"
              style={{
                padding: 16, cursor: 'pointer', border: 'none',
                display: 'flex', alignItems: 'center', gap: 12,
                transition: 'all 0.2s ease',
                animation: 'fadeIn 0.4s ease-out forwards',
                opacity: 0,
                animationDelay: `${(stats.length + i) * 80}ms`,
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `rgba(${item.color === '#ff8a00' ? '255, 138, 0' : item.color === '#22c55e' ? '34, 197, 94' : item.color === '#3b82f6' ? '59, 130, 246' : '168, 85, 247'}, 0.1)`,
                color: item.color,
              }}>
                {item.icon}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManagementDashboard;
