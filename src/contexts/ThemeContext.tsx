// src/contexts/ThemeContext.tsx
// Simplified: toggles .dark class on <html>, persists to localStorage

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'modern';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'cinema-theme';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (saved && ['light', 'dark', 'modern'].includes(saved)) return saved;
    return 'dark'; // default
  });

  // Apply theme classes to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'modern');
    root.classList.add(theme);
    // .modern extends .dark
    if (theme === 'modern' || theme === 'dark') {
      root.classList.add('dark');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    root.style.colorScheme = theme === 'light' ? 'light' : 'dark';
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    // Add transitioning class for smooth animation
    document.documentElement.classList.add('no-theme-transition');
    setThemeState(newTheme);
    // Remove the no-transition class after a microtask to let the DOM settle
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('no-theme-transition');
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
