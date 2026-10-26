# Crey • Juego 2 — Lenguaje: Laberinto de Recolección

> **Ecosistema Interactivo de Aprendizaje y Gamificación en Comunicación y Lenguaje, Monitoreo Docente en Tiempo Real vía WebSockets y Motor de Laberintos en GDevelop 5.**

[![Node.js](https://img.shields.io/badge/Node.js-18.0+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![WebSockets](https://img.shields.io/badge/WebSockets-ws_8.21-010101?logo=socketdotio&logoColor=white)](https://github.com/websockets/ws)
[![GDevelop 5](https://img.shields.io/badge/GDevelop-5.4-4D148C?logo=gdevelop&logoColor=white)](https://gdevelop.io/)
[![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas_2D-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/)
[![Licencia](https://img.shields.io/badge/Licencia-Proprietary-slate)](LICENSE)

---

## Descripción del Proyecto

**Crey — Juego 2 (Lenguaje: Laberinto de Recolección)** es un videojuego educativo interactivo concebido para transformar la enseñanza de la gramática, ortografía y comprensión lectora en una experiencia lúdica, inmersiva y medible en tiempo real.

El proyecto aborda la falta de motivación y el bajo nivel de retención en ejercicios tradicionales de lenguaje, reemplazando las fichas repetitivas por un entorno de exploración espacial en vista cenital (*Top-Down*). En él, los estudiantes controlan al personaje **Crey**, navegando por senderos temáticos donde deben aplicar razonamiento lingüístico activo para recolectar términos válidos, sortear bifurcaciones clasificatorias y completar estructuras oracionales.

La solución integra una arquitectura híbrida de doble extremo:
1. **Cliente del Alumno:** Interfaz de juego responsiva con controles táctiles o por teclado, animaciones fluidas y retroalimentación audiovisual inmediata.
2. **Consola Docente Sincrónica:** Panel de supervisión en vivo conectado mediante **WebSockets** que permite al educador crear aulas con códigos PIN, monitorear el progreso de cada alumno en tiempo real y exportar reportes analíticos de desempeño para la toma de decisiones pedagógicas.

---

## Capacidades y Módulos Principales

### 1. Motor de Exploración y Movimiento Cenital (Top-Down 4D Engine)
* **Desplazamiento Omnidireccional:** Movimiento fluido en 4 direcciones (*Arriba, Abajo, Izquierda, Derecha*) mediante teclado (`Flechas` / `WASD`) o control D-Pad táctil integrado para pantallas móviles y tabletas.
* **Físicas y Colisiones de Laberinto:** Detección de muros, senderos delimitados y desaceleración por inercia para una navegación ergonómica y precisa.
* **Efectos de Partículas y Animación Procedural:** Sistema de feedback visual con destellos de acierto, vibración de impacto ante errores y estelas de movimiento.

### 2. Trilogía de Mecánicas Pedagógicas de Lenguaje
* **Mecánica A — Recolección de Palabras:**
  * Crey recorre el laberinto recolectando únicamente los términos que satisfacen la consigna activa (ej. sustantivos como *Árbol*, *Casa*, *Perro*; o adjetivos como *Bonito*, *Grande*, *Feliz*).
  * Los distractores (ej. verbos o adverbios infiltrados) penalizan al jugador con pérdida de energía al ser tocados.
* **Mecánica B — Clasificación por Puertas Bifurcadas:**
  * El camino se divide en dos portales rotulados con categorías lingüísticas (*Sustantivo* vs. *Verbo*, *Sinónimo* vs. *Antónimo*, etc.).
  * Una consigna flotante proyecta una palabra (ej. *"Caminar"* o *"Hermoso"*); el alumno debe cruzar la puerta correcta para abrir el sendero.
* **Mecánica C — Completación de Oraciones:**
  * Crey encuentra oraciones incompletas flotando sobre el sendero (ej. *"La flor es muy ______."*).
  * En el suelo se disponen losas interactivas con alternativas gramaticales; seleccionar la opción sintáctica correcta desbloquea el portal hacia la siguiente zona.

### 3. Consola del Docente y Telemetría Sincrónica
* **Gestión de Sesiones por Código PIN:** El docente inicializa la sesión de clase generando un código de acceso único (ej. `LENG50`) sin requerir registros complejos de usuarios.
* **Transmisión de Eventos en Tiempo Real (WebSockets):** Cada acierto, fallo, consumo de vida y cambio de zona del estudiante es transmitido de forma instantánea al panel central.
* **Detección Automática de Dificultades:** El sistema calcula el "Tema Crítico" de cada estudiante, identificando en qué categoría gramatical presenta mayor porcentaje de error.

### 4. Sistema de Resistencia, Vidas y Gamificación
* **Control de Vitalidad:** Sistema de 3 vidas representadas mediante orbes de energía luminosa.
* **Batería de Respiro (Vida Extra):** Ítem colocado estratégicamente una vez por zona que regenera la salud del personaje (+1 ❤️) o recompensa con bonificación de puntaje (+150 pts) si el alumno conserva todas sus vidas.
* **Resumen Diagnóstico al Cierre:** Al finalizar la partida (por victoria o Game Over), se despliega un reporte individual detallando aciertos y fallos desglosados por categoría evaluada.

### 5. Analítica de Aprendizaje y Exportación de Informes
* **Podio de Rendimiento:** Clasificación dinámica con medallas de oro 🥇, plata 🥈 y bronce 🥉 según puntaje y tiempo de resolución.
* **Exportación de Informes en CSV / Excel:** Generación de matrices de datos con codificación UTF-8 compatible con acentos y caracteres del español, lista para ser procesada en hojas de cálculo.

---

## Stack Tecnológico

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Servidor Backend** | Node.js (v18+) + Express 5.2 | Servidor de archivos estáticos y API REST de contenidos pedagógicos |
| **Tiempo Real** | WebSockets (`ws` 8.21) | Protocolo dúplex para sincronización instantánea entre alumnos y panel docente |
| **Motor de Juego Web** | HTML5 Canvas 2D + JavaScript Moderno | Renderizado de laberintos, físicas Top-Down y lógica de colisiones client-side |
| **Motor de Juego Nativo** | GDevelop 5.4 | Implementación oficial del juego con arquitectura de eventos y escenas compilables |
| **Estilos & UI** | CSS3 Grid / Flexbox + Glassmorphism | Diseño futurista responsivo de alta resolución adaptable a móvil, tablet y PC |
| **Motor de Audio** | Web Audio API | Sintetizador retro de 8 bits procedimental sin dependencia de archivos pesados |

---

## Instalación y Puesta en Marcha (NPM)

### Prerrequisitos
* **Node.js**: Versión 18.0.0 o superior instalada ([Descargar Node.js](https://nodejs.org/)).
* **NPM**: Gestor de paquetes incluido con Node.js (`npm -v`).
* **Navegador Web**: Google Chrome, Mozilla Firefox, Safari o Microsoft Edge actualizados.

### Paso a Paso

1. **Clonar o situarse en el repositorio:**
   ```bash
   git clone https://github.com/Crearcos/VideoJuego-2.git
   cd "VideoJuego 2"
   ```

2. **Instalar dependencias del proyecto:**
   ```bash
   npm install
   ```

3. **Ejecutar el servidor local:**
   * **En Windows (Acceso Rápido):** Haz doble clic en el archivo `iniciar_servidor.bat`.
   * **O por terminal:**
     ```bash
     npm start
     ```
   > El servidor se iniciará en `http://localhost:3000` (con soporte para acceso en red local Wi-Fi).

4. **Direcciones de Acceso en el Navegador:**
   * **Portal de Inicio:** [http://localhost:3000](http://localhost:3000)
   * **Juego del Alumno:** [http://localhost:3000/game2-language/](http://localhost:3000/game2-language/)
   * **Panel del Docente:** [http://localhost:3000/teacher/](http://localhost:3000/teacher/)

---

## Demostración Multijugador Sincrónica (Paso a Paso)

Para experimentar la telemetría docente en tiempo real:

1. Abre una pestaña del navegador e ingresa al **Panel del Profesor** ([http://localhost:3000/teacher/](http://localhost:3000/teacher/)).
2. Configura el aula (ej. *"5to Grado — Lenguaje"*), haz clic en el botón verde de inicio y copia el **código PIN** generado (ej. `LENG50`).
3. En una o dos pestañas separadas (o en modo incógnito), abre el **Juego del Alumno** ([http://localhost:3000/game2-language/](http://localhost:3000/game2-language/)), escribe nombres de estudiantes (ej. *Mateo*, *Lucía*) e ingresa el código PIN.
4. Juega interactuando con los sustantivos y las puertas del laberinto: observa cómo el panel del docente registra las vidas, aciertos, errores y temas críticos de cada estudiante **en vivo al milisegundo**.

---

## Cómo Abrir el Proyecto en GDevelop 5

El proyecto incluye la versión nativa desarrollada para el motor **GDevelop 5**:

1. Abre la aplicación de escritorio de **GDevelop 5** o accede al editor web en [editor.gdevelop.io](https://editor.gdevelop.io).
2. Haz clic en **"Abrir un proyecto"** (*Open a project*).
3. Selecciona el archivo de definición del juego ubicado en:
   ```text
   VideoJuego 2/gdevelop-project/game.json
   ```
4. Encontrarás las escenas totalmente estructuradas:
   * **`Zona1_SustantivosVerbos`**: Fondo de jardín temático, entidad Crey con comportamiento *TopDownMovement*, textos interactivos de sustantivos, puertas de clasificación y portal de transición.
   * **`Zona2_OracionesAdjetivos`**: Fondo de comprensión de oraciones, Crey, oraciones flotantes, losas interactivas de adjetivos y portal de victoria.
   * **Variables de Escena y Globales:** Control de vidas, puntajes, telemetría y contadores de error por categoría.

---

## Estructura del Proyecto

```text
VideoJuego 2/
├── package.json                  # Definición de dependencias (Express, WebSockets) y scripts
├── server.js                     # Servidor Node.js con API REST y broker de WebSockets
├── iniciar_servidor.bat          # Lanzador directo en 1 clic para entornos Windows
├── .gitignore                    # Exclusiones para control de versiones (node_modules, logs)
├── README.md                     # Documentación técnica integral del proyecto
├── Imagenes/                     # Fondos de laberintos y subm проектos temáticos en alta resolución
│   ├── Mapa educativo de jardín y aprendizaje.png
│   ├── SUBMUNDO 1 — ORTOGRAFÍA.png
│   ├── SUBMUNDO 2 — SUSTANTIVOS Y VERBOS.png
│   ├── SUBMUNDO 3 — SINÓNIMOS Y ANTÓNIMOS.png
│   └── SUBMUNDO 4 — COMPRENSIÓN DE ORACIONES.png
├── gdevelop-project/             # Proyecto oficial para el motor GDevelop 5
│   ├── game.json                 # Escenas, sprites, comportamientos Top-Down y eventos
│   └── assets/                   # Recursos visuales vinculados al editor
└── public/                       # Aplicaciones Web Client-Side
    ├── index.html                # Portal principal de bienvenida y selección de rol
    ├── common/
    │   └── audio.js              # Sintetizador retro procedural (Web Audio API)
    ├── teacher/                  # Consola del Docente en Tiempo Real
    │   ├── index.html            # Vistas de configuración, banco de palabras, monitor en vivo y podio
    │   ├── teacher.css           # Estilos de consola ejecutiva docente
    │   └── teacher.js            # Lógica de conexión WebSocket, tabla dinámica y exportación CSV
    └── game2-language/           # Cliente de Videojuego del Estudiante
        ├── index.html            # Canvas del juego, HUD de vidas y modales interactivos
        ├── style.css             # Estilos responsivos, efectos visuales y D-pad táctil
        └── game.js               # Motor de laberinto, físicas 4D, colisiones y telemetría
```

---

## Perfiles de Usuario para Demostración

La plataforma distingue dos roles operativos para evaluación completa:

* **Estudiante / Jugador:** 
  * Acceso rápido con nombre y código PIN sin fricción de credenciales.
  * Exploración inmersiva del laberinto en vista cenital.
  * Resolución de desafíos de lenguaje con retroalimentación correctiva inmediata.
* **Docente / Evaluador:**
  * Configuración y administración de salas de evaluación temática.
  * Supervisión en tiempo real de métricas grupales e individuales.
  * Detección preventiva de temas críticos y exportación de informes analíticos para refuerzo pedagógico.

---

## Licencia y Créditos

Desarrollado para **Crearcos** • Ecuador  
Todos los derechos reservados © 2026.
