import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import UsuarioBienvenida from '../profile/UsuarioBienvenida.jsx';
import Login from "../profile/Login.jsx";
import Signup from "../profile/Signup.jsx";
import Instructions from '../game/Instructions.jsx';
import Board from "../game/Board.jsx";
import Lobby from "../game/Lobby.jsx";

function Routing(){
    return(
        <>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/bienvenida" element={<UsuarioBienvenida />} />
                <Route path="/instructions" element={<Instructions />} />
                <Route path="/lobby" element={<Lobby />} />
                <Route path="/board" element={<Board />} />
            </Routes>
        </BrowserRouter>
        </>
    )
}

export default Routing;