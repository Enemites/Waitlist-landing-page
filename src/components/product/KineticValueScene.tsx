import { useEffect, useRef } from "react";
import { useMotionValueEvent, useReducedMotion, type MotionValue } from "motion/react";

type Point = { x: number; y: number; z: number };
type Projection = { x: number; y: number; depth: number };
type Kind = "steps" | "clarity" | "evidence";
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (v: number) => { const t = Math.max(0, Math.min(1, v)); return t * t * (3 - 2 * t); };
const noise = (i: number) => {
  const value = Math.sin(i * 12.9898 + 7.23) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
};

/** Three kinetic sculptures: a learning path, an optical iris, and a layered evidence record. */
export default function KineticValueScene({ kind, progress, label }: {
  kind: Kind; progress: MotionValue<number>; label: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const targetProgress = useRef(progress.get());
  const reduce = useReducedMotion();
  useMotionValueEvent(progress, "change", value => { targetProgress.current = value; });

  useEffect(() => {
    const surface = canvas.current;
    if (!surface) return;
    const ctx = surface.getContext("2d");
    if (!ctx) return;
    let width = 0, height = 0, scale = 1, frame = 0, visible = false, last = 0;
    let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;
    const pointerQuery = window.matchMedia("(hover:hover) and (pointer:fine)");

    function project(p: Point): Projection {
      const yaw = -0.32 + pointerX * 0.24;
      const pitch = (kind === "steps" ? -0.48 : -0.24) + pointerY * 0.16;
      const x = p.x * Math.cos(yaw) + p.z * Math.sin(yaw);
      const z = -p.x * Math.sin(yaw) + p.z * Math.cos(yaw);
      const y = p.y * Math.cos(pitch) - z * Math.sin(pitch);
      const depth = p.y * Math.sin(pitch) + z * Math.cos(pitch);
      const perspective = 1100 / (1100 + depth);
      return { x: width * 0.5 + x * scale * perspective, y: height * 0.51 + y * scale * perspective, depth };
    }

    function polygon(points: Point[], fill: string | CanvasGradient, stroke = "#a0c5a64d") {
      const projected = points.map(project);
      ctx!.beginPath();
      projected.forEach((p, i) => i ? ctx!.lineTo(p.x, p.y) : ctx!.moveTo(p.x, p.y));
      ctx!.closePath(); ctx!.fillStyle = fill; ctx!.fill();
      ctx!.strokeStyle = stroke; ctx!.lineWidth = 0.8; ctx!.stroke();
    }

    function glass(points: Point[], light: boolean) {
      const a=project(points[0]),b=project(points[2]);
      const sheen=ctx!.createLinearGradient(a.x,a.y,b.x,b.y);
      sheen.addColorStop(0,light?"#b6cdbd38":"#819f9130");
      sheen.addColorStop(.4,"#36574544");
      sheen.addColorStop(.49,light?"#a6c6a85c":"#9cbbab3d");
      sheen.addColorStop(.54,"#4b70564a");
      sheen.addColorStop(1,"#12251e66");
      polygon(points,sheen,light?"#c5e5aa8c":"#90b79a66");
      line([points[0],points[1]],light?"#eef4ddab":"#d6e8d15c",1);
    }

    function line(points: Point[], color: string, weight = 1) {
      ctx!.beginPath();
      points.map(project).forEach((p, i) => i ? ctx!.lineTo(p.x, p.y) : ctx!.moveTo(p.x, p.y));
      ctx!.strokeStyle = color; ctx!.lineWidth = weight; ctx!.stroke();
    }

    function glow(point: Point, radius: number, strength = 1) {
      const p = project(point), r = radius * scale;
      const gradient = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5);
      gradient.addColorStop(0, `rgba(196,237,108,${0.28 * strength})`);
      gradient.addColorStop(1, "rgba(196,237,108,0)");
      ctx!.fillStyle = gradient; ctx!.beginPath(); ctx!.arc(p.x, p.y, r * 5, 0, Math.PI * 2); ctx!.fill();
      const sphere = ctx!.createRadialGradient(p.x - r * 0.3, p.y - r * 0.4, 0, p.x, p.y, r);
      sphere.addColorStop(0, "#f3ffd1"); sphere.addColorStop(0.4, "#c4ed6c"); sphere.addColorStop(1, "#54743b");
      ctx!.fillStyle = sphere; ctx!.beginPath(); ctx!.arc(p.x, p.y, r, 0, Math.PI * 2); ctx!.fill();
    }

    function topTile(center: Point, w: number, d: number, bright: boolean, index: number) {
      const a = { x: center.x - w / 2, y: center.y, z: center.z - d / 2 };
      const b = { x: center.x + w / 2, y: center.y, z: center.z - d / 2 };
      const c = { x: center.x + w / 2, y: center.y, z: center.z + d / 2 };
      const e = { x: center.x - w / 2, y: center.y, z: center.z + d / 2 };
      polygon([e, c, { ...c, y: c.y + 13 }, { ...e, y: e.y + 13 }], "#0b1413", "#57735066");
      polygon([b, c, { ...c, y: c.y + 13 }, { ...b, y: b.y + 13 }], "#1a2b22", "#57735066");
      const gradient = ctx!.createLinearGradient(project(a).x, project(a).y, project(c).x, project(c).y);
      gradient.addColorStop(0, bright ? "#d7f5a1" : "#435b4b");
      gradient.addColorStop(1, bright ? "#8eb149" : "#142723");
      // Canvas accepts gradients directly; the geometry helpers otherwise use solid fills.
      const projected = [a, b, c, e].map(project);
      ctx!.beginPath(); projected.forEach((p, i) => i ? ctx!.lineTo(p.x, p.y) : ctx!.moveTo(p.x, p.y));ctx!.closePath();
      ctx!.fillStyle = gradient; ctx!.fill(); ctx!.strokeStyle = bright ? "#e6ffb9" : "#9db89b70";ctx!.lineWidth = 1;ctx!.stroke();
      for (let j = 0; j < 3; j++) {
        const p = project({ x: center.x - 19 + j * 14, y: center.y - 1, z: center.z + 14 });
        ctx!.fillStyle = bright ? "#45612d" : j <= index % 3 ? "#b8d58a" : "#607a65";
        ctx!.beginPath();ctx!.arc(p.x,p.y,1.4*scale,0,Math.PI*2);ctx!.fill();
      }
    }

    function drawSteps(t: number, time: number) {
      const tiles = Array.from({ length: 11 }, (_, i) => ({
        x: mix(-10 + i * 2, -220 + i * 44, t),
        y: mix(92 - i * 13, 44 - i * 11, t),
        z: mix(0, Math.sin(i * 0.52) * 135, t), index: i,
      }));
      line(tiles.map(p => ({ ...p, y: p.y + 22 })), "#c4ed6c26", 1);
      const traveler = reduce ? 8.5 : (time * 0.0006) % 10;
      const current = Math.floor(traveler);
      const next = Math.min(10, current + 1);
      const stride = Math.max(0,(traveler-current-.28)/.72);
      const f = smooth(stride);
      const hop = reduce ? 0 : Math.sin(f*Math.PI)*22;
      const orb = { x: mix(tiles[current].x,tiles[next].x,f), y: mix(tiles[current].y,tiles[next].y,f)-19-hop, z: mix(tiles[current].z,tiles[next].z,f) };
      [...tiles].sort((a,b)=>project(b).depth-project(a).depth).forEach(tile=>topTile(tile,62,66,tile.index === current, tile.index));
      line(tiles.map(p=>({...p,y:p.y-2})).slice(0,current+1),"#d0ef9899",1.2);
      glow(orb,8);
      // A restrained finish marker makes the small-step route readable as a whole.
      const end=tiles[10];line([{x:end.x,y:end.y-6,z:end.z},{x:end.x,y:end.y-91,z:end.z}],"#c4ed6c66");
      polygon([{x:end.x,y:end.y-92,z:end.z},{x:end.x+28,y:end.y-83,z:end.z},{x:end.x,y:end.y-70,z:end.z}],"#c4ed6c","#e7ffb0");
    }

    function drawClarity(t: number, time: number) {
      const blades = Array.from({ length: 24 }, (_, i) => {
        const angle = i / 24 * Math.PI * 2;
        return {
          x:mix(noise(i)*205,Math.cos(angle)*145,t),
          y:mix(noise(i+42)*155,Math.sin(angle)*145,t),
          z:mix(noise(i+79)*100,Math.sin(angle)*22,t),
          angle:mix(noise(i+23)*Math.PI*2,angle,t), index:i,
        };
      });
      const breath = reduce ? 0 : Math.sin(time * 0.0005) * 0.015;
      blades.sort((a,b)=>project(b).depth-project(a).depth).forEach(blade=>{
        const corners = [[-54,-17],[51,-12],[38,17],[-52,14]].map(([x,y])=>({
          x:blade.x+x*Math.cos(blade.angle+breath)-y*Math.sin(blade.angle+breath),
          y:blade.y+x*Math.sin(blade.angle+breath)+y*Math.cos(blade.angle+breath),z:blade.z,
        }));
        polygon(corners.map(p=>({...p,z:p.z+5})),"#11211966","#52735c33");
        glass(corners,blade.index%3===0);
      });
      const lens = Array.from({length:65},(_,i)=>({x:Math.cos(i/64*Math.PI*2)*78,y:Math.sin(i/64*Math.PI*2)*78,z:-20}));
      line(lens,`rgba(196,237,108,${0.15+t*0.55})`,1.4);
      const ring = lens.map(p=>({...p,x:p.x*.74,y:p.y*.74,z:-35}));line(ring,"#a4c99b44");
      for(let i=0;i<12;i++){
        const angle=i/12*Math.PI*2;
        line([{x:Math.cos(angle)*84,y:Math.sin(angle)*84,z:-20},{x:Math.cos(angle)*89,y:Math.sin(angle)*89,z:-20}],"#b1ceab55");
      }
      glow({x:0,y:0,z:-55},12,0.5+t*0.5);
      const sweep = reduce ? 0.3 : (time*0.00012)%1;
      const ray={x:Math.cos(sweep*Math.PI*2)*69,y:Math.sin(sweep*Math.PI*2)*69,z:-25};
      line([{x:0,y:0,z:-55},ray],`rgba(196,237,108,${t*.45})`);
      glow(ray,2,t);
    }

    function drawEvidence(t: number, time: number) {
      const layers=Array.from({length:7},(_,i)=>({
        x:mix(noise(i+15)*160,0,t),y:mix(noise(i+39)*110,0,t),
        z:mix(-75+i*24,-70+i*21,t),angle:mix(noise(i+27)*.5,0,t),index:i,
      }));
      const plate = (x: number,y: number,p:typeof layers[number]):Point=>({
        x:p.x+x*Math.cos(p.angle)-y*Math.sin(p.angle),
        y:p.y+x*Math.sin(p.angle)+y*Math.cos(p.angle),z:p.z,
      });
      layers.sort((a,b)=>project(b).depth-project(a).depth).forEach(p=>{
        const corners=[[-112,-152],[112,-152],[112,152],[-112,152]].map(([x,y])=>plate(x,y,p));
        if(p.index===0) glass(corners,true);
        else polygon(corners,"#17332a33","#6f97796e");
        line([plate(-92,-132,p),plate(-92,-111,p),plate(-70,-111,p)],"#c4ed6c80");
        line([plate(92,132,p),plate(92,111,p),plate(70,111,p)],"#c4ed6c80");
        // Each sheet carries a distinct trace; assembled traces become a capability record.
        const trace=Array.from({length:29},(_,j)=>plate(-78+j*5.5,Math.sin(j*.21+p.index*.56)*48+(p.index-3)*19,p));
        line(trace,p.index===0?"#d6f2a9b3":"#c4ed6c55",1);
        for(let j=0;j<5;j++){
          const at=project(trace[j*6]);ctx!.fillStyle=p.index===0?"#d6f2a9":"#8faa67";
          ctx!.beginPath();ctx!.arc(at.x,at.y,1.8*scale,0,Math.PI*2);ctx!.fill();
        }
      });
      const front=layers.find(p=>p.index===0)!;
      const diamond=[[-15,-85],[0,-102],[15,-85],[0,-68]].map(([x,y])=>plate(x,y,front));
      polygon(diamond,"#c4ed6c","#edffc4");
      // Recorded events flow into the record rather than decorating an empty certificate.
      const amount=reduce ? 0.65 : (time*.0002)%1;
      const enter=smooth(amount);
      const event={x:mix(-240,-114,enter),y:mix(95,45,enter),z:-65};
      line([{x:-245,y:95,z:-65},{x:-172,y:95,z:-65},{x:-114,y:45,z:-65}],"#8cac6355");
      glow(event,4,1-amount*.5);
    }

    function draw(time: number) {
      ctx!.clearRect(0,0,width,height);
      pointerX+=(targetX-pointerX)*.055;pointerY+=(targetY-pointerY)*.055;
      const t=reduce?1:smooth(targetProgress.current);
      ctx!.save();
      if(kind==="steps")drawSteps(t,time);
      else if(kind==="clarity")drawClarity(t,time);
      else drawEvidence(t,time);
      ctx!.restore();surface!.dataset.formation=t.toFixed(3);
    }

    function tick(time:number) {
      if(!visible || document.hidden) { frame=0;return; }
      if(time-last>32){draw(time);last=time;}
      frame=requestAnimationFrame(tick);
    }
    const resize=new ResizeObserver(([entry])=>{
      width=entry.contentRect.width;height=entry.contentRect.height;
      scale=Math.min(width/590,height/440);
      const dpr=Math.min(window.devicePixelRatio||1,1.75);
      surface.width=Math.round(width*dpr);surface.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
      draw(0);
    });
    const observer=new IntersectionObserver(([entry])=>{
      visible=entry.isIntersecting;
      if(visible&&!reduce&&!frame)frame=requestAnimationFrame(tick);
      if(!visible){cancelAnimationFrame(frame);frame=0;}
    },{rootMargin:"60px"});
    const move=(event:PointerEvent)=>{
      if(reduce||!pointerQuery.matches)return;
      const r=surface.getBoundingClientRect();targetX=(event.clientX-r.left)/r.width-.5;targetY=(event.clientY-r.top)/r.height-.5;
    };
    const leave=()=>{targetX=0;targetY=0;};
    const visibility=()=>{if(!document.hidden&&visible&&!reduce&&!frame)frame=requestAnimationFrame(tick);};
    resize.observe(surface);observer.observe(surface);
    surface.addEventListener("pointermove",move,{passive:true});surface.addEventListener("pointerleave",leave);
    document.addEventListener("visibilitychange",visibility);
    return()=>{
      resize.disconnect();observer.disconnect();cancelAnimationFrame(frame);
      surface.removeEventListener("pointermove",move);surface.removeEventListener("pointerleave",leave);document.removeEventListener("visibilitychange",visibility);
    };
  },[kind,reduce]);

  return <canvas ref={canvas} className={`kinetic-sculpture sculpture-${kind}`} role="img" aria-label={label} />;
}
