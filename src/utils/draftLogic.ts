import { Champion, ChampionRole, DraftBan, DraftConfig, DraftPick, DraftSession, DraftTurn } from '../types';
import { CHAMPIONS_DATA } from '../data/champions';

/**
 * Generates a default random limited pool of 12 champions:
 * Exactly 3 from each of the 4 classes (Guardian, Maelstrom, Shaper, Slayer).
 */
export function generateDefaultLimitedPool(allChampions: Champion[] = CHAMPIONS_DATA): string[] {
  const roles: ChampionRole[] = ['Guardian', 'Maelstrom', 'Shaper', 'Slayer'];
  const poolIds: string[] = [];

  roles.forEach((role) => {
    const matching = allChampions.filter((c) => c.ruolo === role);
    const shuffled = [...matching].sort(() => Math.random() - 0.5);
    shuffled.slice(0, 3).forEach((c) => poolIds.push(c.id));
  });

  return poolIds;
}

/**
 * Check if a champion is banned in the session.
 */
export function isChampionBanned(championId: string, bans: DraftBan[] = []): boolean {
  return bans.some((b) => b.championId === championId);
}

/**
 * Generates the sequence of draft turns based on mode, player count/roster size, and order.
 */
export function generateDraftTurns(config: DraftConfig): DraftTurn[] {
  const turns: DraftTurn[] = [];
  const first = config.firstTeam || 'A';
  const second = first === 'A' ? 'B' : 'A';

  // Format: Limited Pool A-B-A-B Draft
  // 12 champions pool (3 per class). First player bans 1 of 12. Second player bans 1 of remaining 11.
  // Then players alternate picking champions to play.
  if (config.order === 'limited_pool') {
    if (config.mode === 'individual') {
      const teamAPlayers = config.players.filter(p => p.team === 'A');
      const teamBPlayers = config.players.filter(p => p.team === 'B');
      const countPerTeam = config.playerCount / 2;

      // Ban 1 (First Player / Team)
      const pBan1 = first === 'A' ? teamAPlayers[0] : teamBPlayers[0];
      turns.push({
        turnIndex: 0,
        turnNumber: 1,
        team: first,
        playerId: pBan1?.id,
        playerName: pBan1?.name || (first === 'A' ? config.teamAName : config.teamBName),
        type: 'ban'
      });

      // Ban 2 (Second Player / Team)
      const pBan2 = second === 'A' ? teamAPlayers[0] : teamBPlayers[0];
      turns.push({
        turnIndex: 1,
        turnNumber: 2,
        team: second,
        playerId: pBan2?.id,
        playerName: pBan2?.name || (second === 'A' ? config.teamAName : config.teamBName),
        type: 'ban'
      });

      // Alternating Picks
      for (let i = 0; i < countPerTeam; i++) {
        const p1 = first === 'A' ? teamAPlayers[i] : teamBPlayers[i];
        const p2 = first === 'A' ? teamBPlayers[i] : teamAPlayers[i];

        if (p1) {
          turns.push({
            turnIndex: turns.length,
            turnNumber: turns.length + 1,
            team: first,
            playerId: p1.id,
            playerName: p1.name || `Giocatore ${p1.team}${i + 1}`,
            type: 'pick'
          });
        }
        if (p2) {
          turns.push({
            turnIndex: turns.length,
            turnNumber: turns.length + 1,
            team: second,
            playerId: p2.id,
            playerName: p2.name || `Giocatore ${p2.team}${i + 1}`,
            type: 'pick'
          });
        }
      }
    } else {
      // Teams Mode
      const totalPicks = config.rosterSize * 2;
      const teamAName = config.teamAName || 'Squadra A';
      const teamBName = config.teamBName || 'Squadra B';

      // Ban 1: First Team
      turns.push({
        turnIndex: 0,
        turnNumber: 1,
        team: first,
        playerName: first === 'A' ? teamAName : teamBName,
        type: 'ban'
      });

      // Ban 2: Second Team
      turns.push({
        turnIndex: 1,
        turnNumber: 2,
        team: second,
        playerName: second === 'A' ? teamAName : teamBName,
        type: 'ban'
      });

      // Alternating Picks: A-B-A-B-A-B...
      for (let i = 0; i < totalPicks; i++) {
        const activeTeam = i % 2 === 0 ? first : second;
        const activeName = activeTeam === 'A' ? teamAName : teamBName;
        turns.push({
          turnIndex: turns.length,
          turnNumber: turns.length + 1,
          team: activeTeam,
          playerName: activeName,
          type: 'pick'
        });
      }
    }

    return turns;
  }

  if (config.mode === 'individual') {
    const teamAPlayers = config.players.filter(p => p.team === 'A');
    const teamBPlayers = config.players.filter(p => p.team === 'B');
    const countPerTeam = config.playerCount / 2;

    if (config.order === 'alternate') {
      // Alternato: A1, B1, A2, B2, A3, B3...
      for (let i = 0; i < countPerTeam; i++) {
        const p1 = first === 'A' ? teamAPlayers[i] : teamBPlayers[i];
        const p2 = first === 'A' ? teamBPlayers[i] : teamAPlayers[i];

        if (p1) {
          turns.push({
            turnIndex: turns.length,
            turnNumber: turns.length + 1,
            team: first,
            playerId: p1.id,
            playerName: p1.name || `Giocatore ${p1.team}${i + 1}`,
            type: 'pick'
          });
        }
        if (p2) {
          turns.push({
            turnIndex: turns.length,
            turnNumber: turns.length + 1,
            team: second,
            playerId: p2.id,
            playerName: p2.name || `Giocatore ${p2.team}${i + 1}`,
            type: 'pick'
          });
        }
      }
    } else {
      // Snake: A1, B1, B2, A2, A3, B3, B4, A4...
      // Process players in pairs of rounds
      let aIdx = 0;
      let bIdx = 0;
      for (let round = 0; round < countPerTeam; round++) {
        const isReversedRound = round % 2 === 1;
        const currentFirstTeam = isReversedRound ? second : first;
        const currentSecondTeam = isReversedRound ? first : second;

        const pFirst = currentFirstTeam === 'A' ? teamAPlayers[aIdx++] : teamBPlayers[bIdx++];
        if (pFirst) {
          turns.push({
            turnIndex: turns.length,
            turnNumber: turns.length + 1,
            team: currentFirstTeam,
            playerId: pFirst.id,
            playerName: pFirst.name || `Giocatore ${pFirst.team}${pFirst.id}`,
            type: 'pick'
          });
        }

        const pSecond = currentSecondTeam === 'A' ? teamAPlayers[aIdx++] : teamBPlayers[bIdx++];
        if (pSecond) {
          turns.push({
            turnIndex: turns.length,
            turnNumber: turns.length + 1,
            team: currentSecondTeam,
            playerId: pSecond.id,
            playerName: pSecond.name || `Giocatore ${pSecond.team}${pSecond.id}`,
            type: 'pick'
          });
        }
      }
    }
  } else {
    // Mode B: Teams draft (2 participants selecting 1..4 champions per team)
    const totalPicks = config.rosterSize * 2;
    const teamAName = config.teamAName || 'Squadra A';
    const teamBName = config.teamBName || 'Squadra B';

    for (let i = 0; i < totalPicks; i++) {
      let activeTeam: 'A' | 'B';

      if (config.order === 'alternate') {
        // A-B-A-B-A-B...
        activeTeam = i % 2 === 0 ? first : second;
      } else {
        // Snake: A-B-B-A-A-B-B-A...
        const mod4 = i % 4;
        if (mod4 === 0 || mod4 === 3) {
          activeTeam = first;
        } else {
          activeTeam = second;
        }
      }

      const activeName = activeTeam === 'A' ? teamAName : teamBName;
      turns.push({
        turnIndex: i,
        turnNumber: i + 1,
        team: activeTeam,
        playerName: activeName,
        type: 'pick'
      });
    }
  }

  return turns;
}

