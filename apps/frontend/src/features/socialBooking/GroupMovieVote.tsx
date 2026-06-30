import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Vote, Loader2 } from 'lucide-react';
import type { GroupBookingState, MovieVoteState } from '../../types/socialBooking.types';

interface Props {
  voteState: MovieVoteState | null;
  groupState: GroupBookingState;
  onVote: (scheduleId: string) => Promise<void>;
  isHost: boolean;
}

export default function GroupMovieVote({ voteState, onVote }: Props) {
  const { t } = useTranslation();
  const [voting, setVoting] = useState(false);

  const handleVote = async (scheduleId: string) => {
    setVoting(true);
    try {
      await onVote(scheduleId);
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Vote className="w-5 h-5 text-[#ff8a00]" />
        <h3 className="font-bold text-white">{t('socialBooking.voteTitle', 'Vote for Movie')}</h3>
      </div>

      {voteState?.winnerScheduleId && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
          <p className="text-sm text-green-400 font-medium">
            {t('socialBooking.voteWinner', 'Movie selected!')}{' '}
            {voteState.options.find(o => o.scheduleId === voteState.winnerScheduleId)?.movieName}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {voteState?.options.map((option) => {
          const totalVotes = voteState.options.reduce((sum, o) => sum + o.voteCount, 0);
          const percentage = totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;

          return (
            <div
              key={option.scheduleId}
              className="relative bg-white/5 border border-white/10 rounded-xl overflow-hidden"
            >
              <div
                className="absolute inset-0 bg-[#ff8a00]/10 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
              <div className="relative p-4 flex items-center gap-4">
                <img
                  src={option.movieImageUrl}
                  alt={option.movieName}
                  className="w-16 h-22 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="font-medium text-white">{option.movieName}</p>
                  <p className="text-xs text-white/40">
                    {new Date(option.startTime).toLocaleDateString()} {new Date(option.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    {option.voteCount} {t('socialBooking.votes', 'votes')}
                  </p>
                </div>
                <button
                  onClick={() => handleVote(option.scheduleId)}
                  disabled={voting}
                  className="px-4 py-2 bg-[#ff8a00] text-black rounded-xl text-sm font-bold hover:bg-[#ea580c] transition-colors disabled:opacity-50"
                >
                  {voting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Vote className="w-4 h-4" />}
                </button>
              </div>
            </div>
          );
        })}

        {(!voteState || voteState.options.length === 0) && (
          <div className="text-center py-8 text-white/30">
            {t('socialBooking.noVotes', 'No movie votes yet. Click vote on a showtime to start!')}
          </div>
        )}
      </div>
    </div>
  );
}
