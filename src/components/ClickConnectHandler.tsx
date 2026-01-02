import { useState, useEffect, useRef } from 'react';
import { useReactFlow, useStore, type Connection, addEdge } from '@xyflow/react';

interface ClickConnectHandlerProps {
  setEdges: React.Dispatch<React.SetStateAction<any[]>>;
  isValidConnection: (connection: Connection) => boolean;
}

export const ClickConnectHandler = ({ setEdges, isValidConnection }: ClickConnectHandlerProps) => {
  const { screenToFlowPosition, getNodes } = useReactFlow();
  // Track zoom to recalculate handle position when zoom changes
  const zoom = useStore((state) => state.transform[2]);
  const [connectionStart, setConnectionStart] = useState<{
    nodeId: string;
    handleId: string | null;
    handleType: 'source' | 'target';
    position: { x: number; y: number };
  } | null>(null);
  
  // Expose connectionStart state for external access (similar to EdgeCutter)
  useEffect(() => {
    (ClickConnectHandler as any).connectionStart = connectionStart;
    (ClickConnectHandler as any).clearConnection = () => {
      setConnectionStart(null);
      setMousePosition(null);
    };
    // Also expose on globalThis for easier access
    (globalThis as any).__ClickConnectHandler__ = {
      connectionStart,
      clearConnection: () => {
        setConnectionStart(null);
        setMousePosition(null);
      },
    };
  }, [connectionStart]);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track mouse position for connection line
  useEffect(() => {
    if (!connectionStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [connectionStart]);

  // Handle handle clicks and drags
  useEffect(() => {
    const getHandleInfo = (target: HTMLElement) => {
      const handle = target.closest('.react-flow__handle');
      if (!handle) return null;

      // Get node ID and handle info from data attributes (we added these to BaseNode)
      const nodeId = handle.getAttribute('data-nodeid');
      if (!nodeId) return null;

      // Get handle type from data attribute (we added this to BaseNode)
      const handleTypeAttr = handle.getAttribute('data-handle-type');
      const handleType = (handleTypeAttr === 'target' || handleTypeAttr === 'source') 
        ? handleTypeAttr as 'target' | 'source'
        : null;
      
      if (!handleType) return null; // Can't determine handle type

      // Get handle ID from data attribute (we added this to BaseNode)
      const handleId = handle.getAttribute('data-handleid') || null;

      return { handle, nodeId, handleType, handleId };
    };

    const handleHandleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const handleInfo = getHandleInfo(target);
      if (!handleInfo) return;

      e.preventDefault();
      e.stopPropagation();

      const { nodeId, handleType, handleId } = handleInfo;

      const node = getNodes().find(n => n.id === nodeId);
      if (!node) return;

      // Get handle position in flow coordinates
      const rect = handleInfo.handle.getBoundingClientRect();
      const handleCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      const flowPos = screenToFlowPosition(handleCenter);

      if (connectionStart) {
        // We're completing a connection
        const isTarget = handleType === 'target';
        const isSource = handleType === 'source';

        // Check if we clicked on a valid target/source
        if (connectionStart.handleType === 'source' && isTarget && nodeId !== connectionStart.nodeId) {
          // Source -> Target connection
          const connection: Connection = {
            source: connectionStart.nodeId,
            sourceHandle: connectionStart.handleId,
            target: nodeId,
            targetHandle: handleId,
          };

          if (isValidConnection(connection)) {
            setEdges((eds) => addEdge(connection, eds));
          }
        } else if (connectionStart.handleType === 'target' && isSource && nodeId !== connectionStart.nodeId) {
          // Target -> Source connection (reverse)
          const connection: Connection = {
            source: nodeId,
            sourceHandle: handleId,
            target: connectionStart.nodeId,
            targetHandle: connectionStart.handleId,
          };

          if (isValidConnection(connection)) {
            setEdges((eds) => addEdge(connection, eds));
          }
        }

        // Cancel connection
        setConnectionStart(null);
        setMousePosition(null);
      } else {
        // Start a new connection
        setConnectionStart({
          nodeId,
          handleId: handleId || null,
          handleType,
          position: flowPos,
        });
        setMousePosition({ x: e.clientX, y: e.clientY });
      }
    };

    // Handle clicks on the pane to cancel connection
    const handlePaneClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only cancel if clicking on the pane, not on a node or handle
      if (target.closest('.react-flow__pane') && !target.closest('.react-flow__node') && !target.closest('.react-flow__handle')) {
        if (connectionStart) {
          setConnectionStart(null);
          setMousePosition(null);
        }
      }
    };

    document.addEventListener('click', handleHandleClick, true);
    document.addEventListener('click', handlePaneClick);

    return () => {
      document.removeEventListener('click', handleHandleClick, true);
      document.removeEventListener('click', handlePaneClick);
    };
  }, [connectionStart, screenToFlowPosition, getNodes, isValidConnection, setEdges]);

  // Recalculate handle position when zoom changes
  const [handleScreenPos, setHandleScreenPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!connectionStart) {
      setHandleScreenPos(null);
      return;
    }

    // Recalculate handle position whenever zoom changes or connection starts
    const updateHandlePosition = () => {
      const nodeElement = document.querySelector(`.react-flow__node[data-id="${connectionStart.nodeId}"]`);
      if (!nodeElement) {
        setHandleScreenPos(null);
        return;
      }

      // Find the handle - it could be target (top) or source (bottom)
      const handleSelector = connectionStart.handleType === 'target' 
        ? '.react-flow__handle-top, .react-flow__handle-target'
        : '.react-flow__handle-bottom, .react-flow__handle-source';
      
      const handle = nodeElement.querySelector(handleSelector);
      if (!handle) {
        setHandleScreenPos(null);
        return;
      }

      const handleRect = handle.getBoundingClientRect();
      setHandleScreenPos({
        x: handleRect.left + handleRect.width / 2,
        y: handleRect.top + handleRect.height / 2,
      });
    };

    // Update immediately
    updateHandlePosition();

    // Also update on zoom changes
    const interval = setInterval(updateHandlePosition, 16); // ~60fps

    return () => clearInterval(interval);
  }, [connectionStart, zoom]);

  // Render connection line
  if (!connectionStart || !mousePosition || !handleScreenPos) return null;

  const startX = handleScreenPos.x;
  const startY = handleScreenPos.y;
  const endX = mousePosition.x;
  const endY = mousePosition.y;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        <path
          d={`M ${startX} ${startY} L ${endX} ${endY}`}
          stroke="#888"
          strokeWidth="2"
          fill="none"
          strokeDasharray="5,5"
          opacity="0.8"
        />
      </svg>
    </div>
  );
};

