// Escena 3D low-poly de tekorei.ai: Nico y Kori en un cuarto de noche.
// window.renderFrame(f) dibuja el cuadro f de la línea de tiempo (todo es función del tiempo).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const qs = new URLSearchParams(location.search);
const TL = await (await fetch(qs.get('tl') || 'build/timeline_ig.json')).json();
const MODO = qs.get('modo') || 'video';
const W = 1080, H = 1920, FPS = TL.fps;

// ------------------------------------------------------------------ utilidades
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const backOut = (t) => { t = clamp(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; };
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

const shotAt = (t) => TL.shots.find((s) => t >= s.start && t < s.end) || TL.shots[TL.shots.length - 1];
const lineAt = (t) => TL.lines.find((l) => t >= l.start - 0.02 && t <= l.end + 0.05) || null;
const lastLine = (t) => { let r = TL.lines[0]; for (const l of TL.lines) if (l.start - 0.06 <= t) r = l; return r; };
const lineIndex = (l) => TL.lines.indexOf(l);
const mouth = (who, t) => { const a = TL.mouth[who]; return a[clamp(Math.round(t * FPS), 0, a.length - 1)] || 0; };

// Valor que cambia con transición suave en ciertos instantes: keys = [[t, valor], ...]
function keyed(keys, t, dur = 0.3) {
  let i = -1;
  for (let k = 0; k < keys.length; k++) if (keys[k][0] <= t) i = k;
  if (i < 0) return keys[0][1];
  if (i === 0) return keys[0][1];
  const k = smooth((t - keys[i][0]) / dur);
  return lerp(keys[i - 1][1], keys[i][1], k);
}

function blinkFactor(t, seed) {
  for (let k = 0; k < 40; k++) {
    const tk = 0.9 + k * 2.7 + hash(k * 7 + seed) * 1.4;
    const u = (t - tk) / 0.15;
    if (u >= 0 && u <= 1) return 1 - 0.92 * Math.sin(Math.PI * u);
  }
  return 1;
}

// ------------------------------------------------------------------ render
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#121925');
scene.fog = new THREE.Fog('#121925', 4.2, 9);
const camera = new THREE.PerspectiveCamera(50, W / H, 0.02, 30);

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, metalness: 0, ...o });
function mesh(geo, material, pos = [0, 0, 0], parent = scene, sombra = true) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(...pos);
  m.castShadow = sombra;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function tex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

// ------------------------------------------------------------------ cuarto
const DESK_Y = 0.75;
mesh(new THREE.PlaneGeometry(10, 10), mat('#33261f', { roughness: 0.95 }), [0, 0, 0], scene, false).rotation.x = -Math.PI / 2;
mesh(new THREE.PlaneGeometry(10, 5), mat('#2a3445'), [0, 2.5, -1.4], scene, false);
const paredIzq = mesh(new THREE.PlaneGeometry(8, 5), mat('#232c3b'), [-1.9, 2.5, 1], scene, false);
paredIzq.rotation.y = Math.PI / 2;
mesh(new THREE.BoxGeometry(10, 0.12, 0.03), mat('#1a212c'), [0, 0.06, -1.385], scene, false);

// ventana con cielo nocturno
const cielo = tex(512, 640, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#08112b'); gr.addColorStop(0.65, '#1b3768'); gr.addColorStop(1, '#2c4e82');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 140; i++) {
    g.fillStyle = `rgba(255,255,255,${0.35 + hash(i + 7) * 0.65})`;
    g.beginPath(); g.arc(hash(i) * w, hash(i + 50) * h * 0.65, hash(i + 99) * 1.7 + 0.4, 0, 7); g.fill();
  }
  const mg = g.createRadialGradient(350, 150, 10, 350, 150, 120);
  mg.addColorStop(0, 'rgba(255,246,214,0.85)'); mg.addColorStop(1, 'rgba(255,246,214,0)');
  g.fillStyle = mg; g.fillRect(180, 0, 340, 320);
  g.fillStyle = '#fff4d2'; g.beginPath(); g.arc(350, 150, 44, 0, 7); g.fill();
  for (let i = 0; i < 15; i++) {
    const bw = 34 + hash(i + 300) * 50, bh = 70 + hash(i + 400) * 190, x = i * 37 - 12;
    g.fillStyle = '#0a1222'; g.fillRect(x, h - bh, bw, bh);
    for (let wy = h - bh + 12; wy < h - 8; wy += 17)
      for (let wx = x + 6; wx < x + bw - 8; wx += 12)
        if (hash(wx * 3.1 + wy * 1.7) > 0.7) { g.fillStyle = '#ffcf73'; g.fillRect(wx, wy, 5, 8); }
  }
});
const ventana = new THREE.Group();
ventana.position.set(-0.78, 1.52, -1.39);
scene.add(ventana);
mesh(new THREE.PlaneGeometry(0.74, 0.92), new THREE.MeshBasicMaterial({ map: cielo, color: '#c7d3ee', toneMapped: false }), [0, 0, 0.004], ventana, false);
const marco = mat('#cfc7b6', { roughness: 0.6 });
for (const [x, y, w, h] of [[0, 0.48, 0.84, 0.06], [0, -0.48, 0.84, 0.06], [-0.4, 0, 0.06, 1.02], [0.4, 0, 0.06, 1.02], [0, 0, 0.03, 0.92], [0, 0.06, 0.74, 0.03]])
  mesh(new THREE.BoxGeometry(w, h, 0.05), marco, [x, y, 0.02], ventana);
mesh(new THREE.BoxGeometry(0.92, 0.04, 0.13), marco, [0, -0.51, 0.06], ventana);

// letrero de neón
const neon = tex(1024, 256, (g, w, h) => {
  g.font = '700 150px Montserrat, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = '#3ee6f2'; g.shadowBlur = 40; g.fillStyle = '#c8fbff';
  for (let i = 0; i < 3; i++) g.fillText('tekorei.ai', w / 2, h / 2 + 6);
});
mesh(new THREE.PlaneGeometry(0.66, 0.165), new THREE.MeshBasicMaterial({ map: neon, transparent: true, toneMapped: false }), [0.4, 1.66, -1.385], scene, false);
const luzNeon = new THREE.PointLight('#3ee6f2', 0.12, 2.2, 2);
luzNeon.position.set(0.4, 1.62, -1.2);
scene.add(luzNeon);

