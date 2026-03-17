// src/components/RoleUpdateModal.tsx
import React, { useEffect, useState } from 'react';
import { X, Shield, Loader2, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { adminApi } from '../api/adminApi';
import type { RoleDto } from '../types/admin.types';
import toast from 'react-hot-toast';

interface RoleUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    currentUserEmail: string;
    currentUserRoles: string; // Comma separated roles
    onSuccess: () => void;
}

const RoleUpdateModal: React.FC<RoleUpdateModalProps> = ({
    isOpen,
    onClose,
    userId,
    currentUserEmail,
    currentUserRoles,
    onSuccess,
}) => {
    const { theme } = useTheme();
    const [roles, setRoles] = useState<RoleDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchRoles();
        }
    }, [isOpen]);

    const fetchRoles = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch ALL available roles
            const allRolesRes = await adminApi.getRoles();
            const allRoles = Array.isArray(allRolesRes.data) ? allRolesRes.data : (allRolesRes as any).data || [];
            setRoles(allRoles);

            // 2. Fetch specific user's detailed roles
            try {
                const userRolesRes = await adminApi.getUserRoles(userId);
                const userCurrentRoles = userRolesRes.data || [];
                if (userCurrentRoles.length > 0) {
                    setSelectedRoleIds(userCurrentRoles.map(r => r.roleId));
                } else {
                    // Fallback to props if details API returns empty but we have string data
                    syncFromProps(allRoles);
                }
            } catch (e) {
                // If detail API fails, fallback to string parsing from props
                syncFromProps(allRoles);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load roles');
        } finally {
            setLoading(false);
        }
    };

    const syncFromProps = (allRoles: RoleDto[]) => {
        const currentRoleNames = currentUserRoles.split(',').map(r => r.trim());
        const matchedIds = allRoles
            .filter(r => currentRoleNames.includes(r.roleName))
            .map(r => r.roleId);
        setSelectedRoleIds(matchedIds);
    };

    const toggleRole = (role: RoleDto) => {
        // Prevent self-demotion: If current user is Admin and editing themselves, don't allow removing 'Admin'
        const storedUser = JSON.parse(localStorage.getItem('user_info') || '{}');
        const isSelf = storedUser.userId === userId;
        const isAdminRole = role.roleName === 'Admin';

        if (isSelf && isAdminRole && selectedRoleIds.includes(role.roleId)) {
            toast.error("You cannot remove your own Admin role.");
            return;
        }

        setSelectedRoleIds(prev => 
            prev.includes(role.roleId) 
                ? prev.filter(id => id !== role.roleId) 
                : [...prev, role.roleId]
        );
    };

    const handleUpdate = async () => {
        setUpdating(true);
        try {
            await adminApi.updateUserRole(userId, selectedRoleIds);
            toast.success('User roles updated successfully');
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update user roles');
        } finally {
            setUpdating(false);
        }
    };

    if (!isOpen) return null;

    const currentRoleList = roles.filter(r => selectedRoleIds.includes(r.roleId));
    const availableRoleList = roles.filter(r => !selectedRoleIds.includes(r.roleId));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-md rounded-2xl border shadow-2xl transition-all overflow-hidden ${
                theme === 'dark' ? 'bg-gray-900 border-gray-800' : 
                theme === 'modern' ? 'bg-[#15102B]/95 backdrop-blur-2xl border-indigo-500/30' : 
                'bg-white border-gray-200'
            }`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/20' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme === 'modern' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-indigo-600'}`}>
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className={`text-xl font-black ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}`}>Update User Role</h2>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-indigo-300' : 'text-gray-500'}`}>{currentUserEmail}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                                ? 'hover:bg-gray-800 text-gray-400'
                                : theme === 'modern'
                                    ? 'hover:bg-white/10 text-white'
                                    : 'hover:bg-gray-100 text-gray-600'
                                }`}><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                            <p className={theme === 'dark' || theme === 'modern' ? 'text-gray-300 opacity-60' : 'text-gray-600 opacity-60'}>Loading roles...</p>
                        </div>
                    ) : error ? (
                        <div className={`p-4 rounded-xl border flex items-center gap-3 ${theme === 'dark' || theme === 'modern'
                            ? 'bg-red-900/20 border-red-500/50 text-red-100'
                            : 'bg-red-50 border-red-200 text-red-800'
                            }`}>
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    ) : (
                        <>
                            {/* Current Roles Section */}
                            <div>
                                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${theme === 'dark' ? 'text-gray-500' : theme === 'modern' ? 'text-indigo-400' : 'text-gray-400'}`}>Current Roles</h3>
                                <div className="flex flex-wrap gap-2">
                                    {currentRoleList.length === 0 ? (
                                        <p className={`text-sm italic py-2 ${theme === 'dark' || theme === 'modern' ? 'text-gray-400 opacity-40' : 'text-gray-500 opacity-40'}`}>No roles assigned.</p>
                                    ) : (
                                        currentRoleList.map(role => {
                                            const storedUser = JSON.parse(localStorage.getItem('user_info') || '{}');
                                            const isSelf = storedUser.userId === userId;
                                            const isAdminRole = role.roleName === 'Admin';
                                            const isProtected = isSelf && isAdminRole;

                                            return (
                                                <div key={role.roleId} className={`flex items-center gap-2 pl-3 pr-1 py-1 rounded-full border transition-all ${
                                                    theme === 'modern' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' :
                                                    theme === 'dark' ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-200' :
                                                    'bg-indigo-50 border-indigo-200 text-indigo-700'
                                                }`}>
                                                    <span className="text-xs font-bold">{role.roleName}</span>
                                                    {!isProtected && (
                                                        <button 
                                                            onClick={() => toggleRole(role)}
                                                            className={`p-1 rounded-full transition-colors ${theme === 'dark' || theme === 'modern' ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                    {isProtected && <Shield className="w-3 h-3 text-indigo-400" />}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Available Roles Section */}
                            <div>
                                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${theme === 'dark' ? 'text-gray-500' : theme === 'modern' ? 'text-indigo-400' : 'text-gray-400'}`}>Add Roles</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {availableRoleList.length === 0 ? (
                                        <p className={`text-sm italic py-2 ${theme === 'dark' || theme === 'modern' ? 'text-gray-400 opacity-40' : 'text-gray-500 opacity-40'}`}>All available roles assigned.</p>
                                    ) : (
                                        availableRoleList.map(role => (
                                            <button
                                                key={role.roleId}
                                                onClick={() => toggleRole(role)}
                                                className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                                                    theme === 'modern' ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' :
                                                    theme === 'dark' ? 'bg-gray-800/40 border-gray-700 text-gray-300 hover:bg-gray-800/80' :
                                                    'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                                }`}
                                            >
                                                <span className="text-sm font-bold">{role.roleName}</span>
                                                <div className="w-5 h-5 rounded-full border border-current opacity-20" />
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className={`p-6 border-t flex justify-end gap-3 ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/20' : 'border-gray-200'}`}>
                    <button
                        onClick={onClose}
                        disabled={updating}
                        className={`px-5 py-2 rounded-xl font-bold transition-opacity ${updating
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                            } ${theme === 'dark'
                                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 opacity-60 hover:opacity-100'
                                : theme === 'modern'
                                    ? 'bg-white/5 hover:bg-white/10 text-white opacity-60 hover:opacity-100'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 opacity-60 hover:opacity-100'
                            }`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpdate}
                        disabled={updating || loading}
                        className={`px-8 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
                            updating || loading
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                            } ${theme === 'modern'
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:scale-[1.02]'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                            }`}
                    >
                        {updating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Updating...</span>
                            </>
                        ) : (
                            <>
                                <Shield className="w-4 h-4" />
                                <span>Apply Changes</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoleUpdateModal;
