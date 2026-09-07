import { extractMovieDrafts } from './contractExtraction';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck,
  FilePlus,
  FileSearch,
  FileText,
  Film,
  Layers,
  Loader2,
  Lock,
  PenTool,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UploadCloud,
  X
} from 'lucide-react';
import { contractApi } from '../../api/contractApi';
import { movieApi } from '../../api/movieApi';
import { facilitiesApi } from '../../api/facilitiesApi';
import { showError, showSuccess } from '../../utils/ToastUtils';
import type { MovieRequiredAge } from '../../types/movie.types';
import type { Cinema, MovieFormat } from '../../types/facilities.types';
import type {
  ContractDetail,
  ContractMovieLine,
  ContractStatus,
  ContractSummary,
  ScopeState
} from '../../types/contract.types';

type Props = { mode: 'admin' | 'manager' };

const statusMeta: Record<ContractStatus, { label: string; color: string; bg: string; border: string }> = {
  Draft: { label: 'Bản nháp', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' },
  PendingReview: { label: 'Chờ duyệt', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.3)' },
  ReadyToSign: { label: 'Sẵn sàng ký', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.12)', border: 'rgba(129, 140, 248, 0.3)' },
  Signed: { label: 'Đã ký duyệt', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.12)', border: 'rgba(192, 132, 252, 0.3)' },
  Activated: { label: 'Đang khai thác', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.3)' },
  Suspended: { label: 'Tạm đình chỉ', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' },
  Terminated: { label: 'Đã chấm dứt', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)', border: 'rgba(100, 116, 139, 0.3)' },
  Cancelled: { label: 'Đã hủy', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' },
};

const processingStatusText: Record<string, { label: string; color: string }> = {
  Idle: { label: 'Chưa chạy OCR/AI', color: 'var(--text-muted)' },
  Queued: { label: 'Đang chờ hàng đợi AI...', color: '#38bdf8' },
  Processing: { label: 'AI Qwen 3.5 đang xử lý...', color: '#f59e0b' },
  AwaitingDataApproval: { label: 'Trích xuất hoàn tất - Sẵn sàng đối chiếu', color: '#22c55e' },
  Failed: { label: 'Trích xuất thất bại', color: '#ef4444' },
};

const emptyLine = (): ContractMovieLine => ({
  vietnameseTitle: '',
  englishTitle: '',
  description: '',
  durationMinutes: 0,
  movieRequiredAgeId: '',
  licenseStartAt: '',
  licenseEndAt: '',
  cinemaScopeState: 'Unresolved',
  formatScopeState: 'Unresolved',
  cinemaIds: [],
  formatIds: [],
  cinemaSharePercent: 0,
  distributorSharePercent: 0,
  revenueBasis: 'TICKET_FINAL_PRICE_AFTER_REFUND',
  settlementCycle: 'Monthly',
  reviewed: false,
});

const getError = (error: unknown) => {
  const candidate = error as { response?: { data?: { message?: string; detail?: { message?: string } } } };
  return candidate.response?.data?.message ?? candidate.response?.data?.detail?.message ?? 'Không thể hoàn tất thao tác.';
};

export const ContractsWorkspace: React.FC<Props> = ({ mode }) => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [selected, setSelected] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [showCreate, setShowCreate] = useState(false);
  const [partner, setPartner] = useState('');
  const [intakeFile, setIntakeFile] = useState<File | null>(null);
  const [partnerFilter, setPartnerFilter] = useState('');
  const [reviewPartner, setReviewPartner] = useState('');
  const [reviewers, setReviewers] = useState<{ userId: string; name: string }[]>([]);
  const [reviewerId, setReviewerId] = useState('');

  useEffect(() => {
    if (mode === 'admin') void contractApi.reviewers().then(r => setReviewers(r.data)).catch(e => showError(getError(e)));
  }, [mode]);
  const [contractNumber, setContractNumber] = useState('');
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signModalMode, setSignModalMode] = useState<'approve_and_activate' | 'sign_and_activate'>('sign_and_activate');
  const [returnModalOpen, setReturnModalOpen] = useState(false);

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<'documents' | 'ai' | 'review'>('documents');

  // Review & Movie lines state
  const [movieLines, setMovieLines] = useState<ContractMovieLine[]>([]);
  const [financialReviewed, setFinancialReviewed] = useState(false);

  // Metadata catalogs
  const [ages, setAges] = useState<MovieRequiredAge[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [formats, setFormats] = useState<MovieFormat[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await contractApi.list();
      setContracts(res.data ?? []);
    } catch (e) {
      setError(getError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void Promise.all([
      movieApi.getMovieRequiredAges(),
      facilitiesApi.getCinemaList(),
      movieApi.getMovieFormats()
    ]).then(([a, c, f]) => {
      setAges(a.data ?? []);
      setCinemas(c.data ?? []);
      setFormats(f.data ?? []);
    }).catch(() => undefined);
  }, []);

  const openContract = async (id: string, preferredTab?: 'documents' | 'ai' | 'review') => {
    setWorking(true);
    try {
      const detail = (await contractApi.get(id)).data;
      let extractedPartner = '';
      try { extractedPartner = JSON.parse(detail.revision?.extractionJson || '{}').analysis?.distributor?.legalName || ''; } catch { /* OCR pending */ }
      setReviewPartner(detail.distributorName || extractedPartner);
      setSelected(detail);
      if (detail.revision?.movieLines?.length) {
        setMovieLines(detail.revision.movieLines);
      } else {
        setMovieLines(extractMovieDrafts(detail.revision?.extractionJson || '{}', ages, cinemas, formats));
      }
      setFinancialReviewed(detail.revision?.financialPolicyReviewed ?? false);

      // Preserve current tab if just refreshing the same contract;
      // If switching to a new contract or explicit tab provided, pick the most relevant tab
      if (preferredTab) {
        setActiveTab(preferredTab);
      } else if (!selected || selected.contractId !== id) {
        if (detail.revision?.extractedText) {
          setActiveTab('ai');
        } else if (detail.revision?.documents?.length) {
          setActiveTab('ai');
        } else {
          setActiveTab('documents');
        }
      }
    } catch (e) {
      showError(getError(e));
    } finally {
      setWorking(false);
    }
  };

  // Auto-poll when AI OCR extraction is in progress (Queued or Processing)
  useEffect(() => {
    if (!selected) return;
    const isExtracting = selected.processingStatus === 'Queued' || selected.processingStatus === 'Processing';
    if (!isExtracting) return;

    let stopped = false;
    const interval = setInterval(async () => {
      try {
        const res = await contractApi.get(selected.contractId);
        if (stopped) return;
        const updated = res.data;
        if (updated && updated.contractId === selected.contractId) {
          setSelected(updated);
          if (updated.processingStatus === 'AwaitingDataApproval') {
            setMovieLines(updated.revision?.movieLines?.length ? updated.revision.movieLines : extractMovieDrafts(updated.revision?.extractionJson || '{}', ages, cinemas, formats));
            setFinancialReviewed(false);
            try { setReviewPartner(updated.distributorName || JSON.parse(updated.revision?.extractionJson || '{}').analysis?.distributor?.legalName || ''); } catch { /* Source remains available */ }
            clearInterval(interval);
            await load();
            showSuccess('AI đã hoàn tất trích xuất OCR! Dữ liệu đã sẵn sàng đối chiếu.');
          } else if (updated.processingStatus === 'Failed') {
            clearInterval(interval);
            await load();
            showError('Quá trình trích xuất AI gặp sự cố, vui lòng thử lại.');
          }
        }
      } catch {
        // silent background polling catch
      }
    }, 2500);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [selected?.contractId, selected?.processingStatus, load]);

  const createDraft = async () => {
    if (!intakeFile) return;
    setWorking(true);
    try {
      const result = await contractApi.create({
        distributorName: partner.trim() || undefined,
        counterpartyContractNumber: contractNumber.trim() || undefined
      });
      await contractApi.upload(result.data.id, intakeFile);
      await contractApi.extract(result.data.id);
      setIntakeFile(null);
      setShowCreate(false);
      setPartner('');
      setContractNumber('');
      await load();
      await openContract(result.data.id);
      showSuccess('Đã tạo hồ sơ hợp đồng nháp thành công.');
    } catch (e) {
      showError(getError(e));
    } finally {
      setWorking(false);
    }
  };

  const runAction = async (actionFn: () => Promise<unknown>, successMsg: string) => {
    setWorking(true);
    try {
      await actionFn();
      showSuccess(successMsg);
      if (selected) {
        await openContract(selected.contractId);
      }
      await load();
    } catch (e) {
      showError(getError(e));
    } finally {
      setWorking(false);
    }
  };

  // Workflow handlers
  const handleConfirmSignAndActivate = async (password: string) => {
    if (!selected) return;
    setSignModalOpen(false);
    if (signModalMode === 'approve_and_activate') {
      await runAction(async () => {
        await contractApi.approve(selected.contractId);
        await contractApi.sign(selected.contractId, password);
        await contractApi.activate(selected.contractId);
      }, 'Đã phê duyệt, ký duyệt nội bộ và tự động thêm phim vào hệ thống rạp thành công!');
    } else {
      await runAction(async () => {
        await contractApi.sign(selected.contractId, password);
        await contractApi.activate(selected.contractId);
      }, 'Đã hoàn tất ký duyệt nội bộ và tự động kích hoạt phim vào hệ thống rạp thành công!');
    }
  };

  const handleConfirmReturn = async (reason: string) => {
    if (!selected) return;
    setReturnModalOpen(false);
    await runAction(
      () => contractApi.returnForRevision(selected.contractId, reason),
      'Đã trả lại hồ sơ về trạng thái nháp.'
    );
  };

  // Action dispatcher handling both uppercase backend codes and lowercase frontend keys
  const handleWorkflowAction = async (actionCode: string) => {
    if (!selected) return;
    const code = actionCode.toUpperCase();

    if (code === 'TRIGGER_EXTRACTION' || code === 'EXTRACT') {
      setActiveTab('ai');
      return runAction(() => contractApi.extract(selected.contractId), 'Đã gửi yêu cầu vào hàng đợi AI trích xuất (OCR).');
    }
    if (code === 'SUBMIT_FOR_REVIEW' || code === 'SUBMIT') {
      if (mode === 'admin') {
        setSignModalMode('approve_and_activate');
        setSignModalOpen(true);
        return;
      }
      return runAction(() => contractApi.submit(selected.contractId), 'Đã gửi kết quả đối soát cho Admin phê duyệt.');
    }
    if (code === 'APPROVE_AND_ACTIVATE') {
      setSignModalMode('approve_and_activate');
      setSignModalOpen(true);
      return;
    }
    if (code === 'APPROVE_CONTRACT' || code === 'APPROVE') {
      return runAction(() => contractApi.approve(selected.contractId), 'Đã duyệt nội dung và chính sách tài chính hợp đồng.');
    }
    if (code === 'RETURN_CONTRACT' || code === 'RETURN') {
      setReturnModalOpen(true);
      return;
    }
    if (code === 'SIGN_CONTRACT' || code === 'SIGN' || code === 'SIGN_AND_ACTIVATE') {
      setSignModalMode('sign_and_activate');
      setSignModalOpen(true);
      return;
    }
    if (code === 'ACTIVATE_CONTRACT' || code === 'ACTIVATE') {
      return runAction(() => contractApi.activate(selected.contractId), 'Đã kích hoạt hợp đồng và đưa phim vào hệ thống rạp!');
    }
    if (code === 'UPLOAD_DOCUMENT') {
      setActiveTab('documents');
    }
    if (code === 'REVIEW_DATA') {
      setActiveTab('review');
    }
  };

  const handleSaveReview = () => {
    if (!selected) return;
    void runAction(
      () => contractApi.review(selected.contractId, movieLines, financialReviewed, reviewPartner),
      'Đã lưu thành công dữ liệu đối chiếu revision.'
    );
  };

  const handleSaveAndSubmit = () => {
    if (!selected) return;
    if (mode === 'admin') {
      void runAction(async () => {
        await contractApi.review(selected.contractId, movieLines, financialReviewed, reviewPartner);
        setSignModalMode('approve_and_activate');
        setSignModalOpen(true);
      }, 'Đã lưu đối soát. Xem lại dữ liệu trước khi ký duyệt.');
      return;
    }
    void runAction(async () => {
      await contractApi.review(selected.contractId, movieLines, financialReviewed, reviewPartner);
      await contractApi.submit(selected.contractId);
    }, 'Đã lưu dữ liệu đối chiếu và gửi hồ sơ cho Quản trị viên duyệt thành công!');
  };

  // Filtered list
  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const matchSearch =
        c.internalCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.distributorName && c.distributorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.counterpartyContractNumber && c.counterpartyContractNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus && (!partnerFilter || (c.distributorName || '__unknown') === partnerFilter);
    });
  }, [contracts, searchQuery, statusFilter, partnerFilter]);

  const metrics = useMemo(() => ({
    draft: contracts.filter(x => x.status === 'Draft').length,
    review: contracts.filter(x => x.status === 'PendingReview' || x.status === 'ReadyToSign').length,
    active: contracts.filter(x => x.status === 'Activated').length,
  }), [contracts]);

  if (loading) return <WorkspaceSkeleton />;

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6 space-y-6 animate-in">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold font-mono tracking-widest text-[var(--accent)] uppercase">
            <Film size={13} />
            <span>CONTRACT MANAGEMENT SYSTEM</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
            {mode === 'admin' ? 'Quản lý Hợp đồng Phim' : 'Hồ sơ Phim Bản quyền'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Tiếp nhận hồ sơ bản quyền, tự động OCR bằng AI và đối chiếu chính sách phân chia doanh thu rạp.
          </p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 bg-[#d97706] hover:bg-[#b45309] text-white border border-amber-500/30 transition-all active:scale-[0.98] shadow-sm"
        >
          <Plus size={16} />
          <span>Tiếp nhận hợp đồng mới</span>
        </button>
      </header>

      {/* STATS METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-xl border border-[var(--border-color)] flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--text-muted)] font-medium">Bản nháp & Đang chuẩn bị</div>
            <div className="text-2xl font-extrabold font-mono text-[var(--text-primary)] mt-1">{metrics.draft}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[rgba(245,158,11,0.12)] text-[#f59e0b] flex items-center justify-center">
            <FileText size={20} />
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-[var(--border-color)] flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--text-muted)] font-medium">{mode === 'admin' ? 'Chờ bạn ký duyệt nội bộ' : 'Cần Admin xử lý & Ký duyệt nội bộ'}</div>
            <div className="text-2xl font-extrabold font-mono text-[#38bdf8] mt-1">{metrics.review}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[rgba(56,189,248,0.12)] text-[#38bdf8] flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-[var(--border-color)] flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--text-muted)] font-medium">Đang có hiệu lực khai thác</div>
            <div className="text-2xl font-extrabold font-mono text-[#22c55e] mt-1">{metrics.active}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[rgba(34,197,94,0.12)] text-[#22c55e] flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[var(--danger)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <button onClick={() => void load()} className="btn btn-secondary text-xs flex items-center gap-1.5">
            <RefreshCw size={13} /> Thử lại
          </button>
        </div>
      )}

      {/* MAIN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: CONTRACT LIST (4 COLS) */}
        <aside className="lg:col-span-4 glass-card rounded-2xl border border-[var(--border-color)] overflow-hidden flex flex-col h-[760px]">
          <div className="p-4 border-b border-[var(--border-color)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Danh sách hồ sơ</span>
              <span className="text-xs font-mono text-[var(--text-muted)]">{filteredContracts.length} hồ sơ</span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm theo mã HD, đối tác..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <select aria-label="Lọc theo đối tác" value={partnerFilter} onChange={e => setPartnerFilter(e.target.value)} className="input w-full text-xs">
              <option value="">Tất cả đối tác</option>
              <option value="__unknown">Chưa nhận diện đối tác</option>
              {[...new Set(contracts.map(c => c.distributorName).filter(Boolean))].sort().map(name => <option key={name} value={name}>{name}</option>)}
            </select>
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'Draft', label: 'Nháp' },
                { id: 'PendingReview', label: 'Chờ duyệt' },
                { id: 'ReadyToSign', label: 'Cần ký' },
                { id: 'Activated', label: 'Hiệu lực' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-all ${
                    statusFilter === tab.id
                      ? 'bg-[var(--accent)] text-black font-semibold'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-color)]">
            {filteredContracts.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-muted)] text-sm">
                <FileText size={32} className="mx-auto mb-2 opacity-30" />
                <p>Không tìm thấy hồ sơ phù hợp.</p>
              </div>
            ) : (
              filteredContracts.map(item => {
                const isSelected = selected?.contractId === item.contractId;
                const meta = statusMeta[item.status] ?? statusMeta.Draft;
                return (
                  <motion.div
                    key={item.contractId}
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
                    onClick={() => void openContract(item.contractId)}
                    className={`p-4 cursor-pointer transition-all border-l-4 ${
                      isSelected
                        ? 'border-l-[var(--accent)] bg-[rgba(255,138,0,0.06)]'
                        : 'border-l-transparent hover:border-l-[var(--border-color)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-sm text-[var(--text-primary)]">{item.internalCode}</span>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ color: meta.color, backgroundColor: meta.bg, border: `1px solid ${meta.border}` }}
                      >
                        {meta.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mt-1.5 truncate">
                      <Building2 size={13} className="shrink-0 opacity-60" />
                      <span className="truncate">{item.distributorName || 'Đối tác chưa xác định'}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mt-2">
                      <span className="bg-[var(--bg-surface)] px-1.5 py-0.5 rounded text-[10px] border border-[var(--border-color)] font-mono">
                        Rev {item.currentRevisionNumber}
                      </span>
                      <span>{new Date(item.updatedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </aside>

        {/* RIGHT COLUMN: STUDIO WORKSPACE (8 COLS) */}
        <main className="lg:col-span-8 space-y-6">
          {selected ? (
            <div className="space-y-6">
              {/* CONTRACT DETAIL HERO CARD */}
              <div className="glass-card rounded-2xl p-5 border border-[var(--border-color)] space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-extrabold font-mono tracking-tight text-[var(--text-primary)]">
                        {selected.internalCode}
                      </h2>
                      <span
                        className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                        style={{
                          color: (statusMeta[selected.status] ?? statusMeta.Draft).color,
                          backgroundColor: (statusMeta[selected.status] ?? statusMeta.Draft).bg,
                          border: `1px solid ${(statusMeta[selected.status] ?? statusMeta.Draft).border}`
                        }}
                      >
                        {(statusMeta[selected.status] ?? statusMeta.Draft).label}
                      </span>
                      <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-[var(--border-color)]">
                        Revision #{selected.currentRevisionNumber}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-1 flex items-center gap-2">
                      <Building2 size={14} className="text-[var(--accent)]" />
                      <strong>{selected.distributorName || 'Đối tác chờ nhận diện'}</strong>
                      {selected.counterpartyContractNumber && (
                        <span className="text-xs text-[var(--text-muted)] font-mono">
                          (Số HĐ đối tác: {selected.counterpartyContractNumber})
                        </span>
                      )}
                    </p>
                  </div>

                  {/* ACTION BUTTONS (Context-Aware) */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {/* Extract Action */}
                    {selected.status === 'Draft' && (
                      <button
                        disabled={working || !selected.revision?.documents?.length}
                        onClick={() => void handleWorkflowAction('TRIGGER_EXTRACTION')}
                        className="btn btn-secondary text-xs flex items-center gap-1.5 border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-soft)]"
                        title={!selected.revision?.documents?.length ? 'Vui lòng upload tài liệu trước khi phân tích' : ''}
                      >
                        <Sparkles size={14} />
                        <span>Đọc & Phân tích AI</span>
                      </button>
                    )}

                    {/* Submit to Admin */}
                    {selected.status === 'Draft' && (
                      <button
                        disabled={working || !selected.revision?.dataReviewed || !selected.revision?.financialPolicyReviewed}
                        onClick={() => void handleWorkflowAction('SUBMIT_FOR_REVIEW')}
                        className="btn btn-primary text-xs flex items-center gap-1.5"
                        title={!selected.revision?.dataReviewed ? 'Cần đối soát dữ liệu trước khi ký duyệt' : ''}
                      >
                        <Send size={14} />
                        <span>{mode === 'admin' ? 'Ký duyệt & lưu phim' : 'Gửi kết quả đối soát cho Admin'}</span>
                      </button>
                    )}

                    {/* Admin Approve */}
                    {(mode === 'admin' || selected.allowedActions?.includes('APPROVE_CONTRACT')) && selected.status === 'PendingReview' && (
                      <>
                        <button
                          disabled={working}
                          onClick={() => {
                            setSignModalMode('approve_and_activate');
                            setSignModalOpen(true);
                          }}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-[#15803d] hover:bg-[#166534] text-white border border-emerald-500/30 transition-all active:scale-[0.98] shadow-sm"
                          title="Duyệt, ký duyệt nội bộ và tự động thêm phim vào danh mục rạp ngay trong 1 bước"
                        >
                          <CheckCircle2 size={14} />
                          <span>Duyệt & Kích hoạt vào rạp</span>
                        </button>
                        <button
                          disabled={working}
                          onClick={() => void handleWorkflowAction('APPROVE_CONTRACT')}
                          className="btn btn-secondary text-xs flex items-center gap-1.5"
                          title="Chỉ duyệt hồ sơ mà chưa ký duyệt nội bộ"
                        >
                          <Check size={14} />
                          <span>Chỉ duyệt hồ sơ</span>
                        </button>
                        <button
                          disabled={working}
                          onClick={() => setReturnModalOpen(true)}
                          className="px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition-all"
                        >
                          <RotateCcw size={14} />
                          <span>Yêu cầu sửa</span>
                        </button>
                      </>
                    )}

                    {/* Admin Sign */}
                    {(mode === 'admin' || selected.allowedActions?.includes('SIGN_CONTRACT')) && selected.status === 'ReadyToSign' && (
                      <>
                        <button
                          disabled={working}
                          onClick={() => {
                            setSignModalMode('sign_and_activate');
                            setSignModalOpen(true);
                          }}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-[#15803d] hover:bg-[#166534] text-white border border-emerald-500/30 transition-all active:scale-[0.98] shadow-sm"
                          title="Ký duyệt nội bộ nội bộ và tự động tạo phim vào rạp"
                        >
                          <PenTool size={14} />
                          <span>Ký duyệt & Kích hoạt vào rạp</span>
                        </button>
                        <button
                          disabled={working}
                          onClick={() => setReturnModalOpen(true)}
                          className="px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition-all"
                        >
                          <RotateCcw size={14} />
                          <span>Yêu cầu sửa</span>
                        </button>
                      </>
                    )}

                    {/* Admin Activate */}
                    {(mode === 'admin' || selected.allowedActions?.includes('ACTIVATE_CONTRACT')) && selected.status === 'Signed' && (
                      <button
                        disabled={working}
                        onClick={() => void handleWorkflowAction('ACTIVATE_CONTRACT')}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-[#15803d] hover:bg-[#166534] text-white border border-emerald-500/30 transition-all active:scale-[0.98] shadow-sm"
                      >
                        <Play size={14} />
                        <span>Kích hoạt vào hệ thống</span>
                      </button>
                    )}

                    {/* Active state badge */}
                    {selected.status === 'Activated' && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.3)] text-[#22c55e] text-xs font-semibold">
                        <CheckCircle2 size={14} />
                        <span>Đang hiệu lực & Khai thác</span>
                      </div>
                    )}

                    {/* Notice for Manager when contract is Signed */}
                    {mode !== 'admin' && !selected.allowedActions?.includes('ACTIVATE_CONTRACT') && selected.status === 'Signed' && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(234,179,8,0.1)] border border-[rgba(234,179,8,0.3)] text-[#eab308] text-xs font-medium">
                        <Clock size={13} />
                        <span>Chờ Admin kích hoạt</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* LIFECYCLE STEPPER */}
                <ContractStepper status={selected.status} revision={selected.revision} />

                {/* SIGNED STATUS BANNER */}
                {selected.status === 'Signed' && (
                  <div className="mt-3 p-4 rounded-xl border border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[rgba(34,197,94,0.2)] text-[#22c55e] flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                          <span>Hồ sơ đã ký duyệt điện tử thành công!</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#22c55e]/20 text-[#22c55e] font-semibold">
                            Chờ kích hoạt khai thác
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                          {mode === 'admin' || selected.allowedActions?.includes('ACTIVATE_CONTRACT')
                            ? 'Phim chưa hiển thị trong danh mục rạp vì hợp đồng chưa được kích hoạt. Bấm nút "Kích hoạt vào hệ thống" để tự động tạo phim và cấp quyền chiếu cho các rạp.'
                            : 'Phim sẽ chính thức được tạo trong Danh mục phim khi Tổng Quản Trị (Admin) thực hiện "Kích hoạt vào hệ thống".'}
                        </p>
                      </div>
                    </div>
                    {(mode === 'admin' || selected.allowedActions?.includes('ACTIVATE_CONTRACT')) && (
                      <button
                        disabled={working}
                        onClick={() => void handleWorkflowAction('ACTIVATE_CONTRACT')}
                        className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-[#15803d] hover:bg-[#166534] text-white border border-emerald-500/30 transition-all shrink-0 self-start md:self-auto shadow-sm"
                      >
                        <Play size={14} />
                        <span>Kích hoạt vào hệ thống ngay</span>
                      </button>
                    )}
                  </div>
                )}

                {/* ACTIVATED STATUS BANNER */}
                {selected.status === 'Activated' && (
                  <div className="mt-3 p-4 rounded-xl border border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[rgba(34,197,94,0.2)] text-[#22c55e] flex items-center justify-center shrink-0">
                        <Film size={22} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                          <span>Hợp đồng đang có hiệu lực khai thác</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#22c55e]/20 text-[#22c55e] font-semibold">
                            Đã đưa vào hệ thống rạp
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          Tất cả phim trong hợp đồng đã được tự động tạo vào Danh mục phim và cấp quyền chiếu cho các cụm rạp Galaxiad.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(mode === 'admin' ? '/movie-manager' : '/movie-manager')}
                      className="btn btn-secondary text-xs px-4 py-2 flex items-center gap-1.5 text-[var(--text-primary)] hover:border-[var(--accent)] shrink-0 self-start md:self-auto"
                    >
                      <Film size={14} className="text-[var(--accent)]" />
                      <span>Xem trong Danh mục phim</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* TABS HEADER */}
              <div className="flex border-b border-[var(--border-color)] gap-6 text-sm font-semibold">
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`pb-3 flex items-center gap-2 transition-all border-b-2 ${
                    activeTab === 'documents'
                      ? 'border-[var(--accent)] text-[var(--accent)]'
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <UploadCloud size={16} />
                  <span>1. Tài liệu nguồn</span>
                  <span className="text-xs px-1.5 py-0.2 rounded-full bg-[var(--bg-elevated)] font-mono">
                    {selected.revision?.documents?.length || 0}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('ai')}
                  className={`pb-3 flex items-center gap-2 transition-all border-b-2 ${
                    activeTab === 'ai'
                      ? 'border-[var(--accent)] text-[var(--accent)]'
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Sparkles size={16} />
                  <span>2. Trích xuất AI & OCR</span>
                  {selected.revision?.extractedText && (
                    <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('review')}
                  className={`pb-3 flex items-center gap-2 transition-all border-b-2 ${
                    activeTab === 'review'
                      ? 'border-[var(--accent)] text-[var(--accent)]'
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <FileCheck size={16} />
                  <span>3. Dữ liệu đối chiếu & Chính sách</span>
                  <span className="text-xs px-1.5 py-0.2 rounded-full bg-[var(--bg-elevated)] font-mono">
                    {movieLines.length}
                  </span>
                </button>
              </div>

              {/* TAB 1: DOCUMENTS */}
              {activeTab === 'documents' && (
                <DocumentsTab
                  detail={selected}
                  working={working}
                  onUploaded={async () => {
                    await openContract(selected.contractId);
                    await load();
                    setActiveTab('ai');
                  }}
                />
              )}

              {/* TAB 2: AI & OCR EXTRACTION */}
              {activeTab === 'ai' && (
                <AiExtractionTab cinemas={cinemas}
                  detail={selected}
                  working={working}
                  ages={ages}
                  formats={formats}
                  onTriggerExtract={() => handleWorkflowAction('TRIGGER_EXTRACTION')}
                  onApplyAiData={(lines, reviewed) => {
                    setMovieLines(lines);
                    setFinancialReviewed(reviewed);
                    setActiveTab('review');
                    showSuccess('Đã tự động áp dụng thông tin từ AI vào form đối chiếu!');
                  }}
                />
              )}

              {/* TAB 3: REVIEW & MOVIE LINES */}
              {selected.status === 'Draft' && (
                <div className="glass-card p-4 rounded-xl space-y-3">
                  <label className="block text-sm">Nhà phát hành / bên cấp quyền (đối chiếu tài liệu)
                    <input className="input w-full" value={reviewPartner} onChange={e => setReviewPartner(e.target.value)} />
                  </label>
                  {mode === 'admin' && <div className="flex gap-2 flex-wrap">
                    <select aria-label="Người đối soát" className="input" value={reviewerId} onChange={e => setReviewerId(e.target.value)}>
                      <option value="">Chọn MovieManager để đối soát (tùy chọn)</option>
                      {reviewers.map(r => <option key={r.userId} value={r.userId}>{r.name}</option>)}
                    </select>
                    <button className="btn btn-secondary" disabled={working || !reviewerId || selected.processingStatus !== 'AwaitingDataApproval'} onClick={() => void runAction(() => contractApi.assign(selected.contractId, reviewerId), 'Đã giao hồ sơ cho MovieManager đối soát.')}>Giao đối soát</button>
                  </div>}
                  <p className="text-xs">Phụ trách: {selected.assignedMovieManagerName}. Mọi lần lưu đối soát đều được ghi lịch sử.</p>
                </div>
              )}
              <ContractReviewHistoryView detail={selected} />
              {activeTab === 'review' && (
                <ReviewDataTab
                  mode={mode}
                  detail={selected}
                  movieLines={movieLines}
                  setMovieLines={setMovieLines}
                  financialReviewed={financialReviewed}
                  setFinancialReviewed={setFinancialReviewed}
                  ages={ages}
                  cinemas={cinemas}
                  formats={formats}
                  working={working}
                  onSave={handleSaveReview}
                  onSaveAndSubmit={handleSaveAndSubmit}
                  onGoBackToAi={() => setActiveTab('ai')}
                />
              )}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 text-center border border-[var(--border-color)] h-[500px] flex flex-col items-center justify-center">
              <Film size={48} className="opacity-20 text-[var(--accent)] mb-3" />
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Chọn một hồ sơ hợp đồng</h3>
              <p className="text-sm text-[var(--text-muted)] max-w-sm mt-1">
                Chọn hồ sơ từ danh sách bên trái để tải lên tài liệu, chạy OCR bằng AI hoặc kiểm duyệt dữ liệu phim.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="btn btn-secondary text-xs mt-4 flex items-center gap-1.5"
              >
                <Plus size={14} /> Tiếp nhận hồ sơ mới
              </button>
            </div>
          )}
        </main>
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in">
          <div className="glass-card w-full max-w-lg rounded-2xl border border-[var(--border-color)] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <FilePlus size={18} className="text-[var(--accent)]" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Tiếp nhận hồ sơ hợp đồng</h3>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <label className="block">PDF / ảnh hợp đồng
                <input aria-label="Tài liệu tiếp nhận" type="file" accept="application/pdf,image/png,image/jpeg" onChange={e => setIntakeFile(e.target.files?.[0] || null)} className="block w-full mt-2" />
              </label>
              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Đơn vị phát hành / Đối tác (có thể cập nhật sau khi OCR)
                </label>
                <input
                  type="text"
                  placeholder="VD: Công ty TNHH Galaxiad Pictures..."
                  value={partner}
                  onChange={e => setPartner(e.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Số hợp đồng phía đối tác (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="VD: HDCP/2026/GLX-001..."
                  value={contractNumber}
                  onChange={e => setContractNumber(e.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="p-3 rounded-lg bg-[rgba(255,138,0,0.06)] border border-[rgba(255,138,0,0.2)] text-xs text-[var(--text-secondary)]">
                Tải tài liệu lên để OCR chạy ngay. Sau khi đọc xong, Admin có thể giao MovieManager đối soát hoặc tự kiểm tra và ký duyệt.
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
              <button
                onClick={() => setShowCreate(false)}
                className="btn btn-secondary px-4 py-2 text-xs"
              >
                Hủy bỏ
              </button>
              <button
                disabled={working || !intakeFile}
                onClick={() => void createDraft()}
                className="btn btn-primary px-4 py-2 text-xs flex items-center gap-1.5"
              >
                {working && <Loader2 size={14} className="animate-spin" />}
                <span>Tải lên & trích xuất OCR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIGN & ACTIVATE CONFIRMATION MODAL */}
      {selected && (
        <SignAndActivateModal
          isOpen={signModalOpen}
          mode={signModalMode}
          contract={selected}
          working={working}
          onClose={() => setSignModalOpen(false)}
          onConfirm={handleConfirmSignAndActivate}
        />
      )}

      {/* RETURN FOR REVISION MODAL */}
      {selected && (
        <ReturnRevisionModal
          isOpen={returnModalOpen}
          working={working}
          onClose={() => setReturnModalOpen(false)}
          onConfirm={handleConfirmReturn}
        />
      )}
    </div>
  );
};

/* =========================================================================
   COMPONENTS
   ========================================================================= */

// 1. STEPPER COMPONENT
const ContractReviewHistoryView = ({ detail }: { detail: ContractDetail }) => {
  const events: any[] = [];
  let original: any = {};
  try {
    original = JSON.parse(detail.revision?.extractionJson || '{}').analysis || {};
    let node = JSON.parse(detail.revision?.reviewHistoryJson || '{}');
    if (Array.isArray(node.events)) { events.push(...node.events.slice().reverse()); node = null; }
    while (node && Object.keys(node).length) {
      if (node.action) events.push(node);
      node = node.before || (node.previousData ? JSON.parse(node.previousData) : null);
    }
  } catch { /* Older revisions may not contain review history. */ }
  if (!events.length) return null;
  const labels: Record<string, string> = { vietnameseTitle: 'Tên phim', englishTitle: 'Tên tiếng Anh', description: 'Mô tả', posterUrl: 'Poster', director: 'Đạo diễn', actors: 'Diễn viên', durationMinutes: 'Thời lượng', licenseStartAt: 'Bắt đầu quyền', licenseEndAt: 'Kết thúc quyền', cinemaSharePercent: 'Rạp hưởng (%)', distributorSharePercent: 'Đối tác hưởng (%)' };
  const fields = ['vietnameseTitle', 'englishTitle', 'description', 'posterUrl', 'director', 'actors', 'durationMinutes', 'licenseStartAt', 'licenseEndAt', 'cinemaSharePercent', 'distributorSharePercent'];
  return <details className="glass-card p-4 rounded-xl" open={detail.status === 'PendingReview'}>
    <summary className="cursor-pointer font-semibold">Đối soát: dữ liệu OCR → dữ liệu đã chỉnh · {events.length} sự kiện</summary>
    <div className="overflow-x-auto mt-3"><table className="w-full text-sm"><thead><tr><th>Phim / trường</th><th>OCR ban đầu</th><th>Sau đối soát</th></tr></thead><tbody>
      {(detail.revision?.movieLines || []).flatMap((line, i) => fields.map(field => {
        const before = original.movies?.[i]?.[field];
        const after = (line as unknown as Record<string, unknown>)[field];
        return <tr key={`${i}-${field}`} className={JSON.stringify(before) !== JSON.stringify(after) ? 'bg-amber-500/10' : ''}><td className="p-2">{i + 1} · {labels[field] || field}</td><td className="p-2 break-all">{String(before ?? 'Chưa trích xuất')}</td><td className="p-2 break-all">{String(after ?? 'Chưa xác nhận')}</td></tr>;
      }))}
      <tr><td>Đối tác</td><td>{original.distributor?.legalName || 'Chưa trích xuất'}</td><td>{detail.distributorName || 'Chưa xác nhận'}</td></tr>
    </tbody></table></div>
    {events.map((event, i) => <details key={i} className="mt-3 text-xs"><summary>{({ REVIEW: 'Lưu đối soát', ASSIGN: 'Giao đối soát', SUBMIT: 'Gửi kết quả', APPROVE: 'Phê duyệt', RETURN: 'Trả lại' } as Record<string, string>)[event.action] || event.action} · {event.at ? new Date(event.at).toLocaleString('vi-VN') : ''} · {event.actorName || event.actorId}</summary><pre className="whitespace-pre-wrap break-all max-h-72 overflow-auto">{JSON.stringify({ 'Trước lần sửa': event.before, 'Sau lần sửa': event.after }, null, 2)}</pre></details>)}
  </details>;
};
const ContractStepper = ({ status, revision }: { status: ContractStatus; revision?: ContractDetail['revision'] }) => {
  const steps = [
    {
      id: 1,
      title: 'Tài liệu nguồn',
      done: (revision?.documents?.length ?? 0) > 0,
      active: status === 'Draft' && (!revision?.documents || revision.documents.length === 0)
    },
    {
      id: 2,
      title: 'Trích xuất AI/OCR',
      done: Boolean(revision?.extractedText),
      active: status === 'Draft' && Boolean(revision?.documents?.length) && !revision?.extractedText
    },
    {
      id: 3,
      title: 'Đối chiếu dữ liệu',
      done: Boolean(revision?.dataReviewed && revision?.financialPolicyReviewed),
      active: status === 'Draft' && Boolean(revision?.extractedText) && !(revision?.dataReviewed && revision?.financialPolicyReviewed)
    },
    {
      id: 4,
      title: 'Ký duyệt & Đưa vào rạp',
      done: status === 'Activated',
      active: status === 'PendingReview' || status === 'ReadyToSign' || status === 'Signed'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
      {steps.map((step, idx) => (
        <div
          key={step.id}
          className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all ${
            step.done
              ? 'border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.06)] text-[#22c55e]'
              : step.active
              ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold'
              : 'border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] font-bold ${
              step.done
                ? 'bg-[#22c55e] text-black'
                : step.active
                ? 'bg-[var(--accent)] text-black'
                : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
            }`}
          >
            {step.done ? <Check size={12} strokeWidth={3} /> : idx + 1}
          </div>
          <span className="truncate">{step.title}</span>
        </div>
      ))}
    </div>
  );
};

// 2. TAB 1: DOCUMENTS TAB
const DocumentsTab = ({
  detail,
  working,
  onUploaded
}: {
  detail: ContractDetail;
  working: boolean;
  onUploaded: () => Promise<void>;
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [kind, setKind] = useState<string>('Original');
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setSelectedFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setSelectedFile(f);
  };

  const handleStartUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await contractApi.upload(detail.contractId, selectedFile, kind);
      await contractApi.extract(detail.contractId);
      showSuccess(`Đã lưu tệp ${selectedFile.name} thành công.`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await onUploaded();
    } catch (e) {
      showError(getError(e));
    } finally {
      setUploading(false);
    }
  };

  const docs = detail.revision?.documents || [];

  return (
    <div className="space-y-6 animate-in">
      {/* UPLOAD DROPZONE */}
      {detail.status === 'Draft' ? (
        <div className="glass-card rounded-2xl p-6 border border-[var(--border-color)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <UploadCloud size={16} className="text-[var(--accent)]" />
              <span>Tải lên tài liệu hợp đồng</span>
            </h3>
            <span className="text-xs text-[var(--text-muted)]">Định dạng: .PDF, .PNG, .JPEG (Tối đa 25 MB)</span>
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                : selectedFile
                ? 'border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.04)]'
                : 'border-[var(--border-color)] hover:border-[var(--text-muted)] bg-[var(--bg-elevated)]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileSelect}
              className="hidden"
            />
            {selectedFile ? (
              <div className="space-y-2">
                <FileCheck size={36} className="mx-auto text-[#22c55e]" />
                <div className="font-semibold text-[var(--text-primary)] text-sm">{selectedFile.name}</div>
                <div className="text-xs text-[var(--text-muted)] font-mono">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </div>
                <span className="inline-block text-xs text-[var(--accent)] underline pt-1">Bấm để chọn file khác</span>
              </div>
            ) : (
              <div className="space-y-2">
                <UploadCloud size={36} className="mx-auto text-[var(--text-muted)] opacity-60" />
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Kéo thả tài liệu hợp đồng vào đây, hoặc <span className="text-[var(--accent)]">duyệt từ máy</span>
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Hỗ trợ hợp đồng quét (scan), tài liệu PDF điện tử hoặc ảnh chụp điều khoản.
                </p>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
                <span className="text-[var(--text-secondary)] shrink-0">Loại tài liệu:</span>
                <select
                  value={kind}
                  onChange={e => setKind(e.target.value)}
                  className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="Original">Hợp đồng gốc (Original)</option>
                  <option value="Annex">Phụ lục hợp đồng (Annex)</option>
                  <option value="CounterpartySigned">Bản ký đối tác (Counterparty Signed)</option>
                </select>
              </div>

              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="btn btn-secondary text-xs px-3 py-1.5"
                >
                  Hủy
                </button>
                <button
                  disabled={uploading || working}
                  onClick={handleStartUpload}
                  className="btn btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5 shadow-md shadow-[rgba(255,138,0,0.2)]"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  <span>Xác nhận tải lên</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs text-[var(--text-muted)] flex items-center gap-2">
          <Lock size={15} />
          <span>Hồ sơ đã chuyển qua giai đoạn phê duyệt/khai thác. Không thể tải thêm tài liệu vào revision này.</span>
        </div>
      )}

      {/* DOCUMENT LIST */}
      <div className="glass-card rounded-2xl p-6 border border-[var(--border-color)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Layers size={16} className="text-[var(--accent)]" />
            <span>Tài liệu đính kèm trong Revision #{detail.currentRevisionNumber}</span>
          </h3>
          <span className="text-xs font-mono text-[var(--text-muted)]">{docs.length} tệp tin</span>
        </div>

        {docs.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)] border border-dashed border-[var(--border-color)] rounded-xl">
            <FileText size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Chưa có tài liệu nào được tải lên cho revision này.</p>
            <p className="text-xs mt-1">Hãy tải lên ít nhất một file PDF/ảnh để thực hiện OCR.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-color)]">
            {docs.map(doc => (
              <div key={doc.contractDocumentId} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 truncate">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--accent)] shrink-0">
                    <FileText size={16} />
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">{doc.fileName}</div>
                    <div className="text-xs text-[var(--text-muted)] flex items-center gap-2 font-mono">
                      <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                      <span>·</span>
                      <span className="truncate max-w-[180px]" title={doc.sha256}>
                        SHA: {doc.sha256.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => void contractApi.openDocument(detail.contractId, doc.contractDocumentId, doc.fileName)}
                  className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 shrink-0"
                >
                  <Download size={13} />
                  <span>Xem / Tải về</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 3. TAB 2: AI & OCR EXTRACTION TAB
const AiExtractionTab = ({
  cinemas,
  detail,
  working,
  ages,
  formats,
  onTriggerExtract,
  onApplyAiData
}: {
  cinemas: Cinema[];
  detail: ContractDetail;
  working: boolean;
  ages: MovieRequiredAge[];
  formats: MovieFormat[];
  onTriggerExtract: () => void;
  onApplyAiData: (lines: ContractMovieLine[], financialReviewed: boolean) => void;
}) => {
  const pMeta = processingStatusText[detail.processingStatus] ?? processingStatusText.Idle;
  const extractionJsonStr = detail.revision?.extractionJson || '';

  // Parse JSON from model
  const parsedData = useMemo(() => {
    if (!extractionJsonStr) return null;
    try {
      return JSON.parse(extractionJsonStr);
    } catch {
      return null;
    }
  }, [extractionJsonStr]);

  const rawText = detail.revision?.extractedText || parsedData?.text || '';

  const analysis = parsedData?.analysis;
  const movies = analysis?.movies || [];
  const clauses = analysis?.clauses || [];
  const warnings = parsedData?.warnings || [];

  const handleAutoFill = () => {
    if (!movies || movies.length === 0) return;

    const convertedLines = extractMovieDrafts(extractionJsonStr, ages, cinemas, formats);

    onApplyAiData(convertedLines, false);
  };

  return (
    <div className="space-y-6 animate-in">
      {/* AI STATUS & QUICK ACTION CARD */}
      <div className="glass-card rounded-2xl p-5 border border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Bot size={18} className="text-[var(--accent)]" />
            <span className="text-sm font-bold text-[var(--text-primary)]">Trạng thái trích xuất AI</span>
            {(detail.processingStatus === 'Queued' || detail.processingStatus === 'Processing') && (
              <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium border border-amber-500/20 animate-pulse">
                <Loader2 size={11} className="animate-spin" />
                <span>Đang tự động cập nhật...</span>
              </span>
            )}
            {rawText && (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-medium border border-emerald-500/20">
                ✓ Đã lưu CSDL ({rawText.length} ký tự)
              </span>
            )}
          </div>
          <p className="text-xs font-medium" style={{ color: pMeta.color }}>
            {pMeta.label}
          </p>
          {parsedData?.modelUsed && (
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              Model: {parsedData.modelUsed} ({parsedData.modelProvider || 'Ollama GPU'})
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {detail.status === 'Draft' && (
            <button
              disabled={working || !detail.revision?.documents?.length}
              onClick={onTriggerExtract}
              className="btn btn-secondary text-xs flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={working ? 'animate-spin' : ''} />
              <span>Phân tích lại</span>
            </button>
          )}

          {movies.length > 0 && detail.status === 'Draft' && (
            <button
              onClick={handleAutoFill}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-[#d97706] hover:bg-[#b45309] text-white border border-amber-500/30 transition-all active:scale-[0.98] shadow-sm"
            >
              <Sparkles size={14} />
              <span>Tự động áp dụng dữ liệu AI vào Form</span>
            </button>
          )}
        </div>
      </div>

      {/* WARNINGS */}
      {warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)] text-[#f59e0b] text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle size={15} />
            <span>Lưu ý từ mô hình trích xuất:</span>
          </div>
          {warnings.map((w: string, idx: number) => (
            <p key={idx} className="pl-5">• {w}</p>
          ))}
        </div>
      )}

      {/* SPLIT VIEW: RAW OCR TEXT & EXTRACTED CLAUSES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* RAW OCR TEXT (5 COLS) */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-5 border border-[var(--border-color)] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <FileSearch size={14} />
              <span>Văn bản thô từ tài liệu (OCR)</span>
            </h4>
            {rawText && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(rawText);
                  showSuccess('Đã sao chép văn bản OCR');
                }}
                className="text-[11px] text-[var(--accent)] hover:underline flex items-center gap-1"
              >
                <Copy size={11} /> Copy
              </button>
            )}
          </div>

          <pre className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-color)] font-mono text-xs text-[var(--text-secondary)] leading-relaxed h-[440px] overflow-y-auto whitespace-pre-wrap">
            {rawText || 'Chưa có dữ liệu OCR. Hãy tải lên tài liệu và bấm "Đọc & Phân tích AI".'}
          </pre>
        </div>

        {/* STRUCTURED CLAUSES & MOVIES (7 COLS) */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-5 border border-[var(--border-color)] space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Sparkles size={14} className="text-[var(--accent)]" />
            <span>Kết quả phân tích có cấu trúc</span>
          </h4>

          {movies.length === 0 && clauses.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)] text-xs h-[440px] flex flex-col items-center justify-center border border-dashed border-[var(--border-color)] rounded-xl">
              <Bot size={32} className="opacity-30 mb-2" />
              <p>Chưa có dữ liệu bóc tách từ mô hình AI.</p>
            </div>
          ) : (
            <div className="space-y-4 h-[440px] overflow-y-auto pr-1">
              {/* Movies Summary Card */}
              {movies.map((m: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[var(--accent)]">{m.vietnameseTitle}</span>
                    {m.ageRating && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[rgba(255,138,0,0.15)] text-[var(--accent)]">
                        {m.ageRating}
                      </span>
                    )}
                  </div>
                  {m.englishTitle && <div className="text-xs text-[var(--text-muted)] italic">{m.englishTitle}</div>}

                  <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)] pt-1">
                    <div>⏱ Thời lượng: <strong>{m.durationMinutes} phút</strong></div>
                    <div>🎬 Đạo diễn: <strong>{m.director || 'Chưa rõ'}</strong></div>
                    <div>📅 Hiệu lực: <strong>{m.licenseStartAt} → {m.licenseEndAt}</strong></div>
                    <div>💰 Tỷ lệ chia: <strong>Rạp {m.cinemaSharePercent}% - Đối tác {m.distributorSharePercent}%</strong></div>
                  </div>
                </div>
              ))}

              {/* Clauses Breakdown */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase">Các điều khoản pháp lý phát hiện</span>
                <div className="space-y-2">
                  {clauses.map((c: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-[var(--text-primary)]">
                        <span className="capitalize">{c.type?.replace('_', ' ')}</span>
                        {c.page && <span className="text-[10px] text-[var(--text-muted)] font-mono">Trang {c.page}</span>}
                      </div>
                      <p className="text-[var(--text-secondary)]">{c.summary}</p>
                      {c.evidence && (
                        <p className="text-[11px] text-[var(--text-muted)] italic pt-0.5 border-t border-[var(--border-color)]">
                          Nguồn: "{c.evidence}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 4. TAB 3: REVIEW & MOVIE LINES TAB
const ReviewDataTab = ({
  mode,
  detail,
  movieLines,
  setMovieLines,
  financialReviewed,
  setFinancialReviewed,
  ages,
  cinemas,
  formats,
  working,
  onSave,
  onSaveAndSubmit,
  onGoBackToAi
}: {
  mode: 'admin' | 'manager';
  detail: ContractDetail;
  movieLines: ContractMovieLine[];
  setMovieLines: React.Dispatch<React.SetStateAction<ContractMovieLine[]>>;
  financialReviewed: boolean;
  setFinancialReviewed: (v: boolean) => void;
  ages: MovieRequiredAge[];
  cinemas: Cinema[];
  formats: MovieFormat[];
  working: boolean;
  onSave: () => void;
  onSaveAndSubmit: () => void;
  onGoBackToAi: () => void;
}) => {
  const isDraft = detail.status === 'Draft';
  const [showOcrDrawer, setShowOcrDrawer] = useState(false);
  const rawText = detail.revision?.extractedText || '';

  const updateLine = (idx: number, patch: Partial<ContractMovieLine>) => {
    setMovieLines(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));
  };

  const addLine = () => {
    setMovieLines(prev => [...prev, emptyLine()]);
  };

  const removeLine = (idx: number) => {
    if (movieLines.length <= 1) return;
    setMovieLines(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6 animate-in">
      {/* REVIEW HEADER NOTICE */}
      <div className="glass-card rounded-2xl p-4 border border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[rgba(255,138,0,0.1)] text-[var(--accent)] flex items-center justify-center shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--text-primary)]">Đối chiếu danh mục phim & chính sách rạp</div>
            <div className="text-xs text-[var(--text-muted)]">
              Kiểm tra kỹ các dòng phim, độ tuổi, định dạng chiếu và cơ chế chia doanh thu trước khi lưu revision.
            </div>
          </div>
        </div>

        {isDraft && (
          <div className="flex items-center gap-2">
            <button onClick={onGoBackToAi} className="btn btn-secondary text-xs flex items-center gap-1.5">
              <Sparkles size={13} />
              <span>Xem kết quả AI</span>
            </button>
            <button onClick={addLine} className="btn btn-secondary text-xs flex items-center gap-1.5">
              <Plus size={13} />
              <span>Thêm phim phụ lục</span>
            </button>
          </div>
        )}
      </div>

      {/* OCR RAW REFERENCE ACCORDION */}
      {rawText && (
        <div className="glass-card rounded-2xl border border-[var(--border-color)] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowOcrDrawer(!showOcrDrawer)}
            className="w-full p-3.5 flex items-center justify-between hover:bg-[var(--bg-elevated)] transition-colors text-left"
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <FileSearch size={16} className="text-[var(--accent)]" />
              <span className="text-xs font-bold text-[var(--text-primary)]">
                Văn bản hợp đồng OCR gốc ({rawText.length} ký tự)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-medium border border-emerald-500/20">
                ✓ Đã lưu CSDL
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span>{showOcrDrawer ? 'Thu gọn văn bản' : 'Mở xem đối chiếu song song'}</span>
              <ChevronDown size={14} className={`transform transition-transform ${showOcrDrawer ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showOcrDrawer && (
            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-elevated)] space-y-2 animate-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  Dữ liệu OCR thô được lưu trữ vĩnh viễn theo Revision #{detail.revision?.revisionNumber ?? 1}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(rawText);
                    showSuccess('Đã sao chép văn bản OCR!');
                  }}
                  className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1"
                >
                  <Copy size={12} /> Sao chép toàn bộ
                </button>
              </div>
              <pre className="p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)] font-mono text-xs text-[var(--text-secondary)] leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
                {rawText}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* MOVIE LINES LIST */}
      <div className="space-y-4">
        {movieLines.map((line, idx) => (
          <MovieCardEditor
            key={line.contractMovieLineId ?? idx}
            line={line}
            index={idx}
            isDraft={isDraft}
            contractStatus={detail.status}
            canDelete={movieLines.length > 1}
            update={updateLine}
            onDelete={() => removeLine(idx)}
            ages={ages}
            cinemas={cinemas}
            formats={formats}
          />
        ))}
      </div>

      {/* FINANCIAL POLICY CONFIRMATION CHECKBOX */}
      <div className="glass-card rounded-2xl p-5 border border-[var(--border-color)] space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            disabled={!isDraft}
            checked={financialReviewed}
            onChange={e => setFinancialReviewed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-[var(--border-color)] text-[var(--accent)] focus:ring-0"
          />
          <div className="text-xs text-[var(--text-secondary)]">
            <span className="font-bold text-[var(--text-primary)]">
              Xác nhận đối chiếu chính sách phân chia doanh thu & tài chính
            </span>
            <p className="text-[var(--text-muted)] mt-0.5">
              Tôi xác nhận đã đối chiếu kỹ cơ sở tính doanh thu (TICKET_FINAL_PRICE_AFTER_REFUND), tỷ lệ phân chia, chu kỳ đối soát và các điều khoản khấu trừ hoàn tiền hợp lệ theo hợp đồng nguồn.
            </p>
          </div>
        </label>

        {isDraft && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--border-color)]">
            <div className="text-xs text-[var(--text-muted)]">
              {!financialReviewed
                ? '⚠️ Vui lòng tick chọn xác nhận chính sách tài chính trước khi gửi duyệt.'
                : mode === 'admin' ? '✓ Dữ liệu đã sẵn sàng để bạn ký duyệt.' : '✓ Dữ liệu đã sẵn sàng để gửi Quản trị viên phê duyệt.'}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={working}
                onClick={onSave}
                className="btn btn-secondary text-xs px-4 py-2 flex items-center gap-1.5"
                title="Lưu tạm dữ liệu đối chiếu"
              >
                {working ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                <span>Lưu bản nháp</span>
              </button>
              <button
                disabled={working || !financialReviewed}
                onClick={onSaveAndSubmit}
                className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 bg-[#d97706] hover:bg-[#b45309] text-white border border-amber-500/30 transition-all disabled:opacity-50 active:scale-[0.98] shadow-sm"
                title={!financialReviewed ? 'Cần xác nhận chính sách tài chính' : mode === 'admin' ? 'Lưu và xem lại trước khi ký duyệt' : 'Lưu và gửi Admin duyệt'}
              >
                {working ? <Loader2 size={13} className="animate-spin" /> : <Send size={14} />}
                <span>{mode === 'admin' ? 'Lưu đối soát & ký duyệt' : 'Lưu & gửi kết quả cho Admin'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 5. INDIVIDUAL MOVIE CARD EDITOR
const MovieCardEditor = ({
  line,
  index,
  isDraft,
  contractStatus,
  canDelete,
  update,
  onDelete,
  ages,
  cinemas,
  formats
}: {
  line: ContractMovieLine;
  index: number;
  isDraft: boolean;
  contractStatus: ContractStatus;
  canDelete: boolean;
  update: (idx: number, patch: Partial<ContractMovieLine>) => void;
  onDelete: () => void;
  ages: MovieRequiredAge[];
  cinemas: Cinema[];
  formats: MovieFormat[];
}) => {
  const localValue = (val: string) => {
    const date = new Date(val);
    return !val || Number.isNaN(date.getTime()) ? '' : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-[var(--border-color)] space-y-4 relative">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2 flex-wrap">
          <Film size={16} className="text-[var(--accent)]" />
          <span className="text-sm font-bold text-[var(--text-primary)]">Phim #{index + 1}</span>
          {line.vietnameseTitle && (
            <span className="text-xs text-[var(--text-secondary)] font-semibold truncate max-w-sm">
              — {line.vietnameseTitle}
            </span>
          )}
          {line.movieId ? (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#22c55e]/20 text-[#22c55e] font-mono flex items-center gap-1">
              <CheckCircle2 size={11} />
              Đã tạo phim: {line.movieId.slice(0, 8)}...
            </span>
          ) : contractStatus === 'Signed' ? (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#eab308]/20 text-[#eab308] flex items-center gap-1">
              <Clock size={11} />
              Phim được tạo sau khi ký duyệt và kích hoạt
            </span>
          ) : contractStatus === 'Activated' ? (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#3b82f6]/20 text-[#3b82f6]">
              Đang đồng bộ vào rạp
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer">
            <input
              type="checkbox"
              disabled={!isDraft}
              checked={line.reviewed}
              onChange={e => update(index, { reviewed: e.target.checked })}
              className="rounded border-[var(--border-color)] text-[var(--accent)]"
            />
            <span>Đã kiểm tra dòng này</span>
          </label>
          {isDraft && canDelete && (
            <button
              onClick={onDelete}
              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--danger)]"
              title="Xóa dòng phim này"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Vietnamese Title */}
        <div>
          <label className="block text-[var(--text-secondary)] font-medium mb-1">Tên phim tiếng Việt *</label>
          <input
            disabled={!isDraft}
            type="text"
            value={line.vietnameseTitle}
            onChange={e => update(index, { vietnameseTitle: e.target.value })}
            placeholder="VD: MAI, DUNE: HÀNH TINH CÁT..."
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] font-medium"
          />
        </div>

        {/* English Title */}
        <div>
          <label className="block text-[var(--text-secondary)] font-medium mb-1">Tên tiếng Anh (nếu có)</label>
          <input
            disabled={!isDraft}
            type="text"
            value={line.englishTitle || ''}
            onChange={e => update(index, { englishTitle: e.target.value })}
            placeholder="VD: Dune: Part Two..."
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        <label className="md:col-span-2 block space-y-1">Mô tả phim
          <textarea aria-label={`Mô tả phim ${index + 1}`} disabled={!isDraft} value={line.description || ''} onChange={e => update(index, { description: e.target.value })} rows={4} maxLength={2048} className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg p-3" />
        </label>
        <label className="block space-y-1">Đường dẫn poster
          <input aria-label={`Poster phim ${index + 1}`} disabled={!isDraft} value={line.posterUrl || ''} onChange={e => update(index, { posterUrl: e.target.value })} className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg p-3" />
        </label>
        <div>{line.posterUrl && /^https?:\/\//i.test(line.posterUrl) ? <img src={line.posterUrl} alt={`Poster ${line.vietnameseTitle}`} referrerPolicy="no-referrer" className="h-40 max-w-full rounded-lg object-contain" /> : <span>Chưa có poster trong tài liệu.</span>}</div>
        {(['director', 'actors', 'trailerUrl'] as const).map(field => <label key={field} className="block space-y-1">{{ director: 'Đạo diễn', actors: 'Diễn viên', trailerUrl: 'Đường dẫn trailer' }[field]}
          <input disabled={!isDraft} value={line[field] || ''} onChange={e => update(index, { [field]: e.target.value })} className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg p-3" />
        </label>)}
        {/* Duration */}
        <div>
          <label className="block text-[var(--text-secondary)] font-medium mb-1">Thời lượng (phút) *</label>
          <input
            disabled={!isDraft}
            type="number"
            value={line.durationMinutes || ''}
            onChange={e => update(index, { durationMinutes: Number(e.target.value) })}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] font-mono"
          />
        </div>

        {/* Age Rating */}
        <div>
          <label className="block text-[var(--text-secondary)] font-medium mb-1">Phân loại độ tuổi *</label>
          <select
            disabled={!isDraft}
            value={line.movieRequiredAgeId}
            onChange={e => update(index, { movieRequiredAgeId: e.target.value })}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="">-- Chọn phân loại khán giả --</option>
            {ages.map(a => (
              <option key={a.movieRequiredAgeSymbolId} value={a.movieRequiredAgeSymbolId}>
                {a.movieRequiredAgeSymbol} — {a.movieRequiredAgeDescription || a.movieRequiredAgeSymbol}
              </option>
            ))}
          </select>
        </div>

        {/* License Start */}
        <div>
          <label className="block text-[var(--text-secondary)] font-medium mb-1">Bắt đầu quyền chiếu</label>
          <input
            disabled={!isDraft}
            type="datetime-local"
            value={localValue(line.licenseStartAt)}
            onChange={e => update(index, { licenseStartAt: e.target.value ? new Date(e.target.value).toISOString() : '' })}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] font-mono"
          />
        </div>

        {/* License End */}
        <div>
          <label className="block text-[var(--text-secondary)] font-medium mb-1">Kết thúc quyền chiếu</label>
          <input
            disabled={!isDraft}
            type="datetime-local"
            value={localValue(line.licenseEndAt)}
            onChange={e => update(index, { licenseEndAt: e.target.value ? new Date(e.target.value).toISOString() : '' })}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] font-mono"
          />
        </div>
      </div>

      {/* SCOPE SECTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[var(--border-color)]">
        {/* Cinema Scope */}
        <div className="space-y-2 text-xs">
          <label className="block font-bold text-[var(--text-primary)]">Phạm vi cụm rạp áp dụng</label>
          <select
            disabled={!isDraft}
            value={line.cinemaScopeState}
            onChange={e => update(index, { cinemaScopeState: e.target.value as ScopeState })}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="NoAdditionalRestrictionConfirmed">Toàn bộ hệ thống Galaxiad Cinema</option>
            <option value="Specified">Chỉ định cụm rạp cụ thể</option>
            <option value="Unresolved">Chưa xác định (Chặn gửi duyệt)</option>
          </select>

          {line.cinemaScopeState === 'Specified' && (
            <div className="flex flex-wrap gap-1.5 p-2 bg-[var(--bg-elevated)] rounded-lg max-h-32 overflow-y-auto border border-[var(--border-color)]">
              {cinemas.map(c => {
                const checked = line.cinemaIds.includes(c.cinemaId);
                return (
                  <button
                    type="button"
                    key={c.cinemaId}
                    disabled={!isDraft}
                    onClick={() => {
                      const next = checked ? line.cinemaIds.filter(id => id !== c.cinemaId) : [...line.cinemaIds, c.cinemaId];
                      update(index, { cinemaIds: next });
                    }}
                    className={`px-2 py-1 rounded text-[11px] transition-all ${
                      checked
                        ? 'bg-[var(--accent)] text-black font-semibold'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {c.cinemaName}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Formats Scope */}
        <div className="space-y-2 text-xs">
          <label className="block font-bold text-[var(--text-primary)]">Định dạng chiếu cho phép</label>
          <select
            disabled={!isDraft}
            value={line.formatScopeState}
            onChange={e => update(index, { formatScopeState: e.target.value as ScopeState })}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="NoAdditionalRestrictionConfirmed">Mọi định dạng phòng chiếu (2D, 3D, IMAX...)</option>
            <option value="Specified">Chỉ định định dạng cụ thể</option>
            <option value="Unresolved">Chưa xác định</option>
          </select>

          {line.formatScopeState === 'Specified' && (
            <div className="flex flex-wrap gap-1.5 p-2 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-color)]">
              {formats.map(f => {
                const checked = line.formatIds.includes(f.formatId);
                return (
                  <button
                    type="button"
                    key={f.formatId}
                    disabled={!isDraft}
                    onClick={() => {
                      const next = checked ? line.formatIds.filter(id => id !== f.formatId) : [...line.formatIds, f.formatId];
                      update(index, { formatIds: next });
                    }}
                    className={`px-2 py-1 rounded text-[11px] font-mono transition-all ${
                      checked
                        ? 'bg-[var(--accent)] text-black font-semibold'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {f.formatName}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* REVENUE SHARING SPLIT */}
      <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
          <span>Chính sách phân chia doanh thu phòng vé</span>
          <span className="font-mono text-[var(--accent)]">
            Rạp {line.cinemaSharePercent}% — Đối tác {line.distributorSharePercent}%
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-3 rounded-full bg-[var(--border-color)] overflow-hidden flex">
          <div
            style={{ width: `${line.cinemaSharePercent}%` }}
            className="bg-[var(--accent)] transition-all"
            title={`Rạp: ${line.cinemaSharePercent}%`}
          />
          <div
            style={{ width: `${line.distributorSharePercent}%` }}
            className="bg-[#38bdf8] transition-all"
            title={`Đối tác: ${line.distributorSharePercent}%`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
          <div>
            <label className="block text-[var(--text-secondary)] mb-1">Rạp Galaxiad hưởng (%)</label>
            <input
              disabled={!isDraft}
              type="number"
              min={0}
              max={100}
              value={line.cinemaSharePercent}
              onChange={e => {
                const val = Math.min(100, Math.max(0, Number(e.target.value)));
                update(index, { cinemaSharePercent: val, distributorSharePercent: 100 - val });
              }}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 font-mono text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] mb-1">Đối tác phát hành hưởng (%)</label>
            <input
              disabled
              type="number"
              value={line.distributorSharePercent}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 font-mono text-[var(--text-muted)] cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] mb-1">Chu kỳ thanh toán đối soát</label>
            <select
              disabled={!isDraft}
              value={line.settlementCycle}
              onChange={e => update(index, { settlementCycle: e.target.value as 'Weekly' | 'Monthly' })}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-[var(--text-primary)]"
            >
              <option value="Monthly">Hàng tháng (Monthly)</option>
              <option value="Weekly">Hàng tuần (Weekly)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

// 6. SIGN AND ACTIVATE CONFIRMATION MODAL
interface SignAndActivateModalProps {
  isOpen: boolean;
  mode: 'approve_and_activate' | 'sign_and_activate';
  contract: ContractDetail;
  working: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
}

const SignAndActivateModal: React.FC<SignAndActivateModalProps> = ({
  isOpen,
  mode,
  contract,
  working,
  onClose,
  onConfirm
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPassword(false);
      setLocalError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setLocalError('Vui lòng nhập mật khẩu Quản trị viên để xác thực ký duyệt nội bộ.');
      return;
    }
    setLocalError('');
    await onConfirm(password.trim());
  };

  const movieLines = contract.revision?.movieLines || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in">
      <div className="glass-card w-full max-w-lg rounded-2xl border border-[rgba(34,197,94,0.4)] p-6 space-y-5 shadow-2xl bg-[#0f0f13]">
        {/* HEADER */}
        <div className="flex items-start justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(34,197,94,0.15)] text-[#22c55e] border border-[rgba(34,197,94,0.3)] flex items-center justify-center shrink-0">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {mode === 'approve_and_activate' ? 'Duyệt & Kích hoạt phim vào rạp' : 'Ký duyệt & Kích hoạt phim vào rạp'}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Ký duyệt nội bộ nội bộ và tự động tạo phim vào danh mục rạp Galaxiad
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={working}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTRACT SUMMARY INFO */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)]">Mã hồ sơ:</span>
            <span className="font-mono font-bold text-[var(--text-primary)]">{contract.internalCode}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)]">Đơn vị đối tác:</span>
            <span className="font-semibold text-[var(--text-primary)]">{contract.distributorName || 'Chưa cập nhật'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)]">Số hợp đồng đối tác:</span>
            <span className="font-mono text-[var(--text-secondary)]">{contract.counterpartyContractNumber || 'Không có'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)]">Revision ký duyệt nội bộ:</span>
            <span className="font-mono text-[var(--accent)] font-bold">#{contract.revision?.revisionNumber ?? 1}</span>
          </div>
        </div>

        {/* MOVIES TO BE ACTIVATED */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-[var(--text-primary)] flex items-center justify-between">
            <span>Danh mục phim sẽ được thêm vào hệ thống rạp:</span>
            <span className="font-mono text-[#22c55e]">{movieLines.length} phim</span>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
            {movieLines.map((l, i) => (
              <div
                key={l.contractMovieLineId ?? i}
                className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[var(--text-primary)] truncate">
                    {l.vietnameseTitle || l.englishTitle || `Phim #${i + 1}`}
                  </div>
                  {l.englishTitle && l.vietnameseTitle && (
                    <div className="text-[11px] text-[var(--text-muted)] truncate">{l.englishTitle}</div>
                  )}
                  <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    {l.durationMinutes} phút · Rạp hưởng {l.cinemaSharePercent}% (Đối tác {l.distributorSharePercent}%)
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(34,197,94,0.15)] text-[#22c55e] font-semibold">
                    Kích hoạt ngay
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PASSWORD FORM */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Xác nhận mật khẩu tài khoản Admin để ký duyệt nội bộ:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                disabled={working}
                placeholder="Nhập mật khẩu Admin của bạn..."
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (localError) setLocalError('');
                }}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 pr-10 text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {localError && (
              <div className="text-xs text-[var(--danger)] mt-1.5 flex items-center gap-1">
                <AlertTriangle size={12} />
                <span>{localError}</span>
              </div>
            )}
            <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
              Chữ ký duyệt nội bộ nội bộ được mã hóa SHA-256 từ nội dung revision hợp đồng. Khi xác nhận, hệ thống sẽ tự động chuyển trạng thái hợp đồng sang <b className="text-emerald-400">Đang khai thác</b> và tạo phim trong Danh mục rạp.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
            <button
              type="button"
              disabled={working}
              onClick={onClose}
              className="btn btn-secondary px-4 py-2 text-xs font-medium"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={working || !password.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 bg-[#15803d] hover:bg-[#166534] text-white border border-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-sm"
            >
              {working ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Đang xử lý ký duyệt nội bộ & tạo phim...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Xác nhận Ký & Đưa vào rạp ngay</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 7. RETURN FOR REVISION MODAL
interface ReturnRevisionModalProps {
  isOpen: boolean;
  working: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

const ReturnRevisionModal: React.FC<ReturnRevisionModalProps> = ({
  isOpen,
  working,
  onClose,
  onConfirm
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do trả lại hồ sơ yêu cầu điều chỉnh.');
      return;
    }
    setError('');
    await onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in">
      <div className="glass-card w-full max-w-md rounded-2xl border border-[rgba(239,68,68,0.3)] p-6 space-y-4 shadow-2xl bg-[#0f0f13]">
        <div className="flex items-start justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(239,68,68,0.12)] text-[var(--danger)] border border-[rgba(239,68,68,0.3)] flex items-center justify-center shrink-0">
              <RotateCcw size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Yêu cầu chỉnh sửa hợp đồng</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Chuyển hồ sơ về trạng thái Bản nháp để người phụ trách cập nhật
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={working}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Lý do yêu cầu điều chỉnh:
            </label>
            <textarea
              autoFocus
              rows={3}
              disabled={working}
              placeholder="VD: Vui lòng điều chỉnh lại tỷ lệ phân chia doanh thu rạp thành 55%, và bổ sung định dạng IMAX..."
              value={reason}
              onChange={e => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--danger)] transition-colors resize-none"
            />
            {error && (
              <div className="text-xs text-[var(--danger)] mt-1 flex items-center gap-1">
                <AlertTriangle size={12} />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
            <button
              type="button"
              disabled={working}
              onClick={onClose}
              className="btn btn-secondary px-4 py-2 text-xs font-medium"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={working || !reason.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 bg-rose-700 hover:bg-rose-600 text-white border border-rose-600/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-sm"
            >
              {working ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <RotateCcw size={14} />
                  <span>Xác nhận trả lại hồ sơ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// SKELETON LOADER
const WorkspaceSkeleton = () => (
  <div className="max-w-[1400px] mx-auto p-6 space-y-6 animate-pulse">
    <div className="h-14 bg-[var(--bg-surface)] rounded-xl w-1/3" />
    <div className="grid grid-cols-3 gap-4">
      <div className="h-20 bg-[var(--bg-surface)] rounded-xl" />
      <div className="h-20 bg-[var(--bg-surface)] rounded-xl" />
      <div className="h-20 bg-[var(--bg-surface)] rounded-xl" />
    </div>
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-4 h-[600px] bg-[var(--bg-surface)] rounded-2xl" />
      <div className="col-span-8 h-[600px] bg-[var(--bg-surface)] rounded-2xl" />
    </div>
  </div>
);
