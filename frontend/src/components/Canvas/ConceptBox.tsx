import { memo, useRef, useEffect, useState } from 'react';
import { useCanvasDrag } from './hooks/useCanvasDrag';
import type { ConceptBox as ConceptBoxType, Position } from './types';

interface ConceptBoxProps {
  box: ConceptBoxType;
  zoom: number;
  onPositionChange: (id: string, position: Position) => void;
  canvasBounds?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

export const ConceptBox = memo(function ConceptBox({
  box,
  zoom,
  onPositionChange,
  canvasBounds,
}: ConceptBoxProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(16);

  const { dragState, handleMouseDown, handleTouchStart } = useCanvasDrag({
    zoom,
    bounds: canvasBounds,
    onDrag: (position) => {
      onPositionChange(box.id, position);
    },
    onDragEnd: (position) => {
      onPositionChange(box.id, position);
    },
  });

  // Auto-adjust font size to fit text
  useEffect(() => {
    const textEl = textRef.current;
    const containerEl = containerRef.current;
    if (!textEl || !containerEl) return;

    const maxWidth = box.width - 24; // Padding
    let newFontSize = 16;

    // Reset to max size first
    textEl.style.fontSize = `${newFontSize}px`;

    // Reduce font size until text fits
    while (textEl.scrollWidth > maxWidth && newFontSize > 10) {
      newFontSize -= 1;
      textEl.style.fontSize = `${newFontSize}px`;
    }

    setFontSize(newFontSize);
  }, [box.name, box.width]);

  const currentX = dragState.isDragging && dragState.currentPosition
    ? dragState.currentPosition.x
    : box.x;
  const currentY = dragState.isDragging && dragState.currentPosition
    ? dragState.currentPosition.y
    : box.y;

  // Generate a lighter version of the color for the background
  const bgColor = `${box.color}20`; // 20 = 12.5% opacity in hex

  return (
    <div
      className="absolute select-none"
      style={{
        left: currentX,
        top: currentY,
        width: box.width,
        height: box.height,
        cursor: dragState.isDragging ? 'grabbing' : 'grab',
        zIndex: dragState.isDragging ? 100 : 10,
      }}
      onMouseDown={(e) => handleMouseDown(e, { x: box.x, y: box.y })}
      onTouchStart={(e) => handleTouchStart(e, { x: box.x, y: box.y })}
    >
      <div
        ref={containerRef}
        className="w-full h-full rounded-lg border-2 flex items-center justify-center shadow-md transition-shadow hover:shadow-lg overflow-hidden"
        style={{
          backgroundColor: bgColor,
          borderColor: box.color,
        }}
      >
        <span
          ref={textRef}
          className="font-semibold px-3 py-1 text-center leading-tight"
          style={{
            color: box.color,
            fontSize: `${fontSize}px`,
            wordBreak: 'break-word',
            maxWidth: '100%',
          }}
        >
          {box.name}
        </span>
      </div>
      {/* Color indicator dot */}
      <div
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full border-2 border-white shadow-sm"
        style={{ backgroundColor: box.color }}
      />
    </div>
  );
});
