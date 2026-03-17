import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    User, Mail, Phone, Calendar, IdCard, 
    History, ChevronLeft, Loader2, AlertCircle,
    Ticket, MapPin, Clock, CheckCircle2, Timer,
    ExternalLink
} from 'lucide-react';
import { bookingApi } from '../../api/bookingApi';
import type { UserAccountInfo, BookingHistoryItem } from '../../types/booking.types';
import { useTheme } from '../../contexts/ThemeContext';

const AccountPage: React.FC = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');
    
    const [accountInfo, setAccountInfo] = useState<UserAccountInfo | null>(null);
    const [history, setHistory] = useState<BookingHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [accountRes, historyRes] = await Promise.all([
                    bookingApi.getAccountInfo(),
                    bookingApi.getBookingHistory()
                ]);
                setAccountInfo(accountRes.data);
                setHistory(historyRes.data || []);
            } catch (err: any) {
                const msg = err.response?.data?.message || 'Failed to load user data';
                setError(msg);
                // If 401, axiosClient handles redirect but we can handle it here too
                if (err.response?.status === 401) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [navigate]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Booked': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'Pending': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'Canceled': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    const getAiringStatusIcon = (status: string) => {
        switch (status) {
            case 'Upcoming': return <Timer className="w-3 h-3" />;
            case 'Airing': return <PlayCircle className="w-3 h-3 animate-pulse" />;
            case 'Finished': return <CheckCircle2 className="w-3 h-3" />;
            default: return null;
        }
    };

    const PlayCircle = ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
        </svg>
    );

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-black text-white' : theme === 'modern' ? 'bg-[#0D081D] text-white' : 'bg-gray-50 text-gray-900'}`}>
                <Loader2 className="w-12 h-12 animate-spin text-red-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${theme === 'dark' ? 'bg-black text-white' : theme === 'modern' ? 'bg-[#0D081D] text-white' : 'bg-gray-50 text-gray-900'}`}>
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <p className="text-xl font-bold mb-4">{error}</p>
                <button onClick={() => navigate('/home')} className="px-6 py-2 bg-red-600 text-white rounded-lg">Go Home</button>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            theme === 'dark' ? 'bg-black text-white' : 
            theme === 'modern' ? 'bg-gradient-to-br from-[#0D081D] via-[#050A14] to-[#12081C] text-white' : 
            'bg-gray-50 text-gray-900'
        }`}>
            {/* Header */}
            <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b h-16 flex items-center px-6 transition-all ${
                theme === 'dark' ? 'bg-black/80 border-gray-800' : 
                theme === 'modern' ? 'bg-[#0E0A20]/90 border-indigo-500/30' : 
                'bg-white/80 border-gray-200 shadow-sm'
            }`}>
                <button 
                    onClick={() => navigate('/home')} 
                    className={`p-2 mr-4 rounded-lg transition-colors ${
                        theme === 'dark' ? 'hover:bg-gray-800 text-white' : 
                        theme === 'modern' ? 'hover:bg-indigo-500/20 text-white' : 
                        'hover:bg-gray-100 text-gray-700'
                    }`}
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="font-black">My Account</h2>
            </header>

            <main className="pt-24 pb-12 container mx-auto px-6 max-w-5xl">
                {/* User Hero */}
                <div className={`p-8 rounded-3xl mb-8 flex flex-col md:flex-row items-center gap-8 border transition-all ${
                    theme === 'modern' ? 'bg-indigo-600 shadow-indigo-500/20 border-indigo-400/30' : 
                    theme === 'dark' ? 'bg-gray-900 border-gray-800' : 
                    'bg-white border-gray-200 shadow-xl'
                }`}>
                    <div className={`w-24 h-24 rounded-2xl flex items-center justify-center shadow-2xl ${
                        theme === 'modern' ? 'bg-white/20 backdrop-blur-md' : 'bg-red-600'
                    }`}>
                        <User className="w-12 h-12 text-white" />
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-black mb-1">{accountInfo?.userName}</h1>
                        <p className="opacity-60 flex items-center justify-center md:justify-start gap-2">
                            <Mail className="w-4 h-4" /> {accountInfo?.email}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8">
                    <button 
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border transition-all ${
                            activeTab === 'profile' 
                            ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20' 
                            : theme === 'dark' ? 'bg-gray-900 border-gray-800 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-red-600 transition-colors'
                        }`}
                    >
                        <UserCircleIcon className="w-5 h-5" /> Profile info
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border transition-all ${
                            activeTab === 'history' 
                            ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20' 
                            : theme === 'dark' ? 'bg-gray-900 border-gray-800 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-red-600 transition-colors'
                        }`}
                    >
                        <History className="w-5 h-5" /> Booking History
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {activeTab === 'profile' ? (
                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6`}>
                            <ProfileCard icon={<Mail className="w-5 h-5" />} label="Email Address" value={accountInfo?.email} theme={theme} />
                            <ProfileCard icon={<Phone className="w-5 h-5" />} label="Phone Number" value={accountInfo?.phoneNumber} theme={theme} />
                            <ProfileCard icon={<IdCard className="w-5 h-5" />} label="Identity Code" value={accountInfo?.identityCode} theme={theme} />
                            <ProfileCard icon={<Calendar className="w-5 h-5" />} label="Date of Birth" value={accountInfo?.dateOfBirth ? new Date(accountInfo.dateOfBirth).toLocaleDateString('vi-VN') : 'N/A'} theme={theme} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.length === 0 ? (
                                <div className={`p-12 text-center rounded-3xl border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                                    <Ticket className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="opacity-40 font-bold">You haven't booked any movies yet.</p>
                                </div>
                            ) : (
                                history.map((item) => (
                                    <div key={item.orderId} className={`group p-6 rounded-3xl border transition-all hover:-translate-y-1 ${
                                        theme === 'dark' ? 'bg-gray-900 border-gray-800' : 
                                        theme === 'modern' ? 'bg-white/5 border-indigo-500/20 backdrop-blur-md' :
                                        'bg-white border-gray-200 shadow-lg'
                                    }`}>
                                        <div className="flex flex-col md:flex-row gap-6">
                                            {/* Movie Thumbnail */}
                                            <div className="w-full md:w-32 h-44 shrink-0 rounded-2xl overflow-hidden shadow-xl border border-white/10">
                                                <img 
                                                    src={item.movieImageUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500'} 
                                                    alt={item.movieName} 
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" 
                                                />
                                            </div>

                                            {/* Order Details */}
                                            <div className="flex-1 space-y-4">
                                                <div className="flex flex-wrap items-start justify-between gap-4">
                                                    <div>
                                                        <h3 className="text-xl font-black mb-1">{item.movieName}</h3>
                                                        <div className="flex flex-wrap items-center gap-3 text-sm opacity-60">
                                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.cinemaName}</span>
                                                            <span className="flex items-center gap-1"><IdCard className="w-3 h-3" /> {item.auditoriumNumber}</span>
                                                        </div>
                                                    </div>
                                                    <div className={`px-4 py-1.5 rounded-full text-xs font-black border uppercase tracking-wider ${getStatusColor(item.orderStatus)}`}>
                                                        {item.orderStatus}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] uppercase font-bold opacity-40">Booking Date</p>
                                                        <p className="text-sm font-bold flex items-center gap-2"><Clock className="w-3 h-3 text-red-600" /> {formatDate(item.orderDate)}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] uppercase font-bold opacity-40">Showtime</p>
                                                        <p className="text-sm font-bold flex items-center gap-2"><Calendar className="w-3 h-3 text-red-600" /> {formatDate(item.startTime)}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] uppercase font-bold opacity-40">Seats</p>
                                                        <p className="text-sm font-black text-red-600">{item.seats.join(', ')}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] uppercase font-bold opacity-40">Amount Paid</p>
                                                        <p className="text-lg font-black text-red-600">{item.totalPrice.toLocaleString('vi-VN')}đ</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-dashed border-white/10 flex flex-wrap items-center justify-between gap-4">
                                           <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg ${
                                               item.movieAiringStatus === 'Airing' ? 'text-green-500 bg-green-500/10' :
                                               item.movieAiringStatus === 'Finished' ? 'text-blue-500 bg-blue-500/10' :
                                               'text-yellow-500 bg-yellow-500/10'
                                           }`}>
                                               {getAiringStatusIcon(item.movieAiringStatus)}
                                               {item.movieAiringStatus}
                                           </div>
                                           <button className="text-xs font-bold flex items-center gap-1 hover:text-red-500 transition-colors uppercase tracking-widest opacity-60">
                                               View Details <ExternalLink className="w-3 h-3" />
                                           </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

const ProfileCard = ({ icon, label, value, theme }: { icon: React.ReactNode, label: string, value?: string, theme: string }) => (
    <div className={`p-6 rounded-3xl border transition-all ${
        theme === 'dark' ? 'bg-gray-900 border-gray-800' : 
        theme === 'modern' ? 'bg-white/5 border-indigo-500/20 shadow-xl' : 
        'bg-white border-gray-200 shadow-lg'
    }`}>
        <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center text-red-600 italic">
                {icon}
            </div>
            <span className="text-xs font-black uppercase tracking-widest opacity-40">{label}</span>
        </div>
        <p className="text-lg font-bold">{value || 'N/A'}</p>
    </div>
);

const UserCircleIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
);

export default AccountPage;
