// Shruggie Agent Office: an isometric pixel office where every Claude agent on this Mac
// walks to the room for its current work. Everything is drawn at 800×520 logical pixels
// into a buffer and scaled up by whole device pixels, so every pixel stays crisp.
// The room is styled like a real branded office: natural materials, with the brand in
// the places a real office puts it (feature wall, neon, posters, mugs, chairs, doormat).

// ---------- Colours ----------
const C = {
  ink: '#161616', red: '#bb061e', redDark: '#a2000f', rust: '#f51d31', acid: '#e2c500', acidDark: '#c9ae00', acidLight: '#f0d947',
  white: '#ffffff', grey: '#8a8a8a',
};
const I = { // interior
  planks: ['#d9b48a', '#d2ab80', '#dfbb92', '#cda67b', '#d6b086', '#e2c09a'], gap: '#a8835c', grain: '#c69f74',
  wallA: '#f1f1ef', wallB: '#fbfbfa', cap: '#ffffff', capSide: '#d9d9d6', base: '#e2e2df', baseTop: '#ffffff',
  slabL: '#a8835c', slabR: '#8a6a48',
  oak: '#c79d6e', oakD: '#a27a51', oakDD: '#7d5b3b', oakLine: '#4a3424',
  steel: '#2b2b2b', steelL: '#3d3d3d', metal: '#9aa0a6', chrome: '#c3c8cd',
  leather: '#9a5a34', leatherD: '#7e4626', fabric: '#2e2e2e',
  leaf1: '#2c5e36', leaf2: '#3b7a46', leaf3: '#55a060', leaf4: '#79bd78', terracotta: '#c46b4a', ceramic: '#ece6da',
  books: ['#25324a', '#c99a2e', '#2f5a45', '#7a2630', '#e9e1cf', '#1e1e1e', '#8a8f96', '#b5603a', '#4b6b8a', '#d8cdb0', '#5c3d5e', '#a3a77e'],
};
const SHIRTS = [C.rust, C.acid, '#1f1f1f', C.white, C.red, '#4b6b8a', '#8a8f96', '#f7a1a8', '#2f5a45', '#c99a2e'];
const STATUS = { tool: C.rust, thinking: C.acid, waiting: C.grey, done: C.ink };
const SKIN = ['#f3cfae', '#e0ac85', '#b97f57', '#8a5a3b', '#f7dcc6', '#6b4430'];
const HAIR = ['#2b1d16', '#5a3a22', '#c9a04a', '#161616', '#a84a2a', '#e8e0d0', '#7a6a5a'];
const PANTS = ['#2b2b2b', '#2f3b52', '#4a4a4a', '#5a4a3a', '#3a3a3a', '#26324a', '#6b6252'];
const SHOES = ['#161616', '#5a3a22', '#f2f2f2', '#161616', '#b5603a'];
const SHRUG = '¯\\_(ツ)_/¯';

// Public mode, for the website (shruggie.consulting/agentur/buero):
// window.OFFICE = { mode: 'public', endpoint, lang: 'de' | 'en', extras }. The data is the
// anonymised snapshot from the workspace (role, room, state, first names); a few extras fill
// the room so it never looks empty. Locally (node server.js) the full view runs as before.
const CFG = window.OFFICE || {}, PUBLIC = CFG.mode === 'public', LANG = CFG.lang === 'de' ? 'de' : 'en';
// What visitors read (bubbles and the list): a few lines per room, rotating every 20 s, so
// it stays readable for people who don't know what a "tool call" is.
const PHRASES = {
  de: {
    desks: ['schreibt Code', 'baut an einer Seite', 'räumt Code auf', 'tippt konzentriert'],
    library: ['liest Doku', 'sucht etwas raus', 'blättert durch Notizen'],
    servers: ['startet ein Skript', 'testet etwas', 'baut die Website neu'],
    window: ['recherchiert im Netz', 'schaut sich Websites an', 'sammelt Ideen'],
    meeting: ['brieft einen Helfer', 'verteilt Aufgaben', 'bespricht den Plan'],
    mailroom: ['schreibt eine Mail', 'sortiert die Post', 'trägt Termine ein'],
    whiteboard: ['denkt nach', 'skizziert eine Idee', 'überlegt den nächsten Schritt'],
    lounge: ['wartet auf Feedback', 'ist fertig und wartet', 'macht Pause bis zur Rückmeldung'],
    exit: ['geht heim'],
  },
  en: {
    desks: ['writing code', 'building a page', 'tidying up code', 'typing away'],
    library: ['reading docs', 'looking something up', 'going through notes'],
    servers: ['running a script', 'testing something', 'rebuilding the website'],
    window: ['researching online', 'looking at websites', 'collecting ideas'],
    meeting: ['briefing a helper', 'handing out tasks', 'going over the plan'],
    mailroom: ['writing an email', 'sorting the post', 'adding dates to the calendar'],
    whiteboard: ['thinking it over', 'sketching an idea', 'working out the next step'],
    lounge: ['waiting for feedback', 'done and waiting', 'taking a break until we reply'],
    exit: ['heading home'],
  },
}[LANG];
const HUMAN_PHRASES = {
  de: { pingpong: ['spielt Ping-Pong', 'verliert gerade beim Ping-Pong', 'übt den Aufschlag'], coffee: ['holt sich einen Kaffee', 'plaudert an der Kaffeemaschine', 'wartet auf den Espresso'],
        meeting: ['im Meeting'], desks: ['arbeitet konzentriert', 'sitzt am Schreibtisch'], lounge: ['ist kurz weg', 'macht Pause'] },
  en: { pingpong: ['playing ping-pong', 'losing at ping-pong', 'practising the serve'], coffee: ['getting a coffee', 'chatting at the coffee machine', 'waiting for the espresso'],
        meeting: ['in a meeting'], desks: ['heads down at a desk', 'working at a desk'], lounge: ['away for a moment', 'on a break'] },
}[LANG];
const rotate = (list, seed) => list[(hash(seed) + Math.floor(Date.now() / 20000)) % list.length];
const agentPhrase = (p) => rotate(PHRASES[p.zone] || PHRASES.whiteboard, p.id);
function humanPhrase(p) {
  if (!p) return '';
  const z = p.zone === 'humans' ? (p.spot && p.spot.u < 250 ? 'pingpong' : 'coffee') : p.zone;
  return rotate(HUMAN_PHRASES[z] || HUMAN_PHRASES.coffee, p.id);
}
const dogPhrase = () => LANG === 'de'
  ? (dog.moving ? 'dreht eine Runde' : dog.pose === 'lie' ? 'macht ein Nickerchen' : dog.pose === 'sit' ? 'leistet jemandem Gesellschaft' : 'schaut sich um')
  : (dog.moving ? 'doing a lap' : dog.pose === 'lie' ? 'taking a nap' : dog.pose === 'sit' ? 'keeping someone company' : 'looking around');
const T = { de: { dog: 'Henry, Office-Hund', extra: 'Statist', agents: 'Agenten', humans: 'Menschen', nobody: 'Gerade arbeitet kein Agent. Die Statisten halten die Stellung.' }, en: { dog: 'Henry, office dog', extra: 'Extra', agents: 'Agents', humans: 'Humans', nobody: 'No agent is working right now. The extras are holding the fort.' } }[LANG];

// ---------- Projection ----------
const LW = 800, LH = 520, OX = 400, OY = 118, ROOM = 380, WALL = 96;
const P = (u, v, z = 0) => [OX + u - v, OY + (u + v) / 2 - z];

// ---------- Canvases + pixel helpers ----------
// Everything is laid out in logical units (800×520) but drawn straight at device resolution:
// K device pixels per unit. So edges, lettering and glows get every pixel the screen has.
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const mk = (w, h, read) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); const g = c.getContext('2d', read ? { willReadFrequently: true } : undefined); g.imageSmoothingEnabled = false; return [c, g]; };
let K = 2, S = 1, DPR = 1, UIS = 1;
let bgC, bgG, scr, scrG, lightC, lightG;
let G = ctx;

const R = (x, y, w, h, c) => {
  const X = Math.round(x * K), Y = Math.round(y * K);
  G.fillStyle = c; G.fillRect(X, Y, Math.round((x + w) * K) - X, Math.round((y + h) * K) - Y);
};
function hash(s) {
  let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1, 7), 16);
  const ch = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt));
  return '#' + ch.map(v => v.toString(16).padStart(2, '0')).join('');
}
// Fill a convex polygon column by column, so edges come out as clean 2:1 pixel stairs.
function poly(pts, c) {
  G.fillStyle = c;
  let minx = Infinity, maxx = -Infinity;
  for (const [x] of pts) { if (x < minx) minx = x; if (x > maxx) maxx = x; }
  const n = pts.length;
  for (let xi = Math.floor(minx * K); xi < Math.ceil(maxx * K); xi++) {
    const xc = (xi + 0.5) / K; let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < n; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % n];
      if (x1 === x2 || xc < Math.min(x1, x2) || xc > Math.max(x1, x2)) continue;
      const y = y1 + (y2 - y1) * (xc - x1) / (x2 - x1);
      if (y < lo) lo = y; if (y > hi) hi = y;
    }
    if (hi > lo) { const a = Math.round(lo * K), b = Math.round(hi * K); if (b > a) G.fillRect(xi, a, 1, b - a); }
  }
}
// An isometric box. Left face = the side facing +v (lower left), right face = facing +u (lower right).
function B(u, v, z, du, dv, dz, top, o = {}) {
  const left = o.left || shade(top, -0.13), right = o.right || shade(top, -0.3);
  const sil = [P(u, v, z + dz), P(u + du, v, z + dz), P(u + du, v, z), P(u + du, v + dv, z), P(u, v + dv, z), P(u, v + dv, z + dz)];
  if (o.outline) for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) poly(sil.map(([x, y]) => [x + ox, y + oy]), o.outline);
  if (dz > 0) {
    poly([P(u, v + dv, z), P(u + du, v + dv, z), P(u + du, v + dv, z + dz), P(u, v + dv, z + dz)], left);
    poly([P(u + du, v, z), P(u + du, v + dv, z), P(u + du, v + dv, z + dz), P(u + du, v, z + dz)], right);
  }
  poly([P(u, v, z + dz), P(u + du, v, z + dz), P(u + du, v + dv, z + dz), P(u, v + dv, z + dz)], top);
  if (o.hi !== false && dz > 0) { // a light front edge on the top
    for (let k = 0; k < du; k += 2) { const [x, y] = P(u + k, v + dv, z + dz); R(x, y, 2, 1, o.hiColor || shade(top, 0.18)); }
  }
}
const lineU = (u0, u1, v, z, c) => { for (let u = u0; u < u1; u += 2) { const [x, y] = P(u, v, z); R(x, y, 2, 1, c); } };
const lineV = (v0, v1, u, z, c) => { for (let v = v0; v < v1; v += 2) { const [x, y] = P(u, v, z); R(x - 2, y, 2, 1, c); } };

// Textures are drawn flat, then sheared onto a wall, a box face or the floor (nearest neighbour).
function tex(w, h, fn) { const [c, g] = mk(w * K, h * K); const prev = G; G = g; fn(g, w, h); G = prev; return c; }
function put(img, a, b, c, d, e, f, alpha = 1) { G.save(); G.imageSmoothingEnabled = false; G.globalAlpha = alpha; G.setTransform(a, b, c, d, Math.round(e * K), Math.round(f * K)); G.drawImage(img, 0, 0); G.restore(); }
const onV = (img, vc, u0, zTop, al) => put(img, 1, 0.5, 0, 1, OX + u0 - vc, OY + (u0 + vc) / 2 - zTop, al);       // plane v = vc, x along +u
const onU = (img, uc, vLeft, zTop, al) => put(img, 1, -0.5, 0, 1, OX + uc - vLeft, OY + (uc + vLeft) / 2 - zTop, al); // plane u = uc, x along -v
const onZ = (img, z, u0, v0, al) => put(img, 1, 0.5, -1, 0.5, OX + u0 - v0, OY + (u0 + v0) / 2 - z, al);              // floor/top plane

// Text at device resolution. thr > 0 hardens the edges (pixel lettering), thr = 0 keeps them smooth (print).
// o.ls = letter spacing in units.
function pxText(s, x, y, font, color, align = 'left', thr = 120, o = {}) {
  const size = parseFloat(font.match(/([\d.]+)px/)[1]), f = font.replace(/[\d.]+px/, (size * K).toFixed(2) + 'px');
  const [c, t] = mk(1, 1); t.font = f; if (o.ls) t.letterSpacing = (o.ls * K).toFixed(2) + 'px';
  const w = Math.ceil(t.measureText(s).width) + 8, h = Math.ceil(size * K * 1.5) + 8, base = Math.ceil(size * K * 1.15) + 4;
  c.width = w; c.height = h; t.font = f; if (o.ls) t.letterSpacing = (o.ls * K).toFixed(2) + 'px'; t.fillStyle = color; t.fillText(s, 4, base);
  if (thr) { const id = t.getImageData(0, 0, w, h); for (let i = 3; i < id.data.length; i += 4) id.data[i] = id.data[i] > thr ? 255 : 0; t.putImageData(id, 0, 0); }
  const X = x * K, ox = align === 'center' ? X - w / 2 : align === 'right' ? X - w + 4 : X - 4;
  G.drawImage(c, Math.round(ox), Math.round(y * K - base));
}
// Pixel disc and leaf clusters (screen space).
const disc = (cx, cy, r, c) => { for (let dy = -r; dy <= r; dy++) { const hw = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.8)); R(cx - hw, cy + dy, hw * 2 + 1, 1, c); } };
function leaf(x, y, w, h, c, vein) { // a pointed oval leaf
  for (let dy = 0; dy < h; dy++) { const t = dy / (h - 1 || 1); const hw = Math.round(Math.sin(Math.PI * Math.min(1, t * 1.08)) * w / 2); if (hw > 0) R(x - hw, y + dy, hw * 2, 1, c); }
  if (vein) R(x, y + 1, 1, h - 2, vein);
}
function foliage(x, y, size, seed) {
  const n = 5 + size * 2;
  for (let i = 0; i < n; i++) {
    const h = hash(seed + ':' + i), ang = (i / n) * Math.PI * 2 + (h % 100) / 100;
    const r = size * (2 + (h >>> 8) % 4);
    const lx = x + Math.round(Math.cos(ang) * r * 1.2), ly = y + Math.round(Math.sin(ang) * r * 0.7) - size * 3;
    const col = [I.leaf1, I.leaf2, I.leaf3, I.leaf4][(h >>> 12) % (i < n / 2 ? 2 : 4)];
    leaf(lx, ly, 4 + size * 2, 6 + size * 3, col, shade(col, -0.3));
  }
}

