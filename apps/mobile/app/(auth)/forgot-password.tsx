import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiquidGlassWebView } from '../../src/components/LiquidGlassWebView';
import { api } from '../../src/lib/api';
import { FONTS, tapHaptic } from '../../src/theme';

const PATRA_LOGO = require('../../assets/patra-logo.png');

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);

  const sendOtp = async () => {
    if (!email.trim()) return Alert.alert('Enter email', 'Please enter your registered email address.');
    tapHaptic();
    setBusy(true);
    try {
      const res = await api.forgotPassword(email.trim());
      Alert.alert('OTP Sent', res.message);
      setStep('otp');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to send OTP');
    } finally {
      setBusy(false);
    }
  };

  const resetPwd = async () => {
    if (otp.trim().length !== 6 || newPassword.length < 6) {
      return Alert.alert('Invalid input', 'Enter the 6-digit OTP from your email and a 6+ char password.');
    }
    tapHaptic();
    setBusy(true);
    try {
      const res = await api.resetPassword(email.trim(), otp.trim(), newPassword);
      Alert.alert('Success', res.message);
      router.replace('/(auth)/login');
    } catch (err) {
      Alert.alert('Reset Failed', err instanceof Error ? err.message : 'Unable to reset password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <LiquidGlassWebView variant="forgot" style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 14, paddingBottom: Math.max(28, insets.bottom + 18) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backPill}>
            <Ionicons name="arrow-back" size={15} color="#FAF9F6" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.brandRow}>
            <Image source={PATRA_LOGO} style={styles.logo} />
            <Text style={styles.brandText}>03 / RECOVERY</Text>
          </View>
        </View>

        <View style={styles.centerStage}>
          <View style={styles.sheet}>
            <View style={styles.stepRow}>
              <View style={[styles.stepPill, step === 'email' && styles.stepPillActive]}>
                <Text style={[styles.stepText, step === 'email' && styles.stepTextActive]}>
                  01 Email
                </Text>
              </View>
              <View style={[styles.stepPill, step === 'otp' && styles.stepPillActive]}>
                <Text style={[styles.stepText, step === 'otp' && styles.stepTextActive]}>
                  02 Code &amp; Password
                </Text>
              </View>
            </View>

            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              {step === 'email'
                ? 'We will send a 6-digit verification code straight to your inbox.'
                : `Enter the 6-digit code sent to ${email} and choose your new password.`}
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputWrap, step === 'otp' && styles.inputReadonly]}>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#9A958C"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={step === 'email'}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {step === 'otp' && (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>6-Digit OTP Code</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      placeholder="123456"
                      placeholderTextColor="#9A958C"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otp}
                      onChangeText={setOtp}
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      placeholder="Min 6 characters"
                      placeholderTextColor="#9A958C"
                      secureTextEntry={!showPass}
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPass((v) => !v)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={showPass ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color="#6E6A63"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity
              activeOpacity={0.88}
              style={[styles.cta, busy && styles.ctaDisabled]}
              onPress={step === 'email' ? sendOtp : resetPwd}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#FAF9F6" />
              ) : (
                <Text style={styles.ctaText}>
                  {step === 'email' ? 'Send 6-Digit OTP' : 'Update Password'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0C0E14' },
  container: { flexGrow: 1, paddingHorizontal: 20 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  backText: { fontFamily: FONTS.semibold, fontSize: 13, color: '#FAF9F6' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  brandText: {
    fontFamily: FONTS.semibold,
    fontSize: 10.5,
    letterSpacing: 1.3,
    color: 'rgba(248, 246, 242, 0.82)',
  },
  centerStage: {
    flex: 1,
    justifyContent: 'center',
  },
  sheet: {
    borderRadius: 26,
    padding: 24,
    backgroundColor: 'rgba(250, 249, 246, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.36,
    shadowRadius: 28,
    elevation: 10,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  stepPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#ECE9E1',
    alignItems: 'center',
  },
  stepPillActive: {
    backgroundColor: '#111113',
  },
  stepText: {
    fontFamily: FONTS.semibold,
    fontSize: 11,
    color: '#7A766E',
  },
  stepTextActive: {
    color: '#FAF9F6',
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 25,
    letterSpacing: -0.4,
    color: '#111113',
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    color: '#6B675E',
    marginTop: 4,
    marginBottom: 18,
    lineHeight: 19,
  },
  field: { marginBottom: 14 },
  label: {
    fontFamily: FONTS.semibold,
    fontSize: 12.5,
    color: '#2A2926',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD9D0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputReadonly: {
    backgroundColor: '#EFEDE7',
  },
  input: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: '#111113',
    padding: 0,
  },
  cta: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#111113',
    marginTop: 6,
  },
  ctaDisabled: { opacity: 0.65 },
  ctaText: {
    fontFamily: FONTS.semibold,
    color: '#FAF9F6',
    fontSize: 15,
  },
});
