export type GameMode = 'ai' | 'local' | 'analysis' | 'ghost' | 'quantum';

export interface GameSettings {
  aiDifficulty: number;
  timeControl: number;
  showHints: boolean;
  ghostRevealPowerups: number;
}

export interface GameState {
  fen: string;
  pgn: string;
  moves: string[];
  evaluation?: number;
  visiblePieces: Set<string>;
}

export interface VisiblePiece {
  square: string;
  type: string;
  color: 'w' | 'b';
}

export interface QuantumState {
  square: string;
  probability: number;
  piece: {
    type: string;
    color: 'w' | 'b';
  };
}

export interface EntangledPair {
  piece1: QuantumState;
  piece2: QuantumState;
}