import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { staffShiftApi } from '../api/staffShiftApi';
import { showError, showSuccess } from '../utils/ToastUtils';
import type { ShiftNotification } from '../types/shift.types';

const notificationTitle = (event: ShiftNotification) => {
  if (event.title) return event.title;
  switch (event.type) {
    case 'ShiftApproved': return 'Shift approved';
    case 'ShiftRejected': return 'Shift rejected';
    case 'ShiftCancelled': return 'Shift cancelled';
    case 'ShiftAssigned': return 'Shift assigned';
    case 'PayrollProcessed': return 'Payroll processed';
    default: return 'Shift notification';
  }
};

const showShiftNotification = (event: ShiftNotification) => {
  if (event.status === 'connected') return;
  const message = event.message || notificationTitle(event);
  if (event.type === 'ShiftRejected' || event.type === 'ShiftCancelled') {
    showError(message, { duration: 5000 });
    return;
  }
  showSuccess(message, { duration: 5000 });
};

const ShiftNotificationListener = () => {
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user_info');
    if (!storedUser) return;

    const source = new EventSource(staffShiftApi.getNotificationsSseUrl(), { withCredentials: true });

    source.onmessage = (event) => {
      try {
        showShiftNotification(JSON.parse(event.data) as ShiftNotification);
      } catch {
        // Ignore malformed SSE payloads without interrupting the connection.
      }
    };

    source.onerror = () => {
      source.close();
    };

    return () => source.close();
  }, [location.pathname]);

  return null;
};

export default ShiftNotificationListener;
