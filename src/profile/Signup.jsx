import { useState } from "react";
import { signup } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    const data = await signup(nombre, email, password);
    if (data.email) {
      setToast("Cuenta creada exitosamente");
      setTimeout(() => setToast(null), 3000);
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setToast("Error al registrarse");
      setTimeout(() => setToast(null), 3000);
    }
  }

  return (
    <div className="signup-container">
      <h2>Registro</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Correo"
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
        <button type="submit">Registrarse</button>
      </form>
      {toast && (
        <div className="app-toast">{toast}</div>
      )}
    </div>
  );
}

