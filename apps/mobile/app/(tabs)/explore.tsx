import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent, WebViewProps } from 'react-native-webview';
import {
  CARD_TEMPLATES,
  CATEGORIES,
  CategoryId,
  DEFAULT_WAX_SEAL,
  PREMIUM_TEMPLATES,
  ProjectConfig,
  TEMPLATES,
  TemplatePreset,
  TemplateRegionId,
  WaxCoverStyle,
  getDefaultGardenForProject,
  getProjectTotalSeconds,
  getStructureById,
} from '@patra/shared';
import { useTheme } from '../../src/context/ThemeContext';
import { STUDIO_URL } from '../../src/lib/api';
import { FONTS, SHADOWS, tapHaptic } from '../../src/theme';

const PATRA_LOGO = require('../../assets/patra-logo.png');

const PreviewWebView = WebView as unknown as React.ComponentType<
  WebViewProps & {
    ref?: React.Ref<{
      postMessage: (msg: string) => void;
      injectJavaScript: (script: string) => void;
    }>;
  }
>;

type HeroMode = 'tour' | 'garden' | 'seal' | 'stage';

const SAMPLE_CARD_IDS = [
  'card_jaipur_marigold_house',
  'card_milestone_birthday_studio',
  'card_cotswolds_rose_arch',
  'card_kyoto_sakura_branch',
  'card_manhattan_art_deco',
];

