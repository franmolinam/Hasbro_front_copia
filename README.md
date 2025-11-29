# Chef Around the World - E3

## Integrantes 
- Francisca Molina
- Antonia Oyonarte
- Amanda Wood

Para acceder al proyecto apreta [este link](https://chefaround.netlify.app/).

Para construir el entorno de desarrollo del frontend, es necesario correr yarn install en la terminal del repositorio del frontend. Con este comando se descarga e instala todas las librerías necesarias para que el frontend funcione: react, vite y el resto de las dependencias definidas en package.json.

Además, así como en el backend es necesario crear el .env especificado en el ReadMe del backend, aquí es necesario crear un .env con la línea: VITE_API_URL=https://hasbro-back-252s2.onrender.com

Para levantar la interfaz de la aplicación y conectarse a la API, es necesario correr yarn dev en la terminal del backend y luego, una vez que está corriendo el backend, en la terminal del frontend correr primero nvm use 20 (es necesaria esta versión de node) y luego yarn dev y se levantará la interfaz conectada al render de la base de datos. yarn dev arranca el servidor de desarrollo de Vite y compila el código de React para que los cambios se vean al instante.

## Descripción General del Juego
"Chef Around the World" es un juego web multijugador donde 2 a 4 usuarios compiten por convertirse en el Mejor Chef del Mundo. 
Cada partida comienza en un tablero de 6 casillas que representa una ruta culinaria internacional. En cada país, los jugadores deben completar minijuegos de cocina, preparando platos típicos arrastrando los ingredientes correctos antes de que se acabe el tiempo. Además, a medida que se avanza en el tablero se va enfrentando una mayor dificultad en los minijuegos.
El primer jugador en completar toda la ruta gastronómica y superar con éxito el minijuego final gana la partida.

## Estructura del Proyecto
- **Frontend**: `Hasbro_front_252s2` - Desarrollado con React + Vite.
- **Backend**: `Hasbro_back_252s2` - Desarrollado con Node.js (Koa) y PostgreSQL.

## Reglas del Juego
- Turnos: Los jugadores avanzan por turnos definidos aleatoriamente al inicio de la partida.
- Movimiento en el tablero: En la primera jugada, un jugador avanza automáticamente a la casilla 1. Luego, cada jugador avanza al completar su minijuego correspondiente.
- Minijuegos por país: Cada casilla del tablero representa un país. En su turno, el jugador debe completar una cantidad de pedidos correspondientes a la comida típica de ese país, utilizando los ingredientes correctos arrastrados con el mouse. Si se equivoca de ingredientes al entregar el pedido, se le descuentan 5 segundos de su tiempo y se le borra lo armado, teniendo que intentar armar de nuevo el pedido correctamente. Si se le acaba el tiempo sin haber completado correctamente la cantidad de pedidos coresspondientes al país, perderá el minijuego y se quedará en esa casilla.
- Casilla de fortuna: Una de las casillas corresponde a una fortuna. En esta se puede quitar o dar tiempo extra para el siguiente minijuego, hacer avanzar al jugador o retrocederlo en el tablero.
- Condiciones para ganar: El primer jugador en superar el minijuego del último país gana la partida.
- Roles en la partida: El jugador que crea la partida es el anfitrión, y es el único que puede iniciarla. Los demás jugadores pueden unirse mediante el código de la partida o de forma aleatoria.
- Desconexiones: Si un jugador queda inactivo, se marca como tal y no puede seguir participando.

## Cambios Relevantes Respecto a Entregas Anteriores
Se implementaron los minijuegos y el fin de las partidas. En cada país al apretar "jugar minijuego" se despliega la vista del minijuego con los ingredientes y pedidos correspondientes a ese país. A la izquierda se ven los ingredientes del pedido que toca (abajo sale un texto con la cantidad de pedidos que debe completar y en cual se encuentra actualmente), al medio se ven los ingredientes disponibles y a la derecha un sector donde arrastrar los ingredientes para preparar el pedido. Luego de ubicar todos los ingredientes correspondientes se presiona el botón "Entregar" y si el pedido es correcto aparece una imágen del pedido armado, un mensaje de "Pedido Ok" y se pasa al siguiente pedido. Si es el último se sale de la vista de minijuego ya que lo ganó y se acabo su turno. Si se equivoca aparece arriba en rojo, justo debajo del tiempo, un descuento de 5 segundos y se borra los ingredientes arrastrados. Si se acaba el tiempo y no completó la cantidad de pedidos bien, se sale la vista, el jugador se mantiene en su casilla y se acaba su turno. Además, si al arrastrar los ingredientes se equivocó en alguno, se puede arrastrar hacia afuera del cuadrado y se elimina el ingrediente sin problemas. Una vez que algún jugador completa correctamente el minijuego final les aparece un mensaje a los jugadores con el resultado de la partida. Para el ganador es un mensaje de triunfo, para el resto uno de derrota.

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

    - **Otros Endpoints conectados e implementados**:
    - `POST /auth/login` — Autenticación (login). Usado en `src/api/auth.js`.
    - `POST /auth/signup` — Registro de usuario. Usado en `src/api/auth.js`.
    - `GET /jugadores?usuarioId={usuarioId}&inactivo=false&includePartida=true` — Obtener jugadores del usuario con partidas incluidas (lista de partidas activas del usuario). Usado en `src/game/Lobby.jsx` en `fetchMisPartidasActivas()`.
    - `GET /partidas/:id` — Obtener detalles de una partida. Usado en `src/game/Lobby.jsx` y `src/game/Board.jsx` para mostrar estado y tablero.
    - `POST /partidas` — Crear nueva partida. Usado en `src/game/Lobby.jsx` (`crearPartida`) — body esperado: `{ anfitrion_usuario_id, avatar_elegido }`.
    - `POST /partidas/:codigo/unirse` — Unirse por código. Usado en `src/game/Lobby.jsx` (`unirsePorCodigo`) — body: `{ usuarioId, avatar_elegido }`.
    - `POST /partidas/unirse-random` — Unirse a una partida aleatoria. Usado en `src/game/Lobby.jsx` (`unirseAleatoria`) — body: `{ usuarioId, avatar_elegido }`.
    - `GET /jugadores?partidaId={partidaId}` — Obtener todos los jugadores de una partida. Usado en `src/game/Board.jsx` (carga inicial de jugadores en `fetchDatos`).
    - `GET /usuarios/:id` — Obtener información de usuario (nombre, avatar). Usado en `src/game/Board.jsx` cuando se muestran iniciales/nombre de jugadores.
    - `PATCH /partidas/:id/iniciar` — Iniciar una partida (acción del anfitrión). Usado en `src/game/Board.jsx` (botón "Iniciar partida").
    - `PATCH /jugadores/:id` — Actualizar jugador (ej. avanzar desde inicio). Usado en `src/game/Board.jsx` en `moverDesdeInicio()` para avanzar al jugador de la casilla 0 a 1.
    
    - **Implementado en esta entrega para el desarrollo de los minijuegos**:
    - `GET /casillas/por_partida/:partidaId/pos/:pos` — Obtener casilla por posición dentro de una partida. Usado en `src/game/Board.jsx` cuando se consultan casillas específicas por posición.
    
        Ejemplo de respuesta (200 OK):

        ```json
        {
            "id": 7,
            "tipo": "minijuego",
            "tableroId": 4,
            "posicion_en_tablero": 2,
            "minijuegoId": 3,
            "paisId": 2,
            "img": "/imagenes/italia/casilla_2.png"
        }
        ```
    
    - `GET /minijuegos/:id` — Obtener minijuego por id; devuelve el minijuego con su país asociado y los pedidos (ingredientes solicitados). Usado cuando se necesita cargar los datos del minijuego antes de iniciar la vista del minijuego.
    
                Ejemplo de respuesta (200 OK):

                ```json
                {
                    "id": 3,
                    "nombre": "Pizza Margherita",
                    "pais": { "id": 2, "nombre": "Italia" },
                    "pedidos": [
                        { "id": 10, "nombre": "Pizza Margarita", "ingredientes": ["masa", "tomate", "queso"], "img": "/imagenes/italia/pedido_1.png" },
                        { "id": 11, "nombre": "Pizza Prosciutto", "ingredientes": ["masa", "tomate", "queso", "jamon"], "img": "/imagenes/italia/pedido_2.png" }
                    ]
                }
                ```


- **Autenticación**: Se utiliza JWT para restringir el acceso a ciertas rutas según el tipo de usuario. Sólo usuarios registrados pueden entrar a vista bienvenida usuario, lobby de partidas y tablero de partidas. Rutas especificas en Readme de backend.

- **Roles y Rutas Protegidas**: Los usuarios tienen roles de "jugador" y "administrador", con rutas protegidas para cada uno. Explicación de cada uno en "Guía de uso" y de JWT en readme del backend.

## Guía de uso
### Nivel Usuario (Jugadores)
- Un usuario no registrado solo puede acceder a la página de inicio, página de instrucciones y página de nosotras. 
- Para poder jugar el usuario tiene que crear una cuenta mediante la página de registro. Es importante que la contraseña tenga una letra, un número y un caracter especial para poder crearse bien la cuenta. Luego de esto, se debe iniciar sesión con la cuenta creada, y lo redirigirá al perfil de bienvenida del usuario. Una vez ahí, se puede acceder a cualquier sección desde la barra de navegación (home, instrucciones, nosotras, logout) y se puede ir al lobby de partidas del usuario con el botón "Ir al lobby de partidas" abajo en la vista. Desde el lobby se puede crear una partida nueva, unirse por código a una existente o unirse a una partida aleatoria. También hay un botón para volver a la página de bienvenida del usuario. Además, se presenta una lista de partidas activas (si es que se tiene) con su código, estado, indicación de tipo de jugador (normal o anfitrión) y avatar. Si se entra de cualquier forma a una partida, lo primero que ofrece es escoger el avatar para su jugador.
- El jugador host de la partida es el único que puede iniciarla (solo a él le aparece el botón de "iniciar partida" en la vista del tablero). Luego en la partida ambos (jugador normal y host) pueden realizar las mismas cosas como jugar minijuegos y obtener fortunas.
- El administrador no tiene interfaz gráfica. Sus acciones se ejecutan únicamente vía API (Postman). El permiso especial del administrador es que puede resetear la base de datos con el endpoint `POST /admin/reset-db`. Es una ruta que permite reiniciar completamente la base de datos, eliminando usuarios, partidas, jugadas, etc. Si es que se está corriendo en local es necesario volver a ejecutar las seeds. Es protegida solo para el tipo admin y requiere un token de administrador.


### Uso de WebSockets
Se encuentra documentada la implementación y eventos gestionados a través de WebSockets en el Readme del backend.

