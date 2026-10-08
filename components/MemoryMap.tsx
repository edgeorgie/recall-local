"use client";

import { useEffect, useRef, useState } from "react";

export interface MapPoint {
  id: string;
  x: number;
  y: number;
  color: string;
  label: string;
  text: string;
}

interface Props {
  points: MapPoint[];
  highlights: Map<string, number>;
  pulseKey: number;
  onPick: (id: string) => void;
}

const MIN_ZOOM = 0.7;
const MAX_ZOOM = 6;

/** A galaxy of your notes: each passage is a star placed by meaning. Scroll to zoom, drag to pan, double click to reset. */
export default function MemoryMap({ points, highlights, pulseKey, onPick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hover = useRef<string | null>(null);
  const pulseStart = useRef(0);
  const view = useRef({ scale: 1, tx: 0, ty: 0 });
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; w: number; p: MapPoint } | null>(null);
  const layout = useRef<{ id: string; px: number; py: number }[]>([]);

  useEffect(() => {
    pulseStart.current = performance.now();
  }, [pulseKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = wrap.clientWidth;
      h = wrap.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const v = view.current;
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.scale * Math.exp(-e.deltaY * 0.0015)));
      const k = next / v.scale;
      // keep the point under the cursor fixed while zooming
      v.tx = mx - (mx - v.tx) * k;
      v.ty = my - (my - v.ty) * k;
      v.scale = next;
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      const pad = 56;
      const t = now / 1000;
      const { scale, tx, ty } = view.current;
      const hasHits = highlights.size > 0;
      layout.current = [];

      ctx.strokeStyle = "rgba(190,255,225,0.035)";
      ctx.lineWidth = 1;
      const step = 56 * scale;
      for (let gx = (((tx % step) + step) % step); gx < w; gx += step) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = (((ty % step) + step) % step); gy < h; gy += step) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      const centroids = new Map<string, { x: number; y: number; n: number; color: string }>();
      points.forEach((p, i) => {
        const bx = pad + ((p.x + 1) / 2) * (w - pad * 2) + Math.sin(t * 0.6 + i) * 3;
        const by = pad + ((p.y + 1) / 2) * (h - pad * 2) + Math.cos(t * 0.5 + i * 1.3) * 3;
        const px = bx * scale + tx;
        const py = by * scale + ty;
        layout.current.push({ id: p.id, px, py });
        const c = centroids.get(p.label) ?? { x: 0, y: 0, n: 0, color: p.color };
        c.x += px;
        c.y += py;
        c.n++;
        centroids.set(p.label, c);
        if (px < -40 || px > w + 40 || py < -40 || py > h + 40) return;
        const score = highlights.get(p.id);
        const isHit = score !== undefined;
        const isHover = hover.current === p.id;
        const base = (isHit ? 6 + score * 9 : 3.2) * Math.min(1.8, Math.sqrt(scale));
        const twinkle = 0.7 + 0.3 * Math.sin(t * 1.5 + i * 2.1);
        ctx.globalAlpha = hasHits && !isHit && !isHover ? 0.18 : isHit ? 1 : 0.55 + 0.35 * twinkle;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = isHit || isHover ? 26 : 10;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, isHover ? base + 3 : base, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (isHit) {
          const age = (now - pulseStart.current) / 1000;
          for (let r = 0; r < 2; r++) {
            const k = (age * 0.9 + r * 0.5) % 1;
            ctx.globalAlpha = (1 - k) * 0.55;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(px, py, base + k * 46, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      });

      // group labels at each note's centroid
      ctx.globalAlpha = hasHits ? 0.45 : 0.85;
      ctx.font = "600 12px var(--font-sans), system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      centroids.forEach((c, label) => {
        if (!label) return;
        const cx = c.x / c.n;
        const cy = c.y / c.n;
        if (cx < -60 || cx > w + 60 || cy < -20 || cy > h + 20) return;
        const text = label.length > 22 ? `${label.slice(0, 21)}…` : label;
        const tw = ctx.measureText(text).width + 18;
        ctx.fillStyle = "rgba(8,17,14,0.72)";
        ctx.beginPath();
        ctx.roundRect(cx - tw / 2, cy - 12 - 22, tw, 22, 11);
        ctx.fill();
        ctx.fillStyle = c.color;
        ctx.fillText(text, cx, cy - 12 - 11);
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [points, highlights]);

  const nearest = (e: React.PointerEvent | React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let best: { id: string; d: number } | null = null;
    for (const l of layout.current) {
      const d = Math.hypot(l.px - mx, l.py - my);
      if (d < 16 && (!best || d < best.d)) best = { id: l.id, d };
    }
    return { best, mx, my, w: rect.width };
  };

  const zoomBy = (factor: number) => {
    const v = view.current;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const cx = wrap.clientWidth / 2;
    const cy = wrap.clientHeight / 2;
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.scale * factor));
    const k = next / v.scale;
    v.tx = cx - (cx - v.tx) * k;
    v.ty = cy - (cy - v.ty) * k;
    v.scale = next;
  };

  return (
    <div ref={wrapRef} className="relative h-full min-h-[300px] w-full overflow-hidden rounded-[1.75rem] border border-line bg-[radial-gradient(ellipse_at_50%_40%,#10241d_0%,#08110e_70%)] lg:min-h-[420px]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, moved: false };
          (e.target as Element).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (d) {
            const dx = e.clientX - d.x;
            const dy = e.clientY - d.y;
            if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
            if (d.moved) {
              view.current.tx += dx;
              view.current.ty += dy;
              d.x = e.clientX;
              d.y = e.clientY;
              setTip(null);
              return;
            }
          }
          const { best, mx, my, w } = nearest(e);
          hover.current = best?.id ?? null;
          const p = best ? points.find((q) => q.id === best.id) : undefined;
          setTip(p ? { x: mx, y: my, w, p } : null);
        }}
        onPointerUp={(e) => {
          const wasDrag = drag.current?.moved;
          drag.current = null;
          if (!wasDrag) {
            const { best } = nearest(e);
            if (best) onPick(best.id);
          }
        }}
        onPointerLeave={() => {
          hover.current = null;
          setTip(null);
        }}
        onDoubleClick={() => (view.current = { scale: 1, tx: 0, ty: 0 })}
      />
      <div className="absolute bottom-3 right-3 flex flex-col overflow-hidden rounded-xl border border-line bg-panel/90 text-lg">
        <button onClick={() => zoomBy(1.4)} className="grid h-9 w-9 place-items-center transition hover:bg-panel-2" aria-label="Zoom in">+</button>
        <button onClick={() => zoomBy(1 / 1.4)} className="grid h-9 w-9 place-items-center border-t border-line transition hover:bg-panel-2" aria-label="Zoom out">&minus;</button>
        <button onClick={() => (view.current = { scale: 1, tx: 0, ty: 0 })} className="grid h-9 w-9 place-items-center border-t border-line text-xs transition hover:bg-panel-2" aria-label="Reset view">1:1</button>
      </div>
      {tip && (
        <div
          className="pointer-events-none absolute z-10 max-w-[260px] rounded-2xl border border-line bg-panel-2/95 px-3.5 py-2.5 text-[13px] shadow-2xl"
          style={{ left: Math.max(8, Math.min(tip.x + 14, tip.w - 270)), top: tip.y + 14 }}
        >
          <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: tip.p.color }}>{tip.p.label}</p>
          <p className="mt-1 line-clamp-4 leading-snug text-text/90">{tip.p.text}</p>
        </div>
      )}
      {points.length === 0 && (
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-lg font-bold">Your map is empty</p>
            <p className="mt-1 text-sm text-muted">Add notes and each passage becomes a star, grouped by meaning.</p>
          </div>
        </div>
      )}
    </div>
  );
}
