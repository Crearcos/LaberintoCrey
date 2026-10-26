// Crey: Lenguaje - Laberinto de Recolección
// Game Engine & Telemetry Sync

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// State Variables
let gameState = 'LOGIN'; // 'LOGIN', 'PLAYING', 'TRANSITION', 'GAMEOVER', 'VICTORY'
let studentName = 'Explorador Crey';
let roomCode = null;
let socket = null;
let currentZoneIndex = 0; // 0 = Zone 1 (Sustantivos y Verbos), 1 = Zone 2 (Comprensión y Adjetivos)

let score = 0;
let lives = 3;
let completedZones = [];
let topicStats = {
  'Sustantivos': { correct: 0, errors: 0 },
  'Sustantivo / Verbo': { correct: 0, errors: 0 },
  'Comprensión de Oraciones': { correct: 0, errors: 0 },
  'Adjetivos': { correct: 0, errors: 0 }
};

// World Dimensions
const WORLD_WIDTH = 1402;
const WORLD_HEIGHT = 1122;

// Player (Crey)
const player = {
  x: 701,
  y: 950,
  radius: 26,
  speed: 260,
  vx: 0,
  vy: 0,
  facing: 'up', // 'up', 'down', 'left', 'right'
  walkCycle: 0,
  invulnerableTime: 0
};

// Particles & Floating Feedback
let particles = [];
let floatTexts = [];

// Assets
const images = {
  crey: new Image(),
  heart: new Image(),
  vidaextra: new Image(),
  bgZone1: new Image(),
  bgZone2: new Image()
};

images.crey.src = '/assets/sprites/crey.png';
images.heart.src = '/assets/sprites/heart.png';
images.vidaextra.src = '/assets/sprites/vidaextra.png';
images.bgZone1.src = '/assets/backgrounds/submundo2_sustantivos_verbos.png';
images.bgZone2.src = '/assets/backgrounds/submundo4_comprension_oraciones.png';

// Zones Definition
const zones = [
  {
    id: 1,
    name: 'Submundo 2 — Sustantivos y Verbos',
    bg: images.bgZone1,
    spawnX: 701,
    spawnY: 960,
    instruction: 'Recoge todos los SUSTANTIVOS y clasifica la palabra en la puerta correcta.',
    // Mecánica A: Recolección
    recoleccion: {
      topic: 'Sustantivos',
      instruction: 'Recoge todos los sustantivos y evita verbos o adjetivos.',
      items: [
        { text: 'Árbol', correct: true, x: 230, y: 260, collected: false },
        { text: 'Casa', correct: true, x: 390, y: 190, collected: false },
        { text: 'Perro', correct: true, x: 200, y: 450, collected: false },
        { text: 'Correr', correct: false, x: 820, y: 780, collected: false },
        { text: 'Feliz', correct: false, x: 1120, y: 360, collected: false },
        { text: 'Saltar', correct: false, x: 600, y: 440, collected: false }
      ]
    },
    // Mecánica B: Clasificar Palabras (Puertas bifurcadas)
    clasificar: {
      topic: 'Sustantivo / Verbo',
      instruction: 'Clasifica: ¿Qué tipo de palabra es "Caminar"?',
      word: 'Caminar',
      solved: false,
      signX: 701,
      signY: 220,
      doors: [
        { label: 'Sustantivo', correct: false, x: 440, y: 140, w: 120, h: 90 },
        { label: 'Verbo', correct: true, x: 960, y: 140, w: 120, h: 90 }
      ]
    },
    // Vida Extra (1 por zona)
    extraLife: { x: 920, y: 700, collected: false },
    // Portal de Salida
    portal: { x: 701, y: 240, radius: 45, active: false }
  },
  {
    id: 2,
    name: 'Submundo 4 — Comprensión y Adjetivos',
    bg: images.bgZone2,
    spawnX: 701,
    spawnY: 960,
    instruction: 'Completa la oración y recoge todos los ADJETIVOS del jardín.',
    // Mecánica C: Completar Oración
    completar: {
      topic: 'Comprensión de Oraciones',
      instruction: 'Pisa la opción correcta para completar la oración.',
      sentence: 'La flor es muy ______.',
      solved: false,
      options: [
        { text: 'hermosa', correct: true, x: 450, y: 560, w: 120, h: 60, chosen: false },
        { text: 'jardín', correct: false, x: 701, y: 560, w: 120, h: 60, chosen: false },
        { text: 'correr', correct: false, x: 950, y: 560, w: 120, h: 60, chosen: false }
      ]
    },
    // Mecánica A: Recolección
    recoleccion: {
      topic: 'Adjetivos',
      instruction: 'Recoge todos los adjetivos y evita los distractores.',
      items: [
        { text: 'Bonito', correct: true, x: 250, y: 300, collected: false },
        { text: 'Grande', correct: true, x: 320, y: 660, collected: false },
        { text: 'Feliz', correct: true, x: 1080, y: 320, collected: false },
        { text: 'Perro', correct: false, x: 700, y: 750, collected: false },
        { text: 'Correr', correct: false, x: 580, y: 240, collected: false },
        { text: 'Casa', correct: false, x: 1120, y: 660, collected: false }
      ]
    },
    // Vida Extra (1 por zona)
    extraLife: { x: 260, y: 800, collected: false },
    // Portal de Victoria Final
    portal: { x: 701, y: 240, radius: 45, active: false }
  }
];

