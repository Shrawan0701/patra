import React, { useEffect, useRef } from 'react';

interface HalftoneCanvasProps {
  variant: 'hero' | 'horizon';
}

/** Procedural stippled architectural atmosphere inspired by precision dot-matrix sculpture. */
export function HalftoneCanvas({ variant }: HalftoneCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let pointerX = 0;
    let pointerY = 0;
    let raf = 0;
    let t = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : window.innerWidth;
      const h = parent ? parent.clientHeight : 600;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
      pointerY = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
    };

    window.addEventListener('resize', resize);
    if (variant === 'hero' && !reduceMotion) {
      window.addEventListener('pointermove', onMove);
    }

    const drawHero = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const dark = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]')?.content === 'dark' ||
        (document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]')?.content !== 'light' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

      const step = 9;
      const planetCx = w * 0.34 + pointerX * 14;
      const planetCy = h * 0.54 + pointerY * 10;
      const radius = Math.min(w, h) * 0.38;

      const moonCx = w * 0.8 + pointerX * 8;
      const moonCy = h * 0.34 + pointerY * 8;
      const moonR = Math.min(w, h) * 0.085;

      const tilt = -0.34 + pointerY * 0.04;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);

      for (let gx = 0; gx < w; gx += step) {
        for (let gy = 0; gy < h; gy += step) {
          const dx = gx - planetCx;
          const dy = gy - planetCy;
          const distP = Math.hypot(dx, dy);

          // Orbital ring math in rotated frame
          const rx = dx * cosT + dy * sinT;
          const ry = -dx * sinT + dy * cosT;
          const ell = Math.hypot(rx / (radius * 2.15), ry / (radius * 0.28));

          let strength = 0.09;

          if (distP < radius) {
            const shade = (dx * -0.45 + dy * -0.55) / radius;
            const dither = Math.sin(gx * 0.37 + t * 0.4) * Math.cos(gy * 0.31) * 0.14;
            strength = Math.max(0.14, Math.min(0.62, 0.36 + shade * 0.28 + dither));
          } else if (ell > 0.88 && ell < 1.12 && !(dy < 0 && distP < radius * 0.94)) {
            strength = 0.46 - Math.abs(ell - 1) * 2.2;
          }

          const mdx = gx - moonCx;
          const mdy = gy - moonCy;
          const distM = Math.hypot(mdx, mdy);
          if (distM < moonR) {
            strength = Math.max(strength, 0.34 + ((mdx + mdy) / moonR) * 0.22);
          }

          ctx.fillStyle = dark
            ? `rgba(218, 226, 236, ${strength.toFixed(2)})`
            : `rgba(74, 84, 98, ${strength.toFixed(2)})`;
          ctx.fillRect(gx, gy, 1.8, 1.8);
        }
      }
    };

    const drawHorizon = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const step = 8;
      for (let gx = w * 0.35; gx < w; gx += step) {
        const u = (gx - w * 0.35) / Math.max(1, w * 0.65);
        const ridgeY = h * 0.32 + Math.sin(u * 3.1 + t * 0.25) * 24 - u * 44;
        for (let gy = Math.max(0, ridgeY - 30); gy < h * 0.72; gy += step) {
          const depth = (gy - ridgeY) / (h * 0.34);
          if (depth < -0.15 || depth > 1) continue;
          const alpha = Math.max(0, 0.52 * (1 - Math.abs(depth - 0.18) * 1.4));
          const sparkle = (Math.sin(gx * 0.19 + gy * 0.23 + t * 0.6) + 1) * 0.5;
          ctx.fillStyle = `rgba(210, 220, 235, ${(alpha * (0.45 + 0.55 * sparkle)).toFixed(2)})`;
          ctx.fillRect(gx, gy, 1.6, 1.6);
        }
      }
    };

    const tick = () => {
      if (variant === 'hero') drawHero();
      else drawHorizon();
      if (!reduceMotion) {
        t += 0.025;
        raf = requestAnimationFrame(tick);
      }
    };

    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
}
