import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VARIANT_INFO } from '../../models/shared/variant-registry';
import { GameVariant } from '../../models/shared/game-state.models';

@Component({
  selector: 'app-main-menu',
  imports: [RouterLink],
  templateUrl: './main-menu.html',
  styleUrl: './main-menu.scss',
})
export class MainMenu {
  readonly variants: { key: GameVariant; name: string; description: string; implemented: boolean }[] =
    (Object.entries(VARIANT_INFO) as [GameVariant, (typeof VARIANT_INFO)[GameVariant]][]).map(
      ([key, info]) => ({ key, ...info })
    );
}
