import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    CheckCircle, Home, Download, Loader2, AlertCircle
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { bookingApi } from '../../api/bookingApi';
import type { PaymentEvent } from '../../types/booking.types';
import toast from 'react-hot-toast';

const BookingSuccessPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');
    const navigate = useNavigate();
    const { theme } = useTheme();

    const [paymentStatus, setPaymentStatus] = useState<'waiting' | 'success' | 'failed'>('waiting');
    const [eventData, setEventData] = useState<PaymentEvent | null>(null);

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
                            <div className="pt-2 flex gap-4 text-sm">
                                <button className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors">
                                    <Download className="w-4 h-4" /> Download PDF
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
