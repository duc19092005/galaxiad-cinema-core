import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Ticket, Film, Building2, Wrench, Loader2, AlertCircle } from 'lucide-react';
import { authApi } from '../../api/authApi';
import axios from 'axios';
import type { ApiErrorResponse } from '../../types/auth.types';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import Cookies from 'js-cookie';

// Role mapping với icon và màu sắc
const roleConfig: Record<string, { icon: React.ElementType; color: string; label: string; route: string }> = {
  Customer: {
    icon: Ticket,
    color: 'from-blue-600 to-blue-800',
    label: 'roles.customer',
    route: '/home'
  },
  Cashier: {
    icon: Ticket,
    color: 'from-green-600 to-green-800',
    label: 'roles.cashier',
    route: '/cashier'
  },
  Admin: {
    icon: Shield,
    color: 'from-indigo-600/20 to-purple-900/40',
    label: 'roles.admin',
    route: '/admin'
  },
  MovieManager: {
    icon: Film,
    color: 'from-orange-600 to-orange-800',
    label: 'roles.movieManager',
    route: '/movie-manager'
  },
  TheaterManager: {
    icon: Building2,
    color: 'from-cyan-600 to-cyan-800',
    label: 'roles.theaterManager',
    route: '/theater-manager'
  },
  FacilitiesManager: {
    icon: Wrench,
    color: 'from-yellow-600 to-yellow-800',
    label: 'roles.facilitiesManager',
    route: '/facilities-manager'
  }
};

const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<{ username: string; roles: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  useEffect(() => {
    // Load thông tin user từ LocalStorage
    const storedUser = localStorage.getItem('user_info');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);

        // Nếu chỉ có 1 role, tự động redirect
        if (userData.roles && userData.roles.length === 1) {
          const singleRole = userData.roles[0];
          const roleInfo = roleConfig[singleRole];
          if (roleInfo) {
            navigate(roleInfo.route);
            return;
          }
        }

        // Test authentication bằng cách gọi API
        testAuthentication();
      } catch (err) {
        setError('Invalid user data');
        setLoading(false);
      }
    } else {
      // Nếu không có user, đá về trang login
      navigate('/login');
    }
  }, [navigate]);

  const testAuthentication = async () => {
    try {
      // Test authentication bằng cách gọi API profile
      const res = await authApi.getProfile();
      if (res.isSuccess) {
        // Cập nhật lại thông tin user từ profile (có thể có managedCinemaNames mới)
        const currentStored = localStorage.getItem('user_info');
        if (currentStored) {
          const current = JSON.parse(currentStored);
          const updated = { ...current, ...res.data };
          localStorage.setItem('user_info', JSON.stringify(updated));
          window.dispatchEvent(new Event('user_info_updated'));
          setUser(updated);
        }
      }
      setLoading(false);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as ApiErrorResponse;
        if (data.statusCode === 401) {
          // Authentication failed - xóa user info và cookie, redirect về login
          localStorage.removeItem('user_info');
          Cookies.remove('X-Access-Token');
          navigate('/login');
          return;
        }
        setError(data.message || 'Authentication failed');
      } else {
        setError('Unable to connect to server');
      }
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    const roleInfo = roleConfig[role];
    if (roleInfo) {
      // Lưu role được chọn vào localStorage để sử dụng sau này
      const userData = { ...user, selectedRole: role };
      localStorage.setItem('user_info', JSON.stringify(userData));
      window.dispatchEvent(new Event('user_info_updated'));

      // Navigate đến trang của role đó
      navigate(roleInfo.route);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white font-sans flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-black text-white font-sans flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            {t('roles.backToLogin')}
          </button>
        </div>
      </div>
    );
  }

  const availableRoles = user?.roles || [];

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800 h-16 flex items-center justify-between px-6 shadow-lg">
        <div className="text-2xl font-black text-red-600 tracking-widest uppercase cursor-pointer">
          CINEMA<span className="text-white">PRO</span>
        </div>
        <div className="flex items-center gap-6">
          <LanguageSwitcher />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-[0_0_10px_rgba(220,38,38,0.3)]">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-sm text-gray-200">{user?.username || t('roles.guest')}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 px-6 container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-wider">
            {t('roles.selectRole')}
          </h1>
          <p className="text-gray-400 text-lg">
            {t('roles.chooseRole')}
          </p>
        </div>

        {/* Role Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableRoles.map((role) => {
            const roleInfo = roleConfig[role];
            if (!roleInfo) return null;

            const Icon = roleInfo.icon;
            const isSelected = selectedRole === role;

            return (
              <button
                key={role}
                onClick={() => handleRoleSelect(role)}
                disabled={isSelected}
                className={`group relative overflow-hidden rounded-2xl p-8 bg-gray-900 border-2 transition-all duration-300 hover:scale-105 hover:-translate-y-2 ${isSelected
                  ? 'border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.5)]'
                  : 'border-gray-800 hover:border-red-600'
                  }`}
              >
                {/* Gradient Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${roleInfo.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  {/* Icon */}
                  <div
                    className={`w-20 h-20 rounded-full bg-gradient-to-br ${roleInfo.color} flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow`}
                  >
                    <Icon className="w-10 h-10 text-white" />
                  </div>

                  {/* Role Name */}
                  <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">
                    {t(roleInfo.label)}
                  </h3>

                  {/* Hover Effect Text */}
                  <p className="text-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {t('roles.clickToContinue')}
                  </p>

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="mt-4 px-4 py-2 bg-red-600 rounded-full text-xs font-bold uppercase tracking-wider">
                      {t('roles.selected')}
                    </div>
                  )}
                </div>

                {/* Shine Effect */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>
            );
          })}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-8 p-4 rounded-lg bg-red-900/40 border border-red-500/50 flex items-center text-red-100">
            <AlertCircle className="w-5 h-5 mr-3 shrink-0 text-red-500" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
      </main>
    </div>
  );
};

export default RoleSelectionPage;
