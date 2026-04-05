import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, Home, RefreshCw, AlertTriangle, ShieldAlert, HelpCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const BookingFailedPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');
    const error = searchParams.get('error');
    const navigate = useNavigate();
    const { theme } = useTheme();

    const getErrorMessage = () => {
        switch (error) {
            case 'processing_error':
                return {
                    icon: <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />,
                    title: 'Processing Error',
                    message: 'An error occurred while processing your payment. If money was deducted, please contact our support team for assistance.'
                };
            default:
                return {
                    icon: <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />,
                    title: 'Payment Interrupted',
                    message: 'The payment process was interrupted or canceled. No funds have been deducted from your account.'
                };
        }
    };

    const errorDetails = getErrorMessage();

    return (
        <div className={`min-h-screen flex items-center justify-center p-6 ${theme === 'dark' ? 'bg-black text-white' : theme === 'modern' ? 'bg-[#0D081D] text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className={`max-w-md w-full p-8 rounded-3xl border shadow-2xl text-center ${
                theme === 'dark' ? 'bg-gray-900 border-gray-800' 
                : theme === 'modern' ? 'bg-white/5 border-indigo-500/20 backdrop-blur-xl' 
                : 'bg-white border-gray-100'
            }`}>
                <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-16 h-16 text-red-500" />
                </div>

                <h2 className="text-3xl font-black mb-2 text-red-500">Payment Failed</h2>
                {orderId && <p className="text-xs opacity-50 mb-2 font-mono">Order ID: {orderId}</p>}
                <p className="opacity-60 text-sm mb-8">
                    {errorDetails.message}
                </p>

                {/* Error Detail Card */}
                <div className={`p-4 rounded-xl mb-8 flex items-start gap-3 text-left ${
                    error === 'processing_error'
                        ? 'bg-red-500/10 border border-red-500/20'
                        : 'bg-yellow-500/10 border border-yellow-500/20'
                }`}>
                    {errorDetails.icon}
                    <div>
                        <p className={`text-xs font-bold mb-1 ${
                            error === 'processing_error' ? 'text-red-500' : 'text-yellow-600'
                        }`}>{errorDetails.title}</p>
                        <p className={`text-xs font-medium ${
                            error === 'processing_error' ? 'text-red-400/80' : 'text-yellow-600/80'
                        }`}>
                            {error === 'processing_error'
                                ? 'Error code: processing_error — Please contact support with your Order ID.'
                                : 'If you encountered an error during payment, please try a different payment method or contact your bank.'
                            }
                        </p>
                    </div>
                </div>

                {/* Help section for processing errors */}
                {error === 'processing_error' && (
                    <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 text-left ${
                        theme === 'dark' ? 'bg-white/5 border border-white/10' 
                        : theme === 'modern' ? 'bg-white/5 border border-white/10'
                        : 'bg-blue-50 border border-blue-100'
                    }`}>
                        <HelpCircle className="w-5 h-5 text-blue-400 shrink-0" />
                        <div>
                            <p className={`text-xs font-bold mb-1 ${
                                theme === 'dark' || theme === 'modern' ? 'text-blue-400' : 'text-blue-600'
                            }`}>Need Help?</p>
                            <p className="text-xs opacity-70">
                                If you were charged but didn't receive your tickets, please contact our support with the Order ID above. We'll resolve this as soon as possible.
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => navigate('/home')}
                        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/30"
                    >
                        <RefreshCw className="w-4 h-4" /> Try Booking Again
                    </button>
                    <button
                        onClick={() => navigate('/home')}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 border border-white/10 transition-all text-sm ${
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

export default BookingFailedPage;
