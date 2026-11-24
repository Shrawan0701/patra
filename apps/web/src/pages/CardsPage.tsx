import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Download,
  ImagePlus,
  RotateCcw,
  Share2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  CARD_FORMATS,
  CARD_FRAME_STYLES,
  CARD_MOTIFS,
  CARD_PAPER_SWATCHES,
  CARD_PHOTO_SHAPES,
  CARD_TEMPLATES,
  CATEGORIES,
  CategoryId,
  FONT_STYLES,
  FontStyleId,
  InvitationCardConfig,
  TemplateRegionId,
  WAX_SEAL_COLORS,
  drawInvitationCard,
  getCardPixelSize,
  hitTestCardPhoto,
} from '@patra/shared';
import { AppLayout } from '../components/AppLayout';
import { PaymentReturnModal } from '../components/PaymentReturnModal';
import { PaywallModal } from '../components/PaywallModal';
import { useAuth } from '../context/AuthContext';
import { ApiError, api } from '../lib/api';

type CardInspectorTab = 'templates' | 'text' | 'photo' | 'style' | 'decor' | 'size';

const TAB_LABELS: Record<CardInspectorTab, string> = {
  templates: 'Templates (24)',
  text: 'Text & Fonts',
  photo: 'Photo',
  style: 'Paper & Frame',
  decor: 'Decor & Seal',
  size: 'Size',
};

