// Escena del video de Vemquro: laptop en un cuarto oscuro, con la web en pantalla, estilo del video de referencia.
// window.renderFrame(n) dibuja el cuadro n (60 fps). La pantalla se alimenta con la grabación de la web (?web=carpeta)
// o con una imagen fija para pruebas (?fija=archivo.jpg).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { crearPlan } from './plan.js';

const W = 1080, H = 1920, FPS = 60, CM = 0.01, VFOV = 44;
const qs = new URLSearchParams(location.search);
const WEB = qs.get('web');
const FIJA = qs.get('fija');

const tiempos = await (await fetch('tiempos.json')).json();
let meta = null;
if (WEB) {
  const r = await fetch(`${WEB}/meta.json`);
  if (r.ok) meta = await r.json();
}
const plan = crearPlan(tiempos, meta);
window.duracion = plan.duracion;
window.totalCuadros = Math.ceil(plan.duracion * FPS);

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261120);
const deg = THREE.MathUtils.degToRad;

// ------------------------------------------------------------------ render
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;   // la web se ve con sus colores reales
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;   // luces y objetos quietos: la sombra se calcula una vez
renderer.shadowMap.needsUpdate = true;
RectAreaLightUniformsLib.init();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020203);
scene.fog = new THREE.Fog(0x020203, 0.75, 2.6);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const camera = new THREE.PerspectiveCamera(VFOV, W / H, 0.01, 30);

// ------------------------------------------------------------------ escritorio de madera oscura
function texturaMadera() {
  const c = document.createElement('canvas');
  c.width = c.height = 2048;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 2048, 2048);
  grad.addColorStop(0, '#2b1a11'); grad.addColorStop(0.5, '#24160e'); grad.addColorStop(1, '#2e1c12');
  g.fillStyle = grad; g.fillRect(0, 0, 2048, 2048);
  for (let i = 0; i < 520; i++) {
    const y = rnd() * 2048, oscuro = rnd() < 0.55;
    g.strokeStyle = oscuro ? `rgba(10,5,3,${0.05 + rnd() * 0.12})` : `rgba(92,58,34,${0.04 + rnd() * 0.09})`;
    g.lineWidth = 0.6 + rnd() * 4.5;
    g.beginPath();
    const f1 = 0.002 + rnd() * 0.003, f2 = 0.01 + rnd() * 0.02, a1 = 4 + rnd() * 14, ph = rnd() * 6.28;
    for (let x = 0; x <= 2048; x += 16) {
      const yy = y + Math.sin(x * f1 + ph) * a1 + Math.sin(x * f2 + ph * 2) * 1.6;
      if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy);
    }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1.6, 1.6);
  t.anisotropy = 8;
  return t;
}
const mesa = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6),
  new THREE.MeshStandardMaterial({ map: texturaMadera(), roughness: 0.58, metalness: 0, envMapIntensity: 0.04 }));
mesa.rotation.x = -Math.PI / 2;
mesa.position.z = 0.2;
mesa.receiveShadow = true;
scene.add(mesa);
// pared del fondo, casi negra
const pared = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), new THREE.MeshStandardMaterial({ color: 0x07070a, roughness: 0.95, envMapIntensity: 0.02 }));
pared.position.set(0, 1.2, -0.62);
scene.add(pared);

// ------------------------------------------------------------------ laptop (14", medidas reales)
const laptop = new THREE.Group();
scene.add(laptop);
const alu = new THREE.MeshStandardMaterial({ color: 0x2c2f34, metalness: 0.88, roughness: 0.3, envMapIntensity: 0.16 });
const aluClaro = new THREE.MeshStandardMaterial({ color: 0x2f3237, metalness: 0.75, roughness: 0.45, envMapIntensity: 0.12 });
const negro = new THREE.MeshStandardMaterial({ color: 0x0b0c0e, metalness: 0.1, roughness: 0.55, envMapIntensity: 0.12 });

