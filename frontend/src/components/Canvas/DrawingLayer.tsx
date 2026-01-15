import React, { useRef, useCallback } from 'react';
import { useDrawing } from './hooks/useDrawing';
import type { DrawingStroke } from './types';

interface DrawingLayerProps {
  strokes: DrawingStroke[];
  isDrawing: boolean;
  color: string;
  strokeWidth: number;
  onStrokeComplete: (stroke: DrawingStroke) => void;
  width: number;
  height: number;
  zoom: number;
}

// Convert points to SVG path
function pointsToPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';

  const [first, ...rest] = points;
  let path = `M ${first.x} ${first.y}`;

  // Use quadratic curves for smoother lines
  for (let i = 0; i < rest.length - 1; i++) {
    const p0 = rest[i];
    const p1 = rest[i + 1];
    const midX = (p0.x + p1.x) / 2;
    const midY = (p0.y + p1.y) / 2;
    path += ` Q ${p0.x} ${p0.y} ${midX} ${midY}`;
  }

  // Last point
  const last = rest[rest.length - 1];
  if (last) {
    path += ` L ${last.x} ${last.y}`;
  }

  return path;
}

export function DrawingLayer({
  strokes,
  isDrawing: isDrawingMode,
  color,
  strokeWidth,
  onStrokeComplete,
  width,
  height,
  zoom,
}: DrawingLayerProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const {
    isDrawing,
    currentStroke,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useDrawing({ color, strokeWidth, zoom });

  const getCanvasRect = useCallback((): DOMRect | null => {
    return svgRef.current?.getBoundingClientRect() || null;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawingMode) return;
      const rect = getCanvasRect();
      if (rect) {
        handlePointerDown(e, rect);
      }
    },
    [isDrawingMode, getCanvasRect, handlePointerDown]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawingMode || !isDrawing) return;
      const rect = getCanvasRect();
      if (rect) {
        handlePointerMove(e, rect);
      }
    },
    [isDrawingMode, isDrawing, getCanvasRect, handlePointerMove]
  );

  const onPointerUp = useCallback(() => {
    if (!isDrawingMode) return;
    const stroke = handlePointerUp();
    if (stroke) {
      onStrokeComplete(stroke);
    }
  }, [isDrawingMode, handlePointerUp, onStrokeComplete]);

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0"
      style={{
        width,
        height,
        cursor: isDrawingMode ? 'crosshair' : 'default',
        pointerEvents: isDrawingMode ? 'auto' : 'none',
        touchAction: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* Existing strokes */}
      {strokes.map((stroke) => (
        <path
          key={stroke.id}
          d={pointsToPath(stroke.points)}
          stroke={stroke.color}
          strokeWidth={stroke.strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* Current stroke being drawn */}
      {currentStroke && currentStroke.length > 1 && (
        <path
          d={pointsToPath(currentStroke)}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.8}
        />
      )}
    </svg>
  );
}
