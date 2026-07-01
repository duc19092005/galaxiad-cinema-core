import { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface Props {
  expiresAt?: string;
  onExpire?: () => void;
}

export default function CountdownTimer({ expiresAt, onExpire }: Props) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    if (!expiresAt) return;
    hasExpiredRef.current = false;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(expiresAt).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('00:00');
        clearInterval(interval);
        // Gọi onExpire chỉ 1 lần
        if (!hasExpiredRef.current) {
          hasExpiredRef.current = true;
          onExpire?.();
        }
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (!expiresAt) return null;

  const isUrgent = timeLeft && parseInt(timeLeft.split(':')[0]) < 5;

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono ${
      isUrgent ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/60'
    }`}>
      <Clock className="w-4 h-4" />
      <span>{timeLeft || '--:--'}</span>
    </div>
  );
}
