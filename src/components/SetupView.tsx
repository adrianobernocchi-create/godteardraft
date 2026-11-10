import React, { useState } from 'react';
import { Users, User, Shuffle, Flag, Play, Check, HelpCircle, Globe, Laptop, Ban, Sparkles, RefreshCw } from 'lucide-react';
import { DraftConfig, DraftMode, DraftOrder, Player } from '../types';
import { CHAMPIONS_DATA, STANDARD_SCENARIOS } from '../data/champions';
import { generateDraftTurns, generateDefaultLimitedPool } from '../utils/draftLogic';
import { ChampionEmblem } from './ChampionEmblem';
import { RoleBadge } from './RoleBadge';

interface SetupViewProps {
  onStartDraft: (config: DraftConfig, isOnline?: boolean) => void;
  onCancel: () => void;
}

export const SetupView: React.FC<SetupViewProps> = ({ onStartDraft, onCancel }) => {
  // Session connectivity mode: online shared room vs offline local
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Mode selection: 'individual' (Modalità A) or 'teams' (Modalità B)
  const [mode, setMode] = useState<DraftMode>('teams');

  // Mode A options
  const [playerCount, setPlayerCount] = useState<2 | 4 | 6 | 8>(4);
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({
    a1: 'Giocatore A1',
    a2: 'Giocatore A2',
    a3: 'Giocatore A3',
    a4: 'Giocatore A4',
    b1: 'Giocatore B1',
    b2: 'Giocatore B2',
    b3: 'Giocatore B3',
    b4: 'Giocatore B4'
  });

  // Mode B options: roster size per team
  const [rosterSize, setRosterSize] = useState<1 | 2 | 3 | 4>(3);

  // Common options
  const [order, setOrder] = useState<DraftOrder>('snake');
  const [firstTeam, setFirstTeam] = useState<'A' | 'B'>('A');
  const [teamAName, setTeamAName] = useState('Custodi della Rovina');
  const [teamBName, setTeamBName] = useState('Campioni dell\'Ascesa');
  const [scenario, setScenario] = useState('');
  const [selectedStandardScenario, setSelectedStandardScenario] = useState<string>('death');

  // Limited Pool state (12 champions: 3 per role)
  const [limitedPool, setLimitedPool] = useState<string[]>(() => generateDefaultLimitedPool());

  const handleRerollPool = () => {
    setLimitedPool(generateDefaultLimitedPool());
  };

  // Helper to build players array for Mode A
  const getPlayersList = (): Player[] => {
    if (mode === 'teams') return [];

    const half = playerCount / 2;
    const list: Player[] = [];
    for (let i = 1; i <= half; i++) {
      list.push({
        id: `p_a${i}`,
        name: playerNames[`a${i}`]?.trim() || `Giocatore A${i}`,
        team: 'A'
      });
    }
    for (let i = 1; i <= half; i++) {
      list.push({
        id: `p_b${i}`,
        name: playerNames[`b${i}`]?.trim() || `Giocatore B${i}`,
        team: 'B'
      });
    }
    return list;
  };

  const handlePlayerNameChange = (key: string, value: string) => {
    setPlayerNames(prev => ({ ...prev, [key]: value }));
  };

  const currentConfig: DraftConfig = {
    mode,
    playerCount,
    rosterSize,
    order,
    firstTeam,
    teamAName: teamAName.trim() || 'Squadra A',
    teamBName: teamBName.trim() || 'Squadra B',
    players: getPlayersList(),
    scenario: scenario.trim() || (selectedStandardScenario ? STANDARD_SCENARIOS.find(s => s.id === selectedStandardScenario)?.nome : undefined),
    limitedPool: order === 'limited_pool' ? limitedPool : undefined
  };

  // Preview the sequence of turns
  const previewTurns = generateDraftTurns(currentConfig);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartDraft(currentConfig, isOnline);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Page Title */}
      <div className="space-y-2 border-b border-slate-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold font-cinzel text-amber-300">
          Configurazione Partita
        </h1>
        <p className="text-sm text-slate-400">
          Scegli la modalità di gioco, imposta le squadre, definisci l'ordine di selezione e personalizza il tavolo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Connectivity Type: Online Multi-device vs Local */}
        <div className="space-y-3 p-5 rounded-xl border border-slate-800 bg-slate-900/60 shadow-md">
          <label className="block text-xs font-semibold tracking-wider text-amber-400 uppercase font-cinzel">
            Tipo di Connessione della Sessione
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsOnline(true)}
              className={`p-4 rounded-xl border-2 text-left flex items-start gap-3 transition ${
                isOnline
                  ? 'border-emerald-500 bg-emerald-950/30 text-emerald-200 shadow-md shadow-emerald-950/40'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className={`p-2 rounded-lg ${isOnline ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                <Globe className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-slate-100 flex items-center justify-between">
                  <span>Draft Online Multigiocatore</span>
                  {isOnline && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Genera un codice stanza (es. GT-8429) per consentire a 2 o più giocatori di collegarsi dai propri computer o smartphone con aggiornamento in tempo reale.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsOnline(false)}
              className={`p-4 rounded-xl border-2 text-left flex items-start gap-3 transition ${
                !isOnline
                  ? 'border-amber-500 bg-amber-950/30 text-amber-200 shadow-md shadow-amber-950/40'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className={`p-2 rounded-lg ${!isOnline ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                <Laptop className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-slate-100 flex items-center justify-between">
                  <span>Draft Locale Singolo</span>
                  {!isOnline && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Tutti i giocatori effettuano la scelta dallo stesso computer o tablet a turno, salvando i dati solo sul browser locale.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Step 1: Mode Selection */}
        <div className="space-y-4">
          <label className="block text-xs font-semibold tracking-wider text-amber-400 uppercase font-cinzel">
            1. Modalità di Gioco
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Modalità A */}
            <div
              onClick={() => setMode('individual')}
              className={`cursor-pointer p-5 rounded-xl border-2 transition relative ${
                mode === 'individual'
                  ? 'border-amber-500 bg-amber-950/30 shadow-lg shadow-amber-950/50'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${mode === 'individual' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 font-cinzel">Modalità A: Draft Individuale</h3>
                    <p className="text-xs text-slate-400 mt-0.5">2, 4, 6 o 8 giocatori divisi in 2 squadre</p>
                  </div>
                </div>
                {mode === 'individual' && <Check className="w-5 h-5 text-amber-400" />}
              </div>
              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                Ogni giocatore controlla esattamente 1 Champion durante la partita e lo seleziona individualmente.
              </p>
            </div>

            {/* Modalità B */}
            <div
              onClick={() => setMode('teams')}
              className={`cursor-pointer p-5 rounded-xl border-2 transition relative ${
                mode === 'teams'
                  ? 'border-amber-500 bg-amber-950/30 shadow-lg shadow-amber-950/50'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${mode === 'teams' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 font-cinzel">Modalità B: Draft per Squadre</h3>
                    <p className="text-xs text-slate-400 mt-0.5">2 partecipanti testa a testa (1 per squadra)</p>
                  </div>
                </div>
                {mode === 'teams' && <Check className="w-5 h-5 text-amber-400" />}
              </div>
              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                Ciascun partecipante seleziona un roster di 1, 2, 3 oppure 4 Champion per la propria squadra.
              </p>
            </div>
          </div>
        </div>

        {/* Step 2: Dimensions (Player Count for Mode A, Roster Size for Mode B) */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
          <label className="block text-xs font-semibold tracking-wider text-amber-400 uppercase font-cinzel">
            2. {mode === 'individual' ? 'Numero di Giocatori Totali' : 'Dimensione Roster (Champion per Squadra)'}
          </label>

          {mode === 'individual' ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([2, 4, 6, 8] as const).map(count => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setPlayerCount(count)}
                    className={`py-3 px-4 rounded-lg font-bold text-sm border transition flex flex-col items-center justify-center gap-1 ${
                      playerCount === count
                        ? 'border-amber-500 bg-amber-500 text-slate-950 shadow-md'
                        : 'border-slate-800 bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <span>{count} Giocatori</span>
                    <span className="text-[11px] font-normal opacity-80">
                      {count / 2} per squadra
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                La partita richiederà {playerCount} selezioni totali (1 Champion per giocatore).
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([1, 2, 3, 4] as const).map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setRosterSize(size)}
                    className={`py-3 px-4 rounded-lg font-bold text-sm border transition flex flex-col items-center justify-center gap-1 ${
                      rosterSize === size
                        ? 'border-amber-500 bg-amber-500 text-slate-950 shadow-md'
                        : 'border-slate-800 bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <span>{size} {size === 1 ? 'Champion' : 'Champion'}</span>
                    <span className="text-[11px] font-normal opacity-80">
                      Totale: {size * 2} selezioni
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                Partita standard di Godtear: tipicamente 3 Champion per squadra (6 Champion totali sul tabellone).
              </p>
            </div>
          )}
        </div>

        {/* Step 3: Squadre e Nomi */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-5">
          <label className="block text-xs font-semibold tracking-wider text-amber-400 uppercase font-cinzel">
            3. Squadre e Partecipanti
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Squadra A */}
            <div className="p-4 rounded-lg border border-blue-900/40 bg-blue-950/20 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">
                  Nome Squadra A
                </label>
                <input
                  type="text"
                  value={teamAName}
                  onChange={(e) => setTeamAName(e.target.value)}
                  placeholder="Es. Custodi della Rovina"
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-400"
                />
              </div>

              {mode === 'individual' && (
                <div className="space-y-2 pt-2 border-t border-blue-900/30">
                  <span className="text-xs font-medium text-slate-400 block">
                    Giocatori Squadra A ({playerCount / 2}):
                  </span>
                  {Array.from({ length: playerCount / 2 }).map((_, i) => (
                    <input
                      key={`a${i + 1}`}
                      type="text"
                      value={playerNames[`a${i + 1}`] || ''}
                      onChange={(e) => handlePlayerNameChange(`a${i + 1}`, e.target.value)}
                      placeholder={`Giocatore A${i + 1}`}
                      className="w-full px-3 py-1.5 text-xs bg-slate-900/80 border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-blue-400"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Squadra B */}
            <div className="p-4 rounded-lg border border-amber-900/40 bg-amber-950/20 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1">
                  Nome Squadra B
                </label>
                <input
                  type="text"
                  value={teamBName}
                  onChange={(e) => setTeamBName(e.target.value)}
                  placeholder="Es. Campioni dell'Ascesa"
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              {mode === 'individual' && (
                <div className="space-y-2 pt-2 border-t border-amber-900/30">
                  <span className="text-xs font-medium text-slate-400 block">
                    Giocatori Squadra B ({playerCount / 2}):
                  </span>
                  {Array.from({ length: playerCount / 2 }).map((_, i) => (
                    <input
                      key={`b${i + 1}`}
                      type="text"
                      value={playerNames[`b${i + 1}`] || ''}
                      onChange={(e) => handlePlayerNameChange(`b${i + 1}`, e.target.value)}
                      placeholder={`Giocatore B${i + 1}`}
                      className="w-full px-3 py-1.5 text-xs bg-slate-900/80 border border-slate-700/80 rounded-md text-slate-200 focus:outline-none focus:border-amber-400"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 4: Draft Order & Starting Team */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-5">
          <label className="block text-xs font-semibold tracking-wider text-amber-400 uppercase font-cinzel">
            4. Ordine di Draft e Squadra Iniziale
          </label>

          <div className="space-y-4">
            {/* Order Type */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400 block font-medium">Metodo e Formato di Selezione:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setOrder('snake')}
                  className={`p-3 rounded-xl border text-left transition ${
                    order === 'snake'
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-semibold shadow-md shadow-amber-950/30'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-sm">
                    <Shuffle className="w-4 h-4 text-amber-400" />
                    <span>Snake (A-B-B-A)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Bilanciato: chi sceglie per secondo effettua due scelte consecutive nei round intermedi.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setOrder('alternate')}
                  className={`p-3 rounded-xl border text-left transition ${
                    order === 'alternate'
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-semibold shadow-md shadow-amber-950/30'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-sm">
                    <Shuffle className="w-4 h-4 text-amber-400" />
                    <span>Alternato (A-B-A-B)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Classico: una singola scelta a turno per ciascuna squadra dall'intero pool disponibile.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setOrder('limited_pool')}
                  className={`p-3 rounded-xl border text-left transition ${
                    order === 'limited_pool'
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-semibold shadow-md shadow-amber-950/30'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-sm">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Limited Pool & Ban</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Competitivo: pool di 12 (3 per ruolo). 1 Ban a testa, poi scelte alternate A-B-A-B.
                  </p>
                </button>
              </div>
            </div>

            {/* Limited Pool 12-Champion Preview & Reroll Box */}
            {order === 'limited_pool' && (
              <div className="p-4 rounded-xl border border-amber-500/40 bg-slate-950/80 space-y-3.5 shadow-lg animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div>
                    <h4 className="text-sm font-bold font-cinzel text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Pool Ristretto di 12 Campioni (3 per Classe)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Il primo giocatore banna 1 dei 12 campioni. Il secondo giocatore banna 1 degli 11 rimanenti. Poi le squadre alternano le scelte.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRerollPool}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition active:scale-95 shrink-0 self-start sm:self-auto"
                    title="Estrai casualmente altri 3 campioni per ciascun ruolo"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Rigenera Pool Casuale</span>
                  </button>
                </div>

                {/* Grouped by Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(['Guardian', 'Maelstrom', 'Shaper', 'Slayer'] as const).map((role) => {
                    const champsInRole = limitedPool
                      .map((id) => CHAMPIONS_DATA.find((c) => c.id === id))
                      .filter((c): c is typeof CHAMPIONS_DATA[0] => c !== undefined && c.ruolo === role);

                    return (
                      <div key={role} className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/70 space-y-2">
                        <div className="flex items-center justify-between">
                          <RoleBadge ruolo={role} size="sm" />
                          <span className="text-[10px] text-slate-400 font-mono font-medium">3 Campioni</span>
                        </div>
                        <div className="space-y-1.5">
                          {champsInRole.map((champ) => (
                            <div
                              key={champ.id}
                              className="p-1.5 rounded bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs"
                            >
                              <ChampionEmblem name={champ.nome} role={champ.ruolo} size="sm" />
                              <span className="font-semibold text-slate-200 truncate">{champ.nome}</span>
                              <span className="text-[10px] text-amber-400 ml-auto font-mono">T{champ.tier}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Starting Team */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-xs text-slate-400 block font-medium">Prima scelta / primo ban spetta a:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setFirstTeam('A')}
                  className={`p-3 rounded-lg border text-center transition ${
                    firstTeam === 'A'
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300 font-bold'
                      : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-sm">Squadra A ({teamAName || 'Squadra A'})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFirstTeam('B')}
                  className={`p-3 rounded-lg border text-center transition ${
                    firstTeam === 'B'
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold'
                      : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-sm">Squadra B ({teamBName || 'Squadra B'})</span>
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* Step 5: Scenario (Optional) */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold tracking-wider text-amber-400 uppercase font-cinzel flex items-center gap-1.5">
              <Flag className="w-4 h-4" />
              <span>5. Scenario di Gioco (Facoltativo)</span>
            </label>
            <span className="text-[11px] text-slate-500">Opzionale</span>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedStandardScenario('');
                  setScenario('');
                }}
                className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                  !selectedStandardScenario && !scenario
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-semibold'
                    : 'border-slate-800 bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                Nessuno scenario
              </button>

              {STANDARD_SCENARIOS.map(sc => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    setSelectedStandardScenario(sc.id);
                    setScenario('');
                  }}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                    selectedStandardScenario === sc.id
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-semibold'
                      : 'border-slate-800 bg-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                  title={sc.descrizione}
                >
                  {sc.nome}
                </button>
              ))}
            </div>

            <div>
              <input
                type="text"
                value={scenario}
                onChange={(e) => {
                  setScenario(e.target.value);
                  setSelectedStandardScenario('');
                }}
                placeholder="Oppure inserisci un nome scenario personalizzato..."
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Configuration Summary & Turn Sequence Preview */}
        <div className="p-6 rounded-xl border border-amber-500/30 bg-slate-900/90 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold font-cinzel text-amber-300 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Riepilogo Configurazione del Draft</span>
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
              Totale scelte: <strong className="text-amber-400">{previewTurns.length}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block">Modalità:</span>
              <strong className="text-slate-200 font-medium">
                {mode === 'individual' ? `Individuale (${playerCount}G)` : `Squadre (${rosterSize} Ch/Sq)`}
              </strong>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block">Ordine:</span>
              <strong className="text-slate-200 font-medium">
                {order === 'limited_pool'
                  ? 'Limited Pool (Pool 12 & Ban)'
                  : order === 'snake'
                  ? 'Snake (A-B-B-A)'
                  : 'Alternato (A-B-A-B)'}
              </strong>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block">Prima Scelta:</span>
              <strong className="text-slate-200 font-medium">
                {firstTeam === 'A' ? teamAName || 'Squadra A' : teamBName || 'Squadra B'}
              </strong>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block">Scenario:</span>
              <strong className="text-slate-200 font-medium truncate block">
                {currentConfig.scenario || 'Non impostato'}
              </strong>
            </div>
          </div>

          {/* Sequence Preview Badges */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold font-cinzel">
              Sequenza dei Turni Calcolata:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {previewTurns.map((turn) => (
                <div
                  key={turn.turnNumber}
                  className={`text-[11px] px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
                    turn.type === 'ban'
                      ? 'bg-rose-950/70 border-rose-500/50 text-rose-200'
                      : turn.team === 'A'
                      ? 'bg-blue-950/50 border-blue-500/40 text-blue-200'
                      : 'bg-amber-950/50 border-amber-500/40 text-amber-200'
                  }`}
                >
                  <span className="opacity-60">#{turn.turnNumber}</span>
                  {turn.type === 'ban' && <span className="font-bold text-rose-400">⛔ BAN:</span>}
                  <span className="font-semibold">{turn.playerName}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            Annulla
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-7 py-2.5 text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Inizia Draft</span>
          </button>
        </div>
      </form>
    </div>
  );
};
