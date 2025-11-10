import { useState } from "react";
import { login } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [cargando, setCargando] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setCargando(true);

    console.log("➡️ Iniciando login con:", email, password);
    try {
      const data = await login(email, password);
      console.log("🔍 Respuesta del servidor:", data);
      if (data.token_acceso) {
        localStorage.setItem("token", data.token_acceso);
        localStorage.setItem("nombre", data.usuario?.nombre || "Jugador");
        alert("Inicio de sesión exitoso");
        navigate("/bienvenida");
      } else {
        alert(data.error || "Error al iniciar sesión");
      }  
    } catch (error) {
      alert("❌ Error de conexión con el servidor");
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

      </div>
  );
}
