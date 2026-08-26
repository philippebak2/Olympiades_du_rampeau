export interface Player {
  id: number; // Numéro attribué au joueur (ex: 1, 2, 3...)
  name: string;
  team: string; // Nom de l'équipe ou club (ex: Quilleurs d'Alsace, AS Bowling, etc.)
  notes?: string;
}

export interface PoulePlayerScore {
  playerId: number;
  tirs: number[]; // Scores des tirs du tour actuel (ex: [7, 8] pour Tour 1, [9] pour Tour 2)
  previousCumulativeScore?: number; // Total cumulé des tours précédents
  tieBreakScore?: number; // Score de barrage/départage si égalité stricte pour la qualification
  isManuallyOverridden?: boolean;
}

export interface Poule {
  id: string;
  name: string; // "Poule 1", "Poule A", etc.
  roundNumber: 1 | 2 | 3;
  playerScores: PoulePlayerScore[];
  qualifyCount: number; // Nombre de qualifiés pour cette poule
}

export type FinalRoundType = 'roundOf16' | 'quarterFinals' | 'semiFinals' | 'thirdPlace' | 'final';

export interface FinalMatch {
  id: string;
  round: FinalRoundType;
  matchIndex: number;
  label: string; // ex: "8ème 1 : A1 vs B4"
  player1Id: number | null;
  player2Id: number | null;
  player1Placeholder: string; // ex: "1er Poule A (A1)"
  player2Placeholder: string; // ex: "4ème Poule B (B4)"
  score1: number | null; // Nombre de quilles (0-9)
  score2: number | null;
  tieBreak1?: number | null; // Tir(s) de barrage si égalité
  tieBreak2?: number | null;
  winnerId: number | null;
  loserId: number | null;
  isComplete: boolean;
}

export interface TournamentSettings {
  round1PoolCount: number; // Défaut: 16 poules (ou selon nombre de joueurs)
  round1QualifiersPerPool: number; // Défaut: 5
  round1ThrowsCount: number; // 2 tirs sur 9 quilles
  
  round2PoolCount: number; // Défaut: 8 poules
  round2QualifiersPerPool: number; // Défaut: 5
  round2ThrowsCount: number; // 1 tir sur 9 quilles
  
  round3PoolCount: number; // Défaut: 4 poules (A, B, C, D)
  round3QualifiersPerPool: number; // Défaut: 4 (16 qualifiés pour 1/8)
  round3ThrowsCount: number; // 1 tir sur 9 quilles

  pinsCount: number; // 9 quilles
}

export type TournamentTab = 'participants' | 'tour1' | 'tour2' | 'tour3' | 'phasesFinales' | 'equipes' | 'stats';

export interface TeamStandingPlayer {
  playerId: number;
  playerName: string;
  points: number;
  stageReached: string;
  isEliminated: boolean;
  totalPinsKnocked: number;
}

export interface TeamStanding {
  teamName: string;
  totalPoints: number;
  playerCount: number;
  activePlayerCount: number;
  eliminatedPlayerCount: number;
  totalPins: number;
  players: TeamStandingPlayer[];
}

export interface TournamentData {
  title: string;
  date: string;
  location: string;
  players: Player[];
  settings: TournamentSettings;
  tour1Poules: Poule[];
  tour2Poules: Poule[];
  tour3Poules: Poule[];
  finalMatches: FinalMatch[];
  isTour1Started: boolean;
  isTour2Started: boolean;
  isTour3Started: boolean;
  isFinalsStarted: boolean;
}
