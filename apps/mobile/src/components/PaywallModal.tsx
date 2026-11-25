import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CurrencyCode, PRICING_PLANS, PlanId, detectRegionalCurrency, formatPlanPrice } from '@patra/shared';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { API_URL, api } from '../lib/api';
import { SHADOWS, successHaptic, tapHaptic } from '../theme';

const PENDING_PAYMENT_KEY = 'patra_pending_payment_id';

type VerifyState = 'idle' | 'verifying' | 'succeeded' | 'pending_check' | 'failed';

interface Props {
  visible: boolean;
  projectId?: string;
  subscriptionOnly?: boolean;
  onClose: () => void;
  onUnlocked: () => void;
}

export function PaywallModal({ visible, projectId, subscriptionOnly = false, onClose, onUnlocked }: Props) {
  const { colors } = useTheme();
  const { refreshUser } = useAuth();
  const [currency, setCurrency] = useState<CurrencyCode>(() => detectRegionalCurrency());
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('MONTHLY_CREATOR');
  const [busy, setBusy] = useState(false);
  const [verifyState, setVerifyState] = useState<VerifyState>('idle');
  const [verifyMessage, setVerifyMessage] = useState('');
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const [pendingRecoveryId, setPendingRecoveryId] = useState<string | null>(null);

  const pollEpochRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      pollEpochRef.current += 1;
    };
  }, []);

  const verifyPayment = useCallback(
    async (paymentId: string, maxAttempts = 10) => {
      const epoch = ++pollEpochRef.current;
      setActivePaymentId(paymentId);
      setVerifyState('verifying');
      setVerifyMessage('Confirming your payment securely...');

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (!mountedRef.current || pollEpochRef.current !== epoch) return;
        try {
          const res = await api.getPaymentStatus(paymentId);
          if (!mountedRef.current || pollEpochRef.current !== epoch) return;

          if (res.status === 'SUCCEEDED') {
            await AsyncStorage.removeItem(PENDING_PAYMENT_KEY);
            setPendingRecoveryId(null);
            await refreshUser();
            if (!mountedRef.current || pollEpochRef.current !== epoch) return;
            successHaptic();
            setVerifyState('succeeded');
            setVerifyMessage(`${res.planName} is active on your account.`);
            return;
          }

          if (res.status === 'FAILED') {
            await AsyncStorage.removeItem(PENDING_PAYMENT_KEY);
            setPendingRecoveryId(null);
            setVerifyState('failed');
            setVerifyMessage('Payment was declined or cancelled. No charges were applied.');
            return;
          }
        } catch {
          // Transient error while webhook settles; continue polling
        }

        if (attempt < maxAttempts - 1) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }

      if (!mountedRef.current || pollEpochRef.current !== epoch) return;
      setVerifyState('pending_check');
      setVerifyMessage(
        'Checkout closed before confirmation. If you completed payment via UPI or card, tap Check Status Again.'
      );
    },
    [refreshUser]
  );

  useEffect(() => {
    if (!visible) {
      pollEpochRef.current += 1;
      setVerifyState('idle');
      setVerifyMessage('');
      setBusy(false);
      return;
    }

    void fetch(`${API_URL}/api/payments/plans`)
      .then((r) => r.json())
      .then((data: { detectedCurrency?: CurrencyCode | null }) => {
        if (data?.detectedCurrency) setCurrency(data.detectedCurrency);
      })
      .catch(() => {});

    // Check for any unverified payment from an interrupted checkout / UPI switch
    void AsyncStorage.getItem(PENDING_PAYMENT_KEY)
      .then(async (savedId) => {
        if (!savedId || !mountedRef.current) return;
        try {
          const res = await api.getPaymentStatus(savedId);
          if (!mountedRef.current) return;
          if (res.status === 'SUCCEEDED') {
            await AsyncStorage.removeItem(PENDING_PAYMENT_KEY);
            await refreshUser();
            successHaptic();
            setActivePaymentId(savedId);
            setVerifyState('succeeded');
            setVerifyMessage(`${res.planName} is confirmed and active!`);
          } else if (res.status === 'FAILED') {
            await AsyncStorage.removeItem(PENDING_PAYMENT_KEY);
            setPendingRecoveryId(null);
          } else {
            setPendingRecoveryId(savedId);
          }
        } catch {
          // Ignore transient startup check errors
        }
      })
      .catch(() => {});
  }, [visible, refreshUser]);

  useEffect(() => {
    if (!visible || verifyState !== 'pending_check' || !activePaymentId) return;
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void verifyPayment(activePaymentId, 4);
      }
    });
    return () => sub.remove();
  }, [visible, verifyState, activePaymentId, verifyPayment]);

  const handleCheckout = async () => {
    if (busy || verifyState === 'verifying') return;
    tapHaptic();
    setBusy(true);
    try {
      const mobileReturnUrl = `${API_URL}/api/payments/mobile-return`;
      const session = await api.createCheckout({
        planId: selectedPlan,
        currency,
        projectId,
        returnUrl: mobileReturnUrl,
      });

      if (session.mode === 'dodo' && session.checkoutUrl) {
        await AsyncStorage.setItem(PENDING_PAYMENT_KEY, session.paymentId);
        setPendingRecoveryId(session.paymentId);
        try {
          await WebBrowser.openAuthSessionAsync(session.checkoutUrl, 'patra://payment-return');
        } catch {
          await WebBrowser.openBrowserAsync(session.checkoutUrl);
        }
        await verifyPayment(session.paymentId, 10);
      } else {
        Alert.alert(
          'Dodo Payments Sandbox',
          `Confirm local test purchase (${currency} ${session.amount})?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Complete Payment',
              onPress: async () => {
                await api.devConfirmPayment(session.paymentId);
                await refreshUser();
                successHaptic();
                onUnlocked();
              },
            },
          ]
        );
      }
    } catch (err) {
      Alert.alert('Checkout Error', err instanceof Error ? err.message : 'Unable to start payment');
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.paper }]}>
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[styles.eyebrow, { color: colors.vermilion }]}>
              {subscriptionOnly ? 'PRO STUDIO PASS' : 'PATRA STUDIO PASS'}
            </Text>
            <Text style={[styles.title, { color: colors.ink }]}>
              {subscriptionOnly ? 'Unlock Wax Seal & Atmosphere' : 'Unlock Your Download'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.cream, borderColor: colors.border }]}
          >
            <Ionicons name="close" size={22} color={colors.ink} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {subscriptionOnly ? (
            <Text style={[{ fontSize: 13, marginBottom: 4, lineHeight: 18, color: colors.muted }]}>
              Wax-Seal Envelopes &amp; 3D Atmosphere require Monthly Creator or Yearly All-Access.
            </Text>
          ) : null}
          {PRICING_PLANS.filter((p) => !subscriptionOnly || p.id !== 'SINGLE_PASS').map((plan) => {
            const active = selectedPlan === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                activeOpacity={0.9}
                style={[
                  styles.planCard,
                  { backgroundColor: colors.cream, borderColor: colors.border },
                  active && { borderColor: colors.vermilion, backgroundColor: colors.vermilionSoft },
                ]}
                onPress={() => {
                  tapHaptic();
                  setSelectedPlan(plan.id);
                }}
              >
                <View style={styles.planTop}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.badgeRow}>
                      <Text style={[styles.planName, { color: colors.ink }]}>{plan.name}</Text>
                      {plan.badge ? (
                        <View style={[styles.badge, { backgroundColor: colors.marigoldSoft }]}>
                          <Text style={[styles.badgeText, { color: colors.marigold }]}>
                            {plan.badge}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.planDesc, { color: colors.muted }]}>
                      {plan.description}
                    </Text>
                  </View>
                  <Text style={[styles.planPrice, { color: colors.vermilion }]}>
                    {formatPlanPrice(plan, currency)}
                  </Text>
                </View>

                <View style={styles.featureList}>
                  {plan.features.map((feat) => (
                    <View key={feat} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.vermilion} />
                      <Text style={[styles.featureText, { color: colors.inkSoft }]}>{feat}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={[styles.referBox, { backgroundColor: colors.marigoldSoft }]}>
            <Ionicons name="gift-outline" size={18} color={colors.marigold} />
            <Text style={[styles.referText, { color: colors.inkSoft }]}>
              Tip: Share your referral code in the Refer tab. Every friend who pays earns you 1 free 4K download.
            </Text>
          </View>

          {verifyState === 'idle' && pendingRecoveryId ? (
            <TouchableOpacity
              style={[
                styles.verifyCard,
                { backgroundColor: colors.cream, borderColor: colors.border },
              ]}
              onPress={() => void verifyPayment(pendingRecoveryId, 6)}
            >
              <Ionicons name="refresh-circle" size={20} color={colors.vermilion} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.verifyTitle, { color: colors.ink }]}>
                  Recent checkout pending
                </Text>
                <Text style={[styles.verifyBody, { color: colors.muted }]}>
                  Already paid? Tap to verify payment status.
                </Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {verifyState !== 'idle' ? (
            <View
              style={[
                styles.verifyCard,
                {
                  backgroundColor: colors.cream,
                  borderColor:
                    verifyState === 'succeeded'
                      ? '#2E5A44'
                      : verifyState === 'failed'
                      ? '#9E3B2B'
                      : colors.border,
                },
              ]}
            >
              {verifyState === 'verifying' ? (
                <ActivityIndicator color={colors.vermilion} />
              ) : verifyState === 'succeeded' ? (
                <Ionicons name="checkmark-circle" size={24} color="#2E5A44" />
              ) : verifyState === 'failed' ? (
                <Ionicons name="close-circle" size={24} color="#9E3B2B" />
              ) : (
                <Ionicons name="time-outline" size={24} color={colors.marigold} />
              )}
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={[styles.verifyTitle, { color: colors.ink }]}>
                  {verifyState === 'verifying'
                    ? 'Verifying Payment'
                    : verifyState === 'succeeded'
                    ? 'Payment Confirmed!'
                    : verifyState === 'failed'
                    ? 'Payment Not Completed'
                    : 'Waiting for Bank Confirmation'}
                </Text>
                <Text style={[styles.verifyBody, { color: colors.inkSoft }]}>
                  {verifyMessage}
                </Text>
                {verifyState === 'succeeded' ? (
                  <TouchableOpacity
                    style={[styles.verifyActionBtn, { backgroundColor: '#2E5A44' }]}
                    onPress={() => {
                      setVerifyState('idle');
                      onUnlocked();
                    }}
                  >
                    <Text style={styles.verifyActionText}>Continue</Text>
                  </TouchableOpacity>
                ) : verifyState === 'pending_check' && activePaymentId ? (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <TouchableOpacity
                      style={[styles.verifyActionBtn, { backgroundColor: colors.vermilion }]}
                      onPress={() => void verifyPayment(activePaymentId, 8)}
                    >
                      <Text style={styles.verifyActionText}>Check Status Again</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.verifyActionBtn,
                        { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border },
                      ]}
                      onPress={() => setVerifyState('idle')}
                    >
                      <Text style={[styles.verifyActionText, { color: colors.ink }]}>Dismiss</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.footer,
            { backgroundColor: colors.cream, borderTopColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.ctaBtn,
              { backgroundColor: colors.vermilion, opacity: busy || verifyState === 'verifying' ? 0.7 : 1 },
            ]}
            onPress={handleCheckout}
            disabled={busy || verifyState === 'verifying'}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaText}>Continue with Payments</Text>
            )}
          </TouchableOpacity>
          <Text style={[styles.secureNote, { color: colors.muted }]}>
            Secured global checkout · UPI, Cards, Apple Pay
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 22 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  eyebrow: { fontSize: 11, fontWeight: '600', letterSpacing: 1.4 },
  title: { fontSize: 24, fontWeight: '600', letterSpacing: -0.3, marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  currencyLabel: { fontSize: 13, fontWeight: '500' },
  currencyToggle: { flexDirection: 'row', borderRadius: 999, padding: 3 },
  currencyBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  currencyText: { fontSize: 12, fontWeight: '600' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  planCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    ...SHADOWS.paperCard,
  },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  planName: { fontSize: 16, fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  planDesc: { fontSize: 12, marginTop: 4 },
  planPrice: { fontSize: 19, fontWeight: '700' },
  featureList: { marginTop: 12, gap: 6 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, flex: 1 },
  referBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    marginTop: 4,
  },
  referText: { flex: 1, fontSize: 12, fontWeight: '500', lineHeight: 17 },
  footer: { padding: 20, paddingBottom: 32, borderTopWidth: 1 },
  ctaBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  secureNote: { textAlign: 'center', fontSize: 11, marginTop: 8 },
  verifyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  verifyTitle: { fontSize: 14, fontWeight: '700' },
  verifyBody: { fontSize: 12.5, lineHeight: 18 },
  verifyActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
    alignSelf: 'flex-start',
  },
  verifyActionText: { color: '#fff', fontSize: 12.5, fontWeight: '600' },
});
