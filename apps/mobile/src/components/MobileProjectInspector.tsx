import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ATMOSPHERE_PARTICLES,
  AspectRatio,
  AtmosphereConfig,
  CENTERPIECES,
  COLOR_PALETTES,
  CUTOUT_FILTERS,
  CUTOUT_PLACEMENTS,
  CUTOUT_SHAPES,
  CustomTextOverlay,
  DEFAULT_ATMOSPHERE,
  DEFAULT_PHOTO_CUTOUT,
  DEFAULT_PHOTO_CUTOUT_2,
  DEFAULT_WAX_SEAL,
  ENVELOPE_COLORS,
  FLOOR_PATTERNS,
  FONT_STYLES,
  FontStyleId,
  GARLANDS,
  GARDEN_STYLES,
  GardenConfig,
  LINER_PATTERNS,
  MUSIC_TRACKS,
  PhotoCutoutConfig,
  ProjectConfig,
  RoomConfig,
  SIDE_PROPS,
  STRUCTURES,
  SidePropId,
  StructureId,
  TIME_OF_DAY_OPTIONS,
  WALL_STYLES,
  WAX_COVER_STYLES,
  WAX_CRESTS,
  WAX_RIBBON_STYLES,
  WAX_SEAL_COLORS,
  WaxSealConfig,
  getDefaultGardenForProject,
  getPaletteById,
  getProjectTotalSeconds,
} from '@patra/shared';
import { useTheme } from '../context/ThemeContext';
import { FONTS, tapHaptic } from '../theme';

export type MobileInspectorTab =
  | 'wax'
  | 'atmosphere'
  | 'text'
  | 'photo'
  | 'colors'
  | 'props'
  | 'rooms'
  | 'garden'
  | 'music'
  | 'format';

const TAB_META: Record<MobileInspectorTab, { label: string }> = {
  wax: { label: 'Wax & Cover' },
  atmosphere: { label: 'Atmosphere' },
  text: { label: 'Text' },
  photo: { label: 'Photo' },
  colors: { label: 'Colors' },
  props: { label: 'Props' },
  rooms: { label: 'Rooms' },
  garden: { label: 'Garden' },
  music: { label: 'Music' },
  format: { label: 'Format' },
};

const BORDER_SWATCHES = ['#FFF8EE', '#F7E1E4', '#E6ECE2', '#DFC79A', '#262128'];

interface Props {
  project: ProjectConfig;
  setProject: React.Dispatch<React.SetStateAction<ProjectConfig>>;
  activeRoomIdx: number;
  setActiveRoomIdx: React.Dispatch<React.SetStateAction<number>>;
  tabs?: MobileInspectorTab[];
  activeTab: MobileInspectorTab;
  onTabChange: (tab: MobileInspectorTab) => void;
  onPickPhoto: (slot: 1 | 2) => void;
  onFocusPhoto?: (slot: 0 | 1 | 2) => void;
  onPlayWaxOpening?: () => void;
}

const DEFAULT_TABS: MobileInspectorTab[] = [
  'text',
  'photo',
  'colors',
  'props',
  'rooms',
  'garden',
  'music',
  'wax',
  'atmosphere',
  'format',
];

