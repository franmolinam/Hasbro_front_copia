import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SelectorAvatar from "../profile/SelectorAvatar.jsx";
import { onPlayerJoined, offPlayerJoined, joinPartida } from '../api/socket';

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

  // 🔍 Id de usuario desde token de forma segura
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

  // 🟢 Cargar todas mis partidas activas (pendientes o en_juego)
  useEffect(() => {
    let isMounted = true;
    async function fetchMisPartidasActivas() {
      if (!usuarioId || !token || !isMounted) return;
      try {
        // Obtener todos los jugadores activos del usuario
        const res = await fetch(
          `${API_URL}/jugadores?usuarioId=${usuarioId}&inactivo=false&includePartida=true`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('Buscando partidas activas...'); // Debug
        if (!res.ok) {
          console.error('Error al buscar partidas:', await res.text());
          return;
        }
        const data = await res.json();
        console.log('Jugadores encontrados:', JSON.stringify(data, null, 2));

        // Array para almacenar las partidas activas con su información
        const partidasActivas = [];

        // Obtener detalles de cada partida
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
                
                // ✅ NUEVO: Unirse a la sala WebSocket de esta partida
                joinPartida(partida.id);
                console.log('🎯 Uniéndose a sala WebSocket de partida:', partida.id);
              }
            }
          }
        }

        // Actualizar el estado con todas las partidas activas encontradas
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

  // 🎮 Escuchar cuando otro jugador se une a la partida (SEGUNDO useEffect INDEPENDIENTE)
  useEffect(() => {
    const handlePlayerJoined = ({ jugador, partidaId }) => {
      console.log('🎮 handlePlayerJoined ejecutado:', { jugador, partidaId });
      // Mostrar notificación temporal
      try {
        const nombre = jugador?.nombre || 'Un jugador';
        setToast(`${nombre} se ha unido a la partida`);
        setTimeout(() => setToast(null), 4000);
      } catch (e) { console.error(e); }
      
      // Actualizar la partida en misPartidasActivas
      setMisPartidasActivas(prev => {
        console.log('📊 Estado anterior:', prev);
        const updated = prev.map(item => {
          if (item.partida.id === partidaId) {
            console.log('✅ Actualizando partida:', partidaId);
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
        console.log('📊 Estado nuevo:', updated);
        return updated;
      });
    };

    console.log('🎬 Registrando listener de player_joined');
    onPlayerJoined(handlePlayerJoined);

    return () => {
      console.log('🛑 Desinscribiendo listener de player_joined');
      offPlayerJoined(handlePlayerJoined);
    };
  }, []);

  // Helper para guardar y navegar
    const goToBoard = (id) => {
    setPartidaId(id);
    navigate(`/board/${id}`);
  };

  // ===== Acciones =====
  async function crearPartida(colorAvatar) {
    console.log('crearPartida called, colorAvatar=', colorAvatar);
    if (!usuarioId) {
      alert("No se pudo obtener el usuario. Inicia sesión nuevamente.");
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
      alert(`✅ Partida creada: código ${data.partida.codigo_acceso}`);
      // ✅ NUEVO: Unirse a la sala WebSocket de la partida que acabo de crear
      joinPartida(data.partida.id);
      console.log('🎯 Uniéndose a sala WebSocket de partida creada:', data.partida.id);
      goToBoard(data.partida.id);
    } else {
      alert(`❌ Error: ${data.error || "No se pudo crear la partida"}`);
    }
  }

  async function unirsePorCodigo(colorAvatar) {
    console.log('unirsePorCodigo called, codigo=', codigo, 'colorAvatar=', colorAvatar);
    if (!codigo) {
      alert("Ingresa un código de partida");
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
      alert(`🎮 Te uniste a la partida ${codigo}`);
      // ✅ CAMBIO: Unirse a la sala ANTES de navegar
      joinPartida(data.partidaId);
      console.log('🎯 Uniéndose a sala WebSocket de partida:', data.partidaId);
      
      // Pequeño delay para asegurar que el join_partida se emitió antes de navegar
      setTimeout(() => {
        goToBoard(data.partidaId);
      }, 100);
    } else {
      alert(`❌ Error: ${data.error || "No se pudo unir a la partida"}`);
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
      alert(`🎲 Te uniste a la partida ${data.partida.codigo_acceso}`);
      // ✅ NUEVO: Unirse a la sala WebSocket de la partida
      joinPartida(data.partida.id);
      console.log('🎯 Uniéndose a sala WebSocket de partida:', data.partida.id);
      goToBoard(data.partida.id);
    } else {
      alert(`❌ Error: ${data.error || "No hay partidas disponibles"}`);
    }
  }


  // 🎨 Selección de avatar → ejecutar acción
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

  // Si el usuario intenta iniciar otra acción mientras está en una partida,
  // preguntamos si quiere salir y luego procedemos.
  async function startAction(tipo) {
    console.log('startAction invoked, tipo=', tipo);

    // Mostrar selector inmediatamente para que el usuario pueda elegir avatar.
    setAccionPendiente(tipo);
    setMostrarSelector(true);
  }


  return (
    <div className="lobby-container">
      {/* Toast simple */}
      {toast && (
        <div style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px 14px',
          borderRadius: 8,
          zIndex: 9999,
        }}>{toast}</div>
      )}
      <h2>🎯 Lobby de Partidas</h2>

      {/* Lista de mis partidas activas */}
      {misPartidasActivas.length > 0 && (
        <div className="mis-partidas-activas">
          <h3>🎮 Mis Partidas Activas</h3>
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
                {jugador.es_anfitrion ? ' 👑 Eres anfitrión' : ' 🎲 Jugador'} ·
                Avatar: <span style={{color: jugador.avatar_elegido || 'gray'}}>{jugador.avatar_elegido || 'default'}</span>
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
            🧩 Crear nueva partida
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
            🎲 Unirse a una partida aleatoria
          </button>

          <button onClick={() => navigate("/bienvenida")}>⬅️ Volver</button>
        </>
      ) : (
        <SelectorAvatar onSelect={handleAvatarSelect} onCancel={handleCancelarSeleccion} />
      )}
    </div>
  );
}

