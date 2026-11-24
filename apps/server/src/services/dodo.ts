import crypto from 'crypto';
import { CurrencyCode, PlanId, getPlanById } from '@patra/shared';

function getDodoBaseUrl() {
  return process.env.DODO_ENVIRONMENT === 'live_mode'
    ? 'https://live.dodopayments.com'
    : 'https://test.dodopayments.com';
}

function resolveProductId(planId: PlanId, currency: CurrencyCode): string {
  const map: Record<string, string | undefined> = {
    SINGLE_PASS_INR: process.env.DODO_PRODUCT_SINGLE_INR,
    SINGLE_PASS_USD: process.env.DODO_PRODUCT_SINGLE_USD,
    MONTHLY_CREATOR_INR: process.env.DODO_PRODUCT_MONTHLY_INR,
    MONTHLY_CREATOR_USD: process.env.DODO_PRODUCT_MONTHLY_USD,
    YEARLY_ALL_ACCESS_INR: process.env.DODO_PRODUCT_YEARLY_INR,
    YEARLY_ALL_ACCESS_USD: process.env.DODO_PRODUCT_YEARLY_USD,
  };
  return map[`${planId}_${currency}`] || `patra_${planId.toLowerCase()}_${currency.toLowerCase()}`;
}

export interface CheckoutSessionResult {
  mode: 'dodo' | 'dev_sandbox';
  sessionId: string;
  checkoutUrl: string;
}

export async function createDodoCheckoutSession(params: {
  paymentId: string;
  planId: PlanId;
  currency: CurrencyCode;
  userId: string;
  userEmail: string;
  userName: string;
  projectId?: string;
  returnUrl?: string;
}): Promise<CheckoutSessionResult> {
  const apiKey = process.env.DODO_API_KEY;
  const plan = getPlanById(params.planId);
  if (!plan) throw new Error('Invalid plan');

  if (!apiKey) {
    return {
      mode: 'dev_sandbox',
      sessionId: `dev_sess_${params.paymentId}`,
      checkoutUrl: '',
    };
  }

  const baseReturnUrl =
    params.returnUrl && /^https?:\/\//i.test(params.returnUrl)
      ? params.returnUrl
      : process.env.APP_RETURN_URL || 'patra://payment-success';
  const sep = baseReturnUrl.includes('?') ? '&' : '?';
  const finalReturnUrl = `${baseReturnUrl}${sep}paymentId=${encodeURIComponent(params.paymentId)}&checkout=return`;
  const productId = resolveProductId(params.planId, params.currency);

  const res = await fetch(`${getDodoBaseUrl()}/checkouts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: {
        email: params.userEmail,
        name: params.userName,
      },
      billing_currency: params.currency,
      minimal_address: true,
      return_url: finalReturnUrl,
      metadata: {
        paymentId: params.paymentId,
        userId: params.userId,
        planId: params.planId,
        projectId: params.projectId || '',
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Dodo checkout creation failed (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { session_id: string; checkout_url: string };
  return {
    mode: 'dodo',
    sessionId: data.session_id,
    checkoutUrl: data.checkout_url,
  };
}

export async function cancelDodoSubscription(subscriptionId: string): Promise<void> {
  const apiKey = process.env.DODO_API_KEY;
  if (!apiKey) {
    return; // Local dev sandbox mode
  }

  const res = await fetch(`${getDodoBaseUrl()}/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cancel_at_next_billing_date: true,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Dodo subscription cancellation failed (${res.status}): ${errText}`);
  }
}

export function verifyDodoWebhookSignature(
  rawBody: string,
  headers: Record<string, string | string[] | undefined>
): boolean {
  const secret = process.env.DODO_WEBHOOK_SECRET;
  if (!secret) return true;

  const msgId = String(headers['webhook-id'] || '');
  const timestamp = String(headers['webhook-timestamp'] || '');
  const signatureHeader = String(headers['webhook-signature'] || '');
  if (!msgId || !timestamp || !signatureHeader) return false;

  // Reject replay webhooks older than 5 minutes
  const tsSeconds = Number(timestamp);
  if (!Number.isFinite(tsSeconds) || Math.abs(Math.floor(Date.now() / 1000) - tsSeconds) > 300) {
    return false;
  }

  const signedContent = `${msgId}.${timestamp}.${rawBody}`;
  const keyBytes = secret.startsWith('whsec_')
    ? Buffer.from(secret.slice(6), 'base64')
    : Buffer.from(secret);
  const expected = crypto.createHmac('sha256', keyBytes).update(signedContent).digest('base64');
  const expectedBuf = Buffer.from(expected, 'utf8');

  return signatureHeader
    .split(' ')
    .map((s) => s.split(',')[1] || s)
    .some((sig) => {
      const sigBuf = Buffer.from(sig, 'utf8');
      return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf);
    });
}
