import React, { useMemo, useState } from 'react';
import {
  Building2,
  Loader2,
  Search,
  UserCircle,
  UserPlus,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AdminUserDto } from '../../../types/admin.types';
import type { Cinema } from '../../../types/facilities.types';
import {
  CINEMA_FILTER_NONE,
  filterAndSortUsers,
  filterUsersBySegment,
  parseRoles,
  type StaffRoleFilter,
  type UserSegment,
  type UserSortOrder,
} from '../../../utils/adminUserFilters';

// ─── Small UI bits (kept local to avoid coupling to AdminPage) ───────────────

const isAccountActive = (status: AdminUserDto['accountStatus']) => {
  if (typeof status === 'number') return status === 1;
  return String(status).toLowerCase() === 'active';
};

const getAccountStatusLabel = (status: AdminUserDto['accountStatus']) => {
  if (isAccountActive(status)) return 'Active';
  if (typeof status === 'string') return status;
  if (status === 0) return 'Pending';
  if (status === 2) return 'Banned';
  return 'Locked';
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const color =
    status === 'Active' || status === 'Success'
      ? 'var(--success)'
      : status === 'Pending'
        ? '#f59e0b'
        : 'var(--danger)';

  const bg =
    status === 'Active' || status === 'Success'
      ? 'rgba(34, 197, 94, 0.1)'
      : status === 'Pending'
        ? 'rgba(245, 158, 11, 0.1)'
        : 'rgba(239, 68, 68, 0.1)';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "'JetBrains Mono', monospace",
        background: bg,
        color,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
      {status}
    </span>
  );
};

const UserPortrait: React.FC<{ src?: string | null; name?: string; size?: number }> = ({
  src,
  name,
  size = 32,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      overflow: 'hidden',
      background: 'var(--accent-soft)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      border: '1px solid var(--border-color)',
    }}
  >
    {src ? (
      <img
        src={src}
        alt={name ? `${name} portrait` : 'User portrait'}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    ) : (
      <UserCircle size={Math.max(16, size * 0.52)} style={{ color: 'var(--accent)' }} />
    )}
  </div>
);

const roleBadgeClass = (role: string) => {
  const r = role.trim();
  if (r === 'Admin') return 'badge badge-accent';
  if (r === 'MovieManager' || r === 'TheaterManager' || r === 'FacilitiesManager') {
    return 'badge badge-warning';
  }
  return 'badge badge-success';
};

// ─── Props ───────────────────────────────────────────────────────────────────

