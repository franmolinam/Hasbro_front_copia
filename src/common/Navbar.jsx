import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Navbar.css";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      try {
        const parts = storedToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload && payload.exp && Date.now() / 1000 > payload.exp) {
            // token expirado: limpiamos storage
            localStorage.removeItem('token');
            localStorage.removeItem('socketId');
            localStorage.removeItem('nombre');
            setToken(null);
            return;
          }
        }
      } catch (e) {
        // token malformed: limpiar también
        localStorage.removeItem('token');
        localStorage.removeItem('socketId');
        localStorage.removeItem('nombre');
        setToken(null);
        return;
      }
    }
    setToken(storedToken);
  }, [location.pathname]);

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
              Instrucciones
            </button>
          </li>
          <li>
            <button onClick={() => navigate("/nosotras")} className="nav-link">
              Nosotras
            </button>
          </li>
        </ul>

        {/* Botones de autenticación */}
        <div className="navbar-auth">
          {!token ? (
            <>
              <button onClick={() => navigate("/login")} className="nav-btn login-btn">
                Login
              </button>
              <button onClick={() => navigate("/signup")} className="nav-btn signup-btn">
                Registro
              </button>
            </>
          ) : (
            <button onClick={handleLogout} className="nav-btn logout-btn">
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
