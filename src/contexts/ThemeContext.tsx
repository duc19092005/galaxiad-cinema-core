// src/contexts/ThemeContext.tsx
// Simplified: dark mode only - no toggling needed

import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

export type Theme = 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Always dark mode
  document.documentElement.classList.add('dark');
  document.documentElement.style.colorScheme = 'dark';

  const value: ThemeContextType = {
    theme: 'dark',
    setTheme: () => {}, // no-op - always dark
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
