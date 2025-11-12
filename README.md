# Chef Around the World - E3

## Integrantes 
- Francisca Molina
- Antonia Oyonarte
- Amanda Wood

Para acceder al proyecto apreta [este link](https://chefaround.netlify.app/).

## Descripción General del Juego
"Chef Around the World" es un juego web multijugador donde los jugadores compiten por ser el mejor chef internacional. Los jugadores deben completar desafíos culinarios en diferentes países, utilizando ingredientes y técnicas específicas para ganar puntos y reconocimiento.

## Estructura del Proyecto
- **Frontend**: `Hasbro_front_252s2` - Desarrollado con React + Vite.
- **Backend**: `Hasbro_back_252s2` - Desarrollado con Node.js (Koa) y PostgreSQL.

## Reglas del Juego
- Por turnos, cada jugador debe completar un conjunto de recetas en un tiempo limitado para pasar de nivel. El primer jugador en alcanzar la meta gana la partida.
- Cada minijuego consiste en un país, con su comida típica, los ingredientes deben arrastrasrse con el mouse para lograr los pedidos.
- Hay una casilla de fortuna, la cual puede otorgar o quitar tiempo del siguiente nivel, hacerlo avanzar, o retroceder en el tablero.

## Cambios Relevantes Respecto a Entregas Anteriores
Se ha mejorado la funcionalidad de la API. Se ha desarrollado el frontend, generando una interfaz gráfica que permite mejorar la experiencia del usuario.
- Componentes Principales: Página de inicio, log in, registro,  tablero de juego, perfil del jugador.
- Organización del CSS.
- Navegación y Barra Superior: Incluye enlaces a las secciones principales del juego y un menú de usuario.

### API del Backend
- **Endpoints**:
    - `POST /api/auth/login` - Autenticación de usuarios.
    - `GET /api/games` - Obtener lista de juegos.
- **Autenticación**: Utiliza JWT para la autenticación de usuarios.
- **Roles y Rutas Protegidas**: Los usuarios tienen roles de "jugador" y "administrador", con rutas protegidas para cada uno.


### Uso de WebSockets
- Eventos para la comunicación en tiempo real entre jugadores.
- Flujo de eventos para actualizaciones de estado del juego.

## Qué falta por desarrollar
Para la próxima entrega, se deben desarrollar el frontend de cada minijuego, el cual consiste en una  "cocina" donde cada jugador puede armar los pedidos, dependiendo del país, pero siempre con 6 ingredientes disponibles. Los mock up pueden verse en el [siguinte link](https://www.canva.com/design/DAG4g9GoOa4/wugT0koDO8aOaP3zfxkVwQ/edit?utm_content=DAG4g9GoOa4&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)

