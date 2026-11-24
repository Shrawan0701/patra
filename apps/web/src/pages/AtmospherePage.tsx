import React, { useRef, useState } from 'react';
import { Bookmark, Download, Play, RotateCw, Square } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { PaymentReturnModal } from '../components/PaymentReturnModal';
import { PaywallModal } from '../components/PaywallModal';
import { InspectorTabId, ProjectInspectorPanel } from '../components/ProjectInspectorPanel';
import { StudioStage, StudioStageHandle } from '../components/StudioStage';
import { StudioTemplatePicker } from '../components/StudioTemplatePicker';
import { useActiveStudioProject } from '../lib/useActiveStudioProject';

export function AtmospherePage() {
  const stageRef = useRef<StudioStageHandle | null>(null);
  const [activeTab, setActiveTab] = useState<InspectorTabId>('atmosphere');
  const {
    savedProjects,
    project,
    setProject,
    activeRoomIdx,
    setActiveRoomIdx,
    saving,
    exporting,
    exportPct,
    setExportPct,
    previewing,
    setPreviewing,
    notice,
    setNotice,
    paywallOpen,
    setPaywallOpen,
    paywallSubscriptionOnly,
    selectSavedProject,
    saveProject,
    authorizeAndExport,
    finishExportDownload,
  } = useActiveStudioProject();

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="page-header">
          <div>
            <h1>Day/Night Lighting &amp; 3D Atmosphere</h1>
            <p className="subtitle">
              Adjust lighting moods, floating particles, photos, rooms, and music from one workspace.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <button type="button" className="btn" disabled={saving} onClick={() => void saveProject()}>
              <Bookmark size={15} /> {saving ? 'Saving...' : 'Save Draft'}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              disabled={exporting}
              onClick={() => void authorizeAndExport(() => stageRef.current?.sendCommand('START_EXPORT'))}
            >
              <Download size={15} />
              {exporting ? `Downloading ${exportPct}%` : 'Download 4K Video'}
            </button>
          </div>
        </div>

        <StudioTemplatePicker
          savedProjects={savedProjects}
          activeTitle={project.title}
          activeProjectId={project.id}
          onSelect={selectSavedProject}
        />

        {notice && <div className="success-banner">{notice}</div>}

        <div className="studio-feature-grid">
          <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {project.rooms.map((r, i) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`btn btn-sm ${activeRoomIdx === i ? 'btn-primary' : ''}`}
                    onClick={() => setActiveRoomIdx(i)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => stageRef.current?.sendCommand('PLAY_UNFOLD')}
                >
                  <RotateCw size={13} /> Unfold
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    if (previewing) {
                      stageRef.current?.sendCommand('STOP_PREVIEW');
                      setPreviewing(false);
                    } else {
                      setPreviewing(true);
                      stageRef.current?.sendCommand('START_PREVIEW');
                    }
                  }}
                >
                  {previewing ? <Square size={13} /> : <Play size={13} />}
                  {previewing ? 'Stop' : 'Preview'}
                </button>
              </div>
            </div>

            <div style={{ height: 490, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: '#EFECE6' }}>
              <StudioStage
                ref={stageRef}
                project={project}
                activeRoomIdx={activeRoomIdx}
                viewMode={
                  activeTab === 'wax'
                    ? 'wax_envelope'
                    : activeTab === 'garden'
                    ? 'garden_entrance'
                    : 'stage'
                }
                title="3D Atmosphere & Lighting Stage"
                onPreviewDone={() => setPreviewing(false)}
                onExportProgress={setExportPct}
                onExportComplete={finishExportDownload}
                onCustomTextMoved={(rIdx, ctId, x, y) => {
                  setProject((prev) => ({
                    ...prev,
                    rooms: prev.rooms.map((rm, idx) =>
                      idx === rIdx
                        ? {
                            ...rm,
                            customTexts: (rm.customTexts ?? []).map((ct) =>
                              ct.id === ctId ? { ...ct, x, y } : ct
                            ),
                          }
                        : rm
                    ),
                  }));
                }}
                onPhotoCutoutMoved={(rIdx, slot, offsetX, offsetZ) => {
                  setProject((prev) => ({
                    ...prev,
                    rooms: prev.rooms.map((rm, idx) => {
                      if (idx !== rIdx) return rm;
                      if (slot === 2 && rm.photoCutout2) {
                        return { ...rm, photoCutout2: { ...rm.photoCutout2, offsetX, offsetZ } };
                      }
                      if (slot === 1 && rm.photoCutout) {
                        return { ...rm, photoCutout: { ...rm.photoCutout, offsetX, offsetZ } };
                      }
                      return rm;
                    }),
                  }));
                }}
              />
            </div>
          </div>

          <ProjectInspectorPanel
            project={project}
            setProject={setProject}
            activeRoomIdx={activeRoomIdx}
            setActiveRoomIdx={setActiveRoomIdx}
            tabs={['atmosphere', 'text', 'photo', 'colors', 'props', 'rooms', 'garden', 'music', 'wax', 'format']}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onPlayWaxOpening={() => stageRef.current?.sendCommand('PLAY_WAX_OPENING')}
            onFocusPhoto={(slot) => stageRef.current?.sendCommand('FOCUS_PHOTO', slot)}
            onSyncAtmosphereAll={(atmo) => {
              setProject((prev) => ({
                ...prev,
                rooms: prev.rooms.map((rm) => ({ ...rm, atmosphere: { ...atmo } })),
              }));
              setNotice('Applied lighting and particles across all rooms.');
              setTimeout(() => setNotice(null), 2200);
            }}
          />
        </div>
      </div>

      <PaywallModal
        visible={paywallOpen}
        projectId={project.id}
        onClose={() => setPaywallOpen(false)}
        onUnlocked={() => {
          setPaywallOpen(false);
          void authorizeAndExport(() => stageRef.current?.sendCommand('START_EXPORT'));
        }}
      />
      <PaymentReturnModal />
    </AppLayout>
  );
}
