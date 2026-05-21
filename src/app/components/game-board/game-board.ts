import { Component, OnInit, effect } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { GameConfig } from '../../models/game-config.types';
import { ClassicNimConfig } from '../../models/classic/classic-nim.models';
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

  constructor(
    protected game: GameService,
    private router: Router,
  ) {
    effect(() => {
      if (this.game.isComputerTurn()) {
        setTimeout(() => this.game.makeComputerMove(), 600);
      }
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
    this.game.startGame(this.game.config());
  }
}
