import type { AdminUserDto } from '../types/admin.types';

/** Staff / portal roles (excludes pure customers). */
export const STAFF_ROLES = new Set([
  'Admin',
  'Cashier',
  'MovieManager',
  'TheaterManager',
  'FacilitiesManager',
]);

/** Manager-type roles used by "Managers only" filter (not Cashier, not Admin). */
export const MANAGER_ROLES = new Set([
  'TheaterManager',
  'FacilitiesManager',
  'MovieManager',
]);

export type UserSegment = 'customers' | 'staff';

export type StaffRoleFilter =
  | ''
  | 'managers'
  | 'Admin'
  | 'Cashier'
  | 'MovieManager'
  | 'TheaterManager'
  | 'FacilitiesManager';

export type UserSortOrder =
  | 'nameAsc'
  | 'nameDesc'
  | 'cinemaAsc'
  | 'cinemaDesc'
  | 'roleAsc'
  | 'managersFirst';

export const CINEMA_FILTER_NONE = '__none__';

export const parseRoles = (user: AdminUserDto): string[] =>
  (user.userRoles || '')
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);

export const isStaffUser = (user: AdminUserDto): boolean =>
  parseRoles(user).some((role) => STAFF_ROLES.has(role));

export const isCustomerUser = (user: AdminUserDto): boolean => !isStaffUser(user);

export const isManagerUser = (user: AdminUserDto): boolean =>
  parseRoles(user).some((role) => MANAGER_ROLES.has(role));

export const displayName = (user: AdminUserDto): string =>
  (user.fullName || user.userName || '').trim();

export const primaryRole = (user: AdminUserDto): string => {
  const roles = parseRoles(user);
  if (roles.length === 0) return '';
  const priority = [
    'Admin',
    'TheaterManager',
    'FacilitiesManager',
    'MovieManager',
    'Cashier',
    'Customer',
  ];
  for (const p of priority) {
    if (roles.includes(p)) return p;
  }
  return roles[0];
};

const managerRank = (user: AdminUserDto): number => {
  const roles = parseRoles(user);
  if (roles.includes('TheaterManager') || roles.includes('FacilitiesManager')) return 0;
  if (roles.includes('MovieManager')) return 1;
  if (roles.includes('Admin')) return 2;
  if (roles.includes('Cashier')) return 3;
  return 4;
};

export const filterUsersBySegment = (
  users: AdminUserDto[],
  segment: UserSegment,
): AdminUserDto[] =>
  users.filter((u) => (segment === 'staff' ? isStaffUser(u) : isCustomerUser(u)));

export const matchesSearch = (user: AdminUserDto, query: string): boolean => {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    (user.userEmail || '').toLowerCase().includes(q) ||
    (user.fullName || '').toLowerCase().includes(q) ||
    (user.userName || '').toLowerCase().includes(q) ||
    (user.phoneNumber || '').toLowerCase().includes(q)
  );
};

export const matchesCinemaFilter = (
  user: AdminUserDto,
  cinemaFilter: string,
): boolean => {
  if (!cinemaFilter) return true;
  if (cinemaFilter === CINEMA_FILTER_NONE) return !user.cinemaId;
  return user.cinemaId === cinemaFilter;
};

export const matchesStaffRoleFilter = (
  user: AdminUserDto,
  roleFilter: StaffRoleFilter,
): boolean => {
  if (!roleFilter) return true;
  const roles = parseRoles(user);
  if (roleFilter === 'managers') {
    return roles.some((r) => MANAGER_ROLES.has(r));
  }
  return roles.includes(roleFilter);
};

export const sortUsers = (
  users: AdminUserDto[],
  sortOrder: UserSortOrder,
): AdminUserDto[] => {
  const sorted = [...users];
  sorted.sort((a, b) => {
    const nameA = displayName(a).toLowerCase();
    const nameB = displayName(b).toLowerCase();
    const cinemaA = (a.cinemaName || '').trim().toLowerCase();
    const cinemaB = (b.cinemaName || '').trim().toLowerCase();
    const roleA = primaryRole(a).toLowerCase();
    const roleB = primaryRole(b).toLowerCase();

    switch (sortOrder) {
      case 'nameDesc':
        return nameB.localeCompare(nameA, 'vi');
      case 'cinemaAsc':
        return cinemaA.localeCompare(cinemaB, 'vi') || nameA.localeCompare(nameB, 'vi');
      case 'cinemaDesc':
        return cinemaB.localeCompare(cinemaA, 'vi') || nameA.localeCompare(nameB, 'vi');
      case 'roleAsc':
        return roleA.localeCompare(roleB, 'vi') || nameA.localeCompare(nameB, 'vi');
      case 'managersFirst': {
        const rankDiff = managerRank(a) - managerRank(b);
        if (rankDiff !== 0) return rankDiff;
        return nameA.localeCompare(nameB, 'vi');
      }
      case 'nameAsc':
      default:
        return nameA.localeCompare(nameB, 'vi');
    }
  });
  return sorted;
};

export const filterAndSortUsers = (params: {
  users: AdminUserDto[];
  segment: UserSegment;
  searchQuery: string;
  cinemaFilter: string;
  roleFilter: StaffRoleFilter;
  sortOrder: UserSortOrder;
}): AdminUserDto[] => {
  const {
    users,
    segment,
    searchQuery,
    cinemaFilter,
    roleFilter,
    sortOrder,
  } = params;

  let result = filterUsersBySegment(users, segment).filter((u) =>
    matchesSearch(u, searchQuery),
  );

  if (segment === 'staff') {
    result = result.filter(
      (u) =>
        matchesCinemaFilter(u, cinemaFilter) &&
        matchesStaffRoleFilter(u, roleFilter),
    );
  }

  return sortUsers(result, sortOrder);
};
