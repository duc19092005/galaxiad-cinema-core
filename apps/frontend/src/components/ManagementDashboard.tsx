// src/components/ManagementDashboard.tsx
// Unified dashboard with live management metrics.

import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';
import type { ManagementDashboardDto } from '../types/admin.types';
import { showError } from '../utils/ToastUtils';
import { useCinema } from '../contexts/CinemaContext';

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

const formatNumber = (value?: number | null) => (value ?? 0).toLocaleString('vi-VN');

const formatVnd = (value?: number | null) => {
  const amount = value ?? 0;
  if (Math.abs(amount) >= 1_000_000_000) return `VND ${(amount / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}B`;
  if (Math.abs(amount) >= 1_000_000) return `VND ${(amount / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}M`;
  return `VND ${amount.toLocaleString('vi-VN')}`;
};

const colorToRgb = (color: string) => {
  switch (color) {
    case '#ff8a00': return '255, 138, 0';
    case '#22c55e': return '34, 197, 94';
    case '#3b82f6': return '59, 130, 246';
    case '#a855f7': return '168, 85, 247';
    case '#06b6d4': return '6, 182, 212';
    default: return '245, 158, 11';
  }
};

const ManagementDashboard: React.FC<ManagementDashboardProps> = ({ role }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeCinemaId } = useCinema();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<ManagementDashboardDto | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getManagementDashboard(activeCinemaId || undefined);
      setDashboard(response.data || null);
    } catch (err) {
      const message = 'Unable to load dashboard metrics.';
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [activeCinemaId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = useMemo<DashboardStat[]>(() => {
    const base: DashboardStat[] = [
      {
        label: t('Total Movies'),
        value: formatNumber(dashboard?.activeMovies),
        trend: t('Active only'),
        icon: <Film size={20} />,
        color: '#ff8a00',
      },
      {
        label: t('Active Schedules'),
        value: formatNumber(dashboard?.activeSchedules),
        trend: t('Active only'),
        icon: <Calendar size={20} />,
        color: '#22c55e',
      },
      {
        label: t('Total Bookings'),
        value: formatNumber(dashboard?.totalBookings),
        trend: t('Paid tickets'),
        icon: <Ticket size={20} />,
        color: '#3b82f6',
      },
      {
        label: t('Revenue'),
        value: formatVnd(dashboard?.monthRevenue),
        trend: t('This month'),
        icon: <DollarSign size={20} />,
        color: '#a855f7',
      },
    ];

    if (role === 'admin') {
      return [
        ...base,
        {
          label: t('Active Users'),
          value: formatNumber(dashboard?.activeUsers),
          trend: t('Live data'),
          icon: <Users size={20} />,
          color: '#06b6d4',
        },
      ];
    }

    return base;
  }, [dashboard, role, t]);

  const shortcuts = [
    { label: t('Manage Movies'), icon: <Film size={18} />, path: '/movie-manager', color: '#ff8a00' },
    { label: t('sidebar.schedule', 'Lịch chiếu'), icon: <Calendar size={18} />, path: '/schedule', color: '#22c55e' },
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

  if (error) {
    return (
      <div className="glass-card state-center" style={{ minHeight: 300, padding: 24 }}>
        <AlertCircle size={28} style={{ color: 'var(--danger)' }} />
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{error}</p>
        <button className="btn btn-secondary" onClick={loadDashboard}>
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 32,
      }}>
        {stats.map((stat, i) => (
          <div
            key={stat.label}
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
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `rgba(${colorToRgb(stat.color)}, 0.1)`,
                color: stat.color,
              }}>
                {stat.icon}
              </div>
              <span style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                fontFamily: "'JetBrains Mono', monospace",
                background: 'rgba(255,255,255,0.03)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
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

      <div>
        <h3 style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 12,
          letterSpacing: '-0.01em',
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
              key={item.path}
              onClick={() => navigate(item.path)}
              className="glass-card"
              style={{
                padding: 16,
                cursor: 'pointer',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.2s ease',
                animation: 'fadeIn 0.4s ease-out forwards',
                opacity: 0,
                animationDelay: `${(stats.length + i) * 80}ms`,
              }}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `rgba(${colorToRgb(item.color)}, 0.1)`,
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
