// src/features/public/HelpPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ChevronLeft, Search, ChevronDown, MessageCircle, 
  Mail, Phone, BookOpen, HelpCircle, FileText,
  ExternalLink
} from 'lucide-react';
import Header from '../../components/Header';

interface FaqItem {
  q: string;
  a: string;
  category: string;
}

const FAQS: FaqItem[] = [
  { q: 'help.faq1Q', a: 'help.faq1A', category: 'help.catBooking' },
  { q: 'help.faq2Q', a: 'help.faq2A', category: 'help.catBooking' },
  { q: 'help.faq3Q', a: 'help.faq3A', category: 'help.catPayment' },
  { q: 'help.faq4Q', a: 'help.faq4A', category: 'help.catAccount' },
  { q: 'help.faq5Q', a: 'help.faq5A', category: 'help.catAccount' },
  { q: 'help.faq6Q', a: 'help.faq6A', category: 'help.catPayment' },
  { q: 'help.faq7Q', a: 'help.faq7A', category: 'help.catTechnical' },
  { q: 'help.faq8Q', a: 'help.faq8A', category: 'help.catTechnical' },
];

const HelpPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const filteredFaqs = FAQS.filter(faq => {
    if (!searchQuery.trim()) return true;
    const q = t(faq.q).toLowerCase();
    const a = t(faq.a).toLowerCase();
    const query = searchQuery.toLowerCase();
    return q.includes(query) || a.includes(query);
  });

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <Header />

      <main className="page-enter" style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(88px, 12vw, 112px) clamp(16px, 4vw, 24px) clamp(48px, 6vw, 64px)' }}>
        {/* Back + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44, borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', cursor: 'pointer',
            }}
            className="interactive"
          >
            <ChevronLeft size={22} />
          </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="amber-line" />
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{t('help.title', 'Help Center')}</h1>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  {t('help.subtitle', 'Find answers, get support, and explore our cinema guides')}
                </p>
              </div>
            </div>
        </div>

        {/* Search */}
        <div className="page-enter-d1" style={{
          position: 'relative', marginBottom: 36,
        }}>
          <Search size={18} style={{
            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-secondary)', pointerEvents: 'none',
          }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('help.searchPlaceholder', 'Search for help topics...')}
            style={{
              width: '100%', padding: '16px 16px 16px 48px',
              borderRadius: 'var(--radius-xl)', fontSize: 15,
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Quick Links Cards */}
        <div className="page-enter-d2" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
          gap: 16, marginBottom: 40,
        }}>
          {[
            { icon: <BookOpen size={22} />, label: t('help.guides', 'Guides'), desc: t('help.guidesDesc', 'Step-by-step tutorials'), color: '#3b82f6' },
            { icon: <MessageCircle size={22} />, label: t('help.liveChat', 'Live Chat'), desc: t('help.liveChatDesc', 'Talk to an agent'), color: '#10b981' },
            { icon: <Mail size={22} />, label: t('help.emailUs', 'Email Us'), desc: t('help.emailUsDesc', 'We reply in 24h'), color: '#f59e0b' },
            { icon: <Phone size={22} />, label: t('help.callUs', 'Call Us'), desc: t('help.callUsDesc', '1800-123-456'), color: '#ef4444' },
          ].map((card, i) => (
            <div
              key={i}
              className={`interactive page-enter-d${i+1}`}
              style={{
                padding: 20, borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: `${card.color}15`, color: card.color,
                marginBottom: 12,
              }}>
                {card.icon}
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px' }}>{card.label}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>{card.desc}</p>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <HelpCircle size={20} style={{ color: 'var(--accent)' }} />
            {t('help.faqTitle', 'Frequently Asked Questions')}
          </h2>

          {filteredFaqs.length === 0 ? (
            <div style={{
              padding: 48, textAlign: 'center', borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
            }}>
              <FileText size={40} style={{ opacity: 0.2, color: 'var(--text-secondary)', marginBottom: 12 }} />
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                {t('help.noResults', 'No results found. Try a different search term.')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredFaqs.map((faq, i) => (
                <div
                  key={i}
                  className={`page-enter-d${(i % 5) + 1}${openFaqIndex === i ? ' faq-item-active' : ''}`}
                  style={{
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--bg-elevated)',
                    border: openFaqIndex === i ? '1px solid rgba(255,138,0,0.2)' : '1px solid var(--border-color)',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  <button
                    onClick={() => toggleFaq(i)}
                    style={{
                      width: '100%', padding: '16px 20px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 12, cursor: 'pointer',
                      background: 'none', border: 'none',
                      color: 'var(--text-primary)', fontSize: 14, fontWeight: 600,
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ flex: 1 }}>{t(faq.q)}</span>
                    <ChevronDown
                      size={16}
                      style={{
                        color: 'var(--text-secondary)', flexShrink: 0,
                        transition: 'transform 0.3s ease',
                        transform: openFaqIndex === i ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>
                  <div
                    className={openFaqIndex === i ? 'faq-answer-open' : ''}
                    style={{
                      maxHeight: openFaqIndex === i ? 300 : 0,
                      overflow: 'hidden',
                      transition: 'max-height 0.35s cubic-bezier(0.16,1,0.3,1)',
                      opacity: openFaqIndex === i ? 1 : 0,
                      transitionProperty: 'max-height, opacity',
                    }}
                  >
                    <p style={{
                      margin: 0, padding: '0 20px 16px',
                      fontSize: 13, color: 'var(--text-secondary)',
                      lineHeight: 1.7,
                    }}>
                      {t(faq.a)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="page-enter-d3" style={{
          padding: 24, borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>
              {t('help.stillNeedHelp', 'Still need help?')}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              {t('help.stillNeedHelpDesc', 'Our support team is here 24/7 to assist you.')}
            </p>
          </div>
          <button
            onClick={() => navigate('/contact')}
            className="interactive"
            style={{
              padding: '12px 28px', fontSize: 14, fontWeight: 700,
              background: 'var(--accent)', color: 'black', border: 'none',
              borderRadius: 'var(--radius-full)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <ExternalLink size={16} />
            {t('help.contactSupport', 'Contact Support')}
          </button>
        </div>
      </main>
    </div>
  );
};

export default HelpPage;
