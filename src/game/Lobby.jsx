import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SelectorAvatar from "../profile/SelectorAvatar.jsx";

export default function Lobby() {
  const [codigo, setCodigo] = useState("");
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState(null);
  const [avatarSeleccionado, setAvatarSeleccionado] = useState(null);

  const navigate = useNavigate();

  const API_URL = "https://hasbro-back-252s2.onrender.com";
  const token = localStorage.getItem("token");

  // 🔍 Obtener el id del usuario desde el token
  function getUserIdFromToken() {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return parseInt(payload.sub);
    } catch (err) {
      console.error("Error decodificando token:", err);
      return null;
    }
  }

  const usuarioId = getUserIdFromToken();

  async function crearPartida(colorAvatar) {
    if (!usuarioId) {
      alert("No se pudo obtener el usuario. Inicia sesión nuevamente.");
      return;
    }

    const res = await fetch(`${API_URL}/partidas`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        anfitrion_usuario_id: usuarioId,
        avatar_elegido: colorAvatar
      })
    });

    const data = await res.json();
    if (res.ok) {
      alert(`✅ Partida creada: código ${data.partida.codigo_acceso}`);
      navigate(`/board/${data.partida.Id}`);
    } else {
      alert(`❌ Error: ${data.error || "No se pudo crear la partida"}`);
    }
  }

  async function unirsePorCodigo(colorAvatar) {
    if (!codigo) {
      alert("Ingresa un código de partida");
      return;
    }

    const res = await fetch(`${API_URL}/partidas/${codigo}/unirse`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        usuarioId,
        avatar_elegido: colorAvatar || "default"
      })
    });

    const data = await res.json();
    if (res.ok) {
      alert(`🎮 Te uniste a la partida ${codigo}`);
      navigate(`/board/${data.partidaId}`);
    } else {
      alert(`❌ Error: ${data.error || "No se pudo unir a la partida"}`);
    }
  }

  async function unirseAleatoria(colorAvatar) {
    const res = await fetch(`${API_URL}/partidas/unirse-random`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        usuarioId,
        avatar_elegido: colorAvatar || "default"
      })
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

    if (res.ok) {
      alert(`🎲 Te uniste a una partida aleatoria`);
      navigate(`/board/${data.partidaId}`);
    } else {
      alert(`❌ Error: ${data.error || "No hay partidas disponibles"}`);
    }
  }

  function handleAvatarSelect(color) {
    setAvatarSeleccionado(color);
    setMostrarSelector(false);

    if (accionPendiente === "crear") crearPartida(color);
    else if (accionPendiente === "codigo") unirsePorCodigo(color);
    else if (accionPendiente === "random") unirseAleatoria(color);
  }

  // 🚪 Cuando cancela el selector
  function handleCancelarSeleccion() {
    setMostrarSelector(false);
    setAccionPendiente(null);
  }

  return (
    <div className="lobby-container">
      <h2>🎯 Lobby de Partidas</h2>

      {!mostrarSelector ? (
        <>
          <button
            onClick={() => {
              setAccionPendiente("crear");
              setMostrarSelector(true);
            }}
          >
            🧩 Crear nueva partida
          </button>

          <div>
            <input
              placeholder="Código de partida"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
            <button
              onClick={() => {
                setAccionPendiente("codigo");
                setMostrarSelector(true);
              }}
            >
              ➡️ Unirse por código
            </button>
          </div>

          <button
            onClick={() => {
              setAccionPendiente("random");
              setMostrarSelector(true);
            }}
          >
            🎲 Unirse a una partida aleatoria
          </button>

          <button onClick={() => navigate("/bienvenida")}>⬅️ Volver</button>
        </>
      ) : (
        <SelectorAvatar
          onSelect={handleAvatarSelect}
          onCancel={handleCancelarSeleccion}
        />
      )}
    </div>
  );
}
