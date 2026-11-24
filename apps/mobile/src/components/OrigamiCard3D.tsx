import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface Props {
  title: string;
  subtitle?: string;
  accentColor?: string;
  paperColor?: string;
  inkColor?: string;
  compact?: boolean;
  autoAnimate?: boolean;
}

/**
 * Crisp architectural pop-up card preview without iOS rotateY z-buffer clipping.
 * Uses clean layered planes and spring pop-up motion.
 */
export function OrigamiCard3D({
  title,
  subtitle,
  accentColor = '#C83E37',
  paperColor = '#FCE7D2',
  inkColor = '#B8322A',
  compact = false,
  autoAnimate = true,
}: Props) {
  const { colors } = useTheme();
  const popAnim = useRef(new Animated.Value(autoAnimate ? 0 : 1)).current;

  useEffect(() => {
    if (!autoAnimate) return;
    Animated.timing(popAnim, {
      toValue: 1,
      delay: 180,
      duration: 600,
      easing: Easing.out(Easing.back(1.35)),
      useNativeDriver: true,
    }).start();
  }, [autoAnimate, popAnim]);

  const wingShift = popAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });

  const popTranslateY = popAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  const popScale = popAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 1],
  });

  const height = compact ? 132 : 184;

  return (
    <View style={[styles.stage, { height }]}>
      <View style={[styles.bookShell, { maxWidth: compact ? 256 : 292 }]}>
        {/* Back Outer Wing Accent */}
        <View
          style={[
            styles.backFlapLeft,
            { backgroundColor: paperColor, borderColor: inkColor },
          ]}
        />
        <View
          style={[
            styles.backFlapRight,
            { backgroundColor: paperColor, borderColor: inkColor },
          ]}
        />

        {/* Left Gable Wall */}
        <Animated.View
          style={[
            styles.wing,
            styles.wingLeft,
            {
              backgroundColor: paperColor,
              borderColor: inkColor,
              transform: [{ translateX: wingShift }],
            },
          ]}
        >
          <View style={styles.garlandDotRow}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[styles.garlandDot, { backgroundColor: accentColor, borderColor: inkColor }]}
              />
            ))}
          </View>
          <View style={[styles.archWindow, { borderColor: inkColor }]} />
        </Animated.View>

        {/* Right Signage Wall */}
        <Animated.View
          style={[
            styles.wing,
            styles.wingRight,
            {
              backgroundColor: '#FFFDF9',
              borderColor: inkColor,
              transform: [{ translateX: Animated.multiply(wingShift, -1) }],
            },
          ]}
        >
          <View style={[styles.plaque, { borderColor: inkColor }]}>
            <Text style={[styles.plaqueTitle, { color: inkColor }]} numberOfLines={2}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={[styles.plaqueSub, { color: '#6E655F' }]} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </Animated.View>
      </View>

      {/* Pop-up Isometric Floor + Mandap Canopy Silhouette */}
      <Animated.View
        style={[
          styles.popCenter,
          {
            opacity: popAnim,
            transform: [{ translateY: popTranslateY }, { scale: popScale }],
          },
        ]}
      >
        <View style={[styles.floorDiamond, { backgroundColor: paperColor, borderColor: inkColor }]} />
        <View style={[styles.canopy, { backgroundColor: accentColor, borderColor: inkColor }]} />
        <View style={[styles.pillarLeft, { backgroundColor: colors.marigold, borderColor: inkColor }]} />
        <View style={[styles.pillarRight, { backgroundColor: colors.marigold, borderColor: inkColor }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bookShell: {
    flexDirection: 'row',
    width: '100%',
    height: '82%',
    alignItems: 'stretch',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 12,
  },
  backFlapLeft: {
    position: 'absolute',
    left: 2,
    top: 10,
    bottom: 8,
    width: 18,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 6,
    borderWidth: 1.2,
    opacity: 0.72,
  },
  backFlapRight: {
    position: 'absolute',
    right: 2,
    top: 10,
    bottom: 8,
    width: 18,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 6,
    borderWidth: 1.2,
    opacity: 0.72,
  },
  wing: {
    flex: 1,
    borderWidth: 1.5,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wingLeft: {
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 6,
    borderRightWidth: 0.75,
  },
  wingRight: {
    borderTopRightRadius: 14,
    borderBottomRightRadius: 6,
    borderLeftWidth: 0.75,
  },
  garlandDotRow: {
    position: 'absolute',
    top: 8,
    flexDirection: 'row',
    gap: 5,
  },
  garlandDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1,
  },
  archWindow: {
    width: '54%',
    height: '56%',
    borderWidth: 1.2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.52)',
  },
  plaque: {
    width: '86%',
    height: '66%',
    borderWidth: 1.2,
    borderRadius: 6,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDF9',
  },
  plaqueTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  plaqueSub: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
  },
  popCenter: {
    position: 'absolute',
    bottom: 5,
    width: 74,
    height: 56,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  floorDiamond: {
    width: 60,
    height: 15,
    borderWidth: 1.2,
    borderRadius: 8,
  },
  canopy: {
    position: 'absolute',
    top: 4,
    width: 44,
    height: 14,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: 1.2,
  },
  pillarLeft: {
    position: 'absolute',
    bottom: 12,
    left: 19,
    width: 5.5,
    height: 25,
    borderWidth: 1,
  },
  pillarRight: {
    position: 'absolute',
    bottom: 12,
    right: 19,
    width: 5.5,
    height: 25,
    borderWidth: 1,
  },
});
