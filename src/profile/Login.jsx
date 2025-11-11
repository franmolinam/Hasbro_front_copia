import { useState } from "react";
import { login } from "../api/auth";
import { connect as connectSocket, registerUser } from "../api/socket";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [cargando, setCargando] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setCargando(true);

    console.log("➡️ Iniciando login con:", email, password);
    try {
      // Generar un socketId único en cliente para que el backend pueda almacenarlo
      const socketId = `socket_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
      const data = await login(email, password, socketId);
      console.log("🔍 Respuesta del servidor:", data);
      if (data.token_acceso) {
  localStorage.setItem("token", data.token_acceso);
  localStorage.setItem("nombre", data.usuario?.nombre || "Jugador");
  // Guardar socketId en localStorage para reconexiones y usarlo en register
  localStorage.setItem('socketId', socketId);
  // Usar alert en inicio exitoso para que el mensaje sea visible antes de redirigir
  alert('Inicio de sesión exitoso');
  // Conectar el WebSocket y registrar el usuario para recibir eventos en tiempo real
        try {
          await connectSocket();
          // registrar con el id de usuario devuelto por el backend
          if (data.usuario && data.usuario.id) registerUser(data.usuario.id, { token: data.token_acceso, socketId });
        } catch (err) {
          console.warn('No se pudo conectar WS:', err);
        }

  navigate("/bienvenida");
      } else {
        setToast(data.error || "Error al iniciar sesión");
        setTimeout(() => setToast(null), 4000);
      }  
    } catch (error) {
      setToast("❌ Error de conexión con el servidor");
      setTimeout(() => setToast(null), 4000);
      console.error(error);
    } finally {
      setCargando(false);
    }
  }


  return (
    <div className="login-container">
      <h2>Iniciar sesión</h2>
      
      {cargando ? (
        <div className="loading">
          ⏳ Iniciando sesión, por favor espera...
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Ingresar</button>
        </form>
        )}

        {!cargando && (
          <p>¿No tienes cuenta? <a href="/signup">Registrarse</a></p>
      )}

      {/* Toast simple */}
      {toast && (
        <div className="app-toast">{toast}</div>
      )}

      </div>
  );
}