// reloj 23:47
const reloj = tex(256, 112, (g, w, h) => {
  g.fillStyle = '#0b0d10'; g.fillRect(0, 0, w, h);
  g.font = '700 74px "JetBrains Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = '#ff4d3d'; g.shadowBlur = 18; g.fillStyle = '#ff6b55'; g.fillText('23:47', w / 2, h / 2 + 4);
});
const despertador = new THREE.Group();
despertador.position.set(0.2, 1.275, -1.27);
despertador.rotation.y = -0.1;
scene.add(despertador);
mesh(new THREE.BoxGeometry(0.17, 0.085, 0.07), mat('#15181d', { roughness: 0.5 }), [0, 0.0425, 0], despertador);
mesh(new THREE.PlaneGeometry(0.15, 0.066), new THREE.MeshBasicMaterial({ map: reloj, toneMapped: false }), [0, 0.045, 0.0355], despertador, false);

// repisa con libros y planta
mesh(new THREE.BoxGeometry(0.86, 0.03, 0.22), mat('#7a5135'), [0.55, 1.26, -1.29]);
const coloresLibro = ['#c0504d', '#4f81bd', '#e7b84a', '#8064a2', '#5aa36a', '#d9773a', '#3d8e9a'];
let bx = 0.3;
for (let i = 0; i < 7; i++) {
  const ancho = 0.035 + hash(i + 3) * 0.025, alto = 0.17 + hash(i + 11) * 0.08;
  const libro = mesh(new THREE.BoxGeometry(ancho, alto, 0.15), mat(coloresLibro[i % coloresLibro.length]), [bx + ancho / 2, 1.275 + alto / 2, -1.29]);
  if (i === 6) libro.rotation.z = -0.25;
  bx += ancho + 0.004;
}
mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.08, 7), mat('#d8d1c4'), [0.86, 1.315, -1.29]);
for (let i = 0; i < 6; i++) {
  const hoja = mesh(new THREE.IcosahedronGeometry(0.045, 0), mat('#4fae5c'), [0.86 + (hash(i) - 0.5) * 0.08, 1.38 + hash(i + 5) * 0.07, -1.29 + (hash(i + 9) - 0.5) * 0.06]);
  hoja.scale.set(1, 1.4, 1);
  hoja.rotation.set(hash(i) * 3, hash(i + 1) * 3, hash(i + 2) * 3);
}

// escritorio
const madera = mat('#8a5a3a', { roughness: 0.7 });
mesh(new THREE.BoxGeometry(1.76, 0.05, 0.82), madera, [0, DESK_Y - 0.025, 0]);
mesh(new THREE.BoxGeometry(1.7, 0.66, 0.03), mat('#6a432d'), [0, 0.38, 0.385]);
for (const x of [-0.84, 0.84]) mesh(new THREE.BoxGeometry(0.05, 0.72, 0.78), mat('#6a432d'), [x, 0.36, 0]);

// laptop: la pantalla mira a Nico; la cámara ve la tapa con un sticker de Kori
const laptop = new THREE.Group();
laptop.position.set(-0.3, DESK_Y, -0.24);
scene.add(laptop);
mesh(new THREE.BoxGeometry(0.38, 0.018, 0.26), mat('#30343b', { roughness: 0.45, metalness: 0.35 }), [0, 0.009, 0], laptop);
const tapa = new THREE.Group();
tapa.position.set(0, 0.018, 0.128);
tapa.rotation.x = 0.3;
laptop.add(tapa);
mesh(new THREE.BoxGeometry(0.38, 0.25, 0.012), mat('#3a3f47', { roughness: 0.45, metalness: 0.35 }), [0, 0.125, 0], tapa);
const sticker = tex(256, 256, (g, w, h) => {
  g.fillStyle = '#7fe1ec'; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill();
  rr(g, 58, 70, 140, 110, 28); g.fillStyle = '#0a1218'; g.fill();
  g.fillStyle = '#e9feff'; rr(g, 88, 100, 22, 34, 8); g.fill(); rr(g, 146, 100, 22, 34, 8); g.fill();
});
mesh(new THREE.CircleGeometry(0.045, 20), new THREE.MeshStandardMaterial({ map: sticker, roughness: 0.5 }), [0.08, 0.15, 0.0065], tapa, false);
const luzPantalla = new THREE.PointLight('#bfe4ff', 0.22, 1.2, 2);
luzPantalla.position.set(-0.3, 1.22, -0.12);
scene.add(luzPantalla);

