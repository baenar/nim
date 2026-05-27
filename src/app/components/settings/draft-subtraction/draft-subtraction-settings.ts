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

  readonly ABSOLUTE_IMPARTIAL_MAX_POOL_SIZE = 30;
  readonly ABSOLUTE_IMPARTIAL_MAX_K = 8;
  readonly ABSOLUTE_PARTISAN_MAX_POOL_SIZE = 20;
  readonly ABSOLUTE_PARTISAN_MAX_K = 4;
  CURRENT_MAX_POOL_SIZE = this.ABSOLUTE_IMPARTIAL_MAX_POOL_SIZE;
  CURRENT_MAX_K = this.ABSOLUTE_IMPARTIAL_MAX_K;

  get isPartisan(): boolean {
    return this.draftType === 'partisan';
  }

  get maxPoolSize(): number {
    return Math.min(this.CURRENT_MAX_POOL_SIZE, Math.floor(0.4 * this.n));
  }

  get maxK(): number {
    return Math.min(this.CURRENT_MAX_K, this.poolSize);
  }

  setDraftType(type: DraftVariantType): void {
    if (this.draftType === type) return;
    this.draftType = type;
    if (this.isPartisan) {
      this.CURRENT_MAX_K = this.ABSOLUTE_PARTISAN_MAX_K;
      this.CURRENT_MAX_POOL_SIZE = this.ABSOLUTE_PARTISAN_MAX_POOL_SIZE;
      this.k = Math.min(this.CURRENT_MAX_K, this.k);
      this.poolSize = Math.min(this.CURRENT_MAX_POOL_SIZE, this.poolSize);
    } else {
      this.CURRENT_MAX_K = this.ABSOLUTE_IMPARTIAL_MAX_K;
      this.CURRENT_MAX_POOL_SIZE = this.ABSOLUTE_IMPARTIAL_MAX_POOL_SIZE;
    }
  }

  get isValid(): boolean {
    return this.validationErrors.length === 0;
  }

  get validationErrors(): string[] {
    const errors: string[] = [];
    if (this.n === null || this.k === null || this.poolSize === null) {
      errors.push('all values need to be specified');
      return errors;
    }
    if (this.n < 2) errors.push('N must be at least 2');
    if (this.poolSize <= 0) errors.push('p must be greater than 0');
    if (this.k <= 0) errors.push('k must be greater than 0');
    if (this.poolSize > this.CURRENT_MAX_POOL_SIZE) errors.push('p must be less than or equal ' + this.CURRENT_MAX_POOL_SIZE);
    if (this.poolSize >= 0.4 * this.n) errors.push('p must be less than 0.4 × N (' + (0.4 * this.n) + ')');
    if (this.k > this.CURRENT_MAX_K) errors.push('k must be less than or equal ' + this.CURRENT_MAX_K);
    if (this.k > this.poolSize) errors.push('k must be less than or equal p (' + this.poolSize + ')');
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
