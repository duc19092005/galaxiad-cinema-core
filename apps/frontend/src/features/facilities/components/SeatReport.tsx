import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Building2,
  Loader2,
  Monitor,
  RefreshCw,
  Users,
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useCinema } from '../../../contexts/CinemaContext';
import { facilitiesApi } from '../../../api/facilitiesApi';
import type { Auditorium, Cinema } from '../../../types/facilities.types';

interface SeatReportProps {
  /** When set, report focuses on this cinema; otherwise uses active cinema or all managed cinemas. */
  cinemaId?: string | null;
  cinemaName?: string | null;
}

const SeatReport: React.FC<SeatReportProps> = ({ cinemaId, cinemaName }) => {
  const { theme } = useTheme();
  const { activeCinemaId, activeCinemaName, managedCinemas } = useCinema();
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [auditoriums, setAuditoriums] = useState<Auditorium[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDark = theme === 'dark';
  const isModern = theme === 'modern';

  const resolvedCinemaId = cinemaId || activeCinemaId || null;
  const resolvedCinemaName =
    cinemaName ||
    activeCinemaName ||
    managedCinemas.find((c) => c.cinemaId === resolvedCinemaId)?.cinemaName ||
    null;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cinemaRes = await facilitiesApi.getCinemaList();
      const cinemaList = cinemaRes.data || [];
      setCinemas(cinemaList);

      if (resolvedCinemaId) {
        const audRes = await facilitiesApi.getAuditoriumsByCinema(resolvedCinemaId);
        setAuditoriums(audRes.data || []);
      } else {
        // Admin / no selection: aggregate auditoriums for all listed cinemas
        const all = await Promise.all(
          cinemaList.map(async (c) => {
            try {
              const res = await facilitiesApi.getAuditoriumsByCinema(c.cinemaId);
              return res.data || [];
            } catch {
              return [] as Auditorium[];
            }
          }),
        );
        setAuditoriums(all.flat());
      }
    } catch {
      setError('Không thể tải dữ liệu ghế / phòng chiếu từ máy chủ.');
      setCinemas([]);
      setAuditoriums([]);
    } finally {
      setLoading(false);
    }
  }, [resolvedCinemaId]);

  useEffect(() => {
    load();
  }, [load]);

  const scopedCinemas = useMemo(() => {
    if (resolvedCinemaId) {
      return cinemas.filter((c) => c.cinemaId === resolvedCinemaId);
    }
    return cinemas;
  }, [cinemas, resolvedCinemaId]);

  const totalRoomsFromCinemas = scopedCinemas.reduce(
    (sum, c) => sum + (c.totalRooms || 0),
    0,
  );
  const totalSeatsFromCinemas = scopedCinemas.reduce(
    (sum, c) => sum + (c.totalSeats ?? 0),
    0,
  );
  const totalSeatsFromAuditoriums = auditoriums.reduce(
    (sum, a) => sum + (a.totalSeats || 0),
    0,
  );
  // Prefer seat sum from auditorium list (detailed); fall back to cinema aggregate
  const totalSeats =
    totalSeatsFromAuditoriums > 0 ? totalSeatsFromAuditoriums : totalSeatsFromCinemas;
  const totalRooms =
    auditoriums.length > 0 ? auditoriums.length : totalRoomsFromCinemas;
  const avgSeatsPerRoom =
    totalRooms > 0 ? Math.round(totalSeats / totalRooms) : 0;
  const roomsWithSeats = auditoriums.filter((a) => (a.totalSeats || 0) > 0).length;

  const cardClass = isDark
    ? 'bg-[#1a1a20] border-[#2e2e38]'
    : isModern
      ? 'bg-[rgba(15,23,42,0.5)] border-[rgba(99,102,241,0.1)] backdrop-blur-sm'
      : 'bg-white border-gray-200';

  if (loading) {
    return (
      <div className="state-center" style={{ minHeight: 280 }}>
        <Loader2 size={28} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Đang tải báo cáo ghế…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl p-8 border text-center ${cardClass}`}>
        <AlertCircle size={32} className="mx-auto mb-3" style={{ color: 'var(--danger)' }} />
        <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>{error}</p>
        <button type="button" className="btn btn-secondary" onClick={load}>
          <RefreshCw size={14} /> Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-extrabold mb-1 border-l-4 pl-4"
            style={{ borderColor: 'var(--primary)', color: isDark || isModern ? 'var(--text-primary)' : '#09090b' }}
          >
            Báo cáo ghế (sức chứa)
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Dữ liệu thật từ phòng chiếu
            {resolvedCinemaName ? ` · ${resolvedCinemaName}` : ' · tất cả rạp được gán'}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-[0.97]"
          style={{ background: 'var(--primary)', color: '#000' }}
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Real capacity stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Tổng số ghế',
            value: totalSeats.toLocaleString('vi-VN'),
            sub: resolvedCinemaName ? 'Theo rạp đang chọn' : 'Tổng các rạp trong phạm vi',
            icon: <Users size={20} style={{ color: 'var(--primary)' }} />,
          },
          {
            label: 'Phòng chiếu',
            value: totalRooms.toLocaleString('vi-VN'),
            sub: `${roomsWithSeats} phòng đã có sơ đồ ghế`,
            icon: <Monitor size={20} style={{ color: '#3b82f6' }} />,
          },
          {
            label: 'TB ghế / phòng',
            value: avgSeatsPerRoom.toLocaleString('vi-VN'),
            sub: totalRooms === 0 ? 'Chưa có phòng' : 'Tính từ dữ liệu hiện tại',
            icon: <BarChart3 size={20} style={{ color: '#22c55e' }} />,
          },
          {
            label: 'Cụm rạp',
            value: String(scopedCinemas.length || (resolvedCinemaId ? 1 : 0)),
            sub: 'Trong phạm vi báo cáo',
            icon: <Building2 size={20} style={{ color: 'var(--text-muted)' }} />,
          },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl p-5 border ${cardClass}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
              <div className={`p-2 rounded-lg ${isModern ? 'bg-[rgba(99,102,241,0.1)]' : 'bg-[rgba(255,138,0,0.08)]'}`}>
                {item.icon}
              </div>
            </div>
            <p className={`text-2xl font-extrabold mb-1 ${isDark || isModern ? 'text-white' : 'text-gray-900'}`}>
              {item.value}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Per-cinema capacity (when viewing all) */}
      {!resolvedCinemaId && scopedCinemas.length > 0 && (
        <div className={`rounded-xl p-6 border ${cardClass}`}>
          <h2
            className="text-lg font-bold mb-5 border-l-4 pl-4"
            style={{ borderColor: 'var(--primary)', color: isDark || isModern ? 'var(--text-primary)' : '#09090b' }}
          >
            Sức chứa theo rạp
          </h2>
          <div className="space-y-3">
            {scopedCinemas.map((cinema) => (
              <div
                key={cinema.cinemaId}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border ${
                  isDark ? 'bg-[#131316] border-[#2e2e38]' : isModern ? 'bg-[rgba(15,23,42,0.3)] border-[rgba(99,102,241,0.08)]' : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div>
                  <p className={`font-bold text-sm ${isDark || isModern ? 'text-white' : 'text-gray-900'}`}>
                    {cinema.cinemaName}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {cinema.cinemaCity || cinema.cinemaLocation}
                  </p>
                </div>
                <div className="flex gap-6 mt-2 sm:mt-0 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span>
                    Phòng: <strong>{cinema.totalRooms || 0}</strong>
                  </span>
                  <span>
                    Ghế: <strong>{(cinema.totalSeats ?? 0).toLocaleString('vi-VN')}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-auditorium breakdown */}
      <div className={`rounded-xl p-6 border ${cardClass}`}>
        <h2
          className="text-lg font-bold mb-5 border-l-4 pl-4"
          style={{ borderColor: 'var(--primary)', color: isDark || isModern ? 'var(--text-primary)' : '#09090b' }}
        >
          Chi tiết theo phòng chiếu
        </h2>
        {auditoriums.length === 0 ? (
          <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
            <Monitor size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Chưa có phòng chiếu hoặc chưa gán rạp.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th className="pb-3 font-semibold">Phòng</th>
                  <th className="pb-3 font-semibold">Rạp</th>
                  <th className="pb-3 font-semibold">Định dạng</th>
                  <th className="pb-3 font-semibold text-right">Số ghế</th>
                </tr>
              </thead>
              <tbody>
                {auditoriums
                  .slice()
                  .sort((a, b) => (b.totalSeats || 0) - (a.totalSeats || 0))
                  .map((aud) => (
                    <tr
                      key={aud.auditoriumId}
                      className="border-t"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <td className="py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {aud.auditoriumNumber}
                      </td>
                      <td className="py-3" style={{ color: 'var(--text-secondary)' }}>
                        {aud.cinemaName || '—'}
                      </td>
                      <td className="py-3" style={{ color: 'var(--text-secondary)' }}>
                        {(aud.formatInfos || []).map((f) => f.formatName).join(', ') || '—'}
                      </td>
                      <td className="py-3 text-right font-bold" style={{ color: 'var(--text-primary)' }}>
                        {(aud.totalSeats || 0).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <td colSpan={3} className="pt-3 font-bold" style={{ color: 'var(--text-secondary)' }}>
                    Tổng
                  </td>
                  <td className="pt-3 text-right font-black" style={{ color: 'var(--accent)' }}>
                    {totalSeats.toLocaleString('vi-VN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        * Báo cáo hiển thị <strong>sức chứa ghế cấu hình</strong> (inventory) từ hệ thống.
        Tỷ lệ lấp đầy theo lịch sử bán vé chưa có API riêng nên không hiển thị số ảo.
      </p>
    </div>
  );
};

export default SeatReport;
