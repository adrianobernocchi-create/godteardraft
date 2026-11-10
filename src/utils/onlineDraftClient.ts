import { DraftPick, DraftSession, ParticipantIdentity } from '../types';

const IDENTITY_STORAGE_PREFIX = 'godtear_player_identity_';

export function getSavedIdentity(roomCode: string): ParticipantIdentity | null {
  try {
    const raw = localStorage.getItem(`${IDENTITY_STORAGE_PREFIX}${roomCode}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveIdentity(roomCode: string, identity: ParticipantIdentity): void {
  try {
    localStorage.setItem(`${IDENTITY_STORAGE_PREFIX}${roomCode}`, JSON.stringify(identity));
  } catch (err) {
    console.error('Errore nel salvataggio identità:', err);
  }
}

/**
 * Creates or registers an online draft session on the server.
 */
export async function createRemoteDraftSession(
  session: DraftSession
): Promise<{ roomCode: string; session: DraftSession }> {
  const res = await fetch('/api/drafts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Impossibile creare la sessione online sul server.');
  }

  return res.json();
}

/**
 * Fetches an online draft session by its room code.
 */
export async function fetchRemoteDraftSession(roomCode: string): Promise<DraftSession | null> {
  const cleanCode = roomCode.trim().toUpperCase();
  const res = await fetch(`/api/drafts/${cleanCode}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Errore nel recupero della sessione online.');
  }

  const data = await res.json();
  return data.session;
}

/**
 * Syncs full session state to the server.
 */
export async function syncRemoteDraftSession(session: DraftSession): Promise<DraftSession> {
  if (!session.roomCode) return session;
  const cleanCode = session.roomCode.trim().toUpperCase();

  const res = await fetch(`/api/drafts/${cleanCode}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Errore durante la sincronizzazione con il server.');
  }

  const data = await res.json();
  return data.session;
}

/**
 * Executes a pick on the online server.
 */
export async function executeRemotePick(roomCode: string, championId: string): Promise<DraftSession> {
  const cleanCode = roomCode.trim().toUpperCase();
  const res = await fetch(`/api/drafts/${cleanCode}/pick`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ championId })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Errore durante la selezione del Campione.');
  }

  const data = await res.json();
  return data.session;
}

/**
 * Releases a champion on the online server back to the pool.
 */
export async function releaseRemotePick(roomCode: string, championId: string): Promise<DraftSession> {
  const cleanCode = roomCode.trim().toUpperCase();
  const res = await fetch(`/api/drafts/${cleanCode}/release`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ championId })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Errore durante il rilascio del Campione.');
  }

  const data = await res.json();
  return data.session;
}

/**
 * Undoes the last pick on the online server.
 */
export async function undoRemotePick(roomCode: string): Promise<DraftSession> {
  const cleanCode = roomCode.trim().toUpperCase();
  const res = await fetch(`/api/drafts/${cleanCode}/undo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Errore durante l\'annullamento della selezione.');
  }

  const data = await res.json();
  return data.session;
}

/**
 * Subscribes to real-time updates for an online room using Server-Sent Events (SSE)
 * with automatic fallback polling if SSE is disconnected.
 */
export function subscribeToRemoteDraft(
  roomCode: string,
  onUpdate: (session: DraftSession) => void
): () => void {
  const cleanCode = roomCode.trim().toUpperCase();
  let eventSource: EventSource | null = null;
  let pollInterval: NodeJS.Timeout | null = null;
  let isSubscribed = true;

  const startPolling = () => {
    if (pollInterval) return;
    pollInterval = setInterval(async () => {
      if (!isSubscribed) return;
      try {
        const session = await fetchRemoteDraftSession(cleanCode);
        if (session && isSubscribed) {
          onUpdate(session);
        }
      } catch {
        // Silently retry next poll
      }
    }, 2000);
  };

  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };

  try {
    eventSource = new EventSource(`/api/drafts/${cleanCode}/events`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.session && isSubscribed) {
          onUpdate(data.session);
        }
      } catch (err) {
        console.error('Errore parsing evento SSE:', err);
      }
    };

    eventSource.onerror = () => {
      // In case SSE is blocked or fails, fall back to polling smoothly
      startPolling();
    };

    eventSource.onopen = () => {
      stopPolling();
    };
  } catch {
    startPolling();
  }

  return () => {
    isSubscribed = false;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    stopPolling();
  };
}