export function MobileProjectInspector({
  project,
  setProject,
  activeRoomIdx,
  setActiveRoomIdx,
  tabs = DEFAULT_TABS,
  activeTab,
  onTabChange,
  onPickPhoto,
  onFocusPhoto,
  onPlayWaxOpening,
}: Props) {
  const { colors } = useTheme();
  const [customTextDraft, setCustomTextDraft] = useState('');
  const [photoSlot, setPhotoSlot] = useState<1 | 2>(1);

  const activeRoom = project.rooms[activeRoomIdx] ?? project.rooms[0];
  const palette = getPaletteById(activeRoom.paletteId);
  const wax: WaxSealConfig = project.waxSeal ?? DEFAULT_WAX_SEAL;
  const garden: GardenConfig = getDefaultGardenForProject(project);
  const cutout1On = Boolean(activeRoom?.photoCutout?.enabled);
  const cutout2On = Boolean(activeRoom?.photoCutout2?.enabled);
  const cutout: PhotoCutoutConfig =
    photoSlot === 2
      ? (activeRoom?.photoCutout2 ?? DEFAULT_PHOTO_CUTOUT_2)
      : (activeRoom?.photoCutout ?? DEFAULT_PHOTO_CUTOUT);
  const atmo: AtmosphereConfig = activeRoom?.atmosphere ?? DEFAULT_ATMOSPHERE;

  const updateRoom = (patch: Partial<RoomConfig>) => {
    setProject((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r, i) => (i === activeRoomIdx ? { ...r, ...patch } : r)),
    }));
  };

  const updateSignage = (field: keyof RoomConfig['signage'], val: string) => {
    setProject((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r, i) =>
        i === activeRoomIdx ? { ...r, signage: { ...r.signage, [field]: val } } : r
      ),
    }));
  };

  const updateWax = (patch: Partial<WaxSealConfig>) => {
    setProject((prev) => ({
      ...prev,
      waxSeal: { ...(prev.waxSeal ?? DEFAULT_WAX_SEAL), ...patch },
    }));
  };

  const updateGarden = (patch: Partial<GardenConfig>) => {
    setProject((prev) => ({
      ...prev,
      garden: { ...getDefaultGardenForProject(prev), ...patch },
    }));
  };

  const updateCutout = (patch: Partial<PhotoCutoutConfig>) => {
    if (photoSlot === 2) {
      updateRoom({ photoCutout2: { ...cutout, ...patch } });
    } else {
      updateRoom({ photoCutout: { ...cutout, ...patch } });
    }
  };

  const updateAtmo = (patch: Partial<AtmosphereConfig>) => {
    updateRoom({ atmosphere: { ...atmo, ...patch } });
  };

  const addCustomText = () => {
    const txt = customTextDraft.trim();
    if (!txt) return;
    tapHaptic();
    const item: CustomTextOverlay = {
      id: `ct_${Date.now()}`,
      text: txt,
      x: 0,
      y: 0.56,
      scale: 1,
      color: palette.inkColor,
      fontStyle: activeRoom.fontStyle,
    };
    updateRoom({ customTexts: [...(activeRoom.customTexts ?? []), item] });
    setCustomTextDraft('');
  };

  const toggleSideProp = (propId: SidePropId) => {
    tapHaptic();
    const exists = activeRoom.sideProps.includes(propId);
    const next = exists
      ? activeRoom.sideProps.filter((p) => p !== propId)
      : [...activeRoom.sideProps, propId].slice(0, 4);
    updateRoom({ sideProps: next });
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}
      >
        {tabs.map((t) => {
          const active = activeTab === t;
          return (
            <TouchableOpacity
              key={t}
              style={[
                styles.tabBtn,
                { borderColor: colors.border, backgroundColor: colors.cream },
                active && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
              ]}
              onPress={() => {
                tapHaptic();
                onTabChange(t);
              }}
            >
              <Text style={[styles.tabText, { color: active ? colors.vermilion : colors.ink }]}>
                {TAB_META[t].label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.body}>
        {activeTab === 'wax' && (
          <View style={styles.sectionGap}>
            <View style={[styles.cardBox, { backgroundColor: colors.cream, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.secTitle, { color: colors.ink }]}>Wax-Seal Envelope Intro</Text>
                <Text style={[styles.secSub, { color: colors.muted }]}>
                  Unseals sealed envelope before unfolding stage
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.actionChip,
                  { backgroundColor: wax.enabled ? colors.vermilion : colors.paper, borderColor: colors.border },
                ]}
                onPress={() => {
                  tapHaptic();
                  updateWax({ enabled: !wax.enabled });
                }}
              >
                <Text style={[styles.actionChipText, { color: wax.enabled ? '#fff' : colors.ink }]}>
                  {wax.enabled ? 'Active' : 'Turn On'}
                </Text>
              </TouchableOpacity>
            </View>

            {onPlayWaxOpening ? (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.ink }]}
                onPress={() => {
                  tapHaptic();
                  if (!wax.enabled) updateWax({ enabled: true });
                  onPlayWaxOpening();
                }}
              >
                <Ionicons name="sparkles-outline" size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>Play 3D Unseal Animation</Text>
              </TouchableOpacity>
            ) : null}

            <Text style={[styles.label, { color: colors.muted }]}>COVER &amp; GARLAND CARD STYLE</Text>
            {WAX_COVER_STYLES.map((cs) => {
              const active = (wax.coverStyle ?? 'wax_envelope') === cs.id;
              return (
                <TouchableOpacity
                  key={cs.id}
                  style={[
                    styles.listRow,
                    { borderColor: colors.border, backgroundColor: colors.cream },
                    active && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                  ]}
                  onPress={() => {
                    tapHaptic();
                    updateWax({ enabled: true, coverStyle: cs.id });
                  }}
                >
                  <View style={[styles.dot, { width: 16, height: 16, backgroundColor: cs.accentHex }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.secTitle, { color: active ? colors.vermilion : colors.ink }]}>
                      {cs.name}
                    </Text>
                    <Text style={[styles.secSub, { color: colors.muted }]}>{cs.subtitle}</Text>
                  </View>
                  {active ? <Ionicons name="checkmark-circle" size={18} color={colors.vermilion} /> : null}
                </TouchableOpacity>
              );
            })}

            <View style={[styles.cardBox, { backgroundColor: colors.cream, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.secTitle, { color: colors.ink }]}>Cover Duration Timestamp</Text>
                <Text style={[styles.secSub, { color: colors.muted }]}>Seconds spent opening cover seal</Text>
              </View>
              <TouchableOpacity
                style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.paper }]}
                onPress={() =>
                  updateWax({
                    enabled: true,
                    durationSeconds: Math.max(2, (wax.durationSeconds ?? 4) - 1),
                  })
                }
              >
                <Text style={[styles.pillText, { color: colors.ink }]}>-</Text>
              </TouchableOpacity>
              <Text style={[styles.secTitle, { color: colors.vermilion, minWidth: 26, textAlign: 'center' }]}>
                {wax.durationSeconds ?? 4}s
              </Text>
              <TouchableOpacity
                style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.paper }]}
                onPress={() =>
                  updateWax({
                    enabled: true,
                    durationSeconds: Math.min(8, (wax.durationSeconds ?? 4) + 1),
                  })
                }
              >
                <Text style={[styles.pillText, { color: colors.ink }]}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.muted }]}>TOP SUBTITLE</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.cream, color: colors.ink }]}
                  maxLength={42}
                  value={wax.coverSubtitle ?? ''}
                  onChangeText={(txt) => updateWax({ enabled: true, coverSubtitle: txt })}
                  placeholder="together with their families"
                  placeholderTextColor={colors.muted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.muted }]}>DATE &amp; CITY</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.cream, color: colors.ink }]}
                  maxLength={42}
                  value={wax.coverDateVenue ?? ''}
                  onChangeText={(txt) => updateWax({ enabled: true, coverDateVenue: txt })}
                  placeholder="11 feb - 13 feb · jaipur"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: colors.muted }]}>WAX CREST EMBLEM</Text>
            <View style={styles.wrapRow}>
              {WAX_CRESTS.map((c) => {
                const active = wax.crest === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.pill,
                      { borderColor: colors.border, backgroundColor: colors.cream },
                      active && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                    ]}
                    onPress={() => {
                      tapHaptic();
                      updateWax({ enabled: true, crest: c.id });
                    }}
                  >
                    <Text style={[styles.pillText, { color: active ? colors.vermilion : colors.ink }]}>
                      {c.symbol} {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.muted }]}>MONOGRAM</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.cream, color: colors.ink }]}
                  maxLength={5}
                  value={wax.monogram}
                  onChangeText={(txt) => updateWax({ enabled: true, monogram: txt })}
                  placeholder="A&M"
                  placeholderTextColor={colors.muted}
                />
              </View>
              <View style={{ flex: 2 }}>
                <Text style={[styles.label, { color: colors.muted }]}>CARD HEADLINE</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.cream, color: colors.ink }]}
                  maxLength={32}
                  value={wax.headline}
                  onChangeText={(txt) => updateWax({ enabled: true, headline: txt })}
                  placeholder="You Are Warmly Invited"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: colors.muted }]}>WAX COLOR</Text>
            <View style={styles.swatchRow}>
              {WAX_SEAL_COLORS.map((sw) => (
                <TouchableOpacity
                  key={sw.id}
                  onPress={() => {
                    tapHaptic();
                    updateWax({ enabled: true, waxColor: sw.hex });
                  }}
                  style={[
                    styles.dot,
                    { backgroundColor: sw.hex },
                    wax.waxColor === sw.hex && { borderWidth: 3, borderColor: colors.ink },
                  ]}
                />
              ))}
            </View>

            <Text style={[styles.label, { color: colors.muted }]}>ENVELOPE PAPER</Text>
            <View style={styles.swatchRow}>
              {ENVELOPE_COLORS.map((sw) => (
                <TouchableOpacity
                  key={sw.id}
                  onPress={() => {
                    tapHaptic();
                    updateWax({ enabled: true, envelopeColor: sw.hex });
                  }}
                  style={[
                    styles.square,
                    { backgroundColor: sw.hex, borderColor: colors.border },
                    wax.envelopeColor === sw.hex && { borderWidth: 3, borderColor: colors.vermilion },
                  ]}
                />
              ))}
            </View>

            <Text style={[styles.label, { color: colors.muted }]}>FOIL LINER & RIBBON</Text>
            <View style={styles.wrapRow}>
              {LINER_PATTERNS.map((lp) => (
                <TouchableOpacity
                  key={lp.id}
                  style={[
                    styles.pill,
                    { borderColor: colors.border, backgroundColor: colors.cream },
                    wax.linerPattern === lp.id && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                  ]}
                  onPress={() => updateWax({ enabled: true, linerPattern: lp.id })}
                >
                  <Text style={[styles.pillText, { color: wax.linerPattern === lp.id ? colors.vermilion : colors.ink }]}>
                    {lp.name}
                  </Text>
                </TouchableOpacity>
              ))}
              {WAX_RIBBON_STYLES.map((rb) => (
                <TouchableOpacity
                  key={rb.id}
                  style={[
                    styles.pill,
                    { borderColor: colors.border, backgroundColor: colors.cream },
                    wax.ribbonStyle === rb.id && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                  ]}
                  onPress={() => updateWax({ enabled: true, ribbonStyle: rb.id })}
                >
                  <Text style={[styles.pillText, { color: wax.ribbonStyle === rb.id ? colors.vermilion : colors.ink }]}>
                    {rb.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'atmosphere' && (
          <View style={styles.sectionGap}>
            {project.rooms.length > 1 ? (
              <TouchableOpacity
                style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.cream, alignSelf: 'flex-start' }]}
                onPress={() => {
                  tapHaptic();
                  setProject((prev) => ({
                    ...prev,
                    rooms: prev.rooms.map((rm) => ({ ...rm, atmosphere: { ...atmo } })),
                  }));
                  Alert.alert('Synced', 'Applied lighting & particles to all rooms.');
                }}
              >
                <Text style={[styles.pillText, { color: colors.ink }]}>Sync Mood Across All Rooms</Text>
              </TouchableOpacity>
            ) : null}

            <Text style={[styles.label, { color: colors.muted }]}>TIME OF DAY LIGHTING</Text>
            {TIME_OF_DAY_OPTIONS.map((tod) => {
              const active = atmo.timeOfDay === tod.id;
              return (
                <TouchableOpacity
                  key={tod.id}
                  style={[
                    styles.listRow,
                    { borderColor: colors.border, backgroundColor: colors.cream },
                    active && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                  ]}
                  onPress={() => {
                    tapHaptic();
                    updateAtmo({ timeOfDay: tod.id });
                  }}
                >
                  <View style={[styles.dot, { width: 20, height: 20, backgroundColor: tod.skyBottom }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.secTitle, { color: active ? colors.vermilion : colors.ink }]}>{tod.name}</Text>
                    <Text style={[styles.secSub, { color: colors.muted }]}>{tod.subtitle}</Text>
                  </View>
                  {active ? <Ionicons name="checkmark-circle" size={18} color={colors.vermilion} /> : null}
                </TouchableOpacity>
              );
            })}

            <Text style={[styles.label, { color: colors.muted }]}>FLOATING 3D PARTICLES</Text>
            <View style={styles.wrapRow}>
              {ATMOSPHERE_PARTICLES.map((pt) => {
                const active = atmo.particles === pt.id;
                return (
                  <TouchableOpacity
                    key={pt.id}
                    style={[
                      styles.pill,
                      { borderColor: colors.border, backgroundColor: colors.cream, flexDirection: 'row', alignItems: 'center', gap: 6 },
                      active && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                    ]}
                    onPress={() => {
                      tapHaptic();
                      updateAtmo({ particles: pt.id });
                    }}
                  >
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: pt.color }} />
                    <Text style={[styles.pillText, { color: active ? colors.vermilion : colors.ink }]}>
                      {pt.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { color: colors.muted }]}>DENSITY & CAMERA MOTION</Text>
            <View style={styles.wrapRow}>
              {(['subtle', 'lush', 'festive'] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.pill,
                    { borderColor: colors.border, backgroundColor: colors.cream },
                    atmo.particleDensity === d && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                  ]}
                  onPress={() => updateAtmo({ particleDensity: d })}
                >
                  <Text style={[styles.pillText, { color: atmo.particleDensity === d ? colors.vermilion : colors.ink, textTransform: 'capitalize' }]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
              {(
                [
                  ['gentle_orbit', 'Gentle Orbit'],
                  ['cinematic_push', 'Cinematic Push'],
                  ['steady', 'Steady'],
                ] as const
              ).map(([id, label]) => (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.pill,
                    { borderColor: colors.border, backgroundColor: colors.cream },
                    atmo.cameraMotion === id && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                  ]}
                  onPress={() => updateAtmo({ cameraMotion: id })}
                >
                  <Text style={[styles.pillText, { color: atmo.cameraMotion === id ? colors.vermilion : colors.ink }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'photo' && (
          <View style={styles.sectionGap}>
            <View style={styles.wrapRow}>
              <TouchableOpacity
                style={[
                  styles.pill,
                  { borderColor: colors.border, backgroundColor: colors.cream },
                  photoSlot === 1 && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                ]}
                onPress={() => {
                  tapHaptic();
                  setPhotoSlot(1);
                }}
              >
                <Text style={[styles.pillText, { color: photoSlot === 1 ? colors.vermilion : colors.ink }]}>
                  Photo 1 {cutout1On ? '• On' : ''}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pill,
                  { borderColor: colors.border, backgroundColor: colors.cream },
                  photoSlot === 2 && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                ]}
                onPress={() => {
                  tapHaptic();
                  setPhotoSlot(2);
                }}
              >
                <Text style={[styles.pillText, { color: photoSlot === 2 ? colors.vermilion : colors.ink }]}>
                  Photo 2 {cutout2On ? '• On' : ''}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.twoCol}>
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1, backgroundColor: colors.vermilion }]}
                onPress={() => {
                  tapHaptic();
                  updateCutout({ enabled: true });
                  onPickPhoto(photoSlot);
                }}
              >
                <Ionicons name="image-outline" size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>Upload Photo {photoSlot}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionChip,
                  { backgroundColor: cutout.enabled ? colors.ink : colors.cream, borderColor: colors.border, paddingVertical: 11 },
                ]}
                onPress={() => {
                  tapHaptic();
                  updateCutout({ enabled: !cutout.enabled });
                }}
              >
                <Text style={[styles.actionChipText, { color: cutout.enabled ? '#fff' : colors.ink }]}>
                  {cutout.enabled ? 'Visible' : 'Enable'}
                </Text>
              </TouchableOpacity>
            </View>

            {onFocusPhoto ? (
              <View style={styles.wrapRow}>
                <TouchableOpacity
                  style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.cream }]}
                  onPress={() => {
                    tapHaptic();
                    if (!cutout.enabled) updateCutout({ enabled: true });
                    onFocusPhoto(photoSlot);
                  }}
                >
                  <Text style={[styles.pillText, { color: colors.vermilion }]}>
                    Zoom Camera to Photo {photoSlot}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.cream }]}
                  onPress={() => {
                    tapHaptic();
                    onFocusPhoto(0);
                  }}
                >
                  <Text style={[styles.pillText, { color: colors.ink }]}>Full Stage View</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <Text style={[styles.secSub, { color: colors.muted }]}>
              Tip: Drag Photo {photoSlot} directly inside the 3D stage to place it anywhere.
            </Text>

            <Text style={[styles.label, { color: colors.muted }]}>PHOTO CROP ZOOM, PAN & 3D SIZE</Text>
            <View style={styles.wrapRow}>
              <TouchableOpacity
                style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.cream }]}
                onPress={() => updateCutout({ enabled: true, cropZoom: Math.max(1, Number(((cutout.cropZoom ?? 1) - 0.15).toFixed(2))) })}
              >
                <Text style={[styles.pillText, { color: colors.ink }]}>Crop -</Text>
              </TouchableOpacity>
              <View style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.paper }]}>
                <Text style={[styles.pillText, { color: colors.vermilion }]}>{(cutout.cropZoom ?? 1).toFixed(1)}x</Text>
              </View>
              <TouchableOpacity
                style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.cream }]}
                onPress={() => updateCutout({ enabled: true, cropZoom: Math.min(3.0, Number(((cutout.cropZoom ?? 1) + 0.15).toFixed(2))) })}
              >
                <Text style={[styles.pillText, { color: colors.ink }]}>Crop +</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.cream }]}
                onPress={() => updateCutout({ enabled: true, scale: Math.max(0.65, Number((cutout.scale - 0.1).toFixed(2))) })}
              >
                <Text style={[styles.pillText, { color: colors.ink }]}>Size -</Text>
              </TouchableOpacity>
              <View style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.paper }]}>
                <Text style={[styles.pillText, { color: colors.ink }]}>{cutout.scale.toFixed(1)}x</Text>
              </View>
              <TouchableOpacity
                style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.cream }]}
                onPress={() => updateCutout({ enabled: true, scale: Math.min(1.85, Number((cutout.scale + 0.1).toFixed(2))) })}
              >
                <Text style={[styles.pillText, { color: colors.ink }]}>Size +</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.cream }]}
                onPress={() => updateCutout({ enabled: true, cropX: Math.max(-1, (cutout.cropX ?? 0) - 0.2) })}
              >
                <Text style={[styles.pillText, { color: colors.ink }]}>Pan L</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.cream }]}
                onPress={() => updateCutout({ enabled: true, cropX: Math.min(1, (cutout.cropX ?? 0) + 0.2) })}
              >
                <Text style={[styles.pillText, { color: colors.ink }]}>Pan R</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.cream }]}
                onPress={() => updateCutout({ enabled: true, cropZoom: 1, cropX: 0, cropY: 0 })}
              >
                <Text style={[styles.pillText, { color: colors.muted }]}>Reset Crop</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.muted }]}>DIE-CUT SHAPE</Text>
            <View style={styles.wrapRow}>
              {CUTOUT_SHAPES.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.pill,
                    { borderColor: colors.border, backgroundColor: colors.cream },
                    cutout.shape === s.id && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                  ]}
                  onPress={() => updateCutout({ enabled: true, shape: s.id })}
                >
                  <Text style={[styles.pillText, { color: cutout.shape === s.id ? colors.vermilion : colors.ink }]}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.muted }]}>3D DISPLAY MOUNT</Text>
            {CUTOUT_PLACEMENTS.map((pl) => (
              <TouchableOpacity
                key={pl.id}
                style={[
                  styles.listRow,
                  { borderColor: colors.border, backgroundColor: colors.cream },
                  cutout.placement === pl.id && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                ]}
                onPress={() => updateCutout({ enabled: true, placement: pl.id })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.secTitle, { color: cutout.placement === pl.id ? colors.vermilion : colors.ink }]}>{pl.name}</Text>
                  <Text style={[styles.secSub, { color: colors.muted }]}>{pl.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}

            <Text style={[styles.label, { color: colors.muted }]}>FILTER & CAPTION</Text>
            <View style={styles.wrapRow}>
              {CUTOUT_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[
                    styles.pill,
                    { borderColor: colors.border, backgroundColor: colors.cream },
                    cutout.filter === f.id && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                  ]}
                  onPress={() => updateCutout({ enabled: true, filter: f.id })}
                >
                  <Text style={[styles.pillText, { color: cutout.filter === f.id ? colors.vermilion : colors.ink }]}>
                    {f.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.cream, color: colors.ink }]}
              maxLength={26}
              value={cutout.caption}
              onChangeText={(txt) => updateCutout({ enabled: true, caption: txt })}
              placeholder="Together Forever"
              placeholderTextColor={colors.muted}
            />
            <View style={styles.swatchRow}>
              {BORDER_SWATCHES.map((hex) => (
                <TouchableOpacity
                  key={hex}
                  onPress={() => updateCutout({ enabled: true, paperBorderColor: hex })}
                  style={[
                    styles.square,
                    { backgroundColor: hex, borderColor: colors.border },
                    cutout.paperBorderColor === hex && { borderWidth: 3, borderColor: colors.vermilion },
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {activeTab === 'text' && (
          <View style={styles.sectionGap}>
            <Text style={[styles.label, { color: colors.muted }]}>FONT STYLE</Text>
            <View style={styles.wrapRow}>
              {FONT_STYLES.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[
                    styles.pill,
                    { borderColor: colors.border, backgroundColor: colors.cream },
                    (activeRoom.fontStyle ?? 'royal_serif') === f.id && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                  ]}
                  onPress={() => updateRoom({ fontStyle: f.id as FontStyleId })}
                >
                  <Text style={[styles.pillText, { color: (activeRoom.fontStyle ?? 'royal_serif') === f.id ? colors.vermilion : colors.ink }]}>
                    {f.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {(
              [
                ['eventTitle', 'MAIN HEADING'],
                ['hostLine', 'SUBTITLE / HOSTS'],
                ['dateText', 'DATE'],
                ['timeText', 'TIME'],
                ['venueText', 'VENUE ADDRESS'],
                ['noteText', 'CLOSING NOTE'],
              ] as const
            ).map(([field, lbl]) => (
              <View key={field}>
                <Text style={[styles.label, { color: colors.muted }]}>{lbl}</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.cream, color: colors.ink }]}
                  value={activeRoom.signage[field]}
                  onChangeText={(v) => updateSignage(field, v)}
                />
              </View>
            ))}

            <Text style={[styles.label, { color: colors.muted }]}>ADD WALL TEXT OVERLAY</Text>
            <View style={styles.twoCol}>
              <TextInput
                style={[styles.input, { flex: 1, borderColor: colors.border, backgroundColor: colors.cream, color: colors.ink }]}
                placeholder="Type text to drag on wall..."
                placeholderTextColor={colors.muted}
                value={customTextDraft}
                onChangeText={setCustomTextDraft}
              />
              <TouchableOpacity
                style={[styles.actionChip, { backgroundColor: colors.vermilion }]}
                onPress={addCustomText}
              >
                <Text style={[styles.actionChipText, { color: '#fff' }]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'colors' && (
          <View style={styles.sectionGap}>
            <Text style={[styles.label, { color: colors.muted }]}>COLOR PALETTES</Text>
            <View style={styles.wrapRow}>
              {COLOR_PALETTES.map((pal) => (
                <TouchableOpacity
                  key={pal.id}
                  style={[
                    styles.pill,
                    { borderColor: colors.border, backgroundColor: colors.cream, flexDirection: 'row', alignItems: 'center', gap: 6 },
                    activeRoom.paletteId === pal.id && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                  ]}
                  onPress={() => updateRoom({ paletteId: pal.id })}
                >
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: pal.accentPrimary }} />
                  <Text style={[styles.pillText, { color: activeRoom.paletteId === pal.id ? colors.vermilion : colors.ink }]}>
                    {pal.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.muted }]}>WALL STYLE</Text>
            <View style={styles.wrapRow}>
              {WALL_STYLES.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={[
                    styles.pill,
                    { borderColor: colors.border, backgroundColor: colors.cream },
                    activeRoom.wallStyle === w.id && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                  ]}
                  onPress={() => updateRoom({ wallStyle: w.id })}
                >
                  <Text style={[styles.pillText, { color: activeRoom.wallStyle === w.id ? colors.vermilion : colors.ink }]}>
                    {w.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.muted }]}>FLOOR PATTERN</Text>
            <View style={styles.wrapRow}>
              {FLOOR_PATTERNS.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[
                    styles.pill,
                    { borderColor: colors.border, backgroundColor: colors.cream },
                    activeRoom.floorPattern === f.id && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                  ]}
                  onPress={() => updateRoom({ floorPattern: f.id })}
                >
                  <Text style={[styles.pillText, { color: activeRoom.floorPattern === f.id ? colors.vermilion : colors.ink }]}>
                    {f.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'props' && (
          <View style={styles.sectionGap}>
            <Text style={[styles.label, { color: colors.muted }]}>3D CENTERPIECE</Text>
            <View style={styles.wrapRow}>
              {CENTERPIECES.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.pill,
                    { borderColor: colors.border, backgroundColor: colors.cream },
                    activeRoom.centerpiece === c.id && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                  ]}
                  onPress={() => updateRoom({ centerpiece: c.id })}
                >
                  <Text style={[styles.pillText, { color: activeRoom.centerpiece === c.id ? colors.vermilion : colors.ink }]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.muted }]}>GARLAND</Text>
            <View style={styles.wrapRow}>
              {GARLANDS.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[
                    styles.pill,
                    { borderColor: colors.border, backgroundColor: colors.cream },
                    activeRoom.garland === g.id && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                  ]}
                  onPress={() => updateRoom({ garland: g.id })}
                >
                  <Text style={[styles.pillText, { color: activeRoom.garland === g.id ? colors.vermilion : colors.ink }]}>
                    {g.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.muted }]}>SIDE PROPS (UP TO 4)</Text>
            <View style={styles.wrapRow}>
              {SIDE_PROPS.map((sp) => {
                const active = activeRoom.sideProps.includes(sp.id);
                return (
                  <TouchableOpacity
                    key={sp.id}
                    style={[
                      styles.pill,
                      { borderColor: colors.border, backgroundColor: colors.cream },
                      active && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                    ]}
                    onPress={() => toggleSideProp(sp.id)}
                  >
                    <Text style={[styles.pillText, { color: active ? colors.vermilion : colors.ink }]}>
                      {sp.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {activeTab === 'garden' && (
          <View style={styles.sectionGap}>
            <View style={[styles.cardBox, { backgroundColor: colors.cream, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.secTitle, { color: colors.ink }]}>Estate Garden &amp; Flower Walk</Text>
                <Text style={[styles.secSub, { color: colors.muted }]}>Entrance archway, walkway pots &amp; side planters</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.actionChip,
                  { borderColor: colors.vermilion },
                  garden.enabled && { backgroundColor: colors.vermilion },
                ]}
                onPress={() => {
                  tapHaptic();
                  updateGarden({ enabled: !garden.enabled });
                }}
              >
                <Text style={[styles.actionChipText, { color: garden.enabled ? '#fff' : colors.vermilion }]}>
                  {garden.enabled ? 'Visible' : 'Enable'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.muted }]}>LANDSCAPE THEME</Text>
            {GARDEN_STYLES.map((gs) => {
              const active = garden.style === gs.id;
              return (
                <TouchableOpacity
                  key={gs.id}
                  style={[
                    styles.listRow,
                    { borderColor: colors.border, backgroundColor: colors.cream },
                    active && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                  ]}
                  onPress={() => {
                    tapHaptic();
                    updateGarden({ enabled: true, style: gs.id });
                  }}
                >
                  <View style={[styles.dot, { width: 16, height: 16, backgroundColor: gs.accentHex }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.secTitle, { color: active ? colors.vermilion : colors.ink }]}>{gs.name}</Text>
                    <Text style={[styles.secSub, { color: colors.muted }]}>{gs.subtitle}</Text>
                  </View>
                  {active ? <Ionicons name="checkmark-circle" size={18} color={colors.vermilion} /> : null}
                </TouchableOpacity>
              );
            })}

            <View style={[styles.cardBox, { backgroundColor: colors.cream, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.secTitle, { color: colors.ink }]}>Entrance Archway Gate</Text>
                <Text style={[styles.secSub, { color: colors.muted }]}>Floral arch framing walkway approach</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.actionChip,
                  { borderColor: colors.vermilion },
                  garden.hasEntranceArch && { backgroundColor: colors.vermilion },
                ]}
                onPress={() => updateGarden({ enabled: true, hasEntranceArch: !garden.hasEntranceArch })}
              >
                <Text style={[styles.actionChipText, { color: garden.hasEntranceArch ? '#fff' : colors.vermilion }]}>
                  {garden.hasEntranceArch ? 'On' : 'Off'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.muted }]}>FLOWER POTS &amp; LANTERN DENSITY</Text>
            <View style={styles.wrapRow}>
              {(
                [
                  ['minimal', 'Clean Trim'],
                  ['balanced', 'Balanced'],
                  ['lush', 'Lush Estate'],
                ] as const
              ).map(([id, lbl]) => {
                const active = garden.potDensity === id;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[
                      styles.pill,
                      { borderColor: colors.border, backgroundColor: colors.cream },
                      active && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                    ]}
                    onPress={() => updateGarden({ enabled: true, potDensity: id })}
                  >
                    <Text style={[styles.pillText, { color: active ? colors.vermilion : colors.ink }]}>{lbl}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.cardBox, { backgroundColor: colors.cream, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.secTitle, { color: colors.ink }]}>Entrance Sweep Duration</Text>
                <Text style={[styles.secSub, { color: colors.muted }]}>0s skips entrance camera glide</Text>
              </View>
              <TouchableOpacity
                style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.paper }]}
                onPress={() =>
                  updateGarden({
                    enabled: true,
                    entranceDurationSeconds: Math.max(0, (garden.entranceDurationSeconds ?? 3) - 1),
                  })
                }
              >
                <Text style={[styles.pillText, { color: colors.ink }]}>-</Text>
              </TouchableOpacity>
              <Text style={[styles.secTitle, { color: colors.vermilion, minWidth: 26, textAlign: 'center' }]}>
                {garden.entranceDurationSeconds ?? 3}s
              </Text>
              <TouchableOpacity
                style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.paper }]}
                onPress={() =>
                  updateGarden({
                    enabled: true,
                    entranceDurationSeconds: Math.min(8, (garden.entranceDurationSeconds ?? 3) + 1),
                  })
                }
              >
                <Text style={[styles.pillText, { color: colors.ink }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'rooms' && (
          <View style={styles.sectionGap}>
            <View style={[styles.cardBox, { backgroundColor: colors.cream, borderColor: colors.border }]}>
              <Text style={[styles.secSub, { color: colors.ink, flex: 1, marginTop: 0 }]}>
                Timeline ({getProjectTotalSeconds(project)}s total): Garden{' '}
                {garden.enabled ? `${garden.entranceDurationSeconds ?? 3}s` : 'Off'} + Cover{' '}
                {wax.enabled ? `${wax.durationSeconds ?? 4}s` : 'Off'} + Rooms{' '}
                {project.rooms.reduce((s, r) => s + Math.max(4, Math.min(25, r.durationSeconds ?? 8)), 0)}s
              </Text>
            </View>
            <Text style={[styles.label, { color: colors.muted }]}>3D STRUCTURE STYLE</Text>
            <View style={styles.wrapRow}>
              {STRUCTURES.map((st) => (
                <TouchableOpacity
                  key={st.id}
                  style={[
                    styles.pill,
                    { borderColor: colors.border, backgroundColor: colors.cream },
                    (project.structure ?? 'carousel_gable') === st.id && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                  ]}
                  onPress={() => setProject((p) => ({ ...p, structure: st.id as StructureId }))}
                >
                  <Text style={[styles.pillText, { color: (project.structure ?? 'carousel_gable') === st.id ? colors.vermilion : colors.ink }]}>
                    {st.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.muted }]}>CORNERS & ROOMS ({project.rooms.length}/4)</Text>
            <View style={styles.wrapRow}>
              {([2, 3, 4] as const).map((cnt) => (
                <TouchableOpacity
                  key={cnt}
                  style={[
                    styles.pill,
                    { borderColor: colors.border, backgroundColor: colors.cream },
                    (project.cornersCount ?? 4) === cnt && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                  ]}
                  onPress={() => setProject((p) => ({ ...p, cornersCount: cnt, rooms: p.rooms.slice(0, cnt) }))}
                >
                  <Text style={[styles.pillText, { color: (project.cornersCount ?? 4) === cnt ? colors.vermilion : colors.ink }]}>
                    {cnt} {cnt === 2 ? 'Wings' : 'Corners'}
                  </Text>
                </TouchableOpacity>
              ))}
              {project.rooms.length < 4 ? (
                <TouchableOpacity
                  style={[styles.pill, { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft }]}
                  onPress={() =>
                    setProject((p) => ({
                      ...p,
                      rooms: [...p.rooms, { ...activeRoom, id: `rm_${Date.now()}`, label: `Room ${p.rooms.length + 1}` }],
                    }))
                  }
                >
                  <Text style={[styles.pillText, { color: colors.vermilion }]}>+ Add Room</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {project.rooms.map((r, idx) => (
              <View
                key={r.id}
                style={[
                  styles.cardBox,
                  {
                    backgroundColor: colors.cream,
                    borderColor: idx === activeRoomIdx ? colors.vermilion : colors.border,
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: 8,
                  },
                ]}
              >
                <View style={styles.twoCol}>
                  <TextInput
                    style={[styles.input, { flex: 1, backgroundColor: colors.paper, borderColor: colors.border, color: colors.ink }]}
                    value={r.label}
                    onFocus={() => setActiveRoomIdx(idx)}
                    onChangeText={(txt) =>
                      setProject((p) => ({
                        ...p,
                        rooms: p.rooms.map((rm, i) => (i === idx ? { ...rm, label: txt } : rm)),
                      }))
                    }
                  />
                  {project.rooms.length > 1 ? (
                    <TouchableOpacity
                      style={[styles.actionChip, { backgroundColor: colors.vermilionSoft }]}
                      onPress={() => {
                        setProject((p) => ({ ...p, rooms: p.rooms.filter((_, i) => i !== idx) }));
                        setActiveRoomIdx(0);
                      }}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.vermilion} />
                    </TouchableOpacity>
                  ) : null}
                </View>
                <View style={[styles.twoCol, { justifyContent: 'space-between' }]}>
                  <Text style={[styles.secSub, { color: colors.muted }]}>Room Duration</Text>
                  <View style={styles.twoCol}>
                    <TouchableOpacity
                      style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.paper }]}
                      onPress={() =>
                        setProject((p) => ({
                          ...p,
                          rooms: p.rooms.map((rm, i) =>
                            i === idx ? { ...rm, durationSeconds: Math.max(4, (rm.durationSeconds ?? 8) - 1) } : rm
                          ),
                        }))
                      }
                    >
                      <Text style={[styles.pillText, { color: colors.ink }]}>-</Text>
                    </TouchableOpacity>
                    <Text style={[styles.secTitle, { color: colors.vermilion, minWidth: 28, textAlign: 'center' }]}>
                      {r.durationSeconds ?? 8}s
                    </Text>
                    <TouchableOpacity
                      style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.paper }]}
                      onPress={() =>
                        setProject((p) => ({
                          ...p,
                          rooms: p.rooms.map((rm, i) =>
                            i === idx ? { ...rm, durationSeconds: Math.min(25, (rm.durationSeconds ?? 8) + 1) } : rm
                          ),
                        }))
                      }
                    >
                      <Text style={[styles.pillText, { color: colors.ink }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'music' && (
          <View style={styles.sectionGap}>
            {MUSIC_TRACKS.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.listRow,
                  { borderColor: colors.border, backgroundColor: colors.cream },
                  project.musicId === m.id && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                ]}
                onPress={() => setProject((p) => ({ ...p, musicId: m.id }))}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.secTitle, { color: project.musicId === m.id ? colors.vermilion : colors.ink }]}>{m.name}</Text>
                  <Text style={[styles.secSub, { color: colors.muted }]}>{m.mood}</Text>
                </View>
                {project.musicId === m.id ? <Ionicons name="checkmark-circle" size={18} color={colors.vermilion} /> : null}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'format' && (
          <View style={styles.sectionGap}>
            {(
              [
                ['9:16', 'Vertical Reels & WhatsApp Status'],
                ['1:1', 'Square Chat & Feed'],
                ['16:9', 'Widescreen YouTube & TV'],
              ] as [AspectRatio, string][]
            ).map(([ratio, desc]) => (
              <TouchableOpacity
                key={ratio}
                style={[
                  styles.listRow,
                  { borderColor: colors.border, backgroundColor: colors.cream },
                  project.aspectRatio === ratio && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                ]}
                onPress={() => setProject((p) => ({ ...p, aspectRatio: ratio }))}
              >
                <Text style={[styles.secTitle, { color: colors.vermilion, width: 42 }]}>{ratio}</Text>
                <Text style={[styles.secTitle, { color: colors.ink, flex: 1 }]}>{desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  tabBar: { gap: 10, paddingBottom: 10, marginBottom: 4 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1 },
  tabText: { fontFamily: FONTS.semibold, fontSize: 12.5 },
  body: { paddingBottom: 32 },
  sectionGap: { gap: 10 },
  cardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  secTitle: { fontFamily: FONTS.semibold, fontSize: 13.5 },
  secSub: { fontFamily: FONTS.regular, fontSize: 11.5, marginTop: 1 },
  actionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actionChipText: { fontFamily: FONTS.semibold, fontSize: 12 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
  },
  primaryBtnText: { fontFamily: FONTS.semibold, color: '#fff', fontSize: 13.5 },
  label: { fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 0.7, marginTop: 4 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  pillText: { fontFamily: FONTS.semibold, fontSize: 12 },
  twoCol: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 9,
    fontFamily: FONTS.medium,
    fontSize: 13,
  },
  swatchRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  dot: { width: 30, height: 30, borderRadius: 15 },
  square: { width: 30, height: 30, borderRadius: 8, borderWidth: 1 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
});
