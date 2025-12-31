import type { Node } from '@xyflow/react';
import type { BaseNodeData } from '../../types/node/baseNodeData';
import type { NullEffectData } from '../../types/effect/effectData'; 
import { Effect } from '../../enums/effect';

interface NullPanelProps {
  node: Node<BaseNodeData>;
  updateNode: (id: string, data: Partial<BaseNodeData>) => void;
}

export const NullPanel = ({ node, updateNode: _updateNode }: NullPanelProps) => {
  const effectData = node.data.effect as NullEffectData;

  return (
    <div className="space-y-6 p-2 text-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#444] pb-2">
        <h3 className="font-bold text-sm">Null</h3>
        <span className="text-[10px] bg-gray-700 text-gray-200 px-2 py-0.5 rounded uppercase tracking-wider">
          {Effect.NULL}
        </span>
      </div>

      {/* Info */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400">
          This node passes the input through unchanged. Useful for organizing your node graph or testing connections.
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

