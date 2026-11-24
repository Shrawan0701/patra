import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { LiquidGlassWebView } from '../src/components/LiquidGlassWebView';
import { useAuth } from '../src/context/AuthContext';
import { FONTS } from '../src/theme';

const PATRA_LOGO = require('../assets/patra-logo.png');

interface FloatingOrbConfig {
  top: number;
  left: number;
  size: number;
  colors: [string, string];
  driftY: number;
  driftX: number;
  duration: number;
}

const SPLASH_ORBS: FloatingOrbConfig[] = [
  { top: -64, left: -78, size: 34, colors: ['#F5EFE6', '#D9A86C'], driftY: -10, driftX: 6, duration: 2800 },
  { top: -72, left: 62, size: 42, colors: ['#E5D2B5', '#9A6E3B'], driftY: 12, driftX: -8, duration: 3200 },
  { top: 44, left: 82, size: 28, colors: ['#93A8D8', '#1A2B5E'], driftY: -9, driftX: 7, duration: 2600 },
  { top: 68, left: -86, size: 38, colors: ['#EAA88F', '#C8502B'], driftY: 10, driftX: -6, duration: 3000 },
  { top: 14, left: -102, size: 24, colors: ['#86C5B2', '#1B5E4B'], driftY: -8, driftX: 5, duration: 2400 },
];

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading, hasSeenOnboarding } = useAuth();

  const introOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.84)).current;
  const wordmarkY = useRef(new Animated.Value(16)).current;
  const ringSpin = useRef(new Animated.Value(0)).current;
  const haloPulse = useRef(new Animated.Value(0)).current;
  const sweepProgress = useRef(new Animated.Value(0)).current;
  const orbAnims = useRef<Animated.Value[]>(SPLASH_ORBS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(introOpacity, {
        toValue: 1,
        duration: 680,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 44,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(wordmarkY, {
        toValue: 0,
        duration: 720,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sweepProgress, {
        toValue: 1,
        duration: 2100,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const ringLoop = Animated.loop(
      Animated.timing(ringSpin, {
        toValue: 1,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    ringLoop.start();

    const haloLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(haloPulse, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(haloPulse, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    haloLoop.start();

    const orbLoops = orbAnims.map((anim, i) => {
      const cfg = SPLASH_ORBS[i];
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: cfg.duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: cfg.duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return loop;
    });

    return () => {
      ringLoop.stop();
      haloLoop.stop();
      orbLoops.forEach((l) => l.stop());
    };
  }, [introOpacity, logoScale, wordmarkY, ringSpin, haloPulse, sweepProgress, orbAnims]);

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      if (user) {
        router.replace('/(tabs)/explore');
      } else if (!hasSeenOnboarding) {
        router.replace('/onboarding');
      } else {
        router.replace('/(auth)/login');
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, [loading, user, hasSeenOnboarding, router]);

  const spinDeg = ringSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const haloScale = haloPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  const sweepScaleX = sweepProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.05, 1],
  });

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LiquidGlassWebView variant="splash" style={StyleSheet.absoluteFill} />

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(6,7,11,0.28)', 'rgba(6,7,11,0.12)', 'rgba(6,7,11,0.68)']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.centerStage, { opacity: introOpacity }]}>
        <View style={styles.emblemAssembly}>
          {/* Orbiting sculptural glass spheres */}
          {SPLASH_ORBS.map((orb, idx) => {
            const tx = orbAnims[idx].interpolate({
              inputRange: [0, 1],
              outputRange: [orb.left, orb.left + orb.driftX],
            });
            const ty = orbAnims[idx].interpolate({
              inputRange: [0, 1],
              outputRange: [orb.top, orb.top + orb.driftY],
            });
            return (
              <Animated.View
                key={idx}
                pointerEvents="none"
                style={[
                  styles.orbWrap,
                  {
                    width: orb.size,
                    height: orb.size,
                    borderRadius: orb.size / 2,
                    transform: [{ translateX: tx }, { translateY: ty }],
                  },
                ]}
              >
                <LinearGradient
                  colors={orb.colors}
                  start={{ x: 0.15, y: 0.1 }}
                  end={{ x: 0.9, y: 0.95 }}
                  style={[styles.orbFill, { borderRadius: orb.size / 2 }]}
                >
                  <View style={styles.orbSpecular} />
                </LinearGradient>
              </Animated.View>
            );
          })}

          {/* Slowly rotating hairline orbital ring */}
          <Animated.View
            style={[
              styles.orbitalRing,
              { transform: [{ rotate: spinDeg }] },
            ]}
          >
            <View style={styles.ringDot} />
          </Animated.View>

          {/* Breathing glass halo */}
          <Animated.View
            style={[
              styles.glassHalo,
              { transform: [{ scale: haloScale }] },
            ]}
          />

          {/* Sculptural center logo medallion */}
          <Animated.View
            style={[
              styles.medallion,
              { transform: [{ scale: logoScale }] },
            ]}
          >
            <Image source={PATRA_LOGO} style={styles.logoImg} />
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.wordmarkBlock,
            { transform: [{ translateY: wordmarkY }] },
          ]}
        >
          <Text style={styles.wordmark}>Patra</Text>
          <Text style={styles.tagline}>SCULPTURAL 3D INVITATIONS</Text>
        </Animated.View>
      </Animated.View>

      <View style={styles.footerBar}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              { transform: [{ scaleX: sweepScaleX }] },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#08090D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemAssembly: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  orbitalRing: {
    position: 'absolute',
    width: 162,
    height: 162,
    borderRadius: 81,
    borderWidth: 1,
    borderColor: 'rgba(245, 239, 230, 0.24)',
    alignItems: 'center',
  },
  ringDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D9A86C',
    marginTop: -3,
  },
  glassHalo: {
    position: 'absolute',
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  medallion: {
    width: 82,
    height: 82,
    borderRadius: 24,
    padding: 5,
    backgroundColor: 'rgba(14, 16, 26, 0.72)',
    borderWidth: 1.2,
    borderColor: 'rgba(245, 239, 230, 0.36)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 10,
  },
  logoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  orbWrap: {
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  orbFill: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.36)',
    padding: 4,
  },
  orbSpecular: {
    width: '36%',
    height: '24%',
    borderRadius: 99,
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
  },
  wordmarkBlock: {
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: FONTS.bold,
    fontSize: 38,
    letterSpacing: -0.9,
    color: '#FAF9F6',
  },
  tagline: {
    fontFamily: FONTS.semibold,
    fontSize: 11,
    letterSpacing: 3.1,
    color: 'rgba(217, 168, 108, 0.92)',
    marginTop: 6,
  },
  footerBar: {
    position: 'absolute',
    bottom: 52,
    width: 140,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8CFA8',
  },
});
