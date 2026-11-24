import React, { useRef, useState } from 'react';
import { Bookmark, Download, MailOpen, Play, Sparkles, Square } from 'lucide-react';
import { DEFAULT_WAX_SEAL, WaxSealConfig } from '@patra/shared';
import { AppLayout } from '../components/AppLayout';
import { PaymentReturnModal } from '../components/PaymentReturnModal';
import { PaywallModal } from '../components/PaywallModal';
import { InspectorTabId, ProjectInspectorPanel } from '../components/ProjectInspectorPanel';
import { StudioStage, StudioStageHandle } from '../components/StudioStage';
import { StudioTemplatePicker } from '../components/StudioTemplatePicker';
import { useActiveStudioProject } from '../lib/useActiveStudioProject';

export function WaxSealPage() {
  const stageRef = useRef<StudioStageHandle | null>(null);
  const [viewMode, setViewMode] = useState<'wax_envelope' | 'stage' | 'garden_entrance'>('wax_envelope');
  const [activeTab, setActiveTab] = useState<InspectorTabId>('wax');
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

  const wax: WaxSealConfig = project.waxSeal ?? DEFAULT_WAX_SEAL;

  const updateWax = (patch: Partial<WaxSealConfig>) => {
    setProject((prev) => ({
      ...prev,
      waxSeal: { ...(prev.waxSeal ?? DEFAULT_WAX_SEAL), ...patch },
    }));
  };

  const playUnsealSequence = () => {
    if (!wax.enabled) updateWax({ enabled: true });
    setViewMode('wax_envelope');
    stageRef.current?.sendCommand('PLAY_WAX_OPENING');
  };

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="page-header">
          <div>
            <h1>3D Wax-Seal Envelope</h1>
            <p className="subtitle">
              Customize your sealed cotton envelope, foil liner, ribbon, and invitation rooms in one studio.
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
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === 'wax_envelope' ? 'btn-primary' : ''}`}
                  onClick={() => setViewMode('wax_envelope')}
                >
                  <MailOpen size={13} /> Envelope
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === 'stage' ? 'btn-primary' : ''}`}
                  onClick={() => setViewMode('stage')}
                >
                  Pavilion Stage
                </button>
                {viewMode === 'stage' &&
                  project.rooms.map((r, i) => (
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
                <button type="button" className="btn btn-sm" onClick={playUnsealSequence}>
                  <Sparkles size={14} /> Unseal Envelope
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    if (previewing) {
                      stageRef.current?.sendCommand('STOP_PREVIEW');
                      setPreviewing(false);
                    } else {
                      if (!wax.enabled) updateWax({ enabled: true });
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
                viewMode={viewMode}
                title="3D Wax-Seal Envelope Stage"
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
            tabs={['wax', 'text', 'photo', 'colors', 'props', 'rooms', 'garden', 'music', 'atmosphere', 'format']}
            activeTab={activeTab}
            onTabChange={(nextTab) => {
              setActiveTab(nextTab);
              setViewMode(
                nextTab === 'wax'
                  ? 'wax_envelope'
                  : nextTab === 'garden'
                  ? 'garden_entrance'
                  : 'stage'
              );
            }}
            onPlayWaxOpening={playUnsealSequence}
            onFocusPhoto={(slot) => {
              setViewMode('stage');
              stageRef.current?.sendCommand('FOCUS_PHOTO', slot);
            }}
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
