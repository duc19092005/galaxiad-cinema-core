// src/components/ProximitySelectorModal.tsx
import React, { useState, useEffect } from 'react';
import { MapPin, X, Navigation, Locate, AlertCircle, Check } from 'lucide-react';
import { publicApi } from '../api/publicApi';
import type { ActiveCinema } from '../types/public.types';
import { showSuccess, showError } from '../utils/ToastUtils';

interface ProximitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCinema?: (cinema: ActiveCinema & { city?: string }) => void;
}

// Coordinates for seeded cinemas
const MOCK_CINEMA_COORDINATES: Record<string, { lat: number; lng: number; city: string }> = {
  'Galaxy Cinema Nguyễn Du': { lat: 10.7725, lng: 106.6961, city: 'Hồ Chí Minh' },
  'Galaxy Cinema Nguy?n Du': { lat: 10.7725, lng: 106.6961, city: 'Hồ Chí Minh' },
  'BHD Star Bitexco': { lat: 10.7716, lng: 106.7044, city: 'Hồ Chí Minh' },
  'Lotte Cinema West Lake': { lat: 21.0745, lng: 105.8033, city: 'Hà Nội' },
};

function getCinemaCoords(name: string, id: string): { lat: number; lng: number; city: string } {
  // Try exact match
  if (MOCK_CINEMA_COORDINATES[name]) return MOCK_CINEMA_COORDINATES[name];
  
  // Try substring matches
  const normalized = name.toLowerCase();
  if (normalized.includes('nguyễn du') || normalized.includes('nguy?n du') || normalized.includes('du')) {
    return MOCK_CINEMA_COORDINATES['Galaxy Cinema Nguyễn Du'];
  }
  if (normalized.includes('bitexco') || normalized.includes('bhd')) {
    return MOCK_CINEMA_COORDINATES['BHD Star Bitexco'];
  }
  if (normalized.includes('west lake') || normalized.includes('lotte') || normalized.includes('lake')) {
    return MOCK_CINEMA_COORDINATES['Lotte Cinema West Lake'];
  }

  // Stable fallback coordinates based on ID hash
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const isHanoi = hash % 2 === 0;
  if (isHanoi) {
    return { lat: 21.0285 + (hash % 100) / 1000, lng: 105.8048 + (hash % 100) / 1000, city: 'Hà Nội' };
  } else {
    return { lat: 10.7626 + (hash % 100) / 1000, lng: 106.6602 + (hash % 100) / 1000, city: 'Hồ Chí Minh' };
  }
}

