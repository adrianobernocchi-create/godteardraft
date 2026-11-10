import React from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  UserPlus,
  Users,
  ExternalLink,
  Eye,
  BookOpen,
  FileText,
  Ban
} from 'lucide-react';

import { Champion } from '../types';
import { RoleBadge } from './RoleBadge';
import { ChampionEmblem } from './ChampionEmblem';
import { ROLE_INFO } from '../data/champions';

interface ChampionDetailModalProps {
  champion: Champion | null;
  onClose: () => void;
  onSelectForCurrentTurn?: (championId: string) => void;
  currentPickingName?: string;
  isAlreadyPicked?: boolean;
  pickedByName?: string;
  isBanned?: boolean;
  bannedByName?: string;
  isBanTurn?: boolean;
}

export const ChampionDetailModal: React.FC<ChampionDetailModalProps> = ({
  champion,
  onClose,
  onSelectForCurrentTurn,
  currentPickingName,
  isAlreadyPicked = false,
  pickedByName,
  isBanned = false,
  bannedByName,
  isBanTurn = false
}) => {

  if (!champion) return null;

  const roleInfo = ROLE_INFO[champion.ruolo];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl text-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
          <div className="flex items-center gap-3">
            <ChampionEmblem name={champion.nome} role={champion.ruolo} size="lg" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold font-cinzel text-amber-200 tracking-wide">
                  {champion.nome}
                </h2>
                <RoleBadge ruolo={champion.ruolo} size="md" />
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${
                  champion.tier === 'S'
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-sm shadow-amber-500/30'
                    : champion.tier === 'A'
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                    : champion.tier === 'B'
                    ? 'border-blue-400 bg-blue-500/20 text-blue-300'
                    : champion.tier === 'C'
                    ? 'border-purple-400 bg-purple-500/20 text-purple-300'
                    : 'border-slate-700 bg-slate-800 text-slate-300'
                }`}>
                  Tier {champion.tier}
                </span>
              </div>
              {champion.seguaci && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                  <Users className="w-3.5 h-3.5 text-amber-400/80" />
                  <span>Seguaci: <strong className="text-slate-300">{champion.seguaci}</strong></span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Chiudi scheda"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Status & Source Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3.5 rounded-lg border border-slate-800 bg-slate-950/70 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Dati verificati con <strong>Godtear Community Browser</strong> & <strong>Objective Hex</strong>
              </span>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 self-start sm:self-auto shrink-0">
              Card Browser & Meta
            </span>
          </div>

          {/* Sintesi Caratteristiche */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold tracking-wider text-amber-400 uppercase font-cinzel">
              Sintesi Caratteristiche
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed bg-slate-800/40 p-3.5 rounded-lg border border-slate-700/50">
              {champion.sintesi}
            </p>
          </div>

          {/* Forte Contro & Debole Contro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 p-3.5 rounded-lg border border-emerald-900/40 bg-emerald-950/20">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold uppercase tracking-wider font-cinzel">
                <Sparkles className="w-4 h-4" />
                <span>Forte contro</span>
              </div>
              <p className="text-sm text-slate-300">
                {champion.forteContro}
              </p>
            </div>

            <div className="space-y-2 p-3.5 rounded-lg border border-rose-900/40 bg-rose-950/20">
              <div className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold uppercase tracking-wider font-cinzel">
                <ShieldAlert className="w-4 h-4" />
                <span>Debole contro</span>
              </div>
              <p className="text-sm text-slate-300">
                {champion.deboleContro}
              </p>
            </div>
          </div>

          {/* Sinergie */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold tracking-wider text-amber-400 uppercase font-cinzel">
              Sinergie Tattiche
            </h3>
            <p className="text-sm text-slate-300 bg-slate-800/40 p-3.5 rounded-lg border border-slate-700/50">
              {champion.sinergie}
            </p>
          </div>

          {/* Note Tattiche */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold tracking-wider text-amber-400 uppercase font-cinzel">
              Note Tattiche sul Campo
            </h3>
            <p className="text-sm text-slate-300 bg-slate-800/40 p-3.5 rounded-lg border border-slate-700/50">
              {champion.noteTattiche}
            </p>
          </div>

          {/* Sezione Approfondimenti & Schede Community */}
          <div className="space-y-3 p-4 rounded-xl border border-amber-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-inner">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-wider text-amber-300 uppercase font-cinzel flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Approfondimenti & Schede Community</span>
              </h3>
              <span className="text-[11px] text-slate-400">Card Browser & Guide Verificate</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Consulta le carte complete sul browser della community o leggi l&apos;analisi strategica su Objective Hex:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Link Godtear Community Card Browser */}
              {(champion.linkCommunity || champion.linkSteamforged) && (
                <a
                  href={champion.linkCommunity || champion.linkSteamforged}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col justify-between p-3 rounded-lg border border-slate-750 bg-slate-800/60 hover:bg-slate-800 hover:border-emerald-400/70 transition duration-150 text-left shadow-sm hover:shadow-emerald-500/10"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-300 group-hover:scale-105 transition-transform">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-100 group-hover:text-emerald-200 transition">
                        Scheda Carte Community
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-300 transition shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    Esplora carte abilità, tratti, fasi Plot e Clash di <strong>{champion.nome}</strong> e dei suoi seguaci sul repository di <strong>Godtear Community</strong>.
                  </p>
                  <div className="mt-2.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-400 group-hover:underline">
                    <Eye className="w-3 h-3" />
                    <span>Visualizza Carte su Community Browser →</span>
                  </div>
                </a>
              )}

              {/* Link Objective Hex - Ricerca Blog / Guida Tattica */}
              {champion.linkObjectiveHex && (
                <a
                  href={champion.linkObjectiveHex}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col justify-between p-3 rounded-lg border border-slate-750 bg-slate-800/60 hover:bg-slate-800 hover:border-cyan-400/70 transition duration-150 text-left shadow-sm hover:shadow-cyan-500/10"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-cyan-500/20 text-cyan-300 group-hover:scale-105 transition-transform">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-200 transition">
                        Analisi Tattica & Meta
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300 transition shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    Articoli dedicati, tier review e analisi strategica del Campione a cura del blog competitivo <strong>Objective Hex</strong>.
                  </p>
                  <div className="mt-2.5 flex items-center gap-1 text-[11px] font-semibold text-cyan-400 group-hover:underline">
                    <span>Cerca articoli su Objective Hex →</span>
                  </div>
                </a>
              )}
            </div>

            {/* Quick Links Footer: Community Global Browser + Objective Hex Matchups */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
              <a
                href="https://godtear-community.github.io/browser/#champions"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-slate-300 hover:text-amber-300 hover:underline"
              >
                <span>Tutti i Campioni (Godtear Community Browser)</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              <a
                href="https://www.objectivehex.com/blog/categories/matchups"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 hover:underline font-medium"
              >
                <span>Guida & Analisi Matchup (Objective Hex)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Ruolo Godtear archetipo note */}
          <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/40 text-xs text-slate-400 flex items-start gap-2.5">
            <span className="text-amber-400 mt-0.5">ℹ️</span>
            <div>
              <strong className="text-slate-300">Archetipo di classe ({roleInfo.nome}): </strong>
              {roleInfo.descrizione}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 p-4 border-t border-slate-800 bg-slate-900/95 backdrop-blur flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            Chiudi
          </button>

          {onSelectForCurrentTurn && (
            <div>
              {isBanned ? (
                <span className="text-xs text-rose-300 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-800 flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5 text-rose-400" />
                  <span>Bannato ed escluso {bannedByName ? `da ${bannedByName}` : ''}</span>
                </span>
              ) : isAlreadyPicked ? (
                <span className="text-xs text-amber-300 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
                  Già selezionato {pickedByName ? `da ${pickedByName}` : ''}
                </span>
              ) : isBanTurn ? (
                <button
                  onClick={() => {
                    onSelectForCurrentTurn(champion.id);
                    onClose();
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition active:scale-95"
                >
                  <Ban className="w-4 h-4" />
                  <span>Banna per {currentPickingName || 'il turno di ban'}</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onSelectForCurrentTurn(champion.id);
                    onClose();
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Seleziona per {currentPickingName || 'il turno corrente'}</span>
                </button>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
