import { useEffect, useRef } from 'react';
import { Home, Share2, CheckCircle2, Calendar, MapPin, Film } from 'lucide-react';
import type { GroupBookingState } from '../../types/socialBooking.types';

interface Props {
  groupState: GroupBookingState;
}

export default function GroupSuccessView({ groupState }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const activeMembers = groupState.members?.filter(m => m.status !== 'Removed') || [];
  const memberColors = [
    '#3b82f6', '#22c55e', '#a855f7', '#f59e0b',
    '#06b6d4', '#ec4899', '#e17600', '#ef4444'
  ];

  // Confetti effect
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    const colors = ['#ff9500', '#34C759', '#ffbd7f', '#ffffff'];
    const particles: HTMLDivElement[] = [];

    const createParticle = () => {
      const particle = document.createElement('div');
      const size = Math.random() * 8 + 4;
      particle.style.cssText = `
        position: fixed; left: ${Math.random() * 100}vw; top: -20px;
        width: ${size}px; height: ${size}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: 50%; z-index: 100; opacity: 0.7; pointer-events: none;
      `;
      document.body.appendChild(particle);
      particles.push(particle);

      const animation = particle.animate([
        { transform: 'translateY(0) rotate(0deg)', opacity: 0.7 },
        { transform: `translateY(110vh) rotate(${Math.random() * 360}deg)`, opacity: 0 }
      ], { duration: Math.random() * 3000 + 2000, easing: 'linear' });

      animation.onfinish = () => {
        particle.remove();
        const idx = particles.indexOf(particle);
        if (idx > -1) particles.splice(idx, 1);
      };
    };

    for (let i = 0; i < 50; i++) {
      setTimeout(createParticle, Math.random() * 1000);
    }

    return () => { particles.forEach(p => p.remove()); };
  }, []);

  const formatStartTime = () => {
    try {
      const d = new Date(groupState.startTime);
      return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }) +
        ', ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch { return groupState.startTime; }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/group-booking/${groupState.groupCode}`);
  };

  return (
    <div ref={canvasRef} className="w-full max-w-4xl mx-auto flex flex-col items-center py-8">
      {/* Celebration Header */}
      <section className="text-center mb-10 w-full py-10 rounded-3xl relative overflow-hidden"
        style={{ background: 'radial-gradient(circle at center, rgba(255,149,0,0.1) 0%, transparent 70%)' }}>
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 bg-[#34C759] rounded-full flex items-center justify-center"
            style={{ boxShadow: '0 0 30px rgba(52,199,89,0.4)', animation: 'float 4s ease-in-out infinite' }}>
            <CheckCircle2 className="w-10 h-10 text-white" fill="white" />
          </div>
        </div>
        <h1 className="text-[24px] md:text-[32px] font-semibold text-[#e3e2e7] mb-3">
          Thanh toan thanh cong!
        </h1>
        <p className="text-[16px] text-[#dbc2ad] max-w-md mx-auto">
          Ve da duoc gui toi tung thanh vien. Hay chuan bi bap rang bo cho buoi chieu toi nay!
        </p>
      </section>

      {/* Movie Overview */}
      <div className="w-full bg-[#1a1b1f]/60 backdrop-blur-xl border border-[#554334]/20 rounded-2xl p-5 mb-8 flex flex-col md:flex-row gap-5 items-center">
        <div className="w-20 h-28 rounded-lg bg-[#343539] overflow-hidden shrink-0">
          {groupState.movieImageUrl ? (
            <img src={groupState.movieImageUrl} alt={groupState.movieName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-8 h-8 text-[#dbc2ad]/30" />
            </div>
          )}
        </div>
        <div className="flex-grow text-center md:text-left">
          <h2 className="text-[18px] font-semibold text-[#ffbd7f]">{groupState.movieName}</h2>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2 text-[#dbc2ad]">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">{formatStartTime()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {groupState.auditoriumNumber} • {groupState.cinemaName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full mb-10">
        {activeMembers.map((member, i) => {
          const seatNumbers = member.selectedSeats?.map(s => s.seatNumber).join(', ') || '';
          const isHostMember = member.isHost;
          const color = memberColors[i % memberColors.length];

          return (
            <div
              key={member.memberId}
              className="bg-[#1a1b1f]/60 backdrop-blur-xl border border-[#554334]/20 p-5 rounded-2xl flex flex-col items-center relative overflow-hidden"
              style={isHostMember ? { borderColor: 'rgba(255,149,0,0.3)' } : {}}
            >
              {/* Ticket cutout effect */}
              <div className="absolute top-1/2 -translate-y-1/2 -left-[13px] w-6 h-6 rounded-full" style={{ background: '#121317' }} />
              <div className="absolute top-1/2 -translate-y-1/2 -right-[13px] w-6 h-6 rounded-full" style={{ background: '#121317' }} />

              {/* Avatar */}
              <div className="relative mb-3">
                <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${isHostMember ? 'border-[#ff9500]' : 'border-[#554334]/40'}`}>
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.userName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm" style={{ background: color }}>
                      {member.userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {isHostMember && (
                  <div className="absolute -bottom-1 -right-1 bg-[#ff9500] text-[#4b2800] rounded-full px-1.5 py-0.5 text-[8px] font-bold">
                    HOST
                  </div>
                )}
              </div>

              {/* Name & Seat */}
              <div className="text-center mb-4">
                <p className="text-[11px] font-bold text-[#ffbd7f] uppercase tracking-wider mb-0.5">{member.userName}</p>
                <p className="text-[20px] font-semibold text-[#e3e2e7] tracking-widest">{seatNumbers}</p>
              </div>

              {/* QR Code placeholder */}
              <div className="bg-white p-2 rounded-lg mb-3">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(`TICKET-${groupState.groupCode}-${member.memberId}`)}`}
                  alt="Ticket QR"
                  className="w-20 h-20"
                />
              </div>

              <p className="text-[10px] font-bold text-[#dbc2ad]/50 uppercase tracking-wider">
                Nhom: #{groupState.groupCode}
              </p>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row gap-3 w-full justify-center">
        <button
          onClick={handleShare}
          className="px-8 py-3 rounded-full border border-[#554334]/40 text-[#e3e2e7] text-[12px] font-bold uppercase tracking-wider hover:bg-[#343539]/40 transition-colors flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Chia se nhom
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="px-10 py-3 rounded-full bg-[#ff9500] text-[#4b2800] text-[15px] font-semibold hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          style={{ boxShadow: '0 0 30px rgba(52,199,89,0.2)' }}
        >
          <Home className="w-4 h-4" />
          Ve trang chu
        </button>
      </div>
    </div>
  );
}
