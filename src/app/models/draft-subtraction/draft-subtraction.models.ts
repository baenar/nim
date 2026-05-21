import { GameConfigBase } from '../shared/game-state.models';

export type DraftVariantType = 'impartial' | 'partisan';

export interface DraftSubtractionConfig extends GameConfigBase {
  variant: 'draft-subtraction';
  n: number;
  k: number;
  poolSize: number;
  draftType: DraftVariantType;
  cheatMode: boolean;
}

export interface DraftState {
  /** Numbers still available to pick */
  pool: number[];
  /** Shared subtraction set (impartial) */
  subtractionSet: number[];
  /** How many picks remain before draft ends */
  picksRemaining: number;
  /** Who is currently drafting */
  currentDrafter: 1 | 2;
  /** Whether the draft phase is complete */
  isComplete: boolean;
}

export const DRAFT_SUBTRACTION_DEFAULTS: DraftSubtractionConfig = {
  variant: 'draft-subtraction',
  stackCount: 1,
  stackSizes: [40],
  opponent: 'human',
  difficulty: 'expert',
  endCondition: 'last-wins',
  n: 40,
  k: 3,
  poolSize: 15,
  draftType: 'impartial',
  cheatMode: false,
};
