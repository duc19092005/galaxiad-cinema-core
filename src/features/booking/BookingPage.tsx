import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Loader2, AlertCircle, ShoppingCart,
    ChevronLeft, CreditCard
} from 'lucide-react';
import * as signalR from '@microsoft/signalr';
import { publicApi } from '../../api/publicApi';
import { bookingApi } from '../../api/bookingApi';
import type { PublicSeatMap, PublicSeat, PublicPricing } from '../../types/public.types';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../api/axiosClient';

const BookingPage: React.FC = () => {
    const { scheduleId } = useParams<{ scheduleId: string }>();
    const navigate = useNavigate();
    const { theme } = useTheme();

    const [seatMap, setSeatMap] = useState<PublicSeatMap | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<PublicSeat[]>([]);
    const [seatSegmentMap, setSeatSegmentMap] = useState<Record<string, string>>({}); // seatId -> userSegmentId
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pricing, setPricing] = useState<PublicPricing | null>(null);

    const [userName, setUserName] = useState<string>('Guest');
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });


    const [hubConnection, setHubConnection] = useState<signalR.HubConnection | null>(null);
    const [lockedSeats, setLockedSeats] = useState<Record<string, string>>({});

    useEffect(() => {
        const storedUser = localStorage.getItem('user_info');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setUserName(user.username || user.userName || 'Guest');
            setIsLoggedIn(true);
        } else {
            setUserName('Guest');
            setIsLoggedIn(false);
        }

        if (scheduleId) {
            fetchData();

            // Set up SignalR
            const connection = new signalR.HubConnectionBuilder()
                .withUrl(`${API_BASE_URL}/ws/seat`, {
                    transport: signalR.HttpTransportType.ServerSentEvents
                })
                .withAutomaticReconnect()
                .build();

            const startConnection = async () => {
                try {
                    await connection.start();
                    console.log("SignalR Connected.");
                    await connection.invoke("JoinSchedule", scheduleId);

                    connection.on("OnSeatSelected", (seatId: string, userName: string) => {
                        console.log(`Seat ${seatId} currently selected by ${userName}`);
                        setLockedSeats(prev => ({ ...prev, [seatId]: userName }));
                    });

                    connection.on("OnSeatUnselected", (seatId: string) => {
                        console.log(`Seat ${seatId} unselected`);
                        setLockedSeats(prev => {
                            const next = { ...prev };
                            delete next[seatId];
                            return next;
                        });
                    });

                    setHubConnection(connection);
                } catch (err) {
                    console.error("SignalR Connection Error:", err);
                }
            };

            startConnection();

            return () => {
                if (connection.state === signalR.HubConnectionState.Connected) {
                    connection.invoke("LeaveSchedule", scheduleId)
                        .then(() => connection.stop())
                        .catch(err => console.error("Error leaving schedule:", err));
                }
            };
        }
    }, [scheduleId]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [seatRes, priceRes] = await Promise.all([
                publicApi.getSeatMap(scheduleId!),
                publicApi.getPricing(scheduleId!)
            ]);
            setSeatMap(seatRes.data);
            setPricing(priceRes.data);

        } catch (err) {
            setError('Failed to load booking information.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSeat = async (seat: PublicSeat) => {
        if (seat.isOccupied) return;

        const isCurrentlySelected = selectedSeats.find(s => s.seatId === seat.seatId);
        
        // Nếu không phải là ghế mình đang chọn mà bị người khác khóa thì bỏ qua
        if (!isCurrentlySelected && lockedSeats[seat.seatId]) return;

        if (isCurrentlySelected) {
            setSelectedSeats(prev => prev.filter(s => s.seatId !== seat.seatId));
            setSeatSegmentMap(prev => {
                const next = { ...prev };
                delete next[seat.seatId];
                return next;
            });
            if (hubConnection && hubConnection.state === signalR.HubConnectionState.Connected) {
                try {
                    await hubConnection.invoke("UnselectSeat", scheduleId, seat.seatId);
                } catch (err) {
                    console.error("Error unselecting seat", err);
                }
            }
        } else {
            if (selectedSeats.length >= 8) {
                toast.error('Maximum 8 seats per booking');
                return;
            }
            setSelectedSeats(prev => [...prev, seat]);
            // Initial segment should be the first one in the list (Adult usually)
            if (pricing && pricing.segmentPrices.length > 0) {
                setSeatSegmentMap(prev => ({ ...prev, [seat.seatId]: pricing.segmentPrices[0].userSegmentId }));
            }

            if (hubConnection && hubConnection.state === signalR.HubConnectionState.Connected) {
                try {
                    await hubConnection.invoke("SelectSeat", scheduleId, seat.seatId, userName);
                } catch (err) {
                    console.error("Error selecting seat", err);
                }
            }
        }

    };

    const handleBooking = async () => {
        if (selectedSeats.length === 0) {
            toast.error('Please select at least one seat');
            return;
        }

        if (!isLoggedIn) {
            if (!customerInfo.name.trim() || !customerInfo.email.trim() || !customerInfo.phone.trim()) {
                toast.error('Please provide name, email and phone number');
                return;
            }
        }

        setBookingLoading(true);
        try {
            const payload: any = {
                scheduleId: scheduleId!.trim(),
                seatSelections: selectedSeats.map(s => ({
                    seatId: s.seatId,
                    userSegmentId: seatSegmentMap[s.seatId]
                })),
                customerName: isLoggedIn ? undefined : customerInfo.name.trim(),
                customerEmail: isLoggedIn ? undefined : customerInfo.email.trim(),
                customerPhone: isLoggedIn ? undefined : customerInfo.phone.trim(),
                customerAddress: isLoggedIn ? undefined : customerInfo.address.trim()
            };

            const res = await bookingApi.createBooking(payload);

            if (res.data.paymentUrl) {
                // Open VNPay URL
                window.location.href = res.data.paymentUrl;
            } else {
                toast.error('Booking failed: No payment URL received');
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Booking failed';
            toast.error(errorMsg);
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
                <Loader2 className="w-12 h-12 animate-spin text-red-600" />
            </div>
        );
    }

    if (error || !seatMap) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <p className="text-xl font-bold mb-4">{error || 'Schedule not found'}</p>
                <button onClick={() => navigate('/home')} className="px-6 py-2 bg-red-600 text-white rounded-lg">Go Home</button>
            </div>
        );
    }

    // Calculate total
    const totalPrice = selectedSeats.reduce((sum, seat) => {
        const segmentId = seatSegmentMap[seat.seatId];
        const segment = pricing?.segmentPrices.find(s => s.userSegmentId === segmentId);
        return sum + (segment?.finalPrice || 0);
    }, 0);


    return (
        <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-black text-white' : theme === 'modern' ? 'bg-[#0D081D] text-white' : 'bg-gray-50 text-gray-900'}`}>
            {/* Header */}
            <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b h-16 flex items-center px-4 sm:px-6 ${theme === 'dark' ? 'bg-black/80 border-gray-800' : theme === 'modern' ? 'bg-[#0E0A20]/90 border-indigo-500/30' : 'bg-white/80 border-gray-200'}`}>
                <button onClick={() => navigate(-1)} className="p-2 mr-4 hover:bg-white/10 rounded-lg transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div>
                    <h2 className="font-black truncate">{seatMap.movieName}</h2>
                    <p className="text-xs opacity-60">
                        {seatMap.formatName} • {seatMap.auditoriumNumber} • {new Date(seatMap.startTime).toLocaleString('vi-VN', {
                            weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                        })}
                    </p>
                </div>
            </header>

            <main className="pt-24 pb-32 container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    {/* Seat Map */}
                    <div className="lg:col-span-3">
                        <div className="flex flex-col items-center">
                            {/* Screen */}
                            <div className="w-full max-w-2xl mb-20 relative">
                                <div className={`h-2 rounded-full shadow-[0_15px_40px_rgba(239,68,68,0.5)] ${theme === 'modern' ? 'bg-cyan-400 shadow-cyan-400/50' : 'bg-gray-400'}`} />
                                <p className="text-center text-xs font-bold uppercase tracking-widest mt-4 opacity-40">Screen</p>
                            </div>

                            {/* Seats Grid */}
                            <div className="inline-grid gap-2" style={{
                                gridTemplateColumns: `repeat(${Math.max(...(seatMap.seats?.map(s => s.colIndex) || [0])) + 1}, minmax(0, 1fr))`
                            }}>
                                {seatMap.seats?.map((seat) => {
                                    const isSelected = selectedSeats.find(s => s.seatId === seat.seatId);
                                    const lockedBy = lockedSeats[seat.seatId];
                                    const isLockedByOther = lockedBy && !isSelected;

                                    return (
                                        <button
                                            key={seat.seatId}
                                            disabled={seat.isOccupied || !!isLockedByOther}
                                            onClick={() => toggleSeat(seat)}
                                            className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all ${seat.isOccupied
                                                ? 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-30'
                                                : isLockedByOther
                                                    ? 'bg-yellow-600 border border-yellow-500 text-white cursor-not-allowed opacity-80'
                                                    : isSelected
                                                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 transform scale-110 z-10'
                                                        : theme === 'dark' ? 'bg-gray-900 border border-gray-800 hover:border-gray-500 text-gray-400' : 'bg-gray-100 border border-gray-300 hover:border-gray-500 text-gray-600'
                                                }`}
                                            title={isLockedByOther ? `Selected by ${lockedBy}` : seat.seatNumber}
                                        >
                                            <span className="text-[10px] font-bold">{seat.seatNumber}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="flex gap-4 sm:gap-6 mt-16 text-xs sm:text-sm flex-wrap justify-center">
                                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gray-900 border border-gray-800" /> Available</div>
                                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-600" /> Selected</div>
                                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-yellow-600" /> Locked</div>
                                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gray-800 opacity-30" /> Occupied</div>
                            </div>
                        </div>
                    </div>

                    {/* Booking Summary */}
                    <div className="lg:col-span-1">
                        <div className={`p-6 rounded-2xl border sticky top-24 ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : theme === 'modern' ? 'bg-white/5 border-indigo-500/20 shadow-xl' : 'bg-white border-gray-200 shadow-xl'}`}>
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                                <ShoppingCart className="w-5 h-5 text-red-600" /> Booking Summary
                            </h3>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-start">
                                    <span className="opacity-60 text-sm">Movie</span>
                                    <span className="font-bold text-right text-sm">{seatMap.movieName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="opacity-60">Venue</span>
                                    <span className="font-bold">{seatMap.auditoriumNumber}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="opacity-60">Format</span>
                                    <span className="font-bold">{seatMap.formatName}</span>
                                </div>
                                <div className="space-y-4">
                                    <span className="opacity-60 text-sm block">Selected Seats</span>
                                    {selectedSeats.length === 0 ? (
                                        <p className="text-xs italic opacity-40">No seats selected yet</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {selectedSeats.map(seat => (
                                                <div key={seat.seatId} className={`p-3 rounded-xl border transition-all ${
                                                    theme === 'dark' ? 'bg-black/40 border-gray-800' : 
                                                    theme === 'modern' ? 'bg-white/5 border-white/10' : 
                                                    'bg-gray-50 border-gray-200'
                                                }`}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-bold text-red-600">Seat {seat.seatNumber}</span>
                                                        <span className="text-sm font-black">
                                                            {(pricing?.segmentPrices.find(s => s.userSegmentId === seatSegmentMap[seat.seatId])?.finalPrice || 0).toLocaleString('vi-VN')}đ
                                                        </span>
                                                    </div>
                                                    <select
                                                        value={seatSegmentMap[seat.seatId]}
                                                        onChange={(e) => setSeatSegmentMap(prev => ({ ...prev, [seat.seatId]: e.target.value }))}
                                                        className={`w-full bg-transparent border-none text-xs opacity-80 focus:ring-0 cursor-pointer ${
                                                            theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'
                                                        }`}
                                                    >
                                                        {pricing?.segmentPrices.map(segment => (
                                                            <option key={segment.userSegmentId} value={segment.userSegmentId} className="bg-gray-900 text-white">
                                                                {segment.segmentName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </div>

                            <div className="pt-4 border-t border-dashed border-white/20 mb-8">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="opacity-60 text-sm">Total Price</span>
                                    <span className="text-2xl font-black text-red-600">{totalPrice.toLocaleString('vi-VN')}đ</span>
                                </div>
                                <p className="text-[10px] opacity-40 text-right">Inclusives of all taxes</p>
                            </div>

                            {!isLoggedIn ? (
                                <div className={`space-y-4 mb-6 p-5 rounded-xl border transition-all ${
                                    theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 
                                    theme === 'modern' ? 'bg-white/5 border-indigo-500/20 shadow-xl backdrop-blur-md' : 
                                    'bg-white border-gray-200'
                                }`}>
                                    <p className={`text-xs font-bold uppercase tracking-wider ${
                                        theme === 'dark' ? 'text-gray-400' : 
                                        theme === 'modern' ? 'text-indigo-300' : 
                                        'text-gray-500'
                                    }`}>Guest Information</p>
                                    <div className="space-y-3">
                                        <input 
                                            type="text" 
                                            placeholder="Full Name *" 
                                            value={customerInfo.name}
                                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                                            className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all border ${
                                                theme === 'dark' ? 'bg-black/40 border-gray-700 text-white focus:border-red-600' : 
                                                theme === 'modern' ? 'bg-white/5 border-white/10 text-white focus:border-cyan-400' : 
                                                'bg-gray-50 border-gray-300 text-gray-900 focus:border-red-600 focus:bg-white'
                                            }`}
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <input 
                                                type="email" 
                                                placeholder="Email Address *" 
                                                value={customerInfo.email}
                                                onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                                                className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all border ${
                                                    theme === 'dark' ? 'bg-black/40 border-gray-700 text-white focus:border-red-600' : 
                                                    theme === 'modern' ? 'bg-white/5 border-white/10 text-white focus:border-cyan-400' : 
                                                    'bg-gray-50 border-gray-300 text-gray-900 focus:border-red-600 focus:bg-white'
                                                }`}
                                            />
                                            <input 
                                                type="tel" 
                                                placeholder="Phone Number *" 
                                                value={customerInfo.phone}
                                                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                                                className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all border ${
                                                    theme === 'dark' ? 'bg-black/40 border-gray-700 text-white focus:border-red-600' : 
                                                    theme === 'modern' ? 'bg-white/5 border-white/10 text-white focus:border-cyan-400' : 
                                                    'bg-gray-50 border-gray-300 text-gray-900 focus:border-red-600 focus:bg-white'
                                                }`}
                                            />
                                        </div>
                                        <input 
                                            type="text" 
                                            placeholder="Address (Optional)" 
                                            value={customerInfo.address}
                                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                                            className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all border ${
                                                theme === 'dark' ? 'bg-black/40 border-gray-700 text-white focus:border-red-600' : 
                                                theme === 'modern' ? 'bg-white/5 border-white/10 text-white focus:border-cyan-400' : 
                                                'bg-gray-50 border-gray-300 text-gray-900 focus:border-red-600 focus:bg-white'
                                            }`}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className={`mb-8 p-4 rounded-xl border transition-all ${
                                    theme === 'dark' ? 'bg-red-600/5 border-red-600/20' : 
                                    theme === 'modern' ? 'bg-indigo-500/5 border-indigo-500/20 shadow-lg' : 
                                    'bg-red-50 border-red-100'
                                }`}>
                                    <p className={`text-xs text-center ${
                                        theme === 'dark' || theme === 'modern' ? 'opacity-60' : 'text-gray-600'
                                    }`}>
                                        Booking as <span className="font-bold text-red-600">{userName}</span>. 
                                        Your details will be retrieved from your profile.
                                    </p>
                                </div>
                            )}

                            <button
                                disabled={selectedSeats.length === 0 || bookingLoading}
                                onClick={handleBooking}
                                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${selectedSeats.length > 0
                                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30'
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                {bookingLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CreditCard className="w-5 h-5" /> Proceed to Pay</>}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default BookingPage;
