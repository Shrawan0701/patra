import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export interface ThemeColors {
  paper: string;
  paperWarm: string;
  cream: string;
  surfaceElevated: string;
  ink: string;
  inkSoft: string;
  muted: string;
  vermilion: string; // Primary botanical sage-green accent
  vermilionSoft: string;
  sageDeep: string;
  marigold: string;
  marigoldSoft: string;
  emerald: string;
  emeraldSoft: string;
  border: string;
  borderStrong: string;
  glassGradient: [string, string];
  ctaGradient: [string, string];
}

export const LIGHT_COLORS: ThemeColors = {
  paper: '#F5F4EE',
  paperWarm: '#E7ECE2',
  cream: '#FCFDF9',
  surfaceElevated: 'rgba(255, 255, 255, 0.86)',
  ink: '#18221B',
  inkSoft: '#3F4D43',
  muted: '#6E7D72',
  vermilion: '#4E7D58',
  vermilionSoft: 'rgba(78, 125, 88, 0.13)',
  sageDeep: '#355E3E',
  marigold: '#C4933B',
  marigoldSoft: 'rgba(196, 147, 59, 0.14)',
  emerald: '#2D6A4F',
  emeraldSoft: '#E3F1E7',
  border: 'rgba(24, 34, 27, 0.09)',
  borderStrong: 'rgba(24, 34, 27, 0.18)',
  glassGradient: ['rgba(255, 255, 255, 0.90)', 'rgba(235, 243, 232, 0.72)'],
  ctaGradient: ['#5B8C66', '#3D6A47'],
};

export const DARK_COLORS: ThemeColors = {
  paper: '#0C110E',
  paperWarm: '#18211B',
  cream: '#131A15',
  surfaceElevated: 'rgba(26, 36, 29, 0.88)',
  ink: '#EFF4EE',
  inkSoft: '#C4D0C6',
  muted: '#859689',
  vermilion: '#6CC080',
  vermilionSoft: 'rgba(108, 192, 128, 0.16)',
  sageDeep: '#4B9B5E',
  marigold: '#E5AE49',
  marigoldSoft: 'rgba(229, 174, 73, 0.15)',
  emerald: '#6CC080',
  emeraldSoft: 'rgba(108, 192, 128, 0.16)',
  border: 'rgba(220, 240, 224, 0.11)',
  borderStrong: 'rgba(220, 240, 224, 0.22)',
  glassGradient: ['rgba(30, 41, 33, 0.92)', 'rgba(17, 24, 19, 0.80)'],
  ctaGradient: ['#6CC080', '#48995C'],
};

export const COLORS = LIGHT_COLORS;

export const FONTS = {
  hand: 'PatrickHand_400Regular',
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
};

export const SHADOWS = {
  paperCard: Platform.select({
    ios: {
      shadowColor: '#0E1A11',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),
  floatingDock: Platform.select({
    ios: {
      shadowColor: '#0E1A11',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.14,
      shadowRadius: 24,
    },
    android: {
      elevation: 10,
    },
    default: {},
  }),
};

export function tapHaptic() {
  if (Platform.OS !== 'web') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export function successHaptic() {
  if (Platform.OS !== 'web') {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}