// ---------- Layout ----------
const ZONES = { humans: [], desks: [], library: [], servers: [], window: [], meeting: [], mailroom: [], whiteboard: [], lounge: [], exit: [{ u: 352, v: 10, face: 'fl' }] };
const DESKS = [];
for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
  const u = 92 + i * 38, v = 112 + r * 94;
  DESKS.push({ u, v, n: DESKS.length });
  ZONES.desks.push({ u: u + 17, v: v + 31, face: 'br', sit: true, desk: DESKS.length - 1 });
}
[[36, 72], [36, 94], [36, 116], [36, 138], [52, 84], [52, 128]].forEach(([u, v]) => ZONES.library.push({ u, v, face: 'bl' }));
[[32, 190], [32, 212], [32, 252], [32, 274], [48, 200], [48, 262]].forEach(([u, v]) => ZONES.window.push({ u, v, face: 'bl' }));
[[20, 38], [38, 38], [56, 40], [28, 54], [46, 56], [64, 56]].forEach(([u, v]) => ZONES.servers.push({ u, v, face: 'br' }));
[[194, 36], [212, 36], [228, 38], [202, 54], [220, 56]].forEach(([u, v]) => ZONES.whiteboard.push({ u, v, face: 'br' }));
[[248, 34], [266, 34], [284, 36], [256, 52], [276, 54]].forEach(([u, v]) => ZONES.mailroom.push({ u, v, face: 'br' }));
// real humans who are available hang out at the ping-pong table and the coffee machine
[[142, 306, 'fr'], [236, 322, 'bl'], [370, 262, 'bl'], [142, 322, 'fr'], [236, 306, 'bl'], [318, 286, 'br']].forEach(([u, v, face]) => ZONES.humans.push({ u, v, face }));
const MEETING = [[272, 94, 'fl'], [292, 94, 'fl'], [312, 94, 'fl'], [272, 154, 'br'], [292, 154, 'br'], [312, 154, 'br'], [252, 124, 'fr'], [332, 124, 'bl']];
MEETING.forEach(([u, v, face]) => ZONES.meeting.push({ u, v, face, sit: true }));
[[18, 316, 'fr', 1], [18, 334, 'fr', 1], [18, 352, 'fr', 1], [92, 322, 'bl'], [92, 346, 'bl'], [312, 290, 'br'], [330, 290, 'br'], [348, 290, 'br'], [108, 300, 'bl'], [72, 372, 'br']]
  .forEach(([u, v, face, sit]) => ZONES.lounge.push({ u, v, face, sit: !!sit }));

// Walkable grid (4 units per cell) for routing around furniture.
const CELL = 4, GN = Math.ceil(ROOM / CELL);
const blocked = new Uint8Array(GN * GN);
function block(u0, u1, v0, v1) {
  for (let a = Math.floor(u0 / CELL); a <= Math.floor((u1 - 0.01) / CELL); a++) for (let b = Math.floor(v0 / CELL); b <= Math.floor((v1 - 0.01) / CELL); b++)
    if (a >= 0 && b >= 0 && a < GN && b < GN) blocked[a * GN + b] = 1;
}

// ---------- Background: floor, rugs, walls, wall furniture ----------
function drawFloor() {
  B(0, 0, -10, ROOM, ROOM, 10, I.planks[0], { left: I.slabL, right: I.slabR, hi: false });
  const floor = tex(ROOM, ROOM, () => {
    for (let v = 0; v < ROOM; v += 10) {
      let u = -((hash('row' + v) % 60));
      while (u < ROOM) {
        const h = hash(`pl${u}|${v}`), len = 46 + h % 70;
        R(u, v, len, 10, I.planks[h % I.planks.length]);
        for (let g = 0; g < 3; g++) { const gh = hash(`gr${u}|${v}|${g}`); R(u + 4 + gh % Math.max(1, len - 20), v + 2 + (gh >>> 8) % 3 * 2, 6 + (gh >>> 12) % 14, 2, I.grain); }
        R(u + len - 2, v, 2, 10, I.gap);
        u += len;
      }
      R(0, v + 8, ROOM, 2, I.gap);
    }
  });
  onZ(floor, 0, 0, 0);

  // rugs
  onZ(tex(166, 152, (g, w, h) => { // sage rug under the desks
    R(0, 0, w, h, '#8a9a84'); R(4, 4, w - 8, h - 8, '#a9b8a3'); R(10, 10, w - 20, h - 20, '#98a892'); R(12, 12, w - 24, h - 24, '#a9b8a3');
    for (let y = 16; y < h - 16; y += 6) for (let x = 16 + (y % 12 ? 3 : 0); x < w - 16; x += 6) R(x, y, 2, 2, '#9eae98');
  }), 0, 84, 104);
  onZ(tex(100, 84, (g, w, h) => { // charcoal rug under the meeting table
    R(0, 0, w, h, '#6b7078'); R(4, 4, w - 8, h - 8, '#868b93');
    for (let y = 10; y < h - 8; y += 8) for (let x = 10 + (y % 16 ? 4 : 0); x < w - 8; x += 8) R(x, y, 2, 2, '#9a9fa7');
  }), 0, 244, 82);
  onZ(tex(118, 96, (g, w, h) => { // cream berber rug in the lounge
    R(0, 0, w, h, '#e6ddca'); R(2, 2, w - 4, h - 4, '#f6f1e6');
    for (let y = 8; y < h - 6; y += 12) for (let x = 6; x < w - 6; x += 12) { R(x + 4, y, 2, 2, '#4a4038'); R(x + 2, y + 2, 2, 2, '#4a4038'); R(x + 6, y + 2, 2, 2, '#4a4038'); R(x + 4, y + 4, 2, 2, '#4a4038'); }
    for (let x = 0; x < w; x += 4) { R(x, 0, 2, 2, '#f4efe4'); R(x, h - 2, 2, 2, '#f4efe4'); }
  }), 0, 0, 284);
  onZ(tex(36, 18, (g, w, h) => { // red doormat
    R(0, 0, w, h, C.redDark); R(2, 2, w - 4, h - 4, C.red);
    for (let x = 4; x < w - 4; x += 4) R(x, 4, 2, h - 8, '#c40d24');
  }), 0, 334, 4);
  // soft contact shadows under the furniture
  for (const o of OBJECTS) if (o.shadow !== false) {
    const [u0, u1, v0, v1] = o.f;
    G.globalAlpha = 0.14; poly([P(u0 + 2, v1), P(u1 + 2, v1), P(u1 + 6, v1 + 4), P(u0 + 6, v1 + 4)], '#1a120b'); poly([P(u1, v0 + 2), P(u1 + 4, v0 + 6), P(u1 + 4, v1 + 4), P(u1, v1)], '#1a120b'); G.globalAlpha = 1;
  }
}

const WINDOWS = [[6, 54], [172, 226], [236, 290]];
const WIN_H = 70, WIN_TOP = 86; // tall windows: from z 16 up to z 86
function drawWalls() {
  // thick walls: caps and end faces
  B(-8, -8, 0, ROOM + 8, 8, WALL, I.cap, { left: I.wallA, right: I.capSide, hi: false });
  B(-8, -8, 0, 8, ROOM + 8, WALL, I.cap, { left: I.capSide, right: I.wallB, hi: false });
  lineU(-8, ROOM, 0, WALL, '#e6e6e3'); lineV(-8, ROOM, 0, WALL, '#e6e6e3');
  // the outer top edges, so the white walls still read against a white page
  lineU(-8, ROOM, -8, WALL, '#c9c9c5'); lineV(-8, ROOM, -8, WALL, '#c9c9c5');
  { const [x0, y0] = P(-8, -8, WALL); R(x0 - 1, y0, 2, 1, '#c9c9c5'); }

  // wall A (v = 0): feature wall with logo, whiteboard, sconces, clock, poster, door
  onV(tex(ROOM, WALL, (g, w, h) => {
    R(0, 0, w, h, I.wallA);
    for (let i = 0; i < 900; i++) { const k = hash('pa' + i); R(k % w, (k >>> 9) % h, 1, 1, (k >>> 20) % 2 ? '#ebebe8' : '#f6f6f4'); }
    R(0, h - 5, w, 5, I.base); R(0, h - 5, w, 1, I.baseTop);
    // red feature panel
    R(56, 6, 122, 72, C.redDark); R(56.5, 6.5, 121, 71, C.red);
    for (let y = 9; y < 76; y += 3) R(57, y, 120, 0.5, '#b2041a'); // fine acoustic slats
    R(56.5, 6.5, 121, 0.5, '#d01a30'); R(56.5, 77, 121, 0.5, '#8a0010');
    // the wordmark, set like the website lockup: SHRUGGIE in Archivo Black, the dot in acid
    { const wm = '400 15px "Archivo Black"', [mc, mt] = mk(1, 1); mt.font = wm.replace('15px', 15 * K + 'px'); mt.letterSpacing = (-0.3 * K) + 'px';
      const ww = mt.measureText('SHRUGGIE').width / K, x0 = 117 - (ww + 5) / 2;
      pxText('SHRUGGIE', x0 + 0.4, 67.4, wm, '#7a0010', 'left', 0, { ls: -0.3 }); // a hint of depth, like painted lettering
      pxText('SHRUGGIE', x0, 67, wm, C.white, 'left', 0, { ls: -0.3 });
      pxText('.', x0 + ww + 0.3, 67, wm, C.acid, 'left', 0); }
    R(98, 71, 38, 0.6, C.rust); pxText('AGENT OFFICE', 117, 75.6, '700 3.6px "Space Grotesk"', '#ffd8dc', 'center', 0, { ls: 0.55 });
    // neon mounting: a clear acrylic backplate with four standoffs
    R(64, 9, 106, 31, '#c41a2f'); R(64, 9, 106, 0.5, '#d6394b');
    for (const [sx, sy] of [[66, 11], [167, 11], [66, 37], [167, 37]]) { R(sx, sy, 1.2, 1.2, '#e9e9e9'); R(sx + 0.4, sy + 0.4, 0.5, 0.5, '#9a9a9a'); }
    // whiteboard
    R(188, 18, 48, 44, '#aeb4ba'); R(189, 19, 46, 42, '#f8f8f6'); R(189, 19, 46, 1, '#ffffff');
    pxText(SHRUG, 212, 34, '700 8px "Space Grotesk"', C.rust, 'center', 100);
    [5, 9, 7, 12, 15].forEach((bh, i) => R(194 + i * 5, 56 - bh, 3, bh, i === 4 ? C.rust : '#2b2b2b'));
    R(192, 56, 26, 1, '#2b2b2b'); R(222, 40, 9, 8, C.acidLight); R(222, 50, 9, 8, '#f7a1a8'); R(224, 43, 5, 1, '#555'); R(224, 53, 4, 1, '#555');
    R(190, 62, 44, 2, '#9aa0a6'); R(196, 61, 5, 1, C.rust); R(203, 61, 5, 1, '#2b2b2b'); R(210, 61, 5, 1, '#3b6fd0');
    // sconces
    for (const x of [46, 182]) { R(x, 28, 1, 6, '#9a7a3e'); R(x - 3, 24, 7, 5, '#f3e3c0'); R(x - 3, 28, 7, 1, '#d9c39a'); R(x - 2, 23, 5, 1, '#f8eed6'); }
    // clock face (hands are animated)
    { const cx = 264, cy = 20; for (let dy = -8; dy <= 8; dy++) { const hw = Math.floor(Math.sqrt(64 - dy * dy + 6)); R(cx - hw, cy + dy, hw * 2 + 1, 1, '#2b2b2b'); }
      for (let dy = -6; dy <= 6; dy++) { const hw = Math.floor(Math.sqrt(36 - dy * dy + 5)); R(cx - hw, cy + dy, hw * 2 + 1, 1, '#fbfaf6'); }
      for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; R(cx + Math.round(Math.sin(a) * 5), cy - Math.round(Math.cos(a) * 5), 1, 1, k % 3 ? '#bbb' : '#2b2b2b'); } }
    // framed poster: yellow, agency maths
    R(296, 20, 26, 34, '#1e1e1e'); R(298, 22, 22, 30, C.acid); [4, 7, 6, 10, 13].forEach((bh, i) => R(301 + i * 4, 48 - bh, 3, bh, i === 4 ? C.red : '#1e1e1e'));
    pxText('ツ', 309, 32, '700 9px "Space Grotesk"', '#1e1e1e', 'center', 110);
    // door
    R(332, 10, 40, 86, I.oakDD); R(334, 12, 36, 84, I.oak);
    for (const [x, y, ww, hh] of [[337, 16, 13, 30], [354, 16, 13, 30], [337, 52, 13, 36], [354, 52, 13, 36]]) { R(x, y, ww, hh, I.oakD); R(x + 1, y + 1, ww - 2, hh - 2, '#b98f62'); R(x + 1, y + hh - 2, ww - 2, 1, I.oakD); }
    R(365, 50, 4, 2, I.chrome); R(366, 52, 2, 3, I.chrome); R(334, 90, 36, 6, '#8d9298');
    R(343, 3, 18, 6, '#2f6b4a'); pxText('EXIT', 352, 8, '700 5px "Space Grotesk"', '#ffffff', 'center', 90);
  }), 0, 0, WALL);

  // wall B (u = 0): library side with windows, sconces and a print above the sofa (x runs from v=380 to v=0)
  onU(tex(ROOM, WALL, (g, w, h) => {
    R(0, 0, w, h, I.wallB);
    for (let i = 0; i < 900; i++) { const k = hash('pb' + i); R(k % w, (k >>> 9) % h, 1, 1, (k >>> 20) % 2 ? '#f4f4f2' : '#ffffff'); }
    R(0, h - 5, w, 5, I.base); R(0, h - 5, w, 1, I.baseTop);
    for (const x of [380 - 167, 380 - 232, 380 - 297]) { R(x, 28, 1, 6, '#9a7a3e'); R(x - 3, 24, 7, 5, '#f3e3c0'); R(x - 3, 28, 7, 1, '#d9c39a'); R(x - 2, 23, 5, 1, '#f8eed6'); }
    // print above the sofa: a big shrug on red, white mat, black frame
    R(18, 26, 48, 32, '#1e1e1e'); R(20, 28, 44, 28, '#f4f1ea'); R(24, 31, 36, 22, C.red);
    pxText(SHRUG, 42, 45, '700 8px "Space Grotesk"', '#ffffff', 'center', 0);
  }), 0, ROOM, WALL);

  // window sills (the windows themselves are animated)
  for (const [v1, v2] of WINDOWS) B(0, v1 - 2, WIN_TOP - WIN_H - 2, 5, v2 - v1 + 4, 2, '#ece7df', { outline: '#a59c8e' });

  // docs wall (the bookshelves are gone, it's 2026): a big screen over a low oak sideboard
  B(0, 70, 0, 12, 80, 16, I.oak, { outline: I.oakLine, left: I.oakD, right: I.oakDD });
  onU(tex(80, 16, () => {
    R(0, 0, 80, 16, I.oakD); for (const x of [26, 53]) R(x, 1, 1, 14, I.oakDD);
    for (const x of [13, 39, 66]) R(x - 3, 7, 6, 1, '#3a2a1e'); R(0, 15, 80, 1, I.oakDD); R(0, 0, 80, 1, '#d3ab7c');
  }), 12, 150, 16);
  B(3, 76, 16, 6, 6, 7, I.ceramic, { outline: '#8a8070' }); { const [x, y] = P(6, 79, 23); foliage(x, y, 1, 'docsplant'); }
  B(3, 136, 16, 5, 6, 10, '#2b2b2b', { outline: '#111' }); { const [x, y] = P(5.5, 142, 22); disc(x + 1, y - 1, 1, '#555'); }
  B(4, 108, 16, 7, 9, 1, '#f4f1ea', { outline: '#bfb8aa' }); B(5, 109, 17, 5, 7, 1, '#e9e1cf', { outline: '#bfb8aa', hi: false });
  B(0, 64, 26, 2, 92, 54, '#1c1c1c', { outline: '#0a0a0a', left: '#141414', right: '#262626', hi: false });

  // server rack in the back corner (its front is animated)
  B(12, 0, 0, 34, 22, 84, '#1c1c1c', { outline: '#0a0a0a', left: '#141414', right: '#232323' });
  B(46, 0, 70, 8, 4, 3, '#3d3d3d'); // cable tray into the wall

  // mail cabinet: grey metal pigeonholes with letters, drawers below
  B(238, 0, 0, 52, 20, 44, I.metal, { outline: '#4f555b', left: '#8e949a', right: '#767c82' });
  onV(tex(52, 44, (g, w, h) => {
    R(0, 0, w, h, '#8e949a');
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
      const x = 2 + c * 12, y = 2 + r * 11; R(x, y, 11, 10, '#4f555b'); R(x + 1, y + 1, 9, 8, '#2f3337');
      const hh = hash(`mail${r}${c}`); if (hh % 4) { const col = ['#ffffff', '#f4f1ea', C.acidLight, '#f7a1a8', '#cfe3f5'][hh % 5]; R(x + 2, y + 3, 7, 6, col); R(x + 2, y + 3, 7, 1, shade(col, -0.18)); if (hh % 3 === 0) R(x + 6, y + 5, 2, 2, C.rust); }
    }
    for (let r = 0; r < 2; r++) { const y = 25 + r * 9; R(2, y, w - 4, 8, '#9aa0a6'); R(2, y, w - 4, 1, '#b5bbc1'); R(w / 2 - 4, y + 3, 8, 2, '#4f555b'); R(4, y + 2, 6, 3, '#f4f1ea'); }
  }), 20, 238, 44);
  B(242, 4, 44, 14, 10, 3, '#2b2b2b'); B(244, 5, 47, 10, 8, 1, '#f4f1ea', { hi: false });
  B(262, 4, 44, 12, 10, 8, '#c9955a', { outline: '#8a6238' }); lineU(262, 274, 9, 52, C.rust);
  B(280, 6, 44, 6, 6, 5, I.terracotta, { outline: '#7a3f2a' });
  { const [x, y] = P(283, 9, 49); foliage(x, y, 1, 'mailplant'); }
  // door frame protrudes a little
  B(330, 0, 0, 3, 3, 88, I.oakDD, { hi: false }); B(370, 0, 0, 3, 3, 88, I.oakDD, { hi: false }); B(330, 0, 86, 43, 3, 3, I.oakDD, { hi: false });
}

