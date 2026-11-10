import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Edit3,
  Sliders,
  BookOpen,
  Check,
  Search,
  Flag,
  User,
  Users,
  Save,
  CheckCircle2,
  Trash2,
  Plus,
  AlertTriangle,
  XCircle,
  Share2,
  Copy,
  Wifi,
  UserCheck,
  Globe,
  Ban,
  Sparkles
} from 'lucide-react';
import {
  Champion,
  ChampionRole,
  ChampionTier,
  DraftPick,
  DraftSession,
  ParticipantIdentity,
  ParticipantRole
} from '../types';
import { CHAMPIONS_DATA, ROLE_INFO } from '../data/champions';
import { RoleBadge } from './RoleBadge';
import { ChampionEmblem } from './ChampionEmblem';
import { ChampionDetailModal } from './ChampionDetailModal';
import {
  executePick,
  undoLastPick,
  manualChangeTurn,
  correctAssignment,
  removeAssignment,
  isChampionPicked,
  isChampionBanned,
  getTargetSlotsPerTeam,
  isDraftComplete as checkDraftComplete
} from '../utils/draftLogic';
import { getSavedIdentity, saveIdentity } from '../utils/onlineDraftClient';

interface DraftViewProps {
  session: DraftSession;
  onUpdateSession: (newSession: DraftSession) => void;
  onConcludeDraft: (finalSession?: DraftSession) => void;
  onPauseAndExit: () => void;
  onAbortDraft: () => void;
}

