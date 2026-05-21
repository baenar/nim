import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  DraftSubtractionConfig,
  DraftVariantType,
  DRAFT_SUBTRACTION_DEFAULTS,
} from '../../../models/draft-subtraction/draft-subtraction.models';

@Component({
  selector: 'app-draft-subtraction-settings',
  imports: [FormsModule],
  templateUrl: './draft-subtraction-settings.html',
  styleUrl: './draft-subtraction-settings.scss',
})
export class DraftSubtractionSettings {
  n = DRAFT_SUBTRACTION_DEFAULTS.n;
  k = DRAFT_SUBTRACTION_DEFAULTS.k;
  poolSize = DRAFT_SUBTRACTION_DEFAULTS.poolSize;
  draftType: DraftVariantType = DRAFT_SUBTRACTION_DEFAULTS.draftType;
  opponent = DRAFT_SUBTRACTION_DEFAULTS.opponent;
  cheatMode = DRAFT_SUBTRACTION_DEFAULTS.cheatMode;

  constructor(private router: Router) {}

  get maxPoolSize(): number {
    return Math.floor(0.4 * this.n);
  }

  onNChange(): void {
    if (this.n < 2) this.n = 2;
    if (this.n > 200) this.n = 200;
  }

  onKChange(): void {
    if (this.k < 1) this.k = 1;
  }

  onPoolSizeChange(): void {
    if (this.poolSize < 1) this.poolSize = 1;
  }

  get isValid(): boolean {
    return this.n >= 2
      && this.poolSize > 0
      && this.poolSize < 0.4 * this.n
      && this.k > 0
      && this.k < this.poolSize;
  }

  get validationErrors(): string[] {
    const errors: string[] = [];
    if (this.poolSize <= 0) errors.push('p must be greater than 0');
    if (this.k <= 0) errors.push('k must be greater than 0');
    if (this.poolSize >= 0.4 * this.n) errors.push('p must be less than 0.4 × N (' + (0.4 * this.n) + ')');
    if (this.k >= this.poolSize) errors.push('k must be less than p (' + this.poolSize + ')');
    return errors;
  }

  startGame(): void {
    if (!this.isValid) return;
    const config: DraftSubtractionConfig = {
      variant: 'draft-subtraction',
      stackCount: 1,
      stackSizes: [this.n],
      opponent: this.opponent,
      difficulty: 'expert',
      endCondition: 'last-wins',
      n: this.n,
      k: this.k,
      poolSize: this.poolSize,
      draftType: this.draftType,
      cheatMode: this.cheatMode,
    };
    this.router.navigate(['/play'], { state: { config } });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
