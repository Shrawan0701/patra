import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OrigamiCard3D } from '../src/components/OrigamiCard3D';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { FONTS, SHADOWS, tapHaptic } from '../src/theme';

const PATRA_LOGO = require('../assets/patra-logo.png');

const BUBBLES = [
  'Psst... spin any 3D room before you export!',
  'Mix mandaps, cakes, marigolds & custom walls.',
  'Export crisp 9:16 Reels & WhatsApp videos.',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { completeOnboarding } = useAuth();
  const [bubbleIdx, setBubbleIdx] = useState(0);

  const bobY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobY, {
          toValue: -6,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bobY, {
          toValue: 3,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bobY]);

  const goTo = async (path: '/(auth)/register' | '/(auth)/login') => {
    tapHaptic();
    await completeOnboarding();
    router.replace(path);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.paper,
          paddingTop: insets.top + 18,
          paddingBottom: Math.max(24, insets.bottom + 14),
        },
      ]}
    >
      {/* Top Minimal Brand Pill */}
      <View style={styles.brandHeader}>
        <Image source={PATRA_LOGO} style={[styles.smallLogo, { borderColor: colors.border }]} />
        <Text style={[styles.brandName, { color: colors.ink }]}>Patra</Text>
      </View>

      {/* Handwritten Warm Welcome Copy (Cat On Chair style) */}
      <View style={styles.copySection}>
        <Text style={[styles.handHeading, { color: colors.ink }]}>
          Hi there! I’m Patra. I’ll help you fold your next celebration in 3D.
        </Text>
        <Text style={[styles.handSub, { color: colors.muted }]}>
          Tap the card below to peek inside a room.
        </Text>
      </View>

      {/* Center Illustrated 3D Scene + Floating Glassy Sage Speech Bubble */}
      <TouchableOpacity
        activeOpacity={0.92}
        style={styles.centerStage}
        onPress={() => {
          tapHaptic();
          setBubbleIdx((i) => (i + 1) % BUBBLES.length);
        }}
      >
        <Animated.View style={{ transform: [{ translateY: bobY }], alignItems: 'center' }}>
          <LinearGradient
            colors={colors.ctaGradient}
            style={[styles.speechBubble, SHADOWS.paperCard]}
          >
            <Text style={styles.bubbleText}>{BUBBLES[bubbleIdx]}</Text>
          </LinearGradient>
          <View style={[styles.bubbleTail, { borderTopColor: colors.vermilion }]} />
        </Animated.View>

        <View
          style={[
            styles.haloCircle,
            { backgroundColor: colors.vermilionSoft, borderColor: colors.border },
          ]}
        >
          <OrigamiCard3D
            title="The Wedding"
            subtitle="Haldi, Mandap & Reception"
            accentColor={colors.vermilion}
            paperColor="#E4EFE0"
            inkColor="#355E3E"
          />
        </View>
      </TouchableOpacity>

      {/* Clean Bunpo-Inspired 2-Button Stack */}
      <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => goTo('/(auth)/register')}
        >
          <LinearGradient
            colors={colors.ctaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.primaryBtn, SHADOWS.paperCard]}
          >
            <Text style={styles.primaryText}>Get started</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.secondaryBtn,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.borderStrong },
          ]}
          onPress={() => goTo('/(auth)/login')}
        >
          <Text style={[styles.secondaryText, { color: colors.ink }]}>
            I already have an account
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  smallLogo: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
  },
  brandName: {
    fontFamily: FONTS.bold,
    fontSize: 19,
    letterSpacing: -0.3,
  },
  copySection: {
    paddingHorizontal: 4,
    gap: 6,
  },
  handHeading: {
    fontFamily: FONTS.hand,
    fontSize: 25,
    lineHeight: 31,
  },
  handSub: {
    fontFamily: FONTS.hand,
    fontSize: 18,
  },
  centerStage: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  speechBubble: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 20,
    maxWidth: 270,
  },
  bubbleText: {
    fontFamily: FONTS.hand,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20,
  },
  bubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  haloCircle: {
    width: '100%',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  actions: {
    gap: 10,
  },
  primaryBtn: {
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryText: {
    fontFamily: FONTS.semibold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  secondaryBtn: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
});