// hojas, tazas, libros y lámpara sobre el escritorio
const hoja = tex(256, 362, (g, w, h) => {
  g.fillStyle = '#efece4'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#9aa3ad';
  g.fillRect(24, 26, 130, 12);
  for (let y = 60; y < h - 20; y += 16) g.fillRect(24, y, (w - 48) * (0.55 + hash(y) * 0.45), 5);
  g.strokeStyle = '#d0473c'; g.lineWidth = 3; g.beginPath(); g.ellipse(170, 150, 50, 22, -0.2, 0, 7); g.stroke();
});
const papel = new THREE.MeshStandardMaterial({ map: hoja, roughness: 0.9 });
for (const [x, z, r, i] of [[0.06, 0.12, 0.35, 0], [-0.62, 0.08, -0.45, 1], [0.2, -0.22, 0.95, 2], [-0.05, 0.25, -0.12, 3], [0.62, -0.02, 0.2, 4], [-0.48, -0.28, 0.6, 5]]) {
  const p = mesh(new THREE.BoxGeometry(0.21, 0.002, 0.297), papel, [x, DESK_Y + 0.002 + i * 0.0012, z], scene, false);
  p.rotation.y = r;
}
function taza(x, z, color) {
  const g = new THREE.Group(); g.position.set(x, DESK_Y, z); scene.add(g);
  mesh(new THREE.CylinderGeometry(0.042, 0.036, 0.095, 10), mat(color, { roughness: 0.4 }), [0, 0.0475, 0], g);
  const asa = mesh(new THREE.TorusGeometry(0.025, 0.008, 5, 10), mat(color, { roughness: 0.4 }), [0.045, 0.05, 0], g);
  asa.rotation.y = Math.PI / 2;
  mesh(new THREE.CircleGeometry(0.036, 12), mat('#3b2216'), [0, 0.09, 0], g, false).rotation.x = -Math.PI / 2;
}
taza(-0.66, 0.16, '#e9e4dc');
taza(0.7, 0.2, '#d24f45');
for (let i = 0; i < 3; i++) {
  const l = mesh(new THREE.BoxGeometry(0.24, 0.045, 0.17), mat(['#4f81bd', '#e7b84a', '#c0504d'][i]), [0.66, DESK_Y + 0.0225 + i * 0.045, -0.26]);
  l.rotation.y = (hash(i + 20) - 0.5) * 0.3;
}
const lampara = new THREE.Group();
lampara.position.set(-0.82, DESK_Y, -0.14);
scene.add(lampara);
const metal = mat('#2f6f78', { roughness: 0.45, metalness: 0.3 });
mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.02, 12), metal, [0, 0.01, 0], lampara);
const brazo1 = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.34, 6), metal, [0.04, 0.17, 0.02], lampara);
brazo1.rotation.z = -0.25;
const brazo2 = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.26, 6), metal, [0.16, 0.37, 0.07], lampara);
brazo2.rotation.z = -1.05;
const pantallaLampara = mesh(new THREE.ConeGeometry(0.085, 0.12, 10, 1, true), new THREE.MeshStandardMaterial({ color: '#2f6f78', roughness: 0.5, side: THREE.DoubleSide, flatShading: true }), [0.27, 0.4, 0.1], lampara);
pantallaLampara.rotation.z = 0.55;
mesh(new THREE.SphereGeometry(0.028, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff1cf' }), [0.28, 0.36, 0.1], lampara, false);
const foco = new THREE.SpotLight('#ffb36e', 1.0, 3, 0.7, 0.7, 2);
foco.position.set(-0.55, DESK_Y + 0.36, -0.04);
foco.target.position.set(-0.15, DESK_Y, 0.18);
foco.castShadow = true;
foco.shadow.mapSize.set(1024, 1024);
foco.shadow.bias = -0.0005;
scene.add(foco, foco.target);

// silla detrás de Nico
mesh(new THREE.BoxGeometry(0.52, 0.66, 0.09), mat('#1d2129'), [-0.3, 1.06, -0.93]);
mesh(new THREE.BoxGeometry(0.06, 0.6, 0.095), mat('#2bb7c4'), [-0.3, 1.08, -0.928]);

// polvo en la luz de la lámpara
const nPolvo = 90;
const polvoBase = [];
const polvoGeo = new THREE.BufferGeometry();
const polvoPos = new Float32Array(nPolvo * 3);
for (let i = 0; i < nPolvo; i++) polvoBase.push([-0.65 + hash(i) * 1.3, 0.8 + hash(i + 31) * 0.9, -0.6 + hash(i + 77) * 0.9]);
polvoGeo.setAttribute('position', new THREE.BufferAttribute(polvoPos, 3));
scene.add(new THREE.Points(polvoGeo, new THREE.PointsMaterial({ color: '#ffd9a8', size: 0.006, transparent: true, opacity: 0.55, depthWrite: false })));

// luces generales
scene.add(new THREE.HemisphereLight('#7084c0', '#2a1f18', 1.7));
const luna = new THREE.DirectionalLight('#9db8ff', 1.5);
luna.position.set(-1.4, 2.6, -2.6);
luna.target.position.set(0, 0.9, 0);
luna.castShadow = true;
luna.shadow.mapSize.set(1024, 1024);
luna.shadow.camera.left = -1.5; luna.shadow.camera.right = 1.5; luna.shadow.camera.top = 1.5; luna.shadow.camera.bottom = -1.5;
luna.shadow.bias = -0.0006;
scene.add(luna, luna.target);
const relleno = new THREE.DirectionalLight('#ffe7d1', 0.75);
relleno.position.set(0.6, 1.6, 3);
scene.add(relleno);

// ------------------------------------------------------------------ Nico
const piel = mat('#c88a5f', { roughness: 0.75 });
const buzo = mat('#ec7430', { roughness: 0.9 });
const buzoOscuro = mat('#c45a1f', { roughness: 0.9 });
const pelo = mat('#2a1a12', { roughness: 0.95 });
const oscuro = mat('#262b33', { roughness: 0.6 });

const nico = new THREE.Group();
nico.position.set(-0.3, 0, -0.64);
scene.add(nico);
const tronco = new THREE.Group();
tronco.position.set(0, 0.78, 0);
nico.add(tronco);
mesh(new THREE.CylinderGeometry(0.19, 0.235, 0.46, 8), buzo, [0, 0.21, 0], tronco).scale.set(1, 1, 0.82);
mesh(new THREE.SphereGeometry(0.21, 9, 6), buzo, [0, 0.41, 0], tronco).scale.set(1.18, 0.44, 0.82);
const capucha = mesh(new THREE.TorusGeometry(0.11, 0.05, 6, 12), buzoOscuro, [0, 0.455, -0.075], tronco);
capucha.rotation.x = Math.PI / 2 * 0.8;
for (const sx of [-0.045, 0.045]) mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.13, 5), mat('#f1ede4'), [sx, 0.33, 0.155], tronco).rotation.x = 0.12;
const vincha = mesh(new THREE.TorusGeometry(0.105, 0.019, 6, 16, Math.PI * 1.3), oscuro, [0, 0.47, 0.01], tronco);
vincha.rotation.set(Math.PI / 2, 0, Math.PI * 0.35);
for (const sx of [-1, 1]) {
  const cup = mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.04, 12), mat('#353b45', { roughness: 0.5 }), [sx * 0.112, 0.455, 0.035], tronco);
  cup.rotation.z = Math.PI / 2;
  const aro = mesh(new THREE.TorusGeometry(0.047, 0.006, 4, 14), mat('#2bb7c4'), [sx * 0.135, 0.455, 0.035], tronco);
  aro.rotation.y = Math.PI / 2;
}
mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 8), piel, [0, 0.5, 0], tronco);

