import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, Home, RefreshCw, AlertTriangle, ShieldAlert, HelpCircle } from 'lucide-react';

const BookingFailedPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');
    const error = searchParams.get('error');
    const navigate = useNavigate();

    const getErrorMessage = () => {
        switch (error) {
            case 'processing_error':
                return {
                    icon: <ShieldAlert size={18} style={{ color: 'var(--color-accent-error)', flexShrink: 0 }} />,
                    title: 'Processing Error',
                    message: 'An error occurred while processing your payment. If money was deducted, please contact our support team for assistance.'
                };
            default:
                return {
                    icon: <AlertTriangle size={18} style={{ color: 'var(--color-accent-warning)', flexShrink: 0 }} />,
                    title: 'Payment Interrupted',
                    message: 'The payment process was interrupted or canceled. No funds have been deducted from your account.'
                };
        }
    };

    const errorDetails = getErrorMessage();

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-24)' }}>
            <div style={{
                maxWidth: 420, width: '100%', padding: 'var(--space-32)', borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)',
                backgroundColor: 'var(--color-card)', textAlign: 'center',
            }}>
                <div style={{
                    width: 96, height: 96, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto var(--space-24)',
                    background: 'rgba(255, 180, 171, 0.12)',
                }}>
                    <XCircle size={56} style={{ color: 'var(--color-accent-error)' }} />
                </div>

                <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 'var(--space-8)', color: 'var(--color-accent-error)' }}>Payment Failed</h2>
                {orderId && <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-8)', fontFamily: 'var(--font-mono)' }}>Order ID: {orderId}</p>}
                <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-32)' }}>
                    {errorDetails.message}
                </p>

                {/* Error Detail Card */}
                <div style={{
                    padding: 'var(--space-16)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-32)',
                    display: 'flex', alignItems: 'flex-start', gap: 'var(--space-12)', textAlign: 'left',
                    backgroundColor: error === 'processing_error'
                        ? 'rgba(255, 180, 171, 0.08)'
                        : 'rgba(245, 158, 11, 0.08)',
                    border: `1px solid ${error === 'processing_error' ? 'rgba(255, 180, 171, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                }}>
                    {errorDetails.icon}
                    <div>
                        <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 'var(--space-4)', color: error === 'processing_error' ? 'var(--color-accent-error)' : 'var(--color-accent-warning)' }}>
                            {errorDetails.title}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                            {error === 'processing_error'
                                ? 'Error code: processing_error — Please contact support with your Order ID.'
                                : 'If you encountered an error during payment, please try a different payment method or contact your bank.'
                            }
                        </p>
                    </div>
                </div>

                {/* Help section */}
                {error === 'processing_error' && (
                    <div style={{
                        padding: 'var(--space-16)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-24)',
                        display: 'flex', alignItems: 'flex-start', gap: 'var(--space-12)', textAlign: 'left',
                        backgroundColor: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.15)',
                    }}>
                        <HelpCircle size={18} style={{ color: 'var(--color-accent-info)', flexShrink: 0 }} />
                        <div>
                            <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 'var(--space-4)', color: 'var(--color-accent-info)' }}>
                                Need Help?
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                                If you were charged but didn't receive your tickets, please contact our support with the Order ID above. We'll resolve this as soon as possible.
                            </p>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
                    <button
                        onClick={() => navigate('/home')}
                        className="btn-primary cta-glow"
                        style={{ width: '100%', padding: '14px 20px', justifyContent: 'center', fontSize: 15, fontWeight: 700, gap: 'var(--space-8)' }}
                    >
                        <RefreshCw size={16} /> Try Booking Again
                    </button>
                    <button
                        onClick={() => navigate('/home')}
                        className="btn-secondary"
                        style={{ width: '100%', padding: '14px 20px', justifyContent: 'center', fontSize: 14, gap: 'var(--space-8)' }}
                    >
                        <Home size={16} /> Return to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingFailedPage;