// ---------- Floor furniture: pre-rendered sprites, depth sorted with the people ----------
const OBJECTS = [];
function obj(f, draw, o = {}) { OBJECTS.push({ f, draw, ...o }); if (o.block !== false) block(f[0] - 2, f[1] + 2, f[2] - 2, f[3] + 2); }

function officeChair(cu, cv, part) {
  if (part !== 'back') {
    B(cu - 4, cv - 1, 0, 8, 2, 1, '#1d1d1d', { hi: false }); B(cu - 1, cv - 4, 0, 2, 8, 1, '#1d1d1d', { hi: false });
    for (const [a, b] of [[-4, 0], [4, 0], [0, -4], [0, 4]]) { const [x, y] = P(cu + a, cv + b); R(x - 1, y, 2, 1, '#0e0e0e'); }
    B(cu - 1, cv - 1, 1, 2, 2, 4, '#4a4a4a', { hi: false });
    B(cu - 5, cv - 5, 5, 10, 10, 2, '#2e2e2e', { outline: '#111' });
  }
  if (part !== 'seat') { B(cu - 5, cv + 4, 7, 10, 2, 11, '#2e2e2e', { outline: '#111', hiColor: '#4a4a4a' }); B(cu - 1, cv + 4, 5, 2, 1, 3, '#4a4a4a', { hi: false }); }
}
function designChair(cu, cv, face, part) { // yellow meeting chair: seat on thin legs, backrest on the far side
  const back = { fl: [cu - 4, cv - 6, 8, 2], br: [cu - 4, cv + 4, 8, 2], fr: [cu - 6, cv - 4, 2, 8], bl: [cu + 4, cv - 4, 2, 8] }[face];
  if (part !== 'back') {
    for (const [a, b] of [[-4, -4], [3, -4], [-4, 3], [3, 3]]) B(cu + a, cv + b, 0, 1, 1, 5, '#1d1d1d', { hi: false });
    B(cu - 4, cv - 4, 5, 8, 8, 2, C.acid, { outline: '#6b5c00', left: C.acidDark, right: '#ad9500' });
  }
  if (part !== 'seat') B(back[0], back[1], 7, back[2], back[3], 9, C.acid, { outline: '#6b5c00', left: C.acidDark, right: '#ad9500' });
}

function defineObjects() {
  // desks
  for (const d of DESKS) {
    const { u, v, n } = d, du = 34, dv = 22, H = 11;
    obj([u, u + du, v, v + dv], () => {
      for (const [lu, lv] of [[1, 1], [du - 3, 1], [1, dv - 3], [du - 3, dv - 3]]) B(u + lu, v + lv, 0, 2, 2, H, I.steel, { hi: false });
      B(u + 2, v + 2, 4, du - 4, 1, 1, I.steel, { hi: false });
      B(u, v, H, du, dv, 2, I.oak, { outline: I.oakLine, left: I.oakD, right: I.oakDD });
      // monitor on its stand
      B(u + 14, v + 4, 13, 6, 4, 1, '#2b2b2b', { hi: false }); B(u + 16, v + 5, 14, 2, 2, 4, '#3a3a3a', { hi: false });
      B(u + 8, v + 3, 17, 18, 2, 12, '#1d1d1d', { outline: '#0a0a0a', left: '#141414', right: '#262626' });
      // keyboard, mouse, mug
      B(u + 9, v + 12, 13, 12, 4, 1, '#e4e4e2', { hi: false }); lineU(u + 10, u + 20, v + 14, 14, '#c2c2c0');
      B(u + 24, v + 13, 13, 2, 3, 1, '#e4e4e2', { hi: false });
      const mug = n % 3 === 1 ? C.white : C.rust;
      B(u + 28, v + 5, 13, 3, 3, 4, mug, { outline: '#3a1a1a' }); { const [x, y] = P(u + 29.5, v + 6.5, 17); R(x - 1, y, 2, 1, '#4a2a1a'); }
      // a personal item
      if (n % 4 === 0) { B(u + 2, v + 3, 13, 5, 5, 4, I.terracotta, { outline: '#7a3f2a' }); const [x, y] = P(u + 4.5, v + 5.5, 17); for (let k = 0; k < 4; k++) leaf(x - 4 + k * 3, y - 7 + (k % 2) * 2, 3, 7, k % 2 ? I.leaf2 : I.leaf3); }
      if (n % 4 === 1) { B(u + 2, v + 12, 13, 8, 7, 2, '#f4f1ea', { outline: '#bfb8aa' }); lineU(u + 3, u + 9, v + 15, 15, '#c9c2b4'); }
      if (n % 4 === 2) { B(u + 2, v + 3, 13, 5, 5, 1, '#2b2b2b', { hi: false }); B(u + 4, v + 5, 14, 1, 1, 10, '#2b2b2b', { hi: false }); B(u + 3, v + 4, 24, 5, 4, 3, C.acid, { outline: '#6b5c00' }); }
      if (n % 4 === 3) { B(u + 3, v + 13, 13, 6, 8, 1, C.red, { outline: '#5a0510' }); const [x, y] = P(u + 6, v + 17, 14); R(x - 2, y, 4, 1, '#ffffff'); }
    }, { live: () => drawScreen(d) });
    const cu = u + 17, cvv = v + 31;
    obj([cu - 5, cu + 5, cvv - 5, cvv + 4], () => officeChair(cu, cvv, 'seat'), { block: false, shadow: false });
    obj([cu - 5, cu + 5, cvv + 4, cvv + 6], () => officeChair(cu, cvv, 'back'), { block: false, shadow: false });
  }

  // meeting: white table, yellow chairs, laptop, cups
  obj([262, 322, 104, 144], () => {
    for (const [a, b] of [[3, 3], [55, 3], [3, 35], [55, 35]]) B(262 + a, 104 + b, 0, 2, 2, 11, I.steel, { hi: false });
    B(262, 104, 11, 60, 40, 2, '#f1efea', { outline: '#6f6a61', left: '#dcd8d0', right: '#c4bfb5' });
    B(274, 116, 13, 14, 10, 1, '#c9cdd2', { hi: false }); B(274, 114, 13, 14, 2, 10, '#2a2a2a', { outline: '#111' });
    onV(tex(12, 8, () => { R(0, 0, 12, 8, '#1c1c1c'); R(1, 1, 6, 1, C.acid); R(1, 3, 9, 1, '#8a8a8a'); R(1, 5, 5, 1, C.rust); }), 116, 275, 22);
    B(298, 118, 13, 3, 3, 4, '#ffffff', { outline: '#555' }); B(304, 132, 13, 3, 3, 4, C.rust, { outline: '#3a1a1a' }); B(282, 132, 13, 3, 3, 4, '#ffffff', { outline: '#555' });
    B(310, 116, 13, 8, 10, 1, '#f7f5ef', { outline: '#bfb8aa' }); lineU(311, 317, 120, 14, '#c9c2b4');
    B(290, 124, 13, 4, 4, 6, '#e8e2d6', { outline: '#8a8070' }); { const [x, y] = P(292, 126, 19); foliage(x, y, 1, 'meet'); }
  });
  MEETING.forEach(([cu, cvv, face]) => {
    const sep = face === 'br' || face === 'bl';
    obj([cu - 4, cu + 4, cvv - 4, cvv + 4], () => designChair(cu, cvv, face, sep ? 'seat' : 'all'), { block: false, shadow: false });
    if (sep) obj(face === 'br' ? [cu - 4, cu + 4, cvv + 4, cvv + 6] : [cu + 4, cu + 6, cvv - 4, cvv + 4], () => designChair(cu, cvv, face, 'back'), { block: false, shadow: false });
  });

  // lounge: cognac leather sofa against the wall, coffee table, coffee island
  obj([2, 30, 298, 370], () => {
    B(4, 300, 0, 24, 68, 2, '#2b2b2b', { hi: false });
    B(4, 300, 2, 24, 68, 5, I.leather, { outline: '#3a1e10', left: I.leatherD, right: '#6a3a1e' });
    B(4, 300, 7, 6, 68, 12, I.leather, { outline: '#3a1e10', left: I.leatherD, right: '#6a3a1e' });
    B(4, 300, 7, 24, 6, 7, I.leather, { outline: '#3a1e10', left: I.leatherD, right: '#6a3a1e' });
    B(4, 362, 7, 24, 6, 7, I.leather, { outline: '#3a1e10', left: I.leatherD, right: '#6a3a1e' });
    for (const v of [306, 324, 342]) B(10, v, 7, 16, 18, 2, '#a8653c', { outline: '#3a1e10', left: '#8a4e2c', right: '#7a4424' });
    B(10, 308, 9, 4, 8, 7, C.rust, { outline: '#5a0510' }); B(10, 350, 9, 4, 8, 7, C.acid, { outline: '#6b5c00' });
  });
  obj([50, 78, 312, 354], () => {
    for (const [a, b] of [[1, 1], [25, 1], [1, 39], [25, 39]]) B(50 + a, 312 + b, 0, 2, 2, 6, I.steel, { hi: false });
    B(50, 312, 6, 28, 42, 2, I.oak, { outline: I.oakLine, left: I.oakD, right: I.oakDD });
    B(56, 318, 8, 10, 14, 2, '#25324a', { outline: '#111' }); B(57, 320, 10, 8, 10, 2, '#e9e1cf', { outline: '#8a8070' });
    B(66, 340, 8, 3, 3, 4, C.rust, { outline: '#3a1a1a' }); B(54, 338, 8, 6, 6, 4, I.ceramic, { outline: '#8a8070' }); { const [x, y] = P(57, 341, 12); foliage(x, y, 1, 'ctable'); }
  });
  obj([296, 364, 246, 278], () => {
    B(298, 248, 0, 64, 28, 12, I.oakD, { outline: I.oakLine, left: I.oak, right: I.oakDD, hi: false });
    for (let k = 4; k < 64; k += 6) { const [x, y] = P(298 + k, 276, 1); R(x, y - 10, 1, 9, '#b48a5c'); }
    B(296, 246, 12, 68, 32, 2, '#efede8', { outline: '#6f6a61', left: '#dcd8d0', right: '#c4bfb5' });
    B(304, 252, 14, 12, 10, 13, I.chrome, { outline: '#3a3e42', left: '#aeb3b8', right: '#8d9298' });
    onV(tex(10, 11, () => { R(0, 0, 10, 11, '#1e1e1e'); R(1, 1, 4, 2, '#2f4a3a'); R(7, 1, 2, 2, C.rust); R(3, 6, 4, 5, '#0e0e0e'); R(4, 8, 2, 3, '#ffffff'); }), 262, 305, 26);
    B(320, 256, 14, 3, 3, 3, '#ffffff', { outline: '#555' }); B(325, 260, 14, 3, 3, 3, C.rust, { outline: '#3a1a1a' });
    B(338, 254, 14, 9, 9, 2, '#2b2b2b', { outline: '#111' }); for (const [a, b, c] of [[340, 256, '#f29a2e'], [343, 258, '#f2b53e'], [345, 255, '#8cbf3f']]) { const [x, y] = P(a, b, 17); disc(x, y, 1, c); }
    B(352, 252, 14, 6, 6, 5, I.ceramic, { outline: '#8a8070' }); { const [x, y] = P(355, 255, 19); foliage(x, y, 1, 'island'); }
  });

  // ping-pong table, because it's an agency
  obj([150, 228, 292, 336], () => {
    for (const [a, b] of [[4, 4], [72, 4], [4, 38], [72, 38]]) B(150 + a, 292 + b, 0, 2, 2, 10, I.steel, { hi: false });
    B(150, 292, 10, 78, 44, 2, '#2f6b4a', { outline: '#14301f', left: '#285c40', right: '#1f4a33' });
    lineU(152, 226, 313, 12, '#e8eee9'); lineV(294, 334, 189, 12, '#e8eee9');
    lineU(150, 228, 292, 12, '#e8eee9'); lineU(150, 228, 335, 12, '#e8eee9'); lineV(292, 336, 150, 12, '#e8eee9'); lineV(292, 336, 227, 12, '#e8eee9');
    B(188, 292, 12, 2, 44, 4, '#f2f2f2', { outline: '#666', left: '#dcdcdc', right: '#cfcfcf' });
    B(166, 302, 12, 6, 6, 1, C.red, { outline: '#5a0510' }); B(204, 322, 12, 6, 6, 1, C.ink, { outline: '#000' });
    { const [x, y] = P(212, 304, 13); R(x, y, 2, 2, '#ffffff'); }
  });

  // plants
  obj([348, 366, 346, 364], () => { B(348, 346, 0, 18, 18, 14, I.ceramic, { outline: '#8a8070', left: '#ddd5c6', right: '#c9c0af' }); B(350, 348, 14, 14, 14, 1, '#4a3826', { hi: false }); const [x, y] = P(357, 355, 15); foliage(x, y - 2, 3, 'bigplant'); foliage(x + 4, y - 8, 2, 'bigplant2'); });
  obj([300, 312, 6, 18], () => { B(300, 6, 0, 12, 12, 10, I.terracotta, { outline: '#7a3f2a' }); const [x, y] = P(306, 12, 10); for (let k = 0; k < 7; k++) { const hgt = 14 + (hash('sn' + k) % 14); R(x - 6 + k * 2, y - hgt, 2, hgt, k % 2 ? I.leaf2 : '#4f8a3e'); R(x - 6 + k * 2, y - hgt, 1, hgt, '#c8c060'); } });
  obj([6, 20, 164, 174], () => { B(6, 164, 0, 12, 10, 9, '#2b2b2b', { outline: '#000' }); const [x, y] = P(12, 169, 9); foliage(x, y, 2, 'winplant'); });
  // Henry's bed: red, cream cushion, his name on the front, a bone and a water bowl
  obj([100, 123, 356, 372], () => {
    const red = C.red, rl = { outline: '#5a0510', left: C.redDark, right: '#86000e', hi: false };
    B(100, 356, 0, 16, 16, 2, red, rl);
    B(102, 358, 2, 12, 12, 1, '#f4ecdc', { outline: '#bfb3a0', left: '#e6dcc8', right: '#d6cab4', hi: false });
    B(100, 356, 2, 16, 2, 3, red, rl); B(100, 356, 2, 2, 16, 3, red, rl);
    B(114, 358, 2, 2, 14, 3, red, rl); B(102, 370, 2, 12, 2, 3, red, { ...rl, hi: true, hiColor: '#d8253a' });
    onV(tex(12, 3, () => pxText('HENRY', 6, 2.6, '700 2.6px "Space Grotesk"', '#ffffff', 'center', 0, { ls: 0.3 })), 372, 102, 4.6);
    { const [x, y] = P(110, 365, 3); R(x - 2.5, y - 0.6, 5, 1.2, '#fbf6ee'); for (const dx of [-3, 2]) { R(x + dx, y - 1.2, 1.1, 1.1, '#fbf6ee'); R(x + dx, y + 0.2, 1.1, 1.1, '#fbf6ee'); } R(x - 2.5, y + 0.4, 5, 0.3, '#d9cfbd'); }
    B(118, 360, 0, 5, 5, 1.6, '#9aa0a6', { outline: '#4f555b', left: '#8e949a', right: '#767c82', hi: false });
    B(118.8, 360.8, 1.6, 3.4, 3.4, 0.01, '#7fb7e6', { hi: false });
  }, { block: false });
  obj([228, 240, 352, 364], () => { B(228, 352, 0, 12, 12, 20, I.ceramic, { outline: '#8a8070', left: '#ddd5c6', right: '#c9c0af' }); const [x, y] = P(234, 358, 20); foliage(x, y, 2, 'fronplant'); });
}