// Haversine distance formula in kilometers
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const ProximitySelectorModal: React.FC<ProximitySelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectCinema,
}) => {
  const [cinemas, setCinemas] = useState<ActiveCinema[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [currentSelectedId, setCurrentSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCinemas();
      const stored = localStorage.getItem('user_selected_cinema');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCurrentSelectedId(parsed.cinemaId);
        } catch {
          // ignore
        }
      }
    }
  }, [isOpen]);

  const fetchCinemas = async () => {
    setLoading(true);
    try {
      const res = await publicApi.getActiveCinemas();
      if (res.isSuccess) {
        setCinemas(res.data || []);
      } else {
        showError('Failed to load cinemas.');
      }
    } catch (err) {
      console.error(err);
      showError('Error connecting to cinemas database.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    setGettingLocation(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGettingLocation(false);
        showSuccess('Location detected! Cinemas sorted by nearest distance.');
      },
      (error) => {
        console.warn('Geolocation error:', error);
        // Provide simulated current location in District 1 HCMC for demonstration
        setUserCoords({ lat: 10.7769, lng: 106.7009 });
        setGettingLocation(false);
        setLocationError('Could not access GPS. Using simulated HCMC center location.');
        showSuccess('Simulated HCMC location set! Cinemas sorted.');
      },
      { timeout: 8000 }
    );
  };

  const handleSelect = (cinema: ActiveCinema) => {
    const coords = getCinemaCoords(cinema.cinemaName, cinema.cinemaId);
    const selected = {
      ...cinema,
      city: coords.city,
    };
    localStorage.setItem('user_selected_cinema', JSON.stringify(selected));
    localStorage.setItem('user_selected_city', coords.city);
    
    // Dispatch events to trigger UI re-renders on components
    window.dispatchEvent(new Event('user_selected_cinema_changed'));
    
    if (onSelectCinema) {
      onSelectCinema(selected);
    }
    onClose();
  };

  const clearSelection = () => {
    localStorage.removeItem('user_selected_cinema');
    localStorage.removeItem('user_selected_city');
    window.dispatchEvent(new Event('user_selected_cinema_changed'));
    setCurrentSelectedId(null);
    if (onSelectCinema) {
      onSelectCinema({ cinemaId: '', cinemaName: '', city: '' });
    }
    onClose();
  };

  // Process and sort cinemas list
  const processedCinemas = cinemas
    .map((cinema) => {
      const coords = getCinemaCoords(cinema.cinemaName, cinema.cinemaId);
      let distance: number | undefined;
      if (userCoords) {
        distance = getDistance(userCoords.lat, userCoords.lng, coords.lat, coords.lng);
      }
      return {
        ...cinema,
        city: coords.city,
        coords,
        distance,
      };
    })
    .filter((cinema) => {
      if (selectedCity === 'All') return true;
      return cinema.city === selectedCity;
    })
    .sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      return a.cinemaName.localeCompare(b.cinemaName);
    });

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(10px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          background: 'rgba(24, 24, 27, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-xl, 20px)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          padding: '28px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
        }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card"
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MapPin style={{ color: 'var(--primary, #ff8a00)' }} size={24} />
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-primary, #fff)' }}>
              Select Cinema & Proximity
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary, #a1a1aa)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Proximity Button */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={handleUseCurrentLocation}
            disabled={gettingLocation}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 'var(--radius-md, 10px)',
              background: 'linear-gradient(135deg, var(--primary, #ff8a00), #e17600)',
              border: 'none',
              color: 'black',
              fontWeight: 700,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255, 138, 0, 0.25)',
              transition: 'transform 0.2s, opacity 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {gettingLocation ? (
              <>
                <Locate size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                Detecting GPS Location...
              </>
            ) : (
              <>
                <Navigation size={18} />
                Find Nearest Cinemas (GPS)
              </>
            )}
          </button>

          {locationError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '10px',
                color: '#fb7185',
                fontSize: '12px',
                background: 'rgba(251, 113, 133, 0.08)',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(251, 113, 133, 0.2)',
              }}
            >
              <AlertCircle size={14} />
              <span>{locationError}</span>
            </div>
          )}
        </div>

        {/* City Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {['All', 'Hồ Chí Minh', 'Hà Nội'].map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 'var(--radius-sm, 6px)',
                background: selectedCity === city ? 'rgba(255,138,0,0.12)' : 'rgba(255,255,255,0.03)',
                border: selectedCity === city ? '1px solid var(--primary, #ff8a00)' : '1px solid rgba(255,255,255,0.05)',
                color: selectedCity === city ? 'var(--primary, #ff8a00)' : 'var(--text-secondary, #a1a1aa)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Cinemas List */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', minHeight: '180px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Loading cinemas list...</span>
            </div>
          ) : processedCinemas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)' }}>
              No cinemas found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {processedCinemas.map((cinema) => {
                const isSelected = currentSelectedId === cinema.cinemaId;
                return (
                  <div
                    key={cinema.cinemaId}
                    onClick={() => handleSelect(cinema)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md, 10px)',
                      background: isSelected ? 'rgba(255,138,0,0.08)' : 'rgba(255,255,255,0.02)',
                      border: isSelected ? '1px solid var(--primary, #ff8a00)' : '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                      }
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                          {cinema.cinemaName}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            background: 'rgba(255,255,255,0.08)',
                            borderRadius: '4px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {cinema.city}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Active Cinema
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {cinema.distance !== undefined && (
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary, #ff8a00)' }}>
                            {cinema.distance.toFixed(1)} km
                          </span>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>distance</div>
                        </div>
                      )}
                      {isSelected && <Check size={18} style={{ color: 'var(--primary, #ff8a00)' }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Clear Selection Option */}
        {currentSelectedId && (
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={clearSelection}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Clear selected cinema filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
