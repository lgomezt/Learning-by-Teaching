import type { CanvasMode } from './types';

interface CanvasToolbarProps {
  mode: CanvasMode;
  onModeChange: (mode: CanvasMode) => void;
  drawingColor: string;
  onDrawingColorChange: (color: string) => void;
  onClearDrawings: () => void;
  hasDrawings: boolean;
}

const DRAWING_COLORS = [
  '#374151', // gray
  '#ef4444', // red
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
];

export function CanvasToolbar({
  mode,
  onModeChange,
  drawingColor,
  onDrawingColorChange,
  onClearDrawings,
  hasDrawings,
}: CanvasToolbarProps) {
  return (
    <div className="absolute top-4 left-4 z-10 flex gap-2 items-center">
      {/* Mode toggle */}
      <div className="flex bg-white/90 rounded-lg shadow-sm border border-gray-200 p-1">
        <button
          onClick={() => onModeChange('select')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            mode === 'select'
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Select mode"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
            />
          </svg>
        </button>
        <button
          onClick={() => onModeChange('draw')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            mode === 'draw'
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Draw mode"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
      </div>

      {/* Color picker (only show in draw mode) */}
      {mode === 'draw' && (
        <div className="flex bg-white/90 rounded-lg shadow-sm border border-gray-200 p-1 gap-1">
          {DRAWING_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onDrawingColorChange(color)}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                drawingColor === color
                  ? 'border-gray-400 scale-110'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              title={`Color: ${color}`}
            />
          ))}
        </div>
      )}

      {/* Clear drawings button */}
      {hasDrawings && (
        <button
          onClick={onClearDrawings}
          className="px-3 py-1.5 bg-white/90 rounded-lg shadow-sm border border-gray-200 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          title="Clear all drawings"
        >
          Clear drawings
        </button>
      )}
    </div>
  );
}
