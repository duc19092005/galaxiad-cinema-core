import React, { useEffect, useState } from 'react';
import { Activity, Building2, Clock, Film, Loader2, ReceiptText, Star, Ticket } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { useTheme } from '../contexts/ThemeContext';
import type { ManagementDashboardDto } from '../types/admin.types';
import { formatVietnamDateTime } from '../utils/dateTimeUtils';

interface ManagementDashboardProps {
  role: 'theater' | 'movie' | 'facilities';
}

const ManagementDashboard: React.FC<ManagementDashboardProps> = ({ role }) => {
  const { theme } = useTheme();
  const [dashboard, setDashboard] = useState<ManagementDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminApi.getManagementDashboard();
        setDashboard(res.data || null);
      } catch {
        setError('Cannot load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const panelClass = `rounded-xl p-5 border ${
    theme === 'dark'
      ? 'bg-gray-900 border-gray-800'
      : theme === 'modern'
        ? 'bg-gradient-to-br from-[#15102B]/80 border-indigo-500/20 shadow-sm text-white'
        : 'bg-white border-gray-200 shadow-sm'
  }`;

  const mutedText = theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white/70' : 'text-gray-600';
  const titleText = theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900';

  const formatMoney = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);

  const formatDate = formatVietnamDateTime;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (error || !dashboard) {
    return <div className={`${panelClass} text-sm text-red-400`}>{error || 'Dashboard data is unavailable.'}</div>;
  }

  const maxMovieTickets = Math.max(...dashboard.ticketsByMovie.map((m) => m.ticketsSold), 1);
  const maxHourlyTickets = Math.max(...dashboard.ticketsByHour.map((h) => h.ticketsSold), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Tickets Today" value={dashboard.ticketsSoldToday.toLocaleString()} icon={Ticket} />
        <StatCard title="Revenue Today" value={formatMoney(dashboard.revenueToday)} icon={ReceiptText} />
        <StatCard title="Total Tickets" value={dashboard.totalTicketsSold.toLocaleString()} icon={Activity} />
        <StatCard title="Busiest Hour" value={dashboard.busiestHourLabel} icon={Clock} />
      </div>

      {(role === 'theater' || role === 'facilities') && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className={panelClass}>
            <h2 className={`text-lg font-black mb-4 ${titleText}`}>Recent Transactions</h2>
            <div className="space-y-3">
              {dashboard.recentTransactions.length === 0 ? (
                <p className={`text-sm ${mutedText}`}>No recent transactions.</p>
              ) : (
                dashboard.recentTransactions.map((item) => (
                  <div key={item.orderId} className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0">
                    <div className="min-w-0">
                      <p className={`font-bold truncate ${titleText}`}>{item.movieName}</p>
                      <p className={`text-xs ${mutedText}`}>{item.cinemaName} • {item.ticketCount} tickets • {item.customerName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-emerald-400">{formatMoney(item.totalPrice)}</p>
                      <p className={`text-xs ${mutedText}`}>{formatDate(item.orderDate)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className={panelClass}>
            <h2 className={`text-lg font-black mb-4 ${titleText}`}>Tickets By Movie</h2>
            <BarList
              rows={dashboard.ticketsByMovie.map((m) => ({
                id: m.movieId,
                label: m.movieName,
                value: m.ticketsSold,
                sub: formatMoney(m.revenue),
                max: maxMovieTickets,
              }))}
            />
          </section>

          <section className={panelClass}>
            <h2 className={`text-lg font-black mb-4 ${titleText}`}>Busiest Hours</h2>
            <BarList
              rows={dashboard.ticketsByHour.map((h) => ({
                id: h.hour.toString(),
                label: h.hourLabel,
                value: h.ticketsSold,
                sub: 'tickets',
                max: maxHourlyTickets,
              }))}
            />
          </section>

          <section className={panelClass}>
            <h2 className={`text-lg font-black mb-4 ${titleText}`}>Recent Activities</h2>
            <ActivityList items={dashboard.recentActivities} />
          </section>
        </div>
      )}

      {role === 'movie' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className={panelClass}>
            <h2 className={`text-lg font-black mb-4 ${titleText}`}>Hot Movies</h2>
            <div className="space-y-3">
              {dashboard.hotMovies.length === 0 ? (
                <p className={`text-sm ${mutedText}`}>No ticket data yet.</p>
              ) : (
                dashboard.hotMovies.map((movie) => (
                  <div key={movie.movieId} className="flex items-center gap-3 border-b border-white/10 pb-3 last:border-b-0">
                    <img src={movie.movieImageUrl} alt={movie.movieName} className="w-12 h-16 object-cover rounded-md bg-black/20" />
                    <div className="min-w-0 flex-1">
                      <p className={`font-bold truncate ${titleText}`}>{movie.movieName}</p>
                      <p className={`text-xs ${mutedText}`}>{movie.ticketsSold} tickets • {formatMoney(movie.revenue)}</p>
                    </div>
                    <Star className="w-5 h-5 text-amber-400" />
                  </div>
                ))
              )}
            </div>
          </section>

          <section className={panelClass}>
            <h2 className={`text-lg font-black mb-4 ${titleText}`}>Recently Added Movies</h2>
            <div className="space-y-3">
              {dashboard.recentMovies.map((movie) => (
                <div key={movie.movieId} className="flex items-center gap-3 border-b border-white/10 pb-3 last:border-b-0">
                  <Film className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div className="min-w-0">
                    <p className={`font-bold truncate ${titleText}`}>{movie.movieName}</p>
                    <p className={`text-xs ${mutedText}`}>Added by {movie.createdBy} • {formatDate(movie.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {role === 'facilities' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className={panelClass}>
            <h2 className={`text-lg font-black mb-4 ${titleText}`}>Recently Added Cinemas</h2>
            <div className="space-y-3">
              {dashboard.recentCinemas.map((cinema) => (
                <div key={cinema.cinemaId} className="flex items-center gap-3 border-b border-white/10 pb-3 last:border-b-0">
                  <Building2 className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div className="min-w-0">
                    <p className={`font-bold truncate ${titleText}`}>{cinema.cinemaName}</p>
                    <p className={`text-xs ${mutedText}`}>{cinema.cinemaLocation} • {formatDate(cinema.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={panelClass}>
            <h2 className={`text-lg font-black mb-4 ${titleText}`}>Recently Added Facilities</h2>
            <div className="space-y-3">
              {dashboard.recentAuditoriums.map((auditorium) => (
                <div key={auditorium.auditoriumId} className="flex items-center gap-3 border-b border-white/10 pb-3 last:border-b-0">
                  <Film className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div className="min-w-0">
                    <p className={`font-bold truncate ${titleText}`}>{auditorium.auditoriumNumber}</p>
                    <p className={`text-xs ${mutedText}`}>{auditorium.cinemaName} • {formatDate(auditorium.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );

  function StatCard({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType }) {
    return (
      <div className={panelClass}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className={`text-xs font-black uppercase tracking-widest ${mutedText}`}>{title}</p>
            <p className={`text-2xl font-black mt-2 ${titleText}`}>{value}</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    );
  }

  function BarList({ rows }: { rows: Array<{ id: string; label: string; value: number; sub: string; max: number }> }) {
    if (rows.length === 0) return <p className={`text-sm ${mutedText}`}>No data available.</p>;

    return (
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.id}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className={`font-bold truncate ${titleText}`}>{row.label}</span>
              <span className={mutedText}>{row.value} {row.sub}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-500/20 overflow-hidden">
              <div className="h-full rounded-full bg-red-600" style={{ width: `${Math.max(6, (row.value / row.max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  function ActivityList({ items }: { items: ManagementDashboardDto['recentActivities'] }) {
    if (items.length === 0) return <p className={`text-sm ${mutedText}`}>No recent activity.</p>;

    return (
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.auditLogId} className="border-b border-white/10 pb-3 last:border-b-0">
            <p className={`font-bold ${titleText}`}>{item.action} {item.entityType}: {item.entityName || 'N/A'}</p>
            <p className={`text-xs ${item.isAdminAction ? 'text-amber-400' : mutedText}`}>
              {item.isAdminAction ? `Admin action by ${item.actorName}` : item.actorName} • {formatDate(item.createdAt)}
            </p>
          </div>
        ))}
      </div>
    );
  }
};

export default ManagementDashboard;
