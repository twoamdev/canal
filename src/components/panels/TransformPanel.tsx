import type { ChangeEvent } from 'react';
import type { Node } from '@xyflow/react';
import type { BaseNodeData } from '../../types/node/baseNodeData';
import type { TransformEffectData } from '../../types/effect/effectData'; 
import { Effect } from '../../enums/effect';

interface TransformPanelProps {
  node: Node<BaseNodeData>;
  updateNode: (id: string, data: Partial<BaseNodeData>) => void;
}

export const TransformPanel = ({ node, updateNode }: TransformPanelProps) => {
  const effectData = node.data.effect as TransformEffectData;

  // Helper to update just the effect object while keeping other node data intact
  const updateEffect = (newEffectData: Partial<TransformEffectData>) => {
    updateNode(node.id, {
      effect: {
        ...effectData, // Keep existing effect props (like type)
        ...newEffectData, // Overwrite changed props
      },
    });
  };

  const handleScaleChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateEffect({ scale: Number(e.target.value) });
  };

  const handleRotationChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateEffect({ rotation: Number(e.target.value) });
  };

  const handleTranslateXChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateEffect({ translateX: Number(e.target.value) });
  };

  const handleTranslateYChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateEffect({ translateY: Number(e.target.value) });
  };

  return (
    <div className="space-y-6 p-2 text-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#444] pb-2">
        <h3 className="font-bold text-sm">Transform</h3>
        <span className="text-[10px] bg-yellow-900 text-yellow-200 px-2 py-0.5 rounded uppercase tracking-wider">
          {Effect.TRANSFORM}
        </span>
      </div>

      {/* Control 1: Scale */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <label>Scale</label>
          <span className="font-mono text-blue-400">{((effectData.scale || 1) * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.01"
          value={effectData.scale || 1}
          onChange={handleScaleChange}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Control 2: Rotation */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <label>Rotation</label>
          <span className="font-mono text-blue-400">{effectData.rotation || 0}°</span>
        </div>
        <input
          type="range"
          min="0"
          max="360"
          step="1"
          value={effectData.rotation || 0}
          onChange={handleRotationChange}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Control 3: Translate X */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <label>Translate X</label>
          <span className="font-mono text-blue-400">{effectData.translateX || 0}px</span>
        </div>
        <input
          type="range"
          min="-500"
          max="500"
          step="1"
          value={effectData.translateX || 0}
          onChange={handleTranslateXChange}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Control 4: Translate Y */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <label>Translate Y</label>
          <span className="font-mono text-blue-400">{effectData.translateY || 0}px</span>
        </div>
        <input
          type="range"
          min="-500"
          max="500"
          step="1"
          value={effectData.translateY || 0}
          onChange={handleTranslateYChange}
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

