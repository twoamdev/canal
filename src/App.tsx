import { useState, useCallback } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, Panel, SelectionMode, Controls,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect, } from '@xyflow/react';

const panOnDrag : number[] = [1, 2];
const proOptions = { hideAttribution: true };
import CustomNode from './components/nodes/BaseNode';
 
const nodeTypes = {
  custom: CustomNode,
};
 
const initialNodes : Node[] = [
  {
    id: '1',
    type: 'custom',
    data: { label: 'bty.{$F}.png sequence' , effect: 'File' },
    position: { x: 0, y: 50 },
  },
  {
    id: '2',
    type: 'custom',
    data: { label: 'Blur bg' , effect: 'Blur' },
 
    position: { x: -200, y: 200 },
  },
  {
    id: '3',
    type: 'custom',
    data: { label: 'Crop the image' , effect: 'Crop' },
    position: { x: 200, y: 200 },
  },
];
const initialEdges : Edge[]= [];//[{ id: 'n1-n2', source: 'n1', target: 'n2' }];
 
export default function App() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
 
  const onNodesChange : OnNodesChange= useCallback(
    (changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );
  const onEdgesChange : OnEdgesChange = useCallback(
    (changes) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  const onConnect : OnConnect = useCallback(
    (params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );
 
  return (
    <div style={{ width: '100vw', height: '100vh' }} className='bg-[#202020]' >
      <ReactFlow 
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        panOnScroll
        selectionOnDrag
        panOnDrag={panOnDrag}
        selectionMode={SelectionMode.Partial}
        proOptions={proOptions}
        fitView
      >
        <Panel position="top-left" className=' text-xs text-[#ADADAD] px-2 py-[.3rem] !m-0 '>Canal</Panel>
        <Panel position="top-right" className='text-[#ADADAD] !m-0 w-[33vw] h-[100vh]'>
          <div className='grid grid-rows-2 h-full bg-[#262626]'>
            <div className='border-b-1 border-[#202020] grid-span-1'></div>
            <div className='border-t-1 border-[#202020] grid-span-1'></div>
          </div>
          
        </Panel>
        <Controls className='text-[#ADADAD]'/>
        
      </ReactFlow>
      
    </div>
  );
}