import React, { useState } from 'react';
import { Play, PlusCircle, BookOpen, Archive, Shield, Flame, Wand2, Swords, Clock, ArrowRight, Sparkles, Globe, LogIn, AlertCircle } from 'lucide-react';
import { AppView, DraftSession } from '../types';
import { ROLE_INFO } from '../data/champions';
import { formatItalianDate } from '../utils/draftLogic';

interface HomeViewProps {
  onNavigate: (view: AppView) => void;
  activeSession: DraftSession | null;
  savedSessions: DraftSession[];
  onLoadSession: (session: DraftSession) => void;
  onJoinRoom?: (roomCode: string) => Promise<boolean>;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  activeSession,
  savedSessions,
  onLoadSession,
  onJoinRoom
}) => {
  const isDraftInProgress = activeSession && activeSession.status === 'in_progress';
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !onJoinRoom) return;
    setIsJoining(true);
    setJoinError(null);
    try {
      const success = await onJoinRoom(joinCode.trim());
      if (!success) {
        setJoinError(`Nessun draft trovato con il codice "${joinCode.trim().toUpperCase()}". Controlla e riprova.`);
      }
    } catch {
      setJoinError('Impossibile raggiungere il server per accedere alla stanza.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-950/40 text-amber-300 text-xs font-semibold tracking-wider uppercase font-cinzel">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Guida Ufficiale al Draft Tattico</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold font-cinzel tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100">
            Godtear Draft Assistant
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Organizza, calcola e gestisci la selezione dei tuoi Campioni per Godtear in modo bilanciato ed efficiente.
            Supporta il draft a squadre o individuale (2-8 giocatori), ordine alternato o snake, e include l'archivio completo dei 27 Champion.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => onNavigate('setup')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-slate-950 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 shadow-lg shadow-amber-500/20 transition active:scale-95 text-sm sm:text-base"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Avvia Nuovo Draft</span>
            </button>

            <button
              onClick={() => onNavigate('champions')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 transition text-sm sm:text-base"
            >
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span>Consulta 27 Campioni</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Session In Progress Banner */}
      {isDraftInProgress && (
        <div className="p-5 rounded-xl border-2 border-amber-500/60 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <h2 className="font-cinzel font-bold text-amber-300 text-base sm:text-lg">
                Hai un Draft in Corso!
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              <strong className="text-amber-200">{activeSession.name}</strong> •{' '}
              {activeSession.config.mode === 'individual' ? 'Draft Individuale' : 'Draft per Squadre'} •{' '}
              Turno {activeSession.picks.length + 1} di {activeSession.turns.length} (
              {activeSession.turns[activeSession.currentTurnIndex]?.playerName || 'In corso'})
            </p>
          </div>

          <button
            onClick={() => onNavigate('draft')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition self-stretch sm:self-auto justify-center"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Riprendi Selezione</span>
          </button>
        </div>
      )}

      {/* Online Room Join Form */}
      <div className="p-5 rounded-xl border border-blue-900/40 bg-gradient-to-r from-slate-900 via-blue-950/20 to-slate-900 shadow-md">
        <form onSubmit={handleJoinSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <h3 className="font-cinzel text-sm sm:text-base font-bold text-slate-100">
                Partecipa a un Draft Online Esistente
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Hai ricevuto un Codice Stanza da un altro giocatore? Inseriscilo qui per collegarti al tavolo in tempo reale.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Es. GT-8429"
              maxLength={8}
              className="px-3.5 py-2 text-xs sm:text-sm font-mono uppercase bg-slate-950 border border-slate-700 rounded-lg text-amber-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 w-32 sm:w-36 text-center"
            />
            <button
              type="submit"
              disabled={!joinCode.trim() || isJoining}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 rounded-lg shadow transition active:scale-95 shrink-0"
            >
              <LogIn className="w-4 h-4" />
              <span>{isJoining ? 'Accesso...' : 'Entra'}</span>
            </button>
          </div>
        </form>

        {joinError && (
          <div className="mt-3 p-2.5 rounded-lg border border-rose-500/40 bg-rose-950/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{joinError}</span>
          </div>
        )}
      </div>

      {/* 3 Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Nuovo Draft */}
        <div
          onClick={() => onNavigate('setup')}
          className="group cursor-pointer p-6 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-amber-500/50 transition duration-200 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
              <PlusCircle className="w-6 h-6" />
            </div>
            <h3 className="font-cinzel text-lg font-bold text-slate-100 group-hover:text-amber-300 transition">
              Configura Partita
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Imposta squadre, partecipanti, ordine alternato o snake, e associa opzionalmente uno scenario ufficiale o personalizzato.
            </p>
          </div>
          <div className="pt-4 flex items-center text-xs font-semibold text-amber-400 gap-1 group-hover:translate-x-1 transition">
            <span>Inizia ora</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 2: Consultazione Campioni */}
        <div
          onClick={() => onNavigate('champions')}
          className="group cursor-pointer p-6 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-amber-500/50 transition duration-200 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-cinzel text-lg font-bold text-slate-100 group-hover:text-amber-300 transition">
              Archivio 27 Campioni
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Filtra per Ruolo (Guardian, Maelstrom, Shaper, Slayer) e Tier, visualizza caratteristiche, punti di forza, debolezze e note tattiche.
            </p>
          </div>
          <div className="pt-4 flex items-center text-xs font-semibold text-amber-400 gap-1 group-hover:translate-x-1 transition">
            <span>Esplora compendio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 3: Archivio Sessioni */}
        <div
          onClick={() => onNavigate('archive')}
          className="group cursor-pointer p-6 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-amber-500/50 transition duration-200 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
              <Archive className="w-6 h-6" />
            </div>
            <h3 className="font-cinzel text-lg font-bold text-slate-100 group-hover:text-amber-300 transition">
              Sessioni Salvate ({savedSessions.length})
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Recupera i draft passati, esporta/importa file JSON per condividerli con altri giocatori o prepara la stampa PDF del tavolo.
            </p>
          </div>
          <div className="pt-4 flex items-center text-xs font-semibold text-amber-400 gap-1 group-hover:translate-x-1 transition">
            <span>Gestisci archivio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Role Breakdown Overview */}
      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold font-cinzel text-slate-200">
          I 4 Ruoli Tattici di Godtear
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Guardian */}
          <div className="p-4 rounded-xl border border-blue-900/40 bg-blue-950/20 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-cinzel font-semibold">
              <Shield className="w-4 h-4" />
              <span>Guardians (7)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {ROLE_INFO.Guardian.descrizione}
            </p>
            <div className="text-[11px] text-blue-300/80">
              Es: Rhodri, Finvarr, Halftusk...
            </div>
          </div>

          {/* Maelstrom */}
          <div className="p-4 rounded-xl border border-amber-900/40 bg-amber-950/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-cinzel font-semibold">
              <Flame className="w-4 h-4" />
              <span>Maelstroms (7)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {ROLE_INFO.Maelstrom.descrizione}
            </p>
            <div className="text-[11px] text-amber-300/80">
              Es: Blackjaw, Titus, Kailinn...
            </div>
          </div>

          {/* Shaper */}
          <div className="p-4 rounded-xl border border-emerald-900/40 bg-emerald-950/20 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-cinzel font-semibold">
              <Wand2 className="w-4 h-4" />
              <span>Shapers (6)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {ROLE_INFO.Shaper.descrizione}
            </p>
            <div className="text-[11px] text-emerald-300/80">
              Es: Raith'Marid, Shayle, Nia...
            </div>
          </div>

          {/* Slayer */}
          <div className="p-4 rounded-xl border border-rose-900/40 bg-rose-950/20 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-cinzel font-semibold">
              <Swords className="w-4 h-4" />
              <span>Slayers (7)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {ROLE_INFO.Slayer.descrizione}
            </p>
            <div className="text-[11px] text-rose-300/80">
              Es: Rangosh, Morrigan, Sneaky Peet...
            </div>
          </div>
        </div>
      </div>

      {/* Recent Saved Sessions (if any) */}
      {savedSessions.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-cinzel text-slate-200">
              Sessioni Salvate Recenti
            </h2>
            <button
              onClick={() => onNavigate('archive')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              Vedi tutte ({savedSessions.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedSessions.slice(0, 3).map((session) => (
              <div
                key={session.id}
                onClick={() => onLoadSession(session)}
                className="group cursor-pointer p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 hover:border-amber-500/40 transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 group-hover:text-amber-300 transition text-sm truncate max-w-[180px]">
                    {session.name}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    session.status === 'completed'
                      ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                      : 'bg-amber-950/70 border border-amber-500/40 text-amber-300'
                  }`}>
                    {session.status === 'completed' ? 'Completato' : 'In corso'}
                  </span>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <div>
                    {session.config.teamAName} vs {session.config.teamBName}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatItalianDate(session.updatedAt)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400 font-medium">
                  <span>{session.picks.length}/{session.turns.length} Campioni scelti</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
