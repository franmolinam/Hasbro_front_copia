import "./App.css";
import "../styles/global.css";
import { useNavigate } from "react-router-dom";
import logoInicio from "../imagenes/logo_inicio.png"; 

export default function App() {
  const navigate = useNavigate();

  return (
    <div className="home-hero">
      {/* Logo */}
      <img
        src={logoInicio}
        alt="Chef Around the World"
        className="logo-inicio"
      />

      <h2>Elige una opción para comenzar:</h2>

      <button onClick={() => navigate("/login")}>Iniciar sesión</button>
      <button onClick={() => navigate("/signup")}>Registrarse</button>
      <button onClick={() => navigate("/instructions")}>Ver instrucciones</button>
      <button onClick={() => navigate("/nosotras")}>Nosotras</button>
    </div>
  );
}

