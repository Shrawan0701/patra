import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent, WebViewProps } from 'react-native-webview';
import {
  CategoryId,
  DEFAULT_PHOTO_CUTOUT,
  DEFAULT_PHOTO_CUTOUT_2,
  ProjectConfig,
  TEMPLATES,
  createCustomProject,
  findTemplateById,
  getProjectTotalSeconds,
  hasPremiumStudioFeatures,
  hasStudioUnlockAccess,
} from '@patra/shared';
import {
  MobileInspectorTab,
  MobileProjectInspector,
} from '../../src/components/MobileProjectInspector';
import { PaywallModal } from '../../src/components/PaywallModal';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { ApiError, STUDIO_URL, api } from '../../src/lib/api';
import { saveExportToApp, saveToPhoneGallery, shareExportedVideo } from '../../src/lib/localExports';
import { FONTS, SHADOWS, successHaptic, tapHaptic } from '../../src/theme';

const StudioWebView = WebView as unknown as React.ComponentType<
  WebViewProps & {
    ref?: React.Ref<{
      postMessage: (msg: string) => void;
      injectJavaScript: (script: string) => void;
    }>;
  }
>;

export default function EditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user, refreshUser } = useAuth();
  const webRef = useRef<{
    postMessage: (msg: string) => void;
    injectJavaScript: (script: string) => void;
  } | null>(null);

  const [project, setProject] = useState<ProjectConfig>(() => structuredClone(TEMPLATES[0].project));
  const [activeRoomIdx, setActiveRoomIdx] = useState(0);
  const [dockTab, setDockTab] = useState<MobileInspectorTab>('text');
  const [webReady, setWebReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewProgress, setPreviewProgress] = useState({ elapsed: 0, total: 0 });
  const [exporting, setExporting] = useState(false);
  const [exportPct, setExportPct] = useState(0);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const pendingExportMeta = useRef<{ id: string; resolution: '1080p' | '4K' } | null>(null);

  useEffect(() => {
    if (!id) return;
    if (id.startsWith('tpl:')) {
      const tplId = id.slice(4);
      const found = findTemplateById(tplId) ?? TEMPLATES[0];
      setProject(structuredClone(found.project));
      setActiveRoomIdx(0);
      if (found.isPremium && !hasStudioUnlockAccess(user)) {
        setPaywallVisible(true);
      }
    } else if (id.startsWith('custom:')) {
      const [, cat, countStr, paletteId] = id.split(':');
      const count = Number(countStr || '1');
      const custom = createCustomProject((cat as CategoryId) || 'wedding', count);
      if (paletteId) {
        custom.rooms = custom.rooms.map((r) => ({ ...r, paletteId }));
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
  }, [id]);

  const sendTo3D = (type: string, payload?: unknown) => {
    const msg = JSON.stringify({ type, payload, activeRoomIdx });
    if (webRef.current?.injectJavaScript) {
      webRef.current.injectJavaScript(
        `if (window.__PATRA_MSG__) { window.__PATRA_MSG__(${JSON.stringify(msg)}); } true;`
      );
    } else {
      webRef.current?.postMessage(msg);
    }
  };

  useEffect(() => {
    if (webReady) {
      sendTo3D('SET_PROJECT', project);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, webReady]);

  useEffect(() => {
    if (webReady) {
      const mode =
        dockTab === 'wax'
          ? 'wax_envelope'
          : dockTab === 'garden'
          ? 'garden_entrance'
          : 'stage';
      sendTo3D('SET_VIEW_MODE', mode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dockTab, webReady]);

  const totalVideoSeconds = useMemo(() => getProjectTotalSeconds(project), [project]);

  const togglePreview = () => {
    tapHaptic();
    if (exporting) return;
    if (previewing) {
      setPreviewing(false);
      sendTo3D('STOP_PREVIEW');
    } else {
      setPreviewProgress({ elapsed: 0, total: totalVideoSeconds });
      setPreviewing(true);
      sendTo3D('START_PREVIEW');
    }
  };

  const handleSaveDraft = async (): Promise<string | undefined> => {
    tapHaptic();
    setSaving(true);
    try {
      if (project.id) {
        const res = await api.updateProject(project.id, project);
        setProject(res.project);
        successHaptic();
        Alert.alert('Draft Saved', 'Your 3D invitation draft is saved.');
        return res.project.id;
      } else {
        const res = await api.createProject(project);
        setProject(res.project);
        successHaptic();
        Alert.alert('Draft Saved', 'Saved to Studio > Drafts.');
        return res.project.id;
      }
    } catch (err) {
      Alert.alert('Save Failed', err instanceof Error ? err.message : 'Unable to save draft');
      return project.id;
    } finally {
      setSaving(false);
    }
  };

  const startDownloadFlow = async () => {
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
        // Proceed with authorization check
      }
    }

    try {
      const authRes = await api.authorizeExport({
        projectId: savedId,
        projectTitle: project.title,
        aspectRatio: project.aspectRatio,
        usesPremiumFeatures: hasPremiumStudioFeatures(project),
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
        setPaywallVisible(true);
      } else {
        Alert.alert('Download Error', err instanceof Error ? err.message : 'Unable to download video');
      }
    }
  };

  const handleWebMessage = async (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as {
        type: string;
        payload?: {
          pct?: number;
          elapsed?: number;
          total?: number;
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
        setWebReady(true);
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
        msg.payload.id
      ) {
        const { roomIndex, id: ctId, x = 0, y = 0 } = msg.payload;
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
      } else if (msg.type === 'PREVIEW_PROGRESS') {
        setPreviewProgress({
          elapsed: msg.payload?.elapsed ?? 0,
          total: msg.payload?.total ?? totalVideoSeconds,
        });
      } else if (msg.type === 'PREVIEW_DONE') {
        setPreviewing(false);
      } else if (msg.type === 'EXPORT_PROGRESS' && typeof msg.payload?.pct === 'number') {
        setExportPct(msg.payload.pct);
      } else if (msg.type === 'EXPORT_COMPLETE' && msg.payload?.dataUrl) {
        const meta = pendingExportMeta.current ?? {
          id: String(Date.now()),
          resolution: '4K' as const,
        };
        const saved = await saveExportToApp({
          id: meta.id,
          title: project.title,
          aspectRatio: project.aspectRatio,
          resolution: meta.resolution,
          dataUrl: msg.payload.dataUrl,
          mimeType: msg.payload.mimeType || 'video/mp4',
        });
        setExporting(false);
        successHaptic();

        Alert.alert('3D Video Ready!', 'Saved inside your Patra Downloads tab.', [
          {
            text: 'Save to Photos',
            onPress: async () => {
              const savedOk = await saveToPhoneGallery(saved.fileUri);
              if (savedOk) {
                Alert.alert('Saved to Photos', 'Your 3D invitation video is in your Photos gallery.');
              }
            },
          },
          {
            text: 'Share Now',
            onPress: () => void shareExportedVideo(saved.fileUri, saved.title),
          },
          { text: 'Done', style: 'cancel' },
        ]);
      }
    } catch {
      // Ignore invalid messages
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.paper }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.stageWrap}>
        <StudioWebView
          ref={webRef}
          source={{ uri: `${STUDIO_URL}/?embed=1` }}
          style={styles.webview}
          onMessage={handleWebMessage}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          originWhitelist={['*']}
          bounces={false}
        />

        <View style={[styles.topOverlay, { top: insets.top + 8 }]}>
          <TouchableOpacity
            style={[
              styles.iconPill,
              { backgroundColor: colors.cream, borderColor: colors.border },
            ]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
          </TouchableOpacity>

          <View style={styles.topRight}>
            <TouchableOpacity
              style={[
                styles.iconPill,
                { backgroundColor: colors.cream, borderColor: colors.border },
              ]}
              onPress={() => {
                tapHaptic();
                const next = !isMuted;
                setIsMuted(next);
                sendTo3D('TOGGLE_AUDIO', next);
              }}
            >
              <Ionicons
                name={isMuted ? 'volume-mute' : 'volume-high'}
                size={16}
                color={colors.ink}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconPill,
                { backgroundColor: colors.cream, borderColor: colors.border },
              ]}
              onPress={handleSaveDraft}
              disabled={saving}
            >
              <Ionicons name="bookmark-outline" size={16} color={colors.ink} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.previewBtn,
                {
                  backgroundColor: previewing ? colors.ink : colors.cream,
                  borderColor: colors.borderStrong,
                },
              ]}
              onPress={togglePreview}
              disabled={exporting}
            >
              <Ionicons
                name={previewing ? 'stop' : 'play'}
                size={13}
                color={previewing ? colors.paper : colors.ink}
              />
              <Text
                style={[
                  styles.previewText,
                  { color: previewing ? colors.paper : colors.ink },
                ]}
              >
                {previewing
                  ? `${previewProgress.elapsed}s/${previewProgress.total}s`
                  : 'Preview'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.downloadBtn, { backgroundColor: colors.vermilion }]}
              onPress={startDownloadFlow}
              disabled={exporting}
            >
              {exporting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={15} color="#fff" />
                  <Text style={styles.downloadText}>Download</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {!previewing && (
          <View
            style={[
              styles.roomOverlay,
              { backgroundColor: colors.cream, borderColor: colors.border },
            ]}
          >
            {project.rooms.map((r, i) => {
              const active = activeRoomIdx === i;
              return (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.roomPill, active && { backgroundColor: colors.ink }]}
                  onPress={() => {
                    tapHaptic();
                    setActiveRoomIdx(i);
                    sendTo3D('SET_ROOM', i);
                  }}
                >
                  <Text
                    style={[
                      styles.roomPillText,
                      { color: active ? colors.paper : colors.ink },
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      <View
        style={[
          styles.dock,
          { backgroundColor: colors.cream, borderColor: colors.border },
        ]}
      >
        <View style={[styles.grabber, { backgroundColor: colors.borderStrong }]} />
        <ScrollView style={styles.dockBody} showsVerticalScrollIndicator={false}>
          <MobileProjectInspector
            project={project}
            setProject={setProject}
            activeRoomIdx={activeRoomIdx}
            setActiveRoomIdx={setActiveRoomIdx}
            tabs={['text', 'photo', 'colors', 'props', 'rooms', 'garden', 'music', 'wax', 'atmosphere', 'format']}
            activeTab={dockTab}
            onTabChange={setDockTab}
            onPickPhoto={(slot) => sendTo3D('PICK_PHOTO', { slot })}
            onFocusPhoto={(slot) => sendTo3D('FOCUS_PHOTO', slot)}
            onPlayWaxOpening={() => sendTo3D('PLAY_WAX_OPENING')}
          />
        </ScrollView>
      </View>

      <PaywallModal
        visible={paywallVisible}
        projectId={project.id}
        onClose={() => setPaywallVisible(false)}
        onUnlocked={() => {
          setPaywallVisible(false);
          void startDownloadFlow();
        }}
      />

      {exporting && (
        <View style={[styles.exportBanner, { backgroundColor: colors.ink }]}>
          <Text style={[styles.exportBannerText, { color: colors.paper }]}>
            Rendering {totalVideoSeconds}s 3D Video... {exportPct}%
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  stageWrap: { height: '48%', width: '100%', position: 'relative' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  topOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
  },
  previewText: { fontFamily: FONTS.semibold, fontSize: 12 },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
  },
  downloadText: { fontFamily: FONTS.semibold, color: '#fff', fontSize: 12 },
  roomOverlay: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  roomPill: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999 },
  roomPillText: { fontFamily: FONTS.semibold, fontSize: 12 },
  dock: {
    flex: 1,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    paddingTop: 8,
    ...SHADOWS.floatingDock,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  dockBody: { flex: 1, paddingHorizontal: 16, paddingTop: 4 },
  exportBanner: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  exportBannerText: { fontFamily: FONTS.semibold, fontSize: 13 },
});
