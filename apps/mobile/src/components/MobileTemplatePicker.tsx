import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  PREMIUM_TEMPLATES,
  ProjectConfig,
  TEMPLATES,
  TemplatePreset,
  TemplateRegionId,
} from '@patra/shared';
import { useTheme } from '../context/ThemeContext';
import { FONTS, tapHaptic } from '../theme';

type PickerFilter = 'all' | 'western' | 'east_asian' | 'indian' | 'classic' | 'drafts';

interface Props {
  savedProjects: (ProjectConfig & { updatedAt: string })[];
  activeTitle: string;
  activeProjectId?: string;
  onSelect: (key: string) => void;
}

const REGION_LABEL: Record<TemplateRegionId, string> = {
  western: 'Western',
  east_asian: 'East Asian',
  indian: 'Indian',
};

export function MobileTemplatePicker({
  savedProjects,
  activeTitle,
  activeProjectId,
  onSelect,
}: Props) {
  const { colors } = useTheme();
  const [filter, setFilter] = useState<PickerFilter>('all');
  const [query, setQuery] = useState('');

  const allSorted = useMemo(() => {
    const western = PREMIUM_TEMPLATES.filter((t) => t.region === 'western');
    const eastAsian = PREMIUM_TEMPLATES.filter((t) => t.region === 'east_asian');
    const indian = PREMIUM_TEMPLATES.filter((t) => t.region === 'indian');
    const mixed: TemplatePreset[] = [];
    const max = Math.max(western.length, eastAsian.length, indian.length);
    for (let i = 0; i < max; i++) {
      if (western[i]) mixed.push(western[i]);
      if (eastAsian[i]) mixed.push(eastAsian[i]);
      if (indian[i]) mixed.push(indian[i]);
    }
    return [...mixed, ...TEMPLATES];
  }, []);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (filter === 'drafts') {
      return savedProjects
        .filter((p) => !q || p.title.toLowerCase().includes(q))
        .map((p) => ({
          key: p.id!,
          title: p.title,
          tag: 'My Draft',
          dotColor: colors.vermilion,
          isActive: activeProjectId === p.id,
        }));
    }

    const baseList =
      filter === 'all'
        ? allSorted
        : filter === 'classic'
        ? TEMPLATES
        : PREMIUM_TEMPLATES.filter((t) => t.region === filter);

    return baseList
      .filter(
        (t) =>
          !q ||
          t.name.toLowerCase().includes(q) ||
          t.vibeTag.toLowerCase().includes(q) ||
          t.subtitle.toLowerCase().includes(q)
      )
      .map((t) => ({
        key: `tpl:${t.id}`,
        title: t.name,
        tag: t.region ? REGION_LABEL[t.region] : t.vibeTag,
        dotColor: t.previewGradient[1] || t.previewGradient[0],
        isActive: !activeProjectId && activeTitle === t.project.title,
      }));
  }, [filter, query, savedProjects, allSorted, activeProjectId, activeTitle, colors.vermilion]);

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {(
          [
            ['all', `All Global (${allSorted.length})`],
            ['western', 'Western'],
            ['east_asian', 'East Asian'],
            ['indian', 'Indian'],
            ['classic', 'Classic'],
            ...(savedProjects.length > 0 ? [['drafts', `Drafts (${savedProjects.length})`] as const] : []),
          ] as [PickerFilter, string][]
        ).map(([id, lbl]) => {
          const active = filter === id;
          return (
            <TouchableOpacity
              key={id}
              style={[
                styles.filterPill,
                { borderColor: colors.border, backgroundColor: colors.cream },
                active && { borderColor: colors.ink, backgroundColor: colors.ink },
              ]}
              onPress={() => {
                tapHaptic();
                setFilter(id);
              }}
            >
              <Text style={[styles.filterText, { color: active ? colors.paper : colors.ink }]}>
                {lbl}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.searchBox, { backgroundColor: colors.cream, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={14} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.ink }]}
          value={query}
          onChangeText={setQuery}
          placeholder="Search Tuscan, Kyoto, Chapel..."
          placeholderTextColor={colors.muted}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={15} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.cardScroll}
        contentContainerStyle={styles.cardRow}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.card,
              { borderColor: colors.border, backgroundColor: colors.cream },
              item.isActive && { borderWidth: 1.5, borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
            ]}
            onPress={() => onSelect(item.key)}
          >
            <View style={styles.cardTop}>
              <View style={[styles.dot, { backgroundColor: item.dotColor }]} />
              <Text style={[styles.tag, { color: colors.muted }]} numberOfLines={1}>
                {item.tag}
              </Text>
            </View>
            <Text style={[styles.title, { color: colors.ink }]} numberOfLines={1}>
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  filterScroll: { flexGrow: 0 },
  filterRow: { gap: 6, alignItems: 'center' },
  filterPill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterText: { fontFamily: FONTS.semibold, fontSize: 11.5 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontFamily: FONTS.regular, fontSize: 12.5, paddingVertical: 0 },
  cardScroll: { flexGrow: 0 },
  cardRow: { gap: 8 },
  card: {
    width: 158,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 4.5 },
  tag: { fontFamily: FONTS.semibold, fontSize: 10.5 },
  title: { fontFamily: FONTS.bold, fontSize: 12.5 },
});
