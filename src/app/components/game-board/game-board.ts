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
    const max = this.game.maxRemovable();
    return Array.from({ length: max }, (_, i) => i + 1);
  }

  getPlayerLabel(player: 1 | 2): string {
    if (player === 1) return 'Player 1';
    return this.game.config().opponent === 'computer' ? 'Computer' : 'Player 2';
  }

  get cheatMode(): boolean {
    const config = this.game.config();
    return config.variant === 'classic' && (config as ClassicNimConfig).cheatMode;
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
      default:
        return config.variant.charAt(0).toUpperCase() + config.variant.slice(1) + ' Nim';
    }
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

  onNewGame(): void {
    this.router.navigate(['/']);
  }

  onRematch(): void {
    this.game.startGame(this.game.config());
  }
}
