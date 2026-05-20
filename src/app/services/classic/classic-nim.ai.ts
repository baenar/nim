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
    return getMisereNimMove(state, config, nimSum);
  }

  // Normal play (last-takes-wins): aim for nim-sum = 0
  if (nimSum === 0) {
    return getClassicNimRandomMove(state, config);
  }

  for (let i = 0; i < state.stacks.length; i++) {
    const target = state.stacks[i] ^ nimSum;
    if (target < state.stacks[i]) {
      return { stackIndex: i, amount: state.stacks[i] - target };
    }
  }

  return getClassicNimRandomMove(state, config);
}

/**
 * Misère Nim (last takes loses) expert strategy.
 *
 * A position is losing (P-position) in misère Nim when:
 *   - nim-sum = 0 AND at least one heap > 1, OR
 *   - all heaps ≤ 1 AND an odd number of 1-heaps.
 *
 * Strategy: play like normal Nim (make nim-sum 0) UNLESS the
 * result would be all-ones — in that case leave an ODD number
 * of 1-heaps so the opponent is forced to take the last one.
 */
function getMisereNimMove(state: GameState, config: ClassicNimConfig, nimSum: number): AiMove {
  const nonZeroStacks = state.stacks.filter(s => s > 0);
  const allOnes = nonZeroStacks.every(s => s === 1);

  // Endgame: every remaining heap is 0 or 1
  if (allOnes) {
    if (nonZeroStacks.length % 2 === 0) {
      // Even 1-heaps → winning: take one to leave odd for opponent
      for (let i = 0; i < state.stacks.length; i++) {
        if (state.stacks[i] > 0) {
          return { stackIndex: i, amount: 1 };
        }
      }
    }
    // Odd 1-heaps → losing position, play randomly
    return getClassicNimRandomMove(state, config);
  }

  // Mid-game: at least one heap > 1.
  // Try nim-sum-zeroing moves, but reject any that leave all-ones with even count.
  if (nimSum !== 0) {
    for (let i = 0; i < state.stacks.length; i++) {
      const target = state.stacks[i] ^ nimSum;
      if (target < state.stacks[i]) {
        if (isSafeMisereMove(state.stacks, i, state.stacks[i] - target)) {
          return { stackIndex: i, amount: state.stacks[i] - target };
        }
      }
    }
  }

  // Fallback: search for any move that leaves all-ones with odd count.
  // This covers cases where the standard nim-sum move would leave bad parity.
  for (let i = 0; i < state.stacks.length; i++) {
    if (state.stacks[i] <= 1) continue;
    // Try reducing this heap to 0 or 1
    for (const target of [0, 1]) {
      const amount = state.stacks[i] - target;
      if (amount > 0 && isSafeMisereMove(state.stacks, i, amount)) {
        return { stackIndex: i, amount };
      }
    }
  }

  // Truly losing position
  return getClassicNimRandomMove(state, config);
}

/**
 * Check whether a move is "safe" in misère play.
 * A move is safe if the resulting position is a P-position (losing for opponent):
 *   - nim-sum = 0 with at least one heap > 1, OR
 *   - all heaps ≤ 1 with an odd number of 1-heaps.
 */
function isSafeMisereMove(stacks: number[], stackIndex: number, amount: number): boolean {
  const newStacks = [...stacks];
  newStacks[stackIndex] -= amount;

  const nonZero = newStacks.filter(s => s > 0);
  const allOnes = nonZero.every(s => s === 1);

  if (allOnes) {
    // Opponent faces all-ones: odd count = losing for them = good
    return nonZero.length % 2 === 1;
  }

  // At least one heap > 1: standard nim-sum check
  const newNimSum = newStacks.reduce((a, b) => a ^ b, 0);
  return newNimSum === 0;
}

function getSubtractionExpertMove(state: GameState, config: ClassicNimConfig): AiMove {
  const k = config.maxTake;
  const period = k + 1;

  const nimValues = state.stacks.map(s => s % period);
  const nimSum = nimValues.reduce((a, b) => a ^ b, 0);

  if (config.endCondition === 'last-loses') {
    return getMisereSubtractionMove(state, config, k, period, nimValues, nimSum);
  }

  // Normal play: aim for nim-value-sum = 0
  if (nimSum === 0) {
    return getClassicNimRandomMove(state, config);
  }

  for (let i = 0; i < state.stacks.length; i++) {
    for (let take = 1; take <= Math.min(k, state.stacks[i]); take++) {
      const newNimVal = (state.stacks[i] - take) % period;
      const newNimSum = nimSum ^ nimValues[i] ^ newNimVal;
      if (newNimSum === 0) {
        return { stackIndex: i, amount: take };
      }
    }
  }

  return getClassicNimRandomMove(state, config);
}

function getMisereSubtractionMove(
  state: GameState,
  config: ClassicNimConfig,
  k: number,
  period: number,
  nimValues: number[],
  nimSum: number,
): AiMove {
  const nonZeroStacks = state.stacks.filter(s => s > 0);
  // In subtraction game, a heap is "trivial" if its nim-value is 0 or 1
  const allTrivial = nonZeroStacks.every(s => s % period <= 1);

  // Endgame: all heaps have nim-value 0 or 1
  if (allTrivial) {
    // Count heaps with nim-value = 1 (the only ones that matter)
    const activeCount = nonZeroStacks.filter(s => s % period === 1).length;
    if (activeCount % 2 === 0) {
      // Even active heaps → winning: reduce one to make it odd for opponent
      for (let i = 0; i < state.stacks.length; i++) {
        if (state.stacks[i] > 0 && state.stacks[i] % period === 1) {
          const take = Math.min(state.stacks[i], k);
          return { stackIndex: i, amount: take };
        }
      }
    }
    // Odd → losing, play randomly
    return getClassicNimRandomMove(state, config);
  }

  // Mid-game: try nim-sum-zeroing moves, reject unsafe ones
  if (nimSum !== 0) {
    for (let i = 0; i < state.stacks.length; i++) {
      for (let take = 1; take <= Math.min(k, state.stacks[i]); take++) {
        const newSize = state.stacks[i] - take;
        const newNimVal = newSize % period;
        const newNimSum = nimSum ^ nimValues[i] ^ newNimVal;
        if (newNimSum === 0) {
          if (isSafeSubtractionMisereMove(state.stacks, i, take, period)) {
            return { stackIndex: i, amount: take };
          }
        }
      }
    }
  }

  // Fallback: search for any move leaving all-trivial with odd active count
  for (let i = 0; i < state.stacks.length; i++) {
    if (state.stacks[i] <= 0) continue;
    for (let take = 1; take <= Math.min(k, state.stacks[i]); take++) {
      if (isSafeSubtractionMisereMove(state.stacks, i, take, period)) {
        return { stackIndex: i, amount: take };
      }
    }
  }

  return getClassicNimRandomMove(state, config);
}

function isSafeSubtractionMisereMove(
  stacks: number[],
  stackIndex: number,
  amount: number,
  period: number,
): boolean {
  const newStacks = [...stacks];
  newStacks[stackIndex] -= amount;

  const nonZero = newStacks.filter(s => s > 0);
  const allTrivial = nonZero.every(s => s % period <= 1);

  if (allTrivial) {
    const activeCount = nonZero.filter(s => s % period === 1).length;
    return activeCount % 2 === 1;
  }

  const newNimSum = newStacks.map(s => s % period).reduce((a, b) => a ^ b, 0);
  return newNimSum === 0;
}
