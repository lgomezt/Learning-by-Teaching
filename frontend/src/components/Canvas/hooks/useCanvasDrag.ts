import { useState, useCallback, useRef, useEffect } from 'react';
import type { Position, DragState } from '../types';

interface UseCanvasDragOptions {
  onDragStart?: (position: Position) => void;
  onDrag?: (position: Position) => void;
  onDragEnd?: (position: Position) => void;
  bounds?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  zoom?: number;
}

interface UseCanvasDragReturn {
  dragState: DragState;
  handleMouseDown: (e: React.MouseEvent, initialPosition: Position) => void;
  handleTouchStart: (e: React.TouchEvent, initialPosition: Position) => void;
}

export function useCanvasDrag(options: UseCanvasDragOptions = {}): UseCanvasDragReturn {
  const { onDragStart, onDrag, onDragEnd, bounds, zoom = 1 } = options;

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startPosition: null,
    currentPosition: null,
    offset: null,
  });

  const dragStateRef = useRef(dragState);
  dragStateRef.current = dragState;

  const clampPosition = useCallback(
    (pos: Position): Position => {
      if (!bounds) return pos;
      return {
        x: Math.max(bounds.minX, Math.min(bounds.maxX, pos.x)),
        y: Math.max(bounds.minY, Math.min(bounds.maxY, pos.y)),
      };
    },
    [bounds]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, initialPosition: Position) => {
      e.preventDefault();
      e.stopPropagation();

      const offset = {
        x: e.clientX / zoom - initialPosition.x,
        y: e.clientY / zoom - initialPosition.y,
      };

      setDragState({
        isDragging: true,
        startPosition: initialPosition,
        currentPosition: initialPosition,
        offset,
      });

      onDragStart?.(initialPosition);
    },
    [zoom, onDragStart]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, initialPosition: Position) => {
      if (e.touches.length !== 1) return;
      e.stopPropagation();

      const touch = e.touches[0];
      const offset = {
        x: touch.clientX / zoom - initialPosition.x,
        y: touch.clientY / zoom - initialPosition.y,
      };

      setDragState({
        isDragging: true,
        startPosition: initialPosition,
        currentPosition: initialPosition,
        offset,
      });

      onDragStart?.(initialPosition);
    },
    [zoom, onDragStart]
  );

  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current.isDragging || !dragStateRef.current.offset) return;

      const newPosition = clampPosition({
        x: e.clientX / zoom - dragStateRef.current.offset.x,
        y: e.clientY / zoom - dragStateRef.current.offset.y,
      });

      setDragState((prev) => ({
        ...prev,
        currentPosition: newPosition,
      }));

      onDrag?.(newPosition);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragStateRef.current.isDragging || !dragStateRef.current.offset) return;
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const newPosition = clampPosition({
        x: touch.clientX / zoom - dragStateRef.current.offset.x,
        y: touch.clientY / zoom - dragStateRef.current.offset.y,
      });

      setDragState((prev) => ({
        ...prev,
        currentPosition: newPosition,
      }));

      onDrag?.(newPosition);
    };

    const handleMouseUp = () => {
      if (dragStateRef.current.currentPosition) {
        onDragEnd?.(dragStateRef.current.currentPosition);
      }

      setDragState({
        isDragging: false,
        startPosition: null,
        currentPosition: null,
        offset: null,
      });
    };

    const handleTouchEnd = () => {
      if (dragStateRef.current.currentPosition) {
        onDragEnd?.(dragStateRef.current.currentPosition);
      }

      setDragState({
        isDragging: false,
        startPosition: null,
        currentPosition: null,
        offset: null,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [dragState.isDragging, zoom, clampPosition, onDrag, onDragEnd]);

  return {
    dragState,
    handleMouseDown,
    handleTouchStart,
  };
}
