import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node} from '@xyflow/react';
import type { BaseNodeData } from '../../types/node/baseNodeData';
import { useNodeProcessor } from '../../hooks/useNodeProcessor'; // Import the hook
import { Effect } from '../../enums/effect';

// We use NodeProps to get the ID automatically
function BaseNode({ id, data }: NodeProps<Node<BaseNodeData>>) {
  
  // 1. Run the processor engine
  // This calculates the image based on inputs + effects
  const displayImage = useNodeProcessor(id, data);

  return (
    // Added 'overflow-hidden' to keep corners clean
    <div className="shadow-2xl w-[480px] h-[300px] bg-[#1a1a1a] rounded-lg overflow-hidden border border-[#333]">
      
      {/* HEADER */}
      <div className='h-[32px] w-full bg-[#313131] border-b border-[#555555] flex items-center px-3 justify-between'>
        <span className='text-[#e5e5e5] font-semibold text-xs tracking-wide'>{data.label}</span>
        
        <div className='flex items-center gap-2'>
            <span className='text-[9px] uppercase bg-[#444] text-[#aaa] px-1.5 py-0.5 rounded'>
              {data.effect.type}
            </span>
            {/* Visual Indicator if processing */}
            {!displayImage && data.effect.type !== Effect.FILE && (
               <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" title="Waiting for input..."></span>
            )}
        </div>
      </div>

      {/* VIEWPORT AREA */}
      <div className='relative w-full h-[calc(100%-32px)] bg-[#111] flex items-center justify-center p-2'>
          {displayImage ? (
            // Show the processed result
            <img 
              src={displayImage} 
              className="w-full h-full object-contain shadow-lg" 
              alt="Node Output" 
            />
          ) : (
            // Empty State
            <div className="text-[#333] text-4xl font-mono select-none">
              NO SIGNAL
            </div>
          )}
      </div>

      {/* HANDLES */}
      {/* Note: I adjusted handle positions to be relative to the container height/width so they align perfectly */}
      
      {data.hasSource && (
        <Handle
          type="target"
          position={Position.Top}
          // Centered Top Handle
          className="!w-4 !h-4 !bg-[#555] border-2 border-[#888] rounded-full hover:!bg-blue-500 transition-colors"
          style={{ top: -8 }} 
        />
      )}
      
      {data.hasTarget && (
        <Handle
          type="source"
          position={Position.Bottom}
          // Centered Bottom Handle
          className="!w-4 !h-4 !bg-[#313131] border-2 border-[#555] rounded-full hover:!bg-blue-500 transition-colors"
          style={{ bottom: -8 }}
        />
      )}
    </div>
  );
}

export default memo(BaseNode);


