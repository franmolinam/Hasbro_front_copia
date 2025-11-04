import { useNavigate } from "react-router-dom";

export default function UsuarioBienvenida() {
  const navigate = useNavigate();
  const nombre = localStorage.getItem("nombre") || "Jugador";

  return (
    <div className="bienvenida">
      <h1>¡Hola, {nombre}!</h1>
      <p>Bienvenido a Chef Around the World 🌍</p>

      <button onClick={() => navigate("/instructions")}>Ver instrucciones</button>
      <button onClick={() => navigate("/lobby")}>
        Ir al lobby de partidas
      </button>
      <button
        onClick={() => {
          localStorage.clear();
          navigate("/login");
        }}
      >
        Cerrar sesión
      </button>
    </div>
  );
}
