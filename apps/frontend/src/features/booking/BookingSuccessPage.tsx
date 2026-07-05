import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    CheckCircle, Home, Download, Loader2, AlertCircle,
    Film, MapPin, Clock, Armchair, Receipt
} from 'lucide-react';
import { bookingApi } from '../../api/bookingApi';
import type { TicketInfo } from '../../types/booking.types';
import { showSuccess, showError } from '../../utils/ToastUtils';
import { useTranslation } from 'react-i18next';
import { downloadTicketAsPdf } from '../../utils/ticketPdfGenerator';

const BookingSuccessPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pdfLoading, setPdfLoading] = useState(false);

    useEffect(() => {
        if (!orderId) {
            navigate('/home');
            return;
        }

        const fetchTicket = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await bookingApi.getTicketInfo(orderId);
                setTicketInfo(res.data);
            } catch (err: any) {
                console.error('Failed to fetch ticket info:', err);
                setError('Could not load ticket information. Please check your order history.');
            } finally {
                setLoading(false);
            }
        };

        fetchTicket();
    }, [orderId, navigate]);

    const handleGeneratePdf = async () => {
        if (!ticketInfo) return;
        setPdfLoading(true);
        try {
            await downloadTicketAsPdf(ticketInfo);
            showSuccess(t('toast.pdfGenerated'));
        } catch (err) {
            console.error("PDF generation error:", err);
            showError(t('toast.pdfFailed'));
        } finally {
            setPdfLoading(false);
        }
    };

    // Loading State
    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #09090b 0%, #18181b 55%, #2a1300 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', color: '#f4f4f5' }}>
                <div style={{
                    maxWidth: 420, width: '100%', padding: '32px', borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)',
                    backgroundColor: 'rgba(24,24,27,0.96)', textAlign: 'center',
                }}>
                    <Loader2 size={56} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite', margin: '0 auto 24px' }} />
                    <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>Loading Your Ticket...</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Retrieving your booking details.</p>
                </div>
            </div>
        );
    }

    // Error State
    if (error || !ticketInfo) {
        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #09090b 0%, #18181b 55%, #2a1300 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', color: '#f4f4f5' }}>
                <div style={{
                    maxWidth: 420, width: '100%', padding: '32px', borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)',
                    backgroundColor: 'rgba(24,24,27,0.96)', textAlign: 'center',
                }}>
                    <div style={{
                        width: 96, height: 96, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 24px',
                        background: 'rgba(245, 158, 11, 0.12)',
                    }}>
                        <AlertCircle size={56} style={{ color: '#f59e0b' }} />
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>Unable to Load Ticket</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: '8px' }}>{error || 'Ticket information is not available.'}</p>
                    {orderId && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: '24px', fontFamily: "'JetBrains Mono', monospace" }}>Order ID: {orderId}</p>}
                    <button
                        onClick={() => navigate('/home')}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '14px 20px', justifyContent: 'center', fontWeight: 700 }}
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    // Success State
    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #09090b 0%, #18181b 55%, #2a1300 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', color: '#f4f4f5' }}>
            <div style={{
                maxWidth: 500, width: '100%', padding: '32px', borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)',
                backgroundColor: 'rgba(24,24,27,0.96)', color: '#f4f4f5',
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px',
                        background: 'rgba(16, 185, 129, 0.12)',
                    }}>
                        <CheckCircle size={48} style={{ color: '#10b981' }} />
                    </div>
                    <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: '4px', color: 'var(--text-primary)' }}>Booking Successful!</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Your tickets have been confirmed. Enjoy your movie!</p>
                </div>

                {/* Movie Card */}
                <div style={{
                    borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '24px',
                    backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                }}>
                    <div style={{ display: 'flex', gap: '16px', padding: '16px' }}>
                        {ticketInfo.movieImageUrl && (
                            <img
                                src={ticketInfo.movieImageUrl}
                                alt={ticketInfo.movieName}
                                style={{ width: 80, height: 112, objectFit: 'cover', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }}
                            />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>{ticketInfo.movieName}</h3>
                            <span style={{
                                display: 'inline-block', padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                                color: 'var(--primary)', backgroundColor: 'rgba(255,138,0,0.12)',
                            }}>
                                {ticketInfo.formatName}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
                    marginBottom: '24px', padding: '16px',
                    borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <MapPin size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 2 }}>Cinema</p>
                            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{ticketInfo.cinemaName}</p>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ticketInfo.cinemaAddress}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <Film size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 2 }}>Auditorium</p>
                            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{ticketInfo.auditoriumNumber}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', gridColumn: '1 / -1' }}>
                        <Clock size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 2 }}>Showtime</p>
                            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                                {new Date(ticketInfo.showTime).toLocaleString('vi-VN', {
                                    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Seats Table */}
                <div style={{
                    padding: '16px', borderRadius: 'var(--radius-lg)', marginBottom: '24px',
                    backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Armchair size={16} style={{ color: 'var(--primary)' }} />
                            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Tickets</span>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>ID: {orderId?.substring(0, 8)}...</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {ticketInfo.seats.map((seat, idx) => (
                            <div key={idx} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-color)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--primary)' }}>{seat.seatNumber}</span>
                                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{seat.segmentName}</span>
                                </div>
                                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{seat.priceEach.toLocaleString('vi-VN')}đ</span>
                            </div>
                        ))}
                    </div>
                    {/* Total */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Receipt size={16} style={{ color: 'var(--primary)' }} />
                            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Total Paid</span>
                        </div>
                        <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>
                            {ticketInfo.totalPrice.toLocaleString('vi-VN')}đ
                        </span>
                    </div>
                    {ticketInfo.vnPayTransactionId && (
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'right', marginTop: '4px' }}>
                            VNPAY Txn: {ticketInfo.vnPayTransactionId}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                        onClick={handleGeneratePdf}
                        disabled={pdfLoading}
                        className="btn btn-primary cta-glow"
                        style={{ width: '100%', padding: '14px 20px', justifyContent: 'center', fontSize: 15, fontWeight: 700, gap: '8px' }}
                    >
                        {pdfLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}
                        Tải vé PDF
                    </button>
                    <button
                        onClick={() => navigate('/home')}
                        className="btn btn-ghost"
                        style={{ width: '100%', padding: '14px 20px', justifyContent: 'center', fontSize: 14, gap: '8px' }}
                    >
                        <Home size={16} /> Return to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingSuccessPage;
