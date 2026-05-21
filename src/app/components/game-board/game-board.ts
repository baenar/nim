import { Component, OnInit, effect, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { GameConfig } from '../../models/game-config.types';
import { ClassicNimConfig } from '../../models/classic/classic-nim.models';
import { DraftSubtractionConfig } from '../../models/draft-subtraction/draft-subtraction.models';
import { DiscStack } from '../disc-stack/disc-stack';
import { XorPanel } from '../xor-panel/xor-panel';

@Component({
  selector: 'app-game-board',
  imports: [DiscStack, XorPanel],
  templateUrl: './game-board.html',
  styleUrl: './game-board.scss',
})
export class GameBoard implements OnInit {
  showExitConfirm = false;
  showDraftCheat = false;
  showSubtractionCheat = false;
  showAllSg = false;
  readonly showGameOverOverlay = signal(false);
  private readonly sgDisplayLimit = 60;
  private readonly gameOverDelayMs = 1200;
  private gameOverTimer: number | null = null;

  constructor(
    protected game: GameService,
    private router: Router,
  ) {
    effect(() => {
      if (this.game.isComputerTurn()) {
        setTimeout(() => this.game.makeComputerMove(), 600);
      }
    });

    effect(() => {
      const isGameOver = this.game.state().isGameOver;
      if (!isGameOver) {
        this.clearGameOverTimer();
        this.showGameOverOverlay.set(false);
        return;
      }
      this.clearGameOverTimer();
      this.showGameOverOverlay.set(false);
      this.gameOverTimer = window.setTimeout(() => {
        this.showGameOverOverlay.set(true);
      }, this.gameOverDelayMs);
    });
  }

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation?.() ?? history.state;
    const config: GameConfig | undefined = nav?.config;
    if (!config) {
      this.router.navigate(['/']);
      return;
    }
    this.game.startGame(config);
  }

  get amountOptions(): number[] {
    return this.game.validAmounts();
  }

  getPlayerLabel(player: 1 | 2): string {
    if (player === 1) return 'Player 1';
    return this.game.config().opponent === 'computer' ? 'Computer' : 'Player 2';
  }

  get cheatMode(): boolean {
    const config = this.game.config();
    return config.variant === 'classic' && (config as ClassicNimConfig).cheatMode;
  }

  get isDraftSubtraction(): boolean {
    return this.game.config().variant === 'draft-subtraction';
  }

  get isDraftCheatEnabled(): boolean {
    const config = this.game.config();
    return config.variant === 'draft-subtraction' && (config as DraftSubtractionConfig).cheatMode;
  }

  get draftCheatInfo() {
    return this.game.getDraftCheatInfo();
  }

  get subtractionCheatInfo() {
    return this.game.getSubtractionCheatInfo();
  }

  get draftWinningText(): string {
    const info = this.draftCheatInfo;
    if (!info) return '';
    return info.winning.length > 0 ? info.winning.join(' ') : 'none';
  }

  get draftLosingText(): string {
    const info = this.draftCheatInfo;
    if (!info) return '';
    return info.losing.length > 0 ? info.losing.join(' ') : 'none';
  }

  get sgDisplayValues(): number[] {
    const info = this.subtractionCheatInfo;
    if (!info) return [];
    return this.showAllSg ? info.values : info.values.slice(0, this.sgDisplayLimit);
  }

  get sgDisplayText(): string {
    return `[${this.sgDisplayValues.join(', ')}]`;
  }

  get canToggleSg(): boolean {
    const info = this.subtractionCheatInfo;
    return !!info && info.values.length > this.sgDisplayLimit;
  }

  get showGameOverWinHighlight(): boolean {
    const state = this.game.state();
    return this.game.config().opponent === 'computer' && state.isGameOver && state.winner === 1;
  }

  get showGameOverLossHighlight(): boolean {
    const state = this.game.state();
    return this.game.config().opponent === 'computer' && state.isGameOver && state.winner === 2;
  }

  get gameOverHighlightColor(): string | null {
    if (this.showGameOverWinHighlight) return 'var(--success)';
    if (this.showGameOverLossHighlight) return 'var(--danger)';
    return null;
  }

  get gameOverHighlightBg(): string | null {
    if (this.showGameOverWinHighlight) return 'rgba(74, 222, 128, 0.12)';
    if (this.showGameOverLossHighlight) return 'rgba(248, 113, 113, 0.12)';
    return null;
  }

  get gameOverHighlightShadow(): string | null {
    if (this.showGameOverWinHighlight) return '0 10px 24px rgba(74, 222, 128, 0.15)';
    if (this.showGameOverLossHighlight) return '0 10px 24px rgba(248, 113, 113, 0.15)';
    return null;
  }

  get variantLabel(): string {
    const config = this.game.config();
    switch (config.variant) {
      case 'classic': {
        const c = config as ClassicNimConfig;
        return c.subtraction
          ? `Classic Nim · Subtraction (max ${c.maxTake})`
          : 'Classic Nim';
      }
      case 'draft-subtraction':
        return 'Draft Subtraction';
      default:
        return 'Unknown';
    }
  }

  get draftCurrentPlayerLabel(): string {
    const draft = this.game.draftState();
    if (!draft) return '';
    return this.getPlayerLabel(draft.currentDrafter);
  }

  onDraftPick(value: number): void {
    this.game.draftPick(value);
  }

  get currentPlayerLabel(): string {
    return this.getPlayerLabel(this.game.state().currentPlayer);
  }

  get winnerLabel(): string {
    const winner = this.game.state().winner;
    if (!winner) return '';
    return this.getPlayerLabel(winner);
  }

  onConfirmMove(): void {
    this.game.makeMove();
  }

  toggleDraftCheat(): void {
    this.showDraftCheat = !this.showDraftCheat;
  }

  toggleSubtractionCheat(): void {
    this.showSubtractionCheat = !this.showSubtractionCheat;
    if (!this.showSubtractionCheat) {
      this.showAllSg = false;
    }
  }

  toggleSgSize(): void {
    this.showAllSg = !this.showAllSg;
  }

  onMenuClick(): void {
    if (this.game.state().isGameOver) {
      this.router.navigate(['/']);
      return;
    }
    this.showExitConfirm = true;
  }

  confirmExit(): void {
    this.showExitConfirm = false;
    this.router.navigate(['/']);
  }

  cancelExit(): void {
    this.showExitConfirm = false;
  }

  onRematch(): void {
    this.showExitConfirm = false;
    this.clearGameOverTimer();
    this.showGameOverOverlay.set(false);
    this.game.startGame(this.game.config());
  }

  private clearGameOverTimer(): void {
    if (this.gameOverTimer !== null) {
      clearTimeout(this.gameOverTimer);
      this.gameOverTimer = null;
    }
  }
}
