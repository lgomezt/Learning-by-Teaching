import { useState } from 'react';
import type { ReactNode } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface LayoutProps {
  library: ReactNode;
  chat: ReactNode;
  pedagogy: ReactNode;
  exportButton?: ReactNode;
}

export function Layout({ library, chat, pedagogy, exportButton }: LayoutProps) {
  const [isLibraryCollapsed, setIsLibraryCollapsed] = useState(false);
  const [isStrategyCollapsed, setIsStrategyCollapsed] = useState(false);

  return (
    <div className="h-screen flex">
      {/* Left sidebar - Full height with title */}
      <motion.aside 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col transition-all duration-300 ease-in-out relative"
        style={{
          width: isLibraryCollapsed ? '60px' : '380px',
          borderRight: '1px solid #ddd6cb',
          backgroundColor: '#f5f1eb'
        }}
      >
        {/* App Title at top */}
        <div 
          className={`flex-shrink-0 flex items-center justify-center ${!isLibraryCollapsed ? 'border-b' : ''}`}
          style={{ 
            borderColor: '#ddd6cb',
            padding: isLibraryCollapsed ? '24px 12px' : '24px'
          }}
        >
          <AnimatePresence mode="wait">
            {!isLibraryCollapsed ? (
              <motion.div
                key="title-expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 w-full"
              >
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#2d5a4d' }}
                >
                  <span className="text-white font-semibold text-lg">P</span>
                </div>
                <div>
                  <h1 
                    className="text-xl font-semibold tracking-tight"
                    style={{ color: '#2d5a4d' }}
                  >
                    Protégé
                  </h1>
                  <p className="text-xs" style={{ color: '#5a5a5a' }}>
                    Learn by teaching
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="title-collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center items-center"
              >
                <div 
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ 
                    backgroundColor: '#2d5a4d',
                    borderRadius: '12px',
                    width: '40px',
                    height: '40px',
                    minWidth: '40px',
                    minHeight: '40px'
                  }}
                >
                  <span className="text-white font-semibold text-lg">P</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse/Expand button - positioned outside like right panel, vertically centered */}
        <button
          onClick={() => setIsLibraryCollapsed(!isLibraryCollapsed)}
          className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10"
          style={{
            backgroundColor: '#2d5a4d',
            color: '#ffffff',
            border: '2px solid #f5f1eb',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#3d7a65';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2d5a4d';
          }}
          aria-label={isLibraryCollapsed ? 'Expand Knowledge Library' : 'Collapse Knowledge Library'}
        >
          {isLibraryCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Section title - only show border when expanded */}
        {/* {!isLibraryCollapsed && (
          <div className="p-4 border-b flex items-center flex-shrink-0 relative" style={{ borderColor: 'rgba(221, 214, 203, 0.5)' }}>
            <h2 
              className="text-sm font-semibold uppercase whitespace-nowrap"
              style={{ 
                color: '#1a1a1a',
                letterSpacing: '0.06em'
              }}
            >
              Knowledge Library
            </h2>
          </div>
        )} */}

        {/* Library content */}
        <AnimatePresence>
          {!isLibraryCollapsed && (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-y-auto overflow-x-hidden p-4"
            >
              {library}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* Center column - Teaching Workspace */}
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex-1 flex flex-col min-w-0"
        style={{ backgroundColor: '#fdfcfa' }}
      >
        {chat}
      </motion.main>

      {/* Right column - Methods Panel */}
      <motion.aside 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col transition-all duration-300 ease-in-out relative"
        style={{
          width: isStrategyCollapsed ? '60px' : '320px',
          borderLeft: '1px solid #ddd6cb',
          backgroundColor: '#f5f1eb'
        }}
      >
        {/* Toggle button - Homogeneous with left panel, vertically centered */}
        <button
          onClick={() => setIsStrategyCollapsed(!isStrategyCollapsed)}
          className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10"
          style={{
            backgroundColor: '#2d5a4d',
            color: '#ffffff',
            border: '2px solid #f5f1eb',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#3d7a65';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2d5a4d';
          }}
          aria-label={isStrategyCollapsed ? 'Expand Methods Panel' : 'Collapse Methods Panel'}
        >
          {isStrategyCollapsed ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* Section title - only show border when expanded */}
        {!isStrategyCollapsed && (
          <div className="p-4 border-b flex items-center flex-shrink-0 relative" style={{ borderColor: 'rgba(221, 214, 203, 0.5)' }}>
            <h2 
              className="text-sm font-semibold uppercase whitespace-nowrap"
              style={{ 
                color: '#1a1a1a',
                letterSpacing: '0.06em'
              }}
            >
              Learning Strategy
            </h2>
          </div>
        )}
        <AnimatePresence>
          {!isStrategyCollapsed ? (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-auto p-4 flex flex-col"
            >
              <div className="flex-1">
                {React.isValidElement(pedagogy)
                  ? React.cloneElement(pedagogy, { isCollapsed: false })
                  : pedagogy}
              </div>
              {exportButton && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: '#ddd6cb' }}>
                  {exportButton}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="collapsed-icons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center py-4 gap-2"
            >
              {/* Strategy icons when collapsed */}
              {React.isValidElement(pedagogy)
                ? React.cloneElement(pedagogy, { isCollapsed: true })
                : pedagogy}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </div>
  );
}
