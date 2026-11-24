import * as THREE from 'three';
import { CutoutFilter, CutoutShape, PhotoCutoutConfig } from '@patra/shared';

function drawPlaceholderPortrait(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#F5DEC9');
  grad.addColorStop(0.65, '#E4B799');
  grad.addColorStop(1, '#C58A70');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Romantic sunlit arch + floral botanicals illustration
  ctx.fillStyle = '#FFF5EA';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.34, w * 0.28, 0, Math.PI * 2);
  ctx.fill();

  // Stylized silhouettes
  ctx.fillStyle = '#53352D';
  ctx.beginPath();
  ctx.arc(w * 0.4, h * 0.42, w * 0.085, 0, Math.PI * 2);
  ctx.arc(w * 0.6, h * 0.44, w * 0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(w * 0.4, h * 0.72, w * 0.15, w * 0.24, 0, Math.PI, Math.PI * 2);
  ctx.ellipse(w * 0.6, h * 0.72, w * 0.14, w * 0.22, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#8E5343';
  ctx.font = 'italic 600 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Upload Your Photo', w * 0.5, h * 0.87);
}

function traceShapePath(
  ctx: CanvasRenderingContext2D,
  shape: CutoutShape,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.beginPath();
  if (shape === 'circle') {
    const r = Math.min(w, h) * 0.48;
    ctx.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2);
  } else if (shape === 'oval') {
    ctx.ellipse(x + w / 2, y + h / 2, w * 0.45, h * 0.48, 0, 0, Math.PI * 2);
  } else if (shape === 'arch') {
    const r = w * 0.48;
    const cx = x + w / 2;
    const topArcY = y + r;
    ctx.moveTo(cx - r, y + h);
    ctx.lineTo(cx - r, topArcY);
    ctx.arc(cx, topArcY, r, Math.PI, 0, false);
    ctx.lineTo(cx + r, y + h);
    ctx.closePath();
  } else if (shape === 'scallop') {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const rx = w * 0.43;
    const ry = h * 0.45;
    const lobes = 18;
    for (let i = 0; i <= 180; i++) {
      const a = (i / 180) * Math.PI * 2;
      const bump = 1 + Math.abs(Math.sin(a * (lobes / 2))) * 0.085;
      const px = cx + Math.cos(a) * rx * bump;
      const py = cy + Math.sin(a) * ry * bump;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else {
    // Polaroid / rectangular window
    const r = 16;
    ctx.roundRect(x, y, w, h, r);
  }
}

function getCanvasFilterCss(filter: CutoutFilter): string {
  if (filter === 'vintage_warm') return 'sepia(0.18) saturate(1.12) contrast(1.04) brightness(1.02)';
  if (filter === 'sepia_editorial') return 'sepia(0.68) contrast(1.08) brightness(0.98)';
  if (filter === 'monochrome_noir') return 'grayscale(1) contrast(1.15) brightness(1.02)';
  return 'none';
}

function createCutoutCardTexture(cfg: PhotoCutoutConfig, img?: HTMLImageElement | null): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Outer die-cut handmade paper card silhouette
  ctx.save();
  const outerPad = 14;
  traceShapePath(
    ctx,
    cfg.shape,
    outerPad,
    outerPad,
    canvas.width - outerPad * 2,
    canvas.height - outerPad * 2
  );
  ctx.fillStyle = cfg.paperBorderColor || '#FFF8EE';
  ctx.shadowColor = 'rgba(20, 16, 12, 0.25)';
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(130, 108, 86, 0.45)';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();

  // Inner clipped photo window
  const hasCaption = Boolean(cfg.caption?.trim()) || cfg.shape === 'polaroid';
  const imgX = 42;
  const imgY = 44;
  const imgW = canvas.width - 84;
  const imgH = hasCaption ? canvas.height - 156 : canvas.height - 88;

  ctx.save();
  traceShapePath(ctx, cfg.shape, imgX, imgY, imgW, imgH);
  ctx.clip();
  ctx.filter = getCanvasFilterCss(cfg.filter);

  if (img && img.naturalWidth > 0) {
    // Cover fit + user crop zoom & pan offsets
    const zoom = Math.max(1, Math.min(3.0, cfg.cropZoom ?? 1));
    const panX = Math.max(-1, Math.min(1, cfg.cropX ?? 0));
    const panY = Math.max(-1, Math.min(1, cfg.cropY ?? 0));
    const scale = Math.max(imgW / img.naturalWidth, imgH / img.naturalHeight) * zoom;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const maxShiftX = Math.max(0, (drawW - imgW) / 2);
    const maxShiftY = Math.max(0, (drawH - imgH) / 2);
    const drawX = imgX + (imgW - drawW) / 2 + panX * maxShiftX;
    const drawY = imgY + (imgH - drawH) / 2 + panY * maxShiftY;
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  } else {
    drawPlaceholderPortrait(ctx, canvas.width, canvas.height);
  }

  ctx.filter = 'none';
  ctx.restore();

  // Subtle gold hairline border around portrait window
  ctx.save();
  traceShapePath(ctx, cfg.shape, imgX, imgY, imgW, imgH);
  ctx.strokeStyle = 'rgba(198, 152, 74, 0.72)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // Handwritten / serif caption below portrait
  if (cfg.caption?.trim()) {
    ctx.fillStyle = '#332820';
    ctx.font = 'italic 600 28px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cfg.caption.trim().slice(0, 26), canvas.width / 2, canvas.height - 62);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildPhotoCutoutProp(cfg: PhotoCutoutConfig): THREE.Group {
  const group = new THREE.Group();
  const textures: THREE.Texture[] = [];

  const initialTex = createCutoutCardTexture(cfg, null);
  textures.push(initialTex);

  const cardMat = new THREE.MeshStandardMaterial({
    map: initialTex,
    transparent: true,
    alphaTest: 0.15,
    roughness: 0.78,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });

  // Async image load if dataUrl/URL is provided, swapping CanvasTexture seamlessly when decoded
  if (cfg.imageDataUrl && cfg.imageDataUrl.trim().length > 10) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const loadedTex = createCutoutCardTexture(cfg, img);
      textures.push(loadedTex);
      cardMat.map = loadedTex;
      cardMat.needsUpdate = true;
    };
    img.src = cfg.imageDataUrl;
  }

  const brassMat = new THREE.MeshStandardMaterial({
    color: '#D4A84E',
    roughness: 0.3,
    metalness: 0.65,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: '#8D5F3C',
    roughness: 0.72,
    metalness: 0.06,
  });

  const scale = Math.max(0.6, Math.min(1.9, cfg.scale || 1));

  if (cfg.placement === 'wall_frame') {
    const cardW = 0.88 * scale;
    const cardH = 1.1 * scale;
    const backing = new THREE.Mesh(
      new THREE.BoxGeometry(cardW * 0.9, cardH * 0.9, 0.03),
      new THREE.MeshStandardMaterial({ color: cfg.paperBorderColor || '#FFF8EE', roughness: 0.8 })
    );
    backing.position.z = -0.02;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(cardW, cardH), cardMat);
    face.castShadow = true;
    face.userData = { photoCutoutFace: true };
    // Decorative brass studs on corners
    for (const sx of [-cardW * 0.36, cardW * 0.36]) {
      const stud = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), brassMat);
      stud.position.set(sx, cardH * 0.38, 0.015);
      group.add(stud);
    }
    group.add(backing, face);
  } else if (cfg.placement === 'floating_easel') {
    const cardW = 0.82 * scale;
    const cardH = 1.02 * scale;
    const holder = new THREE.Group();
    holder.position.y = cardH * 0.56;
    holder.rotation.x = -0.18;

    const face = new THREE.Mesh(new THREE.PlaneGeometry(cardW, cardH), cardMat);
    face.castShadow = true;
    face.userData = { photoCutoutFace: true };
    holder.add(face);

    // Mini tabletop wooden A-frame easel
    for (const lx of [-0.22 * scale, 0.22 * scale]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.032, cardH * 1.15, 0.032), woodMat);
      leg.position.set(lx, cardH * 0.52, -0.04);
      leg.rotation.z = lx < 0 ? -0.14 : 0.14;
      leg.rotation.x = -0.16;
      leg.castShadow = true;
      group.add(leg);
    }
    const backLeg = new THREE.Mesh(new THREE.BoxGeometry(0.032, cardH * 1.08, 0.032), woodMat);
    backLeg.position.set(0, cardH * 0.48, -0.26 * scale);
    backLeg.rotation.x = 0.35;
    const ledge = new THREE.Mesh(new THREE.BoxGeometry(cardW * 0.82, 0.04, 0.075), brassMat);
    ledge.position.set(0, cardH * 0.16, 0.05);
    group.add(holder, backLeg, ledge);
  } else {
    // floor_standee
    const cardW = 0.92 * scale;
    const cardH = 1.15 * scale;
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(cardW * 0.62, 0.055, 0.22), brassMat);
    plinth.position.y = 0.028;
    plinth.castShadow = true;
    plinth.receiveShadow = true;

    const card = new THREE.Mesh(new THREE.PlaneGeometry(cardW, cardH), cardMat);
    card.position.set(0, cardH * 0.5 + 0.03, 0.02);
    card.castShadow = true;
    card.userData = { photoCutoutFace: true };

    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.05, cardH * 0.68, 0.025), woodMat);
    strut.position.set(0, cardH * 0.34, -0.14);
    strut.rotation.x = 0.38;

    group.add(plinth, card, strut);
  }

  if (cfg.placement !== 'wall_frame') {
    group.rotation.y = cfg.rotationY ?? 0.2;
  }

  return group;
}
