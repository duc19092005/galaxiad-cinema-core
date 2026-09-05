import React, { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  BadgePercent,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  Loader2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  pricingPromotionApi,
  type PricingPromotionConflictDto,
  type PricingPromotionDto,
  type PricingPromotionOptionsDto,
  type PricingPromotionUpsertDto,
} from '../../../api/pricingPromotionApi';
import { showError, showSuccess } from '../../../utils/ToastUtils';
import { useTranslation } from 'react-i18next';
import { PricingPromotionConflictModal } from './PricingPromotionConflictModal';
import {
  buildFormFromPromotion,
  createWizardForm,
  emptyOptions,
  formatVnd,
  getErrorMessage,
  getTypeColor,
  toPayload,
  type WizardFormState,
} from './pricing/pricingPromotionHelpers';
import { Step1, Step2, Step3, StepIndicator } from './pricing/PricingPromotionWizardSteps';

export const PricingPromotionsSection: React.FC = () => {
  const { t } = useTranslation();
  const [promotions, setPromotions] = useState<PricingPromotionDto[]>([]);
  const [options, setOptions] = useState<PricingPromotionOptionsDto>(emptyOptions);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [editingPromotion, setEditingPromotion] = useState<PricingPromotionDto | null>(null);
  const [form, setForm] = useState<WizardFormState>(createWizardForm);
  const [conflicts, setConflicts] = useState<PricingPromotionConflictDto[]>([]);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<PricingPromotionUpsertDto | null>(null);

  const activeCount = useMemo(() => promotions.filter(p => p.isActive).length, [promotions]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pr, or] = await Promise.all([pricingPromotionApi.getAll(), pricingPromotionApi.getOptions()]);
      if (pr.isSuccess) setPromotions(pr.data || []);
      if (or.isSuccess) setOptions(or.data || emptyOptions);
    } catch (e) {
      showError(getErrorMessage(e, t('pricingPromotions.loadDataFailed')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditingPromotion(null); setForm(createWizardForm()); setStep(0); setIsDrawerOpen(true); };
  const openEdit = (p: PricingPromotionDto) => { setEditingPromotion(p); setForm(buildFormFromPromotion(p)); setStep(0); setIsDrawerOpen(true); };
  const closeDrawer = () => setIsDrawerOpen(false);

  const handleNext = () => {
    if (step === 0 && !form.title.trim()) { showError(t('pricingPromotions.fillNameFirst')); return; }
    setStep(s => Math.min(s + 1, 2));
  };
  const handleBack = () => setStep(s => Math.max(s - 1, 0));

  const handleToggle = async (p: PricingPromotionDto) => {
    try {
      const r = await pricingPromotionApi.toggle(p.pricingPromotionId);
      if (r.isSuccess) { showSuccess(r.data?.isActive ? t('pricingPromotions.active') : t('pricingPromotions.off')); fetchData(); }
    } catch (e) { showError(getErrorMessage(e, t('pricingPromotions.loadDataFailed'))); }
  };

  const handleDelete = async (p: PricingPromotionDto) => {
    if (!window.confirm(t('pricingPromotions.confirmDelete', { title: p.title }))) return;
    try {
      const r = await pricingPromotionApi.delete(p.pricingPromotionId);
      if (r.isSuccess) { showSuccess(t('pricingPromotions.deleteSuccess')); fetchData(); }
    } catch (e) { showError(getErrorMessage(e, t('pricingPromotions.loadDataFailed'))); }
  };

  const submitWithResolution = async (payload: PricingPromotionUpsertDto, deactivateRuleIds: string[]) => {
    const finalPayload = { ...payload, deactivateRuleIds };
    setSubmitting(true);
    try {
      const r = editingPromotion
        ? await pricingPromotionApi.update(editingPromotion.pricingPromotionId, finalPayload)
        : await pricingPromotionApi.create(finalPayload);
      if (r.isSuccess) {
        showSuccess(t('pricingPromotions.saveSuccess'));
        closeDrawer();
        fetchData();
      }
    } catch (e) {
      showError(getErrorMessage(e, t('pricingPromotions.saveFailed')));
    } finally {
      setSubmitting(false);
      setIsConflictModalOpen(false);
      setPendingPayload(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { showError(t('pricingPromotions.fillNameRequired')); return; }
    if (form.conditions.some(c => c.adjustmentValue < 0)) { showError(t('pricingPromotions.noNegativeValue')); return; }
    setSubmitting(true);
    try {
      const payload = toPayload(form);

      // Check for conflicts first
      const conflictRes = await pricingPromotionApi.checkConflicts(
        payload,
        editingPromotion?.pricingPromotionId
      );

      if (conflictRes.isSuccess && conflictRes.data?.hasConflicts) {
        // Show conflict resolution modal
        setConflicts(conflictRes.data.conflicts);
        setPendingPayload(payload);
        setIsConflictModalOpen(true);
        setSubmitting(false);
        return;
      }

      // No conflicts — save directly
      const r = editingPromotion
        ? await pricingPromotionApi.update(editingPromotion.pricingPromotionId, payload)
        : await pricingPromotionApi.create(payload);
      if (r.isSuccess) {
        showSuccess(t('pricingPromotions.saveSuccess'));
        closeDrawer();
        fetchData();
      }
    } catch (e) {
      showError(getErrorMessage(e, t('pricingPromotions.saveFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = [t('pricingPromotions.stepInfo'), t('pricingPromotions.stepConditions'), t('pricingPromotions.stepReview')];

  return (
    <>
      <div className="animate-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('pricingPromotions.ticketPromotions')}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              {t('pricingPromotions.ticketPromotionsDesc')}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge badge-accent">{t('pricingPromotions.activeCount', { count: activeCount })}</span>
            <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} /> {t('pricingPromotions.createPromotion')}
            </button>
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="state-center" style={{ minHeight: '30vh' }}>
              <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{t('pricingPromotions.loading')}</p>
            </div>
          ) : promotions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
              {t('pricingPromotions.noRules')}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t('pricingPromotions.ruleName')}</th>
                  <th>{t('pricingPromotions.active')}</th>
                  <th>{t('pricingPromotions.dateRange')}</th>
                  <th>{t('pricingPromotions.conditionsTitle')}</th>
                  <th>{t('pricingPromotions.excludeHolidays')}</th>
                  <th style={{ width: 100 }}>{t('pricingPromotions.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map(p => (
                  <tr key={p.pricingPromotionId}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 340 }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{p.title}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.shortDescription || p.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <button onClick={() => handleToggle(p)} className={`badge ${p.isActive ? 'badge-success' : 'badge-default'}`} style={{ border: 'none', cursor: 'pointer' }}>
                        {p.isActive ? t('pricingPromotions.active') : t('pricingPromotions.off')}
                      </button>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                      <div style={{ display: 'grid', gap: 2 }}>
                        <span>{t('pricingPromotions.fromDate')}: {p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : t('pricingPromotions.startDateHint')}</span>
                        <span>{t('pricingPromotions.toDate')}: {p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : '∞'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {p.rules.slice(0, 2).map((r, i) => (
                          <span key={i} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: `${getTypeColor(r.promotionTypeName)}15`, color: getTypeColor(r.promotionTypeName), border: `1px solid ${getTypeColor(r.promotionTypeName)}30` }}>
                            {formatVnd(r.adjustmentValue)}
                          </span>
                        ))}
                        {p.rules.length > 2 && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{p.rules.length - 2}</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${p.excludeHolidays ? 'badge-warning' : 'badge-success'}`}>
                        {p.excludeHolidays ? t('pricingPromotions.excludeHolidays') : t('pricingPromotions.active')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(p)} className="btn" style={{ padding: '4px 10px', fontSize: 12, height: 28, minHeight: 0, borderColor: 'rgba(99,102,241,0.4)', color: '#818cf8', background: 'rgba(99,102,241,0.05)' }}>
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => handleDelete(p)} className="btn" style={{ padding: '4px 10px', fontSize: 12, height: 28, minHeight: 0, borderColor: 'rgba(239,68,68,0.4)', color: 'var(--danger)', background: 'rgba(239,68,68,0.05)' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isDrawerOpen && createPortal(
        <>
          <div onClick={closeDrawer} style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease' }} />

          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1001,
            width: 'min(760px, 95vw)',
            backgroundColor: 'var(--bg-elevated, #18181b)',
            borderLeft: '1px solid var(--border-color, #27272a)',
            boxShadow: '-24px 0 80px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideInRight 0.25s cubic-bezier(0.16,1,0.3,1)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', flexShrink: 0, background: 'rgba(255,138,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 9, background: 'rgba(255,138,0,0.12)' }}>
                  <BadgePercent size={17} style={{ color: '#ff8a00' }} />
                </span>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    {editingPromotion ? t('pricingPromotions.editPromotion') : t('pricingPromotions.createPromotionNew')}
                  </h3>
                  <p style={{ fontSize: 11, color: '#a1a1aa', margin: 0, marginTop: 1 }}>
                    {editingPromotion ? editingPromotion.title : t('pricingPromotions.fillInfoByStep')}
                  </p>
                </div>
              </div>
              <button onClick={closeDrawer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', color: '#ffffff' }}>
                <X size={14} />
              </button>
            </div>

            {/* Stepper */}
            <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
              <StepIndicator step={step} total={3} labels={stepLabels} />
            </div>

            {/* Body */}
            <form id="wizard-form" onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
              {step === 0 && <Step1 form={form} setForm={setForm} />}
              {step === 1 && <Step2 form={form} setForm={setForm} options={options} />}
              {step === 2 && <Step3 form={form} options={options} submitting={submitting} />}
            </form>

            {/* Footer */}
            <div style={{ display: 'flex', gap: 10, padding: '14px 24px', borderTop: '1px solid var(--border-color)', flexShrink: 0, background: 'rgba(0,0,0,0.2)' }}>
              {step > 0 ? (
                <button type="button" onClick={handleBack} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                  <ChevronLeft size={15} /> {t('common.back')}
                </button>
              ) : (
                <button type="button" onClick={closeDrawer} className="btn btn-secondary" style={{ flex: 1 }}>{t('common.cancel')}</button>
              )}

              {step < 2 ? (
                <button type="button" onClick={handleNext} className="btn btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {step === 1 ? <><Eye size={15} /> {t('pricingPromotions.stepReview')}</> : <>{t('common.next')} <ChevronRight size={15} /></>}
                </button>
              ) : (
                <button form="wizard-form" type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {submitting ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> {t('pricingPromotions.saving')}</> : <><Check size={15} /> {editingPromotion ? t('pricingPromotions.update') : t('pricingPromotions.createPromotion')}</>}
                </button>
              )}
            </div>
          </div>
        </>,
        document.body
      )}

      {isConflictModalOpen && pendingPayload && (
        <PricingPromotionConflictModal
          conflicts={conflicts}
          onResolve={(deactivateRuleIds) => {
            setIsConflictModalOpen(false);
            submitWithResolution(pendingPayload, deactivateRuleIds);
          }}
          onCancel={() => {
            setIsConflictModalOpen(false);
            setPendingPayload(null);
          }}
        />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes modalIn { from { opacity: 0; transform: translate(-50%, -50%) scale(0.95) } to { opacity: 1; transform: translate(-50%, -50%) scale(1) } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </>
  );
};
