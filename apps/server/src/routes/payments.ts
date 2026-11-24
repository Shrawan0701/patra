import { Request, Response, Router } from 'express';
import { CurrencyCode, PRICING_PLANS, PlanId, getPlanById } from '@patra/shared';
import { prisma } from '../lib/prisma';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import {
  cancelDodoSubscription,
  createDodoCheckoutSession,
  verifyDodoWebhookSignature,
} from '../services/dodo';
import { sendExpoPush } from '../services/push';

export const paymentsRouter = Router();

paymentsRouter.get('/plans', (req, res) => {
  const rawCountry = String(
    req.headers['cf-ipcountry'] ||
      req.headers['x-vercel-ip-country'] ||
      req.headers['x-country-code'] ||
      req.headers['cloudfront-viewer-country'] ||
      ''
  )
    .trim()
    .toUpperCase();

  const detectedCurrency: CurrencyCode | null = rawCountry
    ? rawCountry === 'IN'
      ? 'INR'
      : 'USD'
    : null;

  res.json({ plans: PRICING_PLANS, detectedCurrency });
});

async function createInAppNotification(
  userId: string,
  type: string,
  title: string,
  body: string
) {
  try {
    await prisma.inAppNotification.create({
      data: { userId, type, title, body },
    });
  } catch (err) {
    console.error('[InAppNotification] Failed to create:', err);
  }
}

paymentsRouter.get('/activity', requireAuth, async (req: AuthedRequest, res) => {
  const [payments, notifications] = await Promise.all([
    prisma.payment.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.inAppNotification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  res.json({
    unreadCount,
    payments: payments.map((p) => ({
      id: p.id,
      planId: p.planId,
      planName: getPlanById(p.planId as PlanId)?.name || p.planId,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    })),
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    })),
  });
});

paymentsRouter.post('/notifications/read-all', requireAuth, async (req: AuthedRequest, res) => {
  await prisma.inAppNotification.updateMany({
    where: { userId: req.userId, isRead: false },
    data: { isRead: true },
  });
  res.json({ ok: true });
});

interface DodoWebhookEvent {
  type?: string;
  data?: {
    payment_id?: string;
    subscription_id?: string;
    customer?: { customer_id?: string; email?: string };
    next_billing_date?: string;
    total_amount?: number;
    currency?: string;
    metadata?: {
      paymentId?: string;
      userId?: string;
      planId?: string;
    };
  };
}

