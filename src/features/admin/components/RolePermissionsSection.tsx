// src/features/admin/components/RolePermissionsSection.tsx
// Styled to match VouchersSection color scheme using cinema-* classes

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, KeyRound, Loader2, RefreshCw, RotateCcw, Save, Search, ShieldCheck } from 'lucide-react';
import { adminApi } from '../../../api/adminApi';
import type { PermissionDto, RolePermissionsDto } from '../../../types/admin.types';
import { showError, showSuccess } from '../../../utils/ToastUtils';

const sameSet = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  const next = new Set(a);
  return b.every((item) => next.has(item));
};

const APPROVE_SHIFT_PERMISSION = 'ApproveShift';
const APPROVE_SHIFT_ROLES = new Set(['Admin', 'TheaterManager']);

const getApiMessage = (error: unknown, fallback: string) => {
  if (typeof error !== 'object' || error === null) return fallback;
  const response = (error as { response?: { data?: { message?: string; Message?: string } } }).response;
  return response?.data?.message ?? response?.data?.Message ?? fallback;
};

const RolePermissionsSection: React.FC = () => {
  const [roles, setRoles] = useState<RolePermissionsDto[]>([]);
  const [permissions, setPermissions] = useState<PermissionDto[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRole = useMemo(
    () => roles.find((role) => role.roleId === selectedRoleId) || null,
    [roles, selectedRoleId],
  );

  const savedPermissionIds = useMemo(
    () => selectedRole?.permissions.map((permission) => permission.permissionId) || [],
    [selectedRole],
  );
  const approveShiftPermissionIds = useMemo(
    () => permissions
      .filter((permission) => permission.permissionInfo === APPROVE_SHIFT_PERMISSION)
      .map((permission) => permission.permissionId),
    [permissions],
  );
  const canSelectedRoleApproveShifts = Boolean(selectedRole && APPROVE_SHIFT_ROLES.has(selectedRole.roleName));
  const applyRolePermissionRules = useCallback((permissionIds: string[]) => {
    if (canSelectedRoleApproveShifts) return permissionIds;
    const forbiddenIds = new Set(approveShiftPermissionIds);
    return permissionIds.filter((permissionId) => !forbiddenIds.has(permissionId));
  }, [approveShiftPermissionIds, canSelectedRoleApproveShifts]);

  const selectedPermissionSet = useMemo(() => new Set(selectedPermissionIds), [selectedPermissionIds]);
  const hasUnsavedChanges = !sameSet(selectedPermissionIds, savedPermissionIds);

  const filteredPermissions = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return permissions;
    return permissions.filter((permission) => permission.permissionInfo.toLowerCase().includes(keyword));
  }, [permissions, searchTerm]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [permissionsRes, rolesRes] = await Promise.all([
        adminApi.getPermissions(),
        adminApi.getRolesPermissions(),
      ]);
      const nextPermissions = permissionsRes.data || [];
      const nextRoles = rolesRes.data || [];
      setPermissions(nextPermissions);
      setRoles(nextRoles);
      setSelectedRoleId((current) => current || nextRoles[0]?.roleId || '');
    } catch (err) {
      const message = getApiMessage(err, 'Unable to load role permissions.');
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setSelectedPermissionIds(applyRolePermissionRules(savedPermissionIds));
  }, [applyRolePermissionRules, savedPermissionIds]);

  const handleSelectRole = (roleId: string) => {
    if (roleId === selectedRoleId) return;
    if (hasUnsavedChanges && !window.confirm('Discard unsaved permission changes for this role?')) return;
    setSelectedRoleId(roleId);
  };

  const togglePermission = (permissionId: string) => {
    if (!canSelectedRoleApproveShifts && approveShiftPermissionIds.includes(permissionId)) return;
    setSelectedPermissionIds((current) => (
      current.includes(permissionId)
        ? current.filter((item) => item !== permissionId)
        : [...current, permissionId]
    ));
  };

  const updateVisiblePermissions = (checked: boolean) => {
    const visibleIds = filteredPermissions.map((permission) => permission.permissionId);
    setSelectedPermissionIds((current) => {
      const next = new Set(current);
      visibleIds.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return applyRolePermissionRules(Array.from(next));
    });
  };

  const handleReset = () => {
    setSelectedPermissionIds(savedPermissionIds);
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    const confirmed = window.confirm(
      `Update permissions for ${selectedRole.roleName}? Users with this role need to log in again to receive new JWT permission claims.`,
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const safePermissionIds = applyRolePermissionRules(selectedPermissionIds);
      const response = await adminApi.updateRolePermissions(selectedRole.roleId, safePermissionIds);
      const nextPermissionSet = new Set(safePermissionIds);
      setRoles((current) => current.map((role) => (
        role.roleId === selectedRole.roleId
          ? { ...role, permissions: permissions.filter((permission) => nextPermissionSet.has(permission.permissionId)) }
          : role
      )));
      showSuccess(response.message || `Permissions updated for ${selectedRole.roleName}.`);
    } catch (err) {
      showError(getApiMessage(err, 'Unable to update role permissions.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 size={28} className="text-cinema-accent animate-spin" />
        <p className="text-sm text-cinema-text-muted mt-3 font-mono">Loading permissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-cinema-surface rounded-2xl border border-cinema-border/50 gap-3">
        <AlertCircle size={28} className="text-cinema-danger" />
        <p className="text-sm text-cinema-text-muted">{error}</p>
        <button className="px-4 py-2 rounded-lg text-xs font-semibold bg-cinema-elevated border border-cinema-border/30 text-cinema-text hover:bg-cinema-surface transition-all flex items-center gap-2" onClick={loadData}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col xl:flex-row gap-6 p-1 min-w-0 animate-fade-in">
      {/* Main Section */}
      <div className="flex-1 space-y-6 min-w-0">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-cinema-accent tracking-tight">Role Permissions</h1>
            <p className="text-sm text-cinema-text-muted mt-1">Configure permission claims for each role. Active users receive changes after their next login.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-cinema-border/50 bg-cinema-surface text-cinema-text hover:bg-cinema-elevated text-xs font-semibold rounded-xl transition-all" onClick={loadData} disabled={saving}>
              <RefreshCw size={14} />
              Refresh
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-cinema-accent hover:bg-cinema-accent-hover text-black font-bold text-xs rounded-xl transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-cinema-accent/10" onClick={handleSave} disabled={!selectedRole || !hasUnsavedChanges || saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save changes
            </button>
          </div>
        </div>

        {/* Two-column grid: Roles | Permissions */}
        <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-6">

          {/* Roles Sidebar */}
          <aside className="space-y-4">
            <div className="p-5 bg-cinema-surface border border-cinema-border/50 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="p-2 bg-cinema-accent/10 rounded-lg text-cinema-accent">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-cinema-text">Roles</h3>
                  <p className="text-xs text-cinema-text-muted">{roles.length} configured</p>
                </div>
              </div>
              <div className="space-y-2">
                {roles.map((role) => {
                  const isActive = role.roleId === selectedRoleId;
                  return (
                    <button
                      key={role.roleId}
                      type="button"
                      onClick={() => handleSelectRole(role.roleId)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-cinema-accent/10 border border-cinema-accent/30 text-cinema-accent'
                          : 'bg-cinema-elevated/50 border border-cinema-border/30 text-cinema-text hover:bg-cinema-accent/5 hover:border-cinema-accent/20'
                      }`}
                    >
                      <span className="text-sm font-bold">{role.roleName}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cinema-elevated border border-cinema-border/30 text-cinema-text-muted">{role.permissions.length}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Permissions Panel */}
          <section className="p-5 bg-cinema-surface border border-cinema-border/50 rounded-2xl shadow-sm min-w-0">
            {selectedRole ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl font-extrabold text-cinema-text">{selectedRole.roleName}</h3>
                      {hasUnsavedChanges && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Unsaved changes</span>
                      )}
                    </div>
                    <p className="text-sm text-cinema-text-muted mt-0.5">
                      {selectedPermissionIds.length} of {permissions.length} permissions selected.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cinema-elevated border border-cinema-border/30 text-cinema-text hover:bg-cinema-accent/5 hover:border-cinema-accent/20 transition-all flex items-center gap-1.5" onClick={() => updateVisiblePermissions(true)} disabled={filteredPermissions.length === 0}>
                      <Check size={13} /> Select visible
                    </button>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cinema-elevated border border-cinema-border/30 text-cinema-text hover:bg-cinema-accent/5 hover:border-cinema-accent/20 transition-all flex items-center gap-1.5" onClick={() => updateVisiblePermissions(false)} disabled={filteredPermissions.length === 0}>
                      Clear visible
                    </button>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cinema-elevated border border-cinema-border/30 text-cinema-text hover:bg-cinema-accent/5 hover:border-cinema-accent/20 transition-all flex items-center gap-1.5" onClick={handleReset} disabled={!hasUnsavedChanges}>
                      <RotateCcw size={13} /> Reset
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="mb-4 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cinema-text-muted" />
                  <input
                    className="w-full h-10 pl-9 pr-3 rounded-xl border bg-cinema-elevated border-cinema-border/50 text-sm text-cinema-text outline-none focus:border-cinema-accent/30 transition-all placeholder:text-cinema-text-muted/50"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search permission name..."
                  />
                </div>

                {/* Permission Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredPermissions.map((permission) => {
                    const checked = selectedPermissionSet.has(permission.permissionId);
                    const isApproveShiftLocked = permission.permissionInfo === APPROVE_SHIFT_PERMISSION && !canSelectedRoleApproveShifts;
                    return (
                      <label
                        key={permission.permissionId}
                        className={`flex items-start gap-3 p-4 rounded-xl border transition-all min-w-0 ${
                          checked
                            ? 'bg-cinema-accent/10 border-cinema-accent/30'
                            : 'bg-cinema-elevated border-cinema-border/30 hover:border-cinema-accent/20'
                        } ${isApproveShiftLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={isApproveShiftLocked}
                          onChange={() => togglePermission(permission.permissionId)}
                          className="mt-0.5 w-4 h-4 rounded accent-cinema-accent shrink-0"
                          style={{ accentColor: '#ffb3b6' }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-cinema-text leading-tight break-words">{permission.permissionInfo}</p>
                          <p className="text-[10px] text-cinema-text-muted font-mono mt-1 break-all opacity-70">{permission.permissionId}</p>
                          {isApproveShiftLocked && (
                            <p className="text-[10px] text-cinema-text-muted mt-1">Only Admin and TheaterManager can approve shifts.</p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                {filteredPermissions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 border border-dashed border-cinema-border/50 rounded-xl">
                    <KeyRound size={28} className="text-cinema-text-muted opacity-40" />
                    <p className="text-sm text-cinema-text-muted mt-2">No permissions match your search.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <KeyRound size={32} className="text-cinema-text-muted opacity-30" />
                <p className="text-sm text-cinema-text-muted mt-3">No roles found.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default RolePermissionsSection;
