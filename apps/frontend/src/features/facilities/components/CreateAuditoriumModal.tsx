import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Loader2, AlertCircle, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { facilitiesApi, type MovieFormat, type SeatPosition } from '../../../api/facilitiesApi';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import type { ApiErrorResponse } from '../../../types/auth.types';

interface CreateAuditoriumModalProps {
  cinemaId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editAuditoriumId?: string;
}

type Step = 'format' | 'seats';

const CreateAuditoriumModal: React.FC<CreateAuditoriumModalProps> = ({ cinemaId, isOpen, onClose, onSuccess, editAuditoriumId }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<Step>('format');
  const [movieFormats, setMovieFormats] = useState<MovieFormat[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<MovieFormat | null>(null);
  const [formatsLoading, setFormatsLoading] = useState(false);
  const [formatsError, setFormatsError] = useState<string | null>(null);

  // Step 2: Room info
  const [auditoriumNumber, setAuditoriumNumber] = useState('');
  const [roomCols, setRoomCols] = useState(10);
  const [roomRows, setRoomRows] = useState(8);

  // Seating center area configurations
  const [centerRowStart, setCenterRowStart] = useState(2);
  const [centerRowEnd, setCenterRowEnd] = useState(5);
  const [centerColStart, setCenterColStart] = useState(2);
  const [centerColEnd, setCenterColEnd] = useState(7);


  // Step 3: Seats
  const [seats, setSeats] = useState<SeatPosition[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [gridSize, setGridSize] = useState({ cols: 10, rows: 8 });
  const [cellSize, setCellSize] = useState({ width: 40, height: 40 });
  const [isMobile, setIsMobile] = useState(false);



  // Computed visible elements based on active column and row bounds
  const visibleSeats = seats.filter(s => s.colIndex < roomCols && s.rowIndex < roomRows);

  // Create state
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  const rowOptions = Array.from({ length: roomRows }).map((_, i) => ({
    value: i,
    label: String.fromCharCode(65 + i),
  }));

  const colOptions = Array.from({ length: roomCols }).map((_, i) => ({
    value: i,
    label: `${i + 1}`,
  }));

  const handleCenterRowStartChange = (val: number) => {
    setCenterRowStart(val);
    if (centerRowEnd < val) {
      setCenterRowEnd(val);
    }
  };

  const handleCenterRowEndChange = (val: number) => {
    setCenterRowEnd(Math.max(centerRowStart, val));
  };

  const handleCenterColStartChange = (val: number) => {
    setCenterColStart(val);
    if (centerColEnd < val) {
      setCenterColEnd(val);
    }
  };

  const handleCenterColEndChange = (val: number) => {
    setCenterColEnd(Math.max(centerColStart, val));
  };

  const handleAutoCenter = () => {
    const rStart = Math.max(0, Math.floor(roomRows / 4));
    const rEnd = Math.min(roomRows - 1, Math.floor(roomRows * 3 / 4));
    const cStart = Math.max(0, Math.floor(roomCols / 4));
    const cEnd = Math.min(roomCols - 1, Math.floor(roomCols * 3 / 4));
    setCenterRowStart(rStart);
    setCenterRowEnd(rEnd);
    setCenterColStart(cStart);
    setCenterColEnd(cEnd);
  };

  // Check mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCellSize({ width: 30, height: 30 });
      } else {
        setCellSize({ width: 40, height: 40 });
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Track when we are loading existing data for edit mode
  const isLoadingExisting = useRef(false);

  // Load existing auditorium data for edit mode
  useEffect(() => {
    if (isOpen && editAuditoriumId) {
      loadExistingAuditorium(editAuditoriumId);
    }
  }, [isOpen, editAuditoriumId]);

  const loadExistingAuditorium = async (auditoriumId: string) => {
    isLoadingExisting.current = true;
    try {
      const res = await facilitiesApi.getAuditoriumDetail(auditoriumId);
      const data = res.data as any;
      if (data) {
        setAuditoriumNumber(data.auditoriumNumber || '');
        if (data.centerRowStart !== undefined) setCenterRowStart(data.centerRowStart);
        if (data.centerRowEnd !== undefined) setCenterRowEnd(data.centerRowEnd);
        if (data.centerColStart !== undefined) setCenterColStart(data.centerColStart);
        if (data.centerColEnd !== undefined) setCenterColEnd(data.centerColEnd);

        // Infer grid dimensions from seat data
        if (data.seatsInfos && data.seatsInfos.length > 0) {
          const seatsArray = data.seatsInfos as any[];
          let maxCol = 0;
          let maxRow = 0;

          // First pass: determine actual col/row count
          seatsArray.forEach((s: any) => {
            const col = s.colIndex;
            const row = s.rowIndex;
            if (typeof col === 'number' && col >= 0) maxCol = Math.max(maxCol, col);
            if (typeof row === 'number' && row >= 0) maxRow = Math.max(maxRow, row);
          });

          // Also check exits/aisles for grid size
          if (data.exitsInfos) {
            (data.exitsInfos as any[]).forEach((e: any) => {
              maxCol = Math.max(maxCol, (e.colIndex ?? 0) + (e.width ?? 1) - 1);
              maxRow = Math.max(maxRow, (e.rowIndex ?? 0) + (e.height ?? 1) - 1);
            });
          }
          if (data.aislesInfos) {
            (data.aislesInfos as any[]).forEach((a: any) => {
              maxCol = Math.max(maxCol, (a.colIndex ?? 0) + (a.width ?? 1) - 1);
              maxRow = Math.max(maxRow, (a.rowIndex ?? 0) + (a.height ?? 1) - 1);
            });
          }

          // Infer grid cols/rows (add 3 for padding)
          const inferredCols = Math.max(maxCol + 3, 5);
          const inferredRows = Math.max(maxRow + 3, 5);

          setRoomCols(inferredCols);
          setRoomRows(inferredRows);

          // Load seats with snapped positions
          const recalculatedSeats = seatsArray.map((s: any) => ({
            seatNumber: s.seatNumber ?? `${String.fromCharCode(65 + (s.rowIndex ?? 0))}${(s.colIndex ?? 0) + 1}`,
            coordX: (s.colIndex ?? 0) * cellSize.width,
            coordY: (s.rowIndex ?? 0) * cellSize.height,
            colIndex: typeof s.colIndex === 'number' ? s.colIndex : 0,
            rowIndex: typeof s.rowIndex === 'number' ? s.rowIndex : 0,
          }));
          setSeats(recalculatedSeats);
        }

        // Load format info
        if (data.formatInfos && data.formatInfos.length > 0) {
          const formatId = data.formatInfos[0].formatId;
          const formatsRes = await facilitiesApi.getMovieFormats();
          const formats = formatsRes.data || [];
          const matched = formats.find((f: any) => f.formatId === formatId);
          if (matched) {
            setSelectedFormat(matched);
            setCurrentStep('seats');
          }
        }
      }
    } catch (err) {
      console.error('Failed to load auditorium for edit:', err);
    } finally {
      isLoadingExisting.current = false;
    }
  };

  // Update gridSize state when roomCols/roomRows change
  useEffect(() => {
    setGridSize({ cols: roomCols, rows: roomRows });
  }, [roomCols, roomRows]);

  // Only clear seats on grid change when NOT in edit mode loading
  // and only when the grid actually resizes due to user input


  // Fetch movie formats
  useEffect(() => {
    if (isOpen && currentStep === 'format') {
      fetchMovieFormats();
    }
  }, [isOpen, currentStep]);

  // Fetch movie formats
  useEffect(() => {
    if (isOpen && currentStep === 'format') {
      fetchMovieFormats();
    }
  }, [isOpen, currentStep]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(editAuditoriumId ? 'seats' : 'format');
      setSelectedFormat(null);
      setAuditoriumNumber('');
      setRoomCols(10);
      setRoomRows(8);
      setSeats([]);
      setCreateError(null);
      setCreateSuccess(false);
    }
  }, [isOpen]);

  const fetchMovieFormats = async () => {
    setFormatsLoading(true);
    setFormatsError(null);
    try {
      const res = await facilitiesApi.getMovieFormats();
      setMovieFormats(res.data || []);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as ApiErrorResponse;
        setFormatsError(data.message || 'Failed to load movie formats.');
      } else {
        setFormatsError('Unable to connect to server.');
      }
    } finally {
      setFormatsLoading(false);
    }
  };

  const handleFormatSelect = (format: MovieFormat) => {
    setSelectedFormat(format);
  };

  const handleNextStep = () => {
    if (currentStep === 'format' && selectedFormat) {
      setCurrentStep('seats');
    }
  };

  // Auto fill all empty cells with seats
  const handleAutoFillSeats = () => {
    setSeats((currentSeats) => {
      const newSeats: SeatPosition[] = [];
      for (let row = 0; row < gridSize.rows; row++) {
        for (let col = 0; col < gridSize.cols; col++) {
          const existingSeat = currentSeats.find(
            s => s.colIndex === col && s.rowIndex === row
          );
          if (!existingSeat) {
            const seatNumber = `${String.fromCharCode(65 + row)}${col + 1}`;
            newSeats.push({
              seatNumber,
              coordX: col * cellSize.width,
              coordY: row * cellSize.height,
              colIndex: col,
              rowIndex: row,
            });
          }
        }
      }
      return [...currentSeats, ...newSeats];
    });
  };

  // Clear functions
  const handleClearSeats = () => {
    setSeats(seats.filter(s => !(s.colIndex < roomCols && s.rowIndex < roomRows)));
  };



  const handlePrevStep = () => {
    if (currentStep === 'seats') {
      setCurrentStep('format');
    }
  };

  // Seat drag and drop
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate grid position
    const colIndex = Math.floor(x / cellSize.width);
    const rowIndex = Math.floor(y / cellSize.height);

    // Check bounds
    if (colIndex < 0 || colIndex >= gridSize.cols || rowIndex < 0 || rowIndex >= gridSize.rows) {
      return;
    }

    const existingSeat = seats.find(
      s => s.colIndex === colIndex && s.rowIndex === rowIndex
    );
    if (existingSeat) {
      handleRemoveSeat(colIndex, rowIndex);
      return;
    }

    setIsDragging(true);

    const seatNumber = `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`;
    const newSeat: SeatPosition = {
      seatNumber,
      coordX: colIndex * cellSize.width,
      coordY: rowIndex * cellSize.height,
      colIndex,
      rowIndex,
    };
    setSeats([...seats, newSeat]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const colIndex = Math.floor(x / cellSize.width);
    const rowIndex = Math.floor(y / cellSize.height);

    if (colIndex >= 0 && colIndex < gridSize.cols && rowIndex >= 0 && rowIndex < gridSize.rows) {
      const existingSeat = seats.find(
        s => s.colIndex === colIndex && s.rowIndex === rowIndex
      );

      if (!existingSeat) {
        const seatNumber = `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`;
        const newSeat: SeatPosition = {
          seatNumber,
          coordX: colIndex * cellSize.width,
          coordY: rowIndex * cellSize.height,
          colIndex,
          rowIndex,
        };
        setSeats([...seats, newSeat]);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleRemoveSeat = (colIndex: number, rowIndex: number) => {
    setSeats(seats.filter(s => !(s.colIndex === colIndex && s.rowIndex === rowIndex)));
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const colIndex = Math.floor(x / cellSize.width);
    const rowIndex = Math.floor(y / cellSize.height);

    if (colIndex < 0 || colIndex >= gridSize.cols || rowIndex < 0 || rowIndex >= gridSize.rows) {
      return;
    }

    const existingSeat = seats.find(
      s => s.colIndex === colIndex && s.rowIndex === rowIndex
    );
    if (existingSeat) {
      handleRemoveSeat(colIndex, rowIndex);
      return;
    }

    setIsDragging(true);
    const seatNumber = `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`;
    const newSeat: SeatPosition = {
      seatNumber,
      coordX: colIndex * cellSize.width,
      coordY: rowIndex * cellSize.height,
      colIndex,
      rowIndex,
    };
    setSeats([...seats, newSeat]);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !canvasRef.current) return;
    e.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const colIndex = Math.floor(x / cellSize.width);
    const rowIndex = Math.floor(y / cellSize.height);

    if (colIndex >= 0 && colIndex < gridSize.cols && rowIndex >= 0 && rowIndex < gridSize.rows) {
      const existingSeat = seats.find(
        s => s.colIndex === colIndex && s.rowIndex === rowIndex
      );

      if (!existingSeat) {
        const seatNumber = `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`;
        const newSeat: SeatPosition = {
          seatNumber,
          coordX: colIndex * cellSize.width,
          coordY: rowIndex * cellSize.height,
          colIndex,
          rowIndex,
        };
        setSeats([...seats, newSeat]);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const validateFullVisibleSeatGrid = (): string | null => {
    const coordinates = new Set(visibleSeats.map(seat => `${seat.rowIndex}:${seat.colIndex}`));
    if (coordinates.size !== visibleSeats.length) {
      return 'Seat layout contains duplicate seat positions.';
    }

    const seatNumbers = new Set(visibleSeats.map(seat => seat.seatNumber.trim().toLowerCase()));
    if (seatNumbers.size !== visibleSeats.length) {
      return 'Seat layout contains duplicate seat numbers.';
    }

    return null;
  };

  const handleSubmit = async () => {
    if (!selectedFormat || !auditoriumNumber.trim() || visibleSeats.length === 0) {
      setCreateError('Please fill in all information: select movie format, enter room name and add at least one seat.');
      return;
    }

    const layoutError = validateFullVisibleSeatGrid();
    if (layoutError) {
      setCreateError(layoutError);
      return;
    }

    setCreateError(null);
    setCreateLoading(true);

    try {
      const normalizedSeats = visibleSeats.map(s => ({
        ...s,
        coordX: (s.colIndex ?? 0) * 40,
        coordY: (s.rowIndex ?? 0) * 40,
      }));

      if (editAuditoriumId) {
        // UPDATE mode
        const requestData = {
          auditoriumNumber: auditoriumNumber.trim(),
          addReqSeatsAuditoriumDto: normalizedSeats,
          seats: normalizedSeats,
          centerRowStart,
          centerRowEnd,
          centerColStart,
          centerColEnd,
        };
        const response = await facilitiesApi.updateAuditorium(editAuditoriumId, requestData as any);
        if (response.isSuccess) {
          setCreateSuccess(true);
          if (onSuccess) await onSuccess();
          setTimeout(() => onClose(), 1500);
        } else {
          setCreateError(response.message || 'Failed to update auditorium.');
        }
      } else {
        // CREATE mode
        const requestData = {
          auditoriumNumber: auditoriumNumber.trim(),
          movieFormatId: [selectedFormat.formatId],
          cinemaId,
          addReqSeatsAuditoriumDto: normalizedSeats,
          seats: normalizedSeats,
          centerRowStart,
          centerRowEnd,
          centerColStart,
          centerColEnd,
        };

        const response = await facilitiesApi.createAuditorium(requestData as any);
        if (response.isSuccess) {
          setCreateSuccess(true);
          if (onSuccess) await onSuccess();
          setTimeout(() => onClose(), 1500);
        } else {
          setCreateError(response.message || 'Failed to create auditorium.');
        }
      }
    } catch (err) {
      console.error('Error creating auditorium:', err);
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as ApiErrorResponse;
        setCreateError(data.message || 'Failed to create auditorium. Please try again.');
      } else {
        setCreateError('Unable to connect to server. Please check your network connection.');
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  if (!isOpen) return null;

  const isModern = theme === 'modern';
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'var(--bg-overlay)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-6xl max-h-[95vh] rounded-xl border shadow-2xl transition-all flex flex-col ${
          isModern
            ? 'bg-[#0b1326]/95 backdrop-blur-2xl border-outline-variant/40'
            : isDark
              ? 'bg-cinema-surface border-cinema-border/30'
              : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ====== HEADER ====== */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-cinema-border/30' : isModern ? 'border-outline-variant/20' : 'border-gray-200'
        }`}>
          <div>
            <h2 className={`text-xl font-bold ${isDark || isModern ? 'text-white' : 'text-gray-900'}`}>
              {currentStep === 'format' ? t('createAuditorium.title') : editAuditoriumId ? t('createAuditorium.editTitle') : t('createAuditorium.createTitle')}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-on-surface-variant/60">{t('createAuditorium.cinemaComplexes')}</span>
              <span className="text-[11px] text-on-surface-variant/60">›</span>
              <span className="text-[11px] text-on-surface-variant/60">{t('createAuditorium.manageClusters')}</span>
              <span className="text-[11px] text-on-surface-variant/60">›</span>
              <span className="text-[11px] text-primary">{t('createAuditorium.createRoom')}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark || isModern ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ====== CONTENT ====== */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Success Message */}
          {createSuccess && (
            <div className="mb-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-sm text-emerald-300 font-medium">{t('createAuditorium.addedSuccess')}</span>
            </div>
          )}
          {createError && (
            <div className="mb-4 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="text-sm text-rose-300">{createError}</span>
            </div>
          )}

          {/* Step 1: Format Selection */}
          {currentStep === 'format' && (
            <div className="space-y-4">
              <h3 className={`text-lg font-bold ${isDark || isModern ? 'text-white' : 'text-gray-900'}`}>
                {t('createAuditorium.step1')}
              </h3>
              {formatsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : formatsError ? (
                <div className="p-4 rounded-lg border border-rose-500/30 bg-rose-500/10 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                  <span className="text-sm text-rose-300">{formatsError}</span>
                  <button className="ml-auto px-3 py-1.5 text-xs rounded-lg bg-cinema-elevated border border-cinema-border/30 text-cinema-text" onClick={fetchMovieFormats}>{t('createAuditorium.retry')}</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {movieFormats.map((format) => (
                    <button
                      key={format.formatId}
                      onClick={() => handleFormatSelect(format)}
                      className={`p-5 rounded-xl border text-left transition-all ${
                        selectedFormat?.formatId === format.formatId
                          ? 'border-primary-container bg-primary-container/15 shadow-lg'
                          : `${isDark ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : isModern ? 'bg-surface-container/30 border-outline-variant/30 hover:border-primary-container/50' : 'bg-white border-gray-200 hover:border-primary/50'}`
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className={`font-bold text-base mb-2 ${isDark || isModern ? 'text-white' : 'text-gray-900'}`}>
                            {format.formatName}
                          </h4>
                          <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : isModern ? 'text-on-surface-variant/70' : 'text-gray-600'}`}>
                            {format.formatDescription}
                          </p>
                          <p className="text-lg font-black text-primary-container">
                            {formatPrice(format.movieFormatPrice)}
                          </p>
                        </div>
                        {selectedFormat?.formatId === format.formatId && (
                          <CheckCircle className="w-5 h-5 text-primary-container shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Seats Layout - Premium Layout */}
          {currentStep === 'seats' && (
            <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* ====== LEFT COLUMN (4/12) ====== */}
              <div className="xl:col-span-4 space-y-6">
                
                {/* Room Info */}
                <div className={`rounded-xl p-5 ${
                  isModern 
                    ? 'bg-surface-container/40 backdrop-blur-xl border border-outline-variant/30' 
                    : isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <h3 className={`font-bold text-base mb-5 flex items-center gap-2 ${isDark || isModern ? 'text-white' : 'text-gray-900'}`}>
                    <span className="w-2 h-2 rounded-full bg-primary-container inline-block" />
                    {t('createAuditorium.roomInfo')}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${isDark || isModern ? 'text-on-surface-variant/80' : 'text-gray-600'}`}>
                        {t('createAuditorium.roomName')} <span className="text-primary-container">*</span>
                      </label>
                      <input
                        type="text"
                        value={auditoriumNumber}
                        onChange={(e) => setAuditoriumNumber(e.target.value)}
                        required
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-all ${
                          isDark
                            ? 'bg-cinema-surface border-cinema-border/30 text-white placeholder-gray-500 focus:border-primary-container'
                            : isModern
                              ? 'bg-surface-container-lowest border-outline-variant/50 text-white placeholder-on-surface-variant/50 focus:border-primary-container'
                              : 'bg-white border-gray-300 text-gray-900 focus:border-primary'
                        }`}
                        placeholder={t('createAuditorium.roomNamePlaceholder')}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${isDark || isModern ? 'text-on-surface-variant/80' : 'text-gray-600'}`}>
                          Số Cột <span className="text-primary-container">*</span>
                        </label>
                        <input
                          type="number" min="5" max="20"
                          value={roomCols}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 5;
                            setRoomCols(Math.max(5, Math.min(20, value)));
                          }}
                          className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all ${
                            isDark
                              ? 'bg-cinema-surface border-cinema-border/30 text-white focus:border-primary-container'
                              : isModern
                                ? 'bg-surface-container-lowest border-outline-variant/50 text-white focus:border-primary-container'
                                : 'bg-white border-gray-300 text-gray-900 focus:border-primary'
                          }`}
                        />
                        <p className="text-[10px] text-on-surface-variant/60 mt-1">Tối thiểu: 5, Tối đa: 20</p>
                      </div>
                      <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${isDark || isModern ? 'text-on-surface-variant/80' : 'text-gray-600'}`}>
                          Số Hàng <span className="text-primary-container">*</span>
                        </label>
                        <input
                          type="number" min="5" max="15"
                          value={roomRows}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 5;
                            setRoomRows(Math.max(5, Math.min(15, value)));
                          }}
                          className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all ${
                            isDark
                              ? 'bg-cinema-surface border-cinema-border/30 text-white focus:border-primary-container'
                              : isModern
                                ? 'bg-surface-container-lowest border-outline-variant/50 text-white focus:border-primary-container'
                                : 'bg-white border-gray-300 text-gray-900 focus:border-primary'
                          }`}
                        />
                        <p className="text-[10px] text-on-surface-variant/60 mt-1">Tối thiểu: 5, Tối đa: 15</p>
                      </div>
                    </div>

                    {/* Center Area Configuration */}
                    <div className="mt-4 pt-4 border-t border-dashed border-cinema-border/20">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className={`text-xs font-bold ${isDark || isModern ? 'text-white' : 'text-gray-900'}`}>
                          Cấu hình Vùng Trung Tâm (Gợi ý AI)
                        </h4>
                        <button
                          type="button"
                          onClick={handleAutoCenter}
                          className="px-2 py-1 text-[10px] font-bold rounded bg-primary-container text-white active:scale-95 transition-all hover:brightness-110"
                        >
                          Tự Động Chọn
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant/60 mb-1">Hàng Bắt Đầu</label>
                          <select
                            value={centerRowStart}
                            onChange={(e) => handleCenterRowStartChange(parseInt(e.target.value))}
                            className={`w-full px-2 py-1.5 rounded border text-xs outline-none ${
                              isDark || isModern ? 'bg-cinema-surface border-cinema-border/30 text-white' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            {rowOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant/60 mb-1">Hàng Kết Thúc</label>
                          <select
                            value={centerRowEnd}
                            onChange={(e) => handleCenterRowEndChange(parseInt(e.target.value))}
                            className={`w-full px-2 py-1.5 rounded border text-xs outline-none ${
                              isDark || isModern ? 'bg-cinema-surface border-cinema-border/30 text-white' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            {rowOptions.filter(opt => opt.value >= centerRowStart).map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant/60 mb-1">Cột Bắt Đầu</label>
                          <select
                            value={centerColStart}
                            onChange={(e) => handleCenterColStartChange(parseInt(e.target.value))}
                            className={`w-full px-2 py-1.5 rounded border text-xs outline-none ${
                              isDark || isModern ? 'bg-cinema-surface border-cinema-border/30 text-white' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            {colOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant/60 mb-1">Cột Kết Thúc</label>
                          <select
                            value={centerColEnd}
                            onChange={(e) => handleCenterColEndChange(parseInt(e.target.value))}
                            className={`w-full px-2 py-1.5 rounded border text-xs outline-none ${
                              isDark || isModern ? 'bg-cinema-surface border-cinema-border/30 text-white' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            {colOptions.filter(opt => opt.value >= centerColStart).map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <p className="text-[10px] text-on-surface-variant/60 mt-2">
                        Chọn ranh giới hàng/cột trực quan để thiết lập khu vực trung tâm có view đẹp nhất.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ====== RIGHT COLUMN (8/12) - Interactive Editor ====== */}
              <div className="xl:col-span-8 flex flex-col gap-6">
                <div className={`flex-1 rounded-xl p-6 ${
                  isModern 
                    ? 'bg-surface-container/40 backdrop-blur-xl border border-outline-variant/30' 
                    : isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
                }`}>
                  {/* Toolbar */}
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleAutoFillSeats}
                        className="flex items-center gap-2 px-4 py-2 bg-cinema-accent text-black rounded-lg text-xs font-semibold transition-all active:scale-95 hover:brightness-110"
                      >
                        <Plus className="w-4 h-4" />
                        {t('createAuditorium.autoFillSeats')}
                      </button>
                      <button
                        onClick={handleClearSeats}
                        disabled={visibleSeats.length === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                          visibleSeats.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                        } ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : isModern ? 'bg-surface-variant/50 text-on-surface-variant hover:bg-error-container/20 hover:text-error' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        <X className="w-4 h-4" />
                        Xóa tất cả ghế
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant/70">
                      <p className="text-xs text-cinema-text-muted/70 italic">
                        {t('createAuditorium.hintSeat')}
                      </p>
                    </div>
                  </div>

                  {/* Grid Canvas */}
                  <div className="bg-surface-container-lowest/50 rounded-xl border border-outline-variant/30 p-8 flex flex-col items-center">
                    {/* Screen Indicator */}
                    <div className="w-full max-w-2xl mb-10">
                      <div className="w-full h-1.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-full shadow-[0_0_20px_rgba(255,179,182,0.3)]"></div>
                      <p className="text-center text-[11px] font-bold tracking-[0.2em] text-primary mt-2 uppercase">MÀN HÌNH</p>
                    </div>

                    {/* Grid Wrapper with Headers */}
                    <div className="overflow-auto max-h-[50vh] w-full flex p-2 justify-center">
                      <div 
                        className="relative inline-block" 
                        style={{
                          paddingLeft: 28,
                          paddingTop: 24,
                          width: gridSize.cols * cellSize.width + 28,
                          height: gridSize.rows * cellSize.height + 24
                        }}
                      >
                        {/* Row Labels (Letters) */}
                        {Array.from({ length: gridSize.rows }).map((_, r) => (
                          <div
                            key={`row-label-${r}`}
                            className={`absolute flex items-center justify-center text-xs font-bold ${
                              isDark || isModern ? 'text-on-surface-variant/60' : 'text-gray-400'
                            }`}
                            style={{
                              left: 0,
                              top: 24 + r * cellSize.height,
                              width: 24,
                              height: cellSize.height,
                            }}
                          >
                            {String.fromCharCode(65 + r)}
                          </div>
                        ))}

                        {/* Column Labels (Numbers) */}
                        {Array.from({ length: gridSize.cols }).map((_, c) => (
                          <div
                            key={`col-label-${c}`}
                            className={`absolute flex items-center justify-center text-xs font-bold ${
                              isDark || isModern ? 'text-on-surface-variant/60' : 'text-gray-400'
                            }`}
                            style={{
                              left: 28 + c * cellSize.width,
                              top: 0,
                              width: cellSize.width,
                              height: 20,
                            }}
                          >
                            {c + 1}
                          </div>
                        ))}

                        {/* Canvas Grid */}
                        <div
                          ref={canvasRef}
                          className={`relative border-2 ${
                            isDark ? 'border-gray-700' : isModern ? 'border-outline-variant/30' : 'border-gray-300'
                          }`}
                          style={{
                            left: 28,
                            top: 24,
                            width: gridSize.cols * cellSize.width,
                            height: gridSize.rows * cellSize.height,
                            backgroundImage: `
                              linear-gradient(to right, ${isDark ? 'rgba(75, 85, 99, 0.3)' : isModern ? 'rgba(51, 65, 85, 0.3)' : 'rgba(209, 213, 219, 0.3)'} 1px, transparent 1px),
                              linear-gradient(to bottom, ${isDark ? 'rgba(75, 85, 99, 0.3)' : isModern ? 'rgba(51, 65, 85, 0.3)' : 'rgba(209, 213, 219, 0.3)'} 1px, transparent 1px)
                            `,
                            backgroundSize: `${cellSize.width}px ${cellSize.height}px`,
                          }}
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseUp}
                          onTouchStart={handleTouchStart}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                        >
                          {/* Center Area Overlay Preview */}
                          <div
                            className="absolute border-2 border-dashed border-[#ff8a00] pointer-events-none"
                            style={{
                              left: centerColStart * cellSize.width,
                              top: centerRowStart * cellSize.height,
                              width: (centerColEnd - centerColStart + 1) * cellSize.width,
                              height: (centerRowEnd - centerRowStart + 1) * cellSize.height,
                              backgroundColor: 'rgba(255, 138, 0, 0.08)',
                              zIndex: 5,
                            }}
                          >
                            <div className="absolute top-1 left-2 text-[9px] font-bold text-[#ff8a00] bg-black/60 px-1 rounded uppercase tracking-wider">
                              AI Center
                            </div>
                          </div>

                          {/* Seats */}
                          {visibleSeats.map((seat, index) => (
                            <div
                              key={index}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveSeat(seat.colIndex, seat.rowIndex);
                              }}
                              className="absolute cursor-pointer rounded transition-all hover:scale-110 flex items-center justify-center text-[10px] font-bold bg-primary-container text-white"
                              style={{
                                left: seat.colIndex * cellSize.width,
                                top: seat.rowIndex * cellSize.height,
                                width: cellSize.width - 4,
                                height: cellSize.height - 4,
                                margin: '2px',
                                zIndex: 10,
                              }}
                              title={seat.seatNumber}
                            >
                              {!isMobile && seat.seatNumber}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-8 flex gap-6 text-xs text-on-surface-variant/60 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm bg-cinema-accent" />
                        Ghế (Seat)
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm border border-dashed border-[#ff8a00] bg-[#ff8a00]/10" />
                        Vùng trung tâm AI (AI Center)
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm bg-gray-500/30 border" style={{borderColor: '#475569'}} />
                        Trống (Empty)
                      </div>
                    </div>
                  </div>

                  {/* Grid Info Bar */}
                  <div className={`mt-4 p-3.5 rounded-lg flex justify-between items-center ${
                    isDark ? 'bg-cinema-surface/50 border border-cinema-border/20' : isModern ? 'bg-surface-container-high/40 border border-outline-variant/20' : 'bg-gray-100 border border-gray-200'
                  }`}>
                    <div className="flex gap-6">
                      <div>
                        <p className={`text-[10px] uppercase tracking-wider font-bold ${isDark || isModern ? 'text-on-surface-variant/60' : 'text-gray-500'}`}>Kích Thước</p>
                        <p className={`text-sm font-bold ${isDark || isModern ? 'text-white' : 'text-gray-900'}`}>{gridSize.cols} columns × {gridSize.rows} rows</p>
                      </div>
                      <div>
                        <p className={`text-[10px] uppercase tracking-wider font-bold ${isDark || isModern ? 'text-on-surface-variant/60' : 'text-gray-500'}`}>Tổng Ghế</p>
                        <p className={`text-sm font-bold ${isDark || isModern ? 'text-white' : 'text-gray-900'}`}>{visibleSeats.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant/60 text-xs">
                      Nhấp và kéo để vẽ ghế, nhấp vào ghế để xóa
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ====== FOOTER ====== */}
        <div className={`flex justify-between items-center px-6 py-4 border-t ${
          isDark ? 'border-cinema-border/20' : isModern ? 'border-outline-variant/20' : 'border-gray-200'
        }`}>
          <button
            onClick={currentStep === 'format' ? onClose : handlePrevStep}
            disabled={createLoading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95 ${
              isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : isModern ? 'border border-outline-variant/30 text-on-surface-variant hover:bg-surface-bright/30' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            } ${createLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {currentStep !== 'format' && <ArrowLeft className="w-4 h-4" />}
            {currentStep === 'format' ? 'Quay Lại' : 'Quay Lại'}
          </button>

          {currentStep === 'seats' ? (
            <button
              onClick={handleSubmit}
              disabled={createLoading || visibleSeats.length === 0}
              className={`flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 ${
                createLoading || visibleSeats.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              } bg-primary-container text-white hover:bg-inverse-primary shadow-[0_4px_20px_rgba(225,29,72,0.4)]`}
            >
              {createLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {editAuditoriumId ? 'Dang cap nhat...' : 'Dang tao...'}</>
              ) : (
                <><Plus className="w-4 h-4" /> {editAuditoriumId ? 'Cap Nhat Phong' : 'Tao Phong'}</>
              )}
            </button>
          ) : (
            <button
              onClick={handleNextStep}
              disabled={currentStep === 'format' && !selectedFormat}
              className={`flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 ${
                currentStep === 'format' && !selectedFormat ? 'opacity-50 cursor-not-allowed' : ''
              } bg-primary-container text-white hover:bg-inverse-primary shadow-[0_4px_20px_rgba(225,29,72,0.4)]`}
            >
              Tiếp Theo
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateAuditoriumModal;
