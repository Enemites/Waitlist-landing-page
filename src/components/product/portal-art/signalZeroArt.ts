/**
 * Signal Zero — Procedural HTML5 Canvas 2D Concept Art
 * Casual Realms Featured Center World (Sci-Fi · Ep. 01)
 * "The space station went dark. One airlock is opening from the outside."
 *
 * 100% pure procedural Canvas 2D TypeScript — zero external images,
 * zero SVG strings, deterministic Mulberry32 PRNG.
 */

interface Point2D {
  x: number;
  y: number;
}

/** Deterministic Mulberry32 PRNG */
function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/** Trace a chamfered architectural hexagonal airlock portal */
function traceHexPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): void {
  const pts: Point2D[] = [
    { x: cx - rx * 0.56, y: cy - ry },
    { x: cx + rx * 0.56, y: cy - ry },
    { x: cx + rx, y: cy - ry * 0.28 },
    { x: cx + rx, y: cy + ry * 0.28 },
    { x: cx + rx * 0.56, y: cy + ry },
    { x: cx - rx * 0.56, y: cy + ry },
    { x: cx - rx, y: cy + ry * 0.28 },
    { x: cx - rx, y: cy - ry * 0.28 },
  ];
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.closePath();
}

/** Build a cached 128x128 deterministic procedural film grain tile (<1ms) */
let cachedGrainCanvas: HTMLCanvasElement | null = null;

function getGrainTile(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (cachedGrainCanvas) return cachedGrainCanvas;

  const size = 128;
  const tile = document.createElement('canvas');
  tile.width = size;
  tile.height = size;
  const tctx = tile.getContext('2d');
  if (!tctx) return null;

  const img = tctx.createImageData(size, size);
  const data = img.data;
  const rng = createRng(0x9e3779b9);

  for (let i = 0; i < data.length; i += 4) {
    const v = (rng() * 255) | 0;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = Math.min(255, v + 12);
    data[i + 3] = 24;
  }
  tctx.putImageData(img, 0, 0);
  cachedGrainCanvas = tile;
  return tile;
}

/**
 * Render the Signal Zero procedural sci-fi concept art onto a 2D canvas context.
 * Gracefully adapts to both 9:16 portrait cards and 16:9 full-viewport portals.
 */
