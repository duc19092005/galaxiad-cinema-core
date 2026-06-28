import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Loader2, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Grid3x3, DoorOpen, Square } from 'lucide-react';
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

  // Step 3: Seats
  const [seats, setSeats] = useState<SeatPosition[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [gridSize, setGridSize] = useState({ cols: 10, rows: 8 });
  const [cellSize, setCellSize] = useState({ width: 40, height: 40 });
  const [isMobile, setIsMobile] = useState(false);

  // Drawing mode
  type DrawingMode = 'seat' | 'exit' | 'aisle';
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('seat');
  const [isClearDropdownOpen, setIsClearDropdownOpen] = useState(false);

  // Exit/Doors - người dùng tự vẽ
  interface ExitArea {
    id: string;
    colIndex: number;
    rowIndex: number;
    width: number; // số cột
    height: number; // số hàng
    side: 'top' | 'bottom' | 'left' | 'right';
  }
  const [exits, setExits] = useState<ExitArea[]>([]);
  const [exitDragStart, setExitDragStart] = useState<{ col: number; row: number; side: 'top' | 'bottom' | 'left' | 'right' | null } | null>(null);

  // Aisle/Passage - lối đi
  interface AisleArea {
    id: string;
    colIndex: number;
    rowIndex: number;
    width: number; // số cột
    height: number; // số hàng
  }
  const [aisles, setAisles] = useState<AisleArea[]>([]);
  const [aisleDragStart, setAisleDragStart] = useState<{ col: number; row: number } | null>(null);

  // Computed visible elements based on active column and row bounds
  const visibleSeats = seats.filter(s => s.colIndex < roomCols && s.rowIndex < roomRows);
  const visibleExits = exits.filter(e => e.colIndex < roomCols && e.rowIndex < roomRows);
  const visibleAisles = aisles.filter(a => a.colIndex < roomCols && a.rowIndex < roomRows);

  // Create state
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

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
  useEffect(() => {
    if (!isLoadingExisting.current) {
      setExits([]);
      setAisles([]);
    }
  }, [roomCols, roomRows]);

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
      setExits([]);
      setAisles([]);
      setExitDragStart(null);
      setAisleDragStart(null);
      setDrawingMode('seat');
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
          // Check if seat already exists at this position
          const existingSeat = currentSeats.find(
            s => s.colIndex === col && s.rowIndex === row
          );
          // Check if position is in an aisle - skip if it is
          const isInAisle = isPositionInAisle(col, row);
          
          if (!existingSeat && !isInAisle) {
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
      const updatedSeats = [...currentSeats, ...newSeats];
      console.log(`Auto-filled ${newSeats.length} seats. Total seats: ${updatedSeats.length}`);
      return updatedSeats;
    });
  };

  // Clear functions
  const handleClearSeats = () => {
    setSeats(seats.filter(s => !(s.colIndex < roomCols && s.rowIndex < roomRows)));
  };

  const handleClearExits = () => {
    setExits(exits.filter(e => !(e.colIndex < roomCols && e.rowIndex < roomRows)));
  };

  const handleClearAisles = () => {
    setAisles(aisles.filter(a => !(a.colIndex < roomCols && a.rowIndex < roomRows)));
  };

  const handleClearAll = () => {
    setSeats(seats.filter(s => !(s.colIndex < roomCols && s.rowIndex < roomRows)));
    setExits(exits.filter(e => !(e.colIndex < roomCols && e.rowIndex < roomRows)));
    setAisles(aisles.filter(a => !(a.colIndex < roomCols && a.rowIndex < roomRows)));
  };

  const handlePrevStep = () => {
    if (currentStep === 'seats') {
      setCurrentStep('format');
    }
  };

  // Handle removing items
  const handleRemoveAisle = (colIndex: number, rowIndex: number) => {
    setAisles(aisles.filter(a =>
      !(colIndex >= a.colIndex && colIndex < a.colIndex + a.width &&
        rowIndex >= a.rowIndex && rowIndex < a.rowIndex + a.height)
    ));
  };

  // Helper function to check if a position is in an aisle
  const isPositionInAisle = (colIndex: number, rowIndex: number): boolean => {
    return aisles.some(aisle =>
      colIndex >= aisle.colIndex && colIndex < aisle.colIndex + aisle.width &&
      rowIndex >= aisle.rowIndex && rowIndex < aisle.rowIndex + aisle.height
    );
  };

  // Helper function to detect edge side
  const detectEdgeSide = (colIndex: number, rowIndex: number): 'top' | 'bottom' | 'left' | 'right' | null => {
    if (rowIndex === 0) return 'top';
    if (rowIndex === gridSize.rows - 1) return 'bottom';
    if (colIndex === 0) return 'left';
    if (colIndex === gridSize.cols - 1) return 'right';
    return null;
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

    // Handle removal based on drawing mode
    if (drawingMode === 'exit') {
      // Check if clicking on existing exit (anywhere in grid)
      const clickedExit = exits.find(exit => {
        return colIndex >= exit.colIndex && colIndex < exit.colIndex + exit.width &&
          rowIndex >= exit.rowIndex && rowIndex < exit.rowIndex + exit.height;
      });
      if (clickedExit) {
        setExits(exits.filter(e => e.id !== clickedExit.id));
        return;
      }
      // Start drawing exit - allow drawing anywhere in grid
      // Determine side based on position (prefer edges but allow anywhere)
      const edgeSide = detectEdgeSide(colIndex, rowIndex);
      setExitDragStart({
        col: colIndex,
        row: rowIndex,
        side: edgeSide || 'bottom' // Default to bottom if not near edge
      });
      return;
    } else if (drawingMode === 'aisle') {
      const clickedAisle = aisles.find(aisle =>
        colIndex >= aisle.colIndex && colIndex < aisle.colIndex + aisle.width &&
        rowIndex >= aisle.rowIndex && rowIndex < aisle.rowIndex + aisle.height
      );
      if (clickedAisle) {
        handleRemoveAisle(colIndex, rowIndex);
        return;
      }
      // Start drawing aisle - allow drawing anywhere in grid
      setAisleDragStart({ col: colIndex, row: rowIndex });
      return;
    } else if (drawingMode === 'seat') {
      // Check if position is in an aisle - cannot add seat here
      if (isPositionInAisle(colIndex, rowIndex)) {
        return; // Do nothing if trying to add seat in aisle
      }
      // Check if clicking on existing seat
      const existingSeat = seats.find(
        s => s.colIndex === colIndex && s.rowIndex === rowIndex
      );
      if (existingSeat) {
        handleRemoveSeat(colIndex, rowIndex);
        return;
      }
      // Start dragging to add seats
      setIsDragging(true);

      // Add first seat immediately
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
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Exit and aisle drawing are handled in mouse up, just track movement
    if (exitDragStart || aisleDragStart) {
      return;
    }

    if (!isDragging || !canvasRef.current || drawingMode !== 'seat') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate grid position
    const colIndex = Math.floor(x / cellSize.width);
    const rowIndex = Math.floor(y / cellSize.height);

    // Check if within bounds
    if (colIndex >= 0 && colIndex < gridSize.cols && rowIndex >= 0 && rowIndex < gridSize.rows) {
      // Check if position is in an aisle - cannot add seat here
      if (isPositionInAisle(colIndex, rowIndex)) {
        return; // Do nothing if trying to add seat in aisle
      }
      // Check if seat already exists at this position
      const existingSeat = seats.find(
        s => s.colIndex === colIndex && s.rowIndex === rowIndex
      );

      if (!existingSeat) {
        // Create new seat
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

  const handleMouseUp = (e?: React.MouseEvent<HTMLDivElement>) => {
    if (exitDragStart && canvasRef.current && e && exitDragStart.side) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const endCol = Math.floor(x / cellSize.width);
      const endRow = Math.floor(y / cellSize.height);

      // Clamp to grid bounds
      const clampedEndCol = Math.max(0, Math.min(endCol, gridSize.cols - 1));
      const clampedEndRow = Math.max(0, Math.min(endRow, gridSize.rows - 1));
      const clampedStartCol = Math.max(0, Math.min(exitDragStart.col, gridSize.cols - 1));
      const clampedStartRow = Math.max(0, Math.min(exitDragStart.row, gridSize.rows - 1));

      const side = exitDragStart.side;
      let exitArea: ExitArea;

      // Allow drawing exits anywhere in grid, not just at edges
      // Determine orientation based on drag direction
      const colDiff = Math.abs(clampedEndCol - clampedStartCol);
      const rowDiff = Math.abs(clampedEndRow - clampedStartRow);

      if (colDiff > rowDiff) {
        // Horizontal exit
        const startCol = Math.min(clampedStartCol, clampedEndCol);
        const width = Math.abs(clampedEndCol - clampedStartCol) + 1;
        // Use the row from start position
        const row = clampedStartRow;
        exitArea = {
          id: `exit-${Date.now()}`,
          colIndex: startCol,
          rowIndex: row,
          width: Math.min(width, gridSize.cols - startCol),
          height: 1,
          side: row === 0 ? 'top' : row === gridSize.rows - 1 ? 'bottom' : side === 'top' ? 'top' : side === 'bottom' ? 'bottom' : 'bottom',
        };
      } else {
        // Vertical exit
        const startRow = Math.min(clampedStartRow, clampedEndRow);
        const height = Math.abs(clampedEndRow - clampedStartRow) + 1;
        // Use the col from start position
        const col = clampedStartCol;
        exitArea = {
          id: `exit-${Date.now()}`,
          colIndex: col,
          rowIndex: startRow,
          width: 1,
          height: Math.min(height, gridSize.rows - startRow),
          side: col === 0 ? 'left' : col === gridSize.cols - 1 ? 'right' : side === 'left' ? 'left' : side === 'right' ? 'right' : 'right',
        };
      }

      // Check for overlap with existing exits
      const hasOverlap = exits.some(existing => {
        // Check if exits overlap in the same area
        return !(exitArea.colIndex + exitArea.width <= existing.colIndex ||
          exitArea.colIndex >= existing.colIndex + existing.width ||
          exitArea.rowIndex + exitArea.height <= existing.rowIndex ||
          exitArea.rowIndex >= existing.rowIndex + existing.height);
      });

      if (!hasOverlap && exitArea.width > 0 && exitArea.height > 0) {
        setExits([...exits, exitArea]);
      }

      setExitDragStart(null);
      return;
    }

    if (aisleDragStart && canvasRef.current && e) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const endCol = Math.floor(x / cellSize.width);
      const endRow = Math.floor(y / cellSize.height);

      const startCol = Math.min(aisleDragStart.col, endCol);
      const startRow = Math.min(aisleDragStart.row, endRow);
      const width = Math.abs(endCol - aisleDragStart.col) + 1;
      const height = Math.abs(endRow - aisleDragStart.row) + 1;

      const aisleArea: AisleArea = {
        id: `aisle-${Date.now()}`,
        colIndex: Math.max(0, Math.min(startCol, gridSize.cols - 1)),
        rowIndex: Math.max(0, Math.min(startRow, gridSize.rows - 1)),
        width: Math.min(width, gridSize.cols - Math.max(0, Math.min(startCol, gridSize.cols - 1))),
        height: Math.min(height, gridSize.rows - Math.max(0, Math.min(startRow, gridSize.rows - 1))),
      };

      // Check for overlap with existing aisles
      const hasOverlap = aisles.some(existing => {
        return !(aisleArea.colIndex + aisleArea.width <= existing.colIndex ||
          aisleArea.colIndex >= existing.colIndex + existing.width ||
          aisleArea.rowIndex + aisleArea.height <= existing.rowIndex ||
          aisleArea.rowIndex >= existing.rowIndex + existing.height);
      });

      if (!hasOverlap && aisleArea.width > 0 && aisleArea.height > 0) {
        setAisles([...aisles, aisleArea]);
      }

      setAisleDragStart(null);
      return;
    }

    setIsDragging(false);
    setExitDragStart(null);
    setAisleDragStart(null);
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

    // Check bounds
    if (colIndex < 0 || colIndex >= gridSize.cols || rowIndex < 0 || rowIndex >= gridSize.rows) {
      return;
    }

    // Handle removal based on drawing mode
    if (drawingMode === 'exit') {
      // Check if clicking on existing exit (anywhere in grid)
      const clickedExit = exits.find(exit => {
        return colIndex >= exit.colIndex && colIndex < exit.colIndex + exit.width &&
          rowIndex >= exit.rowIndex && rowIndex < exit.rowIndex + exit.height;
      });
      if (clickedExit) {
        setExits(exits.filter(e => e.id !== clickedExit.id));
        return;
      }
      // Allow drawing exit anywhere in grid
      const edgeSide = detectEdgeSide(colIndex, rowIndex);
      setExitDragStart({
        col: colIndex,
        row: rowIndex,
        side: edgeSide || 'bottom' // Default to bottom if not near edge
      });
      return;
    } else if (drawingMode === 'aisle') {
      const clickedAisle = aisles.find(aisle =>
        colIndex >= aisle.colIndex && colIndex < aisle.colIndex + aisle.width &&
        rowIndex >= aisle.rowIndex && rowIndex < aisle.rowIndex + aisle.height
      );
      if (clickedAisle) {
        handleRemoveAisle(colIndex, rowIndex);
        return;
      }
      setAisleDragStart({ col: colIndex, row: rowIndex });
      return;
    } else if (drawingMode === 'seat') {
      // Check if position is in an aisle - cannot add seat here
      if (isPositionInAisle(colIndex, rowIndex)) {
        return; // Do nothing if trying to add seat in aisle
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
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if ((exitDragStart || aisleDragStart) && !isDragging) {
      return;
    }

    if (!isDragging || !canvasRef.current || drawingMode !== 'seat') return;
    e.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const colIndex = Math.floor(x / cellSize.width);
    const rowIndex = Math.floor(y / cellSize.height);

    if (colIndex >= 0 && colIndex < gridSize.cols && rowIndex >= 0 && rowIndex < gridSize.rows) {
      // Check if position is in an aisle - cannot add seat here
      if (isPositionInAisle(colIndex, rowIndex)) {
        return; // Do nothing if trying to add seat in aisle
      }
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

  const handleTouchEnd = (e?: React.TouchEvent<HTMLDivElement>) => {
    if (exitDragStart && canvasRef.current && e && exitDragStart.side) {
      const rect = canvasRef.current.getBoundingClientRect();
      const touch = e.changedTouches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const endCol = Math.floor(x / cellSize.width);
      const endRow = Math.floor(y / cellSize.height);

      // Clamp to grid bounds
      const clampedEndCol = Math.max(0, Math.min(endCol, gridSize.cols - 1));
      const clampedEndRow = Math.max(0, Math.min(endRow, gridSize.rows - 1));
      const clampedStartCol = Math.max(0, Math.min(exitDragStart.col, gridSize.cols - 1));
      const clampedStartRow = Math.max(0, Math.min(exitDragStart.row, gridSize.rows - 1));

      const side = exitDragStart.side;
      let exitArea: ExitArea;

      // Allow drawing exits anywhere in grid, not just at edges
      // Determine orientation based on drag direction
      const colDiff = Math.abs(clampedEndCol - clampedStartCol);
      const rowDiff = Math.abs(clampedEndRow - clampedStartRow);

      if (colDiff > rowDiff) {
        // Horizontal exit
        const startCol = Math.min(clampedStartCol, clampedEndCol);
        const width = Math.abs(clampedEndCol - clampedStartCol) + 1;
        const row = clampedStartRow;
        exitArea = {
          id: `exit-${Date.now()}`,
          colIndex: startCol,
          rowIndex: row,
          width: Math.min(width, gridSize.cols - startCol),
          height: 1,
          side: row === 0 ? 'top' : row === gridSize.rows - 1 ? 'bottom' : side === 'top' ? 'top' : side === 'bottom' ? 'bottom' : 'bottom',
        };
      } else {
        // Vertical exit
        const startRow = Math.min(clampedStartRow, clampedEndRow);
        const height = Math.abs(clampedEndRow - clampedStartRow) + 1;
        const col = clampedStartCol;
        exitArea = {
          id: `exit-${Date.now()}`,
          colIndex: col,
          rowIndex: startRow,
          width: 1,
          height: Math.min(height, gridSize.rows - startRow),
          side: col === 0 ? 'left' : col === gridSize.cols - 1 ? 'right' : side === 'left' ? 'left' : side === 'right' ? 'right' : 'right',
        };
      }

      // Check for overlap with existing exits
      const hasOverlap = exits.some(existing => {
        return !(exitArea.colIndex + exitArea.width <= existing.colIndex ||
          exitArea.colIndex >= existing.colIndex + existing.width ||
          exitArea.rowIndex + exitArea.height <= existing.rowIndex ||
          exitArea.rowIndex >= existing.rowIndex + existing.height);
      });

      if (!hasOverlap && exitArea.width > 0 && exitArea.height > 0) {
        setExits([...exits, exitArea]);
      }

      setExitDragStart(null);
      return;
    }

    if (aisleDragStart && canvasRef.current && e) {
      const rect = canvasRef.current.getBoundingClientRect();
      const touch = e.changedTouches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const endCol = Math.floor(x / cellSize.width);
      const endRow = Math.floor(y / cellSize.height);

      const startCol = Math.min(aisleDragStart.col, endCol);
      const startRow = Math.min(aisleDragStart.row, endRow);
      const width = Math.abs(endCol - aisleDragStart.col) + 1;
      const height = Math.abs(endRow - aisleDragStart.row) + 1;

      const aisleArea: AisleArea = {
        id: `aisle-${Date.now()}`,
        colIndex: Math.max(0, Math.min(startCol, gridSize.cols - 1)),
        rowIndex: Math.max(0, Math.min(startRow, gridSize.rows - 1)),
        width: Math.min(width, gridSize.cols - Math.max(0, Math.min(startCol, gridSize.cols - 1))),
        height: Math.min(height, gridSize.rows - Math.max(0, Math.min(startRow, gridSize.rows - 1))),
      };

      const hasOverlap = aisles.some(existing => {
        return !(aisleArea.colIndex + aisleArea.width <= existing.colIndex ||
          aisleArea.colIndex >= existing.colIndex + existing.width ||
          aisleArea.rowIndex + aisleArea.height <= existing.rowIndex ||
          aisleArea.rowIndex >= existing.rowIndex + existing.height);
      });

      if (!hasOverlap && aisleArea.width > 0 && aisleArea.height > 0) {
        setAisles([...aisles, aisleArea]);
      }

      setAisleDragStart(null);
      return;
    }

    setIsDragging(false);
    setExitDragStart(null);
    setAisleDragStart(null);
  };

  const validateFullVisibleSeatGrid = (): string | null => {
    if (visibleSeats.length !== roomCols * roomRows) {
      return 'Seat layout must fill every cell in the room grid before saving.';
    }

    const coordinates = new Set(visibleSeats.map(seat => `${seat.rowIndex}:${seat.colIndex}`));
    if (coordinates.size !== visibleSeats.length) {
      return 'Seat layout contains duplicate seat positions.';
    }

    const seatNumbers = new Set(visibleSeats.map(seat => seat.seatNumber.trim().toLowerCase()));
    if (seatNumbers.size !== visibleSeats.length) {
      return 'Seat layout contains duplicate seat numbers.';
    }

    for (let row = 0; row < roomRows; row++) {
      for (let col = 0; col < roomCols; col++) {
        if (!coordinates.has(`${row}:${col}`)) {
          return 'Seat layout must fill every cell in the room grid before saving.';
        }
      }
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
              {currentStep === 'format' ? t('createAuditorium.title') : editAuditoriumId ? 'Chỉnh Sửa Phòng Chiếu' : 'Tạo Phòng Chiếu'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-on-surface-variant/60">Cinema Complexes</span>
              <span className="text-[11px] text-on-surface-variant/60">›</span>
              <span className="text-[11px] text-on-surface-variant/60">Quản Lý Cụm Rạp</span>
              <span className="text-[11px] text-on-surface-variant/60">›</span>
              <span className="text-[11px] text-primary">Tạo Phòng</span>
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
              <span className="text-sm text-emerald-300 font-medium">Auditorium added successfully! Updating...</span>
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
                  <button className="ml-auto px-3 py-1.5 text-xs rounded-lg bg-cinema-elevated border border-cinema-border/30 text-cinema-text" onClick={fetchMovieFormats}>Retry</button>
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
                    Thông Tin Phòng Chiếu
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${isDark || isModern ? 'text-on-surface-variant/80' : 'text-gray-600'}`}>
                        Tên Phòng <span className="text-primary-container">*</span>
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
                        placeholder="VD: Room 1, Room A, VIP Room 1..."
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
                  </div>
                </div>

                {/* Drawing Mode */}
                <div className={`rounded-xl p-5 ${
                  isModern 
                    ? 'bg-surface-container/40 backdrop-blur-xl border border-outline-variant/30' 
                    : isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <h3 className={`font-bold text-base mb-5 flex items-center gap-2 ${isDark || isModern ? 'text-white' : 'text-gray-900'}`}>
                    <span className="w-2 h-2 rounded-full bg-secondary-container inline-block" />
                    Chế Độ Vẽ
                  </h3>
                  <div className="space-y-2.5">
                    <button
                      onClick={() => setDrawingMode('seat')}
                      className={`w-full flex items-center gap-4 p-3.5 rounded-xl border transition-all ${
                        drawingMode === 'seat'
                          ? 'bg-cinema-accent/15 border-cinema-accent'
                          : `${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : isModern ? 'bg-gray-800/30 border-gray-700/30 hover:border-cinema-accent/50' : 'bg-white border-gray-200 hover:border-primary'}`
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        drawingMode === 'seat' ? 'bg-cinema-accent' : isDark ? 'bg-gray-600' : isModern ? 'bg-gray-700/50' : 'bg-gray-200'
                      }`}>
                        <Grid3x3 className={`w-5 h-5 ${drawingMode === 'seat' ? 'text-white' : isDark || isModern ? 'text-gray-400' : 'text-gray-500'}`} />
                      </div>
                      <div className="text-left">
                        <p className={`font-semibold text-sm ${isDark || isModern ? 'text-white' : 'text-gray-900'}`}>
                          Vẽ Ghế
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : isModern ? 'text-on-surface-variant/70' : 'text-gray-500'}`}>
                          {visibleSeats.length} ghế hiện có
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => setDrawingMode('exit')}
                      className={`w-full flex items-center gap-4 p-3.5 rounded-xl border transition-all ${
                        drawingMode === 'exit'
                          ? 'border-rose-500 bg-rose-500/20'
                          : `${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : isModern ? 'bg-gray-800/30 border-gray-700/30 hover:border-rose-500/50' : 'bg-white border-gray-200 hover:border-rose-500'}`
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        drawingMode === 'exit' ? 'bg-rose-500' : isDark ? 'bg-gray-600' : isModern ? 'bg-gray-700/50' : 'bg-gray-200'
                      }`}>
                        <DoorOpen className={`w-5 h-5 ${drawingMode === 'exit' ? 'text-white' : isDark || isModern ? 'text-gray-400' : 'text-gray-500'}`} />
                      </div>
                      <div className="text-left">
                        <p className={`font-semibold text-sm ${isDark || isModern ? 'text-white' : 'text-gray-900'}`}>
                          Vẽ Lối Ra
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : isModern ? 'text-on-surface-variant/70' : 'text-gray-500'}`}>
                          {visibleExits.length} lối ra
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => setDrawingMode('aisle')}
                      className={`w-full flex items-center gap-4 p-3.5 rounded-xl border transition-all ${
                        drawingMode === 'aisle'
                          ? 'border-cyan-500 bg-cyan-500/20'
                          : `${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : isModern ? 'bg-gray-800/30 border-gray-700/30 hover:border-cyan-500/50' : 'bg-white border-gray-200 hover:border-cyan-500'}`
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        drawingMode === 'aisle' ? 'bg-cyan-500' : isDark ? 'bg-gray-600' : isModern ? 'bg-gray-700/50' : 'bg-gray-200'
                      }`}>
                        <Square className={`w-5 h-5 ${drawingMode === 'aisle' ? 'text-white' : isDark || isModern ? 'text-gray-400' : 'text-gray-500'}`} />
                      </div>
                      <div className="text-left">
                        <p className={`font-semibold text-sm ${isDark || isModern ? 'text-white' : 'text-gray-900'}`}>
                          Vẽ Lối Đi
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : isModern ? 'text-on-surface-variant/70' : 'text-gray-500'}`}>
                          {visibleAisles.length} lối đi
                        </p>
                      </div>
                    </button>
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
                      <div className="relative">
                        <button
                          onClick={() => setIsClearDropdownOpen(!isClearDropdownOpen)}
                          disabled={visibleSeats.length === 0 && visibleExits.length === 0 && visibleAisles.length === 0}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                            (visibleSeats.length === 0 && visibleExits.length === 0 && visibleAisles.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
                          } ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : isModern ? 'bg-surface-variant/50 text-on-surface-variant hover:bg-error-container/20 hover:text-error' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                          <X className="w-4 h-4" />
                          Xóa...
                        </button>
                        
                        {isClearDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsClearDropdownOpen(false)} />
                            <div
                              className={`absolute right-0 mt-2 w-48 rounded-xl border shadow-xl z-50 py-1 transition-all overflow-hidden ${
                                isDark
                                  ? 'bg-gray-800 border-gray-700 text-gray-200'
                                  : isModern
                                    ? 'bg-[#0b1326]/95 backdrop-blur-2xl border-cinema-accent/15 text-white'
                                    : 'bg-white border-gray-200 text-gray-700'
                              }`}
                            >
                              <button
                                onClick={() => {
                                  handleClearSeats();
                                  setIsClearDropdownOpen(false);
                                }}
                                disabled={visibleSeats.length === 0}
                                className="w-full text-left px-4 py-2 text-xs transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Xóa Ghế ({visibleSeats.length})
                              </button>
                              <button
                                onClick={() => {
                                  handleClearExits();
                                  setIsClearDropdownOpen(false);
                                }}
                                disabled={visibleExits.length === 0}
                                className="w-full text-left px-4 py-2 text-xs transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Xóa Lối Ra ({visibleExits.length})
                              </button>
                              <button
                                onClick={() => {
                                  handleClearAisles();
                                  setIsClearDropdownOpen(false);
                                }}
                                disabled={visibleAisles.length === 0}
                                className="w-full text-left px-4 py-2 text-xs transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Xóa Lối Đi ({visibleAisles.length})
                              </button>
                              <div className={`border-t my-1 ${isDark ? 'border-gray-700' : isModern ? 'border-cinema-accent/15' : 'border-gray-100'}`} />
                              <button
                                onClick={() => {
                                  handleClearAll();
                                  setIsClearDropdownOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-xs transition-colors font-bold text-red-500 hover:bg-red-500/10"
                              >
                                Xóa Tất Cả
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant/70">
                      <p className="text-xs text-cinema-text-muted/70 mt-3 italic">
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

                    {/* Grid */}
                    <div className="overflow-auto max-h-96 w-full flex p-2">
                      <div className="relative inline-block mx-auto">
                        <div
                          ref={canvasRef}
                          className={`relative border-2 ${
                            isDark ? 'border-gray-700' : isModern ? 'border-outline-variant/30' : 'border-gray-300'
                          }`}
                          style={{
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
                          {/* Exit overlays */}
                          {visibleExits.map((exit) => (
                            <div
                              key={exit.id}
                              className="absolute border-2 cursor-pointer"
                              style={{
                                left: exit.colIndex * cellSize.width,
                                top: exit.rowIndex * cellSize.height,
                                width: exit.width * cellSize.width,
                                height: exit.height * cellSize.height,
                                borderColor: '#f43f5e',
                                backgroundColor: isDark ? 'rgba(244,63,94,0.25)' : isModern ? 'rgba(244,63,94,0.18)' : 'rgba(244,63,94,0.15)',
                              }}
                              title="Exit"
                            />
                          ))}

                          {/* Aisle overlays */}
                          {visibleAisles.map((aisle) => (
                            <div
                              key={aisle.id}
                              className="absolute border-2 cursor-pointer"
                              style={{
                                left: aisle.colIndex * cellSize.width,
                                top: aisle.rowIndex * cellSize.height,
                                width: aisle.width * cellSize.width,
                                height: aisle.height * cellSize.height,
                                borderColor: '#06b6d4',
                                backgroundColor: isDark ? 'rgba(6,182,212,0.25)' : isModern ? 'rgba(6,182,212,0.18)' : 'rgba(6,182,212,0.15)',
                              }}
                              title="Aisle"
                            />
                          ))}

                          {/* Seats */}
                          {visibleSeats.map((seat, index) => (
                            <div
                              key={index}
                              onClick={() => handleRemoveSeat(seat.colIndex, seat.rowIndex)}
                              className={`absolute cursor-pointer rounded transition-all hover:scale-110 flex items-center justify-center text-[10px] font-bold ${
                                isModern ? 'bg-primary-container text-white' : 'bg-primary-container text-white'
                              }`}
                              style={{
                                left: seat.colIndex * cellSize.width,
                                top: seat.rowIndex * cellSize.height,
                                width: cellSize.width - 4,
                                height: cellSize.height - 4,
                                margin: '2px',
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
                        <span className="w-3 h-3 rounded-sm" style={{backgroundColor: '#f43f5e'}} />
                        Lối ra (Exit)
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm bg-gray-500/30 border" style={{borderColor: '#475569'}} />
                        Trống (Empty)
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm" style={{backgroundColor: '#06b6d4'}} />
                        Lối đi (Aisle)
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
                        <p className={`text-[10px] uppercase tracking-wider font-bold ${isDark || isModern ? 'text-on-surface-variant/60' : 'text-gray-500'}`}>Tổng Diện Tích</p>
                        <p className={`text-sm font-bold ${isDark || isModern ? 'text-white' : 'text-gray-900'}`}>{cellSize.width}px × {cellSize.height}px cell</p>
                      </div>
                      <div>
                        <p className={`text-[10px] uppercase tracking-wider font-bold ${isDark || isModern ? 'text-on-surface-variant/60' : 'text-gray-500'}`}>Tổng Ghế</p>
                        <p className={`text-sm font-bold ${isDark || isModern ? 'text-white' : 'text-gray-900'}`}>{visibleSeats.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant/60 text-xs">
                      Click and drag to add seat, click on seat to remove
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
