/* ═══════════════════════════════════════════════════
   SAVE THE DATE · Judit & Guillermo · 17.07.2027
   script.js — mapa, avión, pétalos, popup
═══════════════════════════════════════════════════ */

/* ──────────────────────────────────────────────────
   MAPA — generado con Canvas 2D (Natural Earth data)
   Centrado en el Océano Atlántico
   Paleta crema / azul pálido / dorado
────────────────────────────────────────────────── */

const MAP = {
  /* Offset de longitud para centrar el Atlántico:
     -30° coloca el centro del mapa sobre el Atlántico */
  lonOffset: -30,

  /* Países simplificados como polígonos [lon, lat] */
  /* Contornos aproximados pero visualmente reconocibles */
  landColor:    '#e8d5b7',
  seaColor:     '#c8dde8',
  strokeColor:  '#c4a97a',
  strokeWidth:  0.5,
};

/* ─── Coordenadas geográficas de las ciudades ─── */
const BUENOS_AIRES = { lon: -58.38, lat: -34.60 };
const BARCELONA    = { lon:   2.15, lat:  41.38 };

/* ─── Posición en pantalla como % ─── */
let buePct, bcnPct;

/* ──────────────────────────────────────────────────
   PROYECCIÓN EQUIRECTANGULAR con offset de longitud
────────────────────────────────────────────────── */
function project(lon, lat, w, h) {
  const normLon = ((lon - MAP.lonOffset + 180 + 360) % 360) - 180;
  const x = (normLon + 180) / 360 * w;
  const y = (90 - lat) / 180 * h;
  return { x, y };
}

function geoToPct(lon, lat) {
  const normLon = ((lon - MAP.lonOffset + 180 + 360) % 360) - 180;
  const pctX = (normLon + 180) / 360 * 100;
  const pctY = (90 - lat) / 180 * 100;
  return { x: pctX, y: pctY };
}

/* ──────────────────────────────────────────────────
   DIBUJAR MAPA EN CANVAS
────────────────────────────────────────────────── */
function buildMap() {
  const container = document.getElementById('map-bg');
  const canvas = document.createElement('canvas');
  const W = window.innerWidth  * window.devicePixelRatio;
  const H = window.innerHeight * window.devicePixelRatio;
  canvas.width  = W;
  canvas.height = H;
  canvas.style.width  = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  /* Fondo oceánico */
  ctx.fillStyle = MAP.seaColor;
  ctx.fillRect(0, 0, W, H);

  /* Graticule (líneas de latitud/longitud) */
  ctx.strokeStyle = 'rgba(180,160,120,0.18)';
  ctx.lineWidth = 0.8;
  for (let lon = -180; lon <= 180; lon += 30) {
    const p1 = project(lon, 90, W, H);
    const p2 = project(lon, -90, W, H);
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
  }
  for (let lat = -60; lat <= 90; lat += 30) {
    const p1 = project(-180, lat, W, H);
    const p2 = project(180, lat, W, H);
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
  }

  /* ── Continentes ── */
  ctx.fillStyle = MAP.landColor;
  ctx.strokeStyle = MAP.strokeColor;
  ctx.lineWidth = MAP.strokeWidth;

  drawLand(ctx, W, H);
}

