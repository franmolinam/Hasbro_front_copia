const WS_URL = (() => {
  try {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    if (window.location.hostname === 'localhost') return `ws://localhost:3000`;
    return `${proto}://${window.location.host}`;
  } catch {
    return 'ws://localhost:3000';
  }
})();

let ws = null;
let openPromise = null;

const playerJoinedHandlers = new Set();
const gameUpdateHandlers = new Set();
const partidaStartedHandlers = new Set();
const playerMovedHandlers = new Set();
const gameFinishedHandlers = new Set();

function ensureConnected() {
  if (ws && ws.readyState === WebSocket.OPEN) return Promise.resolve();
  if (openPromise) return openPromise;

  openPromise = new Promise((resolve, reject) => {
    ws = new WebSocket(WS_URL);

    ws.addEventListener('open', () => {
      console.log('[socket] Conectado a', WS_URL);
      resolve();
      openPromise = null;
    });

    ws.addEventListener('message', (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        handleIncoming(msg);
      } catch (e) {
        console.error('[socket] Error parseando mensaje', e);
      }
    });

    ws.addEventListener('close', () => {
      console.log('[socket] Desconectado');
      ws = null;
    });

    ws.addEventListener('error', (err) => {
      console.error('[socket] Error', err);
      reject(err);
      openPromise = null;
    });
  });

  return openPromise;
}

function handleIncoming(msg) {
  if (!msg || !msg.type) return;

  const payload = msg.data || msg;
  switch (msg.type) {
    case 'player_joined':
      playerJoinedHandlers.forEach((h) => { try { h(payload); } catch (e) { console.error(e); } });
      break;
    case 'game_update':
      gameUpdateHandlers.forEach((h) => { try { h(payload); } catch (e) { console.error(e); } });
      break;
    case 'partida_started':
      partidaStartedHandlers.forEach((h) => { try { h(payload); } catch (e) { console.error(e); } });
      break;
    case 'player_moved':
      playerMovedHandlers.forEach((h) => { try { h(payload); } catch (e) { console.error(e); } });
      break;
    case 'game_finished':
      gameFinishedHandlers.forEach((h) => { try { h(payload); } catch (e) { console.error(e); } });
      break;
    default:
      console.log('[socket] Mensaje recibido:', msg.type, msg);
  }
}

function send(obj) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn('[socket] No conectado. Intentando conectar y reenviar...');
    return ensureConnected().then(() => {
      ws.send(JSON.stringify(obj));
    }).catch((e) => console.error('[socket] No se pudo enviar:', e));
  }

  ws.send(JSON.stringify(obj));
}

export async function connect() {
  return ensureConnected();
}

export function registerUser(userId, opts = {}) {
  if (!userId) return;
  const payload = { type: 'register', userId };
  if (opts.socketId) payload.socketId = opts.socketId;
  if (opts.token) payload.token = opts.token;
  send(payload);
}

export function joinPartida(partidaId) {
  if (!partidaId) return;
  send({ type: 'join_partida', partidaId });
}

export function leavePartida(partidaId) {
  if (!partidaId) return;
  send({ type: 'leave_partida', partidaId });
}

export function onPlayerJoined(handler) {
  playerJoinedHandlers.add(handler);
}

export function offPlayerJoined(handler) {
  playerJoinedHandlers.delete(handler);
}

export function onGameUpdate(handler) {
  gameUpdateHandlers.add(handler);
}

export function offGameUpdate(handler) {
  gameUpdateHandlers.delete(handler);
}

export function onPartidaStarted(handler) {
  partidaStartedHandlers.add(handler);
}

export function offPartidaStarted(handler) {
  partidaStartedHandlers.delete(handler);
}

export function onPlayerMoved(handler) {
  playerMovedHandlers.add(handler);
}

export function offPlayerMoved(handler) {
  playerMovedHandlers.delete(handler);
}

export function onGameFinished(handler) {
  gameFinishedHandlers.add(handler);
}

export function offGameFinished(handler) {
  gameFinishedHandlers.delete(handler);
}

export default {
  connect,
  registerUser,
  joinPartida,
  leavePartida,
  onPlayerJoined,
  offPlayerJoined,
};
