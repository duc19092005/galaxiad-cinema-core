import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Users, Loader2, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';
import { socialBookingApi } from '../../api/socialBookingApi';
import { showError, showSuccess } from '../../utils/ToastUtils';

interface CreateGroupBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleId: string;
}

type ModalStep = 'choice' | 'form' | 'schedule' | 'schedule_success';

export default function CreateGroupBookingModal({ isOpen, onClose, scheduleId }: CreateGroupBookingModalProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState<ModalStep>('choice');
  const [groupName, setGroupName] = useState('');
  const [maxMembers, setMaxMembers] = useState(4);
  const [loading, setLoading] = useState(false);

  // Mock schedule state
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setStep('choice');
    setGroupName('');
    setMaxMembers(4);
    setScheduleDate('');
    setScheduleTime('');
    onClose();
  };

  const handleCreateImmediate = async () => {
    try {
      setLoading(true);
      const res = await socialBookingApi.createGroup({
        scheduleId,
        groupName: groupName.trim() || undefined,
        maxMembers,
      });
      if (res.isSuccess && res.data) {
        showSuccess(t('socialBooking.createSuccess', 'Tạo phòng đặt chung thành công!'));
        // Redirect straight to Shared Booking page with autoShowQR state
        navigate(`/group-booking/${res.data.groupCode}`, { state: { autoShowQR: true } });
        handleClose();
      } else {
        showError(res.message || t('socialBooking.errorCreateGroup', 'Không thể tạo nhóm'));
      }
    } catch {
      showError(t('socialBooking.errorCreateGroup', 'Không thể tạo nhóm'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSchedule = () => {
    if (!scheduleDate || !scheduleTime) {
      showError('Vui lòng chọn ngày và giờ lên lịch.');
      return;
    }
    setStep('schedule_success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-[#131316] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transition-all duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ff8a00]/20 flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-[#ff8a00]" />
            </div>
            <h2 className="text-base font-bold text-white tracking-wide">
              {step === 'choice' && 'Tùy Chọn Đặt Vé Nhóm'}
              {step === 'form' && 'Tạo Phòng Đặt Chung'}
              {step === 'schedule' && 'Lên Lịch Đặt Vé Chung'}
              {step === 'schedule_success' && 'Lên Lịch Thành Công'}
            </h2>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {step === 'choice' && (
            <div className="space-y-4">
              <p className="text-white/60 text-sm text-center mb-2">
                Hãy lựa chọn phương thức hoạt động cho nhóm đặt vé chung của bạn:
              </p>
              
              {/* Option: Create Now */}
              <button
                onClick={() => setStep('form')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-[#ff8a00]/10 hover:border-[#ff8a00]/20 text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#ff8a00]/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5 text-[#ff8a00]" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Đặt vé chung ngay bây giờ</h4>
                  <p className="text-xs text-white/40 mt-1">
                    Tạo phòng ngay lập tức, hiển thị mã QR mời bạn bè và vào phòng đặt ghế trực tiếp.
                  </p>
                </div>
              </button>

              {/* Option: Schedule */}
              <button
                onClick={() => setStep('schedule')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-blue-500/10 hover:border-blue-500/20 text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Lên lịch đặt vé chung</h4>
                  <p className="text-xs text-white/40 mt-1">
                    Hẹn giờ lên lịch cùng nhau chọn ghế, hệ thống sẽ gửi thông báo nhắc nhở khi đến giờ. (Demo)
                  </p>
                </div>
              </button>
            </div>
          )}

          {step === 'form' && (
            <div className="space-y-5">
              {/* Group Name */}
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Tên Nhóm</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ví dụ: Nhóm bạn thân, Gia đình..."
                  maxLength={150}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#ff8a00]/50 focus:ring-1 focus:ring-[#ff8a00]/30 transition-colors text-sm"
                />
              </div>

              {/* Max Members */}
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Số Thành Viên Tối Đa</label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <button
                      key={n}
                      onClick={() => setMaxMembers(n)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        maxMembers === n
                          ? 'bg-[#ff8a00] text-black shadow-lg shadow-[#ff8a00]/20'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'schedule' && (
            <div className="space-y-4">
              {/* Group Name */}
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Tên Nhóm Lên Lịch</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ví dụ: Lên lịch coi phim cuối tuần..."
                  maxLength={150}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Date Picker */}
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">Chọn Ngày</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 text-xs"
                  />
                </div>
                {/* Time Picker */}
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">Chọn Giờ</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 text-xs"
                  />
                </div>
              </div>

              {/* Max Members */}
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Số Thành Viên Dự Kiến</label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <button
                      key={n}
                      onClick={() => setMaxMembers(n)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        maxMembers === n
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'schedule_success' && (
            <div className="flex flex-col items-center text-center p-6 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce" />
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Lên Lịch Thành Công!</h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  Phòng đặt chung cho nhóm <strong className="text-white">{groupName || 'Tên nhóm'}</strong> đã được lên lịch vào lúc{' '}
                  <span className="text-blue-400 font-semibold">{scheduleTime}</span> ngày{' '}
                  <span className="text-blue-400 font-semibold">{scheduleDate}</span>.
                </p>
                <p className="text-[10px] text-white/35">
                  (Phiên bản Demo - Hệ thống sẽ tự động gửi thông báo đến các thành viên trong thời gian thực)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex gap-3">
          {step === 'choice' && (
            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl bg-white/5 text-white/70 font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              Đóng
            </button>
          )}

          {step === 'form' && (
            <>
              <button
                onClick={() => setStep('choice')}
                className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/70 font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                Quay lại
              </button>
              <button
                onClick={handleCreateImmediate}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-[#ff8a00] text-black font-bold text-sm hover:bg-[#e17600] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Tạo Ngay
              </button>
            </>
          )}

          {step === 'schedule' && (
            <>
              <button
                onClick={() => setStep('choice')}
                className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/70 font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                Quay lại
              </button>
              <button
                onClick={handleConfirmSchedule}
                className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition-colors"
              >
                Xác nhận
              </button>
            </>
          )}

          {step === 'schedule_success' && (
            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition-colors"
            >
              Hoàn tất
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
