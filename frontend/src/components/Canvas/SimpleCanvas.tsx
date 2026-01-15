import { useState, useCallback, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';

// Types for canvas operations
export interface ConceptCard {
  id: string;
  text: string;
  x: number;
  y: number;
  column: 'left' | 'right' | 'middle';
  isUnsure?: boolean;
}

export interface CanvasSnapshot {
  cards: ConceptCard[];
  columnLabels: { left: string; right: string };
}

export interface SimpleCanvasHandle {
  addCard: (text: string, column: 'left' | 'right' | 'middle', isUnsure?: boolean) => string;
  setColumnLabels: (left: string, right: string) => void;
  getSnapshot: () => CanvasSnapshot;
}

interface SimpleCanvasProps {
  onShapeChange?: (snapshot: CanvasSnapshot) => void;
  initialLeftLabel?: string;
  initialRightLabel?: string;
  onReady?: (handle: SimpleCanvasHandle) => void;
}

// Canvas layout configuration
const CANVAS_CONFIG = {
  width: 800,
  height: 600,
  columnWidth: 300,
  columnGap: 100,
  cardStartY: 80,
  cardSpacingY: 100,
  cardWidth: 180,
  cardHeight: 80,
  middleZoneWidth: 120,
};

// Generate unique ID
const generateId = () => `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Determine column based on x position
function determineColumn(x: number): 'left' | 'right' | 'middle' {
  const centerX = CANVAS_CONFIG.width / 2;
  const middleStart = centerX - CANVAS_CONFIG.middleZoneWidth / 2;
  const middleEnd = centerX + CANVAS_CONFIG.middleZoneWidth / 2;
  
  if (x < middleStart - 50) return 'left';
  if (x > middleEnd + 50) return 'right';
  return 'middle';
}

// Get x position for a column
function getColumnX(column: 'left' | 'right' | 'middle'): number {
  const centerX = CANVAS_CONFIG.width / 2;
  switch (column) {
    case 'left':
      return centerX / 2 - CANVAS_CONFIG.cardWidth / 2;
    case 'right':
      return centerX + centerX / 2 - CANVAS_CONFIG.cardWidth / 2;
    case 'middle':
      return centerX - CANVAS_CONFIG.cardWidth / 2;
  }
}

// Get card color based on column and unsure state
function getCardColor(column: 'left' | 'right' | 'middle', isUnsure?: boolean): string {
  if (isUnsure) return 'bg-amber-100 border-amber-300';
  switch (column) {
    case 'left':
      return 'bg-emerald-50 border-emerald-200';
    case 'right':
      return 'bg-blue-50 border-blue-200';
    case 'middle':
      return 'bg-gray-50 border-gray-200';
  }
}

export const SimpleCanvas = forwardRef<SimpleCanvasHandle, SimpleCanvasProps>(
  ({ onShapeChange, initialLeftLabel = 'Category A', initialRightLabel = 'Category B', onReady }, ref) => {
    const [cards, setCards] = useState<ConceptCard[]>([]);
    const [columnLabels, setColumnLabelsState] = useState({ left: initialLeftLabel, right: initialRightLabel });
    const [zoom, setZoom] = useState(1);
    const [dragState, setDragState] = useState<{
      cardId: string | null;
      offsetX: number;
      offsetY: number;
    }>({ cardId: null, offsetX: 0, offsetY: 0 });
    
    const containerRef = useRef<HTMLDivElement>(null);
    const cardCountRef = useRef({ left: 0, right: 0, middle: 0 });

    // Get current snapshot
    const getSnapshot = useCallback((): CanvasSnapshot => {
      return { cards, columnLabels };
    }, [cards, columnLabels]);

    // Add a new card - use functional setState to avoid stale closure
    const addCard = useCallback((text: string, column: 'left' | 'right' | 'middle', isUnsure = false): string => {
      const id = generateId();
      const x = getColumnX(column);
      const cardIndex = cardCountRef.current[column];
      const y = CANVAS_CONFIG.cardStartY + cardIndex * CANVAS_CONFIG.cardSpacingY;
      cardCountRef.current[column]++;

      const newCard: ConceptCard = {
        id,
        text,
        x,
        y,
        column,
        isUnsure,
      };

      console.log('[SimpleCanvas] Adding card:', text, 'to column:', column);
      setCards(prev => {
        const updated = [...prev, newCard];
        // Notify of change with latest state
        if (onShapeChange) {
          setTimeout(() => onShapeChange({ cards: updated, columnLabels }), 0);
        }
        return updated;
      });

      return id;
    }, [columnLabels, onShapeChange]);

    // Update column labels
    const setColumnLabels = useCallback((left: string, right: string) => {
      setColumnLabelsState({ left, right });
    }, []);

    // Create the handle object - use refs to avoid stale closures
    const handleRef = useRef<SimpleCanvasHandle>({
      addCard,
      setColumnLabels,
      getSnapshot,
    });
    
    // Keep handleRef up to date
    handleRef.current = {
      addCard,
      setColumnLabels,
      getSnapshot,
    };

    // Expose imperative handle that delegates to current functions
    useImperativeHandle(ref, () => ({
      addCard: (text, column, isUnsure) => handleRef.current.addCard(text, column, isUnsure),
      setColumnLabels: (left, right) => handleRef.current.setColumnLabels(left, right),
      getSnapshot: () => handleRef.current.getSnapshot(),
    }), []);

    // Call onReady when component mounts - pass a stable wrapper that delegates
    useEffect(() => {
      if (onReady) {
        const stableHandle: SimpleCanvasHandle = {
          addCard: (text, column, isUnsure) => handleRef.current.addCard(text, column, isUnsure),
          setColumnLabels: (left, right) => handleRef.current.setColumnLabels(left, right),
          getSnapshot: () => handleRef.current.getSnapshot(),
        };
        onReady(stableHandle);
      }
    }, [onReady]);

    // Drag handlers
    const handleMouseDown = useCallback((e: React.MouseEvent, cardId: string) => {
      e.preventDefault();
      const card = cards.find(c => c.id === cardId);
      if (!card || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const offsetX = (e.clientX - rect.left) / zoom - card.x;
      const offsetY = (e.clientY - rect.top) / zoom - card.y;

      setDragState({ cardId, offsetX, offsetY });
    }, [cards, zoom]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
      if (!dragState.cardId || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const newX = Math.max(0, Math.min(
        CANVAS_CONFIG.width - CANVAS_CONFIG.cardWidth,
        (e.clientX - rect.left) / zoom - dragState.offsetX
      ));
      const newY = Math.max(0, Math.min(
        CANVAS_CONFIG.height - CANVAS_CONFIG.cardHeight,
        (e.clientY - rect.top) / zoom - dragState.offsetY
      ));

      setCards(prev => prev.map(card =>
        card.id === dragState.cardId
          ? { ...card, x: newX, y: newY }
          : card
      ));
    }, [dragState, zoom]);

    const handleMouseUp = useCallback(() => {
      if (!dragState.cardId) return;

      // Update column based on new position
      setCards(prev => prev.map(card => {
        if (card.id === dragState.cardId) {
          const newColumn = determineColumn(card.x + CANVAS_CONFIG.cardWidth / 2);
          return { ...card, column: newColumn };
        }
        return card;
      }));

      setDragState({ cardId: null, offsetX: 0, offsetY: 0 });

      // Notify of change
      if (onShapeChange) {
        onShapeChange(getSnapshot());
      }
    }, [dragState, onShapeChange, getSnapshot]);

    // Zoom handlers
    const handleZoomIn = () => setZoom(z => Math.min(2, z + 0.25));
    const handleZoomOut = () => setZoom(z => Math.max(0.5, z - 0.25));
    const handleZoomReset = () => setZoom(1);

    return (
      <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: '#f8f5f0' }}>
        {/* Column headers overlay */}
        <div 
          className="absolute top-4 left-0 right-0 z-10 flex justify-around pointer-events-none px-8"
          style={{ paddingTop: '8px' }}
        >
          <div className="text-center">
            <span 
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: 'rgba(134, 239, 172, 0.3)', color: '#166534' }}
            >
              {columnLabels.left}
            </span>
          </div>
          <div className="text-center">
            <span 
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: 'rgba(147, 197, 253, 0.3)', color: '#1e40af' }}
            >
              {columnLabels.right}
            </span>
          </div>
        </div>

        {/* Inline label */}
        <span 
          className="absolute top-3 left-4 z-10 text-[11px] font-medium uppercase tracking-wider pointer-events-none"
          style={{ color: '#8a8a8a', letterSpacing: '0.08em' }}
        >
          Comparison Board
        </span>

        {/* Custom zoom controls */}
        <div 
          className="absolute bottom-4 left-4 z-10 flex gap-1 bg-white/90 rounded-lg shadow-sm border border-gray-200 p-1"
        >
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 font-medium"
            title="Zoom out"
          >
            −
          </button>
          <button
            onClick={handleZoomReset}
            className="px-2 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 text-xs"
            title="Reset zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 font-medium"
            title="Zoom in"
          >
            +
          </button>
        </div>

        {/* Canvas container */}
        <div
          ref={containerRef}
          className="absolute inset-0 cursor-default"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Cards */}
          {cards.map(card => (
            <div
              key={card.id}
              className={`absolute rounded-lg border-2 shadow-sm cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md ${getCardColor(card.column, card.isUnsure)} ${dragState.cardId === card.id ? 'shadow-lg ring-2 ring-blue-400' : ''}`}
              style={{
                left: card.x,
                top: card.y,
                width: CANVAS_CONFIG.cardWidth,
                minHeight: CANVAS_CONFIG.cardHeight,
                padding: '12px',
                userSelect: 'none',
              }}
              onMouseDown={(e) => handleMouseDown(e, card.id)}
            >
              <p className="text-sm text-gray-700 leading-snug">{card.text}</p>
              {card.isUnsure && (
                <span className="absolute -top-2 -right-2 bg-amber-400 text-white text-xs px-1.5 py-0.5 rounded-full">
                  ?
                </span>
              )}
            </div>
          ))}

          {/* Empty state hint */}
          {cards.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-gray-400 text-sm">Cards will appear here as you teach Alex</p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

SimpleCanvas.displayName = 'SimpleCanvas';

// Re-export types for compatibility
export type { SimpleCanvasHandle as TldrawCanvasHandle };
export type { CanvasSnapshot };
