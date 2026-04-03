import { Routes } from '@angular/router';
import { MainMenu } from './components/main-menu/main-menu';
import { ClassicNimSettings } from './components/settings/classic/classic-nim-settings';
import { GameBoard } from './components/game-board/game-board';

export const routes: Routes = [
  { path: '', component: MainMenu },
  { path: 'settings/classic', component: ClassicNimSettings },
  { path: 'play', component: GameBoard },
  { path: '**', redirectTo: '' },
];
