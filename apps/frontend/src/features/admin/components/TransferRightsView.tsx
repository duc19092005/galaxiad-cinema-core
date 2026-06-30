// src/features/admin/components/TransferRightsView.tsx
import React, { useState, useEffect } from 'react';
import {
  ArrowRight, Building2, ShieldAlert, Search,
  ChevronRight, Loader2, Users, Info,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { transferRightsApi } from '../../../api/transferRightsApi';
import type { ManagerDto, ManagedItemDto } from '../../../types/admin.types';
import { showSuccess, showError } from '../../../utils/ToastUtils';

const TransferRightsView: React.FC = () => {
  const { t } = useTranslation();

  const [managers, setManagers] = useState<ManagerDto[]>([]);
  const [sourceUserId, setSourceUserId] = useState<string>('');
  const [targetUserId, setTargetUserId] = useState<string>('');
  
  // Lists for the three categories
  const [items1, setItems1] = useState<ManagedItemDto[]>([]); // CSVC
  const [items2, setItems2] = useState<ManagedItemDto[]>([]); // Vận hành
  const [items3, setItems3] = useState<ManagedItemDto[]>([]); // Phim
  
  // selectedItems Map: key is itemId, value is transferType (1 | 2 | 3)
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  
  const [loadingItems, setLoadingItems] = useState(false);
  const [executing, setExecuting] = useState(false);

  // Load all unique managers across all asset types on mount
  useEffect(() => {
    const fetchAllManagers = async () => {
      try {
        const [res1, res2, res3] = await Promise.all([
          transferRightsApi.getManagers(1),
          transferRightsApi.getManagers(2),
          transferRightsApi.getManagers(3),
        ]);
        
        const uniqueMap = new Map<string, ManagerDto>();
        [...(res1.data || []), ...(res2.data || []), ...(res3.data || [])].forEach(m => {
          uniqueMap.set(m.userId, m);
        });
        
        setManagers(Array.from(uniqueMap.values()));
      } catch (error) {
        showError(t('toast.loadManagersFailed'));
      }
    };
    fetchAllManagers();
  }, [t]);

  // Load all asset types for selected source manager in parallel
  useEffect(() => {
    const fetchAllItems = async () => {
      setLoadingItems(true);
      setSelectedItems(new Map());
      try {
        const uid = sourceUserId === 'unmanaged' ? undefined : (sourceUserId || undefined);
        const [res1, res2, res3] = await Promise.all([
          transferRightsApi.getManagedItems(1, uid),
          transferRightsApi.getManagedItems(2, uid),
          transferRightsApi.getManagedItems(3, uid),
        ]);
        setItems1(res1.data || []);
        setItems2(res2.data || []);
        setItems3(res3.data || []);
      } catch (error) {
        showError(t('toast.loadItemsFailed'));
      } finally {
        setLoadingItems(false);
      }
    };

    if (sourceUserId === '') {
      setItems1([]);
      setItems2([]);
      setItems3([]);
      setSelectedItems(new Map());
      return;
    }
    fetchAllItems();
  }, [sourceUserId]);

  // Filter helper
  const filterList = (list: ManagedItemDto[]) => {
    return list.filter(item => 
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const filteredItems1 = filterList(items1);
  const filteredItems2 = filterList(items2);
  const filteredItems3 = filterList(items3);

  const totalFilteredCount = filteredItems1.length + filteredItems2.length + filteredItems3.length;
  
  const isAllSelected = totalFilteredCount > 0 && 
    filteredItems1.every(item => selectedItems.has(item.itemId)) &&
    filteredItems2.every(item => selectedItems.has(item.itemId)) &&
    filteredItems3.every(item => selectedItems.has(item.itemId));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItems(prev => {
        const next = new Map(prev);
        filteredItems1.forEach(item => next.delete(item.itemId));
        filteredItems2.forEach(item => next.delete(item.itemId));
        filteredItems3.forEach(item => next.delete(item.itemId));
        return next;
      });
    } else {
      setSelectedItems(prev => {
        const next = new Map(prev);
        filteredItems1.forEach(item => next.set(item.itemId, 1));
        filteredItems2.forEach(item => next.set(item.itemId, 2));
        filteredItems3.forEach(item => next.set(item.itemId, 3));
        return next;
      });
    }
  };

  const toggleItemSelect = (itemId: string, type: 1 | 2 | 3) => {
    setSelectedItems(prev => {
      const next = new Map(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.set(itemId, type);
      }
      return next;
    });
  };

  const handleExecuteTransfer = async () => {
    if (!targetUserId) {
      showError(t('toast.selectTargetManager'));
      return;
    }
    if (selectedItems.size === 0) {
      showError(t('transferRights.selectAssetsError'));
      return;
    }
    const apiSourceUserId = sourceUserId === 'unmanaged' ? null : sourceUserId;
    if (apiSourceUserId === targetUserId) {
      showError(t('toast.samePersonError'));
      return;
    }

    if (!window.confirm(t('transferRights.confirmTransfer'))) return;

    setExecuting(true);
    try {
      const promises = Array.from(selectedItems.entries()).map(([itemId, type]) =>
        transferRightsApi.executeTransfer({
          sourceUserId: apiSourceUserId,
          targetUserId,
          transferType: type,
          itemId,
        })
      );
      await Promise.all(promises);
      
      showSuccess(t('toast.transferSuccessBulk', { count: selectedItems.size }));
      
      // Reload assets
      setSelectedItems(new Map());
      const uid = sourceUserId === 'unmanaged' ? undefined : (sourceUserId || undefined);
      const [res1, res2, res3] = await Promise.all([
        transferRightsApi.getManagedItems(1, uid),
        transferRightsApi.getManagedItems(2, uid),
        transferRightsApi.getManagedItems(3, uid),
      ]);
      setItems1(res1.data || []);
      setItems2(res2.data || []);
      setItems3(res3.data || []);
    } catch (error: any) {
      showError(error.response?.data?.message || t('toast.transferFailed'));
    } finally {
      setExecuting(false);
    }
  };

  // Stepper styles generator
  const getStepStyles = (stepNum: number) => {
    let isActive = false;
    let isCompleted = false;

    if (stepNum === 1) {
      if (!sourceUserId) isActive = true;
      else isCompleted = true;
    } else if (stepNum === 2) {
      if (sourceUserId && selectedItems.size === 0) isActive = true;
      else if (sourceUserId && selectedItems.size > 0) isCompleted = true;
    } else if (stepNum === 3) {
      if (sourceUserId && selectedItems.size > 0 && !targetUserId) isActive = true;
      else if (sourceUserId && selectedItems.size > 0 && targetUserId) isCompleted = true;
    }

    if (isCompleted) {
      return {
        circle: 'border-2 border-cinema-success bg-cinema-success text-black',
        text: 'text-cinema-success font-bold'
      };
    }
    if (isActive) {
      return {
        circle: 'border-2 border-cinema-accent bg-cinema-accent text-black',
        text: 'text-cinema-accent font-bold'
      };
    }
    return {
      circle: 'border-2 border-cinema-border bg-cinema-surface text-cinema-text-muted',
      text: 'text-cinema-text-muted opacity-60'
    };
  };

  const selectedTargetManager = managers.find(m => m.userId === targetUserId);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header Section */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-cinema-accent mb-1">
          {t('transferRights.transferManagement')}
        </h2>
        <p className="text-cinema-text-muted text-sm max-w-2xl">
          {t('transferRights.transferDescription')}
        </p>
      </div>

      {/* Visual Stepper */}
      <div className="relative flex items-center justify-between mb-8 px-6 md:px-12 z-10">
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-cinema-border/50 z-0 -translate-y-1/2"></div>
        
        <div className="relative flex flex-col items-center gap-2 bg-cinema-bg px-4 z-10">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${getStepStyles(1).circle}`}>1</div>
          <span className={`text-[10px] font-mono tracking-wider transition-all duration-300 ${getStepStyles(1).text}`}>{t('transferRights.transferor')}</span>
        </div>
        
        <div className="relative flex flex-col items-center gap-2 bg-cinema-bg px-4 z-10">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${getStepStyles(2).circle}`}>2</div>
          <span className={`text-[10px] font-mono tracking-wider transition-all duration-300 ${getStepStyles(2).text}`}>{t('transferRights.transferredAssets')}</span>
        </div>
        
        <div className="relative flex flex-col items-center gap-2 bg-cinema-bg px-4 z-10">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${getStepStyles(3).circle}`}>3</div>
          <span className={`text-[10px] font-mono tracking-wider transition-all duration-300 ${getStepStyles(3).text}`}>{t('transferRights.recipient')}</span>
        </div>
      </div>

      {/* Main Interactive Columns (Bento Grid Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Column 1: From Manager */}
        <section className="lg:col-span-3">
          <div className="bg-cinema-surface border border-cinema-border/50 p-6 rounded-2xl h-full flex flex-col justify-between shadow-sm hover:border-cinema-accent/30 transition-all duration-200">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <ShieldAlert className="text-cinema-accent" size={20} />
                <h3 className="text-base font-bold text-cinema-text">{t('transferRights.fromManager')}</h3>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono tracking-wider text-cinema-text-muted uppercase">{t('transferRights.selectStaff')}</label>
                <div className="relative">
                  <select
                    value={sourceUserId}
                    onChange={e => setSourceUserId(e.target.value)}
                    className="w-full bg-cinema-elevated border border-cinema-border/60 p-3 pr-10 rounded-xl text-sm appearance-none focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent/30 outline-none transition-colors text-cinema-text select cursor-pointer"
                  >
                    <option value="" disabled className="bg-cinema-surface">{t('transferRights.selectTransferor')}</option>
                    <option value="unmanaged" className="bg-cinema-surface text-cinema-accent font-bold">{t('transferRights.unmanagedAssets')}</option>
                    {managers.map(m => (
                      <option key={m.userId} value={m.userId} className="bg-cinema-surface">{m.userName} ({m.userEmail})</option>
                    ))}
                  </select>
                  <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 rotate-90 text-cinema-text-muted" />
                </div>
              </div>

              {/* Summary Card */}
              {sourceUserId && (
                <div className="mt-4 p-4 bg-cinema-bg/60 rounded border border-cinema-border/30 space-y-2">
                  <p className="text-[10px] font-mono tracking-wider text-cinema-accent mb-1 uppercase font-bold">{t('transferRights.currentOverview')}</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-cinema-text-muted">{t('transferRights.facilities')}</span>
                      <span className="font-mono text-cinema-text font-semibold">{items1.length} {t('transferRights.items')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cinema-text-muted">{t('transferRights.operations')}</span>
                      <span className="font-mono text-cinema-text font-semibold">{items2.length} {t('transferRights.processes')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cinema-text-muted">{t('transferRights.movies')}</span>
                      <span className="font-mono text-cinema-text font-semibold">{items3.length} {t('transferRights.showtimes')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-8 text-[11px] text-cinema-text-muted/50 leading-relaxed font-mono">
              * {t('transferRights.transferOwnershipNote')}
            </div>
          </div>
        </section>

        {/* Column 2: Assets Selection */}
        <section className="lg:col-span-6">
          <div className="bg-cinema-surface border border-cinema-border/50 p-6 rounded-2xl h-full flex flex-col shadow-sm hover:border-cinema-accent/30 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Building2 className="text-cinema-accent" size={20} />
                <h3 className="text-base font-bold text-cinema-text">{t('transferRights.selectAssets')}</h3>
              </div>
              {sourceUserId && totalFilteredCount > 0 && (
                <button
                  onClick={handleToggleSelectAll}
                  className="text-xs font-mono text-cinema-accent hover:underline uppercase tracking-wider font-bold"
                >
                  {isAllSelected ? t('transferRights.deselectAll') : t('transferRights.selectAll')}
                </button>
              )}
            </div>

            {sourceUserId && !loadingItems && (
              <div className="relative mb-4">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cinema-text-muted" />
                <input
                  type="text"
                  placeholder={t('transferRights.searchAssets')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-cinema-elevated border border-cinema-border/60 rounded-full text-xs text-cinema-text focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent/30 outline-none transition-all"
                />
              </div>
            )}

            {sourceUserId ? (
              <div className="space-y-6 overflow-y-auto max-h-[380px] pr-2 custom-scrollbar flex-1 min-h-0">
                {loadingItems ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-60">
                    <Loader2 size={24} className="animate-spin text-cinema-accent" />
                    <span className="text-[10px] font-mono text-cinema-text-muted uppercase tracking-wider">{t('transferRights.loadingAssets')}</span>
                  </div>
                ) : (
                  <>
                    {/* Category: CSVC */}
                    <div>
                      <h4 className="text-[10px] font-mono tracking-wider text-cinema-text-muted mb-3 border-b border-cinema-border/50 pb-1 uppercase font-bold">{t('transferRights.categoryFacilities')}</h4>
                      {filteredItems1.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {filteredItems1.map(item => {
                            const isChecked = selectedItems.has(item.itemId);
                            return (
                              <label
                                key={item.itemId}
                                className={`flex items-center gap-3 p-3 bg-cinema-elevated/45 rounded-xl cursor-pointer hover:bg-cinema-elevated transition-colors group border ${
                                  isChecked ? 'bg-cinema-accent/10 border-cinema-accent/30' : 'border-cinema-border/30'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleItemSelect(item.itemId, 1)}
                                  className="rounded border-cinema-border text-cinema-accent focus:ring-0 focus:ring-offset-0 cursor-pointer bg-cinema-surface w-4 h-4 flex-shrink-0"
                                />
                                <span className="text-xs text-cinema-text font-semibold truncate" title={item.itemName}>{item.itemName}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-cinema-text-muted italic py-2">{t('transferRights.noFacilitiesAssets')}</p>
                      )}
                    </div>

                    {/* Category: Operation */}
                    <div>
                      <h4 className="text-[10px] font-mono tracking-wider text-cinema-text-muted mb-3 border-b border-cinema-border/50 pb-1 uppercase font-bold">{t('transferRights.categoryOperations')}</h4>
                      {filteredItems2.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {filteredItems2.map(item => {
                            const isChecked = selectedItems.has(item.itemId);
                            return (
                              <label
                                key={item.itemId}
                                className={`flex items-center gap-3 p-3 bg-cinema-elevated/45 rounded-xl cursor-pointer hover:bg-cinema-elevated transition-colors group border ${
                                  isChecked ? 'bg-cinema-accent/10 border-cinema-accent/30' : 'border-cinema-border/30'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleItemSelect(item.itemId, 2)}
                                  className="rounded border-cinema-border text-cinema-accent focus:ring-0 focus:ring-offset-0 cursor-pointer bg-cinema-surface w-4 h-4 flex-shrink-0"
                                />
                                <span className="text-xs text-cinema-text font-semibold truncate" title={item.itemName}>{item.itemName}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-cinema-text-muted italic py-2">{t('transferRights.noOperationAssets')}</p>
                      )}
                    </div>

                    {/* Category: Movie */}
                    <div>
                      <h4 className="text-[10px] font-mono tracking-wider text-cinema-text-muted mb-3 border-b border-cinema-border/50 pb-1 uppercase font-bold">{t('transferRights.categoryMovies')}</h4>
                      {filteredItems3.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                          {filteredItems3.map(item => {
                            const isChecked = selectedItems.has(item.itemId);
                            return (
                              <label
                                key={item.itemId}
                                className={`flex items-center gap-3 p-3 bg-cinema-elevated/45 rounded-xl cursor-pointer hover:bg-cinema-elevated transition-colors group border ${
                                  isChecked ? 'bg-cinema-accent/10 border-cinema-accent/30' : 'border-cinema-border/30'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleItemSelect(item.itemId, 3)}
                                  className="rounded border-cinema-border text-cinema-accent focus:ring-0 focus:ring-offset-0 cursor-pointer bg-cinema-surface w-4 h-4 flex-shrink-0"
                                />
                                <span className="text-xs text-cinema-text font-semibold truncate" title={item.itemName}>{item.itemName}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-cinema-text-muted italic py-2">{t('transferRights.noMovieAssets')}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center opacity-45 border border-dashed border-cinema-border rounded-xl bg-cinema-elevated/30">
                <Info size={36} className="mb-3 text-cinema-text-muted" />
                <p className="text-xs font-semibold text-cinema-text-muted px-4 leading-relaxed">
                  {t('transferRights.selectSourceFirst')}"
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Column 3: To Manager */}
        <section className="lg:col-span-3">
          <div className="bg-cinema-surface border border-cinema-border/50 p-6 rounded-2xl h-full flex flex-col justify-between shadow-sm hover:border-cinema-accent/30 transition-all duration-200">
            <div className="space-y-6 flex-grow">
              <div className="flex items-center gap-3">
                <Users className="text-cinema-accent" size={20} />
                <h3 className="text-base font-bold text-cinema-text">3. {t('transferRights.toManager')}</h3>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono tracking-wider text-cinema-text-muted uppercase">{t('transferRights.selectRecipient')}</label>
                <div className="relative">
                  <select
                    value={targetUserId}
                    onChange={e => setTargetUserId(e.target.value)}
                    className="w-full bg-cinema-elevated border border-cinema-border/60 p-3 pr-10 rounded-xl text-sm appearance-none focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent/30 outline-none transition-colors text-cinema-text select cursor-pointer"
                    disabled={!sourceUserId}
                  >
                    <option value="" disabled className="bg-cinema-surface">{t('transferRights.selectRecipientPlaceholder')}</option>
                    {managers
                      .filter(m => m.userId !== sourceUserId)
                      .map(m => (
                        <option key={m.userId} value={m.userId} className="bg-cinema-surface">{m.userName} ({m.userEmail})</option>
                      ))}
                  </select>
                  <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 rotate-90 text-cinema-text-muted" />
                </div>
              </div>

              {/* Target info message */}
              <div className="p-3 bg-cinema-accent/5 border border-cinema-accent/20 rounded mt-4">
                <p className="text-xs text-cinema-text-muted flex gap-2 italic">
                  <Info size={14} className="text-cinema-accent shrink-0 mt-0.5" />
                  {t('transferRights.recipientInfoNote')}
                </p>
              </div>

              {/* Selected Target Manager Profile Card */}
              {targetUserId && selectedTargetManager && (
                <div className="p-4 bg-cinema-bg/60 border border-cinema-border/30 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cinema-accent/10 border border-cinema-accent/30 flex items-center justify-center font-extrabold text-cinema-accent text-sm">
                    {selectedTargetManager.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-cinema-text truncate">{selectedTargetManager.userName}</p>
                    <p className="text-xs text-cinema-text-muted truncate">{selectedTargetManager.userEmail}</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleExecuteTransfer}
              disabled={!sourceUserId || !targetUserId || selectedItems.size === 0 || executing}
              className="mt-6 w-full bg-cinema-accent text-black py-3.5 rounded-xl font-bold hover:bg-cinema-accent-hover disabled:bg-cinema-accent/40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-cinema-accent/20 uppercase tracking-wider"
            >
              <span>{executing ? t('transferRights.executing') : t('transferRights.startTransfer')}</span>
              {executing ? (
                <Loader2 size={16} className="animate-spin text-black" />
              ) : (
                <ArrowRight size={16} />
              )}
            </button>
          </div>
        </section>

      </div>

      {/* Instructional Info Box */}
      <footer className="mt-8">
        <div className="bg-cinema-surface border-l-4 border-cinema-accent p-5 rounded-r-xl flex items-start gap-4">
          <div className="p-2 rounded bg-cinema-accent/10 text-cinema-accent">
            <Info size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-cinema-text mb-2">{t('transferRights.instructionTitle')}</h4>
            <div className="flex flex-wrap items-center gap-2 text-xs text-cinema-text-muted uppercase tracking-wider font-mono">
              <span>{t('transferRights.instructionStep1')}</span>
              <ChevronRight size={12} className="text-cinema-text-muted/40" />
              <span>{t('transferRights.instructionStep2')}</span>
              <ChevronRight size={12} className="text-cinema-text-muted/40" />
              <span>{t('transferRights.instructionStep3')}</span>
              <ChevronRight size={12} className="text-cinema-text-muted/40" />
              <span>{t('transferRights.instructionStep4')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TransferRightsView;
