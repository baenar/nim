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

  readonly discs = computed(() => {
    const h = this.height();
    return Array.from({ length: h }, (_, i) => i);
  });

  readonly isEmpty = computed(() => this.height() === 0);
}
