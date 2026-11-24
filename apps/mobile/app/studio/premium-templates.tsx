import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  PREMIUM_TEMPLATES,
  TemplatePreset,
  TemplateRegionId,
  hasStudioUnlockAccess,
} from '@patra/shared';
import { PaywallModal } from '../../src/components/PaywallModal';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { STUDIO_URL } from '../../src/lib/api';
import { FONTS, SHADOWS, tapHaptic } from '../../src/theme';

const StudioWebView = WebView as unknown as React.ComponentType<
  WebViewProps & {
    ref?: React.Ref<{ injectJavaScript: (script: string) => void }>;
  }
>;

const REGION_TABS: { id: 'all' | TemplateRegionId; label: string }[] = [
  { id: 'all', label: 'All (30)' },
  { id: 'indian', label: 'Indian (10)' },
  { id: 'western', label: 'Western (10)' },
  { id: 'east_asian', label: 'East Asian (10)' },
];

export default function PremiumTemplatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { colors } = useTheme();
  const webRef = useRef<{ injectJavaScript: (script: string) => void } | null>(null);

  const [region, setRegion] = useState<'all' | TemplateRegionId>('all');
  const [featured, setFeatured] = useState<TemplatePreset>(PREMIUM_TEMPLATES[0]);
  const [viewMode, setViewMode] = useState<'stage' | 'wax_envelope'>('stage');
  const [ready, setReady] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const unlocked = hasStudioUnlockAccess(user);

  const visibleTemplates = useMemo(
    () => (region === 'all' ? PREMIUM_TEMPLATES : PREMIUM_TEMPLATES.filter((t) => t.region === region)),
    [region]
  );

  const sendTo3D = (type: string, payload?: unknown) => {
    const json = JSON.stringify({ type, payload });
    webRef.current?.injectJavaScript(`window.__PATRA_MSG__ && window.__PATRA_MSG__(${json}); true;`);
  };

  useEffect(() => {
    if (ready) {
      sendTo3D('SET_PROJECT', featured.project);
      sendTo3D('SET_VIEW_MODE', viewMode);
    }
  }, [featured, viewMode, ready]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.ink }]}>Global Signature 3D</Text>
          <Text style={[styles.headerSub, { color: colors.muted }]}>30 Handcrafted Atelier Designs</Text>
        </View>
        {!unlocked ? (
          <TouchableOpacity
            style={[styles.unlockCta, { backgroundColor: colors.vermilion }]}
            onPress={() => {
              tapHaptic();
              setPaywallOpen(true);
            }}
          >
            <Ionicons name="lock-open-outline" size={14} color="#fff" />
            <Text style={styles.unlockCtaText}>Unlock</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={[styles.regionRow, { borderBottomColor: colors.border, backgroundColor: colors.paper }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.regionScroll}>
          {REGION_TABS.map((rt) => {
            const active = region === rt.id;
            return (
              <TouchableOpacity
                key={rt.id}
                style={[
                  styles.regionPill,
                  { borderColor: colors.border, backgroundColor: colors.cream },
                  active && { borderColor: colors.vermilion, backgroundColor: colors.vermilion },
                ]}
                onPress={() => {
                  tapHaptic();
                  setRegion(rt.id);
                  const firstMatch =
                    rt.id === 'all'
                      ? PREMIUM_TEMPLATES[0]
                      : PREMIUM_TEMPLATES.find((t) => t.region === rt.id);
                  if (firstMatch) {
                    setFeatured(firstMatch);
                    setViewMode('stage');
                  }
                }}
              >
                <Text style={[styles.regionText, { color: active ? '#fff' : colors.ink }]}>
                  {rt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.stageBox}>
        <StudioWebView
          ref={webRef}
          source={{ uri: `${STUDIO_URL}/?embed=1` }}
          style={{ flex: 1, backgroundColor: 'transparent' }}
          onMessage={(e) => {
            try {
              const msg = JSON.parse(e.nativeEvent.data) as { type: string };
              if (msg.type === 'READY') setReady(true);
              if (msg.type === 'PREVIEW_DONE') setPreviewing(false);
            } catch {}
          }}
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
          style={[styles.modeChip, { borderColor: colors.border, borderWidth: 1 }]}
          onPress={() => {
            tapHaptic();
            setViewMode('stage');
            sendTo3D('PLAY_UNFOLD');
          }}
        >
          <Text style={[styles.modeText, { color: colors.ink }]}>Unfold</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeChip, { borderColor: colors.border, borderWidth: 1 }]}
          onPress={() => {
            tapHaptic();
            setViewMode('wax_envelope');
            sendTo3D('PLAY_WAX_OPENING');
          }}
        >
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

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {visibleTemplates.map((tpl) => {
          const active = tpl.id === featured.id;
          return (
            <View
              key={tpl.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.cream,
                  borderColor: active ? colors.vermilion : colors.border,
                },
              ]}
            >
              <LinearGradient
                colors={[tpl.previewGradient[0], tpl.previewGradient[1]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardTop}
              >
                <View style={styles.cardTagPill}>
                  <Text style={styles.cardTagText}>{tpl.vibeTag}</Text>
                </View>
                <Text style={styles.cardName}>{tpl.name}</Text>
                <Text style={styles.cardMeta}>
                  {tpl.project.cornersCount ?? 4} Corners · {tpl.project.rooms.length} Room
                  {tpl.project.rooms.length > 1 ? 's' : ''}
                </Text>
              </LinearGradient>

              <View style={styles.cardBody}>
                <Text style={[styles.cardSub, { color: colors.muted }]}>{tpl.subtitle}</Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.cardBtn, { borderColor: colors.border, backgroundColor: colors.paper }]}
                    onPress={() => {
                      tapHaptic();
                      setFeatured(tpl);
                      setViewMode('stage');
                    }}
                  >
                    <Text style={[styles.cardBtnText, { color: colors.ink }]}>Preview 3D</Text>
                  </TouchableOpacity>
                  {unlocked && (
                    <TouchableOpacity
                      style={[styles.cardBtn, { backgroundColor: colors.vermilion, borderColor: colors.vermilion }]}
                      onPress={() => {
                        tapHaptic();
                        router.push(`/editor/tpl:${tpl.id}` as never);
                      }}
                    >
                      <Text style={[styles.cardBtnText, { color: '#fff' }]}>Customize</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {!unlocked && (
                <View style={styles.blurLockOverlay}>
                  <View style={styles.lockBadge}>
                    <Ionicons name="lock-closed" size={20} color="#fff" />
                  </View>
                  <Text style={styles.lockTitle}>{tpl.name}</Text>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={[styles.lockBtn, { backgroundColor: 'rgba(255,255,255,0.92)' }]}
                      onPress={() => {
                        tapHaptic();
                        setFeatured(tpl);
                        setViewMode('stage');
                      }}
                    >
                      <Text style={[styles.lockBtnText, { color: '#181512' }]}>Preview 3D</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.lockBtn, { backgroundColor: colors.vermilion }]}
                      onPress={() => {
                        tapHaptic();
                        setPaywallOpen(true);
                      }}
                    >
                      <Text style={[styles.lockBtnText, { color: '#fff' }]}>Unlock</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <PaywallModal
        visible={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        onUnlocked={() => {
          setPaywallOpen(false);
          void refreshUser();
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
  unlockCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 10,
  },
  unlockCtaText: { fontFamily: FONTS.bold, color: '#fff', fontSize: 12.5 },
  regionRow: { borderBottomWidth: 1 },
  regionScroll: { paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  regionPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  regionText: { fontFamily: FONTS.semibold, fontSize: 12 },
  stageBox: { height: 225, position: 'relative' },
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
  list: { padding: 14, gap: 16, paddingBottom: 36 },
  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.paperCard,
  },
  cardTop: { padding: 16, gap: 6 },
  cardTagPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  cardTagText: { fontFamily: FONTS.bold, color: '#fff', fontSize: 10.5 },
  cardName: { fontFamily: FONTS.bold, color: '#fff', fontSize: 18 },
  cardMeta: { fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.9)', fontSize: 12 },
  cardBody: { padding: 14, gap: 10 },
  cardSub: { fontFamily: FONTS.regular, fontSize: 12.5, lineHeight: 18 },
  cardActions: { flexDirection: 'row', gap: 8 },
  cardBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  cardBtnText: { fontFamily: FONTS.semibold, fontSize: 12.5 },
  blurLockOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20, 17, 15, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  lockBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockTitle: { fontFamily: FONTS.bold, fontSize: 16, color: '#fff' },
  lockBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
  },
  lockBtnText: { fontFamily: FONTS.semibold, fontSize: 12.5 },
});
