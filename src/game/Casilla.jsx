import './Casilla.css';
import { useState } from 'react';
import BotonCasilla from './BotonCasilla.jsx';

export default function Casilla({ imgSrc, children }) {
  const [showImage, setShowImage] = useState(true);
  const toggleImage = () => setShowImage(!showImage);

  return (
    <div className="casilla">
      <div className="casilla-container">
        {/* overlay arriba de la imagen */}
        {children}

        {showImage && <img src={imgSrc} className="icono" />}
      </div>

      <BotonCasilla onClick={toggleImage} showImage={showImage} />
    </div>
  );
}