export const DraftView: React.FC<DraftViewProps> = ({
  session,
  onUpdateSession,
  onConcludeDraft,
  onPauseAndExit,
  onAbortDraft
}) => {
  // Champion inspection modal
  const [inspectingChampion, setInspectingChampion] = useState<Champion | null>(null);

  // Standalone consultation modal / drawer toggle
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);

  // Manual turn change modal
  const [isManualTurnModalOpen, setIsManualTurnModalOpen] = useState(false);

  // Assignment correction modal
  const [editingPick, setEditingPick] = useState<DraftPick | null>(null);
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  // Abort and cancel draft confirmation modal
  const [isAbortModalOpen, setIsAbortModalOpen] = useState(false);

  // Online identity modal & state
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const [userIdentity, setUserIdentity] = useState<ParticipantIdentity>(() => {
    const saved = session.roomCode ? getSavedIdentity(session.roomCode) : null;
    return saved || {
      participantId: `p_${Date.now()}`,
      name: 'Ospite',
      role: 'spectator'
    };
  });

  // Filter state for champion picker
  const [selectedRole, setSelectedRole] = useState<ChampionRole | 'Tutti'>('Tutti');
  const [selectedTier, setSelectedTier] = useState<ChampionTier | 'Tutti'>('Tutti');
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'available' | 'all' | 'picked'>('available');
  const [poolScopeFilter, setPoolScopeFilter] = useState<'limited' | 'all'>(
    session.config.order === 'limited_pool' ? 'limited' : 'all'
  );

  const { config, turns, currentTurnIndex, picks } = session;
  const targetSlotsPerTeam = getTargetSlotsPerTeam(config);
  const teamAPicks = picks.filter((p) => p.team === 'A');
  const teamBPicks = picks.filter((p) => p.team === 'B');
  const isRosterCompleteA = teamAPicks.length === targetSlotsPerTeam;
  const isRosterCompleteB = teamBPicks.length === targetSlotsPerTeam;
  const isDraftComplete = isRosterCompleteA && isRosterCompleteB;
  const hasRemainingTurns = currentTurnIndex < turns.length;
  const currentTurn = hasRemainingTurns ? turns[currentTurnIndex] : null;
  const isBanTurn = currentTurn?.type === 'ban';


  // Auto-dismiss feedback message
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  // Copy room share link
  const handleCopyShareLink = async () => {
    if (!session.roomCode) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${session.roomCode}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      setFeedbackMessage(`Link della stanza: ${shareUrl}`);
    }
  };

  // Save selected identity
  const handleSelectIdentity = (role: ParticipantRole, team?: 'A' | 'B', name?: string) => {
    const newIdent: ParticipantIdentity = {
      participantId: userIdentity.participantId,
      name: name || (role === 'team_a' ? config.teamAName : role === 'team_b' ? config.teamBName : 'Spettatore'),
      role,
      team
    };
    setUserIdentity(newIdent);
    if (session.roomCode) {
      saveIdentity(session.roomCode, newIdent);
    }
    setIsIdentityModalOpen(false);
  };

  // Filter champions
  const filteredChampions = CHAMPIONS_DATA.filter((champ) => {
    // Limited pool scope filter
    if (config.order === 'limited_pool' && config.limitedPool && poolScopeFilter === 'limited') {
      if (!config.limitedPool.includes(champ.id)) return false;
    }

    // Role filter
    if (selectedRole !== 'Tutti' && champ.ruolo !== selectedRole) {
      return false;
    }
    // Tier filter
    if (selectedTier !== 'Tutti' && champ.tier !== selectedTier) {
      return false;
    }
    // Search query
    if (
      searchQuery.trim() &&
      !champ.nome.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !champ.sintesi.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    // Availability filter
    const picked = isChampionPicked(champ.id, picks);
    const banned = isChampionBanned(champ.id, session.bans || []);
    if (availabilityFilter === 'available' && (picked || banned)) return false;
    if (availabilityFilter === 'picked' && !picked && !banned) return false;

    return true;
  });

  // Handle Pick or Ban Champion (passes updated session with all picks/bans)
  const handleSelectChampion = (championId: string) => {
    try {
      const updated = executePick(session, championId);
      onUpdateSession(updated);
      if (updated.status === 'completed') {
        onConcludeDraft(updated);
      }
    } catch (err: unknown) {
      setFeedbackMessage(err instanceof Error ? err.message : 'Errore durante la selezione del Campione.');
    }
  };

  // Handle Undo Last Pick or Ban
  const handleUndo = () => {
    if (picks.length === 0 && (!session.bans || session.bans.length === 0)) return;
    const updated = undoLastPick(session);
    onUpdateSession(updated);
  };


  // Handle Manual Turn Change
  const handleConfirmTurnChange = (newTurnIndex: number) => {
    const updated = manualChangeTurn(session, newTurnIndex);
    onUpdateSession(updated);
    setIsManualTurnModalOpen(false);
  };

  // Handle Assignment Correction
  const handleSaveCorrection = (
    newTeam: 'A' | 'B',
    newPlayerId?: string,
    newPlayerName?: string
  ) => {
    if (!editingPick) return;
    try {
      const updated = correctAssignment(
        session,
        editingPick.championId,
        newTeam,
        newPlayerId,
        newPlayerName
      );
      onUpdateSession(updated);
      setEditingPick(null);
      setCorrectionError(null);
    } catch (err: unknown) {
      setCorrectionError(err instanceof Error ? err.message : 'Errore durante la correzione dell\'assegnazione.');
    }
  };

  // Handle Remove Assignment / Rilascia nel pool (Bug 2 fix: no window.confirm, direct action)
  const handleRemoveAssignment = (championId: string) => {
    try {
      const updated = removeAssignment(session, championId);
      onUpdateSession(updated);
      setEditingPick(null);
      setCorrectionError(null);
    } catch (err: unknown) {
      setCorrectionError(err instanceof Error ? err.message : 'Errore durante il rilascio del Campione.');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Feedback Notification */}
      {feedbackMessage && (
        <div className="p-3.5 rounded-xl border border-amber-500/50 bg-amber-950/80 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-amber-400 hover:text-amber-200 text-xs px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Online Session Header Bar (when roomCode exists) */}
      {session.roomCode && (
        <div className="rounded-xl border border-blue-900/40 bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-950 p-3.5 shadow-md flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[11px] font-bold text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Online • Sincronizzato in Tempo Reale</span>
            </div>

            <div className="flex items-center gap-1 text-xs text-slate-300">
              <span className="text-slate-500">Codice Stanza:</span>
              <strong className="font-mono text-amber-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                {session.roomCode}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Player Identity Badge / Switcher */}
            <button
              onClick={() => setIsIdentityModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Cambia la tua identità per questo draft"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Ruolo:{' '}
                <strong className={userIdentity.role === 'team_a' ? 'text-blue-300' : userIdentity.role === 'team_b' ? 'text-amber-300' : 'text-slate-300'}>
                  {userIdentity.role === 'team_a' ? config.teamAName : userIdentity.role === 'team_b' ? config.teamBName : 'Spettatore'}
                </strong>
              </span>
            </button>

            {/* Share / Copy Link Button */}
            <button
              onClick={handleCopyShareLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition active:scale-95"
              title="Copia link per invitare l'altro giocatore"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copiedLink ? 'Link Copiato!' : 'Condividi Stanza'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Banner: Current Turn & Status */}
      <div
        className={`rounded-2xl border-2 p-5 shadow-2xl space-y-4 transition ${
          isBanTurn
            ? 'border-rose-500/70 bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900'
            : 'border-amber-500/50 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Active Turn Identity */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border font-cinzel ${
                  isDraftComplete
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : isBanTurn
                    ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                {isDraftComplete
                  ? 'Draft Completato'
                  : isBanTurn
                  ? `Fase di Ban (Turno ${currentTurnIndex + 1} di 2)`
                  : hasRemainingTurns
                  ? `Turno ${currentTurnIndex + 1} di ${turns.length}`
                  : 'Turni Esauriti (Incompleto)'}
              </span>
              {config.scenario && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Flag className="w-3 h-3 text-amber-400" />
                  <span>Scenario: <strong className="text-slate-300">{config.scenario}</strong></span>
                </span>
              )}
            </div>

            {hasRemainingTurns && currentTurn ? (
              <div className="flex items-center gap-3 pt-1">
                <span
                  className={`w-3.5 h-3.5 rounded-full animate-ping ${
                    isBanTurn
                      ? 'bg-rose-500'
                      : currentTurn.team === 'A'
                      ? 'bg-blue-400'
                      : 'bg-amber-400'
                  }`}
                />
                <h2 className="text-xl sm:text-2xl font-extrabold font-cinzel text-slate-100 flex items-center gap-2 flex-wrap">
                  {isBanTurn ? (
                    <span className="text-rose-300 flex items-center gap-1.5">
                      <Ban className="w-5 h-5 text-rose-400" />
                      <span>Ban Spetta a:</span>
                    </span>
                  ) : (
                    <span>Tocca a:</span>
                  )}
                  <span
                    className={
                      currentTurn.team === 'A' ? 'text-blue-300' : 'text-amber-300'
                    }
                  >
                    {currentTurn.playerName}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded border font-sans ${
                      currentTurn.team === 'A'
                        ? 'border-blue-500/40 bg-blue-950/60 text-blue-300'
                        : 'border-amber-500/40 bg-amber-950/60 text-amber-300'
                    }`}
                  >
                    {currentTurn.team === 'A' ? config.teamAName : config.teamBName}
                  </span>
                  {isBanTurn && (
                    <span className="text-xs font-normal text-rose-300/80 bg-rose-950/60 border border-rose-800/60 px-2.5 py-0.5 rounded-full">
                      Banna 1 Campione dal Limited Pool
                    </span>
                  )}
                </h2>
              </div>
            ) : isDraftComplete ? (
              <div className="flex items-center gap-2 text-emerald-400 font-bold font-cinzel text-xl pt-1">
                <CheckCircle2 className="w-6 h-6" />
                <span>Roster completi! Entrambe le squadre hanno {targetSlotsPerTeam} Campioni.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-rose-400 font-bold font-cinzel text-base sm:text-lg pt-1">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>
                  Roster incompleto: {config.teamAName} ({teamAPicks.length}/{targetSlotsPerTeam}) • {config.teamBName} ({teamBPicks.length}/{targetSlotsPerTeam})
                </span>
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto justify-end">
            {/* Undo Button */}
            <button
              onClick={handleUndo}
              disabled={picks.length === 0 && (!session.bans || session.bans.length === 0)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40 disabled:pointer-events-none transition"
              title="Annulla l'ultima selezione o ban effettuato"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Annulla Scelta</span>
            </button>

            {/* Manual Turn Changer */}
            <button
              onClick={() => setIsManualTurnModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Modifica manualmente a chi spetta il turno"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Modifica Turno</span>
            </button>

            {/* Champion Archive Sheet Drawer */}
            <button
              onClick={() => setIsConsultationOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Consulta schede senza interrompere il draft"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>Consulta Archivio</span>
            </button>

            {/* Pause & Exit */}
            <button
              onClick={onPauseAndExit}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Salva lo stato corrente in archivio ed esci"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span>Interrompi & Salva</span>
            </button>

            {/* Abort & Cancel Draft Button */}
            <button
              onClick={() => setIsAbortModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 transition shadow-sm active:scale-95"
              title="Interrompi e annulla definitivamente il draft corrente"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Annulla Draft</span>
            </button>

            {/* Conclude Draft Button */}
            {isDraftComplete && (
              <button
                onClick={() => onConcludeDraft(session)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-400 transition active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Visualizza Riepilogo Finale</span>
              </button>
            )}
          </div>
        </div>

        {/* Warning if draft turns are exhausted but rosters are not complete */}
        {!isDraftComplete && !hasRemainingTurns && (
          <div className="p-3.5 rounded-xl border border-rose-500/50 bg-rose-950/40 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-rose-100">
                Impossibile concludere: le squadre non hanno lo stesso numero completo di Campioni!
              </strong>
              <p className="text-slate-300">
                Ogni squadra deve avere esattamente <strong>{targetSlotsPerTeam} Campioni</strong> per chiudere il draft con successo.
                Attualmente: <strong>{config.teamAName}</strong> ha {teamAPicks.length}/{targetSlotsPerTeam} campioni, mentre <strong>{config.teamBName}</strong> ha {teamBPicks.length}/{targetSlotsPerTeam} campioni.
                Usa <em>Modifica Turno</em> per selezionare il campione mancante oppure correggi le assegnazioni.
              </p>
            </div>
          </div>
        )}

        {/* Turn Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Progresso Draft: <strong className="text-slate-200">{picks.length}</strong> / {turns.length} Campioni scelti
            </span>
            <span>
              {turns.length - picks.length} {turns.length - picks.length === 1 ? 'scelta rimanente' : 'scelte rimanenti'}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
              style={{ width: `${(picks.length / turns.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Banned Champions Notification Bar */}
      {session.bans && session.bans.length > 0 && (
        <div className="p-4 rounded-xl border border-rose-900/50 bg-rose-950/30 shadow-md space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold font-cinzel text-rose-300 flex items-center gap-1.5">
              <Ban className="w-4 h-4 text-rose-400" />
              <span>Campioni Bannati dal Limited Pool ({session.bans.length}/2):</span>
            </span>
            <span className="text-[11px] text-slate-400">Esclusi definitivamente dalla partita per entrambe le squadre</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {session.bans.map((ban) => {
              const champ = CHAMPIONS_DATA.find((c) => c.id === ban.championId);
              return (
                <div
                  key={ban.championId}
                  className="p-2 px-3 rounded-lg bg-slate-950 border border-rose-800/60 flex items-center gap-2.5 text-xs shadow-sm"
                >
                  {champ && <ChampionEmblem name={champ.nome} role={champ.ruolo} size="sm" />}
                  <div>
                    <span className="font-bold text-slate-200 line-through block truncate">{champ?.nome}</span>
                    <span className="text-[10px] text-rose-400">Bannato da: {ban.playerName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAssignment(ban.championId)}
                    className="p-1 text-slate-500 hover:text-rose-300 rounded ml-1 transition"
                    title="Annulla questo ban e rimetti il Campione nel pool"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Main Grid: Rosters on Top/Side, Champion Pool */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Team Rosters Column (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Squadra A Roster */}
          <div className="p-4 rounded-xl border border-blue-900/40 bg-slate-900/80 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-blue-900/30 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500" />
                <h3 className="font-bold font-cinzel text-blue-200 text-base truncate max-w-[190px]">
                  {config.teamAName}
                </h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-950 border border-blue-500/30 text-blue-300 font-semibold">
                {teamAPicks.length} / {targetSlotsPerTeam}
              </span>
            </div>

            {/* Slots */}
            <div className="space-y-2">
              {Array.from({ length: targetSlotsPerTeam }).map((_, slotIdx) => {
                const pick = teamAPicks[slotIdx];
                const champ = pick ? CHAMPIONS_DATA.find((c) => c.id === pick.championId) : null;

                if (pick && champ) {
                  return (
                    <div
                      key={pick.championId}
                      className="p-2.5 rounded-lg border border-blue-900/50 bg-blue-950/30 flex items-center justify-between gap-2 group hover:border-blue-500/40 transition"
                    >
                      <div
                        onClick={() => setInspectingChampion(champ)}
                        className="flex items-center gap-2.5 cursor-pointer min-w-0"
                      >
                        <ChampionEmblem name={champ.nome} role={champ.ruolo} size="sm" />
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-100 truncate group-hover:text-blue-300 transition">
                            {champ.nome}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            <RoleBadge ruolo={champ.ruolo} size="sm" />
                            {config.mode === 'individual' && (
                              <span className="truncate text-slate-400 font-sans">
                                • {pick.playerName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setEditingPick(pick)}
                        className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                        title="Correggi assegnazione"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={`slot_a_${slotIdx}`}
                    className="p-2.5 rounded-lg border border-dashed border-slate-800 bg-slate-950/30 flex items-center gap-2 text-slate-500 text-xs"
                  >
                    <div className="w-7 h-7 rounded border border-dashed border-slate-700 flex items-center justify-center text-slate-600">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                    <span>
                      {config.mode === 'individual' && config.players.filter((p) => p.team === 'A')[slotIdx]
                        ? `${config.players.filter((p) => p.team === 'A')[slotIdx].name} (In attesa)`
                        : `Slot #${slotIdx + 1} disponibile`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Squadra B Roster */}
          <div className="p-4 rounded-xl border border-amber-900/40 bg-slate-900/80 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-amber-900/30 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500" />
                <h3 className="font-bold font-cinzel text-amber-200 text-base truncate max-w-[190px]">
                  {config.teamBName}
                </h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/30 text-amber-300 font-semibold">
                {teamBPicks.length} / {targetSlotsPerTeam}
              </span>
            </div>

            {/* Slots */}
            <div className="space-y-2">
              {Array.from({ length: targetSlotsPerTeam }).map((_, slotIdx) => {
                const pick = teamBPicks[slotIdx];
                const champ = pick ? CHAMPIONS_DATA.find((c) => c.id === pick.championId) : null;

                if (pick && champ) {
                  return (
                    <div
                      key={pick.championId}
                      className="p-2.5 rounded-lg border border-amber-900/50 bg-amber-950/30 flex items-center justify-between gap-2 group hover:border-amber-500/40 transition"
                    >
                      <div
                        onClick={() => setInspectingChampion(champ)}
                        className="flex items-center gap-2.5 cursor-pointer min-w-0"
                      >
                        <ChampionEmblem name={champ.nome} role={champ.ruolo} size="sm" />
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-100 truncate group-hover:text-amber-300 transition">
                            {champ.nome}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            <RoleBadge ruolo={champ.ruolo} size="sm" />
                            {config.mode === 'individual' && (
                              <span className="truncate text-slate-400 font-sans">
                                • {pick.playerName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setEditingPick(pick)}
                        className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                        title="Correggi assegnazione"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={`slot_b_${slotIdx}`}
                    className="p-2.5 rounded-lg border border-dashed border-slate-800 bg-slate-950/30 flex items-center gap-2 text-slate-500 text-xs"
                  >
                    <div className="w-7 h-7 rounded border border-dashed border-slate-700 flex items-center justify-center text-slate-600">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                    <span>
                      {config.mode === 'individual' && config.players.filter((p) => p.team === 'B')[slotIdx]
                        ? `${config.players.filter((p) => p.team === 'B')[slotIdx].name} (In attesa)`
                        : `Slot #${slotIdx + 1} disponibile`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Champion Pool & Selector Column (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Controls Bar: Search, Filters */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 shadow-md space-y-3">
            {/* Top row: Search + Status Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca Champion per nome o parola chiave..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Limited Pool Scope Toggle (if limited_pool order) */}
              {config.order === 'limited_pool' && config.limitedPool && (
                <div className="flex items-center rounded-lg border border-amber-500/40 bg-slate-950 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setPoolScopeFilter('limited')}
                    className={`px-3 py-1.5 rounded-md transition flex items-center gap-1 ${
                      poolScopeFilter === 'limited'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Pool 12</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPoolScopeFilter('all')}
                    className={`px-3 py-1.5 rounded-md transition ${
                      poolScopeFilter === 'all'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tutti (27)
                  </button>
                </div>
              )}

              {/* Availability Filter Buttons */}
              <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setAvailabilityFilter('available')}
                  className={`px-3 py-1.5 rounded-md transition ${
                    availabilityFilter === 'available'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Disponibili
                </button>
                <button
                  type="button"
                  onClick={() => setAvailabilityFilter('all')}
                  className={`px-3 py-1.5 rounded-md transition ${
                    availabilityFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tutti
                </button>
                <button
                  type="button"
                  onClick={() => setAvailabilityFilter('picked')}
                  className={`px-3 py-1.5 rounded-md transition ${
                    availabilityFilter === 'picked'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Scelti / Bannati
                </button>
              </div>
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mr-1 font-cinzel">
                Ruolo:
              </span>
              {(['Tutti', 'Guardian', 'Maelstrom', 'Shaper', 'Slayer'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition shrink-0 border ${
                    selectedRole === role
                      ? 'border-amber-400 bg-amber-400/20 text-amber-200 font-bold'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {role}
                </button>
              ))}

              <div className="h-4 w-[1px] bg-slate-800 mx-1" />

              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mr-1 font-cinzel">
                Tier:
              </span>
              {(['Tutti', 'S', 'A', 'B', 'C', 'D', 'Da verificare'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTier(t)}
                  className={`px-2 py-0.5 rounded text-[11px] transition shrink-0 border ${
                    selectedTier === t
                      ? 'border-amber-400 bg-amber-400/20 text-amber-200 font-bold'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Champion Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredChampions.map((champ) => {
              const picked = isChampionPicked(champ.id, picks);
              const pickDetails = picked ? picks.find((p) => p.championId === champ.id) : null;
              const banned = isChampionBanned(champ.id, session.bans || []);
              const banDetails = banned ? (session.bans || []).find((b) => b.championId === champ.id) : null;
              const isOutOfPool = config.order === 'limited_pool' && config.limitedPool && !config.limitedPool.includes(champ.id);

              return (
                <div
                  key={champ.id}
                  className={`relative p-3.5 rounded-xl border transition flex flex-col justify-between ${
                    banned
                      ? 'border-rose-900/60 bg-rose-950/20 opacity-60'
                      : picked
                      ? 'border-slate-800/80 bg-slate-950/40 opacity-55'
                      : isOutOfPool
                      ? 'border-slate-800/60 bg-slate-950/30 opacity-45'
                      : 'border-slate-800 bg-slate-900/80 hover:border-amber-500/50 hover:bg-slate-850 shadow-md'
                  }`}
                >
                  <div>
                    {/* Header: Emblem + Name + Badges */}
                    <div className="flex items-start gap-2.5">
                      <ChampionEmblem name={champ.nome} role={champ.ruolo} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 justify-between">
                          <h4 className={`font-bold font-cinzel text-sm leading-tight truncate ${banned ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                            {champ.nome}
                          </h4>
                          {isOutOfPool && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                              Fuori Pool
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <RoleBadge ruolo={champ.ruolo} size="sm" />
                          <span className="text-[10px] text-amber-400/90 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono">
                            {champ.tier}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Summary Snippet */}
                    <p className="text-xs text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                      {champ.sintesi}
                    </p>
                  </div>

                  {/* Actions / Status Footer */}
                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setInspectingChampion(champ)}
                      aria-label={`Dettagli ${champ.nome}`}
                      className="text-xs text-slate-400 hover:text-slate-200 underline-offset-2 hover:underline transition"
                    >
                      Dettagli
                    </button>

                    {banned ? (
                      <span className="text-[11px] font-medium text-rose-300 bg-rose-950/80 px-2.5 py-1 rounded border border-rose-800/80 truncate max-w-[160px] flex items-center gap-1">
                        <Ban className="w-3 h-3 text-rose-400 shrink-0" />
                        <span>Bannato: {banDetails?.playerName}</span>
                      </span>
                    ) : picked ? (
                      <span className="text-[11px] font-medium text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800 truncate max-w-[150px]">
                        Scelto: {pickDetails?.playerName}
                      </span>
                    ) : isOutOfPool ? (
                      <span className="text-[11px] text-slate-500 font-medium px-2 py-1">
                        Non selezionabile
                      </span>
                    ) : isBanTurn ? (
                      <button
                        type="button"
                        disabled={isDraftComplete}
                        onClick={() => handleSelectChampion(champ.id)}
                        aria-label={`Banna ${champ.nome}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition active:scale-95 disabled:opacity-40"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Banna</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isDraftComplete}
                        onClick={() => handleSelectChampion(champ.id)}
                        aria-label={`Seleziona ${champ.nome}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition active:scale-95 disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Seleziona</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredChampions.length === 0 && (
            <div className="p-8 text-center rounded-xl border border-slate-800 bg-slate-900/50 space-y-2">
              <p className="text-sm text-slate-400">
                Nessun Campione trovato con i filtri attuali.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRole('Tutti');
                  setSelectedTier('Tutti');
                  setAvailabilityFilter('all');
                  setPoolScopeFilter('limited');
                }}
                className="text-xs text-amber-400 hover:underline"
              >
                Reimposta tutti i filtri
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Champion Detail Sheet */}
      <ChampionDetailModal
        champion={inspectingChampion}
        onClose={() => setInspectingChampion(null)}
        onSelectForCurrentTurn={!isDraftComplete ? handleSelectChampion : undefined}
        currentPickingName={currentTurn?.playerName}
        isAlreadyPicked={inspectingChampion ? isChampionPicked(inspectingChampion.id, picks) : false}
        pickedByName={
          inspectingChampion && isChampionPicked(inspectingChampion.id, picks)
            ? picks.find((p) => p.championId === inspectingChampion.id)?.playerName
            : undefined
        }
        isBanned={inspectingChampion ? isChampionBanned(inspectingChampion.id, session.bans || []) : false}
        bannedByName={
          inspectingChampion && isChampionBanned(inspectingChampion.id, session.bans || [])
            ? (session.bans || []).find((b) => b.championId === inspectingChampion.id)?.playerName
            : undefined
        }
        isBanTurn={isBanTurn}
      />


      {/* MODAL 2: Full Champion Consultation Drawer during Draft */}
      {isConsultationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold font-cinzel text-amber-300 text-lg">
                  Archivio Completo dei Campioni
                </h3>
              </div>
              <button
                onClick={() => setIsConsultationOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg"
              >
                Torna al Draft
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              <p className="text-xs text-slate-400">
                Puoi consultare tutti i 27 campioni in qualsiasi momento durante la partita. Il turno corrente ({currentTurn?.playerName || 'Completato'}) resta invariato.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {CHAMPIONS_DATA.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setIsConsultationOpen(false);
                      setInspectingChampion(c);
                    }}
                    className="p-3 rounded-lg border border-slate-800 bg-slate-950 hover:border-amber-500/50 cursor-pointer transition flex items-center gap-3"
                  >
                    <ChampionEmblem name={c.nome} role={c.ruolo} size="sm" />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-200 truncate">{c.nome}</div>
                      <div className="text-[11px] text-slate-400">{c.ruolo} • Tier: {c.tier}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Manual Turn Change */}
      {isManualTurnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4 text-slate-100">
            <h3 className="text-lg font-bold font-cinzel text-amber-300">
              Modifica Manuale del Turno Corrente
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Seleziona quale partecipante deve effettuare la scelta successiva. La sequenza calcolata ripartirà dal punto specificato.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {turns.map((turn) => (
                <button
                  key={turn.turnIndex}
                  type="button"
                  onClick={() => handleConfirmTurnChange(turn.turnIndex)}
                  className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition ${
                    turn.turnIndex === currentTurnIndex
                      ? 'border-amber-500 bg-amber-500/20 text-amber-200 font-bold'
                      : 'border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-slate-500">#{turn.turnNumber}</span>
                    <span>{turn.playerName}</span>
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                      turn.team === 'A'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    Squadra {turn.team}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsManualTurnModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Assignment Correction */}
      {editingPick && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4 text-slate-100">
            <h3 className="text-lg font-bold font-cinzel text-amber-300">
              Correggi Assegnazione Champion
            </h3>
            {(() => {
              const champ = CHAMPIONS_DATA.find((c) => c.id === editingPick.championId);
              return (
                <div className="p-3 rounded-lg border border-slate-800 bg-slate-950 flex items-center gap-3">
                  {champ && <ChampionEmblem name={champ.nome} role={champ.ruolo} size="md" />}
                  <div>
                    <h4 className="font-bold text-slate-100">{champ?.nome}</h4>
                    <p className="text-xs text-slate-400">
                      Attualmente assegnato a:{' '}
                      <strong className="text-amber-300">{editingPick.playerName}</strong> (Squadra {editingPick.team})
                    </p>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Riassegna a:
              </span>

              {/* Quick switch team */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveCorrection('A')}
                  className={`p-2.5 rounded-lg border text-xs font-semibold transition ${
                    editingPick.team === 'A'
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Squadra A ({config.teamAName})
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveCorrection('B')}
                  className={`p-2.5 rounded-lg border text-xs font-semibold transition ${
                    editingPick.team === 'B'
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Squadra B ({config.teamBName})
                </button>
              </div>

              {/* Individual players options if Mode A */}
              {config.mode === 'individual' && (
                <div className="space-y-1 pt-2">
                  <span className="text-[11px] text-slate-400 block">Oppure assegna a giocatore specifico:</span>
                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                    {config.players.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSaveCorrection(p.team, p.id, p.name)}
                        className={`p-2 rounded text-[11px] border text-left truncate ${
                          editingPick.playerId === p.id
                            ? 'border-amber-400 bg-amber-400/20 text-amber-200 font-bold'
                            : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {p.name} ({p.team})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {correctionError && (
              <div className="p-2.5 rounded-lg border border-rose-500/50 bg-rose-950/60 text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{correctionError}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleRemoveAssignment(editingPick.championId)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 rounded-lg border border-rose-800/80 transition active:scale-95"
                title="Rilascia questo Campione e rendilo nuovamente disponibile a chiunque"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Rilascia nel pool</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingPick(null);
                  setCorrectionError(null);
                }}
                className="px-4 py-2 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Chiudi senza modificare
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Player Identity Selection (Online Draft) */}
      {isIdentityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <UserCheck className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold font-cinzel text-amber-300">
                Seleziona la tua Identità nel Draft
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Indica quale squadra o ruolo stai controllando da questa postazione. Questa preferenza ti aiuterà a seguire chiaramente quando tocca a te.
            </p>

            <div className="space-y-2.5 pt-1">
              {/* Option: Squadra A */}
              <button
                type="button"
                onClick={() => handleSelectIdentity('team_a', 'A', config.teamAName)}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                  userIdentity.role === 'team_a'
                    ? 'border-blue-500 bg-blue-950/60 text-blue-200'
                    : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  <div>
                    <strong className="block text-sm text-slate-100">{config.teamAName}</strong>
                    <span className="text-[11px] text-slate-400">Squadra A ({teamAPicks.length}/{targetSlotsPerTeam} scelte)</span>
                  </div>
                </div>
                {userIdentity.role === 'team_a' && <Check className="w-4 h-4 text-blue-400" />}
              </button>

              {/* Option: Squadra B */}
              <button
                type="button"
                onClick={() => handleSelectIdentity('team_b', 'B', config.teamBName)}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                  userIdentity.role === 'team_b'
                    ? 'border-amber-500 bg-amber-950/60 text-amber-200'
                    : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <div>
                    <strong className="block text-sm text-slate-100">{config.teamBName}</strong>
                    <span className="text-[11px] text-slate-400">Squadra B ({teamBPicks.length}/{targetSlotsPerTeam} scelte)</span>
                  </div>
                </div>
                {userIdentity.role === 'team_b' && <Check className="w-4 h-4 text-amber-400" />}
              </button>

              {/* Option: Spettatore */}
              <button
                type="button"
                onClick={() => handleSelectIdentity('spectator', undefined, 'Spettatore')}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                  userIdentity.role === 'spectator'
                    ? 'border-emerald-500 bg-emerald-950/60 text-emerald-200'
                    : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <div>
                    <strong className="block text-sm text-slate-100">Spettatore / Ospite</strong>
                    <span className="text-[11px] text-slate-400">Osserva il draft in tempo reale senza vincoli</span>
                  </div>
                </div>
                {userIdentity.role === 'spectator' && <Check className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsIdentityModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Abort and Discard Draft Confirmation */}
      {isAbortModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-rose-800/80 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800/60 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-cinzel text-rose-300">
                  Annullare il Draft in corso?
                </h3>
                <p className="text-xs text-slate-400">
                  Operazione irreversibile
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <p>
                Sei sicuro di voler interrompere e <strong>cancellare definitivamente questo draft</strong>?
              </p>
              <p className="text-slate-400">
                Tutte le {picks.length} selezioni effettuate finora andranno perse. Usa questa opzione in caso di errori di impostazione, giocatori errati o ripensamenti.
              </p>
              {picks.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <span>Campioni attualmente selezionati ({picks.length}): </span>
                  <span className="text-slate-300 font-mono">
                    {picks.map((p) => {
                      const champ = CHAMPIONS_DATA.find((c) => c.id === p.championId);
                      return champ?.nome;
                    }).filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsAbortModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Continua il Draft
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAbortModalOpen(false);
                  onAbortDraft();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition shadow-md shadow-rose-600/30 active:scale-95"
              >
                Sì, Annulla Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
