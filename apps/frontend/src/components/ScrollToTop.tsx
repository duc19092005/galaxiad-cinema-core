import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SCROLL_STORAGE_KEY = 'cinema_scroll_positions';
const SAVED_PATHS = ['/', '/home'];

function getScrollPositions(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(SCROLL_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Only restore saved position for tracked pages (home)
    if (SAVED_PATHS.includes(pathname)) {
      const saved = getScrollPositions();
      if (saved[pathname] !== undefined) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: saved[pathname], behavior: 'instant' });
        });
        return; // Don't scroll to top
      }
    }
    // Otherwise always scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
