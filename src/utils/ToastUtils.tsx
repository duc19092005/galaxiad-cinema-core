import type { ToastOptions } from 'react-hot-toast';
import toast from 'react-hot-toast';

/**
 * Styled toast helpers with emoji icons and consistent styling.
 * Wraps react-hot-toast with a more premium look.
 */

const defaultOptions: ToastOptions = {
  duration: 3000,
  position: 'top-right',
  style: {
    borderRadius: '12px',
    padding: '14px 20px',
    fontSize: '14px',
    fontWeight: 500,
    fontFamily: 'Inter, system-ui, sans-serif',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.06)',
    maxWidth: '420px',
    border: '1px solid rgba(255,255,255,0.08)',
  },
};

export const showSuccess = (message: string, options?: ToastOptions) =>
  toast.success(message, {
    ...defaultOptions,
    ...options,
    style: {
      ...defaultOptions.style,
      background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
      color: '#ecfdf5',
      border: '1px solid rgba(52, 211, 153, 0.3)',
    },
    icon: '✅',
  });

export const showError = (message: string, options?: ToastOptions) =>
  toast.error(message, {
    ...defaultOptions,
    ...options,
    style: {
      ...defaultOptions.style,
      background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
      color: '#fef2f2',
      border: '1px solid rgba(248, 113, 113, 0.3)',
    },
    icon: '❌',
  });

export const showLoading = (message: string, options?: ToastOptions) =>
  toast.loading(message, {
    ...defaultOptions,
    ...options,
    style: {
      ...defaultOptions.style,
      background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)',
      color: '#eff6ff',
      border: '1px solid rgba(96, 165, 250, 0.3)',
    },
    icon: '⏳',
  });

export const dismissToast = (toastId?: string) => toast.dismiss(toastId);

export const showPromise = (
  promise: Promise<any>,
  messages: { loading: string; success: string; error: string },
  options?: ToastOptions
) => toast.promise(promise, messages, { ...defaultOptions, ...options });

export { toast };
