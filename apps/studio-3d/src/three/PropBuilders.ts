import * as THREE from 'three';
import {
  CenterpieceId,
  ColorPalette,
  GarlandId,
  SidePropId,
  WallStyleId,
} from '@patra/shared';
import { getPaperGrainTexture } from './PaperTextures';

export interface CraftFactory {
  paperMat: (color: string, doubleSide?: boolean) => THREE.MeshStandardMaterial;
  inkLine: (geom: THREE.BufferGeometry, opacity?: number) => THREE.LineSegments;
  box: (w: number, h: number, d: number, color: string, outline?: boolean) => THREE.Group;
  cyl: (rTop: number, rBot: number, h: number, segs: number, color: string, outline?: boolean) => THREE.Group;
  sphere: (r: number, color: string, outline?: boolean) => THREE.Group;
}

export function createCraftFactory(palette: ColorPalette): CraftFactory {
  const grain = getPaperGrainTexture();
  const inkMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(palette.inkColor),
    transparent: true,
    opacity: 0.88,
  });

  const paperMat = (color: string, doubleSide = false) =>
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.88,
      metalness: 0.02,
      map: grain,
      side: doubleSide ? THREE.DoubleSide : THREE.FrontSide,
    });

  const inkLine = (geom: THREE.BufferGeometry, opacity = 0.88) => {
    const edges = new THREE.EdgesGeometry(geom, 24);
    const mat = opacity === 0.88 ? inkMat : new THREE.LineBasicMaterial({ color: palette.inkColor, transparent: true, opacity });
    return new THREE.LineSegments(edges, mat);
  };

  const box = (w: number, h: number, d: number, color: string, outline = true) => {
    const g = new THREE.Group();
    const geom = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geom, paperMat(color));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    if (outline) g.add(inkLine(geom));
    return g;
  };

  const cyl = (rTop: number, rBot: number, h: number, segs: number, color: string, outline = true) => {
    const g = new THREE.Group();
    const geom = new THREE.CylinderGeometry(rTop, rBot, h, segs);
    const mesh = new THREE.Mesh(geom, paperMat(color));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    if (outline) g.add(inkLine(geom));
    return g;
  };

  const sphere = (r: number, color: string, outline = false) => {
    const g = new THREE.Group();
    const geom = new THREE.SphereGeometry(r, 12, 10);
    const mesh = new THREE.Mesh(geom, paperMat(color));
    mesh.castShadow = true;
    g.add(mesh);
    if (outline) g.add(inkLine(geom, 0.5));
    return g;
  };

  return { paperMat, inkLine, box, cyl, sphere };
}

/** Builds decorative architectural details on the two room walls (arches, curtains, frames). */
export function buildWallDecor(
  style: WallStyleId,
  palette: ColorPalette,
  wallWidth: number,
  wallHeight: number
): THREE.Group {
  const f = createCraftFactory(palette);
  const group = new THREE.Group();

  if (style === 'arched_windows') {
    const archGroup = new THREE.Group();
    const winW = 0.72;
    const winH = 1.45;
    const frame = f.box(winW, winH, 0.04, palette.paperBase);
    frame.position.set(wallWidth * 0.45, wallHeight * 0.44, 0.03);
    archGroup.add(frame);

    const pane = f.box(winW * 0.78, winH * 0.84, 0.045, palette.backdropColor);
    pane.position.set(wallWidth * 0.45, wallHeight * 0.44, 0.035);
    archGroup.add(pane);

    const topCap = f.cyl(winW * 0.5, winW * 0.5, 0.04, 16, palette.paperBase);
    topCap.rotation.x = Math.PI / 2;
    topCap.position.set(wallWidth * 0.45, wallHeight * 0.44 + winH / 2, 0.03);
    archGroup.add(topCap);

    group.add(archGroup);
  } else if (style === 'draped_curtains') {
    for (let i = 0; i < 3; i++) {
      const drape = f.cyl(0.28, 0.14, wallHeight * 0.78, 8, i % 2 === 0 ? palette.accentPrimary : palette.paperBase);
      drape.scale.z = 0.25;
      drape.position.set(0.32 + i * 0.42, wallHeight * 0.44, 0.05);
      group.add(drape);
    }
  } else if (style === 'scalloped_palace') {
    for (let i = 0; i < 5; i++) {
      const scallop = f.cyl(0.22, 0.22, 0.05, 12, palette.accentSecondary);
      scallop.rotation.x = Math.PI / 2;
      scallop.position.set(0.45 + i * 0.48, wallHeight * 0.82, 0.04);
      group.add(scallop);
    }
  } else if (style === 'modern_minimal') {
    const frame = f.box(0.85, 1.1, 0.04, palette.paperBase);
    frame.position.set(wallWidth * 0.45, wallHeight * 0.48, 0.03);
    const art = f.box(0.66, 0.9, 0.045, palette.accentPrimary);
    art.position.set(wallWidth * 0.45, wallHeight * 0.48, 0.035);
    group.add(frame, art);
  } else if (style === 'jharokha_lattice') {
    // Hand-carved Jharokha filigree window frame with jaali lattice mullions
    const outerFrame = f.box(1.18, 1.58, 0.055, palette.paperBase);
    outerFrame.position.set(wallWidth * 0.46, wallHeight * 0.48, 0.032);
    const goldBorder = f.box(1.24, 0.08, 0.075, palette.accentSecondary);
    goldBorder.position.set(wallWidth * 0.46, wallHeight * 0.78, 0.045);
    const innerArch = f.box(0.92, 1.28, 0.06, palette.backdropColor);
    innerArch.position.set(wallWidth * 0.46, wallHeight * 0.46, 0.04);
    const crown = f.cyl(0.46, 0.46, 0.055, 16, palette.accentSecondary);
    crown.rotation.x = Math.PI / 2;
    crown.position.set(wallWidth * 0.46, wallHeight * 0.72, 0.038);
    group.add(outerFrame, goldBorder, innerArch, crown);
    for (let m = -1; m <= 1; m++) {
      const mullion = f.box(0.035, 1.24, 0.07, palette.accentPrimary);
      mullion.position.set(wallWidth * 0.46 + m * 0.24, wallHeight * 0.46, 0.048);
      group.add(mullion);
    }
    const sill = f.box(1.26, 0.08, 0.14, palette.accentSecondary);
    sill.position.set(wallWidth * 0.46, wallHeight * 0.18, 0.07);
    group.add(sill);
  } else if (style === 'botanical_relief') {
    // Bas-relief carved paper panel with sculpted floral medallions & twin stems
    const panel = f.box(1.06, 1.48, 0.04, palette.paperBase);
    panel.position.set(wallWidth * 0.45, wallHeight * 0.48, 0.03);
    group.add(panel);
    for (const dx of [-0.28, 0, 0.28]) {
      const stem = f.cyl(0.015, 0.02, 1.12, 6, palette.accentPrimary);
      stem.position.set(wallWidth * 0.45 + dx, wallHeight * 0.44, 0.055);
      const bloom = f.sphere(0.11, palette.accentSecondary, true);
      bloom.scale.z = 0.4;
      bloom.position.set(wallWidth * 0.45 + dx, wallHeight * 0.64 + (dx === 0 ? 0.12 : 0), 0.068);
      group.add(stem, bloom);
    }
  } else if (style === 'shoji_screen') {
    // Traditional wooden kumiko rice-paper lattice grid
    const screen = f.box(1.16, 1.56, 0.035, '#FAF6EE');
    screen.position.set(wallWidth * 0.45, wallHeight * 0.48, 0.03);
    group.add(screen);
    for (let col = -2; col <= 2; col++) {
      const bar = f.box(0.03, 1.54, 0.045, palette.inkColor);
      bar.position.set(wallWidth * 0.45 + col * 0.22, wallHeight * 0.48, 0.036);
      group.add(bar);
    }
    for (let row = 0; row <= 4; row++) {
      const bar = f.box(1.16, 0.03, 0.045, palette.inkColor);
      bar.position.set(wallWidth * 0.45, wallHeight * 0.18 + row * 0.34, 0.036);
      group.add(bar);
    }
  } else if (style === 'parisian_paneling') {
    // Classical European wainscoting + inset moulding frames
    const dado = f.box(wallWidth * 0.9, 0.055, 0.06, palette.accentSecondary);
    dado.position.set(wallWidth * 0.48, wallHeight * 0.3, 0.04);
    group.add(dado);
    for (const mx of [wallWidth * 0.26, wallWidth * 0.64]) {
      const upperPanel = f.box(0.62, 0.92, 0.035, palette.paperBase);
      upperPanel.position.set(mx, wallHeight * 0.56, 0.032);
      const lowerPanel = f.box(0.62, 0.36, 0.035, palette.paperBase);
      lowerPanel.position.set(mx, wallHeight * 0.16, 0.032);
      group.add(upperPanel, lowerPanel);
    }
  }

  return group;
}

