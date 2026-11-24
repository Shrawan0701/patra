import React, { useEffect, useRef } from 'react';

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Large continuous 3D architectural folding pavilion diagram rendered on a high-DPI canvas.
 * Showcases rotating multi-wing walls, framed plaques, arches, and orbital ground rings.
 */
export function HeroDiagramCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let time = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : 520;
      const h = parent ? parent.clientHeight : 390;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const isDarkMode = () => {
      const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]')?.content;
      if (meta === 'dark') return true;
      if (meta === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    };

    const rotateY = (p: Vec3, a: number): Vec3 => ({
      x: p.x * Math.cos(a) + p.z * Math.sin(a),
      y: p.y,
      z: -p.x * Math.sin(a) + p.z * Math.cos(a),
    });

    const project = (p: Vec3, w: number, h: number, yaw: number, pitch: number) => {
      const r1 = rotateY(p, yaw);
      const y1 = r1.y * Math.cos(pitch) - r1.z * Math.sin(pitch);
      const z1 = r1.y * Math.sin(pitch) + r1.z * Math.cos(pitch);
      const fov = Math.min(w, h) * 1.15;
      const dist = 5.4;
      const scale = fov / (dist + z1);
      return {
        x: w * 0.5 + r1.x * scale,
        y: h * 0.54 - y1 * scale,
        z: z1,
      };
    };

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const dark = isDarkMode();
      const strokeMain = dark ? 'rgba(228, 236, 248, 0.78)' : 'rgba(24, 32, 44, 0.72)';
      const strokeSoft = dark ? 'rgba(133, 146, 255, 0.34)' : 'rgba(65, 84, 110, 0.25)';
      const fillWall = dark ? 'rgba(133, 146, 255, 0.08)' : 'rgba(46, 90, 62, 0.07)';
      const fillFloor = dark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(18, 24, 34, 0.035)';
      const nodeColor = dark ? '#8592ff' : '#2e5a3e';

      const yaw = time * 0.38;
      const pitch = 0.48 + Math.sin(time * 0.45) * 0.06;
      const foldOpen = 0.78 + Math.sin(time * 0.9) * 0.22;

      // 1. Orbital architectural base rings
      [1.85, 2.35].forEach((radius, idx) => {
        ctx.beginPath();
        const steps = 64;
        for (let i = 0; i <= steps; i++) {
          const ang = (i / steps) * Math.PI * 2;
          const pt = project({ x: Math.cos(ang) * radius, y: -0.9, z: Math.sin(ang) * radius }, w, h, yaw, pitch);
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = strokeSoft;
        ctx.lineWidth = idx === 0 ? 1.25 : 0.9;
        ctx.setLineDash(idx === 1 ? [4, 5] : []);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 2. Central axis spire
      const axisBot = project({ x: 0, y: -0.9, z: 0 }, w, h, yaw, pitch);
      const axisTop = project({ x: 0, y: 1.48, z: 0 }, w, h, yaw, pitch);
      ctx.beginPath();
      ctx.moveTo(axisBot.x, axisBot.y);
      ctx.lineTo(axisTop.x, axisTop.y);
      ctx.strokeStyle = nodeColor;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // 3. Multi-wing folding panels (3 symmetric corners unfolding continuously)
      const wings = 3;
      const wingLen = 1.48;
      const wingH = 1.62;
      const peakH = 1.98;

      for (let q = 0; q < wings; q++) {
        const baseAng = q * ((Math.PI * 2) / wings);
        const swing = (1 - foldOpen) * 0.35;
        const a1 = baseAng - swing;
        const a2 = baseAng + ((Math.PI * 2) / wings) * 0.48 + swing * 0.5;

        const rCos1 = Math.cos(a1);
        const rSin1 = Math.sin(a1);
        const rCos2 = Math.cos(a2);
        const rSin2 = Math.sin(a2);

        // Floor sector
        const f0 = project({ x: 0, y: -0.88, z: 0 }, w, h, yaw, pitch);
        const f1 = project({ x: rCos1 * wingLen, y: -0.88, z: rSin1 * wingLen }, w, h, yaw, pitch);
        const f2 = project(
          { x: (rCos1 + rCos2) * wingLen * 0.72, y: -0.88, z: (rSin1 + rSin2) * wingLen * 0.72 },
          w,
          h,
          yaw,
          pitch
        );
        const f3 = project({ x: rCos2 * wingLen, y: -0.88, z: rSin2 * wingLen }, w, h, yaw, pitch);

        ctx.beginPath();
        ctx.moveTo(f0.x, f0.y);
        ctx.lineTo(f1.x, f1.y);
        ctx.lineTo(f2.x, f2.y);
        ctx.lineTo(f3.x, f3.y);
        ctx.closePath();
        ctx.fillStyle = fillFloor;
        ctx.fill();
        ctx.strokeStyle = strokeSoft;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Main architectural wall with peak crest
        const wBotL = project({ x: 0, y: -0.88, z: 0 }, w, h, yaw, pitch);
        const wBotR = project({ x: rCos1 * wingLen, y: -0.88, z: rSin1 * wingLen }, w, h, yaw, pitch);
        const wTopR = project({ x: rCos1 * wingLen, y: -0.88 + wingH * 0.76, z: rSin1 * wingLen }, w, h, yaw, pitch);
        const wPeak = project({ x: rCos1 * wingLen * 0.5, y: -0.88 + peakH, z: rSin1 * wingLen * 0.5 }, w, h, yaw, pitch);
        const wTopL = project({ x: 0, y: -0.88 + wingH * 0.76, z: 0 }, w, h, yaw, pitch);

        ctx.beginPath();
        ctx.moveTo(wBotL.x, wBotL.y);
        ctx.lineTo(wBotR.x, wBotR.y);
        ctx.lineTo(wTopR.x, wTopR.y);
        ctx.lineTo(wPeak.x, wPeak.y);
        ctx.lineTo(wTopL.x, wTopL.y);
        ctx.closePath();
        ctx.fillStyle = fillWall;
        ctx.fill();
        ctx.strokeStyle = strokeMain;
        ctx.lineWidth = 1.35;
        ctx.stroke();

        // Framed inner signage plaque inside wall
        const pBL = project({ x: rCos1 * 0.25, y: -0.52, z: rSin1 * 0.25 }, w, h, yaw, pitch);
        const pBR = project({ x: rCos1 * 1.18, y: -0.52, z: rSin1 * 1.18 }, w, h, yaw, pitch);
        const pTR = project({ x: rCos1 * 1.18, y: 0.34, z: rSin1 * 1.18 }, w, h, yaw, pitch);
        const pTL = project({ x: rCos1 * 0.25, y: 0.34, z: rSin1 * 0.25 }, w, h, yaw, pitch);

        ctx.beginPath();
        ctx.moveTo(pBL.x, pBL.y);
        ctx.lineTo(pBR.x, pBR.y);
        ctx.lineTo(pTR.x, pTR.y);
        ctx.lineTo(pTL.x, pTL.y);
        ctx.closePath();
        ctx.strokeStyle = strokeSoft;
        ctx.lineWidth = 1.05;
        ctx.stroke();

        // Highlight vertex dots
        [wPeak, wTopR].forEach((pt) => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = nodeColor;
          ctx.fill();
        });
      }

      // Floating crown finial node
      ctx.beginPath();
      ctx.arc(axisTop.x, axisTop.y, 4.2, 0, Math.PI * 2);
      ctx.fillStyle = nodeColor;
      ctx.fill();
    };

    const tick = () => {
      draw();
      if (!reduceMotion) {
        time += 0.016;
        raf = requestAnimationFrame(tick);
      }
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Live 3D architectural folding pavilion diagram"
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
