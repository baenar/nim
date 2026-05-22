import { Injectable, signal, computed } from '@angular/core';
import { GameState } from '../models/shared/game-state.models';
import { GameConfig } from '../models/game-config.types';
import { ClassicNimConfig, CLASSIC_NIM_DEFAULTS } from '../models/classic/classic-nim.models';
import { DraftSubtractionConfig, DraftState } from '../models/draft-subtraction/draft-subtraction.models';
import { getClassicNimExpertMove, getClassicNimRandomMove } from './classic/classic-nim.ai';
import { DraftPickAnalysis, DraftSubtractionAi, SpragueGrundySequence } from './draft-subtraction/draft-subtraction.ai';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly _config = signal<GameConfig>({ ...CLASSIC_NIM_DEFAULTS });
  private readonly _state = signal<GameState>(this.createInitialState(CLASSIC_NIM_DEFAULTS));
  private readonly _selectedStack = signal<number | null>(null);
  private readonly _selectedAmount = signal<number>(1);
  private readonly _draftState = signal<DraftState | null>(null);
  private _draftAi: DraftSubtractionAi | null = null;
  private draftCompleteTimer: number | null = null;

  readonly config = this._config.asReadonly();
  readonly state = this._state.asReadonly();
  readonly selectedStack = this._selectedStack.asReadonly();
  readonly selectedAmount = this._selectedAmount.asReadonly();
  readonly draftState = this._draftState.asReadonly();

  readonly isDraftPhase = computed(() => {
    const draft = this._draftState();
    return draft !== null && !draft.isComplete;
  });

  readonly isComputerTurn = computed(() => {
    const state = this._state();
    const config = this._config();
    if (config.opponent !== 'computer' || state.isGameOver) return false;
    if (this.isDraftPhase()) {
      const draft = this._draftState();
      if (draft?.isLocked) return false;
      return draft?.currentDrafter === 2;
    }
    return state.currentPlayer === 2;
  });

  readonly maxRemovable = computed(() => {
    const config = this._config();
    const stack = this._selectedStack();
    if (stack === null) return 0;
    const stackSize = this._state().stacks[stack];
    return this.getMaxTakeForStack(config, stackSize);
  });

  /** Valid amounts for the currently selected stack (for subtraction-set variants). */
  readonly validAmounts = computed((): number[] => {
    const config = this._config();
    const stack = this._selectedStack();
    if (stack === null) return [];
    const stackSize = this._state().stacks[stack];

    if (config.variant === 'draft-subtraction') {
      const draft = this._draftState();
      if (!draft || !draft.isComplete) return [];
      const set = this.getSubtractionSetForPlayer(draft, this._state().currentPlayer);
      return [...set]
        .filter(v => v <= stackSize)
        .sort((a, b) => a - b);
    }

    // Classic: 1..maxRemovable
    const max = this.getMaxTakeForStack(config, stackSize);
    return Array.from({ length: max }, (_, i) => i + 1);
  });

  startGame(config: GameConfig): void {
    this.clearDraftCompleteTimer();
    this._config.set(config);
    this._state.set(this.createInitialState(config));
    this._selectedStack.set(null);
    this._selectedAmount.set(1);

    if (config.variant === 'draft-subtraction') {
      const c = config as DraftSubtractionConfig;
      const isPartisan = c.draftType === 'partisan';
      this._draftAi = new DraftSubtractionAi(c);
      this._draftState.set({
        pool: Array.from({ length: c.poolSize }, (_, i) => i + 1),
        subtractionSet: [],
        subtractionSetP1: [],
        subtractionSetP2: [],
        picksRemaining: isPartisan ? c.k * 2 : c.k,
        currentDrafter: 1,
        isComplete: false,
        isLocked: false,
      });
    } else {
      this._draftState.set(null);
      this._draftAi = null;
    }
  }

  /** Player picks a number from the pool during draft phase. */
  draftPick(value: number): boolean {
    const draft = this._draftState();
    const config = this._config();
    if (!draft || draft.isComplete || draft.isLocked) return false;
    if (!draft.pool.includes(value)) return false;
    if (config.opponent === 'computer' && draft.currentDrafter === 2) return false;

    return this.applyDraftPick(draft, value);
  }

  private applyDraftPick(draft: DraftState, value: number): boolean {
    if (draft.isLocked) return false;
    const config = this._config() as DraftSubtractionConfig;
    const newPool = draft.pool.filter(v => v !== value);
    const isPartisan = config.draftType === 'partisan';
    let newSet = draft.subtractionSet;
    let newSetP1 = draft.subtractionSetP1;
    let newSetP2 = draft.subtractionSetP2;

    if (isPartisan) {
      if (draft.currentDrafter === 1) {
        newSetP1 = [...draft.subtractionSetP1, value].sort((a, b) => a - b);
      } else {
        newSetP2 = [...draft.subtractionSetP2, value].sort((a, b) => a - b);
      }
    } else {
      newSet = [...draft.subtractionSet, value].sort((a, b) => a - b);
    }

    const newPicksRemaining = Math.max(0, draft.picksRemaining - 1);
    const isDraftDone = isPartisan
      ? newSetP1.length === config.k && newSetP2.length === config.k
      : newPicksRemaining === 0;
    const nextDrafter: 1 | 2 = draft.currentDrafter === 1 ? 2 : 1;

    this._draftState.set({
      pool: newPool,
      subtractionSet: newSet,
      subtractionSetP1: newSetP1,
      subtractionSetP2: newSetP2,
      picksRemaining: isDraftDone ? 0 : newPicksRemaining,
      currentDrafter: nextDrafter,
      isComplete: false,
      isLocked: isDraftDone,
    });

    // When draft completes, the next drafter starts the subtraction phase
    if (isDraftDone) {
      const nextSet = isPartisan
        ? (nextDrafter === 1 ? newSetP1 : newSetP2)
        : newSet;
      this.clearDraftCompleteTimer();
      this.draftCompleteTimer = window.setTimeout(() => {
        this._draftState.update(s => s ? ({ ...s, isComplete: true, isLocked: false }) : s);
        this._state.update(s => ({ ...s, currentPlayer: nextDrafter }));
        // Auto-select the single stack so the player can immediately pick an amount
        this._selectedStack.set(0);
        this._selectedAmount.set(nextSet[0] ?? 1);
        this.draftCompleteTimer = null;
      }, 1500);
    }

    return true;
  }

  selectStack(index: number): void {
    const state = this._state();
    if (state.isGameOver || state.stacks[index] === 0) return;
    if (this.isComputerTurn()) return;
    this._selectedStack.set(index);
    this._selectedAmount.set(1);
  }

  setAmount(amount: number): void {
    this._selectedAmount.set(amount);
  }

  makeMove(): boolean {
    const stackIndex = this._selectedStack();
    const amount = this._selectedAmount();
    if (stackIndex === null) return false;
    return this.applyMove(stackIndex, amount);
  }

  makeComputerMove(): void {
    const config = this._config();
    const state = this._state();
    if (config.opponent !== 'computer') return;

    if (this.isDraftPhase()) {
      const draft = this._draftState();
      if (!draft || draft.currentDrafter !== 2 || draft.isLocked) return;
      if (config.variant !== 'draft-subtraction' || !this._draftAi) return;
      const pick = this._draftAi.pickDraftNumber(draft);
      this.applyDraftPick(draft, pick);
      return;
    }

    if (state.isGameOver || state.currentPlayer !== 2) return;

    const move = this.getAiMove(state, config);
    this.applyMove(move.stackIndex, move.amount);
  }

  getDraftCheatInfo(): DraftPickAnalysis | null {
    const config = this._config();
    if (config.variant !== 'draft-subtraction') return null;
    if ((config as DraftSubtractionConfig).draftType === 'partisan') return null;
    const draft = this._draftState();
    if (!draft || draft.isComplete || !this._draftAi) return null;
    return this._draftAi.getDraftPickAnalysis(draft);
  }

  getSubtractionCheatInfo(): SpragueGrundySequence | null {
    const config = this._config();
    if (config.variant !== 'draft-subtraction') return null;
    if ((config as DraftSubtractionConfig).draftType === 'partisan') return null;
    const draft = this._draftState();
    if (!draft || !draft.isComplete || !this._draftAi) return null;
    const heapSize = this._state().stacks[0] ?? 0;
    return this._draftAi.getSpragueGrundySequence(draft.subtractionSet, heapSize);
  }

  private applyMove(stackIndex: number, amount: number): boolean {
    const state = this._state();
    const config = this._config();

    if (stackIndex < 0 || stackIndex >= state.stacks.length) return false;
    if (amount < 1 || amount > state.stacks[stackIndex]) return false;
    if (state.isGameOver) return false;

    // Validate amount against variant rules
    if (config.variant === 'draft-subtraction') {
      const draft = this._draftState();
      if (!draft || !draft.isComplete) return false;
      const activeSet = this.getSubtractionSetForPlayer(draft, state.currentPlayer);
      if (!activeSet.includes(amount)) return false;
    } else {
      const maxTake = this.getMaxTakeForStack(config, state.stacks[stackIndex]);
      if (amount > maxTake) return false;
    }

    const newStacks = [...state.stacks];
    newStacks[stackIndex] -= amount;

    const totalRemaining = newStacks.reduce((a, b) => a + b, 0);
    let isGameOver = totalRemaining === 0;

    // For draft-subtraction: also game over if next player has no valid move
    const nextPlayer: 1 | 2 = state.currentPlayer === 1 ? 2 : 1;
    if (!isGameOver && config.variant === 'draft-subtraction') {
      const draft = this._draftState();
      if (draft?.isComplete) {
        const nextSet = this.getSubtractionSetForPlayer(draft, nextPlayer);
        const canMove = nextSet.some(v => v <= totalRemaining);
        if (!canMove) {
          isGameOver = true;
        }
      }
    }

    let winner: 1 | 2 | null = null;
    if (isGameOver) {
      if (config.endCondition === 'last-wins') {
        winner = state.currentPlayer;
      } else {
        winner = state.currentPlayer === 1 ? 2 : 1;
      }
    }

    const move = { player: state.currentPlayer, stackIndex, amount };

    this._state.set({
      stacks: newStacks,
      currentPlayer: isGameOver ? state.currentPlayer : nextPlayer,
      isGameOver,
      winner,
      lastMove: { stackIndex, amount },
      moveHistory: [...state.moveHistory, move],
    });

    // For single-stack games (draft-subtraction), auto-reselect the stack
    if (!isGameOver && config.variant === 'draft-subtraction') {
      this._selectedStack.set(0);
      const draft = this._draftState();
      if (draft?.isComplete) {
        const nextSet = this.getSubtractionSetForPlayer(draft, nextPlayer);
        const firstValid = nextSet.find(v => v <= newStacks[0]);
        this._selectedAmount.set(firstValid ?? 1);
      }
    } else {
      this._selectedStack.set(null);
      this._selectedAmount.set(1);
    }
    return true;
  }

  private getMaxTakeForStack(config: GameConfig, stackSize: number): number {
    switch (config.variant) {
      case 'classic': {
        const c = config as ClassicNimConfig;
        return c.subtraction ? Math.min(c.maxTake, stackSize) : stackSize;
      }
      default:
        return stackSize;
    }
  }

  private getAiMove(state: GameState, config: GameConfig): { stackIndex: number; amount: number } {
    switch (config.variant) {
      case 'classic': {
        const c = config as ClassicNimConfig;
        return c.difficulty === 'expert'
          ? getClassicNimExpertMove(state, c)
          : getClassicNimRandomMove(state, c);
      }
      case 'draft-subtraction': {
        const draft = this._draftState();
        const ai = this._draftAi;
        if (draft && draft.isComplete && ai) {
          const aiSet = this.getSubtractionSetForPlayer(draft, 2);
          return { stackIndex: 0, amount: ai.pickSubtractionAmount(state.stacks[0], aiSet) };
        }
        const nonEmpty = state.stacks.map((s, i) => ({ s, i })).filter(x => x.s > 0);
        const chosen = nonEmpty[Math.floor(Math.random() * nonEmpty.length)];
        return { stackIndex: chosen.i, amount: 1 };
      }
      default:
        // Fallback for unimplemented variants
        const nonEmpty = state.stacks.map((s, i) => ({ s, i })).filter(x => x.s > 0);
        const chosen = nonEmpty[Math.floor(Math.random() * nonEmpty.length)];
        return { stackIndex: chosen.i, amount: 1 };
    }
  }

  private getSubtractionSetForPlayer(draft: DraftState, player: 1 | 2): number[] {
    const config = this._config() as DraftSubtractionConfig;
    if (config.draftType === 'partisan') {
      return player === 1 ? draft.subtractionSetP1 : draft.subtractionSetP2;
    }
    return draft.subtractionSet;
  }

  private createInitialState(config: GameConfig): GameState {
    return {
      stacks: [...config.stackSizes],
      currentPlayer: 1,
      isGameOver: false,
      winner: null,
      lastMove: null,
      moveHistory: [],
    };
  }

  private clearDraftCompleteTimer(): void {
    if (this.draftCompleteTimer !== null) {
      clearTimeout(this.draftCompleteTimer);
      this.draftCompleteTimer = null;
    }
  }
}
