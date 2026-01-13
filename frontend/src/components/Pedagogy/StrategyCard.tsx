import { motion } from 'framer-motion';
import { Brain, HelpCircle, ListOrdered, Lightbulb, Check, CheckSquare2 } from 'lucide-react';
import type { Strategy } from '../../config/pedagogy';

interface StrategyCardProps {
  strategy: Strategy;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const iconMap = {
  'brain': Brain,
  'help-circle': HelpCircle,
  'list-ordered': ListOrdered,
  'lightbulb': Lightbulb,
  'check-square': CheckSquare2,
};

export function StrategyCard({ strategy, isActive, onClick, disabled = false }: StrategyCardProps) {
  const Icon = iconMap[strategy.icon];

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      animate={{
        borderColor: isActive ? 'var(--color-sage-400)' : 'transparent',
        backgroundColor: isActive ? 'var(--color-sage-50)' : 'white',
        opacity: disabled ? 0.5 : 1,
      }}
      className={`
        w-full text-left p-4 rounded-xl border-2 transition-shadow
        ${isActive ? 'shadow-md' : 'shadow-sm hover:shadow-md'}
        ${disabled ? 'cursor-not-allowed' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
          ${isActive ? 'bg-sage-200' : 'bg-bark-100'}
        `}>
          <Icon className={`w-5 h-5 ${isActive ? 'text-sage-700' : 'text-bark-500'}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`text-sm font-semibold ${isActive ? 'text-sage-800' : 'text-bark-800'}`}>
              {strategy.label}
            </h3>
            {isActive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex-shrink-0 w-5 h-5 rounded-full bg-sage-500 flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-white" />
              </motion.div>
            )}
          </div>
          
          <p className={`mt-2 text-sm leading-relaxed ${isActive ? 'text-sage-700' : 'text-bark-600'}`}>
            {strategy.description}
          </p>
        </div>
      </div>

      {/* Active indicator bar */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-sage-500"
        />
      )}
    </motion.button>
  );
}
