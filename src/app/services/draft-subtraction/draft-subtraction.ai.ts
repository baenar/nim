import { DraftState, DraftSubtractionConfig } from '../../models/draft-subtraction/draft-subtraction.models';
import { EndCondition } from '../../models/shared/game-state.models';

interface SubtractionPattern {
  prePeriod: boolean[];
  period: boolean[];
}

export interface DraftPickAnalysis {
  winning: number[];
  losing: number[];
}

export interface SpragueGrundySequence {
  values: number[];
  windowSize: number;
}

interface GrundyCacheState {
  values: number[];
  windows: Map<string, number>;
  windowSize: number;
  repeatEnd: number | null;
}

export class DraftSubtractionAi {
  private readonly draftCache = new Map<string, boolean>();
  private readonly subtractionCache = new Map<string, SubtractionPattern>();
  private readonly grundyCache = new Map<string, GrundyCacheState>();

  constructor(private readonly config: DraftSubtractionConfig) {}

  pickDraftNumber(draft: DraftState): number {
    if (this.config.difficulty === 'random') {
      return this.randomPick(draft.pool);
    }

    for (const value of draft.pool) {
      const nextSet = this.insertSorted(draft.subtractionSet, value);
      if (!this.isWinningDraftState(nextSet)) {
        return value;
      }
    }

    return this.randomPick(draft.pool);
  }

  getDraftPickAnalysis(draft: DraftState): DraftPickAnalysis {
    const winning: number[] = [];
    const losing: number[] = [];

    for (const value of draft.pool) {
      if (this.isDraftPickWinningForCurrent(draft.subtractionSet, value)) {
        winning.push(value);
      } else {
        losing.push(value);
      }
    }

    return { winning, losing };
  }

  /**
   * Evaluate a single draft pick. Returns true if picking `value` from the
   * current `selectedSet` leaves the opponent in a losing draft state
   * (i.e. the pick is winning for the current drafter).
   */
  isDraftPickWinningForCurrent(selectedSet: number[], value: number): boolean {
    const nextSet = this.insertSorted(selectedSet, value);
    return !this.isWinningDraftState(nextSet);
  }

  pickSubtractionAmount(heapSize: number, subtractionSet: number[]): number {
    const validMoves = subtractionSet.filter(v => v <= heapSize);
    if (validMoves.length === 0) return 1;

    if (this.config.difficulty === 'random') {
      return this.randomPick(validMoves);
    }

    for (const move of validMoves) {
      if (!this.isWinningSubtraction(heapSize - move, subtractionSet)) {
        return move;
      }
    }

    return this.randomPick(validMoves);
  }

  getSpragueGrundySequence(subtractionSet: number[], maxState: number): SpragueGrundySequence {
    const sortedSet = [...subtractionSet].sort((a, b) => a - b);
    const key = `${this.config.endCondition}|${sortedSet.join(',')}`;
    const maxMove = sortedSet[sortedSet.length - 1];
    const target = Math.max(0, maxState);

    let cache = this.grundyCache.get(key);
    if (!cache) {
      cache = {
        values: [],
        windows: new Map<string, number>(),
        windowSize: maxMove,
        repeatEnd: null,
      };
      this.grundyCache.set(key, cache);
    }

    for (let n = cache.values.length; n <= target; n++) {
      cache.values[n] = this.computeGrundy(n, sortedSet, cache.values);

      if (cache.repeatEnd === null && n >= maxMove - 1) {
        const windowStart = n - maxMove + 1;
        const windowKey = cache.values.slice(windowStart, windowStart + maxMove).join(',');
        const previousStart = cache.windows.get(windowKey);
        if (previousStart !== undefined) {
          cache.repeatEnd = windowStart + maxMove;
        } else {
          cache.windows.set(windowKey, windowStart);
        }
      }

      if (cache.repeatEnd !== null && n >= cache.repeatEnd - 1) {
        break;
      }
    }

    const endExclusive = cache.repeatEnd !== null && cache.repeatEnd - 1 <= target
      ? cache.repeatEnd
      : target + 1;

    return {
      values: cache.values.slice(0, endExclusive),
      windowSize: maxMove,
    };
  }

