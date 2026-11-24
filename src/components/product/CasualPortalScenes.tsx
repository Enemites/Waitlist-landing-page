import { useEffect, useRef } from "react";
import type { PlayId } from "./CasualReel";
import { renderMidnightVault } from "./portal-art/midnightVaultArt";
import { renderSignalZero } from "./portal-art/signalZeroArt";
import { renderCrownfall } from "./portal-art/crownfallArt";

/*
 * High-craft procedural HTML5 Canvas 2D renderer for the Casual Realms worlds.
 * Each world is painted once onto a retina-resolution canvas on mount, then composited
 * as a static GPU texture so scrolling & hover remain locked at 60fps with zero per-frame cost.
 */

const renderers: Record<PlayId, (ctx: CanvasRenderingContext2D, w: number, h: number) => void> = {
  rooftop: renderMidnightVault,
  archive: renderSignalZero,
  snowball: renderCrownfall,
};

export default function CasualPortalArt({
  world,
  wide = false,
}: {
  world: PlayId;
  wide?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const w = wide ? 1440 : 720;
  const h = wide ? 900 : 1280;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    renderers[world](ctx, w, h);
    ctx.restore();
  }, [world, w, h]);

  return (
    <canvas
      ref={canvasRef}
      width={w}
      height={h}
      className={wide ? "casual-portal-world-art" : "casual-portal-art"}
      aria-hidden="true"
    />
  );
}
