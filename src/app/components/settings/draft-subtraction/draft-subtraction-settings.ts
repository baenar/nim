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

  constructor(private router: Router) {}

  get maxPoolSize(): number {
    return Math.floor(0.4 * this.n);
  }

  onNChange(): void {
    if (this.n < 2) this.n = 2;
    if (this.n > 200) this.n = 200;
    // Auto-adjust pool size to default if it exceeds new max
    const max = this.maxPoolSize;
    if (this.poolSize > max) {
      this.poolSize = max;
    }
  }

  onKChange(): void {
    if (this.k < 1) this.k = 1;
    if (this.k > this.poolSize) this.k = this.poolSize;
  }

  onPoolSizeChange(): void {
    if (this.poolSize < 1) this.poolSize = 1;
    const max = this.maxPoolSize;
    if (this.poolSize > max) this.poolSize = max;
    // Adjust k if it now exceeds pool size
    if (this.k > this.poolSize) {
      this.k = this.poolSize;
    }
  }

  startGame(): void {
    const config: DraftSubtractionConfig = {
      variant: 'draft-subtraction',
      stackCount: 1,
      stackSizes: [this.n],
      opponent: 'human',
      difficulty: 'random',
      endCondition: 'last-wins',
      n: this.n,
      k: this.k,
      poolSize: this.poolSize,
      draftType: this.draftType,
    };
    this.router.navigate(['/play'], { state: { config } });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
