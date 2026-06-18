import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const SCROLL_STORAGE_KEY = 'cinema_scroll_positions';
const SAVED_PATHS = ['/', '/home'];

const ScrollRestore: React.FC = () => {
  const { pathname } = useLocation();
  const prevPath = useRef(pathname);

  // Helper: should we save/restore position for this path?
  const shouldHandle = (path: string) => SAVED_PATHS.includes(path);

  // Save scroll position before leaving a tracked page
  const saveIfNeeded = (path: string) => {
    if (shouldHandle(path)) {
      try {
        const positions = JSON.parse(
          localStorage.getItem(SCROLL_STORAGE_KEY) || '{}'
        );
        positions[path] = window.scrollY;
        localStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(positions));
      } catch {}
    }
  };

  // Save on tab close / visibility change
  useEffect(() => {
    const handleHide = () => saveIfNeeded(prevPath.current);
    window.addEventListener('beforeunload', handleHide);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') handleHide();
    });
    return () => {
      window.removeEventListener('beforeunload', handleHide);
      document.removeEventListener('visibilitychange', handleHide);
    };
  }, []);

  // Save when leaving current route
  useEffect(() => {
    return () => saveIfNeeded(prevPath.current);
  }, [pathname]);

  // Update ref + optional restore on enter
  useEffect(() => {
    prevPath.current = pathname;
  }, [pathname]);

  return null;
};

export default ScrollRestore;
