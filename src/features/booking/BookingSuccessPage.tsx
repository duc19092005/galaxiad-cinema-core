import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    CheckCircle, Home, Download, Loader2, AlertCircle
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { bookingApi } from '../../api/bookingApi';
import type { PaymentEvent } from '../../types/booking.types';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';


const BookingSuccessPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');
    const navigate = useNavigate();
    const { theme } = useTheme();

    const [paymentStatus, setPaymentStatus] = useState<'waiting' | 'success' | 'failed'>('waiting');
    const [eventData, setEventData] = useState<PaymentEvent | null>(null);
    const [pdfLoading, setPdfLoading] = useState(false);


    useEffect(() => {
        if (!orderId) {
            navigate('/home');
            return;
        }

        // Subscribe to SSE for the final confirmation
        const eventSource = new EventSource(
            bookingApi.getPaymentStatusUrl(orderId),
            { withCredentials: true }
        );

        eventSource.addEventListener('payment-result', (event: MessageEvent) => {
            const data: PaymentEvent = JSON.parse(event.data);
            setEventData(data);
            if (data.status === 'success') {
                setPaymentStatus('success');
                toast.success('Payment verified successfully!');
            } else {
                setPaymentStatus('failed');
                toast.error('Payment verification failed.');
            }
            eventSource.close();
        });

        eventSource.onerror = (err) => {
            console.error('SSE Error:', err);
            eventSource.close();
        };

        // Fallback: If no event after 10 seconds (VNPAY is usually faster)
        const timer = setTimeout(() => {
            if (paymentStatus === 'waiting') {
                setPaymentStatus('success');
            }
        }, 15000);

        return () => {
            eventSource.close();
            clearTimeout(timer);
        };
    }, [orderId, navigate, paymentStatus]);

    const handleDownloadTicket = () => {
        if (!orderId) return;
        const url = bookingApi.getTicketDownloadUrl(orderId);
        window.open(url, '_blank');
    };

    const handleGeneratePdf = async () => {
        if (!orderId) return;
        setPdfLoading(true);
        try {
            const res = await bookingApi.getTicketInfo(orderId);
            const data = res.data;

            if (!data) {
                toast.error("Failed to fetch ticket info");
                return;
            }

            // To support UTF-8 (Vietnamese) and better design, we'll use html2canvas if possible,
            // or we'll ensure the jsPDF approach is more robust.
            // Since we can't easily rely on an external font file, 
            // html2canvas + jsPDF is the standard way to handle UTF-8/Vietnamese in client-side PDF generation.
            
            const html2canvas = (await import('html2canvas')).default;
            
            // Create a temporary element for the ticket
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
                scale: 2, // High quality
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
            
            toast.success("PDF generated successfully!");
        } catch (err) {
            console.error("PDF generation error:", err);
            toast.error("Failed to generate PDF");
        } finally {
            setPdfLoading(false);
        }
    };


    return (
        <div className={`min-h-screen flex items-center justify-center p-6 ${theme === 'dark' ? 'bg-black text-white' : theme === 'modern' ? 'bg-[#0D081D] text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className={`max-w-md w-full p-8 rounded-3xl border shadow-2xl text-center ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>

                {paymentStatus === 'waiting' ? (
                    <>
                        <Loader2 className="w-20 h-20 animate-spin text-red-600 mx-auto mb-6" />
                        <h2 className="text-2xl font-black mb-2">Verifying Payment...</h2>
                        <p className="opacity-60 text-sm">Please wait while we confirm your transaction with the bank.</p>
                    </>
                ) : paymentStatus === 'success' ? (
                    <>
                        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-16 h-16 text-green-500" />
                        </div>
                        <h2 className="text-3xl font-black mb-2">Booking Successful!</h2>
                        <p className="opacity-60 text-sm mb-8">Your tickets have been confirmed. Enjoy your movie!</p>

                        <div className={`p-6 rounded-2xl mb-8 text-left space-y-3 ${theme === 'dark' ? 'bg-black/40' : 'bg-gray-50'}`}>
                            <div className="flex justify-between items-center text-xs opacity-50 uppercase tracking-widest font-bold">
                                <span>Ticket Details</span>
                                <span>ID: {orderId?.substring(0, 8)}...</span>
                            </div>
                            {eventData && (
                                <div className="flex justify-between font-bold">
                                    <span>Total Paid</span>
                                    <span className="text-green-500">{eventData.totalPrice?.toLocaleString('vi-VN')}đ</span>
                                </div>
                            )}
                            <div className="pt-2 flex flex-col gap-3 text-sm">
                                <button 
                                    onClick={handleDownloadTicket}
                                    className="w-full py-3 bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
                                >
                                    <Download className="w-4 h-4" /> Download Ticket (.txt)
                                </button>
                                <button 
                                    onClick={handleGeneratePdf}
                                    disabled={pdfLoading}
                                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-red-600/30 transition-all ${
                                        theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-red-500' : 'bg-red-50 hover:bg-red-100 text-red-600'
                                    }`}
                                >
                                    {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4" /> Export to PDF</>}
                                </button>
                            </div>
                        </div>


                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => navigate('/home')}
                                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 border border-white/10 transition-all text-sm ${theme === 'dark' || theme === 'modern' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}
                            >
                                <Home className="w-4 h-4" /> Return to Home
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-16 h-16 text-red-500" />
                        </div>
                        <h2 className="text-3xl font-black mb-2">Payment Failed</h2>
                        <p className="opacity-60 text-sm mb-8">We couldn't verify your payment. If you were charged, please contact support.</p>
                        <button
                            onClick={() => navigate('/home')}
                            className="w-full py-4 bg-red-600 text-white rounded-xl font-bold transition-all"
                        >
                            Try Again
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default BookingSuccessPage;
