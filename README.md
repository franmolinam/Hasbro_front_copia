# Chef Around the World - E3

## Integrantes 
- Francisca Molina
- Antonia Oyonarte
- Amanda Wood

Para acceder al proyecto apreta [este link](https://chefaround.netlify.app/).

## Descripción General del Juego
"Chef Around the World" es un juego web multijugador donde 2 a 4 usuarios compiten por convertirse en el Mejor Chef del Mundo. 
Cada partida comienza en un tablero de 6 casillas que rerpesenta una ruta culinaria internacional. En cada país, los jugadores deben completar minijuegos de cocina, preparando platos típicos arrastrando los ingredientes correctos antes de que se acabe el tiempo. Además, a medida que se avanza en el tablero se va enfrentando una mayor dificultad en los minijuegos.
El primer jugador en completar toda la ruta gastronómica y superar con éxito el minijuego final gana la partida.

## Estructura del Proyecto
- **Frontend**: `Hasbro_front_252s2` - Desarrollado con React + Vite.
- **Backend**: `Hasbro_back_252s2` - Desarrollado con Node.js (Koa) y PostgreSQL.

## Reglas del Juego
- Turnos: Los jugadores avanzan por turnos definidos aleatoriamente al inicio de la partida.
- Movimiento en el tablero: En la primera jugada, un jugador avanza automáticamente a la casilla 1. Luego, cada jugador avanza al completar su minijuego correspondiente.
- Minijuegos por país: Cada casilla del tablero representa un país. En su turno, el jugador debe completar una cantidad de pedidos correspondientes a la comida típica de ese país,utilizando ingredientes correctos arrastrados con el mouse. Si se acaba el tiempo o se equivoca, deberá volver a intentarlo.
- Casilla de fortuna: Una de las casillas corresponde a una fortuna. En esta se puede dar tiempo extra para el siguiente minijuego, quitar tiempo, hacer avanzar al jugador o retrocederlo en el tablero.
- Condiciones para ganar: El primer jugador en superar el minijuego del último país gana la partida.
- Roles en la partida: El jugador que crea la partida es el anfitrión, y es el único que puede iniciarla. Los demás jugadores pueden unirse mediante código o de forma aleatoria.
- Desconexiones: Si un jugador queda inactivo, se marca como tal y no puede seguir participando.

## Cambios Relevantes Respecto a Entregas Anteriores
Se mejoró la funcionalidad de la API. Se desarrolló el frontend, generando una interfaz gráfica que permite mejorar la experiencia del usuario.
- Componentes Principales: Página de inicio, log in, registro, instrucciones, nosotras, perfil del jugador, lobby de partidas del jugador y tablero de cada partida.
- Organización del CSS.
- Navegación y Barra Superior: Barra Navegación esta presente en todas las vistas y permite ir a todas las secciones principales: "home", Instrucciones, Nosotras y Login, Registro y botón Logout cuando corresponda. En el perfil de bienvenida del usuario tiene un botón para ir al lobby de partidas.

### API del Backend
- **Endpoints conectados e implementados**:
    - `PATCH /judaores/:id` - Avanzar desde la casilla de inicio. Este endpoint permite que un jugador avance desde la casilla de inicio (posición_actual = 0) a la casilla 1, es decir, realizar su primer movimiento en el tablero. Solo puede ejecutarse si la partida está en estado "en_juego", es el turno actual de ese jugador y el jugador está efectivamente en la casilla de inicio (esta casilla en el frontend se ve en el tablero con un ícono de bandera de inicio). Para este endpoint, no es necesario enviar campos adicionales para el movimiento desde inicio, el backend lo maneja directo {}. Cuando el movimiento es exitoso, la respuesta a la request es 200 OK, con un mensaje tipo:
    {
        "message": "El jugador avanzó desde el inicio a la casilla 1. Puede comenzar su primer minijuego.",
        "jugador": {
            "id": 5,
            "posicion_actual": 1,
            "partidaId": 12,
            "inactivo": false,
            "...": "..."
        }
    }
    Otras respuestas posibles del servidor son: 400 Bad Request para errores posibles como que la partida no está activa, no es el turno del jugador o solo puede moverse desde la casilla inicio (estaba intentando desde otra). Otro error posible desde el servidor es 404 Not Found cuando el jugador no fue encontrado.
    Este endpoint se usa en Board.jsx en la función moverDesdeInicio().  El botón "Avanzar desde inicio (0 → 1)" solo aparece si la partida está en_juego, es el turno de ese jugador y se encuentra en la posición 0. Al hacer click en este, el frontend llama a `PATCH /judaores/:id`, actualiza el tablero y muestra un toast tipo: "El jugador avanzó desde el inicio a la casilla 1. Puede comenzar su primer minijuego. Ahora juega {nombreJugador}".

    - `POST /jugadas` - Ejecutar jugada (minijuego o fortuna)
    Este endpoint concentra la lógica principal de juego en el tablero, ya que permite jugar un minijuego o activar una casilla de fortuna, actualizando la posición del jugador, el estado de la partida y el turno. Recibe una acción de juego y actualiza el estado según el tipo de casilla donde está el jugador. Si el jugador esta en una casilla tipo "minijuego", recibe la acción de juego "jugar_minijuego" y, como aún no están implementados los minijuegos en sí mismos, simula ganar o perder. Si gana avanza una casilla, y si ya está en la última finaliza la partida. Si pierde se queda en la misma posición. Si el jugador en cambio está en una casilla de tipo "fortuna" y realiza la acción de juego "obtener_fortuna", este endpoint sortea una carta de fortuna desde la tabla Fortunas y aplica uno de los efectos posibles, entre estos, bonus_tiempo, que ajusta el tiempo disponible y avanza, avance_automático, que salta a una casilla más adelante, reduccion_tiempo, que reduce tiempo disponible y avanza y retroceso, que retrocede en el tablero 1 casilla. Además, valida que la partida esté en_juego, que sea el turno del jugador, cambia el turno al siguiente jugador según orden_turno y puede marcar la partida como finalizada y definir gaandor_jugador_id. El request body es tipo:
    {
        "jugadorId": 5,
        "partidaId": 12,
        "accion": "jugar_minijuego"
    }
    Donde acción puede ser las dos mencionadas anteriormente (jugar_minijuego u obtener_fortuna). La respuesta del servidor puede ser 200 OK con un body tipo:
    {
        "resultado": "gano",
        "mensaje": "El jugador gano el minijuego y avanza una casilla. Ahora es el turno del jugador con ID 7.",
        "nuevo_estado": {
            "jugador": {
            "id": 5,
            "posicion_actual": 3,
            "bonus_tiempo": 0
            },
            "partida": {
                "id": 12,
                "estado": "en_juego",
                "ganador_jugador_id": null
            }
        }
    }
    Otros valores posible de "resultado" son "perdio", si esque pierde el minijuego, "fortuna aplicada" cuando se ejecuta una carta de fortuna, "sin_accion" si la acción no corresponde a la casilla actual. Si el jugador llega al final del juego, el body de respuesta es tipo:
    {
        "resultado": "gano",
        "mensaje": "¡El jugador ha llegado al final y gano la partida!",
        "nuevo_estado": {
            "jugador": {
                "id": 5,
                "posicion_actual": 5,
                "bonus_tiempo": 0
            },
            "partida": {
                "id": 12,
                "estado": "finalizada",
                "ganador_jugador_id": 5
            }
        }
    }
    Otros códigos que puede retornar el servidor son de errores, por ejemplo 400 Bad Request cuando el jugador o la partida no fue encontrada, si la partida no esta activa, o no es el turno de este jugador, la casilla actual no fue encontrada o la accion no corresponde con la casilla actual. Nuvamente, todos estos errores solo son posibles de POSTMAN, ya que en el frontend no le pueden ocurrir al usuario.
    Este endpoint se integra en el frontend en Borad.jsx, en la función jugar(accion). El botón "jugar minijuego" llama a jugar("jugar_minijuego") y el botón "Tomar fortuna" llama a jugar("obtener_fortuna"). Luego de esto el frontend interpreta el resultado y muestra el toast "Ganaste el minijuego y avanzas una casilla. Ahora juega {otroJugador}" o "Perdiste el minijuego, no avanzas. Ahora juega {otroJugador}" o, en caso de estar en una fortuna, un toast posible es "El jugador retrocede 1 casillas. Ahora juega {otroJugador}". Si la partida terminó, muestra un toast indicando quien ganó.

- **Autenticación**: Se utiliza JWT para restringir el acceso a ciertas rutas según el tipo de usuario.
- **Roles y Rutas Protegidas**: Los usuarios tienen roles de "jugador" y "administrador", con rutas protegidas para cada uno.


### Uso de WebSockets
- Eventos para la comunicación en tiempo real entre jugadores.
- Flujo de eventos para actualizaciones de estado del juego.

## Qué falta por desarrollar
Para la próxima entrega, se deben desarrollar el frontend de cada minijuego, el cual consiste en una  "cocina" donde cada jugador puede armar los pedidos, dependiendo del país, pero siempre con 6 ingredientes disponibles. Los mock up pueden verse en el [siguinte link](https://www.canva.com/design/DAG4g9GoOa4/wugT0koDO8aOaP3zfxkVwQ/edit?utm_content=DAG4g9GoOa4&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)

