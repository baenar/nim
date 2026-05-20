import { Component, computed, input } from '@angular/core';
import { EndCondition } from '../../models/shared/game-state.models';

@Component({
  selector: 'app-xor-panel',
  templateUrl: './xor-panel.html',
  styleUrl: './xor-panel.scss',
})
export class XorPanel {
  readonly stacks = input.required<number[]>();
  readonly endCondition = input<EndCondition>('last-wins');

  readonly bitLength = computed(() => {
    const max = Math.max(...this.stacks(), 0);
    return max === 0 ? 1 : Math.floor(Math.log2(max)) + 1;
  });

  readonly rows = computed(() =>
    this.stacks().map((size, i) => ({
      label: `${size}`,
      bits: this.toBits(size),
    })),
  );

  readonly nimSum = computed(() =>
    this.stacks().reduce((xor, s) => xor ^ s, 0),
  );

  readonly nimSumBits = computed(() => this.toBits(this.nimSum()));

  /**
   * In normal Nim (last-wins): winning iff nim-sum ≠ 0.
   * In misère Nim (last-loses): same EXCEPT when all heaps ≤ 1,
   * where it flips — winning iff nim-sum = 0 (even number of 1-heaps).
   */
  readonly isWinning = computed(() => {
    const nimSum = this.nimSum();
    const stacks = this.stacks();

    if (this.endCondition() === 'last-loses') {
      const nonZero = stacks.filter(s => s > 0);
      const allOnes = nonZero.every(s => s === 1);
      if (allOnes) {
        // Even 1-heaps = winning (take one, opponent eventually takes last)
        return nonZero.length % 2 === 0;
      }
    }

    return nimSum !== 0;
  });

  private toBits(value: number): number[] {
    const len = this.bitLength();
    const bits: number[] = [];
    for (let i = len - 1; i >= 0; i--) {
      bits.push((value >> i) & 1);
    }
    return bits;
  }
}