/**
 * Returns the list of champions that haven't been picked or banned yet.
 */
export function getAvailableChampions(
  champions: Champion[],
  picks: DraftPick[],
  bans: DraftBan[] = [],
  limitedPool?: string[]
): Champion[] {
  const pickedIds = new Set(picks.map(p => p.championId));
  const bannedIds = new Set(bans.map(b => b.championId));

  return champions.filter(c => {
    if (limitedPool && !limitedPool.includes(c.id)) return false;
    if (pickedIds.has(c.id)) return false;
    if (bannedIds.has(c.id)) return false;
    return true;
  });
}

/**
 * Check if a specific champion has already been drafted.
 */
export function isChampionPicked(championId: string, picks: DraftPick[]): boolean {
  return picks.some(p => p.championId === championId);
}

/**
 * Get all picks assigned to a given team.
 */
export function getTeamPicks(picks: DraftPick[], team: 'A' | 'B'): DraftPick[] {
  return picks.filter(p => p.team === team);
}

/**
 * Returns the required number of champions per team.
 */
export function getTargetSlotsPerTeam(config: DraftConfig): number {
  return config.mode === 'individual' ? config.playerCount / 2 : config.rosterSize;
}

/**
 * Checks if the draft is completely and legitimately finished:
 * Both Team A and Team B must have exactly the target number of champions.
 */
