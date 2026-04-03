import { GameConfigBase } from '../shared/game-state.models';

export interface GreedyNimConfig extends GameConfigBase {
  variant: 'greedy';
}

export const GREEDY_NIM_DEFAULTS: GreedyNimConfig = {
  variant: 'greedy',
  stackCount: 1,
  stackSizes: [10],
  opponent: 'computer',
  difficulty: 'random',
  endCondition: 'last-loses',
};
