import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-sg-cheat-panel',
  templateUrl: './sg-cheat-panel.html',
  styleUrl: './sg-cheat-panel.scss',
})
export class SgCheatPanel {
  readonly values = input.required<number[]>();
  readonly heapSize = input<number>(0);

  readonly currentGrundy = computed(() => {
    const vals = this.values();
    const h = this.heapSize();
    if (h < 0 || h >= vals.length) return null;
    return vals[h];
  });
}