// Obstacle Boundaries (Hedges and Water Fountains in Garden)
const obstacles = [
  // Outer perimeter borders
  { x: 0, y: 0, w: 1402, h: 60 },
  { x: 0, y: 1070, w: 1402, h: 52 },
  { x: 0, y: 0, w: 70, h: 1122 },
  { x: 1332, y: 0, w: 70, h: 1122 },

  // Center circular fountain / book display
  { x: 570, y: 390, w: 260, h: 190 },

  // Top center building / shrine walls
  { x: 500, y: 60, w: 160, h: 120 },
  { x: 740, y: 60, w: 160, h: 120 },

  // Left middle garden hedges
  { x: 100, y: 530, w: 220, h: 180 },
  { x: 110, y: 730, w: 210, h: 180 },

  // Right middle garden hedges
  { x: 1080, y: 530, w: 220, h: 180 },
  { x: 1080, y: 730, w: 210, h: 180 }
];

// Input Handling
const keys = {};

window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
  keys[e.code] = false;
});

// Setup Touch Controls
function setupTouchControls() {
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (isTouchDevice) {
    document.getElementById('touchControls').style.display = 'block';
  }

  const bindTouch = (btnId, keyName) => {
    const el = document.getElementById(btnId);
    if (!el) return;
    el.addEventListener('touchstart', (e) => { e.preventDefault(); keys[keyName] = true; });
    el.addEventListener('touchend', (e) => { e.preventDefault(); keys[keyName] = false; });
  };

  bindTouch('btnUp', 'ArrowUp');
  bindTouch('btnDown', 'ArrowDown');
  bindTouch('btnLeft', 'ArrowLeft');
  bindTouch('btnRight', 'ArrowRight');
}

// Window Resize & Canvas Fit
function resizeCanvas() {
  const wrapper = document.getElementById('canvasWrapper');
  canvas.width = wrapper.clientWidth;
  canvas.height = wrapper.clientHeight;
}
window.addEventListener('resize', resizeCanvas);

// DOM Form & Button Handlers
document.addEventListener('DOMContentLoaded', () => {
  resizeCanvas();
  setupTouchControls();

  const loginForm = document.getElementById('loginForm');
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameVal = document.getElementById('playerNameInput').value.trim();
    const pinVal = document.getElementById('roomPinInput').value.trim().toUpperCase();

    if (nameVal) studentName = nameVal;
    if (pinVal) {
      roomCode = pinVal;
      connectToRoom(roomCode, studentName);
    }

    document.getElementById('loginModal').classList.add('hidden');
    startGame();
  });

  document.getElementById('btnContinueZone2').addEventListener('click', () => {
    document.getElementById('transitionModal').classList.add('hidden');
    loadZone(1);
    gameState = 'PLAYING';
  });

  document.getElementById('btnRetryGame').addEventListener('click', () => {
    document.getElementById('gameOverModal').classList.add('hidden');
    resetGame();
  });

  document.getElementById('btnPlayAgain').addEventListener('click', () => {
    document.getElementById('victoryModal').classList.add('hidden');
    resetGame();
  });
});

