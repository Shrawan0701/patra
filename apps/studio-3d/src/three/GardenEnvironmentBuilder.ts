import * as THREE from 'three';
import { GardenConfig, GardenStyleId } from '@patra/shared';
import { getPaperGrainTexture } from './PaperTextures';

interface GardenThemeVisuals {
  lawnColor: string;
  courtyardColor: string;
  pathColor: string;
  potColor: string;
  foliageColor: string;
  bloomA: string;
  bloomB: string;
  pillarColor: string;
  lampGlowHex: string;
  inkColor: string;
  treeKind: 'round_topiary' | 'cypress' | 'sakura' | 'palm';
}

export interface BuiltGardenEnvironment {
  group: THREE.Group;
  dispose: () => void;
}

function getGardenVisuals(style: GardenStyleId): GardenThemeVisuals {
  switch (style) {
    case 'tuscan_olive_estate':
      return {
        lawnColor: '#91A068',
        courtyardColor: '#EFE4D0',
        pathColor: '#E5D3B3',
        potColor: '#C56B45',
        foliageColor: '#5C7748',
        bloomA: '#E8BC42',
        bloomB: '#FFF5DB',
        pillarColor: '#EADBC2',
        lampGlowHex: '#FFCD74',
        inkColor: '#5C4D40',
        treeKind: 'cypress',
      };
    case 'kyoto_sakura_garden':
      return {
        lawnColor: '#769564',
        courtyardColor: '#E8E3D9',
        pathColor: '#C9B9A5',
        potColor: '#5B463F',
        foliageColor: '#587851',
        bloomA: '#F4A3BA',
        bloomB: '#FCE0E8',
        pillarColor: '#B54239',
        lampGlowHex: '#FFD294',
        inkColor: '#4A3634',
        treeKind: 'sakura',
      };
    case 'english_botanical_lawn':
      return {
        lawnColor: '#789A5D',
        courtyardColor: '#F3ECE2',
        pathColor: '#E7DDD1',
        potColor: '#E8DFD2',
        foliageColor: '#4F7749',
        bloomA: '#DD6E86',
        bloomB: '#F8D4DC',
        pillarColor: '#F4EFE8',
        lampGlowHex: '#FFE099',
        inkColor: '#564E47',
        treeKind: 'round_topiary',
      };
    case 'starlit_oasis_terrace':
      return {
        lawnColor: '#4D634C',
        courtyardColor: '#D8C7AF',
        pathColor: '#C7B090',
        potColor: '#A87444',
        foliageColor: '#40654A',
        bloomA: '#F2B84B',
        bloomB: '#F7E7CE',
        pillarColor: '#D8C19C',
        lampGlowHex: '#FFB647',
        inkColor: '#3E332B',
        treeKind: 'palm',
      };
    case 'royal_marigold_courtyard':
    default:
      return {
        lawnColor: '#819F5E',
        courtyardColor: '#F4E5CE',
        pathColor: '#E8C69B',
        potColor: '#B95835',
        foliageColor: '#527742',
        bloomA: '#ED761C',
        bloomB: '#F7B733',
        pillarColor: '#EFE0C9',
        lampGlowHex: '#FFB84D',
        inkColor: '#59463B',
        treeKind: 'round_topiary',
      };
  }
}

function buildInstanced(
  geom: THREE.BufferGeometry,
  mat: THREE.Material,
  transforms: { pos: [number, number, number]; scale?: [number, number, number]; rotY?: number; rotZ?: number }[],
  castShadow = false
): THREE.InstancedMesh | null {
  if (transforms.length === 0) return null;
  const inst = new THREE.InstancedMesh(geom, mat, transforms.length);
  inst.castShadow = castShadow;
  inst.receiveShadow = false;
  const dummy = new THREE.Object3D();
  transforms.forEach((t, i) => {
    dummy.position.set(t.pos[0], t.pos[1], t.pos[2]);
    dummy.rotation.set(0, t.rotY ?? 0, t.rotZ ?? 0);
    if (t.scale) dummy.scale.set(t.scale[0], t.scale[1], t.scale[2]);
    else dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  });
  inst.instanceMatrix.needsUpdate = true;
  inst.computeBoundingSphere();
  return inst;
}

