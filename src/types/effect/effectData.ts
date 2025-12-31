import {Effect} from "./../../enums/effect";

export interface FileEffectData {
  type: typeof Effect.FILE;
  fileName: string;
  previewUrl?: string;
}

export interface BlurEffectData {
  type: typeof Effect.BLUR; 
  blurAmount: number;
  quality?: 'low' | 'high';
}

export interface NullEffectData {
  type: typeof Effect.NULL;
}

export interface TextEffectData {
  type: typeof Effect.TEXT;
  text: string;
  fontSize: number;
  color: string;
  alignment: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'bold';
  padding?: number;
}

export interface MergeEffectData {
  type: typeof Effect.MERGE;
  inputCount: number; // Number of input handles (minimum 2)
}

export interface TransformEffectData {
  type: typeof Effect.TRANSFORM;
  scale: number; // Scale factor (0-2 or similar, 1 = 100%)
  rotation: number; // Rotation in degrees (0-360)
  translateX: number; // Translation X in pixels
  translateY: number; // Translation Y in pixels
}

export interface OpacityEffectData {
  type: typeof Effect.OPACITY;
  opacity: number; // Opacity 0-1 (0 = transparent, 1 = opaque)
}

export interface ColorCorrectEffectData {
  type: typeof Effect.COLOR_CORRECT;
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  exposure: number; // -2 to 2
  hue: number; // 0 to 360 degrees
}

export interface ExportEffectData {
  type: typeof Effect.EXPORT;
  format: 'png' | 'jpeg' | 'webp';
  quality: number; // 0-1 for JPEG/WebP
  fileName?: string;
}

export type EffectData = FileEffectData | BlurEffectData | NullEffectData | TextEffectData | MergeEffectData | TransformEffectData | OpacityEffectData | ColorCorrectEffectData | ExportEffectData;