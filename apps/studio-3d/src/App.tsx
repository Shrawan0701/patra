import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CATEGORIES,
  CENTERPIECES,
  COLOR_PALETTES,
  CategoryId,
  CustomTextOverlay,
  FLOOR_PATTERNS,
  FONT_STYLES,
  FontStyleId,
  GARLANDS,
  MUSIC_TRACKS,
  ProjectConfig,
  RoomConfig,
  SIDE_PROPS,
  SidePropId,
  STRUCTURES,
  StructureId,
  TEMPLATES,
  WALL_STYLES,
  createCustomProject,
  getPaletteById,
  getProjectTotalSeconds,
} from '@patra/shared';
import { Download, FoldVertical, Play, Plus, RotateCw, Sparkles, Square, Volume2, VolumeX } from 'lucide-react';
import { CarouselScene } from './three/CarouselScene';
import { MusicSynth } from './audio/MusicSynth';

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (msg: string) => void;
    };
    __PATRA_MSG__?: (raw: unknown) => void;
  }
}

function sendToNative(type: string, payload?: unknown) {
  const msg = JSON.stringify({ type, payload });
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(msg);
  } else if (window.parent !== window) {
    window.parent.postMessage(msg, '*');
  }
}

export function App() {
  const isEmbed = useMemo(() => new URLSearchParams(window.location.search).get('embed') === '1', []);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<CarouselScene | null>(null);
  const synthRef = useRef<MusicSynth | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const pendingPhotoSlotRef = useRef<1 | 2>(1);

  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('wedding');
  const [activeTemplateId, setActiveTemplateId] = useState<string>(TEMPLATES[0].id);
  const [project, setProject] = useState<ProjectConfig>(() => structuredClone(TEMPLATES[0].project));
  const [activeRoomIdx, setActiveRoomIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewInfo, setPreviewInfo] = useState({ pct: 0, elapsed: 0, total: 0 });
  const [isExporting, setIsExporting] = useState(false);
  const [exportPct, setExportPct] = useState(0);
  const [newCustomText, setNewCustomText] = useState('');

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new CarouselScene(mountRef.current, project);
    scene.setOnCustomTextMoved((roomIndex, id, x, y) => {
      setProject((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r, i) =>
          i === roomIndex
            ? {
                ...r,
                customTexts: (r.customTexts ?? []).map((ct) =>
                  ct.id === id ? { ...ct, x, y } : ct
                ),
              }
            : r
        ),
      }));
      sendToNative('CUSTOM_TEXT_MOVED', { roomIndex, id, x, y });
    });
    scene.setOnPhotoCutoutMoved((roomIndex, slot, offsetX, offsetZ) => {
      setProject((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r, i) => {
          if (i !== roomIndex) return r;
          if (slot === 2 && r.photoCutout2) {
            return { ...r, photoCutout2: { ...r.photoCutout2, offsetX, offsetZ } };
          }
          if (slot === 1 && r.photoCutout) {
            return { ...r, photoCutout: { ...r.photoCutout, offsetX, offsetZ } };
          }
          return r;
        }),
      }));
      sendToNative('PHOTO_CUTOUT_MOVED', { roomIndex, slot, offsetX, offsetZ });
    });
    const synth = new MusicSynth();
    synth.setTrack(project.musicId);

    sceneRef.current = scene;
    synthRef.current = synth;

    setTimeout(() => scene.playEntranceUnfold(), 250);
    sendToNative('READY');

    return () => {
      synth.stop();
      scene.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sceneRef.current?.updateProject(project, activeRoomIdx);
    synthRef.current?.setTrack(project.musicId);
  }, [project, activeRoomIdx]);

  const startLivePreview = () => {
    if (!sceneRef.current || !synthRef.current || isExporting) return;
    setIsPreviewing(true);
    synthRef.current.start(false);
    sceneRef.current.startPreview(
      (pct, elapsed, total) => {
        setPreviewInfo({ pct, elapsed, total });
        sendToNative('PREVIEW_PROGRESS', { pct, elapsed, total });
      },
      () => {
        setIsPreviewing(false);
        if (isMuted) synthRef.current?.stop();
        sendToNative('PREVIEW_DONE');
      }
    );
  };

  const stopLivePreview = () => {
    sceneRef.current?.stopPreview();
    if (isMuted) synthRef.current?.stop();
    setIsPreviewing(false);
    sendToNative('PREVIEW_DONE');
  };

  useEffect(() => {
    const processPayload = async (input: unknown) => {
      try {
        const raw = typeof input === 'string' ? JSON.parse(input) : input;
        if (!raw || typeof (raw as { type?: unknown }).type !== 'string') return;
        const msg = raw as { type: string; payload?: unknown; activeRoomIdx?: number };

        if (msg.type === 'SET_PROJECT' && msg.payload) {
          const nextProj = msg.payload as ProjectConfig;
          setProject(nextProj);
          if (typeof msg.activeRoomIdx === 'number') {
            setActiveRoomIdx(msg.activeRoomIdx);
            sceneRef.current?.setActiveRoom(msg.activeRoomIdx);
          }
        } else if (msg.type === 'SET_ROOM' && typeof msg.payload === 'number') {
          setActiveRoomIdx(msg.payload);
          sceneRef.current?.setActiveRoom(msg.payload);
        } else if (msg.type === 'TOGGLE_FOLD') {
          sceneRef.current?.toggleFold(typeof msg.payload === 'boolean' ? msg.payload : undefined);
        } else if (msg.type === 'PLAY_UNFOLD') {
          sceneRef.current?.playEntranceUnfold();
        } else if (msg.type === 'TOGGLE_AUDIO') {
          const nextMuted = typeof msg.payload === 'boolean' ? msg.payload : !isMuted;
          setIsMuted(nextMuted);
          synthRef.current?.setMuted(nextMuted);
        } else if (msg.type === 'START_PREVIEW') {
          startLivePreview();
        } else if (msg.type === 'STOP_PREVIEW') {
          stopLivePreview();
        } else if (msg.type === 'SET_VIEW_MODE') {
          const mode =
            msg.payload === 'wax_envelope'
              ? 'wax_envelope'
              : msg.payload === 'garden_entrance'
              ? 'garden_entrance'
              : 'stage';
          sceneRef.current?.setViewMode(mode);
        } else if (msg.type === 'PLAY_WAX_OPENING') {
          sceneRef.current?.playWaxOpening();
        } else if (msg.type === 'SET_CAMERA_ZOOM' && typeof msg.payload === 'number') {
          sceneRef.current?.setCameraZoom(msg.payload);
        } else if (msg.type === 'FOCUS_PHOTO') {
          const slot = msg.payload === 1 || msg.payload === 2 ? msg.payload : 0;
          sceneRef.current?.focusPhoto(slot);
        } else if (msg.type === 'PICK_PHOTO') {
          const slotPayload = (msg.payload as { slot?: unknown } | undefined)?.slot;
          pendingPhotoSlotRef.current = slotPayload === 2 ? 2 : 1;
          photoInputRef.current?.click();
        } else if (msg.type === 'START_EXPORT') {
          await triggerVideoExport(true);
        }
      } catch {
        // Ignore non-JSON postMessages
      }
    };

    window.__PATRA_MSG__ = (raw: unknown) => {
      void processPayload(raw);
    };
    const handleMessage = (event: MessageEvent) => {
      void processPayload(event.data);
    };

    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage as unknown as EventListener);
    return () => {
      delete window.__PATRA_MSG__;
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('message', handleMessage as unknown as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMuted]);

  const activeRoom = project.rooms[activeRoomIdx] ?? project.rooms[0];
  const categoryTemplates = useMemo(
    () => TEMPLATES.filter((t) => t.category === selectedCategory),
    [selectedCategory]
  );

  const totalVideoSeconds = useMemo(() => getProjectTotalSeconds(project), [project]);

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

  const activePalette = getPaletteById(activeRoom.paletteId);

  const addCustomText = () => {
    const trimmed = newCustomText.trim();
    if (!trimmed) return;
    const item: CustomTextOverlay = {
      id: `ct_${Date.now()}`,
      text: trimmed,
      x: 0,
      y: 0.56,
      scale: 1,
      color: activePalette.inkColor,
      fontStyle: activeRoom.fontStyle,
    };
    updateRoom({ customTexts: [...(activeRoom.customTexts ?? []), item] });
    setNewCustomText('');
  };

  const updateCustomText = (id: string, patch: Partial<CustomTextOverlay>) => {
    updateRoom({
      customTexts: (activeRoom.customTexts ?? []).map((ct) =>
        ct.id === id ? { ...ct, ...patch } : ct
      ),
    });
  };

  const removeCustomText = (id: string) => {
    updateRoom({
      customTexts: (activeRoom.customTexts ?? []).filter((ct) => ct.id !== id),
    });
  };

  const toggleSideProp = (id: SidePropId) => {
    const exists = activeRoom.sideProps.includes(id);
    const next = exists
      ? activeRoom.sideProps.filter((p) => p !== id)
      : [...activeRoom.sideProps, id].slice(0, 4);
    updateRoom({ sideProps: next });
  };

  const triggerVideoExport = async (sendBase64ToNative = false) => {
    if (!sceneRef.current || !synthRef.current || isExporting) return;
    stopLivePreview();
    setIsExporting(true);
    setExportPct(0);

    try {
      const audioStream = synthRef.current.start(true);
      const { blob, mimeType } = await sceneRef.current.exportShowcaseVideo(audioStream, (pct) => {
        setExportPct(pct);
        sendToNative('EXPORT_PROGRESS', { pct });
      });
      if (isMuted) synthRef.current.stop();

      if (sendBase64ToNative) {
        const reader = new FileReader();
        reader.onloadend = () => {
          sendToNative('EXPORT_COMPLETE', {
            dataUrl: reader.result,
            mimeType,
            title: project.title,
          });
        };
        reader.readAsDataURL(blob);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        a.download = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const hiddenPhotoInput = (
    <input
      ref={photoInputRef}
      type="file"
      accept="image/*"
      style={{ display: 'none' }}
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const maxEdge = 560;
            const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
            const w = Math.max(1, Math.round(img.width * scale));
            const h = Math.max(1, Math.round(img.height * scale));
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, w, h);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.84);
              sendToNative('PHOTO_PICKED', { dataUrl, slot: pendingPhotoSlotRef.current });
            }
          };
          img.src = String(reader.result || '');
        };
        reader.readAsDataURL(file);
      }}
    />
  );

  if (isEmbed) {
    return (
      <div className="embed-shell">
        <div ref={mountRef} className="canvas-mount" />
        {hiddenPhotoInput}
        {isExporting && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(26, 23, 21, 0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            Rendering 3D Video... {exportPct}%
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="studio-shell">
      <aside className="panel left">
        <div className="brand-title">
          <img
            src="/patra-logo.png"
            alt="Patra 3D Logo"
            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(26,23,21,0.12)' }}
          />
          Patra <span className="brand-badge">3D Studio</span>
        </div>

        <div>
          <div className="section-label">9 Categories</div>
          <div className="cat-pills">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`pill-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.shortName}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="section-label">Curated Templates (3)</div>
          {categoryTemplates.map((tpl) => (
            <button
              key={tpl.id}
              className={`tpl-card ${activeTemplateId === tpl.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTemplateId(tpl.id);
                setProject(structuredClone(tpl.project));
                setActiveRoomIdx(0);
                sceneRef.current?.playEntranceUnfold();
              }}
            >
              <span className="tpl-name">{tpl.name}</span>
              <span className="tpl-sub">{tpl.subtitle}</span>
            </button>
          ))}

          <button
            className="tpl-card"
            style={{ borderStyle: 'dashed', borderColor: '#c83e37' }}
            onClick={() => {
              setActiveTemplateId('custom');
              setProject(createCustomProject(selectedCategory, 1));
              setActiveRoomIdx(0);
              sceneRef.current?.playEntranceUnfold();
            }}
          >
            <span className="tpl-name" style={{ color: '#c83e37', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={15} /> Create Custom Room
            </span>
            <span className="tpl-sub">Mix any wall, centerpiece, garland & palette</span>
          </button>
        </div>
      </aside>

      <main className="canvas-stage">
        <div ref={mountRef} className="canvas-mount" />

        <div className="floating-hud">
          {project.rooms.map((r, idx) => (
            <button
              key={r.id}
              className={`hud-btn ${activeRoomIdx === idx ? 'active' : ''}`}
              onClick={() => {
                setActiveRoomIdx(idx);
                sceneRef.current?.setActiveRoom(idx);
              }}
            >
              {r.label}
            </button>
          ))}

          {project.rooms.length < 4 && (
            <button
              className="hud-btn"
              title="Add Room"
              onClick={() => {
                const clone: RoomConfig = {
                  ...structuredClone(activeRoom),
                  id: `r_${Date.now()}`,
                  label: `Room ${project.rooms.length + 1}`,
                };
                setProject((p) => {
                  const nextRooms = [...p.rooms, clone];
                  const curCorners = p.cornersCount ?? 4;
                  const nextCorners = (
                    nextRooms.length > curCorners ? Math.min(4, nextRooms.length) : curCorners
                  ) as 2 | 3 | 4;
                  return { ...p, cornersCount: nextCorners, rooms: nextRooms };
                });
                setActiveRoomIdx(project.rooms.length);
              }}
            >
              <Plus size={14} /> Room
            </button>
          )}

          <button className="hud-btn" onClick={() => sceneRef.current?.toggleFold()}>
            <FoldVertical size={14} /> Fold
          </button>

          <button className="hud-btn" onClick={() => sceneRef.current?.playEntranceUnfold()}>
            <RotateCw size={14} /> Unfold
          </button>

          <button
            className={`hud-btn ${isPreviewing ? 'primary' : ''}`}
            onClick={() => (isPreviewing ? stopLivePreview() : startLivePreview())}
          >
            {isPreviewing ? <Square size={14} /> : <Play size={14} />}
            {isPreviewing ? `Stop (${previewInfo.elapsed}s/${previewInfo.total}s)` : `Preview (${totalVideoSeconds}s)`}
          </button>

          <button
            className="hud-btn"
            onClick={() => {
              const next = !isMuted;
              setIsMuted(next);
              synthRef.current?.setMuted(next);
            }}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
      </main>

      <aside className="panel right">
        <div>
          <div className="section-label">3D Structure & Corners</div>
          <div className="field">
            <label>Architecture & Unfold Style</label>
            <select
              value={project.structure ?? 'carousel_gable'}
              onChange={(e) => {
                setProject((p) => ({ ...p, structure: e.target.value as StructureId }));
                sceneRef.current?.playEntranceUnfold();
              }}
            >
              {STRUCTURES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.unfoldLabel})
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Carousel Corners ({project.cornersCount ?? 4} Corners)</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {([2, 3, 4] as const).map((cnt) => (
                <button
                  key={cnt}
                  className={`pill-btn ${(project.cornersCount ?? 4) === cnt ? 'active' : ''}`}
                  style={{ flex: 1 }}
                  onClick={() => {
                    setProject((p) => ({
                      ...p,
                      cornersCount: cnt,
                      rooms: p.rooms.length > cnt ? p.rooms.slice(0, cnt) : p.rooms,
                    }));
                    setActiveRoomIdx((idx) => Math.min(idx, cnt - 1));
                  }}
                >
                  {cnt} {cnt === 2 ? 'Wings' : 'Corners'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="section-label">Room {activeRoomIdx + 1} Signage & Timing</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="field">
              <label>Font Style</label>
              <select
                value={activeRoom.fontStyle || 'royal_serif'}
                onChange={(e) => updateRoom({ fontStyle: e.target.value as FontStyleId })}
              >
                {FONT_STYLES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Room Duration ({activeRoom.durationSeconds ?? 8}s)</label>
              <input
                type="range"
                min={4}
                max={25}
                value={activeRoom.durationSeconds ?? 8}
                onChange={(e) => updateRoom({ durationSeconds: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="field">
            <label>Event Title</label>
            <input
              value={activeRoom.signage.eventTitle}
              onChange={(e) => updateSignage('eventTitle', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Host / Couple / Birthday Name</label>
            <input
              value={activeRoom.signage.hostLine}
              onChange={(e) => updateSignage('hostLine', e.target.value)}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="field">
              <label>Date</label>
              <input
                value={activeRoom.signage.dateText}
                onChange={(e) => updateSignage('dateText', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Time</label>
              <input
                value={activeRoom.signage.timeText}
                onChange={(e) => updateSignage('timeText', e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>Venue</label>
            <input
              value={activeRoom.signage.venueText}
              onChange={(e) => updateSignage('venueText', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Note / Dress Code</label>
            <input
              value={activeRoom.signage.noteText}
              onChange={(e) => updateSignage('noteText', e.target.value)}
            />
          </div>

          <div
            style={{
              marginTop: 10,
              padding: 10,
              borderRadius: 12,
              border: '1px solid rgba(26,23,21,0.1)',
              background: 'rgba(26,23,21,0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontWeight: 700, fontSize: 12 }}>Custom Floating Texts</label>
              <span style={{ fontSize: 11, opacity: 0.65 }}>Drag directly on 3D wall</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                placeholder="Type text & press Enter..."
                value={newCustomText}
                onChange={(e) => setNewCustomText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addCustomText();
                }}
                style={{ flex: 1 }}
              />
              <button className="pill-btn active" type="button" onClick={addCustomText}>
                + Add
              </button>
            </div>
            {(activeRoom.customTexts ?? []).map((ct) => (
              <div
                key={ct.id}
                style={{
                  padding: 8,
                  borderRadius: 10,
                  background: '#fff',
                  border: '1px solid rgba(26,23,21,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    value={ct.text}
                    onChange={(e) => updateCustomText(ct.id, { text: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <button
                    className="pill-btn"
                    type="button"
                    onClick={() => removeCustomText(ct.id)}
                  >
                    ×
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, fontSize: 11 }}>
                  <label>
                    X ({ct.x.toFixed(1)})
                    <input
                      type="range"
                      min={-1}
                      max={1}
                      step={0.05}
                      value={ct.x}
                      onChange={(e) => updateCustomText(ct.id, { x: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Y ({ct.y.toFixed(1)})
                    <input
                      type="range"
                      min={-1}
                      max={1}
                      step={0.05}
                      value={ct.y}
                      onChange={(e) => updateCustomText(ct.id, { y: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Size ({(ct.scale ?? 1).toFixed(1)}x)
                    <input
                      type="range"
                      min={0.6}
                      max={1.8}
                      step={0.1}
                      value={ct.scale ?? 1}
                      onChange={(e) => updateCustomText(ct.id, { scale: Number(e.target.value) })}
                    />
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {[activePalette.inkColor, activePalette.accentPrimary, '#FFFFFF', '#1B1B1B', '#E7B04C'].map(
                    (col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => updateCustomText(ct.id, { color: col })}
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          backgroundColor: col,
                          border:
                            (ct.color ?? activePalette.inkColor) === col
                              ? '2px solid #c83e37'
                              : '1px solid rgba(0,0,0,0.2)',
                          cursor: 'pointer',
                        }}
                      />
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="section-label">Paper Palette ({COLOR_PALETTES.length})</div>
          <div className="swatch-grid">
            {COLOR_PALETTES.map((pal) => (
              <button
                key={pal.id}
                title={pal.name}
                className={`swatch ${activeRoom.paletteId === pal.id ? 'active' : ''}`}
                style={{
                  background: `linear-gradient(135deg, ${pal.wallTint} 50%, ${pal.accentPrimary} 50%)`,
                }}
                onClick={() => updateRoom({ paletteId: pal.id })}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="section-label">Architecture & Props</div>
          <div className="field">
            <label>Centerpiece Pop-Up</label>
            <select
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
          <div className="field">
            <label>Wall Style</label>
            <select
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
          <div className="field">
            <label>Garland / Ceiling</label>
            <select
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
          <div className="field">
            <label>Floor Pattern</label>
            <select
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
          <div className="field">
            <label>Side Accents (up to 4)</label>
            <div className="chip-grid">
              {SIDE_PROPS.map((sp) => (
                <button
                  key={sp.id}
                  className={`pill-btn ${activeRoom.sideProps.includes(sp.id) ? 'active' : ''}`}
                  onClick={() => toggleSideProp(sp.id)}
                >
                  {sp.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="field">
          <label>Background Music</label>
          <select
            value={project.musicId}
            onChange={(e) => setProject((p) => ({ ...p, musicId: e.target.value }))}
          >
            {MUSIC_TRACKS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.categoryHint})
              </option>
            ))}
          </select>
        </div>

        <button className="primary-cta" disabled={isExporting} onClick={() => triggerVideoExport(false)}>
          {isExporting ? (
            <>
              <Sparkles size={16} /> Rendering 3D Video ({exportPct}%)
            </>
          ) : (
            <>
              <Download size={16} /> Export {totalVideoSeconds}s Video
            </>
          )}
        </button>
      </aside>
      {hiddenPhotoInput}
    </div>
  );
}
export default App;
