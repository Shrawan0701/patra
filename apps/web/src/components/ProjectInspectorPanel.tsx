import React, { useRef, useState } from 'react';
import { ImagePlus, Plus, Sparkles, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import {
  ATMOSPHERE_PARTICLES,
  AtmosphereConfig,
  CENTERPIECES,
  COLOR_PALETTES,
  CUTOUT_FILTERS,
  CUTOUT_PLACEMENTS,
  CUTOUT_SHAPES,
  CustomTextOverlay,
  DEFAULT_ATMOSPHERE,
  DEFAULT_PHOTO_CUTOUT,
  DEFAULT_PHOTO_CUTOUT_2,
  DEFAULT_WAX_SEAL,
  ENVELOPE_COLORS,
  FLOOR_PATTERNS,
  FONT_STYLES,
  FontStyleId,
  GARLANDS,
  GARDEN_STYLES,
  GardenConfig,
  LINER_PATTERNS,
  MUSIC_TRACKS,
  PhotoCutoutConfig,
  ProjectConfig,
  RoomConfig,
  SIDE_PROPS,
  STRUCTURES,
  SidePropId,
  StructureId,
  TIME_OF_DAY_OPTIONS,
  WALL_STYLES,
  WAX_COVER_STYLES,
  WAX_CRESTS,
  WAX_RIBBON_STYLES,
  WAX_SEAL_COLORS,
  WaxSealConfig,
  getDefaultGardenForProject,
  getPaletteById,
  getProjectTotalSeconds,
} from '@patra/shared';

export type InspectorTabId =
  | 'wax'
  | 'atmosphere'
  | 'text'
  | 'photo'
  | 'colors'
  | 'props'
  | 'rooms'
  | 'garden'
  | 'music'
  | 'format';

const TAB_LABELS: Record<InspectorTabId, string> = {
  wax: 'Wax & Cover',
  atmosphere: 'Atmosphere',
  text: 'Text',
  photo: 'Photo',
  colors: 'Colors',
  props: '3D Props',
  rooms: 'Rooms',
  garden: 'Garden',
  music: 'Music',
  format: 'Format',
};

const BORDER_SWATCHES = ['#FFF8EE', '#F7E1E4', '#E6ECE2', '#DFC79A', '#262128'];

function createPresetPortrait(theme: 'couple' | 'floral'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 420;
  canvas.height = 520;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 520);
  if (theme === 'couple') {
    grad.addColorStop(0, '#FFE4D6');
    grad.addColorStop(1, '#D28B72');
  } else {
    grad.addColorStop(0, '#E8F0E5');
    grad.addColorStop(1, '#7BA07E');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 420, 520);

  ctx.fillStyle = 'rgba(255,250,242,0.86)';
  ctx.beginPath();
  ctx.arc(210, 210, 120, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = theme === 'couple' ? '#4B2E28' : '#2C4A33';
  if (theme === 'couple') {
    ctx.beginPath();
    ctx.arc(170, 210, 34, 0, Math.PI * 2);
    ctx.arc(250, 216, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(170, 345, 62, 95, 0, Math.PI, Math.PI * 2);
    ctx.ellipse(250, 345, 58, 90, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  } else {
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.translate(210, 210);
      ctx.rotate((i * Math.PI) / 4);
      ctx.beginPath();
      ctx.ellipse(0, 54, 18, 42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#E6A63E';
    ctx.beginPath();
    ctx.arc(210, 210, 24, 0, Math.PI * 2);
    ctx.fill();
  }
  return canvas.toDataURL('image/jpeg', 0.85);
}

interface Props {
  project: ProjectConfig;
  setProject: React.Dispatch<React.SetStateAction<ProjectConfig>>;
  activeRoomIdx: number;
  setActiveRoomIdx: React.Dispatch<React.SetStateAction<number>>;
  tabs?: InspectorTabId[];
  activeTab: InspectorTabId;
  onTabChange: (tab: InspectorTabId) => void;
  onPlayWaxOpening?: () => void;
  onSyncAtmosphereAll?: (atmo: AtmosphereConfig) => void;
  onFocusPhoto?: (slot: 0 | 1 | 2) => void;
}

const DEFAULT_TABS: InspectorTabId[] = [
  'text',
  'photo',
  'colors',
  'props',
  'rooms',
  'garden',
  'music',
  'wax',
  'atmosphere',
  'format',
];

export function ProjectInspectorPanel({
  project,
  setProject,
  activeRoomIdx,
  setActiveRoomIdx,
  tabs = DEFAULT_TABS,
  activeTab,
  onTabChange,
  onPlayWaxOpening,
  onSyncAtmosphereAll,
  onFocusPhoto,
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [customTextDraft, setCustomTextDraft] = useState('');
  const [photoSlot, setPhotoSlot] = useState<1 | 2>(1);

  const activeRoom = project.rooms[activeRoomIdx] ?? project.rooms[0];
  const palette = getPaletteById(activeRoom.paletteId);
  const wax: WaxSealConfig = project.waxSeal ?? DEFAULT_WAX_SEAL;
  const garden: GardenConfig = getDefaultGardenForProject(project);
  const cutout1Enabled = Boolean(activeRoom?.photoCutout?.enabled);
  const cutout2Enabled = Boolean(activeRoom?.photoCutout2?.enabled);
  const cutout: PhotoCutoutConfig =
    photoSlot === 2
      ? (activeRoom?.photoCutout2 ?? DEFAULT_PHOTO_CUTOUT_2)
      : (activeRoom?.photoCutout ?? DEFAULT_PHOTO_CUTOUT);
  const atmo: AtmosphereConfig = activeRoom?.atmosphere ?? DEFAULT_ATMOSPHERE;

  const updateRoom = (patch: Partial<RoomConfig>) => {
    setProject((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r, i) => (i === activeRoomIdx ? { ...r, ...patch } : r)),
    }));
  };

  const updateSignage = (field: keyof RoomConfig['signage'], val: string) => {
    setProject((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r, i) =>
        i === activeRoomIdx ? { ...r, signage: { ...r.signage, [field]: val } } : r
      ),
    }));
  };

  const updateWax = (patch: Partial<WaxSealConfig>) => {
    setProject((prev) => ({
      ...prev,
      waxSeal: { ...(prev.waxSeal ?? DEFAULT_WAX_SEAL), ...patch },
    }));
  };

  const updateGarden = (patch: Partial<GardenConfig>) => {
    setProject((prev) => ({
      ...prev,
      garden: { ...getDefaultGardenForProject(prev), ...patch },
    }));
  };

  const updateCutout = (patch: Partial<PhotoCutoutConfig>) => {
    if (photoSlot === 2) {
      updateRoom({ photoCutout2: { ...cutout, ...patch } });
    } else {
      updateRoom({ photoCutout: { ...cutout, ...patch } });
    }
  };

  const updateAtmo = (patch: Partial<AtmosphereConfig>) => {
    updateRoom({ atmosphere: { ...atmo, ...patch } });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxEdge = 640;
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          updateCutout({
            enabled: true,
            imageDataUrl: canvas.toDataURL('image/jpeg', 0.85),
            cropZoom: 1,
            cropX: 0,
            cropY: 0,
          });
        }
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  };

  const addCustomText = () => {
    const txt = customTextDraft.trim();
    if (!txt) return;
    const item: CustomTextOverlay = {
      id: `ct_${Date.now()}`,
      text: txt,
      x: 0,
      y: 0.56,
      scale: 1,
      color: palette.inkColor,
      fontStyle: activeRoom.fontStyle,
    };
    updateRoom({ customTexts: [...(activeRoom.customTexts ?? []), item] });
    setCustomTextDraft('');
  };

  const toggleSideProp = (propId: SidePropId) => {
    const exists = activeRoom.sideProps.includes(propId);
    const next = exists
      ? activeRoom.sideProps.filter((x) => x !== propId)
      : [...activeRoom.sideProps, propId].slice(0, 4);
    updateRoom({ sideProps: next });
  };

  return (
    <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        className="tab-strip"
        style={{
          flexWrap: 'wrap',
          gap: '10px',
          paddingBottom: 14,
          marginBottom: 2,
          borderBottom: '1px solid var(--border)',
        }}
      >
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            className={`chip-btn ${activeTab === t ? 'active' : ''}`}
            style={{ padding: '8px 13px' }}
            onClick={() => onTabChange(t)}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {activeTab === 'wax' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>Floral Gatefold &amp; Wax Seal Intro</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Opens with illustrated garlands &amp; seal before the 3D stage</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {onPlayWaxOpening && (
                <button type="button" className="btn btn-sm" onClick={onPlayWaxOpening}>
                  <Sparkles size={13} /> Unseal 3D
                </button>
              )}
              <button
                type="button"
                className={`btn btn-sm ${wax.enabled ? 'btn-primary' : ''}`}
                onClick={() => updateWax({ enabled: !wax.enabled })}
              >
                {wax.enabled ? 'Active' : 'Turn On'}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 6 }}>
              Cover &amp; Garland Card Style
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {WAX_COVER_STYLES.map((cs) => {
                const selected = (wax.coverStyle ?? 'wax_envelope') === cs.id;
                return (
                  <button
                    key={cs.id}
                    type="button"
                    className={`btn ${selected ? 'btn-primary' : ''}`}
                    style={{ justifyContent: 'space-between', padding: '9px 11px', textAlign: 'left', gap: 8 }}
                    onClick={() => updateWax({ enabled: true, coverStyle: cs.id })}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1 }}>
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 999,
                          background: cs.accentHex,
                          flexShrink: 0,
                          border: '1px solid rgba(255,255,255,0.45)',
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 12.5 }}>{cs.name}</div>
                        <div style={{ fontSize: 11, opacity: 0.78 }}>{cs.subtitle}</div>
                      </div>
                    </div>
                    <span className="badge" style={{ fontSize: 10 }}>{cs.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: 'var(--bg-soft, rgba(0,0,0,0.03))' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>Cover / Seal Duration Timestamp</div>
              <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>Time spent opening the floral seal</div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() =>
                  updateWax({
                    enabled: true,
                    durationSeconds: Math.max(2, (wax.durationSeconds ?? 4) - 1),
                  })
                }
              >
                -
              </button>
              <strong style={{ fontSize: 13, minWidth: 28, textAlign: 'center' }}>
                {wax.durationSeconds ?? 4}s
              </strong>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() =>
                  updateWax({
                    enabled: true,
                    durationSeconds: Math.min(8, (wax.durationSeconds ?? 4) + 1),
                  })
                }
              >
                +
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 12, marginBottom: 4 }}>
                Card Top Subtitle
              </label>
              <input
                className="input"
                maxLength={42}
                value={wax.coverSubtitle ?? ''}
                onChange={(e) => updateWax({ enabled: true, coverSubtitle: e.target.value })}
                placeholder="together with their families"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 12, marginBottom: 4 }}>
                Date &amp; City Line
              </label>
              <input
                className="input"
                maxLength={42}
                value={wax.coverDateVenue ?? ''}
                onChange={(e) => updateWax({ enabled: true, coverDateVenue: e.target.value })}
                placeholder="11 feb - 13 feb · jaipur"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 6 }}>
              Wax Crest Emblem
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {WAX_CRESTS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`btn btn-sm ${wax.crest === c.id ? 'btn-primary' : ''}`}
                  style={{ justifyContent: 'center' }}
                  onClick={() => updateWax({ enabled: true, crest: c.id })}
                >
                  <span>{c.symbol}</span> {c.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 4 }}>
                Monogram
              </label>
              <input
                className="input"
                maxLength={5}
                value={wax.monogram}
                onChange={(e) => updateWax({ enabled: true, monogram: e.target.value })}
                placeholder="A&M"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 4 }}>
                Inner Card Headline
              </label>
              <input
                className="input"
                maxLength={32}
                value={wax.headline}
                onChange={(e) => updateWax({ enabled: true, headline: e.target.value })}
                placeholder="You Are Warmly Invited"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 6 }}>
                Wax Color
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {WAX_SEAL_COLORS.map((sw) => (
                  <button
                    key={sw.id}
                    type="button"
                    title={sw.name}
                    onClick={() => updateWax({ enabled: true, waxColor: sw.hex })}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      background: sw.hex,
                      border: wax.waxColor === sw.hex ? '3px solid var(--ink)' : '1px solid rgba(0,0,0,0.2)',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 6 }}>
                Envelope Paper
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ENVELOPE_COLORS.map((sw) => (
                  <button
                    key={sw.id}
                    type="button"
                    title={sw.name}
                    onClick={() => updateWax({ enabled: true, envelopeColor: sw.hex })}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      background: sw.hex,
                      border: wax.envelopeColor === sw.hex ? '3px solid var(--ink)' : '1px solid rgba(0,0,0,0.2)',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 6 }}>
              Foil Liner Pattern
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {LINER_PATTERNS.map((lp) => (
                <button
                  key={lp.id}
                  type="button"
                  className={`btn btn-sm ${wax.linerPattern === lp.id ? 'btn-primary' : ''}`}
                  style={{ justifyContent: 'flex-start' }}
                  onClick={() => updateWax({ enabled: true, linerPattern: lp.id })}
                >
                  {lp.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 4 }}>
                Ribbon Wrap
              </label>
              <select
                className="input"
                value={wax.ribbonStyle}
                onChange={(e) => updateWax({ enabled: true, ribbonStyle: e.target.value as WaxSealConfig['ribbonStyle'] })}
              >
                {WAX_RIBBON_STYLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 4 }}>
                Opening Pace
              </label>
              <select
                className="input"
                value={wax.openSpeed}
                onChange={(e) => updateWax({ enabled: true, openSpeed: e.target.value as WaxSealConfig['openSpeed'] })}
              >
                <option value="slow">Slow &amp; Regal</option>
                <option value="normal">Classic Balanced</option>
                <option value="brisk">Brisk Reveal</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'atmosphere' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: 13.5 }}>Time of Day ({activeRoom.label})</strong>
            {project.rooms.length > 1 && onSyncAtmosphereAll && (
              <button type="button" className="btn btn-sm" onClick={() => onSyncAtmosphereAll(atmo)}>
                <Sparkles size={13} /> Sync All Rooms
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {TIME_OF_DAY_OPTIONS.map((tod) => {
              const selected = atmo.timeOfDay === tod.id;
              return (
                <button
                  key={tod.id}
                  type="button"
                  className={`btn btn-sm ${selected ? 'btn-primary' : ''}`}
                  style={{ justifyContent: 'space-between', padding: '9px 12px' }}
                  onClick={() => updateAtmo({ timeOfDay: tod.id })}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 999,
                        background: `linear-gradient(135deg, ${tod.skyTop}, ${tod.skyBottom})`,
                        border: '1px solid rgba(0,0,0,0.2)',
                      }}
                    />
                    <strong>{tod.name}</strong>
                  </span>
                  <span style={{ fontSize: 11, opacity: 0.8 }}>{tod.subtitle}</span>
                </button>
              );
            })}
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 6 }}>
              Floating 3D Particles
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {ATMOSPHERE_PARTICLES.map((pt) => (
                <button
                  key={pt.id}
                  type="button"
                  className={`btn btn-sm ${atmo.particles === pt.id ? 'btn-primary' : ''}`}
                  style={{ justifyContent: 'flex-start', gap: 7 }}
                  onClick={() => updateAtmo({ particles: pt.id })}
                >
                  <span style={{ width: 9, height: 9, borderRadius: 999, background: pt.color }} />
                  <span>{pt.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 4 }}>
                Particle Density
              </label>
              <div style={{ display: 'flex', gap: 5 }}>
                {(['subtle', 'lush', 'festive'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`btn btn-sm ${atmo.particleDensity === d ? 'btn-primary' : ''}`}
                    style={{ flex: 1, textTransform: 'capitalize' }}
                    onClick={() => updateAtmo({ particleDensity: d })}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 4 }}>
                Camera Motion
              </label>
              <select
                className="input"
                value={atmo.cameraMotion}
                onChange={(e) => updateAtmo({ cameraMotion: e.target.value as AtmosphereConfig['cameraMotion'] })}
              >
                <option value="gentle_orbit">Gentle Orbit</option>
                <option value="cinematic_push">Cinematic Push</option>
                <option value="steady">Steady Stage</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 12.5, marginBottom: 4 }}>
              <span>Warm Diya &amp; Lamp Glow</span>
              <span>{Math.round(atmo.lampGlow * 100)}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={atmo.lampGlow}
              onChange={(e) => updateAtmo({ lampGlow: Number(e.target.value) })}
            />
          </div>
        </div>
      )}

      {activeTab === 'photo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className={`btn btn-sm ${photoSlot === 1 ? 'btn-primary' : ''}`}
                onClick={() => setPhotoSlot(1)}
              >
                Photo 1 {cutout1Enabled ? '• On' : ''}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${photoSlot === 2 ? 'btn-primary' : ''}`}
                onClick={() => setPhotoSlot(2)}
              >
                Photo 2 {cutout2Enabled ? '• On' : ''}
              </button>
            </div>
            <button
              type="button"
              className={`btn btn-sm ${cutout.enabled ? 'btn-primary' : ''}`}
              onClick={() => updateCutout({ enabled: !cutout.enabled })}
            >
              {cutout.enabled ? `Slot ${photoSlot} Visible` : `Enable Slot ${photoSlot}`}
            </button>
          </div>

          {/* Interactive Live 2D Crop & Filter Preview */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              padding: 10,
              borderRadius: 10,
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                width: 72,
                height: 88,
                borderRadius: cutout.shape === 'circle' ? 999 : cutout.shape === 'arch' ? '36px 36px 4px 4px' : 8,
                overflow: 'hidden',
                border: `4px solid ${cutout.paperBorderColor || '#FFF8EE'}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.14)',
                flexShrink: 0,
                background: '#E8DFD1',
              }}
            >
              <img
                src={cutout.imageDataUrl || createPresetPortrait(photoSlot === 2 ? 'floral' : 'couple')}
                alt={`Cutout slot ${photoSlot}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: `scale(${cutout.cropZoom ?? 1}) translate(${(cutout.cropX ?? 0) * 28}%, ${(cutout.cropY ?? 0) * 28}%)`,
                  filter:
                    cutout.filter === 'monochrome_noir'
                      ? 'grayscale(1)'
                      : cutout.filter === 'sepia_editorial'
                        ? 'sepia(0.65)'
                        : cutout.filter === 'vintage_warm'
                          ? 'sepia(0.2) saturate(1.12)'
                          : 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => fileRef.current?.click()}>
                  <ImagePlus size={14} /> Upload Photo {photoSlot}
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => updateCutout({ enabled: true, imageDataUrl: createPresetPortrait(photoSlot === 2 ? 'floral' : 'couple') })}
                >
                  <Sparkles size={13} /> Sample
                </button>
                {cutout.imageDataUrl && (
                  <button type="button" className="btn btn-sm" onClick={() => updateCutout({ imageDataUrl: '' })}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              {onFocusPhoto && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      if (!cutout.enabled) updateCutout({ enabled: true });
                      onFocusPhoto(photoSlot);
                    }}
                  >
                    <ZoomIn size={13} /> Zoom Into Photo {photoSlot}
                  </button>
                  <button type="button" className="btn btn-sm" onClick={() => onFocusPhoto(0)}>
                    <ZoomOut size={13} /> Full Stage
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, marginBottom: 3 }}>
                Photo Zoom ({(cutout.cropZoom ?? 1).toFixed(1)}x)
              </label>
              <input
                type="range"
                min={1}
                max={3.0}
                step={0.1}
                value={cutout.cropZoom ?? 1}
                onChange={(e) => updateCutout({ enabled: true, cropZoom: Number(e.target.value) })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, marginBottom: 3 }}>
                Crop Pan X
              </label>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.05}
                value={cutout.cropX ?? 0}
                onChange={(e) => updateCutout({ enabled: true, cropX: Number(e.target.value) })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, marginBottom: 3 }}>
                Crop Pan Y
              </label>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.05}
                value={cutout.cropY ?? 0}
                onChange={(e) => updateCutout({ enabled: true, cropY: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 6 }}>
              Die-Cut Shape
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {CUTOUT_SHAPES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`btn btn-sm ${cutout.shape === s.id ? 'btn-primary' : ''}`}
                  onClick={() => updateCutout({ enabled: true, shape: s.id })}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 6 }}>
              3D Mount Style
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {CUTOUT_PLACEMENTS.map((pl) => (
                <button
                  key={pl.id}
                  type="button"
                  className={`btn btn-sm ${cutout.placement === pl.id ? 'btn-primary' : ''}`}
                  style={{ justifyContent: 'space-between', padding: '8px 10px' }}
                  onClick={() => updateCutout({ enabled: true, placement: pl.id })}
                >
                  <strong>{pl.name}</strong>
                  <span style={{ fontSize: 11, opacity: 0.78 }}>{pl.subtitle}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 4 }}>
                Film Filter
              </label>
              <select
                className="input"
                value={cutout.filter}
                onChange={(e) => updateCutout({ enabled: true, filter: e.target.value as PhotoCutoutConfig['filter'] })}
              >
                {CUTOUT_FILTERS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 4 }}>
                Caption
              </label>
              <input
                className="input"
                maxLength={26}
                value={cutout.caption}
                onChange={(e) => updateCutout({ enabled: true, caption: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 12, marginBottom: 4 }}>
                Cardstock Border
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                {BORDER_SWATCHES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => updateCutout({ enabled: true, paperBorderColor: hex })}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 5,
                      background: hex,
                      border: cutout.paperBorderColor === hex ? '3px solid var(--ink)' : '1px solid rgba(0,0,0,0.2)',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, marginBottom: 3 }}>
                3D Size ({cutout.scale.toFixed(1)}x)
              </label>
              <input
                type="range"
                min={0.65}
                max={1.85}
                step={0.05}
                value={cutout.scale}
                onChange={(e) => updateCutout({ enabled: true, scale: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, marginBottom: 3 }}>
                Move X
              </label>
              <input
                type="range"
                min={-1.15}
                max={1.15}
                step={0.05}
                value={cutout.offsetX}
                onChange={(e) => updateCutout({ enabled: true, offsetX: Number(e.target.value) })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, marginBottom: 3 }}>
                Move Z
              </label>
              <input
                type="range"
                min={-0.65}
                max={1.1}
                step={0.05}
                value={cutout.offsetZ}
                onChange={(e) => updateCutout({ enabled: true, offsetZ: Number(e.target.value) })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, marginBottom: 3 }}>
                Turn Angle
              </label>
              <input
                type="range"
                min={-1.2}
                max={1.2}
                step={0.08}
                value={cutout.rotationY ?? 0.2}
                onChange={(e) => updateCutout({ enabled: true, rotationY: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'text' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 4 }}>
              Font Style
            </label>
            <div className="chip-row">
              {FONT_STYLES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`chip-btn ${(activeRoom.fontStyle ?? 'royal_serif') === f.id ? 'active' : ''}`}
                  onClick={() => updateRoom({ fontStyle: f.id as FontStyleId })}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
          {(
            [
              ['eventTitle', 'Main Heading'],
              ['hostLine', 'Subtitle / Hosts'],
              ['dateText', 'Date'],
              ['timeText', 'Time'],
              ['venueText', 'Venue Address'],
              ['noteText', 'Closing Note'],
            ] as const
          ).map(([field, label]) => (
            <div key={field}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 12, marginBottom: 3 }}>
                {label}
              </label>
              <input
                className="input"
                value={activeRoom.signage[field]}
                onChange={(e) => updateSignage(field, e.target.value)}
              />
            </div>
          ))}

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 6 }}>
              Draggable Wall Callouts
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                placeholder="Add label to drag onto wall..."
                value={customTextDraft}
                onChange={(e) => setCustomTextDraft(e.target.value)}
              />
              <button type="button" className="btn btn-primary btn-sm" onClick={addCustomText}>
                <Plus size={14} /> Add
              </button>
            </div>
            {(activeRoom.customTexts ?? []).map((ct) => (
              <div key={ct.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <span style={{ fontSize: 12.5 }}>{ct.text}</span>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() =>
                    updateRoom({
                      customTexts: (activeRoom.customTexts ?? []).filter((x) => x.id !== ct.id),
                    })
                  }
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'colors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 6 }}>
              Color Palette ({COLOR_PALETTES.length})
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7, maxHeight: 220, overflowY: 'auto' }}>
              {COLOR_PALETTES.map((pal) => (
                <button
                  key={pal.id}
                  type="button"
                  className={`btn btn-sm ${activeRoom.paletteId === pal.id ? 'btn-primary' : ''}`}
                  style={{ justifyContent: 'flex-start', gap: 6, padding: '7px 8px' }}
                  onClick={() => updateRoom({ paletteId: pal.id })}
                >
                  <span style={{ width: 12, height: 12, borderRadius: 999, background: pal.accentPrimary, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pal.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 4 }}>
                Wall Architecture
              </label>
              <select
                className="input"
                value={activeRoom.wallStyle}
                onChange={(e) => updateRoom({ wallStyle: e.target.value as RoomConfig['wallStyle'] })}
              >
                {WALL_STYLES.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 4 }}>
                Floor Pattern
              </label>
              <select
                className="input"
                value={activeRoom.floorPattern}
                onChange={(e) => updateRoom({ floorPattern: e.target.value as RoomConfig['floorPattern'] })}
              >
                {FLOOR_PATTERNS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'props' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 4 }}>
              Hero Centerpiece
            </label>
            <select
              className="input"
              value={activeRoom.centerpiece}
              onChange={(e) => updateRoom({ centerpiece: e.target.value as RoomConfig['centerpiece'] })}
            >
              {CENTERPIECES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 4 }}>
              Ceiling &amp; Wall Garland
            </label>
            <select
              className="input"
              value={activeRoom.garland}
              onChange={(e) => updateRoom({ garland: e.target.value as RoomConfig['garland'] })}
            >
              {GARLANDS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 6 }}>
              Perimeter Props (up to 4)
            </label>
            <div className="chip-row">
              {SIDE_PROPS.map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  className={`chip-btn ${activeRoom.sideProps.includes(sp.id) ? 'active' : ''}`}
                  onClick={() => toggleSideProp(sp.id)}
                >
                  {sp.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'garden' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>Estate Garden &amp; Flower Walk</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Frames every pavilion with an entrance gate &amp; side planters</div>
            </div>
            <button
              type="button"
              className={`btn btn-sm ${garden.enabled ? 'btn-primary' : ''}`}
              onClick={() => updateGarden({ enabled: !garden.enabled })}
            >
              {garden.enabled ? 'Visible' : 'Enable Garden'}
            </button>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 6 }}>
              Landscape Theme
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {GARDEN_STYLES.map((gs) => {
                const selected = garden.style === gs.id;
                return (
                  <button
                    key={gs.id}
                    type="button"
                    className={`btn ${selected ? 'btn-primary' : ''}`}
                    style={{ justifyContent: 'flex-start', padding: '9px 11px', textAlign: 'left', gap: 9 }}
                    onClick={() => updateGarden({ enabled: true, style: gs.id })}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 999,
                        background: `linear-gradient(135deg, ${gs.lawnHex}, ${gs.accentHex})`,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12.5 }}>{gs.name}</div>
                      <div style={{ fontSize: 11, opacity: 0.78 }}>{gs.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: 'var(--bg-soft, rgba(0,0,0,0.03))' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>Entrance Archway Gate</div>
              <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>Floral arch welcoming guests up the stone path</div>
            </div>
            <button
              type="button"
              className={`btn btn-sm ${garden.hasEntranceArch ? 'btn-primary' : ''}`}
              onClick={() => updateGarden({ enabled: true, hasEntranceArch: !garden.hasEntranceArch })}
            >
              {garden.hasEntranceArch ? 'On' : 'Off'}
            </button>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 6 }}>
              Side Flower Pots &amp; Lanterns
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {(
                [
                  ['minimal', 'Clean Trim'],
                  ['balanced', 'Balanced'],
                  ['lush', 'Lush Estate'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`btn btn-sm ${garden.potDensity === id ? 'btn-primary' : ''}`}
                  style={{ justifyContent: 'center' }}
                  onClick={() => updateGarden({ enabled: true, potDensity: id })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: 'var(--bg-soft, rgba(0,0,0,0.03))' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>Garden Entrance Timestamp</div>
              <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>0s skips entrance sweep (keeps side pots visible)</div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() =>
                  updateGarden({
                    enabled: true,
                    entranceDurationSeconds: Math.max(0, (garden.entranceDurationSeconds ?? 3) - 1),
                  })
                }
              >
                -
              </button>
              <strong style={{ fontSize: 13, minWidth: 28, textAlign: 'center' }}>
                {garden.entranceDurationSeconds ?? 3}s
              </strong>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() =>
                  updateGarden({
                    enabled: true,
                    entranceDurationSeconds: Math.min(8, (garden.entranceDurationSeconds ?? 3) + 1),
                  })
                }
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rooms' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: '9px 11px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-soft, rgba(0,0,0,0.025))', fontSize: 12 }}>
            <strong>Timeline ({getProjectTotalSeconds(project)}s total):</strong>{' '}
            Garden {garden.enabled ? `${garden.entranceDurationSeconds ?? 3}s` : 'Off'} + Cover/Seal{' '}
            {wax.enabled ? `${wax.durationSeconds ?? 4}s` : 'Off'} + Rooms{' '}
            {project.rooms.reduce((s, r) => s + Math.max(4, Math.min(25, r.durationSeconds ?? 8)), 0)}s
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 6 }}>
              3D Structure Style
            </label>
            <div className="chip-row">
              {STRUCTURES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  className={`chip-btn ${(project.structure ?? 'carousel_gable') === st.id ? 'active' : ''}`}
                  onClick={() => setProject((p) => ({ ...p, structure: st.id as StructureId }))}
                >
                  {st.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 6 }}>
              Fold Geometry
            </label>
            <div className="chip-row">
              {([2, 3, 4] as const).map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  className={`chip-btn ${(project.cornersCount ?? 4) === cnt ? 'active' : ''}`}
                  onClick={() =>
                    setProject((p) => ({
                      ...p,
                      cornersCount: cnt,
                      rooms: p.rooms.slice(0, cnt),
                    }))
                  }
                >
                  {cnt} {cnt === 2 ? 'Wings' : 'Corners'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: 13 }}>Rooms ({project.rooms.length}/4)</strong>
            {project.rooms.length < 4 && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() =>
                  setProject((p) => ({
                    ...p,
                    rooms: [
                      ...p.rooms,
                      {
                        ...activeRoom,
                        id: `room_${Date.now()}`,
                        label: `Ceremony ${p.rooms.length + 1}`,
                      },
                    ],
                  }))
                }
              >
                <Plus size={13} /> Add Room
              </button>
            )}
          </div>

          {project.rooms.map((r, idx) => (
            <div
              key={r.id}
              style={{
                padding: 10,
                borderRadius: 8,
                border: idx === activeRoomIdx ? '2px solid var(--accent)' : '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  className="input"
                  value={r.label}
                  onFocus={() => setActiveRoomIdx(idx)}
                  onChange={(e) =>
                    setProject((p) => ({
                      ...p,
                      rooms: p.rooms.map((rm, i) => (i === idx ? { ...rm, label: e.target.value } : rm)),
                    }))
                  }
                />
                {project.rooms.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      setProject((p) => ({
                        ...p,
                        rooms: p.rooms.filter((_, i) => i !== idx),
                      }));
                      setActiveRoomIdx(0);
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Duration</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() =>
                      setProject((p) => ({
                        ...p,
                        rooms: p.rooms.map((rm, i) =>
                          i === idx ? { ...rm, durationSeconds: Math.max(4, (rm.durationSeconds ?? 8) - 1) } : rm
                        ),
                      }))
                    }
                  >
                    -
                  </button>
                  <strong style={{ fontSize: 12.5 }}>{r.durationSeconds ?? 8}s</strong>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() =>
                      setProject((p) => ({
                        ...p,
                        rooms: p.rooms.map((rm, i) =>
                          i === idx ? { ...rm, durationSeconds: Math.min(25, (rm.durationSeconds ?? 8) + 1) } : rm
                        ),
                      }))
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'music' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MUSIC_TRACKS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`btn btn-sm ${project.musicId === m.id ? 'btn-primary' : ''}`}
              style={{ justifyContent: 'space-between', padding: '10px 12px' }}
              onClick={() => setProject((p) => ({ ...p, musicId: m.id }))}
            >
              <strong>{m.name}</strong>
              <span style={{ fontSize: 11.5, opacity: 0.78 }}>{m.mood}</span>
            </button>
          ))}
        </div>
      )}

      {activeTab === 'format' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(
            [
              ['9:16', 'Vertical Reels & WhatsApp Status'],
              ['1:1', 'Square Chat & Feed'],
              ['16:9', 'Widescreen YouTube & TV'],
            ] as const
          ).map(([ratio, desc]) => (
            <button
              key={ratio}
              type="button"
              className={`btn btn-sm ${project.aspectRatio === ratio ? 'btn-primary' : ''}`}
              style={{ justifyContent: 'space-between', padding: '11px 12px' }}
              onClick={() => setProject((p) => ({ ...p, aspectRatio: ratio }))}
            >
              <strong>{ratio}</strong>
              <span style={{ fontSize: 12, opacity: 0.8 }}>{desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