export interface UsersSectionProps {
  users: AdminUserDto[];
  loading: boolean;
  cinemas?: Cinema[];
  onEditUser: (user: AdminUserDto) => void;
  onCreateUser: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

const UsersSection: React.FC<UsersSectionProps> = ({
  users,
  loading,
  cinemas = [],
  onEditUser,
  onCreateUser,
}) => {
  const { t } = useTranslation();
  const [segment, setSegment] = useState<UserSegment>('staff');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRoleFilter>('');
  const [cinemaFilter, setCinemaFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<UserSortOrder>('nameAsc');

  const customerCount = useMemo(
    () => filterUsersBySegment(users, 'customers').length,
    [users],
  );
  const staffCount = useMemo(
    () => filterUsersBySegment(users, 'staff').length,
    [users],
  );

  const cinemaOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of cinemas) {
      if (c.cinemaId) map.set(c.cinemaId, c.cinemaName || c.cinemaId);
    }
    for (const u of users) {
      if (u.cinemaId && !map.has(u.cinemaId)) {
        map.set(u.cinemaId, u.cinemaName || u.cinemaId);
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'vi'));
  }, [cinemas, users]);

  const filteredAndSorted = useMemo(
    () =>
      filterAndSortUsers({
        users,
        segment,
        searchQuery,
        cinemaFilter: segment === 'staff' ? cinemaFilter : '',
        roleFilter: segment === 'staff' ? roleFilter : '',
        sortOrder,
      }),
    [users, segment, searchQuery, cinemaFilter, roleFilter, sortOrder],
  );

  const handleSegmentChange = (next: UserSegment) => {
    setSegment(next);
    setSearchQuery('');
    setRoleFilter('');
    setCinemaFilter('');
    setSortOrder('nameAsc');
  };

  const segmentBtnStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    borderRadius: 10,
    border: active ? '1px solid var(--accent)' : '1px solid var(--border-color)',
    background: active ? 'rgba(255, 138, 0, 0.14)' : 'var(--bg-elevated)',
    color: active ? 'var(--accent)' : 'var(--text-secondary)',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: active ? '0 0 0 3px rgba(255,138,0,0.12)' : 'none',
  });

  const emptyMessage =
    segment === 'customers'
      ? t('adminUsers.noCustomers', 'Không có khách hàng phù hợp.')
      : t(
          'adminUsers.noStaff',
          'Không có nhân viên phù hợp. Thử đổi bộ lọc vai trò hoặc rạp.',
        );

  return (
    <div className="animate-in">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {t('User Management')}
          </h2>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              margin: '4px 0 0',
            }}
          >
            {t(
              'adminUsers.subtitle',
              'Quản lý khách hàng và nhân viên — tách rõ hai nhóm để dễ lọc.',
            )}
          </p>
        </div>

        {segment === 'staff' && (
          <button
            type="button"
            onClick={onCreateUser}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
              height: 38,
            }}
          >
            <UserPlus size={16} />
            {t('Add User')}
          </button>
        )}
      </div>

      {/* Segment navigation */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 16,
          padding: 6,
          borderRadius: 12,
          border: '1px solid var(--border-color)',
          background: 'rgba(0,0,0,0.15)',
          width: 'fit-content',
          maxWidth: '100%',
        }}
        role="tablist"
        aria-label={t('adminUsers.segmentNav', 'Loại người dùng')}
      >
        <button
          type="button"
          role="tab"
          aria-selected={segment === 'customers'}
          onClick={() => handleSegmentChange('customers')}
          style={segmentBtnStyle(segment === 'customers')}
        >
          <Users size={16} />
          {t('adminUsers.customers', 'Khách hàng')}
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              padding: '1px 8px',
              borderRadius: 999,
              background: segment === 'customers' ? 'rgba(255,138,0,0.25)' : 'rgba(255,255,255,0.06)',
              color: segment === 'customers' ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            {customerCount}
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={segment === 'staff'}
          onClick={() => handleSegmentChange('staff')}
          style={segmentBtnStyle(segment === 'staff')}
        >
          <Building2 size={16} />
          {t('adminUsers.staff', 'Nhân viên')}
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              padding: '1px 8px',
              borderRadius: 999,
              background: segment === 'staff' ? 'rgba(255,138,0,0.25)' : 'rgba(255,255,255,0.06)',
              color: segment === 'staff' ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            {staffCount}
          </span>
        </button>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div className="relative">
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder={t('Search users...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
            style={{ paddingLeft: 32, width: 220, height: 38 }}
          />
        </div>

        {segment === 'staff' && (
          <>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as StaffRoleFilter)}
              className="input select"
              style={{ width: 180, fontSize: 13, height: 38, minHeight: 0 }}
              aria-label={t('adminUsers.filterRole', 'Lọc theo vai trò / quản lý')}
            >
              <option value="">{t('adminUsers.allStaffRoles', 'Tất cả nhân viên')}</option>
              <option value="managers">{t('adminUsers.managersOnly', 'Chỉ quản lý')}</option>
              <option value="TheaterManager">Theater Manager</option>
              <option value="FacilitiesManager">Facilities Manager</option>
              <option value="MovieManager">Movie Manager</option>
              <option value="Cashier">Cashier</option>
              <option value="Admin">Admin</option>
            </select>

            <select
              value={cinemaFilter}
              onChange={(e) => setCinemaFilter(e.target.value)}
              className="input select"
              style={{ width: 200, fontSize: 13, height: 38, minHeight: 0 }}
              aria-label={t('adminUsers.filterCinema', 'Lọc theo rạp')}
            >
              <option value="">{t('adminUsers.allCinemas', 'Tất cả rạp')}</option>
              <option value={CINEMA_FILTER_NONE}>
                {t('adminUsers.unassignedCinema', 'Chưa gán rạp')}
              </option>
              {cinemaOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </>
        )}

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as UserSortOrder)}
          className="input select"
          style={{ width: 180, fontSize: 13, height: 38, minHeight: 0 }}
          aria-label={t('adminUsers.sort', 'Sắp xếp')}
        >
          <option value="nameAsc">{t('Name: A to Z', 'Tên: A đến Z')}</option>
          <option value="nameDesc">{t('Name: Z to A', 'Tên: Z đến A')}</option>
          {segment === 'staff' && (
            <>
              <option value="cinemaAsc">
                {t('adminUsers.sortCinemaAsc', 'Rạp: A đến Z')}
              </option>
              <option value="cinemaDesc">
                {t('adminUsers.sortCinemaDesc', 'Rạp: Z đến A')}
              </option>
              <option value="roleAsc">
                {t('adminUsers.sortRole', 'Vai trò: A đến Z')}
              </option>
              <option value="managersFirst">
                {t('adminUsers.sortManagersFirst', 'Quản lý trước')}
              </option>
            </>
          )}
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="state-center" style={{ minHeight: '30vh' }}>
            <Loader2
              size={32}
              style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }}
            />
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {t('Loading users...')}
            </p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('Name')}</th>
                <th>{t('Email')}</th>
                {segment === 'staff' && <th>{t('Role')}</th>}
                {segment === 'staff' && <th>{t('cinema')}</th>}
                <th>{t('Status')}</th>
                <th style={{ width: 120 }}>{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((user) => (
                <tr key={user.userId}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <UserPortrait
                        src={user.portraitImageUrl}
                        name={user.fullName || user.userName}
                      />
                      <span style={{ fontWeight: 600 }}>
                        {user.fullName || user.userName || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{user.userEmail}</td>
                  {segment === 'staff' && (
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {parseRoles(user).map((role, idx) => (
                          <span key={`${user.userId}-${role}-${idx}`} className={roleBadgeClass(role)}>
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                  )}
                  {segment === 'staff' && (
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {user.cinemaName || (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          {t('adminUsers.unassignedCinema', 'Chưa gán rạp')}
                        </span>
                      )}
                    </td>
                  )}
                  <td>
                    <StatusBadge status={getAccountStatusLabel(user.accountStatus)} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => onEditUser(user)}
                        className="btn"
                        style={{
                          padding: '4px 12px',
                          fontSize: 12,
                          height: 28,
                          minHeight: 0,
                          borderColor: 'var(--accent)',
                          color: 'var(--accent)',
                          background: 'var(--accent-soft)',
                          fontWeight: 700,
                        }}
                      >
                        {t('Edit', 'Sửa')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAndSorted.length === 0 && (
                <tr>
                  <td
                    colSpan={segment === 'staff' ? 6 : 4}
                    style={{
                      textAlign: 'center',
                      padding: '32px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UsersSection;
