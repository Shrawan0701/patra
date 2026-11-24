import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewProps } from 'react-native-webview';
import { DEFAULT_WAX_SEAL } from '@patra/shared';
import { MobileInspectorTab, MobileProjectInspector } from '../../src/components/MobileProjectInspector';
import { MobileTemplatePicker } from '../../src/components/MobileTemplatePicker';
import { PaywallModal } from '../../src/components/PaywallModal';
import { StudioWebRef, useMobileStudioProject } from '../../src/hooks/useMobileStudioProject';
import { STUDIO_URL } from '../../src/lib/api';
import { useTheme } from '../../src/context/ThemeContext';
import { FONTS, tapHaptic } from '../../src/theme';

const StudioWebView = WebView as unknown as React.ComponentType<
  WebViewProps & { ref?: React.Ref<StudioWebRef> }
>;

export default function WaxSealScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<MobileInspectorTab>('wax');

  const {
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
  } = useMobileStudioProject('wax_envelope');

  const wax = project.waxSeal ?? DEFAULT_WAX_SEAL;

  const playUnseal = () => {
    tapHaptic();
    if (!wax.enabled) {
      setProject((p) => ({ ...p, waxSeal: { ...wax, enabled: true } }));
    }
    setViewMode('wax_envelope');
    sendTo3D('PLAY_WAX_OPENING');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.ink }]}>Wax-Seal Envelope</Text>
          <Text style={[styles.headerSub, { color: colors.muted }]} numberOfLines={1}>
            {project.title}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.cream }]}
          disabled={saving}
          onPress={() => void handleSaveDraft()}
        >
          <Ionicons name="bookmark-outline" size={17} color={colors.ink} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.exportBtn, { backgroundColor: colors.vermilion }]}
          disabled={exporting}
          onPress={() => void handleExport()}
        >
          <Ionicons name="download-outline" size={15} color="#fff" />
          <Text style={styles.exportText}>{exporting ? `${exportPct}%` : '4K'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stageBox}>
        <StudioWebView
          ref={webRef}
          source={{ uri: `${STUDIO_URL}/?embed=1` }}
          style={{ flex: 1, backgroundColor: 'transparent' }}
          onMessage={handleWebMessage}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          originWhitelist={['*']}
        />
        {!ready && (
          <View style={[styles.loaderOverlay, { backgroundColor: colors.paper }]}>
            <ActivityIndicator color={colors.vermilion} />
          </View>
        )}
      </View>

      <View style={[styles.actionStrip, { borderColor: colors.border, backgroundColor: colors.cream }]}>
        <TouchableOpacity
          style={[styles.modeChip, viewMode === 'wax_envelope' && { backgroundColor: colors.vermilion }]}
          onPress={() => {
            tapHaptic();
            setViewMode('wax_envelope');
          }}
        >
          <Text style={[styles.modeText, { color: viewMode === 'wax_envelope' ? '#fff' : colors.ink }]}>
            Envelope
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeChip, viewMode === 'stage' && { backgroundColor: colors.vermilion }]}
          onPress={() => {
            tapHaptic();
            setViewMode('stage');
          }}
        >
          <Text style={[styles.modeText, { color: viewMode === 'stage' ? '#fff' : colors.ink }]}>
            Stage
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modeChip, { borderColor: colors.border, borderWidth: 1 }]} onPress={playUnseal}>
          <Text style={[styles.modeText, { color: colors.ink }]}>Unseal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeChip, { borderColor: colors.border, borderWidth: 1 }]}
          onPress={() => {
            tapHaptic();
            if (previewing) {
              setPreviewing(false);
              sendTo3D('STOP_PREVIEW');
            } else {
              if (!wax.enabled) {
                setProject((p) => ({ ...p, waxSeal: { ...wax, enabled: true } }));
              }
              setPreviewing(true);
              sendTo3D('START_PREVIEW');
            }
          }}
        >
          <Text style={[styles.modeText, { color: colors.vermilion }]}>
            {previewing ? 'Stop' : 'Preview'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.controls} showsVerticalScrollIndicator={false}>
        <MobileTemplatePicker
          savedProjects={savedProjects}
          activeTitle={project.title}
          activeProjectId={project.id}
          onSelect={selectSourceProject}
        />

        <MobileProjectInspector
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
          onPickPhoto={(slot) => sendTo3D('PICK_PHOTO', { slot })}
          onFocusPhoto={(slot) => {
            setViewMode('stage');
            sendTo3D('FOCUS_PHOTO', slot);
          }}
          onPlayWaxOpening={playUnseal}
        />
      </ScrollView>

      <PaywallModal
        visible={paywallVisible}
        projectId={project.id}
        onClose={() => setPaywallVisible(false)}
        onUnlocked={() => {
          setPaywallVisible(false);
          void handleExport();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 16 },
  headerSub: { fontFamily: FONTS.regular, fontSize: 11.5 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 10,
  },
  exportText: { fontFamily: FONTS.bold, color: '#fff', fontSize: 12.5 },
  stageBox: { height: 255, position: 'relative' },
  loaderOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  actionStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  modeChip: { flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  modeText: { fontFamily: FONTS.semibold, fontSize: 12 },
  controls: { padding: 14, gap: 12 },
  hRow: { gap: 8, paddingBottom: 4 },
  projChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  projChipText: { fontFamily: FONTS.semibold, fontSize: 12 },
});
