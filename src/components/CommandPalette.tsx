import { useState, useEffect, useRef, useMemo } from 'react';
import { Effect } from '../enums/effect';
import type { EffectData } from '../types/effect/effectData';

interface EffectOption {
  type: Effect;
  displayName: string;
  description: string;
  defaultData: EffectData;
}

const EFFECT_OPTIONS: EffectOption[] = [
  {
    type: Effect.FILE,
    displayName: 'File',
    description: 'Load an image file',
    defaultData: { type: Effect.FILE, fileName: '' },
  },
  {
    type: Effect.BLUR,
    displayName: 'Blur',
    description: 'Apply blur effect',
    defaultData: { type: Effect.BLUR, blurAmount: 10 },
  },
  {
    type: Effect.NULL,
    displayName: 'Null',
    description: 'Pass through node',
    defaultData: { type: Effect.NULL },
  },
  {
    type: Effect.TEXT,
    displayName: 'Text',
    description: 'Create text with styling',
    defaultData: { 
      type: Effect.TEXT, 
      text: 'Text',
      fontSize: 32,
      color: '#ffffff',
      alignment: 'left',
      fontWeight: 'normal',
      padding: 10,
    },
  },
  {
    type: Effect.MERGE,
    displayName: 'Merge',
    description: 'Merge multiple images',
    defaultData: { 
      type: Effect.MERGE, 
      inputCount: 2,
    },
  },
  {
    type: Effect.TRANSFORM,
    displayName: 'Transform',
    description: 'Scale, rotate, and translate image',
    defaultData: { 
      type: Effect.TRANSFORM, 
      scale: 1,
      rotation: 0,
      translateX: 0,
      translateY: 0,
    },
  },
  {
    type: Effect.OPACITY,
    displayName: 'Opacity',
    description: 'Adjust image transparency',
    defaultData: { 
      type: Effect.OPACITY, 
      opacity: 1,
    },
  },
  {
    type: Effect.COLOR_CORRECT,
    displayName: 'Color Correct',
    description: 'Adjust brightness, contrast, saturation, exposure, and hue',
    defaultData: { 
      type: Effect.COLOR_CORRECT, 
      brightness: 0,
      contrast: 0,
      saturation: 0,
      exposure: 0,
      hue: 0,
    },
  },
  {
    type: Effect.EXPORT,
    displayName: 'Export',
    description: 'Export the processed image',
    defaultData: { 
      type: Effect.EXPORT, 
      format: 'png',
      quality: 0.92,
      fileName: '',
    },
  },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (effect: EffectOption) => void;
}

export const CommandPalette = ({ isOpen, onClose, onSelect }: CommandPaletteProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter effects based on search query
  const filteredEffects = useMemo(() => {
    if (!searchQuery.trim()) {
      return EFFECT_OPTIONS;
    }
    const query = searchQuery.toLowerCase();
    return EFFECT_OPTIONS.filter(
      (effect) =>
        effect.displayName.toLowerCase().includes(query) ||
        effect.type.toLowerCase().includes(query) ||
        effect.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Reset selection when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredEffects]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Tab') {
      // Close palette when Tab is pressed
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredEffects.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredEffects[selectedIndex]) {
        onSelect(filteredEffects[selectedIndex]);
      }
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] pointer-events-none" data-command-palette>
      <div className="bg-[#262626] border border-[#444] rounded-lg shadow-2xl w-full max-w-md mx-4 pointer-events-auto">
        {/* Search Input */}
        <div className="p-4 border-b border-[#444]">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search effects..."
            className="w-full bg-[#1a1a1a] border border-[#555] rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            autoFocus
          />
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-64 overflow-y-auto">
          {filteredEffects.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">No effects found</div>
          ) : (
            filteredEffects.map((effect, index) => (
              <button
                key={effect.type}
                onClick={() => onSelect(effect)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full text-left px-4 py-3 border-b border-[#333] transition-colors ${
                  index === selectedIndex
                    ? 'bg-[#333] text-white'
                    : 'bg-transparent text-gray-300 hover:bg-[#2a2a2a]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{effect.displayName}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{effect.description}</div>
                  </div>
                  <div className="text-[10px] text-gray-600 uppercase tracking-wider">
                    {effect.type}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer Hint */}
        <div className="p-2 border-t border-[#444] text-[10px] text-gray-500 text-center">
          <span>↑↓ Navigate</span>
          <span className="mx-2">•</span>
          <span>Enter Select</span>
          <span className="mx-2">•</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
};

