import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  return (
    <div style={{
      width: '100%',
      position: 'relative',
      minHeight: '100vh',
      overflowX: 'hidden',
    }}>
      {children}
    </div>
  );
};

export default PageTransition;