function drawPolygon(ctx, coords, W, H) {
  if (coords.length < 2) return;
  ctx.beginPath();
  const p0 = project(coords[0][0], coords[0][1], W, H);
  ctx.moveTo(p0.x, p0.y);
  for (let i = 1; i < coords.length; i++) {
    const p = project(coords[i][0], coords[i][1], W, H);
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawLand(ctx, W, H) {
  const shapes = getLandShapes();
  for (const shape of shapes) {
    drawPolygon(ctx, shape, W, H);
  }
}

/* ──────────────────────────────────────────────────
   FORMAS DE CONTINENTES (polígonos simplificados)
   Suficientemente detallados para ser reconocibles
────────────────────────────────────────────────── */
function getLandShapes() {
  return [

  /* ── EUROPA ── */
  [[-10,36],[0,36],[5,43],[10,44],[15,44],[18,40],[20,37],[26,38],[28,41],[26,44],
   [22,47],[18,50],[14,54],[10,55],[5,57],[0,51],[-5,48],[-9,39],[-10,36]],

  /* Escandinavia */
  [[5,57],[8,58],[5,62],[5,70],[15,71],[20,70],[25,65],[28,60],[25,56],[20,55],
   [14,54],[10,55],[5,57]],

  /* Islandia */
  [[-25,64],[-13,63],[-13,66],[-20,66],[-25,64]],

  /* Gran Bretaña */
  [[-5,50],[2,51],[2,53],[-4,58],[-5,57],[-2,51],[-5,50]],

  /* Irlanda */
  [[-10,51],[-6,51],[-6,55],[-10,54],[-10,51]],

  /* ── ÁFRICA ── */
  [[-18,15],[-16,12],[-15,10],[-8,5],[-5,5],[0,5],[10,5],[15,2],[20,-5],[25,-10],
   [32,-20],[35,-30],[30,-35],[20,-36],[15,-34],[10,-20],[5,-5],[-5,5],[-8,5],
   [-15,10],[-16,12],[-18,15],[-17,20],[-15,25],[-10,30],[-5,36],[0,37],[5,37],
   [10,38],[15,38],[20,37],[25,33],[30,32],[32,28],[30,22],[25,20],[20,18],[15,16],
   [10,12],[5,10],[0,10],[-5,10],[-10,12],[-15,12],[-18,15]],

  /* Madagascar */
  [[44,-12],[50,-12],[50,-26],[44,-25],[44,-12]],

  /* ── ASIA ── */
  [[26,38],[30,38],[35,36],[37,37],[40,36],[42,37],[44,42],[48,42],[50,45],[55,45],
   [60,44],[65,40],[68,36],[65,30],[60,24],[55,22],[50,25],[45,23],[40,20],[38,22],
   [36,24],[34,28],[30,30],[26,32],[26,38]],

  /* Asia central-norte */
  [[40,36],[45,40],[50,45],[60,44],[70,42],[80,42],[90,50],[100,52],[110,50],
   [120,48],[130,45],[140,40],[140,35],[130,30],[120,22],[110,18],[100,12],[95,5],
   [100,-5],[105,-8],[110,-8],[115,-5],[120,5],[125,10],[130,15],[130,20],[135,25],
   [140,35],[145,38],[150,40],[145,45],[140,40],[130,45],[120,48],[110,50],[100,52],
   [90,55],[80,58],[70,55],[60,56],[55,60],[50,65],[55,70],[60,72],[70,72],[80,70],
   [90,70],[100,70],[110,70],[120,68],[130,65],[140,62],[150,60],[160,60],[170,60],
   [175,62],[170,65],[160,68],[150,70],[140,72],[130,72],[120,72],[110,70],[100,70],
   [90,75],[80,72],[70,72],[60,68],[50,65],[45,60],[40,55],[35,50],[30,46],[26,44],
   [22,47],[26,44],[30,46],[35,50],[40,55],[40,36]],

  /* Japón */
  [[130,31],[135,33],[140,38],[145,40],[145,44],[141,43],[135,35],[130,31]],

  /* Sri Lanka */
  [[80,6],[82,6],[82,8],[80,8],[80,6]],

  /* ── ASIA SURESTE ── */
  [[95,5],[100,-5],[105,-8],[108,-5],[105,0],[100,5],[98,8],[95,5]],

  /* Indonesia (simplificado) */
  [[95,-5],[105,-5],[110,-8],[115,-8],[120,-10],[120,-8],[115,-5],[110,-5],[105,-5],[95,-5]],

  /* ── AUSTRALASIA ── */
  [[114,-22],[120,-20],[124,-18],[128,-14],[132,-12],[136,-12],[140,-15],[144,-20],
   [148,-22],[152,-25],[153,-28],[151,-33],[148,-38],[145,-38],[140,-36],[135,-35],
   [130,-32],[125,-34],[120,-33],[115,-32],[114,-28],[114,-22]],

  /* Nueva Zelanda */
  [[166,-46],[170,-44],[172,-42],[170,-40],[168,-40],[166,-42],[166,-46]],

  /* ── NORTEAMÉRICA ── */
  [[-170,60],[-160,60],[-150,58],[-140,55],[-130,50],[-125,46],[-120,38],[-118,34],
   [-117,30],[-110,24],[-105,20],[-100,18],[-90,15],[-85,10],[-80,9],[-75,10],
   [-70,12],[-65,18],[-62,16],[-65,20],[-70,22],[-75,24],[-78,26],[-80,25],
   [-82,29],[-85,30],[-88,30],[-90,29],[-90,25],[-87,21],[-84,18],[- 80,22],
   [-84,30],[-85,35],[-80,36],[-76,37],[-74,40],[-72,41],[-70,42],[-68,44],
   [-65,44],[-64,46],[-66,47],[-70,47],[-75,45],[-76,44],[-80,43],[-83,42],
   [-85,45],[-87,45],[-90,46],[-92,47],[-95,50],[-100,50],[-105,52],[-110,55],
   [-115,58],[-120,58],[-125,60],[-130,58],[-135,60],[-140,60],[-145,62],
   [-150,65],[-155,65],[-160,66],[-165,68],[-168,70],[-160,70],[-150,70],
   [-140,68],[-135,65],[-130,62],[-125,62],[-120,65],[-115,65],[-110,68],
   [-100,70],[-90,72],[-80,70],[-70,68],[-65,63],[-60,58],[-65,55],[-70,52],
   [-75,50],[-80,50],[-85,50],[-90,50],[-95,50],[-100,50],[-105,52],[-110,55],
   [-115,58],[-120,58],[-125,60],[-130,58],[-140,60],[-150,60],[-160,60],[-170,60]],

  /* Alaska */
  [[-170,54],[-165,54],[-160,58],[-155,60],[-150,60],[-145,62],[-140,60],
   [-140,55],[-150,55],[-160,54],[-165,52],[-170,52],[-170,54]],

  /* Groenlandia */
  [[-48,60],[-42,60],[-30,65],[-20,70],[-18,76],[-30,80],[-45,82],[-55,80],
   [-60,75],[-58,68],[-55,62],[-48,60]],

  /* ── CENTROAMÉRICA ── */
  [[-90,15],[-85,10],[-80,9],[-77,8],[-76,9],[-78,10],[-80,10],[-83,10],
   [-84,12],[-87,14],[-90,15]],

  /* Cuba */
  [[-85,22],[-75,20],[-74,22],[-80,23],[-85,23],[-85,22]],

  /* ── SUDAMÉRICA ── */
  [[-82,8],[-80,9],[-77,8],[-72,12],[-68,11],[-62,10],[-60,6],[-52,5],[-50,0],
   [-48,-5],[-45,-5],[-40,-3],[-35,0],[-35,-5],[-38,-10],[-39,-15],[-40,-20],
   [-42,-22],[-44,-24],[-45,-24],[-48,-28],[-52,-33],[-55,-34],[-58,-38],[-62,-40],
   [-65,-43],[-68,-46],[-70,-50],[-72,-52],[-70,-55],[-68,-54],[-65,-52],[-62,-50],
   [-58,-52],[-55,-50],[-53,-46],[-55,-42],[-58,-38],[-62,-35],[-65,-30],[-68,-26],
   [-70,-20],[-72,-15],[-76,-12],[-78,-8],[-80,-5],[-78,-2],[-75,0],[-72,2],
   [-70,5],[-68,6],[-66,10],[-62,10],[-60,6],[-52,5],[-50,0],[-48,-5],[-45,-5],
   [-40,-3],[-35,0],[-35,-5],[-38,-10],[-80,-5],[-82,8]],

  /* Tierra del Fuego */
  [[-72,-52],[-68,-52],[-66,-54],[-68,-56],[-72,-54],[-72,-52]],

  /* Falkland */
  [[-60,-52],[-57,-52],[-57,-54],[-60,-54],[-60,-52]],

  /* ── ANTÁRTIDA (simplificada) ── */
  [[-180,-70],[180,-70],[180,-90],[-180,-90],[-180,-70]],
  ];
}

/* ──────────────────────────────────────────────────
   POSICIONAR ELEMENTOS EN EL MAPA
────────────────────────────────────────────────── */
function positionElements() {
  buePct = geoToPct(BUENOS_AIRES.lon, BUENOS_AIRES.lat);
  bcnPct = geoToPct(BARCELONA.lon,    BARCELONA.lat);

  setPos('dot-bue',   buePct.x, buePct.y);
  setPos('label-bue', buePct.x, buePct.y + 3.2);

  setPos('dot-bcn',   bcnPct.x, bcnPct.y);
  setPos('bcn-ring1', bcnPct.x, bcnPct.y);
  setPos('bcn-ring2', bcnPct.x, bcnPct.y);
  setPos('label-bcn', bcnPct.x, bcnPct.y + 2.8);
  setPos('tap-hint',  bcnPct.x, bcnPct.y + 5.8);
}

function setPos(id, pctX, pctY) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.left = pctX + '%';
  el.style.top  = pctY + '%';
}

/* ──────────────────────────────────────────────────
   RUTA PUNTEADA EN EL SVG OVERLAY
────────────────────────────────────────────────── */
function updateFlightPath() {
  const svgEl = document.getElementById('route-svg');
  const VW = 1000, VH = 600;

  const bx = (buePct.x / 100) * VW;
  const by = (buePct.y / 100) * VH;
  const ex = (bcnPct.x / 100) * VW;
  const ey = (bcnPct.y / 100) * VH;

  /* Curva de Bézier cúbica: arco hacia el norte */
  const cp1x = bx + (ex - bx) * 0.25;
  const cp1y = Math.min(by, ey) - 95;
  const cp2x = bx + (ex - bx) * 0.75;
  const cp2y = Math.min(by, ey) - 95;

  const d = `M ${bx} ${by} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${ex} ${ey}`;
  document.getElementById('flight-path').setAttribute('d', d);
}

/* ──────────────────────────────────────────────────
   ANIMACIÓN DEL AVIÓN
────────────────────────────────────────────────── */
function animatePlane() {
  const plane   = document.getElementById('plane');
  const pathEl  = document.getElementById('flight-path');
  const svgEl   = document.getElementById('route-svg');
  const DURATION = 7000;   /* ms por trayecto */
  const PAUSE    = 2200;   /* ms de pausa al llegar */
  let startTime  = null;
  let animating  = true;

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function getScreenPoint(t) {
    const totalLen = pathEl.getTotalLength();
    const pt = pathEl.getPointAtLength(easeInOut(t) * totalLen);
    const rect = svgEl.getBoundingClientRect();
    const scaleX = rect.width  / 1000;
    const scaleY = rect.height / 600;
    return {
      screenX: rect.left + pt.x * scaleX,
      screenY: rect.top  + pt.y * scaleY,
      svgPt: pt,
    };
  }

  function step(ts) {
    if (!startTime) startTime = ts;
    let t = Math.min((ts - startTime) / DURATION, 1);

    const cur  = getScreenPoint(t);
    const next = getScreenPoint(Math.min(t + 0.008, 1));
    const angle = Math.atan2(next.screenY - cur.screenY, next.screenX - cur.screenX) * 180 / Math.PI;

    plane.style.left      = cur.screenX + 'px';
    plane.style.top       = cur.screenY + 'px';
    plane.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      setTimeout(() => {
        startTime = null;
        requestAnimationFrame(step);
      }, PAUSE);
    }
  }

  requestAnimationFrame(step);
}

