import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import UsuarioBienvenida from "../profile/UsuarioBienvenida.jsx";
import Login from "../profile/Login.jsx";
import Signup from "../profile/Signup.jsx";
import Instructions from "../game/Instructions.jsx";
import Nosotras from "../game/Nosotras.jsx";
import Board from "../game/Board.jsx";
import Lobby from "../game/Lobby.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

function Routing() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/instructions" element={<Instructions />} />
        <Route path="/nosotras" element={<Nosotras />} />

        {/* Rutas protegidas */}
        <Route
          path="/bienvenida"
          element={
            <ProtectedRoute>
              <UsuarioBienvenida />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lobby"
          element={
            <ProtectedRoute>
              <Lobby />
            </ProtectedRoute>
          }
        />
        <Route
          path="/board/:partidaId"
          element={
            <ProtectedRoute>
              <Board />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default Routing;
