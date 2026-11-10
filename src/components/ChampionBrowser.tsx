import React, { useState } from 'react';
import { Search, Filter, BookOpen } from 'lucide-react';
import { Champion, ChampionRole, ChampionTier } from '../types';
import { CHAMPIONS_DATA, ROLE_INFO } from '../data/champions';
import { RoleBadge } from './RoleBadge';
import { ChampionEmblem } from './ChampionEmblem';
import { ChampionDetailModal } from './ChampionDetailModal';

export const ChampionBrowser: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<ChampionRole | 'Tutti'>('Tutti');
  const [selectedTier, setSelectedTier] = useState<ChampionTier | 'Tutti'>('Tutti');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChampion, setSelectedChampion] = useState<Champion | null>(null);

  const filtered = CHAMPIONS_DATA.filter((champ) => {
    if (selectedRole !== 'Tutti' && champ.ruolo !== selectedRole) {
      return false;
    }
    if (selectedTier !== 'Tutti' && champ.tier !== selectedTier) {
      return false;
    }
    if (
      searchQuery.trim() &&
      !champ.nome.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !champ.sintesi.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !champ.seguaci?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Calculate counts per role
  const roleCounts = {
    Tutti: CHAMPIONS_DATA.length,
    Guardian: CHAMPIONS_DATA.filter((c) => c.ruolo === 'Guardian').length,
    Maelstrom: CHAMPIONS_DATA.filter((c) => c.ruolo === 'Maelstrom').length,
    Shaper: CHAMPIONS_DATA.filter((c) => c.ruolo === 'Shaper').length,
    Slayer: CHAMPIONS_DATA.filter((c) => c.ruolo === 'Slayer').length
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Title & Stats */}
      <div className="space-y-2 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl sm:text-3xl font-bold font-cinzel text-amber-300">
            Compendio Campioni di Godtear
          </h1>
        </div>
        <p className="text-sm text-slate-400">
          Esplora l'archivio completo dei 27 Champion. Consulta le caratteristiche tattiche, le sinergie e i ruoli sul campo.
        </p>
      </div>

      {/* Role Summary Badges Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['Guardian', 'Maelstrom', 'Shaper', 'Slayer'] as const).map((r) => {
          const info = ROLE_INFO[r];
          return (
            <div
              key={r}
              onClick={() => setSelectedRole(selectedRole === r ? 'Tutti' : r)}
              className={`p-3.5 rounded-xl border cursor-pointer transition select-none flex items-center justify-between ${
                selectedRole === r
                  ? `${info.bgBadge} ${info.borderBadge} ring-2 ring-amber-400/50`
                  : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80'
              }`}
            >
              <div>
                <RoleBadge ruolo={r} size="sm" />
                <div className="text-[11px] text-slate-400 mt-1">
                  {roleCounts[r]} Champion
                </div>
              </div>
              <span className="text-xl font-bold font-cinzel text-slate-300">
                {roleCounts[r]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca per nome Champion, seguaci o caratteristica..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-950 border border-slate-700/80 rounded-lg text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>Tier:</span>
            </span>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value as ChampionTier | 'Tutti')}
              className="text-xs bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="Tutti">Tutti i Tier</option>
              <option value="S">Tier S</option>
              <option value="A">Tier A</option>
              <option value="B">Tier B</option>
              <option value="C">Tier C</option>
              <option value="D">Tier D</option>
              <option value="Da verificare">Da verificare</option>
            </select>
          </div>
        </div>

        {/* Role tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-slate-800/80 pt-3">
          <span className="text-xs text-slate-400 font-cinzel uppercase tracking-wider font-semibold mr-1">
            Filtra Ruolo:
          </span>
          {(['Tutti', 'Guardian', 'Maelstrom', 'Shaper', 'Slayer'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setSelectedRole(r)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition shrink-0 ${
                selectedRole === r
                  ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              {r} ({roleCounts[r]})
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Champions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((champ) => (
          <div
            key={champ.id}
            onClick={() => setSelectedChampion(champ)}
            className="group cursor-pointer p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-amber-500/50 shadow-md transition duration-200 flex flex-col justify-between space-y-3"
          >
            <div>
              {/* Header */}
              <div className="flex items-start gap-3">
                <ChampionEmblem name={champ.nome} role={champ.ruolo} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-base font-bold font-cinzel text-slate-100 group-hover:text-amber-300 transition truncate">
                      {champ.nome}
                    </h3>
                    <span className="text-[10px] text-amber-400/80 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono">
                      {champ.tier}
                    </span>
                  </div>
                  <div className="mt-1">
                    <RoleBadge ruolo={champ.ruolo} size="sm" />
                  </div>
                </div>
              </div>

              {/* Followers */}
              {champ.seguaci && (
                <div className="text-[11px] text-slate-400 mt-2 font-sans">
                  Seguaci: <strong className="text-slate-300">{champ.seguaci}</strong>
                </div>
              )}

              {/* Summary */}
              <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                {champ.sintesi}
              </p>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="text-[11px] text-slate-500">{champ.statoVerifica}</span>
              <span className="text-amber-400 font-semibold group-hover:underline">
                Apri Scheda →
              </span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="p-12 text-center rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
          <p className="text-slate-400 text-sm">
            Nessun Campione trovato con i criteri specificati.
          </p>
          <button
            onClick={() => {
              setSelectedRole('Tutti');
              setSelectedTier('Tutti');
              setSearchQuery('');
            }}
            className="text-xs text-amber-400 hover:underline font-semibold"
          >
            Azzera filtri di ricerca
          </button>
        </div>
      )}

      {/* Detail Modal */}
      <ChampionDetailModal
        champion={selectedChampion}
        onClose={() => setSelectedChampion(null)}
      />
    </div>
  );
};
