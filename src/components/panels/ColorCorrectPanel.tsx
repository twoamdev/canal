import type { ChangeEvent } from 'react';
import type { Node } from '@xyflow/react';
import type { BaseNodeData } from '../../types/node/baseNodeData';
import type { ColorCorrectEffectData } from '../../types/effect/effectData';
import { Effect } from '../../enums/effect';

interface ColorCorrectPanelProps {
  node: Node<BaseNodeData>;
  updateNode: (id: string, data: Partial<BaseNodeData>) => void;
}

export const ColorCorrectPanel = ({ node, updateNode }: ColorCorrectPanelProps) => {
  const effectData = node.data.effect as ColorCorrectEffectData;

  const updateEffect = (newEffectData: Partial<ColorCorrectEffectData>) => {
    updateNode(node.id, {
      effect: {
        ...effectData,
        ...newEffectData,
      },
    });
  };

  const handleBrightnessChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateEffect({ brightness: Number(e.target.value) });
  };

  const handleContrastChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateEffect({ contrast: Number(e.target.value) });
  };

  const handleSaturationChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateEffect({ saturation: Number(e.target.value) });
  };

  const handleExposureChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateEffect({ exposure: Number(e.target.value) });
  };

  const handleHueChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateEffect({ hue: Number(e.target.value) });
  };

  return (
    <div className="space-y-6 p-2 text-gray-300">
      <div className="flex items-center justify-between border-b border-[#444] pb-2">
        <h3 className="font-bold text-sm">Color Correct</h3>
        <span className="text-[10px] bg-green-900 text-green-200 px-2 py-0.5 rounded uppercase tracking-wider">
          {Effect.COLOR_CORRECT}
        </span>
      </div>

      {/* Brightness */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <label>Brightness</label>
          <span className="font-mono text-blue-400">{effectData.brightness || 0}</span>
        </div>
        <input
          type="range"
          min="-100"
          max="100"
          step="1"
          value={effectData.brightness || 0}
          onChange={handleBrightnessChange}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Contrast */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <label>Contrast</label>
          <span className="font-mono text-blue-400">{effectData.contrast || 0}</span>
        </div>
        <input
          type="range"
          min="-100"
          max="100"
          step="1"
          value={effectData.contrast || 0}
          onChange={handleContrastChange}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Saturation */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <label>Saturation</label>
          <span className="font-mono text-blue-400">{effectData.saturation || 0}</span>
        </div>
        <input
          type="range"
          min="-100"
          max="100"
          step="1"
          value={effectData.saturation || 0}
          onChange={handleSaturationChange}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Exposure */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <label>Exposure</label>
          <span className="font-mono text-blue-400">{(effectData.exposure || 0).toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="-2"
          max="2"
          step="0.01"
          value={effectData.exposure || 0}
          onChange={handleExposureChange}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Hue */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <label>Hue</label>
          <span className="font-mono text-blue-400">{effectData.hue || 0}°</span>
        </div>
        <input
          type="range"
          min="0"
          max="360"
          step="1"
          value={effectData.hue || 0}
          onChange={handleHueChange}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      <div className="pt-4 border-t border-[#333]">
        <div className="text-[10px] font-mono text-gray-600">
          Internal Data: {JSON.stringify(effectData)}
        </div>
      </div>
    </div>
  );
};

