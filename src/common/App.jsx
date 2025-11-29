import "./App.css";
import "../styles/global.css";
import logoInicio from "../imagenes/logo_inicio.png"; 

export default function App() {
  return (
    <div className="home-hero">
      {/* Logo */}
      <img
        src={logoInicio}
        alt="Chef Around the World"
        className="logo-inicio"
      />

      <h2>¡Bienvenido al juego!</h2>
      <p className="intro">
        Usa la barra de navegación superior para acceder a las diferentes secciones.
      </p>
    </div>
  );
}

