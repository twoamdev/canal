// components/panels/FilePanel.tsx
import { ImageUploader } from '../utils/ImageUploader'; 
import type { Node } from '@xyflow/react';
import type { BaseNodeData } from '../../types/node/baseNodeData';
import type { FileEffectData } from '../../types/effect/effectData'; 
import { Effect } from '../../enums/effect';

interface FilePanelProps {
  node: Node<BaseNodeData>;  
  updateNode: (id: string, data: Partial<BaseNodeData>) => void;
}

export const FilePanel = ({ node, updateNode }: FilePanelProps) => {
  const effectData = node.data.effect as FileEffectData;

  const handleFileChange = (file: File) => {
    // 1. Create the persistent URL here
    const objectUrl = URL.createObjectURL(file);

    // 2. Update the node with BOTH the name and the URL
    const newEffect: FileEffectData = {
      ...effectData, 
      fileName: file.name,
      previewUrl: objectUrl, // <--- Save the reference!
    };

    updateNode(node.id, {
      ...node.data, 
      effect: newEffect, 
    });
  };

  return (
    <div className="space-y-4 p-2">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-400 text-sm">File Input</h3>
        <span className="text-[10px] bg-blue-900 text-blue-200 px-1 rounded">
          {Effect.FILE}
        </span>
      </div>

      <ImageUploader 
        onFileSelect={handleFileChange}
        // 3. PASS IT BACK: This ensures the preview persists 
        // when you navigate between different nodes.
        initialPreview={effectData.previewUrl} 
      />

      <div className="text-xs text-gray-500 truncate">
        <span className="font-semibold">Current:</span> {effectData.fileName || "No file selected"}
      </div>
    </div>
  );
};