// ---------- Animated parts ----------
function sky(now) {
  const hr = now.getHours() + now.getMinutes() / 60;
  const day = hr >= 8 && hr < 18, dusk = !day && (hr >= 18 && hr < 20 || hr >= 6 && hr < 8);
  return { day, dusk, night: !day && !dusk };
}
function drawLive(t, now, sk) {
  // windows on wall B: sky, clouds, the city with the Frauenkirche towers
  const bands = sk.day ? ['#7cc0ff', '#9fd3ff', '#c4e6ff'] : sk.dusk ? ['#f07a6a', '#f59a82', '#ffc69a'] : ['#0b1430', '#14203f', '#1d2d55'];
  const city = sk.day ? '#9fb2c4' : sk.dusk ? '#7a5a6a' : '#0a0f1f';
  WINDOWS.forEach(([v1, v2], i) => {
    const w = v2 - v1, h = WIN_H, bh = Math.ceil(h / 3);
    onU(tex(w, h, () => {
      bands.forEach((c, b) => R(0, b * bh, w, bh, c));
      if (sk.day) {
        if (i === 1) disc(36, 10, 4, '#fff3b0');
        for (let c = 0; c < 3; c++) { const cx = ((t / (70 + c * 30) + i * 31 + c * 23) % (w + 30)) - 18, cy = 6 + c * 9; R(cx, cy + 2, 14, 3, '#fff'); R(cx + 3, cy, 7, 2, '#fff'); R(cx, cy + 5, 14, 1, '#e6f2ff'); }
      } else {
        for (let s = 0; s < 12; s++) { const k = hash(`st${i}${s}`); if ((Math.floor(t / 600) + s) % 9) R(k % w, (k >>> 6) % 28, 1, 1, '#fff'); }
        if (i === 2 && sk.night) { disc(12, 10, 4, '#f5f0d0'); disc(14, 9, 4, bands[0]); }
      }
      let x = 0;
      while (x < w) { const k = hash(`city${i}${x}`), bw = 4 + k % 6, bh = 8 + (k >>> 4) % 14; R(x, h - bh, bw, bh, city); if (!sk.day) for (let q = 0; q < 4; q++) if ((k >>> (q * 3)) % 3 === 0) R(x + 1 + (q % 2) * 2, h - bh + 3 + q * 3, 1, 1, (Math.floor(t / 2500) + q + i) % 11 ? '#ffd76a' : city); x += bw + 1; }
      if (i === 2) for (const tx of [18, 28]) { R(tx, h - 30, 6, 30, city); R(tx, h - 33, 6, 3, city); R(tx + 1, h - 36, 4, 3, city); R(tx + 2, h - 38, 2, 2, city); }
      // steel frame and glazing bars
      R(0, 0, w, 2, '#1e1e1e'); R(0, h - 2, w, 2, '#1e1e1e'); R(0, 0, 2, h, '#1e1e1e'); R(w - 2, 0, 2, h, '#1e1e1e');
      R(Math.floor(w / 2) - 1, 0, 2, h, '#1e1e1e'); R(0, Math.round(h / 3) - 1, w, 2, '#1e1e1e'); R(0, Math.round(h * 2 / 3) - 1, w, 2, '#1e1e1e');
      R(2, h - 3, w - 4, 1, '#3a3a3a'); // handle rail
      R(3, 3, 1, 16, '#ffffff55'); R(Math.floor(w / 2) + 2, Math.round(h / 3) + 3, 1, 16, '#ffffff44'); R(4, Math.round(h * 2 / 3) + 3, 1, 12, '#ffffff33');
    }), 0, v2, WIN_TOP);
  });
  if (sk.day) { // daylight on the floor
    G.globalAlpha = 0.09;
    for (const [v1, v2] of WINDOWS) poly([P(2, v1 + 8), P(2, v2 + 8), P(78, v2 + 46), P(78, v1 + 46)], '#fff6d8');
    G.globalAlpha = 1;
  }
  // docs wall screen: a page of docs with a search bar; it scrolls while someone is reading
  {
    const reading = [...people.values()].some(p => !p.moving && p.zone === 'library');
    const scroll = reading ? Math.floor(t / 90) % 40 : 0;
    onU(tex(88, 50, () => {
      R(0, 0, 88, 50, '#ffffff'); R(0, 0, 88, 5, '#2b2b2b'); for (const [i, c] of [C.rust, C.acid, '#6bb700'].entries()) R(2 + i * 3, 2, 2, 1.2, c);
      R(4, 8, 58, 6, '#d8d8d8'); R(4.5, 8.5, 57, 5, '#fafafa'); R(6, 10.2, 20, 1.6, '#555'); if (reading && Math.floor(t / 450) % 2) R(26.5, 9.8, 0.6, 2.4, '#161616');
      R(63, 8, 9, 6, C.red); R(66, 10, 3, 2, '#fff');
      G.save(); G.beginPath(); G.rect(0, 16 * K, 88 * K, 34 * K); G.clip();
      for (let r = 0; r < 6; r++) {
        const y = 17 + r * 7 - (scroll % 7) * 1, k = hash('doc' + (r + Math.floor(scroll / 7)));
        if (reading && r === 2) R(2, y - 1, 70, 7, '#fff6c2');
        R(4, y, 20 + k % 30, 1.6, '#3b6fd0'); R(4, y + 2.6, 50 + (k >>> 5) % 25, 1, '#9a9a9a'); R(4, y + 4.2, 30 + (k >>> 9) % 30, 1, '#bdbdbd');
      }
      G.restore();
      R(80, 18, 2, 30, '#eeeeee'); R(80, 18 + (scroll % 40) * 0.6, 2, 6, '#bdbdbd');
    }), 2, 154, 78);
  }
  // neon shrug on the feature wall (with the odd flicker)
  const f = Math.floor(t / 90) % 71, on = !(f === 0 || f === 2 || f === 3);
  onV(NEON[on ? 1 : 0] || (NEON[on ? 1 : 0] = tex(110, 30, (g) => {
    g.font = `700 ${17 * K}px "Space Grotesk"`; g.textAlign = 'center';
    const at = [55 * K, 21.5 * K];
    // dark tube shadow on the backplate, then the glow, the tube and its hot core
    g.fillStyle = '#00000040'; g.fillText(SHRUG, at[0] + 0.8 * K, at[1] + 1.2 * K);
    if (on) { g.shadowColor = C.acid; g.shadowBlur = 7 * K; g.fillStyle = '#ffe866'; g.fillText(SHRUG, ...at); g.shadowBlur = 3 * K; g.fillText(SHRUG, ...at); g.shadowBlur = 0; }
    g.fillStyle = on ? '#fff6b8' : '#9a8a3a'; g.fillText(SHRUG, ...at);
    if (on) { g.lineWidth = 0.35 * K; g.strokeStyle = '#ffffffcc'; g.strokeText(SHRUG, at[0] - 0.2 * K, at[1] - 0.2 * K); }
  })), 0, 62, 88);
  // clock hands, real time
  onV(tex(17, 17, () => {
    const cx = 8.5, cy = 8.5, hand = (fr, len, c, wd = 0.8) => { const a = fr * Math.PI * 2; for (let i = 0; i <= len; i += 0.25) R(cx + Math.sin(a) * i - wd / 2, cy - Math.cos(a) * i - wd / 2, wd, wd, c); };
    hand(((now.getHours() % 12) + now.getMinutes() / 60) / 12, 3.2, '#1e1e1e', 1); hand(now.getMinutes() / 60, 5, '#1e1e1e', 0.7); hand(now.getSeconds() / 60, 5.3, C.rust, 0.4); R(cx - 0.6, cy - 0.6, 1.2, 1.2, C.rust);
  }), 0, 256, WALL - 12);
  // server rack front: units, vents, blinking lights
  onV(tex(34, 84, (g, w, h) => {
    R(0, 0, w, h, '#141414');
    for (let k = 0; k < 10; k++) {
      const y = 3 + k * 8; R(2, y, w - 4, 7, '#262626'); R(2, y, w - 4, 1, '#333');
      for (let q = 0; q < 5; q++) R(16 + q * 3, y + 3, 2, 2, '#0d0d0d');
      const on2 = (Math.floor(t / (170 + k * 41)) + k) % 3;
      R(4, y + 3, 2, 2, on2 ? C.acid : '#3a3300'); R(8, y + 3, 2, 2, on2 === 2 ? C.rust : '#3a0810'); R(12, y + 3, 1, 2, (Math.floor(t / 90) + k * 3) % 5 === 0 ? '#9fd3ff' : '#1a2630');
    }
    R(1, 1, 1, 30, '#ffffff12');
  }), 22, 12, 84);
}

