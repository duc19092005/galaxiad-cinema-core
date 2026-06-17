import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ChevronLeft, Server, Megaphone, Monitor, Users, Code, Palette,
  MapPin, Clock, DollarSign, Briefcase, CheckCircle, Upload, FileText, X
} from 'lucide-react';
import Header from '../../components/Header';

const jobIcons: Record<string, React.ReactNode> = {
  backend: <Server size={28} />,
  marketing: <Megaphone size={28} />,
  frontend: <Monitor size={28} />,
  hr: <Users size={28} />,
  data: <Code size={28} />,
  design: <Palette size={28} />,
};

const jobTags: Record<string, { label: string; color: string }[]> = {
  backend: [
    { label: 'Java', color: '#f89820' }, { label: 'Spring Boot', color: '#6db33f' },
    { label: 'PostgreSQL', color: '#336791' }, { label: 'Redis', color: '#dc382d' },
  ],
  marketing: [
    { label: 'Digital Marketing', color: '#4285f4' }, { label: 'Social Media', color: '#e4405f' },
    { label: 'SEO/SEM', color: '#00897b' }, { label: 'Content', color: '#ff6d01' },
  ],
  frontend: [
    { label: 'React', color: '#61dafb' }, { label: 'TypeScript', color: '#3178c6' },
    { label: 'Next.js', color: '#000000' }, { label: 'Tailwind', color: '#06b6d4' },
  ],
  hr: [
    { label: 'Recruitment', color: '#7c3aed' }, { label: 'HR Operations', color: '#ec4899' },
    { label: 'Culture', color: '#f59e0b' },
  ],
  data: [
    { label: 'Python', color: '#3776ab' }, { label: 'SQL', color: '#e38c00' },
    { label: 'Power BI', color: '#f2c811' }, { label: 'ETL', color: '#00a98f' },
  ],
  design: [
    { label: 'Figma', color: '#f24e1e' }, { label: 'UI/UX', color: '#ff4081' },
    { label: 'Adobe Suite', color: '#ff0000' },
  ],
};

const CareerDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { jobId } = useParams<{ jobId: string }>();
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', coverLetter: '' });

  if (!jobId || !jobIcons[jobId]) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <Header />
        <main style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(88px, 12vw, 112px) clamp(16px, 4vw, 24px)', textAlign: 'center' }}>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>Job not found</p>
          <button onClick={() => navigate('/careers')} style={{ marginTop: 16, padding: '10px 24px', background: 'var(--accent)', color: 'black', border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontWeight: 700 }}>{t('careers.backToJobs', 'Back to Careers')}</button>
        </main>
      </div>
    );
  }

  const icon = jobIcons[jobId];
  const tags = jobTags[jobId] || [];

  const metaStyle = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' };
  const h3Style = { fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: 'var(--accent)' as string };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccess(true);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setCvFile(file);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <Header />
      <main className="page-enter" style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(88px, 12vw, 112px) clamp(16px, 4vw, 24px) clamp(48px, 6vw, 64px)' }}>
        {/* Back */}
        <button onClick={() => navigate('/careers')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, marginBottom: 24, padding: 0 }}>
          <ChevronLeft size={16} /> {t('careers.backToJobs', 'Back to Careers')}
        </button>

        {/* Job Header Card */}
        <div className="page-enter-d1" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', padding: 'clamp(24px, 4vw, 36px)', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,138,0,0.08)', color: 'var(--accent)', flexShrink: 0 }}>
              {icon}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.02em' }}>{t(`careers.${jobId}Title`)}</h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>{t(`careers.${jobId}Dept`)}</p>
            </div>
            <button onClick={() => setShowApplyForm(!showApplyForm)}
              style={{ padding: '12px 28px', fontSize: 14, fontWeight: 700, background: 'var(--accent)', color: 'black', border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer', whiteSpace: 'nowrap', alignSelf: 'flex-start' }}
              className="interactive">{t('careers.applyNow', 'Apply Now')}</button>
          </div>

          {/* Meta Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            <div style={metaStyle}><MapPin size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} /><span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t(`careers.${jobId}Location`)}</span></div>
            <div style={metaStyle}><Clock size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} /><span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t(`careers.${jobId}Type`)}</span></div>
            <div style={metaStyle}><DollarSign size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} /><span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t(`careers.${jobId}Salary`)}</span></div>
            <div style={metaStyle}><Briefcase size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} /><span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t(`careers.${jobId}Dept`)}</span></div>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
            {tags.map((tag, i) => (
              <span key={i} style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 600, background: tag.color + '15', color: tag.color, border: '1px solid ' + tag.color + '30' }}>{tag.label}</span>
            ))}
          </div>
        </div>

        {/* Description + Requirements + Benefits */}
        <div style={{ display: 'grid', gap: 16 }}>
          {/* About Role */}
          <div className="page-enter-d1" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '20px 24px' }}>
            <h3 style={h3Style}>{t('careers.aboutRole', 'About This Role')}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>{t(`careers.${jobId}Desc`)}</p>
          </div>

          {/* Requirements */}
          <div className="page-enter-d1" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '20px 24px' }}>
            <h3 style={h3Style}>{t('careers.requirements', 'Requirements')}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>{t(`careers.${jobId}Reqs`)}</p>
          </div>

          {/* Benefits */}
          <div className="page-enter-d1" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '20px 24px' }}>
            <h3 style={h3Style}>{t('careers.benefits', 'Benefits & Perks')}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>{t(`careers.${jobId}Benefits`)}</p>
          </div>
        </div>

        {/* Apply Button */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button onClick={() => setShowApplyForm(!showApplyForm)}
            style={{ padding: '14px 40px', fontSize: 16, fontWeight: 700, background: 'var(--accent)', color: 'black', border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer' }}
            className="interactive">{t('careers.applyNow', 'Apply Now')}</button>
        </div>
      </main>

      {/* Apply Modal */}
      {showApplyForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: 16,
        }} onClick={() => { setShowApplyForm(false); setShowSuccess(false); }}>
          <div className="page-enter-d1" style={{
            maxWidth: 560, width: '100%', maxHeight: '90vh', overflow: 'auto',
            background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-color)', padding: 'clamp(24px, 4vw, 36px)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{t('careers.applyTitle', 'Apply for')}</h2>
                <p style={{ fontSize: 13, color: 'var(--accent)', margin: '4px 0 0', fontWeight: 500 }}>{t(`careers.${jobId}Title`)}</p>
              </div>
              <button onClick={() => { setShowApplyForm(false); setShowSuccess(false); }}
                style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
            </div>

            {showSuccess ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(76,175,80,0.12)', color: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><CheckCircle size={32} /></div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>{t('careers.successTitle', 'Application Submitted!')}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 24px' }}>{t('careers.successBody', 'Thank you! We will review your application and get back to you within 5-7 business days.')}</p>
                <button onClick={() => { setShowApplyForm(false); setShowSuccess(false); }}
                  style={{ padding: '10px 28px', fontSize: 13, fontWeight: 700, background: 'var(--accent)', color: 'black', border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer' }} className="interactive">Close</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>{t('careers.fullName', 'Full Name')} *</label>
                    <input required value={formData.fullName} onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Email *</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>{t('careers.phone', 'Phone Number')}</label>
                    <input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>{t('careers.cvUpload', 'Upload CV (PDF, DOC, DOCX)')} *</label>
                    <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                      style={{ border: '2px dashed ' + (isDragging ? 'var(--accent)' : 'var(--border-color)'), borderRadius: 'var(--radius-md)', padding: 24, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: isDragging ? 'rgba(255,138,0,0.04)' : 'transparent' }}
                      onClick={() => document.getElementById('cv-detail-input')?.click()}>
                      <input id="cv-detail-input" type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) setCvFile(f); }} />
                      {cvFile ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <FileText size={20} style={{ color: 'var(--accent)' }} />
                          <span style={{ fontSize: 13 }}>{cvFile.name}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>({(cvFile.size / 1024).toFixed(1)} KB)</span>
                        </div>
                      ) : (
                        <><Upload size={24} style={{ color: 'var(--text-secondary)', marginBottom: 8 }} />
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>{t('careers.dragDrop', 'or drag and drop')}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '4px 0 0', opacity: 0.7 }}>{t('careers.fileLimit', 'Max file size: 10MB')}</p></>
                      )}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>{t('careers.coverLetter', 'Cover Letter (optional)')}</label>
                    <textarea rows={4} value={formData.coverLetter} onChange={e => setFormData(p => ({ ...p, coverLetter: e.target.value }))}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  </div>
                  <button type="submit" style={{ padding: '12px 24px', fontSize: 14, fontWeight: 700, background: 'var(--accent)', color: 'black', border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer', width: '100%', marginTop: 8 }} className="interactive">{t('careers.submit', 'Submit Application')}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerDetailPage;
