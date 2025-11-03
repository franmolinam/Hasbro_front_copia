import './App.css'
import { useNavigate } from "react-router-dom";

export default function App() {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <h1>Chef Around the World 👩‍🍳🌍</h1>
      <p>Elige una opción para comenzar:</p>

      <button onClick={() => navigate("/login")}>Iniciar sesión</button>
      <button onClick={() => navigate("/signup")}>Registrarse</button>
      <button onClick={() => navigate("/instructions")}>Ver instrucciones</button>
    </div>
  );
}