/** Builds hanging garlands along the top edge of a room wall. */
export function buildGarland(garland: GarlandId, palette: ColorPalette, wallWidth: number): THREE.Group {
  const f = createCraftFactory(palette);
  const group = new THREE.Group();
  if (garland === 'none') return group;

  const count = 9;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const x = 0.22 + t * (wallWidth - 0.44);
    const sag = Math.sin(t * Math.PI) * 0.26;
    const y = 2.48 - sag;

    if (garland === 'marigold' || garland === 'toran') {
      const strandLen = garland === 'marigold' ? 3 : 2;
      for (let s = 0; s < strandLen; s++) {
        const flower = f.sphere(0.065, s % 2 === 0 ? palette.accentPrimary : palette.accentSecondary, true);
        flower.position.set(x, y - s * 0.14, 0.07);
        group.add(flower);
      }
    } else if (garland === 'fairy_lights') {
      const bulb = f.sphere(0.045, '#FFE8A3', false);
      bulb.position.set(x, y, 0.08);
      group.add(bulb);
    } else if (garland === 'balloons') {
      const b = f.sphere(0.11, i % 2 === 0 ? palette.accentPrimary : palette.accentSecondary, true);
      b.scale.y = 1.22;
      b.position.set(x, y - (i % 2) * 0.08, 0.09);
      group.add(b);
    } else if (garland === 'bunting') {
      const flag = f.cyl(0.09, 0.005, 0.18, 3, i % 2 === 0 ? palette.accentPrimary : palette.accentSecondary);
      flag.rotation.z = Math.PI;
      flag.scale.z = 0.25;
      flag.position.set(x, y - 0.06, 0.06);
      group.add(flag);
    } else if (garland === 'floral_drape') {
      const bloom = f.sphere(0.08, i % 3 === 0 ? palette.accentSecondary : palette.accentPrimary, true);
      bloom.position.set(x, y, 0.07);
      group.add(bloom);
    } else if (garland === 'lanterns' && i % 2 === 1) {
      const lantern = f.cyl(0.08, 0.06, 0.22, 6, palette.accentSecondary);
      lantern.position.set(x, y - 0.18, 0.12);
      group.add(lantern);
    } else if (garland === 'origami_cranes' && i % 2 === 1) {
      const dropY = y - 0.18 - (i % 3) * 0.08;
      const chord = f.cyl(0.005, 0.005, 0.28, 4, palette.inkColor, false);
      chord.position.set(x, y - 0.08, 0.08);
      const body = f.box(0.12, 0.04, 0.12, i % 4 === 1 ? palette.accentSecondary : palette.paperBase);
      body.rotation.y = Math.PI / 4;
      body.rotation.z = 0.18;
      body.position.set(x, dropY, 0.09);
      const wingL = f.box(0.18, 0.015, 0.08, palette.accentPrimary);
      wingL.rotation.z = 0.35;
      wingL.position.set(x - 0.08, dropY + 0.04, 0.09);
      const wingR = f.box(0.18, 0.015, 0.08, palette.accentPrimary);
      wingR.rotation.z = -0.35;
      wingR.position.set(x + 0.08, dropY + 0.04, 0.09);
      group.add(chord, body, wingL, wingR);
    } else if (garland === 'sakura_branches') {
      const blossom = f.sphere(0.075, i % 3 === 0 ? '#FFFFFF' : '#F48FB1', true);
      blossom.position.set(x, y - (i % 2) * 0.09, 0.09);
      const twig = f.box(0.24, 0.02, 0.02, '#5C4033');
      twig.position.set(x, y + 0.03, 0.06);
      twig.rotation.z = i % 2 === 0 ? 0.18 : -0.18;
      group.add(blossom, twig);
    } else if (garland === 'ivy_edison_bulbs') {
      const leaf = f.sphere(0.065, '#4E8C57', true);
      leaf.position.set(x, y + 0.02, 0.07);
      group.add(leaf);
      if (i % 2 === 0) {
        const bulb = f.sphere(0.052, '#FFE082', false);
        bulb.position.set(x, y - 0.12, 0.1);
        group.add(bulb);
      }
    }
  }
  return group;
}

