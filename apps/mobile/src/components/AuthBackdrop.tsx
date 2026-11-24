import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { FONTS } from '../theme';
import { LiquidGlassVariant, LiquidGlassWebView } from './LiquidGlassWebView';

const PATRA_LOGO = require('../../assets/patra-logo.png');

interface AuthWebGLHeroProps {
  variant: Extract<LiquidGlassVariant, 'login' | 'register' | 'forgot'>;
  height?: number;
  topInset?: number;
  eyebrow: string;
  headline: string;
  caption?: string;
  compact?: boolean;
}

export function AuthWebGLHero({
  variant,
  height = 300,
  topInset = 0,
  eyebrow,
  headline,
  caption,
  compact = false,
}: AuthWebGLHeroProps) {
  return (
    <View style={[styles.hero, { height: height + topInset }]}>
      <LiquidGlassWebView variant={variant} style={StyleSheet.absoluteFill} />

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(6,7,12,0.42)', 'rgba(6,7,12,0.08)', 'rgba(6,7,12,0.72)']}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.overlay,
          {
            paddingTop: topInset + 14,
            paddingBottom: compact ? 38 : 46,
          },
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.brandRow}>
            <Image source={PATRA_LOGO} style={styles.logo} />
            <Text style={styles.brandName}>Patra</Text>
          </View>
          <Text style={styles.indexText}>{eyebrow}</Text>
        </View>

        <View>
          <Text style={[styles.headline, compact && styles.headlineCompact]}>{headline}</Text>
          {caption ? (
            <Text style={styles.caption} numberOfLines={2}>
              {caption}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

/**
 * Legacy compatibility export.
 */
export function AuthBackdrop({ variant = 'login' }: { variant?: Extract<LiquidGlassVariant, 'login' | 'register' | 'forgot'> }) {
  return <LiquidGlassWebView variant={variant} style={StyleSheet.absoluteFill} />;
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  overlay: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  brandName: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    color: '#FAF9F6',
    letterSpacing: -0.2,
  },
  indexText: {
    fontFamily: FONTS.semibold,
    fontSize: 10.5,
    letterSpacing: 1.4,
    color: 'rgba(248, 246, 242, 0.82)',
  },
  headline: {
    fontFamily: FONTS.bold,
    fontSize: 27,
    lineHeight: 31,
    letterSpacing: -0.5,
    color: '#FAF9F6',
  },
  headlineCompact: {
    fontSize: 22,
    lineHeight: 26,
  },
  caption: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    lineHeight: 18,
    color: 'rgba(248, 246, 242, 0.82)',
    marginTop: 6,
  },
});
