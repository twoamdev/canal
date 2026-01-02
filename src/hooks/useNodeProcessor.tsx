import { useEffect, useState } from 'react';
import { useHandleConnections, useNodesData, useReactFlow } from '@xyflow/react';
import { Effect } from '../enums/effect';
import type { ImageRatio } from '../types/node/baseNodeData';

// A simple helper to process images on a hidden canvas
// Returns both the processed image URL and the image ratio
async function processImage(imageUrl: string, effectType: string, params: any): Promise<{ url: string; ratio: ImageRatio }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let canvasWidth = img.width;
      let canvasHeight = img.height;
      let ratio: ImageRatio = {
        width: img.width,
        height: img.height,
      };

      // Handle transform effect - need larger canvas to accommodate transformations
      if (effectType === Effect.TRANSFORM) {
        const scale = params.scale || 1;
        const rotation = params.rotation || 0;
        const translateX = params.translateX || 0;
        const translateY = params.translateY || 0;
        
        // Calculate bounding box for transformed image
        const rad = (rotation * Math.PI) / 180;
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));
        
        // Scaled dimensions
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        // Bounding box dimensions (accounting for rotation)
        const boundingWidth = scaledWidth * cos + scaledHeight * sin;
        const boundingHeight = scaledWidth * sin + scaledHeight * cos;
        
        // Add padding for translation
        const padding = Math.max(Math.abs(translateX), Math.abs(translateY), 0);
        canvasWidth = Math.ceil(boundingWidth + padding * 2);
        canvasHeight = Math.ceil(boundingHeight + padding * 2);
        
        // Update ratio based on scaled dimensions
        ratio = {
          width: scaledWidth,
          height: scaledHeight,
        };
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Apply opacity if needed
      if (effectType === Effect.OPACITY) {
        ctx.globalAlpha = params.opacity !== undefined ? params.opacity : 1;
      } else {
        ctx.globalAlpha = 1;
      }

      // Apply transform if needed
      if (effectType === Effect.TRANSFORM) {
        const scale = params.scale || 1;
        const rotation = params.rotation || 0;
        const translateX = params.translateX || 0;
        const translateY = params.translateY || 0;
        
        // Move to center of canvas for transformations
        ctx.save();
        ctx.translate(canvasWidth / 2, canvasHeight / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale, scale);
        ctx.translate(translateX, translateY);
        
        // Draw image centered
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
      } else if (effectType === Effect.COLOR_CORRECT) {
        // Draw image first
        ctx.drawImage(img, 0, 0);
        
        // Get image data for pixel manipulation
        const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
        const data = imageData.data;
        
        // Color correction parameters
        const brightness = (params.brightness || 0) / 100; // -1 to 1
        const contrast = (params.contrast || 0) / 100; // -1 to 1
        const saturation = (params.saturation || 0) / 100; // -1 to 1
        const exposure = params.exposure || 0; // -2 to 2
        const hueShift = (params.hue || 0) * Math.PI / 180; // Convert to radians
        
        // Apply color corrections
        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];
          
          // Apply exposure (multiply)
          r *= Math.pow(2, exposure);
          g *= Math.pow(2, exposure);
          b *= Math.pow(2, exposure);
          
          // Clamp to 0-255
          r = Math.max(0, Math.min(255, r));
          g = Math.max(0, Math.min(255, g));
          b = Math.max(0, Math.min(255, b));
          
          // Convert to 0-1 range for processing
          r /= 255;
          g /= 255;
          b /= 255;
          
          // Apply brightness (add/subtract)
          r += brightness;
          g += brightness;
          b += brightness;
          
          // Apply contrast
          // Contrast formula: factor = (1 + contrast) / (1 - contrast)
          // Handle edge cases to avoid division by zero
          let contrastFactor = 1;
          if (Math.abs(contrast) < 0.99) {
            contrastFactor = (1 + contrast) / (1 - contrast);
          } else if (contrast >= 0.99) {
            // Maximum contrast - push to extremes
            contrastFactor = 100;
          } else {
            // Minimum contrast - push to gray
            contrastFactor = 0.01;
          }
          r = ((r - 0.5) * contrastFactor) + 0.5;
          g = ((g - 0.5) * contrastFactor) + 0.5;
          b = ((b - 0.5) * contrastFactor) + 0.5;
          
          // Apply saturation
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = gray + (r - gray) * (1 + saturation);
          g = gray + (g - gray) * (1 + saturation);
          b = gray + (b - gray) * (1 + saturation);
          
          // Apply hue shift (rotate in RGB space)
          if (hueShift !== 0) {
            // Convert RGB to HSL-like representation, shift hue, convert back
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;
            
            if (delta > 0.001) {
              let h = 0;
              if (max === r) {
                h = ((g - b) / delta) % 6;
              } else if (max === g) {
                h = (b - r) / delta + 2;
              } else {
                h = (r - g) / delta + 4;
              }
              h = h * 60; // Convert to degrees
              
              // Shift hue
              h = (h + (hueShift * 180 / Math.PI)) % 360;
              if (h < 0) h += 360;
              
              // Convert back to RGB
              const c = delta;
              const x = c * (1 - Math.abs((h / 60) % 2 - 1));
              const m = min;
              
              let rNew = 0, gNew = 0, bNew = 0;
              if (h < 60) {
                rNew = c; gNew = x; bNew = 0;
              } else if (h < 120) {
                rNew = x; gNew = c; bNew = 0;
              } else if (h < 180) {
                rNew = 0; gNew = c; bNew = x;
              } else if (h < 240) {
                rNew = 0; gNew = x; bNew = c;
              } else if (h < 300) {
                rNew = x; gNew = 0; bNew = c;
              } else {
                rNew = c; gNew = 0; bNew = x;
              }
              
              r = rNew + m;
              g = gNew + m;
              b = bNew + m;
            }
          }
          
          // Clamp values
          r = Math.max(0, Math.min(1, r));
          g = Math.max(0, Math.min(1, g));
          b = Math.max(0, Math.min(1, b));
          
          // Convert back to 0-255 range
          data[i] = r * 255;
          data[i + 1] = g * 255;
          data[i + 2] = b * 255;
        }
        
        // Put modified image data back
        ctx.putImageData(imageData, 0, 0);
      } else {
        // For other effects (blur, opacity), draw normally
        if (effectType === Effect.BLUR) {
          ctx.filter = `blur(${params.blurAmount || 0}px)`;
        } else {
          ctx.filter = 'none';
        }
        
        ctx.drawImage(img, 0, 0);
      }

      // 2. Export the processed result
      canvas.toBlob((blob) => {
        if (blob) {
          resolve({
            url: URL.createObjectURL(blob),
            ratio: ratio,
          });
        }
      });
    };
  });
}

