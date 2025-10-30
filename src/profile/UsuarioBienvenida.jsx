import { useState } from "react";

export default function UsuarioBienvenida() {
    const [nombre, setNombre] = useState(null)

    function manejarCambio(nombre) {
        setNombre(nombre);
    }
    return (
        <>
        <h2>Mi primer componente!</h2>
        <input 
            onChange={e => manejarCambio(e.target.value)}
        />
        <p>Hola {nombre}</p>
        </>
    )
}