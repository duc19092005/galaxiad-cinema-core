import React, { useState } from 'react';
import { BarChart3, Download, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

const SeatReport: React.FC = () => {
  const { theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const isDark = theme === 'dark';
  const isModern = theme === 'modern';

  const reports = [
    { id: 1, period: 'Tháng 12/2024', totalSeats: 5000, availableSeats: 3500, occupiedSeats: 1500, utilizationRate: 30, status: 'good' },
    { id: 2, period: 'Tháng 11/2024', totalSeats: 5000, availableSeats: 2800, occupiedSeats: 2200, utilizationRate: 44, status: 'good' },
    { id: 3, period: 'Tháng 10/2024', totalSeats: 5000, availableSeats: 3200, occupiedSeats: 1800, utilizationRate: 36, status: 'warning' },
  ];
  const currentReport = reports[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-extrabold mb-1 border-l-4 pl-4`}
              style={{ borderColor: 'var(--primary)', color: isDark || isModern ? 'var(--text-primary)' : '#09090b' }}>
            Báo Cáo Ghế
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Theo dõi và phân tích tình trạng sử dụng ghế
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input h-9 text-xs cursor-pointer"
          >
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
            <option value="quarter">Quý này</option>
            <option value="year">Năm nay</option>
          </select>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-[0.97]"
            style={{ background: 'var(--primary)', color: '#000' }}
          >
            <Download className="w-4 h-4" />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng số ghế', value: currentReport.totalSeats.toLocaleString(), sub: 'Tất cả các rạp', icon: <BarChart3 size={20} style={{ color: 'var(--primary)' }} />, change: null },
          { label: 'Ghế trống', value: currentReport.availableSeats.toLocaleString(), sub: '+5% so với tháng trước', icon: <TrendingUp size={20} style={{ color: '#22c55e' }} />, change: 'up' },
          { label: 'Ghế đã sử dụng', value: currentReport.occupiedSeats.toLocaleString(), sub: '-2% so với tháng trước', icon: <TrendingDown size={20} style={{ color: '#ef4444' }} />, change: 'down' },
          { label: 'Tỷ lệ sử dụng', value: `${currentReport.utilizationRate}%`, sub: null, icon: <Calendar size={20} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />, change: null },
        ].map((item, idx) => (
          <div key={idx}
            className={`rounded-xl p-5 border ${isDark ? 'bg-[#1a1a20] border-[#2e2e38]' : isModern ? 'bg-[rgba(15,23,42,0.5)] border-[rgba(99,102,241,0.1)] backdrop-blur-sm' : 'bg-white border-gray-200'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
              <div className={`p-2 rounded-lg ${isModern ? 'bg-[rgba(99,102,241,0.1)]' : 'bg-[rgba(255,138,0,0.08)]'}`}>{item.icon}</div>
            </div>
            <p className={`text-2xl font-extrabold mb-1 ${isDark || isModern ? 'text-white' : 'text-gray-900'}`}>
              {item.value}
            </p>
            {item.sub && (
              <p className="text-xs" style={{ color: idx === 1 ? '#22c55e' : idx === 2 ? '#ef4444' : 'var(--text-muted)' }}>
                {item.sub}
              </p>
            )}
            {idx === 3 && (
              <div className={`w-full rounded-full h-2 mt-3 ${isDark ? 'bg-[#2e2e38]' : 'bg-gray-200'}`}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${currentReport.utilizationRate}%`, background: 'var(--primary)' }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Historical Reports */}
      <div className={`rounded-xl p-6 border ${isDark ? 'bg-[#1a1a20] border-[#2e2e38]' : isModern ? 'bg-[rgba(15,23,42,0.5)] border-[rgba(99,102,241,0.1)] backdrop-blur-sm' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-lg font-bold mb-5 border-l-4 pl-4`}
            style={{ borderColor: 'var(--primary)', color: isDark || isModern ? 'var(--text-primary)' : '#09090b' }}>
          Lịch Sử Báo Cáo
        </h2>
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id}
              className={`flex flex-col lg:flex-row lg:items-center justify-between p-5 rounded-2xl border transition-all duration-200 ${
                isDark
                  ? 'bg-[#131316] border-[#2e2e38] hover:border-[rgba(255,138,0,0.2)]'
                  : isModern
                    ? 'bg-[rgba(15,23,42,0.3)] border-[rgba(99,102,241,0.08)] hover:border-[rgba(99,102,241,0.2)]'
                    : 'bg-white border-gray-100 hover:border-orange-300 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3 lg:mb-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    isModern ? 'bg-[rgba(99,102,241,0.1)]' : 'bg-[rgba(255,138,0,0.1)]'
                  }`}>
                    <Calendar className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className={`font-bold text-sm ${isDark || isModern ? 'text-white' : 'text-gray-900'}`}>
                        {report.period}
                      </h3>
                      {report.status === 'warning' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          Cần Chú Ý
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Tổng: <strong className={isDark || isModern ? 'text-gray-300' : 'text-gray-700'}>{report.totalSeats.toLocaleString()}</strong>
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Đã dùng: <strong className={isDark || isModern ? 'text-gray-300' : 'text-gray-700'}>{report.occupiedSeats.toLocaleString()}</strong>
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Hiệu suất: <strong className={report.utilizationRate > 40 ? 'text-emerald-500' : 'text-amber-500'}>{report.utilizationRate}%</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 self-end lg:self-center">
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: isModern ? 'rgba(99,102,241,0.1)' : 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                    border: `1px solid ${isModern ? 'rgba(99,102,241,0.15)' : 'var(--border-color)'}`,
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải Xuống
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className={`rounded-xl p-6 border ${isDark ? 'bg-[#1a1a20] border-[#2e2e38]' : isModern ? 'bg-[rgba(15,23,42,0.5)] border-[rgba(99,102,241,0.1)] backdrop-blur-sm' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-lg font-bold mb-5 border-l-4 pl-4`}
            style={{ borderColor: 'var(--primary)', color: isDark || isModern ? 'var(--text-primary)' : '#09090b' }}>
          Biểu Đồ Sử Dụng Ghế
        </h2>
        <div className={`h-64 flex items-center justify-center rounded-lg border ${isDark ? 'bg-[#131316] border-[#2e2e38]' : isModern ? 'bg-[rgba(15,23,42,0.3)] border-[rgba(99,102,241,0.08)]' : 'bg-gray-50 border-gray-200'}`}>
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-2" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Biểu đồ sẽ được hiển thị ở đây
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatReport;
