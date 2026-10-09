import { useEffect, useRef } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";

/** A decorative decision field. Pointer input changes the projection, never the page state. */
export default function ArenaScene({ className = "" }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const host = root.current;
    const surface = canvas.current;
    const art = host?.querySelector<HTMLImageElement>(".arena-scene-art");
    if (!host || !surface) return;
    const context = surface.getContext("2d");
    if (!context) return;
    let width = 0, height = 0, frame = 0, visible = true, last = 0;
    let targetX = 0, targetY = 0, x = 0, y = 0;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const animate = !reduce && finePointer;
    const points = Array.from({ length: 28 }, (_, i) => {
      const a = i * 2.399963;
      const z = 1 - (i / 27) * 2;
      const r = Math.sqrt(1 - z * z);
      return { x: Math.cos(a) * r, y: z, z: Math.sin(a) * r };
    });
    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      surface.width = Math.round(width * ratio);
      surface.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (!animate) draw(0);
    });
    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      x += (targetX - x) * 0.045;
      y += (targetY - y) * 0.045;
      const turn = reduce ? 0.25 : time * 0.000018 + x * 0.16;
      const scale = Math.min(width * 0.27, height * 0.37);
      const projected = points.map(p => {
        const dx = p.x * Math.cos(turn) - p.z * Math.sin(turn);
        const depth = p.x * Math.sin(turn) + p.z * Math.cos(turn);
        return { x: width * 0.66 + dx * scale, y: height * 0.48 + (p.y + y * 0.1) * scale * 0.78, depth };
      });
      for (let i = 0; i < projected.length; i++) {
        const a = projected[i];
        for (let j = i + 1; j < projected.length; j++) {
          const b = projected[j];
          const distance = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y, points[i].z - points[j].z);
          if (distance > 0.78 || a.depth < -0.55 || b.depth < -0.55) continue;
          context.strokeStyle = `rgba(196,237,108,${0.07 + Math.max(0, a.depth) * 0.09})`;
          context.lineWidth = 0.6;
          context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke();
          if ((i + j) % 6 === 0) {
            const t = reduce ? 0.5 : (time * 0.00009 + i * 0.14) % 1;
            context.fillStyle = "rgba(220,249,166,.8)";
            context.beginPath(); context.arc(a.x + (b.x-a.x)*t, a.y+(b.y-a.y)*t, 1.5, 0, Math.PI*2); context.fill();
          }
        }
        if (a.depth > -0.3) {
          context.fillStyle = `rgba(196,237,108,${0.28 + Math.max(0,a.depth)*0.55})`;
          context.beginPath(); context.arc(a.x,a.y,i%4===0?2.4:1.2,0,Math.PI*2); context.fill();
          if(i%7===0){context.strokeStyle="rgba(196,237,108,.25)";context.beginPath();context.arc(a.x,a.y,8,0,Math.PI*2);context.stroke();}
        }
      }
      if (animate && art) art.style.transform = `translate3d(${x * 12}px,${y * 8}px,0) scale(1.025)`;
    };
    const tick = (time: number) => {
      if (visible && !document.hidden && time-last>32) { draw(time); last=time; }
      frame=requestAnimationFrame(tick);
    };
    const move = (event: PointerEvent) => {
      if (!finePointer || reduce) return;
      const rect=host.getBoundingClientRect();
      targetX=((event.clientX-rect.left)/rect.width-.5)*2;
      targetY=((event.clientY-rect.top)/rect.height-.5)*2;
    };
    const leave = () => {targetX=0;targetY=0;};
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;},{rootMargin:"80px"});
    resize.observe(host); observer.observe(host);
    host.addEventListener("pointermove",move,{passive:true});host.addEventListener("pointerleave",leave);
    if(animate)frame=requestAnimationFrame(tick);
    return()=>{resize.disconnect();observer.disconnect();cancelAnimationFrame(frame);host.removeEventListener("pointermove",move);host.removeEventListener("pointerleave",leave);if(art)art.style.removeProperty("transform");};
  }, [reduce]);

  return <div ref={root} className={`arena-scene ${className}`} aria-hidden="true">
    <picture>
      <source type="image/avif" srcSet="/assets/arena-world-960.avif 960w, /assets/arena-world-1672.avif 1672w" sizes="(max-width:767px) 1500px, 100vw" />
      <img src="/assets/arena-world-1672.webp" className="arena-scene-art" alt="" fetchPriority="high" width="1672" height="941" />
    </picture>
    <canvas ref={canvas} className="arena-scene-field" />
    <div className="scene-reticle scene-reticle-a" /><div className="scene-reticle scene-reticle-b" />
    <div className="scene-orbit" />
  </div>;
}