  private isWinningDraftState(selectedSet: number[]): boolean {
    const key = selectedSet.join(',');
    const cached = this.draftCache.get(key);
    if (cached !== undefined) return cached;

    if (selectedSet.length === this.config.k) {
      const result = this.isWinningSubtraction(this.config.n, selectedSet);
      this.draftCache.set(key, result);
      return result;
    }

    const available = this.getAvailableNumbers(selectedSet);
    for (const value of available) {
      const nextSet = this.insertSorted(selectedSet, value);
      if (!this.isWinningDraftState(nextSet)) {
        this.draftCache.set(key, true);
        return true;
      }
    }

    this.draftCache.set(key, false);
    return false;
  }

  private getAvailableNumbers(selectedSet: number[]): number[] {
    const selected = new Set(selectedSet);
    const options: number[] = [];
    for (let value = 1; value <= this.config.poolSize; value++) {
      if (!selected.has(value)) {
        options.push(value);
      }
    }
    return options;
  }

  private isWinningSubtraction(heapSize: number, subtractionSet: number[]): boolean {
    const pattern = this.getSubtractionPattern(subtractionSet);
    if (heapSize < pattern.prePeriod.length) {
      return pattern.prePeriod[heapSize];
    }
    const index = (heapSize - pattern.prePeriod.length) % pattern.period.length;
    return pattern.period[index];
  }

  private getSubtractionPattern(subtractionSet: number[]): SubtractionPattern {
    const sortedSet = [...subtractionSet].sort((a, b) => a - b);
    const key = `${this.config.endCondition}|${sortedSet.join(',')}`;
    const cached = this.subtractionCache.get(key);
    if (cached) return cached;

    const maxMove = sortedSet[sortedSet.length - 1];
    const values: boolean[] = [];
    const windows = new Map<string, number>();

    for (let n = 0; n < Number.MAX_SAFE_INTEGER; n++) {
      values[n] = this.computeSubtractionOutcome(n, sortedSet, values, this.config.endCondition);

      if (n >= maxMove - 1) {
        const windowStart = n - maxMove + 1;
        const windowKey = values
          .slice(windowStart, windowStart + maxMove)
          .map(v => (v ? '1' : '0'))
          .join('');

        const previousStart = windows.get(windowKey);
        if (previousStart !== undefined) {
          const prePeriod = values.slice(0, previousStart);
          const period = values.slice(previousStart, windowStart);
          const pattern = { prePeriod, period };
          this.subtractionCache.set(key, pattern);
          return pattern;
        }

        windows.set(windowKey, windowStart);
      }
    }

    const fallback: SubtractionPattern = { prePeriod: values, period: [false] };
    this.subtractionCache.set(key, fallback);
    return fallback;
  }

  private computeSubtractionOutcome(
    heapSize: number,
    subtractionSet: number[],
    values: boolean[],
    endCondition: EndCondition,
  ): boolean {
    const moves = subtractionSet.filter(v => v <= heapSize);
    if (moves.length === 0) {
      return endCondition === 'last-loses';
    }

    for (const move of moves) {
      if (!values[heapSize - move]) {
        return true;
      }
    }
    return false;
  }

  private computeGrundy(
    heapSize: number,
    subtractionSet: number[],
    values: number[],
  ): number {
    const reachable = new Set<number>();
    for (const move of subtractionSet) {
      if (move > heapSize) break;
      reachable.add(values[heapSize - move]);
    }

    let mex = 0;
    while (reachable.has(mex)) {
      mex += 1;
    }
    return mex;
  }

  private insertSorted(source: number[], value: number): number[] {
    const result = [...source];
    const index = result.findIndex(v => v > value);
    if (index === -1) {
      result.push(value);
    } else {
      result.splice(index, 0, value);
    }
    return result;
  }

  private randomPick(options: number[]): number {
    return options[Math.floor(Math.random() * options.length)];
  }
}
