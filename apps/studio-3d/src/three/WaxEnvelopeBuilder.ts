import * as THREE from 'three';
import { WaxCoverStyle, WaxSealConfig } from '@patra/shared';

function drawCrestSymbol(
  ctx: CanvasRenderingContext2D,
  crest: WaxSealConfig['crest'],
  monogram: string,
  cx: number,
  cy: number,
  radius: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = 'rgba(255, 240, 200, 0.85)';
  ctx.fillStyle = 'rgba(255, 240, 200, 0.88)';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Inner embossed double ring
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.78, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.68, 0, Math.PI * 2);
  ctx.stroke();

  if (crest === 'monogram') {
    const label = (monogram || 'A&M').trim().slice(0, 5);
    ctx.font = `700 ${label.length > 3 ? 42 : 52}px Georgia, "Times New Roman", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 2);
  } else if (crest === 'lotus') {
    ctx.lineWidth = 4;
    for (let i = -2; i <= 2; i++) {
      ctx.save();
      ctx.rotate(i * 0.38);
      ctx.beginPath();
      ctx.moveTo(0, 26);
      ctx.quadraticCurveTo(-18, -8, 0, -44 + Math.abs(i) * 8);
      ctx.quadraticCurveTo(18, -8, 0, 26);
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.moveTo(-30, 34);
    ctx.lineTo(30, 34);
    ctx.stroke();
  } else if (crest === 'rings') {
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(-18, 2, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(18, 2, 24, 0, Math.PI * 2);
    ctx.stroke();
    // Diamond glint above rings
    ctx.fillRect(-3, -38, 6, 6);
  } else if (crest === 'crown') {
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(-36, 20);
    ctx.lineTo(-42, -16);
    ctx.lineTo(-16, 4);
    ctx.lineTo(0, -32);
    ctx.lineTo(16, 4);
    ctx.lineTo(42, -16);
    ctx.lineTo(36, 20);
    ctx.closePath();
    ctx.stroke();
    ctx.fillRect(-38, 26, 76, 8);
  } else if (crest === 'olive') {
    ctx.lineWidth = 3.5;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(0, 6, 42, side === -1 ? Math.PI * 0.65 : -Math.PI * 0.35, side === -1 ? Math.PI * 1.35 : Math.PI * 0.35);
      ctx.stroke();
      for (let k = -2; k <= 2; k++) {
        ctx.save();
        ctx.rotate(k * 0.32 * side);
        ctx.beginPath();
        ctx.ellipse(side * 42, -2, 6, 11, side * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  } else {
    // Celestial star
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const r = i % 2 === 0 ? 48 : 16;
      const a = (i * Math.PI) / 8;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function createWaxStampTexture(cfg: WaxSealConfig): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const base = new THREE.Color(cfg.waxColor || '#A41E22');
  const dark = base.clone().multiplyScalar(0.62).getStyle();
  const bright = base.clone().lerp(new THREE.Color('#ffffff'), 0.22).getStyle();

  const grad = ctx.createRadialGradient(96, 88, 18, 128, 128, 126);
  grad.addColorStop(0, bright);
  grad.addColorStop(0.65, base.getStyle());
  grad.addColorStop(1, dark);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  drawCrestSymbol(ctx, cfg.crest, cfg.monogram, 128, 128, 108);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createLinerTexture(cfg: WaxSealConfig): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = cfg.linerColor || '#DFC79A';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle paper fiber grain
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 600; i++) {
    ctx.fillRect(Math.random() * 512, Math.random() * 384, 2, 1);
  }

  if (cfg.linerPattern === 'floral_foil') {
    ctx.strokeStyle = 'rgba(255, 245, 210, 0.55)';
    ctx.lineWidth = 2;
    for (let x = 40; x < 512; x += 84) {
      for (let y = 40; y < 384; y += 84) {
        ctx.save();
        ctx.translate(x + ((y / 84) % 2) * 38, y);
        for (let p = 0; p < 6; p++) {
          ctx.rotate(Math.PI / 3);
          ctx.beginPath();
          ctx.ellipse(0, 12, 5, 11, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  } else if (cfg.linerPattern === 'gold_stripes') {
    ctx.strokeStyle = 'rgba(255, 244, 208, 0.45)';
    ctx.lineWidth = 3;
    for (let x = -256; x < 768; x += 26) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 384, 384);
      ctx.stroke();
    }
  } else if (cfg.linerPattern === 'starry') {
    ctx.fillStyle = 'rgba(255, 248, 216, 0.72)';
    for (let i = 0; i < 140; i++) {
      const sx = (Math.sin(i * 73.1) * 0.5 + 0.5) * 512;
      const sy = (Math.cos(i * 41.7) * 0.5 + 0.5) * 384;
      const sr = (i % 4) + 1.2;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createInnerCardTexture(cfg: WaxSealConfig): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 360;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FFFDF8';
  ctx.fillRect(0, 0, 512, 360);

  // Double gold hairline border
  ctx.strokeStyle = '#C99E48';
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, 476, 324);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(28, 28, 456, 304);

  // Monogram seal badge at top
  ctx.fillStyle = cfg.waxColor || '#A41E22';
  ctx.beginPath();
  ctx.arc(256, 86, 26, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFF7DF';
  ctx.font = '700 18px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((cfg.monogram || 'A&M').slice(0, 4), 256, 87);

  ctx.fillStyle = '#2B221B';
  ctx.font = '600 28px Georgia, serif';
  ctx.fillText((cfg.headline || 'You Are Warmly Invited').slice(0, 32), 256, 174);

  ctx.fillStyle = '#7A6856';
  ctx.font = 'italic 18px Georgia, serif';
  ctx.fillText('Unfolding 3D Celebration Inside', 256, 224);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface WaxEnvelopeRig {
  root: THREE.Group;
  setOpenProgress: (t: number) => void;
  dispose: () => void;
}

interface FloralThemeSpec {
  borderColor: string;
  inkColor: string;
  floralPrimary: string;
  floralSecondary: string;
  leafColor: string;
  roofType: 'house' | 'arch' | 'pagoda';
}

function getFloralThemeSpec(style: WaxCoverStyle): FloralThemeSpec {
  switch (style) {
    case 'rose_arch_card':
      return {
        borderColor: '#9E3148',
        inkColor: '#7E2438',
        floralPrimary: '#D95B72',
        floralSecondary: '#F3B4C2',
        leafColor: '#56744C',
        roofType: 'arch',
      };
    case 'sakura_gate_card':
      return {
        borderColor: '#9F3753',
        inkColor: '#4A2B36',
        floralPrimary: '#F29AB3',
        floralSecondary: '#FBD5E1',
        leafColor: '#6E7F55',
        roofType: 'pagoda',
      };
    case 'olive_villa_card':
      return {
        borderColor: '#425E39',
        inkColor: '#374D30',
        floralPrimary: '#769156',
        floralSecondary: '#E7BC3E',
        leafColor: '#4C6B40',
        roofType: 'arch',
      };
    case 'marigold_house':
    default:
      return {
        borderColor: '#9B2720',
        inkColor: '#8E251F',
        floralPrimary: '#E36B1E',
        floralSecondary: '#F5A623',
        leafColor: '#5E7C45',
        roofType: 'house',
      };
  }
}

function drawHandDrawnFlower(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  petalHex: string,
  centerHex: string,
  outlineHex: string,
  petals = 6
) {
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = petalHex;
    ctx.strokeStyle = outlineHex;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.52, radius * 0.36, radius * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = centerHex;
  ctx.strokeStyle = outlineHex;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawFloralSwagGarland(
  ctx: CanvasRenderingContext2D,
  style: WaxCoverStyle,
  spec: FloralThemeSpec,
  w: number,
  swagY: number
) {
  const startX = w * 0.14;
  const endX = w * 0.86;
  const span = endX - startX;

  // Delicate hand-inked swag cord
  ctx.save();
  ctx.strokeStyle = spec.leafColor;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  for (let i = 0; i <= 28; i++) {
    const u = i / 28;
    const x = startX + u * span;
    const dip = Math.sin(u * Math.PI) * 32;
    const y = swagY + dip;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  if (style === 'marigold_house') {
    // Rich clustered terracotta/saffron marigold toran with side drops & brass leaves
    const beads = 23;
    for (let i = 0; i <= beads; i++) {
      const u = i / beads;
      const x = startX + u * span;
      const y = swagY + Math.sin(u * Math.PI) * 32;
      const r = i % 2 === 0 ? 11 : 8.5;
      ctx.fillStyle = i % 2 === 0 ? spec.floralPrimary : spec.floralSecondary;
      ctx.strokeStyle = '#7E2813';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(x, y + (i % 2) * 2, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 224, 150, 0.55)';
      ctx.beginPath();
      ctx.arc(x - r * 0.22, y - r * 0.22, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Decorative mango-leaf drops on left & right pins
    [startX + 12, endX - 12].forEach((px) => {
      const py = swagY + 6;
      ctx.fillStyle = '#E8BE88';
      ctx.strokeStyle = '#7E2813';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px - 10, py + 16, px, py + 28);
      ctx.quadraticCurveTo(px + 10, py + 16, px, py);
      ctx.fill();
      ctx.stroke();
    });
  } else if (style === 'rose_arch_card') {
    // Leaves and trailing roses
    for (let i = 0; i <= 14; i++) {
      const u = i / 14;
      const x = startX + u * span;
      const y = swagY + Math.sin(u * Math.PI) * 32;
      ctx.fillStyle = spec.leafColor;
      ctx.beginPath();
      ctx.ellipse(x - 10, y + 6, 9, 4.5, -0.5, 0, Math.PI * 2);
      ctx.ellipse(x + 10, y + 6, 9, 4.5, 0.5, 0, Math.PI * 2);
      ctx.fill();
      if (i % 2 === 0) {
        drawHandDrawnFlower(
          ctx,
          x,
          y,
          i === 7 ? 16 : 12,
          i % 4 === 0 ? spec.floralPrimary : spec.floralSecondary,
          '#FCE4A6',
          spec.inkColor,
          6
        );
      }
    }
  } else if (style === 'sakura_gate_card') {
    // Artistic curving cherry branch + scattered sakura blossoms
    ctx.strokeStyle = '#53353A';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX - 8, swagY + 12);
    ctx.quadraticCurveTo(w * 0.45, swagY - 14, endX + 10, swagY + 26);
    ctx.stroke();
    const spots = [0.08, 0.22, 0.36, 0.5, 0.65, 0.78, 0.9];
    spots.forEach((u, idx) => {
      const x = startX + u * span;
      const y = swagY + Math.sin(u * Math.PI) * 18 + (idx % 2 === 0 ? -4 : 10);
      drawHandDrawnFlower(
        ctx,
        x,
        y,
        idx === 3 ? 15 : 12,
        idx % 2 === 0 ? spec.floralPrimary : spec.floralSecondary,
        '#D94B6F',
        '#7C3046',
        5
      );
    });
  } else {
    // Olive sprig & Mediterranean citrus wreath swag
    for (let i = 0; i <= 16; i++) {
      const u = i / 16;
      const x = startX + u * span;
      const y = swagY + Math.sin(u * Math.PI) * 32;
      ctx.fillStyle = spec.leafColor;
      ctx.beginPath();
      ctx.ellipse(x - 8, y - 5, 11, 4.2, -0.65, 0, Math.PI * 2);
      ctx.ellipse(x + 8, y + 7, 11, 4.2, 0.65, 0, Math.PI * 2);
      ctx.fill();
      if (i === 3 || i === 8 || i === 13) {
        ctx.fillStyle = spec.floralSecondary;
        ctx.strokeStyle = spec.inkColor;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(x, y + 6, 9, 11, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function buildRoofOutlinePath(
  ctx: CanvasRenderingContext2D,
  roofType: FloralThemeSpec['roofType'],
  inset: number,
  w: number,
  h: number
) {
  const left = inset;
  const right = w - inset;
  const bottom = h - inset;
  const shoulderY = h * 0.28 + inset * 0.45;
  const peakY = inset * 1.1;

  ctx.beginPath();
  ctx.moveTo(left, bottom);
  ctx.lineTo(left, shoulderY);
  if (roofType === 'arch') {
    ctx.quadraticCurveTo(left, peakY, w / 2, peakY);
    ctx.quadraticCurveTo(right, peakY, right, shoulderY);
  } else if (roofType === 'pagoda') {
    ctx.quadraticCurveTo(w * 0.28, shoulderY - 38, w / 2, peakY);
    ctx.quadraticCurveTo(w * 0.72, shoulderY - 38, right, shoulderY);
  } else {
    ctx.lineTo(w / 2, peakY);
    ctx.lineTo(right, shoulderY);
  }
  ctx.lineTo(right, bottom);
  ctx.closePath();
}

function createFloralCoverTexture(cfg: WaxSealConfig, style: WaxCoverStyle): THREE.CanvasTexture {
  const w = 640;
  const h = 840;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const spec = getFloralThemeSpec(style);

  // Subtle textured paper background
  ctx.fillStyle = cfg.envelopeColor || '#F6EFE2';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(130, 108, 86, 0.035)';
  for (let i = 0; i < 1600; i++) {
    ctx.fillRect((i * 197) % w, (i * 313) % h, 2, 2);
  }

  // Hand-crafted double outline matching silhouette (house gable / rose arch / pagoda)
  ctx.strokeStyle = spec.borderColor;
  ctx.lineWidth = 4.5;
  ctx.lineJoin = 'round';
  buildRoofOutlinePath(ctx, spec.roofType, 18, w, h);
  ctx.stroke();

  ctx.lineWidth = 2.2;
  buildRoofOutlinePath(ctx, spec.roofType, 32, w, h);
  ctx.stroke();

  // Top floral garland swag inside card
  drawFloralSwagGarland(ctx, style, spec, w, h * 0.34);

  // Bottom corner floral rosettes (iconic reference detail)
  drawHandDrawnFlower(ctx, 76, h - 72, 20, spec.floralPrimary, spec.floralSecondary, spec.inkColor, 6);
  drawHandDrawnFlower(ctx, w - 76, h - 72, 20, spec.floralPrimary, spec.floralSecondary, spec.inkColor, 6);

  // Typography centered like heirloom watercolor wedding gatefold
  const subtitle = (cfg.coverSubtitle || 'together with their families').trim();
  const headline = (cfg.headline || 'You Are Warmly Invited').trim();
  const dateVenue = (cfg.coverDateVenue || '11 feb - 13 feb · jaipur').trim();

  ctx.textAlign = 'center';
  ctx.fillStyle = spec.inkColor;
  ctx.font = 'italic 24px Georgia, "Times New Roman", serif';
  ctx.fillText(subtitle, w / 2, h * 0.455);

  // Split around "&" when couple names are provided for editorial vertical rhythm
  if (headline.includes('&') && headline.length <= 36) {
    const [leftName, rightName] = headline.split('&').map((s) => s.trim());
    ctx.font = 'italic bold 44px Georgia, "Times New Roman", serif';
    ctx.fillText(leftName || cfg.monogram || 'Aarav', w / 2, h * 0.53);
    ctx.font = 'italic 30px Georgia, "Times New Roman", serif';
    ctx.fillText('&', w / 2, h * 0.585);
    ctx.font = 'italic bold 44px Georgia, "Times New Roman", serif';
    ctx.fillText(rightName || 'Meera', w / 2, h * 0.642);
  } else {
    ctx.font = 'italic bold 36px Georgia, "Times New Roman", serif';
    const words = headline.split(/\s+/);
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (next.length > 18 && current) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
    lines.slice(0, 3).forEach((line, i) => {
      ctx.fillText(line, w / 2, h * (0.53 + i * 0.055));
    });
  }

  // Subtle decorative divider & date/venue line
  ctx.strokeStyle = spec.borderColor;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.34, h * 0.695);
  ctx.lineTo(w * 0.66, h * 0.695);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.fillStyle = spec.inkColor;
  ctx.font = 'italic 22px Georgia, "Times New Roman", serif';
  ctx.fillText(dateVenue, w / 2, h * 0.74);

  if (cfg.monogram?.trim()) {
    ctx.fillStyle = spec.borderColor;
    ctx.globalAlpha = 0.75;
    ctx.font = 'bold 17px Georgia, "Times New Roman", serif';
    ctx.fillText(cfg.monogram.trim().toUpperCase(), w / 2, h - 68);
    ctx.globalAlpha = 1;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildCoverShapeHalf(
  roofType: FloralThemeSpec['roofType'],
  side: 'left' | 'right' | 'full',
  halfW: number,
  halfH: number
): THREE.Shape {
  const shape = new THREE.Shape();
  const shoulderY = halfH * 0.44;
  const peakY = halfH;
  const bottomY = -halfH;

  if (side === 'full') {
    shape.moveTo(-halfW, bottomY);
    shape.lineTo(-halfW, shoulderY);
    if (roofType === 'arch') {
      shape.quadraticCurveTo(-halfW, peakY, 0, peakY);
      shape.quadraticCurveTo(halfW, peakY, halfW, shoulderY);
    } else if (roofType === 'pagoda') {
      shape.quadraticCurveTo(-halfW * 0.44, shoulderY + 0.2, 0, peakY);
      shape.quadraticCurveTo(halfW * 0.44, shoulderY + 0.2, halfW, shoulderY);
    } else {
      shape.lineTo(0, peakY);
      shape.lineTo(halfW, shoulderY);
    }
    shape.lineTo(halfW, bottomY);
    shape.closePath();
    return shape;
  }

  if (side === 'left') {
    // Hinge is x=0 (outer left), center seam is x=halfW
    shape.moveTo(0, bottomY);
    shape.lineTo(0, shoulderY);
    if (roofType === 'arch') {
      shape.quadraticCurveTo(0, peakY, halfW, peakY);
    } else if (roofType === 'pagoda') {
      shape.quadraticCurveTo(halfW * 0.56, shoulderY + 0.2, halfW, peakY);
    } else {
      shape.lineTo(halfW, peakY);
    }
    shape.lineTo(halfW, bottomY);
    shape.closePath();
    return shape;
  }

  // Right door: center seam is x=-halfW, hinge is x=0 (outer right)
  shape.moveTo(-halfW, bottomY);
  shape.lineTo(-halfW, peakY);
  if (roofType === 'arch') {
    shape.quadraticCurveTo(0, peakY, 0, shoulderY);
  } else if (roofType === 'pagoda') {
    shape.quadraticCurveTo(-halfW * 0.56, shoulderY + 0.2, 0, shoulderY);
  } else {
    shape.lineTo(0, shoulderY);
  }
  shape.lineTo(0, bottomY);
  shape.closePath();
  return shape;
}

function normalizeDoorUVs(
  geom: THREE.BufferGeometry,
  side: 'left' | 'right',
  halfW: number,
  halfH: number
) {
  const pos = geom.attributes.position;
  const uvs = new Float32Array(pos.count * 2);
  const fullW = halfW * 2;
  const fullH = halfH * 2;
  for (let i = 0; i < pos.count; i++) {
    const lx = pos.getX(i);
    const ly = pos.getY(i);
    const worldX = side === 'left' ? -halfW + lx : halfW + lx;
    uvs[i * 2] = Math.max(0, Math.min(1, (worldX + halfW) / fullW));
    uvs[i * 2 + 1] = Math.max(0, Math.min(1, (ly + halfH) / fullH));
  }
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

function buildFloralCoverRig(cfg: WaxSealConfig): WaxEnvelopeRig {
  const style: WaxCoverStyle = cfg.coverStyle && cfg.coverStyle !== 'wax_envelope' ? cfg.coverStyle : 'marigold_house';
  const spec = getFloralThemeSpec(style);
  const root = new THREE.Group();
  const textures: THREE.Texture[] = [];
  const materials: THREE.Material[] = [];

  const halfW = 1.32;
  const halfH = 1.73;

  const frontTex = createFloralCoverTexture(cfg, style);
  const linerTex = createLinerTexture(cfg);
  const cardTex = createInnerCardTexture(cfg);
  textures.push(frontTex, linerTex, cardTex);

  const paperBackMat = new THREE.MeshStandardMaterial({
    color: cfg.envelopeColor || '#F6EFE2',
    roughness: 0.86,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });
  const doorFrontMat = new THREE.MeshStandardMaterial({
    map: frontTex,
    roughness: 0.78,
    metalness: 0.04,
    side: THREE.FrontSide,
  });
  const linerMat = new THREE.MeshStandardMaterial({
    map: linerTex,
    roughness: 0.5,
    metalness: 0.22,
    side: THREE.DoubleSide,
  });
  const inkEdgeMat = new THREE.LineBasicMaterial({
    color: spec.borderColor,
    transparent: true,
    opacity: 0.72,
  });
  materials.push(paperBackMat, doorFrontMat, linerMat, inkEdgeMat);

  // Back wall matching exact house/arch silhouette
  const backShape = buildCoverShapeHalf(spec.roofType, 'full', halfW, halfH);
  const backGeom = new THREE.ShapeGeometry(backShape, 24);
  const backWall = new THREE.Mesh(backGeom, linerMat);
  backWall.position.z = -0.025;
  backWall.castShadow = true;
  root.add(backWall);

  const backRim = new THREE.LineSegments(new THREE.EdgesGeometry(backGeom, 18), inkEdgeMat);
  backRim.position.z = -0.02;
  root.add(backRim);

  // Inner embossed gold/foil invitation plaque revealed as doors open
  const innerGroup = new THREE.Group();
  innerGroup.position.z = 0.01;
  const innerCardMat = new THREE.MeshStandardMaterial({
    map: cardTex,
    roughness: 0.75,
    metalness: 0.08,
  });
  materials.push(innerCardMat);
  const innerCard = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 2.05), innerCardMat);
  innerCard.position.y = -0.25;
  innerGroup.add(innerCard);
  root.add(innerGroup);

  // Left and Right Hinged Illustrated Doors
  const leftPivot = new THREE.Group();
  leftPivot.position.set(-halfW, 0, 0.04);
  const leftShape = buildCoverShapeHalf(spec.roofType, 'left', halfW, halfH);
  const leftFrontGeom = new THREE.ShapeGeometry(leftShape, 20);
  normalizeDoorUVs(leftFrontGeom, 'left', halfW, halfH);
  const leftFrontMesh = new THREE.Mesh(leftFrontGeom, doorFrontMat);
  leftFrontMesh.castShadow = true;
  const leftWire = new THREE.LineSegments(new THREE.EdgesGeometry(leftFrontGeom, 16), inkEdgeMat);
  leftWire.position.z = 0.006;
  leftPivot.add(leftFrontMesh, leftWire);

  const leftInnerLiner = new THREE.Mesh(leftFrontGeom, linerMat);
  leftInnerLiner.position.z = -0.006;
  leftInnerLiner.rotation.set(0, 0, 0);
  leftPivot.add(leftInnerLiner);

  const rightPivot = new THREE.Group();
  rightPivot.position.set(halfW, 0, 0.04);
  const rightShape = buildCoverShapeHalf(spec.roofType, 'right', halfW, halfH);
  const rightFrontGeom = new THREE.ShapeGeometry(rightShape, 20);
  normalizeDoorUVs(rightFrontGeom, 'right', halfW, halfH);
  const rightFrontMesh = new THREE.Mesh(rightFrontGeom, doorFrontMat);
  rightFrontMesh.castShadow = true;
  const rightInnerLiner = new THREE.Mesh(rightFrontGeom, linerMat);
  rightInnerLiner.position.z = -0.006;
  const rightWire = new THREE.LineSegments(new THREE.EdgesGeometry(rightFrontGeom, 16), inkEdgeMat);
  rightWire.position.z = 0.006;
  rightPivot.add(rightFrontMesh, rightInnerLiner, rightWire);

  root.add(leftPivot, rightPivot);

  // Subtle ribbon belt + miniature sculpted wax seal clasp on the center seam
  const ribbonColor = cfg.ribbonColor || '#D6AD5B';
  const ribbonMat = new THREE.MeshStandardMaterial({
    color: ribbonColor,
    roughness: 0.42,
    metalness: 0.25,
    transparent: true,
    opacity: cfg.ribbonStyle === 'none' ? 0 : 0.9,
  });
  materials.push(ribbonMat);
  const ribbonBand = new THREE.Mesh(
    new THREE.BoxGeometry(halfW * 2 + 0.06, cfg.ribbonStyle === 'gold_cord' ? 0.032 : 0.11, 0.03),
    ribbonMat
  );
  ribbonBand.position.set(0, -1.04, 0.062);
  if (cfg.ribbonStyle === 'none') ribbonBand.visible = false;
  root.add(ribbonBand);

  const waxGroup = new THREE.Group();
  waxGroup.position.set(-halfW, -1.04, 0.04);
  const waxMat = new THREE.MeshStandardMaterial({
    color: cfg.waxColor || '#A41E22',
    roughness: 0.32,
    metalness: 0.2,
  });
  materials.push(waxMat);

  const waxBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.045, 24), waxMat);
  waxBase.rotation.x = Math.PI / 2;
  waxGroup.add(waxBase);

  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const w = 0.22 + Math.sin(i * 2.4) * 0.03;
    const bead = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.068, 0.04, 10), waxMat);
    bead.rotation.x = Math.PI / 2;
    bead.position.set(Math.cos(a) * w, Math.sin(a) * w, -0.002);
    waxGroup.add(bead);
  }

  const waxTex = createWaxStampTexture(cfg);
  textures.push(waxTex);
  const faceMat = new THREE.MeshStandardMaterial({
    map: waxTex,
    roughness: 0.26,
    metalness: 0.25,
  });
  materials.push(faceMat);
  const faceDisc = new THREE.Mesh(new THREE.CircleGeometry(0.21, 28), faceMat);
  faceDisc.position.z = 0.026;
  waxGroup.add(faceDisc);

  rightPivot.add(waxGroup);

  root.position.set(0, 1.85, 0);
  root.rotation.set(-0.1, 0, 0);

  const setOpenProgress = (rawT: number) => {
    const t = Math.max(0, Math.min(1, rawT));

    // 0 -> 0.28: wax seal pops forward + ribbon fades away
    const releaseT = Math.min(1, t / 0.28);
    ribbonMat.opacity = (cfg.ribbonStyle === 'none' ? 0 : 0.9) * (1 - releaseT);
    waxGroup.position.z = 0.04 + releaseT * 0.1;
    waxGroup.scale.setScalar(1 + Math.sin(releaseT * Math.PI) * 0.14);

    // 0.20 -> 0.85: twin illustrated doors swing wide open symmetrically
    const doorT = Math.max(0, Math.min(1, (t - 0.18) / 0.65));
    const smoothDoor =
      doorT < 0.5 ? 4 * doorT * doorT * doorT : 1 - Math.pow(-2 * doorT + 2, 3) / 2;
    leftPivot.rotation.y = -smoothDoor * 2.18;
    rightPivot.rotation.y = smoothDoor * 2.18;

    // 0.55 -> 1.0: inner card rises slightly into the spotlight
    const cardT = Math.max(0, Math.min(1, (t - 0.52) / 0.42));
    const smoothCard = 1 - Math.pow(1 - cardT, 3);
    innerGroup.position.z = 0.01 + smoothCard * 0.25;
    innerGroup.scale.setScalar(1 + smoothCard * 0.08);
    root.position.y = 1.85 + smoothCard * 0.1;
  };

  const dispose = () => {
    textures.forEach((tx) => tx.dispose());
    materials.forEach((m) => m.dispose());
  };

  return { root, setOpenProgress, dispose };
}

export function buildWaxEnvelopeRig(cfg: WaxSealConfig): WaxEnvelopeRig {
  if (cfg.coverStyle && cfg.coverStyle !== 'wax_envelope') {
    return buildFloralCoverRig(cfg);
  }
  const root = new THREE.Group();
  const textures: THREE.Texture[] = [];
  const materials: THREE.Material[] = [];

  const envW = 4.2;
  const envH = 2.85;
  const paperColor = cfg.envelopeColor || '#F6EFE2';
  const paperMat = new THREE.MeshStandardMaterial({
    color: paperColor,
    roughness: 0.85,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });
  materials.push(paperMat);

  const inkEdgeMat = new THREE.LineBasicMaterial({
    color: '#8D7C6B',
    transparent: true,
    opacity: 0.45,
  });
  materials.push(inkEdgeMat);

  const linerTex = createLinerTexture(cfg);
  textures.push(linerTex);
  const linerMat = new THREE.MeshStandardMaterial({
    map: linerTex,
    roughness: 0.42,
    metalness: 0.32,
    side: THREE.DoubleSide,
  });
  materials.push(linerMat);

  // 1. Envelope Back Wall + Interior Foil Backing
  const backMesh = new THREE.Mesh(new THREE.BoxGeometry(envW, envH, 0.04), paperMat);
  backMesh.castShadow = true;
  backMesh.receiveShadow = true;
  root.add(backMesh);

  const innerBack = new THREE.Mesh(new THREE.PlaneGeometry(envW - 0.14, envH - 0.14), linerMat);
  innerBack.position.z = 0.025;
  root.add(innerBack);

  // 2. Pull-out Invitation Insert Card
  const cardTex = createInnerCardTexture(cfg);
  textures.push(cardTex);
  const cardMat = new THREE.MeshStandardMaterial({
    map: cardTex,
    roughness: 0.6,
    metalness: 0.05,
  });
  materials.push(cardMat);
  const cardGroup = new THREE.Group();
  const cardMesh = new THREE.Mesh(new THREE.BoxGeometry(envW - 0.34, envH - 0.36, 0.025), cardMat);
  cardMesh.position.z = 0.055;
  cardGroup.add(cardMesh);
  root.add(cardGroup);

  // 3. Lower & Side Pocket Flaps enclosing the card
  const pocketShape = new THREE.Shape();
  pocketShape.moveTo(-envW / 2, -envH / 2);
  pocketShape.lineTo(envW / 2, -envH / 2);
  pocketShape.lineTo(envW / 2, 0.12);
  pocketShape.lineTo(0.28, 0.38);
  pocketShape.lineTo(-0.28, 0.38);
  pocketShape.lineTo(-envW / 2, 0.12);
  pocketShape.closePath();

  const pocketGeom = new THREE.ExtrudeGeometry(pocketShape, { depth: 0.02, bevelEnabled: false });
  const pocketMesh = new THREE.Mesh(pocketGeom, paperMat);
  pocketMesh.position.z = 0.085;
  pocketMesh.castShadow = true;
  const pocketWire = new THREE.LineSegments(new THREE.EdgesGeometry(pocketGeom, 25), inkEdgeMat);
  pocketWire.position.z = 0.085;
  root.add(pocketMesh, pocketWire);

  // 4. Optional Belly Band / Gold Cord Ribbon
  const ribbonGroup = new THREE.Group();
  const ribbonMat = new THREE.MeshStandardMaterial({
    color: cfg.ribbonColor || '#D6AD5B',
    roughness: cfg.ribbonStyle === 'gold_cord' ? 0.28 : 0.48,
    metalness: cfg.ribbonStyle === 'gold_cord' ? 0.72 : 0.15,
    transparent: true,
    opacity: 1,
  });
  materials.push(ribbonMat);

  if (cfg.ribbonStyle === 'silk_band') {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.46, envH + 0.06, 0.14), ribbonMat);
    band.position.z = 0.04;
    ribbonGroup.add(band);
  } else if (cfg.ribbonStyle === 'gold_cord') {
    const hCord = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, envW + 0.08, 10), ribbonMat);
    hCord.rotation.z = Math.PI / 2;
    hCord.position.set(0, 0.16, 0.06);
    const vCord = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, envH + 0.08, 10), ribbonMat);
    vCord.position.set(0, 0, 0.06);
    ribbonGroup.add(hCord, vCord);
  }
  root.add(ribbonGroup);

  // 5. Hinged Top Triangular Flap + Inner Liner
  const flapPivot = new THREE.Group();
  flapPivot.position.set(0, envH / 2, 0.11);

  const flapShape = new THREE.Shape();
  flapShape.moveTo(-envW / 2, 0);
  flapShape.lineTo(envW / 2, 0);
  flapShape.lineTo(0.24, -1.62);
  flapShape.quadraticCurveTo(0, -1.78, -0.24, -1.62);
  flapShape.closePath();

  const flapGeom = new THREE.ShapeGeometry(flapShape);
  const flapFront = new THREE.Mesh(flapGeom, paperMat);
  flapFront.position.z = 0.01;
  flapFront.castShadow = true;

  const flapInner = new THREE.Mesh(flapGeom, linerMat);
  flapInner.position.z = -0.005;

  const flapWire = new THREE.LineSegments(new THREE.EdgesGeometry(flapGeom, 20), inkEdgeMat);
  flapWire.position.z = 0.012;

  // 6. Sculpted 3D Molten Wax Seal Medallion attached to Flap Tip
  const waxGroup = new THREE.Group();
  waxGroup.position.set(0, -1.52, 0.055);

  const waxMat = new THREE.MeshStandardMaterial({
    color: cfg.waxColor || '#A41E22',
    roughness: 0.34,
    metalness: 0.18,
  });
  materials.push(waxMat);

  // Irregular organic wax drip perimeter made from overlapping beads
  const waxCore = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.39, 0.06, 28), waxMat);
  waxCore.rotation.x = Math.PI / 2;
  waxGroup.add(waxCore);

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const wobble = 0.33 + Math.sin(i * 2.7) * 0.045;
    const bead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.095, 0.055, 12),
      waxMat
    );
    bead.rotation.x = Math.PI / 2;
    bead.position.set(Math.cos(angle) * wobble, Math.sin(angle) * wobble, -0.004);
    waxGroup.add(bead);
  }

  // Embossed Crest Face
  const waxTex = createWaxStampTexture(cfg);
  textures.push(waxTex);
  const faceMat = new THREE.MeshStandardMaterial({
    map: waxTex,
    roughness: 0.28,
    metalness: 0.25,
  });
  materials.push(faceMat);
  const sealFace = new THREE.Mesh(new THREE.CircleGeometry(0.31, 32), faceMat);
  sealFace.position.z = 0.036;
  waxGroup.add(sealFace);

  flapPivot.add(flapFront, flapInner, flapWire, waxGroup);
  root.add(flapPivot);

  // Slight presentation tilt so paper bevels & molten seal catch the key light
  root.position.set(0, 1.35, 0);
  root.rotation.set(-0.22, 0, 0);

  const setOpenProgress = (rawT: number) => {
    const t = Math.max(0, Math.min(1, rawT));

    // 0 -> 0.26: seal glows/lifts + ribbon slides away
    const ribbonT = Math.min(1, t / 0.28);
    ribbonMat.opacity = 1 - ribbonT;
    ribbonGroup.scale.set(1 + ribbonT * 0.16, 1, 1);

    const waxPop = Math.min(1, t / 0.22);
    waxGroup.position.z = 0.055 + waxPop * 0.12;
    waxGroup.scale.setScalar(1 + Math.sin(waxPop * Math.PI) * 0.12);

    // 0.20 -> 0.68: flap swings wide open upwards
    const flapT = Math.max(0, Math.min(1, (t - 0.18) / 0.48));
    const smoothFlap = flapT < 0.5 ? 4 * flapT * flapT * flapT : 1 - Math.pow(-2 * flapT + 2, 3) / 2;
    flapPivot.rotation.x = -smoothFlap * 2.48;

    // 0.52 -> 0.92: inner card glides proudly upward out of the pocket
    const cardT = Math.max(0, Math.min(1, (t - 0.52) / 0.4));
    const smoothCard = 1 - Math.pow(1 - cardT, 3);
    cardGroup.position.y = smoothCard * 1.45;
    cardGroup.position.z = smoothCard * 0.22;

    // Gentle floating breathing when idle closed
    root.position.y = 1.35 + smoothCard * 0.18;
  };

  const dispose = () => {
    textures.forEach((tx) => tx.dispose());
    materials.forEach((m) => m.dispose());
  };

  return { root, setOpenProgress, dispose };
}
