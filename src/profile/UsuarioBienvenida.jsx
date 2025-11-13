import { useNavigate } from "react-router-dom";
import logoInicio from "../imagenes/logo_inicio.png"; 

export default function UsuarioBienvenida() {
  const navigate = useNavigate();
  const nombre = localStorage.getItem("nombre") || "Jugador";

  return (
    <div className="bienvenida home-hero">
      {/* Logo */}
      <img
        src={logoInicio}
        alt="Chef Around the World"
        className="logo-inicio"
      />

      <h1>¡Hola, {nombre}!</h1>
      <p>Bienvenido a Chef Around the World</p>

      <button onClick={() => navigate("/lobby")}>
        Ir al lobby de partidas
      </button>
    </div>
  );
}

