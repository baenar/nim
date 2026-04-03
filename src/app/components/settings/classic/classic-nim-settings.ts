import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClassicNimConfig, CLASSIC_NIM_DEFAULTS } from '../../../models/classic/classic-nim.models';

@Component({
  selector: 'app-classic-nim-settings',
  imports: [FormsModule],
  templateUrl: './classic-nim-settings.html',
  styleUrl: './classic-nim-settings.scss',
})
export class ClassicNimSettings {
  stackCount = CLASSIC_NIM_DEFAULTS.stackCount;
  stackSizes = [...CLASSIC_NIM_DEFAULTS.stackSizes];
  opponent = CLASSIC_NIM_DEFAULTS.opponent;
  difficulty = CLASSIC_NIM_DEFAULTS.difficulty;
  endCondition = CLASSIC_NIM_DEFAULTS.endCondition;
  subtraction = CLASSIC_NIM_DEFAULTS.subtraction;
  maxTake = CLASSIC_NIM_DEFAULTS.maxTake;

  constructor(private router: Router) {}

  onStackCountChange(): void {
    if (this.stackCount < 1) this.stackCount = 1;
    if (this.stackCount > 8) this.stackCount = 8;
    while (this.stackSizes.length < this.stackCount) {
      this.stackSizes.push(10);
    }
    this.stackSizes = this.stackSizes.slice(0, this.stackCount);
  }

  updateStackSize(index: number, value: number): void {
    if (value < 1) value = 1;
    if (value > 30) value = 30;
    this.stackSizes[index] = value;
  }

  trackByIndex(index: number): number {
    return index;
  }

  startGame(): void {
    const config: ClassicNimConfig = {
      variant: 'classic',
      stackCount: this.stackCount,
      stackSizes: [...this.stackSizes],
      opponent: this.opponent,
      difficulty: this.difficulty,
      endCondition: this.endCondition,
      subtraction: this.subtraction,
      maxTake: this.maxTake,
    };
    this.router.navigate(['/play'], { state: { config } });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
