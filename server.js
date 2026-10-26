const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-Memory Storage for Active Rooms
const rooms = new Map();

// Default Curriculum Content according to Brief
const defaultCurriculum = {
  zones: [
    {
      id: "zone1",
      name: "Submundo 2 — Sustantivos y Verbos",
      background: "assets/backgrounds/submundo2_sustantivos_verbos.png",
      challenges: [
        {
          id: "z1_c1",
          type: "recoleccion",
          topic: "Sustantivos",
          instruction: "Recoge todos los sustantivos y evita los verbos y adjetivos.",
          items: [
            { text: "Árbol", correct: true, x: 220, y: 260 },
            { text: "Casa", correct: true, x: 380, y: 190 },
            { text: "Perro", correct: true, x: 190, y: 440 },
            { text: "Correr", correct: false, x: 800, y: 750 },
            { text: "Feliz", correct: false, x: 1100, y: 350 },
            { text: "Saltar", correct: false, x: 600, y: 420 }
          ]
        },
        {
          id: "z1_c2",
          type: "clasificar",
          topic: "Sustantivo / Verbo",
          instruction: "Clasifica la palabra entrando por la puerta correcta.",
          word: "Caminar",
          doors: [
            { label: "Sustantivo", correct: false, x: 420, y: 150 },
            { label: "Verbo", correct: true, x: 980, y: 150 }
          ]
        }
      ],
      extraLife: { x: 920, y: 680 }
    },
    {
      id: "zone2",
      name: "Submundo 4 — Comprensión de Oraciones y Adjetivos",
      background: "assets/backgrounds/submundo4_comprension_oraciones.png",
      challenges: [
        {
          id: "z2_c1",
          type: "completar",
          topic: "Comprensión de Oraciones",
          instruction: "Completa la oración pasando sobre la palabra correcta.",
          sentence: "La flor es muy ______.",
          options: [
            { text: "hermosa", correct: true, x: 450, y: 550 },
            { text: "jardín", correct: false, x: 700, y: 550 },
            { text: "correr", correct: false, x: 950, y: 550 }
          ]
        },
        {
          id: "z2_c2",
          type: "recoleccion",
          topic: "Adjetivos",
          instruction: "Recoge todos los adjetivos y evita los distractores.",
          items: [
            { text: "Bonito", correct: true, x: 250, y: 300 },
            { text: "Grande", correct: true, x: 320, y: 650 },
            { text: "Feliz", correct: true, x: 1050, y: 300 },
            { text: "Perro", correct: false, x: 700, y: 720 },
            { text: "Correr", correct: false, x: 600, y: 220 },
            { text: "Casa", correct: false, x: 1100, y: 650 }
          ]
        }
      ],
      extraLife: { x: 260, y: 780 }
    }
  ],
  extraTopics: [
    {
      id: "sinonimos_recoleccion",
      type: "recoleccion",
      topic: "Sinónimos",
      instruction: "Recoge los sinónimos de 'rápido'.",
      items: [
        { text: "Veloz", correct: true },
        { text: "Ligero", correct: true },
        { text: "Lento", correct: false },
        { text: "Pequeño", correct: false }
      ]
    },
    {
      id: "clasificar_adjetivo_sustantivo",
      type: "clasificar",
      topic: "Adjetivo / Sustantivo",
      word: "Hermoso",
      doors: [
        { label: "Adjetivo", correct: true },
        { label: "Sustantivo", correct: false }
      ]
    },
    {
      id: "clasificar_sinonimo_antonimo",
      type: "clasificar",
      topic: "Sinónimo / Antónimo",
      word: "Respecto a 'Feliz': Triste",
      doors: [
        { label: "Sinónimo", correct: false },
        { label: "Antónimo", correct: true }
      ]
    },
    {
      id: "completar_articulos",
      type: "completar",
      topic: "Artículos",
      sentence: "______ gato duerme.",
      options: [
        { text: "El", correct: true },
        { text: "Los", correct: false },
        { text: "Una", correct: false }
      ]
    },
    {
      id: "completar_pronombres",
      type: "completar",
      topic: "Pronombres",
      sentence: "______ juega fútbol.",
      options: [
        { text: "Él", correct: true },
        { text: "Casa", correct: false },
        { text: "Bonito", correct: false }
      ]
    }
  ]
};

// API Endpoints
app.get('/api/default-content', (req, res) => {
  res.json({ success: true, curriculum: defaultCurriculum });
});

app.get('/api/session/:code', (req, res) => {
  const code = (req.params.code || '').toUpperCase().trim();
  const room = rooms.get(code);
  if (room) {
    res.json({
      success: true,
      roomCode: code,
      sessionName: room.sessionName,
      status: room.status,
      curriculum: room.curriculum
    });
  } else {
    res.status(404).json({ success: false, error: 'Código de sesión no válido o finalizado.' });
  }
});

