// src/utils/themeUtils.ts
import type { Theme } from '../contexts/ThemeContext';

export const getThemeClasses = {
  // Background colors
  bg: (theme: Theme) => {
    if (theme === 'dark') return 'bg-black';
    if (theme === 'modern') return 'min-h-screen bg-[#020617] relative sm:before:absolute sm:before:top-[-20%] sm:before:left-[-10%] sm:before:w-[50%] sm:before:h-[50%] sm:before:rounded-full sm:before:bg-indigo-500/20 sm:before:blur-[120px] sm:before:z-0 sm:after:absolute sm:after:bottom-[-20%] sm:after:right-[-10%] sm:after:w-[40%] sm:after:h-[40%] sm:after:rounded-full sm:after:bg-cyan-500/10 sm:after:blur-[100px] sm:after:z-0 overflow-x-hidden';
    return 'bg-gray-50';
  },

  bgCard: (theme: Theme) => {
    if (theme === 'dark') return 'bg-gray-900';
    if (theme === 'modern') return 'bg-[#0f172a]/40 backdrop-blur-2xl border border-indigo-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)] ring-1 ring-white/5';
    return 'bg-white';
  },

  bgSecondary: (theme: Theme) => {
    if (theme === 'dark') return 'bg-gray-800';
    if (theme === 'modern') return 'bg-[#0f172a]/30 backdrop-blur-xl border border-indigo-500/20 shadow-sm';
    return 'bg-gray-50';
  },

  // Text colors
  text: (theme: Theme) => {
    if (theme === 'dark') return 'text-white';
    if (theme === 'modern') return 'text-white';
    return 'text-gray-900 dark:text-white modern:text-white';
  },

  textSecondary: (theme: Theme) => {
    if (theme === 'dark') return 'text-gray-400';
    if (theme === 'modern') return 'text-white font-medium';
    return 'text-gray-600';
  },

  textMuted: (theme: Theme) => {
    if (theme === 'dark') return 'text-gray-500';
    if (theme === 'modern') return 'text-white/60';
    return 'text-gray-500';
  },

  // Border colors
  border: (theme: Theme) => {
    if (theme === 'dark') return 'border-gray-800';
    if (theme === 'modern') return 'border-indigo-500/20 shadow-sm';
    return 'border-gray-200';
  },

  borderHover: (theme: Theme) => {
    if (theme === 'dark') return 'hover:border-red-600';
    if (theme === 'modern') return 'hover:border-cyan-300 shadow-md';
    return 'hover:border-red-600';
  },

  // Header/Background overlay
  headerBg: (theme: Theme) => {
    if (theme === 'dark') return 'bg-black/80 border-gray-800';
    if (theme === 'modern') return 'bg-[#0E0A20]/80 border-slate-800/60/80 shadow-lg';
    return 'bg-white/80 border-gray-200';
  },

  // Sidebar
  sidebarBg: (theme: Theme) => {
    if (theme === 'dark') return 'bg-gray-900 border-gray-800';
    if (theme === 'modern') return 'bg-[#0f172a]/40 backdrop-blur-2xl border-slate-800/60 shadow-2xl';
    return 'bg-white border-gray-200';
  },

  // Button styles
  buttonPrimary: (theme: Theme) => {
    if (theme === 'dark') return 'bg-red-600 hover:bg-red-700 text-white';
    if (theme === 'modern') return 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]';
    return 'bg-red-600 hover:bg-red-700 text-white';
  },

  buttonSecondary: (theme: Theme) => {
    if (theme === 'dark') return 'bg-gray-800 hover:bg-gray-700 text-gray-300';
    if (theme === 'modern') return 'bg-slate-800/60 hover:bg-slate-700/60 text-white font-medium border border-slate-800/60';
    return 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:text-gray-300 modern:text-gray-200';
  },

  // Logo gradient
  logoGradient: (theme: Theme) => {
    if (theme === 'modern') return 'text-slate-100 font-semibold tracking-wide';
    return 'text-red-600';
  },
};
