import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { XCircle, Home, RefreshCw, AlertTriangle, ShieldAlert, HelpCircle } from 'lucide-react';

const BookingFailedPage: React.FC = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');
    const error = searchParams.get('error');
    const navigate = useNavigate();

    const getErrorMessage = () => {
        switch (error) {
            case 'processing_error':
                return {
                    icon: <ShieldAlert size={18} style={{ color: '#ef4444', flexShrink: 0 }} />,
                    title: t('booking.processing_error_title'),
                    message: t('booking.processing_error_msg')
                };
            default:
                return {
                    icon: <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />,
                    title: t('booking.payment_interrupted_title'),
                    message: t('booking.payment_interrupted_msg')
                };
        }
    };

    const errorDetails = getErrorMessage();

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #09090b 0%, #18181b 55%, #2a0000 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', color: '#f4f4f5' }}>
            <div style={{
                maxWidth: 420, width: '100%', padding: '32px', borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)',
                backgroundColor: 'rgba(24,24,27,0.96)', textAlign: 'center',
            }}>
                <div style={{
                    width: 96, height: 96, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 24px',
                    background: 'rgba(239, 68, 68, 0.12)',
                }}>
                    <XCircle size={56} style={{ color: '#ef4444' }} />
                </div>

                <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: '8px', color: '#ef4444' }}>{t('booking.payment_failed')}</h2>
                {orderId && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: '8px', fontFamily: "'JetBrains Mono', monospace" }}>Order ID: {orderId}</p>}
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: '32px' }}>
                    {errorDetails.message}
                </p>

                {/* Error Detail Card */}
                <div style={{
                    padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '32px',
                    display: 'flex', alignItems: 'flex-start', gap: '12px', textAlign: 'left',
                    backgroundColor: error === 'processing_error'
                        ? 'rgba(239, 68, 68, 0.08)'
                        : 'rgba(245, 158, 11, 0.08)',
                    border: `1px solid ${error === 'processing_error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                }}>
                    {errorDetails.icon}
                    <div>
                        <p style={{ fontSize: 12, fontWeight: 700, marginBottom: '4px', color: error === 'processing_error' ? '#ef4444' : '#f59e0b' }}>
                            {errorDetails.title}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {error === 'processing_error'
                                ? t('booking.processing_error_detail')
                                : t('booking.payment_interrupted_detail')
                            }
                        </p>
                    </div>
                </div>

                {/* Help section */}
                {error === 'processing_error' && (
                    <div style={{
                        padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '24px',
                        display: 'flex', alignItems: 'flex-start', gap: '12px', textAlign: 'left',
                        backgroundColor: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.15)',
                    }}>
                        <HelpCircle size={18} style={{ color: '#0ea5e9', flexShrink: 0 }} />
                        <div>
                            <p style={{ fontSize: 12, fontWeight: 700, marginBottom: '4px', color: '#0ea5e9' }}>
                                {t('booking.need_help')}
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                {t('booking.support_msg')}
                            </p>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                        onClick={() => navigate('/home')}
                        className="btn btn-primary cta-glow"
                        style={{ width: '100%', padding: '14px 20px', justifyContent: 'center', fontSize: 15, fontWeight: 700, gap: '8px' }}
                    >
                        <RefreshCw size={16} /> {t('booking.try_again')}
                    </button>
                    <button
                        onClick={() => navigate('/home')}
                        className="btn btn-secondary"
                        style={{ width: '100%', padding: '14px 20px', justifyContent: 'center', fontSize: 14, gap: '8px' }}
                    >
                        <Home size={16} /> {t('booking.return_home')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingFailedPage;
