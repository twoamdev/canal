import { useState, useCallback, useMemo, useEffect } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, Panel, SelectionMode, Controls,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Connection, } from '@xyflow/react';

// --- IMPORTS ---
import CustomNode from './components/nodes/BaseNode';
import { Effect } from './enums/effect';
import type { BaseNodeData } from './types/node/baseNodeData';
import { CommandPaletteWrapper } from './components/CommandPaletteWrapper';
import { ZoomHandler } from './components/ZoomHandler';
import { DuplicateHandler } from './components/DuplicateHandler';
import { EdgeCutter } from './components/EdgeCutter';
import { FileDropHandler } from './components/FileDropHandler';
import { ClickConnectHandler } from './components/ClickConnectHandler';

// Import your panels here
import { FilePanel } from './components/panels/FilePanel';
import { BlurPanel } from './components/panels/BlurPanel';
import { NullPanel } from './components/panels/NullPanel';
import { TextPanel } from './components/panels/TextPanel';
import { TransformPanel } from './components/panels/TransformPanel';
import { OpacityPanel } from './components/panels/OpacityPanel';
import { ColorCorrectPanel } from './components/panels/ColorCorrectPanel';
import { ExportPanel } from './components/panels/ExportPanel';
import { CompositionPanel } from './components/panels/CompositionPanel';

// 1. THE REGISTRY: Map Effect Types to Panel Components
const PANEL_REGISTRY: Record<string, React.ComponentType<any>> = {
  [Effect.FILE]: FilePanel,
  [Effect.BLUR]: BlurPanel,
  [Effect.NULL]: NullPanel,
  [Effect.TEXT]: TextPanel,
  [Effect.TRANSFORM]: TransformPanel,
  [Effect.OPACITY]: OpacityPanel,
  [Effect.COLOR_CORRECT]: ColorCorrectPanel,
  [Effect.EXPORT]: ExportPanel,
  [Effect.COMPOSITION]: CompositionPanel,
};

const panOnDrag : number[] = [1, 2];
const proOptions = { hideAttribution: true };

const nodeTypes = {
  custom: CustomNode,
};

const initialNodes: Node<BaseNodeData>[] = [

];

const initialEdges : Edge[]= [];
 
