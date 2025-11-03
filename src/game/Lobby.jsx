import { useState } from "react";

export default function Lobby() {
  const [codigo, setCodigo] = useState("");

  async function crearPartida() {
    const token = localStorage.getItem("token");
    const res = await fetch("https://tu-backend.onrender.com/partidas", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ anfitrion_usuario_id: 1 }) // ajusta según login real
    });
    const data = await res.json();
    alert(`Partida creada: código ${data.partida.codigo_acceso}`);
  }

  async function unirsePorCodigo() {
    const token = localStorage.getItem("token");
    const res = await fetch(`https://hasbro-back-252s2.onrender.com/partidas/${codigo}/unirse`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ usuarioId: 2 }) // ajusta según usuario real
    });
    const data = await res.json();
    alert(`Unido a partida ${codigo}`);
  }

  return (
    <div>
      <h2>Partidas</h2>
      <button onClick={crearPartida}>Crear partida</button>
      <input
        placeholder="Código de partida"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
      />
      <button onClick={unirsePorCodigo}>Unirse</button>
    </div>
  );
}
