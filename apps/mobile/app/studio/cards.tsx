import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent, WebViewProps } from 'react-native-webview';
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
  getMobileCardRendererHtml,
} from '@patra/shared';
import { PaywallModal } from '../../src/components/PaywallModal';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { ApiError, api } from '../../src/lib/api';
import {
  saveExportToApp,
  saveToPhoneGallery,
  shareExportedVideo,
} from '../../src/lib/localExports';
import { FONTS, successHaptic, tapHaptic } from '../../src/theme';

const CardWebView = WebView as unknown as React.ComponentType<
  WebViewProps & {
    ref?: React.Ref<{
      postMessage: (msg: string) => void;
      injectJavaScript: (script: string) => void;
    }>;
  }
>;

type MobileCardTab = 'templates' | 'text' | 'photo' | 'style' | 'decor' | 'size';

const TABS: { id: MobileCardTab; label: string }[] = [
  { id: 'templates', label: 'Templates (24)' },
  { id: 'text', label: 'Text' },
  { id: 'photo', label: 'Photos (2)' },
  { id: 'style', label: 'Style' },
  { id: 'decor', label: 'Decor & Seal' },
  { id: 'size', label: 'Size' },
];

export default function MobileCardsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { refreshUser } = useAuth();
  const webRef = useRef<{
    postMessage: (msg: string) => void;
    injectJavaScript: (script: string) => void;
  } | null>(null);

  const initialCard = useMemo(
    () => JSON.parse(JSON.stringify(CARD_TEMPLATES[0].config)) as InvitationCardConfig,
    []
  );
  const rendererHtml = useMemo(() => getMobileCardRendererHtml(initialCard), [initialCard]);

  const [card, setCard] = useState<InvitationCardConfig>(initialCard);
  const [textEdited, setTextEdited] = useState(false);
  const [photoSlot, setPhotoSlot] = useState<1 | 2>(1);
  const [webReady, setWebReady] = useState(false);
  const [activeTab, setActiveTab] = useState<MobileCardTab>('templates');
  const [regionFilter, setRegionFilter] = useState<'all' | TemplateRegionId>('all');
  const [catFilter, setCatFilter] = useState<'all' | CategoryId>('all');
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');
  const [busy, setBusy] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const pendingMode = useRef<'save' | 'share'>('save');
  const pendingExportId = useRef<string | null>(null);

  const filteredTemplates = useMemo(
    () =>
      CARD_TEMPLATES.filter((t) => {
        if (regionFilter !== 'all' && t.region !== regionFilter) return false;
        if (catFilter !== 'all' && t.category !== catFilter) return false;
        return true;
      }),
    [regionFilter, catFilter]
  );

  const sendToRenderer = useCallback(
    (type: string, payload?: unknown) => {
      if (!webRef.current) return;
      const json = JSON.stringify({ type, payload });
      webRef.current.injectJavaScript(
        `if (window.__PATRA_CARD_MSG__) { window.__PATRA_CARD_MSG__(${JSON.stringify(json)}); } true;`
      );
    },
    []
  );

  useEffect(() => {
    if (webReady) {
      sendToRenderer('SET_CARD', card);
    }
  }, [card, webReady, sendToRenderer]);

  const updateCard = (patch: Partial<InvitationCardConfig>, markText = false) => {
    if (markText) setTextEdited(true);
    setCard((prev) => ({ ...prev, ...patch }));
  };

  const applyTemplate = (tplId: string, forceSample = false) => {
    tapHaptic();
    const found = CARD_TEMPLATES.find((t) => t.id === tplId);
    if (!found) return;
    const next = JSON.parse(JSON.stringify(found.config)) as InvitationCardConfig;
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
      if (!forceSample && textEdited) {
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

  const startDownloadOrShare = async (mode: 'save' | 'share') => {
    if (busy || !webReady) return;
    tapHaptic();
    pendingMode.current = mode;
    setBusy(true);
    try {
      const authAspect = card.aspectRatio === '4:5' ? '9:16' : card.aspectRatio;
      const auth = await api.authorizeExport({
        projectTitle: `${card.coupleOrHeadline || card.title} (Card)`,
        aspectRatio: authAspect,
        usesPremiumFeatures: true,
      });
      await refreshUser();
      pendingExportId.current = auth.record.id;
      sendToRenderer('EXPORT_CARD', { format: exportFormat });
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && (err.status === 402 || err.code === 'PAYWALL_REQUIRED')) {
        setPaywallVisible(true);
      } else {
        Alert.alert('Download Error', err instanceof Error ? err.message : 'Unable to download card');
      }
    }
  };

  const handleWebMessage = async (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        slot?: number;
        posX?: number;
        posY?: number;
        dataUrl?: string;
        mimeType?: string;
      };
      if (msg.type === 'READY') {
        setWebReady(true);
      } else if (msg.type === 'PHOTO_PICKED' && msg.dataUrl) {
        if (msg.slot === 2) {
          setCard((prev) => ({
            ...prev,
            photo2Enabled: true,
            photo2DataUrl: msg.dataUrl,
            photo2Size: prev.photo2Size ?? 0.27,
            photo2PosX: prev.photo2PosX ?? 0.19,
            photo2PosY: prev.photo2PosY ?? 0.295,
            photo2Zoom: 1,
            photo2PanX: 0,
            photo2PanY: 0,
            ...(prev.photoEnabled && typeof prev.photoPosX !== 'number'
              ? { photoPosX: -0.19, photoSize: prev.photoSize ?? 0.27 }
              : {}),
          }));
        } else {
          setCard((prev) => ({
            ...prev,
            photoEnabled: true,
            photoDataUrl: msg.dataUrl!,
            photoSize: prev.photoSize ?? (prev.photo2Enabled ? 0.27 : 0.34),
            photoPosX: prev.photoPosX ?? (prev.photo2Enabled ? -0.19 : 0),
            photoPosY: prev.photoPosY ?? 0.295,
            photoZoom: 1,
            photoPanX: 0,
            photoPanY: 0,
          }));
        }
      } else if (msg.type === 'PHOTO_MOVED' && typeof msg.posX === 'number' && typeof msg.posY === 'number') {
        if (msg.slot === 2) {
          setPhotoSlot(2);
          updateCard({ photo2PosX: msg.posX, photo2PosY: msg.posY });
        } else {
          setPhotoSlot(1);
          updateCard({ photoPosX: msg.posX, photoPosY: msg.posY });
        }
      } else if (msg.type === 'CARD_EXPORTED' && msg.dataUrl) {
        try {
          const item = await saveExportToApp({
            id: pendingExportId.current || `card_${Date.now()}`,
            title: `${card.coupleOrHeadline || card.title} (Card)`,
            aspectRatio: card.aspectRatio === '4:5' ? '9:16' : card.aspectRatio,
            resolution: '4K',
            dataUrl: msg.dataUrl,
            mimeType: msg.mimeType || (exportFormat === 'jpeg' ? 'image/jpeg' : 'image/png'),
          });
          const savedPhotos = await saveToPhoneGallery(item.fileUri);
          successHaptic();

          if (pendingMode.current === 'share') {
            await shareExportedVideo(item.fileUri, item.title);
          } else {
            Alert.alert(
              'HD Card Ready',
              savedPhotos
                ? 'Saved to Phone Photos and Patra Downloads!'
                : 'Saved to Patra Downloads! Tap Share to send anywhere.',
              [
                { text: 'Share Now', onPress: () => void shareExportedVideo(item.fileUri, item.title) },
                { text: 'Done', style: 'cancel' },
              ]
            );
          }
        } finally {
          setBusy(false);
        }
      }
    } catch {
      // Ignore malformed bridge events
    }
  };

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
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.paper }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Bar */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.ink }]} numberOfLines={1}>
            1-Page Invitation Cards
          </Text>
          <Text style={[styles.headerSub, { color: colors.muted }]} numberOfLines={1}>
            {card.title} · {card.aspectRatio}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.fmtBtn, { borderColor: colors.border, backgroundColor: colors.cream }]}
          onPress={() => {
            tapHaptic();
            setExportFormat((f) => (f === 'png' ? 'jpeg' : 'png'));
          }}
        >
          <Text style={[styles.fmtText, { color: colors.ink }]}>
            {exportFormat === 'png' ? 'PNG' : 'JPG'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.cream }]}
          disabled={busy}
          onPress={() => void startDownloadOrShare('share')}
        >
          <Ionicons name="share-outline" size={18} color={colors.ink} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.exportBtn, { backgroundColor: colors.vermilion }]}
          disabled={busy}
          onPress={() => void startDownloadOrShare('save')}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="download-outline" size={15} color="#fff" />
              <Text style={styles.exportText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Live High-DPI Card Preview */}
      <View style={styles.stageBox}>
        <CardWebView
          ref={webRef}
          source={{ html: rendererHtml, baseUrl: '' }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          onLoadEnd={() => {
            setWebReady(true);
            sendToRenderer('SET_CARD', card);
          }}
          onMessage={(ev) => void handleWebMessage(ev)}
          originWhitelist={['*']}
          bounces={false}
        />
        {!webReady && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator color={colors.vermilion} />
          </View>
        )}
      </View>

      {/* Dock Inspector */}
      <View style={[styles.dock, { backgroundColor: colors.cream, borderColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabBarScroll}
          contentContainerStyle={styles.tabBar}
        >
          {TABS.map((t) => {
            const active = activeTab === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.tabPill,
                  { borderColor: colors.border, backgroundColor: colors.paper },
                  active && { borderColor: colors.ink, backgroundColor: colors.ink },
                ]}
                onPress={() => {
                  tapHaptic();
                  setActiveTab(t.id);
                }}
              >
                <Text style={[styles.tabText, { color: active ? colors.paper : colors.ink }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView style={styles.dockBody} showsVerticalScrollIndicator={false}>
          {activeTab === 'templates' && (
            <View style={styles.secGap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
                {(
                  [
                    ['all', `All (${CARD_TEMPLATES.length})`],
                    ['indian', 'Indian (10)'],
                    ['western', 'Western (8)'],
                    ['east_asian', 'East Asian (6)'],
                  ] as const
                ).map(([id, lbl]) => (
                  <TouchableOpacity
                    key={id}
                    style={[
                      styles.pill,
                      { borderColor: colors.border, backgroundColor: colors.paper },
                      regionFilter === id && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                    ]}
                    onPress={() => setRegionFilter(id)}
                  >
                    <Text style={[styles.pillText, { color: regionFilter === id ? colors.vermilion : colors.ink }]}>
                      {lbl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
                <TouchableOpacity
                  style={[
                    styles.pill,
                    { borderColor: colors.border, backgroundColor: colors.paper },
                    catFilter === 'all' && { borderColor: colors.ink, backgroundColor: colors.ink },
                  ]}
                  onPress={() => setCatFilter('all')}
                >
                  <Text style={[styles.pillText, { color: catFilter === 'all' ? colors.paper : colors.ink }]}>
                    All Events
                  </Text>
                </TouchableOpacity>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.pill,
                      { borderColor: colors.border, backgroundColor: colors.paper },
                      catFilter === c.id && { borderColor: colors.ink, backgroundColor: colors.ink },
                    ]}
                    onPress={() => setCatFilter(c.id)}
                  >
                    <Text style={[styles.pillText, { color: catFilter === c.id ? colors.paper : colors.ink }]}>
                      {c.shortName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.tplGrid}>
                {filteredTemplates.map((tpl) => {
                  const selected = card.templateId === tpl.id;
                  return (
                    <TouchableOpacity
                      key={tpl.id}
                      style={[
                        styles.tplTile,
                        { borderColor: colors.border, backgroundColor: colors.paper },
                        selected && { borderWidth: 2, borderColor: colors.vermilion },
                      ]}
                      onPress={() => applyTemplate(tpl.id)}
                    >
                      <View
                        style={[
                          styles.tplSwatch,
                          { backgroundColor: tpl.config.paperColor, borderColor: tpl.config.accentColor },
                        ]}
                      >
                        <Text style={[styles.tplVibe, { color: tpl.config.inkColor }]}>{tpl.vibeTag}</Text>
                      </View>
                      <Text style={[styles.tplName, { color: colors.ink }]} numberOfLines={1}>
                        {tpl.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {textEdited && (
                <TouchableOpacity
                  style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.paper, alignSelf: 'flex-start' }]}
                  onPress={() => {
                    setTextEdited(false);
                    applyTemplate(card.templateId, true);
                  }}
                >
                  <Text style={[styles.pillText, { color: colors.ink }]}>Reset to Sample Copy</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {activeTab === 'text' && (
            <View style={styles.secGap}>
              <Text style={[styles.label, { color: colors.muted }]}>FONT STYLE</Text>
              <View style={styles.wrapRow}>
                {FONT_STYLES.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[
                      styles.pill,
                      { borderColor: colors.border, backgroundColor: colors.paper },
                      card.fontStyle === f.id && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                    ]}
                    onPress={() => updateCard({ fontStyle: f.id as FontStyleId })}
                  >
                    <Text style={[styles.pillText, { color: card.fontStyle === f.id ? colors.vermilion : colors.ink }]}>
                      {f.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {(
                [
                  ['topBlessing', 'TOP BLESSING / HEADER'],
                  ['coupleOrHeadline', 'COUPLE NAMES / HEADLINE'],
                  ['hostsLine', 'INVITATION / HOST LINE'],
                  ['dateText', 'DATE'],
                  ['timeText', 'TIME'],
                  ['venueText', 'VENUE & CITY'],
                  ['footerNote', 'BOTTOM NOTE / DRESS CODE'],
                ] as const
              ).map(([field, lbl]) => (
                <View key={field}>
                  <Text style={[styles.label, { color: colors.muted }]}>{lbl}</Text>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, backgroundColor: colors.paper, color: colors.ink }]}
                    value={card[field]}
                    onChangeText={(txt) => updateCard({ [field]: txt }, true)}
                  />
                </View>
              ))}
            </View>
          )}

          {activeTab === 'photo' && (
            <View style={styles.secGap}>
              <View style={styles.slotRow}>
                {([1, 2] as const).map((s) => {
                  const has = s === 1 ? Boolean(card.photoEnabled && card.photoDataUrl) : Boolean(card.photo2Enabled && card.photo2DataUrl);
                  const active = photoSlot === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.slotBtn,
                        { borderColor: colors.border, backgroundColor: colors.paper },
                        active && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                      ]}
                      onPress={() => {
                        tapHaptic();
                        setPhotoSlot(s);
                      }}
                    >
                      <Text style={[styles.pillText, { color: active ? colors.vermilion : colors.ink }]}>
                        Photo {s} {has ? '· On' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.vermilion }]}
                onPress={() => sendToRenderer('PICK_PHOTO', { slot: photoSlot })}
              >
                <Ionicons name="image-outline" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>
                  {slotDataUrl ? `Replace Photo ${photoSlot}` : `Upload Photo ${photoSlot}`}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.headerSub, { color: colors.muted }]}>
                Tip: Touch &amp; drag your photo directly on the card preview above.
              </Text>

              {slotDataUrl ? (
                <>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.label, { color: colors.muted }]}>
                      FRAME SIZE ({Math.round(slotSize * 100)}%)
                    </Text>
                    <View style={styles.rowGap}>
                      <TouchableOpacity
                        style={[styles.stepBtn, { borderColor: colors.border, backgroundColor: colors.paper }]}
                        onPress={() => patchSlot({ size: Math.max(0.16, Number((slotSize - 0.03).toFixed(2))) })}
                      >
                        <Text style={[styles.pillText, { color: colors.ink }]}>-</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.stepBtn, { borderColor: colors.border, backgroundColor: colors.paper }]}
                        onPress={() => patchSlot({ size: Math.min(0.52, Number((slotSize + 0.03).toFixed(2))) })}
                      >
                        <Text style={[styles.pillText, { color: colors.ink }]}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.rowBetween}>
                    <Text style={[styles.label, { color: colors.muted }]}>MOVE POSITION</Text>
                    <View style={styles.rowGap}>
                      <TouchableOpacity
                        style={[styles.stepBtn, { borderColor: colors.border, backgroundColor: colors.paper }]}
                        onPress={() => patchSlot({ posX: Math.max(-0.38, slotPosX - 0.04) })}
                      >
                        <Text style={[styles.pillText, { color: colors.ink }]}>←</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.stepBtn, { borderColor: colors.border, backgroundColor: colors.paper }]}
                        onPress={() => patchSlot({ posX: Math.min(0.38, slotPosX + 0.04) })}
                      >
                        <Text style={[styles.pillText, { color: colors.ink }]}>→</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.stepBtn, { borderColor: colors.border, backgroundColor: colors.paper }]}
                        onPress={() => patchSlot({ posY: Math.max(0.15, slotPosY - 0.04) })}
                      >
                        <Text style={[styles.pillText, { color: colors.ink }]}>↑</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.stepBtn, { borderColor: colors.border, backgroundColor: colors.paper }]}
                        onPress={() => patchSlot({ posY: Math.min(0.82, slotPosY + 0.04) })}
                      >
                        <Text style={[styles.pillText, { color: colors.ink }]}>↓</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.rowBetween}>
                    <Text style={[styles.label, { color: colors.muted }]}>
                      CROP ZOOM ({slotZoom.toFixed(1)}x)
                    </Text>
                    <View style={styles.rowGap}>
                      <TouchableOpacity
                        style={[styles.stepBtn, { borderColor: colors.border, backgroundColor: colors.paper }]}
                        onPress={() => patchSlot({ zoom: Math.max(1, slotZoom - 0.15) })}
                      >
                        <Text style={[styles.pillText, { color: colors.ink }]}>-</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.stepBtn, { borderColor: colors.border, backgroundColor: colors.paper }]}
                        onPress={() => patchSlot({ zoom: Math.min(2.6, slotZoom + 0.15) })}
                      >
                        <Text style={[styles.pillText, { color: colors.ink }]}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.rowBetween}>
                    <Text style={[styles.label, { color: colors.muted }]}>CROP INSIDE FRAME</Text>
                    <View style={styles.rowGap}>
                      <TouchableOpacity
                        style={[styles.stepBtn, { borderColor: colors.border, backgroundColor: colors.paper }]}
                        onPress={() => patchSlot({ panX: Math.max(-0.9, slotPanX - 0.15) })}
                      >
                        <Text style={[styles.pillText, { color: colors.ink }]}>←</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.stepBtn, { borderColor: colors.border, backgroundColor: colors.paper }]}
                        onPress={() => patchSlot({ panX: Math.min(0.9, slotPanX + 0.15) })}
                      >
                        <Text style={[styles.pillText, { color: colors.ink }]}>→</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.stepBtn, { borderColor: colors.border, backgroundColor: colors.paper }]}
                        onPress={() => patchSlot({ panY: Math.max(-0.9, slotPanY - 0.15) })}
                      >
                        <Text style={[styles.pillText, { color: colors.ink }]}>↑</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.stepBtn, { borderColor: colors.border, backgroundColor: colors.paper }]}
                        onPress={() => patchSlot({ panY: Math.min(0.9, slotPanY + 0.15) })}
                      >
                        <Text style={[styles.pillText, { color: colors.ink }]}>↓</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {slotEnabled && (
                    <TouchableOpacity
                      style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.vermilionSoft, alignSelf: 'flex-start' }]}
                      onPress={() => patchSlot({ enabled: false, dataUrl: '' })}
                    >
                      <Text style={[styles.pillText, { color: colors.vermilion }]}>
                        Remove Photo {photoSlot}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : null}

              <Text style={[styles.label, { color: colors.muted }]}>PHOTO CUTOUT SHAPE</Text>
              <View style={styles.wrapRow}>
                {CARD_PHOTO_SHAPES.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.pill,
                      { borderColor: colors.border, backgroundColor: colors.paper },
                      slotShape === s.id && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                    ]}
                    onPress={() => patchSlot({ shape: s.id, enabled: Boolean(slotDataUrl) })}
                  >
                    <Text style={[styles.pillText, { color: slotShape === s.id ? colors.vermilion : colors.ink }]}>
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'style' && (
            <View style={styles.secGap}>
              <Text style={[styles.label, { color: colors.muted }]}>ARTISAN PAPER TONE</Text>
              <View style={styles.wrapRow}>
                {CARD_PAPER_SWATCHES.map((sw) => (
                  <TouchableOpacity
                    key={sw.id}
                    style={[
                      styles.pill,
                      { borderColor: colors.border, backgroundColor: sw.paperColor },
                      card.paperColor === sw.paperColor && { borderWidth: 2, borderColor: colors.ink },
                    ]}
                    onPress={() =>
                      updateCard({
                        paperColor: sw.paperColor,
                        secondaryPaperColor: sw.secondaryPaperColor,
                        inkColor: sw.inkColor,
                      })
                    }
                  >
                    <Text style={[styles.pillText, { color: sw.inkColor }]}>{sw.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.muted }]}>ARCHITECTURAL FRAME</Text>
              <View style={styles.wrapRow}>
                {CARD_FRAME_STYLES.map((fr) => (
                  <TouchableOpacity
                    key={fr.id}
                    style={[
                      styles.pill,
                      { borderColor: colors.border, backgroundColor: colors.paper },
                      card.frameStyle === fr.id && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                    ]}
                    onPress={() => updateCard({ frameStyle: fr.id })}
                  >
                    <Text style={[styles.pillText, { color: card.frameStyle === fr.id ? colors.vermilion : colors.ink }]}>
                      {fr.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.pill,
                  { borderColor: colors.border, backgroundColor: colors.paper, alignSelf: 'flex-start' },
                  card.foilShimmer && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                ]}
                onPress={() => updateCard({ foilShimmer: !card.foilShimmer })}
              >
                <Text style={[styles.pillText, { color: card.foilShimmer ? colors.vermilion : colors.ink }]}>
                  Metallic Paper Sheen: {card.foilShimmer ? 'On' : 'Off'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'decor' && (
            <View style={styles.secGap}>
              <Text style={[styles.label, { color: colors.muted }]}>HANDCRAFTED ILLUSTRATION MOTIF</Text>
              <View style={styles.wrapRow}>
                {CARD_MOTIFS.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.pill,
                      { borderColor: colors.border, backgroundColor: colors.paper },
                      card.motif === m.id && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                    ]}
                    onPress={() => updateCard({ motif: m.id })}
                  >
                    <Text style={[styles.pillText, { color: card.motif === m.id ? colors.vermilion : colors.ink }]}>
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.wrapRow}>
                <TouchableOpacity
                  style={[
                    styles.pill,
                    { borderColor: colors.border, backgroundColor: colors.paper },
                    card.cornerRosettes && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                  ]}
                  onPress={() => updateCard({ cornerRosettes: !card.cornerRosettes })}
                >
                  <Text style={[styles.pillText, { color: card.cornerRosettes ? colors.vermilion : colors.ink }]}>
                    Corner Rosettes: {card.cornerRosettes ? 'On' : 'Off'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.pill,
                    { borderColor: colors.border, backgroundColor: colors.paper },
                    card.waxSealEnabled && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                  ]}
                  onPress={() => updateCard({ waxSealEnabled: !card.waxSealEnabled })}
                >
                  <Text style={[styles.pillText, { color: card.waxSealEnabled ? colors.vermilion : colors.ink }]}>
                    Wax Seal Stamp: {card.waxSealEnabled ? 'On' : 'Off'}
                  </Text>
                </TouchableOpacity>
              </View>

              {card.waxSealEnabled ? (
                <>
                  <Text style={[styles.label, { color: colors.muted }]}>STAMP MONOGRAM &amp; WAX COLOR</Text>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, backgroundColor: colors.paper, color: colors.ink }]}
                    maxLength={5}
                    value={card.monogram}
                    onChangeText={(txt) => updateCard({ monogram: txt }, true)}
                  />
                  <View style={styles.wrapRow}>
                    {WAX_SEAL_COLORS.map((sw) => (
                      <TouchableOpacity
                        key={sw.id}
                        onPress={() => updateCard({ waxColor: sw.hex })}
                        style={[
                          styles.dot,
                          { backgroundColor: sw.hex },
                          card.waxColor === sw.hex && { borderWidth: 3, borderColor: colors.ink },
                        ]}
                      />
                    ))}
                  </View>
                </>
              ) : null}
            </View>
          )}

          {activeTab === 'size' && (
            <View style={styles.secGap}>
              {CARD_FORMATS.map((fmt) => (
                <TouchableOpacity
                  key={fmt.id}
                  style={[
                    styles.sizeRow,
                    { borderColor: colors.border, backgroundColor: colors.paper },
                    card.aspectRatio === fmt.id && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                  ]}
                  onPress={() => updateCard({ aspectRatio: fmt.id })}
                >
                  <Text style={[styles.pillText, { color: colors.vermilion, width: 42 }]}>{fmt.id}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tplName, { color: colors.ink }]}>{fmt.name}</Text>
                    <Text style={[styles.headerSub, { color: colors.muted }]}>{fmt.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onUnlocked={() => {
          setPaywallVisible(false);
          void startDownloadOrShare(pendingMode.current);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 15.5 },
  headerSub: { fontFamily: FONTS.regular, fontSize: 11.5 },
  fmtBtn: {
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fmtText: { fontFamily: FONTS.bold, fontSize: 11.5 },
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
  stageBox: { height: '42%', position: 'relative', backgroundColor: '#1A171D' },
  webview: { flex: 1, backgroundColor: '#1A171D' },
  loaderOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  dock: {
    flex: 1,
    borderTopWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 14,
  },
  tabBarScroll: { flexGrow: 0, maxHeight: 46, marginBottom: 8 },
  tabBar: { gap: 8, alignItems: 'center', paddingVertical: 2 },
  tabPill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabText: { fontFamily: FONTS.semibold, fontSize: 12 },
  dockBody: { flex: 1, paddingBottom: 24 },
  secGap: { gap: 10, paddingBottom: 24 },
  hRow: { gap: 8 },
  pill: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  pillText: { fontFamily: FONTS.semibold, fontSize: 12 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotRow: { flexDirection: 'row', gap: 8 },
  slotBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  stepBtn: {
    minWidth: 34,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tplGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tplTile: {
    width: '48.6%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    gap: 6,
  },
  tplSwatch: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  tplVibe: { fontFamily: FONTS.bold, fontSize: 10.5 },
  tplName: { fontFamily: FONTS.semibold, fontSize: 12.5 },
  label: { fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 0.6, marginTop: 2 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 9,
    fontFamily: FONTS.medium,
    fontSize: 13,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
  },
  primaryBtnText: { fontFamily: FONTS.semibold, color: '#fff', fontSize: 13.5 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowGap: { flexDirection: 'row', gap: 6 },
  dot: { width: 30, height: 30, borderRadius: 15 },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
});