// WebSocket Protocol
wss.on('connection', (ws) => {
  let currentRoomCode = null;
  let currentRole = null; // 'teacher' or 'student'
  let studentName = null;

  ws.on('message', (messageRaw) => {
    try {
      const data = JSON.parse(messageRaw);

      switch (data.type) {
        case 'CREATE_ROOM': {
          const { sessionName, roomCode, curriculum } = data;
          const code = (roomCode || Math.random().toString(36).substring(2, 8)).toUpperCase();

          rooms.set(code, {
            game: 'language',
            sessionName: sessionName || `Clase Lenguaje ${code}`,
            createdAt: new Date().toISOString(),
            status: 'active',
            curriculum: curriculum || defaultCurriculum,
            teacherWs: ws,
            students: {}
          });

          currentRoomCode = code;
          currentRole = 'teacher';

          ws.send(JSON.stringify({
            type: 'ROOM_CREATED',
            roomCode: code,
            sessionName: rooms.get(code).sessionName,
            curriculum: rooms.get(code).curriculum
          }));
          break;
        }

        case 'JOIN_ROOM': {
          const { roomCode, name } = data;
          const code = (roomCode || '').toUpperCase().trim();
          const room = rooms.get(code);

          if (!room || room.status !== 'active') {
            ws.send(JSON.stringify({
              type: 'ERROR',
              message: 'La sesión no existe o ya ha sido finalizada.'
            }));
            return;
          }

          currentRoomCode = code;
          currentRole = 'student';
          studentName = (name || 'Estudiante').trim();

          // Initialize student telemetry
          if (!room.students[studentName]) {
            room.students[studentName] = {
              name: studentName,
              lives: 3,
              score: 0,
              currentZone: 1,
              completedZones: [],
              connected: true,
              finished: false,
              topicStats: {}, // { [topic]: { correct: 0, errors: 0 } }
              worstTopic: 'Ninguno',
              lastUpdate: Date.now()
            };
          } else {
            room.students[studentName].connected = true;
          }

          // Confirm join to student
          ws.send(JSON.stringify({
            type: 'JOINED_SUCCESS',
            roomCode: code,
            sessionName: room.sessionName,
            curriculum: room.curriculum,
            initialState: room.students[studentName]
          }));

          // Notify teacher
          notifyTeacher(code);
          break;
        }

        case 'STUDENT_EVENT': {
          if (currentRole !== 'student' || !currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;

          const { event } = data;
          const st = room.students[studentName];
          if (!st) return;

          // Process student game telemetry
          if (typeof event.score === 'number') st.score = event.score;
          if (typeof event.lives === 'number') st.lives = Math.max(0, event.lives);
          if (typeof event.currentZone === 'number') st.currentZone = event.currentZone;
          if (Array.isArray(event.completedZones)) st.completedZones = event.completedZones;
          if (event.finished) st.finished = true;

          // Track topic accuracy
          if (event.topic) {
            if (!st.topicStats[event.topic]) {
              st.topicStats[event.topic] = { correct: 0, errors: 0 };
            }
            if (event.isCorrect === true) {
              st.topicStats[event.topic].correct += 1;
            } else if (event.isCorrect === false) {
              st.topicStats[event.topic].errors += 1;
            }

            // Calculate worst topic for this student
            let maxErrors = 0;
            let worst = 'Ninguno';
            for (const [tName, stats] of Object.entries(st.topicStats)) {
              if (stats.errors > maxErrors) {
                maxErrors = stats.errors;
                worst = `${tName} (${stats.errors} fallos)`;
              }
            }
            st.worstTopic = worst;
          }

          st.lastUpdate = Date.now();
          notifyTeacher(currentRoomCode);
          break;
        }

        case 'UPDATE_CURRICULUM': {
          if (currentRole !== 'teacher' || !currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (room && data.curriculum) {
            room.curriculum = data.curriculum;
            // Broadcast updated content to all connected students in room
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'CURRICULUM_UPDATED',
                  curriculum: room.curriculum
                }));
              }
            });
          }
          break;
        }

        case 'END_ROOM': {
          if (currentRole !== 'teacher' || !currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (room) {
            room.status = 'closed';
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'ROOM_CLOSED' }));
              }
            });
            rooms.delete(currentRoomCode);
          }
          break;
        }
      }
    } catch (e) {
      console.error('Error procesando mensaje WebSocket:', e);
    }
  });

  ws.on('close', () => {
    if (currentRole === 'student' && currentRoomCode && studentName) {
      const room = rooms.get(currentRoomCode);
      if (room && room.students[studentName]) {
        room.students[studentName].connected = false;
        notifyTeacher(currentRoomCode);
      }
    }
  });

  function notifyTeacher(roomCode) {
    const room = rooms.get(roomCode);
    if (!room || !room.teacherWs || room.teacherWs.readyState !== WebSocket.OPEN) return;

    const studentList = Object.values(room.students);
    room.teacherWs.send(JSON.stringify({
      type: 'ROOM_UPDATE',
      roomCode: roomCode,
      sessionName: room.sessionName,
      status: room.status,
      students: studentList,
      summary: computeSummary(studentList)
    }));
  }

  function computeSummary(students) {
    if (!students || students.length === 0) {
      return { total: 0, active: 0, avgScore: 0, worstGlobalTopic: 'N/A' };
    }

    const activeCount = students.filter(s => s.connected).length;
    const totalScore = students.reduce((acc, s) => acc + s.score, 0);
    const avgScore = Math.round(totalScore / students.length);

    const topicErrorMap = {};
    students.forEach(s => {
      Object.entries(s.topicStats || {}).forEach(([topic, stats]) => {
        topicErrorMap[topic] = (topicErrorMap[topic] || 0) + (stats.errors || 0);
      });
    });

    let worstGlobal = 'Ninguno';
    let maxErr = 0;
    Object.entries(topicErrorMap).forEach(([top, err]) => {
      if (err > maxErr) {
        maxErr = err;
        worstGlobal = `${top} (${err} fallos)`;
      }
    });

    return {
      total: students.length,
      active: activeCount,
      avgScore: avgScore,
      worstGlobalTopic: worstGlobal
    };
  }
});

// Start Server
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Servidor Educativo Crey - Lenguaje (Laberinto) Activo`);
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 Acceso Alumno:  http://localhost:${PORT}/game2-language/`);
  console.log(`👨‍🏫 Panel Docente: http://localhost:${PORT}/teacher/`);
  console.log(`=======================================================`);
});
