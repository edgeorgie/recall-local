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

/** A galaxy of your notes: each passage is a star placed by meaning. Matches glow and send out ripples. */
export default function MemoryMap({ points, highlights, pulseKey, onPick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hover = useRef<string | null>(null);
  const pulseStart = useRef(0);
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

    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      const pad = 48;
      const t = now / 1000;
      const hasHits = highlights.size > 0;
      layout.current = [];

      // faint grid for depth
      ctx.strokeStyle = "rgba(190,255,225,0.035)";
      ctx.lineWidth = 1;
      for (let gx = pad; gx < w; gx += 56) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = pad; gy < h; gy += 56) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      points.forEach((p, i) => {
        const px = pad + ((p.x + 1) / 2) * (w - pad * 2) + Math.sin(t * 0.6 + i) * 3;
        const py = pad + ((p.y + 1) / 2) * (h - pad * 2) + Math.cos(t * 0.5 + i * 1.3) * 3;
        layout.current.push({ id: p.id, px, py });
        const score = highlights.get(p.id);
        const isHit = score !== undefined;
        const isHover = hover.current === p.id;
        const base = isHit ? 6 + score * 9 : 3.2;
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
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [points, highlights]);

  const nearest = (e: React.MouseEvent) => {
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

  return (
    <div ref={wrapRef} className="relative h-full min-h-[420px] w-full overflow-hidden rounded-[1.75rem] border border-line bg-[radial-gradient(ellipse_at_50%_40%,#10241d_0%,#08110e_70%)]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-crosshair"
        onMouseMove={(e) => {
          const { best, mx, my, w } = nearest(e);
          hover.current = best?.id ?? null;
          const p = best ? points.find((q) => q.id === best.id) : undefined;
          setTip(p ? { x: mx, y: my, w, p } : null);
        }}
        onMouseLeave={() => {
          hover.current = null;
          setTip(null);
        }}
        onClick={(e) => {
          const { best } = nearest(e);
          if (best) onPick(best.id);
        }}
      />
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
