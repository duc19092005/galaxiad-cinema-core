import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, ChevronRight, FileSearch, FileText, Loader2, Plus, RefreshCw, ShieldCheck, Upload } from 'lucide-react';
import { contractApi } from '../../api/contractApi';
import { movieApi } from '../../api/movieApi';
import { facilitiesApi } from '../../api/facilitiesApi';
import { showError, showSuccess } from '../../utils/ToastUtils';
import type { MovieRequiredAge } from '../../types/movie.types';
import type { Cinema, MovieFormat } from '../../types/facilities.types';
import type { ContractDetail, ContractMovieLine, ContractStatus, ContractSummary } from '../../types/contract.types';

type Props = { mode: 'admin' | 'manager' };

const statusLabel: Record<ContractStatus, string> = {
  Draft: 'Bản nháp', PendingReview: 'Chờ duyệt', ReadyToSign: 'Sẵn sàng ký', Signed: 'Đã ký',
  Activated: 'Đang khai thác', Suspended: 'Đình chỉ', Terminated: 'Chấm dứt', Cancelled: 'Đã hủy',
};

const emptyLine = (): ContractMovieLine => ({
  vietnameseTitle: '', description: '', durationMinutes: 0, movieRequiredAgeId: '',
  licenseStartAt: '', licenseEndAt: '', cinemaScopeState: 'Unresolved', formatScopeState: 'Unresolved',
  cinemaIds: [], formatIds: [], cinemaSharePercent: 45, distributorSharePercent: 55,
  revenueBasis: 'TICKET_FINAL_PRICE_AFTER_REFUND', settlementCycle: 'Monthly', reviewed: false,
});

const getError = (error: unknown) => {
  const candidate = error as { response?: { data?: { message?: string; detail?: { message?: string } } } };
  return candidate.response?.data?.message ?? candidate.response?.data?.detail?.message ?? 'Không thể hoàn tất thao tác.';
};