const cuello = new THREE.Group();
cuello.position.set(0, 0.52, 0);
tronco.add(cuello);
const cabeza = new THREE.Group();
cabeza.position.set(0, 0.15, 0.012);
cuello.add(cabeza);
mesh(new THREE.IcosahedronGeometry(0.155, 2), piel, [0, 0, 0], cabeza).scale.set(1, 1.08, 0.97);
mesh(new THREE.IcosahedronGeometry(0.115, 2), piel, [0, -0.066, 0.026], cabeza).scale.set(1.04, 0.78, 0.95);
for (const sx of [-1, 1]) mesh(new THREE.SphereGeometry(0.032, 6, 5), piel, [sx * 0.152, -0.008, -0.004], cabeza).scale.set(0.55, 1, 0.8);
// pelo rizado: bolitas low-poly sobre la parte de arriba y de atrás
const bolita = new THREE.IcosahedronGeometry(1, 0);
for (let i = 0; i < 46; i++) {
  const theta = hash(i * 3.3 + 1) * Math.PI * 2;
  const frente = Math.cos(theta) > 0.35;
  const phi = hash(i * 5.1 + 2) * (frente ? 0.78 : 1.55);
  const r = 0.158;
  const p = [r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi) + 0.012, r * Math.sin(phi) * Math.cos(theta)];
  const b = mesh(bolita, pelo, p, cabeza);
  const s = 0.046 + hash(i + 70) * 0.026;
  b.scale.set(s, s * 0.9, s);
  b.rotation.set(hash(i) * 6, hash(i + 1) * 6, hash(i + 2) * 6);
}
for (const [x, y, z] of [[-0.07, 0.115, 0.115], [0.0, 0.13, 0.12], [0.075, 0.11, 0.11], [-0.035, 0.155, 0.09], [0.04, 0.16, 0.088]]) {
  const b = mesh(bolita, pelo, [x, y, z], cabeza);
  b.scale.setScalar(0.05);
  b.rotation.set(x * 30, y * 20, z * 10);
}
// ojos
const blancoOjo = new THREE.MeshStandardMaterial({ color: '#f7f4ee', roughness: 0.3 });
const iris = new THREE.MeshStandardMaterial({ color: '#3b2415', roughness: 0.3 });
const pupila = new THREE.MeshBasicMaterial({ color: '#0a0605' });
const brillo = new THREE.MeshBasicMaterial({ color: '#ffffff' });
const ojos = [];
for (const sx of [-1, 1]) {
  const ojo = new THREE.Group();
  ojo.position.set(sx * 0.057, 0.012, 0.13);
  cabeza.add(ojo);
  mesh(new THREE.SphereGeometry(0.033, 14, 10), blancoOjo, [0, 0, 0], ojo, false).scale.set(1, 1.18, 0.55);
  const centro = new THREE.Group();
  ojo.add(centro);
  mesh(new THREE.SphereGeometry(0.021, 14, 10), iris, [0, 0, 0.011], centro, false).scale.set(1, 1.15, 0.5);
  mesh(new THREE.SphereGeometry(0.011, 10, 8), pupila, [0, 0, 0.018], centro, false).scale.set(1, 1.1, 0.4);
  mesh(new THREE.SphereGeometry(0.006, 8, 6), brillo, [0.008, 0.011, 0.022], centro, false);
  const ceja = mesh(new THREE.BoxGeometry(0.056, 0.012, 0.014), pelo, [sx * 0.057, 0.07, 0.139], cabeza, false);
  ojos.push({ ojo, centro, ceja, sx });
}
const nariz = mesh(new THREE.ConeGeometry(0.019, 0.04, 4), mat('#b77850'), [0, -0.024, 0.152], cabeza, false);
nariz.rotation.x = Math.PI / 2;
const boca = mesh(new THREE.SphereGeometry(0.027, 12, 8), new THREE.MeshStandardMaterial({ color: '#3d1512', roughness: 0.6 }), [0, -0.074, 0.134], cabeza, false);
const sonrisa = mesh(new THREE.TorusGeometry(0.022, 0.0045, 4, 12, Math.PI), new THREE.MeshStandardMaterial({ color: '#4a1d17' }), [0, -0.066, 0.139], cabeza, false);
sonrisa.rotation.z = Math.PI;
for (const sx of [-1, 1]) {
  const cachete = mesh(new THREE.SphereGeometry(0.024, 8, 6), new THREE.MeshStandardMaterial({ color: '#e07e6b', transparent: true, opacity: 0.35, roughness: 0.8 }), [sx * 0.088, -0.038, 0.118], cabeza, false);
  cachete.scale.set(1, 0.6, 0.4);
}
// brazos con IK de dos huesos
const L1 = 0.3, L2 = 0.29;
function capsula(radio, largo, material, parent) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(radio, largo, 3, 8), material);
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
const brazos = [-1, 1].map((sx) => ({
  sx,
  hombro: v3(sx * 0.205, 0.38, 0.0),
  sup: capsula(0.052, L1, buzo, tronco),
  ant: capsula(0.048, L2, buzo, tronco),
  mano: mesh(new THREE.SphereGeometry(0.043, 8, 6), piel, [0, 0, 0], tronco),
}));
const ARRIBA = v3(0, 1, 0);
function codo(S, M, polo) {
  const d = M.clone().sub(S);
  const dist = Math.min(d.length(), L1 + L2 - 0.002);
  const dir = d.normalize();
  const a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist);
  const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const pp = polo.clone().sub(dir.clone().multiplyScalar(polo.dot(dir))).normalize();
  return { E: S.clone().addScaledVector(dir, a).addScaledVector(pp, h), M: S.clone().addScaledVector(dir, dist) };
}
function hueso(m, a, b) {
  const d = b.clone().sub(a);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(ARRIBA, d.normalize());
}
function ponerBrazo(b, manoLocal) {
  const polo = v3(b.sx * 1, -0.6, -0.7).normalize();
  const { E, M } = codo(b.hombro, manoLocal, polo);
  hueso(b.sup, b.hombro, E);
  hueso(b.ant, E, M);
  b.mano.position.copy(M);
}

