import type { EffectData } from "../effect/effectData";

export interface ImageRatio {
  width: number;
  height: number;
}

export interface BaseNodeData {
  label: string;
  effect: EffectData;
  hasSource?: boolean;
  hasTarget?: boolean;
  output?: string;
  ratio?: ImageRatio;

  [key: string]: unknown;
}
