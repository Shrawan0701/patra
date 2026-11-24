import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import type { WebViewMessageEvent } from 'react-native-webview';
import {
  DEFAULT_PHOTO_CUTOUT,
  DEFAULT_PHOTO_CUTOUT_2,
  ProjectConfig,
  TEMPLATES,
  findTemplateById,
  hasPremiumStudioFeatures,
} from '@patra/shared';
import { useAuth } from '../context/AuthContext';
import { ApiError, api } from '../lib/api';
import { saveExportToApp, saveToPhoneGallery, shareExportedVideo } from '../lib/localExports';
import { successHaptic, tapHaptic } from '../theme';

export type StudioWebRef = {
  postMessage: (msg: string) => void;
  injectJavaScript: (script: string) => void;
} | null;

export function useMobileStudioProject(
  initialViewMode: 'stage' | 'wax_envelope' | 'garden_entrance' = 'stage'
) {
  const { refreshUser } = useAuth();
  const webRef = useRef<StudioWebRef>(null);
  const pendingExportMeta = useRef<{ id: string; resolution: '1080p' | '4K' } | null>(null);

  const [savedProjects, setSavedProjects] = useState<(ProjectConfig & { updatedAt: string })[]>([]);
  const [project, setProject] = useState<ProjectConfig>(() => structuredClone(TEMPLATES[0].project));
  const [activeRoomIdx, setActiveRoomIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'stage' | 'wax_envelope' | 'garden_entrance'>(
    initialViewMode
  );
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportPct, setExportPct] = useState(0);
  const [previewing, setPreviewing] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallSubOnly, setPaywallSubOnly] = useState(false);

  const sendTo3D = useCallback((type: string, payload?: unknown) => {
    const json = JSON.stringify({ type, payload });
    webRef.current?.injectJavaScript(`window.__PATRA_MSG__ && window.__PATRA_MSG__(${json}); true;`);
  }, []);

  useEffect(() => {
    void api
      .listProjects()
      .then((res) => {
        setSavedProjects(res.projects);
        if (res.projects.length > 0) {
          setProject(structuredClone(res.projects[0]));
          setActiveRoomIdx(0);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (ready) {
      sendTo3D('SET_PROJECT', project);
    }
  }, [project, ready, sendTo3D]);

  useEffect(() => {
    if (ready) {
      sendTo3D('SET_ROOM', activeRoomIdx);
    }
  }, [activeRoomIdx, ready, sendTo3D]);

  useEffect(() => {
    if (ready) {
      sendTo3D('SET_VIEW_MODE', viewMode);
    }
  }, [viewMode, ready, sendTo3D]);

  const selectSourceProject = (key: string) => {
    tapHaptic();
    if (key.startsWith('tpl:')) {
      const tpl = findTemplateById(key.slice(4));
      if (tpl) {
        setProject(structuredClone(tpl.project));
        setActiveRoomIdx(0);
      }
      return;
    }
    const found = savedProjects.find((p) => p.id === key);
    if (found) {
      setProject(structuredClone(found));
      setActiveRoomIdx(0);
    }
  };

  const handleSaveDraft = async (): Promise<string | undefined> => {
    tapHaptic();
    setSaving(true);
    try {
      const saved = project.id
        ? (await api.updateProject(project.id, project)).project
        : (await api.createProject(project)).project;
      setProject(saved);
      setSavedProjects((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)]);
      successHaptic();
      Alert.alert('Saved', 'Updated in your Studio Drafts.');
      return saved.id;
    } catch (err) {
      Alert.alert('Save Failed', err instanceof Error ? err.message : 'Unable to save draft');
      return project.id;
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    tapHaptic();
    if (exporting) return;
    if (previewing) {
      setPreviewing(false);
      sendTo3D('STOP_PREVIEW');
    }

    let savedId = project.id;
    if (!savedId) {
      try {
        const created = await api.createProject(project);
        savedId = created.project.id;
        setProject(created.project);
      } catch {
        // Proceed to authorize
      }
    }

    const usesPremium = hasPremiumStudioFeatures(project);
    try {
      const authRes = await api.authorizeExport({
        projectId: savedId,
        projectTitle: project.title,
        aspectRatio: project.aspectRatio,
        usesPremiumFeatures: usesPremium,
      });
      pendingExportMeta.current = {
        id: authRes.record.id,
        resolution: authRes.resolution,
      };
      void refreshUser();
      setExporting(true);
      setExportPct(0);
      sendTo3D('START_EXPORT');
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setPaywallSubOnly(err.code === 'SUBSCRIPTION_REQUIRED' || usesPremium);
        setPaywallVisible(true);
      } else {
        Alert.alert('Export Error', err instanceof Error ? err.message : 'Unable to export video');
      }
    }
  };

  const handleWebMessage = async (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as {
        type: string;
        payload?: {
          pct?: number;
          dataUrl?: string;
          mimeType?: string;
          title?: string;
          roomIndex?: number;
          slot?: number;
          id?: string;
          x?: number;
          y?: number;
          offsetX?: number;
          offsetZ?: number;
        };
      };

      if (msg.type === 'READY') {
        setReady(true);
        sendTo3D('SET_PROJECT', project);
        sendTo3D('SET_VIEW_MODE', viewMode);
      } else if (msg.type === 'PREVIEW_DONE') {
        setPreviewing(false);
      } else if (msg.type === 'EXPORT_PROGRESS') {
        setExportPct(msg.payload?.pct ?? 0);
      } else if (msg.type === 'PHOTO_PICKED' && msg.payload?.dataUrl) {
        const dataUrl = msg.payload.dataUrl;
        const slot = msg.payload.slot === 2 ? 2 : 1;
        setProject((prev) => ({
          ...prev,
          rooms: prev.rooms.map((r, i) => {
            if (i !== activeRoomIdx) return r;
            if (slot === 2) {
              return {
                ...r,
                photoCutout2: {
                  ...(r.photoCutout2 ?? DEFAULT_PHOTO_CUTOUT_2),
                  enabled: true,
                  imageDataUrl: dataUrl,
                  cropZoom: 1,
                  cropX: 0,
                  cropY: 0,
                },
              };
            }
            return {
              ...r,
              photoCutout: {
                ...(r.photoCutout ?? DEFAULT_PHOTO_CUTOUT),
                enabled: true,
                imageDataUrl: dataUrl,
                cropZoom: 1,
                cropX: 0,
                cropY: 0,
              },
            };
          }),
        }));
      } else if (
        msg.type === 'PHOTO_CUTOUT_MOVED' &&
        typeof msg.payload?.roomIndex === 'number'
      ) {
        const { roomIndex, slot = 1, offsetX = 0, offsetZ = 0 } = msg.payload;
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
      } else if (
        msg.type === 'CUSTOM_TEXT_MOVED' &&
        typeof msg.payload?.roomIndex === 'number' &&
        msg.payload?.id
      ) {
        const { roomIndex, id, x = 0, y = 0 } = msg.payload;
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
      } else if (msg.type === 'EXPORT_COMPLETE' && msg.payload?.dataUrl) {
        setExporting(false);
        const meta = pendingExportMeta.current ?? { id: `exp_${Date.now()}`, resolution: '4K' as const };
        const saved = await saveExportToApp({
          id: meta.id,
          title: msg.payload.title || project.title,
          aspectRatio: project.aspectRatio,
          resolution: meta.resolution,
          dataUrl: msg.payload.dataUrl,
          mimeType: msg.payload.mimeType || 'video/webm',
        });
        successHaptic();
        Alert.alert('4K Video Ready', 'Saved inside Patra > Exports. Save to phone gallery or share now?', [
          { text: 'Done', style: 'cancel' },
          { text: 'Save Video', onPress: () => void saveToPhoneGallery(saved.fileUri) },
          { text: 'Share', onPress: () => void shareExportedVideo(saved.fileUri, saved.title) },
        ]);
      }
    } catch {
      // Ignore malformed message
    }
  };

  return {
    webRef,
    savedProjects,
    project,
    setProject,
    activeRoomIdx,
    setActiveRoomIdx,
    viewMode,
    setViewMode,
    ready,
    saving,
    exporting,
    exportPct,
    previewing,
    setPreviewing,
    paywallVisible,
    setPaywallVisible,
    paywallSubOnly,
    sendTo3D,
    selectSourceProject,
    handleSaveDraft,
    handleExport,
    handleWebMessage,
  };
}