const BASE_W = 31.3 * CM, BASE_H = 1.45 * CM, BASE_D = 22.1 * CM;
const base = new THREE.Mesh(new RoundedBoxGeometry(BASE_W, BASE_H, BASE_D, 4, 0.55 * CM), alu);
base.position.y = BASE_H / 2;
base.castShadow = base.receiveShadow = true;
laptop.add(base);
const ARRIBA = BASE_H;

const hueco = new THREE.Mesh(new THREE.PlaneGeometry(28.4 * CM, 11.6 * CM), negro);
hueco.rotation.x = -Math.PI / 2;
hueco.position.set(0, ARRIBA + 0.0002, -4.35 * CM);
laptop.add(hueco);

// teclas (ANSI simplificado, 15 unidades por fila)
const filas = [
  { d: 0.9, u: Array(15).fill(1) },
  { d: 1.62, u: [...Array(13).fill(1), 2] },
  { d: 1.62, u: [1.5, ...Array(12).fill(1), 1.5] },
  { d: 1.62, u: [1.75, ...Array(11).fill(1), 2.25] },
  { d: 1.62, u: [2.25, ...Array(10).fill(1), 2.75] },
  { d: 1.62, u: [1, 1, 1, 1.25, 5.5, 1.25, 1, 1, 1, 1] },
];
const PASO = 27.6 / 15, HUECO_TECLA = 0.22;
let nTeclas = 0;
filas.forEach((f) => (nTeclas += f.u.length));
const teclas = new THREE.InstancedMesh(new RoundedBoxGeometry(1, 1, 1, 2, 0.14), new THREE.MeshStandardMaterial({
  color: 0x0d0e10, metalness: 0.05, roughness: 0.5, envMapIntensity: 0.18 }), nTeclas);
teclas.castShadow = true;
{
  const m = new THREE.Matrix4();
  let i = 0, z = -9.75;
  for (const f of filas) {
    let x = -13.8;
    for (const u of f.u) {
      const w = u * PASO - HUECO_TECLA;
      m.compose(new THREE.Vector3((x + (u * PASO) / 2) * CM, ARRIBA + 0.1 * CM, (z + f.d / 2) * CM),
        new THREE.Quaternion(), new THREE.Vector3(w * CM, 0.2 * CM, f.d * CM));
      teclas.setMatrixAt(i++, m);
      x += u * PASO;
    }
    z += f.d + HUECO_TECLA;
  }
}
laptop.add(teclas);

const trackpad = new THREE.Mesh(new RoundedBoxGeometry(13.4 * CM, 0.04 * CM, 8.4 * CM, 2, 0.35 * CM), aluClaro);
trackpad.position.set(0, ARRIBA + 0.005 * CM, 5.9 * CM);
trackpad.receiveShadow = true;
laptop.add(trackpad);

// tapa: gira sobre la bisagra, abierta a 110°
const bisagra = new THREE.Group();
bisagra.position.set(0, ARRIBA - 0.1 * CM, -BASE_D / 2 + 0.55 * CM);
bisagra.rotation.x = -deg(20);
laptop.add(bisagra);
const TAPA_H = 21.0 * CM;
const tapa = new THREE.Mesh(new RoundedBoxGeometry(BASE_W, TAPA_H, 0.55 * CM, 4, 0.25 * CM), alu);
tapa.position.set(0, TAPA_H / 2, -0.275 * CM);
tapa.castShadow = true;
bisagra.add(tapa);
const vidrio = new THREE.Mesh(new THREE.PlaneGeometry(30.8 * CM, TAPA_H - 0.5 * CM), new THREE.MeshPhysicalMaterial({
  color: 0x040405, roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 0.1 }));
vidrio.position.set(0, TAPA_H / 2, 0.003 * CM);
bisagra.add(vidrio);

