import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search } from 'lucide-react';
import type { AuditLogDto } from '../../../types/admin.types';

export interface AuditSectionProps {
  auditLogs: AuditLogDto[];
  loading: boolean;
  onRefresh: () => void;
}

export const AuditSection: React.FC<AuditSectionProps> = ({ auditLogs, loading, onRefresh }) => {
  const { t } = useTranslation();

  // Filter States
  const [selectedEntityCategory, setSelectedEntityCategory] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Helper to categorize entity types for better UX and filtering
  const categorizeEntity = (entityType: string): string => {
    const type = (entityType || '').toLowerCase();
    if (type.includes('user') || type.includes('role') || type.includes('permission')) return 'User & Auth';
    if (type.includes('showtime') || type.includes('schedule') || type.includes('slot')) return 'Showtime & Schedule';
    if (type.includes('movie') || type.includes('film')) return 'Movie';
    if (type.includes('cinema') || type.includes('facility') || type.includes('auditorium') || type.includes('room') || type.includes('department')) return 'Cinema & Facility';
    if (type.includes('voucher') || type.includes('promotion') || type.includes('discount')) return 'Voucher & Promo';
    if (type.includes('pricing') || type.includes('price')) return 'Pricing Rules';
    if (type.includes('booking') || type.includes('ticket') || type.includes('order') || type.includes('transaction')) return 'Booking & Sales';
    if (type.includes('shift') || type.includes('work') || type.includes('staff')) return 'Staff & Shifts';
    return 'Other';
  };

  const getEntityBadgeStyle = (category: string) => {
    switch (category) {
      case 'User & Auth':
        return { color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.12)' };
      case 'Movie':
        return { color: '#f472b6', bg: 'rgba(244, 114, 182, 0.12)' };
      case 'Showtime & Schedule':
        return { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)' };
      case 'Cinema & Facility':
        return { color: '#60a5fa', bg: 'rgba(96, 165, 251, 0.12)' };
      case 'Voucher & Promo':
        return { color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' };
      case 'Pricing Rules':
        return { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)' };
      case 'Booking & Sales':
        return { color: '#22d3ee', bg: 'rgba(34, 211, 238, 0.12)' };
      case 'Staff & Shifts':
        return { color: '#fb923c', bg: 'rgba(251, 146, 60, 0.12)' };
      default:
        return { color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.12)' };
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEntityCategory, startDate, endDate, searchQuery]);

  // Filter logs locally
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // 1. Filter by category
      if (selectedEntityCategory !== 'all') {
        const cat = categorizeEntity(log.entityType);
        if (cat !== selectedEntityCategory) return false;
      }

      // 2. Filter by Start Date
      if (startDate) {
        const logDate = new Date(log.createdAt);
        const start = new Date(startDate + 'T00:00:00');
        if (logDate < start) return false;
      }

      // 3. Filter by End Date
      if (endDate) {
        const logDate = new Date(log.createdAt);
        const end = new Date(endDate + 'T23:59:59');
        if (logDate > end) return false;
      }

      // 4. Filter by Actor or Note Search Query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const actor = (log.actorName || '').toLowerCase();
        const desc = (log.description || '').toLowerCase();
        const entity = (log.entityName || '').toLowerCase();
        if (!actor.includes(query) && !desc.includes(query) && !entity.includes(query)) return false;
      }

      return true;
    });
  }, [auditLogs, selectedEntityCategory, startDate, endDate, searchQuery]);

  // Paginated logs
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));

  const handleClearFilters = () => {
    setSelectedEntityCategory('all');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  const categories = [
    'User & Auth',
    'Movie',
    'Showtime & Schedule',
    'Cinema & Facility',
    'Voucher & Promo',
    'Pricing Rules',
    'Booking & Sales',
    'Staff & Shifts',
    'Other'
  ];

  return (
    <div className="animate-in" style={{ display: 'grid', gap: 16 }}>
      {/* Title Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('Audit Log')}</h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{t('System activity and security events')}</p>
        </div>
        <button className="btn btn-secondary" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={14} style={{ marginRight: 6, animation: loading ? 'spin 1s linear infinite' : undefined }} />
          {t('Refresh')}
        </button>
      </div>

      {/* Filter Control Bar */}
      <div style={{
        padding: 16,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
        alignItems: 'end'
      }}>
        {/* Search */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Search</span>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search actor, target, note..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input"
              style={{ width: '100%', paddingLeft: 34, fontSize: 13, minHeight: 38 }}
            />
          </div>
        </label>

        {/* Entity Type Filter */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Entity Category</span>
          <select
            value={selectedEntityCategory}
            onChange={e => setSelectedEntityCategory(e.target.value)}
            className="input select"
            style={{ width: '100%', fontSize: 13, minHeight: 38 }}
          >
            <option value="all">All Entities</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </label>

        {/* Start Date */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>From Date</span>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="input"
            style={{ width: '100%', fontSize: 13, minHeight: 38 }}
          />
        </label>

        {/* End Date */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>To Date</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="input"
            style={{ width: '100%', fontSize: 13, minHeight: 38 }}
          />
        </label>

        {/* Reset Button */}
        {(selectedEntityCategory !== 'all' || startDate || endDate || searchQuery) && (
          <button
            className="btn btn-secondary"
            onClick={handleClearFilters}
            style={{ height: 38, fontSize: 13, width: '100%' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Main Logs Table */}
      <div className="table-container" style={{ margin: 0 }}>
        {loading ? (
          <div className="state-center" style={{ minHeight: '30vh' }}>
            <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              {t('Loading audit logs...')}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th style={{ width: '160px' }}>{t('Time')}</th>
                <th style={{ width: '110px' }}>{t('Action')}</th>
                <th style={{ width: '380px' }}>{t('Target / Entity')}</th>
                <th style={{ width: '180px' }}>{t('Actor')}</th>
                <th>{t('Note')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log) => {
                const actionColor =
                  log.action === 'Delete' ? 'var(--danger)' :
                  log.action === 'Create' ? 'var(--success)' :
                  '#3b82f6';
                const actionBg =
                  log.action === 'Delete' ? 'rgba(239, 68, 68, 0.1)' :
                  log.action === 'Create' ? 'rgba(34, 197, 94, 0.1)' :
                  'rgba(59, 130, 246, 0.1)';

                const entityCategory = categorizeEntity(log.entityType);
                const badgeStyle = getEntityBadgeStyle(entityCategory);

                return (
                  <tr key={log.auditLogId}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                      {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : 'N/A'}
                    </td>
                    <td>
                      <span className="badge" style={{ color: actionColor, background: actionBg, borderColor: `${actionColor}33`, fontWeight: 600 }}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, wordBreak: 'break-word', maxWidth: '360px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.entityName || 'N/A'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                            color: badgeStyle.color,
                            background: badgeStyle.bg,
                            border: `1px solid ${badgeStyle.color}25`
                          }}>
                            {entityCategory}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                            {log.entityType}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.actorName}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                          {log.isAdminAction ? t('Admin Action') : log.actorPrimaryRole}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.4 }}>
                      {log.description}
                    </td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {t('No audit logs match selected filters.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && filteredLogs.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 12,
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Showing <strong>{Math.min(filteredLogs.length, (currentPage - 1) * itemsPerPage + 1)}</strong> to{' '}
            <strong>{Math.min(filteredLogs.length, currentPage * itemsPerPage)}</strong> of{' '}
            <strong>{filteredLogs.length}</strong> entries
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Prev Button */}
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ padding: '6px 12px', minHeight: 32, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <ChevronLeft size={14} />
              Prev
            </button>

            {/* Current / Total pages indicator */}
            <div style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-color)',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--accent)',
              fontFamily: "'JetBrains Mono', monospace"
            }}>
              {currentPage} / {totalPages}
            </div>

            {/* Next Button */}
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: '6px 12px', minHeight: 32, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