function drawScreen(d) {
  const busy = BUSY.has(d.n), t = NOW;
  const scroll = busy ? Math.floor(t / 260) : 0;
  onV(tex(16, 10, () => {
    R(0, 0, 16, 10, busy ? '#1f2328' : '#16181b');
    const cols = ['#8a8a8a', C.acid, '#8a8a8a', C.rust, '#cfd6dd', '#5f8ab0'];
    for (let k = 0; k < 4; k++) { const h = hash(`code${d.n}|${k + scroll}`); R(1 + (h % 3), 1 + k * 2, 3 + (h >>> 4) % 10, 1, busy ? cols[(h >>> 9) % cols.length] : '#2c3036'); }
    if (busy && Math.floor(t / 400) % 2) R(2, 9, 2, 1, C.acid);
  }), d.v + 5, d.u + 9, 28);
}

// ---------- People ----------
const people = new Map();
const shirtOf = new Map();
let nextShirt = 0, selected = null, hovered = null, BUSY = new Set(), NOW = 0;

function shirtFor(key) { if (!shirtOf.has(key)) shirtOf.set(key, nextShirt++ % SHIRTS.length); return SHIRTS[shirtOf.get(key)]; }
function makePerson(a) {
  const own = hash(a.id), door = ZONES.exit[0];
  return {
    id: a.id, data: a, shirt: shirtFor(a.parentId || a.id),
    skin: SKIN[own % SKIN.length], hair: HAIR[(own >>> 3) % HAIR.length], style: (own >>> 6) % 5,
    pants: PANTS[(own >>> 9) % PANTS.length], shoes: SHOES[(own >>> 12) % SHOES.length], glasses: (own >>> 15) % 4 === 0, wear: (own >>> 18) % 4, stripe: [C.white, '#161616', C.rust][(own >>> 20) % 3], beard: (own >>> 22) % 5 === 0 && (own >>> 6) % 5 !== 1,
    small: !!a.parentId, u: door.u, v: door.v, path: [], spot: null, zone: null,
    phase: own % 7000, face: 'fl', moving: false, leaving: false, alpha: 0,
  };
}
function claimSpot(zone, p) {
  const spots = ZONES[zone] || ZONES.lounge;
  const taken = new Set([...people.values()].filter(o => o !== p && o.zone === zone && o.spot).map(o => o.spot));
  const free = spots.filter(s => !taken.has(s));
  if (free.length) return free[hash(p.id) % free.length];
  const b = spots[hash(p.id) % spots.length];
  return { ...b, u: b.u + (hash(p.id + 'u') % 13) - 6, v: b.v + 8 + (hash(p.id + 'v') % 9), sit: false, desk: undefined };
}
// Breadth-first search on the walk grid; moves run along u or v, the iso diagonals.
function route(p, target) {
  const cell = (u, v) => [Math.max(0, Math.min(GN - 1, Math.floor(u / CELL))), Math.max(0, Math.min(GN - 1, Math.floor(v / CELL)))];
  const [sa, sb] = cell(p.u, p.v), [ta, tb] = cell(target.u, target.v);
  const prev = new Int32Array(GN * GN).fill(-1), start = sa * GN + sb, goal = ta * GN + tb;
  const q = [start]; prev[start] = start;
  for (let qi = 0; qi < q.length && prev[goal] < 0; qi++) {
    const c = q[qi], a = Math.floor(c / GN), b = c % GN;
    for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const na = a + da, nb = b + db; if (na < 0 || nb < 0 || na >= GN || nb >= GN) continue;
      const n = na * GN + nb; if (prev[n] >= 0 || (blocked[n] && n !== goal)) continue;
      prev[n] = c; q.push(n);
    }
  }
  const cells = [];
  if (prev[goal] >= 0) { for (let c = goal; c !== start; c = prev[c]) cells.push(c); cells.reverse(); }
  const path = [];
  let lastDir = null;
  for (const c of cells) {
    const a = Math.floor(c / GN), b = c % GN, pt = { u: a * CELL + CELL / 2, v: b * CELL + CELL / 2 };
    const prevPt = path.length ? path[path.length - 1] : { u: p.u, v: p.v };
    const dir = Math.abs(pt.u - prevPt.u) > Math.abs(pt.v - prevPt.v) ? 'u' : 'v';
    if (dir === lastDir && path.length) path[path.length - 1] = pt; else path.push(pt);
    lastDir = dir;
  }
  path.push({ u: target.u, v: target.v });
  p.path = path;
}
function assign(p, zone) {
  if (p.zone === zone && p.spot) return;
  p.zone = zone; p.spot = claimSpot(zone, p); route(p, p.spot);
}
function stepPeople(dt) {
  for (const p of people.values()) {
    p.alpha = Math.min(1, p.alpha + dt / 400);
    if (p.path.length) {
      const tg = p.path[0], du = tg.u - p.u, dv = tg.v - p.v, d = Math.hypot(du, dv), sp = 0.085 * dt;
      p.moving = true;
      if (Math.abs(du) > Math.abs(dv)) p.face = du > 0 ? 'fr' : 'bl'; else if (dv) p.face = dv > 0 ? 'fl' : 'br';
      if (d <= sp) { p.u = tg.u; p.v = tg.v; p.path.shift(); } else { p.u += du / d * sp; p.v += dv / d * sp; }
    } else {
      p.moving = false;
      if (p.spot) p.face = p.spot.face || 'fl';
      if (p.leaving) { people.delete(p.id); if (selected === p.id) selected = null; }
    }
  }
}
// ---------- Henry, the office corgi (a prop, not an agent) ----------
const BED = { u: 108, v: 364 };
const dog = { u: BED.u, v: BED.v, path: [], face: 'fl', moving: false, pose: 'lie', mode: 'rest', until: performance.now() + 6000, pantUntil: 0, woofUntil: 0, hopAt: -1e9, zoom: false, screen: null };
const freeCell = (u, v) => { const a = Math.floor(u / CELL), b = Math.floor(v / CELL); return u > 10 && v > 10 && u < ROOM - 6 && v < ROOM - 6 && !blocked[a * GN + b]; };
function dogNext(t) {
  const r = Math.random(), ppl = [...people.values()].filter(p => !p.moving && !p.leaving && p.alpha > 0.9);
  dog.zoom = Math.random() < 0.15; // the occasional zoomies
  if (r < 0.2) { dog.mode = 'rest'; dog.zoom = false; return BED; }
  if (r < 0.6 && ppl.length) {
    const p = ppl[Math.floor(Math.random() * ppl.length)];
    for (const [du, dv] of [[9, 3], [3, 9], [-9, 3], [3, -9], [12, 12]].sort(() => Math.random() - 0.5)) if (freeCell(p.u + du, p.v + dv)) { dog.mode = 'visit'; dog.friend = p.id; return { u: p.u + du, v: p.v + dv }; }
  }
  dog.mode = 'roam';
  for (let k = 0; k < 60; k++) { const u = 14 + Math.random() * (ROOM - 24), v = 14 + Math.random() * (ROOM - 24); if (freeCell(u, v)) return { u, v }; }
  return BED;
}
function stepDog(dt, t) {
  if (dog.path.length) {
    const tg = dog.path[0], du = tg.u - dog.u, dv = tg.v - dog.v, d = Math.hypot(du, dv), sp = (dog.zoom ? 0.2 : 0.11) * dt;
    dog.moving = true; dog.pose = 'stand';
    if (Math.abs(du) > Math.abs(dv)) dog.face = du > 0 ? 'fr' : 'bl'; else if (dv) dog.face = dv > 0 ? 'fl' : 'br';
    if (d <= sp) { dog.u = tg.u; dog.v = tg.v; dog.path.shift(); } else { dog.u += du / d * sp; dog.v += dv / d * sp; }
    return;
  }
  if (dog.moving) { // just arrived
    dog.moving = false;
    const rest = dog.mode === 'rest';
    dog.pose = rest ? 'lie' : dog.mode === 'visit' ? 'sit' : Math.random() < 0.5 ? 'sit' : 'stand';
    dog.until = t + (rest ? 14000 + Math.random() * 16000 : 2500 + Math.random() * 6000);
    dog.pantUntil = t + (dog.zoom ? 5000 : 2200);
    const f = people.get(dog.friend);
    if (dog.mode === 'visit' && f) { const du = f.u - dog.u, dv = f.v - dog.v; dog.face = Math.abs(du) > Math.abs(dv) ? (du > 0 ? 'fr' : 'bl') : (dv > 0 ? 'fl' : 'br'); }
  }
  if (t > dog.until) route(dog, dogNext(t));
}
function drawDog(t) {
  const lie = dog.pose === 'lie' && !dog.moving, sit = dog.pose === 'sit' && !dog.moving;
  const onBed = lie && Math.hypot(dog.u - BED.u, dog.v - BED.v) < 3;
  const hop = Math.max(0, Math.sin(Math.min(1, (t - dog.hopAt) / 420) * Math.PI)) * ((t - dog.hopAt) < 420 ? 3 : 0);
  const [fx, fy] = P(dog.u, dog.v, onBed ? 3 : 0), x = fx, y = fy - hop;
  const mir = dog.face === 'fl' || dog.face === 'bl', sc = 0.8;
  const fur = '#d8792a', furD = '#b45f1c', furL = '#eda155', wh = '#fbf6ee', whD = '#e6dccb', ol = '#3a2414';
  const parts = [], F = (dx, dy, w, h, c, o = true) => parts.push([dx, dy, w, h, c, o]);
  const D = (dx, dy, w, h, c) => R(x + sc * (mir ? -dx - w : dx), y + sc * dy, sc * w, sc * h, c);
  const fr = Math.floor(t / (dog.zoom ? 55 : 85)) % 4, bob = dog.moving ? (fr % 2) * 0.5 : 0;
  const pant = !dog.moving && t < dog.pantUntil, wag = !dog.moving && !lie ? Math.sin(t / 55) * 0.5 : 0;
  const breathe = lie ? Math.sin(t / 700) * 0.25 : 0;
  // shadow
  R(x - 7 * sc, fy - 0.8, 14 * sc, 1.6, '#00000030');
  const head = (hx, hy, closed) => {
    F(3.5 + hx, -10 + hy, 3, 4, fur);                                   // neck
    for (const [ex, back] of [[6, true], [8.3, false]]) for (let j = 0; j < 7; j++) { // ears, the back one a shade darker
      const w = 0.5 + j * 0.34; F(ex + hx - w / 2, -16.4 + j * 0.6 + hy, w, 0.6, back ? furD : fur);
      if (!back && j > 2) F(ex + hx - (w - 1.2) / 2, -16.4 + j * 0.6 + hy, w - 1.2, 0.6, '#e9a0a0', false);
    }
    F(4.5 + hx, -12 + hy, 5, 4.5, fur); F(5 + hx, -12.6 + hy, 4, 5.6, fur);   // skull
    F(8.4 + hx, -9.6 + hy, 3.2, 2.4, wh);                                // muzzle
    F(7.3 + hx, -12.4 + hy, 0.9, 3.2, wh, false);                        // blaze
    F(10.9 + hx, -9.9 + hy, 1, 0.9, '#1a1a1a', false);                   // nose
    if (closed) F(7.2 + hx, -10.4 + hy, 1.2, 0.35, '#1a1a1a', false);
    else { F(7.5 + hx, -11 + hy, 0.9, 1, '#1a1a1a', false); F(7.6 + hx, -11 + hy, 0.35, 0.35, '#ffffff', false); }
    F(9.2 + hx, -7.5 + hy, 2, 0.35, '#7a4a3a', false);                   // mouth
    if (pant && !closed) F(9.6 + hx, -7.3 + hy, 1, 1.4 + (Math.floor(t / 120) % 2) * 0.4, '#e46f7a', false);
    F(3.7 + hx, -8.5 + hy, 2.7, 0.9, C.red, false); F(5 + hx, -7.7 + hy, 0.8, 0.9, C.acid, false); // collar + tag
  };
  if (lie) {
    F(-7.5, -4.6 - breathe, 13, 4.6 + breathe, fur); F(-7, -5.1 - breathe, 12, 5.1 + breathe, fur);
    F(-6, -5.1 - breathe, 9, 0.6, furL, false); F(-1, -1.6, 6, 1.4, wh, false);
    F(-8.2, -3.6, 1.8, 2.6, '#f3e3c8'); F(4.5, -1.3, 4.6, 1.3, wh);    // fluffy rear, paws out front
    head(1, 4.6, true);
  } else if (sit) {
    F(-5.5, -1.4, 1.4, 1.1, fur);                                       // tail stub on the floor
    F(-4.5, -4.5, 5, 4.5, fur); F(-4, -5, 4, 5, fur);                   // haunch
    F(-4.2, -8.5, 6.5, 5, fur); F(-1, -10.5, 5, 7, fur);                // back + chest
    F(2.4, -9.8, 2, 6, wh, false); F(-3.6, -0.9, 2.2, 0.9, wh, false);
    F(1.8, -4, 1.2, 4, wh); F(3.2, -4, 1.2, 4, wh);                     // front legs
    head(-1.5, -2.6, false);
  } else {
    const lift = k => dog.moving && (fr === k) ? 0.7 : 0;
    F(-6, -3 - bob, 1.2, 3 + bob - lift(1), furD); F(3, -3 - bob, 1.2, 3 + bob - lift(3), whD);   // far legs
    F(-8.6, -8.4 - bob + wag, 1.4, 1.2, fur);                           // tail stub (wags)
    F(-7.5, -7.5 - bob, 13, 5, fur); F(-7, -8 - bob, 12, 6, fur);       // body
    F(-6, -8 - bob, 9, 0.6, furL, false); F(-2, -3.8 - bob, 7, 1.3, wh, false); F(3, -7 - bob, 2.5, 4.4, wh, false);
    F(-8.2, -6.4 - bob, 1.8, 3.2, '#f3e3c8');                           // the famous fluffy rear
    F(-4.5, -3 - bob, 1.2, 3 + bob - lift(3), fur); F(4.5, -3 - bob, 1.2, 3 + bob - lift(1), wh);  // near legs
    F(-4.6, -0.8 - lift(3), 1.4, 0.8, wh, false);
    head(0, -bob, false);
  }
  for (const [dx, dy, w, h, , o] of parts) if (o) D(dx - 0.45, dy - 0.45, w + 0.9, h + 0.9, ol);
  for (const [dx, dy, w, h, c] of parts) D(dx, dy, w, h, c);
  dog.screen = { x: fx, y: fy, top: y - (lie ? 9 : 14) * sc };
}

