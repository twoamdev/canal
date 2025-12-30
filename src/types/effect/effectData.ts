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

export type EffectData = FileEffectData | BlurEffectData;