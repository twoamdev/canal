import { useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';

export const ZoomHandler = () => {
  const { zoomIn, zoomOut, getZoom, zoomTo } = useReactFlow();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if we're not in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Handle plus/equals key for zoom in
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        // Get current zoom and increase by 3x the default step (default is ~0.2, so 3x = 0.6)
        const currentZoom = getZoom();
        const zoomStep = 0.6; // 3x the default zoom step
        const newZoom = Math.min(4, currentZoom + zoomStep);
        zoomTo(newZoom, { duration: 200 });
      }
      
      // Handle minus/underscore key for zoom out
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        // Get current zoom and decrease by 3x the default step
        const currentZoom = getZoom();
        const zoomStep = 0.5; // 3x the default zoom step
        const newZoom = Math.max(0.01, currentZoom - zoomStep);
        zoomTo(newZoom, { duration: 200 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, getZoom, zoomTo]);

  return null; // This component doesn't render anything
};

