import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  Download,
  FoldVertical,
  Play,
  RotateCw,
  Square,
  Volume2,
  VolumeX,
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
  hasStudioUnlockAccess,
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
  const { user, refreshUser } = useAuth();
  const stageRef = useRef<StudioStageHandle | null>(null);

  const [project, setProject] = useState<ProjectConfig>(() => structuredClone(TEMPLATES[0].project));
  const [activeRoomIdx, setActiveRoomIdx] = useState(0);
  const [tab, setTab] = useState<InspectorTabId>('text');
  const [isMuted, setIsMuted] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const [previewing, setPreviewing] = useState(false);
  const [previewInfo, setPreviewInfo] = useState({ elapsed: 0, total: 0 });
  const [exporting, setExporting] = useState(false);
  const [exportPct, setExportPct] = useState(0);
  const [paywallOpen, setPaywallOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    if (id.startsWith('tpl:')) {
      const tplId = id.slice(4);
      const found = findTemplateById(tplId) ?? TEMPLATES[0];
      setProject(structuredClone(found.project));
      setActiveRoomIdx(0);
      if (found.isPremium && !hasStudioUnlockAccess(user)) {
        setPaywallOpen(true);
      }
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

  const handleExportComplete = (dataUrl: string, mimeType: string, title: string) => {
    setExporting(false);
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${(title || 'patra-3d-invite').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${ext}`;
    a.click();
    setSaveNotice('Video downloaded! Saved to Downloads History.');
  };

  return (
    <div className="editor-shell">
      <header className="editor-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/app" className="btn btn-sm">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <strong style={{ fontSize: 15 }}>{project.title}</strong>
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
    </div>
  );
}
