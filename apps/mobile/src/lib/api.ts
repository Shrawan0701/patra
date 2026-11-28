import AsyncStorage from '@react-native-async-storage/async-storage';
import { CurrencyCode, ExportRecord, PlanId, ProjectConfig, UserProfile } from '@patra/shared';

const DEFAULT_API_URL = __DEV__ ? 'http://localhost:4000' : 'https://api.patra.media';
const DEFAULT_STUDIO_URL = __DEV__ ? 'http://localhost:5173' : 'https://studio.patra.media';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL)
  .trim()
  .replace(/\/+$/, '');
export const STUDIO_URL = (process.env.EXPO_PUBLIC_STUDIO_URL || DEFAULT_STUDIO_URL)
  .trim()
  .replace(/\/+$/, '');

const TOKEN_KEY = 'patra_auth_token';

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setStoredToken(token: string | null): Promise<void> {
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export class ApiError extends Error {
  status: number;
  code?: string;
  data?: unknown;

  constructor(message: string, status: number, code?: string, data?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      json.error || `Request failed (${res.status})`,
      res.status,
      json.code,
      json
    );
  }
  return json as T;
}

export const api = {
  register: (payload: { name: string; email: string; password: string; referralCode?: string }) =>
    request<{ token: string; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  me: () => request<{ user: UserProfile }>('/api/auth/me'),

  savePushToken: (expoPushToken: string) =>
    request<{ ok: boolean }>('/api/auth/push-token', {
      method: 'POST',
      body: JSON.stringify({ expoPushToken }),
    }),

  forgotPassword: (email: string) =>
    request<{ ok: boolean; message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (email: string, otp: string) =>
    request<{ ok: boolean }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  resetPassword: (email: string, otp: string, newPassword: string) =>
    request<{ ok: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    }),

  listProjects: () => request<{ projects: (ProjectConfig & { updatedAt: string })[] }>('/api/projects'),

  createProject: (project: ProjectConfig) =>
    request<{ project: ProjectConfig & { updatedAt: string } }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    }),

  getProject: (id: string) =>
    request<{ project: ProjectConfig & { updatedAt: string } }>(`/api/projects/${id}`),

  updateProject: (id: string, project: ProjectConfig) =>
    request<{ project: ProjectConfig & { updatedAt: string } }>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    }),

  deleteProject: (id: string) =>
    request<{ ok: boolean }>(`/api/projects/${id}`, { method: 'DELETE' }),

  authorizeExport: (payload: {
    projectId?: string;
    projectTitle: string;
    aspectRatio: string;
    usesPremiumFeatures?: boolean;
  }) =>
    request<{
      authorized: boolean;
      resolution: '1080p' | '4K';
      record: ExportRecord;
      quota: {
        exportCredits: number;
        planTier: UserProfile['planTier'];
        planExportsRemaining: number;
      };
    }>('/api/exports/authorize', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  exportHistory: () => request<{ exports: ExportRecord[] }>('/api/exports/history'),

  deleteExport: (id: string) =>
    request<{ ok: boolean }>(`/api/exports/${id}`, { method: 'DELETE' }),

  createCheckout: (payload: {
    planId: PlanId;
    currency: CurrencyCode;
    projectId?: string;
    returnUrl?: string;
  }) =>
    request<{
      paymentId: string;
      mode: 'dodo' | 'dev_sandbox';
      checkoutUrl: string;
      amount: number;
      currency: CurrencyCode;
    }>('/api/payments/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getPaymentStatus: (paymentId: string) =>
    request<{
      status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
      planId: string;
      planName: string;
      amount: number;
      currency: CurrencyCode;
      user: UserProfile | null;
    }>(`/api/payments/status/${encodeURIComponent(paymentId)}`),

  devConfirmPayment: (paymentId: string) =>
    request<{ ok: boolean; user: UserProfile }>('/api/payments/dev-confirm', {
      method: 'POST',
      body: JSON.stringify({ paymentId }),
    }),

  cancelSubscription: () =>
    request<{ ok: boolean; message: string }>('/api/payments/cancel-subscription', {
      method: 'POST',
    }),

  getBillingActivity: () =>
    request<{
      unreadCount: number;
      payments: {
        id: string;
        planId: string;
        planName: string;
        amount: number;
        currency: string;
        status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
        createdAt: string;
      }[];
      notifications: {
        id: string;
        type: string;
        title: string;
        body: string;
        isRead: boolean;
        createdAt: string;
      }[];
    }>('/api/payments/activity'),

  markNotificationsRead: () =>
    request<{ ok: boolean }>('/api/payments/notifications/read-all', {
      method: 'POST',
    }),

  getReferralStats: () =>
    request<{
      referralCode: string;
      exportCredits: number;
      totalReferred: number;
      paidReferrals: number;
      freeExportsEarned: number;
      shareMessage: string;
      friends: { id: string; name: string; hasPaid: boolean; joinedAt: string }[];
    }>('/api/referrals/me'),
};