function buildHeroShowcaseProject(tpl: TemplatePreset): ProjectConfig {
  const cloned = JSON.parse(JSON.stringify(tpl.project)) as ProjectConfig;
  const garden = getDefaultGardenForProject(cloned);
  const firstSignage = cloned.rooms[0]?.signage;

  let fallbackCoverStyle: WaxCoverStyle = 'marigold_house';
  if (tpl.region === 'east_asian') fallbackCoverStyle = 'sakura_gate_card';
  else if (tpl.region === 'western') fallbackCoverStyle = 'rose_arch_card';

  const dateVenueFallback = firstSignage?.dateText
    ? `${firstSignage.dateText} · ${firstSignage.venueText || 'grand estate'}`
    : '11 feb - 13 feb · udaipur';

  return {
    ...cloned,
    garden: {
      ...garden,
      enabled: true,
      hasEntranceArch: true,
      entranceDurationSeconds: garden.entranceDurationSeconds ?? 3,
    },
    waxSeal: {
      ...DEFAULT_WAX_SEAL,
      ...(cloned.waxSeal ?? {}),
      enabled: true,
      coverStyle: cloned.waxSeal?.coverStyle ?? fallbackCoverStyle,
      coverSubtitle:
        cloned.waxSeal?.coverSubtitle ??
        (firstSignage?.hostLine?.trim() ? firstSignage.hostLine : 'together with their families'),
      coverDateVenue: cloned.waxSeal?.coverDateVenue ?? dateVenueFallback,
      durationSeconds: cloned.waxSeal?.durationSeconds ?? 4,
    },
  };
}

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView> | null>(null);
  const tourTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webRef = useRef<{
    postMessage: (msg: string) => void;
    injectJavaScript: (script: string) => void;
  } | null>(null);

  const defaultHero = useMemo(
    () =>
      PREMIUM_TEMPLATES.find((t) => t.id === 'prem_udaipur_haveli') ??
      PREMIUM_TEMPLATES[0] ??
      TEMPLATES[0],
    []
  );

  const [heroTemplate, setHeroTemplate] = useState<TemplatePreset>(defaultHero);
  const [heroMode, setHeroMode] = useState<HeroMode>('tour');
  const [tourPlaying, setTourPlaying] = useState(false);
  const [tourProgress, setTourProgress] = useState({ elapsed: 0, total: 0 });
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('birthday');
  const [selectedOccasionTplId, setSelectedOccasionTplId] = useState<string>('bday_pastel_cake');
  const [sampleCardId, setSampleCardId] = useState<string>(SAMPLE_CARD_IDS[0]);
  const [customCategory, setCustomCategory] = useState<CategoryId>('birthday');
  const [studioMenuOpen, setStudioMenuOpen] = useState(false);
  const [webReady, setWebReady] = useState(false);

  const showcaseProject = useMemo(
    () => buildHeroShowcaseProject(heroTemplate),
    [heroTemplate]
  );

  const totalSecs = useMemo(
    () => getProjectTotalSeconds(showcaseProject),
    [showcaseProject]
  );

  const featuredHighlights = useMemo(() => {
    const pickByRegion = (r: TemplateRegionId) =>
      PREMIUM_TEMPLATES.filter((t) => t.region === r).slice(0, 2);
    return [
      ...pickByRegion('indian'),
      ...pickByRegion('western'),
      ...pickByRegion('east_asian'),
    ];
  }, []);

  const categoryTemplates = useMemo(
    () => [
      ...TEMPLATES.filter((t) => t.category === selectedCategory),
      ...PREMIUM_TEMPLATES.filter((t) => t.category === selectedCategory),
    ],
    [selectedCategory]
  );

  const occasionTemplate = useMemo(
    () =>
      categoryTemplates.find((t) => t.id === selectedOccasionTplId) ??
      categoryTemplates[0] ??
      TEMPLATES[0],
    [categoryTemplates, selectedOccasionTplId]
  );

  useEffect(() => {
    if (
      categoryTemplates.length > 0 &&
      !categoryTemplates.some((t) => t.id === selectedOccasionTplId)
    ) {
      setSelectedOccasionTplId(categoryTemplates[0].id);
    }
  }, [categoryTemplates, selectedOccasionTplId]);

  const sampleCards = useMemo(() => {
    const picked = SAMPLE_CARD_IDS.map((id) => CARD_TEMPLATES.find((c) => c.id === id)).filter(
      (c): c is NonNullable<typeof c> => Boolean(c)
    );
    return picked.length > 0 ? picked : CARD_TEMPLATES.slice(0, 5);
  }, []);

  const activeSampleCard = useMemo(
    () => sampleCards.find((c) => c.id === sampleCardId) ?? sampleCards[0],
    [sampleCards, sampleCardId]
  );

  const customCategoryMeta = useMemo(
    () => CATEGORIES.find((c) => c.id === customCategory) ?? CATEGORIES[0],
    [customCategory]
  );

  const sendTo3D = useCallback(
    (type: string, payload?: unknown) => {
      if (!webReady || !webRef.current) return;
      const msg = JSON.stringify({ type, payload, activeRoomIdx: 0 });
      webRef.current.injectJavaScript(
        `if (window.__PATRA_MSG__) { window.__PATRA_MSG__(${JSON.stringify(msg)}); } true;`
      );
    },
    [webReady]
  );

  useEffect(() => {
    if (!webReady) return;
    if (tourTimerRef.current) {
      clearTimeout(tourTimerRef.current);
      tourTimerRef.current = null;
    }

    sendTo3D('SET_PROJECT', showcaseProject);
    setHeroMode('tour');
    setTourProgress({ elapsed: 0, total: totalSecs });

    tourTimerRef.current = setTimeout(() => {
      setTourPlaying(true);
      sendTo3D('START_PREVIEW');
    }, 220);

    return () => {
      if (tourTimerRef.current) {
        clearTimeout(tourTimerRef.current);
        tourTimerRef.current = null;
      }
    };
  }, [webReady, heroTemplate.id, showcaseProject, totalSecs, sendTo3D]);

  const handleWebMessage = (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        payload?: { elapsed?: number; total?: number };
      };
      if (msg.type === 'READY') {
        setWebReady(true);
      } else if (msg.type === 'PREVIEW_PROGRESS') {
        setTourPlaying(true);
        setTourProgress({
          elapsed: Math.round(msg.payload?.elapsed ?? 0),
          total: Math.round(msg.payload?.total ?? totalSecs),
        });
      } else if (msg.type === 'PREVIEW_DONE') {
        setTourPlaying(false);
        setHeroMode('stage');
      }
    } catch {
      // Ignore non-JSON messages
    }
  };

  const switchHeroAct = (mode: HeroMode) => {
    tapHaptic();
    if (tourTimerRef.current) {
      clearTimeout(tourTimerRef.current);
      tourTimerRef.current = null;
    }
    setHeroMode(mode);

    if (mode === 'tour') {
      setTourPlaying(true);
      setTourProgress({ elapsed: 0, total: totalSecs });
      sendTo3D('SET_VIEW_MODE', 'stage');
      sendTo3D('START_PREVIEW');
    } else if (mode === 'garden') {
      setTourPlaying(false);
      sendTo3D('STOP_PREVIEW');
      sendTo3D('SET_VIEW_MODE', 'garden_entrance');
    } else if (mode === 'seal') {
      setTourPlaying(false);
      sendTo3D('STOP_PREVIEW');
      sendTo3D('PLAY_WAX_OPENING');
    } else {
      setTourPlaying(false);
      sendTo3D('STOP_PREVIEW');
      sendTo3D('SET_VIEW_MODE', 'stage');
      sendTo3D('PLAY_UNFOLD');
    }
  };

  const selectTemplateForHero = (tpl: TemplatePreset) => {
    tapHaptic();
    setHeroTemplate(tpl);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const activeCategory = useMemo(
    () => CATEGORIES.find((c) => c.id === selectedCategory) ?? CATEGORIES[0],
    [selectedCategory]
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper, paddingTop: insets.top + 8 }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Image
            source={PATRA_LOGO}
            style={[styles.brandLogo, { borderColor: colors.border }]}
          />
          <View>
            <Text style={[styles.brandName, { color: colors.ink }]}>Patra</Text>
            <Text style={[styles.brandTag, { color: colors.muted }]}>3D Pop-Up Studio</Text>
          </View>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            style={[
              styles.themeBtn,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            ]}
            onPress={() => {
              tapHaptic();
              toggleTheme();
            }}
          >
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={16}
              color={colors.ink}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.studioMenuBtn,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            ]}
            onPress={() => {
              tapHaptic();
              setStudioMenuOpen((prev) => !prev);
            }}
          >
            <Ionicons name="sparkles-outline" size={14} color={colors.vermilion} />
            <Text style={[styles.studioMenuText, { color: colors.ink }]}>Studio</Text>
            <Ionicons
              name={studioMenuOpen ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.muted}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Studio Quick Tools Dropdown */}
      <Modal
        visible={studioMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setStudioMenuOpen(false)}
      >
        <Pressable style={styles.dropdownBackdrop} onPress={() => setStudioMenuOpen(false)}>
          <View
            style={[
              styles.dropdownCard,
              {
                top: insets.top + 56,
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.dropdownHeader, { color: colors.muted }]}>3D STUDIO TOOLS</Text>

            {[
              {
                route: '/studio/cards',
                icon: 'images-outline' as const,
                title: 'Invitation Cards',
                sub: '24 handcrafted 1-page cards',
              },
              {
                route: '/studio/premium-templates',
                icon: 'diamond-outline' as const,
                title: 'Signature Templates',
                sub: '30 global handcrafted 3D scenes',
              },
              {
                route: '/studio/wax-seal',
                icon: 'mail-open-outline' as const,
                title: 'Floral Seal & Envelope',
                sub: 'Garland gatefolds & wax clasps',
              },
              {
                route: '/studio/atmosphere',
                icon: 'sunny-outline' as const,
                title: '3D Atmosphere',
                sub: 'Twilight lighting & falling petals',
              },
            ].map((item, idx) => (
              <TouchableOpacity
                key={item.route}
                style={[
                  styles.dropdownRow,
                  idx < 3 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
                onPress={() => {
                  tapHaptic();
                  setStudioMenuOpen(false);
                  router.push(item.route as never);
                }}
              >
                <View style={[styles.dropdownIcon, { backgroundColor: colors.vermilionSoft }]}>
                  <Ionicons name={item.icon} size={16} color={colors.vermilion} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dropdownTitle, { color: colors.ink }]}>{item.title}</Text>
                  <Text style={[styles.dropdownSub, { color: colors.muted }]}>{item.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Auto-Running Live 3D Hero Showcase */}
        <LinearGradient
          colors={colors.glassGradient}
          style={[styles.heroCard, { borderColor: colors.borderStrong }]}
        >
          <View style={styles.viewportWrap}>
            <PreviewWebView
              ref={webRef}
              source={{ uri: `${STUDIO_URL}?embed=1` }}
              style={styles.webview}
              onMessage={handleWebMessage}
              originWhitelist={['*']}
              bounces={false}
            />

            {/* Floating Status Pill */}
            <View style={styles.floatingTopRow} pointerEvents="box-none">
              <View style={styles.statusPill}>
                <View
                  style={[
                    styles.pulseDot,
                    { backgroundColor: tourPlaying ? '#4ADE80' : '#FBBF24' },
                  ]}
                />
                <Text style={styles.statusText}>
                  {tourPlaying
                    ? `Full Tour · ${tourProgress.elapsed}s/${tourProgress.total || totalSecs}s`
                    : 'Live 3D · Drag to Spin'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.playToggleBtn}
                onPress={() => switchHeroAct(tourPlaying ? 'stage' : 'tour')}
              >
                <Ionicons
                  name={tourPlaying ? 'stop' : 'play'}
                  size={15}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* 4-Step Interactive Act Switcher */}
          <View
            style={[
              styles.actBar,
              { backgroundColor: colors.paperWarm, borderColor: colors.border },
            ]}
          >
            {(
              [
                { id: 'tour' as HeroMode, label: 'Full Tour', icon: 'play-circle-outline' as const },
                { id: 'garden' as HeroMode, label: 'Garden', icon: 'leaf-outline' as const },
                { id: 'seal' as HeroMode, label: 'Floral Seal', icon: 'flower-outline' as const },
                { id: 'stage' as HeroMode, label: 'Inside 3D', icon: 'cube-outline' as const },
              ]
            ).map((act) => {
              const active = heroMode === act.id;
              return (
                <TouchableOpacity
                  key={act.id}
                  style={[
                    styles.actChip,
                    active && { backgroundColor: colors.ink },
                  ]}
                  onPress={() => switchHeroAct(act.id)}
                >
                  <Ionicons
                    name={act.icon}
                    size={13}
                    color={active ? colors.paper : colors.inkSoft}
                  />
                  <Text
                    style={[
                      styles.actText,
                      { color: active ? colors.paper : colors.inkSoft },
                    ]}
                  >
                    {act.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Hero Metadata + Primary CTA */}
          <View style={styles.heroMeta}>
            <View style={styles.heroBadgeRow}>
              <View style={[styles.vibeBadge, { backgroundColor: colors.marigoldSoft }]}>
                <Text style={[styles.vibeBadgeText, { color: colors.marigold }]}>
                  {heroTemplate.vibeTag}
                </Text>
              </View>
              <Text style={[styles.specLine, { color: colors.muted }]}>
                Garden · Floral Seal · {heroTemplate.project.rooms.length}{' '}
                {heroTemplate.project.rooms.length === 1 ? 'Room' : 'Rooms'} · {totalSecs}s
              </Text>
            </View>

            <Text style={[styles.heroTitle, { color: colors.ink }]}>{heroTemplate.name}</Text>
            <Text style={[styles.heroSubtitle, { color: colors.inkSoft }]} numberOfLines={2}>
              {heroTemplate.subtitle}
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                tapHaptic();
                router.push(`/editor/tpl:${heroTemplate.id}`);
              }}
            >
              <LinearGradient
                colors={colors.ctaGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCta}
              >
                <Text style={styles.heroCtaText}>Customize in 3D Studio</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Quick-Switch Featured Signature Strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickStrip}
          >
            {featuredHighlights.map((item) => {
              const active = item.id === heroTemplate.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.quickPill,
                    { backgroundColor: colors.paper, borderColor: colors.border },
                    active && { backgroundColor: colors.vermilion, borderColor: colors.vermilion },
                  ]}
                  onPress={() => selectTemplateForHero(item)}
                >
                  <Text
                    style={[
                      styles.quickPillText,
                      { color: active ? '#FFFFFF' : colors.ink },
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </LinearGradient>

        {/* 1. Occasions Categories + Birthday Bash & Opening Seal 3D Example */}
        <View style={styles.railHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.layersTitle, { color: colors.ink }]}>
              Explore by Occasion · 3D &amp; Seal
            </Text>
            <Text style={[styles.layersSub, { color: colors.muted }]}>
              Preview live Birthday Bash &amp; occasion 3D reveals with opening seals
            </Text>
          </View>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => {
              tapHaptic();
              router.push('/studio/premium-templates' as never);
            }}
          >
            <Text style={[styles.viewAllText, { color: colors.vermilion }]}>Global 30</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.vermilion} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {CATEGORIES.map((cat) => {
            const active = cat.id === selectedCategory;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterPill,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                  active && { backgroundColor: colors.vermilion, borderColor: colors.vermilion },
                ]}
                onPress={() => {
                  tapHaptic();
                  setSelectedCategory(cat.id);
                }}
              >
                <View
                  style={[
                    styles.catDot,
                    { backgroundColor: active ? '#FFFFFF' : cat.accent },
                  ]}
                />
                <Text
                  style={[
                    styles.filterText,
                    { color: active ? '#FFFFFF' : colors.ink },
                  ]}
                >
                  {cat.shortName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Interactive Occasion 3D + Seal Featured Example Card */}
        <LinearGradient
          colors={occasionTemplate.previewGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.occasionShowcaseCard}
        >
          <View style={styles.railCardTop}>
            <View style={styles.railPill}>
              <Text style={styles.railPillText}>
                {activeCategory.name} · Opening Seal + 3D Stage
              </Text>
            </View>
            <View style={styles.railPill}>
              <Text style={styles.railPillText}>
                {occasionTemplate.project.rooms.length}R · {getProjectTotalSeconds(occasionTemplate.project)}s
              </Text>
            </View>
          </View>

          <View style={{ marginVertical: 10, gap: 4 }}>
            <Text style={styles.occasionShowcaseTitle}>{occasionTemplate.name}</Text>
            <Text style={styles.occasionShowcaseSub}>{occasionTemplate.subtitle}</Text>
            <Text style={styles.occasionShowcaseMeta}>
              Structure: {getStructureById(occasionTemplate.project.structure).name} · Includes Garden &amp; Wax Seal Reveal
            </Text>
          </View>

          {categoryTemplates.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, marginBottom: 12 }}
            >
              {categoryTemplates.map((tpl) => {
                const picked = tpl.id === occasionTemplate.id;
                return (
                  <TouchableOpacity
                    key={tpl.id}
                    style={[
                      styles.occasionTplChip,
                      picked && { backgroundColor: '#FFFFFF' },
                    ]}
                    onPress={() => {
                      tapHaptic();
                      setSelectedOccasionTplId(tpl.id);
                    }}
                  >
                    <Text
                      style={[
                        styles.occasionTplChipText,
                        { color: picked ? '#18221B' : '#FFFFFF' },
                      ]}
                    >
                      {tpl.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <TouchableOpacity
              style={styles.occasionPrimaryAction}
              onPress={() => {
                tapHaptic();
                setHeroTemplate(occasionTemplate);
                setTimeout(() => {
                  switchHeroAct('seal');
                }, 260);
                scrollRef.current?.scrollTo({ y: 0, animated: true });
              }}
            >
              <Ionicons name="flower-outline" size={14} color="#FFFFFF" />
              <Text style={styles.occasionActionText}>Preview Seal &amp; 3D Above</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.occasionEditAction}
              onPress={() => {
                tapHaptic();
                router.push(`/editor/tpl:${occasionTemplate.id}`);
              }}
            >
              <Text style={styles.occasionEditText}>Customize</Text>
              <Ionicons name="arrow-forward" size={13} color="#18221B" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Craft Every Layer in 3D Highlights */}
        <View style={styles.layersHeader}>
          <Text style={[styles.layersTitle, { color: colors.ink }]}>Craft Every Layer in 3D</Text>
          <Text style={[styles.layersSub, { color: colors.muted }]}>
            Tap any studio layer to preview or customize
          </Text>
        </View>

        <View style={styles.layerGrid}>
          {[
            {
              title: 'Estate Gardens',
              sub: '5 landscapes, entrance arch & timestamps',
              icon: 'leaf-outline' as const,
              tint: colors.emerald,
              bg: colors.emeraldSoft,
              onPress: () => {
                switchHeroAct('garden');
                scrollRef.current?.scrollTo({ y: 0, animated: true });
              },
            },
            {
              title: 'Floral Gatefold Seals',
              sub: 'Marigold house, rose arch & wax clasps',
              icon: 'flower-outline' as const,
              tint: colors.marigold,
              bg: colors.marigoldSoft,
              onPress: () => {
                tapHaptic();
                router.push('/studio/wax-seal' as never);
              },
            },
            {
              title: 'Day/Night Atmosphere',
              sub: 'Candlelit twilight, midnight & petals',
              icon: 'sparkles-outline' as const,
              tint: colors.vermilion,
              bg: colors.vermilionSoft,
              onPress: () => {
                tapHaptic();
                router.push('/studio/atmosphere' as never);
              },
            },
            {
              title: '30 Global Scenes',
              sub: 'Indian, Western & East Asian 3D stages',
              icon: 'globe-outline' as const,
              tint: colors.ink,
              bg: colors.paperWarm,
              onPress: () => {
                tapHaptic();
                router.push('/studio/premium-templates' as never);
              },
            },
          ].map((tile) => (
            <TouchableOpacity
              key={tile.title}
              activeOpacity={0.88}
              style={[
                styles.layerTile,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ]}
              onPress={tile.onPress}
            >
              <View style={[styles.layerIconWrap, { backgroundColor: tile.bg }]}>
                <Ionicons name={tile.icon} size={20} color={tile.tint} />
              </View>
              <Text style={[styles.layerTileTitle, { color: colors.ink }]}>{tile.title}</Text>
              <Text style={[styles.layerTileSub, { color: colors.muted }]}>{tile.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 2. 1-Page Invitation Cards Live Sample Showcase */}
        {activeSampleCard && (
          <View
            style={[
              styles.cardSampleWrap,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.borderStrong },
            ]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.smallIconBadge, { backgroundColor: colors.marigoldSoft }]}>
                  <Ionicons name="images-outline" size={17} color={colors.marigold} />
                </View>
                <View>
                  <Text style={[styles.cardSampleTitle, { color: colors.ink }]}>
                    1-Page Invitation Cards (24 Styles)
                  </Text>
                  <Text style={[styles.cardSampleSub, { color: colors.muted }]}>
                    HD PNG/JPG · Printable &amp; WhatsApp Ready
                  </Text>
                </View>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, marginBottom: 12 }}
            >
              {sampleCards.map((c) => {
                const picked = c.id === activeSampleCard.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.filterPill,
                      { backgroundColor: colors.paper, borderColor: colors.border },
                      picked && { backgroundColor: colors.ink, borderColor: colors.ink },
                    ]}
                    onPress={() => {
                      tapHaptic();
                      setSampleCardId(c.id);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        { color: picked ? colors.paper : colors.ink },
                      ]}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Realistic Cardstock Mini-Preview */}
            <View
              style={[
                styles.miniCardSheet,
                {
                  backgroundColor: activeSampleCard.config.paperColor,
                  borderColor: activeSampleCard.config.accentColor,
                },
              ]}
            >
              <View
                style={[
                  styles.miniCardInnerFrame,
                  { borderColor: activeSampleCard.config.accentColor },
                ]}
              >
                <Text
                  style={[
                    styles.miniCardBlessing,
                    { color: activeSampleCard.config.accentColor },
                  ]}
                  numberOfLines={1}
                >
                  {activeSampleCard.config.topBlessing}
                </Text>
                <View
                  style={[
                    styles.miniCardSealDot,
                    { backgroundColor: activeSampleCard.config.waxColor },
                  ]}
                >
                  <Text style={styles.miniCardSealText}>
                    {activeSampleCard.config.monogram}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.miniCardHeadline,
                    { color: activeSampleCard.config.inkColor },
                  ]}
                  numberOfLines={2}
                >
                  {activeSampleCard.config.coupleOrHeadline}
                </Text>
                <Text
                  style={[
                    styles.miniCardDate,
                    { color: activeSampleCard.config.inkColor },
                  ]}
                  numberOfLines={1}
                >
                  {activeSampleCard.config.dateText} · {activeSampleCard.config.timeText}
                </Text>
                <Text
                  style={[
                    styles.miniCardVenue,
                    { color: activeSampleCard.config.accentColor },
                  ]}
                  numberOfLines={1}
                >
                  {activeSampleCard.config.venueText}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.cardStudioCta, { backgroundColor: colors.ink }]}
              onPress={() => {
                tapHaptic();
                router.push('/studio/cards' as never);
              }}
            >
              <Text style={[styles.cardStudioCtaText, { color: colors.paper }]}>
                Open 1-Page Cards Studio (24 Styles)
              </Text>
              <Ionicons name="arrow-forward" size={16} color={colors.paper} />
            </TouchableOpacity>
          </View>
        )}

        {/* 3. Custom 3D Invitation Builder (Defaults to Birthday + Category Options) */}
        <LinearGradient
          colors={colors.ctaGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.customBuilderCard}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View style={styles.customBannerIcon}>
              <Ionicons name="cube-outline" size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customBannerTitle}>Build Your Own 3D World</Text>
              <Text style={styles.customBannerSub}>
                Choose celebration type · Birthday Cake, Gardens, Floral Seals &amp; Music
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, marginBottom: 14 }}
          >
            {CATEGORIES.map((cat) => {
              const active = cat.id === customCategory;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.customCatPill,
                    active && { backgroundColor: '#FFFFFF' },
                  ]}
                  onPress={() => {
                    tapHaptic();
                    setCustomCategory(cat.id);
                  }}
                >
                  <Text
                    style={[
                      styles.customCatText,
                      { color: active ? '#18221B' : '#FFFFFF' },
                    ]}
                  >
                    {cat.shortName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            activeOpacity={0.92}
            style={styles.customLaunchBtn}
            onPress={() => {
              tapHaptic();
              router.push(`/editor/custom:${customCategory}`);
            }}
          >
            <Text style={styles.customLaunchText}>
              Create Custom {customCategoryMeta.shortName} 3D Invite
            </Text>
            <Ionicons name="arrow-forward-circle" size={20} color="#18221B" />
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandLogo: { width: 36, height: 36, borderRadius: 10, borderWidth: 1 },
  brandName: { fontFamily: FONTS.bold, fontSize: 19, letterSpacing: -0.3, lineHeight: 22 },
  brandTag: { fontFamily: FONTS.medium, fontSize: 11 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  themeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studioMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 11,
    height: 34,
    borderRadius: 999,
  },
  studioMenuText: { fontFamily: FONTS.semibold, fontSize: 12 },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 16, 14, 0.22)',
  },
  dropdownCard: {
    position: 'absolute',
    right: 16,
    width: 268,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    ...SHADOWS.paperCard,
  },
  dropdownHeader: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  dropdownIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownTitle: { fontFamily: FONTS.semibold, fontSize: 13.5 },
  dropdownSub: { fontFamily: FONTS.regular, fontSize: 11.5, marginTop: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 34 },

  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 10,
    marginBottom: 22,
    ...SHADOWS.paperCard,
  },
  viewportWrap: {
    height: 330,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1A171D',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  webview: { flex: 1, backgroundColor: 'transparent' },
  floatingTopRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 20, 18, 0.72)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  pulseDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontFamily: FONTS.semibold, fontSize: 11.5, color: '#FFFFFF' },
  playToggleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(16, 20, 18, 0.76)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  actBar: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  actChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actText: { fontFamily: FONTS.semibold, fontSize: 11 },

  heroMeta: { paddingHorizontal: 4, paddingTop: 12, gap: 6 },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  vibeBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  vibeBadgeText: { fontFamily: FONTS.bold, fontSize: 10.5 },
  specLine: { fontFamily: FONTS.medium, fontSize: 11 },
  heroTitle: { fontFamily: FONTS.bold, fontSize: 20, letterSpacing: -0.3, marginTop: 2 },
  heroSubtitle: { fontFamily: FONTS.regular, fontSize: 13, lineHeight: 18 },
  heroCta: {
    marginTop: 6,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroCtaText: { fontFamily: FONTS.bold, fontSize: 14, color: '#FFFFFF' },
  quickStrip: { gap: 8, paddingTop: 12, paddingHorizontal: 2, paddingBottom: 2 },
  quickPill: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  quickPillText: { fontFamily: FONTS.semibold, fontSize: 11.5 },

  railHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  segmentedWrap: {
    flex: 1,
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  segmentedBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentedText: { fontFamily: FONTS.semibold, fontSize: 11.5 },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  viewAllText: { fontFamily: FONTS.bold, fontSize: 12.5 },

  filterScroll: { gap: 8, paddingBottom: 12 },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
  },
  catDot: { width: 7, height: 7, borderRadius: 3.5 },
  filterText: { fontFamily: FONTS.semibold, fontSize: 12 },

  railScroll: { gap: 12, paddingBottom: 24 },
  railCard: {
    width: 224,
    height: 184,
    borderRadius: 18,
    padding: 14,
    justifyContent: 'space-between',
  },
  railCardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  railPill: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  railPillText: { fontFamily: FONTS.semibold, fontSize: 10, color: '#FFFFFF' },
  railBody: { gap: 4 },
  railTitle: { fontFamily: FONTS.bold, fontSize: 16, color: '#FFFFFF', lineHeight: 20 },
  railSub: { fontFamily: FONTS.regular, fontSize: 11.5, color: 'rgba(255,255,255,0.86)', lineHeight: 15 },
  railBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  liveTapLabel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveTapText: { fontFamily: FONTS.semibold, fontSize: 11.5, color: '#FFFFFF' },
  railEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  railEditText: { fontFamily: FONTS.bold, fontSize: 11, color: '#18221B' },

  layersHeader: { marginBottom: 12 },
  layersTitle: { fontFamily: FONTS.bold, fontSize: 18, letterSpacing: -0.3 },
  layersSub: { fontFamily: FONTS.regular, fontSize: 12.5, marginTop: 2 },
  layerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  layerTile: {
    width: '48.4%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  layerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  layerTileTitle: { fontFamily: FONTS.bold, fontSize: 13.5 },
  layerTileSub: { fontFamily: FONTS.regular, fontSize: 11.5, lineHeight: 16 },

  customBanner: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customBannerTitle: { fontFamily: FONTS.bold, fontSize: 15.5, color: '#FFFFFF' },
  customBannerSub: { fontFamily: FONTS.regular, fontSize: 12, color: 'rgba(255,255,255,0.88)', marginTop: 2 },
  occasionShowcaseCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  occasionShowcaseTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  occasionShowcaseSub: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 17,
  },
  occasionShowcaseMeta: {
    fontFamily: FONTS.semibold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.82)',
    marginTop: 2,
  },
  occasionTplChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  occasionTplChipText: {
    fontFamily: FONTS.semibold,
    fontSize: 11,
  },
  occasionPrimaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.42)',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
  },
  occasionActionText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  occasionEditAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  occasionEditText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: '#18221B',
  },
  cardSampleWrap: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  smallIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSampleTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
  cardSampleSub: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
  },
  miniCardSheet: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 10,
    marginBottom: 12,
  },
  miniCardInnerFrame: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 6,
  },
  miniCardBlessing: {
    fontFamily: FONTS.semibold,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  miniCardSealDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  miniCardSealText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: '#FCE7B2',
  },
  miniCardHeadline: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    textAlign: 'center',
  },
  miniCardDate: {
    fontFamily: FONTS.semibold,
    fontSize: 12,
    textAlign: 'center',
  },
  miniCardVenue: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    textAlign: 'center',
  },
  cardStudioCta: {
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cardStudioCtaText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
  },
  customBuilderCard: {
    borderRadius: 20,
    padding: 16,
  },
  customCatPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },
  customCatText: {
    fontFamily: FONTS.semibold,
    fontSize: 11.5,
  },
  customLaunchBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customLaunchText: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
    color: '#18221B',
  },
});
