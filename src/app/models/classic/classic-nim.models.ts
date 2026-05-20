import { GameConfigBase } from '../shared/game-state.models';

export interface ClassicNimConfig extends GameConfigBase {
  variant: 'classic';
  subtraction: boolean;
  maxTake: number;
  cheatMode: boolean;
}

export const CLASSIC_NIM_DEFAULTS: ClassicNimConfig = {
  variant: 'classic',
  stackCount: 3,
  stackSizes: [3, 5, 7],
  opponent: 'computer',
  difficulty: 'random',
  endCondition: 'last-loses',
  subtraction: false,
  maxTake: 3,
  cheatMode: false,
};
