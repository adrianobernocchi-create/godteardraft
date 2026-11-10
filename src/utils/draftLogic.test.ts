import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateDraftTurns,
  executePick,
  undoLastPick,
  manualChangeTurn,
  correctAssignment,
  removeAssignment,
  isDraftComplete,
  exportDraftToJson,
  importDraftFromJson,
  getAvailableChampions,
  generateDefaultLimitedPool
} from './draftLogic';

import { DraftConfig, DraftSession } from '../types';
import { CHAMPIONS_DATA } from '../data/champions';

test('Mode A (Individual) 4 players alternate order', () => {
  const config: DraftConfig = {
    mode: 'individual',
    playerCount: 4,
    rosterSize: 3,
    order: 'alternate',
    firstTeam: 'A',
    teamAName: 'Team Solaris',
    teamBName: 'Team Umbra',
    players: [
      { id: 'p1', name: 'Marco', team: 'A' },
      { id: 'p2', name: 'Luca', team: 'A' },
      { id: 'p3', name: 'Giulia', team: 'B' },
      { id: 'p4', name: 'Elena', team: 'B' }
    ]
  };

  const turns = generateDraftTurns(config);
  assert.equal(turns.length, 4);
  assert.equal(turns[0].team, 'A');
  assert.equal(turns[0].playerName, 'Marco');
  assert.equal(turns[1].team, 'B');
  assert.equal(turns[1].playerName, 'Giulia');
  assert.equal(turns[2].team, 'A');
  assert.equal(turns[2].playerName, 'Luca');
  assert.equal(turns[3].team, 'B');
  assert.equal(turns[3].playerName, 'Elena');
});

test('Mode A (Individual) 4 players snake order', () => {
  const config: DraftConfig = {
    mode: 'individual',
    playerCount: 4,
    rosterSize: 3,
    order: 'snake',
    firstTeam: 'A',
    teamAName: 'Team Solaris',
    teamBName: 'Team Umbra',
    players: [
      { id: 'p1', name: 'Marco', team: 'A' },
      { id: 'p2', name: 'Luca', team: 'A' },
      { id: 'p3', name: 'Giulia', team: 'B' },
      { id: 'p4', name: 'Elena', team: 'B' }
    ]
  };

  const turns = generateDraftTurns(config);
  assert.equal(turns.length, 4);
  // Round 0: A1, B1 -> Marco, Giulia
  assert.equal(turns[0].team, 'A');
  assert.equal(turns[0].playerName, 'Marco');
  assert.equal(turns[1].team, 'B');
  assert.equal(turns[1].playerName, 'Giulia');
  // Round 1 (reversed): B2, A2 -> Elena, Luca
  assert.equal(turns[2].team, 'B');
  assert.equal(turns[2].playerName, 'Elena');
  assert.equal(turns[3].team, 'A');
  assert.equal(turns[3].playerName, 'Luca');
});

test('Mode B (Teams) 3 champions per team with snake order', () => {
  const config: DraftConfig = {
    mode: 'teams',
    playerCount: 4,
    rosterSize: 3,
    order: 'snake',
    firstTeam: 'A',
    teamAName: 'Custodi',
    teamBName: 'Cacciatori',
    players: []
  };

  const turns = generateDraftTurns(config);
  assert.equal(turns.length, 6);
  // Snake pattern for 6 picks: A, B, B, A, A, B
  assert.equal(turns[0].team, 'A');
  assert.equal(turns[1].team, 'B');
  assert.equal(turns[2].team, 'B');
  assert.equal(turns[3].team, 'A');
  assert.equal(turns[4].team, 'A');
  assert.equal(turns[5].team, 'B');
});