// Helper to get image dimensions and calculate ratio
async function getImageRatio(imageUrl: string): Promise<ImageRatio | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;
    
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };
    
    img.onerror = () => {
      resolve(null);
    };
  });
}

// Helper to render text on canvas with alpha background
async function renderText(
  text: string,
  fontSize: number,
  color: string,
  alignment: 'left' | 'center' | 'right',
  fontWeight: 'normal' | 'bold' = 'normal',
  padding: number = 0
): Promise<{ url: string; ratio: ImageRatio }> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve({ url: '', ratio: { width: 100, height: 100 } });
      return;
    }

    // Set font properties
    const fontFamily = 'Arial, sans-serif'; // Default font
    const fontStyle = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.font = fontStyle;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';

    // Measure text
    const lines = text.split('\n');
    const lineHeight = fontSize * 1.2; // Line height multiplier
    const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
    const textHeight = lines.length * lineHeight;

    // Calculate canvas dimensions with padding
    const canvasWidth = Math.ceil(maxWidth + padding * 2);
    const canvasHeight = Math.ceil(textHeight + padding * 2);

    // Set canvas size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas (transparent background)
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Reset font after canvas resize
    ctx.font = fontStyle;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';

    // Draw text lines
    lines.forEach((line, index) => {
      let x = padding;
      
      // Calculate x position based on alignment
      if (alignment === 'center') {
        const textWidth = ctx.measureText(line).width;
        x = (canvasWidth - textWidth) / 2;
      } else if (alignment === 'right') {
        const textWidth = ctx.measureText(line).width;
        x = canvasWidth - textWidth - padding;
      }

      const y = padding + index * lineHeight;
      ctx.fillText(line, x, y);
    });

    // Export as blob
    canvas.toBlob((blob) => {
      if (blob) {
        resolve({
          url: URL.createObjectURL(blob),
          ratio: {
            width: canvasWidth,
            height: canvasHeight,
          },
        });
      } else {
        resolve({ url: '', ratio: { width: canvasWidth, height: canvasHeight } });
      }
    });
  });
}

