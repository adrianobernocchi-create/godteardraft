import React, { useState } from 'react';
import {
  Printer,
  Download,
  Save,
  CheckCircle2,
  Calendar,
  Flag,
  Share2,
  RotateCcw,
  BookOpen,
  Edit3,
  Ban
} from 'lucide-react';

import { AppView, DraftSession } from '../types';
import { CHAMPIONS_DATA, ROLE_INFO } from '../data/champions';
import { RoleBadge } from './RoleBadge';
import { ChampionEmblem } from './ChampionEmblem';
import { exportDraftToJson, formatItalianDate } from '../utils/draftLogic';
import { saveSessionToArchive } from '../utils/storage';

interface CompletedViewProps {
  session: DraftSession;
  onNavigate: (view: AppView) => void;
  onNewDraft: () => void;
  onEditDraft?: () => void;
}

export const CompletedView: React.FC<CompletedViewProps> = ({
  session,
  onNavigate,
  onNewDraft,
  onEditDraft
}) => {

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [customSaveName, setCustomSaveName] = useState(session.name || 'Draft Godtear');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const { config, picks, turns, createdAt } = session;
  const teamAPicks = picks.filter((p) => p.team === 'A');
  const teamBPicks = picks.filter((p) => p.team === 'B');

  // Handle browser print (also allows Save as PDF via browser print dialog)
  const handlePrint = () => {
    window.print();
  };

  // Handle JSON export download
  const handleExportJson = () => {
    const jsonStr = exportDraftToJson(session);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (session.name || 'godtear_draft')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_');
    a.download = `${safeName}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle Save to Local Storage Archive
  const handleSaveToArchive = (e: React.FormEvent) => {
    e.preventDefault();
    saveSessionToArchive(session, customSaveName);
    setSaveModalOpen(false);
    setSaveSuccessMessage(true);
    setTimeout(() => setSaveSuccessMessage(false), 4000);
  };

  // Copy text summary to clipboard
  const handleCopySummary = async () => {
    const lines = [
      `GODTEAR DRAFT - ${session.name}`,
      `Data: ${formatItalianDate(session.createdAt)}`,
      config.scenario ? `Scenario: ${config.scenario}` : '',
      `Modalità: ${config.mode === 'individual' ? 'Individuale' : 'Per Squadre'} (${config.order === 'snake' ? 'Snake' : 'Alternato'})`,
      '',
      `=== ${config.teamAName.toUpperCase()} ===`,
      ...teamAPicks.map((p, i) => {
        const champ = CHAMPIONS_DATA.find((c) => c.id === p.championId);
        return `${i + 1}. ${champ?.nome} (${champ?.ruolo}) - ${p.playerName}`;
      }),
      '',
      `=== ${config.teamBName.toUpperCase()} ===`,
      ...teamBPicks.map((p, i) => {
        const champ = CHAMPIONS_DATA.find((c) => c.id === p.championId);
        return `${i + 1}. ${champ?.nome} (${champ?.ruolo}) - ${p.playerName}`;
      }),
      '',
      '=== CRONOLOGIA DEL DRAFT ===',
      ...picks.map((p, i) => {
        const champ = CHAMPIONS_DATA.find((c) => c.id === p.championId);
        return `Turno #${i + 1}: ${p.playerName} (Sq ${p.team}) -> ${champ?.nome} [${champ?.ruolo}]`;
      })
    ].filter(Boolean);

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
    } catch {
      alert('Impossibile copiare negli appunti.');
    }
  };

  // Role count helper
  const getRoleBreakdown = (teamPicks: typeof picks) => {
    const counts = { Guardian: 0, Maelstrom: 0, Shaper: 0, Slayer: 0 };
    teamPicks.forEach((p) => {
      const champ = CHAMPIONS_DATA.find((c) => c.id === p.championId);
      if (champ) {
        counts[champ.ruolo]++;
      }
    });
    return counts;
  };

  const teamARoles = getRoleBreakdown(teamAPicks);
  const teamBRoles = getRoleBreakdown(teamBPicks);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Concluded Header (hidden on print) */}
      <div className="no-print space-y-4">
        {saveSuccessMessage && (
          <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Sessione salvata con successo nell'Archivio locale!</span>
          </div>
        )}

        <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs font-semibold uppercase tracking-wider font-cinzel">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Draft Ufficialmente Concluso</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-cinzel text-amber-200">
              Riepilogo della Selezione
            </h1>
            <p className="text-sm text-slate-400">
              Visualizza la composizione dei roster, stampa la scheda per il tavolo di gioco o salva la sessione.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {onEditDraft && (
              <button
                onClick={onEditDraft}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/50 shadow-sm transition active:scale-95"
                title="Riapri il draft per intervenire, correggere assegnazioni, annullare scelte o modificare i turni"
              >
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>Modifica Draft</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:from-amber-400 hover:to-amber-300 shadow-md shadow-amber-500/20 transition active:scale-95"
              title="Stampa oppure salva come PDF con il browser"
            >
              <Printer className="w-4 h-4" />
              <span>Stampa / Salva PDF</span>
            </button>

            <button
              onClick={() => setSaveModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Salva nell'archivio locale con nome"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>Salva in Archivio</span>
            </button>

            <button
              onClick={handleExportJson}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Scarica file JSON per esportazione"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Esporta JSON</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>{copiedText ? 'Copiato!' : 'Copia Testo'}</span>
            </button>

            <button
              onClick={onNewDraft}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Nuovo Draft</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= PRINTABLE & SCREEN SHEET ================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8 shadow-xl print-card print:border-none print:p-0">
        {/* Printable Sheet Header */}
        <div className="border-b border-slate-800 print:border-black/30 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-bold tracking-widest text-amber-500 print:text-black font-cinzel">
              Godtear Tabletop Skirmish Game
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-cinzel text-slate-100 print:text-black mt-1">
              {session.name || 'Riepilogo Ufficiale del Draft'}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 print:text-gray-700 mt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400 print:text-black" />
                <span>{formatItalianDate(createdAt)}</span>
              </span>

              {config.scenario && (
                <span className="flex items-center gap-1.5 font-semibold text-amber-300 print:text-black">
                  <Flag className="w-3.5 h-3.5" />
                  <span>Scenario: {config.scenario}</span>
                </span>
              )}

              <span>
                Modalità:{' '}
                <strong>
                  {config.mode === 'individual'
                    ? `Draft Individuale (${config.playerCount} Giocatori)`
                    : `Draft per Squadre (${config.rosterSize} Campioni per squadra)`}
                </strong>
              </span>

              <span>
                Ordine:{' '}
                <strong>
                  {config.order === 'limited_pool'
                    ? 'Limited Pool A-B-A-B (Pool 12 & Ban)'
                    : config.order === 'snake'
                    ? 'Snake (A-B-B-A)'
                    : 'Alternato (A-B-A-B)'}
                </strong>
              </span>
            </div>
          </div>

          <div className="text-right hidden sm:block print:block">
            <span className="text-xs font-mono uppercase px-3 py-1 rounded bg-slate-950 border border-slate-800 print:border-black/30 print:bg-transparent text-slate-300 print:text-black font-bold">
              {picks.length} Campioni Scelti
            </span>
          </div>
        </div>


        {/* Side-by-side Rosters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Squadra A Roster */}
          <div className="p-5 rounded-xl border border-blue-900/50 bg-slate-950/60 print:border-blue-700 print:bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-blue-900/40 print:border-black/20 pb-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-blue-400 print:text-blue-800 font-cinzel">
                  Squadra A
                </span>
                <h3 className="text-xl font-extrabold font-cinzel text-blue-200 print:text-black">
                  {config.teamAName}
                </h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-md bg-blue-950 border border-blue-800 text-blue-300 font-bold print:border-black print:text-black">
                {teamAPicks.length} Campioni
              </span>
            </div>

            {/* Role Breakdown Badges */}
            <div className="flex flex-wrap gap-2 text-xs">
              {teamARoles.Guardian > 0 && <span className="text-blue-300 font-medium">🛡️ {teamARoles.Guardian} Guardian</span>}
              {teamARoles.Maelstrom > 0 && <span className="text-amber-300 font-medium">🔥 {teamARoles.Maelstrom} Maelstrom</span>}
              {teamARoles.Shaper > 0 && <span className="text-emerald-300 font-medium">✨ {teamARoles.Shaper} Shaper</span>}
              {teamARoles.Slayer > 0 && <span className="text-rose-300 font-medium">⚔️ {teamARoles.Slayer} Slayer</span>}
            </div>

            {/* List of Champions */}
            <div className="space-y-3 pt-2">
              {teamAPicks.map((pick, idx) => {
                const champ = CHAMPIONS_DATA.find((c) => c.id === pick.championId);
                if (!champ) return null;

                return (
                  <div
                    key={champ.id}
                    className="p-3 rounded-lg border border-slate-800 bg-slate-900/90 print:bg-white print:border-gray-300 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs text-slate-500 font-bold">
                        #{idx + 1}
                      </span>
                      <ChampionEmblem name={champ.nome} role={champ.ruolo} size="sm" />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-100 print:text-black truncate">
                          {champ.nome}
                        </div>
                        <div className="text-xs text-slate-400 print:text-gray-600 flex items-center gap-2">
                          <RoleBadge ruolo={champ.ruolo} size="sm" />
                          <span>Tier {champ.tier}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-xs shrink-0">
                      <span className="font-semibold text-slate-300 print:text-black block">
                        {pick.playerName}
                      </span>
                      <span className="text-[10px] text-slate-500 print:text-gray-500">
                        Turno #{pick.turnIndex + 1}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Squadra B Roster */}
          <div className="p-5 rounded-xl border border-amber-900/50 bg-slate-950/60 print:border-amber-700 print:bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-amber-900/40 print:border-black/20 pb-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-amber-400 print:text-amber-800 font-cinzel">
                  Squadra B
                </span>
                <h3 className="text-xl font-extrabold font-cinzel text-amber-200 print:text-black">
                  {config.teamBName}
                </h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-md bg-amber-950 border border-amber-800 text-amber-300 font-bold print:border-black print:text-black">
                {teamBPicks.length} Campioni
              </span>
            </div>

            {/* Role Breakdown Badges */}
            <div className="flex flex-wrap gap-2 text-xs">
              {teamBRoles.Guardian > 0 && <span className="text-blue-300 font-medium">🛡️ {teamBRoles.Guardian} Guardian</span>}
              {teamBRoles.Maelstrom > 0 && <span className="text-amber-300 font-medium">🔥 {teamBRoles.Maelstrom} Maelstrom</span>}
              {teamBRoles.Shaper > 0 && <span className="text-emerald-300 font-medium">✨ {teamBRoles.Shaper} Shaper</span>}
              {teamBRoles.Slayer > 0 && <span className="text-rose-300 font-medium">⚔️ {teamBRoles.Slayer} Slayer</span>}
            </div>

            {/* List of Champions */}
            <div className="space-y-3 pt-2">
              {teamBPicks.map((pick, idx) => {
                const champ = CHAMPIONS_DATA.find((c) => c.id === pick.championId);
                if (!champ) return null;

                return (
                  <div
                    key={champ.id}
                    className="p-3 rounded-lg border border-slate-800 bg-slate-900/90 print:bg-white print:border-gray-300 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs text-slate-500 font-bold">
                        #{idx + 1}
                      </span>
                      <ChampionEmblem name={champ.nome} role={champ.ruolo} size="sm" />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-100 print:text-black truncate">
                          {champ.nome}
                        </div>
                        <div className="text-xs text-slate-400 print:text-gray-600 flex items-center gap-2">
                          <RoleBadge ruolo={champ.ruolo} size="sm" />
                          <span>Tier {champ.tier}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-xs shrink-0">
                      <span className="font-semibold text-slate-300 print:text-black block">
                        {pick.playerName}
                      </span>
                      <span className="text-[10px] text-slate-500 print:text-gray-500">
                        Turno #{pick.turnIndex + 1}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Banned Champions section if present */}
        {session.bans && session.bans.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-800 print:border-black/20">
            <div className="flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-400" />
              <h3 className="font-cinzel text-base font-bold text-rose-300 print:text-black">
                Campioni Esclusi / Bannati dal Limited Pool ({session.bans.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {session.bans.map((ban) => {
                const champ = CHAMPIONS_DATA.find((c) => c.id === ban.championId);
                return (
                  <div
                    key={ban.championId}
                    className="p-3 rounded-lg border border-rose-900/40 bg-rose-950/20 print:bg-white print:border-gray-300 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {champ && <ChampionEmblem name={champ.nome} role={champ.ruolo} size="sm" />}
                      <div className="min-w-0">
                        <span className="font-bold text-slate-200 print:text-black line-through block truncate">
                          {champ?.nome}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {champ?.ruolo} • Tier {champ?.tier}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-rose-950 border border-rose-800 text-rose-300 shrink-0">
                      Bannato da: {ban.playerName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selection Timeline / Draft Order Log */}
        <div className="space-y-4 pt-4 border-t border-slate-800 print:border-black/20">
          <h3 className="font-cinzel text-lg font-bold text-slate-200 print:text-black">
            Cronologia Completa delle Scelte
          </h3>


          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {picks.map((pick, i) => {
              const champ = CHAMPIONS_DATA.find((c) => c.id === pick.championId);
              return (
                <div
                  key={pick.championId + i}
                  className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 print:bg-white print:border-gray-300 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-bold text-amber-400 print:text-black">
                      #{i + 1}
                    </span>
                    <span className="font-semibold text-slate-200 print:text-black truncate">
                      {champ?.nome}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        pick.team === 'A'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800 print:text-black'
                          : 'bg-amber-950 text-amber-300 border border-amber-800 print:text-black'
                      }`}
                    >
                      {pick.playerName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tactical Tabletop Reminder */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 print:border-black print:bg-gray-100 text-xs text-slate-300 print:text-black flex items-start gap-2.5">
          <span className="text-amber-400 print:text-black">⚔️</span>
          <div>
            <strong className="text-amber-300 print:text-black font-cinzel">
              Godtear Tabletop Skirmish:
            </strong>{' '}
            Ricorda che la fase di preparazione precede la fase di scontro in ciascun turno di gioco.
            Posiziona i modelli dei seguaci e le carte abilità prima del tiro d'iniziativa.
          </div>
        </div>
      </div>

      {/* MODAL: Save Session to Archive */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleSaveToArchive}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4 text-slate-100"
          >
            <h3 className="text-lg font-bold font-cinzel text-amber-300">
              Salva Sessione nell'Archivio
            </h3>
            <p className="text-xs text-slate-300">
              Assegna un nome identificativo a questa sessione di draft per ritrovarla in qualsiasi momento.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Nome della Sessione
              </label>
              <input
                type="text"
                required
                value={customSaveName}
                onChange={(e) => setCustomSaveName(e.target.value)}
                placeholder="Es. Torneo Locale - Finale"
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-md transition"
              >
                Salva
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