const DW = 29.6 * CM, DH = 18.5 * CM;   // pantalla 16:10
const pantallaTex = new THREE.Texture();
pantallaTex.colorSpace = THREE.SRGBColorSpace;
pantallaTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
pantallaTex.minFilter = THREE.LinearMipmapLinearFilter;
const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(DW, DH), new THREE.MeshBasicMaterial({ map: pantallaTex, toneMapped: false, color: new THREE.Color(0.93, 0.93, 0.93) }));
pantalla.position.set(0, 1.25 * CM + DH / 2, 0.02 * CM);
bisagra.add(pantalla);

// la pantalla ilumina el teclado, la mesa y las manos de la escena
const luzPantalla = new THREE.RectAreaLight(0xffffff, 4, DW, DH);
luzPantalla.position.copy(pantalla.position).add(new THREE.Vector3(0, 0, 0.3 * CM));
luzPantalla.rotation.y = Math.PI;
if (qs.get('rect') !== '0') bisagra.add(luzPantalla);

laptop.rotation.y = deg(0);

// ------------------------------------------------------------------ objetos: taza y jarrón impreso en 3D
function taza() {
  const g = new THREE.Group();
  const perfil = [[0, 0], [3.6, 0], [3.9, 0.4], [4.0, 9.2], [3.75, 9.4], [3.55, 9.2], [3.45, 0.9], [0, 0.9]]
    .map(([r, y]) => new THREE.Vector2(r * CM, y * CM));
  const ceramica = new THREE.MeshPhysicalMaterial({ color: 0x1c1d21, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.2, envMapIntensity: 0.4 });
  const cuerpo = new THREE.Mesh(new THREE.LatheGeometry(perfil, 64), ceramica);
  cuerpo.castShadow = true;
  g.add(cuerpo);
  const asa = new THREE.Mesh(new THREE.TorusGeometry(2.4 * CM, 0.55 * CM, 16, 48, Math.PI * 1.15), ceramica);
  asa.position.set(4.0 * CM, 4.8 * CM, 0);
  asa.rotation.z = -Math.PI * 0.575;
  asa.castShadow = true;
  g.add(asa);
  const cafe = new THREE.Mesh(new THREE.CircleGeometry(3.45 * CM, 48), new THREE.MeshPhysicalMaterial({
    color: 0x1a0d06, roughness: 0.08, clearcoat: 1, envMapIntensity: 0.6 }));
  cafe.rotation.x = -Math.PI / 2;
  cafe.position.y = 8.1 * CM;
  g.add(cafe);
  return g;
}
const miTaza = taza();
miTaza.position.set(25 * CM, 0, 13 * CM);
miTaza.rotation.y = deg(-35);
scene.add(miTaza);