function getNextRenewalDate(planId: PlanId, dodoNextBilling?: string): Date {
  if (dodoNextBilling) {
    const parsed = new Date(dodoNextBilling);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const days = planId === 'YEARLY_ALL_ACCESS' ? 365 : 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function rewardReferrerIfEligible(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  paymentId: string,
  payerUserId: string
) {
  const payment = await tx.payment.findUnique({ where: { id: paymentId } });
  const payer = await tx.user.findUnique({ where: { id: payerUserId } });
  if (!payment || !payer?.referredById || payment.referralRewarded) return null;

  await tx.user.update({
    where: { id: payer.referredById },
    data: { exportCredits: { increment: 1 } },
  });
  await tx.payment.update({
    where: { id: payment.id },
    data: { referralRewarded: true },
  });

  const referrer = await tx.user.findUnique({ where: { id: payer.referredById } });
  return {
    referrerId: referrer?.id,
    referrerToken: referrer?.expoPushToken,
    payerName: payer.name,
  };
}

async function fulfillInitialPayment(
  paymentId: string,
  opts?: { dodoPaymentId?: string; dodoCustomerId?: string; dodoSubscriptionId?: string; nextBillingDate?: string }
) {
  const existing = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!existing) return null;

  const plan = getPlanById(existing.planId as PlanId);
  if (!plan) return existing;

  const result = await prisma.$transaction(async (tx) => {
    // Atomically claim the payment row so concurrent Dodo webhooks never double-fulfill
    const claimed = await tx.payment.updateMany({
      where: { id: existing.id, status: { not: 'SUCCEEDED' } },
      data: {
        status: 'SUCCEEDED',
        ...(opts?.dodoPaymentId ? { dodoPaymentId: opts.dodoPaymentId } : {}),
      },
    });

    if (claimed.count === 0) {
      if (opts?.dodoSubscriptionId || opts?.dodoCustomerId) {
        const cur = await tx.user.findUnique({ where: { id: existing.userId } });
        if (cur) {
          await tx.user.update({
            where: { id: cur.id },
            data: {
              ...(opts.dodoCustomerId && !cur.dodoCustomerId
                ? { dodoCustomerId: opts.dodoCustomerId }
                : {}),
              ...(opts.dodoSubscriptionId && !cur.dodoSubscriptionId
                ? { dodoSubscriptionId: opts.dodoSubscriptionId }
                : {}),
            },
          });
        }
      }
      const latest = await tx.payment.findUnique({ where: { id: existing.id } });
      return {
        alreadyFulfilled: true,
        updatedPayment: latest ?? existing,
        referralInfo: null,
        previousSubscriptionId: null as string | null,
        nextQuota: plan.exportQuota,
        nextRenewsAt: null as Date | null,
      };
    }

    const updatedPayment = await tx.payment.findUnique({ where: { id: existing.id } });

    let previousSubscriptionId: string | null = null;
    let nextQuota = plan.exportQuota;
    let nextRenewsAt: Date | null = null;

    if (plan.id === 'SINGLE_PASS') {
      await tx.user.update({
        where: { id: existing.userId },
        data: {
          exportCredits: { increment: 1 },
          ...(opts?.dodoCustomerId ? { dodoCustomerId: opts.dodoCustomerId } : {}),
        },
      });
    } else if (plan.id === 'MONTHLY_CREATOR' || plan.id === 'YEARLY_ALL_ACCESS') {
      const currentUser = await tx.user.findUnique({ where: { id: existing.userId } });
      const now = Date.now();
      previousSubscriptionId =
        currentUser?.dodoSubscriptionId && currentUser.dodoSubscriptionId !== opts?.dodoSubscriptionId
          ? currentUser.dodoSubscriptionId
          : null;

      const baseExpiry = getNextRenewalDate(plan.id, opts?.nextBillingDate);
      const remainingMs =
        currentUser?.planTier !== 'NONE' &&
        currentUser?.planRenewsAt &&
        currentUser.planRenewsAt.getTime() > now
          ? currentUser.planRenewsAt.getTime() - now
          : 0;
      nextRenewsAt = new Date(baseExpiry.getTime() + remainingMs);

      const carryExports =
        currentUser &&
        currentUser.planTier !== 'NONE' &&
        currentUser.planExportsRemaining > 0 &&
        (!currentUser.planRenewsAt || currentUser.planRenewsAt.getTime() > now)
          ? currentUser.planExportsRemaining
          : 0;
      nextQuota = plan.exportQuota + carryExports;

      await tx.user.update({
        where: { id: existing.userId },
        data: {
          planTier: plan.id,
          planExportsRemaining: nextQuota,
          planRenewsAt: nextRenewsAt,
          autoRenewCancelled: false,
          ...(opts?.dodoCustomerId ? { dodoCustomerId: opts.dodoCustomerId } : {}),
          ...(opts?.dodoSubscriptionId
            ? { dodoSubscriptionId: opts.dodoSubscriptionId }
            : previousSubscriptionId
            ? { dodoSubscriptionId: null }
            : {}),
        },
      });
    }

    const referralInfo = updatedPayment
      ? await rewardReferrerIfEligible(tx, updatedPayment.id, existing.userId)
      : null;
    return {
      alreadyFulfilled: false,
      updatedPayment: updatedPayment ?? existing,
      referralInfo,
      previousSubscriptionId,
      nextQuota,
      nextRenewsAt,
    };
  });

  if (result.alreadyFulfilled) {
    return result.updatedPayment;
  }

  if (result.previousSubscriptionId) {
    try {
      await cancelDodoSubscription(result.previousSubscriptionId);
    } catch (err) {
      console.error('[Payments] Failed to auto-cancel previous Dodo subscription on upgrade:', err);
    }
  }

  if (result.referralInfo?.referrerId) {
    const refTitle = 'Free Export Earned!';
    const refBody = `${result.referralInfo.payerName} unlocked a Patra plan. +1 free 3D export was added to your account.`;
    await createInAppNotification(result.referralInfo.referrerId, 'REFERRAL_REWARD', refTitle, refBody);
    if (result.referralInfo.referrerToken) {
      void sendExpoPush(result.referralInfo.referrerToken, refTitle, refBody);
    }
  }

  const payer = await prisma.user.findUnique({ where: { id: existing.userId } });
  if (payer) {
    const title = plan.id === 'SINGLE_PASS' ? 'Export Pass Unlocked' : 'Patra Plan Activated';
    const expiryLabel = result.nextRenewsAt
      ? result.nextRenewsAt.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '';
    const body =
      plan.id === 'SINGLE_PASS'
        ? `Your ${plan.name} (${existing.currency} ${existing.amount}) succeeded. 1 4K export credit is ready.`
        : `Your ${plan.name} is active with ${result.nextQuota} exports ready${expiryLabel ? ` until ${expiryLabel}` : ''}.`;
    await createInAppNotification(
      payer.id,
      plan.id === 'SINGLE_PASS' ? 'PAYMENT_SUCCEEDED' : 'SUBSCRIPTION_ACTIVE',
      title,
      body
    );
    if (payer.expoPushToken) {
      void sendExpoPush(payer.expoPushToken, title, body);
    }
  }

  return result.updatedPayment;
}

async function resolveUserForSubscriptionEvent(data: NonNullable<DodoWebhookEvent['data']>) {
  if (data.subscription_id) {
    const bySub = await prisma.user.findUnique({ where: { dodoSubscriptionId: data.subscription_id } });
    if (bySub) return bySub;
  }
  if (data.metadata?.userId) {
    const byId = await prisma.user.findUnique({ where: { id: data.metadata.userId } });
    if (byId) return byId;
  }
  if (data.customer?.email) {
    return prisma.user.findUnique({ where: { email: data.customer.email.toLowerCase() } });
  }
  return null;
}

paymentsRouter.post('/checkout', requireAuth, async (req: AuthedRequest, res) => {
  const planId = String(req.body?.planId || '') as PlanId;
  const currency = (String(req.body?.currency || 'INR').toUpperCase() === 'USD' ? 'USD' : 'INR') as CurrencyCode;
  const projectId = req.body?.projectId ? String(req.body.projectId) : undefined;
  const returnUrl =
    typeof req.body?.returnUrl === 'string' && /^https?:\/\//i.test(req.body.returnUrl)
      ? req.body.returnUrl
      : undefined;

  const plan = getPlanById(planId);
  if (!plan) return res.status(400).json({ error: 'Invalid pricing plan' });

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const amount = currency === 'INR' ? plan.priceInr : plan.priceUsd;
  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      projectId,
      planId: plan.id,
      amount,
      currency,
      status: 'PENDING',
    },
  });

  const session = await createDodoCheckoutSession({
    paymentId: payment.id,
    planId: plan.id,
    currency,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    projectId,
    returnUrl,
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { dodoSessionId: session.sessionId },
  });

  return res.json({
    paymentId: payment.id,
    mode: session.mode,
    checkoutUrl: session.checkoutUrl,
    amount,
    currency,
  });
});

