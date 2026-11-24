import { CurrencyCode, ExportRecord, PlanId, PricingPlan, ProjectConfig, UserProfile } from '@patra/shared';

function normalizeBaseUrl(raw: string | undefined, fallback: string): string {
  const trimmed = (raw || '').trim().replace(/\/+$/, '');
  if (!trimmed) return fallback;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export const API_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL, 'http://localhost:4000');
export const STUDIO_URL = normalizeBaseUrl(import.meta.env.VITE_STUDIO_URL, 'http://localhost:5173');

const TOKEN_KEY = 'patra_web_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage restriction
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
  const token = getStoredToken();
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

  getPlans: () =>
    request<{ plans: PricingPlan[]; detectedCurrency: CurrencyCode | null }>('/api/payments/plans'),

  getPaymentStatus: (paymentId: string) =>
    request<{
      status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
      planId: string;
      planName: string;
      amount: number;
      currency: string;
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
