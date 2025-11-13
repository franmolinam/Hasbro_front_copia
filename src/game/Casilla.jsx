import './Casilla.css';
import { useState } from 'react';

export default function Casilla({ imgSrc, children }) {
  const [showImage] = useState(true);

  return (
    <div className="casilla">
      <div className="casilla-container">
        {/* overlay arriba de la imagen */}
        {children}

        {showImage && <img src={imgSrc} className="icono" />}
      </div>

    </div>
  );
}
