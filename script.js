/* ═══════════════════════════════════════════════
   Judit & Guillermo · Save the Date · 17.07.2027
   script.js
═══════════════════════════════════════════════ */

/* ──────────────────────────────────────────────
   COORDENADAS GEOGRÁFICAS → POSICIÓN EN EL SVG
   El world.svg tiene viewBox="0 0 2000 857"
   y usa proyección equirectangular estándar:
     x = (lon + 180) / 360 * 2000
     y = (90 - lat) / 180 * 857
────────────────────────────────────────────── */
function geoToSVG(lon, lat) {
  return {
    x: (lon + 180) / 360 * 2000,
    y: (90 - lat)  / 180 * 857,
  };
}

/* Coordenadas de las ciudades */
const BUE = geoToSVG(-58.38, -34.60);  // Buenos Aires
const BCN = geoToSVG(  2.15,  41.38);  // Barcelona

/* ──────────────────────────────────────────────
   CARGAR world.svg Y AJUSTAR COLORES
────────────────────────────────────────────── */
async function loadMap() {
  const res  = await fetch('images/world.svg');
  const text = await res.text();
  const parser = new DOMParser();
  const doc    = parser.parseFromString(text, 'image/svg+xml');
  const svg    = doc.querySelector('svg');

  /* Fondo oceánico */
  svg.style.background = 'transparent';

  /* Colores de los países */
  svg.querySelectorAll('path').forEach(p => {
    p.setAttribute('fill',   '#d4c4a0');
    p.setAttribute('stroke', '#b89a6a');
    p.setAttribute('stroke-width', '0.6');
  });

  /* Añadir rectángulo de fondo oceánico dentro del SVG */
  const ocean = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  ocean.setAttribute('x', '0');
  ocean.setAttribute('y', '0');
  ocean.setAttribute('width', '2000');
  ocean.setAttribute('height', '857');
  ocean.setAttribute('fill', '#a8c4d4');
  svg.insertBefore(ocean, svg.firstChild);

  document.getElementById('map-bg').appendChild(svg);
}

/* ──────────────────────────────────────────────
   POSICIONAR ELEMENTOS DOM sobre el mapa
   Necesitamos convertir coordenadas SVG (0-2000 × 0-857)
   a % de pantalla, teniendo en cuenta el CSS que escala
   y centra el SVG con width:200% y transform:translate(-50%,-50%)
────────────────────────────────────────────── */
function svgToScreen(svgX, svgY) {
  /* El SVG se renderiza al 200% del ancho de pantalla (width:200%),
     centrado horizontalmente y verticalmente.
     Ancho SVG real en px = window.innerWidth * 2
     Alto SVG real en px  = (857/2000) * window.innerWidth * 2 */
  const renderedW = window.innerWidth  * 2;
  const renderedH = (857 / 2000) * renderedW;

  /* Offset para centrar en pantalla */
  const offsetX = (window.innerWidth  - renderedW) / 2;
  const offsetY = (window.innerHeight - renderedH) / 2;

  const screenX = offsetX + (svgX / 2000) * renderedW;
  const screenY = offsetY + (svgY / 857)  * renderedH;

  return {
    pctX: (screenX / window.innerWidth)  * 100,
    pctY: (screenY / window.innerHeight) * 100,
  };
}

function positionElements() {
  const bue = svgToScreen(BUE.x, BUE.y);
  const bcn = svgToScreen(BCN.x, BCN.y);

  setPos('dot-bue',   bue.pctX, bue.pctY);
  setPos('label-bue', bue.pctX, bue.pctY + 2.5);

  setPos('dot-bcn',  bcn.pctX, bcn.pctY);
  setPos('ring1',    bcn.pctX, bcn.pctY);
  setPos('ring2',    bcn.pctX, bcn.pctY);
  setPos('label-bcn', bcn.pctX, bcn.pctY - 3.2);  /* etiqueta arriba del punto */
  setPos('tap-hint',  bcn.pctX, bcn.pctY + 3.0);
}

function setPos(id, pctX, pctY) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.left = pctX + '%';
  el.style.top  = pctY + '%';
}