export function buildGardenEnvironment(garden: GardenConfig): BuiltGardenEnvironment {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  if (!garden.enabled) {
    group.visible = false;
    return { group, dispose: () => {} };
  }

  const v = getGardenVisuals(garden.style);
  const grain = getPaperGrainTexture();
  const densityMultiplier =
    garden.potDensity === 'minimal' ? 0.55 : garden.potDensity === 'lush' ? 1.35 : 1.0;

  const trackGeom = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  // Fixed lightweight material palette (~10 materials total)
  const lawnMat = trackMat(new THREE.MeshStandardMaterial({ color: v.lawnColor, roughness: 0.94, metalness: 0.01 }));
  const courtyardMat = trackMat(
    new THREE.MeshStandardMaterial({ color: v.courtyardColor, roughness: 0.88, metalness: 0.02, map: grain })
  );
  const pathMat = trackMat(
    new THREE.MeshStandardMaterial({ color: v.pathColor, roughness: 0.88, metalness: 0.02, map: grain })
  );
  const potMat = trackMat(new THREE.MeshStandardMaterial({ color: v.potColor, roughness: 0.86, metalness: 0.03 }));
  const foliageMat = trackMat(new THREE.MeshStandardMaterial({ color: v.foliageColor, roughness: 0.9, metalness: 0.01 }));
  const bloomAMat = trackMat(new THREE.MeshStandardMaterial({ color: v.bloomA, roughness: 0.82, metalness: 0.03 }));
  const bloomBMat = trackMat(new THREE.MeshStandardMaterial({ color: v.bloomB, roughness: 0.82, metalness: 0.03 }));
  const pillarMat = trackMat(
    new THREE.MeshStandardMaterial({ color: v.pillarColor, roughness: 0.86, metalness: 0.03, map: grain })
  );
  const trunkMat = trackMat(new THREE.MeshStandardMaterial({ color: '#785A43', roughness: 0.9, metalness: 0.02 }));
  const bulbMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: v.lampGlowHex,
      emissive: new THREE.Color(v.lampGlowHex),
      emissiveIntensity: 0.72,
      roughness: 0.3,
    })
  );
  const inkMat = trackMat(
    new THREE.LineBasicMaterial({ color: v.inkColor, transparent: true, opacity: 0.72 })
  );

  // 1. Broad Lawn Ground & Courtyard Terraces (keep subtle shadow receiving only here)
  const lawnGeom = trackGeom(new THREE.CylinderGeometry(9.6, 9.8, 0.08, 36));
  const lawnMesh = new THREE.Mesh(lawnGeom, lawnMat);
  lawnMesh.position.y = -0.095;
  lawnMesh.receiveShadow = true;
  group.add(lawnMesh);

  const apronGeom = trackGeom(new THREE.CylinderGeometry(4.12, 4.2, 0.055, 36));
  const apronMesh = new THREE.Mesh(apronGeom, courtyardMat);
  apronMesh.position.y = -0.048;
  apronMesh.receiveShadow = true;
  group.add(apronMesh, new THREE.LineSegments(trackGeom(new THREE.EdgesGeometry(apronGeom, 24)), inkMat));
  group.children[group.children.length - 1].position.y = -0.048;

  const ringGeom = trackGeom(new THREE.CylinderGeometry(3.92, 3.92, 0.02, 36));
  const ringMesh = new THREE.Mesh(ringGeom, pathMat);
  ringMesh.position.y = -0.02;
  ringMesh.receiveShadow = true;
  const ringEdge = new THREE.LineSegments(trackGeom(new THREE.EdgesGeometry(ringGeom, 24)), inkMat);
  ringEdge.position.y = -0.02;
  group.add(ringMesh, ringEdge);

  // 2. Stepped Entrance Walkway (+Z)
  const runnerGeom = trackGeom(new THREE.BoxGeometry(2.05, 0.04, 5.2));
  const runnerMesh = new THREE.Mesh(runnerGeom, pathMat);
  runnerMesh.position.set(0, -0.042, 6.35);
  runnerMesh.receiveShadow = true;
  const runnerEdge = new THREE.LineSegments(trackGeom(new THREE.EdgesGeometry(runnerGeom, 24)), inkMat);
  runnerEdge.position.copy(runnerMesh.position);
  group.add(runnerMesh, runnerEdge);

  const paverGeom = trackGeom(new THREE.BoxGeometry(1.52, 0.032, 0.52));
  const paverEdgeGeom = trackGeom(new THREE.EdgesGeometry(paverGeom, 24));
  const paverTransforms = Array.from({ length: 6 }, (_, i) => ({
    pos: [0, -0.018, 4.35 + i * 0.8] as [number, number, number],
  }));
  const paverInst = buildInstanced(paverGeom, courtyardMat, paverTransforms);
  if (paverInst) group.add(paverInst);
  paverTransforms.forEach((pt) => {
    const edge = new THREE.LineSegments(paverEdgeGeom, inkMat);
    edge.position.set(pt.pos[0], pt.pos[1], pt.pos[2]);
    group.add(edge);
  });

  // Collect instanced transforms across flower pots, blooms, lanterns & trees
  const potBodyTransforms: { pos: [number, number, number]; scale: [number, number, number] }[] = [];
  const potRimTransforms: { pos: [number, number, number]; scale: [number, number, number] }[] = [];
  const potMoundTransforms: { pos: [number, number, number]; scale: [number, number, number] }[] = [];
  const bloomATransforms: { pos: [number, number, number]; scale: [number, number, number] }[] = [];
  const bloomBTransforms: { pos: [number, number, number]; scale: [number, number, number] }[] = [];

  const lanternBaseTransforms: { pos: [number, number, number]; scale: [number, number, number] }[] = [];
  const lanternPostTransforms: { pos: [number, number, number]; scale: [number, number, number] }[] = [];
  const lanternBulbTransforms: { pos: [number, number, number]; scale: [number, number, number] }[] = [];
  const lanternCapTransforms: { pos: [number, number, number]; scale: [number, number, number]; rotY: number }[] = [];

  const addFlowerPotAt = (x: number, y: number, z: number, scale = 1, altBloom = false) => {
    potBodyTransforms.push({ pos: [x, y + 0.16 * scale, z], scale: [scale, scale, scale] });
    potRimTransforms.push({ pos: [x, y + 0.34 * scale, z], scale: [scale, scale, scale] });
    potMoundTransforms.push({
      pos: [x, y + 0.44 * scale, z],
      scale: [scale * 1.05, scale * 0.72, scale * 1.05],
    });
    const topTarget = altBloom ? bloomBTransforms : bloomATransforms;
    topTarget.push({
      pos: [x, y + 0.59 * scale, z],
      scale: [scale * 1.12, scale * 1.12, scale * 1.12],
    });
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      const target = k % 2 === 0 ? bloomATransforms : bloomBTransforms;
      target.push({
        pos: [
          x + Math.cos(a) * 0.17 * scale,
          y + (0.48 + (k % 2) * 0.04) * scale,
          z + Math.sin(a) * 0.17 * scale,
        ],
        scale: [scale * 0.85, scale * 0.85, scale * 0.85],
      });
    }
  };

  const addLanternAt = (x: number, y: number, z: number, height = 0.5) => {
    lanternBaseTransforms.push({ pos: [x, y + 0.04, z], scale: [1, 1, 1] });
    lanternPostTransforms.push({ pos: [x, y + 0.08 + height * 0.5, z], scale: [1, height, 1] });
    lanternBulbTransforms.push({ pos: [x, y + 0.14 + height, z], scale: [1, 1, 1] });
    lanternCapTransforms.push({ pos: [x, y + 0.26 + height, z], scale: [1, 1, 1], rotY: Math.PI / 4 });
  };

  // 3. Entrance Walkway Pots & Bollard Lanterns
  const walkwayZ =
    garden.potDensity === 'minimal'
      ? [4.45, 5.95]
      : garden.potDensity === 'lush'
      ? [4.1, 4.95, 5.8, 6.75, 7.6]
      : [4.3, 5.25, 6.85, 7.7];
  walkwayZ.forEach((z, idx) => {
    const s = idx % 2 === 0 ? 0.92 : 0.78;
    addFlowerPotAt(-1.35, -0.02, z, s, idx % 2 === 1);
    addFlowerPotAt(1.35, -0.02, z, s, idx % 2 === 0);
    if (idx % 2 === 0) {
      addLanternAt(-1.72, -0.02, z + 0.3, 0.45);
      addLanternAt(1.72, -0.02, z + 0.3, 0.45);
    }
  });

  // 4. Optional Floral Garden Entrance Archway (at z = 6.2)
  if (garden.hasEntranceArch) {
    const plinthGeom = trackGeom(new THREE.BoxGeometry(0.46, 0.26, 0.46));
    const colGeom = trackGeom(new THREE.BoxGeometry(0.28, 2.55, 0.28));
    const beamGeom = trackGeom(new THREE.BoxGeometry(3.55, 0.24, 0.34));
    const crownGeom = trackGeom(
      garden.style === 'kyoto_sakura_garden'
        ? new THREE.BoxGeometry(4.05, 0.16, 0.44)
        : new THREE.BoxGeometry(2.6, 0.16, 0.3)
    );

    const colEdgeGeom = trackGeom(new THREE.EdgesGeometry(colGeom, 24));
    const beamEdgeGeom = trackGeom(new THREE.EdgesGeometry(beamGeom, 24));

    [-1.52, 1.52].forEach((px) => {
      const pl = new THREE.Mesh(plinthGeom, pillarMat);
      pl.position.set(px, 0.11, 6.2);
      const col = new THREE.Mesh(colGeom, pillarMat);
      col.position.set(px, 0.24 + 2.55 * 0.5, 6.2);
      col.castShadow = true;
      const colEdge = new THREE.LineSegments(colEdgeGeom, inkMat);
      colEdge.position.copy(col.position);
      group.add(pl, col, colEdge);
    });

    const beam = new THREE.Mesh(beamGeom, pillarMat);
    beam.position.set(0, 2.86, 6.2);
    beam.castShadow = true;
    const beamEdge = new THREE.LineSegments(beamEdgeGeom, inkMat);
    beamEdge.position.copy(beam.position);
    const crown = new THREE.Mesh(
      crownGeom,
      garden.style === 'kyoto_sakura_garden' ? pillarMat : pathMat
    );
    crown.position.set(0, garden.style === 'kyoto_sakura_garden' ? 3.14 : 3.06, 6.2);
    group.add(beam, beamEdge, crown);

    for (let i = 0; i <= 14; i++) {
      const u = i / 14;
      const gx = -1.45 + u * 2.9;
      const gy = 2.73 - Math.sin(u * Math.PI) * 0.28;
      const s = i % 2 === 0 ? 1.25 : 0.95;
      const target = i % 2 === 0 ? bloomATransforms : bloomBTransforms;
      target.push({ pos: [gx, gy, 6.42], scale: [s, s, s] });
    }

    addFlowerPotAt(-1.95, -0.02, 6.2, 1.05, false);
    addFlowerPotAt(1.95, -0.02, 6.2, 1.05, true);
  }

  // 5. 360-degree Side & Perimeter Flower Pots / Lanterns (radius >= 4.48, zero collision with spinning stage)
  const potAnglesDeg =
    garden.potDensity === 'minimal'
      ? [-95, -55, 55, 95, 145, -145]
      : garden.potDensity === 'lush'
      ? [-158, -135, -110, -88, -66, -44, 44, 66, 88, 110, 135, 158, 178]
      : [-150, -120, -90, -60, 60, 90, 120, 150, 180];

  potAnglesDeg.forEach((deg, idx) => {
    const rad = (deg * Math.PI) / 180;
    const dist = 4.48 + (idx % 2) * 0.32;
    addFlowerPotAt(
      Math.sin(rad) * dist,
      -0.02,
      Math.cos(rad) * dist,
      0.95 + (idx % 3) * 0.12,
      idx % 2 === 1
    );
    if (densityMultiplier >= 1 && idx % 2 === 0) {
      const lDist = dist + 0.55;
      addLanternAt(Math.sin(rad + 0.1) * lDist, -0.02, Math.cos(rad + 0.1) * lDist, 0.55);
    }
  });

  // Low perimeter flowering shrubs (instanced foliage domes + blooms)
  const shrubAngles = [-142, -102, -72, 72, 102, 142, 180];
  const shrubTransforms = shrubAngles.map((deg) => {
    const rad = (deg * Math.PI) / 180;
    const dist = 4.95;
    return {
      pos: [Math.sin(rad) * dist, 0.2, Math.cos(rad) * dist] as [number, number, number],
      scale: [1.35, 0.72, 0.95] as [number, number, number],
      rotY: rad,
    };
  });
  shrubAngles.forEach((deg, idx) => {
    const rad = (deg * Math.PI) / 180;
    const dist = 4.95;
    for (let b = -1; b <= 1; b++) {
      const target = (idx + b) % 2 === 0 ? bloomATransforms : bloomBTransforms;
      target.push({
        pos: [
          Math.sin(rad + b * 0.04) * (dist - 0.18),
          0.38 + (b === 0 ? 0.08 : 0),
          Math.cos(rad + b * 0.04) * (dist - 0.18),
        ],
        scale: [0.85, 0.85, 0.85],
      });
    }
  });

  const shrubGeom = trackGeom(new THREE.SphereGeometry(0.44, 10, 8));
  const shrubInst = buildInstanced(shrubGeom, foliageMat, shrubTransforms);
  if (shrubInst) group.add(shrubInst);

  // Framing Estate Trees cleanly outside courtyard (instanced)
  const treeAngles =
    garden.potDensity === 'minimal' ? [-132, -82, 82, 132] : [-156, -124, -84, 84, 124, 156];
  const treePlanterTransforms: { pos: [number, number, number]; scale: [number, number, number] }[] = [];
  const treeTrunkTransforms: { pos: [number, number, number]; scale: [number, number, number] }[] = [];
  const treeCanopyA: { pos: [number, number, number]; scale: [number, number, number]; rotY?: number; rotZ?: number }[] = [];
  const treeCanopyB: { pos: [number, number, number]; scale: [number, number, number] }[] = [];

  treeAngles.forEach((deg, idx) => {
    const rad = (deg * Math.PI) / 180;
    const dist = 5.65 + (idx % 2) * 0.45;
    const scale = 0.95 + (idx % 2) * 0.22;
    const tx = Math.sin(rad) * dist;
    const tz = Math.cos(rad) * dist;
    const ty = -0.02;

    treePlanterTransforms.push({ pos: [tx, ty + 0.14 * scale, tz], scale: [scale, scale, scale] });
    treeTrunkTransforms.push({ pos: [tx, ty + 0.65 * scale, tz], scale: [scale, scale, scale] });

    if (v.treeKind === 'cypress') {
      treeCanopyA.push({ pos: [tx, ty + 1.48 * scale, tz], scale: [scale, scale, scale] });
    } else if (v.treeKind === 'sakura') {
      treeCanopyA.push({
        pos: [tx, ty + 1.36 * scale, tz],
        scale: [scale * 1.15, scale * 0.75, scale * 1.15],
      });
      treeCanopyB.push({
        pos: [tx + 0.25 * scale, ty + 1.26 * scale, tz - 0.1 * scale],
        scale: [scale * 0.86, scale * 0.56, scale * 0.86],
      });
    } else if (v.treeKind === 'palm') {
      for (let f = 0; f < 6; f++) {
        const ang = (f / 6) * Math.PI * 2;
        treeCanopyA.push({
          pos: [tx + Math.cos(ang) * 0.3 * scale, ty + 1.14 * scale, tz + Math.sin(ang) * 0.3 * scale],
          scale: [scale, scale, scale],
          rotY: -ang,
          rotZ: -0.28,
        });
      }
    } else {
      treeCanopyA.push({ pos: [tx, ty + 1.18 * scale, tz], scale: [scale, scale, scale] });
      treeCanopyB.push({ pos: [tx, ty + 1.62 * scale, tz], scale: [scale * 0.64, scale * 0.64, scale * 0.64] });
      bloomATransforms.push({ pos: [tx, ty + 1.88 * scale, tz], scale: [scale * 0.9, scale * 0.9, scale * 0.9] });
    }
  });

  // Flush all InstancedMeshes
  const potBodyGeom = trackGeom(new THREE.CylinderGeometry(0.21, 0.14, 0.32, 10));
  const potRimGeom = trackGeom(new THREE.CylinderGeometry(0.24, 0.22, 0.07, 10));
  const potMoundGeom = trackGeom(new THREE.SphereGeometry(0.23, 10, 8));
  const bloomGeom = trackGeom(new THREE.SphereGeometry(0.098, 8, 6));

  [
    buildInstanced(potBodyGeom, potMat, potBodyTransforms),
    buildInstanced(potRimGeom, potMat, potRimTransforms),
    buildInstanced(potMoundGeom, foliageMat, potMoundTransforms),
    buildInstanced(bloomGeom, bloomAMat, bloomATransforms),
    buildInstanced(bloomGeom, bloomBMat, bloomBTransforms),
    buildInstanced(trackGeom(new THREE.BoxGeometry(0.18, 0.08, 0.18)), pillarMat, lanternBaseTransforms),
    buildInstanced(trackGeom(new THREE.BoxGeometry(0.1, 1, 0.1)), pillarMat, lanternPostTransforms),
    buildInstanced(trackGeom(new THREE.BoxGeometry(0.14, 0.15, 0.14)), bulbMat, lanternBulbTransforms),
    buildInstanced(trackGeom(new THREE.CylinderGeometry(0.02, 0.17, 0.1, 4)), pillarMat, lanternCapTransforms),
    buildInstanced(trackGeom(new THREE.CylinderGeometry(0.32, 0.25, 0.28, 10)), potMat, treePlanterTransforms),
    buildInstanced(trackGeom(new THREE.CylinderGeometry(0.06, 0.09, 0.9, 8)), trunkMat, treeTrunkTransforms),
  ].forEach((mesh) => {
    if (mesh) group.add(mesh);
  });

  if (v.treeKind === 'cypress') {
    const cypressGeom = trackGeom(new THREE.CylinderGeometry(0.04, 0.34, 1.35, 10));
    const m = buildInstanced(cypressGeom, foliageMat, treeCanopyA);
    if (m) group.add(m);
  } else if (v.treeKind === 'sakura') {
    const sGeom = trackGeom(new THREE.SphereGeometry(0.45, 10, 8));
    const mA = buildInstanced(sGeom, bloomAMat, treeCanopyA);
    const mB = buildInstanced(sGeom, bloomBMat, treeCanopyB);
    if (mA) group.add(mA);
    if (mB) group.add(mB);
  } else if (v.treeKind === 'palm') {
    const frondGeom = trackGeom(new THREE.BoxGeometry(0.65, 0.045, 0.16));
    const m = buildInstanced(frondGeom, foliageMat, treeCanopyA);
    if (m) group.add(m);
  } else {
    const topiGeom = trackGeom(new THREE.SphereGeometry(0.38, 10, 8));
    const mA = buildInstanced(topiGeom, foliageMat, treeCanopyA);
    const mB = buildInstanced(topiGeom, foliageMat, treeCanopyB);
    if (mA) group.add(mA);
    if (mB) group.add(mB);
  }

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };

  return { group, dispose };
}
