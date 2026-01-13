import { motion } from 'framer-motion';
import { STRATEGY_LIST } from '../../config/pedagogy';
import { useStrategy, useDocument, useChat } from '../../context/AppContext';
import { useTeachableAgent } from '../../hooks/useTeachableAgent';
import { StrategyCard } from './StrategyCard';
import { Sparkles, Brain, HelpCircle, ListOrdered, Lightbulb, CheckSquare2 } from 'lucide-react';

interface StrategySidebarProps {
  isCollapsed?: boolean;
}

const iconMap = {
  'brain': Brain,
  'help-circle': HelpCircle,
  'list-ordered': ListOrdered,
  'lightbulb': Lightbulb,
  'check-square': CheckSquare2,
};

export function StrategySidebar({ isCollapsed = false }: StrategySidebarProps) {
  const { activeStrategy, setActiveStrategy } = useStrategy();
  const { activeDocument } = useDocument();
  const { isStreaming, isAnimating } = useChat();
  const { requestInitialMessage } = useTeachableAgent();

  const handleStrategyChange = async (strategy: typeof STRATEGY_LIST[0]) => {
    // Don't allow strategy change while streaming or animating
    if (isStreaming || isAnimating) {
      return;
    }
    
    // Only change strategy if it's different
    if (strategy.id !== activeStrategy.id) {
      setActiveStrategy(strategy);
      
      // Auto-send message if document is loaded
      // Pass strategy ID directly to avoid race condition
      if (activeDocument) {
        requestInitialMessage(strategy.id);
      }
    }
  };

  // When collapsed, show only icons
  if (isCollapsed) {
    return (
      <>
        {STRATEGY_LIST.map((strategy) => {
          const Icon = iconMap[strategy.icon];
          const isActive = activeStrategy.id === strategy.id;
          return (
            <button
              key={strategy.id}
              onClick={() => handleStrategyChange(strategy)}
              disabled={isStreaming || isAnimating}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isActive ? '#2d5a4d' : '#eae4da',
                color: isActive ? '#ffffff' : '#5a5a5a'
              }}
              title={strategy.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info section - separated from clickable options */}
      <div className="pb-4 border-b border-bark-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-sage-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-sage-800 mb-1">
              Pedagogical Strategies
            </h3>
            <p className="text-xs text-bark-500 leading-relaxed">
              Choose how Alex will engage you. Each strategy is backed by learning science research.
            </p>
          </div>
        </div>
      </div>

      {/* Strategy cards */}
      <div className="space-y-3">
        {STRATEGY_LIST.map((strategy, index) => (
          <motion.div
            key={strategy.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative"
          >
            <StrategyCard
              strategy={strategy}
              isActive={activeStrategy.id === strategy.id}
              onClick={() => handleStrategyChange(strategy)}
              disabled={isStreaming || isAnimating}
            />
          </motion.div>
        ))}
      </div>

      {/* Research note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="p-3 rounded-lg bg-bark-50 border border-bark-100"
      >
        <p className="text-xs text-bark-500 leading-relaxed">
          <strong className="text-bark-600">Tip:</strong> Try different strategies to find what works best for the material you're studying.
        </p>
      </motion.div>
    </div>
  );
}