/** Builds each centerpiece 3D pop-up model centered on the quadrant floor. */
export function buildCenterpiece(id: CenterpieceId, palette: ColorPalette): THREE.Group {
  const f = createCraftFactory(palette);
  const g = new THREE.Group();

  switch (id) {
    case 'mandap': {
      // Base platform
      const plinth = f.box(1.28, 0.12, 1.28, palette.paperBase);
      plinth.position.y = 0.06;
      g.add(plinth);

      // 4 pillars
      const offsets = [
        [-0.48, -0.48],
        [0.48, -0.48],
        [-0.48, 0.48],
        [0.48, 0.48],
      ];
      for (const [px, pz] of offsets) {
        const pillar = f.cyl(0.05, 0.06, 1.15, 8, palette.accentSecondary);
        pillar.position.set(px, 0.68, pz);
        g.add(pillar);
        const flowerRing = f.sphere(0.08, palette.accentPrimary, true);
        flowerRing.position.set(px, 1.15, pz);
        g.add(flowerRing);
      }

      // Canopy roof pyramid
      const roof = f.cyl(0.06, 0.85, 0.46, 4, palette.accentPrimary);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 1.48;
      g.add(roof);

      // Sacred fire havan kund + 2 cushions
      const kund = f.box(0.32, 0.16, 0.32, palette.wallTint);
      kund.position.y = 0.2;
      g.add(kund);
      const flame = f.cyl(0.01, 0.08, 0.18, 6, '#F79D34');
      flame.position.y = 0.35;
      g.add(flame);

      const c1 = f.box(0.24, 0.1, 0.24, palette.accentSecondary);
      c1.position.set(-0.34, 0.17, 0.22);
      const c2 = f.box(0.24, 0.1, 0.24, palette.accentSecondary);
      c2.position.set(0.34, 0.17, 0.22);
      g.add(c1, c2);
      break;
    }

    case 'haldi_swing': {
      // Wooden A-frame jhula swing
      const base = f.box(1.15, 0.06, 0.72, palette.paperBase);
      base.position.y = 0.03;
      g.add(base);

      const postL = f.box(0.07, 1.28, 0.07, palette.accentSecondary);
      postL.position.set(-0.46, 0.66, 0);
      const postR = f.box(0.07, 1.28, 0.07, palette.accentSecondary);
      postR.position.set(0.46, 0.66, 0);
      const beam = f.box(1.12, 0.09, 0.09, palette.inkColor);
      beam.position.set(0, 1.32, 0);
      g.add(postL, postR, beam);

      // Marigold wrap along beam
      for (let i = -3; i <= 3; i++) {
        const m = f.sphere(0.06, i % 2 === 0 ? palette.accentPrimary : palette.accentSecondary, true);
        m.position.set(i * 0.14, 1.32, 0.06);
        g.add(m);
      }

      // Hanging ropes + swing seat
      const ropeL = f.cyl(0.014, 0.014, 0.85, 6, palette.inkColor, false);
      ropeL.position.set(-0.28, 0.88, 0);
      const ropeR = f.cyl(0.014, 0.014, 0.85, 6, palette.inkColor, false);
      ropeR.position.set(0.28, 0.88, 0);
      const seat = f.box(0.72, 0.08, 0.36, palette.accentPrimary);
      seat.position.set(0, 0.45, 0);
      const bolster = f.cyl(0.06, 0.06, 0.28, 8, palette.paperBase);
      bolster.rotation.x = Math.PI / 2;
      bolster.position.set(-0.26, 0.54, 0);
      g.add(ropeL, ropeR, seat, bolster);
      break;
    }

    case 'tiered_cake':
    case 'balloon_cake': {
      const table = f.cyl(0.54, 0.48, 0.45, 16, palette.paperBase);
      table.position.y = 0.225;
      g.add(table);

      const t1 = f.cyl(0.36, 0.36, 0.26, 16, palette.wallTint);
      t1.position.y = 0.58;
      const t2 = f.cyl(0.26, 0.26, 0.24, 16, palette.accentPrimary);
      t2.position.y = 0.83;
      const t3 = f.cyl(0.16, 0.16, 0.2, 16, palette.paperBase);
      t3.position.y = 1.05;
      g.add(t1, t2, t3);

      // Cake topper / candles
      for (let i = -1; i <= 1; i++) {
        const candle = f.cyl(0.015, 0.015, 0.14, 6, palette.accentSecondary);
        candle.position.set(i * 0.06, 1.22, 0);
        const tip = f.sphere(0.025, '#FFD166', false);
        tip.position.set(i * 0.06, 1.31, 0);
        g.add(candle, tip);
      }

      if (id === 'balloon_cake') {
        const offsets = [
          [-0.55, 1.25, -0.2],
          [0.55, 1.35, -0.15],
          [-0.42, 1.48, 0.15],
          [0.45, 1.18, 0.2],
        ];
        offsets.forEach(([bx, by, bz], idx) => {
          const balloon = f.sphere(0.15, idx % 2 === 0 ? palette.accentPrimary : palette.accentSecondary, true);
          balloon.scale.y = 1.22;
          balloon.position.set(bx, by, bz);
          g.add(balloon);
        });
      }
      break;
    }

    case 'floral_arch':
    case 'ring_gazebo': {
      const base = f.box(1.22, 0.08, 0.75, palette.paperBase);
      base.position.y = 0.04;
      g.add(base);

      // Arch pillars + curved crown
      const pL = f.box(0.1, 1.1, 0.1, palette.paperBase);
      pL.position.set(-0.48, 0.62, -0.1);
      const pR = f.box(0.1, 1.1, 0.1, palette.paperBase);
      pR.position.set(0.48, 0.62, -0.1);
      g.add(pL, pR);

      for (let i = 0; i <= 8; i++) {
        const angle = (i / 8) * Math.PI;
        const x = -Math.cos(angle) * 0.48;
        const y = 1.16 + Math.sin(angle) * 0.42;
        const blossom = f.sphere(0.095, i % 2 === 0 ? palette.accentPrimary : palette.accentSecondary, true);
        blossom.position.set(x, y, -0.1);
        g.add(blossom);
      }

      if (id === 'ring_gazebo') {
        const ringBand = f.cyl(0.18, 0.18, 0.06, 20, palette.accentSecondary);
        ringBand.rotation.x = Math.PI / 2;
        ringBand.position.set(0, 0.78, 0.05);
        const gem = f.box(0.1, 0.1, 0.1, '#FFFFFF');
        gem.rotation.z = Math.PI / 4;
        gem.position.set(0, 0.99, 0.05);
        g.add(ringBand, gem);
      } else {
        const bench = f.box(0.68, 0.24, 0.34, palette.wallTint);
        bench.position.set(0, 0.2, 0.12);
        const back = f.box(0.68, 0.3, 0.08, palette.accentPrimary);
        back.position.set(0, 0.42, -0.02);
        g.add(bench, back);
      }
      break;
    }

    case 'chapel_altar': {
      const steps = f.box(1.18, 0.1, 0.82, palette.paperBase);
      steps.position.y = 0.05;
      const altar = f.box(0.72, 0.56, 0.4, palette.wallTint);
      altar.position.y = 0.38;
      const arch = f.cyl(0.48, 0.48, 0.08, 16, palette.accentSecondary);
      arch.rotation.x = Math.PI / 2;
      arch.position.set(0, 1.12, -0.16);
      g.add(steps, altar, arch);

      for (const cx of [-0.28, 0, 0.28]) {
        const c = f.cyl(0.03, 0.03, 0.22, 8, palette.paperBase);
        c.position.set(cx, 0.77, 0.05);
        const glow = f.sphere(0.035, '#FFD166', false);
        glow.position.set(cx, 0.91, 0.05);
        g.add(c, glow);
      }
      break;
    }

    case 'party_dj_bar': {
      const counter = f.box(1.18, 0.62, 0.48, palette.accentPrimary);
      counter.position.set(0, 0.31, 0);
      const top = f.box(1.26, 0.06, 0.54, palette.paperBase);
      top.position.set(0, 0.64, 0);
      const deckL = f.cyl(0.14, 0.14, 0.04, 16, palette.inkColor);
      deckL.position.set(-0.26, 0.69, 0);
      const deckR = f.cyl(0.14, 0.14, 0.04, 16, palette.inkColor);
      deckR.position.set(0.26, 0.69, 0);
      const disco = f.sphere(0.18, palette.accentSecondary, true);
      disco.position.set(0, 1.35, 0);
      const rod = f.cyl(0.015, 0.015, 0.45, 6, palette.inkColor, false);
      rod.position.set(0, 1.62, 0);
      g.add(counter, top, deckL, deckR, disco, rod);
      break;
    }

    case 'nursery_crib': {
      const rug = f.cyl(0.68, 0.68, 0.04, 24, palette.paperBase);
      rug.position.y = 0.02;
      const body = f.box(0.86, 0.42, 0.56, palette.wallTint);
      body.position.y = 0.35;
      const mattress = f.box(0.78, 0.1, 0.48, palette.accentSecondary);
      mattress.position.y = 0.56;
      const pole = f.cyl(0.02, 0.02, 0.72, 6, palette.inkColor);
      pole.position.set(-0.36, 0.86, -0.2);
      const cloud = f.sphere(0.12, palette.paperBase, true);
      cloud.position.set(0, 1.18, 0);
      const star = f.sphere(0.07, palette.accentPrimary, true);
      star.position.set(0.14, 1.06, 0.08);
      g.add(rug, body, mattress, pole, cloud, star);
      break;
    }

    case 'cozy_sofa': {
      const rug = f.box(1.3, 0.03, 0.96, palette.paperBase);
      rug.position.y = 0.015;
      const seat = f.box(1.06, 0.26, 0.46, palette.accentPrimary);
      seat.position.set(0, 0.18, -0.1);
      const back = f.box(1.06, 0.42, 0.14, palette.accentPrimary);
      back.position.set(0, 0.44, -0.28);
      const armL = f.box(0.14, 0.34, 0.48, palette.accentSecondary);
      armL.position.set(-0.48, 0.32, -0.1);
      const armR = f.box(0.14, 0.34, 0.48, palette.accentSecondary);
      armR.position.set(0.48, 0.32, -0.1);
      const coffee = f.cyl(0.24, 0.24, 0.18, 16, palette.wallTint);
      coffee.position.set(0, 0.12, 0.34);
      g.add(rug, seat, back, armL, armR, coffee);
      break;
    }

    case 'diwali_rangoli': {
      const platter = f.cyl(0.68, 0.72, 0.08, 24, palette.paperBase);
      platter.position.y = 0.04;
      const stand = f.cyl(0.22, 0.3, 0.56, 12, palette.accentSecondary);
      stand.position.y = 0.34;
      const bowl = f.cyl(0.32, 0.14, 0.16, 12, palette.accentPrimary);
      bowl.position.y = 0.68;
      const flame = f.cyl(0.01, 0.09, 0.24, 8, '#FFD166');
      flame.position.y = 0.86;
      g.add(platter, stand, bowl, flame);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const diya = f.cyl(0.08, 0.04, 0.06, 8, palette.accentSecondary);
        diya.position.set(Math.cos(a) * 0.48, 0.11, Math.sin(a) * 0.48);
        g.add(diya);
      }
      break;
    }

    case 'christmas_fireplace': {
      const hearth = f.box(0.92, 0.72, 0.42, palette.paperBase);
      hearth.position.set(-0.2, 0.36, -0.18);
      const fireBox = f.box(0.48, 0.36, 0.12, palette.inkColor);
      fireBox.position.set(-0.2, 0.2, 0.01);
      const mantle = f.box(1.04, 0.09, 0.48, palette.accentSecondary);
      mantle.position.set(-0.2, 0.76, -0.18);

      // Pop-up pine tree next to hearth
      const trunk = f.cyl(0.06, 0.08, 0.2, 8, '#7A4E32');
      trunk.position.set(0.45, 0.1, 0.12);
      const t1 = f.cyl(0.06, 0.38, 0.48, 8, palette.accentPrimary);
      t1.position.set(0.45, 0.42, 0.12);
      const t2 = f.cyl(0.04, 0.28, 0.42, 8, palette.accentPrimary);
      t2.position.set(0.45, 0.74, 0.12);
      const star = f.sphere(0.06, palette.accentSecondary, true);
      star.position.set(0.45, 1.0, 0.12);
      g.add(hearth, fireBox, mantle, trunk, t1, t2, star);
      break;
    }

    case 'eid_arch': {
      const carpet = f.box(1.24, 0.05, 0.92, palette.accentSecondary);
      carpet.position.y = 0.025;
      const pL = f.cyl(0.07, 0.08, 1.15, 8, palette.paperBase);
      pL.position.set(-0.46, 0.6, -0.1);
      const pR = f.cyl(0.07, 0.08, 1.15, 8, palette.paperBase);
      pR.position.set(0.46, 0.6, -0.1);
      const dome = f.cyl(0.04, 0.56, 0.42, 12, palette.accentPrimary);
      dome.position.set(0, 1.36, -0.1);
      const moon = f.sphere(0.11, palette.accentSecondary, true);
      moon.position.set(0, 1.66, -0.1);
      const feast = f.cyl(0.32, 0.32, 0.24, 12, palette.wallTint);
      feast.position.set(0, 0.16, 0.16);
      g.add(carpet, pL, pR, dome, moon, feast);
      break;
    }

    case 'origami_crane_canopy': {
      // Sculpted paper cloud platform + twin curved wings + hovering origami cranes
      const dais = f.cyl(0.68, 0.76, 0.1, 16, palette.paperBase);
      dais.position.y = 0.05;
      const archL = f.box(0.12, 1.38, 0.12, palette.accentSecondary);
      archL.position.set(-0.48, 0.72, -0.05);
      archL.rotation.z = -0.14;
      const archR = f.box(0.12, 1.38, 0.12, palette.accentSecondary);
      archR.position.set(0.48, 0.72, -0.05);
      archR.rotation.z = 0.14;
      const lintel = f.box(1.18, 0.12, 0.24, palette.accentPrimary);
      lintel.position.set(0, 1.42, -0.05);
      g.add(dais, archL, archR, lintel);

      const craneSpecs = [
        [-0.28, 1.12, 0.06, -0.2],
        [0, 1.24, 0.08, 0],
        [0.28, 1.08, 0.04, 0.25],
      ];
      craneSpecs.forEach(([cx, cy, cz, tilt], idx) => {
        const body = f.box(0.18, 0.05, 0.16, idx === 1 ? palette.accentSecondary : palette.paperBase);
        body.position.set(cx, cy, cz);
        body.rotation.y = tilt;
        const w1 = f.box(0.24, 0.02, 0.1, palette.accentPrimary);
        w1.position.set(cx - 0.1, cy + 0.05, cz);
        w1.rotation.z = 0.36;
        const w2 = f.box(0.24, 0.02, 0.1, palette.accentPrimary);
        w2.position.set(cx + 0.1, cy + 0.05, cz);
        w2.rotation.z = -0.36;
        g.add(body, w1, w2);
      });
      break;
    }

    case 'lotus_pond_pavilion': {
      // Stepped octagonal jade water basin + carved blooming lotus pedestal + kalash spire
      const basinOuter = f.cyl(0.86, 0.92, 0.09, 8, palette.accentSecondary);
      basinOuter.position.y = 0.045;
      const waterPool = f.cyl(0.74, 0.74, 0.04, 8, palette.accentPrimary);
      waterPool.position.y = 0.1;
      g.add(basinOuter, waterPool);

      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const petal = f.box(0.2, 0.34, 0.05, i % 2 === 0 ? palette.paperBase : palette.wallTint);
        petal.position.set(Math.cos(a) * 0.36, 0.24, Math.sin(a) * 0.36);
        petal.rotation.y = -a + Math.PI / 2;
        petal.rotation.x = 0.42;
        g.add(petal);
      }

      const plinth = f.cyl(0.26, 0.3, 0.36, 12, palette.paperBase);
      plinth.position.y = 0.3;
      const kalash = f.sphere(0.18, palette.accentSecondary, true);
      kalash.position.y = 0.62;
      const flame = f.cyl(0.01, 0.07, 0.16, 8, palette.accentPrimary);
      flame.position.y = 0.84;
      g.add(plinth, kalash, flame);
      break;
    }

    case 'celestial_moon_arch': {
      // Sculpted starlit pedestal + tall layered crescent moon sculpture + hovering orbs
      const plinth = f.cyl(0.68, 0.74, 0.1, 16, palette.wallTint);
      plinth.position.y = 0.05;
      g.add(plinth);
      for (let s = 0; s < 9; s++) {
        const t = -0.78 + (s / 8) * 1.56;
        const angle = t * 1.35;
        const px = Math.cos(angle - Math.PI / 2) * 0.56 - 0.12;
        const py = Math.sin(angle - Math.PI / 2) * 0.56 + 0.96;
        const seg = f.sphere(0.13 - Math.abs(t) * 0.07, palette.accentSecondary, true);
        seg.scale.z = 0.45;
        seg.position.set(px, py, 0);
        g.add(seg);
      }
      const seat = f.box(0.64, 0.24, 0.32, palette.accentPrimary);
      seat.position.set(0.05, 0.22, 0.08);
      const starA = f.sphere(0.07, palette.paperBase, true);
      starA.position.set(0.36, 1.38, 0.04);
      const starB = f.sphere(0.05, palette.accentSecondary, true);
      starB.position.set(0.22, 1.56, -0.02);
      g.add(seat, starA, starB);
      break;
    }

    case 'peacock_royal_throne': {
      // Haveli carpet + twin gold pillars + fanned layered peacock plumage crest behind throne
      const dais = f.box(1.24, 0.08, 0.92, palette.accentSecondary);
      dais.position.y = 0.04;
      const throneSeat = f.box(0.68, 0.26, 0.38, palette.accentPrimary);
      throneSeat.position.set(0, 0.21, 0.06);
      const p1 = f.cyl(0.05, 0.06, 1.28, 8, palette.paperBase);
      p1.position.set(-0.46, 0.68, -0.14);
      const p2 = f.cyl(0.05, 0.06, 1.28, 8, palette.paperBase);
      p2.position.set(0.46, 0.68, -0.14);
      g.add(dais, throneSeat, p1, p2);

      for (let fIdx = -3; fIdx <= 3; fIdx++) {
        const ang = fIdx * 0.26;
        const feather = f.box(0.16, 0.66, 0.04, Math.abs(fIdx) % 2 === 0 ? palette.accentPrimary : palette.accentSecondary);
        feather.position.set(Math.sin(ang) * 0.34, 0.68 + Math.cos(ang) * 0.3, -0.14);
        feather.rotation.z = -ang;
        g.add(feather);
      }
      break;
    }

    case 'floating_lantern_pagoda': {
      // Three-tier carved pagoda roofs + hanging warm lanterns at every corner
      const base = f.cyl(0.66, 0.72, 0.12, 8, palette.wallTint);
      base.position.y = 0.06;
      const core = f.cyl(0.32, 0.38, 1.24, 8, palette.paperBase);
      core.position.y = 0.7;
      g.add(base, core);

      const tiers = [
        [0.64, 0.52],
        [0.48, 0.96],
        [0.32, 1.38],
      ];
      tiers.forEach(([r, ty]) => {
        const roof = f.cyl(r * 0.35, r, 0.14, 8, palette.accentPrimary);
        roof.position.y = ty;
        g.add(roof);
        for (let k = 0; k < 4; k++) {
          const ka = (k * Math.PI) / 2 + Math.PI / 4;
          const lantern = f.cyl(0.05, 0.04, 0.14, 6, palette.accentSecondary);
          lantern.position.set(Math.cos(ka) * (r * 0.85), ty - 0.14, Math.sin(ka) * (r * 0.85));
          g.add(lantern);
        }
      });
      const spire = f.cyl(0.015, 0.06, 0.24, 8, palette.accentSecondary);
      spire.position.y = 1.56;
      g.add(spire);
      break;
    }

    case 'tuscan_vineyard_arbor': {
      // European rustic timber wine arbor + hanging olive clusters + wine table
      for (const px of [-0.52, 0.52]) {
        for (const pz of [-0.36, 0.36]) {
          const post = f.box(0.085, 1.32, 0.085, '#7A5438');
          post.position.set(px, 0.66, pz);
          g.add(post);
        }
        const beam = f.box(0.09, 0.09, 0.92, '#7A5438');
        beam.position.set(px, 1.32, 0);
        g.add(beam);
      }
      for (let b = -2; b <= 2; b++) {
        const cross = f.box(1.26, 0.07, 0.07, '#8B6242');
        cross.position.set(0, 1.38, b * 0.22);
        const vine = f.sphere(0.11, b % 2 === 0 ? '#5D8A66' : palette.accentPrimary, true);
        vine.position.set((b % 2) * 0.28, 1.24, b * 0.2);
        g.add(cross, vine);
      }
      const table = f.box(0.68, 0.32, 0.4, palette.paperBase);
      table.position.y = 0.16;
      g.add(table);
      break;
    }

    case 'paris_champagne_fountain': {
      // Stepped crystal basin & gilded stacked coupe champagne fountain
      const base = f.cyl(0.66, 0.72, 0.12, 16, palette.paperBase);
      base.position.y = 0.06;
      const bowl1 = f.cyl(0.48, 0.3, 0.16, 16, palette.accentSecondary);
      bowl1.position.y = 0.32;
      const bowl2 = f.cyl(0.32, 0.18, 0.14, 16, palette.accentPrimary);
      bowl2.position.y = 0.62;
      const bowl3 = f.cyl(0.18, 0.08, 0.14, 16, '#FFF7DE');
      bowl3.position.y = 0.9;
      const stem = f.cyl(0.055, 0.09, 0.96, 12, palette.accentSecondary);
      stem.position.y = 0.54;
      const star = f.sphere(0.09, '#FFFDF0', true);
      star.position.y = 1.12;
      g.add(base, stem, bowl1, bowl2, bowl3, star);
      break;
    }

    case 'cathedral_stained_rose': {
      // Gothic pointed stone nave arch + radiant jewel stained-glass rosette
      const base = f.box(1.16, 0.14, 0.72, palette.wallTint);
      base.position.y = 0.07;
      const altar = f.box(0.62, 0.36, 0.34, palette.paperBase);
      altar.position.set(0, 0.32, 0.08);
      for (const sx of [-0.46, 0.46]) {
        const col = f.cyl(0.06, 0.075, 1.26, 10, palette.paperBase);
        col.position.set(sx, 0.7, -0.14);
        g.add(col);
      }
      const rosette = f.cyl(0.42, 0.42, 0.08, 16, palette.accentSecondary);
      rosette.rotation.x = Math.PI / 2;
      rosette.position.set(0, 1.06, -0.14);
      const innerRose = f.cyl(0.26, 0.26, 0.095, 12, palette.accentPrimary);
      innerRose.rotation.x = Math.PI / 2;
      innerRose.position.set(0, 1.06, -0.14);
      g.add(base, altar, rosette, innerRose);
      break;
    }

    case 'alpine_chalet_hearth': {
      // Stacked stone chalet chimney hearth + evergreens & winter wreaths
      const stone = f.box(0.98, 0.92, 0.44, palette.wallTint);
      stone.position.set(0, 0.46, -0.1);
      const flue = f.box(0.48, 0.55, 0.32, palette.paperBase);
      flue.position.set(0, 1.18, -0.14);
      const fire = f.box(0.48, 0.34, 0.12, '#E05A2B');
      fire.position.set(0, 0.24, 0.12);
      const mantle = f.box(1.1, 0.08, 0.5, '#7A4E32');
      mantle.position.set(0, 0.66, -0.06);
      const wreath = f.cyl(0.2, 0.2, 0.06, 12, '#2D6A4F');
      wreath.rotation.x = Math.PI / 2;
      wreath.position.set(0, 0.96, 0.14);
      g.add(stone, flue, fire, mantle, wreath);
      break;
    }

    case 'hampton_garden_pergola': {
      // Crisp white fluted garden columns + arched trellis & flower boxes
      const deck = f.box(1.3, 0.08, 0.95, palette.paperBase);
      deck.position.y = 0.04;
      g.add(deck);
      for (const sx of [-0.5, 0.5]) {
        const col = f.cyl(0.065, 0.075, 1.24, 12, '#FFFFFF');
        col.position.set(sx, 0.66, -0.08);
        const pot = f.box(0.24, 0.2, 0.24, palette.wallTint);
        pot.position.set(sx, 0.16, 0.24);
        const shrub = f.sphere(0.14, palette.accentPrimary, true);
        shrub.position.set(sx, 0.34, 0.24);
        g.add(col, pot, shrub);
      }
      const beam = f.box(1.26, 0.1, 0.24, '#FFFFFF');
      beam.position.set(0, 1.3, -0.08);
      const crest = f.sphere(0.14, palette.accentSecondary, true);
      crest.position.set(0, 1.44, -0.08);
      g.add(beam, crest);
      break;
    }

    case 'kyoto_torii_bridge': {
      // Arched vermilion wooden bridge over pond + signature double-beam Torii shrine gate
      const pond = f.cyl(0.84, 0.88, 0.05, 16, '#8AB8D9');
      pond.position.y = 0.025;
      const bridge = f.box(0.54, 0.07, 1.18, '#8D5F3C');
      bridge.position.set(0, 0.12, 0.08);
      const pL = f.cyl(0.065, 0.075, 1.28, 12, '#B52B27');
      pL.position.set(-0.46, 0.68, -0.18);
      const pR = f.cyl(0.065, 0.075, 1.28, 12, '#B52B27');
      pR.position.set(0.46, 0.68, -0.18);
      const kasagi = f.box(1.38, 0.1, 0.14, '#1F1B18');
      kasagi.position.set(0, 1.36, -0.18);
      const nuki = f.box(1.16, 0.08, 0.1, '#B52B27');
      nuki.position.set(0, 1.12, -0.18);
      g.add(pond, bridge, pL, pR, kasagi, nuki);
      break;
    }

    case 'hanok_courtyard_tea': {
      // Korean giwa tiled-roof tea shelter + low floor banquet table + bojagi silk boxes
      const deck = f.box(1.32, 0.1, 0.96, '#C89D6C');
      deck.position.y = 0.05;
      for (const sx of [-0.52, 0.52]) {
        const pillar = f.cyl(0.055, 0.06, 1.1, 10, '#6F482D');
        pillar.position.set(sx, 0.6, -0.16);
        g.add(pillar);
      }
      const roof = f.box(1.42, 0.12, 0.68, '#374151');
      roof.position.set(0, 1.2, -0.16);
      const ridge = f.box(1.48, 0.08, 0.14, palette.accentSecondary);
      ridge.position.set(0, 1.29, -0.16);
      const teaTable = f.box(0.56, 0.18, 0.36, '#5C3923');
      teaTable.position.set(0, 0.19, 0.16);
      const pot = f.sphere(0.08, palette.accentPrimary, true);
      pot.position.set(0, 0.34, 0.16);
      g.add(deck, roof, ridge, teaTable, pot);
      break;
    }

    case 'cherry_blossom_shrine': {
      // Sculpted twisting bonsai cherry tree & stone base with rich pink blossom clusters
      const stoneDeck = f.cyl(0.68, 0.76, 0.1, 12, palette.wallTint);
      stoneDeck.position.y = 0.05;
      const trunk = f.cyl(0.075, 0.12, 0.88, 8, '#5C4033');
      trunk.position.set(-0.08, 0.5, 0);
      trunk.rotation.z = -0.18;
      const bough = f.cyl(0.045, 0.07, 0.54, 8, '#5C4033');
      bough.position.set(0.18, 0.88, 0);
      bough.rotation.z = 0.62;
      g.add(stoneDeck, trunk, bough);

      const canopySpots: [number, number, number, number][] = [
        [-0.22, 1.05, 0, 0.28],
        [0.08, 1.22, 0.06, 0.32],
        [0.38, 1.04, -0.05, 0.26],
        [-0.02, 0.94, 0.16, 0.24],
      ];
      canopySpots.forEach(([bx, by, bz, br], idx) => {
        const cloud = f.sphere(br, idx % 2 === 0 ? '#F48FB1' : '#FCE4EC', true);
        cloud.scale.y = 0.72;
        cloud.position.set(bx, by, bz);
        g.add(cloud);
      });
      break;
    }

    case 'lunar_dragon_arch': {
      // Crimson imperial ceremonial archway + twin hanging gold medallions
      const plinth = f.box(1.3, 0.1, 0.74, palette.accentSecondary);
      plinth.position.y = 0.05;
      for (const sx of [-0.5, 0.5]) {
        const col = f.cyl(0.07, 0.07, 1.24, 12, '#B52B27');
        col.position.set(sx, 0.67, -0.06);
        const lantern = f.sphere(0.11, palette.accentSecondary, true);
        lantern.position.set(sx, 1.12, 0.12);
        g.add(col, lantern);
      }
      const beam1 = f.box(1.42, 0.14, 0.24, '#B52B27');
      beam1.position.set(0, 1.32, -0.06);
      const beam2 = f.box(1.18, 0.1, 0.18, palette.accentSecondary);
      beam2.position.set(0, 1.46, -0.06);
      const orb = f.sphere(0.12, '#F4B942', true);
      orb.position.set(0, 1.62, -0.06);
      g.add(plinth, beam1, beam2, orb);
      break;
    }

    case 'zen_bamboo_pavilion': {
      // Jade bamboo stalks framing a carved stone Toro courtyard lantern
      const deck = f.cyl(0.68, 0.74, 0.08, 12, palette.wallTint);
      deck.position.y = 0.04;
      const toroBase = f.cyl(0.14, 0.18, 0.36, 6, '#9CA3AF');
      toroBase.position.y = 0.26;
      const toroBox = f.box(0.22, 0.2, 0.22, '#FFE082');
      toroBox.position.y = 0.54;
      const toroCap = f.cyl(0.04, 0.26, 0.16, 6, '#6B7280');
      toroCap.position.y = 0.72;
      g.add(deck, toroBase, toroBox, toroCap);

      for (const [bx, bz, h] of [
        [-0.46, -0.18, 1.35],
        [-0.32, -0.32, 1.15],
        [0.44, -0.2, 1.3],
        [0.3, -0.34, 1.08],
      ]) {
        const stalk = f.cyl(0.035, 0.04, h, 8, '#4E8C57');
        stalk.position.set(bx, h / 2 + 0.06, bz);
        g.add(stalk);
      }
      break;
    }
  }

  return g;
}

