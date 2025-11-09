import './Board.css';
import Casilla from './Casilla';
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";

import imgInicio from '../imagenes/bandera inicio.png';
import imgItalia from '../imagenes/bandera italia.png';
import imgEEUU from '../imagenes/bandera eeuu.png';
import imgFortuna from '../imagenes/Fortuna.png';
import imgMexico from '../imagenes/bandera mexico.png';
import imgJapon from '../imagenes/bandera japon.png';

function nombreDeJugador(id, lista = []) {
  const j = lista.find((x) => x.id === id);
  return j?.Usuario?.nombre || `Jugador #${id}`;
}

export default function Board() {
  const { partidaId } = useParams();
  const [jugadores, setJugadores] = useState([]);
  const [partida, setPartida] = useState(null);
  const [nombreTurno, setNombreTurno] = useState("");
  const [cargando, setCargando] = useState(false);
  const API_URL = "http://localhost:3000";
  const token = localStorage.getItem("token");

  // tablero fijo de 6 casillas
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

      // 👉 actualiza estado como antes
      setJugadores(jugadoresConUsuario);
      setPartida(dataPar);
      setNombreTurno(nombreTurnoCalc);

      // 👉 y además retorna todo listo para usar
      return { jugadores: jugadoresConUsuario, partida: dataPar, nombreTurno: nombreTurnoCalc };
    } catch (e) {
      console.error("Error cargando datos:", e);
      return { jugadores: [], partida: null, nombreTurno: "" };
    }
  }, [API_URL, partidaId, token]);


  useEffect(() => {
    fetchDatos();
  }, [fetchDatos]);

  // Helpers
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

  const esMiTurno = partida && miJugador && partida.turno_actual_jugador_id === miJugador.id;

  // ¿Qué acción corresponde a la casilla actual del jugador?
  function accionDisponiblePara(jugador) {
    if (!partida || partida.estado !== "en_juego") return null;
    if (!jugador) return null;
    if (partida.turno_actual_jugador_id !== jugador.id) return null;

    const pos = jugador.posicion_actual;
    const cas = casillas.find((c) => c.id === pos);
    if (!cas) return null;

    if (pos === 0) return "mover_desde_inicio";              // PATCH /jugadores/:id
    if (cas.tipo === "minijuego") return "jugar_minijuego";   // POST /jugadas
    if (cas.tipo === "fortuna") return "obtener_fortuna";     // POST /jugadas
    return null;
  }

  // Acciones
  async function iniciarPartida() {
    if (!partida) return;
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/partidas/${partidaId}/iniciar`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || "No se pudo iniciar la partida");
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

      // Refresca y usa los datos recién cargados
      const updated = await fetchDatos();

      if (!res.ok) {
        alert(data.error || "❌ No se pudo mover desde inicio");
      } else {
        const siguiente = updated.nombreTurno ? ` Ahora juega ${updated.nombreTurno}.` : "";
        alert(`✅ ${data.message || "Avanzaste a la primera casilla."}${siguiente}`);
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
          accion, // "jugar_minijuego" | "obtener_fortuna"
        }),
      });
      const data = await res.json();

      // Refresca para tener turno/ganador actualizados y la lista con nombres
      const updated = await fetchDatos();

      if (!res.ok) {
        alert(`❌ ${data.error || "Error al jugar el turno"}`);
        return;
      }

      // Mensaje base por resultado
      let msgBase = data.mensaje || "Turno completado";
      if (data.resultado === "gano") msgBase = "🏆 Ganaste el minijuego y avanzas una casilla.";
      else if (data.resultado === "perdio") msgBase = "😢 Perdiste el minijuego, no avanzas.";
      else if (data.resultado === "fortuna aplicada") msgBase = `🎁 ${data.mensaje}`;

      // Si la partida terminó, anuncia ganador por nombre
      if (updated.partida?.estado === "finalizada" && updated.partida?.ganador_jugador_id) {
        const nombreGanador = nombreDeJugador(updated.partida.ganador_jugador_id, updated.jugadores);
        const yoGane = updated.partida.ganador_jugador_id === miJugador.id;
        const finalMsg = yoGane
          ? `🏁 ¡Ganaste la partida, ${nombreDeJugador(miJugador.id, updated.jugadores)}!`
          : `🏁 La partida terminó. Ganó ${nombreGanador}.`;
        alert(`${msgBase}\n\n${finalMsg}`);
      } else {
        // Si sigue en juego: muestra el siguiente por nombre
        const siguienteNombre = updated.nombreTurno || "";
        const cola = siguienteNombre ? ` Ahora juega ${siguienteNombre}.` : "";
        alert(`${msgBase}${cola}`);
      }
    } finally {
      setCargando(false);
    }
  }


  const miAccion = accionDisponiblePara(miJugador);

  return (
    <div className="board">
      <div className="board-actions">
        <span className="badge">Partida #{partidaId}</span>
        {partida?.estado && <span className="badge">Estado: {partida.estado}</span>}
        {partida?.ganador_jugador_id && <span className="badge">Ganador: {nombreDeJugador(partida.ganador_jugador_id, jugadores)}</span>}

        {/* Botón para iniciar la partida si está pendiente */}
        {partida?.estado === "pendiente" && (
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
                        style={{ backgroundColor: jug.avatar_elegido || "#ddd" }}
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
    </div>
  );
}

