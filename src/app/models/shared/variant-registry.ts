import { GameVariant, VariantInfo } from './game-state.models';

export const VARIANT_INFO: Record<GameVariant, VariantInfo> = {
  "classic": {
    name: 'Classic Nim',
    description: 'Remove objects from a single stack per turn. Optional subtraction rule limits the max you can take.',
    implemented: true,
  },
  "draft-subtraction": {
    name: 'Draft Subtraction',
    description: 'Draft a shared subtraction set, then play a subtraction game on a single heap.',
    implemented: true,
  },
};
