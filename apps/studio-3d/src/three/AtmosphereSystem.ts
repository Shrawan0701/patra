import * as THREE from 'three';
import {
  AtmosphereConfig,
  AtmosphereParticleId,
  TIME_OF_DAY_OPTIONS,
  TimeOfDayPreset,
} from '@patra/shared';

interface ParticleAgent {
  mesh: THREE.Mesh;
  baseX: number;
  baseZ: number;
  speedY: number;
  phase: number;
  rotSpeedX: number;
  rotSpeedZ: number;
  riseMode: boolean;
}

function createSkyGradientTexture(preset: TimeOfDayPreset): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, preset.skyTop);
  grad.addColorStop(0.58, preset.skyBottom);
  grad.addColorStop(1, preset.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 256);

  if (preset.id === 'starlit_midnight' || preset.id === 'candlelit_twilight') {
    ctx.fillStyle = 'rgba(255, 248, 220, 0.72)';
    for (let i = 0; i < 36; i++) {
      const sx = (Math.sin(i * 19.3) * 0.5 + 0.5) * 62;
      const sy = (Math.cos(i * 31.7) * 0.5 + 0.5) * 140;
      ctx.fillRect(sx, sy, 1.4, 1.4);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class AtmosphereSystem {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private ambient: THREE.AmbientLight;
  private hemi: THREE.HemisphereLight;
  private key: THREE.DirectionalLight;
  private fill: THREE.DirectionalLight;
  private warmLamp: THREE.PointLight;
  private skyDome: THREE.Mesh;
  private skyTex: THREE.CanvasTexture | null = null;

  private particleGroup: THREE.Group;
  private agents: ParticleAgent[] = [];
  private activeParticleKey = '';
  private currentTime = 0;

  constructor(
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    ambient: THREE.AmbientLight,
    hemi: THREE.HemisphereLight,
    key: THREE.DirectionalLight,
    fill: THREE.DirectionalLight
  ) {
    this.scene = scene;
    this.renderer = renderer;
    this.ambient = ambient;
    this.hemi = hemi;
    this.key = key;
    this.fill = fill;

    this.warmLamp = new THREE.PointLight('#ffba52', 0, 12, 1.4);
    this.warmLamp.position.set(0, 2.3, 0.6);
    this.scene.add(this.warmLamp);

    const skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, depthWrite: false });
    this.skyDome = new THREE.Mesh(new THREE.SphereGeometry(42, 24, 16), skyMat);
    this.scene.add(this.skyDome);

    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);
  }

  public apply(atmosphere: AtmosphereConfig | undefined, fallbackBackdropHex: string) {
    const cfg: AtmosphereConfig = atmosphere ?? {
      timeOfDay: 'morning_sun',
      particles: 'none',
      particleDensity: 'lush',
      lampGlow: 0.65,
      cameraMotion: 'gentle_orbit',
    };

    const preset =
      TIME_OF_DAY_OPTIONS.find((t) => t.id === cfg.timeOfDay) ?? TIME_OF_DAY_OPTIONS[0];

    // If default morning mode is active, blend gently with room palette backdrop
    const isDefaultMorning = cfg.timeOfDay === 'morning_sun';
    const effectivePreset: TimeOfDayPreset = isDefaultMorning
      ? { ...preset, skyTop: fallbackBackdropHex, skyBottom: fallbackBackdropHex }
      : preset;

    this.scene.background = new THREE.Color(effectivePreset.skyBottom);
    this.ambient.color.set(effectivePreset.ambientHex);
    this.ambient.intensity = effectivePreset.ambientIntensity;
    this.hemi.color.set(effectivePreset.hemiSkyHex);
    this.hemi.groundColor.set(effectivePreset.hemiGroundHex);
    this.hemi.intensity = effectivePreset.hemiIntensity;
    this.key.color.set(effectivePreset.keyHex);
    this.key.intensity = effectivePreset.keyIntensity;
    this.key.position.set(...effectivePreset.keyPosition);
    this.fill.color.set(effectivePreset.fillHex);
    this.fill.intensity = effectivePreset.fillIntensity;
    this.renderer.toneMappingExposure = effectivePreset.exposure;

    const lampFactor = Math.max(0, Math.min(1, cfg.lampGlow ?? 0.65));
    const darkBoost = isDefaultMorning ? 0.35 : cfg.timeOfDay === 'golden_hour' ? 1.15 : 2.35;
    this.warmLamp.color.set(effectivePreset.warmLampHex);
    this.warmLamp.intensity = lampFactor * darkBoost;

    this.skyTex?.dispose();
    this.skyTex = createSkyGradientTexture(effectivePreset);
    const skyMat = this.skyDome.material as THREE.MeshBasicMaterial;
    skyMat.map = this.skyTex;
    skyMat.needsUpdate = true;

    const key = `${cfg.particles}:${cfg.particleDensity}`;
    if (key !== this.activeParticleKey) {
      this.activeParticleKey = key;
      this.rebuildParticles(cfg.particles, cfg.particleDensity);
    }
  }

  private rebuildParticles(type: AtmosphereParticleId, density: AtmosphereConfig['particleDensity']) {
    while (this.particleGroup.children.length > 0) {
      this.particleGroup.remove(this.particleGroup.children[0]);
    }
    this.agents = [];
    if (type === 'none') return;

    const count = density === 'festive' ? 110 : density === 'lush' ? 68 : 34;
    const riseMode = type === 'golden_fireflies';

    let palette: string[] = ['#F59E0B', '#FBBF24', '#F97316'];
    if (type === 'rose_petals') palette = ['#E11D48', '#FB7185', '#BE123C'];
    else if (type === 'sakura_blossoms') palette = ['#F9A8D4', '#F472B6', '#FCE7F3'];
    else if (type === 'golden_fireflies') palette = ['#FDE68A', '#FBBF24', '#F59E0B'];
    else if (type === 'champagne_sparkles') palette = ['#FDE047', '#FACC15', '#FFFBEB'];
    else if (type === 'soft_snow') palette = ['#FFFFFF', '#E0F2FE', '#BAE6FD'];

    const petalShape = new THREE.Shape();
    petalShape.moveTo(0, 0);
    petalShape.quadraticCurveTo(0.055, 0.04, 0.04, 0.11);
    petalShape.quadraticCurveTo(0, 0.14, -0.04, 0.11);
    petalShape.quadraticCurveTo(-0.055, 0.04, 0, 0);
    const petalGeom = new THREE.ShapeGeometry(petalShape);
    const orbGeom = new THREE.SphereGeometry(0.036, 8, 8);
    const flakeGeom = new THREE.OctahedronGeometry(0.038, 0);

    for (let i = 0; i < count; i++) {
      const hex = palette[i % palette.length];
      const mat =
        type === 'golden_fireflies'
          ? new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.9 })
          : new THREE.MeshStandardMaterial({
              color: hex,
              roughness: type === 'champagne_sparkles' ? 0.22 : 0.45,
              metalness: type === 'champagne_sparkles' ? 0.7 : 0.05,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.92,
            });

      const geom =
        type === 'golden_fireflies'
          ? orbGeom
          : type === 'soft_snow' || type === 'champagne_sparkles'
            ? flakeGeom
            : petalGeom;

      const mesh = new THREE.Mesh(geom, mat);
      const bx = (Math.random() - 0.5) * 7.2;
      const bz = (Math.random() - 0.5) * 7.2;
      mesh.position.set(bx, Math.random() * 4.6 + 0.15, bz);
      const s = 0.75 + Math.random() * 0.75;
      mesh.scale.setScalar(s);
      this.particleGroup.add(mesh);

      this.agents.push({
        mesh,
        baseX: bx,
        baseZ: bz,
        speedY: (riseMode ? 0.25 : 0.52) + Math.random() * 0.48,
        phase: Math.random() * Math.PI * 2,
        rotSpeedX: (Math.random() - 0.5) * 2.2,
        rotSpeedZ: (Math.random() - 0.5) * 2.4,
        riseMode,
      });
    }
  }

  public update(dt: number) {
    this.currentTime += dt;
    if (this.warmLamp.intensity > 0.1) {
      this.warmLamp.intensity += Math.sin(this.currentTime * 6.5) * 0.025;
    }

    for (const a of this.agents) {
      if (a.riseMode) {
        a.mesh.position.y += a.speedY * dt;
        if (a.mesh.position.y > 4.6) a.mesh.position.y = 0.15;
      } else {
        a.mesh.position.y -= a.speedY * dt;
        if (a.mesh.position.y < 0.05) a.mesh.position.y = 4.65;
      }
      a.mesh.position.x = a.baseX + Math.sin(this.currentTime * 1.4 + a.phase) * 0.35;
      a.mesh.position.z = a.baseZ + Math.cos(this.currentTime * 1.15 + a.phase) * 0.32;
      a.mesh.rotation.x += a.rotSpeedX * dt;
      a.mesh.rotation.z += a.rotSpeedZ * dt;
    }
  }

  public dispose() {
    this.skyTex?.dispose();
  }
}