// Helper to resize/reformat images to specific dimensions
async function resizeImage(
  imageUrl: string,
  targetWidth: number,
  targetHeight: number,
  fitMode: 'cover' | 'contain' | 'fill' | 'none' = 'contain'
): Promise<{ url: string; ratio: ImageRatio }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ url: '', ratio: { width: targetWidth, height: targetHeight } });
        return;
      }

      // Set canvas to target dimensions
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Clear canvas (transparent background)
      ctx.clearRect(0, 0, targetWidth, targetHeight);

      let drawWidth: number;
      let drawHeight: number;
      let drawX: number;
      let drawY: number;

      if (fitMode === 'fill') {
        // Stretch to fill (may distort)
        drawWidth = targetWidth;
        drawHeight = targetHeight;
        drawX = 0;
        drawY = 0;
      } else if (fitMode === 'none') {
        // Use original size (may crop)
        drawWidth = img.width;
        drawHeight = img.height;
        drawX = 0;
        drawY = 0;
      } else {
        // Calculate scaling for contain or cover
        const scaleX = targetWidth / img.width;
        const scaleY = targetHeight / img.height;
        const scale = fitMode === 'cover' 
          ? Math.max(scaleX, scaleY)  // Cover: scale up to fill, may crop
          : Math.min(scaleX, scaleY); // Contain: scale down to fit, may letterbox

        drawWidth = img.width * scale;
        drawHeight = img.height * scale;
        drawX = (targetWidth - drawWidth) / 2;
        drawY = (targetHeight - drawHeight) / 2;
      }

      // Draw the image
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      // Export as blob
      canvas.toBlob((blob) => {
        if (blob) {
          resolve({
            url: URL.createObjectURL(blob),
            ratio: {
              width: targetWidth,
              height: targetHeight,
            },
          });
        } else {
          resolve({ url: '', ratio: { width: targetWidth, height: targetHeight } });
        }
      });
    };

    img.onerror = () => {
      resolve({ url: '', ratio: { width: targetWidth, height: targetHeight } });
    };
  });
}

