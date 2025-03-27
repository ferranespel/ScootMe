import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface BottomSheetProps {
  children: React.ReactNode;
  isOpen: boolean;
  onStateChange?: (isExpanded: boolean) => void;
  initialState?: 'collapsed' | 'expanded';
}

export function BottomSheet({
  children,
  isOpen,
  onStateChange,
  initialState = 'collapsed'
}: BottomSheetProps) {
  const [isExpanded, setIsExpanded] = useState(initialState === 'expanded');
  const sheetRef = useRef<HTMLDivElement>(null);

  // Collapsed height should show just the handle and tabs
  const collapsedHeight = 150; 
  // Expanded height is relative to the viewport height
  const expandedHeight = '70vh';

  const toggleExpanded = useCallback(() => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (onStateChange) {
      onStateChange(newState);
    }
  }, [isExpanded, onStateChange]);

  const handleDrag = useCallback((_, info: PanInfo) => {
    // Drag down to collapse, up to expand
    if (info.offset.y > 50 && isExpanded) {
      setIsExpanded(false);
      if (onStateChange) {
        onStateChange(false);
      }
    } else if (info.offset.y < -50 && !isExpanded) {
      setIsExpanded(true);
      if (onStateChange) {
        onStateChange(true);
      }
    }
  }, [isExpanded, onStateChange]);

  // Reset to initial state when isOpen changes
  useEffect(() => {
    if (!isOpen) {
      setIsExpanded(initialState === 'expanded');
    }
  }, [isOpen, initialState]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={sheetRef}
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-lg z-20 overflow-hidden"
          initial={{ y: '100%' }}
          animate={{ 
            y: 0,
            height: isExpanded ? expandedHeight : collapsedHeight
          }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          {/* Handle bar */}
          <motion.div 
            className="flex justify-center pt-2 pb-4 cursor-pointer"
            onTap={toggleExpanded}
            onPan={handleDrag}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </motion.div>
          
          {/* Content - scrollable when expanded */}
          <div 
            className={`px-4 pb-20 ${isExpanded ? 'overflow-y-auto' : 'overflow-hidden'}`}
            style={{ height: isExpanded ? 'calc(100% - 30px)' : 'calc(100% - 30px)' }}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
