import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Loader2, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Grid3x3, Move, DoorOpen, Square } from 'lucide-react';
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
}

type Step = 'format' | 'seats';

const CreateAuditoriumModal: React.FC<CreateAuditoriumModalProps> = ({ cinemaId, isOpen, onClose, onSuccess }) => {
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

  // Update grid size when room size changes
  useEffect(() => {
    setGridSize({ cols: roomCols, rows: roomRows });
    // Clear seats, exits and aisles when grid size changes
    setSeats([]);
    setExits([]);
    setAisles([]);
  }, [roomCols, roomRows]);

  // Fetch movie formats
  useEffect(() => {
    if (isOpen && currentStep === 'format') {
      fetchMovieFormats();
    }
  }, [isOpen, currentStep]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('format');
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

  // Clear all seats
  const handleClearAllSeats = () => {
    setSeats([]);
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

  const handleSubmit = async () => {
    if (!selectedFormat || !auditoriumNumber.trim() || seats.length === 0) {
      setCreateError('Please fill in all information: select movie format, enter room name and add at least one seat.');
      return;
    }

    setCreateError(null);
    setCreateLoading(true);

    try {
      const requestData = {
        auditoriumNumber: auditoriumNumber.trim(),
        movieFormatId: [selectedFormat.formatId],
        cinemaId,
        // Backend often expects singular or plural, or simply 'seats'
        // We provide the official type name and a common fallback
        addReqSeatsAuditoriumDto: seats,
        seats: seats // Fallback just in case
      };

      console.log('--- CREATING AUDITORIUM PAYLOAD ---');
      console.log('Data:', JSON.stringify(requestData, null, 2));
      console.log('Seats count:', seats.length);
      
      const response = await facilitiesApi.createAuditorium(requestData as any);
      console.log('Create auditorium response:', response);

      if (response.isSuccess) {
        setCreateSuccess(true);
        if (onSuccess) {
          await onSuccess();
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setCreateError(response.message || 'Failed to create auditorium. Please try again.');
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

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] rounded-xl border shadow-2xl transition-all flex flex-col ${theme === 'dark'
          ? 'bg-gray-900 border-gray-800'
          : theme === 'modern'
            ? 'bg-[#0f172a]/40 backdrop-blur-2xl border-indigo-500/20 shadow-sm'
            : 'bg-white border-gray-200'
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/20 shadow-sm' : 'border-gray-200'
          }`}>
          <div>
            <h2 className={`text-2xl font-black ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white modern:text-white'
              }`}>
              {t('createAuditorium.title')}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === 'format'
                ? theme === 'modern' ? 'bg-white/20 hover:bg-white/30 backdrop-blur-md border border-indigo-500/20 text-white text-white shadow-md' : 'bg-red-600 text-white'
                : theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-300 text-gray-600'
                }`}>
                1
              </div>
              <div className={`h-1 w-8 ${currentStep === 'seats'
                ? theme === 'modern' ? 'bg-white/20 hover:bg-white/30 backdrop-blur-md border border-indigo-500/20 text-white shadow-md text-white' : 'bg-red-600'
                : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                }`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === 'seats'
                ? theme === 'modern' ? 'bg-white/20 hover:bg-white/30 backdrop-blur-md border border-indigo-500/20 text-white text-white shadow-md' : 'bg-red-600 text-white'
                : theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-300 text-gray-600'
                }`}>
                2
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${theme === 'dark'
              ? 'hover:bg-gray-800 text-gray-400'
              : theme === 'modern'
                ? 'hover:bg-indigo-500/10 text-white font-medium'
                : 'hover:bg-gray-100 text-gray-600'
              }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Success Message */}
          {createSuccess && (
            <div className={`mb-4 p-4 rounded-lg border flex items-center ${theme === 'dark'
              ? 'bg-green-900/40 border-green-500/50 text-green-100'
              : theme === 'modern'
                ? 'bg-green-900/40 border-green-500/50 text-green-100'
                : 'bg-green-50 border-green-200 text-green-800'
              }`}>
              <CheckCircle className="w-5 h-5 mr-3 shrink-0 text-green-500" />
              <span className="text-sm font-medium">Auditorium added successfully! Updating...</span>
            </div>
          )}

          {/* Error Message */}
          {createError && (
            <div className={`mb-4 p-4 rounded-lg border flex items-center ${theme === 'dark'
              ? 'bg-red-900/40 border-red-500/50 text-red-100'
              : theme === 'modern'
                ? 'bg-red-900/40 border-red-500/50 text-red-100'
                : 'bg-red-50 border-red-200 text-red-800'
              }`}>
              <AlertCircle className="w-5 h-5 mr-3 shrink-0 text-red-500" />
              <span className="text-sm font-medium">{createError}</span>
            </div>
          )}

          {/* Step 1: Select Movie Format */}
          {currentStep === 'format' && (
            <div className="space-y-4">
              <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white modern:text-white'
                }`}>
                {t('createAuditorium.step1')}
              </h3>

              {formatsLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className={`w-12 h-12 animate-spin ${theme === 'modern' ? 'text-white/60' : 'text-red-600'
                    }`} />
                </div>
              )}

              {formatsError && (
                <div className={`p-4 rounded-lg border ${theme === 'dark'
                  ? 'bg-red-900/40 border-red-500/50 text-red-100'
                  : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                  {formatsError}
                </div>
              )}

              {!formatsLoading && !formatsError && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {movieFormats.map((format) => (
                    <button
                      key={format.formatId}
                      onClick={() => handleFormatSelect(format)}
                      className={`p-4 rounded-lg border text-left transition-all ${selectedFormat?.formatId === format.formatId
                        ? theme === 'modern'
                          ? 'border-indigo-500/30 text-white shadow-md bg-white/[0.08] backdrop-blur-md shadow-lg'
                          : theme === 'dark'
                            ? 'border-red-500 bg-red-900/30 shadow-lg'
                            : 'border-red-600 bg-red-50 shadow-lg'
                        : theme === 'dark'
                          ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                          : theme === 'modern'
                            ? 'bg-slate-800/20 border-indigo-500/20 shadow-sm hover:border-indigo-500/30 text-white shadow-md/50'
                            : 'bg-white border-gray-200 hover:border-red-300'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className={`font-bold text-lg ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white modern:text-white'
                              }`}>
                              {format.formatName}
                            </h4>
                            {selectedFormat?.formatId === format.formatId && (
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${theme === 'modern' ? 'bg-white/20 hover:bg-white/30 backdrop-blur-md border border-indigo-500/20 text-white shadow-md text-white' : 'bg-red-600'
                                }`}>
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                          <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white font-medium' : 'text-gray-600'
                            }`}>
                            {format.formatDescription}
                          </p>
                          <p className={`text-lg font-black ${theme === 'modern' ? 'text-white font-medium' : 'text-red-600'
                            }`}>
                            {formatPrice(format.movieFormatPrice)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Seats Layout & Exit Drawing */}
          {currentStep === 'seats' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white modern:text-white'
                  }`}>
                  {t('createAuditorium.step2')}
                </h3>
                {selectedFormat && (
                  <div className={`px-3 py-1 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : theme === 'modern' ? 'bg-slate-800/20 border-indigo-500/20 shadow-sm' : 'bg-gray-50 border-gray-200'
                    }`}>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white font-medium' : 'text-gray-600'
                      }`}>
                      Format: <span className={`font-bold ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white modern:text-white'
                        }`}>{selectedFormat.formatName}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Auditorium Number */}
              <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : theme === 'modern' ? 'bg-slate-800/20 border-indigo-500/20 shadow-sm' : 'bg-gray-50 border-gray-200'
                }`}>
                <h4 className={`text-sm font-semibold mb-3 ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white modern:text-white'
                  }`}>
                  Thông Tin Phòng Chiếu
                </h4>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white modern:text-white'
                    }`}>
                    Room Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={auditoriumNumber}
                    onChange={(e) => setAuditoriumNumber(e.target.value)}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors ${theme === 'modern' ? 'focus:border-indigo-500/30 text-white shadow-md' : 'focus:border-indigo-500/50 focus:shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                      } ${theme === 'dark'
                        ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                        : theme === 'modern'
                          ? 'bg-white/[0.08] backdrop-blur-md border-indigo-500/20 shadow-sm text-white placeholder-slate-400/70'
                          : 'bg-white border-gray-300 text-gray-900 dark:text-white modern:text-white placeholder-gray-400'
                      }`}
                    placeholder="e.g., Room 1, Room A, VIP Room 1..."
                  />
                </div>
              </div>

              {/* Room Size Configuration */}
              <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : theme === 'modern' ? 'bg-slate-800/20 border-indigo-500/20 shadow-sm' : 'bg-gray-50 border-gray-200'
                }`}>
                <h4 className={`text-sm font-semibold mb-3 ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white modern:text-white'
                  }`}>
                  Kích Thước Phòng
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-2 ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white modern:text-white'
                      }`}>
                      Columns <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="20"
                      value={roomCols}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 5;
                        setRoomCols(Math.max(5, Math.min(20, value)));
                      }}
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none transition-colors text-sm ${theme === 'modern' ? 'focus:border-indigo-500/30 text-white shadow-md' : 'focus:border-indigo-500/50 focus:shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                        } ${theme === 'dark'
                          ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                          : theme === 'modern'
                            ? 'bg-white/[0.08] backdrop-blur-md border-indigo-500/20 shadow-sm text-white placeholder-slate-400/70'
                            : 'bg-white border-gray-300 text-gray-900 dark:text-white modern:text-white placeholder-gray-400'
                        }`}
                      placeholder="5-20"
                    />
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : theme === 'modern' ? 'text-white/50' : 'text-gray-500'
                      }`}>
                      Min: 5, Max: 20
                    </p>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-2 ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white modern:text-white'
                      }`}>
                      Rows <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="15"
                      value={roomRows}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 5;
                        setRoomRows(Math.max(5, Math.min(15, value)));
                      }}
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none transition-colors text-sm ${theme === 'modern' ? 'focus:border-indigo-500/30 text-white shadow-md' : 'focus:border-indigo-500/50 focus:shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                        } ${theme === 'dark'
                          ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                          : theme === 'modern'
                            ? 'bg-white/[0.08] backdrop-blur-md border-indigo-500/20 shadow-sm text-white placeholder-slate-400/70'
                            : 'bg-white border-gray-300 text-gray-900 dark:text-white modern:text-white placeholder-gray-400'
                        }`}
                      placeholder="5-15"
                    />
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : theme === 'modern' ? 'text-white/50' : 'text-gray-500'
                      }`}>
                      Min: 5, Max: 15
                    </p>
                  </div>
                </div>
              </div>

              {/* Drawing Mode Selection */}
              <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : theme === 'modern' ? 'bg-slate-800/20 border-indigo-500/20 shadow-sm' : 'bg-gray-50 border-gray-200'
                }`}>
                <h4 className={`text-sm font-semibold mb-3 ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white modern:text-white'
                  }`}>
                  Draw Mode
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <button
                    onClick={() => setDrawingMode('seat')}
                    className={`p-4 rounded-lg border transition-all ${drawingMode === 'seat'
                      ? theme === 'modern'
                        ? 'border-indigo-500/30 text-white shadow-md bg-white/[0.08] backdrop-blur-md shadow-lg'
                        : theme === 'dark'
                          ? 'border-red-500 bg-red-900/30 shadow-lg'
                          : 'border-red-600 bg-red-50 shadow-lg'
                      : theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 hover:border-gray-500'
                        : theme === 'modern'
                          ? 'bg-slate-800/20 border-indigo-500/20 shadow-sm hover:border-indigo-500/30 text-white shadow-md/50'
                          : 'bg-white border-gray-200 hover:border-red-300'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${drawingMode === 'seat'
                        ? theme === 'modern' ? 'bg-white/20 hover:bg-white/30 backdrop-blur-md border border-indigo-500/20 text-white shadow-md text-white' : 'bg-red-600'
                        : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                        }`}>
                        <Grid3x3 className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className={`font-semibold ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white modern:text-white'
                          }`}>
                          {t('createAuditorium.drawSeat')}
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white font-medium' : 'text-gray-600'
                          }`}>
                          {t('createAuditorium.seatsCount', { count: seats.length })}
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setDrawingMode('exit')}
                    className={`p-4 rounded-lg border transition-all ${drawingMode === 'exit'
                      ? theme === 'modern'
                        ? 'border-green-400 bg-green-800/30 shadow-lg'
                        : theme === 'dark'
                          ? 'border-green-500 bg-green-900/30 shadow-lg'
                          : 'border-green-600 bg-green-50 shadow-lg'
                      : theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 hover:border-gray-500'
                        : theme === 'modern'
                          ? 'bg-slate-800/20 border-indigo-500/20 shadow-sm hover:border-green-400/50'
                          : 'bg-white border-gray-200 hover:border-green-300'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${drawingMode === 'exit'
                        ? theme === 'modern' ? 'bg-green-500' : 'bg-green-600'
                        : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                        }`}>
                        <DoorOpen className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className={`font-semibold ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white modern:text-white'
                          }`}>
                          {t('createAuditorium.drawExit')}
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white font-medium' : 'text-gray-600'
                          }`}>
                          {t('createAuditorium.exitsCount', { count: exits.length })}
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setDrawingMode('aisle')}
                    className={`p-4 rounded-lg border transition-all ${drawingMode === 'aisle'
                      ? theme === 'modern'
                        ? 'border-blue-400 bg-blue-800/30 shadow-lg'
                        : theme === 'dark'
                          ? 'border-blue-500 bg-blue-900/30 shadow-lg'
                          : 'border-blue-600 bg-blue-50 shadow-lg'
                      : theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 hover:border-gray-500'
                        : theme === 'modern'
                          ? 'bg-slate-800/20 border-indigo-500/20 shadow-sm hover:border-blue-400/50'
                          : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${drawingMode === 'aisle'
                        ? theme === 'modern' ? 'bg-blue-500' : 'bg-blue-600'
                        : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                        }`}>
                        <Square className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className={`font-semibold ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white modern:text-white'
                          }`}>
                          {t('createAuditorium.drawAisle')}
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white font-medium' : 'text-gray-600'
                          }`}>
                          {t('createAuditorium.aislesCount', { count: aisles.length })}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Helper buttons for seat mode */}
                {drawingMode === 'seat' && (
                  <div className="flex flex-wrap gap-3 mt-3">
                    <button
                      onClick={handleAutoFillSeats}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${theme === 'modern'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-700 opacity-90 hover:from-indigo-500 hover:to-purple-500 hover:opacity-100 hover:shadow-[0_0_10px_rgba(129,140,248,0.3)] hover:-translate-y-0.5 shadow-lg shadow-indigo-500/10 border-none text-white transition-all border border-indigo-500/30 shadow-md text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                      <Plus className="w-4 h-4" />
                      Auto Fill Seats
                    </button>
                    <button
                      onClick={handleClearAllSeats}
                      disabled={seats.length === 0}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${seats.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                        } ${theme === 'dark'
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          : theme === 'modern'
                            ? 'bg-[#1e293b]/30 backdrop-blur-xl hover:bg-slate-600/50 text-white font-medium'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:text-gray-300 modern:text-gray-200'
                        }`}
                    >
                      <X className="w-4 h-4" />
                      Clear All Seats
                    </button>
                  </div>
                )}

                {/* Instructions */}
                <div className={`mt-3 p-3 rounded ${theme === 'dark' ? 'bg-gray-900/50' : theme === 'modern' ? 'bg-white/[0.08] backdrop-blur-md' : 'bg-blue-50'
                  }`}>
                  {drawingMode === 'seat' && (
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : theme === 'modern' ? 'text-white font-medium' : 'text-blue-700'
                      }`}>
                      💡 Click and drag on grid to draw seats. Click on a seat to remove.
                    </p>
                  )}
                  {drawingMode === 'exit' && (
                    <p className={`text-xs ${theme === 'dark' ? 'text-green-300' : theme === 'modern' ? 'text-green-200' : 'text-green-700'
                      }`}>
                      💡 Click and drag on grid to draw exit. Click on an exit to remove.
                    </p>
                  )}
                  {drawingMode === 'aisle' && (
                    <p className={`text-xs ${theme === 'dark' ? 'text-blue-300' : theme === 'modern' ? 'text-blue-200' : 'text-blue-700'
                      }`}>
                      💡 Click and drag on grid to draw walkway. Click on an walkway to remove.
                    </p>
                  )}
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : theme === 'modern' ? 'bg-slate-800/20 border-indigo-500/20 shadow-sm' : 'bg-gray-50 border-gray-200'
                }`}>
                <p className={`text-sm mb-2 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white font-medium' : 'text-gray-600'
                  }`}>
                  <Move className="w-4 h-4" />
                  {drawingMode === 'seat' && (isMobile
                    ? 'Touch and drag to add seat, click on seat to remove'
                    : 'Click and drag to add seat, click on seat to remove')}
                  {drawingMode === 'exit' && (isMobile
                    ? 'Touch and drag to draw exit, click on exit to remove'
                    : 'Click and drag to draw exit, click on exit to remove')}
                  {drawingMode === 'aisle' && (isMobile
                    ? 'Touch and drag to draw walkway, click on walkway to remove'
                    : 'Click and drag to draw walkway, click on walkway to remove')}
                </p>
              </div>

              {/* Screen */}
              <div className={`text-center py-2 mb-4 rounded ${theme === 'dark' ? 'bg-gray-800' : theme === 'modern' ? 'bg-white/[0.08] backdrop-blur-md' : 'bg-gray-200'
                }`}>
                <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white font-medium' : 'text-gray-600'
                  }`}>
                  SCREEN
                </p>
              </div>


              {/* Grid Canvas */}
              <div className="overflow-auto max-h-96 flex items-center justify-center">
                <div className="relative inline-block">
                  <div
                    ref={canvasRef}
                    className={`relative border-2 ${theme === 'dark' ? 'border-gray-700' : theme === 'modern' ? 'border-indigo-500/20 shadow-sm' : 'border-gray-300'
                      }`}
                    style={{
                      width: gridSize.cols * cellSize.width,
                      height: gridSize.rows * cellSize.height,
                      backgroundImage: `
                        linear-gradient(to right, ${theme === 'dark' ? 'rgba(75, 85, 99, 0.3)' : theme === 'modern' ? 'rgba(147, 51, 234, 0.2)' : 'rgba(209, 213, 219, 0.3)'} 1px, transparent 1px),
                        linear-gradient(to bottom, ${theme === 'dark' ? 'rgba(75, 85, 99, 0.3)' : theme === 'modern' ? 'rgba(147, 51, 234, 0.2)' : 'rgba(209, 213, 219, 0.3)'} 1px, transparent 1px)
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
                    {/* Exit overlays - can be anywhere in grid */}
                    {exits.map((exit) => (
                      <div
                        key={exit.id}
                        className={`absolute border-2 cursor-pointer ${theme === 'dark' ? 'border-green-500 bg-green-800/40' : theme === 'modern' ? 'border-green-400 bg-green-800/40' : 'border-green-500 bg-green-200/50'
                          }`}
                        style={{
                          left: exit.colIndex * cellSize.width,
                          top: exit.rowIndex * cellSize.height,
                          width: exit.width * cellSize.width,
                          height: exit.height * cellSize.height,
                        }}
                        title="Exit"
                      />
                    ))}

                    {/* Aisles */}
                    {aisles.map((aisle) => (
                      <div
                        key={aisle.id}
                        className={`absolute border-2 cursor-pointer ${theme === 'dark' ? 'border-blue-500 bg-blue-800/40' : theme === 'modern' ? 'border-blue-400 bg-blue-800/40' : 'border-blue-500 bg-blue-200/50'
                          }`}
                        style={{
                          left: aisle.colIndex * cellSize.width,
                          top: aisle.rowIndex * cellSize.height,
                          width: aisle.width * cellSize.width,
                          height: aisle.height * cellSize.height,
                        }}
                        title="Aisle"
                      />
                    ))}

                    {/* Seats */}
                    {seats.map((seat, index) => (
                      <div
                        key={index}
                        onClick={() => handleRemoveSeat(seat.colIndex, seat.rowIndex)}
                        className={`absolute cursor-pointer rounded transition-all hover:scale-110 flex items-center justify-center text-xs font-bold ${theme === 'modern'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-700 opacity-90 border-none text-white shadow-md text-white'
                          : 'bg-gradient-to-br from-red-600 to-red-800 text-white'
                          }`}
                        style={{
                          left: seat.coordX,
                          top: seat.coordY,
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

              {/* Grid Info */}
              <div className={`p-3 rounded-lg text-sm ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : theme === 'modern' ? 'bg-slate-800/20 text-white font-medium' : 'bg-gray-50 text-gray-600'
                }`}>
                <p>Size: {gridSize.cols} columns × {gridSize.rows} rows</p>
                <p>Cell size: {cellSize.width}px × {cellSize.height}px</p>
                {exits.length > 0 && (
                  <p className="mt-1">
                    <span className="font-semibold">Exits:</span> {exits.length} lối ra đã vẽ
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-between gap-3 p-6 border-t ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/20 shadow-sm' : 'border-gray-200'
          }`}>
          <button
            onClick={currentStep === 'format' ? onClose : handlePrevStep}
            disabled={createLoading}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${theme === 'dark'
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              : theme === 'modern'
                ? 'bg-[#1e293b]/30 backdrop-blur-xl hover:bg-slate-600/50 text-white font-medium'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:text-gray-300 modern:text-gray-200'
              } ${createLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {currentStep !== 'format' && <ArrowLeft className="w-4 h-4" />}
            {currentStep === 'format' ? 'Cancel' : 'Back'}
          </button>

          {currentStep === 'seats' ? (
            <button
              onClick={handleSubmit}
              disabled={createLoading || seats.length === 0}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${createLoading || seats.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                } ${theme === 'modern'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-700 opacity-90 hover:from-indigo-500 hover:to-purple-500 hover:opacity-100 hover:shadow-[0_0_10px_rgba(129,140,248,0.3)] hover:-translate-y-0.5 shadow-lg shadow-indigo-500/10 border-none text-white transition-all border border-indigo-500/30 shadow-md text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
            >
              {createLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Auditorium
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNextStep}
              disabled={currentStep === 'format' && !selectedFormat}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${currentStep === 'format' && !selectedFormat
                ? 'opacity-50 cursor-not-allowed'
                : ''
                } ${theme === 'modern'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-700 opacity-90 hover:from-indigo-500 hover:to-purple-500 hover:opacity-100 hover:shadow-[0_0_10px_rgba(129,140,248,0.3)] hover:-translate-y-0.5 shadow-lg shadow-indigo-500/10 border-none text-white transition-all border border-indigo-500/30 shadow-md text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateAuditoriumModal;