// WebSocket Connection to Teacher Panel
function connectToRoom(pin, name) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;

  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    socket.send(JSON.stringify({
      type: 'JOIN_ROOM',
      roomCode: pin,
      name: name
    }));
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'JOINED_SUCCESS') {
        document.getElementById('networkBadge').style.display = 'flex';
        document.getElementById('hudPinDisplay').textContent = pin;
      }
    } catch (e) {
      console.error('Error WebSocket:', e);
    }
  };
}

function sendTelemetry(eventData) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'STUDENT_EVENT',
      event: {
        score: score,
        lives: lives,
        currentZone: currentZoneIndex + 1,
        completedZones: completedZones,
        ...eventData
      }
    }));
  }
}

// Start & Reset Logic
function startGame() {
  score = 0;
  lives = 3;
  completedZones = [];
  loadZone(0);
  gameState = 'PLAYING';
  updateHUD();
  if (window.soundFX) window.soundFX.playRoundStart();
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  score = 0;
  lives = 3;
  completedZones = [];
  topicStats = {
    'Sustantivos': { correct: 0, errors: 0 },
    'Sustantivo / Verbo': { correct: 0, errors: 0 },
    'Comprensión de Oraciones': { correct: 0, errors: 0 },
    'Adjetivos': { correct: 0, errors: 0 }
  };
  // Reset zone items
  zones.forEach(z => {
    if (z.recoleccion) z.recoleccion.items.forEach(it => it.collected = false);
    if (z.clasificar) z.clasificar.solved = false;
    if (z.completar) {
      z.completar.solved = false;
      z.completar.options.forEach(o => o.chosen = false);
    }
    if (z.extraLife) z.extraLife.collected = false;
    if (z.portal) z.portal.active = false;
  });

  loadZone(0);
  gameState = 'PLAYING';
  updateHUD();
  if (window.soundFX) window.soundFX.playRoundStart();
}

function loadZone(index) {
  currentZoneIndex = index;
  const z = zones[index];
  player.x = z.spawnX;
  player.y = z.spawnY;
  player.vx = 0;
  player.vy = 0;

  document.getElementById('currentZoneBadge').textContent = `Zona ${index + 1}: ${z.name.split('—')[1] || z.name}`;
  document.getElementById('instructionText').textContent = z.instruction;

  const floatingBanner = document.getElementById('floatingSentenceBanner');
  if (z.completar && !z.completar.solved) {
    floatingBanner.style.display = 'block';
    document.getElementById('floatingSentenceText').innerHTML = z.completar.sentence.replace('______', '<span class="blank-space">______</span>');
  } else {
    floatingBanner.style.display = 'none';
  }

  sendTelemetry({ zoneLoaded: index + 1 });
}

// Update HUD Display
function updateHUD() {
  document.getElementById('hudScore').textContent = score;

  for (let i = 1; i <= 3; i++) {
    const h = document.getElementById(`heart${i}`);
    if (i <= lives) {
      h.classList.remove('lost');
    } else {
      h.classList.add('lost');
    }
  }
}

// Floating Damage / Points Feedback
function addFloatingText(text, x, y, color = '#38bdf8') {
  floatTexts.push({
    text,
    x,
    y,
    color,
    alpha: 1.0,
    vy: -1.4,
    life: 55
  });
}

function addSparks(x, y, color = '#38bdf8', count = 12) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: Math.random() * 3 + 2,
      color,
      alpha: 1.0,
      life: 30
    });
  }
}

// Damage & Health Functions
function takeDamage(reasonTopic = 'General') {
  if (player.invulnerableTime > 0) return;
  lives = Math.max(0, lives - 1);
  player.invulnerableTime = 60; // 1 second of invulnerability
  if (window.soundFX) window.soundFX.playWrong();

  if (topicStats[reasonTopic]) {
    topicStats[reasonTopic].errors += 1;
  }
  sendTelemetry({ topic: reasonTopic, isCorrect: false });
  updateHUD();

  addFloatingText('-1 ❤️', player.x, player.y - 30, '#ef4444');
  addSparks(player.x, player.y, '#ef4444', 16);

  if (lives <= 0) {
    triggerGameOver();
  }
}

