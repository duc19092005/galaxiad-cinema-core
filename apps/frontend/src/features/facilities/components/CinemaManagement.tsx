// src/features/facilities/components/CinemaManagement.tsx
// Premium design for Cinema Complex management (Admin)
// Using tailwind cinema-* class system matching VouchersSection colors

import React, { useState } from 'react';
import {
  Building2, Plus, Search, Edit, MapPin, Phone, Film, Eye, Loader2,
  AlertCircle, X, Trash2, Monitor, Users, Store, TrendingUp,
  SlidersHorizontal, ChevronDown, UserCog, Settings, Check,
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
  const [isEditCityOpen, setIsEditCityOpen] = useState(false);
  const [isCreateCityOpen, setIsCreateCityOpen] = useState(false);

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
    setIsCreateCityOpen(false);
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

  return (
    <div className="animate-fade-in">
      {/* ========== STATS BENTO GRID ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Card: Tổng cụm rạp */}
        <div className="bg-cinema-surface p-6 rounded-2xl border border-cinema-border/50 relative overflow-hidden shadow-sm hover:border-cinema-accent/30 transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-cinema-accent/10 p-3 rounded-xl text-cinema-accent">
              <Store size={24} />
            </div>
            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-bold">
              +2 {t('cinemaManagement.thisMonth')}
            </span>
          </div>
          <h3 className="text-cinema-text-muted text-xs font-medium uppercase tracking-wider">{t('cinemaManagement.totalCinemas')}</h3>
          <p className="text-3xl font-bold mt-1 text-cinema-text">{totalCinemas}</p>
        </div>

        {/* Card: Rạp đang hoạt động */}
        <div className="bg-cinema-surface p-6 rounded-2xl border border-cinema-border/50 shadow-sm hover:border-cinema-accent/30 transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-cinema-accent/10 p-3 rounded-xl text-cinema-accent">
              <TrendingUp size={24} />
            </div>
            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-bold">
              {totalCinemas > 0 ? `${Math.round((activeCinemas / totalCinemas) * 100)}%` : '0%'}
            </span>
          </div>
          <h3 className="text-cinema-text-muted text-xs font-medium uppercase tracking-wider">{t('cinemaManagement.activeCinemas')}</h3>
          <p className="text-3xl font-bold mt-1 text-cinema-text">{activeCinemas}</p>
        </div>

        {/* Card: Tổng số phòng chiếu */}
        <div className="bg-cinema-surface p-6 rounded-2xl border border-cinema-border/50 shadow-sm hover:border-cinema-accent/30 transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-cinema-accent/10 p-3 rounded-xl text-cinema-accent">
              <Monitor size={24} />
            </div>
          </div>
          <h3 className="text-cinema-text-muted text-xs font-medium uppercase tracking-wider">{t('cinemaManagement.totalRooms')}</h3>
          <p className="text-3xl font-bold mt-1 text-cinema-text">{totalRooms}</p>
        </div>

        {/* Card: Tổng số ghế */}
        <div className="bg-cinema-surface p-6 rounded-2xl border border-cinema-border/50 shadow-sm hover:border-cinema-accent/30 transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-cinema-accent/10 p-3 rounded-xl text-cinema-accent">
              <Users size={24} />
            </div>
          </div>
          <h3 className="text-cinema-text-muted text-xs font-medium uppercase tracking-wider">{t('cinemaManagement.totalSeats')}</h3>
          <p className="text-3xl font-bold mt-1 text-cinema-text">{totalSeats.toLocaleString('vi-VN')}</p>
        </div>
      </div>

      {/* ========== HEADER & SEARCH ========== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-cinema-accent tracking-tight">
            {t('cinemaManagement.systemTitle')}
          </h1>
          <p className="text-cinema-text-muted text-sm mt-1">
            {t('cinemaManagement.systemDesc')}
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-cinema-accent text-black font-bold py-3 px-6 rounded-xl flex items-center gap-2 hover:bg-cinema-accent-hover transition-all shadow-lg shadow-cinema-accent/20 text-xs uppercase tracking-wider active:scale-[0.98]"
        >
          <Plus size={18} />
          {t('cinemaManagement.addNew')}
        </button>
      </div>

      {/* ========== FILTER BAR ========== */}
      <div className="flex flex-wrap items-center gap-4 bg-cinema-surface/30 p-2 rounded-2xl border border-cinema-border/50 mb-8">
        <div className="flex bg-cinema-surface rounded-xl p-1 overflow-hidden">
          {regions.map(r => (
            <button
              key={r.id || 'all'}
              onClick={() => setRegionFilter(r.id)}
              className={`px-6 md:px-8 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                regionFilter === r.id
                  ? 'bg-cinema-elevated text-cinema-text'
                  : 'text-cinema-text-muted hover:text-cinema-text'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cinema-text-muted" />
          <input
            type="text"
            placeholder={t('cinemaManagement.searchPlaceholder')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-cinema-surface border-none rounded-xl pl-12 py-3 text-sm focus:ring-1 focus:ring-cinema-accent text-cinema-text placeholder:text-cinema-text-muted/50 outline-none"
            style={{ all: 'unset', boxSizing: 'border-box', width: '100%', backgroundColor: 'var(--bg-surface)', paddingLeft: '3rem', paddingRight: '1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem', borderRadius: '0.75rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex items-center gap-2 bg-cinema-surface px-4 py-3 rounded-xl border border-cinema-border/50 min-w-[180px]">
          <span className="text-xs text-cinema-text-muted whitespace-nowrap">Sắp xếp:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full cursor-pointer select select-transparent text-cinema-text"
          >
            <option value="newest" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}>{t('cinemaManagement.sortNewest')}</option>
            <option value="oldest" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}>{t('cinemaManagement.sortOldest')}</option>
            <option value="name-asc" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}>{t('cinemaManagement.sortNameAsc')}</option>
            <option value="name-desc" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}>{t('cinemaManagement.sortNameDesc')}</option>
          </select>
        </div>
        <button className="bg-cinema-surface p-3 rounded-xl border border-cinema-border/50 hover:bg-cinema-elevated transition-colors">
          <SlidersHorizontal size={18} className="text-cinema-text-muted" />
        </button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {displayCinemas.map(cinema => {
            const hasTheaterManager = cinema.theaterManagerName && cinema.theaterManagerName !== 'Chưa có';
            return (
              <div
                key={cinema.cinemaId}
                className="bg-cinema-surface rounded-3xl border border-cinema-border/50 overflow-hidden p-6 flex flex-col gap-6 relative group hover:border-cinema-accent/50 transition-colors duration-300"
              >
                <div className="flex justify-between items-start">
                  <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${
                    hasTheaterManager ? 'text-green-500' : 'text-rose-500'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      hasTheaterManager ? 'bg-green-500 animate-pulse' : 'bg-rose-500'
                    }`}></div>
                    {hasTheaterManager ? t('cinemaManagement.active') : t('cinemaManagement.noManager')}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="w-14 h-14 bg-cinema-accent rounded-2xl flex items-center justify-center shadow-inner">
                    <Film className="text-black w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-cinema-text truncate">{cinema.cinemaName}</h2>
                    <p className="text-cinema-text-muted text-xs mt-1">{cinema.cinemaCity || cinema.cinemaLocation}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-cinema-text-muted">
                    <MapPin className="w-4 h-4 text-cinema-accent shrink-0" />
                    <span className="text-xs truncate">{cinema.cinemaLocation}</span>
                  </div>
                  {cinema.cinemaHotlineNumber && (
                    <div className="flex items-center gap-3 text-cinema-text-muted">
                      <Phone className="w-4 h-4 text-cinema-accent shrink-0" />
                      <span className="text-xs">{cinema.cinemaHotlineNumber}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-cinema-bg/50 p-4 rounded-2xl border border-cinema-border/50">
                    <span className="text-[10px] text-cinema-text-muted uppercase font-semibold">{t('cinemaManagement.roomsLabel')}</span>
                    <p className="text-xl font-bold text-cinema-text">{cinema.totalRooms || 0}</p>
                  </div>
                  <div className="bg-cinema-bg/50 p-4 rounded-2xl border border-cinema-border/50">
                    <span className="text-[10px] text-cinema-text-muted uppercase font-semibold">{t('cinemaManagement.totalSeatsLabel')}</span>
                    <p className="text-xl font-bold text-cinema-text">{((cinema.totalRooms || 0) * 150).toLocaleString('vi-VN')}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-medium">
                    <span className="text-cinema-text-muted">{t('cinemaManagement.occupancyRate')}</span>
                    <span className="text-cinema-text">
                      {hasTheaterManager ? `${Math.round(70 + Math.random() * 25)}%` : '—'}
                    </span>
                  </div>
                  <div className="h-2 bg-cinema-border/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cinema-accent rounded-full transition-all duration-500"
                      style={{ width: hasTheaterManager ? `${70 + Math.random() * 25}%` : '0%' }}
                    ></div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="bg-[#1D1E2D] p-3 rounded-xl flex items-center gap-3 text-xs">
                    <UserCog size={16} className="text-blue-400 shrink-0" />
                    <span className="text-gray-500 font-medium">QL Rạp:</span>
                    <span className="text-gray-300 font-semibold truncate">
                      {cinema.theaterManagerName && cinema.theaterManagerName !== 'Chưa có' 
                        ? cinema.theaterManagerName 
                        : t('cinemaManagement.notAssigned')}
                    </span>
                  </div>
                  <div className="bg-[#1A251E] p-3 rounded-xl flex items-center gap-3 text-xs">
                    <Settings size={16} className="text-green-400 shrink-0" />
                    <span className="text-gray-500 font-medium">QL CSVC:</span>
                    <span className="text-gray-300 font-semibold truncate">
                      {cinema.facilitiesManagerName && cinema.facilitiesManagerName !== 'Chưa có' 
                        ? cinema.facilitiesManagerName 
                        : <span className="text-gray-400 italic">Chưa có</span>}
                    </span>
                  </div>
                </div>

                {/* Primary Card Actions */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-cinema-border/50">
                  <button
                    onClick={() => { setSelectedCinemaId(cinema.cinemaId); setIsDetailModalOpen(true); }}
                    className="flex items-center justify-center gap-2 bg-cinema-elevated/50 hover:bg-cinema-elevated py-2.5 rounded-lg text-xs font-medium text-cinema-text transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {t('cinemaManagement.viewDetail')}
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(cinema)}
                    className="flex items-center justify-center gap-2 bg-cinema-elevated/50 hover:bg-cinema-elevated py-2.5 rounded-lg text-xs font-medium text-cinema-text transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    {t('cinemaManagement.edit')}
                  </button>
                  <button
                    onClick={() => setDeleteConfirmCinemaId(cinema.cinemaId)}
                    className="flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 py-2.5 rounded-lg text-xs font-medium text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t('cinemaManagement.delete')}
                  </button>
                </div>

                {/* Admin Assignment Actions */}
                {isAdmin && (
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-cinema-border/30">
                    <button
                      onClick={() => {
                        setItemToAssign({ id: cinema.cinemaId, name: cinema.cinemaName, assignType: 2 });
                        setIsAssignModalOpen(true);
                      }}
                      className="flex flex-col items-center justify-center p-1.5 rounded-lg text-[9px] font-semibold bg-cinema-accent/5 border border-cinema-accent/10 text-cinema-accent hover:bg-cinema-accent/15 transition-all text-center"
                      title={t('cinemaManagement.assignTheaterManager')}
                    >
                      <UserCog size={12} className="mb-0.5" />
                      <span>QL Rạp</span>
                    </button>
                    <button
                      onClick={() => {
                        setItemToAssign({ id: cinema.cinemaId, name: cinema.cinemaName, assignType: 1 });
                        setIsAssignModalOpen(true);
                      }}
                      className="flex flex-col items-center justify-center p-1.5 rounded-lg text-[9px] font-semibold bg-indigo-500/5 border border-indigo-500/10 text-indigo-400 hover:bg-indigo-500/15 transition-all text-center"
                      title={t('cinemaManagement.assignFacilitiesManager')}
                    >
                      <Settings size={12} className="mb-0.5" />
                      <span>QL CSVC</span>
                    </button>
                    <button
                      onClick={() => setDepartmentModalCinemaId(cinema.cinemaId)}
                      className="flex flex-col items-center justify-center p-1.5 rounded-lg text-[9px] font-semibold bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15 transition-all text-center"
                      title={t('cinemaManagement.departments')}
                    >
                      <Users size={12} className="mb-0.5" />
                      <span>Phòng ban</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========== LOAD MORE ========== */}
      {!loading && !error && displayCinemas.length > 0 && (
        <div className="mt-10 flex justify-center">
          <button className="flex items-center gap-2 px-7 py-2.5 rounded-xl border border-cinema-border/50 text-xs font-semibold text-cinema-text bg-cinema-surface hover:bg-cinema-elevated transition-all">
            {t('cinemaManagement.loadMore')}
          </button>
        </div>
      )}
        {/* ========== CREATE MODAL ========== */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={handleCloseCreateModal}>
          <div
            className="w-full max-w-xl bg-cinema-elevated border border-cinema-border rounded-2xl shadow-2xl flex flex-col max-h-[calc(100vh-48px)] min-h-0 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-cinema-border flex-shrink-0">
              <div className="flex items-center gap-2 text-cinema-accent">
                <Building2 size={20} />
                <h3 className="text-lg font-extrabold text-cinema-text">
                  {t('cinemaManagement.addNew')}
                </h3>
              </div>
              <button
                onClick={handleCloseCreateModal}
                disabled={createLoading}
                className="p-1.5 bg-cinema-bg hover:bg-cinema-surface rounded-full text-cinema-text-muted hover:text-cinema-text transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 min-h-0">
              <form id="cinema-form" onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
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
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-cinema-text-muted">Cinema Name *</label>
                  <input
                    name="cinemaName"
                    value={formData.cinemaName}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Galaxy Cinema Nguyễn Du"
                    className="w-full px-4 py-2 bg-cinema-surface border border-cinema-border/80 rounded-xl text-sm text-cinema-text focus:ring-1 focus:ring-cinema-accent focus:border-cinema-accent outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-cinema-text-muted">{t('cinemaManagement.locationLabel')} *</label>
                    <input
                      name="cinemaLocation"
                      value={formData.cinemaLocation}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. 116 Nguyễn Du"
                      className="w-full px-4 py-2 bg-cinema-surface border border-cinema-border/80 rounded-xl text-sm text-cinema-text focus:ring-1 focus:ring-cinema-accent focus:border-cinema-accent outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 relative">
                    <label className="text-xs font-bold text-cinema-text-muted">City *</label>
                    <button
                      type="button"
                      onClick={() => setIsCreateCityOpen(!isCreateCityOpen)}
                      className="w-full px-4 py-2 bg-cinema-surface border border-cinema-border/80 rounded-xl text-sm text-cinema-text focus:ring-1 focus:ring-cinema-accent focus:border-cinema-accent outline-none flex items-center justify-between cursor-pointer text-left"
                    >
                      <span className={formData.cinemaCity ? 'text-cinema-text' : 'text-cinema-text-muted/40'}>
                        {formData.cinemaCity || t('cinemaManagement.cityLabel')}
                      </span>
                      <ChevronDown size={16} className={`text-cinema-text-muted transition-transform duration-200 ${isCreateCityOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isCreateCityOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsCreateCityOpen(false)} />
                        <div className="absolute z-50 w-full mt-14.5 bg-cinema-surface border border-cinema-border rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                          {VIETNAM_CITIES.map(city => (
                            <button
                              key={city}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, cinemaCity: city }));
                                setIsCreateCityOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                formData.cinemaCity === city
                                  ? 'bg-cinema-accent text-black font-bold'
                                  : 'text-cinema-text hover:bg-cinema-elevated hover:text-cinema-accent'
                              }`}
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-cinema-text-muted">Hotline *</label>
                    <input
                      name="cinemaHotlineNumber"
                      value={formData.cinemaHotlineNumber}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. 19002235"
                      className="w-full px-4 py-2 bg-cinema-surface border border-cinema-border/80 rounded-xl text-sm text-cinema-text focus:ring-1 focus:ring-cinema-accent focus:border-cinema-accent outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-cinema-text-muted">Opening Date</label>
                    <input
                      type="datetime-local"
                      value={toVietnamDateTimeLocalValue(formData.activeAt)}
                      onChange={handleDateChange}
                      className="w-full px-4 py-2 bg-cinema-surface border border-cinema-border/80 rounded-xl text-sm text-cinema-text focus:ring-1 focus:ring-cinema-accent focus:border-cinema-accent outline-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-cinema-text-muted">Description</label>
                  <textarea
                    name="cinemaDescription"
                    value={formData.cinemaDescription}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Optional description..."
                    className="w-full px-4 py-2 bg-cinema-surface border border-cinema-border/80 rounded-xl text-sm text-cinema-text focus:ring-1 focus:ring-cinema-accent focus:border-cinema-accent outline-none resize-none"
                  />
                </div>
              </form>
            </div>

            {/* Sticky Footer */}
            <div className="px-6 py-4 border-t border-cinema-border flex gap-3 flex-shrink-0 bg-cinema-elevated">
              <button
                type="button"
                onClick={handleCloseCreateModal}
                disabled={createLoading}
                className="flex-1 py-2.5 bg-cinema-surface hover:bg-cinema-bg text-cinema-text border border-cinema-border rounded-xl text-sm font-semibold transition-colors duration-200"
              >
                {t('cinemaManagement.cancel')}
              </button>
              <button
                form="cinema-form"
                type="submit"
                disabled={createLoading}
                className="flex-[2] py-2.5 bg-cinema-accent hover:bg-cinema-accent-hover disabled:bg-cinema-accent/50 disabled:cursor-not-allowed text-black rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.99] shadow-lg shadow-cinema-accent/15"
              >
                {createLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {t('cinemaManagement.creating')}
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    {t('cinemaManagement.createCinema')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== EDIT MODAL ========== */}
      {isEditModalOpen && editCinema && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div
            className="w-full max-w-xl bg-cinema-elevated border border-cinema-border rounded-2xl shadow-2xl flex flex-col max-h-[calc(100vh-48px)] min-h-0 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-cinema-border flex-shrink-0">
              <div className="flex items-center gap-2 text-cinema-accent">
                <Edit size={20} />
                <h3 className="text-lg font-extrabold text-cinema-text">
                  {t('cinemaManagement.editCinema')}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 bg-cinema-bg hover:bg-cinema-surface rounded-full text-cinema-text-muted hover:text-cinema-text transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 min-h-0">
              <form id="edit-cinema-form" onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-cinema-text-muted">{t('cinemaManagement.cinemaNameLabel')} *</label>
                  <input
                    value={editFormData.cinemaName}
                    onChange={e => setEditFormData(p => ({ ...p, cinemaName: e.target.value }))}
                    required
                    className="w-full px-4 py-2 bg-cinema-surface border border-cinema-border/80 rounded-xl text-sm text-cinema-text focus:ring-1 focus:ring-cinema-accent focus:border-cinema-accent outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-cinema-text-muted">Location *</label>
                    <input
                      value={editFormData.cinemaLocation}
                      onChange={e => setEditFormData(p => ({ ...p, cinemaLocation: e.target.value }))}
                      required
                      className="w-full px-4 py-2 bg-cinema-surface border border-cinema-border/80 rounded-xl text-sm text-cinema-text focus:ring-1 focus:ring-cinema-accent focus:border-cinema-accent outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 relative">
                    <label className="text-xs font-bold text-cinema-text-muted">{t('cinemaManagement.cityLabel')} *</label>
                    <button
                      type="button"
                      onClick={() => setIsEditCityOpen(!isEditCityOpen)}
                      className="w-full px-4 py-2 bg-cinema-surface border border-cinema-border/80 rounded-xl text-sm text-cinema-text focus:ring-1 focus:ring-cinema-accent focus:border-cinema-accent outline-none flex items-center justify-between cursor-pointer text-left"
                    >
                      <span className={editFormData.cinemaCity ? 'text-cinema-text' : 'text-cinema-text-muted/40'}>
                        {editFormData.cinemaCity || t('cinemaManagement.cityLabel')}
                      </span>
                      <ChevronDown size={16} className={`text-cinema-text-muted transition-transform duration-200 ${isEditCityOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isEditCityOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsEditCityOpen(false)} />
                        <div className="absolute z-50 w-full mt-14.5 bg-cinema-surface border border-cinema-border rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                          {VIETNAM_CITIES.map(city => (
                            <button
                              key={city}
                              type="button"
                              onClick={() => {
                                setEditFormData(prev => ({ ...prev, cinemaCity: city }));
                                setIsEditCityOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                editFormData.cinemaCity === city
                                  ? 'bg-cinema-accent text-black font-bold'
                                  : 'text-cinema-text hover:bg-cinema-elevated hover:text-cinema-accent'
                              }`}
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-cinema-text-muted">{t('cinemaManagement.hotlineLabel')} *</label>
                    <input
                      value={editFormData.cinemaHotlineNumber}
                      onChange={e => setEditFormData(p => ({ ...p, cinemaHotlineNumber: e.target.value }))}
                      required
                      className="w-full px-4 py-2 bg-cinema-surface border border-cinema-border/80 rounded-xl text-sm text-cinema-text focus:ring-1 focus:ring-cinema-accent focus:border-cinema-accent outline-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-cinema-text-muted">Description</label>
                  <textarea
                    value={editFormData.cinemaDescription}
                    onChange={e => setEditFormData(p => ({ ...p, cinemaDescription: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 bg-cinema-surface border border-cinema-border/80 rounded-xl text-sm text-cinema-text focus:ring-1 focus:ring-cinema-accent focus:border-cinema-accent outline-none resize-none"
                  />
                </div>
              </form>
            </div>

            {/* Sticky Footer */}
            <div className="px-6 py-4 border-t border-cinema-border flex gap-3 flex-shrink-0 bg-cinema-elevated">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                disabled={editLoading}
                className="flex-1 py-2.5 bg-cinema-surface hover:bg-cinema-bg text-cinema-text border border-cinema-border rounded-xl text-sm font-semibold transition-colors duration-200"
              >
                Hủy
              </button>
              <button
                form="edit-cinema-form"
                type="submit"
                disabled={editLoading}
                className="flex-[2] py-2.5 bg-cinema-accent hover:bg-cinema-accent-hover disabled:bg-cinema-accent/50 disabled:cursor-not-allowed text-black rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.99] shadow-lg shadow-cinema-accent/15"
              >
                {editLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {t('cinemaManagement.saving')}
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    {t('cinemaManagement.saveChanges')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* ========== DELETE CONFIRM ========== */}
      {deleteConfirmCinemaId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmCinemaId(null)}>
          <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-black text-cinema-text">{t('cinemaManagement.confirmDelete')}</h2>
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
        <div className="modal-overlay z-[70]" onClick={() => setDepartmentModalCinemaId(null)}>
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
