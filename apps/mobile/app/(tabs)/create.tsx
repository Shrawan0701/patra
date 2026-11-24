import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CATEGORIES,
  COLOR_PALETTES,
  CategoryId,
  ProjectConfig,
  TEMPLATES,
} from '@patra/shared';
import { TemplateShowcaseCard } from '../../src/components/TemplateShowcaseCard';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/lib/api';
import { FONTS, SHADOWS, tapHaptic } from '../../src/theme';

const FEATURED_PALETTE_IDS = [
  'sage_matcha',
  'royal_vermilion',
  'marigold_haldi',
  'obsidian_emerald',
  'royal_burgundy',
  'champagne_noir',
];

export default function CreateStudioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [selectedCat, setSelectedCat] = useState<CategoryId>('wedding');
  const [roomCount, setRoomCount] = useState(1);
  const [starterPalette, setStarterPalette] = useState('sage_matcha');
  const [browseCat, setBrowseCat] = useState<CategoryId>('wedding');
  const [drafts, setDrafts] = useState<(ProjectConfig & { updatedAt: string })[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);

  const starterPalettes = useMemo(
    () => COLOR_PALETTES.filter((p) => FEATURED_PALETTE_IDS.includes(p.id)),
    []
  );

  const browseTemplates = useMemo(
    () => TEMPLATES.filter((t) => t.category === browseCat),
    [browseCat]
  );

  const loadDrafts = useCallback(async () => {
    setLoadingDrafts(true);
    try {
      const res = await api.listProjects();
      setDrafts(res.projects);
    } catch {
      // Ignore offline
    } finally {
      setLoadingDrafts(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDrafts();
    }, [loadDrafts])
  );

  const handleDelete = (id: string) => {
    Alert.alert('Delete Draft', 'Remove this saved 3D invitation draft?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await api.deleteProject(id);
          void loadDrafts();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.paper }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 14 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.eyebrow, { color: colors.vermilion }]}>CUSTOM ROOM STUDIO</Text>
      <Text style={[styles.heading, { color: colors.ink }]}>Build Your Own 3D Pop-Up</Text>
      <Text style={[styles.sub, { color: colors.muted }]}>
        pick an occasion, room count & starting theme
      </Text>

      {/* Glassy Custom Room Builder Card */}
      <LinearGradient
        colors={colors.glassGradient}
        style={[styles.builderCard, { borderColor: colors.borderStrong }]}
      >
        <Text style={[styles.label, { color: colors.inkSoft }]}>1. Choose Occasion</Text>
        <View style={styles.catGrid}>
          {CATEGORIES.map((cat) => {
            const active = selectedCat === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catChip,
                  { backgroundColor: colors.paper, borderColor: colors.border },
                  active && { backgroundColor: colors.vermilion, borderColor: colors.vermilion },
                ]}
                onPress={() => {
                  tapHaptic();
                  setSelectedCat(cat.id);
                }}
              >
                <View
                  style={[
                    styles.catDot,
                    { backgroundColor: active ? '#fff' : cat.accent },
                  ]}
                />
                <Text
                  style={[
                    styles.catChipText,
                    { color: active ? '#fff' : colors.ink },
                  ]}
                >
                  {cat.shortName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.inkSoft, marginTop: 18 }]}>
          2. Folding Rooms (1 to 4)
        </Text>
        <View style={styles.roomRow}>
          {[1, 2, 3, 4].map((num) => {
            const active = roomCount === num;
            return (
              <TouchableOpacity
                key={num}
                style={[
                  styles.roomBtn,
                  { backgroundColor: colors.paper, borderColor: colors.border },
                  active && { backgroundColor: colors.vermilion, borderColor: colors.vermilion },
                ]}
                onPress={() => {
                  tapHaptic();
                  setRoomCount(num);
                }}
              >
                <Text style={[styles.roomNum, { color: active ? '#fff' : colors.ink }]}>
                  {num}
                </Text>
                <Text style={[styles.roomWord, { color: active ? '#fff' : colors.muted }]}>
                  {num === 1 ? 'Room' : 'Rooms'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.inkSoft, marginTop: 18 }]}>
          3. Starting Color Mood
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {starterPalettes.map((pal) => {
            const active = starterPalette === pal.id;
            return (
              <TouchableOpacity
                key={pal.id}
                style={[
                  styles.palChip,
                  { backgroundColor: colors.paper, borderColor: colors.border },
                  active && {
                    borderColor: colors.vermilion,
                    backgroundColor: colors.vermilionSoft,
                  },
                ]}
                onPress={() => {
                  tapHaptic();
                  setStarterPalette(pal.id);
                }}
              >
                <View style={styles.palDots}>
                  <View style={[styles.palDot, { backgroundColor: pal.wallTint }]} />
                  <View style={[styles.palDot, { backgroundColor: pal.accentPrimary }]} />
                </View>
                <Text
                  style={[
                    styles.palName,
                    { color: active ? colors.vermilion : colors.ink },
                  ]}
                >
                  {pal.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            tapHaptic();
            router.push(`/editor/custom:${selectedCat}:${roomCount}:${starterPalette}`);
          }}
        >
          <LinearGradient
            colors={colors.ctaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.launchBtn}
          >
            <Ionicons name="cube-outline" size={18} color="#fff" />
            <Text style={styles.launchText}>Launch Custom 3D Room</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* Browse Curated Templates by Category inside Studio */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.ink }]}>
          Templates by Category
        </Text>
        <Text style={[styles.sectionCount, { color: colors.muted }]}>27 curated</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.browseCats}
      >
        {CATEGORIES.map((cat) => {
          const active = browseCat === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.browsePill,
                { backgroundColor: colors.cream, borderColor: colors.border },
                active && { backgroundColor: colors.ink, borderColor: colors.ink },
              ]}
              onPress={() => {
                tapHaptic();
                setBrowseCat(cat.id);
              }}
            >
              <Text
                style={[
                  styles.browsePillText,
                  { color: active ? colors.paper : colors.ink },
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tplHorizontal}
      >
        {browseTemplates.map((tpl) => (
          <TemplateShowcaseCard
            key={tpl.id}
            template={tpl}
            compact
            onCustomize={() => router.push(`/editor/tpl:${tpl.id}`)}
          />
        ))}
      </ScrollView>

      {/* Saved Drafts Shelf */}
      <Text style={[styles.sectionTitle, { color: colors.ink, marginTop: 24, marginBottom: 10 }]}>
        Saved Drafts ({drafts.length})
      </Text>

      {loadingDrafts ? (
        <ActivityIndicator color={colors.vermilion} style={{ marginTop: 16 }} />
      ) : drafts.length === 0 ? (
        <View
          style={[
            styles.emptyBox,
            { backgroundColor: colors.cream, borderColor: colors.border },
          ]}
        >
          <Ionicons name="layers-outline" size={26} color={colors.muted} />
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            No saved drafts yet. Customize any template or custom room and tap Save.
          </Text>
        </View>
      ) : (
        <View style={styles.draftList}>
          {drafts.map((d) => (
            <TouchableOpacity
              key={d.id}
              style={[
                styles.draftCard,
                { backgroundColor: colors.cream, borderColor: colors.border },
              ]}
              onPress={() => {
                tapHaptic();
                router.push(`/editor/${d.id}`);
              }}
            >
              <View style={[styles.draftBadge, { backgroundColor: colors.vermilionSoft }]}>
                <Ionicons name="cube-outline" size={18} color={colors.vermilion} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.draftTitle, { color: colors.ink }]}>{d.title}</Text>
                <Text style={[styles.draftMeta, { color: colors.muted }]}>
                  {d.category.replace('_', ' ').toUpperCase()} · {d.rooms.length} room(s) ·{' '}
                  {d.aspectRatio}
                </Text>
              </View>
              <TouchableOpacity onPress={() => d.id && handleDelete(d.id)} style={{ padding: 6 }}>
                <Ionicons name="trash-outline" size={18} color={colors.muted} />
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={18} color={colors.ink} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 38 },
  eyebrow: { fontFamily: FONTS.semibold, fontSize: 11, letterSpacing: 1.4 },
  heading: { fontFamily: FONTS.bold, fontSize: 25, letterSpacing: -0.4, marginTop: 2 },
  sub: { fontFamily: FONTS.hand, fontSize: 18, marginTop: 3, marginBottom: 16 },
  builderCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    marginBottom: 24,
    ...SHADOWS.paperCard,
  },
  label: { fontFamily: FONTS.semibold, fontSize: 12, marginBottom: 10 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  catDot: { width: 6, height: 6, borderRadius: 3 },
  catChipText: { fontFamily: FONTS.semibold, fontSize: 12 },
  roomRow: { flexDirection: 'row', gap: 10 },
  roomBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  roomNum: { fontFamily: FONTS.bold, fontSize: 17 },
  roomWord: { fontFamily: FONTS.medium, fontSize: 11 },
  palChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.2,
  },
  palDots: { flexDirection: 'row', gap: 3 },
  palDot: { width: 10, height: 10, borderRadius: 5 },
  palName: { fontFamily: FONTS.semibold, fontSize: 11 },
  launchBtn: {
    marginTop: 20,
    borderRadius: 999,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  launchText: { fontFamily: FONTS.semibold, color: '#fff', fontSize: 15 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontFamily: FONTS.semibold, fontSize: 17, letterSpacing: -0.2 },
  sectionCount: { fontFamily: FONTS.medium, fontSize: 12 },
  browseCats: { gap: 8, paddingBottom: 12 },
  browsePill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  browsePillText: { fontFamily: FONTS.semibold, fontSize: 12 },
  tplHorizontal: { gap: 12, paddingBottom: 4 },
  emptyBox: {
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  emptyText: { fontFamily: FONTS.regular, textAlign: 'center', fontSize: 13, lineHeight: 19 },
  draftList: { gap: 10 },
  draftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  draftBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftTitle: { fontFamily: FONTS.semibold, fontSize: 15 },
  draftMeta: { fontFamily: FONTS.regular, fontSize: 12, marginTop: 2 },
});
