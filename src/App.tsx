import React, { useState, useEffect } from 'react';
import { AppView, DraftConfig, DraftSession } from './types';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { SetupView } from './components/SetupView';
import { DraftView } from './components/DraftView';
import { CompletedView } from './components/CompletedView';
import { ChampionBrowser } from './components/ChampionBrowser';
import { ArchiveView } from './components/ArchiveView';
import { generateDraftTurns } from './utils/draftLogic';
import {
  loadActiveSession,
  saveActiveSession,
  getSavedSessions,
  saveSessionToArchive
} from './utils/storage';
import {
  createRemoteDraftSession,
  fetchRemoteDraftSession,
  syncRemoteDraftSession,
  subscribeToRemoteDraft
} from './utils/onlineDraftClient';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [activeSession, setActiveSession] = useState<DraftSession | null>(() => loadActiveSession());
  const [savedSessions, setSavedSessions] = useState<DraftSession[]>(() => getSavedSessions());

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentView]);

  // URL room param detection on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room') || params.get('draft');
    if (roomParam) {
      fetchRemoteDraftSession(roomParam).then((session) => {
        if (session) {
          setActiveSession(session);
          if (session.status === 'completed') {
            setCurrentView('completed');
          } else {
            setCurrentView('draft');
          }
        }
      }).catch((err) => {
        console.error('Errore caricamento stanza da URL:', err);
      });
    }
  }, []);

  // Real-time synchronization when activeSession has a roomCode
  useEffect(() => {
    if (!activeSession?.roomCode) return;
    const roomCode = activeSession.roomCode;

    const unsubscribe = subscribeToRemoteDraft(roomCode, (serverSession) => {
      setActiveSession(serverSession);
      if (serverSession.status === 'completed' && currentView === 'draft') {
        setCurrentView('completed');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeSession?.roomCode, currentView]);

  // Keep active session saved in localStorage
  useEffect(() => {
    saveActiveSession(activeSession);
  }, [activeSession]);

  // Keep saved sessions list fresh
  const refreshSavedSessions = () => {
    setSavedSessions(getSavedSessions());
  };

  // Start new draft from setup (online or local)
  const handleStartDraft = async (config: DraftConfig, isOnline = true) => {
    const turns = generateDraftTurns(config);
    const modeName = config.mode === 'individual' ? 'Draft Individuale' : 'Draft per Squadre';
    const newSession: DraftSession = {
      id: `draft_${Date.now()}`,
      name: `${modeName} - ${config.teamAName} vs ${config.teamBName}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'in_progress',
      config,
      turns,
      currentTurnIndex: 0,
      picks: [],
      isOnline
    };

    if (isOnline) {
      try {
        const { session: remoteSession, roomCode } = await createRemoteDraftSession(newSession);
        setActiveSession(remoteSession);
        // Update URL query without full reload
        const newUrl = `${window.location.pathname}?room=${roomCode}`;
        window.history.replaceState({ room: roomCode }, '', newUrl);
      } catch (err) {
        console.warn('Creazione sessione remota fallita, ripiego su locale:', err);
        setActiveSession(newSession);
      }
    } else {
      setActiveSession(newSession);
    }

    setCurrentView('draft');
  };

  // Join an existing online room by code
  const handleJoinOnlineDraft = async (roomCode: string): Promise<boolean> => {
    try {
      const session = await fetchRemoteDraftSession(roomCode);
      if (session) {
        setActiveSession(session);
        const newUrl = `${window.location.pathname}?room=${session.roomCode || roomCode.toUpperCase()}`;
        window.history.replaceState({ room: roomCode }, '', newUrl);
        if (session.status === 'completed') {
          setCurrentView('completed');
        } else {
          setCurrentView('draft');
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Update session during draft
  const handleUpdateSession = (updated: DraftSession) => {
    setActiveSession(updated);
    if (updated.roomCode) {
      syncRemoteDraftSession(updated).catch((err) => {
        console.error('Errore sincronizzazione sessione online:', err);
      });
    }
  };

  // Conclude draft and switch to summary view (Bug 1 fix: accepts final updated session)
  const handleConcludeDraft = (finalSession?: DraftSession) => {
    const sessionToFinish = finalSession || activeSession;
    if (sessionToFinish) {
      const completed: DraftSession = {
        ...sessionToFinish,
        status: 'completed',
        updatedAt: new Date().toISOString()
      };
      setActiveSession(completed);
      // Auto-save completed session to archive as well
      saveSessionToArchive(completed);
      refreshSavedSessions();
      if (completed.roomCode) {
        syncRemoteDraftSession(completed).catch(() => {});
      }
    }
    setCurrentView('completed');
  };

  // Pause and exit draft to home/archive
  const handlePauseAndExit = () => {
    if (activeSession) {
      saveSessionToArchive(activeSession);
      refreshSavedSessions();
    }
    setCurrentView('home');
  };

  // Abort and cancel active draft completely
  const handleAbortDraft = () => {
    setActiveSession(null);
    saveActiveSession(null);
    const newUrl = window.location.pathname;
    window.history.replaceState({}, '', newUrl);
    setCurrentView('home');
  };

  // Load a session from archive or recent
  const handleLoadSession = (session: DraftSession) => {
    setActiveSession(session);
    if (session.roomCode) {
      const newUrl = `${window.location.pathname}?room=${session.roomCode}`;
      window.history.replaceState({ room: session.roomCode }, '', newUrl);
    }
    if (session.status === 'completed') {
      setCurrentView('completed');
    } else {
      setCurrentView('draft');
    }
  };

  // Reopen concluded draft for edits/corrections
  const handleReopenDraftForEdit = () => {
    if (activeSession) {
      const reopened: DraftSession = {
        ...activeSession,
        status: 'in_progress',
        updatedAt: new Date().toISOString()
      };
      setActiveSession(reopened);
      if (reopened.roomCode) {
        syncRemoteDraftSession(reopened).catch(() => {});
      }
    }
    setCurrentView('draft');
  };

  // Start a fresh draft flow
  const handleNewDraft = () => {
    setCurrentView('setup');
  };


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navbar (hidden on print) */}
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        activeSession={activeSession}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {currentView === 'home' && (
          <HomeView
            onNavigate={setCurrentView}
            activeSession={activeSession}
            savedSessions={savedSessions}
            onLoadSession={handleLoadSession}
            onJoinRoom={handleJoinOnlineDraft}
          />
        )}

        {currentView === 'setup' && (
          <SetupView
            onStartDraft={handleStartDraft}
            onCancel={() => setCurrentView(activeSession ? 'draft' : 'home')}
          />
        )}

        {currentView === 'draft' && activeSession && (
          <DraftView
            session={activeSession}
            onUpdateSession={handleUpdateSession}
            onConcludeDraft={handleConcludeDraft}
            onPauseAndExit={handlePauseAndExit}
            onAbortDraft={handleAbortDraft}
          />
        )}

        {currentView === 'draft' && !activeSession && (
          <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
            <h2 className="text-xl font-bold font-cinzel text-amber-300">
              Nessun Draft attivo al momento
            </h2>
            <p className="text-sm text-slate-400">
              Configura una nuova partita oppure carica una sessione dall'Archivio.
            </p>
            <button
              onClick={() => setCurrentView('setup')}
              className="px-6 py-2.5 rounded-lg font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition"
            >
              Configura Partita
            </button>
          </div>
        )}

        {currentView === 'completed' && activeSession && (
          <CompletedView
            session={activeSession}
            onNavigate={setCurrentView}
            onNewDraft={handleNewDraft}
            onEditDraft={handleReopenDraftForEdit}
          />
        )}


        {currentView === 'champions' && <ChampionBrowser />}

        {currentView === 'archive' && (
          <ArchiveView
            onLoadSession={handleLoadSession}
            onNewDraft={handleNewDraft}
          />
        )}
      </main>

      {/* Footer (hidden on print) */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/80 text-slate-500 text-xs py-6 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-cinzel text-amber-400 font-bold">Godtear Draft Assistant</span>
            <span>•</span>
            <span>Applicazione per organizzazione draft da tavolo</span>
          </div>
          <div>
            <span>Dati salvati in locale nel browser • 27 Campioni supportati</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
