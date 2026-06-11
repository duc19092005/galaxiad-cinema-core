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
import jsPDF from 'jspdf';

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

    const handleDownloadTicket = () => {
        if (!orderId) return;
        const url = bookingApi.getTicketDownloadUrl(orderId);
        window.open(url, '_blank');
    };

    const handleGeneratePdf = async () => {
        if (!orderId || !ticketInfo) return;
        setPdfLoading(true);
        try {
            const data = ticketInfo;
            const html2canvas = (await import('html2canvas')).default;

            const ticketContainer = document.createElement('div');
            ticketContainer.style.position = 'absolute';
            ticketContainer.style.left = '-9999px';
            ticketContainer.style.top = '-9999px';
            ticketContainer.style.width = '600px';
            ticketContainer.style.background = '#ffffff';
            ticketContainer.style.padding = '40px';
            ticketContainer.style.fontFamily = "'Inter', 'Roboto', sans-serif";
            ticketContainer.style.color = '#1f2937';
            ticketContainer.style.borderRadius = '20px';
            ticketContainer.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';

            ticketContainer.innerHTML = `
                <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px dashed #e5e7eb; padding-bottom: 20px;">
                    <h1 style="color: #ef4444; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 2px;">CINEMA PRO</h1>
                    <p style="color: #6b7280; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 4px; font-size: 10px; font-weight: 700;">Movie Ticket</p>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <h2 style="margin: 0; font-size: 24px; font-weight: 900; color: #111827;">${data.movieName}</h2>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <span style="background: #ef4444; color: white; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 800;">${data.formatName}</span>
                        <span style="background: #f3f4f6; color: #374151; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 800;">${data.auditoriumNumber}</span>
                    </div>
                </div>

                <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                    <div>
                        <p style="color: #9ca3af; font-size: 11px; text-transform: uppercase; font-weight: 800; margin-bottom: 4px;">Cinema</p>
                        <p style="margin: 0; font-weight: 700; font-size: 14px;">${data.cinemaName}</p>
                        <p style="margin: 2px 0 0 0; font-size: 12px; color: #4b5563;">${data.cinemaAddress}</p>
                    </div>
                    <div>
                        <p style="color: #9ca3af; font-size: 11px; text-transform: uppercase; font-weight: 800; margin-bottom: 4px;">Show Time</p>
                        <p style="margin: 0; font-weight: 700; font-size: 15px;">${new Date(data.showTime).toLocaleString('vi-VN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</p>
                    </div>
                </div>

                <div style="border-top: 1px solid #f3f4f6; padding-top: 20px; margin-bottom: 25px;">
                   <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                       <span style="color: #9ca3af; font-size: 11px; text-transform: uppercase; font-weight: 800;">Ticket Selection</span>
                       <span style="color: #111827; font-size: 12px; font-weight: 700;">Order ID: ${data.orderId.substring(0, 12)}...</span>
                   </div>
                   <table style="width: 100%; border-collapse: collapse;">
                       <thead>
                           <tr style="text-align: left; border-bottom: 1px solid #f3f4f6;">
                               <th style="padding: 10px 0; font-size: 11px; color: #9ca3af; text-transform: uppercase;">Seat</th>
                               <th style="padding: 10px 0; font-size: 11px; color: #9ca3af; text-transform: uppercase;">Type</th>
                               <th style="padding: 10px 0; font-size: 11px; color: #9ca3af; text-transform: uppercase; text-align: right;">Price</th>
                           </tr>
                       </thead>
                       <tbody>
                           ${data.seats.map(seat => `
                               <tr style="border-bottom: 1px solid #f9fafb;">
                                   <td style="padding: 12px 0; font-weight: 800; font-size: 14px; color: #111827;">${seat.seatNumber}</td>
                                   <td style="padding: 12px 0; font-size: 13px; color: #4b5563;">${seat.segmentName}</td>
                                   <td style="padding: 12px 0; font-weight: 800; font-size: 14px; color: #111827; text-align: right;">${seat.priceEach.toLocaleString('vi-VN')}đ</td>
                               </tr>
                           `).join('')}
                       </tbody>
                       <tfoot>
                           <tr>
                               <td colspan="2" style="padding: 20px 0 0 0; font-weight: 800; font-size: 18px; color: #111827;">TOTAL</td>
                               <td style="padding: 20px 0 0 0; font-weight: 900; font-size: 22px; color: #ef4444; text-align: right;">${data.totalPrice.toLocaleString('vi-VN')}đ</td>
                           </tr>
                       </tfoot>
                   </table>
                </div>

                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px dashed #e5e7eb;">
                    <p style="margin: 0; font-size: 12px; font-weight: 700; color: #9ca3af;">Thank you for choosing CINEMA PRO!</p>
                    <p style="margin: 5px 0 0 0; font-size: 10px; color: #d1d5db;">Please show this ticket at the theater entrance.</p>
                </div>
            `;

            document.body.appendChild(ticketContainer);

            const canvas = await html2canvas(ticketContainer, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            document.body.removeChild(ticketContainer);

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 190;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            pdf.save(`ticket_${orderId.substring(0, 8)}.pdf`);

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
                        onClick={handleDownloadTicket}
                        className="btn btn-primary cta-glow"
                        style={{ width: '100%', padding: '14px 20px', justifyContent: 'center', fontSize: 15, fontWeight: 700, gap: '8px' }}
                    >
                        <Download size={16} /> Download Ticket
                    </button>
                    <button
                        onClick={handleGeneratePdf}
                        disabled={pdfLoading}
                        className="btn btn-secondary"
                        style={{ width: '100%', padding: '14px 20px', justifyContent: 'center', fontSize: 14, fontWeight: 700, gap: '8px' }}
                    >
                        {pdfLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}
                        Export to PDF
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
