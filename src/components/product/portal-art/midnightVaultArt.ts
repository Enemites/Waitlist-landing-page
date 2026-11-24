/**
 * Midnight Vault — Procedural HTML5 Canvas 2D Artwork
 * Casual Realms World: "Midnight Vault" (Genre: Heist · 90s)
 * Hook: "The laser grid resets in 12 seconds. Your crew just locked you inside."
 *
 * 100% pure procedural Canvas 2D TypeScript. Zero external assets, zero SVGs,
 * deterministic Mulberry32 PRNG, designed for 9:16 portrait (720×1280 retina)
 * and scalable to any width/height.
 */

interface Point {
  x: number;
  y: number;
}

interface LaserBeam {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  intensity: number;
  thickness: number;
  emitterStart?: boolean;
  emitterEnd?: boolean;
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

/** Linear interpolation */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Line segment intersection (returns null if parallel or outside segments) */
function intersectSegments(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number
): Point | null {
  const rX = bx - ax;
  const rY = by - ay;
  const sX = dx - cx;
  const sY = dy - cy;
  const denom = rX * sY - rY * sX;
  if (Math.abs(denom) < 1e-6) return null;
  const t = ((cx - ax) * sY - (cy - ay) * sX) / denom;
  const u = ((cx - ax) * rY - (cy - ay) * rX) / denom;
  if (t > 0.04 && t < 0.96 && u > 0.04 && u < 0.96) {
    return { x: ax + t * rX, y: ay + t * rY };
  }
  return null;
}

/**
 * Renders the "Midnight Vault" neo-noir heist chamber artwork onto a 2D canvas.
 */
export function renderMidnightVault(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  if (width <= 0 || height <= 0) return;

  const rng = createRng(0x90a17c5f);
  const W = width;
  const H = height;
  const U = Math.min(W / 720, H / 1280);

  // Perspective & layout anchors
  const vpX = W * 0.5;
  const vpY = H * 0.435;
  const floorY = H * 0.625;
  const vaultCx = W * 0.5;
  const vaultCy = H * 0.41;
  const vaultR = Math.min(W * 0.225, H * 0.135);

  ctx.save();

  // =========================================================================
  // 1. BASE MIDNIGHT ATMOSPHERE & SKYLIGHT SKY
  // =========================================================================
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0.0, '#070b18');
  bgGrad.addColorStop(0.18, '#0c1326');
  bgGrad.addColorStop(0.42, '#0a0e1a');
  bgGrad.addColorStop(0.62, '#08090f');
  bgGrad.addColorStop(1.0, '#040509');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle midnight moonlight haze in the upper skylight
  const skyHaze = ctx.createRadialGradient(
    W * 0.5,
    H * 0.07,
    U * 10,
    W * 0.5,
    H * 0.12,
    W * 0.68
  );
  skyHaze.addColorStop(0.0, 'rgba(62, 96, 152, 0.34)');
  skyHaze.addColorStop(0.45, 'rgba(28, 46, 84, 0.18)');
  skyHaze.addColorStop(1.0, 'rgba(8, 12, 24, 0)');
  ctx.fillStyle = skyHaze;
  ctx.fillRect(0, 0, W, H * 0.32);

  // =========================================================================
  // 2. GLASS ATRIUM SKYLIGHT — CITY SKYLINE SILHOUETTE & MIDNIGHT RAIN
  // =========================================================================
  drawSkylightAndCity(ctx, W, H, U, vpX, vpY, rng);

  // =========================================================================
  // 3. ARCHITECTURAL VAULT CHAMBER WALLS & COFFERED CEILING PERSPECTIVE
  // =========================================================================
  drawChamberShell(ctx, W, H, U, vpX, vpY, floorY);

  // =========================================================================
  // 4. MASSIVE CIRCULAR MECHANICAL VAULT DOOR (SLIGHTLY AJAR, WARM GOLD GLOW)
  // =========================================================================
  drawVaultPortalAndDoor(ctx, W, H, U, vaultCx, vaultCy, vaultR);

  // =========================================================================
  // 5. TOWERING FLUTED DARK MARBLE & BRUSHED-STEEL COLONNADES (1-POINT PERSP)
  // =========================================================================
  drawColonnades(ctx, W, H, U, vpX, vpY, floorY, vaultCx, vaultCy, rng);

  // =========================================================================
  // 6. VOLUMETRIC WARM-GOLD & AMBER LIGHT SHAFTS FROM AJAR VAULT
  // =========================================================================
  drawVaultLightShafts(ctx, W, H, U, vaultCx, vaultCy, vaultR, floorY);

  // =========================================================================
  // 7. GLOSSY WET DARK-OBSIDIAN FLOOR & AUTHENTIC MIRRORED REFLECTIONS
  // =========================================================================
  const lasers = buildLaserGrid(W, H, floorY);
  const plinthX = W * 0.445;
  const plinthBaseY = H * 0.708;
  const opX = W * 0.315;
  const opBaseY = H * 0.728;

  drawObsidianFloorAndReflections(
    ctx,
    W,
    H,
    U,
    vpX,
    vpY,
    floorY,
    vaultCx,
    vaultCy,
    vaultR,
    plinthX,
    plinthBaseY,
    opX,
    opBaseY,
    lasers
  );

  // =========================================================================
  // 8. INTERSECTING VOLUMETRIC CRIMSON LASER SECURITY BEAMS
  // =========================================================================
  drawLaserGrid(ctx, U, lasers, rng);

  // =========================================================================
  // 9. CYAN HOLOGRAPHIC SECURITY PLINTH
  // =========================================================================
  drawHolographicPlinth(ctx, U, plinthX, plinthBaseY, rng);

  // =========================================================================
  // 10. SLEEK HEIST OPERATIVE SILHOUETTE (HOODED TACTICAL COAT + RIM LIGHTS)
  // =========================================================================
  drawHeistOperative(ctx, U, opX, opBaseY, plinthX, plinthBaseY);

  // =========================================================================
  // 11. FOREGROUND LASER PASS & SUSPENDED ILLUMINATED DUST MOTES
  // =========================================================================
  drawForegroundLasersAndDust(
    ctx,
    W,
    H,
    U,
    vaultCx,
    vaultCy,
    vaultR,
    floorY,
    lasers,
    rng
  );

  // =========================================================================
  // 12. BOTTOM 22% TYPOGRAPHY LEGIBILITY SHADOW, MICRO-VIGNETTE & FILM GRAIN
  // =========================================================================
  drawFinalGradingAndGrain(ctx, W, H, U, rng);

  ctx.restore();
}

/**
 * Draws the arched glass atrium skylight at the top, distant midnight city
 * skyline silhouette with faint lit windows, diagonal rain streaks, and
 * converging neo-noir steel ribs.
 */
