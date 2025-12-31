import type { ChangeEvent } from 'react';
import type { Node } from '@xyflow/react';
import type { BaseNodeData } from '../../types/node/baseNodeData';
import type { MergeEffectData } from '../../types/effect/effectData'; 
import { Effect } from '../../enums/effect';

interface MergePanelProps {
  node: Node<BaseNodeData>;
  updateNode: (id: string, data: Partial<BaseNodeData>) => void;
}

export const MergePanel = ({ node, updateNode }: MergePanelProps) => {
  const effectData = node.data.effect as MergeEffectData;

  // Helper to update just the effect object while keeping other node data intact
  const updateEffect = (newEffectData: Partial<MergeEffectData>) => {
    const updatedEffect = {
      ...effectData,
      ...newEffectData,
    };
    
    // Ensure inputCount is at least 2
    if (updatedEffect.inputCount < 2) {
      updatedEffect.inputCount = 2;
    }
    
    updateNode(node.id, {
      effect: updatedEffect,
      // Update hasSource based on inputCount
      hasSource: updatedEffect.inputCount > 0,
    });
  };

  const handleInputCountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newCount = Math.max(2, Math.min(10, Number(e.target.value))); // Clamp between 2 and 10
    updateEffect({ inputCount: newCount });
  };

  return (
    <div className="space-y-6 p-2 text-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#444] pb-2">
        <h3 className="font-bold text-sm">Merge</h3>
        <span className="text-[10px] bg-orange-900 text-orange-200 px-2 py-0.5 rounded uppercase tracking-wider">
          {Effect.MERGE}
        </span>
      </div>

      {/* Control: Input Count */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <label>Number of Inputs</label>
          <span className="font-mono text-blue-400">{effectData.inputCount || 2}</span>
        </div>
        <input
          type="range"
          min="2"
          max="10"
          step="1"
          value={effectData.inputCount || 2}
          onChange={handleInputCountChange}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <p className="text-[10px] text-gray-500">
          Input 0 is the background layer. Other inputs stack on top in order.
        </p>
      </div>

      {/* Info */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400">
          This node merges multiple images. The first input (Input 0) serves as the background, and subsequent inputs are layered on top.
        </p>
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