export function isDraftComplete(session: DraftSession): boolean {
  const target = getTargetSlotsPerTeam(session.config);
  const teamAPicks = session.picks.filter(p => p.team === 'A');
  const teamBPicks = session.picks.filter(p => p.team === 'B');
  return teamAPicks.length === target && teamBPicks.length === target;
}

/**
 * Execute a pick or ban on the session.
 */
export function executePick(session: DraftSession, championId: string): DraftSession {
  // If limited pool is configured, ensure champion belongs to it
  if (session.config.limitedPool && !session.config.limitedPool.includes(championId)) {
    throw new Error('Questo Campione non fa parte del Limited Pool di 12 Campioni!');
  }

  // Validate that champion is not already picked
  if (isChampionPicked(championId, session.picks)) {
    throw new Error('Questo Campione è già stato selezionato!');
  }

  // Validate that champion is not already banned
  if (isChampionBanned(championId, session.bans || [])) {
    throw new Error('Questo Campione è stato bannato e non può essere selezionato!');
  }

  if (session.currentTurnIndex >= session.turns.length) {
    throw new Error('Tutti i turni previsti dal draft sono già stati completati!');
  }

  const currentTurn = session.turns[session.currentTurnIndex];

  // Case 1: Ban Turn
  if (currentTurn.type === 'ban') {
    const newBan: DraftBan = {
      turnIndex: session.currentTurnIndex,
      championId,
      team: currentTurn.team,
      playerId: currentTurn.playerId,
      playerName: currentTurn.playerName,
      timestamp: Date.now()
    };

    const updatedBans = [...(session.bans || []), newBan];
    const nextTurnIndex = session.currentTurnIndex + 1;

    return {
      ...session,
      updatedAt: new Date().toISOString(),
      currentTurnIndex: nextTurnIndex,
      bans: updatedBans,
      status: 'in_progress'
    };
  }

  // Case 2: Pick Turn
  const targetSlots = getTargetSlotsPerTeam(session.config);
  const currentTeamPicks = session.picks.filter(p => p.team === currentTurn.team);
  if (currentTeamPicks.length >= targetSlots) {
    throw new Error(`La Squadra ${currentTurn.team} ha già completato il proprio roster di ${targetSlots} Campioni!`);
  }

  const newPick: DraftPick = {
    turnIndex: session.currentTurnIndex,
    championId,
    team: currentTurn.team,
    playerId: currentTurn.playerId,
    playerName: currentTurn.playerName,
    timestamp: Date.now()
  };

  const updatedPicks = [...session.picks, newPick];
  const nextTurnIndex = session.currentTurnIndex + 1;
  const teamAPicks = updatedPicks.filter(p => p.team === 'A');
  const teamBPicks = updatedPicks.filter(p => p.team === 'B');
  const isFullyComplete = teamAPicks.length === targetSlots && teamBPicks.length === targetSlots;

  return {
    ...session,
    updatedAt: new Date().toISOString(),
    status: isFullyComplete ? 'completed' : 'in_progress',
    currentTurnIndex: nextTurnIndex,
    picks: updatedPicks
  };
}

/**
 * Undo the last selection or ban made.
 */