// ------------------------------------------------------------------ Kori
const kori = new THREE.Group();
kori.position.set(0.14, DESK_Y, -0.05);
scene.add(kori);
const koriCuerpo = new THREE.Group();
kori.add(koriCuerpo);
const vidrio = new THREE.MeshStandardMaterial({ color: '#86e3ee', roughness: 0.22, metalness: 0.05, flatShading: true, emissive: '#0d6f7b', emissiveIntensity: 0.45 });
mesh(new RoundedBoxGeometry(0.3, 0.26, 0.24, 2, 0.055), vidrio, [0, 0.19, 0], koriCuerpo);
mesh(new RoundedBoxGeometry(0.255, 0.198, 0.02, 2, 0.03), mat('#0d1b22', { roughness: 0.3 }), [0, 0.195, 0.115], koriCuerpo);
const caraCanvas = document.createElement('canvas');
caraCanvas.width = 512; caraCanvas.height = 384;
const caraTex = new THREE.CanvasTexture(caraCanvas);
caraTex.colorSpace = THREE.SRGBColorSpace;
const cara = new THREE.Mesh(new THREE.PlaneGeometry(0.236, 0.177), new THREE.MeshBasicMaterial({ map: caraTex, transparent: true, toneMapped: false }));
cara.position.set(0, 0.195, 0.1265);
koriCuerpo.add(cara);
const antena = new THREE.Group();
antena.position.set(0, 0.318, 0);
koriCuerpo.add(antena);
mesh(new THREE.CylinderGeometry(0.007, 0.009, 0.075, 6), mat('#9eabb8', { metalness: 0.4, roughness: 0.4 }), [0, 0.037, 0], antena);
const puntaMat = new THREE.MeshStandardMaterial({ color: '#ff8a3d', emissive: '#ff7a1f', emissiveIntensity: 2 });
mesh(new THREE.SphereGeometry(0.021, 12, 8), puntaMat, [0, 0.085, 0], antena, false);
const luzPunta = new THREE.PointLight('#ff8a3d', 0.03, 0.7, 2);
luzPunta.position.set(0, 0.085, 0);
antena.add(luzPunta);
const luzKori = new THREE.PointLight('#5fe8f2', 0.15, 1.1, 2);
luzKori.position.set(0, 0.2, 0.22);
koriCuerpo.add(luzKori);
const brazoMat = mat('#5ccad7', { roughness: 0.3 });
const koriBrazos = [-1, 1].map((sx) => {
  const g = new THREE.Group();
  g.position.set(sx * 0.158, 0.2, 0.0);
  koriCuerpo.add(g);
  mesh(new RoundedBoxGeometry(0.042, 0.11, 0.06, 1, 0.016), brazoMat, [sx * 0.012, -0.05, 0], g);
  return { g, sx };
});
for (const sx of [-0.075, 0.075]) mesh(new RoundedBoxGeometry(0.06, 0.06, 0.075, 1, 0.016), mat('#36535f'), [sx, 0.03, 0], kori);

