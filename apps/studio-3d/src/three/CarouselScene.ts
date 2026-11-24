import * as THREE from 'three';
import {
  AspectRatio,
  DEFAULT_WAX_SEAL,
  ProjectConfig,
  RoomConfig,
  StructureId,
  getDefaultGardenForProject,
  getPaletteById,
} from '@patra/shared';
import { createCustomTextTexture, createFloorTexture, createSignageTexture } from './PaperTextures';
import {
  buildCenterpiece,
  buildGarland,
  buildSideProp,
  buildWallDecor,
  createCraftFactory,
} from './PropBuilders';
import { WaxEnvelopeRig, buildWaxEnvelopeRig } from './WaxEnvelopeBuilder';
import { BuiltGardenEnvironment, buildGardenEnvironment } from './GardenEnvironmentBuilder';
import { buildPhotoCutoutProp } from './PaperCutoutBuilder';
import { AtmosphereSystem } from './AtmosphereSystem';

interface RoomHandle {
  quadrantRoot: THREE.Group;
  floorPivot: THREE.Group;
  popGroup: THREE.Group;
  wallRight: THREE.Group;
  wallLeft: THREE.Group;
  extraPivot: THREE.Group;
  basePopPos: THREE.Vector3;
}

interface DragTextState {
  mesh: THREE.Mesh;
  wallRight: THREE.Group;
  roomIndex: number;
  id: string;
  nx: number;
  ny: number;
}

interface CutoutDragTarget {
  root: THREE.Group;
  hitMesh: THREE.Mesh;
  roomIndex: number;
  slot: 1 | 2;
  placement: 'floor_standee' | 'wall_frame' | 'floating_easel';
  popGroup: THREE.Group;
  wallRight: THREE.Group;
  offsetX: number;
  offsetZ: number;
}

