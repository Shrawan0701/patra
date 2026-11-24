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

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    tapHaptic();
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)/explore');
    } catch (err) {
      Alert.alert('Sign In Failed', err instanceof Error ? err.message : 'Unable to sign in');
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
          variant="login"
          height={275}
          topInset={insets.top}
          eyebrow="01 / STUDIO ACCESS"
          headline="Sculptural invitations, folded in light."
          caption="Synced drafts, wax seals, and single-page cards ready to download."
        />

        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(32, insets.bottom + 20) },
          ]}
        >
          <View style={styles.sheetHandle} />

          <Text style={styles.kicker}>SIGN IN</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Enter your email and password to open your studio.</Text>

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
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
                Forgot password?
              </Link>
            </View>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
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

          <TouchableOpacity
            activeOpacity={0.88}
            style={[styles.cta, busy && styles.ctaDisabled]}
            onPress={handleLogin}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#FAF9F6" />
            ) : (
              <Text style={styles.ctaText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>New to Patra? </Text>
            <Link href="/(auth)/register" style={styles.bottomLink}>
              Create an account
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
    marginTop: -28,
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DEDAD0',
    marginBottom: 18,
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
    fontSize: 28,
    letterSpacing: -0.5,
    color: '#111113',
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    color: '#6B675E',
    marginTop: 4,
    marginBottom: 22,
    lineHeight: 19,
  },
  field: { marginBottom: 16 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
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
    paddingVertical: 13,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: '#111113',
    padding: 0,
  },
  forgotLink: {
    fontFamily: FONTS.semibold,
    fontSize: 12.5,
    color: '#111113',
    textDecorationLine: 'underline',
    marginBottom: 6,
  },
  cta: {
    borderRadius: 12,
    paddingVertical: 16,
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
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
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
