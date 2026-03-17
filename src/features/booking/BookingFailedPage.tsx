import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, Home, RefreshCw, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const BookingFailedPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');
    const navigate = useNavigate();
    const { theme } = useTheme();

    return (
        <div className={`min-h-screen flex items-center justify-center p-6 ${theme === 'dark' ? 'bg-black text-white' : theme === 'modern' ? 'bg-[#0D081D] text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className={`max-w-md w-full p-8 rounded-3xl border shadow-2xl text-center ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-16 h-16 text-red-500" />
                </div>

                <h2 className="text-3xl font-black mb-2 text-red-500">Payment Canceled</h2>
                {orderId && <p className="text-xs opacity-50 mb-2">Order ID: {orderId}</p>}
                <p className="opacity-60 text-sm mb-8">
                    The payment process was interrupted or canceled. No funds have been deducted from your account.
                </p>

                <div className={`p-4 rounded-xl mb-8 flex items-start gap-3 text-left bg-yellow-500/10 border border-yellow-500/20`}>
                    <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                    <p className="text-xs text-yellow-600 font-medium">
                        If you encountered an error during payment, please try a different payment method or contact your bank.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => navigate('/home')}
                        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/30"
                    >
                        <RefreshCw className="w-4 h-4" /> Try Booking Again
                    </button>
                    <button
                        onClick={() => navigate('/home')}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 border border-white/10 transition-all text-sm ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                        <Home className="w-4 h-4" /> Return to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingFailedPage;