function collectExtraLife(zone) {
  if (zone.extraLife && !zone.extraLife.collected) {
    zone.extraLife.collected = true;
    if (lives < 3) {
      lives = Math.min(3, lives + 1);
      updateHUD();
      addFloatingText('+1 ❤️ ¡Vida Extra!', player.x, player.y - 30, '#10b981');
    } else {
      score += 150;
      updateHUD();
      addFloatingText('+150 Pts (Batería Llena)', player.x, player.y - 30, '#f59e0b');
    }
    if (window.soundFX) window.soundFX.playBattery();
    addSparks(zone.extraLife.x, zone.extraLife.y, '#10b981', 20);
    sendTelemetry({ extraLifeCollected: true });
  }
}

// Check Goal Completion per Zone
function checkZoneObjectives() {
  const z = zones[currentZoneIndex];

  if (currentZoneIndex === 0) {
    // Zone 1 requires: all correct sustantivos collected AND door classified
    const correctCollected = z.recoleccion.items.filter(it => it.correct).every(it => it.collected);
    const doorClassified = z.clasificar.solved;

    if (correctCollected && doorClassified && !z.portal.active) {
      z.portal.active = true;
      if (window.soundFX) window.soundFX.playPortal();
      addFloatingText('¡Portal Abierto!', z.portal.x, z.portal.y - 40, '#ec4899');
      addSparks(z.portal.x, z.portal.y, '#ec4899', 30);
    }
  } else if (currentZoneIndex === 1) {
    // Zone 2 requires: sentence solved AND all correct adjetivos collected
    const sentenceSolved = z.completar.solved;
    const adjetivosCollected = z.recoleccion.items.filter(it => it.correct).every(it => it.collected);

    if (sentenceSolved && adjetivosCollected && !z.portal.active) {
      z.portal.active = true;
      if (window.soundFX) window.soundFX.playPortal();
      addFloatingText('¡Salida Desbloqueada!', z.portal.x, z.portal.y - 40, '#f59e0b');
      addSparks(z.portal.x, z.portal.y, '#f59e0b', 30);
    }
  }
}

function triggerGameOver() {
  gameState = 'GAMEOVER';
  if (window.soundFX) window.soundFX.playGameOver();
  document.getElementById('goScore').textContent = score;
  document.getElementById('goZones').textContent = `${completedZones.length} / 2`;

  const container = document.getElementById('goTopicBreakdown');
  container.innerHTML = '';
  Object.entries(topicStats).forEach(([top, stats]) => {
    const row = document.createElement('div');
    row.className = 'topic-row';
    row.innerHTML = `
      <span>${top}</span>
      <span>
        <strong style="color:#10b981;">+${stats.correct}</strong> /
        <strong style="color:#ef4444;">-${stats.errors}</strong>
      </span>
    `;
    container.appendChild(row);
  });

  document.getElementById('gameOverModal').classList.remove('hidden');
  sendTelemetry({ finished: true, outcome: 'GAMEOVER' });
}

function triggerVictory() {
  gameState = 'VICTORY';
  if (window.soundFX) window.soundFX.playVictory();
  document.getElementById('vicScore').textContent = score;
  document.getElementById('vicLives').textContent = `${lives} / 3`;

  const container = document.getElementById('vicTopicBreakdown');
  container.innerHTML = '';
  Object.entries(topicStats).forEach(([top, stats]) => {
    const row = document.createElement('div');
    row.className = 'topic-row';
    row.innerHTML = `
      <span>${top}</span>
      <span>
        <strong style="color:#10b981;">+${stats.correct} Aciertos</strong> |
        <strong style="color:#ef4444;">-${stats.errors} Errores</strong>
      </span>
    `;
    container.appendChild(row);
  });

  document.getElementById('victoryModal').classList.remove('hidden');
  sendTelemetry({ finished: true, outcome: 'VICTORY' });
}

// Main Game Loop & Physics
let lastTime = performance.now();

function gameLoop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  if (gameState === 'PLAYING') {
    update(dt);
  }
  render();

  requestAnimationFrame(gameLoop);
}

