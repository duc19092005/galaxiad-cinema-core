import { motion, type Variants } from 'framer-motion';
import React from 'react';

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    x: 40,
    scale: 0.99,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.32,
      ease: [0.215, 0.61, 0.355, 1], // Cubic bezier for smooth deceleration
    },
  },
  exit: {
    opacity: 0,
    x: -30,
    scale: 0.99,
    transition: {
      duration: 0.22,
      ease: [0.55, 0.055, 0.675, 0.19], // Cubic bezier for acceleration out
    },
  },
};

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ 
        width: '100%',
        position: 'relative',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
