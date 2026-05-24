import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-partisan-subtraction-panel',
  templateUrl: './partisan-subtraction-panel.html',
  styleUrl: './partisan-subtraction-panel.scss',
})
export class PartisanSubtractionPanel {
  readonly p1Win = input.required<boolean[]>();
  readonly p2Win = input.required<boolean[]>();
  readonly heapSize = input<number>(0);
  readonly prePeriodLength = input<number>(0);
  readonly periodLength = input<number>(1);

  /** Effective length to render (pre-period + first period). */
  readonly displayLength = computed(() => this.p1Win().length);

  readonly currentP1 = computed(() => this.lookup(this.p1Win(), this.heapSize()));
  readonly currentP2 = computed(() => this.lookup(this.p2Win(), this.heapSize()));

  /** Returns the boolean value at heap n, using modular arithmetic if beyond the pre-period. */
  private lookup(arr: boolean[], n: number): boolean | null {
    if (n < 0 || arr.length === 0) return null;
    if (n < this.prePeriodLength()) return arr[n];
    const idx = this.prePeriodLength() + ((n - this.prePeriodLength()) % this.periodLength());
    return arr[idx] ?? null;
  }
}
