import { useState, useCallback, useMemo } from 'react';
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
    data: { label: 'bty.{$F}.png sequence' , effect: 'File', hasSource: false, hasTarget: true },
    position: { x: 0, y: 0 },
  },
  {
    id: '2',
    type: 'custom',
    data: { label: 'Progressive Blur 01' , effect: 'Blur', hasSource: true, hasTarget: true },
    position: { x: 0, y: 400 },
  },
  {
    id: '3',
    type: 'custom',
    data: { label: 'Sharpener 2x' , effect: 'Sharpen', hasSource: true, hasTarget: true },
    position: { x: 0, y: 800 },
  },
  {
    id: '4',
    type: 'custom',
    data: { label: 'Crop the image' , effect: 'Crop', hasSource: true, hasTarget: true },
    position: { x: 0, y: 1200 },
  },
  {
    id: '5',
    type: 'custom',
    data: { label: 'Change color' , effect: 'Hue Adjust', hasSource: true, hasTarget: true },
    position: { x: 0, y: 1600 },
  },
  {
    id: '6',
    type: 'custom',
    data: { label: 'Add contrast' , effect: 'Levels', hasSource: true, hasTarget: true },
    position: { x: 0, y: 2000 },
  },
];
const initialEdges : Edge[]= [];//[{ id: 'n1-n2', source: 'n1', target: 'n2' }];
 
export default function App() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodes.find((n) => n.id === selectedNodeId);
  }, [nodes, selectedNodeId]);
 
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

  const onSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
    // If multiple nodes are selected, we only take the first one (nodes[0])
    if (nodes.length > 0) {
      setSelectedNodeId(nodes[0].id);
    } else {
      setSelectedNodeId(null);
    }
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }} className='bg-[#202020]' >
      <ReactFlow 
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}

        onSelectionChange={onSelectionChange}

        panOnScroll
        selectionOnDrag
        panOnDrag={panOnDrag}
        selectionMode={SelectionMode.Partial}
        proOptions={proOptions}
        fitView
      >
        <Panel position="top-left" className=' text-xs text-[#ADADAD] px-2 py-[.3rem] !m-0 '>Canal</Panel>
        <Panel position="top-right" className='text-[#ADADAD] !m-0 w-[33vw] h-[100vh]'>
          <div className='grid grid-rows-2 h-full bg-[#262626] text-xs'>
            <div className='border-b-1 border-[#202020] row-span-1 '>
              {/* Top Panel Content */}
              <div className='flex-col h-full m-4 space-y-2'>

                <div className='flex flex-row justify-start gap-x-4 items-center'>
                  <div>Properties</div>
                  <div className='border-2 border-[#888888]/10 bg-[#555555]/40 px-1 py-[.08rem]'>{selectedNode ? String(selectedNode.data.effect) : ''}</div>
                  
                </div>

                <div className='flex-1'>
                  <div>{selectedNode ? String(selectedNode.data.label) : ''}</div>
                  <div>Node id: {selectedNode ? String(selectedNode.id) : 'No Selection'}</div>
                </div>

              </div>
             
            </div>
            <div className='border-t-1 border-[#202020] row-span-1'>
              {/* Bottom Panel Content */}
              <div className='flex-col h-full m-4 space-y-2'>
                <div className=''>Sub-properties</div>
              </div>
              
            </div>
          </div>
          
        </Panel>
        <Controls className='text-[#ADADAD]'/>
        
      </ReactFlow>
      
    </div>
  );
}