export const useNodeProcessor = (id: string, data: any) => {
  const { updateNodeData } = useReactFlow();
  const [processedImage, setProcessedImage] = useState<string | null>(null);

  // 1. Find who is connected to our input handle (Position.Top)
  const connections = useHandleConnections({ type: 'target' });
  
  // 2. Get that parent node's data
  // We use the first connection (assuming single input for now)
  const nodeData = useNodesData(connections?.[0]?.source);


  useEffect(() => {
    const runPipeline = async () => {
      let resultUrl = null;
      let resultRatio: ImageRatio | null = null;

      // CASE A: We are a Source Node (File)
      // FILE nodes always output their previewUrl, regardless of connections
      if (data.effect.type === Effect.FILE) {
        const fileEffect = data.effect as { type: typeof Effect.FILE; fileName: string; previewUrl?: string };
        resultUrl = fileEffect.previewUrl || null;
        // Calculate ratio from the image if we have a preview URL
        if (resultUrl) {
          resultRatio = await getImageRatio(resultUrl);
        } else {
          resultRatio = null;
        }
      }
      
      // CASE B: We are a Text Node - render text on canvas
      else if (data.effect.type === Effect.TEXT) {
        const textData = data.effect;
        if (textData.text && textData.text.trim()) {
          const result = await renderText(
            textData.text,
            textData.fontSize || 16,
            textData.color || '#ffffff',
            textData.alignment || 'left',
            textData.fontWeight || 'normal',
            textData.padding || 0
          );
          resultUrl = result.url;
          resultRatio = result.ratio;
        } else {
          // Empty text - create a small placeholder
          resultUrl = null;
          resultRatio = null;
        }
      }
      
      // CASE C: We are a Null Node - just copy input to output
      else if (data.effect.type === Effect.NULL) {
        // Check if we have a valid connection and input
        if (connections && connections.length > 0 && nodeData && nodeData.data?.output) {
          // Simply pass through the input without any processing
          resultUrl = nodeData.data.output as string;
          // Type check the ratio to ensure it's a valid ImageRatio
          const parentRatio = nodeData.data.ratio;
          resultRatio = (parentRatio && typeof parentRatio === 'object' && 'width' in parentRatio && 'height' in parentRatio) 
            ? parentRatio as ImageRatio 
            : null;
        } else {
          // No input - clear output
          resultUrl = null;
          resultRatio = null;
        }
      }
      
      // CASE H: We are an Export Node - pass through like NULL but provides export functionality
      else if (data.effect.type === Effect.EXPORT) {
        // Check if we have a valid connection and input
        if (connections && connections.length > 0 && nodeData && nodeData.data?.output) {
          // Pass through the input without any processing (export is handled in the panel)
          resultUrl = nodeData.data.output as string;
          const parentRatio = nodeData.data.ratio;
          resultRatio = (parentRatio && typeof parentRatio === 'object' && 'width' in parentRatio && 'height' in parentRatio) 
            ? parentRatio as ImageRatio 
            : null;
        } else {
          // No input - clear output
          resultUrl = null;
          resultRatio = null;
        }
      }
      
      // CASE I: We are a Composition Node - resize/reformat to target dimensions
      else if (data.effect.type === Effect.COMPOSITION) {
        // Check if we have a valid connection and input
        if (connections && connections.length > 0 && nodeData && nodeData.data?.output) {
          const compositionData = data.effect;
          const targetWidth = compositionData.width || 1920;
          const targetHeight = compositionData.height || 1080;
          const fitMode = compositionData.fitMode || 'contain';
          
          const result = await resizeImage(
            nodeData.data.output as string,
            targetWidth,
            targetHeight,
            fitMode
          );
          resultUrl = result.url;
          resultRatio = result.ratio;
        } else {
          // No input - clear output
          resultUrl = null;
          resultRatio = null;
        }
      }
      
      // CASE E: We are an Effect Node (Blur, etc.)
      // We need a parent input to work - check if we have a valid connection
      else if (connections && connections.length > 0 && nodeData && nodeData.data?.output) {
        // Run the canvas processing using Parent's Output + Our Params
        const result = await processImage(
          nodeData.data.output as string, 
          data.effect.type, 
          data.effect
        );
        resultUrl = result.url;
        // Inherit ratio from parent node (effects preserve aspect ratio)
        const parentRatio = nodeData.data.ratio;
        resultRatio = (parentRatio && typeof parentRatio === 'object' && 'width' in parentRatio && 'height' in parentRatio)
          ? (parentRatio as ImageRatio)
          : result.ratio;
      }
      // CASE F: We are disconnected - clear the output
      else if (data.effect.type !== Effect.FILE && data.effect.type !== Effect.TEXT && data.effect.type !== Effect.EXPORT && data.effect.type !== Effect.COMPOSITION && (!connections || connections.length === 0)) {
        resultUrl = null;
        resultRatio = null;
      }

      // 3. Update State & Propagate
      // Update if the result changed (including clearing to null)
      // For FILE nodes, always ensure output is set even if it hasn't "changed"
      const isFileNode = data.effect.type === Effect.FILE;
      const outputChanged = resultUrl !== data.output;
      const ratioChanged = JSON.stringify(resultRatio) !== JSON.stringify(data.ratio);
      
      // For FILE nodes, always update to ensure output is set (handles reconnection case)
      // For other nodes, only update if changed
      if (isFileNode || outputChanged || ratioChanged) {
        setProcessedImage(resultUrl);
        
        // This is crucial: We write to 'data.output' and 'data.ratio' so the NEXT node can read it
        updateNodeData(id, { 
          output: resultUrl || undefined,
          ratio: resultRatio || undefined,
        });
      }
    };

    runPipeline();
    
    // Rerun whenever these things change:
  }, [
    data.effect,      // Our params changed (slider moved)
    nodeData?.data?.output, // Upstream node changed (new image loaded) - for single input nodes
    nodeData?.data?.ratio,  // Upstream node ratio changed - for single input nodes
    connections,      // Connections changed (node connected/disconnected)
  ]);

  return processedImage;
};