paymentsRouter.get('/status/:paymentId', requireAuth, async (req: AuthedRequest, res) => {
  const paymentId = String(req.params.paymentId || '');
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, userId: req.userId },
  });
  if (!payment) return res.status(404).json({ error: 'Payment not found' });

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  return res.json({
    status: payment.status,
    planId: payment.planId,
    planName: getPlanById(payment.planId as PlanId)?.name || payment.planId,
    amount: payment.amount,
    currency: payment.currency,
    user: user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          referralCode: user.referralCode,
          exportCredits: user.exportCredits,
          planTier: user.planTier,
          planExportsRemaining: user.planExportsRemaining,
          planRenewsAt: user.planRenewsAt?.toISOString() ?? null,
          autoRenewCancelled: user.autoRenewCancelled,
          createdAt: user.createdAt.toISOString(),
        }
      : null,
  });
});

paymentsRouter.post('/cancel-subscription', requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.planTier === 'NONE') {
    return res.status(400).json({ error: 'No active subscription to cancel' });
  }

  if (user.dodoSubscriptionId) {
    await cancelDodoSubscription(user.dodoSubscriptionId);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { autoRenewCancelled: true },
  });

  const msg =
    'Auto-renewal cancelled. Your remaining exports stay active until the end of your current billing period.';
  await createInAppNotification(user.id, 'SUBSCRIPTION_CANCELLED', 'Auto-Renewal Cancelled', msg);

  return res.json({ ok: true, message: msg });
});

