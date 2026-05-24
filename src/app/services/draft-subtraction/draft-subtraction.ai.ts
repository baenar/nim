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

/**
 * Partisan subtraction game has two parallel boolean arrays:
 *  - p1Win[n] = true iff P1 wins from heap n when it's P1's turn
 *  - p2Win[n] = true iff P2 wins from heap n when it's P2's turn
 * Both arrays are eventually periodic in lock-step (window of size max(S1 ∪ S2)).
 */
export interface PartisanSubtractionPattern {
  p1Win: boolean[];        // pre-period + first period
  p2Win: boolean[];        // pre-period + first period
  prePeriodLength: number;
  periodLength: number;
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

  // ---- Partisan caches ----
  /** Cache for partisan subtraction patterns, keyed by `endCondition|S1|S2`. */
  private readonly partisanPatternCache = new Map<string, PartisanSubtractionPattern>();
  /** Transposition table for partisan minimax. Key = `S1|S2|turn`, value = "P1 wins from here". */
  private readonly partisanDraftCache = new Map<string, boolean>();

  constructor(private readonly config: DraftSubtractionConfig) {}

  pickDraftNumber(draft: DraftState): number {
    if (this.config.difficulty === 'random') {
      return this.randomPick(draft.pool);
    }

    if (this.config.draftType === 'partisan') {
      // Order moves heuristically for better α-β pruning (median-first)
      const orderedPool = this.orderMovesForSearch(draft.pool);
      for (const value of orderedPool) {
        if (this.isPartisanDraftPickWinning(draft, value)) {
          return value;
        }
      }
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
      if (this.isDraftPickWinningForCurrent(draft, value)) {
        winning.push(value);
      } else {
        losing.push(value);
      }
    }

    return { winning, losing };
  }

  /**
   * Evaluate a single draft pick. Returns true if picking `value` puts the
   * opponent in a losing draft state (i.e. the pick is winning for the current drafter).
   * Dispatches on variant (impartial vs partisan).
   */
  isDraftPickWinningForCurrent(draft: DraftState, value: number): boolean {
    if (this.config.draftType === 'partisan') {
      return this.isPartisanDraftPickWinning(draft, value);
    }
    const nextSet = this.insertSorted(draft.subtractionSet, value);
    return !this.isWinningDraftState(nextSet);
  }

