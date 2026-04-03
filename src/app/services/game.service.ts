import { Injectable, signal, computed } from '@angular/core';
import { GameState } from '../models/shared/game-state.models';
import { GameConfig } from '../models/game-config.types';
import { ClassicNimConfig, CLASSIC_NIM_DEFAULTS } from '../models/classic/classic-nim.models';
import { getClassicNimExpertMove, getClassicNimRandomMove } from './classic/classic-nim.ai';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly _config = signal<GameConfig>({ ...CLASSIC_NIM_DEFAULTS });
  private readonly _state = signal<GameState>(this.createInitialState(CLASSIC_NIM_DEFAULTS));
  private readonly _selectedStack = signal<number | null>(null);
  private readonly _selectedAmount = signal<number>(1);

  readonly config = this._config.asReadonly();
  readonly state = this._state.asReadonly();
  readonly selectedStack = this._selectedStack.asReadonly();
  readonly selectedAmount = this._selectedAmount.asReadonly();

  readonly isComputerTurn = computed(() => {
    const state = this._state();
    const config = this._config();
    return !state.isGameOver && config.opponent === 'computer' && state.currentPlayer === 2;
  });

  readonly maxRemovable = computed(() => {
    const config = this._config();
    const stack = this._selectedStack();
    if (stack === null) return 0;
    const stackSize = this._state().stacks[stack];
    return this.getMaxTakeForStack(config, stackSize);
  });

  startGame(config: GameConfig): void {
    this._config.set(config);
    this._state.set(this.createInitialState(config));
    this._selectedStack.set(null);
    this._selectedAmount.set(1);
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
    if (state.isGameOver || state.currentPlayer !== 2) return;

    const move = this.getAiMove(state, config);
    this.applyMove(move.stackIndex, move.amount);
  }

  private applyMove(stackIndex: number, amount: number): boolean {
    const state = this._state();
    const config = this._config();

    if (stackIndex < 0 || stackIndex >= state.stacks.length) return false;
    const maxTake = this.getMaxTakeForStack(config, state.stacks[stackIndex]);
    if (amount < 1 || amount > maxTake) return false;
    if (state.isGameOver) return false;

    const newStacks = [...state.stacks];
    newStacks[stackIndex] -= amount;

    const totalRemaining = newStacks.reduce((a, b) => a + b, 0);
    const isGameOver = totalRemaining === 0;

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
      currentPlayer: isGameOver ? state.currentPlayer : (state.currentPlayer === 1 ? 2 : 1),
      isGameOver,
      winner,
      lastMove: { stackIndex, amount },
      moveHistory: [...state.moveHistory, move],
    });

    this._selectedStack.set(null);
    this._selectedAmount.set(1);
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
      default:
        // Fallback for unimplemented variants
        const nonEmpty = state.stacks.map((s, i) => ({ s, i })).filter(x => x.s > 0);
        const chosen = nonEmpty[Math.floor(Math.random() * nonEmpty.length)];
        return { stackIndex: chosen.i, amount: 1 };
    }
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
}
