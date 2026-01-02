import { memo, useState } from 'react';
import { Handle, Position, type NodeProps, type Node, useReactFlow, useStore } from '@xyflow/react';
import type { BaseNodeData } from '../../types/node/baseNodeData';
import { useNodeProcessor } from '../../hooks/useNodeProcessor';

function BaseNode({ id, data }: NodeProps<Node<BaseNodeData>>) {
  const displayImage = useNodeProcessor(id, data);
  const { fitView } = useReactFlow();
  const [hoveredHandleId, setHoveredHandleId] = useState<string | null>(null);
  
  // Get zoom level directly from ReactFlow store (more efficient than polling)
  // transform[2] is the zoom value in ReactFlow's transform array
  const zoom = useStore((state) => state.transform[2]);
  
  // Calculate handle size based on zoom
  // When zoomed out (smaller zoom value), handles should be larger
  // Base size: 20px at zoom 1.0
  // Scale inversely: size = baseSize / zoom, with min/max bounds
  const baseSize = 20;
  const minSize = 15;
  const maxSize = 25;
  const zoomBasedSize = Math.max(minSize, Math.min(maxSize, baseSize / Math.max(0.1, zoom)));
  
  // Hover scale factor
  const hoverScale = 1.5;
  const hoverSize = zoomBasedSize * hoverScale;
  
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
      className="relative overflow-visible min-w-32 max-w-[480px] m-[10px] py-[15px] flex flex-col" 
      style={{ width: aspectRatio ? 'auto' : undefined }}
      onDoubleClick={handleDoubleClick}
    >
      <div className='flex-shrink-0 h-8 w-full bg-[#313131]  rounded-t-lg'>
        <div className='w-full h-full flex flex-row justify-between items-center text-[#888888] text-xs px-2'>
          <div className='capitalize'>{data.effect.type}</div>
          <div>ⓘ</div>
        </div>
      </div>


      {displayImage ? (
        // Show the processed result
        <div className='border-1 border-t-0 border-[#313131] w-full bg-[#222222] rounded-b-lg hover:rounded-b-none flex items-center justify-center overflow-hidden relative'>
          <div 
            className='relative w-full bg-[#111] flex items-center justify-center group'
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
            {/* Resolution hover overlay */}
            {data.ratio && (
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="bg-black/80 text-white text-[10px] font-mono px-2 py-1 rounded border border-white/20">
                  {data.ratio.width} × {data.ratio.height}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Empty State
        <div className='min-h-2 w-full bg-[#313131] rounded-b-lg'>
        
        </div>
      )}



      {/* Input handle for nodes that accept input */}
      {data.hasSource ? (
        // Single handle for regular nodes
        (() => {
          const handleId = 'target-single';
          const isHovered = hoveredHandleId === handleId;
          
          return (
            <Handle
              type="target"
              position={Position.Top}
              id={handleId}
              data-nodeid={id}
              data-handleid={handleId}
              data-handle-type="target"
              style={{
                width: `${isHovered ? hoverSize : zoomBasedSize}px`,
                height: `${isHovered ? hoverSize : zoomBasedSize}px`,
                transition: 'width 0.05s ease, height 0.05s ease',
              }}
              className="rounded-full border-2 border-[#888888] !bg-[#555555] cursor-crosshair"
              onMouseEnter={() => setHoveredHandleId(handleId)}
              onMouseLeave={() => setHoveredHandleId(null)}
            />
          );
        })()
      ) : null}

      {data.hasTarget && (() => {
        const handleId = 'source-single';
        const isHovered = hoveredHandleId === handleId;
        
        return (
          <Handle
            type="source"
            position={Position.Bottom}
            id={handleId}
            data-nodeid={id}
            data-handleid={handleId}
            data-handle-type="source"
            style={{
              width: `${isHovered ? hoverSize : zoomBasedSize}px`,
              height: `${isHovered ? hoverSize : zoomBasedSize}px`,
              transition: 'width 0.05s ease, height 0.05s ease',
            }}
            className="rounded-full border-2 border-[#888888] !bg-[#555555] cursor-crosshair"
            onMouseEnter={() => setHoveredHandleId(handleId)}
            onMouseLeave={() => setHoveredHandleId(null)}
          />
        );
      })()}


    </div>
  );
}

export default memo(BaseNode);