function update(dt) {
  // Movement input
  let moveX = 0;
  let moveY = 0;

  if (keys['ArrowUp'] || keys['KeyW']) moveY -= 1;
  if (keys['ArrowDown'] || keys['KeyS']) moveY += 1;
  if (keys['ArrowLeft'] || keys['KeyA']) moveX -= 1;
  if (keys['ArrowRight'] || keys['KeyD']) moveX += 1;

  if (moveX !== 0 && moveY !== 0) {
    moveX *= 0.7071;
    moveY *= 0.7071;
  }

  if (moveX > 0) player.facing = 'right';
  else if (moveX < 0) player.facing = 'left';
  else if (moveY > 0) player.facing = 'down';
  else if (moveY < 0) player.facing = 'up';

  if (moveX !== 0 || moveY !== 0) {
    player.walkCycle += dt * 8;
  }

  // Desired position
  let newX = player.x + moveX * player.speed * dt;
  let newY = player.y + moveY * player.speed * dt;

  // Collision resolution with world borders
  newX = Math.max(player.radius + 60, Math.min(WORLD_WIDTH - player.radius - 60, newX));
  newY = Math.max(player.radius + 60, Math.min(WORLD_HEIGHT - player.radius - 60, newY));

  // Check collision with defined obstacles
  for (const obs of obstacles) {
    if (circleRectCollide(newX, player.y, player.radius, obs)) {
      newX = player.x; // Block X movement
    }
    if (circleRectCollide(player.x, newY, player.radius, obs)) {
      newY = player.y; // Block Y movement
    }
  }

  player.x = newX;
  player.y = newY;

  // Invulnerability timer
  if (player.invulnerableTime > 0) {
    player.invulnerableTime -= 1;
  }

  // Zone Interactions
  const z = zones[currentZoneIndex];

  // 1. Recolección de palabras
  if (z.recoleccion) {
    z.recoleccion.items.forEach(item => {
      if (!item.collected) {
        const dist = Math.hypot(player.x - item.x, player.y - item.y);
        if (dist < player.radius + 28) {
          item.collected = true;
          if (item.correct) {
            score += 100;
            topicStats[z.recoleccion.topic].correct += 1;
            if (window.soundFX) window.soundFX.playCorrect();
            addFloatingText(`+100 ¡${item.text}!`, item.x, item.y - 20, '#10b981');
            addSparks(item.x, item.y, '#10b981', 14);
            sendTelemetry({ topic: z.recoleccion.topic, isCorrect: true });
          } else {
            takeDamage(z.recoleccion.topic);
            addFloatingText(`¡${item.text} es incorrecto!`, item.x, item.y - 20, '#ef4444');
          }
          updateHUD();
          checkZoneObjectives();
        }
      }
    });
  }

  // 2. Clasificar Palabras (Puertas bifurcadas en Zona 1)
  if (z.clasificar && !z.clasificar.solved) {
    z.clasificar.doors.forEach(door => {
      if (circleRectCollide(player.x, player.y, player.radius, door)) {
        if (door.correct) {
          z.clasificar.solved = true;
          score += 100;
          topicStats[z.clasificar.topic].correct += 1;
          if (window.soundFX) {
            window.soundFX.playDoor();
            window.soundFX.playCorrect();
          }
          addFloatingText(`+100 ¡Correcto! "${z.clasificar.word}" es ${door.label}`, player.x, player.y - 30, '#10b981');
          addSparks(door.x + door.w / 2, door.y + door.h / 2, '#38bdf8', 25);
          sendTelemetry({ topic: z.clasificar.topic, isCorrect: true });
          updateHUD();
          checkZoneObjectives();
        } else {
          // Wrong door
          takeDamage(z.clasificar.topic);
          addFloatingText(`¡Error! "${z.clasificar.word}" NO es ${door.label}`, player.x, player.y - 30, '#ef4444');
          // Push player back
          player.y += 40;
        }
      }
    });
  }

  // 3. Completar Oración (Opciones en camino en Zona 2)
  if (z.completar && !z.completar.solved) {
    z.completar.options.forEach(opt => {
      if (!opt.chosen && circleRectCollide(player.x, player.y, player.radius, opt)) {
        opt.chosen = true;
        if (opt.correct) {
          z.completar.solved = true;
          score += 100;
          topicStats[z.completar.topic].correct += 1;
          if (window.soundFX) window.soundFX.playCorrect();

          // Update floating banner with completed sentence
          const fullSentence = z.completar.sentence.replace('______', `<span style="color:#10b981; font-weight:800;">${opt.text}</span>`);
          document.getElementById('floatingSentenceText').innerHTML = `¡Completado! ${fullSentence}`;
          addFloatingText(`+100 ¡"${opt.text}" es correcta!`, opt.x + opt.w / 2, opt.y - 20, '#10b981');
          addSparks(opt.x + opt.w / 2, opt.y + opt.h / 2, '#10b981', 25);
          sendTelemetry({ topic: z.completar.topic, isCorrect: true });
          updateHUD();
          checkZoneObjectives();
        } else {
          takeDamage(z.completar.topic);
          addFloatingText(`¡"${opt.text}" no completa bien la oración!`, opt.x + opt.w / 2, opt.y - 20, '#ef4444');
          player.y += 30; // Push back slightly
        }
      }
    });
  }

  // 4. Vida Extra
  if (z.extraLife && !z.extraLife.collected) {
    const distLife = Math.hypot(player.x - z.extraLife.x, player.y - z.extraLife.y);
    if (distLife < player.radius + 24) {
      collectExtraLife(z);
    }
  }

  // 5. Portal de avance / final
  if (z.portal && z.portal.active) {
    const distPortal = Math.hypot(player.x - z.portal.x, player.y - z.portal.y);
    if (distPortal < z.portal.radius + 20) {
      if (currentZoneIndex === 0) {
        completedZones.push(1);
        gameState = 'TRANSITION';
        if (window.soundFX) window.soundFX.playPortal();
        document.getElementById('transitionModal').classList.remove('hidden');
        sendTelemetry({ completedZone: 1 });
      } else if (currentZoneIndex === 1) {
        completedZones.push(2);
        triggerVictory();
      }
    }
  }

  // Update Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 1 / p.life;
    if (p.alpha <= 0) particles.splice(i, 1);
  }

  // Update Floating Texts
  for (let i = floatTexts.length - 1; i >= 0; i--) {
    const ft = floatTexts[i];
    ft.y += ft.vy;
    ft.alpha -= 1 / ft.life;
    if (ft.alpha <= 0) floatTexts.splice(i, 1);
  }
}