export function renderSignalZero(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  if (width <= 0 || height <= 0) return;

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  const rng = createRng(0x53494730);
  const aspect = width / height;
  const isLandscape = aspect > 1.05;
  const minDim = Math.min(width, height);
  const cx = width * 0.5;

  // Core perspective anchors tuned for both 9:16 portrait and 16:9 landscape
  const vanishY = isLandscape ? height * 0.545 : height * 0.585;
  const airlockRy = isLandscape ? height * 0.155 : minDim * 0.215;
  const airlockRx = airlockRy * 0.88;
  const airlockCy = vanishY + airlockRy * 0.04;
  const deckHorizonY = airlockCy + airlockRy * 0.96;

  // Massive curved panoramic observation bay bounds (upper half)
  const vpTopY = isLandscape ? height * 0.032 : height * 0.055;
  const vpBottomY = airlockCy - airlockRy * 1.12;
  const vpHalfW = isLandscape ? width * 0.455 : width * 0.485;

  // =========================================================================
  // LAYER 1: BASE STATION SHELL & DEEP SPACE VOID
  // =========================================================================
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#010308');
  bgGrad.addColorStop(0.45, '#040914');
  bgGrad.addColorStop(0.72, '#050a12');
  bgGrad.addColorStop(1, '#010205');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // =========================================================================
  // LAYER 2: PANORAMIC OBSERVATION BAY — DEEP SPACE, NEBULA, STARS, PLANET
  // =========================================================================
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - vpHalfW, vpBottomY);
  ctx.lineTo(cx - vpHalfW * 1.02, lerp(vpTopY, vpBottomY, 0.42));
  ctx.bezierCurveTo(
    cx - vpHalfW * 0.86,
    vpTopY,
    cx - vpHalfW * 0.36,
    vpTopY - height * 0.015,
    cx,
    vpTopY - height * 0.015,
  );
  ctx.bezierCurveTo(
    cx + vpHalfW * 0.36,
    vpTopY - height * 0.015,
    cx + vpHalfW * 0.86,
    vpTopY,
    cx + vpHalfW * 1.02,
    lerp(vpTopY, vpBottomY, 0.42),
  );
  ctx.lineTo(cx + vpHalfW, vpBottomY);
  ctx.closePath();
  ctx.clip();

  // Deep cosmic gradient inside viewport
  const spaceGrad = ctx.createRadialGradient(
    cx,
    vpBottomY * 1.08,
    minDim * 0.05,
    cx,
    vpTopY + (vpBottomY - vpTopY) * 0.3,
    Math.max(width, height) * 0.72,
  );
  spaceGrad.addColorStop(0, '#0a2238');
  spaceGrad.addColorStop(0.35, '#051022');
  spaceGrad.addColorStop(0.7, '#020612');
  spaceGrad.addColorStop(1, '#010207');
  ctx.fillStyle = spaceGrad;
  ctx.fillRect(0, 0, width, vpBottomY + 20);

  // Subtle procedural indigo / teal nebula wisps
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const nebulaBlobs = [
    { x: cx - vpHalfW * 0.48, y: vpTopY + (vpBottomY - vpTopY) * 0.28, rx: vpHalfW * 0.65, ry: (vpBottomY - vpTopY) * 0.34, rot: -0.28, c1: 'rgba(22, 95, 138, 0.14)', c2: 'rgba(18, 36, 92, 0.06)' },
    { x: cx + vpHalfW * 0.38, y: vpTopY + (vpBottomY - vpTopY) * 0.22, rx: vpHalfW * 0.58, ry: (vpBottomY - vpTopY) * 0.28, rot: 0.22, c1: 'rgba(38, 62, 145, 0.13)', c2: 'rgba(14, 78, 108, 0.05)' },
    { x: cx - vpHalfW * 0.08, y: vpTopY + (vpBottomY - vpTopY) * 0.18, rx: vpHalfW * 0.5, ry: (vpBottomY - vpTopY) * 0.22, rot: -0.1, c1: 'rgba(26, 132, 156, 0.10)', c2: 'rgba(12, 28, 72, 0.04)' },
    { x: cx + vpHalfW * 0.16, y: vpTopY + (vpBottomY - vpTopY) * 0.38, rx: vpHalfW * 0.44, ry: (vpBottomY - vpTopY) * 0.2, rot: 0.14, c1: 'rgba(56, 42, 128, 0.10)', c2: 'rgba(12, 56, 86, 0.03)' },
  ];
  for (const nb of nebulaBlobs) {
    ctx.save();
    ctx.translate(nb.x, nb.y);
    ctx.rotate(nb.rot);
    ctx.scale(1, nb.ry / Math.max(1, nb.rx));
    const ng = ctx.createRadialGradient(0, 0, nb.rx * 0.04, 0, 0, nb.rx);
    ng.addColorStop(0, nb.c1);
    ng.addColorStop(0.5, nb.c2);
    ng.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = ng;
    ctx.beginPath();
    ctx.arc(0, 0, nb.rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Fine nebula filament ribbons
  for (let i = 0; i < 6; i++) {
    const startX = cx - vpHalfW * (0.95 - i * 0.12);
    const startY = vpTopY + (vpBottomY - vpTopY) * (0.14 + rng() * 0.32);
    const endX = cx + vpHalfW * (0.35 + rng() * 0.65);
    const endY = startY + (rng() - 0.5) * (vpBottomY - vpTopY) * 0.28;
    const ctrlX = lerp(startX, endX, 0.5) + (rng() - 0.5) * vpHalfW * 0.3;
    const ctrlY = lerp(startY, endY, 0.5) - (vpBottomY - vpTopY) * 0.14;

    ctx.strokeStyle = i % 2 === 0 ? 'rgba(58, 178, 214, 0.032)' : 'rgba(92, 118, 224, 0.030)';
    ctx.lineWidth = minDim * (0.018 + rng() * 0.025);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    ctx.stroke();
  }
  ctx.restore();

  // Multi-scale crisp starfield
  const starCount = isLandscape ? 520 : 460;
  for (let i = 0; i < starCount; i++) {
    const sx = cx + (rng() - 0.5) * vpHalfW * 2.1;
    const sy = vpTopY - height * 0.01 + rng() * (vpBottomY - vpTopY + height * 0.02);
    const tier = rng();
    const radius = tier < 0.72 ? 0.45 + rng() * 0.45 : tier < 0.96 ? 0.9 + rng() * 0.55 : 1.35 + rng() * 0.7;
    const alpha = tier < 0.72 ? 0.18 + rng() * 0.35 : tier < 0.96 ? 0.48 + rng() * 0.38 : 0.8 + rng() * 0.2;

    const temp = rng();
    let color = `rgba(225, 240, 255, ${alpha.toFixed(3)})`;
    if (temp < 0.28) {
      color = `rgba(155, 218, 255, ${alpha.toFixed(3)})`;
    } else if (temp > 0.84) {
      color = `rgba(255, 232, 198, ${alpha.toFixed(3)})`;
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Hero star diffraction cross-spikes
    if (tier >= 0.965) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const spikeLen = radius * (4.2 + rng() * 3.5);
      const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, spikeLen * 0.9);
      sg.addColorStop(0, 'rgba(205, 244, 255, 0.45)');
      sg.addColorStop(1, 'rgba(110, 200, 255, 0)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(sx, sy, spikeLen * 0.9, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(210, 245, 255, 0.38)';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(sx - spikeLen, sy);
      ctx.lineTo(sx + spikeLen, sy);
      ctx.moveTo(sx, sy - spikeLen * 0.8);
      ctx.lineTo(sx, sy + spikeLen * 0.8);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Luminous curved planetary horizon
  const planetR = isLandscape ? width * 1.15 : width * 1.55;
  const planetCrestY = vpTopY + (vpBottomY - vpTopY) * (isLandscape ? 0.50 : 0.54);
  const planetCx = cx + width * 0.06;
  const planetCy = planetCrestY + planetR;

  // Outer Rayleigh atmospheric scatter glow
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const atmoOuterR = planetR + minDim * 0.14;
  const atmoInnerR = planetR - minDim * 0.015;
  const atmoGrad = ctx.createRadialGradient(
    planetCx,
    planetCy,
    atmoInnerR,
    planetCx,
    planetCy,
    atmoOuterR,
  );
  atmoGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  atmoGrad.addColorStop(0.10, 'rgba(24, 185, 245, 0.55)');
  atmoGrad.addColorStop(0.22, 'rgba(85, 232, 255, 0.75)');
  atmoGrad.addColorStop(0.36, 'rgba(28, 138, 224, 0.32)');
  atmoGrad.addColorStop(0.65, 'rgba(12, 64, 152, 0.11)');
  atmoGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = atmoGrad;
  ctx.beginPath();
  ctx.arc(planetCx, planetCy, atmoOuterR, Math.PI * 1.1, Math.PI * 1.9);
  ctx.fill();
  ctx.restore();

  // Dark side planet body (occludes stars behind it)
  ctx.save();
  ctx.beginPath();
  ctx.arc(planetCx, planetCy, planetR, 0, Math.PI * 2);
  ctx.closePath();
  const planetBodyGrad = ctx.createRadialGradient(
    planetCx - planetR * 0.04,
    planetCrestY + minDim * 0.02,
    minDim * 0.02,
    planetCx,
    planetCrestY + minDim * 0.32,
    minDim * 0.52,
  );
  planetBodyGrad.addColorStop(0, '#0a2138');
  planetBodyGrad.addColorStop(0.18, '#040d1b');
  planetBodyGrad.addColorStop(0.55, '#02060e');
  planetBodyGrad.addColorStop(1, '#010308');
  ctx.fillStyle = planetBodyGrad;
  ctx.fill();

  // Clip inside planet disk for dark-side city lights & cloud-band sheen
  ctx.clip();

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const cloudSheen = ctx.createRadialGradient(
    planetCx - width * 0.08,
    planetCrestY - minDim * 0.02,
    minDim * 0.02,
    planetCx - width * 0.04,
    planetCrestY + minDim * 0.06,
    vpHalfW * 0.88,
  );
  cloudSheen.addColorStop(0, 'rgba(108, 224, 255, 0.24)');
  cloudSheen.addColorStop(0.45, 'rgba(34, 128, 198, 0.09)');
  cloudSheen.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = cloudSheen;
  ctx.fillRect(cx - vpHalfW, planetCrestY - 20, vpHalfW * 2, vpBottomY - planetCrestY + 40);

  // Faint city-light clusters on the dark side of the planet
  const cityClusters = [
    { angle: -0.155, depth: 0.028, count: 24, spread: 0.026 },
    { angle: -0.075, depth: 0.042, count: 32, spread: 0.032 },
    { angle: 0.032, depth: 0.052, count: 28, spread: 0.028 },
    { angle: 0.115, depth: 0.034, count: 22, spread: 0.024 },
    { angle: -0.22, depth: 0.055, count: 16, spread: 0.020 },
  ];
  for (const cluster of cityClusters) {
    const baseAngle = -Math.PI * 0.5 + cluster.angle;
    const baseR = planetR - minDim * cluster.depth;
    const hubX = planetCx + Math.cos(baseAngle) * baseR;
    const hubY = planetCy + Math.sin(baseAngle) * baseR;

    const cg = ctx.createRadialGradient(hubX, hubY, 0, hubX, hubY, minDim * 0.042);
    cg.addColorStop(0, 'rgba(255, 184, 96, 0.22)');
    cg.addColorStop(0.5, 'rgba(255, 134, 56, 0.07)');
    cg.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(hubX, hubY, minDim * 0.042, 0, Math.PI * 2);
    ctx.fill();

    for (let j = 0; j < cluster.count; j++) {
      const a = baseAngle + (rng() - 0.5) * cluster.spread * 2.2;
      const r = baseR + (rng() - 0.5) * minDim * 0.024;
      const lx = planetCx + Math.cos(a) * r;
      const ly = planetCy + Math.sin(a) * r;
      const dotR = 0.55 + rng() * 1.1;
      const warm = rng() > 0.22;
      ctx.fillStyle = warm
        ? `rgba(255, ${185 + ((rng() * 55) | 0)}, ${105 + ((rng() * 65) | 0)}, ${(0.35 + rng() * 0.55).toFixed(2)})`
        : `rgba(140, 228, 255, ${(0.25 + rng() * 0.4).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(lx, ly, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  ctx.restore();

  // Razor-sharp glowing electric-cyan & ice-blue atmospheric limb arc
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const limbArcStart = -Math.PI * 0.5 - 0.42;
  const limbArcEnd = -Math.PI * 0.5 + 0.38;

  const limbStrokeGrad = ctx.createLinearGradient(
    cx - vpHalfW * 0.85,
    planetCrestY,
    cx + vpHalfW * 0.85,
    planetCrestY,
  );
  limbStrokeGrad.addColorStop(0, 'rgba(24, 152, 235, 0.08)');
  limbStrokeGrad.addColorStop(0.28, 'rgba(56, 224, 255, 0.85)');
  limbStrokeGrad.addColorStop(0.48, 'rgba(218, 252, 255, 1.0)');
  limbStrokeGrad.addColorStop(0.68, 'rgba(72, 222, 255, 0.82)');
  limbStrokeGrad.addColorStop(1, 'rgba(20, 122, 210, 0.08)');

  ctx.strokeStyle = limbStrokeGrad;
  ctx.lineWidth = Math.max(2.2, minDim * 0.007);
  ctx.beginPath();
  ctx.arc(planetCx, planetCy, planetR + 0.5, limbArcStart, limbArcEnd);
  ctx.stroke();

  const razorGrad = ctx.createLinearGradient(
    cx - vpHalfW * 0.5,
    planetCrestY,
    cx + vpHalfW * 0.4,
    planetCrestY,
  );
  razorGrad.addColorStop(0, 'rgba(180, 248, 255, 0)');
  razorGrad.addColorStop(0.35, 'rgba(225, 253, 255, 0.92)');
  razorGrad.addColorStop(0.55, 'rgba(255, 255, 255, 1)');
  razorGrad.addColorStop(0.8, 'rgba(160, 242, 255, 0.65)');
  razorGrad.addColorStop(1, 'rgba(120, 220, 255, 0)');
  ctx.strokeStyle = razorGrad;
  ctx.lineWidth = Math.max(1.2, minDim * 0.0026);
  ctx.beginPath();
  ctx.arc(planetCx, planetCy, planetR + 1.2, -Math.PI * 0.5 - 0.28, -Math.PI * 0.5 + 0.24);
  ctx.stroke();

  const glintX = planetCx - width * 0.05;
  const glintY = planetCrestY + 2;
  const glintGrad = ctx.createRadialGradient(glintX, glintY, 1, glintX, glintY, vpHalfW * 0.34);
  glintGrad.addColorStop(0, 'rgba(235, 254, 255, 0.65)');
  glintGrad.addColorStop(0.25, 'rgba(84, 224, 255, 0.25)');
  glintGrad.addColorStop(0.6, 'rgba(24, 128, 212, 0.07)');
  glintGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glintGrad;
  ctx.beginPath();
  ctx.arc(glintX, glintY, vpHalfW * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Multi-pane curved viewport glass reflections & structural mullions
  ctx.save();
  const glassSheen = ctx.createLinearGradient(cx - vpHalfW, vpTopY, cx + vpHalfW * 0.4, vpBottomY);
  glassSheen.addColorStop(0, 'rgba(120, 210, 255, 0.05)');
  glassSheen.addColorStop(0.22, 'rgba(175, 235, 255, 0.015)');
  glassSheen.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  glassSheen.addColorStop(0.76, 'rgba(90, 190, 235, 0.025)');
  glassSheen.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glassSheen;
  ctx.fillRect(cx - vpHalfW, vpTopY - 20, vpHalfW * 2, vpBottomY - vpTopY + 30);

  // Curved horizontal transom bar
  const transomY = lerp(vpTopY, vpBottomY, 0.36);
  ctx.strokeStyle = '#070c14';
  ctx.lineWidth = Math.max(4, minDim * 0.011);
  ctx.beginPath();
  ctx.moveTo(cx - vpHalfW * 1.05, transomY + minDim * 0.045);
  ctx.quadraticCurveTo(cx, transomY - minDim * 0.032, cx + vpHalfW * 1.05, transomY + minDim * 0.045);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(110, 224, 255, 0.24)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(cx - vpHalfW * 0.96, transomY + minDim * 0.048);
  ctx.quadraticCurveTo(cx, transomY - minDim * 0.025, cx + vpHalfW * 0.96, transomY + minDim * 0.048);
  ctx.stroke();

  // Vertical-radial panoramic window mullions
  const mullionFracs = isLandscape ? [-0.66, -0.34, 0, 0.34, 0.66] : [-0.52, -0.18, 0.18, 0.52];
  for (const frac of mullionFracs) {
    const topX = cx + frac * vpHalfW * 0.86;
    const botX = cx + frac * vpHalfW * 0.72;
    const midX = lerp(topX, botX, 0.5) + frac * vpHalfW * 0.04;
    const midY = lerp(vpTopY, vpBottomY, 0.5);

    ctx.strokeStyle = '#060a11';
    ctx.lineWidth = Math.max(5, minDim * 0.013);
    ctx.beginPath();
    ctx.moveTo(topX, vpTopY - 10);
    ctx.quadraticCurveTo(midX, midY, botX, vpBottomY + 8);
    ctx.stroke();

    const edgeOffset = frac < 0 ? 2.2 : -2.2;
    ctx.strokeStyle = 'rgba(105, 215, 245, 0.20)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(topX + edgeOffset, vpTopY - 10);
    ctx.quadraticCurveTo(midX + edgeOffset, midY, botX + edgeOffset, vpBottomY + 8);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore(); // End viewport clip

  // =========================================================================
  // LAYER 3: OBSERVATION BAY HEAVY ARCH FRAME & UPPER CEILING BULKHEAD
  // =========================================================================
  ctx.save();
  ctx.strokeStyle = '#0a101b';
  ctx.lineWidth = Math.max(10, minDim * 0.024);
  ctx.beginPath();
  ctx.moveTo(cx - vpHalfW, vpBottomY);
  ctx.lineTo(cx - vpHalfW * 1.02, lerp(vpTopY, vpBottomY, 0.42));
  ctx.bezierCurveTo(
    cx - vpHalfW * 0.86,
    vpTopY,
    cx - vpHalfW * 0.36,
    vpTopY - height * 0.015,
    cx,
    vpTopY - height * 0.015,
  );
  ctx.bezierCurveTo(
    cx + vpHalfW * 0.36,
    vpTopY - height * 0.015,
    cx + vpHalfW * 0.86,
    vpTopY,
    cx + vpHalfW * 1.02,
    lerp(vpTopY, vpBottomY, 0.42),
  );
  ctx.lineTo(cx + vpHalfW, vpBottomY);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(98, 206, 242, 0.32)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Heavy lower observation sill separating panoramic window from airlock bulkhead
  const sillH = Math.max(12, minDim * 0.026);
  const sillGrad = ctx.createLinearGradient(0, vpBottomY - sillH * 0.3, 0, vpBottomY + sillH);
  sillGrad.addColorStop(0, '#142234');
  sillGrad.addColorStop(0.28, '#0b121e');
  sillGrad.addColorStop(1, '#04070d');
  ctx.fillStyle = sillGrad;
  ctx.fillRect(0, vpBottomY - sillH * 0.25, width, sillH * 1.3);

  ctx.strokeStyle = 'rgba(130, 228, 255, 0.35)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(cx - vpHalfW, vpBottomY - sillH * 0.22);
  ctx.lineTo(cx + vpHalfW, vpBottomY - sillH * 0.22);
  ctx.stroke();

  // Micro-rivets along the observation sill beam
  ctx.fillStyle = 'rgba(115, 200, 234, 0.26)';
  const rivetStep = Math.max(18, minDim * 0.045);
  for (let rx = cx - vpHalfW * 0.9; rx <= cx + vpHalfW * 0.9; rx += rivetStep) {
    ctx.beginPath();
    ctx.arc(rx, vpBottomY + sillH * 0.28, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // =========================================================================
  // LAYER 4: CORRIDOR SHELL, PERSPECTIVE DECK PLATES & WALL PANELS
  // =========================================================================
  const backWallHalfW = airlockRx * 1.65;
  const backWallTopY = vpBottomY + sillH * 0.85;
  const backWallBotY = deckHorizonY;

  for (const side of [-1, 1] as const) {
    const wallGrad = ctx.createLinearGradient(
      cx + side * backWallHalfW,
      airlockCy,
      cx + side * width * 0.55,
      airlockCy,
    );
    wallGrad.addColorStop(0, '#0c1a2a');
    wallGrad.addColorStop(0.35, '#070e19');
    wallGrad.addColorStop(1, '#03060c');
    ctx.fillStyle = wallGrad;
    ctx.beginPath();
    ctx.moveTo(cx + side * backWallHalfW, backWallTopY);
    ctx.lineTo(cx + side * width * 0.56, vpBottomY - height * 0.04);
    ctx.lineTo(cx + side * width * 0.56, height);
    ctx.lineTo(cx + side * backWallHalfW, backWallBotY);
    ctx.closePath();
    ctx.fill();

    // Perspective wall panel seams & conduit tracks
    ctx.strokeStyle = 'rgba(72, 138, 178, 0.14)';
    ctx.lineWidth = 1;
    for (let s = 1; s <= 4; s++) {
      const f = s / 5;
      const yBack = lerp(backWallTopY, backWallBotY, f);
      const yFront = lerp(vpBottomY - height * 0.04, height * 0.96, f);
      ctx.beginPath();
      ctx.moveTo(cx + side * backWallHalfW, yBack);
      ctx.lineTo(cx + side * width * 0.54, yFront);
      ctx.stroke();
    }
  }

  // Corridor metallic deck floor
  const deckGrad = ctx.createLinearGradient(0, deckHorizonY, 0, height);
  deckGrad.addColorStop(0, '#0f2536');
  deckGrad.addColorStop(0.22, '#08131f');
  deckGrad.addColorStop(0.58, '#050a12');
  deckGrad.addColorStop(1, '#020408');
  ctx.fillStyle = deckGrad;
  ctx.beginPath();
  ctx.moveTo(cx - backWallHalfW * 1.15, deckHorizonY);
  ctx.lineTo(cx + backWallHalfW * 1.15, deckHorizonY);
  ctx.lineTo(width + 20, height);
  ctx.lineTo(-20, height);
  ctx.closePath();
  ctx.fill();

  // Perspective deck plate longitudinal seams
  const deckRays = [-2.2, -1.5, -0.92, -0.46, 0.46, 0.92, 1.5, 2.2];
  ctx.strokeStyle = 'rgba(92, 162, 198, 0.14)';
  ctx.lineWidth = 1;
  for (const r of deckRays) {
    ctx.beginPath();
    ctx.moveTo(cx + r * airlockRx * 0.65, deckHorizonY);
    ctx.lineTo(cx + r * width * 0.44, height);
    ctx.stroke();
  }

  // Perspective deck transverse seams
  for (let i = 1; i <= 11; i++) {
    const t = Math.pow(i / 11, 2.05);
    const py = lerp(deckHorizonY, height, t);
    const halfSpan = lerp(backWallHalfW * 1.1, width * 0.56, t);
    ctx.strokeStyle = `rgba(98, 178, 212, ${(0.05 + (1 - t) * 0.14).toFixed(3)})`;
    ctx.lineWidth = 0.8 + t * 0.8;
    ctx.beginPath();
    ctx.moveTo(cx - halfSpan, py);
    ctx.lineTo(cx + halfSpan, py);
    ctx.stroke();
  }

  // Central recessed floor grating
  const grateBackHalfW = airlockRx * 0.42;
  const grateFrontHalfW = isLandscape ? width * 0.145 : width * 0.21;
  ctx.fillStyle = '#03060b';
  ctx.beginPath();
  ctx.moveTo(cx - grateBackHalfW, deckHorizonY);
  ctx.lineTo(cx + grateBackHalfW, deckHorizonY);
  ctx.lineTo(cx + grateFrontHalfW, height);
  ctx.lineTo(cx - grateFrontHalfW, height);
  ctx.closePath();
  ctx.fill();

  // Grating cross-slats
  const slatCount = 24;
  for (let i = 1; i <= slatCount; i++) {
    const t = Math.pow(i / slatCount, 1.85);
    const sy = lerp(deckHorizonY + 2, height, t);
    const sw = lerp(grateBackHalfW, grateFrontHalfW, t) * 0.92;
    ctx.strokeStyle = `rgba(42, 74, 98, ${(0.18 + (1 - t) * 0.22).toFixed(3)})`;
    ctx.lineWidth = 0.8 + t * 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - sw, sy);
    ctx.lineTo(cx + sw, sy);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(32, 58, 78, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, deckHorizonY);
  ctx.lineTo(cx, height);
  ctx.stroke();

  // =========================================================================
  // LAYER 5: BACK BULKHEAD WALL & PRESSURIZED HEXAGONAL AIRLOCK DOOR
  // =========================================================================
  const bulkheadGrad = ctx.createRadialGradient(
    cx,
    airlockCy,
    airlockRx * 0.7,
    cx,
    airlockCy,
    backWallHalfW * 1.4,
  );
  bulkheadGrad.addColorStop(0, '#142b3f');
  bulkheadGrad.addColorStop(0.55, '#0a1421');
  bulkheadGrad.addColorStop(1, '#04080f');
  ctx.fillStyle = bulkheadGrad;
  ctx.fillRect(
    cx - backWallHalfW,
    backWallTopY,
    backWallHalfW * 2,
    backWallBotY - backWallTopY,
  );

  // Armored plate seams & micro-vents on back bulkhead
  ctx.strokeStyle = 'rgba(110, 195, 232, 0.16)';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    cx - backWallHalfW * 0.92,
    backWallTopY + 6,
    backWallHalfW * 1.84,
    backWallBotY - backWallTopY - 12,
  );

  // Hydraulic locking struts & alert LEDs flanking the hexagonal airlock
  for (const side of [-1, 1] as const) {
    const sx = cx + side * airlockRx * 1.18;
    ctx.fillStyle = '#070d16';
    ctx.fillRect(sx - airlockRx * 0.12, airlockCy - airlockRy * 0.48, airlockRx * 0.24, airlockRy * 0.96);
    ctx.strokeStyle = 'rgba(120, 214, 245, 0.28)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - airlockRx * 0.12, airlockCy - airlockRy * 0.48, airlockRx * 0.24, airlockRy * 0.96);

    // Recessed ventilation louvres below strut
    for (let v = 0; v < 4; v++) {
      const vy = airlockCy + airlockRy * (0.56 + v * 0.065);
      ctx.strokeStyle = 'rgba(85, 155, 192, 0.22)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(sx - airlockRx * 0.10, vy);
      ctx.lineTo(sx + airlockRx * 0.10, vy);
      ctx.stroke();
    }

    // Status warning LED (warm red-amber alert)
    const ledY = airlockCy - airlockRy * 0.62;
    const ledX = cx + side * airlockRx * 1.18;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const lg = ctx.createRadialGradient(ledX, ledY, 0.5, ledX, ledY, minDim * 0.022);
    lg.addColorStop(0, 'rgba(255, 118, 52, 0.95)');
    lg.addColorStop(0.35, 'rgba(255, 58, 24, 0.42)');
    lg.addColorStop(1, 'rgba(255, 40, 10, 0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(ledX, ledY, minDim * 0.022, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Outer beveled hexagonal airlock frame
  traceHexPath(ctx, cx, airlockCy, airlockRx * 1.12, airlockRy * 1.09);
  const outerFrameGrad = ctx.createLinearGradient(cx, airlockCy - airlockRy, cx, airlockCy + airlockRy);
  outerFrameGrad.addColorStop(0, '#1d3347');
  outerFrameGrad.addColorStop(0.5, '#0c1624');
  outerFrameGrad.addColorStop(1, '#070d17');
  ctx.fillStyle = outerFrameGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(125, 224, 255, 0.48)';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Recessed pressure gasket ring
  traceHexPath(ctx, cx, airlockCy, airlockRx * 0.98, airlockRy * 0.96);
  ctx.fillStyle = '#040911';
  ctx.fill();
  ctx.strokeStyle = 'rgba(170, 242, 255, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Clip inside the pressurized airlock opening
  ctx.save();
  traceHexPath(ctx, cx, airlockCy, airlockRx * 0.92, airlockRy * 0.90);
  ctx.clip();

  // Blinding cold white-cyan exterior void flooding the airlock cavity
  const cavityGrad = ctx.createRadialGradient(
    cx,
    airlockCy - airlockRy * 0.08,
    airlockRx * 0.04,
    cx,
    airlockCy,
    airlockRy * 1.25,
  );
  cavityGrad.addColorStop(0, '#ffffff');
  cavityGrad.addColorStop(0.28, '#e2fdff');
  cavityGrad.addColorStop(0.56, '#7ce8ff');
  cavityGrad.addColorStop(0.84, '#1fa8d8');
  cavityGrad.addColorStop(1, '#0a4c78');
  ctx.fillStyle = cavityGrad;
  ctx.fillRect(cx - airlockRx, airlockCy - airlockRy, airlockRx * 2, airlockRy * 2);

  // Cracking-open vertical blast doors (left & right leaves)
  const gapHalfW = airlockRx * 0.255;
  for (const side of [-1, 1] as const) {
    const edgeX = cx + side * gapHalfW;
    const outerX = cx + side * airlockRx * 1.05;
    const doorW = Math.abs(outerX - edgeX);
    const doorX = side === -1 ? outerX : edgeX;

    const doorGrad = ctx.createLinearGradient(edgeX, airlockCy, outerX, airlockCy);
    doorGrad.addColorStop(0, '#162c3e');
    doorGrad.addColorStop(0.14, '#0b1420');
    doorGrad.addColorStop(1, '#04080f');
    ctx.fillStyle = doorGrad;
    ctx.fillRect(doorX, airlockCy - airlockRy, doorW, airlockRy * 2);

    // Interlocking mechanical blast-door teeth along inner seam
    const toothCount = 5;
    const toothH = (airlockRy * 1.42) / toothCount;
    ctx.fillStyle = '#09121e';
    for (let t = 0; t < toothCount; t++) {
      if ((t + (side === 1 ? 1 : 0)) % 2 === 0) {
        const ty = airlockCy - airlockRy * 0.7 + t * toothH;
        const tx = side === -1 ? edgeX - 1 : edgeX - airlockRx * 0.045;
        ctx.fillRect(tx, ty + toothH * 0.18, airlockRx * 0.048, toothH * 0.55);
      }
    }

    // Recessed armor panel detail on each blast door
    ctx.strokeStyle = 'rgba(95, 185, 224, 0.22)';
    ctx.lineWidth = 1;
    const insetX = side === -1 ? edgeX - doorW * 0.78 : edgeX + doorW * 0.14;
    ctx.strokeRect(insetX, airlockCy - airlockRy * 0.62, doorW * 0.64, airlockRy * 1.24);

    // Subtle weathered amber hazard stripes near bottom of blast door
    ctx.save();
    ctx.beginPath();
    ctx.rect(insetX, airlockCy + airlockRy * 0.44, doorW * 0.64, airlockRy * 0.14);
    ctx.clip();
    ctx.strokeStyle = 'rgba(214, 118, 38, 0.32)';
    ctx.lineWidth = Math.max(2.5, airlockRx * 0.04);
    for (let h = -4; h < 12; h++) {
      const hx = insetX + h * airlockRx * 0.11;
      ctx.beginPath();
      ctx.moveTo(hx, airlockCy + airlockRy * 0.62);
      ctx.lineTo(hx + airlockRx * 0.14, airlockCy + airlockRy * 0.40);
      ctx.stroke();
    }
    ctx.restore();

    // Searing cold white-cyan rim highlight along the cracking door edge
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(218, 253, 255, 0.95)';
    ctx.lineWidth = Math.max(2, airlockRx * 0.022);
    ctx.beginPath();
    ctx.moveTo(edgeX, airlockCy - airlockRy);
    ctx.lineTo(edgeX, airlockCy + airlockRy);
    ctx.stroke();
    ctx.restore();
  }

  // =========================================================================
  // LAYER 6: BACKLIT EVA ASTRONAUT SILHOUETTE STEPPING THROUGH THRESHOLD
  // =========================================================================
  const astroH = airlockRy * 1.38;
  const astroFeetY = airlockCy + airlockRy * 0.89;
  const astroHeadY = astroFeetY - astroH;
  const s = astroH / 100;
  const ax = cx - s * 1.2;

  ctx.save();
  // Intense cyan backlight aura behind the astronaut
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const auraGrad = ctx.createRadialGradient(
    ax,
    astroHeadY + s * 32,
    s * 4,
    ax,
    astroHeadY + s * 42,
    s * 46,
  );
  auraGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  auraGrad.addColorStop(0.35, 'rgba(135, 242, 255, 0.55)');
  auraGrad.addColorStop(1, 'rgba(30, 168, 224, 0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(ax, astroHeadY + s * 38, s * 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // EVA Silhouette fill
  const suitGrad = ctx.createLinearGradient(ax, astroHeadY, ax, astroFeetY);
  suitGrad.addColorStop(0, '#07111d');
  suitGrad.addColorStop(0.45, '#040912');
  suitGrad.addColorStop(1, '#02050a');
  ctx.fillStyle = suitGrad;

  // 1) PLSS Life-Support Backpack outline rising behind shoulders
  ctx.beginPath();
  ctx.roundRect(ax - s * 12.2, astroHeadY + s * 11.5, s * 24.4, s * 32.5, s * 3.2);
  ctx.fill();

  // EVA comms antenna mast on left shoulder of PLSS
  ctx.strokeStyle = '#091523';
  ctx.lineWidth = Math.max(1.1, s * 1.05);
  ctx.beginPath();
  ctx.moveTo(ax - s * 9.5, astroHeadY + s * 12);
  ctx.lineTo(ax - s * 11.2, astroHeadY + s * 1.5);
  ctx.stroke();

  // 2) Pressure Helmet & Neck Ring Collar
  const helmetCy = astroHeadY + s * 10.5;
  ctx.beginPath();
  ctx.ellipse(ax + s * 0.4, helmetCy, s * 8.6, s * 9.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(ax - s * 7.6, astroHeadY + s * 17.8, s * 15.6, s * 4.2, s * 1.8);
  ctx.fill();

  // 3) Hard Upper Torso (HUT) & Waist Harness
  ctx.beginPath();
  ctx.moveTo(ax - s * 14.2, astroHeadY + s * 22.5);
  ctx.quadraticCurveTo(ax, astroHeadY + s * 19.2, ax + s * 14.5, astroHeadY + s * 22.5);
  ctx.lineTo(ax + s * 12.8, astroHeadY + s * 48.5);
  ctx.quadraticCurveTo(ax, astroHeadY + s * 51.8, ax - s * 12.4, astroHeadY + s * 48.5);
  ctx.closePath();
  ctx.fill();

  // 4) Left Arm (steadying near the cracking blast door edge)
  ctx.beginPath();
  ctx.moveTo(ax - s * 13.5, astroHeadY + s * 22.8);
  ctx.quadraticCurveTo(ax - s * 20.5, astroHeadY + s * 26.5, ax - s * 21.8, astroHeadY + s * 39.5);
  ctx.lineTo(ax - s * 24.5, astroHeadY + s * 48.5);
  ctx.lineTo(ax - s * 19.2, astroHeadY + s * 50.8);
  ctx.lineTo(ax - s * 15.6, astroHeadY + s * 41.2);
  ctx.lineTo(ax - s * 11.8, astroHeadY + s * 33.5);
  ctx.closePath();
  ctx.fill();

  // 5) Right Arm (poised forward-downward in zero-g entry posture)
  ctx.beginPath();
  ctx.moveTo(ax + s * 13.8, astroHeadY + s * 22.8);
  ctx.quadraticCurveTo(ax + s * 20.2, astroHeadY + s * 28.0, ax + s * 20.8, astroHeadY + s * 42.2);
  ctx.lineTo(ax + s * 18.8, astroHeadY + s * 56.5);
  ctx.lineTo(ax + s * 13.4, astroHeadY + s * 56.2);
  ctx.lineTo(ax + s * 14.2, astroHeadY + s * 43.2);
  ctx.lineTo(ax + s * 11.8, astroHeadY + s * 34.0);
  ctx.closePath();
  ctx.fill();

  // 6) Left Leg (trailing step on outer threshold)
  ctx.beginPath();
  ctx.moveTo(ax - s * 11.6, astroHeadY + s * 47.5);
  ctx.lineTo(ax - s * 14.8, astroHeadY + s * 72.5);
  ctx.lineTo(ax - s * 17.8, astroHeadY + s * 94.5);
  ctx.lineTo(ax - s * 8.2, astroHeadY + s * 95.8);
  ctx.lineTo(ax - s * 6.2, astroHeadY + s * 73.5);
  ctx.lineTo(ax - s * 1.2, astroHeadY + s * 51.5);
  ctx.closePath();
  ctx.fill();

  // 7) Right Leg (stepping forward into the station)
  ctx.beginPath();
  ctx.moveTo(ax + s * 1.0, astroHeadY + s * 50.5);
  ctx.lineTo(ax + s * 12.0, astroHeadY + s * 47.5);
  ctx.lineTo(ax + s * 14.5, astroHeadY + s * 73.0);
  ctx.lineTo(ax + s * 15.8, astroHeadY + s * 98.0);
  ctx.lineTo(ax + s * 5.2, astroHeadY + s * 99.5);
  ctx.lineTo(ax + s * 4.5, astroHeadY + s * 74.0);
  ctx.closePath();
  ctx.fill();

  // Heavy magnetic EVA boots
  ctx.beginPath();
  ctx.roundRect(ax - s * 19.2, astroHeadY + s * 92.5, s * 12.2, s * 6.2, s * 2.2);
  ctx.roundRect(ax + s * 4.5, astroHeadY + s * 95.2, s * 13.0, s * 6.5, s * 2.2);
  ctx.fill();

  // Crisp cyan Fresnel rim light & metallic visor glint
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgba(185, 248, 255, 0.82)';
  ctx.lineWidth = Math.max(1.1, s * 0.95);
  ctx.beginPath();
  ctx.arc(ax + s * 0.4, helmetCy, s * 8.6, Math.PI * 1.12, Math.PI * 1.88);
  ctx.stroke();

  const visorGrad = ctx.createLinearGradient(
    ax - s * 5.2,
    helmetCy - s * 3.5,
    ax + s * 6.0,
    helmetCy + s * 3.2,
  );
  visorGrad.addColorStop(0, 'rgba(95, 224, 255, 0.42)');
  visorGrad.addColorStop(0.42, 'rgba(218, 252, 255, 0.72)');
  visorGrad.addColorStop(0.65, 'rgba(34, 118, 168, 0.16)');
  visorGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = visorGrad;
  ctx.beginPath();
  ctx.ellipse(ax + s * 0.6, helmetCy - s * 0.4, s * 5.6, s * 4.2, -0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(155, 242, 255, 0.65)';
  ctx.lineWidth = Math.max(1.0, s * 0.85);
  ctx.beginPath();
  ctx.moveTo(ax - s * 12.2, astroHeadY + s * 14.5);
  ctx.lineTo(ax - s * 12.2, astroHeadY + s * 22.0);
  ctx.moveTo(ax + s * 12.2, astroHeadY + s * 14.5);
  ctx.lineTo(ax + s * 12.2, astroHeadY + s * 22.0);
  ctx.stroke();

  // Warm amber chest telemetry dot on suit
  const chestLedX = ax + s * 4.2;
  const chestLedY = astroHeadY + s * 31.5;
  const cLed = ctx.createRadialGradient(chestLedX, chestLedY, 0.2, chestLedX, chestLedY, s * 3.4);
  cLed.addColorStop(0, 'rgba(255, 178, 86, 0.95)');
  cLed.addColorStop(0.45, 'rgba(255, 92, 34, 0.35)');
  cLed.addColorStop(1, 'rgba(255, 60, 10, 0)');
  ctx.fillStyle = cLed;
  ctx.beginPath();
  ctx.arc(chestLedX, chestLedY, s * 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore(); // End astronaut
  ctx.restore(); // End airlock interior clip

  // =========================================================================
  // LAYER 7: DECK SPECULAR REFLECTIONS, CAST SHADOW & EMERGENCY AMBER STRIPS
  // =========================================================================
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const deckPoolGrad = ctx.createRadialGradient(
    cx,
    deckHorizonY + height * 0.015,
    airlockRx * 0.08,
    cx,
    deckHorizonY + height * 0.14,
    isLandscape ? width * 0.32 : width * 0.56,
  );
  deckPoolGrad.addColorStop(0, 'rgba(215, 252, 255, 0.68)');
  deckPoolGrad.addColorStop(0.24, 'rgba(92, 224, 255, 0.36)');
  deckPoolGrad.addColorStop(0.55, 'rgba(26, 128, 184, 0.14)');
  deckPoolGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = deckPoolGrad;
  ctx.beginPath();
  ctx.moveTo(cx - gapHalfW * 1.4, deckHorizonY);
  ctx.lineTo(cx + gapHalfW * 1.4, deckHorizonY);
  ctx.lineTo(cx + width * 0.44, height * 0.96);
  ctx.lineTo(cx - width * 0.44, height * 0.96);
  ctx.closePath();
  ctx.fill();

  // Anisotropic brushed-metal specular micro-streaks across illuminated deck
  for (let i = 0; i < 65; i++) {
    const t = Math.pow(rng(), 1.35);
    const sy = lerp(deckHorizonY + 4, height * 0.88, t);
    const spread = lerp(airlockRx * 0.65, width * 0.34, t);
    const sx = cx + (rng() - 0.5) * spread * 1.8;
    const sw = (10 + rng() * 44) * (0.45 + t * 0.9);
    const distNorm = Math.abs(sx - cx) / Math.max(1, spread);
    const alpha = clamp((1 - distNorm * 0.85) * (1 - t * 0.72) * 0.24, 0.01, 0.26);
    ctx.strokeStyle = `rgba(165, 242, 255, ${alpha.toFixed(3)})`;
    ctx.lineWidth = 0.7 + rng() * 1.1;
    ctx.beginPath();
    ctx.moveTo(sx - sw * 0.5, sy);
    ctx.lineTo(sx + sw * 0.5, sy);
    ctx.stroke();
  }
  ctx.restore();

  // Astronaut's dramatic forward-cast silhouette shadow onto the lit deck
  ctx.save();
  const shadowGrad = ctx.createLinearGradient(cx, deckHorizonY, cx, deckHorizonY + height * 0.28);
  shadowGrad.addColorStop(0, 'rgba(1, 4, 10, 0.82)');
  shadowGrad.addColorStop(0.55, 'rgba(2, 6, 14, 0.48)');
  shadowGrad.addColorStop(1, 'rgba(2, 6, 14, 0)');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.moveTo(ax - s * 16, deckHorizonY);
  ctx.lineTo(ax + s * 16, deckHorizonY);
  ctx.lineTo(cx + width * 0.085, deckHorizonY + height * 0.28);
  ctx.lineTo(cx - width * 0.095, deckHorizonY + height * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Warm emergency amber/red caution strip lights along both sides of floor grating
  for (const side of [-1, 1] as const) {
    const x0 = cx + side * (grateBackHalfW + 3);
    const x1 = cx + side * (grateFrontHalfW + 6);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255, 78, 22, 0.20)';
    ctx.lineWidth = Math.max(14, minDim * 0.032);
    ctx.beginPath();
    ctx.moveTo(x0, deckHorizonY + 4);
    ctx.lineTo(x1, height * 0.96);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 118, 36, 0.34)';
    ctx.lineWidth = Math.max(5, minDim * 0.011);
    ctx.beginPath();
    ctx.moveTo(x0, deckHorizonY + 4);
    ctx.lineTo(x1, height * 0.96);
    ctx.stroke();

    const segCount = 12;
    for (let k = 0; k < segCount; k++) {
      const tA = Math.pow(k / segCount, 1.75);
      const tB = Math.pow((k + 0.68) / segCount, 1.75);
      const ax0 = lerp(x0, x1, tA);
      const ay0 = lerp(deckHorizonY + 4, height * 0.95, tA);
      const ax1 = lerp(x0, x1, tB);
      const ay1 = lerp(deckHorizonY + 4, height * 0.95, tB);

      ctx.strokeStyle = 'rgba(255, 198, 92, 0.92)';
      ctx.lineWidth = 1.4 + tA * 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ax0, ay0);
      ctx.lineTo(ax1, ay1);
      ctx.stroke();

      // Horizontal metallic deck reflection from each amber segment
      const reflX = ax0 + side * (6 + tA * 38);
      const reflGrad = ctx.createLinearGradient(ax0, ay0, reflX, ay0);
      reflGrad.addColorStop(0, `rgba(255, 120, 38, ${(0.28 * (1 - tA * 0.55)).toFixed(3)})`);
      reflGrad.addColorStop(1, 'rgba(255, 70, 18, 0)');
      ctx.strokeStyle = reflGrad;
      ctx.lineWidth = 1.2 + tA * 2.8;
      ctx.beginPath();
      ctx.moveTo(ax0, ay0);
      ctx.lineTo(reflX, ay0 + 1);
      ctx.stroke();
    }
    ctx.restore();
  }

  // =========================================================================
  // LAYER 8: HEAVY RIBBED TITANIUM/OBSIDIAN BULKHEAD ARCHES (1-PT PERSPECTIVE)
  // =========================================================================
  const ribCount = 6;
  for (let i = 0; i < ribCount; i++) {
    const isForeground = i === ribCount - 1;
    const depth = Math.pow((i + 0.45) / ribCount, 1.55);
    const outerHalfW = isForeground ? width * 0.56 : lerp(backWallHalfW * 1.12, width * 0.55, depth);
    const ribThickness = lerp(minDim * 0.016, minDim * 0.068, depth);
    const innerHalfW = outerHalfW - ribThickness;

    const topOuterY = isForeground ? -height * 0.02 : lerp(backWallTopY - minDim * 0.015, -height * 0.04, depth);
    const topInnerY = isForeground ? vpTopY * 0.48 : topOuterY + ribThickness * 0.72;
    const botOuterY = lerp(deckHorizonY + minDim * 0.01, height * 1.04, depth);
    const botInnerY = botOuterY - ribThickness * 0.15;

    const oShoulderY = lerp(topOuterY, botOuterY, 0.34);
    const oHipY = lerp(topOuterY, botOuterY, 0.78);
    const iShoulderY = lerp(topInnerY, botInnerY, 0.35);
    const iHipY = lerp(topInnerY, botInnerY, 0.78);

    const innerPath = new Path2D();
    innerPath.moveTo(cx - innerHalfW * 0.76, botInnerY);
    innerPath.lineTo(cx - innerHalfW * 0.96, iHipY);
    innerPath.lineTo(cx - innerHalfW, iShoulderY);
    innerPath.quadraticCurveTo(cx - innerHalfW * 0.62, topInnerY, cx, topInnerY);
    innerPath.quadraticCurveTo(cx + innerHalfW * 0.62, topInnerY, cx + innerHalfW, iShoulderY);
    innerPath.lineTo(cx + innerHalfW * 0.96, iHipY);
    innerPath.lineTo(cx + innerHalfW * 0.76, botInnerY);
    innerPath.closePath();

    const ribGrad = ctx.createLinearGradient(0, topOuterY, 0, botOuterY);
    const shade = Math.round(lerp(24, 9, depth));
    ribGrad.addColorStop(0, `rgb(${shade}, ${shade + 7}, ${shade + 16})`);
    ribGrad.addColorStop(0.55, `rgb(${Math.max(4, shade - 6)}, ${shade}, ${shade + 8})`);
    ribGrad.addColorStop(1, '#020408');

    ctx.save();
    if (!isForeground) {
      ctx.beginPath();
      ctx.rect(0, vpBottomY - sillH * 0.1, width, height - (vpBottomY - sillH * 0.1));
      ctx.clip();
    }

    // Even-odd compound path: outer rib arch minus inner cutout
    ctx.beginPath();
    ctx.moveTo(cx - outerHalfW * 0.82, botOuterY);
    ctx.lineTo(cx - outerHalfW * 1.02, oHipY);
    ctx.lineTo(cx - outerHalfW * 1.04, oShoulderY);
    ctx.quadraticCurveTo(cx - outerHalfW * 0.65, topOuterY, cx, topOuterY);
    ctx.quadraticCurveTo(cx + outerHalfW * 0.65, topOuterY, cx + outerHalfW * 1.04, oShoulderY);
    ctx.lineTo(cx + outerHalfW * 1.02, oHipY);
    ctx.lineTo(cx + outerHalfW * 0.82, botOuterY);
    ctx.closePath();

    ctx.moveTo(cx - innerHalfW * 0.76, botInnerY);
    ctx.lineTo(cx - innerHalfW * 0.96, iHipY);
    ctx.lineTo(cx - innerHalfW, iShoulderY);
    ctx.quadraticCurveTo(cx - innerHalfW * 0.62, topInnerY, cx, topInnerY);
    ctx.quadraticCurveTo(cx + innerHalfW * 0.62, topInnerY, cx + innerHalfW, iShoulderY);
    ctx.lineTo(cx + innerHalfW * 0.96, iHipY);
    ctx.lineTo(cx + innerHalfW * 0.76, botInnerY);
    ctx.closePath();

    ctx.fillStyle = ribGrad;
    ctx.fill('evenodd');

    // Cold cyan rim light along inner edge of each rib
    const rimAlpha = isForeground ? 0.20 : lerp(0.58, 0.22, depth);
    ctx.strokeStyle = `rgba(118, 228, 255, ${rimAlpha.toFixed(3)})`;
    ctx.lineWidth = lerp(1.5, 2.2, depth);
    ctx.stroke(innerPath);

    // Warm emergency amber caution strip embedded on lower rib flanks
    if (!isForeground) {
      for (const side of [-1, 1] as const) {
        const stripX = cx + side * innerHalfW * 0.955;
        const stripY1 = lerp(iShoulderY, iHipY, 0.52);
        const stripY2 = lerp(iShoulderY, iHipY, 0.86);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(255, 92, 28, ${(0.55 - depth * 0.18).toFixed(3)})`;
        ctx.lineWidth = lerp(3.5, 7.5, depth);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(stripX, stripY1);
        ctx.lineTo(stripX, stripY2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 206, 108, 0.9)';
        ctx.lineWidth = lerp(1.1, 2.2, depth);
        ctx.beginPath();
        ctx.moveTo(stripX, stripY1);
        ctx.lineTo(stripX, stripY2);
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  // =========================================================================
  // LAYER 9: VOLUMETRIC LIGHT RAYS, ZERO-G ICE CRYSTALS & ANAMORPHIC FLARE
  // =========================================================================
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  const rayDefs = [
    { spreadTop: -0.05, spreadBot: -0.44, alpha: 0.16 },
    { spreadTop: 0.05, spreadBot: 0.44, alpha: 0.16 },
    { spreadTop: -0.02, spreadBot: -0.22, alpha: 0.22 },
    { spreadTop: 0.02, spreadBot: 0.22, alpha: 0.22 },
    { spreadTop: 0.0, spreadBot: 0.0, alpha: 0.14 },
  ];
  for (const ray of rayDefs) {
    const startX = cx + ray.spreadTop * airlockRx;
    const endX = cx + ray.spreadBot * width;
    const rayTopY = airlockCy - airlockRy * 0.86;
    const rayBotY = height * 0.92;
    const halfSpreadEnd = Math.max(width * 0.08, airlockRx * 0.55);

    const rg = ctx.createLinearGradient(cx, airlockCy, endX, rayBotY);
    rg.addColorStop(0, `rgba(215, 252, 255, ${ray.alpha.toFixed(3)})`);
    rg.addColorStop(0.28, `rgba(92, 224, 255, ${(ray.alpha * 0.62).toFixed(3)})`);
    rg.addColorStop(0.68, `rgba(28, 138, 198, ${(ray.alpha * 0.22).toFixed(3)})`);
    rg.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(startX - gapHalfW * 0.72, rayTopY);
    ctx.lineTo(startX + gapHalfW * 0.72, rayTopY);
    ctx.lineTo(endX + halfSpreadEnd, rayBotY);
    ctx.lineTo(endX - halfSpreadEnd, rayBotY);
    ctx.closePath();
    ctx.fill();
  }

  // Intense atmospheric haze bloom right around the airlock threshold
  const bloomR = Math.max(airlockRx * 2.5, minDim * 0.36);
  const thresholdBloom = ctx.createRadialGradient(
    cx,
    airlockCy - airlockRy * 0.06,
    gapHalfW * 0.2,
    cx,
    airlockCy,
    bloomR,
  );
  thresholdBloom.addColorStop(0, 'rgba(235, 254, 255, 0.52)');
  thresholdBloom.addColorStop(0.22, 'rgba(105, 232, 255, 0.26)');
  thresholdBloom.addColorStop(0.55, 'rgba(28, 132, 192, 0.09)');
  thresholdBloom.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = thresholdBloom;
  ctx.beginPath();
  ctx.arc(cx, airlockCy, bloomR, 0, Math.PI * 2);
  ctx.fill();

  // Drifting zero-g ice crystals & mist particles
  const particleCount = isLandscape ? 210 : 185;
  for (let i = 0; i < particleCount; i++) {
    const spreadT = Math.pow(rng(), 0.72);
    const angle = (rng() - 0.5) * Math.PI * 1.4;
    const dist = spreadT * minDim * 0.52;
    const px = cx + Math.sin(angle) * dist * (isLandscape ? 1.35 : 0.92);
    const py = airlockCy + Math.cos(angle) * dist * 0.65 - airlockRy * 0.15 + rng() * height * 0.18;

    if (py < vpBottomY * 0.85 || py > height * 0.92) continue;

    const pType = rng();
    const fadeByDist = clamp(1 - dist / (minDim * 0.55), 0.12, 1);

    if (pType < 0.74) {
      const pr = 0.5 + rng() * 1.35;
      const isWarmNearFloor = py > deckHorizonY + height * 0.06 && Math.abs(px - cx) > grateBackHalfW * 1.3 && rng() < 0.3;
      ctx.fillStyle = isWarmNearFloor
        ? `rgba(255, 196, 128, ${(0.25 + rng() * 0.45 * fadeByDist).toFixed(3)})`
        : `rgba(218, 251, 255, ${(0.22 + rng() * 0.68 * fadeByDist).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    } else if (pType < 0.92) {
      const dr = 1.4 + rng() * 2.2;
      ctx.fillStyle = `rgba(232, 254, 255, ${(0.38 * fadeByDist).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(px, py - dr);
      ctx.lineTo(px + dr * 0.65, py);
      ctx.lineTo(px, py + dr);
      ctx.lineTo(px - dr * 0.65, py);
      ctx.closePath();
      ctx.fill();
    } else {
      const br = 3.5 + rng() * 7.5;
      const bg = ctx.createRadialGradient(px, py, 0, px, py, br);
      bg.addColorStop(0, `rgba(175, 244, 255, ${(0.20 * fadeByDist).toFixed(3)})`);
      bg.addColorStop(1, 'rgba(90, 210, 255, 0)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(px, py, br, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Subtle anamorphic horizontal lens-flare streak across the airlock opening
  const flareY = airlockCy - airlockRy * 0.24;
  const flareHalfW = width * (isLandscape ? 0.42 : 0.48);

  const flareOuter = ctx.createLinearGradient(cx - flareHalfW, flareY, cx + flareHalfW, flareY);
  flareOuter.addColorStop(0, 'rgba(32, 138, 225, 0)');
  flareOuter.addColorStop(0.28, 'rgba(64, 196, 255, 0.16)');
  flareOuter.addColorStop(0.5, 'rgba(195, 248, 255, 0.46)');
  flareOuter.addColorStop(0.72, 'rgba(64, 196, 255, 0.16)');
  flareOuter.addColorStop(1, 'rgba(32, 138, 225, 0)');
  ctx.fillStyle = flareOuter;
  ctx.fillRect(cx - flareHalfW, flareY - Math.max(4, minDim * 0.008), flareHalfW * 2, Math.max(8, minDim * 0.016));

  const flareCoreHalfW = flareHalfW * 0.78;
  const flareCore = ctx.createLinearGradient(cx - flareCoreHalfW, flareY, cx + flareCoreHalfW, flareY);
  flareCore.addColorStop(0, 'rgba(180, 246, 255, 0)');
  flareCore.addColorStop(0.35, 'rgba(215, 252, 255, 0.42)');
  flareCore.addColorStop(0.5, 'rgba(255, 255, 255, 0.92)');
  flareCore.addColorStop(0.65, 'rgba(215, 252, 255, 0.42)');
  flareCore.addColorStop(1, 'rgba(180, 246, 255, 0)');
  ctx.fillStyle = flareCore;
  ctx.fillRect(cx - flareCoreHalfW, flareY - 1.2, flareCoreHalfW * 2, 2.4);

  ctx.restore(); // End lighter pass

  // =========================================================================
  // LAYER 10: MOODY BOTTOM ~22% LEGIBILITY FALLOFF, VIGNETTE & FILM GRAIN
  // =========================================================================
  const bottomFade = ctx.createLinearGradient(0, height * 0.68, 0, height);
  bottomFade.addColorStop(0, 'rgba(1, 3, 7, 0)');
  bottomFade.addColorStop(0.32, 'rgba(1, 3, 8, 0.52)');
  bottomFade.addColorStop(0.62, 'rgba(1, 2, 6, 0.86)');
  bottomFade.addColorStop(1, 'rgba(1, 2, 5, 0.97)');
  ctx.fillStyle = bottomFade;
  ctx.fillRect(0, height * 0.68, width, height * 0.32);

  // Subtle cinematic edge vignette
  const vig = ctx.createRadialGradient(
    cx,
    height * 0.46,
    minDim * 0.28,
    cx,
    height * 0.48,
    Math.max(width, height) * 0.78,
  );
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(0.68, 'rgba(1, 3, 8, 0.22)');
  vig.addColorStop(1, 'rgba(1, 2, 5, 0.68)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);

  // Fine deterministic procedural film grain
  const grainTile = getGrainTile();
  if (grainTile) {
    const pattern = ctx.createPattern(grainTile, 'repeat');
    if (pattern) {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }

  ctx.restore();
}
