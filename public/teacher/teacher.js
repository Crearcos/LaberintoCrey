// Teacher Panel Logic for Crey Educational - Juego 2: Lenguaje
let currentStep = 1;
let socket = null;
let currentRoomCode = null;
let sessionConfig = {
  subject: 'language',
  name: '5to Primaria - Lenguaje',
  pin: '',
  curriculum: null
};

let liveStudents = [];
let defaultCurriculum = null;

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  initDate();
  setupNavigation();
  setupFormHandlers();
  fetchDefaultCurriculum();
});

function initDate() {
  const d = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('sessionDate').value = d.toLocaleDateString('es-ES', options);
}

function setupNavigation() {
  document.querySelectorAll('.step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const step = parseInt(btn.dataset.step, 10);
      goToStep(step);
    });
  });
}

function goToStep(step) {
  if (step === 3 && !currentRoomCode) {
    alert('Primero debes iniciar la sesión para acceder a la transmisión en vivo.');
    return;
  }
  currentStep = step;
  document.querySelectorAll('.screen-view').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.step-btn').forEach(b => b.classList.remove('active'));

  const activeScreen = document.getElementById(`screen${step}`);
  const activeTab = document.getElementById(`tabStep${step}`);
  if (activeScreen) activeScreen.classList.add('active');
  if (activeTab) activeTab.classList.add('active');

  if (step === 4) {
    renderSummaryScreen();
  }
}

function setupFormHandlers() {
  const form1 = document.getElementById('createSessionForm');
  form1.addEventListener('submit', (e) => {
    e.preventDefault();
    sessionConfig.name = document.getElementById('sessionName').value.trim();
    sessionConfig.pin = document.getElementById('customPin').value.trim().toUpperCase();
    goToStep(2);
  });

  document.getElementById('btnResetDefaultContent').addEventListener('click', () => {
    if (defaultCurriculum) {
      sessionConfig.curriculum = JSON.parse(JSON.stringify(defaultCurriculum));
      renderCurriculumEditor();
    }
  });

  document.getElementById('btnLaunchLiveSession').addEventListener('click', () => {
    launchLiveSession();
  });

  document.getElementById('btnCloseSession').addEventListener('click', () => {
    if (confirm('¿Estás seguro de que deseas finalizar la sesión de aula y ver los resultados consolidados?')) {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'END_ROOM' }));
      }
      goToStep(4);
    }
  });

  document.getElementById('btnExportCSV').addEventListener('click', exportCSV);
  document.getElementById('btnExportCSV2').addEventListener('click', exportCSV);

  document.getElementById('sortSelector').addEventListener('change', () => {
    renderLiveStudentsTable();
  });
}

async function fetchDefaultCurriculum() {
  try {
    const res = await fetch('/api/default-content');
    const data = await res.json();
    if (data.success) {
      defaultCurriculum = data.curriculum;
      sessionConfig.curriculum = JSON.parse(JSON.stringify(defaultCurriculum));
      renderCurriculumEditor();
    }
  } catch (err) {
    console.error('Error cargando contenido predeterminado:', err);
  }
}

function renderCurriculumEditor() {
  const container = document.getElementById('contentEditorContainer');
  if (!container || !sessionConfig.curriculum) return;

  container.innerHTML = '';

  sessionConfig.curriculum.zones.forEach((zone, zIdx) => {
    const zoneDiv = document.createElement('div');
    zoneDiv.className = 'zone-box';

    let challengesHTML = '';
    zone.challenges.forEach((ch, cIdx) => {
      let badgeClass = 'badge-recoleccion';
      let typeLabel = 'A. Recolección';
      if (ch.type === 'clasificar') {
        badgeClass = 'badge-clasificar';
        typeLabel = 'B. Clasificar Palabras';
      } else if (ch.type === 'completar') {
        badgeClass = 'badge-completar';
        typeLabel = 'C. Completar Oración';
      }

      challengesHTML += `
        <div class="challenge-card">
          <span class="challenge-type-badge ${badgeClass}">${typeLabel}</span>
          <div style="font-weight: 700; margin-bottom: 0.35rem; color: #f8fafc;">${ch.topic}</div>
          <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 0.5rem;"><em>${ch.instruction}</em></div>
          ${renderChallengeDetails(ch, zIdx, cIdx)}
        </div>
      `;
    });

    zoneDiv.innerHTML = `
      <div class="zone-box-title">
        <span>📍 Zona ${zIdx + 1}: ${zone.name}</span>
      </div>
      <div>${challengesHTML}</div>
    `;
    container.appendChild(zoneDiv);
  });
}

