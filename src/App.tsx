import { useState, useCallback, useMemo } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, Panel, SelectionMode, Controls,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect, } from '@xyflow/react';

// --- IMPORTS ---
import CustomNode from './components/nodes/BaseNode';
import { Effect } from './enums/effect';
import type { BaseNodeData } from './types/node/baseNodeData';

// Import your panels here
import { FilePanel } from './components/panels/FilePanel';
import { BlurPanel } from './components/panels/BlurPanel';

// 1. THE REGISTRY: Map Effect Types to Panel Components
const PANEL_REGISTRY: Record<string, React.ComponentType<any>> = {
  [Effect.FILE]: FilePanel,
  [Effect.BLUR]: BlurPanel,
};

const panOnDrag : number[] = [1, 2];
const proOptions = { hideAttribution: true };

const nodeTypes = {
  custom: CustomNode,
};

const initialNodes: Node<BaseNodeData>[] = [
  { 
    id: "1",
    type: 'custom',
    position: { x: 0, y: 0 }, 
    data: { 
      label: "Node 1", 
      effect: { type: Effect.FILE, fileName: "my_test_image.png" },
      hasSource: false, hasTarget: true 
    },
  },
  { 
    id: "2",
    type: 'custom',
    position: { x: 0, y: 400 },
    data: { 
      label: "Node 2", 
      effect: { type: Effect.BLUR, blurAmount: 10 },
      hasSource: true, hasTarget: true 
    },
  },
];

const initialEdges : Edge[]= [];
 
export default function App() {
  const [nodes, setNodes] = useState<Node<BaseNodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // --- MEMOIZED HELPERS ---

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodes.find((n) => n.id === selectedNodeId);
  }, [nodes, selectedNodeId]);

  // 2. THE UPDATE FUNCTION: Passed down to panels to update state
  const updateNodeData = useCallback((id: string, newData: Partial<BaseNodeData>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          // Merge the new data with existing data
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
  }, [setNodes]);

  // --- DYNAMIC PANEL SELECTION ---
  const ActivePanel = useMemo(() => {
    if (!selectedNode?.data?.effect?.type) return null;
    return PANEL_REGISTRY[selectedNode.data.effect.type];
  }, [selectedNode?.data?.effect?.type]);

  // --- CALLBACKS FOR REACT FLOW ---
  const onNodesChange : OnNodesChange = useCallback(
    (changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot) as Node<BaseNodeData>[]),
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
    if (nodes.length > 0) setSelectedNodeId(nodes[0].id);
    else setSelectedNodeId(null);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }} className='bg-[#202020]' >
      <ReactFlow 
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        connectionRadius={100}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        panOnScroll selectionOnDrag panOnDrag={panOnDrag}
        selectionMode={SelectionMode.Partial}
        proOptions={proOptions}
        fitView
      >
        <Panel position="top-left" className=' text-xs text-[#ADADAD] px-2 py-[.3rem] !m-0 '>Canal</Panel>
        
        {/* --- RIGHT SIDEBAR --- */}
        <Panel position="top-right" className='text-[#ADADAD] !m-0 w-[33vw] h-[100vh]'>
          <div className='grid grid-rows-2 h-full bg-[#262626] text-xs'>
            
            {/* --- PROPERTIES PANEL --- */}
            <div className='border-b-1 border-[#202020] row-span-1 overflow-y-auto'>
              <div className='flex-col h-full m-4 space-y-4'>

                {/* Header */}
                <div className='flex flex-row justify-between items-center pb-2 border-b border-[#333]'>
                  <div className='font-bold'>Properties</div>
                  <div className='border-2 border-[#888888]/10 bg-[#555555]/40 px-2 py-1 rounded'>
                    {selectedNode ? selectedNode.data.effect?.type : 'None'}
                  </div>
                </div>

                {/* DYNAMIC CONTENT AREA */}
                <div className='flex-1'>
                  {!selectedNode ? (
                    <div className="text-gray-500 italic mt-10 text-center">
                      Select a node to view properties
                    </div>
                  ) : ActivePanel ? (
                    /* RENDER THE MATCHED PANEL */
                    <ActivePanel 
                      node={selectedNode} 
                      updateNode={updateNodeData} 
                    />
                  ) : (
                    /* FALLBACK IF NO PANEL EXISTS */
                    <div className="text-orange-400 mt-4">
                      No panel created for type: {selectedNode.data.effect.type}
                    </div>
                  )}
                </div>

                {/* Debug Info (Optional) */}
                {selectedNode && (
                  <div className='mt-auto pt-4 text-[10px] text-gray-600 font-mono'>
                    ID: {selectedNode.id}
                  </div>
                )}

              </div>
            </div>

            <div className='border-t-1 border-[#202020] row-span-1'>
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