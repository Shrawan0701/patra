import { CARD_FORMATS } from './cardTemplates';
import { CardAspectRatio, CardFrameStyle, FontStyleId, InvitationCardConfig } from './types';

function resolveCardFont(id: FontStyleId): { titleFont: string; bodyFont: string } {
  const fonts: Record<FontStyleId, { titleFont: string; bodyFont: string }> = {
    royal_serif: { titleFont: 'Georgia, "Times New Roman", serif', bodyFont: 'Georgia, serif' },
    handwritten: { titleFont: '"Brush Script MT", "Segoe Print", Georgia, cursive', bodyFont: 'Georgia, serif' },
    botanical: { titleFont: '"Palatino Linotype", Georgia, serif', bodyFont: 'system-ui, sans-serif' },
    playful_hand: { titleFont: '"Trebuchet MS", "Comic Sans MS", sans-serif', bodyFont: 'system-ui, sans-serif' },
    modern_sans: { titleFont: '"Helvetica Neue", Arial, sans-serif', bodyFont: 'system-ui, sans-serif' },
    festive_script: { titleFont: 'Georgia, "Times New Roman", serif', bodyFont: 'Georgia, serif' },
  };
  return fonts[id] || fonts.royal_serif;
}

export interface Canvas2DGradientLike {
  addColorStop: (offset: number, color: string) => void;
}

export interface Canvas2DContextLike {
  fillStyle: any;
  strokeStyle: any;
  lineWidth: number;
  lineCap: 'butt' | 'round' | 'square';
  lineJoin: 'round' | 'bevel' | 'miter';
  font: string;
  textAlign: 'left' | 'right' | 'center' | 'start' | 'end';
  textBaseline: 'top' | 'hanging' | 'middle' | 'alphabetic' | 'ideographic' | 'bottom';
  globalAlpha: number;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  save: () => void;
  restore: () => void;
  translate: (x: number, y: number) => void;
  rotate: (angle: number) => void;
  scale: (x: number, y: number) => void;
  beginPath: () => void;
  closePath: () => void;
  moveTo: (x: number, y: number) => void;
  lineTo: (x: number, y: number) => void;
  quadraticCurveTo: (cpx: number, cpy: number, x: number, y: number) => void;
  bezierCurveTo: (cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number) => void;
  arc: (x: number, y: number, r: number, startAngle: number, endAngle: number) => void;
  ellipse: (x: number, y: number, rx: number, ry: number, rot: number, sa: number, ea: number) => void;
  rect: (x: number, y: number, w: number, h: number) => void;
  fillRect: (x: number, y: number, w: number, h: number) => void;
  strokeRect: (x: number, y: number, w: number, h: number) => void;
  fill: () => void;
  stroke: () => void;
  clip: () => void;
  fillText: (text: string, x: number, y: number, maxWidth?: number) => void;
  measureText: (text: string) => { width: number };
  createLinearGradient: (x0: number, y0: number, x1: number, y1: number) => Canvas2DGradientLike;
  createRadialGradient: (x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) => Canvas2DGradientLike;
  drawImage: (
    image: any,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ) => void;
}

export interface CardPhotoSourceLike {
  width: number;
  height: number;
  naturalWidth?: number;
  naturalHeight?: number;
}

export function getCardPixelSize(ratio: CardAspectRatio): { width: number; height: number } {
  const fmt = CARD_FORMATS.find((f) => f.id === ratio) ?? CARD_FORMATS[0];
  return { width: fmt.width, height: fmt.height };
}

function traceFramePath(
  ctx: Canvas2DContextLike,
  style: CardFrameStyle,
  w: number,
  h: number,
  inset: number
) {
  const left = inset;
  const right = w - inset;
  const top = inset;
  const bottom = h - inset;
  const midX = w / 2;

  ctx.beginPath();
  if (style === 'house_gable') {
    const shY = top + (bottom - top) * 0.16;
    ctx.moveTo(left, bottom);
    ctx.lineTo(left, shY);
    ctx.lineTo(midX, top);
    ctx.lineTo(right, shY);
    ctx.lineTo(right, bottom);
    ctx.closePath();
  } else if (style === 'mughal_arch') {
    const shY = top + (bottom - top) * 0.18;
    ctx.moveTo(left, bottom);
    ctx.lineTo(left, shY);
    ctx.quadraticCurveTo(left, top + 60, midX - 80, top + 40);
    ctx.quadraticCurveTo(midX, top - 6, midX, top);
    ctx.quadraticCurveTo(midX, top - 6, midX + 80, top + 40);
    ctx.quadraticCurveTo(right, top + 60, right, shY);
    ctx.lineTo(right, bottom);
    ctx.closePath();
  } else if (style === 'villa_arch') {
    const shY = top + (bottom - top) * 0.22;
    ctx.moveTo(left, bottom);
    ctx.lineTo(left, shY);
    ctx.quadraticCurveTo(left, top, midX, top);
    ctx.quadraticCurveTo(right, top, right, shY);
    ctx.lineTo(right, bottom);
    ctx.closePath();
  } else if (style === 'scalloped') {
    const arcR = 46;
    const span = right - left;
    const steps = Math.max(4, Math.floor(span / (arcR * 2)));
    const stepW = span / steps;
    ctx.moveTo(left, bottom);
    ctx.lineTo(left, top + 34);
    for (let i = 0; i < steps; i++) {
      const sx = left + i * stepW;
      ctx.quadraticCurveTo(sx + stepW / 2, top - 14, sx + stepW, top + 34);
    }
    ctx.lineTo(right, bottom);
    ctx.closePath();
  } else {
    ctx.rect(left, top, right - left, bottom - top);
  }
}

