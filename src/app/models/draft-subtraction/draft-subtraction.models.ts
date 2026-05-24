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
  /** Player 1 subtraction set (partisan) */
  subtractionSetP1: number[];
  /** Player 2 subtraction set (partisan) */
  subtractionSetP2: number[];
  /** How many picks remain before draft ends */
  picksRemaining: number;
  /** Draft is complete but still visible before switching phases */
  isLocked: boolean;
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
