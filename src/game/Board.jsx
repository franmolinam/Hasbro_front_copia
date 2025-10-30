import './Board.css'
import Casilla from "./Casilla"

export default function Board() {
    const casillas = [
        { id: 1, imgSrc: '../bandera inicio.png' },
        { id: 2, imgSrc: '../badera italia.png' },
        { id: 3, imgSrc: '../bandera eeuu.png' }
    ]
    return (
        <div className="board">
            <div className="board-row">
                {casillas.map(casilla => (
                    <Casilla key={casilla.id} imgSrc={casilla.imgSrc} />
                ))}

            </div>

        </div>
    )
}