paymentsRouter.post('/dev-confirm', requireAuth, async (req: AuthedRequest, res) => {
  if (process.env.DODO_API_KEY) {
    return res.status(403).json({ error: 'Disabled when live DODO_API_KEY is active' });
  }
  const paymentId = String(req.body?.paymentId || '');
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, userId: req.userId },
  });
  if (!payment) return res.status(404).json({ error: 'Payment not found' });

  const fulfilled = await fulfillInitialPayment(payment.id, {
    dodoPaymentId: `dev_pay_${Date.now()}`,
    dodoSubscriptionId:
      payment.planId !== 'SINGLE_PASS' ? `dev_sub_${Date.now()}` : undefined,
  });
  const user = await prisma.user.findUnique({ where: { id: req.userId } });

  return res.json({ ok: true, payment: fulfilled, user });
});

export async function dodoWebhookHandler(req: Request, res: Response) {
  const rawBody = (req as Request & { rawBody?: string }).rawBody || JSON.stringify(req.body);
  if (!verifyDodoWebhookSignature(rawBody, req.headers)) {
    return res.status(401).json({ error: 'Invalid Dodo webhook signature' });
  }

  const event = req.body as DodoWebhookEvent;
  const eventType = event?.type || '';
  const data = event?.data || {};

  if (eventType === 'payment.succeeded') {
    const paymentId = data.metadata?.paymentId;
    if (paymentId) {
      await fulfillInitialPayment(paymentId, {
        dodoPaymentId: data.payment_id,
        dodoCustomerId: data.customer?.customer_id,
        dodoSubscriptionId: data.subscription_id,
        nextBillingDate: data.next_billing_date,
      });
    }
  } else if (eventType === 'payment.failed') {
    const paymentId = data.metadata?.paymentId;
    if (paymentId) {
      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
      await prisma.payment.updateMany({
        where: { id: paymentId, status: 'PENDING' },
        data: { status: 'FAILED', dodoPaymentId: data.payment_id },
      });
      if (payment) {
        await createInAppNotification(
          payment.userId,
          'PAYMENT_FAILED',
          'Payment Failed',
          `Your ${payment.currency} ${payment.amount} checkout could not be completed. Please try again.`
        );
      }
    }
  } else if (eventType === 'subscription.active') {
    const paymentId = data.metadata?.paymentId;
    if (paymentId) {
      await fulfillInitialPayment(paymentId, {
        dodoPaymentId: data.payment_id,
        dodoCustomerId: data.customer?.customer_id,
        dodoSubscriptionId: data.subscription_id,
        nextBillingDate: data.next_billing_date,
      });
    } else {
      const user = await resolveUserForSubscriptionEvent(data);
      const planId =
        (data.metadata?.planId as PlanId) ||
        (user?.planTier === 'YEARLY_ALL_ACCESS' ? 'YEARLY_ALL_ACCESS' : 'MONTHLY_CREATOR');
      const plan = getPlanById(planId);
      if (user && plan && plan.id !== 'SINGLE_PASS') {
        const recentSucceeded = await prisma.payment.findFirst({
          where: {
            userId: user.id,
            status: 'SUCCEEDED',
            createdAt: { gt: new Date(Date.now() - 10 * 60 * 1000) },
          },
        });
        const alreadyActiveForCycle =
          Boolean(recentSucceeded) ||
          (user.planTier === plan.id &&
            ((user.planRenewsAt && user.planRenewsAt > new Date()) ||
              (Boolean(data.subscription_id) && user.dodoSubscriptionId === data.subscription_id)));

        await prisma.user.update({
          where: { id: user.id },
          data: alreadyActiveForCycle
            ? {
                ...(data.subscription_id && !user.dodoSubscriptionId
                  ? { dodoSubscriptionId: data.subscription_id }
                  : {}),
                ...(data.customer?.customer_id && !user.dodoCustomerId
                  ? { dodoCustomerId: data.customer.customer_id }
                  : {}),
              }
            : {
                planTier: plan.id,
                planExportsRemaining: plan.exportQuota,
                planRenewsAt: getNextRenewalDate(plan.id, data.next_billing_date),
                autoRenewCancelled: false,
                ...(data.subscription_id ? { dodoSubscriptionId: data.subscription_id } : {}),
                ...(data.customer?.customer_id ? { dodoCustomerId: data.customer.customer_id } : {}),
              },
        });
      }
    }
  } else if (eventType === 'subscription.renewed') {
    if (data.payment_id) {
      const alreadyLogged = await prisma.payment.findUnique({
        where: { dodoPaymentId: data.payment_id },
      });
      if (alreadyLogged) {
        return res.json({ received: true, deduplicated: true });
      }
    }

    const user = await resolveUserForSubscriptionEvent(data);
    if (user) {
      const activePlanId: PlanId =
        user.planTier === 'YEARLY_ALL_ACCESS' ? 'YEARLY_ALL_ACCESS' : 'MONTHLY_CREATOR';
      const plan = getPlanById(activePlanId)!;

      const recentPayment = await prisma.payment.findFirst({
        where: {
          userId: user.id,
          planId: activePlanId,
          status: 'SUCCEEDED',
          createdAt: { gt: new Date(Date.now() - 12 * 60 * 60 * 1000) },
        },
      });
      const incomingNextBilling = data.next_billing_date ? new Date(data.next_billing_date) : null;
      const isSameBillingCycle =
        incomingNextBilling &&
        !Number.isNaN(incomingNextBilling.getTime()) &&
        user.planRenewsAt &&
        incomingNextBilling.getTime() - user.planRenewsAt.getTime() < 24 * 60 * 60 * 1000;

      if (recentPayment || isSameBillingCycle) {
        return res.json({ received: true, deduplicated: true });
      }

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: {
            planTier: activePlanId,
            planExportsRemaining: plan.exportQuota,
            planRenewsAt: getNextRenewalDate(activePlanId, data.next_billing_date),
            autoRenewCancelled: false,
          },
        });

        await tx.payment.create({
          data: {
            userId: user.id,
            dodoPaymentId: data.payment_id || `ren_${user.id}_${Date.now()}`,
            planId: activePlanId,
            amount: data.total_amount ?? plan.priceInr,
            currency: data.currency || 'INR',
            status: 'SUCCEEDED',
            referralRewarded: true,
          },
        });
      });

      const title = 'Patra Plan Renewed';
      const body = `Your ${plan.name} renewed. ${plan.exportQuota} fresh 3D video exports are ready!`;
      await createInAppNotification(user.id, 'SUBSCRIPTION_RENEWED', title, body);
      void sendExpoPush(user.expoPushToken, title, body);
    }
  } else if (eventType === 'subscription.on_hold' || eventType === 'subscription.failed') {
    const user = await resolveUserForSubscriptionEvent(data);
    if (user) {
      const title = 'Subscription Payment Issue';
      const body =
        'We could not process your Patra renewal. Please update your payment method to keep your plan active.';
      await createInAppNotification(user.id, 'SUBSCRIPTION_ON_HOLD', title, body);
      void sendExpoPush(user.expoPushToken, title, body);
    }
  } else if (eventType === 'subscription.cancelled') {
    const user = await resolveUserForSubscriptionEvent(data);
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { autoRenewCancelled: true },
      });
      const title = 'Auto-Renewal Cancelled';
      const body =
        'Your Patra subscription will not auto-renew. Your remaining exports stay active until the period ends.';
      await createInAppNotification(user.id, 'SUBSCRIPTION_CANCELLED', title, body);
      void sendExpoPush(user.expoPushToken, title, body);
    }
  } else if (eventType === 'subscription.expired') {
    const user = await resolveUserForSubscriptionEvent(data);
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          planTier: 'NONE',
          planExportsRemaining: 0,
          planRenewsAt: null,
          autoRenewCancelled: false,
          dodoSubscriptionId: null,
        },
      });
      const title = 'Subscription Expired';
      const body =
        'Your Patra subscription period ended. Any single-pass or referral export credits remain in your account.';
      await createInAppNotification(user.id, 'SUBSCRIPTION_EXPIRED', title, body);
      void sendExpoPush(user.expoPushToken, title, body);
    }
  }

  return res.json({ received: true });
}
