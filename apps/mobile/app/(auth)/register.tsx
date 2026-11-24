import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { AuthWebGLHero } from '../../src/components/AuthBackdrop';
import { useAuth } from '../../src/context/AuthContext';
import { FONTS, tapHaptic } from '../../src/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [busy, setBusy] = useState(false);

  const handleRegister = async () => {
    if (name.trim().length < 2 || !email.trim() || password.length < 6) {
      Alert.alert('Check your details', 'Enter your name, valid email, and a 6+ character password.');
      return;
    }
    tapHaptic();
    setBusy(true);
    try {
      await signUp(name.trim(), email.trim(), password, referralCode.trim() || undefined);
      router.replace('/(tabs)/explore');
    } catch (err) {
      Alert.alert('Registration Failed', err instanceof Error ? err.message : 'Unable to register');
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <AuthWebGLHero
          variant="register"
          height={190}
          compact
          topInset={insets.top}
          eyebrow="02 / NEW CREATOR"
          headline="Crafted to be opened, kept, and replayed."
        />

        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(30, insets.bottom + 18) },
          ]}
        >
          <View style={styles.sheetHandle} />

          <Text style={styles.kicker}>CREATE ACCOUNT</Text>
          <Text style={styles.title}>Start in the studio</Text>
          <Text style={styles.subtitle}>
            Design in 3D and 1-page cards free.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Aarav Sharma"
                placeholderTextColor="#9A958C"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#9A958C"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Min 6 characters"
                placeholderTextColor="#9A958C"
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
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

          <View style={styles.field}>
            <Text style={styles.label}>Friend Referral Code (Optional)</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="e.g. PATRA-ARJU8A"
                placeholderTextColor="#9A958C"
                autoCapitalize="characters"
                value={referralCode}
                onChangeText={setReferralCode}
              />
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            style={[styles.cta, busy && styles.ctaDisabled]}
            onPress={handleRegister}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#FAF9F6" />
            ) : (
              <Text style={styles.ctaText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Already have an account? </Text>
            <Link href="/(auth)/login" style={styles.bottomLink}>
              Sign in
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F7F4' },
  scrollContent: { flexGrow: 1 },
  sheet: {
    flexGrow: 1,
    backgroundColor: '#F8F7F4',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -26,
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DEDAD0',
    marginBottom: 14,
  },
  kicker: {
    fontFamily: FONTS.semibold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: '#6E6A63',
    marginBottom: 4,
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
  field: { marginBottom: 13 },
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
    marginTop: 8,
  },
  ctaDisabled: { opacity: 0.65 },
  ctaText: {
    fontFamily: FONTS.semibold,
    color: '#FAF9F6',
    fontSize: 15,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  bottomText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#6B675E',
  },
  bottomLink: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: '#111113',
    textDecorationLine: 'underline',
  },
});
