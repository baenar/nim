import { ClassicNimConfig } from './classic/classic-nim.models';
import { GreedyNimConfig } from './greedy/greedy-nim.models';

export type GameConfig = ClassicNimConfig | GreedyNimConfig;
