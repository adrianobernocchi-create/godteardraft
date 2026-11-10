import { DraftSession } from '../types';

const ACTIVE_SESSION_KEY = 'godtear_active_draft_v1';
const SAVED_SESSIONS_KEY = 'godtear_saved_drafts_v1';

export function saveActiveSession(session: DraftSession | null): void {
  try {
    if (!session) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    } else {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
    }
  } catch (err) {
    console.error('Impossibile salvare la sessione attiva in localStorage:', err);
  }
}

export function loadActiveSession(): DraftSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Errore durante il caricamento della sessione attiva:', err);
    return null;
  }
}

export function getSavedSessions(): DraftSession[] {
  try {
    const raw = localStorage.getItem(SAVED_SESSIONS_KEY);
    if (!raw) return [];
    const list: DraftSession[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error('Errore durante il recupero delle sessioni salvate:', err);
    return [];
  }
}

export function saveSessionToArchive(session: DraftSession, customName?: string): DraftSession {
  const sessions = getSavedSessions();
  const name = customName?.trim() || session.name || `Draft ${new Date().toLocaleDateString('it-IT')}`;
  const updatedSession: DraftSession = {
    ...session,
    name,
    updatedAt: new Date().toISOString()
  };

  const existingIndex = sessions.findIndex(s => s.id === session.id);
  let newSessions: DraftSession[];
  if (existingIndex >= 0) {
    newSessions = [...sessions];
    newSessions[existingIndex] = updatedSession;
  } else {
    newSessions = [updatedSession, ...sessions];
  }

  try {
    localStorage.setItem(SAVED_SESSIONS_KEY, JSON.stringify(newSessions));
  } catch (err) {
    console.error('Errore nel salvataggio in archivio:', err);
  }

  return updatedSession;
}

export function renameSavedSession(id: string, newName: string): boolean {
  const sessions = getSavedSessions();
  const idx = sessions.findIndex(s => s.id === id);
  if (idx < 0) return false;

  sessions[idx].name = newName.trim();
  sessions[idx].updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(SAVED_SESSIONS_KEY, JSON.stringify(sessions));
    return true;
  } catch (err) {
    console.error('Errore durante la ridenominazione:', err);
    return false;
  }
}

export function deleteSavedSession(id: string): boolean {
  const sessions = getSavedSessions();
  const filtered = sessions.filter(s => s.id !== id);
  try {
    localStorage.setItem(SAVED_SESSIONS_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error('Errore durante l\'eliminazione della sessione:', err);
    return false;
  }
}

export function clearSavedSessions(): boolean {
  try {
    localStorage.removeItem(SAVED_SESSIONS_KEY);
    return true;
  } catch (err) {
    console.error('Errore durante lo svuotamento dell\'archivio:', err);
    return false;
  }
}

