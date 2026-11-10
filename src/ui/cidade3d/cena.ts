import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Pure three.js diorama of Nova Lumen: nine lots on a 3x3 grid, roads, traffic, drones, dust. No React.

export interface PontoCena { id: string; hue: number; aberto: boolean }
export interface Tela { x: number; y: number; z: number; v: boolean }
export interface Cena {
  tela: Record<string, Tela>; // projected label anchor per place id, in CSS px relative to the canvas
  definir(pontos: PontoCena[], atual: string, alvo?: string): boolean; // true when something visible changed
  hover(id: string | null): void;
  mirar(nx: number, ny: number): void; // parallax, -1..1
  ajustar(w: number, h: number, dpr: number): void;
  quadro(dt: number): void;
  escolher(cx: number, cy: number): string | null;
  descartar(): void;
}

const PX = 12, PZ = 10, HX = 20.5, HZ = 17.5, TOPO = 0.12;
const XS = [-18, -6, 6, 18], ZS = [-15, -5, 5, 15];
const GRADE: Record<string, [number, number]> = {
  apartamento: [0, 0], agencia: [1, 0], educacao: [2, 0],
  academia: [0, 1], praca: [1, 1], shopping: [2, 1],
  banco: [0, 2], posto: [1, 2], viaduto: [2, 2],
};
const CIANO = 0x7df9ff, AMBAR = 0xffb020;

// --- look knobs: cel shading, ink + neon outlines, night lighting (lengths in world units)
const DEGRAUS = [14, 56, 150, 255]; // cel ramp over N·L = -1..1 (0..255): deep shadow, shadow, mid tone, lit
const ESP_TINTA = 0.07; // ink outline thickness
const ESP_NEON = 0.16; // outer edge of the hue rim around the ink (rim width = ESP_NEON - ESP_TINTA)
const TINTA = 0.012; // ink darkness (multiplies the rim colour)
const RECUO = 0.6; // outlines only show where what lies behind is at least this much farther away (0 = every groove)
const NEON = 1; // idle brightness of the hue rim
const JANELA = 0.9; // brightness of the lit window panes of the GLB models
const APAGADAS = 22; // % of small GLB window panes left dark
const GANHO = 0.6; // extra rim / pane brightness at full hover or objective glow
const POCA = 0.9; // opacity of the ground glow pool under an open place
const REFLEXO = 0.22; // neon smears on the wet asphalt
const CHAVE = 3.2, CONTRA = 2.2, AMBIENTE = 1.7, FONTE = 9; // pink key, cyan rim, hemisphere fill, fountain point light
const COR_CHAVE = 0xff8ec2, COR_CONTRA = 0x7fe6f0, COR_CEU = 0x8f9bff, COR_CHAO = 0x5a3470, NEVOA = 0x070a1c;
const TOM = new THREE.Color(0.82, 0.85, 1); // multiplies the GLB tint: a touch darker, pushed toward navy
const LUZES = [0xffd23f, 0xffd23f, 0xffe9a8, 0x2de2e6, 0xff3d8b].map((c) => new THREE.Color(c)); // lit pane colours

const cor = (h: number, s: number, l: number) => new THREE.Color().setHSL(h / 360, s, l);
// the hue as the label pills show it (`--c` in cidade3d.module.css)
const corNeon = (h: number) => new THREE.Color().setHSL(h / 360, 0.85, 0.62, THREE.SRGBColorSpace);
const lcg = (sd: number) => () => (sd = (sd * 16807) % 2147483647) / 2147483647;
const easeOutBack = (x: number) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2;
const canvasDe = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')!] as const;
};

// procedural window atlas: 8x8 cells; `mapa` darkens panes, `emis` lights some of them
function texJanelas() {
  const N = 8, C = 32;
  const [a, x] = canvasDe(N * C, N * C), [b, y] = canvasDe(N * C, N * C);
  x.fillStyle = '#fff'; x.fillRect(0, 0, N * C, N * C);
  y.fillStyle = '#000'; y.fillRect(0, 0, N * C, N * C);
  const rnd = lcg(7);
  const lum = ['#ffd23f', '#ffc46b', '#ffe9b8', '#2de2e6', '#ff3d8b'];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    x.fillStyle = '#3a4560'; x.fillRect(c * C + 7, r * C + 6, C - 14, C - 13);
    if (rnd() < 0.55) { y.fillStyle = lum[Math.floor(rnd() * lum.length)]; y.fillRect(c * C + 7, r * C + 6, C - 14, C - 13); }
  }
  const tex = (cv: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  };
  return { mapa: tex(a), emis: tex(b) };
}

function texHalo() {
  const [c, x] = canvasDe(64, 64);
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// alpha ramp: bright at v=0 (bottom of beams / front of headlights), transparent at v=1
function texRampa() {
  const [c, x] = canvasDe(4, 64);
  const g = x.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, '#000'); g.addColorStop(1, '#fff');
  x.fillStyle = g; x.fillRect(0, 0, 4, 64);
  return new THREE.CanvasTexture(c);
}

// cel ramp for MeshToonMaterial.gradientMap (a DataTexture is NearestFilter by default, which keeps the steps hard)
function texDegraus() {
  const t = new THREE.DataTexture(new Uint8Array(DEGRAUS), DEGRAUS.length, 1, THREE.RedFormat);
  t.needsUpdate = true;
  return t;
}