/* ──────────────────────────────────────────────────
   PÉTALOS
────────────────────────────────────────────────── */
const PETALS = ['🌸', '🌹', '✿', '❀', '🌺'];

function spawnPetal() {
  const container = document.getElementById('petals-container');
  const p = document.createElement('div');
  p.className = 'petal';
  p.textContent = PETALS[Math.floor(Math.random() * PETALS.length)];

  const startX  = Math.random() * window.innerWidth;
  const drift   = (Math.random() - 0.5) * 200;
  const rot     = Math.random() * 720 - 360;
  const dur     = 8 + Math.random() * 7;
  const size    = 10 + Math.random() * 10;
  const opacity = 0.45 + Math.random() * 0.45;

  p.style.left               = startX + 'px';
  p.style.fontSize           = size + 'px';
  p.style.opacity            = opacity;
  p.style.animationDuration  = dur + 's';
  p.style.setProperty('--drift', drift + 'px');
  p.style.setProperty('--rot',   rot + 'deg');

  container.appendChild(p);
  setTimeout(() => p.remove(), dur * 1000);
}

/* ──────────────────────────────────────────────────
   POPUP
────────────────────────────────────────────────── */
function openPopup() {
  document.getElementById('popup-overlay').classList.add('active');
  document.getElementById('popup').setAttribute('aria-hidden', 'false');
}

function closePopup() {
  document.getElementById('popup-overlay').classList.remove('active');
  document.getElementById('popup').setAttribute('aria-hidden', 'true');
}

function closePopupOutside(e) {
  if (e.target === document.getElementById('popup-overlay')) closePopup();
}

/* ──────────────────────────────────────────────────
   INIT
────────────────────────────────────────────────── */
function init() {
  buildMap();
  positionElements();
  updateFlightPath();

  /* Avión arranca tras una pequeña pausa */
  setTimeout(animatePlane, 1000);

  /* Pétalos: ráfaga inicial + lluvia continua */
  for (let i = 0; i < 8; i++) setTimeout(spawnPetal, i * 350);
  setInterval(spawnPetal, 700);
}

/* Espera a que las fuentes estén cargadas */
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(init);
} else {
  window.addEventListener('load', init);
}

/* Recalcular al redimensionar */
window.addEventListener('resize', () => {
  document.getElementById('map-bg').innerHTML = '';
  buildMap();
  positionElements();
  updateFlightPath();
});
