import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ChevronLeft, Briefcase, Star, Send, Server, Megaphone, Monitor, 
  Users, Code, Palette, MapPin, Clock, DollarSign, Search
} from 'lucide-react';
import Header from '../../components/Header';

interface JobPosition {
  id: string;
  icon: React.ReactNode;
  titleKey: string;
  deptKey: string;
  locationKey: string;
  typeKey: string;
  salaryKey: string;
  descKey: string;
  tags: { label: string; color: string }[];
  deptValue: string;
}

const CareersPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState('all');
            
  const jobs: JobPosition[] = [
    {
      id: 'backend', deptValue: 'Engineering',
      icon: <Server size={24} />,
      titleKey: 'careers.backendTitle', deptKey: 'careers.backendDept',
      locationKey: 'careers.backendLocation', typeKey: 'careers.backendType',
      salaryKey: 'careers.backendSalary', descKey: 'careers.backendDesc',
      tags: [
        { label: 'Java', color: '#f89820' },
        { label: 'Spring Boot', color: '#6db33f' },
        { label: 'PostgreSQL', color: '#336791' },
        { label: 'Redis', color: '#dc382d' },
      ],
    },
    {
      id: 'marketing', deptValue: 'Marketing',
      icon: <Megaphone size={24} />,
      titleKey: 'careers.marketingTitle', deptKey: 'careers.marketingDept',
      locationKey: 'careers.marketingLocation', typeKey: 'careers.marketingType',
      salaryKey: 'careers.marketingSalary', descKey: 'careers.marketingDesc',
      tags: [
        { label: 'Digital Marketing', color: '#4285f4' },
        { label: 'Social Media', color: '#e4405f' },
        { label: 'SEO/SEM', color: '#00897b' },
        { label: 'Content', color: '#ff6d01' },
      ],
    },
    {
      id: 'frontend', deptValue: 'Engineering',
      icon: <Monitor size={24} />,
      titleKey: 'careers.frontendTitle', deptKey: 'careers.frontendDept',
      locationKey: 'careers.frontendLocation', typeKey: 'careers.frontendType',
      salaryKey: 'careers.frontendSalary', descKey: 'careers.frontendDesc',
      tags: [
        { label: 'React', color: '#61dafb' },
        { label: 'TypeScript', color: '#3178c6' },
        { label: 'Next.js', color: '#000000' },
        { label: 'Tailwind', color: '#06b6d4' },
      ],
    },
    {
      id: 'hr', deptValue: 'Human Resources',
      icon: <Users size={24} />,
      titleKey: 'careers.hrTitle', deptKey: 'careers.hrDept',
      locationKey: 'careers.hrLocation', typeKey: 'careers.hrType',
      salaryKey: 'careers.hrSalary', descKey: 'careers.hrDesc',
      tags: [
        { label: 'Recruitment', color: '#7c3aed' },
        { label: 'HR Operations', color: '#ec4899' },
        { label: 'Culture', color: '#f59e0b' },
      ],
    },
    {
      id: 'data', deptValue: 'Analytics',
      icon: <Code size={24} />,
      titleKey: 'careers.dataTitle', deptKey: 'careers.dataDept',
      locationKey: 'careers.dataLocation', typeKey: 'careers.dataType',
      salaryKey: 'careers.dataSalary', descKey: 'careers.dataDesc',
      tags: [
        { label: 'Python', color: '#3776ab' },
        { label: 'SQL', color: '#e38c00' },
        { label: 'Power BI', color: '#f2c811' },
        { label: 'ETL', color: '#00a98f' },
      ],
    },
    {
      id: 'design', deptValue: 'Design',
      icon: <Palette size={24} />,
      titleKey: 'careers.designTitle', deptKey: 'careers.designDept',
      locationKey: 'careers.designLocation', typeKey: 'careers.designType',
      salaryKey: 'careers.designSalary', descKey: 'careers.designDesc',
      tags: [
        { label: 'Figma', color: '#f24e1e' },
        { label: 'UI/UX', color: '#ff4081' },
        { label: 'Adobe Suite', color: '#ff0000' },
      ],
    },
  ];

  const departments = [
    { value: 'all', label: t('careers.allDepts', 'All') },
    { value: 'Engineering', label: t('careers.backendDept', 'Engineering') },
    { value: 'Marketing', label: t('careers.marketingDept', 'Marketing') },
    { value: 'Human Resources', label: t('careers.hrDept', 'Human Resources') },
    { value: 'Analytics', label: t('careers.dataDept', 'Analytics') },
    { value: 'Design', label: t('careers.designDept', 'Design') },
  ];

  const filteredJobs = activeFilter === 'all' ? jobs : jobs.filter(j => j.deptValue === activeFilter);

  
    
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <Header />
      <main className="page-enter" style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(88px, 12vw, 112px) clamp(16px, 4vw, 24px) clamp(48px, 6vw, 64px)' }}>
        {/* Back + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <button onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}
            className="interactive"><ChevronLeft size={22} /></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="amber-line" />
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{t('careers.title')}</h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{t('careers.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Why Work Cards */}
        <div className="page-enter-d1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { icon: <Briefcase size={18} />, title: t('careers.positions'), body: t('careers.positionsBody') },
            { icon: <Star size={18} />, title: t('careers.whyWork'), body: t('careers.whyWorkBody') },
            { icon: <Send size={18} />, title: t('careers.apply'), body: t('careers.applyBody') },
          ].map((v, i) => (
            <div key={i} style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'rgba(255,138,0,0.04)', border: '1px solid rgba(255,138,0,0.1)' }}>
              <div style={{ color: 'var(--accent)', marginBottom: 8 }}>{v.icon}</div>
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 4px' }}>{v.title}</h3>
              <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>{v.body}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Search size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('careers.filterTitle', 'Filter by Department')}
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {departments.map(dept => (
              <button
                key={dept.value}
                onClick={() => setActiveFilter(dept.value)}
                style={{
                  padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 600,
                  border: activeFilter === dept.value ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                  background: activeFilter === dept.value ? 'rgba(255,138,0,0.12)' : 'transparent',
                  color: activeFilter === dept.value ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {dept.label}
              </button>
            ))}
          </div>
        </div>

        {/* Job List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredJobs.map((job, idx) => (
            <div key={idx} className="page-enter-d1" style={{
              background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)', padding: '18px 20px',
              transition: 'all 0.25s ease', cursor: 'pointer',
            }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(255,138,0,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,138,0,0.08)', color: 'var(--accent)', flexShrink: 0 }}>
                  {job.icon}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 2px' }}>{t(job.titleKey)}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 8px' }}>{t(job.deptKey)}</p>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {t(job.descKey)}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8, fontSize: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-secondary)' }}><MapPin size={13} style={{ color: 'var(--accent)' }} /> {t(job.locationKey)}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-secondary)' }}><Clock size={13} style={{ color: 'var(--accent)' }} /> {t(job.typeKey)}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-secondary)' }}><DollarSign size={13} style={{ color: 'var(--accent)' }} /> {t(job.salaryKey)}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {job.tags.map((tag, i) => (
                      <span key={i} style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 10, fontWeight: 600, background: tag.color + '15', color: tag.color, border: '1px solid ' + tag.color + '30' }}>
                        {tag.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                  <button onClick={() => navigate('/careers/' + job.id)}
                    style={{ padding: '8px 18px', fontSize: 12, fontWeight: 700, background: 'var(--accent)', color: 'black', border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    className="interactive">{t('careers.applyNow', 'Apply Now')}</button>
                  <button onClick={() => navigate('/careers/' + job.id)}
                    style={{ padding: '6px 12px', fontSize: 11, color: 'var(--text-secondary)', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    className="interactive">{t('careers.viewDetail', 'View Details')}</button>
                </div>
              </div>
            </div>
          ))}
          {filteredJobs.length === 0 && (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)', fontSize: 14 }}>
              {t('careers.noJobs', 'No open positions in this department at the moment.')}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CareersPage;