export function CardsPage() {
  const { refreshUser } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [card, setCard] = useState<InvitationCardConfig>(() =>
    structuredClone(CARD_TEMPLATES[0].config)
  );
  const [textEdited, setTextEdited] = useState(false);
  const [photoSlot, setPhotoSlot] = useState<1 | 2>(1);
  const [loadedPhotoImg1, setLoadedPhotoImg1] = useState<HTMLImageElement | null>(null);
  const [loadedPhotoImg2, setLoadedPhotoImg2] = useState<HTMLImageElement | null>(null);
  const draggingSlotRef = useRef<1 | 2 | null>(null);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState<CardInspectorTab>('templates');
  const [regionFilter, setRegionFilter] = useState<'all' | TemplateRegionId>('all');
  const [catFilter, setCatFilter] = useState<'all' | CategoryId>('all');
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const pendingActionRef = useRef<'download' | 'share'>('download');

  // Decode uploaded photos for slot 1 & slot 2
  useEffect(() => {
    if (!card.photoEnabled || !card.photoDataUrl) {
      setLoadedPhotoImg1(null);
      return;
    }
    let alive = true;
    const img = new Image();
    img.onload = () => {
      if (alive) setLoadedPhotoImg1(img);
    };
    img.src = card.photoDataUrl;
    return () => {
      alive = false;
    };
  }, [card.photoEnabled, card.photoDataUrl]);

  useEffect(() => {
    if (!card.photo2Enabled || !card.photo2DataUrl) {
      setLoadedPhotoImg2(null);
      return;
    }
    let alive = true;
    const img = new Image();
    img.onload = () => {
      if (alive) setLoadedPhotoImg2(img);
    };
    img.src = card.photo2DataUrl;
    return () => {
      alive = false;
    };
  }, [card.photo2Enabled, card.photo2DataUrl]);

  // Redraw high-DPI 1080px card canvas on any edit
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = getCardPixelSize(card.aspectRatio);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawInvitationCard(ctx, width, height, card, loadedPhotoImg1, loadedPhotoImg2);
  }, [card, loadedPhotoImg1, loadedPhotoImg2]);

  const filteredTemplates = useMemo(
    () =>
      CARD_TEMPLATES.filter((t) => {
        if (regionFilter !== 'all' && t.region !== regionFilter) return false;
        if (catFilter !== 'all' && t.category !== catFilter) return false;
        return true;
      }),
    [regionFilter, catFilter]
  );

  const updateCard = (patch: Partial<InvitationCardConfig>, markText = false) => {
    if (markText) setTextEdited(true);
    setCard((prev) => ({ ...prev, ...patch }));
  };

  const applyTemplate = (tplId: string, forceSampleText = false) => {
    const found = CARD_TEMPLATES.find((t) => t.id === tplId);
    if (!found) return;
    const next = structuredClone(found.config);
    setCard((prev) => {
      const photoKeep = {
        photoEnabled: prev.photoEnabled,
        photoDataUrl: prev.photoDataUrl,
        photoShape: prev.photoShape,
        photoSize: prev.photoSize,
        photoPosX: prev.photoPosX,
        photoPosY: prev.photoPosY,
        photoZoom: prev.photoZoom,
        photoPanX: prev.photoPanX,
        photoPanY: prev.photoPanY,
        photo2Enabled: prev.photo2Enabled,
        photo2DataUrl: prev.photo2DataUrl,
        photo2Shape: prev.photo2Shape,
        photo2Size: prev.photo2Size,
        photo2PosX: prev.photo2PosX,
        photo2PosY: prev.photo2PosY,
        photo2Zoom: prev.photo2Zoom,
        photo2PanX: prev.photo2PanX,
        photo2PanY: prev.photo2PanY,
      };
      if (!forceSampleText && textEdited) {
        return {
          ...next,
          aspectRatio: prev.aspectRatio,
          topBlessing: prev.topBlessing,
          coupleOrHeadline: prev.coupleOrHeadline,
          hostsLine: prev.hostsLine,
          dateText: prev.dateText,
          timeText: prev.timeText,
          venueText: prev.venueText,
          footerNote: prev.footerNote,
          monogram: prev.monogram,
          ...photoKeep,
        };
      }
      return {
        ...next,
        aspectRatio: prev.aspectRatio,
        ...photoKeep,
      };
    });
  };

  const handlePhotoUpload = (file: File) => {
    const targetSlot = photoSlot;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxEdge = 900;
        const s = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * s));
        const h = Math.max(1, Math.round(img.height * s));
        const off = document.createElement('canvas');
        off.width = w;
        off.height = h;
        off.getContext('2d')?.drawImage(img, 0, 0, w, h);
        const url = off.toDataURL('image/jpeg', 0.88);
        if (targetSlot === 2) {
          updateCard({
            photo2Enabled: true,
            photo2DataUrl: url,
            photo2Size: card.photo2Size ?? 0.27,
            photo2PosX: card.photo2PosX ?? 0.19,
            photo2PosY: card.photo2PosY ?? 0.295,
            photo2Zoom: 1,
            photo2PanX: 0,
            photo2PanY: 0,
            // Shift slot 1 slightly left if slot 1 is still dead center
            ...(card.photoEnabled && typeof card.photoPosX !== 'number' ? { photoPosX: -0.19, photoSize: card.photoSize ?? 0.27 } : {}),
          });
        } else {
          updateCard({
            photoEnabled: true,
            photoDataUrl: url,
            photoSize: card.photoSize ?? (card.photo2Enabled ? 0.27 : 0.34),
            photoPosX: card.photoPosX ?? (card.photo2Enabled ? -0.19 : 0),
            photoPosY: card.photoPosY ?? 0.295,
            photoZoom: 1,
            photoPanX: 0,
            photoPanY: 0,
          });
        }
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / Math.max(1, rect.height)));
    const hit = hitTestCardPhoto(nx, ny, canvas.width, canvas.height, card);
    if (hit) {
      draggingSlotRef.current = hit;
      setPhotoSlot(hit);
      setIsDraggingPhoto(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const slot = draggingSlotRef.current;
    const canvas = canvasRef.current;
    if (!slot || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / Math.max(1, rect.height)));
    const posX = Math.max(-0.4, Math.min(0.4, nx - 0.5));
    const posY = Math.max(0.14, Math.min(0.84, ny));
    if (slot === 2) {
      updateCard({ photo2PosX: posX, photo2PosY: posY });
    } else {
      updateCard({ photoPosX: posX, photoPosY: posY });
    }
  };

  const handleCanvasPointerUp = () => {
    draggingSlotRef.current = null;
    setIsDraggingPhoto(false);
  };

  const triggerCardExport = async (mode: 'download' | 'share') => {
    if (busy || !canvasRef.current) return;
    pendingActionRef.current = mode;
    setBusy(true);
    try {
      const authAspect = card.aspectRatio === '4:5' ? '9:16' : card.aspectRatio;
      await api.authorizeExport({
        projectTitle: `${card.coupleOrHeadline || card.title} (Card)`,
        aspectRatio: authAspect,
        usesPremiumFeatures: true,
      });
      await refreshUser();

      const canvas = canvasRef.current;
      const mime = exportFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
      const ext = exportFormat === 'jpeg' ? 'jpg' : 'png';
      const slug = (card.coupleOrHeadline || card.title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 40);
      const filename = `patra-card-${slug || 'invite'}.${ext}`;

      if (mode === 'share' && typeof navigator !== 'undefined' && navigator.share) {
        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, mime, 0.94));
        if (blob) {
          const file = new File([blob], filename, { type: mime });
          if (!navigator.canShare || navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `${card.coupleOrHeadline} Invitation Card`,
              text: `${card.dateText} · ${card.venueText}`,
            });
            setNotice('Shared HD card & saved to Downloads history.');
            setTimeout(() => setNotice(null), 2600);
            return;
          }
        }
      }

      const dataUrl = canvas.toDataURL(mime, 0.94);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = filename;
      a.click();
      setNotice(`Downloaded HD ${ext.toUpperCase()} card & saved to Downloads.`);
      setTimeout(() => setNotice(null), 2600);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 402 || err.code === 'PAYWALL_REQUIRED')) {
        setPaywallOpen(true);
      } else if (err instanceof Error && err.name !== 'AbortError') {
        setNotice(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="page-header">
          <div>
            <h1>1-Page Invitation Cards</h1>
            <p className="subtitle">
              Craft luxury printable &amp; WhatsApp-ready cards across Indian, Western, and East Asian traditions. Edit free, download in HD.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', border: '1px solid var(--border-strong)', borderRadius: 6, overflow: 'hidden' }}>
              {(['png', 'jpeg'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  className={`btn btn-sm ${exportFormat === fmt ? 'btn-primary' : ''}`}
                  style={{ borderRadius: 0, border: 0 }}
                  onClick={() => setExportFormat(fmt)}
                >
                  {fmt === 'png' ? 'PNG' : 'JPG'}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => void triggerCardExport('share')}
            >
              <Share2 size={14} /> Share
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => void triggerCardExport('download')}
            >
              <Download size={14} /> {busy ? 'Preparing...' : `Download ${exportFormat.toUpperCase()}`}
            </button>
            <Link to={`/app/editor/custom:${card.category}:1`} className="btn">
              Turn Into 3D Video <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {notice && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>
            {notice}
          </div>
        )}

        <div className="studio-feature-grid">
          {/* Live High-DPI Canvas Card Stage */}
          <div className="card-glass" style={{ padding: 16, gap: 12, alignItems: 'center' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="badge-pill">
                <Sparkles size={12} /> {card.title}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {CARD_FORMATS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`chip-btn ${card.aspectRatio === f.id ? 'active' : ''}`}
                    style={{ padding: '4px 10px', fontSize: 11.5 }}
                    onClick={() => updateCard({ aspectRatio: f.id })}
                  >
                    {f.id}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                width: '100%',
                minHeight: 480,
                borderRadius: 12,
                background: '#1C1920',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 18,
              }}
            >
              <canvas
                ref={canvasRef}
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
                onPointerCancel={handleCanvasPointerUp}
                style={{
                  maxWidth: '100%',
                  maxHeight: 540,
                  width: 'auto',
                  height: 'auto',
                  borderRadius: 10,
                  boxShadow: '0 20px 48px rgba(0,0,0,0.45)',
                  cursor: isDraggingPhoto
                    ? 'grabbing'
                    : (card.photoEnabled && card.photoDataUrl) || (card.photo2Enabled && card.photo2DataUrl)
                    ? 'grab'
                    : 'default',
                  touchAction: 'none',
                }}
              />
            </div>
          </div>

          {/* Right Inspector Panel */}
          <div className="card-glass" style={{ padding: 14, gap: 14 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(Object.keys(TAB_LABELS) as CardInspectorTab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`chip-btn ${activeTab === t ? 'active' : ''}`}
                  style={{ padding: '7px 12px' }}
                  onClick={() => setActiveTab(t)}
                >
                  {TAB_LABELS[t]}
                </button>
              ))}
            </div>

            {activeTab === 'templates' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(
                    [
                      ['all', `All (${CARD_TEMPLATES.length})`],
                      ['indian', 'Indian Heritage (10)'],
                      ['western', 'Western (8)'],
                      ['east_asian', 'East Asian (6)'],
                    ] as const
                  ).map(([id, lbl]) => (
                    <button
                      key={id}
                      type="button"
                      className={`chip-btn ${regionFilter === id ? 'active' : ''}`}
                      onClick={() => setRegionFilter(id)}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                  <button
                    type="button"
                    className={`chip-btn ${catFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setCatFilter('all')}
                  >
                    All Occasions
                  </button>
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`chip-btn ${catFilter === c.id ? 'active' : ''}`}
                      onClick={() => setCatFilter(c.id)}
                    >
                      {c.shortName}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
                  {filteredTemplates.map((tpl) => {
                    const selected = card.templateId === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => applyTemplate(tpl.id)}
                        style={{
                          textAlign: 'left',
                          padding: 10,
                          borderRadius: 10,
                          border: selected ? '2px solid var(--ink)' : '1px solid var(--border)',
                          background: 'var(--bg-card)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            height: 44,
                            borderRadius: 6,
                            background: `linear-gradient(135deg, ${tpl.previewGradient[0]}, ${tpl.previewGradient[1]})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0 8px',
                            color: '#fff',
                            fontSize: 10.5,
                            fontWeight: 700,
                          }}
                        >
                          <span>{tpl.vibeTag}</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 12.5 }}>{tpl.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.35 }}>{tpl.subtitle}</div>
                      </button>
                    );
                  })}
                </div>

                {textEdited && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      setTextEdited(false);
                      applyTemplate(card.templateId, true);
                    }}
                  >
                    <RotateCcw size={13} /> Reset to Template Sample Text
                  </button>
                )}
              </div>
            )}

            {activeTab === 'text' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 6 }}>
                    Typography Style
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {FONT_STYLES.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className={`btn btn-sm ${card.fontStyle === f.id ? 'btn-primary' : ''}`}
                        onClick={() => updateCard({ fontStyle: f.id as FontStyleId })}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>

                {(
                  [
                    ['topBlessing', 'Top Blessing / Header Line'],
                    ['coupleOrHeadline', 'Couple Names or Headline'],
                    ['hostsLine', 'Invitation / Host Line'],
                    ['dateText', 'Date'],
                    ['timeText', 'Time'],
                    ['venueText', 'Venue & City'],
                    ['footerNote', 'Dress Code / Bottom Note'],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: 12, marginBottom: 3 }}>
                      {label}
                    </label>
                    <input
                      className="input"
                      value={card[field]}
                      onChange={(e) => updateCard({ [field]: e.target.value }, true)}
                    />
                  </div>
                ))}

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 12, marginBottom: 4 }}>
                    Text Size ({Math.round((card.textScale ?? 1) * 100)}%)
                  </label>
                  <input
                    type="range"
                    min={0.8}
                    max={1.2}
                    step={0.05}
                    value={card.textScale ?? 1}
                    onChange={(e) => updateCard({ textScale: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            )}

            {activeTab === 'photo' && (() => {
              const isSlot2 = photoSlot === 2;
              const slotEnabled = isSlot2 ? Boolean(card.photo2Enabled) : Boolean(card.photoEnabled);
              const slotDataUrl = isSlot2 ? (card.photo2DataUrl ?? '') : card.photoDataUrl;
              const slotShape = isSlot2 ? (card.photo2Shape ?? card.photoShape) : card.photoShape;
              const slotSize = isSlot2 ? (card.photo2Size ?? 0.27) : (card.photoSize ?? 0.34);
              const slotPosX = isSlot2 ? (card.photo2PosX ?? 0.19) : (card.photoPosX ?? 0);
              const slotPosY = isSlot2 ? (card.photo2PosY ?? 0.295) : (card.photoPosY ?? 0.295);
              const slotZoom = isSlot2 ? (card.photo2Zoom ?? 1) : card.photoZoom;
              const slotPanX = isSlot2 ? (card.photo2PanX ?? 0) : card.photoPanX;
              const slotPanY = isSlot2 ? (card.photo2PanY ?? 0) : card.photoPanY;

              const patchSlot = (fields: {
                enabled?: boolean;
                dataUrl?: string;
                shape?: typeof card.photoShape;
                size?: number;
                posX?: number;
                posY?: number;
                zoom?: number;
                panX?: number;
                panY?: number;
              }) => {
                if (isSlot2) {
                  updateCard({
                    ...(fields.enabled !== undefined ? { photo2Enabled: fields.enabled } : {}),
                    ...(fields.dataUrl !== undefined ? { photo2DataUrl: fields.dataUrl } : {}),
                    ...(fields.shape !== undefined ? { photo2Shape: fields.shape } : {}),
                    ...(fields.size !== undefined ? { photo2Size: fields.size } : {}),
                    ...(fields.posX !== undefined ? { photo2PosX: fields.posX } : {}),
                    ...(fields.posY !== undefined ? { photo2PosY: fields.posY } : {}),
                    ...(fields.zoom !== undefined ? { photo2Zoom: fields.zoom } : {}),
                    ...(fields.panX !== undefined ? { photo2PanX: fields.panX } : {}),
                    ...(fields.panY !== undefined ? { photo2PanY: fields.panY } : {}),
                  });
                } else {
                  updateCard({
                    ...(fields.enabled !== undefined ? { photoEnabled: fields.enabled } : {}),
                    ...(fields.dataUrl !== undefined ? { photoDataUrl: fields.dataUrl } : {}),
                    ...(fields.shape !== undefined ? { photoShape: fields.shape } : {}),
                    ...(fields.size !== undefined ? { photoSize: fields.size } : {}),
                    ...(fields.posX !== undefined ? { photoPosX: fields.posX } : {}),
                    ...(fields.posY !== undefined ? { photoPosY: fields.posY } : {}),
                    ...(fields.zoom !== undefined ? { photoZoom: fields.zoom } : {}),
                    ...(fields.panX !== undefined ? { photoPanX: fields.panX } : {}),
                    ...(fields.panY !== undefined ? { photoPanY: fields.panY } : {}),
                  });
                }
              };

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (f) handlePhotoUpload(f);
                    }}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {([1, 2] as const).map((s) => {
                      const on = s === 1 ? Boolean(card.photoEnabled && card.photoDataUrl) : Boolean(card.photo2Enabled && card.photo2DataUrl);
                      return (
                        <button
                          key={s}
                          type="button"
                          className={`btn btn-sm ${photoSlot === s ? 'btn-primary' : ''}`}
                          onClick={() => setPhotoSlot(s)}
                        >
                          Photo {s} {on ? '· On' : ''}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => fileRef.current?.click()}>
                      <ImagePlus size={15} /> {slotDataUrl ? `Replace Photo ${photoSlot}` : `Upload Photo ${photoSlot}`}
                    </button>
                    {slotEnabled && (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => patchSlot({ enabled: false, dataUrl: '' })}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
                    Tip: Drag any uploaded photo directly on the card preview to reposition it.
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 6 }}>
                      Die-Cut Frame Shape
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {CARD_PHOTO_SHAPES.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className={`btn btn-sm ${slotShape === s.id ? 'btn-primary' : ''}`}
                          onClick={() => patchSlot({ shape: s.id, enabled: Boolean(slotDataUrl) })}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {slotDataUrl && (
                    <>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: 12 }}>
                          Frame Size ({Math.round(slotSize * 100)}% width)
                        </label>
                        <input
                          type="range"
                          min={0.16}
                          max={0.52}
                          step={0.02}
                          value={slotSize}
                          onChange={(e) => patchSlot({ size: Number(e.target.value) })}
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <label style={{ display: 'block', fontWeight: 600, fontSize: 12 }}>Move Left / Right</label>
                          <input
                            type="range"
                            min={-0.38}
                            max={0.38}
                            step={0.02}
                            value={slotPosX}
                            onChange={(e) => patchSlot({ posX: Number(e.target.value) })}
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontWeight: 600, fontSize: 12 }}>Move Up / Down</label>
                          <input
                            type="range"
                            min={0.15}
                            max={0.82}
                            step={0.02}
                            value={slotPosY}
                            onChange={(e) => patchSlot({ posY: Number(e.target.value) })}
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: 12 }}>
                          Crop Zoom ({slotZoom.toFixed(1)}x)
                        </label>
                        <input
                          type="range"
                          min={1}
                          max={2.6}
                          step={0.1}
                          value={slotZoom}
                          onChange={(e) => patchSlot({ zoom: Number(e.target.value) })}
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <label style={{ display: 'block', fontWeight: 600, fontSize: 12 }}>Crop Pan X</label>
                          <input
                            type="range"
                            min={-0.9}
                            max={0.9}
                            step={0.05}
                            value={slotPanX}
                            onChange={(e) => patchSlot({ panX: Number(e.target.value) })}
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontWeight: 600, fontSize: 12 }}>Crop Pan Y</label>
                          <input
                            type="range"
                            min={-0.9}
                            max={0.9}
                            step={0.05}
                            value={slotPanY}
                            onChange={(e) => patchSlot({ panY: Number(e.target.value) })}
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() =>
                          patchSlot({
                            posX: isSlot2 ? 0.19 : card.photo2Enabled ? -0.19 : 0,
                            posY: 0.295,
                            size: card.photo2Enabled ? 0.27 : 0.34,
                            zoom: 1,
                            panX: 0,
                            panY: 0,
                          })
                        }
                      >
                        <RotateCcw size={12} /> Reset Photo {photoSlot} Framing
                      </button>
                    </>
                  )}
                </div>
              );
            })()}

            {activeTab === 'style' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 6 }}>
                    Artisan Paper Tone
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {CARD_PAPER_SWATCHES.map((sw) => (
                      <button
                        key={sw.id}
                        type="button"
                        onClick={() =>
                          updateCard({
                            paperColor: sw.paperColor,
                            secondaryPaperColor: sw.secondaryPaperColor,
                            inkColor: sw.inkColor,
                          })
                        }
                        style={{
                          padding: 6,
                          borderRadius: 8,
                          border: card.paperColor === sw.paperColor ? '2px solid var(--ink)' : '1px solid var(--border)',
                          background: sw.paperColor,
                          color: sw.inkColor,
                          fontSize: 10.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {sw.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: 12, marginBottom: 4 }}>Ink Color</label>
                    <input
                      type="color"
                      value={card.inkColor}
                      onChange={(e) => updateCard({ inkColor: e.target.value })}
                      style={{ width: '100%', height: 34, borderRadius: 6, cursor: 'pointer' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: 12, marginBottom: 4 }}>Accent / Foil Color</label>
                    <input
                      type="color"
                      value={card.accentColor}
                      onChange={(e) => updateCard({ accentColor: e.target.value })}
                      style={{ width: '100%', height: 34, borderRadius: 6, cursor: 'pointer' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 6 }}>
                    Architectural Frame Silhouette
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {CARD_FRAME_STYLES.map((fr) => (
                      <button
                        key={fr.id}
                        type="button"
                        className={`btn btn-sm ${card.frameStyle === fr.id ? 'btn-primary' : ''}`}
                        onClick={() => updateCard({ frameStyle: fr.id })}
                      >
                        {fr.name}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className={`btn btn-sm ${card.foilShimmer ? 'btn-primary' : ''}`}
                  onClick={() => updateCard({ foilShimmer: !card.foilShimmer })}
                >
                  Metallic Paper Sheen: {card.foilShimmer ? 'On' : 'Off'}
                </button>
              </div>
            )}

            {activeTab === 'decor' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 6 }}>
                    Top Handcrafted Illustration Motif
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {CARD_MOTIFS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className={`btn btn-sm ${card.motif === m.id ? 'btn-primary' : ''}`}
                        onClick={() => updateCard({ motif: m.id })}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className={`btn btn-sm ${card.cornerRosettes ? 'btn-primary' : ''}`}
                  onClick={() => updateCard({ cornerRosettes: !card.cornerRosettes })}
                >
                  Bottom Corner Floral Rosettes: {card.cornerRosettes ? 'On' : 'Off'}
                </button>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 13 }}>Bottom Embossed Wax Seal Stamp</strong>
                    <button
                      type="button"
                      className={`btn btn-sm ${card.waxSealEnabled ? 'btn-primary' : ''}`}
                      onClick={() => updateCard({ waxSealEnabled: !card.waxSealEnabled })}
                    >
                      {card.waxSealEnabled ? 'Active' : 'Add Wax Stamp'}
                    </button>
                  </div>

                  {card.waxSealEnabled && (
                    <>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: 12, marginBottom: 4 }}>
                          Stamp Monogram
                        </label>
                        <input
                          className="input"
                          maxLength={5}
                          value={card.monogram}
                          onChange={(e) => updateCard({ monogram: e.target.value }, true)}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {WAX_SEAL_COLORS.map((sw) => (
                          <button
                            key={sw.id}
                            type="button"
                            onClick={() => updateCard({ waxColor: sw.hex })}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 999,
                              background: sw.hex,
                              border: card.waxColor === sw.hex ? '3px solid var(--ink)' : '1px solid rgba(0,0,0,0.2)',
                              cursor: 'pointer',
                            }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'size' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {CARD_FORMATS.map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    className={`btn ${card.aspectRatio === fmt.id ? 'btn-primary' : ''}`}
                    style={{ justifyContent: 'space-between', padding: '12px 14px' }}
                    onClick={() => updateCard({ aspectRatio: fmt.id })}
                  >
                    <strong>{fmt.name}</strong>
                    <span style={{ fontSize: 12, opacity: 0.8 }}>{fmt.subtitle}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <PaywallModal
        visible={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        onUnlocked={() => {
          setPaywallOpen(false);
          void triggerCardExport(pendingActionRef.current);
        }}
      />
      <PaymentReturnModal />
    </AppLayout>
  );
}
