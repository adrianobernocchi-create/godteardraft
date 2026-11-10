import React, { useState, useEffect } from 'react';

import {
  Archive,
  Download,
  Upload,
  Play,
  Trash2,
  Edit3,
  Calendar,
  CheckCircle2,
  Clock,
  PlusCircle,
  AlertTriangle
} from 'lucide-react';
import { DraftSession } from '../types';
import { CHAMPIONS_DATA } from '../data/champions';
import {
  deleteSavedSession,
  clearSavedSessions,
  getSavedSessions,
  renameSavedSession,
  saveSessionToArchive
} from '../utils/storage';
import { exportDraftToJson, formatItalianDate, importDraftFromJson } from '../utils/draftLogic';

interface ArchiveViewProps {
  onLoadSession: (session: DraftSession) => void;
  onNewDraft: () => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ onLoadSession, onNewDraft }) => {
  const [sessions, setSessions] = useState<DraftSession[]>(getSavedSessions());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importRawJson, setImportRawJson] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // In-app confirmation modals (no window.confirm/alert in iframe)
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [deletingSession, setDeletingSession] = useState<{ id: string; name: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const refreshSessions = () => {
    setSessions(getSavedSessions());
  };

  const handleConfirmDeleteSingle = () => {
    if (deletingSession) {
      deleteSavedSession(deletingSession.id);
      setDeletingSession(null);
      refreshSessions();
      setToastMessage({ type: 'success', text: `Sessione eliminata dall'archivio.` });
    }
  };

  const handleConfirmClearAll = () => {
    clearSavedSessions();
    setIsClearModalOpen(false);
    refreshSessions();
    setToastMessage({ type: 'success', text: 'Archivio svuotato con successo. Tutte le sessioni sono state eliminate.' });
  };

  const handleStartRename = (session: DraftSession) => {
    setRenamingId(session.id);
    setRenameValue(session.name);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (renamingId && renameValue.trim()) {
      renameSavedSession(renamingId, renameValue.trim());
      setRenamingId(null);
      refreshSessions();
      setToastMessage({ type: 'success', text: 'Nome della sessione aggiornato.' });
    }
  };

  const handleExport = (session: DraftSession) => {
    const jsonStr = exportDraftToJson(session);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = session.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    a.download = `${safeName}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle file input upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = importDraftFromJson(text);
      if (res.success && res.session) {
        saveSessionToArchive(res.session);
        refreshSessions();
        setImportModalOpen(false);
        setImportError(null);
        setToastMessage({ type: 'success', text: `Sessione "${res.session.name}" importata con successo!` });
      } else {
        setImportError(res.error || 'Errore nel parsing del file JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Handle direct text paste import
  const handlePasteImport = (e: React.FormEvent) => {
    e.preventDefault();
    const res = importDraftFromJson(importRawJson);
    if (res.success && res.session) {
      saveSessionToArchive(res.session);
      refreshSessions();
      setImportModalOpen(false);
      setImportRawJson('');
      setImportError(null);
      setToastMessage({ type: 'success', text: `Sessione "${res.session.name}" importata con successo!` });
    } else {
      setImportError(res.error || 'Struttura JSON non valida.');
    }
  };


  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-lg animate-in fade-in ${
            toastMessage.type === 'success'
              ? 'border-emerald-500/50 bg-emerald-950/80 text-emerald-200'
              : 'border-rose-500/50 bg-rose-950/80 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Archive className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-bold font-cinzel text-amber-300">
              Archivio delle Sessioni
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Gestisci tutti i draft salvati localmente nel browser, esporta o importa file JSON per condividere le partite.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sessions.length > 0 && (
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 transition active:scale-95"
              title="Elimina permanentemente tutte le sessioni salvate per pulizia"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Svuota Archivio</span>
            </button>
          )}

          <button
            onClick={() => setImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Importa JSON</span>
          </button>

          <button
            onClick={onNewDraft}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nuovo Draft</span>
          </button>
        </div>
      </div>

      {/* List of Saved Sessions */}
      {sessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="p-5 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-amber-500/40 shadow-lg transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold font-cinzel text-slate-100 text-base truncate flex-1" title={session.name}>
                    {session.name}
                  </h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                      session.status === 'completed'
                        ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                        : 'bg-amber-950/80 border border-amber-500/40 text-amber-300'
                    }`}
                  >
                    {session.status === 'completed' ? 'Completato' : 'In corso'}
                  </span>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <div className="text-slate-300 font-medium">
                    {session.config.teamAName} vs {session.config.teamBName}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>Creato: {formatItalianDate(session.createdAt)}</span>
                  </div>
                  {session.config.scenario && (
                    <div className="text-[11px] text-amber-400/90 font-medium">
                      Scenario: {session.config.scenario}
                    </div>
                  )}
                </div>

                {/* Champion summary chips */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <span className="text-[11px] text-slate-400 block font-medium">
                    Campioni selezionati ({session.picks.length}/{session.turns.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {session.picks.slice(0, 6).map((p) => {
                      const champ = CHAMPIONS_DATA.find((c) => c.id === p.championId);
                      return (
                        <span
                          key={p.championId}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300"
                        >
                          {champ?.nome || p.championId}
                        </span>
                      );
                    })}
                    {session.picks.length > 6 && (
                      <span className="text-[10px] px-1.5 py-0.5 text-slate-500">
                        +{session.picks.length - 6} altri
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onLoadSession(session)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{session.status === 'completed' ? 'Visualizza' : 'Riprendi'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartRename(session)}
                    className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                    title="Rinomina"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExport(session)}
                    className="p-1.5 text-slate-400 hover:text-blue-300 rounded hover:bg-slate-800 transition"
                    title="Esporta JSON"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingSession({ id: session.id, name: session.name })}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition"
                    title="Elimina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (

        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
          <Archive className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold font-cinzel text-slate-300 text-lg">
              Nessuna sessione salvata
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Quando completi o metti in pausa un draft, salvalo nell'archivio per ritrovarlo qui, esportarlo o stamparlo.
            </p>
          </div>
          <button
            onClick={onNewDraft}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Inizia il tuo primo Draft</span>
          </button>
        </div>
      )}

      {/* MODAL: Rename */}
      {renamingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleSaveRename}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4 text-slate-100"
          >
            <h3 className="text-lg font-bold font-cinzel text-amber-300">
              Rinomina Sessione
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Nuovo nome
              </label>
              <input
                type="text"
                required
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRenamingId(null)}
                className="px-4 py-2 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg"
              >
                Salva
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Import JSON */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold font-cinzel text-amber-300 flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-400" />
                <span>Importa Sessione da JSON</span>
              </h3>
              <button
                onClick={() => {
                  setImportModalOpen(false);
                  setImportError(null);
                }}
                className="text-slate-400 hover:text-white text-xs"
              >
                Chiudi
              </button>
            </div>

            {importError && (
              <div className="p-3 rounded-lg border border-rose-900/50 bg-rose-950/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Method A: File Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Opzione 1: Carica file .json dal tuo dispositivo
              </label>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[11px] text-slate-500 uppercase">oppure</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Method B: Raw JSON text */}
            <form onSubmit={handlePasteImport} className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Opzione 2: Incolla il testo JSON del draft
              </label>
              <textarea
                rows={4}
                value={importRawJson}
                onChange={(e) => setImportRawJson(e.target.value)}
                placeholder='Incolla qui il contenuto JSON del file esportato...'
                className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-amber-400"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={!importRawJson.trim()}
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg disabled:opacity-40"
                >
                  Importa Testo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Svuota Archivio Confirmation ("Sicuro di procedere?") */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-rose-800/80 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800/60 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-cinzel text-rose-300">
                  Svuota Archivio
                </h3>
                <p className="text-xs text-rose-400 font-semibold">
                  Eliminazione permanente di tutte le sessioni
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-300 space-y-2 leading-relaxed">
              <p className="font-semibold text-slate-200">
                Sicuro di voler procedere?
              </p>
              <p className="text-slate-400">
                Tutte le <strong>{sessions.length} sessioni salvate</strong> nell'archivio locale del browser verranno rimosse definitivamente per pulizia. Questa operazione non può essere annullata.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition shadow-md shadow-rose-600/30 active:scale-95"
              >
                Sì, Svuota Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete Single Session Confirmation */}
      {deletingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-rose-950/70 text-rose-400 border border-rose-800/40 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-cinzel text-slate-100">
                  Elimina Sessione
                </h3>
                <p className="text-xs text-slate-400 truncate max-w-[260px]">
                  {deletingSession.name}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Sei sicuro di voler eliminare la sessione <strong>"{deletingSession.name}"</strong> dall'archivio locale?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSession(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSingle}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition active:scale-95"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

