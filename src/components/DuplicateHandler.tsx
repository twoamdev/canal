import { useEffect } from 'react';
import { useReactFlow, type Node, type Edge } from '@xyflow/react';
import type { BaseNodeData } from '../types/node/baseNodeData';
import { Effect } from '../enums/effect';

interface DuplicateHandlerProps {
  selectedNodeId: string | null;
  mousePosition: { x: number; y: number } | null;
  setNodes: React.Dispatch<React.SetStateAction<Node<BaseNodeData>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
}

export const DuplicateHandler = ({
  selectedNodeId,
  mousePosition,
  setNodes,
  setEdges,
  setSelectedNodeId,
}: DuplicateHandlerProps) => {
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for CMD+D (Mac) or Ctrl+D (Windows/Linux)
      const isDuplicateKey = (e.metaKey || e.ctrlKey) && e.key === 'd';

      if (isDuplicateKey && selectedNodeId) {
        const target = e.target as HTMLElement;
        // Don't duplicate if we're in an input field
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();

          setNodes((currentNodes) => {
            const nodeToDuplicate = currentNodes.find((n) => n.id === selectedNodeId);
            if (!nodeToDuplicate) return currentNodes;

            // Create new unique ID
            const newId = `node-${Date.now()}`;

            // Use cursor position if available, otherwise offset from original
            let newPosition = { x: nodeToDuplicate.position.x + 50, y: nodeToDuplicate.position.y + 50 };

            if (mousePosition) {
              // Convert mouse screen position to flow coordinates
              const flowPosition = screenToFlowPosition({
                x: mousePosition.x,
                y: mousePosition.y,
              });
              // Small offset from cursor so it doesn't cover the cursor
              newPosition = {
                x: flowPosition.x - 50,
                y: flowPosition.y - 50,
              };
            }

            // Deep copy the node data, especially the effect object
            // For TEXT nodes, we can copy output/ratio since they generate their own content
            // For FILE nodes, we need to let the processor run to read from previewUrl
            const isTextNode = nodeToDuplicate.data.effect.type === Effect.TEXT;
            
            // Create base data without output/ratio (except for TEXT nodes)
            const baseData = { ...nodeToDuplicate.data };
            if (!isTextNode) {
              // Remove output and ratio so processor runs fresh
              delete baseData.output;
              delete baseData.ratio;
            }
            
            const duplicatedNode: Node<BaseNodeData> = {
              ...nodeToDuplicate,
              id: newId,
              position: newPosition,
              data: {
                ...baseData,
                // Deep copy the effect to ensure all settings are preserved
                // This includes previewUrl for FILE nodes and text settings for TEXT nodes
                effect: JSON.parse(JSON.stringify(nodeToDuplicate.data.effect)),
                // For TEXT nodes, preserve output/ratio since they generate their own content
                ...(isTextNode ? {
                  output: nodeToDuplicate.data.output,
                  ratio: nodeToDuplicate.data.ratio ? { ...nodeToDuplicate.data.ratio } : undefined,
                } : {}),
              },
            };

            // Duplicate edges
            setEdges((currentEdges) => {
              const newEdges: Edge[] = [];

              // Duplicate incoming edges (edges pointing TO the original node)
              const incomingEdges = currentEdges.filter((edge) => edge.target === selectedNodeId);
              incomingEdges.forEach((edge) => {
                // Check if target handle already has a connection (respect single connection rule)
                const existingConnection = currentEdges.find(
                  (e) => e.target === newId && e.targetHandle === edge.targetHandle
                );
                
                // Only create the edge if the target handle doesn't already have a connection
                if (!existingConnection) {
                  newEdges.push({
                    ...edge,
                    id: `edge-${Date.now()}-${Math.random()}`,
                    target: newId,
                    // Preserve targetHandle for merge nodes
                    targetHandle: edge.targetHandle,
                  });
                }
              });

              // Duplicate outgoing edges (edges pointing FROM the original node)
              const outgoingEdges = currentEdges.filter((edge) => edge.source === selectedNodeId);
              outgoingEdges.forEach((edge) => {
                // For outgoing edges, we need to check if the target node's handle already has a connection
                const existingConnection = currentEdges.find(
                  (e) => e.target === edge.target && 
                         e.targetHandle === edge.targetHandle &&
                         e.source !== newId // Don't count the edge we're about to create
                );
                
                // Only create the edge if the target handle doesn't already have a connection
                if (!existingConnection) {
                  newEdges.push({
                    ...edge,
                    id: `edge-${Date.now()}-${Math.random()}`,
                    source: newId,
                    // Preserve sourceHandle
                    sourceHandle: edge.sourceHandle,
                  });
                }
              });

              return [...currentEdges, ...newEdges];
            });

            // Clear selection on all existing nodes and select only the new duplicated node
            const updatedNodes = currentNodes.map((n) => ({
              ...n,
              selected: false, // Clear selection on all existing nodes
            }));
            
            // Add the new duplicated node with selected: true
            const newDuplicatedNode = {
              ...duplicatedNode,
              selected: true,
            };

            // Update selection state
            setSelectedNodeId(newId);

            return [...updatedNodes, newDuplicatedNode];
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, mousePosition, screenToFlowPosition, setNodes, setEdges, setSelectedNodeId]);

  return null;
};

