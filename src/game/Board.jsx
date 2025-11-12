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
  const API_URL = "http://localhost:3000";
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
        } catch (e) {
        }
        joinPartida(partidaId);
      } catch (e) {
        console.warn('No se pudo establecer WS en Board:', e);
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
            } catch (e) { /* ignore */ }
        }
      } catch (e) {
        console.error('Error en handlePlayerJoined:', e);
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
          } catch (e) { /* ignore */ }
        }
      } catch (e) { console.error(e); }
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
      } catch (e) { console.error(e); }
    };

    const handlePlayerMoved = async (payload) => {
      try {
        if (!mounted) return;
        const pid = payload.partidaId || payload.data?.partidaId;
        if (String(pid) === String(partidaId)) {
          await fetchDatos();
        }
      } catch (e) { console.error(e); }
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
      } catch (e) { console.error(e); }
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
      try { leavePartida(partidaId); } catch (e) { /* ignore */ }
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
    } catch (e) { return msg; }
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
      <div className="board-actions">
        <span className="badge">Partida #{partidaId}</span>
        {partida?.codigo_acceso && <span className="badge">Código: {partida.codigo_acceso}</span>}
        {partida?.estado && <span className="badge">Estado: {partida.estado}</span>}
        {partida?.ganador_jugador_id && <span className="badge">Ganador: {nombreDeJugador(partida.ganador_jugador_id, jugadores)}</span>}

        {/* Botón para iniciar la partida si está pendiente */}
        {partida?.estado === "pendiente" && soyAnfitrion && (
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
              <button onClick={() => jugar("jugar_minijuego")} disabled={cargando}>
                Jugar minijuego
              </button>
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

