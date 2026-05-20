export type OpponentType = 'human' | 'computer';
export type ComputerDifficulty = 'random' | 'expert';
export type EndCondition = 'last-wins' | 'last-loses';
export type GameVariant = 'classic' | 'draft-subtraction';

export interface GameState {
  stacks: number[];
  currentPlayer: 1 | 2;
  isGameOver: boolean;
  winner: 1 | 2 | null;
  lastMove: { stackIndex: number; amount: number } | null;
  moveHistory: { player: 1 | 2; stackIndex: number; amount: number }[];
}

export interface GameConfigBase {
  variant: GameVariant;
  stackCount: number;
  stackSizes: number[];
  opponent: OpponentType;
  difficulty: ComputerDifficulty;
  endCondition: EndCondition;
}

export interface VariantInfo {
  name: string;
  description: string;
  implemented: boolean;
}
