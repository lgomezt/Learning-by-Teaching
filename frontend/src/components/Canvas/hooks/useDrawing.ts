import { useState, useCallback, useRef } from 'react';
import type { DrawingStroke } from '../types';

interface UseDrawingOptions {
  color: string;
  strokeWidth: number;
  zoom?: number;
}

interface UseDrawingReturn {
  isDrawing: boolean;
  currentStroke: { x: number; y: number }[] | null;
  handlePointerDown: (e: React.PointerEvent, canvasRect: DOMRect) => void;
  handlePointerMove: (e: React.PointerEvent, canvasRect: DOMRect) => void;
  handlePointerUp: () => DrawingStroke | null;
}

// Generate unique ID
const generateId = () =>
  `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function useDrawing(options: UseDrawingOptions): UseDrawingReturn {
  const { color, strokeWidth, zoom = 1 } = options;

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[] | null>(null);

  const strokeRef = useRef<{ x: number; y: number }[]>([]);
  const colorRef = useRef(color);
  const strokeWidthRef = useRef(strokeWidth);

  // Keep refs updated
  colorRef.current = color;
  strokeWidthRef.current = strokeWidth;

  const getPoint = useCallback(
    (e: React.PointerEvent, canvasRect: DOMRect) => {
      return {
        x: (e.clientX - canvasRect.left) / zoom,
        y: (e.clientY - canvasRect.top) / zoom,
      };
    },
    [zoom]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, canvasRect: DOMRect) => {
      e.preventDefault();
      const point = getPoint(e, canvasRect);
      strokeRef.current = [point];
      setCurrentStroke([point]);
      setIsDrawing(true);
    },
    [getPoint]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent, canvasRect: DOMRect) => {
      if (!isDrawing) return;

      const point = getPoint(e, canvasRect);
      strokeRef.current.push(point);
      setCurrentStroke([...strokeRef.current]);
    },
    [isDrawing, getPoint]
  );

  const handlePointerUp = useCallback((): DrawingStroke | null => {
    if (!isDrawing || strokeRef.current.length < 2) {
      setIsDrawing(false);
      setCurrentStroke(null);
      strokeRef.current = [];
      return null;
    }

    const stroke: DrawingStroke = {
      id: generateId(),
      points: [...strokeRef.current],
      color: colorRef.current,
      strokeWidth: strokeWidthRef.current,
    };

    setIsDrawing(false);
    setCurrentStroke(null);
    strokeRef.current = [];

    return stroke;
  }, [isDrawing]);

  return {
    isDrawing,
    currentStroke,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