const shrugging = (p, t) => !p.moving && p.data.state === 'waiting' && ((t + p.phase) % 7000) < 1600;

function drawPerson(p, t) {
  // Drawn on a half-unit grid (twice the detail of the room's base grid). H() takes half units.
  const a = p.data, [fx, fy] = P(p.u, p.v), x = Math.round(fx * 2) / 2, y = Math.round(fy * 2) / 2;
  const sit = !p.moving && p.spot && p.spot.sit, shrug = shrugging(p, t), think = !p.moving && a.state === 'thinking';
  const front = shrug || p.face === 'fr' || p.face === 'fl', mir = !shrug && (p.face === 'fl' || p.face === 'bl');
  const typing = !p.moving && p.zone === 'desks' && (a.state === 'tool' || a.human);
  const H = (dx, dy, w, h, c) => R(x + dx / 2, y + dy / 2, w / 2, h / 2, c);
  const M = (dx, dy, w, h, c) => H(mir ? -dx - w : dx, dy, w, h, c);
  // a group is outlined as one shape, then filled, so touching parts merge but the silhouette stays clean
  const group = (list, oc) => { for (const [m, dx, dy, w, h] of list) (m ? M : H)(dx - 1, dy - 1, w + 2, h + 2, oc); for (const [m, dx, dy, w, h, c] of list) (m ? M : H)(dx, dy, w, h, c); };
  const sk = p.skin, skD = shade(sk, -0.18), skDD = shade(sk, -0.32), hc = p.hair, hl = shade(hc, 0.32), hd = shade(hc, -0.35);
  const sh = p.shirt, dark = sh === '#1f1f1f', shD = shade(sh, dark ? 0.1 : -0.18), shL = shade(sh, dark ? 0.22 : 0.2), shDD = shade(sh, dark ? 0.2 : -0.32);
  const ol = '#2a1f18', olS = shade(sk, -0.6), pa = p.pants, paD = shade(pa, -0.3), paL = shade(pa, 0.15);
  G.globalAlpha = p.alpha;
  if (selected === p.id || hovered === p.id) { lineU(p.u - 9, p.u + 9, p.v - 9, 0, C.rust); lineU(p.u - 9, p.u + 9, p.v + 9, 0, C.rust); lineV(p.v - 9, p.v + 9, p.u - 9, 0, C.rust); lineV(p.v - 9, p.v + 9, p.u + 9, 0, C.rust); }
  if (!sit) { H(-9, -2, 18, 1, '#0000002a'); H(-11, -1, 22, 2, '#0000003a'); H(-9, 1, 18, 1, '#0000002a'); }
  const frame = p.moving ? Math.floor((t + p.phase) / 120) % 4 : -1, step = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  const bob = p.moving ? (frame % 2) * 2 : think ? (Math.sin((t + p.phase) / 420) > 0.6 ? 1 : 0) : 0;
  const legLen = p.small ? 10 : 14;
  const hip = sit ? -14 : -(legLen + 4) - bob;
  const top = hip - 16, hy = top - 16;

  // ---- legs + shoes
  const sole = p.shoes === '#f2f2f2' ? '#c8c8c8' : shade(p.shoes, 0.25);
  if (sit) {
    if (front) group([[0, -7, hip, 6, 7, pa], [0, 1, hip, 6, 7, pa], [0, -6, hip + 7, 5, 4, pa], [0, 1, hip + 7, 5, 4, pa], [0, -7, hip + 10, 6, 3, p.shoes], [0, 1, hip + 10, 6, 3, p.shoes]], ol);
    if (front) { H(-7, hip, 6, 1, paL); H(1, hip, 6, 1, paL); H(-7, hip + 12, 6, 1, sole); H(1, hip + 12, 6, 1, sole); }
  } else {
    const l1 = step === 1 ? 2 : 0, l2 = step === -1 ? 2 : 0;
    group([[0, -6, hip, 5, -hip - 3 - l1, pa], [0, 1, hip, 5, -hip - 3 - l2, pa], [0, -7, -4 - l1, 6, 4, p.shoes], [0, 1, -4 - l2, 6, 4, p.shoes]], ol);
    H(-2, hip, 1, -hip - 4 - l1, paD); H(5, hip, 1, -hip - 4 - l2, paD); H(-6, hip, 1, -hip - 4 - l1, paL);
    H(-7, -1 - l1, 6, 1, sole); H(1, -1 - l2, 6, 1, sole); H(-6, -4 - l1, 2, 1, shade(p.shoes, 0.35)); H(2, -4 - l2, 2, 1, shade(p.shoes, 0.35));
  }

  // ---- arms (helpers), torso
  const longSleeve = p.wear !== 0, skinC = sk;
  const arm = (dx, dy, c, len = 11) => { // shoulder at (dx, top+dy), hanging down
    const parts = [[0, dx, top + dy, 3, longSleeve ? len : 6, c]];
    if (!longSleeve) parts.push([0, dx, top + dy + 6, 3, len - 6, skinC]);
    parts.push([0, dx, top + dy + len, 3, 3, skinC]);
    group(parts, ol);
    if (longSleeve) H(dx, top + dy + len - 1, 3, 1, shDD); // cuff
  };
  const shrugArms = () => {
    group([[0, -13, top + 1, 5, 3, sh], [0, -14, top - 4, 3, 7, sh], [0, -15, top - 7, 4, 3, sk]], ol);
    group([[0, 8, top + 1, 5, 3, shD], [0, 11, top - 4, 3, 7, shD], [0, 11, top - 7, 4, 3, sk]], ol);
    H(-15, top - 7, 4, 1, shade(sk, 0.15)); H(11, top - 7, 4, 1, shade(sk, 0.15));
  };
  const armL = p.moving ? -step * 2 : 0, armR = p.moving ? step * 2 : 0;
  const tl = typing ? (Math.floor((t + p.phase) / 110) % 2) * 2 : 0;

  // torso
  group([[0, -8, top, 16, 16, sh]], ol);
  H(4, top, 4, 16, shD); H(-8, top, 12, 1, shL); H(-8, top + 1, 1, 14, shL); H(-8, top + 15, 16, 1, shDD);
  H(-8, top + 15, 16, 1, paD); // belt line where the top meets the trousers
  const w = p.wear;
  if (front) {
    if (w === 0) { M(-2, top, 6, 1, sk); M(-1, top + 1, 4, 1, sk); M(0, top + 2, 2, 1, skD); }
    else if (w === 1) { H(-6, top, 12, 2, shD); M(-2, top, 6, 2, shDD); M(-1, top + 2, 1, 5, '#f2f2f2'); M(3, top + 2, 1, 4, '#f2f2f2'); H(-5, top + 10, 10, 4, shD); H(-5, top + 10, 10, 1, shDD); }
    else if (w === 2) { M(-1, top, 4, 2, sk); M(-3, top, 3, 3, shL); M(3, top, 3, 3, shL); M(1, top + 2, 1, 13, shD); M(1, top + 6, 1, 1, shL); M(1, top + 10, 1, 1, shL); M(-6, top + 4, 3, 2, shD); }
    else { const sc2 = p.stripe === sh ? C.ink : p.stripe; H(-8, top + 6, 16, 2, sc2); H(-8, top + 10, 16, 1, sc2); M(-2, top, 6, 2, shDD); }
  } else {
    if (w === 1) { H(-6, top, 12, 5, shD); H(-5, top + 4, 10, 1, shDD); }
    else if (w === 3) { const sc2 = p.stripe === sh ? C.ink : p.stripe; H(-8, top + 6, 16, 2, sc2); H(-8, top + 10, 16, 1, sc2); }
    else H(-6, top, 12, 1, shD);
    H(0, top + 2, 1, 12, shD); // back seam
  }
  if (shrug) shrugArms();
  else if (think && front) {
    arm(-11, armL, sh);
    group([[1, 8, top, 3, 7, shD], [1, 5, top - 2, 3, 4, shD], [1, 2, hy + 13, 4, 3, sk]], ol);
  } else if (typing && !front) {
    group([[0, -11, top - tl, 3, 9, sh], [0, -11, top + 9 - tl, 3, 3, sk]], ol);
    group([[0, 8, top - (2 - tl), 3, 9, shD], [0, 8, top + 9 - (2 - tl), 3, 3, sk]], ol);
  } else { arm(-11, armL, sh); arm(8, armR, shD); }

  // ---- head
  const blink = ((t + p.phase * 3) % 4200) < 130;
  const hair = [], st = p.style;
  const hp = (m, dx, dy, w2, h2, c = hc) => hair.push([m, dx, dy, w2, h2, c]);
  if (front) {
    if (st === 3) { hp(0, -10, hy - 4, 20, 8); hp(1, -10, hy + 4, 4, 9); hp(1, 7, hy + 4, 3, 5); }
    else if (st === 4) { hp(0, -7, hy - 1, 14, 3); hp(1, -8, hy + 2, 2, 3); }
    else {
      hp(0, -8, hy - 2, 16, 6); hp(1, -9, hy, 2, 7); hp(1, -6, hy + 4, 7, 1); hp(1, -6, hy + 5, 3, 1);
      if (st === 1) { hp(1, -10, hy + 2, 3, 17); hp(1, 6, hy + 2, 3, 13); }
      if (st === 2) hp(0, -3, hy - 6, 6, 5);
    }
  } else {
    if (st === 3) hp(0, -10, hy - 4, 20, 18);
    else if (st === 4) hp(0, -7, hy - 1, 14, 10);
    else { hp(0, -8, hy - 2, 16, 6); hp(0, -8, hy + 4, 16, st === 1 ? 18 : 8); if (st === 2) hp(0, -3, hy - 6, 6, 5); }
  }
  // skin first (with its outline), then face, then hair over it
  const skull = [[0, -7, hy, 14, 16, sk], [0, -8, hy + 1, 16, 14, sk]];
  if (front) skull.push([1, -10, hy + 7, 2, 4, sk]); else skull.push([0, -10, hy + 7, 2, 4, sk], [0, 8, hy + 7, 2, 4, sk]);
  for (const [m, dx, dy, w2, h2] of skull.concat(hair)) (m ? M : H)(dx - 1, dy - 1, w2 + 2, h2 + 2, olS);
  for (const [m, dx, dy, w2, h2, c] of skull) (m ? M : H)(dx, dy, w2, h2, c);
  H(-7, hy + 15, 14, 1, skD); H(3, hy + 1, 5, 14, shade(sk, -0.06));
  if (front) {
    M(-10, hy + 8, 1, 2, skDD);
    const ey = hy + 8;
    if (p.glasses) { // clear lenses in thin black frames, pupils inside
      for (const lx of [-4, 2]) { M(lx, ey - 1, 4, 5, '#1a1a1a'); M(lx + 1, ey, 2, 3, '#e4eef4'); M(lx + 1, ey, 1, 1, '#ffffff'); if (!blink) M(lx + 2, ey + 1, 1, 2, '#1a1a1a'); else M(lx + 1, ey + 2, 2, 1, '#1a1a1a'); }
      M(0, ey, 2, 1, '#1a1a1a'); M(-6, ey, 2, 1, '#1a1a1a');
    } else if (blink) { M(-3, ey + 2, 2, 1, '#1a1a1a'); M(3, ey + 2, 2, 1, '#1a1a1a'); }
    else { M(-3, ey, 2, 3, '#1a1a1a'); M(3, ey, 2, 3, '#1a1a1a'); M(-3, ey, 1, 1, '#ffffff'); M(3, ey, 1, 1, '#ffffff'); }
    const by = hy + (shrug ? 4 : 6); M(-4, by, 3, 1, hd); M(3, by, 3, 1, hd);
    M(1, hy + 10, 1, 2, skDD);
    M(-5, hy + 12, 2, 1, '#eaa094'); M(6, hy + 12, 2, 1, '#eaa094');
    if (p.beard) { group([[1, -7, hy + 11, 15, 5, hc], [1, -5, hy + 15, 11, 2, hc]], olS); M(-1, hy + 13, 4, 1, shade(hc, -0.5)); }
    else if (shrug) { M(-1, hy + 13, 4, 1, '#8a4436'); M(-2, hy + 12, 1, 1, '#8a4436'); M(3, hy + 12, 1, 1, '#8a4436'); }
    else M(0, hy + 13, 3, 1, '#a05a48');
  }
  for (const [m, dx, dy, w2, h2, c] of hair) (m ? M : H)(dx, dy, w2, h2, c);
  // hair highlights and texture
  if (st === 3) for (const [hx2, hy2] of [[-7, -2], [-2, -3], [3, -2], [6, 0], [-9, 3], [0, 0]]) H(hx2, hy + hy2, 2, 1, hl);
  else if (st !== 4) { H(-4, hy - 1, 6, 1, hl); H(-6, hy, 2, 1, hl); if (!front) H(-5, hy + 6, 1, st === 1 ? 14 : 5, hd); if (st === 2) H(-2, hy - 5, 2, 1, hl); }
  else H(-4, hy, 4, 1, hl);
  if (p.small) {
    const cap = sh === C.acid ? '#1f1f1f' : C.acid, capD = shade(cap, -0.3);
    group([[0, -9, hy - 3, 18, 6, cap]], ol); H(-1, hy - 4, 2, 1, capD); H(-9, hy - 3, 18, 1, shade(cap, 0.3));
    if (front) group([[1, 3, hy + 2, 10, 2, capD]], ol); else H(-9, hy + 2, 18, 1, capD);
  }
  G.globalAlpha = 1;
  p.screen = { x, y, top: y + hy / 2 - 3 - (shrug ? 2 : 0) };
}

