// src/contexts/ThemeContext.tsx
// Theme switching with localStorage persistence

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'modern';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Migration: if 'web3' was saved, automatically migrate to 'modern'
    let savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'web3') {
      savedTheme = 'modern';
    }
    return (savedTheme && ['light', 'dark', 'modern'].includes(savedTheme)) ? (savedTheme as Theme) : 'dark';
  });

  const setTheme = useCallback((newTheme: Theme) => {
    // Step 1: Add transitioning class to trigger CSS transitions
    document.documentElement.classList.add('theme-transitioning');

    // Step 2: Update theme state
    setThemeState(newTheme);

    // Step 3: Remove transitioning class after animation completes
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 700);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.remove('light', 'dark', 'modern', 'web3');
    document.documentElement.classList.add(theme);

    // Update color scheme for proper form controls
    if (theme === 'light') {
      document.documentElement.style.colorScheme = 'light';
    } else {
      document.documentElement.style.colorScheme = 'dark';
    }
  }, [theme]);

  const value: ThemeContextType = {
    theme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