export default function App() {
  const [nodes, setNodes] = useState<Node<BaseNodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  
  // Track cutting mode state for disabling selection
  const [isCuttingMode, setIsCuttingMode] = useState(false);
  const [isCuttingDragging, setIsCuttingDragging] = useState(false);
  
  // Update cutting mode state from EdgeCutter component
  useEffect(() => {
    const checkCuttingMode = () => {
      setIsCuttingMode((EdgeCutter as any).isCuttingMode || false);
      setIsCuttingDragging((EdgeCutter as any).isDragging || false);
    };
    
    const interval = setInterval(checkCuttingMode, 50);
    return () => clearInterval(interval);
  }, []);
  
  // Edge click handler for cutting mode
  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    const handler = (EdgeCutter as any).getHandler?.();
    if (handler) {
      handler(event, edge);
    }
  }, []);

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
  // Validate connections - only allow one connection per input handle
  const isValidConnection = useCallback((connection: Connection | Edge) => {
    // Check if target handle already has a connection
    const existingConnection = edges.find(
      (edge) => edge.target === connection.target && 
                edge.targetHandle === connection.targetHandle
    );
    
    // If a connection already exists to this target handle, reject the new connection
    return !existingConnection;
  }, [edges]);

  const onConnect : OnConnect = useCallback(
    (params) => {
      console.log('=== CONNECT DEBUG ===');
      console.log('Connection params:', params);
      setEdges((edgesSnapshot) => {
        const newEdges = addEdge(params, edgesSnapshot);
        console.log('Previous edges:', edgesSnapshot);
        console.log('New edges after addEdge:', newEdges);
        return newEdges;
      });
    },
    [],
  );
  const onSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
    if (nodes.length > 0) setSelectedNodeId(nodes[0].id);
    else setSelectedNodeId(null);
  }, []);

  // Handle Tab key to toggle command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const target = e.target as HTMLElement;
        // If command palette is open, close it on Tab
        if (isCommandPaletteOpen) {
          // Only close if we're in the command palette input or not in any input
          if (target.tagName === 'INPUT' || target.closest('[data-command-palette]')) {
            e.preventDefault();
            setIsCommandPaletteOpen(false);
          }
        } else {
          // If closed, open it (but not if we're in an input field)
          if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            setIsCommandPaletteOpen(true);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen]);

  // Handle Delete key to delete selected node
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only delete if Delete/Backspace is pressed, node is selected, and we're not in an input field
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          
          const nodeIdToDelete = selectedNodeId;
          
          // Use functional update to get the latest edges state
          setEdges((currentEdges) => {
            console.log('=== DELETE NODE DEBUG ===');
            console.log('Deleting node:', nodeIdToDelete);
            console.log('Current edges from functional update:', currentEdges);
            console.log('Edges from closure:', edges);
            
            // Use currentEdges from functional update (should be latest)
            const edgesToUse = currentEdges;
            
            // Find all edges connected to the node being deleted
            const incomingEdges = edgesToUse.filter((edge) => edge.target === nodeIdToDelete);
            const outgoingEdges = edgesToUse.filter((edge) => edge.source === nodeIdToDelete);
            
            console.log('Incoming edges:', incomingEdges);
            console.log('Outgoing edges:', outgoingEdges);
            
            // Get the input node (assuming single input)
            const incomingSource = incomingEdges.length > 0 ? incomingEdges[0].source : null;
            
            console.log('Incoming source node:', incomingSource);
            
            // Remove all edges connected to the deleted node first
            const edgesToKeep = edgesToUse.filter(
              (edge) => edge.source !== nodeIdToDelete && edge.target !== nodeIdToDelete
            );
            
            console.log('Edges to keep (after removing deleted node edges):', edgesToKeep);
            
            // Create new edges: connect incoming nodes to outgoing nodes
            let updatedEdges = edgesToKeep;
            
            // For each outgoing edge, create a new edge from the input node (if exists) to the target
            if (incomingSource && outgoingEdges.length > 0) {
              outgoingEdges.forEach((outgoingEdge) => {
                // Check if an edge already exists between incoming source and outgoing target
                const edgeExists = updatedEdges.some(
                  (edge) => edge.source === incomingSource && edge.target === outgoingEdge.target
                );
                
                // Only create new edge if it doesn't already exist and target is not the deleted node
                if (!edgeExists && outgoingEdge.target !== nodeIdToDelete) {
                  const newEdgeParams = {
                    source: incomingSource,
                    target: outgoingEdge.target,
                    sourceHandle: null,
                    targetHandle: null,
                  };
                  
                  console.log('Creating new edge from', incomingSource, 'to', outgoingEdge.target);
                  
                  // Use addEdge helper for consistency
                  updatedEdges = addEdge(newEdgeParams, updatedEdges);
                } else {
                  console.log('Skipping edge creation - already exists or invalid target');
                }
              });
            } else {
              console.log('No incoming source or no outgoing edges - skipping reconnection');
            }
            
            console.log('Final edges:', updatedEdges);
            console.log('=== END DEBUG ===');
            
            return updatedEdges;
          });
          
          // Remove the node
          setNodes((nds) => nds.filter((node) => node.id !== nodeIdToDelete));
          setSelectedNodeId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, edges]);

  // Create new node
  const handleCreateNode = useCallback((newNode: Node<BaseNodeData>) => {
    setNodes((nds) => [...nds, newNode]);
  }, []);

  // Track mouse position for node placement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handle CMD+\ / Ctrl+\ to toggle UI panels
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for CMD+\ (Mac) or Ctrl+\ (Windows/Linux)
      const isTogglePanelsKey = (e.metaKey || e.ctrlKey) && (e.key === '\\' || e.key === 'Backslash');
      
      if (isTogglePanelsKey) {
        const target = e.target as HTMLElement;
        // Don't toggle if we're in an input field
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setIsPanelVisible((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
        isValidConnection={isValidConnection}
        onEdgeClick={handleEdgeClick}
        edgesFocusable={true}
        panOnScroll 
        selectionOnDrag={!isCuttingMode && !isCuttingDragging}
        panOnDrag={isCuttingMode && isCuttingDragging ? [] : panOnDrag}
        selectionMode={SelectionMode.Partial}
        nodesDraggable={true}
        nodesConnectable={false}
        proOptions={proOptions}
        defaultViewport={{ x: 0, y: 0, zoom: 0.25 }}
        minZoom={0.01}
        maxZoom={4}
      >
        <Panel position="top-left" className=' text-xs text-[#ADADAD] px-2 py-[.3rem] !m-0 '>Canal</Panel>
        
        {/* Edge Cutter Component - must be inside ReactFlow context */}
        <EdgeCutter setEdges={setEdges} />
        
        {/* File Drop Handler - must be inside ReactFlow context */}
        <FileDropHandler setNodes={setNodes} setSelectedNodeId={setSelectedNodeId} />
        
        {/* Click Connect Handler - must be inside ReactFlow context */}
        <ClickConnectHandler setEdges={setEdges} isValidConnection={isValidConnection} />
        
        {/* --- RIGHT SIDEBAR --- */}
        {isPanelVisible && (
          <Panel position="top-right" className='text-[#ADADAD] !m-0 w-[33vw] h-[100vh]'>
          <div className='grid grid-rows-1 h-full bg-[#262626] text-xs'>
            
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

           
          </div>
        </Panel>
        )}
        <Controls className='text-[#ADADAD]'/>
        <CommandPaletteWrapper
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onCreateNode={handleCreateNode}
          mousePosition={mousePosition}
          setEdges={setEdges}
          isValidConnection={isValidConnection}
        />
        <ZoomHandler />
        <DuplicateHandler
          selectedNodeId={selectedNodeId}
          mousePosition={mousePosition}
          setNodes={setNodes}
          setEdges={setEdges}
          setSelectedNodeId={setSelectedNodeId}
        />
      </ReactFlow>
    </div>
  );
}