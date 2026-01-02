import { useReactFlow, type Node, addEdge, type Connection } from '@xyflow/react';
import { CommandPalette } from './CommandPalette';
import { Effect } from '../enums/effect';
import type { BaseNodeData } from '../types/node/baseNodeData';

interface CommandPaletteWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNode: (node: Node<BaseNodeData>) => void;
  mousePosition: { x: number; y: number } | null;
  setEdges: React.Dispatch<React.SetStateAction<any[]>>;
  isValidConnection: (connection: any) => boolean;
}

export const CommandPaletteWrapper = ({ isOpen, onClose, onCreateNode, mousePosition, setEdges, isValidConnection }: CommandPaletteWrapperProps) => {
  const { screenToFlowPosition } = useReactFlow();

  const handleSelect = (effectOption: { type: Effect; defaultData: any; displayName: string }) => {
    // Use cursor position if available, otherwise use viewport center
    let flowPosition;
    
    if (mousePosition) {
      // Convert mouse screen position to flow coordinates
      flowPosition = screenToFlowPosition({ x: mousePosition.x, y: mousePosition.y });
    } else {
      // Fallback to viewport center
      const containerWidth = window.innerWidth * 0.67; // ReactFlow width
      const containerHeight = window.innerHeight;
      const screenX = containerWidth / 2;
      const screenY = containerHeight / 2;
      flowPosition = screenToFlowPosition({ x: screenX, y: screenY });
    }

    // Determine hasSource and hasTarget based on effect type
    // FILE and TEXT are source nodes (no input), others can have inputs
    const hasSource = effectOption.type !== Effect.FILE && effectOption.type !== Effect.TEXT;
    const hasTarget = true; // All nodes can have outputs

    const newNode: Node<BaseNodeData> = {
      id: `node-${Date.now()}`,
      type: 'custom',
      position: flowPosition,
      data: {
        label: effectOption.displayName,
        effect: effectOption.defaultData,
        hasSource,
        hasTarget,
      },
    };

    onCreateNode(newNode);
    
    // Check if there's an active connection from ClickConnectHandler
    // Access it via globalThis (set by ClickConnectHandler component)
    const activeConnection = (globalThis as any).__ClickConnectHandler__?.connectionStart;
    if (activeConnection && hasSource) {
      // If there's an active connection and the new node has a target handle, connect them
      // Wait a bit for the node to be added to the DOM
      setTimeout(() => {
        if (activeConnection.handleType === 'source') {
          // Source -> Target connection
          const connection: Connection = {
            source: activeConnection.nodeId,
            sourceHandle: activeConnection.handleId,
            target: newNode.id,
            targetHandle: 'target-single', // Standard target handle ID
          };

          if (isValidConnection(connection)) {
            setEdges((eds) => addEdge(connection, eds));
          }
        }
        
        // Clear the connection state
        if ((globalThis as any).__ClickConnectHandler__?.clearConnection) {
          (globalThis as any).__ClickConnectHandler__.clearConnection();
        }
      }, 50); // Small delay to ensure node is in DOM
    }
    
    onClose();
  };

  return <CommandPalette isOpen={isOpen} onClose={onClose} onSelect={handleSelect} />;
};