// soft neon blobs on black: emissive map of the wet asphalt, tiled along each road
function texPocas() {
  const [c, x] = canvasDe(256, 64);
  x.fillStyle = '#000'; x.fillRect(0, 0, 256, 64);
  const rnd = lcg(11), tons = ['255,61,139', '45,226,230', '155,107,255'];
  for (let i = 0; i < 9; i++) {
    const px = rnd() * 256, py = 10 + rnd() * 44, r = 22 + rnd() * 30;
    for (const dx of [-256, 0, 256]) { // drawn three times so the tile wraps along the road
      const g = x.createRadialGradient(px + dx, py, 0, px + dx, py, r);
      g.addColorStop(0, `rgba(${tons[i % 3]},.45)`); g.addColorStop(1, `rgba(${tons[i % 3]},0)`);
      x.fillStyle = g; x.fillRect(px + dx - r, py - r, r * 2, r * 2);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Inverted-hull outline of `geo`, baked: two shells pushed out along position-welded normals, mitred so every flat face
// moves by the full thickness. Vertex colour is near black on the inner (ink) shell and white on the outer (neon) one,
// so a single BackSide material in the place hue draws the ink line and the rim around it.
function casca(geo: THREE.BufferGeometry, tinta: number, neon: number) {
  const pos = geo.attributes.position, nor = geo.attributes.normal, n = pos.count;
  const chaves: string[] = [], faces = new Map<string, number[]>(); // distinct face normals per welded position
  for (let i = 0; i < n; i++) {
    const c = `${Math.round(pos.getX(i) * 1e3)},${Math.round(pos.getY(i) * 1e3)},${Math.round(pos.getZ(i) * 1e3)}`;
    const x = nor.getX(i), y = nor.getY(i), z = nor.getZ(i);
    let l = faces.get(c);
    if (!l) faces.set(c, (l = []));
    let j = 0;
    while (j < l.length && l[j] * x + l[j + 1] * y + l[j + 2] * z < 0.98) j += 3;
    if (j === l.length) l.push(x, y, z);
    chaves.push(c);
  }
  const dirs = new Map<string, THREE.Vector3>();
  for (const [c, l] of faces) {
    const d = new THREE.Vector3();
    for (let j = 0; j < l.length; j += 3) { d.x += l[j]; d.y += l[j + 1]; d.z += l[j + 2]; }
    if (d.length() < 0.2) continue; // both sides of a thin sheet meet here: each vertex keeps its own normal
    d.normalize();
    let m = 1;
    for (let j = 0; j < l.length; j += 3) m = Math.min(m, d.x * l[j] + d.y * l[j + 1] + d.z * l[j + 2]);
    dirs.set(c, d.multiplyScalar(1 / Math.max(m, 0.45)));
  }
  const P = new Float32Array(n * 6), C = new Float32Array(n * 6), v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const d = dirs.get(chaves[i]) ?? v.fromBufferAttribute(nor, i);
    [tinta, neon].forEach((e, s) => {
      const o = (s * n + i) * 3;
      P[o] = pos.getX(i) + d.x * e; P[o + 1] = pos.getY(i) + d.y * e; P[o + 2] = pos.getZ(i) + d.z * e;
      C[o] = C[o + 1] = C[o + 2] = s ? 1 : TINTA;
    });
  }
  const idx = geo.index ? Array.from(geo.index.array) : Array.from({ length: n }, (_, i) => i);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('color', new THREE.BufferAttribute(C, 3));
  g.setIndex([...idx, ...idx.map((i) => i + n)]);
  return g;
}
// slivers (antennas, trims, clock hands) would turn into fat neon sticks: no outline below 0.2 in any dimension
// Outline shader tweak: depth-test the hull RECUO further back, so it survives on silhouettes and big steps but not in every
// groove of a detailed facade (which would flood the building with rim colour).
const recuar = (s: { vertexShader: string }) => {
  s.vertexShader = s.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
  vec4 fundo = projectionMatrix * (mvPosition - vec4(0.0, 0.0, ${RECUO.toFixed(3)}, 0.0));
  gl_Position.z = fundo.z * gl_Position.w / fundo.w;`);
};
const grosso = (geo: THREE.BufferGeometry, e = 1) => {
  if (!geo.boundingBox) geo.computeBoundingBox();
  const s = geo.boundingBox!.getSize(new THREE.Vector3());
  return Math.min(s.x, s.y, s.z) * e >= 0.2;
};

export interface Modelo { alt: number; rot: number; anim?: (t: number) => void }
type Obj = THREE.Object3D;
interface Brilho { m: THREE.MeshBasicMaterial; c: THREE.Color }

export class Kit {
  lixo: { dispose(): void }[] = [];
  cores: THREE.MeshToonMaterial[] = [];
  janelas: THREE.MeshToonMaterial[] = [];
  brilhos: Brilho[] = []; // unlit glowing materials (hue rim, lit panes) with their idle colour
  neon?: THREE.MeshBasicMaterial; // outline material of the building being built; pieces get no outline while unset
  jan = texJanelas();
  grad = texDegraus();
  constructor() { this.lixo.push(this.jan.mapa, this.jan.emis, this.grad); }
  g<T extends { dispose(): void }>(x: T): T { this.lixo.push(x); return x; }
  // the standard surface: cel shaded through the shared ramp
  std(color: THREE.ColorRepresentation, o: THREE.MeshToonMaterialParameters = {}) {
    return this.g(new THREE.MeshToonMaterial({ color, gradientMap: this.grad, ...o }));
  }
  basico(color: THREE.ColorRepresentation, o: THREE.MeshBasicMaterialParameters = {}) {
    return this.g(new THREE.MeshBasicMaterial({ color, toneMapped: false, ...o }));
  }
  brilho(c: THREE.Color, o: THREE.MeshBasicMaterialParameters = {}) {
    const m = this.basico(c, o);
    this.brilhos.push({ m, c });
    return m;
  }
  // hue-tinted body that can glow (hover / target / rise)
  corpo(h: number, s = 0.45, l = 0.52, b = 0) {
    const m = this.std(cor(h, s, l), { emissive: cor(h, 0.75, 0.5), emissiveIntensity: b });
    m.userData.b = b;
    this.cores.push(m);
    return m;
  }
  janela(h: number, s = 0.3, l = 0.66, o: THREE.MeshToonMaterialParameters = {}) {
    const m = this.std(cor(h, s, l), { map: this.jan.mapa, emissiveMap: this.jan.emis, emissive: 0xffffff, ...o });
    this.janelas.push(m);
    return m;
  }
  peca(p: Obj, geo: THREE.BufferGeometry, m: THREE.Material | THREE.Material[], x: number, y: number, z: number) {
    const o = new THREE.Mesh(this.g(geo), m);
    o.position.set(x, y, z);
    o.castShadow = o.receiveShadow = true;
    if (this.neon && (Array.isArray(m) || (m as THREE.MeshToonMaterial).isMeshToonMaterial) && grosso(geo))
      o.add(new THREE.Mesh(this.g(casca(geo, ESP_TINTA, ESP_NEON)), this.neon));
    p.add(o);
    return o;
  }
  // y is the bottom of the piece for caixa/cil/cone; esf/tor use the centre
  caixa(p: Obj, w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) {
    return this.peca(p, new THREE.BoxGeometry(w, h, d), m, x, y + h / 2, z);
  }
  // box whose side faces tile the window atlas, plain `teto` on top/bottom
  jcaixa(p: Obj, w: number, h: number, d: number, jm: THREE.Material, teto: THREE.Material, x: number, y: number, z: number) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const uv = geo.attributes.uv;
    ([[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]] as const).forEach(([a, b], f) => {
      for (let i = f * 4; i < f * 4 + 4; i++) uv.setXY(i, (uv.getX(i) * a) / 6.8, (uv.getY(i) * b) / 7.6);
    });
    return this.peca(p, geo, [jm, jm, teto, teto, jm, jm], x, y + h / 2, z);
  }
  cil(p: Obj, rt: number, rb: number, h: number, m: THREE.Material, x: number, y: number, z: number, seg = 16) {
    return this.peca(p, new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y + h / 2, z);
  }
  cone(p: Obj, r: number, h: number, m: THREE.Material, x: number, y: number, z: number, seg = 8) {
    return this.peca(p, new THREE.ConeGeometry(r, h, seg), m, x, y + h / 2, z);
  }
  esf(p: Obj, r: number, m: THREE.Material, x: number, y: number, z: number) {
    return this.peca(p, new THREE.SphereGeometry(r, 14, 10), m, x, y, z);
  }
}

// Polyfork models (polyfork.dev, free licence) in public/models. A place keeps its procedural build when its file is missing.
const ARQUIVOS: Record<string, string> = {
  cortico: 'brick-tenement-5257e9', escola: 'public-school-19ade5', garagem: 'auto-repair-garage-b91464',
  lojas: 'one-storey-shop-row-83c958', banco: 'classical-bank-04954e', torre: 'clock-tower-752081',
  fonte: 'plaza-fountain-5a5f6e', cancela: 'checkpoint-barrier-pole-59c197',
  vao: 'overpass-deck-span-874f0c', pilar: 'overpass-pier-cddd4b',
};
const glb = new Map<string, Obj>();
// ponytail: one outline per cached geometry, baked for the scale of its first use; key by scale too if a model is ever placed at two sizes
const cascas = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();
const malhas = (o: Obj) => {
  const ms: THREE.Mesh[] = [];
  o.traverse((n) => { if ((n as THREE.Mesh).isMesh) ms.push(n as THREE.Mesh); });
  return ms;
};

// The models have no textures, only vertex colours, and their glass is the one bluish colour on vertical faces. Move most of
// those panes into a child mesh (flagged `luz`, drawn unlit by peca3d) so the windows glow at night. Both triangles of a
// rectangular pane share a bounding box, which seeds the pane's colour. Runs once per file; the clones share the result.
function acender(cena: Obj) {
  const caixa = new THREE.Box3(), v = new THREE.Vector3();
  for (const m of malhas(cena)) {
    const g = m.geometry, { position: pos, normal: nor, color: col } = g.attributes, idx = g.index;
    if (!col || !nor || !idx || (m.material as THREE.Material).transparent) continue;
    const corpo: number[] = [], luz: number[] = [], cores = new Float32Array(pos.count * 3);
    for (let t = 0; t < idx.count; t += 3) {
      const tri = [idx.getX(t), idx.getX(t + 1), idx.getX(t + 2)], a = tri[0];
      let c: THREE.Color | undefined;
      if (col.getZ(a) > 1.5 * col.getX(a) && col.getZ(a) >= col.getY(a) && Math.abs(nor.getY(a)) < 0.3) {
        caixa.makeEmpty();
        for (const i of tri) caixa.expandByPoint(v.fromBufferAttribute(pos, i));
        let hash = 0;
        for (const u of [...caixa.min.toArray(), ...caixa.max.toArray()]) hash = (hash * 31 + Math.round(u * 100)) | 0;
        hash = Math.abs(hash);
        caixa.getSize(v);
        if (Math.max(v.x, v.z) * v.y > 12) c = LUZES[0]; // a whole glazed front: always lit, warm
        else if (hash % 100 >= APAGADAS) c = LUZES[(hash >> 8) % LUZES.length];
      }
      (c ? luz : corpo).push(...tri);
      if (c) for (const i of tri) c.toArray(cores, i * 3);
    }
    if (!luz.length) continue;
    g.setIndex(corpo);
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', pos);
    lg.setAttribute('color', new THREE.BufferAttribute(cores, 3));
    lg.setIndex(luz);
    const l = new THREE.Mesh(lg);
    l.userData.luz = true;
    m.add(l);
  }
}

let carga: Promise<void> | undefined;
export const carregarModelos = () => (carga ??= (() => {
  const loader = new GLTFLoader();
  return Promise.all(Object.entries(ARQUIVOS).map(([nome, arq]) =>
    loader.loadAsync(`/models/${arq}.glb`).then((r) => { acender(r.scene); glb.set(nome, r.scene); }, () => {}))).then(() => {});
})());

// Clone a loaded model into `p`: scaled by `esc` (or to fit w x d x alt), centred on x/z, bottom at y. Its vertex colours are
// kept, cel shaded and tinted by the place hue (pushed toward navy), with ink + neon outline, glowing panes and the
// hover/target glow wired in. Geometry (outline included) stays shared with the cache, so only materials are disposed.
interface Lugar { w?: number; d?: number; alt?: number; esc?: number; x?: number; y?: number; z?: number; rot?: number }
function peca3d(k: Kit, p: Obj, nome: string, h: number, { w = 99, d = 99, alt = 99, esc, x = 0, y = 0, z = 0, rot = 0 }: Lugar) {
  const src = glb.get(nome);
  if (!src) return;
  const o = src.clone(true);
  const caixa = new THREE.Box3().setFromObject(o), t = caixa.getSize(new THREE.Vector3()), c = caixa.getCenter(new THREE.Vector3());
  const e = esc ?? Math.min(w / t.x, d / t.z, alt / t.y);
  o.scale.setScalar(e);
  o.rotation.y = rot;
  o.position.set(x - c.x * e * Math.cos(rot) - c.z * e * Math.sin(rot), y - caixa.min.y * e, z - c.z * e * Math.cos(rot) + c.x * e * Math.sin(rot));
  const tom = cor(h, 0.5, 0.8).multiply(TOM);
  let luz: THREE.MeshBasicMaterial | undefined;
  for (const m of malhas(o)) {
    if (m.userData.luz) { m.material = (luz ??= k.brilho(new THREE.Color().setScalar(JANELA), { vertexColors: true })); continue; }
    const orig = m.material as THREE.MeshStandardMaterial;
    const mat = k.std(tom, { vertexColors: orig.vertexColors, transparent: orig.transparent, opacity: orig.opacity, emissive: cor(h, 0.75, 0.5), emissiveIntensity: 0 });
    mat.userData.b = 0;
    k.cores.push(mat);
    m.material = mat;
    m.castShadow = m.receiveShadow = true;
    if (!k.neon || orig.transparent || !grosso(m.geometry, e)) continue;
    let hull = cascas.get(m.geometry);
    if (!hull) cascas.set(m.geometry, (hull = casca(m.geometry, ESP_TINTA / e, ESP_NEON / e)));
    m.add(new THREE.Mesh(hull, k.neon));
  }
  p.add(o);
  return { o, alt: t.y * e };
}

type Fab = (k: Kit, g: THREE.Group, h: number) => Modelo;
// a whole building from one model, falling back to the procedural build
const grande = (nome: string, proc: Fab, w: number, d: number, alt: number): Fab => (k, g, h) => {
  const r = peca3d(k, g, nome, h, { w, d, alt });
  return r ? { alt: r.alt, rot: r.alt } : proc(k, g, h);
};

// --- buildings: origin = lot centre on the ground, front faces +z ---

const apartamento = (k: Kit, g: THREE.Group, h: number): Modelo => {
  const jm = k.janela(h, 0.4, 0.72), teto = k.std(0x1c2236), acc = k.corpo(h, 0.6, 0.55, 0.2);
  const metal = k.std(0x586079);
  k.jcaixa(g, 4.2, 9, 3.8, jm, teto, 0, 0, -0.3);
  k.jcaixa(g, 2.8, 1.6, 2.6, jm, teto, 0, 9, -0.3);
  k.jcaixa(g, 2.4, 4.2, 2.4, jm, teto, 3.3, 0, 0.9);
  [3, 6].forEach((y) => k.caixa(g, 4.4, 0.14, 4.0, acc, 0, y, -0.3));
  k.caixa(g, 2.2, 0.14, 1.3, acc, 0, 1.5, 1.9);
  k.caixa(g, 1.1, 1.4, 0.1, k.std(0x0b0f1c), 0, 0, 1.62);
  k.cil(g, 0.55, 0.55, 0.9, metal, -0.8, 10.6, -0.3);
  k.cil(g, 0.04, 0.05, 2.4, metal, 0.8, 10.6, -0.3);
  const luz = k.esf(g, 0.17, k.basico(0xff4d4d), 0.8, 13.1, -0.3);
  return { alt: 13.2, rot: 11.2, anim: (t) => { luz.visible = t % 1.4 < 0.7; } };
};

const academia = (k: Kit, g: THREE.Group, h: number): Modelo => {
  const jm = k.janela(h, 0.4, 0.68), teto = k.std(0x1a2a24), acc = k.corpo(h, 0.7, 0.5, 0.3);
  const metal = k.std(0x6a7570);
  k.jcaixa(g, 6.4, 2.6, 4.4, jm, teto, 0, 0, 0);
  k.caixa(g, 6.9, 0.25, 4.9, teto, 0, 2.6, 0);
  k.caixa(g, 6.5, 0.3, 0.12, acc, 0, 1.9, 2.25);
  k.caixa(g, 1.6, 1.6, 0.1, k.std(0x07100d), 0, 0, 2.2);
  [-1.9, 1.9].forEach((x) => k.caixa(g, 0.3, 1.1, 0.3, metal, x, 2.85, 0));
  const hal = new THREE.Group();
  hal.position.set(0, 4.5, 0);
  const placa = k.corpo(h, 0.75, 0.5, 0.5);
  k.cil(hal, 0.14, 0.14, 5.6, metal, 0, -2.8, 0, 10).rotation.z = Math.PI / 2;
  [-2.1, 2.1].forEach((x) => {
    k.cil(hal, 0.9, 0.9, 0.4, placa, x, -0.2, 0, 20).rotation.z = Math.PI / 2;
    k.cil(hal, 0.62, 0.62, 0.34, placa, x * 1.2, -0.17, 0, 20).rotation.z = Math.PI / 2;
    k.cil(hal, 0.26, 0.26, 0.3, metal, x * 1.36, -0.15, 0, 12).rotation.z = Math.PI / 2;
  });
  g.add(hal);
  return { alt: 5.7, rot: 5.7, anim: (t) => { hal.rotation.x = Math.sin(t * 0.6) * 0.12; } };
};

const educacao = (k: Kit, g: THREE.Group, h: number): Modelo => {
  const jm = k.janela(h, 0.4, 0.72), teto = k.std(0x211a33), acc = k.corpo(h, 0.5, 0.62, 0.15);
  const pedra = k.std(0x8d86a8);
  k.jcaixa(g, 5.6, 3.2, 4.2, jm, teto, -0.3, 0, 0.3);
  k.caixa(g, 5.9, 0.2, 4.5, acc, -0.3, 3.2, 0.3);
  k.caixa(g, 2.8, 0.2, 0.8, pedra, -0.3, 0, 2.7);
  k.caixa(g, 2.4, 0.2, 0.6, pedra, -0.3, 0.2, 2.55);
  k.cil(g, 1.5, 1.5, 0.8, acc, -0.8, 3.4, 0.3, 24);
  k.peca(g, new THREE.SphereGeometry(1.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), k.corpo(h, 0.55, 0.7, 0.25), -0.8, 4.2, 0.3);
  k.cil(g, 0.05, 0.05, 0.9, pedra, -0.8, 5.7, 0.3, 6);
  k.jcaixa(g, 1.2, 5.2, 1.2, jm, teto, 2.4, 0, -0.9);
  const tel = new THREE.ConeGeometry(1, 1.5, 4).rotateY(Math.PI / 4);
  k.peca(g, tel, k.corpo(h, 0.6, 0.45, 0.2), 2.4, 5.95, -0.9);
  const rel = k.cil(g, 0.4, 0.4, 0.08, k.basico(0xffe8b0), 2.4, 3.9, -0.26, 20);
  rel.rotation.x = Math.PI / 2;
  return { alt: 7.4, rot: 6.6 };
};

const agencia = (k: Kit, g: THREE.Group, h: number): Modelo => {
  const vid = k.janela(h, 0.35, 0.55), teto = k.std(0x1c1a14);
  const acc = k.corpo(h, 0.85, 0.55, 0.45);
  const metal = k.std(0x8a8f9c);
  k.jcaixa(g, 5.4, 2, 4.6, vid, teto, 0, 0, 0);
  k.caixa(g, 5.6, 0.18, 4.8, acc, 0, 2, 0);
  k.jcaixa(g, 3.6, 8.4, 3.6, vid, teto, 0, 2.2, 0);
  k.jcaixa(g, 2.4, 1.2, 2.4, vid, teto, 0, 10.6, 0);
  [-1.8, 1.8].forEach((x) => [-1.8, 1.8].forEach((z) => k.caixa(g, 0.2, 8.4, 0.2, acc, x, 2.2, z)));
  [5.2, 8].forEach((y) => k.caixa(g, 3.8, 0.14, 3.8, acc, 0, y, 0));
  k.caixa(g, 2.6, 0.2, 2.6, acc, 0, 11.8, 0);
  k.cil(g, 0.04, 0.09, 2.4, metal, 0, 12, 0, 8);
  const luz = k.esf(g, 0.16, k.basico(0xff4d4d), 0, 14.5, 0);
  return { alt: 14.6, rot: 12.6, anim: (t) => { luz.visible = (t + 0.7) % 1.4 < 0.7; } };
};

const shopping = (k: Kit, g: THREE.Group, h: number): Modelo => {
  const jm = k.janela(h, 0.35, 0.74), teto = k.std(0x2a1626), acc = k.corpo(h, 0.8, 0.55, 0.25);
  const branco = k.std(0xe8e2ee), letreiro = k.corpo(h, 0.85, 0.55, 0.9);
  k.jcaixa(g, 7, 2.4, 4.6, jm, teto, 0, 0, 0.2);
  k.caixa(g, 7.3, 0.2, 4.9, acc, 0, 2.4, 0.2);
  [-2.2, 2.2].forEach((x) => k.cil(g, 0.1, 0.1, 1.0, branco, x, 2.6, -0.4, 8));
  k.caixa(g, 5.4, 1.5, 0.3, letreiro, 0, 3.5, -0.4);
  k.caixa(g, 4.9, 1.1, 0.34, k.std(0x1a0f18), 0, 3.7, -0.4);
  const txt = k.basico(0xffffff);
  [[-1.2, 1.6], [0.6, 0.9], [1.6, 0.5]].forEach(([x, w]) => k.caixa(g, w, 0.28, 0.4, txt, x, 4.1, -0.4));
  k.caixa(g, 3.2, 0.2, 0.4, txt, 0, 3.8, -0.4);
  for (let i = 0; i < 6; i++) {
    const a = k.caixa(g, 1.14, 0.1, 1.0, i % 2 ? branco : acc, -2.85 + i * 1.14, 1.75, 2.85);
    a.rotation.x = 0.4;
  }
  k.caixa(g, 2.4, 1.7, 0.1, k.std(0x1a0f18), 0, 0, 2.52);
  return { alt: 5.4, rot: 5.4 };
};

const banco = (k: Kit, g: THREE.Group, h: number): Modelo => {
  const pedra = k.std(cor(h, 0.2, 0.78)), jm = k.janela(h, 0.18, 0.8), teto = k.std(0x2a2512);
  const ouro = k.corpo(h, 0.8, 0.55, 0.6);
  k.caixa(g, 6.4, 0.2, 5, pedra, 0, 0, 0.3);
  k.caixa(g, 6, 0.2, 4.7, pedra, 0, 0.2, 0.2);
  k.jcaixa(g, 5.2, 3.2, 3.4, jm, teto, 0, 0.4, -0.5);
  k.caixa(g, 5.8, 0.3, 4.6, pedra, 0, 3.6, 0.1);
  [-2.1, -0.7, 0.7, 2.1].forEach((x) => k.cil(g, 0.3, 0.3, 3.1, pedra, x, 0.4, 2.0, 14));
  k.caixa(g, 5.4, 0.35, 0.9, pedra, 0, 3.5, 2.0);
  const ped = new THREE.CylinderGeometry(3.12, 3.12, 4.4, 3).rotateX(-Math.PI / 2);
  const t = k.peca(g, ped, pedra, 0, 4.35, 0.1);
  t.scale.y = 0.2;
  k.caixa(g, 1, 1.7, 0.1, ouro, 0, 0.4, 1.4);
  k.caixa(g, 2.2, 0.4, 0.1, ouro, 0, 3.0, 2.5);
  return { alt: 5.3, rot: 5.3 };
};

const posto = (k: Kit, g: THREE.Group, h: number): Modelo => {
  const jm = k.janela(h, 0.12, 0.62), teto = k.std(0x1d2128), cin = k.std(0x6d7684);
  const metal = k.std(0xaab0bd);
  const bandeira = k.corpo(h, 0.8, 0.5, 0.7);
  k.jcaixa(g, 3.4, 4.4, 3.8, jm, teto, 0, 0, 0);
  k.jcaixa(g, 1.9, 2.6, 3.2, jm, teto, -2.65, 0, 0);
  k.jcaixa(g, 1.9, 2.6, 3.2, jm, teto, 2.65, 0, 0);
  k.caixa(g, 3.7, 0.2, 4.1, cin, 0, 4.4, 0);
  k.caixa(g, 2.4, 0.2, 1.3, cin, 0, 2.4, 1.85);
  [-1, 1].forEach((x) => k.caixa(g, 0.26, 2.4, 0.26, cin, x, 0, 2.6));
  k.cil(g, 0.05, 0.06, 3.2, metal, 0.9, 4.6, -0.8, 8);
  const flag = new THREE.Group();
  flag.position.set(0.9, 7.4, -0.8);
  k.caixa(flag, 1.3, 0.8, 0.04, bandeira, 0.65, -0.8, 0);
  g.add(flag);
  k.caixa(g, 0.9, 1.2, 0.9, cin, 4.0, 0, 3.0);
  const braco = peca3d(k, g, 'cancela', h, { esc: 0.8, x: 0.4, z: 3.4 }) ? undefined : k.caixa(g, 1.6, 0.08, 0.08, k.std(0xff5a4d), 3.0, 0.9, 3.0);
  return { alt: 8.2, rot: 5.2, anim: (t) => { flag.rotation.y = Math.sin(t * 2.2) * 0.18; if (braco) braco.rotation.z = Math.sin(t * 0.7) * 0.05; } };
};

const viaduto = (k: Kit, g: THREE.Group, h: number): Modelo => {
  const conc = k.std(0x7b7f8c), asf = k.std(0x12151f), acc = k.corpo(h, 0.85, 0.55, 0.4);
  const luzes = k.basico(0xffd89a);
  const E = 0.52; // the deck model floats 6 m above its own origin, on top of the piers
  if (peca3d(k, g, 'vao', h, { esc: E, y: 6 * E })) {
    [-2.8, 2.8].forEach((x) => peca3d(k, g, 'pilar', h, { esc: E, x, rot: Math.PI / 2 }));
    return { alt: 4.7, rot: 4.7 };
  }
  k.caixa(g, 9.4, 0.55, 3.2, conc, 0, 2.5, 0);
  k.caixa(g, 9.3, 0.04, 2.3, asf, 0, 3.05, 0);
  for (let i = -4; i <= 4; i++) k.caixa(g, 0.6, 0.02, 0.1, luzes, i * 1.0, 3.09, 0);
  [-3.4, 3.4].forEach((x) => {
    k.caixa(g, 1.0, 2.5, 2.6, conc, x, 0, 0);
    for (let i = 0; i < 3; i++) k.caixa(g, 1.02, 0.18, 2.62, i % 2 ? conc : acc, x, 0.5 + i * 0.7, 0);
  });
  [-1.5, 1.5].forEach((z) => {
    k.caixa(g, 9.4, 0.5, 0.12, acc, 0, 3.05, z);
    const arco = k.peca(g, new THREE.TorusGeometry(2.3, 0.2, 8, 28, Math.PI), conc, 0, 0.1, z * 0.85);
    arco.scale.y = 0.95;
  });
  [-4.2, -1.4, 1.4, 4.2].forEach((x) => [-1.4, 1.4].forEach((z) => {
    k.cil(g, 0.04, 0.05, 1.3, conc, x, 3.05, z, 6);
    k.esf(g, 0.14, luzes, x, 4.4, z);
  }));
  return { alt: 4.8, rot: 4.8 };
};

const praca = (k: Kit, g: THREE.Group, h: number): Modelo => {
  const pedra = k.std(0x9aa7a2), relva = k.std(cor(h, 0.4, 0.28)), agua = k.basico(0x6fe8ff, { transparent: true, opacity: 0.85 });
  const tronco = k.std(0x4a3426), tel = k.corpo(h, 0.6, 0.45, 0.2);
  k.cil(g, 3.6, 3.6, 0.1, pedra, 0, 0, 0, 40);
  k.cil(g, 3.0, 3.0, 0.16, relva, 0, 0.05, 0, 40);
  const FE = 1.2, fonte3d = peca3d(k, g, 'fonte', h, { esc: FE, y: 0.2, z: 0.9 });
  if (!fonte3d) {
    k.cil(g, 1.5, 1.5, 0.2, pedra, 0, 0.1, 0.9, 28);
    const tor = k.peca(g, new THREE.TorusGeometry(1.15, 0.2, 8, 28), pedra, 0, 0.42, 0.9);
    tor.rotation.x = Math.PI / 2;
    k.cil(g, 0.95, 0.95, 0.1, agua, 0, 0.3, 0.9, 24);
    k.cil(g, 0.12, 0.22, 1.0, pedra, 0, 0.3, 0.9, 10);
  }
  const jato = k.cone(g, 0.5, 0.9, k.basico(0xbff6ff, { transparent: true, opacity: 0.5 }), 0, fonte3d ? 0.2 + 1.58 * FE : 1.2, 0.9, 10);
  if (!peca3d(k, g, 'torre', h, { esc: 0.45, x: -2.0, z: -1.7 })) {
    k.caixa(g, 1.2, 4.2, 1.2, pedra, -2.0, 0.1, -1.7);
    k.caixa(g, 1.4, 0.2, 1.4, tel, -2.0, 4.3, -1.7);
    k.cone(g, 0.95, 1.2, tel, -2.0, 4.5, -1.7, 4).rotation.y = Math.PI / 4;
    const rel = k.basico(0xffe8b0);
    k.cil(g, 0.4, 0.4, 0.08, rel, -2.0, 3.4, -1.07, 20).rotation.x = Math.PI / 2;
    k.cil(g, 0.4, 0.4, 0.08, rel, -1.37, 3.4, -1.7, 20).rotation.z = Math.PI / 2;
  }
  [[2.3, -1.6], [-2.4, 1.7], [2.6, 1.9], [0.6, -2.4]].forEach(([x, z], i) => {
    const folha = k.std(cor(120 + i * 12, 0.45, 0.3 + i * 0.02));
    k.cil(g, 0.12, 0.16, 0.8, tronco, x, 0.1, z, 6);
    k.cone(g, 0.85, 1.4, folha, x, 0.8, z, 7);
    k.cone(g, 0.62, 1.1, folha, x, 1.6, z, 7);
  });
  return { alt: 5.9, rot: 5.2, anim: (t) => { jato.scale.y = 1 + Math.sin(t * 5) * 0.12; } };
};

export const MODELOS: Record<string, Fab> = {
  apartamento: grande('cortico', apartamento, 8.4, 6.6, 13), academia,
  educacao: grande('escola', educacao, 8.4, 6.6, 9), agencia: grande('garagem', agencia, 8.4, 6.6, 9),
  shopping: grande('lojas', shopping, 8.4, 6.6, 6), banco: grande('banco', banco, 8.4, 6.6, 8), posto, viaduto, praca,
};

interface Slot {
  id: string; x: number; z: number; hue: number;
  g?: THREE.Group; m?: Modelo; cores: THREE.MeshToonMaterial[]; janelas: THREE.MeshToonMaterial[]; brilhos: Brilho[]; poca: THREE.Mesh;
  hit?: THREE.Mesh; holo?: THREE.Group; holoMats: THREE.Material[];
  hv: number; hvAlvo: number; subir: number; flash?: { r: THREE.Mesh; t: number };
}

export function criarCena(canvas: HTMLCanvasElement, reduzido: boolean): Cena {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  r.setClearColor(0x000000, 0);
  r.toneMapping = THREE.NeutralToneMapping; // keeps the flat cel colours saturated (ACES washes the neon out)
  r.toneMappingExposure = 1;
  r.shadowMap.enabled = true;
  try {
    const sc = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(35, 1, 1, 400);
    const k = new Kit();
    const halo = k.g(texHalo()), rampa = k.g(texRampa());
    sc.fog = new THREE.Fog(NEVOA, 80, 220);

    // --- lights: violet night fill, pink key from the front-left (fronts + roofs), cyan rim from the back-right (sides),
    // cyan fountain glow. The directions keep the axis-aligned faces well inside one step of the cel ramp.
    const hemi = new THREE.HemisphereLight(COR_CEU, COR_CHAO, AMBIENTE);
    const sol = new THREE.DirectionalLight(COR_CHAVE, CHAVE);
    sol.position.set(-10, 22, 20);
    sol.castShadow = true;
    sol.shadow.mapSize.set(2048, 2048);
    Object.assign(sol.shadow.camera, { left: -26, right: 26, top: 22, bottom: -22, near: 1, far: 80 });
    sol.shadow.bias = -0.0005; sol.shadow.normalBias = 0.04;
    const rim = new THREE.DirectionalLight(COR_CONTRA, CONTRA);
    rim.position.set(24, 11, -18);
    const fonte = new THREE.PointLight(0x2de2e6, 0, 16, 2);
    fonte.position.set(0, 1.8, 0.9);
    sc.add(hemi, sol, rim, fonte);

    // --- diorama base, lots, roads (wet asphalt: glossy PBR instead of cel, with faint neon smears)
    const slate = k.std(0x151c33), lote = k.std(0x1d2744);
    const pocas = k.g(texPocas()), pocasZ = k.g(pocas.clone());
    pocas.repeat.set(1.5, 1);
    pocasZ.repeat.set(1.25, 1); pocasZ.rotation = Math.PI / 2;
    const asfalto = (t: THREE.Texture) => k.g(new THREE.MeshStandardMaterial({ color: 0x0a0f1c, roughness: 0.4, metalness: 0.2, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: REFLEXO }));
    const asfX = asfalto(pocas), asfZ = asfalto(pocasZ);
    k.peca(sc, new THREE.BoxGeometry(HX * 2, 1.2, HZ * 2), slate, 0, -0.6, 0);
    const borda = k.g(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(HX * 2, 1.2, HZ * 2)), k.g(new THREE.LineBasicMaterial({ color: 0x4d6bff, transparent: true, opacity: 0.5 }))));
    borda.position.y = -0.6;
    sc.add(borda);
    ZS.forEach((z) => { const m = k.peca(sc, new THREE.BoxGeometry(HX * 2, 0.08, 2.2), asfX, 0, 0.04, z); m.castShadow = false; });
    // a hair higher than the x roads: the two smear patterns would z-fight at the crossings
    XS.forEach((x) => { const m = k.peca(sc, new THREE.BoxGeometry(2.2, 0.08, HZ * 2), asfZ, x, 0.044, 0); m.castShadow = false; });
    const grade: number[] = [];
    for (let x = -HX; x <= HX; x += 2) grade.push(x, 0.135, -HZ, x, 0.135, HZ);
    for (let z = -HZ; z <= HZ; z += 2) grade.push(-HX, 0.135, z, HX, 0.135, z);
    const gg = k.g(new THREE.BufferGeometry());
    gg.setAttribute('position', new THREE.Float32BufferAttribute(grade, 3));
    sc.add(new THREE.LineSegments(gg, k.g(new THREE.LineBasicMaterial({ color: 0x3a4a8a, transparent: true, opacity: 0.16 }))));

    // dashed centre lines (emissive, one instanced mesh)
    const tracos: THREE.Matrix4[] = [];
    const perto = (u: number, ls: number[]) => ls.some((l) => Math.abs(u - l) < 1.7);
    ZS.forEach((z) => { for (let u = -HX + 1; u < HX; u += 1.8) if (!perto(u, XS)) tracos.push(new THREE.Matrix4().makeTranslation(u, 0.1, z)); });
    XS.forEach((x) => { for (let u = -HZ + 1; u < HZ; u += 1.8) if (!perto(u, ZS)) tracos.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0.1, u), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2), new THREE.Vector3(1, 1, 1))); });
    const dash = new THREE.InstancedMesh(k.g(new THREE.BoxGeometry(0.8, 0.02, 0.12)), k.basico(0xffd89a), tracos.length);
    tracos.forEach((m, i) => dash.setMatrixAt(i, m));
    sc.add(dash);

    // street lamps at the lot corners (instanced pole + bulb)
    const postes: THREE.Vector3[] = [];
    Object.values(GRADE).forEach(([c, rr]) => [-1, 1].forEach((a) => [-1, 1].forEach((b) => postes.push(new THREE.Vector3((c - 1) * PX + a * 4.5, 0, (rr - 1) * PZ + b * 3.5)))));
    const poleI = new THREE.InstancedMesh(k.g(new THREE.CylinderGeometry(0.04, 0.06, 1.8, 6).translate(0, 0.9 + TOPO, 0)), k.std(0x3a4054), postes.length);
    const bulbI = new THREE.InstancedMesh(k.g(new THREE.SphereGeometry(0.13, 8, 6)), k.basico(0xffd89a), postes.length);
    postes.forEach((p, i) => { poleI.setMatrixAt(i, new THREE.Matrix4().makeTranslation(p.x, 0, p.z)); bulbI.setMatrixAt(i, new THREE.Matrix4().makeTranslation(p.x, 1.9 + TOPO, p.z)); });
    sc.add(poleI, bulbI);

    // --- shared effect pieces
    const anelGeo = k.g(new THREE.RingGeometry(0.93, 1, 72).rotateX(-Math.PI / 2));
    const discoGeo = k.g(new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2));
    const feixeGeo = k.g(new THREE.CylinderGeometry(1, 1, 1, 20, 1, true).translate(0, 0.5, 0));
    const adit = (c: THREE.ColorRepresentation, o: THREE.MeshBasicMaterialParameters = {}) =>
      k.basico(c, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide, ...o });
    const fx = (geo: THREE.BufferGeometry, m: THREE.Material, p: Obj) => { const o = new THREE.Mesh(geo, m); p.add(o); return o; };
    const YF = TOPO + 0.06;

    // --- slots, each with a soft glow pool on the ground (lit in the place hue while it is open, spilling onto the roads)
    const slots = new Map<string, Slot>();
    const tela: Record<string, Tela> = {};
    const loteGeo = k.g(new THREE.BoxGeometry(PX - 2.4, TOPO, PZ - 2.4));
    const pocaGeo = k.g(new THREE.PlaneGeometry(PX + 4, PZ + 4).rotateX(-Math.PI / 2));
    for (const [id, [c, rr]] of Object.entries(GRADE)) {
      const poca = fx(pocaGeo, adit(0xffffff, { map: halo, opacity: 0 }), sc);
      poca.position.set((c - 1) * PX, TOPO + 0.03, (rr - 1) * PZ);
      poca.visible = false;
      slots.set(id, { id, x: (c - 1) * PX, z: (rr - 1) * PZ, hue: 200, cores: [], janelas: [], brilhos: [], poca, holoMats: [], hv: 0, hvAlvo: 0, subir: 1 });
      tela[id] = { x: -9999, y: 0, z: 0, v: false };
      const l = k.peca(sc, loteGeo, lote, (c - 1) * PX, TOPO / 2, (rr - 1) * PZ);
      l.castShadow = false;
    }

    const marca = new THREE.Group(); // player marker
    const mAnel = fx(anelGeo, adit(CIANO, { opacity: 0.95 }), marca); mAnel.scale.setScalar(3.9);
    const mDisco = fx(discoGeo, adit(CIANO, { opacity: 0.12 }), marca); mDisco.scale.setScalar(3.8);
    const mFeixe = fx(feixeGeo, adit(CIANO, { opacity: 0.55, alphaMap: rampa, blending: THREE.NormalBlending }), marca); mFeixe.scale.set(0.2, 18, 0.2);
    const diamante = new THREE.Mesh(k.g(new THREE.OctahedronGeometry(0.5)), k.g(new THREE.MeshStandardMaterial({ color: CIANO, emissive: CIANO, emissiveIntensity: 1.6, flatShading: true })));
    diamante.scale.y = 1.5;
    sc.add(marca, diamante);
    marca.position.y = YF; marca.visible = diamante.visible = false;

    const alvoFx = new THREE.Group(); // objective marker
    const aAneis = [0, 1].map(() => fx(anelGeo, adit(AMBAR), alvoFx));
    const aFeixe = fx(feixeGeo, adit(AMBAR, { opacity: 0.6, alphaMap: rampa, blending: THREE.NormalBlending }), alvoFx); aFeixe.scale.set(0.35, 24, 0.35);
    sc.add(alvoFx);
    alvoFx.position.y = YF; alvoFx.visible = false;

    const flashes: { r: THREE.Mesh; t: number }[] = [];
    const flashDe = (hue: number) => {
      let f = flashes.find((q) => q.t >= 1);
      if (!f) { f = { r: new THREE.Mesh(anelGeo, adit(0xffffff)), t: 1 }; sc.add(f.r); flashes.push(f); }
      (f.r.material as THREE.MeshBasicMaterial).color.copy(cor(hue, 0.9, 0.65));
      f.r.visible = true; f.t = 0;
      return f;
    };

    // --- traffic, drones, dust
    const carros: { g: THREE.Group; x0: number; x1: number; z0: number; z1: number; dir: number; v: number; s: number; rot: number }[] = [];
    const corpoGeo = k.g(new THREE.BoxGeometry(0.5, 0.3, 0.95)), cabGeo = k.g(new THREE.BoxGeometry(0.42, 0.24, 0.5));
    const farolGeo = k.g(new THREE.BoxGeometry(0.1, 0.08, 0.05)), poolGeo = k.g(new THREE.PlaneGeometry(0.9, 2.4).translate(0, 1.2, 0).rotateX(Math.PI / 2));
    const farol = k.basico(0xfff2c0), lanterna = k.basico(0xff3030), poolM = adit(0xffe9b0, { opacity: 0.35, alphaMap: rampa });
    const pinturas = [0xe0554a, 0x3d8bff, 0xf2c14e, 0xc9ced9, 0x59d49a, 0xa66bff].map((c) => k.std(c));
    const cabM = k.std(0x1a2033);
    const L = 0.55;
    const rotas: [number, number, number, number, number, number, number][] = [
      [XS[0], XS[3], ZS[0], ZS[3], 1, 6, 0], [XS[0], XS[3], ZS[0], ZS[3], -1, 5, 40], [XS[1], XS[2], ZS[1], ZS[2], 1, 4.2, 5],
      [XS[1], XS[2], ZS[0], ZS[1], -1, 4.6, 3], [XS[0], XS[1], ZS[1], ZS[2], 1, 5, 9], [XS[2], XS[3], ZS[2], ZS[3], -1, 4.4, 2],
    ];
    rotas.forEach(([a, b, c, d, dir, v, s], i) => {
      const g = new THREE.Group();
      k.peca(g, corpoGeo, pinturas[i], 0, 0.3, 0).castShadow = false;
      k.peca(g, cabGeo, cabM, 0, 0.5, -0.05).castShadow = false;
      [-0.16, 0.16].forEach((x) => { k.peca(g, farolGeo, farol, x, 0.32, 0.48); k.peca(g, farolGeo, lanterna, x, 0.32, -0.48); });
      g.add(new THREE.Mesh(poolGeo, poolM)).position.set(0, 0.05, 0.5);
      sc.add(g);
      carros.push({ g, x0: a + L, x1: b - L, z0: c + L, z1: d - L, dir, v, s, rot: 0 });
    });

    const haloM = (c: number) => k.g(new THREE.SpriteMaterial({ map: halo, color: c, depthWrite: false, transparent: true, fog: false }));
    const drones = [0x5fe3ff, 0xffc24a, 0xff6bd0, 0x8cff9a].map((c, i) => {
      const g = new THREE.Group();
      k.peca(g, new THREE.BoxGeometry(0.5, 0.12, 0.5), k.std(0x2a3150), 0, 0, 0).castShadow = false;
      k.peca(g, new THREE.SphereGeometry(0.12, 8, 6), k.basico(c), 0, -0.16, 0);
      const s = new THREE.Sprite(haloM(c)); s.scale.setScalar(2.2); s.position.y = -0.16;
      g.add(s);
      sc.add(g);
      return { g, a: i * 1.6, rx: 10 + i * 3.4, rz: 8 + (i % 2) * 5, y: 9 + i * 1.2, w: (i % 2 ? -1 : 1) * (0.12 + i * 0.03) };
    });

    const NP = 140, pp = new Float32Array(NP * 3), pv = new Float32Array(NP * 3);
    for (let i = 0; i < NP; i++) {
      pp[i * 3] = (Math.random() * 2 - 1) * 24; pp[i * 3 + 1] = 0.5 + Math.random() * 14; pp[i * 3 + 2] = (Math.random() * 2 - 1) * 20;
      pv[i * 3] = (Math.random() - 0.5) * 0.5; pv[i * 3 + 1] = 0.08 + Math.random() * 0.25; pv[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    const pg = k.g(new THREE.BufferGeometry());
    const pa = new THREE.BufferAttribute(pp, 3);
    pg.setAttribute('position', pa);
    sc.add(new THREE.Points(pg, k.g(new THREE.PointsMaterial({ map: halo, size: 0.55, color: 0xffd9a0, transparent: true, opacity: 0.6, depthWrite: false, fog: false }))));

    // --- locked hologram / open building
    const fechar = (s: Slot, hue: number) => {
      if (s.g) { sc.remove(s.g); s.g = s.m = undefined; s.cores = []; s.janelas = []; s.brilhos = []; s.poca.visible = false; }
      if (s.hit) { sc.remove(s.hit); s.hit = undefined; }
      if (s.holo) return;
      const h = new THREE.Group();
      const c = cor(hue, 0.6, 0.62);
      const linhas = k.g(new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.6 }));
      const pontilhado = k.g(new THREE.LineDashedMaterial({ color: c, dashSize: 0.45, gapSize: 0.3, transparent: true, opacity: 0.7 }));
      const faces = k.g(new THREE.MeshBasicMaterial({ color: 0x0a1020, transparent: true, opacity: 0.35, depthWrite: false }));
      const caixaG = k.g(new THREE.BoxGeometry(5, 4, 4));
      const ed = k.g(new THREE.LineSegments(k.g(new THREE.EdgesGeometry(caixaG)), linhas));
      ed.position.y = 2 + TOPO;
      const fc = new THREE.Mesh(caixaG, faces); fc.position.y = 2 + TOPO;
      const pts = Array.from({ length: 65 }, (_, i) => new THREE.Vector3(Math.cos((i / 64) * Math.PI * 2) * 4.2, TOPO + 0.04, Math.sin((i / 64) * Math.PI * 2) * 3.2));
      const anel = new THREE.Line(k.g(new THREE.BufferGeometry().setFromPoints(pts)), pontilhado);
      anel.computeLineDistances();
      h.add(fc, ed, anel);
      h.position.set(s.x, 0, s.z);
      s.holo = h; s.holoMats = [linhas, pontilhado];
      sc.add(h);
    };
    const abrir = (s: Slot, hue: number, animar: boolean) => {
      if (s.holo) { sc.remove(s.holo); s.holo = undefined; }
      const neon = corNeon(hue);
      k.cores = []; k.janelas = []; k.brilhos = [];
      k.neon = k.brilho(neon.clone().multiplyScalar(NEON), { side: THREE.BackSide, vertexColors: true });
      k.neon.onBeforeCompile = recuar;
      const g = new THREE.Group();
      s.m = MODELOS[s.id](k, g, hue);
      k.neon = undefined;
      s.g = g; s.cores = k.cores; s.janelas = k.janelas; s.brilhos = k.brilhos;
      (s.poca.material as THREE.MeshBasicMaterial).color.copy(neon);
      s.poca.visible = true;
      g.position.set(s.x, TOPO, s.z);
      sc.add(g);
      const hit = new THREE.Mesh(k.g(new THREE.BoxGeometry(8, s.m.alt, 6.6)), k.g(new THREE.MeshBasicMaterial({ visible: false })));
      hit.position.set(s.x, TOPO + s.m.alt / 2, s.z);
      hit.userData.id = s.id;
      sc.add(hit);
      s.hit = hit;
      s.subir = animar ? 0 : 1;
      if (animar) { s.flash = flashDe(hue); s.flash.r.position.set(s.x, YF, s.z); }
      g.scale.y = animar ? 0.001 : 1;
    };

    // --- camera framing
    let W = 0, H = 0, mx = 0, my = 0, px = 0, py = 0, T = 0;
    const dir = new THREE.Vector3();
    const alvoCam = new THREE.Vector3(), baseCam = new THREE.Vector3(), dir3 = new THREE.Vector3();
    // bounds to fit: the slab plus rough tower tops (taller at the back row) with label headroom
    const caixaCena = [
      ...[-1, 1].flatMap((a) => [-1, 1].map((c) => new THREE.Vector3(a * HX, -1.2, c * HZ))),
      ...[-1, 1].flatMap((a) => [[-10, 15], [0, 9], [10, 9]].map(([z, y]) => new THREE.Vector3(a * 16, y, z))),
      new THREE.Vector3(0, 15, -10),
    ];
    const enquadrar = () => {
      cam.aspect = W / H;
      // wide strips look low and flat; squarer boxes look down steeper so the nine lots spread over the height
      const pitch = 0.52 + 0.38 * Math.min(1, Math.max(0, (2.4 - cam.aspect) / 1.4));
      dir.set(Math.sin(0.42) * Math.cos(pitch), Math.sin(pitch), Math.cos(0.42) * Math.cos(pitch));
      cam.updateProjectionMatrix();
      alvoCam.set(0, 3, 1);
      let dist = 70;
      const tmp = new THREE.Vector3();
      for (let i = 0; i < 10; i++) {
        cam.position.copy(alvoCam).addScaledVector(dir, dist);
        cam.lookAt(alvoCam);
        cam.updateMatrixWorld();
        let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
        for (const c of caixaCena) { tmp.copy(c).project(cam); x0 = Math.min(x0, tmp.x); x1 = Math.max(x1, tmp.x); y0 = Math.min(y0, tmp.y); y1 = Math.max(y1, tmp.y); }
        dist *= Math.max((x1 - x0) / 2, (y1 - y0) / 2) / 0.93;
        const hh = dist * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
        const dx = (x0 + x1) / 2 * hh * cam.aspect, dy = (y0 + y1) / 2 * hh;
        cam.matrixWorld.extractBasis(tmp, dir3, new THREE.Vector3());
        alvoCam.addScaledVector(tmp, dx).addScaledVector(dir3, dy);
      }
      dist *= 0.86; // the box above is a worst case; the real towers are lower, so move in
      baseCam.copy(alvoCam).addScaledVector(dir, dist);
      // navy distance fog: none on the front row, about a third on the back row
      (sc.fog as THREE.Fog).near = dist * 0.85;
      (sc.fog as THREE.Fog).far = dist * 2.2;
    };

    // --- state
    let atual = '', alvo = '', iniciado = false, aberto: Slot[] = [];
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), v3 = new THREE.Vector3();
    const dR = new THREE.Vector3(), dU = new THREE.Vector3(), dF = new THREE.Vector3();
    const mk = { x: 0, z: 0, init: false };

    const cena: Cena = {
      tela,
      definir(pontos, a, b = '') {
        let mudou = false;
        for (const p of pontos) {
          const s = slots.get(p.id);
          if (!s) continue;
          s.hue = p.hue;
          if (p.aberto && !s.m) { abrir(s, p.hue, iniciado && !reduzido); mudou = true; }
          else if (!p.aberto && !s.holo) { fechar(s, p.hue); mudou = true; }
        }
        aberto = [...slots.values()].filter((s) => s.m);
        fonte.intensity = slots.get('praca')?.m ? FONTE : 0;
        if (a !== atual || b !== alvo) { atual = a; alvo = b; mudou = true; }
        iniciado = true;
        return mudou;
      },
      hover(id) {
        for (const s of slots.values()) s.hvAlvo = s.id === id && s.m ? 1 : 0;
      },
      mirar(nx, ny) { mx = reduzido ? 0 : nx; my = reduzido ? 0 : ny; },
      ajustar(w, h, dpr) {
        W = w; H = h;
        r.setPixelRatio(dpr);
        r.setSize(w, h, false);
        enquadrar();
      },
      quadro(dt) {
        if (!W) return;
        if (!reduzido) T += dt;
        const q = reduzido ? 1 : 1 - Math.exp(-dt * 9);
        const qm = reduzido ? 1 : 1 - Math.exp(-dt * 5);

        // camera: idle sway + parallax
        px += (mx - px) * (reduzido ? 1 : 1 - Math.exp(-dt * 3)); py += (my - py) * (reduzido ? 1 : 1 - Math.exp(-dt * 3));
        cam.position.copy(baseCam);
        cam.lookAt(alvoCam);
        cam.matrixWorld.extractBasis(dR, dU, dF);
        cam.position.addScaledVector(dR, px * 1.6 + Math.sin(T * 0.13) * 0.9).addScaledVector(dU, -py * 0.8 + Math.sin(T * 0.1) * 0.4);
        cam.lookAt(alvoCam);

        hemi.intensity = AMBIENTE + Math.sin(T * 0.5) * 0.05;
        (borda.material as THREE.LineBasicMaterial).opacity = 0.45 + Math.sin(T * 0.8) * 0.12;
        fonte.intensity = fonte.intensity > 0 ? FONTE * (1 + Math.sin(T * 3) * 0.13) : 0;

        // buildings
        for (const s of slots.values()) {
          s.hv += (s.hvAlvo - s.hv) * q;
          if (s.holo) {
            const o = 0.55 + Math.sin(T * 2.2 + s.x) * 0.15;
            s.holoMats.forEach((m) => { (m as THREE.LineBasicMaterial).opacity = o; });
            continue;
          }
          if (!s.g) continue;
          if (s.subir < 1) s.subir = Math.min(1, s.subir + dt / 1.1);
          let glow = s.hv * 0.55 + (1 - s.subir) * 0.8;
          if (s.id === alvo) glow += reduzido ? 0.5 : 0.4 + 0.3 * Math.sin(T * 4);
          const sy = Math.max(0.001, easeOutBack(s.subir)) * (1 + 0.04 * s.hv);
          s.g.scale.set(1 + 0.03 * s.hv, sy, 1 + 0.03 * s.hv);
          s.g.position.y = TOPO + 0.25 * s.hv;
          for (const m of s.cores) m.emissiveIntensity = (m.userData.b as number) + glow * 0.5;
          s.janelas.forEach((w, i) => { w.emissiveIntensity = 1 + glow * 1.1 + 0.06 * Math.sin(T * 0.9 + i * 2); });
          const viva = 1 + 0.08 * Math.sin(T * 1.6 + s.x); // the neon breathes a little
          for (const b of s.brilhos) b.m.color.copy(b.c).multiplyScalar(viva * (1 + glow * GANHO));
          (s.poca.material as THREE.MeshBasicMaterial).opacity = POCA * s.subir * viva * (1 + glow * 0.5);
          s.m?.anim?.(T);
        }
        for (const f of flashes) {
          if (f.t >= 1) { f.r.visible = false; continue; }
          f.t = Math.min(1, f.t + dt / 0.9);
          f.r.scale.setScalar(2.5 + f.t * 5);
          (f.r.material as THREE.MeshBasicMaterial).opacity = (1 - f.t) ** 1.5;
        }

        // player marker
        const sa = atual ? slots.get(atual) : undefined;
        marca.visible = diamante.visible = !!sa;
        if (sa) {
          if (!mk.init) { mk.x = sa.x; mk.z = sa.z; mk.init = true; }
          mk.x += (sa.x - mk.x) * qm; mk.z += (sa.z - mk.z) * qm;
          marca.position.set(mk.x, YF, mk.z);
          const topo = (sa.m ? sa.m.alt : 4) * (sa.m ? Math.max(0.001, easeOutBack(sa.subir)) : 1);
          diamante.position.set(mk.x, TOPO + topo + 1.3 + Math.sin(T * 2) * 0.25, mk.z);
          diamante.rotation.y = T * 1.5;
          mAnel.scale.setScalar(3.9 + Math.sin(T * 2.4) * 0.12);
        }

        // objective: pulsing rings + tall beam
        const sb = alvo ? slots.get(alvo) : undefined;
        alvoFx.visible = !!sb;
        if (sb) {
          alvoFx.position.set(sb.x, YF, sb.z);
          aAneis.forEach((a, i) => {
            const u = reduzido ? 0.3 : (T * 0.55 + i * 0.5) % 1;
            a.visible = !reduzido || i === 0;
            a.scale.setScalar(3.4 + 3.4 * u);
            (a.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - u) ** 1.4;
          });
          (aFeixe.material as THREE.MeshBasicMaterial).opacity = 0.55 + 0.15 * Math.sin(T * 3);
        }

        if (!reduzido) {
          for (const c of carros) {
            const W2 = c.x1 - c.x0, D = c.z1 - c.z0, P = 2 * (W2 + D);
            c.s = (c.s + c.v * dt) % P;
            const t = c.dir > 0 ? c.s : P - c.s;
            let x: number, z: number, hx: number, hz: number;
            if (t < W2) { x = c.x0 + t; z = c.z0; hx = 1; hz = 0; }
            else if (t < W2 + D) { x = c.x1; z = c.z0 + t - W2; hx = 0; hz = 1; }
            else if (t < 2 * W2 + D) { x = c.x1 - (t - W2 - D); z = c.z1; hx = -1; hz = 0; }
            else { x = c.x0; z = c.z1 - (t - 2 * W2 - D); hx = 0; hz = -1; }
            const al = Math.atan2(hx * c.dir, hz * c.dir);
            let d = al - c.rot; d = Math.atan2(Math.sin(d), Math.cos(d));
            c.rot += d * Math.min(1, dt * 10);
            c.g.position.set(x, TOPO, z);
            c.g.rotation.y = c.rot;
          }
          drones.forEach((d, i) => {
            d.a += d.w * dt;
            d.g.position.set(Math.cos(d.a) * d.rx, d.y + Math.sin(T * 1.3 + i * 2) * 0.5, Math.sin(d.a) * d.rz);
            d.g.rotation.y = -d.a;
            d.g.children[2].visible = (T * 2 + i) % 2 < 1.4;
          });
          for (let i = 0; i < NP; i++) {
            for (let j = 0; j < 3; j++) pp[i * 3 + j] += pv[i * 3 + j] * dt;
            if (pp[i * 3 + 1] > 15) pp[i * 3 + 1] = 0.3;
            if (Math.abs(pp[i * 3]) > 24) pp[i * 3] *= -0.98;
            if (Math.abs(pp[i * 3 + 2]) > 20) pp[i * 3 + 2] *= -0.98;
          }
          pa.needsUpdate = true;
        }

        r.render(sc, cam);

        // project label anchors
        cam.updateMatrixWorld();
        for (const s of slots.values()) {
          const lift = s.m && s.g ? s.m.rot * s.g.scale.y + s.g.position.y - TOPO + 0.5 + (s.id === atual ? 2.0 : 0) : 4.6;
          v3.set(s.x, TOPO + lift, s.z).project(cam);
          const t = tela[s.id];
          t.x = (v3.x + 1) / 2 * W; t.y = (1 - v3.y) / 2 * H; t.z = v3.z; t.v = v3.z < 1;
        }
      },
      escolher(cx, cy) {
        const b = canvas.getBoundingClientRect();
        if (!b.width) return null;
        ndc.set(((cx - b.left) / b.width) * 2 - 1, -((cy - b.top) / b.height) * 2 + 1);
        ray.setFromCamera(ndc, cam);
        const hit = ray.intersectObjects(aberto.map((s) => s.hit!), false)[0];
        return hit ? (hit.object.userData.id as string) : null;
      },
      descartar() {
        k.lixo.forEach((x) => x.dispose());
        r.dispose();
        r.forceContextLoss();
      },
    };
    return cena;
  } catch (e) {
    r.dispose();
    r.forceContextLoss();
    throw e;
  }
}
