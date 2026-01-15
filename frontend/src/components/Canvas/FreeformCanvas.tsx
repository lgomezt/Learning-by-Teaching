import {
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import { ConceptBox } from './ConceptBox';
import { Card } from './Card';
import { DrawingLayer } from './DrawingLayer';
import { CanvasToolbar } from './CanvasToolbar';
import type {
  ConceptBox as ConceptBoxType,
  CanvasCard,
  DrawingStroke,
  CanvasState,
  FreeformCanvasHandle,
  CanvasMode,
  Position,
} from './types';

interface FreeformCanvasProps {
  onStateChange?: (state: CanvasState) => void;
  onReady?: (handle: FreeformCanvasHandle) => void;
}

// Canvas configuration - this is the "virtual" canvas size
const CANVAS_CONFIG = {
  baseWidth: 800,
  baseHeight: 600,
  conceptBoxWidth: 160,
  conceptBoxHeight: 50,
  cardWidth: 180,
  cardMinHeight: 60,
  padding: 40,
};

// Generate unique ID
const generateId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Generate state description for agent context
function generateStateDescription(state: CanvasState): string {
  const lines: string[] = [];
  lines.push('=== CANVAS STATE ===');

  if (state.conceptBoxes.length === 0) {
    lines.push('\nCONCEPT BOXES: None created yet');
  } else {
    lines.push('\nCONCEPT BOXES:');
    state.conceptBoxes.forEach((box) => {
      lines.push(
        `  - "${box.name}" (color: ${box.color}, position: ${Math.round(box.x)},${Math.round(box.y)})`
      );
    });
  }

  if (state.cards.length === 0) {
    lines.push('\nCARDS: No cards on canvas');
  } else {
    lines.push(`\nCARDS (${state.cards.length} total):`);

    const unassigned = state.cards.filter((c) => !c.color);
    const assigned = state.cards.filter((c) => c.color);

    if (unassigned.length > 0) {
      lines.push('  [Unassigned/Gray]:');
      unassigned.forEach((card) => {
        lines.push(
          `    - "${card.text}" at (${Math.round(card.x)},${Math.round(card.y)})`
        );
      });
    }

    const byColor = new Map<string, CanvasCard[]>();
    assigned.forEach((card) => {
      const existing = byColor.get(card.color!) || [];
      existing.push(card);
      byColor.set(card.color!, existing);
    });

    byColor.forEach((cards, color) => {
      const concept = state.conceptBoxes.find((b) => b.color === color);
      const label = concept ? concept.name : color;
      lines.push(`  [${label}]:`);
      cards.forEach((card) => {
        lines.push(
          `    - "${card.text}" at (${Math.round(card.x)},${Math.round(card.y)})`
        );
      });
    });
  }

  if (state.cards.length > 0 && state.conceptBoxes.length > 0) {
    lines.push('\nSPATIAL RELATIONSHIPS:');
    state.conceptBoxes.forEach((box) => {
      const nearbyCards = state.cards.filter((card) => {
        const distance = Math.sqrt(
          Math.pow(card.x - box.x, 2) + Math.pow(card.y - box.y, 2)
        );
        return distance < 200;
      });
      if (nearbyCards.length > 0) {
        lines.push(
          `  Cards near "${box.name}": ${nearbyCards.map((c) => `"${c.text}"`).join(', ')}`
        );
      }
    });
  }

  if (state.drawings.length > 0) {
    lines.push(`\nDRAWINGS: ${state.drawings.length} stroke(s) on canvas`);
  }

  return lines.join('\n');
}

export const FreeformCanvas = forwardRef<FreeformCanvasHandle, FreeformCanvasProps>(
  ({ onStateChange, onReady }, ref) => {
    // State
    const [conceptBoxes, setConceptBoxes] = useState<ConceptBoxType[]>([]);
    const [cards, setCards] = useState<CanvasCard[]>([]);
    const [drawings, setDrawings] = useState<DrawingStroke[]>([]);
    const [zoom, setZoom] = useState(1);
    const [mode, setMode] = useState<CanvasMode>('select');
    const [drawingColor, setDrawingColor] = useState('#374151');
    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

    const wrapperRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    // Track container size with ResizeObserver
    useEffect(() => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          setContainerSize({ width, height });
        }
      });

      resizeObserver.observe(wrapper);
      return () => resizeObserver.disconnect();
    }, []);

    // Calculate content bounds (bounding box of all elements)
    const contentBounds = useMemo(() => {
      if (conceptBoxes.length === 0 && cards.length === 0) {
        return {
          minX: 0,
          minY: 0,
          maxX: CANVAS_CONFIG.baseWidth,
          maxY: CANVAS_CONFIG.baseHeight,
        };
      }

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      conceptBoxes.forEach((box) => {
        minX = Math.min(minX, box.x);
        minY = Math.min(minY, box.y);
        maxX = Math.max(maxX, box.x + box.width);
        maxY = Math.max(maxY, box.y + box.height);
      });

      cards.forEach((card) => {
        minX = Math.min(minX, card.x);
        minY = Math.min(minY, card.y);
        maxX = Math.max(maxX, card.x + CANVAS_CONFIG.cardWidth);
        maxY = Math.max(maxY, card.y + CANVAS_CONFIG.cardMinHeight);
      });

      // Add padding
      const padding = CANVAS_CONFIG.padding;
      return {
        minX: Math.max(0, minX - padding),
        minY: Math.max(0, minY - padding),
        maxX: maxX + padding,
        maxY: maxY + padding,
      };
    }, [conceptBoxes, cards]);

    // Calculate virtual canvas size based on content
    const canvasSize = useMemo(() => {
      const contentWidth = contentBounds.maxX - contentBounds.minX;
      const contentHeight = contentBounds.maxY - contentBounds.minY;

      return {
        width: Math.max(CANVAS_CONFIG.baseWidth, contentWidth + CANVAS_CONFIG.padding * 2),
        height: Math.max(CANVAS_CONFIG.baseHeight, contentHeight + CANVAS_CONFIG.padding * 2),
      };
    }, [contentBounds]);

    // Calculate zoom to fit content in view
    const calculateFitZoom = useCallback(() => {
      const contentWidth = contentBounds.maxX;
      const contentHeight = contentBounds.maxY;

      if (contentWidth <= 0 || contentHeight <= 0) return 1;

      const scaleX = (containerSize.width - 20) / contentWidth;
      const scaleY = (containerSize.height - 60) / contentHeight; // Account for toolbar

      return Math.min(scaleX, scaleY, 1.5); // Cap at 150%
    }, [containerSize, contentBounds]);

    // Auto-fit on initial content
    useEffect(() => {
      if (conceptBoxes.length > 0 || cards.length > 0) {
        const fitZoom = calculateFitZoom();
        setZoom(Math.max(0.3, Math.min(fitZoom, 1)));
      }
    }, [conceptBoxes.length, cards.length]);

    // Derived state
    const availableColors = conceptBoxes.map((b) => b.color);

    // Get random position within visible canvas area
    const getRandomPosition = useCallback(
      (elementWidth: number, elementHeight: number): Position => {
        const padding = CANVAS_CONFIG.padding;
        const maxX = Math.max(padding, canvasSize.width - elementWidth - padding);
        const maxY = Math.max(padding, canvasSize.height - elementHeight - padding);

        return {
          x: padding + Math.random() * (maxX - padding),
          y: padding + Math.random() * (maxY - padding),
        };
      },
      [canvasSize]
    );

    // Get current state
    const getSnapshot = useCallback((): CanvasState => {
      return { conceptBoxes, cards, drawings };
    }, [conceptBoxes, cards, drawings]);

    // Get state description for agent
    const getStateDescription = useCallback((): string => {
      return generateStateDescription({ conceptBoxes, cards, drawings });
    }, [conceptBoxes, cards, drawings]);

    // Create a concept box
    const createConceptBox = useCallback(
      (name: string, color: string): string => {
        const id = generateId('concept');
        const position = getRandomPosition(
          CANVAS_CONFIG.conceptBoxWidth,
          CANVAS_CONFIG.conceptBoxHeight
        );

        const newBox: ConceptBoxType = {
          id,
          name,
          color,
          x: position.x,
          y: position.y,
          width: CANVAS_CONFIG.conceptBoxWidth,
          height: CANVAS_CONFIG.conceptBoxHeight,
        };

        console.log('[FreeformCanvas] Creating concept box:', name, color);
        setConceptBoxes((prev) => {
          const updated = [...prev, newBox];
          if (onStateChange) {
            setTimeout(
              () => onStateChange({ conceptBoxes: updated, cards, drawings }),
              0
            );
          }
          return updated;
        });

        return id;
      },
      [cards, drawings, onStateChange, getRandomPosition]
    );

    // Create a card
    const createCard = useCallback(
      (text: string, color?: string): string => {
        const id = generateId('card');
        const position = getRandomPosition(
          CANVAS_CONFIG.cardWidth,
          CANVAS_CONFIG.cardMinHeight
        );

        const newCard: CanvasCard = {
          id,
          text,
          x: position.x,
          y: position.y,
          color: color || null,
          isUnsure: false,
          createdAt: Date.now(),
        };

        console.log('[FreeformCanvas] Creating card:', text);
        setCards((prev) => {
          const updated = [...prev, newCard];
          if (onStateChange) {
            setTimeout(
              () => onStateChange({ conceptBoxes, cards: updated, drawings }),
              0
            );
          }
          return updated;
        });

        return id;
      },
      [conceptBoxes, drawings, onStateChange, getRandomPosition]
    );

    // Position change handlers
    const handleConceptBoxPositionChange = useCallback(
      (id: string, position: Position) => {
        setConceptBoxes((prev) =>
          prev.map((box) =>
            box.id === id ? { ...box, x: position.x, y: position.y } : box
          )
        );
      },
      []
    );

    const handleCardPositionChange = useCallback(
      (id: string, position: Position) => {
        setCards((prev) =>
          prev.map((card) =>
            card.id === id ? { ...card, x: position.x, y: position.y } : card
          )
        );
      },
      []
    );

    const handleCardColorChange = useCallback(
      (id: string, color: string | null) => {
        setCards((prev) =>
          prev.map((card) => (card.id === id ? { ...card, color } : card))
        );
      },
      []
    );

    // Drawing handlers
    const handleDrawingComplete = useCallback((stroke: DrawingStroke) => {
      setDrawings((prev) => [...prev, stroke]);
    }, []);

    const handleClearDrawings = useCallback(() => {
      setDrawings([]);
    }, []);

    // Handle ref
    const handleRef = useRef<FreeformCanvasHandle>({
      createConceptBox,
      createCard,
      getSnapshot,
      getStateDescription,
    });

    handleRef.current = {
      createConceptBox,
      createCard,
      getSnapshot,
      getStateDescription,
    };

    useImperativeHandle(
      ref,
      () => ({
        createConceptBox: (name, color) =>
          handleRef.current.createConceptBox(name, color),
        createCard: (text, color) => handleRef.current.createCard(text, color),
        getSnapshot: () => handleRef.current.getSnapshot(),
        getStateDescription: () => handleRef.current.getStateDescription(),
      }),
      []
    );

    // Call onReady when mounted
    useEffect(() => {
      if (onReady) {
        const stableHandle: FreeformCanvasHandle = {
          createConceptBox: (name, color) =>
            handleRef.current.createConceptBox(name, color),
          createCard: (text, color) => handleRef.current.createCard(text, color),
          getSnapshot: () => handleRef.current.getSnapshot(),
          getStateDescription: () => handleRef.current.getStateDescription(),
        };
        onReady(stableHandle);
      }
    }, [onReady]);

    // Zoom handlers
    const handleZoomIn = () => setZoom((z) => Math.min(2, z + 0.1));
    const handleZoomOut = () => setZoom((z) => Math.max(0.3, z - 0.1));
    const handleFitToView = useCallback(() => {
      const fitZoom = calculateFitZoom();
      setZoom(Math.max(0.3, Math.min(fitZoom, 1.5)));
    }, [calculateFitZoom]);

    // Canvas bounds for dragging
    const canvasBounds = useMemo(() => ({
      minX: 0,
      minY: 0,
      maxX: canvasSize.width - CANVAS_CONFIG.cardWidth,
      maxY: canvasSize.height - CANVAS_CONFIG.cardMinHeight,
    }), [canvasSize]);

    return (
      <div
        ref={wrapperRef}
        className="w-full h-full relative overflow-hidden"
        style={{ backgroundColor: '#fafaf9' }}
      >
        {/* Toolbar */}
        <CanvasToolbar
          mode={mode}
          onModeChange={setMode}
          drawingColor={drawingColor}
          onDrawingColorChange={setDrawingColor}
          onClearDrawings={handleClearDrawings}
          hasDrawings={drawings.length > 0}
        />

        {/* Zoom controls */}
        <div className="absolute bottom-4 left-4 z-10 flex gap-1 bg-white/90 rounded-lg shadow-sm border border-gray-200 p-1">
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 font-medium"
            title="Zoom out"
          >
            −
          </button>
          <button
            onClick={handleFitToView}
            className="px-2 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 text-xs"
            title="Fit to view"
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

        {/* Canvas container - centered in view */}
        <div
          className="absolute inset-0 overflow-auto"
          style={{ paddingTop: 50 }}
        >
          <div
            ref={canvasRef}
            className="relative"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              width: canvasSize.width,
              height: canvasSize.height,
              minWidth: containerSize.width / zoom,
              minHeight: (containerSize.height - 50) / zoom,
            }}
          >
            {/* Drawing layer (behind elements) */}
            <DrawingLayer
              strokes={drawings}
              isDrawing={mode === 'draw'}
              color={drawingColor}
              strokeWidth={3}
              onStrokeComplete={handleDrawingComplete}
              width={canvasSize.width}
              height={canvasSize.height}
              zoom={zoom}
            />

            {/* Concept boxes */}
            {conceptBoxes.map((box) => (
              <ConceptBox
                key={box.id}
                box={box}
                zoom={zoom}
                onPositionChange={handleConceptBoxPositionChange}
                canvasBounds={{
                  minX: 0,
                  minY: 0,
                  maxX: canvasSize.width - box.width,
                  maxY: canvasSize.height - box.height,
                }}
              />
            ))}

            {/* Cards */}
            {cards.map((card) => (
              <Card
                key={card.id}
                card={card}
                zoom={zoom}
                availableColors={availableColors}
                onPositionChange={handleCardPositionChange}
                onColorChange={handleCardColorChange}
                canvasBounds={canvasBounds}
              />
            ))}

            {/* Empty state hint */}
            {conceptBoxes.length === 0 && cards.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-gray-400">
                  <p className="text-sm">
                    Tell Alex what concepts you want to compare
                  </p>
                  <p className="text-xs mt-1">
                    Concept boxes and cards will appear here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

FreeformCanvas.displayName = 'FreeformCanvas';

export type { FreeformCanvasHandle };
