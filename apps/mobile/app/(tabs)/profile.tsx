import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PaywallModal } from '../../src/components/PaywallModal';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/lib/api';
import {
  cancelDailyProductNotifications,
  isDailyNotificationsEnabled,
  scheduleDailyProductNotifications,
} from '../../src/lib/dailyNotifications';
import { FONTS, SHADOWS, tapHaptic } from '../../src/theme';

type ProfileTab = 'account' | 'billing';

interface PaymentItem {
  id: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  createdAt: string;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, setDark } = useTheme();
  const { user, signOut, registerPushNotifications, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<ProfileTab>('account');
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [dailyEnabled, setDailyEnabled] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    void isDailyNotificationsEnabled().then(setDailyEnabled);
  }, []);

  const loadBillingActivity = useCallback(async () => {
    setLoadingActivity(true);
    try {
      const data = await api.getBillingActivity();
      setPayments(data.payments);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Ignore offline
    } finally {
      setLoadingActivity(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadBillingActivity();
    }, [loadBillingActivity])
  );

  const handleMarkAllRead = async () => {
    tapHaptic();
    await api.markNotificationsRead().catch(() => {});
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleToggleDailyReminders = async (val: boolean) => {
    tapHaptic();
    if (val) {
      const ok = await scheduleDailyProductNotifications();
      setDailyEnabled(ok);
      if (ok) {
        Alert.alert(
          'Daily Reminders Active',
          'You will receive 3 creative Patra notifications daily at 10:00 AM, 3:30 PM, and 8:00 PM.'
        );
      } else {
        Alert.alert('Permission Needed', 'Enable notification permissions in device settings.');
      }
    } else {
      await cancelDailyProductNotifications();
      setDailyEnabled(false);
    }
  };

  const handleCancelSubscription = () => {
    tapHaptic();
    Alert.alert(
      'Cancel Auto-Renewal?',
      'Your remaining monthly or yearly downloads stay active until the end of your current billing cycle.',
      [
        { text: 'Keep Plan', style: 'cancel' },
        {
          text: 'Cancel Renewal',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.cancelSubscription();
              await refreshUser();
              await loadBillingActivity();
              Alert.alert('Auto-Renewal Cancelled', res.message);
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Unable to cancel subscription');
            }
          },
        },
      ]
    );
  };

  const handleEnablePush = async () => {
    tapHaptic();
    const token = await registerPushNotifications();
    if (token) {
      Alert.alert(
        'Notifications Active',
        'Daily 3D inspiration reminders and subscription alerts are enabled.'
      );
    } else {
      Alert.alert('Notifications', 'Push notifications require a physical device or notification permission.');
    }
  };

  const handleLogout = async () => {
    tapHaptic();
    await signOut();
    router.replace('/(auth)/login');
  };

  const planLabel =
    user?.planTier === 'YEARLY_ALL_ACCESS'
      ? 'Yearly All-Access'
      : user?.planTier === 'MONTHLY_CREATOR'
        ? 'Monthly Creator (9/mo)'
        : 'Free Studio Editor';

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.paper }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 14 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.eyebrow, { color: colors.vermilion }]}>ACCOUNT & PASSES</Text>
      <Text style={[styles.heading, { color: colors.ink }]}>{user?.name || 'Creator'}</Text>
      <Text style={[styles.email, { color: colors.muted }]}>{user?.email}</Text>

      {/* Segmented Switcher: Account | Billing & Alerts */}
      <View
        style={[
          styles.segmentWrap,
          { backgroundColor: colors.cream, borderColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeTab === 'account' && { backgroundColor: colors.vermilion },
          ]}
          onPress={() => {
            tapHaptic();
            setActiveTab('account');
          }}
        >
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === 'account' ? '#fff' : colors.inkSoft },
            ]}
          >
            Account
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeTab === 'billing' && { backgroundColor: colors.vermilion },
          ]}
          onPress={() => {
            tapHaptic();
            setActiveTab('billing');
            void loadBillingActivity();
          }}
        >
          <View style={styles.tabLabelRow}>
            <Text
              style={[
                styles.segmentText,
                { color: activeTab === 'billing' ? '#fff' : colors.inkSoft },
              ]}
            >
              Billing & Alerts
            </Text>
            {unreadCount > 0 && (
              <View
                style={[
                  styles.unreadBadge,
                  {
                    backgroundColor:
                      activeTab === 'billing' ? '#fff' : colors.vermilion,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.unreadText,
                    { color: activeTab === 'billing' ? colors.vermilion : '#fff' },
                  ]}
                >
                  {unreadCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {activeTab === 'account' ? (
        <>
          <LinearGradient
            colors={colors.glassGradient}
            style={[styles.planCard, { borderColor: colors.borderStrong }]}
          >
            <View style={styles.planTop}>
              <View>
                <Text style={[styles.planTag, { color: colors.muted }]}>CURRENT PLAN</Text>
                <Text style={[styles.planTitle, { color: colors.ink }]}>{planLabel}</Text>
                {user?.planRenewsAt && user.planTier !== 'NONE' && (
                  <Text style={[styles.renewNote, { color: colors.muted }]}>
                    {user.autoRenewCancelled
                      ? `Ends ${new Date(user.planRenewsAt).toLocaleDateString()} (Auto-renew off)`
                      : `Renews ${new Date(user.planRenewsAt).toLocaleDateString()}`}
                  </Text>
                )}
              </View>
              <View style={[styles.creditsBadge, { backgroundColor: colors.vermilionSoft }]}>
                <Text style={[styles.creditsNum, { color: colors.vermilion }]}>
                  {(user?.exportCredits ?? 0) + (user?.planExportsRemaining ?? 0)}
                </Text>
                <Text style={[styles.creditsLabel, { color: colors.vermilion }]}>
                  Downloads Left
                </Text>
              </View>
            </View>

            <View style={styles.breakdown}>
              <Text style={[styles.breakItem, { color: colors.inkSoft }]}>
                Plan Quota Remaining: {user?.planExportsRemaining ?? 0}
              </Text>
              <Text style={[styles.breakItem, { color: colors.inkSoft }]}>
                Single &amp; Referral Credits: {user?.exportCredits ?? 0}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                tapHaptic();
                setPaywallOpen(true);
              }}
            >
              <LinearGradient
                colors={colors.ctaGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.upgradeBtn}
              >
                <Ionicons name="sparkles" size={16} color="#fff" />
                <Text style={styles.upgradeText}>View Plans & Top Up Downloads</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>

          <View
            style={[
              styles.menuCard,
              { backgroundColor: colors.cream, borderColor: colors.border },
            ]}
          >
            <View style={styles.menuRow}>
              <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={20} color={colors.ink} />
              <Text style={[styles.menuText, { color: colors.ink }]}>Dark Mode</Text>
              <Switch
                value={isDark}
                onValueChange={(val) => {
                  tapHaptic();
                  setDark(val);
                }}
                trackColor={{ false: colors.paperWarm, true: colors.vermilion }}
                thumbColor="#fff"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.menuRow}>
              <Ionicons name="alarm-outline" size={20} color={colors.ink} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuText, { color: colors.ink }]}>
                  Daily 3D Reminders (3/day)
                </Text>
                <Text style={[styles.menuSub, { color: colors.muted }]}>
                  10:00 AM, 3:30 PM & 8:00 PM
                </Text>
              </View>
              <Switch
                value={dailyEnabled}
                onValueChange={handleToggleDailyReminders}
                trackColor={{ false: colors.paperWarm, true: colors.vermilion }}
                thumbColor="#fff"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.menuRow} onPress={handleEnablePush}>
              <Ionicons name="notifications-outline" size={20} color={colors.ink} />
              <Text style={[styles.menuText, { color: colors.ink }]}>
                Sync Push Notifications
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </TouchableOpacity>

            {user?.planTier && user.planTier !== 'NONE' && !user.autoRenewCancelled && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <TouchableOpacity style={styles.menuRow} onPress={handleCancelSubscription}>
                  <Ionicons name="close-circle-outline" size={20} color={colors.inkSoft} />
                  <Text style={[styles.menuText, { color: colors.ink }]}>
                    Cancel Subscription Auto-Renewal
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </TouchableOpacity>
              </>
            )}

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.menuRow} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={colors.vermilion} />
              <Text style={[styles.menuText, { color: colors.vermilion }]}>Sign Out</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.vermilion} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.helpCard,
              { backgroundColor: colors.cream, borderColor: colors.border },
            ]}
            onPress={() => {
              tapHaptic();
              void Linking.openURL('mailto:support@patra.media?subject=Patra%20App%20Support');
            }}
          >
            <View style={[styles.helpIconBox, { backgroundColor: colors.vermilionSoft }]}>
              <Ionicons name="help-buoy-outline" size={18} color={colors.vermilion} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.helpTitle, { color: colors.ink }]}>Need Help or Support?</Text>
              <Text style={[styles.helpEmail, { color: colors.vermilion }]}>support@patra.media</Text>
            </View>
            <Ionicons name="mail-outline" size={18} color={colors.muted} />
          </TouchableOpacity>
        </>
      ) : (
        <View style={{ gap: 20 }}>
          {/* In-App Subscription & Payment Notifications */}
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.ink }]}>
                Payment & Plan Alerts
              </Text>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllRead}>
                  <Text style={[styles.markReadText, { color: colors.vermilion }]}>
                    Mark all read
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {loadingActivity && notifications.length === 0 ? (
              <ActivityIndicator color={colors.vermilion} style={{ marginVertical: 16 }} />
            ) : notifications.length === 0 ? (
              <View
                style={[
                  styles.emptyBox,
                  { backgroundColor: colors.cream, borderColor: colors.border },
                ]}
              >
                <Ionicons name="notifications-off-outline" size={24} color={colors.muted} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  No billing alerts yet. Renewals, expirations, cancellations, and rewards appear here.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {notifications.map((n) => (
                  <View
                    key={n.id}
                    style={[
                      styles.alertCard,
                      {
                        backgroundColor: n.isRead ? colors.cream : colors.vermilionSoft,
                        borderColor: n.isRead ? colors.border : colors.vermilion,
                      },
                    ]}
                  >
                    <View style={styles.alertTop}>
                      <Text style={[styles.alertTitle, { color: colors.ink }]}>{n.title}</Text>
                      <Text style={[styles.alertDate, { color: colors.muted }]}>
                        {new Date(n.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={[styles.alertBody, { color: colors.inkSoft }]}>{n.body}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Payment History */}
          <View>
            <Text style={[styles.sectionTitle, { color: colors.ink, marginBottom: 10 }]}>
              Payment History ({payments.length})
            </Text>

            {payments.length === 0 ? (
              <View
                style={[
                  styles.emptyBox,
                  { backgroundColor: colors.cream, borderColor: colors.border },
                ]}
              >
                <Ionicons name="receipt-outline" size={24} color={colors.muted} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  No transactions yet.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {payments.map((p) => {
                  const statusColor =
                    p.status === 'SUCCEEDED'
                      ? colors.emerald
                      : p.status === 'FAILED'
                        ? '#C83E37'
                        : colors.marigold;
                  const statusBg =
                    p.status === 'SUCCEEDED'
                      ? colors.emeraldSoft
                      : p.status === 'FAILED'
                        ? 'rgba(200, 62, 55, 0.14)'
                        : colors.marigoldSoft;

                  return (
                    <View
                      key={p.id}
                      style={[
                        styles.payRow,
                        { backgroundColor: colors.cream, borderColor: colors.border },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.payPlan, { color: colors.ink }]}>{p.planName}</Text>
                        <Text style={[styles.payDate, { color: colors.muted }]}>
                          {new Date(p.createdAt).toLocaleString()}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text style={[styles.payAmount, { color: colors.ink }]}>
                          {p.currency === 'INR' ? `₹${p.amount}` : `$${p.amount}`}
                        </Text>
                        <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                          <Text style={[styles.statusText, { color: statusColor }]}>
                            {p.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      )}

      <PaywallModal
        visible={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        onUnlocked={() => {
          setPaywallOpen(false);
          void refreshUser();
          void loadBillingActivity();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 36 },
  eyebrow: { fontFamily: FONTS.semibold, fontSize: 11, letterSpacing: 1.4 },
  heading: { fontFamily: FONTS.bold, fontSize: 26, letterSpacing: -0.4, marginTop: 2 },
  email: { fontFamily: FONTS.regular, fontSize: 14, marginTop: 2, marginBottom: 16 },
  segmentWrap: {
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: 1,
    padding: 4,
    marginBottom: 18,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: { fontFamily: FONTS.semibold, fontSize: 13 },
  tabLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: { fontFamily: FONTS.bold, fontSize: 10 },
  planCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    gap: 14,
    marginBottom: 18,
    ...SHADOWS.paperCard,
  },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planTag: { fontFamily: FONTS.semibold, fontSize: 10, letterSpacing: 1.2 },
  planTitle: { fontFamily: FONTS.semibold, fontSize: 19, marginTop: 3 },
  renewNote: { fontFamily: FONTS.regular, fontSize: 11, marginTop: 2 },
  creditsBadge: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
  },
  creditsNum: { fontFamily: FONTS.bold, fontSize: 21 },
  creditsLabel: { fontFamily: FONTS.semibold, fontSize: 10 },
  breakdown: { gap: 4 },
  breakItem: { fontFamily: FONTS.regular, fontSize: 13 },
  upgradeBtn: {
    borderRadius: 999,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  upgradeText: { fontFamily: FONTS.semibold, color: '#fff', fontSize: 14 },
  menuCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  menuText: { flex: 1, fontFamily: FONTS.medium, fontSize: 15 },
  menuSub: { fontFamily: FONTS.regular, fontSize: 11, marginTop: 2 },
  divider: { height: 1 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontFamily: FONTS.semibold, fontSize: 16 },
  markReadText: { fontFamily: FONTS.semibold, fontSize: 12 },
  emptyBox: {
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  emptyText: { fontFamily: FONTS.regular, textAlign: 'center', fontSize: 13, lineHeight: 19 },
  alertCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  alertTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alertTitle: { fontFamily: FONTS.semibold, fontSize: 14 },
  alertDate: { fontFamily: FONTS.regular, fontSize: 11 },
  alertBody: { fontFamily: FONTS.regular, fontSize: 13, lineHeight: 18 },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  payPlan: { fontFamily: FONTS.semibold, fontSize: 14 },
  payDate: { fontFamily: FONTS.regular, fontSize: 11, marginTop: 2 },
  payAmount: { fontFamily: FONTS.bold, fontSize: 15 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontFamily: FONTS.bold, fontSize: 10 },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 14,
  },
  helpIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpTitle: { fontFamily: FONTS.semibold, fontSize: 13.5 },
  helpEmail: { fontFamily: FONTS.medium, fontSize: 12.5, marginTop: 1 },
});