// Circle - Rectangle Collision Helper
function circleRectCollide(cx, cy, radius, rect) {
  const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const distanceX = cx - closestX;
  const distanceY = cy - closestY;
  return (distanceX * distanceX + distanceY * distanceY) < (radius * radius);
}

// Render Engine
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const z = zones[currentZoneIndex];

  // Smooth Camera following Player
  const cameraX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, player.x - canvas.width / 2));
  const cameraY = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, player.y - canvas.height / 2));

  ctx.save();
  ctx.translate(-cameraX, -cameraY);

  // 1. Draw Background Image
  if (z.bg.complete) {
    ctx.drawImage(z.bg, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  } else {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }

  // 2. Draw Interactive Elements for Current Zone

  // Mecánica A: Recolección Items
  if (z.recoleccion) {
    z.recoleccion.items.forEach(item => {
      if (!item.collected) {
        drawCollectibleWord(item.x, item.y, item.text);
      }
    });
  }

  // Mecánica B: Puertas de Clasificación (Zona 1)
  if (z.clasificar) {
    drawClassificationBifurcation(z.clasificar);
  }

  // Mecánica C: Opciones de Oración (Zona 2)
  if (z.completar && !z.completar.solved) {
    drawSentenceOptions(z.completar);
  }

  // Vida Extra (Batería / Corazón)
  if (z.extraLife && !z.extraLife.collected) {
    drawExtraLifeItem(z.extraLife.x, z.extraLife.y);
  }

  // Portal de Salida / Transición
  if (z.portal && z.portal.active) {
    drawPortal(z.portal.x, z.portal.y, z.portal.radius);
  }

  // 3. Draw Player (Crey)
  drawPlayer(player);

  // 4. Draw Particles & Floating Texts in World Space
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  floatTexts.forEach(ft => {
    ctx.save();
    ctx.globalAlpha = ft.alpha;
    ctx.fillStyle = ft.color;
    ctx.font = 'bold 16px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  });

  ctx.restore();
}

// Drawing Components
function drawCollectibleWord(x, y, text) {
  const bounce = Math.sin(performance.now() / 250) * 4;

  ctx.save();
  ctx.translate(x, y + bounce);

  // Outer Glow
  ctx.shadowColor = 'rgba(56, 189, 248, 0.7)';
  ctx.shadowBlur = 12;

  // Background Scroll / Bubble
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;

  const width = Math.max(90, text.length * 12 + 24);
  const height = 40;
  roundRect(ctx, -width / 2, -height / 2, width, height, 12, true, true);

  // Glowing Star Icon
  ctx.fillStyle = '#f59e0b';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('✨', -width / 2 + 8, 4);

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, 6, 5);

  ctx.restore();
}

function drawClassificationBifurcation(clasificar) {
  // Target Word Sign
  if (!clasificar.solved) {
    ctx.save();
    ctx.translate(clasificar.signX, clasificar.signY);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 3;
    roundRect(ctx, -150, -32, 300, 64, 16, true, true);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CLASIFICA LA PALABRA:', 0, -10);

    ctx.fillStyle = '#f472b6';
    ctx.font = 'bold 22px "Outfit", sans-serif';
    ctx.fillText(`"${clasificar.word}"`, 0, 18);

    ctx.restore();
  }

  // The 2 Bifurcation Doors
  clasificar.doors.forEach(door => {
    ctx.save();
    ctx.translate(door.x, door.y);

    const isSolved = clasificar.solved && door.correct;
    ctx.fillStyle = isSolved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = isSolved ? '#10b981' : (door.label === 'Verbo' ? '#38bdf8' : '#a855f7');
    ctx.lineWidth = 3;
    roundRect(ctx, 0, 0, door.w, door.h, 12, true, true);

    // Door Header
    ctx.fillStyle = isSolved ? '#10b981' : '#f8fafc';
    ctx.font = 'bold 16px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🚪 Puerta`, door.w / 2, 32);

    ctx.fillStyle = isSolved ? '#34d399' : '#38bdf8';
    ctx.font = 'bold 18px "Outfit", sans-serif';
    ctx.fillText(door.label, door.w / 2, 62);

    ctx.restore();
  });
}

function drawSentenceOptions(completar) {
  completar.options.forEach(opt => {
    ctx.save();
    ctx.translate(opt.x, opt.y);

    ctx.fillStyle = opt.chosen ? (opt.correct ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)') : 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = opt.chosen ? (opt.correct ? '#10b981' : '#ef4444') : '#a855f7';
    ctx.lineWidth = 2.5;

    roundRect(ctx, 0, 0, opt.w, opt.h, 12, true, true);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 17px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(opt.text, opt.w / 2, opt.h / 2 + 6);

    ctx.restore();
  });
}

function drawExtraLifeItem(x, y) {
  const pulse = Math.sin(performance.now() / 200) * 3;
  ctx.save();
  ctx.translate(x, y + pulse);

  if (images.vidaextra.complete) {
    ctx.drawImage(images.vidaextra, -24, -24, 48, 48);
  } else {
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('❤️', 0, 5);
  }
  ctx.restore();
}

function drawPortal(x, y, radius) {
  const time = performance.now() / 400;
  ctx.save();
  ctx.translate(x, y);

  // Outer swirling aura
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = i % 2 === 0 ? '#38bdf8' : '#ec4899';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, radius + Math.sin(time + i) * 6, time + i, time + i + Math.PI * 1.5);
    ctx.stroke();
  }

  // Core glow
  const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, radius);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.5, '#ec4899');
  grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ENTRAR', 0, 5);

  ctx.restore();
}

function drawPlayer(p) {
  ctx.save();
  ctx.translate(p.x, p.y);

  // Invulnerability flicker
  if (p.invulnerableTime > 0 && Math.floor(p.invulnerableTime / 4) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }

  // Walking wobble
  const wobble = Math.sin(p.walkCycle) * 0.08;
  ctx.rotate(wobble);

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 24, 22, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sprite
  if (images.crey.complete) {
    ctx.drawImage(images.crey, -32, -36, 64, 70);
  } else {
    // Fallback circle
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// Helper: Rounded Rectangle
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}