/* ──────────────────────────────────────────────
   RUTA PUNTEADA (coordenadas SVG nativas 0-2000×857)
────────────────────────────────────────────── */
function drawFlightPath() {
  const pathEl = document.getElementById('flight-path');

  /* Arco hacia el norte sobre el Atlántico */
  const midX  = (BUE.x + BCN.x) / 2;
  const midY  = Math.min(BUE.y, BCN.y) - 200;  /* punto de control hacia arriba */
  const cp1x  = BUE.x + (BCN.x - BUE.x) * 0.2;
  const cp1y  = midY + 40;
  const cp2x  = BUE.x + (BCN.x - BUE.x) * 0.8;
  const cp2y  = midY + 40;

  pathEl.setAttribute('d',
    `M ${BUE.x} ${BUE.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${BCN.x} ${BCN.y}`
  );
}

/* ──────────────────────────────────────────────
   ANIMACIÓN DEL AVIÓN a lo largo de la ruta
────────────────────────────────────────────── */
function animatePlane() {
  const planeWrap = document.getElementById('plane-wrap');
  const pathEl    = document.getElementById('flight-path');
  const svgEl     = document.getElementById('route-svg');
  const DURATION  = 8000;
  const PAUSE     = 2500;
  let   startTime = null;

  function ease(t) {
    return t < 0.5 ? 2*t*t : -1 + (4-2*t)*t;
  }

  function step(ts) {
    if (!startTime) startTime = ts;
    const t   = Math.min((ts - startTime) / DURATION, 1);
    const et  = ease(t);
    const len = pathEl.getTotalLength();
    const pt  = pathEl.getPointAtLength(et * len);
    const pt2 = pathEl.getPointAtLength(Math.min((et + 0.006) * len, len));

    /* Convertir coordenadas SVG a pantalla */
    const rect   = svgEl.getBoundingClientRect();
    const scaleX = rect.width  / 2000;
    const scaleY = rect.height / 857;
    const sx = rect.left + pt.x * scaleX;
    const sy = rect.top  + pt.y * scaleY;
    const sx2 = rect.left + pt2.x * scaleX;
    const sy2 = rect.top  + pt2.y * scaleY;

    const angle = Math.atan2(sy2 - sy, sx2 - sx) * 180 / Math.PI;

    planeWrap.style.left      = sx + 'px';
    planeWrap.style.top       = sy + 'px';
    planeWrap.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      setTimeout(() => { startTime = null; requestAnimationFrame(step); }, PAUSE);
    }
  }

  requestAnimationFrame(step);
}

/* ──────────────────────────────────────────────
   PÉTALOS SVG + PARTÍCULAS DE LUZ (canvas)
────────────────────────────────────────────── */
const canvas = document.getElementById('petal-canvas');
const ctx    = canvas.getContext('2d');

/* Formas de pétalos SVG como Path2D */
const PETAL_SHAPES = [
  /* Pétalo 1: elipse alargada */
  (s) => { const p = new Path2D(); p.ellipse(0, 0, s*0.45, s, 0, 0, Math.PI*2); return p; },
  /* Pétalo 2: lágrima */
  (s) => {
    const p = new Path2D();
    p.moveTo(0, -s);
    p.bezierCurveTo(s*0.7, -s*0.5, s*0.5, s*0.5, 0, s);
    p.bezierCurveTo(-s*0.5, s*0.5, -s*0.7, -s*0.5, 0, -s);
    return p;
  },
  /* Pétalo 3: rombo redondeado */
  (s) => {
    const p = new Path2D();
    p.moveTo(0, -s);
    p.quadraticCurveTo(s*0.6,  -s*0.2, 0,  s*0.9);
    p.quadraticCurveTo(-s*0.6, -s*0.2, 0, -s);
    return p;
  },
];

const PETAL_COLORS = [
  'rgba(242, 210, 220, ALPHA)',  /* rosa pálido */
  'rgba(255, 230, 240, ALPHA)',  /* rosa muy suave */
  'rgba(220, 190, 210, ALPHA)',  /* lila rosado */
  'rgba(245, 220, 200, ALPHA)',  /* crema cálido */
];

