import { useNavigate } from "react-router-dom";

export default function Instructions() {
  const navigate = useNavigate();

  function handleBack() {
    const canGoBack =
      window.history.length > 1 &&
      window.history.state &&
      typeof window.history.state.idx === "number" &&
      window.history.state.idx > 0;

    if (canGoBack) navigate(-1);
    else navigate("/"); 
  }

  return (
    <div className="instructions-container">
      <h1>Instrucciones del Juego</h1>

      <section>
        <h2>
          Bienvenid@ a <strong>Chef Around the World!</strong>
        </h2>
        <p>
          En este juego competirás en la cocina para convertirte en el mejor chef internacional.
          ¡Demuestra tus habilidades y gana el título de <strong>Mejor Chef del Mundo</strong>!
        </p>
      </section>

      <section>
        <h3>Cómo unirte al juego</h3>
        <p>
          Para poder unirte a una partida debes contar con una cuenta.
          Puedes <strong>iniciar sesión</strong> o <strong>registrarte</strong> si aún no tienes una.
        </p>
        <p>
          Luego de iniciar sesión, puedes <strong>crear una partida</strong> y compartir el código con tus amigos,
          o unirte a una aleatoria. Escoge un avatar para diferenciarte del resto de los jugadores.
          Cada partida tiene entre <strong>2 y 4 jugadores</strong>.
        </p>
      </section>

      <section>
        <h3>Cómo jugar</h3>
        <p>
          Por turnos, los chefs de la partida avanzan en el tablero.
          El ganador será quien <strong>llegue primero a la meta</strong>.
        </p>
        <p>
          Cada nivel cuenta con un <strong>minijuego</strong> donde deberás entregar los pedidos desde tu cocina antes de que se acabe el tiempo.
          Los pedidos muestran qué ingredientes debe tener la comida, y deberás <strong>arrastrarlos con el mouse</strong> para prepararla.
          Si lo logras, avanzarás de nivel.
        </p>
      </section>

      <section>
        <h3>Casilla de fortuna</h3>
        <p>
          ¡Ten cuidado! La <strong>casilla de fortuna</strong> puede cambiarlo todo:
          podrías <strong>avanzar</strong>, <strong>retroceder</strong> o <strong>modificar tu tiempo disponible</strong> para el siguiente nivel.
        </p>
      </section>

      <section className="final-section">
        <p>
          Usa tu ingenio, velocidad y creatividad para completar los pedidos antes que tus oponentes.
          <strong> ¡Suerte, y que gane el mejor chef!</strong>
        </p>
      </section>

      <button className="back-button" onClick={handleBack}>
        Volver atrás
      </button>
    </div>
  );
}
