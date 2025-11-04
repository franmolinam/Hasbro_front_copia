import './Board.css';
import Casilla from './Casilla';
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import imgInicio from '../imagenes/bandera inicio.png';
import imgItalia from '../imagenes/bandera italia.png';
import imgEEUU from '../imagenes/bandera eeuu.png';
import imgFortuna from '../imagenes/Fortuna.png'; //
import imgMexico from '../imagenes/bandera mexico.png';
import imgJapon from '../imagenes/bandera japon.png';

export default function Board() {
  const { partidaId } = useParams();
  const [jugadores, setJugadores] = useState([]);
  const [turnoJugador, setTurnoJugador] = useState(null);
  const [nombreTurno, setNombreTurno] = useState("");
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

  useEffect(() => {
    async function fetchDatos() {
      try {
        // 🧍 Jugadores
        const resJugadores = await fetch(`${API_URL}/jugadores?partidaId=${partidaId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        let dataJugadores = await resJugadores.json();

        // 👤 Enriquecer con los datos del usuario
        const jugadoresConUsuario = await Promise.all(
          dataJugadores.map(async (jug) => {
            try {
              const resUsuario = await fetch(`${API_URL}/usuarios/${jug.usuarioId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const usuario = await resUsuario.json();
              return { ...jug, Usuario: usuario };
            } catch (e) {
              console.warn("Error cargando usuario:", e);
              return { ...jug, Usuario: { nombre: "Desconocido" } };
            }
          })
        );

        setJugadores(jugadoresConUsuario);

        // 🎯 Partida (para saber el turno)
        const resPartida = await fetch(`${API_URL}/partidas/${partidaId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dataPartida = await resPartida.json();
        setTurnoJugador(dataPartida.turno_actual_jugador_id);

        const jugadorActual = jugadoresConUsuario.find((j) => j.id === dataPartida.turno_actual_jugador_id);
        setNombreTurno(jugadorActual?.Usuario?.nombre || "Jugador desconocido");
      } catch (err) {
        console.error("Error cargando datos:", err);
      }
    }

    fetchDatos();
  }, [partidaId]);

  return (
    <div className="board">
      <h2>🧩 Partida #{partidaId}</h2>

      {turnoJugador && (
        <p className="turno-texto">
          Turno actual: <strong>{nombreTurno || turnoJugador}</strong>
        </p>
      )}

      <div className="board-row">
        {casillas.map((casilla) => {
          const jugadoresEnCasilla = jugadores.filter(
            (j) => j.posicion_actual === casilla.id
          );

          return (
            <div key={casilla.id} className="casilla-container">
              <Casilla tipo={casilla.tipo} imgSrc={casilla.img} />
              <div className="jugadores-casilla">
                {jugadoresEnCasilla.map((jug) => (
                  <div
                    key={jug.id}
                    className="avatar-mini"
                    style={{ backgroundColor: jug.avatar_elegido }}
                    title={jug.nombre}
                  ></div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
