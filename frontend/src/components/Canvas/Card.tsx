import React, { memo, useCallback, useRef } from 'react';
import { useCanvasDrag } from './hooks/useCanvasDrag';
import type { CanvasCard, Position } from './types';

interface CardProps {
  card: CanvasCard;
  zoom: number;
  availableColors: string[];
  onPositionChange: (id: string, position: Position) => void;
  onColorChange: (id: string, color: string | null) => void;
  canvasBounds?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

const CARD_WIDTH = 180;
const CARD_MIN_HEIGHT = 60;

export const Card = memo(function Card({
  card,
  zoom,
  availableColors,
  onPositionChange,
  onColorChange,
  canvasBounds,
}: CardProps) {
  const isDraggingRef = useRef(false);
  const dragStartTimeRef = useRef(0);

  const { dragState, handleMouseDown, handleTouchStart } = useCanvasDrag({
    zoom,
    bounds: canvasBounds,
    onDragStart: () => {
      isDraggingRef.current = true;
      dragStartTimeRef.current = Date.now();
    },
    onDrag: (position) => {
      onPositionChange(card.id, position);
    },
    onDragEnd: (position) => {
      onPositionChange(card.id, position);
      // Reset drag state after a short delay
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 100);
    },
  });

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Only trigger color change if this wasn't a drag
      // Check if it was a quick click (< 200ms and minimal movement)
      const dragDuration = Date.now() - dragStartTimeRef.current;
      if (isDraggingRef.current || dragDuration > 200) {
        return;
      }

      e.stopPropagation();

      // Cycle through colors: null -> color1 -> color2 -> ... -> null
      if (availableColors.length === 0) return;

      const currentIndex = card.color ? availableColors.indexOf(card.color) : -1;
      const nextIndex = (currentIndex + 1) % (availableColors.length + 1);
      const nextColor = nextIndex === availableColors.length ? null : availableColors[nextIndex];

      onColorChange(card.id, nextColor);
    },
    [card.id, card.color, availableColors, onColorChange]
  );

  const currentX = dragState.isDragging && dragState.currentPosition
    ? dragState.currentPosition.x
    : card.x;
  const currentY = dragState.isDragging && dragState.currentPosition
    ? dragState.currentPosition.y
    : card.y;

  // Determine card colors
  const bgColor = card.color ? `${card.color}15` : '#f3f4f6'; // Light tint or gray
  const borderColor = card.color || '#d1d5db';
  const textColor = card.color || '#374151';

  return (
    <div
      className="absolute select-none"
      style={{
        left: currentX,
        top: currentY,
        width: CARD_WIDTH,
        minHeight: CARD_MIN_HEIGHT,
        cursor: dragState.isDragging ? 'grabbing' : 'grab',
        zIndex: dragState.isDragging ? 100 : 20,
      }}
      onMouseDown={(e) => handleMouseDown(e, { x: card.x, y: card.y })}
      onTouchStart={(e) => handleTouchStart(e, { x: card.x, y: card.y })}
      onClick={handleClick}
    >
      <div
        className="w-full h-full rounded-md border-2 p-3 shadow-sm transition-all hover:shadow-md"
        style={{
          backgroundColor: bgColor,
          borderColor: borderColor,
        }}
      >
        <p
          className="text-sm leading-relaxed"
          style={{ color: textColor }}
        >
          {card.text}
        </p>

        {/* Unsure indicator */}
        {card.isUnsure && (
          <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-bold">?</span>
          </div>
        )}

        {/* Color indicator - only show if assigned */}
        {card.color && (
          <div
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: card.color }}
          />
        )}
      </div>

      {/* Click hint tooltip on hover */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        <span className="text-xs text-gray-500 whitespace-nowrap bg-white px-1 rounded shadow-sm">
          Click to change color
        </span>
      </div>
    </div>
  );
});
