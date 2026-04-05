import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    CheckCircle, Home, Download, Loader2, AlertCircle,
    Film, MapPin, Clock, Armchair, Receipt
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { bookingApi } from '../../api/bookingApi';
import type { TicketInfo } from '../../types/booking.types';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';


const BookingSuccessPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');
    const navigate = useNavigate();
    const { theme } = useTheme();

    const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pdfLoading, setPdfLoading] = useState(false);

    useEffect(() => {
        if (!orderId) {
            navigate('/home');
            return;
        }

        // Backend already verified VNPAY + updated DB before redirecting here.
        // We just fetch the ticket details directly.
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

            toast.success("PDF generated successfully!");
        } catch (err) {
            console.error("PDF generation error:", err);
            toast.error("Failed to generate PDF");
        } finally {
            setPdfLoading(false);
        }
    };

    // --- Loading State ---
    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-6 ${theme === 'dark' ? 'bg-black text-white' : theme === 'modern' ? 'bg-[#0D081D] text-white' : 'bg-gray-50 text-gray-900'}`}>
                <div className={`max-w-md w-full p-8 rounded-3xl border shadow-2xl text-center ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : theme === 'modern' ? 'bg-white/5 border-indigo-500/20' : 'bg-white border-gray-100'}`}>
                    <Loader2 className="w-20 h-20 animate-spin text-red-600 mx-auto mb-6" />
                    <h2 className="text-2xl font-black mb-2">Loading Your Ticket...</h2>
                    <p className="opacity-60 text-sm">Retrieving your booking details.</p>
                </div>
            </div>
        );
    }

    // --- Error State ---
    if (error || !ticketInfo) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-6 ${theme === 'dark' ? 'bg-black text-white' : theme === 'modern' ? 'bg-[#0D081D] text-white' : 'bg-gray-50 text-gray-900'}`}>
                <div className={`max-w-md w-full p-8 rounded-3xl border shadow-2xl text-center ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : theme === 'modern' ? 'bg-white/5 border-indigo-500/20' : 'bg-white border-gray-100'}`}>
                    <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-16 h-16 text-yellow-500" />
                    </div>
                    <h2 className="text-2xl font-black mb-2">Unable to Load Ticket</h2>
                    <p className="opacity-60 text-sm mb-2">{error || 'Ticket information is not available.'}</p>
                    {orderId && <p className="text-xs opacity-40 mb-8">Order ID: {orderId}</p>}
                    <button
                        onClick={() => navigate('/home')}
                        className="w-full py-4 bg-red-600 text-white rounded-xl font-bold transition-all hover:bg-red-700"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    // --- Success State with full ticket details ---
    return (
        <div className={`min-h-screen flex items-center justify-center p-6 ${theme === 'dark' ? 'bg-black text-white' : theme === 'modern' ? 'bg-[#0D081D] text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className={`max-w-lg w-full p-8 rounded-3xl border shadow-2xl ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : theme === 'modern' ? 'bg-white/5 border-indigo-500/20 backdrop-blur-xl' : 'bg-white border-gray-100'}`}>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
                        <CheckCircle className="w-12 h-12 text-green-500" />
                    </div>
                    <h2 className="text-3xl font-black mb-1">Booking Successful!</h2>
                    <p className="opacity-60 text-sm">Your tickets have been confirmed. Enjoy your movie!</p>
                </div>

                {/* Movie Card */}
                <div className={`rounded-2xl overflow-hidden mb-6 ${theme === 'dark' ? 'bg-black/40' : theme === 'modern' ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <div className="flex gap-4 p-4">
                        {ticketInfo.movieImageUrl && (
                            <img
                                src={ticketInfo.movieImageUrl}
                                alt={ticketInfo.movieName}
                                className="w-20 h-28 object-cover rounded-xl shadow-lg"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-black text-lg leading-tight mb-2 truncate">{ticketInfo.movieName}</h3>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                theme === 'dark' || theme === 'modern' ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600'
                            }`}>
                                {ticketInfo.formatName}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className={`grid grid-cols-2 gap-4 mb-6 p-4 rounded-2xl ${theme === 'dark' ? 'bg-black/40' : theme === 'modern' ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[10px] opacity-50 uppercase tracking-wider font-bold mb-0.5">Cinema</p>
                            <p className="text-sm font-bold leading-tight">{ticketInfo.cinemaName}</p>
                            <p className="text-[11px] opacity-50 leading-tight">{ticketInfo.cinemaAddress}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <Film className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[10px] opacity-50 uppercase tracking-wider font-bold mb-0.5">Auditorium</p>
                            <p className="text-sm font-bold">{ticketInfo.auditoriumNumber}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2 col-span-2">
                        <Clock className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[10px] opacity-50 uppercase tracking-wider font-bold mb-0.5">Showtime</p>
                            <p className="text-sm font-bold">
                                {new Date(ticketInfo.showTime).toLocaleString('vi-VN', {
                                    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Seats Table */}
                <div className={`p-4 rounded-2xl mb-6 ${theme === 'dark' ? 'bg-black/40' : theme === 'modern' ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Armchair className="w-4 h-4 text-red-500" />
                            <span className="text-[10px] uppercase tracking-wider font-bold opacity-50">Tickets</span>
                        </div>
                        <span className="text-[10px] opacity-40 font-mono">ID: {orderId?.substring(0, 8)}...</span>
                    </div>
                    <div className="space-y-2">
                        {ticketInfo.seats.map((seat, idx) => (
                            <div key={idx} className={`flex items-center justify-between py-2 px-3 rounded-xl ${
                                theme === 'dark' ? 'bg-white/5' : theme === 'modern' ? 'bg-white/5' : 'bg-white'
                            }`}>
                                <div className="flex items-center gap-3">
                                    <span className="font-black text-red-600 text-sm">{seat.seatNumber}</span>
                                    <span className="text-xs opacity-60">{seat.segmentName}</span>
                                </div>
                                <span className="font-bold text-sm">{seat.priceEach.toLocaleString('vi-VN')}đ</span>
                            </div>
                        ))}
                    </div>
                    {/* Total */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed border-white/10">
                        <div className="flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-red-500" />
                            <span className="font-bold text-sm">Total Paid</span>
                        </div>
                        <span className="text-xl font-black text-red-600">
                            {ticketInfo.totalPrice.toLocaleString('vi-VN')}đ
                        </span>
                    </div>
                    {ticketInfo.vnPayTransactionId && (
                        <p className="text-[10px] opacity-40 text-right mt-1">
                            VNPAY Txn: {ticketInfo.vnPayTransactionId}
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleDownloadTicket}
                        className="w-full py-3.5 bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30"
                    >
                        <Download className="w-4 h-4" /> Download Ticket
                    </button>
                    <button
                        onClick={handleGeneratePdf}
                        disabled={pdfLoading}
                        className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 border border-red-600/30 transition-all ${
                            theme === 'dark' || theme === 'modern'
                                ? 'bg-white/5 hover:bg-white/10 text-red-500'
                                : 'bg-red-50 hover:bg-red-100 text-red-600'
                        }`}
                    >
                        {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4" /> Export to PDF</>}
                    </button>
                    <button
                        onClick={() => navigate('/home')}
                        className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 border border-white/10 transition-all text-sm ${
                            theme === 'dark' || theme === 'modern'
                                ? 'bg-white/5 hover:bg-white/10'
                                : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                    >
                        <Home className="w-4 h-4" /> Return to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingSuccessPage;