const PARTICLE_COLORS = [
  'rgba(220, 180, 80, ALPHA)',   /* dorado */
  'rgba(255, 220, 120, ALPHA)',  /* dorado claro */
  'rgba(200, 160, 60, ALPHA)',   /* dorado oscuro */
  'rgba(255, 245, 200, ALPHA)',  /* luz cálida */
];

let particles = [];

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

class Petal {
  constructor() { this.reset(true); }
  reset(initial = false) {
    this.x     = Math.random() * canvas.width;
    this.y     = initial ? Math.random() * canvas.height * -1 : -40;
    this.size  = 6 + Math.random() * 10;
    this.speedY = 0.6 + Math.random() * 0.9;
    this.speedX = (Math.random() - 0.5) * 0.8;
    this.rot   = Math.random() * Math.PI * 2;
    this.rotV  = (Math.random() - 0.5) * 0.025;
    this.alpha = 0.55 + Math.random() * 0.4;
    this.swing = Math.random() * Math.PI * 2;
    this.swingV = 0.018 + Math.random() * 0.012;
    this.shapeIdx = Math.floor(Math.random() * PETAL_SHAPES.length);
    this.colorTpl = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
    this.isPetal = true;
  }
  update() {
    this.swing += this.swingV;
    this.x    += this.speedX + Math.sin(this.swing) * 0.7;
    this.y    += this.speedY;
    this.rot  += this.rotV;
    if (this.y > canvas.height + 50) this.reset();
  }
  draw(ctx) {
    const color = this.colorTpl.replace('ALPHA', this.alpha.toFixed(2));
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.fillStyle = color;
    ctx.fill(PETAL_SHAPES[this.shapeIdx](this.size));
    ctx.restore();
  }
}

class Particle {
  constructor() { this.reset(true); }
  reset(initial = false) {
    this.x     = Math.random() * canvas.width;
    this.y     = initial ? Math.random() * canvas.height : canvas.height + 10;
    this.size  = 1.5 + Math.random() * 3;
    this.speedY = -(0.4 + Math.random() * 0.8);  /* sube */
    this.speedX = (Math.random() - 0.5) * 0.5;
    this.alpha = 0.4 + Math.random() * 0.55;
    this.alphaV = (Math.random() - 0.5) * 0.008;
    this.colorTpl = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
    this.shimmer = Math.random() * Math.PI * 2;
    this.shimmerV = 0.03 + Math.random() * 0.04;
    this.isPetal = false;
  }
  update() {
    this.x      += this.speedX;
    this.y      += this.speedY;
    this.alpha  += this.alphaV;
    this.shimmer += this.shimmerV;
    if (this.alpha > 0.95 || this.alpha < 0.1) this.alphaV *= -1;
    if (this.y < -20) this.reset();
  }
  draw(ctx) {
    const glow  = 0.5 + 0.5 * Math.sin(this.shimmer);
    const alpha = Math.max(0.05, this.alpha * glow);
    const color = this.colorTpl.replace('ALPHA', alpha.toFixed(2));
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    /* halo suave */
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = this.colorTpl.replace('ALPHA', (alpha * 0.18).toFixed(2));
    ctx.fill();
    ctx.restore();
  }
}

function initParticles() {
  particles = [];
  for (let i = 0; i < 28; i++) particles.push(new Petal());
  for (let i = 0; i < 22; i++) particles.push(new Particle());
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of particles) { p.update(); p.draw(ctx); }
  requestAnimationFrame(animateParticles);
}

/* ──────────────────────────────────────────────
   POPUP
────────────────────────────────────────────── */
function openPopup() {
  document.getElementById('popup-overlay').classList.add('active');
}
function closePopup() {
  document.getElementById('popup-overlay').classList.remove('active');
}
function closeOutside(e) {
  if (e.target === document.getElementById('popup-overlay')) closePopup();
}

/* Cerrar con Escape */
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopup(); });

/* ──────────────────────────────────────────────
   INIT
────────────────────────────────────────────── */
async function init() {
  resizeCanvas();
  await loadMap();
  positionElements();
  drawFlightPath();
  setTimeout(animatePlane, 900);
  initParticles();
  animateParticles();
}

window.addEventListener('resize', () => {
  resizeCanvas();
  positionElements();
  drawFlightPath();
});

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(init);
} else {
  window.addEventListener('load', init);
}