/** Builds perimeter side props around the room floor. */
export function buildSideProp(id: SidePropId, palette: ColorPalette): THREE.Group {
  const f = createCraftFactory(palette);
  const g = new THREE.Group();

  switch (id) {
    case 'banana_leaves': {
      for (let i = 0; i < 3; i++) {
        const leaf = f.box(0.12, 0.62, 0.03, '#4E8C57');
        leaf.position.set((i - 1) * 0.09, 0.31, 0);
        leaf.rotation.z = (i - 1) * 0.24;
        g.add(leaf);
      }
      break;
    }
    case 'turmeric_bowls': {
      const bowl = f.cyl(0.18, 0.1, 0.14, 12, palette.accentSecondary);
      bowl.position.y = 0.07;
      const powder = f.sphere(0.12, '#F4A21D', false);
      powder.scale.y = 0.45;
      powder.position.y = 0.13;
      g.add(bowl, powder);
      break;
    }
    case 'gift_boxes': {
      const b1 = f.box(0.26, 0.22, 0.26, palette.accentPrimary);
      b1.position.set(0, 0.11, 0);
      const b2 = f.box(0.18, 0.16, 0.18, palette.accentSecondary);
      b2.position.set(0.14, 0.08, 0.18);
      g.add(b1, b2);
      break;
    }
    case 'dining_table': {
      const top = f.cyl(0.34, 0.34, 0.05, 16, palette.paperBase);
      top.position.y = 0.34;
      const leg = f.cyl(0.04, 0.1, 0.32, 8, palette.inkColor);
      leg.position.y = 0.16;
      const vase = f.cyl(0.04, 0.05, 0.14, 8, palette.accentPrimary);
      vase.position.y = 0.43;
      g.add(top, leg, vase);
      break;
    }
    case 'floor_cushions': {
      const c1 = f.box(0.3, 0.09, 0.3, palette.accentPrimary);
      c1.position.y = 0.045;
      const c2 = f.box(0.24, 0.08, 0.24, palette.accentSecondary);
      c2.rotation.y = 0.4;
      c2.position.y = 0.13;
      g.add(c1, c2);
      break;
    }
    case 'balloons_cluster': {
      const pts = [
        [0, 0.72, 0],
        [-0.12, 0.86, 0.05],
        [0.12, 0.82, -0.05],
      ];
      pts.forEach(([x, y, z], i) => {
        const b = f.sphere(0.11, i === 1 ? palette.accentSecondary : palette.accentPrimary, true);
        b.scale.y = 1.25;
        b.position.set(x, y, z);
        const s = f.cyl(0.006, 0.006, y, 4, palette.inkColor, false);
        s.position.set(x, y / 2, z);
        g.add(b, s);
      });
      break;
    }
    case 'potted_palms': {
      const pot = f.cyl(0.14, 0.1, 0.22, 10, palette.wallTint);
      pot.position.y = 0.11;
      const stem = f.cyl(0.025, 0.03, 0.42, 6, '#4E8C57');
      stem.position.y = 0.4;
      const crown = f.sphere(0.2, '#5F9E68', true);
      crown.scale.y = 1.3;
      crown.position.y = 0.64;
      g.add(pot, stem, crown);
      break;
    }
    case 'diya_lamps': {
      const stand = f.cyl(0.04, 0.09, 0.38, 8, palette.accentSecondary);
      stand.position.y = 0.19;
      const flame = f.sphere(0.05, '#FFD166', false);
      flame.position.y = 0.42;
      g.add(stand, flame);
      break;
    }
    case 'champagne_tower': {
      const stand = f.box(0.26, 0.34, 0.26, palette.paperBase);
      stand.position.y = 0.17;
      const g1 = f.cyl(0.09, 0.02, 0.14, 10, palette.accentSecondary);
      g1.position.y = 0.41;
      const g2 = f.cyl(0.07, 0.02, 0.14, 10, palette.accentPrimary);
      g2.position.y = 0.55;
      g.add(stand, g1, g2);
      break;
    }
    case 'teddy_blocks': {
      const b1 = f.box(0.16, 0.16, 0.16, palette.accentPrimary);
      b1.position.set(-0.08, 0.08, 0);
      const b2 = f.box(0.16, 0.16, 0.16, palette.accentSecondary);
      b2.position.set(0.1, 0.08, 0);
      const b3 = f.box(0.15, 0.15, 0.15, palette.paperBase);
      b3.position.set(0.01, 0.24, 0);
      g.add(b1, b2, b3);
      break;
    }
    case 'candles': {
      const c1 = f.cyl(0.045, 0.045, 0.28, 8, palette.paperBase);
      c1.position.set(-0.05, 0.14, 0);
      const c2 = f.cyl(0.04, 0.04, 0.19, 8, palette.wallTint);
      c2.position.set(0.07, 0.095, 0.04);
      const f1 = f.sphere(0.03, '#FFD166', false);
      f1.position.set(-0.05, 0.31, 0);
      g.add(c1, c2, f1);
      break;
    }
  }

  return g;
}
