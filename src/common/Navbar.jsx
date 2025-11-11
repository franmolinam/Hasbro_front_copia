import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Navbar.css";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState(null);

  // Sincronizar token desde localStorage cada vez que cambia la ruta
  // Esto asegura que después de login/logout se actualice correctamente
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, [location.pathname]);

  // No mostrar navbar en la vista del tablero
  if (location.pathname.startsWith("/board")) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("socketId");
    localStorage.removeItem("nombre");
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo/Home */}
        <div className="navbar-logo">
          <button onClick={() => navigate("/")} className="logo-btn">
            👨‍🍳 🌍
          </button>
        </div>

        {/* Links de navegación central */}
        <ul className="nav-menu">
          <li>
            <button onClick={() => navigate("/instructions")} className="nav-link">
              📖 Instrucciones
            </button>
          </li>
          <li>
            <button onClick={() => navigate("/nosotras")} className="nav-link">
              👥 Nosotras
            </button>
          </li>
        </ul>

        {/* Botones de autenticación */}
        <div className="navbar-auth">
          {!token ? (
            <>
              <button onClick={() => navigate("/login")} className="nav-btn login-btn">
                🔓 Login
              </button>
              <button onClick={() => navigate("/signup")} className="nav-btn signup-btn">
                ✍️ Registro
              </button>
            </>
          ) : (
            <button onClick={handleLogout} className="nav-btn logout-btn">
              🚪 Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
