import type { ChangeEvent } from 'react';
import type { Node } from '@xyflow/react';
import type { BaseNodeData } from '../../types/node/baseNodeData';
import type { OpacityEffectData } from '../../types/effect/effectData'; 
import { Effect } from '../../enums/effect';

interface OpacityPanelProps {
  node: Node<BaseNodeData>;
  updateNode: (id: string, data: Partial<BaseNodeData>) => void;
}

export const OpacityPanel = ({ node, updateNode }: OpacityPanelProps) => {
  const effectData = node.data.effect as OpacityEffectData;

  // Helper to update just the effect object while keeping other node data intact
  const updateEffect = (newEffectData: Partial<OpacityEffectData>) => {
    updateNode(node.id, {
      effect: {
        ...effectData, // Keep existing effect props (like type)
        ...newEffectData, // Overwrite changed props
      },
    });
  };

  const handleOpacityChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateEffect({ opacity: Number(e.target.value) });
  };

  return (
    <div className="space-y-6 p-2 text-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#444] pb-2">
        <h3 className="font-bold text-sm">Opacity</h3>
        <span className="text-[10px] bg-cyan-900 text-cyan-200 px-2 py-0.5 rounded uppercase tracking-wider">
          {Effect.OPACITY}
        </span>
      </div>

      {/* Control: Opacity */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <label>Opacity</label>
          <span className="font-mono text-blue-400">{((effectData.opacity || 1) * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={effectData.opacity || 1}
          onChange={handleOpacityChange}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Info */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400">
          Adjust the transparency of the image. 0% is fully transparent, 100% is fully opaque.
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

