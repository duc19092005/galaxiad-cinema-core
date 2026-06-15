// src/features/facilities/components/CinemaManagement.tsx
// Premium design for Cinema Complex management (Admin)
// Using tailwind cinema-* class system matching VouchersSection colors

import React, { useState } from 'react';
import {
  Building2, Plus, Search, Edit, MapPin, Phone, Film, Eye, Loader2,
  AlertCircle, X, Trash2, Monitor, Users, Store, TrendingUp,
  SlidersHorizontal, ChevronDown, UserCog, Settings,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { facilitiesApi, type Cinema, type CreateCinemaRequest } from '../../../api/facilitiesApi';
import CinemaDetailModal from './CinemaDetailModal';
import AssignRightsModal from '../../admin/components/AssignRightsModal';
import DepartmentManager from '../DepartmentManager';
import { toVietnamDateTimeLocalValue, vietnamDateTimeLocalToOffsetString } from '../../../utils/dateTimeUtils';

const VIETNAM_CITIES = [
  'Hồ Chí Minh',
  'Hà Nội',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Bình Dương',
  'Đồng Nai',
  'Khánh Hòa',
  'Quảng Ninh',
  'Bà Rịa - Vũng Tàu'
];

interface CinemaManagementProps {
  cinemas: Cinema[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

const CinemaManagement: React.FC<CinemaManagementProps> = ({ cinemas, loading = false, error = null, onRefresh }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCinemaId, setSelectedCinemaId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest');

  // Create cinema modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [formData, setFormData] = useState<CreateCinemaRequest>({
    cinemaName: '',
    cinemaDescription: '',
    cinemaHotlineNumber: '',
    cinemaLocation: '',
    cinemaCity: '',
    activeAt: null,
  });

  // Edit cinema state
  const [editCinema, setEditCinema] = useState<Cinema | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    cinemaName: '',
    cinemaDescription: '',
    cinemaHotlineNumber: '',
    cinemaLocation: '',
    cinemaCity: '',
    activeAt: null as string | null,
  });
  const [editLoading, setEditLoading] = useState(false);

  // Delete state
  const [deleteConfirmCinemaId, setDeleteConfirmCinemaId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Assign Rights Modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [itemToAssign, setItemToAssign] = useState<{ id: string; name: string; assignType: number } | null>(null);

  // Department Modal state
  const [departmentModalCinemaId, setDepartmentModalCinemaId] = useState<string | null>(null);
  const storedUser = localStorage.getItem('user_info');
  const isAdmin = storedUser ? JSON.parse(storedUser).roles?.includes('Admin') : false;

  const filteredCinemas = cinemas.filter(
    (cinema) =>
      cinema.cinemaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cinema.cinemaLocation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortCinemas = (list: Cinema[]) => {
    const sorted = [...list];
    switch (sortBy) {
      case 'name-asc': sorted.sort((a, b) => a.cinemaName.localeCompare(b.cinemaName)); break;
      case 'name-desc': sorted.sort((a, b) => b.cinemaName.localeCompare(a.cinemaName)); break;
      case 'newest': break;
      case 'oldest': sorted.reverse(); break;
    }
    return sorted;
  };

  const displayCinemas = sortCinemas(filteredCinemas);

  // Stats
  const totalCinemas = cinemas.length;
  const totalRooms = cinemas.reduce((acc, c) => acc + (c.totalRooms || 0), 0);
  const totalSeats = totalRooms * 150; // Approximate seats
  const activeCinemas = cinemas.filter(c => 
    (c.theaterManagerName && c.theaterManagerName !== 'Chưa có') || 
    (c.facilitiesManagerName && c.facilitiesManagerName !== 'Chưa có')
  ).length;

  // ============ CREATE ============
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, activeAt: e.target.value ? vietnamDateTimeLocalToOffsetString(e.target.value) : null }));
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateError(null);
    setCreateSuccess(false);
    setFormData({
      cinemaName: '',
      cinemaDescription: '',
      cinemaHotlineNumber: '',
      cinemaLocation: '',
      cinemaCity: '',
      activeAt: null,
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(false);
    try {
      await facilitiesApi.createCinema(formData);
      setCreateSuccess(true);
      if (onRefresh) onRefresh();
      setTimeout(() => handleCloseCreateModal(), 1500);
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create cinema');
    } finally {
      setCreateLoading(false);
    }
  };

  // ============ EDIT ============
  const handleOpenEditModal = (cinema: Cinema) => {
    setEditCinema(cinema);
    setEditFormData({
      cinemaName: cinema.cinemaName,
      cinemaDescription: cinema.cinemaDescription,
      cinemaHotlineNumber: cinema.cinemaHotlineNumber,
      cinemaLocation: cinema.cinemaLocation,
      cinemaCity: cinema.cinemaCity || '',
      activeAt: null,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCinema) return;
    setEditLoading(true);
    try {
      await facilitiesApi.updateCinema(editCinema.cinemaId, editFormData);
      showSuccess('Cinema updated successfully');
      setIsEditModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to update cinema');
    } finally {
      setEditLoading(false);
    }
  };

  // ============ DELETE ============
  const handleDelete = async () => {
    if (!deleteConfirmCinemaId) return;
    setDeleting(true);
    try {
      await facilitiesApi.updateCinema(deleteConfirmCinemaId, { isDeleted: true } as any);
      showSuccess('Cinema deleted successfully');
      setDeleteConfirmCinemaId(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to delete cinema');
    } finally {
      setDeleting(false);
    }
  };

  // Toast stubs
  const showSuccess = (msg: string) => {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;background:var(--accent,#22c55e);color:white;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;box-shadow:0 8px 32px rgba(0,0,0,0.3)';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  };
  const showError = (msg: string) => {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;background:#ef4444;color:white;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;box-shadow:0 8px 32px rgba(0,0,0,0.3)';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  // ============ HELPERS ============
  const regions = [
    { id: null as string | null, label: t('cinemaManagement.allRegions') },
    { id: 'north', label: t('cinemaManagement.north') },
    { id: 'central', label: t('cinemaManagement.central') },
    { id: 'south', label: t('cinemaManagement.south') },
  ];

  const isModern = theme === 'modern';
  const isDark = theme === 'dark';
  const cardBorder = isModern ? 'border-cinema-accent/15' : 'border-cinema-border/50';

  return (
    <div className="animate-fade-in">
      {/* ========== STATS BENTO GRID ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className={`p-5 bg-cinema-surface border ${cardBorder} rounded-2xl shadow-sm hover:border-cinema-accent/20 transition-all duration-200`}>
          <div className="flex justify-between items-start mb-3">
            <span className="p-2 bg-cinema-accent/10 rounded-lg text-cinema-accent">
              <Store size={20} />
            </span>
            <span className="text-emerald-400 text-xs font-semibold px-2 py-0.5 bg-emerald-500/10 rounded-full">
              +2 {t('cinemaManagement.thisMonth')}
            </span>
          </div>
          <p className="text-cinema-text-muted text-xs font-medium uppercase tracking-wider">{t('cinemaManagement.totalCinemas')}</p>
          <p className="text-2xl font-bold mt-1 text-cinema-text">{totalCinemas}</p>
        </div>
        <div className={`p-5 bg-cinema-surface border ${cardBorder} rounded-2xl shadow-sm hover:border-cinema-accent/20 transition-all duration-200`}>
          <div className="flex justify-between items-start mb-3">
            <span className="p-2 bg-cinema-accent/10 rounded-lg text-cinema-accent">
              <TrendingUp size={20} />
            </span>
            <span className="text-emerald-400 text-xs font-semibold px-2 py-0.5 bg-emerald-500/10 rounded-full">
              {totalCinemas > 0 ? `${Math.round((activeCinemas / totalCinemas) * 100)}%` : '0%'}
            </span>
          </div>
          <p className="text-cinema-text-muted text-xs font-medium uppercase tracking-wider">{t('cinemaManagement.activeCinemas')}</p>
          <p className="text-2xl font-bold mt-1 text-cinema-text">{activeCinemas}</p>
        </div>
        <div className={`p-5 bg-cinema-surface border ${cardBorder} rounded-2xl shadow-sm hover:border-cinema-accent/20 transition-all duration-200`}>
          <div className="flex justify-between items-start mb-3">
            <span className="p-2 bg-cinema-accent/10 rounded-lg text-cinema-accent">
              <Monitor size={20} />
            </span>
          </div>
          <p className="text-cinema-text-muted text-xs font-medium uppercase tracking-wider">{t('cinemaManagement.totalRooms')}</p>
          <p className="text-2xl font-bold mt-1 text-cinema-text">{totalRooms}</p>
        </div>
        <div className={`p-5 bg-cinema-surface border ${cardBorder} rounded-2xl shadow-sm hover:border-cinema-accent/20 transition-all duration-200`}>
          <div className="flex justify-between items-start mb-3">
            <span className="p-2 bg-cinema-text/5 rounded-lg text-cinema-text">
              <Users size={20} />
            </span>
          </div>
          <p className="text-cinema-text-muted text-xs font-medium uppercase tracking-wider">{t('cinemaManagement.totalSeats')}</p>
          <p className="text-2xl font-bold mt-1 text-cinema-text">{totalSeats.toLocaleString('vi-VN')}</p>
        </div>
      </div>

      {/* ========== HEADER & SEARCH ========== */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-cinema-accent tracking-tight">
            {t('cinemaManagement.systemTitle')}
          </h1>
          <p className="text-sm text-cinema-text-muted mt-1">
            {t('cinemaManagement.systemDesc')}
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-cinema-accent hover:bg-cinema-accent-hover text-black font-bold text-xs rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-cinema-accent/10 whitespace-nowrap"
        >
          <Plus size={16} />
          {t('cinemaManagement.addNew')}
        </button>
      </div>

      {/* ========== FILTER BAR ========== */}
      <div className="flex items-center gap-4 mb-8 flex-wrap">
        <div className={`flex items-center p-1 rounded-xl border ${cardBorder} flex-1 min-w-[280px]`}
          style={{ background: isModern ? 'rgba(30, 41, 59, 0.6)' : isDark ? 'rgba(23, 31, 51, 0.6)' : 'var(--bg-surface)' }}>
          {regions.map(r => (
            <button
              key={r.id || 'all'}
              onClick={() => setRegionFilter(r.id)}
              className={`flex-1 px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                regionFilter === r.id
                  ? 'bg-cinema-accent/10 text-cinema-accent'
                  : 'text-cinema-text-muted hover:text-cinema-text'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="input flex items-center gap-2 px-3 h-9" style={{ minWidth: 180 }}>
            <Search size={14} className="text-cinema-text-muted shrink-0" />
            <input
              type="text"
              placeholder={t('cinemaManagement.searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-cinema-text w-full placeholder:text-cinema-text-muted/50"
              style={{ all: 'unset', width: '100%', fontSize: 13, color: 'var(--text-primary)' }}
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="input h-9 text-xs cursor-pointer min-w-[130px] appearance-auto"
          >
            <option value="newest">{t('cinemaManagement.sortNewest')}</option>
            <option value="oldest">{t('cinemaManagement.sortOldest')}</option>
            <option value="name-asc">{t('cinemaManagement.sortNameAsc')}</option>
            <option value="name-desc">{t('cinemaManagement.sortNameDesc')}</option>
          </select>
          <button className="btn btn-secondary w-9 h-9 flex items-center justify-center p-0" title="Filters">
            <SlidersHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* ========== LOADING ========== */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 size={28} className="text-cinema-accent animate-spin" />
        </div>
      )}

      {/* ========== ERROR ========== */}
      {!loading && error && (
        <div className="mb-4 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-center gap-3">
          <AlertCircle size={16} className="text-rose-400 shrink-0" />
          <span className="text-sm text-cinema-text flex-1">{error}</span>
          <button className="px-3 py-1.5 text-xs rounded-lg bg-cinema-surface border border-cinema-border/50 text-cinema-text hover:bg-cinema-elevated transition-colors" onClick={onRefresh}>
            {t('common.retry')}
          </button>
        </div>
      )}

      {/* ========== CINEMA CARDS GRID ========== */}
      {!loading && !error && displayCinemas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Building2 size={50} className="text-cinema-text-muted opacity-30" />
          <p className="text-sm text-cinema-text-muted mt-3">
            {searchTerm ? t('cinemaManagement.noResults') : t('cinemaManagement.noCinemasYet')}
          </p>
        </div>
      )}

      {!loading && !error && displayCinemas.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {displayCinemas.map(cinema => (
            <article
              key={cinema.cinemaId}
              className={`group bg-cinema-surface border ${cardBorder} rounded-3xl overflow-hidden transition-all duration-300`}
              style={{ backdropFilter: isModern ? 'blur(12px)' : undefined }}
              onMouseEnter={e => {
                if (isDark || isModern) {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.4)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Card Image Placeholder */}
              <div className="h-36 relative overflow-hidden" style={{ background: isModern ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'var(--bg-surface-elevated)' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      cinema.theaterManagerName
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : 'text-rose-400 bg-rose-500/10'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cinema.theaterManagerName ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    {cinema.theaterManagerName ? t('cinemaManagement.active') : t('cinemaManagement.noManager')}
                  </span>
                </div>
                {/* Icon */}
                <div className="absolute left-5 -bottom-6 w-14 h-14 rounded-2xl bg-cinema-accent flex items-center justify-center border-[3px] border-cinema-surface shadow-lg">
                  <Film size={24} className="text-black" />
                </div>
              </div>

              {/* Card Body */}
              <div className="pt-10 px-6 pb-6">
                {/* Title */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-cinema-text truncate">
                      {cinema.cinemaName}
                    </h3>
                    <p className="text-xs text-cinema-text-muted mt-0.5">
                      {cinema.cinemaCity || cinema.cinemaLocation}
                    </p>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-cinema-text-muted">
                    <MapPin size={14} className="text-cinema-accent shrink-0" />
                    <span className="text-xs truncate">{cinema.cinemaLocation}</span>
                  </div>
                  {cinema.cinemaHotlineNumber && (
                    <div className="flex items-center gap-2 text-cinema-text-muted">
                      <Phone size={14} className="text-cinema-accent shrink-0" />
                      <span className="text-xs">{cinema.cinemaHotlineNumber}</span>
                    </div>
                  )}
                </div>

                {/* Stats Mini Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-cinema-elevated border border-cinema-border/30">
                    <p className="text-[10px] text-cinema-text-muted font-semibold uppercase tracking-wider">{t('cinemaManagement.roomsLabel')}</p>
                    <p className="text-lg font-extrabold text-cinema-text mt-0.5">{cinema.totalRooms || 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-cinema-elevated border border-cinema-border/30">
                    <p className="text-[10px] text-cinema-text-muted font-semibold uppercase tracking-wider">{t('cinemaManagement.totalSeatsLabel')}</p>
                    <p className="text-lg font-extrabold text-cinema-text mt-0.5">{((cinema.totalRooms || 0) * 150).toLocaleString('vi-VN')}</p>
                  </div>
                </div>

                {/* Occupancy Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-cinema-text-muted font-semibold">{t('cinemaManagement.occupancyRate')}</span>
                    <span className="text-[10px] font-bold text-cinema-text">
                      {cinema.theaterManagerName ? `${Math.round(70 + Math.random() * 25)}%` : '—'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-cinema-elevated overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cinema-accent to-cinema-accent-hover transition-all duration-500"
                      style={{ width: cinema.theaterManagerName ? `${70 + Math.random() * 25}%` : '0%' }}
                    />
                  </div>
                </div>
                {/* Personnel */}
                <div className="space-y-1.5 mb-1">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-indigo-500/5 border border-indigo-500/15">
                    <UserCog size={12} className="text-indigo-400 shrink-0" />
                    <span className="text-[10px] text-indigo-300/70 font-medium">{t('cinemaManagement.assignTheaterManager')}:</span>
                    <span className="text-[11px] font-semibold" style={{ color: cinema.theaterManagerName && cinema.theaterManagerName !== 'Chưa có' ? '#a5b4fc' : 'var(--text-muted)' }}>
                      {cinema.theaterManagerName && cinema.theaterManagerName !== 'Chưa có' ? cinema.theaterManagerName : t('cinemaManagement.notAssigned')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                    <Settings size={12} className="text-emerald-400 shrink-0" />
                    <span className="text-[10px] text-emerald-300/70 font-medium">{t('cinemaManagement.assignFacilitiesManager')}:</span>
                    <span className="text-[11px] font-semibold" style={{ color: cinema.facilitiesManagerName && cinema.facilitiesManagerName !== 'Chưa có' ? '#6ee7b7' : 'var(--text-muted)' }}>
                      {cinema.facilitiesManagerName && cinema.facilitiesManagerName !== 'Chưa có' ? cinema.facilitiesManagerName : t('cinemaManagement.notAssigned')}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => { setSelectedCinemaId(cinema.cinemaId); setIsDetailModalOpen(true); }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-cinema-elevated border border-cinema-border/30 text-cinema-text hover:bg-cinema-accent/10 hover:border-cinema-accent/20 transition-all"
                  >
                    <Eye size={13} />
                    {t('cinemaManagement.viewDetail')}
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(cinema)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-cinema-elevated border border-cinema-border/30 text-cinema-text hover:bg-cinema-accent/10 hover:border-cinema-accent/20 transition-all"
                  >
                    <Edit size={13} />
                    {t('cinemaManagement.edit')}
                  </button>
                  <button
                    onClick={() => setDeleteConfirmCinemaId(cinema.cinemaId)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all"
                  >
                    <Trash2 size={13} />
                    {t('cinemaManagement.delete')}
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => {
                          setItemToAssign({ id: cinema.cinemaId, name: cinema.cinemaName, assignType: 2 });
                          setIsAssignModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-cinema-accent/10 border border-cinema-accent/20 text-cinema-accent hover:bg-cinema-accent/20 transition-all"
                      >
                        <UserCog size={13} />
                        {t('cinemaManagement.assignTheaterManager')}
                      </button>
                      <button
                        onClick={() => {
                          setItemToAssign({ id: cinema.cinemaId, name: cinema.cinemaName, assignType: 1 });
                          setIsAssignModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all"
                      >
                        <Settings size={13} />
                        {t('cinemaManagement.assignFacilitiesManager')}
                      </button>
                      <button
                        onClick={() => setDepartmentModalCinemaId(cinema.cinemaId)}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                      >
                        <Users size={13} />
                        {t('cinemaManagement.departments')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ========== LOAD MORE ========== */}
      {!loading && !error && displayCinemas.length > 0 && (
        <div className="mt-10 flex justify-center">
          <button className="flex items-center gap-2 px-7 py-2.5 rounded-xl border border-cinema-border/50 text-xs font-semibold text-cinema-text bg-cinema-surface hover:bg-cinema-elevated transition-all">
            {t('cinemaManagement.loadMore')}
            <ChevronDown size={14} />
          </button>
        </div>
      )}

      {/* ========== CREATE MODAL ========== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={handleCloseCreateModal}>
          <div className={`relative w-full max-w-lg max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden ${
            isModern ? 'bg-[#0f172a]/95 backdrop-blur-2xl border-cinema-accent/20' : isDark ? 'bg-cinema-surface border-cinema-border/30' : 'bg-white border-gray-200'
          }`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between p-5 border-b ${isModern ? 'border-cinema-accent/20' : isDark ? 'border-cinema-border/30' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-black ${isDark || isModern ? 'text-white' : 'text-gray-900'}`}>{t('cinemaManagement.addNew')}</h2>
              <button onClick={handleCloseCreateModal} disabled={createLoading} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X size={16} className="text-cinema-text-muted" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
              {createSuccess && (
                <p className="text-sm text-cinema-text-muted">
                  {t('toast.cinemaCreated')}
                </p>
              )}
              {createError && (
                <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 flex items-center gap-2">
                  <AlertCircle size={14} className="text-rose-400" />
                  <span className="text-xs text-rose-400">{createError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-cinema-text-muted mb-1.5">Cinema Name *</label>
                <input name="cinemaName" value={formData.cinemaName} onChange={handleInputChange} required
                  className="w-full px-3.5 py-2.5 rounded-lg border text-sm bg-transparent text-cinema-text border-cinema-border/50 focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent/30 outline-none transition-all placeholder:text-cinema-text-muted/40"
                  placeholder="e.g. Galaxy Cinema Nguyễn Du" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-cinema-text-muted mb-1.5">{t('cinemaManagement.locationLabel')}</label>
                  <input name="cinemaLocation" value={formData.cinemaLocation} onChange={handleInputChange} required
                    className="w-full px-3.5 py-2.5 rounded-lg border text-sm bg-transparent text-cinema-text border-cinema-border/50 focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent/30 outline-none transition-all"
                    placeholder="e.g. 116 Nguyễn Du" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-cinema-text-muted mb-1.5">City *</label>
                  <select name="cinemaCity" value={formData.cinemaCity} onChange={handleInputChange} required
                    className="w-full px-3.5 py-2.5 rounded-lg border text-sm bg-transparent text-cinema-text border-cinema-border/50 focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent/30 outline-none transition-all">
                    <option value="" disabled>{t('cinemaManagement.cityLabel')}</option>
                    {VIETNAM_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-cinema-text-muted mb-1.5">Hotline *</label>
                  <input name="cinemaHotlineNumber" value={formData.cinemaHotlineNumber} onChange={handleInputChange} required
                    className="w-full px-3.5 py-2.5 rounded-lg border text-sm bg-transparent text-cinema-text border-cinema-border/50 focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent/30 outline-none transition-all"
                    placeholder="e.g. 19002235" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-cinema-text-muted mb-1.5">Opening Date</label>
                  <input type="datetime-local" value={toVietnamDateTimeLocalValue(formData.activeAt)} onChange={handleDateChange}
                    className="w-full px-3.5 py-2.5 rounded-lg border text-sm bg-transparent text-cinema-text border-cinema-border/50 focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent/30 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-cinema-text-muted mb-1.5">Description</label>
                <textarea name="cinemaDescription" value={formData.cinemaDescription} onChange={handleInputChange} rows={2}
                  className="w-full px-3.5 py-2.5 rounded-lg border text-sm bg-transparent text-cinema-text border-cinema-border/50 focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent/30 outline-none transition-all resize-none"
                  placeholder="Optional description" />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-cinema-border/30">
                <button type="button" onClick={handleCloseCreateModal} disabled={createLoading}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-cinema-elevated border border-cinema-border/30 text-cinema-text hover:bg-cinema-surface transition-all">
                  {t('cinemaManagement.cancel')}
                </button>
                <button type="submit" disabled={createLoading}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold bg-cinema-accent text-black hover:bg-cinema-accent-hover transition-all disabled:opacity-50">
                  {createLoading ? <><Loader2 size={12} className="animate-spin" /> {t('cinemaManagement.creating')}</> : t('cinemaManagement.createCinema')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== EDIT MODAL ========== */}
      {isEditModalOpen && editCinema && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}>
          <div className={`relative w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden ${
            isModern ? 'bg-[#0f172a]/95 backdrop-blur-2xl border-cinema-accent/20' : isDark ? 'bg-cinema-surface border-cinema-border/30' : 'bg-white border-gray-200'
          }`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between p-5 border-b ${isModern ? 'border-cinema-accent/20' : isDark ? 'border-cinema-border/30' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-black ${isDark || isModern ? 'text-white' : 'text-gray-900'}`}>{t('cinemaManagement.editCinema')}</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X size={16} className="text-cinema-text-muted" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-cinema-text-muted mb-1.5">{t('cinemaManagement.cinemaNameLabel')}</label>
                  <input value={editFormData.cinemaName} onChange={e => setEditFormData(p => ({ ...p, cinemaName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-lg border text-sm bg-transparent text-cinema-text border-cinema-border/50 focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent/30 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-cinema-text-muted mb-1.5">{t('cinemaManagement.cityLabel')}</label>
                  <select value={editFormData.cinemaCity} onChange={e => setEditFormData(p => ({ ...p, cinemaCity: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-lg border text-sm bg-transparent text-cinema-text border-cinema-border/50 focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent/30 outline-none">
                    {VIETNAM_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-cinema-text-muted mb-1.5">Location</label>
                <input value={editFormData.cinemaLocation} onChange={e => setEditFormData(p => ({ ...p, cinemaLocation: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-lg border text-sm bg-transparent text-cinema-text border-cinema-border/50 focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent/30 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-cinema-text-muted mb-1.5">{t('cinemaManagement.hotlineLabel')}</label>
                  <input value={editFormData.cinemaHotlineNumber} onChange={e => setEditFormData(p => ({ ...p, cinemaHotlineNumber: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-lg border text-sm bg-transparent text-cinema-text border-cinema-border/50 focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent/30 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-cinema-text-muted mb-1.5">Description</label>
                <textarea value={editFormData.cinemaDescription} onChange={e => setEditFormData(p => ({ ...p, cinemaDescription: e.target.value }))} rows={2}
                  className="w-full px-3.5 py-2.5 rounded-lg border text-sm bg-transparent text-cinema-text border-cinema-border/50 focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent/30 outline-none resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-cinema-border/30">
                <button type="button" onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-cinema-elevated border border-cinema-border/30 text-cinema-text hover:bg-cinema-surface transition-all">Hủy</button>
                <button type="submit" disabled={editLoading}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold bg-cinema-accent text-black hover:bg-cinema-accent-hover transition-all disabled:opacity-50">
                  {editLoading ? <><Loader2 size={12} className="animate-spin" /> {t('cinemaManagement.saving')}</> : t('cinemaManagement.saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== DELETE CONFIRM ========== */}
      {deleteConfirmCinemaId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmCinemaId(null)}>
          <div className={`relative w-full max-w-sm rounded-xl border shadow-2xl ${
            isModern ? 'bg-[#0f172a]/95 backdrop-blur-2xl border-cinema-accent/20' : isDark ? 'bg-cinema-surface border-cinema-border/30' : 'bg-white border-gray-200'
          }`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between p-5 border-b ${isModern ? 'border-cinema-accent/20' : isDark ? 'border-cinema-border/30' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-black ${isDark || isModern ? 'text-white' : 'text-gray-900'}`}>{t('cinemaManagement.confirmDelete')}</h2>
              <button onClick={() => setDeleteConfirmCinemaId(null)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X size={16} className="text-cinema-text-muted" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-cinema-text-muted leading-relaxed">
                {t('cinemaManagement.confirmDeleteDesc')}
              </p>
            </div>
            <div className="flex justify-end gap-3 p-5 pt-0">
              <button onClick={() => setDeleteConfirmCinemaId(null)} disabled={deleting}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-cinema-elevated border border-cinema-border/30 text-cinema-text hover:bg-cinema-surface transition-all">Hủy</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all disabled:opacity-50">
                {deleting ? <><Loader2 size={12} className="animate-spin" /> {t('cinemaManagement.deleting')}</> : t('cinemaManagement.deleteConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== DETAIL MODAL ========== */}
      {selectedCinemaId && (
        <CinemaDetailModal
          cinemaId={selectedCinemaId}
          isOpen={isDetailModalOpen}
          onClose={() => { setIsDetailModalOpen(false); setSelectedCinemaId(null); }}
        />
      )}

      {/* ========== ASSIGN RIGHTS MODAL ========== */}
      {isAdmin && itemToAssign && (
        <AssignRightsModal
          isOpen={isAssignModalOpen}
          onClose={() => { setIsAssignModalOpen(false); setItemToAssign(null); }}
          itemId={itemToAssign.id}
          itemName={itemToAssign.name}
          type={itemToAssign.assignType}
          onSuccess={() => onRefresh && onRefresh()}
        />
      )}

      {/* ========== DEPARTMENT MODAL ========== */}
      {isAdmin && departmentModalCinemaId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDepartmentModalCinemaId(null)}>
          <div className={`relative w-full max-w-2xl max-h-[85vh] rounded-2xl border shadow-2xl overflow-hidden ${
            isModern ? 'bg-[#0b1326]/95 backdrop-blur-2xl border-cinema-accent/15' : isDark ? 'bg-cinema-surface border-cinema-border/30' : 'bg-white border-gray-200'
          }`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${
              isModern ? 'border-cinema-accent/15' : isDark ? 'border-cinema-border/20' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-soft)' }}>
                  <Users size={18} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold" style={{ color: isDark || isModern ? 'var(--text-primary)' : '#09090b' }}>
                    Phòng Ban Thu Ngân
                  </h3>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {cinemas.find(c => c.cinemaId === departmentModalCinemaId)?.cinemaName || ''}
                  </p>
                </div>
              </div>
              <button onClick={() => setDepartmentModalCinemaId(null)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(85vh - 70px)' }}>
              <DepartmentManager
                cinemas={cinemas}
                activeCinemaId={departmentModalCinemaId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CinemaManagement;
