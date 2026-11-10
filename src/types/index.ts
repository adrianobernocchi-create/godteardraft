export type ChampionRole = 'Guardian' | 'Maelstrom' | 'Shaper' | 'Slayer';

export type ChampionTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'Da verificare';

export type VerificationStatus = 'Verificato' | 'Da verificare' | 'Da completare';

export interface Champion {
  id: string;
  nome: string;
  ruolo: ChampionRole;
  tier: ChampionTier;
  sintesi: string;
  forteContro: string;
  deboleContro: string;
  sinergie: string;
  noteTattiche: string;
  immagine?: string;
  statoVerifica: VerificationStatus;
  seguaci?: string; // Followers name in Godtear lore
  linkCommunity?: string;
  linkSteamforged?: string;
  linkObjectiveHex?: string;
}

export type DraftMode = 'individual' | 'teams';
export type DraftOrder = 'alternate' | 'snake' | 'limited_pool';

export interface Player {
  id: string;
  name: string;
  team: 'A' | 'B';
}

export interface DraftConfig {
  mode: DraftMode; // 'individual' (Modalità A) o 'teams' (Modalità B)
  playerCount: 2 | 4 | 6 | 8; // Per Modalità A
  rosterSize: 1 | 2 | 3 | 4; // Per Modalità B (Champion per squadra)
  order: DraftOrder; // 'alternate' (A-B-A-B), 'snake' (A-B-B-A), 'limited_pool' (12-pool A-B-A-B con ban)
  firstTeam: 'A' | 'B';
  teamAName: string;
  teamBName: string;
  players: Player[];
  scenario?: string;
  limitedPool?: string[]; // 12 Champion ID (3 per classe) se formato limited_pool
}

export type DraftTurnType = 'pick' | 'ban';

export interface DraftTurn {
  turnIndex: number; // 0-based
  turnNumber: number; // 1-based display
  team: 'A' | 'B';
  playerId?: string;
  playerName: string;
  type?: DraftTurnType; // 'pick' (default) o 'ban'
}

export interface DraftPick {
  turnIndex: number;
  championId: string;
  team: 'A' | 'B';
  playerId?: string;
  playerName: string;
  timestamp: number;
}

export interface DraftBan {
  turnIndex: number;
  championId: string;
  team: 'A' | 'B';
  playerId?: string;
  playerName: string;
  timestamp: number;
}

export interface DraftSession {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  status: 'in_progress' | 'completed';
  config: DraftConfig;
  turns: DraftTurn[];
  currentTurnIndex: number;
  picks: DraftPick[];
  bans?: DraftBan[];
  roomCode?: string;
  isOnline?: boolean;
}

export type ParticipantRole = 'team_a' | 'team_b' | 'host' | 'spectator';

export interface ParticipantIdentity {
  participantId: string;
  name: string;
  role: ParticipantRole;
  team?: 'A' | 'B';
  playerId?: string;
}

export type AppView = 'home' | 'setup' | 'draft' | 'completed' | 'champions' | 'archive';