  pickSubtractionAmount(heapSize: number, subtractionSet: number[], opponentSet?: number[]): number {
    const validMoves = subtractionSet.filter(v => v <= heapSize);
    if (validMoves.length === 0) return 1;

    if (this.config.difficulty === 'random') {
      return this.randomPick(validMoves);
    }

    if (this.config.draftType === 'partisan' && opponentSet) {
      // The AI is Player 2 in our setup. Look for a move that puts P1 in a losing position.
      // pickSubtractionAmount is called for the player whose `subtractionSet` is passed.
      // We need the partisan pattern based on (S1, S2). Since AI = P2:
      //   subtractionSet = S2, opponentSet = S1.
      const pattern = this.getPartisanSubtractionPattern(opponentSet, subtractionSet);
      for (const move of validMoves) {
        // After P2 takes `move`, it becomes P1's turn at heap (heapSize - move).
        // P2 wants P1_Win[heapSize - move] === false.
        if (!this.lookupPartisan(pattern, heapSize - move, 1)) {
          return move;
        }
      }
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

  // ==================== PARTISAN VARIANT ====================

  /**
   * Public accessor: returns the partisan subtraction pattern for given (S1, S2).
   * Used by the play-phase cheat panel.
   */
  getPartisanSubtractionInfo(s1: number[], s2: number[]): PartisanSubtractionPattern {
    return this.getPartisanSubtractionPattern(s1, s2);
  }

  /**
   * Evaluate one partisan draft pick. Returns true if picking `value` is winning
   * for the current drafter (puts the opponent in a losing state).
   *
   * Uses minimax + α-β + transposition table internally via `evaluatePartisanState`.
   */
  private isPartisanDraftPickWinning(draft: DraftState, value: number): boolean {
    const currentDrafter = draft.currentDrafter;
    let newS1 = draft.subtractionSetP1;
    let newS2 = draft.subtractionSetP2;
    if (currentDrafter === 1) {
      newS1 = this.insertSorted(draft.subtractionSetP1, value);
    } else {
      newS2 = this.insertSorted(draft.subtractionSetP2, value);
    }
    const nextTurn: 1 | 2 = currentDrafter === 1 ? 2 : 1;
    // evaluatePartisanState returns "P1 wins from here"
    const p1Wins = this.evaluatePartisanState(newS1, newS2, nextTurn);
    // Pick is winning for current drafter iff:
    //   - P1 drafted and resulting state has p1Wins === true
    //   - P2 drafted and resulting state has p1Wins === false
    return currentDrafter === 1 ? p1Wins : !p1Wins;
  }

  /**
   * Partisan draft minimax with α-β pruning and transposition table.
   * Returns TRUE iff P1 wins from the state (S1, S2, turn) under perfect play.
   *
   * Normalized to P1's perspective:
   *  - At P1's turn (MAX): return TRUE if ANY child returns TRUE (early exit).
   *  - At P2's turn (MIN): return TRUE only if ALL children return TRUE (early exit on first FALSE).
   *
   * For boolean values, α-β collapses to "early exit on found winning/losing child".
   */
  private evaluatePartisanState(s1: number[], s2: number[], turn: 1 | 2): boolean {
    const k = this.config.k;
    const cacheKey = `${s1.join(',')}|${s2.join(',')}|${turn}`;
    const cached = this.partisanDraftCache.get(cacheKey);
    if (cached !== undefined) return cached;

    // Terminal: draft complete (both sets at size k). Evaluate subtraction phase.
    if (s1.length === k && s2.length === k) {
      // Per partisan rules: draft always ends with Player 2 (2k picks total, P1 starts),
      // so Player 1 makes the first subtraction move.
      const pattern = this.getPartisanSubtractionPattern(s1, s2);
      const result = this.lookupPartisan(pattern, this.config.n, 1);
      this.partisanDraftCache.set(cacheKey, result);
      return result;
    }

    // Recursive case: enumerate pool moves
    const available = this.getPartisanAvailableNumbers(s1, s2);
    const ordered = this.orderMovesForSearch(available);

    if (turn === 1) {
      // MAX: looking for any TRUE
      for (const value of ordered) {
        if (s1.length >= k) break;  // shouldn't happen but safety
        const newS1 = this.insertSorted(s1, value);
        if (this.evaluatePartisanState(newS1, s2, 2)) {
          this.partisanDraftCache.set(cacheKey, true);
          return true;  // α-cutoff: found winning move for P1
        }
      }
      this.partisanDraftCache.set(cacheKey, false);
      return false;
    } else {
      // MIN: looking for any FALSE
      for (const value of ordered) {
        if (s2.length >= k) break;
        const newS2 = this.insertSorted(s2, value);
        if (!this.evaluatePartisanState(s1, newS2, 1)) {
          this.partisanDraftCache.set(cacheKey, false);
          return false;  // β-cutoff: P2 found a move making P1 lose
        }
      }
      this.partisanDraftCache.set(cacheKey, true);
      return true;
    }
  }

  /**
   * Generate (or fetch from cache) the partisan subtraction pattern for (S1, S2).
   *
   * Iterates heap = 0, 1, 2, ... building p1Win[] and p2Win[] in parallel
   * using mutual recursion (per docs/ai-strategy/05-partisan-subtraction-phase.md):
   *   p1Win[n] = ∃ s ∈ S1, s ≤ n, ¬p2Win[n - s]
   *   p2Win[n] = ∃ s ∈ S2, s ≤ n, ¬p1Win[n - s]
   *
   * Period is detected when a window of max(S1 ∪ S2) boolean-tuples repeats.
   */
  private getPartisanSubtractionPattern(s1: number[], s2: number[]): PartisanSubtractionPattern {
    const sortedS1 = [...s1].sort((a, b) => a - b);
    const sortedS2 = [...s2].sort((a, b) => a - b);
    const key = `${this.config.endCondition}|${sortedS1.join(',')}|${sortedS2.join(',')}`;
    const cached = this.partisanPatternCache.get(key);
    if (cached) return cached;

    const union = [...new Set([...sortedS1, ...sortedS2])];
    const maxMove = union.length > 0 ? Math.max(...union) : 1;
    const endCondition = this.config.endCondition;

    const p1Win: boolean[] = [];
    const p2Win: boolean[] = [];
    const windows = new Map<string, number>();

    // Safety cap on iterations — period MUST be found within 4^maxMove + maxMove
    // (number of distinct boolean tuples of length maxMove).
    const safetyCap = Math.max(10_000, Math.min(100_000, Math.pow(4, maxMove) + maxMove));

    for (let n = 0; n < safetyCap; n++) {
      p1Win[n] = this.computePartisanOutcome(n, sortedS1, p2Win, endCondition);
      p2Win[n] = this.computePartisanOutcome(n, sortedS2, p1Win, endCondition);

      if (n >= maxMove - 1) {
        const windowStart = n - maxMove + 1;
        let windowKey = '';
        for (let i = 0; i < maxMove; i++) {
          windowKey += (p1Win[windowStart + i] ? '1' : '0') + (p2Win[windowStart + i] ? '1' : '0');
        }
        const previousStart = windows.get(windowKey);
        if (previousStart !== undefined) {
          const periodLength = windowStart - previousStart;
          const prePeriodLength = previousStart;
          const pattern: PartisanSubtractionPattern = {
            p1Win: p1Win.slice(0, prePeriodLength + periodLength),
            p2Win: p2Win.slice(0, prePeriodLength + periodLength),
            prePeriodLength,
            periodLength,
            windowSize: maxMove,
          };
          this.partisanPatternCache.set(key, pattern);
          return pattern;
        }
        windows.set(windowKey, windowStart);
      }
    }

    // Fallback: period not found within safety cap (shouldn't happen for sane params)
    const fallback: PartisanSubtractionPattern = {
      p1Win,
      p2Win,
      prePeriodLength: p1Win.length,
      periodLength: 1,
      windowSize: maxMove,
    };
    this.partisanPatternCache.set(key, fallback);
    return fallback;
  }

  /**
   * Compute one partisan outcome value.
   * `mySet` = the moves available to the player whose state we compute.
   * `opponentArr` = the opponent's win-array (already filled up to index n-1).
   */
  private computePartisanOutcome(
    heapSize: number,
    mySet: number[],
    opponentArr: boolean[],
    endCondition: EndCondition,
  ): boolean {
    const moves = mySet.filter(v => v <= heapSize);
    if (moves.length === 0) {
      // No legal move. Under last-wins (normal play), you lose. Under last-loses (misère), you win.
      return endCondition === 'last-loses';
    }
    for (const move of moves) {
      if (!opponentArr[heapSize - move]) {
        return true;
      }
    }
    return false;
  }

  /**
   * Look up the partisan pattern at heap=n for given player perspective (1 or 2).
   * Uses periodicity modulo to handle large heaps in O(1).
   */
  private lookupPartisan(pattern: PartisanSubtractionPattern, n: number, player: 1 | 2): boolean {
    const arr = player === 1 ? pattern.p1Win : pattern.p2Win;
    if (n < 0) return false;
    if (n < pattern.prePeriodLength) {
      return arr[n];
    }
    const idx = pattern.prePeriodLength + ((n - pattern.prePeriodLength) % pattern.periodLength);
    return arr[idx];
  }

  /** Pool values still available (not in S1 or S2) for the next partisan pick. */
  private getPartisanAvailableNumbers(s1: number[], s2: number[]): number[] {
    const used = new Set([...s1, ...s2]);
    const options: number[] = [];
    for (let v = 1; v <= this.config.poolSize; v++) {
      if (!used.has(v)) options.push(v);
    }
    return options;
  }

  /**
   * Move ordering heuristic for α-β. Try middle-valued picks first — they're
   * often most "pivotal" (split the pool roughly in half, create interesting
   * subgames). This dramatically improves pruning in practice.
   *
   * Returns a copy sorted by absolute distance from the pool midpoint.
   */
  private orderMovesForSearch(pool: number[]): number[] {
    const mid = (this.config.poolSize + 1) / 2;
    return [...pool].sort((a, b) => {
      const da = Math.abs(a - mid);
      const db = Math.abs(b - mid);
      if (da !== db) return da - db;
      return a - b;
    });
  }

  // ==========================================================

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
