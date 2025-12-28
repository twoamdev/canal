import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

type NodeData = {
  label: string;
  effect: string;
  hasSource?: boolean;
  hasTarget?: boolean;
}



function BaseNode({ data }: { data: NodeData }) {
  return (
    <div className="shadow-md w-[480px] h-[300px] m-[10px] py-[2px]">
      <div className='h-[9.5%] w-full bg-[#313131] border-2 border-[#555555]'>
        <div className='w-full h-full flex flex-row justify-between items-center text-[#888888] text-xs px-2'>
            <div>{data.label}</div>
            <div className='flex flex-row gap-2'>
                <div>{data.effect}</div>
                <div>ⓘ</div>
            </div>
            
        </div>
        
      </div>
      <div className='h-[0.5%] w-full '></div>
      <div className='h-[90%] w-full bg-[#222222] border-2 border-[#555555]'></div>

    {data.hasSource && (
      <Handle
        type="target"
        position={Position.Top}
        className="w-[20px] h-[20px] border-2 border-[#888888] !bg-[#555555] !left-[20px]"
      />
    )}
      
      {data.hasTarget && (
        <Handle
        type="source"
        position={Position.Bottom}
        className=" border-2 border-[#555555] w-[20px] h-[20px] !bg-[#313131] !left-[20px]"
      />
      )}
      
      
    </div>
  );
}

export default memo(BaseNode);
