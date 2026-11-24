import * as THREE from 'three';
import {
  ColorPalette,
  FloorPatternId,
  FontStyleId,
  RoomSignage,
  getFontStyleById,
} from '@patra/shared';

let cachedGrain: THREE.CanvasTexture | null = null;

/** Generates a subtle cotton-paper fiber texture for tactile paper realism. */
export function getPaperGrainTexture(): THREE.CanvasTexture {
  if (cachedGrain) return cachedGrain;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 6500; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const shade = 232 + Math.floor(Math.random() * 22);
    ctx.fillStyle = `rgb(${shade},${shade - 2},${shade - 5})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  ctx.strokeStyle = 'rgba(180, 165, 145, 0.08)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 14, y + (Math.random() - 0.5) * 14);
    ctx.stroke();
  }

  cachedGrain = new THREE.CanvasTexture(canvas);
  cachedGrain.wrapS = THREE.RepeatWrapping;
  cachedGrain.wrapT = THREE.RepeatWrapping;
  cachedGrain.repeat.set(2, 2);
  return cachedGrain;
}

/** Renders a crisp high-DPI framed invitation plaque texture with selected font style. */
export function createSignageTexture(
  signage: RoomSignage,
  palette: ColorPalette,
  fontStyleId?: FontStyleId
): THREE.CanvasTexture {
  const fontOpt = getFontStyleById(fontStyleId);
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext('2d')!;

  // Card backing
  ctx.fillStyle = palette.paperBase;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Warm radial stationery vignette
  const grad = ctx.createRadialGradient(512, 384, 80, 512, 384, 580);
  grad.addColorStop(0, 'rgba(255,255,255,0.34)');
  grad.addColorStop(1, 'rgba(0,0,0,0.04)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Double architectural border
  ctx.strokeStyle = palette.inkColor;
  ctx.lineWidth = 8;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

  ctx.lineWidth = 3;
  ctx.strokeRect(42, 42, canvas.width - 84, canvas.height - 84);

  // Corner floral dots
  const corners = [
    [62, 62],
    [canvas.width - 62, 62],
    [62, canvas.height - 62],
    [canvas.width - 62, canvas.height - 62],
  ];
  for (const [cx, cy] of corners) {
    ctx.fillStyle = palette.accentPrimary;
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = palette.inkColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  const centerX = canvas.width / 2;

  // Top jewel diamond ornament
  ctx.fillStyle = palette.accentSecondary;
  ctx.beginPath();
  ctx.moveTo(centerX, 74);
  ctx.lineTo(centerX + 10, 88);
  ctx.lineTo(centerX, 102);
  ctx.lineTo(centerX - 10, 88);
  ctx.closePath();
  ctx.fill();

  // Event Title (Large & Effortlessly Readable)
  ctx.fillStyle = palette.inkColor;
  ctx.font = `700 104px ${fontOpt.titleFont}`;
  ctx.fillText(signage.eventTitle || 'Celebration', centerX, 206, canvas.width - 130);

  // Host Line
  ctx.fillStyle = palette.inkColor;
  ctx.font = `600 58px ${fontOpt.titleFont}`;
  ctx.fillText(signage.hostLine || 'Together Forever', centerX, 294, canvas.width - 140);

  // Divider with dot
  ctx.strokeStyle = palette.accentPrimary;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(centerX - 150, 336);
  ctx.lineTo(centerX + 150, 336);
  ctx.stroke();

  // Date & Time
  ctx.fillStyle = palette.inkColor;
  ctx.font = `700 46px ${fontOpt.bodyFont}`;
  ctx.fillText(signage.dateText || 'Save the Date', centerX, 418, canvas.width - 130);

  ctx.font = `700 40px ${fontOpt.bodyFont}`;
  ctx.fillStyle = palette.accentPrimary;
  ctx.fillText(signage.timeText || '6:00 PM', centerX, 480, canvas.width - 130);

  // Venue
  ctx.fillStyle = palette.inkColor;
  ctx.font = `600 40px ${fontOpt.bodyFont}`;
  ctx.fillText(signage.venueText || 'Courtyard Pavilion', centerX, 562, canvas.width - 130);

  // Bottom Note
  ctx.font = `italic 600 34px ${fontOpt.titleFont}`;
  ctx.globalAlpha = 0.88;
  ctx.fillText(signage.noteText || '', centerX, 648, canvas.width - 140);
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Creates architectural floor textures (Rangoli, Checkered Marble, Confetti, Woven Rug, etc.). */
export function createFloorTexture(pattern: FloorPatternId, palette: ColorPalette): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = palette.floorColor;
  ctx.fillRect(0, 0, 512, 512);

  if (pattern === 'checkered_marble') {
    const size = 64;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = palette.paperBase;
          ctx.globalAlpha = 0.55;
          ctx.fillRect(x * size, y * size, size, size);
        }
      }
    }
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = palette.inkColor;
    ctx.lineWidth = 2;
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * size, 0);
      ctx.lineTo(i * size, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * size);
      ctx.lineTo(512, i * size);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (pattern === 'rangoli_petal') {
    const cx = 256;
    const cy = 256;
    ctx.strokeStyle = palette.inkColor;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(cx, cy, 170, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a);
      ctx.fillStyle = i % 2 === 0 ? palette.accentPrimary : palette.accentSecondary;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.ellipse(0, -105, 24, 52, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = palette.inkColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  } else if (pattern === 'confetti_dots') {
    const colors = [palette.accentPrimary, palette.accentSecondary, palette.inkColor];
    for (let i = 0; i < 90; i++) {
      const x = ((i * 73) % 480) + 16;
      const y = ((i * 137) % 480) + 16;
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.arc(x, y, 4 + (i % 5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (pattern === 'woven_rug') {
    ctx.fillStyle = palette.paperBase;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(64, 64, 384, 384);
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = palette.inkColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(72, 72, 368, 368);
    ctx.strokeStyle = palette.accentPrimary;
    ctx.lineWidth = 3;
    ctx.strokeRect(94, 94, 324, 324);
    ctx.globalAlpha = 1;
  } else if (pattern === 'wood_parquet') {
    ctx.strokeStyle = palette.inkColor;
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 2;
    for (let y = 0; y < 512; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (pattern === 'starry_tile') {
    for (let i = 0; i < 65; i++) {
      const x = ((i * 97) % 470) + 20;
      const y = ((i * 163) % 470) + 20;
      ctx.fillStyle = i % 2 === 0 ? palette.accentPrimary : palette.accentSecondary;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.moveTo(x, y - 7);
      ctx.lineTo(x + 2, y - 2);
      ctx.lineTo(x + 7, y);
      ctx.lineTo(x + 2, y + 2);
      ctx.lineTo(x, y + 7);
      ctx.lineTo(x - 2, y + 2);
      ctx.lineTo(x - 7, y);
      ctx.lineTo(x - 2, y - 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  ctx.strokeStyle = palette.inkColor;
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 504, 504);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Renders crisp high-DPI floating custom text onto a transparent 3D wall label texture. */
export function createCustomTextTexture(
  text: string,
  palette: ColorPalette,
  colorHex?: string,
  fontStyleId?: FontStyleId
): THREE.CanvasTexture {
  const fontOpt = getFontStyleById(fontStyleId);
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const label = (text || '').trim() || 'Custom Text';
  const fill = colorHex || palette.inkColor;

  // Contrast halo so custom text stays legible on both dark & light wall regions
  const rgb = parseInt(fill.replace('#', '').slice(0, 6), 16);
  const r = (rgb >> 16) & 255;
  const g = (rgb >> 8) & 255;
  const b = rgb & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const isLightFill = luminance > 0.55;

  const fontSize = label.length > 26 ? 34 : label.length > 18 ? 42 : 52;
  ctx.font = `700 ${fontSize}px ${fontOpt.titleFont}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.shadowColor = isLightFill ? 'rgba(0, 0, 0, 0.55)' : 'rgba(255, 255, 255, 0.65)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  ctx.lineWidth = 4;
  ctx.strokeStyle = isLightFill ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.72)';
  ctx.strokeText(label, canvas.width / 2, canvas.height / 2, canvas.width - 36);

  ctx.fillStyle = fill;
  ctx.fillText(label, canvas.width / 2, canvas.height / 2, canvas.width - 36);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
