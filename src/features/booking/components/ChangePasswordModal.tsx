import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { authApi } from '../../../api/authApi';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../../contexts/ThemeContext';
import axios from 'axios';
import type { ApiErrorResponse } from '../../../types/auth.types';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showRenew, setShowRenew] = useState(false);

    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        renewPassword: ''
    });

    if (!isOpen) return null;

    const validatePassword = (pass: string) => {
        const hasUpper = /[A-Z]/.test(pass);
        const hasSpecial = /[^A-Za-z0-9]/.test(pass);
        const isLongEnough = pass.length >= 8;
        return { hasUpper, hasSpecial, isLongEnough };
    };

    const requirements = validatePassword(formData.newPassword);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        const { hasUpper, hasSpecial, isLongEnough } = requirements;
        if (!isLongEnough || !hasUpper || !hasSpecial) {
            setError("New password does not meet requirements.");
            return;
        }

        if (formData.newPassword !== formData.renewPassword) {
            setError("New passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            await authApi.changePassword(formData);
            setSuccess(true);
            toast.success("Mật khẩu đã được thay đổi thành công!");
            setTimeout(() => {
                onClose();
                setFormData({ oldPassword: '', newPassword: '', renewPassword: '' });
                setSuccess(false);
            }, 1500);
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response) {
                const data = err.response.data as ApiErrorResponse;
                setError(data.message || data.errors?.[0] || "Failed to change password");
            } else {
                setError("Network error. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const inputClass = `w-full pl-10 pr-12 py-3 rounded-xl border focus:outline-none transition-all ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white focus:border-red-600' :
        theme === 'modern' ? 'bg-white/10 border-indigo-500/30 text-white focus:border-cyan-400 backdrop-blur-md' :
        'bg-white border-gray-200 text-gray-900 focus:border-red-600'
    }`;

    const labelClass = `block text-xs font-black uppercase tracking-widest mb-2 opacity-50 ${
        theme === 'light' ? 'text-gray-900' : 'text-white'
    }`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${
                theme === 'dark' ? 'bg-gray-950 border-gray-800' :
                theme === 'modern' ? 'bg-[#0E0A20] border-indigo-500/30' :
                'bg-white border-gray-200'
            }`}>
                {/* Header */}
                <div className={`p-6 border-b flex items-center justify-between ${
                    theme === 'modern' ? 'border-indigo-500/20' : 'border-gray-100/10'
                }`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${theme === 'modern' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-red-600/10 text-red-600'}`}>
                            <Lock className="w-5 h-5" />
                        </div>
                        <h2 className={`text-xl font-black ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Change Password</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition-colors">
                        <X className="w-5 h-5 opacity-50" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-sm font-bold">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3 text-green-500 text-sm font-bold">
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            Password changed successfully!
                        </div>
                    )}

                    {/* Old Password */}
                    <div>
                        <label className={labelClass}>Current Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                            <input
                                type={showOld ? 'text' : 'password'}
                                value={formData.oldPassword}
                                onChange={(e) => setFormData(p => ({ ...p, oldPassword: e.target.value }))}
                                className={inputClass}
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowOld(!showOld)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 opacity-30 hover:opacity-100 transition-opacity"
                            >
                                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div>
                        <label className={labelClass}>New Password</label>
                        <div className="relative">
                            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                            <input
                                type={showNew ? 'text' : 'password'}
                                value={formData.newPassword}
                                onChange={(e) => setFormData(p => ({ ...p, newPassword: e.target.value }))}
                                className={inputClass}
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 opacity-30 hover:opacity-100 transition-opacity"
                            >
                                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        
                        {/* Requirements */}
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <RequirementItem met={requirements.isLongEnough} text="8+ Characters" />
                            <RequirementItem met={requirements.hasUpper} text="Uppercase" />
                            <RequirementItem met={requirements.hasSpecial} text="Special Char" />
                        </div>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                        <label className={labelClass}>Confirm New Password</label>
                        <div className="relative">
                            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                            <input
                                type={showRenew ? 'text' : 'password'}
                                value={formData.renewPassword}
                                onChange={(e) => setFormData(p => ({ ...p, renewPassword: e.target.value }))}
                                className={inputClass}
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowRenew(!showRenew)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 opacity-30 hover:opacity-100 transition-opacity"
                            >
                                {showRenew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl transition-all active:scale-[0.98] ${
                                theme === 'modern' ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white hover:shadow-cyan-500/30' :
                                'bg-red-600 text-white hover:bg-red-700 shadow-red-600/20'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Updating...
                                </div>
                            ) : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RequirementItem = ({ met, text }: { met: boolean, text: string }) => (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
        met ? 'text-green-500 border-green-500/20 bg-green-500/5' : 'text-gray-400 border-gray-100/10 bg-gray-100/5'
    }`}>
        <CheckCircle2 className={`w-3 h-3 ${met ? 'opacity-100' : 'opacity-20'}`} />
        <span className="text-[10px] font-bold uppercase tracking-tighter">{text}</span>
    </div>
);

export default ChangePasswordModal;
