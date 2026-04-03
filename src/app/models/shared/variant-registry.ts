import { GameVariant, VariantInfo } from './game-state.models';

export const VARIANT_INFO: Record<GameVariant, VariantInfo> = {
  classic: {
    name: 'Classic Nim',
    description: 'Remove objects from a single stack per turn. Optional subtraction rule limits the max you can take.',
    implemented: true,
  },
  greedy: {
    name: 'Greedy Nim',
    description: 'Take from the largest pile, but you can only take up to half.',
    implemented: false,
  },
};
