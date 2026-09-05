import React from 'react';
import { useTranslation } from 'react-i18next';
import { Navigation, Search } from 'lucide-react';
import type {
  BookingDraft,
  BookingPathMode,
  ChatAction,
  ChoiceOption,
  CinemaOption,
  DiscoveryMode,
  GuestContact,
  NormalizedSeat,
  ShowtimeOption,
  ShowtimePickMode,
} from '../types/chatbot.types';
import type {
  ActiveMovie,
  PublicGenre,
  PublicSegmentPrice,
} from '../../../types/public.types';
import type { UserVoucherDto, VoucherDto } from '../../../api/voucherApi';
import { ChoicePicker } from './ActionCards/ChoicePicker';
import { GenrePicker } from './ActionCards/GenrePicker';
import { MoviePicker } from './ActionCards/MoviePicker';
import { DatePicker } from './ActionCards/DatePicker';
import { CinemaPicker } from './ActionCards/CinemaPicker';
import { ShowtimePreferencePicker } from './ActionCards/ShowtimePreferencePicker';
import { ShowtimePicker } from './ActionCards/ShowtimePicker';
import { SegmentQuantityPicker } from './ActionCards/SegmentQuantityPicker';
import { SeatSuggestionCard } from './ActionCards/SeatSuggestionCard';
import { VoucherPicker } from './ActionCards/VoucherPicker';
import { GuestContactForm } from './ActionCards/GuestContactForm';
import { BookingSummaryCard } from './ActionCards/BookingSummaryCard';
import { PaymentStatusCard } from './ActionCards/PaymentStatusCard';
import { TicketCard } from './ActionCards/TicketCard';
import { RequestLocationCard } from './ActionCards/RequestLocationCard';

export const ChatActionRenderer: React.FC<{
  action: ChatAction;
  draft: BookingDraft;
  onPickBookingPath: (mode: BookingPathMode) => void;
  onPickDiscoveryMode: (mode: DiscoveryMode) => void;
  onPickGenre: (genre: PublicGenre) => void;
  onPickMovie: (movie: ActiveMovie) => void;
  onPickDate: (date: string) => void;
  onPickCinema: (cinema: CinemaOption) => void;
  onPickShowtimePreference: (mode: ShowtimePickMode, showtimes: ShowtimeOption[]) => void;
  onPickShowtime: (showtime: ShowtimeOption) => void;
  onPickSegment: (segment: PublicSegmentPrice, quantity: number) => void;
  onAcceptSeats: (seats?: NormalizedSeat[]) => void;
  onRetrySeats: () => void;
  onVoucherMode: (mode: 'owned' | 'redeem' | 'skip') => void;
  onPickOwnedVoucher: (voucher: UserVoucherDto) => void;
  onRedeemVoucher: (voucher: VoucherDto) => void;
  onGuestContact: (contact: GuestContact) => void;
  onConfirmBooking: () => void;
  onOpenPayment: () => void;
  onCheckPayment: () => void;
  paymentChecking: boolean;
  onShareLocation: () => void;
  onManualLocation: () => void;
}> = ({
  action,
  draft,
  onPickBookingPath,
  onPickDiscoveryMode,
  onPickGenre,
  onPickMovie,
  onPickDate,
  onPickCinema,
  onPickShowtimePreference,
  onPickShowtime,
  onPickSegment,
  onAcceptSeats,
  onRetrySeats,
  onVoucherMode,
  onPickOwnedVoucher,
  onRedeemVoucher,
  onGuestContact,
  onConfirmBooking,
  onOpenPayment,
  onCheckPayment,
  paymentChecking,
  onShareLocation,
  onManualLocation,
}) => {
  const { t } = useTranslation();
  const bookingPathOptions: ChoiceOption[] = action.payload?.options || [
    { value: 'movieFirst', label: t('chatbot.bookingPathMovie'), description: t('chatbot.bookingPathMovieDesc') },
    { value: 'cinemaFirst', label: t('chatbot.bookingPathCinema'), description: t('chatbot.bookingPathCinemaDesc') },
  ];
  const discoveryModeOptions: ChoiceOption[] = action.payload?.options || [
    { value: 'genreFirst', label: t('chatbot.discoveryGenre'), description: t('chatbot.discoveryGenreDesc') },
    { value: 'timeFirst', label: t('chatbot.discoveryTime'), description: t('chatbot.discoveryTimeDesc') },
  ];

  switch (action.type) {
    case 'bookingPathPicker':
      return (
        <ChoicePicker
          title={t('chatbot.bookingPathPicker')}
          icon={<Navigation size={13} />}
          options={bookingPathOptions}
          onPick={(value) => onPickBookingPath(value === 'cinemaFirst' ? 'cinemaFirst' : 'movieFirst')}
        />
      );
    case 'discoveryModePicker':
      return (
        <ChoicePicker
          title={t('chatbot.discoveryModePicker')}
          icon={<Search size={13} />}
          options={discoveryModeOptions}
          onPick={(value) => onPickDiscoveryMode(value === 'timeFirst' ? 'timeFirst' : 'genreFirst')}
        />
      );
    case 'genrePicker':
      return <GenrePicker genres={action.payload?.genres || []} onPick={onPickGenre} />;
    case 'moviePicker':
      return <MoviePicker movies={action.payload?.movies || []} onPick={onPickMovie} />;
    case 'datePicker':
      return <DatePicker dates={action.payload?.dates || []} onPick={onPickDate} />;
    case 'cinemaPicker':
      return <CinemaPicker cinemas={action.payload?.cinemas || []} onPick={onPickCinema} />;
    case 'showtimePreferencePicker':
      return <ShowtimePreferencePicker onPick={(mode) => onPickShowtimePreference(mode, action.payload?.showtimes || [])} />;
    case 'showtimePicker':
      return <ShowtimePicker showtimes={action.payload?.showtimes || []} mode={action.payload?.mode || 'time'} onPick={onPickShowtime} />;
    case 'segmentQuantityPicker':
      return action.payload?.pricing ? <SegmentQuantityPicker pricing={action.payload.pricing} ageRestriction={action.payload.pricing.ageRestriction} onPick={onPickSegment} /> : null;
    case 'seatSuggestion':
      return <SeatSuggestionCard seatMap={draft.seatMap} seats={draft.suggestedSeats} quantity={draft.quantity} onAccept={onAcceptSeats} onRetry={onRetrySeats} />;
    case 'voucherPicker':
      return (
        <VoucherPicker
          mode={action.payload.mode}
          vouchers={action.payload.vouchers || []}
          redeemableVouchers={action.payload.redeemableVouchers || []}
          rewardPoints={action.payload.rewardPoints || 0}
          onChooseMode={onVoucherMode}
          onPickOwned={onPickOwnedVoucher}
          onRedeem={onRedeemVoucher}
        />
      );
    case 'guestContact':
      return <GuestContactForm initial={draft.guestContact} onSubmit={onGuestContact} />;
    case 'bookingSummary':
      return <BookingSummaryCard draft={draft} onConfirm={onConfirmBooking} />;
    case 'paymentAction':
      return <PaymentStatusCard paymentUrl={draft.paymentUrl} loading={paymentChecking} onOpen={onOpenPayment} onCheck={onCheckPayment} />;
    case 'ticketCard':
      return draft.ticket ? <TicketCard ticket={draft.ticket} /> : null;
    case 'requestLocation':
      return <RequestLocationCard onShare={onShareLocation} onManual={onManualLocation} />;
    default:
      return null;
  }
};