function jarronImpreso() {
  // capas visibles, 8 lados con giro: el típico jarrón impreso en PLA
  const CAPAS = 150, LADOS = 8, SEG = 96, ALTO = 17 * CM;
  const pos = [], idx = [];
  for (let c = 0; c <= CAPAS; c++) {
    const v = c / CAPAS;
    const r0 = (4.4 + 2.1 * Math.sin(Math.PI * (0.15 + v * 0.95)) - 1.2 * v) * CM;
    const capa = 1 + 0.012 * (c % 2 === 0 ? 1 : -1);                  // líneas de capa
    const giro = v * 1.1;
    for (let s = 0; s <= SEG; s++) {
      const a = (s / SEG) * Math.PI * 2;
      const sector = Math.PI * 2 / LADOS;
      const rel = ((((a - giro) % sector) + sector) % sector) - sector / 2;
      const rPoly = (r0 * Math.cos(sector / 2)) / Math.cos(rel);
      const r = rPoly * capa;
      pos.push(Math.cos(a) * r, v * ALTO, Math.sin(a) * r);
    }
  }
  for (let c = 0; c < CAPAS; c++) for (let s = 0; s < SEG; s++) {
    const a = c * (SEG + 1) + s, b = a + SEG + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const pla = new THREE.MeshPhysicalMaterial({ color: 0x9e1823, roughness: 0.5, metalness: 0, sheen: 0.3,
    sheenColor: new THREE.Color(0xff5a66), clearcoat: 0.25, clearcoatRoughness: 0.3, envMapIntensity: 0.35, side: THREE.DoubleSide });
  const m = new THREE.Mesh(geo, pla);
  m.castShadow = true;
  return m;
}
const jarron = jarronImpreso();
jarron.position.set(27 * CM, 0, -15 * CM);
jarron.scale.setScalar(0.82);
scene.add(jarron);

// ------------------------------------------------------------------ luces
scene.add(new THREE.HemisphereLight(0x1b2233, 0x0b0705, 0.06));
const clave = new THREE.SpotLight(0xffc48a, 9, 4, deg(28), 0.85, 2);
clave.position.set(-0.85, 1.05, 0.55);
clave.target.position.set(0, 0.05, 0);
clave.castShadow = true;
clave.shadow.mapSize.set(2048, 2048);
clave.shadow.bias = -0.0004;
clave.shadow.radius = 4;
scene.add(clave, clave.target);
// contraluz frío solo sobre el borde de la tapa (foco angosto: no tiñe la mesa)
const contra = new THREE.SpotLight(0x9fb4ff, 3.2, 3, deg(9), 1, 2);
contra.position.set(0.55, 0.75, -1.0);
contra.target.position.set(0, 0.2, -0.13);
scene.add(contra, contra.target);
// luz cálida que levanta el jarrón impreso en 3D
const lamparaJarron = new THREE.SpotLight(0xffa36a, 1.4, 1.6, deg(14), 0.9, 2);
lamparaJarron.position.set(0.05, 0.6, 0.25);
lamparaJarron.target.position.set(0.27, 0.07, -0.15);
scene.add(lamparaJarron, lamparaJarron.target);

// ------------------------------------------------------------------ fondo: luces desenfocadas de la habitación
function texturaBokeh() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,.85)');
  gr.addColorStop(0.8, 'rgba(255,255,255,.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
const bokehTex = texturaBokeh();
const coloresBokeh = [0xffa25e, 0xff3b4d, 0x5f7dff, 0xffd08a, 0xff6a3d];
for (let i = 0; i < 22; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: bokehTex, color: coloresBokeh[i % coloresBokeh.length],
    transparent: true, opacity: 0.1 + rnd() * 0.22, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  const z = -2.2 - rnd() * 2.6;
  s.position.set((rnd() - 0.5) * 3.4, 0.25 + rnd() * 1.5, z);
  const tam = 0.18 + rnd() * 0.42;
  s.scale.set(tam, tam, 1);
  scene.add(s);
}

// ------------------------------------------------------------------ posproceso: bloom suave, viñeta y grano
const MSAA = Number(qs.get('msaa') ?? 4);
const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: MSAA });
const composer = new EffectComposer(renderer, rt);
composer.setPixelRatio(1);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.2, 0.5, 0.9);
if (qs.get('bloom') !== '0') composer.addPass(bloom);
const grado = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTiempo: { value: 0 }, uOscuro: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTiempo; uniform float uOscuro; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 d = vUv - 0.5;
      float ca = 0.0012 * dot(d, d) * 4.0;
      vec3 c = vec3(texture2D(tDiffuse, vUv + d * ca).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - d * ca).b);
      float vig = smoothstep(0.95, 0.28, length(d * vec2(1.0, 0.82)));
      c *= mix(0.55, 1.0, vig);
      c *= 1.0 - uOscuro;
      float g = hash(vUv * vec2(1080.0, 1920.0) + fract(uTiempo * 7.0) * 100.0) - 0.5;
      c += g * 0.018;
      gl_FragColor = vec4(c, 1.0);
    }`,
});
composer.addPass(grado);
composer.addPass(new OutputPass());

// ------------------------------------------------------------------ pantalla: cuadros de la web
const chico = document.createElement('canvas');
chico.width = 16; chico.height = 10;
const chicoCtx = chico.getContext('2d', { willReadFrequently: true });
let ultimaUrl = null;
async function ponerPantalla(url) {
  if (url === ultimaUrl) return;
  const img = new Image();
  img.src = url;
  await img.decode();
  pantallaTex.image = img;
  pantallaTex.needsUpdate = true;
  ultimaUrl = url;
  // color promedio de la pantalla para la luz que tira sobre el teclado
  chicoCtx.drawImage(img, 0, 0, 16, 10);
  const d = chicoCtx.getImageData(0, 0, 16, 10).data;
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
  const n = d.length / 4;
  const lin = (v) => Math.pow(v / n / 255, 2.2);
  const c = new THREE.Color(lin(r), lin(g), lin(b));
  const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  const m = Math.max(c.r, c.g, c.b, 1e-4);
  luzPantalla.color.setRGB(c.r / m, c.g / m, c.b / m);
  luzPantalla.intensity = 1.2 + 26 * lum;
}

// ------------------------------------------------------------------ cámara
const C = new THREE.Vector3(), R = new THREE.Vector3(), U = new THREE.Vector3(), N = new THREE.Vector3();
function medirPantalla() {
  scene.updateMatrixWorld(true);
  pantalla.getWorldPosition(C);
  const q = pantalla.getWorldQuaternion(new THREE.Quaternion());
  R.set(1, 0, 0).applyQuaternion(q);
  U.set(0, 1, 0).applyQuaternion(q);
  N.set(0, 0, 1).applyQuaternion(q);
}
medirPantalla();

const HFOV = 2 * Math.atan(Math.tan(deg(VFOV / 2)) * (W / H));
function estado(spec) {
  const [u0, v0, u1, v1] = spec.zona;
  const uc = (u0 + u1) / 2, vc = (v0 + v1) / 2;
  const P = C.clone().addScaledVector(R, (uc - 0.5) * DW).addScaledVector(U, (0.5 - vc) * DH);
  const ancho = Math.max(0.05, u1 - u0) * DW;
  const d = ancho / spec.relleno / 2 / Math.tan(HFOV / 2);
  const dir = N.clone().applyAxisAngle(R, -deg(spec.elev)).applyAxisAngle(new THREE.Vector3(0, 1, 0), deg(spec.az));
  const pos = P.clone().addScaledVector(dir, d);
  const obj = P.clone();
  const m = new THREE.Matrix4().lookAt(pos, obj, new THREE.Vector3(0, 1, 0));
  const arribaCam = new THREE.Vector3().setFromMatrixColumn(m, 1);
  const altoCuadro = 2 * d * Math.tan(deg(VFOV / 2));
  const delta = (0.5 - spec.y) * altoCuadro;
  pos.addScaledVector(arribaCam, -delta);
  obj.addScaledVector(arribaCam, -delta);
  return { pos, obj };
}
const claves = plan.camara.map((k) => ({ t: k.t, ...estado(k), suave: k.suave }));
const suave = (x) => x * x * x * (x * (x * 6 - 15) + 10);           // smootherstep
const salida = (x) => 1 - Math.pow(1 - x, 3);
function ponerCamara(t) {
  let i = 0;
  while (i < claves.length - 2 && t >= claves[i + 1].t) i++;
  const a = claves[i], b = claves[i + 1];
  const x = THREE.MathUtils.clamp((t - a.t) / Math.max(1e-6, b.t - a.t), 0, 1);
  const e = i === 0 ? salida(x) : suave(x);
  const pos = a.pos.clone().lerp(b.pos, e);
  const obj = a.obj.clone().lerp(b.obj, e);
  // pulso de cámara en mano (muy sutil)
  pos.x += 0.0013 * Math.sin(t * 1.31 + 0.5) + 0.0006 * Math.sin(t * 2.93 + 1.7) + 0.00025 * Math.sin(t * 7.1);
  pos.y += 0.0011 * Math.sin(t * 1.07 + 2.1) + 0.0005 * Math.sin(t * 3.31 + 0.4) + 0.00025 * Math.sin(t * 6.7 + 1.0);
  pos.z += 0.0008 * Math.sin(t * 0.91 + 1.3) + 0.0004 * Math.sin(t * 2.27 + 2.2);
  camera.position.copy(pos);
  camera.lookAt(obj);
}

// ------------------------------------------------------------------ capa 2D: subtítulos, precios, DM y cierre
const $ = (id) => document.getElementById(id);
const subs = $('subs');
subs.style.top = `${plan.subsY}px`;
const ease = (x) => 1 - Math.pow(1 - THREE.MathUtils.clamp(x, 0, 1), 3);
const rebote = (x) => {
  x = THREE.MathUtils.clamp(x, 0, 1);
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
let grupoActual = null;
function ponerCapa(t) {
  // subtítulos
  const g = plan.grupos.find((x) => t >= x.desde && t < x.hasta);
  if (g !== grupoActual) {
    subs.innerHTML = g ? g.palabras.map((p) => `<span class="w${p.clave ? ' key' : ''}">${p.texto}</span>`).join(' ') : '';
    grupoActual = g;
  }
  if (g) {
    const k = rebote((t - g.desde) / 0.16);
    subs.style.transform = `translateY(-50%) scale(${0.82 + 0.18 * k})`;
    subs.style.opacity = String(ease((t - g.desde) / 0.06));
    [...subs.children].forEach((el, i) => el.classList.toggle('on', t >= g.palabras[i].s));
  }

  // precios
  const pr = plan.precios;
  $('precios').style.opacity = String(Math.min(ease((t - pr.desde) / 0.25), 1 - ease((t - pr.hasta) / 0.3)));
  for (const f of pr.filas) {
    const k = ease((t - f.t) / 0.4);
    const el = $(f.id);
    el.style.opacity = String(k);
    el.style.transform = `translateY(${(1 - k) * 46}px) scale(${0.96 + 0.04 * k})`;
    const kp = rebote((t - f.tp) / 0.3);
    const p = $(f.pill);
    p.style.opacity = String(ease((t - f.tp) / 0.12));
    p.style.transform = `scale(${0.7 + 0.3 * kp})`;
  }

  // mensaje "WEB"
  const dm = plan.dm;
  $('dm').style.opacity = String(Math.min(ease((t - dm.desde) / 0.25), 1 - ease((t - dm.hasta) / 0.25)));
  const kb = rebote((t - dm.burbuja) / 0.36);
  $('burbuja').style.transform = `scale(${t < dm.burbuja ? 0 : kb})`;
  $('visto').style.opacity = String(ease((t - dm.burbuja - 0.55) / 0.2));

  // cierre
  const kc = ease((t - plan.cierre.desde) / 0.6);
  $('cierre').style.opacity = String(kc);
  $('cierre').style.transform = `scale(${1.04 - 0.04 * kc})`;
  $('cierre-linea').style.width = `${420 * ease((t - plan.cierre.desde - 0.35) / 0.7)}px`;
  grado.uniforms.uOscuro.value = 0.45 * kc;
}

// ------------------------------------------------------------------ arranque
const ultimoWeb = meta ? meta.cuadros - 1 : 0;
if (FIJA) await ponerPantalla(FIJA);
else if (WEB) await ponerPantalla(`${WEB}/w_00000.jpg`);
await document.fonts.ready;

window.renderFrame = async (n) => {
  const t = n / FPS;
  if (WEB) await ponerPantalla(`${WEB}/w_${String(Math.min(n, ultimoWeb)).padStart(5, '0')}.jpg`);
  ponerCamara(t);
  ponerCapa(t);
  grado.uniforms.uTiempo.value = t;
  composer.render();
  return true;
};
window.listo = true;
