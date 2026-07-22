import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * Align with ChatBot FAB.
 * Mobile: sit ABOVE BottomNavBar (~76px) + 12px gap.
 * Desktop (md+): bottom nav hidden → bottom 24px.
 * Horizontal: left of chat with 12px gap.
 */
const FAB_SIZE = 52;
const FAB_SIZE_SM = 48;
const FAB_RIGHT = 24;
const FAB_RIGHT_SM = 16;
const FAB_GAP = 12;
const BACK_RIGHT = FAB_RIGHT + FAB_SIZE + FAB_GAP; // 88
const BACK_RIGHT_SM = FAB_RIGHT_SM + FAB_SIZE_SM + FAB_GAP; // 76
/** BottomNavBar ≈ 76px (see App.tsx body padding-bottom) */
const MOBILE_NAV_H = 76;
const MOBILE_FAB_GAP = 12;

const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 200);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        .back-to-top-btn {
          position: fixed !important;
          right: ${BACK_RIGHT}px !important;
          /* Default = mobile: clear bottom nav */
          bottom: calc(${MOBILE_NAV_H}px + ${MOBILE_FAB_GAP}px + env(safe-area-inset-bottom, 0px)) !important;
          width: ${FAB_SIZE}px !important;
          height: ${FAB_SIZE}px !important;
          z-index: 9998 !important;
        }
        @media (min-width: 768px) {
          .back-to-top-btn {
            bottom: 24px !important;
            right: ${BACK_RIGHT}px !important;
            width: ${FAB_SIZE}px !important;
            height: ${FAB_SIZE}px !important;
          }
        }
        @media (max-width: 480px) {
          .back-to-top-btn {
            right: ${BACK_RIGHT_SM}px !important;
            width: ${FAB_SIZE_SM}px !important;
            height: ${FAB_SIZE_SM}px !important;
            bottom: calc(${MOBILE_NAV_H}px + ${MOBILE_FAB_GAP}px + env(safe-area-inset-bottom, 0px)) !important;
          }
        }
        body.chatbot-open .back-to-top-btn {
          display: none !important;
        }
      `}}
      />

      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className="interactive back-to-top-btn"
        style={{
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent), #ff6b00)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#000',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 0 rgba(255,255,255,0.18) inset, 0 8px 20px rgba(0,0,0,0.28)',
          transition: 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s ease',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.6) translateY(12px)',
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        <ArrowUp size={20} style={{ strokeWidth: 2.5 }} />
      </button>
    </>
  );
};

export default BackToTop;
