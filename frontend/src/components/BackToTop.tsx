import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      style={{
        position: 'fixed',
        bottom: 30,
        right: 88,
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--accent), #ff6b00)',
        border: 'none',
        color: '#000',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(255,138,0,0.3)',
        transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
        transform: visible ? 'scale(1) translateY(0)' : 'scale(0) translateY(20px)',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        zIndex: 10001,
      }}
      className="interactive"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 6px 28px rgba(255,138,0,0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,138,0,0.3)';
      }}
    >
      <ArrowUp size={22} style={{ strokeWidth: 2.5 }} />
    </button>
  );
};

export default BackToTop;