// Cara de Kori (también se usa en el mini avatar de las pantallas)
function dibujarCara(g, w, h, s) {
  g.clearRect(0, 0, w, h);
  const k = w / 512;
  g.save();
  g.scale(k, k);
  rr(g, 6, 6, 500, 372, 70);
  g.fillStyle = '#081218'; g.fill();
  g.globalAlpha = 0.08; g.fillStyle = '#7ff3ff';
  for (let y = 18; y < 370; y += 7) g.fillRect(18, y, 476, 2);
  g.globalAlpha = 1;
  const ex = [180 + s.mirar * 18, 332 + s.mirar * 18], ey = 162;
  g.shadowColor = '#7ff3ff'; g.shadowBlur = 26;
  g.fillStyle = '#eafeff'; g.strokeStyle = '#eafeff'; g.lineCap = 'round';
  const feliz = s.expr === 'happy' || s.expr === 'excited';
  ex.forEach((x, i) => {
    const guino = s.expr === 'wink' && i === 1;
    if (feliz || guino) {
      g.lineWidth = 24; g.beginPath(); g.arc(x, ey + 28, 40, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
    } else {
      const alto = Math.max(10, 112 * s.parpadeo);
      rr(g, x - 35, ey - alto / 2, 70, alto, Math.min(26, alto / 2)); g.fill();
      if (alto > 50) { g.save(); g.shadowBlur = 0; g.fillStyle = '#081218'; rr(g, x + 6, ey - alto / 2 + 14, 16, 22, 6); g.fill(); g.restore(); }
    }
  });
  if (s.expr === 'determined') {
    g.save(); g.shadowBlur = 0; g.fillStyle = '#081218';
    g.beginPath(); g.moveTo(ex[0] - 50, ey - 70); g.lineTo(ex[0] + 45, ey - 70); g.lineTo(ex[0] + 45, ey - 18); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(ex[1] + 50, ey - 70); g.lineTo(ex[1] - 45, ey - 70); g.lineTo(ex[1] - 45, ey - 18); g.closePath(); g.fill();
    g.restore();
  }
  if (s.expr === 'excited') {
    g.save(); g.shadowColor = '#ffd23f'; g.fillStyle = '#ffd23f';
    for (const [x, y, r] of [[96, 70, 16], [420, 80, 13], [440, 250, 10]]) {
      g.beginPath();
      for (let a = 0; a < 8; a++) { const rad = a % 2 ? r * 0.38 : r; g.lineTo(x + Math.cos(a * Math.PI / 4) * rad, y + Math.sin(a * Math.PI / 4) * rad); }
      g.closePath(); g.fill();
    }
    g.restore();
  }
  g.shadowBlur = 0; g.fillStyle = 'rgba(255,120,175,0.6)';
  for (const x of [ex[0] - 52, ex[1] + 22]) { g.fillRect(x, ey + 72, 14, 14); g.fillRect(x + 18, ey + 72, 14, 14); }
  g.shadowColor = '#7ff3ff'; g.shadowBlur = 18; g.fillStyle = '#eafeff'; g.strokeStyle = '#eafeff';
  const m = s.boca;
  if (m < 0.07) {
    g.lineWidth = 13; g.beginPath(); g.arc(256 + s.mirar * 10, 262, feliz ? 38 : 30, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
  } else {
    const mh = 14 + 70 * m, mw = 58 + 16 * m;
    rr(g, 256 + s.mirar * 10 - mw / 2, 268 - mh / 2, mw, mh, Math.min(mh / 2, 24)); g.fill();
    if (m > 0.35) { g.shadowBlur = 0; g.fillStyle = '#ff6f98'; rr(g, 256 + s.mirar * 10 - mw / 3, 268 + mh / 2 - 18, mw * 0.66, 12, 6); g.fill(); }
  }
  g.restore();
}

// ------------------------------------------------------------------ estados por tiempo
const PLANOS = {
  WIDE: { pos: v3(0.0, 1.28, 2.2), mira: v3(-0.06, 1.1, -0.3), fov: 44 },
  WIDE_KORI: { pos: v3(0.08, 1.22, 1.7), mira: v3(-0.03, 1.08, -0.2), fov: 44 },
  MS_NICO: { pos: v3(-0.18, 1.42, 0.95), mira: v3(-0.3, 1.36, -0.64), fov: 34 },
  CU_NICO: { pos: v3(-0.22, 1.47, 0.55), mira: v3(-0.3, 1.4, -0.64), fov: 32 },
  CU_KORI: { pos: v3(0.24, 1.05, 1.75), mira: v3(0.15, 0.87, -0.05), fov: 32 },
  CTA: { pos: v3(0.24, 1.1, 1.7), mira: v3(0.15, 0.84, -0.05), fov: 32 },
  INSERT_QUIZ: { pos: v3(0.0, 1.28, 2.2), mira: v3(-0.06, 1.1, -0.3), fov: 44 },
  INSERT_CITE: { pos: v3(0.0, 1.28, 2.2), mira: v3(-0.06, 1.1, -0.3), fov: 44 },
};

const EXPR_NICO = {
  tired: { cejaRot: 0.32, cejaY: 0.004, ojo: 0.78, boca: 0, roll: 0.0, triste: 1 },
  hopeful: { cejaRot: 0.14, cejaY: 0.012, ojo: 1.05, boca: 0, roll: 0.09 },
  suspicious: { cejaRot: -0.28, cejaY: 0.0, ojo: 0.62, boca: 0, roll: -0.1, asim: 0.018, triste: 0.5 },
  curious: { cejaRot: 0.08, cejaY: 0.01, ojo: 1.0, boca: 0, roll: 0.05 },
  listen: { cejaRot: 0.0, cejaY: 0.0, ojo: 1.0, boca: 0, roll: 0.0 },
  impressed: { cejaRot: 0.1, cejaY: 0.016, ojo: 1.1, boca: 0.0, roll: 0.03 },
  surprised: { cejaRot: 0.12, cejaY: 0.022, ojo: 1.18, boca: 0.5, roll: -0.04 },
  happy: { cejaRot: 0.05, cejaY: 0.012, ojo: 0.86, boca: 0.0, roll: 0.06, sonrisa: 1 },
};

// Cómo reacciona Nico mientras Kori habla, según la línea
function reaccionNico(idx) {
  const l = TL.lines[idx];
  if (!l) return 'listen';
  if (l.who === 'nico') return l.expr;
  return { 1: 'listen', 3: 'impressed', 4: 'impressed', 6: 'impressed', 8: 'surprised', 9: 'happy' }[idx] || 'listen';
}

function estadoNico(t) {
  const actual = lastLine(t);
  const idx = lineIndex(actual);
  const nombre = reaccionNico(idx);
  const previo = reaccionNico(idx - 1);
  const k = smooth((t - (actual.start - 0.06)) / 0.3);
  const A = EXPR_NICO[previo] || EXPR_NICO.listen, B = EXPR_NICO[nombre] || EXPR_NICO.listen;
  const mezcla = {};
  for (const key of ['cejaRot', 'cejaY', 'ojo', 'boca', 'roll', 'asim', 'sonrisa', 'triste']) mezcla[key] = lerp(A[key] || 0, B[key] || 0, k);
  return { ...mezcla, idx, habla: actual.who === 'nico' && t <= actual.end + 0.05 };
}

function manosNico(t) {
  // posiciones locales de las manos (izquierda de pantalla = brazo sx -1)
  const reposo = [v3(-0.1, 0.785, 0.38), v3(0.11, 0.785, 0.37)];
  const teclear = (i) => 0.006 * Math.max(0, Math.sin(t * 17 + i * 2.1));
  const poses = {
    rest: [reposo[0], reposo[1]],
    ask: [v3(-0.04, 0.98, 0.42), reposo[1]],
    chin: [reposo[0], v3(0.03, 1.36, 0.2)],
    shrug: [v3(-0.2, 0.93, 0.36), v3(0.21, 0.93, 0.35)],
    yay: [v3(-0.27, 1.3, 0.22), v3(0.28, 1.32, 0.21)],
  };
  const keys = [[0, 'rest']];
  TL.lines.forEach((l, i) => {
    const pose = i === 2 ? 'ask' : i === 7 ? 'shrug' : 'rest';
    keys.push([l.start - 0.1, pose]);
  });
  let a = 'rest', b = 'rest', t0 = 0;
  for (const [tk, p] of keys) if (tk <= t) { a = b; b = p; t0 = tk; }
  const k = smooth((t - t0) / 0.35);
  return [0, 1].map((i) => {
    const m = poses[a][i].clone().lerp(poses[b][i], k);
    if (b === 'rest') m.y += teclear(i) * (1 - k * 0);
    if (b === 'yay') { m.y += 0.03 * Math.sin(t * 9 + i * 2); m.x += 0.02 * Math.sin(t * 7 + i); }
    return m;
  });
}

// Kori: hacia dónde mira y cuánto salta
function yawHacia(objX, objZ) { return Math.atan2(objX - kori.position.x, objZ - kori.position.z); }

function estadoKori(t, plano) {
  const actual = lastLine(t);
  const habla = actual.who === 'kori' && t <= actual.end + 0.05;
  let expr = 'normal';
  if (habla) expr = actual.expr;
  if (actual.expr === 'wink' && habla && t > actual.start + 0.9) expr = 'happy';
  if (!habla && lineIndex(actual) >= 8) expr = 'happy';
  const cam = PLANOS[plano.type].pos;
  let yaw;
  if (plano.type === 'CU_KORI' || plano.type === 'CTA') yaw = yawHacia(cam.x, cam.z);
  else if (habla) yaw = -0.35;
  else yaw = -0.78;
  return { habla, expr, yaw };
}

// ------------------------------------------------------------------ actualización por cuadro
const ctxCara = caraCanvas.getContext('2d');

function actualizar(t) {
  const plano = shotAt(t);
  const P = PLANOS[plano.type];
  const prog = (t - plano.start) / Math.max(0.2, plano.end - plano.start);
  const pos = P.pos.clone().lerp(P.mira, 0.075 * smooth(prog));
  pos.x += Math.sin(t * 1.3) * 0.004; pos.y += Math.sin(t * 1.7 + 1) * 0.003;
  camera.position.copy(pos);
  camera.fov = P.fov;
  camera.updateProjectionMatrix();
  camera.lookAt(P.mira);

  // Nico
  const en = estadoNico(t);
  const mn = mouth('nico', t);
  const arranque = 0.7 * (1 - smooth((t - 0.05) / 0.55)); // al inicio está desplomado sobre el escritorio
  tronco.rotation.x = 0.36 * arranque + 0.015 * Math.sin(t * 1.6);
  tronco.scale.set(1, 1 + 0.008 * Math.sin(t * 2.2), 1);
  const habla = en.habla;
  const cerca = plano.type === 'CU_NICO' || plano.type === 'MS_NICO';
  const mirarKori = habla ? (cerca ? 0.22 : 0.42) : 0.5;
  const bajar = habla ? (cerca ? 0.06 : 0.14) : 0.2;
  cuello.rotation.x = 0.75 * arranque + bajar * (1 - arranque) + (habla ? 0.05 * (mn - 0.3) : 0) + 0.02 * Math.sin(t * 1.1);
  cuello.rotation.y = mirarKori * (1 - arranque) + 0.03 * Math.sin(t * 0.9);
  cuello.rotation.z = en.roll + 0.015 * Math.sin(t * 1.3);
  const parp = blinkFactor(t, 3);
  ojos.forEach(({ ojo, centro, ceja, sx }) => {
    ojo.scale.set(1, en.ojo * parp, 1);
    centro.position.x = 0.006 * (1 - arranque);
    centro.position.y = -0.004 * (1 - arranque);
    ceja.rotation.z = -sx * en.cejaRot;
    ceja.position.y = 0.07 + en.cejaY + (en.asim ? sx * en.asim : 0) - (1 - en.ojo) * 0.015;
  });
  const abierta = Math.max(habla ? mn : 0, en.boca);
  boca.scale.set(1 + 0.15 * abierta, 0.12 + 0.95 * abierta, 0.45);
  boca.visible = abierta > 0.06;
  sonrisa.visible = !boca.visible;
  sonrisa.scale.set(1 + 0.35 * (en.sonrisa || 0), 1 - 1.4 * (en.triste || 0), 1);
  sonrisa.position.y = -0.066 - 0.012 * (en.triste || 0);
  tronco.updateMatrix();
  const aTronco = tronco.matrix.clone().invert();
  const manos = manosNico(t);
  brazos.forEach((b, i) => ponerBrazo(b, manos[i].applyMatrix4(aTronco)));

  // Kori
  const ek = estadoKori(t, plano);
  const mk = mouth('kori', t);
  kori.rotation.y = ek.yaw + 0.06 * Math.sin(t * 1.4);
  let salto = 0;
  for (const l of TL.lines) if (l.who === 'kori') { const u = (t - l.start + 0.05) / 0.3; if (u > 0 && u < 1) salto += 0.03 * Math.sin(Math.PI * u); }
  const fiesta = plano.type === 'CTA' ? Math.abs(Math.sin((t - plano.start) * 7.5)) * 0.045 : 0;
  koriCuerpo.position.y = 0.006 * Math.sin(t * 2.3) + salto + fiesta;
  koriCuerpo.scale.set(1 - 0.015 * mk, 1 + 0.03 * mk, 1);
  koriCuerpo.rotation.z = (ek.habla ? 0.04 * Math.sin(t * 3.1) : 0.02 * Math.sin(t * 1.2)) + (ek.expr === 'wink' ? 0.08 : 0);
  let bamboleo = 0.05 * Math.sin(t * 2.6);
  for (const l of TL.lines) if (l.who === 'kori') { const d = t - l.start; if (d > 0 && d < 1.5) bamboleo += 0.35 * Math.exp(-d / 0.3) * Math.sin(d * 20); }
  antena.rotation.z = bamboleo;
  puntaMat.emissiveIntensity = 1.6 + 2.2 * mk;
  luzPunta.intensity = 0.03 + 0.06 * mk;
  koriBrazos.forEach(({ g, sx }, i) => {
    let r = 0.15;
    if (ek.habla) r += 0.45 * mk + 0.25 * Math.max(0, Math.sin(t * 5 + i * 2.5));
    if (plano.type === 'CTA') r = 2.3 + 0.35 * Math.sin(t * 13 + i * Math.PI);
    g.rotation.z = -sx * r;
  });
  dibujarCara(ctxCara, 512, 384, {
    expr: ek.expr,
    parpadeo: blinkFactor(t, 11),
    boca: ek.habla ? mk : 0,
    mirar: plano.type === 'CU_KORI' || plano.type === 'CTA' ? 0 : -0.8,
  });
  caraTex.needsUpdate = true;

  // polvo
  for (let i = 0; i < nPolvo; i++) {
    const b = polvoBase[i];
    polvoPos[i * 3] = b[0] + 0.03 * Math.sin(t * 0.3 + i);
    polvoPos[i * 3 + 1] = b[1] + 0.04 * Math.sin(t * 0.21 + i * 1.7);
    polvoPos[i * 3 + 2] = b[2] + 0.03 * Math.cos(t * 0.25 + i * 0.7);
  }
  polvoGeo.attributes.position.needsUpdate = true;
  return { plano, mk };
}

// ------------------------------------------------------------------ capas 2D
const $ = (id) => document.getElementById(id);
function contorno(px, color = '#0a0f15') {
  const s = [];
  for (let a = 0; a < 16; a++) s.push(`${(Math.cos(a / 16 * Math.PI * 2) * px).toFixed(1)}px ${(Math.sin(a / 16 * Math.PI * 2) * px).toFixed(1)}px 0 ${color}`);
  s.push(`0 ${px + 5}px 0 rgba(0,0,0,.35)`);
  return s.join(',');
}
$('hook').style.textShadow = contorno(8);
$('pill').style.textShadow = contorno(5);
document.querySelector('.c1').style.textShadow = contorno(7);
$('ctaSub').style.textShadow = contorno(6);
document.querySelector('.handle').style.textShadow = contorno(5);
const resaltar = new Set(TL.gancho_resaltar);
$('hook').innerHTML = TL.gancho.map((linea) => linea.split(' ').map((w) => (resaltar.has(w) ? `<em>${w}</em>` : w)).join(' ')).join('<br>');
$('ctaSub').textContent = TL.events.cta.tarjeta + (TL.version === 'ig' ? ' 📩' : ' 📌');
$('ctaWord').textContent = TL.palabra;

const ruido = document.createElement('canvas');
ruido.width = ruido.height = 256;
{
  const g = ruido.getContext('2d');
  const img = g.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) { const v = hash(i * 0.37) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0);
}
$('grain').style.backgroundImage = `url(${ruido.toDataURL()})`;

const miniCtx = $('mini').getContext('2d');
let ultimoBloque = '';

function capas(t, plano, f) {
  // subtítulos palabra por palabra
  let html = '';
  const ocultar = MODO === 'portada' || plano.type === 'CTA';
  if (!ocultar) {
    for (const l of TL.lines) for (const c of l.chunks) {
      if (t >= c.s - 0.02 && t < c.e) {
        html = c.words.map((w) => {
          const u = (t - w.s + 0.03) / 0.09;
          if (u < 0) return '';
          const esc = 0.82 + 0.18 * backOut(u);
          return `<span class="w${w.hi ? ' hi' : ''}" style="transform:scale(${esc.toFixed(3)})">${w.w}</span>`;
        }).join('');
      }
    }
  }
  if (html !== ultimoBloque) { $('pill').innerHTML = html; ultimoBloque = html; }

  // pantallas de la terminal
  const esQuiz = plano.type === 'INSERT_QUIZ', esCita = plano.type === 'INSERT_CITE';
  const enInsert = esQuiz || esCita;
  $('insert').style.display = enInsert ? 'block' : 'none';
  canvas.style.filter = enInsert ? `blur(${(10 * smooth((t - plano.start) / 0.15)).toFixed(1)}px) brightness(0.5) saturate(0.85)` : 'none';
  if (enInsert) {
    const u = (t - plano.start) / 0.22;
    const win = esQuiz ? $('quiz') : $('cite');
    $('quiz').style.display = esQuiz ? 'block' : 'none';
    $('cite').style.display = esCita ? 'block' : 'none';
    win.style.opacity = clamp(u * 1.6).toFixed(3);
    win.style.transform = `translateY(${(40 * (1 - smooth(u))).toFixed(1)}px) scale(${(0.9 + 0.1 * backOut(u)).toFixed(3)})`;
    if (esQuiz) {
      const ev = TL.events.quiz;
      $('qtyped').textContent = t >= ev.type + 0.18 ? 'b' : '';
      $('optB').className = t >= ev.type + 0.27 ? 'sel' : '';
      $('qcaret').style.visibility = Math.floor(t * 2.2) % 2 === 0 ? 'visible' : 'hidden';
      const ok = (t - ev.ok) / 0.2;
      $('qok').style.opacity = ok > 0 ? '1' : '0';
      $('qok').style.transform = `scale(${ok > 0 ? (0.9 + 0.1 * backOut(ok)).toFixed(3) : 1})`;
    } else {
      const ev = TL.events.cite;
      const on = (t - ev.chip) / 0.35;
      $('chip').className = on > 0 ? 'chip on' : 'chip';
      $('chip').style.transform = `scale(${on > 0 && on < 1 ? (1 + 0.1 * Math.sin(Math.PI * on)).toFixed(3) : 1})`;
    }
    dibujarMini(t);
  }

  // cierre
  const enCta = plano.type === 'CTA' && MODO !== 'portada';
  $('cta').style.display = enCta ? 'block' : 'none';
  if (enCta) {
    const ev = TL.events.cta;
    const u = (t - ev.start) / 0.38;
    $('cta').style.opacity = clamp(u * 2).toFixed(3);
    $('cta').style.transform = `scale(${(0.55 + 0.45 * backOut(u)).toFixed(3)})`;
    const w = t - ev.word;
    const sacudida = w > 0 && w < 0.7 ? Math.sin(w * 28) * 5 * Math.exp(-w / 0.22) : 0;
    const pulso = 1 + 0.035 * Math.sin(t * 6);
    $('ctaWord').style.transform = `rotate(${sacudida.toFixed(2)}deg) scale(${(pulso + (w > 0 && w < 0.4 ? 0.12 * Math.sin(Math.PI * w / 0.4) : 0)).toFixed(3)})`;
  }

  const dock = smooth((t - 3.0) / 0.35);
  $('hook').style.transform = `translateY(${(-26 * dock).toFixed(1)}px) scale(${(1 - 0.28 * dock).toFixed(3)})`;
  $('grain').style.transform = `translate(${Math.round(hash(f) * 60 - 30)}px, ${Math.round(hash(f + 0.5) * 60 - 30)}px)`;
}

function dibujarMini(t) {
  const g = miniCtx;
  g.clearRect(0, 0, 340, 300);
  g.save();
  const bob = 4 * Math.sin(t * 6);
  g.translate(0, bob);
  const gr = g.createLinearGradient(0, 0, 0, 300);
  gr.addColorStop(0, '#9becf5'); gr.addColorStop(1, '#4fc3d1');
  rr(g, 20, 40, 300, 240, 56); g.fillStyle = gr; g.fill();
  g.fillStyle = '#9eabb8'; g.fillRect(166, 6, 8, 36);
  g.fillStyle = '#ff8a3d'; g.beginPath(); g.arc(170, 10, 12, 0, 7); g.fill();
  g.restore();
  const tmp = mini2;
  dibujarCara(tmp.getContext('2d'), 256, 192, { expr: 'happy', parpadeo: blinkFactor(t, 11), boca: mouth('kori', t), mirar: 0 });
  g.drawImage(tmp, 42, 66 + bob, 256, 192);
}
const mini2 = document.createElement('canvas');
mini2.width = 256; mini2.height = 192;

// ------------------------------------------------------------------ API para el renderizador
await document.fonts.ready;
await Promise.all(['800 40px Montserrat', '900 40px Montserrat', '400 30px "JetBrains Mono"', '700 30px "JetBrains Mono"'].map((f) => document.fonts.load(f)));
window.renderFrame = (f) => {
  const t = f / FPS;
  const { plano } = actualizar(t);
  renderer.render(scene, camera);
  capas(t, plano, f);
  return true;
};
window.totalFrames = TL.frames;
window.ctaFrame = Math.floor((TL.events.cta.start - 0.06) * FPS);
window.listo = true;
