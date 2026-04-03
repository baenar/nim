import { GameState } from '../../models/shared/game-state.models';
import { ClassicNimConfig } from '../../models/classic/classic-nim.models';

export interface AiMove {
  stackIndex: number;
  amount: number;
}

export function getClassicNimRandomMove(state: GameState, config: ClassicNimConfig): AiMove {
  const nonEmpty = state.stacks
    .map((size, i) => ({ size, i }))
    .filter(s => s.size > 0);
  const chosen = nonEmpty[Math.floor(Math.random() * nonEmpty.length)];
  const maxTake = config.subtraction
    ? Math.min(config.maxTake, chosen.size)
    : chosen.size;
  const amount = Math.floor(Math.random() * maxTake) + 1;
  return { stackIndex: chosen.i, amount };
}

export function getClassicNimExpertMove(state: GameState, config: ClassicNimConfig): AiMove {
  if (config.subtraction) {
    return getSubtractionExpertMove(state, config);
  }
  return getStandardNimExpertMove(state, config);
}

function getStandardNimExpertMove(state: GameState, config: ClassicNimConfig): AiMove {
  const nimSum = state.stacks.reduce((a, b) => a ^ b, 0);

  if (config.endCondition === 'last-loses') {
    const nonZeroStacks = state.stacks.filter(s => s > 0);
    const allOnes = nonZeroStacks.every(s => s === 1);

    if (allOnes) {
      const nonZeroCount = nonZeroStacks.length;
      if (nonZeroCount % 2 === 0) {
        return getClassicNimRandomMove(state, config);
      }
      for (let i = 0; i < state.stacks.length; i++) {
        if (state.stacks[i] > 0) {
          return { stackIndex: i, amount: 1 };
        }
      }
    }
  }

  if (nimSum === 0) {
    return getClassicNimRandomMove(state, config);
  }

  for (let i = 0; i < state.stacks.length; i++) {
    const target = state.stacks[i] ^ nimSum;
    if (target < state.stacks[i]) {
      const amount = state.stacks[i] - target;

      if (config.endCondition === 'last-loses') {
        const newStacks = [...state.stacks];
        newStacks[i] -= amount;
        const nonZeroAfter = newStacks.filter(s => s > 0);
        if (nonZeroAfter.length > 0 && nonZeroAfter.every(s => s === 1)) {
          if (nonZeroAfter.length % 2 === 1) {
            return { stackIndex: i, amount };
          }
          continue;
        }
      }

      return { stackIndex: i, amount };
    }
  }

  return getClassicNimRandomMove(state, config);
}

function getSubtractionExpertMove(state: GameState, config: ClassicNimConfig): AiMove {
  const k = config.maxTake;
  const period = k + 1;

  const nimValues = state.stacks.map(s => s % period);
  const nimSum = nimValues.reduce((a, b) => a ^ b, 0);

  if (config.endCondition === 'last-loses') {
    const nonZeroStacks = state.stacks.filter(s => s > 0);
    const allOnesOrEmpty = nonZeroStacks.every(s => s % period <= 1);

    if (allOnesOrEmpty) {
      const nonZeroCount = nonZeroStacks.length;
      if (nonZeroCount % 2 === 0) {
        return getClassicNimRandomMove(state, config);
      }
      for (let i = 0; i < state.stacks.length; i++) {
        if (state.stacks[i] > 0) {
          const take = Math.min(state.stacks[i], k);
          return { stackIndex: i, amount: take };
        }
      }
    }
  }

  if (nimSum === 0) {
    return getClassicNimRandomMove(state, config);
  }

  for (let i = 0; i < state.stacks.length; i++) {
    for (let take = 1; take <= Math.min(k, state.stacks[i]); take++) {
      const newSize = state.stacks[i] - take;
      const newNimVal = newSize % period;
      const newNimSum = nimSum ^ nimValues[i] ^ newNimVal;
      if (newNimSum === 0) {
        return { stackIndex: i, amount: take };
      }
    }
  }

  return getClassicNimRandomMove(state, config);
}
