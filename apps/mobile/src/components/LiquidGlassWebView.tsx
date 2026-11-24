import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { WebView, WebViewProps } from 'react-native-webview';

export type LiquidGlassVariant = 'login' | 'register' | 'forgot' | 'splash';

const ShaderWebView = WebView as unknown as React.ComponentType<WebViewProps>;

const BASE_BG: Record<LiquidGlassVariant, string> = {
  login: '#090A0F',
  register: '#0A110F',
  forgot: '#0C0E14',
  splash: '#08090D',
};

function buildShaderHtml(modeIndex: number, fallbackBg: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
<style>
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: ${fallbackBg};
  }
  canvas {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
</head>
<body>
<canvas id="gl"></canvas>
<script>
(function () {
  var MODE = ${modeIndex};
  var canvas = document.getElementById('gl');
  var gl = canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' });

  function drawFallback() {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = Math.max(1, window.innerWidth);
    canvas.height = Math.max(1, window.innerHeight);
    var g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    if (MODE === 0) {
      g.addColorStop(0, '#090A0F');
      g.addColorStop(0.55, '#1A2B5E');
      g.addColorStop(1, '#D9A86C');
    } else if (MODE === 1) {
      g.addColorStop(0, '#0A110F');
      g.addColorStop(0.55, '#1B5E4B');
      g.addColorStop(1, '#C8502B');
    } else if (MODE === 2) {
      g.addColorStop(0, '#0C0E14');
      g.addColorStop(0.55, '#2A3C63');
      g.addColorStop(1, '#B8C4D4');
    } else {
      g.addColorStop(0, '#08090D');
      g.addColorStop(0.55, '#1C2238');
      g.addColorStop(1, '#D9A86C');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (!gl) {
    drawFallback();
    return;
  }

  var vsSrc = 'attribute vec2 a_pos; void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }';
  var fsSrc = [
    'precision highp float;',
    'uniform vec2 u_res;',
    'uniform float u_time;',
    'uniform int u_mode;',
    'float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }',
    'float noise(vec2 p) {',
    '  vec2 i = floor(p); vec2 f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);',
    '}',
    'float fbm(vec2 p) {',
    '  float v = 0.0; float a = 0.5; mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);',
    '  for (int i = 0; i < 4; i++) { v += a * noise(p); p = rot * p * 2.02 + vec2(1.7, 9.2); a *= 0.5; }',
    '  return v;',
    '}',
    'float field(vec2 p, float t) {',
    '  if (u_mode == 0) {',
    '    vec2 q = vec2(fbm(p * 1.3 + vec2(t * 0.11, -t * 0.07)), fbm(p * 1.4 + vec2(-t * 0.08, t * 0.09)));',
    '    float fold = sin(p.x * 2.3 + p.y * 1.5 + q.x * 3.8 + t * 0.34);',
    '    return fbm(p * 1.55 + q * 1.75) * 0.68 + fold * 0.22;',
    '  } else if (u_mode == 1) {',
    '    vec2 diag = vec2(p.x * 0.85 - p.y * 0.75, p.x * 0.75 + p.y * 0.85);',
    '    vec2 q = vec2(fbm(diag * 1.45 - vec2(t * 0.09, t * 0.06)), fbm(diag * 1.3 + vec2(t * 0.07, -t * 0.10)));',
    '    float wave = sin(diag.x * 3.0 + q.y * 4.1 - t * 0.36);',
    '    return fbm(diag * 1.4 + q * 1.55) * 0.65 + wave * 0.24;',
    '  } else if (u_mode == 2) {',
    '    float d = length(p * vec2(1.1, 0.95));',
    '    vec2 q = vec2(fbm(p * 1.2 + vec2(t * 0.06)), fbm(p * 1.2 - vec2(t * 0.06)));',
    '    float rip = sin(d * 4.8 - t * 0.4 + q.x * 2.5) * exp(-d * 0.55);',
    '    return fbm(p * 1.25 + q * 1.3) * 0.62 + rip * 0.28;',
    '  } else {',
    '    float d = length(p);',
    '    vec2 rotp = mat2(cos(t * 0.07), -sin(t * 0.07), sin(t * 0.07), cos(t * 0.07)) * p;',
    '    vec2 q = vec2(fbm(rotp * 1.35 + vec2(t * 0.08, -t * 0.06)), fbm(rotp * 1.35 - vec2(t * 0.07, t * 0.09)));',
    '    float bloom = sin(d * 3.6 - t * 0.48 + q.x * 3.2) * exp(-d * 0.36);',
    '    return fbm(rotp * 1.45 + q * 1.65) * 0.64 + bloom * 0.26;',
    '  }',
    '}',
    'vec3 palette(float h, float ridge) {',
    '  if (u_mode == 0) {',
    '    vec3 c0 = vec3(0.035, 0.039, 0.062); vec3 c1 = vec3(0.102, 0.169, 0.369);',
    '    vec3 c2 = vec3(0.851, 0.659, 0.424); vec3 c3 = vec3(0.961, 0.937, 0.902);',
    '    vec3 col = mix(c0, c1, smoothstep(0.05, 0.55, h));',
    '    col = mix(col, c2, smoothstep(0.46, 0.84, h) * 0.82);',
    '    return mix(col, c3, smoothstep(0.76, 1.05, h + ridge * 0.32));',
    '  } else if (u_mode == 1) {',
    '    vec3 c0 = vec3(0.039, 0.067, 0.059); vec3 c1 = vec3(0.106, 0.369, 0.294);',
    '    vec3 c2 = vec3(0.784, 0.314, 0.169); vec3 c3 = vec3(0.945, 0.910, 0.851);',
    '    vec3 col = mix(c0, c1, smoothstep(0.08, 0.52, h));',
    '    col = mix(col, c2, smoothstep(0.45, 0.82, h) * 0.86);',
    '    return mix(col, c3, smoothstep(0.75, 1.06, h + ridge * 0.28));',
    '  } else if (u_mode == 2) {',
    '    vec3 c0 = vec3(0.047, 0.055, 0.078); vec3 c1 = vec3(0.165, 0.235, 0.388);',
    '    vec3 c2 = vec3(0.722, 0.769, 0.831); vec3 c3 = vec3(0.918, 0.894, 0.855);',
    '    vec3 col = mix(c0, c1, smoothstep(0.10, 0.54, h));',
    '    col = mix(col, c2, smoothstep(0.50, 0.86, h) * 0.78);',
    '    return mix(col, c3, smoothstep(0.78, 1.05, h + ridge * 0.3));',
    '  } else {',
    '    vec3 c0 = vec3(0.031, 0.035, 0.051); vec3 c1 = vec3(0.125, 0.165, 0.325);',
    '    vec3 c2 = vec3(0.847, 0.651, 0.412); vec3 c3 = vec3(0.968, 0.949, 0.914);',
    '    vec3 col = mix(c0, c1, smoothstep(0.06, 0.52, h));',
    '    col = mix(col, c2, smoothstep(0.44, 0.84, h) * 0.85);',
    '    return mix(col, c3, smoothstep(0.74, 1.04, h + ridge * 0.34));',
    '  }',
    '}',
    'void main() {',
    '  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res.xy) / min(u_res.x, u_res.y);',
    '  float t = u_time;',
    '  float eps = 0.013;',
    '  float hC = field(uv, t); float hX = field(uv + vec2(eps, 0.0), t); float hY = field(uv + vec2(0.0, eps), t);',
    '  vec3 n = normalize(vec3((hC - hX) / eps, (hC - hY) / eps, 2.2));',
    '  vec3 v = normalize(vec3(-uv * 0.35, 1.0));',
    '  vec3 l = normalize(vec3(0.55 + sin(t * 0.25) * 0.2, 0.68, 0.85));',
    '  vec3 rDir = normalize(vec3(-0.75, -0.45, 0.6));',
    '  float diff = max(dot(n, l), 0.0);',
    '  float spec = pow(max(dot(n, normalize(l + v)), 0.0), 40.0);',
    '  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);',
    '  float rim = max(dot(n, rDir), 0.0) * fres;',
    '  float disp = 0.042 * fres;',
    '  float hR = field(uv + n.xy * disp, t); float hB = field(uv - n.xy * disp, t);',
    '  float ridge = clamp(spec + fres * 0.45, 0.0, 1.0);',
    '  vec3 col = vec3(palette(hR + diff * 0.14, ridge).r, palette(hC + diff * 0.14, ridge).g, palette(hB + diff * 0.14, ridge).b);',
    '  col += vec3(0.98, 0.96, 0.92) * spec * 0.56 + vec3(0.85, 0.88, 0.96) * rim * 0.34;',
    '  float vig = smoothstep(1.38, 0.30, length(uv * vec2(0.85, 1.0)));',
    '  col *= mix(0.68, 1.04, vig);',
    '  col += (hash(gl_FragCoord.xy + fract(t) * 97.0) - 0.5) * 0.025;',
    '  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);',
    '}'
  ].join('\\n');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }

  var vs = compile(gl.VERTEX_SHADER, vsSrc);
  var fs = compile(gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) { drawFallback(); return; }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  var posLoc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  var resLoc = gl.getUniformLocation(prog, 'u_res');
  var timeLoc = gl.getUniformLocation(prog, 'u_time');
  var modeLoc = gl.getUniformLocation(prog, 'u_mode');

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
    canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  var start = performance.now();
  function frame(now) {
    gl.uniform2f(resLoc, canvas.width, canvas.height);
    gl.uniform1f(timeLoc, (now - start) * 0.001);
    gl.uniform1i(modeLoc, MODE);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
</script>
</body>
</html>`;
}

export function LiquidGlassWebView({ variant, style }: { variant: LiquidGlassVariant; style?: StyleProp<ViewStyle> }) {
  const modeIndex = variant === 'login' ? 0 : variant === 'register' ? 1 : variant === 'forgot' ? 2 : 3;
  const bg = BASE_BG[variant];
  const html = useMemo(() => buildShaderHtml(modeIndex, bg), [modeIndex, bg]);

  return (
    <View style={[styles.wrap, { backgroundColor: bg }, style]} pointerEvents="none">
      <ShaderWebView
        source={{ html }}
        originWhitelist={['*']}
        javaScriptEnabled
        scrollEnabled={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        overScrollMode="never"
        androidLayerType="hardware"
        style={[styles.webview, { backgroundColor: bg }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
});
