import { useState, useEffect, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
  initialPreview?: string; // <--- 1. Added this prop
}

export const ImageUploader = ({ onFileSelect, initialPreview }: ImageUploaderProps) => {
  // 2. Initialize state with the prop (so it shows the saved image)
  const [preview, setPreview] = useState<string | null>(initialPreview || null);
  
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3. Sync: If the user switches nodes, update the preview to match the new prop
  useEffect(() => {
    setPreview(initialPreview || null);
  }, [initialPreview]);

  // 4. Cleanup: Only revoke URLs that WE created locally, not the one passed from the parent
  useEffect(() => {
    return () => {
      if (preview && preview !== initialPreview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview, initialPreview]);

  const handleFile = (file: File) => {
    // strict check: is it an image?
    if (!file.type.startsWith('image/')) {
      alert("Please upload an image file (PNG or JPEG)");
      return;
    }

    onFileSelect(file);

    // Create a local immediate preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  };

  // --- Drag Event Handlers ---
  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  // --- Click Handler ---
  const onFileSelectChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div 
      className={`
        text-center cursor-pointer transition-colors h-full flex flex-col justify-center
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}
      `}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef}
        accept="image/png, image/jpeg"
        onChange={onFileSelectChange}
      />

      {preview ? (
        // Preview State
        <div className="relative group p-2">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full max-h-48 object-contain mx-auto rounded"
          />
          {/* Optional Overlay to indicate it's clickable */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded">
             <span className="text-white text-xs font-bold">Replace Image</span>
          </div>
        </div>
      ) : (
        // Empty State
        <div className="flex flex-col items-center justify-center space-y-3 py-8">
          <div className="text-4xl text-gray-400">📂</div>
          <div className="text-gray-600 text-sm">
            <span className="font-semibold text-blue-600">Click to upload</span>
          </div>
          <p className="text-[10px] text-gray-400">PNG or JPG</p>
        </div>
      )}
    </div>
  );
};