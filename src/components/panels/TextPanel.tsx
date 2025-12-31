import type { ChangeEvent } from 'react';
import type { Node } from '@xyflow/react';
import type { BaseNodeData } from '../../types/node/baseNodeData';
import type { TextEffectData } from '../../types/effect/effectData'; 
import { Effect } from '../../enums/effect';

interface TextPanelProps {
  node: Node<BaseNodeData>;
  updateNode: (id: string, data: Partial<BaseNodeData>) => void;
}

export const TextPanel = ({ node, updateNode }: TextPanelProps) => {
  const effectData = node.data.effect as TextEffectData;

  // Helper to update just the effect object while keeping other node data intact
  const updateEffect = (newEffectData: Partial<TextEffectData>) => {
    updateNode(node.id, {
      effect: {
        ...effectData, // Keep existing effect props (like type)
        ...newEffectData, // Overwrite changed props
      },
    });
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    updateEffect({ text: e.target.value });
  };

  const handleFontSizeChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateEffect({ fontSize: Number(e.target.value) });
  };

  const handleColorChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateEffect({ color: e.target.value });
  };

  const handleAlignmentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateEffect({ alignment: e.target.value as 'left' | 'center' | 'right' });
  };

  const handleFontWeightChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateEffect({ fontWeight: e.target.value as 'normal' | 'bold' });
  };

  const handlePaddingChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateEffect({ padding: Number(e.target.value) });
  };

  return (
    <div className="space-y-6 p-2 text-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#444] pb-2">
        <h3 className="font-bold text-sm">Text</h3>
        <span className="text-[10px] bg-green-900 text-green-200 px-2 py-0.5 rounded uppercase tracking-wider">
          {Effect.TEXT}
        </span>
      </div>

      {/* Control 1: Text Content */}
      <div className="space-y-2">
        <label className="text-xs block">Text Content</label>
        <textarea
          value={effectData.text || ''}
          onChange={handleTextChange}
          placeholder="Enter text..."
          className="w-full bg-[#1a1a1a] border border-[#444] text-xs rounded p-2 focus:border-blue-500 outline-none resize-none min-h-[80px] text-gray-200"
        />
      </div>

      {/* Control 2: Font Size */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <label>Font Size</label>
          <span className="font-mono text-blue-400">{effectData.fontSize || 16}px</span>
        </div>
        <input
          type="range"
          min="8"
          max="200"
          step="1"
          value={effectData.fontSize || 16}
          onChange={handleFontSizeChange}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Control 3: Color */}
      <div className="space-y-2">
        <label className="text-xs block">Text Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={effectData.color || '#ffffff'}
            onChange={handleColorChange}
            className="w-12 h-8 rounded border border-[#444] cursor-pointer"
          />
          <input
            type="text"
            value={effectData.color || '#ffffff'}
            onChange={handleColorChange}
            className="flex-1 bg-[#1a1a1a] border border-[#444] text-xs rounded p-2 focus:border-blue-500 outline-none font-mono"
            placeholder="#ffffff"
          />
        </div>
      </div>

      {/* Control 4: Alignment */}
      <div className="space-y-2">
        <label className="text-xs block">Alignment</label>
        <select
          value={effectData.alignment || 'left'}
          onChange={handleAlignmentChange}
          className="w-full bg-[#1a1a1a] border border-[#444] text-xs rounded p-2 focus:border-blue-500 outline-none"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>

      {/* Control 5: Font Weight */}
      <div className="space-y-2">
        <label className="text-xs block">Font Weight</label>
        <select
          value={effectData.fontWeight || 'normal'}
          onChange={handleFontWeightChange}
          className="w-full bg-[#1a1a1a] border border-[#444] text-xs rounded p-2 focus:border-blue-500 outline-none"
        >
          <option value="normal">Normal</option>
          <option value="bold">Bold</option>
        </select>
      </div>

      {/* Control 6: Padding */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <label>Padding</label>
          <span className="font-mono text-blue-400">{effectData.padding || 0}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={effectData.padding || 0}
          onChange={handlePaddingChange}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Visual Debug (Optional) */}
      <div className="pt-4 border-t border-[#333]">
         <div className="text-[10px] font-mono text-gray-600">
            Internal Data: {JSON.stringify(effectData)}
         </div>
      </div>
    </div>
  );
};

