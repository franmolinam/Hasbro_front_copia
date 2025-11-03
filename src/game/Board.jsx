import './Board.css';
import Casilla from './Casilla';

export default function Board() {
  const casillas = [
    { id: 0, tipo: "inicio", img: "../imagenes/bandera inicio.png" },
    { id: 1, tipo: "minijuego", img: "../imagenes/bandera italia.png" },
    { id: 2, tipo: "minijuego", img: "../imagenes/bandera eeuu.png" },
    { id: 3, tipo: "fortuna", img: "/img/fortuna.png" },
    { id: 4, tipo: "minijuego", img: "/img/francia.png" },
    { id: 5, tipo: "minijuego", img: "/img/espana.png" },
  ];

  return (
    <div className="board">
      <h2>Tablero de juego</h2>
      <div className="board-row">
        {casillas.map(casilla => (
          <Casilla key={casilla.id} tipo={casilla.tipo} img={casilla.img} />
        ))}
      </div>
    </div>
  );
}