test('Draft execution, duplicates prevention, undo and reassignment', () => {
  const config: DraftConfig = {
    mode: 'teams',
    playerCount: 2,
    rosterSize: 2,
    order: 'alternate',
    firstTeam: 'A',
    teamAName: 'Team A',
    teamBName: 'Team B',
    players: []
  };

  const turns = generateDraftTurns(config);
  let session: DraftSession = {
    id: 'test_session',
    name: 'Test Session',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'in_progress',
    config,
    turns,
    currentTurnIndex: 0,
    picks: []
  };

  // Pick 1: Finvarr by Team A
  session = executePick(session, 'finvarr');
  assert.equal(session.picks.length, 1);
  assert.equal(session.picks[0].championId, 'finvarr');
  assert.equal(session.picks[0].team, 'A');
  assert.equal(session.currentTurnIndex, 1);
  assert.equal(session.status, 'in_progress');

  // Verify Finvarr is no longer available
  const available = getAvailableChampions(CHAMPIONS_DATA, session.picks);
  assert.equal(available.length, 26);
  assert.equal(available.some(c => c.id === 'finvarr'), false);

  // Attempt duplicate pick should throw
  assert.throws(() => {
    executePick(session, 'finvarr');
  }, /già stato selezionato/);

  // Pick 2: Rhodri by Team B
  session = executePick(session, 'rhodri');
  assert.equal(session.picks.length, 2);
  assert.equal(session.picks[1].championId, 'rhodri');
  assert.equal(session.picks[1].team, 'B');

  // Test Undo
  session = undoLastPick(session);
  assert.equal(session.picks.length, 1);
  assert.equal(session.currentTurnIndex, 1);
  assert.equal(session.picks[0].championId, 'finvarr');

  // Test manual change turn
  session = manualChangeTurn(session, 3);
  assert.equal(session.currentTurnIndex, 3);

  // Test assignment correction
  session = correctAssignment(session, 'finvarr', 'B', undefined, 'Team B');
  assert.equal(session.picks[0].team, 'B');
  assert.equal(session.picks[0].playerName, 'Team B');
});

test('Export and Import JSON validation', () => {
  const config: DraftConfig = {
    mode: 'teams',
    playerCount: 2,
    rosterSize: 2,
    order: 'alternate',
    firstTeam: 'A',
    teamAName: 'Alfa',
    teamBName: 'Omega',
    players: []
  };
  const turns = generateDraftTurns(config);
  const session: DraftSession = {
    id: 'export_test',
    name: 'Draft Partita Finale',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'completed',
    config,
    turns,
    currentTurnIndex: 4,
    picks: [
      { turnIndex: 0, championId: 'finvarr', team: 'A', playerName: 'Alfa', timestamp: 100 },
      { turnIndex: 1, championId: 'rhodri', team: 'B', playerName: 'Omega', timestamp: 200 }
    ]
  };

  const jsonStr = exportDraftToJson(session);
  assert.equal(typeof jsonStr, 'string');
  assert.ok(jsonStr.includes('Godtear Draft Assistant'));

  const importResult = importDraftFromJson(jsonStr);
  assert.equal(importResult.success, true);
  assert.ok(importResult.session);
  assert.equal(importResult.session?.id, 'export_test');
  assert.equal(importResult.session?.picks.length, 2);

  const invalidResult = importDraftFromJson('{"broken": true}');
  assert.equal(invalidResult.success, false);
});

test('Full roster completeness required to complete draft and prevent team overflow', () => {
  const config: DraftConfig = {
    mode: 'teams',
    playerCount: 2,
    rosterSize: 2,
    order: 'alternate',
    firstTeam: 'A',
    teamAName: 'Custodi',
    teamBName: 'Campioni',
    players: []
  };

  const turns = generateDraftTurns(config);
  let session: DraftSession = {
    id: 'test_completion',
    name: 'Test Roster Completeness',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'in_progress',
    config,
    turns,
    currentTurnIndex: 0,
    picks: []
  };

  // Turn 0: Team A picks Finvarr
  session = executePick(session, 'finvarr');
  assert.equal(isDraftComplete(session), false);
  assert.equal(session.status, 'in_progress');

  // Turn 1: Team B picks Rhodri
  session = executePick(session, 'rhodri');
  assert.equal(isDraftComplete(session), false);

  // Turn 2: Team A picks Titus -> Team A has 2/2, Team B has 1/2
  session = executePick(session, 'titus');
  assert.equal(isDraftComplete(session), false);
  assert.equal(session.status, 'in_progress');

  // Attempting to pick for Team A again when Team A already has 2 should throw
  assert.throws(() => {
    executePick({ ...session, currentTurnIndex: 0 }, 'lily');
  }, /già completato il proprio roster/);

  // Turn 3: Team B picks Lily -> Both teams have 2/2!
  session = executePick(session, 'lily');
  assert.equal(isDraftComplete(session), true);
  assert.equal(session.status, 'completed');

  // If we remove an assignment from Team A, status must revert to in_progress
  session = removeAssignment(session, 'finvarr');
  assert.equal(isDraftComplete(session), false);
  assert.equal(session.status, 'in_progress');

  // Trying to reassign Titus from Team A to Team B when Team B is full (2/2) should throw
  assert.throws(() => {
    correctAssignment(session, 'titus', 'B');
  }, /già al completo/);
});

