import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node, useReactFlow } from '@xyflow/react';
import type { BaseNodeData } from '../../types/node/baseNodeData';
import { useNodeProcessor } from '../../hooks/useNodeProcessor';
import { Effect } from '../../enums/effect';
import type { MergeEffectData } from '../../types/effect/effectData';

function BaseNode({ id, data }: NodeProps<Node<BaseNodeData>>) {
  const displayImage = useNodeProcessor(id, data);
  const { fitView } = useReactFlow();
  
  // Calculate aspect ratio from ratio data
  const aspectRatio = data.ratio 
    ? `${data.ratio.width} / ${data.ratio.height}`
    : undefined;
  
  // Handle double-click to zoom to this node
  const handleDoubleClick = () => {
    fitView({
      nodes: [{ id }],
      padding: 0.0,
      duration: 150,
    });
  };
  
  return (
    <div 
      className="shadow-md overflow-hidden min-w-32 max-w-[480px] m-[10px] py-[2px] flex flex-col" 
      style={{ width: aspectRatio ? 'auto' : undefined }}
      onDoubleClick={handleDoubleClick}
    >
      <div className='flex-shrink-0 h-8 w-full bg-[#313131] border-2 border-[#555555]'>
        <div className='w-full h-full flex flex-row justify-between items-center text-[#888888] text-xs px-2'>
          <div>{data.label}</div>
          <div className='flex flex-row gap-2'>
            <div className='capitalize'>{data.effect.type}</div>
            <div>ⓘ</div>
          </div>

        </div>

      </div>
      <div className='flex-shrink-0 h-1 w-full '></div>

      {displayImage ? (
        // Show the processed result
        <div className='w-full bg-[#222222] border-2 border-[#555555] flex items-center justify-center overflow-hidden'>
          <div 
            className='relative w-full bg-[#111] flex items-center justify-center'
            style={{
              aspectRatio: aspectRatio,
              minHeight: aspectRatio ? undefined : '128px',
            }}
          >
            <img
              src={displayImage}
              className="w-full h-full object-contain shadow-lg"
              alt="Node Output"
            />
          </div>
        </div>
      ) : (
        // Empty State
        <div className='min-h-32 w-full bg-[#222222] border-2 border-[#555555]'>
        
        </div>
      )}



      {/* Multiple input handles for merge nodes, single handle for others */}
      {data.effect.type === Effect.MERGE ? (
        // Render multiple handles for merge nodes
        (() => {
          const mergeData = data.effect as MergeEffectData;
          const inputCount = mergeData.inputCount || 2;
          const handles = [];
          
          for (let i = 0; i < inputCount; i++) {
            // Space handles evenly across the top
            // Position from 10% to 90% of width
            const leftPercent = 10 + (i / (inputCount - 1 || 1)) * 80;
            
            handles.push(
              <Handle
                key={`input-${i}`}
                type="target"
                position={Position.Top}
                id={`input-${i}`}
                style={{ left: `${leftPercent}%` }}
                className="w-[20px] h-[20px] border-2 border-[#888888] !bg-[#555555]"
              />
            );
          }
          
          return handles;
        })()
      ) : data.hasSource ? (
        // Single handle for regular nodes
        <Handle
          type="target"
          position={Position.Top}
          className="w-[20px] h-[20px] border-2 border-[#888888] !bg-[#555555] "
        />
      ) : null}

      {data.hasTarget && (
        <Handle
          type="source"
          position={Position.Bottom}
          className=" border-2 border-[#888888] w-[20px] h-[20px] !bg-[#555555] "
        />
      )}


    </div>
  );
}

export default memo(BaseNode);


