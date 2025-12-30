import type { ChangeEvent } from 'react';
import type { Node } from '@xyflow/react';
import type { BaseNodeData } from '../../types/node/baseNodeData';
import type { BlurEffectData } from '../../types/effect/effectData'; 
import { Effect } from '../../enums/effect';


interface BlurPanelProps {
  // 1. Strict Typing: Only accept nodes that have BaseNodeData
  node: Node<BaseNodeData>;
  updateNode: (id: string, data: Partial<BaseNodeData>) => void;
}

export const BlurPanel = ({ node, updateNode }: BlurPanelProps) => {
  // Safe cast: We know this is a BLUR node because the registry chose this component
  const effectData = node.data.effect as BlurEffectData;

  // Helper to update just the effect object while keeping other node data intact
  const updateEffect = (newEffectData: Partial<BlurEffectData>) => {
    updateNode(node.id, {
      effect: {
        ...effectData, // Keep existing effect props (like type)
        ...newEffectData, // Overwrite changed props
      },
    });
  };

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateEffect({ blurAmount: Number(e.target.value) });
  };

  const handleQualityChange = (e: ChangeEvent<HTMLSelectElement>) => {
    // Cast to specific union type 'low' | 'high'
    updateEffect({ quality: e.target.value as 'low' | 'high' });
  };

  return (
    <div className="space-y-6 p-2 text-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#444] pb-2">
        <h3 className="font-bold text-sm">Uniform Blur</h3>
        <span className="text-[10px] bg-purple-900 text-purple-200 px-2 py-0.5 rounded uppercase tracking-wider">
          {Effect.BLUR}
        </span>
      </div>

      {/* Control 1: Blur Amount Slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <label>Strength</label>
          <span className="font-mono text-blue-400">{effectData.blurAmount}px</span>
        </div>
        
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={effectData.blurAmount}
          onChange={handleAmountChange}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Control 2: Quality Dropdown */}
      <div className="space-y-2">
        <label className="text-xs block">Quality Mode</label>
        <select
          value={effectData.quality || 'low'}
          onChange={handleQualityChange}
          className="w-full bg-[#1a1a1a] border border-[#444] text-xs rounded p-2 focus:border-blue-500 outline-none"
        >
          <option value="low">Low (Faster)</option>
          <option value="high">High (Smoother)</option>
        </select>
        <p className="text-[10px] text-gray-500">
          High quality uses a Gaussian kernel but is slower to render.
        </p>
      </div>

      {/* Visual Debug (Optional - helps you see data updating) */}
      <div className="pt-4 border-t border-[#333]">
         <div className="text-[10px] font-mono text-gray-600">
            Internal Data: {JSON.stringify(effectData)}
         </div>
      </div>
    </div>
  );
};