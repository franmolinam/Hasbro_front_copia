import { useState } from "react";
import "../styles/global.css";

export default function SelectorAvatar({ onSelect, onCancel }) {
  const colores = ["blue", "red", "green", "yellow", "purple"];
  const [seleccion, setSeleccion] = useState("");

  return (
    <div className="avatar-selector">
      <h3>Elige tu avatar</h3>
      <div className="avatar-options">
        {colores.map((color) => (
          <div
            key={color}
            className={`avatar-option ${seleccion === color ? "selected" : ""}`}
            style={{ backgroundColor: color, width: 50, height: 50, borderRadius: "50%", cursor: "pointer" }}
            onClick={() => setSeleccion(color)}
          />
        ))}
      </div>

      <div className="avatar-buttons">
        <button onClick={() => onSelect(seleccion || "default")}>
          Confirmar
        </button>
        <button onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}
