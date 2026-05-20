import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-disc-stack',
  imports: [],
  templateUrl: './disc-stack.html',
  styleUrl: './disc-stack.scss',
})
export class DiscStack {
  readonly height = input.required<number>();
  readonly maxHeight = input<number>(15);
  readonly selected = input<boolean>(false);
  readonly stackIndex = input<number>(0);

  private static readonly MAX_VISIBLE = 18;
  private static readonly HALF = 9;

  /** Whether we need to split with an ellipsis */
  readonly isTruncated = computed(() => this.height() > DiscStack.MAX_VISIBLE);

  /** Bottom discs (always rendered) */
  readonly bottomDiscs = computed(() => {
    const h = this.height();
    if (h <= DiscStack.MAX_VISIBLE) {
      return Array.from({ length: h }, (_, i) => i);
    }
    return Array.from({ length: DiscStack.HALF }, (_, i) => i);
  });

  /** Top discs (only rendered when truncated) */
  readonly topDiscs = computed(() => {
    const h = this.height();
    if (h <= DiscStack.MAX_VISIBLE) return [];
    const startIndex = h - DiscStack.HALF;
    return Array.from({ length: DiscStack.HALF }, (_, i) => startIndex + i);
  });

  /** How many discs are hidden in the ellipsis */
  readonly hiddenCount = computed(() => {
    const h = this.height();
    return Math.max(0, h - DiscStack.MAX_VISIBLE);
  });

  readonly isEmpty = computed(() => this.height() === 0);
}