function drawSkylightAndCity(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  U: number,
  vpX: number,
  vpY: number,
  rng: () => number
): void {
  const skyBottom = H * 0.255;

  // Clip to the vaulted glass atrium opening
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W * 0.06, 0);
  ctx.lineTo(W * 0.94, 0);
  ctx.lineTo(W * 0.78, skyBottom);
  ctx.lineTo(W * 0.22, skyBottom);
  ctx.closePath();
  ctx.clip();

  // Moody stormy clouds behind skyline
  for (let i = 0; i < 6; i++) {
    const cx = W * (0.15 + rng() * 0.7);
    const cy = H * (0.03 + rng() * 0.14);
    const rx = W * (0.18 + rng() * 0.22);
    const cloud = ctx.createRadialGradient(cx, cy, U * 4, cx, cy, rx);
    cloud.addColorStop(0, 'rgba(78, 108, 158, 0.14)');
    cloud.addColorStop(0.6, 'rgba(30, 48, 82, 0.08)');
    cloud.addColorStop(1, 'rgba(8, 12, 24, 0)');
    ctx.fillStyle = cloud;
    ctx.fillRect(cx - rx, cy - rx * 0.5, rx * 2, rx);
  }

  // Distant city skyline layer (hazy blue-slate)
  const drawCityLayer = (
    count: number,
    baseY: number,
    minH: number,
    maxH: number,
    fill: string,
    windowAlpha: number
  ) => {
    let cursorX = W * 0.05;
    for (let i = 0; i < count; i++) {
      const bw = W * (0.032 + rng() * 0.052);
      const bh = H * (minH + rng() * (maxH - minH));
      const bx = cursorX;
      const by = baseY - bh;

      ctx.fillStyle = fill;
      ctx.fillRect(bx, by, bw, bh + H * 0.05);

      // Spire / stepped penthouse on tall buildings
      if (rng() > 0.55) {
        const crownW = bw * (0.45 + rng() * 0.25);
        const crownH = bh * 0.14;
        ctx.fillRect(bx + (bw - crownW) * 0.5, by - crownH, crownW, crownH);
        if (rng() > 0.5) {
          const spireX = bx + bw * 0.5;
          ctx.fillRect(spireX - U * 0.7, by - crownH - U * 18, U * 1.4, U * 18);
          // Red aviation beacon
          if (rng() > 0.4) {
            ctx.fillStyle = 'rgba(255, 50, 72, 0.85)';
            ctx.beginPath();
            ctx.arc(spireX, by - crownH - U * 18, U * 1.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Micro lit office windows
      if (windowAlpha > 0) {
        const cols = Math.max(2, Math.floor(bw / (U * 6.5)));
        const rows = Math.max(3, Math.floor(bh / (U * 9)));
        for (let r = 1; r < rows - 1; r++) {
          for (let c = 0; c < cols; c++) {
            if (rng() > 0.78) {
              const warm = rng() > 0.42;
              ctx.fillStyle = warm
                ? `rgba(255, 205, 130, ${windowAlpha * (0.4 + rng() * 0.6)})`
                : `rgba(130, 215, 255, ${windowAlpha * (0.35 + rng() * 0.55)})`;
              const wx = bx + (c + 0.35) * (bw / cols);
              const wy = by + r * (bh / rows);
              ctx.fillRect(wx, wy, U * 2.1, U * 3.0);
            }
          }
        }
      }

      cursorX += bw * (0.72 + rng() * 0.38);
      if (cursorX > W * 0.96) break;
    }
  };

  drawCityLayer(22, skyBottom, 0.08, 0.185, '#0f192e', 0.28);
  drawCityLayer(16, skyBottom + H * 0.015, 0.055, 0.135, '#090f1e', 0.42);

  // Subtle cyan-blue rain-mist glow along the glass panes
  const mistGrad = ctx.createLinearGradient(0, 0, 0, skyBottom);
  mistGrad.addColorStop(0, 'rgba(95, 145, 215, 0.09)');
  mistGrad.addColorStop(0.7, 'rgba(38, 64, 110, 0.06)');
  mistGrad.addColorStop(1, 'rgba(10, 14, 24, 0.55)');
  ctx.fillStyle = mistGrad;
  ctx.fillRect(0, 0, W, skyBottom);

  // Diagonal rain streaks on the glass skylight
  ctx.lineCap = 'round';
  for (let i = 0; i < 95; i++) {
    const rx = W * (0.06 + rng() * 0.88);
    const ry = H * (rng() * 0.24);
    const len = U * (14 + rng() * 34);
    const dx = -len * 0.24;
    const dy = len;
    const alpha = 0.07 + rng() * 0.16;
    ctx.strokeStyle = `rgba(175, 215, 255, ${alpha})`;
    ctx.lineWidth = U * (0.65 + rng() * 0.8);
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + dx, ry + dy);
    ctx.stroke();
  }

  // Skylight steel mullion grid (perspective ribs converging to VP + crossbars)
  const ribFracs = [0.06, 0.19, 0.34, 0.5, 0.66, 0.81, 0.94];
  for (const frac of ribFracs) {
    const topX = W * frac;
    const botX = lerp(topX, vpX, 0.46);
    // Steel rib body
    ctx.strokeStyle = '#070a12';
    ctx.lineWidth = U * 6.5;
    ctx.beginPath();
    ctx.moveTo(topX, 0);
    ctx.lineTo(botX, skyBottom);
    ctx.stroke();

    // Brushed steel specular edge
    ctx.strokeStyle = 'rgba(130, 165, 215, 0.22)';
    ctx.lineWidth = U * 1.1;
    ctx.beginPath();
    ctx.moveTo(topX + U * 1.8, 0);
    ctx.lineTo(botX + U * 1.2, skyBottom);
    ctx.stroke();
  }

  // Horizontal curved/arched skylight cross-beams
  const crossYs = [0.055, 0.115, 0.175, 0.228];
  for (let i = 0; i < crossYs.length; i++) {
    const cy = H * crossYs[i];
    const archLift = U * (16 - i * 3);
    ctx.strokeStyle = '#070a12';
    ctx.lineWidth = U * (6.2 - i * 0.8);
    ctx.beginPath();
    ctx.moveTo(W * 0.04, cy + archLift);
    ctx.quadraticCurveTo(vpX, cy - archLift, W * 0.96, cy + archLift);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(145, 180, 225, 0.18)';
    ctx.lineWidth = U * 1.0;
    ctx.beginPath();
    ctx.moveTo(W * 0.04, cy + archLift - U * 2);
    ctx.quadraticCurveTo(vpX, cy - archLift - U * 2, W * 0.96, cy + archLift - U * 2);
    ctx.stroke();
  }

  ctx.restore();

  // Heavy neo-noir architectural cornice framing the skylight
  ctx.fillStyle = '#070a13';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W * 0.075, 0);
  ctx.lineTo(W * 0.23, skyBottom + U * 6);
  ctx.lineTo(0, H * 0.34);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.lineTo(W * 0.925, 0);
  ctx.lineTo(W * 0.77, skyBottom + U * 6);
  ctx.lineTo(W, H * 0.34);
  ctx.closePath();
  ctx.fill();

  // Horizontal transom beam separating skylight from upper vault wall
  const beamGrad = ctx.createLinearGradient(0, skyBottom - U * 6, 0, skyBottom + U * 14);
  beamGrad.addColorStop(0, '#141c2e');
  beamGrad.addColorStop(0.35, '#090d17');
  beamGrad.addColorStop(1, '#05070d');
  ctx.fillStyle = beamGrad;
  ctx.fillRect(W * 0.18, skyBottom - U * 4, W * 0.64, U * 18);

  // Subtle brass accent line under skylight cornice
  ctx.strokeStyle = 'rgba(205, 160, 88, 0.28)';
  ctx.lineWidth = U * 1.2;
  ctx.beginPath();
  ctx.moveTo(W * 0.21, skyBottom + U * 12);
  ctx.lineTo(W * 0.79, skyBottom + U * 12);
  ctx.stroke();
}

/**
 * Draws the recessed back wall, side walls in 1-point perspective,
 * subtle architectural grid lines, and upper ceiling trusses.
 */
function drawChamberShell(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  U: number,
  vpX: number,
  vpY: number,
  floorY: number
): void {
  const backLeft = W * 0.23;
  const backRight = W * 0.77;
  const backTop = H * 0.255;

  // Back wall monolith behind the vault door
  const wallGrad = ctx.createRadialGradient(
    vpX,
    H * 0.41,
    U * 30,
    vpX,
    H * 0.43,
    W * 0.45
  );
  wallGrad.addColorStop(0.0, '#1c1816');
  wallGrad.addColorStop(0.45, '#10131e');
  wallGrad.addColorStop(1.0, '#070911');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(backLeft, backTop, backRight - backLeft, floorY - backTop);

  // Subtle recessed architectural ashlar stone grid on back wall
  ctx.strokeStyle = 'rgba(130, 155, 195, 0.055)';
  ctx.lineWidth = U * 1.0;
  for (let y = backTop + U * 26; y < floorY; y += U * 32) {
    ctx.beginPath();
    ctx.moveTo(backLeft, y);
    ctx.lineTo(backRight, y);
    ctx.stroke();
  }
  for (let x = backLeft + U * 36; x < backRight; x += U * 44) {
    ctx.beginPath();
    ctx.moveTo(x, backTop);
    ctx.lineTo(x, floorY);
    ctx.stroke();
  }

  // Left & right side walls receding in 1-point perspective
  const leftWallGrad = ctx.createLinearGradient(0, floorY * 0.5, backLeft, floorY * 0.5);
  leftWallGrad.addColorStop(0, '#05070e');
  leftWallGrad.addColorStop(0.65, '#0b0f1b');
  leftWallGrad.addColorStop(1, '#121520');
  ctx.fillStyle = leftWallGrad;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.24);
  ctx.lineTo(backLeft, backTop);
  ctx.lineTo(backLeft, floorY);
  ctx.lineTo(0, H * 0.76);
  ctx.closePath();
  ctx.fill();

  const rightWallGrad = ctx.createLinearGradient(W, floorY * 0.5, backRight, floorY * 0.5);
  rightWallGrad.addColorStop(0, '#05070e');
  rightWallGrad.addColorStop(0.65, '#0b0f1b');
  rightWallGrad.addColorStop(1, '#14151e');
  ctx.fillStyle = rightWallGrad;
  ctx.beginPath();
  ctx.moveTo(W, H * 0.24);
  ctx.lineTo(backRight, backTop);
  ctx.lineTo(backRight, floorY);
  ctx.lineTo(W, H * 0.76);
  ctx.closePath();
  ctx.fill();

  // Subtle perspective architectural moldings along side walls
  ctx.strokeStyle = 'rgba(155, 180, 220, 0.08)';
  ctx.lineWidth = U * 1.0;
  const wallFracs = [0.28, 0.42, 0.56, 0.7];
  for (const f of wallFracs) {
    const wy = lerp(backTop, floorY, f);
    // Left wall line
    const lyEdge = vpY + ((wy - vpY) * (0 - vpX)) / (backLeft - vpX);
    ctx.beginPath();
    ctx.moveTo(backLeft, wy);
    ctx.lineTo(0, lyEdge);
    ctx.stroke();
    // Right wall line
    const ryEdge = vpY + ((wy - vpY) * (W - vpX)) / (backRight - vpX);
    ctx.beginPath();
    ctx.moveTo(backRight, wy);
    ctx.lineTo(W, ryEdge);
    ctx.stroke();
  }
}

/**
 * Draws the monumental recessed circular mechanical vault door slightly ajar
 * in the upper-center focal zone, with intense molten gold/amber light spilling
 * from the crescent opening, heavy locking bolts, gears, and spoked wheel.
 */