export function undoLastPick(session: DraftSession): DraftSession {
  if (session.currentTurnIndex === 0) {
    return session;
  }

  const previousTurnIndex = session.currentTurnIndex - 1;
  const previousTurn = session.turns[previousTurnIndex];

  if (previousTurn?.type === 'ban') {
    const newBans = (session.bans || []).filter(b => b.turnIndex !== previousTurnIndex);
    return {
      ...session,
      updatedAt: new Date().toISOString(),
      status: 'in_progress',
      currentTurnIndex: previousTurnIndex,
      bans: newBans
    };
  }

  const newPicks = session.picks.filter(p => p.turnIndex !== previousTurnIndex);
  return {
    ...session,
    updatedAt: new Date().toISOString(),
    status: 'in_progress',
    currentTurnIndex: previousTurnIndex,
    picks: newPicks
  };
}


/**
 * Manually change the active turn index.
 */
export function manualChangeTurn(session: DraftSession, targetTurnIndex: number): DraftSession {
  if (targetTurnIndex < 0 || targetTurnIndex >= session.turns.length) {
    return session;
  }

  return {
    ...session,
    updatedAt: new Date().toISOString(),
    currentTurnIndex: targetTurnIndex,
    status: 'in_progress'
  };
}

/**
 * Correct an existing assignment (change team or player, or unassign).
 */
export function correctAssignment(
  session: DraftSession,
  championId: string,
  newTeam: 'A' | 'B',
  newPlayerId?: string,
  newPlayerName?: string
): DraftSession {
  const targetSlots = getTargetSlotsPerTeam(session.config);
  const currentPick = session.picks.find(p => p.championId === championId);

  // If changing team, ensure target team does not exceed max roster size
  if (currentPick && currentPick.team !== newTeam) {
    const targetTeamPicks = session.picks.filter(p => p.team === newTeam);
    if (targetTeamPicks.length >= targetSlots) {
      throw new Error(
        `Impossibile riassegnare alla Squadra ${newTeam}: il roster è già al completo con ${targetSlots} Campioni.`
      );
    }
  }

  const updatedPicks = session.picks.map(pick => {
    if (pick.championId === championId) {
      return {
        ...pick,
        team: newTeam,
        playerId: newPlayerId ?? pick.playerId,
        playerName: newPlayerName ?? (newTeam === 'A' ? session.config.teamAName : session.config.teamBName)
      };
    }
    return pick;
  });

  const teamAPicks = updatedPicks.filter(p => p.team === 'A');
  const teamBPicks = updatedPicks.filter(p => p.team === 'B');
  const isFullyComplete = teamAPicks.length === targetSlots && teamBPicks.length === targetSlots;

  return {
    ...session,
    updatedAt: new Date().toISOString(),
    status: isFullyComplete ? 'completed' : 'in_progress',
    picks: updatedPicks
  };
}

/**
 * Remove an assigned champion back to the pool (or remove a ban).
 */
export function removeAssignment(session: DraftSession, championId: string): DraftSession {
  const isBanned = session.bans?.some(b => b.championId === championId);
  if (isBanned) {
    const updatedBans = (session.bans || []).filter(b => b.championId !== championId);
    return {
      ...session,
      updatedAt: new Date().toISOString(),
      status: 'in_progress',
      bans: updatedBans
    };
  }

  const updatedPicks = session.picks.filter(p => p.championId !== championId);
  return {
    ...session,
    updatedAt: new Date().toISOString(),
    status: 'in_progress',
    picks: updatedPicks
  };
}


/**
 * Export a session to formatted JSON string.
 */
export function exportDraftToJson(session: DraftSession): string {
  const payload = {
    app: 'Godtear Draft Assistant',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    session
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Import a session from JSON string.
 */
export function importDraftFromJson(
  jsonString: string
): { success: boolean; session?: DraftSession; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    const session: DraftSession = parsed.session || parsed;

    if (!session || !session.config || !session.turns || !Array.isArray(session.picks)) {
      return { success: false, error: 'Struttura JSON non valida per una sessione di Godtear Draft.' };
    }

    if (!session.id || !session.config.mode) {
      return { success: false, error: 'Dati di configurazione essenziali mancanti nel file.' };
    }

    return {
      success: true,
      session: {
        ...session,
        id: session.id || `session_${Date.now()}`,
        name: session.name || 'Draft Importato'
      }
    };
  } catch {
    return { success: false, error: 'Sintassi JSON non valida o file corrotto.' };
  }
}

/**
 * Format timestamp into readable Italian date.
 */
export function formatItalianDate(dateStrOrTs: string | number): string {
  try {
    const d = new Date(dateStrOrTs);
    return d.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(dateStrOrTs);
  }
}
