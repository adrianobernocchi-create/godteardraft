import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  executePick,
  removeAssignment,
  undoLastPick,
  correctAssignment
} from './src/utils/draftLogic.js';
import { DraftSession } from './src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const SESSIONS_FILE = path.resolve(DATA_DIR, 'draft_sessions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory sessions store with file persistence
const sessionsStore: Map<string, DraftSession> = new Map();

// Active SSE client connections per room
const sseClients: Map<string, Set<Response>> = new Map();

// Helper to load sessions from disk on startup
function loadSessionsFromDisk() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      const data: Record<string, DraftSession> = JSON.parse(raw);
      for (const [code, session] of Object.entries(data)) {
        sessionsStore.set(code.toUpperCase(), session);
      }
      console.log(`Caricate ${sessionsStore.size} sessioni da ${SESSIONS_FILE}`);
    }
  } catch (err) {
    console.error('Errore nel caricamento delle sessioni dal disco:', err);
  }
}

// Helper to save sessions to disk
function saveSessionsToDisk() {
  try {
    const data: Record<string, DraftSession> = {};
    for (const [code, session] of sessionsStore.entries()) {
      data[code] = session;
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Errore nel salvataggio delle sessioni sul disco:', err);
  }
}

// Helper to broadcast session update to all connected SSE clients
function broadcastUpdate(roomCode: string, session: DraftSession) {
  const code = roomCode.toUpperCase();
  const clients = sseClients.get(code);
  if (clients && clients.size > 0) {
    const payload = `data: ${JSON.stringify({ session })}\n\n`;
    for (const res of clients) {
      try {
        res.write(payload);
      } catch {
        clients.delete(res);
      }
    }
  }
}

// Generate random room code like "GT-8429"
function generateRoomCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars[Math.floor(Math.random() * chars.length)];
  }
  return `GT-${rand}`;
}

async function startServer() {
  loadSessionsFromDisk();

  const app = express();
  app.use(express.json());

  // Healthcheck
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      activeRooms: sessionsStore.size
    });
  });

  // GET all public/active rooms summary
  app.get('/api/drafts', (_req, res) => {
    const list = Array.from(sessionsStore.values()).map(s => ({
      roomCode: s.roomCode,
      id: s.id,
      name: s.name,
      status: s.status,
      picksCount: s.picks.length,
      totalTurns: s.turns.length,
      updatedAt: s.updatedAt,
      teamAName: s.config.teamAName,
      teamBName: s.config.teamBName,
      mode: s.config.mode
    }));
    res.json({ drafts: list });
  });

  // POST create new draft room
  app.post('/api/drafts', (req, res) => {
    try {
      const { session } = req.body;
      if (!session || !session.config || !session.turns) {
        res.status(400).json({ error: 'Configurazione sessione non valida.' });
        return;
      }

      const roomCode = (session.roomCode || generateRoomCode()).toUpperCase();
      const onlineSession: DraftSession = {
        ...session,
        roomCode,
        isOnline: true,
        updatedAt: new Date().toISOString()
      };

      sessionsStore.set(roomCode, onlineSession);
      saveSessionsToDisk();
      broadcastUpdate(roomCode, onlineSession);

      res.status(201).json({ roomCode, session: onlineSession });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Errore del server' });
    }
  });

  // GET draft by room code
  app.get('/api/drafts/:roomCode', (req, res) => {
    const code = req.params.roomCode.toUpperCase();
    const session = sessionsStore.get(code);
    if (!session) {
      res.status(404).json({ error: `Nessuna sessione di draft trovata con il codice ${code}.` });
      return;
    }
    res.json({ session });
  });

  // POST sync full draft session state
  app.post('/api/drafts/:roomCode/sync', (req, res) => {
    try {
      const code = req.params.roomCode.toUpperCase();
      const { session } = req.body;
      if (!session) {
        res.status(400).json({ error: 'Dati sessione mancanti.' });
        return;
      }

      const existing = sessionsStore.get(code);
      // Ensure roomCode is consistent
      const updated: DraftSession = {
        ...session,
        roomCode: code,
        isOnline: true,
        updatedAt: new Date().toISOString()
      };

      sessionsStore.set(code, updated);
      saveSessionsToDisk();
      broadcastUpdate(code, updated);

      res.json({ session: updated });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Errore del server' });
    }
  });

  // POST execute pick on server
  app.post('/api/drafts/:roomCode/pick', (req, res) => {
    try {
      const code = req.params.roomCode.toUpperCase();
      const { championId } = req.body;
      if (!championId) {
        res.status(400).json({ error: 'championId mancante.' });
        return;
      }

      const session = sessionsStore.get(code);
      if (!session) {
        res.status(404).json({ error: 'Sessione non trovata.' });
        return;
      }

      const updated = executePick(session, championId);
      sessionsStore.set(code, updated);
      saveSessionsToDisk();
      broadcastUpdate(code, updated);

      res.json({ session: updated });
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Errore nella selezione.' });
    }
  });

  // POST release pick back to pool
  app.post('/api/drafts/:roomCode/release', (req, res) => {
    try {
      const code = req.params.roomCode.toUpperCase();
      const { championId } = req.body;
      if (!championId) {
        res.status(400).json({ error: 'championId mancante.' });
        return;
      }

      const session = sessionsStore.get(code);
      if (!session) {
        res.status(404).json({ error: 'Sessione non trovata.' });
        return;
      }

      const updated = removeAssignment(session, championId);
      sessionsStore.set(code, updated);
      saveSessionsToDisk();
      broadcastUpdate(code, updated);

      res.json({ session: updated });
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Errore nel rilascio.' });
    }
  });

  // POST undo last pick
  app.post('/api/drafts/:roomCode/undo', (req, res) => {
    try {
      const code = req.params.roomCode.toUpperCase();
      const session = sessionsStore.get(code);
      if (!session) {
        res.status(404).json({ error: 'Sessione non trovata.' });
        return;
      }

      const updated = undoLastPick(session);
      sessionsStore.set(code, updated);
      saveSessionsToDisk();
      broadcastUpdate(code, updated);

      res.json({ session: updated });
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Errore nell\'annullamento.' });
    }
  });

  // SSE real-time stream endpoint
  app.get('/api/drafts/:roomCode/events', (req: Request, res: Response) => {
    const code = req.params.roomCode.toUpperCase();
    const session = sessionsStore.get(code);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });

    if (!sseClients.has(code)) {
      sseClients.set(code, new Set());
    }
    const clientSet = sseClients.get(code)!;
    clientSet.add(res);

    // Send initial state immediately
    if (session) {
      res.write(`data: ${JSON.stringify({ session })}\n\n`);
    }

    req.on('close', () => {
      clientSet.delete(res);
      if (clientSet.size === 0) {
        sseClients.delete(code);
      }
    });
  });

  // Setup Vite middleware or static serving
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = Number(process.env.PORT) || 3000;

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Godtear Draft Server in ascolto su http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Errore fatale avvio server:', err);
  process.exit(1);
});
