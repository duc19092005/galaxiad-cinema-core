import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { notificationApi } from '../api/commentApi';
import { showError, showSuccess } from '../utils/ToastUtils';

interface RealtimeNotification {
  title?: string;
  message?: string;
  type?: string;
  status?: string;
}

const notificationTitle = (event: RealtimeNotification) => {
  if (event.title) return event.title;
  switch (event.type) {
    case 'ShiftApproved': return 'Shift approved';
    case 'ShiftRejected': return 'Shift rejected';
    case 'ShiftCancelled': return 'Shift cancelled';
    case 'ShiftAssigned': return 'Shift assigned';
    case 'PayrollProcessed': return 'Payroll processed';
    case 'CommentReply': return 'Co nguoi phan hoi binh luan cua ban';
    case 'CommentRejected': return 'Binh luan da bi go';
    default: return 'Thong bao';
  }
};

const showRealtimeNotification = (event: RealtimeNotification) => {
  if (event.status === 'connected') return;
  const message = event.message || notificationTitle(event);
  if (event.type === 'ShiftRejected' || event.type === 'ShiftCancelled' || event.type === 'CommentRejected') {
    showError(message, { duration: 5000 });
  } else {
    showSuccess(message, { duration: 5000 });
  }

  window.dispatchEvent(new CustomEvent('cinema-notification', { detail: event }));
};

const ShiftNotificationListener = () => {
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user_info');
    if (!storedUser) return;

    const source = new EventSource(notificationApi.getNotificationsSseUrl(), { withCredentials: true });

    source.onmessage = (event) => {
      try {
        showRealtimeNotification(JSON.parse(event.data) as RealtimeNotification);
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