export const ContractsWorkspace: React.FC<Props> = ({ mode }) => {
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [selected, setSelected] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [partner, setPartner] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [movieLines, setMovieLines] = useState<ContractMovieLine[]>([]);
  const [financialReviewed, setFinancialReviewed] = useState(false);
  const [ages, setAges] = useState<MovieRequiredAge[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [formats, setFormats] = useState<MovieFormat[]>([]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setContracts((await contractApi.list()).data ?? []); }
    catch (e) { setError(getError(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    void Promise.all([movieApi.getMovieRequiredAges(), facilitiesApi.getCinemaList(), movieApi.getMovieFormats()])
      .then(([a, c, f]) => { setAges(a.data ?? []); setCinemas(c.data ?? []); setFormats(f.data ?? []); })
      .catch(() => undefined);
  }, []);

  const open = async (id: string) => {
    setWorking(true);
    try {
      const detail = (await contractApi.get(id)).data;
      setSelected(detail); setMovieLines(detail.revision?.movieLines?.length ? detail.revision.movieLines : [emptyLine()]);
      setFinancialReviewed(detail.revision?.financialPolicyReviewed ?? false);
    } catch (e) { showError(getError(e)); }
    finally { setWorking(false); }
  };

  const create = async () => {
    setWorking(true);
    try {
      const result = await contractApi.create({ distributorName: partner || undefined, counterpartyContractNumber: contractNumber || undefined });
      setShowCreate(false); setPartner(''); setContractNumber(''); await load(); await open(result.data.id);
      showSuccess('Đã tạo hồ sơ hợp đồng nháp.');
    } catch (e) { showError(getError(e)); }
    finally { setWorking(false); }
  };

  const reloadSelected = async () => { if (selected) { await open(selected.contractId); await load(); } };
  const run = async (action: () => Promise<unknown>, message: string) => {
    setWorking(true);
    try { await action(); showSuccess(message); await reloadSelected(); }
    catch (e) { showError(getError(e)); }
    finally { setWorking(false); }
  };

  const action = async (name: string) => {
    if (!selected) return;
    if (name === 'approve') return run(() => contractApi.approve(selected.contractId), 'Đã duyệt nội dung và tài chính.');
    if (name === 'activate') return run(() => contractApi.activate(selected.contractId), 'Đã kích hoạt hợp đồng và áp dụng dữ liệu phim.');
    if (name === 'submit') return run(() => contractApi.submit(selected.contractId), 'Đã gửi hồ sơ cho Admin.');
    if (name === 'extract') return run(() => contractApi.extract(selected.contractId), 'Đã đưa tài liệu vào hàng đợi OCR/AI.');
    if (name === 'sign') {
      const password = window.prompt('Nhập lại mật khẩu Admin để ký đúng revision hiện tại:');
      if (password) return run(() => contractApi.sign(selected.contractId, password), 'Đã ghi nhận ký duyệt nội bộ.');
    }
    if (name === 'return') {
      const reason = window.prompt('Lý do trả hồ sơ:');
      if (reason) return run(() => contractApi.returnForRevision(selected.contractId, reason), 'Đã trả hồ sơ về bản nháp.');
    }
  };

  const saveReview = () => {
    if (!selected) return;
    void run(() => contractApi.review(selected.contractId, movieLines, financialReviewed), 'Đã lưu bản đối chiếu; chưa ghi vào danh mục phim.');
  };

  const counts = useMemo(() => ({
    review: contracts.filter(x => x.status === 'PendingReview' || x.status === 'ReadyToSign').length,
    active: contracts.filter(x => x.status === 'Activated').length,
    draft: contracts.filter(x => x.status === 'Draft').length,
  }), [contracts]);

  if (loading) return <WorkspaceSkeleton />;

  return (
    <div className="animate-in max-w-[1400px] mx-auto" style={{ display: 'grid', gap: 20 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: 'var(--accent)', font: "700 11px 'JetBrains Mono', monospace", letterSpacing: '.12em', textTransform: 'uppercase' }}>Contract control</div>
          <h1 style={{ margin: '7px 0 5px', fontSize: 30, letterSpacing: '-.035em' }}>{mode === 'admin' ? 'Hợp đồng phim' : 'Hồ sơ phim được giao'}</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', maxWidth: 650 }}>Tài liệu nguồn, dữ liệu OCR và dữ liệu đã xác nhận luôn được tách riêng theo revision.</p>
        </div>
        <button className="btn btn-primary active:scale-[0.98]" onClick={() => setShowCreate(true)}><Plus size={16} /> Tiếp nhận hợp đồng</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.7fr) minmax(250px,.7fr)', gap: 16 }} className="contract-metrics-grid">
        <div className="glass-card" style={{ padding: 22, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          <Metric label="Bản nháp" value={counts.draft} /><Metric label="Cần xử lý" value={counts.review} /><Metric label="Đang khai thác" value={counts.active} />
        </div>
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 18 }}>
          <div style={{ display: 'flex', gap: 9, alignItems: 'center', color: 'var(--text-secondary)' }}><ShieldCheck size={18} color="var(--accent)" /> Phim chỉ được tạo khi Admin kích hoạt.</div>
        </div>
      </div>

      {error && <div className="glass-card" style={{ padding: 16, color: 'var(--danger)', display: 'flex', gap: 10 }}><AlertTriangle size={18} />{error}<button className="btn btn-secondary" onClick={() => void load()}><RefreshCw size={14} /> Thử lại</button></div>}

      <div style={{ display: 'grid', gridTemplateColumns: selected ? 'minmax(310px,.75fr) minmax(0,1.55fr)' : '1fr', gap: 18 }} className="contract-work-grid">
        <section className="glass-card" style={{ overflow: 'hidden' }}>
          {contracts.length === 0 ? <EmptyState onCreate={() => setShowCreate(true)} /> : contracts.map((item, index) => (
            <motion.button layout key={item.contractId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }}
              onClick={() => void open(item.contractId)} style={{ width: '100%', border: 0, borderBottom: '1px solid var(--border-color)', background: selected?.contractId === item.contractId ? 'rgba(255,138,0,.08)' : 'transparent', padding: '17px 18px', textAlign: 'left', cursor: 'pointer', color: 'inherit' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>{item.internalCode}</strong><Status value={item.status} /></div>
              <div style={{ marginTop: 7, color: 'var(--text-secondary)', fontSize: 13 }}>{item.distributorName || 'Đối tác chưa xác định'}</div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 11 }}><span>Revision {item.currentRevisionNumber}</span><ChevronRight size={15} /></div>
            </motion.button>
          ))}
        </section>
        {selected && <ContractDetailPanel detail={selected} movieLines={movieLines} setMovieLines={setMovieLines} ages={ages} cinemas={cinemas} formats={formats} financialReviewed={financialReviewed} setFinancialReviewed={setFinancialReviewed} file={file} setFile={setFile} working={working} onUpload={() => file && run(() => contractApi.upload(selected.contractId, file), 'Đã lưu file nguồn bất biến.')} onAction={action} onSaveReview={saveReview} />}
      </div>

      {showCreate && <div className="modal-overlay" onMouseDown={() => setShowCreate(false)}><div className="modal-content glass-card" onMouseDown={e => e.stopPropagation()} style={{ maxWidth: 520, padding: 26 }}><h2 style={{ marginTop: 0 }}>Tiếp nhận hợp đồng</h2><Field label="Đối tác (có thể để trống trước OCR)"><input className="input" value={partner} onChange={e => setPartner(e.target.value)} /></Field><Field label="Số hợp đồng phía đối tác (optional)"><input className="input" value={contractNumber} onChange={e => setContractNumber(e.target.value)} /></Field><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}><button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Hủy</button><button className="btn btn-primary" onClick={() => void create()} disabled={working}>Tạo hồ sơ nháp</button></div></div></div>}

      <style>{`@media(max-width:900px){.contract-work-grid,.contract-metrics-grid{grid-template-columns:1fr!important}.contract-review-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
};

const ContractDetailPanel = ({ detail, movieLines, setMovieLines, ages, cinemas, formats, financialReviewed, setFinancialReviewed, file, setFile, working, onUpload, onAction, onSaveReview }: {
  detail: ContractDetail; movieLines: ContractMovieLine[]; setMovieLines: React.Dispatch<React.SetStateAction<ContractMovieLine[]>>; ages: MovieRequiredAge[]; cinemas: Cinema[]; formats: MovieFormat[];
  financialReviewed: boolean; setFinancialReviewed: (v: boolean) => void; file: File | null; setFile: (v: File | null) => void; working: boolean; onUpload: () => void; onAction: (name: string) => void; onSaveReview: () => void;
}) => {
  const update = (index: number, patch: Partial<ContractMovieLine>) => setMovieLines(lines => lines.map((line, i) => i === index ? { ...line, ...patch } : line));
  return <section style={{ display: 'grid', gap: 16 }}>
    <div className="glass-card" style={{ padding: 20 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><div><h2 style={{ margin: 0 }}>{detail.internalCode}</h2><p style={{ margin: '5px 0 0', color: 'var(--text-secondary)' }}>{detail.distributorName || 'Đối tác chờ nhận diện'} · revision {detail.currentRevisionNumber}</p></div><Status value={detail.status} /></div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>{detail.allowedActions.map(name => <button key={name} disabled={working} className={name === 'activate' || name === 'sign' ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => onAction(name)}>{actionText(name)}</button>)}</div>
    </div>
    {detail.status === 'Draft' && <div className="glass-card" style={{ padding: 20 }}><h3 style={{ marginTop: 0 }}>Tài liệu nguồn</h3><div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}><input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e => setFile(e.target.files?.[0] ?? null)} /><button className="btn btn-secondary" disabled={!file || working} onClick={onUpload}><Upload size={15} /> Upload</button></div><div style={{ marginTop: 13, display: 'grid', gap: 7 }}>{detail.revision?.documents.map(d => <button className="btn btn-secondary" key={d.contractDocumentId} onClick={() => void contractApi.openDocument(detail.contractId, d.contractDocumentId, d.fileName)}><FileText size={14} /> {d.fileName}</button>)}</div></div>}
    <div className="contract-review-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,.72fr) minmax(0,1.28fr)', gap: 16 }}>
      <div className="glass-card" style={{ padding: 18, minHeight: 280 }}><h3 style={{ marginTop: 0 }}><FileSearch size={17} style={{ display: 'inline', marginRight: 8 }} />Văn bản OCR</h3><pre style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: 12, maxHeight: 560, overflow: 'auto' }}>{detail.revision?.extractedText || 'Chưa có kết quả. Upload tài liệu rồi chọn Đọc & phân tích.'}</pre></div>
      <div style={{ display: 'grid', gap: 14 }}>{movieLines.map((line, index) => <MovieLineEditor key={line.contractMovieLineId ?? index} line={line} index={index} update={update} ages={ages} cinemas={cinemas} formats={formats} />)}
        {detail.status === 'Draft' && <button className="btn btn-secondary" onClick={() => setMovieLines(lines => [...lines, emptyLine()])}><Plus size={14} /> Thêm dòng phim trong phụ lục</button>}
        <label style={{ display: 'flex', gap: 9, alignItems: 'center' }}><input type="checkbox" checked={financialReviewed} onChange={e => setFinancialReviewed(e.target.checked)} /> Đã đối chiếu cơ sở chia, tỷ lệ, chu kỳ và xử lý hoàn tiền</label>
        {detail.status === 'Draft' && <button className="btn btn-primary" disabled={working} onClick={onSaveReview}><Check size={15} /> Lưu đối chiếu revision</button>}
      </div>
    </div>
  </section>;
};

const MovieLineEditor = ({ line, index, update, ages, cinemas, formats }: { line: ContractMovieLine; index: number; update: (i: number, p: Partial<ContractMovieLine>) => void; ages: MovieRequiredAge[]; cinemas: Cinema[]; formats: MovieFormat[] }) => <div className="glass-card" style={{ padding: 20, display: 'grid', gap: 13 }}><strong>Phim {index + 1}</strong><Field label="Tên phim tiếng Việt"><input className="input" value={line.vietnameseTitle} onChange={e => update(index, { vietnameseTitle: e.target.value })} /></Field><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><Field label="Thời lượng (phút)"><input className="input" type="number" value={line.durationMinutes || ''} onChange={e => update(index, { durationMinutes: Number(e.target.value) })} /></Field><Field label="Phân loại đã xác nhận"><select className="input" value={line.movieRequiredAgeId} onChange={e => update(index, { movieRequiredAgeId: e.target.value })}><option value="">Chọn phân loại</option>{ages.map(age => <option key={age.movieRequiredAgeSymbolId} value={age.movieRequiredAgeSymbolId}>{age.movieRequiredAgeSymbol}</option>)}</select></Field></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><Field label="Bắt đầu quyền"><input className="input" type="datetime-local" value={localValue(line.licenseStartAt)} onChange={e => update(index, { licenseStartAt: new Date(e.target.value).toISOString() })} /></Field><Field label="Kết thúc quyền"><input className="input" type="datetime-local" value={localValue(line.licenseEndAt)} onChange={e => update(index, { licenseEndAt: new Date(e.target.value).toISOString() })} /></Field></div><ScopeEditor label="Phạm vi rạp" value={line.cinemaScopeState} ids={line.cinemaIds} options={cinemas.map(x => ({ id: x.cinemaId, name: x.cinemaName }))} onState={v => update(index, { cinemaScopeState: v })} onIds={v => update(index, { cinemaIds: v })} /><ScopeEditor label="Phạm vi định dạng" value={line.formatScopeState} ids={line.formatIds} options={formats.map(x => ({ id: x.formatId, name: x.formatName }))} onState={v => update(index, { formatScopeState: v })} onIds={v => update(index, { formatIds: v })} /><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><Field label="Rạp hưởng (%)"><input className="input" type="number" value={line.cinemaSharePercent} onChange={e => update(index, { cinemaSharePercent: Number(e.target.value), distributorSharePercent: 100 - Number(e.target.value) })} /></Field><Field label="Đối tác hưởng (%)"><input className="input" value={line.distributorSharePercent} readOnly /></Field></div><label style={{ display: 'flex', gap: 9 }}><input type="checkbox" checked={line.reviewed} onChange={e => update(index, { reviewed: e.target.checked })} /> Tôi đã đối chiếu dòng này với tài liệu nguồn</label></div>;

const ScopeEditor = ({ label, value, ids, options, onState, onIds }: { label: string; value: ContractMovieLine['cinemaScopeState']; ids: string[]; options: { id: string; name: string }[]; onState: (v: ContractMovieLine['cinemaScopeState']) => void; onIds: (v: string[]) => void }) => <Field label={label}><select className="input" value={value} onChange={e => onState(e.target.value as ContractMovieLine['cinemaScopeState'])}><option value="Unresolved">Chưa rõ — chặn gửi duyệt</option><option value="NoAdditionalRestrictionConfirmed">Đã xác nhận không giới hạn thêm</option><option value="Specified">Có giới hạn cụ thể</option></select>{value === 'Specified' && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 8 }}>{options.map(option => <label key={option.id} className="badge" style={{ padding: '7px 9px' }}><input type="checkbox" checked={ids.includes(option.id)} onChange={e => onIds(e.target.checked ? [...ids, option.id] : ids.filter(id => id !== option.id))} /> {option.name}</label>)}</div>}</Field>;

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => <label style={{ display: 'grid', gap: 7, fontSize: 12, color: 'var(--text-secondary)' }}><span>{label}</span>{children}</label>;
const Metric = ({ label, value }: { label: string; value: number }) => <div><div style={{ font: "800 27px 'JetBrains Mono', monospace" }}>{value}</div><div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{label}</div></div>;
const Status = ({ value }: { value: ContractStatus }) => <span className="badge" style={{ color: value === 'Activated' ? 'var(--success)' : 'var(--accent)' }}>{statusLabel[value] ?? value}</span>;
const actionText = (name: string) => ({ extract: 'Đọc & phân tích', submit: 'Gửi Admin', approve: 'Duyệt nội dung', return: 'Trả lại', sign: 'Ký hợp đồng', activate: 'Xác nhận & kích hoạt' }[name] ?? name);
const localValue = (value: string) => value ? value.slice(0, 16) : '';
const EmptyState = ({ onCreate }: { onCreate: () => void }) => <div className="state-center" style={{ minHeight: 340 }}><FileText size={42} style={{ opacity: .35 }} /><h3>Chưa có hồ sơ hợp đồng</h3><p style={{ color: 'var(--text-muted)', maxWidth: 360, textAlign: 'center' }}>Tạo hồ sơ nháp, upload tài liệu nhận từ đối tác rồi chạy OCR/AI.</p><button className="btn btn-primary" onClick={onCreate}><Plus size={15} /> Tiếp nhận hồ sơ</button></div>;
const WorkspaceSkeleton = () => <div style={{ display: 'grid', gap: 14 }}>{[110, 180, 260].map(height => <div key={height} className="glass-card" style={{ height, opacity: .42 }}><Loader2 size={18} style={{ margin: 18, animation: 'spin 1s linear infinite' }} /></div>)}</div>;
