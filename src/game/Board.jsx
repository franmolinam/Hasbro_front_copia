import './Board.css';
import Casilla from './Casilla';
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import imgInicio from '../imagenes/bandera inicio.png';
import imgItalia from '../imagenes/bandera italia.png';
import imgEEUU from '../imagenes/bandera eeuu.png';
import imgFortuna from '../imagenes/Fortuna.png';
import imgMexico from '../imagenes/bandera mexico.png';
import imgJapon from '../imagenes/bandera japon.png';
import { connect as connectSocket, registerUser, joinPartida, leavePartida, onPlayerJoined, offPlayerJoined, onGameUpdate, offGameUpdate, onPartidaStarted, offPartidaStarted, onPlayerMoved, offPlayerMoved, onGameFinished, offGameFinished } from '../api/socket';
// Cargar todas las imágenes de `src/imagenes` (carpetas por país) como URLs para usarlas en minijuegos
// Nota: `as: 'url'` está deprecado; usar `query: '?url'` y `import: 'default'` según Vite
const IMAGES = import.meta.glob('../imagenes/**', { eager: true, query: '?url', import: 'default' });

// Normalizar texto: minúsculas, quitar acentos, quitar separadores
function normalizeKey(s) {
  if (!s) return '';
  const from = "ÁÀÄÂáàäâÉÈËÊéèëêÍÌÏÎíìïîÓÒÖÔóòöôÚÙÜÛúùüûÑñÇç";
  const to   = "AAAAaaaaEEEEeeeeIIIIiiiiOOOOooooUUUUuuuuNnCc";
  let res = String(s).trim().toLowerCase();
  for (let i = 0; i < from.length; i++) res = res.replace(new RegExp(from[i], 'g'), to[i]);
  res = res.replace(/[\s_-]+/g, '');
  res = res.replace(/[^a-z0-9]/g, '');
  return res;
}

