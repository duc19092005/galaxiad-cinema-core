// src/features/public/components/QuickBookingBar.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { publicApi } from '../../../api/publicApi';
import type { ActiveCinema, ActiveMovie, NearestCinema } from '../../../types/public.types';
import CustomSelectField from './CustomSelectField';

interface QuickBookingBarProps {
  selectedCity: string;
}

// City center coordinates for distance calculation
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Hồ Chí Minh': { lat: 10.8231, lng: 106.6297 },
  'Hà Nội': { lat: 21.0285, lng: 105.8542 },
};

const QuickBookingBar: React.FC<QuickBookingBarProps> = ({ selectedCity }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMovieId, setSelectedMovieId] = useState<string>('All');
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>('All');
  const [cinemas, setCinemas] = useState<ActiveCinema[]>([]);
  const [movies, setMovies] = useState<ActiveMovie[]>([]);
  const [dateList, setDateList] = useState<{ label: string; value: string; dayName: string }[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // Nearest cinemas (auto-fetched by city)
  const [nearestCinemas, setNearestCinemas] = useState<NearestCinema[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Reset cinema selection when city changes
  useEffect(() => {
    setSelectedCinemaId('All');
  }, [selectedCity]);

  // Auto-fetch nearest cinemas when selectedCity changes
  useEffect(() => {
    if (!selectedCity) {
      // No city selected → fall back to active cinemas list
      setNearestCinemas([]);
      return;
    }

    const coords = CITY_COORDS[selectedCity];
    if (!coords) {
      setNearestCinemas([]);
      return;
    }

    setLoadingLocation(true);
    publicApi.getNearestCinemas(coords.lat, coords.lng)
      .then((res) => {
        if (res.isSuccess && res.data) {
          // Filter cinemas that belong to the selected city
          const filtered = res.data.filter((c) =>
            c.cinemaLocation?.toLowerCase().includes(selectedCity.toLowerCase())
          );
          setNearestCinemas(filtered);
        } else {
          setNearestCinemas([]);
        }
      })
      .catch((err) => {
        console.error('Failed to load nearest cinemas:', err);
        setNearestCinemas([]);
      })
      .finally(() => setLoadingLocation(false));
  }, [selectedCity]);

  // Fetch available dates from API
  useEffect(() => {
    const fetchDates = async () => {
      try {
        const res = await publicApi.getUpcomingDates({
          city: selectedCity || undefined
        });
        setAvailableDates(res.isSuccess ? (res.data || []) : []);
      } catch (err) {
        console.error('Error fetching upcoming dates:', err);
        setAvailableDates([]);
      }
    };
    fetchDates();
  }, [selectedCity]);

  // Generate date list from available dates
  useEffect(() => {
    const dates: { label: string; value: string; dayName: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateVal = String(d.getDate()).padStart(2, '0');
      const valueStr = `${year}-${month}-${dateVal}`;

      let dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      if (i === 0) dayName = 'Today';

      dates.push({
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        value: valueStr,
        dayName,
      });
    }

    // Only keep dates with schedules
    const filteredDates = dates.filter(d => availableDates.includes(d.value));
    const finalDates = filteredDates;

    setDateList(finalDates);
    if (finalDates.length > 0) {
      setSelectedDate(finalDates[0].value);
    } else {
      setSelectedDate('');
    }

    // Fetch master data for booking bar
    const fetchMasterData = async () => {
      try {
        const [cinemaRes, movieRes] = await Promise.all([
          publicApi.getActiveCinemas(),
          publicApi.getActiveMovies(),
        ]);
        if (cinemaRes.isSuccess) setCinemas(cinemaRes.data || []);
        if (movieRes.isSuccess) setMovies(movieRes.data || []);
      } catch (err) {
        console.error('Error fetching master data for booking bar:', err);
      }
    };
    fetchMasterData();
  }, [availableDates]);

  // 1. Date options
  const dateOptions = dateList.map((d) => ({
    value: d.value,
    label: `${d.label} (${d.dayName === 'Today' ? t('home.today', 'Today') : d.dayName})`,
  }));
  const selectedDateOption = dateList.find((d) => d.value === selectedDate);
  const selectedDateLabel = selectedDateOption
    ? `${selectedDateOption.label} (${selectedDateOption.dayName === 'Today' ? t('home.today', 'Today') : selectedDateOption.dayName})`
    : '';

  // 2. Movie options
  const movieOptions = [
    { value: 'All', label: t('home.allMovies', 'All Movies') },
    ...movies.map((m) => ({ value: m.movieId, label: m.movieName })),
  ];
  const selectedMovieLabel = movies.find((m) => m.movieId === selectedMovieId)?.movieName || t('home.allMovies', 'All Movies');

  // 3. Cinema options — always show nearest with km distance when city is selected
  const cinemaOptions = [
    { value: 'All', label: t('home.allCinemas', 'All Cinemas') },
    ...(nearestCinemas.length > 0
      ? nearestCinemas.map((c) => ({
          value: c.cinemaId,
          label: `${c.cinemaName} (${c.distanceInKm} km)`,
        }))
      : cinemas
          .filter((c) => !selectedCity || c.cinemaCity?.toLowerCase().includes(selectedCity.toLowerCase()))
          .map((c) => ({ value: c.cinemaId, label: c.cinemaName }))),
  ];

  const getSelectedCinemaLabel = () => {
    if (selectedCinemaId === 'All') return t('home.allCinemas', 'All Cinemas');
    if (nearestCinemas.length > 0) {
      const foundNearest = nearestCinemas.find((c) => c.cinemaId === selectedCinemaId);
      if (foundNearest) {
        return `${foundNearest.cinemaName} (${foundNearest.distanceInKm} km)`;
      }
    }
    return cinemas.find((c) => c.cinemaId === selectedCinemaId)?.cinemaName || t('home.allCinemas', 'All Cinemas');
  };
  const selectedCinemaLabel = getSelectedCinemaLabel();

  return (
    <div className="glass-card" style={{ padding: 8, borderRadius: 16 }}>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_180px] gap-2 items-stretch">

        {/* 1. Cinema Selector */}
        <CustomSelectField
          step="1"
          label={t('home.cinema')}
          value={selectedCinemaId}
          displayValue={loadingLocation ? t('home.loadingLocation', 'Locating...') : selectedCinemaLabel}
          options={cinemaOptions}
          onChange={setSelectedCinemaId}
        />

        {/* 2. Movie Selector */}
        <CustomSelectField
          step="2"
          label={t('home.movie')}
          value={selectedMovieId}
          displayValue={selectedMovieLabel}
          options={movieOptions}
          onChange={setSelectedMovieId}
          borderLeft={true}
        />

        {/* 3. Date Selector */}
        <CustomSelectField
          step="3"
          label={t('home.date')}
          value={selectedDate}
          displayValue={selectedDateLabel}
          options={dateOptions}
          onChange={setSelectedDate}
          borderLeft={true}
        />

        {/* Search Button */}
        <button
          onClick={() => navigate(`/showtimes?date=${selectedDate}&movie=${selectedMovieId}&cinema=${selectedCinemaId}`)}
          className="btn-primary cta-glow"
          style={{
            width: '100%',
            padding: '12px 24px',
            fontWeight: 700,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            minHeight: 48,
          }}
        >
          <Search size={16} />
          <span>{t('home.searchNow')}</span>
        </button>

      </div>
    </div>
  );
};

export default QuickBookingBar;
