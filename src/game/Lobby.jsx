import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SelectorAvatar from "../profile/SelectorAvatar.jsx";
import { onPlayerJoined, offPlayerJoined, joinPartida, onGameUpdate, offGameUpdate } from '../api/socket';

export default function Lobby() {
  const [partidaId, setPartidaId] = useState(null);
  const [codigo, setCodigo] = useState("");
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState(null);
  const [misPartidasActivas, setMisPartidasActivas] = useState([]);
  const [avatarSeleccionado, setAvatarSeleccionado] = useState(null);
  const [toast, setToast] = useState(null);

  const navigate = useNavigate();

  const API_URL = "http://localhost:3000";
  const token = localStorage.getItem("token");

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

  function getUserIdFromToken() {
    try {
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return parseInt(payload.sub);
    } catch {
      return null;
    }
  }
  const usuarioId = getUserIdFromToken();

  useEffect(() => {
    let isMounted = true;
    async function fetchMisPartidasActivas() {
      if (!usuarioId || !token || !isMounted) return;
      try {
        const res = await fetch(
          `${API_URL}/jugadores?usuarioId=${usuarioId}&inactivo=false&includePartida=true`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('Buscando partidas activas...'); 
        if (!res.ok) {
          console.error('Error al buscar partidas:', await res.text());
          return;
        }
        const data = await res.json();
        console.log('Jugadores encontrados:', JSON.stringify(data, null, 2));
        const partidasActivas = [];

        for (const jugador of data) {
          console.log('Verificando jugador:', jugador.id, 'partidaId:', jugador.partidaId);
          
          if (jugador.partidaId) {
            const partidaRes = await fetch(`${API_URL}/partidas/${jugador.partidaId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (partidaRes.ok) {
              const partida = await partidaRes.json();
              console.log('Partida encontrada:', partida);
              
              if (["pendiente", "en_juego"].includes(partida.estado)) {
                partidasActivas.push({
                  jugador,
                  partida
                });

                joinPartida(partida.id);
                console.log('Uniéndose a sala WebSocket de partida:', partida.id);
              }
            }
          }
        }

        if (isMounted) {
          setMisPartidasActivas(partidasActivas);
        }
      } catch (error) {
        console.error('Error al cargar partidas:', error);
      }
    }
    fetchMisPartidasActivas();
    
    return () => {
      isMounted = false;
    };
  }, [usuarioId, token]);

  useEffect(() => {
    const handlePlayerJoined = ({ jugador, partidaId }) => {
      console.log('handlePlayerJoined ejecutado:', { jugador, partidaId });
      try {
        const nombre = jugador?.nombre || 'Un jugador';
        setToast(`${nombre} se ha unido a la partida`);
        setTimeout(() => setToast(null), 4000);
      } catch (e) { console.error(e); }
      
      setMisPartidasActivas(prev => {
        console.log('Estado anterior:', prev);
        const updated = prev.map(item => {
          if (item.partida.id === partidaId) {
            console.log('Actualizando partida:', partidaId);
            const jugadoresActualizados = item.partida.jugadores 
              ? [...item.partida.jugadores, jugador]
              : [jugador];
            return {
              ...item,
              partida: {
                ...item.partida,
                jugadores: jugadoresActualizados
              }
            };
          }
          return item;
        });
        console.log('Estado nuevo:', updated);
        return updated;
      });
    };

    console.log('Registrando listener de player_joined');
    onPlayerJoined(handlePlayerJoined);

    return () => {
      console.log('Desinscribiendo listener de player_joined');
      offPlayerJoined(handlePlayerJoined);
    };
  }, []);

  useEffect(() => {
    const handleGameUpdateLobby = (payload) => {
      try {
        if (!payload || !payload.data) return;
        const pid = payload.partida?.id || payload.partidaId || payload.data?.partidaId || payload.data?.partida?.id || payload.data?.partida?.id || payload.partida?.id || payload.data?.id;
        if (!pid) return;
        const estaEnMis = misPartidasActivas.some(item => String(item.partida.id) === String(pid));
        if (!estaEnMis) return;

        const resultado = payload.resultado || payload.data?.resultado;
        const mensaje = payload.mensaje || payload.data?.mensaje;
        const actorId = payload.actorJugadorId || payload.jugador?.id || payload.data?.actorJugadorId || payload.data?.jugador?.id;
        if (resultado) {
          const nombreActor = actorId ? (misPartidasActivas.flatMap(i => i.partida.jugadores || []).find(j => j.id === actorId)?.nombre || 'Un jugador') : 'Un jugador';
          let texto = '';
          if (resultado === 'gano') texto = `${nombreActor} ganó un minijuego en la partida ${pid}.`;
          else if (resultado === 'perdio') texto = `${nombreActor} perdió un minijuego en la partida ${pid}.`;
          else if (resultado === 'fortuna aplicada') texto = `${sanitizeServerMessage(mensaje) || 'Se aplicó una fortuna.'}`;
          else texto = mensaje || 'Actualización de la partida';
          setToast(texto);
          setTimeout(() => setToast(null), 7000);
        }
      } catch (e) { console.error(e); }
    };

    onGameUpdate(handleGameUpdateLobby);
    return () => offGameUpdate(handleGameUpdateLobby);
  }, [misPartidasActivas]);

    const goToBoard = (id) => {
    setPartidaId(id);
    navigate(`/board/${id}`);
  };

  async function crearPartida(colorAvatar) {
    console.log('crearPartida called, colorAvatar=', colorAvatar);
    if (!usuarioId) {
      setToast("No se pudo obtener el usuario. Inicia sesión nuevamente.");
      setTimeout(() => setToast(null), 4000);
      return;
    }
    const res = await fetch(`${API_URL}/partidas`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        anfitrion_usuario_id: usuarioId,
        avatar_elegido: colorAvatar,
      }),
    });
    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    if (res.ok && data?.partida?.id) {
      setToast(`Partida creada: código ${data.partida.codigo_acceso}`);
      setTimeout(() => setToast(null), 4000);
      joinPartida(data.partida.id);
      console.log('Uniéndose a sala WebSocket de partida creada:', data.partida.id);
      goToBoard(data.partida.id);
    } else {
      setToast(`Error: ${data.error || "No se pudo crear la partida"}`);
      setTimeout(() => setToast(null), 4000);
    }
  }

  async function unirsePorCodigo(colorAvatar) {
    console.log('unirsePorCodigo called, codigo=', codigo, 'colorAvatar=', colorAvatar);
    if (!codigo) {
      setToast("Ingresa un código de partida");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    
    const res = await fetch(`${API_URL}/partidas/${codigo}/unirse`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usuarioId,
        avatar_elegido: colorAvatar || "default",
      }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (res.ok && data?.partidaId) {
      setToast(`Te uniste a la partida ${codigo}`);
      setTimeout(() => setToast(null), 3000);
      joinPartida(data.partidaId);
      console.log('Uniéndose a sala WebSocket de partida:', data.partidaId);

      setTimeout(() => {
        goToBoard(data.partidaId);
      }, 100);
    } else {
      setToast(`Error: ${data.error || "No se pudo unir a la partida"}`);
      setTimeout(() => setToast(null), 4000);
    }
  }

  async function unirseAleatoria(colorAvatar) {
    console.log('unirseAleatoria called, colorAvatar=', colorAvatar);
    const res = await fetch(`${API_URL}/partidas/unirse-random`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usuarioId,
        avatar_elegido: colorAvatar || "default",
      }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (res.ok && data?.partida?.id) {
      setToast(`🎲 Te uniste a la partida ${data.partida.codigo_acceso}`);
      setTimeout(() => setToast(null), 3000);
      joinPartida(data.partida.id);
      console.log('Uniéndose a sala WebSocket de partida:', data.partida.id);
      goToBoard(data.partida.id);
    } else {
      setToast(`Error: ${data.error || "No hay partidas disponibles"}`);
      setTimeout(() => setToast(null), 4000);
    }
  }

  function handleAvatarSelect(color) {
    console.log('handleAvatarSelect color=', color, 'accionPendiente=', accionPendiente);
    setAvatarSeleccionado(color);
    setMostrarSelector(false);

    if (accionPendiente === "crear") crearPartida(color);
    else if (accionPendiente === "codigo") unirsePorCodigo(color);
    else if (accionPendiente === "random") unirseAleatoria(color);

    setAccionPendiente(null);
  }

  function handleCancelarSeleccion() {
    setMostrarSelector(false);
    setAccionPendiente(null);
  }

  async function startAction(tipo) {
    console.log('startAction invoked, tipo=', tipo);
    setAccionPendiente(tipo);
    setMostrarSelector(true);
  }


  return (
    <div className="lobby-container">
      {/* Toast simple */}
      {toast && (
        <div className="app-toast">{toast}</div>
      )}
      <h2>Lobby de Partidas</h2>

      {/* Lista de mis partidas activas */}
      {misPartidasActivas.length > 0 && (
        <div className="mis-partidas-activas">
          <h3>Mis Partidas Activas</h3>
          {misPartidasActivas.map(({ jugador, partida }) => (
            <div
              key={partida.id}
              className="partida-item"
              style={{ border: "1px solid #ccc", padding: 12, borderRadius: 8, marginBottom: 16 }}
            >
              <h4>
                {partida.codigo_acceso ? (
                  <>Partida: <b>{partida.codigo_acceso}</b></>
                ) : (
                  'Partida sin código'
                )}
              </h4>
              <p>
                Estado: <b>{partida.estado}</b> · 
                {jugador.es_anfitrion ? 'Eres anfitrión' : 'Jugador'} ·
                Avatar: <span style={{display:'inline-flex', alignItems:'center', gap:8}}>
                  <span style={{display:'inline-block', width:12, height:12, borderRadius:'50%', backgroundColor: avatarColor(jugador.avatar_elegido)}} />
                  <span>{(jugador.avatar_elegido && jugador.avatar_elegido !== 'default') ? jugador.avatar_elegido : 'default'}</span>
                </span>
              </p>
              <button onClick={() => goToBoard(partida.id)}>
                Ir a esta partida
              </button>
            </div>
          ))}
        </div>
      )}

      {!mostrarSelector ? (
        <>
          <button onClick={() => startAction("crear")}>
            Crear nueva partida
          </button>

          <div>
            <input
              placeholder="Código de partida"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
            <button onClick={() => startAction("codigo")}>
              ➡️ Unirse por código
            </button>
          </div>

          <button onClick={() => startAction("random")}>
            Unirse a una partida aleatoria
          </button>

          <button onClick={() => navigate("/bienvenida")}>⬅️ Volver</button>
        </>
      ) : (
        <SelectorAvatar onSelect={handleAvatarSelect} onCancel={handleCancelarSeleccion} />
      )}
    </div>
  );
}

