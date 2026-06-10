// src/components/ManagementDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Activity, Building2, Clock, Film, Loader2, ReceiptText, Star, Ticket } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import type { ManagementDashboardDto } from '../types/admin.types';
import { formatVietnamDateTime } from '../utils/dateTimeUtils';

interface ManagementDashboardProps {
  role: 'theater' | 'movie' | 'facilities';
}

const ManagementDashboard: React.FC<ManagementDashboardProps> = ({ role }) => {
  const [dashboard, setDashboard] = useState<ManagementDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true); setError(null);
      try {
        const res = await adminApi.getManagementDashboard();
        setDashboard(res.data || null);
      } catch {
        setError('Cannot load dashboard statistics.');
      } finally { setLoading(false); }
    };
    fetch();
  }, []);

  const formatMoney = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);

  const formatDate = formatVietnamDateTime;

  if (loading) {
    return (
      <div className="state-center" style={{ minHeight: 200 }}>
        <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="card" style={{ padding: 'var(--space-4)' }}>
        <p className="text-sm text-danger">
          {error || 'Dashboard data is unavailable.'}
        </p>
      </div>
    );
  }

  const maxMovieTickets = Math.max(...dashboard.ticketsByMovie.map(m => m.ticketsSold), 1);
  const maxHourlyTickets = Math.max(...dashboard.ticketsByHour.map(h => h.ticketsSold), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard title="Tickets today" value={dashboard.ticketsSoldToday.toLocaleString()} icon={Ticket} />
        <StatCard title="Revenue today" value={formatMoney(dashboard.revenueToday)} icon={ReceiptText} />
        <StatCard title="Total tickets" value={dashboard.totalTicketsSold.toLocaleString()} icon={Activity} />
        <StatCard title="Busiest hour" value={dashboard.busiestHourLabel} icon={Clock} />
      </div>

      {(role === 'theater' || role === 'facilities') && (
        <SectionGrid>
          <SectionCard title="Recent transactions">
            {dashboard.recentTransactions.length === 0 ? (
              <EmptyState />
            ) : (
              dashboard.recentTransactions.map(item => (
                <ListItem key={item.orderId}>
                  <div>
                    <p className="text-body" style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{item.movieName}</p>
                    <p className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
                      {item.cinemaName} &bull; {item.ticketCount} tickets &bull; {item.customerName}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ color: 'var(--success)', fontWeight: 500, fontSize: 'var(--text-sm)' }}>
                      {formatMoney(item.totalPrice)}
                    </p>
                    <p className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
                      {formatDate(item.orderDate)}
                    </p>
                  </div>
                </ListItem>
              ))
            )}
          </SectionCard>

          <SectionCard title="Tickets by movie">
            <BarList rows={dashboard.ticketsByMovie.map(m => ({
              id: m.movieId, label: m.movieName, value: m.ticketsSold,
              sub: formatMoney(m.revenue), max: maxMovieTickets,
            }))} />
          </SectionCard>

          <SectionCard title="Busiest hours">
            <BarList rows={dashboard.ticketsByHour.map(h => ({
              id: h.hour.toString(), label: h.hourLabel, value: h.ticketsSold,
              sub: 'tickets', max: maxHourlyTickets,
            }))} />
          </SectionCard>

          <SectionCard title="Recent activities">
            <ActivityList items={dashboard.recentActivities} />
          </SectionCard>
        </SectionGrid>
      )}

      {role === 'movie' && (
        <SectionGrid>
          <SectionCard title="Hot movies">
            {dashboard.hotMovies.length === 0 ? (
              <EmptyState />
            ) : (
              dashboard.hotMovies.map(movie => (
                <ListItem key={movie.movieId}>
                  <img
                    src={movie.movieImageUrl}
                    alt={movie.movieName}
                    style={{
                      width: 40, height: 56, objectFit: 'cover', borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-hover)',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="text-body" style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{movie.movieName}</p>
                    <p className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
                      {movie.ticketsSold} tickets &bull; {formatMoney(movie.revenue)}
                    </p>
                  </div>
                  <Star size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                </ListItem>
              ))
            )}
          </SectionCard>

          <SectionCard title="Recently added movies">
            {dashboard.recentMovies.length === 0 ? (
              <EmptyState />
            ) : (
              dashboard.recentMovies.map(movie => (
                <ListItem key={movie.movieId}>
                  <Film size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <div>
                    <p className="text-body" style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{movie.movieName}</p>
                    <p className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
                      Added by {movie.createdBy} &bull; {formatDate(movie.createdAt)}
                    </p>
                  </div>
                </ListItem>
              ))
            )}
          </SectionCard>
        </SectionGrid>
      )}

      {role === 'facilities' && (
        <SectionGrid>
          <SectionCard title="Recently added cinemas">
            {dashboard.recentCinemas.length === 0 ? (
              <EmptyState />
            ) : (
              dashboard.recentCinemas.map(cinema => (
                <ListItem key={cinema.cinemaId}>
                  <Building2 size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <div>
                    <p className="text-body" style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{cinema.cinemaName}</p>
                    <p className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
                      {cinema.cinemaLocation} &bull; {formatDate(cinema.createdAt)}
                    </p>
                  </div>
                </ListItem>
              ))
            )}
          </SectionCard>

          <SectionCard title="Recently added facilities">
            {dashboard.recentAuditoriums.length === 0 ? (
              <EmptyState />
            ) : (
              dashboard.recentAuditoriums.map(auditorium => (
                <ListItem key={auditorium.auditoriumId}>
                  <Film size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <div>
                    <p className="text-body" style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{auditorium.auditoriumNumber}</p>
                    <p className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
                      {auditorium.cinemaName} &bull; {formatDate(auditorium.createdAt)}
                    </p>
                  </div>
                </ListItem>
              ))
            )}
          </SectionCard>
        </SectionGrid>
      )}
    </div>
  );

  // --- Internal sub-components ---
  function StatCard({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType }) {
    return (
      <div className="card card-hover" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
          <div>
            <p className="text-muted" style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-1)' }}>
              {title}
            </p>
            <p className="heading-lg" style={{ margin: 0 }}>{value}</p>
          </div>
          <div style={{
            width: 36, height: 36,
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'var(--accent-soft)',
            flexShrink: 0,
          }}>
            <Icon size={16} style={{ color: 'var(--accent)' }} />
          </div>
        </div>
      </div>
    );
  }

  function BarList({ rows }: { rows: Array<{ id: string; label: string; value: number; sub: string; max: number }> }) {
    if (rows.length === 0) return <EmptyState />;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {rows.map(row => (
          <div key={row.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
              <span className="text-body" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{row.label}</span>
              <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>{row.value} {row.sub}</span>
            </div>
            <div style={{
              height: 6, borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-elevated)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--accent)',
                width: `${Math.max(4, (row.value / row.max) * 100)}%`,
                transition: 'width 500ms var(--ease)',
              }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  function ActivityList({ items }: { items: ManagementDashboardDto['recentActivities'] }) {
    if (items.length === 0) return <EmptyState />;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {items.map(item => (
          <div key={item.auditLogId} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-3)' }}>
            <p className="text-body" style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>
              {item.action} {item.entityType}: {item.entityName || 'N/A'}
            </p>
            <p className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
              {item.isAdminAction ? `Admin action by ${item.actorName}` : item.actorName} &bull; {formatDate(item.createdAt)}
            </p>
          </div>
        ))}
      </div>
    );
  }
};

// Shared helpers
function SectionGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'var(--space-6)' }}>
      {children}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card card-hover" style={{ padding: 'var(--space-5)' }}>
      <h3 className="heading-md section-header" style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
      borderBottom: '1px solid var(--border)',
      paddingBottom: 'var(--space-3)',
      marginBottom: 'var(--space-3)',
    }}>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
      No data available.
    </p>
  );
}

export default ManagementDashboard;
