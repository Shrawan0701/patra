import React, { useEffect, useRef } from 'react';

interface AuthGlassCanvasProps {
  variant: 'login' | 'register' | 'forgot';
  className?: string;
}

const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform int u_mode;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = rot * p * 2.02 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  // Sculptural liquid-glass elevation field
  float glassField(vec2 p, float t, vec2 m) {
    vec2 flow = p + m * 0.14;
    if (u_mode == 0) {
      // Login: architectural flowing champagne & ultramarine folds
      vec2 q = vec2(fbm(flow * 1.3 + vec2(t * 0.09, -t * 0.06)), fbm(flow * 1.4 + vec2(-t * 0.07, t * 0.08)));
      float fold = sin(flow.x * 2.4 + flow.y * 1.6 + q.x * 3.8 + t * 0.28);
      return fbm(flow * 1.6 + q * 1.8) * 0.68 + fold * 0.22;
    } else if (u_mode == 1) {
      // Register: sweeping Murano diagonal glass ribbons
      vec2 diag = vec2(flow.x * 0.85 - flow.y * 0.75, flow.x * 0.75 + flow.y * 0.85);
      vec2 q = vec2(fbm(diag * 1.5 - vec2(t * 0.08, t * 0.05)), fbm(diag * 1.3 + vec2(t * 0.06, -t * 0.09)));
      float wave = sin(diag.x * 3.1 + q.y * 4.2 - t * 0.32);
      return fbm(diag * 1.45 + q * 1.6) * 0.65 + wave * 0.24;
    } else {
      // Forgot Password: calm concentric liquid mercury ripples
      float dist = length(flow * vec2(1.15, 0.95));
      vec2 q = vec2(fbm(flow * 1.2 + vec2(t * 0.05)), fbm(flow * 1.2 - vec2(t * 0.05)));
      float ripple = sin(dist * 4.8 - t * 0.35 + q.x * 2.6) * exp(-dist * 0.55);
      return fbm(flow * 1.25 + q * 1.3) * 0.62 + ripple * 0.28;
    }
  }

  vec3 samplePalette(float h, float ridge) {
    if (u_mode == 0) {
      // Obsidian, Ultramarine & Brushed Champagne Glass
      vec3 cDeep = vec3(0.035, 0.039, 0.062);   // #090A0F
      vec3 cUltra = vec3(0.102, 0.169, 0.369);  // #1A2B5E
      vec3 cChamp = vec3(0.851, 0.659, 0.424);  // #D9A86C
      vec3 cPearl = vec3(0.961, 0.937, 0.902);  // #F5EFE6

      vec3 col = mix(cDeep, cUltra, smoothstep(0.05, 0.55, h));
      col = mix(col, cChamp, smoothstep(0.46, 0.84, h) * 0.82);
      col = mix(col, cPearl, smoothstep(0.76, 1.05, h + ridge * 0.32));
      return col;
    } else if (u_mode == 1) {
      // Murano Terracotta, Botanical Emerald & Warm Opal
      vec3 cDeep = vec3(0.039, 0.067, 0.059);   // #0A110F
      vec3 cEm   = vec3(0.106, 0.369, 0.294);   // #1B5E4B
      vec3 cTerr = vec3(0.784, 0.314, 0.169);   // #C8502B
      vec3 cOpal = vec3(0.945, 0.910, 0.851);   // #F1E8D9

      vec3 col = mix(cDeep, cEm, smoothstep(0.08, 0.52, h));
      col = mix(col, cTerr, smoothstep(0.45, 0.82, h) * 0.86);
      col = mix(col, cOpal, smoothstep(0.75, 1.06, h + ridge * 0.28));
      return col;
    } else {
      // Liquid Mercury & Prussian Slate
      vec3 cDeep  = vec3(0.047, 0.055, 0.078);  // #0C0E14
      vec3 cSlate = vec3(0.165, 0.235, 0.388);  // #2A3C63
      vec3 cSilv  = vec3(0.722, 0.769, 0.831);  // #B8C4D4
      vec3 cBone  = vec3(0.918, 0.894, 0.855);  // #EAE4DA

      vec3 col = mix(cDeep, cSlate, smoothstep(0.10, 0.54, h));
      col = mix(col, cSilv, smoothstep(0.50, 0.86, h) * 0.78);
      col = mix(col, cBone, smoothstep(0.78, 1.05, h + ridge * 0.3));
      return col;
    }
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float t = u_time;

    // Height & finite-difference normal for 3D optical refraction
    float eps = 0.012;
    float hC = glassField(uv, t, u_mouse);
    float hX = glassField(uv + vec2(eps, 0.0), t, u_mouse);
    float hY = glassField(uv + vec2(0.0, eps), t, u_mouse);

    vec3 normal = normalize(vec3((hC - hX) / eps, (hC - hY) / eps, 2.2));
    vec3 viewDir = normalize(vec3(-uv * 0.35, 1.0));

    // Studio key light shifts subtly with pointer
    vec3 lightDir = normalize(vec3(0.55 + u_mouse.x * 0.35, 0.65 - u_mouse.y * 0.3, 0.85));
    vec3 rimDir = normalize(vec3(-0.75, -0.45, 0.6));

    float diff = max(dot(normal, lightDir), 0.0);
    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfVec), 0.0), 42.0);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
    float rim = max(dot(normal, rimDir), 0.0) * fresnel;

    // Chromatic dispersion across blown glass ridges
    float disp = 0.045 * fresnel;
    float hR = glassField(uv + normal.xy * disp, t, u_mouse);
    float hB = glassField(uv - normal.xy * disp, t, u_mouse);

    float ridge = clamp(spec + fresnel * 0.45, 0.0, 1.0);
    float r = samplePalette(hR + diff * 0.14, ridge).r;
    float g = samplePalette(hC + diff * 0.14, ridge).g;
    float b = samplePalette(hB + diff * 0.14, ridge).b;

    vec3 col = vec3(r, g, b);
    col += vec3(0.98, 0.96, 0.92) * spec * 0.58;
    col += vec3(0.85, 0.88, 0.96) * rim * 0.36;

    // Soft gallery vignette
    float vig = smoothstep(1.35, 0.32, length(uv * vec2(0.82, 1.0)));
    col *= mix(0.68, 1.04, vig);

    // Subtle analog film grain for human tactile warmth
    float grain = (hash(gl_FragCoord.xy + fract(t) * 97.0) - 0.5) * 0.028;
    col = clamp(col + grain, 0.0, 1.0);

    gl_FragColor = vec4(col, 1.0);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function AuthGlassCanvas({ variant, className }: AuthGlassCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const modeIndex = variant === 'login' ? 0 : variant === 'register' ? 1 : 2;

    let rafId = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const gl = canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' });

    const onPointerMove = (e: PointerEvent) => {
      targetMouseX = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      targetMouseY = (e.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    if (!gl) {
      // Fallback 2D sculptural gradient if WebGL context is unavailable
      const ctx = canvas.getContext('2d');
      const drawFallback = () => {
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.max(1, Math.floor(rect.width));
        canvas.height = Math.max(1, Math.floor(rect.height));
        if (!ctx) return;
        const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        if (variant === 'login') {
          g.addColorStop(0, '#090A0F');
          g.addColorStop(0.55, '#1A2B5E');
          g.addColorStop(1, '#D9A86C');
        } else if (variant === 'register') {
          g.addColorStop(0, '#0A110F');
          g.addColorStop(0.55, '#1B5E4B');
          g.addColorStop(1, '#C8502B');
        } else {
          g.addColorStop(0, '#0C0E14');
          g.addColorStop(0.55, '#2A3C63');
          g.addColorStop(1, '#B8C4D4');
        }
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      };
      drawFallback();
      const ro = new ResizeObserver(drawFallback);
      ro.observe(canvas);
      return () => {
        ro.disconnect();
        window.removeEventListener('pointermove', onPointerMove);
      };
    }

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const resLoc = gl.getUniformLocation(program, 'u_resolution');
    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const mouseLoc = gl.getUniformLocation(program, 'u_mouse');
    const modeLoc = gl.getUniformLocation(program, 'u_mode');

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const start = performance.now();

    const render = (now: number) => {
      const elapsed = reduceMotion ? 2.4 : (now - start) * 0.001;
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, elapsed);
      gl.uniform2f(mouseLoc, mouseX, mouseY);
      gl.uniform1i(modeLoc, modeIndex);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (!reduceMotion) {
        rafId = window.requestAnimationFrame(render);
      }
    };

    rafId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
      }}
    />
  );
}
