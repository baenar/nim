import { Component, input } from '@angular/core';

@Component({
  selector: 'app-draft-cheat-panel',
  templateUrl: './draft-cheat-panel.html',
  styleUrl: './draft-cheat-panel.scss',
})
export class DraftCheatPanel {
  readonly winning = input.required<number[]>();
  readonly losing = input.required<number[]>();
  readonly isComputing = input<boolean>(false);
}
