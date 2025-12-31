import type { ChangeEvent } from 'react';
import type { Node } from '@xyflow/react';
import type { BaseNodeData } from '../../types/node/baseNodeData';
import type { ExportEffectData } from '../../types/effect/effectData';
import { Effect } from '../../enums/effect';

interface ExportPanelProps {
  node: Node<BaseNodeData>;
  updateNode: (id: string, data: Partial<BaseNodeData>) => void;
}

export const ExportPanel = ({ node, updateNode }: ExportPanelProps) => {
  const effectData = node.data.effect as ExportEffectData;

  const updateEffect = (newEffectData: Partial<ExportEffectData>) => {
    updateNode(node.id, {
      effect: {
        ...effectData,
        ...newEffectData,
      },
    });
  };

  const handleFormatChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateEffect({ format: e.target.value as 'png' | 'jpeg' | 'webp' });
  };

  const handleQualityChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateEffect({ quality: Number(e.target.value) });
  };

  const handleFileNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateEffect({ fileName: e.target.value });
  };

  const handleExport = async () => {
    if (!node.data.output) {
      alert('No image to export. Connect an input to this node.');
      return;
    }

    try {
      // Load the image
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = node.data.output as string;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        alert('Failed to create canvas context');
        return;
      }

      // Draw image to canvas
      ctx.drawImage(img, 0, 0);

      // Convert to blob based on format
      const format = effectData.format || 'png';
      const quality = effectData.format === 'png' ? undefined : (effectData.quality || 0.92);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            alert('Failed to export image');
            return;
          }

          // Create download link
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          
          // Generate filename
          const fileName = effectData.fileName || `export-${Date.now()}`;
          const extension = format === 'jpeg' ? 'jpg' : format;
          link.download = `${fileName}.${extension}`;
          
          // Trigger download
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up
          setTimeout(() => URL.revokeObjectURL(url), 100);
        },
        `image/${format}`,
        quality
      );
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export image. Please try again.');
    }
  };

  return (
    <div className="space-y-6 p-2 text-gray-300">
      <div className="flex items-center justify-between border-b border-[#444] pb-2">
        <h3 className="font-bold text-sm">Export</h3>
        <span className="text-[10px] bg-orange-900 text-orange-200 px-2 py-0.5 rounded uppercase tracking-wider">
          {Effect.EXPORT}
        </span>
      </div>

      {/* Format Selection */}
      <div className="space-y-2">
        <label className="text-xs block">Format</label>
        <select
          value={effectData.format || 'png'}
          onChange={handleFormatChange}
          className="w-full bg-[#1a1a1a] border border-[#444] text-xs rounded p-2 focus:border-blue-500 outline-none"
        >
          <option value="png">PNG (Lossless)</option>
          <option value="jpeg">JPEG (Compressed)</option>
          <option value="webp">WebP (Modern)</option>
        </select>
      </div>

      {/* Quality (for JPEG/WebP) */}
      {(effectData.format === 'jpeg' || effectData.format === 'webp') && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <label>Quality</label>
            <span className="font-mono text-blue-400">{((effectData.quality || 0.92) * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.01"
            value={effectData.quality || 0.92}
            onChange={handleQualityChange}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      )}

      {/* File Name */}
      <div className="space-y-2">
        <label className="text-xs block">File Name</label>
        <input
          type="text"
          value={effectData.fileName || ''}
          onChange={handleFileNameChange}
          placeholder="export (optional)"
          className="w-full bg-[#1a1a1a] border border-[#444] text-xs rounded p-2 focus:border-blue-500 outline-none"
        />
        <p className="text-[10px] text-gray-500">
          Leave empty to use default: export-timestamp
        </p>
      </div>

      {/* Export Button */}
      <div className="pt-4 border-t border-[#333]">
        <button
          onClick={handleExport}
          disabled={!node.data.output}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 px-4 rounded transition-colors"
        >
          {node.data.output ? 'Export Image' : 'No Image to Export'}
        </button>
        {!node.data.output && (
          <p className="text-[10px] text-gray-500 mt-2 text-center">
            Connect an input to export
          </p>
        )}
      </div>

      <div className="pt-4 border-t border-[#333]">
        <div className="text-[10px] font-mono text-gray-600">
          Internal Data: {JSON.stringify(effectData)}
        </div>
      </div>
    </div>
  );
};

