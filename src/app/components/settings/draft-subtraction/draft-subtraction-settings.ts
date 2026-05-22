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

  get isPartisan(): boolean {
    return this.draftType === 'partisan';
  }

  get maxPoolSize(): number {
    return Math.floor(0.4 * this.n);
  }

  get minPoolSize(): number {
    if (this.isPartisan) {
      return Math.max(1, 2 * this.k + 1);
    }
    return Math.max(1, this.k + 1);
  }

  get maxK(): number {
    if (this.isPartisan) {
      return Math.max(0, Math.floor((this.poolSize - 1) / 2));
    }
    return Math.max(0, this.poolSize - 1);
  }

  get minK(): number {
    return this.isPartisan ? 1 : 2;
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

  setDraftType(type: DraftVariantType): void {
    if (this.draftType === type) return;
    this.draftType = type;
  }

  get isValid(): boolean {
    if (this.n < 2) return false;
    if (this.poolSize > this.maxPoolSize) return false;
    if (this.isPartisan) {
      return this.k >= 1
        && this.poolSize >= 2 * this.k + 1;
    }
    return this.k >= 2
      && this.poolSize >= this.k + 1;
  }

  get validationErrors(): string[] {
    const errors: string[] = [];
    if (this.isPartisan) {
      if (this.k < 1) errors.push('k must be at least 1');
      if (this.poolSize < 2 * this.k + 1) {
        errors.push('p must be at least 2k + 1 (' + (2 * this.k + 1) + ')');
      }
      if (this.poolSize > this.maxPoolSize) {
        errors.push('p must be at most 0.4 × N (' + this.maxPoolSize + ')');
      }
    } else {
      if (this.k < 2) errors.push('k must be at least 2');
      if (this.poolSize < this.k + 1) {
        errors.push('p must be at least k + 1 (' + (this.k + 1) + ')');
      }
      if (this.poolSize > this.maxPoolSize) {
        errors.push('p must be at most 0.4 × N (' + this.maxPoolSize + ')');
      }
    }
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
