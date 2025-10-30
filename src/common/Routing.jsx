import { BrowserRouter, Routes, Route } from "react-router-dom";
import UsuarioBienvenida from '../profile/UsuarioBienvenida.jsx';
import Instructions from '../game/Instructions.jsx';
import App from "./App";

function Routing(){
    return(
        <>
        <BrowserRouter>
            <Routes>
                <Route path="/bienvenida" element={<UsuarioBienvenida />} />
                <Route path="/instructions" element={<Instructions />} />
                <Route path="/" element={<App />} />
            </Routes>
        </BrowserRouter>
        </>
    )
}

export default Routing;