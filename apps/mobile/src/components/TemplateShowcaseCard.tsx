import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CategoryId, TemplatePreset, getPaletteById } from '@patra/shared';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SHADOWS, tapHaptic } from '../theme';

interface Props {
  template: TemplatePreset;
  onCustomize: () => void;
  onPreviewAbove?: () => void;
  compact?: boolean;
}

const CATEGORY_ICON: Record<CategoryId, keyof typeof Ionicons.glyphMap> = {
  wedding: 'heart-outline',
  haldi: 'sunny-outline',
  reception: 'wine-outline',
  birthday: 'gift-outline',
  parties: 'musical-notes-outline',
  baby_shower: 'cloudy-outline',
  engagement: 'diamond-outline',
  housewarming: 'home-outline',
  festivals: 'flame-outline',
};

/**
 * Editorial paper-craft showcase card tailored per template palette & occasion.
 */
export function TemplateShowcaseCard({
  template,
  onCustomize,
  onPreviewAbove,
  compact = false,
}: Props) {
  const { colors } = useTheme();
  const firstRoom = template.project.rooms[0];
  const pal = getPaletteById(firstRoom.paletteId);
  const roomCount = template.project.rooms.length;
  const totalSec = template.project.rooms.reduce(
    (s, r) => s + Math.max(4, Math.min(25, r.durationSeconds ?? 8)),
    0
  );
  const iconName = CATEGORY_ICON[template.category] ?? 'sparkles-outline';

  return (
    <TouchableOpacity
      activeOpacity={0.93}
      onPress={() => {
        tapHaptic();
        onCustomize();
      }}
      style={compact ? { width: 274 } : undefined}
    >
      <LinearGradient
        colors={colors.glassGradient}
        style={[styles.card, { borderColor: colors.borderStrong }]}
      >
        {/* Layered Stationery Visual Header */}
        <LinearGradient
          colors={[pal.backdropColor, pal.wallTint]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.visualStage, compact && { height: 146 }]}
        >
          {/* Floating Badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.glassPill, { borderColor: pal.inkColor + '33' }]}>
              <Text style={[styles.pillText, { color: pal.inkColor }]}>{template.vibeTag}</Text>
            </View>
            <View style={[styles.glassPill, { borderColor: pal.inkColor + '33' }]}>
              <Ionicons name="layers-outline" size={11} color={pal.inkColor} />
              <Text style={[styles.pillText, { color: pal.inkColor }]}>
                {roomCount} {roomCount === 1 ? 'Room' : 'Rooms'} · {totalSec}s
              </Text>
            </View>
          </View>

          {/* Architectural Framed Invitation Mini-Plaque */}
          <View
            style={[
              styles.miniFoldWrap,
              { borderColor: pal.inkColor },
            ]}
          >
            {/* Left Fold Wing Accent */}
            <View
              style={[
                styles.miniWing,
                { backgroundColor: pal.wallTint, borderRightColor: pal.inkColor },
              ]}
            >
              <View style={[styles.wingArch, { borderColor: pal.inkColor }]}>
                <Ionicons name={iconName} size={compact ? 18 : 22} color={pal.accentPrimary} />
              </View>
            </View>

            {/* Right Framed Plaque */}
            <View style={[styles.miniPlaque, { backgroundColor: pal.paperBase }]}>
              <View style={[styles.innerRule, { borderColor: pal.accentPrimary }]}>
                <Text
                  style={[styles.plaqueEvent, { color: pal.inkColor }]}
                  numberOfLines={1}
                >
                  {firstRoom.signage.eventTitle}
                </Text>
                <Text
                  style={[styles.plaqueHost, { color: pal.accentPrimary }]}
                  numberOfLines={1}
                >
                  {firstRoom.signage.hostLine}
                </Text>
                <Text
                  style={[styles.plaqueDate, { color: pal.inkColor }]}
                  numberOfLines={1}
                >
                  {firstRoom.signage.dateText}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Bottom Metadata & Actions */}
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={[styles.name, { color: colors.ink }]} numberOfLines={1}>
              {template.name}
            </Text>
            <View style={styles.paletteDots}>
              <View
                style={[styles.dot, { backgroundColor: pal.wallTint, borderColor: colors.border }]}
              />
              <View
                style={[
                  styles.dot,
                  { backgroundColor: pal.accentPrimary, borderColor: colors.border },
                ]}
              />
              <View
                style={[styles.dot, { backgroundColor: pal.inkColor, borderColor: colors.border }]}
              />
            </View>
          </View>

          <Text style={[styles.sub, { color: colors.muted }]} numberOfLines={2}>
            {template.subtitle}
          </Text>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            {onPreviewAbove ? (
              <TouchableOpacity
                style={[
                  styles.spinBtn,
                  { backgroundColor: colors.paper, borderColor: colors.border },
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  tapHaptic();
                  onPreviewAbove();
                }}
              >
                <Ionicons name="cube-outline" size={14} color={colors.ink} />
                <Text style={[styles.spinText, { color: colors.ink }]}>Spin 3D</Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.freeHint, { color: colors.emerald }]}>Free to edit</Text>
            )}

            <View style={[styles.editPill, { backgroundColor: colors.vermilionSoft }]}>
              <Text style={[styles.editText, { color: colors.vermilion }]}>Customize</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.vermilion} />
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    ...SHADOWS.paperCard,
  },
  visualStage: {
    height: 168,
    padding: 12,
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  glassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,253,249,0.88)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: { fontFamily: FONTS.semibold, fontSize: 10 },
  miniFoldWrap: {
    flex: 1,
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1.4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  miniWing: {
    width: '34%',
    borderRightWidth: 1.2,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wingArch: {
    width: '86%',
    height: '82%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  miniPlaque: {
    flex: 1,
    padding: 7,
  },
  innerRule: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  plaqueEvent: { fontFamily: FONTS.bold, fontSize: 15, textAlign: 'center' },
  plaqueHost: { fontFamily: FONTS.hand, fontSize: 14, textAlign: 'center' },
  plaqueDate: { fontFamily: FONTS.medium, fontSize: 10, opacity: 0.8 },
  body: { padding: 14, gap: 5 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  name: { fontFamily: FONTS.semibold, fontSize: 16, flex: 1, letterSpacing: -0.2 },
  paletteDots: { flexDirection: 'row', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1 },
  sub: { fontFamily: FONTS.regular, fontSize: 12, lineHeight: 17 },
  footer: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  spinText: { fontFamily: FONTS.semibold, fontSize: 11 },
  freeHint: { fontFamily: FONTS.semibold, fontSize: 11 },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  editText: { fontFamily: FONTS.semibold, fontSize: 12 },
});
