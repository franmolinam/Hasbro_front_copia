import { useNavigate } from "react-router-dom";
import fotoAnto from "../imagenes/anto.png";
import fotoFran from "../imagenes/fran.png";
import fotoAmanda from "../imagenes/amanda.png";

export default function Nosotras() {
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
      <h1>Nosotras</h1>

      <section>
        <h2>¿Quiénes somos?</h2>
        <p>
          Somos tres amigas apasionadas por la tecnología, la creatividad y el trabajo en equipo.
          Estudiamos <strong>Ingeniería</strong> con menciones en <strong>Software, Industrial y Diseño e Innovación</strong>,
          y unimos nuestras habilidades para dar vida a <strong>Chef Around the World</strong>.
        </p>
        <p>
          Este proyecto nació de una idea simple: combinar la emoción de la cocina con el desafío de la programación.
          Queríamos crear una experiencia donde el diseño, la lógica y la diversión convivieran en equilibrio.
        </p>
        <p>
          Nos motiva demostrar que la tecnología también puede ser creativa, visual y colaborativa.
          Como <strong>mujeres en STEM</strong>, nos enorgullece construir espacios donde más personas se atrevan a innovar, jugar y aprender.
        </p>
      </section>

      <div className="nosotras-strip--static">
        <img src={fotoAnto} alt="Antonia Oyonarte" />
        <img src={fotoFran} alt="Francisca Molina" />
        <img src={fotoAmanda} alt="Amanda Wood" />
      </div>

      <button className="back-button" onClick={handleBack}>
        Volver atrás
      </button>

    </div>
  );
}
