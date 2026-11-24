import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OrigamiCard3D } from '../../src/components/OrigamiCard3D';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/lib/api';
import { FONTS, SHADOWS, tapHaptic } from '../../src/theme';

export default function ReferScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState<{
    referralCode: string;
    exportCredits: number;
    totalReferred: number;
    paidReferrals: number;
    freeExportsEarned: number;
    shareMessage: string;
    friends: { id: string; name: string; hasPaid: boolean; joinedAt: string }[];
  } | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const data = await api.getReferralStats();
      setStats(data);
      void refreshUser();
    } catch {
      // Ignore offline
    }
  }, [refreshUser]);

  useFocusEffect(
    useCallback(() => {
      void loadStats();
    }, [loadStats])
  );

  const code = stats?.referralCode || user?.referralCode || 'PATRA-FRIEND';

  const handleShare = async () => {
    tapHaptic();
    const message =
      stats?.shareMessage ||
      `Create 3D pop-up invitations on Patra! Use my invite code ${code} when signing up.`;
    try {
      await Share.share({ message });
    } catch {
      Alert.alert('Your Referral Code', code);
    }
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.paper }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 14 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.eyebrow, { color: colors.vermilion }]}>INVITE & EARN FREE DOWNLOADS</Text>
      <Text style={[styles.heading, { color: colors.ink }]}>Gift Patra, Earn Free Downloads</Text>
      <Text style={[styles.sub, { color: colors.muted }]}>
        When a friend signs up with your code and completes any payment (even ₹49 / $3), you get +1 4K Download free.
      </Text>

      <View
        style={[
          styles.envelopeCard,
          { backgroundColor: colors.cream, borderColor: colors.border },
        ]}
      >
        <OrigamiCard3D
          title="Free 3D Download"
          subtitle={`Code: ${code}`}
          paperColor="#FCEAB8"
          accentColor="#D98218"
          inkColor="#B83628"
          compact
        />

        <View
          style={[
            styles.codeBox,
            { backgroundColor: colors.paper, borderColor: colors.marigold },
          ]}
        >
          <Text style={[styles.codeLabel, { color: colors.muted }]}>
            YOUR PERSONAL INVITE CODE
          </Text>
          <Text style={[styles.codeValue, { color: colors.ink }]}>{code}</Text>
        </View>

        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: colors.vermilion }]}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={18} color="#fff" />
          <Text style={styles.shareText}>Share Invite Link & Code</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.cream, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.statNum, { color: colors.ink }]}>
            {stats?.totalReferred ?? 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Friends Joined</Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.cream, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.statNum, { color: colors.ink }]}>
            {stats?.paidReferrals ?? 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Paid Friends</Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.cream, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.statNum, { color: colors.vermilion }]}>
            {stats?.freeExportsEarned ?? 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Free Downloads</Text>
        </View>
      </View>

      <View
        style={[
          styles.stepsCard,
          { backgroundColor: colors.cream, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.stepsTitle, { color: colors.ink }]}>How It Works</Text>
        {[
          ['1. Share your code', 'Send your invite code to friends planning a wedding, birthday, or party.'],
          ['2. Friend unlocks an invite', 'They sign up with your code and purchase any plan or single download pass.'],
          ['3. Instant +1 Download Credit', 'We send you a push notification and credit +1 free 4K download right away.'],
        ].map(([t, d]) => (
          <View key={t} style={styles.stepRow}>
            <View style={[styles.stepDot, { backgroundColor: colors.vermilion }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepName, { color: colors.ink }]}>{t}</Text>
              <Text style={[styles.stepDesc, { color: colors.muted }]}>{d}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 36 },
  eyebrow: { fontFamily: FONTS.semibold, fontSize: 11, letterSpacing: 1.4 },
  heading: { fontFamily: FONTS.bold, fontSize: 25, letterSpacing: -0.4, marginTop: 2 },
  sub: { fontFamily: FONTS.hand, fontSize: 17, marginTop: 4, marginBottom: 18, lineHeight: 22 },
  envelopeCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    gap: 14,
    ...SHADOWS.paperCard,
  },
  codeBox: {
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  codeLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1.2 },
  codeValue: { fontSize: 20, fontWeight: '700', marginTop: 4, letterSpacing: 1.4 },
  shareBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 18, marginBottom: 18 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  statNum: { fontSize: 21, fontWeight: '700' },
  statLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  stepsCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    gap: 14,
  },
  stepsTitle: { fontSize: 16, fontWeight: '600' },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepDot: { width: 9, height: 9, borderRadius: 4.5, marginTop: 5 },
  stepName: { fontSize: 14, fontWeight: '600' },
  stepDesc: { fontSize: 12, marginTop: 2, lineHeight: 17 },
});
