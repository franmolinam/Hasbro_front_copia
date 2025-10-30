import './Casilla.css';
import { useState } from 'react';
import BotonCasilla from './BotonCasilla.jsx';

export default function Casilla({imgSrc}) {
    const [showImage, setShowImage] = useState(true);
    const toggleImage = () => {
        setShowImage(!showImage);
    }

    return (
        <div className="casilla">
            <div className="casilla-container">
                {showImage && <img src={imgSrc} className="icono"></img>}
                
            </div>
            <BotonCasilla onClick={toggleImage} showImage={showImage} />
        </div>
    )
}