function drawVaultPortalAndDoor(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  U: number,
  cx: number,
  cy: number,
  R: number
): void {
  // Monumental chamfered architectural stone surround framing the circular vault
  const frameW = R * 2.52;
  const frameH = R * 2.65;
  const frameX = cx - frameW * 0.5;
  const frameY = cy - R * 1.24;

  const surroundGrad = ctx.createLinearGradient(frameX, frameY, frameX + frameW, frameY);
  surroundGrad.addColorStop(0.0, '#070910');
  surroundGrad.addColorStop(0.18, '#141926');
  surroundGrad.addColorStop(0.5, '#1d2029');
  surroundGrad.addColorStop(0.82, '#141926');
  surroundGrad.addColorStop(1.0, '#070910');
  ctx.fillStyle = surroundGrad;
  ctx.fillRect(frameX, frameY, frameW, frameH);

  // Subtle Art Deco stepped bronze trim on the vault surround
  ctx.strokeStyle = 'rgba(218, 168, 86, 0.25)';
  ctx.lineWidth = U * 1.4;
  ctx.strokeRect(frameX + U * 6, frameY + U * 6, frameW - U * 12, frameH - U * 12);

  // Warm ambient light bloom behind the entire vault ring
  const aura = ctx.createRadialGradient(
    cx + R * 0.22,
    cy,
    R * 0.15,
    cx + R * 0.12,
    cy,
    R * 2.25
  );
  aura.addColorStop(0.0, 'rgba(255, 206, 108, 0.52)');
  aura.addColorStop(0.38, 'rgba(245, 145, 38, 0.22)');
  aura.addColorStop(0.7, 'rgba(180, 78, 16, 0.08)');
  aura.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(cx + R * 0.12, cy, R * 2.25, 0, Math.PI * 2);
  ctx.fill();

  // Outer heavy steel & brushed-brass portal casing rings
  const outerRingR = R * 1.15;
  const ringGrad = ctx.createLinearGradient(cx - outerRingR, cy - outerRingR, cx + outerRingR, cy + outerRingR);
  ringGrad.addColorStop(0.0, '#2a3242');
  ringGrad.addColorStop(0.3, '#121620');
  ringGrad.addColorStop(0.55, '#3b3328');
  ringGrad.addColorStop(0.8, '#171b24');
  ringGrad.addColorStop(1.0, '#090b12');
  ctx.fillStyle = ringGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, outerRingR, 0, Math.PI * 2);
  ctx.fill();

  // Precision bolt studs around the outer steel collar
  const studCount = 24;
  for (let i = 0; i < studCount; i++) {
    const a = (i / studCount) * Math.PI * 2;
    const sx = cx + Math.cos(a) * (R * 1.075);
    const sy = cy + Math.sin(a) * (R * 1.075);
    ctx.fillStyle = '#070910';
    ctx.beginPath();
    ctx.arc(sx, sy, U * 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = Math.cos(a) > 0 ? 'rgba(255, 198, 110, 0.55)' : 'rgba(135, 160, 195, 0.32)';
    ctx.beginPath();
    ctx.arc(sx - U * 0.7, sy - U * 0.7, U * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Deep recessed circular vault aperture (filled with incandescent molten gold interior)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.99, 0, Math.PI * 2);
  ctx.clip();

  // Interior golden treasury glow (strongest on the right crescent where door is ajar)
  const innerGlow = ctx.createRadialGradient(
    cx + R * 0.52,
    cy - R * 0.04,
    R * 0.05,
    cx + R * 0.35,
    cy,
    R * 1.25
  );
  innerGlow.addColorStop(0.0, '#fffdf2');
  innerGlow.addColorStop(0.22, '#ffe082');
  innerGlow.addColorStop(0.48, '#f5a623');
  innerGlow.addColorStop(0.78, '#b85a12');
  innerGlow.addColorStop(1.0, '#361508');
  ctx.fillStyle = innerGlow;
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

  // Subtle interior vault shelving / gold bullion bars silhouette inside the glowing chamber
  ctx.fillStyle = 'rgba(130, 58, 10, 0.28)';
  for (let row = -3; row <= 3; row++) {
    const ry = cy + row * (R * 0.24);
    ctx.fillRect(cx + R * 0.25, ry, R * 0.75, U * 4);
  }

  // Inner aperture gear teeth ring (interlocking frame notches)
  ctx.strokeStyle = 'rgba(42, 22, 10, 0.72)';
  ctx.lineWidth = U * 5.5;
  ctx.setLineDash([U * 8, U * 7]);
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.95, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // =========================================================================
  // THE MASSIVE CIRCULAR VAULT DOOR (SWUNG SLIGHTLY AJAR TO THE LEFT)
  // =========================================================================
  // Door center shifted left and horizontally foreshortened (elliptical) to show it swung slightly open
  const doorCx = cx - R * 0.235;
  const doorCy = cy;
  const doorRx = R * 0.855;
  const doorRy = R * 0.945;

  // Heavy cylindrical steel door thickness / edge cylinder (facing the golden opening!)
  const edgeThickness = R * 0.165;
  const edgeGrad = ctx.createLinearGradient(
    doorCx + doorRx * 0.75,
    doorCy - doorRy,
    doorCx + doorRx + edgeThickness,
    doorCy + doorRy
  );
  edgeGrad.addColorStop(0.0, '#2a221c');
  edgeGrad.addColorStop(0.25, '#8c6638');
  edgeGrad.addColorStop(0.5, '#ffd784');
  edgeGrad.addColorStop(0.75, '#7a5228');
  edgeGrad.addColorStop(1.0, '#1e1612');

  ctx.fillStyle = edgeGrad;
  ctx.beginPath();
  ctx.ellipse(doorCx + edgeThickness, doorCy, doorRx, doorRy, 0, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.ellipse(doorCx, doorCy, doorRx, doorRy, 0, Math.PI * 0.5, -Math.PI * 0.5, true);
  ctx.closePath();
  ctx.fill();

  // Protruding massive cylindrical locking bolts along the open steel door edge!
  const boltAngles = [-0.82, -0.42, 0, 0.42, 0.82];
  for (const ang of boltAngles) {
    const bx = doorCx + Math.cos(ang) * doorRx;
    const by = doorCy + Math.sin(ang) * doorRy;
    const boltLen = R * 0.22;
    const boltH = U * 8.5;

    const boltGrad = ctx.createLinearGradient(bx, by - boltH * 0.5, bx, by + boltH * 0.5);
    boltGrad.addColorStop(0.0, '#ffe8b0');
    boltGrad.addColorStop(0.35, '#c48d44');
    boltGrad.addColorStop(0.75, '#3b2919');
    boltGrad.addColorStop(1.0, '#17100c');

    ctx.fillStyle = boltGrad;
    ctx.beginPath();
    ctx.roundRect(bx - U * 2, by - boltH * 0.5, boltLen, boltH, U * 2.5);
    ctx.fill();

    // Hot specular tip on each locking bolt
    ctx.fillStyle = '#fff3cc';
    ctx.beginPath();
    ctx.ellipse(bx + boltLen - U * 2.5, by, U * 2.2, boltH * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Front face of the massive circular vault door (dark brushed gunmetal + brass highlights)
  const faceGrad = ctx.createRadialGradient(
    doorCx + doorRx * 0.45,
    doorCy - doorRy * 0.15,
    R * 0.08,
    doorCx - doorRx * 0.1,
    doorCy,
    doorRy * 1.15
  );
  faceGrad.addColorStop(0.0, '#363b47');
  faceGrad.addColorStop(0.45, '#1b202b');
  faceGrad.addColorStop(0.85, '#0e1118');
  faceGrad.addColorStop(1.0, '#07090e');

  ctx.fillStyle = faceGrad;
  ctx.beginPath();
  ctx.ellipse(doorCx, doorCy, doorRx, doorRy, 0, 0, Math.PI * 2);
  ctx.fill();

  // Concentric machined bevel rings on the vault door face
  const rings = [0.88, 0.72, 0.54, 0.34];
  for (let i = 0; i < rings.length; i++) {
    const f = rings[i];
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(218, 175, 102, 0.24)' : 'rgba(110, 138, 180, 0.18)';
    ctx.lineWidth = U * (i === 0 ? 2.4 : 1.4);
    ctx.beginPath();
    ctx.ellipse(doorCx, doorCy, doorRx * f, doorRy * f, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Precision dial tick marks around the 0.72 ring
  ctx.strokeStyle = 'rgba(235, 192, 118, 0.25)';
  ctx.lineWidth = U * 1.0;
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const inner = i % 3 === 0 ? 0.65 : 0.68;
    ctx.beginPath();
    ctx.moveTo(doorCx + Math.cos(a) * doorRx * inner, doorCy + Math.sin(a) * doorRy * inner);
    ctx.lineTo(doorCx + Math.cos(a) * doorRx * 0.72, doorCy + Math.sin(a) * doorRy * 0.72);
    ctx.stroke();
  }

  // Central mechanical vault wheel (spoked brushed-steel & brass wheel)
  const spokeCount = 6;
  for (let i = 0; i < spokeCount; i++) {
    const a = (i / spokeCount) * Math.PI * 2 + 0.25;
    const sx = doorCx + Math.cos(a) * doorRx * 0.48;
    const sy = doorCy + Math.sin(a) * doorRy * 0.48;

    // Shadow under spoke
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = U * 7.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(doorCx, doorCy + U * 3);
    ctx.lineTo(sx, sy + U * 3);
    ctx.stroke();

    // Metallic spoke body
    ctx.strokeStyle = '#384152';
    ctx.lineWidth = U * 5.2;
    ctx.beginPath();
    ctx.moveTo(doorCx, doorCy);
    ctx.lineTo(sx, sy);
    ctx.stroke();

    // Warm gold rim catchlight on spoke
    ctx.strokeStyle = 'rgba(255, 206, 126, 0.45)';
    ctx.lineWidth = U * 1.3;
    ctx.beginPath();
    ctx.moveTo(doorCx + U * 1, doorCy - U * 1);
    ctx.lineTo(sx + U * 1, sy - U * 1);
    ctx.stroke();
  }

  // Wheel outer rim
  ctx.strokeStyle = '#2d3544';
  ctx.lineWidth = U * 6.5;
  ctx.beginPath();
  ctx.ellipse(doorCx, doorCy, doorRx * 0.48, doorRy * 0.48, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 210, 130, 0.48)';
  ctx.lineWidth = U * 1.5;
  ctx.beginPath();
  ctx.ellipse(doorCx, doorCy, doorRx * 0.48, doorRy * 0.48, 0, -Math.PI * 0.45, Math.PI * 0.45);
  ctx.stroke();

  // Central hub cap
  const hubGrad = ctx.createRadialGradient(
    doorCx + U * 5,
    doorCy - U * 4,
    U * 2,
    doorCx,
    doorCy,
    R * 0.16
  );
  hubGrad.addColorStop(0, '#ffd894');
  hubGrad.addColorStop(0.35, '#7a6342');
  hubGrad.addColorStop(0.75, '#1d222e');
  hubGrad.addColorStop(1, '#090b10');
  ctx.fillStyle = hubGrad;
  ctx.beginPath();
  ctx.ellipse(doorCx, doorCy, doorRx * 0.15, doorRy * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Razor-bright molten gold rim highlight along the right edge of the door face
  ctx.strokeStyle = 'rgba(255, 232, 165, 0.9)';
  ctx.lineWidth = U * 2.2;
  ctx.beginPath();
  ctx.ellipse(doorCx, doorCy, doorRx, doorRy, 0, -Math.PI * 0.46, Math.PI * 0.46);
  ctx.stroke();

  ctx.restore();

  // Heavy steel hinge mechanism on the left side of the vault frame
  const hingeX = cx - R * 1.07;
  const hingeTopY = cy - R * 0.56;
  const hingeBotY = cy + R * 0.56;
  ctx.fillStyle = '#121621';
  ctx.strokeStyle = 'rgba(130, 155, 190, 0.28)';
  ctx.lineWidth = U * 1.2;
  ctx.beginPath();
  ctx.roundRect(hingeX - U * 10, hingeTopY, U * 22, hingeBotY - hingeTopY, U * 4);
  ctx.fill();
  ctx.stroke();

  // Heavy horizontal hinge arms
  for (const hy of [cy - R * 0.36, cy + R * 0.36]) {
    ctx.fillStyle = '#1d2332';
    ctx.beginPath();
    ctx.roundRect(hingeX - U * 6, hy - U * 10, R * 0.36, U * 20, U * 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(218, 175, 108, 0.26)';
    ctx.stroke();
  }

  // Intense bloom right along the golden ajar slit (additive)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const slitBloom = ctx.createRadialGradient(
    cx + R * 0.72,
    cy,
    U * 4,
    cx + R * 0.65,
    cy,
    R * 0.85
  );
  slitBloom.addColorStop(0.0, 'rgba(255, 244, 200, 0.78)');
  slitBloom.addColorStop(0.32, 'rgba(255, 185, 72, 0.34)');
  slitBloom.addColorStop(0.7, 'rgba(220, 108, 22, 0.1)');
  slitBloom.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = slitBloom;
  ctx.beginPath();
  ctx.arc(cx + R * 0.65, cy, R * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Draws 5 pairs of towering fluted dark marble & brushed-steel columns
 * receding in 1-point perspective, complete with Art Deco metallic collars,
 * stepped plinths, ambient occlusion shadows, and warm gold vault rim bounce.
 */
function drawColonnades(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  U: number,
  vpX: number,
  vpY: number,
  floorY: number,
  vaultCx: number,
  vaultCy: number,
  rng: () => number
): void {
  // Depth levels from farthest (0) to closest foreground framing pillars (4)
  const depths = [
    { t: 0.14, xFrac: 0.255, colW: 0.036, topY: 0.245, botY: 0.632, glow: 0.75 },
    { t: 0.32, xFrac: 0.205, colW: 0.048, topY: 0.215, botY: 0.652, glow: 0.62 },
    { t: 0.54, xFrac: 0.142, colW: 0.064, topY: 0.168, botY: 0.684, glow: 0.48 },
    { t: 0.78, xFrac: 0.068, colW: 0.086, topY: 0.095, botY: 0.732, glow: 0.34 },
    { t: 1.0, xFrac: -0.015, colW: 0.112, topY: 0.0, botY: 0.805, glow: 0.22 },
  ];

  // Draw from farthest to nearest so near columns cleanly overlap far ones
  for (let d = 0; d < depths.length; d++) {
    const dep = depths[d];
    const colW = W * dep.colW;
    const topY = H * dep.topY;
    const botY = H * dep.botY;
    const colH = botY - topY;

    // Overhead dark steel transverse ceiling beam connecting left & right columns
    if (d < 4) {
      const beamH = U * (8 + d * 4.5);
      const beamGrad = ctx.createLinearGradient(0, topY, 0, topY + beamH);
      beamGrad.addColorStop(0, '#070a12');
      beamGrad.addColorStop(0.6, '#121826');
      beamGrad.addColorStop(1, '#080b14');
      ctx.fillStyle = beamGrad;
      ctx.fillRect(W * dep.xFrac, topY, W * (1 - dep.xFrac * 2), beamH);

      // Warm underside gold bounce on ceiling beam
      ctx.fillStyle = `rgba(245, 175, 78, ${0.08 + (3 - d) * 0.04})`;
      ctx.fillRect(W * (dep.xFrac + 0.04), topY + beamH - U * 1.8, W * (1 - (dep.xFrac + 0.04) * 2), U * 1.8);
    }

    for (const side of [-1, 1] as const) {
      const isLeft = side === -1;
      const cx = isLeft ? W * dep.xFrac : W * (1 - dep.xFrac);
      const x0 = cx - colW * 0.5;
      const x1 = cx + colW * 0.5;

      // Ambient occlusion shadow cast behind column onto side wall
      const aoW = colW * 0.55;
      const aoGrad = ctx.createLinearGradient(
        isLeft ? x0 - aoW : x1,
        0,
        isLeft ? x0 : x1 + aoW,
        0
      );
      aoGrad.addColorStop(0, isLeft ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.72)');
      aoGrad.addColorStop(1, isLeft ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0)');
      ctx.fillStyle = aoGrad;
      ctx.fillRect(isLeft ? x0 - aoW : x1, topY, aoW, colH);

      // Main cylindrical dark marble shaft gradient (vault-facing side catches warm gold, outer catches cool midnight blue)
      const shaftGrad = ctx.createLinearGradient(x0, 0, x1, 0);
      if (isLeft) {
        shaftGrad.addColorStop(0.0, '#060810');
        shaftGrad.addColorStop(0.25, '#111726');
        shaftGrad.addColorStop(0.55, '#0b0e18');
        shaftGrad.addColorStop(0.84, '#1b1d28');
        shaftGrad.addColorStop(1.0, `rgba(195, 138, 66, ${0.42 * dep.glow})`);
      } else {
        shaftGrad.addColorStop(0.0, `rgba(225, 162, 78, ${0.52 * dep.glow})`);
        shaftGrad.addColorStop(0.16, '#1c1d27');
        shaftGrad.addColorStop(0.45, '#0b0e18');
        shaftGrad.addColorStop(0.75, '#111726');
        shaftGrad.addColorStop(1.0, '#060810');
      }
      ctx.fillStyle = shaftGrad;
      ctx.fillRect(x0, topY, colW, colH);

      // Architectural vertical fluting grooves (5 flutes per column)
      const flutes = 5;
      for (let f = 0; f < flutes; f++) {
        const fx = x0 + ((f + 0.5) / flutes) * colW;
        const fw = (colW / flutes) * 0.44;
        // Dark concave groove
        ctx.fillStyle = 'rgba(3, 5, 10, 0.58)';
        ctx.fillRect(fx - fw * 0.5, topY + colH * 0.08, fw, colH * 0.82);

        // Crisp specular ridge on the vault-facing side of each flute
        const ridgeX = isLeft ? fx + fw * 0.5 : fx - fw * 0.5;
        ctx.fillStyle = `rgba(235, 185, 112, ${0.14 * dep.glow})`;
        ctx.fillRect(ridgeX, topY + colH * 0.08, U * 1.1, colH * 0.82);
      }

      // Subtle dark marble diagonal veining (very restrained)
      ctx.strokeStyle = 'rgba(145, 165, 200, 0.045)';
      ctx.lineWidth = U * 0.9;
      for (let v = 0; v < 2; v++) {
        const vy = topY + colH * (0.25 + rng() * 0.5);
        ctx.beginPath();
        ctx.moveTo(x0 + colW * 0.15, vy);
        ctx.quadraticCurveTo(cx, vy + U * 14, x1 - colW * 0.15, vy + U * 26);
        ctx.stroke();
      }

      // Brushed-steel & muted-brass Art Deco capital & collar bands
      const bandPositions = [0.06, 0.11, 0.86, 0.91];
      for (let b = 0; b < bandPositions.length; b++) {
        const by = topY + colH * bandPositions[b];
        const bh = U * (b === 0 || b === 3 ? 6.5 : 3.2) * (0.7 + dep.t * 0.5);
        const pad = U * (b === 0 || b === 3 ? 3.5 : 1.5);
        const bandGrad = ctx.createLinearGradient(x0 - pad, 0, x1 + pad, 0);
        bandGrad.addColorStop(0.0, '#10141f');
        bandGrad.addColorStop(isLeft ? 0.85 : 0.15, '#594c3a');
        bandGrad.addColorStop(isLeft ? 0.96 : 0.04, `rgba(255, 210, 128, ${0.65 * dep.glow})`);
        bandGrad.addColorStop(1.0, '#0d1019');
        ctx.fillStyle = bandGrad;
        ctx.fillRect(x0 - pad, by, colW + pad * 2, bh);
      }

      // Stepped dark marble plinth base resting on floor
      const plinthH = colH * 0.095;
      const plinthPad = colW * 0.16;
      const plinthGrad = ctx.createLinearGradient(x0 - plinthPad, 0, x1 + plinthPad, 0);
      plinthGrad.addColorStop(0, '#06080f');
      plinthGrad.addColorStop(0.5, '#141926');
      plinthGrad.addColorStop(1, '#070911');
      ctx.fillStyle = plinthGrad;
      ctx.fillRect(x0 - plinthPad, botY - plinthH, colW + plinthPad * 2, plinthH);

      // Razor gold catchlight along the vault-facing inner edge of the column
      const edgeX = isLeft ? x1 - U * 1.1 : x0;
      const rimGrad = ctx.createLinearGradient(0, topY, 0, botY);
      rimGrad.addColorStop(0.0, 'rgba(255, 200, 110, 0)');
      rimGrad.addColorStop(0.35, `rgba(255, 208, 120, ${0.55 * dep.glow})`);
      rimGrad.addColorStop(0.75, `rgba(245, 160, 62, ${0.38 * dep.glow})`);
      rimGrad.addColorStop(1.0, 'rgba(245, 145, 45, 0.06)');
      ctx.fillStyle = rimGrad;
      ctx.fillRect(edgeX, topY, U * 1.6, colH);

      // Subtle vertical cyan security slit lamp recessed on inner wall between columns 1-3
      if (d >= 1 && d <= 3) {
        const slitX = isLeft ? x1 + colW * 0.22 : x0 - colW * 0.22;
        const slitTop = lerp(topY, botY, 0.32);
        const slitBot = lerp(topY, botY, 0.64);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(42, 198, 235, 0.16)';
        ctx.lineWidth = U * 5;
        ctx.beginPath();
        ctx.moveTo(slitX, slitTop);
        ctx.lineTo(slitX, slitBot);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(170, 242, 255, 0.55)';
        ctx.lineWidth = U * 1.2;
        ctx.beginPath();
        ctx.moveTo(slitX, slitTop);
        ctx.lineTo(slitX, slitBot);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // Silence unused warning cleanly while keeping perspective anchors coherent
  void vpX;
  void vpY;
  void floorY;
  void vaultCx;
  void vaultCy;
}

/**
 * Draws volumetric warm-gold & amber god-rays spilling diagonally from the
 * ajar circular vault door across the midnight atrium.
 */
function drawVaultLightShafts(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  U: number,
  vaultCx: number,
  vaultCy: number,
  vaultR: number,
  floorY: number
): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  const slitX = vaultCx + vaultR * 0.64;

  // Primary wide golden light cone pouring from the ajar vault opening onto the floor
  const mainCone = ctx.createLinearGradient(slitX, vaultCy - vaultR * 0.7, W * 0.52, H * 0.88);
  mainCone.addColorStop(0.0, 'rgba(255, 224, 145, 0.34)');
  mainCone.addColorStop(0.32, 'rgba(248, 168, 56, 0.18)');
  mainCone.addColorStop(0.68, 'rgba(210, 108, 22, 0.06)');
  mainCone.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = mainCone;
  ctx.beginPath();
  ctx.moveTo(slitX - vaultR * 0.08, vaultCy - vaultR * 0.85);
  ctx.lineTo(slitX + vaultR * 0.32, vaultCy - vaultR * 0.65);
  ctx.lineTo(W * 0.92, floorY + H * 0.18);
  ctx.lineTo(W * 0.14, floorY + H * 0.16);
  ctx.closePath();
  ctx.fill();

  // Distinct crepuscular light rays broken by the vault locking bolts & door curvature
  const rays = [
    { topOff: -0.78, botX: 0.24, spread: 0.09, alpha: 0.16 },
    { topOff: -0.45, botX: 0.42, spread: 0.12, alpha: 0.22 },
    { topOff: -0.1, botX: 0.56, spread: 0.13, alpha: 0.25 },
    { topOff: 0.28, botX: 0.71, spread: 0.11, alpha: 0.18 },
    { topOff: 0.62, botX: 0.84, spread: 0.09, alpha: 0.12 },
  ];

  for (const ray of rays) {
    const startY = vaultCy + ray.topOff * vaultR;
    const endX = W * ray.botX;
    const endY = floorY + H * 0.14;
    const g = ctx.createLinearGradient(slitX, startY, endX, endY);
    g.addColorStop(0.0, `rgba(255, 232, 160, ${ray.alpha})`);
    g.addColorStop(0.45, `rgba(245, 164, 52, ${ray.alpha * 0.45})`);
    g.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(slitX, startY - U * 8);
    ctx.lineTo(slitX + U * 16, startY + U * 14);
    ctx.lineTo(endX + W * ray.spread, endY);
    ctx.lineTo(endX - W * ray.spread * 0.7, endY);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Defines the intersecting midground crimson laser security grid.
 */
function buildLaserGrid(W: number, H: number, floorY: number): LaserBeam[] {
  return [
    // Upper diagonal security X-web
    { x1: W * 0.17, y1: H * 0.34, x2: W * 0.86, y2: H * 0.56, intensity: 0.92, thickness: 1.0, emitterStart: true, emitterEnd: true },
    { x1: W * 0.84, y1: H * 0.35, x2: W * 0.14, y2: H * 0.58, intensity: 0.95, thickness: 1.05, emitterStart: true, emitterEnd: true },
    // Mid-chamber steep cross-beams
    { x1: W * 0.11, y1: H * 0.44, x2: W * 0.91, y2: H * 0.64, intensity: 1.0, thickness: 1.15, emitterStart: true, emitterEnd: true },
    { x1: W * 0.89, y1: H * 0.45, x2: W * 0.1, y2: H * 0.66, intensity: 0.95, thickness: 1.1, emitterStart: true, emitterEnd: true },
    // Low horizontal-angled tripwire sweeps across vault approach
    { x1: W * 0.05, y1: floorY - H * 0.045, x2: W * 0.95, y2: floorY + H * 0.015, intensity: 0.88, thickness: 0.95, emitterStart: true, emitterEnd: true },
    { x1: W * 0.95, y1: floorY - H * 0.032, x2: W * 0.04, y2: floorY + H * 0.038, intensity: 0.86, thickness: 0.95, emitterStart: true, emitterEnd: true },
    // High perimeter sweep
    { x1: W * 0.21, y1: H * 0.295, x2: W * 0.79, y2: H * 0.415, intensity: 0.62, thickness: 0.78, emitterStart: true, emitterEnd: true },
    // Steep vertical-diagonal guard beam on the right
    { x1: W * 0.74, y1: H * 0.27, x2: W * 0.56, y2: floorY + H * 0.05, intensity: 0.76, thickness: 0.88, emitterStart: true, emitterEnd: false },
  ];
}

/**
 * Draws the glossy wet dark-obsidian floor with 1-point perspective stone tiles,
 * specular sheen, and authentic vertically mirrored reflections of the gold
 * vault glow, columns, red lasers, cyan hologram, and operative.
 */
function drawObsidianFloorAndReflections(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  U: number,
  vpX: number,
  vpY: number,
  floorY: number,
  vaultCx: number,
  vaultCy: number,
  vaultR: number,
  plinthX: number,
  plinthBaseY: number,
  opX: number,
  opBaseY: number,
  lasers: LaserBeam[]
): void {
  const floorH = H - floorY;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, floorY, W, floorH);
  ctx.clip();

  // Base polished obsidian gradient
  const floorGrad = ctx.createLinearGradient(0, floorY, 0, H);
  floorGrad.addColorStop(0.0, '#0c0e16');
  floorGrad.addColorStop(0.25, '#090b12');
  floorGrad.addColorStop(0.62, '#06070d');
  floorGrad.addColorStop(1.0, '#030408');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, floorY, W, floorH);

  // 1. Mirrored Warm-Gold Vault Light Reflection (stretched vertically on wet stone)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const refVaultY = floorY + (floorY - vaultCy) * 0.68;
  const goldRef = ctx.createRadialGradient(
    vaultCx + vaultR * 0.35,
    floorY + U * 12,
    U * 14,
    vaultCx + vaultR * 0.2,
    refVaultY,
    W * 0.48
  );
  goldRef.addColorStop(0.0, 'rgba(255, 218, 128, 0.44)');
  goldRef.addColorStop(0.32, 'rgba(242, 152, 42, 0.22)');
  goldRef.addColorStop(0.65, 'rgba(175, 76, 16, 0.08)');
  goldRef.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = goldRef;
  ctx.fillRect(0, floorY, W, floorH);

  // Vertical wet-sheen specular streaks of the gold vault slit
  for (let i = -3; i <= 3; i++) {
    const sx = vaultCx + vaultR * 0.45 + i * U * 22;
    const sw = U * (14 - Math.abs(i) * 2.2);
    const sg = ctx.createLinearGradient(0, floorY, 0, H * 0.92);
    const peak = 0.24 - Math.abs(i) * 0.045;
    sg.addColorStop(0.0, `rgba(255, 224, 145, ${peak})`);
    sg.addColorStop(0.45, `rgba(240, 150, 42, ${peak * 0.48})`);
    sg.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sg;
    ctx.fillRect(sx - sw * 0.5, floorY, sw, H * 0.32);
  }

  // 2. Mirrored Crimson Laser Reflections shimmering on the wet floor
  for (const b of lasers) {
    const ry1 = floorY + Math.max(0, floorY - b.y1) * 0.72;
    const ry2 = floorY + Math.max(0, floorY - b.y2) * 0.72;
    if (ry1 > H && ry2 > H) continue;

    // Soft diffused reflection glow
    ctx.strokeStyle = `rgba(255, 24, 58, ${0.13 * b.intensity})`;
    ctx.lineWidth = U * 14 * b.thickness;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(b.x1, ry1);
    ctx.lineTo(b.x2, ry2);
    ctx.stroke();

    // Sharper wet-surface ruby glint
    ctx.strokeStyle = `rgba(255, 95, 120, ${0.18 * b.intensity})`;
    ctx.lineWidth = U * 3.2 * b.thickness;
    ctx.beginPath();
    ctx.moveTo(b.x1, ry1);
    ctx.lineTo(b.x2, ry2);
    ctx.stroke();
  }

  // 3. Mirrored Cyan Hologram Reflection Pool under the security plinth
  const cyanRef = ctx.createRadialGradient(
    plinthX,
    plinthBaseY + U * 18,
    U * 6,
    plinthX,
    plinthBaseY + U * 55,
    U * 145
  );
  cyanRef.addColorStop(0.0, 'rgba(65, 238, 255, 0.38)');
  cyanRef.addColorStop(0.4, 'rgba(20, 175, 225, 0.16)');
  cyanRef.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = cyanRef;
  ctx.fillRect(plinthX - U * 160, floorY, U * 320, floorH);
  ctx.restore();

  // 4. Mirrored Dark Column Reflections (vertical dark monolith silhouettes)
  const refColXFracs = [0.255, 0.205, 0.142, 0.068];
  const refColWs = [0.036, 0.048, 0.064, 0.086];
  const refColBotYs = [0.632, 0.652, 0.684, 0.732];
  for (let i = 0; i < refColXFracs.length; i++) {
    const cw = W * refColWs[i];
    const startY = H * refColBotYs[i];
    for (const side of [-1, 1] as const) {
      const cx = side === -1 ? W * refColXFracs[i] : W * (1 - refColXFracs[i]);
      const rg = ctx.createLinearGradient(0, startY, 0, startY + H * 0.22);
      rg.addColorStop(0.0, 'rgba(4, 6, 11, 0.75)');
      rg.addColorStop(0.6, 'rgba(4, 6, 11, 0.35)');
      rg.addColorStop(1.0, 'rgba(4, 6, 11, 0)');
      ctx.fillStyle = rg;
      ctx.fillRect(cx - cw * 0.5, startY, cw, H * 0.22);
    }
  }

  // 5. Subtle Mirrored Silhouette Reflection of the Operative
  const opRefGrad = ctx.createLinearGradient(0, opBaseY, 0, opBaseY + U * 125);
  opRefGrad.addColorStop(0.0, 'rgba(3, 5, 10, 0.78)');
  opRefGrad.addColorStop(0.55, 'rgba(3, 5, 10, 0.36)');
  opRefGrad.addColorStop(1.0, 'rgba(3, 5, 10, 0)');
  ctx.fillStyle = opRefGrad;
  ctx.beginPath();
  ctx.ellipse(opX + U * 10, opBaseY + U * 46, U * 48, U * 56, 0.08, 0, Math.PI * 2);
  ctx.fill();

  // 6. 1-Point Perspective Obsidian Marble Tile Grid Lines
  ctx.strokeStyle = 'rgba(165, 190, 230, 0.09)';
  ctx.lineWidth = U * 1.0;

  // Radial floor seams converging to VP
  const radialSteps = 14;
  for (let i = -radialSteps / 2; i <= radialSteps / 2; i++) {
    const botX = vpX + i * (W * 0.145);
    const topX = vpX + ((botX - vpX) * (floorY - vpY)) / (H - vpY);
    ctx.beginPath();
    ctx.moveTo(topX, floorY);
    ctx.lineTo(botX, H);
    ctx.stroke();
  }

  // Perspective-spaced horizontal tile joints (exponential spacing toward camera)
  const hRows = 11;
  for (let r = 0; r < hRows; r++) {
    const t = r / (hRows - 1);
    const y = floorY + Math.pow(t, 2.05) * floorH;
    const alpha = 0.05 + t * 0.07;
    ctx.strokeStyle = `rgba(175, 200, 238, ${alpha})`;
    ctx.lineWidth = U * (0.7 + t * 0.75);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Crisp horizon crease shadow separating back wall from glossy floor
  const crease = ctx.createLinearGradient(0, floorY, 0, floorY + U * 16);
  crease.addColorStop(0, 'rgba(0, 0, 0, 0.82)');
  crease.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = crease;
  ctx.fillRect(0, floorY, W, U * 16);

  ctx.restore();
}

/**
 * Renders the intersecting volumetric crimson laser security beams using
 * multi-pass additive ('lighter') blending: wide atmospheric halo, vivid ruby
 * mid-glow, razor-hot core, emitter nodes, and intersection flares.
 */
function drawLaserGrid(
  ctx: CanvasRenderingContext2D,
  U: number,
  lasers: LaserBeam[],
  rng: () => number
): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';

  for (const b of lasers) {
    // Pass 1: Wide soft atmospheric crimson halo
    ctx.strokeStyle = `rgba(215, 14, 48, ${0.14 * b.intensity})`;
    ctx.lineWidth = U * 20 * b.thickness;
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();

    // Pass 2: Medium vivid ruby-crimson glow
    ctx.strokeStyle = `rgba(255, 28, 64, ${0.42 * b.intensity})`;
    ctx.lineWidth = U * 7.2 * b.thickness;
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();

    // Pass 3: Razor-sharp hot white-pink core
    ctx.strokeStyle = `rgba(255, 224, 230, ${0.95 * b.intensity})`;
    ctx.lineWidth = U * 1.75 * b.thickness;
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();

    // Wall-mounted emitter node flares
    if (b.emitterStart) drawLaserFlare(ctx, U, b.x1, b.y1, 1.0 * b.intensity);
    if (b.emitterEnd) drawLaserFlare(ctx, U, b.x2, b.y2, 0.9 * b.intensity);

    // Subtle dust glints suspended directly along the laser beam path
    const motes = 7;
    for (let m = 0; m < motes; m++) {
      const t = 0.08 + rng() * 0.84;
      const mx = lerp(b.x1, b.x2, t) + (rng() - 0.5) * U * 4;
      const my = lerp(b.y1, b.y2, t) + (rng() - 0.5) * U * 4;
      const mr = U * (1.2 + rng() * 2.2);
      ctx.fillStyle = `rgba(255, 195, 208, ${0.55 + rng() * 0.4})`;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Bright optical flares where laser beams intersect each other
  for (let i = 0; i < lasers.length; i++) {
    for (let j = i + 1; j < lasers.length; j++) {
      const a = lasers[i];
      const c = lasers[j];
      const hit = intersectSegments(a.x1, a.y1, a.x2, a.y2, c.x1, c.y1, c.x2, c.y2);
      if (hit) {
        drawLaserFlare(ctx, U, hit.x, hit.y, 0.72);
      }
    }
  }

  ctx.restore();
}

/** Draws a crisp additive crimson optical flare with subtle horizontal anamorphic streak. */
function drawLaserFlare(
  ctx: CanvasRenderingContext2D,
  U: number,
  x: number,
  y: number,
  strength: number
): void {
  const r = U * 18 * strength;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0.0, `rgba(255, 240, 245, ${0.95 * strength})`);
  g.addColorStop(0.28, `rgba(255, 42, 76, ${0.55 * strength})`);
  g.addColorStop(1.0, 'rgba(255, 0, 35, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Thin horizontal anamorphic glint
  ctx.strokeStyle = `rgba(255, 170, 185, ${0.5 * strength})`;
  ctx.lineWidth = U * 1.1;
  ctx.beginPath();
  ctx.moveTo(x - r * 1.3, y);
  ctx.lineTo(x + r * 1.3, y);
  ctx.stroke();
}

/**
 * Draws the sleek dark-steel security plinth in the midground projecting a
 * crisp glowing cyan holographic vault schematic & security countdown ring.
 */
function drawHolographicPlinth(
  ctx: CanvasRenderingContext2D,
  U: number,
  px: number,
  baseY: number,
  rng: () => number
): void {
  const plinthH = U * 92;
  const topY = baseY - plinthH;
  const baseW = U * 52;
  const topW = U * 38;

  // Ground contact ambient occlusion shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
  ctx.beginPath();
  ctx.ellipse(px, baseY + U * 3, baseW * 0.85, U * 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tapered obsidian & brushed-steel security pedestal body
  const bodyGrad = ctx.createLinearGradient(px - baseW * 0.5, topY, px + baseW * 0.5, baseY);
  bodyGrad.addColorStop(0.0, '#1e2738');
  bodyGrad.addColorStop(0.32, '#101522');
  bodyGrad.addColorStop(0.75, '#090c14');
  bodyGrad.addColorStop(1.0, '#2a221c');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(px - topW * 0.5, topY);
  ctx.lineTo(px + topW * 0.5, topY);
  ctx.lineTo(px + baseW * 0.5, baseY);
  ctx.lineTo(px - baseW * 0.5, baseY);
  ctx.closePath();
  ctx.fill();

  // Sleek chamfered front face panel
  ctx.strokeStyle = 'rgba(72, 224, 255, 0.35)';
  ctx.lineWidth = U * 1.2;
  ctx.beginPath();
  ctx.moveTo(px - topW * 0.32, topY + U * 10);
  ctx.lineTo(px + topW * 0.32, topY + U * 10);
  ctx.lineTo(px + baseW * 0.36, baseY - U * 10);
  ctx.lineTo(px - baseW * 0.36, baseY - U * 10);
  ctx.closePath();
  ctx.stroke();

  // Glowing cyan vertical status indicator bar on the plinth face
  ctx.fillStyle = 'rgba(75, 240, 255, 0.85)';
  ctx.fillRect(px - U * 1.5, topY + U * 22, U * 3, U * 34);

  // Illuminated top emitter bezel
  ctx.fillStyle = '#0c1622';
  ctx.beginPath();
  ctx.ellipse(px, topY, topW * 0.54, U * 7.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#6cf4ff';
  ctx.lineWidth = U * 1.8;
  ctx.beginPath();
  ctx.ellipse(px, topY, topW * 0.44, U * 5.6, 0, 0, Math.PI * 2);
  ctx.stroke();

  // =========================================================================
  // VOLUMETRIC CYAN HOLOGRAPHIC PROJECTION ABOVE PLINTH
  // =========================================================================
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  const holoCy = topY - U * 64;

  // Upward volumetric cyan projection cone
  const coneGrad = ctx.createLinearGradient(px, topY, px, topY - U * 135);
  coneGrad.addColorStop(0.0, 'rgba(62, 242, 255, 0.52)');
  coneGrad.addColorStop(0.45, 'rgba(28, 205, 248, 0.2)');
  coneGrad.addColorStop(1.0, 'rgba(15, 160, 220, 0)');
  ctx.fillStyle = coneGrad;
  ctx.beginPath();
  ctx.moveTo(px - topW * 0.38, topY);
  ctx.lineTo(px + topW * 0.38, topY);
  ctx.lineTo(px + U * 66, topY - U * 132);
  ctx.lineTo(px - U * 66, topY - U * 132);
  ctx.closePath();
  ctx.fill();

  // Ambient cyan halo around the holographic core
  const holoHalo = ctx.createRadialGradient(px, holoCy, U * 4, px, holoCy, U * 78);
  holoHalo.addColorStop(0.0, 'rgba(145, 252, 255, 0.58)');
  holoHalo.addColorStop(0.4, 'rgba(35, 215, 255, 0.22)');
  holoHalo.addColorStop(1.0, 'rgba(0, 140, 200, 0)');
  ctx.fillStyle = holoHalo;
  ctx.beginPath();
  ctx.arc(px, holoCy, U * 78, 0, Math.PI * 2);
  ctx.fill();

  // Floating holographic tilted concentric security rings
  const ringConfigs = [
    { rx: 38, ry: 13, rot: -0.18, yOff: 12, dash: [8, 4], alpha: 0.72 },
    { rx: 30, ry: 10, rot: 0.14, yOff: -4, dash: [14, 5], alpha: 0.85 },
    { rx: 46, ry: 15, rot: -0.06, yOff: -18, dash: [4, 6], alpha: 0.48 },
  ];
  for (const rc of ringConfigs) {
    ctx.save();
    ctx.translate(px, holoCy + U * rc.yOff);
    ctx.rotate(rc.rot);
    ctx.strokeStyle = `rgba(118, 246, 255, ${rc.alpha})`;
    ctx.lineWidth = U * 1.4;
    ctx.setLineDash(rc.dash.map((d) => d * U));
    ctx.beginPath();
    ctx.ellipse(0, 0, U * rc.rx, U * rc.ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.setLineDash([]);

  // Floating 3D isometric wireframe security diamond/octahedron inside hologram
  const size = U * 20;
  const topP = { x: px, y: holoCy - size * 1.35 };
  const botP = { x: px, y: holoCy + size * 1.15 };
  const midL = { x: px - size * 1.05, y: holoCy - size * 0.1 };
  const midR = { x: px + size * 1.05, y: holoCy - size * 0.1 };
  const midF = { x: px + size * 0.15, y: holoCy + size * 0.3 };
  const midB = { x: px - size * 0.15, y: holoCy - size * 0.45 };

  ctx.strokeStyle = 'rgba(185, 253, 255, 0.92)';
  ctx.lineWidth = U * 1.45;
  const edges: [Point, Point][] = [
    [topP, midL], [topP, midR], [topP, midF], [topP, midB],
    [botP, midL], [botP, midR], [botP, midF], [botP, midB],
    [midL, midF], [midF, midR], [midR, midB], [midB, midL],
  ];
  ctx.beginPath();
  for (const [a, b] of edges) {
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
  }
  ctx.stroke();

  // Holographic floating HUD data bars (side interface readouts)
  for (let i = 0; i < 4; i++) {
    const by = holoCy - U * 22 + i * U * 9;
    const bw = U * (14 + ((i * 7) % 15));
    ctx.fillStyle = `rgba(110, 245, 255, ${0.42 + (i % 2) * 0.28})`;
    ctx.fillRect(px - U * 52, by, bw, U * 2.4);
    ctx.fillRect(px + U * 36, by + U * 4, bw * 0.85, U * 2.4);
  }

  // Rising cyan holographic data motes
  for (let i = 0; i < 18; i++) {
    const mx = px + (rng() - 0.5) * U * 82;
    const my = topY - U * (10 + rng() * 115);
    const mr = U * (1.0 + rng() * 1.6);
    ctx.fillStyle = `rgba(160, 250, 255, ${0.35 + rng() * 0.55})`;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draws a crisp, anatomically grounded dramatic silhouette of a sleek heist
 * operative crouching beside the holographic security plinth — hooded tactical
 * coat, structured collar, bent legs, gloved hand reaching toward the hologram,
 * and multi-directional gold, cyan, and crimson rim lighting.
 */
function drawHeistOperative(
  ctx: CanvasRenderingContext2D,
  U: number,
  ox: number,
  baseY: number,
  plinthX: number,
  plinthBaseY: number
): void {
  // Grounded contact shadow beneath crouched boots and coat hem
  ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
  ctx.beginPath();
  ctx.ellipse(ox + U * 8, baseY + U * 4, U * 64, U * 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(ox, baseY);

  // Relative helper for clean anatomical proportions (scale S = U)
  const s = U;

  // --- BACK LEG (bent kneeling right leg) ---
  ctx.fillStyle = '#070910';
  ctx.beginPath();
  ctx.moveTo(14 * s, -48 * s);
  ctx.quadraticCurveTo(36 * s, -44 * s, 40 * s, -22 * s);
  ctx.lineTo(36 * s, -4 * s);
  ctx.lineTo(48 * s, 0);
  ctx.lineTo(24 * s, 1 * s);
  ctx.lineTo(20 * s, -18 * s);
  ctx.lineTo(2 * s, -32 * s);
  ctx.closePath();
  ctx.fill();

  // --- MAIN HOODED TACTICAL COAT & CROUCHING BODY SILHOUETTE ---
  // Rich dark charcoal-obsidian coat gradient
  const coatGrad = ctx.createLinearGradient(-48 * s, -148 * s, 56 * s, 0);
  coatGrad.addColorStop(0.0, '#121521');
  coatGrad.addColorStop(0.45, '#090b13');
  coatGrad.addColorStop(0.85, '#06080f');
  coatGrad.addColorStop(1.0, '#0c1320');
  ctx.fillStyle = coatGrad;

  ctx.beginPath();
  // Start at top of structured hood
  ctx.moveTo(8 * s, -144 * s);
  // Front hood peak & visor profile facing right toward the hologram
  ctx.bezierCurveTo(22 * s, -145 * s, 30 * s, -136 * s, 32 * s, -124 * s);
  // Subtle recessed face/mask chin line
  ctx.lineTo(26 * s, -114 * s);
  ctx.lineTo(30 * s, -106 * s);
  // Structured high tactical collar & chest
  ctx.bezierCurveTo(36 * s, -102 * s, 42 * s, -94 * s, 44 * s, -82 * s);
  // Outstretched right forearm & gloved hand reaching toward the cyan hologram
  ctx.lineTo(66 * s, -88 * s);
  ctx.lineTo(76 * s, -93 * s);
  ctx.lineTo(79 * s, -89 * s);
  ctx.lineTo(68 * s, -80 * s);
  ctx.lineTo(42 * s, -71 * s);
  // Front coat lapel sweeping down over crouched front knee
  ctx.bezierCurveTo(44 * s, -54 * s, 42 * s, -36 * s, 28 * s, -22 * s);
  // Front tactical boot planted firmly
  ctx.lineTo(20 * s, -4 * s);
  ctx.lineTo(34 * s, 1 * s);
  ctx.lineTo(3 * s, 2 * s);
  ctx.lineTo(-2 * s, -16 * s);
  // Sweeping neo-noir tactical trench coat tail draping dramatically behind
  ctx.bezierCurveTo(-18 * s, -10 * s, -38 * s, -4 * s, -58 * s, -2 * s);
  ctx.bezierCurveTo(-50 * s, -24 * s, -44 * s, -52 * s, -36 * s, -78 * s);
  // Arched crouched back & shoulder blade
  ctx.bezierCurveTo(-30 * s, -102 * s, -18 * s, -122 * s, -6 * s, -134 * s);
  // Back of hood curving up to crown
  ctx.bezierCurveTo(-2 * s, -141 * s, 2 * s, -144 * s, 8 * s, -144 * s);
  ctx.closePath();
  ctx.fill();

  // Subtle internal coat fold shading for sculptural depth (Spider-Verse / neo-noir angular planes)
  ctx.fillStyle = 'rgba(22, 30, 48, 0.45)';
  ctx.beginPath();
  ctx.moveTo(-4 * s, -116 * s);
  ctx.lineTo(14 * s, -92 * s);
  ctx.lineTo(6 * s, -34 * s);
  ctx.lineTo(-22 * s, -16 * s);
  ctx.lineTo(-16 * s, -74 * s);
  ctx.closePath();
  ctx.fill();

  // Secondary braced left arm silhouette holding balance near knee
  ctx.fillStyle = '#06080f';
  ctx.beginPath();
  ctx.moveTo(-6 * s, -98 * s);
  ctx.quadraticCurveTo(-18 * s, -70 * s, -6 * s, -46 * s);
  ctx.lineTo(10 * s, -36 * s);
  ctx.lineTo(14 * s, -44 * s);
  ctx.lineTo(4 * s, -64 * s);
  ctx.lineTo(8 * s, -92 * s);
  ctx.closePath();
  ctx.fill();

  // Subtle glowing tactical visor / optic lens glint inside the hood shadow
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = 'rgba(105, 245, 255, 0.9)';
  ctx.beginPath();
  ctx.ellipse(25.5 * s, -121 * s, 3.2 * s, 1.3 * s, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // --- RIM LIGHT 1: WARM GOLD-AMBER VAULT LIGHT ON UPPER HOOD, BACK & SHOULDER ---
  ctx.strokeStyle = 'rgba(255, 212, 128, 0.88)';
  ctx.lineWidth = 2.2 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(26 * s, -137 * s);
  ctx.bezierCurveTo(18 * s, -145 * s, 2 * s, -144 * s, -6 * s, -134 * s);
  ctx.bezierCurveTo(-18 * s, -122 * s, -30 * s, -100 * s, -36 * s, -76 * s);
  ctx.stroke();

  // Softer warm gold secondary rim halo
  ctx.strokeStyle = 'rgba(245, 162, 54, 0.35)';
  ctx.lineWidth = 5.5 * s;
  ctx.beginPath();
  ctx.moveTo(22 * s, -140 * s);
  ctx.bezierCurveTo(6 * s, -145 * s, -14 * s, -128 * s, -32 * s, -84 * s);
  ctx.stroke();

  // --- RIM LIGHT 2: CRISP CYAN HOLOGRAM BOUNCE ON FRONT HOOD, CHEST & OUTSTRETCHED ARM ---
  ctx.strokeStyle = 'rgba(112, 248, 255, 0.92)';
  ctx.lineWidth = 2.1 * s;
  ctx.beginPath();
  ctx.moveTo(29 * s, -131 * s);
  ctx.lineTo(32 * s, -124 * s);
  ctx.lineTo(27 * s, -114 * s);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(33 * s, -104 * s);
  ctx.quadraticCurveTo(41 * s, -94 * s, 44 * s, -82 * s);
  ctx.lineTo(66 * s, -88 * s);
  ctx.lineTo(77 * s, -92 * s);
  ctx.stroke();

  // Cyan bounce along front knee & coat lapel
  ctx.strokeStyle = 'rgba(65, 228, 255, 0.62)';
  ctx.lineWidth = 1.8 * s;
  ctx.beginPath();
  ctx.moveTo(43 * s, -66 * s);
  ctx.bezierCurveTo(44 * s, -48 * s, 39 * s, -33 * s, 27 * s, -22 * s);
  ctx.stroke();

  // --- RIM LIGHT 3: SUBTLE CRIMSON LASER GLINT ON LOWER COAT TAIL & BOOT ---
  ctx.strokeStyle = 'rgba(255, 58, 92, 0.68)';
  ctx.lineWidth = 1.8 * s;
  ctx.beginPath();
  ctx.moveTo(-38 * s, -66 * s);
  ctx.bezierCurveTo(-45 * s, -44 * s, -52 * s, -22 * s, -57 * s, -3 * s);
  ctx.stroke();

  ctx.restore();
  ctx.restore();

  // Subtle holographic interface data-stream connecting operative's outstretched hand to plinth hologram
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const handX = ox + 78 * U;
  const handY = baseY - 91 * U;
  const holoTargetX = plinthX - 18 * U;
  const holoTargetY = plinthBaseY - 146 * U;

  const linkGrad = ctx.createLinearGradient(handX, handY, holoTargetX, holoTargetY);
  linkGrad.addColorStop(0, 'rgba(130, 250, 255, 0.65)');
  linkGrad.addColorStop(1, 'rgba(55, 225, 255, 0.15)');
  ctx.strokeStyle = linkGrad;
  ctx.lineWidth = U * 1.1;
  ctx.setLineDash([U * 4, U * 4]);
  ctx.beginPath();
  ctx.moveTo(handX, handY);
  ctx.lineTo(holoTargetX, holoTargetY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

/**
 * Adds a foreground laser beam sweeping slightly in front of the midground
 * for layered 3D parallax depth, plus illuminated atmospheric dust motes
 * suspended in the gold vault shafts.
 */
function drawForegroundLasersAndDust(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  U: number,
  vaultCx: number,
  vaultCy: number,
  vaultR: number,
  floorY: number,
  lasers: LaserBeam[],
  rng: () => number
): void {
  void lasers;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // One sleek foreground diagonal laser beam crossing the lower-right approach
  const fgX1 = W * 0.99;
  const fgY1 = H * 0.565;
  const fgX2 = W * 0.48;
  const fgY2 = H * 0.775;

  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(220, 16, 48, 0.15)';
  ctx.lineWidth = U * 24;
  ctx.beginPath();
  ctx.moveTo(fgX1, fgY1);
  ctx.lineTo(fgX2, fgY2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 32, 68, 0.42)';
  ctx.lineWidth = U * 7.5;
  ctx.beginPath();
  ctx.moveTo(fgX1, fgY1);
  ctx.lineTo(fgX2, fgY2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 225, 232, 0.92)';
  ctx.lineWidth = U * 1.8;
  ctx.beginPath();
  ctx.moveTo(fgX1, fgY1);
  ctx.lineTo(fgX2, fgY2);
  ctx.stroke();

  // Illuminated golden dust motes floating inside the warm vault light cone
  const moteCount = 72;
  for (let i = 0; i < moteCount; i++) {
    const t = rng();
    const spread = lerp(vaultR * 0.65, W * 0.42, t);
    const mx = vaultCx + vaultR * 0.35 + (rng() - 0.45) * spread * 2;
    const my = lerp(vaultCy - vaultR * 0.55, floorY + H * 0.12, t);
    const r = U * (0.9 + rng() * 2.4);
    const alpha = (1 - t * 0.55) * (0.28 + rng() * 0.55);

    ctx.fillStyle = `rgba(255, 222, 148, ${alpha})`;
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Applies the moody bottom ~22% card-typography legibility gradient,
 * subtle editorial micro-vignette, and fast tiled procedural film grain.
 */
function drawFinalGradingAndGrain(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  U: number,
  rng: () => number
): void {
  // 1. Bottom ~22% naturally dark/moody gradient for razor-legible white card typography
  const bottomGrad = ctx.createLinearGradient(0, H * 0.72, 0, H);
  bottomGrad.addColorStop(0.0, 'rgba(4, 6, 12, 0)');
  bottomGrad.addColorStop(0.28, 'rgba(4, 6, 12, 0.62)');
  bottomGrad.addColorStop(0.58, 'rgba(4, 5, 10, 0.9)');
  bottomGrad.addColorStop(1.0, 'rgba(3, 4, 8, 0.98)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, H * 0.72, W, H * 0.28);

  // 2. Editorial micro-vignette focusing attention onto the vault & operative
  const vig = ctx.createRadialGradient(
    W * 0.5,
    H * 0.45,
    Math.min(W, H) * 0.28,
    W * 0.5,
    H * 0.48,
    Math.max(W, H) * 0.72
  );
  vig.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(0.7, 'rgba(2, 4, 9, 0.26)');
  vig.addColorStop(1.0, 'rgba(2, 3, 7, 0.68)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // 3. Tasteful low-opacity procedural film grain (fast 128×128 deterministic tile)
  const tileSize = 128;
  let grainCanvas: HTMLCanvasElement | OffscreenCanvas | null = null;
  if (typeof OffscreenCanvas !== 'undefined') {
    grainCanvas = new OffscreenCanvas(tileSize, tileSize);
  } else if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = tileSize;
    c.height = tileSize;
    grainCanvas = c;
  }

  if (grainCanvas) {
    const gCtx = grainCanvas.getContext('2d') as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null;
    if (gCtx) {
      const img = gCtx.createImageData(tileSize, tileSize);
      const data = img.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = (rng() * 255) | 0;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 16; // Low-opacity tactile editorial grain
      }
      gCtx.putImageData(img, 0, 0);

      const pattern = ctx.createPattern(grainCanvas, 'repeat');
      if (pattern) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    }
  }

  void U;
}