// ---------- UI overlay (crisp text at screen resolution) ----------
function oR(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function oText(s, x, y, font, c, align = 'center') { ctx.font = font; ctx.fillStyle = c; ctx.textAlign = align; ctx.fillText(s, x, y); }
function drawUI(t) {
  BUBS = [];
  const k = Math.max(0.7, Math.min(1.3, S));
  if (dog.screen) {
    const X = dog.screen.x * S, Y = dog.screen.y * S, TOP = dog.screen.top * S;
    if (t < dog.woofUntil) bubble(X, TOP - 2, 'Woof!', 10, true, k);
    else if (dog.pose === 'lie' && !dog.moving && Math.floor(t / 1500) % 2 === 0) oText('z', X + 8, TOP + 4 - ((t / 180) % 8), `700 ${Math.round(11 * k)}px "Space Grotesk"`, C.ink);
    if (dogHover) {
      const font = `600 ${Math.round(10 * k)}px "Space Grotesk"`; ctx.font = font;
      const label = T.dog, tw = Math.ceil(ctx.measureText(label).width) + 10, th = Math.round(14 * k);
      oR(X - tw / 2, Y + 4, tw, th, '#161616e6'); oR(X - tw / 2, Y + 4, 2, th, '#d8792a');
      oText(label, X + 1, Y + 4 + th - Math.round(4 * k), font, C.white);
    }
  }
  for (const p of [...people.values()].sort((a, b) => a.u + a.v - b.u - b.v)) {
    if (!p.screen) continue;
    const a = p.data, X = p.screen.x * S, Y = p.screen.y * S, TOP = p.screen.top * S;
    ctx.globalAlpha = p.alpha;
    const ps = Math.round(7 * k); oR(X - ps / 2 - 1, TOP - ps - 6, ps + 2, ps + 2, a.human ? C.white : C.ink); oR(X - ps / 2, TOP - ps - 5, ps, ps, a.human ? (TEAMS[a.availability] || C.grey) : STATUS[a.state] || C.grey);
    if (a.human && a.availability === 'DoNotDisturb') oR(X - ps / 2 + 1, TOP - ps / 2 - 6, ps - 2, 2, C.white);
    const above = TOP - ps - 9, focus = selected === p.id || hovered === p.id;
    if (!p.moving && a.state === 'tool' && a.tool && (focus || t < (p.bubbleUntil || 0))) bubble(X, above, PUBLIC ? agentPhrase(p) : `${a.tool}${a.detail ? ': ' + a.detail : ''}`, selected === p.id ? 60 : 30, false, k);
    else if (shrugging(p, t)) bubble(X, above, SHRUG, 20, true, k);
    else if (!p.moving && a.state === 'thinking') { const n = Math.floor(t / 350) % 4; for (let i = 0; i < n; i++) { oR(X + 6 + i * 6 * k, above - 4 - i * 5 * k, 5 * k, 5 * k, C.ink); oR(X + 7 + i * 6 * k, above - 3 - i * 5 * k, 3 * k, 3 * k, C.acid); } }
    else if (!p.moving && a.state === 'waiting' && Math.floor((t + p.phase) / 1300) % 3 === 0) oText('z', X + 9, above + 4 - ((t / 160) % 9), `700 ${Math.round(12 * k)}px "Space Grotesk"`, C.white);
    if (!focus && !a.human) { ctx.globalAlpha = 1; continue; }
    const name = a.human ? p.name : (a.parentId ? '↳ ' : '') + (p.name || a.project);
    const label = name.length > 26 ? name.slice(0, 25) + '…' : name;
    const font = `600 ${Math.round(10 * k)}px "Space Grotesk"`; ctx.font = font;
    const tw = Math.ceil(ctx.measureText(label).width) + 10, th = Math.round(14 * k);
    oR(X - tw / 2, Y + 4, tw, th, '#161616e6'); oR(X - tw / 2, Y + 4, 2, th, p.shirt === '#1f1f1f' ? C.grey : p.shirt);
    oText(label, X + 1, Y + 4 + th - Math.round(4 * k), font, C.white);
    ctx.globalAlpha = 1;
  }
}
let BUBS = [];
function bubble(x, y, text, max, big, k) {
  const font = big ? `700 ${Math.round(13 * k)}px "Space Grotesk"` : `500 ${Math.round(10.5 * k)}px "Space Grotesk"`;
  ctx.font = font;
  const s = text.length > max ? text.slice(0, max - 1) + '…' : text;
  const w = Math.ceil(ctx.measureText(s).width) + 12, h = Math.round((big ? 20 : 17) * k);
  const cw = LW * S, bx = Math.round(Math.max(4, Math.min(cw - w - 4, x - w / 2)));
  let by = Math.round(y - h - 6);
  // don't cover a bubble that's already up: stack above it and run a thin stem down to the person
  for (let n = 0; n < 4 && BUBS.some(r => bx < r[0] + r[2] + 4 && r[0] < bx + w + 4 && by < r[1] + r[3] + 4 && r[1] < by + h + 8); n++) by -= h + 10;
  if (by < 2) return; // no room left above: skip it, it shows again on hover
  BUBS.push([bx, by, w, h]);
  if (by < Math.round(y - h - 6)) oR(x - 1, by + h + 4, 2, Math.round(y - h - 6) - by, C.ink);
  oR(bx - 2, by - 2, w + 4, h + 4, C.ink); oR(bx, by, w, h, C.white); oR(bx, by + h - 2, w, 2, '#ececec');
  oR(x - 3, by + h + 2, 6, 2, C.ink); oR(x - 1, by + h + 4, 2, 2, C.ink); oR(x - 2, by + h, 4, 2, '#ececec');
  oText(s, bx + w / 2, by + h - Math.round((big ? 6 : 5) * k), font, C.ink);
}

// ---------- Lighting ----------
const LAMPS = [P(46, 0, 70), P(182, 0, 70), P(0, 167, 70), P(0, 232, 70), P(0, 297, 70)];
function drawLight(sk) {
  if (sk.day) return;
  // darken only the room's own pixels, then lay the lamp light on top of them
  G.save(); G.globalCompositeOperation = 'source-atop';
  // no dimming: the office stays bright at any hour, the lamps only add warmth
  const L = lightG; L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'source-over'; L.clearRect(0, 0, lightC.width, lightC.height); L.setTransform(K, 0, 0, K, 0, 0); L.globalCompositeOperation = 'lighter';
  const glow = (x, y, r, rgb, a, dy = 0) => { const g = L.createRadialGradient(x, y, 1, x, y + dy, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); L.fillStyle = g; L.fillRect(x - r - 4, y - r - 4, r * 2 + 8, r * 2 + 8 + dy); };
  for (const [x, y] of LAMPS) glow(x, y, 50, '255,190,110', 0.18, 16);
  for (const n of BUSY) { const d = DESKS[n], [x, y] = P(d.u + 17, d.v + 5, 22); glow(x, y, 20, '140,180,255', 0.15); }
  { const [nx, ny] = P(118, 0, 70); glow(nx, ny, 64, '240,217,71', 0.12); }
  G.drawImage(lightC, 0, 0);
  G.restore();
}

// ---------- Build + fit ----------
let SPRITES = [], NEON = [];
function makeSprite(o) {
  G = scrG; scrG.clearRect(0, 0, scr.width, scr.height); o.draw();
  // only scan the area the object can cover: its footprint on screen plus room for height
  const [u0, u1, v0, v1] = o.f;
  const rx = Math.max(0, Math.floor((P(u0, v1)[0] - 40) * K)), ry = Math.max(0, Math.floor((P(u0, v0)[1] - 100) * K));
  const RW = Math.min(scr.width, Math.ceil((P(u1, v0)[0] + 40) * K)) - rx, RH = Math.min(scr.height, Math.ceil((P(u1, v1)[1] + 20) * K)) - ry;
  const d = scrG.getImageData(rx, ry, RW, RH).data;
  let x0 = RW, y0 = RH, x1 = -1, y1 = -1;
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) if (d[(y * RW + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const w = Math.max(1, x1 - x0 + 1), h = Math.max(1, y1 - y0 + 1);
  const [c, g] = mk(w, h); if (x1 >= 0) g.drawImage(scr, rx + x0, ry + y0, w, h, 0, 0, w, h);
  const dx = rx + Math.max(0, x0), dy = ry + Math.max(0, y0);
  return { kind: 'obj', img: c, dx, dy, x: dx / K, y: dy / K, w: w / K, h: h / K, f: o.f, live: o.live };
}
let BUILT_K = 0;
function build() {
  [bgC, bgG] = mk(LW * K, LH * K); [scr, scrG] = mk(LW * K, LH * K, true); [lightC, lightG] = mk(LW * K, LH * K);
  NEON = [];
  G = bgG; drawFloor(); drawWalls();
  SPRITES = OBJECTS.map(makeSprite);
  G = ctx; BUILT_K = K;
}
function fit() {
  const wrap = document.getElementById('wrap'), cs = getComputedStyle(wrap);
  const aw = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 8;
  const ah = PUBLIC ? Math.max(280, innerHeight * 0.75) : innerWidth > 960 ? wrap.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 8 : Infinity;
  S = Math.min(aw / LW, ah / LH);
  DPR = window.devicePixelRatio || 1;
  K = Math.min(4, Math.max(1, S * DPR)); // the canvas matches the screen's pixels (capped for very large screens)
  UIS = K / S;
  cv.style.imageRendering = K > S * DPR + 0.01 ? 'auto' : 'pixelated'; // shrinking: smooth, never drop pixels
  cv.style.width = LW * S + 'px'; cv.style.height = LH * S + 'px';
  cv.width = Math.round(LW * K); cv.height = Math.round(LH * K);
}
let resizeT = 0;
addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { fit(); build(); }, 120); });

// depth order: a is drawn before b when it lies entirely behind b on the u or v axis
function order(a, b) {
  const fa = a.f, fb = b.f;
  if (fa[1] <= fb[0] || fa[3] <= fb[2]) return -1;
  if (fb[1] <= fa[0] || fb[3] <= fa[2]) return 1;
  return (fa[0] + fa[1] + fa[2] + fa[3] + (a.kind === 'obj' ? 0 : 6) + (a.bias || 0)) - (fb[0] + fb[1] + fb[2] + fb[3] + (b.kind === 'obj' ? 0 : 6) + (b.bias || 0));
}

// Pairwise depth rules aren't transitive, so sort as a graph: only items whose pictures
// overlap on screen get an edge, then a topological sort (nearest-last as tie-break).
function depthSort(items) {
  const n = items.length;
  const key = it => it.f[0] + it.f[1] + it.f[2] + it.f[3] + (it.kind === 'obj' ? 0 : 6) + (it.bias || 0);
  const bx = items.map(it => it.kind === 'person' ? [it.sx - 12, it.sy - 36, it.sx + 12, it.sy + 6] : it.kind === 'dog' ? [it.sx - 10, it.sy - 18, it.sx + 10, it.sy + 3] : [it.x, it.y, it.x + it.w, it.y + it.h]);
  const out = Array.from({ length: n }, () => []), indeg = new Array(n).fill(0);
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const a = bx[i], b = bx[j];
    if (a[2] <= b[0] || b[2] <= a[0] || a[3] <= b[1] || b[3] <= a[1]) continue;
    if (order(items[i], items[j]) < 0) { out[i].push(j); indeg[j]++; } else { out[j].push(i); indeg[i]++; }
  }
  const keys = items.map(key), done = new Uint8Array(n), res = [];
  for (let k = 0; k < n; k++) {
    let best = -1;
    for (let i = 0; i < n; i++) if (!done[i] && indeg[i] === 0 && (best < 0 || keys[i] < keys[best])) best = i;
    if (best < 0) for (let i = 0; i < n; i++) if (!done[i] && (best < 0 || keys[i] < keys[best])) best = i; // cycle: fall back to distance
    done[best] = 1; res.push(items[best]);
    for (const j of out[best]) indeg[j]--;
  }
  return res;
}

// ---------- Names ----------
// Agents get a name that says what they're there for. First matching rule wins.
const NAME_RULES = [
  [/remodel/i, 'Website Improve Guy'], [/shruggie-?website/i, 'Homepage Guy'], [/portal|workspace/i, 'Workspace Guy'],
  [/agent-?office/i, 'Office Decorator Guy'], [/partner/i, 'Partner Tracker Guy'], [/commute/i, 'Commute Guy'],
  [/netsales|sales/i, 'Sales Numbers Guy'], [/^agents?$/i, 'Agent Wrangler'], [/scratch/i, 'Scratchpad Guy'], [/^shrug$/i, 'Errand Guy'],
];
const KIND_NAMES = {
  'site-crawler': 'Website Reader', 'industry-strategist': 'Strategy Guy', 'site-builder': 'Site Builder', 'fidelity-auditor': 'Fact Checker',
  'design-critic': 'Design Critic', Explore: 'Explorer', Plan: 'Planner', 'general-purpose': 'Helper', 'claude-code-guide': 'Manual Reader',
  fork: 'Twin', 'statusline-setup': 'Status Bar Fixer', subagent: 'Helper',
};
const titleCase = s => String(s || '').replace(/[-_]+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());
function agentName(a) {
  if (a.role) return a.role; // from the server's fixed list (public snapshot and local alike)
  if (a.human) return a.name;
  if (a.parentId) return KIND_NAMES[a.kind] || titleCase(a.kind);
  for (const [re, n] of NAME_RULES) if (re.test(a.project || '')) return n;
  const words = String(a.project || 'someone').replace(/^(Test|Documents|Desktop|Projects?)-/i, '').split('-').slice(-2).join(' ');
  return titleCase(words) + ' Guy';
}
function nameFor(a) { // a second "Homepage Guy" becomes "Homepage Guy #2"
  const base = agentName(a);
  if (a.extra) return base; // the website's extras are all just "Statist"
  const taken = new Set([...people.values()].filter(o => !o.leaving && o.name).map(o => o.name));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) if (!taken.has(`${base} #${n}`)) return `${base} #${n}`;
}

// ---------- Real humans (Teams status from the workspace) ----------
const TEAMS = { Available: '#6bb700', AvailableIdle: '#6bb700', Busy: '#c4314b', BusyIdle: '#c4314b', DoNotDisturb: '#c4314b', BeRightBack: '#fcb72e', Away: '#fcb72e' };
const ACT = { InACall: 'In a call', InAConferenceCall: 'In a call', InAMeeting: 'In a meeting', Presenting: 'Presenting', DoNotDisturb: 'Focusing', Focusing: 'Focusing', Busy: 'Busy', Away: 'Away', BeRightBack: 'Be right back', Available: 'Available', OffWork: 'Off work', OutOfOffice: 'Out of office', InTheWorkspace: 'In the workspace' };
const ACT_DE = { InACall: 'Im Call', InAConferenceCall: 'Im Call', InAMeeting: 'Im Meeting', Presenting: 'Präsentiert', DoNotDisturb: 'Konzentriert', Focusing: 'Konzentriert', Busy: 'Beschäftigt', Away: 'Kurz weg', BeRightBack: 'Gleich zurück', Available: 'Verfügbar', InTheWorkspace: 'Im Workspace' };
const humanLabel = h => (LANG === 'de' ? ACT_DE : ACT)[h.activity] || (LANG === 'de' ? ACT_DE : ACT)[h.availability] || String(h.availability || '').replace(/([a-z])([A-Z])/g, '$1 $2');
function humanZone(h) {
  if (/Call|Meeting|Presenting/.test(h.activity || '')) return 'meeting';
  if (/Busy|DoNotDisturb/.test(h.availability || '')) return 'desks';
  if (/Away|BeRightBack/.test(h.availability || '')) return 'lounge';
  return 'humans';
}