function renderChallengeDetails(ch, zIdx, cIdx) {
  if (ch.type === 'recoleccion') {
    const itemsPreview = ch.items.map(it => 
      `<span style="display:inline-block; padding: 2px 8px; margin: 2px; border-radius: 4px; font-size: 0.82rem; background: ${it.correct ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; border: 1px solid ${it.correct ? '#10b981' : '#ef4444'};">
        ${it.text} ${it.correct ? '✅' : '❌'}
      </span>`
    ).join(' ');
    return `<div style="margin-top: 0.3rem;">Palabras en zona: ${itemsPreview}</div>`;
  } else if (ch.type === 'clasificar') {
    const doorsPreview = ch.doors.map(d =>
      `<span style="display:inline-block; padding: 2px 8px; margin: 2px; border-radius: 4px; font-size: 0.82rem; background: ${d.correct ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)'}; border: 1px solid ${d.correct ? '#10b981' : '#94a3b8'};">
        Puerta [${d.label}] ${d.correct ? '✅ (Correcta)' : ''}
      </span>`
    ).join(' vs ');
    return `<div style="margin-top: 0.3rem;">Palabra a clasificar: <strong style="color:#f472b6;">"${ch.word}"</strong> &bull; ${doorsPreview}</div>`;
  } else if (ch.type === 'completar') {
    const optionsPreview = ch.options.map(opt =>
      `<span style="display:inline-block; padding: 2px 8px; margin: 2px; border-radius: 4px; font-size: 0.82rem; background: ${opt.correct ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; border: 1px solid ${opt.correct ? '#10b981' : '#ef4444'};">
        ${opt.text} ${opt.correct ? '✅' : '❌'}
      </span>`
    ).join(' | ');
    return `<div style="margin-top: 0.3rem;">Oración: <strong style="color:#38bdf8;">"${ch.sentence}"</strong><br>Opciones en camino: ${optionsPreview}</div>`;
  }
  return '';
}

function launchLiveSession() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;

  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    socket.send(JSON.stringify({
      type: 'CREATE_ROOM',
      sessionName: sessionConfig.name,
      roomCode: sessionConfig.pin,
      curriculum: sessionConfig.curriculum
    }));
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'ROOM_CREATED') {
        currentRoomCode = data.roomCode;
        document.getElementById('liveRoomPin').textContent = currentRoomCode;
        document.getElementById('activePinDisplay').textContent = currentRoomCode;
        document.getElementById('sessionBadge').classList.remove('hidden');
        goToStep(3);
      } else if (data.type === 'ROOM_UPDATE') {
        liveStudents = data.students || [];
        updateSummaryStats(data.summary);
        renderLiveStudentsTable();
      }
    } catch (e) {
      console.error('Error procesando respuesta WebSocket:', e);
    }
  };

  socket.onerror = (err) => {
    console.error('WebSocket Error:', err);
    alert('No se pudo conectar con el servidor en tiempo real. Verifica que esté corriendo.');
  };
}

function updateSummaryStats(summary) {
  if (!summary) return;
  document.getElementById('statConnectedCount').textContent = summary.active || 0;
  const completed = liveStudents.filter(s => s.finished || (s.completedZones && s.completedZones.length >= 2)).length;
  document.getElementById('statCompletedCount').textContent = completed;
  document.getElementById('statGroupAvgScore').textContent = (summary.avgScore || 0) + ' pts';
}

