import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { notificationApi } from '../api/commentApi';
import { showError, showSuccess } from '../utils/ToastUtils';

interface RealtimeNotification {
  title?: string;
  message?: string;
  type?: string;
  status?: string;
}

const ShiftNotificationListener = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const notificationTitle = useCallback((event: RealtimeNotification) => {
    if (event.title) return event.title;
    switch (event.type) {
      case 'ShiftApproved': return t('notifications.shiftApproved', 'Shift approved');
      case 'ShiftRejected': return t('notifications.shiftRejected', 'Shift rejected');
      case 'ShiftCancelled': return t('notifications.shiftCancelled', 'Shift cancelled');
      case 'ShiftAssigned': return t('notifications.shiftAssigned', 'Shift assigned');
      case 'PayrollProcessed': return t('notifications.payrollProcessed', 'Payroll processed');
      case 'CommentReply': return t('notifications.commentReply', 'Someone replied to your comment');
      case 'CommentRejected': return t('notifications.commentRejected', 'Your comment has been removed');
      default: return t('notifications.default', 'Notification');
    }
  }, [t]);

  const showRealtimeNotification = useCallback((event: RealtimeNotification) => {
    if (event.status === 'connected') return;
    const message = event.message || notificationTitle(event);
    if (event.type === 'ShiftRejected' || event.type === 'ShiftCancelled' || event.type === 'CommentRejected') {
      showError(message, { duration: 5000 });
    } else {
      showSuccess(message, { duration: 5000 });
    }

    window.dispatchEvent(new CustomEvent('cinema-notification', { detail: event }));
  }, [notificationTitle]);

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
  }, [location.pathname, showRealtimeNotification]);

  return null;
};

export default ShiftNotificationListener;
