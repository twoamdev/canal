import type { ChangeEvent } from 'react';
import type { Node } from '@xyflow/react';
import type { BaseNodeData } from '../../types/node/baseNodeData';
import type { CompositionEffectData } from '../../types/effect/effectData';
import { Effect } from '../../enums/effect';

interface CompositionPanelProps {
  node: Node<BaseNodeData>;
  updateNode: (id: string, data: Partial<BaseNodeData>) => void;
}

// Standard format presets
const STANDARD_FORMATS = [
  { label: '1920 x 1080 (Full HD)', width: 1920, height: 1080 },
  { label: '1080 x 1920 (Portrait Full HD)', width: 1080, height: 1920 },
  { label: '3840 x 2160 (4K UHD)', width: 3840, height: 2160 },
  { label: '2160 x 3840 (Portrait 4K)', width: 2160, height: 3840 },
  { label: '1280 x 720 (HD)', width: 1280, height: 720 },
  { label: '720 x 1280 (Portrait HD)', width: 720, height: 1280 },
  { label: '2560 x 1440 (QHD)', width: 2560, height: 1440 },
  { label: '1440 x 2560 (Portrait QHD)', width: 1440, height: 2560 },
  { label: '1920 x 1080 (Square-ish)', width: 1920, height: 1920 },
  { label: '1080 x 1080 (Square)', width: 1080, height: 1080 },
];

export const CompositionPanel = ({ node, updateNode }: CompositionPanelProps) => {
  const effectData = node.data.effect as CompositionEffectData;

  const updateEffect = (newEffectData: Partial<CompositionEffectData>) => {
    updateNode(node.id, {
      effect: {
        ...effectData,
        ...newEffectData,
      },
    });
  };

  const handleFormatSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedFormat = STANDARD_FORMATS.find(f => 
      `${f.width}x${f.height}` === e.target.value
    );
    if (selectedFormat) {
      updateEffect({ 
        width: selectedFormat.width, 
        height: selectedFormat.height 
      });
    } else if (e.target.value === 'custom') {
      // Keep current values, just switch to custom mode
    }
  };

  const handleWidthChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateEffect({ width: Number(e.target.value) });
  };

  const handleHeightChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateEffect({ height: Number(e.target.value) });
  };

  const handleFitModeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateEffect({ fitMode: e.target.value as 'cover' | 'contain' | 'fill' | 'none' });
  };

  // Check if current dimensions match a preset
  const currentPreset = STANDARD_FORMATS.find(
    f => f.width === effectData.width && f.height === effectData.height
  );
  const selectedValue = currentPreset 
    ? `${currentPreset.width}x${currentPreset.height}` 
    : 'custom';

  return (
    <div className="space-y-6 p-2 text-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#444] pb-2">
        <h3 className="font-bold text-sm">Composition</h3>
        <span className="text-[10px] bg-purple-900 text-purple-200 px-2 py-0.5 rounded uppercase tracking-wider">
          {Effect.COMPOSITION}
        </span>
      </div>

      {/* Standard Format Presets */}
      <div className="space-y-2">
        <label className="text-xs block">Standard Format</label>
        <select
          value={selectedValue}
          onChange={handleFormatSelect}
          className="w-full bg-[#1a1a1a] border border-[#444] text-xs rounded p-2 focus:border-blue-500 outline-none"
        >
          <option value="custom">Custom Dimensions</option>
          {STANDARD_FORMATS.map((format) => (
            <option key={`${format.width}x${format.height}`} value={`${format.width}x${format.height}`}>
              {format.label}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-gray-500">
          Select a standard format or use custom dimensions below.
        </p>
      </div>

      {/* Custom Dimensions */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <label>Width</label>
            <span className="font-mono text-blue-400">{effectData.width}px</span>
          </div>
          <input
            type="range"
            min="1"
            max="7680"
            step="1"
            value={effectData.width}
            onChange={handleWidthChange}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <input
            type="number"
            min="1"
            max="7680"
            value={effectData.width}
            onChange={handleWidthChange}
            className="w-full bg-[#1a1a1a] border border-[#444] text-xs rounded p-2 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <label>Height</label>
            <span className="font-mono text-blue-400">{effectData.height}px</span>
          </div>
          <input
            type="range"
            min="1"
            max="7680"
            step="1"
            value={effectData.height}
            onChange={handleHeightChange}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <input
            type="number"
            min="1"
            max="7680"
            value={effectData.height}
            onChange={handleHeightChange}
            className="w-full bg-[#1a1a1a] border border-[#444] text-xs rounded p-2 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Fit Mode */}
      <div className="space-y-2">
        <label className="text-xs block">Fit Mode</label>
        <select
          value={effectData.fitMode || 'contain'}
          onChange={handleFitModeChange}
          className="w-full bg-[#1a1a1a] border border-[#444] text-xs rounded p-2 focus:border-blue-500 outline-none"
        >
          <option value="contain">Contain (fit entire image, may have letterboxing)</option>
          <option value="cover">Cover (fill canvas, may crop image)</option>
          <option value="fill">Fill (stretch to fit, may distort)</option>
          <option value="none">None (use original size, may crop)</option>
        </select>
        <p className="text-[10px] text-gray-500">
          How the input image should be fitted into the new dimensions.
        </p>
      </div>

      {/* Visual Debug (Optional) */}
      <div className="pt-4 border-t border-[#333]">
        <div className="text-[10px] font-mono text-gray-600">
          Internal Data: {JSON.stringify(effectData)}
        </div>
      </div>
    </div>
  );
};