function drawRosette(
  ctx: Canvas2DContextLike,
  cx: number,
  cy: number,
  r: number,
  petalHex: string,
  centerHex: string,
  strokeHex: string,
  petals = 6
) {
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < petals; i++) {
    ctx.save();
    ctx.rotate((i / petals) * Math.PI * 2);
    ctx.fillStyle = petalHex;
    ctx.strokeStyle = strokeHex;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.54, r * 0.35, r * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = centerHex;
  ctx.strokeStyle = strokeHex;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawTopMotif(
  ctx: Canvas2DContextLike,
  w: number,
  motifY: number,
  card: InvitationCardConfig
) {
  const m = card.motif;
  if (m === 'none') return;

  ctx.save();
  const startX = w * 0.16;
  const endX = w * 0.84;
  const span = endX - startX;

  if (m === 'marigold_toran') {
    ctx.strokeStyle = card.secondaryAccentColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const x = startX + u * span;
      const y = motifY + Math.sin(u * Math.PI) * 58;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const beads = 19;
    for (let i = 0; i <= beads; i++) {
      const u = i / beads;
      const x = startX + u * span;
      const y = motifY + Math.sin(u * Math.PI) * 58;
      const rad = i % 2 === 0 ? 18 : 13;
      ctx.fillStyle = i % 2 === 0 ? card.accentColor : card.secondaryAccentColor;
      ctx.strokeStyle = card.inkColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y + (i % 2) * 3, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (m === 'temple_bells') {
    ctx.strokeStyle = card.accentColor;
    ctx.lineWidth = 3.5;
    [0.24, 0.5, 0.76].forEach((pos, idx) => {
      const bx = w * pos;
      const cordLen = idx === 1 ? 82 : 58;
      ctx.beginPath();
      ctx.moveTo(bx, motifY - 35);
      ctx.lineTo(bx, motifY + cordLen);
      ctx.stroke();

      ctx.fillStyle = idx === 1 ? card.accentColor : card.secondaryAccentColor;
      ctx.strokeStyle = card.inkColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx - 24, motifY + cordLen + 36);
      ctx.quadraticCurveTo(bx, motifY + cordLen - 16, bx + 24, motifY + cordLen + 36);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(bx, motifY + cordLen + 44, 7, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (m === 'alpona_lotus') {
    const cx = w / 2;
    const cy = motifY + 12;
    ctx.strokeStyle = card.accentColor;
    ctx.lineWidth = 2.6;
    for (let i = -3; i <= 3; i++) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(i * 0.34);
      ctx.fillStyle = i % 2 === 0 ? card.accentColor : card.secondaryAccentColor;
      ctx.beginPath();
      ctx.moveTo(0, 26);
      ctx.quadraticCurveTo(-24, -14, 0, -64 + Math.abs(i) * 10);
      ctx.quadraticCurveTo(24, -14, 0, 26);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  } else if (m === 'crescent_stars') {
    const cx = w / 2;
    const cy = motifY + 8;
    ctx.fillStyle = card.accentColor;
    ctx.beginPath();
    ctx.arc(cx, cy, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = card.paperColor;
    ctx.beginPath();
    ctx.arc(cx + 15, cy - 8, 36, 0, Math.PI * 2);
    ctx.fill();

    // Hanging lanterns flanking left & right
    [w * 0.25, w * 0.75].forEach((lx) => {
      ctx.strokeStyle = card.accentColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(lx, motifY - 34);
      ctx.lineTo(lx, motifY + 34);
      ctx.stroke();
      ctx.fillStyle = card.secondaryAccentColor;
      ctx.beginPath();
      ctx.ellipse(lx, motifY + 56, 18, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  } else if (m === 'rose_swag') {
    ctx.strokeStyle = card.secondaryAccentColor;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(startX, motifY);
    ctx.quadraticCurveTo(w / 2, motifY + 72, endX, motifY);
    ctx.stroke();
    [0.12, 0.28, 0.5, 0.72, 0.88].forEach((u, idx) => {
      const x = startX + u * span;
      const y = motifY + Math.sin(u * Math.PI) * 52;
      drawRosette(
        ctx,
        x,
        y,
        idx === 2 ? 26 : 19,
        idx % 2 === 0 ? card.accentColor : card.secondaryAccentColor,
        '#FCE4A6',
        card.inkColor,
        6
      );
    });
  } else if (m === 'olive_citrus') {
    for (let i = 0; i <= 14; i++) {
      const u = i / 14;
      const x = startX + u * span;
      const y = motifY + Math.sin(u * Math.PI) * 48;
      ctx.fillStyle = card.accentColor;
      ctx.beginPath();
      ctx.ellipse(x - 12, y - 6, 16, 7, -0.6, 0, Math.PI * 2);
      ctx.ellipse(x + 12, y + 6, 16, 7, 0.6, 0, Math.PI * 2);
      ctx.fill();
      if (i === 3 || i === 7 || i === 11) {
        ctx.fillStyle = card.secondaryAccentColor;
        ctx.strokeStyle = card.inkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y + 10, 14, 17, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  } else if (m === 'sakura_branch') {
    ctx.strokeStyle = '#5B3940';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX - 18, motifY + 18);
    ctx.quadraticCurveTo(w * 0.48, motifY - 26, endX + 12, motifY + 42);
    ctx.stroke();
    [0.1, 0.26, 0.45, 0.62, 0.8, 0.93].forEach((u, idx) => {
      const x = startX + u * span;
      const y = motifY + Math.sin(u * Math.PI) * 20 + (idx % 2 === 0 ? -8 : 14);
      drawRosette(
        ctx,
        x,
        y,
        idx === 2 ? 25 : 19,
        idx % 2 === 0 ? card.accentColor : card.secondaryAccentColor,
        '#D94B6F',
        '#6A2639',
        5
      );
    });
  } else if (m === 'double_happiness') {
    const cx = w / 2;
    const cy = motifY + 12;
    ctx.fillStyle = card.accentColor;
    ctx.strokeStyle = card.inkColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = card.paperColor;
    ctx.font = '700 54px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('囍', cx, cy + 3);
  } else if (m === 'mizuhiki_knot') {
    const cx = w / 2;
    const cy = motifY + 10;
    ctx.strokeStyle = card.accentColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(cx - 28, cy, 34, 18, -0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = card.secondaryAccentColor;
    ctx.beginPath();
    ctx.ellipse(cx + 28, cy, 34, 18, 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = card.accentColor;
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fill();
  } else if (m === 'art_deco_fan') {
    const cx = w / 2;
    const cy = motifY + 34;
    ctx.strokeStyle = card.accentColor;
    ctx.lineWidth = 2.5;
    for (let i = -4; i <= 4; i++) {
      const ang = -Math.PI / 2 + i * 0.28;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang) * 76, cy + Math.sin(ang) * 76);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 38, Math.PI, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function wrapCenteredText(
  ctx: Canvas2DContextLike,
  text: string,
  cx: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3
): number {
  const words = (text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return startY;
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  const sliced = lines.slice(0, maxLines);
  sliced.forEach((l, i) => {
    ctx.fillText(l, cx, startY + i * lineHeight, maxWidth);
  });
  return startY + sliced.length * lineHeight;
}

function computePhotoBoxRect(
  slot: 1 | 2,
  w: number,
  h: number,
  card: InvitationCardConfig
): { px: number; py: number; boxW: number; boxH: number; cx: number; cy: number } {
  const bothActive = Boolean(card.photoEnabled && card.photoDataUrl && card.photo2Enabled && card.photo2DataUrl);
  const shape = slot === 2 ? (card.photo2Shape || card.photoShape || 'arch') : (card.photoShape || 'arch');
  const rawSize =
    slot === 2
      ? (card.photo2Size ?? (bothActive ? 0.27 : 0.32))
      : (card.photoSize ?? (bothActive ? 0.27 : 0.34));
  const size = Math.max(0.14, Math.min(0.55, rawSize));
  const boxW = Math.round(w * size);
  const boxH = Math.round(boxW * (shape === 'circle' ? 1 : 1.15));

  const defaultPosX = bothActive ? (slot === 1 ? -0.19 : 0.19) : 0;
  const defaultPosY = 0.295;
  const posX =
    slot === 2
      ? (typeof card.photo2PosX === 'number' ? card.photo2PosX : defaultPosX)
      : (typeof card.photoPosX === 'number' ? card.photoPosX : defaultPosX);
  const posY =
    slot === 2
      ? (typeof card.photo2PosY === 'number' ? card.photo2PosY : defaultPosY)
      : (typeof card.photoPosY === 'number' ? card.photoPosY : defaultPosY);

  const cx = Math.round(w * (0.5 + Math.max(-0.42, Math.min(0.42, posX))));
  const cy = Math.round(h * Math.max(0.12, Math.min(0.86, posY)));
  return {
    px: Math.round(cx - boxW / 2),
    py: Math.round(cy - boxH / 2),
    boxW,
    boxH,
    cx,
    cy,
  };
}

function drawSinglePhotoSlot(
  ctx: Canvas2DContextLike,
  slot: 1 | 2,
  w: number,
  h: number,
  card: InvitationCardConfig,
  photoImg: CardPhotoSourceLike
) {
  const shape = slot === 2 ? (card.photo2Shape || card.photoShape || 'arch') : (card.photoShape || 'arch');
  const { px, py, boxW, boxH } = computePhotoBoxRect(slot, w, h, card);

  ctx.save();
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(px + boxW / 2, py + boxH / 2, boxW / 2, 0, Math.PI * 2);
  } else if (shape === 'oval') {
    ctx.ellipse(px + boxW / 2, py + boxH / 2, boxW / 2, boxH / 2, 0, 0, Math.PI * 2);
  } else if (shape === 'arch') {
    ctx.moveTo(px, py + boxH);
    ctx.lineTo(px, py + boxW * 0.5);
    ctx.quadraticCurveTo(px, py, px + boxW / 2, py);
    ctx.quadraticCurveTo(px + boxW, py, px + boxW, py + boxW * 0.5);
    ctx.lineTo(px + boxW, py + boxH);
    ctx.closePath();
  } else {
    ctx.rect(px, py, boxW, boxH);
  }

  ctx.save();
  ctx.clip();
  const iw = photoImg.naturalWidth || photoImg.width;
  const ih = photoImg.naturalHeight || photoImg.height;
  const rawZoom = slot === 2 ? (card.photo2Zoom ?? 1) : (card.photoZoom ?? 1);
  const zoom = Math.max(1, Math.min(2.6, rawZoom));
  const panX = slot === 2 ? (card.photo2PanX ?? 0) : (card.photoPanX ?? 0);
  const panY = slot === 2 ? (card.photo2PanY ?? 0) : (card.photoPanY ?? 0);
  const coverScale = Math.max(boxW / iw, boxH / ih) * zoom;
  const dw = iw * coverScale;
  const dh = ih * coverScale;
  const dx = px + (boxW - dw) / 2 + panX * boxW * 0.35;
  const dy = py + (boxH - dh) / 2 + panY * boxH * 0.35;
  ctx.drawImage(photoImg, dx, dy, dw, dh);
  ctx.restore();

  ctx.strokeStyle = card.accentColor;
  ctx.lineWidth = Math.max(4, Math.round(w * 0.0055));
  ctx.stroke();
  ctx.restore();
}

export function getPhotoBoxRect(
  slot: 1 | 2,
  w: number,
  h: number,
  card: InvitationCardConfig
) {
  return computePhotoBoxRect(slot, w, h, card);
}

export function hitTestCardPhoto(
  normX: number,
  normY: number,
  w: number,
  h: number,
  card: InvitationCardConfig
): 1 | 2 | null {
  const tx = normX * w;
  const ty = normY * h;
  if (card.photo2Enabled && card.photo2DataUrl) {
    const r2 = computePhotoBoxRect(2, w, h, card);
    if (tx >= r2.px && tx <= r2.px + r2.boxW && ty >= r2.py && ty <= r2.py + r2.boxH) {
      return 2;
    }
  }
  if (card.photoEnabled && card.photoDataUrl) {
    const r1 = computePhotoBoxRect(1, w, h, card);
    if (tx >= r1.px && tx <= r1.px + r1.boxW && ty >= r1.py && ty <= r1.py + r1.boxH) {
      return 1;
    }
  }
  return null;
}

export function drawInvitationCard(
  ctx: Canvas2DContextLike,
  w: number,
  h: number,
  card: InvitationCardConfig,
  photoImg?: CardPhotoSourceLike | null,
  photoImg2?: CardPhotoSourceLike | null
): void {
  const font = resolveCardFont(card.fontStyle);
  const scale = Math.max(0.75, Math.min(1.25, card.textScale ?? 1));

  // 1. Rich cardstock background + optional foil shimmer gradient
  if (card.foilShimmer) {
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, card.paperColor);
    bgGrad.addColorStop(0.55, card.secondaryPaperColor || card.paperColor);
    bgGrad.addColorStop(1, card.paperColor);
    ctx.fillStyle = bgGrad;
  } else {
    ctx.fillStyle = card.paperColor;
  }
  ctx.fillRect(0, 0, w, h);

  // Subtle cotton paper speckles
  ctx.fillStyle = 'rgba(130, 108, 86, 0.045)';
  for (let i = 0; i < 1400; i++) {
    ctx.fillRect((i * 227) % w, (i * 389) % h, 2.5, 2.5);
  }

  // 2. Architectural outer & inner frame
  ctx.save();
  ctx.strokeStyle = card.accentColor;
  ctx.lineWidth = 5;
  ctx.lineJoin = 'round';
  traceFramePath(ctx, card.frameStyle, w, h, 46);
  ctx.stroke();

  ctx.strokeStyle = card.secondaryAccentColor || card.accentColor;
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = 2.4;
  traceFramePath(ctx, card.frameStyle, w, h, 66);
  ctx.stroke();
  ctx.globalAlpha = 1;

  if (card.frameStyle === 'ornate_corner' || card.frameStyle === 'art_deco') {
    const corners = [
      [82, 82],
      [w - 82, 82],
      [82, h - 82],
      [w - 82, h - 82],
    ];
    ctx.strokeStyle = card.accentColor;
    ctx.lineWidth = 3;
    corners.forEach(([cx, cy]) => {
      ctx.strokeRect(cx - 14, cy - 14, 28, 28);
    });
  }
  ctx.restore();

  // 3. Top handcrafted motif & corner rosettes
  const motifY = card.aspectRatio === '1:1' ? h * 0.16 : h * 0.185;
  drawTopMotif(ctx, w, motifY, card);

  if (card.cornerRosettes) {
    drawRosette(ctx, 118, h - 118, 28, card.accentColor, card.secondaryAccentColor, card.inkColor, 6);
    drawRosette(ctx, w - 118, h - 118, 28, card.accentColor, card.secondaryAccentColor, card.inkColor, 6);
  }

  // 4. Optional Die-Cut Photo Inserts (Slot 1 + Slot 2)
  const hasPhoto1 = Boolean(card.photoEnabled && photoImg && photoImg.width > 0);
  const hasPhoto2 = Boolean(card.photo2Enabled && photoImg2 && photoImg2.width > 0);
  let textStartY = card.aspectRatio === '9:16' ? h * 0.34 : h * 0.32;

  if (hasPhoto1 && photoImg) {
    drawSinglePhotoSlot(ctx, 1, w, h, card, photoImg);
    const r1 = computePhotoBoxRect(1, w, h, card);
    if (r1.cy < h * 0.44) {
      textStartY = Math.max(textStartY, r1.py + r1.boxH + 46);
    }
  }
  if (hasPhoto2 && photoImg2) {
    drawSinglePhotoSlot(ctx, 2, w, h, card, photoImg2);
    const r2 = computePhotoBoxRect(2, w, h, card);
    if (r2.cy < h * 0.44) {
      textStartY = Math.max(textStartY, r2.py + r2.boxH + 46);
    }
  }

  // 5. Typography
  const cx = w / 2;
  const maxTextW = w * 0.74;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let cursorY = textStartY;
  if (card.topBlessing?.trim()) {
    ctx.fillStyle = card.accentColor;
    ctx.font = `600 ${Math.round(23 * scale)}px ${font.bodyFont}`;
    ctx.fillText(card.topBlessing.trim().toUpperCase(), cx, cursorY, maxTextW);
    cursorY += Math.round(48 * scale);
  }

  const headline = (card.coupleOrHeadline || 'You Are Invited').trim();
  ctx.fillStyle = card.inkColor;
  if (headline.includes('&') && headline.length <= 32) {
    const [leftName, rightName] = headline.split('&').map((s) => s.trim());
    ctx.font = `700 ${Math.round(64 * scale)}px ${font.titleFont}`;
    ctx.fillText(leftName, cx, cursorY + 8, maxTextW);
    cursorY += Math.round(60 * scale);
    ctx.fillStyle = card.accentColor;
    ctx.font = `italic ${Math.round(42 * scale)}px ${font.titleFont}`;
    ctx.fillText('&', cx, cursorY);
    cursorY += Math.round(58 * scale);
    ctx.fillStyle = card.inkColor;
    ctx.font = `700 ${Math.round(64 * scale)}px ${font.titleFont}`;
    ctx.fillText(rightName, cx, cursorY, maxTextW);
    cursorY += Math.round(70 * scale);
  } else {
    ctx.font = `700 ${Math.round(56 * scale)}px ${font.titleFont}`;
    cursorY = wrapCenteredText(ctx, headline, cx, cursorY + 6, maxTextW, Math.round(66 * scale), 2);
    cursorY += Math.round(22 * scale);
  }

  if (card.hostsLine?.trim()) {
    ctx.fillStyle = card.inkColor;
    ctx.globalAlpha = 0.85;
    ctx.font = `italic ${Math.round(27 * scale)}px ${font.bodyFont}`;
    cursorY = wrapCenteredText(ctx, card.hostsLine.trim(), cx, cursorY, maxTextW, Math.round(38 * scale), 2);
    ctx.globalAlpha = 1;
    cursorY += Math.round(16 * scale);
  }

  // Hairline ornamental divider
  ctx.strokeStyle = card.accentColor;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.34, cursorY);
  ctx.lineTo(w * 0.66, cursorY);
  ctx.stroke();
  ctx.globalAlpha = 1;
  cursorY += Math.round(44 * scale);

  if (card.dateText?.trim()) {
    ctx.fillStyle = card.inkColor;
    ctx.font = `700 ${Math.round(32 * scale)}px ${font.bodyFont}`;
    ctx.fillText(card.dateText.trim(), cx, cursorY, maxTextW);
    cursorY += Math.round(42 * scale);
  }

  if (card.timeText?.trim()) {
    ctx.fillStyle = card.accentColor;
    ctx.font = `600 ${Math.round(26 * scale)}px ${font.bodyFont}`;
    ctx.fillText(card.timeText.trim(), cx, cursorY, maxTextW);
    cursorY += Math.round(44 * scale);
  }

  if (card.venueText?.trim()) {
    ctx.fillStyle = card.inkColor;
    ctx.font = `600 ${Math.round(28 * scale)}px ${font.bodyFont}`;
    cursorY = wrapCenteredText(ctx, card.venueText.trim(), cx, cursorY, maxTextW, Math.round(36 * scale), 2);
    cursorY += Math.round(16 * scale);
  }

  if (card.footerNote?.trim()) {
    ctx.fillStyle = card.inkColor;
    ctx.globalAlpha = 0.78;
    ctx.font = `italic ${Math.round(23 * scale)}px ${font.bodyFont}`;
    wrapCenteredText(ctx, card.footerNote.trim(), cx, Math.min(h - (card.waxSealEnabled ? 205 : 130), cursorY + 8), maxTextW, Math.round(32 * scale), 2);
    ctx.globalAlpha = 1;
  }

  // 6. Optional Embossed Bottom Wax Seal Medallion
  if (card.waxSealEnabled) {
    const sx = w / 2;
    const sy = h - 120;
    ctx.save();
    ctx.fillStyle = card.waxColor || '#A41E22';
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const rr = 46 + Math.sin(i * 2.3) * 5;
      ctx.beginPath();
      ctx.arc(sx + Math.cos(a) * rr * 0.45, sy + Math.sin(a) * rr * 0.45, 22, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(sx, sy, 48, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 240, 200, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sx, sy, 36, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#FCE8B6';
    ctx.font = '700 24px Georgia, serif';
    ctx.fillText((card.monogram || 'A&M').trim().slice(0, 5), sx, sy + 2);
    ctx.restore();
  }
}

const WEBVIEW_CARD_DRAW_SCRIPT = `
function resolveCardFont(id) {
  var fonts = {
    royal_serif: { titleFont: 'Georgia, "Times New Roman", serif', bodyFont: 'Georgia, serif' },
    handwritten: { titleFont: '"Brush Script MT", "Segoe Print", Georgia, cursive', bodyFont: 'Georgia, serif' },
    botanical: { titleFont: '"Palatino Linotype", Georgia, serif', bodyFont: 'system-ui, sans-serif' },
    playful_hand: { titleFont: '"Trebuchet MS", "Comic Sans MS", sans-serif', bodyFont: 'system-ui, sans-serif' },
    modern_sans: { titleFont: '"Helvetica Neue", Arial, sans-serif', bodyFont: 'system-ui, sans-serif' },
    festive_script: { titleFont: 'Georgia, "Times New Roman", serif', bodyFont: 'Georgia, serif' }
  };
  return fonts[id] || fonts.royal_serif;
}

function traceFramePath(ctx, style, w, h, inset) {
  var left = inset;
  var right = w - inset;
  var top = inset;
  var bottom = h - inset;
  var midX = w / 2;
  ctx.beginPath();
  if (style === 'house_gable') {
    var shY = top + (bottom - top) * 0.16;
    ctx.moveTo(left, bottom); ctx.lineTo(left, shY); ctx.lineTo(midX, top); ctx.lineTo(right, shY); ctx.lineTo(right, bottom); ctx.closePath();
  } else if (style === 'mughal_arch') {
    var shM = top + (bottom - top) * 0.18;
    ctx.moveTo(left, bottom); ctx.lineTo(left, shM);
    ctx.quadraticCurveTo(left, top + 60, midX - 80, top + 40);
    ctx.quadraticCurveTo(midX, top - 6, midX, top);
    ctx.quadraticCurveTo(midX, top - 6, midX + 80, top + 40);
    ctx.quadraticCurveTo(right, top + 60, right, shM);
    ctx.lineTo(right, bottom); ctx.closePath();
  } else if (style === 'villa_arch') {
    var shV = top + (bottom - top) * 0.22;
    ctx.moveTo(left, bottom); ctx.lineTo(left, shV);
    ctx.quadraticCurveTo(left, top, midX, top);
    ctx.quadraticCurveTo(right, top, right, shV);
    ctx.lineTo(right, bottom); ctx.closePath();
  } else if (style === 'scalloped') {
    var span = right - left;
    var steps = Math.max(4, Math.floor(span / 92));
    var stepW = span / steps;
    ctx.moveTo(left, bottom); ctx.lineTo(left, top + 34);
    for (var i = 0; i < steps; i++) {
      var sx = left + i * stepW;
      ctx.quadraticCurveTo(sx + stepW / 2, top - 14, sx + stepW, top + 34);
    }
    ctx.lineTo(right, bottom); ctx.closePath();
  } else {
    ctx.rect(left, top, right - left, bottom - top);
  }
}

function drawRosette(ctx, cx, cy, r, petalHex, centerHex, strokeHex, petals) {
  petals = petals || 6;
  ctx.save();
  ctx.translate(cx, cy);
  for (var i = 0; i < petals; i++) {
    ctx.save();
    ctx.rotate((i / petals) * Math.PI * 2);
    ctx.fillStyle = petalHex; ctx.strokeStyle = strokeHex; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, -r * 0.54, r * 0.35, r * 0.48, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = centerHex; ctx.strokeStyle = strokeHex; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function drawTopMotif(ctx, w, motifY, card) {
  var m = card.motif;
  if (!m || m === 'none') return;
  ctx.save();
  var startX = w * 0.16;
  var endX = w * 0.84;
  var span = endX - startX;
  var i, u, x, y;

  if (m === 'marigold_toran') {
    ctx.strokeStyle = card.secondaryAccentColor; ctx.lineWidth = 4; ctx.beginPath();
    for (i = 0; i <= 24; i++) {
      u = i / 24; x = startX + u * span; y = motifY + Math.sin(u * Math.PI) * 58;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    for (i = 0; i <= 19; i++) {
      u = i / 19; x = startX + u * span; y = motifY + Math.sin(u * Math.PI) * 58;
      ctx.fillStyle = i % 2 === 0 ? card.accentColor : card.secondaryAccentColor;
      ctx.strokeStyle = card.inkColor; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y + (i % 2) * 3, i % 2 === 0 ? 18 : 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  } else if (m === 'temple_bells') {
    ctx.strokeStyle = card.accentColor; ctx.lineWidth = 3.5;
    [0.24, 0.5, 0.76].forEach(function(pos, idx) {
      var bx = w * pos; var cordLen = idx === 1 ? 82 : 58;
      ctx.beginPath(); ctx.moveTo(bx, motifY - 35); ctx.lineTo(bx, motifY + cordLen); ctx.stroke();
      ctx.fillStyle = idx === 1 ? card.accentColor : card.secondaryAccentColor;
      ctx.strokeStyle = card.inkColor; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx - 24, motifY + cordLen + 36);
      ctx.quadraticCurveTo(bx, motifY + cordLen - 16, bx + 24, motifY + cordLen + 36);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(bx, motifY + cordLen + 44, 7, 0, Math.PI * 2); ctx.fill();
    });
  } else if (m === 'alpona_lotus') {
    var cx = w / 2; var cy = motifY + 12;
    ctx.strokeStyle = card.accentColor; ctx.lineWidth = 2.6;
    for (i = -3; i <= 3; i++) {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(i * 0.34);
      ctx.fillStyle = i % 2 === 0 ? card.accentColor : card.secondaryAccentColor;
      ctx.beginPath(); ctx.moveTo(0, 26); ctx.quadraticCurveTo(-24, -14, 0, -64 + Math.abs(i) * 10);
      ctx.quadraticCurveTo(24, -14, 0, 26); ctx.fill(); ctx.stroke(); ctx.restore();
    }
  } else if (m === 'crescent_stars') {
    var mcX = w / 2; var mcY = motifY + 8;
    ctx.fillStyle = card.accentColor; ctx.beginPath(); ctx.arc(mcX, mcY, 42, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = card.paperColor; ctx.beginPath(); ctx.arc(mcX + 15, mcY - 8, 36, 0, Math.PI * 2); ctx.fill();
    [w * 0.25, w * 0.75].forEach(function(lx) {
      ctx.strokeStyle = card.accentColor; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(lx, motifY - 34); ctx.lineTo(lx, motifY + 34); ctx.stroke();
      ctx.fillStyle = card.secondaryAccentColor;
      ctx.beginPath(); ctx.ellipse(lx, motifY + 56, 18, 26, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
  } else if (m === 'rose_swag') {
    ctx.strokeStyle = card.secondaryAccentColor; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(startX, motifY); ctx.quadraticCurveTo(w / 2, motifY + 72, endX, motifY); ctx.stroke();
    [0.12, 0.28, 0.5, 0.72, 0.88].forEach(function(uu, idx) {
      drawRosette(ctx, startX + uu * span, motifY + Math.sin(uu * Math.PI) * 52, idx === 2 ? 26 : 19,
        idx % 2 === 0 ? card.accentColor : card.secondaryAccentColor, '#FCE4A6', card.inkColor, 6);
    });
  } else if (m === 'olive_citrus') {
    for (i = 0; i <= 14; i++) {
      u = i / 14; x = startX + u * span; y = motifY + Math.sin(u * Math.PI) * 48;
      ctx.fillStyle = card.accentColor;
      ctx.beginPath(); ctx.ellipse(x - 12, y - 6, 16, 7, -0.6, 0, Math.PI * 2);
      ctx.ellipse(x + 12, y + 6, 16, 7, 0.6, 0, Math.PI * 2); ctx.fill();
      if (i === 3 || i === 7 || i === 11) {
        ctx.fillStyle = card.secondaryAccentColor; ctx.strokeStyle = card.inkColor; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(x, y + 10, 14, 17, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }
  } else if (m === 'sakura_branch') {
    ctx.strokeStyle = '#5B3940'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(startX - 18, motifY + 18); ctx.quadraticCurveTo(w * 0.48, motifY - 26, endX + 12, motifY + 42); ctx.stroke();
    [0.1, 0.26, 0.45, 0.62, 0.8, 0.93].forEach(function(uu, idx) {
      drawRosette(ctx, startX + uu * span, motifY + Math.sin(uu * Math.PI) * 20 + (idx % 2 === 0 ? -8 : 14),
        idx === 2 ? 25 : 19, idx % 2 === 0 ? card.accentColor : card.secondaryAccentColor, '#D94B6F', '#6A2639', 5);
    });
  } else if (m === 'double_happiness') {
    var dx = w / 2; var dy = motifY + 12;
    ctx.fillStyle = card.accentColor; ctx.strokeStyle = card.inkColor; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(dx, dy, 48, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = card.paperColor; ctx.font = '700 54px Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('\\u56CD', dx, dy + 3);
  } else if (m === 'mizuhiki_knot') {
    var kx = w / 2; var ky = motifY + 10;
    ctx.strokeStyle = card.accentColor; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(kx - 28, ky, 34, 18, -0.3, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = card.secondaryAccentColor;
    ctx.beginPath(); ctx.ellipse(kx + 28, ky, 34, 18, 0.3, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = card.accentColor; ctx.beginPath(); ctx.arc(kx, ky, 12, 0, Math.PI * 2); ctx.fill();
  } else if (m === 'art_deco_fan') {
    var fx = w / 2; var fy = motifY + 34;
    ctx.strokeStyle = card.accentColor; ctx.lineWidth = 2.5;
    for (i = -4; i <= 4; i++) {
      var ang = -Math.PI / 2 + i * 0.28;
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + Math.cos(ang) * 76, fy + Math.sin(ang) * 76); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(fx, fy, 38, Math.PI, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

function wrapCenteredText(ctx, text, cx, startY, maxWidth, lineHeight, maxLines) {
  maxLines = maxLines || 3;
  var words = String(text || '').trim().split(/\\s+/).filter(Boolean);
  if (words.length === 0) return startY;
  var lines = []; var line = '';
  for (var i = 0; i < words.length; i++) {
    var word = words[i];
    var next = line ? line + ' ' + word : word;
    if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = word; }
    else { line = next; }
  }
  if (line) lines.push(line);
  var sliced = lines.slice(0, maxLines);
  for (var j = 0; j < sliced.length; j++) {
    ctx.fillText(sliced[j], cx, startY + j * lineHeight, maxWidth);
  }
  return startY + sliced.length * lineHeight;
}

function computePhotoBoxRect(slot, w, h, card) {
  var bothActive = Boolean(card.photoEnabled && card.photoDataUrl && card.photo2Enabled && card.photo2DataUrl);
  var shape = slot === 2 ? (card.photo2Shape || card.photoShape || 'arch') : (card.photoShape || 'arch');
  var rawSize = slot === 2 ? (card.photo2Size != null ? card.photo2Size : (bothActive ? 0.27 : 0.32)) : (card.photoSize != null ? card.photoSize : (bothActive ? 0.27 : 0.34));
  var size = Math.max(0.14, Math.min(0.55, rawSize));
  var boxW = Math.round(w * size);
  var boxH = Math.round(boxW * (shape === 'circle' ? 1 : 1.15));
  var defaultPosX = bothActive ? (slot === 1 ? -0.19 : 0.19) : 0;
  var defaultPosY = 0.295;
  var posX = slot === 2 ? (typeof card.photo2PosX === 'number' ? card.photo2PosX : defaultPosX) : (typeof card.photoPosX === 'number' ? card.photoPosX : defaultPosX);
  var posY = slot === 2 ? (typeof card.photo2PosY === 'number' ? card.photo2PosY : defaultPosY) : (typeof card.photoPosY === 'number' ? card.photoPosY : defaultPosY);
  var cx = Math.round(w * (0.5 + Math.max(-0.42, Math.min(0.42, posX))));
  var cy = Math.round(h * Math.max(0.12, Math.min(0.86, posY)));
  return { px: Math.round(cx - boxW / 2), py: Math.round(cy - boxH / 2), boxW: boxW, boxH: boxH, cx: cx, cy: cy };
}

function drawSinglePhotoSlot(ctx, slot, w, h, card, photoImg) {
  var shape = slot === 2 ? (card.photo2Shape || card.photoShape || 'arch') : (card.photoShape || 'arch');
  var r = computePhotoBoxRect(slot, w, h, card);
  var px = r.px, py = r.py, boxW = r.boxW, boxH = r.boxH;
  ctx.save();
  ctx.beginPath();
  if (shape === 'circle') ctx.arc(px + boxW / 2, py + boxH / 2, boxW / 2, 0, Math.PI * 2);
  else if (shape === 'oval') ctx.ellipse(px + boxW / 2, py + boxH / 2, boxW / 2, boxH / 2, 0, 0, Math.PI * 2);
  else if (shape === 'arch') {
    ctx.moveTo(px, py + boxH); ctx.lineTo(px, py + boxW * 0.5);
    ctx.quadraticCurveTo(px, py, px + boxW / 2, py);
    ctx.quadraticCurveTo(px + boxW, py, px + boxW, py + boxW * 0.5);
    ctx.lineTo(px + boxW, py + boxH); ctx.closePath();
  } else {
    ctx.rect(px, py, boxW, boxH);
  }
  ctx.save(); ctx.clip();
  var iw = photoImg.naturalWidth || photoImg.width;
  var ih = photoImg.naturalHeight || photoImg.height;
  var rawZoom = slot === 2 ? (card.photo2Zoom || 1) : (card.photoZoom || 1);
  var zoom = Math.max(1, Math.min(2.6, rawZoom));
  var panX = slot === 2 ? (card.photo2PanX || 0) : (card.photoPanX || 0);
  var panY = slot === 2 ? (card.photo2PanY || 0) : (card.photoPanY || 0);
  var coverScale = Math.max(boxW / iw, boxH / ih) * zoom;
  var dw = iw * coverScale; var dh = ih * coverScale;
  ctx.drawImage(photoImg, px + (boxW - dw) / 2 + panX * boxW * 0.35, py + (boxH - dh) / 2 + panY * boxH * 0.35, dw, dh);
  ctx.restore();
  ctx.strokeStyle = card.accentColor; ctx.lineWidth = Math.max(4, Math.round(w * 0.0055)); ctx.stroke();
  ctx.restore();
}

function drawInvitationCard(ctx, w, h, card, photoImg, photoImg2) {
  var font = resolveCardFont(card.fontStyle);
  var scale = Math.max(0.75, Math.min(1.25, card.textScale || 1));
  if (card.foilShimmer) {
    var bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, card.paperColor);
    bgGrad.addColorStop(0.55, card.secondaryPaperColor || card.paperColor);
    bgGrad.addColorStop(1, card.paperColor);
    ctx.fillStyle = bgGrad;
  } else {
    ctx.fillStyle = card.paperColor;
  }
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(130, 108, 86, 0.045)';
  for (var i = 0; i < 900; i++) ctx.fillRect((i * 227) % w, (i * 389) % h, 2.5, 2.5);

  ctx.save();
  ctx.strokeStyle = card.accentColor; ctx.lineWidth = 5; ctx.lineJoin = 'round';
  traceFramePath(ctx, card.frameStyle, w, h, 46); ctx.stroke();
  ctx.strokeStyle = card.secondaryAccentColor || card.accentColor; ctx.globalAlpha = 0.72; ctx.lineWidth = 2.4;
  traceFramePath(ctx, card.frameStyle, w, h, 66); ctx.stroke();
  ctx.globalAlpha = 1;
  if (card.frameStyle === 'ornate_corner' || card.frameStyle === 'art_deco') {
    ctx.strokeStyle = card.accentColor; ctx.lineWidth = 3;
    [[82, 82], [w - 82, 82], [82, h - 82], [w - 82, h - 82]].forEach(function(pt) {
      ctx.strokeRect(pt[0] - 14, pt[1] - 14, 28, 28);
    });
  }
  ctx.restore();

  var motifY = card.aspectRatio === '1:1' ? h * 0.16 : h * 0.185;
  drawTopMotif(ctx, w, motifY, card);
  if (card.cornerRosettes) {
    drawRosette(ctx, 118, h - 118, 28, card.accentColor, card.secondaryAccentColor, card.inkColor, 6);
    drawRosette(ctx, w - 118, h - 118, 28, card.accentColor, card.secondaryAccentColor, card.inkColor, 6);
  }

  var textStartY = card.aspectRatio === '9:16' ? h * 0.34 : h * 0.32;
  if (card.photoEnabled && photoImg && photoImg.width > 0) {
    drawSinglePhotoSlot(ctx, 1, w, h, card, photoImg);
    var r1 = computePhotoBoxRect(1, w, h, card);
    if (r1.cy < h * 0.44) textStartY = Math.max(textStartY, r1.py + r1.boxH + 46);
  }
  if (card.photo2Enabled && photoImg2 && photoImg2.width > 0) {
    drawSinglePhotoSlot(ctx, 2, w, h, card, photoImg2);
    var r2 = computePhotoBoxRect(2, w, h, card);
    if (r2.cy < h * 0.44) textStartY = Math.max(textStartY, r2.py + r2.boxH + 46);
  }

  var cx = w / 2; var maxTextW = w * 0.74;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  var cursorY = textStartY;
  if (card.topBlessing && card.topBlessing.trim()) {
    ctx.fillStyle = card.accentColor; ctx.font = '600 ' + Math.round(23 * scale) + 'px ' + font.bodyFont;
    ctx.fillText(card.topBlessing.trim().toUpperCase(), cx, cursorY, maxTextW);
    cursorY += Math.round(48 * scale);
  }
  var headline = (card.coupleOrHeadline || 'You Are Invited').trim();
  ctx.fillStyle = card.inkColor;
  if (headline.indexOf('&') !== -1 && headline.length <= 32) {
    var parts = headline.split('&');
    ctx.font = '700 ' + Math.round(64 * scale) + 'px ' + font.titleFont;
    ctx.fillText((parts[0] || '').trim(), cx, cursorY + 8, maxTextW);
    cursorY += Math.round(60 * scale);
    ctx.fillStyle = card.accentColor; ctx.font = 'italic ' + Math.round(42 * scale) + 'px ' + font.titleFont;
    ctx.fillText('&', cx, cursorY);
    cursorY += Math.round(58 * scale);
    ctx.fillStyle = card.inkColor; ctx.font = '700 ' + Math.round(64 * scale) + 'px ' + font.titleFont;
    ctx.fillText((parts[1] || '').trim(), cx, cursorY, maxTextW);
    cursorY += Math.round(70 * scale);
  } else {
    ctx.font = '700 ' + Math.round(56 * scale) + 'px ' + font.titleFont;
    cursorY = wrapCenteredText(ctx, headline, cx, cursorY + 6, maxTextW, Math.round(66 * scale), 2);
    cursorY += Math.round(22 * scale);
  }
  if (card.hostsLine && card.hostsLine.trim()) {
    ctx.fillStyle = card.inkColor; ctx.globalAlpha = 0.85;
    ctx.font = 'italic ' + Math.round(27 * scale) + 'px ' + font.bodyFont;
    cursorY = wrapCenteredText(ctx, card.hostsLine.trim(), cx, cursorY, maxTextW, Math.round(38 * scale), 2);
    ctx.globalAlpha = 1; cursorY += Math.round(16 * scale);
  }
  ctx.strokeStyle = card.accentColor; ctx.globalAlpha = 0.5; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(w * 0.34, cursorY); ctx.lineTo(w * 0.66, cursorY); ctx.stroke();
  ctx.globalAlpha = 1; cursorY += Math.round(44 * scale);

  if (card.dateText && card.dateText.trim()) {
    ctx.fillStyle = card.inkColor; ctx.font = '700 ' + Math.round(32 * scale) + 'px ' + font.bodyFont;
    ctx.fillText(card.dateText.trim(), cx, cursorY, maxTextW); cursorY += Math.round(42 * scale);
  }
  if (card.timeText && card.timeText.trim()) {
    ctx.fillStyle = card.accentColor; ctx.font = '600 ' + Math.round(26 * scale) + 'px ' + font.bodyFont;
    ctx.fillText(card.timeText.trim(), cx, cursorY, maxTextW); cursorY += Math.round(44 * scale);
  }
  if (card.venueText && card.venueText.trim()) {
    ctx.fillStyle = card.inkColor; ctx.font = '600 ' + Math.round(28 * scale) + 'px ' + font.bodyFont;
    cursorY = wrapCenteredText(ctx, card.venueText.trim(), cx, cursorY, maxTextW, Math.round(36 * scale), 2);
    cursorY += Math.round(16 * scale);
  }
  if (card.footerNote && card.footerNote.trim()) {
    ctx.fillStyle = card.inkColor; ctx.globalAlpha = 0.78;
    ctx.font = 'italic ' + Math.round(23 * scale) + 'px ' + font.bodyFont;
    wrapCenteredText(ctx, card.footerNote.trim(), cx, Math.min(h - (card.waxSealEnabled ? 205 : 130), cursorY + 8), maxTextW, Math.round(32 * scale), 2);
    ctx.globalAlpha = 1;
  }
  if (card.waxSealEnabled) {
    var sx = w / 2; var sy = h - 120;
    ctx.save(); ctx.fillStyle = card.waxColor || '#A41E22';
    for (var s = 0; s < 10; s++) {
      var a = (s / 10) * Math.PI * 2; var rr = 46 + Math.sin(s * 2.3) * 5;
      ctx.beginPath(); ctx.arc(sx + Math.cos(a) * rr * 0.45, sy + Math.sin(a) * rr * 0.45, 22, 0, Math.PI * 2); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(sx, sy, 48, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 240, 200, 0.85)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(sx, sy, 36, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#FCE8B6'; ctx.font = '700 24px Georgia, serif';
    ctx.fillText(String(card.monogram || 'A&M').trim().slice(0, 5), sx, sy + 2);
    ctx.restore();
  }
}
`;

/**
 * Self-contained HTML/JS renderer for the React Native WebView on mobile so card previews &
 * 1080px HD PNG/JPG exports render cleanly without relying on Function.prototype.toString() (Hermes safe).
 */
export function getMobileCardRendererHtml(initialCard?: InvitationCardConfig): string {
  const formatsJson = JSON.stringify(CARD_FORMATS).replace(/<\//g, '<\\/');
  const initJson = initialCard ? JSON.stringify(initialCard).replace(/<\//g, '<\\/') : 'null';

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%; height: 100%; overflow: hidden;
      background: #1A171D; display: flex; align-items: center; justify-content: center;
      padding: 8px;
    }
    canvas {
      max-width: 100%; max-height: 100%;
      width: auto; height: auto; display: block;
      border-radius: 10px;
      box-shadow: 0 12px 30px rgba(0,0,0,0.42);
      touch-action: none;
    }
  </style>
</head>
<body>
  <canvas id="c"></canvas>
  <input id="photoFile" type="file" accept="image/*" style="display:none" />
  <script>
    var CARD_FORMATS = ${formatsJson};
    var INITIAL_CARD = ${initJson};
    ${WEBVIEW_CARD_DRAW_SCRIPT}

    var canvas = document.getElementById('c');
    var ctx = canvas.getContext('2d');
    var currentCard = null;
    var cachedPhoto1 = null;
    var cachedPhoto1Url = '';
    var cachedPhoto2 = null;
    var cachedPhoto2Url = '';
    var pendingPickSlot = 1;
    var dragSlot = null;

    function renderNow() {
      if (!currentCard) return;
      var fmt = CARD_FORMATS.find(function(f){ return f.id === currentCard.aspectRatio; }) || CARD_FORMATS[0];
      canvas.width = fmt.width;
      canvas.height = fmt.height;
      drawInvitationCard(ctx, fmt.width, fmt.height, currentCard, cachedPhoto1, cachedPhoto2);
    }

    function loadSlotImage(enabled, url, slot) {
      if (slot === 1) {
        if (!enabled || !url) { cachedPhoto1 = null; cachedPhoto1Url = ''; return false; }
        if (cachedPhoto1Url === url && cachedPhoto1) return false;
        var img1 = new Image();
        img1.onload = function() { cachedPhoto1 = img1; cachedPhoto1Url = url; renderNow(); };
        img1.src = url;
        return true;
      } else {
        if (!enabled || !url) { cachedPhoto2 = null; cachedPhoto2Url = ''; return false; }
        if (cachedPhoto2Url === url && cachedPhoto2) return false;
        var img2 = new Image();
        img2.onload = function() { cachedPhoto2 = img2; cachedPhoto2Url = url; renderNow(); };
        img2.src = url;
        return true;
      }
    }

    function applyCard(card) {
      if (!card) return;
      currentCard = card;
      loadSlotImage(Boolean(card.photoEnabled), card.photoDataUrl || '', 1);
      loadSlotImage(Boolean(card.photo2Enabled), card.photo2DataUrl || '', 2);
      renderNow();
    }

    function getCanvasNormPos(clientX, clientY) {
      var rect = canvas.getBoundingClientRect();
      return {
        nx: Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width))),
        ny: Math.max(0, Math.min(1, (clientY - rect.top) / Math.max(1, rect.height)))
      };
    }

    canvas.addEventListener('pointerdown', function(ev) {
      if (!currentCard) return;
      var p = getCanvasNormPos(ev.clientX, ev.clientY);
      var tx = p.nx * canvas.width;
      var ty = p.ny * canvas.height;
      dragSlot = null;
      if (currentCard.photo2Enabled && currentCard.photo2DataUrl) {
        var r2 = computePhotoBoxRect(2, canvas.width, canvas.height, currentCard);
        if (tx >= r2.px && tx <= r2.px + r2.boxW && ty >= r2.py && ty <= r2.py + r2.boxH) dragSlot = 2;
      }
      if (!dragSlot && currentCard.photoEnabled && currentCard.photoDataUrl) {
        var r1 = computePhotoBoxRect(1, canvas.width, canvas.height, currentCard);
        if (tx >= r1.px && tx <= r1.px + r1.boxW && ty >= r1.py && ty <= r1.py + r1.boxH) dragSlot = 1;
      }
    });

    canvas.addEventListener('pointermove', function(ev) {
      if (!dragSlot || !currentCard) return;
      var p = getCanvasNormPos(ev.clientX, ev.clientY);
      var posX = Math.max(-0.4, Math.min(0.4, p.nx - 0.5));
      var posY = Math.max(0.14, Math.min(0.84, p.ny));
      if (dragSlot === 2) {
        currentCard.photo2PosX = posX;
        currentCard.photo2PosY = posY;
      } else {
        currentCard.photoPosX = posX;
        currentCard.photoPosY = posY;
      }
      renderNow();
    });

    function endDrag() {
      if (!dragSlot || !currentCard) { dragSlot = null; return; }
      var slot = dragSlot;
      var posX = slot === 2 ? currentCard.photo2PosX : currentCard.photoPosX;
      var posY = slot === 2 ? currentCard.photo2PosY : currentCard.photoPosY;
      dragSlot = null;
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'PHOTO_MOVED', slot: slot, posX: posX, posY: posY
        }));
      }
    }
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    window.__PATRA_CARD_MSG__ = function(raw) {
      try {
        var msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (msg.type === 'SET_CARD' && msg.payload) {
          applyCard(msg.payload);
        } else if (msg.type === 'PICK_PHOTO') {
          pendingPickSlot = (msg.payload && msg.payload.slot === 2) ? 2 : 1;
          document.getElementById('photoFile').click();
        } else if (msg.type === 'EXPORT_CARD') {
          renderNow();
          var format = (msg.payload && msg.payload.format === 'jpeg') ? 'image/jpeg' : 'image/png';
          var dataUrl = canvas.toDataURL(format, 0.94);
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'CARD_EXPORTED',
              dataUrl: dataUrl,
              mimeType: format
            }));
          }
        }
      } catch (e) {}
    };

    document.getElementById('photoFile').addEventListener('change', function(ev) {
      var file = ev.target.files && ev.target.files[0];
      ev.target.value = '';
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function() {
        var img = new Image();
        img.onload = function() {
          var maxE = 800;
          var s = Math.min(1, maxE / Math.max(img.width, img.height));
          var cw = Math.max(1, Math.round(img.width * s));
          var ch = Math.max(1, Math.round(img.height * s));
          var oc = document.createElement('canvas');
          oc.width = cw; oc.height = ch;
          oc.getContext('2d').drawImage(img, 0, 0, cw, ch);
          var url = oc.toDataURL('image/jpeg', 0.88);
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PHOTO_PICKED', slot: pendingPickSlot, dataUrl: url
            }));
          }
        };
        img.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    });

    if (INITIAL_CARD) {
      applyCard(INITIAL_CARD);
    }

    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
    }
  </script>
</body>
</html>`;
}
