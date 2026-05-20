import { ClassicNimConfig } from './classic/classic-nim.models';
import { DraftSubtractionConfig } from './draft-subtraction/draft-subtraction.models';

export type GameConfig = ClassicNimConfig | DraftSubtractionConfig;