// ---------- Data + sidebar ----------
function apply(snap) {
  const seen = new Set();
  const hum = (snap.humans || []).map(h => ({ ...h, human: true, state: 'human', zone: humanZone(h) }));
  for (const a of snap.agents.concat(hum)) {
    seen.add(a.id);
    let p = people.get(a.id);
    if (!p) { p = makePerson(a); p.name = nameFor(a); people.set(a.id, p); }
    if (a.human) p.name = a.name;
    const sig = `${a.state}|${a.tool}|${a.detail}|${a.zone}`;
    if (sig !== p.sig) { p.sig = sig; if (a.state === 'tool') p.bubbleUntil = performance.now() + 3500; }
    p.data = a; p.leaving = false;
    assign(p, a.zone);
  }
  for (const p of people.values()) if (!seen.has(p.id) && !p.leaving) { p.leaving = true; assign(p, 'exit'); }
  renderList(snap);
}
const fmtAgo = ms => { const s = Math.max(0, Math.round(ms / 1000)); return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m` : `${Math.floor(s / 3600)}h`; };
const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STATE_LABEL = { tool: 'working', thinking: 'thinking', waiting: 'waiting', done: 'finished' };
function renderPublic(snap) {
  const el = document.getElementById('office-people');
  if (!el) return;
  const real = snap.agents.filter(a => !a.extra), hum = snap.humans || [];
  const row = (color, name, what) => `<li><span class="office-dot" style="background:${color}"></span><b>${esc(name)}</b> <span>${esc(what)}</span></li>`;
  // humans (and Henry) first, then the agents
  let html = `<div class="office-group"><div class="office-label">${T.humans} · ${hum.length}</div><ul>`;
  html += hum.map(h => { const p = people.get(h.id); return row(p ? p.shirt : C.grey, h.name, humanPhrase(p)); }).join('');
  html += row('#d8792a', 'Henry', dogPhrase()) + '</ul></div>';
  html += `<div class="office-group"><div class="office-label">${T.agents} · ${real.length}</div><ul>`;
  html += real.length ? real.map(a => { const p = people.get(a.id); return row(p ? p.shirt : C.grey, p ? p.name : a.role, p ? agentPhrase(p) : ''); }).join('') : `<li class="office-empty">${esc(T.nobody)}</li>`;
  el.innerHTML = html + '</ul></div>';
}
function renderList(snap) {
  if (PUBLIC) return renderPublic(snap);
  const as = snap.agents, hum = snap.humans || [];
  document.getElementById('nWork').textContent = as.filter(a => a.state === 'tool').length;
  document.getElementById('nThink').textContent = as.filter(a => a.state === 'thinking').length;
  document.getElementById('nWait').textContent = as.filter(a => a.state === 'waiting').length;
  document.getElementById('nHuman').textContent = hum.length;
  const list = document.getElementById('list');
  let html = '';
  if (!as.length) html = `<div class="empty"><strong>${SHRUG}</strong>No agents in right now. Start a Claude session and it walks in through the door.</div>`;
  const ord = [], subs = as.filter(a => a.parentId);
  for (const a of as.filter(a => !a.parentId)) { ord.push(a); ord.push(...subs.filter(s => s.parentId === a.sessionId)); }
  ord.push(...subs.filter(s => !as.some(a => !a.parentId && a.sessionId === s.parentId)));
  html += ord.map(a => {
    const p = people.get(a.id);
    const doing = a.state === 'tool' ? `<b>${esc(a.tool)}</b> ${esc(a.detail)}` : a.state === 'thinking' ? 'thinking it over' : esc(a.detail || 'idle');
    const what = a.parentId ? `${a.kind} · ${a.title}` : `${a.project} · ${a.title}`;
    return `<div class="card ${a.parentId ? 'sub' : ''} ${selected === a.id ? 'sel' : ''}" data-id="${esc(a.id)}" tabindex="0">
      <div class="row"><span class="swatch" style="background:${p ? p.shirt : C.grey}"></span>
        <span class="proj">${esc(p ? p.name : agentName(a))}</span>
        ${a.repeats > 1 ? `<span class="rep">×${a.repeats}</span>` : ''}
        <span class="state ${esc(a.state)}">${STATE_LABEL[a.state] || esc(a.state)} · ${fmtAgo(snap.at - (a.since || a.lastActivity))}</span></div>
      <div class="title" title="${esc(what)}">${esc(what)}</div>
      <div class="doing">${doing}</div>
    </div>`;
  }).join('');
  html += `<div class="eyebrow eyebrow--group">Real humans</div>`;
  if (hum.length) html += hum.map(h => `<div class="card human ${selected === h.id ? 'sel' : ''}" data-id="${esc(h.id)}" tabindex="0">
      <div class="row"><span class="swatch swatch--dot" style="background:${TEAMS[h.availability] || C.grey}"></span>
        <span class="proj">${esc(h.name)}</span><span class="state human">${esc(humanLabel(h))}</span></div>
      <div class="title">${h.source === 'teams' ? 'Teams status' : 'Has the workspace open'}</div>
    </div>`).join('');
  else html += `<p class="note">${snap.teams === null ? 'Can’t reach the workspace right now, so no humans for the moment.' : 'Nobody from the team has the workspace open right now.'}</p>`;
  list.innerHTML = html;
}
function select(id) {
  selected = id && selected !== id ? id : null;
  document.querySelectorAll('.card').forEach(el => el.classList.toggle('sel', el.dataset.id === selected));
}
const list = document.getElementById('list') || document.createElement('div');
list.addEventListener('click', e => { const c = e.target.closest('.card'); if (c) select(c.dataset.id); });
list.addEventListener('mouseover', e => { const c = e.target.closest('.card'); hovered = c ? c.dataset.id : null; });
list.addEventListener('mouseleave', () => { hovered = null; });
list.addEventListener('keydown', e => { const c = e.target.closest('.card'); if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(c.dataset.id); } });
function personAt(e) {
  const r = cv.getBoundingClientRect(), mx = (e.clientX - r.left) / S, my = (e.clientY - r.top) / S;
  let best = null, bd = 16;
  for (const p of people.values()) { if (!p.screen) continue; const d = Math.hypot(p.screen.x - mx, p.screen.y - 12 - my); if (d < bd) { bd = d; best = p; } }
  return best;
}
let dogHover = false;
function dogAt(e) {
  if (!dog.screen) return false;
  const r = cv.getBoundingClientRect(), mx = (e.clientX - r.left) / S, my = (e.clientY - r.top) / S;
  return Math.abs(mx - dog.screen.x) < 9 && my > dog.screen.top - 2 && my < dog.screen.y + 3;
}
cv.addEventListener('mousemove', e => { dogHover = dogAt(e); const p = dogHover ? null : personAt(e); hovered = p ? p.id : null; cv.style.cursor = p || dogHover ? 'pointer' : 'default'; });
cv.addEventListener('mouseleave', () => { hovered = null; dogHover = false; });
cv.addEventListener('click', e => {
  if (dogAt(e)) { const now = performance.now(); dog.woofUntil = now + 1500; dog.hopAt = now; if (!dog.moving) { dog.pose = 'stand'; dog.pantUntil = now + 2500; } return; }
  const best = personAt(e);
  select(best ? best.id : null);
  if (best) document.querySelector(`.card[data-id="${CSS.escape(best.id)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
});

// ---------- Demo mode (?demo) ----------
function startDemo() {
  const tools = [['Edit', 'index.html'], ['Bash', 'npm run build'], ['Read', 'server.js'], ['Grep', 'useEffect'], ['WebSearch', 'best pizza munich'],
    ['Agent', 'Audit fidelity'], ['outlook·create_draft', ''], ['chrome·navigate', 'example.com'], ['Write', 'styles.css'], [null, '']];
  const names = ['Shrug', 'Shruggie-Website', 'remodel', 'Partner-Tracking-Tool', 'commute-chameleon', 'Shruggie-Portal', 'Agents'];
  const fake = names.map((n, i) => ({ id: 'demo' + i, sessionId: 'demo' + i, parentId: null, kind: 'session', project: n, title: 'Demo task ' + (i + 1), repeats: 1 }));
  fake.push({ id: 'demo-sub', sessionId: 'demo-sub', parentId: 'demo2', kind: 'site-builder', project: 'remodel', title: 'Build hero section', repeats: 1 });
  fake.push({ id: 'demo-sub2', sessionId: 'demo-sub2', parentId: 'demo2', kind: 'design-critic', project: 'remodel', title: 'Review the home page', repeats: 1 });
  const zoneOf = t => !t ? 'whiteboard' : /Edit|Write/.test(t) ? 'desks' : t === 'Bash' ? 'servers' : /Read|Grep/.test(t) ? 'library' : /Web|chrome/.test(t) ? 'window' : t === 'Agent' ? 'meeting' : 'mailroom';
  const humansDemo = [
    { id: 'human-demo1', name: 'Benni', availability: 'Available', activity: 'InTheWorkspace', source: 'workspace' },
    { id: 'human-demo2', name: 'Mia', availability: 'Busy', activity: 'InAMeeting' },
    { id: 'human-demo3', name: 'Jo', availability: 'Available', activity: 'Available' },
  ];
  const roll = () => {
    for (const a of fake) {
      if (a.state && Math.random() < 0.6) continue;
      if (Math.random() < 0.2) { a.state = 'waiting'; a.zone = 'lounge'; a.tool = null; a.detail = 'Done, over to you.'; }
      else { const [t, d] = tools[Math.floor(Math.random() * tools.length)]; a.tool = t; a.detail = d; a.state = t ? 'tool' : 'thinking'; a.zone = zoneOf(t); }
      a.since = Date.now(); a.lastActivity = Date.now();
    }
    if (Math.random() < 0.35) { const h = humansDemo[Math.floor(Math.random() * humansDemo.length)], st = [['Available', 'Available'], ['Busy', 'InAMeeting'], ['Away', 'Away'], ['DoNotDisturb', 'Focusing']][Math.floor(Math.random() * 4)]; h.availability = st[0]; h.activity = st[1]; }
    apply({ agents: fake, humans: humansDemo, teams: true, at: Date.now() });
  };
  roll(); setInterval(roll, 4500);
  const ll = document.getElementById('liveLabel'); if (ll) ll.textContent = 'demo';
}

// ---------- Loop ----------
let last = performance.now();
function frame(t) {
  const dt = Math.min(64, t - last); last = t; NOW = t;
  stepPeople(dt); stepDog(dt, t);
  const now = new Date(), sk = window.SKY_OVERRIDE || sky(now);
  BUSY = new Set([...people.values()].filter(p => !p.moving && p.zone === 'desks' && (p.data.state === 'tool' || p.data.human) && p.spot?.desk !== undefined).map(p => p.spot.desk));
  G = ctx; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(bgC, 0, 0);
  drawLive(t, now, sk);
  const items = depthSort(SPRITES.concat([...people.values()].map(p => { const [sx, sy] = P(p.u, p.v); return { kind: 'person', p, sx, sy, f: [p.u - 3, p.u + 3, p.v - 3, p.v + 3] }; }), [{ kind: 'dog', sx: P(dog.u, dog.v)[0], sy: P(dog.u, dog.v)[1], f: [dog.u - 3, dog.u + 3, dog.v - 3, dog.v + 3], bias: Math.hypot(dog.u - BED.u, dog.v - BED.v) < 10 ? 40 : 0 }]));
  for (const it of items) {
    if (it.kind === 'person') drawPerson(it.p, t);
    else if (it.kind === 'dog') drawDog(t);
    else { G.drawImage(it.img, it.dx, it.dy); if (it.live) it.live(); }
  }
  drawLight(sk);
  ctx.setTransform(UIS, 0, 0, UIS, 0, 0);
  drawUI(t);
  requestAnimationFrame(frame);
}

defineObjects();
fit();
build();
document.fonts?.ready.then(() => { fit(); build(); });
function startPublic() {
  const min = CFG.extras ?? 4, zones = ['desks', 'library', 'servers', 'window', 'whiteboard', 'lounge', 'mailroom'];
  const extras = Array.from({ length: min }, (_, i) => ({ id: 'extra' + i, extra: true, role: T.extra, kind: 'session', parentId: null, project: '', title: '', detail: '', zone: null }));
  const roll = () => { for (const e of extras) { if (e.zone && Math.random() < 0.6) continue; e.zone = zones[Math.floor(Math.random() * zones.length)]; e.state = e.zone === 'whiteboard' ? 'thinking' : e.zone === 'lounge' ? 'waiting' : 'tool'; e.tool = e.state === 'tool' ? '·' : null; } };
  let live = { agents: [], humans: [] };
  const push = () => {
    const real = (live.agents || []).map(a => ({ id: 'a' + a.id, role: a.role, state: a.state, zone: a.zone, parentId: a.sub ? 'p' : null, kind: a.sub ? 'helper' : 'session', project: '', title: '', detail: '', tool: a.state === 'tool' ? '·' : null }));
    const hum = (live.humans || []).map(h => ({ ...h, id: 'h' + h.id, source: 'workspace' }));
    apply({ agents: real.concat(extras.slice(0, Math.max(0, min - real.length))), humans: hum, teams: true, at: Date.now() });
  };
  const poll = async () => { try { const r = await fetch(CFG.endpoint, { cache: 'no-store' }); if (r.ok) live = await r.json(); } catch { /* keep the last state */ } push(); };
  roll(); poll(); setInterval(poll, 12000); setInterval(() => { roll(); push(); }, 7000);
}

if (PUBLIC) startPublic();
else if (new URLSearchParams(location.search).has('demo')) startDemo();
else {
  const live = document.getElementById('live'), label = document.getElementById('liveLabel');
  const es = new EventSource('/events');
  es.onmessage = e => apply(JSON.parse(e.data));
  es.onerror = () => { label.textContent = 'reconnecting'; live.classList.add('off'); };
  es.onopen = () => { label.textContent = 'live'; live.classList.remove('off'); };
}
requestAnimationFrame(frame);