const ROOM_SIZE = 2.65;
const WALL_HEIGHT = 2.65;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class CarouselScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private bookRoot: THREE.Group;
  private roomHandles: RoomHandle[] = [];
  private sparklePoints: THREE.Points | null = null;
  private ambientLight: THREE.AmbientLight;
  private hemiLight: THREE.HemisphereLight;
  private keyLight: THREE.DirectionalLight;
  private fillLight: THREE.DirectionalLight;
  private atmosphereSystem: AtmosphereSystem;
  private viewMode: 'stage' | 'wax_envelope' | 'garden_entrance' = 'stage';
  private gardenBuilt: BuiltGardenEnvironment | null = null;
  private lastGardenKey = '';
  private waxRig: WaxEnvelopeRig | null = null;
  private waxAnimActive = false;
  private waxAnimStart = 0;
  private waxAnimDurationMs = 3100;

  private project: ProjectConfig;
  private activeRoomIndex = 0;
  private currentYaw = -Math.PI / 4;
  private targetYaw = -Math.PI / 4;
  private dragOffsetYaw = 0;
  private dragPitch = 0.56;

  private foldProgress = 1;
  private targetFoldProgress = 1;
  private popProgress = 1;

  // Cinematic camera rig state (active during Preview or Export)
  private cinematicActive = false;
  private cinematicZoomFactor = 0;
  private cinematicYawBias = 0;
  private cinematicCamPos = new THREE.Vector3(0, 6.3, 9.0);
  private cinematicLookTarget = new THREE.Vector3(0, 1.0, 0);
  private cinematicStartTime = 0;
  private cinematicTimeline: {
    gardenIntroMs: number;
    waxIntroMs: number;
    segments: { index: number; startMs: number; endMs: number; durMs: number }[];
    totalMs: number;
  } | null = null;
  private cinematicOnProgress?: (pct: number, elapsedSec: number, totalSec: number) => void;
  private cinematicOnDone?: () => void;
  private cinematicLastProgressEmit = 0;
  private cinematicLastPct = -1;
  private cinematicLastSec = -1;
  private cinematicIsExport = false;

  private isDragging = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private customTextMeshes: THREE.Mesh[] = [];
  private photoCutoutTargets: CutoutDragTarget[] = [];
  private raycaster = new THREE.Raycaster();
  private draggingText: DragTextState | null = null;
  private draggingCutout: CutoutDragTarget | null = null;
  private onCustomTextMoved?: (roomIndex: number, id: string, x: number, y: number) => void;
  private onPhotoCutoutMoved?: (roomIndex: number, slot: 1 | 2, offsetX: number, offsetZ: number) => void;
  private userZoomDistance = 10.6;
  private targetZoomDistance = 10.6;
  private focusSlot: 0 | 1 | 2 = 0;
  private currentCamPos = new THREE.Vector3(0, 5.4, 8.6);
  private currentLookAt = new THREE.Vector3(0, 1.0, 0);
  private rafId = 0;
  private clock = new THREE.Clock();

  constructor(container: HTMLElement, initialProject: ProjectConfig) {
    this.container = container;
    this.project = initialProject;

    this.scene = new THREE.Scene();
    const firstPal = getPaletteById(initialProject.rooms[0]?.paletteId ?? 'royal_vermilion');
    this.scene.background = new THREE.Color(firstPal.backdropColor);

    const w = container.clientWidth || 400;
    const h = container.clientHeight || 600;
    this.camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 100);
    this.camera.position.set(0, 5.4, 8.6);
    this.camera.lookAt(0, 1.0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.22;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    const ambient = new THREE.AmbientLight('#fffcf7', 0.88);
    this.scene.add(ambient);
    this.ambientLight = ambient;

    const hemi = new THREE.HemisphereLight('#ffffff', '#efe2d2', 1.45);
    this.scene.add(hemi);
    this.hemiLight = hemi;

    const key = new THREE.DirectionalLight('#fffaf0', 1.15);
    key.position.set(6, 11, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 25;
    key.shadow.camera.left = -6;
    key.shadow.camera.right = 6;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -6;
    this.scene.add(key);
    this.keyLight = key;

    const fill = new THREE.DirectionalLight('#fff4eb', 0.65);
    fill.position.set(-6, 6, -4);
    this.scene.add(fill);
    this.fillLight = fill;

    this.atmosphereSystem = new AtmosphereSystem(
      this.scene,
      this.renderer,
      this.ambientLight,
      this.hemiLight,
      this.keyLight,
      this.fillLight
    );

    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 34),
      new THREE.ShadowMaterial({ opacity: 0.08 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.14;
    shadowPlane.receiveShadow = true;
    this.scene.add(shadowPlane);

    this.bookRoot = new THREE.Group();
    this.scene.add(this.bookRoot);

    this.addAmbientSparkles();
    this.setActiveRoom(0);
    this.currentYaw = this.targetYaw;
    this.rebuildBook();
    this.rebuildGarden(true);
    this.rebuildWaxEnvelope();
    this.bindEvents();
    this.animate();
  }

  private getGardenIntroDurationMs(): number {
    const garden = getDefaultGardenForProject(this.project);
    if (!garden.enabled) return 0;
    const secs = Math.max(0, Math.min(8, garden.entranceDurationSeconds ?? 3));
    return secs * 1000;
  }

  private getWaxIntroDurationMs(): number {
    if (!this.project.waxSeal?.enabled) return 0;
    if (typeof this.project.waxSeal.durationSeconds === 'number') {
      return Math.max(2000, Math.min(8000, this.project.waxSeal.durationSeconds * 1000));
    }
    const speed = this.project.waxSeal.openSpeed ?? 'normal';
    if (speed === 'slow') return 5000;
    if (speed === 'brisk') return 3000;
    return 4000;
  }

  private rebuildGarden(force = false) {
    const garden = getDefaultGardenForProject(this.project);
    const nextKey = JSON.stringify(garden);
    if (!force && nextKey === this.lastGardenKey && this.gardenBuilt) {
      return;
    }
    this.lastGardenKey = nextKey;

    if (this.gardenBuilt) {
      this.scene.remove(this.gardenBuilt.group);
      this.gardenBuilt.dispose();
      this.gardenBuilt = null;
    }
    this.gardenBuilt = buildGardenEnvironment(garden);
    this.gardenBuilt.group.visible = garden.enabled;
    this.scene.add(this.gardenBuilt.group);
  }

  private rebuildWaxEnvelope() {
    if (this.waxRig) {
      this.scene.remove(this.waxRig.root);
      this.waxRig.dispose();
      this.waxRig = null;
    }
    const cfg = this.project.waxSeal ?? DEFAULT_WAX_SEAL;
    this.waxRig = buildWaxEnvelopeRig(cfg);
    this.waxRig.root.visible = this.viewMode === 'wax_envelope';
    this.bookRoot.visible = this.viewMode !== 'wax_envelope';
    if (this.viewMode === 'wax_envelope' && !this.waxAnimActive) {
      this.waxRig.setOpenProgress(0);
    }
    this.scene.add(this.waxRig.root);
  }

  public setViewMode(mode: 'stage' | 'wax_envelope' | 'garden_entrance') {
    this.viewMode = mode;
    this.waxAnimActive = false;
    if (!this.waxRig) this.rebuildWaxEnvelope();
    if (this.waxRig) {
      this.waxRig.root.visible = mode === 'wax_envelope';
      if (mode === 'wax_envelope') this.waxRig.setOpenProgress(0);
    }
    this.bookRoot.visible = mode !== 'wax_envelope';
  }

  public playWaxOpening() {
    this.setViewMode('wax_envelope');
    this.waxAnimDurationMs = Math.max(2200, this.getWaxIntroDurationMs() || 3000);
    this.waxAnimStart = performance.now();
    this.waxAnimActive = true;
  }

  private addAmbientSparkles() {
    const count = 48;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6.5;
      positions[i * 3 + 1] = Math.random() * 3.8 + 0.3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6.5;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: '#E7B04C',
      size: 0.065,
      transparent: true,
      opacity: 0.55,
    });
    this.sparklePoints = new THREE.Points(geom, mat);
    this.scene.add(this.sparklePoints);
  }

  public setOnCustomTextMoved(cb: (roomIndex: number, id: string, x: number, y: number) => void) {
    this.onCustomTextMoved = cb;
  }

  public setOnPhotoCutoutMoved(
    cb: (roomIndex: number, slot: 1 | 2, offsetX: number, offsetZ: number) => void
  ) {
    this.onPhotoCutoutMoved = cb;
  }

  public setCameraZoom(deltaOrDistance: number) {
    this.focusSlot = 0;
    if (Math.abs(deltaOrDistance) <= 3.5) {
      this.targetZoomDistance = Math.max(4.4, Math.min(13.8, this.targetZoomDistance + deltaOrDistance));
    } else {
      this.targetZoomDistance = Math.max(4.4, Math.min(13.8, deltaOrDistance));
    }
  }

  public focusPhoto(slot: 0 | 1 | 2) {
    this.focusSlot = slot;
    if (slot === 0) {
      this.targetZoomDistance = 10.6;
    } else {
      this.setViewMode('stage');
      this.targetZoomDistance = 5.2;
    }
  }

  private getNormalizedPointer(e: PointerEvent): THREE.Vector2 {
    const rect = this.renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(
      ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1,
      -((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1
    );
  }

  private bindEvents() {
    const dom = this.renderer.domElement;
    dom.style.touchAction = 'none';

    const onDown = (e: PointerEvent) => {
      if (this.cinematicActive) return;

      const activeTexts = this.customTextMeshes.filter(
        (m) => m.userData.roomIndex === this.activeRoomIndex
      );
      if (activeTexts.length > 0) {
        this.raycaster.setFromCamera(this.getNormalizedPointer(e), this.camera);
        const hits = this.raycaster.intersectObjects(activeTexts, false);
        if (hits.length > 0) {
          const hitMesh = hits[0].object as THREE.Mesh;
          const { customTextId, roomIndex, wallRight, nx, ny } = hitMesh.userData as {
            customTextId: string;
            roomIndex: number;
            wallRight: THREE.Group;
            nx: number;
            ny: number;
          };
          this.draggingText = { mesh: hitMesh, wallRight, roomIndex, id: customTextId, nx, ny };
          dom.style.cursor = 'grabbing';
          return;
        }
      }

      const activeCutouts = this.photoCutoutTargets.filter(
        (c) => c.roomIndex === this.activeRoomIndex
      );
      if (activeCutouts.length > 0 && this.viewMode === 'stage') {
        this.raycaster.setFromCamera(this.getNormalizedPointer(e), this.camera);
        const cHits = this.raycaster.intersectObjects(
          activeCutouts.map((c) => c.hitMesh),
          false
        );
        if (cHits.length > 0) {
          const hitMesh = cHits[0].object as THREE.Mesh;
          const target = activeCutouts.find((c) => c.hitMesh === hitMesh);
          if (target) {
            this.draggingCutout = target;
            dom.style.cursor = 'grabbing';
            return;
          }
        }
      }

      this.isDragging = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    };

    const onMove = (e: PointerEvent) => {
      if (this.cinematicActive) return;

      if (this.draggingText) {
        this.raycaster.setFromCamera(this.getNormalizedPointer(e), this.camera);
        this.draggingText.wallRight.updateMatrixWorld(true);
        const planeNormal = new THREE.Vector3(0, 0, 1).transformDirection(
          this.draggingText.wallRight.matrixWorld
        );
        const planePoint = new THREE.Vector3(0, 0, 0.072).applyMatrix4(
          this.draggingText.wallRight.matrixWorld
        );
        const wallPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, planePoint);
        const hitPoint = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(wallPlane, hitPoint)) {
          const local = this.draggingText.wallRight.worldToLocal(hitPoint.clone());
          const nx = Math.max(-1, Math.min(1, (local.x / ROOM_SIZE - 0.5) / 0.42));
          const ny = Math.max(-1, Math.min(1, (local.y / WALL_HEIGHT - 0.45) / 0.36));
          this.draggingText.nx = Number(nx.toFixed(3));
          this.draggingText.ny = Number(ny.toFixed(3));
          this.draggingText.mesh.position.set(
            ROOM_SIZE * (0.5 + nx * 0.42),
            WALL_HEIGHT * (0.45 + ny * 0.36),
            0.072
          );
          this.draggingText.mesh.userData.nx = this.draggingText.nx;
          this.draggingText.mesh.userData.ny = this.draggingText.ny;
        }
        return;
      }

      if (this.draggingCutout) {
        this.raycaster.setFromCamera(this.getNormalizedPointer(e), this.camera);
        if (this.draggingCutout.placement === 'wall_frame') {
          this.draggingCutout.wallRight.updateMatrixWorld(true);
          const planeNormal = new THREE.Vector3(0, 0, 1).transformDirection(
            this.draggingCutout.wallRight.matrixWorld
          );
          const planePoint = new THREE.Vector3(0, 0, 0.088).applyMatrix4(
            this.draggingCutout.wallRight.matrixWorld
          );
          const wallPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, planePoint);
          const hitPoint = new THREE.Vector3();
          if (this.raycaster.ray.intersectPlane(wallPlane, hitPoint)) {
            const local = this.draggingCutout.wallRight.worldToLocal(hitPoint.clone());
            const ox = Math.max(-1, Math.min(1, (local.x / ROOM_SIZE - 0.24) / 0.25));
            this.draggingCutout.offsetX = Number(ox.toFixed(2));
            this.draggingCutout.root.position.x = ROOM_SIZE * (0.24 + ox * 0.25);
          }
        } else {
          this.draggingCutout.popGroup.updateMatrixWorld(true);
          const planeNormal = new THREE.Vector3(0, 1, 0).transformDirection(
            this.draggingCutout.popGroup.matrixWorld
          );
          const planePoint = new THREE.Vector3(0, 0.35, 0).applyMatrix4(
            this.draggingCutout.popGroup.matrixWorld
          );
          const floorPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, planePoint);
          const hitPoint = new THREE.Vector3();
          if (this.raycaster.ray.intersectPlane(floorPlane, hitPoint)) {
            const local = this.draggingCutout.popGroup.worldToLocal(hitPoint.clone());
            const ox = Math.max(-1.15, Math.min(1.15, Number(local.x.toFixed(2))));
            const oz = Math.max(-0.65, Math.min(1.1, Number(local.z.toFixed(2))));
            this.draggingCutout.offsetX = ox;
            this.draggingCutout.offsetZ = oz;
            this.draggingCutout.root.position.set(ox, 0, oz);
          }
        }
        return;
      }

      if (!this.isDragging) return;
      const dx = e.clientX - this.lastPointerX;
      const dy = e.clientY - this.lastPointerY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      this.dragOffsetYaw += dx * 0.008;
      this.dragPitch = Math.max(0.24, Math.min(0.95, this.dragPitch + dy * 0.004));
    };

    const onUp = () => {
      if (this.draggingText) {
        const { roomIndex, id, nx, ny } = this.draggingText;
        this.draggingText = null;
        dom.style.cursor = '';
        this.onCustomTextMoved?.(roomIndex, id, nx, ny);
      }
      if (this.draggingCutout) {
        const { roomIndex, slot, offsetX, offsetZ } = this.draggingCutout;
        this.draggingCutout = null;
        dom.style.cursor = '';
        this.onPhotoCutoutMoved?.(roomIndex, slot, offsetX, offsetZ);
      }
      this.isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (this.cinematicActive) return;
      e.preventDefault();
      this.focusSlot = 0;
      this.targetZoomDistance = Math.max(
        4.4,
        Math.min(13.8, this.targetZoomDistance + e.deltaY * 0.008)
      );
    };

    dom.addEventListener('pointerdown', onDown);
    dom.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('resize', this.handleResize);
  }

  public handleResize = () => {
    const w = this.container.clientWidth || 400;
    const h = this.container.clientHeight || 600;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public setAspectRatio(ratio: AspectRatio) {
    this.project = { ...this.project, aspectRatio: ratio };
    this.handleResize();
  }

  private getCornersCount(): 2 | 3 | 4 {
    const raw = this.project.cornersCount ?? 4;
    return raw === 2 || raw === 3 || raw === 4 ? raw : 4;
  }

  private getStructureId(): StructureId {
    return this.project.structure ?? 'carousel_gable';
  }

  private getSectorAngle(): number {
    return (Math.PI * 2) / this.getCornersCount();
  }

  public updateProject(project: ProjectConfig, activeRoomIndex?: number) {
    const layoutChanged =
      project.structure !== this.project.structure || project.cornersCount !== this.project.cornersCount;
    const waxChanged = JSON.stringify(project.waxSeal) !== JSON.stringify(this.project.waxSeal);
    this.project = project;
    if (typeof activeRoomIndex === 'number') {
      this.setActiveRoom(activeRoomIndex);
    } else if (this.activeRoomIndex >= project.rooms.length) {
      this.setActiveRoom(0);
    } else {
      this.setActiveRoom(this.activeRoomIndex);
    }
    this.rebuildBook();
    this.rebuildGarden();
    if (waxChanged || !this.waxRig) {
      this.rebuildWaxEnvelope();
    }
    if (layoutChanged) {
      this.playEntranceUnfold();
    }
  }

  public setActiveRoom(index: number) {
    const safeIdx = Math.max(0, Math.min(this.project.rooms.length - 1, index));
    const changed = safeIdx !== this.activeRoomIndex;
    this.activeRoomIndex = safeIdx;
    const sectorAngle = this.getSectorAngle();
    this.targetYaw = -Math.PI / 2 - (safeIdx - 0.5) * sectorAngle;
    this.dragOffsetYaw = 0;
    if (changed) {
      this.popProgress = 0.15;
    }

    const activeRoom = this.project.rooms[safeIdx];
    const pal = getPaletteById(activeRoom?.paletteId ?? 'royal_vermilion');
    this.atmosphereSystem.apply(activeRoom?.atmosphere, pal.backdropColor);
  }

  public toggleFold(unfolded?: boolean) {
    this.targetFoldProgress =
      typeof unfolded === 'boolean' ? (unfolded ? 1 : 0) : this.targetFoldProgress > 0.5 ? 0 : 1;
    if (this.targetFoldProgress === 1) {
      this.popProgress = 0.05;
    }
  }

  public playEntranceUnfold() {
    this.foldProgress = 0;
    this.targetFoldProgress = 1;
    this.popProgress = 0;
  }

  private createWallShape(structure: StructureId): THREE.Shape {
    const wallShape = new THREE.Shape();
    wallShape.moveTo(0, 0);
    wallShape.lineTo(ROOM_SIZE, 0);

    if (structure === 'palace_dome') {
      wallShape.lineTo(ROOM_SIZE, WALL_HEIGHT * 0.78);
      wallShape.quadraticCurveTo(ROOM_SIZE * 0.88, WALL_HEIGHT * 0.9, ROOM_SIZE * 0.74, WALL_HEIGHT * 0.85);
      wallShape.quadraticCurveTo(ROOM_SIZE * 0.6, WALL_HEIGHT * 0.96, ROOM_SIZE * 0.5, WALL_HEIGHT * 1.12);
      wallShape.quadraticCurveTo(ROOM_SIZE * 0.4, WALL_HEIGHT * 0.96, ROOM_SIZE * 0.26, WALL_HEIGHT * 0.85);
      wallShape.quadraticCurveTo(ROOM_SIZE * 0.12, WALL_HEIGHT * 0.9, 0, WALL_HEIGHT * 0.78);
    } else if (structure === 'tri_stage') {
      wallShape.lineTo(ROOM_SIZE, WALL_HEIGHT * 0.72);
      wallShape.bezierCurveTo(
        ROOM_SIZE * 0.86,
        WALL_HEIGHT * 1.07,
        ROOM_SIZE * 0.14,
        WALL_HEIGHT * 1.07,
        0,
        WALL_HEIGHT * 0.72
      );
    } else if (structure === 'hex_gazebo') {
      wallShape.lineTo(ROOM_SIZE, WALL_HEIGHT * 0.78);
      wallShape.lineTo(ROOM_SIZE * 0.82, WALL_HEIGHT * 0.92);
      wallShape.lineTo(ROOM_SIZE * 0.18, WALL_HEIGHT * 0.92);
      wallShape.lineTo(0, WALL_HEIGHT * 0.78);
    } else if (structure === 'modern_gallery') {
      wallShape.lineTo(ROOM_SIZE, WALL_HEIGHT * 0.92);
      wallShape.lineTo(0, WALL_HEIGHT * 0.92);
    } else if (structure === 'torii_pavilion') {
      // Sweeping upturned shrine eaves peaking at the center lintel
      wallShape.lineTo(ROOM_SIZE, WALL_HEIGHT * 0.86);
      wallShape.quadraticCurveTo(ROOM_SIZE * 0.72, WALL_HEIGHT * 0.8, ROOM_SIZE * 0.5, WALL_HEIGHT * 0.96);
      wallShape.quadraticCurveTo(ROOM_SIZE * 0.28, WALL_HEIGHT * 0.8, 0, WALL_HEIGHT * 0.86);
    } else if (structure === 'chateau_conservatory') {
      // European mansard conservatory skylight roofline
      wallShape.lineTo(ROOM_SIZE, WALL_HEIGHT * 0.76);
      wallShape.lineTo(ROOM_SIZE * 0.76, WALL_HEIGHT * 1.02);
      wallShape.lineTo(ROOM_SIZE * 0.24, WALL_HEIGHT * 1.02);
      wallShape.lineTo(0, WALL_HEIGHT * 0.76);
    } else if (structure === 'scandi_atrium') {
      // High-pitched Nordic cathedral atrium with crisp stepped clerestory
      wallShape.lineTo(ROOM_SIZE, WALL_HEIGHT * 0.74);
      wallShape.lineTo(ROOM_SIZE * 0.5, WALL_HEIGHT * 1.15);
      wallShape.lineTo(0, WALL_HEIGHT * 0.74);
    } else {
      wallShape.lineTo(ROOM_SIZE, WALL_HEIGHT * 0.78);
      wallShape.lineTo(ROOM_SIZE * 0.5, WALL_HEIGHT * 1.04);
      wallShape.lineTo(0, WALL_HEIGHT * 0.78);
    }

    wallShape.closePath();
    return wallShape;
  }

  private normalizePlanarUVs(geom: THREE.BufferGeometry) {
    const uvAttr = geom.attributes.uv;
    if (!uvAttr) return;
    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;
    for (let i = 0; i < uvAttr.count; i++) {
      const u = uvAttr.getX(i);
      const v = uvAttr.getY(i);
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
    const spanU = maxU - minU || 1;
    const spanV = maxV - minV || 1;
    for (let i = 0; i < uvAttr.count; i++) {
      uvAttr.setXY(i, (uvAttr.getX(i) - minU) / spanU, (uvAttr.getY(i) - minV) / spanV);
    }
    uvAttr.needsUpdate = true;
  }

  private buildStructureWallTrim(
    structure: StructureId,
    palette: ReturnType<typeof getPaletteById>,
    f: ReturnType<typeof createCraftFactory>
  ): THREE.Group {
    const group = new THREE.Group();
    const trimMat = f.paperMat(palette.accentPrimary, false);
    const goldMat = f.paperMat(palette.accentSecondary, false);

    if (structure === 'palace_dome') {
      // Fluted sandstone & gold corner pilasters
      [-0.04, ROOM_SIZE * 0.5, ROOM_SIZE - 0.04].forEach((px, idx) => {
        if (idx === 1) return;
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.11, WALL_HEIGHT * 0.8, 0.09), trimMat);
        pillar.position.set(Math.max(0.06, Math.min(ROOM_SIZE - 0.06, px)), WALL_HEIGHT * 0.4, 0.04);
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.07, 0.12), goldMat);
        cap.position.set(pillar.position.x, WALL_HEIGHT * 0.8, 0.04);
        group.add(pillar, cap);
      });
    } else if (structure === 'tri_stage') {
      // Curved theater corner columns + warm sconce globes
      [0.08, ROOM_SIZE - 0.08].forEach((px) => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, WALL_HEIGHT * 0.72, 12), trimMat);
        col.position.set(px, WALL_HEIGHT * 0.36, 0.045);
        const globe = new THREE.Mesh(
          new THREE.SphereGeometry(0.075, 12, 10),
          new THREE.MeshStandardMaterial({
            color: '#fff6d6',
            emissive: palette.accentSecondary,
            emissiveIntensity: 0.45,
          })
        );
        globe.position.set(px, WALL_HEIGHT * 0.74, 0.06);
        group.add(col, globe);
      });
    } else if (structure === 'modern_gallery') {
      // Architectural gallery top ledge + overhead spotlight bar
      const header = new THREE.Mesh(new THREE.BoxGeometry(ROOM_SIZE + 0.04, 0.09, 0.14), trimMat);
      header.position.set(ROOM_SIZE * 0.5, WALL_HEIGHT * 0.92, 0.05);
      const lightBar = new THREE.Mesh(
        new THREE.BoxGeometry(ROOM_SIZE * 0.62, 0.035, 0.08),
        new THREE.MeshStandardMaterial({
          color: '#fffdf5',
          emissive: '#ffe9b8',
          emissiveIntensity: 0.5,
        })
      );
      lightBar.position.set(ROOM_SIZE * 0.5, WALL_HEIGHT * 0.87, 0.12);
      group.add(header, lightBar);
    } else if (structure === 'hex_gazebo') {
      // Conservatory lattice top lintel beam
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(ROOM_SIZE * 0.94, 0.07, 0.1), goldMat);
      lintel.position.set(ROOM_SIZE * 0.5, WALL_HEIGHT * 0.89, 0.04);
      group.add(lintel);
    } else if (structure === 'torii_pavilion') {
      // Double-tiered vermilion Torii crossbeams + upturned shrine roof ridge
      const kasagi = new THREE.Mesh(new THREE.BoxGeometry(ROOM_SIZE + 0.14, 0.095, 0.14), trimMat);
      kasagi.position.set(ROOM_SIZE * 0.5, WALL_HEIGHT * 0.89, 0.05);
      const nuki = new THREE.Mesh(new THREE.BoxGeometry(ROOM_SIZE * 0.9, 0.065, 0.1), goldMat);
      nuki.position.set(ROOM_SIZE * 0.5, WALL_HEIGHT * 0.75, 0.045);
      group.add(kasagi, nuki);
    } else if (structure === 'chateau_conservatory') {
      // European wrought-iron mansard trim & skylight bars
      const crestBeam = new THREE.Mesh(new THREE.BoxGeometry(ROOM_SIZE * 0.56, 0.07, 0.12), goldMat);
      crestBeam.position.set(ROOM_SIZE * 0.5, WALL_HEIGHT * 1.02, 0.045);
      group.add(crestBeam);
    } else if (structure === 'scandi_atrium') {
      // Nordic exposed timber rafter beams
      const rafterL = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.07, 0.11), trimMat);
      rafterL.position.set(ROOM_SIZE * 0.25, WALL_HEIGHT * 0.94, 0.045);
      rafterL.rotation.z = 0.68;
      const rafterR = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.07, 0.11), trimMat);
      rafterR.position.set(ROOM_SIZE * 0.75, WALL_HEIGHT * 0.94, 0.045);
      rafterR.rotation.z = -0.68;
      group.add(rafterL, rafterR);
    } else {
      // Classic gable eaves trim boards
      const leftSlope = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.065, 0.1), trimMat);
      leftSlope.position.set(ROOM_SIZE * 0.25, WALL_HEIGHT * 0.91, 0.04);
      leftSlope.rotation.z = 0.48;
      const rightSlope = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.065, 0.1), trimMat);
      rightSlope.position.set(ROOM_SIZE * 0.75, WALL_HEIGHT * 0.91, 0.04);
      rightSlope.rotation.z = -0.48;
      group.add(leftSlope, rightSlope);
    }

    return group;
  }

  private buildStructureCanopy(
    structure: StructureId,
    palette: ReturnType<typeof getPaletteById>,
    f: ReturnType<typeof createCraftFactory>,
    sectorAngle: number,
    basePopPos: THREE.Vector3
  ): THREE.Group {
    const extra = new THREE.Group();
    const primaryMat = f.paperMat(palette.accentPrimary, false);
    const goldMat = f.paperMat(palette.accentSecondary, false);

    if (structure === 'palace_dome') {
      // Royal chhatri lotus onion dome & kalash spire at the inner apex
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.14, 16), goldMat);
      neck.position.set(0.28, WALL_HEIGHT * 0.96, 0.28);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 14), primaryMat);
      dome.scale.set(1, 0.85, 1);
      dome.position.set(0.28, WALL_HEIGHT * 1.18, 0.28);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.32, 12), goldMat);
      spire.position.set(0.28, WALL_HEIGHT * 1.54, 0.28);
      extra.add(neck, dome, spire);
    } else if (structure === 'hex_gazebo') {
      // Overhead timber pergola beams + hanging floral vine dots
      const midAngle = sectorAngle * 0.5;
      const rx = Math.cos(midAngle);
      const rz = Math.sin(midAngle);
      for (let i = 1; i <= 3; i++) {
        const dist = 0.55 * i;
        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.08, 1.35 - i * 0.12), goldMat);
        beam.position.set(rx * dist, WALL_HEIGHT * 0.87, rz * dist);
        beam.rotation.y = -midAngle;
        const blossom = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), primaryMat);
        blossom.position.set(rx * dist, WALL_HEIGHT * 0.82, rz * dist);
        extra.add(beam, blossom);
      }
    } else if (structure === 'tri_stage') {
      // Decorative velvet valance crown over center stage
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.22), primaryMat);
      canopy.position.set(basePopPos.x, WALL_HEIGHT * 0.88, basePopPos.z * 0.25);
      canopy.rotation.y = -sectorAngle * 0.5 + Math.PI / 2;
      extra.add(canopy);
    } else if (structure === 'modern_gallery') {
      // Floating architectural plinth slab under centerpiece
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.07, 1.15), primaryMat);
      plinth.position.set(basePopPos.x, 0.035, basePopPos.z);
      extra.add(plinth);
    } else if (structure === 'torii_pavilion') {
      // Overhead cedar & brass shrine eave crossbeams
      const midAngle = sectorAngle * 0.5;
      const eave = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.2), primaryMat);
      eave.position.set(Math.cos(midAngle) * 0.95, WALL_HEIGHT * 0.92, Math.sin(midAngle) * 0.95);
      eave.rotation.y = -midAngle + Math.PI / 2;
      extra.add(eave);
    } else if (structure === 'chateau_conservatory') {
      // Glasshouse brass cupola lantern above courtyard
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 0.16, 8), goldMat);
      ring.position.set(basePopPos.x * 0.45, WALL_HEIGHT * 1.06, basePopPos.z * 0.45);
      const peak = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.36, 8), primaryMat);
      peak.position.set(basePopPos.x * 0.45, WALL_HEIGHT * 1.24, basePopPos.z * 0.45);
      extra.add(ring, peak);
    } else if (structure === 'scandi_atrium') {
      // Exposed timber collar ridge beam
      const midAngle = sectorAngle * 0.5;
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 1.5), goldMat);
      beam.position.set(Math.cos(midAngle) * 0.82, WALL_HEIGHT * 1.08, Math.sin(midAngle) * 0.82);
      beam.rotation.y = -midAngle + Math.PI / 2;
      extra.add(beam);
    } else {
      // Classic gable corner finial post
      const cornerPost = new THREE.Mesh(new THREE.BoxGeometry(0.09, WALL_HEIGHT * 0.82, 0.09), primaryMat);
      cornerPost.position.set(0.06, WALL_HEIGHT * 0.41, 0.06);
      extra.add(cornerPost);
    }

    return extra;
  }

  /** Builds N dynamic wings/corners of the folding paper pop-up architecture. */
  private rebuildBook() {
    while (this.bookRoot.children.length > 0) {
      this.bookRoot.remove(this.bookRoot.children[0]);
    }
    this.roomHandles = [];
    this.customTextMeshes = [];
    this.photoCutoutTargets = [];
    this.draggingText = null;
    this.draggingCutout = null;

    const activeRoom = this.project.rooms[this.activeRoomIndex] ?? this.project.rooms[0];
    if (activeRoom) {
      const pal = getPaletteById(activeRoom.paletteId);
      this.atmosphereSystem.apply(activeRoom.atmosphere, pal.backdropColor);
      if (this.sparklePoints) {
        (this.sparklePoints.material as THREE.PointsMaterial).color.set(pal.accentSecondary);
      }
    }

    const totalCorners = this.getCornersCount();
    const sectorAngle = (Math.PI * 2) / totalCorners;
    for (let q = 0; q < totalCorners; q++) {
      const room = this.project.rooms[q % this.project.rooms.length];
      const handle = this.buildQuadrant(room, q, q < this.project.rooms.length, totalCorners, sectorAngle);
      handle.quadrantRoot.rotation.y = q * sectorAngle;
      this.bookRoot.add(handle.quadrantRoot);
      this.roomHandles.push(handle);
    }
  }

  private buildQuadrant(
    room: RoomConfig,
    _qIdx: number,
    isPrimaryRoom: boolean,
    totalCorners: 2 | 3 | 4,
    sectorAngle: number
  ): RoomHandle {
    const palette = getPaletteById(room.paletteId);
    const structure = this.getStructureId();
    const f = createCraftFactory(palette);

    const quadrantRoot = new THREE.Group();
    const wallShape = this.createWallShape(structure);
    const wallGeom = new THREE.ShapeGeometry(wallShape);

    // Wall 1 (Left wall hinged so its decorated front always faces INWARD into this room)
    const wallLeft = new THREE.Group();
    wallLeft.rotation.y = Math.PI - sectorAngle;
    const wallLeftContent = new THREE.Group();
    wallLeftContent.position.set(-ROOM_SIZE, 0, 0.035);
    const wallMeshLeft = new THREE.Mesh(wallGeom, f.paperMat(palette.wallTint, false));
    wallMeshLeft.receiveShadow = true;
    wallMeshLeft.castShadow = true;
    wallLeftContent.add(wallMeshLeft, f.inkLine(wallGeom));
    wallLeftContent.add(buildWallDecor(room.wallStyle, palette, ROOM_SIZE, WALL_HEIGHT));
    wallLeftContent.add(buildGarland(room.garland, palette, ROOM_SIZE));
    wallLeftContent.add(this.buildStructureWallTrim(structure, palette, f));
    wallLeft.add(wallLeftContent);

    // Wall 2 (Right wall along +X with main Signage Plaque facing +Z)
    const wallRight = new THREE.Group();
    wallRight.position.set(0, 0, 0.035);
    const wallMeshRight = new THREE.Mesh(wallGeom, f.paperMat(palette.paperBase, false));
    wallMeshRight.receiveShadow = true;
    wallMeshRight.castShadow = true;
    wallRight.add(wallMeshRight, f.inkLine(wallGeom));
    wallRight.add(buildGarland(room.garland, palette, ROOM_SIZE));
    wallRight.add(this.buildStructureWallTrim(structure, palette, f));

    // Framed Invitation Signage Plaque on Right Wall
    const signTex = createSignageTexture(room.signage, palette, room.fontStyle);
    const signPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.74, 1.3),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    signPlane.position.set(ROOM_SIZE * 0.51, WALL_HEIGHT * 0.43, 0.042);
    const signBorder = f.inkLine(new THREE.BoxGeometry(1.78, 1.34, 0.02));
    signBorder.position.set(ROOM_SIZE * 0.51, WALL_HEIGHT * 0.43, 0.036);
    wallRight.add(signPlane, signBorder);

    // Draggable custom floating text overlays on Right Wall
    if (isPrimaryRoom && Array.isArray(room.customTexts)) {
      room.customTexts.forEach((item) => {
        if (!item.text?.trim()) return;
        const scale = Math.max(0.6, Math.min(1.8, item.scale ?? 1));
        const nx = Math.max(-1, Math.min(1, item.x ?? 0));
        const ny = Math.max(-1, Math.min(1, item.y ?? 0.5));
        const textTex = createCustomTextTexture(
          item.text,
          palette,
          item.color,
          item.fontStyle ?? room.fontStyle
        );
        const textMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(1.15 * scale, 0.36 * scale),
          new THREE.MeshBasicMaterial({ map: textTex, transparent: true, depthWrite: false })
        );
        textMesh.position.set(
          ROOM_SIZE * (0.5 + nx * 0.42),
          WALL_HEIGHT * (0.45 + ny * 0.36),
          0.072
        );
        textMesh.userData = {
          customTextId: item.id,
          roomIndex: _qIdx,
          wallRight,
          nx,
          ny,
        };
        wallRight.add(textMesh);
        this.customTextMeshes.push(textMesh);
      });
    }

    // Dynamic sector floor panel adapting to 2, 3, or 4 corners
    const floorPivot = new THREE.Group();
    const floorTex = createFloorTexture(room.floorPattern, palette);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.9,
      metalness: 0.02,
    });

    let floorGeom: THREE.BufferGeometry;
    const basePopPos = new THREE.Vector3();

    if (totalCorners === 2) {
      const stageShape = new THREE.Shape();
      stageShape.moveTo(-ROOM_SIZE * 0.96, 0);
      stageShape.lineTo(ROOM_SIZE * 0.96, 0);
      stageShape.lineTo(ROOM_SIZE * 0.84, ROOM_SIZE * 0.88);
      stageShape.lineTo(-ROOM_SIZE * 0.84, ROOM_SIZE * 0.88);
      stageShape.closePath();
      floorGeom = new THREE.ExtrudeGeometry(stageShape, { depth: 0.04, bevelEnabled: false });
      floorGeom.rotateX(Math.PI / 2);
      this.normalizePlanarUVs(floorGeom);
      basePopPos.set(0, 0, ROOM_SIZE * 0.44);
    } else {
      const cs = Math.cos(sectorAngle);
      const sn = Math.sin(sectorAngle);
      const sectorShape = new THREE.Shape();
      sectorShape.moveTo(0, 0);
      sectorShape.lineTo(ROOM_SIZE, 0);
      sectorShape.lineTo(ROOM_SIZE * (1 + cs), ROOM_SIZE * sn);
      sectorShape.lineTo(ROOM_SIZE * cs, ROOM_SIZE * sn);
      sectorShape.closePath();
      floorGeom = new THREE.ExtrudeGeometry(sectorShape, { depth: 0.04, bevelEnabled: false });
      floorGeom.rotateX(Math.PI / 2);
      this.normalizePlanarUVs(floorGeom);
      basePopPos.set((1 + cs) * ROOM_SIZE * 0.5, 0, sn * ROOM_SIZE * 0.5);
    }

    const floorMesh = new THREE.Mesh(floorGeom, floorMat);
    floorMesh.receiveShadow = true;
    const floorEdge = f.inkLine(floorGeom);
    floorPivot.add(floorMesh, floorEdge);

    // Centerpiece & side props pop-up group centered cleanly inside the sector
    const popGroup = new THREE.Group();
    popGroup.position.copy(basePopPos);

    const centerModel = buildCenterpiece(room.centerpiece, palette);
    if (!isPrimaryRoom) {
      centerModel.scale.setScalar(0.85);
    }
    popGroup.add(centerModel);

    const spreadScale = totalCorners === 3 ? 0.68 : 1;
    const sideSlots: [number, number][] =
      totalCorners === 2
        ? [
            [-1.12, -0.04],
            [1.12, -0.04],
            [-0.72, 0.34],
            [0.72, 0.34],
          ]
        : [
            [-0.82 * spreadScale, 0.68 * spreadScale],
            [0.78 * spreadScale, 0.72 * spreadScale],
            [-0.78 * spreadScale, -0.72 * spreadScale],
            [0.78 * spreadScale, -0.72 * spreadScale],
          ];
    room.sideProps.slice(0, 4).forEach((propId, idx) => {
      const propModel = buildSideProp(propId, palette);
      const [sx, sz] = sideSlots[idx % sideSlots.length];
      propModel.position.set(sx, 0, sz);
      popGroup.add(propModel);
    });

    const registerCutoutSlot = (cfg: RoomConfig['photoCutout'], slot: 1 | 2, defaultX: number, defaultZ: number) => {
      if (!cfg?.enabled) return;
      const cutoutModel = buildPhotoCutoutProp(cfg);
      let hitMesh: THREE.Mesh | null = null;
      cutoutModel.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && child.userData?.photoCutoutFace) {
          hitMesh = child as THREE.Mesh;
        }
      });

      const ox = cfg.offsetX ?? defaultX;
      const oz = cfg.offsetZ ?? defaultZ;
      if (cfg.placement === 'wall_frame') {
        cutoutModel.position.set(
          ROOM_SIZE * (0.24 + ox * 0.25),
          WALL_HEIGHT * (slot === 1 ? 0.64 : 0.36),
          0.088
        );
        wallRight.add(cutoutModel);
      } else {
        cutoutModel.position.set(ox, 0, oz);
        popGroup.add(cutoutModel);
      }

      if (hitMesh && isPrimaryRoom) {
        this.photoCutoutTargets.push({
          root: cutoutModel,
          hitMesh,
          roomIndex: _qIdx,
          slot,
          placement: cfg.placement,
          popGroup,
          wallRight,
          offsetX: ox,
          offsetZ: oz,
        });
      }
    };

    registerCutoutSlot(room.photoCutout, 1, -0.78, 0.72);
    registerCutoutSlot(room.photoCutout2, 2, 0.78, 0.72);

    const extraPivot = this.buildStructureCanopy(structure, palette, f, sectorAngle, basePopPos);

    floorPivot.add(popGroup);
    quadrantRoot.add(wallLeft, wallRight, floorPivot, extraPivot);

    return { quadrantRoot, floorPivot, popGroup, wallRight, wallLeft, extraPivot, basePopPos };
  }

  private applyFoldAndPop(dt: number) {
    this.foldProgress += (this.targetFoldProgress - this.foldProgress) * Math.min(1, dt * 5.2);
    this.popProgress += (1 - this.popProgress) * Math.min(1, dt * 4.5);

    const closed = 1 - this.foldProgress;
    const popScale = Math.max(0.02, this.foldProgress * this.popProgress);
    const structure = this.getStructureId();
    const sectorAngle = this.getSectorAngle();
    const baseLeftYaw = Math.PI - sectorAngle;

    this.roomHandles.forEach((h, idx) => {
      const floorScale = Math.max(0.04, this.foldProgress);

      // Reset neutral wall offsets/tilts before applying structure-specific unfold physics
      h.wallLeft.position.y = 0;
      h.wallRight.position.y = 0;
      h.wallLeft.rotation.set(0, baseLeftYaw, 0);
      h.wallRight.rotation.set(0, 0, 0);
      h.extraPivot.position.y = 0;
      h.extraPivot.rotation.set(0, 0, 0);
      h.extraPivot.scale.setScalar(1);
      h.popGroup.position.copy(h.basePopPos);

      if (structure === 'palace_dome') {
        h.floorPivot.scale.set(floorScale, 1, floorScale);
        h.wallLeft.rotation.y = baseLeftYaw + closed * 0.34;
        h.wallRight.rotation.y = -closed * 0.34;
        h.extraPivot.position.y = closed * 1.95;
        h.extraPivot.rotation.y = closed * 0.65;
        h.extraPivot.scale.setScalar(0.5 + 0.5 * this.foldProgress);
      } else if (structure === 'tri_stage') {
        h.floorPivot.scale.set(floorScale, 1, 0.35 + 0.65 * this.foldProgress);
        h.wallLeft.rotation.y = baseLeftYaw + closed * 0.85;
        h.wallRight.rotation.y = -closed * 0.14;
        h.popGroup.position.set(h.basePopPos.x, -closed * 0.32, h.basePopPos.z);
        h.extraPivot.position.y = closed * 0.7;
      } else if (structure === 'hex_gazebo') {
        h.floorPivot.scale.set(floorScale, 1, floorScale);
        h.wallRight.rotation.x = closed * 0.28;
        h.wallLeft.rotation.z = closed * 0.28;
        h.extraPivot.position.y = closed * 1.15;
        h.extraPivot.scale.setScalar(0.4 + 0.6 * this.foldProgress);
      } else if (structure === 'modern_gallery') {
        h.floorPivot.scale.set(floorScale, 1, floorScale);
        h.wallLeft.position.y = -closed * 1.85;
        h.wallRight.position.y = -closed * 1.35;
        h.extraPivot.position.y = -closed * 1.05;
      } else if (structure === 'torii_pavilion') {
        h.floorPivot.scale.set(floorScale, 1, floorScale);
        h.wallLeft.rotation.y = baseLeftYaw + closed * 0.62;
        h.wallRight.rotation.y = -closed * 0.62;
        h.extraPivot.position.y = closed * 1.35;
      } else if (structure === 'chateau_conservatory') {
        h.floorPivot.scale.set(floorScale, 1, floorScale);
        h.wallLeft.rotation.z = -closed * 0.3;
        h.wallRight.rotation.x = closed * 0.3;
        h.extraPivot.position.y = closed * 1.6;
        h.extraPivot.scale.setScalar(0.45 + 0.55 * this.foldProgress);
      } else if (structure === 'scandi_atrium') {
        h.floorPivot.scale.set(floorScale, 1, floorScale);
        h.wallLeft.rotation.y = baseLeftYaw + closed * 0.42;
        h.wallRight.rotation.y = -closed * 0.42;
        h.extraPivot.rotation.z = closed * 0.45;
      } else {
        // Classic Gable House accordion star unfold
        h.floorPivot.scale.set(floorScale, 1, floorScale);
        h.wallLeft.rotation.y = baseLeftYaw + closed * 0.45;
        h.wallRight.rotation.y = -closed * 0.45;
        h.extraPivot.scale.set(1, Math.max(0.05, this.foldProgress), 1);
      }

      const isFocused = idx === this.activeRoomIndex;
      const roomBoost = isFocused ? 1 : 0.88;
      const closeUpTuck = this.cinematicActive && isFocused ? 1 - this.cinematicZoomFactor * 0.86 : 1;
      if (this.cinematicActive && isFocused && (structure === 'hex_gazebo' || structure === 'tri_stage')) {
        h.extraPivot.scale.multiplyScalar(1 - this.cinematicZoomFactor * 0.82);
      }
      h.popGroup.scale.set(1, popScale * roomBoost * closeUpTuck, 1);
    });
  }

  private getPhotoFraming(target: CutoutDragTarget) {
    this.bookRoot.updateMatrixWorld(true);
    const wp = new THREE.Vector3();
    target.root.getWorldPosition(wp);
    const frontNormal = new THREE.Vector3(0, 0, 1)
      .transformDirection(target.root.matrixWorld)
      .setY(0);
    if (frontNormal.lengthSq() < 1e-4) frontNormal.set(0, 0, 1);
    else frontNormal.normalize();
    const tangent = new THREE.Vector3(-frontNormal.z, 0, frontNormal.x);
    const centerY = target.placement === 'wall_frame' ? 0 : 0.56;
    const dist = target.placement === 'wall_frame' ? 2.25 : 2.55;
    const look = new THREE.Vector3(wp.x, wp.y + centerY, wp.z);
    const cam = new THREE.Vector3(
      wp.x + frontNormal.x * dist,
      wp.y + centerY + 0.2,
      wp.z + frontNormal.z * dist
    );
    return { cam, look, frontNormal, tangent };
  }

  private animate = () => {
    this.rafId = requestAnimationFrame(this.animate);
    const dt = Math.min(0.05, this.clock.getDelta());

    if (this.cinematicActive && this.cinematicTimeline) {
      const now = performance.now();
      const elapsed = now - this.cinematicStartTime;
      const { gardenIntroMs, waxIntroMs, segments, totalMs } = this.cinematicTimeline;
      const totalSec = Math.round(totalMs / 1000);

      if (elapsed >= totalMs) {
        const onProgress = this.cinematicOnProgress;
        const onDone = this.cinematicOnDone;
        const isExport = this.cinematicIsExport;
        onProgress?.(100, totalSec, totalSec);
        if (isExport) {
          this.cinematicActive = false;
          this.cinematicTimeline = null;
          this.cinematicOnProgress = undefined;
          this.cinematicOnDone = undefined;
          onDone?.();
        } else {
          this.stopPreview();
          onDone?.();
        }
      } else {
        this.applyCinematicFrame(elapsed, segments, gardenIntroMs, waxIntroMs);
        const pct = Math.min(99, Math.round((elapsed / totalMs) * 100));
        const elapsedSec = Math.round(elapsed / 1000);
        if (
          now - this.cinematicLastProgressEmit >= 200 &&
          (pct !== this.cinematicLastPct || elapsedSec !== this.cinematicLastSec)
        ) {
          this.cinematicLastProgressEmit = now;
          this.cinematicLastPct = pct;
          this.cinematicLastSec = elapsedSec;
          this.cinematicOnProgress?.(pct, elapsedSec, totalSec);
        }
      }
    }

    this.applyFoldAndPop(dt);
    this.atmosphereSystem.update(dt);

    if (this.waxAnimActive && this.waxRig && !this.cinematicActive) {
      const elapsed = performance.now() - this.waxAnimStart;
      const t = Math.min(1, elapsed / this.waxAnimDurationMs);
      this.waxRig.setOpenProgress(t);
      if (t >= 1) {
        this.waxAnimActive = false;
      }
    }

    if (this.sparklePoints) {
      this.sparklePoints.rotation.y += dt * 0.14;
    }

    if (!this.isDragging && !this.cinematicActive) {
      this.dragOffsetYaw *= 0.92;
    }

    const desiredYaw = this.targetYaw + (this.cinematicActive ? this.cinematicYawBias : this.dragOffsetYaw);
    this.currentYaw += (desiredYaw - this.currentYaw) * Math.min(1, dt * 6.5);
    this.bookRoot.rotation.y = this.currentYaw;

    if (this.cinematicActive) {
      this.camera.position.copy(this.cinematicCamPos);
      this.camera.lookAt(this.cinematicLookTarget);
    } else if (this.viewMode === 'wax_envelope') {
      const t = this.clock.elapsedTime;
      const swayX = Math.sin(t * 0.7) * 0.22;
      this.camera.position.set(swayX, 2.0, 6.4);
      this.camera.lookAt(0, 1.55, 0);
    } else if (this.viewMode === 'garden_entrance') {
      const t = this.clock.elapsedTime;
      const swayX = Math.sin(t * 0.55) * 0.55;
      const goalPos = new THREE.Vector3(swayX, 2.55, 10.6);
      const goalLook = new THREE.Vector3(0, 1.15, 1.6);
      this.currentCamPos.lerp(goalPos, Math.min(1, dt * 6));
      this.currentLookAt.lerp(goalLook, Math.min(1, dt * 6));
      this.camera.position.copy(this.currentCamPos);
      this.camera.lookAt(this.currentLookAt);
    } else {
      this.userZoomDistance += (this.targetZoomDistance - this.userZoomDistance) * Math.min(1, dt * 7);

      const focusedTarget =
        this.focusSlot !== 0
          ? this.photoCutoutTargets.find(
              (c) => c.roomIndex === this.activeRoomIndex && c.slot === this.focusSlot
            )
          : undefined;

      if (focusedTarget) {
        const { cam, look } = this.getPhotoFraming(focusedTarget);
        this.currentCamPos.lerp(cam, Math.min(1, dt * 6));
        this.currentLookAt.lerp(look, Math.min(1, dt * 6));
        this.camera.position.copy(this.currentCamPos);
        this.camera.lookAt(this.currentLookAt);
      } else {
        const motion = this.project.rooms[this.activeRoomIndex]?.atmosphere?.cameraMotion ?? 'gentle_orbit';
        const driftX = !this.isDragging && motion === 'gentle_orbit' ? Math.sin(this.clock.elapsedTime * 0.6) * 0.45 : 0;
        const baseDist =
          motion === 'cinematic_push' && !this.isDragging
            ? this.userZoomDistance - 0.4 - Math.sin(this.clock.elapsedTime * 0.5) * 0.35
            : this.userZoomDistance;
        const goalPos = new THREE.Vector3(
          driftX,
          Math.sin(this.dragPitch) * baseDist + 0.7,
          Math.cos(this.dragPitch) * baseDist
        );
        const goalLook = new THREE.Vector3(0, 1.0, 0);
        this.currentCamPos.lerp(goalPos, Math.min(1, dt * 7));
        this.currentLookAt.lerp(goalLook, Math.min(1, dt * 7));
        this.camera.position.copy(this.currentCamPos);
        this.camera.lookAt(this.currentLookAt);
      }
    }

    this.renderer.render(this.scene, this.camera);
  };

  /** Computes per-room timeline segments (plus optional Garden Entrance + Cover Seal intro). */
  private getTimeline() {
    const gardenIntroMs = this.getGardenIntroDurationMs();
    const waxIntroMs = this.getWaxIntroDurationMs();
    const rooms = this.project.rooms;
    let cursorMs = gardenIntroMs + waxIntroMs;
    const segments = rooms.map((r, index) => {
      const secs = Math.max(4, Math.min(25, r.durationSeconds ?? 8));
      const durMs = secs * 1000;
      const seg = { index, startMs: cursorMs, endMs: cursorMs + durMs, durMs };
      cursorMs += durMs;
      return seg;
    });
    return { gardenIntroMs, waxIntroMs, segments, totalMs: Math.max(4000, cursorMs) };
  }

  /**
   * Updates camera zoom, angle, and room transitions for a given timestamp in the
   * cinematic sequence: Garden Entrance Sweep -> Cover/Wax-Seal Intro -> Room Tours.
   */
  private applyCinematicFrame(
    elapsedMs: number,
    segments: { index: number; startMs: number; endMs: number; durMs: number }[],
    gardenIntroMs = 0,
    waxIntroMs = 0
  ) {
    if (gardenIntroMs > 0 && elapsedMs < gardenIntroMs) {
      if (this.waxRig) this.waxRig.root.visible = false;
      this.bookRoot.visible = true;
      const t = Math.min(1, elapsedMs / Math.max(1, gardenIntroMs));
      const smooth = easeInOutCubic(t);
      const foldVal = 0.25 + smooth * 0.55;
      this.targetFoldProgress = foldVal;
      this.foldProgress = foldVal;
      this.popProgress = 0.45 + smooth * 0.45;
      this.cinematicZoomFactor = 0;
      this.cinematicYawBias = 0;
      this.cinematicCamPos.set(
        Math.sin(t * Math.PI) * 0.34,
        2.25 + smooth * 0.85,
        11.6 - smooth * 4.2
      );
      this.cinematicLookTarget.set(0, 1.38 - smooth * 0.22, 2.4 - smooth * 2.1);
      return;
    }

    if (waxIntroMs > 0 && elapsedMs < gardenIntroMs + waxIntroMs && this.waxRig) {
      const waxElapsed = elapsedMs - gardenIntroMs;
      this.waxRig.root.visible = true;
      this.bookRoot.visible = false;
      this.targetFoldProgress = 0;
      this.foldProgress = 0;
      this.popProgress = 0;
      this.cinematicZoomFactor = 0;
      this.cinematicYawBias = 0;
      const t = Math.min(1, waxElapsed / Math.max(1, waxIntroMs * 0.86));
      this.waxRig.setOpenProgress(t);
      this.cinematicCamPos.set(Math.sin(t * 0.5) * 0.28, 2.0 - t * 0.14, 6.5 - t * 0.55);
      this.cinematicLookTarget.set(0, 1.55 + t * 0.22, 0);
      return;
    }

    if (this.waxRig) this.waxRig.root.visible = false;
    this.bookRoot.visible = true;
    this.targetFoldProgress = 1;

    const seg =
      segments.find((s) => elapsedMs >= s.startMs && elapsedMs < s.endMs) ??
      segments[segments.length - 1];

    if (seg.index !== this.activeRoomIndex) {
      this.setActiveRoom(seg.index);
    }

    const localT = Math.max(0, Math.min(1, (elapsedMs - seg.startMs) / seg.durMs));

    const sectorAngle = this.getSectorAngle();
    const motion = this.project.rooms[seg.index]?.atmosphere?.cameraMotion ?? 'gentle_orbit';
    const roomPhotos = this.photoCutoutTargets
      .filter((c) => c.roomIndex === seg.index)
      .sort((a, b) => a.slot - b.slot);

    const gardenEnabled = getDefaultGardenForProject(this.project).enabled;
    const orbitDist = gardenEnabled ? 11.45 : 10.6;
    const wideOrbit = motion === 'steady' ? 0 : Math.sin(localT * Math.PI * 2) * 0.35;
    const pushOffset = motion === 'cinematic_push' ? -localT * 0.45 : 0;
    const widePos = new THREE.Vector3(
      wideOrbit,
      Math.sin(this.dragPitch) * orbitDist + (gardenEnabled ? 0.9 : 0.7),
      Math.cos(this.dragPitch) * orbitDist + pushOffset
    );
    const wideLook = new THREE.Vector3(0, 1.0, 0);
    const closePos = new THREE.Vector3(1.35, 1.18, 3.85);
    const closeLook = new THREE.Vector3(1.35, 1.14, 0.067);

    let plaqueFactor = 0;

    if (roomPhotos.length === 1) {
      const p1 = this.getPhotoFraming(roomPhotos[0]);
      if (localT < 0.14) {
        this.cinematicCamPos.copy(widePos);
        this.cinematicLookTarget.copy(wideLook);
      } else if (localT < 0.26) {
        const k = easeInOutCubic((localT - 0.14) / 0.12);
        this.cinematicCamPos.lerpVectors(widePos, p1.cam, k);
        this.cinematicLookTarget.lerpVectors(wideLook, p1.look, k);
      } else if (localT < 0.44) {
        const drift = Math.sin(((localT - 0.26) / 0.18) * Math.PI) * 0.12;
        this.cinematicCamPos
          .copy(p1.cam)
          .addScaledVector(p1.tangent, drift)
          .addScaledVector(p1.frontNormal, -0.14);
        this.cinematicLookTarget.copy(p1.look);
      } else if (localT < 0.58) {
        const k = easeInOutCubic((localT - 0.44) / 0.14);
        plaqueFactor = k;
        this.cinematicCamPos.lerpVectors(p1.cam, closePos, k);
        this.cinematicLookTarget.lerpVectors(p1.look, closeLook, k);
      } else if (localT < 0.84) {
        plaqueFactor = 1;
        this.cinematicCamPos.copy(closePos);
        this.cinematicLookTarget.copy(closeLook);
      } else {
        const k = easeInOutCubic((localT - 0.84) / 0.16);
        plaqueFactor = 1 - k;
        this.cinematicCamPos.lerpVectors(closePos, widePos, k);
        this.cinematicLookTarget.lerpVectors(closeLook, wideLook, k);
      }
    } else if (roomPhotos.length >= 2) {
      const p1 = this.getPhotoFraming(roomPhotos[0]);
      const p2 = this.getPhotoFraming(roomPhotos[1]);
      if (localT < 0.10) {
        this.cinematicCamPos.copy(widePos);
        this.cinematicLookTarget.copy(wideLook);
      } else if (localT < 0.20) {
        const k = easeInOutCubic((localT - 0.10) / 0.10);
        this.cinematicCamPos.lerpVectors(widePos, p1.cam, k);
        this.cinematicLookTarget.lerpVectors(wideLook, p1.look, k);
      } else if (localT < 0.34) {
        const drift = Math.sin(((localT - 0.20) / 0.14) * Math.PI) * 0.1;
        this.cinematicCamPos
          .copy(p1.cam)
          .addScaledVector(p1.tangent, drift)
          .addScaledVector(p1.frontNormal, -0.12);
        this.cinematicLookTarget.copy(p1.look);
      } else if (localT < 0.44) {
        const k = easeInOutCubic((localT - 0.34) / 0.10);
        this.cinematicCamPos.lerpVectors(p1.cam, p2.cam, k);
        this.cinematicLookTarget.lerpVectors(p1.look, p2.look, k);
      } else if (localT < 0.58) {
        const drift = Math.sin(((localT - 0.44) / 0.14) * Math.PI) * 0.1;
        this.cinematicCamPos
          .copy(p2.cam)
          .addScaledVector(p2.tangent, -drift)
          .addScaledVector(p2.frontNormal, -0.12);
        this.cinematicLookTarget.copy(p2.look);
      } else if (localT < 0.68) {
        const k = easeInOutCubic((localT - 0.58) / 0.10);
        plaqueFactor = k;
        this.cinematicCamPos.lerpVectors(p2.cam, closePos, k);
        this.cinematicLookTarget.lerpVectors(p2.look, closeLook, k);
      } else if (localT < 0.88) {
        plaqueFactor = 1;
        this.cinematicCamPos.copy(closePos);
        this.cinematicLookTarget.copy(closeLook);
      } else {
        const k = easeInOutCubic((localT - 0.88) / 0.12);
        plaqueFactor = 1 - k;
        this.cinematicCamPos.lerpVectors(closePos, widePos, k);
        this.cinematicLookTarget.lerpVectors(closeLook, wideLook, k);
      }
    } else {
      if (localT >= 0.22 && localT < 0.38) {
        plaqueFactor = easeInOutCubic((localT - 0.22) / 0.16);
      } else if (localT >= 0.38 && localT < 0.78) {
        plaqueFactor = 1;
      } else if (localT >= 0.78) {
        plaqueFactor = 1 - easeInOutCubic((localT - 0.78) / 0.22);
      }
      this.cinematicCamPos.lerpVectors(widePos, closePos, plaqueFactor);
      this.cinematicLookTarget.lerpVectors(wideLook, closeLook, plaqueFactor);
    }

    this.cinematicZoomFactor = plaqueFactor;
    this.cinematicYawBias = plaqueFactor * (Math.PI / 2 - sectorAngle * 0.5);
  }

  /** Plays a live cinematic preview inside the 3D viewport (without recording). */
  public startPreview(
    onProgress?: (pct: number, elapsedSec: number, totalSec: number) => void,
    onDone?: () => void
  ) {
    this.stopPreview();
    const timeline = this.getTimeline();
    const totalSec = Math.round(timeline.totalMs / 1000);

    this.setActiveRoom(0);
    this.foldProgress = 0;
    this.targetFoldProgress = 1;
    this.popProgress = 0;
    this.cinematicStartTime = performance.now();
    this.cinematicTimeline = timeline;
    this.cinematicOnProgress = onProgress;
    this.cinematicOnDone = onDone;
    this.cinematicLastProgressEmit = 0;
    this.cinematicLastPct = -1;
    this.cinematicLastSec = -1;
    this.cinematicIsExport = false;
    this.cinematicActive = true;
    onProgress?.(0, 0, totalSec);
  }

  public stopPreview() {
    this.cinematicActive = false;
    this.cinematicTimeline = null;
    this.cinematicOnProgress = undefined;
    this.cinematicOnDone = undefined;
    this.cinematicIsExport = false;
    this.cinematicZoomFactor = 0;
    this.cinematicYawBias = 0;
    this.cinematicLookTarget.set(0, 1.0, 0);
    if (this.waxRig) this.waxRig.root.visible = this.viewMode === 'wax_envelope';
    this.bookRoot.visible = this.viewMode !== 'wax_envelope';
  }

  /**
   * Plays the full customizable-length showcase (garden sweep -> seal opening -> room tours)
   * and captures Canvas + Audio into a video Blob.
   */
  public async exportShowcaseVideo(
    audioStream: MediaStream | null,
    onProgress?: (pct: number) => void
  ): Promise<{ blob: Blob; mimeType: string }> {
    this.stopPreview();
    const canvasStream = this.renderer.domElement.captureStream(30);
    const combined = new MediaStream();
    canvasStream.getVideoTracks().forEach((t) => combined.addTrack(t));
    if (audioStream) {
      audioStream.getAudioTracks().forEach((t) => combined.addTrack(t));
    }

    const candidates = [
      'video/mp4;codecs=avc1',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    const mimeType = candidates.find((c) => MediaRecorder.isTypeSupported(c)) || 'video/webm';

    const recorder = new MediaRecorder(combined, {
      mimeType,
      videoBitsPerSecond: 4_200_000,
    });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunks.push(ev.data);
    };

    const timeline = this.getTimeline();
    const startRoom = this.activeRoomIndex;

    recorder.start(250);
    this.setActiveRoom(0);
    this.foldProgress = 0;
    this.targetFoldProgress = 1;
    this.popProgress = 0;
    this.cinematicStartTime = performance.now();
    this.cinematicTimeline = timeline;
    this.cinematicLastProgressEmit = 0;
    this.cinematicLastPct = -1;
    this.cinematicLastSec = -1;
    this.cinematicIsExport = true;
    this.cinematicOnProgress = (pct) => onProgress?.(pct);

    await new Promise<void>((resolve) => {
      this.cinematicOnDone = resolve;
      this.cinematicActive = true;
    });

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      recorder.stop();
    });

    this.stopPreview();
    this.setActiveRoom(startRoom);
    return { blob, mimeType };
  }

  public dispose() {
    this.stopPreview();
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.handleResize);
    this.waxRig?.dispose();
    this.gardenBuilt?.dispose();
    this.atmosphereSystem.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