function renderLiveStudentsTable() {
  const tbody = document.getElementById('studentsTableBody');
  if (!tbody) return;

  if (liveStudents.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="9">Esperando que los alumnos ingresen con el código PIN <strong>${currentRoomCode}</strong>...</td>
      </tr>
    `;
    return;
  }

  const sortVal = document.getElementById('sortSelector').value;
  const sorted = [...liveStudents].sort((a, b) => {
    if (sortVal === 'score_desc') return b.score - a.score;
    if (sortVal === 'name_asc') return a.name.localeCompare(b.name);
    if (sortVal === 'lives_desc') return b.lives - a.lives;
    if (sortVal === 'status') return (b.finished ? 1 : 0) - (a.finished ? 1 : 0);
    return 0;
  });

  tbody.innerHTML = '';
  sorted.forEach((st, idx) => {
    const tr = document.createElement('tr');

    let totalHits = 0;
    let totalErrors = 0;
    Object.values(st.topicStats || {}).forEach(stat => {
      totalHits += stat.correct || 0;
      totalErrors += stat.errors || 0;
    });

    let statusBadge = '<span class="badge badge-success">En Vivo</span>';
    if (st.finished) {
      statusBadge = '<span class="badge" style="background:#10b981; color:#fff;">🏆 Superado</span>';
    } else if (st.lives <= 0) {
      statusBadge = '<span class="badge" style="background:#ef4444; color:#fff;">💀 Sin vidas</span>';
    } else if (!st.connected) {
      statusBadge = '<span class="badge badge-muted">Desconectado</span>';
    }

    const hearts = '❤️'.repeat(Math.max(0, st.lives)) + '🖤'.repeat(Math.max(0, 3 - st.lives));
    const currentZoneName = st.currentZone === 2 ? 'Zona 2 (Oraciones)' : 'Zona 1 (Sustantivos)';

    tr.innerHTML = `
      <td><strong>${idx + 1}</strong></td>
      <td><strong>${st.name}</strong> ${statusBadge}</td>
      <td><span style="font-size:0.88rem; color:#38bdf8;">${currentZoneName}</span></td>
      <td><span style="letter-spacing: 2px;">${hearts}</span></td>
      <td><strong style="color:#f59e0b;">${st.score}</strong></td>
      <td style="color:#10b981; font-weight:700;">+${totalHits}</td>
      <td style="color:#ef4444; font-weight:700;">-${totalErrors}</td>
      <td><span style="color:#f87171; font-size:0.85rem;">${st.worstTopic || 'Ninguno'}</span></td>
      <td><small style="color:#94a3b8;">${formatTime(st.lastUpdate)}</small></td>
    `;
    tbody.appendChild(tr);
  });
}

function formatTime(timestamp) {
  if (!timestamp) return '-';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 5) return 'Ahora';
  if (diffSec < 60) return `hace ${diffSec}s`;
  return `hace ${Math.floor(diffSec / 60)}m`;
}

function renderSummaryScreen() {
  const total = liveStudents.length;
  document.getElementById('finalTotalStudents').textContent = total;

  if (total === 0) {
    document.getElementById('finalAvgScore').textContent = '0 pts';
    document.getElementById('finalWorstTopic').textContent = 'N/A';
    document.getElementById('finalAccuracy').textContent = '0%';
    document.getElementById('podiumContainer').innerHTML = '<p style="color:#94a3b8; text-align:center;">No hubo participantes en esta sesión.</p>';
    document.getElementById('summaryTableBody').innerHTML = '<tr><td colspan="8" style="text-align:center;">Sin datos disponibles.</td></tr>';
    return;
  }

  let totalScore = 0;
  let globalHits = 0;
  let globalErrors = 0;
  const topicErrors = {};

  liveStudents.forEach(st => {
    totalScore += st.score;
    Object.entries(st.topicStats || {}).forEach(([topic, stats]) => {
      globalHits += stats.correct || 0;
      globalErrors += stats.errors || 0;
      topicErrors[topic] = (topicErrors[topic] || 0) + (stats.errors || 0);
    });
  });

  const avgScore = Math.round(totalScore / total);
  document.getElementById('finalAvgScore').textContent = `${avgScore} pts`;

  const totalAnswers = globalHits + globalErrors;
  const accuracy = totalAnswers > 0 ? Math.round((globalHits / totalAnswers) * 100) : 0;
  document.getElementById('finalAccuracy').textContent = `${accuracy}%`;

  let worstTopic = 'Ninguno';
  let maxErr = 0;
  Object.entries(topicErrors).forEach(([top, count]) => {
    if (count > maxErr) {
      maxErr = count;
      worstTopic = `${top} (${count} fallos)`;
    }
  });
  document.getElementById('finalWorstTopic').textContent = worstTopic;

  // Podium (Top 3 by score)
  const ranked = [...liveStudents].sort((a, b) => b.score - a.score);
  const podium = document.getElementById('podiumContainer');
  podium.innerHTML = '';

  const places = [
    { rank: '1°', color: '#f59e0b', label: 'Campeón' },
    { rank: '2°', color: '#94a3b8', label: 'Subcampeón' },
    { rank: '3°', color: '#b45309', label: 'Tercer Lugar' }
  ];

  ranked.slice(0, 3).forEach((st, i) => {
    const card = document.createElement('div');
    card.className = 'podium-card';
    card.style.borderColor = places[i].color;
    card.innerHTML = `
      <div style="font-size:2rem;">${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
      <div style="font-size:1.3rem; font-weight:800; color:${places[i].color}">${places[i].rank}</div>
      <div style="font-size:1.1rem; font-weight:700; margin: 0.3rem 0;">${st.name}</div>
      <div style="font-size:1.2rem; font-weight:800; color:#38bdf8;">${st.score} pts</div>
    `;
    podium.appendChild(card);
  });

  // Summary Table
  const sTbody = document.getElementById('summaryTableBody');
  sTbody.innerHTML = '';
  ranked.forEach((st, idx) => {
    let hits = 0;
    let errs = 0;
    Object.values(st.topicStats || {}).forEach(s => {
      hits += s.correct || 0;
      errs += s.errors || 0;
    });
    const totalAns = hits + errs;
    const prec = totalAns > 0 ? Math.round((hits / totalAns) * 100) : 0;
    const zonesCount = (st.completedZones || []).length;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${idx + 1}</strong></td>
      <td><strong>${st.name}</strong></td>
      <td>${zonesCount} / 2 Zonas</td>
      <td><strong style="color:#f59e0b;">${st.score}</strong></td>
      <td style="color:#10b981;">${hits}</td>
      <td style="color:#ef4444;">${errs}</td>
      <td><strong>${prec}%</strong></td>
      <td><span style="color:#f87171;">${st.worstTopic || 'Ninguno'}</span></td>
    `;
    sTbody.appendChild(row);
  });
}

function exportCSV() {
  if (liveStudents.length === 0) {
    alert('No hay datos de alumnos para exportar.');
    return;
  }

  const ranked = [...liveStudents].sort((a, b) => b.score - a.score);
  let csvContent = '\uFEFF'; // UTF-8 BOM for Excel Spanish accents
  csvContent += 'Posición,Alumno,Zonas Completadas,Puntaje,Aciertos,Errores,% Precisión,Tema Más Crítico\n';

  ranked.forEach((st, idx) => {
    let hits = 0;
    let errs = 0;
    Object.values(st.topicStats || {}).forEach(s => {
      hits += s.correct || 0;
      errs += s.errors || 0;
    });
    const totalAns = hits + errs;
    const prec = totalAns > 0 ? Math.round((hits / totalAns) * 100) : 0;
    const zonesCount = (st.completedZones || []).length;
    const worst = (st.worstTopic || 'Ninguno').replace(/"/g, '""');

    csvContent += `"${idx + 1}","${st.name}","${zonesCount}/2","${st.score}","${hits}","${errs}","${prec}%","${worst}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Reporte_Lenguaje_Laberinto_${currentRoomCode || 'Aula'}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
