import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { UserProfile } from '@patra/shared';
import { api, getStoredToken, setStoredToken } from '../lib/api';
import {
  isDailyNotificationsEnabled,
  scheduleDailyProductNotifications,
} from '../lib/dailyNotifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  hasSeenOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, referralCode?: string) => Promise<void>;
  signOut: () => Promise<void>;
  registerPushNotifications: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const ONBOARDING_KEY = 'patra_onboarding_done';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  const registerPushNotifications = async (): Promise<string | null> => {
    if (Platform.OS === 'web') return null;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return null;

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      const token = tokenData.data;
      if (token) {
        await api.savePushToken(token).catch(() => {});
      }
      if (await isDailyNotificationsEnabled()) {
        void scheduleDailyProductNotifications();
      }
      return token;
    } catch {
      return null;
    }
  };

  const refreshUser = async () => {
    try {
      const { user: fresh } = await api.me();
      setUser(fresh);
    } catch {
      setUser(null);
      await setStoredToken(null);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
        setHasSeenOnboarding(seen === '1');
        const token = await getStoredToken();
        if (token) {
          await refreshUser();
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    setHasSeenOnboarding(true);
  };

  const signIn = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    await setStoredToken(res.token);
    setUser(res.user);
    void registerPushNotifications();
  };

  const signUp = async (name: string, email: string, password: string, referralCode?: string) => {
    const res = await api.register({ name, email, password, referralCode });
    await setStoredToken(res.token);
    setUser(res.user);
    void registerPushNotifications();
  };

  const signOut = async () => {
    await setStoredToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        hasSeenOnboarding,
        completeOnboarding,
        refreshUser,
        signIn,
        signUp,
        signOut,
        registerPushNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
