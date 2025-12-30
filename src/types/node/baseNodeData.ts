import type { EffectData } from "../effect/effectData";

export interface BaseNodeData {
  label: string;
  effect: EffectData;
  hasSource?: boolean;
  hasTarget?: boolean;

  [key: string]: unknown;
}
