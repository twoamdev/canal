import { useEffect } from 'react';
import { useReactFlow, type Node } from '@xyflow/react';
import { Effect } from '../enums/effect';
import type { BaseNodeData } from '../types/node/baseNodeData';

interface FileDropHandlerProps {
  setNodes: React.Dispatch<React.SetStateAction<Node<BaseNodeData>[]>>;
  setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
}

export const FileDropHandler = ({ setNodes, setSelectedNodeId }: FileDropHandlerProps) => {
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    const handleDrop = (e: DragEvent) => {
      // Only handle drops on the ReactFlow pane
      const target = e.target as HTMLElement;
      if (!target.closest('.react-flow__pane')) return;

      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length === 0) return;

      // Filter to only image files
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      
      if (imageFiles.length === 0) {
        alert("Please drop image files (PNG, JPEG, etc.)");
        return;
      }

      // Convert screen coordinates to flow coordinates
      const basePosition = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      // Create nodes for each image file, offsetting them slightly so they don't overlap
      const newNodes: Node<BaseNodeData>[] = imageFiles.map((file, index) => {
        const objectUrl = URL.createObjectURL(file);
        
        // Offset each node by 100px horizontally and 50px vertically to create a grid
        const offsetX = (index % 3) * 250; // 3 nodes per row
        const offsetY = Math.floor(index / 3) * 200; // New row every 3 nodes
        
        // Use a more unique ID with timestamp and index, plus a small random component
        const uniqueId = `node-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
        
        return {
          id: uniqueId,
          type: 'custom',
          position: {
            x: basePosition.x + offsetX,
            y: basePosition.y + offsetY,
          },
          data: {
            label: 'File',
            effect: {
              type: Effect.FILE,
              fileName: file.name,
              previewUrl: objectUrl,
            },
            hasSource: false, // File nodes don't have inputs
            hasTarget: true,
            // Initialize output and ratio as undefined - useNodeProcessor will set them
            output: undefined,
            ratio: undefined,
          },
        };
      });

      // Add nodes one at a time with a small delay to ensure proper initialization
      // This ensures each node's useNodeProcessor hook initializes correctly
      newNodes.forEach((node, index) => {
        setTimeout(() => {
          setNodes((nds) => [...nds, node]);
          // Select the last node created
          if (index === newNodes.length - 1) {
            setSelectedNodeId(node.id);
          }
        }, index * 10); // Small delay between each node (10ms)
      });
    };

    const handleDragOver = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.react-flow__pane')) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer!.dropEffect = 'copy';
      }
    };

    // Add event listeners to the document
    document.addEventListener('drop', handleDrop);
    document.addEventListener('dragover', handleDragOver);

    return () => {
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('dragover', handleDragOver);
    };
  }, [screenToFlowPosition, setNodes, setSelectedNodeId]);

  return null; // This component doesn't render anything
};