// Mapear nombre de país (texto desde DB) a carpeta dentro de src/imagenes
function countryFolderFromName(nombre) {
  if (!nombre) return 'usa';
  const n = String(nombre).toLowerCase();
  if (n.includes('ital')) return 'italia';
  if (n.includes('mex')) return 'mexico';
  if (n.includes('japon') || n.includes('japón')) return 'japon';
  if (n.includes('eeuu') || n.includes('estados') || n.includes('unidos') || n.includes('usa')) return 'usa';
  // fallback: intentar normalizar y usar como carpeta
  return n.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

// Buscar imagen coincidente para un ingrediente dentro de IMAGES
function findImageForIngredient(paisNombre, ingredienteKey) {
  const candidate = normalizeKey(ingredienteKey);
  // Primero buscar en la carpeta del país
  if (paisNombre) {
    for (const k of Object.keys(IMAGES)) {
      if (!k.includes(`../imagenes/${paisNombre}/`)) continue;
      const parts = k.split('/');
      const filename = parts[parts.length - 1] || '';
      const basename = filename.replace(/\.[^.]+$/, '');
      if (normalizeKey(basename).includes(candidate) || candidate.includes(normalizeKey(basename))) {
        return IMAGES[k];
      }
    }
  }
  // luego buscar en cualquier carpeta global
  for (const k of Object.keys(IMAGES)) {
    const parts = k.split('/');
    const filename = parts[parts.length - 1] || '';
    const basename = filename.replace(/\.[^.]+$/, '');
    if (normalizeKey(basename).includes(candidate) || candidate.includes(normalizeKey(basename))) {
      return IMAGES[k];
    }
  }
  return null;
}
import EndGameModal from './EndGameModal';
import MinijuegoBase from './MinijuegoBase.jsx';

function nombreDeJugador(id, lista = []) {
  const j = lista.find((x) => x.id === id);
  return j?.Usuario?.nombre || `Jugador #${id}`;
}

export default function Board() {
  const { partidaId } = useParams();
  const navigate = useNavigate();
  const [jugadores, setJugadores] = useState([]);
  const [partida, setPartida] = useState(null);
  const [nombreTurno, setNombreTurno] = useState("");
  const [cargando, setCargando] = useState(false);
  const [toast, setToast] = useState(null);
  const [showMinijuego, setShowMinijuego] = useState(false);
  const [minijuegoPayload, setMinijuegoPayload] = useState(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const API_URL = "https://hasbro-back-252s2.onrender.com";
  const token = localStorage.getItem("token");


  const casillas = [
    { id: 0, tipo: "inicio", img: imgInicio },
    { id: 1, tipo: "minijuego", img: imgItalia },
    { id: 2, tipo: "minijuego", img: imgEEUU },
    { id: 3, tipo: "fortuna", img: imgFortuna },
    { id: 4, tipo: "minijuego", img: imgMexico },
    { id: 5, tipo: "minijuego", img: imgJapon },
  ];

  const fetchDatos = useCallback(async () => {
    if (!token) return { jugadores: [], partida: null, nombreTurno: "" };
    try {
      const resJug = await fetch(`${API_URL}/jugadores?partidaId=${partidaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let dataJugadores = await resJug.json();

      const jugadoresConUsuario = await Promise.all(
        dataJugadores.map(async (jug) => {
          try {
            const resUsuario = await fetch(`${API_URL}/usuarios/${jug.usuarioId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const usuario = await resUsuario.json();
            return { ...jug, Usuario: usuario };
          } catch {
            return { ...jug, Usuario: { nombre: "Desconocido" } };
          }
        })
      );

      const resPar = await fetch(`${API_URL}/partidas/${partidaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataPar = await resPar.json();

      const jugadorTurno = jugadoresConUsuario.find(
        (j) => j.id === dataPar.turno_actual_jugador_id
      );
      const nombreTurnoCalc = jugadorTurno?.Usuario?.nombre || "";


      setJugadores(jugadoresConUsuario);
      setPartida(dataPar);
      // Mostrar modal si la partida está finalizada
      setShowEndModal(dataPar?.estado === 'finalizada');
      setNombreTurno(nombreTurnoCalc);

      return { jugadores: jugadoresConUsuario, partida: dataPar, nombreTurno: nombreTurnoCalc };
    } catch (e) {
      console.error("Error cargando datos:", e);
      return { jugadores: [], partida: null, nombreTurno: "" };
    }
  }, [API_URL, partidaId, token]);


  useEffect(() => {
    fetchDatos();
  }, [fetchDatos]);

  
  useEffect(() => {
    let mounted = true;

    async function setupSocket() {
      if (!partidaId) return;
      const token = localStorage.getItem('token');
      const socketId = localStorage.getItem('socketId');

      try {
        await connectSocket();
        try {
          const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
          const userId = payload ? payload.sub : null;
          if (userId) {
            registerUser(userId, { token, socketId });
          }
        } catch {
          // ignore
        }
        joinPartida(partidaId);
      } catch (err) {
        console.warn('No se pudo establecer WS en Board:', err);
      }
    }

    const handlePlayerJoined = async (payload) => {
      try {
        if (!mounted) return;
        if (!payload) return;
        const pid = payload.partidaId || payload.data?.partidaId;
        if (String(pid) === String(partidaId)) {
            await fetchDatos();
            try {
              const nombre = payload.jugador?.nombre || payload?.jugador?.nombre || 'Un jugador';
              setToast(`${nombre} se ha unido a la partida`);
              setTimeout(() => setToast(null), 4000);
            } catch (err) { console.error(err); }
        }
      } catch (err) {
        console.error('Error en handlePlayerJoined:', err);
      }
    };

    const handleGameUpdate = async (payload) => {
      try {
        if (!mounted) return;
        if (!payload) return;
        const pid = payload.partida?.id || payload.partidaId || payload.data?.partidaId || payload.data?.partida?.id;
        if (String(pid) === String(partidaId)) {
          const before = await fetchDatos();

          try {
            const resultado = payload.resultado || payload.data?.resultado;
            const mensajeServidor = payload.mensaje || payload.data?.mensaje;
            const actorId = payload.actorJugadorId || payload.jugador?.id || payload.data?.actorJugadorId || payload.data?.jugador?.id;
            if (resultado) {
              const nombreActor = (before.jugadores.find(j => j.id === actorId)?.Usuario?.nombre) || 'Un jugador';
              let texto = '';
              if (resultado === 'gano') texto = `${nombreActor} ganó el minijuego y avanzó.`;
              else if (resultado === 'perdio') texto = `${nombreActor} perdió el minijuego.`;
              else if (resultado === 'fortuna aplicada') texto = `${sanitizeServerMessage(mensajeServidor) || 'Se aplicó una fortuna.'}`;
              else texto = sanitizeServerMessage(mensajeServidor) || 'Actualización de juego';

              setToast(texto);
              setTimeout(() => setToast(null), 7000);
            }
          } catch (err) { console.error(err); }
        }
      } catch (err) { console.error(err); }
    };

    const handlePartidaStarted = async (payload) => {
      try {
        if (!mounted) return;
        const pid = payload.partida?.id || payload.data?.partidaId;
        if (String(pid) === String(partidaId)) {
          await fetchDatos();
          setToast('La partida ha comenzado');
          setTimeout(() => setToast(null), 3000);
        }
      } catch (err) { console.error(err); }
    };

    const handlePlayerMoved = async (payload) => {
      try {
        if (!mounted) return;
        const pid = payload.partidaId || payload.data?.partidaId;
        if (String(pid) === String(partidaId)) {
          await fetchDatos();
        }
      } catch (err) { console.error(err); }
    };

    onPlayerJoined(handlePlayerJoined);
    onGameUpdate(handleGameUpdate);
    onPartidaStarted(handlePartidaStarted);
    onPlayerMoved(handlePlayerMoved);
    onGameFinished(handlePlayerMoved); 
    const handleGameFinished = (payload) => {
      try {
        const ganador = payload.ganador || payload.data?.ganador;
        if (!ganador) return;
        const nombre = ganador.nombre || 'Un jugador';
        setToast(`Fin de la partida. Ganó ${nombre}`);
        setTimeout(() => setToast(null), 6000);
      } catch (err) { console.error(err); }
    };
    onGameFinished(handleGameFinished);
    setupSocket();

    return () => {
      mounted = false;
      offPlayerJoined(handlePlayerJoined);
      offGameUpdate(handleGameUpdate);
      offPartidaStarted(handlePartidaStarted);
      offPlayerMoved(handlePlayerMoved);
      offGameFinished(handlePlayerMoved);
      offGameFinished(handleGameFinished);
      try { leavePartida(partidaId); } catch (err) { console.error(err); }
    };
  }, [partidaId, fetchDatos]);

  function myUserId() {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return parseInt(payload.sub);
    } catch {
      return null;
    }
  }
  const yo = myUserId();
  const miJugador = jugadores.find((j) => j.usuarioId === yo);
  const soyAnfitrion = !!(partida && yo && Number(yo) === Number(partida.anfitrion_usuario_id));

  const esMiTurno = partida && miJugador && partida.turno_actual_jugador_id === miJugador.id;

  function sanitizeServerMessage(msg) {
    if (!msg) return '';
    try {
      return msg.replace(/\s*Ahora es el turno del jugador con ID\s*\d+\.?/i, '').trim();
    } catch {  return msg; }
  }

  function avatarColor(val) {
    if (!val || val === 'default') return 'blue';
    return val;
  }

  function accionDisponiblePara(jugador) {
    if (!partida || partida.estado !== "en_juego") return null;
    if (!jugador) return null;
    if (partida.turno_actual_jugador_id !== jugador.id) return null;

    const pos = jugador.posicion_actual;
    const cas = casillas.find((c) => c.id === pos);
    if (!cas) return null;

    if (pos === 0) return "mover_desde_inicio";              
    if (cas.tipo === "minijuego") return "jugar_minijuego";   
    if (cas.tipo === "fortuna") return "obtener_fortuna";     
    return null;
  }


  async function iniciarPartida() {
    if (!partida) return;
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/partidas/${partidaId}/iniciar`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          setToast("Solo el anfitrión puede iniciar la partida.");
        } else {
          setToast(data.error || "No se pudo iniciar la partida");
        }
        return;
      }
      await fetchDatos();
    } finally {
      setCargando(false);
    }
  }


  async function moverDesdeInicio() {
    if (!miJugador) return;
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/jugadores/${miJugador.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      const updated = await fetchDatos();

      if (!res.ok) {
        setToast(data.error || "No se pudo mover desde inicio");
        setTimeout(() => setToast(null), 4000);
      } else {
        const siguiente = updated.nombreTurno ? ` Ahora juega ${updated.nombreTurno}.` : "";
        setToast(`${data.message || "Avanzaste a la primera casilla."}${siguiente}`);
        setTimeout(() => setToast(null), 4000);
      }
    } finally {
      setCargando(false);
    }
  }

  async function jugar(accion) {
    if (!miJugador || !partida) return;
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/jugadas`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jugadorId: miJugador.id,
          partidaId: Number(partidaId),
          accion, 
        }),
      });
      const data = await res.json();
      const updated = await fetchDatos();

      if (!res.ok) {
        setToast(`${data.error || "Error al jugar el turno"}`);
        setTimeout(() => setToast(null), 5000);
        return;
      }

  let msgBase = sanitizeServerMessage(data.mensaje) || "Turno completado";
      if (data.resultado === "gano") msgBase = "Ganaste el minijuego y avanzas una casilla.";
      else if (data.resultado === "perdio") msgBase = "Perdiste el minijuego, no avanzas.";
      else if (data.resultado === "fortuna aplicada") msgBase = `${sanitizeServerMessage(data.mensaje)}`;

      if (updated.partida?.estado === "finalizada" && updated.partida?.ganador_jugador_id) {
        const nombreGanador = nombreDeJugador(updated.partida.ganador_jugador_id, updated.jugadores);
        const yoGane = updated.partida.ganador_jugador_id === miJugador.id;
        const finalMsg = yoGane
          ? `¡Ganaste la partida, ${nombreDeJugador(miJugador.id, updated.jugadores)}!`
          : `La partida terminó. Ganó ${nombreGanador}.`;
        setToast(`${msgBase} ${finalMsg}`);
        setTimeout(() => setToast(null), 7000);
      } else {
        const siguienteNombre = updated.nombreTurno || "";
        const cola = siguienteNombre ? ` Ahora juega ${siguienteNombre}.` : "";

        setToast(`${msgBase}${cola}`);
        setTimeout(() => setToast(null), 4000);
      }
    } finally {
      setCargando(false);
    }
  }


  const miAccion = accionDisponiblePara(miJugador);

  return (
    <div className="board">
      {/* Toast simple */}
      {toast && (
        <div className={`app-toast`}>{toast}</div>
      )}
      {/* Modal de fin de partida */}
      <EndGameModal
        isOpen={showEndModal && Boolean(partida?.ganador_jugador_id)}
        isWinner={miJugador && partida?.ganador_jugador_id === miJugador.id}
        winnerName={nombreDeJugador(partida?.ganador_jugador_id, jugadores)}
        onExit={() => {
          try { leavePartida(partidaId); } catch { /* ignore */ }
          navigate('/lobby');
        }}
        onStay={() => setShowEndModal(false)}
      />
      <div className="board-actions">
        <span className="badge">Partida #{partidaId}</span>
        {partida?.codigo_acceso && <span className="badge">Código: {partida.codigo_acceso}</span>}
        {partida?.estado && <span className="badge">Estado: {partida.estado}</span>}
        {partida?.ganador_jugador_id && <span className="badge">Ganador: {nombreDeJugador(partida.ganador_jugador_id, jugadores)}</span>}

        {/* Botón para iniciar la partida si está pendiente */}
        {partida?.estado === "pendiente" && (soyAnfitrion || miJugador?.es_anfitrion) && (
          <button onClick={iniciarPartida} disabled={cargando}>
            Iniciar partida
          </button>
        )}

        {/* Mis acciones de turno */}
        {esMiTurno && partida?.estado === "en_juego" && (
          <>
            {miAccion === "mover_desde_inicio" && (
              <button onClick={moverDesdeInicio} disabled={cargando}>
                Avanzar desde inicio (0 → 1)
              </button>
            )}
            {miAccion === "jugar_minijuego" && (
              <>
                <button onClick={async () => {
                  if (!miJugador || !partida) return;
                  setCargando(true);
                  try {
                    const pos = miJugador.posicion_actual;
                    const resCas = await fetch(`${API_URL}/casillas/por_partida/${partidaId}/pos/${pos}`);
                    if (!resCas.ok) {
                      const err = await resCas.json().catch(() => ({}));
                      setToast(`No se pudo cargar el minijuego: ${err.error || resCas.statusText}`);
                      setTimeout(() => setToast(null), 4000);
                      return;
                    }
                    const casilla = await resCas.json();
                    const mj = casilla.Minijuego;
                    if (!mj) {
                      setToast('No hay minijuego asociado a esta casilla');
                      setTimeout(() => setToast(null), 3000);
                      return;
                    }

                    // ingredientesDisponibles puede venir como array o string
                    let ingredientesDisponibles = mj.ingredientes_disponibles;
                    if (!Array.isArray(ingredientesDisponibles)) {
                      try { ingredientesDisponibles = JSON.parse(ingredientesDisponibles); } catch { ingredientesDisponibles = []; }
                    }

                    // construir arreglo de pedidos (si existen) o fallback
                    // determinar carpeta del país primero
                    console.log('[pedidos] raw casilla.Pais =', casilla.Pais);
                    console.log('[pedidos] raw country name =', casilla.Pais && casilla.Pais.nombre);
                    // Lógica en cascada para inferir carpeta de país:
                    // 1) usar casilla.Pais.nombre si está disponible
                    // 2) else, inferir por el tipo de comida del minijuego (mj.tipo_comida)
                    // 3) else, inferir por la casilla local del tablero (posición)
                    function inferFolder() {
                      if (casilla.Pais && casilla.Pais.nombre) {
                        console.log('[pedidos] infer method=casilla.Pais');
                        return countryFolderFromName(casilla.Pais.nombre);
                      }
                      if (mj && mj.tipo_comida) {
                        const t = String(mj.tipo_comida).toLowerCase();
                        if (t.includes('pizza') || t.includes('ital')) { console.log('[pedidos] infer method=mj.tipo_comida -> italia'); return 'italia'; }
                        if (t.includes('taco') || t.includes('tacos') || t.includes('mex')) { console.log('[pedidos] infer method=mj.tipo_comida -> mexico'); return 'mexico'; }
                        if (t.includes('sushi') || t.includes('japon') || t.includes('jap')) { console.log('[pedidos] infer method=mj.tipo_comida -> japon'); return 'japon'; }
                        if (t.includes('hamburg') || t.includes('burger') || t.includes('usa') || t.includes('eeuu')) { console.log('[pedidos] infer method=mj.tipo_comida -> usa'); return 'usa'; }
                      }
                      // fallback: usar la casilla local definida en el frontend (casillas array)
                      try {
                        const posActual = miJugador?.posicion_actual;
                        const localCas = casillas.find(c => Number(c.id) === Number(posActual));
                        if (localCas) {
                          if (localCas.img === imgItalia) { console.log('[pedidos] infer method=localCas -> italia'); return 'italia'; }
                          if (localCas.img === imgMexico) { console.log('[pedidos] infer method=localCas -> mexico'); return 'mexico'; }
                          if (localCas.img === imgJapon) { console.log('[pedidos] infer method=localCas -> japon'); return 'japon'; }
                          if (localCas.img === imgEEUU) { console.log('[pedidos] infer method=localCas -> usa'); return 'usa'; }
                        }
                      } catch { /* ignore */ }
                      console.log('[pedidos] infer method=default -> usa');
                      return 'usa';
                    }
                    const paisFolder = inferFolder();
                    let pedidosArr = [];
                    if (mj.Pedidos && mj.Pedidos.length > 0) {
                      pedidosArr = mj.Pedidos.map((p, idx) => {
                        let ingredientesReq = [];
                        try {
                          ingredientesReq = JSON.parse(p.ingredientes_solicitados);
                          if (!Array.isArray(ingredientesReq)) throw new Error('not array');
                        } catch {
                          ingredientesReq = String(p.ingredientes_solicitados || '').split(',').map(x => x.trim()).filter(Boolean);
                        }
                        // intentar adjuntar imagen del pedido (pedido_1.png, pedido_2.png, ...)
                        let img = null;
                        // buscar en IMAGES de forma robusta (igual que findImageForIngredient)
                        for (const k of Object.keys(IMAGES)) {
                          const parts = k.split('/');
                          // esperable: ['..', 'imagenes', '<folder>', 'file.png']
                          const folderSegment = parts[2] || '';
                          if (folderSegment !== paisFolder) continue;
                          const filename = parts[parts.length - 1] || '';
                          const fnameNorm = normalizeKey(filename);
                          if (fnameNorm.includes(`pedido${idx + 1}`) || fnameNorm.includes(`pedido_${idx + 1}`)) {
                            img = IMAGES[k];
                            console.debug('[pedidos] asignada imagen', paisFolder, `pedido_${idx+1}`, k);
                            break;
                          }
                        }
                        return { id: p.id, nombre: `${mj.tipo_comida} pedido`, ingredientes: ingredientesReq, img };
                      });
                    } else {
                      const picks = ingredientesDisponibles.slice(0, Math.min(3, ingredientesDisponibles.length));
                      let img = null;
                      for (const k of Object.keys(IMAGES)) {
                        const parts = k.split('/');
                        const folderSegment = parts[2] || '';
                        if (folderSegment !== paisFolder) continue;
                        const filename = parts[parts.length - 1] || '';
                        const fnameNorm = normalizeKey(filename);
                        if (fnameNorm.includes('pedido1') || fnameNorm.includes('pedido_1')) {
                          img = IMAGES[k];
                          console.debug('[pedidos] asignada imagen fallback', paisFolder, 'pedido_1', k);
                          break;
                        }
                      }
                      pedidosArr = [{ id: null, nombre: `${mj.tipo_comida} pedido`, ingredientes: picks, img }];
                    }

                    // LOG: información de depuración para verificar asignación de imágenes
                    try {
                      console.log('[pedidos] paisFolder=', paisFolder);
                      const keysForFolder = Object.keys(IMAGES).filter(k => k.includes(`/imagenes/${paisFolder}/`));
                      console.log('[pedidos] keys in IMAGES for folder (sample 20)=', keysForFolder.slice(0,20));
                      console.log('[pedidos] pedidosArr=', pedidosArr.map(p=>({ nombre: p.nombre, img: p.img ? 'HAS_IMG' : null })) );
                    } catch (e) { console.warn('Error logging pedidos debug info', e); }

                    // map ingredientesDisponibles a objetos con key/label/img usando el mapa de imports
                    const ingredientesMap = [];
                    for (const k of ingredientesDisponibles) {
                      const key = k;
                      const label = String(k).replace(/_/g,' ').replace(/\b\w/g, c=>c.toUpperCase());
                      // buscar imagen más flexible (coincidencias parciales, sin acentos, sin guiones/espacios)
                      const img = findImageForIngredient(paisFolder, k);
                      ingredientesMap.push({ key, label, color: '#ddd', img });
                    }
                    // log de depuración: ingredientes sin imagen encontrada
                    const faltantes = ingredientesMap.filter(i => !i.img).map(i => i.key);
                    if (faltantes.length > 0) {
                      console.warn('No se encontraron imágenes para:', faltantes, 'en país:', paisFolder);
                    }

                    const bonus = miJugador?.bonus_tiempo || 0;
                    const baseTime = mj.tiempo_limite_base || 30;
                    const tiempoTotal = Math.max(5, baseTime + Number(bonus));
                    const payloadToShow = {
                      pais: casilla.Pais || { nombre: 'País' },
                      tiempo: tiempoTotal,
                      pedidos: pedidosArr,
                      ingredientesDisponibles: ingredientesMap,
                      minijuegoId: mj.id,
                    };
                    console.debug('[minijuego] preparando payload', payloadToShow);
                    setMinijuegoPayload(payloadToShow);
                    // asegurar que el payload se establezca antes de mostrar el modal
                    setTimeout(() => setShowMinijuego(true), 0);

                  } catch (e) {
                    console.error('Error cargando minijuego real:', e);
                    setToast('Error cargando minijuego.');
                    setTimeout(() => setToast(null), 3000);
                  } finally {
                    setCargando(false);
                  }
                }} disabled={cargando}>
                  Jugar minijuego
                </button>
                    {showMinijuego && minijuegoPayload && (
                  <MinijuegoBase
                    pais={minijuegoPayload.pais}
                    tiempo={minijuegoPayload.tiempo}
                    pedidos={minijuegoPayload.pedidos}
                    ingredientesDisponibles={minijuegoPayload.ingredientesDisponibles}
                    onCancel={() => setShowMinijuego(false)}
                    onComplete={async (resultado) => {
                      setShowMinijuego(false);
                      try {
                        setCargando(true);
                        const res = await fetch(`${API_URL}/jugadas`, {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            jugadorId: miJugador.id,
                            partidaId: Number(partidaId),
                            accion: "jugar_minijuego",
                            resultado: resultado,
                            minijuegoId: minijuegoPayload.minijuegoId,
                          }),
                        });
                        const data = await res.json();
                        const updated = await fetchDatos();

                        if (!res.ok) {
                          setToast(`${data.error || "Error al jugar el turno"}`);
                          setTimeout(() => setToast(null), 5000);
                          return;
                        }

                        let msgBase = sanitizeServerMessage(data.mensaje) || "Turno completado";
                        if (data.resultado === "gano") msgBase = "Ganaste el minijuego y avanzas una casilla.";
                        else if (data.resultado === "perdio") msgBase = "Perdiste el minijuego, no avanzas.";

                        const siguienteNombre = updated.nombreTurno || "";
                        const cola = siguienteNombre ? ` Ahora juega ${siguienteNombre}.` : "";
                        setToast(`${msgBase}${cola}`);
                        setTimeout(() => setToast(null), 4000);
                      } catch (e) {
                        console.error('Error al enviar resultado del minijuego', e);
                      } finally {
                        setCargando(false);
                      }
                    }}
                  />
                )}
              </>
            )}
            {miAccion === "obtener_fortuna" && (
              <button onClick={() => jugar("obtener_fortuna")} disabled={cargando}>
                Tomar fortuna
              </button>
            )}
          </>
        )}

        <button onClick={fetchDatos} disabled={cargando}>Refrescar</button>
      </div>

      {partida?.turno_actual_jugador_id && (
        <p className="turno-texto">
          Turno actual: <strong>{nombreTurno || `Jugador ${partida.turno_actual_jugador_id}`}</strong>
        </p>
      )}

      <div className="board-row">
        {casillas.map((casilla) => {
          const jugadoresEnCasilla = jugadores.filter(
            (j) => j.posicion_actual === casilla.id
          );

          return (
            <div key={casilla.id} className="casilla-wrapper">
              <Casilla imgSrc={casilla.img}>
                <div className="jugadores-casilla">
                  {jugadoresEnCasilla.map((jug) => {
                    const inicial =
                      (jug.Usuario?.nombre || "J")?.trim()?.charAt(0)?.toUpperCase() || "J";
                    return (
                      <div
                        key={jug.id}
                        className="avatar-mini"
                        style={{ backgroundColor: avatarColor(jug.avatar_elegido) }}
                        title={`${jug.Usuario?.nombre || "Jugador"} (id ${jug.id})`}
                      >
                        {inicial}
                      </div>
                    );
                  })}
                </div>
              </Casilla>
            </div>
          );
        })}
      </div>

      {/* Botón para volver al lobby */}
      <div className="board-footer">
        <button onClick={() => navigate("/lobby")} className="btn-back-to-lobby">
          Volver al Lobby
        </button>
      </div>
    </div>
  );
}

