import { useEffect, useState, useRef } from 'react';
import { useReactFlow, type Edge } from '@xyflow/react';

interface EdgeCutterProps {
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

interface Point {
  x: number;
  y: number;
}

// Create scissors cursor SVG (outside component to avoid recreation)
const SCISSORS_CURSOR = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="6" cy="6" r="3"/>
    <circle cx="6" cy="18" r="3"/>
    <line x1="6" y1="9" x2="6" y2="15"/>
    <path d="M20 4L8.12 15.88"/>
    <path d="M14.47 14.48L20 20"/>
    <path d="M20 4L8.12 15.88"/>
  </svg>
`)}`;

export const EdgeCutter = ({ setEdges }: EdgeCutterProps) => {
  const { screenToFlowPosition, getEdges, getNodes } = useReactFlow();
  const [isCuttingMode, setIsCuttingMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cutPathScreen, setCutPathScreen] = useState<Point[]>([]);
  const mouseDownRef = useRef(false);
  const pathRef = useRef<Point[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Expose cutting mode state to parent
  useEffect(() => {
    (EdgeCutter as any).isCuttingMode = isCuttingMode;
    (EdgeCutter as any).isDragging = isDragging;
  }, [isCuttingMode, isDragging]);

  // Track 'C' key state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setIsCuttingMode(true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        setIsCuttingMode(false);
        setIsDragging(false);
        setCutPathScreen([]);
        pathRef.current = [];
        mouseDownRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Apply cursor style ONLY when in cutting mode (C key is held down)
  useEffect(() => {
    if (isCuttingMode) {
      const style = document.createElement('style');
      style.id = 'edge-cutter-cursor';
      // Use very specific selectors with high specificity to override ReactFlow's cursor styles
      style.textContent = `
        html body .react-flow__viewport,
        html body .react-flow__pane,
        html body .react-flow__pane:active,
        html body .react-flow__pane.dragging,
        html body .react-flow__pane.react-flow__pane-selecting,
        html body .react-flow__edge,
        html body .react-flow__edge-path,
        html body .react-flow__edge.selected,
        html body .react-flow__edge:hover,
        html body,
        html {
          cursor: url("${SCISSORS_CURSOR}") 12 12, crosshair !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        const styleEl = document.getElementById('edge-cutter-cursor');
        if (styleEl) {
          styleEl.remove();
        }
        // Clear any inline cursor styles that might have been set
        document.body.style.cursor = '';
        document.documentElement.style.cursor = '';
        const pane = document.querySelector('.react-flow__pane') as HTMLElement;
        if (pane) {
          pane.style.cursor = '';
        }
      };
    } else {
      // Ensure cursor style is removed when not in cutting mode
      const styleEl = document.getElementById('edge-cutter-cursor');
      if (styleEl) {
        styleEl.remove();
      }
      // Clear any inline cursor styles
      document.body.style.cursor = '';
      document.documentElement.style.cursor = '';
      const pane = document.querySelector('.react-flow__pane') as HTMLElement;
      if (pane) {
        pane.style.cursor = '';
      }
    }
  }, [isCuttingMode]);

  // Disable ReactFlow selection when in cutting mode
  useEffect(() => {
    if (isCuttingMode || isDragging) {
      const style = document.createElement('style');
      style.id = 'edge-cutter-disable-selection';
      style.textContent = `
        .react-flow__pane {
          user-select: none !important;
        }
        .react-flow__selection {
          display: none !important;
        }
        .react-flow__nodesselection-rect {
          display: none !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        const styleEl = document.getElementById('edge-cutter-disable-selection');
        if (styleEl) {
          styleEl.remove();
        }
      };
    }
  }, [isCuttingMode, isDragging]);

  // Helper function to check if two line segments intersect
  const lineSegmentsIntersect = (
    p1: Point, p2: Point,
    p3: Point, p4: Point
  ): boolean => {
    const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
    if (Math.abs(d) < 0.0001) return false;

    const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
    const u = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;

    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  };

  // Helper function to get edge element and its path
  const getEdgePathElement = (edgeId: string): SVGPathElement | null => {
    const edgeElement = document.querySelector(`[data-id="rf__edge-${edgeId}"] .react-flow__edge-path`) as SVGPathElement;
    if (!edgeElement) {
      const altElement = document.querySelector(`.react-flow__edge[data-id*="${edgeId}"] .react-flow__edge-path`) as SVGPathElement;
      return altElement;
    }
    return edgeElement;
  };

  // Helper function to check if a point is near an SVG path
  const isPointNearPath = (point: Point, pathElement: SVGPathElement, threshold: number = 5): boolean => {
    if (!pathElement) return false;
    
    const pathLength = pathElement.getTotalLength();
    const samples = Math.max(20, Math.floor(pathLength / 10));
    for (let i = 0; i <= samples; i++) {
      const len = (pathLength * i) / samples;
      const pathPoint = pathElement.getPointAtLength(len);
      const distance = Math.sqrt(
        Math.pow(point.x - pathPoint.x, 2) + Math.pow(point.y - pathPoint.y, 2)
      );
      if (distance < threshold) {
        return true;
      }
    }
    return false;
  };

  // Helper to calculate distance from point to line segment
  const pointToLineSegmentDistance = (point: Point, lineStart: Point, lineEnd: Point): number => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx: number, yy: number;

    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Path intersection function
  const pathIntersectsEdge = (path: Point[], edge: Edge): boolean => {
    if (path.length < 2) return false;

    const edgePathElement = getEdgePathElement(edge.id);
    if (!edgePathElement) {
      const nodes = getNodes();
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return false;

      const sourceX = sourceNode.position.x + (sourceNode.width || 0) / 2;
      const sourceY = sourceNode.position.y;
      const targetX = targetNode.position.x + (targetNode.width || 0) / 2;
      const targetY = targetNode.position.y + (targetNode.height || 0);

      for (let i = 0; i < path.length - 1; i++) {
        if (lineSegmentsIntersect(
          path[i],
          path[i + 1],
          { x: sourceX, y: sourceY },
          { x: targetX, y: targetY }
        )) {
          return true;
        }
      }
      return false;
    }

    for (let i = 0; i < path.length; i++) {
      if (isPointNearPath(path[i], edgePathElement, 8)) {
        return true;
      }
    }

    const pathLength = edgePathElement.getTotalLength();
    const samples = Math.max(30, Math.floor(pathLength / 5));
    for (let s = 0; s <= samples; s++) {
      const len = (pathLength * s) / samples;
      const edgePoint = edgePathElement.getPointAtLength(len);
      
      for (let i = 0; i < path.length - 1; i++) {
        const distance = pointToLineSegmentDistance(edgePoint, path[i], path[i + 1]);
        if (distance < 8) {
          return true;
        }
      }
    }

    return false;
  };

  // Handle mouse down - start drag
  useEffect(() => {
    if (!isCuttingMode) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Only allow cutting when C is held down
      if (!isCuttingMode) return;
      
      if (e.button === 0) {
        // Get ReactFlow pane for coordinate calculation
        const pane = document.querySelector('.react-flow__pane') as HTMLElement;
        if (!pane) return;
        
        const rect = pane.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        
        const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        mouseDownRef.current = true;
        setIsDragging(true);
        pathRef.current = [flowPos];
        setCutPathScreen([{ x: screenX, y: screenY }]);
        
        // Prevent default selection behavior and stop propagation
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Also prevent ReactFlow from starting selection
        const selectionElement = document.querySelector('.react-flow__nodesselection-rect');
        if (selectionElement) {
          (selectionElement as HTMLElement).style.display = 'none';
        }
        
        // Force cursor to stay as scissors during drag - override ReactFlow's grabbing cursor
        const forceScissorsCursor = () => {
          const cursorStyle = `url("${SCISSORS_CURSOR}") 12 12, crosshair`;
          document.body.style.cursor = cursorStyle;
          document.documentElement.style.cursor = cursorStyle;
          const pane = document.querySelector('.react-flow__pane') as HTMLElement;
          if (pane) {
            pane.style.cursor = cursorStyle;
            pane.style.setProperty('cursor', cursorStyle, 'important');
          }
          // Override any active/dragging states
          const allElements = document.querySelectorAll('*');
          allElements.forEach((el) => {
            if (el instanceof HTMLElement && el.classList.contains('react-flow__pane')) {
              el.style.setProperty('cursor', cursorStyle, 'important');
            }
          });
        };
        forceScissorsCursor();
        
        // Keep forcing it to override ReactFlow's cursor changes
        const cursorInterval = setInterval(forceScissorsCursor, 16); // ~60fps
        (handleMouseDown as any).cursorInterval = cursorInterval;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Only continue if C is still held down
      if (!isCuttingMode) return;
      
      if (mouseDownRef.current) {
        // Get ReactFlow pane for coordinate calculation and cursor setting
        const pane = document.querySelector('.react-flow__pane') as HTMLElement;
        if (!pane) return;
        
        // Continuously force scissors cursor during drag (only if C is held)
        const cursorStyle = `url("${SCISSORS_CURSOR}") 12 12, crosshair`;
        document.body.style.cursor = cursorStyle;
        document.documentElement.style.cursor = cursorStyle;
        pane.style.setProperty('cursor', cursorStyle, 'important');
        
        // Prevent selection box from appearing
        const selectionElement = document.querySelector('.react-flow__nodesselection-rect');
        if (selectionElement) {
          (selectionElement as HTMLElement).style.display = 'none';
        }
        
        const rect = pane.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        
        const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        pathRef.current.push(flowPos);
        setCutPathScreen(prev => [...prev, { x: screenX, y: screenY }]);
      }
    };

    const handleMouseUp = () => {
      // Clear cursor interval if it exists
      if ((handleMouseDown as any).cursorInterval) {
        clearInterval((handleMouseDown as any).cursorInterval);
        (handleMouseDown as any).cursorInterval = null;
      }
      
      if (mouseDownRef.current && pathRef.current.length > 1) {
        // Check all edges for intersections
        const allEdges = getEdges();
        const edgesToDelete = new Set<string>();

        allEdges.forEach(edge => {
          if (pathIntersectsEdge(pathRef.current, edge)) {
            edgesToDelete.add(edge.id);
          }
        });

        if (edgesToDelete.size > 0) {
          setEdges((currentEdges) => {
            return currentEdges.filter((edge) => !edgesToDelete.has(edge.id));
          });
        }
      }
      mouseDownRef.current = false;
      setIsDragging(false);
      setCutPathScreen([]);
      pathRef.current = [];
      
      // Restore cursor if not in cutting mode
      if (!isCuttingMode) {
        document.body.style.cursor = '';
        document.documentElement.style.cursor = '';
      }
    };

    // Use capture phase to intercept before ReactFlow
    window.addEventListener('mousedown', handleMouseDown, true);
    window.addEventListener('mousemove', handleMouseMove, true);
    window.addEventListener('mouseup', handleMouseUp, true);
    
    return () => {
      window.removeEventListener('mousedown', handleMouseDown, true);
      window.removeEventListener('mousemove', handleMouseMove, true);
      window.removeEventListener('mouseup', handleMouseUp, true);
    };
  }, [isCuttingMode, setEdges, screenToFlowPosition, getEdges, getNodes]);

  // Handle edge click - delete immediately if clicked
  const handleEdgeClick = (_event: React.MouseEvent, edge: Edge) => {
    if (isCuttingMode && !mouseDownRef.current) {
      setEdges((currentEdges) => {
        return currentEdges.filter((e) => e.id !== edge.id);
      });
    }
  };

  // Expose handler to parent
  useEffect(() => {
    (EdgeCutter as any).currentHandler = handleEdgeClick;
  }, [isCuttingMode, handleEdgeClick]);

  // Always render container (for ref), but only show path when dragging
  const pathString = cutPathScreen.length >= 2 
    ? cutPathScreen.map((point, index) => 
        `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
      ).join(' ')
    : '';

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {isDragging && cutPathScreen.length >= 2 && (
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
            d={pathString}
            stroke="#ff4444"
            strokeWidth="3"
            strokeDasharray="8,4"
            fill="none"
            opacity="0.9"
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  );
};

// Export handler getter
(EdgeCutter as any).getHandler = () => (EdgeCutter as any).currentHandler;
