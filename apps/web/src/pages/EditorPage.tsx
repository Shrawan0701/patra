import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  Check,
  Download,
  FoldVertical,
  Pencil,
  Play,
  RotateCw,
  Share2,
  Square,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  CategoryId,
  ProjectConfig,
  StructureId,
  TEMPLATES,
  createCustomProject,
  findTemplateById,
  getProjectTotalSeconds,
  hasPremiumStudioFeatures,
} from '@patra/shared';
import { PaymentReturnModal } from '../components/PaymentReturnModal';
import { PaywallModal } from '../components/PaywallModal';
import { InspectorTabId, ProjectInspectorPanel } from '../components/ProjectInspectorPanel';
import { StudioStage, StudioStageHandle } from '../components/StudioStage';
import { useAuth } from '../context/AuthContext';
import { ApiError, api } from '../lib/api';

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const stageRef = useRef<StudioStageHandle | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const [project, setProject] = useState<ProjectConfig>(() => structuredClone(TEMPLATES[0].project));
  const [activeRoomIdx, setActiveRoomIdx] = useState(0);
  const [tab, setTab] = useState<InspectorTabId>('text');
  const [isMuted, setIsMuted] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const [previewing, setPreviewing] = useState(false);
  const [previewInfo, setPreviewInfo] = useState({ elapsed: 0, total: 0 });
  const [exporting, setExporting] = useState(false);
  const [exportPct, setExportPct] = useState(0);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [readyVideo, setReadyVideo] = useState<{
    url: string;
    blob?: Blob;
    filename: string;
    mimeType: string;
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    if (id.startsWith('tpl:')) {
      const tplId = id.slice(4);
      const found = findTemplateById(tplId) ?? TEMPLATES[0];
      setProject(structuredClone(found.project));
      setActiveRoomIdx(0);
    } else if (id.startsWith('custom:')) {
      const [, cat, countStr, paletteId] = id.split(':');
      const count = Number(countStr || '1');
      const custom = createCustomProject((cat as CategoryId) || 'wedding', count);
      if (paletteId) {
        custom.rooms = custom.rooms.map((r) => ({ ...r, paletteId }));
      }
      const qStruct = searchParams.get('structure') as StructureId | null;
      const qCorners = Number(searchParams.get('corners') || '');
      if (qStruct) custom.structure = qStruct;
      if (qCorners === 2 || qCorners === 3 || qCorners === 4) {
        custom.cornersCount = qCorners;
        if (custom.rooms.length > qCorners) custom.rooms = custom.rooms.slice(0, qCorners);
      }
      setProject(custom);
      setActiveRoomIdx(0);
    } else {
      void api.getProject(id).then((res) => {
        setProject(res.project);
        setActiveRoomIdx(0);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, searchParams]);

  const totalVideoSeconds = useMemo(() => getProjectTotalSeconds(project), [project]);

  const handleSaveDraft = async () => {
    setSaving(true);
    setSaveNotice(null);
    try {
      if (project.id) {
        const res = await api.updateProject(project.id, project);
        setProject(res.project);
      } else {
        const res = await api.createProject(project);
        setProject(res.project);
      }
      setSaveNotice('Draft saved to cloud');
      setTimeout(() => setSaveNotice(null), 2600);
    } catch (err) {
      setSaveNotice(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleStartExport = async () => {
    if (exporting) return;
    if (previewing) {
      stageRef.current?.sendCommand('STOP_PREVIEW');
      setPreviewing(false);
    }

    let savedId = project.id;
    if (!savedId) {
      try {
        const created = await api.createProject(project);
        savedId = created.project.id;
        setProject(created.project);
      } catch {
        // Proceed with authorization check
      }
    }

    try {
      const usesPremium = hasPremiumStudioFeatures(project);
      await api.authorizeExport({
        projectId: savedId,
        projectTitle: project.title,
        aspectRatio: project.aspectRatio,
        usesPremiumFeatures: usesPremium,
      });
      void refreshUser();
      setExporting(true);
      setExportPct(0);
      stageRef.current?.sendCommand('START_EXPORT');
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setPaywallOpen(true);
      } else {
        setSaveNotice(err instanceof Error ? err.message : 'Unable to download');
      }
    }
  };

  useEffect(() => {
    if (editingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    return () => {
      if (readyVideo?.url.startsWith('blob:')) {
        URL.revokeObjectURL(readyVideo.url);
      }
    };
  }, [readyVideo]);

  const commitTitleEdit = () => {
    setEditingTitle(false);
    setProject((prev) => ({
      ...prev,
      title: prev.title.trim() || 'Untitled Invitation',
    }));
  };

  const handleExportComplete = (dataUrl: string, mimeType: string, title: string, blob?: Blob) => {
    setExporting(false);
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const filename = `${(title || 'patra-3d-invite').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${ext}`;
    setReadyVideo({ url: dataUrl, blob, filename, mimeType });

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setSaveNotice('Video ready! Saved to Downloads History.');
  };

  const handleShareOrSaveReadyVideo = async () => {
    if (!readyVideo) return;
    try {
      if (readyVideo.blob && typeof navigator !== 'undefined' && navigator.share) {
        const file = new File([readyVideo.blob], readyVideo.filename, {
          type: readyVideo.mimeType,
        });
        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: project.title || 'Patra 3D Invitation',
          });
          return;
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
    }
    const a = document.createElement('a');
    a.href = readyVideo.url;
    a.download = readyVideo.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="editor-shell">
      <header className="editor-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flexWrap: 'wrap' }}>
          <Link to="/app" className="btn btn-sm">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          {editingTitle ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <input
                ref={titleInputRef}
                type="text"
                className="input-field"
                value={project.title}
                maxLength={80}
                onChange={(e) => setProject((prev) => ({ ...prev, title: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') commitTitleEdit();
                }}
                onBlur={commitTitleEdit}
                style={{ width: 210, padding: '5px 10px', fontSize: 14, fontWeight: 600 }}
                aria-label="Invitation name"
              />
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={commitTitleEdit}
                aria-label="Save name"
                style={{ padding: '5px 8px' }}
              >
                <Check size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingTitle(true)}
              title="Rename invitation"
              aria-label="Rename invitation"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                border: 0,
                padding: '4px 6px',
                borderRadius: 6,
                cursor: 'pointer',
                color: 'inherit',
                font: 'inherit',
              }}
            >
              <strong style={{ fontSize: 15 }}>{project.title}</strong>
              <Pencil size={13} style={{ color: 'var(--ink-soft)' }} />
            </button>
          )}
          {saveNotice && (
            <span className="badge-pill" style={{ padding: '4px 10px', fontSize: 12 }}>
              {saveNotice}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              const next = !isMuted;
              setIsMuted(next);
              stageRef.current?.sendCommand('TOGGLE_AUDIO', next);
            }}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <button type="button" className="btn btn-sm" disabled={saving} onClick={() => void handleSaveDraft()}>
            <Bookmark size={14} /> {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              if (previewing) {
                stageRef.current?.sendCommand('STOP_PREVIEW');
                setPreviewing(false);
              } else {
                setPreviewInfo({ elapsed: 0, total: totalVideoSeconds });
                setPreviewing(true);
                stageRef.current?.sendCommand('START_PREVIEW');
              }
            }}
          >
            {previewing ? <Square size={13} /> : <Play size={13} />}
            {previewing ? `Stop (${previewInfo.elapsed}s/${previewInfo.total || totalVideoSeconds}s)` : `Preview (${totalVideoSeconds}s)`}
          </button>
          <button type="button" className="btn btn-sm btn-primary" disabled={exporting} onClick={() => void handleStartExport()}>
            <Download size={14} /> {exporting ? `Downloading ${exportPct}%` : 'Download Video'}
          </button>
        </div>
      </header>

      <div className="editor-body">
        <div className="editor-canvas-col">
          <StudioStage
            ref={stageRef}
            project={project}
            activeRoomIdx={activeRoomIdx}
            viewMode={tab === 'wax' ? 'wax_envelope' : tab === 'garden' ? 'garden_entrance' : 'stage'}
            onPreviewProgress={(elapsed, total) => setPreviewInfo({ elapsed, total })}
            onPreviewDone={() => setPreviewing(false)}
            onExportProgress={setExportPct}
            onExportComplete={handleExportComplete}
            onExportError={(msg) => {
              setExporting(false);
              setSaveNotice(msg);
            }}
            onCustomTextMoved={(roomIndex, ctId, x, y) => {
              setProject((prev) => ({
                ...prev,
                rooms: prev.rooms.map((r, i) =>
                  i === roomIndex
                    ? {
                        ...r,
                        customTexts: (r.customTexts ?? []).map((ct) =>
                          ct.id === ctId ? { ...ct, x, y } : ct
                        ),
                      }
                    : r
                ),
              }));
            }}
            onPhotoCutoutMoved={(roomIndex, slot, offsetX, offsetZ) => {
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
            }}
          />

          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 999,
              maxWidth: 'calc(100% - 20px)',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              background: 'var(--bg-glass-strong)',
              border: '1px solid var(--border-strong)',
              boxShadow: 'var(--shadow-md)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {project.rooms.map((r, idx) => (
              <button
                key={r.id}
                type="button"
                className={`chip-btn ${activeRoomIdx === idx ? 'active' : ''}`}
                onClick={() => setActiveRoomIdx(idx)}
              >
                {r.label}
              </button>
            ))}
            <button type="button" className="btn btn-sm" onClick={() => stageRef.current?.sendCommand('TOGGLE_FOLD')}>
              <FoldVertical size={13} /> Fold
            </button>
            <button type="button" className="btn btn-sm" onClick={() => stageRef.current?.sendCommand('PLAY_UNFOLD')}>
              <RotateCw size={13} /> Unfold
            </button>
            <button type="button" className="btn btn-sm" title="Zoom In" onClick={() => stageRef.current?.sendCommand('SET_CAMERA_ZOOM', -1.5)}>
              +
            </button>
            <button type="button" className="btn btn-sm" title="Zoom Out" onClick={() => stageRef.current?.sendCommand('SET_CAMERA_ZOOM', 1.5)}>
              -
            </button>
          </div>
        </div>

        <aside className="editor-dock-col">
          <div className="editor-scroll" style={{ padding: 12 }}>
            <ProjectInspectorPanel
              project={project}
              setProject={setProject}
              activeRoomIdx={activeRoomIdx}
              setActiveRoomIdx={setActiveRoomIdx}
              tabs={['text', 'photo', 'colors', 'props', 'rooms', 'garden', 'music', 'wax', 'atmosphere', 'format']}
              activeTab={tab}
              onTabChange={setTab}
              onPlayWaxOpening={() => stageRef.current?.sendCommand('PLAY_WAX_OPENING')}
              onFocusPhoto={(slot) => stageRef.current?.sendCommand('FOCUS_PHOTO', slot)}
              onSyncAtmosphereAll={(atmo) => {
                setProject((prev) => ({
                  ...prev,
                  rooms: prev.rooms.map((rm) => ({ ...rm, atmosphere: { ...atmo } })),
                }));
                setSaveNotice('Applied atmosphere across all rooms');
                setTimeout(() => setSaveNotice(null), 2200);
              }}
            />
          </div>
        </aside>
      </div>

      <PaywallModal
        visible={paywallOpen}
        projectId={project.id}
        onClose={() => setPaywallOpen(false)}
        onUnlocked={() => {
          setPaywallOpen(false);
          void handleStartExport();
        }}
      />

      <PaymentReturnModal
        onVerified={() => {
          void refreshUser();
        }}
      />

      {readyVideo && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            background: 'rgba(10, 12, 16, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            className="card-glass"
            style={{
              width: '100%',
              maxWidth: 460,
              padding: 20,
              gap: 14,
              background: 'var(--bg-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Your 3D Video is Ready!</h2>
              <button
                type="button"
                className="btn btn-sm"
                aria-label="Close"
                onClick={() => setReadyVideo(null)}
                style={{ padding: '5px 8px' }}
              >
                <X size={15} />
              </button>
            </div>
            <video
              src={readyVideo.url}
              controls
              playsInline
              style={{ width: '100%', maxHeight: '46vh', borderRadius: 10, background: '#000' }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => void handleShareOrSaveReadyVideo()}
              >
                <Share2 size={15} /> Save / Share Video
              </button>
              <a
                href={readyVideo.url}
                download={readyVideo.filename}
                className="btn"
                style={{ flex: 1 }}
              >
                <Download size={15} /> Download File
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