test('Limited Pool Draft Format (12 Pool: 3 per role, 2 Bans, alternating picks)', () => {
  const pool = generateDefaultLimitedPool(CHAMPIONS_DATA);
  assert.equal(pool.length, 12);

  // Verify class breakdown: exactly 3 of each role
  const roleCounts: Record<string, number> = { Guardian: 0, Maelstrom: 0, Shaper: 0, Slayer: 0 };
  pool.forEach(id => {
    const c = CHAMPIONS_DATA.find(ch => ch.id === id);
    if (c) roleCounts[c.ruolo]++;
  });
  assert.equal(roleCounts.Guardian, 3);
  assert.equal(roleCounts.Maelstrom, 3);
  assert.equal(roleCounts.Shaper, 3);
  assert.equal(roleCounts.Slayer, 3);

  // Setup config for 3v3 Limited Pool draft
  const config: DraftConfig = {
    mode: 'teams',
    playerCount: 2,
    rosterSize: 3,
    order: 'limited_pool',
    firstTeam: 'A',
    teamAName: 'Team Solaris',
    teamBName: 'Team Lunaris',
    players: [],
    limitedPool: pool
  };

  const turns = generateDraftTurns(config);
  // 2 Bans + 6 Picks = 8 turns total
  assert.equal(turns.length, 8);
  assert.equal(turns[0].type, 'ban');
  assert.equal(turns[0].team, 'A');
  assert.equal(turns[1].type, 'ban');
  assert.equal(turns[1].team, 'B');

  // Next 6 turns are alternating picks (A, B, A, B, A, B)
  assert.equal(turns[2].type, 'pick');
  assert.equal(turns[2].team, 'A');
  assert.equal(turns[3].type, 'pick');
  assert.equal(turns[3].team, 'B');
  assert.equal(turns[4].type, 'pick');
  assert.equal(turns[4].team, 'A');
  assert.equal(turns[5].type, 'pick');
  assert.equal(turns[5].team, 'B');
  assert.equal(turns[6].type, 'pick');
  assert.equal(turns[6].team, 'A');
  assert.equal(turns[7].type, 'pick');
  assert.equal(turns[7].team, 'B');

  let session: DraftSession = {
    id: 'test_limited_pool',
    name: 'Test Limited Pool',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'in_progress',
    config,
    turns,
    currentTurnIndex: 0,
    picks: [],
    bans: []
  };

  // Team A Bans first champion from pool
  const ban1Champ = pool[0];
  session = executePick(session, ban1Champ);
  assert.equal(session.bans?.length, 1);
  assert.equal(session.bans?.[0].championId, ban1Champ);
  assert.equal(session.bans?.[0].team, 'A');
  assert.equal(session.currentTurnIndex, 1);
  assert.equal(session.picks.length, 0);

  // Team B Bans second champion from pool
  const ban2Champ = pool[1];
  session = executePick(session, ban2Champ);
  assert.equal(session.bans?.length, 2);
  assert.equal(session.bans?.[1].championId, ban2Champ);
  assert.equal(session.bans?.[1].team, 'B');
  assert.equal(session.currentTurnIndex, 2);

  // Undoing last ban should remove Team B's ban
  session = undoLastPick(session);
  assert.equal(session.bans?.length, 1);
  assert.equal(session.currentTurnIndex, 1);

  // Re-ban for Team B
  session = executePick(session, ban2Champ);
  assert.equal(session.bans?.length, 2);
  assert.equal(session.currentTurnIndex, 2);

  // Attempting to pick a banned champion should throw
  assert.throws(() => {
    executePick(session, ban1Champ);
  }, /bannato/);

  // Turn 2: Team A picks pool[2]
  session = executePick(session, pool[2]);
  assert.equal(session.picks.length, 1);
  assert.equal(session.picks[0].team, 'A');

  // Turn 3: Team B picks pool[3]
  session = executePick(session, pool[3]);
  assert.equal(session.picks.length, 2);
  assert.equal(session.picks[1].team, 'B');

  // Picks continue: pool[4], pool[5], pool[6], pool[7]
  session = executePick(session, pool[4]); // A
  session = executePick(session, pool[5]); // B
  session = executePick(session, pool[6]); // A (Team A completes 3/3)
  assert.equal(isDraftComplete(session), false);

  session = executePick(session, pool[7]); // B (Team B completes 3/3)
  assert.equal(isDraftComplete(session), true);
  assert.equal(session.status, 'completed');
  assert.equal(session.picks.length, 6);
  assert.equal(session.bans?.length, 2);
});

