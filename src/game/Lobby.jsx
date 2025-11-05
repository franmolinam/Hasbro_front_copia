import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SelectorAvatar from "../profile/SelectorAvatar.jsx";

export default function Lobby() {
  const [codigo, setCodigo] = useState("");
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState(null);
  const [miJugadorActivo, setMiJugadorActivo] = useState(null);
  const [avatarSeleccionado, setAvatarSeleccionado] = useState(null);
  const [fallbackPartidaId, setFallbackPartidaId] = useState(
    localStorage.getItem("lastPartidaId") || null
  );

  const navigate = useNavigate();

  const API_URL = "https://hasbro-back-252s2.onrender.com";
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

  // 🟢 Cargar mi partida activa si existe (pendiente o en_juego).
  // Si el backend aún no soporta includePartida, usamos fallback de localStorage.
  useEffect(() => {
    let isMounted = true; // Para evitar actualizaciones si el componente se desmonta
    async function fetchMiPartidaActiva() {
      if (!usuarioId || !token || !isMounted) return;
      try {
        // Primero intentamos obtener jugadores activos
        const res = await fetch(
          `${API_URL}/jugadores?usuarioId=${usuarioId}&inactivo=false&includePartida=true`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('Buscando partida activa...'); // Debug
        if (!res.ok) {
          console.error('Error al buscar partida activa:', await res.text());
          return;
        }
        const data = await res.json();
        console.log('Jugadores encontrados:', JSON.stringify(data, null, 2)); // Debug detallado

        // Si encontramos jugadores activos, buscar su partida
        for (const jugador of data) {
          console.log('Verificando jugador:', jugador.id, 'partidaId:', jugador.partidaId);
          
          if (jugador.partidaId) {
            // Hacer una llamada adicional para obtener los detalles de la partida
            const partidaRes = await fetch(`${API_URL}/partidas/${jugador.partidaId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            const partidaData = await partidaRes.json();
            console.log('Respuesta de partida:', {
              ok: partidaRes.ok,
              status: partidaRes.status,
              data: partidaData
            });
            
            if (partidaRes.ok) {
              const partida = partidaData;
              
              if (["pendiente", "en_juego"].includes(partida.estado)) {
                // Combinar la información del jugador con la partida
                const jugadorConPartida = {
                  ...jugador,
                  Partida: partida // Usamos Partida en lugar de Partidum para consistencia
                };
                
                setMiJugadorActivo(jugadorConPartida);
                if (partida.id) {
                  localStorage.setItem("lastPartidaId", partida.id);
                  setFallbackPartidaId(partida.id);
                }
                break; // Salir del loop una vez que encontremos una partida activa
              }
            }
          }
        }
      } catch {
        // Silencioso: mantenemos fallback si existía
      }
    }
    fetchMiPartidaActiva();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [usuarioId, token]); // El efecto solo se ejecutará cuando estos valores cambien

  // Helper para guardar y navegar
  function goToBoardAndRemember(partidaId) {
    if (partidaId) {
      localStorage.setItem("lastPartidaId", partidaId);
      setFallbackPartidaId(partidaId);
      navigate(`/board/${partidaId}`);
    }
  }

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
      goToBoardAndRemember(data.partida.id); // 👈 id (no Id)
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
      goToBoardAndRemember(data.partidaId);
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
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      console.error("Respuesta inesperada:", text);
      data = { error: "Respuesta no válida del servidor" };
    }

    if (res.ok && data?.partidaId) {
      alert(`🎲 Te uniste a una partida aleatoria`);
      goToBoardAndRemember(data.partidaId);
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

  // Estado de “ya estoy en una partida”
  const hayPartidaActiva =
    !!miJugadorActivo ||
    (!!fallbackPartidaId && fallbackPartidaId !== "null" && fallbackPartidaId !== "undefined");

  // Si el usuario intenta iniciar otra acción mientras está en una partida,
  // preguntamos si quiere salir y luego procedemos.
  async function startAction(tipo) {
    console.log('startAction invoked, tipo=', tipo, 'hayPartidaActiva=', hayPartidaActiva);

    // Mostrar selector inmediatamente para que el usuario pueda elegir avatar.
    setAccionPendiente(tipo);
    setMostrarSelector(true);

    // Si ya está en una partida, preguntar si desea salir. Si cancela, revertir.
    if (hayPartidaActiva) {
      const confirma = window.confirm(
        "Ya estás en una partida. ¿Quieres salir de ella y continuar?"
      );
      if (!confirma) {
        // usuario canceló, ocultar selector y reset
        setMostrarSelector(false);
        setAccionPendiente(null);
        return;
      }

      const ok = await salirDeMiPartida();
      if (!ok) {
        // si falló al salir, revertir UI
        setMostrarSelector(false);
        setAccionPendiente(null);
        return;
      }
      // si salió correctamente, el selector ya está visible y la acción pendiente sigue
    }
  }

  // Salir de mi partida (marca inactivo en backend)
  async function salirDeMiPartida() {
    try {
      if (miJugadorActivo) {
        const res = await fetch(`${API_URL}/jugadores/${miJugadorActivo.id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inactivo: true }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          // Si la partida no está activa en el backend, todavía permitimos limpiar el estado local.
          if (data?.error && data.error.includes("La partida no está activa")) {
            console.warn('Backend indica que la partida no está activa; limpiando estado local.');
            // continua para limpiar el estado local
          } else {
            alert(`❌ Error: ${data.error || "No se pudo salir de la partida"}`);
            return false;
          }
        }
      }
      // limpia fallback
      localStorage.removeItem("lastPartidaId");
      setFallbackPartidaId(null);
      setMiJugadorActivo(null);
      alert("Saliste de tu partida actual.");
      return true;
    } catch (e) {
      console.error(e);
      alert("Error inesperado al salir de la partida.");
      return false;
    }
  }

  // Datos para el bloque “Mi partida”
  const partidaActiva =
    (miJugadorActivo && (miJugadorActivo.Partidum || miJugadorActivo.Partida)) || null;
  const partidaActivaId = partidaActiva?.id || fallbackPartidaId;
  const partidaActivaEstado = partidaActiva?.estado || (fallbackPartidaId ? "en_juego" : null);
  const partidaActivaCodigo = partidaActiva?.codigo_acceso || null;

  return (
    <div className="lobby-container">
      <h2>🎯 Lobby de Partidas</h2>

      {/* Mi partida actual (usa API si hay, si no usa localStorage) */}
      {hayPartidaActiva && (
        <div
          className="mi-partida-actual"
          style={{ border: "1px solid #ccc", padding: 12, borderRadius: 8, marginBottom: 16 }}
        >
          <h4>🟢 Estás en una partida</h4>
          <p>
            {partidaActivaCodigo && (
              <>
                Código: <b>{partidaActivaCodigo}</b> ·{" "}
              </>
            )}
            Estado: <b>{partidaActivaEstado}</b>
          </p>
          <button onClick={() => goToBoardAndRemember(partidaActivaId)}>
            Volver a mi partida
          </button>
          <button onClick={salirDeMiPartida} style={{ marginLeft: 8 }}>
            Salir de esta partida
          </button>
        </div>
      )}

      {!mostrarSelector ? (
        <>
          <button onClick={() => startAction("crear")} title={hayPartidaActiva ? "Ya estás en una partida" : ""}>
            🧩 Crear nueva partida
          </button>

          <div>
            <input
              placeholder="Código de partida"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
            <button onClick={() => startAction("codigo")} title={hayPartidaActiva ? "Ya estás en una partida" : ""}>
              ➡️ Unirse por código
            </button>
          </div>

          <button onClick={() => startAction("random")} title={hayPartidaActiva ? "Ya estás en una partida" : ""}>
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

