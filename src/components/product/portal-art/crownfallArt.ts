// Pure procedural HTML5 Canvas 2D artwork for Casual Realms: "Crownfall"
// Genre: Arena · 4 Players
// Hook: "The bridge collapses behind you. Only one seat left on the drop-ship."

interface Rng {
  next: () => number;
  range: (min: number, max: number) => number;
  int: (min: number, max: number) => number;
}

function createRng(seed: number): Rng {
  let s = seed >>> 0;
  const next = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min: number, max: number) => min + next() * (max - min),
    int: (min: number, max: number) => Math.floor(min + next() * (max - min + 1)),
  };
}

interface Vec2 {
  x: number;
  y: number;
}

const DESIGN_W = 720;
const DESIGN_H = 1280;

// Cached deterministic 128x128 film-grain tile for <2ms overlay
let cachedGrainCanvas: HTMLCanvasElement | null = null;

function getGrainCanvas(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (cachedGrainCanvas) return cachedGrainCanvas;
  const size = 128;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const gctx = c.getContext('2d');
  if (!gctx) return null;
  const img = gctx.createImageData(size, size);
  const data = img.data;
  const rng = createRng(0xc0ff3e77);
  for (let i = 0; i < data.length; i += 4) {
    const v = rng.next() > 0.5 ? 255 : 0;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = Math.floor(rng.range(8, 26));
  }
  gctx.putImageData(img, 0, 0);
  cachedGrainCanvas = c;
  return c;
}

function drawRadialGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rInner: number,
  rOuter: number,
  stops: ReadonlyArray<[number, string]>,
  composite: GlobalCompositeOperation = 'lighter',
): void {
  ctx.save();
  ctx.globalCompositeOperation = composite;
  const g = ctx.createRadialGradient(x, y, rInner, x, y, rOuter);
  for (const [offset, color] of stops) {
    g.addColorStop(offset, color);
  }
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, rOuter, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  pts: ReadonlyArray<Vec2>,
  fill?: string | CanvasGradient,
  stroke?: string | CanvasGradient,
  lineWidth = 1,
): void {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

// ---------------------------------------------------------------------------
// 1. ELECTRIC TWILIGHT STORM SKY
// ---------------------------------------------------------------------------
function drawStormSky(ctx: CanvasRenderingContext2D): void {
  const sky = ctx.createLinearGradient(0, 0, 0, DESIGN_H);
  sky.addColorStop(0.0, '#040812');
  sky.addColorStop(0.16, '#0a162a');
  sky.addColorStop(0.34, '#132b48');
  sky.addColorStop(0.50, '#1e4264');
  sky.addColorStop(0.62, '#24304a');
  sky.addColorStop(0.75, '#15192b');
  sky.addColorStop(0.89, '#080b15');
  sky.addColorStop(1.0, '#03050a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);

  // Electric storm-flash atmospheric scatter behind upper-left thunderheads
  drawRadialGlow(ctx, 215, 180, 12, 460, [
    [0.0, 'rgba(150, 238, 255, 0.44)'],
    [0.22, 'rgba(66, 178, 235, 0.24)'],
    [0.52, 'rgba(28, 86, 148, 0.10)'],
    [1.0, 'rgba(10, 24, 48, 0)'],
  ]);

  // Subtle twilight amber-violet city bounce glow far below
  drawRadialGlow(ctx, 470, 740, 20, 440, [
    [0.0, 'rgba(240, 124, 56, 0.18)'],
    [0.38, 'rgba(134, 58, 66, 0.10)'],
    [0.72, 'rgba(34, 30, 56, 0.04)'],
    [1.0, 'rgba(10, 12, 22, 0)'],
  ]);
}

// ---------------------------------------------------------------------------
// 2. VOLUMETRIC LAYERED STORM CLOUDS
// ---------------------------------------------------------------------------
function drawCloudBank(
  ctx: CanvasRenderingContext2D,
  rng: Rng,
  cx: number,
  cy: number,
  spreadX: number,
  spreadY: number,
  puffs: number,
  darkColor: string,
  midColor: string,
  rimColor: string,
  rimBiasX: number,
  rimBiasY: number,
): void {
  const items: Array<{ x: number; y: number; rx: number; ry: number }> = [];
  for (let i = 0; i < puffs; i++) {
    const t = i / Math.max(1, puffs - 1);
    const angle = (t - 0.5) * Math.PI * 1.15 + rng.range(-0.28, 0.28);
    const x = cx + Math.sin(angle) * spreadX * rng.range(0.55, 1.12);
    const y = cy + Math.cos(angle * 1.25) * spreadY * rng.range(-0.65, 0.65);
    const rx = rng.range(spreadX * 0.22, spreadX * 0.48);
    const ry = rng.range(spreadY * 0.36, spreadY * 0.78);
    items.push({ x, y, rx, ry });
  }

  // Silver-cyan backlit cloud rim pass
  for (const p of items) {
    ctx.save();
    ctx.translate(p.x + rimBiasX, p.y + rimBiasY);
    ctx.scale(1, p.ry / p.rx);
    const g = ctx.createRadialGradient(0, 0, p.rx * 0.08, 0, 0, p.rx);
    g.addColorStop(0.0, rimColor);
    g.addColorStop(0.52, midColor);
    g.addColorStop(1.0, 'rgba(10, 20, 38, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, p.rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Deep brooding thunderhead belly pass
  for (const p of items) {
    ctx.save();
    ctx.translate(p.x, p.y + p.ry * 0.16);
    ctx.scale(1, (p.ry * 0.9) / p.rx);
    const g = ctx.createRadialGradient(0, -p.rx * 0.12, p.rx * 0.05, 0, 0, p.rx);
    g.addColorStop(0.0, darkColor);
    g.addColorStop(0.66, darkColor);
    g.addColorStop(1.0, 'rgba(7, 13, 25, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, p.rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawStormClouds(ctx: CanvasRenderingContext2D, rng: Rng): void {
  // Upper-left storm anvil backlit by lightning
  drawCloudBank(
    ctx,
    rng,
    170,
    98,
    245,
    82,
    15,
    'rgba(8, 16, 32, 0.90)',
    'rgba(28, 66, 108, 0.56)',
    'rgba(148, 234, 255, 0.42)',
    16,
    14,
  );
  // Upper-right dark storm front
  drawCloudBank(
    ctx,
    rng,
    565,
    112,
    255,
    94,
    15,
    'rgba(7, 13, 26, 0.92)',
    'rgba(20, 40, 68, 0.52)',
    'rgba(105, 192, 238, 0.24)',
    -18,
    12,
  );
  // Mid-altitude electric shelf cloud behind drop-ship
  drawCloudBank(
    ctx,
    rng,
    365,
    238,
    310,
    68,
    16,
    'rgba(10, 19, 36, 0.72)',
    'rgba(34, 78, 120, 0.42)',
    'rgba(165, 242, 255, 0.34)',
    -16,
    -10,
  );
  // Lower abyssal cloud sea separating skybridge from megacity below
  drawCloudBank(
    ctx,
    rng,
    150,
    635,
    270,
    78,
    12,
    'rgba(12, 20, 36, 0.68)',
    'rgba(34, 58, 88, 0.38)',
    'rgba(104, 182, 226, 0.18)',
    12,
    -14,
  );
  drawCloudBank(
    ctx,
    rng,
    575,
    615,
    265,
    80,
    12,
    'rgba(12, 18, 33, 0.70)',
    'rgba(52, 54, 80, 0.36)',
    'rgba(255, 174, 98, 0.18)',
    -12,
    -12,
  );
}

// ---------------------------------------------------------------------------
// 3. JAGGED DISTANT LIGHTNING FORK (TAPERED ELECTRIC DISCHARGE)
// ---------------------------------------------------------------------------
function generateLightningPath(
  rng: Rng,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  displace: number,
  depth: number,
): Vec2[] {
  let pts: Vec2[] = [
    { x: x0, y: y0 },
    { x: x1, y: y1 },
  ];
  let d = displace;
  for (let iter = 0; iter < depth; iter++) {
    const next: Vec2[] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const mx = (a.x + b.x) * 0.5 + rng.range(-d, d);
      const my = (a.y + b.y) * 0.5 + rng.range(-d * 0.25, d * 0.25);
      next.push({ x: mx, y: my }, b);
    }
    pts = next;
    d *= 0.54;
  }
  return pts;
}

function strokeTaperedLightning(
  ctx: CanvasRenderingContext2D,
  pts: ReadonlyArray<Vec2>,
  baseWidth: number,
  alphaScale: number,
): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const n = pts.length - 1;
  // Pass 1: Wide electric scatter
  for (let i = 0; i < n; i++) {
    const taper = 1 - (i / n) * 0.65;
    ctx.strokeStyle = `rgba(36, 154, 240, ${0.15 * alphaScale * taper})`;
    ctx.lineWidth = baseWidth * 12 * taper;
    ctx.beginPath();
    ctx.moveTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
    ctx.stroke();
  }
  // Pass 2: Intense cyan halo
  for (let i = 0; i < n; i++) {
    const taper = 1 - (i / n) * 0.72;
    ctx.strokeStyle = `rgba(116, 230, 255, ${0.44 * alphaScale * taper})`;
    ctx.lineWidth = baseWidth * 4.2 * taper;
    ctx.beginPath();
    ctx.moveTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
    ctx.stroke();
  }
  // Pass 3: Razor-sharp cyan-white core
  for (let i = 0; i < n; i++) {
    const taper = 1 - (i / n) * 0.8;
    ctx.strokeStyle = `rgba(240, 253, 255, ${0.96 * alphaScale * taper})`;
    ctx.lineWidth = Math.max(0.5, baseWidth * taper);
    ctx.beginPath();
    ctx.moveTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLightning(ctx: CanvasRenderingContext2D, rng: Rng): void {
  const mainBolt = generateLightningPath(rng, 224, 56, 154, 595, 44, 5);

  // Cloud-edge burst glow at origin
  drawRadialGlow(ctx, 224, 78, 8, 190, [
    [0.0, 'rgba(220, 250, 255, 0.78)'],
    [0.22, 'rgba(98, 218, 255, 0.36)'],
    [0.58, 'rgba(32, 120, 205, 0.14)'],
    [1.0, 'rgba(15, 40, 82, 0)'],
  ]);

  // Forked branches
  const branchIndices = [5, 10, 16, 22];
  for (let b = 0; b < branchIndices.length; b++) {
    const idx = Math.min(branchIndices[b], mainBolt.length - 2);
    const origin = mainBolt[idx];
    const dir = b % 2 === 0 ? 1 : -1;
    const branch = generateLightningPath(
      rng,
      origin.x,
      origin.y,
      origin.x + dir * rng.range(52, 125),
      origin.y + rng.range(85, 175),
      22,
      4,
    );
    strokeTaperedLightning(ctx, branch, 1.35, 0.65);

    if (branch.length > 6) {
      const subOrigin = branch[5];
      const twig = generateLightningPath(
        rng,
        subOrigin.x,
        subOrigin.y,
        subOrigin.x + dir * rng.range(24, 55),
        subOrigin.y + rng.range(38, 76),
        11,
        3,
      );
      strokeTaperedLightning(ctx, twig, 0.85, 0.42);
    }
  }

  strokeTaperedLightning(ctx, mainBolt, 2.3, 1.0);
}

// ---------------------------------------------------------------------------
// 4. DISTANT MEGACITY TOWERS & CLOUD ABYSS FAR BELOW
// ---------------------------------------------------------------------------
function drawMegacityAbyss(ctx: CanvasRenderingContext2D, rng: Rng): void {
  const layers = [
    { count: 20, baseY: 900, minH: 130, maxH: 290, minW: 20, maxW: 52, col: '#122036', alpha: 0.64, lightChance: 0.42 },
    { count: 15, baseY: 985, minH: 140, maxH: 325, minW: 28, maxW: 68, col: '#0c1526', alpha: 0.84, lightChance: 0.62 },
  ];

  for (const layer of layers) {
    for (let i = 0; i < layer.count; i++) {
      const x = (i / layer.count) * (DESIGN_W + 60) - 30 + rng.range(-16, 16);
      const w = rng.range(layer.minW, layer.maxW);
      const h = rng.range(layer.minH, layer.maxH);
      const topY = layer.baseY - h;

      ctx.save();
      ctx.globalAlpha = layer.alpha;
      const g = ctx.createLinearGradient(x, topY, x, layer.baseY);
      g.addColorStop(0.0, layer.col);
      g.addColorStop(0.75, '#09101d');
      g.addColorStop(1.0, 'rgba(5, 9, 16, 0)');
      ctx.fillStyle = g;

      // Stepped brutalist megastructure silhouette
      const step = rng.next() > 0.5 ? w * 0.25 : 0;
      ctx.beginPath();
      ctx.moveTo(x, layer.baseY);
      ctx.lineTo(x, topY + step * 0.5);
      ctx.lineTo(x + step, topY + step * 0.5);
      ctx.lineTo(x + step, topY);
      ctx.lineTo(x + w, topY);
      ctx.lineTo(x + w, layer.baseY);
      ctx.closePath();
      ctx.fill();

      // Lightning catch-rim on left tower edge
      ctx.strokeStyle = 'rgba(116, 206, 245, 0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, topY + step * 0.5);
      ctx.lineTo(x + 0.5, topY + h * 0.52);
      ctx.stroke();

      // Spire + red aviation beacon
      if (h > 215 && rng.next() > 0.35) {
        const ax = x + w * rng.range(0.35, 0.72);
        const ah = rng.range(18, 44);
        ctx.strokeStyle = 'rgba(118, 175, 215, 0.28)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(ax, topY);
        ctx.lineTo(ax, topY - ah);
        ctx.stroke();

        drawRadialGlow(ctx, ax, topY - ah, 0.5, 8, [
          [0, 'rgba(255, 94, 72, 0.88)'],
          [0.4, 'rgba(255, 50, 40, 0.26)'],
          [1, 'rgba(255, 40, 40, 0)'],
        ]);
      }

      // Micro window light bands (amber & cyan)
      if (rng.next() < layer.lightChance) {
        const cols = Math.max(2, Math.floor(w / 9));
        const rows = Math.max(4, Math.floor((h * 0.58) / 13));
        const warm = rng.next() > 0.32;
        for (let r = 0; r < rows; r++) {
          if (rng.next() > 0.44) continue;
          const wy = topY + 12 + r * 13;
          for (let c = 0; c < cols; c++) {
            if (rng.next() > 0.44) continue;
            const wx = x + 4 + c * ((w - 8) / cols);
            ctx.fillStyle = warm
              ? `rgba(255, ${rng.int(156, 212)}, 96, ${rng.range(0.24, 0.60)})`
              : `rgba(112, 228, 255, ${rng.range(0.20, 0.48)})`;
            ctx.fillRect(wx, wy, 3.4, 2.0);
          }
        }
      }
      ctx.restore();
    }
  }

  // Swirling atmospheric abyss mist washing over lower megacity
  const mist = ctx.createLinearGradient(0, 600, 0, 1030);
  mist.addColorStop(0.0, 'rgba(18, 34, 58, 0)');
  mist.addColorStop(0.35, 'rgba(16, 30, 52, 0.40)');
  mist.addColorStop(0.7, 'rgba(9, 15, 28, 0.74)');
  mist.addColorStop(1.0, 'rgba(4, 7, 14, 0.95)');
  ctx.fillStyle = mist;
  ctx.fillRect(0, 600, DESIGN_W, 430);
}

// ---------------------------------------------------------------------------
// 5. TOWERING BRUTALIST SUSPENSION PYLONS & SNAPPED WHIPPING CABLES
// ---------------------------------------------------------------------------
function drawBrutalistPylonsAndCables(ctx: CanvasRenderingContext2D, rng: Rng): void {
  // --- A. Distant Midground Suspension Pylon (ghosted in storm haze) ---
  ctx.save();
  ctx.globalAlpha = 0.55;
  const farGrad = ctx.createLinearGradient(280, 185, 360, 740);
  farGrad.addColorStop(0.0, '#14253d');
  farGrad.addColorStop(0.65, '#0e192b');
  farGrad.addColorStop(1.0, 'rgba(10, 16, 28, 0)');
  drawPolygon(
    ctx,
    [
      { x: 274, y: 196 },
      { x: 292, y: 196 },
      { x: 278, y: 740 },
      { x: 252, y: 740 },
    ],
    farGrad,
  );
  drawPolygon(
    ctx,
    [
      { x: 344, y: 204 },
      { x: 362, y: 204 },
      { x: 374, y: 740 },
      { x: 348, y: 740 },
    ],
    farGrad,
  );
  for (const by of [232, 342, 472]) {
    drawPolygon(
      ctx,
      [
        { x: 270, y: by },
        { x: 365, y: by + 6 },
        { x: 365, y: by + 24 },
        { x: 268, y: by + 18 },
      ],
      '#101d30',
    );
  }
  ctx.strokeStyle = 'rgba(134, 228, 255, 0.40)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(274, 196);
  ctx.lineTo(256, 620);
  ctx.moveTo(344, 204);
  ctx.lineTo(346, 580);
  ctx.stroke();
  ctx.restore();

  // --- B. Main Suspension Cables & Snapped Whipping Suspender Wires ---
  ctx.save();
  // Far catenary cable
  ctx.strokeStyle = 'rgba(14, 26, 44, 0.85)';
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  ctx.moveTo(86, 118);
  ctx.quadraticCurveTo(210, 315, 352, 210);
  ctx.stroke();

  // Near thick braided suspension cable
  ctx.strokeStyle = '#080e1a';
  ctx.lineWidth = 7.5;
  ctx.beginPath();
  ctx.moveTo(116, 70);
  ctx.bezierCurveTo(235, 252, 415, 385, 730, 232);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(122, 220, 255, 0.34)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(116, 67.5);
  ctx.bezierCurveTo(235, 249.5, 415, 382.5, 730, 229.5);
  ctx.stroke();

  // Intact vertical suspender cables on left stable section
  for (let i = 0; i < 4; i++) {
    const sx = 146 + i * 30;
    const topY = 118 + i * 36;
    const botY = 740 - i * 26;
    ctx.strokeStyle = 'rgba(10, 19, 32, 0.80)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(sx, topY);
    ctx.lineTo(sx - 6, botY);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(124, 220, 255, 0.24)';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(sx + 1, topY);
    ctx.lineTo(sx - 5, botY);
    ctx.stroke();
  }

  // Snapped steel cables whipping violently in the storm gale
  const snappedCables: Array<{
    p0: Vec2;
    c1: Vec2;
    c2: Vec2;
    p1: Vec2;
    w: number;
    spark: boolean;
  }> = [
    { p0: { x: 272, y: 238 }, c1: { x: 248, y: 350 }, c2: { x: 178, y: 410 }, p1: { x: 152, y: 495 }, w: 2.6, spark: true },
    { p0: { x: 312, y: 268 }, c1: { x: 286, y: 385 }, c2: { x: 326, y: 446 }, p1: { x: 262, y: 515 }, w: 2.3, spark: false },
    { p0: { x: 565, y: 300 }, c1: { x: 590, y: 425 }, c2: { x: 512, y: 535 }, p1: { x: 468, y: 608 }, w: 2.7, spark: true },
    { p0: { x: 642, y: 268 }, c1: { x: 676, y: 398 }, c2: { x: 618, y: 510 }, p1: { x: 582, y: 615 }, w: 2.4, spark: false },
    { p0: { x: 110, y: 205 }, c1: { x: 172, y: 288 }, c2: { x: 212, y: 256 }, p1: { x: 244, y: 332 }, w: 2.9, spark: true },
    { p0: { x: 696, y: 246 }, c1: { x: 710, y: 378 }, c2: { x: 648, y: 468 }, p1: { x: 626, y: 558 }, w: 2.1, spark: false },
  ];

  for (const sc of snappedCables) {
    ctx.strokeStyle = '#070c16';
    ctx.lineWidth = sc.w;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sc.p0.x, sc.p0.y);
    ctx.bezierCurveTo(sc.c1.x, sc.c1.y, sc.c2.x, sc.c2.y, sc.p1.x, sc.p1.y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(136, 222, 255, 0.30)';
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(sc.p0.x - 1, sc.p0.y);
    ctx.bezierCurveTo(sc.c1.x - 1, sc.c1.y, sc.c2.x - 1, sc.c2.y, sc.p1.x - 1, sc.p1.y);
    ctx.stroke();

    if (sc.spark) {
      drawRadialGlow(ctx, sc.p1.x, sc.p1.y, 1, 18, [
        [0.0, 'rgba(255, 248, 212, 0.96)'],
        [0.32, 'rgba(255, 154, 48, 0.65)'],
        [1.0, 'rgba(255, 90, 20, 0)'],
      ]);
      for (let f = 0; f < 4; f++) {
        const a = rng.range(0, Math.PI * 2);
        const l = rng.range(5, 13);
        ctx.strokeStyle = 'rgba(255, 208, 126, 0.78)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sc.p1.x, sc.p1.y);
        ctx.lineTo(sc.p1.x + Math.cos(a) * l, sc.p1.y + Math.sin(a) * l);
        ctx.stroke();
      }
    }
  }
  ctx.restore();

  // --- C. Hero Foreground-Left Brutalist Suspension Pylon ---
  ctx.save();
  const pylonGrad = ctx.createLinearGradient(0, 0, 145, 0);
  pylonGrad.addColorStop(0.0, '#040811');
  pylonGrad.addColorStop(0.68, '#0c1525');
  pylonGrad.addColorStop(1.0, '#192d47');

  drawPolygon(
    ctx,
    [
      { x: -18, y: 10 },
      { x: 96, y: 30 },
      { x: 126, y: 76 },
      { x: 110, y: 312 },
      { x: 130, y: 336 },
      { x: 102, y: 980 },
      { x: -24, y: 980 },
    ],
    pylonGrad,
  );

  // Recessed brutalist concrete channel
  drawPolygon(
    ctx,
    [
      { x: 18, y: 74 },
      { x: 74, y: 85 },
      { x: 64, y: 690 },
      { x: 8, y: 690 },
    ],
    '#060c17',
  );

  // Steel reinforcement collars
  for (const cy of [135, 245, 365, 495, 635]) {
    drawPolygon(
      ctx,
      [
        { x: -10, y: cy },
        { x: 118, y: cy + 16 },
        { x: 116, y: cy + 34 },
        { x: -10, y: cy + 18 },
      ],
      '#111d30',
    );
    ctx.strokeStyle = 'rgba(138, 230, 255, 0.36)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(8, cy + 2);
    ctx.lineTo(116, cy + 16);
    ctx.stroke();
  }

  // Cantilevered upper anchor arm
  drawPolygon(
    ctx,
    [
      { x: 94, y: 56 },
      { x: 160, y: 76 },
      { x: 156, y: 94 },
      { x: 90, y: 116 },
    ],
    '#0e1a2c',
  );

  // Crisp lightning cyan -> warm drop-ship rim light down pylon edge
  const rimGrad = ctx.createLinearGradient(0, 30, 0, 860);
  rimGrad.addColorStop(0.0, 'rgba(176, 244, 255, 0.85)');
  rimGrad.addColorStop(0.45, 'rgba(110, 216, 255, 0.54)');
  rimGrad.addColorStop(0.72, 'rgba(255, 168, 86, 0.42)');
  rimGrad.addColorStop(1.0, 'rgba(255, 130, 56, 0.04)');
  ctx.strokeStyle = rimGrad;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(96, 30);
  ctx.lineTo(126, 76);
  ctx.lineTo(110, 312);
  ctx.lineTo(130, 336);
  ctx.lineTo(106, 860);
  ctx.stroke();

  // Aviation strobe at pylon apex
  drawRadialGlow(ctx, 100, 34, 1.5, 26, [
    [0.0, 'rgba(255, 214, 200, 0.98)'],
    [0.2, 'rgba(255, 68, 48, 0.72)'],
    [0.55, 'rgba(255, 42, 28, 0.18)'],
    [1.0, 'rgba(255, 30, 20, 0)'],
  ]);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 6. SLEEK TACTICAL VTOL DROP-SHIP + TWIN DOWNWASH THRUSTERS + WARM RAMP
// ---------------------------------------------------------------------------
function drawThrusterPlume(
  ctx: CanvasRenderingContext2D,
  rng: Rng,
  nx: number,
  ny: number,
  angleRad: number,
  scale: number,
): void {
  ctx.save();
  ctx.translate(nx, ny);
  ctx.rotate(angleRad);
  ctx.globalCompositeOperation = 'lighter';

  // Soft wide atmospheric downwash spray (feathered layered cones — no hard polygon edges)
  for (let pass = 0; pass < 3; pass++) {
    const spread = (44 + pass * 26) * scale;
    const len = (210 + pass * 34) * scale;
    const a = 0.22 - pass * 0.06;
    const g = ctx.createLinearGradient(0, 0, 0, len);
    g.addColorStop(0.0, `rgba(112, 234, 255, ${a * 1.4})`);
    g.addColorStop(0.32, `rgba(52, 196, 248, ${a})`);
    g.addColorStop(0.68, `rgba(255, 152, 68, ${a * 0.55})`);
    g.addColorStop(1.0, 'rgba(255, 110, 36, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-12 * scale, 0);
    ctx.lineTo(12 * scale, 0);
    ctx.lineTo(spread, len);
    ctx.lineTo(-spread, len);
    ctx.closePath();
    ctx.fill();
  }

  // Intense superheated plasma core jet
  const jetLen = 138 * scale;
  const jetG = ctx.createLinearGradient(0, 0, 0, jetLen);
  jetG.addColorStop(0.0, 'rgba(246, 255, 255, 0.98)');
  jetG.addColorStop(0.22, 'rgba(126, 242, 255, 0.86)');
  jetG.addColorStop(0.58, 'rgba(42, 182, 248, 0.34)');
  jetG.addColorStop(1.0, 'rgba(24, 130, 215, 0)');
  ctx.fillStyle = jetG;
  ctx.beginPath();
  ctx.moveTo(-10 * scale, 0);
  ctx.lineTo(10 * scale, 0);
  ctx.lineTo(20 * scale, jetLen);
  ctx.lineTo(-20 * scale, jetLen);
  ctx.closePath();
  ctx.fill();

  // Soft radial Mach shock nodes inside the plasma core
  for (let d = 0; d < 3; d++) {
    const dy = (20 + d * 25) * scale;
    const rx = (11 - d * 2.2) * scale;
    const ry = (15 - d * 2.5) * scale;
    ctx.save();
    ctx.translate(0, dy);
    ctx.scale(1, ry / rx);
    const sg = ctx.createRadialGradient(0, 0, 1, 0, 0, rx);
    sg.addColorStop(0.0, `rgba(245, 255, 255, ${0.72 - d * 0.2})`);
    sg.addColorStop(0.55, `rgba(110, 236, 255, ${0.32 - d * 0.08})`);
    sg.addColorStop(1.0, 'rgba(40, 180, 255, 0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Nozzle bloom
  const coreG = ctx.createRadialGradient(0, 4 * scale, 2, 0, 4 * scale, 56 * scale);
  coreG.addColorStop(0.0, 'rgba(255, 255, 255, 0.98)');
  coreG.addColorStop(0.28, 'rgba(118, 238, 255, 0.68)');
  coreG.addColorStop(0.62, 'rgba(255, 168, 76, 0.20)');
  coreG.addColorStop(1.0, 'rgba(255, 120, 40, 0)');
  ctx.fillStyle = coreG;
  ctx.beginPath();
  ctx.arc(0, 4 * scale, 56 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Turbulent downwash vapor clouds illuminated by cyan + amber
  for (let i = 0; i < 8; i++) {
    const py = rng.range(78, 215) * scale;
    const px = rng.range(-56, 56) * scale;
    const pr = rng.range(20, 48) * scale;
    const puffG = ctx.createRadialGradient(px, py, 2, px, py, pr);
    const isWarm = i % 2 === 0;
    puffG.addColorStop(
      0.0,
      isWarm ? 'rgba(255, 174, 92, 0.14)' : 'rgba(104, 226, 255, 0.16)',
    );
    puffG.addColorStop(1.0, 'rgba(40, 80, 120, 0)');
    ctx.fillStyle = puffG;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawVtolDropShip(ctx: CanvasRenderingContext2D, rng: Rng): void {
  // --- A. Volumetric Feathered Golden Ramp Light Shafts (3 soft nested cones) ---
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const beamPasses = [
    { spread: 1.0, alpha: 0.34, len: 235 },
    { spread: 1.45, alpha: 0.18, len: 275 },
    { spread: 2.0, alpha: 0.09, len: 315 },
  ];
  for (const bp of beamPasses) {
    const g = ctx.createLinearGradient(444, 388, 300, 388 + bp.len);
    g.addColorStop(0.0, `rgba(255, 228, 158, ${bp.alpha})`);
    g.addColorStop(0.35, `rgba(255, 158, 56, ${bp.alpha * 0.56})`);
    g.addColorStop(0.75, `rgba(232, 92, 26, ${bp.alpha * 0.18})`);
    g.addColorStop(1.0, 'rgba(200, 62, 16, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(410, 376);
    ctx.lineTo(476, 404);
    ctx.lineTo(430 - 38 * bp.spread + 30 * bp.spread, 388 + bp.len);
    ctx.lineTo(318 - 62 * bp.spread, 355 + bp.len * 0.88);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // --- B. Far Starboard VTOL Nacelle & Downwash Plume ---
  drawThrusterPlume(ctx, rng, 604, 396, 0.15, 0.82);

  // Swept starboard stub wing
  drawPolygon(
    ctx,
    [
      { x: 540, y: 334 },
      { x: 626, y: 340 },
      { x: 634, y: 356 },
      { x: 548, y: 354 },
    ],
    '#0d1828',
  );
  // Starboard armored thruster pod
  drawPolygon(
    ctx,
    [
      { x: 594, y: 332 },
      { x: 636, y: 338 },
      { x: 628, y: 396 },
      { x: 584, y: 390 },
    ],
    '#142338',
    'rgba(118, 214, 255, 0.28)',
    1.0,
  );

  // --- C. Sleek Canted Twin Tail Stabilizers ---
  drawPolygon(
    ctx,
    [
      { x: 422, y: 332 },
      { x: 374, y: 274 },
      { x: 400, y: 272 },
      { x: 462, y: 326 },
    ],
    '#0e1a2c',
    'rgba(148, 232, 255, 0.42)',
    1.1,
  );
  drawPolygon(
    ctx,
    [
      { x: 468, y: 322 },
      { x: 444, y: 278 },
      { x: 464, y: 278 },
      { x: 498, y: 318 },
    ],
    '#16263e',
  );

  // --- D. Low-Slung Angular Stealth Fuselage (Titanfall / Pelican silhouette) ---
  // Upper faceted dorsal armor spine
  const dorsalGrad = ctx.createLinearGradient(408, 308, 675, 368);
  dorsalGrad.addColorStop(0.0, '#243c5b');
  dorsalGrad.addColorStop(0.45, '#182b44');
  dorsalGrad.addColorStop(1.0, '#0d1829');
  drawPolygon(
    ctx,
    [
      { x: 406, y: 338 },
      { x: 468, y: 314 },
      { x: 584, y: 312 },
      { x: 668, y: 344 },
      { x: 688, y: 360 },
      { x: 616, y: 374 },
      { x: 464, y: 366 },
    ],
    dorsalGrad,
  );

  // Side stealth bevel facet (mid-tone metallic blue-slate)
  const sideGrad = ctx.createLinearGradient(410, 354, 682, 386);
  sideGrad.addColorStop(0.0, '#2c2329');
  sideGrad.addColorStop(0.35, '#152236');
  sideGrad.addColorStop(1.0, '#09101c');
  drawPolygon(
    ctx,
    [
      { x: 406, y: 338 },
      { x: 464, y: 366 },
      { x: 616, y: 374 },
      { x: 688, y: 360 },
      { x: 664, y: 384 },
      { x: 572, y: 400 },
      { x: 472, y: 398 },
      { x: 404, y: 376 },
    ],
    sideGrad,
  );

  // Chin sensor / gun pod under sleek nose
  drawPolygon(
    ctx,
    [
      { x: 626, y: 382 },
      { x: 662, y: 378 },
      { x: 656, y: 392 },
      { x: 622, y: 392 },
    ],
    '#0a1220',
  );
  // Nose sensor glint
  drawRadialGlow(ctx, 658, 384, 0.5, 9, [
    [0.0, 'rgba(255, 198, 120, 0.9)'],
    [0.5, 'rgba(255, 120, 40, 0.3)'],
    [1.0, 'rgba(255, 80, 20, 0)'],
  ]);

  // Angular armored cockpit visor (glinting cyan)
  drawPolygon(
    ctx,
    [
      { x: 604, y: 324 },
      { x: 658, y: 344 },
      { x: 644, y: 356 },
      { x: 590, y: 344 },
    ],
    '#255d82',
    'rgba(168, 242, 255, 0.78)',
    1.1,
  );
  // Cockpit canopy specular reflections
  ctx.strokeStyle = 'rgba(232, 252, 255, 0.88)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(612, 329);
  ctx.lineTo(646, 343);
  ctx.stroke();

  // Panel seams, intake vents & tactical amber squad markings
  ctx.strokeStyle = 'rgba(6, 11, 20, 0.78)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(486, 314);
  ctx.lineTo(472, 366);
  ctx.moveTo(558, 313);
  ctx.lineTo(548, 370);
  ctx.moveTo(464, 366);
  ctx.lineTo(616, 374);
  ctx.stroke();

  // Amber tactical chevron stripe on dorsal armor
  drawPolygon(
    ctx,
    [
      { x: 512, y: 330 },
      { x: 548, y: 330 },
      { x: 542, y: 338 },
      { x: 506, y: 338 },
    ],
    'rgba(245, 140, 48, 0.82)',
  );
  drawPolygon(
    ctx,
    [
      { x: 554, y: 330 },
      { x: 564, y: 330 },
      { x: 558, y: 338 },
      { x: 548, y: 338 },
    ],
    'rgba(245, 140, 48, 0.82)',
  );

  // --- E. Warmly Lit Open Rear Boarding Bay & Hydraulic Ramp ---
  const bayGrad = ctx.createLinearGradient(412, 348, 470, 394);
  bayGrad.addColorStop(0.0, '#fff9e4');
  bayGrad.addColorStop(0.34, '#ffc462');
  bayGrad.addColorStop(0.78, '#e86f1e');
  bayGrad.addColorStop(1.0, '#72240a');
  drawPolygon(
    ctx,
    [
      { x: 412, y: 348 },
      { x: 468, y: 358 },
      { x: 466, y: 394 },
      { x: 408, y: 378 },
    ],
    bayGrad,
  );

  // Interior cabin structural ribs (subtle perspective inside glowing bay)
  ctx.strokeStyle = 'rgba(130, 52, 14, 0.42)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(432, 352);
  ctx.lineTo(430, 384);
  ctx.moveTo(450, 355);
  ctx.lineTo(448, 389);
  ctx.stroke();

  // Organic silhouetted crewmember leaning out of the glowing bay reaching a hand down
  ctx.fillStyle = 'rgba(28, 13, 10, 0.90)';
  ctx.beginPath();
  ctx.moveTo(445, 390);
  ctx.lineTo(446, 374);
  ctx.quadraticCurveTo(446, 366, 452, 364); // helmeted head
  ctx.quadraticCurveTo(458, 364, 459, 372); // shoulder
  ctx.lineTo(460, 392);
  ctx.closePath();
  ctx.fill();
  // Outstretched arm reaching toward the runner
  ctx.beginPath();
  ctx.moveTo(448, 373);
  ctx.quadraticCurveTo(438, 376, 426, 382);
  ctx.lineTo(427, 386);
  ctx.quadraticCurveTo(439, 381, 450, 379);
  ctx.closePath();
  ctx.fill();

  // Lowered hydraulic boarding ramp tailgate extending down-left
  const rampGrad = ctx.createLinearGradient(412, 378, 372, 418);
  rampGrad.addColorStop(0.0, '#ffbd56');
  rampGrad.addColorStop(0.45, '#5a321e');
  rampGrad.addColorStop(1.0, '#141d2e');
  drawPolygon(
    ctx,
    [
      { x: 408, y: 378 },
      { x: 466, y: 394 },
      { x: 422, y: 422 },
      { x: 368, y: 404 },
    ],
    rampGrad,
    'rgba(255, 212, 128, 0.78)',
    1.3,
  );
  // Hydraulic side struts holding the ramp
  ctx.strokeStyle = 'rgba(255, 198, 112, 0.55)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(412, 360);
  ctx.lineTo(384, 402);
  ctx.moveTo(466, 374);
  ctx.lineTo(440, 410);
  ctx.stroke();

  // Warm cabin bloom halo
  drawRadialGlow(ctx, 438, 374, 4, 96, [
    [0.0, 'rgba(255, 244, 204, 0.76)'],
    [0.26, 'rgba(255, 170, 64, 0.38)'],
    [0.62, 'rgba(238, 98, 28, 0.14)'],
    [1.0, 'rgba(200, 62, 14, 0)'],
  ]);

  // --- F. Near Port Wing & Articulated VTOL Thruster Pod ---
  // Port downwash plume
  drawThrusterPlume(ctx, rng, 514, 416, 0.13, 1.04);

  // Swept armored stub wing
  drawPolygon(
    ctx,
    [
      { x: 492, y: 342 },
      { x: 556, y: 346 },
      { x: 544, y: 370 },
      { x: 486, y: 362 },
    ],
    '#1e324e',
    'rgba(146, 230, 255, 0.44)',
    1.1,
  );

  // Heavy articulated port VTOL engine nacelle
  const podGrad = ctx.createLinearGradient(490, 340, 548, 416);
  podGrad.addColorStop(0.0, '#294466');
  podGrad.addColorStop(0.5, '#16263d');
  podGrad.addColorStop(1.0, '#0a1220');
  drawPolygon(
    ctx,
    [
      { x: 498, y: 342 },
      { x: 548, y: 348 },
      { x: 552, y: 376 },
      { x: 536, y: 416 },
      { x: 492, y: 410 },
      { x: 488, y: 372 },
    ],
    podGrad,
  );
  // Nacelle top intake louver
  drawPolygon(
    ctx,
    [
      { x: 504, y: 350 },
      { x: 540, y: 354 },
      { x: 536, y: 366 },
      { x: 500, y: 362 },
    ],
    '#070e1b',
  );
  // Superheated cyan nozzle lip glow
  ctx.strokeStyle = 'rgba(170, 248, 255, 0.95)';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(494, 411);
  ctx.lineTo(534, 416);
  ctx.stroke();

  // Sharp lightning cyan rim along dorsal spine
  ctx.strokeStyle = 'rgba(172, 242, 255, 0.78)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(374, 274);
  ctx.lineTo(422, 332);
  ctx.lineTo(468, 314);
  ctx.lineTo(584, 312);
  ctx.lineTo(668, 344);
  ctx.stroke();

  // Navigation strobes
  drawRadialGlow(ctx, 380, 278, 1, 16, [
    [0.0, 'rgba(255, 212, 200, 0.95)'],
    [0.3, 'rgba(255, 62, 48, 0.65)'],
    [1.0, 'rgba(255, 30, 20, 0)'],
  ]);
  drawRadialGlow(ctx, 682, 358, 1, 15, [
    [0.0, 'rgba(235, 255, 255, 0.95)'],
    [0.35, 'rgba(92, 232, 255, 0.55)'],
    [1.0, 'rgba(40, 180, 255, 0)'],
  ]);
}

// ---------------------------------------------------------------------------
// 7. MONUMENTAL FRACTURING SKYBRIDGE DECK & COLLAPSING DEBRIS
// ---------------------------------------------------------------------------
function drawCollapsingBridge(ctx: CanvasRenderingContext2D, rng: Rng): void {
  // --- A. Far Collapsed Bridge Stub (plunging away on right) ---
  ctx.save();
  const farStubGrad = ctx.createLinearGradient(570, 725, 720, 865);
  farStubGrad.addColorStop(0.0, '#142033');
  farStubGrad.addColorStop(1.0, '#070b14');
  drawPolygon(
    ctx,
    [
      { x: 596, y: 768 },
      { x: 736, y: 716 },
      { x: 736, y: 815 },
      { x: 572, y: 834 },
      { x: 582, y: 792 },
    ],
    farStubGrad,
  );
  ctx.strokeStyle = 'rgba(255, 178, 98, 0.34)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(596, 768);
  ctx.lineTo(732, 718);
  ctx.stroke();
  ctx.restore();

  // --- B. Main Foreground/Midground Monumental Collapsing Skybridge ---
  // Bold wide foreshortened highway deck sweeping from bottom-left up to the jagged shear at (342, 650)
  // 1. Massive steel box-girder underside plunging into abyssal darkness
  const underGrad = ctx.createLinearGradient(0, 720, 340, 1120);
  underGrad.addColorStop(0.0, '#0d1728');
  underGrad.addColorStop(0.52, '#070c17');
  underGrad.addColorStop(1.0, '#03060c');
  drawPolygon(
    ctx,
    [
      { x: -24, y: 970 },
      { x: 344, y: 668 },
      { x: 332, y: 724 },
      { x: 288, y: 760 },
      { x: 256, y: 825 },
      { x: 196, y: 900 },
      { x: 132, y: 1005 },
      { x: 72, y: 1125 },
      { x: -24, y: 1145 },
    ],
    underGrad,
  );

  // Heavy steel I-beam cross-trusses under deck
  ctx.save();
  ctx.strokeStyle = '#172840';
  ctx.lineWidth = 4.2;
  const trussTop: Vec2[] = [
    { x: 10, y: 958 },
    { x: 88, y: 886 },
    { x: 164, y: 816 },
    { x: 238, y: 750 },
    { x: 306, y: 692 },
  ];
  const trussBot: Vec2[] = [
    { x: 64, y: 1038 },
    { x: 136, y: 955 },
    { x: 204, y: 874 },
    { x: 264, y: 798 },
    { x: 320, y: 724 },
  ];
  for (let i = 0; i < trussTop.length - 1; i++) {
    ctx.beginPath();
    ctx.moveTo(trussTop[i].x, trussTop[i].y);
    ctx.lineTo(trussBot[i].x, trussBot[i].y);
    ctx.lineTo(trussTop[i + 1].x, trussTop[i + 1].y);
    ctx.stroke();
  }
  // Subtle lower chord beam
  ctx.strokeStyle = '#111e32';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(trussBot[0].x, trussBot[0].y);
  for (let i = 1; i < trussBot.length; i++) {
    ctx.lineTo(trussBot[i].x, trussBot[i].y);
  }
  ctx.stroke();
  ctx.restore();

  // 2. Wide, rain-slicked concrete & asphalt roadway surface
  const deckGrad = ctx.createLinearGradient(-15, 935, 355, 642);
  deckGrad.addColorStop(0.0, '#09101c');
  deckGrad.addColorStop(0.42, '#132136');
  deckGrad.addColorStop(0.80, '#223248');
  deckGrad.addColorStop(1.0, '#3e3538');
  drawPolygon(
    ctx,
    [
      { x: -24, y: 838 },
      { x: 256, y: 622 },
      { x: 294, y: 628 },
      { x: 318, y: 640 },
      { x: 348, y: 652 },
      { x: 336, y: 678 },
      { x: -24, y: 982 },
    ],
    deckGrad,
  );

  // Warm golden drop-ship ramp reflection across wet asphalt near the leap lip
  const warmSheen = ctx.createLinearGradient(195, 705, 344, 648);
  warmSheen.addColorStop(0.0, 'rgba(255, 165, 72, 0)');
  warmSheen.addColorStop(0.5, 'rgba(255, 165, 72, 0.26)');
  warmSheen.addColorStop(1.0, 'rgba(255, 226, 152, 0.58)');
  drawPolygon(
    ctx,
    [
      { x: 165, y: 735 },
      { x: 290, y: 628 },
      { x: 346, y: 652 },
      { x: 235, y: 762 },
    ],
    warmSheen,
  );

  // Cool cyan lightning reflection across mid-deck wet asphalt
  const cyanSheen = ctx.createLinearGradient(18, 865, 240, 682);
  cyanSheen.addColorStop(0.0, 'rgba(92, 212, 255, 0)');
  cyanSheen.addColorStop(0.5, 'rgba(92, 212, 255, 0.24)');
  cyanSheen.addColorStop(1.0, 'rgba(92, 212, 255, 0)');
  drawPolygon(
    ctx,
    [
      { x: -5, y: 878 },
      { x: 218, y: 670 },
      { x: 254, y: 690 },
      { x: 48, y: 912 },
    ],
    cyanSheen,
  );

  // Foreshortened dashed yellow/amber lane markings
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 200, 94, 0.50)';
  const dashes = [
    [0.06, 0.17],
    [0.25, 0.38],
    [0.47, 0.60],
    [0.69, 0.83],
  ];
  for (const [t0, t1] of dashes) {
    const x0 = -12 + 322 * t0;
    const y0 = 908 - 258 * t0;
    const x1 = -12 + 322 * t1;
    const y1 = 908 - 258 * t1;
    ctx.lineWidth = 4.6 * (1 - t0 * 0.55);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  ctx.restore();

  // Left concrete Jersey parapet wall & snapped tilted highway light pole
  drawPolygon(
    ctx,
    [
      { x: -24, y: 808 },
      { x: 254, y: 608 },
      { x: 266, y: 620 },
      { x: -24, y: 842 },
    ],
    '#0d1727',
  );
  ctx.strokeStyle = 'rgba(142, 230, 255, 0.56)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-14, 804);
  ctx.lineTo(254, 608);
  ctx.stroke();

  // Tilted broken bridge lamppost on left barrier (scale & storytelling cue)
  ctx.save();
  ctx.strokeStyle = '#0c1626';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(86, 730);
  ctx.lineTo(66, 636);
  ctx.lineTo(106, 616);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(140, 228, 255, 0.45)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(87, 730);
  ctx.lineTo(67, 636);
  ctx.lineTo(106, 615);
  ctx.stroke();
  // Flickering dying amber streetlight glow
  drawRadialGlow(ctx, 106, 618, 1, 22, [
    [0.0, 'rgba(255, 232, 178, 0.85)'],
    [0.35, 'rgba(255, 162, 64, 0.35)'],
    [1.0, 'rgba(255, 110, 30, 0)'],
  ]);
  ctx.restore();

  // Deep structural fractures splitting across the concrete deck
  ctx.save();
  ctx.strokeStyle = '#04070e';
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(138, 725);
  ctx.lineTo(168, 748);
  ctx.lineTo(158, 774);
  ctx.lineTo(194, 804);
  ctx.moveTo(218, 666);
  ctx.lineTo(252, 682);
  ctx.lineTo(244, 708);
  ctx.lineTo(282, 724);
  ctx.stroke();
  // Glowing shear spark inside main crack
  ctx.strokeStyle = 'rgba(255, 142, 48, 0.68)';
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(248, 684);
  ctx.lineTo(244, 708);
  ctx.lineTo(280, 723);
  ctx.stroke();
  ctx.restore();

  // --- C. Detached Crumbling Concrete Lip + Smoke + Exposed Rebar Sparks ---
  // Dusty concrete collapse plume billowing beneath the break
  for (let s = 0; s < 5; s++) {
    const sx = 285 + s * 22 + rng.range(-10, 10);
    const sy = 678 + s * 10 + rng.range(-8, 10);
    const sr = rng.range(24, 48);
    drawRadialGlow(
      ctx,
      sx,
      sy,
      2,
      sr,
      [
        [0.0, 'rgba(56, 46, 52, 0.45)'],
        [0.55, 'rgba(26, 32, 46, 0.24)'],
        [1.0, 'rgba(12, 18, 30, 0)'],
      ],
      'source-over',
    );
  }

  // Tilting concrete launch slab cracking away right behind the runner
  drawPolygon(
    ctx,
    [
      { x: 314, y: 642 },
      { x: 360, y: 648 },
      { x: 368, y: 672 },
      { x: 334, y: 688 },
      { x: 304, y: 670 },
    ],
    '#1d283b',
    'rgba(255, 202, 122, 0.64)',
    1.3,
  );

  // Bent steel rebar rods jutting from the sheared concrete face
  const rebarTips: Vec2[] = [];
  for (let r = 0; r < 12; r++) {
    const rx = 276 + r * 7.5 + rng.range(-3, 3);
    const ry = 668 + (r % 3) * 14 + rng.range(-4, 6);
    const ex = rx + rng.range(18, 48);
    const ey = ry + rng.range(4, 24);
    ctx.strokeStyle = '#0c1320';
    ctx.lineWidth = rng.range(1.6, 2.8);
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.quadraticCurveTo((rx + ex) * 0.5, ry - rng.range(2, 10), ex, ey);
    ctx.stroke();

    ctx.strokeStyle = r % 2 === 0 ? 'rgba(255, 170, 82, 0.68)' : 'rgba(128, 224, 255, 0.46)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(rx, ry - 0.8);
    ctx.quadraticCurveTo((rx + ex) * 0.5, ry - rng.range(2, 10) - 0.8, ex, ey - 0.8);
    ctx.stroke();

    if (r % 3 === 0) {
      rebarTips.push({ x: ex, y: ey });
    }
  }

  for (const tip of rebarTips) {
    drawRadialGlow(ctx, tip.x, tip.y, 1, 22, [
      [0.0, 'rgba(255, 248, 212, 0.96)'],
      [0.3, 'rgba(255, 148, 42, 0.68)'],
      [1.0, 'rgba(255, 76, 18, 0)'],
    ]);
  }

  // --- D. Tumbling 3D Faceted Concrete & Steel Debris Chunks Falling Into Abyss ---
  const debrisCount = 26;
  for (let i = 0; i < debrisCount; i++) {
    const t = i / (debrisCount - 1);
    const dx = 238 + t * 265 + rng.range(-52, 52);
    const dy = 676 + t * 295 + rng.range(-26, 40);
    const size = rng.range(9, 36) * (1 - t * 0.24);
    const rot = rng.range(0, Math.PI * 2);

    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(rot);

    // Shadowed underside facet
    const pts: Vec2[] = [
      { x: -size * 0.68, y: -size * 0.34 },
      { x: size * 0.46, y: -size * 0.54 },
      { x: size * 0.74, y: size * 0.14 },
      { x: size * 0.18, y: size * 0.58 },
      { x: -size * 0.54, y: size * 0.36 },
    ];
    const shade = Math.floor(rng.range(10, 24));
    drawPolygon(ctx, pts, `rgb(${shade}, ${shade + 7}, ${shade + 18})`);

    // Lit top concrete bevel plane
    drawPolygon(
      ctx,
      [pts[0], pts[1], pts[2], { x: 0, y: 0 }],
      dx > 330 && dy < 830
        ? `rgba(${shade + 42}, ${shade + 30}, ${shade + 26}, 0.85)`
        : `rgba(${shade + 16}, ${shade + 28}, ${shade + 44}, 0.85)`,
    );

    // Rim catch edge
    ctx.strokeStyle =
      dx > 335 && dy < 830
        ? `rgba(255, 182, 96, ${rng.range(0.35, 0.72)})`
        : `rgba(118, 218, 255, ${rng.range(0.24, 0.54)})`;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.stroke();
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// 8. HERO SILHOUETTED RUNNER (ATHLETIC MID-AIR LEAP, BILLOWING COAT, VISOR)
// ---------------------------------------------------------------------------
function drawHeroRunner(ctx: CanvasRenderingContext2D): void {
  // Positioned mid-vault launching off the collapsing lip toward the glowing ramp
  ctx.save();
  ctx.translate(352, 566);
  ctx.scale(1.08, 1.08);

  // Kicked-up launch spray & ember burst behind the trailing boot
  drawRadialGlow(ctx, -56, 64, 2, 38, [
    [0.0, 'rgba(255, 198, 122, 0.46)'],
    [0.48, 'rgba(130, 196, 232, 0.18)'],
    [1.0, 'rgba(40, 70, 100, 0)'],
  ]);

  // --- A. Layered Wind-Whipped Tactical Coat / Cape (flowing back in gale) ---
  // Back inner coat panel (darker depth layer)
  ctx.fillStyle = '#050912';
  ctx.beginPath();
  ctx.moveTo(-2, -46);
  ctx.bezierCurveTo(-34, -44, -72, -16, -112, 16);
  ctx.quadraticCurveTo(-82, 26, -54, 18);
  ctx.quadraticCurveTo(-24, 14, -4, 4);
  ctx.closePath();
  ctx.fill();

  // Main billowing tactical trench-cape
  const coatGrad = ctx.createLinearGradient(-126, -34, 10, 26);
  coatGrad.addColorStop(0.0, '#070d1a');
  coatGrad.addColorStop(0.55, '#0e182c');
  coatGrad.addColorStop(1.0, '#221a26');
  ctx.fillStyle = coatGrad;
  ctx.beginPath();
  ctx.moveTo(2, -48); // high collar wrap
  ctx.bezierCurveTo(-30, -58, -74, -42, -124, -18); // upper wind crest
  ctx.lineTo(-108, -6); // wind-torn notch
  ctx.lineTo(-132, 10); // whipping tail tip
  ctx.bezierCurveTo(-98, 20, -74, 8, -90, 32); // lower billowing hem
  ctx.bezierCurveTo(-60, 34, -32, 14, -6, 6); // return to waist
  ctx.closePath();
  ctx.fill();

  // Sculptural fabric fold highlights inside coat
  ctx.strokeStyle = 'rgba(34, 62, 96, 0.52)';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(-14, -42);
  ctx.bezierCurveTo(-50, -34, -80, -18, -114, -10);
  ctx.stroke();

  // Crisp lightning cyan rim on windward top crest of coat
  ctx.strokeStyle = 'rgba(156, 240, 255, 0.86)';
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(-2, -49);
  ctx.bezierCurveTo(-32, -58, -74, -42, -122, -18);
  ctx.stroke();

  // Warm drop-ship amber bounce rim on lower coat hem
  ctx.strokeStyle = 'rgba(255, 190, 96, 0.72)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-128, 10);
  ctx.bezierCurveTo(-96, 20, -74, 8, -88, 31);
  ctx.stroke();

  // --- B. Athletic Sculpted Tactical Runner Silhouette ---
  const bodyColor = '#060a13';
  ctx.fillStyle = bodyColor;

  // Back arm (swept back for explosive vault balance, bent at elbow)
  ctx.beginPath();
  ctx.moveTo(-6, -40);
  ctx.quadraticCurveTo(-24, -30, -38, -24); // upper arm + elbow
  ctx.lineTo(-56, -12); // forearm
  ctx.lineTo(-52, -5); // gloved hand
  ctx.lineTo(-32, -14); // inner elbow
  ctx.quadraticCurveTo(-18, -18, -2, -26);
  ctx.closePath();
  ctx.fill();

  // Trailing leg (fully extended athletic push-off with defined quad, calf, & combat boot)
  ctx.beginPath();
  ctx.moveTo(-10, -4); // hip
  ctx.quadraticCurveTo(-26, 16, -38, 32); // hamstring
  ctx.quadraticCurveTo(-48, 44, -60, 58); // calf & Achilles
  ctx.lineTo(-74, 62); // boot heel
  ctx.lineTo(-70, 69); // thick treaded boot sole
  ctx.lineTo(-50, 64); // boot toe pushing off
  ctx.quadraticCurveTo(-36, 48, -24, 34); // shin & knee pad
  ctx.quadraticCurveTo(-10, 20, 4, 4); // front quad
  ctx.closePath();
  ctx.fill();

  // Muscular forward-leaning torso with armored tactical chest rig & shoulder pauldron
  ctx.beginPath();
  ctx.moveTo(-12, -4); // pelvis
  ctx.quadraticCurveTo(-16, -24, -6, -46); // arched back
  ctx.lineTo(14, -50); // broad armored shoulder pauldron
  ctx.quadraticCurveTo(24, -34, 16, -14); // tactical vest chest
  ctx.lineTo(8, 4); // tapered waist/hip
  ctx.closePath();
  ctx.fill();

  // Lead leg (explosive high knee drive forward, sculpted thigh + armored shin + boot)
  ctx.beginPath();
  ctx.moveTo(4, -6); // hip
  ctx.quadraticCurveTo(26, -4, 40, 8); // powerful raised quad
  ctx.quadraticCurveTo(44, 14, 36, 24); // knee guard
  ctx.quadraticCurveTo(28, 38, 22, 52); // armored shin
  ctx.lineTo(34, 57); // combat boot toe
  ctx.lineTo(28, 64); // boot sole
  ctx.lineTo(12, 56); // boot heel
  ctx.quadraticCurveTo(16, 38, 22, 24); // muscular calf
  ctx.quadraticCurveTo(10, 14, -4, 6); // inner thigh
  ctx.closePath();
  ctx.fill();

  // Lead arm (reaching dynamically upward toward the drop-ship ramp, natural bent forearm & open reaching hand)
  ctx.beginPath();
  ctx.moveTo(10, -48); // shoulder
  ctx.quadraticCurveTo(26, -54, 38, -60); // deltoid & bicep
  ctx.lineTo(54, -74); // forearm reaching up-right
  ctx.lineTo(61, -76); // reaching fingertips
  ctx.lineTo(59, -68); // palm
  ctx.lineTo(44, -52); // wrist/forearm underside
  ctx.quadraticCurveTo(28, -42, 16, -34); // tricep
  ctx.closePath();
  ctx.fill();

  // Sculpted tactical helmet (angled up looking straight at the open ramp)
  ctx.beginPath();
  ctx.moveTo(4, -50);
  ctx.quadraticCurveTo(2, -66, 13, -71); // helmet crown
  ctx.quadraticCurveTo(26, -74, 31, -63); // brow & angled faceplate
  ctx.quadraticCurveTo(32, -54, 22, -49); // respirator chin guard
  ctx.lineTo(8, -47);
  ctx.closePath();
  ctx.fill();

  // --- C. Crisp Dual-Source Rim Lighting on Runner ---
  // Warm golden-amber key light from the drop-ship boarding ramp along front/upper edges
  ctx.strokeStyle = 'rgba(255, 218, 138, 0.94)';
  ctx.lineWidth = 2.0;
  ctx.lineCap = 'round';
  ctx.beginPath();
  // Helmet brow
  ctx.moveTo(15, -70);
  ctx.quadraticCurveTo(27, -72, 31, -62);
  // Reaching lead arm & shoulder edge
  ctx.moveTo(14, -49);
  ctx.quadraticCurveTo(28, -55, 58, -75);
  // Lead thigh, knee & shin front edge
  ctx.moveTo(14, -3);
  ctx.quadraticCurveTo(32, 1, 40, 11);
  ctx.lineTo(34, 24);
  ctx.lineTo(24, 48);
  ctx.stroke();

  // Cool electric cyan lightning rim on back of helmet, spine, & trailing leg
  ctx.strokeStyle = 'rgba(146, 236, 255, 0.80)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(5, -63);
  ctx.quadraticCurveTo(6, -69, 13, -71);
  ctx.moveTo(-11, -10);
  ctx.quadraticCurveTo(-30, 20, -60, 58);
  ctx.stroke();

  // --- D. Razor-Sharp Glowing Cyan Visor Accent ---
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = '#e4ffff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(19, -63);
  ctx.lineTo(30, -61);
  ctx.stroke();
  ctx.restore();

  drawRadialGlow(ctx, 25, -62, 1, 17, [
    [0.0, 'rgba(225, 255, 255, 0.96)'],
    [0.35, 'rgba(84, 230, 255, 0.56)'],
    [1.0, 'rgba(28, 168, 240, 0)'],
  ]);

  ctx.restore();
}

// ---------------------------------------------------------------------------
// 9. WIND-DRIVEN RAIN, GLOWING EMBERS/SPARKS & ATMOSPHERIC FINISHING
// ---------------------------------------------------------------------------
function drawRainAndEmbers(ctx: CanvasRenderingContext2D, rng: Rng): void {
  // Diagonal wind-driven rain streaks catching both cyan lightning and warm ramp light
  ctx.save();
  ctx.lineCap = 'round';
  const rainCount = 260;
  for (let i = 0; i < rainCount; i++) {
    const x = rng.range(-40, DESIGN_W + 80);
    const y = rng.range(-40, DESIGN_H * 0.88);
    const depth = rng.next();
    const len = 18 + depth * 46;
    const dx = -len * 0.34;
    const dy = len;

    const inWarmCone = x > 265 && x < 515 && y > 350 && y < 635;
    const alpha = (0.06 + depth * 0.20) * (y > 900 ? 0.32 : 1.0);
    ctx.strokeStyle = inWarmCone
      ? `rgba(255, 214, 152, ${alpha * 1.4})`
      : `rgba(174, 226, 255, ${alpha})`;
    ctx.lineWidth = 0.6 + depth * 0.85;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y + dy);
    ctx.stroke();
  }
  ctx.restore();

  // Glowing orange sparks & wind-swept embers from shearing rebar
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  const emberCount = 86;
  for (let i = 0; i < emberCount; i++) {
    const fromShear = i < 58;
    const x = fromShear ? rng.range(165, 495) : rng.range(40, 680);
    const y = fromShear ? rng.range(525, 895) : rng.range(360, 940);
    const len = rng.range(5, 22);
    const angle = rng.range(2.05, 2.55);
    const ex = x + Math.cos(angle) * len;
    const ey = y + Math.sin(angle) * len;
    const intensity = rng.range(0.45, 0.98);

    ctx.strokeStyle = `rgba(255, 112, 28, ${intensity * 0.55})`;
    ctx.lineWidth = rng.range(2.3, 4.2);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 238, 178, ${intensity})`;
    ctx.lineWidth = rng.range(0.9, 1.5);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (ex - x) * 0.65, y + (ey - y) * 0.65);
    ctx.stroke();
  }
  ctx.restore();
}

function drawAtmosphericFinishing(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  // Deep natural shadow fade over bottom ~22% so white card overlay text is razor-legible
  const bottomFade = ctx.createLinearGradient(0, DESIGN_H * 0.68, 0, DESIGN_H);
  bottomFade.addColorStop(0.0, 'rgba(5, 8, 16, 0)');
  bottomFade.addColorStop(0.32, 'rgba(5, 8, 16, 0.54)');
  bottomFade.addColorStop(0.62, 'rgba(4, 7, 14, 0.89)');
  bottomFade.addColorStop(1.0, 'rgba(3, 5, 11, 0.98)');
  ctx.fillStyle = bottomFade;
  ctx.fillRect(0, DESIGN_H * 0.68, DESIGN_W, DESIGN_H * 0.32);

  // Cinematic edge vignette focusing eye on runner + drop-ship leap
  const edgeVig = ctx.createRadialGradient(
    DESIGN_W * 0.52,
    DESIGN_H * 0.42,
    DESIGN_W * 0.28,
    DESIGN_W * 0.5,
    DESIGN_H * 0.48,
    DESIGN_H * 0.66,
  );
  edgeVig.addColorStop(0.0, 'rgba(4, 8, 16, 0)');
  edgeVig.addColorStop(0.75, 'rgba(4, 8, 16, 0.16)');
  edgeVig.addColorStop(1.0, 'rgba(3, 6, 12, 0.54)');
  ctx.fillStyle = edgeVig;
  ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);

  // Fine procedural film grain tiled in output canvas space (<2ms)
  const grain = getGrainCanvas();
  if (grain) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const pat = ctx.createPattern(grain, 'repeat');
    if (pat) {
      ctx.globalAlpha = 0.20;
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  }
}

export function renderCrownfall(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  if (width <= 0 || height <= 0) return;

  const rng = createRng(0x43524f57); // deterministic seed ("CROW")

  ctx.save();
  // Cover-scale the 720x1280 portrait composition cleanly to any canvas size
  const scale = Math.max(width / DESIGN_W, height / DESIGN_H);
  const offsetX = (width - DESIGN_W * scale) * 0.5;
  const offsetY = (height - DESIGN_H * scale) * 0.5;
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  // Back-to-front cinematic layer stack
  drawStormSky(ctx);
  drawStormClouds(ctx, rng);
  drawLightning(ctx, rng);
  drawMegacityAbyss(ctx, rng);
  drawBrutalistPylonsAndCables(ctx, rng);
  drawVtolDropShip(ctx, rng);
  drawCollapsingBridge(ctx, rng);
  drawHeroRunner(ctx);
  drawRainAndEmbers(ctx, rng);
  drawAtmosphericFinishing(ctx, width, height);

  ctx.restore();
}
